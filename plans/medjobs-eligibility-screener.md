# MedJobs Student Funnel — Eligibility-Screener Rebuild (Build Bible)

Branch: `claude/keen-mendel-6i8iW`

## Cross-cutting rules (apply to every unit)
1. **One template, contextual variants** — one base card (`components/browse/BrowseCard.tsx`) and one base page (`app/provider/[slug]/page.tsx`); everything else is a modified version.
2. **Real replaces demo** — demo cards render ONLY when there is zero real content for that board/campus; any real result clears all demos.
3. **Start local** — boards auto-select the student's campus filter when the link carries the campus/university id, and show that campus's full catchment.
4. **Demand before work** — students see real local opportunities before being asked to finish anything.

## Key facts from Unit 0 (reconciliation)
- Students live in `business_profiles` with `type="student"`; metadata = `StudentMetadata` (`lib/types.ts:444-553`).
- Account+profile creation + silent sign-in already exists: `app/api/medjobs/apply/route.ts:495-579` (createUser → accounts insert → business_profiles insert → `generateLink` magiclink → return `tokenHash`); browser `verifyOtp` at `app/medjobs/apply/page.tsx:354-372`.
- Provider eligibility pattern to mirror: `lib/medjobs/eligibility.ts` (keys + `isMedjobsEligible`).
- The "full application" already exists and collects ~100% on the dashboard `app/portal/medjobs/page.tsx`; the old apply form only covered ~40%.
- `StudentWelcomeNote` exists (`components/medjobs/StudentWelcomeNote.tsx`, variants `live | not_live`) — EXTEND, don't rebuild.
- Blueprint board: `app/portal/medjobs/jobs/page.tsx` (StudentWelcomeNote, BrowseCard `variant="student"`, ScheduleInterviewModal, Pagination, `businessProfileToCardFormat`, `SAMPLE_FAMILIES`, `/api/medjobs/interviews`, all/requested tabs).
- `BrowseCard` props: `variant: "default" | "student"`, `isDemo`, `isRequested`, `canRequest`, `onRequestInterview`. Needs new `variant="candidate"`.
- Catchment: `lib/medjobs/catchment.ts` — `getProvidersInCatchment(slug)` (business_profiles), `getProviderProspectsInCatchment(slug)` (olera-providers, non-medical), `getPartnerUniversity(slug).catchment`.
- Card converters: `toCardFormat()` (olera-providers→card) + `businessProfileToCardFormat()` + `enrichBpCards()` in `lib/types/provider.ts`.
- Provider detail: `app/provider/[slug]/page.tsx` (server); CTAs in `components/providers/CTAVariantRouter.tsx`.
- Demo data: `lib/medjobs/demo-family.ts` (SAMPLE_FAMILIES), `lib/medjobs/demo-candidate.ts` (SAMPLE_CANDIDATES).
- Materialize directory prospect → business_profile: `app/api/admin/medjobs/provider-prospects/materialize` (admin-gated; needs student-safe wrapper).
- Campus slug ↔ university mapping: `lib/medjobs/campus-university-bridge.ts`.

---

## UNIT 1 — Eligibility front door (2-Q screener + email-only silent auth)
Goal: a 2-question modal that ends with email, instantly creates the student account, signs them in, and records eligibility.

- [ ] NEW `lib/medjobs/student-eligibility.ts`: keys (`STUDENT_ELIGIBILITY_COMPLETED_KEY = "medjobs_eligibility_completed_at"`), `AvailabilityProfile` type (`coverage_buckets: ("day"|"evening"|"overnight"|"weekend")[]`), `isStudentEligible(metadata)`, `INTERNSHIP_AGREEMENT_URL = "/docs/internship-agreement-sample.pdf"`.
- [ ] NEW `components/medjobs/StudentEligibilityModal.tsx`:
  - [ ] Q1 "Where are you headed?" → med | nursing | pa | pt_ot | public_health | exploring, each with a reassurance line (track-aware).
  - [ ] Q2 "When are you usually free?" (multi-select buckets) + live demand line ("12 families near {campus} need evenings") with honest floor (≥3 number / 1–2 no number / 0 drop).
  - [ ] Email step framed as reward ("🎉 You're in! Where do we send your matches?") → submit.
  - [ ] On submit: call the create endpoint, then `verifyOtp({ token_hash, type: "magiclink" })`, then close (no redirect).
  - [ ] `campusName` / campus slug props for copy + write-through.
- [ ] NEW `app/api/medjobs/student-eligibility/route.ts` (extract minimal path from apply route 495-579):
  - [ ] Email-only: createUser (email_confirm) → accounts insert (onboarding_completed) → business_profiles insert `type="student"` with metadata: `medjobs_eligibility_completed_at`, `career_path` (Q1), `availability_profile.coverage_buckets` (Q2), `university`/`university_id`/`city`/`state` (from campus), `platform_terms_accepted_at`, `profile_completeness` (computed minimal) → `generateLink` magiclink → return `tokenHash`, `slug`.
  - [ ] Returning email: detect existing → return sign-in token (no dup).
- [ ] VERIFY: `tsc` clean; walk Q1→Q2→email → a `type="student"` profile exists, eligibility recorded, browser session established, lands on `/medjobs/families`.

## UNIT 2 — Public families page (catchment, filters, real-replaces-demo, auto-filter)
Goal: public board of real catchment providers, campus auto-filtered from link, city filter, demo only as cold-start.

