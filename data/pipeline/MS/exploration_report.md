# Mississippi Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 17s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 5 |
| New (not in our data) | 4 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 3 programs
- **advocacy**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Mississippi Medicaid Elderly and Disabled Waiver

- **min_age**: Ours says `65` → Source says `21 or older (65+ or 21-64 with physical disability; those enrolled before 65 can continue after)[1][2][4]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health care, home-delivered meals, personal care services, institutional respite, in-home respite, expanded/extended home health visits, community transition services, physical therapy, speech therapy, medication management, environmental safety services, case management[2][4][6][7]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]`

## New Programs (Not in Our Data)

- **Mississippi State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.mdhs.ms.gov (Mississippi Department of Human Services) or https://www.shiphelp.org/ships/mississippi/[5][8]))
  - Shape notes: no income/asset test; counseling-only service via phone/in-person statewide network; prioritizes Medicare navigation and low-income program applications; administered by state aging division with local affiliates[1][2][5]
- **State Long Term Care Ombudsman Program** — advocacy ([source](https://www.mdhs.ms.gov/aging/ombudsman/))
  - Shape notes: no income test; open to all regardless of age or finances; advocacy-only (no direct services or benefits); delivered regionally via 19 local ombudsmen through AAAs covering all counties
- **Mississippi Access to Care (MAC) Network** — service ([source](https://www.mississippiaccesstocare.org))
  - Shape notes: Tied to Medicaid E&D Waiver-like structure; services fixed list, eligibility hinges on NFLOC assessment score rather than simple income/age; statewide but provider-delivered
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: County-restricted with multiple regional providers; coverage clustered by planning districts; no statewide single office or online application; benefits fixed at ~20 hours/week at min wage

## Program Details

### Mississippi Medicaid Elderly and Disabled Waiver


**Eligibility:**
- Age: 21 or older (65+ or 21-64 with physical disability; those enrolled before 65 can continue after)[1][2][4]+
- Income: Qualify as SSI beneficiary or up to 300% of SSI federal benefit rate. If exceeding 300% SSI, pay excess via income trust to Division of Medicaid. (2026 SSI federal benefit rate not specified in sources; exact dollar amounts vary annually and by household via Medicaid rules.)[2][3][5]
- Assets: Standard Medicaid SSI resource limits apply (not detailed in sources). Home equity limit in 2026: $752,000 if applicant lives in home or intends to return. Exemptions: spouse lives in home; minor child (<21) or permanently disabled/blind child (any age) lives in home.[1]
- Mississippi resident
- Nursing Facility Level of Care (NFLOC) via in-person LTSS assessment by social worker/nurse (ADLs, IADLs, cognitive deficits scored numerically)[1][2][3][5]
- Physician certification of NFLOC, re-certified every 12 months[3][5]
- Medicaid eligible (SSI or income/resource rules)[2]

**Benefits:** Adult day health care, home-delivered meals, personal care services, institutional respite, in-home respite, expanded/extended home health visits, community transition services, physical therapy, speech therapy, medication management, environmental safety services, case management[2][4][6][7]

**How to apply:**
- Contact Mississippi Division of Medicaid (DOM) via website https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/ or phone (specific number not in sources; use general Medicaid intake)[2]
- In-person LTSS assessment by licensed social worker/nurse[1]
- Physician certification[3]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; likely due to waiver caps (common for 1915(c) waivers, but unconfirmed)[null]

**Watch out for:**
- Must meet NFLOC via scored in-person assessment; dementia diagnosis alone insufficient[1]
- Income over 300% SSI requires monthly payment via trust[3][5]
- Home equity limit $752,000 in 2026 applies unless exemptions met[1]
- Physician re-certification every 12 months required[3][5]
- Distinguish from other MS waivers (e.g., IL for severe orthopedic/neurological, AL for assisted living)[6][7]

**Data shape:** Income capped at 300% SSI with trust option; NFLOC via scored LTSS assessment; statewide with uniform services; concurrent 1915(b)(4) selective contracting[2][4]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]

---

### Mississippi State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries, families, and caregivers[1][5]
- Assets: No asset limits or tests apply[1]
- Must be a Medicare beneficiary, under 65 with Medicare disability, dually eligible for Medicare/Medicaid, family member, or caregiver[1][5]

**Benefits:** Free one-on-one counseling (in-person/phone), education, assistance with Medicare Parts A/B/C/D, Medigap, Medicare Savings Programs, Extra Help/LIS, Medicaid applications, claims/appeals, fraud prevention (SMP), printed materials, referrals, group presentations, enrollment events[1][3][5]

**How to apply:**
- Phone: 1-844-822-4622 or 601-709-0624 (M-F 8am-5pm)[5][8]
- Website: Mississippi Department of Human Services SHIP page (via shiphelp.org or mdhs.ms.gov)[5][8]
- In-person: Through MDHS Division of Aging and Adult Services or local networks (contact via phone for appointment)[2][5]

**Timeline:** Immediate counseling assistance available by phone/in-person; no formal processing for enrollment as it's a service program[3][5]

**Watch out for:**
- Not a financial aid or healthcare provider program—only counseling/education, no direct payments or medical services; must be Medicare-related issue; prioritizes limited-income/disabled but serves all; review plans annually during open enrollment (e.g., Oct 15-Dec 7)[1][5]
- Volunteers/staff handle complex appeals but cannot provide legal advice[1][4]

**Data shape:** no income/asset test; counseling-only service via phone/in-person statewide network; prioritizes Medicare navigation and low-income program applications; administered by state aging division with local affiliates[1][2][5]

**Source:** https://www.mdhs.ms.gov (Mississippi Department of Human Services) or https://www.shiphelp.org/ships/mississippi/[5][8]

---

### State Long Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available regardless of financial status.
- Assets: No asset limits; available regardless of financial status.
- Resides in or is a potential resident of a long-term care facility subject to regulation or licensure by the Mississippi State Department of Health (e.g., nursing homes, personal care homes, assisted living facilities).

**Benefits:** Advocacy to resolve complaints and problems; protection of health, safety, welfare, and rights; intervention and representation on behalf of residents; information and assistance; regular visits to facilities; community education; works to improve quality of life and care at individual, local, state, and national levels.

**How to apply:**
- Phone: 1-888-844-0041
- Phone (State Ombudsman): 601-359-4927
- Website: https://www.mdhs.ms.gov/aging/ombudsman/
- Mail/In-person: MDHS, 200 South Lamar St., Jackson, MS 39201

**Timeline:** Timely responses to requests for information and complaints (exact timeline not specified).

**Watch out for:**
- Not a direct service provider (e.g., no financial aid, healthcare, or housing); focuses solely on advocacy and complaint resolution.
- Available to potential residents (pre-admission) as well as current residents.
- Anyone can file a complaint on behalf of a resident; program prioritizes resident's concerns.
- Volunteers must be certified; families cannot become ombudsmen without training.

**Data shape:** no income test; open to all regardless of age or finances; advocacy-only (no direct services or benefits); delivered regionally via 19 local ombudsmen through AAAs covering all counties

**Source:** https://www.mdhs.ms.gov/aging/ombudsman/

---

### Mississippi Access to Care (MAC) Network

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must be Medicaid eligible; specific dollar amounts not listed in sources but follow Mississippi Medicaid ABD (Aged, Blind, Disabled) rules, which include SSI standards or institutional income limits (varies by program; e.g., for related waivers, child’s income up to institutional max in Katie Beckett). No household size table provided for MAC specifically[7][9].
- Assets: Follows Mississippi Medicaid rules for ABD category; home equity limit of $752,000 in 2026 if living at home (exempt if spouse or minor/permanently disabled child lives there). Standard resource limit $2,000 for some disabled programs[1].
- Mississippi resident
- Medicaid eligible
- Require nursing facility level of care (NFLOC), assessed in-person via ADLs, IADLs, cognitive function by licensed social worker and RN[1][7]
- Medically stable
- Live in home or have intent to return[1][7]

**Benefits:** Case Management, Adult Day Services, Expanded Home Health Services, Home Delivered Meals, Personal Care Services, Institutional Respite and/or In-Home Respite, Transition Assistance[7]

**How to apply:**
- Website: https://www.mississippiaccesstocare.org[9]
- Phone or contact via site (specific number not listed; use Medicaid general application at medicaid.ms.gov)[7][9]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; common for waiver programs due to funding caps[1]

**Watch out for:**
- Must already be Medicaid eligible before waiver services; apply for Medicaid first[7]
- NFLOC not automatic (e.g., dementia diagnosis alone insufficient; requires scored assessment)[1]
- Home equity limit $752,000 applies unless exemptions met[1]
- Medically stable requirement excludes unstable cases[7]
- Part of broader Medicaid waiver system; slots limited, potential waitlists[1]

**Data shape:** Tied to Medicaid E&D Waiver-like structure; services fixed list, eligibility hinges on NFLOC assessment score rather than simple income/age; statewide but provider-delivered

**Source:** https://www.mississippiaccesstocare.org

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are published by the U.S. Department of Health and Human Services; for current figures, check the federal poverty guidelines as no Mississippi-specific table is provided in sources.
- Unemployed
- Enrollment priority: veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy skills, limited English proficiency, rural residents, homeless or at-risk, low employment prospects, or prior American Job Center users

**Benefits:** Part-time community service work-based job training (average 20 hours per week) at non-profit/public facilities (e.g., schools, hospitals, senior centers); paid the highest of federal, state, or local minimum wage; training and employment assistance to bridge to unsubsidized jobs.
- Varies by: priority_tier

**How to apply:**
- Phone or email via regional providers (see geography.offices_or_providers)
- In-person or mail to provider offices (e.g., Copiah-Lincoln Community College: P.O. Box 649, Wesson, MS 39191; Phone: 601.643.8673)
- Contact local partner for application (no national online form specified)


**Watch out for:**
- Not statewide—check if your county is served; contact provider if not listed
- Must be unemployed and actively seeking unsubsidized work; part-time training role only
- Priority tiers limit access for non-priority applicants
- Income based on 125% federal poverty level (updates yearly; verify current thresholds)
- No asset limits mentioned, but prove low-income status required

**Data shape:** County-restricted with multiple regional providers; coverage clustered by planning districts; no statewide single office or online application; benefits fixed at ~20 hours/week at min wage

**Source:** https://www.dol.gov/agencies/eta/seniors

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Mississippi Medicaid Elderly and Disable | benefit | state | deep |
| Mississippi State Health Insurance Assis | resource | federal | simple |
| State Long Term Care Ombudsman Program | resource | federal | simple |
| Mississippi Access to Care (MAC) Network | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |

**Types:** {"benefit":2,"resource":2,"employment":1}
**Scopes:** {"state":2,"federal":3}
**Complexity:** {"deep":3,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MS/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 4 programs
- **priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Mississippi Medicaid Elderly and Disabled Waiver**: Income capped at 300% SSI with trust option; NFLOC via scored LTSS assessment; statewide with uniform services; concurrent 1915(b)(4) selective contracting[2][4]
- **Mississippi State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling-only service via phone/in-person statewide network; prioritizes Medicare navigation and low-income program applications; administered by state aging division with local affiliates[1][2][5]
- **State Long Term Care Ombudsman Program**: no income test; open to all regardless of age or finances; advocacy-only (no direct services or benefits); delivered regionally via 19 local ombudsmen through AAAs covering all counties
- **Mississippi Access to Care (MAC) Network**: Tied to Medicaid E&D Waiver-like structure; services fixed list, eligibility hinges on NFLOC assessment score rather than simple income/age; statewide but provider-delivered
- **Senior Community Service Employment Program (SCSEP)**: County-restricted with multiple regional providers; coverage clustered by planning districts; no statewide single office or online application; benefits fixed at ~20 hours/week at min wage

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Mississippi?
