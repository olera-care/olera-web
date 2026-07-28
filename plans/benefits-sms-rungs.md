# Benefits SMS rungs + B2 retarget — the last loop pieces

TJ 2026-07-28: build the whole thing, then promote everything together. No
waiting on data. Branch: `benefits-sms-rungs` off staging `d5df3c72`.

## Scope (one PR)

1. **B2 check-in retarget** (coordinator, rung B2): when
   `cascade.first_step_done_at` is set, the check-in email congratulates
   instead of asks — subject `You started {program}. Here's what's next` and
   body celebrates + same 3 chips reframed (moving = "Still moving", help,
   wrong). New template variant `benefitsCheckInDoneEmail` (same emailType
   benefits_check_in, no governance change). No em dashes.

2. **SMS mirror of B1 + B2** — sent ALONGSIDE the email in the same
   coordinator rung (not a separate cron; one arbitration stays true):
   - Gate: profile.phone AND metadata.sms_consent AND
     phone_validity != 'opted_out'. Consent is REQUIRED (10DLC posture).
   - B1 SMS (template `benefitsFirstStepSms` in lib/sms/templates.ts):
     `Olera: Your first step for {program}: call {phone}{hours}. Have your
     {doc1} + {doc2} nearby. Guide: {url} Reply STOP to opt out.`
     URL = direct site programPath (no magic link — length).
   - B2 SMS (`benefitsCheckInSms`): `Olera: How's {program} going? Tap to
     tell us and get your next step: {url} Reply STOP to opt out.`
     URL = /benefits-outcome?tok={wants-token}? NO — chips need a choice;
     SMS links to the /m page instead (`{siteUrl}/m/{token}` via
     benefits_results_tokens lookup) where the living journey captures acts.
     Retarget variant when first_step_done_at: `You started {program}. Next
     step is on your plan: {url}`.
   - Sends via sendSMS (do_not_contact killswitch is inside), AWAITED, after
     the email send succeeds; SMS failure never blocks the rung (log only).
     21610 → phone_validity opted_out (copy captureFamilyPhoneAndTextResults
     handling).
   - Stamp: benefits_cascade.first_step_sms_at / check_sms_at (metadata only,
     no migrations).
   - Quiet hours: coordinator runs 17:00 UTC daily = 9-12am US — daytime.
     Acceptable; note in PR. No extra scheduling machinery.

3. **Explicitly out**: care-seeker SMS quiet-hours engine (happy-hopper
   branch), WhatsApp, new crons, reply-keyword capture (STOP/HELP already
   handled by Twilio webhooks).

## Files

- lib/sms/templates.ts: benefitsFirstStepSms, benefitsCheckInSms (+done
  variant). 160-char discipline; STOP notice on every message.
- lib/email-templates.tsx: benefitsCheckInDoneEmail + subject fn.
- app/api/cron/family-comms-coordinator/route.ts: B1/B2 rung bodies — after
  successful email send (inside the send path where plan.stamp runs? NO —
  cleaner: add optional `afterSend` hook on RungPlan, called post-send with
  sentAt; B1/B2 set it to fire the SMS + stamp sms fields via the same
  familyMeta mutation pattern).
- B2 eligibility: still requires !outcome; retarget variant chosen by
  first_step_done_at. B2 SMS needs token lookup (benefits_results_tokens by
  profile_id) inside afterSend.

## Validate

tsc; render check-in-done email (add EMAIL_VARIANTS entry) + screenshot;
SMS templates unit-print (<=320 chars, includes STOP); coordinator dry-run
(prod) — byRung unchanged counts, no sends in dry-run; NO live SMS test from
laptop (Thailand IP) — preview/staging path only if needed. PR → staging;
then TJ promotes ALL of it to main.

## Status
- [x] Branch
- [ ] SMS templates
- [ ] Check-in-done email + gallery entry
- [ ] Coordinator afterSend hook + B1/B2 wiring
- [ ] Validation + PR
