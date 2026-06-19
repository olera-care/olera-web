# MedJobs admin — nav simplification, Operations hub, flyer floor

Chunk-by-chunk build plan. Each chunk is a self-contained PR to `staging`,
ordered so the tree is always shippable and no surface is ever orphaned.

> **Status (2026-06-18, branch `claude/keen-mendel-6i8iW`):** all chunks built,
> tsc + lint clean. Chunk 2 collapsed (no backend split needed — see F1).
> Chunk 3 (In Basket composite tabs) needs a browser QA pass before promote;
> everything else is additive/mechanical. `next build` here is blocked only by
> the sandbox's Google-Fonts fetch (environment, unrelated to these changes).

## Locked decisions (from design pass)

- **Sidebar → 4 items**, in order: **In Basket · Sites · Operations · Logs**.
- **In Basket = audience queues, lifecycle folded.** Primary bar:
  `Providers · Partners · Calls · Emails · Meetings`. "Providers" = provider
  prospects + active client tasks (sectioned). "Partners" = partner prospects +
  active-partner tasks (sectioned; subtype filter). The dual-purpose Prospects
  tab and the redundant Clients/active-Partners overflow tabs go away.
- **Operations = analytic overview** (kept at stage granularity): 8 stat boxes,
  each a mini chart + count + delta + "View all →". The dedicated list pages
  (`/prospects`, `/calls`, `/replies`, `/meetings`, `/clients`, `/partners`,
  `/candidates`) keep their routes and are reached from Operations.
- **Provider Prospects box** links to `…/in-basket?tab=providers` (no new page).
- **Flyer floor:** the generic flyer is the default for every campus;
  per-university configs become optional polish, never a launch gate.

## Pre-build risk review (verified against code) — READ FIRST

These correct assumptions in the chunk specs below. Where they conflict, this
section wins.

- **F1 — Provider prospects have NO history.** They are virtual, computed live
  from catchment, never persisted (`provider-prospects/route.ts:15-18,96-124`).
  `prospects_added` already counts **partner** stage-changes only
  (`stats/route.ts:314-339`). → Operations "Provider Prospects" box is a
  **count-only tile** (current catchment total), no sparkline/delta. Do NOT
  "split prospects_added"; it's already partner-side.
- **F2 — Do NOT repurpose `prospects`/`partners`/`clients` tab keys.** They are
  shared by the `/prospects` dedicated page (`MedJobsEntityListPage tab=`), the
  queue API switch (`queue/route.ts:213,873`), and the card slot dispatcher
  (`StakeholderCard.tsx:587,591`). → Add NEW keys for the In Basket audience
  tabs (`providers`, `partner_book`); labels stay "Providers"/"Partners".
  Leave existing keys intact.
- **F3 — Folded audience tabs are multi-source + per-section slots.** Each tab
  does two fetches → two sections. `buildRowSlots` is per-tab, but a Partners
  tab mixes prospect rows (need `researchSlots`) and active rows (need
  `partnersSlots`) — dispatch slots **per section** with the existing key.
  Providers tab = `ProviderProspectCard` + `ClientCard` (no slot dispatch).
- **F4 — `initialTab="clients"` breaks.** Repoint it; ensure new audience tabs
  get composed `tab_counts` so smart-hide/auto-pivot don't hide them or land on
  a removed tab (`in-basket/page.tsx:22`, `MedJobsTabPage.tsx:133-134`).
- **F5 — Flyer relaxation = 5 coupled spots in the modal**
  (`ProviderPreFlightModal.tsx:186-192,199,398,425-439,638`) + the
  `campusSlug` email link (`smartlead-bridge.ts`) that 404s today. Route must
  fall back to generic so the link resolves; modal already has `program_pdf_url`
  + `pdfAudience` props (66-106).
- **F6 — Operations = 8 panels.** Build a compact *controlled* MiniStat (global
  date-range prop); `PulseHeader` is per-page-heavy and owns its own range.
  Provider tile skips the chart. `/provider-prospects` no-campus scan is
  O(campuses×catchment) — fine at 2 sites, watch at scale.
- **F7 — Personalized email + generic flyer** is an accepted MVP mismatch; just
  confirm no email body claims a campus-specific *attached* flyer.

## Funnel reference

| Audience | Prospect stage | Active stage |
|---|---|---|
| Providers (employers) | provider prospects (virtual, catchment) | Clients |
| Partners (campus) | partner prospects (`student_org·dept_head·advisor·professor`) | Partners |
| Candidates (students) | Signups | Candidates |

---

## Chunk 1 — Generic flyer floor (unblocks launches; fully independent)

**Goal:** No campus is ever blocked from launch for a missing per-campus flyer.
Emails still deliver a real flyer (the standard one), so the promise holds and
no link 404s.

