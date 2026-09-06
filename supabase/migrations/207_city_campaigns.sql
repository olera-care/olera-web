-- Migration: Olera city ad campaigns (Olera-owned acquisition, routed to providers)
--
-- Context (2026-09-06): Ad Boost runs ads for ONE provider and lands on that
-- provider's directory page, which converts ~2.7% of paid clicks. The city
-- campaign is Olera's own ad for a whole city, landing on /care/{city}, whose
-- only job is to capture a family's care request and hand it to a local
-- provider who calls back. Plan of record and mocks:
-- https://claude.ai/code/artifact/55067f8b-2535-474f-990c-971dd056e2e8
--
-- Why not a row in ad_campaign_requests: that table has provider_id NOT NULL,
-- a photo-readiness gate that 409s any flip to live, a URL builder hardwired to
-- /provider/{slug}, and provider email fanout on every status change. Faking a
-- provider to fit a city in would break four things to save one table.
--
-- Four small tables:
--   city_campaigns    one row per city x channel x flight, so Google and
--                     Nextdoor spend never blend (the provider "both" rows'
--                     blind spot). Spend/clicks/impressions are hand-typed from
--                     the platform, same rule as Ad Boost; everything else is
--                     computed from the lead and offer rows.
--   city_pool         who is on call for a city, in order. enabled=false until
--                     the provider has said YES in writing to taking texted
--                     leads. Care types on the row so an AL request never goes
--                     to a home-care agency.
--   city_leads        the private request. No account, no public profile.
--                     Consent proof on the row (TCPA prior express written
--                     consent: timestamp, IP, UA, form version).
--   city_lead_offers  one row per provider per lead. The relay is sequential:
--                     offer #1 (no contact details) -> 30 min -> #2 -> #3.
--                     accepted_offer_id on the lead is claimed with a
--                     conditional update so two replies cannot both win.
--
-- ad_campaign_log gains a nullable city_campaign_id so the case-history
-- discipline (tweaks need expected_signal + review_after) carries over.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention. TEXT + CHECK,
-- not enums (feedback_schema_text_not_enum).

CREATE TABLE IF NOT EXISTS city_campaigns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL,                 -- landing page: /care/{slug}
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL,
  ring_label            TEXT,                          -- "Charlotte north ring"
  care_types            TEXT[] NOT NULL DEFAULT ARRAY['home_care','assisted_living'],
  channel               TEXT NOT NULL,
  campaign_tag          TEXT NOT NULL,                 -- = utm_campaign, shared per city
  utm_medium            TEXT NOT NULL,                 -- how a lead is attributed to THIS row
  platform_campaign_id  TEXT,
  flight_start          DATE,
  flight_end            DATE,                          -- last serving day
  budget_cents          INTEGER,
  max_cpc_cents         INTEGER,
  status                TEXT NOT NULL DEFAULT 'draft',
  ad_spend_cents        INTEGER,
  ad_clicks             INTEGER,
  ad_impressions        INTEGER,
  metrics_updated_at    TIMESTAMPTZ,
  admin_note            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT city_campaigns_channel_check CHECK (channel IN ('google','nextdoor','meta')),
  CONSTRAINT city_campaigns_status_check CHECK (status IN ('draft','scheduled','live','ended')),
  CONSTRAINT city_campaigns_unique_flight UNIQUE (slug, channel, flight_start)
);
CREATE INDEX IF NOT EXISTS city_campaigns_slug_idx ON city_campaigns (slug);

CREATE TABLE IF NOT EXISTS city_pool (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL,
  provider_id     UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  position        INTEGER NOT NULL DEFAULT 100,        -- lower goes first
  care_types      TEXT[] NOT NULL,                     -- subset of home_care, assisted_living
  enabled         BOOLEAN NOT NULL DEFAULT FALSE,      -- flipped when they say YES in writing
  phone_override  TEXT,                                -- the mobile that answers offers, if not the profile phone
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT city_pool_unique UNIQUE (slug, provider_id)
);
CREATE INDEX IF NOT EXISTS city_pool_slug_idx ON city_pool (slug, enabled, position);

