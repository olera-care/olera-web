# MedJobs Cold-Provider Journey — Stabilization Plan

Status: **PLAN — awaiting build approval**
Branch (planning): `claude/keen-mendel-6i8iW` (off `staging`)
Created: 2026-06-04
Owner: Claude (build) + Logan (decisions + QA)
Supersedes the deferred Bullets 8/9 of `plans/medjobs-phase-2-3-magic-link-and-landing.md` and absorbs the cold-provider conversion gaps found in the 2026-06-04 deep-dive.

## Ultimate goal

A stable, fully-understood provider journey:

> Smartlead outreach email → magic-link click → silent auth → land on campus-filtered Hire Caregivers → accept ONE combined Terms (hiring pilot **+** directory claim) → Trial Active + directory page claimed.

This plan covers the **entire** flow, not the campus filter alone.

## Locked decisions (do not relitigate without surfacing)

1. **Provider profile is org-owned.** The unit of truth is the provider organization (one `olera-providers` listing → at most one owned `business_profiles` row), not the email that clicked.
2. **Terms acceptance is always coupled.** Accepting the MedJobs hiring Terms in the same act **claims the public directory page**. One signature, one combined T&C covering both the caregiver-hiring pilot and the directory-listing claim.
3. **Existing-claim conflicts → co-tenancy, never duplicate.** If a `business_profiles` row already exists for that `source_provider_id` under a *different* account, sign the clicker in read-only and offer "ask to join the team." Never mint a second profile, never transfer ownership automatically.
4. **Contact info stays behind a connection.** Trial Active unlocks browsing full profiles + inviting students to interview *through Olera*. Raw contact details (email/phone/résumé/LinkedIn) remain gated behind an actual Olera connection — independent of trial vs paid (de-platforming moat).
5. **Claim ≠ verification.** Claiming via MedJobs sets `claim_state="claimed"` but leaves `verification_state="unverified"`, exactly as the directory's own `claim-instant` does. Verification remains a separate downstream step.
6. **One canonical profile per `source_provider_id`.** This is the join key between the public directory page and the owned hiring workspace. All resolve-or-create logic keys off it.

## The unified model

There is exactly ONE provider entity with two faces:

| Face | Backed by | Audience |
|---|---|---|
| Public directory page | `olera-providers` row (unclaimed) → overlaid by the `business_profiles` row once claimed, joined via `source_provider_id` | Families searching Olera |
| Hiring workspace (Hire Caregivers) | the *same* `business_profiles` row's `metadata` (pilot flags) | The provider, to hire students |

### Target state machine

```
[1] Cold / unclaimed
    only olera-providers row exists; public page "unclaimed"; no account
        │  admin materializes → student_outreach row (provider_business_profile_id = NULL)
        │  Smartlead sends; provider clicks magic link
        ▼
[2] Authenticated, not claimed   ◄── honest waystation (Option B)
    auth.users + accounts exist; NO business_profile; NO claim; NO trial
    can BROWSE caregivers in preview (redacted)
        │  accepts combined Terms (one signature)
        ▼
[3] Claimed + Trial Active
    ONE owned business_profile: account_id set, source_provider_id set,
      claim_state="claimed", metadata.pilot_active_through=now+90d,
      metadata.interview_terms_accepted_at=now
    public directory page now reflects the claimed profile
    student_outreach → active_partner
    can browse full + invite-to-interview through Olera
        │  (separate, later) verification
        ▼
[4] Verified
    verification_state="verified" → unlocks listing edits / trust signals
    (contact info still gated behind a connection)
```

Co-tenancy branch (decision 3): at step [2]→[3], if a profile already exists for the `source_provider_id` under another account → sign in read-only, emit `claim_conflict`, render "ask to join the team," do not create/transition.

## Current-state defects (evidence)

