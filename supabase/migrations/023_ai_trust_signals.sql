-- 023: Add AI trust signals column
-- Stores AI-verified trust signals for providers not covered by CMS
-- (non-medical home care, assisted living, independent living, memory care)

ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS ai_trust_signals JSONB DEFAULT NULL;
