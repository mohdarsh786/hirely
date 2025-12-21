import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { candidates, interviews, type TranscriptEntry } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { evaluateAnswer, generateNextQuestion } from '../ai/interviewChain';
import { badRequest, notFound, internalError, handleValidationError } from '../utils/errors';
import { isValidUuid } from '../utils/validation';

const startSchema = z.object({
	role: z.string().min(1).max(255).optional(),
});

const answerSchema = z.object({
	answer: z.string().min(1),
});

export const interviewsRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.get('/', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const allInterviews = await db.select().from(interviews);
			return c.json({ interviews: allInterviews });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch interviews');
		}
	})
	.get('/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
			if (!interview) {
				return notFound(c, 'Interview');
			}
			
			return c.json({ interview });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch interview');
		}
	})
	.delete('/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
			if (!interview) {
				return notFound(c, 'Interview');
			}

			await db.delete(interviews).where(eq(interviews.id, interviewId));
			return c.json({ success: true });
		} catch (error) {
			return internalError(c, error, 'Failed to delete interview');
		}
	})
	.post('/start/:candidateId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const candidateId = c.req.param('candidateId');
		
		if (!isValidUuid(candidateId)) {
			return badRequest(c, 'Invalid candidate ID');
		}

		try {
			const body = await c.req.json().catch(() => ({}));
			const data = startSchema.parse(body);

			const [candidate] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			const role = data.role ?? candidate.appliedRole ?? 'Unknown role';
			const question = await generateNextQuestion({ role, previousAnswers: [] });

			const transcript: TranscriptEntry[] = [
				{ type: 'question', text: question, at: new Date().toISOString() }
			];

			const [interview] = await db
				.insert(interviews)
				.values({ candidateId, transcript, scores: { perQuestion: [] } })
				.returning();

			if (!interview) {
				return internalError(c, 'Insert failed', 'Failed to start interview');
			}

			return c.json({ interviewId: interview.id, question });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to start interview');
		}
	})
	.post('/answer/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const body = await c.req.json();
			const data = answerSchema.parse(body);

			const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
			if (!interview) {
				return notFound(c, 'Interview');
			}

			let lastQuestion: string | null = null;
			for (let i = interview.transcript.length - 1; i >= 0; i--) {
				const entry = interview.transcript[i];
				if (entry && entry.type === 'question') {
					lastQuestion = entry.text;
					break;
				}
			}

			if (!lastQuestion) {
				return badRequest(c, 'No question found to answer');
			}

			const evaluation = await evaluateAnswer({ question: lastQuestion, answer: data.answer });

			const [candidate] = await db.select().from(candidates).where(eq(candidates.id, interview.candidateId));
			const role = candidate?.appliedRole ?? 'Unknown role';

			const previousAnswers = interview.transcript
				.filter((e) => e.type === 'answer')
				.map((e) => e.text);

			const nextQuestion = await generateNextQuestion({
				role,
				previousAnswers: [...previousAnswers, data.answer],
			});

			const now = new Date().toISOString();
			const transcript: TranscriptEntry[] = [
				...interview.transcript,
				{ type: 'answer', text: data.answer, at: now },
				{ type: 'eval', score: evaluation.score, feedback: evaluation.feedback, at: now },
				{ type: 'question', text: nextQuestion, at: now },
			];

			const scores = [...(interview.scores?.perQuestion ?? []), evaluation.score];
			const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
			const rating = Math.round((avg / 10) * 100);

			const [updated] = await db
				.update(interviews)
				.set({
					transcript,
					scores: { perQuestion: scores },
					finalRating: rating,
					aiFeedback: evaluation.feedback,
				})
				.where(eq(interviews.id, interviewId))
				.returning();

			return c.json({ 
				interview: updated, 
				evaluation, 
				question: nextQuestion,  // Also include as top-level for convenience
				nextQuestion 
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to process answer');
		}
	})
	.get('/result/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
			if (!interview) {
				return notFound(c, 'Interview');
			}
			
			return c.json({ interview });
		} catch (error) {
			return internalError(c, error, 'Failed to fetch interview result');
		}
	})
	.post('/finalize/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
			if (!interview) {
				return notFound(c, 'Interview');
			}

			// Interview is already finalized by the last answer submission
			// Just return the current state with proper structure
			return c.json({ 
				interview,
				finalRating: interview.finalRating || 0,
				feedback: interview.aiFeedback || 'No feedback available'
			});
		} catch (error) {
			return internalError(c, error, 'Failed to finalize interview');
		}
	})
	.post('/complete/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		// Alias for /finalize - same functionality
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const [interview] = await db.select().from(interviews).where(eq(interviews.id, interviewId));
			if (!interview) {
				return notFound(c, 'Interview');
			}

			// Return the completed interview with proper structure
			return c.json({ 
				interview,
				finalRating: interview.finalRating || 0,
				feedback: interview.aiFeedback || 'No feedback available',
				transcript: interview.transcript
			});
		} catch (error) {
			return internalError(c, error, 'Failed to finalize interview');
		}
	});
