# Plan: Completion Carrot — "Sell the Output, Not the Checklist"

Created: 2026-06-08
Status: Phase 1 BUILT (foundation + completion variant) — unverified; staging CI typecheck + dry-run pending. Phase 2 (preview surface) deferred. Task 6 (tracking migration) dropped — MVP attribution rides the existing one_click_access event.
Context: Step 2 of the provider-engagement build. See Notion "Provider Engagement Reframe" (canonical) + memory `project_engagement_reframe`.

## Goal
Convert the provider profile/owner-story completion milestone by **showing claimed-but-thin providers what families see** — leading with the magical missing piece (the "Facility manager" owner-story card) — instead of nagging them with a completion checklist.

## Why this shape (grounded in the data)
- Completion is the **activation on-ramp**: 225 claims/30d but only 39 profile edits + 12 owner stories — a huge **claimed-but-thin** population that stalled right after claiming. That cohort is the target: warm, reachable, one rung from "resident."
- The old approach nags and fails: `completion_nudge`/`profile_incomplete` convert at 2–16% click. "Sell the output" = show the aspirational result, not a progress bar.
- **Target CLAIMED thin profiles only.** They're warm (showed intent) and reachable, so the digest stays safely on olera.care (no cold-volume on the crown jewel — the thing T1 just protected). Unclaimed directory thin profiles are a *cold-acquisition* problem, explicitly out of scope here.

## Success Criteria
- [ ] A claimed provider with a thin profile + no owner story receives a "sell the output" completion email that **leads with their missing owner-story card** (aspirational, not a nag).
- [ ] Clicking the CTA lands them **authenticated** on the dashboard with the relevant editor **auto-opened**.
- [ ] One email per provider per run, priority-ordered (open question > completion > market rank).
- [ ] (Phase 2) They can see a **ghosted preview** of their own public page with "add this" placeholders for empty sections.
- [ ] Measurable lift: completion-email click rate beats the old nag (>16%); profile-edit / owner-story events rise among emailed claimed-thin providers (attributed via `resolveCanonicalProviderKeys`).

## Minimal Viable Version (cut ruthlessly)
**Phase 1 = the trigger + landing the action.** The email (reaches everyone) + deep-link-to-editor. This alone tests "does selling-the-output beat nagging?" **Phase 2 = the in-dashboard ghosted preview** (the centerpiece magic) — build only after Phase 1 validates the framing (per `feedback_ship_validate_before_depth`).

## Tasks

