import { Hono } from 'hono';
import { db } from '../db/client';
import { candidateInvites, candidates, interviews } from '../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from '../services/mail';

const app = new Hono();

app.post('/candidate', async (c) => {
    try {
        const body = await c.req.json();
        const { candidateId, interviewId, email, expiresInDays } = body;

        if (!candidateId || !email) {
            return c.json({ error: 'Candidate ID and email required' }, 400);
        }

        // Generate secure token
        const token = crypto.randomBytes(32).toString('hex');

        // Calculate expiration (optional)
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        const [invite] = await db.insert(candidateInvites).values({
            candidateId,
            interviewId: interviewId || null,
            token,
            email,
            expiresAt,
        }).returning();

        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        // If interviewId exists, link directly to live interview
        const inviteLink = interviewId 
            ? `${baseUrl}/hr-interviews/live/${interviewId}`
            : `${baseUrl}/interview/token/${token}`;

        await sendEmail({
            to: email,
            subject: 'Interview Invitation - Hirely HR',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited to an interview!</h2>
                    <p>Hello,</p>
                    <p>You have been invited to participate in an automated AI interview for a position at Hirely HR.</p>
                    <p>Please click the link below to start your interview:</p>
                    <p>
                        <a href="${inviteLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Start Interview
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>${inviteLink}</p>
                    <p>This link will expire in ${expiresInDays || 7} days.</p>
                    <p>Good luck!</p>
                </div>
            `
        });

        return c.json({ invite, inviteLink }, 201);
    } catch (error) {
        console.error('Create invite error:', error);
        return c.json({ error: 'Failed to create invite' }, 500);
    }
});

app.get('/validate/:token', async (c) => {
    try {
        const token = c.req.param('token');

        const [invite] = await db
            .select()
            .from(candidateInvites)
            .where(eq(candidateInvites.token, token));

        if (!invite) {
            return c.json({ error: 'Invalid invite token' }, 404);
        }

        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
            return c.json({ error: 'Invite has expired' }, 410);
        }

        const [candidate] = await db
            .select()
            .from(candidates)
            .where(eq(candidates.id, invite.candidateId));

        let interview = null;
        if (invite.interviewId) {
            [interview] = await db
                .select()
                .from(interviews)
                .where(eq(interviews.id, invite.interviewId));
        }

        return c.json({
            valid: true,
            invite,
            candidate,
            interview,
        });
    } catch (error) {
        console.error('Validate invite error:', error);
        return c.json({ error: 'Failed to validate invite' }, 500);
    }
});

app.post('/accept/:token', async (c) => {
    try {
        const token = c.req.param('token');

        const [invite] = await db
            .update(candidateInvites)
            .set({ usedAt: new Date() })
            .where(eq(candidateInvites.token, token))
            .returning();

        if (!invite) {
            return c.json({ error: 'Invalid invite token' }, 404);
        }

        return c.json({ success: true, invite });
    } catch (error) {
        console.error('Accept invite error:', error);
        return c.json({ error: 'Failed to accept invite' }, 500);
    }
});

app.get('/candidate/:candidateId', async (c) => {
    try {
        const candidateId = c.req.param('candidateId');

        const invites = await db
            .select()
            .from(candidateInvites)
            .where(eq(candidateInvites.candidateId, candidateId));

        return c.json({ invites });
    } catch (error) {
        console.error('Get candidate invites error:', error);
        return c.json({ error: 'Failed to fetch invites' }, 500);
    }
});

export default app;
