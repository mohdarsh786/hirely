import { Hono } from 'hono';
import { db } from '../db/client';
import { candidateInvites, interviews, candidates } from '../db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

// GET /public/interview/:token - Get interview details (no auth required)
app.get('/interview/:token', async (c) => {
    try {
        const token = c.req.param('token');

        // Validate token
        const [invite] = await db
            .select()
            .from(candidateInvites)
            .where(eq(candidateInvites.token, token));

        if (!invite) {
            return c.json({ error: 'Invalid interview link' }, 404);
        }

        // Check expiration
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return c.json({ error: 'Interview link has expired' }, 410);
        }

        // Get candidate
        const [candidate] = await db
            .select()
            .from(candidates)
            .where(eq(candidates.id, invite.candidateId));

        if (!candidate) {
            return c.json({ error: 'Candidate not found' }, 404);
        }

        // Get or create interview
        let interview;
        if (invite.interviewId) {
            [interview] = await db
                .select()
                .from(interviews)
                .where(eq(interviews.id, invite.interviewId));
        }

        return c.json({
            candidate,
            interview,
            token,
        });
    } catch (error) {
        console.error('Public interview fetch error:', error);
        return c.json({ error: 'Failed to fetch interview' }, 500);
    }
});

// POST /public/interview/:token/answer - Submit interview answer (no auth required)
app.post('/interview/:token/answer', async (c) => {
    try {
        const token = c.req.param('token');
        const body = await c.req.json();
        const { answer, questionIndex } = body;

        // Validate token
        const [invite] = await db
            .select()
            .from(candidateInvites)
            .where(eq(candidateInvites.token, token));

        if (!invite) {
            return c.json({ error: 'Invalid interview link' }, 404);
        }

        if (!invite.interviewId) {
            return c.json({ error: 'No interview associated with this invite' }, 400);
        }

        // Get interview
        const [interview] = await db
            .select()
            .from(interviews)
            .where(eq(interviews.id, invite.interviewId));

        if (!interview) {
            return c.json({ error: 'Interview not found' }, 404);
        }

        // Update transcript with answer
        const transcript = interview.transcript || [];
        transcript.push({
            type: 'answer',
            text: answer,
            at: new Date().toISOString(),
        });

        await db
            .update(interviews)
            .set({ transcript })
            .where(eq(interviews.id, invite.interviewId));

        return c.json({ success: true, questionIndex });
    } catch (error) {
        console.error('Submit answer error:', error);
        return c.json({ error: 'Failed to submit answer' }, 500);
    }
});

// GET /public/interview/:token/result - Get interview result (no auth required)
app.get('/interview/:token/result', async (c) => {
    try {
        const token = c.req.param('token');

        // Validate token
        const [invite] = await db
            .select()
            .from(candidateInvites)
            .where(eq(candidateInvites.token, token));

        if (!invite || !invite.interviewId) {
            return c.json({ error: 'Invalid interview link' }, 404);
        }

        // Get interview
        const [interview] = await db
            .select()
            .from(interviews)
            .where(eq(interviews.id, invite.interviewId));

        if (!interview) {
            return c.json({ error: 'Interview not found' }, 404);
        }

        // Only return results if interview is completed
        if (interview.status !== 'completed') {
            return c.json({ error: 'Interview not yet completed' }, 400);
        }

        return c.json({
            finalRating: interview.finalRating,
            aiFeedback: interview.aiFeedback,
            completedAt: interview.createdAt,
        });
    } catch (error) {
        console.error('Get interview result error:', error);
        return c.json({ error: 'Failed to fetch result' }, 500);
    }
});

export default app;
