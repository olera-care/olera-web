-- ===========================================================================
-- 074 — student_outreach.viewed_at: per-row read state
-- ===========================================================================
-- v9.0 Phase 4: track whether the admin team has reviewed a row in its
-- current tab. Global (shared across the small admin team) — no per-admin
-- join table for v1, since the team is small enough that one read state
-- is the right MVP.
--
-- Semantics:
--   viewed_at IS NULL    → unread (newly surfaced, name renders bold)
--   viewed_at IS NOT NULL → read (admin has opened the drawer)
--
-- The workflow drawer fires mark_read on mount. Admin can also fire
-- mark_unread from the row overflow menu or the drawer overflow menu
-- to reset attention (e.g., wants a teammate to see it as new).
--
-- Reset behavior: when a status transition fires that meaningfully
-- shifts the row to a new tab (status change touchpoints), the action
-- handlers clear viewed_at so the row enters its new tab as unread.
-- That's wired in app code, not in the DB, so this migration is
-- purely additive.
-- ===========================================================================

ALTER TABLE student_outreach
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_so_viewed_at
  ON student_outreach (viewed_at)
  WHERE viewed_at IS NULL;

COMMENT ON COLUMN student_outreach.viewed_at IS
  'Global per-row read state. NULL = unread (renders bold + counted in '
  'TabCounts.unread). Set to NOW() when the workflow drawer mounts; '
  'cleared by mark_unread action or status-change touchpoints that move '
  'the row to a new tab.';
