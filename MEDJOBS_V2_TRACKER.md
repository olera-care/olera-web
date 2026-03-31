# MedJobs v2 — Execution Tracker

## Phase 1: Onboarding Streamline + Email Engine (Week 1-2)

- [x] **1F** Build server-side completeness function (`lib/medjobs-completeness.ts`)
- [x] **1F** Refactor portal to import from shared completeness function
- [x] **1A** Audit all step number references in apply page
- [x] **1A** Remove Step 2 (background) from onboarding, renumber to 3 steps
- [x] **1A** Add experience/certifications/care types/languages sections to portal
- [x] **1B** New account creation email + send from apply-partial API
- [x] **1C** Remove sign-in subtext from success page
- [x] **1D** Upgrade nudge cron — threshold <100%, cadence, nudge_count
- [x] **1E** Activation email trigger + template (in nudge cron)
- [x] **1** Type-check, self-review, commit, push

## Phase 2: Year-Round Availability Model (Week 2-3)

- [x] **2A** Define seasonal_availability metadata structure
- [x] **2B** Build seasonal availability UI in portal (4-season card)
- [x] **2C** Update candidate detail page with seasonal availability display
- [x] **2D** Legacy fallback — no migration needed, backward compatible
- [x] **2** Type-check, self-review, commit, push

## Phase 3: Interview Scheduling System (Week 3-5)

- [x] **3A** Create interviews table migration (SQL + RLS policies)
- [x] **3B** Build scheduling API routes (CRUD for interviews)
- [x] **3C** Build provider scheduling modal (type, time, alt time, notes)
- [x] **3D** Build student confirm/reschedule flow (interview tab)
- [x] **3E** Build .ics generator (`lib/ics-generator.ts`)
- [x] **3F** Upgrade caregiver interview tab (pending/upcoming/past)
- [x] **3G** Email attachments support for .ics files
- [x] **3H** Notification emails (proposed, confirmed, cancelled)
- [x] **3I** Light gamification (interview count in header)
- [x] **3** Type-check, self-review, commit, push

## Phase 4: Monetization + Access Gating (Week 4-6)

- [x] **4A** Build four-tier access function (lib/medjobs-access.ts)
- [ ] **4B** Extend candidates API with tier-based redaction (ready to wire)
- [ ] **4C** Update candidate detail page for conditional rendering (ready to wire)
- [ ] **4D** Update browse page — 6-card limit, banners (ready to wire)
- [x] **4E** Audit existing Stripe setup — found checkout + webhook already built
- [x] **4F** Build MedJobs Stripe checkout ($50/mo) + webhook handlers
- [x] **4G** Build upgrade modal component (UpgradeModal.tsx)
- [ ] **4H** Wire upgrade CTAs into detail page, browse page, interview tab
- [x] **4I** Anti-de-platforming: formatCandidateName, canSeeLinkedIn, canSeeResume built
- [x] **4** Core infrastructure committed and pushed

**Note:** Frontend gating (4B-4D, 4H) requires wiring the access tier into existing
candidate browse/detail pages and ContactSection. The functions and components are
built — they need to be integrated into the page rendering logic. This should be
done carefully in a follow-up to avoid breaking existing functionality.

## Fast Follow (After Phase 1)

- [ ] Add dynamic provider list + scripts to 100% activation email
- [ ] Query medjobs_job_posts for local participating providers
- [ ] Handle empty provider case gracefully

## Team Handoff Notes

Files that may conflict with account architecture work:
- `components/shared/Navbar.tsx` — caregiver dropdown branch
- `lib/types.ts` — StudentMetadata field additions

Everything else is MedJobs-specific and safe to merge independently.
