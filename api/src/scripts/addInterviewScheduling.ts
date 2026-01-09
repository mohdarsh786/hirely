import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { getEnv } from '../env';

getEnv(); // Load environment

async function addInterviewSchedulingFields() {
  console.log('Adding interview scheduling fields...\n');

  try {
    // Add new columns
    console.log('Adding scheduled_at column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone`);
    
    console.log('Adding duration_minutes column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS duration_minutes integer`);
    
    console.log('Adding token column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS token text`);
    
    // Update status default
    console.log('Updating status column default...');
    await db.execute(sql`ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'scheduled'`);
    
    console.log('\n✅ Migration completed successfully! Schema is already up to date.');
  } catch (error: any) {
    // Skip constraint errors if already exists
    if (error.code === '42P07') {
      console.log('\n✅ Migration completed successfully! Constraints already exist.');
    } else {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
  
  process.exit(0);
}

addInterviewSchedulingFields();
