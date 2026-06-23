# MedJobs ↔ Directory — provider data & account reconciliation

Trunk-by-trunk build plan. Each trunk is a self-contained PR to `staging`,
ordered so the tree is always shippable and no surface is ever orphaned. The
spine of the whole plan: **a provider has exactly one display record, and every
claim path resolves to it — never a disconnected copy.**

> **Status (branch `claude/keen-mendel-6i8iW`):**
> - **Chunk 1 — DONE** (renamed in build to "provider conversion is self-serve
>   only"). Scope grew when `make_client` turned out to be the core conversion
>   engine, not a button; per the P4 decision we eliminated admin-on-behalf
>   conversion entirely. tsc clean, committed.
> - **Chunk 2 — DONE.** Ownership helper + magic link claims & trust-scores on
>   first auth (idempotent). tsc clean, committed.
> - **Chunk 3 — DONE.** 3a backend never overwrites a claimed listing + P1-A
>   push for unowned; 3b pre-flight read-only lock + Edit override + tag. tsc
>   clean, committed.
> - **Chunk 4 — Step 1 DONE (approach A), Step 2 deferred.** Step 1: directory-
>   linked providers' dashboard reads/writes the CORE fields (name, description,
>   contact, address, category) on the `olera-providers` row via an ownership-
>   checked server API + a dashboard-only read overlay; AuthProvider untouched;
>   no public-page change. Fixes the empty tab + makes those edits public.
>   tsc clean, committed, pushed. **Needs a browser QA pass.** Step 2 (photos /
>   pricing / editorial metadata — needs transforms or a public-page change) is
>   a separate careful pass.
> - **Chunk 5 — DONE.** Cold link carries the existing `outreach_id` (no
>   BridgeRow change) → public board pre-locks the screener to the provider's
>   own directory listing via a new resolver API + the existing prefill lock.
>   "Create new" preserved for genuinely new providers. tsc/lint clean,
>   committed, pushed.
> - **Chunk 6 — PARTIAL.** OPERATIONAL_BRIEF conversion invariant updated to
>   the self-serve-only model. Remaining: doc sweep + full e2e browser
>   verification across Chunks 4-5.

## Locked decisions (from the alignment thread)

- **One display record per provider.** Directory-listed providers → the
  `olera-providers` row is the single public source of truth. `business_profiles`
  is the thin ownership/claim/verification layer. Account-first providers (no
  directory row) → `business_profiles` is their display record. **No change to
  account-first behavior** (they stay live-on-create; no draft mechanism).
- **Content lock keys off OWNERSHIP, not the `claim_state` label.** Once a
  profile is attached to a real account (`account_id` set), MedJobs never
  overwrites its display content. Unclaimed/unowned → CRM may fill.
- **Claim is self-serve only.** Remove the admin "Make client" / claim-without-
  login path. "Client" = the provider accepted Terms themselves.
- **Both magic links behave identically on click** (MedJobs welcome-token +
  care-directory claim): attach → `claim_state="claimed"` → run trust-scoring →
  content lock → co-tenancy read-only. Keep the two *token mechanisms* separate
  (cold needs the 30-day multi-use token), converge the *outcome*.
- **Two claim moments, one contract.** Magic-link click (activation/partner) AND
  screener completion (cold) must both: resolve to the directory row, set
  claimed, trust-score, lock. The screener is the cold funnel's real claim event.
- **Cold stays a public link (no magic link)** — deliverability + intent. We add
  a *plain, non-auth* `org` ref so the public landing can pre-lock the right
  directory org and auto-open the overlay, without authenticating anyone.
- **Claimed pre-flight:** call-to-confirm stays; fields render read-only by
  default with an **Edit override**; the override writes to the **outreach record
  only** (`research_data`), never the directory; suppress the P1-A directory push
  for claimed; show a `Claimed · verified/unverified` operator tag. Minimal modal
  change — reuse the existing `editable` flag.
- **MedJobs program data stays separate** from directory display content. The
  demand profile lives in `business_profiles.metadata.medjobs_demand_profile`.

## Pre-build risk review (verified against code) — READ FIRST

Where these conflict with a trunk spec, this section wins.

