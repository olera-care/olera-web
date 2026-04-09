# Wisconsin Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 35s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 5 |
| New (not in our data) | 1 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `asset_limits` | 3 | Our model has no asset limit fields |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |

## Program Types

- **financial**: 2 programs
- **service**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### SeniorCare

- **income_limit**: Ours says `$2825` → Source says `$25,536` ([source](https://www.dhs.wisconsin.gov/seniorcare/index.htm))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Prescription drug and vaccine coverage. Level 1: No deductible, $5 copay for generic drugs, $15 copay for brand-name drugs. Level 2A: $500 deductible per person, then $5/$15 copays. Level 2B: $850 deductible per person, then $5/$15 copays. Level 3: Spenddown equal to income exceeding 240% FPL, then coverage at SeniorCare rates.[7]` ([source](https://www.dhs.wisconsin.gov/seniorcare/index.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/seniorcare/index.htm`

### Family Care

- **income_limit**: Ours says `$2901` → Source says `$2,000` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community Based Services (HCBS) via managed care organizations (CMOs), including assistance with ADLs/IADLs, long-term care to avoid nursing homes; specific services per Wisconsin Administrative Code DHS 10.41 (e.g., personal care, adult day care, respite, home modifications); no fixed dollar/hour limits—tailored to assessed needs` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/familycare/apply.htm`

### IRIS (Include, Respect, I Self-Direct)

- **min_age**: Ours says `65` → Source says `18` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **income_limit**: Ours says `$2901` → Source says `$3,525` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Self-directed long-term care services via personalized IRIS budget (covers supports like personal care, goods/services to meet long-term care needs; participant is employer, uses Fiscal Employment Agent (FEA) for payroll/taxes; specific services listed by DHS, no fixed dollar/hour amounts—budget based on assessed needs)[3][6][7].` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/iris/index.htm`

### Wisconsin Home Energy Assistance Program (WHEAP)

- **income_limit**: Ours says `$2620` → Source says `$3,389` ([source](https://energybenefit.wi.gov/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment during heating season (Oct 1-May 15) covering portion of heating costs, non-heating electric costs, or energy crisis. Amount varies by household size, income, and energy costs; not full coverage. Additional: HE+ HVAC repairs/replacements for inoperable systems, HE+ Water Conservation for leaky fixtures/water heaters/toilets/piping (year-round), Weatherization referral for energy efficiency upgrades at no cost.[1][6]` ([source](https://energybenefit.wi.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://energybenefit.wi.gov/`

## New Programs (Not in Our Data)

- **Wisconsin Senior Employment Program (WISE)** — employment ([source](https://dwd.wisconsin.gov/ (Department of Workforce Development; specific WISE details via detwise@dwd.wisconsin.gov) or https://www.dhs.wisconsin.gov/publications/p00409-2024-2027.pdf (2024-2027 State Plan)[3][5]))
  - Shape notes: Federally funded under Older Americans Act Title V (SCSEP); administered statewide via local workforce boards and subgrantees with varying contacts; priority tiers affect access; income tied to annual federal poverty levels (no fixed table in sources); no asset test

## Program Details

### SeniorCare


**Eligibility:**
- Age: 65+
- Income: SeniorCare uses federal poverty level (FPL) thresholds with four coverage levels. For 2026: Level 1 (160% FPL or below): Individual $25,536/year, Couple $34,624/year. Level 2A (above 160% to 200% FPL): Individual $25,537–$31,920/year, Couple $34,625–$43,280/year. Level 2B (above 200% to 240% FPL): Individual $31,921–$38,304/year, Couple $43,281–$51,936/year. Level 3 (above 240% FPL): Income-based spenddown required. Income is calculated annually and determines coverage level and out-of-pocket costs.[7] For married couples living together, household income includes both spouses' income.[3]
- Wisconsin resident[4]
- U.S. citizen or qualifying immigrant[4]
- Cannot be a member of a full-benefit Medicaid program like BadgerCare Plus (with limited exceptions: Qualified Medicare Beneficiaries, Qualifying Individuals QI-1 or QI-2, SLMB, members receiving Tuberculosis-Related Medicaid services, or members with an unmet Medicaid deductible)[3][4]
- Must provide Social Security number on application[6]

**Benefits:** Prescription drug and vaccine coverage. Level 1: No deductible, $5 copay for generic drugs, $15 copay for brand-name drugs. Level 2A: $500 deductible per person, then $5/$15 copays. Level 2B: $850 deductible per person, then $5/$15 copays. Level 3: Spenddown equal to income exceeding 240% FPL, then coverage at SeniorCare rates.[7]
- Varies by: priority_tier

**How to apply:**
- Phone: SeniorCare Customer Service hotline at 800-657-2038[5][6]
- Online: Print application at www.dhs.wisconsin.gov/seniorcare[5][6]
- Mail: Submit completed application to SeniorCare (specific mailing address not provided in search results)

**Timeline:** 4–6 weeks from application submission[8]

**Watch out for:**
- You cannot enroll if you are a full-benefit Medicaid member (BadgerCare Plus), though narrow exceptions exist for QMBs, QIs, SLMB, TB-related Medicaid, and unmet deductibles[3][4]
- Annual renewal required to maintain coverage[4]
- $30 annual enrollment fee per person[5][6]
- Coverage begins the month *after* application, not the month of application[4][5]
- Earliest application is during the calendar month you turn 65; you can apply any time after that[5][6]
- Income limits are based on federal poverty level and change annually[7]
- For married couples, both spouses' income counts toward eligibility and coverage level determination[3]
- SeniorCare coordinates with other insurance (Medicare Part B/D) but does not replace it[4]

**Data shape:** SeniorCare is a prescription drug assistance program (not long-term care or medical services). Benefits scale by income tier using federal poverty level thresholds. No asset limits are mentioned. The program is statewide with centralized enrollment. Income thresholds are indexed to FPL and updated annually, making 2026 limits specific to that year. Household composition (single vs. couple) affects income thresholds but not eligibility otherwise.

**Our model can't capture:**
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/seniorcare/index.htm

---

### Family Care


**Eligibility:**
- Age: 65+
- Income: Must meet Medicaid financial eligibility (income and asset limits); specific 2025 asset limit for single applicants is typically under $2,000 (exemptions apply for primary residence, personal vehicle); exact income thresholds follow standard Medicaid guidelines and vary by household size—use Medicaid eligibility test for precise calculation[2][3]
- Assets: Medicaid asset limits apply (e.g., single: <$2,000 as of 2025); countable assets include most savings/checking, investments; exempt: primary home, one vehicle, personal belongings, burial funds[2]
- Adult (18+) with physical, intellectual, or developmental disability, or age 65+
- Wisconsin resident in a participating county/region
- Financially eligible for Medicaid
- Functionally eligible via Wisconsin Adult Long-Term Care Functional Screen (requires Nursing Facility Level of Care, assessing ADLs like bathing/eating/mobility and IADLs like meal prep/money management)

**Benefits:** Home and Community Based Services (HCBS) via managed care organizations (CMOs), including assistance with ADLs/IADLs, long-term care to avoid nursing homes; specific services per Wisconsin Administrative Code DHS 10.41 (e.g., personal care, adult day care, respite, home modifications); no fixed dollar/hour limits—tailored to assessed needs
- Varies by: region

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Tribal ADRS for screening and assistance (find via ADRC locator)
- Complete Long Term Care Functional Screen with ADRC
- Apply for Medicaid online or paper form submitted to income maintenance agency (ADRC can help)
- Choose CMO after eligibility confirmation

**Timeline:** Not specified; involves sequential steps (screening, Medicaid app, enrollment)
**Waitlist:** No waitlists for program participation[3]

**Watch out for:**
- Not statewide—must confirm county availability; ineligible if outside service area
- Requires both functional (NFLOC via screen) AND Medicaid financial eligibility; apply only if likely to qualify to avoid denial
- Family Care Partnership is a variant for those dually eligible for Medicare/Medicaid, with different regions
- Ongoing eligibility requires remaining in service area and re-meeting criteria
- Services depend on chosen CMO and care plan—not automatic

**Data shape:** Regionally administered via multiple managed care organizations (CMOs) with county-specific availability; eligibility ties directly to Medicaid standards plus functional screen; no waitlists but not uniform statewide

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/familycare/apply.htm

---

### IRIS (Include, Respect, I Self-Direct)


**Eligibility:**
- Age: 18+
- Income: Must meet Medicaid financial eligibility, which includes income limits (specific dollar amounts vary and are tied to Medicaid standards; for context, minimum income allowance is $3,525/month and maximum $3,948/month effective 7/1/25–6/30/26 for spousal supplementation). No fixed table by household size provided in sources; full Medicaid income rules apply[1][2].
- Assets: Medicaid asset limits apply (standard Medicaid rules, e.g., home equity limit of $750,000 in 2025 if living in home or intent to return; exemptions for primary home if spouse or minor/disabled child lives there)[2].
- Wisconsin resident
- U.S. citizen or qualifying immigrant
- Meet Nursing Home (NH) or Intermediate Care Facility for Individuals with Intellectual/Developmental Disabilities (ICF-IID) level of care via Wisconsin Adult Long-term Care Functional Screen (LTC FS)
- Eligible for Medicaid (financial and non-financial criteria)
- Reside in program-eligible setting (e.g., own home, apartment, adult family home, residential care apartment complex; not skilled nursing facility or community-based residential facility)
- Need long-term care supports and services
- Cooperate with medical support, third-party liability, SSN, verification, and health insurance requirements[1][2][3][7]

**Benefits:** Self-directed long-term care services via personalized IRIS budget (covers supports like personal care, goods/services to meet long-term care needs; participant is employer, uses Fiscal Employment Agent (FEA) for payroll/taxes; specific services listed by DHS, no fixed dollar/hour amounts—budget based on assessed needs)[3][6][7].
- Varies by: priority_tier

**How to apply:**
- Start at local Aging and Disability Resource Center (ADRC): https://www.dhs.wisconsin.gov/adrc/consumer/index.htm (find by county)
- Tribal Aging and Disability Resource Specialist (ADRS): https://www.dhs.wisconsin.gov/adrc/consumer/tribes.htm
- Phone/website via DHS IRIS page: https://www.dhs.wisconsin.gov/iris/index.htm[6][7]

**Timeline:** Not specified in sources
**Waitlist:** Waitlists exist due to limited enrollment; varies by region and priority (e.g., higher priority for those in institutions or at risk)[1]

**Watch out for:**
- Must live in eligible community setting (not nursing home or certain facilities)—cannot enroll if currently institutionalized[1][3][7]
- Self-directed model requires participant (or representative) to manage budget, hire workers, and use FEA—high responsibility level[3][7]
- Enrollment capped with waitlists prioritized by need (e.g., institutional risk); not immediate access[1]
- Tied to Medicaid eligibility—any changes in income/assets can affect status[1][2]
- For 18-64 enrollees, services continue after 65, but initial target is elderly (65+) or disabled adults[2]

**Data shape:** Self-directed budget model varies by functional need/priority tier via LTC FS assessment; county-administered via ADRCs with regional providers (ICAs/FEAs); no fixed income table—uses Medicaid standards; waitlisted with regional variations

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/iris/index.htm

---

### Wisconsin Senior Employment Program (WISE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in static figures in sources; families must verify current federal poverty guidelines (e.g., via HHS.gov) and confirm ≤125% threshold with local provider[1][2][3][4][5].
- Assets: No asset limits mentioned in program sources[1][2][3][4][5].
- Legal resident of Wisconsin[1][3][4]
- Unemployed[1][2][3][4]
- Poor employment prospects (implied by program focus)[5]

**Benefits:** Part-time, paid training positions (typically 20 hours per week) at community service host agencies; paid at the highest of federal, state, or local minimum wage; includes skills training, work experience, individual job counseling, comprehensive assessment, and individualized employment plan to transition to unsubsidized jobs; additional benefits may include yearly physical exams and transportation assistance for some[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: (920) 229-5557 (Fox Valley Workforce Development Board)[1]
- Email: info@fvwdb.com[1]
- Email: detwise@dwd.wisconsin.gov (Department of Workforce Development)[3]
- Phone: (608) 243-5670 (Greater Wisconsin Agency on Aging Resources)[6]
- In-person or local providers via CWI Works state selector for Wisconsin[2]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by local provider capacity

**Watch out for:**
- Priority enrollment given to veterans, qualified spouses of veterans, and those over age 65—non-priority applicants may face delays or limited slots[2]
- Positions are temporary, part-time training (not permanent jobs or full-time); designed as bridge to unsubsidized employment[1][2][3]
- Must be actively unemployed and seeking work; not for current employees[1][2][4]
- Income test strictly at 125% FPL—over-income disqualifies, and families must use current annual poverty guidelines[1][2][5]
- Regional administration means contacting local provider essential; no centralized statewide application[1][2][3][4][6]

**Data shape:** Federally funded under Older Americans Act Title V (SCSEP); administered statewide via local workforce boards and subgrantees with varying contacts; priority tiers affect access; income tied to annual federal poverty levels (no fixed table in sources); no asset test

**Source:** https://dwd.wisconsin.gov/ (Department of Workforce Development; specific WISE details via detwise@dwd.wisconsin.gov) or https://www.dhs.wisconsin.gov/publications/p00409-2024-2027.pdf (2024-2027 State Plan)[3][5]

---

### Wisconsin Home Energy Assistance Program (WHEAP)


**Eligibility:**
- Income: Gross monthly household income must be below limits (varies by program year; recent examples: 1-person: $3,389.42 monthly ($40,673 annually), 2: $4,186.92 ($50,243), 3: $4,984.42 ($59,813), 4: $5,781.92 ($69,383), 5: $6,579.42 ($78,953), 6: $6,729 ($80,748), 7: $6,878.50 ($82,542), 8: varies. Uses previous month's income; self-employed/farmers use prior year tax forms. Older guidelines (2020-21) showed higher annuals like 1-person $66,658.[1][3]
- Assets: No asset limits mentioned in sources.
- U.S. citizenship or lawful immigration status.
- Social Security Number and date of birth for all household members.
- Evidence of heating/electric costs for last 12 months.
- Household responsible for primary heating costs (most fuel types eligible: wood, propane, natural gas, electricity, fuel oil).

**Benefits:** One-time payment during heating season (Oct 1-May 15) covering portion of heating costs, non-heating electric costs, or energy crisis. Amount varies by household size, income, and energy costs; not full coverage. Additional: HE+ HVAC repairs/replacements for inoperable systems, HE+ Water Conservation for leaky fixtures/water heaters/toilets/piping (year-round), Weatherization referral for energy efficiency upgrades at no cost.[1][6]
- Varies by: household_size|income|energy_costs|priority_tier

**How to apply:**
- Online: https://energybenefit.wi.gov/
- Phone: Statewide Customer Care Center 1-800-506-5596 or 1-866-HEATWIS (432-8947); local agencies e.g., Douglas County (715) 395-1651, Partners for Community Development (833) 646-0823.
- In-person/mail: Local WHEAP agency (e.g., Partners for Community Development, 1407 S. 13th Street, Sheboygan, WI 53081).

**Timeline:** Up to 10 business days for online review; incomplete apps denied after 30 days. May contact for more info.[6]
**Waitlist:** Not mentioned; high application volume noted.

**Watch out for:**
- One-time benefit per heating season only (Oct 1-May 15).
- Payment covers portion, not full costs.
- Must apply through local agency or online; incomplete apps denied after 30 days.
- For crisis/disconnection, call immediately.
- Income based on prior month (or prior year taxes for self-employed); provide 12-month energy history.
- Weatherization/HE+ services referred separately if eligible.
- Program year-specific income limits; check current via official site.

**Data shape:** Income limits provided as monthly/annual by household size with examples from different years; benefits as one-time variable payments plus referrals to weatherization/HVAC/water services; local agency administration statewide.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://energybenefit.wi.gov/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| SeniorCare | benefit | state | medium |
| Family Care | benefit | local | deep |
| IRIS (Include, Respect, I Self-Direct) | benefit | state | deep |
| Wisconsin Senior Employment Program (WIS | employment | state | deep |
| Wisconsin Home Energy Assistance Program | benefit | state | deep |

**Types:** {"benefit":4,"employment":1}
**Scopes:** {"state":4,"local":1}
**Complexity:** {"medium":1,"deep":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/WI/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **region**: 1 programs
- **household_size|income|energy_costs|priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **SeniorCare**: SeniorCare is a prescription drug assistance program (not long-term care or medical services). Benefits scale by income tier using federal poverty level thresholds. No asset limits are mentioned. The program is statewide with centralized enrollment. Income thresholds are indexed to FPL and updated annually, making 2026 limits specific to that year. Household composition (single vs. couple) affects income thresholds but not eligibility otherwise.
- **Family Care**: Regionally administered via multiple managed care organizations (CMOs) with county-specific availability; eligibility ties directly to Medicaid standards plus functional screen; no waitlists but not uniform statewide
- **IRIS (Include, Respect, I Self-Direct)**: Self-directed budget model varies by functional need/priority tier via LTC FS assessment; county-administered via ADRCs with regional providers (ICAs/FEAs); no fixed income table—uses Medicaid standards; waitlisted with regional variations
- **Wisconsin Senior Employment Program (WISE)**: Federally funded under Older Americans Act Title V (SCSEP); administered statewide via local workforce boards and subgrantees with varying contacts; priority tiers affect access; income tied to annual federal poverty levels (no fixed table in sources); no asset test
- **Wisconsin Home Energy Assistance Program (WHEAP)**: Income limits provided as monthly/annual by household size with examples from different years; benefits as one-time variable payments plus referrals to weatherization/HVAC/water services; local agency administration statewide.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Wisconsin?
