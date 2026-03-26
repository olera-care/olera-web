# Plan: Care Seeker Notification Emails

Created: 2026-03-20
Status: In Progress

## Goal

Build 3 missing notification emails from Esther's notification spec to lock in the care seeker experience.

## Context

4 of 6 notifications already work:
- ✅ Provider Interested in You → `providerReachOutEmail` via `matches/notify-reach-out`
- ✅ New Message from Provider → `newMessageEmail` via `connections/message` + cron reminders
- ✅ Connection Confirmation → `connectionSentEmail` via `connections/request`
- ✅ (Partial) Welcome Email → guest connections get `guestConnectionEmail`, but OAuth/OTP signups get nothing

## What We're Building

### 1. Welcome Email (non-guest signups)
- **Trigger:** New account created via Google OAuth or email OTP (not guest connection — those already get `guestConnectionEmail`)
- **Email:** "Welcome to Olera" — warm intro, link to complete profile / browse providers
- **Where to wire:** `app/auth/callback/route.ts` (OAuth) and `app/api/auth/ensure-account/route.ts` (OTP)
- **Send-once flag:** `metadata.welcome_email_sent` on business_profiles

### 2. Go Live Reminder (24-48h delay)
- **Trigger:** Profile completeness ≥ 50% but `care_post.status` !== "active" (user clicked "Not now" or just didn't go live)
- **Delay:** Account created 24-48h ago
- **Email:** "You're ready to go live — let providers find you"
- **Where to wire:** New cron job `app/api/cron/family-nudges/route.ts`
- **Send-once flag:** `metadata.go_live_reminder_sent`

### 3. Profile Incomplete Reminder (3-7 day delay)
- **Trigger:** Account exists 3+ days, profile completeness < 50% (missing care_types, city/state, or description)
- **Email:** "Complete your profile to get matched"
- **Where to wire:** Same cron job `app/api/cron/family-nudges/route.ts`
- **Send-once flag:** `metadata.profile_incomplete_reminder_sent`

## Tasks

### Phase 1: Email Templates
- [ ] 1. Add 3 email templates to `lib/email-templates.tsx`
      - `welcomeEmail` — warm intro with CTA to browse/complete profile
      - `goLiveReminderEmail` — nudge to activate Matches
      - `familyProfileIncompleteEmail` — nudge to complete profile
      - Verify: Templates export correctly, match existing style

### Phase 2: Welcome Email Wiring
- [ ] 2. Send welcome email on OAuth signup in `app/auth/callback/route.ts`
      - After account creation, send `welcomeEmail` via Resend
      - Set `welcome_email_sent: true` on family profile metadata
      - Fire-and-forget (non-blocking)
      - Verify: New OAuth user gets welcome email

- [ ] 3. Send welcome email on OTP signup in `app/api/auth/ensure-account/route.ts`
      - Same pattern — send when creating NEW account (not existing)
      - Skip if account already exists (returning user)
      - Verify: New OTP user gets welcome email

### Phase 3: Cron Job for Delayed Notifications
- [ ] 4. Create `app/api/cron/family-nudges/route.ts`
      - Job 1: Go Live Reminder — families with profile ≥ 50% complete, care_post not active, 24-48h old, not already sent
      - Job 2: Profile Incomplete — families with profile < 50%, 3+ days old, not already sent
      - CRON_SECRET auth check
      - Verify: Endpoint returns correct counts

- [ ] 5. Register cron in `vercel.json`
      - Schedule: daily at 15:00 UTC (10 AM CT)
      - Verify: vercel.json valid JSON

## Risks
- Welcome email must NOT fire for guest connections (they already get `guestConnectionEmail`)
- Cron must respect send-once flags to avoid spam
- Profile completeness check needs to match whatever the welcome page uses

## Notes
- All emails use existing `sendEmail()` from `lib/email.ts` (Resend, fire-and-forget)
- Send-once flags stored as booleans on `business_profiles.metadata` (same pattern as `matches_nudge_email_sent`)
- notification_prefs exist in types but aren't enforced yet — future enhancement
