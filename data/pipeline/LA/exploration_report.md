# Louisiana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.025 (5 calls, 38s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 3 |
| Programs deep-dived | 3 |
| New (not in our data) | 3 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 3 programs

## New Programs (Not in Our Data)

- **Community Choices Waiver** — service ([source](https://ldh.la.gov/page/community-choices-waiver (inferred from LDH OAAS PDFs [5][6])))
  - Shape notes: Priority-tiered waitlist with 5+ groups; no 24/7 services; Medicaid/NFLOC dual gate; asset exemptions home-focused with 2026 equity cap; income via spend-down
- **Louisiana Long Term–Personal Care Services (LT-PCS) Program** — service ([source](https://ldh.la.gov/assets/docs/OAAS/publications/FactSheets/LTPCS-Fact-Sheet.pdf[5]))
  - Shape notes: Tied to Medicaid ABD enrollment with NFLOC via LOCET/interRAI tools; services per individualized plan based on ADL score; multiple eligibility pathways (nursing home transition, imminent need, elderly/disabled caregiver)
- **Program of All-Inclusive Care for the Elderly (PACE) - Louisiana** — service ([source](https://ldh.la.gov/assets/docs/OAAS/Manuals/PACE-Manual.pdf and https://ldh.la.gov/assets/docs/OAAS/publications/FactSheets/PACE-Fact-Sheet.pdf))
  - Shape notes: PACE in Louisiana is geographically restricted to four service areas with separate phone numbers for each region. Eligibility is binary (meet all requirements or ineligible) rather than tiered. Income and asset limits are fixed by household composition (single vs. married couple). Benefits are individualized by assessment rather than standardized. The program serves a specific population: average participant is 76 years old with multiple complex medical conditions[4]. Processing timelines and waitlist information are not publicly documented in available sources.

## Program Details

### Community Choices Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Income limits vary by source and year; recent figures include $2,742/month for an individual and $5,484/month for a couple (both needing long-term care) per [4]; older 2015 limits were $2,199 individual/$4,398 couple per [5]. Waiver spend-down option allows eligibility if over limits. No household size table beyond couples specified; must meet Medicaid long-term care income rules.[1][2][4][5]
- Assets: Single: $2,000 max resources. Couples (both in long-term care): $3,000. Couples (one spouse at home): up to $117,240. Exempt: primary home (equity ≤$752,000 in 2026 if intent to return, spouse/minor/disabled child lives there), one vehicle, household furnishings/appliances, personal effects. 60-month look-back rule penalizes asset transfers below fair market value.[2][3]
- Louisiana resident
- Meet Medicaid long-term care eligibility
- Nursing Facility Level of Care (NFLOC): assessed via ADLs (e.g., mobility, eating, toileting), medical conditions, cognitive issues; dementia diagnosis alone insufficient[1][2][3][5][6]
- At risk of nursing home placement; elderly (65+) or 21-64 if physically disabled (continues post-65 if enrolled early)[2]

**Benefits:** Specific services: Nursing Services, Home Delivered Meals, Caregiver Temporary Support (respite), Housing Stabilization, Housing Transition/Crisis Intervention. Promotes home-based health/well-being; no 24/7 care (alternative arrangements required). No fixed dollar amounts or hours specified; individualized based on need.[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Phone: Call Louisiana Options in Long-Term Care at 1-877-456-1146 to add name to Request for Services Registry[1][3][4][5]
- No online, mail, or in-person specifics listed; phone is primary route

**Timeline:** Not specified; offers based on priority and first-come-first-served after registry date
**Waitlist:** Yes; prioritized groups first (e.g., APS/EPS abuse/neglect referrals, ALS, permanent supportive housing, nursing facility >90 days, non-dual waiver recipients), then first-come-first-served. Expedited for some LT-PCS recipients. Apply immediately to join list[1][3][4][5]

**Watch out for:**
- No 24/7 care; must arrange separately[1][4]
- Priority waitlist means non-priority face delays; apply ASAP[1][3][4][5]
- 60-month look-back on asset transfers causes penalty periods[2]
- NFLOC requires specific ADL/medical deficits, not just age/diagnosis[2]
- Income/asset limits have spend-down but still strict; couples rules complex[2][3][4][5]

**Data shape:** Priority-tiered waitlist with 5+ groups; no 24/7 services; Medicaid/NFLOC dual gate; asset exemptions home-focused with 2026 equity cap; income via spend-down

**Source:** https://ldh.la.gov/page/community-choices-waiver (inferred from LDH OAAS PDFs [5][6])

---

### Louisiana Long Term–Personal Care Services (LT-PCS) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for elderly or 21+ for disabled[1][5]+
- Income: Must meet Louisiana Medicaid ABD financial eligibility (income and asset limits vary by marital status and program; for single Nursing Home Medicaid applicant in 2026: income limit not specified in sources, asset limit $2,000 in countable assets)[3]
- Assets: Countable assets limited to $2,000 for single applicant (includes bank accounts, retirement accounts, stocks, bonds, CDs, cash, and other easily convertible assets); home exempt if applicant lives there or intends to return with home equity ≤$752,000 in 2026, or if spouse/minor child (under 21)/blind or disabled child lives there[1][3]
- Louisiana resident
- Enrolled in Medicaid (ABD category)
- Require Nursing Facility Level of Care (NFLOC), determined by Level of Care Eligibility Tool (LOCET) assessing needs in Activities of Daily Living (ADLs) like transferring, mobility, eating, toileting, hygiene, bathing[1][2][3]
- Meet one of: reside in nursing home and able to relocate to community with assistance; anticipated to need nursing home within 120 days; main caregiver disabled or aged 70+[1]
- Able to direct own care or have representative (no support coordination provided)[1]

**Benefits:** Long-term personal care services and supports in own home or loved one's home to assist with daily living activities (ADLs) for those requiring Nursing Facility Level of Care; provided per approved service plan via uniform interRAI home care assessment determining resource allocation and ADL support needs[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Requests accepted from Medicaid participant, legally responsible individual, or designated representative[2]

**Timeline:** Not specified in sources

**Watch out for:**
- Must already receive Medicaid benefits (ABD); not a standalone program[1][3][5]
- No support coordination included—applicant must self-direct care or have representative[1]
- Home equity limit $752,000 in 2026 applies even if exempt[1]
- Specific NFLOC pathways required via LOCET (e.g., ADL assistance needs)[1][2][3]
- Requests only from participant, legal responsible party, or designated rep[2]

**Data shape:** Tied to Medicaid ABD enrollment with NFLOC via LOCET/interRAI tools; services per individualized plan based on ADL score; multiple eligibility pathways (nursing home transition, imminent need, elderly/disabled caregiver)

**Source:** https://ldh.la.gov/assets/docs/OAAS/publications/FactSheets/LTPCS-Fact-Sheet.pdf[5]

---

### Program of All-Inclusive Care for the Elderly (PACE) - Louisiana

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Single: $2,163/month; Married couples (both receiving services): $4,326/month[5]
- Assets: Single: less than $2,000; Married couples (both receiving services): less than $3,000. Primary home is excluded from asset calculation[5]
- Must live in a PACE provider service area[1][2]
- Must be certified by the State as needing nursing home level of care (NFLOC)[1][4]
- Must be able to live safely in the community with PACE services without jeopardizing health or safety[1][4]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan[4]
- Cannot be enrolled in hospice services or certain other programs[4]

**Benefits:** Comprehensive services determined by individualized assessment and plan of care. Services are provided according to level of need and may include medical care, social services, and long-term care services[2]
- Varies by: individual_need_assessment

**How to apply:**
- Phone: Baton Rouge – 225-490-0604[2]
- Phone: Greater New Orleans – 504-945-1531[2]
- Phone: Alexandria – 337-470-4500[2]
- Phone: Lafayette – 318-206-1020[2]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT statewide — availability is limited to four specific geographic areas. Families must first verify their zip code is in a service area before proceeding[2]
- Income and asset limits are strict and lower than many other programs. The $2,163/month income limit for singles is significantly below the federal poverty line for many states[5]
- Applicants must be certified by the State as needing nursing home level of care — this is not self-determined and requires formal assessment[1][4]
- Enrollment is voluntary but requires meeting ALL four core conditions simultaneously; failing any one disqualifies applicants[4][6]
- Medicare/Medicaid enrollment is not required for eligibility, but approximately 90% of participants are dually eligible, suggesting most applicants will need to coordinate with both programs[4]
- Private pay option exists for those not Medicaid-eligible, averaging $4,000–$5,000/month with no co-payments or deductibles, but this is a significant out-of-pocket cost[3]
- Applicants cannot be enrolled in certain other programs (Medicare Advantage, hospice, etc.) — existing coverage must be reviewed before applying[4]
- The program requires an individualized assessment to determine services — there is no standard benefit package, making it difficult to predict exact services without enrollment[2]

**Data shape:** PACE in Louisiana is geographically restricted to four service areas with separate phone numbers for each region. Eligibility is binary (meet all requirements or ineligible) rather than tiered. Income and asset limits are fixed by household composition (single vs. married couple). Benefits are individualized by assessment rather than standardized. The program serves a specific population: average participant is 76 years old with multiple complex medical conditions[4]. Processing timelines and waitlist information are not publicly documented in available sources.

**Source:** https://ldh.la.gov/assets/docs/OAAS/Manuals/PACE-Manual.pdf and https://ldh.la.gov/assets/docs/OAAS/publications/FactSheets/PACE-Fact-Sheet.pdf

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Community Choices Waiver | benefit | state | deep |
| Louisiana Long Term–Personal Care Servic | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |

**Types:** {"benefit":3}
**Scopes:** {"state":2,"local":1}
**Complexity:** {"deep":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/LA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **individual_need_assessment**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Community Choices Waiver**: Priority-tiered waitlist with 5+ groups; no 24/7 services; Medicaid/NFLOC dual gate; asset exemptions home-focused with 2026 equity cap; income via spend-down
- **Louisiana Long Term–Personal Care Services (LT-PCS) Program**: Tied to Medicaid ABD enrollment with NFLOC via LOCET/interRAI tools; services per individualized plan based on ADL score; multiple eligibility pathways (nursing home transition, imminent need, elderly/disabled caregiver)
- **Program of All-Inclusive Care for the Elderly (PACE) - Louisiana**: PACE in Louisiana is geographically restricted to four service areas with separate phone numbers for each region. Eligibility is binary (meet all requirements or ineligible) rather than tiered. Income and asset limits are fixed by household composition (single vs. married couple). Benefits are individualized by assessment rather than standardized. The program serves a specific population: average participant is 76 years old with multiple complex medical conditions[4]. Processing timelines and waitlist information are not publicly documented in available sources.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Louisiana?
