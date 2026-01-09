import { db } from '../db/client';
import { integrations, jobs } from '../db/schema';
import { gmailIntegration } from '../lib/integrations/gmail';
import { driveIntegration } from '../lib/integrations/drive';
import { startBatch } from './batchService';
import { eq, and } from 'drizzle-orm';

export async function syncIntegration(
    integrationId: string, 
    jobId: string, 
    organizationId: string, 
    userId: string
): Promise<{ batchId: string | null, count: number }> {
    console.log(`[SYNC] Starting sync for integration ${integrationId} on job ${jobId}`);

    const [integration] = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, integrationId));

    if (!integration) {
        throw new Error('Integration not found');
    }

    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
    if (!job) {
        throw new Error('Job not found');
    }

    const service = integration.provider === 'drive' ? driveIntegration : gmailIntegration;
    
    // Check and refresh token
    const newTokens = await service.checkAndRefreshToken(
        integration.accessToken,
        integration.refreshToken,
        integration.expiresAt
    );

    if (newTokens) {
        await db.update(integrations)
            .set({
                accessToken: newTokens.accessToken,
                refreshToken: newTokens.refreshToken || integration.refreshToken,
                expiresAt: newTokens.expiryDate ? new Date(newTokens.expiryDate) : null,
                updatedAt: new Date(),
            })
            .where(eq(integrations.id, integration.id));
        
        await service.setCredentials(newTokens.accessToken, newTokens.refreshToken || integration.refreshToken);
    } else {
        await service.setCredentials(integration.accessToken, integration.refreshToken);
    }

    // Update lastSyncTime in metadata
    const currentMetadata = (integration.metadata as any) || {};
    await db.update(integrations)
        .set({
            metadata: { ...currentMetadata, lastSyncTime: new Date().toISOString() },
            updatedAt: new Date()
        })
        .where(eq(integrations.id, integration.id));

    let files: File[] = [];

    if (integration.provider === 'gmail') {
        let query = '';
        const metadata = integration.metadata as { activeJobId?: string, lastSyncTime?: string } | null;
        
        if (metadata?.lastSyncTime) {
            const date = new Date(metadata.lastSyncTime);
            // Use epoch seconds for precise incremental sync to avoid re-scanning the whole day
            const seconds = Math.floor(date.getTime() / 1000);
            query = `after:${seconds}`;
            console.log(`[SYNC] Incremental sync from: ${seconds}`);
        }

        const messages = await gmailIntegration.listMessages(query);

        for (const msg of messages) {
            if (!msg.id) continue;
            const fullMsg = await gmailIntegration.getMessage(msg.id);
            const parts = fullMsg.payload?.parts || [];
            
            for (const part of parts) {
                if (part.filename && part.filename.toLowerCase().endsWith('.pdf') && part.body?.attachmentId) {
                    const attachment = await gmailIntegration.getAttachment(msg.id, part.body.attachmentId);
                    if (attachment.data) {
                        const binaryString = atob(attachment.data.replace(/-/g, '+').replace(/_/g, '/'));
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        
                        const file = new File([bytes], part.filename, { type: 'application/pdf' });
                        files.push(file);
                    }
                }
            }
        }
    } else if (integration.provider === 'drive') {
        const driveFiles = await driveIntegration.listPdfFiles();
        for (const dFile of driveFiles) {
            if (dFile.id) {
                const buffer = await driveIntegration.getFile(dFile.id);
                const file = new File([buffer as any], dFile.name || 'resume.pdf', { type: 'application/pdf' });
                files.push(file);
            }
        }
    }

    if (files.length === 0) {
        return { batchId: null, count: 0 };
    }

    const batchId = await startBatch(
        files,
        { id: job.id, title: job.title, requiredSkills: job.requiredSkills || [] },
        organizationId,
        userId
    );

    return { batchId, count: files.length };
}
