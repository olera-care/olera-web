# Ad Boost Campaign Setup (Browser-Driven)

Input: $ARGUMENTS — provider name(s), OR nothing if TJ attached a screenshot of the `/admin/ad-boost` Requested queue. A screenshot identifies WHICH providers to set up; the `ad_campaign_requests` table in prod is always the source of truth for their data.

## Purpose

Take one or more Ad Boost providers from "Requested" to published, policy-audited Google Ads campaigns — driving ads.google.com directly through the chrome-devtools MCP, with TJ approving each Publish click. This encodes the flow proven on Miracle-Lightstar + Impact (2026-07-05).

Canonical references (read if uncertain, don't re-derive):
- Notion SOP: "SOP — Managed Ads (Ad Boost): Google Ads Campaign Setup (any provider)" (id `38d5903a-0ffe-818f-a75b-db0951f7b178`). **Append a Worked Example entry for each provider when done.**
- Memory: `project_managed_ads_setup_sop` (locked invariants + browser-automation gotchas).

## Locked invariants (never re-derive, never ask)

- Google Search only at **$50 campaign total** (skip Meta even if they requested "both"), ~4-week flight starting next Monday-ish (match the setup-week convention in the request row).
- **Maximize clicks with $2.50 max CPC cap** — never Maximize conversions.
- Search-only: Search Partners OFF, Display Network OFF.
- Geo: provider's city + **20 mi radius**, **Presence only** (not presence-or-interest). If the provider's address is far from the city center (check lat/lng), center on their **ZIP + 20mi** instead.
- Languages: English + Spanish. AI Max **OFF** (verify again post-publish — it can silently re-enable, and its URL expansion strips `utm_campaign`).
- Final URL: `https://olera.care/provider/{slug}?utm_source=olera_managed&utm_campaign={tag}`, tag = `{stub}-{city}-{mon}{yy}`. Display path: `Home-Care` / `{City}`.
- Campaign name: `{Provider} – {City} – {Mon YYYY}`.

## Phase 1 — Prep (DB + hygiene, no browser yet)

For each provider (from screenshot or $ARGUMENTS, matched against `ad_campaign_requests` where status='requested'):

1. **Pre-flight**: provider is verified OR `verification_state='not_required'` (both deliver leads); has photos (`metadata.images`) — if none, note "ask provider for 1-2 photos" as a TJ follow-up and eyeball the live page; has non-null lat/lng (geocode if missing — organic Find Families matching depends on it).
2. **ZeroBounce** the contact email (key in analysis scripts). Do NOT write results to `email_validity` (CHECK constraint only allows delivery outcomes).
3. **Flip the request row to `scheduled`** with `channel='google'`, the campaign tag, and admin notes. If they requested more than $50/mo, note it as the step-up conversation — still run the $50 intro.
4. **Build the campaign packet**: 12-13 phrase-match keywords ("home care {city}", "in home care {city}", "home health aide {city}", "senior home care {city}", 1-2 nearby suburbs, plus the standard near-me set), 13 headlines (provider name first; all ≤30 chars), 4 descriptions (≤90 chars). Only claim ratings if substantiated (e.g. "5-Star Rated" needs a real 5.0★ profile).

## Phase 2 — Build in Google Ads (chrome-devtools MCP)

Open `ads.google.com` (Olera account 419-933-1442, tj@olera.care). If the Claude-managed Chrome profile is signed out, ask TJ to sign in once and wait.

Wizard path: Create campaign → New campaign → **Create a campaign without guidance** → Search → keep default conversion goals → check Website visits only (never Phone calls) → tagged Final URL → campaign name → then per step:

- **Bidding**: focus = Clicks, check max CPC limit, $2.50.
- **Campaign settings**: uncheck both networks; Custom locations → Advanced search → **Radius** → city or ZIP, 20 mi; Location options → **Presence**; add Spanish.
- **AI Max**: leave OFF. **Keyword/asset generation**: Skip.
- **Keywords and ads**: paste keywords; set display paths; **replace every prefilled asset** — Google prefills an "Olera.care" headline (URL in ad text = the classic past denial) and sometimes wrong-city descriptions. Add headline slots to reach 13.
- **Budget**: Campaign total, $50, start/end dates.

### Mandatory policy audit (TJ requirement — do this before Review, every time)

Scripted check over every headline + description: **no URLs** (`http|www|.com|.care|...`), **no phone numbers**, **no weird stuff** (!!, ALL-CAPS runs, symbols), headlines ≤30 / descriptions ≤90. Report the audit result to TJ.

### Known blockers & how to handle

- `"home health care {city}"` keywords → hard policy block ("Health in personalized advertising"). **Remove the keyword**, don't request an exception. `"home health aide {city}"` passes. Never include dementia/alzheimer's/memory-care terms.
- Budget step may fire a Google **"Confirm it's you"** re-auth that only TJ can complete in the browser ("Changes failed to save" in the sidebar until cleared). Ask TJ, retry, continue. One verification usually covers the whole session.
- Bidding warning triangle after setting the CPC cap = standard advisory, not a blocker.
- Angular-Dart dropdowns don't expose options to the a11y tree — click options via evaluate_script on `material-list-item` / `material-select-dropdown-item`.

### Publish gate

**STOP at the Review screen and present the full config summary + audit result. TJ says "publish" → click Publish campaign.** Never publish without his explicit go. Record the campaign ID from the post-publish URL.

## Phase 3 — Post-publish (immediately, per campaign)

1. Skip the Google-tag interstitial (attribution = UTM → provider-page cookie, PR #1239 — never install gtag).
2. Navigate to the campaign's **Negative keywords** and add at campaign level: `jobs, careers, hiring, salary, employment, training, certification, classes, courses, volunteer, free`. Verify all 11 land in the grid.
3. Open campaign Settings and **verify the AI Max toggle is still aria-checked=false**.

## Phase 4 — Handoff (TJ-gated, do NOT do automatically)

Present as a checklist, don't execute:
- Flip request rows → **live via the `/admin/ad-boost` UI** once serving starts (auto-sends the once-guarded "campaign is live" email; a DB flip silently skips it).
- Any photo/profile asks for the provider.

Then: log the session to SCRATCHPAD.md (campaign IDs, deviations, lessons) and append the Worked Example to the Notion SOP.
