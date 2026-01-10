import { db } from '../db/client';
import { integrations, jobs } from '../db/schema';
import { gmailIntegration } from '../lib/integrations/gmail';
import { driveIntegration } from '../lib/integrations/drive';
import { startBatch } from './batchService';
import { eq, and } from 'drizzle-orm';

interface SyncOptions {
    folderId?: string;      // For Drive: specific folder to sync
    searchQuery?: string;   // For Gmail: search query to filter emails
}

export async function syncIntegration(
    integrationId: string, 
    jobId: string, 
    organizationId: string, 
    userId: string,
    options: SyncOptions = {}
): Promise<{ batchId: string | null, count: number }> {
    console.log(`[SYNC] Starting sync for integration ${integrationId} on job ${jobId}`, options);

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
        // Use the provided searchQuery or fall back to default resume search
        let query = options.searchQuery || 'resume OR cv OR application';
        console.log(`[SYNC] Gmail search query: "${query}"`);

        const messages = await gmailIntegration.listMessages(query);
        console.log(`[SYNC] Found ${messages.length} matching emails`);

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
        // Use the provided folderId to filter by folder
        console.log(`[SYNC] Drive folder: ${options.folderId || 'All'}`);
        const driveFiles = await driveIntegration.listPdfFiles(options.folderId);
        console.log(`[SYNC] Found ${driveFiles.length} PDF files`);
        
        for (let i = 0; i < driveFiles.length; i++) {
            const dFile = driveFiles[i];
            if (!dFile.id) continue;
            
            console.log(`[SYNC] Downloading file ${i + 1}/${driveFiles.length}: ${dFile.name}`);
            try {
                const buffer = await driveIntegration.getFile(dFile.id);
                const file = new File([buffer as any], dFile.name || 'resume.pdf', { type: 'application/pdf' });
                files.push(file);
                console.log(`[SYNC] Downloaded: ${dFile.name} (${buffer.byteLength} bytes)`);
            } catch (downloadErr) {
                console.error(`[SYNC] Failed to download ${dFile.name}:`, downloadErr);
                // Continue with other files
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
