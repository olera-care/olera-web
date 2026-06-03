# Data Sweep Runbook

> Companion to the `/data-sweep` skill. This doc owns the **operational details**: regex patterns, prompt templates, contradiction detection logic, code snippets. The skill is the orchestrator; this is the cookbook.

> **Status: DRAFT v1 (2026-04-26).** Will evolve with each sweep — see "Change log" at the bottom.

## Last sweep marker

- **Last sweep:** 2026-06-03 (sweep #2 — incremental + DB-wide signal scan). Prior: 2026-04-26 (inaugural).
- **Next planned:** quarterly default → ~2026-09-03
- **Sweep mode going forward:** **DB-wide free signal scan every time** (cheap, catches name-innocent classes) + **incremental LLM pass** on providers created since the last sweep (`created_at >= last-sweep-date`). Full-DB LLM re-verify only on demand — sweep #2 showed it mostly re-confirms the prior pool for ~10x the cost.
- **`created_at` caveat:** the entire active table was bulk-repopulated by a migration (~2026-03-15), so `created_at` is NOT true provider age. It IS reliable for "added since the last sweep." Don't use it for historical age.

## Tier 1 deletion regex patterns

For each bucket, the regex matches the `provider_name` field. Combined-service protector regex (below) excludes any provider with an in-scope service term in their name.

### In-scope protector (excludes from deletion)

```javascript
const IN_SCOPE_PROTECTORS = /\b(home health|home care|homecare|VNA|visiting nurse|assisted living|memory care|nursing home|nursing & rehab|nursing and rehab|skilled nursing|independent living|retirement community|senior living|continuing care)\b/i;
```

### Bucket regexes

```javascript
const BUCKETS = [
  { id: 'pharmacy', regex: /^(walgreens|cvs|rite aid|rite-aid)\b/i, default_checked: true },
  { id: 'dme-chain', regex: /^(apria|lincare)\b/i, default_checked: true },
  { id: 'funeral', regex: /\b(funeral|mortuary|crematory|crematorium)\b/i, default_checked: true },
  { id: 'wedding-event', regex: /\b(wedding|banquet hall|event venue|reception hall)\b/i, default_checked: true },
  { id: 'fitness', regex: /\b(anytime fitness|onelife fitness|peak fitness|24 hour fitness|equinox|orange ?theory|pilates|yoga studio)\b/i, default_checked: true },
  { id: 'restaurant-retail', regex: /\b(restaurant|diner|bistro|cafe|grille|bakery|barbershop|salon & medspa|medspa|nail salon|beauty salon|tire|auto repair|mechanic)\b/i, default_checked: false }, // false positives possible — review carefully
  { id: 'pediatric-daycare', regex: /\bchild(ren)?(\'s)?\b/i, secondary: /\b(daycare|day ?care|home care services|care services)\b/i, default_checked: true },
  { id: 'pace', regex: /\bPACE\b/, secondary: /(senior|elder|care|health|aging)/i, default_checked: true },
  { id: 'mexican', regex: /(\basilo\b|estancia geri[áa]trica|casa sacerdotal|adultos mayores|\bA\.?C\.?$)/i, default_checked: true },
  { id: 'test-data', regex: /\((test|demo|placeholder|dummy)\)/i, default_checked: true },
  { id: 'pure-hospice', regex: /\bhospice\b/i, requires_no_protector: true, default_checked: false }, // big bucket, TJ should review
  { id: 'adult-day-pure', regex: /\b(adult day|senior day center|day program|day services|day health|adult day activity)\b/i, requires_no_protector: true, default_checked: false },
  { id: 'rehab-hospital', regex: /\brehabilitation hospital\b/i, default_checked: false },
  { id: 'hospital-clinic', regex: /\b(urgent care|medical center|regional medical|memorial medical|hospital(?! ?at home))\b/i, requires_no_home_xxx: true, default_checked: false },
  { id: 'gov-office', regex: /\b(office on aging|office of aging|department of human services|department of aging|aging services office|county office)\b/i, requires_no_protector: true, default_checked: false },
  // Added sweep #2 (2026-06-03): addiction/behavioral-health was the #1 contamination class,
  // landing as Nursing Home. High-precision name tokens; protector regex still applies.
  // NOTE: most addiction centers are NAME-INNOCENT (Harmony Place, Summer Sky) — the name
  // regex only catches the obvious ones. The DB-wide signal scan (below) is the real net.
  { id: 'addiction-behavioral', regex: /\b(sober living|sober house|detox|addiction treatment|drug rehab|alcohol rehab|substance abuse|halfway house|methadone)\b/i, requires_no_protector: true, default_checked: true },
  { id: 'tattoo-bodyart', regex: /\b(tattoo|body piercing)\b/i, default_checked: true },
];
```

## DB-wide signal scan (sweep #2 addition — run FIRST, every sweep, free)

The SIR House (sober-living) / SUNDRY HOUSE (tattoo studio) class is **name-innocent** — the out-of-scope evidence lives in the **website domain** and **Google reviews**, not the name. No name-regex or LLM-name-check catches them. A deterministic scan over `provider_description` + `google_reviews_data` + `website` does, for $0.

Shipped as `scripts/scan-out-of-scope-signals.js` (run `--since <last-sweep>` for incremental, `--verify` to LLM-check hits, `--verify --apply` to soft-delete confirmed). High-precision signals (validated sweep #2, near-zero FP):

```javascript
const ADDICTION = /\b(sober living|sober house|sober home|recovery residence|halfway house|12[- ]step|substance (abuse|use) (disorder|treatment)|drug (and|&) alcohol (rehab|treatment|addiction)|alcohol (and|&) drug (rehab|treatment)|detox(ification)?|drug rehab|alcohol rehab|addiction (treatment|recovery|center)|intensive outpatient program|medication[- ]assisted treatment)\b/i;
const VENUE_DOMAIN = /(weddingestates|springsvenue|eventvenue|weddingvenue|\/venues?\/|banquethall|eventspace)/i;
const TATTOO = /\b(tattoo|body piercing|aerial silk)\b/i;
const NAME_HOMECARE = /home (care|health)/i; // EXCLUDE — "Recovery Home Care" is a legit FL Medicare HHA
```

**Anti-patterns the scan must avoid (sweep #2 false-positive sources):**
- `venue` must NOT match "**A**venue" — anchor on domain/path tokens, not bare `\bvenue\b`.
- `birthday party` / `baby shower` / `we hosted` in reviews are mostly FAMILIES reviewing legit communities — drop them.
- `yoga studio` / `art studio` / `personal training` appear in legit senior-community amenity lists — drop them.
- Exclude names matching `home (care|health)` from the addiction bucket.

## Two-pass verification (sweep #2 — MANDATORY before any deletion)

Batched verify (3+ providers per Perplexity call) under-grounds badly: sweep #2's incremental pass returned **51% INSUFFICIENT** and **73 false-OUT** that would have been wrongful deletions. **Never delete on a batched verdict.**

1. **Pass 1 — batched** (3/call, 10 concurrent): cheap triage to surface OUT/reclass candidates.
2. **Pass 2 — individual re-verify** (1/call, website forced) on every OUT and reclass candidate: flips false-OUT back to IN_SCOPE, supplies correct `best_category`, and confirms true OUT with cited evidence. Only Pass-2-confirmed OUT goes on the deletions MD.

Sweep #2 actuals: 399 batched-OUT → 320 confirmed (73 spared, 6 unclear); 451 batched-reclass → 368 confirmed + 31 actually-OUT + 36 already-correct.

### TJ overrides observed in past runs

- **Sweep 2026-04-26:** TJ kept 2 test-data providers (`r4HIF35` Aggie + `amULsG1` Blueheart) — these are intentional test fixtures.
- Always show test-data candidates to TJ for review even though pre-checked.

## Tier 1 reclassification regex patterns

```javascript
// Home Care (Non-medical) franchises — these chains exclusively do non-clinical in-home care
const HC_FRANCHISE_REGEX = /\b(visiting angels|home instead|comfort keepers|right at home|senior helpers|always best care|firstlight home ?care|caring senior service|comforcare|synergy home ?care|touching hearts at home|home helpers|griswold home ?care|homewell care services|nurturecare|live well home ?care|cariloop|seniorcare|always there senior care)\b/i;

// Home Health Care brands (Medicare-certified HHA)
const HHC_BRAND_REGEX = /\b(amedisys|encompass health home health|kindred at home|bayada home health|interim healthcare|interim health ?care|lhc group|loyal home ?health)\b/i;

// Nursing Home indicators
const NH_REGEX = /\b(skilled nursing facility|skilled nursing & rehab|skilled nursing and rehab|convalescent hospital|skilled nursing center)\b/i;

// Single-category-explicit-in-name (only if NO competing category indicator)
const MC_EXPLICIT = /\bmemory care\b/i;
const IL_EXPLICIT = /\bindependent living\b/i;
const AL_EXPLICIT = /\bassisted living\b/i;
```

### Reclass priority

1. HC franchise → `Home Care (Non-medical)` (always wins)
2. HHC brand → `Home Health Care`
3. NH explicit → `Nursing Home`
4. MC explicit AND no AL AND no IL → `Memory Care`
5. IL explicit AND no AL AND no MC → `Independent Living`
6. AL explicit AND no MC AND no IL → `Assisted Living`

### Skip rules

- Skip combined-category providers (`AL | MC`, etc.) entirely — these are explicit multi-level facilities, don't re-bucket.
- Skip providers already in the suggested category.

### TJ overrides observed in past runs

- **Sweep 2026-04-26:** TJ skipped `Nursing Home → Memory Care: 9 providers` — those are multi-category facilities that should stay as Nursing Home.

## Phase 3 LLM prompt (current — inverted form)

This prompt was developed in sweep #1 after the original prompt over-flagged providers as out-of-scope. The key innovations:
- **Tight YES list** (the 6 with crisp definitions) — open NO list ("anything else")
- **Three verdicts** — IN_SCOPE / OUT_OF_SCOPE / INSUFFICIENT_EVIDENCE
- **Default-keep on uncertainty** — only flag OUT_OF_SCOPE with positive web evidence

```
You are auditing a senior care provider directory. Olera matches care seekers to providers in EXACTLY 6 categories:

1. Home Care (Non-medical) — non-clinical in-home assistance with ADLs (bathing, dressing, meals, companionship). Caregiver is NOT a licensed clinician practicing within their license.
2. Home Health Care — Medicare-certified intermittent skilled clinical care in the home (skilled nursing, PT/OT/SLP). Provider must be a Medicare-certified Home Health Agency.
3. Assisted Living — residential community with 24/7 ADL support. Includes Adult Family Homes (WA/OR/ID), Personal Care Homes (PA), Residential Care Facilities for the Elderly (CA).
4. Independent Living — senior-restricted residential community (55+/62+) with services (dining, transportation, programming). Pure age-restricted housing without services does NOT count.
5. Memory Care — secured residential community for dementia/Alzheimer's. Standalone or distinct wing.
6. Nursing Home — 24/7 skilled nursing facility (SNF). Includes "Nursing and Rehabilitation Center". Does NOT include Inpatient Rehab Hospitals.

Combined-service providers qualify if AT LEAST ONE service line is in the 6.

For EACH provider below, search the web (their website, reviews, directory listings) and return one of three verdicts:

  IN_SCOPE — primary business clearly matches one of the 6.
             Return best_category as one of the EXACT strings above.

  OUT_OF_SCOPE — POSITIVE web evidence the primary business is something else
                 (hospice without home-health line, adult day care, PACE program,
                  geriatric primary care clinic, Inpatient Rehab Hospital, hospital,
                  DME/pharmacy, mental illness facility, military housing, pure 55+
                  apartments without services, broker/management company, pediatric
                  care, government office, anything outside the United States, etc.).

  INSUFFICIENT_EVIDENCE — no website found or web evidence inadequate to decide.
                          DO NOT mark OUT_OF_SCOPE on uncertainty.

CRITICAL: Only mark OUT_OF_SCOPE when you have POSITIVE web evidence the primary business is one of the excluded types. If you cannot verify either way, return INSUFFICIENT_EVIDENCE — never default to OUT_OF_SCOPE on absence of information.

[3 providers per call, with name, address, current category, website]

Return ONLY this JSON, no commentary:
{"providers":[
  {"num":1, "verdict":"IN_SCOPE|OUT_OF_SCOPE|INSUFFICIENT_EVIDENCE", "best_category":"<one of the 6 EXACT strings if IN_SCOPE, else null>", "reason":"<short>"},
  {"num":2, ...},
  {"num":3, ...}
]}
```

## Contradiction detection (post-LLM filter)

After Phase 3 LLM run, before generating the reclassifications MD, apply this filter to drop self-contradicting verdicts.

```javascript
const CAT_TOKENS = {
  'Memory Care': /\b(memory care|memory support|memory wing|memory unit|memory neighborhood|alzheimer|dementia)\b/i,
  'Assisted Living': /\b(assisted living|\bALF\b|residential care facility|RCFE|personal care home|adult family home)\b/i,
  'Independent Living': /\b(independent living|retirement community|55\s*\+|62\s*\+|active adult)\b/i,
  'Nursing Home': /\b(nursing home|skilled nursing|SNF\b|convalescent)\b/i,
  'Home Health Care': /\b(home health|medicare-certified|skilled (visit|nursing visit))\b/i,
  'Home Care (Non-medical)': /\b(non-medical|companion(ship)?|in-home (care|caregiv)|personal care aid)\b/i,
};

function isContradiction(currentCat, suggestedCat, llmReason) {
  const oldParts = currentCat.split('|').map(s => s.trim()).filter(s => VALID_CATEGORIES.has(s));
  if (oldParts.length <= 1) return false;
  const dropped = oldParts.filter(c => c !== suggestedCat);
  for (const cat of dropped) {
    if (CAT_TOKENS[cat]?.test(llmReason || '')) return true;
  }
  return false;
}
```

**Rule:** if the provider's current category is combined (e.g., `AL | MC`) and the LLM suggests dropping one of the parts, but the LLM's reason text mentions terms associated with the dropped part, flag as contradiction. Auto-exclude from MD review.

**Sweep #1 finding:** ~31% of LLM reclassification verdicts were contradictions — overwhelmingly combined-category simplifications where the reason confirmed both services exist. Without this filter, TJ would have to manually review and reject ~1,100 false positives.

**Vocabulary updates (sweep #1 → v2):**
- Original "Memory Care" regex was just `\bmemory care\b/i`. Widened to also catch `memory support`, `memory wing`, `memory unit`, `alzheimer`, `dementia`.
- Future sweeps: capture any vocabulary the LLM uses that current regex misses → add to the relevant token list.

## Category-amnesia detection (post-LLM filter, applied to OUT_OF_SCOPE verdicts)

A second class of LLM contradiction surfaced in sweep #1: the LLM correctly identifies an in-scope service in its reason text but **incorrectly concludes OUT_OF_SCOPE**. Example: "Website describes non-medical home care services" → marked OUT_OF_SCOPE instead of recognizing it as `Home Care (Non-medical)`.

The LLM's mental model: it rules out one category (e.g., "no Medicare-certified home health agency") and forgets to check the other 5. This was a real and meaningful error class — sweep #1 found 320 amnesia cases (~11% of OUT_OF_SCOPE verdicts).

```javascript
// IN_SCOPE_MATCHES — reason patterns that describe in-scope services.
// If an OUT_OF_SCOPE verdict's reason matches one of these (without nearby negation),
// the LLM contradicted itself.
//
// v2 (2026-04-27): widened service vocab — added "personal care assistance",
// "non-medical in-home", "certify family home", "residential care facility"
// (without "for the elderly" suffix), bare "assisted living category/definition".
const IN_SCOPE_MATCHES = [
  { cat: 'Home Care (Non-medical)', re: /\b(non[- ]?medical (home care|in-home (assistance|support|care|help|aid|services))|companion(ship)? (care|services)|personal care (services|aide|aid|assistance)|in-home (caregiv|care services|companion|companionship)|homemaker services|caregiver agency|private duty (non[- ]?medical|companion))/i },
  { cat: 'Home Health Care', re: /\b(medicare[- ]?certified home health|home health agency|HHA\b|certified home health|VNA|visiting nurse association|skilled (nursing|clinical) (home (visit|care)|in-home))/i },
  { cat: 'Assisted Living', re: /\b(assisted living\s+(community|facility|residence|category|definition|requirements?)|matches assisted living|qualifies (?:as|under) assisted living|RCFE\b|residential care facility(?:\s+for(?: the)? elderly)?|personal care home|adult family home|certify family home|certified family home)/i },
  { cat: 'Independent Living', re: /\b(independent living (community|residence)|senior (community|residential) with .*services|active adult community with .*services)/i },
  { cat: 'Memory Care', re: /\b(memory care (community|facility|residence|wing|unit)|secured (dementia|memory) (community|wing|facility)|alzheimer'?s? (community|facility|residence))/i },
  { cat: 'Nursing Home', re: /\b(skilled nursing (facility|home|center)|nursing and rehabilitation center|nursing home|SNF\b|convalescent (home|hospital))/i },
];

// META_REFS — cross-cutting signals where the LLM names a category by name
// directly. v2 addition. Stronger signal than service vocab — checked first.
const CAT_NAMES = '(Home Care \\(Non-medical\\)|Home Health Care|Assisted Living|Independent Living|Memory Care|Nursing Home)';
const META_REFS = [
  new RegExp(`\\bshould be reclassified as (?:the )?${CAT_NAMES}\\b`, 'i'),
  new RegExp(`\\bfalls under (?:the )?(?:'?)${CAT_NAMES}(?:'?)(?:\\s+category)?\\b`, 'i'),
  new RegExp(`\\bmatches (?:the )?(?:'?)${CAT_NAMES}(?:'?)(?:\\s+(?:category|definition))?\\b`, 'i'),
  new RegExp(`\\b${CAT_NAMES}\\s+category\\s+definition\\b`, 'i'),
  new RegExp(`\\b(?:qualifies|qualified)\\s+(?:as|under)\\s+(?:the )?${CAT_NAMES}\\b`, 'i'), // bare "qualify" infinitive omitted — too often used in negation ("required to qualify", "fails to qualify")
  new RegExp(`\\bcategory\\s+\\d+\\s+\\(${CAT_NAMES}`, 'i'), // "category 2 (Home Health Care — ..."
  new RegExp(`\\b(?:primary business is|primary service is|operates as|operating as)\\s+(?:a |an |the )?${CAT_NAMES}\\b`, 'i'),
];

// Negation phrases — if these appear in the current clause BEFORE the match,
// it's likely the LLM is saying "NOT [in-scope service]" — don't flag.
// v2: added "without ... required/services/qualif", "fails to", "does not", "would not", "cannot".
const NEGATION_NEAR = /\b(not (a |an |actually |truly )?|but is not|however|though not|doesn'?t (have|provide|operate)|does not |would not |cannot |fail(?:s|ed)? to |lacks?|no evidence of|cannot confirm|without (?:the )?(?:required |adequate |sufficient )?(?:service|amenit|program|dining|transportation|staff|qualif))/i;

// v2.1 (2026-04-27): clause-level negation. Fixed-char windows (40/60 chars)
// missed long-list-of-negations like "is X, not Y, Z, W, or V" where one of
// Y..V matches the category regex but is far from "not". Scan back to start
// of current clause (last period/semicolon) for negation cues instead.
function clauseHasNegation(reason, matchIdx) {
  let start = 0;
  for (let i = matchIdx - 1; i >= 0; i--) {
    const c = reason[i];
    if (c === '.' || c === ';') { start = i + 1; break; }
  }
  return NEGATION_NEAR.test(reason.slice(start, matchIdx));
}

function detectAmnesia(reason) {
  if (!reason) return null;
  // Meta-references first (stronger signal).
  for (const re of META_REFS) {
    const m = re.exec(reason);
    if (!m) continue;
    const cat = m[1];
    if (!VALID_CATEGORIES.has(cat)) continue;
    if (clauseHasNegation(reason, m.index)) continue;
    return cat;
  }
  // Service vocab fallback.
  for (const { cat, re } of IN_SCOPE_MATCHES) {
    const m = re.exec(reason);
    if (!m) continue;
    if (clauseHasNegation(reason, m.index)) continue;
    return cat;
  }
  return null;
}
```

**Action:**
- If detected category ≠ current category: **move from deletions → reclassifications-from-deletions MD** for TJ to review
- If detected category == current category: **silently drop from deletions** (no DB action — the LLM rambled but the bottom line was wrong)

**Sweep #1 actuals (v1 regex):**
- 199 cases moved to reclass (current ≠ detected)
- 121 cases silently dropped (current == detected)
- 2,616 clean deletions remained for TJ review

**Sweep #1 v2.1 re-run (2026-04-27, widened regex + clause-level negation):**
- 245 cases moved to reclass (+46 vs v1)
- 122 cases silently dropped (+1)
- 2,569 clean deletions (-47)
- v2 first run pulled 254 reclass but 9 were FPs from long-list-of-negations ("is X, not Y, Z, W, or V" where Y..V matched a category regex). Fixed in v2.1 by scanning back to start of clause for negation, not a fixed window.
- Script: `~/Desktop/olera-web/regen-amnesia-mds.js` — rerun-safe, reads cached verdicts JSON
- v1 backups preserved as `*.v1.md` in the Cleanup folder

**Maintenance:** Add new vocabulary patterns whenever a sweep surfaces an LLM phrasing the regex didn't catch. Especially watch for hospice-related phrasing that the LLM uses to disqualify HHC (e.g., "primarily a hospice provider") — those should NOT be flagged as amnesia even though they mention HHC adjacent terms.

### Known regex gaps remaining (carry-forward TODOs)

After v2 widening, these patterns are still potentially recoverable but require caution:

- **Combined-service hospice + home care** (e.g., `kejw4eH` PrimRose Home Care & Hospice — Ogden, UT). LLM said "primary business is hospice care combined with home care" and rejected because "Hospice is...not Medicare-certified intermittent skilled home health." Per the 6-category definitions, combined service qualifies if at least one line is in scope, but the LLM's framing makes it ambiguous whether the home-care line is non-medical (HC) or skilled-nursing (HHC). Auto-recovery risks false positives. Leave for human review.
- **"Home Care, Non-medical" without parens** — LLM occasionally uses comma form vs parenthetical. CAT_NAMES regex requires `Home Care \(Non-medical\)` literally. If a sweep surfaces this, add `Home Care(?:,| \()? Non-medical(?:\))?` variant.
- **"Residential Care Facilities for the Elderly" plural** in non-CA contexts — current regex catches singular form only. Update to make plural-`s` optional if a case appears.

When widening, validate against silent-drop cases — make sure they don't get spuriously moved to reclass.

### Borderline cases TJ should watch for during review

- **Personal Care Home (Michigan/Pennsylvania)** — these state-specific licenses are AL-equivalent residential facilities, but the LLM sometimes describes them with "non-medical personal care" service vocab that triggers the HC (Non-medical) regex. Example: `holt-mi-0007` Holt Friendly Home — caught as HC (Non-medical) but actual category may be AL. Order-dependent regex: HC regex matches first.

## MD review file format

Compact one-line-per-row:

```markdown
- [x] `provider_id` **Provider Name** · City, State — LLM reason text (single line)
```

NO map links, NO website links inline (clutters the file, makes Markdown editors choke on large files). Sections grouped by transition (`From → To` for reclass) or by current category (for deletions).

Default-checked rows = approve. Default-unchecked = decline. TJ unchecks anything wrong.

File size goal: <1 MB so Markdown editors (Craft, Obsidian, etc.) import cleanly. Past runs hit 1.3 MB with map+site links and had import problems — compact format hits ~500 KB.

## Cost expectations (refine as we get more data)

Sweep #1 actuals (2026-04-26):
- Phase 1 (Tier 1 deletes + reclass): $0
- Phase 2 (calibration 500 providers): ~$3
- Phase 3 (LLM verify-and-reclass on 73K active): ~$160 (102 minutes at 10 concurrent)
- **Total: ~$170**

Per-provider cost: ~$0.002. Use this to estimate future sweep cost: `active_provider_count × $0.0025` (with 25% pad for retries).

## Backup CSVs

Every executed change saves a backup CSV BEFORE the writes:

- `tier1-deleted-<DATE>.csv` (provider_id, name, current_category, bucket)
- `phase1-reclassified-<DATE>.csv` (provider_id, old_category, new_category, reason)
- `phase3-reclassified-<DATE>.csv` (provider_id, old_category, new_category)
- `phase3-deleted-<DATE>.csv` (provider_id, name, current_category, reason)

Recovery: `update set deleted=false` or `update set provider_category=<old>` by `provider_id` against the backup.

## Phase 7 reflection template

```markdown
# Sweep Reflection — <DATE>

## What worked

- ...

## New patterns surfaced

- [ ] (description) → propose adding to Tier 1 regex bucket `<id>` or as a new bucket
- ...

## Contradiction detector misses

- (vocabulary the LLM used that the regex didn't catch) → propose adding to `CAT_TOKENS` for `<category>`
- ...

## False positives (TJ rejected)

- (pattern that was too aggressive) → propose narrowing the regex or moving to default-unchecked
- ...

## Cost vs estimate

- Estimated: $X
- Actual: $Y
- Variance: ±N%
- Action: (recalibrate the per-provider rate? loosen the budget?)

## Surprises in the data

- ...

## Proposed updates

- [ ] `docs/provider-category-definitions.md` — (changes)
- [ ] `docs/data-sweep-runbook.md` — (changes)
- [ ] `.claude/commands/data-sweep.md` — (changes)
```

## Change log

- **v3 — 2026-06-03 (sweep #2).** Added: (1) **DB-wide signal scan** `scripts/scan-out-of-scope-signals.js` as the mandatory first step — catches name-innocent out-of-scope (sober-living, tattoo/event studios) via website domain + reviews. (2) **Two-pass verification** (batched triage → individual website-forced re-verify) — mandatory before any deletion; batched alone produced 51% INSUFFICIENT + 73 false-OUT. (3) **`addiction-behavioral` + `tattoo-bodyart` Tier-1 buckets** (default-checked). (4) Switched go-forward mode to signal-scan + incremental (full-DB only on demand) and documented the `created_at` migration caveat. Pipeline hardening landed in the same PR: `OUT_OF_SCOPE_TYPES` anti-rescue clause (addiction/hospice/adult-day OUT even when they advertise skilled nursing/rehab) + addiction tokens in `KEYWORD_BLOCKLIST`. Results: 281 deleted, 51 reclassified (368 more reclass + 31 flipped-out pending TJ review), 0 corrupt categories remaining, ~$16.
- **v2.2 — 2026-04-27.** Definitional-context exclusion (TJ caught wrong-transition in review: `JeYr0C2` Joyful Home Health Care). LLM reasons sometimes contain DEFINITIONAL sentences that reference categories without claiming the provider belongs to them, e.g., "Non-medical home care (Category 1) explicitly requires caregivers who are NOT licensed clinicians". Now skip matches followed by `(Category N)`, `is defined as`, `specifically requires/excludes/includes`, or `requires caregivers/providers who...`. Also added `indicate(s) <Cat>` to META_REFS so positive claims like "Name and URL indicate 'Home Health Care' business model" are caught. Net: same totals (245/2569) but Joyful correctly moved from AL→HC(Non-medical) to AL→HHC.
- **v2.1 — 2026-04-27.** Clause-level negation (TJ caught FP in review: `menasha-wi-0014` ThedaCare Physicians). Long-list-of-negations like "is X, not Y, Z, W, or V" was tripping the regex on Y..V even though semantically negated. Window-based check (40-60 chars) couldn't reach the "not" in long lists. Replaced fixed window with clause scan back to last period/semicolon. Pulled 9 FPs back to deletions. Final sweep #1 v2.1 totals: 245 reclass (+46), 122 silent-drop (+1), 2,569 deletions (-47).
- **v2 — 2026-04-27.** Widened amnesia detection: added META_REFS for category-by-name signals ("should be reclassified as", "falls under", "matches the X", "category N (X — ...", "primary business is X"). Service vocab widened: "personal care assistance", "non-medical in-home (assistance|support|...)", "residential care facility" (no "for the elderly" required), "certify family home" (Idaho AL), "skilled (nursing|clinical) (home (visit|care)|in-home)". Negation guard widened with "without (services|qualif|...)" and "fails to" / "does not" / "would not". Bare "qualify" infinitive removed (too often inverted in LLM phrasing). Re-applied to sweep #1 verdicts: +55 reclass recoveries, -56 deletions. Regen script at `~/Desktop/olera-web/regen-amnesia-mds.js`.
- **v1 — 2026-04-26** (inaugural). Initial draft after sweep #1. Captures: 6-category definitions, Tier 1 regex patterns, inverted Phase 3 prompt, contradiction detection logic, MD format, cost expectations.
