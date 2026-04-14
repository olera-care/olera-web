# Kentucky Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.025 (5 calls, 56s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 3 |
| Programs deep-dived | 2 |
| New (not in our data) | 1 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Kentucky Family Caregiver Program (Grandparents Raising Grandchildren)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Wide range of services including matching with support groups, information about resources, assistance accessing services, counseling, and training. Eligible participants may receive a grant or voucher per grandchild per fiscal year for clothing, respite, school supplies, educational needs, required legal services, medical/dental services, and other approved expenses (specific dollar amounts not stated).[6][9]` ([source](https://chfs.ky.gov/agencies/dail/Pages/caregiversupport.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://chfs.ky.gov/agencies/dail/Pages/caregiversupport.aspx`

## New Programs (Not in Our Data)

- **Senior CommUnity Care of Kentucky (PACE)** — service ([source](https://chfs.ky.gov/agencies/dail/Pages/pace.aspx))
  - Shape notes: County-restricted to Jefferson and Northern KY counties only; two regional providers with separate contacts; no income/asset dollar limits specified; fees for non-dually eligible; nursing home level of care certification required

## Program Details

### Senior CommUnity Care of Kentucky (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits or dollar amounts listed; dually eligible (Medicare and Medicaid) receive 100% coverage, while Medicare-only participants pay a fee and private pay options exist with different structures[1][2][3][5]
- Assets: No asset limits or exemptions specified in available data[1][2][3][5]
- Certified by the state to need nursing home level of care (per 907 KAR 1:022)[2][3][5]
- Able to live safely in the community at time of enrollment with PACE services[1][2][3]
- Reside in a PACE service area (Jefferson County for Louisville site; Boone, Kenton, and Campbell Counties for Northern KY site)[1][2][5]

**Benefits:** Primary and specialty medical care, prescription medications, adult day services, home care services, mental health and social services, skilled therapies (physical, occupational), nursing home care, hospital care, transportation to/from PACE center and medical visits, meals, nutritional assessments, socialization at PACE centers; coordinated by interdisciplinary team; becomes sole source of Medicare/Medicaid services upon enrollment[1][2][3][5][6]
- Varies by: region

**How to apply:**
- Phone: Louisville (502) 676-7515 or (502) 676-7550; Northern KY (859) 970-2450; TTY 711 or 800-648-6056/6057[1][2][4][5]
- Email: kyenrollment@voa.org (Louisville); nk***********@*oa.org (Northern KY)[1][2][4]
- In-person: Louisville PACE Center at 960 S 4th St, Louisville KY 40203; Northern KY at 47 Cavalier Blvd., Suite 140, Florence, KY 41042[1][2][4]
- Visit PACE center to inquire about eligibility[2]

**Timeline:** Not specified in sources

**Watch out for:**
- Not statewide—only specific counties; confirm residence[1][2][5]
- Medicare-only or private pay participants face fees/restrictions, not 100% covered like dually eligible[3]
- All non-emergency care must go through PACE providers to be covered[3]
- Enrollment makes PACE the sole source of services—no duplication with other programs[5]
- Must be able to live safely in community at enrollment time, despite nursing home level needs[1][2][3]

**Data shape:** County-restricted to Jefferson and Northern KY counties only; two regional providers with separate contacts; no income/asset dollar limits specified; fees for non-dually eligible; nursing home level of care certification required

**Source:** https://chfs.ky.gov/agencies/dail/Pages/pace.aspx

---

### Kentucky Family Caregiver Program (Grandparents Raising Grandchildren)


**Eligibility:**
- Income: Household income at or below 150% of the federal poverty level (exact dollar amounts vary annually by federal guidelines and household size; not specified in sources for current year). Applies to financial assistance only; other services may have broader access.[1][4][6][7][9]
- Assets: No asset limits mentioned.
- Kentucky resident.
- Primary caregiver for a grandchild related by blood, marriage, or adoption.
- Grandchild is 18 years of age or younger.
- Grandchild lives in the caregiver's home, and neither parent resides in the household.
- Not receiving monthly Kinship Care payments.[1][4][6][9]

**Benefits:** Wide range of services including matching with support groups, information about resources, assistance accessing services, counseling, and training. Eligible participants may receive a grant or voucher per grandchild per fiscal year for clothing, respite, school supplies, educational needs, required legal services, medical/dental services, and other approved expenses (specific dollar amounts not stated).[6][9]

**How to apply:**
- Contact local Area Agency on Aging and Independent Living (AAA). Examples: Pennyrile Area Development District (peadd.org/kentucky-family-caregiver[1]), KIPDA (kipda.org[2]).
- Visit official page: prd.webapps.chfs.ky.gov/kyfaces/Kinship/KFCP[6].
- Contact Cabinet for Health and Family Services, Department for Aging and Independent Living (chfs.ky.gov/agencies/dail/Pages/caregiversupport.aspx[9]). No specific phone, form name, or mail/in-person details in sources.

**Timeline:** Not specified in sources.

**Watch out for:**
- Cannot receive benefits if already getting Kinship Care payments ('double dip' rule); evaluate which program is better.[1][4][6]
- Parents cannot reside in the household, even if not primary caregivers.[1][6][9]
- Income limit (150% FPL) applies strictly to financial assistance; services like support groups may be more accessible.[1][4][6]
- Adopted grandparents may still qualify under certain conditions.[7]

**Data shape:** Administered statewide via local Area Agencies on Aging; financial aid requires 150% FPL income test and no Kinship Care overlap; benefits include non-cash services plus discretionary grants/vouchers per fiscal year.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://chfs.ky.gov/agencies/dail/Pages/caregiversupport.aspx

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Senior CommUnity Care of Kentucky (PACE) | benefit | local | deep |
| Kentucky Family Caregiver Program (Grand | benefit | state | deep |

**Types:** {"benefit":2}
**Scopes:** {"local":1,"state":1}
**Complexity:** {"deep":2}

## Content Drafts

Generated 2 page drafts. Review in admin dashboard or `data/pipeline/KY/drafts.json`.

- **Senior CommUnity Care of Kentucky (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Kentucky Family Caregiver Program (Grandparents Raising Grandchildren)** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **region**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Senior CommUnity Care of Kentucky (PACE)**: County-restricted to Jefferson and Northern KY counties only; two regional providers with separate contacts; no income/asset dollar limits specified; fees for non-dually eligible; nursing home level of care certification required
- **Kentucky Family Caregiver Program (Grandparents Raising Grandchildren)**: Administered statewide via local Area Agencies on Aging; financial aid requires 150% FPL income test and no Kinship Care overlap; benefits include non-cash services plus discretionary grants/vouchers per fiscal year.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Kentucky?
