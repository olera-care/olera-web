# Plan: Benefits Intake Conversion Lift

Created: 2026-04-28
Status: Not Started
Notion: https://www.notion.so/Improve-benefits-intake-conversion-copy-visual-treatment-to-lift-completion-rate-34e5903a0ffe813aa547d2cc4378e761

## Goal
Lift visit→started and started→completed on the embedded `BenefitsDiscoveryModule` on provider detail pages, by (PR A) cutting friction on the save step that gates results, then (PR B) adding per-step instrumentation, then (PR C) running a copy A/B + trust strip on the entry point.

## Sequencing rationale
The save step today asks for **first name + email + a redundant H2 + a "Nice to meet you, X" greeting branch + numbered "1 ·" / "2 ·" field labels** on top of an eyebrow that already promises matches. Strip the fat first; instrumenting the current shape would give us a week of baseline data on a form we're about to redesign. After PR A is stable, PR B's `benefits_step_completed` event for `save` measures the form we actually want to optimize.

## Success Criteria

**PR A (save-step rework)**
- [ ] Name field removed; only email collected on the save gate.
- [ ] Save-step H2 simplifies to a single line: "Where should we send your matches?" (eyebrow + button still carry the match-count proof).
- [ ] "1 ·" / "2 ·" field-label eyebrows removed.
- [ ] Step 5 results headline still reads cleanly without `firstName` (falls to "You may qualify for N programs").
- [ ] `business_profiles` row still creates correctly (uses existing `display_name: "Care Seeker"` fallback).
- [ ] No regression on `benefits_started` rate.
- [ ] `benefits_completed` rate ideally lifts; even a flat result is acceptable since we've removed friction without removing value.

**PR B (instrumentation)**
- [ ] `benefits_entry_viewed`, `benefits_step_viewed`, `benefits_step_completed` rows visible in `provider_activity` with documented metadata shape.
- [ ] `benefits_started` rate stable in the 7 days post-merge.
- [ ] `/admin/analytics` summary card still loads + still shows correct `benefits_started` and `benefits_completed` counts.

**PR C (variant + trust strip)**
- [ ] 50/50 split visible in `provider_activity.metadata.variant` distribution after ~50 sessions per arm.
- [ ] Same `session_id` always sees same arm (sticky on cookie).
- [ ] `benefits_started` rate doesn't drop on either arm.
- [ ] Trust strip renders dynamic state name + program count.

## Key Code Anchors (from audit)
- `components/providers/BenefitsDiscoveryModule.tsx` — module, 5 steps: `care-need` → `age` → `financial` → `save` → `results`. State at `:174`. Step 1 headline at `:441`. Save step rendering at `:733-839`.
- `app/api/benefits/track-start/route.ts` — pattern to mirror for `track-step`. `provider_id` is set to `providerSlug`; insert gated on `providerSlug && sessionId`.
- `app/api/benefits/save-results/route.ts:286-307` — `business_profiles` insert. `display_name` already falls back to `"Care Seeker"` when no first name; safe to drop the field.
- `lib/analytics/session.ts:33` — `getOrCreateSessionId(): string` is **synchronous**. Safe in `useMemo`.
- `app/api/admin/analytics/summary/route.ts:8,15` — admin filters by exact event_type list `['benefits_started', 'benefits_completed']`. Adding new event_types is additive — no double-counting risk.

---

## Tasks

### Phase A — PR A: Save-step rework (ships first)

- [ ] **A1. Confirm downstream tolerates missing `firstName`**
  - **Files (read-only):** `app/api/benefits/save-results/route.ts`, any email templates referencing the benefits intake user
  - Verify: (a) `display_name` fallback at `:286-307` triggers cleanly when `firstName` is empty/missing; (b) any matched-program email template addresses the user without requiring a name (e.g., "Hi there" or no greeting); (c) the `metadata.benefits_results` JSON shape doesn't break when `firstName` is absent.
  - Grep: `rg "firstName" app/api/benefits app/welcome lib/email-templates*`. Expect to find ≤2-3 references; confirm each has a fallback or is purely cosmetic.
  - **Verify:** smoke-check `curl` against `/api/benefits/save-results` with `firstName: ""` → 200, row created with `display_name: "Care Seeker"`.

