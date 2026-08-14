# Ad Boost Campaign Optimization (Browser-Driven)

Input: $ARGUMENTS — provider name(s), Google campaign ID(s), or nothing.

## Two modes

| | **Sweep mode** (no arguments) | **Targeted mode** (`/ad-boost-optimize Rosemonte`) |
|---|---|---|
| Scope | Every campaign currently serving | Only the named provider(s) / campaign ID(s) |
| Phase 1 | Full query + prioritization + skip rules | Resolve the name to a campaign ID, then straight to Phase 2 |
| Phase 2 read | Fixed comparable set, same for all | Same set **plus** whatever the specific complaint requires — ad-level performance, geo report, ad schedule, change history |
| Depth | Stop at the diagnosis table | Keep going until the campaign is actually explained |
| Output | Cross-campaign table + decision list | One campaign, full narrative: what's wrong, why, what was changed, what to watch |
| Use when | Routine 3-4 day maintenance | Something specific looks broken, TJ asks about one provider, or a campaign just came back from a fix and needs its 48h re-read |

Sweep mode is the default and the one that should run on a cadence. **Targeted mode is not "sweep mode with a filter"** — a sweep triages the book and moves on, a targeted run does not stop at "negatives look fine," it keeps digging until the number is explained. If a sweep flags a campaign as anomalous, the follow-up is a targeted run on that one.

**A bare invocation always sweeps.** No arguments means sweep — do not ask TJ which campaigns he meant, do not narrow it, just run the book. An attached screenshot alone does **not** switch modes here: it is context, not a target list. (This deliberately differs from `/ad-boost-setup`, where a screenshot of the Requested queue *does* pick the providers — that command acts on a queue, this one acts on everything serving.) Only an explicitly named provider or campaign ID in the text switches to targeted mode.

If arguments name a provider with more than one campaign (a revived flight 2, or a provider running two cities), list them and ask which — do not guess and do not do both silently.

## Purpose

The recurring mid-flight maintenance sweep for campaigns that are already running. `/ad-boost-setup` builds campaigns; this one keeps them from bleeding. It is the same work as that command's Phase 3.5 (search-terms harvest) and Phase 3.6 (revive), lifted out so it can be run across the whole live book on a cadence instead of once per build.

**Run this every 3-4 days.** On a 2-week flight there are only ~3 useful sweeps before the money is gone.

Browser driving: **run `/open-dia` first** and follow its rules (snapshot before screenshot, TJ handles every auth wall, gate irreversible clicks). This account is in **attach mode**, so see the hand-launch block in `/ad-boost-setup` Phase 2 Step A — the `/open-dia` kill-and-relaunch path assumes launch mode and will not work here.

