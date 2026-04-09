# North Dakota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.030 (6 calls, 46s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 4 |
| Programs deep-dived | 4 |
| New (not in our data) | 4 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 2 programs
- **in_kind**: 1 programs
- **financial**: 1 programs

## New Programs (Not in Our Data)

- **North Dakota Aging in Community (AIC) Project** — service ([source](https://www.ndsu.edu/agriculture/extension/programs/aging-community-program[7]))
  - Shape notes: Project-based initiative in only 2 rural communities developing local aging-in-place models; no individual income/asset tests, fixed benefits, or standard application; community-tailored via NDSU Extension partnerships
- **Senior Safety Program (ND Assistive)** — in_kind ([source](https://ndassistive.org/our-programs/[1]))
  - Shape notes: No income or asset tests; fixed free devices for home safety only; statewide with minimal eligibility barriers beyond age, residency, and not in nursing facility
- **Basic Care Assistance Program (BCAP)** — financial ([source](https://www.nd.gov/dhs/policymanuals/40029/))
  - Shape notes: Restricted to basic care facility residents; functional eligibility varies by level (A/B/C) with ADL/IADL criteria and NFLOC for B/C; administered locally via Human Service Zones
- **North Dakota State Health Insurance Assistance Program (ND SHIP)** — service ([source](https://www.insurance.nd.gov/consumers/medicare/ship-counselors))
  - Shape notes: no income/asset test for core counseling; volunteer-delivered statewide; assists with tiered savings programs (e.g., Extra Help has limits) but SHIP access is universal for Medicare beneficiaries

## Program Details

### North Dakota Aging in Community (AIC) Project

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits defined for AIC; general ND aging programs like SPED use limits varying by household size (exact amounts not specified in sources) and sliding scale based on countable income and family size[1][5].
- Assets: No specific asset limits for AIC; related SPED program has liquid assets under $50,000 (home value exempt)[5].
- North Dakota resident
- Older adults (likely 65+) wishing to age in rural homes/communities
- Reside in one of two targeted rural communities
- Commitment to community-focused solutions and engagement[2][4][7]

**Benefits:** Community-based models and interventions including personal finance, connection and growth, transportation, health and wellness, housing; tailored solutions via local partnerships, assessments, and stakeholder feedback to support aging in place[2][7]. No fixed dollar amounts or hours specified.
- Varies by: region

**How to apply:**
- Contact NDSU Extension (no specific phone/URL listed for applications; visit https://www.ndsu.edu/agriculture/extension/programs/aging-community-program for program details[7]
- Community engagement through local stakeholders in two rural communities[2]

**Timeline:** Not specified

**Watch out for:**
- Not a direct service entitlement program like SPED or Medicaid HCBS; it's a project developing community models, not individual applications for benefits[2][7]
- Limited to specific rural communities, not statewide[2]
- No clear individual eligibility/application process; emphasizes community partnerships over personal enrollment[7]
- People may confuse with SPED (which has payments/respite) or other HCBS programs[1][5]

**Data shape:** Project-based initiative in only 2 rural communities developing local aging-in-place models; no individual income/asset tests, fixed benefits, or standard application; community-tailored via NDSU Extension partnerships

**Source:** https://www.ndsu.edu/agriculture/extension/programs/aging-community-program[7]

---

### Senior Safety Program (ND Assistive)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits mentioned; program appears open to all qualifying applicants regardless of income.
- Assets: No asset limits mentioned; no information on what counts or exemptions.
- North Dakota resident
- Not living in a basic or skilled nursing facility

**Benefits:** Free assistive safety devices including: Alerting Devices for Hearing Loss, Anti-Elopement Devices, and other home safety devices with professional setup assistance to promote independence and safety at home[1][3][4].
- Varies by: fixed

**How to apply:**
- Online: https://ndassistive.org/senior-safety-program/asdds-application/[5]
- Download PDF form: https://ndassistive.org/wp-content/uploads/2025/03/2025-Senior-Safety-Application-Standard-Print.pdf[2] or https://ndassistive.org/wp-content/uploads/2024/03/2024-Senior-Safety-Large-Print-Application.pdf[4] (for mail or print)
- Email: seniorsafety@ndassistive.org[4]

**Timeline:** Not specified in available sources.

**Watch out for:**
- Must not be living in a basic or skilled nursing facility—program is for those remaining at home[3]
- Qualification beyond age and residency not fully detailed; contact program for specifics[6]
- Devices are specific to safety (e.g., alerting, anti-elopement); not general healthcare or broad assistive tech[4]

**Data shape:** No income or asset tests; fixed free devices for home safety only; statewide with minimal eligibility barriers beyond age, residency, and not in nursing facility

**Source:** https://ndassistive.org/our-programs/[1]

---

### Basic Care Assistance Program (BCAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18 or older and disabled or blind[2][3]+
- Income: Financial eligibility determined via Medicaid redetermination if already on Medicaid; specific dollar amounts or household size tables not detailed in sources[2][3]
- Assets: Not explicitly detailed; must provide financial eligibility information; home ownership often exempt under related ND Medicaid rules but program-specific asset details unavailable[1][2][3]
- North Dakota resident[2][3]
- Resident of a licensed Basic Care Facility[4]
- Meet functional assessment criteria per NDAC 75-02-10-10[2]
- Provide SSN, proof of age, identity, residence, disability, functional limitation, financial eligibility[2][3]
- Apply for and receive Medicare benefits if eligible[3]

**Benefits:** Payment for room and board costs in a licensed Basic Care Facility; personal care services assessment required[2][4]
- Varies by: functional_level

**How to apply:**
- Online or contact local Human Service Zone office (specific URL/phone not listed; use ND DHS site)[1][4]
- Paper: Application for Assistance SFN 405 (sections 1,3,4,6,8 for BCAP)[4]
- In-person or mail via county social worker/Human Service Zone[2]

**Timeline:** Not specified in sources

**Watch out for:**
- Only for residents of licensed Basic Care Facilities—not home care or independent living[4]
- Requires functional assessment and potential Nursing Facility Level of Care for higher tiers (Levels B/C)[1]
- Tied to Medicaid eligibility processes; must meet state residency and provide extensive verification[2][3]
- Not traditional Medicaid; for those in basic care facilities who may not qualify for full Medicaid[5][6]

**Data shape:** Restricted to basic care facility residents; functional eligibility varies by level (A/B/C) with ADL/IADL criteria and NFLOC for B/C; administered locally via Human Service Zones

**Source:** https://www.nd.gov/dhs/policymanuals/40029/

---

### North Dakota State Health Insurance Assistance Program (ND SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries (typically age 65+ or under 65 with disabilities), their families, and caregivers. Supports people with limited incomes but does not impose specific dollar thresholds for SHIP services themselves[4][5].
- Assets: No asset limits for SHIP counseling services[4][5].
- Medicare beneficiary (Parts A/B eligible), family member, or caregiver
- North Dakota resident (services statewide)
- US citizen or qualified noncitizen not required for counseling, but may apply for related programs like Extra Help[1][2][5]

**Benefits:** Free, personalized one-on-one counseling and education on Medicare options (Original Medicare Parts A/B, Medicare Advantage Part C, Part D prescription drugs, Medigap); assistance applying for savings programs (Medicare Savings Program, Extra Help/Low-Income Subsidy, Medicaid); help comparing plans, understanding eligibility/enrollment, coverage coordination, appeals of denied claims, managing bills; outreach via presentations, health fairs; no sales of insurance products[2][4][5][8].

**How to apply:**
- Phone: 1-888-575-6611
- TTY: 1-800-366-6888
- Website: North Dakota Insurance Department SHIP page (https://www.insurance.nd.gov/consumers/medicare/ship-counselors)
- In-person or local: Contact via phone for volunteer counselor appointment (approx. 45 volunteers statewide)[2][6]

**Timeline:** Immediate phone counseling available; in-person appointments scheduled based on counselor availability, no formal processing[5][6].

**Watch out for:**
- Not a financial aid or healthcare provider program—offers free counseling only, not direct payments or medical services; counselors have no conflicts of interest and do not sell plans[2][5]
- Confused with ND State Health Improvement Plan (different SHIP acronym for public health strategy)[7]
- Must be Medicare-related issue; for pure Medicaid, contact HHS separately[1]
- Volunteers may have scheduling limits in rural areas[2]

**Data shape:** no income/asset test for core counseling; volunteer-delivered statewide; assists with tiered savings programs (e.g., Extra Help has limits) but SHIP access is universal for Medicare beneficiaries

**Source:** https://www.insurance.nd.gov/consumers/medicare/ship-counselors

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| North Dakota Aging in Community (AIC) Pr | benefit | local | deep |
| Senior Safety Program (ND Assistive) | resource | state | simple |
| Basic Care Assistance Program (BCAP) | benefit | state | deep |
| North Dakota State Health Insurance Assi | navigator | federal | simple |

**Types:** {"benefit":2,"resource":1,"navigator":1}
**Scopes:** {"local":1,"state":2,"federal":1}
**Complexity:** {"deep":2,"simple":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/ND/drafts.json`.

- **North Dakota Aging in Community (AIC) Project** (benefit) — 1 content sections, 6 FAQs
- **Senior Safety Program (ND Assistive)** (resource) — 1 content sections, 6 FAQs
- **Basic Care Assistance Program (BCAP)** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **region**: 1 programs
- **fixed**: 1 programs
- **functional_level**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **North Dakota Aging in Community (AIC) Project**: Project-based initiative in only 2 rural communities developing local aging-in-place models; no individual income/asset tests, fixed benefits, or standard application; community-tailored via NDSU Extension partnerships
- **Senior Safety Program (ND Assistive)**: No income or asset tests; fixed free devices for home safety only; statewide with minimal eligibility barriers beyond age, residency, and not in nursing facility
- **Basic Care Assistance Program (BCAP)**: Restricted to basic care facility residents; functional eligibility varies by level (A/B/C) with ADL/IADL criteria and NFLOC for B/C; administered locally via Human Service Zones
- **North Dakota State Health Insurance Assistance Program (ND SHIP)**: no income/asset test for core counseling; volunteer-delivered statewide; assists with tiered savings programs (e.g., Extra Help has limits) but SHIP access is universal for Medicare beneficiaries

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in North Dakota?
