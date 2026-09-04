-- Record WHEN the operator-entered ad-platform metrics were last typed in.
--
-- WHY: ad_spend_cents / ad_clicks / ad_impressions are hand-copied from the
-- Google, Meta, or Nextdoor dashboard. Nothing refreshes them, and nothing
-- showed how old they were, so a snapshot silently became "the truth" in the
-- concierge queue and in the provider's demand receipt.
--
-- Concretely, on 2026-08-20 every live campaign's metrics dated from 2026-08-14:
--   Pacesetter    typed 13 clicks; 12 measured landings as of Aug 14, 19 by Aug 20
--   Rosemonte     typed  0 clicks and $0 spend; 10 measured landings, all after Aug 14
--   Edmonds Villa typed  0 clicks and $0 spend;  3 measured landings, all after Aug 14
-- Rosemonte and Edmonds read as dead campaigns for six days while delivering.
-- The numbers were not wrong when entered — they were just old, and nothing
-- said so.
--
-- Written by the admin PATCH branch whenever any of the three metric fields is
-- present in the request body, including when set back to null: "the operator
-- looked and cleared it" is itself a fresh observation.

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS metrics_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN ad_campaign_requests.metrics_updated_at IS
  'When ad_spend_cents/ad_clicks/ad_impressions were last saved by an operator. NULL means those figures predate this instrumentation (2026-08-20) and their age is unknown — render them as undated rather than guessing.';

-- Deliberately NOT backfilled from updated_at. That column moves on every write
-- to the row (status flips, notes, photo review, flight dates), so it is an
-- upper bound on when metrics were entered, not the time itself. Using it would
-- understate staleness — showing "as of Aug 14" for figures typed on Aug 2 —
-- which is worse than showing nothing, because it looks precise. Existing rows
-- stay NULL until someone next saves metrics. Same reasoning as migration 182.
