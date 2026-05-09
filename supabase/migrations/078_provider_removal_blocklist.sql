-- Migration 078: provider_removal_blocklist
--
-- Canonical record of providers we must never re-add to the directory,
-- stored separately from olera-providers so that:
--
--   1. Hard-deleted-era takedowns (pre-soft-delete) can still be recorded
--      even though the original row is gone with no audit trail.
--   2. Provider-requested removals carry an explicit ethical/legal flag
--      ('reason = provider_request') distinct from data-sweep deletions.
--   3. A periodic audit script can match incoming pipeline candidates
--      against this table without depending on olera-providers.deleted
--      (which only knows about soft-deletes).
--
-- Match strategy: normalized_name + state primary, phone + place_id as
-- secondary signals. Normalization (see lib/normalize-provider-name.ts)
-- collapses article prefixes, punctuation, & → and, business suffixes.
--
-- This table is admin-only (RLS + service role for all reads/writes).
-- Surfaced at /admin/removal-blocklist for human visibility + edits.
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS provider_removal_blocklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  normalized_name text NOT NULL,
  city text,
  state text,
  phone text,
  place_id text,
  reason text NOT NULL CHECK (reason IN ('provider_request', 'data_sweep', 'duplicate', 'out_of_scope', 'other')),
  evidence text,
  notes text,
  added_by_email text,
  added_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (normalized_name, state)
);

CREATE INDEX IF NOT EXISTS idx_blocklist_normalized_name ON provider_removal_blocklist(normalized_name);
CREATE INDEX IF NOT EXISTS idx_blocklist_phone ON provider_removal_blocklist(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocklist_place_id ON provider_removal_blocklist(place_id) WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blocklist_reason ON provider_removal_blocklist(reason);

ALTER TABLE provider_removal_blocklist ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE provider_removal_blocklist IS
  'Providers that must never be re-added to the directory. Independent of olera-providers.deleted so hard-deleted-era takedowns are still enforced. Checked periodically by audit script + manually via /admin/removal-blocklist.';

-- ============================================================================
-- Seed: provider-requested takedowns confirmed from email + GSC removal history
-- ============================================================================
-- Sources cross-referenced from screenshots on 2026-05-08:
--   • GSC > Removals (5 entries with submission dates)
--   • Inbox search "removed" (provider-initiated email correspondence)
--
-- Ambiguous cases NOT seeded (can be added via admin UI):
--   • UniversaCare (James Perdomo, 2025-12-02) — "Email Change Request" not a removal
--   • ComForCare (rdavis@, 2025-11-18) — "Email Change Request" not a removal
--   • Suwanna Buntyn "Conflict of interest" (2025-11-27) — business name unclear
--   • "17 Ga..." Nitu Aggarwal (2026-02-18) — provider name truncated in screenshot

INSERT INTO provider_removal_blocklist
  (provider_name, normalized_name, city, state, reason, evidence, added_by_email)
VALUES
  (
    'Conejo Valley Congregate Healthcare',
    'conejo valley congregate healthcare',
    'Port Hueneme', 'CA',
    'provider_request',
    'Email from staff@conejovalleyhealthcare.com on 2026-04-14. GSC temporary removal submitted 2026-04-14.',
    'tfalohun@gmail.com'
  ),
  (
    'Kendra''s Place',
    'kendras place',
    NULL, NULL,
    'provider_request',
    'Email from Kendra Sparks on 2026-03-28. GSC temporary removal submitted 2026-03-28 (expired).',
    'tfalohun@gmail.com'
  ),
  (
    'Johnson Residential Care',
    'johnson residential care',
    NULL, 'CA',
    'provider_request',
    'Email from johnsonsmod@aol.com on 2026-01-21. GSC temporary removal submitted 2026-01-21 (expired).',
    'tfalohun@gmail.com'
  ),
  (
    'The Mariemont Care Center',
    'mariemont care center',
    NULL, NULL,
    'provider_request',
    'Email from laraejohnson91@gmail.com on 2025-12-22. GSC temporary removal submitted 2025-12-22 (expired). Drove ~1,550 GSC clicks/16mo before removal — top historical query.',
    'tfalohun@gmail.com'
  ),
  (
    'Next Best Home',
    'next best home',
    NULL, 'CA',
    'provider_request',
    'Email from NEXT BEST HOME on 2025-11-18 ("Please remove my listing from your site"). GSC temporary removal submitted 2025-11-18 (expired).',
    'tfalohun@gmail.com'
  )
ON CONFLICT (normalized_name, state) DO NOTHING;
