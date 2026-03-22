# Senior Benefits Finder — Accuracy Audit & Recommendation Quality Review

**Date:** 2026-03-13
**Priority:** P1 🔥
**Owner:** TJ
**Status:** Audit Complete — Implementation Pending

---

## Executive Summary

The SBF has excellent UX/UI but its recommendation engine has **five systemic weaknesses** that together explain the inaccurate results observed nationwide. The College Station → Alamo AAA bug is a symptom of the deepest problem: **the system has no real geographic intelligence below the state level.**

---

## FINDING 1: County Is Never Populated — AAA Falls Back to Alphabetical

**Severity: Critical** | **Root cause of the College Station bug**

The intake answers interface has a `county` field (`lib/types/benefits.ts:179`), but it's initialized as `null` and **never populated anywhere**. The form collects ZIP code and city, but no code ever resolves ZIP → county.

In `app/api/benefits/match/route.ts:121-159`, the AAA matching chain is:
1. ZIP exact match against `zip_codes_served[]` — fails if the AAA table doesn't have this ZIP listed
2. County match against `counties_served[]` — **always fails because county is always null**
3. Fallback: **first agency alphabetically** → "Alamo Area Agency on Aging" wins in Texas every time

This means for every Texas user, unless their exact ZIP is in an AAA's `zip_codes_served` array, they get the Alamo AAA (San Antonio). Same pattern nationwide — users get the wrong AAA in every state where their ZIP isn't explicitly listed.

---

## FINDING 2: Two Disconnected Data Systems

**Severity: Critical** | **The 528-program database isn't used for recommendations**

There are two completely separate benefits databases:

| | Supabase (`sbf_*` tables) | Waiver Library (`data/waiver-library.ts`) |
|---|---|---|
| **Used by** | Recommendation engine (`/api/benefits/match`) | Waiver Library pages (`/benefits/[state]`) |
| **Source** | iOS app seed data | Chantel's Notion research (528 programs) |
| **Programs** | Unknown count (no migrations in repo) | 528 across all 50 states |
| **Structure** | Structured: category, min_age, max_income, requires_medicaid, priority_score | Semi-structured: freetext eligibilityHighlights, savingsRange strings |
| **Geography** | state_code only | state_code only |
| **Contact info** | phone, website, application_url, what_to_say | Forms with URLs |

Chantel's 528-program database is **never queried by the matching engine**. Users who go through the SBF intake get matched against the smaller Supabase dataset. Users who browse the Waiver Library see the richer dataset. They don't cross-reference.

---

## FINDING 3: No Sub-State Geographic Intelligence

**Severity: High** | **Programs shown regardless of local relevance**

State programs are queried with just `.eq("state_code", stateCode)` (`route.ts:114`). Every state-level program is returned for every user in that state, regardless of whether the program operates in their area.

Real-world examples of what this causes:
- Texas PACE programs (available only in select cities like El Paso, Lubbock, Amarillo) shown to users in Houston
- Area-specific HCBS waivers shown statewide
- Local meal delivery programs shown to users hundreds of miles away

The `WaiverProgram` interface has no geographic sub-state fields. The `BenefitProgram` interface has only `state_code`. Neither system knows about counties, regions, or service areas at the program level.

---

## FINDING 4: Care Preference Is Collected But Never Used

**Severity: Medium** | **Missed relevance signal**

Users select "Stay at home", "Exploring facilities", or "Not sure yet" on Step 2, but `carePreference` is **never referenced** in the scoring function `evaluateEligibility()` (`route.ts:31-91`).

This means:
- A user who wants to stay home gets the same HCBS waiver programs AND facility-based programs
- A user exploring facilities gets the same home care programs AND facility programs
- The system misses the easiest relevance filter: home-based vs. facility-based programs

---

## FINDING 5: Needs-to-Categories Mapping Has Blind Spots

**Severity: Medium** | **Major categories unreachable**

The `needsToCategories()` mapping (`benefits.ts:337-354`) converts 7 user needs into 6 benefit categories:

```
personalCare    → [healthcare]
householdTasks  → [caregiver]
healthManagement→ [healthcare]
companionship   → [caregiver]
financialHelp   → [income]
memoryCare      → [healthcare]
mobilityHelp    → [healthcare]
```

**Three categories are unreachable through any user selection:**
- **housing** — never mapped. Users needing home modifications or subsidized housing have no path to these programs.
- **food** — never mapped. SNAP and Meals on Wheels get no category boost.
- **utilities** — never mapped. LIHEAP gets no category boost.

