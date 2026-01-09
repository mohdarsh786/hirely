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
import { sendEmail } from '../services/mail';
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
			try {
				const interviewUrl = `${process.env.WEB_URL || 'http://localhost:3000'}/interview/token/${token}`;
				const scheduledDate = new Date(data.scheduledAt).toLocaleString('en-US', {
					dateStyle: 'full',
					timeStyle: 'short'
				});

				await sendEmail({
					to: candidate.email!,
					subject: 'Interview Invitation - Hirely',
					htmlContent: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
							<h2 style="color: #1e293b;">Interview Invitation</h2>
							<p>Dear ${candidate.name},</p>
							<p>You have been invited to participate in an AI-powered interview.</p>
							
							<div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
								<p style="margin: 5px 0;"><strong>Position:</strong> ${candidate.appliedRole || 'Not specified'}</p>
								<p style="margin: 5px 0;"><strong>Scheduled Time:</strong> ${scheduledDate}</p>
								<p style="margin: 5px 0;"><strong>Duration:</strong> ${data.durationMinutes} minutes</p>
							</div>

							<p>Please click the button below to access your interview:</p>
							
							<div style="text-align: center; margin: 30px 0;">
								<a href="${interviewUrl}" 
								   style="background-color: #3b82f6; color: white; padding: 12px 30px; 
								          text-decoration: none; border-radius: 6px; display: inline-block;">
									Start Interview
								</a>
							</div>

							<p style="color: #64748b; font-size: 14px;">
								Or copy this link: <a href="${interviewUrl}">${interviewUrl}</a>
							</p>

							<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
								<p style="color: #64748b; font-size: 12px;">
									This is an automated message from Hirely. Please do not reply to this email.
								</p>
							</div>
						</div>
					`,
					textContent: `
Interview Invitation

Dear ${candidate.name},

You have been invited to participate in an AI-powered interview.

Position: ${candidate.appliedRole || 'Not specified'}
Scheduled Time: ${scheduledDate}
Duration: ${data.durationMinutes} minutes

Please use this link to access your interview:
${interviewUrl}

This is an automated message from Hirely.
					`
				});
				
				console.log(`✅ Interview invitation sent to ${candidate.email}`);
			} catch (emailError) {
				// Don't fail the interview creation if email fails
				console.error('Failed to send interview email:', emailError);
			}

			return c.json({ interview }, 201);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return handleValidationError(c, error);
			}
			return internalError(c, error, 'Failed to create interview');
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

			// Score the answer using AI
			const evaluation = await evaluateAnswer({ 
				question: currentQuestion.question, 
				answer: data.answer 
			});

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
	});
