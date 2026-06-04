# MedJobs — Architecture Map & Debt Diagnosis (read-only audit)

Status: **MAP / DIAGNOSIS — no code changes**
Created: 2026-06-04
Purpose: Give the team an accurate, shared mental model of the MedJobs system *as it actually is*, and locate where the real tech debt lives (and why), so consolidation is built on understanding rather than reaction.

> Companion docs: `docs/medjobs/OPERATIONAL_BRIEF.md` (the outreach-CRM engineering reference — authoritative for that subsystem), and the two consolidation specs (`plans/medjobs-cold-provider-journey-stabilization.md`, `plans/medjobs-candidate-board-consolidation.md`).

---

## 1. The one-paragraph truth

MedJobs is **three subsystems that grew in three generations and overlap at the edges**. Most of the confusion ("multiple versions floating around") comes from the **provider-demand side**, where each generation added its *own* candidate board, its *own* way to start a trial, and its *own* magic-link login — and they were partially unified by a single access predicate but never actually consolidated.

```
                ┌─────────────────────────────────────────────┐
                │           MEDJOBS = 3 SUBSYSTEMS            │
                └─────────────────────────────────────────────┘

 A. STUDENT SUPPLY            B. PROVIDER DEMAND            C. ACQUISITION CRM
 (clean, single-purpose)      (THE MESS — 3 generations)   (mostly disciplined)
 apply → student profile      candidate boards ×3          student_outreach CRM
 → portal → verification      interviews + credits/$49     (campuses, Smartlead,
 → candidate visibility       cold-outreach pilot          cadence, conversion)
                              3 magic-link systems          + retired staffing_outreach
                              2 trial flags                   still half-alive
```

---

## 2. The three generations (why the mess exists)

| Gen | What it is | Conversion artifact | Board | Login | State |
|---|---|---|---|---|---|
| **G1** | `staffing_outreach` — the original outreach CRM | (its own batch/enroll) | — | `staffing-pilot` token | **"Retired" per the brief, but still live**: `/admin/staffing-outreach/*` UI + API + crons (`staffing-send-email2`, `staffing-sequence-check`); `interviews/quick` still auto-enrolls into it |
| **G2** | Interview-credits product — providers browse, request interviews, pay $49/mo or use 3 free credits | `interview_terms_accepted_at` (→ 90-day access) + `medjobs_credits_used` | `/provider/medjobs/candidates` (gated portal) | `claim-interview` + `validate-interview-token` magic links | Live, this is what main's Navbar "Hire Caregivers" uses |
| **G3** | `student_outreach` CRM + cold-outreach **pilot** (the recent work) | `pilot_active_through` (+ the same `interview_terms_accepted_at`) | `/medjobs/candidates` (public preview) | `/medjobs/m/[token]` welcome magic link | Live, this is what the Smartlead cold emails + the magic link we just fixed use |

**The unification that did happen:** `medjobsAccessActive(metadata)` (in `lib/medjobs/pilot-tier.ts`) ORs the two trial flags so both G2 and G3 grant access. That single predicate is the *only* thing tying the generations together.

**The unification that did NOT happen:** the boards, the magic-link systems, the trial-writing paths, and the university registries were never merged. That's the debt.

---

## 3. Identity & profile model (the spine — shared across all of Olera)

```
auth.users ──1:1── accounts ──active_profile_id──┐
                      │                           ▼
                      └──< business_profiles (type: organization | caregiver | family | student)
                                    │  account_id        (owner; null = unclaimed)
                                    │  source_provider_id (link to olera-providers directory listing)
                                    │  claim_state        (unclaimed→pending→claimed→rejected/archived)
                                    │  verification_state (not_required/unverified/pending/verified/rejected)
                                    │  metadata (JSONB — role-specific; holds the MedJobs flags)
olera-providers (75K directory) ────┘ (the public listing; becomes a claimed business_profile)
```

- **A provider org** = `business_profiles` `type=organization`, optionally linked to a directory listing via `source_provider_id`. Trial/claim flags live in its `metadata`.
- **A student/candidate** = `business_profiles` `type=student`, visible on boards when `is_active && metadata.application_completed`.
- **Claim ≠ verification** is a deliberate, system-wide split (claim = ownership; verification = trust gate that unlocks contact info / listing edits).

Full field + metadata glossary: see the data-model section the audit produced (entities: `business_profiles`, `interviews`, `medjobs_universities`, `student_outreach*`, `medjobs_experience_logs`, `medjobs_job_posts`).

---

## 4. Route map (condensed, by subsystem)

**A — Student supply (clean):**
- `/medjobs/apply` (+ `/api/medjobs/apply`, `apply-partial`, `check-email`) → creates student profile
- `/portal/medjobs` (profile/verification), `/portal/medjobs/jobs` (browse providers), `/portal/medjobs/interviews`

