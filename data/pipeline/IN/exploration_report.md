# Indiana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 17 |
| New (not in our data) | 9 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 10 programs
- **financial**: 5 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Supplemental Nutrition Assistance Program (SNAP)

- **income_limit**: Ours says `$1984` → Source says `$35` ([source](https://www.in.gov/fssa/dfr/snap-food-assistance/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for purchasing nutritious food (amount based on net income, household size, deductions; e.g., example 2-person elderly household: up to $415/month after calculation). Maximum allotment varies by household size (e.g., $546 for 2-person in contiguous states example)[2][5][6].` ([source](https://www.in.gov/fssa/dfr/snap-food-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/fssa/dfr/snap-food-assistance/`

### Energy Assistance Program (EAP)

- **income_limit**: Ours says `$3092` → Source says `$7,644` ([source](https://www.in.gov/ihcda/homeowners-renters/energy-assistance-program-eap/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time annual payment to help with heating/electric bills (exact amount varies by income, household size, fuel type, and funding; not full annual costs; lower benefits expected in 2025-2026; crisis aid for disconnections or emergencies; no fixed dollar/hour specified statewide)[1][2][5]` ([source](https://www.in.gov/ihcda/homeowners-renters/energy-assistance-program-eap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/ihcda/homeowners-renters/energy-assistance-program-eap/`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, impartial one-on-one counseling (in-person, phone, Zoom); plan comparison/enrollment (Medicare, Supplements, Advantage, Part D, Long Term Care); education on Medicare rights/claims/appeals; applications for low-income subsidies (e.g., MSP, LIS); referrals; group presentations; no direct financial aid or fixed hours/dollars—unlimited as needed via trained volunteer counselors[2][5][6].` ([source](https://www.in.gov/ship/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/ship/`

### Home-Delivered Meals (via Aging & Disability Resource Centers)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritionally balanced meals (frozen or hot) delivered to home, typically 5 meals per delivery every two weeks or 5 days a week depending on provider; tailored to dietary needs (e.g., heart-healthy, diabetic); complies with Dietary Guidelines for Americans.[1][3][4][6][9]` ([source](https://www.in.gov/fssa/ddars/bba/nutrition/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/fssa/ddars/bba/nutrition/`

### National Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Five specific services: 1) Information about available services; 2) Assistance gaining access to services; 3) Individual counseling, support groups, caregiver training; 4) Respite care; 5) Supplemental services on limited basis. No fixed dollar amounts or hours specified; amounts vary by funding and provider[3].` ([source](https://www.in.gov/fssa/da/aging/ (Indiana FSSA Division of Aging inferred from context; federal: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[3][5]))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/fssa/da/aging/ (Indiana FSSA Division of Aging inferred from context; federal: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[3][5]`

### Indiana Legal Services (Senior Legal Aid)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal assistance including representation, consultation, advice on public benefits (e.g., food stamps, SSI/SSDI), housing, estate planning, nursing home rights, advance directives, family law with DV, consumer issues. Specific to seniors: protection of rights in nursing homes/assisted living, access to benefits.[3][4][10]` ([source](https://www.indianalegalservices.org/senior/))
- **source_url**: Ours says `MISSING` → Source says `https://www.indianalegalservices.org/senior/`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free, confidential advocacy services including: receiving and investigating complaints; assisting with resolution of issues like quality of care (e.g., call lights not answered, medication errors, poor hygiene), violations of rights (e.g., privacy, dignity, emotional/verbal abuse), transfers/discharges (e.g., improper discharge, Medicaid discrimination); facility visits to monitor resident rights; resident-directed support under federal and state law. No specific dollar amounts, hours, or tiers.` ([source](https://www.in.gov/ombudsman/long-term-care-ombudsman/overview/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/ombudsman/long-term-care-ombudsman/overview/`

### Indiana PathWays for Aging

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Managed long-term services and supports (LTSS) including home and community-based services (HCBS), nursing facility care, transportation to doctor's office, meal preparation help, home health visits, adult day center, hospice; covers services in home/community rather than institutions for those qualifying for institutional care; prior authorizations remain active during transition with 90-day continuity` ([source](https://www.in.gov/pathways/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/pathways/`

## New Programs (Not in Our Data)

- **Hoosier Care Connect** — service ([source](https://www.in.gov/medicaid/members/member-programs/hoosier-care-connect/[3]))
  - Shape notes: Eligibility driven by disability/blindness/SSI status over strict income/asset tables; managed care model with individualized care coordination tiers; statewide but MCE selection required; ABD Medicaid subset excluding Medicare/institutionalized
- **Aged and Disabled Waiver (Indiana)** — service ([source](https://www.in.gov/fssa/da/medicaid-hcbs and https://www.in.gov/medicaid/members))
  - Shape notes: This program's data structure is complex due to recent restructuring (July 2025 split into two age-based waivers). Benefits are individualized through care plans rather than fixed amounts. The program operates through a distributed network of local AAAs/ADRCs, making specific contact information and processing times region-dependent. A waiting list with priority tiers adds another layer of complexity. Income limits are tied to federal SSI amounts, which adjust annually. Home equity limits are set by the state and updated periodically (last noted update in 2024). The program requires dual qualification: Medicaid eligibility AND nursing facility level of care, making it more restrictive than income/asset tests alone.
- **Program for All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.in.gov/fssa/ddars/bba/program-of-all-inclusive-care-for-the-elderly/[5]))
  - Shape notes: County-restricted to limited providers (e.g., Allen, St. Joseph, Richmond areas); no income/asset test for core eligibility; tied to nursing home certification via state assessment; benefits via regional providers with personalized plans.
- **Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://www.in.gov/medicaid/members/member-programs/medicare-savings-program/))
  - Shape notes: Indiana-specific: higher income limits than federal; QMB/SLMB have '-Also' tiers adding full Medicaid; QI funding capped with priority/annual renewal; asset limits federal-standard with standard exemptions.
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/[2]))
  - Shape notes: Decentralized by county LSPs and utility partners; income at 200% FPL or benefit receipt; no age requirement but elderly may qualify via income/SSI; varies significantly by region/utility.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.in.gov/dwd/job-seekers/scsep/))
  - Shape notes: SCSEP is a regionally administered program with multiple providers across Indiana, creating variation in availability, wait times, and application processes by location. Income limits scale by household size and are updated annually by HHS. The program has a hard 4-year lifetime participation cap. Benefits are individualized through the IEP process rather than standardized. Enrollment priority is tiered, affecting placement speed. As of April 2026, some providers are not accepting new applications, so availability is not uniform statewide.
- **Indiana's Senior Property Tax Deduction** — financial ([source](https://forms.in.gov/Download.aspx?id=16789))
  - Shape notes: Two-tier credits (flat $150 + 2% cap Circuit Breaker); AGI single/joint only (no household size scaling); county-administered statewide with annual COLA-adjusted limits; homestead pre-qualification required; post-2025 shift from deduction to credit removes assessed value limits.
- **Structured Family Caregiving** — financial ([source](https://www.in.gov/fssa/da/ (FSSA Division of Aging; FAQ: https://www.in.gov/fssa/files/SFC-FAQ-Families-FINAL.pdf)[1][7]))
  - Shape notes: Requires separate Medicaid A&D/TBI Waiver approval first; tiered daily rates by assessed care level (1-3); statewide via local AAAs/providers; no standalone income table—uses Medicaid limits.
- **Community and Home Options to Institutional Care for the Elderly and Disabled (CHOICE)** — service ([source](https://www.in.gov/fssa/da/files/AAA_Map.pdf (AAA map); program details via local AAAs or 1-800-713-9023[8]))
  - Shape notes: No income/asset tests; eligibility driven by ADL/medical needs assessment; administered by 16 regional AAAs across 92 counties with varying waitlists and providers.

## Program Details

### Hoosier Care Connect

> **NEW** — not currently in our data

**Eligibility:**
- Age: 59+
- Income: Income limits are not explicitly detailed for Hoosier Care Connect in the sources beyond general Medicaid ABD (Aged, Blind, Disabled) guidelines. For institutionalized or waiver-eligible disabled individuals, monthly income up to $2,982 (individual only; spouse/household income not counted) may qualify, with potential patient/waiver liability based on countable income[2]. Specific household size tables like those for other programs (e.g., $3,841.20/month for family size 2 in related categories) do not directly apply; eligibility ties to SSI, MEDWorks, or ABD status[1][2][3].
- Assets: No specific asset limits mentioned in sources; eligibility primarily based on blindness/disability status, SSI receipt, or related factors rather than strict asset tests[1][3][5].
- Blind or disabled
- Not eligible for Medicare
- Not institutionalized (community-living focus)
- Receiving Supplemental Security Income (SSI)
- Enrolled through M.E.D. Works
- Some foster care children
- Medicaid eligibility required[1][3][4][5]

**Benefits:** All Indiana Medicaid-covered benefits under Package A (refer to Indiana Medicaid Covered Services page for details like doctor visits, hospital care, prescriptions, mental health), plus individualized care coordination services based on health needs screening. Enhanced benefits may be offered by managed care entities (MCEs). Services must be medically necessary, provided via Primary Medical Provider (PMP) or referrals; some require prior approval, doctor's order, or have coverage limits. No copays for under 18, pregnant, American Indian/Alaskan Native, or pregnancy/family planning services[1][3][4].
- Varies by: priority_tier

**How to apply:**
- Online: Apply via Indiana FSSA Benefits Portal (learn eligibility at designated HCC link on in.gov/medicaid)[1][2][3]
- Phone: Local FSSA Division of Family Resources (DFR) office (specific numbers via local office locator)
- Mail, fax, or in-person: Local FSSA DFR office[1]
- Select MCE (Anthem, Managed Health Services/MHS, United Healthcare) upon approval[1][3]

**Timeline:** Not specified in sources

**Watch out for:**
- Not for those 60+ or Medicare-eligible (use Indiana PathWays for Aging instead)[1][2][3]
- Must select/assigned to MCE (Anthem, MHS, UnitedHealthcare) and use their PMP network; services need referral/prior auth[1][3][4]
- Institutionalized individuals may qualify under different rules/income up to $2,982 but via Traditional Medicaid or waivers, not standard HCC[2]
- Annual redetermination required (except SSI recipients); foster/aged youth have variations[4]
- One conflicting source incorrectly states age 65+ focus[9]; official is 59 and younger[1][3]

**Data shape:** Eligibility driven by disability/blindness/SSI status over strict income/asset tables; managed care model with individualized care coordination tiers; statewide but MCE selection required; ABD Medicaid subset excluding Medicare/institutionalized

**Source:** https://www.in.gov/medicaid/members/member-programs/hoosier-care-connect/[3]

---

### Aged and Disabled Waiver (Indiana)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ years old, or younger if disabled. As of July 1, 2025, the program split into two waivers: Indiana PathWays for Aging Waiver (60+) and Health & Wellness Waiver (under 60)[6][8]+
- Income: Income must not exceed 300% of the maximum Supplemental Security Income (SSI) amount[2][4]. For 2026, the federal SSI limit is $943/month, making the 300% threshold approximately $2,829/month for individuals. Spousal income is considered for married couples; parental income is NOT considered for applicants under 18[4]
- Assets: Home equity interest must not exceed $713,000 (as of 2024)[1]. Home equity is calculated as current home value minus outstanding mortgage. The home is generally exempt from Medicaid while receiving benefits, but may be subject to Medicaid's Estate Recovery Program after death[1]
- Must be an Indiana resident[3]
- Must be eligible for Indiana Medicaid based on age, blindness, or disability[7]
- Must meet Nursing Facility Level of Care (NFLOC) requirement[1][2]
- Must reside in or be transitioning into an HCBS-compliant (Home and Community-Based Services) non-institutionalized setting[2][3]
- For NFLOC qualification, applicant must have one of: unstable physical condition requiring physician assessment; significant medical condition; need for direct assistance with unstable/complex medical conditions; need for assistance with medical equipment (ventilator, tube feeding, IV, suctioning); or need for prescribed treatments/special routines (acute rehabilitation, continuous oxygen, tracheotomies)[1]

**Benefits:** Range of home and community-based services including community programs and residential assistance to support independent living in the community instead of nursing facilities[5]. Specific services available through Indiana's HCBS program (full list at https://www.in.gov/fssa/da/medicaid-hcbs)[6]
- Varies by: Individual care plan; services are tailored to each participant's needs[5]

**How to apply:**
- In-person: Contact your local Area Agency on Aging (AAA) or Aging and Disability Resource Center (ADRC) for initial assessment[5][7]
- Phone: Call your local AAA/ADRC (specific numbers vary by county; general Medicaid inquiries: https://www.in.gov/medicaid/members)[6]
- Online: Visit https://www.in.gov/medicaid/members for Medicaid eligibility information and https://faqs.in.gov for nursing facility level of care documentation[6]
- Mail: Contact your local AAA/ADRC for mailing procedures

**Timeline:** Not specified in available sources. Initial assessment occurs when contacting AAA/ADRC[7]
**Waitlist:** Yes. Indiana has reached the currently allowed limit for A&D Waiver participants and implemented a waiting list[7]. Priority status is given to: (1) individuals transitioning from 100% state-funded budgets, (2) individuals transitioning from nursing facilities, and (3) individuals discharging from inpatient hospital settings. All other eligible individuals are placed on a first-come, first-served basis[7]

**Watch out for:**
- Program structure changed July 1, 2025: The original Aged and Disabled Waiver split into two programs — Indiana PathWays for Aging Waiver (60+) and Health & Wellness Waiver (under 60)[6][8]. Families must apply to the correct waiver based on age
- Waiting list is active: Indiana has reached capacity and new applicants may face delays. Priority is given only to those transitioning from state-funded programs, nursing facilities, or hospitals[7]
- Home is not fully protected: While the home is generally exempt during Medicaid receipt, it may be subject to Medicaid Estate Recovery Program after the recipient's death, potentially requiring repayment from the estate[1]
- Nursing Facility Level of Care is strict requirement: Simply being elderly or disabled is insufficient; applicant must demonstrate specific functional limitations or medical needs that would typically require nursing home care[1]
- Income limit is 300% SSI, not 100%: This is higher than some assume, but still restrictive for middle-income families. For 2026, approximately $2,829/month for individuals
- Parental income does NOT count for applicants under 18: This is a significant advantage for younger disabled individuals, but only applies to those under 18[4]
- Assessment determines eligibility: A care manager from the local AAA uses the Eligibility Screen (E-Screen) tool to assess functional need — this is not automatic based on diagnosis[1]

**Data shape:** This program's data structure is complex due to recent restructuring (July 2025 split into two age-based waivers). Benefits are individualized through care plans rather than fixed amounts. The program operates through a distributed network of local AAAs/ADRCs, making specific contact information and processing times region-dependent. A waiting list with priority tiers adds another layer of complexity. Income limits are tied to federal SSI amounts, which adjust annually. Home equity limits are set by the state and updated periodically (last noted update in 2024). The program requires dual qualification: Medicaid eligibility AND nursing facility level of care, making it more restrictive than income/asset tests alone.

**Source:** https://www.in.gov/fssa/da/medicaid-hcbs and https://www.in.gov/medicaid/members

---

### Program for All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits; financial criteria not considered for eligibility. Medicaid eligibility may apply separately for funding (e.g., income under $2,901/month for long-term care in 2025, but not required to enroll; pathways exist to qualify via planning).[4][2]
- Assets: No asset limits for PACE eligibility; Medicaid asset rules may apply separately ($2,000 or less excluding primary home for long-term care Medicaid).[4]
- Live in the service area of an Indiana PACE provider (e.g., Allen County for PACE of Northeast Indiana; St. Joseph County or Richmond area for others).[1][5]
- Certified by Indiana as needing nursing home level of care (assessed via Indiana Nursing Home Placement Assessment).[1][5]
- Able to live safely in the community with PACE services support.[1][2]
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice.[2]

**Benefits:** Adult day services (nursing, therapies, meals, nutrition counseling, social work, personal care); PACE physician care; home health and personal care; all prescription drugs; social services; medical specialties (audiology, dentistry, optometry, podiatry, speech therapy); respite care; hospital/nursing home care if needed; transportation. Personalized Care Plan created by Interdisciplinary Team (IDT). No specific dollar amounts or hours stated; comprehensive and sole source for Medicare/Medicaid enrollees.[5]
- Varies by: region

**How to apply:**
- Phone: PACE of Northeast Indiana at 260-469-4148 (TTY: 711); Reid Health PACE contact via provider.[1][5]
- Online eligibility survey/form at provider sites (e.g., pacenein.org).[1][9]
- In-person/home visit scheduled after initial contact.[1]
- State final approval via Indiana Family and Social Services Administration (FSSA).[1]

**Timeline:** Not specified; involves home visit, assessments, IDT care plan creation, and state approval (multi-step process over weeks).[1]
**Waitlist:** Not mentioned; may vary by provider capacity.[null]

**Watch out for:**
- Not statewide—must live in specific provider service area (e.g., Allen County only for some).[1]
- No income/asset test for PACE eligibility, but most participants dually eligible for Medicare/Medicaid; private pay possible but program funded per-member via Medicare/Medicaid.[2][5]
- Cannot be in Medicare Advantage, hospice, or certain other plans.[2]
- Nursing home level of care required but must be able to live safely in community with PACE (not for those already in nursing homes unless PACE covers).[2][5]
- State (FSSA) final approval needed after provider assessment.[1]

**Data shape:** County-restricted to limited providers (e.g., Allen, St. Joseph, Richmond areas); no income/asset test for core eligibility; tied to nursing home certification via state assessment; benefits via regional providers with personalized plans.

**Source:** https://www.in.gov/fssa/ddars/bba/program-of-all-inclusive-care-for-the-elderly/[5]

---

### Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Indiana uses higher-than-federal limits based on percentages of the Federal Poverty Level (150% for QMB, 170% for SLMB, 185% for QI). Exact 2026 monthly limits (higher than federal): QMB - $1,977 single/$2,664 couple; SLMB - $2,238 single/$3,017 couple (upper limit); QI - $2,433 single/$3,281 couple (upper limit). Limits adjust annually April 1 and vary by household size per FPL tables. Must be entitled to Medicare Part A (premium-free for most); Part B required for SLMB/QI.[6][2]
- Assets: Federal limits apply: $9,950 individual, $14,910 married couple (countable resources). Counts: bank accounts, stocks, bonds. Exempt: home/land, one car, burial plots, life insurance (up to $1,500 face value), personal belongings. Indiana follows federal standards without asset test elimination.[6][3][1]
- U.S. citizen, permanent resident, or qualified non-citizen.
- Entitled to Medicare Part A.
- Reside in Indiana.
- Meet citizenship/immigration status.
- For QI: annual reapplication required; first-come, first-served with priority to prior recipients.

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/copays for Medicare-covered services (including Medicare Advantage). Providers cannot bill QMB enrollees for these. QMB-Also adds full Medicaid (Traditional or Indiana PathWays for Aging) for non-Medicare services.[1][2][3] **SLMB:** Pays Part B premiums. SLMB-Also adds full Medicaid.[2] **QI:** Pays Part B premiums; includes Extra Help for drugs (≤$12.65 copay per drug in 2026).[3]
- Varies by: priority_tier

**How to apply:**
- Online: Indiana Medicaid ACCESS portal at https://www.in.gov/medicaid/apply/
- Phone: 1-800-403-0864 (Indiana Medicaid Customer Service)
- Mail: Indiana Medicaid, P.O. Box 1310, Indianapolis, IN 46206
- In-person: Local Family and Social Services Administration (FSSA) office (find via https://www.in.gov/fssa/)

**Timeline:** 30-60 days
**Waitlist:** QI has first-come, first-served with waitlist possible if funds exhausted; priority to prior-year recipients.

**Watch out for:**
- Indiana's income limits higher than federal (150%/170%/185% FPL vs. 100%/120%/135%), so more qualify here than elsewhere.[6]
- QMB-only covers only Medicare services; non-Medicare services denied unless QMB-Also (full Medicaid).[2][4]
- Providers cannot bill QMB for Medicare cost-sharing, but some try—report violations.[1]
- QI requires annual reapplication; funding limited, so apply early.[3]
- Assets include most financial holdings but exempt primary home/car—many miss exemptions.[1]
- Dual eligibles (Medicare + full Medicaid) get extra wraparound via PathWays for Aging if QMB/SLMB-Also.[2]

**Data shape:** Indiana-specific: higher income limits than federal; QMB/SLMB have '-Also' tiers adding full Medicaid; QI funding capped with priority/annual renewal; asset limits federal-standard with standard exemptions.

**Source:** https://www.in.gov/medicaid/members/member-programs/medicare-savings-program/

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with at least one member age 60 or older (elderly) or disabled in Indiana (Oct 1, 2025 - Sept 30, 2026): No gross income limit. Must pass net income test (gross income minus deductions like medical expenses over $35/month for elderly/disabled, shelter costs, utilities). General gross income limits (130% FPL, applicable if no elderly/disabled): 1 person $1,695/month, 2 $2,291, 3 $2,887, 4 $3,482, 5 $4,079, 6 $4,674, 7 $5,270, +$595 each additional. Seniors (60+) only need to meet net income test[1][2][3][6].
- Assets: Households with elderly (60+) or disabled: $4,500 limit (some sources note $5,000 general, but senior-specific is $4,500). Counts: bank accounts, cash, real estate (non-home), personal property, vehicles. Exempt: primary home and lot, household goods/personal belongings, life insurance, most retirement/pension plans, SSI/TANF resources[1][4][6][7].
- Indiana residency
- Citizenship/qualified alien status
- Household includes those who buy/prepare food together (elderly/disabled may apply separately if both disabled and income <165% poverty)
- No work requirement for elderly 60+ (applies to able-bodied under 60/65 per federal changes)
- Cooperation with IMPACT job training if applicable

**Benefits:** Monthly EBT card benefits for purchasing nutritious food (amount based on net income, household size, deductions; e.g., example 2-person elderly household: up to $415/month after calculation). Maximum allotment varies by household size (e.g., $546 for 2-person in contiguous states example)[2][5][6].
- Varies by: household_size

**How to apply:**
- Online: https://www.in.gov/fssa/dfr/snap-food-assistance/ (via ACCESS Indiana portal)
- Phone: Local county office or state helpline (find via in.gov/fssa/dfr)
- Mail: To local Division of Family Resources county office
- In-person: Local county DFR office

**Timeline:** Must receive decision within 30 days; expedited for urgent cases

**Watch out for:**
- Seniors often miss high medical/shelter deductions that lower net income significantly
- Social Security/pensions count as income
- Must include household members who buy/prepare food together (unless separate elderly/disabled rule applies)
- Assets include non-exempt vehicles/real estate; home exempt
- No gross income test for elderly/disabled households in Indiana—many sites show stricter federal rules
- Federal work rules tightened (up to age 65 for some, but exempts elderly 60+)

**Data shape:** No gross income test for households with elderly (60+) or disabled in Indiana; benefits scale by household size and net income after senior-friendly deductions (medical/shelter); statewide via county offices

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/fssa/dfr/snap-food-assistance/

---

### Energy Assistance Program (EAP)


**Eligibility:**
- Income: Gross household income (all adults 18+) at or below 60% of Indiana state median income (60% SMI), based on the most recent 3 months (90 days or 13 weeks) of income. Exact limits vary by household size and year; example for one region (e.g., AES Indiana area): Total last 3 months gross income must not exceed: 1: $7,644; 2: $10,299; 3: $12,954; 4: $15,609; 5: $18,264; 6: $20,919; 7: $23,574. Check current limits via local provider or IHCDA as they update annually[1][3][8].
- Assets: No asset limits mentioned in program guidelines[1][2][3].
- U.S. citizen, U.S. national, or qualified non-citizen (ineligible members do not disqualify household)[2][4]
- Reside in Indiana (some local providers county-specific, e.g., Marion County for IndyEAP)[2]
- Proof of income for all adults 18+ in the past 3 months[2][3][4]

**Benefits:** One-time annual payment to help with heating/electric bills (exact amount varies by income, household size, fuel type, and funding; not full annual costs; lower benefits expected in 2025-2026; crisis aid for disconnections or emergencies; no fixed dollar/hour specified statewide)[1][2][5]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: Via local service provider sites (e.g., indyeap.org for Marion County; ihcda.in.gov for statewide locator)[1][2]
- Phone/In-person/Mail: Contact local service provider (LSP) via IHCDA website for county-specific agency, phone, address (e.g., if facing disconnection, contact utility first)[1][3]
- Application period: Typically Oct 1/3 to April 20/May 15 (e.g., Oct 3, 2024-May 15, 2025; Oct 1, 2025-April 20, 2026 for IndyEAP)[2][3]

**Timeline:** Not specified statewide; varies by local provider[1][3]
**Waitlist:** Funds limited; may run out before season ends, creating effective waitlist/denials late in cycle[2]

**Watch out for:**
- Must reapply every year; prior approval doesn't carry over[2]
- Income based on gross last 3 months for all adults 18+ (including SSI/SSDI)[2][4]
- One-time benefit only; continue paying bills yourself[1]
- If utility credit >$250 (electric) or >$500 (propane/oil), eligible but no benefit until below threshold[4]
- Apply early in season (Oct-May); funds deplete[2][3]
- Contact utility first if disconnection imminent[1]
- Roommates count as household even if not sharing expenses[5]

**Data shape:** Administered via county-specific local service providers (LSPs) under IHCDA; income at 60% SMI over last 3 months with household size table; benefits vary by region, fuel, crisis status; annual reapplication required; no age minimum but priority often elderly/disabled

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/ihcda/homeowners-renters/energy-assistance-program-eap/

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level (FPL), based on 2025 tax return or current guidelines effective February 23, 2026. Example for AES Indiana customers (likely 200% FPL): 1 person $30,120; 2 $40,880; 3 $51,640; 4 $62,400; 5 $73,160; 6 $83,920; 7 $94,680; 8 $105,440 (add $10,760 per additional member). Automatic eligibility if receiving LIHEAP/EAP, TANF, or SSI. Full 2026 FPL table available via local provider[2].
- Assets: No asset limits mentioned in sources.
- Indiana resident.
- Home must be safe to weatherize (determined by Local Service Provider).
- Home not previously weatherized through the program (or specific utility sponsor like NIPSCO in past 3 years).
- For renters: written landlord permission required.
- Homeowner or account holder must be present (at least 18 for some assessments)[1][2].

**Benefits:** Free weatherization services including in-home energy assessments (1-2 hours), insulation, air sealing, energy-efficient product installations to reduce utility bills, improve comfort, and address safety/health issues. No roofing, siding, or window replacement. Specifics determined post-assessment by provider[1][2][3].
- Varies by: region

**How to apply:**
- Contact Local Service Provider (LSP) for your county via IHCDA provider finder: https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/[2].
- NIPSCO customers: Call TRC at 1-800-721-7385[1].
- AES Indiana customers: Partnered with CLEAResult, call 866-908-4915 to verify or schedule[3].
- Examples: CAP of Western Indiana application form (PDF): https://www.capwi.org/wp-content/themes/cap/img/Weatherization-Application.pdf[5]; TRI-CAP, CAPE Evansville via their sites[8][9].
- In-person/virtual assessments available[3].

**Timeline:** Initial assessment 1-2 hours; full weatherization timeline not specified, varies by provider.
**Waitlist:** Yes, eligible clients placed on waitlist by LSP; funds limited, first-come first-served (e.g., NIPSCO 2026 funds)[1][2].

**Watch out for:**
- Funds limited, first-come first-served with waitlists; apply early[1][2].
- Not for major repairs (no roofing/siding/windows); home must be safe[2].
- Previous weatherization (program/utility-specific) disqualifies[1][2].
- Renters need landlord permission; must be present for assessment[1].
- Utility programs (NIPSCO/AES) require their customers; check specific provider[1][3].
- Elderly not explicitly prioritized; income-based only.

**Data shape:** Decentralized by county LSPs and utility partners; income at 200% FPL or benefit receipt; no age requirement but elderly may qualify via income/SSI; varies significantly by region/utility.

**Source:** https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/[2]

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income limits for core SHIP counseling services; available to anyone eligible for Medicare (typically age 65+ or under 65 with certain disabilities), family members, caregivers, and those soon to be eligible. Separate assistance programs helped by SHIP (e.g., Medicare Savings Programs via Indiana Medicaid) have income limits: QMB at or below 150% FPL (e.g., ~$22,590/year for individual in 2026); SLMB/QI at or below 185% FPL (~$27,870/year for individual); exact FPL varies annually by household size—no full table in sources[2][4]. If income < $2,500/month with limited assets, may qualify for help with uncovered Medicare costs[2].
- Assets: No asset limits for core SHIP counseling. For related low-income assistance programs (e.g., via Medicaid), limited resources apply but specifics not detailed; consult SHIP for current thresholds[2][4].
- Must be eligible for Medicare or soon eligible
- Family members/caregivers of Medicare beneficiaries also qualify
- Indiana resident[1][2]

**Benefits:** Free, impartial one-on-one counseling (in-person, phone, Zoom); plan comparison/enrollment (Medicare, Supplements, Advantage, Part D, Long Term Care); education on Medicare rights/claims/appeals; applications for low-income subsidies (e.g., MSP, LIS); referrals; group presentations; no direct financial aid or fixed hours/dollars—unlimited as needed via trained volunteer counselors[2][5][6].

**How to apply:**
- Phone: 1-800-452-4800 (statewide), TTY: 1-866-846-0139[8]
- Website: https://www.in.gov/ship/[2][8]
- In-person/remote: Local providers e.g., Central Indiana (317-803-6131 via CICOA), Porter County (219-464-1028 or SHIP@portercountyacs.org)[4][5]
- No specific online form or mail address listed; contact to schedule counseling/appointments[2]

**Timeline:** Immediate counseling availability by phone; appointments scheduled as needed, no formal processing[1][5].

**Watch out for:**
- SHIP itself is free counseling only—not direct financial aid or healthcare; confuses with Medicare Savings Programs (MSP) it helps apply for, which have strict income/asset tests[2][4]
- Not affiliated with insurers—impartial, doesn't sell plans[2][6]
- Peak demand during Open Enrollment (Oct 15-Dec 7); contact early[5]
- Separate from Indiana Medicaid low-income programs it assists with[4]

**Data shape:** no income test for counseling; helps apply for tiered subsidy programs (QMB/SLMB) with FPL-based limits; delivered statewide via regional volunteer networks

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/ship/

---

### Home-Delivered Meals (via Aging & Disability Resource Centers)


**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned; program is free with encouraged voluntary donations. Eligibility focuses on need rather than financial thresholds.[5][3][4]
- Assets: No asset limits or tests apply; no details on what counts or exemptions as financial means-testing is not required.[5]
- Homebound or confined to home due to physical/mental health reasons and unable to prepare own meals.[4][3][6]
- Spouse of someone 60+.[5][4][3][8]
- Under 60 with disability receiving services through CHOICE, SSBG, or Medicaid Waiver.[4]
- Limited mobility or support systems.[3]

**Benefits:** Nutritionally balanced meals (frozen or hot) delivered to home, typically 5 meals per delivery every two weeks or 5 days a week depending on provider; tailored to dietary needs (e.g., heart-healthy, diabetic); complies with Dietary Guidelines for Americans.[1][3][4][6][9]
- Varies by: region

**How to apply:**
- Contact local Aging & Disability Resource Center (ADRC) or Area Agency on Aging (AAA) by phone for screening; find via INconnect Alliance website.[5][1]
- Examples: CICOA ADRC (317) 803-6131 or (800) 432-2422[3][4]; REAL Services (574) 256-1649[6]; Chef for Hire assistance (317) 637-0845[1]
- Online application for some providers (e.g., REAL Services Meals on Wheels).[6]
- In-person or phone screening required; have applicant available for consent.[3][4]

**Timeline:** Not specified; screening via phone appointment.[3][4]
**Waitlist:** Yes, in high-demand areas like St. Joseph and Elkhart counties (REAL Services); regional variation likely.[6]

**Watch out for:**
- Must contact specific local ADRC/AAA—no central statewide application; find via INconnect Alliance.[5][1]
- Homebound status strictly required—not for those who can prepare meals or shop.[4][3][6]
- Waitlists common in busy regions; under-60 disabled must call specific providers.[6]
- Voluntary donations encouraged but not mandatory; applicant must consent during screening.[3][4][5]
- Spouses or disabled under 60 qualify only under specific conditions (e.g., living with 60+).[8][4]

**Data shape:** Administered via 16 local ADRCs/AAAs with regional providers and delivery variations; no income/asset test, priority on functional need (homebound); waitlists regional.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/fssa/ddars/bba/nutrition/

---

### National Family Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: No specific income limits stated in sources for NFCSP; state implementation may vary and often prioritizes low-income caregivers but does not mandate strict cutoffs like Medicaid programs[3][5].
- Assets: No asset limits mentioned; unlike Medicaid-linked programs, NFCSP focuses on caregiver support without asset tests[3].
- Caregiver must be an adult family member or informal caregiver (may include under 18 at provider discretion) providing care to individuals 60+ years old[3]
- Caregivers to individuals of any age with Alzheimer’s or related disorders[3]
- Older relatives (55+) caring for children under 18 (not parents) or adults 18-59 with disabilities[3][5]
- Care recipient must reside in family home or with legal guardian (for certain disability-related eligibility)[2]
- Services not available if receiving other funded programs like Medicaid waivers or specific state services[2]

**Benefits:** Five specific services: 1) Information about available services; 2) Assistance gaining access to services; 3) Individual counseling, support groups, caregiver training; 4) Respite care; 5) Supplemental services on limited basis. No fixed dollar amounts or hours specified; amounts vary by funding and provider[3].
- Varies by: priority_tier

**How to apply:**
- Contact Indiana Association of Area Agencies on Aging at 317-205-9201 for information, referrals, and local providers[5]
- Call INConnect Alliance at 800-445-8106 for state program support[5]
- Contact local Area Agency on Aging (AAA) via Family and Social Services Administration at 800-457-8283[5]
- Alzheimer’s-specific: Alzheimer’s Association Greater Indiana Chapter at 800-272-3900[5]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by local AAA funding and demand.

**Watch out for:**
- Not a paid caregiving program like Indiana's Structured Family Caregiving (SFC) or Medicaid waivers; provides support services/respite, not stipends[1][3]
- Ineligible if care recipient receives other funded services (e.g., Medicaid waivers, BDDS, CHOICE)[2]
- State-specific implementation via AAAs; contact local office as federal guidelines allow flexibility[3][5]
- Prioritizes grandparents/relatives 55+ caring for children/disabled adults; families with 60+ recipients may compete for limited funds[5]
- No guaranteed enrollment; depends on local availability and assessments.

**Data shape:** Administered locally through 16 Indiana Area Agencies on Aging with no statewide income/asset tests; services limited and discretionary; often confused with paid programs like SFC or Medicaid self-direction.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/fssa/da/aging/ (Indiana FSSA Division of Aging inferred from context; federal: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[3][5]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[4][5]. The exact dollar amounts vary annually and by household size, as established by the U.S. Department of Health and Human Services[5]. For example, income limits are adjusted each year; contact your local SCSEP office for current year thresholds. A person with a disability may be treated as a family of one for income calculation purposes[5].
- Assets: Not specified in available program documentation. Contact local SCSEP office for asset limit information if applicable.
- Must be unemployed (or employed with notice of pending termination)[5]
- Must be a resident of Indiana[1][8]
- Must be eligible to work in the U.S.[1]
- Must be actively seeking employment[1]
- Must be willing to provide community service and attend required meetings and training[3]
- Must be willing to develop a personalized Individual Employment Plan (IEP)[3]
- Must be willing to use all available resources that assist in job searches and economic self-sufficiency[3]
- Cannot have exceeded the 48-month/4-year lifetime cap on SCSEP participation prior to enrollment[5]

**Benefits:** Wage-based on-the-job training experiences with 501(c)(3) nonprofit organizations[8]. Participants receive subsidized employment while training for unsubsidized employment. One participant reported: 'The training has been invaluable, uplifted and boosted my self confidence, and the pay has helped me to pay my bills in a timely fashion'[4]. Specific hourly rates and maximum weekly hours are not detailed in available documentation.
- Varies by: Individual circumstances; benefits are customized through the Individual Employment Plan (IEP) process[3][8]

**How to apply:**
- Phone: Call 765-830-WORK if you live in a county served by Indiana's Department of Workforce Development (DWD)[1]. You will be connected to Vantage Aging, the state's SCSEP partner[1].
- In-person: Visit your local SCSEP office to complete an application[4]
- Contact local SCSEP providers: Eastern Indiana Works (easternindianaworks.org/scsep)[2], Goodwill Indy (goodwillindy.org/employment-services)[7], or National Able service areas[3]

**Timeline:** Not specified in available documentation. Contact your local SCSEP office for current processing timelines.
**Waitlist:** If eligible and there is no waiting list, you will be enrolled to train at a nonprofit organization in your community[4]. Waitlist status varies by region and funding availability.

**Watch out for:**
- Four-year lifetime cap: Participants cannot exceed 48 months (4 years cumulative) of SCSEP participation in their lifetime[5]. This is a hard limit that resets only if you leave and re-enter after a break.
- Income recertification required: Income must be recertified at least semi-annually to maintain eligibility[3]. Changes in income can affect continued participation.
- Enrollment priority system: While anyone meeting basic eligibility can apply, enrollment priority is given to veterans/qualified spouses, individuals over 65, those with disabilities, limited English proficiency, low literacy skills, rural residents, homeless/at-risk individuals, formerly incarcerated individuals, and those who have failed to find employment[2][6]. This affects placement timing.
- Community service requirement: Participants must be willing to provide community service as part of the program[3]. This is not optional.
- Regional funding variations: Available slots and wait times vary significantly by region and provider. Some providers (like Goodwill Indy) may not be accepting applications at certain times[7].
- Place of residence applies only at enrollment: While residency in a service area is required to enroll, it does not need to be verified at recertification[5].
- Nonprofit placement only: Training occurs exclusively with 501(c)(3) nonprofit organizations[8], not for-profit businesses.
- Individual Employment Plan (IEP) is mandatory: Participants must develop and follow a personalized IEP; this is not optional[3].

**Data shape:** SCSEP is a regionally administered program with multiple providers across Indiana, creating variation in availability, wait times, and application processes by location. Income limits scale by household size and are updated annually by HHS. The program has a hard 4-year lifetime participation cap. Benefits are individualized through the IEP process rather than standardized. Enrollment priority is tiered, affecting placement speed. As of April 2026, some providers are not accepting new applications, so availability is not uniform statewide.

**Source:** https://www.in.gov/dwd/job-seekers/scsep/

---

### Indiana Legal Services (Senior Legal Aid)


**Eligibility:**
- Age: 60+
- Income: Generally 125% of Federal Poverty Guidelines (FPG). Up to 200% FPG if income is committed to medical/nursing home expenses (excluding that portion), or for obtaining/maintaining governmental benefits for low-income individuals/families. Exact 2026 dollar amounts not specified in guidelines; refer to current FPG table adjusted for household size. Some senior projects have less restrictive guidelines due to specialized funding.[2][1][4]
- Assets: Countable assets must be under $10,000. Excludes primary residence, one vehicle, and some other items.[2]
- Indiana resident with non-criminal civil legal issue.
- U.S. citizen, legal immigrant, or victim of crime/trafficking without legal status.
- Not fee-generating case unless no private attorney available.
- Priorities include public benefits, housing, family law with domestic violence, consumer law, access to healthcare/government benefits.

**Benefits:** Free civil legal assistance including representation, consultation, advice on public benefits (e.g., food stamps, SSI/SSDI), housing, estate planning, nursing home rights, advance directives, family law with DV, consumer issues. Specific to seniors: protection of rights in nursing homes/assisted living, access to benefits.[3][4][10]
- Varies by: priority_tier

**How to apply:**
- Online: https://www.indianalegalservices.org/applyonline/ (20 minutes, questions on income/assets/household)[3][5][9]
- Phone: Apply by calling ILS (specific number not listed; use online or site contact)[9]
- In-person/mail: Contact local ILS office via website
- IN Free Legal Answers for screening: https://www.indianalegalservices.org/applyonline/[9]

**Timeline:** Decision within about 14 days[3][5]
**Waitlist:** Not mentioned; case acceptance not guaranteed upon application[3]

**Watch out for:**
- Submitting application does not guarantee case acceptance[3][5].
- No criminal cases, but helps with expungements/specialized driving privileges[2].
- Senior projects have different (often less restrictive) eligibility than general ILS[2][4].
- Fee-generating cases generally not handled[2].
- Must fit ILS priorities; not all civil issues covered.

**Data shape:** Senior-specific projects have relaxed income/asset rules vs. general ILS; statewide but with regional offices and specialized funding variations; eligibility tied to FPG with medical expense deductions and benefit-seeking exceptions.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.indianalegalservices.org/senior/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; open to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Resident of a nursing home or licensed assisted living facility in Indiana.
- Anyone can contact on behalf of a resident: residents themselves, relatives, friends, facility staff, or community members concerned about resident welfare.

**Benefits:** Free, confidential advocacy services including: receiving and investigating complaints; assisting with resolution of issues like quality of care (e.g., call lights not answered, medication errors, poor hygiene), violations of rights (e.g., privacy, dignity, emotional/verbal abuse), transfers/discharges (e.g., improper discharge, Medicaid discrimination); facility visits to monitor resident rights; resident-directed support under federal and state law. No specific dollar amounts, hours, or tiers.

**How to apply:**
- Phone: State Ombudsman 1-800-622-4484 or 317-232-7134.
- Email: Via local or state ombudsman program (specific addresses not listed; contact via phone).
- Mail: Office of the Long Term Care Ombudsman, 402 West Washington Street, Room W451, Post Office Box 7083, MS 27, Indianapolis, Indiana 46207-7083.
- In-person: Local ombudsman offices across the state (contact state line for nearest).
- No formal application form for services; contact to file a complaint or request assistance directly.

**Timeline:** Not specified for service requests; volunteer certification process takes 4-6 weeks (application review, interview, background/reference checks, approval).

**Watch out for:**
- Not a direct service provider (e.g., no healthcare, financial aid, or placement); purely advocacy and complaint resolution.
- Services resident-directed and confidential; ombudsman access to records requires resident/client consent or legal determination of incapacity.
- Primarily for long-term care facilities; home care complaints authorized but not actively handled due to lack of funding.
- Anyone can contact, but focuses on protecting rights in nursing homes and licensed assisted living.
- Volunteering has separate requirements (18+, background check, no conflicts of interest) and is not required for receiving services.

**Data shape:** no income test; advocacy-only (no financial benefits); statewide via local offices; facility-residents only (home care statutorily authorized but unfunded)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/ombudsman/long-term-care-ombudsman/overview/

---

### Indiana's Senior Property Tax Deduction

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Adjusted Gross Income (AGI) from the calendar year preceding by two years the year taxes are due: $60,000 for single filers; $70,000 for married filing jointly or shared ownership (for taxes first due 2026, payable 2025-2026). For Circuit Breaker Credit taxes due 2027, limits increase to $61,860 single / $71,960 joint. No variation by household size beyond single/joint filing status.
- Assets: No asset limits mentioned.
- Must be 65 or older on or before December 31 of the year prior to taxes first due and payable.
- Must qualify for (and have qualified last year or late spouse qualified) the homestead standard deduction on the property.
- Applicant and joint tenants/tenants in common must reside in the home for at least one year before claiming.
- Surviving un-remarried spouse: at least 60 if decedent spouse was 65+ at death and all other criteria met.
- Own and reside in the property as primary homestead.

**Benefits:** Over 65 Credit: flat $150 credit on property tax bill (replaced prior deduction of up to $14,000 or half assessed value). Over 65 Circuit Breaker Credit: limits property tax bill increase to 2% from prior year.
- Varies by: fixed

**How to apply:**
- Download form from https://forms.in.gov/Download.aspx?id=16789 or county auditor's office website.
- Mail or deliver in-person to county auditor's office.
- Contact local county auditor's office for application (no statewide phone; varies by county).

**Timeline:** Must submit by January 15 of the year taxes are due (e.g., Jan 15, 2026 for 2026 taxes); income proof due within 2 weeks of application or by deadline if near Jan 15. Eligible reapplicants not required to refile annually.

**Watch out for:**
- Deduction replaced by $150 Credit starting taxes due 2026 (2025 assessment); prior deduction recipients may auto-switch but verify with county.
- AGI based on year two years prior (e.g., 2023 AGI for 2026 taxes); must provide full federal tax return.
- Must already qualify for homestead deduction (standard + supplemental); residency strictly one year minimum.
- Surviving spouse over 60 only if un-remarried and spouse was 65+.
- Deadline Jan 15 strict; late apps denied.
- Circuit Breaker separate but combinable; expanded in 2025 SEA 1 with no assessed value cap.

**Data shape:** Two-tier credits (flat $150 + 2% cap Circuit Breaker); AGI single/joint only (no household size scaling); county-administered statewide with annual COLA-adjusted limits; homestead pre-qualification required; post-2025 shift from deduction to credit removes assessed value limits.

**Source:** https://forms.in.gov/Download.aspx?id=16789

---

### Structured Family Caregiving

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Care recipient must qualify for Indiana Medicaid A&D (Aged & Disabled) Waiver or TBI Waiver, which has income limit of generally $2,982/month in 2026 for applicant (non-applicant spouse income not counted); asset limit of $2,000 for applicant (higher Community Spouse Resource Allowance for non-applicant spouse if married). Limits vary by household size via Medicaid rules—no specific SFC table provided[1][2][5].
- Assets: Medicaid waiver standard: $2,000 countable assets for applicant (exempt: primary home if intent to return, one vehicle, personal belongings, burial plots; jointly owned assets considered for married couples with spousal allowances)[2].
- Care recipient: Indiana resident, eligible for A&D or TBI Medicaid Waiver, needs assistance with at least 2-3 ADLs (e.g., bathing, dressing, eating, toileting, transferring), requires daily support/supervision, prefers home-based care over institution[1][3][4][5].
- Caregiver: 18+ years old, live in same household as recipient, pass criminal background check (no abuse/neglect/exploitation history), complete assessment/training, willing/able to provide daily care; can be family, friend, or neighbor (not spouse per some providers; not required to be family or RN)[1][2][3][4][5][6].

**Benefits:** Daily rate/per diem payment to caregiver based on needs assessment level (Level 1: 1-20 hours/week; Level 2: 21-40 hours/week; Level 3: 41+ hours/week until July 1, 2024—thereafter needs-based); up to ~$2,000/month possible; plus ongoing training/support from case manager/RN[1][4][7][8].
- Varies by: priority_tier

**How to apply:**
- Contact Indiana FSSA Division of Aging at 1-800-457-8283 or local Area Agency on Aging (AAA)[1][4].
- Work with care manager/provider (e.g., FreedomCare, ResCare, Careforth, Paid.care) for assessment/enrollment[1][4][5][8].
- No specific online URL or form listed; case manager submits application after assessment[1].

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; waiver eligibility may involve waitlists.

**Watch out for:**
- Tied to A&D or TBI Medicaid Waiver eligibility (financial/functional needs assessed separately; potential waitlists).
- Caregiver must live in same household and pass background/training; spouse often ineligible[1][2][4].
- Payment levels determined by care manager assessment (not fixed hours/dollars upfront)[7].
- Cannot double-dip: primary caregiver unavailable for separate home health aide pay[7].
- Until July 1, 2024, levels based on prior attendant care hours for under-18s[7].

**Data shape:** Requires separate Medicaid A&D/TBI Waiver approval first; tiered daily rates by assessed care level (1-3); statewide via local AAAs/providers; no standalone income table—uses Medicaid limits.

**Source:** https://www.in.gov/fssa/da/ (FSSA Division of Aging; FAQ: https://www.in.gov/fssa/files/SFC-FAQ-Families-FINAL.pdf)[1][7]

---

### Community and Home Options to Institutional Care for the Elderly and Disabled (CHOICE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 or older, or any age with a disability+
- Income: No income limits or exclusions; financial eligibility does not exclude based on income. Certain medical expenses may be excluded from income calculations.[8]
- Assets: No asset limits specified; certain medical expenses may not be counted in asset calculations.[8]
- At risk of losing independence due to impairments in Activities of Daily Living (ADLs) such as bathing, dressing, eating, toileting, transferring, mobility, medication management.
- Severe, complex, and unstable medical conditions or substantial medical conditions limiting ADLs.
- Long-term or lifelong limitations (e.g., dependence on others for personal care, communication issues, learning/maintaining self-care, mobility between environments, decision-making/judgment).
- Determined via Long-Term Care Services Eligibility Form.[7][8]

**Benefits:** In-home support services to help elderly (60+) and disabled individuals remain at home instead of institutional care. Specific services address ADLs including bathing, eating, dressing, toileting, medication setup; not comprehensive healthcare coverage.[7][8]
- Varies by: region

**How to apply:**
- Phone: Call local Area Agency on Aging (AAA) or 1-800-713-9023 to identify local office and request application.[8]
- In-person: Contact local AAA for the county of residence.[7][8]

**Timeline:** Not specified
**Waitlist:** Waiting lists managed regionally by local AAAs; varies by area.[8]

**Watch out for:**
- Does not provide comprehensive healthcare coverage or automatic Medicaid enrollment; cannot use funds if Medicare/Medicaid covers needs.[8]
- Must contact local AAA—program is regionally administered, not centralized.[7][8]
- Eligibility focuses on functional ADL impairments and risk of institutionalization, not just age or diagnosis.[7]
- Waiting lists common due to regional availability.[8]

**Data shape:** No income/asset tests; eligibility driven by ADL/medical needs assessment; administered by 16 regional AAAs across 92 counties with varying waitlists and providers.

**Source:** https://www.in.gov/fssa/da/files/AAA_Map.pdf (AAA map); program details via local AAAs or 1-800-713-9023[8]

---

### Indiana PathWays for Aging


**Eligibility:**
- Age: 60+
- Income: Follows standard Indiana Medicaid income limits for aged, blind, or disabled categories (specific dollar amounts not detailed in sources; varies by household size per traditional Medicaid rules). No unique PathWays-specific income table provided.
- Assets: Medicaid asset rules apply. Home equity limit of $730,000 if living in home or intent to return. Exemptions: spouse living in home, child under 18 in home, disabled or blind child in home.
- Indiana resident
- Eligible for full Medicaid coverage in aged, blind, or disabled category (with or without Medicare)
- May require Nursing Facility Level of Care (NFLOC) for HCBS or nursing home services: help with ≥3 ADLs (bathing, dressing, mobility, eating, toileting) or medically unable to self-care; assessed by Area Agency on Aging (AAA) or from July 2025 by Maximus Health Services LCAR
- Exclusions: under 60, Healthy Indiana Plan, Hoosier Healthwise, certain DDRS waivers (Family Support, CIH, TBI), Emergency Services Only, Breast/Cervical Cancer Program (MA12), residents with intellectual/developmental disabilities in immediate care

**Benefits:** Managed long-term services and supports (LTSS) including home and community-based services (HCBS), nursing facility care, transportation to doctor's office, meal preparation help, home health visits, adult day center, hospice; covers services in home/community rather than institutions for those qualifying for institutional care; prior authorizations remain active during transition with 90-day continuity
- Varies by: priority_tier

**How to apply:**
- Automatic enrollment for eligible current Medicaid members (letters sent with MCE selection instructions ahead of 60th birthday or after Medicaid application)
- Select Managed Care Entity (MCE): Anthem, Humana, UnitedHealthcare; can change until July 1 or within 90 days of start
- Verify eligibility via IHCP Provider Portal, GABBY phone system, or 270/271 transactions
- Official site: https://www.in.gov/pathways/

**Timeline:** Automatic for current members; plan changes effective January 2025 for open enrollment (Oct-Dec 2024); 90 days to change plan post-enrollment
**Waitlist:** Not mentioned; transitioned all prior Aged/Disabled Waiver, nursing facility, Hoosier Care Connect on 7/1/24

**Watch out for:**
- Requires underlying Medicaid eligibility (not a standalone program)
- Automatic enrollment but must select MCE or risk default; 90-day change window
- NFLOC needed only for HCBS/nursing; dementia diagnosis alone insufficient
- Excludes specific waivers and programs (e.g., Hoosier Healthwise, DDRS waivers)
- Providers must verify eligibility/MCE each service; prior auths carry over 90 days only
- Home equity $730,000 limit applies specifically

**Data shape:** Managed care LTSS program wrapping existing Medicaid for 60+ ABD; automatic transition/enrollment; services via 3 MCEs; NFLOC tiered by need; no unique income/asset tables beyond Medicaid standards

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/pathways/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Hoosier Care Connect | benefit | state | deep |
| Aged and Disabled Waiver (Indiana) | benefit | state | deep |
| Program for All-Inclusive Care for the E | benefit | local | deep |
| Healthy Indiana Plan Medicare Savings Pr | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Energy Assistance Program (EAP) | benefit | state | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Home-Delivered Meals (via Aging & Disabi | navigator | state | simple |
| National Family Caregiver Support Progra | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Indiana Legal Services (Senior Legal Aid | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Indiana's Senior Property Tax Deduction | benefit | state | deep |
| Structured Family Caregiving | benefit | state | deep |
| Community and Home Options to Institutio | benefit | state | medium |
| Indiana PathWays for Aging | benefit | state | deep |

**Types:** {"benefit":12,"resource":3,"navigator":1,"employment":1}
**Scopes:** {"state":10,"local":1,"federal":6}
**Complexity:** {"deep":12,"simple":4,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/IN/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **Individual care plan; services are tailored to each participant's needs[5]**: 1 programs
- **region**: 4 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **Individual circumstances; benefits are customized through the Individual Employment Plan (IEP) process[3][8]**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Hoosier Care Connect**: Eligibility driven by disability/blindness/SSI status over strict income/asset tables; managed care model with individualized care coordination tiers; statewide but MCE selection required; ABD Medicaid subset excluding Medicare/institutionalized
- **Aged and Disabled Waiver (Indiana)**: This program's data structure is complex due to recent restructuring (July 2025 split into two age-based waivers). Benefits are individualized through care plans rather than fixed amounts. The program operates through a distributed network of local AAAs/ADRCs, making specific contact information and processing times region-dependent. A waiting list with priority tiers adds another layer of complexity. Income limits are tied to federal SSI amounts, which adjust annually. Home equity limits are set by the state and updated periodically (last noted update in 2024). The program requires dual qualification: Medicaid eligibility AND nursing facility level of care, making it more restrictive than income/asset tests alone.
- **Program for All-Inclusive Care for the Elderly (PACE)**: County-restricted to limited providers (e.g., Allen, St. Joseph, Richmond areas); no income/asset test for core eligibility; tied to nursing home certification via state assessment; benefits via regional providers with personalized plans.
- **Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)**: Indiana-specific: higher income limits than federal; QMB/SLMB have '-Also' tiers adding full Medicaid; QI funding capped with priority/annual renewal; asset limits federal-standard with standard exemptions.
- **Supplemental Nutrition Assistance Program (SNAP)**: No gross income test for households with elderly (60+) or disabled in Indiana; benefits scale by household size and net income after senior-friendly deductions (medical/shelter); statewide via county offices
- **Energy Assistance Program (EAP)**: Administered via county-specific local service providers (LSPs) under IHCDA; income at 60% SMI over last 3 months with household size table; benefits vary by region, fuel, crisis status; annual reapplication required; no age minimum but priority often elderly/disabled
- **Weatherization Assistance Program (WAP)**: Decentralized by county LSPs and utility partners; income at 200% FPL or benefit receipt; no age requirement but elderly may qualify via income/SSI; varies significantly by region/utility.
- **State Health Insurance Assistance Program (SHIP)**: no income test for counseling; helps apply for tiered subsidy programs (QMB/SLMB) with FPL-based limits; delivered statewide via regional volunteer networks
- **Home-Delivered Meals (via Aging & Disability Resource Centers)**: Administered via 16 local ADRCs/AAAs with regional providers and delivery variations; no income/asset test, priority on functional need (homebound); waitlists regional.
- **National Family Caregiver Support Program**: Administered locally through 16 Indiana Area Agencies on Aging with no statewide income/asset tests; services limited and discretionary; often confused with paid programs like SFC or Medicaid self-direction.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a regionally administered program with multiple providers across Indiana, creating variation in availability, wait times, and application processes by location. Income limits scale by household size and are updated annually by HHS. The program has a hard 4-year lifetime participation cap. Benefits are individualized through the IEP process rather than standardized. Enrollment priority is tiered, affecting placement speed. As of April 2026, some providers are not accepting new applications, so availability is not uniform statewide.
- **Indiana Legal Services (Senior Legal Aid)**: Senior-specific projects have relaxed income/asset rules vs. general ILS; statewide but with regional offices and specialized funding variations; eligibility tied to FPG with medical expense deductions and benefit-seeking exceptions.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only (no financial benefits); statewide via local offices; facility-residents only (home care statutorily authorized but unfunded)
- **Indiana's Senior Property Tax Deduction**: Two-tier credits (flat $150 + 2% cap Circuit Breaker); AGI single/joint only (no household size scaling); county-administered statewide with annual COLA-adjusted limits; homestead pre-qualification required; post-2025 shift from deduction to credit removes assessed value limits.
- **Structured Family Caregiving**: Requires separate Medicaid A&D/TBI Waiver approval first; tiered daily rates by assessed care level (1-3); statewide via local AAAs/providers; no standalone income table—uses Medicaid limits.
- **Community and Home Options to Institutional Care for the Elderly and Disabled (CHOICE)**: No income/asset tests; eligibility driven by ADL/medical needs assessment; administered by 16 regional AAAs across 92 counties with varying waitlists and providers.
- **Indiana PathWays for Aging**: Managed care LTSS program wrapping existing Medicaid for 60+ ABD; automatic transition/enrollment; services via 3 MCEs; NFLOC tiered by need; no unique income/asset tables beyond Medicaid standards

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Indiana?
