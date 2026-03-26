# Plan: MedJobs — Trigger Account Creation on Onboarding Form Submission

Created: 2026-03-23
Status: Not Started
Notion Task: [Link](https://www.notion.so/32c5903a0ffe811e80eadeb088f96bd3)

## Goal

When a student submits the MedJobs onboarding form, immediately create a Supabase Auth user + accounts row, link it to the student profile, send an enhanced welcome email with login link + next steps, and provide document upload endpoints for driver's license and car insurance.

## Current State

- Onboarding form (`/medjobs/apply`) creates a `business_profiles` row with `type: "student"` and `account_id: null`
- Welcome email fires via Resend but doesn't include login/auth info (no account exists)
- Video submission page exists at `/medjobs/submit-video`
- Photo upload exists at `/api/medjobs/upload-photo` (public bucket)
- No document upload infrastructure for sensitive PII (license, insurance)
- `ensure-account` flow exists for post-login linking but isn't triggered during apply

## Success Criteria

- [ ] Student gets a Supabase Auth account immediately on form submit
- [ ] `business_profiles.account_id` is populated (not null) after submit
- [ ] `accounts` row is created and linked
- [ ] Enhanced welcome email sends with: magic link to sign in, document upload instructions, video submission CTA
- [ ] `/api/medjobs/upload-document` endpoint accepts driver's license and car insurance uploads
- [ ] Documents stored in private Supabase Storage bucket (not public)
- [ ] Video nudge email fires (via existing `profileIncompleteNudgeEmail` template or new dedicated template)
- [ ] Existing flow (profile creation, Slack alert, Loops event) unchanged

## Tasks

### Phase 1: Auth Account Creation on Submit (Core)

- [ ] 1. Add auth user creation to `/api/medjobs/apply/route.ts`
      - After profile insert succeeds, call `supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { display_name, source: "medjobs" } })`
      - Create `accounts` row with `user_id`, `display_name`, `onboarding_completed: true`
      - Update `business_profiles` row to set `account_id` and `claim_state: "claimed"`
      - Handle duplicate email gracefully (user may already have a Supabase Auth user from care-seeker flow)
        - If auth user exists: look up their account, link student profile to it
        - If account exists but no student profile link: just set `account_id`
      - Files: `app/api/medjobs/apply/route.ts`
      - Verify: Submit form → check Supabase Auth dashboard for new user + `accounts` table for row + `business_profiles.account_id` is set

- [ ] 2. Generate magic link for welcome email
      - After user creation, call `supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: "/portal/medjobs" } })`
      - Pass the magic link URL to the welcome email template
      - Files: `app/api/medjobs/apply/route.ts`
      - Verify: Check email contains a valid sign-in link → clicking it logs the student in

### Phase 2: Enhanced Welcome Email

- [ ] 3. Update `studentWelcomeEmail` template with new content
      - Add "Sign in to your account" button with magic link
      - Update activation checklist:
        1. Submit intro video (required — existing)
        2. Upload driver's license (required — new)
        3. Upload car insurance (required — new)
      - Keep existing university display block
      - Add "What happens next" section: review timeline, when providers can see profile
      - Files: `lib/medjobs-email-templates.tsx`
      - Verify: Render email HTML in browser, confirm layout and links

- [ ] 4. Add video nudge email trigger
      - In the apply route, after welcome email, schedule a follow-up nudge
      - Option A (simple): Add a `video_nudge_sent_at` field to metadata, use existing `medjobs-nudge` cron to check for students without video after 24h
      - Option B (immediate): The existing `/api/cron/medjobs-nudge` route already handles this — just ensure newly created profiles are picked up by it
      - Files: `app/api/medjobs/apply/route.ts`, possibly `app/api/cron/medjobs-nudge/route.ts`
      - Verify: Create test student → wait for cron or manually trigger → nudge email fires

### Phase 3: Document Upload Infrastructure

- [ ] 5. Create private storage bucket for sensitive documents
      - Bucket name: `student-documents` (private, NOT public)
      - Allowed types: JPEG, PNG, WebP, PDF
      - Max size: 10MB per file
      - Path pattern: `{profileId}/drivers-license/{timestamp}.{ext}` and `{profileId}/car-insurance/{timestamp}.{ext}`
      - Files: `app/api/medjobs/upload-document/route.ts` (new)
      - Verify: Upload a test file → confirm it's in Supabase Storage → confirm public URL returns 403 (private bucket)

- [ ] 6. Build `/api/medjobs/upload-document` endpoint
      - POST endpoint accepting FormData: `file`, `profileId`, `documentType` (enum: `drivers_license`, `car_insurance`)
      - Validate: file type, size, document type enum
      - Upload to private `student-documents` bucket
      - Update student profile metadata: `drivers_license_url` / `car_insurance_url` + `_uploaded_at` timestamps
      - Auth check: require authenticated user whose `account_id` matches the profile's `account_id`
      - Files: `app/api/medjobs/upload-document/route.ts` (new)
      - Depends on: Task 1 (account must exist), Task 5 (bucket must exist)
      - Verify: Authenticated upload succeeds → metadata updated → unauthenticated upload returns 401

- [ ] 7. Add document upload UI to video submission / post-apply flow
      - After form submit success screen, show "Next Steps" with upload buttons
      - Or: add to `/medjobs/submit-video` page as additional steps below video
      - Simple file input + upload button for each document type
      - Show upload status (pending/uploaded) per document
      - Files: `app/medjobs/submit-video/page.tsx` or new `app/medjobs/complete-profile/page.tsx`
      - Depends on: Task 6
      - Verify: Upload driver's license + car insurance → both show as uploaded → metadata confirms

### Phase 4: Profile Completeness Update

- [ ] 8. Update completeness calculation to include new required fields
      - Add weights for: `drivers_license_url` (10%), `car_insurance_url` (10%)
      - Rebalance existing weights to total 100%
      - Files: `app/api/medjobs/apply/route.ts` (computeCompleteness function)
      - Verify: Profile with all fields + documents = 100%

## Risks

| Risk | Mitigation |
|------|------------|
| Duplicate auth user (student already signed up as care seeker) | Check for existing auth user by email first; link to existing account if found |
| Magic link expiration (links expire after default 1h) | Welcome email text says "sign in anytime" — student can always use normal login |
| Private bucket RLS complexity | Use service role key for uploads (same as photo upload pattern); auth checked at API route level |
| PII in storage (license, insurance) | Private bucket + no public URLs + auth-gated access endpoint if needed later |
| Video nudge timing | Lean on existing cron (`medjobs-nudge`) rather than building new scheduling |

## Architecture Decisions

1. **`admin.createUser` over `signUp`**: Server-side creation with service role key. No password needed — students use magic link or Google OAuth to sign in. `email_confirm: true` skips verification (we already have their email from the form).

2. **Private bucket for documents, not public**: Driver's license and car insurance are PII. Unlike profile photos (public bucket), these must be access-controlled. Admin/provider access to these docs is a future concern — for now, just store them securely.

3. **Extend existing submit-video page vs new page**: Adding document uploads to the existing submit-video flow keeps the funnel tight (one page to complete everything) rather than spreading across multiple pages.

4. **Reuse `profileIncompleteNudgeEmail` for video nudge**: Template already handles missing items list and completeness %. No new template needed.

## Notes

- The `ensure-account` route handles the case where a student logs in later without having gone through apply — it creates accounts + family profiles. We need to ensure it doesn't create a duplicate account if one was already made during apply.
- The welcome email currently says "Your account has been created" which is misleading since no account exists today. After this work, that copy becomes accurate.
- Logan's audit flagged this as a launch blocker. The document collection (license, insurance) is legally required before students can be placed with providers.
