# New Jersey Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.065 (13 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 11 |
| Programs deep-dived | 11 |
| New (not in our data) | 5 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 5 programs
- **financial**: 5 programs
- **unknown**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### NJ FamilyCare Aged, Blind, Disabled (ABD) Medicaid Programs

- **income_limit**: Ours says `$998` → Source says `$1,255` ([source](https://www.nj.gov/humanservices/dmahs/clients/medicaid/abd/[6]))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Comprehensive health care coverage for nearly all needs, including Medicare premiums/costs if dual eligible (Medicare primary). Long-term services/supports (LTSS/MLTSS) for those meeting nursing facility level of care: managed long-term care services. Exact services/hours not detailed; covers doctor visits, hospital, prescriptions, etc.[1][2][5]` ([source](https://www.nj.gov/humanservices/dmahs/clients/medicaid/abd/[6]))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/humanservices/dmahs/clients/medicaid/abd/[6]`

### Managed Long Term Services and Supports (MLTSS)

- **min_age**: Ours says `65` → Source says `21 years or older (with different rules for children under 20)[1][3]` ([source](https://www.nj.gov/humanservices/dmahs/home/mltss.html))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Long-term services and supports delivered through managed care; can be received in nursing facility or community (home, assisted living)[5]` ([source](https://www.nj.gov/humanservices/dmahs/home/mltss.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/humanservices/dmahs/home/mltss.html`

### Pharmaceutical Assistance to the Aged and Disabled (PAAD)

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 and receiving Social Security Title II Disability benefits` ([source](https://www.nj.gov/humanservices/doas/services/q-z/ship/medicare_drug.shtml (NJ.gov PAAD page); call 1-800-792-9745 for latest official details))
- **income_limit**: Ours says `$31500` → Source says `$54,943` ([source](https://www.nj.gov/humanservices/doas/services/q-z/ship/medicare_drug.shtml (NJ.gov PAAD page); call 1-800-792-9745 for latest official details))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `$5 copay per generic drug prescription; $7 copay per brand-name drug prescription (may pay less for generics if Medicare Part D charges under $5). Covers FDA-approved legend drugs, insulin, insulin supplies, syringes/needles for insulin or multiple sclerosis injectables. Pays certain Medicare Part D premiums up to regional benchmark (or up to $5 over for no-deductible plans). Does not cover diabetic testing supplies or most Medicare Part D excluded drugs (except benzodiazepines/barbiturates). Only in-state purchases from rebate-agreeing manufacturers.` ([source](https://www.nj.gov/humanservices/doas/services/q-z/ship/medicare_drug.shtml (NJ.gov PAAD page); call 1-800-792-9745 for latest official details))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/humanservices/doas/services/q-z/ship/medicare_drug.shtml (NJ.gov PAAD page); call 1-800-792-9745 for latest official details`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one counseling, information, and assistance from trained volunteer counselors on Medicare benefits, claims processing, health insurance options, Medigap/supplemental policies, long-term care insurance, prescription coverage, and related issues; also connects to NJ Save for low-income premium/prescription assistance[1][2][3][5]` ([source](https://www.nj.gov/humanservices/doas/services/q-z/ship/[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/humanservices/doas/services/q-z/ship/[1]`

### Senior Freeze (Property Tax Reimbursement)

- **income_limit**: Ours says `$157000` → Source says `$150,000` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Reimbursement for property tax increases (or mobile home park site fees) on principal residence above the base year amount (first year of eligibility). Provides the difference between base year taxes/fees and current year if higher; does not freeze taxes but reimburses increases. State-funded checks issued annually.` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/treasury/taxation/ptr/`

### PAAD (Pharmaceutical Assistance to the Aged and Disabled)

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 if receiving Social Security Title II Disability benefits` ([source](https://www.nj.gov/humanservices/doas/home (implied via forms); www.aging.nj.gov for applications[2][4]))
- **income_limit**: Ours says `$31500` → Source says `$54,943` ([source](https://www.nj.gov/humanservices/doas/home (implied via forms); www.aging.nj.gov for applications[2][4]))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `$5 copay per generic drug; $7 copay per brand-name drug (PAAD covers remainder for FDA-approved drugs on formulary). PAAD pays Medicare Part D premiums for qualifying basic plans up to regional benchmark (or $5 over for no-deductible plans); contributes up to benchmark for MA-Part D prescription portion[3][6]. Lower copay possible if Medicare plan charges less than $5 for generic.` ([source](https://www.nj.gov/humanservices/doas/home (implied via forms); www.aging.nj.gov for applications[2][4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/humanservices/doas/home (implied via forms); www.aging.nj.gov for applications[2][4]`

## New Programs (Not in Our Data)

- **Specified Low-Income Medicare Beneficiary (SLMB and SLMB QI-1)** — unknown ([source](https://www.nj.gov/humanservices/doas/ and www.aging.nj.gov[1]))
  - Shape notes: This program has two tiers (SLMB and QI-1) with different income limits but identical benefits (Part B premium payment only). Enrollment is automatic based on income/asset qualification — applicants do not choose their tier. Income and asset limits are indexed annually to Federal Poverty Guidelines. The program is statewide with no regional variations. Key distinction: SLMB and QI-1 are narrower than QMB (which covers more cost-sharing) but broader than regular Medicaid in terms of asset limits. Processing timelines and specific application forms are not documented in available sources.
- **Lifeline Credit** — financial ([source](https://law.justia.com/codes/new-jersey/title-48/section-48-2-29-16/ (N.J.S.A. 48:2-29.16)))
  - Shape notes: Eligibility driven by PAAD/SSI enrollment (no direct income/asset test in statute); fixed $225 statewide credit split by utility type; household-limited.
- **Stay NJ** — financial ([source](https://www.nj.gov/treasury/taxation/staynj/index.shtml))
  - Shape notes: Benefit calculated as gap-filler to 50% property taxes after other programs (Senior Freeze/ANCHOR); high income threshold ($500k) but strict residency/ownership rules; single combined PAS-1 form for multiple relief programs.
- **JACC (Jersey Assistance for Community Caregiving)** — service ([source](https://www.nj.gov/humanservices/doas/services/a-k/jacc/[2]))
  - Shape notes: Statewide with county-level application processing; financial eligibility at 365% FPL with asset caps for individual/couple; services capped monthly and needs-assessed with co-pay sliding scale; non-Medicaid for nursing-home level care in community
- **Statewide Respite Care Program** — service ([source](https://www.nj.gov/humanservices/doas/services/q-z/srcp/))
  - Shape notes: County-administered with statewide guidelines; income/asset limits updated annually (2026 figures current); sliding copay scale; priority-based access; caregiver-directed option unique; one program per county with minor local threshold variations.

## Program Details

### NJ FamilyCare Aged, Blind, Disabled (ABD) Medicaid Programs


**Eligibility:**
- Age: 65+
- Income: Varies by program. SSI recipients are automatically eligible. Medicaid Only: income and resources under SSI standards (not specified in sources). New Jersey Care/Special Medicaid: ≤100% Federal Poverty Level ($1,255/month single, $1,704/month couple in 2024; $1,350/month single, $1,763/month couple in 2025). NJRAER ABD: slightly higher than SSI, up to $1,350/month individual or $1,763 couple (2025). Household considered with spouse or parents.[1][2][4][6]
- Assets: Medicaid Only: under SSI resource standards. New Jersey Care/Special: $4,000 single, $6,000 couple (2024). 5-year look-back on asset transfers for LTSS applicants. What counts: financial accounts/resources; exemptions not detailed in sources.[1][6]
- Live in New Jersey
- U.S. citizen or qualified immigrant (e.g., legal permanent resident)
- Blind or disabled per SSA or NJ DMAHS (under 65), or age 65+
- For LTSS: meet nursing facility level of care
- No intent to leave NJ
- SSI not required but auto-eligible if receiving
- 5-year financial disclosure for LTSS[1][2][4][6]

**Benefits:** Comprehensive health care coverage for nearly all needs, including Medicare premiums/costs if dual eligible (Medicare primary). Long-term services/supports (LTSS/MLTSS) for those meeting nursing facility level of care: managed long-term care services. Exact services/hours not detailed; covers doctor visits, hospital, prescriptions, etc.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Online: njfamilycare.org or njfamilycare.dhs.state.nj.us (NJ FamilyCare Aged, Blind, Disabled Program Application)
- Phone: County Board of Social Services (e.g., Salem County 856-299-7200 option 6); ADRC for LTSS clinical eval
- Download/print/mail: NJ FamilyCare Aged, Blind, Disabled Program Application (PDF from nj.gov/humanservices/dmahs/clients/medicaid/abd/)
- In-person: County welfare/Medicaid offices

**Timeline:** Not specified in sources

**Watch out for:**
- 5-year look-back on asset transfers for LTSS can disqualify if transfers below fair market value[1]
- Financial eligibility considers spouse/parents' income/resources[6]
- SSI auto-eligible but non-SSI has strict SSI-related or 100% FPL limits; income slightly over may use NJRAER ABD[4]
- Dual eligible with Medicare: Medicaid secondary, covers premiums/gaps[2]
- Estate recovery possible post-death (no surviving spouse/child under 21/blind/disabled)[6]
- Contact county office first due to complexity[1]

**Data shape:** Multiple tiers (SSI-related Medicaid Only, NJ Care/Special at 100% FPL, NJRAER ABD for working disabled, LTSS/MLTSS); county-administered with spousal/parental deeming; 5-year look-back unique for LTSS; no full household size table beyond single/couple[1][4][6]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/humanservices/dmahs/clients/medicaid/abd/[6]

---

### Managed Long Term Services and Supports (MLTSS)


**Eligibility:**
- Age: 21 years or older (with different rules for children under 20)[1][3]+
- Income: {"2025":"$2,901/month for individuals; each spouse in a couple is evaluated individually at $2,901/month[2][8]","2026":"$2,982/month or less[8]","note":"Income limits increase annually in January. Higher income may qualify with a Qualified Income Trust (QIT)[2][8]"}
- Assets: {"liquid_assets":"$2,000 for individuals; $3,000 for couples[8]","exempt_assets":"Primary home (if applicant lives there or intends to return, with home equity not exceeding $1,097,000 in 2025), household furnishings and appliances, personal effects, one vehicle[2]","home_equity_exception":"Home equity interest must not exceed $1,097,000 (2025) if applicant lives in home, has intent to return, has spouse in home, or has minor/blind/disabled child in home[2]","look_back_rule":"Assets cannot be given away or sold below fair market value within 60 months prior to application; violations result in penalty period of Medicaid ineligibility[2]"}
- U.S. citizen or qualified alien (most immigrants who arrived after August 22, 1996 are barred for 5 years)[4]
- Resident of New Jersey[4]
- Age 65 or older, OR under 65 and determined to be blind or disabled by Social Security Administration or State of New Jersey[1][3]
- Meet clinical/functional requirements (see below)
- For children under 20: parental income and resources are NOT counted in financial eligibility determination[3][7]

**Benefits:** Long-term services and supports delivered through managed care; can be received in nursing facility or community (home, assisted living)[5]
- Varies by: Individual clinical need and care plan; children have separate eligibility pathway with different clinical criteria (Pediatric Clinical Eligibility per Comprehensive Waiver approved August 2017)[3][7]

**How to apply:**
- For individuals currently with Medicaid: Contact assigned Managed Care Organization (MCO) to initiate assessment[9]
- For adults (21+) without Medicaid: Contact County Aging and Disability Resource Center (ADRC) or County Social Service Agencies[9]
- For children (under 20) without Medicaid: Contact Division of Disability Services at 1-888-285-3036 and follow prompts to speak with Information and Referral (I&R) Specialist[9]
- Local county social services agency office (phone available through county government)[8]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Clinical eligibility is NOT automatic: requiring nursing home level of care is mandatory, not just having a diagnosis. Dementia diagnosis alone does not qualify—functional limitations must be documented[2]
- 60-month look-back rule: Any asset transfers or below-market sales within 5 years before application trigger a penalty period of Medicaid ineligibility. This is a common mistake in estate planning[2]
- Home equity cap: Even if primary home is exempt, home equity interest cannot exceed $1,097,000 (2025 figure; increases annually). High-value homes may disqualify applicants[2]
- Parental income does NOT count for children under 20, but DOES count for applicants 21+, even if living with parents[3][7]
- Must have lived in long-term care facility for at least 60 days (including Medicare rehabilitation) to qualify for Money Follows the Person (MFP) program variant that allows community discharge[5]
- Qualified Income Trust (QIT) option exists for those exceeding income limits, but requires legal setup and ongoing administration[2][8]
- Immigrants: Most immigrants arriving after August 22, 1996 are barred from Medicaid programs for 5 years, which affects MLTSS eligibility[4]
- MCO enrollment required: Clinical eligibility alone is insufficient; individual must be enrolled with a Managed Care Organization to receive MLTSS services[7]
- Different application pathways: Process differs significantly depending on whether applicant already has Medicaid; those without must contact county agencies or Division of Disability Services[9]

**Data shape:** MLTSS eligibility has three independent requirement categories (financial, clinical, age/disability) that must ALL be met. Clinical requirements are functional/needs-based rather than diagnosis-based. Program structure differs for children under 20 (no parental income counting) vs. adults 21+. Application routing depends on current Medicaid status. Benefits are service-based (not cash) and individualized by care plan. No specific dollar amounts or service hours provided in official sources—determined by clinical assessment and MCO care planning.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/humanservices/dmahs/home/mltss.html

---

### Pharmaceutical Assistance to the Aged and Disabled (PAAD)


**Eligibility:**
- Age: 65 or older, or 18-64 and receiving Social Security Title II Disability benefits+
- Income: For 2026: $54,943 or less if single; $62,390 or less if married (filing jointly). Income includes Social Security benefits. Limits updated annually; not scaled by larger household sizes beyond couple.
- Assets: No asset test; assets are not considered for eligibility.
- New Jersey resident
- Not eligible for Medicaid
- If Medicare-eligible, must enroll in a Medicare Part D Prescription Drug Plan or Medicare Advantage plan with Part D coverage
- Do not need to be U.S. citizen or lawful permanent resident

**Benefits:** $5 copay per generic drug prescription; $7 copay per brand-name drug prescription (may pay less for generics if Medicare Part D charges under $5). Covers FDA-approved legend drugs, insulin, insulin supplies, syringes/needles for insulin or multiple sclerosis injectables. Pays certain Medicare Part D premiums up to regional benchmark (or up to $5 over for no-deductible plans). Does not cover diabetic testing supplies or most Medicare Part D excluded drugs (except benzodiazepines/barbiturates). Only in-state purchases from rebate-agreeing manufacturers.

**How to apply:**
- Online: NJSaves website (njsave.net or similar NJHelps portal)
- Phone: 1-800-792-9745
- Mail: Pharmaceutical Assistance to the Aged and Disabled (PAAD) Program, Department of Health and Senior Services, P.O. Box 360, Trenton, NJ 08625-0360
- Paper application available for download or request

**Timeline:** Not specified in sources; most renew every 2 years, some annually.

**Watch out for:**
- Must enroll in Medicare Part D (or MA-PD) if Medicare-eligible; PAAD pays select premiums but requires coordination—state pays up to benchmark, not all plans.
- Not eligible if on Medicaid.
- Only covers in-state prescriptions from NJ-rebate manufacturers; out-of-state or non-rebate drugs excluded.
- Income limits are annual gross (including SS); higher earners may qualify for Senior Gold instead.
- Renewals: Most every 2 years, but some must reapply yearly—check notice.
- Copays apply even with coverage; PAAD pays remainder after copay.
- Outdated info common online; always verify 2026 limits via phone/official site as they adjust yearly.

**Data shape:** No asset test; income binary (under limit, no household size scaling beyond couple); mandatory Medicare Part D coordination with premium payment caps; statewide uniform with annual income updates.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/humanservices/doas/services/q-z/ship/medicare_drug.shtml (NJ.gov PAAD page); call 1-800-792-9745 for latest official details

---

### Specified Low-Income Medicare Beneficiary (SLMB and SLMB QI-1)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, OR between 18 and 64 AND receiving Social Security Disability benefits[1]+
- Income: {"description":"Income limits are set at percentages of the Federal Poverty Guidelines (FPG) and adjust annually each January[3]. For 2026, the limits are:[2]","SLMB":{"single":"$1,478/month","married":"$1,992/month","note":"Covers income from QMB levels up to these amounts"},"QI_1":{"single":"$1,660/month","married":"$2,239/month","note":"Covers income from SLMB levels up to these amounts"},"important_note":"Income limits are higher than regular Medicaid (ABD) limits[7]"}
- Assets: {"description":"New Jersey uses federal asset limits for MSPs, which are higher than regular Medicaid[2][5]","limits":{"single":"$9,090","married":"$13,630"},"what_counts":"Money in checking and savings accounts, stocks, bonds[3]","what_does_not_count":"Primary home, one vehicle, furniture and household/personal items, burial plots, up to $1,500 in burial expenses per person[3]"}
- Be a resident of the State of New Jersey[1]
- Be eligible for or enrolled in Medicare Part A (Hospital) and Medicare Part B (Medical)[1]
- Not all income and assets are counted — certain portions may be excluded, so applicants should apply even if they think they exceed limits[3]

**Benefits:** N/A
- Varies by: Program tier (SLMB vs. QI-1) — both provide the same benefit (Part B premium payment) but QI-1 has higher income limits

**How to apply:**
- Phone: 1-800-792-9745 (New Jersey Department of Human Services, Division on Aging)[1]
- Phone: 1-877-839-2675 (State Health Insurance Assistance Program/SHIP — can help determine eligibility and file application)[3]
- Website: www.aging.nj.gov[1]
- In-person or mail: Contact your local county social services office (specific addresses not provided in search results)

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SLMB and QI-1 pay ONLY for Part B premiums — they do NOT cover deductibles, co-insurance, or Part A premiums[7]. Beneficiaries still pay these costs out-of-pocket.
- If you qualify for SLMB but also qualify for full Medicaid, you become 'dual-eligible' and may qualify for SLMB Plus (SLMB+), which offers additional benefits[3]. Ask about this when applying.
- Income and asset limits change every January based on Federal Poverty Guidelines[3]. What qualifies one year may not the next.
- Not all income and assets count toward the limits — certain portions are excluded[3]. You should apply even if you think you exceed the limits.
- You cannot choose between SLMB and QI-1; you are automatically enrolled in whichever program your income and assets qualify you for[3].
- Asset limits for MSPs ($9,090 single / $13,630 married) are much higher than regular Medicaid limits ($2,000 single / $3,000 couple)[5], but if assets exceed MSP limits, you are ineligible until they are reduced[5].
- If you qualify for SLMB, you automatically qualify for Extra Help with prescription drug costs[6].
- These programs are for Medicare beneficiaries only — you must be enrolled in both Part A and Part B[1].

**Data shape:** This program has two tiers (SLMB and QI-1) with different income limits but identical benefits (Part B premium payment only). Enrollment is automatic based on income/asset qualification — applicants do not choose their tier. Income and asset limits are indexed annually to Federal Poverty Guidelines. The program is statewide with no regional variations. Key distinction: SLMB and QI-1 are narrower than QMB (which covers more cost-sharing) but broader than regular Medicaid in terms of asset limits. Processing timelines and specific application forms are not documented in available sources.

**Source:** https://www.nj.gov/humanservices/doas/ and www.aging.nj.gov[1]

---

### Lifeline Credit

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility is primarily based on enrollment or eligibility in specific programs like Pharmaceutical Assistance to the Aged and Disabled (PAAD) or Supplemental Security Income (SSI), rather than strict income limits. Secondary sources indicate approximate income thresholds tied to PAAD: $42,141 yearly for single/divorced/widowed; $49,208 for married (figures from 2024, may update annually). No full household size table provided in statutes; PAAD/SSI eligibility determines qualification.[1][2]
- Assets: No asset limits specified in statutes or sources.
- Residential electric or gas customer in New Jersey as of July 1 or within next 6 months.
- Enrolled in, eligible for, or would be eligible for PAAD (except certain exclusions under N.J.S.A. 30:4D-23).
- Receiving or eligible for SSI benefits.
- Receiving federal Social Security disability benefits (42 U.S.C. § 416(i)) and meeting PAAD income/residency requirements.
- New Jersey resident.
- Over 65 or 18-64 with SSA disability (per secondary sources tying to PAAD/SSI).[1][2][8]

**Benefits:** Annual credit of $225 applied to electric and/or gas utility bills. If customer of one utility, full $225 applied there. If both electric and gas, $225 split as $112.50 each. One credit per household per year. Tenants receive check instead if utilities included in rent. Special Utility Supplement for certain SSI recipients added to monthly SSI check.[5][6]
- Varies by: fixed

**How to apply:**
- Contact utility provider (e.g., Orange and Rockland Utilities for their customers).
- Apply through NJ Department of Human Services or PAAD/SSI channels for automatic eligibility determination.
- No specific statewide phone/website/form in results; utility-specific applications like CenturyLink Lifeline form (distinct but related).[4]

**Timeline:** Not specified in sources.

**Watch out for:**
- Must be actual utility customer; tenants get separate check process.
- Only one credit per household/year, even with multiple eligibles.
- Eligibility tied to PAAD/SSI—apply there first for automatic qual.[1][6]
- Credit unused portion carries if service terminates, but no retroactive if ineligible later.[6]
- Not the federal Lifeline phone program; utility-specific credit.[3][4]
- Non-citizens eligible.[7]

**Data shape:** Eligibility driven by PAAD/SSI enrollment (no direct income/asset test in statute); fixed $225 statewide credit split by utility type; household-limited.

**Source:** https://law.justia.com/codes/new-jersey/title-48/section-48-2-29-16/ (N.J.S.A. 48:2-29.16)

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income limits; open to all New Jersey Medicare beneficiaries of any age[1][2][3]
- Assets: No asset limits or tests apply[1][2]
- Must be a New Jersey Medicare beneficiary (original Medicare or Medicare Advantage), including those with supplemental policies, claims issues, or questions about benefits, Medigap, long-term care insurance, or prescriptions[1][2][3][5]

**Benefits:** Free one-on-one counseling, information, and assistance from trained volunteer counselors on Medicare benefits, claims processing, health insurance options, Medigap/supplemental policies, long-term care insurance, prescription coverage, and related issues; also connects to NJ Save for low-income premium/prescription assistance[1][2][3][5]

**How to apply:**
- Phone: SHIP Information Center 1-800-792-8820[1][4][6]
- In-person or phone via county offices (one in each of NJ's 21 counties, e.g., Atlantic: 609-645-7700, Bergen: 201-336-7413)[1][7]
- Online: NJ Save application for related low-income assistance (via nj.gov/humanservices/doas/services/q-z/ship/)[1][2]

**Timeline:** No formal application or processing time; counseling provided upon contact, though local availability may vary[1][5]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling/education, no direct payments or medical services; must be a Medicare beneficiary (not general health insurance help); local county availability may require scheduling; often confused with NJ Save, which is for low-income premium relief[1][2][5]
- Volunteers provide services, so hours/appointments depend on local sites[1][7]

**Data shape:** no income/asset test; counseling only via statewide network of 21 county offices; open to Medicare beneficiaries of all ages; no formal application process[1][2][7]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/humanservices/doas/services/q-z/ship/[1]

---

### Stay NJ

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Annual income below $500,000 for 2025 (does not vary by household size; applies to the applicant). Social Security disability does not qualify.
- Assets: No asset limits mentioned.
- Must be a New Jersey homeowner (not mobile homeowners or renters) paying property taxes or P.I.L.O.T. (Payments-in-Lieu-of-Tax) payments.
- Home must have been principal residence owned and lived in for the full 12 months of the prior year (e.g., 2025 for 2026 application).
- Must be 65 or older in the application year.

**Benefits:** Reimburses 50% of property taxes billed on primary residence (on land and improvements), up to a maximum of $6,500 for 2025. If also eligible for Senior Freeze and/or ANCHOR, Stay NJ fills the gap to reach 50% of property taxes (up to $6,500 total across programs). Examples: $10,000 taxes = $5,000 benefit; $14,000 taxes = $6,500 max.
- Varies by: property_tax_amount

**How to apply:**
- Online: propertytaxreliefapp.nj.gov (requires ID.me verification with driver's license, state ID, passport card, or passport; direct deposit available).
- Mail: Print PAS-1 form and send to New Jersey Division of Taxation.
- Combined application covers Stay NJ, Senior Freeze, and ANCHOR.

**Timeline:** Not specified in sources.

**Watch out for:**
- Only homeowners (excludes mobile homeowners and renters).
- Must own and live in home full 12 months of prior year.
- Social Security disability does not qualify (age 65+ required).
- Benefit caps at $6,500 and supplements (does not duplicate) Senior Freeze/ANCHOR.
- Application deadline: November 2, 2026 for next round (check official site for updates; prior was October 31, 2025).
- Eligibility based on prior year (e.g., 2025 income/residency for 2026 benefit).

**Data shape:** Benefit calculated as gap-filler to 50% property taxes after other programs (Senior Freeze/ANCHOR); high income threshold ($500k) but strict residency/ownership rules; single combined PAS-1 form for multiple relief programs.

**Source:** https://www.nj.gov/treasury/taxation/staynj/index.shtml

---

### Senior Freeze (Property Tax Reimbursement)


**Eligibility:**
- Age: 65+
- Income: Income eligibility thresholds have been expanded and vary by year; for 2024 filing (covering 2022-2023), annual income must be $150,000 or less in 2022 and $163,050 or less in 2023 (all gross income, including Social Security). Earlier thresholds were $99,735 or less. Exact limits for 2025 applications (based on 2024 and 2025 income) are determined via the combined application; must meet requirements each year from base year through application year. Does not vary by household size.
- Assets: No asset limits mentioned in program details.
- Age 65 or older as of December 31 of the base year (e.g., 2022) or receiving federal Social Security disability benefits (recently expanded to include Railroad Retirement disability benefits) as of December 31 of the base year.
- Own and have lived in the principal residence (home or mobile home) continuously since the base year (e.g., December 31, 2019 or earlier for 2024 filing) and still own and live there as of December 31 of the application year (e.g., 2023).
- New Jersey resident; residency requirement reduced from 10 years to at least 3 years in recent updates.
- Must meet all eligibility criteria for every year from base year through application year.

**Benefits:** Reimbursement for property tax increases (or mobile home park site fees) on principal residence above the base year amount (first year of eligibility). Provides the difference between base year taxes/fees and current year if higher; does not freeze taxes but reimburses increases. State-funded checks issued annually.
- Varies by: base_year_taxes_and_current_increases

**How to apply:**
- Online via combined PAS-1 application at https://www.nj.gov/treasury/taxation/ptr/ or propertytaxrelief.nj.gov (prefilled for prior recipients).
- Mail-in PAS-1 form (print from https://www.nj.gov/treasury/taxation/ptr/).
- Phone assistance via Senior Freeze Hotline: 1-800-882-6597 (have application copy ready).
- Check status online at https://www20.state.nj.us/TYTR_PTR_INQ/jsp/PTRLogin.jsp (using SSN and ZIP code).

**Timeline:** Payments expected in early 2026 for 2025 applications; specific timelines not detailed but status checkable online.

**Watch out for:**
- Must meet eligibility every year from base year to application year; missing one year disqualifies.
- Does not actually freeze taxes—only reimburses increases above base year; no benefit if taxes decrease or stay same.
- Combined PAS-1 application auto-considers ANCHOR and Stay NJ; previous recipients get prefilled base year but must refile annually.
- Income includes all gross sources (e.g., Social Security); thresholds change yearly and are subject to state budget.
- Filing deadline strict (e.g., November 2, 2026 for 2025); late applications not accepted.
- Base year preserved unless municipal reassessment occurs.
- Mobile homeowners eligible only for site fees, not under Stay NJ.

**Data shape:** Must qualify continuously from base year (e.g., 2019+) through application year; reimbursement tied to specific base year taxes/fees with annual increases only; combined single PAS-1 form for multiple programs; income limits expanded recently and vary by year, not household size; disability expanded to Railroad Retirement.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/treasury/taxation/ptr/

---

### PAAD (Pharmaceutical Assistance to the Aged and Disabled)


**Eligibility:**
- Age: 65 or older, or 18-64 if receiving Social Security Title II Disability benefits+
- Income: For 2026: $54,943 or less if single; $62,390 or less if married (couple). Note: Figures vary slightly across sources (e.g., 2025 limits $53,446 single/$60,690 married); use most recent for current year[2][5]. No variation by additional household size beyond single/couple mentioned.
- Assets: No asset limits; assets do not count toward eligibility[5][6].
- New Jersey resident (at least 30 days prior to application)[1]
- Not eligible for Medicaid[2]
- Legal U.S. resident[1]
- Enrolled in Medicare Part D Prescription Drug Plan or Medicare Advantage plan with Part D coverage (required for Medicare beneficiaries; PAAD pays premiums for qualifying plans up to regional benchmark)[2][3][5][6]

**Benefits:** $5 copay per generic drug; $7 copay per brand-name drug (PAAD covers remainder for FDA-approved drugs on formulary). PAAD pays Medicare Part D premiums for qualifying basic plans up to regional benchmark (or $5 over for no-deductible plans); contributes up to benchmark for MA-Part D prescription portion[3][6]. Lower copay possible if Medicare plan charges less than $5 for generic.

**How to apply:**
- Online: www.aging.nj.gov or NJ SAVE webpage (universal application)[2][6]
- Phone: 1-800-792-9745 (request application by mail or info)[2][6]
- Mail/Fax: AP-2 Universal Application for PAAD (download from nj.gov/humanservices/doas/forms/ap-2.pdf); fax to 1-609-588-7122[4][5]
- In-person: Local offices/designated agencies for assistance[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Must enroll in Medicare Part D or MA-PD; PAAD pays only for qualifying low-premium plans—may need to switch plans or request exceptions if drug not covered[3][6]
- Not eligible if on Medicaid[2]
- Income limits adjust annually—check current year (e.g., 2025 vs. 2026 figures differ)[1][2][3]
- Universal AP-2 screens for other programs (e.g., Senior Gold, Lifeline); PAAD applicants must complete all pages[4]
- No asset test, but must prove disability precisely if under 65[4][5]

**Data shape:** No asset test; income binary (single/couple only, no larger household tiers); Medicare Part D enrollment mandatory with PAAD premium payment capped by regional benchmark; copays fixed regardless of income within limits

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/humanservices/doas/home (implied via forms); www.aging.nj.gov for applications[2][4]

---

### JACC (Jersey Assistance for Community Caregiving)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Monthly income not greater than 365% of the Federal Poverty Level: $4,855 for an individual; $6,582 for a married couple (2026 figures). Countable income used for sliding scale co-pay[2][3].
- Assets: Countable assets $40,000 or less for an individual; $60,000 or less for a couple. Specific details on what counts as countable vs. exempt not specified in sources[2][3].
- United States citizen or Qualified Alien[1][2]
- New Jersey resident[1][2]
- Resides in the community (not in a facility, nursing home, assisted living, or residential care)[1][2][3]
- Determined to require nursing facility level of care (assistance with minimum of 3 ADLs: bathing, toileting, dressing, transfers, locomotion)[1][2]
- Not participating in Medicaid programs (e.g., NJ FamilyCare, MLTSS) or financially ineligible for them[1][2][3]
- No alternate means to secure needed services[3]

**Benefits:** In-home and community-based services based on needs assessment and plan of care, including: Case Management, Respite Care, Homemaker Services, Environmental Accessibility Modifications, Personal Emergency Response Systems, Home-Delivered Meals, Caregiver/Recipient Training, Special Medical Equipment and Supplies, Transportation, Chore Services, Attendant Care. Monthly cost cap around $1,156 (or approx. $1,090 plus care management); services provided by qualified providers or participant-employed providers (PEPs). Co-pay required based on income sliding scale, paid to billing agent[1][2][3][5].
- Varies by: priority_tier

**How to apply:**
- Phone: County offices (e.g., Hunterdon: 908-788-1361) or statewide NJ EASE toll-free: 1-877-222-3737[1][3][5]
- Through local County Aging and Disability Resource Connection (ADRC)[2][5][6]

**Timeline:** Not specified in sources
**Waitlist:** Availability of services and funding may limit access; no specific waitlist details[1]

**Watch out for:**
- Not a Medicaid program; excludes those eligible for Medicaid/MLTSS[1][2]
- Requires nursing facility level of care (min. 3 ADLs); functional assessment mandatory[2]
- Monthly service cap and income-based co-pay apply; participant contributes to costs[1][3]
- Services based on funding availability and no alternate means of support[1][3]
- Must live in community, not facilities[1][2]
- One non-official source mentions possible eligibility for 18-59 with disabilities, but official sources specify 60+[2][4]

**Data shape:** Statewide with county-level application processing; financial eligibility at 365% FPL with asset caps for individual/couple; services capped monthly and needs-assessed with co-pay sliding scale; non-Medicaid for nursing-home level care in community

**Source:** https://www.nj.gov/humanservices/doas/services/a-k/jacc/[2]

---

### Statewide Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Single person (unmarried or widowed): Maximum $2,982 monthly gross income in 2026; maximum $40,000 liquid assets. Married person/couple: Maximum $5,964 combined monthly gross income in 2026; maximum $60,000 combined liquid assets. Sliding scale copay 0-25% of service costs based on care recipient's (and spouse's) income, starting at lower thresholds in some counties (e.g., $1,402 single/$2,804 couple in Bergen). Note: Older county data shows lower limits like $2,742 single/$5,484 couple, but 2026 statewide figures from NJ.gov apply.[2]
- Assets: Liquid assets only (e.g., cash, bank accounts, stocks that can be converted to cash within 20 working days). Maximum $40,000 single; $60,000 couple. Primary residence, one vehicle, and personal belongings typically exempt (standard Medicaid-like rules implied).[2][3]
- NJ resident living in the community (not in facility, nursing home, assisted living).
- Age 18+ with functional impairments requiring daily basic care/supervision, certified by licensed medical provider.
- Receives daily care from uncompensated caregiver (spouse, family, friend, etc., age 18+).
- Not enrolled in MLTSS, NJ FamilyCare Medicaid, JACC, Alzheimer's Adult Day Services, or Congregate Housing Services Program (can switch from JACC/Alzheimer's program).
- Priority for those at risk of institutionalization due to caregiver burden.[1][2][3]

**Benefits:** In-home and out-of-home respite services including: Companion/sitter (hourly supervision); Homemaker/Home Health Aide (hourly/overnight personal care/housekeeping); Private Duty Nursing (hourly RN/LPN); Adult Family Care (short-term placement in trained home); In-patient Care (short-term in licensed facility); Social/Medical Adult Day Health; Camp; Skilled Nursing; Caregiver Directed Option (reimbursement for caregiver-chosen services/items). One emergency/planned respite benefit per year. Family pays 0-25% sliding scale copay; program covers remainder. No fixed hours/dollar cap specified, short-term/periodic/intermittent relief.[1][3][4][7]
- Varies by: priority_tier

**How to apply:**
- Phone: Aging and Disability Resource Connection (ADRC) toll-free 1-877-222-3737 (connects to county program).
- County sponsor agency (one per county; e.g., Hunterdon County, Warren County Offices on Aging). No central online form; contact via phone for local intake.
- Brochures available: English/Spanish at https://www.nj.gov/humanservices/doas/services/q-z/srcp/.[2][4]

**Timeline:** Not specified in sources.

**Watch out for:**
- Cannot participate if enrolled in MLTSS, NJ FamilyCare Medicaid, JACC (unless switching), Alzheimer's Adult Day, or Congregate Housing.
- Only care recipient's (and spouse's) income/assets counted; caregiver income ignored.
- Must live in community, not facility.
- Sliding scale copay (0-25%) based on income; not fully free.
- Priority for institutionalization risk; lower priority may affect access.
- County-specific administration means contacting local ADRC essential; no statewide online app.
- Income is gross monthly before deductions; liquid assets strictly defined.[1][2][3]

**Data shape:** County-administered with statewide guidelines; income/asset limits updated annually (2026 figures current); sliding copay scale; priority-based access; caregiver-directed option unique; one program per county with minor local threshold variations.

**Source:** https://www.nj.gov/humanservices/doas/services/q-z/srcp/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| NJ FamilyCare Aged, Blind, Disabled (ABD | benefit | state | deep |
| Managed Long Term Services and Supports  | benefit | state | deep |
| Pharmaceutical Assistance to the Aged an | benefit | state | medium |
| Specified Low-Income Medicare Beneficiar | benefit | federal | medium |
| Lifeline Credit | benefit | state | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Stay NJ | resource | state | simple |
| Senior Freeze (Property Tax Reimbursemen | resource | state | simple |
| PAAD (Pharmaceutical Assistance to the A | benefit | state | deep |
| JACC (Jersey Assistance for Community Ca | benefit | state | deep |
| Statewide Respite Care Program | benefit | state | deep |

**Types:** {"benefit":8,"resource":3}
**Scopes:** {"state":9,"federal":2}
**Complexity:** {"deep":6,"medium":2,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/NJ/drafts.json`.

- **NJ FamilyCare Aged, Blind, Disabled (ABD) Medicaid Programs** (benefit) — 5 content sections, 6 FAQs
- **Managed Long Term Services and Supports (MLTSS)** (benefit) — 5 content sections, 6 FAQs
- **Pharmaceutical Assistance to the Aged and Disabled (PAAD)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **Individual clinical need and care plan; children have separate eligibility pathway with different clinical criteria (Pediatric Clinical Eligibility per Comprehensive Waiver approved August 2017)[3][7]**: 1 programs
- **not_applicable**: 3 programs
- **Program tier (SLMB vs. QI-1) — both provide the same benefit (Part B premium payment) but QI-1 has higher income limits**: 1 programs
- **fixed**: 1 programs
- **property_tax_amount**: 1 programs
- **base_year_taxes_and_current_increases**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **NJ FamilyCare Aged, Blind, Disabled (ABD) Medicaid Programs**: Multiple tiers (SSI-related Medicaid Only, NJ Care/Special at 100% FPL, NJRAER ABD for working disabled, LTSS/MLTSS); county-administered with spousal/parental deeming; 5-year look-back unique for LTSS; no full household size table beyond single/couple[1][4][6]
- **Managed Long Term Services and Supports (MLTSS)**: MLTSS eligibility has three independent requirement categories (financial, clinical, age/disability) that must ALL be met. Clinical requirements are functional/needs-based rather than diagnosis-based. Program structure differs for children under 20 (no parental income counting) vs. adults 21+. Application routing depends on current Medicaid status. Benefits are service-based (not cash) and individualized by care plan. No specific dollar amounts or service hours provided in official sources—determined by clinical assessment and MCO care planning.
- **Pharmaceutical Assistance to the Aged and Disabled (PAAD)**: No asset test; income binary (under limit, no household size scaling beyond couple); mandatory Medicare Part D coordination with premium payment caps; statewide uniform with annual income updates.
- **Specified Low-Income Medicare Beneficiary (SLMB and SLMB QI-1)**: This program has two tiers (SLMB and QI-1) with different income limits but identical benefits (Part B premium payment only). Enrollment is automatic based on income/asset qualification — applicants do not choose their tier. Income and asset limits are indexed annually to Federal Poverty Guidelines. The program is statewide with no regional variations. Key distinction: SLMB and QI-1 are narrower than QMB (which covers more cost-sharing) but broader than regular Medicaid in terms of asset limits. Processing timelines and specific application forms are not documented in available sources.
- **Lifeline Credit**: Eligibility driven by PAAD/SSI enrollment (no direct income/asset test in statute); fixed $225 statewide credit split by utility type; household-limited.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling only via statewide network of 21 county offices; open to Medicare beneficiaries of all ages; no formal application process[1][2][7]
- **Stay NJ**: Benefit calculated as gap-filler to 50% property taxes after other programs (Senior Freeze/ANCHOR); high income threshold ($500k) but strict residency/ownership rules; single combined PAS-1 form for multiple relief programs.
- **Senior Freeze (Property Tax Reimbursement)**: Must qualify continuously from base year (e.g., 2019+) through application year; reimbursement tied to specific base year taxes/fees with annual increases only; combined single PAS-1 form for multiple programs; income limits expanded recently and vary by year, not household size; disability expanded to Railroad Retirement.
- **PAAD (Pharmaceutical Assistance to the Aged and Disabled)**: No asset test; income binary (single/couple only, no larger household tiers); Medicare Part D enrollment mandatory with PAAD premium payment capped by regional benchmark; copays fixed regardless of income within limits
- **JACC (Jersey Assistance for Community Caregiving)**: Statewide with county-level application processing; financial eligibility at 365% FPL with asset caps for individual/couple; services capped monthly and needs-assessed with co-pay sliding scale; non-Medicaid for nursing-home level care in community
- **Statewide Respite Care Program**: County-administered with statewide guidelines; income/asset limits updated annually (2026 figures current); sliding copay scale; priority-based access; caregiver-directed option unique; one program per county with minor local threshold variations.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Jersey?
