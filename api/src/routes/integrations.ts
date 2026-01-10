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

	.get('/status', async (c) => {
		try {
			const user = c.get('user');
			if (!user.organizationId) {
				return c.json({ gmail: null, drive: null });
			}

			const userIntegrations = await db
				.select({
					id: integrations.id,
					provider: integrations.provider,
					email: integrations.email,
					metadata: integrations.metadata,
					updatedAt: integrations.updatedAt,
				})
				.from(integrations)
				.where(eq(integrations.organizationId, user.organizationId));

			const gmail = userIntegrations.find(i => i.provider === 'gmail') || null;
			const drive = userIntegrations.find(i => i.provider === 'drive') || null;

			return c.json({ gmail, drive });
		} catch (error) {
			return internalError(c, error, 'Failed to get integration status');
		}
	})

	.delete('/:provider', async (c) => {
		const provider = c.req.param('provider');
		const user = c.get('user');

		if (provider !== 'gmail' && provider !== 'drive') {
			return badRequest(c, 'Invalid provider. Must be "gmail" or "drive"');
		}

		try {
			await db.delete(integrations).where(and(
				eq(integrations.organizationId, user.organizationId!),
				eq(integrations.provider, provider)
			));

			return c.json({ success: true, message: `${provider} disconnected` });
		} catch (error) {
			return internalError(c, error, 'Failed to disconnect integration');
		}
	})

	.post('/callback', async (c) => {
		try {
			const { code, state } = await c.req.json();
			console.log('[OAuth Callback] Received code:', code?.substring(0, 20) + '...');
			console.log('[OAuth Callback] Received state:', state);
			
            const stateObj = JSON.parse(state || '{}');
            const provider = stateObj.provider || 'gmail'; // Fallback for backward compat if needed
			console.log('[OAuth Callback] Provider:', provider);
			console.log('[OAuth Callback] JobId:', stateObj.jobId);

            const integrationService = provider === 'drive' ? driveIntegration : gmailIntegration;

			console.log('[OAuth Callback] Exchanging code for tokens...');
			const tokens = await integrationService.getTokens(code);
			console.log('[OAuth Callback] Tokens received:', !!tokens.access_token);
			
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
		const body = await c.req.json().catch(() => ({}));
		const searchQuery = body.searchQuery as string | undefined;

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

			const result = await syncIntegration(integration.id, jobId, user.organizationId!, user.id, { searchQuery });
            
            // Enable auto-sync after first manual sync
            await db.update(integrations)
                .set({ 
                    metadata: { activeJobId: jobId, searchQuery, syncEnabled: true }, 
                    updatedAt: new Date() 
                })
                .where(eq(integrations.id, integration.id));

			if (result.count === 0) {
				return c.json({ message: 'No emails with PDF attachments found matching your query', count: 0 });
			}

			return c.json({ batchId: result.batchId, count: result.count });

		} catch (error) {
			return internalError(c, error, 'Sync failed');
		}
	})

	.get('/drive/folders', async (c) => {
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

			// Set credentials
			await driveIntegration.setCredentials(integration.accessToken, integration.refreshToken);
			
			const folders = await driveIntegration.listFolders();
			return c.json({ folders });
		} catch (error) {
			return internalError(c, error, 'Failed to list folders');
		}
	})
    
    .post('/drive/:jobId/sync', async (c) => {
		const jobId = c.req.param('jobId');
		const user = c.get('user');
		const body = await c.req.json().catch(() => ({}));
		const folderId = body.folderId as string | undefined;

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

			const result = await syncIntegration(integration.id, jobId, user.organizationId!, user.id, { folderId });
            
            // Enable auto-sync after first manual sync
            await db.update(integrations)
                .set({ 
                    metadata: { activeJobId: jobId, folderId, syncEnabled: true }, 
                    updatedAt: new Date() 
                })
                .where(eq(integrations.id, integration.id));

			if (result.count === 0) {
				return c.json({ message: 'No PDF resumes found in the selected folder', count: 0 });
			}

			return c.json({ batchId: result.batchId, count: result.count });

		} catch (error) {
			return internalError(c, error, 'Drive Sync failed');
		}
	});
