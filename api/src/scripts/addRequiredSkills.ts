import { db } from '../db/client';
import { sql } from 'drizzle-orm';

async function addRequiredSkillsColumn() {
	try {
		await db.execute(sql`
			ALTER TABLE candidates 
			ADD COLUMN IF NOT EXISTS required_skills jsonb;
		`);
		console.log('✅ Added required_skills column to candidates table');
		process.exit(0);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

addRequiredSkillsColumn();