### Phase 0: De-risk the one unknown — ✅ RESOLVED 2026-06-08
- [x] 0. **Auth path confirmed viable.** Findings: (1) `/provider` is NOT middleware-protected — `updateSession` guards only `/portal`, `/admin`, `/account` (`lib/supabase/middleware.ts:49`), so no login wall on the dashboard. (2) Proven server-side one-click pattern exists in prod: `app/api/claim-lead/route.ts` validates the otk, **verifies token-email == profile-email** (security boundary), mints a real session server-side (`admin.auth.admin.generateLink` → `verifyOtp` → `setSession` cookies on a 303), links the profile, tracks `one_click_access`, and **falls back to onboard on any failure (never a dead end)**. **DECISION: build a dedicated server-side route modeled on claim-lead** (`/api/claim-complete?otk=&section=`) that mints the session and 303-redirects to `/provider?edit=<section>`. The email CTA points at THAT route — NOT `/provider?...&otk=` directly (the dashboard doesn't process tokens; only the API route mints the session).

### Phase 1: Trigger + destination (ship + validate)
- [ ] 1. Deep-link-to-edit-modal support in the dashboard. Read `?edit=<section>` via `useSearchParams()`; `useEffect` → `setEditingSection`; validate against the 8 `SectionId`s; clear the param after open.
      - Files: `components/provider-dashboard/DashboardPage.tsx`
      - Depends on: 0
      - Verify: visiting `/provider?edit=owner` (authed) auto-opens the owner modal; junk values are ignored.
- [ ] 2. Server-side completion auth route + URL builder. New `app/api/claim-complete/route.ts` modeled on `claim-lead` (validate otk → email-match → mint session via generateLink/verifyOtp/setSession-cookies → 303 to `/provider?edit=<section>` → fallback to onboard on failure → track `one_click_access`). New `generateCompletionUrl(slug, email, section)` points the CTA at `/api/claim-complete?otk=&section=`. (Targets are CLAIMED providers, so the profile is already linked — the route mostly just mints the session + redirects.)
      - Files: `app/api/claim-complete/route.ts` (new), `lib/claim-tokens.ts` (new `generateCompletionUrl`)
      - Depends on: 0 (done), 1
      - Verify: clicking the link in a cold browser session lands authenticated on `/provider?edit=owner` with the owner modal open; an expired/invalid token falls back to onboard, not an error.
- [ ] 3. Detect "claimed + thin" in the digest cron + pick the lead gap. For claimed providers, run `calculateProfileCompleteness(profile, meta)`; flag thin (overall < ~60% **OR** no owner story — note: owner story is NOT in the completeness score, check `metadata.staff?.name` separately); choose the highest-**emotional**-impact missing section in priority order: **owner story → gallery → about → pricing/services**. Treat "claimed + thin" as its own digest **signal** so the traffic gate doesn't skip them.
      - Files: `app/api/cron/weekly-provider-digest/route.ts`
      - Depends on: none (parallel with 1–2)
      - Verify: `?dry_run=true` lists the claimed-thin cohort + chosen section per provider; volume is sane (log the count).
- [ ] 4. The "completion" email variant — "sell the output." Inline HTML mock of the ghosted missing element (esp. a templated facility-manager card: silhouette avatar + faded sample care-motivation + "families connect more with a face and a story"), CTA deep-linking (Task 2) to the editor. Aspirational copy, no progress bar.
      - Files: `lib/email-templates.tsx` (new `providerProfileCompletionEmail`, reuse `layout`/`button`)
      - Depends on: 2
      - Verify: send dummy emails (owner-missing / gallery-missing) to tfalohun@gmail.com; reads as desire, not chore.
- [ ] 5. Variant selection + one-email-per-provider priority in the cron: open question (demand) > completion (claimed+thin) > market rank > analytics. 
      - Files: `app/api/cron/weekly-provider-digest/route.ts`
      - Depends on: 3, 4
      - Verify: dry-run — a claimed-thin no-question provider gets the completion email; a provider with a question still gets the demand email.
- [ ] 6. Tracking: add `completion_email_clicked` (+ later `preview_viewed`) events. **Requires a DB CHECK-constraint migration** extending the `provider_activity` allowlist (`feedback_event_allowlist_needs_db_migration`).
      - Files: new `supabase/migrations/NNN_*.sql`, `app/api/activity/track/route.ts` allowlist
      - Depends on: none
      - Verify: migration applies; a tracked click inserts (doesn't silently fail).

### Phase 2: The ghosted preview (after Phase 1 validates)
- [ ] 7. "Preview your page" surface — render the provider's real public-page sections (reuse `app/provider/[slug]/page.tsx` section components) with aspirational **ghosted placeholders** for empty sections, each deep-linking (`?edit=`) to its editor.
      - Files: new `app/provider/preview/*` (or a dashboard view) + extract/reuse section components
      - Depends on: 1
      - Verify: a thin provider sees their page with a ghosted owner card + "add" affordances; clicking opens the editor.
- [ ] 8. Point the dashboard at the preview ("See your page as families do") — from the completeness sidebar + the existing "Public view" affordance.
      - Files: `components/provider-dashboard/DashboardPage.tsx`, `ProfileCompletenessSidebar.tsx`
      - Depends on: 7
      - Verify: dashboard links to the preview.

## Risks
- **otk → dashboard auth (Task 0).** The CTA is worthless if it dumps providers on a login wall. Mitigation: route through the proven onboard otk flow → forward to `/provider?edit=`. De-risk before anything else.
- **Cold volume on the crown jewel.** Mitigated by targeting **claimed** thin profiles only (warm). Do NOT fold in unclaimed directory thin profiles — that re-introduces the cold bounce T1 just removed, and the digest stays on olera.care.
- **Audience/volume spike.** "Claimed + thin" as a new digest signal expands the audience — `dry_run` + bound + log the count BEFORE any live send (standing digest discipline).
- **Owner story isn't in the completeness score.** Must check `metadata.staff` presence separately so the variant can feature the most-magical gap.
- **Treadmill trap.** Fire only on a genuine, meaningful gap; once the gap is filled, stop. No "keep completing forever" (decided constraint).
- **Email-client rendering** of the ghosted card (table-based, no JS) — verify across clients via dummy sends before going live.

## Notes
- Worktree is currently on `email-provider-notify-domain-split` (the T1 PR). This plan file is untracked here; **the build gets a fresh branch off staging** (`git worktree add ../olera-web-completion -b completion-carrot origin/staging`). Do not commit build work onto the T1 branch.
- Reuse, don't rebuild: completeness score (`lib/profile-completeness.ts`), edit modals, public-page section components, `generateClaimToken`, email `layout`/`button` all exist.
- Attribution uses `resolveCanonicalProviderKeys` (validated this session) to measure completion lift across the provider-id namespace split.
- Ties to overall build order step 5 (digest as next-rung router) — Task 5 is the first slice of that router.
