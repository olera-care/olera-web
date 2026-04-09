# Alabama Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 2 |
| Programs deep-dived | 2 |
| New (not in our data) | 2 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 1 programs
- **financial**: 1 programs

## New Programs (Not in Our Data)

- **Alabama Cares** — service ([source](https://alabamaageline.gov/alabama-cares/))
  - Shape notes: Caregiver-training/respite focused via regional AAAs; priority-based access with no income/asset tests; varies by local AAA providers and priority tiers.
- **Alabama Elderly Simplified Application Project (AESAP)** — financial ([source](https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/))
  - Shape notes: Streamlined SNAP variant: 3-year certification, no mandatory interview, self-declaration of income/resources (with exceptions), 2-page form; income/assets match standard SNAP tables (adjust annually); statewide via county offices

## Program Details

### Alabama Cares

> **NEW** — not currently in our data

**Eligibility:**
- Income: No strict income limits; services are not income-based, but priority given to those with greatest social and economic needs (e.g., low-income, minority individuals).
- Assets: No asset limits mentioned.
- Primary family caregivers of frail older adults age 60+ or of any age with Alzheimer's/other dementia.
- Grandparents/relative caregivers age 55+ (not parents) caring for children 18 and under, or any age with severe disability; must provide 20+ hours/week of care and have custody with child living in home.
- Older relative caregivers/parents age 55+ caring for adults 19-59 with disabilities.
- Priority: older caregivers (60+), rural areas, critical health needs, Alzheimer's/dementia, multiple care recipients.

**Benefits:** Information, assistance, counseling, respite care, supplemental services (e.g., personal care, adult day care, limited homemaker services), free education (Caregiver Colleges, e-newsletters), support groups.
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA) and Aging & Disability Resource Center (ADRC) at 1-800-AGE-LINE (1-800-243-5463).
- Website: alabamaageline.gov/alabama-cares/ or local AAA sites (e.g., eastalabamaaging.org, agingsouthalabama.org).
- In-person: Local AAA/ADRC offices.

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; services prioritized by need, implying potential delays for non-priority cases.

**Watch out for:**
- Focuses on caregivers (not direct to elderly); families must qualify as primary caregivers.
- No guaranteed services or payment to caregivers; provides support services only, prioritized by need.
- Not Medicaid; separate from Elderly & Disabled Waiver or paid caregiver programs.
- Relative caregivers need legal custody and proof of 20+ hours/week care.
- Services aim to prevent burnout/delay institutionalization, not long-term paid care.

**Data shape:** Caregiver-training/respite focused via regional AAAs; priority-based access with no income/asset tests; varies by local AAA providers and priority tiers.

**Source:** https://alabamaageline.gov/alabama-cares/

---

### Alabama Elderly Simplified Application Project (AESAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Same as standard Alabama Food Assistance (SNAP) program. Gross monthly income limits (effective Oct 1, 2022 - Sep 30, 2023): 1 person: $1,396/$1,073; 2: $1,888/$1,452; 3: $2,379/$1,831; 4: $2,871/$2,210; 5: $3,363/$2,589; 6: $3,855/$2,969; 7: $4,347/$3,348; 8: $4,839/$3,727. Each additional person: $492/$379. Net income limits follow similar scaling. Current limits available via DHR as they adjust annually.
- Assets: Same resource limits as standard Food Assistance households (typically $2,750 for most households or $4,250 if elderly/disabled; primary home, one vehicle, and certain retirement accounts often exempt).
- All household members age 60+ on application date
- No earned income (wages, self-employment) in month of application
- U.S. citizen or qualified non-citizen
- Meet standard Food Assistance residency, identity, and other rules

**Benefits:** Monthly Food Assistance (SNAP) benefits via EBT debit card for groceries. Amount calculated same as standard Food Assistance based on income, deductions (e.g., medical expenses), and household size. Certification period: 36 months (3 years).
- Varies by: household_size

**How to apply:**
- Online: MyDHR portal at dhr.alabama.gov/food-assistance
- Phone: 1-800-382-0499 (Food Assistance hotline) or 1-833-822-2202 (AESAP automated hotline)
- Mail/Fax/Email: Download Form DHR-FSD-2198 (AESAP Application) from dhr.alabama.gov and submit to local county DHR Food Assistance office
- In-person: Local county DHR Food Assistance office (no face-to-face interview required unless requested)

**Timeline:** Up to 30 days from application date

**Watch out for:**
- Age discrepancy in some sources (60+ vs. 65+); official DHR uses 60+
- No earned income means zero wages/self-employment; unearned income (Social Security, pensions) allowed if under limits
- All household members must be 60+ (no children or younger adults, even if separate food prep)
- Self-declaration OK unless questionable; verification required for medical expenses or suspicions
- Must submit annual Interim Contact Form or risk closure
- Benefits calculated identically to regular SNAP despite simplified process

**Data shape:** Streamlined SNAP variant: 3-year certification, no mandatory interview, self-declaration of income/resources (with exceptions), 2-page form; income/assets match standard SNAP tables (adjust annually); statewide via county offices

**Source:** https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Alabama Cares | resource | state | simple |
| Alabama Elderly Simplified Application P | benefit | state | medium |

**Types:** {"resource":1,"benefit":1}
**Scopes:** {"state":2}
**Complexity:** {"simple":1,"medium":1}

## Content Drafts

Generated 2 page drafts. Review in admin dashboard or `data/pipeline/AL/drafts.json`.

- **Alabama Cares** (resource) — 2 content sections, 6 FAQs
- **Alabama Elderly Simplified Application Project (AESAP)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 1 programs
- **household_size**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Alabama Cares**: Caregiver-training/respite focused via regional AAAs; priority-based access with no income/asset tests; varies by local AAA providers and priority tiers.
- **Alabama Elderly Simplified Application Project (AESAP)**: Streamlined SNAP variant: 3-year certification, no mandatory interview, self-declaration of income/resources (with exceptions), 2-page form; income/assets match standard SNAP tables (adjust annually); statewide via county offices

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Alabama?
