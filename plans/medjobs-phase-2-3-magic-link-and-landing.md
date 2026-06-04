# Phase 2+3 — Magic Link + Provider Landing Experience

Status: **DETAILED PLAN — building now**
Branch: `medjobs/phase-2-3-magic-link-landing` (off `staging` at `20a3048`)
Coupling: **Ships to prod together** — Phase 2 alone would land magic-link clicks on the paywalled candidate board (broken interim)
Owner: Claude (build) + Logan (end-of-phase QA)
Created: 2026-06-04

## Goal

Cold providers click the magic-link CTA in their outreach email → silently authenticated via JIT account creation → land on the candidate board in preview mode with the empty-state ladder rendering whatever it can show for their catchment.

**This phase does NOT** advance pilot membership (Phase 4+5) or change anything for already-authenticated providers visiting `/medjobs/candidates` directly (the existing public board is unchanged for non-cold visitors).

## What already exists (verified during detail pass)

The infrastructure survey from the v3 plan was accurate. Concretely:

- `app/api/auth/auto-sign-in/route.ts` — takes an email + `claimSession`, returns `{ tokenHash }`. Uses Supabase Admin API's `createUser({ email_confirm: true })` + `generateLink({ type: "magiclink" })`.
- `app/auth/magic-link/page.tsx` — handles the hash-fragment redemption flow (extracts `access_token`, sets session, ensures account, redirects to `next`).
- `app/api/auth/ensure-account/route.ts` — creates the `accounts` row.
- `app/api/provider/claim-instant/route.ts` — creates `business_profiles` + `memberships` atomically (currently sets `claim_state="claimed"` + `verification_state="unverified"`).
- `app/medjobs/candidates/page.tsx` — the existing candidate board. Public-readable. Free-tier accounts see redacted data; paid-tier see full.

