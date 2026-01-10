import { Hono } from 'hono';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { candidates, resumes, jobs } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { supabaseAdmin } from '../supabase';
import { getEnv } from '../env';
import { extractTextFromUpload } from '../utils/text';
import { scoreResume } from '../ai/resumeScoring';
import { generateEmbedding } from '../ai/embeddings';
import { badRequest, notFound, internalError, handleValidationError } from '../utils/errors';
import { isValidUuid, validateResumeFile } from '../utils/validation';

const uploadSchema = z.object({
	candidateId: z.string().uuid(),
});

export const resumesRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.post('/upload', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const formData = await c.req.parseBody();
			const candidateId = String(formData.candidateId ?? '');
			uploadSchema.parse({ candidateId });

			const file = formData.file;
			if (!(file instanceof File)) {
				return badRequest(c, 'Missing file field');
			}

			try {
				validateResumeFile(file);
			} catch (validationError) {
				if (validationError instanceof Error) {
					return badRequest(c, validationError.message);
				}
				return badRequest(c, 'Invalid file');
			}

			// Fetch candidate with job data (parallel optimization)
			const [candidateData] = await db
				.select({
					candidate: candidates,
					job: jobs,
				})
				.from(candidates)
				.leftJoin(jobs, eq(candidates.jobId, jobs.id))
				.where(eq(candidates.id, candidateId));

			if (!candidateData?.candidate) {
				return notFound(c, 'Candidate');
			}

			const { candidate, job } = candidateData;

			console.log('📋 Candidate with job:', {
				candidateId: candidate.id,
				jobId: job?.id,
				jobTitle: job?.title,
				requiredSkills: job?.requiredSkills,
			});

			const text = await extractTextFromUpload(file);

			// Upload to storage
			const env = getEnv();
			const path = `${candidateId}/${crypto.randomUUID()}/${file.name}`;
			const bytes = new Uint8Array(await file.arrayBuffer());

			const { error: uploadError } = await supabaseAdmin.storage
				.from(env.SUPABASE_RESUME_BUCKET)
				.upload(path, bytes, { contentType: file.type || 'application/octet-stream', upsert: true });

			if (uploadError) {
				console.error('[STORAGE] Upload failed:', uploadError);
				return internalError(c, uploadError, 'Failed to upload file');
			}

			const url = supabaseAdmin.storage.from(env.SUPABASE_RESUME_BUCKET).getPublicUrl(path).data.publicUrl;

			// Auto-score using job requirements
			let scoringResult = null;
			if (job?.requiredSkills && job.requiredSkills.length > 0) {
				try {
					scoringResult = await scoreResume({
						jobRole: job.title,
						requiredSkills: job.requiredSkills,
						resumeText: text,
					});
					console.log('✅ Auto-scored resume:', scoringResult);
				} catch (scoreError) {
					console.error('⚠️ Scoring failed:', scoreError);
					// Continue without score - don't fail the upload
				}
			} else {
				console.warn('⚠️ No job skills defined - skipping scoring');
			}

			// Generate embedding for the resume text
			const embedding = await generateEmbedding(text);

			// Insert resume with auto-generated score
			const [resume] = await db
				.insert(resumes)
				.values({
					candidateId,
					extractedText: text,
					fileUrl: url,
					aiScore: scoringResult?.score ? Math.round(scoringResult.score) : null,
					parsedSkills: scoringResult
						? {
								matched_skills: scoringResult.matched_skills,
								missing_skills: scoringResult.missing_skills,
								reason: scoringResult.reason,
						  }
						: null,
					embeddingId: JSON.stringify(embedding),
				})
				.returning();

			if (!resume) {
				return internalError(c, 'Insert failed', 'Failed to create resume');
			}

			return c.json({ resume, scoring: scoringResult }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to upload resume');
		}
	})
	.get('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const list = await db
				.select()
				.from(resumes)
				.orderBy(desc(resumes.createdAt))
				.limit(50);

			return c.json({ resumes: list });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch resumes');
		}
	})
	.get('/:candidateId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const candidateId = c.req.param('candidateId');

		if (!isValidUuid(candidateId)) {
			return badRequest(c, 'Invalid candidate ID');
		}

		try {
			const list = await db
				.select()
				.from(resumes)
				.where(eq(resumes.candidateId, candidateId))
				.orderBy(desc(resumes.createdAt));

			return c.json({ resumes: list });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch resumes');
		}
	})
	.delete('/:id', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid resume ID');
		}

		try {
			const [resume] = await db.select().from(resumes).where(eq(resumes.id, id)).limit(1);
			
			if (!resume) {
				return notFound(c, 'Resume');
			}

			if (resume.fileUrl) {
				const env = getEnv();
				const urlParts = resume.fileUrl.split('/');
				const pathIndex = urlParts.findIndex(part => part === env.SUPABASE_RESUME_BUCKET);
				
				if (pathIndex !== -1) {
					const filePath = urlParts.slice(pathIndex + 1).join('/');
					await supabaseAdmin.storage.from(env.SUPABASE_RESUME_BUCKET).remove([filePath]);
				}
			}

			await db.delete(resumes).where(eq(resumes.id, id));

			return c.json({ success: true }, 200);
		} catch (error) {
			return internalError(c, error, 'Failed to delete resume');
		}
	});
