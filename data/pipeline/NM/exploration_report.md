# New Mexico Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.010 (2 calls, 4.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | ? |
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
- **in_kind**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Program of All-Inclusive Care for the Elderly (PACE)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive all-inclusive services including: primary care physician services, hospital care (including laboratory and x-ray services), emergency services, physical and occupational therapy, nursing home and home care, prescription drugs, dental services, meals and nutritional counseling, social services, and transportation[1][2]` ([source](https://www.hca.nm.gov/lookingforinformation/pace/ (New Mexico Human Services Department)[5]))
- **source_url**: Ours says `MISSING` → Source says `https://www.hca.nm.gov/lookingforinformation/pace/ (New Mexico Human Services Department)[5]`

## New Programs (Not in Our Data)

- **Centennial Care Community Benefit Program** — service ([source](https://www.hca.nm.gov/community-benefit-program/[7]))
  - Shape notes: Tied to Medicaid MCOs with NFLOC assessment; two models (Agency-Based then optional Self-Directed); waitlist via Central Registry for non-Medicaid eligible
- **Community Benefit Program** — service ([source](https://www.hca.nm.gov/community-benefit-program/))
  - Shape notes: Tied to Medicaid MCOs with NF LOC functional test; two tracks (Medicaid-full vs. registry allocation); benefits via individualized MCO care plan; 120-day ABCB trial before self-direct option.
- **New Mexico Senior Farmers' Market Nutrition Program (SFMNP)** — in_kind ([source](https://www.nmwic.org/fmnp/[2]))
  - Shape notes: Age varies by Native American status; income at 185% FPL or proxy program enrollment (SNAP/CSFP/TEFAP); one-time fixed benefit; statewide with first-come funding cap
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.aging.nm.gov/aging-network/senior-employment-programs/))
  - Shape notes: Grantee-based with multiple providers (NICOA, Goodwill, ALTSD); priority tiers affect access; funding variability by region; no fixed asset limits or statewide wait times; rural/frontier county focus in NM.[2][3][4]

## Program Details

### Centennial Care Community Benefit Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for elderly or 0-64 if disabled (disabled over 64 qualify under aged category)+
- Income: Requires full Medicaid coverage; specific dollar amounts or household size tables not detailed in sources—must qualify for New Mexico Medicaid ABD category first[1][2][3]
- Assets: Determined by full Medicaid eligibility rules; sources do not specify asset details, what counts, or exemptions for this program[1]
- New Mexico resident
- Nursing Facility Level of Care (NFLOC): assistance needed with 2+ Activities of Daily Living (ADLs: bathing, dressing, eating, toileting, mobility, transitioning)
- Full Medicaid coverage or waiver category
- Enrolled in a Centennial Care Managed Care Organization (MCO)

**Benefits:** Home and community-based services including: adult day health care, assisted living services, behavior support consultation, community transition services (from nursing home to home), customized community supports, emergency response services, employment supports, environmental modifications, home health aide, nutritional counseling, personal care services (age 21+), private duty nursing for adults, nursing respite services, skilled therapies; supplements natural supports, not 24-hour care; based on individual needs[1][2][3][4][6][7]
- Varies by: priority_tier

**How to apply:**
- If enrolled in full Medicaid and MCO: speak with care coordinator or MCO representative
- If full Medicaid but no MCO: call 1-800-283-4465 for MCO enrollment
- If not qualifying for full Medicaid: contact New Mexico Aging and Long-Term Services Department (ALTSD) for Central Registry waitlist (phone/website not specified in sources)
- Talk to care coordinator for assessment[7]

**Timeline:** Not specified in sources
**Waitlist:** Central Registry for those not qualifying for full Medicaid; slots based on need[7]

**Watch out for:**
- Must have full Medicaid and MCO enrollment first; not standalone
- Requires NFLOC via functional assessment—not automatic for dementia diagnoses
- Self-direction (SDCB) only after 120 days in Agency-Based (ABCB)[2][3]
- Does not cover room/board or 24-hour care; supplements natural supports[2][6]
- Limited provider applications for some services like adult personal care[4]

**Data shape:** Tied to Medicaid MCOs with NFLOC assessment; two models (Agency-Based then optional Self-Directed); waitlist via Central Registry for non-Medicaid eligible

**Source:** https://www.hca.nm.gov/community-benefit-program/[7]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: Not specified in available sources. PACE uses Medicare or Medicaid funds; applicants' financial situations are considered, but specific income thresholds are not provided in search results.
- Assets: Not specified in available sources.
- Must be certified by the state as requiring nursing home level of care[1][9]
- Must reside in the service area of a PACE organization[1]
- Must be capable of living safely in the PACE community setting[1]
- Must be eligible for Medicare, Medicaid, or both[2]

**Benefits:** Comprehensive all-inclusive services including: primary care physician services, hospital care (including laboratory and x-ray services), emergency services, physical and occupational therapy, nursing home and home care, prescription drugs, dental services, meals and nutritional counseling, social services, and transportation[1][2]
- Varies by: fixed

**How to apply:**
- Phone: (844) 945-0467 (InnovAge New Mexico PACE)[3]
- Phone: 505-916-1932 (InnovAge Albuquerque center)[7]
- In-person: 904 Las Lomas Rd NE, Albuquerque, NM 87102[3][7]
- Email: info@innovage.com[3]
- TTY: 711[3]

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- PACE is the **sole provider** of services once enrolled—participants cannot use other providers for covered services[2]
- Participants can withdraw from the program at any time[2]
- Geographic limitation: Only available in Albuquerque; families outside this service area cannot access the program[2][7]
- State certification of nursing home level of care is required before enrollment—this is not automatic and must be obtained separately[1][9]
- Medicaid recipients pay no monthly premium, but Medicare recipients may pay a monthly premium for additional coverage[2]
- No deductibles or co-pays in the program[2]
- Most PACE participants are dually eligible for both Medicare and Medicaid[4]

**Data shape:** PACE in New Mexico is severely geographically restricted to a single provider and location (Albuquerque). The program has no specified income or asset limits in available sources—eligibility appears to hinge primarily on age (55+), state certification of nursing home care need, and residency in the service area. Benefits are fixed and comprehensive rather than tiered. Critical information gaps: specific processing timelines, application forms, required documentation, and income/asset thresholds are not available in search results and would require direct contact with InnovAge or the New Mexico HCA.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hca.nm.gov/lookingforinformation/pace/ (New Mexico Human Services Department)[5]

---

### Community Benefit Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Requires full Medicaid coverage. For aged, blind, or disabled (2022 figures): single person - $10,092 annual income; two-person household - $15,137 annual income. Exact current limits vary by household size and require Medicaid eligibility check; ABD category has income up to ~$1,000/month single with 5% disregard plus asset test. Non-Medicaid eligible may access via registry based on need with limited slots.[1][2][3]
- Assets: Medicaid ABD: single - $2,000 max; two-person household - $3,000 max. Counts typical countable assets (cash, bank accounts, non-exempt property); exempts primary home (if intent to return), one vehicle, personal belongings, burial plots.[1]
- New Mexico resident
- U.S. citizen or legal alien
- Meet Nursing Facility Level of Care (NF LOC) criteria: daily assistance with 2+ activities of daily living (ADLs)
- Enrolled in a Medicaid Managed Care Organization (MCO)
- Proven need for long-term care to avoid nursing home
- For non-Medicaid: allocation from Central Registry

**Benefits:** Home and community-based long-term care services to remain at home instead of nursing home, including home health care financial assistance, personal care, adult day health, assisted living, and other supports based on individual care plan approved by MCO. Specific services vary by need; no fixed dollar/hour amount stated, allocated per NF LOC assessment.[1][2][4][6]
- Varies by: priority_tier

**How to apply:**
- If enrolled in Medicaid MCO: Contact your MCO care coordinator for assessment.
- If Medicaid but no MCO: Call 1-800-283-4465 to enroll in MCO.
- If not on Medicaid: Apply at yes.nm.gov or call 1-800-283-4465; for long-term services without full Medicaid, contact Aging & Long-Term Services Department Central Registry at 1-800-432-2080 or email abcbproviderenrollment@state.nm.us.
- Paper or in-person: NM Human Services Department field office.

**Timeline:** Not specified; assessment by MCO determines eligibility.
**Waitlist:** Central Registry waitlist for non-Medicaid eligible slots based on need; limited open positions.[1][5][7][9]

**Watch out for:**
- Must first qualify/enroll in full Medicaid (strict ABD income/asset limits) or get rare registry allocation; not direct access.
- Requires MCO enrollment; services only after NF LOC assessment.
- New participants must try Agency-Based CB (ABCB) for 120 days before switching to Self-Directed CB (SDCB).[4]
- 2022 income figures may be outdated; verify current Medicaid ABD limits.
- Limited slots for non-Medicaid via registry; high demand.
- Certain members get continuous NF LOC (no annual reassess since 2019), but criteria apply.[2]

**Data shape:** Tied to Medicaid MCOs with NF LOC functional test; two tracks (Medicaid-full vs. registry allocation); benefits via individualized MCO care plan; 120-day ABCB trial before self-direct option.

**Source:** https://www.hca.nm.gov/community-benefit-program/

---

### New Mexico Senior Farmers' Market Nutrition Program (SFMNP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older for non-Native Americans; 55 years or older for Native Americans[1][2][5][7]+
- Income: Household income at or below 185% of the federal poverty level, based on household size. Exact 2021-2022 example: $1,986 monthly for household of 1 (older guidelines; check current via official sources as levels update annually)[2][5]. Participation in SNAP, TEFAP, or CSFP may qualify without separate income test[5]. Full current table available via NM DOH or USDA guidelines[8]
- Assets: No asset limits mentioned in program guidelines[1][2][3][4][5]
- Must live in New Mexico[1][2]
- First-time and previous applicants must reapply annually to confirm eligibility[1]

**Benefits:** One-time annual benefit of up to $100 (2024) via electronic shopper card for locally grown fresh fruits, vegetables, herbs, and honey at participating farmers' markets and roadside stands. Older references note up to $50[1][2][4][5]
- Varies by: fixed

**How to apply:**
- Online: shopper.soliportal.com[1]
- Phone: (505) 469-0548, (505) 487-0904; also 575-528-5197 (office), 575-649-0754 (mobile)[1]
- Email: doh.fmnp@doh.nm.gov or DOH.FMNP@state.nm.us[1][5]
- In-person or paper: Any NM Department of Health (DOH) public health office WIC counter, local senior centers, AAA, or AARP offices statewide[1]

**Timeline:** Benefits issued within the month of July (historical); first-come, first-served[5]
**Waitlist:** First-come, first-served basis; may run out of funds (no formal waitlist specified)[1][5]

**Watch out for:**
- Different age thresholds: 55+ for Native Americans, 60+ for others—easy to miss[1][2][5][7]
- First-come, first-served; funds may deplete (open enrollment starts mid-February, e.g., Feb 15 for 2024)[1][5]
- Must reapply every year, even if previously eligible[1]
- Honey only for seniors (not WIC FMNP); only eligible fresh, local, unprocessed foods[2]
- Only authorized farmers/markets; no wholesalers[2][4]

**Data shape:** Age varies by Native American status; income at 185% FPL or proxy program enrollment (SNAP/CSFP/TEFAP); one-time fixed benefit; statewide with first-come funding cap

**Source:** https://www.nmwic.org/fmnp/[2]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level (FPL). Exact 2026 dollar amounts not specified in sources; contact local office to confirm based on current HHS poverty guidelines, which vary by household size (e.g., for 2025 reference: 1-person ~$19,000; 2-person ~$25,500 at 125% FPL—verify latest).[1][2][4]
- Unemployed
- U.S. citizen or authorized to work
- Priority to: veterans/qualifying spouses, age 65+, limited English/low literacy, rural residents, disabled, low employment prospects, failed One-Stop employment services, homeless/at risk.[2]

**Benefits:** Part-time subsidized training positions (typically 20 hours/week) at nonprofits/public agencies; modest wages paid directly by ALTSD; on-the-job training, job development, resume building, post-placement support. Examples: customer service, maintenance, teacher assistant, childcare, food prep, retail, shipping/receiving. Goal: transition to unsubsidized employment.[4][5]
- Varies by: priority_tier

**How to apply:**
- Contact NM Aging & Long-Term Services Department (ALTSD) via https://www.aging.nm.gov/aging-network/senior-employment-programs/ or local SCSEP office
- NICOA for eligible areas: https://www.nicoa.org/programs/scsep/ (covers NM)
- Goodwill NM: https://www.goodwillnm.org/seniors or call/walk-in to locations (e.g., 1030 18th Street NW)
- Find local provider via national locator or state workforce board.[1][2][4][5]

**Timeline:** Not specified; enrollment if eligible and no waitlist.
**Waitlist:** Possible depending on location and funding; varies by local availability and funding cycles (some 2025 pauses noted).[1]

**Watch out for:**
- Funding fluctuations may cause pauses/slowdowns (e.g., 2025 issues); local waitlists common; not guaranteed permanent job—focus is training to unsubsidized employment; priority groups get preference; separate from state-funded SEP (similar but general funds); physical exam post-enrollment.[1][2][4][7]
- Income test strictly 125% FPL—contact for exact table; open to all qualifying, not just Native American via NICOA.[2]

**Data shape:** Grantee-based with multiple providers (NICOA, Goodwill, ALTSD); priority tiers affect access; funding variability by region; no fixed asset limits or statewide wait times; rural/frontier county focus in NM.[2][3][4]

**Source:** https://www.aging.nm.gov/aging-network/senior-employment-programs/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Centennial Care Community Benefit Progra | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Community Benefit Program | benefit | state | deep |
| New Mexico Senior Farmers' Market Nutrit | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |

**Types:** {"benefit":4,"employment":1}
**Scopes:** {"state":3,"local":1,"federal":1}
**Complexity:** {"deep":5}

## Content Drafts

Generated 5 page drafts. Review in admin dashboard or `data/pipeline/NM/drafts.json`.

- **Centennial Care Community Benefit Program** (benefit) — 2 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Community Benefit Program** (benefit) — 6 content sections, 6 FAQs
- **New Mexico Senior Farmers' Market Nutrition Program (SFMNP)** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **fixed**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Centennial Care Community Benefit Program**: Tied to Medicaid MCOs with NFLOC assessment; two models (Agency-Based then optional Self-Directed); waitlist via Central Registry for non-Medicaid eligible
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE in New Mexico is severely geographically restricted to a single provider and location (Albuquerque). The program has no specified income or asset limits in available sources—eligibility appears to hinge primarily on age (55+), state certification of nursing home care need, and residency in the service area. Benefits are fixed and comprehensive rather than tiered. Critical information gaps: specific processing timelines, application forms, required documentation, and income/asset thresholds are not available in search results and would require direct contact with InnovAge or the New Mexico HCA.
- **Community Benefit Program**: Tied to Medicaid MCOs with NF LOC functional test; two tracks (Medicaid-full vs. registry allocation); benefits via individualized MCO care plan; 120-day ABCB trial before self-direct option.
- **New Mexico Senior Farmers' Market Nutrition Program (SFMNP)**: Age varies by Native American status; income at 185% FPL or proxy program enrollment (SNAP/CSFP/TEFAP); one-time fixed benefit; statewide with first-come funding cap
- **Senior Community Service Employment Program (SCSEP)**: Grantee-based with multiple providers (NICOA, Goodwill, ALTSD); priority tiers affect access; funding variability by region; no fixed asset limits or statewide wait times; rural/frontier county focus in NM.[2][3][4]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Mexico?
