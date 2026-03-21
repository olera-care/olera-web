# Plan: SBF Phase 1 — Fix 4 Critical Matching Bugs

Created: 2026-03-20
Status: Not Started

## Goal

Fix the 4 critical SBF accuracy bugs so that recommendations are geographically correct, preference-aware, and don't show veteran programs to non-veterans.

## Success Criteria

- [ ] ZIP code resolves to correct county, and AAA matches by county (not alphabetical fallback)
- [ ] College Station, TX (ZIP 77840) → Brazos Valley AAA, not Alamo AAA
- [ ] `carePreference` boosts/penalizes programs in scoring
- [ ] Veteran status asked in intake; veteran programs filtered for non-veterans
- [ ] Existing SBF flow unchanged for non-affected paths

## Tasks

### Phase A: ZIP→County Lookup Data

- [ ] 1. Generate `public/data/zip-county.json` — a ZIP prefix (3-digit) → county mapping
      - Source: HUD USPS ZIP-County crosswalk or Census ZCTA data (free, public domain)
      - Format: `{ "778": "Brazos", "770": "Harris", ... }` (most common county per prefix)
      - For prefixes spanning multiple counties, use most-populated county
      - ~900 entries, small file (~20KB)
      - Files: `public/data/zip-county.json` (new)
      - Verify: `zip-county.json` has entry for "778" → "Brazos"

### Phase B: Wire County Resolution

- [ ] 2. Add `zipToCounty()` function to `lib/benefits/zip-lookup.ts`
      - Loads `zip-county.json` (cached in-memory on first call)
      - Takes 5-digit ZIP → returns county name or null
      - Files: `lib/benefits/zip-lookup.ts`
      - Verify: `zipToCounty("77840")` → `"Brazos"`

- [ ] 3. Populate `answers.county` in the matching API before AAA lookup
      - In `POST /api/benefits/match`, call `zipToCounty(answers.zipCode)` and set `answers.county`
      - AAA matching chain already checks county (line 147-155) — just needs non-null county
      - Files: `app/api/benefits/match/route.ts`
      - Verify: API request with ZIP 77840 returns Brazos Valley AAA, not Alamo

### Phase C: Veteran Status in Intake

- [ ] 4. Add veteran status question to the intake form (new Step 6, Medicaid becomes Step 5→stays, veteran is new Step 6)
      - Add `VeteranStatus` type: `"yes" | "no" | "preferNotToSay"`
      - Add `veteranStatus` field to `BenefitsIntakeAnswers`
      - Add `VETERAN_STATUSES` config constant
      - Update `INTAKE_STEPS`, `TOTAL_INTAKE_STEPS` (6→7)
      - Files: `lib/types/benefits.ts`
      - Verify: Types compile, new step constant exists

- [ ] 5. Add veteran question UI to `BenefitsIntakeForm.tsx`
      - New step after Medicaid: "Is the person who needs care a veteran?"
      - Three options: Yes, No, Prefer not to say
      - Wire into guided voice mode prompts + confirmations
      - Files: `components/benefits/BenefitsIntakeForm.tsx`, `components/benefits/GuidedVoicePrompt.tsx`
      - Verify: Form shows 7 steps, veteran question renders correctly

- [ ] 6. Filter veteran programs in scoring
      - In `evaluateEligibility()`: if `program.requires_veteran === true` and `answers.veteranStatus !== "yes"`, return `null` (hard disqualify)
      - If `answers.veteranStatus === "yes"` and program requires veteran: `+20` bonus
      - Files: `app/api/benefits/match/route.ts`
      - Verify: Non-veteran doesn't see "Aid & Attendance" or "Veterans Directed Care"

### Phase D: Care Preference Scoring

- [ ] 7. Wire `carePreference` into scoring function
      - Programs need a `care_setting` signal. Since we can't add DB columns easily, use program name/category heuristics:
        - Programs with "Home" / "HCBS" / "home-based" in name → `home`
        - Programs with "facility" / "nursing" / "assisted living" in name → `facility`
        - Everything else → `any`
      - Scoring logic:
        - `carePreference === "stayHome"` + program is `home` → `+10`
        - `carePreference === "stayHome"` + program is `facility` → `-10`
        - `carePreference === "exploringFacility"` + program is `facility` → `+10`
        - `carePreference === "exploringFacility"` + program is `home` → no penalty (home programs are still useful)
        - `carePreference === "unsure"` → no change
      - Files: `app/api/benefits/match/route.ts`
      - Verify: "Stay at home" user sees home-based programs ranked higher than facility programs

## Implementation Order

Task 1 (data) → Task 2 (zipToCounty) → Task 3 (wire county) → Task 4 (types) → Task 5 (UI) → Task 6 (veteran scoring) → Task 7 (care preference)

County fix first (biggest impact), then veteran filtering (user-facing UX issue), then care preference (scoring refinement).

## Risks

- **ZIP→county mapping imprecision**: ZIP codes can span multiple counties. Using most-common county per 3-digit prefix is ~90% accurate. Acceptable for AAA matching (better than alphabetical fallback). Can upgrade to full 5-digit mapping later.
- **New intake step increases friction**: Adding veteran question makes the form 7 steps instead of 6. Mitigated by keeping it simple (3 choices) and placing it last.
- **Voice mode breakage**: Adding a new step requires updating guided voice prompts. Must test voice flow.
- **Care preference heuristic**: Name-based detection of home vs facility programs is fragile. Good enough for v1; can add `care_setting` column to DB later.
- **Profile sync**: `lib/benefits-profile-sync.ts` may need to sync veteran status to profile. Low risk — can add later.

## Notes

- The `zip-index.json` file does NOT contain county data (only city/state pairs). We need a separate data source.
- AAA matching code already supports county matching (lines 147-155 in route.ts) — it just receives null.
- `requires_veteran` field already exists on `BenefitProgram` — just never checked.
- Audit doc: `docs/sbf-accuracy-audit.md` (findings 1, 4)