- **R1 — Two provider edit surfaces exist.** `app/api/provider/[slug]/info/
  route.ts` writes display fields to `olera-providers`; the dashboard
  `components/provider-dashboard/edit-modals/save-profile.ts` writes to
  `business_profiles`. The Profile-tab fix must route dashboard edits to the
  **directory row for directory-linked providers** by reusing the *existing*
  info-route write path. Do NOT invent a new directory writer or restructure the
  directory schema.
- **R2 — Public page already resolves `olera-providers` FIRST by slug**, then
  `business_profiles` (`is_active=true`) (`lib/providers/resolve.server.ts`).
  So once dashboard edits land on the directory row, they show publicly with
  **no resolver change**. `getClaimedAccount` overlays only status fields
  (claim/verification/account_id) — leave it alone.
- **R3 — Magic link today: `claim_state="unclaimed"`, no trust-scoring**
  (`app/medjobs/m/[token]/route.ts`, insert ~251–273; co-tenancy ~216–218).
  Trunk 2 changes both. Must be **idempotent**: re-clicks / already-owned never
  re-claim or re-score; co-tenancy stays read-only.
- **R4 — `claim-instant` already does claim + trust-score + `is_active=true`**
  (`app/api/provider/claim-instant/route.ts`, ~289/306/476). The screener uses
  it. So screener↔magic-link parity = bring the **magic link up to claim-instant**,
  reusing `scoreClaimTrust` (`lib/claim-trust.ts`). Don't rebuild scoring.
- **R5 — One ownership predicate.** Add a single canonical helper
  (`isProviderOwned(sourceProviderId)` / returns owner + claim + verification)
  and use it in pre-flight, the magic link, and the Profile tab. Key the lock on
  `account_id` present (R3 made owned-but-unclaimed possible historically).
- **R6 — Pre-flight persists to `research_data` via `update_general_contact`;
  no directory write today** (`SnapshotCard.tsx`; enrich-contact is read-only).
  P1-A's directory push is NET-NEW and gated to unclaimed. For claimed we simply
  **don't add** the push — the Edit override keeps writing `research_data` only.
  The `editable` flag (`SnapshotCard.tsx:202/214`) already renders read-only when
  false; reuse it. Verification card is at ~284–289.
- **R7 — Cold templates ignore `welcome_url`** (`lib/student-outreach/
  templates.ts` provider_intro/_followup/_final use `programLink(CANDIDATES_URL)`;
  activation uses `welcomeUrl` ~848/875/904). We are NOT adding the magic link to
  cold — we add a plain `org` ref to the public URL. `smartlead-bridge.ts`
  already pushes per-lead custom fields (`welcome_url`, `apply_url`,
  `outreach_id`, ~220–252); add an `org_ref` field + reference it in the cold
  link.
- **R8 — Screener "Create new" can fork a duplicate**
  (`OrganizationSearch.tsx:273`, `handleCreateNew:167`; screener `creating =
  !selectedOrg` → `isNewOrg`). Guard it when the org is pre-locked from a real
  directory ref; fuzzy-match nudge otherwise. The lock pattern already exists
  (`EligibilityScreenerModal.tsx` `HIRE_PREFILL_KEY:57`, prefill effect ~94) —
  generalize it to read a URL param.
- **R9 — Overlay auto-opens on `welcome=1`/`activate=1`** (`app/medjobs/
  candidates/page.tsx:77`). Cold-public needs a **non-auth** trigger (presence of
  `org` ref, or `screener=1`) so it opens without implying authentication.
- **R10 — Demand profile → `metadata.medjobs_demand_profile`** (screener writes
  via `/api/medjobs/eligibility`). Never write demand profile to the directory.

## Funnel reference (claim moments)

| Entry | Auth on entry? | Claim moment | Resolves to |
|---|---|---|---|
| Cold provider email | No (public link + `org` ref) | Screener completion | Directory row (pre-locked by `org` ref) |
| Activation / partner email | Yes (magic link) | Link click | Directory row (known via `outreach_id`) |
| Care-directory self-serve | Yes (claim-instant) | Onboarding submit | Directory row (OrganizationSearch select) |

---

## Trunk 1 — Remove the CRM "Make client" / claim-without-login path (P4)

**Goal:** "Client" becomes self-serve-only. No admin path mints a claimed-but-
unowned profile or marks a provider a client without them logging in.
Independent, ship first — it shrinks the surface every later trunk reasons about.

**Files / changes:**
- `components/admin/medjobs/ProviderMakeClient.tsx` — remove component.
- `components/admin/medjobs/SnapshotCard.tsx` — remove the `ProviderMakeClient`
  mount + any "Make client" affordance.
