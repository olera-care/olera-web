# MedJobs admin — nav simplification, Operations hub, flyer floor

Chunk-by-chunk build plan. Each chunk is a self-contained PR to `staging`,
ordered so the tree is always shippable and no surface is ever orphaned.

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

## Chunk 2 — Audience split in the data layer (backend, additive)

**Goal:** Count/serve provider vs partner prospects independently so the new
tabs and Operations boxes have stable APIs. Non-breaking; no consumer yet.

**Files / changes:**
- `/api/admin/student-outreach/stats` — support `metric=provider_prospects` and
  `metric=partner_prospects` (or `prospects_added&audience=provider|partner`).
- Tab/queue counts source (`/api/admin/student-outreach/queue` counts +
  `/api/admin/medjobs/in-basket-stats`) — expose provider-prospect and
  partner-prospect counts separately (provider from the virtual
  `/provider-prospects` set; partner from `queue?tab=prospects`).
- Partner subtype counts — add a small breakdown (`student_org/dept_head/
  advisor/professor`) to the partner-prospect + active-partner count payloads
  for the Operations breakdown chips. Use `StakeholderType` (`types.ts:8`) +
  `KIND_LABELS` (`types.ts:533`).
- `lib/student-outreach/tab-config.ts` — extend `TAB_STATS` with the new metric
  keys (no tab wiring yet).

**Risk:** Low (additive endpoints/params).
**Verify:** curl each metric/count returns sane numbers that sum to the old
`prospects_added`. `tsc`, lint.

---

## Chunk 3 — In Basket audience queues (user-facing; depends on Chunk 2)

**Goal:** Replace the `prospects` tab with `providers` + `partners` audience
tabs, each sectioned (Prospecting / Active), folding in the old `clients` and
active `partners` overflow tabs.

**Files / changes:**
- `lib/student-outreach/tab-config.ts`:
  - `TabKey`: introduce `providers`; repurpose `partners` as the partner-
    audience queue. Retire `prospects` (keep as a redirect alias to `partners`/
    `providers` default if any deep links exist) and remove `clients` from
    `MENU_TABS`.
  - `TABS` (primary): `[providers, partners, calls, replies, meetings]`
    (labels: Providers, Partners, Calls, Emails, Meetings).
  - `MENU_TABS` (overflow): `[candidates, all, emails_sent, outbound, signups,
    archive]` (clients + active-partners removed — folded into audience tabs).
  - `TAB_STATS`: point `providers`/`partners` at the Chunk 2 metrics.
- `components/admin/medjobs/MedJobsTabPage.tsx` + `lists/ResearchTabContent.tsx`:
  - Render each audience tab as two sections:
    - **Providers** → "Prospecting" (`/provider-prospects` rows) + "Active
      clients" (`/clients?with_pending_task=true` rows).
    - **Partners** → "Prospecting" (`queue?tab=prospects` partner rows) +
      "Active partners" (`/partners?with_pending_task=true` rows); keep the
      `TYPE_FILTERS` subtype filter row.
  - Reuse existing card components (`ClientCard`, `ProviderProspectCard`,
    `StakeholderCard`, partner cards) under section headers.
- `app/admin/medjobs/in-basket/page.tsx` — `initialTab` + auto-pivot updated to
  the new keys; `?tab=providers|partners` deep-links.
- Smart-hide / unread-fraction bolding updated for the new keys.

**Risk:** Medium (most UI surface; composition of two endpoints per tab).
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
  (NEW) — compact stat box; reuse the `PulseHeader` data fetch with a small
  sparkline variant (extract a `MiniStatChart` if `PulseHeader` is too heavy).
- Global date-range picker driving every box.
- Boxes + links:
  - **Pipeline:** Provider Prospects → `in-basket?tab=providers`;
    Partner Prospects (chips: SO·DH·Adv·Prof) → `/prospects`.
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
