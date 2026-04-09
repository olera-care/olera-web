# Hawaii Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.115 (23 calls, 11.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 21 |
| Programs deep-dived | 21 |
| New (not in our data) | 20 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 13 programs
- **financial**: 3 programs
- **in_kind**: 2 programs
- **employment**: 2 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Home and Community Services (Statewide via EOA)

- **income_limit**: Ours says `$1500` → Source says `$1,530` ([source](https://medquest.hawaii.gov/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Long-term care services in home or community settings to avoid institutionalization, including assistance at home, adult day care, community care foster family homes (CCFFH), assisted living residences (but not Expanded Adult Residential Care Homes, which are private pay only). Delivered via managed care system through one administering agency. Specific hours, dollar amounts, or per diem rates not detailed beyond CCFFH room/board from SSI (all but $75 PNA).[3]` ([source](https://medquest.hawaii.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://medquest.hawaii.gov/`

## New Programs (Not in Our Data)

- **Med-QUEST (Medicaid for seniors/disabled)** — service ([source](medquest.hawaii.gov[7]))
  - Shape notes: Med-QUEST is Hawaii's Medicaid program with multiple sub-programs (QUEST Integration, Nursing Home Medicaid, Regular Medicaid) that have different eligibility criteria. For seniors and disabled individuals, eligibility is based on age/disability status PLUS income/asset limits PLUS functional need for care. Asset limits apply only to those 65+ or disabled; they do not apply to younger adults. Long-term care requires demonstration of nursing home level of care or ADL need, not just financial qualification. Income limits are expressed as percentages of Federal Poverty Level (FPL) and vary by household size and program category.
- **Kūpuna Care Program** — service ([source](https://health.hawaii.gov (Executive Office on Aging); Hawaii Revised Statutes § 349-17))
  - Shape notes: Kupuna Care is a state/county-funded gap-filling program designed specifically for frail older adults who do NOT qualify for Medicaid but need long-term care support. It differs fundamentally from OAA Title III (federal program) by requiring demonstrated functional need and excluding those with Medicaid eligibility. The program has two distinct service delivery models: traditional service delivery or participant-directed services[2]. Eligibility determination is individualized through in-home assessment rather than formulaic income/asset limits. Regional implementation through county Area Agencies on Aging means application processes and service availability may vary by county, though statewide coordination occurs through the Executive Office on Aging.
- **Sage PLUS Program (PACE equivalent)** — service ([source](https://www.hawaiiship.org[7]))
  - Shape notes: Counseling program (SHIP/Sage PLUS), not comprehensive care like PACE; no income/asset tests specific to it; data limited and dated; statewide but service-area restricted
- **Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://medquest.hawaii.gov/content/medquest/en/members-applicants/get-started/programs.html))
  - Shape notes: Tiered by income (QMB <100% FPL, SLMB 100-120%, QI 120-135%); Hawaii has elevated income limits vs. mainland; QI funding capped first-come; benefits are premium/deductible payments, not direct services; statewide but local offices
- **SNAP (Supplemental Nutrition Assistance Program)** — financial ([source](https://humanservices.hawaii.gov/bessd/snap/))
  - Shape notes: Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); BBCE waives asset/gross tests for most; 2025 work changes impact pre-65 'gray zone' adults; statewide but rural access varies.
- **Low Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://humanservices.hawaii.gov/bessd/ (state DHS Benefit Employment & Support Services Division); island providers like https://hceoc.net/energy/liheap/, www.hcapweb.org/liheap/, https://www.hawaiianelectric.com/billing-and-payment/payment-assistance/low-income-programs/h-heap))
  - Shape notes: Administered by county/island agencies with varying application windows, methods, and intake limits; income at 150% FPG or 60% SMI; automatic qualifiers for SSI/SNAP/TANF; priority for crisis vs. non-crisis.
- **Weatherization Assistance Program** — in_kind ([source](https://labor.hawaii.gov/ocs/service-programs-index/weatherization-assistance-program/[4]))
  - Shape notes: County-specific providers with localized application processes and offices; income at fixed 200% FPG Hawaii-adjusted; automatic eligibility via TANF/SSI/LIHEAP/HUD; priority-based access with funding caps leading to waitlists; measures from state priority list varying by home type.
- **Hawaii SHIP (State Health Insurance Assistance Program)** — service ([source](https://www.hawaiiship.org[3]))
  - Shape notes: no income/asset test; counseling-only service for Medicare navigation; volunteer-delivered statewide via phone/virtual; not a benefits-paying program
- **Home-Delivered Meals (via Kūpuna Aging in Place grantees)** — service ([source](https://www.hawaiicommunityfoundation.org/strengthening/kupuna-aging-in-place (HCF KAP grants); county Elderly Affairs sites[5]))
  - Shape notes: Decentralized via HCF grantees and county providers (16 nonprofits statewide); no uniform income table or assets; eligibility/assessment via local Aging offices; Oahu-heavy examples; varies by specific nonprofit (e.g., frozen vs. hot meals, delivery frequency)
- **Caregiver Support (via Executive Office on Aging)** — service ([source](https://health.hawaii.gov/eoa/))
  - Shape notes: Administered statewide via 4 county AAAs with local contacts; no income/asset dollar limits specified; eligibility expands for special populations like grandparents 55+; distinguishes federal OAA FCSP (free/priority) from state Kupuna Care (needs/cost-share).
- **Retired Senior Volunteer Program (RSVP, related to SCSEP)** — employment ([source](https://labor.hawaii.gov/wdd/job-seekers/scsep/))
  - Shape notes: County-operated with local operators; priority tiers for enrollment; income at 125% FPL (household-based); paid training not pure volunteer; separate from unpaid RSVP programs
- **Senior Legal Helpline (via Area Agencies on Aging)** — service ([source](https://ittakesanohana.org/wp-content/uploads/2011/01/LASH-Facts-About-LASH.pdf))
  - Shape notes: no income test for seniors 60+ on hotline in priority cases; phone-based only with toll-free access for islands; tied to Legal Aid Society, not direct AAA staffing; eligibility flexible for elders vs. strict for general clients
- **Long-Term Care Ombudsman Program (LTCOP)** — advocacy ([source](https://health.hawaii.gov/eoa/home/long-term-care-ombudsman-program/))
  - Shape notes: no income/asset test; advocacy-only for LTC facility residents; volunteer-driven with statewide access but Oahu-focused staffing; not a qualification-based benefit program
- **Kahi Malama – A Place of Caring** — service ([source](https://hcoahawaii.org))
  - Shape notes: County-specific ADRC under Area Agency on Aging; no strict income/asset tests, focuses on resource coordination for Big Island residents age 60+; dual offices (Hilo/Kona) with island-wide service
- **Elderly Affairs Division (EAD) / Honolulu ADRC** — service ([source](elderlyaffairs.com (Honolulu County) and hawaiiadrc.org (statewide ADRC)))
  - Shape notes: This program's eligibility and benefits are highly individualized. There are no published income/asset limits, no published service hour maximums, and no published waitlist information. Eligibility determination requires both phone screening AND in-home assessment. Services vary by individual need rather than by tier or priority level. The program is strictly county-based, with Honolulu County served by EAD and other counties served by separate agencies. Functional impairment thresholds are specific (cognitive impairment OR 2+ ADL/IADL limitations) but application of these thresholds requires professional assessment.
- **Kaua'i Agency on Elderly Affairs** — service ([source](https://www.kauai.gov/Government/Departments-Agencies/Agency-on-Elderly-Affairs and https://kauaiadrc.org))
  - Shape notes: Kaua'i Agency on Elderly Affairs administers two distinct programs (OAA Title III and Kupuna Care) with overlapping but different eligibility criteria. Eligibility is functional-need-based rather than income-based for Kupuna Care, though income affects cost-sharing. No published income thresholds, asset limits, or specific service hour/dollar amounts are available in public sources. Application is phone-based with in-home assessment required. This is a county-restricted program with no statewide availability.
- **Transportation Friends for Kupuna (TFK)** — in_kind ([source](https://www.kanuhawaii.org/need/transportation-friends-for-kupuna/))
  - Shape notes: TFK is a volunteer-based peer support program, not a means-tested benefit program. No income/asset limits are published. Eligibility focuses on functional need (mobility/cognitive issues) and social isolation (living alone with minimal support). Services are free but dependent on volunteer availability. Program requires advance notice (1-2 weeks) and is geographically restricted to Oahu. Catholic Charities Hawaii screens and trains volunteers (age 55+) to serve clients (age 60+).
- **Senior Companion Program** — service ([source](https://humanservices.hawaii.gov/senior-companion-program/))
  - Shape notes: Dual structure: recruits low-income senior volunteers (55+/60+) with stipends to serve frail elders (60+); statewide but Oahu-centric contact; no detailed income tables or processing times; volunteer-focused eligibility dominates sources.
- **Foster Grandparent Program** — employment ([source](https://humanservices.hawaii.gov/foster-grandparent-program/[3]))
  - Shape notes: Volunteer employment program for seniors serving special needs children; income-tested with annual federal poverty-based thresholds (no fixed table in sources); statewide but Oahu-centric contact; rules dated (1990s) but site reflects federal updates (age 55+)
- **Memory Mentor Program** — service ([source](No dedicated .gov URL; primary contact via Catholic Charities Hawaiʻi (not a .gov site)))
  - Shape notes: Volunteer-driven in-home support program with minimal formal eligibility tests; no income/asset requirements specified, focused on isolation and memory loss[4]

## Program Details

### Med-QUEST (Medicaid for seniors/disabled)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, OR blind, OR disabled (any age)+
- Income: For seniors/disabled adults: Income limits vary by program category. For regular Medicaid (non-long-term care): Parents and other adults qualify with family income up to 138% of FPL[4]. For long-term care (Nursing Home Medicaid): Applicants must contribute nearly all monthly income towards care costs[5]. Specific dollar amounts for 2026 not provided in search results, but 138% FPL example: $24,826 for single person or $51,032 for family of 4 in 2025[3].
- Assets: For long-term care Medicaid: Assets under $2,000 for single person[5]. Asset limits do NOT apply to children or adults under age 65[4]. For QUEST Integration Program (age 65+, blind, or disabled): Must have 'limited income and resources'[1], but specific asset limits not detailed in search results.
- Be a Hawaii resident[1]
- Be a U.S. citizen or qualified non-citizen[1]
- For long-term care: Require Nursing Home Level of Care (NHLOC) or functional need with Activities of Daily Living (ADLs)[5]
- Meet income and asset limits for your coverage group[1]

**Benefits:** Coverage includes: nursing home care, community care foster family homes, assisted living residences, non-medical services and supports to help frail seniors live in their homes, home modifications (if unable to safely live at home without them)[5]. Specific dollar amounts or hours per week not provided in search results.
- Varies by: program_category

**How to apply:**
- Online at My Medical Benefits (mybenefits.hawaii.gov)[4][8]
- Online at Healthcare.gov (only if you don't have Medicare)[4]
- Phone: 1-877-628-5076[4]
- By mail: Download application or call eligibility office to have application mailed[4]
- Through Med-QUEST Division website (KOLEA secured online application)[7]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Asset limits apply differently by age: They apply to seniors/disabled but NOT to adults under 65[4]
- For long-term care, you must contribute 'nearly all' monthly income to care costs — this is not a simple income cutoff[5]
- Functional/medical need is required: You must demonstrate need for nursing home level of care or ADL assistance; income/assets alone don't qualify you[5]
- Multiple program categories exist (QUEST Integration, Nursing Home Medicaid, Regular Medicaid) with different eligibility rules — don't assume one category applies[1][5]
- If you think you're over income or asset limits, you should still apply — the program may have exceptions or alternative pathways[1]
- For COFA citizens, only certain groups qualify (children under 19, blind, disabled, 65+, pregnant women); working-age adults without disabilities do not qualify[2]
- The 1100B form is specifically required for those 65+, disabled, blind, or receiving SSI/Social Security — don't miss this[2]
- Search results do not provide 2026 income limit dollar amounts; families should verify current limits at mybenefits.hawaii.gov or call 1-877-628-5076

**Data shape:** Med-QUEST is Hawaii's Medicaid program with multiple sub-programs (QUEST Integration, Nursing Home Medicaid, Regular Medicaid) that have different eligibility criteria. For seniors and disabled individuals, eligibility is based on age/disability status PLUS income/asset limits PLUS functional need for care. Asset limits apply only to those 65+ or disabled; they do not apply to younger adults. Long-term care requires demonstration of nursing home level of care or ADL need, not just financial qualification. Income limits are expressed as percentages of Federal Poverty Level (FPL) and vary by household size and program category.

**Source:** medquest.hawaii.gov[7]

---

### Kūpuna Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Program uses income-based cost-sharing (sliding scale based on ability to pay) rather than hard income cutoffs for eligibility.
- Assets: Not specified in available sources.
- Must be a Hawaii resident[1]
- Must be a U.S. citizen or legal alien[3]
- Must have functional needs: frailty or limitations in Activities of Daily Living (ADLs) or Instrumental Activities of Daily Living (IADLs)[1]
- Must NOT be covered by Medicaid or other comparable government or private home- and community-based care services[1][3]
- Must NOT be residing in an institution (intermediate care facility, skilled nursing facility, adult residential care home)[3]
- Care needs must be substantiated through an in-home assessment[2]

**Benefits:** Services include: transportation, attendant care, case management, home-delivered meals, homemaker services, adult day care, and personal care services[7]. Employed caregivers can receive up to $70 per day in services (paid directly to contracted service providers, not the caregiver)[6].
- Varies by: priority_tier and individual need. Priority given to those with greatest economic or social need, at risk for institutional placement, low-income, minority, limited English proficiency, or residing in rural areas[1][7]

**How to apply:**
- Phone: Aging and Disability Resource Center (ADRC) statewide number (808) 643-2372[6]
- TTY: (808) 643-0899[6]
- Website: http://www.hawaiiadrc.org[6]
- In-person: Contact local Area Agency on Aging (varies by county)[1][2]

**Timeline:** Not specified in available sources. Program includes intake process, comprehensive in-home assessment, and written individualized support plan before authorization[2].
**Waitlist:** Some services may have waitlists[1]. Priority is given based on economic/social need and risk of institutional placement.

**Watch out for:**
- Medicaid exclusion: If the care recipient qualifies for Medicaid or other comparable government/private home- and community-based care services, they are ineligible for Kupuna Care[1][3]. This is the primary disqualifier.
- Institutional placement barrier: Cannot reside in any long-term care facility, intermediate care facility, skilled nursing facility, or adult residential care home[3][6].
- Functional needs requirement: Having low income alone is insufficient; applicant must have documented functional limitations in ADLs or IADLs substantiated through in-home assessment[1][2].
- Cost-sharing applies: Unlike OAA Title III (federal program with no cost), Kupuna Care uses income-based cost-sharing; families should expect to pay based on ability to pay[1].
- Employed caregiver program is separate: The Kupuna Caregivers Program (for employed caregivers working 30+ hours/week) is distinct from the main Kupuna Care program and has different eligibility rules[6].
- Limited funding history: As of 2018, the Kupuna Caregivers Program had only $600,000 available until June 30, 2018, suggesting funding constraints[6].
- Voluntary contributions encouraged: While services are provided, the program welcomes voluntary contributions to sustain services for others[3].

**Data shape:** Kupuna Care is a state/county-funded gap-filling program designed specifically for frail older adults who do NOT qualify for Medicaid but need long-term care support. It differs fundamentally from OAA Title III (federal program) by requiring demonstrated functional need and excluding those with Medicaid eligibility. The program has two distinct service delivery models: traditional service delivery or participant-directed services[2]. Eligibility determination is individualized through in-home assessment rather than formulaic income/asset limits. Regional implementation through county Area Agencies on Aging means application processes and service availability may vary by county, though statewide coordination occurs through the Executive Office on Aging.

**Source:** https://health.hawaii.gov (Executive Office on Aging); Hawaii Revised Statutes § 349-17

---

### Sage PLUS Program (PACE equivalent)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits identified for Sage PLUS; it is a counseling program assisting with Medicare eligibility, which generally targets individuals 65+ or under 65 with disabilities/ESRD. Related Hawaii Medicaid long-term care programs have limits like $1,530/month for home-based seniors (excess income toward care) or SSI $1,823/month minus $75 PNA for foster care, with assets under $2,000 single/$3,000 couple[2][10].
- Assets: No specific asset limits for Sage PLUS; Hawaii Medicaid references: under $2,000 single, $3,000 couple[2][10]. What counts/exempts not detailed in results.
- Must have Medicare Part A and/or Part B[1]
- Must live in the plan's service area[1]
- Cannot live outside the U.S.[1]
- Must actively enroll (no automatic enrollment)[1]
- Targets Medicare-eligible individuals, families, caregivers, soon-to-be retirees[7][8]

**Benefits:** Free, unbiased, one-on-one Medicare counseling; objective outreach, education, and assistance on Medicare benefits, health insurance decisions; virtual presentations, health fairs[1][7][8]. No dollar amounts, hours, or tiers specified.

**How to apply:**
- Phone/website via Hawaii SHIP: https://www.hawaiiship.org[7]
- Administered by Department of Health’s Executive Office on Aging (no specific phone/form listed in results)

**Timeline:** null
**Waitlist:** null

**Watch out for:**
- Not a direct PACE equivalent providing comprehensive care/services like medical care or long-term support—it's counseling/assistance for Medicare[1][7][8]
- Requires active enrollment/application, no automatic[1]
- Volunteer-based, so availability may vary[1]
- Does not provide financial aid or in-kind services; focuses on education/counseling[8]
- Search results from 2013 PDF; eligibility/enrollment rules may have updated[1]

**Data shape:** Counseling program (SHIP/Sage PLUS), not comprehensive care like PACE; no income/asset tests specific to it; data limited and dated; statewide but service-area restricted

**Source:** https://www.hawaiiship.org[7]

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Federal limits for 2026 are higher in Hawaii. QMB: Individual $1,550/month, couple $2,095/month. SLMB: Individual $1,860/month (120% FPL), couple $2,514/month. QI: Individual $2,095/month (135% FPL), couple $2,830/month. Includes $20 general income disregard. Limits apply to countable monthly income; Hawaii may disregard additional amounts. Vary by program tier, not household size beyond couple. Older sources cite lower/varying figures like $1,094 individual for QMB or $6,600 annual, but use current federal-adjusted for Hawaii[1][5][6][7].
- Assets: Individual: $9,950. Couple: $14,910. Counts: Bank accounts, stocks, bonds. Exempt: Home, one car, burial plots, life insurance (up to $1,500 face value), personal belongings. Hawaii follows federal resource limits; some states eliminate test but not confirmed here[2][3][5][6][7].
- Must be enrolled in Medicare Part A (free for most) and Part B for SLMB/QI.
- U.S. citizen or qualified immigrant.
- Hawaii resident.
- Not eligible for full Medicaid (QI specifically).
- QI first-come, first-served and annual reapplication.

**Benefits:** QMB: Pays Medicare Part A premium (if applicable, $0 for most), Part B premium ($202.90/month in 2026), Part A deductible ($1,604 est.), Part B deductible ($240 est.), coinsurance/copayments. SLMB/QI: Pays Part B premium only ($202.90/month). Automatic Extra Help for Part D drugs if eligible[1][3][6][7].
- Varies by: priority_tier

**How to apply:**
- Online: medquest.hawaii.gov (MedQUEST portal)[10]
- Phone: Hawaii MedQUEST at (808) 587-7500 or toll-free 1-800-316-8005
- Mail/In-person: Local MedQUEST district offices (e.g., Oahu: 601 Kamokila Blvd, Kapolei)
- Through SHIP counselor: hawaiiship.org or 1-888-536-9117

**Timeline:** Typically 45 days, but varies; no specific Hawaii timeline in results
**Waitlist:** QI has first-come, first-served funding limits; may have waitlist if funds exhausted[1][3][6]

**Watch out for:**
- Income/resource limits higher in Hawaii than mainland but still strict; outdated sources list old figures (e.g., 2021 $1,094)—verify current[1][5].
- QI requires annual reapplication and may run out of funds[1][6].
- QMB protects from provider billing (no balance billing), but providers must bill Medicare first[7].
- Automatic Extra Help/LIS eligibility often missed[6].
- Working income may allow higher qualification[6].
- Assets include spouse's even if not applying[2].

**Data shape:** Tiered by income (QMB <100% FPL, SLMB 100-120%, QI 120-135%); Hawaii has elevated income limits vs. mainland; QI funding capped first-come; benefits are premium/deductible payments, not direct services; statewide but local offices

**Source:** https://medquest.hawaii.gov/content/medquest/en/members-applicants/get-started/programs.html

---

### SNAP (Supplemental Nutrition Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Hawaii uses Broad-Based Categorical Eligibility (BBCE) with a gross income limit of 200% of the federal poverty level (Oct. 1, 2025 - Sept. 30, 2026): 1 person $2,998/month, 2 people $4,054/month, 3 people $5,108/month, 4 people $6,164/month, 5 people $7,218/month, 6 people $8,274/month, 7 people $9,328/month, each additional +$1,056/month. Households with a member 60+ or disabled who exceed gross may qualify via net income test (no specific net limits listed; benefits calculated after deductions like 20% earned income, standard deduction, medical for elderly/disabled over $35/month, shelter). Categorical eligibility (no income limits) if all members get TANF/SSI. Work requirements apply to able-bodied adults without dependents (ABAWDs), with exemptions for 60+ (though 2025 federal changes may impact 50-64 age group unless working 20 hours/week).[1][2][5][6]
- Assets: No asset limit under Hawaii BBCE (home, vehicles exempt). If gross income >200% FPL and household has 60+ or disabled member, may qualify under federal rules with $4,500 asset limit (countable: bank accounts; exempt: home, vehicles, retirement savings in some cases).[1]
- Hawaii resident.
- U.S. citizen, legal permanent resident (5+ years), or qualified non-citizen.
- Social Security number (or applied).
- Work registration for able-bodied adults (exempt: 60+, disabled, pregnant).
- Household includes those who buy/prepare food together.

**Benefits:** Monthly EBT card for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on net income (~$100 more net income = $30 less benefits); minimum/maximum vary by household size (specifics not listed; higher in Hawaii due to costs). Deductions boost benefits for elderly (medical, shelter).
- Varies by: household_size

**How to apply:**
- Online: https://www.mybenefitshawaii.org (via humanservices.hawaii.gov).
- Phone: Call local office or 1-855-643-1643 (general assistance line; confirm via official site).
- Mail/In-person: Local Department of Human Services offices (e.g., via humanservices.hawaii.gov/bessd/snap/).

**Timeline:** Typically 30 days; expedited for urgent cases (7 days if very low income/cash).

**Watch out for:**
- Hawaii's BBCE expands eligibility beyond federal (200% FPL gross, no asset test)—many elders qualify despite higher income.
- 2025 federal changes (One Big Beautiful Bill Act) may impose work requirements on 50-64 year olds (20 hrs/week), risking 16,570 HI elders off program.
- Medical deductions (> $35/month) and shelter costs often missed, increasing benefits.
- Low senior participation (~50% eligible enroll); ESAP simplifies for 60+ but adoption unclear.
- Household must include food-sharing members; college students/special rules apply.

**Data shape:** Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); BBCE waives asset/gross tests for most; 2025 work changes impact pre-65 'gray zone' adults; statewide but rural access varies.

**Source:** https://humanservices.hawaii.gov/bessd/snap/

---

### Low Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household total annual income below 150% of Federal Poverty Guidelines for Energy Credit (EC) or Energy Crisis Intervention (ECI) assistance, or below 60% of State Median Income for Weatherization Crisis Intervention (WCI). Households may qualify regardless of income if receiving SSI, SNAP, or TANF. Exact dollar amounts not specified in sources; use income limits chart from provider (e.g., HCEOC for Hawaii County). Varies by household size.
- Assets: No asset limits mentioned.
- Full-time legal resident of Hawaii with permanent place of residence.
- Responsible for and provide proof of utility bill (electric or gas).
- Proof of most recent income for all household sources.
- At least one household member is US citizen or lawful permanent resident.
- Picture ID and signature from all adults.
- Social Security number for all members over 1 year old.
- For ECI: Household in energy crisis (electric/gas service terminated or about to be).

**Benefits:** One-time payment toward electric or gas bill for heating/cooling assistance. Types: Energy Credit (EC) for non-crisis households; Energy Crisis Intervention (ECI) for crisis situations. Exact dollar amounts not specified; limited funds available.
- Varies by: priority_tier

**How to apply:**
- Oahu (HCAP): In-person only at HCAP offices (Central: (808) 488-6834, Kalihi/Palama: (808) 847-0804, Leahi: (808) 732-7755, Leeward: (808) 696-4261, Windward: (808) 239-5754); www.hcapweb.org/liheap/.
- Hawaii Island (HCEOC): hceoc.net/energy/liheap/; limited to first 20 clients per monthly cycle.
- Maui County (MEO): Contact via state DHS or local agency.
- General: Submit to Community Action Agency serving your island; applications accepted year-round for crisis (first-come, first-served), EC from June 1-30 annually.

**Timeline:** Processed in order received; monthly cycles open beginning of month, close end of month or when funds filled.
**Waitlist:** No waitlist; limited spots (e.g., first 20 clients/month in Hawaii County), applications close when filled.

**Watch out for:**
- One type of assistance per program year (Oct 1-Sep 30); cannot receive both EC and ECI.
- Must have active residential utility account for EC.
- Limited spots/funds; first-come, first-served, cycles fill quickly (e.g., first 20/month in Hawaii County).
- Oahu in-person only (no mail/email).
- EC applications only June 1-30; crisis year-round but limited.
- All adults must sign; proof required for every household member.

**Data shape:** Administered by county/island agencies with varying application windows, methods, and intake limits; income at 150% FPG or 60% SMI; automatic qualifiers for SSI/SNAP/TANF; priority for crisis vs. non-crisis.

**Source:** https://humanservices.hawaii.gov/bessd/ (state DHS Benefit Employment & Support Services Division); island providers like https://hceoc.net/energy/liheap/, www.hcapweb.org/liheap/, https://www.hawaiianelectric.com/billing-and-payment/payment-assistance/low-income-programs/h-heap

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of the Federal Poverty Guidelines (FPG) for Hawaii, varying by household size. Automatic eligibility if any household member receives TANF, SSI, participates in HUD programs, or LIHEAP. Example table from Kauai provider (KEO, recent data): 1: $31,200; 2: $42,240; 3: $53,280; 4: $64,320; 5: $75,360; 6: $86,400; 7: $92,280; 8: $102,720; add $5,220 per additional person. Exact current FPG must be verified with provider as they update annually[1][2][3][4][6][7].
- Assets: No asset limits mentioned in program guidelines[1][2][3][4][6].
- Priority to elderly (60+ or 65+ per some providers), persons with disabilities, families with children (under 6 or 19- per provider), high energy users, high energy burden households[1][4][5][6].
- Home must be occupied single-family or multi-family (4 units or less), owned or rented (landlord permission if renting)[3][6].
- For some measures like solar water heater: existing electric water heater and 12 months residency with energy use verification[6].
- Qualified aliens eligible per federal rules[3].
- Eligibility certified for 12 months from application; reapply if work not started[3].

**Benefits:** Free home energy audit, education, and installations including: high-efficiency faucet aerators/showerheads, CFL/LED lighting, advanced power strips, hybrid heat pump or solar water heaters, small/very large room ACs, refrigerator replacement. Specific measures from Hawaii priority list for single-family homes[1][4][6].
- Varies by: priority_tier

**How to apply:**
- Oahu (Honolulu): Contact Honolulu Community Action Program (HCAP) via https://www.hcapweb.org/weatherization-assistance-program/[1].
- Hawaii County (Hilo): Email wap@hceoc.net (PDF/DOC), mail or in-person to 47 Rainbow Drive, WAP Office Bldg 2, Hilo, HI 96720[2].
- Kauai: Complete KEO Intake Form via https://keoinc.org/services/weatherization-assistance/[6].
- Statewide admin: Hawaii Office of Community Services https://labor.hawaii.gov/ocs/service-programs-index/weatherization-assistance-program/[4].
- General: Contact state weatherization administrator via DOE map (Hawaii link leads to state OCS)[8].

**Timeline:** Not specified; limited by funding[2][3].
**Waitlist:** Limited applications approved due to funding; potential wait or denial if funds exhausted[2].

**Watch out for:**
- Limited funding means not all applicants approved; apply early[2].
- Priority tiers mean elderly may wait if higher priority (e.g., children/disabilities) backlog[1][4].
- Must verify current 200% FPG for Hawaii (higher than continental US); tables vary slightly by provider/year[6][7].
- Homeownership not required but landlord approval needed for rentals; some measures require existing electric water heater[6].
- Eligibility expires after 12 months if work not started[3].
- Coordination with LIHEAP may provide extras but separate eligibility check[4].

**Data shape:** County-specific providers with localized application processes and offices; income at fixed 200% FPG Hawaii-adjusted; automatic eligibility via TANF/SSI/LIHEAP/HUD; priority-based access with funding caps leading to waitlists; measures from state priority list varying by home type.

**Source:** https://labor.hawaii.gov/ocs/service-programs-index/weatherization-assistance-program/[4]

---

### Hawaii SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, caregivers, and soon-to-be retirees[3][5][6]
- Assets: No asset limits or tests apply[6]
- Must be Medicare-eligible or soon-to-be eligible; also supports people with limited incomes, under 65 with disabilities, and dually eligible for Medicare/Medicaid[2][3][5]

**Benefits:** Free, unbiased, one-on-one counseling on Medicare coverage (Parts A, B, C, D), Medigap, prescription drugs, travel coverage, cost-saving resources (e.g., Medicaid, Medicare Savings Program, Extra Help), appeals; virtual presentations, health fair participation; no dollar amounts or time limits specified[2][5][7][10]

**How to apply:**
- Phone: 808-586-7299 (Helpline), 1-888-875-9229 (Toll-free), 1-866-810-4379 (TTY)[7][9][10]
- Website: www.hawaiiship.org (request counseling, schedule presentations)[3][7][10]
- In-person: Available by accommodation request if necessary (virtual/phone preferred)[10]
- No mail option specified

**Timeline:** Not specified; services provided via phone/virtual promptly upon contact[10]

**Watch out for:**
- Not a financial aid or insurance program—provides counseling only, no direct payments or coverage; volunteer-based so availability may depend on counselor schedules; people may confuse with income-based health coverage programs like QUEST (unrelated state SHIP in older docs)[1][6][7]
- Services are free but require contacting via helpline/website—no walk-ins without arrangement[10]

**Data shape:** no income/asset test; counseling-only service for Medicare navigation; volunteer-delivered statewide via phone/virtual; not a benefits-paying program

**Source:** https://www.hawaiiship.org[3]

---

### Home-Delivered Meals (via Kūpuna Aging in Place grantees)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Low- to moderate-income levels apply for Kūpuna Aging in Place (KAP) grantees, but exact dollar amounts or household size tables not specified in sources; some providers like Lanakila Pacific offer free meals via Aging and Disability Resource Center without detailed income thresholds listed[1][5].
- Assets: No asset limits or details on what counts/exempts mentioned[1][5][6].
- Homebound and unable to shop for or prepare own meals[1][6].
- Typically ages 60+ (65+ emphasized for KAP low/moderate-income kūpuna)[1][5][6].
- Spouses as primary caregivers needing respite or younger household members with disabilities may qualify[1].
- Lives alone or no family/friends/community help available (some providers)[7].

**Benefits:** Nutritious home-delivered meals (hot, frozen, or dietitian-planned); weekly delivery of fully cooked frozen meals (e.g., Lanakila Pacific); island-wide on Oahu for some; may be free via resource centers or health insurance, otherwise purchasable[1][2].
- Varies by: provider|region

**How to apply:**
- Contact providers directly: Lanakila Pacific Meals on Wheels (808-356-8519, www.lanakilapacific.org)[1][2]; Hawaii Meals on Wheels (808-988-6747, www.hmow.org)[2]; Our Kupuna (808-215-0073, requires professional referral letter)[7].
- City & County Aging and Disability Resource Center for eligibility assessment (no direct phone listed)[1].
- County Elderly Affairs/Office on Aging for needs assessment and connections (county-specific contacts via HCF)[5].

**Timeline:** Not specified
**Waitlist:** Not mentioned

**Watch out for:**
- Not a single centralized program—services via multiple KAP grantees/providers with varying delivery types (frozen vs. hot), areas, and contacts; must contact specific provider or county office[1][2][5].
- Free meals depend on qualifying through resource centers/insurance; otherwise paid (credit/debit, check, SNAP EBT)[1].
- Someone must be home for deliveries (Mon-Fri, 8:30am-1pm)[1].
- Professional referral often required; apply for insurance/grocery services first[7].
- KAP focuses on 65+ low/moderate-income, but Meals on Wheels often 60+[1][5].

**Data shape:** Decentralized via HCF grantees and county providers (16 nonprofits statewide); no uniform income table or assets; eligibility/assessment via local Aging offices; Oahu-heavy examples; varies by specific nonprofit (e.g., frozen vs. hot meals, delivery frequency)

**Source:** https://www.hawaiicommunityfoundation.org/strengthening/kupuna-aging-in-place (HCF KAP grants); county Elderly Affairs sites[5]

---

### Caregiver Support (via Executive Office on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or tables stated for the Family Caregiver Support Program (FCSP); priority given to those with greatest economic or social need. Kupuna Care (related program) has cost-sharing based on income and ability to pay, but no dollar amounts provided.[2]
- Assets: No asset limits or details on what counts/exempts mentioned in sources.
- Family caregiver of someone age 60+ (care recipient).[1]
- Caregiver age 18+ caring for eligible care recipient; special populations include adults 55+ caring for non-child adults 18+ with developmental disabilities, or grandparents/relatives 55+ caring for children 18 and under.[1]
- Native Hawaiian-specific: Caregiver of Native Hawaiian 60+ with chronic illness/disability, or Native Hawaiian grandparent/relative caring for child 18 or younger.[1]
- Care recipient must be Hawaii resident; functional needs (frailty, ADL/IADL limitations) for related Kupuna Care.[2]
- Priority for minorities, rural residents, limited English proficiency.[2]

**Benefits:** Information and assistance, individual counseling, support groups and training, respite services, supplemental services; also case management, caregiver training.[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Phone: Senior Helpline (808) 768-7700 (Oahu; caregiver or power of attorney may call).[2]
- Phone: Hawaii County Office of Aging (808) 961-8626.[8]
- Hawaii ADRC website: www.hawaiiadrc.org for long-term supports info.[4][6]
- EOA website: health.hawaii.gov/eoa/.[4]

**Timeline:** Not specified in sources.

**Watch out for:**
- Two tracks: Federal OAA Title III (no cost, age 60+, priority-based) vs. state Kupuna Care (functional needs, cost-sharing, excludes Medicaid-eligible).[2]
- Must contact local AAA; no centralized online form mentioned.
- Special populations (e.g., 55+ caregivers for disabled adults/children) expand eligibility beyond standard 60+ care recipient.[1]
- Voluntary contributions encouraged for OAA services.[2]

**Data shape:** Administered statewide via 4 county AAAs with local contacts; no income/asset dollar limits specified; eligibility expands for special populations like grandparents 55+; distinguishes federal OAA FCSP (free/priority) from state Kupuna Care (needs/cost-share).

**Source:** https://health.hawaii.gov/eoa/

---

### Retired Senior Volunteer Program (RSVP, related to SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level (varies by household size; consult current HHS Poverty Guidelines at https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines for exact dollar amounts, as specific table not provided in sources)
- Assets: No asset limits mentioned
- Unemployed
- Resident of Hawaii (statewide or specific service area/county)
- Eligible to work in the US
- Enrollment priority: veterans/qualified spouses, 65+, disabled, limited English proficiency, low literacy, rural residents, low employment prospects, homeless/at risk of homelessness, unable to find employment through other programs

**Benefits:** Supervised on-the-job training at government/non-profit host agencies (for-profit businesses also eligible); average 19-20 hours/week at Hawaii state minimum wage (wages subsidized during training); training period leads to unsubsidized employment; average assignment 20-27 months, lifetime limit 48 months if continuously eligible
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP operator by county (e.g., Hawaii County: (808) 961-8730 East Hawaii or (808) 323-4320 West Hawaii, email rsvp@hawaiicounty.gov; Honolulu: elderlyaffairs.com/rsvp; statewide info: labor.hawaii.gov/wdd/job-seekers/scsep/; NAPCA SCSEP: napca.org/employmentprograms)
- In-person at local operator offices
- Phone or email to complete application

**Timeline:** Not specified; eligibility verification after application
**Waitlist:** Yes, if training positions full; placed on waiting list

**Watch out for:**
- RSVP and SCSEP are distinct: pure RSVP (e.g., Honolulu, Hawaii County) is unpaid volunteer matching (age 55+, no income/unemployment req); SCSEP is paid training (strict eligibility); query links them but they differ
- Funding fluctuations may cause pauses/slowdowns (noted in 2025)
- Must be unemployed at enrollment; post-training, seek unsubsidized work
- Annual recertification required
- Limited positions; waitlists common

**Data shape:** County-operated with local operators; priority tiers for enrollment; income at 125% FPL (household-based); paid training not pure volunteer; separate from unpaid RSVP programs

**Source:** https://labor.hawaii.gov/wdd/job-seekers/scsep/

---

### Senior Legal Helpline (via Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For general Legal Aid Society of Hawaii services (which operates the helpline), household income under 125% of federal poverty guidelines; exact amounts vary periodically with federal poverty levels and by household size (not specified in current data). Seniors 60+ may access the hotline even if over income limits in certain situations like foreclosure or public benefits loss.
- Assets: Limited income and assets required for some related elder law programs (e.g., University of Hawaii Elder Law Program), but no specific dollar amounts or exemptions detailed for the helpline; assets not explicitly mentioned for hotline access.
- Resident of Hawaii
- No conflicts of interest (e.g., Legal Aid cannot have assisted opposing party)
- Seniors 60+ eligible for phone advice regardless of income in priority cases

**Benefits:** Free legal telephone advice from attorneys on civil legal issues (e.g., family law, housing, consumer, public benefits); may include brief services like document review, letter writing, or referrals; staffed by state-barred attorneys.

**How to apply:**
- Phone: 536-0011 (Oahu), 1-888-536-0011 (Neighbor Islands or statewide)
- Statewide intake hotline for eligibility screening, brief application, and advice

**Timeline:** Immediate phone advice upon eligibility screening during call

**Watch out for:**
- Income eligibility is 125% FPL for full services, but seniors 60+ get hotline access even if over limit for priority issues (foreclosure, benefits loss); limited to phone advice, not full representation; potential conflicts of interest block service; not all calls result in ongoing help due to staff/resources.

**Data shape:** no income test for seniors 60+ on hotline in priority cases; phone-based only with toll-free access for islands; tied to Legal Aid Society, not direct AAA staffing; eligibility flexible for elders vs. strict for general clients

**Source:** https://ittakesanohana.org/wp-content/uploads/2011/01/LASH-Facts-About-LASH.pdf

---

### Long-Term Care Ombudsman Program (LTCOP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to any resident or family of a resident in a qualifying long-term care facility regardless of income[3][6][7]
- Assets: No asset limits or tests apply[3][6][7]
- Must be a resident (or acting on behalf of a resident) of a long-term care facility such as nursing homes, assisted living facilities, adult residential care homes (ARCH), expanded ARCH, CCFFH, hospice centers, or adult day care[3][6][7]

**Benefits:** Identifies, investigates, and resolves complaints related to action, inaction, or decisions affecting health, safety, welfare, and rights of residents; provides information, referral, and consultation on long-term care issues including alternatives to nursing home placement, payment options, choosing facilities, power of attorney/guardianship, refusing treatment, and resident rights; supports resident and family councils; conducts confidential face-to-face visits by certified ombudsmen or volunteers[3][7]

**How to apply:**
- Phone: 586-7268 (Oahu) or 1-888-229-2231 (statewide)[3][7]
- Email: eoa.ltcop@doh.hawaii.gov[3]
- Phone for volunteer info: 586-0100 (Oahu)[3][8]
- Website: https://health.hawaii.gov/eoa/home/long-term-care-ombudsman-program/[3]
- Website: https://www.hi-ltc-ombudsman.org[7]

**Timeline:** Not specified; complaint investigation and resolution handled promptly as needed[3][7]

**Watch out for:**
- Not a direct service provider like healthcare or financial aid—focuses on advocacy, complaint resolution, and information only; often confused with volunteer recruitment; requires facility residency (not for home-based care); confidentiality rules limit disclosure without consent; people miss that it's free and accessible to anyone advocating for a resident[3][6][7]

**Data shape:** no income/asset test; advocacy-only for LTC facility residents; volunteer-driven with statewide access but Oahu-focused staffing; not a qualification-based benefit program

**Source:** https://health.hawaii.gov/eoa/home/long-term-care-ombudsman-program/

---

### Kahi Malama – A Place of Caring

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits specified; prioritizes low-income elders based on Area Agency on Aging (AAA) programs for those 60+. Serves residents age 60+, persons with disabilities, and caregivers without detailed financial thresholds in sources[8].
- Assets: Not applicable or not assessed, per similar Hawaii elder programs like Kupuna Care[2].
- Hawaii County (Big Island) resident
- Native Hawaiian preferred for some related ALU LIKE programs but open to all per HCOA[3][8]
- Focus on aging in place needs, frail elders, or disabilities[8]

**Benefits:** Information, referral, and resource coordination for aging and disability services to help age in place; Aging & Disability Resource Center (ADRC) services including care coordination, options counseling, and links to nutrition, supportive services, respite, and long-term care alternatives[8].
- Varies by: region

**How to apply:**
- Phone: Hilo (808) 961-8626, Kona (808) 323-4390 or 323-4392, Statewide ADRC (808) 643-2372[8]
- In-person: 1055 Kinoole Street, Hilo, Hawaii 96720[8]
- Email: hcoa@hawaiicounty.gov[8]
- FAX: (808) 961-8603[8]

**Timeline:** Not specified

**Watch out for:**
- Limited to Hawaii County (Big Island), not statewide—families on Oahu, Maui, Kauai must use local AAAs[8]
- Primarily an information/referral hub (ADRC), not direct service provider—connects to other programs like Medicaid waivers or chore services[8]
- May prioritize Native Hawaiians via related Title VI funding, though open to all[3][8]
- No detailed financial caps listed, but links to means-tested programs like Med-QUEST[1]

**Data shape:** County-specific ADRC under Area Agency on Aging; no strict income/asset tests, focuses on resource coordination for Big Island residents age 60+; dual offices (Hilo/Kona) with island-wide service

**Source:** https://hcoahawaii.org

---

### Elderly Affairs Division (EAD) / Honolulu ADRC

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Contact EAD directly at (808) 768-7700 for income threshold information.
- Assets: Not specified in available sources. Contact EAD directly at (808) 768-7700 for asset limit information.
- Not covered by any comparable government or private home- and community-based services[1][3]
- Not residing in an institution (intermediate care facility, skilled nursing facility, adult residential care home, hospital, or foster family home)[1]
- For Kupuna Care specifically: Have functional impairments — either cognitive impairment OR unable to perform at least two Activities of Daily Living (ADL) or Instrumental Activities of Daily Living (IADL)[2][3]
- For Home Delivered Meals specifically: Have cognitive impairment OR unable to perform two ADLs AND unable to leave home due to illness, disability, or frailty[2]

**Benefits:** Specific dollar amounts and hours per week not provided in available sources. Contact EAD at (808) 768-7700 for service-specific details.
- Varies by: Individual assessment determines which services are appropriate based on needs and eligibility[2]

**How to apply:**
- Phone: (808) 768-7700 — speak with staff member to determine basic eligibility criteria[2]
- In-person: Elderly Affairs Division, 222 North School Street, Honolulu, Hawaii 96817[7]
- Mail: Send inquiries to 222 North School Street, Honolulu, Hawaii 96817 (FAX: 808-768-1261)[7]
- Website: elderlyaffairs.com (no online application form specified in available sources)

**Timeline:** Not specified in available sources. After initial phone screening, an in-home assessment is scheduled if applicant appears eligible[2].
**Waitlist:** Not mentioned in available sources. Contact EAD directly for current waitlist status.

**Watch out for:**
- This program is COUNTY-SPECIFIC: Honolulu EAD only serves Honolulu County. Families in other Hawaii counties must contact their respective county's Area Agency on Aging[1][7]
- Income and asset limits are NOT disclosed in public materials — families must call to learn if they qualify financially[2]
- Functional impairment requirement is strict: applicants must have cognitive impairment OR be unable to perform at least TWO ADLs/IADLs. Single impairment may not qualify[2][3]
- Comparable services disqualify: if someone already receives similar government or private services, they cannot access Kupuna Care[1][3]
- Institutional residents are ineligible: anyone in a nursing home, assisted living, or similar facility cannot use this program[1]
- In-home assessment is required: initial phone screening is just the first step; formal eligibility confirmation requires an in-home evaluation[2]
- Home Delivered Meals has additional restrictions: recipients must be unable to leave home due to illness, disability, or frailty — not just unable to cook[2]
- Home modification program requires homeownership: housing assistance for modifications is only available to those who own their homes[4]
- No online application available: despite having a website, EAD requires phone contact to initiate the application process[2]

**Data shape:** This program's eligibility and benefits are highly individualized. There are no published income/asset limits, no published service hour maximums, and no published waitlist information. Eligibility determination requires both phone screening AND in-home assessment. Services vary by individual need rather than by tier or priority level. The program is strictly county-based, with Honolulu County served by EAD and other counties served by separate agencies. Functional impairment thresholds are specific (cognitive impairment OR 2+ ADL/IADL limitations) but application of these thresholds requires professional assessment.

**Source:** elderlyaffairs.com (Honolulu County) and hawaiiadrc.org (statewide ADRC)

---

### Kaua'i Agency on Elderly Affairs

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Income is assessed on a case-by-case basis for cost-sharing determination under Kupuna Care, but no published income thresholds or tables are provided.
- Assets: Not specified in available sources.
- Must be a Hawaii resident[2]
- Must be an admitted permanent resident under the Immigration and Nationality Act (for some programs)[3]
- Should not be covered by a comparable government or private service[1]
- Should not be residing in an institution (long-term care facility, SNF, ARCH, hospital, or foster family home)[1][3]
- For Kupuna Care specifically: Must have functional needs — either cognitive impairment OR inability to perform at least two Activities of Daily Living (ADLs) or Instrumental Activities of Daily Living (IADLs)[1]
- For Home Delivered Meals specifically: Must have cognitive impairment OR be unable to perform two ADLs AND unable to leave home due to illness, disability, or frailty[1]

**Benefits:** Varies by program. Includes Title III federally-funded services (no cost; voluntary contributions encouraged[2]) and Kupuna Care services (cost-sharing may apply based on income and ability to pay[2]). Specific service types and hours/dollar amounts are not detailed in available sources.
- Varies by: program_type_and_functional_need

**How to apply:**
- Phone: (808) 241-4470 (Senior Helpline)[2][6]
- In-person: Kaua'i Agency on Elderly Affairs, Pi'ikoi Building, 4444 Rice Street, Suite 330, Lihue, Hawaii 96766[6]
- Email: elderlyaffairs@kauai.gov[6]
- FAX: (808) 241-5113[6]

**Timeline:** Not specified in available sources. An in-home assessment is scheduled if applicant appears eligible, but timeline for assessment and final determination is not provided.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- Two separate programs with different eligibility: OAA Title III is open to all 60+ with priority for those with greatest economic/social need[2], while Kupuna Care requires documented functional limitations (cognitive impairment or ADL/IADL limitations)[1][2]
- Kupuna Care has cost-sharing based on income and ability to pay, unlike Title III which is free[2]
- Applicants must not be covered by comparable government or private services — this can disqualify those with existing Medicaid, VA benefits, or private insurance coverage for similar services[1]
- Applicants cannot be residing in any institution, including long-term care facilities, SNFs, ARCHs, hospitals, or foster family homes[1][3]
- No published income or asset limits are available — these are determined individually during assessment[2]
- Processing timeline and waitlist status are not publicly disclosed
- If applicant has cognitive limitations, a Power of Attorney or caregiver must initiate the call — applicants cannot self-refer in all cases[2]
- This is a county-specific office; residents of other Hawaiian counties must contact their respective county Area Agency on Aging

**Data shape:** Kaua'i Agency on Elderly Affairs administers two distinct programs (OAA Title III and Kupuna Care) with overlapping but different eligibility criteria. Eligibility is functional-need-based rather than income-based for Kupuna Care, though income affects cost-sharing. No published income thresholds, asset limits, or specific service hour/dollar amounts are available in public sources. Application is phone-based with in-home assessment required. This is a county-restricted program with no statewide availability.

**Source:** https://www.kauai.gov/Government/Departments-Agencies/Agency-on-Elderly-Affairs and https://kauaiadrc.org

---

### Home and Community Services (Statewide via EOA)


**Eligibility:**
- Income: No specific income limits detailed for this program in available sources; eligibility ties to Med-QUEST (Hawaii Medicaid) long-term care programs, where for HCBS, income over $1,530/month (2026) for a single senior living at home must go toward care costs. SSI recipients in adult foster care contribute all but $75/month PNA. General Med-QUEST ABD may allow income >100% FPL with assets ≤$2,000 (single) or ≤$3,000 (household of 2). No full household size table provided.[2][3][10]
- Assets: ≤$2,000 for a single applicant (countable assets); ≤$3,000 for household of 2. Applies to HCBS waivers and nursing home Medicaid via Med-QUEST. Specific countable vs. exempt assets not detailed (e.g., primary home often exempt in Medicaid LTC, but not specified here).[2][3][10]
- Hawaii resident.
- Nursing Facility Level of Care (NFLOC): Requires full-time care equivalent to nursing home based on inability to perform Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (shopping, cooking, cleaning, medication management).
- Med-QUEST (Medicaid) enrollment.
- For some HCBS, aged 65+, blind, or disabled (ABD Medicaid).[2][3]

**Benefits:** Long-term care services in home or community settings to avoid institutionalization, including assistance at home, adult day care, community care foster family homes (CCFFH), assisted living residences (but not Expanded Adult Residential Care Homes, which are private pay only). Delivered via managed care system through one administering agency. Specific hours, dollar amounts, or per diem rates not detailed beyond CCFFH room/board from SSI (all but $75 PNA).[3]
- Varies by: priority_tier

**How to apply:**
- Contact Med-QUEST (Hawaii Medicaid) for enrollment: Apply via medquest.hawaii.gov or phone (not specified in results; general DHS/Med-QUEST channels). No EOA-specific phone, URL, or form named.
- Assessment for NFLOC and services via Med-QUEST.[2][3]

**Timeline:** Not specified.
**Waitlist:** Possible enrollment cap for HCBS, leading to waiting lists.[3]

**Watch out for:**
- Tied to Med-QUEST Medicaid; must first qualify for Medicaid and NFLOC—not automatic for elderly.
- Income over limits must pay toward care costs; SSI has PNA deduction only.
- Possible waitlists due to enrollment caps.
- No specific 'EOA' details found; may refer to Elderly Outreach or area agency, but program appears as statewide HCBS under Med-QUEST managed care.
- Excludes certain settings like Expanded Adult Residential Care Homes.
- Functional assessment required beyond financial eligibility.[2][3]

**Data shape:** Eligibility / benefits via Med-QUEST HCBS waivers / managed care (NFLOC required); no dedicated EOA program details in sources—likely Medicaid Home and Community Based Services statewide; asset/income strict with care cost offsets; waitlists possible; no household income table or EOA-specific application.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medquest.hawaii.gov/

---

### Transportation Friends for Kupuna (TFK)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources
- Assets: Not specified in available sources
- Must live on Oahu in your own home (not in a facility)[1][2]
- Must live independently[1]
- Must have some mobility issues or beginning cognitive/memory issues with limited support[2]
- Must have minimal family/friends/community support available[2]
- Must be able to give program 1-2 weeks notice before appointments[2]

**Benefits:** Free transportation and/or chaperone escort assistance to appointments (doctor's appointments, grocery store, post office, etc.)[1][5]

**How to apply:**
- Phone: Call to discuss eligibility and begin process[2]
- Professional referral: May require referral letter from social worker, case manager, or doctor depending on circumstances[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Program is Oahu-only — families on other islands need to contact different providers[3]
- Clients must provide 1-2 weeks advance notice for appointments; this is not an emergency transportation service[2]
- Gender matching is enforced: female volunteers paired with female clients, male with male[1]
- No income or asset limits are publicly specified, but eligibility screening exists — call to confirm qualification[2]
- Professional referral may be required in some cases; check with program before applying[3]
- Services depend on volunteer availability — not guaranteed same-day or next-day service[2]

**Data shape:** TFK is a volunteer-based peer support program, not a means-tested benefit program. No income/asset limits are published. Eligibility focuses on functional need (mobility/cognitive issues) and social isolation (living alone with minimal support). Services are free but dependent on volunteer availability. Program requires advance notice (1-2 weeks) and is geographically restricted to Oahu. Catholic Charities Hawaii screens and trains volunteers (age 55+) to serve clients (age 60+).

**Source:** https://www.kanuhawaii.org/need/transportation-friends-for-kupuna/

---

### Senior Companion Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Low-income required; must meet ACTION’s (now CNCS) income eligibility guidelines for senior companions (volunteers). Specific dollar amounts or household size tables not provided in sources. Clients (recipients) have no explicit income limits stated.
- Clients (recipients): Needs person-to-person assistance from senior companion to maintain independent living at home, or scheduled for release from health care facility within 2-4 weeks needing support to return home.
- Clients: Assessed as needing services by volunteer station or program staff with a written care plan.
- Clients: Individual or legal guardian must sign care plan authorizing visits and specifying activities.
- Senior companions (volunteers): 55+ years old (some sources say 60+), not in regular workforce, able to serve 20 hours/week max, accept supervision, understand client needs, pass background checks.
- Volunteers without stipends allowed if income exceeds guidelines and no co-located RSVP program.

**Benefits:** In-home companionship, limited personal care, respite for caregivers, accompaniment to medical appointments and grocery shopping, light meal preparation, assistance with other needs to support independent living. Provided by trained senior volunteers up to 20 hours/week. Volunteers receive non-taxable stipend, meal allowance, transportation reimbursement.

**How to apply:**
- Phone: (808) 832-0340 (Oahu Senior Companion Program office)
- Contact Department of Human Services for statewide info

**Waitlist:** Subject to availability of funds; potential waitlist implied but no specifics.

**Watch out for:**
- Program serves **two groups**: (1) low-income seniors volunteering as companions (55+/60+), (2) frail elders receiving services (60+). Families apply to **receive services**, not become volunteers.
- No specific income/asset dollar amounts or tables provided; must contact program for current ACTION/CNCS guidelines.
- Services limited to companionship/personal assistance, not full healthcare or attendant care.
- Availability depends on funds and volunteer recruitment.
- Age discrepancy in sources: companions 55+ or 60+, clients 60+.

**Data shape:** Dual structure: recruits low-income senior volunteers (55+/60+) with stipends to serve frail elders (60+); statewide but Oahu-centric contact; no detailed income tables or processing times; volunteer-focused eligibility dominates sources.

**Source:** https://humanservices.hawaii.gov/senior-companion-program/

---

### Foster Grandparent Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Total annual cash income from all resources at or below the income eligibility level established and revised annually by the Director of ACTION (now AmeriCorps Seniors) for the state, typically around 125% of the federal poverty level; eligibility continues if income does not exceed guidelines by 20%. Exact dollar amounts vary yearly and by household size but are not specified in current sources—contact program for 2026 levels[1][3][8].
- Assets: No asset limits specified in Hawaii rules[1][2].
- Physically and mentally able to serve, verified by physical exam from licensed physician[1][2]
- Not employed in the regular workforce[1][2]
- Willing to accept supervision and serve children with special/exceptional needs regularly without detriment to self or child[1][2]
- Able to commit generally 4 hours/day, up to 20 hours/week (program requires minimum 15 hours/week)[1][3]
- Understand exceptional needs of children and desire to help their growth[1]
- No criminal, employment, or background history posing risk (e.g., no convictions for violence, sex offenses, drug/alcohol abuse, child abuse/neglect)[1]

**Benefits:** Non-taxable stipend (amount not specified in sources), meal allowance, travel reimbursement, paid vacation and sick leave; volunteers provide personalized support to children with special/exceptional needs in childcare/school settings, typically 15-20 hours/week[3]
- Varies by: fixed

**How to apply:**
- Phone: Call Foster Grandparent Program office on Oahu at (808) 832-5169 to apply, request services, or get information[3]
- In-person: Contact local program office (Oahu primary)[3][4]

**Timeline:** Not specified in sources
**Waitlist:** Subject to availability of funds; potential waitlist implied but not detailed[2]

**Watch out for:**
- This is a volunteer program for low-income seniors (55+) to serve children—not direct services or stipends for elderly loved ones; families apply for child to receive grandparent volunteer support, not for grandparent qualification[1][3]
- Age conflict in rules (60+ in regulations vs. 55+ on state site and federal); use 55+ as current standard[1][3][8]
- Income guidelines revised annually—must confirm current levels and 20% excess allowance[1]
- Commitment is 15-20 hours/week serving children with special needs, not flexible caregiving for family[3]
- Services for children 21 or younger (exceptions for developmental disabilities); not for adult care[2][3]

**Data shape:** Volunteer employment program for seniors serving special needs children; income-tested with annual federal poverty-based thresholds (no fixed table in sources); statewide but Oahu-centric contact; rules dated (1990s) but site reflects federal updates (age 55+)

**Source:** https://humanservices.hawaii.gov/foster-grandparent-program/[3]

---

### Memory Mentor Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits mentioned for this program; targeted at seniors with memory loss living alone with little or no caregiving support[4].
- Assets: No asset limits specified[4].
- Seniors with memory loss
- Living alone with little or no caregiving support[4]

**Benefits:** Free in-home services by volunteers, including friendly visits, safety checks, grocery shopping, help reviewing mail, and providing reminders[4].

**How to apply:**
- Phone: Senior Intake Line at (808) 527-4777[4]

**Timeline:** Not specified

**Watch out for:**
- Program is volunteer-based with limited services focused on basic in-home support, not comprehensive care or medical services[4]
- Not a government program; run by nonprofit Catholic Charities, so availability may depend on volunteer capacity[4]
- No mention of formal application forms or processing timelines—simple phone intake[4]

**Data shape:** Volunteer-driven in-home support program with minimal formal eligibility tests; no income/asset requirements specified, focused on isolation and memory loss[4]

**Source:** No dedicated .gov URL; primary contact via Catholic Charities Hawaiʻi (not a .gov site)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Med-QUEST (Medicaid for seniors/disabled | benefit | state | deep |
| Kūpuna Care Program | benefit | state | deep |
| Sage PLUS Program (PACE equivalent) | benefit | state | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Hawaii SHIP (State Health Insurance Assi | resource | federal | simple |
| Home-Delivered Meals (via Kūpuna Aging i | benefit | local | deep |
| Caregiver Support (via Executive Office  | benefit | state | deep |
| Retired Senior Volunteer Program (RSVP,  | employment | federal | deep |
| Senior Legal Helpline (via Area Agencies | resource | state | simple |
| Long-Term Care Ombudsman Program (LTCOP) | resource | federal | simple |
| Kahi Malama – A Place of Caring | benefit | local | medium |
| Elderly Affairs Division (EAD) / Honolul | navigator | local | simple |
| Kaua'i Agency on Elderly Affairs | resource | local | simple |
| Home and Community Services (Statewide v | benefit | state | deep |
| Transportation Friends for Kupuna (TFK) | resource | local | simple |
| Senior Companion Program | benefit | state | medium |
| Foster Grandparent Program | employment | state | deep |
| Memory Mentor Program | resource | local | simple |

**Types:** {"benefit":12,"resource":6,"employment":2,"navigator":1}
**Scopes:** {"state":8,"federal":7,"local":6}
**Complexity:** {"deep":12,"simple":7,"medium":2}

## Content Drafts

Generated 21 page drafts. Review in admin dashboard or `data/pipeline/HI/drafts.json`.

- **Med-QUEST (Medicaid for seniors/disabled)** (benefit) — 4 content sections, 6 FAQs
- **Kūpuna Care Program** (benefit) — 3 content sections, 6 FAQs
- **Sage PLUS Program (PACE equivalent)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 6 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Low Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 6 content sections, 6 FAQs
- **Hawaii SHIP (State Health Insurance Assistance Program)** (resource) — 1 content sections, 6 FAQs
- **Home-Delivered Meals (via Kūpuna Aging in Place grantees)** (benefit) — 4 content sections, 6 FAQs
- **Caregiver Support (via Executive Office on Aging)** (benefit) — 4 content sections, 6 FAQs
- **Retired Senior Volunteer Program (RSVP, related to SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Senior Legal Helpline (via Area Agencies on Aging)** (resource) — 1 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program (LTCOP)** (resource) — 2 content sections, 6 FAQs
- **Kahi Malama – A Place of Caring** (benefit) — 3 content sections, 5 FAQs
- **Elderly Affairs Division (EAD) / Honolulu ADRC** (navigator) — 2 content sections, 6 FAQs
- **Kaua'i Agency on Elderly Affairs** (resource) — 3 content sections, 6 FAQs
- **Home and Community Services (Statewide via EOA)** (benefit) — 4 content sections, 6 FAQs
- **Transportation Friends for Kupuna (TFK)** (resource) — 3 content sections, 6 FAQs
- **Senior Companion Program** (benefit) — 4 content sections, 6 FAQs
- **Foster Grandparent Program** (employment) — 3 content sections, 6 FAQs
- **Memory Mentor Program** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_category**: 1 programs
- **priority_tier and individual need. Priority given to those with greatest economic or social need, at risk for institutional placement, low-income, minority, limited English proficiency, or residing in rural areas[1][7]**: 1 programs
- **not_applicable**: 7 programs
- **priority_tier**: 6 programs
- **household_size**: 1 programs
- **provider|region**: 1 programs
- **region**: 1 programs
- **Individual assessment determines which services are appropriate based on needs and eligibility[2]**: 1 programs
- **program_type_and_functional_need**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Med-QUEST (Medicaid for seniors/disabled)**: Med-QUEST is Hawaii's Medicaid program with multiple sub-programs (QUEST Integration, Nursing Home Medicaid, Regular Medicaid) that have different eligibility criteria. For seniors and disabled individuals, eligibility is based on age/disability status PLUS income/asset limits PLUS functional need for care. Asset limits apply only to those 65+ or disabled; they do not apply to younger adults. Long-term care requires demonstration of nursing home level of care or ADL need, not just financial qualification. Income limits are expressed as percentages of Federal Poverty Level (FPL) and vary by household size and program category.
- **Kūpuna Care Program**: Kupuna Care is a state/county-funded gap-filling program designed specifically for frail older adults who do NOT qualify for Medicaid but need long-term care support. It differs fundamentally from OAA Title III (federal program) by requiring demonstrated functional need and excluding those with Medicaid eligibility. The program has two distinct service delivery models: traditional service delivery or participant-directed services[2]. Eligibility determination is individualized through in-home assessment rather than formulaic income/asset limits. Regional implementation through county Area Agencies on Aging means application processes and service availability may vary by county, though statewide coordination occurs through the Executive Office on Aging.
- **Sage PLUS Program (PACE equivalent)**: Counseling program (SHIP/Sage PLUS), not comprehensive care like PACE; no income/asset tests specific to it; data limited and dated; statewide but service-area restricted
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income (QMB <100% FPL, SLMB 100-120%, QI 120-135%); Hawaii has elevated income limits vs. mainland; QI funding capped first-come; benefits are premium/deductible payments, not direct services; statewide but local offices
- **SNAP (Supplemental Nutrition Assistance Program)**: Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); BBCE waives asset/gross tests for most; 2025 work changes impact pre-65 'gray zone' adults; statewide but rural access varies.
- **Low Income Home Energy Assistance Program (LIHEAP)**: Administered by county/island agencies with varying application windows, methods, and intake limits; income at 150% FPG or 60% SMI; automatic qualifiers for SSI/SNAP/TANF; priority for crisis vs. non-crisis.
- **Weatherization Assistance Program**: County-specific providers with localized application processes and offices; income at fixed 200% FPG Hawaii-adjusted; automatic eligibility via TANF/SSI/LIHEAP/HUD; priority-based access with funding caps leading to waitlists; measures from state priority list varying by home type.
- **Hawaii SHIP (State Health Insurance Assistance Program)**: no income/asset test; counseling-only service for Medicare navigation; volunteer-delivered statewide via phone/virtual; not a benefits-paying program
- **Home-Delivered Meals (via Kūpuna Aging in Place grantees)**: Decentralized via HCF grantees and county providers (16 nonprofits statewide); no uniform income table or assets; eligibility/assessment via local Aging offices; Oahu-heavy examples; varies by specific nonprofit (e.g., frozen vs. hot meals, delivery frequency)
- **Caregiver Support (via Executive Office on Aging)**: Administered statewide via 4 county AAAs with local contacts; no income/asset dollar limits specified; eligibility expands for special populations like grandparents 55+; distinguishes federal OAA FCSP (free/priority) from state Kupuna Care (needs/cost-share).
- **Retired Senior Volunteer Program (RSVP, related to SCSEP)**: County-operated with local operators; priority tiers for enrollment; income at 125% FPL (household-based); paid training not pure volunteer; separate from unpaid RSVP programs
- **Senior Legal Helpline (via Area Agencies on Aging)**: no income test for seniors 60+ on hotline in priority cases; phone-based only with toll-free access for islands; tied to Legal Aid Society, not direct AAA staffing; eligibility flexible for elders vs. strict for general clients
- **Long-Term Care Ombudsman Program (LTCOP)**: no income/asset test; advocacy-only for LTC facility residents; volunteer-driven with statewide access but Oahu-focused staffing; not a qualification-based benefit program
- **Kahi Malama – A Place of Caring**: County-specific ADRC under Area Agency on Aging; no strict income/asset tests, focuses on resource coordination for Big Island residents age 60+; dual offices (Hilo/Kona) with island-wide service
- **Elderly Affairs Division (EAD) / Honolulu ADRC**: This program's eligibility and benefits are highly individualized. There are no published income/asset limits, no published service hour maximums, and no published waitlist information. Eligibility determination requires both phone screening AND in-home assessment. Services vary by individual need rather than by tier or priority level. The program is strictly county-based, with Honolulu County served by EAD and other counties served by separate agencies. Functional impairment thresholds are specific (cognitive impairment OR 2+ ADL/IADL limitations) but application of these thresholds requires professional assessment.
- **Kaua'i Agency on Elderly Affairs**: Kaua'i Agency on Elderly Affairs administers two distinct programs (OAA Title III and Kupuna Care) with overlapping but different eligibility criteria. Eligibility is functional-need-based rather than income-based for Kupuna Care, though income affects cost-sharing. No published income thresholds, asset limits, or specific service hour/dollar amounts are available in public sources. Application is phone-based with in-home assessment required. This is a county-restricted program with no statewide availability.
- **Home and Community Services (Statewide via EOA)**: Eligibility / benefits via Med-QUEST HCBS waivers / managed care (NFLOC required); no dedicated EOA program details in sources—likely Medicaid Home and Community Based Services statewide; asset/income strict with care cost offsets; waitlists possible; no household income table or EOA-specific application.
- **Transportation Friends for Kupuna (TFK)**: TFK is a volunteer-based peer support program, not a means-tested benefit program. No income/asset limits are published. Eligibility focuses on functional need (mobility/cognitive issues) and social isolation (living alone with minimal support). Services are free but dependent on volunteer availability. Program requires advance notice (1-2 weeks) and is geographically restricted to Oahu. Catholic Charities Hawaii screens and trains volunteers (age 55+) to serve clients (age 60+).
- **Senior Companion Program**: Dual structure: recruits low-income senior volunteers (55+/60+) with stipends to serve frail elders (60+); statewide but Oahu-centric contact; no detailed income tables or processing times; volunteer-focused eligibility dominates sources.
- **Foster Grandparent Program**: Volunteer employment program for seniors serving special needs children; income-tested with annual federal poverty-based thresholds (no fixed table in sources); statewide but Oahu-centric contact; rules dated (1990s) but site reflects federal updates (age 55+)
- **Memory Mentor Program**: Volunteer-driven in-home support program with minimal formal eligibility tests; no income/asset requirements specified, focused on isolation and memory loss[4]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Hawaii?
