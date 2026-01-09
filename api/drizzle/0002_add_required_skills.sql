-- Add required_skills column to candidates table
ALTER TABLE "candidates" ADD COLUMN "required_skills" jsonb;
