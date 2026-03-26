-- Add metadata JSONB column to reviews for read tracking (read_by pattern)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