| # | Defect | Evidence |
|---|---|---|
| D-ROUTE | Magic-link auth force-redirects to `/portal/inbox`; provider never stays on Hire Caregivers. Generic handler only honors `?next=`, defaults to inbox. | `components/auth/AuthProvider.tsx:334,339,408` |
| D-OID | `outreach_id` is dropped at the redirect, so the Terms modal can't tell activation which org to act on → cold activation 404s. | magic-link route redirect (`app/medjobs/m/[token]/route.ts:249-252`); `WelcomeBanner.tsx:70` passes no `outreachId`; `PilotTermsModal.tsx:64`; `pilot/activate` 404 path |
| D-DUP | `pilot/activate` Path A creates a `business_profile` **without checking** an existing `source_provider_id` claim → duplicate profile vs directory `claim-instant` (which does check). | `pilot/activate/route.ts:185-208` vs `claim-instant/route.ts:109-127` |
| D-OWNER | `pilot/activate` Path A insert sets **no `account_id`** → orphaned "claimed" profile nobody owns. | `pilot/activate/route.ts:185-208` |
| D-SLUG | Path A uses raw `olera-providers` slug instead of `generateUniqueSlug` → collision / unique-constraint risk. | `pilot/activate/route.ts:195` |
| D-IDENT | Existing-user lookup scans only first 200 auth users → established provider emails fail the magic link. | magic-link route `listUsers({page:1,perPage:200})` |
| D-MULTI | Each recipient (general + named contacts) gets a token bound to a *different* email → one org can spawn multiple accounts. | `lib/medjobs/smartlead-bridge.ts:239-300` |
| D-LINK | Magic-link BP resolution keys off `provider_business_profile_id` (NULL for cold rows), not `source_provider_id` → misses an existing directory claim. | magic-link route `:183-205` |
| D-ACCESS | Page gates with `medjobsAccessActive` (incl. pilot); API redacts with `getAccessTier` (subscription-only) → Trial-Active UI says "full," server still redacts. | `lib/medjobs/pilot-tier.ts` vs `lib/medjobs-access.ts:54,87`; `app/api/medjobs/candidates/route.ts:54` |
| D-CAMPUS | `?campus` ignored (`void campusFromUrl`); and slug schemes diverge (`texas-am` vs `texas-a-m`). | `app/medjobs/candidates/page.tsx:62`; registries |

## Build plan (chunked)

Each chunk = one cohesive, revertable commit (G6). Typecheck before push. Migration-free where possible (G3); any schema need is surfaced for TJ, not assumed.

### Chunk 0 — Make MedJobs activation behave like the directory claim (foundations)

> **DIRECTORY-SAFETY GUARDRAIL (load-bearing).** This chunk is **additive, not
> invasive**: it does **NOT** modify any live directory claim path
> (`claim-instant`, `claim-listing`, `create-listing`, `claim/finalize` +
> `send-code`/`validate-token`). Those flows are fraud-hardened chokepoints
> (see the 2026-05 fraud postmortem) and stay byte-for-byte untouched. We fix
> the **broken MedJobs write path to match the proven directory behavior** —
> never the reverse. Converging all claim paths onto one shared primitive is a
> *separate, independently-verified* future step (Chunk 7, optional), not part
> of stabilization.

