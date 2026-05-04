-- Migration: accounts.signup_source
--
-- Context: We're mounting BenefitsDiscoveryModule (SBF V3) on
-- /caregiver-support/[slug] editorial articles in addition to /provider/[slug]
-- pages. To answer "conversion by entry page" 4-6 weeks after ship, we need
-- to know which surface produced each family profile.
--
-- The /api/benefits/save-results route writes a row to `accounts` for every
-- new family. Stamping signup_source there gives us a clean JOIN target for
-- downstream funnel analysis (account → provider sign-in / connection /
-- whatever the conversion event ends up being).
--
-- Existing rows (provider-page submissions before this migration) stay NULL
-- and should be treated as "provider_page" by analytics queries via
-- COALESCE(signup_source, 'provider_page').
--
-- New writes:
--   - editorial mounts:  signup_source = '/caregiver-support/{slug}'
--   - provider mounts:   signup_source = NULL  (could fill in v2 if useful)
--   - other entry points (future): pass their own path
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS signup_source TEXT NULL;

-- Partial index — most rows are NULL (provider-page legacy + provider mounts
-- if we keep those NULL), and we'll only ever filter / GROUP BY when source
-- is set. Keeps the index small.
CREATE INDEX IF NOT EXISTS accounts_signup_source_idx
  ON accounts (signup_source)
  WHERE signup_source IS NOT NULL;

COMMENT ON COLUMN accounts.signup_source IS
  'Path of the page where the family submitted the SBF intake. NULL for legacy / provider-page writes. Populated for editorial mounts (e.g., /caregiver-support/what-is-the-va-caregiver-functional-assessment) so downstream conversion analysis can segment by entry page.';
