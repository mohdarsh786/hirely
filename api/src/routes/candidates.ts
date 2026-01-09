import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client';
import { candidates, resumes, interviews, jobs } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { eq, desc } from 'drizzle-orm';
import { badRequest, notFound, internalError, handleValidationError } from '../utils/errors';
import { isValidUuid } from '../utils/validation';

const createSchema = z.object({
	name: z.string().min(1).max(255),
	email: z.string().email().optional(),
	experienceYears: z.number().int().min(0).optional(),
	appliedRole: z.string().min(1).max(255).optional(),
	jobId: z.string().uuid().optional(), // Optional - can be null for ad-hoc interviews
});

export const candidatesRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.post('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const body = await c.req.json();
			const data = createSchema.parse(body);
			const user = c.get('user');

			if (!user.organizationId) {
				return badRequest(c, 'User must belong to an organization');
			}

			let job = null;
			let appliedRole = data.appliedRole || null;

			// If jobId provided, verify job exists and belongs to organization
			if (data.jobId) {
				const [jobData] = await db.select().from(jobs).where(eq(jobs.id, data.jobId));

				if (!jobData || jobData.organizationId !== user.organizationId) {
					return badRequest(c, 'Invalid job ID');
				}

				job = jobData;
				appliedRole = job.title; // Auto-populate from job
			}

			const [candidate] = await db
				.insert(candidates)
				.values({
					name: data.name,
					email: data.email ?? null,
					experienceYears: data.experienceYears ?? null,
					jobId: data.jobId ?? null,
					appliedRole: appliedRole,
					organizationId: user.organizationId,
					createdBy: user.id,
				})
				.returning();

			if (!candidate) {
				return internalError(c, 'Insert failed', 'Failed to create candidate');
			}

			return c.json({ candidate, job }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to create candidate');
		}
	})
	.get('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const list = await db
				.select({
					candidate: candidates,
					job: jobs,
				})
				.from(candidates)
				.leftJoin(jobs, eq(candidates.jobId, jobs.id))
				.orderBy(desc(candidates.createdAt));

			return c.json({
				candidates: list.map((row) => ({
					...row.candidate,
					job: row.job,
				})),
			});
		} catch (error) {
			return internalError(c, error, 'Failed to fetch candidates');
		}
	})
	.get('/:id', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const id = c.req.param('id');
		
		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid candidate ID');
		}

		try {
			const [candidateData] = await db
				.select({
					candidate: candidates,
					job: jobs,
				})
				.from(candidates)
				.leftJoin(jobs, eq(candidates.jobId, jobs.id))
				.where(eq(candidates.id, id));
			
			if (!candidateData) {
				return notFound(c, 'Candidate');
			}

			const [candidateResumes, candidateInterviews] = await Promise.all([
				db.select().from(resumes).where(eq(resumes.candidateId, id)).orderBy(desc(resumes.createdAt)),
				db.select().from(interviews).where(eq(interviews.candidateId, id)).orderBy(desc(interviews.createdAt)),
			]);

			return c.json({
				candidate: candidateData.candidate,
				job: candidateData.job,
				resumes: candidateResumes,
				interviews: candidateInterviews,
			});
		} catch (error) {
			return internalError(c, error, 'Failed to fetch candidate');
		}
	})
	.delete('/:id', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const id = c.req.param('id');
		
		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid candidate ID');
		}

		try {
			const deleted = await db
				.delete(candidates)
				.where(eq(candidates.id, id))
				.returning();

			if (deleted.length === 0) {
				return notFound(c, 'Candidate');
			}

			return c.json({ success: true });
		} catch (error) {
			return internalError(c, error, 'Failed to delete candidate');
		}
	});
