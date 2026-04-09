# West Virginia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 15 |
| New (not in our data) | 11 |
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

## Program Types

- **service**: 10 programs
- **financial**: 2 programs
- **unknown**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Aged and Disabled Waiver

- **min_age**: Ours says `65` → Source says `18` ([source](https://www.wvseniorservices.gov (MNER form); https://bms.wv.gov (Bureau for Medical Services)))
- **income_limit**: Ours says `$2901` → Source says `$209` ([source](https://www.wvseniorservices.gov (MNER form); https://bms.wv.gov (Bureau for Medical Services)))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `In-home and community-based services equivalent to nursing home care, including personal care/attendant services, case management. Specific services: support for ADLs (eating, bathing, dressing, grooming, mobility, restroom). Exact hours/dollars not specified; person-centered to promote independence.[3][4][5][6]` ([source](https://www.wvseniorservices.gov (MNER form); https://bms.wv.gov (Bureau for Medical Services)))
- **source_url**: Ours says `MISSING` → Source says `https://www.wvseniorservices.gov (MNER form); https://bms.wv.gov (Bureau for Medical Services)`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,350,` ([source](https://www.medicare.gov/basics/costs/help/medicare-savings-programs and West Virginia DHHR (https://www.wvdhhr.org/)))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A monthly premiums (when applicable), Part B monthly premiums and annual deductible, and co-insurance and deductible amounts for services covered under Parts A and B[1]. SLMB: Pays Medicare Part B premium for the calendar year[1]. QI: Helps pay for Part B premiums[6]. All programs that qualify you for Original Medicare also automatically qualify you for Medicare Part D Extra Help, with maximum out-of-pocket drug costs of $12.65 per drug in 2026[2][6].` ([source](https://www.medicare.gov/basics/costs/help/medicare-savings-programs and West Virginia DHHR (https://www.wvdhhr.org/)))
- **source_url**: Ours says `MISSING` → Source says `https://www.medicare.gov/basics/costs/help/medicare-savings-programs and West Virginia DHHR (https://www.wvdhhr.org/)`

### West Virginia Senior Legal Aid (WVSLA)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.seniorlegalaid.org))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free civil legal services, including legal advice, advocacy, and representation in civil matters relevant to seniors (e.g., government benefits, housing, consumer issues). Basic services available to all eligible; enhanced services for priority groups.` ([source](https://www.seniorlegalaid.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.seniorlegalaid.org`

### Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Identifying, investigating, and resolving complaints; routine unannounced facility visits to monitor care; representing interests to government agencies for administrative, legal, or other remedies; all services free and confidential[4][5][7]` ([source](https://legalaidwv.org/our-programs/long-term-care/ (operated by Legal Aid of WV); https://code.wvlegislature.gov/16-5L/ (enabling WV Code)))
- **source_url**: Ours says `MISSING` → Source says `https://legalaidwv.org/our-programs/long-term-care/ (operated by Legal Aid of WV); https://code.wvlegislature.gov/16-5L/ (enabling WV Code)`

## New Programs (Not in Our Data)

- **West Virginia Medicaid Personal Care Services Program** — service ([source](https://bms.wv.gov/media/30546/download?inline (WV Medicaid Personal Care Services Program PDF); https://wvaging.com/personal-care/[3][4]))
  - Shape notes: Entitlement (no waitlist); hours scale by assessed personal care needs/medical necessity tier; requires prior Medicaid eligibility + separate medical assessment; statewide with RN-supervised in-home services
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](No WV-specific .gov URL found; general: https://www.cms.gov/medicare/medicaid-coordination/about/pace[5]; https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly[7]))
  - Shape notes: Limited WV-specific data; not statewide, only at select providers/centers; no income/asset tests detailed; eligibility tied to service area and state nursing home certification; expansion advocated but not confirmed as of sources[3][9]
- **LIEAP (Low Income Energy Assistance Program) & LIHEAP-RRP (Repair and Replace Program)** — unknown ([source](https://bfa.wv.gov/utility-assistancelieap (LIEAP)[7]; https://wvcad.org/sustainability/liheap (LIHEAP-RRP)[3]))
  - Shape notes: LIEAP benefits scale by household size and heating costs; income limits vary by household size. LIHEAP-RRP has strict household composition requirements (must include vulnerable individual) in addition to income limits. Both programs are federally funded with annual variations. LIEAP operates on a seasonal window (winter months); LIHEAP-RRP operates year-round but with limited annual funding (~$6M). Application methods differ: LIEAP can be applied for online or in-person; LIHEAP-RRP must go through local Community Action Agencies.
- **Weatherization Assistance Program (WAP)** — service ([source](https://wvcad.org/sustainability/weatherization-assistance-program))
  - Shape notes: Administered county-by-county via local community action agencies; waitlist with priority tiers (elderly 60+ get points); income at exactly 200% FPG with prior-year gross proof and exclusions; building eligibility required.
- **SHIP (State Health Insurance Assistance Program)** — service ([source](https://www.shiphelp.org/ships/west-virginia/ (links to WV SHIP site); Bureau of Senior Services contact via CMS[6][7]))
  - Shape notes: no income test; counseling-only service, not benefits-paying; delivered via statewide network of senior centers with central phone line
- **Caregiver/Respite Support** — service ([source](https://dhhr.wv.gov/bms/Members/Apply/Pages/default.aspx (Medicaid); local AAAs via aging.wv.gov))
  - Shape notes: Highly fragmented by county/local providers; no statewide elderly caregiver respite with uniform eligibility/benefits; Medicaid waivers target IDD not general elderly; access via 55+ Area Agencies on Aging centers.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: Grantee-based by county clusters (not uniform statewide); priority enrollment tiers; no fixed income table or asset test in sources—income verified locally against current 125% FPL
- **Lighthouse Program** — service ([source](https://www.wvseniorservices.gov))
  - Shape notes: State-funded, county-administered via local aging agencies; sliding fee (not asset-tested); up to 60 hours/month capped by need/availability; targets Medicaid-ineligible seniors with functional needs.
- **Aging Well, Safe at Home Initiative: WV BoSS Home Modification and Accessibility Program** — financial ([source](https://www.wvadrc.com/assistance-programs.html))
  - Shape notes: no income test; eligibility hinges on age 60+ and demonstrated need only; administered via statewide ADRC with central mail/phone application[1][6]
- **Take Me Home, West Virginia Program** — service ([source](https://bms.wv.gov/take-me-home-tmh-transition-program))
  - Shape notes: Tied to Medicaid MFP grant; eligibility hinges on institutional stay duration and Medicaid status rather than age/income/assets directly; services person-centered via field staff statewide.
- **FAIR (Family Alzheimer's In-Home Respite)** — service ([source](https://wvaging.com/fair/))
  - Shape notes: County-restricted to Mineral County; no financial eligibility tests mentioned; fixed benefit of up to 16 hours/week respite care.

## Program Details

### West Virginia Medicaid Personal Care Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Must meet West Virginia Medicaid financial eligibility criteria, which includes a Medically Needy Pathway (Spenddown Program) allowing applicants to spend excess income on medical expenses to qualify. Specific dollar amounts not detailed in sources; varies by Medicaid category (e.g., aged, blind, disabled). Use American Council on Aging Medicaid Eligibility Test for precise limits.[1]
- Assets: Must meet West Virginia Medicaid asset limits (specific amounts not provided in sources; standard Medicaid rules apply with exemptions typical for the program such as primary home, one vehicle, personal belongings). Applying over limits results in denial.[1]
- West Virginia resident
- Eligible for West Virginia State Medicaid (must have Medicaid card)
- Medically eligible: Physician-prescribed need for assistance in at least three activities of daily living (e.g., eating, bathing, dressing, grooming, hygiene, mobility, toileting); confirmed by RN in-home evaluation (Pre-Admission Screening via PC-MNER)
- Services necessary for long-term health and safety; plan of care by RN[1][2][3][4][8]

**Benefits:** In-home personal care services by trained para-professionals supervised by RN, including hands-on assistance with: meals, grooming, hygiene, bathing, dressing, toileting, mobility, other personal care needs; limited housekeeping only if paired with personal care; also grocery shopping, errands, housework, budget management, transportation to doctor appointments if personal care needs exist. Hours per month based on assessed personal care needs (greater need = more hours). Excludes skilled nursing, medications, wound care, injections.[2][3][4]
- Varies by: priority_tier

**How to apply:**
- Submit completed Personal Care Program Medical Necessity Evaluation Request (PC-MNER) to doctor (MD/DO), physician assistant, or RN for completion, then to Bureau of Senior Services. Already on Medicaid: initiate via PC-MNER for in-home assessment scheduling.[1][3]
- Phone: Bureau of Senior Services Medicaid helpline at 866-767-1575 or (304) 558-2241; Toll Free Information Line 1-866-767-1575[1][3][7]
- Mail/In-person: Bureau of Senior Services, 1900 Kanawha Blvd. East, Charleston, WV 25305[7]

**Timeline:** RN contacts for in-home evaluation (Pre-Admission Screening) after PC-MNER receipt; timeline not specified[1][3]
**Waitlist:** None - entitlement program; Medicaid eligibility guarantees services[1]

**Watch out for:**
- Must already have or qualify for Medicaid first (financial eligibility strict; use spenddown if over income)
- Medical eligibility requires needs in at least 3 ADLs and physician order; not just any impairment
- Housekeeping only if combined with personal care - not standalone
- No skilled tasks (meds, wounds, injections); compare to waivers like I/DD Waiver which have different criteria (e.g., developmental disability diagnosis)[1][2][3][4]
- Entitlement but apply only if eligible to avoid denial[1]

**Data shape:** Entitlement (no waitlist); hours scale by assessed personal care needs/medical necessity tier; requires prior Medicaid eligibility + separate medical assessment; statewide with RN-supervised in-home services

**Source:** https://bms.wv.gov/media/30546/download?inline (WV Medicaid Personal Care Services Program PDF); https://wvaging.com/personal-care/[3][4]

---

### Aged and Disabled Waiver


**Eligibility:**
- Age: 18+
- Income: Must meet Medicaid Waiver financial eligibility criteria as determined by West Virginia DHHR county office or SSA for SSI recipients. Specific dollar amounts not listed in sources; may qualify via Medically Needy Program if medical costs reduce income to $209/month remaining. No household size table provided.[1][2][7]
- Assets: Home equity interest no greater than $730,000 (2025 limit) if living in home or intent to return. Exemptions: spouse or dependent relative (child, grandchild, parent, aunt/uncle, sibling, niece/nephew) living in home.[1]
- West Virginia resident (permanent, with proof).
- Nursing Facility Level of Care (NFLOC): 5 functional deficits via Pre-Admission Screening (PAS) by RN, including ADLs (bathing, dressing, walking, eating, continence), bedsores, emergency evacuation inability, skilled needs (sterile dressings, tracheostomy), medication self-administration inability.[1][2][3]
- Choose home/community-based services over nursing home.
- Safe environment for staff.
- Enrollment dependent on funded slot availability.[2][4]

**Benefits:** In-home and community-based services equivalent to nursing home care, including personal care/attendant services, case management. Specific services: support for ADLs (eating, bathing, dressing, grooming, mobility, restroom). Exact hours/dollars not specified; person-centered to promote independence.[3][4][5][6]
- Varies by: priority_tier

**How to apply:**
- Physician/PA/NP completes Medically Necessity Evaluation Request (MNER) form from www.wvseniorservices.gov, sends to KEPRO.[3][5]
- Submit MNER and KEPRO letter to local DHHR office for financial eligibility.[5]
- Call 1-866-767-1575 for questions.[3]
- RN schedules in-home assessment after financial approval.[3][5]
- Select provider/case management agency via KEPRO form.[5]

**Timeline:** Case manager contacts within 5 days of provider selection.[5]
**Waitlist:** Enrollment dependent on availability of funded ADW slot.[2]

**Watch out for:**
- Must have exactly 5 functional deficits for NFLOC; dementia diagnosis alone insufficient.[1]
- Home equity limit $730,000 (2025); exemptions narrow.[1]
- Slot availability limits enrollment; waitlist possible.[2]
- SSI recipients determined by SSA, others by DHHR.[2]
- Must choose waiver over nursing home; safe environment required.[4]
- Financial eligibility separate from medical; Medically Needy pathway for over-limit.[7]

**Data shape:** Financial eligibility via Medicaid standards (SSI/DHHR), no fixed income table; tiered by NFLOC with 5 deficits; statewide but county DHHR offices handle finances; funded slots create waitlist variability.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.wvseniorservices.gov (MNER form); https://bms.wv.gov (Bureau for Medical Services)

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits or dollar amounts mentioned in available sources; most participants are dually eligible for Medicare and Medicaid, but private pay may be possible[3][4][5][7]
- Assets: No asset limits, what counts, or exemptions specified in sources
- Live in the service area of a PACE organization (specific WV areas not detailed; one provider at paceyourlifemwv.com suggests limited availability)[3]
- Certified by the state as meeting nursing home level of care[1][4][7]
- Able to live safely in the community (at home) without jeopardizing health or safety at time of enrollment[1][4][7]

**Benefits:** Comprehensive medical and social services coordinated by an interdisciplinary team, provided at PACE centers, home, or community; specific services include: primary/nursing/specialist care, prescription medications (management/home delivery), medical equipment/supplies, preventative care (dental, vision, podiatry), nutritional counseling/meals/snacks, physical/occupational/recreational therapy, behavioral health/social services, home health/personal care assistance, transportation to appointments/center, adult day programs/social activities, hospital/nursing home care when needed, emergency services. No specific dollar amounts or hours per week stated[1][2][3]

**How to apply:**
- Contact PACE Your LIFE provider via https://paceyourlifemwv.com (WV-specific)[3]
- Phone/website not specified in sources; general CMS/Medicare guidance applies but no WV numbers provided
- No mail or in-person details given

**Timeline:** Not specified in sources

**Watch out for:**
- Not yet widely available in WV; may be limited to specific areas/providers unlike VA examples[9]
- Becomes sole source of Medicare/Medicaid benefits; disenroll anytime but coordinate other coverage[4][7]
- Must live safely in community at enrollment; nursing home-level need required[1][4]
- No WV state certification process or income/asset details in sources; contact provider directly
- Private pay possible but most dually eligible[3]

**Data shape:** Limited WV-specific data; not statewide, only at select providers/centers; no income/asset tests detailed; eligibility tied to service area and state nursing home certification; expansion advocated but not confirmed as of sources[3][9]

**Source:** No WV-specific .gov URL found; general: https://www.cms.gov/medicare/medicaid-coordination/about/pace[5]; https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly[7]

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Income limits are based on Federal Poverty Level (FPL) and change annually on April 1. For 2026, West Virginia uses 135% FPL as the maximum threshold[4]. Specific monthly income limits for 2026 are: QMB: Individual $1,350, Married couple $1,824[6]; SLMB: Individual $1,526, Married couple $2,064[2]; QI: Individual $1,715, Married couple $2,320[2]. Note: Income limits may be slightly higher in Alaska and Hawaii, and some states have more generous standards than federal minimums[1][6].
- Assets: Total asset limits for QMB, SLMB, and QI programs in West Virginia are: Individual $9,660, Married couple $14,470[3]. Countable resources include: cash, money in checking or savings accounts, stocks, bonds, annuities, and CDs[3]. Some states (e.g., Connecticut) have no asset limit for QI[1].
- Must be eligible for Medicare Part A (even if not currently enrolled)[1]
- Must be U.S. citizen, permanent resident, or qualified non-citizen[4]
- For SLMB and QI: Must have both Part A and Part B[2][5]
- For QI: Cannot be eligible for Medicaid (if eligible for Medicaid, may qualify for another MSP instead)[5]
- For QDWI: Must have a disability, be working, and have lost Social Security disability benefits and Medicare premium-free Part A because of returning to work[6]

**Benefits:** QMB: Pays Medicare Part A monthly premiums (when applicable), Part B monthly premiums and annual deductible, and co-insurance and deductible amounts for services covered under Parts A and B[1]. SLMB: Pays Medicare Part B premium for the calendar year[1]. QI: Helps pay for Part B premiums[6]. All programs that qualify you for Original Medicare also automatically qualify you for Medicare Part D Extra Help, with maximum out-of-pocket drug costs of $12.65 per drug in 2026[2][6].
- Varies by: program_tier

**How to apply:**
- Contact your state's Medicaid office (West Virginia Department of Health and Human Resources)[1][2]
- Mail: Submit completed form DFA-QSQ-1 (QMB, SLMB, QI-1)[8]
- In-person: Visit local Medicaid office

**Timeline:** Eligibility for QMB is effective on the first day of the month following approval[1]. Specific processing timelines for West Virginia not provided in search results.
**Waitlist:** For QI Program specifically: States approve applications on a first-come, first-served basis with priority given to people who received QI benefits the previous year[6]. General waitlist status for West Virginia not specified in search results.

**Watch out for:**
- Income limits change every April 1[1]. Families must reapply annually to maintain eligibility, especially for QI (which explicitly requires annual reapplication)[6].
- QI has a first-come, first-served approval process with priority only for prior-year recipients[6]. This means funding may run out mid-year in some states.
- If someone is eligible for Medicaid, they cannot use QI but may qualify for QMB or SLMB instead[5].
- QI only applies to Original Medicare (Parts A and B) and does not affect Medicare Advantage (Part C) or Medigap plans[5].
- Asset limits are relatively low ($9,660 individual / $14,470 couple in West Virginia)[3]. Savings, investments, and CDs all count toward this limit.
- Some states have more generous income or asset limits than federal standards[1][6]. West Virginia families should verify current limits with their state Medicaid office.
- Eligibility is effective on the first day of the month following approval[1], not the application date.
- The programs help with premiums and cost-sharing but do not cover all Medicare expenses.

**Data shape:** Medicare Savings Programs are tiered by income level: QMB (lowest income, most comprehensive benefits), SLMB (middle income, Part B premium only), QI (higher income, Part B premium only). Income limits are pegged to Federal Poverty Level and reset annually on April 1. West Virginia uses 135% FPL as the maximum eligibility threshold across all programs[4]. All three programs share the same asset limits. Eligibility and benefits vary significantly by program tier but not by region within West Virginia based on available information. QI has a first-come, first-served funding model, making it distinct from QMB and SLMB.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.medicare.gov/basics/costs/help/medicare-savings-programs and West Virginia DHHR (https://www.wvdhhr.org/)

---

### LIEAP (Low Income Energy Assistance Program) & LIHEAP-RRP (Repair and Replace Program)

> **NEW** — not currently in our data

**Eligibility:**

**Benefits:** N/A


**Watch out for:**
- Two separate programs: LIEAP is for heating bill assistance; LIHEAP-RRP is for system repair/replacement. Families may qualify for one, both, or neither[1][3]
- Income limits vary by household size AND by program (LIEAP uses 60% state median income OR 150% federal poverty level; LIHEAP-RRP uses 60% state median income)[1][3]
- LIEAP has a narrow application window (typically February in FY2026) and closes when funding exhausted—missing the deadline means waiting until next year[1][7]
- LIHEAP-RRP requires household to include someone age 60+, under 6, or disabled—elderly alone may not qualify[3]
- Some income types are excluded from LIEAP calculations (varies by year)[5]
- LIHEAP-RRP is administered through Community Action Agencies, not directly through state—must contact local agency for your county[3]
- For LIEAP, households must be responsible for paying heating expenses; renters whose landlord pays may not qualify[1]
- Online LIEAP application requires creating an account; in-person assistance available at Senior Centers and Community Action Agencies[2]
- Crisis LIEAP component exists for emergencies but requires separate application/evaluation[7]

**Data shape:** LIEAP benefits scale by household size and heating costs; income limits vary by household size. LIHEAP-RRP has strict household composition requirements (must include vulnerable individual) in addition to income limits. Both programs are federally funded with annual variations. LIEAP operates on a seasonal window (winter months); LIHEAP-RRP operates year-round but with limited annual funding (~$6M). Application methods differ: LIEAP can be applied for online or in-person; LIHEAP-RRP must go through local Community Action Agencies.

**Source:** https://bfa.wv.gov/utility-assistancelieap (LIEAP)[7]; https://wvcad.org/sustainability/liheap (LIHEAP-RRP)[3]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income must be less than or equal to 200% of the Federal Poverty Guidelines (updated annually; guidelines effective April 8, 2025): 1: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300; add $11,000 per additional member. Income is gross cash receipts before taxes from the prior tax year; excludes child support, tax refunds, college scholarships, etc.[1]
- Assets: No asset limits mentioned.[1][2]
- Must reside in West Virginia.
- Dwelling must meet building eligibility requirements (structurally adaptable for weatherization materials).
- Renters need landlord permission.
- Priority on waitlist for elderly (60+), disabled, children (18 or younger), high energy burden, or high energy use.[1][2][3]

**Benefits:** Installation of cost-effective energy-saving measures including insulation (walls/floors), air infiltration sealing, duct sealing/repair, heating/cooling system repair/replacement, ventilation fans, energy-efficient lighting, health/safety checks (e.g., carbon monoxide testing, CO/fire alarms). Exact measures depend on energy audit; no fixed dollar amount or hours—services provided once per home based on federal funding ($4,325,662 for PY2024).[1][8]
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency serving your county (in-person, phone, or visit; list available via agencies like wvcad.org).[1][2]
- Apply in person at community action agency (application ~20 minutes).[2]

**Timeline:** Eligibility determination after application and income verification (time-consuming process); then placed on waitlist for energy audit and services.[1][2]
**Waitlist:** Yes, all eligible applicants placed on waitlist; prioritized by points for elderly (60+), disabled, children, high energy burden/use.[1][2]

**Watch out for:**
- Income verification is time-consuming with official documentation required for ALL sources from prior year.[2]
- Dwelling must meet building eligibility (not all homes qualify).[1]
- Renters need landlord permission first.[2]
- Services once per home; waitlist prioritization favors elderly/disabled/children—others may wait longer.[1][2]
- Not for utility bill payment; energy efficiency/weatherization only.[8]
- Funding varies annually by federal appropriations—may impact availability.[1]

**Data shape:** Administered county-by-county via local community action agencies; waitlist with priority tiers (elderly 60+ get points); income at exactly 200% FPG with prior-year gross proof and exclusions; building eligibility required.

**Source:** https://wvcad.org/sustainability/weatherization-assistance-program

---

### SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits. Open to all West Virginia Medicare beneficiaries seeking health insurance counseling.[4][8]
- Assets: No asset limits or tests apply.[4]
- Must reside in West Virginia[6][8]
- Must be a Medicare beneficiary (typically age 65+ or under 65 with certain disabilities)[4][8]

**Benefits:** Free, one-on-one personalized health insurance counseling; information and printed materials; referrals to agencies; assistance with Medicare Part A/B, Part D, Medigap, Medicare Advantage (HMOs/PPOs), long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription drug assistance, Medicaid, and other insurance/free health care programs. Counselors help understand benefits, compare options, and avoid overpaying.[4][8]

**How to apply:**
- Phone: 1-877-987-4463[7]
- In-person: County senior centers throughout WV or main office at West Virginia Bureau of Senior Services, 1900 Kanawha Boulevard East, 3rd Floor Town Center Mall, Charleston WV 25305-0160[6][8]
- Website: West Virginia Website (via shiphelp.org link, for contact and appointments)[7]

**Timeline:** No formal processing; services provided via appointment scheduling upon contact. No specified timeline.[4]

**Watch out for:**
- Not a financial aid or healthcare provision program—only free counseling and information, no direct payments or coverage[4]
- People confuse with CHIP (children's program) or Medicaid due to similar acronyms; SHIP is Medicare-specific[1][4][8]
- Must be Medicare beneficiary; does not cover non-Medicare individuals[4][8]
- Services are appointment-based; call ahead as no walk-in guarantee at county centers[8]

**Data shape:** no income test; counseling-only service, not benefits-paying; delivered via statewide network of senior centers with central phone line

**Source:** https://www.shiphelp.org/ships/west-virginia/ (links to WV SHIP site); Bureau of Senior Services contact via CMS[6][7]

---

### Caregiver/Respite Support

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by local program; no statewide uniform limits. Nicholas CAP: Care recipient not eligible for Medicaid. Kanawha Valley: Fee based on income of care recipient, no specific dollar amounts. Medicaid waivers (not primary elderly program): Single applicant under $2,982/month (300% SSI) or $994/month (100% SSI) depending on waiver vs state plan[1].
- Assets: No statewide asset limits specified for elderly caregiver respite. Medicaid waivers: Under $2,000 for applicant[1]. Local programs generally do not mention assets.
- Caregiver must be full-time, unpaid family member[2][4][6].
- Care recipient frail, elderly (60+), ill, or with dementia/Alzheimer's[2][4][6][7].
- Not Medicaid-eligible in some local programs (e.g., Nicholas CAP)[6].
- For dementia-specific: Diagnosis of Alzheimer's or related dementia[7].
- Regional: Limited to specific counties (e.g., Preston, McDowell, Nicholas, Kanawha)[2][4][6][7].
- WV IDD Waiver (not elderly-focused): Developmental/intellectual disability manifesting before age 22, ICF/IID level of care[3].

**Benefits:** In-home or out-of-home short-term respite care for caregiver relief. Specifics: Up to 12 hours/week in Nicholas CAP[6]; in-home relief in McDowell/Preston[2][4]; congregate adult day care (8:30am-3:30pm M-F) or in-home for dementia in Kanawha Valley[7]. Funding via donations in McDowell[4]; opportunity to contribute (not mandatory) in Nicholas[6].
- Varies by: region

**How to apply:**
- Contact local providers: Preston County Senior Citizens, Inc. (preston county-specific)[2]; McDowell County Commission on Aging (mcdowellcoa.org)[4]; Nicholas Community Action Partnership (ncapwv.org)[6]; Kanawha Valley Senior Services (kvss.org, 1710 Pennsylvania Ave, Charleston)[7].
- Medicaid waivers: WV DHHR Bureau for Medical Services, 350 Capitol Street Room 251, Charleston WV 25301 or https://dhhr.wv.gov/bms/Members/Apply/Pages/default.aspx[3].
- No statewide centralized phone/website for elderly respite; apply via county senior centers or area agencies on aging.

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned for local programs; Medicaid waivers may have slots (e.g., IDD waiver enrollment 4634 as of 2020)[3].

**Watch out for:**
- No unified statewide program for elderly; must contact county-specific providers[1][2][4][6][7].
- Medicaid does not offer respite for aged/disabled in WV (unlike some states); adult day care may substitute[1].
- Many programs county-restricted; rural areas may have limited access.
- Some exclude Medicaid-eligible[6]; others fee-based on income[7].
- Caregiver cannot be legally responsible person in some waivers[3].
- Funding donation-based in areas like McDowell, potentially limiting availability[4].

**Data shape:** Highly fragmented by county/local providers; no statewide elderly caregiver respite with uniform eligibility/benefits; Medicaid waivers target IDD not general elderly; access via 55+ Area Agencies on Aging centers.

**Source:** https://dhhr.wv.gov/bms/Members/Apply/Pages/default.aspx (Medicaid); local AAAs via aging.wv.gov

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; families must contact a local provider to confirm current thresholds based on HHS poverty guidelines[3][4].
- Assets: No asset limits mentioned in available sources[3][4].
- Unemployed
- Low-income (≤125% FPL)
- Priority to veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, low employment prospects, or American Job Center users[3]

**Benefits:** Part-time community service job training (average 20 hours/week) at highest of federal, state, or local minimum wage; skill development; annual physical exam; support services (Social Security info, tax requirements, nutrition, consumer education, grooming); bridge to unsubsidized employment[1][3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: Regional providers (e.g., Preston County Senior Citizens, Inc. at (304) 329-0464 for Boone, Clay, Doddridge, Harrison, Kanawha, Mercer, Monongalia, Preston, Putnam, Raleigh, Taylor Counties[1])
- Contact local providers like Human Resource Development Foundation (hrdfwv.org) or Southwestern Community Action Council (scacwv.org)[2][5]
- AARP Foundation locator for nearby programs (my.aarpfoundation.org/locator/scsep/)[7]

**Timeline:** Not specified; most participants trained for about 6 months before job placement[4].
**Waitlist:** Not mentioned; may vary by region and funding[4].

**Watch out for:**
- Not statewide—must confirm county coverage with specific grantee; contact local provider first[1][5]
- Income at ≤125% FPL requires verification; priority groups get preference, potentially longer waits for others[3]
- Temporary training (avg. 20 hrs/wk, ~6 months), not permanent job or full income replacement[3][4]
- Wage is minimum (highest federal/state/local), modest pay only[3][4]

**Data shape:** Grantee-based by county clusters (not uniform statewide); priority enrollment tiers; no fixed income table or asset test in sources—income verified locally against current 125% FPL

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### West Virginia Senior Legal Aid (WVSLA)


**Eligibility:**
- Age: 60+
- Income: No strict income limits for basic eligibility; all WV residents age 60+ qualify. Higher levels of service (e.g., legal advice, advocacy) prioritized for low-income, minority, disabled, very rural, LGBT, or very elderly seniors.
- Assets: No asset limits mentioned.
- Must be a resident of West Virginia.
- The senior age 60+ must contact the program directly (not a family member on their behalf).

**Benefits:** Free civil legal services, including legal advice, advocacy, and representation in civil matters relevant to seniors (e.g., government benefits, housing, consumer issues). Basic services available to all eligible; enhanced services for priority groups.
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free 1-800-229-5068
- Website: https://www.seniorlegalaid.org/blank-2 (request services page)

**Timeline:** Not specified in available data.

**Watch out for:**
- The person age 60+ must call themselves—family cannot apply on their behalf.
- Basic eligibility is open, but full advocacy/representation prioritized for vulnerable groups (low-income, etc.); others may get limited brief advice.
- Does not handle criminal cases, accidents, personal injury, or class actions.
- Intake requires personal details on legal issue, household, and finances.

**Data shape:** No income or asset tests for entry; services tiered by vulnerability/priority rather than strict financial cutoffs; senior must self-initiate contact.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.seniorlegalaid.org

---

### Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; services are free and available to any long-term care resident, family, or concerned party[4][5]
- Assets: No asset limits or tests apply[4][5]
- Resident must be in a long-term care facility such as nursing home, assisted living, residential care community, or legally unlicensed home in West Virginia[4][5]

**Benefits:** Identifying, investigating, and resolving complaints; routine unannounced facility visits to monitor care; representing interests to government agencies for administrative, legal, or other remedies; all services free and confidential[4][5][7]

**How to apply:**
- Phone: Toll Free 1-800-834-0598 (various extensions for regions and director); Regional offices e.g., Huntington: 304-697-2070 ext. 2520; Director Ed Hopple: 304-449-4755 or 1-800-834-0598 ext. 3912; In-person at regional offices e.g., 418 8th Street, Second Floor, Huntington, WV 25701[5]

**Timeline:** Immediate response for complaints and advocacy; no formal processing as it's not an entitlement program[4][5]

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy for complaints and rights in facilities; ombudsmen are non-attorneys, though they pursue remedies[4][5]; anyone can contact on behalf of resident, including families considering placement[5][7]; volunteer program available but separate from resident services[5]

**Data shape:** no income/asset test; advocacy only for long-term care facility residents; 9 regional structure with county-specific ombudsmen; free/confidential for residents/families/anyone concerned

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://legalaidwv.org/our-programs/long-term-care/ (operated by Legal Aid of WV); https://code.wvlegislature.gov/16-5L/ (enabling WV Code)

---

### Lighthouse Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits or asset disqualification; eligibility is financial based on a sliding fee scale according to the individual's (and spouse's, if applicable) annual income. Designed as a program of last resort for those whose income/assets disqualify them from Medicaid but cannot afford private pay without hardship. Exact dollar thresholds not specified in sources; determined locally.[1][2][3][4][5]
- Assets: No asset test mentioned; program targets those disqualified from Medicaid by income/assets but facing financial hardship for private care. Assets do not disqualify.[2][4][5]
- West Virginia resident.[3][4]
- Medically eligible based on functional evaluation/assessment by the local senior aging program's registered nurse (RN), assessing needs in areas like personal care, mobility, nutrition, and environment.[1][2][3][4][5]

**Benefits:** In-home supportive services up to 60 hours per month, based on need and caregiver availability. Services include: personal care (bathing, dressing, grooming, eating, toileting); mobility (transferring in/out of bed, walking); nutrition (meal preparation, eating, grocery/pharmacy shopping); environment (light housecleaning, making/changing bed, laundry). Provided by caregivers employed by local senior aging programs.[1][2][3][4][5]
- Varies by: priority_tier

**How to apply:**
- Contact your local county senior program (specific contacts vary by county, e.g., Preston County: (304) 329-6272).[2]
- Call West Virginia Bureau for Senior Services toll-free: 1-877-987-3646.[1][3]

**Timeline:** Not specified in sources.
**Waitlist:** Services limited by need and availability of caregivers; potential wait implied but no formal waitlist details.[3]

**Watch out for:**
- Not free—uses sliding fee scale based on income; not income-disregarded.[1][2][3][5]
- Program of last resort for non-Medicaid eligible; won't substitute for Medicaid or private pay.[4][5]
- Hours capped at 60/month, based on need/availability—may not meet full needs.[2][3]
- Must contact local county program (not centralized); statewide hotline routes to locals.[1][2][3]
- Medical eligibility requires RN assessment; functional needs in ADLs (activities of daily living) essential.[1][2][3][4][5]

**Data shape:** State-funded, county-administered via local aging agencies; sliding fee (not asset-tested); up to 60 hours/month capped by need/availability; targets Medicaid-ineligible seniors with functional needs.

**Source:** https://www.wvseniorservices.gov

---

### Aging Well, Safe at Home Initiative: WV BoSS Home Modification and Accessibility Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or tables mentioned in available sources; eligibility based on demonstrated need rather than financial thresholds[1][4][6]
- Assets: No asset limits specified, including no details on what counts or is exempt[1][4][6]
- Must demonstrate a need for home modifications and/or accessibility devices to live more independently at home[1][4][6]

**Benefits:** Funds to assist with costs of home modifications and/or accessibility devices; specific dollar amounts, service details, or tiers not specified[1][4][6]

**How to apply:**
- Phone: 866-981-2372[6]
- Email: adrc@wvseniorservices.org[6]
- Mail: WV Aging & Disability Resource Center, 824 Cross Lanes Drive, Charleston, WV 25313[6]
- In-person: Through local WV Aging and Disability Resource Center (ADRC)[6]

**Timeline:** Not specified in sources

**Watch out for:**
- No mention of income or asset limits, but similar programs like Lighthouse exclude based on income/assets disqualifying from Medicaid—confirm no hidden financial test[1][2][5]
- Must demonstrate specific need for modifications/devices, not automatic approval[1][6]
- Documents and exact funding amounts not detailed; applicants should verify with ADRC to avoid generic assumptions[1][6]
- Potentially confused with Medicaid waivers (e.g., ADW) which have strict financial and medical criteria[2][5]

**Data shape:** no income test; eligibility hinges on age 60+ and demonstrated need only; administered via statewide ADRC with central mail/phone application[1][6]

**Source:** https://www.wvadrc.com/assistance-programs.html

---

### Take Me Home, West Virginia Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits stated for the program itself; participants must be Medicaid-eligible on the last day prior to transitioning. General WV Medicaid long-term care limits (2026): single applicant income under $2,982/month.[3]
- Assets: No specific asset limits stated for the program; follows WV Medicaid rules (e.g., single applicant assets under $2,000; primary home exempt if spouse/child under 21/permanently disabled child lives there or intent to return, with home equity limit of $752,000).[3]
- Residing in a nursing facility, hospital, institution for mental disease, or combination for at least 60 consecutive days (excluding Medicare rehab days; previously 90 days).[1][2][4]
- Receive Medicaid benefits on the last day prior to transitioning from the facility to the community.[1][4]
- Nursing Home Level of Care required via Medicaid eligibility.[3]

**Benefits:** Comprehensive transition supports including rental/utility deposits, basic household items, community support, transition plan development, and person-centered services to move from long-term care facilities to own home/apartment/family home/group home (4 or fewer residents).[1][4]

**How to apply:**
- Phone: 1-855-519-7557 (toll-free) or 304-352-4281; also 1-866-981-2372 via Aging & Disability Resource Network.[2][4][6]
- Website: TMHWV.org.[2]
- Mail: Take Me Home, West Virginia, Bureau for Medical Services, 350 Capitol St., Room 251, Charleston, WV 25301-3702.[4]
- In-person: Network of TMH field staff throughout the state.[4]

**Timeline:** Not specified in sources.

**Watch out for:**
- Must be Medicaid-eligible at transition; program supports but does not replace Medicaid requirements like Nursing Home Level of Care.[1][3][4]
- 60-day minimum institutional stay (excluding Medicare rehab); intent to return to community required.[1][2][3]
- Focuses on transition support only—not ongoing long-term care; success measured by 365-day community retention.[2]
- No explicit details on processing times, waitlists, or exact service dollar amounts/hours.

**Data shape:** Tied to Medicaid MFP grant; eligibility hinges on institutional stay duration and Medicaid status rather than age/income/assets directly; services person-centered via field staff statewide.

**Source:** https://bms.wv.gov/take-me-home-tmh-transition-program

---

### FAIR (Family Alzheimer's In-Home Respite)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits specified.
- Assets: No asset limits specified.
- Diagnosis of Alzheimer’s disease OR another dementia
- A resident of Mineral County

**Benefits:** Up to 16 hours of respite care per week. This service allows the caregiver to have a regular break from caregiving responsibilities and provides stimulation and socialization for the person with dementia.
- Varies by: fixed

**Timeline:** No information available

**Watch out for:**
- Not statewide—restricted to Mineral County residents only.
- Requires formal diagnosis of Alzheimer’s or related dementia.
- Limited information available on application process, processing times, or required documents; families should contact provider directly.

**Data shape:** County-restricted to Mineral County; no financial eligibility tests mentioned; fixed benefit of up to 16 hours/week respite care.

**Source:** https://wvaging.com/fair/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| West Virginia Medicaid Personal Care Ser | benefit | state | deep |
| Aged and Disabled Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| LIEAP (Low Income Energy Assistance Prog | benefit | federal | medium |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| SHIP (State Health Insurance Assistance  | resource | federal | simple |
| Caregiver/Respite Support | benefit | local | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| West Virginia Senior Legal Aid (WVSLA) | resource | state | simple |
| Long-Term Care Ombudsman | resource | federal | simple |
| Lighthouse Program | benefit | state | deep |
| Aging Well, Safe at Home Initiative: WV  | benefit | state | deep |
| Take Me Home, West Virginia Program | benefit | state | deep |
| FAIR (Family Alzheimer's In-Home Respite | benefit | local | medium |

**Types:** {"benefit":11,"resource":3,"employment":1}
**Scopes:** {"state":6,"local":3,"federal":6}
**Complexity:** {"deep":10,"medium":2,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/WV/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **not_applicable**: 5 programs
- **program_tier**: 1 programs
- **region**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **West Virginia Medicaid Personal Care Services Program**: Entitlement (no waitlist); hours scale by assessed personal care needs/medical necessity tier; requires prior Medicaid eligibility + separate medical assessment; statewide with RN-supervised in-home services
- **Aged and Disabled Waiver**: Financial eligibility via Medicaid standards (SSI/DHHR), no fixed income table; tiered by NFLOC with 5 deficits; statewide but county DHHR offices handle finances; funded slots create waitlist variability.
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited WV-specific data; not statewide, only at select providers/centers; no income/asset tests detailed; eligibility tied to service area and state nursing home certification; expansion advocated but not confirmed as of sources[3][9]
- **Medicare Savings Programs (QMB, SLMB, QI)**: Medicare Savings Programs are tiered by income level: QMB (lowest income, most comprehensive benefits), SLMB (middle income, Part B premium only), QI (higher income, Part B premium only). Income limits are pegged to Federal Poverty Level and reset annually on April 1. West Virginia uses 135% FPL as the maximum eligibility threshold across all programs[4]. All three programs share the same asset limits. Eligibility and benefits vary significantly by program tier but not by region within West Virginia based on available information. QI has a first-come, first-served funding model, making it distinct from QMB and SLMB.
- **LIEAP (Low Income Energy Assistance Program) & LIHEAP-RRP (Repair and Replace Program)**: LIEAP benefits scale by household size and heating costs; income limits vary by household size. LIHEAP-RRP has strict household composition requirements (must include vulnerable individual) in addition to income limits. Both programs are federally funded with annual variations. LIEAP operates on a seasonal window (winter months); LIHEAP-RRP operates year-round but with limited annual funding (~$6M). Application methods differ: LIEAP can be applied for online or in-person; LIHEAP-RRP must go through local Community Action Agencies.
- **Weatherization Assistance Program (WAP)**: Administered county-by-county via local community action agencies; waitlist with priority tiers (elderly 60+ get points); income at exactly 200% FPG with prior-year gross proof and exclusions; building eligibility required.
- **SHIP (State Health Insurance Assistance Program)**: no income test; counseling-only service, not benefits-paying; delivered via statewide network of senior centers with central phone line
- **Caregiver/Respite Support**: Highly fragmented by county/local providers; no statewide elderly caregiver respite with uniform eligibility/benefits; Medicaid waivers target IDD not general elderly; access via 55+ Area Agencies on Aging centers.
- **Senior Community Service Employment Program (SCSEP)**: Grantee-based by county clusters (not uniform statewide); priority enrollment tiers; no fixed income table or asset test in sources—income verified locally against current 125% FPL
- **West Virginia Senior Legal Aid (WVSLA)**: No income or asset tests for entry; services tiered by vulnerability/priority rather than strict financial cutoffs; senior must self-initiate contact.
- **Long-Term Care Ombudsman**: no income/asset test; advocacy only for long-term care facility residents; 9 regional structure with county-specific ombudsmen; free/confidential for residents/families/anyone concerned
- **Lighthouse Program**: State-funded, county-administered via local aging agencies; sliding fee (not asset-tested); up to 60 hours/month capped by need/availability; targets Medicaid-ineligible seniors with functional needs.
- **Aging Well, Safe at Home Initiative: WV BoSS Home Modification and Accessibility Program**: no income test; eligibility hinges on age 60+ and demonstrated need only; administered via statewide ADRC with central mail/phone application[1][6]
- **Take Me Home, West Virginia Program**: Tied to Medicaid MFP grant; eligibility hinges on institutional stay duration and Medicaid status rather than age/income/assets directly; services person-centered via field staff statewide.
- **FAIR (Family Alzheimer's In-Home Respite)**: County-restricted to Mineral County; no financial eligibility tests mentioned; fixed benefit of up to 16 hours/week respite care.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in West Virginia?
