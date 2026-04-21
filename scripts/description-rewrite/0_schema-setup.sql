-- Schema setup for the SEO description rewrite pipeline.
--
-- Run once in the Supabase SQL editor before the first rewrite wave.
-- Idempotent: IF NOT EXISTS guards let you re-run safely.

-- 1. Backup column on olera-providers. Populated with the pre-rewrite value
--    the FIRST time a row is rewritten. Never overwritten after that, so a
--    single UPDATE against this column restores every row if we need to roll
--    back the entire batch.
ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS provider_description_v1_backup text;

-- 2. Audit log. One row per rewrite attempt, including rejections by the
--    diff-check. Lets us inspect prompt quality, variant distribution, and
--    per-page baselines for the 4-week CTR comparison.
CREATE TABLE IF NOT EXISTS provider_description_rewrites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text NOT NULL,
  wave integer NOT NULL,
  style_variant text NOT NULL,            -- "A", "B", "C"...
  model text NOT NULL,                    -- e.g. "claude-haiku-4-5-20251001"
  original_first_sentence text,
  new_first_sentence text,
  status text NOT NULL,                   -- "applied" | "rejected_length" | "rejected_missing_fact" | "rejected_llm_error"
  reject_reason text,
  impressions_current integer,            -- baseline from the GSC CSV at rewrite time
  clicks_current integer,
  ctr_current numeric,
  position_current numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_description_rewrites_provider_id_idx
  ON provider_description_rewrites (provider_id);

CREATE INDEX IF NOT EXISTS provider_description_rewrites_wave_idx
  ON provider_description_rewrites (wave);
