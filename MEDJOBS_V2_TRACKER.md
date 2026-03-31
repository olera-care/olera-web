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

- [ ] **3A** Create interviews table migration (SQL + RLS policies)
- [ ] **3B** Build scheduling API routes (CRUD for interviews)
- [ ] **3C** Build provider scheduling modal (type, time, alt time, notes)
- [ ] **3D** Build student confirm/reschedule flow
- [ ] **3E** Build .ics generator (`lib/ics-generator.ts`)
- [ ] **3F** Upgrade caregiver interview tab (pending/upcoming/past)
- [ ] **3G** Add interview section to provider portal
- [ ] **3H** Build notification emails (proposed, confirmed, reminder, cancel)
- [ ] **3I** Add light gamification (interview count badges)
- [ ] **3** Type-check, self-review, commit, push

## Phase 4: Monetization + Access Gating (Week 4-6)

- [ ] **4A** Build four-tier access function (anonymous/free-active/free-exhausted/paid)
- [ ] **4B** Extend candidates API with tier-based redaction (name, contact, resume, LinkedIn)
- [ ] **4C** Update candidate detail page for conditional rendering by tier
- [ ] **4D** Update browse page — 6-card limit for anonymous, banners for exhausted
- [ ] **4E** Audit existing Stripe setup in codebase
- [ ] **4F** Build Stripe checkout flow ($50/mo) + webhook handlers
- [ ] **4G** Build upgrade modal component (reusable across touchpoints)
- [ ] **4H** Wire upgrade CTAs into detail page, browse page, interview tab, emails
- [ ] **4I** Implement anti-de-platforming measures (last-initial names, LinkedIn gating)
- [ ] **4** Type-check, self-review, commit, push

## Fast Follow (After Phase 1)

- [ ] Add dynamic provider list + scripts to 100% activation email
- [ ] Query medjobs_job_posts for local participating providers
- [ ] Handle empty provider case gracefully

## Team Handoff Notes

Files that may conflict with account architecture work:
- `components/shared/Navbar.tsx` — caregiver dropdown branch
- `lib/types.ts` — StudentMetadata field additions

Everything else is MedJobs-specific and safe to merge independently.
