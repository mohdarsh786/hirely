import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client';
import { candidates, resumes, interviews } from '../db/schema';
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
});

export const candidatesRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.post('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const body = await c.req.json();
			const data = createSchema.parse(body);
			const user = c.get('user');

			const [candidate] = await db
				.insert(candidates)
				.values({
					name: data.name,
					email: data.email ?? null,
					experienceYears: data.experienceYears ?? null,
					appliedRole: data.appliedRole ?? null,
					createdBy: user.id,
				})
				.returning();

			if (!candidate) {
				return internalError(c, 'Insert failed', 'Failed to create candidate');
			}

			return c.json({ candidate }, 201);
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
				.select()
				.from(candidates)
				.orderBy(desc(candidates.createdAt));
			
			return c.json({ candidates: list });
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
			const [candidate] = await db
				.select()
				.from(candidates)
				.where(eq(candidates.id, id));
			
			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			const [candidateResumes, candidateInterviews] = await Promise.all([
				db.select().from(resumes).where(eq(resumes.candidateId, id)).orderBy(desc(resumes.createdAt)),
				db.select().from(interviews).where(eq(interviews.candidateId, id)).orderBy(desc(interviews.createdAt)),
			]);

			return c.json({ candidate, resumes: candidateResumes, interviews: candidateInterviews });
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
