# West Virginia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 51s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 13 |
| New (not in our data) | 8 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 4 programs
- **service**: 6 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **advocacy|service**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,325` ([source](https://bms.wv.gov (WV Bureau for Medical Services); form at dhhr.wv.gov/bcf/policy/imm[3][9]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `- **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible/coinsurance/copays; providers cannot bill beneficiary for Medicare-covered services (acts like Medigap); auto-qualifies for Extra Help (Part D low-income subsidy, ≤$12.65 copay/drug in 2026)[1][2][5].
- **SLMB**: Pays Part B premiums only[1][2].
- **QI**: Pays Part B premiums only[1][2].
Saves hundreds/thousands annually depending on utilization[1].` ([source](https://bms.wv.gov (WV Bureau for Medical Services); form at dhhr.wv.gov/bcf/policy/imm[3][9]))
- **source_url**: Ours says `MISSING` → Source says `https://bms.wv.gov (WV Bureau for Medical Services); form at dhhr.wv.gov/bcf/policy/imm[3][9]`

### West Virginia Aged and Disabled Waiver (ADW)

- **min_age**: Ours says `65` → Source says `18` ([source](https://bms.wv.gov))
- **income_limit**: Ours says `$2901` → Source says `$209` ([source](https://bms.wv.gov))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Person-centered home and community-based services (e.g., personal attendant, agency direct-care, case management, RN visits) equivalent to nursing home care, promoting independence. Specific services ordered by physician; not for household convenience.` ([source](https://bms.wv.gov))
- **source_url**: Ours says `MISSING` → Source says `https://bms.wv.gov`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://dhhr.wv.gov/bcf/Pages/SNAP.aspx or https://wvpath.wv.gov))
- **income_limit**: Ours says `$1922` → Source says `$2608` ([source](https://dhhr.wv.gov/bcf/Pages/SNAP.aspx or https://wvpath.wv.gov))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases (average $188/month for older adults; exact amount based on income, household size, deductions). Benefits only for food for human consumption, seeds/plants. Certification period: 24 months for households with 60+ or disabled members (vs. 12 months for others).[3][8]` ([source](https://dhhr.wv.gov/bcf/Pages/SNAP.aspx or https://wvpath.wv.gov))
- **source_url**: Ours says `MISSING` → Source says `https://dhhr.wv.gov/bcf/Pages/SNAP.aspx or https://wvpath.wv.gov`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigating and resolving complaints about health, safety, welfare, and rights; routine unannounced facility visits to monitor care; providing information and referral services on long-term care options; representing residents to government agencies; educating on rights; training volunteers. All services are free and confidential.` ([source](https://legalaidwv.org/our-programs/long-term-care/))
- **source_url**: Ours says `MISSING` → Source says `https://legalaidwv.org/our-programs/long-term-care/`

### West Virginia Senior Legal Aid

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.seniorlegalaid.org))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free civil legal services. Specific services include legal advice, legal advocacy, and representation in court proceedings. No fee charged for any services.[4]` ([source](https://www.seniorlegalaid.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.seniorlegalaid.org`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE) - Not specifically named in WV sources** — service ([source](https://paceyourlifemwv.com/ (West Virginia PACE provider); https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE (federal overview)[6][8]))
  - Shape notes: Limited to specific service areas with one known WV provider (PACE Your Life); no income/asset test for enrollment but Medicaid status affects cost; requires state NFLOC certification; potential waitlists and regional capacity limits
- **LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://bfa.wv.gov/utility-assistance/lieap or https://dhhr.wv.gov/bcf/Services/familyassistance/Pages/default.aspx))
  - Shape notes: Income at 60% state median (examples scale by household size, +$567/additional); exclusions vary by period (e.g., SS/Vet income); seasonal with early application critical due to limited funding; local offices handle intake with regional processing variations
- **Weatherization Assistance Program (WAP)** — service ([source](https://wvcad.org/sustainability/weatherization-assistance-program))
  - Shape notes: Administered via county-specific Community Action Agencies; waitlist with priority tiers (elderly/disabled/children/high energy); income table scales by household size at 200% FPG; building eligibility required.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.wvship.org[3][4][9]))
  - Shape notes: no income/asset test; counseling only, delivered via statewide network of county senior centers; prioritizes limited-income Medicare beneficiaries but open to all[1][3][5]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: Multiple regional grantees with county-specific coverage and contact points; income test at 125% FPL; priority tiers affect access; part-time training only via nonprofit/public host sites
- **Legal Aid for Seniors (e.g., Lighthouse Program elements)** — service ([source](https://wvaging.com/lighthouse/))
  - Shape notes: Statewide via 55 county senior centers; sliding fee scale (no fixed income table published); medically tiered by RN ADL assessment; hours capped at 60/month with service area limits; not true legal aid but in-home care for seniors ineligible for Medicaid.
- **Lighthouse Program** — service ([source](http://www.wvseniorservices.gov (West Virginia Bureau of Senior Services)[3]))
  - Shape notes: State-funded program delivered uniformly via 140+ local county senior centers; no strict income/asset caps but sliding fee scale; medically tiered by RN-assessed ADL needs; hours capped at 60/month with environmental services limited to 1/3
- **FAIR (Family Alzheimer's In-Home Respite)** — financial ([source](https://www.wvfairplan.com[5]))
  - Shape notes: No Alzheimer's respite program found; all data pertains to property insurance FAIR Plan. Eligibility based on insurability/fire standards, not income/age/health. Agent-mediated applications only.

## Program Details

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be entitled to Medicare Part A (or eligible for premium-free Part A). Income limits are monthly and apply as follows (using most consistent WV-specific figures from 2023-2026 sources; limits adjust annually ~April 1 based on Federal Poverty Level):
- **QMB**: ≤ $1,325 single / $1,783 married (or ≤100% FPL)[2][3][7]
- **SLMB**: >QMB limit up to $1,565-$1,585 single / $2,135 married[2][3]
- **QI**: >SLMB limit up to $1,781 single / $2,400 married[2]
No variation by household size beyond single/couple; states follow federal standards but WV uses these[1][2].
- Assets: Total countable resources: $9,660 individual / $14,470 married couple (federal limits used in WV; consistent across QMB/SLMB/QI)[2][3]. Countable: cash, checking/savings accounts, stocks, bonds, annuities, CDs[3]. Exempt: typically primary home, one vehicle, personal belongings, burial plots (standard Medicaid exemptions apply; WV follows federal)[1][2].
- Must be enrolled in (or eligible for) Medicare Part A and Part B[1][2][5].
- U.S. citizen or qualified immigrant[1].
- Reside in West Virginia[2].
- Not eligible for full Medicaid (QI specifically excludes full Medicaid recipients)[2][6].

**Benefits:** - **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible/coinsurance/copays; providers cannot bill beneficiary for Medicare-covered services (acts like Medigap); auto-qualifies for Extra Help (Part D low-income subsidy, ≤$12.65 copay/drug in 2026)[1][2][5].
- **SLMB**: Pays Part B premiums only[1][2].
- **QI**: Pays Part B premiums only[1][2].
Saves hundreds/thousands annually depending on utilization[1].
- Varies by: priority_tier

**How to apply:**
- Mail or in-person: Submit DFA-QSQ-1 form to local WV DHHR/BMS office (find via state site)[3][9].
- Phone: Contact WV Bureau for Medical Services at (800) 642-8589 or local worker[3].
- Online: Through WV DHHR ACCESS WV portal (dhhr.wv.gov/bcf) or BMS site[2].

**Timeline:** Effective first day of month of application if eligible; typically 45 days max but often faster[1].
**Waitlist:** QI may have waitlist or funding caps (federal limit on QI slots; apply early)[1][6].

**Watch out for:**
- Income/asset limits change annually (check current via BMS; figures here from 2023-2026 sources may need update)[1][2][5].
- QMB providers cannot bill you, but confirm with 'QMB' status on Medicaid card; report billing violations[1][5].
- QI has limited federal funding/waitlist—higher priority for earliest applicants[1][6].
- Automatic Extra Help with QMB but not always SLMB/QI—apply separately if needed[1][5].
- Married couples: Combined income/assets; living arrangements matter (e.g., separate households may qualify separately)[2].
- Not for Medicare Advantage—applies to Original Medicare only[6].

**Data shape:** Tiered by income brackets (QMB <100% FPL, SLMB 100-120% FPL, QI 120-135% FPL); single/couple only (no larger household multipliers); federal asset caps with WV adoption; QI funding-capped

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://bms.wv.gov (WV Bureau for Medical Services); form at dhhr.wv.gov/bcf/policy/imm[3][9]

---

### West Virginia Aged and Disabled Waiver (ADW)


**Eligibility:**
- Age: 18+
- Income: Must meet Medicaid Waiver financial eligibility criteria as determined by DHHR county office or SSA for SSI recipients. Specific dollar amounts not listed in sources; may qualify via Medically Needy Program if medical costs reduce income to $209/month remaining. No household size table provided.
- Assets: Home equity interest no greater than $730,000 (2025 limit). Exemptions: applicant lives in home or intends to return; spouse or dependent relative (child, grandchild, parent, aunt/uncle, sibling, niece/nephew) lives in home.
- West Virginia permanent resident.
- Nursing Facility Level of Care (NFLOC): 5 functional deficits via Pre-Admission Screening (PAS) by registered nurse (e.g., ADLs like bathing/dressing, bedsores, emergency evacuation, skilled needs, medication self-administration).
- Choose home/community-based services over nursing home.
- Safe environment for staff.
- Not solely for Medicaid eligibility or ancillary services like housekeeping/transportation.
- Enrollment dependent on funded slot availability.

**Benefits:** Person-centered home and community-based services (e.g., personal attendant, agency direct-care, case management, RN visits) equivalent to nursing home care, promoting independence. Specific services ordered by physician; not for household convenience.
- Varies by: priority_tier

**How to apply:**
- Physician completes Medical Necessity Evaluation Request (MNER) form, sends to KEPRO.
- Submit MNER and KEPRO letter to local DHHR office for financial eligibility.
- In-person: Local DHHR county office; Bureau of Senior Services.
- Online: inRoads portal via Bureau for Medical Services DHHR.
- Case Management Agency assistance available.

**Timeline:** Case manager contacts within 5 days after KEPRO notification; medical eligibility after financial confirmation (no specific overall timeline).
**Waitlist:** Enrollment dependent on availability of funded ADW slot.

**Watch out for:**
- Must have exactly 5 functional deficits for NFLOC; dementia diagnosis alone insufficient.
- Home equity limit $730,000 (2025); exemptions narrow.
- Financial eligibility first, then medical; no medical assessment without yellow DHS-2.
- Slot availability limits enrollment (waitlist risk).
- Not for sole purpose of Medicaid eligibility or minor services.
- Must provide safe environment for providers.

**Data shape:** Enrollment capped by funded slots; two-step process (financial then medical); physician-ordered services; person-centered with NFLOC via PAS assessment.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://bms.wv.gov

---

### Program of All-Inclusive Care for the Elderly (PACE) - Not specifically named in WV sources

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment; no financial criteria required. Free for those qualifying for Medicare and Medicaid or Medicaid only. Non-Medicaid eligible pay a flat monthly fee (amount not specified in sources). West Virginia Medicaid nursing home level generally requires income under $2,982/month for singles in 2026, but PACE does not impose this as a barrier to enrollment[7][8].
- Assets: No asset limits or financial criteria for PACE eligibility[2][3].
- Live in the service area of a PACE organization (specific to West Virginia PACE provider)
- Certified by West Virginia as requiring Nursing Home Level of Care (NHLOC)
- Able to live safely in the community with PACE services
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice

**Benefits:** Comprehensive, coordinated care including primary medical care, in-home and outpatient therapy, adult day care and health center, scheduled transportation, assistance with meals and nutrition. All PACE-provided services covered without deductibles or co-pays once enrolled. Exact hours or dollar amounts not specified[1][2][8].
- Varies by: region

**How to apply:**
- Contact PACE Your Life MWV via email at info@paceyourlifemwv.com or visit their website https://paceyourlifemwv.com/ for eligibility and enrollment details[8]
- General: Find local PACE via National PACE Association or Medicare tools, then contact specific provider[2][4]

**Timeline:** Not specified in sources
**Waitlist:** Possible waitlists due to capped federal/state funding, varying by program and state[5]

**Watch out for:**
- Not available statewide in West Virginia; must live in specific service area near PACE center
- Requires Nursing Home Level of Care certification by West Virginia, which involves functional assessment
- Possible waitlists due to funding caps
- Private pay monthly fee if not Medicaid-eligible (amount not listed; contact provider)
- Cannot be enrolled in Medicare Advantage, Part D, or hospice
- Must be able to live safely in community with PACE help at enrollment

**Data shape:** Limited to specific service areas with one known WV provider (PACE Your Life); no income/asset test for enrollment but Medicaid status affects cost; requires state NFLOC certification; potential waitlists and regional capacity limits

**Source:** https://paceyourlifemwv.com/ (West Virginia PACE provider); https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE (federal overview)[6][8]

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For Oct. 1, 2025 through Sept. 30, 2026, most households must meet a gross income limit of 200% of the federal poverty level: 1 person $2608/month, 2 people $3526/month, 3 people $4442/month, 4 people $5358/month, 5 people $6276/month, 6 people $7192/month, 7 people $8108/month, each additional +$916/month. Households with a member 60+ or disabled are exempt from the gross income test and only need to meet the net income test (gross minus deductions like medical expenses over $35/month for elderly/disabled, shelter costs, utilities). If gross income exceeds 200% FPL, must also meet asset test under federal rules ($4500 limit).[1][3]
- Assets: No asset limit for most households in West Virginia (home and vehicles exempt). Households with a member 60+ or disabled who exceed gross income limit must meet federal asset limit of $4500 in countable resources (e.g., bank accounts; excludes home, vehicles, retirement savings in some cases).[1]
- West Virginia resident
- U.S. citizen or qualified non-citizen
- Social Security number (or applied for one)
- Work requirements for able-bodied adults without dependents (ABAWDs) unless exempt (e.g., 60+, disabled, caring for child under 14 or disabled adult)
- Net income test for elderly/disabled households

**Benefits:** Monthly EBT card benefits for food purchases (average $188/month for older adults; exact amount based on income, household size, deductions). Benefits only for food for human consumption, seeds/plants. Certification period: 24 months for households with 60+ or disabled members (vs. 12 months for others).[3][8]
- Varies by: household_size

**How to apply:**
- Online: West Virginia DHHR benefits portal (wvpath.wv.gov)
- Phone: Local county DHHR office or statewide inquiry line (1-877-716-1212)
- Mail: Send application to local DHHR office
- In-person: Local county DHHR office

**Timeline:** Typically 30 days; expedited for urgent cases

**Watch out for:**
- Elderly/disabled households skip gross income test but must meet net income; many miss high medical/shelter deductions that lower net income
- WV expanded eligibility beyond federal standards (no asset limit for most); other sites may show stricter rules
- Social Security, veterans/disability benefits count as income
- Must include all who buy/prepare food together in household
- 24-month certification for elderly/disabled requires less frequent recertification but still report changes

**Data shape:** Benefits and gross income limits scale by household size; elderly/disabled exempt from gross income and asset tests (use net only or federal asset if over gross); statewide with county offices; high deductions for medical/shelter key for seniors

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhr.wv.gov/bcf/Pages/SNAP.aspx or https://wvpath.wv.gov

---

### LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income at or below 60% of West Virginia state median income (or equivalently 130% of Federal Poverty Guidelines in some sources). Example limits for FY2022: 1-person: $1,884; 2-person: $2,464; 3-person: $3,043; 4-person: $3,620; add $567 per additional person. Income from month of application; some exclusions apply (e.g., Social Security, Veterans income excluded for current period; SNAP benefits, student loans, CSEP). Household includes all at address sharing utility bill. Must be responsible for heating costs and meet vulnerability factors for regular component.
- Assets: No asset limits mentioned.
- U.S. citizen or qualified non-citizen
- West Virginia resident
- Responsible for paying home heating/cooling bill
- For crisis: immediate energy emergency (e.g., shutoff, broken heater)
- Automatic eligibility if enrolled in SNAP, TANF, or SSI Code A

**Benefits:** One-time direct cash payment or payment to utility/vendor for heating/cooling costs. Regular and crisis components; maximum benefits vary by income, household size, fuel type (specific max amounts not listed in sources; funding limited). Crisis for emergencies like shutoffs or fuel depletion.
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://www.wvpath.wv.gov/
- Phone: 1-800-642-8589 (toll-free)
- In-person/mail: Local DHHR/DoHS field offices, Community Action Agencies, Senior Centers

**Timeline:** Within 30 days of receipt or program open date (whichever later)
**Waitlist:** No waitlist; funding limited and exhausts—apply early as benefits stop when funds run out

**Watch out for:**
- Funding fixed annually and runs out—apply early in season (heating: fall/winter; cooling: summer; crisis: emergencies only)
- Household includes all sharing address/utility bill (unlike SNAP)
- Income based strictly on application month; some income excluded but countable income must not exceed max
- Program not year-round; closes when funds deplete—no applications accepted after
- Must reapply each year; prior approval doesn't carry over
- Crisis requires DHHR worker evaluation for emergency

**Data shape:** Income at 60% state median (examples scale by household size, +$567/additional); exclusions vary by period (e.g., SS/Vet income); seasonal with early application critical due to limited funding; local offices handle intake with regional processing variations

**Source:** https://bfa.wv.gov/utility-assistance/lieap or https://dhhr.wv.gov/bcf/Services/familyassistance/Pages/default.aspx

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income must be ≤200% of Federal Poverty Guidelines (effective April 8, 2025): 1: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300; +$11,000 per additional member. Based on gross cash receipts before taxes from prior tax year(s); excludes child support, tax refunds, scholarships, etc.[1]
- Assets: No asset limits mentioned.[1][2]
- West Virginia resident.[1]
- Dwelling must meet building eligibility (structurally adaptable for weatherization).[1][2]
- Priority on waitlist for households with elderly (60+), disabled, children (≤18), high energy burden, or high energy use.[1]

**Benefits:** Energy conservation measures including air sealing, insulation, heat/cool tune-ups, health/safety repairs to reduce heating/cooling costs and improve home safety/comfort. No fixed dollar amount or hours; services based on audit and funding availability.[1][2][7]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA) serving your county (in-person, phone, or mail application).[1][2][7]
- Online application available statewide.[7]
- Specific: MountainHeart (Wyoming/Fayette): Call 304-682-8271 ext. 101 (Angela Beaver) or ext. 117 (Gerald Brown), or visit 33 MountainHeart Lane, Matheny WV 24860.[7]
- CASEWV serves certain areas (check casewv.org).[3]

**Timeline:** Eligibility determination after application (income verification time-consuming); then placed on waitlist for audit/services. No fixed timeline specified.[2]
**Waitlist:** Yes, all eligible applicants placed on waitlist; prioritized by points for high energy burden/use, elderly (60+), disabled, children.[1]

**Watch out for:**
- Income based on prior full tax year gross cash income (verification time-consuming).[1][2]
- Dwelling must qualify structurally; not all homes eligible.[1]
- Renters need landlord permission first.[2]
- Waitlist prioritization favors elderly/disabled/children/high energy needs—not first-come.[1]
- Funding limited (e.g., $4.3M for 2024-2025); services depend on federal appropriations.[1]
- Separate from DHHR Repair/Replacement Program (60% SMI, for heating repairs).[3]

**Data shape:** Administered via county-specific Community Action Agencies; waitlist with priority tiers (elderly/disabled/children/high energy); income table scales by household size at 200% FPG; building eligibility required.

**Source:** https://wvcad.org/sustainability/weatherization-assistance-program

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries[1][2]
- Assets: No asset limits or tests[1]
- Must be a Medicare beneficiary (age 65+ or under 65 with disabilities), their families, or caregivers[1][2][3]

**Benefits:** Free one-on-one confidential counseling, education, and assistance on Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription drug assistance, Medicaid, appeals, fraud prevention (via SMP), referrals, printed materials, group presentations, and help applying for cost-saving programs like Extra Help[1][2][3][4]

**How to apply:**
- Phone: Toll-free 877-987-4463 or local 304-558-3317 (8:30am-5:00pm ET M-F)[3][4][5][7]
- Website: https://www.wvship.org (for info, comparisons, appointments)[3][4][9]
- In-person: At WV Bureau of Senior Services (1900 Kanawha Blvd East, 3rd Floor Town Center Mall, Charleston WV 25305) or many county senior centers and Aging & Disability Resource Centers statewide[3][4][5]
- Email: rebecca.a.gouty@wv.gov[4]

**Timeline:** No formal application or processing; services provided via appointment upon contact[2][3]

**Watch out for:**
- Not a healthcare or financial aid program—provides counseling only, not direct payments or medical care[1][2]
- Free but requires contacting for appointment; no walk-ins guaranteed outside main office[3]
- Often confused with Medicare Savings Programs (which SHIP helps apply for); SHIP itself has no eligibility barriers[1]
- Services via local county centers may vary in availability by location[5]

**Data shape:** no income/asset test; counseling only, delivered via statewide network of county senior centers; prioritizes limited-income Medicare beneficiaries but open to all[1][3][5]

**Source:** https://www.wvship.org[3][4][9]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; families must contact local provider to confirm current thresholds based on federal poverty guidelines[3][4].
- Assets: No asset limits mentioned in available sources[3][4].
- Unemployed
- Low-income (≤125% FPL)
- Priority given to veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, low employment prospects, or those who failed to find employment via American Job Centers[3]

**Benefits:** Part-time community service job training (average 20 hours/week) at public/nonprofit agencies (e.g., schools, hospitals, senior centers); paid highest of federal, state, or local minimum wage; skill development, job placement assistance, annual physical exam, support services (Social Security info, tax requirements, nutrition, grooming); bridge to unsubsidized employment[1][3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: Preston County Senior Citizens, Inc. at (304) 329-0464 for Boone, Clay, Doddridge, Harrison, Kanawha, Mercer, Monongalia, Preston, Putnam, Raleigh, Taylor Counties[1]
- Contact Southwestern Community Action Council for Barbour, Braxton, Cabell, Fayette, Greenbrier, Kanawha, Lincoln, Logan, McDowell, Mercer, Mingo Counties (website: https://scacwv.org/scsep, phone not specified in results)[6]
- Human Resource Development Foundation (HRDF) for other areas (website: https://www.hrdfwv.org/senior-works.html, phone not specified)[2]
- General locator: https://my.aarpfoundation.org/locator/scsep/[8]

**Timeline:** Most participants trained for about 6 months before job placement assistance[4]
**Waitlist:** Not specified; may vary by region and funding[4]

**Watch out for:**
- Not available uniformly statewide; must confirm county-specific provider as coverage overlaps and gaps may exist[1][6]
- Income limit is 125% FPL for family size—requires verification of current federal poverty guidelines[3][4]
- Priority enrollment tiers may delay access for non-priority applicants[3]
- Temporary training (avg. 20 hrs/wk, ~6 months) aimed at unsubsidized jobs, not long-term employment[3][4]
- Funded by DOL grants to nonprofits; subject to federal funding changes/delays[4][5]

**Data shape:** Multiple regional grantees with county-specific coverage and contact points; income test at 125% FPL; priority tiers affect access; part-time training only via nonprofit/public host sites

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Legal Aid for Seniors (e.g., Lighthouse Program elements)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Financially eligible based on the LIGHTHOUSE Sliding Fee Schedule. Income may be determined by voluntary disclosure or agency estimation; no strict means test required. Specific dollar amounts not listed in sources, but designed for seniors disqualified from Medicaid by income or assets.[5][1]
- Assets: Assets that disqualify from Medicaid services exclude eligibility for Medicaid but do not impose separate asset limits for Lighthouse; focuses on those over Medicaid thresholds.[1][5]
- Medically eligible based on functional evaluation by Aging & Family Services Registered Nurse. Two needs must be identified under Activities of Daily Living (ADL) requiring 'Much Assistance' or 'Cannot Perform'.[5]
- Functional needs in the home (personal care, mobility, nutrition, housekeeping).[1][5]

**Benefits:** In-home support in four areas: Personal Care (grooming, bathing, dressing, toileting); Mobility (transferring, walking); Nutrition (meal preparation, eating, grocery/pharmacy shopping); Environment (light housekeeping, bed making/changing, client laundry). Environmental services limited to no more than 1/3 of monthly hours. Up to 60 hours per month based on RN assessment and plan of care, provided by In-Home Care Technician.[5][1]
- Varies by: priority_tier

**How to apply:**
- Contact local senior center or provider in each county (e.g., Nicholas Community Action Partnership for Nicholas County).[1]
- Call Aging & Family Services at 304-788-5467.[5]
- County senior aging programs employ caregivers and handle intake.[1]

**Timeline:** Not specified in sources.
**Waitlist:** Based on need and availability of caregivers; potential waitlist implied but not detailed.[1]

**Watch out for:**
- Not legal aid; provides in-home care services (personal care, etc.), not attorney services—user query mixes with West Virginia Senior Legal Aid (WVSLA), which is separate (age 60+, no income limits, call 1-800-229-5068).[2][4][5]
- Up to 60 hours/month only, based on RN assessment, caregiver availability, and sliding fee (may involve client cost-sharing).[1][5]
- Environmental services capped at 1/3 of hours; must have 2+ ADL needs at 'Much Assistance' or 'Cannot Perform' level.[5]
- Designed specifically for those over Medicaid income/asset limits.[1][5]

**Data shape:** Statewide via 55 county senior centers; sliding fee scale (no fixed income table published); medically tiered by RN ADL assessment; hours capped at 60/month with service area limits; not true legal aid but in-home care for seniors ineligible for Medicaid.

**Source:** https://wvaging.com/lighthouse/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to any resident, family, or concerned party regardless of income.
- Assets: No asset limits; no financial eligibility requirements apply.
- Must be a resident of a long-term care facility in West Virginia (nursing homes, assisted living facilities, residential care communities, or legally unlicensed homes), or a family member, caretaker, or concerned friend acting on behalf of such a resident.

**Benefits:** Investigating and resolving complaints about health, safety, welfare, and rights; routine unannounced facility visits to monitor care; providing information and referral services on long-term care options; representing residents to government agencies; educating on rights; training volunteers. All services are free and confidential.

**How to apply:**
- Phone: Toll-free 1-800-834-0598 (with regional extensions, e.g., ext. 3912 for Director Ed Hopple, ext. 2812 for Martinsburg); Regional offices (e.g., 304-263-8871 ext. 2812 for Martinsburg, 304-449-4755 for Director); In-person at regional offices (e.g., 301 W. Burke St., Suite B, Martinsburg, WV 25401)

**Timeline:** Complaints are investigated promptly; no fixed timeline specified, but ombudsmen address issues as they arise including on own initiative.

**Watch out for:**
- This is not a direct service provider (e.g., no healthcare, housing, or financial aid); it's purely advocacy and complaint resolution. Not for general eligibility determination but for issues in facilities. Ombudsman staff are non-attorneys. Access requires facility residency or acting on behalf of one. No entry to certain facility areas without resident consent. For health facility complaints outside ombudsman scope, use OHFLAC at (304) 558-0050.

**Data shape:** no income test; advocacy-only for long-term care facility residents; delivered via 9 regional non-attorney ombudsmen under Legal Aid WV; open to residents, families, friends without eligibility barriers.

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
- Income: Financially eligible based on a sliding fee scale determined by the individual's (and spouse's, if applicable) annual income. No fixed dollar amounts or household size table specified in sources; fee for services required per state cost share schedule. Means tests not required—income by voluntary disclosure or agency estimation.[2][3][5]
- Assets: No asset test or limits mentioned. Designed for seniors whose income or assets disqualify them from Medicaid, but program itself has no financial disqualification beyond sliding fee scale.[2][4]
- West Virginia resident[3][4][7]
- Medically eligible based on functional evaluation by the local senior program's Registered Nurse (RN). Typically requires two needs in Activities of Daily Living (ADLs) rated as 'Much Assistance' or 'Cannot Perform' on BoSS Intake Form (BIF).[1][2][3][5][6]

**Benefits:** In-home supportive services in four areas: 1) Personal Care (grooming, bathing, dressing, toileting); 2) Mobility (transferring, walking); 3) Nutrition (meal preparation, eating, grocery/pharmacy shopping); 4) Environment (light housekeeping, making/changing bed, client's laundry—limited to no more than 1/3 of monthly hours). Up to 60 hours per month, based on need, RN-assessed plan of care, and caregiver availability. Provided by in-home care technicians employed by local senior programs.[2][3][4][5]
- Varies by: priority_tier

**How to apply:**
- Contact your local county senior center/program (one in each WV county) for RN evaluation and intake[3][4]
- Call West Virginia Bureau of Senior Services toll-free: 1-877-987-3646[3]
- County-specific examples: Mason County Action Group (304) 675-2369[1]; Preston County Senior Citizens (contact via site)[2]; Nicholas Community Action Partnership (contact via site)[4]; Aging & Family Services (contact via site)[5]

**Timeline:** Not specified in sources
**Waitlist:** Services based on availability of caregivers; potential wait implied but not detailed[3][4]

**Watch out for:**
- Must pay a sliding fee based on income—not free; fee determined by state schedule[1][2][3]
- Limited to 60 hours/month max, based on need and caregiver availability—may not cover full needs[2][3][4]
- Environmental services (housekeeping) capped at 1/3 of monthly hours[5]
- Targeted at those ineligible for Medicaid/other programs; not a Medicaid waiver[4][5][6]
- Medically eligible only after RN assessment—two ADL needs typically required[5]

**Data shape:** State-funded program delivered uniformly via 140+ local county senior centers; no strict income/asset caps but sliding fee scale; medically tiered by RN-assessed ADL needs; hours capped at 60/month with environmental services limited to 1/3

**Source:** http://www.wvseniorservices.gov (West Virginia Bureau of Senior Services)[3]

---

### FAIR (Family Alzheimer's In-Home Respite)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No information found in search results; program appears unrelated to Alzheimer's respite services.
- Assets: No information found; no details on assets, exemptions, or counts.
- Search results do not describe a Family Alzheimer's In-Home Respite program in West Virginia. All results refer to the West Virginia FAIR Plan, a property insurance program for high-risk homes unable to obtain voluntary market coverage.[1][3][5]

**Benefits:** Essential property insurance: fire/lightning, wind/hail, aircraft/vehicles, smoke/explosion (up to $200,000 dwellings, $500,000 commercial). No liability or vandalism on habitational properties.[1][6]
- Varies by: property_type

**How to apply:**
- Through licensed property insurance agent/broker only. Submit WVFP 4/ACORD 64 form with photos (front/rear views). Electronic option available. Mail to FAIR Plan office.[4]

**Timeline:** Inspection ordered post-approval; timeline not specified.[1]

**Watch out for:**
- Must first attempt voluntary market insurance; requires licensed agent (no direct public application); incomplete apps rejected; no liability coverage; higher cost/less coverage than private insurance.[1][3][4]
- Not a healthcare/Alzheimer's program—user query mismatches all sources.

**Data shape:** No Alzheimer's respite program found; all data pertains to property insurance FAIR Plan. Eligibility based on insurability/fire standards, not income/age/health. Agent-mediated applications only.

**Source:** https://www.wvfairplan.com[5]

---

### West Virginia Senior Legal Aid


**Eligibility:**
- Age: 60+
- Income: No income limits for basic eligibility. However, higher levels of service (legal advice and legal advocacy) are prioritized for seniors who are low-income, minority, disabled, very rural, LGBT, or very elderly.[3]
- Assets: Not specified in available sources.
- Must be a West Virginia resident[1]
- Legal issue must be civil in nature (not criminal)[1]
- The senior age 60+ must be the one who calls to request services, not a family member or representative calling on their behalf[6]

**Benefits:** Free civil legal services. Specific services include legal advice, legal advocacy, and representation in court proceedings. No fee charged for any services.[4]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-229-5068[1][6]
- Email: info@seniorlegalaid.org (described as 'the most efficient method of initial contact')[1]
- Mail or in-person: Contact through phone/email for specific office locations

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- The senior age 60+ must personally call to request services—family members cannot call on their behalf.[6]
- This program handles civil legal matters only; it does not handle criminal cases, accidents, or personal injury issues.[1]
- No income limits exist for basic eligibility, but higher service levels are prioritized for low-income seniors and other vulnerable populations.[3] Families should not assume their income disqualifies them.
- This is a separate program from Legal Aid of West Virginia (which serves low-income residents of all ages). Seniors age 60+ should contact West Virginia Senior Legal Aid specifically, not the general Legal Aid program.[3][6]
- Specific dollar amounts, hours of service, and processing timelines are not publicly detailed in available sources—families should ask during initial contact.

**Data shape:** This program is distinguished by its age-based eligibility (60+) with no income limits for basic access, but tiered service levels based on vulnerability factors. It is statewide and serves only civil legal matters. Unlike Legal Aid of West Virginia (which requires low-income status), Senior Legal Aid prioritizes seniors based on age and vulnerability rather than income alone. Specific operational details (processing times, regional offices, service capacity) are not documented in publicly available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.seniorlegalaid.org

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Medicare Savings Programs (QMB, | benefit | federal | deep |
| West Virginia Aged and Disabled Waiver ( | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors (e.g., Lighthouse  | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Lighthouse Program | benefit | state | deep |
| FAIR (Family Alzheimer's In-Home Respite | benefit | state | medium |
| West Virginia Senior Legal Aid | resource | state | simple |

**Types:** {"benefit":8,"resource":4,"employment":1}
**Scopes:** {"federal":7,"state":5,"local":1}
**Complexity:** {"deep":8,"simple":4,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/WV/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **region**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **property_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB <100% FPL, SLMB 100-120% FPL, QI 120-135% FPL); single/couple only (no larger household multipliers); federal asset caps with WV adoption; QI funding-capped
- **West Virginia Aged and Disabled Waiver (ADW)**: Enrollment capped by funded slots; two-step process (financial then medical); physician-ordered services; person-centered with NFLOC via PAS assessment.
- **Program of All-Inclusive Care for the Elderly (PACE) - Not specifically named in WV sources**: Limited to specific service areas with one known WV provider (PACE Your Life); no income/asset test for enrollment but Medicaid status affects cost; requires state NFLOC certification; potential waitlists and regional capacity limits
- **SNAP (Supplemental Nutrition Assistance Program)**: Benefits and gross income limits scale by household size; elderly/disabled exempt from gross income and asset tests (use net only or federal asset if over gross); statewide with county offices; high deductions for medical/shelter key for seniors
- **LIHEAP (Low-Income Home Energy Assistance Program)**: Income at 60% state median (examples scale by household size, +$567/additional); exclusions vary by period (e.g., SS/Vet income); seasonal with early application critical due to limited funding; local offices handle intake with regional processing variations
- **Weatherization Assistance Program (WAP)**: Administered via county-specific Community Action Agencies; waitlist with priority tiers (elderly/disabled/children/high energy); income table scales by household size at 200% FPG; building eligibility required.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling only, delivered via statewide network of county senior centers; prioritizes limited-income Medicare beneficiaries but open to all[1][3][5]
- **Senior Community Service Employment Program (SCSEP)**: Multiple regional grantees with county-specific coverage and contact points; income test at 125% FPL; priority tiers affect access; part-time training only via nonprofit/public host sites
- **Legal Aid for Seniors (e.g., Lighthouse Program elements)**: Statewide via 55 county senior centers; sliding fee scale (no fixed income table published); medically tiered by RN ADL assessment; hours capped at 60/month with service area limits; not true legal aid but in-home care for seniors ineligible for Medicaid.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for long-term care facility residents; delivered via 9 regional non-attorney ombudsmen under Legal Aid WV; open to residents, families, friends without eligibility barriers.
- **Lighthouse Program**: State-funded program delivered uniformly via 140+ local county senior centers; no strict income/asset caps but sliding fee scale; medically tiered by RN-assessed ADL needs; hours capped at 60/month with environmental services limited to 1/3
- **FAIR (Family Alzheimer's In-Home Respite)**: No Alzheimer's respite program found; all data pertains to property insurance FAIR Plan. Eligibility based on insurability/fire standards, not income/age/health. Agent-mediated applications only.
- **West Virginia Senior Legal Aid**: This program is distinguished by its age-based eligibility (60+) with no income limits for basic access, but tiered service levels based on vulnerability factors. It is statewide and serves only civil legal matters. Unlike Legal Aid of West Virginia (which requires low-income status), Senior Legal Aid prioritizes seniors based on age and vulnerability rather than income alone. Specific operational details (processing times, regional offices, service capacity) are not documented in publicly available sources.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in West Virginia?
