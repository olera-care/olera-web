# District of Columbia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 2.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 4 |
| New (not in our data) | 4 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 3 programs
- **in_kind**: 1 programs

## New Programs (Not in Our Data)

- **Elderly and Persons with Physical Disabilities (EPD) Waiver Program** — service ([source](https://dacl.dc.gov/service/epd-waiver[1]))
  - Shape notes: Income fixed at 300% SSI (individual, updates yearly); assets strictly $4,000 individual (no household variation specified); requires physician-signed POF + Liberty assessment for NFLOC; waitlisted; DC-only[1][2][4][5]
- **Safe at Home Program** — in_kind ([source](https://dacl.dc.gov/service/safe-home))
  - Shape notes: This program has two distinct income tiers: base eligibility at 80% AMI and expanded eligibility at 100% AMI (with cost-share component added May 2019). Benefits scale by falls risk level, not household size. The program has a two-episode lifetime limit per client. A significant portion of applications are rejected for incomplete documentation, suggesting applicants should prepare thoroughly before calling. The program refers higher-cost projects to a separate DHCD program, creating a potential gap in understanding where responsibility lies.
- **DACL Benefits Assistance** — service ([source](https://dacl.dc.gov/service/benefits-assistance))
  - Shape notes: Assistance program for EPD Waiver enrollment; eligibility mirrors EPD (individual asset/income caps, no household table); requires provider POF and external assessment; DC-wide via DACL/ADRC.
- **DC Senior Centers** — service ([source](https://dcoa.dc.gov/ (D.C. Office on Aging primary site; specific centers via provider sites)))
  - Shape notes: Decentralized network of centers/providers under D.C. Office on Aging, no uniform income/asset test for core social services, varies by provider (e.g., dementia exclusion, language-specific), employment/nutrition/waiver programs have stricter financial/functional criteria.

## Program Details

### Elderly and Persons with Physical Disabilities (EPD) Waiver Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18-64 with physical disability[1][2]+
- Income: Countable income not exceeding 300% of SSI (e.g., $2,743/month in 2023, $2,382/month in 2021, $2,130/month in 2013); must meet Medicaid spend-down if over limit. No household size table specified—appears fixed for individual[1][2][4][5]
- Assets: Countable assets ≤ $4,000 for individual (e.g., checking/savings/investments count; exemptions not detailed in sources)[1][2][4][5]
- DC resident[1][2]
- US citizen or qualified immigration status for Medicaid[1][2][5]
- Require nursing facility level of care (NFLOC), determined by face-to-face assessment by Liberty Healthcare establishing 'level of need' and assistance with ≥2 ADLs (e.g., eating, dressing, toileting, bathing)[1][2][3][4]
- DC Medicaid provider completes Prescription Order Form (POF), signed by physician or advanced practice registered nurse[1][2]

**Benefits:** Adult day health, case management, homemaker, personal care aide, respite, assisted living, chore aide, community transition services, DSNP/managed care capitated waiver services, environment accessibility/adaptation, individual directed goods/services, participant-directed community support services. Provided in home or assisted living (room/board not covered). No fixed dollar amounts or hours specified[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact DACL Medicaid Services Enrollment Unit (MES) for assistance with coordination/submission/linkage to case management[1][2][6]
- Website: https://dacl.dc.gov/service/epd-waiver[1][6]
- Aging and Disability Resource Center (ADRC) submits complete application to Economic Security Administration (ESA)[2]

**Timeline:** ESA determines eligibility within 45 calendar days after ADRC submits complete application[2]
**Waitlist:** Program has a waiting list on first-come, first-served basis[5]

**Watch out for:**
- Must be Medicaid-eligible (or meet spend-down), but can apply without prior Medicaid[6]
- Requires NFLOC via specific assessment (score ≥9 on scale) and POF—application incomplete without them[1][2][8]
- Assets fixed at $4,000 individual limit; income at 300% SSI (updates annually—check current)[1][2][4]
- Waitlist is first-come, first-served; services in home/assisted living only, no room/board[3][4][5]
- DACL MES coordinates but ESA determines eligibility[1][2]

**Data shape:** Income fixed at 300% SSI (individual, updates yearly); assets strictly $4,000 individual (no household variation specified); requires physician-signed POF + Liberty assessment for NFLOC; waitlisted; DC-only[1][2][4][5]

**Source:** https://dacl.dc.gov/service/epd-waiver[1]

---

### Safe at Home Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older, OR adults 18 and older with disabilities+
- Income: Maximum annual household income at or below 80% of Area Median Income (AMI). As of the most recent data available: $72,550 for an individual or $82,550 for a married couple. Note: In May 2019, a cost-share component was implemented allowing eligibility up to 100% AMI ($99,600 for individual, $113,850 for household of two), though sources show variation in current thresholds.[2][3][4][6][8]
- Assets: Not specified in available program documentation
- Must be a District of Columbia resident[1]
- Must own the property OR be a renter with owner permission to make modifications[1][2]
- Property must be used as primary residence (dwelling unit where individual lives more than 50% of calendar year)[1]
- Must provide proof of disability (waived for applicants 60+)[1]
- Must pass falls risk and fear of falling assessment[4]

**Benefits:** Up to $6,000 in preventative home modifications for clients at 'low falls risk.' Beginning Fiscal Year 2024, maximum raised to $7,000. Projects exceeding $6,000 or clients with 'high falls risk' are referred to Department of Housing and Community Development's Single Family Residential Rehabilitation Program. Original statute authorizes up to $10,000 per residence.[1][4][5]
- Varies by: falls_risk_level

**How to apply:**
- Phone: (202) 724-5626[2][3]
- In-person or mail through Department of Aging and Community Living (DACL)
- Online application not explicitly documented in available sources

**Timeline:** Not specified in available documentation
**Waitlist:** Not specified in available documentation

**Watch out for:**
- High rate of ineligible applications (60%) due to incomplete documentation — ensure all required proof is gathered before applying[4]
- Income limits have changed over time; verify current thresholds with DACL as sources show conflicting figures ($72,550–$99,600 for individuals depending on cost-share tier)[2][4][6]
- Clients can only be considered for eligibility for two episodes (two separate modification projects)[4]
- Projects exceeding $6,000 or high-risk clients are automatically referred to a different program (DHCD Single Family Residential Rehabilitation), not handled by Safe at Home[4]
- Disability proof is required for applicants under 60, but waived entirely for those 60+[1]
- Property owner permission is required for renters; this must be documented[1]
- Program focuses on fall prevention specifically — modifications must address falls risk, not general accessibility[2][4]
- Grants are exempt from District income taxation[1]

**Data shape:** This program has two distinct income tiers: base eligibility at 80% AMI and expanded eligibility at 100% AMI (with cost-share component added May 2019). Benefits scale by falls risk level, not household size. The program has a two-episode lifetime limit per client. A significant portion of applications are rejected for incomplete documentation, suggesting applicants should prepare thoroughly before calling. The program refers higher-cost projects to a separate DHCD program, creating a potential gap in understanding where responsibility lies.

**Source:** https://dacl.dc.gov/service/safe-home

---

### DACL Benefits Assistance

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18-64 with physical disability+
- Income: Countable income not exceeding $2,743/month (2023) or $2,382/month (2021); must meet Medicaid spend-down if over limit. No household size table specified; applies to individual.[1][2]
- Assets: Countable assets (e.g., savings, checking, investments, cash value of life insurance minus $10,000 burial allowance) not exceeding $4,000 for an individual. No couple/household limits specified.[1][2]
- U.S. citizen or qualified immigration status for Medicaid
- District of Columbia resident
- DC Medicaid provider completes Prescription Order Form (POF)
- Liberty Healthcare completes face-to-face assessment for level of need
- Nursing home level of care need while living at home or assisted living

**Benefits:** Case management by social worker; Personal Care Aide (PCA) services for grooming, dressing, eating, toileting; other home/community-based supports to avoid nursing home placement. No fixed dollar amounts or hours specified.[1]
- Varies by: priority_tier

**How to apply:**
- Phone: Contact DACL Medicaid Enrollment Services (MES) or ADRC at (202) 724-5626
- In-person: Aging and Disability Resource Center (ADRC) appointment
- DACL assists with coordination, submission, and linkage to EPD Waiver case management

**Timeline:** Economic Security Administration (ESA) determines eligibility within 45 calendar days after complete application submission.[2]
**Waitlist:** Not mentioned in sources

**Watch out for:**
- Primarily assistance enrolling in EPD Waiver, Medicaid, SNAP—not direct benefits; requires separate Medicaid eligibility and spend-down if income over limit.
- Must have nursing home level of care need; face-to-face assessment by Liberty Healthcare required.
- Income/asset limits outdated in sources (2021-2023); verify current figures as they tie to SSI (300% SSI).
- Countable assets exclude $10,000 burial but include most financial accounts.

**Data shape:** Assistance program for EPD Waiver enrollment; eligibility mirrors EPD (individual asset/income caps, no household table); requires provider POF and external assessment; DC-wide via DACL/ADRC.

**Source:** https://dacl.dc.gov/service/benefits-assistance

---

### DC Senior Centers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits for general DC senior centers; many operate on voluntary contributions, sliding scale fees, or are free for DC residents age 60+. Specific programs like employment training require income <125% federal poverty level. Medicaid-related services cap at 300% SSI ($2,982 individual in 2026) or medically needy limits ($856.90 individual, $902 household of 2+ in 2026).[2][1]
- Assets: Not applicable for general senior centers. Medicaid long-term care services limit resources to $4,000 (individual) or $6,000 (couple); home equity ≤$1,130,000 exempt if intent to return or spouse/minor/disabled child resides there.[2][3]
- DC resident
- Able to complete daily living activities independently or with personal care assistant (no dementia/Alzheimer's diagnosis for some centers)
- US citizen or eligible immigration status for Medicaid-linked services
- Nursing facility level of care for waiver programs (assessed via interRAI tool, score ≥9 points on ADLs/cognition/behavior)

**Benefits:** Social, recreational, nutritional, health promotion activities (e.g., free meals, food commodities, health screenings like blood pressure/blood sugar, nutritional counseling, mental health support, education classes, exercise, social services case management); hours vary by center (e.g., Mon/Thu 10am-4pm, Tue/Wed/Fri 10am-2pm at SOME); no fixed dollar amount, often free or low-cost.[4][9][5]
- Varies by: region

**How to apply:**
- In-person at centers (e.g., SOME at 1395 Aspen St. NW, Washington, DC 20012; Vida Senior Centers locations)
- Phone: (202) 724-7000 for employment program info
- Contact Aging and Disability Resource Center (ADRC) via D.C. Office on Aging for referrals
- Email for specific programs

**Timeline:** Not specified; typically immediate intake at centers upon eligibility screening

**Watch out for:**
- Not a single centralized program—network of independent centers with varying eligibility (e.g., no dementia at some); often confused with employment training (SCSEP, age 55+, job-focused) or Medicaid waivers; many free but some sliding scale/voluntary fees; priority for most-in-need in some services; must confirm center-specific rules as no uniform application.[1][4][5][9]
- Medical/functional needs assessed for advanced services, not automatic.
- Targeted groups like Hispanic seniors at Vida may have cultural/language focus others lack.

**Data shape:** Decentralized network of centers/providers under D.C. Office on Aging, no uniform income/asset test for core social services, varies by provider (e.g., dementia exclusion, language-specific), employment/nutrition/waiver programs have stricter financial/functional criteria.

**Source:** https://dcoa.dc.gov/ (D.C. Office on Aging primary site; specific centers via provider sites)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Elderly and Persons with Physical Disabi | benefit | state | deep |
| Safe at Home Program | benefit | state | deep |
| DACL Benefits Assistance | benefit | state | deep |
| DC Senior Centers | resource | state | simple |

**Types:** {"benefit":3,"resource":1}
**Scopes:** {"state":4}
**Complexity:** {"deep":3,"simple":1}

## Content Drafts

Generated 4 page drafts. Review in admin dashboard or `data/pipeline/DC/drafts.json`.

- **Elderly and Persons with Physical Disabilities (EPD) Waiver Program** (benefit) — 4 content sections, 6 FAQs
- **Safe at Home Program** (benefit) — 4 content sections, 6 FAQs
- **DACL Benefits Assistance** (benefit) — 5 content sections, 6 FAQs
- **DC Senior Centers** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **falls_risk_level**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Elderly and Persons with Physical Disabilities (EPD) Waiver Program**: Income fixed at 300% SSI (individual, updates yearly); assets strictly $4,000 individual (no household variation specified); requires physician-signed POF + Liberty assessment for NFLOC; waitlisted; DC-only[1][2][4][5]
- **Safe at Home Program**: This program has two distinct income tiers: base eligibility at 80% AMI and expanded eligibility at 100% AMI (with cost-share component added May 2019). Benefits scale by falls risk level, not household size. The program has a two-episode lifetime limit per client. A significant portion of applications are rejected for incomplete documentation, suggesting applicants should prepare thoroughly before calling. The program refers higher-cost projects to a separate DHCD program, creating a potential gap in understanding where responsibility lies.
- **DACL Benefits Assistance**: Assistance program for EPD Waiver enrollment; eligibility mirrors EPD (individual asset/income caps, no household table); requires provider POF and external assessment; DC-wide via DACL/ADRC.
- **DC Senior Centers**: Decentralized network of centers/providers under D.C. Office on Aging, no uniform income/asset test for core social services, varies by provider (e.g., dementia exclusion, language-specific), employment/nutrition/waiver programs have stricter financial/functional criteria.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in District of Columbia?
