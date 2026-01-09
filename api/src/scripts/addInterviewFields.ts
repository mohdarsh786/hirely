import { db } from '../db/client';
import { sql } from 'drizzle-orm';
import { getEnv } from '../env';

getEnv();

async function addInterviewFields() {
  console.log('Adding interview fields...\n');

  try {
    console.log('Adding questions column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS questions JSONB`);
    
    console.log('Adding answers column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS answers JSONB`);
    
    console.log('Adding started_at column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS started_at timestamp with time zone`);
    
    console.log('Adding completed_at column...');
    await db.execute(sql`ALTER TABLE interviews ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone`);
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

addInterviewFields();