- [ ] **A2. Strip name field from save step UI**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - Remove `firstName` state declaration at `:179`.
  - In the save step (`:733-839`), delete the entire first input block (lines `:765-785`, the `<label>1 · Your first name</label>` + `<input id="benefits-name">`).
  - Remove the "1 ·" eyebrow above the email input too (`:787-789` `<label>2 · Your email</label>` → drop the label entirely; the placeholder `sarah@example.com` self-labels).
  - Wrap the remaining email input in the same outer styling (no `space-y-8` needed for one field — drop the wrapper or keep the `<div>` for vertical rhythm).
  - **Verify:** dev server, navigate to step 4, see only the email field. Tab order works. Autofocus lands on the email input.

- [ ] **A3. Simplify save-step H2**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - Replace the entire `<h2>` block at `:748-758` with a single line:
    ```tsx
    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-display leading-[1.1] mb-3">
      Where should we send your {matchCount === 1 ? "match" : matchCount > 0 ? `${matchCount} matches` : "results"}?
    </h2>
    ```
  - Drop the `greeting` variable at `:736-738` (no longer used — `firstName` is gone, so the conditional has no branch).
  - Eyebrow at `:745-747` ("{matchCount} matches ready" / "Almost there") stays — it carries the dopamine hook.
  - Sub-line "No password. Just a magic link..." at `:759-761` stays as-is.
  - **Verify:** load step 4 with N=3 matches → "Where should we send your 3 matches?". With N=1 → "Where should we send your match?". With N=0 → "Where should we send your results?".

- [ ] **A4. Update validation and submit logic**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - `:300` validation: change `if (!firstName.trim() || !email.trim() || !email.includes("@"))` → `if (!email.trim() || !email.includes("@"))`. Update error message to `"Please enter a valid email."`.
  - `:316` POST body: remove the `firstName: firstName.trim(),` line. Backend already handles missing field gracefully (per A1).
  - `:735` `canSubmit`: change `!saving && firstName.trim().length > 0 && email.includes("@")` → `!saving && email.includes("@") && email.trim().length > 0`.
  - **Verify:** type a valid email → button enables. Empty/invalid email → button disabled with helpful state.

- [ ] **A5. Update progress-bar fill math**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - At `:366-372` (`saveProgress`): simplify from 50/50 firstName+email split to single email check:
    ```tsx
    const saveProgress = (() => {
      if (step !== "save") return 0;
      return email.trim().length > 0 && email.includes("@") ? 1 : 0;
    })();
    ```
  - Pulse logic at `:394` (`isPulsing = step === "save" && saveProgress === 0`) still works — pulses while email is empty/invalid, fills to 100% once valid.
  - **Verify:** progress bar's 4th segment is empty + pulsing on save step entry, fills to 100% as soon as a valid email is typed.