- [ ] NEW `app/api/medjobs/families/route.ts`:
  - [ ] Resolve campus slug from `?campus=` or `?university=` (via `campus-university-bridge`).
  - [ ] `getProviderProspectsInCatchment(slug)` (directory, non-medical) → `toCardFormat`.
  - [ ] `getProvidersInCatchment(slug)` (program business_profiles) → `businessProfileToCardFormat`.
  - [ ] Merge/dedupe via `enrichBpCards` (program overrides directory); attach `isProgram` flag.
  - [ ] `?city=` narrows; `?page=` paginates.
- [ ] NEW `app/medjobs/families/page.tsx` (copy structure from `app/portal/medjobs/jobs/page.tsx`):
  - [ ] Public (no auth guard); Suspense wrapper.
  - [ ] University filter (medjobs_universities) + City filter; **auto-select campus from link param**.
  - [ ] Cards via `BrowseCard variant="student"` + Request action; tabs all/requested.
  - [ ] **Real-replaces-demo**: real.length>0 → no demos; else `SAMPLE_FAMILIES`.
  - [ ] `StudentWelcomeNote` at top; `ScheduleInterviewModal`; `Pagination`.
  - [ ] Eligibility modal overlays for unauthed / `?screener=1` (auto-open).
- [ ] VERIFY: anon arrival from a campus link → screener overlay → board shows that campus's real catchment, city filter narrows, demos only on empty campus.

## UNIT 3 — Provider page "student view" + request gate + materialize
Goal: tailored provider detail page for the student context with a gated Request-interview.

- [ ] `app/provider/[slug]/page.tsx`: accept `?ctx=medjobs-student&campus=` context.
  - [ ] Hide family-only sections (lead capture, pricing, benefits, tours) in student context.
  - [ ] Add hiring banner "Hiring student caregivers near {campus}" + match line (student buckets vs provider coverage).
- [ ] `components/providers/CTAVariantRouter.tsx` (Desktop+Mobile): add student CTA → "Request interview" (`ScheduleInterviewModal` with `providerProfileId`).
- [ ] Request gate: if student `profile_completeness < 100` → prompt "Finish your application first" → link `/portal/medjobs` (resume on return); else open modal.
- [ ] NEW student-safe materialize action wrapping `provider-prospects/materialize`: directory-only provider (no `business_profiles.id`) → materialize → get id → request. (Only materializes; no sensitive write.)
- [ ] VERIFY: card → student-view page (CTA swapped, family bits hidden) → incomplete student gated → complete student sends request → directory-only provider materializes then request sends.

## UNIT 4 — "Complete your application" + go-live nudge
Goal: relabel + nudge; ensure old apply sign-offs have a home.

- [ ] `app/portal/medjobs/page.tsx`: relabel entry/CTA "Complete your application".
- [ ] Ensure `acknowledgments_completed` / the 6 attestations + agreement acceptance have a home post-eligibility (add an acknowledgments/agreement step if missing on the dashboard).
- [ ] Note flips to `live` variant at 100% + verified.
- [ ] Wire the U3 gate's return path back to a pending request if one was queued.
- [ ] VERIFY: incomplete student is nudged; completing flips to live; queued request resumes.

## UNIT 5 — Wiring, redirects, vocab
Goal: point all entry points at the new front door; switch verb.

- [ ] Redirect `app/portal/medjobs/jobs` → `/medjobs/families`.
- [ ] Redirect `app/medjobs/apply` → `/medjobs/families?screener=1` (preserve campus params).
- [ ] `lib/program-pdf/configs/*` + `Template` — flyer copy "Apply" → "Check eligibility".
- [ ] `app/api/medjobs/flyer-image` — social image copy.
- [ ] `lib/student-outreach/templates.ts` — email CTA + link → `/medjobs/families?screener=1`.
- [ ] Add `public/docs/internship-agreement-sample.pdf` placeholder.
- [ ] VERIFY: every old link resolves; flyer→eligibility→board→request works end-to-end.

## UNIT 6 — One design language (cards + pages, both funnels)
Goal: every card from the base card; every detail page from the base page; demo explorable; real-replaces-demo on candidate board too.

- [ ] `components/browse/BrowseCard.tsx`: add `variant="candidate"` (person: photo/initials in image frame, name, track·university, availability/trust as highlights, View/Invite action, no price/heart). Map `CandidateData` → card shape.
- [ ] `app/medjobs/candidates/page.tsx`: replace `CandidateCard` with `BrowseCard variant="candidate"`; demo via `SAMPLE_CANDIDATES` + `isDemo`; **real-replaces-demo**; add **City filter**.
- [ ] Delete `components/medjobs/CandidateCard.tsx` (and `CandidateRow` if orphaned).
- [ ] Re-skin candidate detail `app/medjobs/candidates/[slug]/page.tsx` to the `/provider/[slug]` template language (contextual content).
- [ ] Read-only demo detail pages BOTH sides (sample provider page + sample candidate page) so demo cards are clickable.
- [ ] Unify demo treatment (dashed + amber "Demo") across all variants.
- [ ] VERIFY: candidate board uses base card; demo explorable both sides; real clears demo; both boards filter campus+city identically.

---

### Definition of done (whole effort)
Flyer/link → "Check eligibility" (2 Q + email) → silent sign-in → public families board auto-filtered to campus catchment (real, demo only when empty) → student-view provider page → gated Request interview → "Complete your application" → live. One card design + one page design across demo/real, student/provider, browse/detail.
