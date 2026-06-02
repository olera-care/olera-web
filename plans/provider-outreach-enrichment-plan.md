# Plan: Provider Outreach Enrichment (P1 #2 emails + #3 contact-form URLs)

Created: 2026-06-02
Status: Not Started

## Goal
Auto-fetch provider **emails** and **contact-form URLs** for MedJobs outreach rows (`student_outreach`, kind='provider') so launching email + call + contact-form outreach no longer requires manual hunting — via a batch enricher (workhorse) plus a per-row "Find X" drawer button (escape hatch), sharing one finder library.

## Success Criteria
- [ ] A batch run enriches missing emails (waterfall: Google Places → website scrape → Perplexity fallback → ZeroBounce verify) and writes valid/risky addresses; dry-run prints target count + per-source hit estimate + cost, gated behind `--apply`.
- [ ] A batch run enriches missing `contact_form_url`s (scrape contact-ish pages → validate 200 + `<form>`/known embeds → Perplexity fallback) onto outreach rows.
- [ ] Opening an enriched Provider Prospect in `/admin/medjobs`: email pre-flight check is ✓, and the `ContactFormBanner` + pre-flight contact-form item light up automatically (no extra wiring).
- [ ] "Find email" and "Find contact form" buttons on `SnapshotCard` General Contact section fetch for one row and pre-fill the existing editable field (which saves via the existing `update_general_contact` action), with loading + error feedback.
- [ ] `tsc` clean; no new CRM `route.ts` action / enum / touchpoint / channel (G1–G4 respected); Log modals + `ProviderProspectDrawerBody` untouched (G9/G10).

