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
- **Account-level auto-apply stays OFF, all 15 types.** Verify at the start of every session (Phase 1 step 0). This is the account's main silent-drift vector — it is what re-enables AI Max, reverts keywords to Google defaults, and re-adds the "Olera.care" headline.
- **NEVER set a device bid adjustment.** Paid traffic is already ~87% mobile on its own (desktop = 9.2% of clicks AND 9.2% of spend, measured 2026-07-25). Excluding desktop saves <$10/mo and only narrows the auction. Do not confuse this with the site's ORGANIC provider-page traffic, which is 71% desktop — different population, different problem, owned by Esther.
- **No bare "near me" phrase keywords.** Measured across HomeWell + Legacy Haven: `"home care near me"`, `"in home care near me"`, `"caregivers near me"` drew **zero impressions**. They are dead slots. Use `{service} {city}` and `{service} {suburb}` instead.
- **Assisted-living / senior-living providers get a DIFFERENT negative list.** Never apply the home-care shared list to them — it contains `"assisted living"`, `"senior living"`, `"retirement community"` etc., which are their core intent. Build them a campaign-level list instead (home-care terms + home-care brands + senior-living operator brands + brokers).

### Expectation-setting (say this out loud, don't quietly over-promise)

$50 ÷ ~$2.00 CPC = **~25 clicks total for the whole flight**. At the measured ~3% mobile landing conversion that is **~0.7 expected leads**, so **roughly half of correctly-built campaigns will show zero leads.** That is arithmetic, not a defect. TJ has explicitly rejected raising the budget (8+ providers, none paying, unproven product). So the only levers are **clicks-per-dollar** (Quality Score → lower CPC) and **conversion-per-click**. Optimize those; don't promise leads.

## Phase 1 — Prep (DB + hygiene, no browser yet)

**Step 0 — account-level guard (do ONCE per session, before anything else).** Open `https://ads.google.com/aw/recommendations/autoapply?ocid=984737409` and confirm both cards read **"0 of 7 selected"** and **"0 of 14 selected"**. If anything is on, uncheck it. **The save is a leave-confirmation modal, NOT an inline button** — uncheck everything, then navigate away and click **Save** in the "Save changes to your auto-apply settings?" dialog. The `Save` button visible at the top of the page is the filters/workspace save and does nothing for auto-apply. Reload to confirm it stuck.

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
- **Synthetic JS `.click()` on `material-checkbox` does NOT register** — Angular never sees it and the counters don't even move. Use the real chrome-devtools `click` tool with snapshot uids. (JS native-setter DOES work for `<textarea>`, e.g. the negative-keyword paste box; it does NOT work for material-inputs or checkboxes.)
- **Campaign Settings sub-panels ("Other settings", where device/ad-schedule controls live) never finish loading** under the automation profile — they hang on "Loading name / Loading summary" forever, and Google shows a persistent "turn off ad blockers" dialog. Don't debug it; use the direct URLs below.
- **Before concluding "this setting won't save," check for a leave-confirmation modal.** Several Google Ads panels (notably auto-apply) defer the write until you navigate away. Uncheck → refresh will always look like a silent revert.

### Direct URLs (the in-app nav hides or 404s on most of these)

| Page | URL |
|---|---|
| Device performance | `/aw/devices?campaignId=X&ocid=984737409` |
| Search terms | `/aw/keywords/searchterms?campaignId=X&ocid=984737409` |
| Keywords | `/aw/keywords?campaignId=X&ocid=984737409` |
| Campaign negatives | `/aw/keywords/negative?campaignId=X&ocid=984737409` |
| Auto-apply settings | `/aw/recommendations/autoapply?ocid=984737409` |
| Conversion actions | `/aw/conversions?ocid=984737409&subtab=allconv` |
| Change history | `/aw/changehistory?ocid=984737409` |

Campaign IDs: HomeWell `24052308622` · Legacy Haven `24062146484` · Miracle-Lightstar `23998344651` · Impact `23998367469` · Abode `23981427299`

### Conversion tracking — known dead, don't chase it

