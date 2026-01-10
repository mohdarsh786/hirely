import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client';
import { jobs } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { eq, desc, and } from 'drizzle-orm';
import { badRequest, notFound, internalError, handleValidationError } from '../utils/errors';
import { isValidUuid } from '../utils/validation';

const createJobSchema = z.object({
	title: z.string().min(1).max(255),
	description: z.string().optional(),
	requiredSkills: z.array(z.string().min(1)).min(1),
	experienceYears: z.number().int().min(0).optional(),
	status: z.enum(['active', 'closed', 'draft']).default('active'),
});

const updateJobSchema = createJobSchema.partial();

export const jobsRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)

	// Create new job
	.post('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const body = await c.req.json();
			const data = createJobSchema.parse(body);
			const user = c.get('user');

			if (!user.organizationId) {
				return badRequest(c, 'Please complete organization setup before creating jobs');
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

	// Get all jobs for organization
	.get('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const user = c.get('user');

			if (!user.organizationId) {
				// Return empty array if user hasn't completed org setup yet
				return c.json({ jobs: [] });
			}

			const list = await db
				.select()
				.from(jobs)
				.where(eq(jobs.organizationId, user.organizationId))
				.orderBy(desc(jobs.createdAt));

			return c.json({ jobs: list });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch jobs');
		}
	})

	// Get single job
	.get('/:id', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid job ID');
		}

		try {
			const user = c.get('user');

			if (!user.organizationId) {
				return badRequest(c, 'User must belong to an organization');
			}

			const [job] = await db
				.select()
				.from(jobs)
				.where(and(eq(jobs.id, id), eq(jobs.organizationId, user.organizationId)));

			if (!job) {
				return notFound(c, 'Job');
			}

			return c.json({ job });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch job');
		}
	})

	// Get skills for a job by title (for inference/verification)
	.get('/skills/by-title/:title', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const title = decodeURIComponent(c.req.param('title'));

		try {
			const user = c.get('user');

			if (!user.organizationId) {
				return c.json({ skills: [] });
			}

			const [job] = await db
				.select()
				.from(jobs)
				.where(
					and(
						eq(jobs.title, title),
						eq(jobs.organizationId, user.organizationId),
						eq(jobs.status, 'active')
					)
				)
				.limit(1);

			if (!job) {
				return c.json({ skills: [] });
			}

			return c.json({ skills: job.requiredSkills || [] });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch job skills');
		}
	})

	// Update job
	.patch('/:id', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid job ID');
		}

		try {
			const body = await c.req.json();
			const data = updateJobSchema.parse(body);
			const user = c.get('user');

			if (!user.organizationId) {
				return badRequest(c, 'User must belong to an organization');
			}

			const [updated] = await db
				.update(jobs)
				.set({ ...data, updatedAt: new Date() })
				.where(and(eq(jobs.id, id), eq(jobs.organizationId, user.organizationId)))
				.returning();

			if (!updated) {
				return notFound(c, 'Job');
			}

			return c.json({ job: updated });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to update job');
		}
	})

	// Delete job
	.delete('/:id', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid job ID');
		}

		try {
			const user = c.get('user');

			if (!user.organizationId) {
				return badRequest(c, 'User must belong to an organization');
			}

			const deleted = await db
				.delete(jobs)
				.where(and(eq(jobs.id, id), eq(jobs.organizationId, user.organizationId)))
				.returning();

			if (deleted.length === 0) {
				return notFound(c, 'Job');
			}

			return c.json({ success: true });
		} catch (error) {
			return internalError(c, error, 'Failed to delete job');
		}
	});