**Root cause:** a generic student flyer already exists (`GENERIC_STUDENT`, slug
`generic`) and the Resend/route paths partially fall back to it, but (a) the
preflight guard looks up the *campus* slug only and misses generic, and (b) the
emailed link `?university=<slug>` 404s when that slug has no config.

**Files / changes:**
- `lib/program-pdf/configs/generic-provider.ts` (NEW) — mirror `texas-am.ts`,
  generic copy + Olera emerald, slug `generic`, `audience: "provider"`.
- `lib/program-pdf/configs/index.ts` — register `GENERIC_PROVIDER` in
  `PROGRAM_PDF_CONFIGS`. Add `resolveProgramPdfConfig(slug, audience)` that
  returns the slug config or falls back to the `generic` config for that
  audience (never null when generic exists).
- `app/api/medjobs/program-pdf/route.ts` — on missing slug config, render
  `generic` instead of 404 (404 only if even generic is absent).
- `components/admin/medjobs/ProviderPreFlightModal.tsx` — `pdfConfigured` =
  campus config **OR** `campus.program_pdf_url` **OR** generic-exists-for-
  audience. Replace the red **block** banner with a soft info note when falling
  back ("Using the standard Olera flyer — no campus-specific flyer configured").
  Submit no longer disabled on the generic path.
- `lib/student-outreach/email-send.ts` — `loadProgramPdfAttachment`: add a
  "render generic code config" step before the no-attachment fallback so Resend
  also attaches the standard flyer.
- `lib/medjobs/smartlead-bridge.ts` — keep passing `campusSlug`; route fallback
  covers it. Add a comment noting generic is the floor.

**Risk:** Low. Additive + guard relaxation. No nav coupling.
**Verify:** `GET /api/medjobs/program-pdf?university=florida&audience=student`
→ 200 generic PDF. Preflight for Florida → no block, launch enabled. `tsc`,
lint, click-through of the confirm-outreach modal.

---

## Chunk 2 — Data layer additions (backend, additive) — REVISED per F1

**Goal:** Give Operations + the audience tabs the counts they need. Most metrics
already exist; only two genuinely new pieces.

**Reality check (F1):** `prospects_added` is already partner-only and provider
prospects have no history. So there is NO metric split. The existing metrics
cover Partner Prospects (`prospects_added`), Clients (`clients`), Partners
(`partners_added`), Candidates (`candidates`), Calls/Emails/Meetings
(`calls_made`/`replies`/`meetings_activity`).

**Files / changes:**
- Provider Prospects = **count only**. Reuse `/api/admin/medjobs/provider-
  prospects` `total` (no campus param). No new metric, no chart.
- Partner subtype breakdown — add a `group_by=stakeholder_type` count (or group
  client-side from the existing partner fetch) for the Operations chips:
  `student_org/dept_head/advisor/professor` via `StakeholderType` (`types.ts:8`)
  + `KIND_LABELS` (`types.ts:533`). Needed for both Partner Prospects and
  Partners boxes.
- Do NOT add `provider_prospects`/`partner_prospects` metrics — the stats route
  400s on unknown metrics (`stats/route.ts:207-208`); only wire metrics that
  exist.

**Risk:** Low.
**Verify:** `/provider-prospects` total returns the catchment count; subtype
breakdown sums to the partner totals. `tsc`, lint.

---

## Chunk 3 — In Basket audience queues (user-facing; depends on Chunk 2)

**Goal:** Replace the `prospects` tab with `providers` + `partners` audience
tabs, each sectioned (Prospecting / Active), folding in the old `clients` and
active `partners` overflow tabs.

**Files / changes (REVISED per F2/F3/F4):**
- `lib/student-outreach/tab-config.ts`:
  - `TabKey`: ADD new keys `providers` and `partner_book` (label "Partners").
    Do NOT repurpose or retire `prospects`/`partners`/`clients` — they stay for
    the `/prospects` page, the queue API, and `buildRowSlots` (F2).
  - `TABS` (primary): `[providers, partner_book, calls, replies, meetings]`
    (labels: Providers, Partners, Calls, Emails, Meetings).
  - `MENU_TABS` (overflow): remove `clients` + `partners` from the visible
    array (folded); keep `[candidates, all, emails_sent, outbound, signups,
    archive]`. The keys still exist in the union; they're just not shown.
