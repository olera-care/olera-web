# Wisconsin Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 3.2m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 5 |
| New (not in our data) | 2 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |

## Program Types

- **financial**: 1 programs
- **advocacy**: 1 programs
- **employment**: 1 programs
- **service**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### SeniorCare

- **income_limit**: Ours says `$2825` → Source says `$25,536` ([source](https://www.dhs.wisconsin.gov/seniorcare/index.htm))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Prescription drugs and vaccines at participating pharmacies. Covers most FDA-approved drugs (generics preferred; prior authorization may be required for some). Coordinates with other insurance including Medicare Part D. Copays/deductibles by level:
- **Level 1**: No deductible/spenddown; $5 generic, $15 brand-name per prescription; $0 vaccines.
- **Level 2A**: $500 deductible/person (pay SeniorCare rate until met), then $5/$15 copays.
- **Level 2B**: $850 deductible/person (pay SeniorCare rate until met), then $5/$15 copays.
- **Level 3**: Monthly spenddown (income over 240% FPL), then $850 deductible/person (pay SeniorCare rate until met), then $5/$15 copays.[1][2][5]` ([source](https://www.dhs.wisconsin.gov/seniorcare/index.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/seniorcare/index.htm`

### Family Care

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 with physical, intellectual, or developmental disability[1][2][3][4][8]` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm[4]))
- **income_limit**: Ours says `$2901` → Source says `$2,000` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm[4]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community Based Services (HCBS) via managed care organizations (CMOs), including personal care, respite care, home modifications, assisted living, memory care, and long-term care support instead of institutional care; no fixed dollar amounts or hours specified, tailored to assessed needs[2][3][7]` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/familycare/apply.htm[4]`

### IRIS (Include, Respect, I Self-Direct)

- **min_age**: Ours says `65` → Source says `18` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **income_limit**: Ours says `$2901` → Source says `$3,525` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Self-directed Medicaid long-term care supports and services within an individualized budget (amount based on functional needs from LTC FS); covers DHS-approved services like personal care, goods/supports for daily living, adult day care; participant chooses/manages services, hires providers[3][5][6]. No fixed dollar amounts or hours specified; budget varies by assessed needs.` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/iris/index.htm`

## New Programs (Not in Our Data)

- **Elder Benefit Specialist (EBS) Program** — advocacy ([source](https://www.dhs.wisconsin.gov/benefit-specialists/ebs.htm))
  - Shape notes: no income/asset test; statewide via decentralized local ADRC/county offices; advocacy-focused, not entitlement program
- **Wisconsin Senior Employment Program (WISE)** — employment ([source](https://www.dhs.wisconsin.gov/publications/p00409-2024-2027.pdf (Wisconsin SCSEP State Plan 2024-2027); https://www.wisconsinjobcenter.org/ow/ (DWD Job Center)))
  - Shape notes: Statewide but regionally administered via multiple workforce boards and subgrantees; priority tiers affect access; income test at 125% poverty (varies by household size annually); no asset test; part-time hours fixed at ~20/week

## Program Details

### SeniorCare


**Eligibility:**
- Age: 65+
- Income: Income-based tiers (updated annually based on Federal Poverty Level - FPL; 2024 figures from official sources):
Level 1: ≤160% FPL (Individual: ≤$25,536; Couple: ≤$34,624)
Level 2A: >160%-≤200% FPL (Individual: $25,537–$31,920; Couple: $34,625–$43,280)
Level 2B: >200%-≤240% FPL (Individual: $31,921–$38,304; Couple: $43,281–$51,936)
Level 3: >240% FPL (no upper limit; spenddown required equal to amount over 240% FPL, calculated monthly). For married applicants living with spouse, combined spousal income is used even if only one applies.[1][2][5]
- Assets: No asset limits or tests apply.[2][3]
- Wisconsin resident
- U.S. citizen or qualifying immigrant
- Not enrolled in full-benefit Medicaid/BadgerCare Plus (exceptions: Qualified Medicare Beneficiaries, QI-1/QI-2, SLMB, Tuberculosis-Related Medicaid, unmet Medicaid deductible)
- Annual renewal required; $30 annual enrollment fee per person

**Benefits:** Prescription drugs and vaccines at participating pharmacies. Covers most FDA-approved drugs (generics preferred; prior authorization may be required for some). Coordinates with other insurance including Medicare Part D. Copays/deductibles by level:
- **Level 1**: No deductible/spenddown; $5 generic, $15 brand-name per prescription; $0 vaccines.
- **Level 2A**: $500 deductible/person (pay SeniorCare rate until met), then $5/$15 copays.
- **Level 2B**: $850 deductible/person (pay SeniorCare rate until met), then $5/$15 copays.
- **Level 3**: Monthly spenddown (income over 240% FPL), then $850 deductible/person (pay SeniorCare rate until met), then $5/$15 copays.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Phone: Call SeniorCare Customer Service at 800-657-2038 to request application
- Online: Print form at https://www.dhs.wisconsin.gov/seniorcare
- Mail: Send completed application to address on form
- Apply starting month of 65th birthday or anytime after; coverage starts month after approval

**Timeline:** 4-6 weeks[6]

**Watch out for:**
- Cannot enroll if on full-benefit Medicaid/BadgerCare Plus (check exceptions carefully)
- Income includes spousal income for married couples even if only one applies
- Must renew annually and pay $30 fee or lose coverage
- Level 3 requires ongoing monthly spenddown calculation (not one-time)
- Coverage starts month AFTER approval, not immediately
- Older sources [4][6] show outdated FPL figures; always check current at official site
- Coordinates as secondary payer with Medicare/other insurance—may affect out-of-pocket

**Data shape:** Tiered by income level with specific deductibles/copays scaling by FPL percentage; no assets test; statewide with pharmacy-based delivery; annual fee and renewal; spousal income aggregation unique for single applicants

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/seniorcare/index.htm

---

### Elder Benefit Specialist (EBS) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; open to all regardless of income.
- Assets: No asset limits; open to all regardless of assets.
- Live in Wisconsin.

**Benefits:** Free, confidential counseling, assistance, and advocacy on public/private benefits (e.g., Social Security, SSI, SSDI, Medicaid, Medicare, SeniorCare, FoodShare, housing/utilities, debt collection, evictions, tenant rights, consumer issues); help with applications, paperwork, appeals, comparing options, and legal rights supervised by elder law attorneys.

**How to apply:**
- Call statewide helpline 1-844-WIS-ADRC (1-844-947-2372)
- Visit FindMyADRC.org to find local Aging and Disability Resource Center (ADRC) or tribal partner
- Contact local county aging office, ADRC, or human/social services department in person or by email/phone (locations vary by county)

**Timeline:** No formal processing; services provided upon contact as available.

**Watch out for:**
- Services are assistance/advocacy only, not direct benefits or cash; free but donations encouraged (never required); family/friends/caregivers can participate with permission; not for selling products—unbiased; supervised by attorneys but not full legal representation unless referred.

**Data shape:** no income/asset test; statewide via decentralized local ADRC/county offices; advocacy-focused, not entitlement program

**Source:** https://www.dhs.wisconsin.gov/benefit-specialists/ebs.htm

---

### Wisconsin Senior Employment Program (WISE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in sources; families must verify current federal poverty guidelines (e.g., via HHS.gov) and confirm ≤125% threshold with local provider[1][2][3][4][6].
- Assets: No asset limits mentioned in sources[1][2][3][4][6].
- Legal resident of Wisconsin[1][3][4]
- Unemployed[1][2][3][4]
- Poor employment prospects (implied by program focus)[6]

**Benefits:** Part-time, paid community service training positions (typically 20 hours per week) at host agencies; paid at the highest of federal, state, or local minimum wage; includes skills training, work experience for unsubsidized employment transition, individual job counseling, comprehensive assessment, yearly physical exams, and access to employment opportunities[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: (920) 229-5557 (Fox Valley Workforce Development Board)[1]
- Email: info@fvwdb.com[1]
- Email: detwise@dwd.wisconsin.gov (DWD)[3]
- Phone: (608) 242-4928 (Dane County/GWAAR)[5]
- Phone: (608) 243-5670 (GWAAR brochure)[7]
- In-person: Local providers such as Job Center of Wisconsin, Employ Milwaukee, Dane County Job Center (e.g., 1819 Aberg Ave., Madison WI 53704)[3][4][5]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by local provider capacity

**Watch out for:**
- Enrollment priority given to veterans/qualified spouses, then those over 65—others may face lower priority[2]
- Temporary/part-time training (not permanent jobs); goal is transition to unsubsidized employment[1][2][6]
- Income limit strictly ≤125% poverty level (family income, not individual)[1][2][6]
- Must be actively unemployed and seeking work; not for current employees[1][4]
- Regional providers differ—contact local office, as no centralized statewide application[1][3][5]
- Paid at minimum wage, not higher despite experience[2][4]

**Data shape:** Statewide but regionally administered via multiple workforce boards and subgrantees; priority tiers affect access; income test at 125% poverty (varies by household size annually); no asset test; part-time hours fixed at ~20/week

**Source:** https://www.dhs.wisconsin.gov/publications/p00409-2024-2027.pdf (Wisconsin SCSEP State Plan 2024-2027); https://www.wisconsinjobcenter.org/ow/ (DWD Job Center)

---

### Family Care


**Eligibility:**
- Age: 65 or older, or 18-64 with physical, intellectual, or developmental disability[1][2][3][4][8]+
- Income: Must meet Wisconsin Medicaid financial eligibility (specific dollar amounts and household size tables not detailed in sources; typically under Medicaid limits, e.g., single applicants under $2,000 in countable assets as of 2025 with exemptions)[2][3]
- Assets: Medicaid asset limits apply (e.g., typically less than $2,000 for single applicants); exemptions include primary residence and personal vehicle[2]
- Wisconsin resident in a participating county/region[1][2][3][4]
- Financially eligible for Medicaid[1][3][4][8]
- Functionally eligible: Nursing Facility Level of Care (NFLOC) determined by Wisconsin Adult Long-Term Care Functional Screen (LTC FS), requiring assistance with ADLs (e.g., bathing, eating, mobility) and/or IADLs (e.g., meal prep, money management)[1][2][3][4]

**Benefits:** Home and Community Based Services (HCBS) via managed care organizations (CMOs), including personal care, respite care, home modifications, assisted living, memory care, and long-term care support instead of institutional care; no fixed dollar amounts or hours specified, tailored to assessed needs[2][3][7]
- Varies by: region

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Tribal ADRS for screening and assistance: find via ADRC locator[2][4][5]
- Complete Long Term Care Functional Screen with ADRC[4]
- Apply for Medicaid online or paper form submitted to income maintenance agency (ADRC can help)[4]
- ADRC finalizes enrollment: choose program, CMO, sign form[4]

**Timeline:** Not specified in sources
**Waitlist:** No waitlists for program participation[3]

**Watch out for:**
- Not statewide—must live in a participating county/region; check local availability[1][3][4]
- Requires both financial Medicaid eligibility AND functional screening (NFLOC via LTC FS)—many miss the functional need assessment[1][2][3][4]
- Enrollment through specific CMOs available in your area; choose during process[4][5]
- Medicare beneficiaries may still qualify if meeting criteria, but must meet Medicaid rules[9]
- Persons with disabilities enrolled before 65 can continue post-65[3]

**Data shape:** Regionally restricted to participating counties with varying CMOs/providers; eligibility ties directly to Medicaid financial rules plus mandatory functional screen; no waitlists but not statewide; benefits via managed care HCBS waiver

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/familycare/apply.htm[4]

---

### IRIS (Include, Respect, I Self-Direct)


**Eligibility:**
- Age: 18+
- Income: Must meet Medicaid financial eligibility (no specific IRIS income limits beyond Medicaid; for context, minimum income allowance $3,525/month and maximum $3,948/month effective 7/1/25–6/30/26 for spousal impoverishment). Income limits follow standard Wisconsin Medicaid rules, which vary by household size but not detailed here[1][2].
- Assets: Follows Medicaid asset rules; home equity limit of $750,000 if living in home or intent to return (2025). Exemptions include: home if applicant lives there or has intent to return (equity ≤$750,000), spouse lives in home, minor child (<18) lives in home, disabled child lives in home[2].
- Wisconsin resident
- U.S. citizen or qualifying immigrant
- Nursing Home (NH) or Intermediate Care Facility for Individuals with Intellectual/Developmental Disabilities (ICF-IID) level of care via Wisconsin Adult Long-Term Care Functional Screen (LTC FS), assessing ADLs/IADLs
- Meet Medicaid non-financial criteria (cooperate with medical support, third-party liability, SSN, verification, health insurance requirements)
- Reside in program-eligible setting (own home or residential setting; cannot be in skilled nursing facility or community-based residential facility)
- Need for long-term care supports and services
- Eligible population: older adults (65+) or adults 18-64 with physical, developmental, or intellectual disabilities (continues post-65 if enrolled earlier)

**Benefits:** Self-directed Medicaid long-term care supports and services within an individualized budget (amount based on functional needs from LTC FS); covers DHS-approved services like personal care, goods/supports for daily living, adult day care; participant chooses/manages services, hires providers[3][5][6]. No fixed dollar amounts or hours specified; budget varies by assessed needs.
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Tribal ADRS: dhs.wisconsin.gov/adrc/consumer/index.htm or dhs.wisconsin.gov/adrc/consumer/tribes.htm[3][6]
- Complete Long-Term Care Functional Screen with ADRC/ADRS
- Apply for Medicaid: online or paper form submitted to income maintenance agency (assistance from ADRC/ADRS)[3]
- Select Fiscal Employer Agent (FEA) with ADRC/ADRS help for payroll/taxes[3][6]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may exist due to program caps (inferred from waiver nature, but not explicit)

**Watch out for:**
- Must live in eligible community setting (own home/residential); ineligible if in nursing facility or certain residential facilities[1][6]
- Self-direction responsibilities: participant manages budget, hires/fires providers, follows rules; FEA handles payroll but not service provision[3][6]
- Financial eligibility ties to Medicaid (may require cost-sharing); pre-existing Medicaid speeds process[1][3]
- Functional screen required for NH/ICF-IID level of care; not just any disability[1][2]
- All providers must enroll with ForwardHealth Portal[4]

**Data shape:** Self-directed budget model varies by functional assessment (LTC FS) and priority tier; county-based ADRC administration with regional providers/agents; no standalone income/asset limits (uses Medicaid); setting-restricted

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/iris/index.htm

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| SeniorCare | benefit | state | deep |
| Elder Benefit Specialist (EBS) Program | resource | state | simple |
| Wisconsin Senior Employment Program (WIS | employment | state | deep |
| Family Care | benefit | local | deep |
| IRIS (Include, Respect, I Self-Direct) | benefit | state | deep |

**Types:** {"benefit":3,"resource":1,"employment":1}
**Scopes:** {"state":4,"local":1}
**Complexity:** {"deep":4,"simple":1}

## Content Drafts

Generated 5 page drafts. Review in admin dashboard or `data/pipeline/WI/drafts.json`.

- **SeniorCare** (benefit) — 3 content sections, 6 FAQs
- **Elder Benefit Specialist (EBS) Program** (resource) — 1 content sections, 6 FAQs
- **Wisconsin Senior Employment Program (WISE)** (employment) — 3 content sections, 6 FAQs
- **Family Care** (benefit) — 4 content sections, 6 FAQs
- **IRIS (Include, Respect, I Self-Direct)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **not_applicable**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **SeniorCare**: Tiered by income level with specific deductibles/copays scaling by FPL percentage; no assets test; statewide with pharmacy-based delivery; annual fee and renewal; spousal income aggregation unique for single applicants
- **Elder Benefit Specialist (EBS) Program**: no income/asset test; statewide via decentralized local ADRC/county offices; advocacy-focused, not entitlement program
- **Wisconsin Senior Employment Program (WISE)**: Statewide but regionally administered via multiple workforce boards and subgrantees; priority tiers affect access; income test at 125% poverty (varies by household size annually); no asset test; part-time hours fixed at ~20/week
- **Family Care**: Regionally restricted to participating counties with varying CMOs/providers; eligibility ties directly to Medicaid financial rules plus mandatory functional screen; no waitlists but not statewide; benefits via managed care HCBS waiver
- **IRIS (Include, Respect, I Self-Direct)**: Self-directed budget model varies by functional assessment (LTC FS) and priority tier; county-based ADRC administration with regional providers/agents; no standalone income/asset limits (uses Medicaid); setting-restricted

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Wisconsin?
