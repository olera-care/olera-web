-- 239: Read the qualifying reply before routing it, not just count it.
--
-- Migration 234 stored the family's reply and let the relay start on it. 235
-- sent an UNANSWERED lead to a person instead of a provider. Neither looks at
-- what the answer actually says, and the relay's gate is a timestamp:
--
--   const unanswered = !lead.qualification_reply_at && ...
--
-- Any inbound text sets that timestamp. So "replied" unlocks the provider
-- cascade and the words are never read. On 19 September Drema Mitchell Lowe
-- answered "I want to be a caretaker" and was offered to three Dallas agencies,
-- each of which was told a family needed care. Gwen Makone sent the same kind
-- of message on the 18th and looked like a caught case; she was not caught by
-- any guard, she simply replied at 04:52 local, outside the 8am-noon staffed
-- window, and was archived by hand before it opened.
--
-- These columns hold a verdict on the reply so the relay can act on meaning
-- rather than on the existence of a row.
--
-- THREE OUTCOMES, NOT TWO, and the third is the point. A binary route/block
-- forces a call on genuinely ambiguous text, and both errors cost something
-- different: a wrong block is recoverable (the lead keeps its phone and one
-- click routes it) while a wrong route spends provider trust, which is the
-- thing the whole programme is for. So an unsure verdict holds for a person.
--
-- NULL is meaningful: not classified yet. The relay treats it as "do not
-- route", so a classifier that is down or not yet deployed fails closed.

ALTER TABLE public.city_leads
  ADD COLUMN IF NOT EXISTS qualification_verdict          TEXT,
  ADD COLUMN IF NOT EXISTS qualification_verdict_category TEXT,
  ADD COLUMN IF NOT EXISTS qualification_verdict_reason   TEXT,
  ADD COLUMN IF NOT EXISTS qualification_verdict_at       TIMESTAMPTZ;

-- TEXT + CHECK rather than an enum, matching the rest of this schema: a new
-- value is then a one-line constraint change instead of a type migration.
-- A NULL passes a CHECK in Postgres, which is what keeps "not yet classified"
-- representable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'city_leads_qualification_verdict_check'
  ) THEN
    ALTER TABLE public.city_leads
      ADD CONSTRAINT city_leads_qualification_verdict_check
      CHECK (qualification_verdict IN ('care_seeker', 'not_care_seeker', 'unclear'));
  END IF;
END $$;

COMMENT ON COLUMN public.city_leads.qualification_verdict IS
  'What the qualifying reply means. care_seeker routes to providers; not_care_seeker never does; unclear holds for a person. NULL means not classified yet and the relay treats it as do-not-route.';
COMMENT ON COLUMN public.city_leads.qualification_verdict_category IS
  'Why, in one word. Blocking (filed automatically): looking_for_work, recruiter, media, solicitation, competitor, wrong_number, spam. Holding (a person acts, because Olera has something for them): benefits_only, general_question. Passing: care_seeker. Unsure: unclear_reply is the model saying so, unreadable is the classifier having failed — kept apart because phase two acts on these categories and a timeout must never be served to someone as though they had asked a question. Also feeds the wrong-audience split on the Meta funnel, which has been counting job seekers as families who failed to convert.';
COMMENT ON COLUMN public.city_leads.qualification_verdict_reason IS
  'One line of justification, shown in Slack and the admin panel. The point is auditability: a verdict nobody can check is worse than no verdict, because a wrong block is silent.';
COMMENT ON COLUMN public.city_leads.qualification_verdict_at IS
  'When the verdict was recorded. Its presence is what stops the lead being classified again on every five-minute tick.';

-- Partial index for the classify pass: open leads that have answered and have
-- not been judged. That set is normally empty or tiny, which is the point.
CREATE INDEX IF NOT EXISTS city_leads_awaiting_verdict_idx
  ON public.city_leads (qualification_reply_at)
  WHERE qualification_verdict IS NULL
    AND qualification_reply_at IS NOT NULL
    AND archived_at IS NULL
    AND is_test = false;

-- One-off: file the job seeker the old gate already walked into the pool.
--
-- Drema Mitchell Lowe answered "I want to be a caretaker" and was offered to
-- three providers, all of which expired. She sits at 'unfilled', which the
-- relay's scan ignores (it reads only 'new' and 'offered'), so the classify
-- pass would never reach her and she would stay open for good.
--
-- The predicate is deliberately narrow: this exact reply, never accepted, still
-- live. It is a no-op on every other row and on a second run.
UPDATE public.city_leads
   SET qualification_verdict = 'not_care_seeker',
       qualification_verdict_category = 'looking_for_work',
       qualification_verdict_reason = 'Asked to work as a caregiver rather than to hire one. Filed by migration 239; she had already been offered to three providers under the old gate.',
       qualification_verdict_at = now(),
       archived_at = COALESCE(archived_at, now()),
       archive_reason = COALESCE(archive_reason, 'looking_for_work'),
       updated_at = now()
 WHERE capture_method = 'meta_instant_form'
   AND qualification_reply = 'I want to be a caretaker'
   AND accepted_offer_id IS NULL
   AND qualification_verdict IS NULL
   AND is_test = false;