- [ ] **A6. Update Step 5 results headline**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - At `:644-646`, simplify the conditional:
    ```tsx
    <h2 className="text-2xl font-bold text-gray-900 font-display">
      You may qualify for {matchingPrograms.length} {matchingPrograms.length === 1 ? "program" : "programs"}
    </h2>
    ```
  - (Equivalent: leave the `${firstName ? ... : "You"}` conditional — it'll just always take the else branch. Either way works; the explicit version is cleaner.)
  - **Verify:** complete a full intake → results page reads "You may qualify for N programs".

- [ ] **A7. Smoke test full intake flow + edge cases**
  - **Files:** none (manual)
  - Test scenarios (dev server):
    - Happy path: care-need → age → financial → email → results. Confirm `business_profiles` row created with `display_name: "Care Seeker"`.
    - Invalid email: confirm validation message + disabled button.
    - Back-navigate from save → financial → save: state preserved, progress bar correct.
    - Re-mount the module (refresh): `startTrackedRef` still dedupes `benefits_started`.
    - Visual: mobile (375px) + desktop. Confirm the simplified save step still feels weighted/intentional, not empty.
  - **Verify:** all of the above pass; no console errors.

- [ ] **A8. Ship PR A**
  - Branch off `staging` (worktree base is correct already), title: `Benefits intake: cut name field + simplify save-step copy`. Body links this plan + the Notion task. Call out: "Phase A of 3-PR sequence. Phase B (instrumentation) and Phase C (variant + trust strip) follow once start/complete rates are stable."
  - After merge to `staging` → main: monitor for ~3-5 days. Watch `benefits_started` rate (must stay flat) and `benefits_completed` rate (expect lift). If `benefits_started` drops, PR A introduced unintended friction — debug before Phase B.
  - **Depends on:** A1-A7
  - **Verify:** 3-5 days of post-merge data, `benefits_started` ±15% of prior baseline.

---

### Phase B — PR B: Per-step instrumentation (after Phase A is stable)

- [ ] **B1. Add `track-step` API route**
  - **Files (new):** `app/api/benefits/track-step/route.ts`
  - Mirror `track-start/route.ts`. Accepts JSON body:
    ```ts
    {
      event: "benefits_entry_viewed" | "benefits_step_viewed" | "benefits_step_completed",
      sessionId: string,
      stateCode: string | null,
      stateName: string | null,
      providerName: string | null,
      providerSlug: string | null,
      stepNumber?: number,         // required for step_viewed/step_completed
      stepName?: string,           // internal step keys: "care-need" | "age" | "financial" | "save" | "results"
      timeOnStepMs?: number,       // optional, only on step_completed
      variant: "control" | "money_loss",  // pass "control" everywhere during PR B
    }
    ```
  - Insert into `provider_activity` with `provider_id: providerSlug`, `profile_id: null`, `event_type: <event>`, and `metadata` carrying all props. Gate on `providerSlug && sessionId`.
  - **No Slack ping** for these events — would flood the channel. `benefits_started` Slack alert is unchanged.
  - Catch + log errors quietly; always return `{ ok: true }`.
  - **Verify:** `curl -X POST http://localhost:3000/api/benefits/track-step -H 'Content-Type: application/json' -d '{"event":"benefits_entry_viewed","sessionId":"test-1","stateCode":"TX","stateName":"Texas","providerName":"Test","providerSlug":"test-tx-1","variant":"control"}'` → row appears in `provider_activity`.

- [ ] **B2. Add `useTrackStep` helper**
  - **Files (new):** `lib/analytics/track-step.ts`
  - Exports `trackBenefitsEvent(payload): void` — fire-and-forget client helper using `fetch("/api/benefits/track-step", {method:"POST", body, keepalive: true})`. Try/catch around fetch; console.error only.
  - **Depends on:** B1

- [ ] **B3. Wire `benefits_entry_viewed` on module mount**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - Add `useEffect(() => { ... }, [])` near the top (after the spotlight effect). Use `entryTrackedRef` to dedupe Strict Mode double-mount.
  - Call `trackBenefitsEvent({ event: "benefits_entry_viewed", sessionId: getOrCreateSessionId(), stateCode: providerState, stateName, providerName, providerSlug, variant: "control" })`.
  - **Depends on:** B2
  - **Verify:** load any TX provider page → single row in `provider_activity` with `event_type='benefits_entry_viewed'`.

- [ ] **B4. Wire `benefits_step_viewed` on each step transition**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - `useEffect(() => { ... }, [step])` fires `benefits_step_viewed` whenever `step` changes (including initial mount). `viewedStepsRef` Set dedupes back-button revisits within session.
  - Step→number map: `care-need=1`, `age=2`, `financial=3`, `save=4`, `results=5`. Pass `stepName = step` (hyphenated key).
  - **Depends on:** B3
  - **Verify:** click through care-need → age → financial → save: four `benefits_step_viewed` rows with correct `step_number` and `step_name`.

- [ ] **B5. Wire `benefits_step_completed` on each step submit**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - `stepEnterTimeRef` captures `Date.now()` whenever `step` changes. On submit handler for each step, fire `benefits_step_completed` with `time_on_step_ms = Date.now() - stepEnterTimeRef.current`.
  - **No dedupe** on this event — back+resubmit is real user behavior worth capturing.
  - Call sites:
    - `care-need` step (in card `onClick` at `:456-460`): fire BEFORE `setTimeout(() => setStep("age"), 180)`.
    - `age` step (Continue button click at `:539`).
    - `financial` step (See my results button at `:614`).
    - `save` step (in `handleSave` at `:298`, BEFORE the async `/api/benefits/save-results` POST so we capture intent regardless of success).
    - `results` is terminal; no completion event needed (`benefits_completed` from save-results route already covers this).
  - **Depends on:** B4
  - **Verify:** complete a full intake; see 4 `benefits_step_completed` rows with reasonable `time_on_step_ms`. Existing `benefits_completed` row in `seeker_activity` still fires.

- [ ] **B6. Smoke-check admin analytics**
  - Hit `/admin/analytics`. Confirm `benefits intakes started` and `benefits intakes finished` KPIs match prior values for the same window. New event types must not inflate these counts (existing exact-match filter on event_type protects us, but verify).
  - **Depends on:** B3-B5

- [ ] **B7. Ship PR B + watch ~1 week**
  - Title: `Benefits intake: per-step instrumentation`. Body links plan + Notion task. Call out "Phase B of 3 — variant + trust strip ships in follow-up PR once start rate is confirmed stable."
  - After merge: monitor 7 days. **Hold Phase C until `benefits_started` rate is stable.**
  - **Depends on:** B6

---

### Phase C — PR C: Entry-point copy variant + trust strip (after Phase B watch period)

- [ ] **C1. Add deterministic hash helper**
  - **Files (new):** `lib/analytics/variant.ts`
  - Export `assignBenefitsVariant(sessionId: string): "control" | "money_loss"`. Use djb2 or FNV-1a (~10 lines, no dep). Hash session_id, mod 2 → control if 0, money_loss if 1.
  - Pure function. Same input → same arm. Sticky for the lifetime of the session cookie (30 days).
  - **Verify:** `node -e` smoke check on 1000 random uuids → distribution ~50/50 (±5%).

- [ ] **C2. Compute variant in DiscoveryModule + thread through ALL track calls**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - Top of component: `const sessionId = useMemo(() => getOrCreateSessionId(), []);` then `const variant = useMemo(() => assignBenefitsVariant(sessionId), [sessionId]);`.
  - Replace inline `getOrCreateSessionId()` calls with `sessionId`. Replace literal `"control"` in every `trackBenefitsEvent` call (from Phase B) with `variant`.
  - Update `trackStart` (existing function calling `/api/benefits/track-start`) to send `variant` in the body too.
  - **Depends on:** C1
  - **Verify:** every `track-step` row's `metadata.variant` matches the same session's `track-start` row's `metadata.variant`.

- [ ] **C3. Update `/api/benefits/track-start` to accept + persist variant**
  - **Files:** `app/api/benefits/track-start/route.ts`
  - Add `variant: string | null = body.variant || null` to body destructuring; add to `metadata` object on insert. Slack alert untouched.
  - **Depends on:** C2
  - **Verify:** `benefits_started` rows after this ship have `metadata.variant` populated.

- [ ] **C4. Render conditional headline + sub-line on `care-need` step**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx` (around `:441-446`)
  - Replace static `<h2>` and `<p>` with conditional:
    ```tsx
    <h2 className="text-2xl font-bold text-gray-900 font-display">
      {variant === "money_loss"
        ? "You might be leaving money on the table."
        : "Families like yours qualify for help."}
    </h2>
    <p className="text-sm text-gray-500 mt-1 mb-6">
      {variant === "money_loss"
        ? `Most ${stateName} families don't realize they qualify for $400-$900/month in benefits.`
        : `${stateName} has ${allPrograms.length} programs. What kind of help does your family need?`}
    </p>
    ```
  - **Depends on:** C2
  - **Verify:** force `variant = "money_loss"` in dev → new copy. Force `"control"` → original.

- [ ] **C5. Render trust strip on BOTH arms below the sub-line**
  - **Files:** `components/providers/BenefitsDiscoveryModule.tsx`
  - Insert between sub-line `<p>` and care-need cards container (around `:447`):
    ```tsx
    <p className="text-xs text-gray-400 mb-6 leading-relaxed">
      <span>Free</span>
      <span className="text-gray-300 mx-1.5">·</span>
      <span>No signup to start</span>
      <span className="text-gray-300 mx-1.5">·</span>
      <span>30 seconds</span>
      <span className="text-gray-300 mx-1.5">·</span>
      <span>Private, never sold to insurers</span>
      <span className="text-gray-300 mx-1.5">·</span>
      <span>{allPrograms.length} {stateName} programs</span>
    </p>
    ```
  - Mobile wrap is acceptable (`leading-relaxed`). No truncation, no icon-ification.
  - On BOTH arms — trust signals are not part of the variant.
  - **Depends on:** C4
  - **Verify:** desktop + mobile (375px); strip wraps cleanly, dynamic count + state correct.

- [ ] **C6. Ship PR C**
  - Title: `Benefits intake: copy A/B + trust strip`. Body links plan + Notion task; call out "Phase C of 3 — instrumentation already shipped; this enables variant assignment + new copy on the money_loss arm."
  - After merge: monitor `provider_activity.metadata.variant` distribution. Decision rule per task body: 20%+ lift on started→completed → ship variant as default; <5% movement → kill variant and look downstream (likely the `financial` step, given how many fields it has).
  - **Depends on:** C1-C5

---

## Risks

- **A1 — name field has hidden downstream consumer.** Mitigation: explicit grep + `display_name` fallback already exists in `business_profiles` insert. Risk is low but not zero (e.g., personalized matched-program email).

- **A — simplified save step looks "empty".** With one field on a Typeform-style large-input layout, the screen may feel under-weighted. Mitigation: keep the eyebrow + sub-line + button; the visual rhythm holds. If post-launch QA shows it feels off, iterate copy weight then.

- **C — variant drift across event types.** `variant` must be on every funnel event. Mitigation: grep checklist before shipping PR C — `grep -n "track-step\|track-start" components/providers/BenefitsDiscoveryModule.tsx` should return ≥6 sites; confirm each passes `variant`.

- **C — `benefits_completed` won't carry variant.** Inserted by `app/api/benefits/save-results/route.ts` which doesn't know about variant. Workaround: join `seeker_activity.benefits_completed` to `provider_activity.benefits_started` on `session_id` at query time. If signal looks promising, ship a tiny PR C.5 that threads variant through to save-results.

- **Volume math.** Current `benefits_started` is ~3/day. PR C 50/50 split = ~1.5/day per arm. Directional signal needs ~2-3 weeks. Decision rule (20%+ lift) is generous because traffic is thin.

- **PHI / overpromising.** Variant headline ("$400-$900/month in benefits") is hedged ("Most families don't realize they qualify"), not personalized. No PHI risk. If legal pushes back, gated on a single boolean — pull instantly.

## Notes

- **Step keys:** code uses hyphenated `"care-need"` etc. Plan uses these as-is in `step_name` event metadata to avoid drift between source and analytics.
- **Variant naming:** `"control"` and `"money_loss"` for clarity in admin queries.
- **Why no Slack ping on new events:** existing `benefits_started` Slack alert is signal-rich (3/day = team-readable). Adding ~4 more per session would flood `#ai-product-development`.
- **Why save-step rework first (not bundled with everything):** PR A might lift completion enough that the entry-point copy variant becomes lower priority. Bundling would make it impossible to attribute the lift. Single-field forms vs. two-field forms is one of the most reliably large effects in conversion testing.
- **Future follow-ups (don't expand this plan):**
  - Pass variant through to `/api/benefits/save-results` for full funnel-by-arm split — only worth doing if A/B signal looks promising.
  - Apply per-step instrumentation to standalone `BenefitsIntakeForm.tsx` if it ever gets traffic.
  - Soft personalization fallback: extract first name from email local part (`sarah@olera.care` → "Sarah") for matched-program emails. Don't build now.
