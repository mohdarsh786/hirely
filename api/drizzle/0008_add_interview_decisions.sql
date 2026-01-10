-- Add decision fields to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS decision TEXT;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS decision_note TEXT;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS decision_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS decision_by UUID;

-- Add index for faster queries on decision status
CREATE INDEX IF NOT EXISTS idx_interviews_decision ON interviews(decision);
CREATE INDEX IF NOT EXISTS idx_interviews_status_decision ON interviews(status, decision);
