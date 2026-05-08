-- Migration 079: deletion_reason column on olera-providers
--
-- Adds a structured deletion_reason to "olera-providers" so the public
-- provider page (app/provider/[slug]/page.tsx) can serve a reason-aware
-- response instead of a generic 404 for soft-deleted rows:
--
--   provider_request                            → HTTP 410 Gone
--   data_sweep | duplicate | out_of_scope | other → HTTP 301 to power page
--
-- Today every soft-deleted provider hits notFound() returning a generic
-- 404 — accounts for an estimated ~7K of the 18,281 GSC "Not found" bucket
-- bleeding link equity since the data-sweep workflow began.
--
-- Backfill strategy (two passes):
--
--   1. Rows with an audit_log entry whose details.delete_reason text exists
--      → keyword-classify into the CHECK enum. The admin PATCH at
--      app/api/admin/directory/[providerId]/route.ts:303 has been writing
--      free-form reason text via a textarea, so we pattern-match it.
--
--   2. Rows soft-deleted with NO matching audit_log entry → default to
--      'data_sweep'. The data-sweep skill at .claude/commands/data-sweep.md
--      performs bulk UPDATE deleted=true via script, bypassing the audit
--      logger — so absence-of-audit is a reliable proxy for sweep-deleted.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE "olera-providers"
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT
  CHECK (
    deletion_reason IS NULL
    OR deletion_reason IN ('data_sweep', 'provider_request', 'duplicate', 'out_of_scope', 'other')
  );

COMMENT ON COLUMN "olera-providers".deletion_reason IS
  'Why the row was soft-deleted. Drives reason-aware page response in app/provider/[slug]/page.tsx: provider_request → HTTP 410 Gone; data_sweep/duplicate/out_of_scope/other → HTTP 301 to /{category}/{state}/{city}. NULL for non-deleted rows.';

-- =============================================================================
-- Pass 1: keyword-classify from latest audit_log entry per provider.
-- =============================================================================
-- The admin UI (app/admin/directory/page.tsx:535-542) renders a free-form
-- textarea — placeholder hints "Duplicate listing, closed business, doesn't
-- fit service model" — so values are unstructured English. Keywords are
-- best-effort; the bucketing only matters insofar as 'provider_request'
-- triggers HTTP 410 (everything else gets a 301 to the power page).

WITH latest_audit AS (
  SELECT DISTINCT ON (target_id)
    target_id AS provider_id,
    LOWER(details->>'delete_reason') AS reason_text
  FROM audit_log
  WHERE target_type = 'directory_provider'
    AND details ? 'delete_reason'
    AND TRIM(COALESCE(details->>'delete_reason', '')) <> ''
  ORDER BY target_id, created_at DESC
)
UPDATE "olera-providers" AS p
SET deletion_reason = CASE
  WHEN la.reason_text ~ '\m(request|owner|takedown|removal\s+request|asked\s+to\s+be\s+removed|provider\s+removed)\M'
    THEN 'provider_request'
  WHEN la.reason_text ~ '\m(duplicate|dup\M|copy\s+of)\M'
    THEN 'duplicate'
  WHEN la.reason_text ~ '\m(out\s+of\s+scope|not\s+a\s+fit|doesn''?t\s+fit|service\s+model|wrong\s+category|not\s+senior)\M'
    THEN 'out_of_scope'
  WHEN la.reason_text ~ '\m(sweep|cleanup|data\s+clean|reclassif|closed|shut\s+down|out\s+of\s+business|bad\s+data|stale|invalid)\M'
    THEN 'data_sweep'
  ELSE 'other'
END
FROM latest_audit la
WHERE p.provider_id = la.provider_id
  AND p.deleted = TRUE
  AND p.deletion_reason IS NULL;

-- =============================================================================
-- Pass 2: deleted rows with no audit trail → assume bulk data-sweep removal.
-- =============================================================================

UPDATE "olera-providers"
SET deletion_reason = 'data_sweep'
WHERE deleted = TRUE
  AND deletion_reason IS NULL;

-- =============================================================================
-- Index supporting admin queries that filter by reason (e.g. "show all
-- provider-requested takedowns"). The public page lookup queries by slug or
-- provider_id and reads deletion_reason as a column, so no index needed
-- there.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_olera_providers_deletion_reason
  ON "olera-providers"(deletion_reason)
  WHERE deletion_reason IS NOT NULL;
