# Oklahoma Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 2.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
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
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 7 programs
- **financial**: 2 programs
- **in_kind**: 2 programs
- **unknown**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1305` → Source says `$1,235` ([source](https://oklahoma.gov/okdhs/services/health/help.html[4]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `- **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/deductibles for Parts A/B services[1][3].
- **SLMB**: Pays Medicare Part B premiums only[1][3].
- **QI**: Pays Medicare Part B premiums only[1][3].
Automatic qualification for Extra Help (low-income subsidy for Part D drugs)[5].` ([source](https://oklahoma.gov/okdhs/services/health/help.html[4]))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/health/help.html[4]`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2490` → Source says `$1,695` ([source](https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating: $40-$500 one-time payment to utility; Cooling: $150-$650; Crisis: up to $750. Varies by income, household size, fuel type, dwelling type[1][6].` ([source](https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html`

### Home-Delivered Meals (Meals on Wheels)

- **income_limit**: Ours says `$1980` → Source says `$1,330` ([source](https://oklahoma.gov/okdhs/services/cap/meals.html))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Hot, nutritious home-delivered meals (typically 1 per weekday, planned by Registered Dietitian per national guidelines; may include hot, cold, frozen, shelf-stable). No set dollar value; minimal client contribution in some private programs.` ([source](https://oklahoma.gov/okdhs/services/cap/meals.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/cap/meals.html`

### Legal Assistance for Seniors (Legal Aid Services of Oklahoma)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Civil legal assistance including representation, advice, and information by attorneys and paralegals for issues like those listed on LASO's areas of law page. Provided through Older Americans Act for seniors 60+. No specific dollar amounts or hours stated.` ([source](https://legalaidok.org/apply/))
- **source_url**: Ours says `MISSING` → Source says `https://legalaidok.org/apply/`

### ADvantage Waiver Program

- **min_age**: Ours says `65` → Source says `65 or older, or 19-64 with physical disability (no intellectual disability or cognitive impairment), or 19-64 with developmental disability (no intellectual disability or cognitive impairment related to it), or 19-64 with progressive degenerative disease requiring prior NF/hospital care[1][2][4][5][6]` ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]))
- **income_limit**: Ours says `$2901` → Source says `$2,199` ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services as alternative to nursing facility placement; specific services determined by case manager via individualized plan (e.g., to address ADLs/IADLs, promote independence); promotes choice and self-direction; no fixed dollar amounts or hours specified[1][5]` ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]`

## New Programs (Not in Our Data)

- **Oklahoma Medicaid SoonerCare** — service ([source](https://oklahoma.gov/ohca))
  - Shape notes: Eligibility splits by category (ABD, Nursing Home, HCBS) with different income/asset limits; functional assessments determine LTC benefits; MAGI for non-LTC, strict limits for LTC; varies by marital status and household size.
- **Home and Community-Based Services (HCBS) Waivers (ADvantage Waiver)** — service ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]))
  - Shape notes: Limited enrollment with statewide waitlist; tiered by age/disability type (65+ frail, 19-64 physical/DD without cognitive issues); financial tied to SoonerCare with annual FBR-based updates; NFLOC via UCAT III assessment
- **Programs of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://oklahoma.gov/ohca/individuals/programs-of-all-inclusive-care-for-the-elderly-pace.html))
  - Shape notes: Limited to specific provider service areas (not statewide); financial eligibility mirrors ADvantage Waiver (300% SSI income, $2,000 assets); requires both state nursing facility certification and provider IDT safety assessment; capitated all-inclusive model via regional PACE organizations
- **Supplemental Nutrition Assistance Program (SNAP)** — in_kind ([source](https://oklahoma.gov/okdhs/services/snap.html))
  - Shape notes: Elderly households (60+) have special rules: higher gross limit (165% FPL), net-only test option, $4,250 asset limit, medical deductions; benefits scale by household size and net income calculation
- **Respite Voucher Programs in Oklahoma** — unknown
  - Shape notes: Oklahoma operates three distinct respite voucher programs with non-overlapping eligibility criteria based primarily on care recipient age and condition type. Families must determine which program applies to their situation. The DDS program is the only one specifically for elderly caregivers of children with developmental disabilities. Income limits vary significantly ($0 to $90,000). Processing timelines and specific benefit amounts are not fully detailed in public sources. Regional variation exists primarily in contact methods (OKC vs. Tulsa for DDS; local AAA for OAA NFCSP).
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](oklahoma.gov/okdhs/services/cap/scsep.html[2]))
  - Shape notes: SCSEP is a statewide program with county-level variations in providers and host agencies. Benefits are fixed (20 hours/week at minimum wage) rather than scaled. Eligibility is based on a strict income threshold (125% of federal poverty level) rather than a sliding scale. The program is administered through multiple sub-contractors and national grantees, creating potential variation in application processes and wait times by region. Critical data gaps: specific dollar income thresholds by household size, processing times, waitlist information, and formal application forms are not provided in available sources.
