import { db } from '../db/client';
import { integrations } from '../db/schema';
import { syncIntegration } from './syncService';

export function startScheduler() {
    console.log('[Scheduler] Starting 5-minute sync job...');
    
    // Run immediately on startup
    runSyncJob();

    // Then every 5 minutes
    setInterval(runSyncJob, 5 * 60 * 1000);
}

async function runSyncJob() {
    console.log('[Scheduler] Running sync job:', new Date().toISOString());

    try {
        const allIntegrations = await db.select().from(integrations);
        
        for (const integration of allIntegrations) {
            const metadata = integration.metadata as { activeJobId?: string } | null;
            
            if (metadata?.activeJobId) {
                try {
                    await syncIntegration(
                        integration.id, 
                        metadata.activeJobId, 
                        integration.organizationId, 
                        integration.userId
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
