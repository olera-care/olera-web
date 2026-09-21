-- 240: Record whether an offer actually reached the provider.
--
-- Until now "we offered it to them" and "they received it" were the same row,
-- and they are not the same fact. On 20 September the Dallas chain ran three
-- times and looked, from every surface we have, like three providers passing on
-- a request. What actually happened:
--
--   Assisting Hands   landline, SMS skipped  · valid email, DELIVERED
--   Cambridge         landline, SMS skipped  · info@ address cached invalid,
--                                              suppressed, NO TRACE WRITTEN
--   Granny NANNIES    landline, SMS skipped  · same
--
-- So two of the three had never been told a lead existed, and the pool has been
-- sitting "on call" receiving nothing for two days.
--
-- Half of that was already recoverable: a skipped SMS writes an email_log row
-- with the reason. The email half was not. sendEmail only writes a failure row
-- when the CALLER has already reserved one, and the offer sender does not, so a
-- suppressed provider email returns success-with-skipped and records nothing
-- anywhere. The single Slack line saying the offer went out "by NOTHING"
-- scrolled away, which is how this survived two days.
--
-- Fixing sendEmail's internals would touch ~27 senders at once. Recording the
-- outcome HERE instead is narrow, is where the case tracker reads from, and
-- makes the distinction the tracker actually needs: offered, versus reached.

ALTER TABLE public.city_lead_offers
  ADD COLUMN IF NOT EXISTS reached_channels TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS delivery_note    TEXT;

COMMENT ON COLUMN public.city_lead_offers.reached_channels IS
  'Channels the offer actually went out on: email, sms, or both. EMPTY MEANS THE PROVIDER WAS NEVER TOLD — the offer exists, the clock ran, and nothing arrived. Do not read offered_at as contact.';
COMMENT ON COLUMN public.city_lead_offers.delivery_note IS
  'Why a channel did not land, in words a person can act on ("no mobile number on file", "email address suppressed"). Null when everything sent.';

-- Backfill from what the send log does hold, so the tracker is honest about the
-- offers already made rather than showing three days of unknowns.
--
-- Both senders stamp metadata.offer_id, so a delivered row can be matched back.
-- A suppressed email left no row at all, which is exactly why the absence has
-- to be read as "did not reach" rather than "not yet known".
--
-- FILTER ON email_type AND recipient_type, not on offer_id alone. Several
-- message types carry the same offer_id, including city_lead_accepted_family,
-- which is a text to the FAMILY. A first pass here aggregated on offer_id and
-- status only, and recorded that family text as the provider having been
-- reached — over-reporting delivery, which is the one direction that hides a
-- failure instead of surfacing it.
UPDATE public.city_lead_offers o
   SET reached_channels = COALESCE(sent.channels, '{}'),
       delivery_note = CASE
         WHEN sent.channels IS NULL
         THEN 'Nothing reached them. Backfilled from the send log: no delivered offer message is recorded against this offer.'
         ELSE NULL
       END
  FROM (
    SELECT o2.id AS offer_id,
           NULLIF(ARRAY_REMOVE(ARRAY_AGG(DISTINCT e.channel) FILTER (
             WHERE e.status = 'sent'
               AND e.email_type = 'city_lead_offer'
               AND e.recipient_type = 'provider'
           ), NULL), '{}') AS channels
      FROM public.city_lead_offers o2
      LEFT JOIN public.email_log e ON e.metadata->>'offer_id' = o2.id::text
     GROUP BY o2.id
  ) AS sent
 WHERE sent.offer_id = o.id;

-- The question the case tracker asks most often: which offers reached nobody.
CREATE INDEX IF NOT EXISTS city_lead_offers_unreached_idx
  ON public.city_lead_offers (offered_at DESC)
  WHERE reached_channels = '{}';