Canonical references (read if uncertain, don't re-derive):
- `/ad-boost-setup` — locked invariants, direct URLs, campaign ID registry, all Google Ads automation gotchas.
- Notion SOP: "SOP — Managed Ads (Ad Boost): Google Ads Campaign Setup (any provider)" (id `38d5903a-0ffe-818f-a75b-db0951f7b178`).
- Memory: `project_managed_ads_setup_sop`, `project_adboost_outcome_blindness`.

## The one thing this command exists to prevent

Phrase match with close variants pulls competitor-brand and wrong-category queries hard. Nobody clicks a generic ad after searching a specific company by name, so CTR collapses → Quality Score follows → the campaign loses its auctions to Ad Rank → it underspends its $50 and delivers nothing. Measured on HomeWell: 119 search terms over a full flight, ~55 local competitor brands, ~20 senior-living communities, ~15 wrong-category, 4 out-of-market cities. **Every one of the 4 clicks on named terms ($9.23 of $33 spent) was wasted.**

Negatives are the only lever that compounds. Everything else on this page is diagnosis in service of that.

## Do NOT thrash

$50 ÷ ~$2.00 CPC = ~25 clicks per flight. At ~3% landing conversion that is **~0.7 expected leads**, so **roughly half of correctly-built campaigns will show zero leads and nothing is wrong.** Zero leads is not a signal. Zero *clicks* with impressions is a signal. Know the difference before touching anything.

Never change keywords and negatives in the same pass — the read becomes unattributable. Sequence is fixed: **negatives → wait 48h → re-read CTR → only then consider a keyword rebuild.**

## Phase 0 — Session guard (once per sweep, before any campaign)

Open `https://ads.google.com/aw/recommendations/autoapply?ocid=984737409`. Both cards must read **"0 of 7 selected"** and **"0 of 14 selected"**. If anything is on, uncheck it — then **navigate away and click Save in the leave-confirmation modal** (the top-of-page Save button is the workspace filter save and does nothing here). Reload to confirm.

This is the account's main silent-drift vector. It is what re-enables AI Max, reverts keywords to Google defaults, and re-adds the "Olera.care" headline.

## Phase 1 — Build the sweep list (no browser)

**Targeted mode:** resolve each argument to a campaign ID (registry below, or the campaigns page), confirm it is the flight TJ means, and skip the rest of this phase. Still run Phase 0 — auto-apply drift is account-wide, and one campaign is enough to notice it.

Query prod `ad_campaign_requests` (service-role key is in `.env.local`; never ask TJ for it):

```sql
select display_name, provider_slug, campaign_tag, status, flight_end_date,
       admin_note, created_at, ended_at
from ad_campaign_requests
where status in ('live','scheduled') and deleted_at is null
order by flight_end_date asc nulls last;
```

Then map each row to its Google campaign ID. **The registry lives at the bottom of `/ad-boost-setup` Phase 2** (HomeWell `24052308622` · Legacy Haven `24062146484` · Miracle-Lightstar `23998344651` · Impact `23998367469` · Abode `23981427299` · Rosemonte `24126008389`). Anything not listed: read `/aw/campaigns?ocid=984737409`, match on campaign name `{Provider} – {City} – {Mon YYYY}`, and **write the new ID back into that table in `ad-boost-setup.md`** so the next sweep doesn't re-derive it.

Prioritize the list:

| Situation | Priority |
|---|---|
| 3-7 days since launch, never harvested | **Highest** — this is where the money is still recoverable |
| ≥3 days since the last harvest line in `admin_note` | High |
| Flight ends in <3 days | High, different purpose — the terms feed the flight-2 revive, not this flight |
| Launched <3 days ago | Skip, no data yet |
| `status='scheduled'` but not actually serving | Not an optimization problem — check the launch, then hand to `/ad-boost-setup` |

**Flag assisted-living / senior-living providers separately** (Rosemonte today). The shared home-care negative list contains `"assisted living"`, `"senior living"`, `"retirement community"` — their core intent. Never apply it to them; they get campaign-level negatives built from the opposite direction (home-care terms, home-care brands, brokers).

## Phase 2 — Per-campaign read (gather before judging)

For each campaign, pull the same fixed set so verdicts are comparable across the book. Use the direct URLs — in-app nav hides or 404s most of these.

1. **Campaign row** — `/aw/campaigns?ocid=984737409`: status (Eligible / Eligible (Limited) / Ended), budget, spend-to-date, clicks, impressions, CTR, avg CPC.
2. **Impression share** — same page, Columns → Modify columns → **Competitive metrics**: `Search lost IS (rank)` and `Search lost IS (budget)`. Without these you cannot tell "losing auctions" from "budget-capped," and the fix is different.
3. **Search terms** — `/aw/keywords/searchterms?campaignId={id}&ocid=984737409`, **Show rows: 50**, read every term. For an ended campaign set the date range to **All time**; the default window renders empty and looks like "no data."
4. **Keywords** — `/aw/keywords?campaignId={id}&ocid=984737409`: note which have zero impressions, and **read the live set before writing any negative** (Phase 3).
5. **Existing negatives** — `/aw/keywords/negative?campaignId={id}&ocid=984737409`: read the `Level` column. Shared list shows as `List`, campaign-level as `Campaign`. You only need the delta.
6. **AI Max toggle** — campaign Settings, confirm `aria-checked=false`. It silently re-enables and its URL expansion strips `utm_campaign`, which kills attribution.

**Targeted mode adds** — pull these only when the campaign is the subject, they are too expensive for a sweep:

- **Ad-level performance** (`/aw/ads?campaignId={id}`): a campaign can look fine while one disapproved or under-serving ad drags it.
- **Change history** (`/aw/changehistory?ocid=984737409`): the fastest answer to "why did this change?" — including changes Google made on its own.
- **Geo report** (`/aw/geo?campaignId={id}`): out-of-market cities in the search terms usually mean the radius or Presence setting drifted.
- **Ad schedule / device split** (`/aw/devices?campaignId={id}`) — read only. **Never set a device bid adjustment**; see the locked invariant in `/ad-boost-setup`.
- **Live landing page**: load the provider page with the campaign's exact Final URL and confirm it renders, the UTM lands, and the inquiry CTA works. Clicks paid for a broken page are the worst outcome available and no Google-side report will ever show it.

## Phase 3 — Diagnose

| Symptom | Real cause | Fix |
|---|---|---|
| High lost IS (rank), low CTR | Brand / wrong-category matching tanking Quality Score | Negatives (Phase 4) |
| "Eligible (Limited) — Missing enough relevant keywords" | Too few live keywords; some drawing 0 impressions | Rebuild keyword set — **but only after a negatives pass has had 48h** |
| Badly underspending the $50, lost IS (budget) low | Losing auctions, not a budget problem | Negatives first, then consider the CPC cap |
| Underspending with lost IS (budget) high | Actually budget-constrained | Leave it. $50 is the locked intro spend |
| Zero leads, clean campaign, clicks landing | Just the $50 math (~0.7 expected leads) | **Nothing.** Do not thrash |
| Clicks but no leads across several flights | Landing-page conversion, not ads | Out of scope — that is a provider-page problem, report it |
| Impressions ~0 across the board | Geo, schedule, or disapproved ads | Check ad status + location settings before anything else |

**Mid-flight CTR is a leading indicator, not a verdict.** HomeWell read 1.04% at day 5 and finished the flight at 3.03%. The *waste pattern* in the search terms is the durable signal; CTR recovers on its own sometimes. Harvest on the terms, not on the CTR number.

## Phase 4 — Harvest negatives (the actual work)

Sort every search term into: **provider's own brand** (never negate — cheapest, highest-intent traffic they get) · **local competitor brands** · **senior-living / wrong-category** · **government / nonprofit / info-seeking** (`council on aging`, `office on aging`) · **out-of-market cities** · **legitimate**.

Rules, all non-negotiable:

- **Always phrase match, never broad.** Broad would kill the live `"home health aide {city}"` keyword.
- **A phrase negative blocks any query containing it.** Negating `"home health"` kills the live `"home health aide {city}"`. Negate the specific variants instead: `"home health care"`, `"home health {city}"`, `"home health agencies"`, and the branded ones.
- **Local competitor brands → campaign level.** They only ever surface here, which is why this sweep is recurring and per-campaign rather than one-time.
- **Nationally reusable terms → the shared list** (`provider managed ads negative keywords`, sharedSetId `12134249254`, 97 terms as of 2026-07-30). Adding here helps every campaign, including future ones.
- If the shared list isn't attached to a campaign, attach it: Negative keywords page → Add → "Use negative keyword list". **Home-care providers only.**

**TJ gate:** present the proposed negative list per campaign — grouped by bucket, with the live keywords it was checked against — and get his go before pasting. A wrong phrase negative silently kills a live keyword and you will not notice for days. Everything else in this command is read-only and needs no gate.

Pasting: the negative-keyword box is a `<textarea>`, so the JS native-setter trick works. `material-checkbox` and material-inputs do **not** accept synthetic clicks — use the real chrome-devtools `click` tool with snapshot uids. If a click reports success but nothing changes, check `document.elementFromPoint(x,y)` for a stuck `IPL-PROGRESS-INDICATOR` overlay and fix it with a `navigate_page` reload.

## Phase 5 — Record the sweep

For each campaign touched, append a dated line to `admin_note` on the request row:

```
[2026-08-14 harvest] 47 terms read · CTR 3.03% · avg CPC $2.36 · $33.02/$50 spent
· +18 campaign negatives (12 local brands, 6 wrong-category) · +3 to shared list
```

The next sweep reads this to decide priority, and it is the only record of what a campaign has already had done to it. **Also record final numbers here before any revive** — flight 1 and flight 2 metrics blend inside a revived campaign and become unseparable otherwise.

## Phase 6 — Flights that are ending

A flight at its end date does **not** get optimized. It gets:

1. A final search-terms harvest at **All time** — those terms are the entire input to flight 2.
2. Final numbers written to `admin_note`.
3. Wrap-up recorded so the outcome flow can ask the provider what actually happened. We are otherwise blind to conversions (see `project_adboost_outcome_blindness`: Franchil spent $36.50 and produced 1 confirmed client the platform never saw).

If the provider has requested again, **do not build a new campaign** — go to `/ad-boost-setup` Phase 3.6 and revive. Quality Score and ad history are per-campaign, and QS is exactly what throttles these campaigns; a fresh build throws it away and restarts learning.

## Output — one readout, not a click narration

**Sweep mode** — a single table across the whole book:

| Provider | Days in flight | Clicks / Impr / CTR | Spend | Verdict | Action taken | Needs TJ |
|---|---|---|---|---|---|---|

Then a short list of anything that needs a decision (keyword rebuilds pending the 48h re-read, providers to ask for photos, flights to revive) and, separately, **any campaign that warrants a targeted run** and why.

**Targeted mode** — no table, one campaign explained: the numbers, the diagnosis and what ruled out the alternatives, what changed, what to re-read and when. If the answer is "nothing is wrong," say that plainly and show the numbers that prove it.

Either mode: do not report a campaign as "optimized" if the only finding was zero leads on clean traffic. Say "healthy, no action, $50 math" and move on.