## Key Decisions (locked from /explore)
- **Persistence = Option A**: write directly onto materialized `student_outreach.research_data.general_contact.{email,contact_form_url}`. (`olera-providers` has no `contact_form_url` column and no metadata JSONB; `materialize/route.ts:111-117` doesn't carry the form URL — directory route is strictly more work.) Email batch *may* also write `olera-providers.email` for a directory-scoped pre-materialization run.
- **Shared TS finder lib** consumed by BOTH the tsx batch scripts and the button endpoint — avoids duplicating scrape logic across JS-script + TS-route. Justified by `npx tsx scripts/*.ts` already being a house pattern (`package.json:12-13`, `scripts/verify-emails.ts`).
- **Button is read-only enrichment, not a CRM action**: the new endpoint fetches + returns a value; the actual write still flows through the existing `saveField → update_general_contact` path (`SnapshotCard.tsx:401`). So it does NOT add a G2-gated state-machine action.
- **Scrape-first, Perplexity-only-for-stragglers** — Sonar really costs ~$8/1000 (search fees).

## Tasks

### Phase 1: Shared finder library
- [ ] 1. `lib/medjobs/outreach-enrichment.ts` — core finders + helpers.
      - Exports: `resolveWebsite(row)` (existing website → Google Places `websiteUri` fallback); `findEmail(website)` (fetch homepage + `/contact` + `/about`; extract `mailto:` + `[\w.+-]+@[\w.-]+`; prefer role addresses `info@/admin@/contact@`, drop junk `example@/sentry/wix/image-filenames`; Perplexity Sonar fallback); `findContactFormUrl(website)` (find anchors matching `/contact|contact-us|get-in-touch|request-info|inquiry|schedule-a-tour|book-a-tour`; HEAD/GET candidate, require 200 + `<form`/HubSpot/Wufoo/JotForm/Typeform/Gravity embed; Perplexity fallback); local `fetchWithRetry`, `sleep`, `CostTracker` (mirror `enrich-city.js:162-189`).
      - Keys from `.env.local`; fail closed (warn + skip source) if `GOOGLE_PLACES_API_KEY` / `PERPLEXITY_API_KEY` unset.
      - Files: `lib/medjobs/outreach-enrichment.ts` (new)
      - Depends on: none
      - Verify: `npx tsx` a 5-site smoke harness (known senior-care sites) → prints found email + form URL per site; `npx tsc --noEmit` clean.

### Phase 2: Email batch enricher (Backend — the workhorse)
- [ ] 2. `scripts/enrich-outreach-emails.ts` — batch over targets, run the email waterfall, verify, write back.
      - Target selection: outreach-scoped (active `student_outreach`, kind='provider', `research_data.general_contact.email` null) OR `--city <City> <ST>` directory run (`olera-providers` website present, email null). Skip rows with a non-null email.
      - Verify every hit via `verifyAndCache()` (`lib/email-verification.ts`); write only `valid` / `risky` (catch-all), drop `invalid`.
      - Write-back: directory run → `olera-providers.email`; outreach run → `student_outreach.research_data.general_contact.email` (service-role client).
      - Dry-run default + `--apply` gate; gap report (target list, per-source hit counts, est. cost) mirroring `enrich-city.js:244-272`; batches ~30, ~300ms between calls.
      - Files: `scripts/enrich-outreach-emails.ts` (new), imports `lib/medjobs/outreach-enrichment.ts` + `lib/email-verification.ts`; `package.json` (add `enrich:outreach-emails` script)
      - Depends on: 1
      - Verify: dry-run on one lead-city prints targets + cost (no writes); `--apply` on a ~30-row test batch → report found-via-Places-website vs Perplexity, # passed ZeroBounce, # empty; spot-check 5 emails against live sites; materialize a freshly-enriched directory provider → pre-flight email check ✓ on first open.

### Phase 3: Contact-form-URL batch enricher (Backend)
- [ ] 3. `scripts/enrich-outreach-contact-forms.ts` — batch over outreach rows with a website but no `contact_form_url`; run `findContactFormUrl`; write `research_data.general_contact.contact_form_url` (Option A — outreach rows only).
      - Same scaffolding (dry-run/`--apply`, gap report, CostTracker, batching). Perplexity fallback only for scrape misses.
      - Files: `scripts/enrich-outreach-contact-forms.ts` (new); `package.json` (add `enrich:outreach-forms` script)
      - Depends on: 1
      - Verify: dry-run prints targets + cost; `--apply` on a test batch reports found-via-scrape vs Perplexity, # validated (200 + form); open an affected prospect in `/admin/medjobs` → `ContactFormBanner` renders with the URL + copy-ready message AND the pre-flight contact-form item appears; spot-check 5 URLs land on a real submittable form (not 404 / homepage).

### Phase 4: Drawer buttons (Frontend follow-on)
- [ ] 4. Read-only enrichment endpoint: `POST /api/admin/medjobs/enrich-contact` — body `{ outreachId, mode: "email" | "contact_form" }`; loads the row, resolves website, runs the matching lib finder, returns `{ value }` (or `{ value: null }`). Does NOT write — no CRM action, no touchpoint.
      - Files: `app/api/admin/medjobs/enrich-contact/route.ts` (new)
      - Depends on: 1
      - Verify: curl/admin-session POST for a known row returns a plausible email / form URL; unauthenticated request rejected.
- [ ] 5. "Find email" + "Find contact form" buttons in `SnapshotCard` General Contact section (next to the email field ~`:505` and the contact_form_url field ~`:544`). On click → call the endpoint → `setEmail`/`setContactFormUrl(found)` → existing `saveField` persists via `update_general_contact`. Loading state on the button; explicit error feedback on miss/failure (per house rule: always add error feedback to new UI actions). Render only when `editable` (pre-launch).
      - Files: `components/admin/medjobs/SnapshotCard.tsx`
      - Depends on: 4
      - Verify: empty-email row → "Find email" fills + saves + pre-flight email check flips ✓; missing-form row → "Find contact form" fills, banner appears; a miss shows a calm "no email found" message, not a silent no-op.

## Risks
- **Perplexity cost blowout** — scrape-first; Perplexity only for stragglers; CostTracker + `--apply` gate; dry-run always prints estimate before any spend. (~$8/1000, not $1/1000.)
- **API rate limits (429s)** — confirm Google Places / Perplexity limits before raising concurrency; batches of ~30 with ~300ms spacing; prior runs died at ~85% from 429s.
- **Script runtime / node_modules** — worktree has no `node_modules`; run scripts from a checkout with deps installed (`npx tsx`, mirroring `package.json:12-13`), or via the main repo. Confirm `tsx` resolves before a long run.
- **ZeroBounce fail-open** — `verifyAndCache` returns `unknown` with no key; treat `unknown` as "couldn't check" → write the address but flag, don't drop. Only drop confirmed `invalid`.
- **olera-providers has no metadata JSONB** (silent-error trap) — never stash on a nonexistent column; Option A writes the typed `research_data` shape on `student_outreach`.
- **Discipline (G1–G4, G9/G10)** — no new `route.ts` action/enum/touchpoint/channel; button writes via existing `update_general_contact`; do not touch Log modals or `ProviderProspectDrawerBody`.
- **Scrape false positives** — validate contact-form candidates actually contain a `<form>`/known embed and return 200; prefer a form page over a `tel:`/`mailto:` page; verify a Perplexity URL resolves before trusting it.

## Notes
- Reference scaffolding: `scripts/enrich-city.js` (CostTracker `:176`, fetchWithRetry `:164`, sleep `:162`, gap report `:244`, `--run`/`--apply` gating, write pattern `:296`).
- Consumer side already shipped for #3: `ContactFormBanner` (`SnapshotCard.tsx:1235-1341`), `contact_form_url` type (`lib/student-outreach/types.ts:142`), `contact_form_submitted` touchpoint (`:72`), `contact_form` channel (`:94`), pre-flight gate (`NextStepCard.tsx:332-335`). Once the URL lands, everything lights up.
- Email pre-flight `hasEmail` gate already exists (`NextStepCard.tsx`).
- These feed the "emailless tail" of the half-shipped P1 #4 ("Connect the two sides", sub-task 3) — out of scope here but the strategic reason this is P1.
- Ship order: Phase 1 → 2 → 3 (backend value first), then 4 (thin frontend). One concept per commit; `tsc` before pushing. Branch from `staging` per CLAUDE.md.
