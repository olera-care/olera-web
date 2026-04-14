# West Virginia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 9.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 15 |
| New (not in our data) | 8 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 4 programs
- **service**: 9 programs
- **service|advocacy**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,350` ([source](https://bms.wv.gov/ (WV Bureau for Medical Services); form at https://www.wvdhhr.org/bcf/policy/imm/immanualchanges/525/dfa_qsq_1.pdf))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/deductibles for Medicare-covered A/B services. Providers cannot bill beneficiary for covered services. **SLMB:** Pays Part B premiums only. **QI:** Pays Part B premiums only. All auto-qualify for Extra Help (Part D: ≤$12.65 copay/drug in 2026).[1][2][3]` ([source](https://bms.wv.gov/ (WV Bureau for Medical Services); form at https://www.wvdhhr.org/bcf/policy/imm/immanualchanges/525/dfa_qsq_1.pdf))
- **source_url**: Ours says `MISSING` → Source says `https://bms.wv.gov/ (WV Bureau for Medical Services); form at https://www.wvdhhr.org/bcf/policy/imm/immanualchanges/525/dfa_qsq_1.pdf`

### Aged and Disabled Waiver (ADW)

- **min_age**: Ours says `65` → Source says `18 years or older[1][3]` ([source](Bureau for Medical Services (BMS), West Virginia Department of Health and Human Resources. Website: www.wvseniorservices.gov[3]. Program operated by BMS[6].))
- **income_limit**: Ours says `$2901` → Source says `$209` ([source](Bureau for Medical Services (BMS), West Virginia Department of Health and Human Resources. Website: www.wvseniorservices.gov[3]. Program operated by BMS[6].))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `In-home personal care services designed to provide same type of care as nursing home, including assistance with activities of daily living[5]. Search results do not specify exact hours per week, dollar amounts, or service caps. Services provided in member's home and community where they reside, work, and perform daily activities[6].` ([source](Bureau for Medical Services (BMS), West Virginia Department of Health and Human Resources. Website: www.wvseniorservices.gov[3]. Program operated by BMS[6].))
- **source_url**: Ours says `MISSING` → Source says `Bureau for Medical Services (BMS), West Virginia Department of Health and Human Resources. Website: www.wvseniorservices.gov[3]. Program operated by BMS[6].`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://dhhr.wv.gov/bcf/programs/snap/Pages/default.aspx))
- **income_limit**: Ours says `$1922` → Source says `$2,608` ([source](https://dhhr.wv.gov/bcf/programs/snap/Pages/default.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (amount based on net income, household size; ~$100 more net income = $30 less benefits; min/max allotments apply; certification 24 months for age 60+ households vs. 12 months others).[1][3]` ([source](https://dhhr.wv.gov/bcf/programs/snap/Pages/default.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dhhr.wv.gov/bcf/programs/snap/Pages/default.aspx`

### Meals on Wheels (Home Delivered Meals)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered meals containing one third of the recommended daily allowance for vitamins and minerals; typically lunch, with potential for dietary accommodations[1][2][8]` ([source](No single primary .gov URL identified; state Bureau of Senior Services oversees via https://code.wvlegislature.gov/16-5S-9/ and local agencies[4][8]))
- **source_url**: Ours says `MISSING` → Source says `No single primary .gov URL identified; state Bureau of Senior Services oversees via https://code.wvlegislature.gov/16-5S-9/ and local agencies[4][8]`

### National Family Caregiver Support Program (NFCSP)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Information, assistance, caregiver training, respite care, and supplemental services (specific hours, dollar amounts, or limits not detailed in West Virginia-specific sources; no stipends or fixed payments specified for NFCSP)[5]` ([source](https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program[5]))
- **source_url**: Ours says `MISSING` → Source says `https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program[5]`

### West Virginia Senior Legal Aid, Inc. (Senior Legal Services)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.seniorlegalaid.org))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free civil legal services including legal information, advice, and advocacy/representation. Focuses on senior-specific issues like long-term care, public benefits (Medicaid/SSI), guardianship, age discrimination, financial exploitation, abuse/neglect, and consumer issues. Service level varies: basic for all eligible seniors, enhanced (advice/advocacy) for priority groups[2][7][8].` ([source](https://www.seniorlegalaid.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.seniorlegalaid.org`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Identifying, investigating, and resolving complaints related to health, safety, welfare, and rights; routine unannounced facility visits to monitor care; representation to government agencies for administrative, legal, or other remedies; information and referral services; training and support for volunteers[1][2][3][6]` ([source](https://legalaidwv.org/our-programs/long-term-care/))
- **source_url**: Ours says `MISSING` → Source says `https://legalaidwv.org/our-programs/long-term-care/`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://paceyourlifemwv.com (WV provider); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal overview)[3][7]))
  - Shape notes: Limited to specific provider service areas in WV (not statewide); no published income/asset tables or processing times; eligibility tied to NFLOC certification and community safety; benefits comprehensive but provider-specific
- **LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://bfa.wv.gov/utility-assistancelieap))
  - Shape notes: Income at 60% state median (not federal poverty); exclusions vary by period (e.g., SS/Vet); seasonal with crisis tier; processed via 55 county DoHS offices; auto-eligible via SNAP/TANF/SSI.
- **Weatherization Assistance Program (WAP)** — service ([source](https://wvcad.org/sustainability/weatherization-assistance-program))
  - Shape notes: Administered via county-specific community action agencies; waitlist with priority tiers (elderly 60+, disabled, children, high energy burden); income at 200% FPG with table by household size; building eligibility required.
- **SHIP (State Health Insurance Assistance Program)** — service|advocacy ([source](https://www.cms.gov/contacts/west-virginia-state-health-insurance-assistance-program-wv-ship/general-beneficiary-contact/1562251[6]))
  - Shape notes: SHIP is a service-based counseling program rather than a benefits program with income limits or monthly payments. Eligibility is straightforward (Medicare beneficiary + West Virginia resident) with no income or asset testing. The value is in personalized guidance and information rather than direct financial assistance. Services are distributed through a central office and county-based centers, making geographic accessibility variable depending on proximity to a senior center.
- **Lighthouse Program** — service ([source](No direct .gov URL in results; contact WV Bureau of Senior Services at 1-877-987-3646 or local county programs[2]))
  - Shape notes: County-administered statewide program with uniform eligibility (age 60+, medical need, sliding fee by income) but local providers and potential variations in caregiver availability; no fixed income/asset tables published in sources, fees via state schedule
- **Take Me Home Program** — service ([source](https://bms.wv.gov/take-me-home-tmh-transition-program))
  - Shape notes: Eligibility hinges on institutional stay duration and Medicaid/waiver status rather than age, income, or assets; services are transition-specific with person-centered plans via statewide field staff.
- **Visually Impaired Seniors In-Home Outreach and Networking Services (VISIONS)** — service ([source](https://wvdrs.org/adults/specialized-services/services-for-the-blind-and-impaired/))
  - Shape notes: no income or asset test; eligibility tied to age, non-employment status, and permanent vision impairment; services customized per participant with statewide DRS counselor access
- **WV Bureau of Senior Services Home Modification and Accessibility Grant Program (Aging Well, Safe at Home Initiative)** — financial ([source](https://www.wvadrc.com/assistance-programs.html))
  - Shape notes: Statewide with central ADRC application processing; grant capped at $3,000; no income/asset tests mentioned; requires pre-approval documentation from licensed contractors

## Program Details

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Federal standards apply with WV following them; limits updated annually effective April 1 based on FPL. For 2026 (most recent cited): QMB (≤100% FPL): Individual $1,350/month, Couple $1,824/month. SLMB (>100% ≤120% FPL): Higher limits (e.g., Individual ~$1,526/month per secondary sources). QI (>120% ≤135% FPL): Even higher. Exact WV 2026 limits align with federal; check current via state agency as they match Medicare.gov figures. No full household size table beyond individual/couple in sources; assumes 1-2 person households typical for elderly.[2][3]
- Assets: WV specific: Individual $9,660; Married couple $14,470 (older WV doc). Federal 2026: Individual $9,950; Couple $14,910. Use WV figures or confirm current. Countable: Cash, checking/savings, stocks, bonds, annuities, CDs. Exempt: Typically primary home, one car, personal belongings, burial plots (standard Medicaid exemptions apply; WV follows federal with possible state variations).[2][3]
- Must be eligible for Medicare Part A (even if not enrolled) and have Part B for SLMB/QI.
- U.S. citizen or qualified immigrant.
- Reside in West Virginia.
- Not eligible for full Medicaid (QI specifically excludes full Medicaid recipients).

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/deductibles for Medicare-covered A/B services. Providers cannot bill beneficiary for covered services. **SLMB:** Pays Part B premiums only. **QI:** Pays Part B premiums only. All auto-qualify for Extra Help (Part D: ≤$12.65 copay/drug in 2026).[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Online: WV DHHR/BMS portal (bms.wv.gov apply section).
- Phone: Contact WV Bureau for Medical Services (304-587-0105 or local Medicaid office).
- Mail/In-person: Local DHHR field offices statewide; send to state Medicaid agency.
- Form: DFA-QSQ-1 (specific to QMB/SLMB/QI-1).

**Timeline:** QMB: ≤45 days, effective 1st of month after complete info. SLMB/QI: Up to 3 months retroactive if eligible.[1]
**Waitlist:** QI: First-come first-served with priority to prior-year recipients; possible waitlist if funds exhausted.

**Watch out for:**
- QI requires annual reapplication; funds limited—apply early in year.
- Providers cannot bill QMB for Medicare-covered services, but small Medicaid copays possible.
- Asset test applies (unlike some states); irregular income excluded, lump sums counted in month received.
- Must have Part B enrolled; auto Extra Help but confirm.
- Income disregards applied (e.g., $20 general); WV follows federal FPL tiers strictly.
- Effective dates differ: QMB prospective, SLMB/QI retroactive.

**Data shape:** Tiered by QMB (100% FPL, full benefits), SLMB (120% FPL, Part B only), QI (135% FPL, Part B only, limited funds/annual renew); WV asset limits slightly differ from federal 2026; no household size scaling beyond couple; statewide uniform but local offices handle apps.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://bms.wv.gov/ (WV Bureau for Medical Services); form at https://www.wvdhhr.org/bcf/policy/imm/immanualchanges/525/dfa_qsq_1.pdf

---

### Aged and Disabled Waiver (ADW)


**Eligibility:**
- Age: 18 years or older[1][3]+
- Income: Determined by West Virginia Department of Health and Human Resources (DHHR) county office or Social Security Administration if applicant is an active SSI (Supplemental Security Income) recipient[2]. Search results do not provide specific dollar amounts. Those exceeding limits may still qualify through the Medically Needy Program if medical costs consume most monthly income, leaving no more than $209 per month in available income[7].
- Assets: Home equity interest must not exceed $730,000 (as of 2025) if applicant lives in home or has intent to return[1]. Home equity = current home value minus outstanding mortgage. Equity interest = portion of home's equity owned by applicant. Exceptions: asset limits do not apply if applicant has spouse living in home or dependent relative living in home (child, grandchild, parent, aunt/uncle, sibling, or niece/nephew)[1]. Search results do not specify limits on other assets (bank accounts, investments, vehicles).
- Must be a permanent resident of West Virginia[2]
- Must be able to provide proof of residency upon application[2]
- Must meet Medicaid waiver financial eligibility criteria[2]
- Must meet medical criteria: require Nursing Facility Level of Care (NFLOC)[1][2]
- Must have functional deficits in at least 5 areas of activities of daily living (ADLs): eating, bathing, dressing, grooming, mobility, restroom assistance, or other areas of need[1][3]
- Specific medical conditions that may qualify: Stage 3 or 4 decubitus ulcers (bedsores), inability to complete ADLs without assistance, inability to leave building in emergency, skilled nursing needs (sterile dressings, tracheostomy, irrigations), inability to self-administer medications[1]
- Diagnosis of Alzheimer's disease or dementia alone does not guarantee qualification; functional need must still be demonstrated[1]
- Must choose home and community-based services over nursing home placement[2][4]
- Must be able to provide safe working environment for personal attendant service program staff, agency direct-care workers, case managers, and registered nurses[4]
- Enrollment dependent upon availability of funded ADW slot[2]

**Benefits:** In-home personal care services designed to provide same type of care as nursing home, including assistance with activities of daily living[5]. Search results do not specify exact hours per week, dollar amounts, or service caps. Services provided in member's home and community where they reside, work, and perform daily activities[6].
- Varies by: Individual medical need and functional assessment; not specified by household size, priority tier, or region in search results

**How to apply:**
- Phone: 1-866-767-1575 (Bureau of Senior Services)[3]
- In-person: Local Department of Health and Human Resources (DHHR) county office[5]
- Online: inRoads platform[7]
- Mail: Submit Medical Necessity Evaluation Request (MNER) form to local DHHR office[5]

**Timeline:** Search results do not specify overall processing timeline. Case Manager should contact applicant within 5 days after provider/Case Management Agency selection[5].
**Waitlist:** Enrollment dependent upon availability of funded ADW slot[2]. Search results do not specify waitlist length or typical wait time.

**Watch out for:**
- Enrollment is NOT guaranteed — limited by availability of funded ADW slots[2]. Families should apply early and confirm slot availability.
- Diagnosis alone (e.g., Alzheimer's, dementia) does not qualify applicant; functional deficits in 5+ ADL areas must be demonstrated[1]. Medical evaluation is rigorous.
- Applicant must CHOOSE home and community-based services over nursing home placement[2][4]. This is an active choice, not automatic.
- Home equity limit ($730,000 as of 2025) applies only to primary residence; exceptions exist for spouses or dependent relatives living in home[1]. Families with higher home equity may still qualify if dependent lives with them.
- Those exceeding income/asset limits may still qualify through Medically Needy Program if medical expenses consume most income[7], but this requires additional planning and documentation.
- Safe working environment requirement[4] means home must be safe for caregivers — unsafe conditions could disqualify applicant or delay services.
- Physician, physician assistant, or nurse practitioner must initiate application by completing MNER[3] — applicant cannot self-refer.
- Medical evaluation conducted in applicant's home by registered nurse[3] — applicant must be available for in-home assessment.
- Processing involves multiple organizations (DHHR, KEPRO, Case Management Agency, BMS)[5] — coordination delays are possible.

**Data shape:** ADW eligibility is highly individualized based on functional assessment rather than formulaic income/asset tables. Income limits vary by county and SSI status[2]. Asset limits apply primarily to home equity with specific exemptions[1]. Benefits are service-based (in-home care) rather than cash payments, with scope determined by individual medical need and available funded slots[2][6]. Application process involves multiple gatekeepers (physician, KEPRO, DHHR, Case Manager) rather than single-point application[5]. Program operates statewide but with county-level financial determination and potential regional provider variation[2][5].

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** Bureau for Medical Services (BMS), West Virginia Department of Health and Human Resources. Website: www.wvseniorservices.gov[3]. Program operated by BMS[6].

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific dollar amounts or household size tables provided in sources for West Virginia; most participants are dually eligible for Medicare and Medicaid, but private pay options may exist[3][5][7]
- Assets: No asset limits or exemptions detailed in sources for West Virginia[7]
- Live in the service area of a PACE provider
- Certified by the state to meet nursing home level of care (NFLOC)
- Able to live safely in the community at time of enrollment without jeopardizing health or safety
- Eligible for Medicare and/or Medicaid (most participants dually eligible)

**Benefits:** Comprehensive medical and social services including: primary and nursing care, specialist care, prescription medications and home delivery, medical equipment/supplies, preventative care (dental, vision, podiatry), nutritional counseling and meals, physical/occupational/recreational therapy, behavioral health and social services, home health and personal care assistance, transportation to appointments, adult day programs and social activities, hospital/nursing home care when needed, emergency services. No specific dollar amounts or hours per week stated; all services coordinated by interdisciplinary team with personalized care plan[1][2][3]
- Varies by: region

**How to apply:**
- Contact PACE Your LIFE provider directly (specific phone/website not listed in results; visit paceyourlifemwv.com for West Virginia program[3])
- State Medicaid office or Medicare for general screening (no WV-specific numbers in results)

**Timeline:** Not specified in sources
**Waitlist:** Not detailed; may vary by provider/service area

**Watch out for:**
- Only available in limited service areas, not statewide in WV—check specific provider coverage first[3]
- Becomes sole source of Medicare/Medicaid benefits; cannot use other plans simultaneously[7]
- Must be able to live safely at home at enrollment; not for those already unsafe without immediate intervention[1][7]
- No specific income/asset details published; dual eligibility common but private pay possible—confirm with provider[3][5]

**Data shape:** Limited to specific provider service areas in WV (not statewide); no published income/asset tables or processing times; eligibility tied to NFLOC certification and community safety; benefits comprehensive but provider-specific

**Source:** https://paceyourlifemwv.com (WV provider); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal overview)[3][7]

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member age 60+ or disabled, only the **net income test** is required if gross income exceeds 200% FPL (Oct 1, 2025–Sept 30, 2026 gross limits: 1 person $2,608/mo, 2 $3,526, 3 $4,442, 4 $5,358, 5 $6,276, 6 $7,192, 7 $8,108, +$916 each additional). West Virginia has no asset limit under state rules; federal rules apply only if using net/asset alternative ($4,500 asset limit, no gross income limit).[1][3]
- Assets: No asset limit in West Virginia for standard eligibility (home, vehicles exempt). Countable resources like bank accounts excluded from limit. If gross income >200% FPL, federal $4,500 asset limit may apply for elderly/disabled households.[1]
- West Virginia resident
- U.S. citizen or qualified non-citizen
- Social Security number (or applied for one)
- Meet work requirements unless exempt (e.g., age 60+, disabled, caring for child <14 or disabled adult)
- For elderly: Unable to purchase/prepare meals if separating household (age 60+, disability like impaired renal function, amputation age 55+)[5][9]

**Benefits:** Monthly EBT card for food purchases (amount based on net income, household size; ~$100 more net income = $30 less benefits; min/max allotments apply; certification 24 months for age 60+ households vs. 12 months others).[1][3]
- Varies by: household_size

**How to apply:**
- Online: West Virginia DHHR portal (wvpath.wv.gov)
- Phone: Local county DHHR office or state hotline
- Mail: To local DHHR office
- In-person: Local DHHR county office

**Timeline:** Not specified; application submission secures benefit start date; certification period 24 months for elderly/disabled.[3]

**Watch out for:**
- Elderly households over gross limit (200% FPL) can qualify via net income/asset only—many miss this expanded WV rule.[1]
- No asset limit under WV rules, but federal $4,500 applies if bypassing gross test.[1]
- Include all who buy/prepare food in household; Social Security counts as income.[2]
- 24-month certification for elderly vs. 12 months others—reapply timely.[3]
- Work exemptions for age 60+, disability, child care.[7]

**Data shape:** Benefits scale by household size and net income; expanded eligibility for elderly/disabled (net test only if gross exceeded, no asset limit); statewide via county DHHR offices.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhr.wv.gov/bcf/programs/snap/Pages/default.aspx

---

### LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income must be at or below 60% of West Virginia state median income (recent figures: 1-person: $1,884; 2-person: $2,464; 3-person: $3,043; 4-person: $3,623; add $567 per additional person). Some income exclusions apply, such as Social Security, Veterans benefits (for current period), SNAP benefits, student loans/grants, and CSEP under Older Americans Act. Income counted from month of application (e.g., weekly x4.3, bi-weekly x2.15). Automatic eligibility if enrolled in SNAP, TANF, or SSI Code A. Households must be responsible for heating bill and reside in WV. U.S. citizenship or qualified non-citizen status required.
- Assets: No asset limits mentioned in program guidelines.
- Household responsible for paying heating/cooling bill.
- Vulnerability factors considered (e.g., elderly 60+, disabled, child under 5 for related programs like repair/replace).
- U.S. citizen or qualified immigrant.

**Benefits:** One-time direct cash payment or payment to utility/vendor for heating/cooling costs. Regular LIEAP for heating assistance (fall/winter); Crisis LIEAP for emergencies (e.g., shutoff, broken heater). Exact amounts vary by income, household size, fuel type, and heating costs; maximum benefits not specified in current data but calculated individually. Cooling assistance in summer.
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://www.wvpath.wv.gov/
- Phone: 1-800-642-8589 (toll-free)
- In-person: Local DHHR/DoHS field offices, Community Action Agencies, Senior Centers
- Mail: Via local agencies or DHHR offices

**Timeline:** Within 30 days of receipt or program open date (whichever later).
**Waitlist:** No waitlist; funding limited and exhausts—apply early as benefits stop when funds run out.

**Watch out for:**
- Funding limited—apply early in season (fall/winter for heating; not year-round).
- Income from application month only; exclusions like SS/Vet benefits can change eligibility.
- Everyone at address counts as household if sharing utility bill.
- Crisis requires immediate emergency proof and DHHR worker evaluation.
- Program closes when funds exhausted; late mail apps denied.
- Not all eligible get benefits due to fixed federal funding.

**Data shape:** Income at 60% state median (not federal poverty); exclusions vary by period (e.g., SS/Vet); seasonal with crisis tier; processed via 55 county DoHS offices; auto-eligible via SNAP/TANF/SSI.

**Source:** https://bfa.wv.gov/utility-assistancelieap

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income must be less than or equal to 200% of the Federal Poverty Guidelines (updated annually). Guidelines effective April 8, 2025: Household of 1: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300. Add $11,000 for each additional member. Income is gross cash receipts before taxes from the applicable tax year(s); excludes child support, tax refunds, college scholarships, etc.[1]
- Assets: No asset limits mentioned.[1][2]
- Must reside in West Virginia.
- Dwelling must meet building eligibility requirements (structurally adaptable for weatherization materials).
- Renters need landlord permission.
- Priority on waitlist for households with elderly (60+), disabled, children (18 or younger), high energy burden, or high energy use.[1][2][3]

**Benefits:** Energy conservation measures including air sealing, insulation in walls/floors, duct sealing, heating/cooling system repairs or tune-ups, electrical improvements; aimed at reducing utility costs and improving safety/comfort. No fixed dollar amount or hours; services based on energy audit.[1][2][4][7]
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency serving your county (in-person, phone, or mail application).
- Some providers offer online application (e.g., MountainHeart at unspecified link).[7]
- Examples: CASEWV (casewv.org), MountainHeart (call 304-682-8271 ext. 101 or 117 for Wyoming/Fayette Counties), Southwestern Community Action Council (scacwv.org).[3][7][8]

**Timeline:** Eligibility determination after application (time-consuming due to income verification); then placed on waitlist for energy audit and services. No specific timeline given.[2]
**Waitlist:** Yes, all eligible applicants placed on waitlist; prioritized by points for high energy burden/use, elderly (60+), disabled, children.[1][2]

**Watch out for:**
- Must verify latest Federal Poverty Guidelines annually as they update (e.g., April 2025 figures).[1]
- Renters need landlord permission first.[2]
- Income verification is detailed and time-consuming; all sources required.[2]
- Dwelling must pass building eligibility (not all homes qualify).[1]
- Priority waitlist favors elderly/disabled/children/high energy needs, so non-priority may wait longer.[1]
- Separate RRP for heating repairs under DHHR (60% SMI, elderly/disabled priority) via some agencies.[3]

**Data shape:** Administered via county-specific community action agencies; waitlist with priority tiers (elderly 60+, disabled, children, high energy burden); income at 200% FPG with table by household size; building eligibility required.

**Source:** https://wvcad.org/sustainability/weatherization-assistance-program

---

### SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Medicare beneficiaries (typically 65+)[8]+
- Income: No income limits specified in available documentation[8]
- Assets: Not specified in available documentation
- Must be a West Virginia resident[8]
- Must be a Medicare beneficiary[8]

**Benefits:** Free, objective, and confidential counseling and information services[8]

**How to apply:**
- Phone: 1-877-987-4463[7]
- In-person: West Virginia Bureau of Senior Services, 1900 Kanawha Boulevard East (3rd Floor Town Center Mall), Charleston, WV 25305-0160[6]
- In-person: County senior centers throughout West Virginia[8]

**Timeline:** Not specified in available documentation
**Waitlist:** Not specified in available documentation

**Watch out for:**
- SHIP is specifically for Medicare beneficiaries, not for general health insurance assistance[8]. Families seeking help with Medicaid or CHIP (for children or pregnant women) should contact different programs[2]
- This is a counseling and information service, not a financial assistance program. SHIP helps people understand their options and avoid overpaying, but does not directly pay medical bills or premiums[4][8]
- Services are provided through one-on-one counseling appointments, not automatic enrollment or benefits[4]
- The program is housed at the Bureau of Senior Services, which may create confusion with other senior services programs[8]

**Data shape:** SHIP is a service-based counseling program rather than a benefits program with income limits or monthly payments. Eligibility is straightforward (Medicare beneficiary + West Virginia resident) with no income or asset testing. The value is in personalized guidance and information rather than direct financial assistance. Services are distributed through a central office and county-based centers, making geographic accessibility variable depending on proximity to a senior center.

**Source:** https://www.cms.gov/contacts/west-virginia-state-health-insurance-assistance-program-wv-ship/general-beneficiary-contact/1562251[6]

---

### Meals on Wheels (Home Delivered Meals)


**Eligibility:**
- Age: 60+
- Income: No specific income limits or dollar amounts mentioned; income not always a factor in eligibility, though some programs may adjust fees based on financial ability[2].
- Assets: No asset limits mentioned or applicable.
- Homebound or unable to prepare meals due to physical/mental limitations or mobility challenges[1][2][3][7][9]
- No caregiver to assist with meal preparation[1]
- Live within the program's delivery/service area[1][2]
- Disabled individuals under 60 may qualify if residing with an eligible 60+ participant, regardless of relation[7]
- Spouses or disabled dependents of eligible individuals may qualify[1][2][7]

**Benefits:** Home-delivered meals containing one third of the recommended daily allowance for vitamins and minerals; typically lunch, with potential for dietary accommodations[1][2][8]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or senior center serving your county/region[1][2][4]
- No specific statewide phone, URL, or form listed; use Meals on Wheels America provider search for local contacts: https://www.mealsonwheelsamerica.org/find-meals-and-services/[3]

**Timeline:** Varies; some within a week, others longer due to waitlists[2]
**Waitlist:** Common statewide, over 1,000 seniors on waitlists as of October 2024 (e.g., 70 in McDowell County); even more ineligible due to service area limits[4]

**Watch out for:**
- Significant waitlists even for eligible seniors; many turned away if outside service area despite meeting other criteria[4]
- Eligibility varies by local provider; always confirm with specific county agency[1][2][3]
- Awareness low; many eligible seniors unaware of program[4]
- Car ownership or ability to leave home may disqualify[2]
- Fees may apply based on income, with sliding scale or donations possible[2]

**Data shape:** Decentralized by county/region via local Area Agencies on Aging; no statewide income test or fixed forms; heavy waitlists and service area restrictions limit access

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** No single primary .gov URL identified; state Bureau of Senior Services oversees via https://code.wvlegislature.gov/16-5S-9/ and local agencies[4][8]

---

### National Family Caregiver Support Program (NFCSP)


**Eligibility:**
- Age: 60+
- Income: No specific income limits or dollar amounts stated; services are targeted to caregivers of individuals 60+ without financial thresholds detailed in state-specific data[5].
- Assets: No asset limits mentioned or applicable based on available information[5].
- Adult family members or other informal caregivers providing care to individuals 60 years of age and older
- Adult family members or other informal caregivers providing care to individuals of any age with Alzheimer’s disease and related disorders
- Older relatives (not parents) age 55 and older providing care to children under the age of 18[5]

**Benefits:** Information, assistance, caregiver training, respite care, and supplemental services (specific hours, dollar amounts, or limits not detailed in West Virginia-specific sources; no stipends or fixed payments specified for NFCSP)[5]

**How to apply:**
- Contact local Area Agency on Aging (AAA) in West Virginia; no specific statewide phone, URL, or form named for NFCSP applications[9]
- West Virginia Bureau for Senior Services general inquiries via wvseniorservices.gov (related programs like Lighthouse referenced, but not direct NFCSP)[9]

**Timeline:** Not specified in available data
**Waitlist:** Not specified; potential regional variations implied but not detailed

**Watch out for:**
- NFCSP often confused with VA programs like PCAFC/PGCSS (veteran-specific, stipends, 70% disability); NFCSP has no income test or payments[5][6]
- No paid caregiver stipends in NFCSP; for payments, check state programs like Lighthouse or VA if applicable[9]
- Limited West Virginia-specific details available; must contact local AAA for exact services/availability[9]
- VA caregiver programs require veteran enrollment in VA health care and specific injury criteria[6][7]

**Data shape:** No income/asset test; services via local AAAs with regional delivery; often conflated with VA or state paid programs like Lighthouse; no fixed dollar/hour limits specified

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program[5]

---

### West Virginia Senior Legal Aid, Inc. (Senior Legal Services)


**Eligibility:**
- Age: 60+
- Income: No income limits for basic eligibility; all WV residents age 60+ qualify. Higher levels of service (legal advice and advocacy) prioritized for low-income, minority, disabled, very rural, LGBT, or very elderly seniors[2][7][8].
- Assets: No asset limits mentioned.
- West Virginia resident
- Civil legal issues related to senior programs or other matters (e.g., long-term care, public benefits, abuse/neglect, guardianship)

**Benefits:** Free civil legal services including legal information, advice, and advocacy/representation. Focuses on senior-specific issues like long-term care, public benefits (Medicaid/SSI), guardianship, age discrimination, financial exploitation, abuse/neglect, and consumer issues. Service level varies: basic for all eligible seniors, enhanced (advice/advocacy) for priority groups[2][7][8].
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free 1-800-229-5068[2][7]
- Email: info@seniorlegalaid.org[7]
- Website: https://www.seniorlegalaid.org for contact and 60+ Plan info[7][8]

**Timeline:** Not specified in sources.

**Watch out for:**
- This is a distinct program (West Virginia Senior Legal Aid, Inc.) separate from Legal Aid of West Virginia, which has income requirements and different elder services like LTC Ombudsman (no age/income limits but facility-focused)[1][2][5]
- Higher service levels not guaranteed for all; prioritized for vulnerable subgroups[2]
- Does not handle criminal, accidents, or personal injury cases[2]
- Legal Aid WV's general services require low-income or DV victim status and exclude seniors unless qualifying[1][5]
- Always confirm current details as priority criteria may evolve[7]

**Data shape:** No income/asset tests; tiered services by vulnerability (low-income, minority, disabled, rural, LGBT, very elderly); distinct from Legal Aid WV's means-tested programs

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.seniorlegalaid.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to any long-term care resident regardless of financial status[3][5]
- Assets: No asset limits or tests apply[3]
- Must be a resident of a long-term care facility in West Virginia, including nursing homes, assisted living facilities, residential care communities, or legally unlicensed homes[3][6]

**Benefits:** Identifying, investigating, and resolving complaints related to health, safety, welfare, and rights; routine unannounced facility visits to monitor care; representation to government agencies for administrative, legal, or other remedies; information and referral services; training and support for volunteers[1][2][3][6]

**How to apply:**
- Phone: Toll-free 1-800-834-0598 (connect to regional ombudsman); Regional offices (e.g., Martinsburg: 304-263-8871 ext. 2812, Director Ed Hopple: 304-449-4755 or 1-800-834-0598 ext. 3912); Website: https://legalaidwv.org/our-programs/long-term-care/ (contact info for 9 regional ombudsmen); Email: e.g., ehopple@lawv.net[3][5]

**Timeline:** Complaints investigated promptly per statewide procedures; no fixed timeline specified, but ombudsmen address issues ongoing (e.g., 683 complaints in 8 months in 2023)[1][6]

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy and complaint resolution, no direct services like care or payments[3][5]; volunteers have limited roles (no access to confidential records or legal actions)[1]; for facility licensure complaints, use separate OHFLAC process at (304) 558-0050[7]; must be in a covered long-term care facility, not home care[3][6]

**Data shape:** no income/asset/age test; advocacy only for facility residents; 9 regional offices with county-specific coverage; free/confidential/no application barrier

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://legalaidwv.org/our-programs/long-term-care/

---

### Lighthouse Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits or asset disqualification; uses a sliding fee scale based on the care recipient's (and spouse's, if applicable) annual income. Exact dollar amounts or table not specified in sources; fees determined per state cost share schedule.[1][2][3]
- Assets: No asset test or limits mentioned; designed for those whose income/assets disqualify them from Medicaid but need in-home support.[3][5]
- West Virginia resident.[5][6]
- Medically eligible based on functional evaluation by the program's RN/nurse.[1][2][3][5]
- Does not qualify for Medicaid programs.[4]

**Benefits:** Up to 60 hours per month of in-home services, based on assessed need and availability. Services include: personal care, mobility assistance, nutrition (e.g., meal preparation), light housekeeping, laundry.[3][4][5]
- Varies by: assessed_need

**How to apply:**
- Contact local county senior aging program (varies by county, e.g., Mason County: (304) 675-2369[1]; statewide info: WV Bureau of Senior Services toll-free 1-877-987-3646[2])
- Nurse evaluation for medical eligibility (arranged via local program)[1][3]

**Timeline:** Not specified in sources
**Waitlist:** Services limited by availability of caregivers; potential wait implied but not detailed[5]

**Watch out for:**
- Participants pay a sliding-scale fee based on income (not free; fees per state schedule).[1][2][3][4]
- Limited to 60 hours/month max, based on need and caregiver availability (may not cover full needs).[3][4][5]
- Targeted at those not qualifying for Medicaid; confirm ineligibility first.[4]
- Must pass RN functional evaluation for medical eligibility.[1][2]
- Apply via local county program, not centralized.[1][3][4][5]

**Data shape:** County-administered statewide program with uniform eligibility (age 60+, medical need, sliding fee by income) but local providers and potential variations in caregiver availability; no fixed income/asset tables published in sources, fees via state schedule

**Source:** No direct .gov URL in results; contact WV Bureau of Senior Services at 1-877-987-3646 or local county programs[2]

---

### Take Me Home Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or tables mentioned; eligibility tied to Medicaid receipt. Monthly income details are collected on application (e.g., jobs, Social Security, Worker’s Compensation), but no dollar thresholds provided in sources.[2][3]
- Assets: No asset limits specified, including what counts or exemptions.[1][2][3]
- Resided in a qualifying institution (nursing facility, hospital, or institution for mental disease) for at least 90 consecutive days (excluding Medicare rehabilitation days).[1][2][3]
- Receives Medicaid benefits on the last day prior to transitioning from the long-term facility to the community.[1][3]
- Assessed and determined eligible for Aged/Disabled Waiver (ADW) or Traumatic Brain Injury Waiver (TBIW).[2]
- Physically disabled, elderly, or have serious mental health issues (implied for transition support).[1]

**Benefits:** Transition services and support to move from long-term care facilities (nursing homes, hospitals, institutions for mental disease) to own home, family home, apartment, or group home with 4 or fewer residents. Specific supports include: rental/utility deposits, basic household items, community support, transition plan development. Comprehensive, person-centered Transition Plan developed by TMH field staff.[1][3]

**How to apply:**
- Phone: Toll-free 1-855-519-7557 or 304-352-4281; Director 304-352-4305; Aging & Disability Resource Network (ADRN) 1-866-981-2372.[3][5]
- Email: Brian.L.Holstine@wv.gov.[3]
- Mail: Take Me Home, West Virginia, Bureau for Medical Services, 350 Capitol St., Room 251, Charleston, WV 25301-3702.[3]

**Timeline:** Not specified in sources.

**Watch out for:**
- Must be eligible for ADW or TBIW waiver services before accessing TMH; transition cannot occur until after 90 consecutive days in facility.[2]
- Excludes Medicare rehabilitation days from 90-day count.[1][2]
- Medicaid benefits required on last day in facility.[1][3]
- Not for general elderly care; specifically for transitioning from institutional long-term care.[1][3]
- Housing history (evictions, bad credit, criminal history) assessed, which may impact transition success.[2]

**Data shape:** Eligibility hinges on institutional stay duration and Medicaid/waiver status rather than age, income, or assets; services are transition-specific with person-centered plans via statewide field staff.

**Source:** https://bms.wv.gov/take-me-home-tmh-transition-program

---

### Visually Impaired Seniors In-Home Outreach and Networking Services (VISIONS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits mentioned in available sources; eligibility focuses on age, employment status, and vision loss rather than financial thresholds.
- Assets: No asset limits mentioned or applicable based on sources.
- Not working
- Permanent vision loss
- West Virginia resident

**Benefits:** In-home services for independent living, including customized one-on-one skills training (3-9 months) such as travel training, vision utilization training, assistive audio devices, computer literacy and access technology, braille instruction, compensatory daily living skills, coping strategies for vision loss, and adaptive homemaking strategies.
- Varies by: individual_need

**How to apply:**
- Contact West Virginia Division of Rehabilitation Services (DRS) rehabilitation counselors specializing in blind and visually impaired services; phone and local office details available via wvdrs.org

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned for VISIONS (note: related children's program has waitlists)

**Watch out for:**
- Program is specifically for seniors 55+ who are not working; working individuals may access other DRS vision services instead
- Services are highly individualized with no fixed hours or dollar amounts—duration 3-9 months based on need
- Requires permanent vision loss, not temporary conditions
- Part of broader DRS vocational rehabilitation focus, emphasizing work-related goals and independent living

**Data shape:** no income or asset test; eligibility tied to age, non-employment status, and permanent vision impairment; services customized per participant with statewide DRS counselor access

**Source:** https://wvdrs.org/adults/specialized-services/services-for-the-blind-and-impaired/

---

### WV Bureau of Senior Services Home Modification and Accessibility Grant Program (Aging Well, Safe at Home Initiative)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified in available sources.
- Assets: No asset limits specified in available sources.
- West Virginia resident
- Demonstrate a need for home modifications and/or accessibility devices to live more independently at home or age in place

**Benefits:** Grants up to $3,000 for home modifications, accessibility devices, durable medical equipment, assistive devices, or technology. Examples include wheelchair ramps; requires detailed contractor estimates (no sales tax), contractor license, insurance, and W-9 for modifications.
- Varies by: fixed

**How to apply:**
- Phone: 866-981-2372 or 304-720-6861
- Email: adrcinfo@wvadrc.com
- Mail: WV Aging & Disability Resource Center, 824 Cross Lanes Drive, Charleston, WV 25313
- Download application: https://www.wvadrc.com/uploads/2/7/8/2/27820909/wv_boss_home_mod_application_job_aid_no_highlight.docx

**Timeline:** Not specified in sources.

**Watch out for:**
- Must provide contractor details and photos before and after for payment; no sales tax in estimates; demonstrate specific need for independence/aging in place; confirm details with ADRC as some sources lack full processing info

**Data shape:** Statewide with central ADRC application processing; grant capped at $3,000; no income/asset tests mentioned; requires pre-approval documentation from licensed contractors

**Source:** https://www.wvadrc.com/assistance-programs.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Medicare Savings Programs (QMB, | benefit | federal | deep |
| Aged and Disabled Waiver (ADW) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| SHIP (State Health Insurance Assistance  | resource | federal | simple |
| Meals on Wheels (Home Delivered Meals) | benefit | federal | medium |
| National Family Caregiver Support Progra | benefit | state | medium |
| West Virginia Senior Legal Aid, Inc. (Se | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Lighthouse Program | benefit | state | deep |
| Take Me Home Program | benefit | state | deep |
| Visually Impaired Seniors In-Home Outrea | benefit | state | medium |
| WV Bureau of Senior Services Home Modifi | benefit | state | medium |

**Types:** {"benefit":12,"resource":3}
**Scopes:** {"federal":7,"state":7,"local":1}
**Complexity:** {"deep":8,"simple":3,"medium":4}

## Content Drafts

Generated 15 page drafts. Review in admin dashboard or `data/pipeline/WV/drafts.json`.

- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 6 content sections, 6 FAQs
- **Aged and Disabled Waiver (ADW)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 5 content sections, 6 FAQs
- **SHIP (State Health Insurance Assistance Program)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels (Home Delivered Meals)** (benefit) — 3 content sections, 6 FAQs
- **National Family Caregiver Support Program (NFCSP)** (benefit) — 2 content sections, 6 FAQs
- **West Virginia Senior Legal Aid, Inc. (Senior Legal Services)** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Lighthouse Program** (benefit) — 3 content sections, 6 FAQs
- **Take Me Home Program** (benefit) — 2 content sections, 6 FAQs
- **Visually Impaired Seniors In-Home Outreach and Networking Services (VISIONS)** (benefit) — 2 content sections, 6 FAQs
- **WV Bureau of Senior Services Home Modification and Accessibility Grant Program (Aging Well, Safe at Home Initiative)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **Individual medical need and functional assessment; not specified by household size, priority tier, or region in search results**: 1 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 4 programs
- **assessed_need**: 1 programs
- **individual_need**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by QMB (100% FPL, full benefits), SLMB (120% FPL, Part B only), QI (135% FPL, Part B only, limited funds/annual renew); WV asset limits slightly differ from federal 2026; no household size scaling beyond couple; statewide uniform but local offices handle apps.
- **Aged and Disabled Waiver (ADW)**: ADW eligibility is highly individualized based on functional assessment rather than formulaic income/asset tables. Income limits vary by county and SSI status[2]. Asset limits apply primarily to home equity with specific exemptions[1]. Benefits are service-based (in-home care) rather than cash payments, with scope determined by individual medical need and available funded slots[2][6]. Application process involves multiple gatekeepers (physician, KEPRO, DHHR, Case Manager) rather than single-point application[5]. Program operates statewide but with county-level financial determination and potential regional provider variation[2][5].
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific provider service areas in WV (not statewide); no published income/asset tables or processing times; eligibility tied to NFLOC certification and community safety; benefits comprehensive but provider-specific
- **SNAP (Supplemental Nutrition Assistance Program)**: Benefits scale by household size and net income; expanded eligibility for elderly/disabled (net test only if gross exceeded, no asset limit); statewide via county DHHR offices.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: Income at 60% state median (not federal poverty); exclusions vary by period (e.g., SS/Vet); seasonal with crisis tier; processed via 55 county DoHS offices; auto-eligible via SNAP/TANF/SSI.
- **Weatherization Assistance Program (WAP)**: Administered via county-specific community action agencies; waitlist with priority tiers (elderly 60+, disabled, children, high energy burden); income at 200% FPG with table by household size; building eligibility required.
- **SHIP (State Health Insurance Assistance Program)**: SHIP is a service-based counseling program rather than a benefits program with income limits or monthly payments. Eligibility is straightforward (Medicare beneficiary + West Virginia resident) with no income or asset testing. The value is in personalized guidance and information rather than direct financial assistance. Services are distributed through a central office and county-based centers, making geographic accessibility variable depending on proximity to a senior center.
- **Meals on Wheels (Home Delivered Meals)**: Decentralized by county/region via local Area Agencies on Aging; no statewide income test or fixed forms; heavy waitlists and service area restrictions limit access
- **National Family Caregiver Support Program (NFCSP)**: No income/asset test; services via local AAAs with regional delivery; often conflated with VA or state paid programs like Lighthouse; no fixed dollar/hour limits specified
- **West Virginia Senior Legal Aid, Inc. (Senior Legal Services)**: No income/asset tests; tiered services by vulnerability (low-income, minority, disabled, rural, LGBT, very elderly); distinct from Legal Aid WV's means-tested programs
- **Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy only for facility residents; 9 regional offices with county-specific coverage; free/confidential/no application barrier
- **Lighthouse Program**: County-administered statewide program with uniform eligibility (age 60+, medical need, sliding fee by income) but local providers and potential variations in caregiver availability; no fixed income/asset tables published in sources, fees via state schedule
- **Take Me Home Program**: Eligibility hinges on institutional stay duration and Medicaid/waiver status rather than age, income, or assets; services are transition-specific with person-centered plans via statewide field staff.
- **Visually Impaired Seniors In-Home Outreach and Networking Services (VISIONS)**: no income or asset test; eligibility tied to age, non-employment status, and permanent vision impairment; services customized per participant with statewide DRS counselor access
- **WV Bureau of Senior Services Home Modification and Accessibility Grant Program (Aging Well, Safe at Home Initiative)**: Statewide with central ADRC application processing; grant capped at $3,000; no income/asset tests mentioned; requires pre-approval documentation from licensed contractors

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in West Virginia?