These programs can still appear (they aren't filtered out), but they never get the +25 category match bonus, so they rank lower than they should for users who clearly need them.

---

## FINDING 6: Scoring Doesn't Differentiate Quality of Match

**Severity: Medium** | **Score compression makes tier labels unreliable**

The scoring model (`route.ts:31-91`) is additive:
- Base `priority_score` (0-100 from DB)
- +10 age, +15 income, +10 medicaid, +5 medicare, +25 category
- Capped at 100

Problems:
- A program with `priority_score: 60` that matches on age (+10) and category (+25) scores 95 = "Top Match" — even if it's geographically irrelevant
- No negative signals: no way to penalize a poor geographic match
- No geographic component at all in the score
- The "Worth Exploring" tier (<60) is effectively programs that only matched on their base priority score

---

## FINDING 7: Deduplication Is Fragile

**Severity: Low** | **Name-based dedup can cause false positives/negatives**

Programs are deduped by `program.name.toLowerCase().trim()` (`route.ts:173`). If a federal program "Medicaid" and a state program "Texas Medicaid for the Elderly and People with Disabilities" exist, both survive (different names). But slight naming variations of the same program may incorrectly merge or fail to merge.

---

## What Chantel's Database Can Fix

Chantel's 528-program waiver library is the clear path forward. But it needs structural enrichment before it can power the recommendation engine:

**What it has today:**
- 528 programs across all 50 states (vs. unknown count in Supabase)
- Rich descriptions, eligibility highlights, application steps, form URLs
- State-level income thresholds in freetext (e.g., "Income below $987/month")

**What it's missing for matching:**
- Structured `category` field (healthcare/income/housing/food/utilities/caregiver)
- Structured `min_age`, `max_income_single` fields (currently buried in freetext)
- `requires_medicaid`, `requires_medicare`, `requires_veteran`, `requires_disability` booleans
- Sub-state geography: which counties/regions/cities does this program actually serve?
- `care_setting` field: home-based vs. facility-based vs. both
- `priority_score` for base ranking

---

## Recommended Path Forward

### Phase 1: Fix the Critical Bugs (1-2 sessions)
1. **Add ZIP → county resolution** — use the existing `zip-index.json` to populate `answers.county` from the ZIP code. This immediately fixes AAA matching.
2. **Enrich AAA data** — audit `sbf_area_agencies` table to ensure `counties_served` and `zip_codes_served` are populated for all agencies.
3. **Use `carePreference` in scoring** — add a `care_setting` field to programs and boost/penalize based on match.

### Phase 2: Unify the Data (2-3 sessions)
4. **Parse Chantel's 528 programs into structured format** — extract `min_age`, `max_income`, `category`, `requires_medicaid` from freetext `eligibilityHighlights`.
5. **Migrate enriched waiver library into Supabase** — replace or supplement the existing `sbf_state_programs` table with the 528-program dataset.
6. **Fix needs-to-categories mapping** — `financialHelp` should map to `[income, food, housing, utilities]`, etc.

### Phase 3: Improve Matching Quality (2-3 sessions)
7. **Add sub-state geographic data** — for local programs (PACE, Meals on Wheels, legal services), tag with counties/cities served.
8. **Rework scoring model** — introduce weighted scoring with geographic proximity as a multiplier, not just additive.
9. **Add confidence/validation layer** — verify service area compatibility before showing a recommendation.

### Phase 4: Ongoing Quality (continuous)
10. **Build a test harness** — 10-20 test personas across different states/cities/needs profiles.
11. **Admin review tool** — surface raw data (programs considered, scores, reasons) for diagnosing bad recommendations.

---

## The College Station Test Case, Explained

ZIP 77840 (College Station, TX):
1. `zipToState("77840")` → prefix 778 → 750-799 range → `"TX"` ✅
2. Fetch all active Texas state programs → every TX program returned (no sub-state filter)
3. `findLocalAAA("TX", "77840", null)`:
   - ZIP match: likely fails (77840 probably not in any AAA's `zip_codes_served`)
   - County match: **always fails** (county is always null)
   - Fallback: first TX agency alphabetically → **"Alamo Area Agency on Aging"** (San Antonio)
4. Programs scored without any geographic consideration

The correct AAA for College Station (Brazos County) would be the **Brazos Valley Area Agency on Aging**.

---

## Key Files Referenced

| File | Role |
|------|------|
| `app/api/benefits/match/route.ts` | Core matching API — scoring, deduplication, AAA lookup |
| `lib/types/benefits.ts` | Types, enums, savings estimates, needs-to-categories mapping |
| `lib/benefits/zip-lookup.ts` | ZIP prefix → state code (no county resolution) |
| `data/waiver-library.ts` | Chantel's 528 programs (disconnected from matching engine) |
| `components/benefits/BenefitsIntakeForm.tsx` | 6-step intake form |
| `components/benefits/BenefitsResults.tsx` | Results display |
| `hooks/use-benefits-state.ts` | State management |
| `lib/benefits/care-profile-context.tsx` | React context provider |