- `components/admin/medjobs/MedJobsTabPage.tsx`:
  - Add fetch branches for the new keys (the default `queue?tab=<key>` call is
    NOT used for them — they compose existing endpoints, like the current
    `clients`/`candidates` side-fetches at lines 138-205):
    - **providers** → `/provider-prospects` (prospecting) +
      `/clients?with_pending_task=true` (active).
    - **partner_book** → `queue?tab=prospects` filtered to partners
      (prospecting) + `/partners?with_pending_task=true` (active); keep the
      `TYPE_FILTERS` row.
  - Render two labelled sections per tab. **Per-section slot dispatch (F3):**
    pass `buildRowSlots(row, "prospects")` for the prospecting section and
    `buildRowSlots(row, "partners")` for the active section. Providers tab uses
    `ProviderProspectCard` + `ClientCard` (no slot dispatch).
  - Compose `tab_counts` for the new keys client-side (sum the two sources) so
    smart-hide + auto-pivot work (F4).
- `app/admin/medjobs/in-basket/page.tsx:22` — change `initialTab="clients"` to
  a surviving key (e.g. `providers`); `?tab=providers|partner_book` deep-links.

**Risk:** Medium-high (most UI surface; two sources + per-section slots + counts
per tab). Largest chunk — consider splitting into 3a Providers / 3b Partners.
**Verify:** In Basket shows Providers/Partners primary tabs, each with both
sections; old Prospects/Clients/active-Partners tabs gone; counts + bolding
correct; `?tab=providers` deep-link works. `tsc`, lint, click-through.

---

## Chunk 4 — Operations page (new route; depends on Chunk 2)

**Goal:** `/admin/medjobs/operations` — 8 stat boxes in 3 groups, each with a
mini chart, headline number + delta, optional breakdown chips, and "View all →".

**Files / changes:**
- `app/admin/medjobs/operations/page.tsx` (NEW).
- `components/admin/medjobs/OperationsBoard.tsx` + `OperationsStatBox.tsx`
  (NEW) — compact **controlled** MiniStat (count + sparkline + optional delta,
  taking a global date-range prop). Do not drop 8 `PulseHeader`s on one page
  (F6). Extract a `MiniStatChart` from the PulseHeader fetch logic.
- Global date-range picker driving every box.
- Boxes + links:
  - **Pipeline:** Provider Prospects → `in-basket?tab=providers` — **count-only
    tile, no chart/delta** (F1: no history exists);
    Partner Prospects (chips: SO·DH·Adv·Prof, from Chunk 2 breakdown) →
    `/prospects`, chart on `prospects_added`.
  - **Activity:** Calls → `/calls`; Emails → `/replies`; Meetings → `/meetings`.
  - **Roster:** Clients → `/clients`; Partners (subtype chips) → `/partners`;
    Candidates → `/candidates`.
  - Each box fetches its Chunk 2 metric + count.

**Risk:** Medium (new surface, chart reuse).
**Verify:** grid renders, charts load for the range, every "View all →"
navigates to the right page. `tsc`, lint.

---

## Chunk 5 — Sidebar trim + reorder (depends on Chunk 4)

**Goal:** Collapse the MedJobs nav to 4 items in the locked order; keep all
demoted routes alive (now reached via Operations).

**Files / changes:**
- `components/admin/AdminSidebar.tsx`:
  - `medjobsItems` →
    `[In Basket → /in-basket, Sites → /sites, Operations → /operations,
      Logs → /logs]`.
  - `COUNTS_KEY` → keep `in_basket`, `sites`; `operations` (null or an
    aggregate), `logs: null`; drop the removed routes' keys.
- Demoted pages (`/prospects`, `/calls`, `/replies`, `/meetings`, `/clients`,
  `/partners`, `/candidates`) — unchanged routes; add a "← Operations"
  back-link header for orientation.

**Risk:** Low (do last so nothing is orphaned).
**Verify:** sidebar shows the 4 items in order; Operations links reach every
demoted page; no dead nav entries. `tsc`, lint.

---

## Chunk 6 — Cleanup, counts, docs, full verification

**Files / changes:**
- Remove dead `prospects`/`clients` tab code paths (or keep thin redirects).
- Reconcile `in-basket-stats` hero + sidebar counts with the new tab model.
- Sweep for stale `prospects`/`clients` tab-key references.
- Docs: note the new nav model + flyer floor in
  `docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md` and `SCRATCHPAD.md`.
- Full `tsc --noEmit`, lint, and an end-to-end click-through of In Basket →
  Operations → each dedicated page → a launch with the generic flyer.

**Risk:** Low.
**Verify:** clean typecheck/lint; no orphaned routes or dead tabs.

---

## Sequencing & dependencies

```
Chunk 1 (flyer)      ── independent, ship first
Chunk 2 (data split) ── backend foundation
   └─ Chunk 3 (In Basket tabs)   ─┐
   └─ Chunk 4 (Operations page)  ─┤
        └─ Chunk 5 (sidebar)     ─┘ (sidebar last: keeps pages reachable)
             └─ Chunk 6 (cleanup + docs)
```

Each chunk = one PR to `staging`. Chunks 3 and 4 can run in parallel once 2 is
in; 5 must follow 4.
