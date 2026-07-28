# /m/{token} v2 — the living journey

Locked with TJ 2026-07-28 (build NOW, before promote — startup speed over
sequencing). Branch: `benefits-living-journey` off staging `05b24527`.
Reference: Airbnb Trips (TJ screenshots, session 263c4d61) — a living record
where user actions + time change the page. V1's failure: read-only, no
continuation, no reason to return.

## Scope (one PR)

1. **Write API** `POST /api/families/benefits-journey`
   - Auth: the /m token itself (body `{ token, action, ... }`); look up
     benefits_results_tokens → profile_id. NOT the signed outcome token.
   - Actions:
     - `{ action: "call_made" }` → benefits_cascade.first_step_done_at = now
       (+ first_step_done_program_id). Do NOT set outcome (that stays the
       family's check-in self-report); coordinator/queue read this new field.
     - `{ action: "doc_toggle", doc: string, checked: boolean }` →
       benefits_cascade.docs_checked: string[] (add/remove).
   - Metadata-only writes — NO new seeker_activity event types (avoids CHECK
     migration; fb:event_allowlist_needs_db_migration). Mirror nothing else.
   - All writes await; return the updated cascade slice.

2. **Client island** `components/benefits/JourneyActions.tsx` ("use client")
   embedded in BenefitsHome (server shell stays server):
   - Hero gains "I made the call ✓" secondary button under the call button.
     Tap → optimistic done state ("Nice. That was the hard part.") → POST.
   - Done state (from server cascade OR optimistic): hero collapses to a
     compact done card (program name + ✓ + "You started {shortName}") and an
     **"Up next" card** appears: the next program (server pre-computes
     nextStep = second pick from the same selection ladder, passed as prop).
   - Document checklist rows become persisted checkboxes (initial state from
     cascade.docs_checked; optimistic toggle + POST; failure reverts).
   - Error feedback on failed POSTs (fb:error_feedback_first).

3. **Journey timeline** replaces the progress pill row: 3 step cards
   (done / current / up next) — Matched ✓ (n programs), First step
   (current/done per first_step_done_at), Up next (locked until call_made).
   Small, restrained; not a wizard.

4. **Server wiring** (app/m/[token]/page.tsx): pass token string, cascade
   (now incl. first_step_done_at + docs_checked), nextStep pick (run
   selectFirstStepProgram excluding the first pick's programId — add an
   `exclude?: string[]` opt to the lib fn), initial checked docs.

5. **Coordinator fast-follow (same PR if small)**: B2 check-in — if
   first_step_done_at set, subject/copy shifts from "How is it going" to
   "You made the call. Here's what's next" (still the 3 chips). If it grows,
   defer to next PR and note in handoff.

## Explicitly out

- SMS rungs, wants_help day-one on page, copy buttons, admin queue chip for
  first_step_done (queue reads cascade already; add chip text only if free).

## Validate

tsc; local render + interaction (dev server + chrome-devtools on localhost:
tap call-made + doc checks, reload, state persists); pre-test review; PR.

## Status

- [x] Branch
- [ ] API route
- [ ] selectFirstStepProgram exclude opt + page wiring
- [ ] JourneyActions client island + BenefitsHome integration
- [ ] Timeline
- [ ] Validation + PR
