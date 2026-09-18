-- 235: An unanswered qualifying text goes to a person, not to a provider.
--
-- Migration 234 stored the family's reply and let the relay start early on it,
-- with a 60-minute timer as the fallback. The timer's destination was the
-- provider cascade: a family who never answered was routed anyway, carrying
-- nothing but a name and a phone number.
--
-- That is the exact thing we have just told two Dallas providers we would not
-- do ("we would rather hold a request back than send you another name with
-- nothing attached"), so the timer now hands the lead to a person instead. At
-- 60 minutes with no reply we post to Slack once and stop. Nothing reaches a
-- provider until either the family answers the text or someone records what
-- they learned on the phone.
--
-- This column is what makes "once" true. The relay scans every five minutes,
-- so without a stamp the same silent lead would alert twelve times an hour,
-- and an alert that repeats is an alert nobody reads.

ALTER TABLE public.city_leads
  ADD COLUMN IF NOT EXISTS qualification_escalated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.city_leads.qualification_escalated_at IS
  'When the unanswered qualifying text was handed to a person to call. Set once, by the relay, and only for leads with no qualification_reply_at. Its presence means a human owns this lead; it never routes itself.';

-- One-off repair of the two leads the old timer already walked into the pool.
--
-- Jyotsna (17 Sep 16:09) and Selam (18 Sep 03:59) never answered the qualifying
-- text, so at 60 minutes the relay offered them round a pool where every row is
-- disabled, found nobody, and marked them 'unfilled'. Under the new rule that
-- is a state an unqualified native lead cannot reach, and it is a dead end: the
-- relay's five-minute scan only looks at 'new' and 'offered', so both would sit
-- there for good. Returning them to 'new' puts them back in front of the scan,
-- which will hand each to a person to call rather than to a provider.
--
-- The predicate is specific enough to be a no-op on every other row and on a
-- second run: native capture, never actually offered to anyone, no reply, live.
UPDATE public.city_leads
   SET status = 'new', next_offer_at = NULL, updated_at = now()
 WHERE capture_method = 'meta_instant_form'
   AND status = 'unfilled'
   AND offer_count = 0
   AND qualification_reply_at IS NULL
   AND accepted_offer_id IS NULL
   AND archived_at IS NULL
   AND is_test = false;