- **Oklahoma Chore Services (Older Americans Act Title III)** — service ([source](https://oklahoma.gov/okdhs/services/cap/older-americans-act.html))
  - Shape notes: Administered regionally by 11 AAAs with needs-based assessment and priority tiers; no income/asset test; $150 annual materials cap
- **Senior Farmers’ Market Nutrition Program (SFMNP)** — in_kind ([source](https://oklahoma.gov/okdhs (Oklahoma Human Services); https://www.oksfmnp.org))
  - Shape notes: Tribally administered with higher benefits/earlier age in Native areas; state $50 fixed EBT, county-restricted, online-only app since 2022, funding-limited with seasonal operation.

## Program Details

### Oklahoma Medicaid SoonerCare

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For elderly (65+): Varies by program. Nursing Home Medicaid (single applicant): under $2,982/month. Aged, Blind, and Disabled (ABD) Medicaid (single): asset-related but income limit tied to SSI levels, specifics vary. MAGI-based for general SoonerCare up to 138% FPL (~$17,796/year individual). Full table not provided in sources; varies by household size, marital status, and program (e.g., children/pregnant women higher). Contact OHCA for 2026 household table.[1][5][6]
- Assets: Nursing Home Medicaid (single): $2,000 countable assets. ABD Medicaid (single): $9,950 countable assets. Countable assets typically include bank accounts, stocks; exempt: primary home (under equity limits), one vehicle, personal belongings, burial plots. Spousal protections apply if married.[1][6]
- Must be Oklahoma resident and U.S. citizen/eligible immigrant.
- For ABD: Aged 65+, blind, or disabled (SSA disability determination required).
- Nursing Home Level of Care (NFLOC) or functional need for ADLs/IADLs for long-term care.
- Not eligible for Medicare in some categories (e.g., expansion adults).

**Benefits:** Comprehensive healthcare: physician visits, prescription drugs, ER/hospital stays, long-term care (nursing home, HCBS waivers for home services like personal care, home modifications), dental/vision for some. ABD covers basic care; long-term care requires assessment. No-cost/low-cost via managed care (e.g., Aetna Better Health).[1][2][7]
- Varies by: priority_tier

**How to apply:**
- Online: OKDHSLive.org or oklahoma.gov/ohca (MySoonerCare)
- Phone: 1-800-987-7767
- Mail/In-person: Local DHS offices or OHCA (addresses via oklahoma.gov/okdhs)
- Forms: SoonerCare application via OKDHSLive.org (no specific form number listed)

**Timeline:** Lengthy and challenging; no exact timeline specified (can take weeks/months with documentation review).[6]
**Waitlist:** Possible for HCBS waivers due to limited slots; not specified for basic ABD.[1]

**Watch out for:**
- Separate rules for ABD vs. Nursing Home vs. HCBS; ABD has higher asset limit but basic coverage only unless LTC assessed.
- Must apply for SSA disability if not already determined.
- Spousal impoverishment rules protect community spouse assets/income.
- HCBS waivers have waitlists and NFLOC requirement.
- Income slightly over limits? Apply anyway for possible qualification.
- Documentation-heavy; incomplete apps delay processing.

**Data shape:** Eligibility splits by category (ABD, Nursing Home, HCBS) with different income/asset limits; functional assessments determine LTC benefits; MAGI for non-LTC, strict limits for LTC; varies by marital status and household size.

**Source:** https://oklahoma.gov/ohca

---

### Home and Community-Based Services (HCBS) Waivers (ADvantage Waiver)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 19-64 with physical disability (no intellectual disability or cognitive impairment related to developmental disability)+
- Income: Equivalent to 300% of Federal Benefit Rate (FBR); in 2025, up to $2,901/month per applicant regardless of marital status (each spouse individually if both applying). Older sources cite $2,199/month, but 2025 figure is $2,901[2]. Must qualify financially for SoonerCare Medicaid[3][4][5].
- Assets: Resource limit of $2,000 (countable assets). Home equity limit of $730,000 if applicant lives in home or has intent to return (2025). Exemptions: primary home if equity under limit or if spouse/dependent child lives there[2][3].
- Oklahoma resident and U.S. citizen/qualified immigrant[1]
- Nursing Facility Level of Care (NFLOC) via Uniform Comprehensive Assessment Tool (UCAT) III; physical impairment affecting ADLs/IADLs[1][2][3]
- At risk of nursing home placement; needs cannot be met without waiver services[2][5]
- Reside in own home or family member's home[4]
- Available waiver slot (limited enrollment)[3][6]
- Not solely for Medicaid eligibility[6]

**Benefits:** Home and community-based services as alternative to nursing facility placement, including those needed at least monthly to avoid institutionalization (specific services determined by individualized plan via case manager; promotes independence, choice, self-direction for frail elderly/disabled adults)[1][5][6]. Exact services not listed in sources but tailored to NFLOC needs.
- Varies by: priority_tier

**How to apply:**
- Call Oklahoma Human Services (OKDHS) or visit local county OKDHS office for assessment[3]
- Online: Oklahoma Human Services website (general application start)[1]
- Phone interview by Adult and Family Services specialist for financial eligibility; nurse assessment (phone or in-person) for medical[1][3]

**Timeline:** Not specified; includes financial interview, nurse assessment, case manager plan development[1][3]. Annual redetermination[3].
**Waitlist:** Yes; limited slots. If full, placed on waiting list until slot opens[3][6].

**Watch out for:**
- Limited waiver slots lead to waitlists; not guaranteed even if eligible[3][6]
- Developmentally disabled 19-64 must lack intellectual disability/cognitive impairment[1][2][4][5][6]
- Must need specific waiver services monthly to avoid institutionalization; not just for Medicaid[6]
- Income/asset limits updated annually (e.g., 2025: $2,901 income, $730k home equity)[2]
- Disabled participants can continue post-65, but age 65+ now includes those with IDD[2][5]

**Data shape:** Limited enrollment with statewide waitlist; tiered by age/disability type (65+ frail, 19-64 physical/DD without cognitive issues); financial tied to SoonerCare with annual FBR-based updates; NFLOC via UCAT III assessment

**Source:** https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]

---

### Programs of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Income must be equal to or less than 300% of the SSI Federal Benefit Rate (consistent with Oklahoma's HCBS programs like ADvantage Waiver). As of 2025, this is $2,901 per month for an individual; exact amounts may adjust annually with SSI rates and do not explicitly vary by household size in PACE documentation, though Medicaid long-term care rules apply[3][5].
- Assets: Assets valued at $2,000 or less for an individual (excluding primary home), per Medicaid long-term care eligibility standards applied to PACE[5]. What counts: countable assets like bank accounts, investments; exempt: primary home, one vehicle, personal belongings, burial plots.
- Live in a PACE service area (not statewide; limited to specific providers' regions)[1][2][3][4]
- Meet nursing facility level of care, determined by state via UCAT assessment[1][3]
- Able to live safely in the community as assessed by PACE interdisciplinary team (IDT)[1][2][3]
- Agree to use PACE provider and contractors as sole service providers (except emergencies)[1]

**Benefits:** Comprehensive all-inclusive services including primary care, hospital/inpatient care, emergency care, prescription drugs, social services, restorative therapies, nutritional counseling, transportation, personal care, adult day health center (with hot breakfast/lunch on center days), home care, and activities; PACE becomes sole source for Medicare/Medicaid-covered services[1][3][7][9]. No specific dollar amounts or hours per week stated; services tailored by IDT.
- Varies by: region

**How to apply:**
- Phone: 405-522-7044[3]
- Email: PACEInquiry@okhca.org[3]
- Contact PACE provider intake staff (e.g., LIFE PACE or Valir PACE) to initiate; they aid with OKDHS financial eligibility[1][2][4]

**Timeline:** Not specified; new medical level of care determination required if prior UCAT >6 months old[1]
**Waitlist:** Not mentioned in sources; may vary by provider/service area

**Watch out for:**
- Not available statewide—must live in a specific PACE provider's service area[2][3][4]
- Must use PACE as sole provider (no other services except emergencies); financially liable for unauthorized care[1]
- Nursing home level of care required, but must be safe in community with PACE support—IDT can deny if not[1][3]
- Financial eligibility tied to Medicaid HCBS (300% SSI income limit), not automatic for all Medicare enrollees[3][5]
- Cannot be enrolled in Medicare Advantage, hospice, or certain other programs[6]

**Data shape:** Limited to specific provider service areas (not statewide); financial eligibility mirrors ADvantage Waiver (300% SSI income, $2,000 assets); requires both state nursing facility certification and provider IDT safety assessment; capitated all-inclusive model via regional PACE organizations

**Source:** https://oklahoma.gov/ohca/individuals/programs-of-all-inclusive-care-for-the-elderly-pace.html

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Oklahoma-specific monthly income limits (likely current as of search data; verify with OKDHS for 2026 updates):
- **QMB**: $1,235 single, $1,663 married couple[3].
- **SLMB**: Above QMB up to $1,478 single, $1,992 married couple[3].
- **QI**: Above SLMB up to $1,660 single, $2,239 married couple[3].
Federal 2026 baselines are higher (QMB: $1,350 single/$1,824 couple), but states set their own; Oklahoma uses stricter limits[3][5]. Limits based on Federal Poverty Level, updated April 1 annually[1].
- Assets: Federal limits apply in Oklahoma: $9,090 single, $13,630 married couple for QMB, SLMB, QI. Counts typical countable resources (cash, bank accounts, stocks); exempts home, one car, personal belongings, burial plots (exact exemptions per federal Medicaid rules; confirm with OKDHS)[3].
- Must be eligible for Medicare Part A (even if not enrolled for QMB)[1].
- Must have Medicare Part A and B for SLMB and QI[5].
- U.S. citizen or qualified immigrant.
- Oklahoma resident.

**Benefits:** - **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/deductibles for Parts A/B services[1][3].
- **SLMB**: Pays Medicare Part B premiums only[1][3].
- **QI**: Pays Medicare Part B premiums only[1][3].
Automatic qualification for Extra Help (low-income subsidy for Part D drugs)[5].
- Varies by: program_tier

**How to apply:**
- In-person or phone: Local OKDHS Human Services Center (find via oklahoma.gov/okdhs or call 405-521-3646 for nearest)[4].
- No specific online URL or form number listed; apply through OKDHS Medicaid agency[1][4].
- Mail possible via local center.

**Timeline:** Not specified in sources; typically state Medicaid processing (contact OKDHS for current times)[1].
**Waitlist:** QI has first-come, first-served with priority to prior-year recipients; limited funds may create waitlist[5].

**Watch out for:**
- Oklahoma uses stricter income limits than federal baselines; check state-specific amounts[3].
- QI requires annual reapplication, first-come-first-served, and excludes those eligible for other Medicaid[5].
- Asset test applies (unlike some states with no limit)[1][3].
- Must apply to state Medicaid agency, not Medicare directly[1].
- Limits update April 1; verify current via OKDHS Appendix C-1[1][4].

**Data shape:** Tiered by program (QMB/SLMB/QI) with Oklahoma-specific income caps below federal; asset limits fixed federally but applied statewide; QI funding-capped with annual renewal and priority queue.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/health/help.html[4]

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with elderly (60+) or disabled members in Oklahoma (Oct 1, 2025 - Sep 30, 2026): Gross income limit of 165% FPL; Net income limit of 100% FPL. Seniors 60+ only need to meet the net income test. Examples: $15,060 net for 1 person; $20,440 net for 2 people (2025 figures). Full table example from Hunger Free Oklahoma: Base $5,867 gross for 8 persons, +$596 per additional; households with 60+ may qualify with higher gross incomes[1][2][4][5].
- Assets: Countable resources limited to $4,250 if household has member 60+ or disabled ($2,750 otherwise). Counts: cash, bank accounts. Exempt: home and land, most retirement/pension plans (withdrawals count as income), household goods[2].
- U.S. citizen or qualified non-citizen
- Social Security number for all household members
- Meet work requirements (unemployed adults ages 18-53; exemptions for 60+)
- Household defined as those who buy/prepare food together
- Live in Oklahoma

**Benefits:** Monthly EBT card for food purchases (groceries, not hot foods/alcohol/tobacco). Amount based on net income, household size, deductions (e.g., medical costs for seniors). Minimum $24 for 1-2 person households. Example: 2-person elderly household might get $415 after calculation[2][5][8].
- Varies by: household_size

**How to apply:**
- Online: OKDHSLive! at https://www.okdhslive.org/
- Phone: 1-877-760-0114 (toll-free)
- In-person: Local OKDHS offices
- Mail: Send application to local OKDHS office

**Timeline:** Interview required; typically 30 days for regular, 7 days for expedited if very low income. Applying takes ~20 minutes to start[2][4][6].

**Watch out for:**
- Seniors 60+ exempt from gross income test (only net test needed), but all income like Social Security counts[1][5]
- Medical expenses over $35/month deductible for seniors/disabled, often key for eligibility[1][2]
- Household must include all who buy/prepare food together; elderly unable to do so separately may qualify as separate[2][5]
- Work rules don't apply to 60+, but verify for younger household members[3]
- Assets exempt for home/retirement, but cash/bank counts[2]
- Changes from One Big Beautiful Bill Act of 2025 may affect work/non-citizen rules[5]

**Data shape:** Elderly households (60+) have special rules: higher gross limit (165% FPL), net-only test option, $4,250 asset limit, medical deductions; benefits scale by household size and net income calculation

**Source:** https://oklahoma.gov/okdhs/services/snap.html

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly income must be at or below 130% of federal poverty level: 1 person $1,695; 2 people $2,291; 3 people $2,887; 4 people $3,482; 5 people $4,079; 6 people $4,674. Everyone under the same roof sharing a utility meter counts as household, even if not sharing expenses[1][2].
- Assets: Eligibility based on available resources, but no specific dollar limits or exemptions detailed in sources[6].
- Responsible for home energy payment (household ineligible if non-resident pays utility directly)[2][6].
- US citizen or legal permanent resident[2].
- One application per household per program component[2].
- Tribal members may choose OKDHS or tribal program, but not both in same federal fiscal year[2][6].

**Benefits:** Heating: $40-$500 one-time payment to utility; Cooling: $150-$650; Crisis: up to $750. Varies by income, household size, fuel type, dwelling type[1][6].
- Varies by: household_size|priority_tier

**How to apply:**
- Online: www.okdhslive.org or www.OKDHSLive.org[2][6][8].
- Phone: (405) 522-5050 (select energy assistance; for life-threatening crisis referral)[2][6].
- In-person/mail: Local Oklahoma Human Services offices (specific addresses via OKDHS)[2].

**Timeline:** Up to 60 calendar days for heating/cooling; crisis evaluated individually[2].
**Waitlist:** Funding distributed by priority (e.g., elders, young children first) until exhausted; no formal waitlist mentioned[3].

**Watch out for:**
- Household includes all under same roof/utility meter, even non-expense sharers; must apply together[1][2].
- Only one payment per component per household; tribal/OKDHS cannot both be used same fiscal year[2][6].
- Not year-round: heating Dec-Feb, cooling summer, crisis/emergency only[1][2].
- Application does not guarantee benefits; eligibility determined post-submission[8].
- Someone else paying utility directly disqualifies household[2].

**Data shape:** Statewide via OKDHS with tribal alternatives; benefits scale by household size, income, fuel; priority to elders/children; seasonal components (heating/cooling/crisis); household defined by utility meter

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html

---

### Home-Delivered Meals (Meals on Wheels)


**Eligibility:**
- Age: 60+
- Income: No strict income limits under Older Americans Act (OAA) program; priority given to those below 2026 poverty guidelines ($1,330/month individual, $1,803/month couple) in some areas like Oklahoma City. ADvantage Waiver has limited income/resources (varies, determined by DHS caseworker).
- Assets: No asset limits for OAA program. ADvantage has resource limits assessed by DHS caseworker, but specifics not detailed; primary residence and one vehicle typically exempt in similar programs.
- Homebound (unable to leave home without assistance; not eligible if can use taxi/friend's car or if household member can prepare meals/drive)
- No one available to provide meal preparation assistance
- Disability for under 60 if living with eligible 60+ participant
- Spouse of participant if in best interest per AAA
- For ADvantage: nursing home level of care, Medicaid eligible

**Benefits:** Hot, nutritious home-delivered meals (typically 1 per weekday, planned by Registered Dietitian per national guidelines; may include hot, cold, frozen, shelf-stable). No set dollar value; minimal client contribution in some private programs.
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) or Meals on Wheels provider (e.g., Oklahoma City: mealsonwheelsokc.org/applyforservices)
- Phone varies by region (e.g., Oklahoma City Meals on Wheels association)
- Complete intake form (in-person or via provider)
- For ADvantage: local DHS county office caseworker

**Timeline:** Varies; eligibility determination by AAA/provider upon application.
**Waitlist:** Common; e.g., ~2 months in Oklahoma City due to limited capacity.

**Watch out for:**
- Not automatic; must apply via local provider/AAA, often waitlisted due to funding/capacity limits (no federal/state funding for some private Meals on Wheels)
- Homebound strictly defined—can leave with help? Likely ineligible
- Under 60 generally ineligible unless living with 60+ eligible
- OAA free/no income test, but ADvantage has financial/medical hurdles; private options charge ~$9/meal
- Weekday only (Mon-Fri), no weekends

**Data shape:** Decentralized by local AAA/providers; no uniform statewide income test under OAA, but priority tiers and waitlists vary regionally; overlaps with ADvantage Waiver for higher-need cases

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/cap/meals.html

---

### Respite Voucher Programs in Oklahoma

> **NEW** — not currently in our data

**Data shape:** Oklahoma operates three distinct respite voucher programs with non-overlapping eligibility criteria based primarily on care recipient age and condition type. Families must determine which program applies to their situation. The DDS program is the only one specifically for elderly caregivers of children with developmental disabilities. Income limits vary significantly ($0 to $90,000). Processing timelines and specific benefit amounts are not fully detailed in public sources. Regional variation exists primarily in contact methods (OKC vs. Tulsa for DDS; local AAA for OAA NFCSP).

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[4][5]. The search results do not provide specific dollar amounts by household size, as federal poverty guidelines change annually. Families should contact the program directly or consult current federal poverty guidelines to determine their exact threshold.
- Assets: Not specified in available search results.
- Must be unemployed[4][5]
- Must show proof of residency[1]
- Must show proof of age[1]
- Must show proof of income[1]

**Benefits:** Subsidized, part-time paid work-based training at federal minimum wage (currently $7.25/hour as of search results)[3], averaging 20 hours per week[3][4]. Participants gain work experience, on-the-job training in computer or vocational skills, and professional job placement assistance to transition to unsubsidized employment[7]. The program does not offer permanent employment but trains participants to secure it[3].
- Varies by: fixed

**How to apply:**
- Phone: 405-521-2281 (Oklahoma Department of Human Services – Aging Services)[1]
- Phone: 405-522-5050 (Program Field Representative Larry Bartels; select 1 or 2 for English/Spanish, then 4 for Community Living/Aging/Adult Protective Services)[2]
- Email: Larry.Bartels@okdhs.org[2]
- Website: oklahoma.gov/okdhs/services/cap/scsep.html (contains statewide map with county-specific contact information)[5]
- In-person: Contact county-specific SCSEP office through statewide map on website[5]

**Timeline:** Not specified in available search results.
**Waitlist:** Not specified in available search results.

**Watch out for:**
- This is NOT permanent employment — it is subsidized training designed as a bridge to unsubsidized work[3][6]. Families should understand participants must actively seek permanent employment.
- Income limit is strict: 125% of federal poverty level, not a percentage of median income[4][5]. This is significantly lower than many other assistance programs.
- Enrollment priority is given to specific groups: veterans and qualified spouses receive first priority, followed by those over 65, with disabilities, with low literacy, with limited English proficiency, in rural areas, homeless or at risk of homelessness, with poor employment prospects, or who have exhausted American Job Center services[4]. Non-priority applicants may face longer waits.
- The program provides only part-time work (average 20 hours/week)[3][4], not full-time employment. This may not meet all household income needs.
- Minimum wage is the only guaranteed compensation — currently $7.25/hour federally[3], though state or local minimums may be higher.
- Coverage varies significantly by county — some areas have multiple providers while others are served by national grantees. Availability and responsiveness may differ.
- The search results do not specify processing times, waitlist lengths, or whether slots are limited by county, which could affect access.

**Data shape:** SCSEP is a statewide program with county-level variations in providers and host agencies. Benefits are fixed (20 hours/week at minimum wage) rather than scaled. Eligibility is based on a strict income threshold (125% of federal poverty level) rather than a sliding scale. The program is administered through multiple sub-contractors and national grantees, creating potential variation in application processes and wait times by region. Critical data gaps: specific dollar income thresholds by household size, processing times, waitlist information, and formal application forms are not provided in available sources.

**Source:** oklahoma.gov/okdhs/services/cap/scsep.html[2]

---

### Legal Assistance for Seniors (Legal Aid Services of Oklahoma)


**Eligibility:**
- Age: 60+
- Income: Generally at or below 125% of the federal poverty guidelines, calculated by household size and income. Seniors age 60 and over qualify up to 200% of the federal poverty level with qualifying income exceptions. Exact dollar amounts vary annually with federal poverty guidelines (e.g., 2024 guidelines referenced); no specific table provided in sources but based on household size. Assets considered on a case-by-case basis.
- Assets: Determined on a case-by-case basis by each legal services program; no specific limits or exemptions detailed.
- Low-income civil legal issues only (non-criminal)
- Must pay all court costs and service fees
- Does not serve prisoners

**Benefits:** Civil legal assistance including representation, advice, and information by attorneys and paralegals for issues like those listed on LASO's areas of law page. Provided through Older Americans Act for seniors 60+. No specific dollar amounts or hours stated.
- Varies by: priority_tier

**How to apply:**
- Online: https://bit.ly/46fSE13 (fill out application and click submit; check email; call to complete if needed)
- Phone: 1-888-534-5243 or 918-428-4357 (Mon-Thu 9am-4pm; do not leave voicemail)
- Seniors-specific helpline: Oklahoma Sixty-Plus Legal Aid Services Helpline (OK-SPLASH) at 1-855-488-6814
- In-person: LASO offices (e.g., Hugo Law Office, Oklahoma City Law Office)

**Timeline:** Not specified; intake specialist decides after gathering income, household size, and legal issue details.

**Watch out for:**
- Calls only answered Mon-Thu 9am-4pm; no voicemails
- Must pay court costs and service fees even if eligible
- Assets reviewed case-by-case beyond income
- Limited capacity; not all qualifying cases accepted due to LSC restrictions and high demand
- Civil matters only; no criminal cases or prisoners

**Data shape:** Seniors 60+ get higher income threshold (up to 200%); statewide with 18 regional offices and slight guideline variations; funded by LSC and Older Americans Act; case acceptance not guaranteed even if eligible

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://legalaidok.org/apply/

---

### ADvantage Waiver Program


**Eligibility:**
- Age: 65 or older, or 19-64 with physical disability (no intellectual disability or cognitive impairment), or 19-64 with developmental disability (no intellectual disability or cognitive impairment related to it), or 19-64 with progressive degenerative disease requiring prior NF/hospital care[1][2][4][5][6]+
- Income: Must qualify financially for SoonerCare (Oklahoma Medicaid); countable monthly income limit $2,199 (subject to change); determined by OKDHS Adult and Family Services via interview; no household size table specified in sources[4]
- Assets: Resource limit $2,000 (subject to change); home equity interest no greater than $730,000 in 2025 if living in home or intent to return (home value minus mortgage); home exempt if spouse, minor child under 21, or permanently disabled/blind child lives there; figures subject to change[2][4]
- Oklahoma resident and US citizen or qualified immigrant[1]
- Nursing Facility Level of Care (NFLOC) via OHS Uniform Comprehensive Assessment Tool (UCAT) III; physical impairment creating barriers to ADLs/IADLs (e.g., bathing, mobility, meal prep)[1][2][4]
- Reside in own home or family member's home; needs safely met with waiver services and supports[3]
- Disabled by SSA or meet medical criteria; not solely for Medicaid eligibility; must need at least one waiver service monthly to avoid institutionalization[3][6]

**Benefits:** Home and community-based services as alternative to nursing facility placement; specific services determined by case manager via individualized plan (e.g., to address ADLs/IADLs, promote independence); promotes choice and self-direction; no fixed dollar amounts or hours specified[1][5]
- Varies by: priority_tier

**How to apply:**
- Call OKDHS contact line or visit local county OKDHS office for assessment[4]
- Online: Oklahoma Human Services website (oklahoma.gov/okdhs)[1][5]
- Phone or in-person assessment by OKDHS nurse (medical) and social worker (financial)[1][4]

**Timeline:** Not specified; annual redetermination of eligibility[4]
**Waitlist:** Limited slots; if full, placed on statewide waiting list until slot opens[4][6]

**Watch out for:**
- Limited waiver slots lead to waitlist; not guaranteed immediate access[4][6]
- Developmentally disabled 19-64 excluded if intellectual disability or cognitive impairment[1][2][3][5][6]
- Home equity limit $730,000 (2025); potential estate recovery on home[2]
- Must need NFLOC and specific waiver services monthly; dementia alone insufficient[2][6]
- Income/assets subject to change; annual redetermination required[4]

**Data shape:** Limited enrollment slots with statewide waitlist; financial eligibility tied to SoonerCare Medicaid (income $2,199/mo, assets $2,000); NFLOC via UCAT III assessment; excludes intellectual/cognitive impairments for younger disabled; home equity cap applies

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/cap/advantage-services.html[5]

---

### Oklahoma Chore Services (Older Americans Act Title III)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or verification required. Services prioritize those with greatest economic or social need, low-income minorities, rural residents, severe disabilities, or at risk for institutional placement, but open to all[1][2].
- Assets: No asset limits or verification required[2].
- Difficulty with one or more Instrumental Activities of Daily Living (IADLs)[1]
- Must own and live in the home where services are needed[1]
- Assessed by Area Agency on Aging (AAA) for needs[1][2]

**Benefits:** Heavy housework, yard work, or sidewalk maintenance. Up to $150 per year for materials and disposable supplies to complete tasks[1].
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or in-person for assessment. Statewide Aging Services: oklahoma.gov/okdhs/services/cap/older-americans-act.html[1]
- ASCOG AAA example: www.ascog.org/supportive-services/ or contact provider directly to confirm eligibility[3]

**Timeline:** Initial needs assessment by AAA; annual review if needs change. No specific statewide timeline stated[1].
**Waitlist:** Not mentioned; may vary by AAA and region[1][3].

**Watch out for:**
- Not limited to low-income, but priority given to greatest need; may ask for income info only for other programs[1][2]
- Must have IADL difficulty and live in own home[1]
- Services free but donations accepted; annual reassessment required[1][2]
- Apply through local AAA, not centralized state office[1][3]

**Data shape:** Administered regionally by 11 AAAs with needs-based assessment and priority tiers; no income/asset test; $150 annual materials cap

**Source:** https://oklahoma.gov/okdhs/services/cap/older-americans-act.html

---

### Senior Farmers’ Market Nutrition Program (SFMNP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income must not exceed 185% of the federal poverty income guidelines. Exact dollar amounts vary by household size and are updated annually by the USDA; families should check current guidelines at the application site (oksfmnp.org) or USDA poverty guidelines. Native Americans may qualify at age 55 in tribal programs like Choctaw or Chickasaw Nations.[1][2][3]
- Assets: No asset limits mentioned in state or tribal programs.[1][2][3]
- At least one household member must be 60+ (55+ for Native Americans in state/tribal programs).
- Reside in Oklahoma and participating counties (state program).
- Tribal variations: Choctaw Nation service area residents; Chickasaw citizens 55+ get priority; non-Native 60+ in Native households may qualify.
- Proof of income via pay stubs (30 days), tax returns, SNAP letter, or commodities letter.
- ID required; tribal card/CDIB for Natives.

**Benefits:** $50 EBT debit card per eligible senior/household for fresh, locally grown fruits, vegetables, herbs, and honey at authorized farmers' markets, roadside stands (May-November). Tribal programs may provide $50-$100.[1][4][6][7][8]
- Varies by: priority_tier

**How to apply:**
- Online: www.oksfmnp.org (primary state method).
- Phone/email: okfarmersmarkets@ouhsc.edu for questions.
- Tribal: Download/print/mail/email forms from Choctaw Nation sites or visit community centers (Feb 1 start); Chickasaw Nutrition Centers (June 1 start).
- In-person: Oklahoma Human Services offices, tribal community/nutrition centers, DHS for EBT issuance.

**Timeline:** Real-time status updates online; EBT card issued after approval (timeline not specified, apply early as funding depletes).[2][6]
**Waitlist:** No waitlist mentioned; benefits until funding depleted (e.g., through Sept 30 or Nov 30).[1][7]

**Watch out for:**
- Not fully statewide—must confirm participating counties and tribal boundaries.
- Funding limited, depletes before season end (apply early Feb/June).
- Tribal programs have separate eligibility/benefits—check if in Choctaw/Chickasaw area for higher $100 benefit.
- EBT card only for eligible produce/honey/herbs at authorized markets—no other uses.
- Native Americans qualify younger (55) but need tribal verification.
- Income docs must be current; no asset test but strict 185% FPL.

**Data shape:** Tribally administered with higher benefits/earlier age in Native areas; state $50 fixed EBT, county-restricted, online-only app since 2022, funding-limited with seasonal operation.

**Source:** https://oklahoma.gov/okdhs (Oklahoma Human Services); https://www.oksfmnp.org

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Oklahoma Medicaid SoonerCare | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| Programs of All-Inclusive Care for the E | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Home-Delivered Meals (Meals on Wheels) | benefit | federal | deep |
| Respite Voucher Programs in Oklahoma | benefit | state | simple |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors (Legal Aid  | resource | state | simple |
| ADvantage Waiver Program | benefit | state | deep |
| Oklahoma Chore Services (Older Americans | benefit | state | deep |
| Senior Farmers’ Market Nutrition Program | benefit | local | deep |

**Types:** {"benefit":11,"employment":1,"resource":1}
**Scopes:** {"state":6,"local":2,"federal":5}
**Complexity:** {"deep":11,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/OK/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **region**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Oklahoma Medicaid SoonerCare**: Eligibility splits by category (ABD, Nursing Home, HCBS) with different income/asset limits; functional assessments determine LTC benefits; MAGI for non-LTC, strict limits for LTC; varies by marital status and household size.
- **Home and Community-Based Services (HCBS) Waivers (ADvantage Waiver)**: Limited enrollment with statewide waitlist; tiered by age/disability type (65+ frail, 19-64 physical/DD without cognitive issues); financial tied to SoonerCare with annual FBR-based updates; NFLOC via UCAT III assessment
- **Programs of All-Inclusive Care for the Elderly (PACE)**: Limited to specific provider service areas (not statewide); financial eligibility mirrors ADvantage Waiver (300% SSI income, $2,000 assets); requires both state nursing facility certification and provider IDT safety assessment; capitated all-inclusive model via regional PACE organizations
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with Oklahoma-specific income caps below federal; asset limits fixed federally but applied statewide; QI funding-capped with annual renewal and priority queue.
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly households (60+) have special rules: higher gross limit (165% FPL), net-only test option, $4,250 asset limit, medical deductions; benefits scale by household size and net income calculation
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Statewide via OKDHS with tribal alternatives; benefits scale by household size, income, fuel; priority to elders/children; seasonal components (heating/cooling/crisis); household defined by utility meter
- **Home-Delivered Meals (Meals on Wheels)**: Decentralized by local AAA/providers; no uniform statewide income test under OAA, but priority tiers and waitlists vary regionally; overlaps with ADvantage Waiver for higher-need cases
- **Respite Voucher Programs in Oklahoma**: Oklahoma operates three distinct respite voucher programs with non-overlapping eligibility criteria based primarily on care recipient age and condition type. Families must determine which program applies to their situation. The DDS program is the only one specifically for elderly caregivers of children with developmental disabilities. Income limits vary significantly ($0 to $90,000). Processing timelines and specific benefit amounts are not fully detailed in public sources. Regional variation exists primarily in contact methods (OKC vs. Tulsa for DDS; local AAA for OAA NFCSP).
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a statewide program with county-level variations in providers and host agencies. Benefits are fixed (20 hours/week at minimum wage) rather than scaled. Eligibility is based on a strict income threshold (125% of federal poverty level) rather than a sliding scale. The program is administered through multiple sub-contractors and national grantees, creating potential variation in application processes and wait times by region. Critical data gaps: specific dollar income thresholds by household size, processing times, waitlist information, and formal application forms are not provided in available sources.
- **Legal Assistance for Seniors (Legal Aid Services of Oklahoma)**: Seniors 60+ get higher income threshold (up to 200%); statewide with 18 regional offices and slight guideline variations; funded by LSC and Older Americans Act; case acceptance not guaranteed even if eligible
- **ADvantage Waiver Program**: Limited enrollment slots with statewide waitlist; financial eligibility tied to SoonerCare Medicaid (income $2,199/mo, assets $2,000); NFLOC via UCAT III assessment; excludes intellectual/cognitive impairments for younger disabled; home equity cap applies
- **Oklahoma Chore Services (Older Americans Act Title III)**: Administered regionally by 11 AAAs with needs-based assessment and priority tiers; no income/asset test; $150 annual materials cap
- **Senior Farmers’ Market Nutrition Program (SFMNP)**: Tribally administered with higher benefits/earlier age in Native areas; state $50 fixed EBT, county-restricted, online-only app since 2022, funding-limited with seasonal operation.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Oklahoma?
