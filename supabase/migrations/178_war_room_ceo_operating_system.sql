-- War Room v2: separate private investigation from founder-facing agenda work.
--
-- The first operating-agent release could only emit repository tasks. This
-- migration broadens the action vocabulary, gives discovery durable private
-- case files, and stores the company model used to judge opportunity cost.

ALTER TABLE war_room_proposals
  DROP CONSTRAINT IF EXISTS war_room_proposals_action_kind_check;

ALTER TABLE war_room_proposals
  ADD CONSTRAINT war_room_proposals_action_kind_check
  CHECK (action_kind IN (
    'code', 'research', 'operations', 'business_development', 'content', 'decision'
  ));

ALTER TABLE war_room_proposals
  ADD COLUMN IF NOT EXISTS domain text NOT NULL DEFAULT 'company'
    CHECK (domain IN (
      'company', 'customer', 'provider', 'growth', 'revenue', 'product',
      'content', 'operations', 'market', 'data'
    )),
  ADD COLUMN IF NOT EXISTS decision_required text,
  ADD COLUMN IF NOT EXISTS why_better_than_alternatives text,
  ADD COLUMN IF NOT EXISTS cheapest_falsification text,
  ADD COLUMN IF NOT EXISTS existing_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strategic_case jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS war_room_company_models (
  key                   text PRIMARY KEY,
  purpose               text NOT NULL,
  stage                 text NOT NULL,
  north_star            text NOT NULL,
  current_priorities    jsonb NOT NULL DEFAULT '[]'::jsonb,
  strategic_bets        jsonb NOT NULL DEFAULT '[]'::jsonb,
  constraints           jsonb NOT NULL DEFAULT '[]'::jsonb,
  guardrails            jsonb NOT NULL DEFAULT '[]'::jsonb,
  strategic_questions   jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by            text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

INSERT INTO war_room_company_models (
  key,
  purpose,
  stage,
  north_star,
  current_priorities,
  strategic_bets,
  constraints,
  guardrails,
  strategic_questions
) VALUES (
  'olera',
  'Help families find and act on trustworthy senior-care options while building a durable, efficient company.',
  'Early-stage marketplace proving repeatable family acquisition, provider participation, and revenue.',
  'More families successfully connect with appropriate care while Olera learns a repeatable, economically durable way to create that outcome.',
  '["Increase useful family outcomes", "Improve reachable and responsive provider supply", "Find repeatable revenue", "Protect distribution resilience"]'::jsonb,
  '["Provider pages", "Benefits guidance", "Editorial content", "Provider participation", "Ad Boost and other provider revenue"]'::jsonb,
  '["Founder attention is scarce", "Company-wide revenue and cost data are not yet consolidated", "Some provider contact information is missing or stale"]'::jsonb,
  '["Protect families and providers", "Do not trade trust for short-term metrics", "No autonomous sends, spend, deployment, deletion, or production mutation", "Prefer reversible learning before expensive commitment"]'::jsonb,
  '["Which acquisition loops are durable beyond Google?", "Where does family demand exceed reachable provider supply?", "Why do providers fail to engage?", "Which value can Olera reliably monetize?"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS war_room_investigations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id      uuid REFERENCES war_room_discovery_runs(id) ON DELETE SET NULL,
  proposal_id           uuid REFERENCES war_room_proposals(id) ON DELETE SET NULL,
  fingerprint           text NOT NULL UNIQUE,
  status                text NOT NULL DEFAULT 'investigating'
    CHECK (status IN ('investigating', 'watchlist', 'decision_ready', 'closed', 'superseded')),
  domain                text NOT NULL CHECK (domain IN (
    'company', 'customer', 'provider', 'growth', 'revenue', 'product',
    'content', 'operations', 'market', 'data'
  )),
  title                 text NOT NULL,
  situation             text NOT NULL,
  why_it_matters        text NOT NULL,
  likely_cause          text NOT NULL,
  cause_confidence      text NOT NULL CHECK (cause_confidence IN ('high', 'medium', 'low')),
  existing_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  unknowns              jsonb NOT NULL DEFAULT '[]'::jsonb,
  options               jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence              jsonb NOT NULL DEFAULT '[]'::jsonb,
  counter_evidence      text NOT NULL,
  readiness_reason      text NOT NULL,
  impact                text NOT NULL CHECK (impact IN ('high', 'medium', 'low')),
  urgency               text NOT NULL CHECK (urgency IN ('now', 'soon', 'monitor')),
  strategic_fit         text NOT NULL CHECK (strategic_fit IN ('central', 'adjacent', 'peripheral')),
  founder_attention_minutes integer NOT NULL DEFAULT 0
    CHECK (founder_attention_minutes BETWEEN 0 AND 240),
  occurrence_count      integer NOT NULL DEFAULT 1,
  first_seen_at         timestamptz NOT NULL DEFAULT now(),
  last_seen_at          timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_war_room_investigations_queue
  ON war_room_investigations (status, impact, urgency, last_seen_at DESC);

ALTER TABLE war_room_company_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE war_room_investigations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE war_room_company_models IS
  'Founder-editable company model used by War Room to judge materiality and opportunity cost.';
COMMENT ON TABLE war_room_investigations IS
  'Private evidence-backed opportunity dossiers. Most never become founder-facing proposals.';
