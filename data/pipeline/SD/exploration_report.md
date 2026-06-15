# South Dakota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 13 |
| New (not in our data) | 10 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,275` ([source](https://dss.sd.gov/medicaid/Eligibility/default.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copays. SLMB/QI: Pays Part B premiums only. Automatic qualification for Extra Help (Part D low-income subsidy, e.g., ≤$12.65 copay/drug in 2026). No direct services—pure premium/cost coverage.[1][2][3][4]` ([source](https://dss.sd.gov/medicaid/Eligibility/default.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov/medicaid/Eligibility/default.aspx`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://dss.sd.gov/economicassistance/snap.aspx))
- **income_limit**: Ours says `$1981` → Source says `$1,696` ([source](https://dss.sd.gov/economicassistance/snap.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for groceries (no cash). Amount based on household size, net income, deductions (e.g., example: 2-person elderly household with $1,200 gross might get $415/month after deductions). Max allotment scales by size; subtract 30% of net income from max.[5][3]` ([source](https://dss.sd.gov/economicassistance/snap.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov/economicassistance/snap.aspx`

### Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy for residents' rights; complaint resolution; information and referral assistance; education on residents' rights; review of medical records; assistance with guardianship, medical/treatment issues, and facility concerns (e.g., staffing shortages); collaboration with facilities to resolve issues.` ([source](https://dhs.sd.gov/ltss/ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.sd.gov/ltss/ombudsman-program`

## New Programs (Not in Our Data)

- **South Dakota Medicaid for Seniors and Disabled** — service ([source](https://dss.sd.gov/economicassistance/medical_eligibility.aspx[7]))
  - Shape notes: Income/asset limits strict for long-term care with spousal protections (CSRA, MMNA); requires medical NHLOC; statewide but local DSS processing; 2026 LTC income $2901 single[1][3][4]
- **Home and Community-Based Options and Person Centered Excellence (HOPE) Waiver** — service ([source](https://dss.sd.gov/ (South Dakota Department of Social Services); Medicaid.gov waiver listing: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171))
  - Shape notes: This program's eligibility is primarily income and asset-tested with a functional (nursing facility level of care) requirement. Benefits are service-based rather than cash-based, with specific services determined by individual support plan. The program operates statewide with a fixed capacity cap. Income limits adjust annually. Home equity is treated as exempt asset under specific conditions. The program requires ongoing participation in assessments and monthly service receipt to maintain eligibility.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://dhs.sd.gov (South Dakota Department of Human Services; see LTSS provider portal for PACE feasibility study)))
  - Shape notes: No operational programs in South Dakota (feasibility study phase only); eligibility not financially restricted but geographically limited to zero service areas; benefits coordinated via interdisciplinary team without caps; Medicaid asset/income rules apply indirectly for full coverage
- **Low Income Energy Assistance Program (LIEAP)** — financial ([source](https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx))
  - Shape notes: Income at exactly 200% FPL with 3-month lookback; no asset test; benefits as one-time payment varying by income/size/fuel; Weatherization county-based with priority tiers and waitlists; categorical eligibility via SNAP.
- **Senior Health Information and Insurance Education (SHIINE)** — service ([source](https://www.shiine.net))
  - Shape notes: No income/asset tests; eligibility tied solely to Medicare status; regionally coordinated with volunteer network; counseling-focused SHIP program, not benefits-paying.
- **South Dakota Respite Care Program** — service ([source](https://dhs.sd.gov/developmentaldisabilities/respitecare.aspx (referenced in search results; full content not accessible)))
  - Shape notes: South Dakota operates two distinct respite care programs: (1) Developmental Disabilities Respite Care Program (no income limit, predetermined annual budget, serves children and adults with developmental disabilities/delays/conditions) and (2) Adult Services and Aging Respite Care (asset-limited, hour-capped, serves elderly and dependent adults). The search results do not provide specific annual budget amounts for the developmental disabilities program or detailed processing timelines for either program. Provider availability appears to be statewide but is provider-managed, suggesting practical access may vary by region based on provider network density.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dlr.sd.gov/scsep/))
  - Shape notes: SCSEP is a federally funded program under Title V of the Older Americans Act with state administration. Benefits are fixed (not scaled by household size). The program emphasizes work-based training rather than direct financial assistance. Income eligibility is the primary barrier; specific dollar thresholds require annual verification with local offices.
- **Legal Aid for Seniors** — service ([source](https://www.sdlawhelp.org/apply (unified intake); https://www.dpls.org/eligibility; https://dhs.sd.gov/en/ltss/legal-services-for-vulnerable-older-adults))
  - Shape notes: Multiple regional providers with 60+ often income-exempt but case-priority restricted; not a single unified statewide program; FPG-based with 125-200% tiers and senior exceptions; county-restricted coverage.
- **Senior Companions of South Dakota** — service ([source](https://www.good-sam.com/senior-companions))
  - Shape notes: Dual structure: volunteer program for 55+ low-income (income-tested, stipend) serving non-income-tested clients 21+ (disability-focused); regional offices with separate contacts; no client age minimum but targets frail elderly/disabled.
- **Senior Box Program (CSFP)** — in_kind ([source](https://doe.sd.gov/cans/csfp.aspx))
  - Shape notes: Administered statewide by SD Dept of Education via local non-profits/food banks with county-specific providers and distribution sites; income at 150% FPL (SD-specific, above federal min); no asset test; monthly boxes fixed content/value regardless of household size.

## Program Details

### South Dakota Medicaid for Seniors and Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: South Dakota is an income cap state. For long-term care Medicaid (Nursing Home Medicaid and Waivers), single applicants have a monthly income limit of $2,901; married couples (both applying) $5,802; married (one applying) $2,901 for the applicant with spousal allowances. Community spouse protections include Minimum Monthly Maintenance Needs Allowance $2,643.75–Maximum $4,066.50 and CSRA $32,532–$162,660[1][3][4].
- Assets: $2,000 for recipients (IRAs and retirement plans are countable). Home equity limit $752,000. Exemptions not detailed in sources but standard Medicaid exemptions (primary home under equity limit, one vehicle, personal belongings) typically apply. Strategies exist to qualify over limits via planning[1][3].
- Nursing Home Level of Care (NHLOC) for Nursing Home Medicaid and Waivers; functional need for ADLs for other long-term services[1]
- Medical need for long-term care; U.S. citizenship or qualified immigrant status; state residency[1][5]

**Benefits:** Long-term care services including nursing home care, home/community-based services via waivers, doctor visits, hospital stays, prescriptions, home modifications (if unable to live safely at home independently). Covers costs whether at home, community, or care facility. No premiums, copays, coinsurance, or deductibles[1][5][7].
- Varies by: priority_tier

**How to apply:**
- Online: http://dss.sd.gov/applyonline[6]
- Phone: 1-855-256-6742[4]
- Mail: Any Department of Social Services (DSS) Division of Economic Assistance office[6]
- In-person: Local DSS office[6]

**Timeline:** 45 days for most applications; 90 days if disability determination required[5][6]
**Waitlist:** Not mentioned in sources; may apply for specific waiver services[1]

**Watch out for:**
- Must have NHLOC for nursing home/waivers; functional ADL need for other services—people miss medical assessment requirement[1]
- Income cap state: Excess income disqualifies unless planned around (e.g., spousal allowances, trusts); IRAs count as assets[1][3]
- Home equity over $752,000 disqualifies long-term care unless exceptions; estate recovery applies (hardship waivers exist)[3]
- Dual Medicare/Medicaid eligible possible but requires meeting Medicaid asset rules; apply via Medicare first if applicable[5]
- Retroactive coverage up to 3 prior months if expenses and eligible then[6]

**Data shape:** Income/asset limits strict for long-term care with spousal protections (CSRA, MMNA); requires medical NHLOC; statewide but local DSS processing; 2026 LTC income $2901 single[1][3][4]

**Source:** https://dss.sd.gov/economicassistance/medical_eligibility.aspx[7]

---

### Home and Community-Based Options and Person Centered Excellence (HOPE) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, OR 18-64 with a qualifying disability from Social Security Administration[1][2]+
- Income: {"description":"Income limit is 300% of the Federal Benefit Rate (FBR), which adjusts annually in January[3]","2025_monthly_limit":"$2,901 per month for single applicants[3]","2019_reference":"Up to $2,313 per month (historical reference)[1]","married_couples":"Each spouse evaluated individually; each allowed up to the monthly limit if both are applicants[1][3]","spousal_income":"For married couples where only one spouse applies, spousal income is not counted against the applicant[1]","needs_allowance":"Up to $3,160.50 per month of joint income can be allocated to the non-applicant spouse[1]"}
- Assets: {"single_or_widowed":"Up to $2,000 in countable assets (cash in checking/savings accounts and similar accessible resources)[1]","married_couples_both_applicants":"Each spouse must meet the $2,000 limit individually[1]","married_couples_one_applicant":"Applicant must have $2,000 or less; non-applicant spouse may have up to $126,420 in countable assets[1]","home_equity_exemption":"Home is exempt if applicant lives in it or has intent to return; home equity interest cannot exceed $730,000 (2025)[3]","additional_exemptions":"Home is also exempt if spouse lives in home, minor child (under 21) lives in home, or disabled/blind child (any age) lives in home[3]"}
- Must be a South Dakota resident[6]
- Must meet nursing facility level of care (NFLOC) as determined by standardized assessment[2][4]
- Cannot currently reside in hospital, nursing facility, or ICF/MR setting[1]
- Must participate in initial needs assessment[1][8]
- Must receive at least one waiver service at least once per month[1]
- Must have individual support plan prepared[2]
- Must reside or will reside at home or HOPE waiver-approved home and community-based setting[2]

**Benefits:** Home and community-based services for individuals who need nursing facility level of care[5]
- Varies by: Individual need and support plan; specific hours/dollar amounts not detailed in search results

**How to apply:**
- Phone: Dakota at Home (833) 663-9673[5]
- Referral: Dakota at Home Referral for HOPE Waiver/State Plan Services[4]

**Timeline:** Not specified in available sources
**Waitlist:** Not explicitly stated; program has statewide capacity cap of 1,834 concurrent recipients[1]

**Watch out for:**
- Program has a statewide capacity cap of 1,834 concurrent recipients[1] — availability may be limited and waitlists possible
- Income and asset limits are strictly enforced; applying when over limits will result in denial[3]
- Applicant must meet nursing facility level of care requirement — this is not automatic for elderly or disabled individuals; functional assessment required[3]
- Must receive at least one waiver service monthly to maintain eligibility[1]
- Home equity limit of $730,000 (2025) applies unless spouse, minor child, or disabled child lives in home[3]
- Disabled individuals (ages 18-64) can continue receiving services under the aged category when they turn 65[3]
- Waiver approval expires September 30, 2026[7] — renewal status should be verified
- Income limits increase annually in January; 2025 limit of $2,901/month is not permanent[3]
- For married couples, spousal income is not counted only if the spouse is not applying; if both apply, each is evaluated individually[1]
- Non-applicant spouse can have significantly higher assets ($126,420) than applicant ($2,000), creating planning opportunities[1]

**Data shape:** This program's eligibility is primarily income and asset-tested with a functional (nursing facility level of care) requirement. Benefits are service-based rather than cash-based, with specific services determined by individual support plan. The program operates statewide with a fixed capacity cap. Income limits adjust annually. Home equity is treated as exempt asset under specific conditions. The program requires ongoing participation in assessments and monthly service receipt to maintain eligibility.

**Source:** https://dss.sd.gov/ (South Dakota Department of Social Services); Medicaid.gov waiver listing: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for PACE enrollment itself; financial eligibility applies only for full Medicaid coverage to avoid private pay. For South Dakota Medicaid long-term care (relevant for dual-eligible coverage), income must be under 300% of the Federal Benefit Rate ($2,901/month in 2025 for an individual; varies by household size per state Medicaid rules). No specific South Dakota PACE income table available as program not yet implemented statewide[2][5].
- Assets: No asset limits for PACE enrollment. For Medicaid coverage, assets $2,000 or less for an individual (excludes primary home, one vehicle, personal belongings, burial plots; countable assets include bank accounts, second vehicles, investments)[2].
- Live in the service area of a PACE organization (none currently operational statewide in South Dakota)
- Certified by South Dakota as needing nursing home level of care (requires extensive assistance with 2+ activities of daily living like bathing, dressing, eating)
- Able to live safely in the community with PACE services support
- Not enrolled in Medicare Advantage, Medicare prescription drug plan, hospice, or certain other programs
- Voluntary enrollment; average participant is 76 with multiple chronic conditions, 90% dual Medicare-Medicaid eligible[1][5][6]

**Benefits:** All-inclusive: primary and specialty medical care, prescription drugs, hospitalization, nursing home care when needed, adult day health center, home care, transportation, meals/nutrition, therapy (physical/occupational/speech), social services, caregiver support; no copays/deductibles once enrolled. Provided via interdisciplinary team at PACE center; scope exceeds traditional Medicare/Medicaid in flexibility and coordination[1][3][5].
- Varies by: region

**How to apply:**
- No active PACE providers in South Dakota; contact South Dakota Department of Human Services (DHS) for updates on implementation (general LTSS line not specified in results; feasibility study ongoing)[5]
- Process (generalized, state-specific when implemented): Intake consultation at PACE center/home, in-home assessment, nursing facility level of care determination, Medicaid eligibility check if applicable, care plan development[5]

**Timeline:** Varies by state and provider; not specified for South Dakota (generalized process from intake to enrollment)
**Waitlist:** Potential waitlists depend on provider capacity; none currently as no programs operational[5]

**Watch out for:**
- PACE not currently available anywhere in South Dakota—no providers operational despite feasibility study[5][6]
- Must live in a PACE service area; moving out requires disenrollment
- Nursing home level of care certification by state is strict—needs assessment proves inability to live safely without intensive support
- Private pay option averages $4,000–$5,000/month if not Medicaid-eligible; no financial aid beyond that[2]
- Cannot be in Medicare Advantage or hospice; disenrollment possible but regulated[1]
- 90% participants dual-eligible—check Medicaid first for free coverage[1]

**Data shape:** No operational programs in South Dakota (feasibility study phase only); eligibility not financially restricted but geographically limited to zero service areas; benefits coordinated via interdisciplinary team without caps; Medicaid asset/income rules apply indirectly for full coverage

**Source:** https://dhs.sd.gov (South Dakota Department of Human Services; see LTSS provider portal for PACE feasibility study)

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: South Dakota follows federal guidelines tied to FPL with state-specific dollar amounts that change annually. For 2025/2026 (estimates vary slightly by source): QMB (100% FPL): Individual ≤$1,275-$1,350/month, Couple ≤$1,724-$1,824/month. SLMB (120% FPL): Individual ≤$1,526/month, Couple ≤$2,064/month. QI (135% FPL): Individual ≤$1,715-$1,781/month, Couple ≤$2,320-$2,400/month. Limits include $20 disregard for some; must be Medicare Part A/B entitled. Full household table not specified beyond individual/couple—contact DSS for exact current figures as they adjust yearly.[1][2][3][4][6]
- Assets: Applies to all programs: Individual $9,430-$9,950 (some older sources cite $4,000); Couple $14,130-$14,910 (older $6,000). Counts: checking/savings, CDs. Exempt: primary home, one car, burial plots, irrevocable burial trusts, personal belongings. Exact exemptions per SD rules—verify with application.[1][3][4][6]
- Must be entitled to/receiving Medicare Part A and B (except QDWI for Part A only).
- U.S. citizen or qualified immigrant.
- Reside in South Dakota.
- Meet countable income after disregards.

**Benefits:** QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copays. SLMB/QI: Pays Part B premiums only. Automatic qualification for Extra Help (Part D low-income subsidy, e.g., ≤$12.65 copay/drug in 2026). No direct services—pure premium/cost coverage.[1][2][3][4]
- Varies by: program_tier

**How to apply:**
- Mail/PDF form: Download 'Application for Medicare Savings Programs' from https://dss.sd.gov/formsandpubs/docs/MEDELGBLTY/270Medicaresavingsapplication.pdf[2]
- Phone: Call SD DSS at 1-877-999-5612 (toll-free, TTY/TDD 1-877-486-2048) or local office for benefits specialist[6]
- Online: Check eligibility/info at https://dss.sd.gov/medicaid/Eligibility/default.aspx; apply via DSS portal or SHIINE assistance[2][6]
- In-person: Local DSS office or SHIINE volunteer (free application help via Senior Health Insurance Information & Education Program)[6]

**Timeline:** Not specified in sources; typically 45 days for Medicaid-related apps—call DSS for current SD timeline.
**Waitlist:** QI has first-come-first-served with priority to prior recipients; limited federal funding may create waitlist[4]

**Watch out for:**
- Income/resource limits change yearly (e.g., 2025 vs 2026 figures differ)—always verify current with DSS.
- QI requires annual reapplication; may have waitlist due to funding.
- Conflicting resource limits in sources ($4k vs $9k)—use current federal/SD ($9k+ individual).
- Must have Part A/B; QMB auto-triggers Extra Help but others may need separate LIS app.
- Countable income uses Medicaid rules with disregards—gross income often disqualifies mistakenly.
- Married couples use joint limits even if only one on Medicare.

**Data shape:** Tiered by program (QMB/SLMB/QI) with strict FPL bands (100%/120%/135%); asset test applies unlike some Medicaid; QI funding-capped with renewal/priority; SD uses single DSS app for all tiers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov/medicaid/Eligibility/default.aspx

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with at least one member age 60 or older (elderly/disabled households) in South Dakota, there is **no gross income limit**; eligibility is based solely on the **net income test** (must be 100% or less of federal poverty guidelines). Standard household limits (Oct 1, 2025–Sept 30, 2026) for reference: |Household Size|Gross Monthly Income (130% FPL)|Net Monthly Income (100% FPL)| |1|$1,696|$1,305| |2|$2,292|$1,763| |3|$2,888|$2,221| |4|$3,483|$2,680| |5|$4,079|$3,138| |6|$4,675|$3,596| |7|$5,271|$4,055| |8|$5,867|$4,513| |Each additional|+ $596|+ $459|. Net income = gross income minus deductions (e.g., standard $209, medical expenses over $35 for elderly/disabled, shelter costs up to $744 cap for non-elderly/disabled households, utilities, child support). Social Security, pensions, VA benefits count as income.[3][2][1]
- Assets: Countable resources ≤ **$4,500** for households with elderly (60+) or disabled member ($3,000 otherwise). **Exempt:** primary home, one vehicle, most retirement savings. Bank accounts and cash count if over limit.[3]
- South Dakota resident; U.S. citizen or certain legal non-citizens.
- All household members need SSN (or apply for one).
- Household includes those who live together and share food purchases/preparation.
- Work requirements exempt for elderly 60+ (apply to able-bodied 16-59 unless exempt).

**Benefits:** Monthly EBT card benefits for groceries (no cash). Amount based on household size, net income, deductions (e.g., example: 2-person elderly household with $1,200 gross might get $415/month after deductions). Max allotment scales by size; subtract 30% of net income from max.[5][3]
- Varies by: household_size

**How to apply:**
- Online: South Dakota Benefits Portal (apply via dss.sd.gov).
- Phone: Contact local DSS office or state helpline (find via dss.sd.gov/economicassistance/snap.aspx).
- Mail/In-person: Local Department of Social Services (DSS) offices statewide; download form from dss.sd.gov.
- Multiple routes available.

**Timeline:** Typically 30 days; expedited if very low income (7 days). No specific SD waitlist mentioned.

**Watch out for:**
- Elderly households skip gross income test but must calculate net income accurately (deductions key: medical >$35, shelter).
- Assets include bank accounts but exempt home/car; many miss retirement savings exemption.
- Include all who share food in household, even non-elderly family.
- South Dakota lacks Broad-Based Categorical Eligibility (BBCE), so stricter asset/income rules than some states.
- Benefits recertify periodically (12 months in SD); report income changes only if rising above limits.

**Data shape:** Elderly/disabled households exempt from gross income test and higher asset limit ($4,500); net income calculated with elderly-specific deductions (uncapped shelter/medical); benefits scale by household size and net income.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov/economicassistance/snap.aspx

---

### Low Income Energy Assistance Program (LIEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income must be at or below 200% of the federal poverty level, based on the most recent three months of income for all household members. Annual limits for 2025 (add $500 per additional person beyond 10): 1 Person: $18,650; 2 Person: $25,142; 3 Person: $31,634; 4 Person: $38,126; 5 Person: $44,618; 6 Person: $51,110; 7 Person: $22,514 (partial table from source, consistent with 200% FPL scaling); 8 Person: $23,014; 9 Person: $23,514; 10 Person: $24,431. Households where all members receive SNAP are automatically categorically income eligible.[1][2][5]
- Assets: No asset limit applies.[1]
- Household must be responsible for heating costs (paid directly to energy supplier or included in rent).
- Everyone age 18+ in the household must sign the application.
- Funding availability affects eligibility.

**Benefits:** One-time supplemental payment for primary heating costs, paid directly to utility company. Amount based on household income, size, and fuel type. Related programs: Crisis (ECIP) for emergencies like shutoffs; Cooling: $1025 for eligible LIEAP households; Weatherization: energy efficiency upgrades (no fixed dollar amount, based on audit).[1][2][5]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: https://www.sd.gov/cs?id=sc_cat_item&sys_id=a254bd6edbf7f410b2fb93d4f3961974
- Mail: South Dakota Department of Social Services, Office of Energy Assistance, 700 Governors Drive, Pierre, SD 57501
- Email: DSSHeat@state.sd.us (scan and send verifications)

**Timeline:** Not specified; apply early as funding is limited and may run out.
**Waitlist:** Possible for Weatherization due to limited funds; not mentioned for core LIEAP.[5]

**Watch out for:**
- Heating assistance only available fall/winter; cooling not standard (separate $1025 program for prior LIEAP recipients).
- Funding limited—apply early, applications may close if funds exhausted.
- Crisis/ECIP requires income eligibility plus immediate crisis (e.g., shutoff notice).
- Roommates sharing utility bill count as one household.[1]
- Weatherization prioritizes elderly/disabled/families with children; renters need landlord permission.

**Data shape:** Income at exactly 200% FPL with 3-month lookback; no asset test; benefits as one-time payment varying by income/size/fuel; Weatherization county-based with priority tiers and waitlists; categorical eligibility via SNAP.

**Source:** https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx

---

### Senior Health Information and Insurance Education (SHIINE)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, those approaching Medicare, and their caregivers.
- Assets: No asset limits.
- Must be a Medicare beneficiary in South Dakota (or approaching Medicare eligibility), or caregiver of such a person.

**Benefits:** Free, confidential, unbiased counseling including: understanding Medicare options (Parts A, B, D, Advantage, Medigap); plan comparisons and enrollments; Medicare appeals; fraud prevention education via SMP (Senior Medicare Patrol); Medicare billing issues; application assistance for low-income programs (e.g., Medicare Savings Programs like QMB/SLMB/QI, prescription assistance); referrals to other agencies; printed materials; one-on-one counseling. No fixed dollar amounts or hours specified.

**How to apply:**
- Phone - Western/Central South Dakota: 1-877-286-9072 or western_region@shiine.net
- Phone - Eastern South Dakota: 1-800-536-8197 or eastern_region@shiine.net
- Phone - Statewide toll-free: 1-888-854-5321
- Website: https://www.shiine.net
- Email: caitlin.christensen@state.sd.us
- In-person: Contact regional coordinators or local counselors via phone/website for appointments

**Timeline:** No formal application processing; services provided via appointment scheduling, typically immediate upon contact.

**Watch out for:**
- Not a healthcare or financial aid program itself—provides education and assistance only, not direct payments or medical services.
- Not affiliated with insurance companies; unbiased and free.
- Contact region-specific numbers for fastest local service rather than statewide line.
- Includes SMP for fraud prevention, which people may overlook.
- Open enrollment periods (e.g., Oct 15-Dec 7 for next year changes) highlighted for timely action.

**Data shape:** No income/asset tests; eligibility tied solely to Medicare status; regionally coordinated with volunteer network; counseling-focused SHIP program, not benefits-paying.

**Source:** https://www.shiine.net

---

### South Dakota Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: No specific age minimum for the person receiving care; program serves children and adults[3][5]+
- Income: No income limit — respite care is available to qualifying families regardless of income[3][9]
- Assets: For elderly/dependent adults through Adult Services and Aging: $30,000 for single individual or $35,000 for married couple (applies regardless of whether one or both spouses need services)[1]
- Child or adult must have a developmental disability, developmental delay (birth to age 3), chronic medical condition (children up to age 18), serious emotional disturbance, severe and persistent mental illness, or traumatic brain injury (prior to age 21)[5]
- Child or adult must live year-round in a family member's home[5]
- Needs assessment and care plan completed by Adult Services and Aging Social Worker must indicate need for respite care (for elderly/dependent adults)[1]
- Individual must have a primary caregiver[1]
- Documentation of diagnosis from physician or therapist must accompany application[3]
- Program available to post-adoptive families (with or without special needs) and foster parents referred by SD Department of Social Services[5]

**Benefits:** For elderly/dependent adults: companionship, involvement in activities of daily living, meal preparation, light housekeeping, personal hygiene tasks; maximum 210 hours per quarter; daily limit of 13 hours; does not cover skilled nursing or medication administration[1]. For children/adults with developmental disabilities: predetermined annual budget (June 1–May 31) with additional funds available for each additional eligible family member[3]
- Varies by: household_size (asset limits vary for single vs. married couples; additional funds per eligible family member for developmental disabilities program)

**How to apply:**
- Mail: Submit completed application form to Respite Care Program Specialist, South Dakota Department of Human Services[3][6]
- In-person: Respite Care Program office at 3800 E. Highway 34, Pierre, SD 57501[5]
- Phone: 605-773-3438 (hours: 8:00am–5:00pm CT, Monday–Friday)[5]

**Timeline:** Not specified in available sources
**Waitlist:** No waitlist mentioned for developmental disabilities respite care program[3]; for elderly/dependent adults through Adult Services and Aging, no waitlist information provided

**Watch out for:**
- Two separate respite care programs exist in South Dakota with different eligibility criteria: one for children/adults with developmental disabilities (no income limit) and one for elderly/dependent adults through Adult Services and Aging (has asset limits of $30,000/$35,000)[1][3]
- For elderly/dependent adults, respite care may not be appropriate if the individual requires skilled nursing or total care[1]
- For elderly/dependent adults, respite care cannot exceed 210 hours per quarter and 13 hours daily — these are hard caps[1]
- Respite Care program for developmental disabilities cannot be accessed by Family Support 360 participants[3]
- Services do not include skilled nursing or medication administration[1]
- For developmental disabilities program, budget is predetermined annually (June 1–May 31), not based on individual need assessment[3]
- Eligibility for elderly/dependent adults is prioritized based on threat of institutionalization and inability to live independently[1]

**Data shape:** South Dakota operates two distinct respite care programs: (1) Developmental Disabilities Respite Care Program (no income limit, predetermined annual budget, serves children and adults with developmental disabilities/delays/conditions) and (2) Adult Services and Aging Respite Care (asset-limited, hour-capped, serves elderly and dependent adults). The search results do not provide specific annual budget amounts for the developmental disabilities program or detailed processing timelines for either program. Provider availability appears to be statewide but is provider-managed, suggesting practical access may vary by region based on provider network density.

**Source:** https://dhs.sd.gov/developmentaldisabilities/respitecare.aspx (referenced in search results; full content not accessible)

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Not more than 125% of the Federal Poverty Level (FPL) established annually by the U.S. Department of Health and Human Services[1][3]. Specific dollar amounts by household size are not provided in available sources, but the income calculation may treat a person with a disability as a family of one[4].
- Assets: Not specified in available sources
- Must be unemployed at time of eligibility determination (or employed with notice of pending termination)[4]
- Must be a resident of the state and county where DLR is authorized to operate SCSEP[1]
- Must be eligible to work in the United States[2]
- Must not have exceeded 48-month/4-year lifetime cap on SCSEP participation[4]

**Benefits:** Part-time work training averaging 20 hours per week at whichever is highest—federal, state, or local minimum wage. Training typically lasts about 6 months before job placement assistance[3]
- Varies by: fixed

**How to apply:**
- In-person: Contact local SCSEP office (specific office locations and phone numbers not provided in available sources)
- Online: Visit www.workworld.org (referenced as a resource)[2]
- Mail: Not specified in available sources

**Timeline:** Not specified in available sources
**Waitlist:** Waitlists may exist; enrollment occurs if eligible and no waiting list is present[3]

**Watch out for:**
- Income limits are based on 125% of Federal Poverty Level, which varies annually and by household size—families must verify current limits with their local office[1][4]
- There is a 4-year lifetime participation cap; individuals cannot re-enroll after exceeding 48 months of cumulative participation[4]
- Place of residence is required at enrollment but not at recertification[4]
- Host agency assignment does not need to be in the participant's county of residence[1]
- Priority is given to certain populations (age 65+, veterans, rural residents, disabled, homeless/at-risk, limited English/low literacy, low employment prospects, failed One-Stop System)[5]

**Data shape:** SCSEP is a federally funded program under Title V of the Older Americans Act with state administration. Benefits are fixed (not scaled by household size). The program emphasizes work-based training rather than direct financial assistance. Income eligibility is the primary barrier; specific dollar thresholds require annual verification with local offices.

**Source:** https://dlr.sd.gov/scsep/

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: People 60 and older are often eligible regardless of income at providers like Dakota Plains Legal Services (DPLS), East River Legal Services (ERLS), and SD Law Help. For general low-income eligibility (which may apply if over 60 but still screened), limits are typically 125% of Federal Poverty Guidelines (ERLS, Access to Justice/A2J), up to 200% for seniors/elderly (A2J, ERLS exceptions, SD Law Help). Exact 2026 FPG dollar amounts not in sources; calculated by household size upon application.[1][2][3][4][5]
- Assets: Non-exempt assets may be considered at ERLS (details on what counts/exempts not specified). No asset limits mentioned for seniors at DPLS or statewide senior programs.[1][4]
- Residence in service area (e.g., DPLS specific counties/regions; ERLS 33 eastern counties: Aurora, Beadle, Bon Homme, Brookings, Brown, Clark, Clay, Codington, Davison, Day, Deuel, Douglas, Edmunds, Faulk, Hamlin, Hand, Hanson, Hutchinson, Jerauld, Kingsbury, Lake, Lincoln, Marshall, McCook, McPherson, Miner, Minnehaha, Moody, Sanborn, Spink, Turner, Union, Yankton).[1][4]
- Greatest economic and social need for DHS Legal Services for Vulnerable Older Adults.[5]
- U.S. citizen or permanent legal resident (ERLS).[4]
- Case must fit program priorities (e.g., elder abuse, long-term care, not all cases accepted).[1][2]

**Benefits:** Civil legal assistance including advice only, brief services (investigation, paperwork preparation), or full representation (appearance as counsel). Specific senior cases: elder abuse, long-term care. Limited assistance; not all cases accepted. No fixed dollar amounts or hours; scope varies by resources and case merits.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Online: https://www.sdlawhelp.org/apply (serves DPLS, ERLS, Access to Justice).[6][7]
- Phone: DPLS (check Areas Served page for offices); ERLS (605) 336-9230 or (800) 952-3015; Access to Justice 855-287-3510; Disaster hotline (605) 444-3719.[2][4][6]
- Email: access.to.justice@sdbar.net (A2J).[6]
- In-person: Local offices (e.g., ERLS, DPLS; refer to provider sites for addresses).

**Timeline:** Not specified in sources.
**Waitlist:** Subject to staff/volunteer availability and resources; services may be denied/limited even if eligible. No formal waitlist details.[4]

**Watch out for:**
- Seniors over 60 often bypass income limits but still face case priority restrictions—not all legal issues accepted (e.g., must fit priorities like elder abuse).[1][2]
- Regional residency required; referral to other offices if outside area.[1][4]
- Even if eligible, services limited by resources/staff; may get advice only, not full representation.[1][4]
- Income calculated by gross household earnings; assets may factor in some programs.[4]
- Apply to find out—encouraged even if unsure.[2]

**Data shape:** Multiple regional providers with 60+ often income-exempt but case-priority restricted; not a single unified statewide program; FPG-based with 125-200% tiers and senior exceptions; county-restricted coverage.

**Source:** https://www.sdlawhelp.org/apply (unified intake); https://www.dpls.org/eligibility; https://dhs.sd.gov/en/ltss/legal-services-for-vulnerable-older-adults

---

### Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; services available without regard to income.
- Assets: No asset limits; no financial eligibility requirements.
- Resident of a long-term care facility in South Dakota (nursing home, assisted living, or community living home), or family/friend advocating for someone attempting to enter such a facility.
- Complaint or issue must impact the health, safety, welfare, or rights of a resident or former resident.

**Benefits:** Advocacy for residents' rights; complaint resolution; information and referral assistance; education on residents' rights; review of medical records; assistance with guardianship, medical/treatment issues, and facility concerns (e.g., staffing shortages); collaboration with facilities to resolve issues.

**How to apply:**
- Phone: 605-773-3656 (to discuss volunteer program or services; contact State Long Term Care Ombudsman)
- Email: LTCO@state.sd.us (include 'Volunteer' in subject line for inquiries)
- In-person: Local ombudsman offices via Department of Human Services Division of Adult Services and Aging
- Online: dhs.sd.gov/ltss/ombudsman-program for information

**Timeline:** Immediate response to complaints; no formal processing time specified.

**Watch out for:**
- Not a Medicaid or financial assistance program—purely advocacy for complaints in long-term care facilities; does not provide direct care (e.g., no helping with walking or wheelchairs); inappropriate for issues outside facility residents' rights (e.g., non-facility complaints, direct medical care, or eligibility determinations); families must first attempt internal resolution where possible; not for licensing/certification disputes directly.

**Data shape:** no income test; open to any long-term care facility resident or advocate without financial barriers; advocacy-only, not service provision; statewide with local ombudsmen; complaint-driven rather than application-based

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.sd.gov/ltss/ombudsman-program

---

### Senior Companions of South Dakota

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: No income limits for clients receiving services. Volunteers (age 55+) must meet income guidelines: 1-person household $30,120; 2-person $40,380; 3-person $49,720; 4-person $60,000; add $5,140 per additional member.[1]
- Assets: No asset limits mentioned for clients or volunteers.
- Clients: disabilities considered, availability of other assistance, live in homes/apartments (especially rural areas).[2][5]
- Volunteers: age 55+, able to serve 15-40 hours/week (average 10-15), healthy enough to provide assistance.[1][5]

**Benefits:** Free companionship visits (no fee to clients): friendship, assistance with daily activities, light housekeeping, meal planning/preparation, playing games, reminiscing, transportation; respite for caregivers; support for recuperating/terminally ill/Alzheimer's families. Volunteers serve 2-4 clients, 15-40 hours/week; receive hourly stipend (~$2.65), mileage/transport, paid holidays/training/leave, insurance.[1][2][4][5][7]
- Varies by: region

**How to apply:**
- Phone: Sioux Falls (605) 361-1133 or toll-free (888) 239-1210; Rapid City (605) 721-8884.[1][2][5]
- In-person/referral: Agencies like DayBreak Adult Day Care (Sioux Falls), Dow-Rummel Village, Good Samaritan Society locations.[2]
- Website inquiry: good-sam.com/senior-companions (for eligibility/volunteer info).[2][5]

**Timeline:** Not specified.
**Waitlist:** Not mentioned; availability may vary by region.

**Watch out for:**
- Program matches low-income volunteers (55+) with clients (21+); families seek services for elderly loved ones, but eligibility prioritizes disabilities/lack of other help over income/age. Volunteer stipend not taxable/doesn't affect benefits, but clients get no direct payment—only visits.[1][2][5]
- Not a paid caregiving service; companions are volunteers with stipends. Rural focus may limit urban access. No fees, but availability depends on volunteer matching.[2][5]

**Data shape:** Dual structure: volunteer program for 55+ low-income (income-tested, stipend) serving non-income-tested clients 21+ (disability-focused); regional offices with separate contacts; no client age minimum but targets frail elderly/disabled.

**Source:** https://www.good-sam.com/senior-companions

---

### Senior Box Program (CSFP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income at or below 150% of the federal poverty guidelines (specific to South Dakota; varies by household size and updated annually by HHS. Contact local agency for current table, as exact dollar amounts not listed in sources but confirmed as 150% FPL for SD participants).[3][6]
- Assets: No asset limits mentioned in South Dakota-specific sources.
- Must reside in a participating South Dakota service area (some local agencies require county residency, e.g., Minnehaha or Lincoln Counties).[1][2]

**Benefits:** Monthly box of nutritious USDA commodity foods, including cereals, canned meat, canned fruits/vegetables, instant milk, peanut butter, instant potatoes, pasta, cheese, juice, oats, rice, dry beans, and sometimes canned entrees like beef stew or chili. Average retail value around $50 per box; provided at no cost for 6-12 months or ongoing while eligible.
- Varies by: fixed

**How to apply:**
- Call local agency to apply (e.g., Salvation Army Sioux Falls: 605-332-2331; Feeding South Dakota: 605-853-3656); apply in-person during distribution hours (e.g., Salvation Army: 2nd Thursday monthly, 10am-12pm/1-3pm CT); no statewide online application mentioned—contact local provider.

**Timeline:** Not specified; apply during office/distribution hours for immediate eligibility check.
**Waitlist:** Possible due to funding limits and local capacity; varies by agency and region (not detailed statewide).

**Watch out for:**
- Not available everywhere—must check local agency service area (e.g., not all counties covered uniformly); cannot participate simultaneously with WIC; some areas have waitlists due to funding; delivery only for homebound; income limit is 150% FPL in SD (higher than federal 130% minimum); can receive with SNAP.
- Local residency often required by agency.
- All participants must be 60+ (no children/women/infants post-2014).

**Data shape:** Administered statewide by SD Dept of Education via local non-profits/food banks with county-specific providers and distribution sites; income at 150% FPL (SD-specific, above federal min); no asset test; monthly boxes fixed content/value regardless of household size.

**Source:** https://doe.sd.gov/cans/csfp.aspx

---

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **Individual need and support plan; specific hours/dollar amounts not detailed in search results**: 1 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **not_applicable**: 2 programs
- **household_size (asset limits vary for single vs. married couples; additional funds per eligible family member for developmental disabilities program)**: 1 programs
- **fixed**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **South Dakota Medicaid for Seniors and Disabled**: Income/asset limits strict for long-term care with spousal protections (CSRA, MMNA); requires medical NHLOC; statewide but local DSS processing; 2026 LTC income $2901 single[1][3][4]
- **Home and Community-Based Options and Person Centered Excellence (HOPE) Waiver**: This program's eligibility is primarily income and asset-tested with a functional (nursing facility level of care) requirement. Benefits are service-based rather than cash-based, with specific services determined by individual support plan. The program operates statewide with a fixed capacity cap. Income limits adjust annually. Home equity is treated as exempt asset under specific conditions. The program requires ongoing participation in assessments and monthly service receipt to maintain eligibility.
- **Program of All-Inclusive Care for the Elderly (PACE)**: No operational programs in South Dakota (feasibility study phase only); eligibility not financially restricted but geographically limited to zero service areas; benefits coordinated via interdisciplinary team without caps; Medicaid asset/income rules apply indirectly for full coverage
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with strict FPL bands (100%/120%/135%); asset test applies unlike some Medicaid; QI funding-capped with renewal/priority; SD uses single DSS app for all tiers.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled households exempt from gross income test and higher asset limit ($4,500); net income calculated with elderly-specific deductions (uncapped shelter/medical); benefits scale by household size and net income.
- **Low Income Energy Assistance Program (LIEAP)**: Income at exactly 200% FPL with 3-month lookback; no asset test; benefits as one-time payment varying by income/size/fuel; Weatherization county-based with priority tiers and waitlists; categorical eligibility via SNAP.
- **Senior Health Information and Insurance Education (SHIINE)**: No income/asset tests; eligibility tied solely to Medicare status; regionally coordinated with volunteer network; counseling-focused SHIP program, not benefits-paying.
- **South Dakota Respite Care Program**: South Dakota operates two distinct respite care programs: (1) Developmental Disabilities Respite Care Program (no income limit, predetermined annual budget, serves children and adults with developmental disabilities/delays/conditions) and (2) Adult Services and Aging Respite Care (asset-limited, hour-capped, serves elderly and dependent adults). The search results do not provide specific annual budget amounts for the developmental disabilities program or detailed processing timelines for either program. Provider availability appears to be statewide but is provider-managed, suggesting practical access may vary by region based on provider network density.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a federally funded program under Title V of the Older Americans Act with state administration. Benefits are fixed (not scaled by household size). The program emphasizes work-based training rather than direct financial assistance. Income eligibility is the primary barrier; specific dollar thresholds require annual verification with local offices.
- **Legal Aid for Seniors**: Multiple regional providers with 60+ often income-exempt but case-priority restricted; not a single unified statewide program; FPG-based with 125-200% tiers and senior exceptions; county-restricted coverage.
- **Long-Term Care Ombudsman**: no income test; open to any long-term care facility resident or advocate without financial barriers; advocacy-only, not service provision; statewide with local ombudsmen; complaint-driven rather than application-based
- **Senior Companions of South Dakota**: Dual structure: volunteer program for 55+ low-income (income-tested, stipend) serving non-income-tested clients 21+ (disability-focused); regional offices with separate contacts; no client age minimum but targets frail elderly/disabled.
- **Senior Box Program (CSFP)**: Administered statewide by SD Dept of Education via local non-profits/food banks with county-specific providers and distribution sites; income at 150% FPL (SD-specific, above federal min); no asset test; monthly boxes fixed content/value regardless of household size.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in South Dakota?
