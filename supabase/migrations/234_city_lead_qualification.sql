-- 234: Qualify a city lead by text before routing it to a provider.
--
-- The Facebook instant form collects name, phone, ZIP and an optional email.
-- Nothing about the care. The importer deliberately writes care_type='unsure'
-- rather than inferring from the ad's theme, so a native lead reaches us with
-- an entirely empty care profile, and every managed inquiry a provider has ever
-- received from us carried null care_recipient, care_type and urgency.
--
-- The confirmation SMS now asks one question ("who are you looking for care
-- for?"). This stores the answer. care_recipient is NOT the place for it: that
-- column is CHECK-constrained to parent/spouse/self/other (migration 207), and
-- a free-text reply would fail the constraint. Keep the raw words here and let
-- a human — or, later, a parser — set care_recipient from them.
--
-- qualification_reply_at is what tells the relay a lead is ready early. Without
-- a reply the relay falls back to a timer measured from created_at, so a family
-- who never answers is still routed rather than stranded.

ALTER TABLE public.city_leads
  ADD COLUMN IF NOT EXISTS qualification_reply     TEXT,
  ADD COLUMN IF NOT EXISTS qualification_reply_at  TIMESTAMPTZ;

COMMENT ON COLUMN public.city_leads.qualification_reply IS
  'Raw text of the family''s reply to the qualifying SMS. Free-form on purpose; care_recipient is constrained and is set separately once someone reads this.';
COMMENT ON COLUMN public.city_leads.qualification_reply_at IS
  'When that reply arrived. Non-null lets the offer relay start immediately instead of waiting out the qualification timer.';

-- The relay scans open leads every five minutes and now has to consider native
-- ones too. This keeps that scan cheap as the table grows.
CREATE INDEX IF NOT EXISTS city_leads_open_relay_idx
  ON public.city_leads (status, created_at)
  WHERE accepted_offer_id IS NULL AND archived_at IS NULL AND is_test = false;
