# Alaska Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 1.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 14 |
| New (not in our data) | 11 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 6 programs
- **financial**: 5 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI, QDWI)

- **income_limit**: Ours says `$1500` → Source says `$1,350` ([source](https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premium (if applicable), Part B premium ($202.90 in 2026), deductibles, coinsurance, copayments[1][2][5]. SLMB: Part B premium only ($202.90)[1][2]. QI: Part B premium only ($202.90); limited funding[1][2]. QDWI: Part A premium only[1][2][3]. QMB/SLMB/QI auto-qualify for Extra Help with Rx drugs[2].` ([source](https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/))
- **source_url**: Ours says `MISSING` → Source says `https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/`

### Alaska Legal Services Corporation (ALSC) Senior Legal Services

- **income_limit**: Ours says `$2500` → Source says `$24,438` ([source](https://www.alsc-law.org/elder-advocacy/))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Legal assistance and advice; representation in court and administrative hearings; referrals; community education and training via clinics and outreach. Specific areas: Income maintenance (Alaska Senior Assistance Program, Social Security, SSI, Adult Public Assistance, Food Stamps); housing (landlord/tenant, public housing, assisted living, nursing homes); health care (Medicaid, Medicare, Long-Term Care, PCA); advance directives (power of attorney, living wills, testamentary wills); consumer issues (debt collection, predatory lending, deceptive practices, utility cutoffs). No fixed dollar amounts or hours specified.` ([source](https://www.alsc-law.org/elder-advocacy/))
- **source_url**: Ours says `MISSING` → Source says `https://www.alsc-law.org/elder-advocacy/`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://akoltco.org))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Identify, investigate, and resolve complaints; provide information on long-term services and supports; represent interests before agencies; seek remedies; regular facility visits and monitoring; educate on resident rights; support family/resident councils; community outreach and training[3][4][6][7]` ([source](https://akoltco.org))
- **source_url**: Ours says `MISSING` → Source says `https://akoltco.org`

## New Programs (Not in Our Data)

- **DenaliCare** — service ([source](https://health.alaska.gov/ (Medicaid/DenaliCare section); ARIES portal for applications))
  - Shape notes: Alaska residency and NFLOC functional test required; asset/income limits strict for singles but spousal protections exist; benefits via HCBS waivers or nursing home, assessed case-by-case; regional offices handle intake
- **Adults with Physical & Developmental Disabilities Waiver (APDD)** — service ([source](https://health.alaska.gov/en/services/hcbs-waivers/))
  - Shape notes: Requires dual eligibility: Medicaid financial + developmental disability with NFLOC; services individualized via SDS IDD Unit assessment; access via regional care coordinators rather than centralized form; distinguishes from ALI (no developmental disability req.)[1][7]
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.cms.gov/medicare/medicaid-coordination/about/pace[8]))
  - Shape notes: No programs in Alaska; eligibility not tied to income/assets but strictly to NFLOC certification and service area availability at limited centers nationwide
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/))
  - Shape notes: Elderly/disabled: net income only (100% FPL), higher asset limit ($4,500), ESAP simplifies recert; benefits/deductions scale by household size; Alaska-specific standard/shelter deductions; statewide uniform.
- **Heating Assistance Program (HAP)** — financial ([source](https://health.alaska.gov (Alaska Department of Health administers the program); applications also available through State of Alaska Public Assistance offices))
  - Shape notes: HAP uses a point-based system rather than simple income thresholds, making eligibility determination complex and region-specific. Benefits are not a fixed dollar amount but vary significantly by household size, location, fuel type, and dwelling type. Application deadlines and processing vary by provider (state vs. tribal organizations). For elderly applicants specifically, some regions (THRHA) accept applications from disabled or 60+ individuals starting November 1, while general public applications begin December 1[2]. The program operates seasonally (typically October/November through April/June depending on region), not year-round.
- **Weatherization Assistance Program** — service ([source](https://www.ahfc.us/efficiency/weatherization))
  - Shape notes: Decentralized by local grantees with region-specific providers, forms, and slight income variations; 15-year repeat ban statewide; priority tiers drive service allocation; automatic eligibility via other aid programs.
- **Alaska Meals on Wheels** — in_kind ([source](Alaska Department of Health (health.alaska.gov); Meals on Wheels America (mealsonwheelsamerica.org); Local Area Agency on Aging))
  - Shape notes: Alaska Meals on Wheels is a decentralized system with multiple regional providers rather than a single statewide program. Eligibility is primarily age-based (60+) with no income limits, but geographic service area is the primary limiting factor. Benefits are service-based (meals) rather than financial. Regional variations are significant—different providers operate in Southeast Alaska, Anchorage, the Matanuska-Susitna Valley, and rural areas, each with potentially different eligibility criteria, application processes, and service levels. The program serves both congregate (group meal sites) and home-delivered meal models, with different requirements for each. No specific dollar amounts or hours are standardized statewide.
- **Alzheimer's Family Caregiver Support Program** — service ([source](http://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx))
  - Shape notes: Split into CSRCP (Alzheimer's-specific with income/asset tests) and NFCSP (broader family caregiver support); local grantees/providers handle delivery with regional variations; no fixed dollar/hour caps on respite.
- **Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)** — employment ([source](https://labor.state.ak.us/ (Alaska Department of Labor and Workforce Development); https://serrc.org/masst/))
  - Shape notes: This program's structure is defined by federal policy (Title V of the Older Americans Act) with state administration. The 48-month durational limit is a critical constraint that families must understand. Income eligibility is tied to federal poverty guidelines updated annually. The program emphasizes transition to unsubsidized employment rather than ongoing subsidized work. Specific application procedures, contact information, processing timelines, and regional office locations are not detailed in publicly available sources reviewed; families should contact the Alaska Department of Labor and Workforce Development or SERRC directly for current application details.
- **Alaska Senior Benefits Program** — financial ([source](https://dhss.alaska.gov/dpa/Pages/sbp/default.aspx))
  - Shape notes: Three-tiered payments scaled by gross income brackets and household size; no asset test; funding-dependent amounts; annual FPL-tied limit adjustments
- **Adult Public Assistance (APA) Program** — financial ([source](https://health.alaska.gov/dpa))
  - Shape notes: Needs-based cash assistance (no fixed payment table); SSI-aligned disability/age rules; resource caps fixed by household type (individual/couple); local DPA offices handle intake statewide

## Program Details

### DenaliCare

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For a single nursing home applicant in 2026: under $2,982 per month. Limits vary by marital status, program (Nursing Home Medicaid, HCBS Waivers, ABD Medicaid), and whether spouse is applying; no full household size table available in sources[1][2].
- Assets: For a single applicant: $2,000 or less in countable assets. Countable assets typically include bank accounts, stocks, bonds (non-exempt); exemptions often include primary home (under equity limits), one vehicle, personal belongings, burial plots—specific exemptions vary and require state assessment[1][2].
- Alaska residency
- Nursing Facility Level of Care (NFLOC): need for full-time care based on evaluation of Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (IADLs: cleaning, cooking, shopping, paying bills), plus cognitive/behavioral issues[1][2]

**Benefits:** Home and Community Based Services (HCBS) Waivers, Nursing Home care, Aged/Blind/Disabled (ABD) Medicaid long-term care services; specific services include those meeting NFLOC needs (e.g., personal care, home modifications if unable to live safely at home without); no fixed dollar amounts or hours specified[1][2].
- Varies by: priority_tier

**How to apply:**
- Online: Alaska’s Resource for Integrated Eligibility Services (ARIES) Self-Service Portal
- Phone: Virtual Contact Center at 800-478-7778
- Mail/In-person: Submit Application for Services to Division of Public Assistance Office; contact Division of Senior and Disability Services or local Aging and Disability Resource Center (ADRC) for assistance[2]

**Timeline:** Not specified in sources

**Watch out for:**
- DenaliCare for elderly long-term care is distinct from Denali KidCare (for children/pregnant women); financial eligibility varies by program and marital status—spousal impoverishment rules may apply; NFLOC required, not just age/low income; ways to qualify if over limits via planning, but consult experts[1][2][4]
- Processing/application may vary by specific program (e.g., HCBS vs. Nursing Home)

**Data shape:** Alaska residency and NFLOC functional test required; asset/income limits strict for singles but spousal protections exist; benefits via HCBS waivers or nursing home, assessed case-by-case; regional offices handle intake

**Source:** https://health.alaska.gov/ (Medicaid/DenaliCare section); ARIES portal for applications

---

### Adults with Physical & Developmental Disabilities Waiver (APDD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must meet Alaska Medicaid income and resource limits set by the Division of Public Assistance (DPA). Specific dollar amounts not detailed in sources for APDD; for comparison, ALI Waiver (similar program) allows up to $2,901/month per applicant in 2025, regardless of marital status or household size[1][2].
- Assets: Must meet Alaska Medicaid resource limits determined by DPA interview and application. Specific asset details, what counts, or exemptions not specified for APDD in sources[1].
- Diagnosed developmental disability (e.g., autism, intellectual disability, or developmental disability)[1][4][9]
- Assessed by SDS Intellectual and Developmental Disabilities Unit as needing nursing facility level of care (NFLOC)[1][7]
- Financially eligible for Medicaid[1][7]
- Alaska resident[2][4]

**Benefits:** Home and community-based services (HCBS) as an alternative to nursing facility or group home care, including medical/supportive services to allow living at home, in assisted living, or group homes. Specific services, dollar amounts, or hours not detailed; individualized based on assessment[1][4][7].
- Varies by: priority_tier

**How to apply:**
- Contact a care coordinator for assistance (regional contacts vary, e.g., Southeast Alaska ADRC in Juneau: 907-523-4428 or Ketchikan)[5][7][8]
- SDS Intake and Assessment Unit or SDS Intellectual and Developmental Disabilities Unit for assessment[1]
- Division of Public Assistance (DPA) for Medicaid financial eligibility interview/application[1]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may exist due to waiver nature but no details provided.

**Watch out for:**
- Requires both developmental disability diagnosis AND nursing facility level of care (NFLOC) assessment—not just age or physical needs[1][4][9]
- Must pursue Medicaid financial eligibility separately via DPA; applying over limits leads to denial[1][2]
- Not for elderly without developmental disabilities (compare to ALI Waiver for 65+ or physical disability 21-64)[2][4][7]
- Assessment done in-home by coordinator; get letter confirming eligibility[5][8]
- Provider certification variances may affect service availability (e.g., residential supported living)[3]

**Data shape:** Requires dual eligibility: Medicaid financial + developmental disability with NFLOC; services individualized via SDS IDD Unit assessment; access via regional care coordinators rather than centralized form; distinguishes from ALI (no developmental disability req.)[1][7]

**Source:** https://health.alaska.gov/en/services/hcbs-waivers/

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial requirements; no income or asset limits apply. Medicaid eligibility not required, though most participants are dual-eligible for Medicare and Medicaid[1][2][3].
- Assets: No asset limits; no financial criteria considered for eligibility[2][3].
- Live in the service area of a PACE organization (no PACE programs currently operate in Alaska)
- Certified by Alaska as meeting Nursing Facility Level of Care (NFLOC) requirements
- Able to live safely in the community (home or assisted living) with PACE services
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare Part D, or hospice
- Enrollment is voluntary and limited to available PACE service areas[1][2][3][6][9]

**Benefits:** Comprehensive medical and social services including primary care, hospitalization, prescription drugs, social services, restorative therapies, transportation, personal care, respite care, and all care from PACE interdisciplinary team with no deductibles or copays for enrollees. Covers needs equivalent to nursing home level but delivered in community[1][2][8].
- Varies by: region

**How to apply:**
- Contact local PACE organization (none in Alaska), state Medicaid office, or Medicare at 1-800-633-4227[1]
- No specific Alaska application details available as program not offered

**Timeline:** Enrollment effective first day of month after signed agreement received; varies by program[7].
**Waitlist:** Common due to limited geographic availability; many areas have waitlists[1].

**Watch out for:**
- No PACE programs available in Alaska, making it inaccessible regardless of eligibility[1]
- Geographic service area is the biggest barrier; nearby programs may have waitlists[1]
- Must use only PACE providers; cannot see outside doctors or caregivers[1]
- If not Medicaid-eligible, private pay premiums for long-term care portion average $4,000-$5,000/month[1]
- Irrevocable once enrolled; continues until death, even if needs change[7]

**Data shape:** No programs in Alaska; eligibility not tied to income/assets but strictly to NFLOC certification and service area availability at limited centers nationwide

**Source:** https://www.cms.gov/medicare/medicaid-coordination/about/pace[8]

---

### Medicare Savings Programs (QMB, SLMB, QI, QDWI)


**Eligibility:**
- Income: Alaska has higher limits than the 48 contiguous states. Federal base for 2026 (all states except AK/HI): QMB individual $1,350/month ($1,824 couple); SLMB individual $1,620/month ($2,189 couple); QI individual $1,823/month ($2,460 couple); QDWI individual $3,396/month ($4,586 couple). Alaska-specific: QMB individual $1,683/month ($2,275 couple); other programs higher proportionally. Includes $20 general income disregard. Limits from federal charts apply with AK adjustment; some sources note states like AK may disregard more[2][4][5]. DB101 AK cites QMB at 100% FPG (~$1,663 individual annually adjusted)[7]. Exact monthly limits vary annually; contact state for 2026 AK table.
- Assets: QMB/SLMB/QI: $9,950 individual, $14,910 couple (some older AK data $9,660/$14,470)[1][4][5][7]. QDWI: $4,000 individual, $6,000 couple[1][7]. Counts typical countable resources (bank accounts, stocks); exempts home, one car, burial plots, life insurance (up to limits), personal belongings. Alaska may have liberalized rules or no resource test in some cases[4].
- Must be enrolled in or eligible for Medicare Part A (except QDWI focuses on those who lost premium-free Part A due to work)
- QMB: Income <100% FPL
- SLMB: Income 100-120% FPL
- QI: Income 120-135% FPL; cannot receive if qualify for Medicaid; limited funds, first-come first-served, priority to prior recipients[2]
- QDWI: Under 65, have disability, working, lost premium-free Part A[1][3]

**Benefits:** QMB: Medicare Part A premium (if applicable), Part B premium ($202.90 in 2026), deductibles, coinsurance, copayments[1][2][5]. SLMB: Part B premium only ($202.90)[1][2]. QI: Part B premium only ($202.90); limited funding[1][2]. QDWI: Part A premium only[1][2][3]. QMB/SLMB/QI auto-qualify for Extra Help with Rx drugs[2].
- Varies by: program_tier

**How to apply:**
- Contact Alaska Department of Health local medical assistance office[2][9]
- Apply through state Medicaid program[3][5]
- Phone: State-specific (call 1-800-MEDICARE for state contact or Alaska Health Dept.)[6]
- Online/mail/in-person: Via Alaska Medicaid application (no specific URL/form named in results; use health.alaska.gov for Medicare help page)[9]

**Timeline:** Not specified in sources; state-determined[5]
**Waitlist:** QI: First-come, first-served until funds exhausted; priority to previous recipients[2]

**Watch out for:**
- Alaska limits higher than federal base; confirm exact 2026 figures with state as they adjust annually and may disregard more[2][4][5]
- QI has limited funding—apply early; no QI if eligible for Medicaid[2]
- QDWI only for under 65 disabled workers who lost free Part A[1][3]
- Auto Extra Help with Rx but must apply separately if needed[2]
- Resources exclude home/car but count most financial assets; states like AK may waive resource test[4]

**Data shape:** Higher income/resource limits in Alaska; tiered by program (QMB/SLMB/QI/QDWI) with QI funding-capped; benefits are premium payments only (no service hours); eligibility tied to Medicare enrollment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific age requirement for SNAP, but special rules apply for elderly (60+) or disabled households. Most households must have gross income <130% FPL; elderly/disabled households only need to meet net income limit of 100% FPL. For Oct 1, 2025–Sep 30, 2026 (Alaska-adjusted): 1 person gross ~$2,510/mo (130% FPL), net ~$1,932/mo (100% FPL); 2 people gross ~$3,407/mo, net ~$2,622/mo. Seniors (60+) qualify more easily with 2025 examples: $15,060/yr ($1,255/mo) for 1, $20,440/yr ($1,703/mo) for 2 (likely net). Deductions include 20% earned income, standard $358 (1-5 people)/$374 (6+), dependent care, medical >$35 for elderly/disabled, shelter/utility ≤$1,189.[2][3][4][5]
- Assets: Resource test applies: $3,000 limit for most households; $4,500 if household has disabled member or person 60+. Exempt: home & lot, household goods, burial plots, life insurance cash value, retirement/pension accounts, income-producing property, 529 plans, vehicles used for exempt purpose or equity <$1,500.[2]
- Alaska resident.
- U.S. citizen, national, or qualified non-citizen.
- All household members need SSN or proof of application.
- Household = people who live together, buy/prepare food together (parents + kids ≤21 count as one).
- Able-bodied 16-59 must register for work, participate in E&T if offered, accept jobs, not quit (ABAWDs 18-54 limited to 3 months/36 unless working/E&T ≥20 hrs/wk; elderly/disabled exempt).
- ESAP for households all adults 60+ or disabled: 36-month certification, no interim report, no recert interview unless issues. Report changes: no longer elderly/disabled, adult starts work, lottery/gambling ≥$4,500.[1][2][4][6]

**Benefits:** Monthly EBT card for purchasing eligible food (groceries, not hot/prepared foods/alcohol/tobacco). Amount based on income, household size, deductions (exact $ varies; e.g., max benefits scale by size, reduced by net income).[2]
- Varies by: household_size

**How to apply:**
- Online: Division of Public Assistance webpage (health.alaska.gov/dpa).
- Phone: Virtual Contact Center 800-478-7778.
- In-person: Local Division of Public Assistance office.
- Mail: Not specified, but changes via secure upload or form.

**Timeline:** Not specified in sources; expedited for urgent cases possible federally.

**Watch out for:**
- Elderly/disabled households skip gross income test, only net matters—many miss higher medical/shelter deductions.[2][5]
- ESAP (Dec 2024–Nov 2029) eases recert for 60+/disabled households but must report key changes promptly.[1]
- Assets exempt are broad (home, retirement, low-equity vehicles), but countable assets like cash over limit disqualify.[2]
- Work rules tightened (e.g., 55-64 may need 80 hrs/mo unless exempt); veterans no longer auto-exempt.[6][7]
- Household definition includes food-sharers; minors need independence to apply alone.[2]
- No BBCE in Alaska—strict federal tests unless all on TANF/SSI.[8]

**Data shape:** Elderly/disabled: net income only (100% FPL), higher asset limit ($4,500), ESAP simplifies recert; benefits/deductions scale by household size; Alaska-specific standard/shelter deductions; statewide uniform.

**Source:** https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/

---

### Heating Assistance Program (HAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross monthly income must be at or below 150% of the federal poverty income guidelines[1]. Specific dollar amounts vary by household size. Example from one regional provider: 1 person = $1,735/month, 2 people = $2,323/month, 3 people = $2,911/month, 4 people = $3,499/month, 5 people = $4,087/month, 6 people = $6,924/month, plus $877 for each additional household member[6]. Note: Income limits are set at 150% of Alaska poverty guidelines, which may differ from federal poverty guidelines[2].
- Assets: There is no asset limit for LIHEAP/HAP in Alaska[5].
- Household must have at least $200 in out-of-pocket heating costs each year[1]
- Applicant must live in the home to qualify[4][6]
- Benefit eligibility also depends on a point system that considers: area of state, primary heating fuel type, dwelling type, and household size[1][4][6]. Low heating cost points after all factors are calculated may result in ineligibility[4][6]
- If living in subsidized housing and paying for heat, applicant may qualify; if receiving a utility allowance, benefit will be reduced[4]

**Benefits:** One-time payment directly to utility vendor(s) for heating costs. Specific dollar amount varies and is not stated in search results; amount is determined by household income, household size, vendor type, housing type, and geographic location[2]
- Varies by: household_size, region, heating fuel type, dwelling type, income

**How to apply:**
- In-person at any Public Assistance office[1][6]
- Mail or fax to: Heating Assistance Program, 400 Willoughby, Suite 301, Juneau, AK 99801-1700[6]
- Drop-box at local offices[4]
- Online application (available but specific URL not provided in search results)[1]
- WIC offices[1]
- Senior centers[1]
- Email: liheap@alaska.gov[1]
- Through tribal organizations (for enrolled tribal citizens in communities served by tribal organizations)[2]

**Timeline:** All complete LIHEAP applications will be processed within 45 days[2]

**Watch out for:**
- Eligibility is NOT based solely on income — a point system also factors in heating fuel type, dwelling type, household size, and geographic location. Even if income-eligible, applicants with low heating cost points may not qualify[1][4][6]
- Minimum $200 annual out-of-pocket heating cost requirement — households with lower heating costs may not qualify[1][3]
- Applicant must physically live in the home; absentee owners or non-residents do not qualify[4][6]
- If receiving a utility allowance (e.g., in subsidized housing), the HAP benefit will be reduced[4]
- Tribal citizens in communities served by tribal organizations MUST apply through their tribal organization, not the State. Applying through the wrong entity delays benefits[2]
- All income must be documented with proof; applications without proof are considered incomplete and will be denied[4]
- Bank statements alone are not acceptable proof of income; pay stubs, award letters, or employer statements are required[4]
- Heating assistance is typically available only in fall and winter; cooling assistance is not offered in Alaska[5]
- Crisis assistance is available only for emergencies (broken furnace, utility shutoff notice, running out of fuel), not for regular heating costs[5]
- Program dates and application deadlines vary by provider and region; funding is limited and some agencies may stop accepting applications early if funds run out[5]

**Data shape:** HAP uses a point-based system rather than simple income thresholds, making eligibility determination complex and region-specific. Benefits are not a fixed dollar amount but vary significantly by household size, location, fuel type, and dwelling type. Application deadlines and processing vary by provider (state vs. tribal organizations). For elderly applicants specifically, some regions (THRHA) accept applications from disabled or 60+ individuals starting November 1, while general public applications begin December 1[2]. The program operates seasonally (typically October/November through April/June depending on region), not year-round.

**Source:** https://health.alaska.gov (Alaska Department of Health administers the program); applications also available through State of Alaska Public Assistance offices

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Federal funding (as of 4/10/2025, statewide): 1 person $39,100; 2 $52,860; 3 $66,620; 4 $80,380; 5 $94,140; 6 $107,900; 7 $121,660; 8 $135,420. Limited state funding has slightly higher limits. Income is gross for previous 12 months, adjusted annually by household size (all occupants count). Automatic eligibility if received LIHEAP, SSI, ATAP, TANF, APA/IA, Food Stamps, or Senior Benefits in last year. Must be below 100% area median income per AHFC/DOE guidelines.[2][6][1]
- Assets: No asset limits mentioned in program guidelines.[1][2][6]
- Homeowners and renters eligible (landlord approval required for renters).[2][4][6]
- Home cannot have received weatherization services in last 15 years (some regions specify since 9/30/1993).[3][6][8]
- Priority to elderly (55+), disabled, families with children under 6, Native American households, and highest need.[1][5]
- For state-designated regional housing authority homes, contact authority directly.[4]
- In Anchorage: Up-to-date on municipal taxes, home not in foreclosure or actively for sale/rent.[8]

**Benefits:** Free energy efficiency and health/safety upgrades: caulking/weatherstripping, advanced air sealing, furnace efficiency modifications (e.g., burner replacement, ignition systems replacing pilot lights), programmable thermostats, insulation, furnace/hot water heater replacement, door/window repairs/replacement, whole-house ventilation, moisture control, smoke/CO detectors, fire extinguishers. No fixed dollar amount; services at no cost to qualified applicants, limited by federal/state spending.[1][3][6][8]
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization service provider by region (e.g., Fairbanks Senior Center, RurAL CAP in Anchorage, Alaska CDC in Palmer area, Cook Inlet Housing Authority, Association of Alaska Housing Authorities).[2][3][4][5][6][7]
- Online applications available from some providers (e.g., Alaska CDC).[7]
- Phone: Varies by provider (e.g., Municipality of Anchorage Dept. of Neighborhoods: 343-4881; Alaska CDC for mail requests).[7][8]
- Mail: Available through some providers (e.g., Alaska CDC).[7]
- In-person: Provider offices (e.g., Anchorage: 557 E. Fireweed Lane Suite D; Alaska CDC: 1517 S. Industrial Way #8, Palmer).[7][8]

**Timeline:** 2-6 weeks in Anchorage; varies by region and provider.[8]
**Waitlist:** Generally no waitlist, but check with provider for updates (e.g., Anchorage: call 343-4881).[8]

**Watch out for:**
- Home ineligible if weatherized in last 15 years by any grantee.[3][6]
- Renters need landlord approval, which owners can refuse.[6][8]
- Priority categories (elderly 55+, disabled, young children) get preference; not first-come.[1][5]
- Income includes all household occupants; automatic qualifiers still need proof.[2][5][7]
- Regional providers required—cannot apply centrally; check AHFC for your area.[4]
- Limited state funding has higher limits but is restricted.[6]

**Data shape:** Decentralized by local grantees with region-specific providers, forms, and slight income variations; 15-year repeat ban statewide; priority tiers drive service allocation; automatic eligibility via other aid programs.

**Source:** https://www.ahfc.us/efficiency/weatherization

---

### Alaska Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits. Income is not a factor in determining eligibility for most Alaska programs.[5] Some programs may adjust fees based on financial ability, but this does not affect qualification.[1]
- Assets: Not specified in available sources.
- Must be homebound or have mobility challenges that make it difficult to shop for food, prepare meals, or socialize.[1][3]
- For home-delivered meals specifically: must be unable to travel to a congregate site due to being bedridden, residing in an area without congregate meals, or having Activities of Daily Living (ADL) or Instrumental Activities of Daily Living (IADL) limitations.[2]
- Must reside within a program's designated delivery zone.[1]
- Spouses of eligible individuals may qualify.[2]
- Individuals with disabilities residing with an eligible individual may qualify.[2]

**Benefits:** Home-delivered hot meals with frozen meals for weekends and holidays. Each meal contains one-third of required daily nutritional allowances.[5] Congregate meal sites provide hot nutritious lunch with social interaction opportunities.[5]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (specific contact varies by region)[1]
- For Anchorage/Salvation Army program: Phone (907) 349-0613, contact Donna Bagley, Program Director[5]
- In-person at meal sites (complete client profile)[5]
- Referral from doctor or social worker may be required by some providers[3]

**Timeline:** Varies by program. Some process applications within one week; others take longer if there is a waiting list.[1]
**Waitlist:** Possible depending on program and region. Not universally specified.[1]

**Watch out for:**
- No universal statewide program: Alaska Meals on Wheels is administered through multiple local providers and Area Agencies on Aging. There is no single state program, so eligibility criteria, services, and application processes vary significantly by region.[1][2][5][8]
- Geographic service gaps: Not all areas of Alaska are covered. Seniors outside designated delivery zones must seek alternative programs.[1]
- Income is not a barrier, but location is: Even low-income seniors may not qualify if they live outside a service area.[1]
- Home-delivered meals require functional assessment: Unlike congregate meals, home-delivered meals typically require ADL/IADL scores demonstrating inability to travel to a meal site. Inclement weather may qualify individuals for occasional home delivery without these scores.[2]
- No income limits means no means-tested disqualification: However, some programs may charge fees on a sliding scale based on ability to pay, though this does not affect eligibility.[1][5]
- Waiting lists possible: Processing times vary, and some programs may have waiting lists, particularly in high-demand areas.[1]
- Spouse and dependent eligibility varies: While some programs serve spouses and dependents, this is not universal across all Alaska providers.[2]

**Data shape:** Alaska Meals on Wheels is a decentralized system with multiple regional providers rather than a single statewide program. Eligibility is primarily age-based (60+) with no income limits, but geographic service area is the primary limiting factor. Benefits are service-based (meals) rather than financial. Regional variations are significant—different providers operate in Southeast Alaska, Anchorage, the Matanuska-Susitna Valley, and rural areas, each with potentially different eligibility criteria, application processes, and service levels. The program serves both congregate (group meal sites) and home-delivered meal models, with different requirements for each. No specific dollar amounts or hours are standardized statewide.

**Source:** Alaska Department of Health (health.alaska.gov); Meals on Wheels America (mealsonwheelsamerica.org); Local Area Agency on Aging

---

### Alzheimer's Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income and asset limits apply to the care recipient for CSRCP (specific dollar amounts not listed in sources; care manager determines based on reported monthly income of care recipient and spousal income).[1]
- Assets: Asset limits apply to the care recipient for CSRCP (details on what counts/exempts not specified; includes wages, interest, dividends, net rental, Veteran's benefits, other recurring payments).[1]
- Care recipient must have a formal diagnosis of Alzheimer's disease or a related dementia (CSRCP).[1]
- Caregiver must be providing unpaid care (CSRCP and NFCSP).[1]
- For NFCSP: Care recipient 60+ or with Alzheimer's/related disorder (any age); or caregiver 60+ caring for adult child with disability; or grandparents/older relatives (55+) raising grandchildren.[1][2][3]

**Benefits:** Respite care (adult day and in-home options, no cap on services); information and assistance; individual counseling, support groups, caregiver training; limited supplemental services (e.g., transportation, home modifications); educational materials, referrals for Alzheimer's/dementia.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Fillable application form available at https://www.aoascc.org/Customer-Content/www/CMS/files/Caregiver_Support_Services_Application-Fillable_Combined_2025_05_19.pdf (Alaska Older Adults Senior Community Center, likely regional).[1]
- Contact local grantees of Alaska Department of Health and Social Services, Division of Senior and Disabilities Services (phone not specified in results; general senior line 800-478-7778).[1][3][5]
- Access via Home & Community Based Senior Grants website (http://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx).[2]

**Timeline:** Not specified

**Watch out for:**
- Two related programs: CSRCP (diagnosis + financial test required) vs. broader NFCSP (age-based, no diagnosis needed for general caregivers).[1]
- Financial eligibility only for CSRCP; NFCSP has no income test mentioned.[1][3]
- Proof of formal Alzheimer's/dementia diagnosis mandatory for CSRCP—people miss bringing physician documentation.[1]
- Services local via grantees, so availability varies by region despite statewide admin.[3]

**Data shape:** Split into CSRCP (Alzheimer's-specific with income/asset tests) and NFCSP (broader family caregiver support); local grantees/providers handle delivery with regional variations; no fixed dollar/hour caps on respite.

**Source:** http://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx

---

### Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[3]. Specific dollar amounts vary by household size and are updated annually by the federal government; current 2026 amounts are not provided in available sources.
- Assets: Not specified in available sources
- Must be unemployed[2][3]
- Must have poor employment prospects[2][3]
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, low literacy skills, limited English proficiency, rural residents, homeless or at-risk individuals, and those who have exhausted American Job Center services[3]

**Benefits:** Part-time paid work averaging 20 hours per week at the highest of federal, state, or local minimum wage[3]; job skills training, job search training, and placement assistance into unsubsidized employment[1]; work experience for resume, on-the-job training in computer or vocational skills, and professional job placement assistance[5]
- Varies by: fixed

**How to apply:**
- Contact SERRC (Southeast Alaska Regional Resource Center) or regional coordinators for MASST placements[1]
- Access through Alaska Job Center Network (AJCN) / American Job Centers[3][4]
- Specific phone numbers, URLs, and mail addresses are not provided in available sources

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- 48-month lifetime participation limit with no waivers or exceptions[2] — participants must transition to unsubsidized employment before this limit expires
- Income limit is 125% of federal poverty level, which is relatively restrictive[3]
- Program is part-time (average 20 hours/week), not full-time employment[1][3]
- Participants must be actively seeking unsubsidized employment; the program is designed as a bridge, not permanent employment[3][6]
- Placement is made with non-profits, governmental agencies, or Native organizations[1] — not private sector employers directly

**Data shape:** This program's structure is defined by federal policy (Title V of the Older Americans Act) with state administration. The 48-month durational limit is a critical constraint that families must understand. Income eligibility is tied to federal poverty guidelines updated annually. The program emphasizes transition to unsubsidized employment rather than ongoing subsidized work. Specific application procedures, contact information, processing timelines, and regional office locations are not detailed in publicly available sources reviewed; families should contact the Alaska Department of Labor and Workforce Development or SERRC directly for current application details.

**Source:** https://labor.state.ak.us/ (Alaska Department of Labor and Workforce Development); https://serrc.org/masst/

---

### Alaska Legal Services Corporation (ALSC) Senior Legal Services


**Eligibility:**
- Age: 60+
- Income: For seniors (60+), assistance may be provided without regard to income, with priority to those in social or economic need. General ALSC guideline is at or below 125% Federal Poverty Guidelines for Alaska: Household Size 1: Yearly $24,438 / Monthly $2,037 / Weekly $470; 2: $33,038 / $2,753 / $635; 3: $41,638 / $3,470 / $801; 4: $50,238 / $4,187 / $966; 5: $58,838 / $4,903 / $1,132; 6: $67,438 / $5,620 / $1,297; 7: $76,038 / $6,337 / $1,462; 8: $84,638 / $7,053 / $1,628; Each additional: $8,600 / $717 / $165. Incomes above may qualify in certain circumstances.
- Assets: Assets are considered in eligibility screening (gross household assets requested in intake), based on federal poverty guidelines available upon request. Specific limits, countable assets, and exemptions not detailed publicly.
- Alaska resident
- Civil legal issue matching program priorities (e.g., income maintenance, housing, health care, advance directives, consumer issues)
- No conflicts of interest
- Case must align with office priorities

**Benefits:** Legal assistance and advice; representation in court and administrative hearings; referrals; community education and training via clinics and outreach. Specific areas: Income maintenance (Alaska Senior Assistance Program, Social Security, SSI, Adult Public Assistance, Food Stamps); housing (landlord/tenant, public housing, assisted living, nursing homes); health care (Medicaid, Medicare, Long-Term Care, PCA); advance directives (power of attorney, living wills, testamentary wills); consumer issues (debt collection, predatory lending, deceptive practices, utility cutoffs). No fixed dollar amounts or hours specified.
- Varies by: priority_tier

**How to apply:**
- Online: https://www.alsc-law.org/intake/ (Online Eligibility Interview)
- Phone: Toll-free statewide intake line 1-888-478-2572
- Mail/In-person: Paper application at nearest ALSC office (available in English, Samoan, Tagalog, Spanish, German, Russian)
- Legal clinics via https://www.alsc-law.org/ (check calendar)

**Timeline:** Intake specialist contacts within two business days after online interview; full case acceptance varies due to resources and priorities.
**Waitlist:** Not mentioned; limited resources mean not all cases accepted.

**Watch out for:**
- Not all applicants accepted due to limited resources and case priorities; no guarantee from intake
- General ALSC exclusions: personal injury, accidents, wrongful death
- Income/assets screened preliminarily but fully evaluated later; seniors prioritized but income may still factor
- Conflicts of interest lead to referrals elsewhere
- Check legal clinics first for quicker help

**Data shape:** Seniors 60+ often income-disregarded with priority to need; office-specific priorities; no fixed asset details or wait times published; statewide but regionally prioritized cases

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.alsc-law.org/elder-advocacy/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Income: No income limits; program is free advocacy service open to anyone with concerns[7][6][4]
- Assets: No asset limits; no financial eligibility requirements[7][6]
- Residing in a long-term care facility (assisted living or nursing home) in Alaska, or age 60+ with issues related to residential circumstances in own home; made by or on behalf of the individual[7][4][6]

**Benefits:** Identify, investigate, and resolve complaints; provide information on long-term services and supports; represent interests before agencies; seek remedies; regular facility visits and monitoring; educate on resident rights; support family/resident councils; community outreach and training[3][4][6][7]

**How to apply:**
- Phone: 1-800-6393 (M-F 8:00 a.m. to 4:30 p.m. for intakes)[5]
- Website: https://akoltco.org (for information and volunteer opportunities, contact via site)[7]

**Timeline:** Complaints investigated promptly; no formal application processing time as it's a direct service request[3][4]

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy and complaint resolution; no eligibility barriers but must involve long-term care facility or home residential issues for 60+; families can contact on behalf of loved one; ombudsmen are confidential and independent[3][4][7]
- Program resolves complaints, does not provide direct care or funding[6]
- Authorized for at-home issues only related to 'residential circumstances' for 60+, not general home care[4][7]

**Data shape:** no income test; free advocacy service for complaints in LTC facilities or home residential issues for 60+; statewide with volunteers; not an entitlement program with applications or waitlists

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://akoltco.org

---

### Alaska Senior Benefits Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Gross annual income limits (effective 7/1/2024 for payments, adjusted annually based on Alaska Federal Poverty Guidelines). Tiers for monthly payments: For individual - $250 tier: ≤$14,108; $175 tier: $14,109-$25,540 (or up to $44,695 max depending on updates); $125 tier: higher brackets up to $44,695 ($3,725/month). For couple/household of 2 - $250 tier: ≤$18,480; $175 tier: $18,481-$24,640; $125 tier: up to $43,120 ($3,594/month). Limits increase with household size and change yearly (e.g., April 1 updates for FPL). Full table varies by year; check current via application.[4][5][6]
- Assets: No asset or resource limits; assets such as savings are not counted.[3][5]
- Alaska resident intending to remain (voluntary residency, not absent 30+ consecutive days)
- U.S. citizen or qualified legal alien
- Social Security Number or proof of application
- Age 65 or older (spouse must also be 65+ if applying jointly)
- Not receiving heating assistance from tribal organizations if applicable to related programs

**Benefits:** Monthly cash payments in three tiers: $250, $175, or $125 based on gross annual income bracket and household size. Amounts can be reduced (e.g., highest tier to $76 in past due to funding) based on state legislative funding availability.[4][5][6][7]
- Varies by: household_size|priority_tier

**How to apply:**
- Mail or in-person: Local Division of Public Assistance office (find via dhss.alaska.gov/dpa/)
- Form download: Gen 152 (Senior Benefits Application, rev 01/20 or current) from dhss.alaska.gov/dpa/[4]
- Phone: Contact local DPA office (statewide info: 1-800-478-7778 or regional offices via dhss.alaska.gov/dpa/)[1][3]
- No online application specified; submit via mail/in-person

**Timeline:** Not specified in sources

**Watch out for:**
- Payment amounts not fixed; can be reduced based on state funding and applicant numbers (e.g., $250 tier cut to $76 historically)[5][6]
- Gross income used (before taxes, Medicare premiums); limits change annually (April/July updates)[4][5][6]
- Must report changes (address, income, absence 30+ days, institutionalization) or risk loss[4]
- Spouse must be 65+ for joint application; no assets test but residency intent strictly enforced[3][4]
- Cannot combine with certain tribal heating assistance[1]

**Data shape:** Three-tiered payments scaled by gross income brackets and household size; no asset test; funding-dependent amounts; annual FPL-tied limit adjustments

**Source:** https://dhss.alaska.gov/dpa/Pages/sbp/default.aspx

---

### Adult Public Assistance (APA) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Varies based on individual needs; if age 65 or older and monthly income is less than the SSI need standard, must apply for SSI first. Exact dollar amounts not specified in sources and determined case-by-case[1][3][7].
- Assets: Resources must not exceed $2,000 for an individual or $3,000 for a couple. Low resources required, aligned with SSI standards; specific counts/exemptions not detailed[1][3].
- U.S. citizen, Native American born in Canada or Mexico with border crossing rights, or qualified alien[1]
- For under 65: blind or disabled meeting Social Security Administration standards (severe physical/mental disability lasting at least 1 year, life-threatening, preventing Substantial Gainful Activity)[1][3]
- Age 65 or older (no disability required)[1][3]
- Alaska resident[6]
- Must seek all other benefits (e.g., SSI, unemployment, worker’s compensation, disability)[3]

**Benefits:** Monthly cash payments to help pay for basic needs; amount varies based on individual income/needs (specific dollar amounts not listed). Automatically qualifies recipient for Medicaid health coverage[1][2].
- Varies by: individual_needs

**How to apply:**
- In person or by mail to any Division of Public Assistance (DPA) office[1][3]
- By email to hss.dpa.offices@alaska.gov[1]
- Fill out DPA Application for Services (paper form available as PDF on Division of Public Assistance website); submit by mail, fax, email, or drop off at DPA office[3][4]
- Call Virtual Contact Center at 800-478-7778 (TDD/Alaska Relay: 7-1-1) to apply over the phone[5]
- Find local DPA office via Alaska 211: 1-800-478-2221[3]
- DPA website: https://health.alaska.gov/dpa[3][4][5]

**Timeline:** Not specified; interview required before eligibility determination[4]. SNAP (related program) processed within 30 days or 7 days expedited[3].
**Waitlist:** Interim Assistance available: monthly cash payment for financially eligible applicants waiting for SSI decision[4]. Otherwise null.

**Watch out for:**
- Most APA qualifiers also qualify for SSI; if 65+ with income below SSI standard, must apply for SSI first[1][7]
- Disability must meet strict Social Security standards (not just any disability)[1][2]
- Must pursue all other benefits first, or risk denial[3]
- Automatic Medicaid, but separate apps may be needed for other DPA programs like SNAP[1][5]
- Resources capped low ($2k individual/$3k couple); income test is needs-based, not fixed table[3]
- Interview required; written application mandatory[3][4]

**Data shape:** Needs-based cash assistance (no fixed payment table); SSI-aligned disability/age rules; resource caps fixed by household type (individual/couple); local DPA offices handle intake statewide

**Source:** https://health.alaska.gov/dpa

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| DenaliCare | benefit | state | deep |
| Adults with Physical & Developmental Dis | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Heating Assistance Program (HAP) | benefit | state | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Alaska Meals on Wheels | benefit | federal | medium |
| Alzheimer's Family Caregiver Support Pro | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Alaska Legal Services Corporation (ALSC) | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Alaska Senior Benefits Program | benefit | state | deep |
| Adult Public Assistance (APA) Program | benefit | state | medium |

**Types:** {"benefit":11,"employment":1,"resource":2}
**Scopes:** {"state":7,"local":1,"federal":6}
**Complexity:** {"deep":10,"medium":2,"simple":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/AK/drafts.json`.

- **DenaliCare** (benefit) — 4 content sections, 6 FAQs
- **Adults with Physical & Developmental Disabilities Waiver (APDD)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size, region, heating fuel type, dwelling type, income**: 1 programs
- **fixed**: 1 programs
- **not_applicable**: 1 programs
- **household_size|priority_tier**: 1 programs
- **individual_needs**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **DenaliCare**: Alaska residency and NFLOC functional test required; asset/income limits strict for singles but spousal protections exist; benefits via HCBS waivers or nursing home, assessed case-by-case; regional offices handle intake
- **Adults with Physical & Developmental Disabilities Waiver (APDD)**: Requires dual eligibility: Medicaid financial + developmental disability with NFLOC; services individualized via SDS IDD Unit assessment; access via regional care coordinators rather than centralized form; distinguishes from ALI (no developmental disability req.)[1][7]
- **Program of All-Inclusive Care for the Elderly (PACE)**: No programs in Alaska; eligibility not tied to income/assets but strictly to NFLOC certification and service area availability at limited centers nationwide
- **Medicare Savings Programs (QMB, SLMB, QI, QDWI)**: Higher income/resource limits in Alaska; tiered by program (QMB/SLMB/QI/QDWI) with QI funding-capped; benefits are premium payments only (no service hours); eligibility tied to Medicare enrollment
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled: net income only (100% FPL), higher asset limit ($4,500), ESAP simplifies recert; benefits/deductions scale by household size; Alaska-specific standard/shelter deductions; statewide uniform.
- **Heating Assistance Program (HAP)**: HAP uses a point-based system rather than simple income thresholds, making eligibility determination complex and region-specific. Benefits are not a fixed dollar amount but vary significantly by household size, location, fuel type, and dwelling type. Application deadlines and processing vary by provider (state vs. tribal organizations). For elderly applicants specifically, some regions (THRHA) accept applications from disabled or 60+ individuals starting November 1, while general public applications begin December 1[2]. The program operates seasonally (typically October/November through April/June depending on region), not year-round.
- **Weatherization Assistance Program**: Decentralized by local grantees with region-specific providers, forms, and slight income variations; 15-year repeat ban statewide; priority tiers drive service allocation; automatic eligibility via other aid programs.
- **Alaska Meals on Wheels**: Alaska Meals on Wheels is a decentralized system with multiple regional providers rather than a single statewide program. Eligibility is primarily age-based (60+) with no income limits, but geographic service area is the primary limiting factor. Benefits are service-based (meals) rather than financial. Regional variations are significant—different providers operate in Southeast Alaska, Anchorage, the Matanuska-Susitna Valley, and rural areas, each with potentially different eligibility criteria, application processes, and service levels. The program serves both congregate (group meal sites) and home-delivered meal models, with different requirements for each. No specific dollar amounts or hours are standardized statewide.
- **Alzheimer's Family Caregiver Support Program**: Split into CSRCP (Alzheimer's-specific with income/asset tests) and NFCSP (broader family caregiver support); local grantees/providers handle delivery with regional variations; no fixed dollar/hour caps on respite.
- **Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)**: This program's structure is defined by federal policy (Title V of the Older Americans Act) with state administration. The 48-month durational limit is a critical constraint that families must understand. Income eligibility is tied to federal poverty guidelines updated annually. The program emphasizes transition to unsubsidized employment rather than ongoing subsidized work. Specific application procedures, contact information, processing timelines, and regional office locations are not detailed in publicly available sources reviewed; families should contact the Alaska Department of Labor and Workforce Development or SERRC directly for current application details.
- **Alaska Legal Services Corporation (ALSC) Senior Legal Services**: Seniors 60+ often income-disregarded with priority to need; office-specific priorities; no fixed asset details or wait times published; statewide but regionally prioritized cases
- **Long-Term Care Ombudsman Program**: no income test; free advocacy service for complaints in LTC facilities or home residential issues for 60+; statewide with volunteers; not an entitlement program with applications or waitlists
- **Alaska Senior Benefits Program**: Three-tiered payments scaled by gross income brackets and household size; no asset test; funding-dependent amounts; annual FPL-tied limit adjustments
- **Adult Public Assistance (APA) Program**: Needs-based cash assistance (no fixed payment table); SSI-aligned disability/age rules; resource caps fixed by household type (individual/couple); local DPA offices handle intake statewide

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Alaska?
