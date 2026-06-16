-- Provider Ad Boost — soft delete (archive) for campaign requests.
--
-- Two removal paths now exist on the /admin/ad-boost concierge queue:
--   * Hard delete (DELETE /api/admin/ad-boost) — truly removes the row. For
--     scrubbing test runs out of the queue.
--   * Soft delete / archive (POST { archived: true }) — sets `deleted_at` so the
--     request drops out of the default queue view but the record is kept. For a
--     real provider's campaign we want to pull from the queue without losing the
--     history. Restorable (POST { archived: false } clears `deleted_at`).
--
-- The column is nullable and additive, so old code ignores it and new code
-- filters on it — safe to apply ahead of the deploy on the shared instance.

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Default queue reads filter `deleted_at IS NULL`; index the live set.
CREATE INDEX IF NOT EXISTS idx_acr_deleted_at ON ad_campaign_requests(deleted_at);