CREATE TABLE IF NOT EXISTS city_leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL,
  campaign_tag          TEXT,
  utm_source            TEXT,
  utm_medium            TEXT,
  utm_campaign          TEXT,
  gclid                 TEXT,
  session_id            TEXT,
  care_recipient        TEXT,
  care_type             TEXT NOT NULL,
  urgency               TEXT,
  zip                   TEXT,
  first_name            TEXT NOT NULL,
  phone                 TEXT NOT NULL,                 -- E.164
  email                 TEXT,
  note                  TEXT,
  payment_type          TEXT,
  consent_at            TIMESTAMPTZ NOT NULL,
  consent_ip            TEXT,
  consent_ua            TEXT,
  consent_form_version  TEXT NOT NULL DEFAULT 'v1',
  status                TEXT NOT NULL DEFAULT 'new',
  accepted_offer_id     UUID,                          -- the claim; set once, conditionally
  offer_count           INTEGER NOT NULL DEFAULT 0,
  next_offer_at         TIMESTAMPTZ,                   -- parked until staffed hours
  reached_at            TIMESTAMPTZ,
  outcome               TEXT,
  outcome_at            TIMESTAMPTZ,
  outcome_source        TEXT,
  admin_note            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT city_leads_care_type_check CHECK (care_type IN ('home_care','assisted_living','unsure','medical')),
  CONSTRAINT city_leads_recipient_check CHECK (care_recipient IS NULL OR care_recipient IN ('parent','spouse','self','other')),
  CONSTRAINT city_leads_urgency_check CHECK (urgency IS NULL OR urgency IN ('this_week','this_month','planning')),
  CONSTRAINT city_leads_status_check CHECK (status IN (
    'new','offered','accepted','contacted','client','no_fit','unreachable','unfilled','redirected','stopped'
  )),
  CONSTRAINT city_leads_outcome_check CHECK (outcome IS NULL OR outcome IN ('client','talking','no')),
  CONSTRAINT city_leads_outcome_source_check CHECK (outcome_source IS NULL OR outcome_source IN ('provider_sms','family_sms','admin'))
);
CREATE INDEX IF NOT EXISTS city_leads_slug_created_idx ON city_leads (slug, created_at DESC);
CREATE INDEX IF NOT EXISTS city_leads_phone_idx ON city_leads (phone);
CREATE INDEX IF NOT EXISTS city_leads_pending_idx ON city_leads (status, next_offer_at) WHERE status IN ('new','offered');

CREATE TABLE IF NOT EXISTS city_lead_offers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID NOT NULL REFERENCES city_leads(id) ON DELETE CASCADE,
  provider_id       UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  position          INTEGER NOT NULL,                  -- 1st, 2nd, 3rd offer on this lead
  provider_phone    TEXT,                              -- last 10 digits, for matching the reply
  offered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  accepted_at       TIMESTAMPTZ,
  declined_at       TIMESTAMPTZ,
  decline_reason    TEXT,
  expired_at        TIMESTAMPTZ,
  connection_id     UUID,                              -- reserved: the connections row, once we create one on accept
  first_contact_at  TIMESTAMPTZ,
  outcome           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT city_lead_offers_unique UNIQUE (lead_id, provider_id),
  CONSTRAINT city_lead_offers_reason_check CHECK (decline_reason IS NULL OR decline_reason IN ('capacity','area','payment','medical','other'))
);
CREATE INDEX IF NOT EXISTS city_lead_offers_open_idx ON city_lead_offers (provider_phone, offered_at DESC)
  WHERE accepted_at IS NULL AND declined_at IS NULL AND expired_at IS NULL;
CREATE INDEX IF NOT EXISTS city_lead_offers_lead_idx ON city_lead_offers (lead_id, position);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'city_leads_accepted_offer_fk') THEN
    ALTER TABLE city_leads
      ADD CONSTRAINT city_leads_accepted_offer_fk
      FOREIGN KEY (accepted_offer_id) REFERENCES city_lead_offers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Case history carries over. An entry may now attach to a city campaign instead.
ALTER TABLE ad_campaign_log ADD COLUMN IF NOT EXISTS city_campaign_id UUID REFERENCES city_campaigns(id) ON DELETE SET NULL;
ALTER TABLE ad_campaign_log DROP CONSTRAINT IF EXISTS ad_campaign_log_needs_subject;
ALTER TABLE ad_campaign_log ADD CONSTRAINT ad_campaign_log_needs_subject CHECK (
  request_id IS NOT NULL OR google_campaign_id IS NOT NULL OR city_campaign_id IS NOT NULL
);

