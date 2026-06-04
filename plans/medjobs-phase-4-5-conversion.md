# Phase 4+5 — Conversion Gate + Pilot Active Activation

Status: **DETAILED PLAN — building now**
Branch: `medjobs/phase-4-5-conversion` (off `staging` at `ef014cb`)
Coupling: **Ships to prod together** — Phase 4 (T&C modal UI) and Phase 5 (activation wiring) are inseparable
Owner: Claude (build) + Logan (end-of-phase QA)
Created: 2026-06-04

## Goal

Wire the conversion gate: the welcome banner's "Activate the pilot →" CTA (already in place from Phase 2+3 Bullet 12) now opens a real T&C modal. On acceptance, a self-serve activation API atomically advances `claim_state` + sets `pilot_active_through` + transitions outreach → `active_partner` + emits `stage_change`. After this phase, cold providers can go from email click → preview → pilot active end-to-end without admin intervention.

## What's already in place (verified)

- **Welcome banner with "Activate the pilot →" CTA** — Phase 2+3 Bullet 12. Currently calls `openAuth()` as a placeholder; Phase 4+5 wires it to open the new T&C modal.
- **Admin-driven activation** — Phase 1 Bullet 11 + Phase 1 Bullet 11 prior. `handleMakeClient` (when "Activate pilot on their behalf 🎉" outcome is picked in `LogMeetingModal`) already sets `interview_terms_accepted_at` + `pilot_active_through = now+90d` + `terms_accepted_via = "admin"` + transitions to `active_partner`. The conversion engine + downstream effects (Partner Prospects unlock, `stage_change` touchpoint, pending-task cancellation) all work.
- **Pilot tier predicate** — `medjobsAccessActive` (Phase 2+3 Bullet 2) already reads `pilot_active_through`. The candidate board flips from preview to full mode the moment the activation API runs.
- **Pilot Active 🎉 NextStepCard branch** — Phase 1 Bullet 6. The outreach drawer renders "Pilot Active 🎉" with days-left countdown the moment `pilot_active_through` is set.

This phase is mostly about a **self-serve mirror** of what Phase 1 Bullet 11 wired for admins.

## Phase 4 bullets (T&C modal)

1. **T&C modal component** — verb-matched title, plain-language intro, 4 reassurance bullets, full-agreement link, PDF link, **unchecked agreement checkbox**, action-verb-matched continue button (disabled until checked)
2. **PDF rendering / download** — serve the pilot agreement PDF, org-name-personalized
3. **Modal trigger wiring** — for MVP scope, the only trigger is the welcome banner's "Activate the pilot →" CTA. The plan's three-action triggers (Invite / Save / See contact) require those actions to exist first — they don't today.
4. **Proceeds-with-original-action flow** — on accept, run pilot activation API → close modal → page refreshes to render full mode
5. **Pilot activation API** — `POST /api/medjobs/pilot/activate` writes the full state set
6. **Modal styling** — matches existing `LogModalShell` pattern

## Phase 5 bullets (Pilot Active wiring)

1. **Pilot activation API full wiring** — already designed via Phase 1 Bullet 11 reuse; this phase exposes a self-serve endpoint that runs the same atomic transaction
2. **Two-path conversion alignment** — ✅ **ALREADY DONE** in Phase 1 Bullet 11 (`handleMakeClient` extended)
3. **Listing-deletion guard** — backend guard returns 409 when `pilot_active_through > now()` on the existing provider-delete handler
4. **Returning Pilot Active provider experience** — when they visit `/medjobs/candidates` directly (no magic link, no `?welcome=1`), the session persists + the candidate board renders in full mode. **No new work; falls out of existing infrastructure.**
5. **CRM stage signals / narration** — outreach drawer's narration handles `note_added(reason: "platform_visited" | "claim_conflict" | "self_serve_activation")`. Most renders already correctly (the Phase 1 narration was generic enough).
6. **End-to-end E2E test** — manually walk a fixture row through: token → click → preview → "Activate the pilot" → T&C accept → board re-renders full → CRM reflects.

## Architecture decisions (detail pass)

### Action triggers — scope clarification

The v3 plan called for T&C to trigger on Invite to interview / Save to shortlist / See contact info. **None of these actions exist on the candidate board today.** Adding them is its own substantial scope (UI buttons + API endpoints + per-student state). For Phase 4+5 MVP, the only T&C trigger is the welcome banner's "Activate the pilot →" CTA — that's the path from cold magic-link click to Pilot Active.