- Fix `pilot/activate` Path A so it adopts the **same guards the directory
  claim already enforces** (do not refactor `claim-instant` — replicate its
  proven behavior):
  - Resolve existing `business_profiles` by `source_provider_id` (exclude
    `claim_state="rejected"`) **before** creating → kills D-DUP.
  - On create: set `account_id` (the org's account) → kills D-OWNER;
    `generateUniqueSlug(...)` instead of the raw directory slug → kills D-SLUG;
    `claim_state="claimed"`, `verification_state="unverified"`,
    `source="claimed_from_directory"`, `source_provider_id`.
  - Exists, same `account_id` → reuse (patch pilot metadata only).
  - Exists, different `account_id` → co-tenancy (decision 3): no create, no
    transition, signal conflict to caller.
- Replace the first-200 `listUsers` scan in the magic-link route with a
  deterministic email→user lookup → kills D-IDENT. (Magic-link route only —
  does not touch directory auth.)
- **Acceptance:**
  - Activating a cold provider creates exactly one owned, claimed,
    uniquely-slugged profile; re-activating is idempotent.
  - A listing already claimed via the directory is **reused, not duplicated**,
    and (if owned by another account) yields co-tenancy.
  - **Regression gate (see Directory-invariant checklist):** every directory
    claim path produces an identical end-state to before this chunk.

### Chunk 1 — Magic-link → auth landing (D-ROUTE + D-OID)
- Give the MedJobs magic-link flow a destination the auth layer actually honors (dedicated authenticated landing or `next`-shaped param) so the provider stays on Hire Caregivers instead of being thrown to `/portal/inbox`.
- Thread `outreach_id` end-to-end: token → redirect URL → `candidates/page.tsx` → `WelcomeBanner` → `PilotTermsModal`.
- **Acceptance:** clicking a real signed URL lands authenticated on `/medjobs/candidates` (no inbox bounce); `outreach_id` is present in the page URL and reaches the Terms modal.

### Chunk 2 — Org-anchored identity (Item 3 / D-MULTI / D-LINK)
- Anchor the experience to `outreach_id` → `source_provider_id` (the org). Magic-link BP resolution keys off `source_provider_id`, not `provider_business_profile_id`.
- Co-tenancy when the resolved profile is owned by another account (decision 3): read-only session + `claim_conflict` touchpoint + banner variant (already partly present).
- **Acceptance:** general-contact click and named-contact click for the same org converge on the same owned profile; different-account ownership yields read-only co-tenancy, no duplicate.

### Chunk 3 — Combined Terms = claim + trial (the heart, decision 2)
- `pilot/activate` calls the Chunk-0 primitive, then sets pilot metadata (`interview_terms_accepted_at`, `pilot_active_through=now+90d`, `terms_accepted_via`), flips `student_outreach → active_partner`, emits `stage_change`.
- Works for the cold provider via threaded `outreach_id` (no BP required up front) → kills the 404 dead-end.
- Rewrite Terms copy + `PilotTermsModal`/agreement PDF to disclose **both**: joining the caregiver-hiring pilot **and** claiming the public Olera directory listing. Keep `make_client` (admin path) and `pilot/activate` (self-serve) producing identical state (Q1 lock).
- **Acceptance:** cold provider accepts once → owned+claimed profile + Trial Active + directory page reflects the claim; admin `make_client` produces an identical end state.

### Chunk 4 — One access predicate (Item 4 / D-ACCESS, decision 4)
- Single source of truth for "MedJobs full access" (pilot OR subscription), consumed by both the candidates page and the candidates API.
- Trial Active → browse full + invite-through-Olera. Raw contact (email/phone/résumé/LinkedIn) stays behind a connection regardless of trial/paid.
- **Acceptance:** a Trial-Active provider sees consistent state on page and API (no "UI full / server redacted" contradiction); contact details remain gated until a connection exists.

### Chunk 5 — Campus filtering (last)
- Slug reconciliation between `student_outreach_campuses.slug` and `medjobs_universities.slug` (data fix, no schema change) → reliable join.
- Wire `?campus=<slug>` → catchment filter default on the board (resolve campus → catchment city/state list or university_id → filter candidates).
- **Acceptance:** a TAMU-region provider lands on a board defaulted to the Texas A&M catchment; clearing the filter shows all.

### Chunk 6 — Edge cases, env guard, QA matrix
- Co-tenancy UX polish; returning-claimed-provider path; `MEDJOBS_MAGIC_LINK_SECRET` presence guard (don't silently ship the marketing fallback URL on a misconfigured env).
- Written QA matrix, each run end-to-end:
  - cold provider (no prior account, no prior claim)
  - provider whose outreach email already has an Olera account
  - listing already claimed by the **same** account (idempotent reuse)
  - listing already claimed by a **different** account (co-tenancy)
  - returning pilot-active provider (no welcome banner, full board)
  - two recipients of the same org clicking different links

#### Directory-invariant checklist (regression gate for Chunk 0)
Before/after Chunk 0, confirm the directory's claim + public surfaces are
**unchanged**. These are the invariants the MedJobs write path must match and
the live directory paths must keep:
- [ ] `claim-instant`, `claim-listing`, `create-listing`, `claim/finalize`
      source is **untouched** (diff shows no edits to these files).
- [ ] Blocked-domain hard block still rejects abuse domains on every claim path.
- [ ] `source_provider_id` "already claimed" → 409 guard still fires (anti-fraud
      chokepoint) on the directory paths.
- [ ] Claiming from the directory still produces: unique slug, `account_id` set,
      `claim_state="claimed"`, `verification_state="unverified"`, membership row,
      `active_profile_id` set.
- [ ] Public provider page still renders the claimed profile (read by
      `source_provider_id`/`slug`) — family search + provider detail unaffected.
- [ ] Activity log (`claim_completed`) + Slack/Loops/deferred-notification
      side-effects still fire on directory claims.
- [ ] Exactly one `business_profiles` row per `source_provider_id` after any
      mix of directory-claim and MedJobs-activation orderings (no duplicates).

### Chunk 7 — (Optional, post-stabilization) Converge claim paths
- Only after stabilization is shipped and QA-green: extract the resolve-or-claim
  core into one shared primitive and migrate the directory claim paths onto it,
  one at a time, each independently regression-tested against the
  Directory-invariant checklist. Pure refactor, no behavior change. Skippable if
  the regression surface isn't judged worth it.
- **Acceptance:** every claim path produces byte-identical end-state to today;
  the Directory-invariant checklist passes after each migration.

## Discipline / risk notes
- **Directory safety is non-negotiable.** No live directory claim path
  (`claim-instant`, `claim-listing`, `create-listing`, `claim/finalize`,
  `send-code`, `validate-token`) is modified during stabilization. We fix the
  broken MedJobs path to match them; we never alter the proven, fraud-hardened
  paths. Risk is confined to the MedJobs write path + the magic-link route.
- Chunk 0 is the load-bearing fix; everything else depends on a single,
  correctly-owned, deduped profile — achieved by replicating the directory's
  existing guards, not by rewriting them.
- G3: prefer no migrations. If a constraint (e.g. unique on `source_provider_id`) is wanted to *enforce* one-profile-per-listing, surface to TJ — single shared Supabase, manual dashboard apply, no staging isolation (see `docs/DATABASE_STRATEGY.md` is a non-adopted proposal; reality is one shared Supabase).
- Keep admin `make_client` and self-serve `pilot/activate` in lockstep — any change to one mirrors to the other.

## Open items for Logan
- Combined Terms / pilot-agreement PDF copy: needs the directory-claim language added (legal/marketing review).
- Whether to add a DB unique constraint on `source_provider_id` (enforcement vs flexibility; schema change).
