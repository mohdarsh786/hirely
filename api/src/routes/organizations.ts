import { Hono } from 'hono';
import { db } from '../db/client';
import { organizations, organizationMembers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { supabaseAdmin } from '../lib/supabase';
import { sendEmail } from '../services/mail';

const app = new Hono();

// POST /organizations/register - Create new organization
app.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const { name, domain, userId } = body;

        if (!name || !userId) {
            return c.json({ error: 'Organization name and userId required' }, 400);
        }

        // Create organization
        const [org] = await db.insert(organizations).values({
            name,
            domain: domain || null,
        }).returning();

        if (!org) {
            return c.json({ error: 'Failed to create organization' }, 500);
        }

        // Add creator as HR_ADMIN
        await db.insert(organizationMembers).values({
            organizationId: org.id,
            userId,
            role: 'HR_ADMIN',
        });

        return c.json({ organization: org }, 201);
    } catch (error) {
        console.error('Organization registration error:', error);
        return c.json({ error: 'Failed to create organization' }, 500);
    }
});

app.get('/mine', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return c.json({ error: 'Invalid token' }, 401);
        }

        const [member] = await db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, user.id));

        if (!member) {
            return c.json({ error: 'Not member of any organization' }, 404);
        }

        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, member.organizationId));

        if (!org) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        const members = await db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.organizationId, org.id));

        return c.json({ organization: org, role: member.role, members });
    } catch (error) {
        console.error('Get my organization error:', error);
        return c.json({ error: 'Failed to fetch organization' }, 500);
    }
});

// GET /organizations/:id - Get organization details
app.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, id));

        if (!org) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        // Get members
        const members = await db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.organizationId, id));

        return c.json({ organization: org, members });
    } catch (error) {
        console.error('Get organization error:', error);
        return c.json({ error: 'Failed to fetch organization' }, 500);
    }
});

// PATCH /organizations/:id - Update organization
app.patch('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const { name, domain } = body;

        const [org] = await db
            .update(organizations)
            .set({ name, domain })
            .where(eq(organizations.id, id))
            .returning();

        if (!org) {
            return c.json({ error: 'Organization not found' }, 404);
        }

        return c.json({ organization: org });
    } catch (error) {
        console.error('Update organization error:', error);
        return c.json({ error: 'Failed to update organization' }, 500);
    }
});

// POST /organizations/:id/invite-member - Invite team member
app.post('/:id/invite-member', async (c) => {
    try {
        const orgId = c.req.param('id');
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return c.json({ error: 'Invalid token' }, 401);
        }

        // Check if requester is HR_ADMIN of this org
        const [requester] = await db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.userId, user.id));

        if (!requester || requester.organizationId !== orgId || requester.role !== 'HR_ADMIN') {
            return c.json({ error: 'Forbidden: Only HR Admins can invite members' }, 403);
        }

        const body = await c.req.json();
        const { email, role } = body;

        if (!email || !role) {
            return c.json({ error: 'Email and role required' }, 400);
        }

        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email,
            options: {
                data: {
                    organizationId: orgId,
                    role,
                },
                redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/update-password`
            }
        });

        if (error || !data.properties?.action_link) {
            console.error('Supabase generate link error:', error);
            return c.json({ error: 'Failed to generate invitation' }, 500);
        }

        const inviteLink = data.properties.action_link;

        if (data.user) {
            const [existing] = await db
                .select()
                .from(organizationMembers)
                .where(eq(organizationMembers.userId, data.user.id));

            if (!existing) {
                await db.insert(organizationMembers).values({
                    organizationId: orgId,
                    userId: data.user.id,
                    role: role,
                });
            } else if (existing.organizationId !== orgId) {
                console.error('User already in another organization. Multi-org not supported for:', email);
                return c.json({ error: 'User is already a member of another organization' }, 400);
            }
        }

        await sendEmail({
            to: email,
            subject: 'Join Hirely Organization',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Join Innovation Organization</h2>
                    <p>Hello,</p>
                    <p>You have been invited to join an organization on Hirely HR as a <strong>${role}</strong>.</p>
                    <p>Please click the link below to accept the invitation and set up your account:</p>
                    <p>
                        <a href="${inviteLink}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Accept Invitation
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>${inviteLink}</p>
                    <p>If you didn't expect this invitation, you can ignore this email.</p>
                </div>
            `
        });

        return c.json({ success: true, user: data.user, inviteLink });
    } catch (error) {
        console.error('Invite member error:', error);
        return c.json({ error: 'Failed to invite member' }, 500);
    }
});

// GET /organizations/:id/members - Get all members
app.get('/:id/members', async (c) => {
    try {
        const orgId = c.req.param('id');
        // Ideally should check if user is member of this org, but for now open to members
        const authHeader = c.req.header('Authorization');
        // Basic auth check
        if (!authHeader) return c.json({ error: 'Unauthorized' }, 401);

        const members = await db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.organizationId, orgId));

        return c.json({ members });
    } catch (error) {
        console.error('Get members error:', error);
        return c.json({ error: 'Failed to fetch members' }, 500);
    }
});

export default app;
