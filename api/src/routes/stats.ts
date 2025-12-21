import { Hono } from 'hono';
import { sql, count, avg } from 'drizzle-orm';
import { db } from '../db/client';
import { candidates, interviews, resumes, hrDocuments } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { internalError } from '../utils/errors';

export const statsRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)
	.get('/dashboard', requireRole(['HR_ADMIN', 'RECRUITER']), async (c) => {
		try {
			// Get total candidates
			const [candidateCount] = await db.select({ count: count() }).from(candidates);
			
			// Get total interviews
			const [interviewCount] = await db.select({ count: count() }).from(interviews);
			
			// Get total resumes processed
			const [resumeCount] = await db.select({ count: count() }).from(resumes);
			
			// Get average interview score
			const [avgScore] = await db.select({ 
				avg: avg(interviews.finalRating) 
			}).from(interviews);
			
			// Get recent candidates (last 5)
			const recentCandidates = await db
				.select()
				.from(candidates)
				.orderBy(sql`${candidates.createdAt} DESC`)
				.limit(5);
			
			// Get pending interviews (no final rating yet)
			const [pendingInterviews] = await db
				.select({ count: count() })
				.from(interviews)
				.where(sql`${interviews.finalRating} IS NULL`);

			return c.json({
				stats: {
					totalCandidates: candidateCount?.count ?? 0,
					totalInterviews: interviewCount?.count ?? 0,
					totalResumes: resumeCount?.count ?? 0,
					averageInterviewScore: avgScore?.avg ? Math.round(Number(avgScore.avg)) : 0,
					pendingInterviews: pendingInterviews?.count ?? 0,
				},
				recentCandidates,
			});
		} catch (error) {
			return internalError(c, error, 'Failed to fetch dashboard stats');
		}
	});
