# New Jersey Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 32s)

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
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |

## Program Types

- **financial**: 4 programs
- **service**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Senior Freeze (Property Tax Reimbursement)

- **min_age**: Ours says `65` → Source says `65 or older as of December 31 of the application year, OR receiving federal Social Security disability benefits, OR receiving Railroad Retirement disability benefits[6]` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **income_limit**: Ours says `$157000` → Source says `$163,050` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Reimbursement for property tax or mobile home park site fee increases above your base year amount. You receive the difference between your base year (first year of eligibility) property tax and current year property tax, as long as current year is higher[1]` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/treasury/taxation/ptr/`

### PAAD (Pharmaceutical Assistance to the Aged and Disabled)

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 and receiving Social Security Title II Disability benefits` ([source](www.aging.nj.gov (NJ Division of Aging Services) or NJ SAVE webpage))
- **income_limit**: Ours says `$31500` → Source says `$54,943` ([source](www.aging.nj.gov (NJ Division of Aging Services) or NJ SAVE webpage))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `$5 copay per generic drug; $7 copay per brand-name drug (PAAD covers remainder after Medicare Part D where applicable); PAAD pays monthly premium for certain basic Part D plans at/below regional benchmark (up to $5 over in some cases with no deductible); for Medicare Advantage with Part D, contributes up to regional benchmark toward drug portion of premium. Covers FDA-approved drugs on formulary[4][6]` ([source](www.aging.nj.gov (NJ Division of Aging Services) or NJ SAVE webpage))
- **source_url**: Ours says `MISSING` → Source says `www.aging.nj.gov (NJ Division of Aging Services) or NJ SAVE webpage`

## New Programs (Not in Our Data)

- **Stay NJ** — financial ([source](https://www.nj.gov/treasury/taxation/ptr/eligibility.shtml and propertytaxrelief.nj.gov[4]))
  - Shape notes: Stay NJ is a simplified program compared to Senior Freeze: it has a much higher income limit ($500,000 vs. $172,475), no asset limits mentioned, and provides a straightforward 50% property tax credit up to $6,500. However, it explicitly excludes mobile homeowners and requires full-year ownership/occupancy. The program is designed to incentivize seniors to remain in New Jersey and can be combined with ANCHOR and Senior Freeze through a single application (Form PAS-1), though benefits are capped across all three programs combined.
- **JACC (Jersey Assistance for Community Caregiving)** — service ([source](https://www.nj.gov/humanservices/doas/services/a-k/jacc/[2]))
  - Shape notes: Statewide but county-administered with local contacts; financial limits fixed by individual/couple (no household size table); benefits capped monthly and needs-assessed with co-pay; clinical eligibility requires nursing home level of care determination
- **Lifeline Credit** — financial ([source](https://www.nj.gov/treasury/administration/paad/lifeline.shtml (inferred from context; primary admin via NJ Treasury/PAAD)))
  - Shape notes: Three related programs (Credit for utility customers, Tenants Assistance check, SSI Supplement); eligibility cross-tied to PAAD/SSI; one-per-household cap; utility-administered statewide[1][6]
- **Statewide Respite Care Program** — service ([source](www.state.nj.us/humanservices/doas/services/srcp))
  - Shape notes: County-administered with local sponsor agencies; income/asset limits cited as $2,742 single/$5,484 couple monthly, <$40k liquid assets; priority-based access; co-pay sliding scale; exclusions for other similar programs.

## Program Details

### Stay NJ

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 years old as of December 31, 2025, OR receiving Federal Social Security Disability benefits (any age)[4][7]+
- Income: Annual household income must be $500,000 or less[2][4][6]. This applies to combined income if married or in a civil union living in the same home[4]. No household size variations are specified in available sources.
- Assets: No asset limits mentioned in available sources
- Must be a homeowner (not a mobile home owner)[2][4][7]
- Must have owned and lived in the New Jersey home as primary residence for the entire calendar year 2025[4][7]
- Property must be subject to property taxes[1]
- Must be a New Jersey resident[2]

**Benefits:** Reimburses 50% of property tax bill, up to a maximum of $13,000, with a 2025 benefit cap of $6,500[4]. For 2026 calendar year, payments are halved to a maximum of $3,250 due to fiscal/calendar year differences[6]
- Varies by: fixed (though maximum credit increases annually at the same rate as state average property tax bill[6])

**How to apply:**
- Online: propertytaxrelief.nj.gov[4] (requires ID.me identity verification with driver's license, state ID, passport card, or passport)[6]
- Mail: Paper application booklets mailed by Treasury's Division of Taxation to eligible households[4]
- Combined application available: Form PAS-1 allows filing for Stay NJ, ANCHOR, and Senior Freeze simultaneously[3][4]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- Mobile homeowners are NOT eligible, even though they may qualify for Senior Freeze[4][7]
- Must have owned AND lived in the home for the entire calendar year 2025 — not just owned it[4][7]
- Income limit is significantly higher ($500,000) than Senior Freeze ($172,475 for 2025)[1][4], but benefits are reduced if receiving other property tax relief programs
- For 2026 calendar year, benefits are halved ($3,250 max instead of $6,500) due to fiscal year timing[6]
- Benefits from ANCHOR or Senior Freeze directly reduce Stay NJ benefits — they don't stack[4][6]
- Must verify identity through ID.me for online filing, requiring specific government-issued ID[6]
- This is a newer program (started fiscal year 2026) compared to Senior Freeze and ANCHOR[6]

**Data shape:** Stay NJ is a simplified program compared to Senior Freeze: it has a much higher income limit ($500,000 vs. $172,475), no asset limits mentioned, and provides a straightforward 50% property tax credit up to $6,500. However, it explicitly excludes mobile homeowners and requires full-year ownership/occupancy. The program is designed to incentivize seniors to remain in New Jersey and can be combined with ANCHOR and Senior Freeze through a single application (Form PAS-1), though benefits are capped across all three programs combined.

**Source:** https://www.nj.gov/treasury/taxation/ptr/eligibility.shtml and propertytaxrelief.nj.gov[4]

---

### Senior Freeze (Property Tax Reimbursement)


**Eligibility:**
- Age: 65 or older as of December 31 of the application year, OR receiving federal Social Security disability benefits, OR receiving Railroad Retirement disability benefits[6]+
- Income: As of 2024-2025 applications: $163,050 or less annual gross income (includes all sources: Social Security, pensions, wages, etc.)[3] Note: Income limits have expanded significantly—prior years had lower thresholds ($99,735 in earlier years)[1]
- Assets: Not specified in available sources
- New Jersey residency: 3 years continuous residence as of December 31 of the application year (reduced from 10 years as of 2024)[3]
- Homeownership: Must own and have lived in principal residence (main home) continuously since the base year through the application year[2]
- Must meet all eligibility requirements for each year from base year through application year[2]
- Mobile home owners are eligible if they pay mobile home park site fees[1]

**Benefits:** Reimbursement for property tax or mobile home park site fee increases above your base year amount. You receive the difference between your base year (first year of eligibility) property tax and current year property tax, as long as current year is higher[1]
- Varies by: individual_property_tax_history—not a fixed dollar amount, but calculated based on your specific tax increase from your base year

**How to apply:**
- Online: propertytaxrelief.nj.gov[6]
- Mail-in form: Available at NJ Division of Taxation website[5]
- Phone: Senior Freeze (Property Tax Reimbursement) Hotline: 1-800-882-6597[8]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- This program does NOT actually freeze your taxes—it reimburses you for increases after you're enrolled[1]
- Your base year is locked in when you first qualify. If your municipality reassesses property taxes, your base year may change[4]
- You must meet eligibility requirements every single year from base year through application year—if you become ineligible one year, you may lose the benefit[2]
- Income limits include ALL gross income (Social Security, pensions, wages, etc.)—not just earned income[3]
- The program recently expanded (2024): income limits increased from $99,735 to $163,050, and residency requirement dropped from 10 years to 3 years. Previous applicants should recheck eligibility[3]
- Railroad Retirement disability benefits now qualify as of 2025 (recent law change)—previously only Social Security disability qualified[6]
- Previous Senior Freeze recipients will see major changes: new combined application form, different income standards, and no longer need to calculate reimbursement themselves[4]
- For returning applicants: your base year property tax/mobile home site fees will be prefilled on the 2025 PAS-1 form[6]
- This is a reimbursement program, not a tax credit—you pay property taxes first, then receive reimbursement checks from the state[1]

**Data shape:** Benefits are individualized and calculated based on each applicant's specific property tax history (base year vs. current year), not a fixed dollar amount or tier system. The program recently underwent significant expansion (2024-2025): income limits increased substantially, residency requirements shortened, and the application was consolidated into a single combined form covering three programs (Senior Freeze, ANCHOR, Stay NJ). Eligibility is determined annually and must be maintained each year. The program is statewide with no regional variations in benefits or eligibility, administered centrally by NJ Division of Taxation.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/treasury/taxation/ptr/

---

### PAAD (Pharmaceutical Assistance to the Aged and Disabled)


**Eligibility:**
- Age: 65 or older, or 18-64 and receiving Social Security Title II Disability benefits+
- Income: For 2026: $54,943 or less if single; $62,390 or less if married (filing jointly). Note: Figures vary slightly by source and year (e.g., 2025: $53,446 single/$60,690 married)[2][5]; no variation by additional household size beyond single/married
- Assets: No asset limits; assets do not count toward eligibility[5][6]
- New Jersey resident (at least 30 days prior to application in some sources)[1]
- Not eligible for Medicaid[2][5]
- If Medicare-eligible, must enroll in Medicare Part D plan or Medicare Advantage with Part D; enrolled in Medicare Parts A and/or B[2][4][5][6]

**Benefits:** $5 copay per generic drug; $7 copay per brand-name drug (PAAD covers remainder after Medicare Part D where applicable); PAAD pays monthly premium for certain basic Part D plans at/below regional benchmark (up to $5 over in some cases with no deductible); for Medicare Advantage with Part D, contributes up to regional benchmark toward drug portion of premium. Covers FDA-approved drugs on formulary[4][6]

**How to apply:**
- Online: www.aging.nj.gov or NJ SAVE webpage[2][6]
- Phone: 1-800-792-9745 (request application by mail, info, or assistance)[2][6]
- Mail: Submit NJ SAVE paper application (downloadable) with docs; fax to 1-609-588-7122[5][6][7]
- In-person: Local offices/designated agencies for support[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Must enroll in Medicare Part D or MA-PD if Medicare-eligible; PAAD won't cover if not enrolled, and may require plan switch for formulary coverage[2][4][6]
- Not for Medicaid-eligible individuals[2][5]
- Income limits adjust annually; recheck eligibility even if previously ineligible[2]
- PAAD pays Part D premiums only for specific low-premium plans; self-enroll in non-covered plan and pay full premium yourself[4][6]
- Residency: At least 30 days in NJ prior[1]

**Data shape:** No asset test; income binary (single vs. married only, no larger household tiers); tied to Medicare Part D enrollment and specific plan premiums by region; copays fixed regardless of income

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** www.aging.nj.gov (NJ Division of Aging Services) or NJ SAVE webpage

---

### JACC (Jersey Assistance for Community Caregiving)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Monthly income not greater than 365% of the Federal Poverty Level: $4,855 for an individual; $6,582 for a married couple (2026 figures). No table provided for larger households; limits apply to countable income.[2][3]
- Assets: Countable assets $40,000 or less for an individual; $60,000 or less for a couple. Specific details on what counts as countable vs. exempt not specified in sources.[2][3]
- United States citizen or Qualified Alien[1][2]
- New Jersey resident[1][2]
- Resides in the community (not in a facility, nursing home, assisted living, or residential care)[1][2][3]
- Determined to require nursing facility level of care (assistance with minimum of 3 ADLs: bathing, toileting, dressing, transfers, locomotion)[1][2]
- Not participating in Medicaid programs (e.g., NJ FamilyCare, MLTSS) or financially ineligible for them[1][2][3]
- No alternate means available to secure needed services[3][6]

**Benefits:** In-home and community-based services based on needs assessment and plan of care, including: Case Management, Respite Care, Homemaker Services, Environmental Accessibility Modifications, Personal Emergency Response Systems, Home-Delivered Meals, Caregiver/Recipient Training, Special Medical Equipment and Supplies, Transportation, Chore Services, Attendant Care. Monthly cost cap ~$1,156 (or ~$1,090 plus care management in some sources); co-pay required based on sliding scale of countable income, paid to billing agent.[3][5] Services provided by qualified providers or participant-employed providers (PEPs, e.g., family/friends).[1][2]
- Varies by: priority_tier

**How to apply:**
- Phone: County NJ EASE / Area Agency on Aging at 1-877-222-3737 (statewide toll-free)[3][5][6]
- County-specific: e.g., Hunterdon County at 908-788-1361[1]
- Through local County Aging and Disability Resource Connection (ADRC)[6]

**Timeline:** Not specified in sources
**Waitlist:** Availability of services and funding may limit access; no specific waitlist details[1]

**Watch out for:**
- Not a Medicaid program; excludes those eligible for Medicaid/MLTSS[1][2]
- Co-pay required based on income sliding scale, even if eligible[1][3]
- Monthly service cost cap limits total benefits (~$1,156)[3]
- Must have no other means for services and meet nursing home level of care[3][6]
- Services based on funding availability and assessment, not guaranteed full needs met[1]
- One source mentions possible eligibility for 18-59 with disabilities, but official sources specify 60+[2][4]

**Data shape:** Statewide but county-administered with local contacts; financial limits fixed by individual/couple (no household size table); benefits capped monthly and needs-assessed with co-pay; clinical eligibility requires nursing home level of care determination

**Source:** https://www.nj.gov/humanservices/doas/services/a-k/jacc/[2]

---

### Lifeline Credit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18-64 with SSA disability+
- Income: Annual gross income not exceeding $42,141 for single/divorced/widowed or $49,208 for married (some sources cite higher: $54,943 single/$62,390 married); only one per household; SSI recipients automatically eligible without application[1][5]
- Assets: No asset limits mentioned; eligibility often tied to programs like PAAD, MAA, MAO, NJ Care, or SSI which may have their own asset rules[1]
- New Jersey resident
- Meet PAAD requirements, receive MAA/MAO/NJ Care, or SSI
- Utility customer (electric/gas) or tenant with utilities in rent
- US citizenship not required[1][7]

**Benefits:** $225 annual credit applied to electric and/or gas bills (full to one utility, split if both); homeowners and renters eligible[1][4][5][6]

**How to apply:**
- Contact utility provider (e.g., PSE&G, Orange and Rockland)
- Phone: Varies by utility; check NJ 211 or utility sites
- Mail: Utility-specific forms
- No central statewide online URL specified; SSI auto-included[1][5]

**Timeline:** Not specified in sources

**Watch out for:**
- Only one benefit per household, even with multiple eligibles
- SSI recipients get auto-supplement in check—do not apply separately
- Only natural gas/electric; excludes propane/oil/wood/coal
- Income limits conflict across sources (use latest/utility-specific)
- Must be direct utility customer or tenant with utilities in rent for relevant program variant[1][6]

**Data shape:** Three related programs (Credit for utility customers, Tenants Assistance check, SSI Supplement); eligibility cross-tied to PAAD/SSI; one-per-household cap; utility-administered statewide[1][6]

**Source:** https://www.nj.gov/treasury/administration/paad/lifeline.shtml (inferred from context; primary admin via NJ Treasury/PAAD)

---

### Statewide Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: At or below $2,742 per month for a single person ($5,484 for couples). Sliding scale co-pay from 0% to 25% of service costs based on care recipient's (and spouse's) income. Only the care recipient's income is considered.[2][1]
- Assets: Liquid resources less than $40,000 (assets convertible to cash within 20 working days). Specific exemptions not detailed in sources.[2][1]
- Receive daily basic care/supervision from uncompensated caregiver (age 18+, e.g., spouse, family, friend).
- Functional impairments requiring care, certified by licensed medical provider.
- Reside in community (not facility, assisted living, nursing home).
- New Jersey resident.
- Not participating in Medicaid/NJ FamilyCare, MLTSS, JACC, Alzheimer's Adult Day Services, Congregate Housing Services Program, or VA Aid & Assistance. Can switch from JACC or Alzheimer's program.
- Frail or functionally impaired adult with chronic physical/mental disability needing supervision/assistance with daily needs.
- Priority to those at risk of institutionalization due to caregiver inability.[1][2][5]

**Benefits:** Short-term/periodic respite: Companion (in-home hourly supervision); Homemaker/Home Health Aide (in-home hourly/overnight personal care/housekeeping); Private Duty Nursing (in-home hourly RN/LPN); Adult Family Care (short-term placement in trained home); In-patient Care (short-term licensed facility); Social/Medical Adult Day Health Care (structured day program). Caregiver Directed Option for reimbursing services/items easing care. Co-pay 0-25% based on income.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Phone: Aging and Disability Resource Connection at 1-877-222-3737.
- Website: www.state.nj.us/humanservices/doas/services/srcp.
- County sponsor agency (one per county administers locally; contact via phone above or local Office on Aging).[1][2][5]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified in sources.

**Watch out for:**
- Cannot participate if in Medicaid/NJ FamilyCare, MLTSS, JACC (unless switching), Alzheimer's Adult Day, etc.
- Only care recipient's income/assets counted, but co-pay based on recipient/spouse.
- Must live in community, not facility.
- Priority for at-risk of institutionalization; others may face delays.
- Liquid assets strictly defined (convertible to cash in 20 days).
- Uncompensated caregiver required (no paid caregivers qualify).[1][2][5]

**Data shape:** County-administered with local sponsor agencies; income/asset limits cited as $2,742 single/$5,484 couple monthly, <$40k liquid assets; priority-based access; co-pay sliding scale; exclusions for other similar programs.

**Source:** www.state.nj.us/humanservices/doas/services/srcp

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Stay NJ | benefit | state | medium |
| Senior Freeze (Property Tax Reimbursemen | benefit | state | medium |
| PAAD (Pharmaceutical Assistance to the A | benefit | state | deep |
| JACC (Jersey Assistance for Community Ca | benefit | state | deep |
| Lifeline Credit | benefit | state | deep |
| Statewide Respite Care Program | benefit | state | deep |

**Types:** {"benefit":6}
**Scopes:** {"state":6}
**Complexity:** {"medium":2,"deep":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NJ/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **fixed (though maximum credit increases annually at the same rate as state average property tax bill[6])**: 1 programs
- **individual_property_tax_history—not a fixed dollar amount, but calculated based on your specific tax increase from your base year**: 1 programs
- **not_applicable**: 2 programs
- **priority_tier**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Stay NJ**: Stay NJ is a simplified program compared to Senior Freeze: it has a much higher income limit ($500,000 vs. $172,475), no asset limits mentioned, and provides a straightforward 50% property tax credit up to $6,500. However, it explicitly excludes mobile homeowners and requires full-year ownership/occupancy. The program is designed to incentivize seniors to remain in New Jersey and can be combined with ANCHOR and Senior Freeze through a single application (Form PAS-1), though benefits are capped across all three programs combined.
- **Senior Freeze (Property Tax Reimbursement)**: Benefits are individualized and calculated based on each applicant's specific property tax history (base year vs. current year), not a fixed dollar amount or tier system. The program recently underwent significant expansion (2024-2025): income limits increased substantially, residency requirements shortened, and the application was consolidated into a single combined form covering three programs (Senior Freeze, ANCHOR, Stay NJ). Eligibility is determined annually and must be maintained each year. The program is statewide with no regional variations in benefits or eligibility, administered centrally by NJ Division of Taxation.
- **PAAD (Pharmaceutical Assistance to the Aged and Disabled)**: No asset test; income binary (single vs. married only, no larger household tiers); tied to Medicare Part D enrollment and specific plan premiums by region; copays fixed regardless of income
- **JACC (Jersey Assistance for Community Caregiving)**: Statewide but county-administered with local contacts; financial limits fixed by individual/couple (no household size table); benefits capped monthly and needs-assessed with co-pay; clinical eligibility requires nursing home level of care determination
- **Lifeline Credit**: Three related programs (Credit for utility customers, Tenants Assistance check, SSI Supplement); eligibility cross-tied to PAAD/SSI; one-per-household cap; utility-administered statewide[1][6]
- **Statewide Respite Care Program**: County-administered with local sponsor agencies; income/asset limits cited as $2,742 single/$5,484 couple monthly, <$40k liquid assets; priority-based access; co-pay sliding scale; exclusions for other similar programs.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Jersey?