-- Admin-only: RLS on, no policies. Service role only. city_leads holds names and
-- phone numbers; nothing here may be readable through PostgREST.
ALTER TABLE city_campaigns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_pool        ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_leads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_lead_offers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed: the two arms decided 2026-09-06 (TJ). Stage one Mon 7 to Sun 20 Sep,
-- $300 per Google arm, $50 Nextdoor on the Charlotte arm, $6 cap. Draft until
-- the platform campaign is published; the admin flips status to live.
-- ---------------------------------------------------------------------------
INSERT INTO city_campaigns (slug, city, state, ring_label, channel, campaign_tag, utm_medium, flight_start, flight_end, budget_cents, max_cpc_cents, status)
VALUES
  ('concord-nc', 'Concord', 'NC', 'Charlotte north ring', 'google',   'olera-concord-sep26', 'paid_search', '2026-09-07', '2026-09-20', 30000, 600, 'draft'),
  ('concord-nc', 'Concord', 'NC', 'Charlotte north ring', 'nextdoor', 'olera-concord-sep26', 'paid_social', '2026-09-07', '2026-09-20',  5000, NULL, 'draft'),
  ('garland-tx', 'Garland', 'TX', 'DFW ring',             'google',   'olera-garland-sep26', 'paid_search', '2026-09-07', '2026-09-20', 30000, 600, 'draft')
ON CONFLICT (slug, channel, flight_start) DO NOTHING;

-- Pools. enabled stays FALSE until the provider replies YES to the pre-commit.
-- Position = the order offers go out. Verified/responsive accounts from the
-- 2026-09-06 read; ids are business_profiles.
INSERT INTO city_pool (slug, provider_id, position, care_types, notes) VALUES
  ('concord-nc', 'a532ce55-c006-40a0-948f-0eb90585404d', 10, ARRAY['home_care'],       'Graceful Homecare, Concord. Ad Boost partner, answers questions, Nextdoor pilot.'),
  ('concord-nc', 'ee7b7993-0ab0-46d1-a6de-23d214cc7466', 20, ARRAY['home_care'],       'Cornerstone Caregiving, Huntersville.'),
  ('concord-nc', 'dcf8c226-c17e-4d9c-be0b-183a5252df72', 30, ARRAY['home_care'],       'HomeWell Care Services, Charlotte.'),
  ('concord-nc', 'c986e71d-6f6d-496f-a204-18f8229e665f', 10, ARRAY['assisted_living'], 'Legacy Haven Senior Care, Harrisburg. Ad Boost partner, Medicaid accepted.'),
  ('garland-tx', '73e20465-7bbe-4955-94c4-954a2d1a176e', 10, ARRAY['home_care'],       'Assisting Hands Dallas/Richardson. Ad Boost campaign scheduled 7 Sep.'),
  ('garland-tx', '9babeaca-7a81-4a36-b9d3-cb5a36ad64d0', 20, ARRAY['home_care'],       'Cambridge Caregivers, Dallas.'),
  ('garland-tx', 'fe1b11b8-00c3-41b9-b3a6-4d2e1a079c90', 30, ARRAY['home_care'],       'Granny NANNIES of Dallas.'),
  ('garland-tx', '07e5a897-7b84-4df1-8776-2f64b3dd75fe', 40, ARRAY['home_care'],       'Palm2Palm Senior Care, Frisco.'),
  ('garland-tx', 'cffa2187-e85c-4572-905f-b85b08d7824c', 10, ARRAY['assisted_living'], 'Bansfield Residential Assisted Living, Garland.'),
  ('garland-tx', 'e9736b7b-98fd-445d-b038-ced85624b46e', 20, ARRAY['assisted_living'], 'Golden Horizon Senior Assisted Living, Plano.'),
  ('garland-tx', '66fbbf06-7d9d-4d5b-8dc7-55ede40a23f1', 30, ARRAY['assisted_living'], 'Care Mountain Plano (memory care).')
ON CONFLICT (slug, provider_id) DO NOTHING;
