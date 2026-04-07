-- Add verification metadata columns to sbf_state_programs
-- Supports the benefits data quality pipeline: every claim needs a source URL
-- and a verification date before a state goes live.

ALTER TABLE sbf_state_programs
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_date DATE,
  ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS savings_source TEXT,
  ADD COLUMN IF NOT EXISTS savings_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Same columns for federal programs (shared schema)
ALTER TABLE sbf_federal_programs
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_date DATE,
  ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS savings_source TEXT,
  ADD COLUMN IF NOT EXISTS savings_verified BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN sbf_state_programs.source_url IS 'Official .gov source URL for this program''s data';
COMMENT ON COLUMN sbf_state_programs.last_verified_date IS 'Date when program data was last verified against source';
COMMENT ON COLUMN sbf_state_programs.verified_by IS 'Who verified: chantel, pipeline, etc.';
COMMENT ON COLUMN sbf_state_programs.savings_source IS 'Where the savings estimate came from (official benefit schedule, category estimate, etc.)';
COMMENT ON COLUMN sbf_state_programs.savings_verified IS 'True if savings estimate is researched per-program, false if category-based guess';
