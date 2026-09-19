-- 236: The website form's requests are qualified by text too, so the ones the
-- old relay already dead-ended need returning to the queue.
--
-- Migrations 234 and 235 built this for Meta instant form leads: the
-- confirmation text asks one question, the answer releases the request to a
-- provider, and silence hands it to a person. The /care/{city} form did not
-- take part. Its confirmation asked nothing, and the relay, which has no
-- concept of routing mode, offered the request round a pool where every row is
-- disabled, found nobody, and marked it 'unfilled' -- while the family was
-- being told by text that we were "still looking for the right provider".
--
-- Three families sat in that state: Steve and Cheryal in Charlotte, Jillanna in
-- Dallas. 'unfilled' reads in the admin queue as "no one on call took it",
-- which is false. No provider was ever asked, because no provider is switched
-- on in either city. It is also a dead end: the relay's five-minute scan looks
-- at 'new' and 'offered' only.
--
-- Returning them to 'new' files them as what they are: a concierge request
-- waiting for a person to call. The code change that accompanies this holds
-- them there rather than walking them into the empty pool again, so this
-- cannot loop. NOTHING IS SENT by this migration; it changes only how the
-- queue describes them.
--
-- next_offer_at goes with it. Parking stamped a morning on requests the relay
-- no longer intends to offer, and the panel renders that as "waiting for 8am",
-- which is a promise nothing now keeps.
--
-- The predicate is specific enough to be a no-op on a second run and on every
-- lead that genuinely went round a pool: website capture, in a concierge city,
-- never actually offered to anyone, unanswered, live.
UPDATE public.city_leads
   SET status = 'new', next_offer_at = NULL, updated_at = now()
 WHERE slug IN ('charlotte-nc', 'dallas-tx')
   AND capture_method = 'website'
   AND status = 'unfilled'
   AND offer_count = 0
   AND qualification_reply_at IS NULL
   AND accepted_offer_id IS NULL
   AND archived_at IS NULL
   AND is_test = false;

-- The same stale morning on leads that never reached 'unfilled'. Rhonda
-- (18 Sep, Charlotte) is parked to 8am today and would otherwise be offered
-- round the empty pool the moment the window opens.
UPDATE public.city_leads
   SET next_offer_at = NULL, updated_at = now()
 WHERE slug IN ('charlotte-nc', 'dallas-tx')
   AND capture_method = 'website'
   AND status = 'new'
   AND next_offer_at IS NOT NULL
   AND offer_count = 0
   AND qualification_reply_at IS NULL
   AND accepted_offer_id IS NULL
   AND archived_at IS NULL
   AND is_test = false;