**B — Provider demand (the duplicated surface):**
- Boards: **`/medjobs/candidates`** (public, G3) · **`/provider/medjobs/candidates`** (gated portal, G2) · `/admin/medjobs/candidates` (admin) — all read `/api/medjobs/candidates`
- Detail: **`/medjobs/candidates/[slug]`** *and* **`/provider/medjobs/candidates/[slug]`** (duplicate)
- Interviews: `/provider/caregivers` (provider calendar) + `/portal/medjobs/interviews` (student calendar) — both `/api/medjobs/interviews`
- Conversion APIs: `/api/medjobs/pilot/activate` (G3) · `/api/medjobs/interviews` + `interviews/quick` (G2) · admin `handleMakeClient` — **all write the trial flag**
- Onboarding/login: `ProviderOnboardingModal`, `/api/medjobs/claim-interview`, `/medjobs/m/[token]`, `/medjobs/staffing-pilot`

**C — Acquisition CRM (mostly clean, see OPERATIONAL_BRIEF):**
- `/admin/medjobs/*` (In Basket, prospects, clients, partners, Smartlead refresh, catchment audit) + `/admin/student-outreach/*` (campuses, stakeholders, queue) over `student_outreach*` tables
- **G1 remnant:** `/admin/staffing-outreach/*` + its crons (parallel, retired-but-live)

---

## 5. Where the debt actually is (and what's fine)

**Clean / intentional — leave alone:**
- Subsystem **A** (student funnel) — single path, coherent.
- The **identity spine** (accounts/profiles/claim/verification) — shared and sound.
- The **outreach CRM** (`student_outreach`, subsystem C) — disciplined per the operational brief.
- Public-vs-gated board split *as a concept* — it exists for a real auth reason (cold providers have no profile yet).

**Real debt — concentrated in subsystem B (provider demand):**
1. **3 candidate boards + 2 detail pages** backed by one API/card, drifted in chrome. *(See board-consolidation spec.)*
2. **2 trial mechanisms** (`interview_terms_accepted_at` 90-day vs `pilot_active_through`) written by 6+ paths, glued by one predicate. No single "grant trial" function.
3. **3–4 magic-link/token systems** (`m/[token]`, `claim-interview`+`validate-interview-token`, `apply` auto-sign-in, `staffing-pilot`) — each re-implements "verify token → resolve/auth user → link profile → redirect." This is the same shape we just hand-fixed in `m/[token]`; the others have the same latent bugs (e.g. the first-200 `listUsers` pattern, redirect handling).
4. **2 university registries** (`medjobs_universities` vs `student_outreach_campuses`) with slug drift. *(See stabilization spec.)*
5. **G1 `staffing_outreach` is retired-but-live** — dead-ish admin UI + crons still running + referenced by `interviews/quick`. Risk: confusion, double-sends, wasted compute.

---

## 6. Principled direction (not a build order yet)

The wise sequence is **understand → unify the spine → consolidate the surface → retire the dead generation** — smallest-risk, highest-clarity first. Targets, in order of leverage:

1. **One "grant MedJobs trial/claim" primitive.** We already started this with `resolveOrClaimProviderProfile`; extend the idea so *every* conversion path (interview, pilot, admin) calls one function and writes one canonical trial representation. Collapses debt #2.
2. **One magic-link/identity primitive.** Extract the "verify token → resolve user (deterministic) → link profile → redirect" logic the 3–4 flows each re-implement into a single helper. Collapses debt #3 and removes the latent bugs in the interview/staffing links.
3. **One candidate board (component-shared, two thin route wrappers) + one detail page.** Per the board-consolidation spec. Collapses debt #1.
4. **One university registry** (reconcile slugs or add the FK). Collapses debt #4.
5. **Decide G1's fate** — fully retire `staffing_outreach` (delete UI + pause crons) or document why it stays. Collapses debt #5.

Each is independently shippable and independently valuable. None requires a big-bang rewrite. The order matters: the spine primitives (1, 2) make the surface consolidations (3) safe, and (5) is pure subtraction.

## 7. Open questions for the team (need human intent, not guesses)
- Is the **interview-credits product (G2)** still the monetization, or is the **cold-outreach pilot (G3)** the new front door — or both? This decides which board/conversion is canonical.
- Is **`staffing_outreach` (G1)** truly dead? If so, who turns off its crons?
- Should the **public board** remain the cold-provider entry (recommended), with the portal board for claimed providers — unified by shared components?

---

## Appendix — confidence notes
- High confidence (verified in code this session): the 3 generations, dual trial flags + 6 writer paths, 3–4 magic-link systems, staffing_outreach still live, 2 boards + 2 detail pages, 2 university registries.
- Medium confidence (from audit agents, not all hand-verified): exact backing tables for some `/admin/medjobs/*` task pages (calls/meetings/replies may use `business_profile_tasks` distinct from `student_outreach_tasks` — confirm before consolidating the admin CRM).
