# North Dakota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.030 (6 calls, 1.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 4 |
| Programs deep-dived | 3 |
| New (not in our data) | 3 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **financial**: 1 programs
- **service**: 1 programs
- **in_kind**: 1 programs

## New Programs (Not in Our Data)

- **North Dakota Basic Care Assistance Program (BCAP)** — financial ([source](https://www.hhs.nd.gov/adults-and-aging/services/basic-care-assistance-program-bcap))
  - Shape notes: Tied directly to Medicaid eligibility (income/assets not restated in BCAP docs); requires licensed facility residence and functional ADL assessment; financial aid scales inversely with income after personal allowance
- **North Dakota Aging in Community (AIC) Project** — service ([source](https://www.ndsu.edu/agriculture/extension/programs/aging-community-program))
  - Shape notes: Community-based pilot in select rural counties only; no formal income/asset tests or fixed benefits; volunteer-driven model to fill service gaps, not a traditional entitlement program
- **ND Assistive Senior Safety Program** — in_kind ([source](https://ndassistive.org/senior-safety-program/asdds-application/))
  - Shape notes: Statewide but administered from Fargo office; prioritizes home safety for aging in place; income-tested with guidelines in forms; device requests ranked by applicant

## Program Details

### North Dakota Basic Care Assistance Program (BCAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older OR 18 or older and blind or disabled+
- Income: Determined by North Dakota Medicaid eligibility requirements (no specific dollar amounts or household size table provided in program sources; for context, related long-term care Medicaid has asset limit of $3,000 for singles and income mostly paid toward care minus $150 personal needs allowance)
- Assets: Determined by North Dakota Medicaid eligibility requirements (no specific details on what counts or exemptions in BCAP sources; Medicaid long-term care context limits assets to $3,000 for singles)
- North Dakota resident
- Qualify for North Dakota Medicaid
- Functional assessment showing need for assistance with activities of daily living (ADLs) such as bathing, dressing, eating, toileting
- Reside in a licensed basic care facility
- For some cases: resided in nursing facility at least 6 months and meet additional criteria like subsequent denial of nursing facility level of care

**Benefits:** Pays portion of costs for care in licensed basic care facility; recipient keeps $150/month personal needs allowance, other income applied to facility/health costs, BCAP covers remainder directly to facility
- Varies by: income

**How to apply:**
- Online: Apply for Assistance (via Customer Support Center)
- Phone: (866) 614-6005
- Email: applyforhelp@nd.gov
- Fax: (701) 328-1006
- Mail: Customer Support Center, P.O. Box 5562, Bismarck, ND 58506
- In-person/alternative: Contact Aging and Disability Resource Link (ADRL), submit Basic Care application or Medicaid Application for the Elderly and Disabled (SFN 958) to eligibility unit, email agingbcreferrals@nd.gov

**Timeline:** Date of eligibility is date of application if qualified (no specific processing timeline stated)

**Watch out for:**
- Must first qualify for ND Medicaid (separate income/asset test, not detailed in BCAP pages)
- Requires living in a licensed basic care facility (not home care or assisted living)
- Income beyond $150 personal needs goes to facility/medical costs
- Functional assessment required for ADLs; may not cover if only personal care assessment fails
- If already on Medicaid, uses redetermination

**Data shape:** Tied directly to Medicaid eligibility (income/assets not restated in BCAP docs); requires licensed facility residence and functional ADL assessment; financial aid scales inversely with income after personal allowance

**Source:** https://www.hhs.nd.gov/adults-and-aging/services/basic-care-assistance-program-bcap

---

### North Dakota Aging in Community (AIC) Project

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits stated; focuses on older adults in rural areas without financial thresholds detailed in available sources.
- Assets: No asset limits specified for AIC.
- North Dakota resident
- Older adult (typically 60+ implied) living in targeted rural communities
- Desire to age in place in rural home
- Residency in implementation areas such as Lisbon and western Morton Counties

**Benefits:** Community-based supports including volunteer assistance for transportation, food and nutrition classes, fall prevention education, technology assistance; fosters connections to local resources to enhance quality of life, safety, and independence.
- Varies by: region

**How to apply:**
- Contact NDSU Extension (specific phone/website not listed; start via NDSU Agriculture Extension at ndsu.edu/agriculture/extension)
- Community-based model; engage local AIC project coordinators in targeted rural areas

**Timeline:** Not specified

**Watch out for:**
- Not a statewide entitlement program—limited to specific rural pilot areas, not available everywhere in ND
- Not a direct financial aid or formal healthcare service like Medicaid/SPED; relies on volunteer and community connections
- People may confuse with state programs like SPED (which has income/asset limits and payments) or Medicaid waivers
- Focuses on prevention and connections rather than intensive medical care
- Success measured in connections and confidence, not guaranteed services or hours

**Data shape:** Community-based pilot in select rural counties only; no formal income/asset tests or fixed benefits; volunteer-driven model to fill service gaps, not a traditional entitlement program

**Source:** https://www.ndsu.edu/agriculture/extension/programs/aging-community-program

---

### ND Assistive Senior Safety Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income guidelines apply (specific dollar amounts and household size variations detailed in the application form; e.g., 2024 and 2025 application PDFs reference guidelines but do not list exact figures in available excerpts)
- North Dakota resident
- Need for assistive safety devices to remain safely in home
- Does not qualify for devices through insurance, Medicare, Medicaid, or other programs (similar to related Possibilities Grant criteria)

**Benefits:** Free assistive safety devices including: Alerting Devices for Hearing Loss, Anti-Elopement Devices, and other home safety equipment; professional setup assistance provided
- Varies by: priority_tier

**How to apply:**
- Online: https://ndassistive.org/senior-safety-program/asdds-application/
- Download PDF form: https://ndassistive.org/wp-content/uploads/2025/03/2025-Senior-Safety-Application-Standard-Print.pdf or https://ndassistive.org/wp-content/uploads/2024/03/2024-Senior-Safety-Large-Print-Application.pdf
- Mail: ND Assistive/ Senior Safety, 3240 15th St. S, Suite B, Fargo, ND 58104
- Fax: 701-365-6242 Attn.: Senior Safety
- Phone for questions: 800-735-5400 (from related 2025 form)

**Timeline:** Typically 3-4 weeks (based on similar program review process)

**Watch out for:**
- Must exhaust other funding sources first (insurance, Medicare, Medicaid, etc.) — program is last resort
- List devices in order of importance on application; only one per line
- Income guidelines in application — review current year form (e.g., 2025) as they may update annually
- Available to those in assisted living if applicable
- Email for questions: seniorsafety@ndassistive.org

**Data shape:** Statewide but administered from Fargo office; prioritizes home safety for aging in place; income-tested with guidelines in forms; device requests ranked by applicant

**Source:** https://ndassistive.org/senior-safety-program/asdds-application/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| North Dakota Basic Care Assistance Progr | benefit | state | deep |
| North Dakota Aging in Community (AIC) Pr | benefit | local | medium |
| ND Assistive Senior Safety Program | resource | state | simple |

**Types:** {"benefit":2,"resource":1}
**Scopes:** {"state":2,"local":1}
**Complexity:** {"deep":1,"medium":1,"simple":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/ND/drafts.json`.

- **North Dakota Basic Care Assistance Program (BCAP)** (benefit) — 2 content sections, 6 FAQs
- **North Dakota Aging in Community (AIC) Project** (benefit) — 1 content sections, 6 FAQs
- **ND Assistive Senior Safety Program** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **income**: 1 programs
- **region**: 1 programs
- **priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **North Dakota Basic Care Assistance Program (BCAP)**: Tied directly to Medicaid eligibility (income/assets not restated in BCAP docs); requires licensed facility residence and functional ADL assessment; financial aid scales inversely with income after personal allowance
- **North Dakota Aging in Community (AIC) Project**: Community-based pilot in select rural counties only; no formal income/asset tests or fixed benefits; volunteer-driven model to fill service gaps, not a traditional entitlement program
- **ND Assistive Senior Safety Program**: Statewide but administered from Fargo office; prioritizes home safety for aging in place; income-tested with guidelines in forms; device requests ranked by applicant

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in North Dakota?
