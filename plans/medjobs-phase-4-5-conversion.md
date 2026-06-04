# Phase 4+5 — Conversion Gate + Pilot Active Activation

Status: **SKELETON** (scope locked from Logan-approved bullets 2026-06-04; full detail pass before build starts)
Coupling: **Ships to prod together** — Phase 4 alone has the T&C modal opening but no Pilot Active state transition (clicking Continue persists nothing actionable)
Branch: `medjobs/phase-4-5-conversion` (created off staging when Phase 2+3 ships)
Owner: Claude (build) + Logan (approval gate before build starts)

## Goal

Provider attempts one of three meaningful student actions (Invite to interview, Save to shortlist, See contact info) → T&C modal opens → reads + agrees → API atomically advances `claim_state` + sets pilot timer + transitions outreach to `active_partner` + the original action runs with newly-unlocked permissions.

## Phase IV bullets (conversion gate — T&C modal)

1. **T&C modal component** — verb-matched title ("Before you invite this student"), plain-language intro, 4 reassurance bullets (free 3mo / no hiring obligation / your agency makes decisions / public listing stays visible), full-agreement link, PDF download link, **unchecked agreement checkbox** (legal best practice), action-verb-matched continue button (disabled until checked)
2. **PDF rendering / download** — serve the pilot agreement PDF (HomeSpark template), org-name-personalized
3. **Modal trigger wiring** — on the three actions: Invite to interview, Save to shortlist, See contact info
4. **Proceeds-with-original-action flow** — on accept, run pilot activation API → then the original action runs with the now-unlocked permissions (no re-click needed)
5. **Pilot activation API (stub)** — `/api/medjobs/pilot/activate` writes `interview_terms_accepted_at` + `pilot_active_through = now+90d` + `terms_accepted_via = "self_serve"`. **Full wiring lands in Phase V.**
6. **Modal styling** — matches existing `LogModalShell` pattern; clean, professional, not legalese-heavy

## Phase V bullets (conversion completion — Pilot Active wiring)

1. **Pilot activation API full wiring** — also advance `claim_state = "claimed"` (axis 2b, because pilot signature IS the formal identification), transition outreach to `active_partner` via existing engine, emit `stage_change` touchpoint
2. **Two-path conversion alignment** — admin `make_client` ALSO sets `pilot_active_through = now+90d` so admin path and self-serve path produce identical state
3. **Listing-deletion guard** — backend guard returns 409 when `pilot_active_through > now()` with clear "end pilot first" message
4. **Returning Pilot Active provider experience** — when they visit `olera.care/medjobs/candidates` directly (no magic link), session persists, full board renders
5. **CRM stage signals / narration** — outreach drawer's narration renders new `note_added` reasons (platform_visited, claim_conflict, etc.); Partner Prospects unlock verified
6. **End-to-end E2E test** — walk a fixture row through: email send → click → preview browse → T&C accept → action proceeds → CRM reflects → catchment unlocks

## Canonical detail to write before build starts

Before this branch is cut, a detail-pass updates this skeleton with:
- T&C modal UX wireframe (or mock from the existing `LogModalShell`)
- 4 reassurance bullet copy locked (drafts exist in [`post-launch-outreach-redesign-plan.md`](post-launch-outreach-redesign-plan.md) § P1.E T7)
- Pilot activation API request/response shapes
- Atomic-transaction semantics for the activation (Postgres transaction with all state mutations)
- Listing-deletion guard wiring (which existing handler?)
- Returning-provider routing logic (does session detection happen middleware or page-level?)
- E2E test scenario in detail (fixture row + each transition checkpoint)

That detail pass is ~1 day of strategy work, scheduled during Phase 2+3 build (parallel).

## Acceptance criteria (placeholder)

Will be refined during detail pass. Provisional:
- Click any of three triggering actions on preview board → T&C modal opens with verb-matched title + 4 reassurance bullets
- Unchecked checkbox; Continue button disabled until checked
- Accept → board re-renders in full mode within ~1 second
- Original action (e.g., "Invite to interview" for student X) proceeds with newly-unlocked permissions
- `business_profiles.metadata.interview_terms_accepted_at`, `pilot_active_through`, `terms_accepted_via` all set correctly
- `business_profiles.claim_state` advances from `"unclaimed"` to `"claimed"`
- `student_outreach.status` advances to `"active_partner"`
- `stage_change` touchpoint emitted
- Partner Prospects unlock in catchment (verify via existing predicate)
- Returning provider visits `/medjobs/candidates` later → session persists, full mode renders
- Listing deletion attempt while `pilot_active_through > now()` → returns 409 with clear message

## Build log

(populated during build)

## Open issues / mid-build findings

(populated during build; cross-reference `medjobs-known-issues.md`)

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 4.3, 4.9, 4.10, 4.11, 4.12, 4.13, 5.8
- v3 post-launch plan: [`post-launch-outreach-redesign-plan.md`](post-launch-outreach-redesign-plan.md) § P1.E T7-T9 + § P1.E.5
- Pilot agreement PDF: `/root/.claude/uploads/.../pilotagreementhomespark.pdf`
- Existing modal pattern: `components/admin/medjobs/LogModalShell.tsx`
- Existing T&C modal pattern: `app/medjobs/staffing-pilot/page.tsx` (writes `interview_terms_accepted_at`)
- Logan's 10-bullet framing (in thread 2026-06-04): items 3, 4