When Phase 6+ adds Invite/Save/See-contact actions, each gets the same modal as a pre-flight gate. The modal component is built reusable for that.

### Pilot activation API — single endpoint, two callers

`POST /api/medjobs/pilot/activate` — body: `{ outreach_id?: string }`. Resolves the outreach row from either:
- Explicit `outreach_id` body field (from the welcome banner's CTA which has the URL context)
- The signed-in user's `business_profiles.account_id` linkage (returns the most recent outreach if multiple)

Server-side, runs the same atomic transaction as `handleMakeClient` but with `terms_accepted_via = "self_serve"`. Reuses the existing engine — no duplicated logic.

Auth: requires a signed-in session (which the magic-link path establishes).

### Listing-deletion guard

The existing provider-delete handler lives at... let me check. Likely `/api/admin/providers/[slug]/route.ts` or similar. The guard is a single SQL check before deletion:

```sql
SELECT metadata->>'pilot_active_through' AS pat FROM business_profiles WHERE slug = $1;
```

If `pat > now()`, return 409 with a clear message. Else allow.

### Returning-provider experience

Falls out of existing infrastructure:
- Session cookie persists from magic-link click (Supabase auth handles refresh)
- Subsequent `/medjobs/candidates` visit → board reads `medjobsAccessActive(metadata)` → returns true → full mode
- No `?welcome=1` query → welcome banner suppressed (Phase 2+3 Bullet 12 already gates on this)

**No new work**. Existing session + pilot tier predicate + welcome-banner gating cover it.

### PDF rendering

Two options:
- **A**: Render the PDF as inline content in the modal (PDF.js or similar). Heavyweight; pulls in a viewer.
- **B**: Render a clean structured version of the agreement text directly in the modal as HTML, with a separate "Download PDF" link to the canonical PDF file.

**Option B** is wiser. The PDF is the legal source of truth; the modal renders human-readable plain language. Provider can download the PDF if they want the artifact, but the modal doesn't need to embed it.

PDF file: store as a static asset at `public/medjobs/pilot-agreement.pdf` (org-personalization happens at PDF-generation time if/when needed; for MVP a static unsigned template is fine — provider signs by clicking the checkbox).

## The 6 bullets, ordered by build sequence

| # | Phase | Bullet | Days | Depends on |
|---|-------|--------|------|------------|
| 1 | V | Pilot activation API endpoint | 1 | nothing (reuses Phase 1 engine) |
| 2 | V | Listing-deletion guard | 0.5 | nothing |
| 3 | IV | T&C modal component | 1.5 | nothing |
| 4 | IV | Wire welcome-banner CTA to modal | 0.5 | 1 + 3 |
| 5 | IV | PDF static asset + agreement text | 0.5 | nothing |
| 6 | E2E | E2E test + narration polish | 0.5 | 1 + 3 + 4 |

**Total: ~4 days of build (~1 week).** Much smaller than Phase 1 or Phase 2+3 because most of the heavy lifting (admin path, candidate board preview mode, NextStepCard Pilot Active branch) is already in place.

Chunks:
- **Chunk A — backend** (Bullets 1 + 2): activation API + deletion guard
- **Chunk B — UI** (Bullets 3 + 4 + 5): T&C modal + wire + PDF asset
- **Chunk C — polish** (Bullet 6): E2E walk-through + narration check

## Bullet-by-bullet detail

### Bullet 1 — Pilot activation API (1 day)

**File:** `app/api/medjobs/pilot/activate/route.ts` (new)

**Scope:**
- POST handler, accepts `{ outreach_id?: string }` body
- Auth: requires a session via the existing `createClient` server helper
- Logic:
  - Resolve outreach row from `outreach_id` (preferred) or from the user's business_profiles linkage
  - Reuse `handleMakeClient` logic with `terms_accepted_via = "self_serve"` override
  - Return `{ ok: true, outreach_id, business_profile_id, pilot_active_through }` on success
- Errors: 401 if no session, 404 if no resolvable outreach, 409 if already Pilot Active, 500 on transaction failure

**Acceptance:**
- E2E: signed-in user POSTs with their outreach_id → `interview_terms_accepted_at` + `pilot_active_through` + `terms_accepted_via="self_serve"` set on `business_profiles.metadata`
- `claim_state` advances to `"claimed"` (axis 2b finally moves)
- Outreach row transitions to `active_partner`
- `stage_change` touchpoint emitted with `via: "self_serve"` audit
- Partner Prospects unlock in catchment (existing behavior)

### Bullet 2 — Listing-deletion guard (0.5 day)

**File:** TBD (find existing provider-delete handler)

**Scope:**
- Before deleting a `business_profiles` row, check `metadata.pilot_active_through > now()`
- If active pilot, return 409 with message: "Your public listing is required while your pilot is active. To delete, end the pilot first by contacting logan@olera.care."
- Else allow deletion

**Acceptance:**
- Manual test: pre-set `pilot_active_through` to a future date on a fixture profile; try to delete → 409. Set to a past date → 200.

### Bullet 3 — T&C modal component (1.5 days)

**File:** `components/medjobs/PilotTermsModal.tsx` (new)

**Scope:**
- Reuses `LogModalShell` styling for consistency
- Title: "Before you activate the pilot" (verb-matched to the only current trigger; reusable for future Invite/Save triggers)
- Plain-language intro: "Quick agreement so we can activate the pilot for {org_name}. Here's what you're saying yes to:"
- 4 reassurance bullets (locked Q13 wording):
  - ✓ Free for 3 months — no payment information needed.
  - ✓ No obligation to hire anyone you review.
  - ✓ Your agency makes all hiring decisions — we just connect you with students.
  - ✓ Your public Olera profile stays visible while you're in the pilot — students and families need to find you.
- "Read the full pilot agreement →" link (opens modal-within-modal or routes to `/medjobs/pilot-agreement.pdf`)
- "Download as PDF →" link (direct download)
- **Unchecked agreement checkbox** by default (legal best practice per Q12)
- Continue button (disabled until checkbox checked): "Agree and activate pilot"
- Cancel button (closes modal, no state change)

**Acceptance:**
- Visual matches existing LogModalShell + Phase 1 modal patterns
- Checkbox must be actively checked for Continue to enable
- Clicking Continue calls the activation API + closes modal + triggers page refresh

### Bullet 4 — Wire welcome-banner CTA (0.5 day)

**File:** `components/medjobs/WelcomeBanner.tsx`

**Scope:**
- Replace the `openAuth()` placeholder with the new modal mount
- WelcomeBanner becomes the orchestrator: holds modal-open state + renders the PilotTermsModal when triggered + calls activation API + refreshes on success

**Acceptance:**
- Click "Activate the pilot →" on the welcome banner → modal opens
- Accept → modal closes + page refreshes + welcome banner disappears (pilot now active → predicate flips) + candidate board renders in full mode

### Bullet 5 — PDF static asset + agreement text (0.5 day)

**File:** `public/medjobs/pilot-agreement.pdf` (new) + agreement text in modal

**Scope:**
- Place a copy of the pilot agreement PDF (HomeSpark template generic version) at `public/medjobs/pilot-agreement.pdf`
- Modal links to it for download

**Acceptance:** clicking "Download as PDF" downloads the file. (For full org-personalization, a future enhancement renders the PDF dynamically with `{org_name}`. MVP ships the template.)

### Bullet 6 — E2E test + narration polish (0.5 day)

**Scope:**
- Walk a fixture row through the full journey:
  - Send magic-link token (Phase 2+3 wired)
  - Click → land on candidate board with welcome banner
  - Click "Activate the pilot →" → modal opens
  - Check checkbox + Continue → API runs → board re-renders full mode
- Verify CRM state:
  - `interview_terms_accepted_at` set
  - `pilot_active_through > now()`
  - `terms_accepted_via = "self_serve"`
  - `claim_state = "claimed"`
  - Outreach status = `active_partner`
  - `stage_change` + `note_added(reason: "self_serve_activation")` touchpoints emitted
  - Drawer renders "Pilot Active 🎉" with days-left
- Polish any narration text for the new touchpoint reasons (`platform_visited`, `claim_conflict`, `self_serve_activation`) if narrate logic doesn't already handle them gracefully

## Build log

(populated chunk-by-chunk during build)

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 4.9–4.13
- v3 post-launch plan: [`post-launch-outreach-redesign-plan.md`](post-launch-outreach-redesign-plan.md) § P1.E T7-T8 + § P1.E.5
- Phase 1 Bullet 11 build log (handleMakeClient extended) — `medjobs-phase-1-operational-backbone.md`
- Phase 2+3 build log (welcome banner CTA placeholder) — `medjobs-phase-2-3-magic-link-and-landing.md`
- Existing modal pattern: `components/admin/medjobs/LogModalShell.tsx`
- Existing T&C pattern: `app/medjobs/staffing-pilot/page.tsx` (writes `interview_terms_accepted_at`)
- Pilot agreement PDF: `/root/.claude/uploads/.../pilotagreementhomespark.pdf`
