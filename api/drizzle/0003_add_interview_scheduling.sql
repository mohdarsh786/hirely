-- Add scheduling fields to interviews table
ALTER TABLE interviews ADD COLUMN scheduled_at timestamp with time zone;
ALTER TABLE interviews ADD COLUMN duration_minutes integer;
ALTER TABLE interviews ADD COLUMN token text UNIQUE;

-- Update status column to include new statuses
ALTER TABLE interviews ALTER COLUMN status SET DEFAULT 'scheduled';

-- Update existing interviews to have 'in_progress' status if they have transcripts
UPDATE interviews SET status = 'in_progress' WHERE array_length(CAST(transcript AS jsonb[]), 1) > 0 AND status = 'in_progress';
