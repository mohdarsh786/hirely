import { db } from '../db/client';
import { sql } from 'drizzle-orm';

async function migrateToJobs() {
	try {
		console.log('🔄 Starting migration to jobs-based architecture...\n');

		// Step 1: Create jobs table
		console.log('1️⃣ Creating jobs table...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS jobs (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
				title TEXT NOT NULL,
				description TEXT,
				required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
				experience_years INTEGER,
				status TEXT NOT NULL DEFAULT 'active',
				created_by UUID NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
			);
		`);
		console.log('✅ Jobs table created\n');

		// Step 2: Add jobId column to candidates
		console.log('2️⃣ Adding job_id column to candidates...');
		await db.execute(sql`
			ALTER TABLE candidates 
			ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;
		`);
		console.log('✅ job_id column added\n');

		// Step 3: Create indexes for performance
		console.log('3️⃣ Creating indexes...');
		await db.execute(sql`
			CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
			CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON jobs(organization_id);
			CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
		`);
		console.log('✅ Indexes created\n');

		// Step 4: Drop old required_skills column from candidates
		console.log('4️⃣ Dropping required_skills column from candidates...');
		await db.execute(sql`
			ALTER TABLE candidates DROP COLUMN IF EXISTS required_skills;
		`);
		console.log('✅ required_skills column dropped\n');

		console.log('🎉 Migration completed successfully!');
		console.log('\n📝 Next steps:');
		console.log('   1. Create job positions via /api/jobs');
		console.log('   2. Link candidates to jobs during creation');
		console.log('   3. Resume scoring will auto-use job requirements\n');
		
		process.exit(0);
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

migrateToJobs();
