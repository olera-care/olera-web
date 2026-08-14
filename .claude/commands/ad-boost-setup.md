# Ad Boost Campaign Setup (Browser-Driven)

Input: $ARGUMENTS — provider name(s), OR nothing if TJ attached a screenshot of the `/admin/ad-boost` Requested queue. A screenshot identifies WHICH providers to set up; the `ad_campaign_requests` table in prod is always the source of truth for their data.

## Purpose

Take one or more Ad Boost providers from "Requested" to published, policy-audited Google Ads campaigns — driving ads.google.com directly through the chrome-devtools MCP, with TJ approving each Publish click. This encodes the flow proven on Miracle-Lightstar + Impact (2026-07-05).

Canonical references (read if uncertain, don't re-derive):
- Notion SOP: "SOP — Managed Ads (Ad Boost): Google Ads Campaign Setup (any provider)" (id `38d5903a-0ffe-818f-a75b-db0951f7b178`). **Append a Worked Example entry for each provider when done.**
- Memory: `project_managed_ads_setup_sop` (locked invariants + browser-automation gotchas).

## Locked invariants (never re-derive, never ask)

- Google Search only at **$50 campaign total** (skip Meta even if they requested "both"), **2-week flight** starting next Monday-ish (Mon → Sun, 14 days, match the setup-week convention in the request row). TJ set this 2026-08-02: two weeks means we learn faster and providers don't lose interest waiting a month for results. Campaigns launched before that date keep their original 4-week flights — do not shorten live campaigns.
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

### Step A — prove the window is REAL and VISIBLE before touching the wizard (do this every session)

**TJ has to watch this flow and personally complete the Publish click and any Google "Confirm it's you" re-auth. A window he cannot see makes the whole session worthless.** So the very first browser action of every session is a visibility check, not a navigation:

```
evaluate_script: () => ({ innerW: innerWidth, innerH: innerHeight, outerW: outerWidth, outerH: outerHeight })
```

**`outerW`/`outerH` of 0 means the automation browser process is alive but windowless** — snapshot/evaluate/click still work, so the session *looks* fine while TJ sees nothing. Screenshots time out ("Page.captureScreenshot timed out") and `resize_page` errors "Active contents not found". Do NOT paper over this with `emulate` viewport — that restores clicking but never puts a window on TJ's screen, and you will get all the way to the publish gate before discovering he was blind the whole time. (Cost this once, 2026-08-10.)

**Fix — relaunch the automation browser with a real window (~15s).** The MCP for this account runs in **attach mode** (`--browserUrl http://127.0.0.1:9222` in `~/.claude.json`), so it will **not** relaunch the browser for you; killing it and calling `new_page` just fails. You must hand-launch:

```bash
# 1. Kill ONLY the automation instance — it is the one with --remote-debugging-port.
#    NEVER kill TJ's main Dia (plain command line, no automation flags).
pgrep -f "remote-debugging-port=9222"   # confirm the pid first
kill <automation-pid>; sleep 3

# 2. Relaunch with explicit window geometry and a URL arg (the URL is what forces a window to open)
nohup /Applications/Dia.app/Contents/MacOS/Dia \
  --user-data-dir=/Users/tfalohun/.cache/chrome-devtools-mcp/chrome-profile \
  --remote-debugging-port=9222 \
  --no-first-run --no-default-browser-check --restore-last-session=false \
  --window-size=1440,900 --window-position=40,40 \
  "https://ads.google.com/aw/overview?ocid=984737409" \
  >/tmp/dia-9222.log 2>&1 &
sleep 8
curl -s --max-time 5 http://127.0.0.1:9222/json/version   # must return JSON
```

Then `list_pages` (it will report "browser was restarted or reconnected" — call it again), `new_page`, and **re-run the visibility check**. Success looks like `outerW: 1440, outerH: 900` and a `take_screenshot` that actually returns an image. Confirm to TJ that the window is up before proceeding.

Note `--window-size` alone is not enough on a bare relaunch; pass the **URL argument** too or Dia can come back windowless again. If CDP answers but bounds are still 0×0, `Browser.setWindowBounds` over raw CDP on port 9222 can force geometry — but a fresh launch with the URL arg is the reliable path.

This is the same failure documented in the `/open-dia` skill under "Screenshots/resize time out but snapshot/evaluate still work" — that skill assumes launch mode (`kill` → `new_page` auto-relaunch); **this account is attach mode, so the hand-launch above is the correct version.** Read `/open-dia` for the other browser failure modes (Vercel Code 21, MCP launch hangs).

### Step B — the wizard

Open `ads.google.com` (Olera account 419-933-1442, tj@olera.care). If the Claude-managed Chrome profile is signed out, ask TJ to sign in once and wait.

Wizard path: Create campaign → New campaign → **Create a campaign without guidance** → Search → keep default conversion goals → check Website visits only (never Phone calls) → tagged Final URL → campaign name → then per step:

- **Bidding**: focus = Clicks, check max CPC limit, $2.50.
- **Campaign settings**: uncheck both networks; Custom locations → Advanced search → **Radius** → city or ZIP, 20 mi; Location options → **Presence**; add Spanish.
- **AI Max**: leave OFF. **Keyword/asset generation**: Skip.
- **Keywords and ads**: paste keywords; set display paths; **replace every prefilled asset** — Google prefills an "Olera.care" headline (URL in ad text = the classic past denial) and sometimes wrong-city descriptions. Add headline slots to reach 13.
- **Budget**: Campaign total, $50, start/end dates.
  - **If campaign-total refuses to publish, fall back to a daily budget.** A draft can get stuck showing `Add a budget: To publish your campaign, enter a budget` with **no Publish button**, even with `$50.00` and both dates entered and rendering correctly in the Overview. Re-entering, blurring, and re-saving does not clear it. Switching to **Average daily budget → Set custom budget → $50 ÷ flight days** (14d ⇒ `$3.57`) clears it instantly. Same spend envelope; the differences are that daily can flex up to 2× on a given day and the stop is enforced by the **end date** rather than a hard total cap — so after switching, **confirm the end date survived** (Campaign settings → More settings), because the dates live on the campaign-total widget and vanish from the Overview when you switch. This is draft-specific, NOT account-wide: existing campaigns run on campaign-total fine, and reviving one (below) can still use it.

### Mandatory policy audit (TJ requirement — do this before Review, every time)

Scripted check over every headline + description: **no URLs** (`http|www|.com|.care|...`), **no phone numbers**, **no weird stuff** (!!, ALL-CAPS runs, symbols), headlines ≤30 / descriptions ≤90. Report the audit result to TJ.

### Known blockers & how to handle

- `"home health care {city}"` keywords → hard policy block ("Health in personalized advertising"). **Remove the keyword**, don't request an exception. `"home health aide {city}"` passes. Never include dementia/alzheimer's/memory-care terms.
- Budget step may fire a Google **"Confirm it's you"** re-auth that only TJ can complete in the browser ("Changes failed to save" in the sidebar until cleared). Ask TJ, retry, continue. Clicking **Confirm** opens the real challenge in a **new tab** — `list_pages`, `select_page` with `bringToFront`, screenshot it, and hand TJ the window. Never type credentials.
- **The `AD_FINAL_URL` re-auth SILENTLY ROLLS BACK the entire ads step.** (Cost this a full rebuild, 2026-08-10.) It is triggered by the ad's destination URL, so it fires on a first-time domain/UTM combo and again on any later Final URL edit — not by the budget itself, despite appearing during the budget step. After ANY Google identity challenge, **re-verify the ads step field-by-field before trusting the Review screen**: expect all headlines/descriptions reverted to Google's prefill (the `Olera.care` headline reappears), keywords and display paths blank, and the budget reset. Verify with `Headlines n/15` + `Descriptions n/4` counters and by asserting no headline equals `Olera.care`.
- **The Review screen's Overview is not a reliable mirror of saved state.** It showed `Locations: All countries and territories` and AI Max "turned on" while the actual Campaign settings step held the correct radius and AI Max off — and it omits campaign start/end dates entirely even when they are set. Verify anything suspicious on its own step (dates live under Campaign settings → **More settings**, which does load despite the sub-panel warning above) before "fixing" what isn't broken.
- **`Publish campaign` only renders when you arrive at the summary through the wizard.** Loading `currentStep=campaign-summary` by URL, or reloading it, produces a page that says "ready to publish" with no button anywhere in the DOM. Go back one step and click **Next** to surface it.
- Bidding warning triangle after setting the CPC cap = standard advisory, not a blocker.
- Angular-Dart dropdowns don't expose options to the a11y tree — click options via evaluate_script on `material-list-item` / `material-select-dropdown-item`.
- **Synthetic JS `.click()` on `material-checkbox` does NOT register** — Angular never sees it and the counters don't even move. Use the real chrome-devtools `click` tool with snapshot uids. (JS native-setter DOES work for `<textarea>`, e.g. the negative-keyword paste box; it does NOT work for material-inputs or checkboxes.)
- **Campaign Settings sub-panels ("Other settings", where device/ad-schedule controls live) never finish loading** under the automation profile — they hang on "Loading name / Loading summary" forever, and Google shows a persistent "turn off ad blockers" dialog. Don't debug it; use the direct URLs below.
- **Before concluding "this setting won't save," check for a leave-confirmation modal.** Several Google Ads panels (notably auto-apply) defer the write until you navigate away. Uncheck → refresh will always look like a silent revert.
- **Clicks that "succeed" but change nothing → look for a stuck `ipl-progress-indicator`.** The wizard sometimes leaves a full-screen `position:fixed; z-index:9999; pointer-events:auto` loading overlay up permanently. The click tool reports success (it dispatched at the coordinates) but the overlay ate it, and `aria-selected` never flips. Diagnose with `document.elementFromPoint(x, y)` on the target's center — if it returns `IPL-PROGRESS-INDICATOR` instead of your element, that's it. **Fix: `navigate_page` reload.** Re-select from the reloaded page; wizard state up to that point lives in the `cmpnInfo` URL param and survives.
- **Verify each wizard selection actually took** before clicking Continue — `[role=tab]` → `aria-selected`, `material-checkbox` → `aria-checked`, dropdowns → the combobox `value`. Do not trust "Successfully clicked".

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

| Ads (status, Ad Strength) | `/aw/ads?campaignId=X&ocid=984737409` |
| Negative keyword list details | `/aw/negativekeywordlistdetails?ocid=984737409&sharedSetId=12134249254&sharedSetCustomerId=984737409` |

Campaign IDs: HomeWell `24052308622` · Legacy Haven `24062146484` · Miracle-Lightstar `23998344651` · Impact `23998367469` · Abode `23981427299` · Rosemonte (assisted living) `24126008389` · **Pacesetter `24072567829`** · **Edmonds Villa AFH `24094557242`**

Note `/aw/sharedlibrary/negativekeywordlists` and `/aw/campaigns/settings` both **404** — don't guess these. The shared-list URL above was derived by reading the list link's `href` off any campaign's negative-keywords page.

### Conversion tracking — known dead, don't chase it

All 6 lead conversion actions read **0.00** ("Provider inquiry (lead form)" = "No recent conversions"; others Inactive / Needs attention / Misconfigured). At ~72 clicks/month account-wide we will never reach the 15-30 conversions Smart Bidding needs, so **the "switch to Maximize Conversions once data accrues" plan is unreachable at this budget.** Leave campaigns on Maximize Clicks. Don't spend a session fixing tracking until volume justifies it.

### Publish gate

**STOP at the Review screen and present the full config summary + audit result. TJ says "publish" → click Publish campaign.** Never publish without his explicit go. Record the campaign ID from the post-publish URL.

## Phase 3 — Post-publish (immediately, per campaign)

0. **Re-open Settings → Bidding and read the Maximum CPC bid limit back. It must be `2.50`.** Edmonds Villa published at **$0.50** (2026-08-03) and nobody noticed for 11 days: 4 impressions, 0 clicks, $0.00 of $50 spent, >90% lost impression share to Ad Rank. A 5x-low cap cannot win auctions, and every downstream number looks like "low search volume" instead of a build error. The wizard's Review screen does not surface this. One read at publish time prevents a wasted flight.
1. Skip the Google-tag interstitial (attribution = UTM → provider-page cookie, PR #1239 — never install gtag).
2. **Apply the shared negative list** (`provider managed ads negative keywords`, sharedSetId `12134249254`, **97 terms** as of 2026-07-30) to the new campaign. This covers job-seeker terms, wrong care categories, and ~42 national competitor brands. **Home-care providers only** — see the assisted-living invariant above. Reach it via the campaign's Negative keywords page (`/aw/keywords/negative?campaignId=X`) → Add → "Use negative keyword list".
3. Open campaign Settings and **verify the AI Max toggle is still aria-checked=false**.
4. **Re-verify account auto-apply is still 0/7 and 0/14** (Phase 1 step 0). Publishing is exactly when Google likes to suggest re-enabling.

## Phase 3.5 — Search-terms harvest (MANDATORY, 3-5 days after launch — on a 2-week flight, day 7 is already halfway through)

**Do not skip this. It is where the actual money is being lost, and it is the single highest-value recurring chore in the whole product.**

> **Running this across the whole live book rather than for one new campaign? Use `/ad-boost-optimize`.** It sweeps every live campaign, prioritizes by days-in-flight and last-harvest date, and logs each sweep to `admin_note`. This phase and Phase 3.6 are its core.

Open `https://ads.google.com/aw/keywords/searchterms?campaignId={id}&ocid=984737409`, set **Show rows: 50**, and read every term.

What we found on HomeWell (2026-07-25) after 5 days: **all 50 named search terms had ZERO clicks.** ~28 were competitor brand navigation (`amada senior care`, `ohana home care`, `home instead`, `shannondale`) and ~14 were the wrong category (`home health`, `nursing home`, `assisted living`, `hospice`). Phrase match with close variants pulls brand queries hard. Nobody clicks a generic ad after searching a specific company by name — so CTR collapses (1.04%), Quality Score follows, and the campaign loses **87% of its auctions to Ad Rank** and underspends ($4.91 of $50). Death spiral.

**Full-flight numbers for that same campaign (measured 2026-08-10, after it ended — supersedes the mid-flight read above):** 14 clicks, 462 impressions, **CTR 3.03%**, avg CPC $2.36, **$33.02 of $50**, zero leads. So it recovered from 1.04%, and named terms did eventually get clicks. But **every one of the 4 named-term clicks ($9.23) was still wasted** — `commonwealth senior living at oak ridge`, `private duty nursing knoxville tn`, `private nursing near me`, `south knoxville senior living photos`. Of 119 total terms: ~55 local competitor brands, ~20 senior-living communities, ~15 wrong-category, 4 out-of-market cities. **Read the mid-flight number as a leading indicator, not a verdict — but the waste pattern persists regardless of what CTR does.**

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

## Phase 3.6 — Repeat customers (flight 2+): REVIVE, don't rebuild

**Always check `ad_campaign_requests` for prior rows on the same `provider_id` before building anything.** A provider whose earlier flight `ended` and who has requested again does NOT need a new campaign. Quality Score and ad history are per-campaign, and QS/Ad Rank is the thing throttling these campaigns — a fresh build throws that away and restarts learning. TJ chose revive on 2026-08-10 (HomeWell flight 2).

Revive order matters — **fix the config first, turn spend on last:**

1. **Harvest the prior flight's search terms first** (Phase 3.5) — an ended campaign's terms are the whole point of flight 2. Set the date range to **All time**; the default window is empty for an ended campaign.
2. **Check what negatives already exist** before pasting. The shared list is usually already attached; you only need the delta. Read the `Level` column — a shared list shows as `List`, everything else as `Campaign`.
3. **Read the live keywords before writing negatives** (`/aw/keywords?campaignId=X`). A phrase negative blocks any query containing it, so it can silently kill a live keyword — e.g. negating `"home health"` kills the live `"home health aide {city}"`. Negate the specific variants instead (`"home health care"`, `"home health {city}"`, `"home health agencies"`, branded ones).
4. **Never negate the provider's own brand.** It will appear in the search terms and it is the cheapest, highest-intent traffic they get.
5. **Update the ad's Final URL `utm_campaign`** to the new flight tag (`{stub}-{city}-{mon}{yy}`) or attribution merges both flights. Hover the ad row → the `Edit this Ad` pencil (`.ess-edit-icon`) only appears on hover. **This edit re-triggers the `AD_FINAL_URL` re-auth** — see Known blockers.
6. **Raise the campaign total budget** to `already-spent + 50` (HomeWell: $33.02 spent ⇒ $83) so the flight gets a real $50 of runway.
7. **Extend the end date LAST** — that is what flips `Ended → Eligible` and turns spend back on.

Then run Phase 3 checks (AI Max off, auto-apply 0/7 + 0/14) as normal.

**Reporting caveat to tell TJ:** flight 1 and flight 2 metrics blend inside the revived campaign. Record flight 1's final numbers in `admin_note` before reviving so the flights stay separable.

**Don't change keywords in the same pass as negatives.** Per the diagnosis table, negatives first → wait 48h → re-read CTR. Changing both makes the read unattributable. Dead `"near me"` keywords can stay; they draw zero impressions and cost nothing.

## Phase 4 — Handoff (TJ-gated, do NOT do automatically)

Present as a checklist, don't execute:
- Flip request rows → **live via the `/admin/ad-boost` UI** once serving starts (auto-sends the once-guarded "campaign is live" email; a DB flip silently skips it).
- Any photo/profile asks for the provider.

Then: log the session to SCRATCHPAD.md (campaign IDs, deviations, lessons) and append the Worked Example to the Notion SOP.
