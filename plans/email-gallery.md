# Email Gallery — Consolidated Variant Visualizer — Spec

**Date:** 2026-06-23 · status: spec (build-ready) · **build on `mighty-carson`**
Sequencing: **comes before the family-comms cron cutover** — review every family variant in-product before the coordinator sends real email. See `plans/family-comms-system.md`.
**Branch note:** build on `mighty-carson`, NOT a fresh branch off staging — the family variants render the reshaped templates (`compareCardRow`, `authorBylineBlock`, the card param changes) that only exist on this branch. Off bare staging the gallery would render the *old* family emails. (Provider digest variants exist on staging already, so they're fine either way.)

## Goal

One admin page that renders **every email variant** (provider + family + transactional) from **canned, PII-free sample data** — a living email design-system view, always current, viewable **before any real send**. Kills the "ask Claude for a one-off render link" bottleneck and is the feedback instrument for copy/design audits.

## Why (the gap today)

Two surfaces exist and neither does this:
- **`/admin/emails`** — real sent-email log + inline `html_body` preview. Only shows emails *already sent*.
- **`/admin/automations/[id]`** — per-cron preview. Its `?variant=` sample mode renders the live template with fake data — BUT `digestVariantSample()` is **hardcoded with ~9 provider weekly-digest variants only.** The 6 family-coordinator rungs (and the reshaped cards/signature) have **no samples**, so their preview falls back to "most recent real send" = empty until cutover. The new work is invisible in-product.

## Architecture

### 1. Shared variant registry — `lib/email-samples.ts` (NEW)
Single source of truth. Subsumes `digestVariantSample()` (move the 9 provider variants here) so there is **one** registry, not two.

```ts
export interface EmailVariant {
  id: string;            // stable slug, e.g. "family_provider_silent_compare"
  audience: "family" | "provider" | "transactional";
  group: string;         // e.g. "Family · Compare cascade", "Provider · Weekly digest"
  label: string;         // human label
  subject: string;       // rendered subject (for the gallery header)
  emailType: string;     // underlying email_type → cross-ref to /admin/emails + email_log
  cron?: string;         // registry/cron id that sends it (links to /admin/automations/[id])
  render: () => string;  // calls the LIVE template with sample fixtures → full HTML
}
export const EMAIL_VARIANTS: EmailVariant[] = [ /* … */ ];
export function getVariant(id: string): EmailVariant | undefined;
export function variantsForCron(cronId: string): EmailVariant[];
```

**Determinism:** fixtures must be constant — **no `Date.now()` / `Math.random()` / `new Date()`** (stable renders; also the workflow-runtime constraint). **PII-free.**

### 2. Sample fixtures — co-located in the registry
Reuse the QA-script data verbatim: family "Maria Garcia", provider "Evergreen Senior Care", 3 recommended-provider cards with **real Supabase stock image URLs** (`content-images/fallback/*` — email-proxy safe), sample rating/reviewCount/distance, quiz/browse/inbox URLs. One shared `SAMPLE` block feeds every variant.

### 3. Family variants to seed (Phase 1)
The 6 coordinator rungs + the demoted machine, each rendering the live template:
- `family_outcome_check` (R1 sensor)
- `family_provider_silent` — compare hero (cards + rating/distance + signature) **and** the declined-with-message arm
- `family_never_engaged` — compare-led arm **and** guide-fallback arm
- `day_10_awaiting` (R4 provider-responded compare)
- `family_reach_out_nudge` (R5)
- `family_nudge` (R6 quiz value-exchange)
- (nice-to-have) `family-nudges` machine variants (completion/publish/monthly-recs/reengagement)

### 4. Render endpoint — `app/api/admin/emails/sample/route.ts` (NEW)
`GET /api/admin/emails/sample?id=<variantId>[&raw=1]`
- Admin-gated (`getAuthUser` + `getAdminUser`); GET + admin-session so it's browser-triggerable (memory `feedback_admin_endpoints_get`, `feedback_cron_routes_browser_triggered`).
- `raw=1` → `text/html` (for iframe `src` / open-in-tab); else JSON `{ id, subject, html, audience, group, emailType, cron }`.
- **Bonus:** stable shareable per-variant URLs — permanently solves "send me a link to email X" (e.g. `…/api/admin/emails/sample?id=family_provider_silent_compare&raw=1`).

### 5. The gallery page — `app/admin/emails/gallery/page.tsx` (NEW; or a "Gallery" tab on `/admin/emails`)
- Imports `EMAIL_VARIANTS`, groups by `audience` → `group`.
- **Sticky left jump-nav** listing groups; click → scroll. Top filter chips: Family / Provider / Transactional / All.
- Each variant card: an **iframe** (`src` = the sample endpoint `raw=1`, ~620px wide) + header (label · subject · `emailType` · cron link) + "Open raw" (new tab) + "See real sends" (deep-link to `/admin/emails` filtered to that `emailType`).
- **Mobile toggle:** per-card or global width switch (620 ↔ 375) — these go to phones; check mobile rendering.
- **Build on `mighty-carson`** (not a fresh staging branch) — see Branch note above.

### 6. Unify automations preview onto the registry — DEFERRED to Phase 2
Intended: `app/api/admin/automations/[id]/preview/route.ts` delegates to `variantsForCron(jobId)` + `getVariant(id)` so per-job preview + gallery share ONE source. **Deferred** because the `[id]` page's sample mode is hardcoded to a single job (`weekly-provider-digest` via a `DIGEST_SAMPLES` list); a clean unify means refactoring that page's variant picker, which risks the working provider digest preview for little Phase-1 gain. The gallery already delivers the consolidated view. Tradeoff accepted: provider sample data is briefly **duplicated** (digestVariantSample + registry) until the Phase-2 dedup.

## Scope / phasing
- **Phase 1 (BUILT 2026-06-23):** `lib/email-samples.ts` registry + fixtures + 8 family variants + 8 migrated provider variants + `/api/admin/emails/sample` endpoint + `/admin/emails/gallery` page (audience filter, jump-nav, mobile width toggle, open-raw + see-real-sends links). Standalone — does NOT touch the automations preview.
- **Phase 2:** unify the automations `[id]` preview onto the registry (delete `digestVariantSample`, drive its picker from `variantsForCron`); add remaining transactional variants; optional "sample vs last real send" diff.

## Files
- NEW `lib/email-samples.ts` — registry + fixtures
- NEW `app/api/admin/emails/sample/route.ts` — render endpoint
- NEW `app/admin/emails/gallery/page.tsx` — the gallery (or tab on `/admin/emails`)
- EDIT `app/api/admin/automations/[id]/preview/route.ts` — use shared registry; drop local `digestVariantSample`

## Risks / notes
- `lib/email-templates.tsx` must stay importable without server-only deps — it is today (self-contained, no imports). Keep it that way; if a future template adds a server-only import, the registry render breaks.
- Iframe-render the HTML emails (don't inject into the page DOM) — email CSS is global/`<table>`-based and would fight the admin styles.
- Fixtures deterministic + PII-free.
- Stock image URLs must stay public on Supabase (`content-images/fallback/*`).
- Admin-gate everything; this exposes full email bodies.
