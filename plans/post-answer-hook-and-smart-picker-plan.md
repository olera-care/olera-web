# Plan: Post-Answer Hook + Smart Picker + Funnel Instrumentation

Created: 2026-04-28
Status: Not Started
Notion: https://www.notion.so/Hook-the-post-answer-moment-lure-providers-into-the-V2-profile-edit-dashboard-34e5903a0ffe818eb372fb6539e65391

## Goal

Capture peak provider engagement immediately after they answer a Q&A question by replacing the static "Response sent" success state with a contextual next-best-action card that pulls them deeper into the platform — and along the way, upgrade the dashboard's existing static "Complete your profile" banner into the same smart picker so every provider benefits.

## Sequencing rationale

Three small PRs, each independently shippable and observable. Ship the funnel column first so we have a baseline of the existing analytics teaser's pull-through *before* we add the new hook — otherwise we can't tell if the new vector is winning. Ship the smart picker on the dashboard before the post-answer hook so the picker component lands on a less risky surface first (returning-provider dashboard visits) before going on the answer-flow critical path.

## Locked decisions (do not re-litigate)

1. **Architecture: stay on `/provider/[slug]/onboard` URL.** The answer form already lives there in `components/provider-onboarding/ActionCard.tsx`. We replace the post-submit success state (`if (submitted)` branch, lines 583-595) with the smart picker. Zero changes to the form, submit handler, or auth flow.
2. **Verification gate stays.** Esther confirmed 2026-04-28 that unverified-provider answers being held as `pending` + `is_public: false` is intentional. Don't surface verification friction at the answer moment — the existing "Verify to save" gate inside edit modals (`components/provider-dashboard/edit-modals/ModalFooter.tsx:73-98`) handles it at the natural moment. Picker behaves identically for verified and unverified providers.
3. **Smart picker shared component.** Built once, used in two places: post-answer success state on the onboard page, and replacing the existing 30%-banner on the V2 dashboard (`components/provider-dashboard/DashboardPage.tsx:316-348`).
4. **Soft-honest copy.** No data-claim multipliers ("2x more questions"). Category-aware via `normalizeCareLabel()` for place-based vs service-based providers.
5. **Existing teaser already fires click events.** `AnalyticsTeaserCard.tsx:140-148` posts `analytics_teaser_cta_clicked` to `/api/activity/track`. The funnel work is *surfacing* these events, not instrumenting from scratch.

## Out of scope (explicitly)

- Removing the verification gate on answer publication (Esther: deliberate; monitor instead).
- "10-views nudge" batched email (separate task; pairs with this as a comparison vector).
- "Next question" queue / auto-advance (separate workstream).
- The 100%-complete "Who's looking" curiosity branch on the picker — defer to v2; rare state, adds complexity.

---

## Success Criteria

### PR A (funnel instrumentation, ships first)
- [ ] Provider Web Email Funnel on `/admin/analytics` shows two new columns: **Clicked dashboard** and **Edited profile**.
- [ ] "Clicked dashboard" reads existing `analytics_teaser_cta_clicked` events from `provider_activity`, scoped to providers in the email-funnel cohort window.
- [ ] "Edited profile" reads `provider_profile_edited` events. If no such event exists, add a single client-side fire from `EditModalContext` save handler (or equivalent shared save path).
- [ ] Funnel shows N/0 / N/0 cleanly in early days when no new clicks/edits have landed yet.
- [ ] No regression on existing funnel columns (sent / delivered / opened / signed in / answered).