All 6 lead conversion actions read **0.00** ("Provider inquiry (lead form)" = "No recent conversions"; others Inactive / Needs attention / Misconfigured). At ~72 clicks/month account-wide we will never reach the 15-30 conversions Smart Bidding needs, so **the "switch to Maximize Conversions once data accrues" plan is unreachable at this budget.** Leave campaigns on Maximize Clicks. Don't spend a session fixing tracking until volume justifies it.

### Publish gate

**STOP at the Review screen and present the full config summary + audit result. TJ says "publish" → click Publish campaign.** Never publish without his explicit go. Record the campaign ID from the post-publish URL.

## Phase 3 — Post-publish (immediately, per campaign)

1. Skip the Google-tag interstitial (attribution = UTM → provider-page cookie, PR #1239 — never install gtag).
2. **Apply the shared negative list** (`provider managed ads negative keywords`, sharedSetId `12134249254`, **97 terms** as of 2026-07-30) to the new campaign. This covers job-seeker terms, wrong care categories, and ~42 national competitor brands. **Home-care providers only** — see the assisted-living invariant above. Reach it via the campaign's Negative keywords page (`/aw/keywords/negative?campaignId=X`) → Add → "Use negative keyword list".
3. Open campaign Settings and **verify the AI Max toggle is still aria-checked=false**.
4. **Re-verify account auto-apply is still 0/7 and 0/14** (Phase 1 step 0). Publishing is exactly when Google likes to suggest re-enabling.

## Phase 3.5 — Search-terms harvest (MANDATORY, 3-7 days after launch)

**Do not skip this. It is where the actual money is being lost, and it is the single highest-value recurring chore in the whole product.**

Open `https://ads.google.com/aw/keywords/searchterms?campaignId={id}&ocid=984737409`, set **Show rows: 50**, and read every term.

What we found on HomeWell (2026-07-25) after 5 days: **all 50 named search terms had ZERO clicks.** ~28 were competitor brand navigation (`amada senior care`, `ohana home care`, `home instead`, `shannondale`) and ~14 were the wrong category (`home health`, `nursing home`, `assisted living`, `hospice`). Phrase match with close variants pulls brand queries hard. Nobody clicks a generic ad after searching a specific company by name — so CTR collapses (1.04%), Quality Score follows, and the campaign loses **87% of its auctions to Ad Rank** and underspends ($4.91 of $50). Death spiral.

Harvest into negatives, **always phrase match, never broad** (broad would kill the live `"home health aide {city}"` keyword):

- **Local competitor brands.** The national list is already applied; every market has its own operators that ONLY surface here. This is why the harvest is per-campaign and recurring, not one-time.
- **Wrong-category terms** the national list missed.
- **Government / nonprofit / info-seeking** (`council on aging`, `office on aging`).

Add local brands at **campaign level**; add anything nationally reusable to the **shared list**.

### Reading the diagnosis correctly

| Symptom | Real cause | Fix |
|---|---|---|
| High lost IS (rank), low CTR | Brand/wrong-category matching tanking Quality Score | Negatives (this phase) |
| "Eligible (Limited) — Missing enough relevant keywords" | Too few live keywords; some have 0 impressions | Rebuild keyword set |
| Campaign badly underspending its $50 | Losing auctions, not a budget problem (check lost IS budget is low) | Negatives first, then consider CPC cap |
| Zero leads on a clean campaign | Just the $50 math (~0.7 expected leads) | Nothing. Do not thrash. |

**Sequence matters:** fix negatives first, wait 48h, then re-read CTR. Only rebuild keywords if CTR did not move. One number decides; do not rebuild on a hunch.

## Phase 4 — Handoff (TJ-gated, do NOT do automatically)

Present as a checklist, don't execute:
- Flip request rows → **live via the `/admin/ad-boost` UI** once serving starts (auto-sends the once-guarded "campaign is live" email; a DB flip silently skips it).
- Any photo/profile asks for the provider.

Then: log the session to SCRATCHPAD.md (campaign IDs, deviations, lessons) and append the Worked Example to the Notion SOP.
