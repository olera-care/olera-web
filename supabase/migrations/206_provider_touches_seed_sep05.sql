-- Migration: Seed provider_touches with the touches reconstructed on 2026-09-05
--
-- These rows are the reason the table exists: three provider threads that lived only
-- in TJ's mailbox and iMessage until they were read back from screenshots during the
-- 5 Sep Ad Boost comms session. Backfilled with their real occurred_at (UTC) and an
-- author that says so. Only confirmed sends are seeded; drafts that were queued but
-- not confirmed sent (LumiWell wrap-up, the Zardy text) are left for /touch.
--
-- Idempotent: a row is skipped when the same provider already has a touch at the
-- same occurred_at. Safe to re-run.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention. Requires 205.

INSERT INTO provider_touches
  (provider_id, channel, direction, occurred_at, summary, detail, contact_name, contact_handle,
   source, next_action, next_action_due, next_action_owner, author)
SELECT v.provider_id::uuid, v.channel, v.direction, v.occurred_at::timestamptz, v.summary, v.detail,
       v.contact_name, v.contact_handle, v.source, v.next_action, v.next_action_due::date,
       v.next_action_owner, 'claude (backfill from TJ mailbox and iMessage, 2026-09-05)'
FROM (VALUES
  -- ── Pacesetter Home Services · Sherry Pace ─────────────────────────────────
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'out', '2026-08-19 16:30:00+00',
   'A problem on your Olera page I want to fix',
   'Offered to run the campaign 90 days at no cost. Flagged that her page leads with a 1.0 rating from one blank review. Asked for 15 minutes Thu or Fri 8am her time.',
   'Sherry Pace', 'pacesetterhomeservices@outlook.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'in', '2026-08-19 18:10:00+00',
   'Yes, she wants the conversation',
   '"Yes I would like to have this conversation with you at your convenience."',
   'Sherry Pace', 'pacesetterhomeservices@outlook.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'out', '2026-08-20 06:38:00+00',
   'Call set for Thu 20 Aug 8:30am her time',
   'Calendar invite sent to (770) 949-0480. Friday as fallback.',
   'Sherry Pace', 'pacesetterhomeservices@outlook.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'call', 'out', '2026-08-20 12:33:00+00',
   'Called at 8:30 her time, no answer',
   '"Just called. Wasn''t able to reach you. Let me know when''s a better time." No reply after this; the thread went quiet.',
   'Sherry Pace', '(770) 949-0480', 'manual', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'out', '2026-08-24 02:33:00+00',
   'A family in Dallas has been trying to reach you',
   'Pointed her at the 22 Aug request in her Olera inbox. Said the Outlook notice may have been filtered to spam. First use of the Gmail address; Outlook on copy.',
   'Sherry Pace', 'sherrypace2007@gmail.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'in', '2026-08-25 21:10:00+00',
   'Opened the 22 Aug request and emailed the family; not a fit',
   '"I did open it and emailed him back, we are non medical caregivers." The family needed medical care. Outcome for the 22 Aug inquiry: not a fit.',
   'Sherry Pace', 'sherrypace2007@gmail.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'out', '2026-08-26 02:29:00+00',
   'Will try to pre-screen leads for fit',
   'Without adding so many questions that families drop off.',
   'Sherry Pace', 'sherrypace2007@gmail.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'in', '2026-08-26 02:30:00+00',
   '"Sounds good, thanks!"',
   'Replied within a minute, from the Outlook app on her phone.',
   'Sherry Pace', 'pacesetterhomeservices@outlook.com', 'gmail', NULL, NULL, NULL),
  ('4215f137-3380-4774-b474-e04d22c90e40', 'email', 'out', '2026-09-05 10:40:00+00',
   'First month numbers, the 90-day run starts this week, rating is now 3.0, call ask',
   'Reply in the 24 Aug thread, Gmail To, Outlook Cc. 285 saw the ad, 25 visited, two reached out. Heads down on grant work since; 90-day run built and published (24218593406). The July 5-star took her from 1.0 to 3.0; two more puts her at 4.0. Tuesday or Wednesday 8:30 her time. Which inbox do you check, so lead alerts go there.',
   'Sherry Pace', 'sherrypace2007@gmail.com', 'gmail',
   'On her reply: switch lead alerts to the inbox she names. Call Tue or Wed 8:30 her time and walk through asking two families for reviews.',
   '2026-09-09', 'TJ'),

  -- ── Franchil llc · Hilda Boiwo ─────────────────────────────────────────────
  ('900bf6a1-dba7-41c5-9caa-1b951ac15c97', 'email', 'out', '2026-09-05 10:50:00+00',
   'A family has a question for you',
   'A family asked on her page last night whether the same caregiver comes each time; it is waiting in her inbox. Campaign had a slow start, fixed this week, running through December at no cost. In June a few families found her and one became a client. None of our last three emails to her (23 Aug launch, 28 Aug digest, 5 Sep question) have been opened.',
   'Hilda Boiwo', 'hilda@franchilcare.com', 'gmail',
   'If nothing of ours opens by Monday, phone call. Three emails unopened since 23 Aug.',
   '2026-09-08', 'TJ'),

  -- ── Miracle-Lightstar · Zardy Dweh (prefers text) ──────────────────────────
  ('e2ee365c-eafa-467b-a9b3-60e3b4c798af', 'text', 'out', '2026-08-27 23:27:00+00',
   'Checked whether he had signed the letter; offered a digital option',
   'iMessage. "Hello. I just wanted to check if you had a chance to sign the letter yet. If printing is an issue I can look for something online where you can sign digitally."',
   'Zardy Dweh', '+1 216 635 8464', 'manual', NULL, NULL, NULL),
  ('e2ee365c-eafa-467b-a9b3-60e3b4c798af', 'text', 'in', '2026-08-27 23:40:00+00',
   'Signed NIH letter of support, dated 27 Aug, sent as an image',
   '"Yes I already did and check your email too." The signed letter is in this iMessage thread.',
   'Zardy Dweh', '+1 216 635 8464', 'manual', NULL, NULL, NULL),
  ('e2ee365c-eafa-467b-a9b3-60e3b4c798af', 'text', 'out', '2026-08-27 23:45:00+00',
   'Received; promised an update on the ad and page performance as we go',
   '"Oh thank you so much! I must have missed the email. Received!" then "I''ll give you an update on the ad/page performance as we go." He replied "Ok". That promise is what the 5 Sep note keeps.',
   'Zardy Dweh', '+1 216 635 8464', 'manual', NULL, NULL, NULL),
  ('e2ee365c-eafa-467b-a9b3-60e3b4c798af', 'email', 'out', '2026-09-05 11:00:00+00',
   'Your campaign is showing in Cleveland',
   'Slow start after the August relaunch; cause found and fixed this week; families in Cleveland seeing the ad since 4 Sep; runs through December at no cost. NIA-supported study framing. No click numbers on purpose. He prefers text; the same update goes by iMessage.',
   'Zardy Dweh', 'zd@miracle-lightstar.co', 'gmail',
   'Seven-day read of the relaunch, by text not email.',
   '2026-09-12', 'TJ')
) AS v(provider_id, channel, direction, occurred_at, summary, detail, contact_name, contact_handle,
       source, next_action, next_action_due, next_action_owner)
WHERE NOT EXISTS (
  SELECT 1 FROM provider_touches t
  WHERE t.provider_id = v.provider_id::uuid
    AND t.occurred_at = v.occurred_at::timestamptz
);

-- Zardy said he prefers text (5 Sep). The profile column only allows email|sms.
UPDATE business_profiles
   SET preferred_contact_channel = 'sms'
 WHERE id = 'e2ee365c-eafa-467b-a9b3-60e3b4c798af'
   AND preferred_contact_channel IS DISTINCT FROM 'sms';