- `app/api/admin/student-outreach/[id]/route.ts` — remove `handleMakeClient`
  (~3790) and the `make_client` / `convert_to_client` action/outcome branch.
- Sweep `lib/student-outreach/` for any `convert_to_client` enum/outcome
  reference (discipline rules G1–G4: don't leave a dangling action) and the
  outcomes map in `docs/medjobs/OPERATIONAL_BRIEF.md`.

**Risk:** Low–medium (deletion; confirm no other caller dispatches the action).
**Verify:** grep clean for `make_client`/`convert_to_client`/`ProviderMakeClient`;
admin drawer renders without the control; `tsc`, lint.

---

## Trunk 2 — Claim unification + trust-scoring on MedJobs entry (backend foundation)

**Goal:** Every claim path produces the same state. Bring the MedJobs magic link
up to `claim-instant`'s contract, and expose one ownership predicate the rest of
the plan keys off. Foundation for Trunks 3–5.

**Files / changes:**
- `lib/providers/ownership.server.ts` (NEW) — `getProviderOwnership(
  sourceProviderId)` → `{ owned, accountId, claimState, verificationState }`,
  reading `business_profiles` by `source_provider_id` (R5). Single source for
  "is this locked?" (`owned === true`).
- `app/medjobs/m/[token]/route.ts` — on first attach of an **unclaimed, unowned**
  profile: set `claim_state="claimed"` and run `scoreClaimTrust` (R4) to set
  `verification_state` (parity with claim-instant). **Idempotent** (R3): if
  already owned by this account → re-auth only; if owned by another → co-tenancy
  read-only, unchanged. Trust-scoring runs **once**, on first claim only.
- `app/api/provider/claim-instant/route.ts` — no behavior change; confirm it
  remains the canonical claim (the screener already calls it). Factor shared
  claim+score logic into a helper if the magic link can reuse it cleanly.
- `lib/claim-trust.ts` — reuse `scoreClaimTrust`; add light caching/guard so the
  magic-link path doesn't double-score on rapid re-clicks.

**Risk:** Medium (touches the live magic-link auth path). Idempotency is the
whole game.
**Verify:** new-provider magic-link click → owned + claimed + verification set;
second click → no re-claim, no second score; co-tenancy click → read-only,
`?claim_conflict=1`, no writes. `tsc`, lint.

---

## Trunk 3 — Pre-flight content protection (P1-A + claimed lock)

**Goal:** Confirmed research improves unclaimed directory listings and never
touches claimed ones — while outreach still launches for both.

**Files / changes:**
- `app/api/admin/student-outreach/[id]/route.ts` (outreach-confirm /
  `update_general_contact` path) — at confirm, if `getProviderOwnership` says
  **not owned**, push the admin-confirmed contact fields to the linked
  `olera-providers` row (NET-NEW write, R6). If **owned**, write `research_data`
  only (existing behavior) — no directory push.
- `components/admin/medjobs/SnapshotCard.tsx` — when owned: drive `editable=false`
  by default (reuse the flag, R6) → fields render read-only; add a **claimed
  banner** + `Claimed · verified/unverified` tag (from Trunk 2 ownership data,
  passed in like the existing `verificationState` prop ~71); add an **Edit**
  button that flips `editable=true` for capturing better contacts found on the
  call. Edits persist via the existing `update_general_contact` → `research_data`
  only. **Call-to-confirm + Launch unchanged** for both states.
- Pass ownership into the card server-side (mirror how `verificationState` is
  derived and handed down today).

**Risk:** Medium (the new directory write + the gating). Keep the directory push
strictly behind the not-owned check.
**Verify:** unclaimed prospect confirm → directory row updated + visible on the
public page; claimed prospect → directory untouched, fields read-only with Edit
override, override saves to `research_data` only, launch still works. `tsc`, lint.

---

## Trunk 4 — Profile reconciliation + first-authentication unification

**Goal:** A claimed, directory-linked provider logs in (via any funnel) and sees
their real, full listing — and their edits show on the public page. Kill the
empty-Profile-tab bug and the two-edit-surface drift.

**Files / changes (R1/R2):**
- `components/provider-dashboard/edit-modals/save-profile.ts` — for a profile
  with a `source_provider_id` (directory-linked), route saves to the
  **directory row** via the existing info-route write path, not `business_profiles`.
- The provider dashboard read/hooks (`useProviderProfile` / DashboardPage data
  load) — for directory-linked providers, hydrate the form from the directory
  row so the tab is populated. Account-first providers (no `source_provider_id`)
  keep reading/writing `business_profiles` (unchanged).
- Confirm the public page needs **no** change (R2: it already reads the directory
  row first), so edits surface automatically.
- First-auth landing: ensure magic-link and care-directory claim both end up
  pointing at the same directory record (this falls out of routing the dashboard
  at the directory row; verify no second/empty record is created for an
  already-directory-linked provider).

**Risk:** Medium-high (shared provider dashboard; the surface families/providers
both feel). Bounded to directory-linked claimed providers; uses existing write
paths.
**Verify:** claim a directory provider → dashboard Profile tab shows their full
existing data; edit a field → it appears on `/provider/[slug]`; account-first
provider unaffected. `tsc`, lint, click-through both funnels.

---

## Trunk 5 — Cold funnel directory connection (non-auth `org` ref + screener lock)

**Goal:** A cold-email visitor lands on the public board, the overlay opens, and
the screener is pre-locked to **their** directory listing — so completion claims
the right row, never a duplicate. No authentication, no deliverability hit.

**Files / changes:**
- `lib/medjobs/smartlead-bridge.ts` — add an `org_ref` (the linked
  `olera_provider_id`) to the per-lead `custom_fields` (~220–252).
- `lib/student-outreach/templates.ts` — cold provider templates keep the public
  `CANDIDATES_URL` (R7) but append the plain `?org={{org_ref}}` param (and
  whatever the overlay-trigger param is, R9). Still no magic link.
- `app/medjobs/candidates/page.tsx` — read `org` ref → auto-open the overlay on a
  **non-auth** trigger (R9); pass the org into the screener as a pre-lock.
- `components/medjobs/EligibilityScreenerModal.tsx` — generalize the
  `HIRE_PREFILL_KEY` lock (R8) to also accept a URL-provided directory org;
  render it locked (existing locked UI ~348–369). When pre-locked from a real
  directory ref, **suppress the "Create new" escape** so the claim can only
  resolve to the directory row.
- `components/shared/OrganizationSearch.tsx` — when invoked in "known provider"
  mode, hide/disable `handleCreateNew` (~167/273); for the free-text path
  (no ref), add a fuzzy-match nudge ("Is this your existing listing?") before
  allowing `isNewOrg`.

**Risk:** Medium (touches the cold email link + the live screener). The `org` ref
is plain data, not auth — keep it that way.
**Verify:** cold link with `org` ref → public board, overlay auto-opens, org
pre-locked to the directory listing; completing the screener claims the existing
directory row (no duplicate `business_profile`); a no-ref visitor still gets the
search + dedup nudge. `tsc`, lint.

---

## Trunk 6 — Cleanup, docs, full verification

**Files / changes:**
- Reconcile any remaining references to the removed make-client path and the old
  "thin business_profiles is the provider's data" assumption.
- Docs: record the reconciled model (one display record; ownership-based lock;
  two claim moments / one contract; cold `org` ref) in
  `docs/medjobs/OPERATIONAL_BRIEF.md` (discipline rules + outcomes map) and
  `SCRATCHPAD.md`.
- Full `tsc --noEmit`, lint, end-to-end click-through of: cold → board → screener
  → claim (directory row); activation magic link → claim; admin pre-flight for
  an unclaimed vs a claimed prospect; provider dashboard edit → public page.

**Risk:** Low.
**Verify:** clean typecheck/lint; no duplicate records created by any claim path;
claimed listings never mutated by CRM; docs updated.

---

## Sequencing & dependencies

```
Trunk 1 (remove make-client)      ── independent, ship first
Trunk 2 (claim unification)       ── backend foundation
   ├─ Trunk 3 (pre-flight protection)   ─┐
   ├─ Trunk 4 (profile reconciliation)  ─┤  (3/4/5 parallel once 2 lands)
   └─ Trunk 5 (cold funnel connection)  ─┘
        └─ Trunk 6 (cleanup + docs)
```

Each trunk = one PR to `staging`. Trunks 3, 4, 5 can run in parallel after
Trunk 2 (they share only the ownership predicate). Trunk 6 last.
