import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../db/client';
import { candidates, interviews, jobs, resumes, type TranscriptEntry } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { evaluateAnswer, generateNextQuestion, generateInterviewQuestions } from '../ai/interviewChain';
import { badRequest, notFound, internalError, handleValidationError } from '../utils/errors';
import { isValidUuid } from '../utils/validation';
import { sendEmail, sendInterviewCompletionEmail, sendInterviewInvitation, sendShortlistEmail, sendRejectionEmail } from '../services/mail';
import crypto from 'crypto';

const createInterviewSchema = z.object({
	candidateId: z.string().uuid(),
	scheduledAt: z.string().datetime(),
	durationMinutes: z.number().int().min(15).max(120).optional().default(30),
});

const startSchema = z.object({
	role: z.string().min(1).max(255).optional(),
});

const answerSchema = z.object({
	answer: z.string().min(1),
});

export const interviewsRoutes = new Hono<{ Variables: AppVariables }>()
	// PUBLIC ROUTES - No auth required (must come before .use('*', authMiddleware))
	// Get interview by token (public access for candidates)
	.get('/token/:token', async (c) => {
		const token = c.req.param('token');

		try {
			const [interview] = await db
				.select()
				.from(interviews)
				.where(eq(interviews.token, token));

			if (!interview) {
				return notFound(c, 'Interview');
			}

			const [candidate] = await db
				.select()
				.from(candidates)
				.where(eq(candidates.id, interview.candidateId));

			return c.json({ 
				interview, 
				candidate,
				questions: interview.questions || [] 
			});
		} catch (error) {
			return internalError(c, error, 'Failed to fetch interview');
		}
	})
	// Start interview - generate questions and update status
	.post('/:id/start', async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			// Fetch interview with candidate and job data
			const [interviewData] = await db
				.select({
					interview: interviews,
					candidate: candidates,
					job: jobs,
				})
				.from(interviews)
				.leftJoin(candidates, eq(interviews.candidateId, candidates.id))
				.leftJoin(jobs, eq(candidates.jobId, jobs.id))
				.where(eq(interviews.id, id));

			if (!interviewData || !interviewData.interview) {
				return notFound(c, 'Interview');
			}

			const { interview, candidate, job } = interviewData;

			// Check if already started
			if (interview.status !== 'scheduled') {
				return c.json({ 
					interview, 
					questions: interview.questions || [] 
				});
			}

			// Fetch candidate's resume
			const [resume] = await db
				.select()
				.from(resumes)
				.where(eq(resumes.candidateId, candidate!.id))
				.orderBy(desc(resumes.createdAt))
				.limit(1);

			// Generate questions based on job and resume
			const questions = await generateInterviewQuestions({
				jobRole: job?.title || candidate!.appliedRole || 'General',
				requiredSkills: job?.requiredSkills || [],
				resumeText: resume?.extractedText || '',
				numberOfQuestions: 10,
			});

			// Update interview status and save questions
			const [updated] = await db
				.update(interviews)
				.set({ 
					status: 'in_progress',
					questions: questions,
					startedAt: new Date(),
				})
				.where(eq(interviews.id, id))
				.returning();

			return c.json({ interview: updated, questions });
		} catch (error) {
			console.error('Failed to start interview:', error);
			return internalError(c, error, 'Failed to start interview');
		}
	})
	// Submit answer to a question
	.post('/:id/answer', async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const body = await c.req.json();
			const { questionId, answer: answerText } = z.object({
				questionId: z.string(),
				answer: z.string().min(1),
			}).parse(body);

			const [interview] = await db
				.select()
				.from(interviews)
				.where(eq(interviews.id, id));

			if (!interview) {
				return notFound(c, 'Interview');
			}

			// Find the question
			const questions = interview.questions as any[] || [];
			const question = questions.find((q: any) => q.id === questionId);

			if (!question) {
				return badRequest(c, 'Question not found');
			}

			// Score the answer using AI
			const evaluation = await evaluateAnswer({
				question: question.question,
				answer: answerText,
			});

			// Save answer
			const answers = interview.answers as any[] || [];
			answers.push({
				questionId,
				question: question.question,
				answer: answerText,
				score: evaluation.score * 10, // Convert to 0-100 scale
				feedback: evaluation.feedback,
				timestamp: new Date().toISOString(),
			});

			await db
				.update(interviews)
				.set({ answers })
				.where(eq(interviews.id, id));

			return c.json({ 
				success: true, 
				score: evaluation.score * 10,
				feedback: evaluation.feedback 
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to submit answer');
		}
	})
	// Complete interview
	.post('/:id/complete', async (c) => {
		const id = c.req.param('id');

		if (!isValidUuid(id)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const [interview] = await db
				.select()
				.from(interviews)
				.where(eq(interviews.id, id));

			if (!interview) {
				return notFound(c, 'Interview');
			}

			// Calculate final rating from answers
			const answers = interview.answers as any[] || [];
			const avgScore = answers.length > 0
				? Math.round(answers.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / answers.length)
				: 0;

			const [updated] = await db
				.update(interviews)
				.set({ 
					status: 'completed',
					completedAt: new Date(),
					finalRating: avgScore,
				})
				.where(eq(interviews.id, id))
				.returning();

			return c.json({ success: true, interview: updated });
		} catch (error) {
			return internalError(c, error, 'Failed to complete interview');
		}
	})
	// PROTECTED ROUTES - Auth required
	.use('*', authMiddleware)
	.post('/create', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			const body = await c.req.json();
			const data = createInterviewSchema.parse(body);

			// Verify candidate exists
			const [candidate] = await db.select().from(candidates).where(eq(candidates.id, data.candidateId));
			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			// Generate unique token for candidate access
			const token = crypto.randomBytes(32).toString('hex');

			const [interview] = await db
				.insert(interviews)
				.values({
					candidateId: data.candidateId,
					scheduledAt: new Date(data.scheduledAt),
					durationMinutes: data.durationMinutes,
					token,
					status: 'scheduled',
					transcript: [],
					scores: { perQuestion: [] },
				})
				.returning();

			if (!interview) {
				return internalError(c, 'Insert failed', 'Failed to create interview');
			}

			// Send email to candidate with interview link
			if (candidate.email && candidate.name) {
				sendInterviewInvitation(
					candidate.name,
					candidate.email,
					candidate.appliedRole || 'Position',
					new Date(data.scheduledAt),
					data.durationMinutes,
					token
				).catch(err => console.error('[Interview] Failed to send invitation email:', err));
			}

			return c.json({ interview }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to create interview');
		}
	})
	.post('/:interviewId/send-invite', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			// Get interview details
			const [interview] = await db
				.select()
				.from(interviews)
				.where(eq(interviews.id, interviewId));

			if (!interview) {
				return notFound(c, 'Interview');
			}

			// Get candidate details
			const [candidate] = await db
				.select()
				.from(candidates)
				.where(eq(candidates.id, interview.candidateId));

			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			if (!candidate.email || !candidate.name) {
				return badRequest(c, 'Candidate does not have email or name');
			}

			// Send invitation email
			await sendInterviewInvitation(
				candidate.name,
				candidate.email,
				candidate.appliedRole || 'Position',
				interview.scheduledAt || new Date(),
				interview.durationMinutes || 30,
				interview.token
			);

			return c.json({ 
				success: true,
				message: `Interview invitation sent to ${candidate.email}` 
			});
		} catch (error) {
			return internalError(c, error, 'Failed to send interview invitation');
		}
	})
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

			// Fetch candidate with job and resume information
			const [candidate] = await db
				.select({
					candidate: candidates,
					job: jobs,
				})
				.from(candidates)
				.leftJoin(jobs, eq(candidates.jobId, jobs.id))
				.where(eq(candidates.id, candidateId));

			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			// Fetch candidate's resume
			const [resume] = await db
				.select()
				.from(resumes)
				.where(eq(resumes.candidateId, candidateId))
				.orderBy(desc(resumes.createdAt))
				.limit(1);

			// Get role and job requirements
			const role = data.role ?? candidate.candidate.appliedRole ?? candidate.job?.title ?? 'General';
			const jobRequirements = candidate.job?.requiredSkills || [];

			// Generate all interview questions based on job role and requirements
			const questions = await generateInterviewQuestions({
				jobRole: role,
				requiredSkills: jobRequirements,
				resumeText: resume?.extractedText || '',
				numberOfQuestions: 10,
			});

			// Get first question for immediate display
			const firstQuestion = questions[0]?.question || 'Tell me about yourself and your experience.';

			const transcript: TranscriptEntry[] = [
				{ type: 'question', text: firstQuestion, at: new Date().toISOString() }
			];

			const [interview] = await db
				.insert(interviews)
				.values({ 
					candidateId, 
					transcript, 
					questions: questions,
					scores: { perQuestion: [] },
					status: 'in_progress',
					startedAt: new Date(),
				})
				.returning();

			if (!interview) {
				return internalError(c, 'Insert failed', 'Failed to start interview');
			}

			return c.json({ interviewId: interview.id, question: firstQuestion });
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to start interview');
		}
	})
	.post('/answer/:interviewId', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		const startTime = Date.now();
		
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

			// Get pre-generated questions
			const questions = interview.questions as any[] || [];
			const answers = interview.answers as any[] || [];
			const currentQuestionIndex = answers.length;

			// Validate we have a current question
			if (currentQuestionIndex >= questions.length) {
				return badRequest(c, 'No more questions available');
			}

			const currentQuestion = questions[currentQuestionIndex];

			console.log(`[Interview] Starting AI evaluation for interview ${interviewId}...`);
			const evalStart = Date.now();
			
			// Score the answer using AI
			const evaluation = await evaluateAnswer({ 
				question: currentQuestion.question, 
				answer: data.answer 
			});
			
			console.log(`[Interview] AI evaluation completed in ${Date.now() - evalStart}ms`);

			// Save answer
			answers.push({
				questionId: currentQuestion.id,
				question: currentQuestion.question,
				answer: data.answer,
				score: evaluation.score * 10, // Convert to 0-100 scale
				feedback: evaluation.feedback,
				timestamp: new Date().toISOString(),
			});

			// Get next question if available
			const nextQuestionIndex = currentQuestionIndex + 1;
			const nextQuestion = nextQuestionIndex < questions.length 
				? questions[nextQuestionIndex].question 
				: null;

			// Calculate average score only if all questions answered
			const isComplete = nextQuestion === null;
			let finalRating = null;
			let aiFeedback = evaluation.feedback;

			if (isComplete) {
				const scores = answers.map((a: any) => a.score);
				const avgScore = scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length;
				finalRating = Math.round(avgScore);
			}

			// Update interview with answer
			const [updated] = await db
				.update(interviews)
				.set({
					answers,
					...(isComplete && { 
						finalRating, 
						aiFeedback,
						status: 'completed',
						completedAt: new Date()
					}),
				})
				.where(eq(interviews.id, interviewId))
				.returning();

			// Send completion email if interview is complete
			if (isComplete && updated) {
				// Get candidate details
				const [candidate] = await db
					.select()
					.from(candidates)
					.where(eq(candidates.id, updated.candidateId));

				if (candidate?.email && candidate?.name) {
					// Send email asynchronously (don't wait for it)
					sendInterviewCompletionEmail(
						candidate.name,
						candidate.email,
						candidate.appliedRole || 'Position',
						finalRating || 0
					).catch(err => console.error('[Interview] Failed to send completion email:', err));
				}
			}

			console.log(`[Interview] Total request time: ${Date.now() - startTime}ms`);

			return c.json({ 
				interview: updated, 
				evaluation: {
					score: evaluation.score * 10,
					feedback: evaluation.feedback,
				},
				question: nextQuestion,
				nextQuestion,
				isComplete,
				progress: {
					current: nextQuestionIndex,
					total: questions.length,
				}
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

			// Mark interview as completed
			const [updated] = await db
				.update(interviews)
				.set({
					status: 'completed',
					completedAt: new Date(),
				})
				.where(eq(interviews.id, interviewId))
				.returning();

			return c.json({ 
				interview: updated,
				finalRating: updated.finalRating || 0,
				feedback: updated.aiFeedback || 'No feedback available'
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
	})
	.post('/:interviewId/decision', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		const interviewId = c.req.param('interviewId');
		const user = c.get('user');
		
		console.log(`[Decision] Received decision request for interview ${interviewId}`);
		
		if (!isValidUuid(interviewId)) {
			return badRequest(c, 'Invalid interview ID');
		}

		try {
			const body = await c.req.json();
			console.log('[Decision] Request body:', body);
			
			const { decision, note } = z.object({
				decision: z.enum(['shortlisted', 'rejected']),
				note: z.string().optional(),
			}).parse(body);

			// Get interview with candidate details
			const [interview] = await db
				.select()
				.from(interviews)
				.where(eq(interviews.id, interviewId));

			if (!interview) {
				return notFound(c, 'Interview');
			}

			if (interview.status !== 'completed') {
				return badRequest(c, 'Interview must be completed before making a decision');
			}

			// Get candidate details
			const [candidate] = await db
				.select()
				.from(candidates)
				.where(eq(candidates.id, interview.candidateId));

			if (!candidate) {
				return notFound(c, 'Candidate');
			}

			// Update interview with decision
			const [updated] = await db
				.update(interviews)
				.set({
					decision,
					decisionNote: note,
					decisionAt: new Date(),
					decisionBy: user?.id,
				})
				.where(eq(interviews.id, interviewId))
				.returning();

			// Send email to candidate
			if (candidate.email && candidate.name) {
				if (decision === 'shortlisted') {
					sendShortlistEmail(
						candidate.name,
						candidate.email,
						candidate.appliedRole || 'Position',
						note
					).catch(err => console.error('[Interview] Failed to send shortlist email:', err));
				} else {
					sendRejectionEmail(
						candidate.name,
						candidate.email,
						candidate.appliedRole || 'Position',
						note
					).catch(err => console.error('[Interview] Failed to send rejection email:', err));
				}
			}

			console.log(`[Interview] Decision made for interview ${interviewId}: ${decision}`);

			return c.json({ 
				success: true,
				interview: updated,
				message: `Candidate ${decision} and email notification sent`
			});
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to process decision');
		}
	});
