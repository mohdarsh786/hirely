import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { db } from '../db/client';
import { jobs, batchUploads, candidates, resumes } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { badRequest, notFound, internalError, handleValidationError } from '../utils/errors';
import { isValidUuid } from '../utils/validation';
import { eq, desc, and, inArray } from 'drizzle-orm';
import { startBatch, getBatchProgress } from '../services/batchService';

const quickJobSchema = z.object({
	title: z.string().min(1).max(255),
	requiredSkills: z.array(z.string().min(1)).min(1),
	description: z.string().optional(),
});

export const batchResumesRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)

	.post('/upload', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const formData = await c.req.parseBody({ all: true });
			const user = c.get('user');

			if (!user.organizationId) {
				return badRequest(c, 'Please complete organization setup first');
			}

			const jobId = String(formData.jobId ?? '');
			const files = formData.files;

			if (!jobId || !isValidUuid(jobId)) {
				return badRequest(c, 'Invalid job ID');
			}

			const fileList: File[] = [];
			if (Array.isArray(files)) {
				for (const f of files) {
					if (f instanceof File) fileList.push(f);
				}
			} else if (files instanceof File) {
				fileList.push(files);
			}

			if (fileList.length === 0) {
				return badRequest(c, 'No files provided');
			}

			if (fileList.length > 20) {
				return badRequest(c, 'Maximum 20 files allowed');
			}

			for (const file of fileList) {
				if (!file.name.toLowerCase().endsWith('.pdf')) {
					return badRequest(c, `Invalid file: ${file.name}. PDF only.`);
				}
			}

			const [job] = await db
				.select()
				.from(jobs)
				.where(and(eq(jobs.id, jobId), eq(jobs.organizationId, user.organizationId)));

			if (!job) {
				return notFound(c, 'Job');
			}

			const batchId = await startBatch(
				fileList,
				{ id: job.id, title: job.title, requiredSkills: job.requiredSkills || [] },
				user.organizationId,
				user.id
			);

			return c.json({ batchId, totalFiles: fileList.length }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to start batch');
		}
	})

	.post('/quick-job', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		console.log('[BATCH] Quick job creation started');
		try {
			const body = await c.req.json();
			console.log('[BATCH] Quick job body parsed', body);
			const data = quickJobSchema.parse(body);
			const user = c.get('user');
			console.log('[BATCH] Quick job user', user.id, user.role);

			if (!user.organizationId) {
				return badRequest(c, 'Please complete organization setup first');
			}

			const [job] = await db
				.insert(jobs)
				.values({
					...data,
					organizationId: user.organizationId,
					createdBy: user.id,
				})
				.returning();

			if (!job) {
				return internalError(c, 'Insert failed', 'Failed to create job');
			}

			return c.json({ job }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to create job');
		}
	})

	.get('/history', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const user = c.get('user');

			if (!user.organizationId) {
				return c.json({ batches: [] });
			}

			try {
				const batches = await db
					.select()
					.from(batchUploads)
					.where(eq(batchUploads.organizationId, user.organizationId))
					.orderBy(desc(batchUploads.createdAt))
					.limit(20);

				const batchesWithJobs = await Promise.all(
					batches.map(async (batch) => {
						const [job] = await db.select().from(jobs).where(eq(jobs.id, batch.jobId));
						return { ...batch, job };
					})
				);

				return c.json({ batches: batchesWithJobs });
			} catch {
				// Table might not exist yet
				return c.json({ batches: [] });
			}
		} catch (error) {
			return internalError(c, error, 'Failed to fetch history');
		}
	})

	.get('/:id/status', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const batchId = c.req.param('id');

		if (!isValidUuid(batchId)) {
			return badRequest(c, 'Invalid batch ID');
		}

		const progress = getBatchProgress(batchId);
		if (!progress) {
			return notFound(c, 'Batch');
		}

		return streamSSE(c, async (stream) => {
			let lastProcessed = -1;

			while (true) {
				const current = getBatchProgress(batchId);
				if (!current) {
					await stream.writeSSE({ 
						data: JSON.stringify({ type: 'error', message: 'Batch not found' }), 
						event: 'error' 
					});
					break;
				}

				if (current.processed !== lastProcessed) {
					lastProcessed = current.processed;
					await stream.writeSSE({
						data: JSON.stringify({
							type: 'progress',
							processed: current.processed,
							total: current.total,
							status: current.status,
							candidates: current.candidates,
						}),
						event: 'progress',
					});
				}

				if (current.status === 'completed' || current.status === 'failed') {
					await stream.writeSSE({
						data: JSON.stringify({
							type: 'complete',
							status: current.status,
							candidates: current.candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
						}),
						event: 'complete',
					});
					break;
				}

				await new Promise(r => setTimeout(r, 500));
			}
		});
	})

	.get('/:id/results', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const batchId = c.req.param('id');

		if (!isValidUuid(batchId)) {
			return badRequest(c, 'Invalid batch ID');
		}

		const user = c.get('user');
		
		const [batch] = await db
			.select()
			.from(batchUploads)
			.where(and(
				eq(batchUploads.id, batchId),
				eq(batchUploads.organizationId, user.organizationId!)
			));

		if (!batch) {
			return notFound(c, 'Batch');
		}

		const candidateIds = batch.candidateIds || [];
		let candidateList: any[] = [];

		if (candidateIds.length > 0) {
			const candidateData = await db
				.select()
				.from(candidates)
				.where(inArray(candidates.id, candidateIds));

			const resumeData = await db
				.select()
				.from(resumes)
				.where(inArray(resumes.candidateId, candidateIds));

			candidateList = candidateData.map(c => {
				const resume = resumeData.find(r => r.candidateId === c.id);
				return {
					id: c.id,
					name: c.name,
					email: c.email,
					score: resume?.aiScore ?? null,
					matchedSkills: resume?.parsedSkills?.matched_skills || [],
					missingSkills: resume?.parsedSkills?.missing_skills || [],
					reason: resume?.parsedSkills?.reason || '',
					status: 'completed',
				};
			}).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
		}

		return c.json({
			batchId,
			status: batch.status,
			totalFiles: batch.totalFiles,
			processedCount: batch.processedCount,
			candidates: candidateList,
		});
	});
