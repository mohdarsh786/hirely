import { db } from '../db/client';
import { integrations } from '../db/schema';
import { syncIntegration } from './syncService';

export function startScheduler() {
    console.log('[Scheduler] Starting hourly auto-sync job (only for enabled integrations)');
    
    // Check every hour for integrations that need syncing
    setInterval(runSyncJob, 60 * 60 * 1000); // 1 hour
}

async function runSyncJob() {
    console.log('[Scheduler] Checking for integrations to sync:', new Date().toISOString());

    try {
        const allIntegrations = await db.select().from(integrations);
        
        for (const integration of allIntegrations) {
            const metadata = integration.metadata as { 
                activeJobId?: string;
                syncEnabled?: boolean; // Only sync if user has clicked sync at least once
                folderId?: string;
                searchQuery?: string;
            } | null;
            
            // Only auto-sync if explicitly enabled (after first manual sync)
            if (metadata?.activeJobId && metadata?.syncEnabled) {
                console.log(`[Scheduler] Auto-syncing integration ${integration.id} for job ${metadata.activeJobId}`);
                try {
                    await syncIntegration(
                        integration.id, 
                        metadata.activeJobId, 
                        integration.organizationId, 
                        integration.userId,
                        { folderId: metadata.folderId, searchQuery: metadata.searchQuery }
                    );
                } catch (err) {
                    console.error(`[Scheduler] Failed to sync integration ${integration.id}:`, err);
                }
            }
        }
    } catch (error) {
        console.error('[Scheduler] Critical failure:', error);
    }
}

