import { Hono } from 'hono';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { candidates, resumes } from '../db/schema';
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

const processSchema = z.object({
	jobRole: z.string().min(1).max(255).optional(),
	requiredSkills: z.array(z.string().min(1)).min(1),
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

			const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			const text = await extractTextFromUpload(file);

			const [resume] = await db.insert(resumes).values({ candidateId, extractedText: text }).returning();
			if (!resume) {
				return internalError(c, 'Insert failed', 'Failed to create resume');
			}

			const env = getEnv();
			const path = `${candidateId}/${resume.id}/${file.name}`;
			const bytes = new Uint8Array(await file.arrayBuffer());

			const { error: uploadError } = await supabaseAdmin.storage
				.from(env.SUPABASE_RESUME_BUCKET)
				.upload(path, bytes, { contentType: file.type || 'application/octet-stream', upsert: true });

			if (uploadError) {
				console.error('[STORAGE] Upload failed:', uploadError);
				return internalError(c, uploadError, 'Failed to upload file');
			}

			const url = supabaseAdmin.storage.from(env.SUPABASE_RESUME_BUCKET).getPublicUrl(path).data.publicUrl;

			const [updated] = await db.update(resumes).set({ fileUrl: url }).where(eq(resumes.id, resume.id)).returning();

			return c.json({ resume: updated }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to upload resume');
		}
	})
	.post('/process/:candidateId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const candidateId = c.req.param('candidateId');

		if (!isValidUuid(candidateId)) {
			return badRequest(c, 'Invalid candidate ID');
		}

		try {
			const body = await c.req.json();
			const data = processSchema.parse(body);

			const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			const [latest] = await db
				.select()
				.from(resumes)
				.where(eq(resumes.candidateId, candidateId))
				.orderBy(desc(resumes.createdAt))
				.limit(1);

			if (!latest) {
				return notFound(c, 'Resume');
			}

			if (!latest.extractedText) {
				return badRequest(c, 'Resume has no text content');
			}

			const result = await scoreResume({
				jobRole: data.jobRole ?? candidate.appliedRole ?? 'Unknown',
				requiredSkills: data.requiredSkills,
				resumeText: latest.extractedText,
			});

			// Generate embedding for the resume text
			const embedding = await generateEmbedding(latest.extractedText);

			const [updated] = await db
				.update(resumes)
				.set({
					aiScore: Math.round(result.score),
					parsedSkills: {
						matched_skills: result.matched_skills,
						missing_skills: result.missing_skills,
						reason: result.reason,
					},
					embeddingId: JSON.stringify(embedding) // Store as JSON string
				})
				.where(eq(resumes.id, latest.id))
				.returning();

			return c.json({ resume: updated, scoring: result });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to process resume');
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
