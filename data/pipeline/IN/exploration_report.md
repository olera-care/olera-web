# Indiana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 8 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 2 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Indiana PathWays for Aging Waiver

- **income_limit**: Ours says `$1200` → Source says `$1,304` ([source](https://www.in.gov/pathways/home/[7]))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Home and Community-Based Services (HCBS) as alternative to nursing facility: transportation to doctor's office, meal preparation/help, home health visits, adult day center, and many other supports based on assessed needs. No fixed dollar amounts or hours specified; individualized per NFLOC and care plan.[1][3][7]` ([source](https://www.in.gov/pathways/home/[7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/pathways/home/[7]`

### Indiana PathWays for Aging (PACE equivalent)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Managed long-term services and supports (LTSS) including home and community-based services (HCBS), nursing facility care, transportation to doctor’s office, meal preparation help, home health visits, adult day center, and other supports based on qualification. Coordinated by managed care entities (MCEs: Anthem, Humana, UnitedHealthcare). Aims for 75% to receive home/community care[1][2][5][6][8]. No specific dollar amounts or hours stated.` ([source](https://www.in.gov/pathways/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/pathways/`

### SNAP (Supplemental Nutrition Assistance Program)

- **income_limit**: Ours says `$1984` → Source says `$35` ([source](https://www.in.gov/fssa/dfr/snap-food-assistance/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for purchasing nutritious food at authorized retailers. Amount based on net income, household size, and deductions (e.g., example: 2-person elderly household with $1,200 gross might get $415/month). Maximum allotments vary by household size/location; scales with need.[2][4][6]` ([source](https://www.in.gov/fssa/dfr/snap-food-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/fssa/dfr/snap-food-assistance/`

### Indiana Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to promote and protect resident rights under federal and state law; regular facility visits by staff and volunteer ombudsmen; investigation and resolution of complaints; representation at involuntary discharge hearings; assistance establishing family councils; resident-directed support.` ([source](https://www.in.gov/ombudsman/long-term-care-ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/ombudsman/long-term-care-ombudsman/`

## New Programs (Not in Our Data)

- **Hoosier Care Connect** — service ([source](https://www.in.gov/medicaid/members/member-programs/hoosier-care-connect/[5]))
  - Shape notes: Managed care Medicaid for non-Medicare ABD under 60; eligibility tied to SSI/M.E.D. Works; benefits via MCE care coordination with individualized screening; income varies by ABD sub-program (e.g., $994/month standard individual, higher for waivers/institutional with liability); county DFR application routing
- **Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://www.in.gov/medicaid/providers/about-ihcp-programs/medicare-savings-programs/))
  - Shape notes: Tiered by QMB (broadest benefits, lowest income), SLMB (Part B only, mid-income), QI (Part B only, highest income); Indiana expands income thresholds above federal mins; statewide uniform but county-administered; QI funding-capped.
- **Indiana Weatherization Assistance Program (Wx)** — in_kind ([source](https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/))
  - Shape notes: This program's structure is highly decentralized: administered through a network of independent Local Service Providers across Indiana, each with its own application process, wait times, and service delivery. Income eligibility is uniform statewide (200% FPL or categorical eligibility), but application methods, processing times, and regional availability vary significantly by LSP. Benefits are customized per home based on energy audit results rather than fixed amounts. Priority is given to elderly residents, individuals with disabilities, and families with children under 18[3]. The program is demand-driven with limited annual funding, making early application critical.
- **Indiana SHIP (State Health Insurance Assistance Program)** — service ([source](https://www.in.gov/ship/))
  - Shape notes: no income test for counseling; service-based only with volunteer delivery via regional aging agencies; distinguishes from income-tested programs like MSPs or Medicaid that it counsels on
- **Meals on Wheels (Indiana)** — service ([source](No single statewide .gov site; primary via in.gov/fssa/ompp (Medicaid-related) or local providers; find via mealsonwheelsamerica.org/find-meals-and-services/))
  - Shape notes: Decentralized by local providers/counties with no uniform statewide eligibility/income test; fee-for-service model with subsidies rather than free-for-all; delivery zone-restricted; no age requirement at many providers
- **Indiana Caregiver Respite Services** — service ([source](https://faqs.in.gov/hc/en-us/articles/360042089872-Who-is-eligible-to-receive-Caregiver-Support-Services (IN.gov); https://www.in.gov/fssa (FSSA/DMHA for waivers)))
  - Shape notes: Respite not standalone; delivered via region-specific AAAs and HCBS waivers with Medicaid gatekeeping; caregiver payments via SFC variant; functional ADL thresholds vary (2-3+); no fixed hours/dollars, POC-based.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.in.gov/dwd/files/INDWD_SCSEP_State_Plan_24-27.pdf (Indiana SCSEP State Plan); https://www.dol.gov/agencies/eta/seniors (federal DOL)[5][7]))
  - Shape notes: Multiple grantees with service area slot limits; priority tiers affect access; no fixed dollar income table in sources (tied to annual FPL); benefits fixed at ~20 hrs/wk min wage but host roles vary by community needs
- **Indiana Senior Legal Aid** — service ([source](https://www.indianalegalservices.org/))
  - Shape notes: Multiple specialized senior projects with varying eligibility (less restrictive than general 125% FPG/$10k assets); delivered via regional ILS offices and AAA funding; no fixed dollar tables in sources—tied to annual FPG updates

## Program Details

### Hoosier Care Connect

> **NEW** — not currently in our data

**Eligibility:**
- Age: 59 years and younger[1][2][5]+
- Income: Standard ABD (Aged, Blind, Disabled) coverage under Hoosier Care Connect has an income limit of $994 per month for individuals not receiving institutional or waiver services. Higher limits apply for institutionalized or waiver-eligible disabled individuals (up to $2,982/month, individual only, may incur patient/waiver liability). Limits vary by program specifics like M.E.D. Works (higher income with premium) and household size/tax household; full table not detailed in sources but effective March 1, 2026, example for family size 2: $3,841.20/month[4][9]
- Assets: Resources like checking/savings accounts counted if aged, blind, disabled, or on Medicare; specific limits/dollar amounts not detailed in sources[3]
- Blind or disabled[1][2][5]
- Not eligible for/enrolled in Medicare[1][2][5]
- Living in the community (not institutionalized, unless specified otherwise)[1][4]
- Receiving Supplemental Security Income (SSI)[1][2][5]
- Enrolled through M.E.D. Works[1][2]
- Some children who are wards of the state, receiving adoption assistance, or formerly/currently in foster care[1]

**Benefits:** All Indiana Medicaid-covered benefits under Package A (refer to Indiana Medicaid Covered Services page for details), plus individualized care coordination services based on health needs screening. Services must be medically necessary, provided via Primary Medical Provider (PMP) or referrals; may have coverage limits, require doctor's order or prior approval. Managed care entities (MCEs) may offer enhanced benefits[2][5]
- Varies by: priority_tier

**How to apply:**
- Online: IndianaMedicaid.com or learn if you qualify online via MHS link[2][3]
- Phone, mail, fax, or in-person at local FSSA Division of Family Resources (DFR) office; find local DFR office by county at Find My Local DFR Office website[2][3]
- Enrollment centers around the state (view list via MHS site)[3]
- Select MCE: Anthem, Managed Health Services (MHS), United Healthcare[5]

**Timeline:** Not specified in sources

**Watch out for:**
- Not for those 60+ or on Medicare (focuses on under 60, non-Medicare blind/disabled)[1][2][5]
- Must select/assigned to MCE (Anthem, MHS, UnitedHealthcare) and stay through calendar year; care via PMP network only[2][5]
- Services require medical necessity, prior approval, or doctor's order; coverage limits may apply[2]
- Income/assets counted strictly for ABD; premiums/liabilities for higher-income like M.E.D. Works or institutionalized[4]
- One source incorrectly states age 65+ (outdated/incorrect)[8]

**Data shape:** Managed care Medicaid for non-Medicare ABD under 60; eligibility tied to SSI/M.E.D. Works; benefits via MCE care coordination with individualized screening; income varies by ABD sub-program (e.g., $994/month standard individual, higher for waivers/institutional with liability); county DFR application routing

**Source:** https://www.in.gov/medicaid/members/member-programs/hoosier-care-connect/[5]

---

### Indiana PathWays for Aging Waiver


**Eligibility:**
- Age: 60+
- Income: Must be Medicaid-eligible. Specific limits include: Family size of 1: $1,304.17 maximum per month; Family size of 2: $1,762.50 maximum per month (based on tax household). Financial eligibility tied to 300% of SSI maximum (e.g., $2,901/month as of Jan 2025 for single). Varies by SSI standards and household.[3][5]
- Assets: Single: $2,000 maximum; Married: $3,000 maximum. Counts: stocks, property other than primary home, bank accounts, cash. Exempt: Primary home if home equity ≤ $730,000, or if spouse/child under 18/disabled child lives there.[1][3]
- Indiana resident
- Medicaid-eligible based on age, disability, or blindness (SSI, M.E.D. Works, dually eligible, A&D waiver eligible, nursing facility resident, hospice)
- Nursing Facility Level of Care (NFLOC): Help with ≥3 ADLs (bathing, dressing, mobility, eating, toileting) or medically unable to self-care; assessed by Area Agency on Aging (AAA) or from July 2025 by Maximus Health Services LCAR
- Live in home or intent to return
- Not in: Healthy Indiana Plan, Hoosier Healthwise, Family Support/Community Integration/TBI/ESRD waivers, Emergency Services Only, Breast/Cervical Cancer Program, or IDD resident in immediate care
- For ages 60-64: Disability determination (SSA or IHCP)

**Benefits:** Home and Community-Based Services (HCBS) as alternative to nursing facility: transportation to doctor's office, meal preparation/help, home health visits, adult day center, and many other supports based on assessed needs. No fixed dollar amounts or hours specified; individualized per NFLOC and care plan.[1][3][7]
- Varies by: priority_tier

**How to apply:**
- Contact Area Agency on Aging (AAA) for functional assessment
- Enroll via managed care plans (e.g., Anthem); open enrollment Oct-Dec 2024, effective Jan 2025[7]
- Medicaid application through FSSA/IHCP
- Phone/website not specified in results; start at in.gov/pathways or local AAA

**Timeline:** Not specified; functional assessment by AAA, transitioning to Maximus LCAR July 2025[1]
**Waitlist:** Waitlist exists (Pathways Waiver wait list mentioned)[9]

**Watch out for:**
- Must already be Medicaid-eligible or qualify simultaneously; not for Healthy Indiana Plan/Hooser Healthwise
- NFLOC required for HCBS/nursing care (dementia diagnosis alone insufficient)[1]
- Home equity limit $730,000 applies unless exceptions (spouse/child)[1]
- Ages 60-64 need disability verification[4]
- Waitlist common; transitioned from A&D Waiver/HCC/NF July 2024[1]
- Excludes certain other waivers/IDD residents[3]

**Data shape:** Medicaid-gated HCBS waiver with NFLOC assessment; priority tiers for access; managed long-term services via plans; AAA regional assessments; no fixed service hours/dollars—instead individualized

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/pathways/home/[7]

---

### Indiana PathWays for Aging (PACE equivalent)


**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or household size table for PathWays; uses traditional Indiana Medicaid income criteria for aged, blind, or disabled categories (full coverage, with or without Medicare). Exact limits vary by Medicaid rules and are not detailed in program-specific sources[1][3][5].
- Assets: Home equity interest limited to $730,000 if living in home or intent to return. Exemptions: spouse living in home, child under 18 in home, disabled or blind child in home[1]. Other Medicaid asset rules apply.
- Indiana resident
- Eligible for full Medicaid coverage based on age (60+), blindness, or disability
- Nursing Facility Level of Care (NFLOC) required if needing HCBS or nursing home care (generally help with ≥3 ADLs: bathing, dressing, mobility, eating, toileting; assessed by Area Agency on Aging or from July 2025 by Maximus Health Services LCAR)[1]
- Not eligible if: under 60, Healthy Indiana Plan, Hoosier Healthwise, certain waiver members (Family Support, CIH, Traumatic Brain Injury), Emergency Services Only, Breast and Cervical Cancer Program (MA12), or intellectual/developmental disability resident in immediate care[3][4]
- Can be in nursing facility, on Aged & Disabled Waiver, hospice, or Behavioral/Primary Health Coordination[2][3]

**Benefits:** Managed long-term services and supports (LTSS) including home and community-based services (HCBS), nursing facility care, transportation to doctor’s office, meal preparation help, home health visits, adult day center, and other supports based on qualification. Coordinated by managed care entities (MCEs: Anthem, Humana, UnitedHealthcare). Aims for 75% to receive home/community care[1][2][5][6][8]. No specific dollar amounts or hours stated.
- Varies by: individual_need|region

**How to apply:**
- Automatic enrollment for eligible current Medicaid members (letters sent with MCE selection instructions; e.g., ahead of 60th birthday or post-Medicaid application)[5][7]
- Select MCE (Anthem, Humana, UnitedHealthcare); can change within 90 days of start or by deadlines (e.g., until July 1, 2024 for early transition; open enrollment Oct-Dec 2024 effective Jan 2025)[5][7][8]
- Phone: Use IHCP Provider lines or GABBY interactive assistant for eligibility (specific numbers not listed; check in.gov/pathways)[5]
- Online: in.gov/pathways (primary site for info/enrollment details)[3][8]

**Timeline:** Automatic for transitioned members (e.g., 7/1/24 for prior Aged/Disabled Waiver, nursing facility, Hoosier Care Connect); 90-day continuity of care/plan change window[1][5]
**Waitlist:** Not mentioned; automatic enrollment for eligibles, but services depend on assessment[1][5]

**Watch out for:**
- Not a standalone program—requires prior/current Medicaid eligibility under aged/blind/disabled; automatic but exclusions apply (e.g., certain waivers, Hoosier Healthwise)[3][4]
- NFLOC needed for HCBS/nursing care (dementia diagnosis alone insufficient)[1]
- Home equity limit $730,000 applies specifically[1]
- Must select MCE; providers verify eligibility per service via portal/GABBY[5]
- Transitioned automatically 7/1/24 if previously on Aged/Disabled Waiver etc.; prior authorizations active with 90-day continuity[1][5]
- Dually eligible can enroll in D-SNP with MCE for coordinated Medicare/Medicaid[2]

**Data shape:** Medicaid managed LTSS program (not true PACE); automatic enrollment for eligibles via MCEs; no unique income/asset tables (uses standard Medicaid); NFLOC assessment key; statewide but MCE/provider network variations; transitioned prior waiver/nursing members 7/1/24

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/pathways/

---

### Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Indiana uses higher-than-federal limits based on percentages of the Federal Poverty Level (FPL): QMB up to 150% FPL ($1,977/month single, $2,664/month married couple); SLMB up to 170% FPL ($2,238/month single, $2,664/month married couple); QI up to 185% FPL ($2,433/month single, $3,281/month married couple). Limits apply to monthly countable income and are for households of 1-2; larger households scale accordingly but primarily relevant for elderly couples. Limits update annually around April 1.[6]
- Assets: Federal limits apply: $9,950 single, $14,910 married couple (for QMB, SLMB, QI). Countable assets include bank accounts, stocks, bonds; exempt assets include primary home, one vehicle, personal belongings, burial plots, life insurance up to $1,500 face value, and irrevocable burial trusts.[6]
- Must be entitled to Medicare Part A (or eligible for premium-free Part A).
- Indiana resident.
- U.S. citizen or qualified immigrant.
- Not eligible for full Medicaid (but 'QMB-Also' or 'SLMB-Also' provides MSP plus full Medicaid if qualified).[2]

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/copayments for Medicare-covered services (including Medicare Advantage); providers cannot bill QMB enrollees for these. SLMB: Pays Medicare Part B premium only. QI: Pays Medicare Part B premium only. QMB/SLMB 'Also' variants add full Medicaid benefits (Traditional or Indiana PathWays for Aging).[1][2][6]
- Varies by: priority_tier

**How to apply:**
- Online: Indiana Medicaid ACCESS portal at https://www.in.gov/medicaid/apply-and-check-status/ (select Medicare Savings Program).
- Phone: Local Family and Social Services Administration (FSSA) office or Indiana Medicaid at 1-800-403-0864.
- Mail: Send completed application to local FSSA office (find via https://www.in.gov/fssa/da/locations/).
- In-person: Local FSSA Division of Family Resources office (county-based).[2][8]

**Timeline:** 45-90 days typical for Medicaid programs in Indiana; no specific MSP timeline stated but applies retroactively if approved.
**Waitlist:** QI has federal funding caps and potential waitlists (first-come, first-served); QMB/SLMB do not.[1][10]

**Watch out for:**
- Indiana's income limits are higher (150%/170%/185% FPL) than federal minimums (100%/120%/135% FPL)—many miss this and think they don't qualify.[6]
- QMB prohibits providers from balance-billing, but some unaware providers may try—report to state.[1]
- QI has limited federal slots and waitlists; apply early in year.[10]
- 'Also' categories (QMB-Also, SLMB-Also) add full Medicaid if income/assets allow, enabling crossover claims.[2]
- Automatic Extra Help for Part D with QMB; check separately for SLMB/QI.[3]
- Assets include most non-exempt items; pre-planning (e.g., burial trusts) can help qualify.

**Data shape:** Tiered by QMB (broadest benefits, lowest income), SLMB (Part B only, mid-income), QI (Part B only, highest income); Indiana expands income thresholds above federal mins; statewide uniform but county-administered; QI funding-capped.

**Source:** https://www.in.gov/medicaid/providers/about-ihcp-programs/medicare-savings-programs/

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member age 60+ or disabled in Indiana (Oct 1, 2025 - Sept 30, 2026): No gross income limit. Must pass net income test (gross income minus deductions like medical expenses over $35/month for elderly/disabled, shelter costs, utilities). General gross income limits (130% FPL) apply to non-elderly/disabled: 1 person $1,695/month, 2 $2,291, 3 $2,887, 4 $3,482, 5 $4,079, 6 $4,674, 7 $5,270, +$595 each additional. Seniors (60+) often only need to meet net income test.[2][3][6]
- Assets: Most households: $5,000. Households with elderly (60+) or disabled: $4,500 (some sources). Counts: bank accounts, cash, real estate (non-primary), personal property, vehicles. Exempt: primary home and lot, household goods, personal belongings, life insurance, most retirement/pension plans, SSI/TANF resources.[1][2][6][7][8]
- Indiana residency.
- Citizenship or qualified non-citizen status (e.g., 5+ years US residency, children under 18, disability benefits).
- Work registration (exempt for 60+).
- Cooperation with IMPACT job training (exempt for elderly/disabled).
- Household includes those who buy/prepare food together; elderly/disabled may apply separately if both qualify under 165% poverty.

**Benefits:** Monthly EBT card benefits for purchasing nutritious food at authorized retailers. Amount based on net income, household size, and deductions (e.g., example: 2-person elderly household with $1,200 gross might get $415/month). Maximum allotments vary by household size/location; scales with need.[2][4][6]
- Varies by: household_size

**How to apply:**
- Online: https://www.in.gov/fssa/dfr/snap-food-assistance/ (via ACCESS Indiana portal).
- Phone: Local county office or Indiana DFR helpline (find via in.gov/fssa/dfr).
- Mail: Send to local county Division of Family Resources office.
- In-person: Local county FSSA Division of Family Resources office.

**Timeline:** Typically 30 days; expedited for urgent cases within 7 days if qualify.

**Watch out for:**
- Elderly households skip gross income test but must pass net income; high medical/shelter costs can deduct significantly.
- Social Security, pensions, VA/disability count as income.
- Assets include non-primary real estate/vehicles; home exempt.
- Must include household members who buy/prepare food, but elderly/disabled can sometimes separate.
- No work requirements for 60+.
- Benefits only for food, not cash/hot meals.
- Reapply/recertify periodically.

**Data shape:** Expanded eligibility for 60+/disabled (no gross income limit, asset test applies); benefits scale by household size and net income after elderly-specific deductions (medical/shelter); county-administered statewide.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/fssa/dfr/snap-food-assistance/

---

### Indiana Weatherization Assistance Program (Wx)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level as of February 23, 2026[2]. For reference, the 2026 guidelines show: Family of 1: $28,660; Family of 2: $38,680; Family of 3: $48,700; Family of 4: $58,720[8]. Alternatively, households receiving Energy Assistance Program (EAP), Supplemental Security Income (SSI), or Temporary Assistance for Needy Families (TANF) are categorically eligible regardless of income[2][3].
- Must be a NIPSCO residential customer with active service (for NIPSCO-administered program)[1]
- Home must not have received NIPSCO-sponsored weatherization in the past three (3) years[1]
- Home must be safe to weatherize as determined by Local Service Provider[2]
- If previously weatherized through this program, may not be eligible — contact LSP to confirm[2]
- Homeowner or account holder must be at least 18 years of age and present for entire assessment[1]
- Renters must provide written permission from landlord/property owner before permanent installations[1]
- Program open to both renters and homeowners[2]

**Benefits:** FREE weatherization services including: weatherstripping, insulation installation, caulking/air sealing, heating system tune-up/repair, water heater tune-up/repair, ductwork and air venting inspection, blower door testing, appliance safety and efficiency testing. Typical appointment duration: 1-2 hours[1][5]. Does NOT include major home repairs such as window/door replacement, roofing, most plumbing, carpet/flooring, or access ramps[5].
- Varies by: household (each home receives customized assessment; exact services determined after inspection)

**How to apply:**
- Contact your Local Service Provider (LSP) — find yours at https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/[2]
- For NIPSCO customers: Call TRC at 1-800-721-7385[1]
- Mail application to your regional LSP (example: Lincoln Hills Development Corporation, ATTN: Mike Weatherization Manager, P.O. Box 336, Tell City, IN 47586)[5]
- Email application to your regional LSP[5]

**Timeline:** Not specified in available sources. After application approval, clients are placed on a waiting list; LSP contacts applicant when reaching top of list to schedule home inspection[2][5].
**Waitlist:** Yes — after income eligibility is determined, applicant is placed on waiting list. LSP contacts when ready to schedule inspection[2][5]. 2026 program funds are limited and available on first-come, first-served basis[1].

**Watch out for:**
- This is NOT an emergency or home repair program — major repairs like roofing, siding, window replacement, and most plumbing are not covered[2][5]
- If your home was weatherized through this program before, you may be ineligible; contact your LSP to verify[2]
- NIPSCO customers cannot receive weatherization if they've had NIPSCO-sponsored weatherization in the past 3 years[1]
- 2026 program funds are limited and available first-come, first-served — early application is important[1]
- Renters MUST obtain written landlord permission before any permanent installations occur[1]
- You must be at least 18 years old and physically present for the entire 1-2 hour assessment[1]
- Home must be deemed 'safe to weatherize' by LSP — some homes may not qualify[2]
- Waitlist times not published — contact your LSP for current wait estimates
- If you don't meet income eligibility, NIPSCO customers may still qualify for a Home Energy Assessment[1]

**Data shape:** This program's structure is highly decentralized: administered through a network of independent Local Service Providers across Indiana, each with its own application process, wait times, and service delivery. Income eligibility is uniform statewide (200% FPL or categorical eligibility), but application methods, processing times, and regional availability vary significantly by LSP. Benefits are customized per home based on energy audit results rather than fixed amounts. Priority is given to elderly residents, individuals with disabilities, and families with children under 18[3]. The program is demand-driven with limited annual funding, making early application critical.

**Source:** https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/

---

### Indiana SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits for core SHIP counseling services; available to all Medicare-eligible individuals, family members, and caregivers. SHIP mentions potential qualification for additional help with medical costs (not core services) if income is less than $2,500 per month and assets are limited, but no specific asset details or table provided.[3]
- Assets: No asset limits for core counseling; limited assets referenced vaguely for extra medical cost help, but not defined (e.g., what counts or exemptions not specified).[3]
- Must be eligible for Medicare (or soon to be), or be a family member/caregiver of a Medicare beneficiary.[2][3]

**Benefits:** Free, impartial, one-on-one counseling and education on Medicare (Parts A, B, D), Medicare Supplement (Medigap), Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB, SLMB, QI), Low-Income Subsidy (Extra Help), prescription drug assistance, Medicaid, claims filing, appeals, and plan enrollment/comparison. Provided by trained, certified volunteer counselors.[3][7][8][9]

**How to apply:**
- Phone: Statewide toll-free line via Indiana Department of Insurance (specific number not in results; use shiphelp.org locator or 877-839-2675 for general SHIP).[5][6]
- Website: https://www.in.gov/ship/ for information and contacts.[3]
- In-person or phone via regional providers (e.g., CICOA for Central Indiana at (317) 803-6131; Area IV Agency for West Central Indiana).[8][9]
- No formal application or specific form required; contact for counseling appointment.[3]

**Timeline:** Immediate counseling available by phone or in-person; no formal processing as it's not an enrollment program.[2][3]

**Watch out for:**
- Not a financial aid or healthcare program—provides counseling only, not direct payments or services; confuses with Medicare Savings Programs (MSPs) or Medicaid, which SHIP helps apply for separately.[3][7]
- Volunteers handle counseling, so availability may depend on local schedules.[3]
- For extra cost help mentioned ($2,500/month income), details vague—refer to separate programs like MSPs.[3][6]
- Contact 3 months before Medicare eligibility for best prep.[2]

**Data shape:** no income test for counseling; service-based only with volunteer delivery via regional aging agencies; distinguishes from income-tested programs like MSPs or Medicaid that it counsels on

**Source:** https://www.in.gov/ship/

---

### Meals on Wheels (Indiana)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No statewide income limits; some providers offer reduced rates for SNAP, SSDI, Medicaid Disability, SSI, Energy/Trustee Assistance, Veterans, or Veteran spouses. No specific dollar amounts or household tables provided.
- Assets: No asset limits mentioned across providers.
- Physically or mentally unable to prepare meals due to illness, disability, or being homebound (varies by provider; some require homebound status, others do not)
- Residency in provider's delivery zone or eligible zip codes
- Dietary prescription from physician often required
- Some require inability to shop/prepare meals or mobility challenges

**Benefits:** Home-delivered nutritious meals (medically tailored for dietary restrictions like diabetes, heart healthy, low-sodium, renal; 5 meals per week typical, but varies by need: daily or few days/week). Minimum 2-week service commitment. Friendly visit and wellness check included.
- Varies by: region

**How to apply:**
- Online form (e.g., mealsonwheelsindy.org/apply/, mealsonwheelshc.org/services/ form)
- Phone: Central IN (317) 252-5558; Hamilton County (317) 776-7159
- Mail: e.g., Meals on Wheels of Central Indiana, 708 E. Michigan St., Indianapolis, IN 46202 (with check/money order for application fee + first 2 weeks)
- In-person: Contact local provider office

**Timeline:** Typically less than 1 week (Central IN); 5-7 business days after application/payment (some providers)
**Waitlist:** Generally no waitlist, but temporary waitlists possible in Marion County/other areas per funding (Central IN policy)

**Watch out for:**
- Not a single statewide program—must contact local provider for zone eligibility
- Fees required upfront ($5 app + 2 weeks meals, non-refundable minimum commitment)
- Dietary prescription often needed from doctor
- Car ownership or ability to leave home may disqualify in some areas
- Temporary waitlists possible despite 'no waitlist' claims
- Medicaid waivers (e.g., Aged/Disabled) may provide free meals via partners like Mom's Meals—check case manager

**Data shape:** Decentralized by local providers/counties with no uniform statewide eligibility/income test; fee-for-service model with subsidies rather than free-for-all; delivery zone-restricted; no age requirement at many providers

**Source:** No single statewide .gov site; primary via in.gov/fssa/ompp (Medicaid-related) or local providers; find via mealsonwheelsamerica.org/find-meals-and-services/

---

### Indiana Caregiver Respite Services

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Medicaid income and asset limits apply (exact dollar amounts and household size tables not specified in sources; spend-downs or trusts may help qualify). For CHOICE program (ages 60+), income must meet Medicaid thresholds with spenddown options[5].
- Assets: Medicaid asset limits apply (specific amounts and household variations not detailed; certain trusts exempt). What counts as assets follows standard Medicaid rules[1][5].
- Care recipient must be Indiana Medicaid-eligible and qualify for an HCBS waiver (e.g., A&D, TBI, Pathways for Aging, Health and Wellness, or CHOICE)[1][5][6].
- At least age 60+ or any age with disability; unable to perform 2+ ADLs (CHOICE) or 3+ ADLs (some waivers)[1][3][5][6].
- Reside in family home or with legal guardian; substantial functional limitations in 3+ major life activities for developmental disability cases[2].
- Not receiving services from conflicting programs (e.g., Medicaid waiver services, Bureau of Developmental Disabilities, etc.)[2].
- For Structured Family Caregiving (SFC) variant: Care recipient over 65 or with disability; caregiver lives with recipient, 18+, passes background check, completes training[1][3].

**Benefits:** Temporary relief for caregivers via respite care (e.g., assistance with daily living skills, personal care, homemaker services like light housekeeping, laundry, meals, shopping, companionship, supervision). Flexible hours included in plan of care (POC); not predetermined but based on need. In SFC: Caregiver payments, training, oversight[1][3][5][9].
- Varies by: priority_tier|region

**How to apply:**
- Contact local Area Agency on Aging (AAA) for assessment and enrollment[3][6].
- Complete functional needs assessment by nurse[1][3][6].
- No specific online URL, phone, or mail listed; DMHA approval for some providers[4].

**Timeline:** Not specified in sources.

**Watch out for:**
- Not a single unified program—respite embedded in multiple HCBS waivers (e.g., CHOICE, Pathways, A&D) or SFC; must identify correct waiver[1][2][5][9].
- Excludes those in other funded programs (e.g., Medicaid waivers, vocational rehab)[2].
- Caregiver training/background checks required; spouses OK in SFC but relatives only (not spouse) in some[1][3].
- Must be in approved POC; not for job-related childcare substitute[4][5].
- Medicaid prerequisite—financial eligibility strict with spenddown[1][5].

**Data shape:** Respite not standalone; delivered via region-specific AAAs and HCBS waivers with Medicaid gatekeeping; caregiver payments via SFC variant; functional ADL thresholds vary (2-3+); no fixed hours/dollars, POC-based.

**Source:** https://faqs.in.gov/hc/en-us/articles/360042089872-Who-is-eligible-to-receive-Caregiver-Support-Services (IN.gov); https://www.in.gov/fssa (FSSA/DMHA for waivers)

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in sources; families must contact local provider to verify current thresholds based on Federal Poverty Guidelines[1][2][3][4][7][8].
- Assets: No asset limits mentioned in sources[1][2][3][4][7].
- Unemployed[1][2][3][4][7][8]
- Resident of Indiana (or specific grantee service area with available funding)[2][7]
- Willing to provide community service, attend meetings/training, develop Individual Employment Plan (IEP), and use job search resources[2]
- Seeking training for job-ready skills[1]

**Benefits:** Hands-on paid job training (average 20 hours/week) in community service roles (e.g., child care, customer service, teachers’ aide, computer technician, building maintenance, health care worker); paid highest of federal, state, or local minimum wage; skills training including computer use; bridge to unsubsidized employment (typically ~6 months); support services/referrals to remove barriers[1][2][3][4][5][7].
- Varies by: priority_tier

**How to apply:**
- Contact local providers: Eastern Indiana Works (easternindianaworks.org/scsep)[1]
- CWI Works (cwiworks.org, select Indiana)[4]
- Goodwill Indy (goodwillindy.org/employment-services; note: not currently processing applications)[6]
- National Able (service area-specific; nationalable.org)[2]
- Indiana Department of Workforce Development (in.gov/dwd)[7]
- Local SCSEP offices via 211 or American Job Centers[3][4][8]

**Timeline:** Not specified; eligibility determination after application review and staff approval[2].
**Waitlist:** Possible waitlist if no immediate openings; enrollment depends on funding availability in service area[2][3].

**Watch out for:**
- Not automatically enrolled upon application; must pass review and annual eligibility recertification[2]
- Limited slots (1,059 in Indiana); waitlists common if funding unavailable in area[2][3][7]
- Must be willing to commit to community service, IEP, and job search activities[2]
- Priority to veterans/65+, disabled, rural, etc.; others may be lower priority[1][4][5][7][8]
- Some providers (e.g., Goodwill Indy) may pause applications[6]
- Income is family-based at 125% FPL; verify current levels as they update yearly[1][3][4]

**Data shape:** Multiple grantees with service area slot limits; priority tiers affect access; no fixed dollar income table in sources (tied to annual FPL); benefits fixed at ~20 hrs/wk min wage but host roles vary by community needs

**Source:** https://www.in.gov/dwd/files/INDWD_SCSEP_State_Plan_24-27.pdf (Indiana SCSEP State Plan); https://www.dol.gov/agencies/eta/seniors (federal DOL)[5][7]

---

### Indiana Senior Legal Aid

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Generally 125% of Federal Poverty Guidelines (FPG); up to 200% FPG in certain circumstances based on expenses. Exact 2026 dollar amounts not specified in sources; refer to ILS guidelines for current FPG table by household size. Senior projects may have less restrictive limits due to specialized funding[1][2][4].
- Assets: Countable assets must be under $10,000 (exempt: primary residence, vehicle, and some other items). Less restrictive for some senior projects[1].
- U.S. citizen, legal immigrant, or certain victims of crime/trafficking
- No fee-generating cases unless no private attorney available
- No criminal or juvenile delinquency cases (expungements and specialized driving privileges allowed)
- Groups eligible if primarily low-income and within priorities[1]

**Benefits:** Free legal assistance for seniors 60+: public benefits, housing, estate planning (wills, powers of attorney, advance directives), guardianship, nursing home rights, abuse/neglect (e.g., LAVA Project for crime victims), dispute resolution. Includes advice letters, negotiations, court representation, referrals, education[1][2][4][5][7][9].
- Varies by: priority_tier|region

**How to apply:**
- Phone: 800-869-0212 (Senior Law Project intake Mon-Fri 8:30am-5pm)[7]
- Website: https://www.indianalegalservices.org (eligibility screening and intake)[1][7]
- In-person: 151 N. Delaware St., Ste. 1800, Indianapolis, IN 46204[7]
- Regional offices via Indiana Legal Services network

**Timeline:** Not specified in sources
**Waitlist:** Not specified; may vary by demand and region

**Watch out for:**
- Senior projects often have looser income/asset rules than general ILS—check specific project[1][2]
- 200% FPG eligibility requires proving high expenses[1]
- Excludes fee-generating cases; no criminal defense[1]
- LAVA Project (abuse victims) has no income limits[5]
- Must prepare detailed employment/pension info for some cases[2]

**Data shape:** Multiple specialized senior projects with varying eligibility (less restrictive than general 125% FPG/$10k assets); delivered via regional ILS offices and AAA funding; no fixed dollar tables in sources—tied to annual FPG updates

**Source:** https://www.indianalegalservices.org/

---

### Indiana Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of an Indiana nursing home or licensed assisted living facility (not home care services).

**Benefits:** Advocacy to promote and protect resident rights under federal and state law; regular facility visits by staff and volunteer ombudsmen; investigation and resolution of complaints; representation at involuntary discharge hearings; assistance establishing family councils; resident-directed support.

**How to apply:**
- Phone: 1-800-622-4484 or 317-232-7134
- Email: via state ombudsman contact
- Mail: Office of the Long Term Care Ombudsman, 402 West Washington Street, Room W451, Post Office Box 7083, MS 27, Indianapolis, Indiana 46207-7083
- Online: File complaint via Indiana State Department of Health complaint line (specific URL not detailed in sources)
- In-person: Local ombudsman offices across the state

**Timeline:** Complaint resolution varies; volunteer certification application takes 4-6 weeks.

**Watch out for:**
- Not for home care or in-home services (state mandate exists but unfunded; federal law limits to facilities).
- Services are free and confidential but resident-directed—ombudsman acts on resident's wishes.
- Anyone can contact (residents, families, staff, community), but advocacy focuses on facility residents.
- Volunteering has separate requirements (background check, training); not the same as receiving services.

**Data shape:** no income test; facility-resident only; advocacy-focused (not financial aid or direct services); delivered via statewide volunteer network.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/ombudsman/long-term-care-ombudsman/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Hoosier Care Connect | benefit | state | deep |
| Indiana PathWays for Aging Waiver | benefit | state | deep |
| Indiana PathWays for Aging (PACE equival | benefit | state | deep |
| Healthy Indiana Plan Medicare Savings Pr | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Indiana Weatherization Assistance Progra | benefit | federal | deep |
| Indiana SHIP (State Health Insurance Ass | resource | federal | simple |
| Meals on Wheels (Indiana) | benefit | federal | deep |
| Indiana Caregiver Respite Services | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Indiana Senior Legal Aid | resource | state | simple |
| Indiana Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":8,"resource":3,"employment":1}
**Scopes:** {"state":5,"federal":7}
**Complexity:** {"deep":9,"simple":3}

## Content Drafts

Generated 12 page drafts. Review in admin dashboard or `data/pipeline/IN/drafts.json`.

- **Hoosier Care Connect** (benefit) — 5 content sections, 6 FAQs
- **Indiana PathWays for Aging Waiver** (benefit) — 5 content sections, 6 FAQs
- **Indiana PathWays for Aging (PACE equivalent)** (benefit) — 4 content sections, 6 FAQs
- **Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 6 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Indiana Weatherization Assistance Program (Wx)** (benefit) — 4 content sections, 6 FAQs
- **Indiana SHIP (State Health Insurance Assistance Program)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels (Indiana)** (benefit) — 4 content sections, 6 FAQs
- **Indiana Caregiver Respite Services** (benefit) — 2 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Indiana Senior Legal Aid** (resource) — 3 content sections, 6 FAQs
- **Indiana Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **individual_need|region**: 1 programs
- **household_size**: 1 programs
- **household (each home receives customized assessment; exact services determined after inspection)**: 1 programs
- **not_applicable**: 2 programs
- **region**: 1 programs
- **priority_tier|region**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Hoosier Care Connect**: Managed care Medicaid for non-Medicare ABD under 60; eligibility tied to SSI/M.E.D. Works; benefits via MCE care coordination with individualized screening; income varies by ABD sub-program (e.g., $994/month standard individual, higher for waivers/institutional with liability); county DFR application routing
- **Indiana PathWays for Aging Waiver**: Medicaid-gated HCBS waiver with NFLOC assessment; priority tiers for access; managed long-term services via plans; AAA regional assessments; no fixed service hours/dollars—instead individualized
- **Indiana PathWays for Aging (PACE equivalent)**: Medicaid managed LTSS program (not true PACE); automatic enrollment for eligibles via MCEs; no unique income/asset tables (uses standard Medicaid); NFLOC assessment key; statewide but MCE/provider network variations; transitioned prior waiver/nursing members 7/1/24
- **Healthy Indiana Plan Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by QMB (broadest benefits, lowest income), SLMB (Part B only, mid-income), QI (Part B only, highest income); Indiana expands income thresholds above federal mins; statewide uniform but county-administered; QI funding-capped.
- **SNAP (Supplemental Nutrition Assistance Program)**: Expanded eligibility for 60+/disabled (no gross income limit, asset test applies); benefits scale by household size and net income after elderly-specific deductions (medical/shelter); county-administered statewide.
- **Indiana Weatherization Assistance Program (Wx)**: This program's structure is highly decentralized: administered through a network of independent Local Service Providers across Indiana, each with its own application process, wait times, and service delivery. Income eligibility is uniform statewide (200% FPL or categorical eligibility), but application methods, processing times, and regional availability vary significantly by LSP. Benefits are customized per home based on energy audit results rather than fixed amounts. Priority is given to elderly residents, individuals with disabilities, and families with children under 18[3]. The program is demand-driven with limited annual funding, making early application critical.
- **Indiana SHIP (State Health Insurance Assistance Program)**: no income test for counseling; service-based only with volunteer delivery via regional aging agencies; distinguishes from income-tested programs like MSPs or Medicaid that it counsels on
- **Meals on Wheels (Indiana)**: Decentralized by local providers/counties with no uniform statewide eligibility/income test; fee-for-service model with subsidies rather than free-for-all; delivery zone-restricted; no age requirement at many providers
- **Indiana Caregiver Respite Services**: Respite not standalone; delivered via region-specific AAAs and HCBS waivers with Medicaid gatekeeping; caregiver payments via SFC variant; functional ADL thresholds vary (2-3+); no fixed hours/dollars, POC-based.
- **Senior Community Service Employment Program (SCSEP)**: Multiple grantees with service area slot limits; priority tiers affect access; no fixed dollar income table in sources (tied to annual FPL); benefits fixed at ~20 hrs/wk min wage but host roles vary by community needs
- **Indiana Senior Legal Aid**: Multiple specialized senior projects with varying eligibility (less restrictive than general 125% FPG/$10k assets); delivered via regional ILS offices and AAA funding; no fixed dollar tables in sources—tied to annual FPG updates
- **Indiana Long-Term Care Ombudsman Program**: no income test; facility-resident only; advocacy-focused (not financial aid or direct services); delivered via statewide volunteer network.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Indiana?
