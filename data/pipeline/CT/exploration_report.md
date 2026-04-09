# Connecticut Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 29s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 6 |
| Programs deep-dived | 6 |
| New (not in our data) | 4 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 4 programs
- **financial**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Connecticut Home Care Program for Elders (CHCPE)

- **income_limit**: Ours says `$1370` → Source says `$2,742` ([source](https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services including personal care, homemaker, adult day care, respite care, medication management. Hours vary: State-funded (Category 2) typically 10-20 hours/week; Medicaid-funded (Category 3) up to 70 hours/week or live-in care. Case management and oversight provided.[2][6]` ([source](https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe`

### CT Energy Assistance Program (CEAP)

- **income_limit**: Ours says `$2800` → Source says `$47,764` ([source](https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Basic benefit: $295-$595 (standard), $345-$645 (vulnerable household), paid directly to vendor for primary heat (oil, gas, electric, propane, etc.). Crisis benefit: $425 per occurrence (up to 3x) for deliverable fuel households at risk of running out. Rental assistance (heat in rent): $75-$125. Amounts vary by income and vulnerability.[4][5]` ([source](https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating`

## New Programs (Not in Our Data)

- **CHOICES** — service ([source](https://portal.ct.gov/ADS-CHOICES))
  - Shape notes: No income/asset tests for core counseling; services uniform statewide but delivered regionally via 5 AAAs; focuses on Medicare navigation and eligibility screening for related aid programs like MSP (no assets, high income threshold).
- **Connecticut Statewide Respite Care Program (CSRCP)** — service ([source](https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/healthy-living-services/connecticut-statewide-respite-care[8]; Regulations: https://eregulations.ct.gov/eRegsPortal/Browse/getDocument?guid=%7B30A0E155-0200-C294-AF6B-15887B1A99E2%7D[2]))
  - Shape notes: Administered regionally via AAAs with annually adjusted income/asset limits (no household size table); funding capped at $7,500/year with priority tiers; self-directed care option; co-pay required
- **Connecticut State Supplement for the Aged, Blind, and Disabled (AABD)** — financial ([source](https://portal.ct.gov/dss))
  - Shape notes: Supplemental cash only for those with existing income sources; varies by living arrangement (e.g., housing allowance, boarding home); asset lien on home; income test tied to SSI multiple with needs assessment
- **Weatherization Assistance Program** — service ([source](https://portal.ct.gov/DEEP/Energy/Weatherization/Weatherization-in-Connecticut))
  - Shape notes: Income at 60% SMI (table available via related programs); priority tiers for elderly/disabled/families; sub-state admin by CAAs with spend caps varying by single/multi-family; links to CEAP intake.

## Program Details

### CHOICES

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare-eligible individuals, families, and caregivers of all ages and income levels.[2][9]
- Assets: No asset limits or tests apply to CHOICES counseling services.[2][6]
- Medicare-eligible: US citizens or permanent residents aged 65+; certain younger people with disabilities approved by Social Security Administration (e.g., collecting SSDI for 24 months or 40 quarters of work).[4][9]

**Benefits:** Free, unbiased, one-on-one counseling on Medicare (Parts A, B, C, D), Medicare Supplement, prescription drug coverage; enrollment assistance and plan comparisons; eligibility screening and application help for cost-assistance programs like Medicaid, Medicare Savings Program (MSP), Low-Income Subsidy (Extra Help/LIS); information on rights, fraud detection, and related insurance.[2][5][7][9]

**How to apply:**
- Phone: 1-800-994-9422 (statewide CHOICES line to speak with a counselor).[5][9]
- Website: https://portal.ct.gov/ADS-CHOICES (official program page).[5][9]
- Local Area Agencies on Aging (AAA): Contact one of 5 AAAs for in-person or phone counseling (e.g., 203-757-5449 for Western CT).[10]
- Benefits Check Up tool: Confidential online screening via local counselors or websites.[3]

**Timeline:** Immediate counseling available by phone or appointment; no formal processing for services.[9]

**Watch out for:**
- Not a direct benefits program—provides counseling and application assistance only, not financial aid or healthcare itself.[9]
- Counselors are certified volunteers or staff, not insurance agents, and do not sell plans.[1][4]
- For cost-assistance like MSP/LIS, apply through CHOICES but note MSP has higher income limits ($85,000/year possible for full Medicaid) and no asset test in CT—prefer MSP over direct LIS.[6]
- Open enrollment for Medicare plans: Oct 15-Dec 7.[8]

**Data shape:** No income/asset tests for core counseling; services uniform statewide but delivered regionally via 5 AAAs; focuses on Medicare navigation and eligibility screening for related aid programs like MSP (no assets, high income threshold).

**Source:** https://portal.ct.gov/ADS-CHOICES

---

### Connecticut Home Care Program for Elders (CHCPE)


**Eligibility:**
- Age: 65+
- Income: Varies by funding category. State-funded CHCPE (Category 2): No income limit, but sliding fee scale and possible 3% cost share based on income. Medicaid-funded CHCPE (Category 3): Typically $2,742/month or less (general threshold); for 1915(i) State Plan, 150% FPL ($1,956.25/month in 2025). Spouse's income does not count for applicant. No full table by household size provided; asset-dependent limits apply.[1][3][5][6]
- Assets: Varies by category and region/provider. Examples: Single applicant $35,766; married $47,688 (WCAAA-specific). Exempt: primary residence, essential personal items. Other assets count toward limits, which depend on income level and living situation. Higher assets may still qualify for state-funded with contributions.[1][5][7]
- Connecticut resident.
- At risk of nursing home placement or meet Nursing Facility Level of Care (NFLOC): Assistance needed with at least 1 ADL (state-funded minimum; e.g., bathing, dressing, eating, toileting, transferring, medications); 3+ ADLs for higher care.
- Functional assessment required.

**Benefits:** Home and community-based services including personal care, homemaker, adult day care, respite care, medication management. Hours vary: State-funded (Category 2) typically 10-20 hours/week; Medicaid-funded (Category 3) up to 70 hours/week or live-in care. Case management and oversight provided.[2][6]
- Varies by: priority_tier

**How to apply:**
- Mail or fax application to: Department of Social Services, Community Options, 9th Floor, 55 Farmington Avenue, Hartford, CT 06105; Fax: 860-424-4963.
- Contact local Area Agency on Aging or Connecticut Department of Social Services (DSS).
- Download form from MyPlaceCT.org or DSS site.
- Phone for hearing/visual impairments via DSS (specific numbers not listed; call main DSS line).

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; services may start quickly for state-funded, but Medicaid waiver has potential delays similar to nursing home rules.[6]

**Watch out for:**
- Multiple categories (state-funded vs. Medicaid-funded) with different income/asset rules, hours of care, and processes—must determine which applies.
- No strict income limit but sliding fees/3% cost share for state-funded; assets exempt like home but others count.
- Spouse income excluded, but couples with high savings may need Medicaid waiver (5-year lookback risk).
- Exclusions in some pilots (e.g., mental illness primary, Medicaid-eligible).
- Functional need varies: 1+ ADL minimum, but 3+ for NFLOC/higher care.
- Regional asset examples differ; confirm locally.

**Data shape:** Tiered by funding source (state vs. Medicaid categories 2/3) with varying care hours, no uniform income limit but asset/income-dependent fees, regional provider variations in thresholds.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe

---

### Connecticut Statewide Respite Care Program (CSRCP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Varies by source and date (updated annually); examples: ≤$55,561/year (2023)[1], ≤$57,339/year (recent)[6], ≤$58,772/year (recent)[3]. Income includes Social Security (minus Medicare Part B), SSI, Railroad Retirement, veterans' benefits, and other payments. No household size variation specified; applies to individual with dementia.
- Assets: Liquid assets ≤$147,715 (2023)[1], ≤$152,442 (recent)[6], ≤$156,253 (recent)[3]. Liquid assets typically include cash, bank accounts, stocks; exemptions not detailed but primary residence, one vehicle often exempt in similar programs.
- Diagnosis of Alzheimer's or related irreversible/deteriorating dementia (e.g., multi-infarct, Parkinson's, Lewy Body, Huntington's, Normal Pressure Hydrocephalus, Pick's); requires Physician Statement certifying medical exam ruling out reversible causes like depression or drug interactions[2][3][6]
- Not enrolled in Connecticut Homecare Program for Elders[1][3]
- Caregiver stress/need prioritized (e.g., primary caregiver with impairments, combative/non-compliant individual)[2]

**Benefits:** Subsidizes respite services up to $7,500/year (contingent on funding and care manager-assessed need)[1][3][8]; specific services: adult day care, home health aide, personal care assistant, homemaker, companion, nursing care, personal emergency response system, short-term nursing home/assisted living (max 30 days out-of-home respite excluding adult day care)[1][3][4]; also care planning, info/support; 20% co-pay required (waivable for hardship)[3][6]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) or sponsor agency serving your town (statewide via 6 AAAs)[1][2][3]
- Phone examples: Senior Resources (Eastern CT) 860-887-3561[3], WCAAA (Western CT) 203-757-5449 or 800-994-9422[6]
- Application submitted to sponsor agency; self-directed option available[3][6]

**Timeline:** Sponsor agency performs assessment and makes written eligibility determination (timeline not specified; contact local AAA)[2]
**Waitlist:** Funding contingent on availability; potential wait due to limited funds (not explicitly stated)[1][3]

**Watch out for:**
- Income/asset limits update annually (e.g., 2023: $55,561/$147,715; check current with local AAA)[1][3][6]
- Mandatory 20% co-pay (waivable only for hardship)[3][6]
- Funding limited—not guaranteed; prioritized by need/caregiver stress[1][2]
- Cannot combine with CT Homecare for Elders[1][3]
- Physician must certify irreversible dementia (not generic)[2]
- Providers cannot be spouse/conservator (relatives possible with approval)[4]

**Data shape:** Administered regionally via AAAs with annually adjusted income/asset limits (no household size table); funding capped at $7,500/year with priority tiers; self-directed care option; co-pay required

**Source:** https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/healthy-living-services/connecticut-statewide-respite-care[8]; Regulations: https://eregulations.ct.gov/eRegsPortal/Browse/getDocument?guid=%7B30A0E155-0200-C294-AF6B-15887B1A99E2%7D[2]

---

### Connecticut State Supplement for the Aged, Blind, and Disabled (AABD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Gross income must not exceed three times the current maximum SSI amount per eligible person (exact dollar amount varies; compared to monthly needs standard). Net income must be below the state-established standard of living. Must have another source of income (e.g., SSI, SSDI, Social Security, Veterans benefits) that is supplemental—either receiving SSI or income exceeds SSI standard but below state need standard[2][6][7][8].
- Assets: Assets cannot exceed $1,600 for an individual or $2,400 for a couple. Counts liquid assets; if owning a home, a lien is placed on the home. Exemptions not fully detailed in sources[6].
- Aged (65+), blind, or disabled (meets SSI functional criteria for age 65+, blindness, or disability)
- Connecticut resident
- Must have another source of income such as Social Security, SSI, or Veterans benefits[2][6][7][8]

**Benefits:** Cash assistance that supplements other income to meet basic needs. Includes housing allowance (maximum $400 for living alone; $200 for living with others) plus basic needs items, minus countable income. Amount determined by comparing income to monthly needs; higher income limit if living in boarding home or Residential Care Home (RCH)[7][9].
- Varies by: living_arrangement|income

**How to apply:**
- Contact local Department of Social Services (DSS) office (phone numbers vary by region; statewide info at portal.ct.gov/dss)
- Apply through DSS (online via portal.ct.gov/dss, phone, mail, or in-person at local offices)
- No specific form name listed; DSS handles via standard application process[5][7]

**Timeline:** Not specified in sources

**Watch out for:**
- Must have other income to supplement—cannot be primary income source; not for those with no income[2][6]
- Homeowners face a lien on the home[6]
- Income limit is 3x SSI maximum, but benefit only if below state need standard after detailed financial review[7]
- Functional eligibility mirrors SSI (aged, blind, disabled); not automatic for low-income elderly without disability[2]
- Confused with SNAP; this is cash supplement, not food benefits[1][4]

**Data shape:** Supplemental cash only for those with existing income sources; varies by living arrangement (e.g., housing allowance, boarding home); asset lien on home; income test tied to SSI multiple with needs assessment

**Source:** https://portal.ct.gov/dss

---

### CT Energy Assistance Program (CEAP)


**Eligibility:**
- Income: Annual gross household income at or below 60% of state median income. Households receiving SNAP, SSI, TANF/TFA, State Supplement, or Refugee Cash Assistance are automatically income-eligible. Table by household size: 1: $47,764; 2: $62,460; 3: $77,157; 4: $91,854; 5: $106,550; 6: $121,247; 7: $124,002; 8: $126,758 (adds ~$2,756 per additional person). Vulnerable households (e.g., elderly, disabled, children under 6) qualify for higher benefits.[1][2][5]
- Assets: No liquid assets test for the 2025-2026 program year.[5]
- Connecticut resident.
- Social Security Number required for each household member (exceptions rare).
- US citizens, emancipated minors, or qualified aliens.
- Proof of income if not categorically eligible (e.g., last 30 days/4 weeks pay stubs, Social Security award letter, self-employment IRS 1040).[1][2][3]

**Benefits:** Basic benefit: $295-$595 (standard), $345-$645 (vulnerable household), paid directly to vendor for primary heat (oil, gas, electric, propane, etc.). Crisis benefit: $425 per occurrence (up to 3x) for deliverable fuel households at risk of running out. Rental assistance (heat in rent): $75-$125. Amounts vary by income and vulnerability.[4][5]
- Varies by: household_size|priority_tier

**How to apply:**
- Online via portal.ct.gov/dss (contactless applications available).
- Phone: Regional providers e.g., New Opportunities: (203) 756-8151 (Waterbury), (203) 235-0278 (Meriden), (860) 496-0622 (Torrington), (860) 738-9138 (Winsted); statewide via 211.
- In-person/mail through local community action agencies or DSS offices (varies by region).
- Application window: Sept 1, 2025 - May 29, 2026 (gas/electric); fuel deliveries from Nov 1.[2][4][5]

**Timeline:** Standard processing not specified; prioritized crisis cases (deliverable fuel, imminent shutoff): fuel delivery authorization within 18 hours of eligibility determination.[5]
**Waitlist:** Benefits available until annual funds exhausted (no formal waitlist mentioned).[4]

**Watch out for:**
- Must apply during open window (Sept-May); funds run out annually.
- Social Security income requires award letter (DSS can't verify directly).
- Everyone needs electric bill, even non-electric heat.
- Crisis benefit only for deliverable fuels and imminent crisis.
- Vulnerable status (elderly/disabled/child) unlocks higher benefits—don't miss designating.
- Renters with heat included get smaller rental assistance, not full heating benefit.

**Data shape:** Benefits tiered by income/vulnerability with fixed ranges; no asset test; regional administration with local contacts; categorical eligibility for DSS benefit recipients; prioritized crisis for fuel households.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: 60% of State Median Income (SMI). Specific amounts (from related HES-IE program using same threshold): 1: Under $39,027; 2: Under $51,036; 3: Under $63,044; 4: Under $75,052; 5: Under $87,061; 6: Under $99,069; 7: Under $101,320; 8: Under $103,572. Amounts may adjust annually.[1][3]
- Assets: No asset limits mentioned in sources.[1][2]
- Priority for elderly (60+), persons with disabilities, families with children, high-energy users, high energy burden (6%+ of income on energy).[1][5]
- Home not weatherized by WAP, LIHEAP, HUD, or USDA in last 15 years.[1]
- Home not for sale/listed for sale within 6 months of work completion, not in foreclosure or loan mediation.[1][5]
- Multi-family: At least 2/3 tenants income-eligible.[1]
- Landlords of rentals may contribute 20% of material costs, up to $500 per unit.[5]

**Benefits:** Free energy audit, weatherization measures including air sealing, insulation (attic/sidewall), heating system tune-ups/repairs, blower door guided air-sealing, water-saving measures, health/safety inspections. Single-family max: $10k energy measures, $2.5k health/safety, $2.5k incidental repairs (total $15k without review). Multi-family max: $10k energy, $1.5k health/safety, $2.5k incidental.[1][5][6]
- Varies by: household_size|priority_tier|single_vs_multi_family

**How to apply:**
- Joint with Connecticut Energy Assistance Program (CEAP): Call 2-1-1 for local intake site, request Weatherization Card/Referral Form.[1]
- Direct: Email DEEP.Weatherization@ct.gov.[1][2]
- Through statewide Community Action Agency (CAA) network or local non-profits.[1]

**Timeline:** Not specified in sources.
**Waitlist:** Possible deferrals leading to other programs like REPS; priority for vulnerable households may affect timing.[1][8]

**Watch out for:**
- Joint application via CEAP (call 2-1-1) rather than standalone; many confuse with utility HES-IE (same income but separate, ratepayer-funded).[1][3]
- Home eligibility strict: No recent weatherization (15 years), no sale/foreclosure.[1]
- Priority groups get preference; others may wait or get deferred to HES-IE/REPS.[1][8]
- Landlord contribution for rentals.[5]
- Annual renewal required.[2]

**Data shape:** Income at 60% SMI (table available via related programs); priority tiers for elderly/disabled/families; sub-state admin by CAAs with spend caps varying by single/multi-family; links to CEAP intake.

**Source:** https://portal.ct.gov/DEEP/Energy/Weatherization/Weatherization-in-Connecticut

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| CHOICES | resource | state | simple |
| Connecticut Home Care Program for Elders | benefit | state | deep |
| Connecticut Statewide Respite Care Progr | benefit | state | deep |
| Connecticut State Supplement for the Age | benefit | state | deep |
| CT Energy Assistance Program (CEAP) | benefit | state | deep |
| Weatherization Assistance Program | benefit | federal | medium |

**Types:** {"resource":1,"benefit":5}
**Scopes:** {"state":5,"federal":1}
**Complexity:** {"simple":1,"deep":4,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/CT/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 1 programs
- **priority_tier**: 2 programs
- **living_arrangement|income**: 1 programs
- **household_size|priority_tier**: 1 programs
- **household_size|priority_tier|single_vs_multi_family**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **CHOICES**: No income/asset tests for core counseling; services uniform statewide but delivered regionally via 5 AAAs; focuses on Medicare navigation and eligibility screening for related aid programs like MSP (no assets, high income threshold).
- **Connecticut Home Care Program for Elders (CHCPE)**: Tiered by funding source (state vs. Medicaid categories 2/3) with varying care hours, no uniform income limit but asset/income-dependent fees, regional provider variations in thresholds.
- **Connecticut Statewide Respite Care Program (CSRCP)**: Administered regionally via AAAs with annually adjusted income/asset limits (no household size table); funding capped at $7,500/year with priority tiers; self-directed care option; co-pay required
- **Connecticut State Supplement for the Aged, Blind, and Disabled (AABD)**: Supplemental cash only for those with existing income sources; varies by living arrangement (e.g., housing allowance, boarding home); asset lien on home; income test tied to SSI multiple with needs assessment
- **CT Energy Assistance Program (CEAP)**: Benefits tiered by income/vulnerability with fixed ranges; no asset test; regional administration with local contacts; categorical eligibility for DSS benefit recipients; prioritized crisis for fuel households.
- **Weatherization Assistance Program**: Income at 60% SMI (table available via related programs); priority tiers for elderly/disabled/families; sub-state admin by CAAs with spend caps varying by single/multi-family; links to CEAP intake.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Connecticut?
