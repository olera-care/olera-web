# Olera Provider Data Foundation

> **Living document, design phase, no code yet.** We define the foundation here, then build it over a few weeks. This is the canonical engineering copy; a team-facing version lives in Notion (Branch Handoff Reports, page `3825903a-0ffe-810d-9bdb-effb3384da56`). Keep both current.
> **Owner:** TJ · **Started:** 2026-06-17 · **Branch:** `relaxed-feynman`

---

## The short version

Olera's most basic data, what a "provider" is and what an "account" is, sits on a shaky foundation. Two database tables do overlapping jobs, the link between them isn't enforced, and one of them is a catch-all that holds four completely different kinds of people in the same shape. The result is a bug we keep hitting: when we build a feature, we (and the AI) reach for the wrong table.

This is the ground floor for everything coming next, the marketplace, monetization, the family-to-caregiver lane. If it's crooked, every floor above it is crooked. So we're fixing it properly, with a plan that removes the confusion early and saves the risky data changes for last.

There's one decision needed before any code gets written. It's at the end.

## What's actually going on

Picture two tables.

The first, `olera-providers`, is the directory. It's the Yellow Pages of senior care, about 74,000 active businesses we've gathered (and ~41,000 more we've soft-deleted in cleanups, so ~115,000 rows in the table). Almost none of them have "logged in"; they're just listings.

The second, `business_profiles`, is the accounts table. It's where someone lands when they sign up. Here's the problem: it doesn't just hold providers. It holds providers, families looking for care, individual caregivers, and nursing students from MedJobs, all crammed into one table shape with a junk-drawer field (`metadata` JSONB) for the parts that don't fit. That's why the name never felt right. The table is vague because it's doing four jobs at once.

The two are supposed to be connected. When a provider claims their listing, we tag their account with the listing's ID (`source_provider_id`). But nothing in the database enforces that tag, so about one in six are wrong or stale.

None of this is exotic. The headline problem isn't "we have two tables." It's three quieter things:

- There's no single, official way to look up a provider. Every feature does it by hand, so every feature is a fresh chance to get it wrong. That's the confusion we keep hitting.
- The accounts table is overloaded, which makes it hard to reason about and easy to misuse.
- The link between the two isn't enforced, so it drifts.

## Why it's worth weeks of work

Two reasons.

First, it's slowing us down today. Every time we touch provider data we re-answer "which table?" and sometimes answer wrong.

Second, it's the foundation. The undercount bug in MedJobs, where prospect counts came in 7 to 140 times too low, happened because a feature read the accounts table and forgot the 74,000-business directory existed. That's not a one-off. It's the same root cause, and it will keep producing bugs until the foundation is fixed. Everything we want to build next sits on top of this.

## Where we're headed

The instinct to "combine the two tables" is the wrong move, and it's worth saying why. You can't merge a directory of businesses with a table that also holds families and students. They're different things. Merging them would be like filing your customers and your job applicants in one folder because both are "people."

The right move is the opposite: separate the things that are actually different, and combine only the one thing that's genuinely the same.

So the end state looks like this. A care business is one thing with one ID, whether it's claimed or not. Families, caregivers, and students each get their own clearly named home instead of sharing one. Underneath them all sits a small shared "identity" record that ties a person to their login and lets two parties connect, like a family reaching out to a provider. Every table is named for exactly what it holds, so "which table?" stops being a question.

```
accounts (auth)
   └─ profiles (the small shared identity record: id, account_id, type)   ← connections/activity point here
        ├─ providers   (care businesses; claimed = has an account; absorbs the directory)
        ├─ families    (care seekers)
        ├─ caregivers  (individual workers)
        └─ students    (MedJobs candidates)
```

## How we get there without breaking things

You don't gut-renovate a house while people are living in it by knocking down every wall at once. You do it room by room, and you keep the plumbing working the whole time.

Same here. Five steps, each one shippable on its own, each one leaving the product working:

1. **Build the single front door.** One official way to look up a provider (`lib/providers/`, extending today's `lib/provider-identity.ts`), and we point every feature at it. This alone kills the wrong-table confusion, and it doesn't move a single piece of data. Lowest risk, biggest immediate payoff. We do this first. It's also a prerequisite for every later step, since you can't safely swap tables underneath the app until reads flow through one place.
2. **Enforce the link** between the two tables (real foreign key + backfill) and clean up the stale ones.
3. **Split the overloaded accounts table** so families, caregivers, and students each get their own home, behind the shared identity record.
4. **Combine the directory with claimed providers,** so a business is finally one record. The core data move. Done last and gated.
5. **Rename everything** to the clean names and clear out the old scaffolding.

The point of the order: the confusion goes away in step one, before we touch any data. The scary, hard-to-undo changes come last, once everything already flows through that one front door and we can safely change what's behind it. We can stop after any step and still be better off than today.

## The honest risks

- **One database, no practice run.** Staging and production share a single database, so every change is live the moment we make it. Each step needs a careful data backfill and a way to undo it.
- **The directory table is partly a black box.** `olera-providers` predates this codebase and has no schema here; its columns are only inferable from usage. Dump the real live structure (columns, types, indexes, RLS) before the deep changes.
- **iOS is the wildcard.** We can freely reshape the directory only because the iOS app is being rebuilt. If the current app is still reading these tables when we make the deep changes, mobile breaks. Steps 1–2 are safe regardless; step 4 needs a green light that iOS is truly decoupled.
- **RLS asymmetry.** `business_profiles` has row-level security; `olera-providers` looks public. Relinking touches access control; easy to silently open or close a door.
- **Scope creep.** This touches sign-up, MedJobs, connections, admin, and SEO. The phasing exists to keep each change small. Don't do two steps at once. And don't let the catchment undercount pull the project off course; it's a symptom with its own narrow fix, and the front door fixes the whole class of bug.

## The first decision — DECIDED: Option A (2026-06-17)

When we separate everything out, two parties still need to connect. A family reaches out to a provider, and we record that. The question was how to wire those connections, because today `connections` and `seeker_activity` both point at `business_profiles(id)` regardless of type.

- **Option A (chosen):** keep a small shared identity record (`profiles`); connections/activity FK to `profiles(id)`. Specialized tables (providers/families/caregivers/students) extend it 1:1 by `profile_id`. (Shared-primary-key / class-table-inheritance.)
- **Option B (rejected):** drop the spine; each connection stores `(from_type, from_id, to_type, to_id)`. (Polymorphic associations.)

**Why A.** Integrity is the deciding factor: A keeps `connections.to_profile_id → profiles(id)` an enforced foreign key, so the DB guarantees the target exists. B's polymorphic FK **cannot be enforced by Postgres** — it reintroduces the exact unenforced-link disease this project exists to cure, spread across every relationship table. A is also the smallest migration (every current FK already points at `business_profiles(id)`; keep the spine inheriting those ids and they keep working — only the type-specific columns move out), and it keeps connection queries a single join instead of a four-way branch/UNION. Cost: one extra join for type-specific fields — trivial, indexed. Best practice, least debt, least churn, clearest. Reversible if a future requirement genuinely demands it; nothing on the horizon does.

The exact column split (what stays on the spine vs. moves to extension tables) is a step-3 detail. The spine-exists decision is locked.

---

## Step 1 — The front door (scope locked 2026-06-17)

**Goal:** one module, `lib/providers/`, that is the only sanctioned way to read/resolve a provider. It absorbs the resolution dance currently copy-pasted across surfaces (the canonical example is `app/provider/[slug]/page.tsx:290-440` — a ~150-line 5-step resolve: directory-by-slug → directory-by-id → accounts-table → soft-deleted reason-aware redirect/410 → 404). Extends the existing seed `lib/provider-identity.ts`.

**Locked decisions (TJ, 2026-06-17):**
1. **Parity-first.** Keep today's either/or resolution (a provider resolves to its directory row OR its account row, not merged). The directory+account *merge* is Step 2's first task, once the link is enforced. Step 1 changes no resolution behavior.
2. **Reads only.** Writes (admin edits, claim flow) stay where they are; consolidated in a later sub-step.
3. **Lint guard ships with Step 1.** `no-restricted-syntax` banning `.from("olera-providers")` and `.from("business_profiles")` outside `lib/providers/`. Flipped on after migration; makes the wrong-table bug impossible to reintroduce.

**Module shape:**
- `lib/providers/types.ts` — `ProviderView` (unified type: provenance `source: 'directory' | 'account'`, canonical id/slug, claim/verification status, merged google/cms/trust fields).
- `lib/providers/adapters.ts` — centralizes the two normalizers currently inline (`iosProviderToProfile` → `directoryRowToProvider`; the BP→Profile mapping → `accountRowToProvider`).
- `lib/providers/resolve.server.ts` — `resolveProvider(slugOrId, client)` returning a discriminated result `{ kind: 'active', provider } | { kind: 'redirect', to } | { kind: 'gone' } | { kind: 'not-found' }`; `getProvidersByIds(ids, client)` batched for lists; folds in `resolveCanonicalProviderId`.
- **Takes the caller's Supabase client** (anon vs service-role vs server) rather than picking its own, so RLS visibility never silently changes.

**Rollout (each a small, behavior-identical PR, stop-anywhere-safe):**
1. **PR #1:** build the module + convert `app/provider/[slug]/page.tsx` (hardest case, proves the API; preserve the SEO-loadbearing deleted-redirect/410 logic exactly). ✅ **BUILT 2026-06-17, tsc clean, uncommitted.** Module: `lib/providers/{types,adapters,resolve.server,index}.ts` (`resolveProvider`, `resolveProviderForMeta`, `getClaimedAccount`). Page −165 net lines; all reads routed through the front door; only the view-tracking *write* (line ~481) deliberately left (reads-only boundary). `getProvidersByIds` deferred to PR #2's first consumer.
2. **PR #2:** read-heavy API routes — `info`, `organization-search`, `admin/directory` (+export), `leads`/`questions` joins.
3. **PR #3:** crons (`weekly-provider-digest`, `family-nudges`, `aggregate-provider-views`, `google-reviews`) + `sitemap.ts`.
4. **PR #4:** stragglers (connections read, `inbox`, `WelcomeClient`) + flip on the eslint guard.

**Watch items:** behavioral parity on the deleted-provider 410/redirect dance (snapshot first); anon-vs-service-role client per call site; N+1 in list surfaces (batch `getProvidersByIds`); a few client-side reads (`WelcomeClient`, `inbox`) cleanest routed through a thin API rather than shipping the module to the browser.

---

## Technical appendix

### Ground truth from the code audit (2026-06-17)

- **`olera-providers`** — directory, **115,598 rows total: 74,139 active + 41,459 soft-deleted** (verified 2026-06-17 via REST count). TEXT `provider_id` PK (legacy formats like `north-lauderdale-fl-0040`). No schema in repo (iOS-era). Type: `lib/types/provider.ts:15-50`. Feeds provider detail pages, browse, search, reviews, Q&A, sitemap. Mostly soft-deletes + JSONB cache updates (`google_reviews_data`, `cms_data`, `ai_trust_signals`).
- **`business_profiles`** — polymorphic accounts table, UUID `id` PK. Schema: `supabase/migrations/001_provider_portal_tables.sql:34-62`. Type: `lib/types.ts` (`BusinessProfile`). `type` ∈ {organization, family, caregiver, student}; per-type data in `metadata` JSONB. `account_id` → `accounts(id)` (NULL = unclaimed). `source_provider_id` TEXT = the unenforced link to `olera-providers.provider_id`, ~16% stale.
- **`accounts`** — auth identity (`user_id` → `auth.users`, `active_profile_id` → business_profiles). `supabase/migrations/001:...`.
- **`connections`** — `from_profile_id` + `to_profile_id` both FK → `business_profiles(id)`, any type. **This is why a shared spine is the leading answer to the open decision.** `seeker_activity` likewise FKs `business_profiles(id)`.
- Directory-keyed (opaque TEXT, unenforced): `reviews`, `olera_reviews` (slug), `disputes`, `provider_questions`, `provider_image_metadata`, `claim_verification_codes`.
- Reconciliation helper to extend: `lib/provider-identity.ts` → `resolveCanonicalProviderId()`.
- Claim flow: `app/api/auth/create-profile/route.ts` (claims a BP row, auto-links `source_provider_id` on a single exact name+city+state match).

### Constraints (memory)
- Single shared staging+prod Supabase — no rehearsal (`reference_supabase_single_instance`).
- Prod uses TEXT + CHECK, not enums (`feedback_schema_text_not_enum`).
- Legacy provider_id formats (`feedback_provider_id_legacy_format`).
- Adding a CHECK value needs a matching migration or inserts fail silently (`feedback_event_allowlist_needs_db_migration`).
- Catchment undercount is a symptom, not the project (`project_medjobs_catchment_undercount`).

### Open questions / decisions log
| # | Question | Status |
|---|----------|--------|
| Q1 | Shared `profiles` spine vs polymorphic-FK columns for connections/activity? | ✅ **DECIDED 2026-06-17: shared spine (A).** Enforced FK integrity + smallest migration + simplest queries. |
| Q2 | Keep TEXT `provider_id` or migrate to UUID? | OPEN (step 4) |
| Q3 | Do `caregivers` and `students` merge? | OPEN (step 3) |
| Q4 | Is iOS actually decoupled before step 4? | OPEN — TJ to confirm (blocks step 4, not 1–2) |
| Q5 | How far do we take it — through step 5 or stop at a checkpoint? | OPEN — target step 5, reassess at each gate |

*Append decisions here as we make them. This log is the memory of why the schema looks the way it does.*

### Resume pointer
```
cd ~/.claude-worktrees/olera-web/relaxed-feynman
```
`branch: relaxed-feynman`

**Paste-after-compacting prompt:**
> We're designing the Olera Provider Data Foundation. Read `plans/provider-data-foundation.md` first. Design phase, no code. `olera-providers` = directory of ~74K active care businesses (115K rows incl. soft-deletes); `business_profiles` = polymorphic accounts table (org/family/caregiver/student). Target: separate by entity behind a small shared `profiles` identity record, combine only the claimed-org slice with the directory, migrate in 5 steps starting with a `lib/providers/` access layer (step 1). The load-bearing open decision is Q1 in the appendix (shared spine vs polymorphic FK), recommendation A. Don't write code yet; we plan first. Pick up from the open questions.

**Related prior plan:** `plans/auth-accounts-monetization-marketplace.md`
