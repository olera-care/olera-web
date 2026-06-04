# MedJobs Candidate Board — Consolidation Spec

Status: **SPEC — for review, no code yet**
Created: 2026-06-04
Author: Claude (analysis) + Logan (decisions)
Related: `plans/medjobs-cold-provider-journey-stabilization.md` (the magic-link work that surfaced this)

## Problem

There are **two "Hire Caregivers" boards** backed by the **same API (`/api/medjobs/candidates`)** and the **same `CandidateCard`**, created in the same commit (2026-05-05) and since drifted:

| Route | Audience | Gate | Linked from |
|---|---|---|---|
| `/medjobs/candidates` | Public funnel + cold magic-link providers | **None** (public) | Marketing pages (`/medjobs`, `/medjobs/providers`), magic link |
| `/provider/medjobs/candidates` | Claimed providers | **`app/provider/layout.tsx`** gates: providerless → `router.replace("/portal")` | Navbar "Hire Caregivers", dashboard, onboarding, matches |

Plus duplicate detail pages: `/medjobs/candidates/[slug]` (834 lines) and `/provider/medjobs/candidates/[slug]` (777 lines).

**Symptom that exposed it:** the magic link lands cold providers on `/medjobs/candidates`, which looks different from the board main's nav uses, and shows the empty-state **demo card** (the "long card") when the catchment is empty.

**Root cause:** not cosmetic duplication — a real **auth-gate split**. `/provider/medjobs/candidates` requires a provider profile (else ejects to `/portal`); a cold magic-link provider has **no** provider profile yet (claim deferred to Terms), so it MUST use the ungated public board. The two boards then drifted in chrome.

## Target architecture

**One auth-aware board at the ungated public route `/medjobs/candidates`**, rendering off the access tier the API already computes:

| Viewer | Board data | Provider features (interviews/contacted/invite) | CTAs |
|---|---|---|---|
| Unauthenticated | preview (redacted) | hidden | "Sign in to contact" → `openAuth` |
| Authed, not claimed (cold) | preview + welcome banner | hidden | "Activate pilot" → PilotTermsModal |
| Authed + claimed (pilot/paid) | full | shown | Invite / See contact |

- `/provider/medjobs/candidates` → **redirect** to `/medjobs/candidates`.
- Navbar "Hire Caregivers" + dashboard/onboarding/interview links → repoint to `/medjobs/candidates`.
- Same treatment for the `[slug]` detail pages → one.
- Provider-only sections render **only when `providerProfile` exists** (the "renders differently when authenticated" behavior).

Why the public route is the home (not `/provider/*`): it's ungated, so it serves unauth + cold + claimed alike. The `/provider` layout adds **no visual chrome** (it returns `children`; the Navbar is global) — its only job is the gate — so nothing visual is lost by moving off it.

## Migration surface (what must move onto the unified board)

From `/provider/medjobs/candidates` (586 lines) that the public board lacks:
- **Interview scheduling integration** — `/api/medjobs/interviews`, `?schedule=true` deep-link handling, `ProviderOnboardingModal`.
- **"Contacted" tab + tracking** — derived from interviews where `proposed_by === provider_profile_id`.
- **Pagination** (`Pagination`) — vs the public board's infinite scroll.
- **Filters modal** (`CandidateFiltersModal`, multi-select cities + counts) — vs the public board's inline `CandidateFilters` (+ the new campus filter).

From the detail pages: reconcile the 834-line public vs 777-line portal `[slug]` pages (preview/redaction vs scheduling).

