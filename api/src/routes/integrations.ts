import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/client';
import { integrations, jobs } from '../db/schema';
import { authMiddleware, type AppVariables } from '../middleware/auth';
import { badRequest, internalError, notFound } from '../utils/errors';
import { gmailIntegration } from '../lib/integrations/gmail';
import { driveIntegration } from '../lib/integrations/drive';
import { eq, and } from 'drizzle-orm';
import { startBatch } from '../services/batchService';
import { syncIntegration } from '../services/syncService';

export const integrationsRoutes = new Hono<{ Variables: AppVariables }>()
	.use('*', authMiddleware)

	.post('/gmail/auth-url', async (c) => {
		try {
			const { jobId } = await c.req.json();
			const state = JSON.stringify({ jobId, userId: c.get('user').id, provider: 'gmail' });
			const url = gmailIntegration.getAuthUrl(state);
			return c.json({ url });
		} catch (error) {
			return internalError(c, error, 'Failed to generate auth URL');
		}
	})

    .post('/drive/auth-url', async (c) => {
		try {
			const { jobId } = await c.req.json();
			const state = JSON.stringify({ jobId, userId: c.get('user').id, provider: 'drive' });
			const url = driveIntegration.getAuthUrl(state);
			return c.json({ url });
		} catch (error) {
			return internalError(c, error, 'Failed to generate auth URL');
		}
	})

	.post('/callback', async (c) => {
		try {
			const { code, state } = await c.req.json();
            const stateObj = JSON.parse(state || '{}');
            const provider = stateObj.provider || 'gmail'; // Fallback for backward compat if needed

            const integrationService = provider === 'drive' ? driveIntegration : gmailIntegration;

			const tokens = await integrationService.getTokens(code);
			
			if (!tokens.access_token) {
				return badRequest(c, 'Failed to retrieve access token');
			}

			await integrationService.setCredentials(tokens.access_token, tokens.refresh_token);
			const profile = await integrationService.getUserProfile();
            // Google API v2 return id as string
			const email = profile.email;

			if (!email) {
				return badRequest(c, 'Could not retrieve email address');
			}

			const user = c.get('user');
			if (!user.organizationId) {
				return badRequest(c, 'Organization not found');
			}

			await db.insert(integrations).values({
				organizationId: user.organizationId,
				userId: user.id,
				provider: provider,
				email: email,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
			}).onConflictDoUpdate({
				target: [integrations.organizationId, integrations.provider, integrations.email], // Uses unique index
				set: {
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token,
					expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    metadata: { activeJobId: stateObj.jobId },
					updatedAt: new Date(),
				}
			});

			return c.json({ success: true, email, jobId: stateObj.jobId });
		} catch (error) {
			console.error('Callback error:', error);
			return internalError(c, error, 'Failed to complete OAuth');
		}
	})

	.post('/gmail/:jobId/sync', async (c) => {
		const jobId = c.req.param('jobId');
		const user = c.get('user');

		try {
			const [integration] = await db
				.select()
				.from(integrations)
				.where(and(
					eq(integrations.organizationId, user.organizationId!),
					eq(integrations.provider, 'gmail')
				));

			if (!integration) {
				return badRequest(c, 'Gmail not connected');
			}

			const result = await syncIntegration(integration.id, jobId, user.organizationId!, user.id);
            
            // Update active job ID
            await db.update(integrations)
                .set({ metadata: { activeJobId: jobId }, updatedAt: new Date() })
                .where(eq(integrations.id, integration.id));

			if (result.count === 0) {
				return c.json({ message: 'No new resumes found', count: 0 });
			}

			return c.json({ batchId: result.batchId, count: result.count });

		} catch (error) {
			return internalError(c, error, 'Sync failed');
		}
	})
    
    .post('/drive/:jobId/sync', async (c) => {
		const jobId = c.req.param('jobId');
		const user = c.get('user');

		try {
			const [integration] = await db
				.select()
				.from(integrations)
				.where(and(
					eq(integrations.organizationId, user.organizationId!),
					eq(integrations.provider, 'drive')
				));

			if (!integration) {
				return badRequest(c, 'Drive not connected');
			}

			const result = await syncIntegration(integration.id, jobId, user.organizationId!, user.id);
            
            // Update active job ID
            await db.update(integrations)
                .set({ metadata: { activeJobId: jobId }, updatedAt: new Date() })
                .where(eq(integrations.id, integration.id));

			if (result.count === 0) {
				return c.json({ message: 'No new resumes found in Drive', count: 0 });
			}

			return c.json({ batchId: result.batchId, count: result.count });

		} catch (error) {
			return internalError(c, error, 'Drive Sync failed');
		}
	});
