import postgres from 'postgres';
import { getEnv } from '../env';

const env = getEnv();
const sql = postgres(env.DATABASE_URL);

async function runMigration() {
    try {
        console.log('Running migration: Add interview decision fields...');
        
        await sql`
            ALTER TABLE interviews 
            ADD COLUMN IF NOT EXISTS decision TEXT,
            ADD COLUMN IF NOT EXISTS decision_note TEXT,
            ADD COLUMN IF NOT EXISTS decision_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS decision_by UUID
        `;
        
        console.log('✅ Added decision fields');
        
        await sql`CREATE INDEX IF NOT EXISTS idx_interviews_decision ON interviews(decision)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_interviews_status_decision ON interviews(status, decision)`;
        
        console.log('✅ Created indexes');
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

runMigration();
