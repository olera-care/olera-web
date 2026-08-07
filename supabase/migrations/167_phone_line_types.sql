-- Migration: phone_line_types — don't text numbers that can't receive texts
--
-- Context: ~68% of our provider inquiry alerts never arrive. The dominant
-- Twilio error is 30006 "Landline or unreachable carrier", because provider
-- phones come from the `olera-providers` directory (107k scraped business
-- numbers), not from anything a provider gave us. We are texting front-desk
-- landlines and business VoIP systems.
--
-- The dollar cost is trivial (~$1.50/month). The real risk is carrier
-- reputation: a sustained 68% undelivered rate on our A2P 10DLC campaign
-- threatens the traffic that DOES matter — benefits SMS to families, which
-- currently delivers at 94%. This table protects that.
--
-- Evidence for the mobile-only policy (n=36 sampled against real outcomes):
--   delivered → 18/18 mobile
--   failed    → 8 fixedVoip, 5 nonFixedVoip, 4 landline, 1 mobile
-- No non-mobile number has ever delivered, so nonFixedVoip is blocked too
-- despite Google Voice being technically SMS-capable. The single failed
-- mobile is why send history outranks a lookup: an actual delivery outcome
-- beats a prediction.
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS phone_line_types (
  -- Last 10 digits: the same key sms_inbound and do_not_contact use, so all
  -- three agree without reformatting.
  phone_last10 text PRIMARY KEY,

  -- Twilio Lookup line_type_intelligence: mobile | landline | fixedVoip |
  -- nonFixedVoip | personal | tollFree | premium | sharedCost | uan | voicemail
  -- | pager | unknown. NULL when the row came from send history instead.
  line_type    text,
  carrier      text,

  -- The decision, precomputed. Stored rather than derived so the policy that
  -- was applied stays visible even if the policy later changes.
  sms_capable  boolean NOT NULL,

  -- 'send_history' = we actually tried and observed the outcome (authoritative).
  -- 'lookup'       = Twilio predicted it before we ever sent.
  source       text NOT NULL CHECK (source IN ('lookup', 'send_history')),

  checked_at   timestamptz NOT NULL DEFAULT now()
);

-- The hot path is a single point lookup by phone_last10, already covered by
-- the primary key. This one supports "show me what we're skipping and why".
CREATE INDEX IF NOT EXISTS idx_phone_line_types_capable
  ON phone_line_types (sms_capable, checked_at DESC);

ALTER TABLE phone_line_types ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE phone_line_types IS
  'Cache of whether a phone can receive SMS. Checked by sendSMS({requireMobile:true}) before texting directory-sourced provider numbers. See migration 167.';