## Risk register (senior-dev review — the blindspots)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R1** | **Redirect runs too late.** `app/provider/layout.tsx` gates `/provider/medjobs/*` and ejects providerless users to `/portal` BEFORE any page-level `redirect()` executes. A naive in-page redirect would still bounce cold providers. | **High** | Put the redirect in **`next.config.ts`** (edge-level, runs before React layouts), not in the page. Permanent redirect. |
| **R2** | **Merging two 500–800 line pages with live scheduling flows** risks breaking interview scheduling for claimed providers. | **High** | Phase the work (below). Extract a shared presentational core first; migrate scheduling last, behind QA. |
| **R3** | **`/api/medjobs/interviews` must not be called for unauth/cold viewers** (401/leak/noise). | Medium | Gate the interviews fetch on `providerProfile` presence. |
| **R4** | **`schedule=true` deep links** (`ProviderOnboardingModal`, post-onboard) target `/provider/medjobs/candidates/[slug]?schedule=true`. Redirecting must preserve the query + still open the scheduler. | Medium | Redirect must carry query params; verify the detail page honors `schedule=true` post-redirect. |
| **R5** | **Stale string references** to the old route break silently: `app/provider/[slug]/onboard/page.tsx:868` (`storedRedirect === "/provider/medjobs/candidates"`), `SmartDashboardShell` sessionStorage value, `InterviewCalendar`, `provider/matches`. | Medium | Grep + update every reference; keep the redirect as a safety net. |
| **R6** | **Empty-state demo card** should only appear for the cold-provider campus context, not for a claimed provider browsing all candidates. | Low | Gate `EmptyCandidatesLadder` on the cold context (`welcome` + not claimed), as it already is. |
| **R7** | **Pagination vs infinite scroll + `loadAll`.** Portal fetches ALL candidates (`loadAll=true`) for client-side filtering; at scale that's a large payload. | Low/Medium | Pick one model during merge; prefer server pagination + the existing filters. Don't silently adopt `loadAll` globally. |
| **R8** | **SEO/canonical.** `/medjobs/candidates` is a `"use client"` page (no SSR metadata today), so low indexing risk; but confirm no canonical elsewhere points at the portal route. | Low | Verify metadata; the redirect is internal (portal route isn't indexed). |
| **R9** | **Access-tier consistency.** Claimed-but-unverified providers must still have contact redacted (the de-platforming gate from the stabilization work). | Low | Reuse the unified predicate already shipped (`medjobsAccessActive` + `hasFullAccess`). |
| **R10** | **`/browse/caregivers` is NOT in scope** — it browses `type=caregiver` profiles for families, a different product. Don't fold it in. | — | Leave untouched. |

## Recommended phased plan (low-risk first)

**Phase A — Kill the visual drift (low risk, high value, no route changes).**
Extract a shared `<CandidateBoard>` presentational core (grid + `CandidateCard` + filter UI + empty state) rendered by BOTH existing routes. Each route keeps its wrapper. This fixes the user's actual complaint ("looks different") with minimal regression surface. Ship + QA.

**Phase B — Collapse to one route (higher risk, deliberate).**
- Move provider-only features (interviews/contacted/scheduling/invite) onto the unified board as `providerProfile`-gated sections.
- `next.config.ts` redirect `/provider/medjobs/candidates(/.*)? → /medjobs/candidates$1` (R1).
- Repoint Navbar + all references (R5); update `schedule=true` deep-link handling (R4).
- Consolidate the two `[slug]` detail pages the same way.
- Full QA matrix below before merge.

Phasing means the visual win lands safely now; the risky route-collapse is isolated and reversible.

## Open decisions (for Logan)
- **Filters model:** inline (`CandidateFilters` + campus) vs modal (`CandidateFiltersModal`, multi-city)? Pick one for the unified board.
- **Paging model:** server pagination/infinite-scroll vs `loadAll` + client filter (R7).
- **Canonical URL:** confirm `/medjobs/candidates` is the keeper (recommended — it's ungated and already public).
- **Phase B now or later:** do we collapse routes in this pass, or ship Phase A and schedule B?

## QA matrix (before any Phase B merge)
- Unauthenticated visit from `/medjobs` marketing → preview board, "sign in" CTAs, no errors.
- Cold magic-link provider (no profile) → preview + welcome + Activate-pilot, **not** ejected to `/portal`.
- Claimed pilot-active provider via Navbar → full board + interviews/contacted + invite actions.
- Claimed-but-unverified → full names, contact still redacted (R9).
- `schedule=true` deep link → scheduler opens on the (redirected) detail page (R4).
- All old `/provider/medjobs/candidates` links resolve via redirect (R5).