### PR B (smart picker on dashboard)
- [ ] New `<SmartNextActionCard>` component renders the highest-impact incomplete section as a contextual nudge with category-aware copy.
- [ ] Replaces the existing static "Complete your profile to attract more families" banner on `DashboardPage.tsx` (the `guided.shouldPrompt` block).
- [ ] Click on primary CTA opens the relevant edit modal directly (not a scroll-to-anchor).
- [ ] Fires `provider_picker_impression` on mount and `provider_picker_clicked` on CTA click, both with `source: "dashboard"` and `section: <sectionId>` metadata.
- [ ] Falls back gracefully if profile is 100% complete (renders nothing for now — no curiosity branch in v1).
- [ ] Dismiss behavior matches the previous banner (localStorage flag, hides for the session).
- [ ] No regression: providers who previously saw the 30%-banner now see the picker instead, and the guided-onboarding sequence still works when activated via the picker CTA.

### PR C (post-answer hook)
- [ ] Submitting an answer in `ActionCard.tsx` swaps the current "Response sent to {askerName}" success state for `<SmartNextActionCard source="qa-success">`.
- [ ] A short confirmation line stays above the picker ("Response sent. Thanks for helping families decide.") — provider always sees acknowledgement before the nudge.
- [ ] Picker's CTAs append `?from=qa-success` to any dashboard navigation.
- [ ] Secondary CTA: "See your full dashboard" → `/provider?from=qa-success`.
- [ ] Source tag visible on the funnel as an attribution split (e.g., "Clicked dashboard: 12 from qa-success, 8 from qa-teaser").
- [ ] No regression on the answer form, submit handler, or 70% answer rate (manual smoke test required).
- [ ] Picker adapts category-aware copy (place-based "picture your space" vs service-based "put a face to your business").

---

## Tasks

### Phase 1 — PR A: Funnel instrumentation

- [ ] **A1.** Confirm `provider_profile_edited` event source.
  - Files: grep across `components/provider-dashboard/edit-modals/`, `lib/`, `app/api/provider/`.
  - If no such event fires today, add a single point of capture in the shared save path (likely `components/provider-dashboard/edit-modals/save-profile.ts` or equivalent). Fire-and-forget POST to `/api/activity/track` with `event_type: "provider_profile_edited"`, `metadata: { section: <sectionId> }`.
  - Verify: open any edit modal, change a field, save → row appears in `provider_activity` with `event_type='provider_profile_edited'`.
- [ ] **A2.** Extend `qa_funnel` rollup with two new fields.
  - Files: `app/api/admin/analytics/summary/route.ts` — extend `ProviderQaFunnel` interface with `clicked_dashboard: number` and `edited_profile: number`. Add SQL/aggregation reading from `provider_activity` filtered by event_type and time window matching the existing funnel cohort.
  - Add a per-source breakdown if cheap: `clicked_dashboard_by_source: { 'qa-teaser': N, 'qa-success': N, 'direct': N }` so PR C's source tag shows up here without further work. If costly, defer to PR C.
  - Verify: hit `/api/admin/analytics/summary` in dev → response includes new fields.
- [ ] **A3.** Render the new columns on `/admin/analytics`.
  - Files: `app/admin/analytics/page.tsx` — add two columns to the Q&A funnel table. Match the existing visual treatment (number + percentage of prior step). Show `0` rather than blank when no events yet.
  - Verify: load `/admin/analytics` in dev → funnel table shows the two new columns. Numbers are zeros if no events fired in the window yet.
