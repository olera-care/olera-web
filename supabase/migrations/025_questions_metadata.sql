-- Add metadata JSONB column to provider_questions for needs_provider_email flag
ALTER TABLE provider_questions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
