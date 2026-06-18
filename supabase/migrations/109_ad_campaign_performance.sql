-- Provider Ad Boost — manual performance entry.
--
-- Ad-platform metrics (spend, clicks) live in the Google/Meta dashboards, not
-- our DB. At concierge-v1 volume (~2-3 campaigns/week) the operator enters them
-- by hand on the campaign detail page; we then compute cost-per-family against
-- the (server-confirmed) delivered count. Total-only for now — a Google-vs-Meta
-- split can come later if it's worth the extra fields.
--
-- Spend stored in whole cents to avoid float drift. Both nullable + additive, so
-- safe to apply ahead of the deploy on the shared instance.

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS ad_spend_cents INTEGER,
  ADD COLUMN IF NOT EXISTS ad_clicks INTEGER;
