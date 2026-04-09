# Maryland Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.060 (12 calls, 41s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 10 |
| Programs deep-dived | 9 |
| New (not in our data) | 9 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 6 programs
- **financial**: 2 programs
- **in_kind**: 1 programs

## New Programs (Not in Our Data)

- **Medicaid Long Term Care Services and Supports (LTSS)** — service ([source](https://health.maryland.gov/mmcp/longtermcare/pages/home.aspx[5]))
  - Shape notes: Varies by marital status/program (Nursing Home vs HCBS vs ABD); NFLOC tiered need; 5-year financial history review; statewide but local admin
- **Medicare Savings Program (includes SLMB and QI programs)** — financial ([source](https://health.maryland.gov/mmcp/eligibility/Pages/medicare-savings-programs.aspx[7]))
  - Shape notes: Tiered by FPL (SLMB 100-120%, QI 120-135%); fixed federal asset limits with MD adherence; QI has funding cap/priority queue; household size primarily individual/couple; annual reapplication required
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://aging.maryland.gov/pages/state-health-insurance-program.aspx[3][5]))
  - Shape notes: no income/asset test; counseling-only service via county network; open to Medicare families/caregivers without enrollment barriers[1][2][3]
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://dhs.maryland.gov/supplemental-nutrition-assistance-program/))
  - Shape notes: Income tables scale by household size with special 165% FPL gross limit for elderly/disabled separate households; state-specific $30 min benefit for 62+; asset test with elderly exception; uniform statewide but local DSS processing
- **National Family Caregiver Support Program** — service ([source](https://aging.maryland.gov/pages/national-family-caregiver-support.aspx))
  - Shape notes: Administered locally by Area Agencies on Aging with no statewide income/asset tests; services fixed at five types but supplemental limited; eligibility has multiple caregiver categories beyond just elderly care
- **Maryland Access Point (MAP)** — service ([source](aging.maryland.gov/pages/maryland-access-point.aspx[4]))
  - Shape notes: MAP is a statewide information and referral hub with no income/asset limits and broad eligibility (age 50+, adults 18+ with disabilities, caregivers of any age). It is not a direct benefit program but a gateway to other services. Services are delivered through 20 local county-based offices, so availability and partner agencies vary by region. The program emphasizes person-centered Options Counseling and long-term care planning rather than direct financial or in-kind benefits. Underlying programs accessed through MAP may have their own eligibility criteria.
- **Maryland Senior Call Check Program (SCC)** — service ([source](https://aging.maryland.gov/pages/senior-call-check.aspx))
  - Shape notes: No income or asset test; simple eligibility based on age, residency, and phone access; fixed daily service statewide with no tiers or variations; self-application only
- **Maryland Durable Medical Equipment Reuse Program (DME)** — in_kind ([source](https://aging.maryland.gov/pages/DME.aspx (Maryland Department of Aging)[1]))
  - Shape notes: This program has NO income or asset limits, making it universally accessible to Maryland residents with any illness, injury, or disability. The key distinction is between basic equipment (no provider documentation needed) and complex equipment (requires healthcare provider completion of Part C). Equipment is provided permanently, not loaned (except ramps, which have a 120-day loan period). The program is statewide but pickup is appointment-only at multiple locations. Processing timeline is not publicly specified, creating uncertainty for applicants about wait times.
- **Senior Care Services** — service ([source](https://aging.maryland.gov/))
  - Shape notes: Administered statewide via 24 local AAAs with regional delivery variations; priority/waitlist by slots, not fixed benefits; ties to Medicaid LTSS waivers requiring NFLOC; no uniform income table by household size across programs

## Program Details

### Medicaid Long Term Care Services and Supports (LTSS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Varies by marital status and program. For Nursing Home Medicaid and HCBS Waivers (2026): Single - greater than $2,982/month (must contribute most to state); SSI pathway - Single $994/month, Couple $1,491/month. Married (one applying): specific limits apply per table in sources. ABD Medicaid: functional need for basic coverage if 65+.[1][2]
- Assets: Single: $2,000-$2,500 (varies by program, e.g., Assisted Living $2,000 most/$2,500 some). Married: Varies, community spouse allowance applies. Counts current/past 5 years finances; trusts may protect assets. Exempt: not detailed, standard Medicaid exemptions likely (home equity limits apply).[2][3][6]
- Maryland resident
- U.S. citizen or qualified non-citizen
- Nursing Facility Level of Care (NFLOC) for Nursing Home/HCBS: inability in ADLs (mobility, bathing, etc.) and IADLs (shopping, etc.), cognitive/behavioral issues.[1][2][4]
- Functional assessment for services; disability if under 65.[3][5]

**Benefits:** Home/community-based: personal assistance, nursing, nurse monitoring, medical day care, case management, transportation, medical supplies/equipment. Institutional: nursing facilities, intermediate care for intellectual disabilities. Fee-for-service, not managed care. Targets 65+, disabilities, dual eligibles; based on medical necessity.[5]
- Varies by: priority_tier

**How to apply:**
- Online: health.maryland.gov/mmcp/eligibility/Pages/Home.aspx[9]
- Phone: not specified in results, contact Maryland Department of Health
- In-person: local offices (e.g., Montgomery County HHS)[3]
- Mail: via Maryland Department of Health

**Timeline:** Not specified
**Waitlist:** Not detailed; may exist for HCBS waivers

**Watch out for:**
- Income >$2,982/month requires paying most to state (not upper limit)[1]
- 5-year lookback on finances[3]
- NFLOC required for institutional/HCBS, not all regular Medicaid LTSS[2]
- Asset protection via trusts complex[7]
- Must prove citizenship/identity[6]

**Data shape:** Varies by marital status/program (Nursing Home vs HCBS vs ABD); NFLOC tiered need; 5-year financial history review; statewide but local admin

**Source:** https://health.maryland.gov/mmcp/longtermcare/pages/home.aspx[5]

---

### Medicare Savings Program (includes SLMB and QI programs)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be a Medicare Part A recipient. Income based on federal poverty level (FPL) percentages, varying by program tier and household size (primarily individual or couple). Maryland follows federal standards with $20 general income disregard. For 2026: SLMB (100-120% FPL): Individual up to ~$1,526/month, couple up to ~$2,064/month[1][4][5]; QI/SLMB II (120-135% FPL): Individual up to ~$1,660-$1,715/month, couple up to ~$2,239-$2,320/month[1][4][5]. Exact limits adjust annually; check current FPL via Medicare.gov. Older sources show lower 2021 figures (SLMB individual $1,308, couple $1,762; QI individual $1,469, couple $1,980)[2].
- Assets: Federal limits apply: $9,090-$9,950 individual, $13,630-$14,910 couple (varies slightly by source/year; 2024 examples $9,430/$14,130)[1][4][5][6]. Countable: cash, bank accounts, stocks, bonds. Exempt: primary home, one car, burial plot, up to $1,500 burial expenses, life insurance < $1,500 cash value, furniture, household/personal items[2].
- Must have Medicare Part A (and Part B to qualify)
- Maryland resident
- U.S. citizen or qualified immigrant
- Net countable income within tier limits per Md. Code Regs. 10.09.24.03-3[3]

**Benefits:** Pays monthly Medicare Part B premium (~$202.90 in 2026). SLMB and QI cover only Part B premiums; no deductibles/copays (unlike QMB)[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Online: https://www.marylandhealthconnection.gov/[2]
- Phone: (855) 642-8572 or TTY (855) 642-8573 (Maryland Health Benefits Exchange)[2]
- Mail: Download application from Maryland Department of Human Resources Medical Assistance page; mail to local Dept. of Social Services[2]
- In-person: Local department of social services office or county DHS (e.g., Montgomery County: 301-255-4250)[2][9]

**Timeline:** Current eligibility effective first day of month after determination; QI retroactive up to Jan 1 of application year if eligible prior months. No specific timeline stated; apply yearly[2][3].
**Waitlist:** QI: First-come, first-served with priority to prior-year recipients; funding limited[2][4].

**Watch out for:**
- QI funding limited—apply early in year; first-come, first-served with prior recipients prioritized[2][4]
- Must reapply every year[2]
- Must have Part A and B; only covers Part B premium, not other costs[2][3]
- Income/assets counted strictly; exemptions often missed (e.g., home/car exempt)[2]
- Limits based on FPL—adjust annually; outdated figures (e.g., 2021) lead to errors[1][2]
- SLMB called base, QI as 'SLMB II' in MD[1]

**Data shape:** Tiered by FPL (SLMB 100-120%, QI 120-135%); fixed federal asset limits with MD adherence; QI has funding cap/priority queue; household size primarily individual/couple; annual reapplication required

**Source:** https://health.maryland.gov/mmcp/eligibility/Pages/medicare-savings-programs.aspx[7]

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries (age 65+), those under 65 with disabilities, individuals nearing Medicare eligibility, caregivers, family members, and low-income individuals seeking financial help[1][2][3]
- Assets: No asset limits or tests apply[1][2][3]
- Must be a Medicare beneficiary or family/caregiver of one; available statewide in Maryland[1][2][3]

**Benefits:** Free, confidential, unbiased one-on-one counseling, education, and advocacy including: Medicare plan comparison/enrollment (Parts A/B/C/D), Medigap, prescription drug coverage (Part D), Medicare Advantage, long-term care insurance, billing issues/appeals/denials/grievances, financial assistance programs (MSPs, Extra Help, Medicaid), preventive services, healthcare fraud/abuse detection, community workshops/presentations; no fixed dollar amounts or hours, provided via phone, in-person, or events[1][2][3][4]

**How to apply:**
- Phone: (410) 767-1100 or toll-free 1-800-243-3425 to connect to local SHIP office[3][5][7][9]
- Website: https://aging.maryland.gov/pages/state-health-insurance-program.aspx (includes SHIP Directory for local offices)[3][5]
- In-person or phone via local county offices (e.g., Carroll County: 410-386-3800, 125 Stoner Avenue, Westminster, MD 21157; Prince George's, Anne Arundel, etc.)[1][2][6]
- No formal application form required; contact for counseling appointment[1][2][3]

**Timeline:** Immediate counseling available via phone or in-person; no specified processing delay[1][2][3]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling/education, no direct payments or services; people confuse with Medicare Savings Programs (MSP) or Extra Help, which SHIP helps apply for but does not fund; services are free but require contacting local office as central line connects you; available to under-65 disabled Medicare beneficiaries and pre-eligibility individuals, often overlooked[1][2][3][4]

**Data shape:** no income/asset test; counseling-only service via county network; open to Medicare families/caregivers without enrollment barriers[1][2][3]

**Source:** https://aging.maryland.gov/pages/state-health-insurance-program.aspx[3][5]

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Maryland SNAP eligibility is primarily based on income at or below 200% of the federal poverty level (FPL) for most households, with more flexible rules for those 60+ or disabled. For Oct 1, 2025–Sep 30, 2026 (relevant period): Elderly/disabled separate households use 165% FPL gross income limit. Full table from Maryland Hunger Solutions:

| Household Size | Max Gross Monthly Income (130% FPL) | Max Net Monthly Income (100% FPL) | Elderly/Disabled Separate Household (165% FPL) | Max Allotment |
|---------------|-------------------------------------|-----------------------------------|-----------------------------------------------|--------------|
| 1 | $1,696 | $1,305 | $2,152 | $298 |
| 2 | $2,292 | $1,763 | $2,909 | $546 |
| 3 | $2,888 | $2,221 | $3,665 | $785 |
| 4 | $3,483 | $2,680 | $4,421 | $994 |
| 5 | $4,079 | $3,138 | $5,177 | $1,183 |
| 6 | $4,675 | $3,596 | $5,934 | $1,421 |
| 7 | $5,271 | $4,055 | $6,690 | $1,571 |
| 8 | $5,867 | $4,513 | $7,446 | $1,789 |
| Each additional | $596 | $459 | $757 | $218 |

Gross income includes Social Security, veterans' benefits, disability payments. Net income deducts expenses like medical costs for 60+ or disabled[2][6][1][7].
- Assets: Maryland has asset limits: Combined bank savings/checking under $2,001 (or under $3,001 if household includes person 60+ or disabled). Exempt: home value if owned, retirement savings, cash value of life insurance, income-producing property, household goods[5][1].
- Maryland resident
- U.S. citizen or lawfully present non-citizen
- Social Security number for each household member
- Able-bodied adults 16-60 (with exceptions) must register for work, accept suitable employment, participate in employment/training if referred (exceptions for 60+ or disabled)
- Unemployed adults without children/disabilities limited to 3 months benefits every 3 years
- Household includes those who live together and buy/prepare food together
- Verification of income, child support, immigrant status, medical expenses (for 60+ or disabled)

**Benefits:** EBT card (Maryland Independence Card) loaded monthly for SNAP-approved foods at grocery stores/farmers markets. Average ~$188/month for older adults; max allotments per table above (e.g., $298 for 1-person elderly/disabled). Maryland law (effective Oct 1) ensures seniors 62+ get at least $30/month (vs. federal $16 min)[2][3][6].
- Varies by: household_size

**How to apply:**
- Online: myDHR portal at dhs.maryland.gov (primary state site)
- Phone: Call local Department of Social Services office (find via dhs.maryland.gov/local-offices) or Maryland SNAP hotline
- Mail: Submit application to local DSS office
- In-person: Local Department of Social Services offices statewide

**Timeline:** Must file application, complete interview, meet eligibility; some expedited processing available but typically 30 days[9][10].

**Watch out for:**
- Include all who buy/prepare food together in household, even non-relatives
- Seniors 60+ get deductions for medical expenses >$35/month, out-of-pocket costs
- Work registration required unless 60+/disabled (but exceptions common for elderly)
- Asset test applies (unlike some states); check bank balances carefully
- 3-month limit for able-bodied adults without dependents
- Maryland boosts min benefit to $30 for 62+ (state-specific vs. federal)
- Benefits calculated via net income formula for elderly/disabled: max allotment minus 30% net income[7]

**Data shape:** Income tables scale by household size with special 165% FPL gross limit for elderly/disabled separate households; state-specific $30 min benefit for 62+; asset test with elderly exception; uniform statewide but local DSS processing

**Source:** https://dhs.maryland.gov/supplemental-nutrition-assistance-program/

---

### National Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits specified in program guidelines.[1][3][4]
- Assets: No asset limits specified; no mention of asset counting or exemptions.[1][3][4]
- Adult family members or other informal caregivers age 18 and older providing care to individuals 60 years of age and older
- Adult family members or other informal caregivers age 18 and older providing care to individuals of any age with Alzheimer's disease and related disorders
- Grandparents and other relatives (not parents) 55 years of age and older providing care to children under the age of 18
- Grandparents and other relatives (not parents) 55 years of age and older providing care to adults age 18-59 with disabilities

**Benefits:** Five specific services: 1) Information to caregivers about available services; 2) Assistance to caregivers in gaining access to services; 3) Individual counseling, organization of support groups, and caregiver training; 4) Respite care; 5) Supplemental services (on a limited basis). No fixed dollar amounts or hours per week specified; services are non-fee based where offered.[1][3][4][7]

**How to apply:**
- Contact local Area Agency on Aging (administered by local network); statewide access via Maryland Department of Aging
- No specific phone, URL, mail, or in-person details in results; eligibility screenings and application help provided by local providers (e.g., MAC Inc. for certain areas)

**Timeline:** Not specified
**Waitlist:** Not specified; may vary locally due to limited supplemental services

**Watch out for:**
- No income or asset tests, but services like supplemental are limited basis—may not be available to all eligible
- Must contact local Area Agency on Aging (not centralized state application); varies by region
- Focuses on caregiver support services, not direct financial aid or healthcare to care recipient
- Eligibility emphasizes informal/unpaid caregivers; professional caregivers may not qualify

**Data shape:** Administered locally by Area Agencies on Aging with no statewide income/asset tests; services fixed at five types but supplemental limited; eligibility has multiple caregiver categories beyond just elderly care

**Source:** https://aging.maryland.gov/pages/national-family-caregiver-support.aspx

---

### Maryland Access Point (MAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 50+ for older adults; 18+ for individuals with disabilities; any age for caregivers or those with concerns about someone in need[1]+
- Income: No income limits — open to individuals of all income levels[1]
- Assets: Not specified in available sources
- Residents of Maryland[4]
- Experiencing long-term care needs or seeking information about aging/disability services[4]

**Benefits:** Information and referral (free); Options Counseling (free, person-centered planning); in-home and community-based supports (caregiving, wellness checks, adult day care); social and educational programs; food access assistance (SNAP, meal distribution, congregate dining); health services navigation; assistance accessing private and public resources for long-term services and supports[1][3][4]
- Varies by: Individual need and eligibility for underlying programs (MAP itself is free to all; underlying programs may have income/asset limits)

**How to apply:**
- Phone: 1-844-MAP-LINK (1-844-627-5465) — connects to 211 Maryland information specialist, who refers to local MAP office[4]
- Local MAP office: Contact your county's MAP Coordinator directly (example: St. Mary's County at 301-475-4200 ext. 1057)[1]
- Online needs assessment: marylandaccesspoint.211md.org/needsassessment/ (10-question tool to identify resources)[2]
- In-person: Visit local MAP site to schedule appointment with Division of Home and Community-Based Services[1]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- MAP itself is free and has no income limits, but it is primarily an information, referral, and counseling service — not a direct benefit program. Families should understand that MAP connects people to OTHER programs, which may have their own income/asset limits[1][4]
- The statewide phone line (1-844-MAP-LINK) routes to 211 Maryland first, then to local MAP offices for complex needs — there is an intermediary step[4]
- Eligibility for underlying programs (food assistance, health coverage, long-term care) is separate from MAP eligibility and must be assessed individually[2]
- No specific processing times or waitlist information is publicly available — families should ask about timelines when they call[4]
- MAP offers 'Options Counseling' as a distinct service for long-term care planning, but this requires referral from 211 or direct contact with local MAP office[4]
- The online needs assessment tool (10 questions) is a self-guided starting point, but personalized counseling from a MAP counselor is recommended for comprehensive planning[2]

**Data shape:** MAP is a statewide information and referral hub with no income/asset limits and broad eligibility (age 50+, adults 18+ with disabilities, caregivers of any age). It is not a direct benefit program but a gateway to other services. Services are delivered through 20 local county-based offices, so availability and partner agencies vary by region. The program emphasizes person-centered Options Counseling and long-term care planning rather than direct financial or in-kind benefits. Underlying programs accessed through MAP may have their own eligibility criteria.

**Source:** aging.maryland.gov/pages/maryland-access-point.aspx[4]

---

### Maryland Senior Call Check Program (SCC)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; program is free for all eligible Maryland residents[4]
- Assets: No asset limits or tests apply[1][2][4]
- Maryland resident[1][2][4]
- Has a working landline or cell phone (TTY available); no automated call blocking technology[1][2][3][4]
- Must apply on their own behalf; no one else can apply for them[1][2][3]
- Highly recommended to have a willing alternate contact person (e.g., adult child, neighbor, loved one)[1][2][3][4]

**Benefits:** Daily automated telephone call or text message at a pre-selected time block (8 a.m. to 4 p.m., ideally within one-hour window chosen by participant, such as 8-10 a.m. or 2-4 p.m.). If unanswered after three attempts, calls alternate contact to encourage wellness check. If alternate also unreachable, contacts local non-emergency law enforcement for welfare check. Service is free and first-in-nation statewide program[1][3][4][6]
- Varies by: fixed

**How to apply:**
- Phone: Toll-free 1-866-50-CHECK (1-866-502-0560), lines open Monday-Friday 8 a.m.-5 p.m., Saturday 9 a.m.-3 p.m.[4]
- Online: https://aging.maryland.gov/Pages/senior-call-check-sign-up.aspx[1]
- Mail: Download paper application from https://aging.maryland.gov/siteassets/pages/senior-call-check/maryland-senior-call-check-paper-application.pdf and mail to address on form (Baltimore MD 21202)[1]

**Timeline:** Verification and enrollment typically within 24 hours Monday-Saturday; participant informed when daily calls begin[2][5]

**Watch out for:**
- Must disable automated call blocking on phone and alternate's phone[1][2][4]
- Participant must apply themselves; family cannot apply on their behalf[1][2][3]
- No guaranteed timely welfare check by law enforcement due to limited resources[1][2]
- Age eligibility listed variably as 60 or 65 across sources; official site states 60+[4]; older PDFs say 65[1][2][5]
- Alternate contact highly recommended but not strictly required (program may assign one)[4]

**Data shape:** No income or asset test; simple eligibility based on age, residency, and phone access; fixed daily service statewide with no tiers or variations; self-application only

**Source:** https://aging.maryland.gov/pages/senior-call-check.aspx

---

### Maryland Durable Medical Equipment Reuse Program (DME)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits. Program is available to all Maryland residents regardless of income.[2]
- Assets: No asset limits mentioned in available documentation.
- Must be a Maryland resident[2]
- Must have any illness, injury, or disability[2]
- For complex DME equipment, Part C of the application must be completed by a healthcare professional (Physician, Physical Therapist, Occupational Therapist, Physician's Assistant, or Nurse Practitioner)[2]
- No prescription or insurance required[2]

**Benefits:** Free durable medical equipment. No cost to recipients.[2]
- Varies by: equipment_type

**How to apply:**
- Online: Click 'Apply Online' button at https://onestop.md.gov/forms/basic-durable-medical-equipment-request-form-618bcb19e9b09f023f463960[1]
- Phone: 240-230-8000 or (410)-767-1100 or 1 (800) 243-3425. Maryland Relay users call 7-1-1[2]
- Email: [email protected][1]
- Mail or in-person: 11701 Crain Highway, Cheltenham, MD 20623[1]
- Fax: (410) 333-7943[2]

**Timeline:** Not specified in available documentation. After submission, form enters 'In-Review' status. DME staff will contact requester via preferred method to notify if equipment is in-stock and schedule pickup appointment.[1]
**Waitlist:** Not explicitly mentioned. Availability depends on whether requested equipment is in-stock.[1]

**Watch out for:**
- Home delivery is NOT available. Equipment must be picked up by appointment only at designated pickup sites.[2]
- Complex DME (wheelchairs, hospital beds, lifts, power equipment) requires healthcare provider documentation. Basic equipment does not.[1]
- Always call ahead to verify specific equipment is in stock before applying, as availability varies.[3]
- All fields marked with '*' on the form are required; incomplete applications will be voided.[1]
- For power wheelchairs and power scooters, only Physical or Occupational Therapists can request these (not other healthcare providers).[1]
- Program encourages returning equipment when no longer needed so it can help other residents.[2]
- No prescription or insurance required, making this accessible to uninsured individuals.[2]

**Data shape:** This program has NO income or asset limits, making it universally accessible to Maryland residents with any illness, injury, or disability. The key distinction is between basic equipment (no provider documentation needed) and complex equipment (requires healthcare provider completion of Part C). Equipment is provided permanently, not loaned (except ramps, which have a 120-day loan period). The program is statewide but pickup is appointment-only at multiple locations. Processing timeline is not publicly specified, creating uncertainty for applicants about wait times.

**Source:** https://aging.maryland.gov/pages/DME.aspx (Maryland Department of Aging)[1]

---

### Senior Care Services

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Varies by program; for Medicaid LTSS like Community First Choice (CFC), single person up to $16,243/year (effective Jan 1, 2024); nursing home Medicaid single applicant contributes nearly all income with assets under $2,500 (2026); Medicaid Waiver for Older Adults at 300% SSI level; case-by-case if living with relative[1][2][5]. No full household size table specified statewide.
- Assets: Typically $2,000-$2,500 for individual (e.g., $2,500 for nursing home Medicaid single applicant in 2026; $2,000 for most under Waiver, $2,500 for some). Counts standard assets; exemptions not detailed in sources[2][5].
- Maryland resident
- US citizen or qualified alien
- At risk of institutionalization or nursing facility level of care (NFLOC)
- Physically or mentally impaired needing assistance with ADLs
- For some: certified severe chronic disability or specific employment/education status (younger programs)

**Benefits:** Case management, in-home personal care, household chores, transportation, adult day care, medical supplies, PERS, meal delivery, home modifications, assistive technology, medical day care, nursing, nurse monitoring. Gap-filling funds if available; slots limited (e.g., ICS: 100 slots)[1][3][6]. No fixed dollar amounts or hours specified.
- Varies by: priority_tier

**How to apply:**
- Phone: Aging and Disability Services Resource Unit at 240-777-3000 (Montgomery County example); Registry toll-free 1-866-417-3480 for Waiver[3][5]
- In-person: Local Area Agency on Aging or during in-home assessment[1][3]
- Registry for slots: Add name to Waiver Services Registry[5]

**Timeline:** State law requires decision within 30 days; varies by funding[5]
**Waitlist:** Yes, via statewide Registry for Waiver slots (contacted by number in line, new slots July 1); varies by funding availability, not entitlement[3][5]

**Watch out for:**
- Not an entitlement—grant-funded with limited slots and waitlists
- Must join statewide Registry for Waiver; check position in line
- Financial eligibility reviewed case-by-case if living with relative
- Services not duplicative of facility-provided (e.g., assisted living residents eligible for gaps only)
- NFLOC required; free medical eval via AERS
- Over income/assets? Strategies exist like spend-down, but consult planner

**Data shape:** Administered statewide via 24 local AAAs with regional delivery variations; priority/waitlist by slots, not fixed benefits; ties to Medicaid LTSS waivers requiring NFLOC; no uniform income table by household size across programs

**Source:** https://aging.maryland.gov/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Long Term Care Services and Sup | benefit | state | deep |
| Medicare Savings Program (includes SLMB  | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| National Family Caregiver Support Progra | benefit | state | medium |
| Maryland Access Point (MAP) | resource | state | simple |
| Maryland Senior Call Check Program (SCC) | resource | state | simple |
| Maryland Durable Medical Equipment Reuse | resource | state | simple |
| Senior Care Services | benefit | state | deep |

**Types:** {"benefit":5,"resource":4}
**Scopes:** {"state":6,"federal":3}
**Complexity:** {"deep":4,"simple":4,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MD/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **not_applicable**: 2 programs
- **household_size**: 1 programs
- **Individual need and eligibility for underlying programs (MAP itself is free to all; underlying programs may have income/asset limits)**: 1 programs
- **fixed**: 1 programs
- **equipment_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Long Term Care Services and Supports (LTSS)**: Varies by marital status/program (Nursing Home vs HCBS vs ABD); NFLOC tiered need; 5-year financial history review; statewide but local admin
- **Medicare Savings Program (includes SLMB and QI programs)**: Tiered by FPL (SLMB 100-120%, QI 120-135%); fixed federal asset limits with MD adherence; QI has funding cap/priority queue; household size primarily individual/couple; annual reapplication required
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling-only service via county network; open to Medicare families/caregivers without enrollment barriers[1][2][3]
- **Supplemental Nutrition Assistance Program (SNAP)**: Income tables scale by household size with special 165% FPL gross limit for elderly/disabled separate households; state-specific $30 min benefit for 62+; asset test with elderly exception; uniform statewide but local DSS processing
- **National Family Caregiver Support Program**: Administered locally by Area Agencies on Aging with no statewide income/asset tests; services fixed at five types but supplemental limited; eligibility has multiple caregiver categories beyond just elderly care
- **Maryland Access Point (MAP)**: MAP is a statewide information and referral hub with no income/asset limits and broad eligibility (age 50+, adults 18+ with disabilities, caregivers of any age). It is not a direct benefit program but a gateway to other services. Services are delivered through 20 local county-based offices, so availability and partner agencies vary by region. The program emphasizes person-centered Options Counseling and long-term care planning rather than direct financial or in-kind benefits. Underlying programs accessed through MAP may have their own eligibility criteria.
- **Maryland Senior Call Check Program (SCC)**: No income or asset test; simple eligibility based on age, residency, and phone access; fixed daily service statewide with no tiers or variations; self-application only
- **Maryland Durable Medical Equipment Reuse Program (DME)**: This program has NO income or asset limits, making it universally accessible to Maryland residents with any illness, injury, or disability. The key distinction is between basic equipment (no provider documentation needed) and complex equipment (requires healthcare provider completion of Part C). Equipment is provided permanently, not loaned (except ramps, which have a 120-day loan period). The program is statewide but pickup is appointment-only at multiple locations. Processing timeline is not publicly specified, creating uncertainty for applicants about wait times.
- **Senior Care Services**: Administered statewide via 24 local AAAs with regional delivery variations; priority/waitlist by slots, not fixed benefits; ties to Medicaid LTSS waivers requiring NFLOC; no uniform income table by household size across programs

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Maryland?