- [ ] **A4.** Smoke-test against staging data + ship.
  - Verify: in staging, manually fire an `analytics_teaser_cta_clicked` event (click the existing teaser on a real provider's onboard page) → 5 minutes later, `/admin/analytics` shows it counted in `clicked_dashboard`.
  - Ship PR A. Watch baseline for ~3-5 days before starting PR B if signal is meaningful, else proceed concurrently.

### Phase 2 — PR B: Smart picker on the dashboard

- [ ] **B1.** Build the next-best-action scoring function.
  - Files: NEW `lib/next-best-action.ts` — pure function `pickNextAction(profile, completeness, providerCategory): NextAction | null`.
  - Scoring:
    - `0%` sections beat partial sections
    - Within each tier, ordered by static impact heuristic: `gallery > about > services > screening > pricing > payment > owner`
    - Returns `null` if profile is 100% complete (defer the curiosity branch)
  - Returns `{ sectionId, copy: { headline, subline, cta }, modalKey }` where copy is category-aware via `normalizeCareLabel()` from `lib/provider-highlights.ts`.
  - Verify: unit-test edge cases (all incomplete, partial, fully complete, single-photo gallery, etc.) — start with a small test file `lib/__tests__/next-best-action.test.ts` if test infra exists, else inline manual checks via `node -e`.
- [ ] **B2.** Define the copy table.
  - Files: same `lib/next-best-action.ts` — export a typed copy table:
    ```ts
    const COPY: Record<SectionId, { place: SectionCopy; service: SectionCopy }> = { ... }
    ```
  - Place-based vs service-based split for: gallery, screening (other sections may share copy across both — only branch where it matters).
  - Headlines are short imperative ("Add a photo so families can picture your space"), CTAs match modal name ("Add photos"). NO data claims.
  - Verify: render each section's copy in dev — visually scan that nothing reads odd for either category.
- [ ] **B3.** Build `<SmartNextActionCard>` component.
  - Files: NEW `components/provider-dashboard/SmartNextActionCard.tsx`.
  - Props: `{ source: "dashboard" | "qa-success", profile, completeness, onOpenSection: (id) => void, onDismiss?: () => void }`.
  - Renders: gradient card matching the dashboard's existing aesthetic (`from-primary-50 to-vanilla-50`). Headline + subline + primary CTA + optional dismiss + optional secondary "See full dashboard" CTA (only when `source === "qa-success"`).
  - On mount: fire `provider_picker_impression` to `/api/activity/track` with `metadata: { source, section: <sectionId> }`. Guarded by `useRef` to prevent Strict Mode double-fire (mirror `AnalyticsTeaserCard` pattern).
  - On primary CTA click: fire `provider_picker_clicked`, then call `onOpenSection(sectionId)`.
  - On dismiss: persist localStorage flag (key: `olera_picker_dismissed_<sectionId>` so dismissing one nudge doesn't kill all of them — when next-best-action picks a different section, the picker re-appears).
  - Verify: Storybook-style render in isolation, then in DashboardPage in dev.
- [ ] **B4.** Replace the existing 30%-banner in `DashboardPage.tsx`.
  - Files: `components/provider-dashboard/DashboardPage.tsx:316-348` — remove the `{guided.shouldPrompt && !guided.isGuidedActive && (<div ...>...)}` block.
  - In its place, render `<SmartNextActionCard source="dashboard" profile={profile} completeness={completeness} onOpenSection={(id) => setEditingSection(id)} onDismiss={guided.dismiss} />`.
  - Keep the rest of `useGuidedOnboarding` working — its guided-sequence logic (Save & Next, step counters, etc.) is still useful inside the edit modals after the picker opens one.
  - Verify: load `/provider` as a low-completeness provider in dev → see picker. As a fully-complete provider → see nothing where the banner used to be. Click the picker CTA → correct edit modal opens.
- [ ] **B5.** Smoke-test all categories.
  - Verify: pick one place-based provider (assisted living) and one service-based (home care, non-medical) in staging. Confirm copy reads correctly for each.
  - Confirm dismiss flag is per-section, not global.
  - Confirm no regression on the existing guided-flow Save & Next within edit modals.
  - Ship PR B.

### Phase 3 — PR C: Post-answer hook

- [ ] **C1.** Replace the success state in `ActionCard.tsx`.
  - Files: `components/provider-onboarding/ActionCard.tsx:583-595` — replace the `if (submitted)` branch.
  - New JSX:
    ```tsx
    if (submitted) {
      return (
        <div className="space-y-4" style={{ animation: "card-enter 0.25s ease-out both" }}>
          <div className="flex items-center gap-2.5">
            <CheckmarkIcon />
            <p className="text-[15px] font-semibold text-gray-900">
              Response sent to {askerName}
            </p>
          </div>
          <SmartNextActionCard
            source="qa-success"
            profile={...}
            completeness={...}
            onOpenSection={...}  // see C2
          />
        </div>
      );
    }
    ```
  - The picker needs `profile` and `completeness` data. Confirm `ActionCard` already has access to the provider profile (it does — `provider: Provider` prop). Completeness will need to be computed or passed; check parent `SmartDashboardShell` to see if it's already loaded there. If not, lazy-load via `/api/provider/dashboard` on submit success.
  - Verify: answer a question in dev as a low-completeness provider → picker appears in success state. Click picker CTA → navigates to dashboard with `?from=qa-success`.
- [ ] **C2.** Wire up `onOpenSection` for the post-answer surface.
  - On the dashboard, clicking a picker CTA opens an edit modal in place.
  - On the onboard page (post-answer), the modals don't exist on this surface — clicking the CTA should navigate to `/provider?from=qa-success&open=<sectionId>`.
  - Files: `app/provider/page.tsx` or `DashboardPage.tsx` — read `?open=<sectionId>` query param on mount and auto-open the corresponding edit modal.
  - Verify: answer a question, click picker CTA → lands on `/provider`, correct edit modal auto-opens.
- [ ] **C3.** Add source tag attribution to the funnel.
  - If A2 didn't include the per-source breakdown, do it here.
  - Files: `app/api/admin/analytics/summary/route.ts` — group `clicked_dashboard` events by `metadata.source`. Render as nested counts in the funnel UI.
  - Verify: in staging, click the picker once and the existing teaser once → funnel shows 1 from each source.
- [ ] **C4.** Smoke-test the answer flow.
  - Verify: full email-click → answer → picker → dashboard nav flow on staging, on both desktop and mobile widths.
  - Verify: 70% answer rate proxy — submit 5 answers in a row in staging, check no errors in console / network.
  - Ship PR C.

---

## Risks

- **Risk: 70% answer rate regression.**
  - Mitigation: PRs A and B don't touch the answer flow at all. PR C only modifies the `if (submitted)` branch — the form, submit handler, and auth flow are untouched. Manual smoke-test on staging before merge.
- **Risk: Picker copy reads wrong for a category we didn't think of.**
  - Mitigation: B5 explicitly tests both place-based and service-based providers. If a third category emerges (e.g., adult day services), copy table extends with a new branch.
- **Risk: `provider_profile_edited` event already fires somewhere and we double-count.**
  - Mitigation: Task A1 is "confirm event source" specifically to catch this. Don't add a duplicate.
- **Risk: Picker dismissal behavior is too aggressive — provider dismisses once and never sees a nudge again.**
  - Mitigation: Per-section dismiss key (`olera_picker_dismissed_<sectionId>`) instead of global. When the next-best-action picks a different section, the picker reappears.
- **Risk: Funnel column shows confusing zero-state pre-launch.**
  - Mitigation: A3 explicitly renders `0` instead of blank, and the columns ship with PR A so by the time PR B/C land, the columns aren't surprising.
- **Risk: Strict Mode double-fires the impression event.**
  - Mitigation: Use the `useRef` guard pattern from `AnalyticsTeaserCard.tsx:140-144`.

## Notes

- Esther's tiered-auth pattern (`isVerified` prop + "Verify to save" modal) is upstream of this work — the picker should NOT bypass it. When the picker CTA opens an edit modal, the existing footer's verification gate handles the verification moment naturally.
- The `useGuidedOnboarding` hook stays alive even after PR B replaces its banner consumer. Its guided-sequence logic (Save & Next, step counters across modals) is still used inside edit modals.
- After this ships, pair with the "10-views nudge" batched email task to compare in-product vs email-triggered activation vectors.
- TJ flagged separately that the lack of a "next question" queue is a real engagement problem — out of scope here, but the picker's secondary CTA could later be "Answer next question" when one is available. Architecture should accommodate that later addition (component already has a `secondaryCta` prop slot).