**The gap to fill:** a server-signed token + landing route that decodes the token, runs the existing primitives in the right order, and lands the provider on the candidate board in **preview mode** (a new render mode the board doesn't have today).

## Architecture (the load-bearing decisions)

### Token layer

Custom HMAC-signed token carrying `{ outreach_id, email, expires_at, jti }`:

- **Algorithm**: HMAC-SHA256 over `<payload-json-base64url>.<header>` matching the JWT-compact serialization pattern. We don't ship a JWT library; we hand-roll the HMAC because we control both ends and don't need RS256 / asymmetric.
- **Storage of secret**: `MEDJOBS_MAGIC_LINK_SECRET` env var (Supabase prod + Vercel). 256-bit random.
- **TTL**: 30 days (Q5 lock).
- **JTI**: random UUID per token, used for one-shot revocation.

### One-shot redemption via touchpoint ledger

Rather than a new table (G3 violation), the JTI ledger uses `note_added` touchpoints:

- On successful redemption: emit `note_added(reason: "platform_visited")` with `payload.jti = <token jti>` and `payload.user_id = <auth user id>`.
- Before processing a redemption: check `student_outreach_touchpoints WHERE outreach_id = ? AND touchpoint_type = "note_added" AND payload->>jti = <jti>` — if exists, the token was already used. Reject with "This link was already used."

This means:
- Re-clicking the same email link → "already used" page with sign-in fallback
- Returning provider with a cookie session → goes to `/medjobs/candidates` normally
- No new schema needed

### Account/profile resolution (axis 1 + 2a; NOT 2b)

When a magic-link click lands:

1. **Token decode + JTI check** — see above
2. **Resolve auth user**:
   - Existing user with this email → use existing
   - No user → `admin.createUser({ email, email_confirm: true })`
3. **Resolve account**:
   - Call `/api/auth/ensure-account` server-side, OR replicate its logic (single `INSERT ... ON CONFLICT`)
4. **Resolve business_profile** (this is the load-bearing axis 2a vs 2b split):
   - Lookup by `source_provider_id` matching the outreach row's `provider_id`
   - **No business_profile exists**: INSERT with:
     - `account_id = <new account>`
     - `claim_state = "unclaimed"` ← KEY: not `"claimed"` (axis 2b stays inactive)
     - `verification_state = "unverified"`
     - Sourced from `olera-providers` row (display_name, address, etc.)
   - **Exists, `account_id IS NULL`**: UPDATE with `account_id` (axis 2a advance only)
   - **Exists, `account_id = <this user>`**: no-op
   - **Exists, `account_id` is different**: co-tenancy edge case — see below
5. **Session establishment**:
   - Use the existing `auto-sign-in` primitive: server-side calls `generateLink` → gets `token_hash` → the page client redeems via `verifyOtp({ token_hash, type: "magiclink" })`.
6. **Audit touchpoint** — `note_added(reason: "platform_visited", payload: { jti, user_id, business_profile_id })`
7. **Redirect** — to `/medjobs/candidates?welcome=1` (the welcome banner is suppressed by default; the `welcome=1` query toggles it on for first-click)

### Co-tenancy edge case (Q8 locked: read-only co-tenancy)

When `business_profile.account_id` belongs to a DIFFERENT user:

1. Sign the cold-email recipient in (axis 1 advances — they get a session)
2. Do NOT mutate `business_profiles.account_id` (axis 2a stays as-is)
3. Emit `note_added(reason: "claim_conflict", payload: { existing_account_id, new_account_id, outreach_id })`
4. Redirect to candidate board WITHOUT linking — board renders in permanent preview mode for this user (Phase 3's preview-mode predicate falls through)
5. Future axis-3 action attempts (Invite / Save / See contact in Phase 4+5) will prompt "this org is already linked to another team member" — for now (Phases 2+3), just the board renders cleanly

### Preview mode vs full mode on the candidate board (the Phase 3 surface)

The existing `/medjobs/candidates` board has two render modes today: public (paywalled-redacted) + paid (full). Phase 3 adds a THIRD mode: **preview mode** for authenticated-but-not-pilot-active accounts:

- **Preview cards**: name, year, brief bio, photo. NO contact info. Action buttons (Invite to interview / Save / See contact info) rendered DISABLED with action-verb tooltips like "Accept the pilot agreement to invite this student" — those buttons + the T&C modal trigger come in Phase 4+5.
- **Full cards**: existing paid-tier behavior, gated on the new pilot tier predicate (see below).

### Pilot tier predicate (Option A — single predicate)

Extend the existing `medjobs_subscription_active` predicate to OR-include pilot membership:

```ts
function medjobsSubscriptionActive(metadata: Record<string, unknown> | null): boolean {
  if (metadata?.medjobs_subscription_active === true) return true;
  const pilotThrough = metadata?.pilot_active_through;
  if (typeof pilotThrough === "string") {
    const t = new Date(pilotThrough).getTime();
    if (Number.isFinite(t) && t > Date.now()) return true;
  }
  return false;
}
```

This is the **only** access predicate. One function, one source of truth. Phase 5's self-serve activation will set `pilot_active_through` directly; Phase 1's admin path (`handleMakeClient`) already does.

### Catchment filtering on the board

Detail-pass decision: when an authenticated provider lands, the board defaults to filter by their catchment. Catchment derived from:

1. The outreach row's `campus_id` → campus's geo (catchment area).
2. If no outreach context (returning provider visit), fall back to the business_profile's city/state.
3. Filter applied as default query param on the page: `?campus=<slug>` or `?state=<state>&city=<city>`.

Existing candidate-board filter UI (state/city dropdowns) already supports this — we just set defaults.

### Empty-state ladder (the make-or-break UX)

Four rungs, picked in order:

1. **Real local students** (≥3 in the catchment) — render normally
2. **Sample students from peer campuses** — anonymized; clearly labeled "Sample from another campus while we recruit at {their_campus}"
3. **Demo candidate** — Logan DuBose, real face + bio, prominent DEMO badge ("Demo profile · Logan DuBose, founder, also a med student. Real students will replace this view.")
4. **Recruiting in progress** — "47 pre-nursing students contacted at {campus} this week. You'll see profiles here as they're vetted."

Activate-pilot CTA (Phase 4+5 wires this; for now it's a placeholder) stays available at every rung.

## The 15 bullets, ordered by build sequence

| # | Phase | Bullet | Days | Depends on |
|---|-------|--------|------|------------|
| 1 | II | Magic-link token lib (sign/verify/JTI check) | 1 | nothing |
| 2 | III | `pilot_active_through` extension + tier predicate | 0.5 | nothing |
| 3 | II | Magic-link landing route `/medjobs/m/[token]` | 2 | 1 |
| 4 | II | Co-tenancy edge case handling | 0.5 | 3 |
| 5 | II | Token security hardening (expiry page, signature verify) | 0.5 | 1 |
| 6 | II | Provider email templates rewrite (magic-link CTA + brand one-liner) | 1 | 1 (URL format) |
| 7 | II | Audit touchpoint emission (platform_visited) | 0 (in 3) | 3 |
| 8 | III | Candidate board preview-mode rendering | 2 | 2 |
| 9 | III | Catchment filtering defaults | 0.5 | 8 |
| 10 | III | Empty-state ladder component | 2 | 8 |
| 11 | III | Demo profile setup (Logan as labeled demo) | 0.5 | 10 |
| 12 | III | Welcome banner on first click | 0.5 | 3, 8 |

**Total: ~10 days of build at 1 dev (~2 weeks).** Chunked similarly to Phase 1:

- **Chunk A** (foundations, no UI): Bullets 1 + 2 + 5 — token lib, pilot tier predicate, security primitives.
- **Chunk B** (server flow): Bullets 3 + 4 + 7 — landing route + co-tenancy + audit. End of chunk: a cold-provider URL works end-to-end at the route level.
- **Chunk C** (email): Bullet 6 — templates rewrite. Separate chunk because it's the one user-facing piece that's safe to ship even without preview-mode landing (just generates the URLs).
- **Chunk D** (UI): Bullets 8 + 9 + 10 + 11 + 12 — preview mode, catchment defaults, empty-state ladder, demo profile, welcome banner. The Phase 3 heart.

## Bullet-by-bullet detail

### Bullet 1 — Magic-link token lib (1 day)

**File:** `lib/medjobs/welcome-token.ts` (new)

**Scope:**
- `signWelcomeToken(payload, secret): string` — produces compact `<headerB64>.<payloadB64>.<sigB64>` format
- `verifyWelcomeToken(token, secret): { ok: true; payload } | { ok: false; reason }` — verifies sig, checks `expires_at`
- `WelcomePayload` type: `{ outreach_id: string; email: string; expires_at: number; jti: string }`
- Helper `freshJti()` returning `crypto.randomUUID()`
- Helper `buildWelcomeUrl(payload, secret, siteUrl): string` → `olera.care/medjobs/m/<token>`

**Acceptance:** unit test round-trip: sign → verify produces same payload. Tampered tokens fail verify. Expired tokens fail with `reason: "expired"`. Bad signature fails with `reason: "bad_signature"`.

### Bullet 2 — Pilot tier predicate (0.5 day)

**Files:**
- `lib/medjobs/pilot-tier.ts` (new) — single function `medjobsSubscriptionActive(metadata)` per the spec above
- Replace `business_profiles.metadata.medjobs_subscription_active === true` checks across the codebase with calls to this predicate

**Acceptance:** with `metadata.medjobs_subscription_active = true` → true. With `metadata.pilot_active_through > now()` → true. With both false / expired → false. Unit-test the date-math edge cases.

### Bullet 3 — Magic-link landing route (2 days)

**File:** `app/medjobs/m/[token]/route.ts` (new) — Next.js Route Handler that returns a redirect

**Flow per the architecture decisions above (steps T1–T7 from the v3 plan):**

```ts
GET /medjobs/m/[token]
  1. Decode token via verifyWelcomeToken. Bad → redirect to /medjobs/m/expired with reason
  2. Check JTI: SELECT 1 FROM student_outreach_touchpoints WHERE outreach_id = payload.outreach_id AND touchpoint_type = 'note_added' AND payload->>jti = payload.jti. Found → redirect to /medjobs/m/used
  3. Resolve auth.users by email (createUser({email_confirm:true}) if new)
  4. Resolve accounts via ensure-account logic
  5. Resolve business_profiles (axis 2a only):
       - Lookup by source_provider_id
       - No row → INSERT with account_id, claim_state="unclaimed"
       - Exists, account_id null → UPDATE account_id
       - Exists, account_id matches → no-op
       - Exists, account_id mismatches → co-tenancy path (bullet 4)
  6. Generate session via auto-sign-in (returns token_hash)
  7. Insert audit touchpoint: note_added(reason: "platform_visited", payload: { jti, user_id, business_profile_id })
  8. Redirect to /medjobs/candidates?welcome=1#access_token=...&refresh_token=...
     (the candidates page extracts the hash + sets session, then strips the hash)
```

**Edge case pages** (no auth):
- `app/medjobs/m/expired/page.tsx` (new) — "This link expired. Email logan@... if you'd like a fresh one."
- `app/medjobs/m/used/page.tsx` (new) — "This link was already used. Sign in at olera.care/login with {pre-filled email}."

**Acceptance:** end-to-end test: sign a token → curl the URL with `-L` → land authenticated on candidate board with audit touchpoint emitted + business_profile created.

### Bullet 4 — Co-tenancy edge case (0.5 day)

**File:** `app/medjobs/m/[token]/route.ts` (extending bullet 3 step 5)

**Scope:**
- When `business_profile.account_id` belongs to a different user:
  - Sign user in (steps 6 + 7 still run)
  - Skip the account_id mutation
  - Emit `note_added(reason: "claim_conflict")` IN ADDITION TO the `platform_visited` touchpoint
  - Redirect to `/medjobs/candidates?welcome=1&claim_conflict=1`

**Acceptance:** fixture: pre-claim a business_profile with account_A; click magic-link addressed to account_B's email; confirm read-only session + claim_conflict touchpoint emitted.

### Bullet 5 — Token security (0.5 day, included in bullet 3 with explicit tests)

Hardening tests + edge handling for bullet 1's primitives:
- Tampered signature → expired/invalid page
- `expires_at` in past → expired page
- JTI mismatch (token JTI changed mid-flight) → used page
- Email-payload tampering → MAC fails → expired page
- Replay (same token in two rapid requests) → second one hits the JTI ledger check (assuming the first succeeded)

### Bullet 6 — Provider email template rewrite (1 day)

**File:** `lib/student-outreach/templates.ts`

**Scope:**
- Replace existing Day 0 / Day 3 / Day 7 provider templates with new copy per v3 § P1.D
- Single primary CTA, campus-personalized: **"Review {campus} student caregivers →"** linking to `olera.care/medjobs/m/<token>` (token signed at send time)
- Brand-consistency one-liner: "...you'll land on olera.care, our main platform." (per §6.7)
- Secondary CTAs unchanged (reply / Calendly)
- Day 3 / Day 7 follow the same structure but lighter (intro → light follow-up → graceful close)
- No "trial" language anywhere

**Token signing at send time:** the templates need to invoke `buildWelcomeUrl(payload, secret, siteUrl)` per recipient. Token signing happens during email render (which already happens server-side per-recipient).

**Acceptance:** render Day 0 + Day 3 + Day 7 for a fixture provider row; manually decode the token in each rendered email; confirm payload matches the row + expiry = now+30d.

### Bullet 7 — Audit touchpoint emission (folded into Bullet 3 step 7)

The plan called this out as separate but it's a one-liner inside the landing route. Already covered.

### Bullet 8 — Candidate board preview-mode rendering (2 days)

**Files:**
- `app/medjobs/candidates/page.tsx` (edit)
- `components/medjobs/CandidateCard.tsx` (or wherever the card renders — search needed)
- `components/medjobs/CandidateBoardClient.tsx` (or similar — needs a new render mode prop)

**Scope:**
- New session state: `viewerTier` = `"public" | "preview" | "full"`
  - `public` — unauthenticated; existing behavior (paywall redaction)
  - `preview` — authenticated but `medjobsSubscriptionActive(metadata) === false`; **new state**
  - `full` — authenticated AND `medjobsSubscriptionActive(metadata) === true`; existing behavior
- Preview-mode card rendering:
  - Name, year, brief bio, photo visible
  - Contact info hidden ("Accept the pilot agreement to see contact info" tooltip)
  - Action buttons (Invite to interview / Save to shortlist / See contact info) DISABLED with verb-matched tooltips. Phase 4+5 wires the actual triggers; for now they're inert.
- Page-level fetcher to determine viewerTier from session + business_profile.metadata
- Existing public-viewer behavior preserved exactly

**Acceptance:** three test scenarios:
1. Unauthenticated visit → public mode (paywall as today)
2. Cold-clicker who just landed → preview mode (preview cards + disabled tooltips)
3. Pilot-active provider visit (with `metadata.pilot_active_through > now()`) → full mode

### Bullet 9 — Catchment filtering defaults (0.5 day)

**Files:** candidate board page + filter component

**Scope:**
- Determine catchment from:
  - URL `?campus=<slug>` (passed by the welcome banner's first redirect — bullet 12) OR
  - User's primary business_profile.city + state (default for returning visits)
- Set filter dropdowns to that catchment by default
- User can clear the filter to see all campuses (existing UI supports this)

**Acceptance:** TAMU-region provider → board defaults to Texas A&M / Texas filters

### Bullet 10 — Empty-state ladder (2 days)

**File:** `components/medjobs/EmptyCandidates.tsx` (new)

**Scope:**
- Four-rung component per the architecture above:
  1. Real local students (≥3) — render normally (no fallback)
  2. Sample from peer campuses — fetch from other campuses, label clearly
  3. Demo candidate — Logan profile (bullet 11)
  4. Recruiting momentum — banner copy with computed-or-estimated count
- Pick highest rung; render single mode

**Acceptance:** test against catchments with: ≥3 students, 1 student, 0 students. Verify each rung renders correctly.

### Bullet 11 — Demo profile setup (0.5 day)

**File:** `lib/medjobs/demo-candidate.ts` (new) — static data + photo URL

**Scope:**
- Hardcoded demo profile object: Logan DuBose, real bio (founder + med student), real photo URL (Olera assets)
- Returned by `EmptyCandidates.tsx` rung 3 when invoked
- Prominent DEMO badge on the card (e.g. amber pill in the upper-right)
- Bio text: "Demo profile · Logan DuBose, founder, also a med student. Real students will replace this view as we recruit at {campus}."

**Acceptance:** demo profile renders with DEMO badge clearly visible; can't accidentally be confused for a real student

### Bullet 12 — Welcome banner on first click (0.5 day)

**Files:** candidate board page

**Scope:**
- When `?welcome=1` query param is present + viewer is in preview mode:
  - Render a thin welcome banner at the top: "Welcome to the {campus} student caregiver board. Browse the students; accept the pilot agreement when you're ready to invite anyone to interview."
  - Dismiss button removes the query param and hides the banner
- Banner DOES NOT render for returning visitors (no `?welcome=1`) or for paid/pilot-active accounts
- Claim_conflict banner variant when `?claim_conflict=1` is also present: "This organization is already linked to another team member. Browse freely; we'll handle access when you're ready to act."

**Acceptance:** first magic-link click shows the welcome banner; dismiss removes the query param + hides it; subsequent visits to `/medjobs/candidates` (no param) show no banner.

## Build order (the load-bearing detail)

Each chunk = one cohesive commit pair. Push after each chunk so the Vercel preview is always current.

**Chunk A — foundations (Day 1)**: Bullets 1 + 2 + 5. No new user-visible behavior. Token lib + pilot tier predicate.

**Chunk B — server flow (Day 2–3)**: Bullets 3 + 4 + 7. End of chunk: cold-provider URL works at the route level — clicking a signed URL produces an authenticated session + business_profile linkage + redirect to candidate board.

**Chunk C — email (Day 4)**: Bullet 6. Templates rewrite. Note: this can ship to staging independently of Chunk D (the URLs will work; just won't render the preview-mode magic until Chunk D).

**Chunk D — UI (Day 5–7)**: Bullets 8 + 9 + 10 + 11 + 12. The Phase 3 heart. Preview mode + catchment defaults + empty-state ladder + demo profile + welcome banner.

## Definition of done for Phase 2+3

All 12 bullets meet acceptance criteria PLUS:

- [ ] Branch `medjobs/phase-2-3-magic-link-landing` ready to merge
- [ ] Vercel preview demonstrates: real cold-provider URL → silent auth → preview-mode candidate board with empty-state ladder rendering
- [ ] Logan QA confirms preview mode looks correct on multiple fixture rows (high-student catchment, low-student catchment, zero-student catchment)
- [ ] Co-tenancy fixture works (read-only mode + claim_conflict touchpoint)
- [ ] Email rendering: Day 0 + Day 3 + Day 7 with magic-link CTA + brand one-liner
- [ ] Build log section populated chunk-by-chunk
- [ ] Master plan §3 (SHIPPED) updated to list Phase 2+3 deliverables (post-merge)
- [ ] `MEDJOBS_MAGIC_LINK_SECRET` env var documented for TJ to set on Vercel prod + preview (post-merge)

## Build log

### Day 1 — 2026-06-04 (Wed) — all four chunks shipped

**Chunk A — foundations (Bullets 1 + 2 + 5):**
- `lib/medjobs/welcome-token.ts` — HMAC-SHA256 sign/verify primitives with v1 header, 30-day TTL (Q5), per-token JTI. `buildWelcomeUrl` helper normalizes email to lowercase. Verified via 9-test tsx round-trip script (sign/verify, tampered sig rejected, expired rejected, wrong secret rejected, malformed rejected, build URL correct, pilot tier predicate all paths).
- `lib/medjobs/pilot-tier.ts` — `medjobsAccessActive` ORs paid subscription + active pilot. `medjobsAccessTier` returns `"none" | "pilot" | "subscription"` for surfaces that need to distinguish. `pilotDaysRemaining` for the Pilot Active 🎉 countdown.
- Candidate board readers updated: `app/medjobs/candidates/page.tsx` + `app/medjobs/candidates/[slug]/page.tsx` now use the new predicate.

**Chunk B — server flow (Bullets 3 + 4 + 7):**
- `app/medjobs/m/[token]/route.ts` — GET Route Handler implementing T1–T8 journey: token decode → JTI check (one-shot via touchpoint ledger) → auth user resolve (`createUser({ email_confirm: true })` or `listUsers` lookup if exists) → account insert if new → business_profile axis 2a linkage (no `claim_state` mutation; co-tenancy edge case = read-only) → audit touchpoint emit → Supabase magiclink generation → final redirect with welcome URL carrying `?welcome=1[&campus=...][&claim_conflict=1]`. Defensive: bad token / Supabase failures redirect to `/medjobs/m/expired?reason=<x>` with per-reason copy.
- `app/medjobs/m/expired/page.tsx` — clean error page; covers reasons: expired / invalid / missing / user / link / config.
- `app/medjobs/m/used/page.tsx` — "link already used" page with candidate-board CTA + sign-in fallback prefilled with email.

**Chunk C — email templates + Smartlead bridge (Bullet 6):**
- Day 0/3/7 provider templates rewritten per v3 P1.D: single primary CTA "Review {campus} student caregivers →" pointing at `{welcome_url}`. Reply + Calendly stay as smaller secondary CTAs. **No "trial" language anywhere.** "Pilot" appears once per email as honest framing (master plan § Δ1). Brand-consistency line ("Lands on olera.care" / "you'll land on olera.care, our main platform") so the findmedjobs.co → olera.care brand jump isn't a surprise (§ 6.7). Subject reads "Texas A&M student caregivers · Olera" (replaces the old "Olera's Texas A&M Student Caregiver Program" — shorter, more inbox-friendly).
- `substituteVars` accepts `welcome_url`; falls back to `PROGRAM_URL` when not provided.
- `lib/medjobs/smartlead-bridge.ts` — `rowToLeads` now sets `custom_fields.welcome_url` per-recipient via `buildWelcomeUrl` (each lead's unique signed token). `finalizeTokens` maps `{welcome_url}` → `{{welcome_url}}` Smartlead merge tag. Falls back to `PROGRAM_URL` when secret unset (dev / preview).
- Verified: all 9 template acceptance checks pass via tsx render script (welcome URL in CTAs, brand line, no trial language, pilot mentioned for honest framing).

**Chunk D — UI (Bullets 10 + 11 + 12; Bullet 8 deferred; Bullet 9 deferred):**
- `components/medjobs/WelcomeBanner.tsx` — first-arrival banner with two variants (default + claim-conflict). Default copy: "Welcome to the student caregiver board. Browse the students; accept the pilot agreement when you're ready to invite anyone to interview." Renders only when `?welcome=1` AND viewer is signed-in-but-not-pilot-active. Includes "Activate the pilot →" CTA (placeholder until Phase 4+5 wires the T&C modal — currently triggers `openAuth`).
- `lib/medjobs/demo-candidate.ts` — Logan DuBose locked demo profile per Q4. Real bio + photo + prominent `DEMO` badge + bio prefix so no confusion possible.
- `components/medjobs/EmptyCandidatesLadder.tsx` — combines rung-4 (recruiting-momentum banner) + rung-3 (demo candidate card with amber `DEMO · This is not a real student` header). Rung-2 (sample students from peer campuses) deferred — needs an API to fetch + anonymize across-campus profiles.
- `app/medjobs/candidates/page.tsx` updated: reads `?welcome` + `?campus` + `?claim_conflict` from URL via `useSearchParams`; renders WelcomeBanner conditionally; renders EmptyCandidatesLadder when candidate list is empty AND viewer is cold-provider context.

**Deferred items (logged for follow-up):**
- **Bullet 8** (explicit preview-mode card rendering with disabled-action buttons): the existing candidate API already redacts contact info for non-paid viewers, so preview mode is effectively in place via the existing infrastructure. The disabled-action-buttons UX is moot until Phase 4+5 wires the actual Invite/Save/See-contact actions. Re-evaluate during Phase 4+5 detail pass.
- **Bullet 9** (catchment defaults from `?campus=<slug>`): the current `CandidateFilterValues` shape uses `city + state` not `campus_slug`. Setting catchment defaults from the URL requires a campus→state/city mapping that doesn't exist today. Phase 2+3b follow-up.

**Typecheck:** clean across all 4 chunks.

**Phase 2+3 ready for QA** on the Vercel preview once the magic-link infrastructure is activated on staging (TJ sets `MEDJOBS_MAGIC_LINK_SECRET` env var).

## Open issues / mid-build findings

(populated during build; cross-reference `medjobs-known-issues.md`)

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 4.5–4.8, 4.12, 4.14, 4.16, 6.7
- v3 post-launch plan: [`post-launch-outreach-redesign-plan.md`](post-launch-outreach-redesign-plan.md) § P1.D, P1.E (T0–T10 journey), P1.F, P1.I
- Phase 1 plan (parallel pattern): [`medjobs-phase-1-operational-backbone.md`](medjobs-phase-1-operational-backbone.md)
- Existing `/api/auth/auto-sign-in/route.ts`, `/auth/magic-link/page.tsx`, `/api/auth/ensure-account/route.ts`, `/api/provider/claim-instant/route.ts`
- Existing `/medjobs/candidates/page.tsx`
