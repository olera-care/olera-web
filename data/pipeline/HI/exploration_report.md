# Hawaii Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 1.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 14 |
| New (not in our data) | 13 |
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

- **service**: 8 programs
- **unknown**: 1 programs
- **financial**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Med-QUEST Home and Community-Based Services (HCBS) Waivers

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services (HCBS) as alternatives to institutional care, including person-centered supports identified via planning process. Specific services via providers or Consumer-Directed (CD) Option; examples not exhaustively listed but cover needs for target groups like I/DD (e.g., case management coordination). No fixed dollar amounts or hours specified; tied to assessed needs[1][2].` ([source](https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]))
- **source_url**: Ours says `MISSING` → Source says `https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]`

## New Programs (Not in Our Data)

- **Hawai'i PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-17-1746-11 (Hawaii Administrative Rules § 17-1746-11)))
  - Shape notes: Hawaii PACE eligibility is defined by state regulation (Haw. Code R. § 17-1746-11) with specific acuity level requirements and QUEST program exclusion. However, critical operational details—provider locations, service areas, contact information, processing timelines, and specific application procedures—are not available in the search results. The program appears to be geographically restricted by provider service areas, but the number and location of providers are not specified. Income and asset limits are not explicitly stated in Hawaii regulations, suggesting they may follow federal Medicaid standards or be individually assessed.
- **Medicare Savings Programs (QMB, SLMB, QI)** — unknown ([source](https://medquest.hawaii.gov/content/medquest/en/members-applicants/get-started/programs.html[10]))
  - Shape notes: Hawaii's Medicare Savings Programs are administered as a single Medicaid eligibility group with three tiers (QMB, SLMB, QI) based on income level. The key distinguishing feature is that Hawaii has raised income limits above federal standards for all three programs, making them more accessible than in most other states. QI differs from QMB and SLMB in that it operates on a first-come, first-served basis and requires annual reapplication. Benefits scale by program tier: QMB covers the most (premiums, deductibles, copayments), while SLMB and QI cover Part B premiums only. The search results lack critical operational details (phone numbers, specific office locations, processing times, detailed application procedures) that families would need for actual application.
- **SNAP (Supplemental Nutrition Assistance Program)** — financial ([source](https://humanservices.hawaii.gov/bessd/snap/))
  - Shape notes: Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); no asset test under BBCE but federal fallback for high-gross elderly/disabled households; statewide with ESAP option for seniors.
- **Hawaii Home Energy Assistance Program (H-HEAP, formerly LIHEAP)** — financial ([source](https://www.hawaiianelectric.com/billing-and-payment/payment-assistance/low-income-programs/h-heap))
  - Shape notes: This program is geographically fragmented with different application methods and providers by island/county, creating significant regional variation in accessibility. The application window is extremely narrow (30 days annually), making timing critical. Benefits are one-time payments with unspecified dollar amounts. The program serves as a safety valve for utility crises rather than ongoing assistance. Eligibility is income-based with an automatic pathway for households receiving other safety-net benefits, but documentation requirements are extensive. No asset limits are disclosed, suggesting they may not apply or may be determined case-by-case.
- **Sage PLUS (SHIP - State Health Insurance Assistance Program)** — service ([source](https://www.hawaiiship.org))
  - Shape notes: no income or asset test; volunteer counseling service only, not benefits-paying program; statewide uniform access via phone/virtual with no formal application
- **Home-Delivered Meals (Meals on Wheels)** — service ([source](No single statewide .gov site; key providers: hmow.org (Hawaii Meals on Wheels), lanakilapacific.org (Lanakila Pacific). State resources via humanservices.hawaii.gov or aging.hawaii.gov (not directly cited).[6]))
  - Shape notes: Multiple independent providers (not centralized state program); Oahu-heavy; no fixed income/asset tests but priority-based; varies by provider on delivery frequency/payment.
- **Executive Office on Aging Family Caregiver Support Program** — service ([source](https://health.hawaii.gov/eoa/))
  - Shape notes: Administered statewide via 4 county AAAs with priority tiers for greatest needs; no fixed income/asset tests but funding-limited; benefits include caregiver-specific respite/counseling plus linkages
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://labor.hawaii.gov/wdd/job-seekers/scsep/))
  - Shape notes: Income at 125% federal poverty level (family-based, annual update); priority enrollment tiers; statewide with county sub-providers and varying host agencies; no fixed processing times or asset limits specified
- **Legal Aid Society of Hawaii Elder Law Program** — service ([source](https://www.legalaidhawaii.org/elder-law-services.html))
  - Shape notes: Statewide with island-specific intake lines; no detailed income/asset tables or forms listed; priority-based allocation due to high demand (serves 18,000+ clients yearly across Legal Aid)[5][7]; distinct from UHELP which is Oahu-restricted academic clinic
- **Long-Term Care Ombudsman Program (LTCOP)** — advocacy ([source](https://health.hawaii.gov/eoa/home/long-term-care-ombudsman-program/))
  - Shape notes: no income test; advocacy-only for LTC facility residents statewide; volunteer-driven with certification requirements; free and open to all qualifying residents without financial barriers
- **Kūpuna Aging in Place (KAP)** — service ([source](https://www.hawaiicommunityfoundation.org/strengthening/kupuna-aging-in-place))
  - Shape notes: Grant-funded via Hawaiʻi Community Foundation to nonprofits; not a direct government entitlement program; benefits via provider networks with individual care plans and financial intake; age 65+ focus distinguishes from 60+ state programs
- **Kūpuna Care Program** — service ([source](Hawaii Revised Statutes § 349-17 (law.justia.com/codes/hawaii/title-20/chapter-349/section-349-17/); Hawaii Department of Human Services Elderly Affairs Division))
  - Shape notes: This program has two distinct service delivery models: traditional service delivery OR participant-directed services and support, based on individualized support plans[1]. Benefits scale by priority tier (economic need, social need, institutional placement risk) rather than by household size. No specific income or asset limits are documented in available sources, making this a needs-based rather than means-tested program. The program serves three populations: care recipients (frail older adults), caregivers (family members), and employed caregivers (working individuals providing direct care). Employed caregivers have a separate benefit structure ($70/day maximum) distinct from care recipients. Regional implementation varies through area agencies on aging, but no specific county-level variations are documented.
- **Senior Food Box Program (CSFP)** — in_kind ([source](https://labor.hawaii.gov/ocs/service-programs-index/federal-food-assistance-programs/csfp/))
  - Shape notes: This program's data structure is unique in that: (1) Hawaii's income limit (150% FPL) is higher than the national baseline (130% FPL)[3][4], (2) it operates on a caseload assignment system with limited slots (3,226 for FFY 2024)[3], creating a waitlist dynamic, (3) it requires county-level residency verification[3], (4) it is exclusively for seniors 60+ following 2014 legislative changes[4], and (5) recertification frequency may vary (sources cite both 6 months and 12 months—verify current requirement). The program is administered by Hawaii Department of Labor with Hawaii Foodbank as the primary provider for Oahu[1][3].

## Program Details

### Med-QUEST Home and Community-Based Services (HCBS) Waivers


**Eligibility:**
- Income: Must meet Med-QUEST Medicaid financial eligibility, which varies by program and category. For seniors (65+), low-income thresholds apply with pathways like up to 138% FPL for adults or higher for children; exact 2026 dollar amounts not specified in sources but asset-tested for long-term care. For single nursing home applicants (relevant to HCBS level of care), nearly all monthly income contributes to care costs[3][5][6].
- Assets: For seniors 65+, blind, or disabled seeking long-term care HCBS, assets under $2,000 for singles (no asset limits for children or adults under 65). Counts typical countable assets; exemptions not detailed but standard Medicaid rules apply (e.g., primary home often exempt up to equity limits)[3][5][6].
- Medicaid eligible through Med-QUEST Division[2][4].
- Eligible for specific division services, e.g., Developmental Disabilities Division (DDD) for I/DD waiver[2][4].
- Meet nursing home level of care (NHLOC) or equivalent institutional level of care[1][3].
- For DDD HCBS waiver: Eligible for DDD services and case management[2][4].
- Functional need in activities of daily living (ADLs); additional criteria for some benefits like home modifications[3].

**Benefits:** Home and community-based services (HCBS) as alternatives to institutional care, including person-centered supports identified via planning process. Specific services via providers or Consumer-Directed (CD) Option; examples not exhaustively listed but cover needs for target groups like I/DD (e.g., case management coordination). No fixed dollar amounts or hours specified; tied to assessed needs[1][2].
- Varies by: priority_tier

**How to apply:**
- Online at My Medical Benefits (medquest.hawaii.gov)[5][7].
- Phone: 1-877-628-5076 or 1-800-316-8005[5][6].
- Paper application (fill out and mail/submit)[5].
- For DDD waiver: Contact Developmental Disabilities Division after Medicaid eligibility[2].
- HCBS Waiver Application form (1915(c))[1].

**Timeline:** Not specified in sources.
**Waitlist:** Implied by limited slots in 1915(c) waivers, but no specific details[1][2].

**Watch out for:**
- Multiple HCBS waivers exist (e.g., I/DD-specific via DDD); not a single elderly-focused waiver—must identify target group[1][2].
- Requires both Medicaid eligibility AND division-specific eligibility (e.g., DDD) AND level of care[2][4].
- Financial rules vary by marital status, annually update, and have spend-down paths[3].
- Asset limits apply only to certain groups (65+, blind/disabled); NHLOC required for HCBS[3][5].
- Services person-centered but provider/coordinator-dependent; waitlists likely due to waiver caps[1].

**Data shape:** Multiple target-group waivers under Med-QUEST (e.g., I/DD via DDD); eligibility layered (Medicaid + division + LOC); no single elderly waiver specified, benefits need-assessed not fixed-dollar; statewide but division-specific.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]

---

### Hawai'i PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Not specified in available sources. Search results indicate that PACE programs generally do not apply financial criteria for eligibility determination, though most participants are dually eligible for Medicare and Medicaid, which have their own income thresholds.
- Assets: Not specified in available sources for Hawaii PACE specifically. General Medicaid long-term care guidelines suggest asset limits around $2,000 (excluding primary home), but Hawaii-specific limits were not found.
- Must reside within the specified geographical service area of a PACE provider[1][3]
- Must be certified by the state (Hawaii Department of Human Services medical consultant) as requiring nursing home level of care (acuity level A or C in Hawaii)[1]
- Must be able to live safely in the community with PACE services at time of enrollment[3][4]
- Must be eligible for federally-funded medical assistance (Medicaid)[1]
- Must not be enrolled in Hawaii QUEST program[1]
- Must not be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan[3]
- Cannot be enrolled in hospice services or certain other programs[3]
- Enrollment is voluntary and individuals must sign a statement requesting PACE services[1]

**Benefits:** Comprehensive long-term care services including adult day programs, medical clinics, activities, occupational and physical therapy, and other support services to enable community living[5]
- Varies by: not_applicable — specific service hours, dollar amounts, or tiered benefits are not detailed in available sources

**How to apply:**
- Contact local PACE provider directly (specific phone numbers and websites not provided in search results)
- In-person at PACE centers (specific addresses not provided in search results)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Hawaii PACE has specific acuity level requirements (A or C) that differ from general nursing home level of care definitions used in other states[1]
- Applicants cannot be enrolled in Hawaii QUEST program, which is a specific Hawaii Medicaid managed care plan[1]
- PACE becomes the sole source of services for Medicare and Medicaid eligible enrollees — individuals cannot use other providers for covered services[4]
- Individuals can leave the program at any time, but re-enrollment may have different requirements[4]
- Search results do not provide specific contact information, provider locations, or application procedures — families will need to contact Hawaii Department of Human Services directly
- Income and asset limits are not explicitly stated in Hawaii regulations; they may follow federal Medicaid guidelines or be determined on a case-by-case basis

**Data shape:** Hawaii PACE eligibility is defined by state regulation (Haw. Code R. § 17-1746-11) with specific acuity level requirements and QUEST program exclusion. However, critical operational details—provider locations, service areas, contact information, processing timelines, and specific application procedures—are not available in the search results. The program appears to be geographically restricted by provider service areas, but the number and location of providers are not specified. Income and asset limits are not explicitly stated in Hawaii regulations, suggesting they may follow federal Medicaid standards or be individually assessed.

**Source:** https://www.law.cornell.edu/regulations/hawaii/Haw-Code-R-SS-17-1746-11 (Hawaii Administrative Rules § 17-1746-11)

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"note":"Hawaii has significantly higher income limits than most states. All three programs (QMB, SLMB, QI) share the same income thresholds in Hawaii.","QMB":{"individual_monthly":"$1,550[5]","couple_monthly":"$2,095[5]","federal_standard":"$1,350 individual / $1,824 couple[6]","hawaii_difference":"Hawaii's limits are approximately 15% higher than federal limits[5]"},"SLMB":{"individual_monthly":"$1,616[6]","couple_monthly":"$2,184[6]","note":"SLMB has slightly higher limits than QMB to accommodate those with more resources[1]"},"QI":{"individual_monthly":"$1,816[6]","couple_monthly":"$2,455[6]","note":"QI has the highest income limits of the three programs[6]"},"additional_dependents":"$500 per additional legally dependent family member[1]","working_income_exception":"If you have income from working, you may qualify even if your income exceeds these limits[6]","income_disregard":"$20 general monthly income disregard applies[3]"}
- Assets: {"individual":"$9,950[6]","couple":"$14,910[6]","what_counts":"Countable resources include liquid assets, savings, investments[4]","what_may_be_exempt":"Primary residence and certain other assets may be excluded, but search results do not specify full exemptions","note":"Asset limits are the same across all three programs (QMB, SLMB, QI)[6]"}
- Must be a legal Hawaii resident[1]
- Must be enrolled in Medicare Part A and Part B (for SLMB and QI programs)[3][6]
- Must be a U.S. citizen or qualified immigrant[3]
- Cannot qualify for Medicaid if applying for QI program[6]

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- Contact Hawaii Medicaid (MedQuest) — specific phone number and online portal not provided in search results[10]
- In-person at local Medicaid office — specific office locations not provided in search results
- Mail application to Hawaii Medicaid — specific mailing address not provided in search results

**Timeline:** Not specified in search results
**Waitlist:** [object Object]

**Watch out for:**
- Hawaii's income limits are significantly higher than federal limits — approximately 15% higher for QMB and SLMB[5]. Families should not assume they don't qualify based on federal thresholds.
- QI program is first-come, first-served and requires annual reapplication, unlike SLMB which does not require annual reapplication[1][4][6]
- QI program does not automatically include Extra Help for prescription drugs, while QMB and SLMB do[6]
- You cannot qualify for the QI program if you already qualify for Medicaid[6]
- The $20 monthly income disregard applies to all three programs, which may allow qualification even if income slightly exceeds stated limits[3]
- Working income may be treated differently — if you have earned income, you may qualify even if total income exceeds limits[6]
- Search results do not specify which assets are exempt (e.g., primary residence, vehicles) — families should contact MedQuest directly for clarification
- Specific application procedures, phone numbers, online portals, and processing timelines are not detailed in available search results; families must contact MedQuest directly

**Data shape:** Hawaii's Medicare Savings Programs are administered as a single Medicaid eligibility group with three tiers (QMB, SLMB, QI) based on income level. The key distinguishing feature is that Hawaii has raised income limits above federal standards for all three programs, making them more accessible than in most other states. QI differs from QMB and SLMB in that it operates on a first-come, first-served basis and requires annual reapplication. Benefits scale by program tier: QMB covers the most (premiums, deductibles, copayments), while SLMB and QI cover Part B premiums only. The search results lack critical operational details (phone numbers, specific office locations, processing times, detailed application procedures) that families would need for actual application.

**Source:** https://medquest.hawaii.gov/content/medquest/en/members-applicants/get-started/programs.html[10]

---

### SNAP (Supplemental Nutrition Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For Oct. 1, 2025 through Sept. 30, 2026, Hawaii uses Broad-Based Categorical Eligibility (BBCE) with a gross income limit of 200% of the federal poverty level: 1 person $2,998/month, 2 people $4,054/month, 3 people $5,108/month, 4 people $6,164/month, 5 people $7,218/month, 6 people $8,274/month, 7 people $9,328/month, each additional +$1,056/month. Households with a member 60+ or disabled who exceed gross may qualify via net income (100% FPL or less after deductions) and asset tests. Deductions include 20% earned income, standard deduction (higher in Hawaii), medical expenses over $35/month for elderly/disabled, shelter costs.[2][6][7]
- Assets: No asset limit under Hawaii's BBCE for most households (home and vehicles exempt). Households with member 60+ or disabled exceeding gross income follow federal rules with $4,500 asset limit (exempt: home, vehicles, retirement savings, household goods; countable: bank accounts, cash value of life insurance).[2][6]
- Hawaii resident.
- U.S. citizen or qualified non-citizen (eligible members can receive benefits even if others ineligible).
- Social Security number or proof of application.
- Work registration for able-bodied adults (exempt: 60+, disabled, pregnant). Note: Potential changes from One Big Beautiful Bill Act of 2025 may affect exemptions for 50-65 age group, requiring 20 hours/week work unless documented disability.[1][5][6]

**Benefits:** Monthly EBT card benefits for purchasing food (amount calculated based on net income, household size, and deductions; higher for elderly/disabled due to medical/shelter deductions; e.g., seniors on fixed incomes like Social Security often qualify).[2][4][6]
- Varies by: household_size

**How to apply:**
- Online: humanservices.hawaii.gov/bessd/snap/
- Phone: Call local office or 1-877-628-6460 (statewide assistance line implied via official site).[8]
- Mail or in-person: Local Department of Human Services offices statewide.
- ESAP (Elderly Simplified Application Project) available for 60+ households to simplify process (check with state for adoption).[5]

**Timeline:** Typically 30 days; expedited for emergencies (7 days if very low income/cash).[2]

**Watch out for:**
- Seniors 60+ exempt from work requirements but potential 2025 federal changes (One Big Beautiful Bill Act) may require work proof for 50-65 unless disabled, risking 16,570 elders.[5][7]
- Only ~half of eligible seniors apply; use ESAP for simplified process.[4][5]
- Medical expenses over $35/month deductible for 60+, often missed.[6][7]
- Household includes all who buy/prepare food together.[4][6]
- BBCE expands limits but exceeding 200% gross requires federal net/asset tests.[2]

**Data shape:** Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); no asset test under BBCE but federal fallback for high-gross elderly/disabled households; statewide with ESAP option for seniors.

**Source:** https://humanservices.hawaii.gov/bessd/snap/

---

### Hawaii Home Energy Assistance Program (H-HEAP, formerly LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross annual income must be 60% or less of the National Median Income. For a single person: approximately $37,000. For a family of four: approximately $71,000.[4] Exact limits vary by household size.[4] Alternatively, households automatically qualify regardless of income if at least one member receives TANF (Temporary Assistance for Needy Families), SSI (Supplemental Security Income), or SNAP (Supplemental Nutrition Assistance Program).[4]
- Assets: Not specified in available documentation.
- Must have an active residential service account open for the household.[1]
- Applicants must apply during the designated application window (June 1-30 for the 2024 program year).[2]
- All household members must provide proof of citizenship status or immigration documentation.[1][3]
- Households may only receive one type of H-HEAP payment per program year (October 1 – September 30).[1]

**Benefits:** One-time payment toward electric or gas bill.[2] Specific dollar amount not disclosed in available documentation.
- Varies by: Two credit types available: Energy Credit (EC) or Energy Crisis Intervention (ECI). ECI requires a Notice of Disconnection.[1]

**How to apply:**
- In-person only for Oahu residents (Honolulu Community Action Program - HCAP). Mail-in and email applications not accepted.[2]
- Phone appointment reservation required for Hawaii Island residents (Hawaii County Economic Opportunity Council - HCEOC).[4]
- Mail or in-person drop-off for Maui County residents (Maui Economic Opportunity - MEO).[4]
- Contact Kauai Economic Opportunity, Inc. for Kauai residents.[4]

**Timeline:** Not specified in available documentation.
**Waitlist:** Not mentioned in available documentation.

**Watch out for:**
- One payment per program year only (October 1 – September 30).[1] Households cannot receive multiple payments in a single year.
- Application window is narrow: June 1-30 only.[2][4] Missing this window means waiting until the next program year.
- Oahu residents cannot apply by mail or email; in-person application is mandatory.[2] This creates a significant barrier for homebound elderly individuals.
- Must have an active residential service account at the time of application.[1] Households with disconnected service may not qualify for Energy Credit (EC), though Energy Crisis Intervention (ECI) may be available with a Notice of Disconnection.
- The program name changed from LIHEAP to H-HEAP, which may cause confusion when searching for resources or historical information.[2]
- Automatic qualification through TANF, SSI, or SNAP participation bypasses income verification but still requires all other documentation.[4]
- All household members over 1 year old must provide Social Security numbers; this can be a barrier for mixed-status households.[2][4]

**Data shape:** This program is geographically fragmented with different application methods and providers by island/county, creating significant regional variation in accessibility. The application window is extremely narrow (30 days annually), making timing critical. Benefits are one-time payments with unspecified dollar amounts. The program serves as a safety valve for utility crises rather than ongoing assistance. Eligibility is income-based with an automatic pathway for households receiving other safety-net benefits, but documentation requirements are extensive. No asset limits are disclosed, suggesting they may not apply or may be determined case-by-case.

**Source:** https://www.hawaiianelectric.com/billing-and-payment/payment-assistance/low-income-programs/h-heap

---

### Sage PLUS (SHIP - State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits. Open to all regardless of income.
- Assets: No asset limits or tests apply.
- Must have Medicare or be Medicare-eligible
- Hawaii resident
- Includes beneficiaries, families, caregivers, agencies, and soon-to-be retirees

**Benefits:** Free one-on-one counseling, consultations, referrals, and presentations on Medicare coverage, Medigap/Medicare Advantage options, prescription drug coverage, travel coverage, resources to help pay Medicare costs, Medicaid, and long-term care; provided by trained certified volunteer counselors over phone, virtually via Zoom, or in-person if necessary; no charge to the public

**How to apply:**
- Phone: 808-586-7299 (Oahu) or toll-free 1-888-875-9229; TTY: 1-866-810-4379
- Website: https://www.hawaiiship.org (request counseling)
- In-person: Accommodations available upon request via phone

**Timeline:** Immediate scheduling for phone/virtual counseling; in-person as needed

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling and information assistance, not direct payments or services; people often confuse with Medicaid/Med-Quest which have strict income/asset limits; requires Medicare enrollment for full relevance; volunteer-based so availability depends on counselor schedules

**Data shape:** no income or asset test; volunteer counseling service only, not benefits-paying program; statewide uniform access via phone/virtual with no formal application

**Source:** https://www.hawaiiship.org

---

### Home-Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; priority given to low-income elders, but not required for eligibility. No specific dollar amounts or household size tables provided.[1][4][6]
- Assets: No asset limits mentioned.[1][4]
- Homebound and unable to cook or shop for themselves due to physical or mental disability with no meal preparation assistance.
- Lack physical mobility to shop for food and prepare adequate meals with no assistance.
- Convalescing post-hospital discharge needing temporary service.
- Lack adequate cooking facilities and unable to acquire them.
- Lack proper nutritional support due to caregiver stress.
- Must be home at delivery time, admit volunteers into home, have safe/accessibly home environment.
- Able to feed themselves or have caregiver to feed them.
- Willing to provide physician/health care professional verification of need.
- Agree to initial assessment and periodic reassessment.
- Priority to low-income, minority, socially isolated elders.[1]
- Spouses as primary caregivers or younger individuals with disabilities may qualify in some programs.[4]

**Benefits:** Hot, nutritious meals delivered Monday-Friday (including holidays), meeting 1/3 Recommended Daily Allowance: hot entree, vegetables, starch, dessert (often fruit), milk/juice. Special diets like diabetic, low-sodium accommodated. Hawaii Meals on Wheels: daily delivery. Lanakila Pacific: weekly delivery with rotating monthly menu (e.g., beef spaghetti, miso fish).[1][4]
- Varies by: provider

**How to apply:**
- Hawaii Meals on Wheels (Oahu): Call (808) 988-6747 Monday-Friday 8am-5pm.[1][6]
- Lanakila Pacific (Oahu island-wide): Contact through website lanakilapacific.org/mealsonwheels/ or City & County Aging and Disability Resource Center/health insurance for free eligibility; otherwise pay via credit/debit, online, check, SNAP EBT.[4]
- Complete client application form (name not specified).[1]

**Timeline:** Service starts within 2 days if eligible, space on route available, and application completed.[1]
**Waitlist:** Depends on space on existing delivery routes; priority affects access.[1]

**Watch out for:**
- Must be home to accept delivery and admit volunteers; safe home environment required.
- Space on routes limits immediate start; priority to low-income/minority/isolated.
- Physician verification and assessments mandatory.
- Not all islands equally covered; Oahu dominant.
- Some programs weekly vs. daily; paid options if not free-eligible.
- Not automatic for age 60+; must meet homebound/need criteria.[1][4]

**Data shape:** Multiple independent providers (not centralized state program); Oahu-heavy; no fixed income/asset tests but priority-based; varies by provider on delivery frequency/payment.

**Source:** No single statewide .gov site; key providers: hmow.org (Hawaii Meals on Wheels), lanakilapacific.org (Lanakila Pacific). State resources via humanservices.hawaii.gov or aging.hawaii.gov (not directly cited).[6]

---

### Executive Office on Aging Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; services available regardless of income, but priority given to those with greatest economic and social needs, focusing on low-income minorities, limited English-speaking, and the disabled[6].
- Assets: No asset limits mentioned in available sources.
- Care recipient must be 60 years or older with impairments in at least 2 ADLs or IADLs and an unmet need[1]
- Family caregiver must be unpaid and providing care to eligible senior[1][3]
- Special populations: Adults 55+ caring for non-child over 18 with developmental disabilities; grandparents/relatives 55+ caring for children 18 and under[3]
- Native Hawaiian-specific: Caregiver of Native Hawaiian 60+ with chronic illness/disability, or Native Hawaiian grandparent/relative caring for child 18 or under[3]

**Benefits:** Information and assistance, individual counseling, support groups and training, respite (in-home or out-of-home such as personal care, homemaker, adult day care), supplemental services; case management, care planning, linkages to community services[1][2][7]
- Varies by: priority_tier

**How to apply:**
- Phone: Oahu 808-768-7700 (Elderly Affairs Division), Neighbor Islands 1-800-570-1101[1][6]
- Website: https://health.hawaii.gov/eoa/ or https://hawaiiadrc.org[2][4]
- In-person: Contact local Area Agency on Aging offices (e.g., Honolulu Elderly Affairs Division)[6]
- Aging & Disability Resource Center (ADRC): 808-643-2372[5]

**Timeline:** Not specified in sources.
**Waitlist:** Services depend on eligibility and availability due to limited funding; priority for greatest needs may imply waitlists[6]

**Watch out for:**
- Funding prioritizes greatest needs (low-income, minorities, limited English, disabled), so higher-income may be deprioritized or wait longer[6]
- Services vary by county AAA and availability; not all services in every location[6]
- Must have unpaid caregiver and specific impairments (2+ ADLs/IADLs); independent seniors without caregiver may not qualify[1]
- Respite and other services depend on eligibility assessment, not guaranteed[7]

**Data shape:** Administered statewide via 4 county AAAs with priority tiers for greatest needs; no fixed income/asset tests but funding-limited; benefits include caregiver-specific respite/counseling plus linkages

**Source:** https://health.hawaii.gov/eoa/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must be at or below 125% of the federal poverty level for the calendar year. Exact dollar amounts vary by household size and are updated annually; refer to current Poverty Guidelines at https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines. For example, in Maui County, gross family income cannot exceed 125% of HHS poverty levels.
- Unemployed and eligible to work in the US
- Resident of Hawaii (or specific service area, e.g., Maui County for some providers)
- Poor employment prospects (job-ready individuals may be referred to WIOA Adult Program)
- Enrollment priority: veterans/qualified spouses, 65+, disabled, limited English/low literacy, rural residents, low employment prospects, homeless/at-risk

**Benefits:** Paid part-time community service training assignments at public/non-profit host agencies, averaging 19-20 hours per week at Hawaii state minimum wage. Includes skills assessment, job search training, counseling, soft skills development to transition to unsubsidized employment.
- Varies by: priority_tier

**How to apply:**
- Phone: Leila Shar, Acting Programs Manager at (808) 586-9169 or [email protected]
- Phone: Tekawitha M. Iese, Program Specialist at (808) 586-8819 or [email protected]
- Website: https://labor.hawaii.gov/wdd/job-seekers/scsep/ or https://labor.hawaii.gov/wdd/employers/scsep/
- In-person: Contact local American Job Centers or providers like Maui American Job Center (mauiamericanjobcenter.com) or HCAP on Oahu

**Waitlist:** Not specified; may vary by region and funding availability

**Watch out for:**
- Not for job-ready individuals; they are referred to WIOA Adult Program
- Training is temporary; participants must seek unsubsidized employment after completion (host agencies may hire but wages unsubsidized)
- Income based on family/household, not individual
- Priority groups get preference; limited slots due to federal funding
- Must be unemployed at enrollment; no asset test but strict poverty threshold
- County-specific residency for some sub-programs (e.g., Maui-only)

**Data shape:** Income at 125% federal poverty level (family-based, annual update); priority enrollment tiers; statewide with county sub-providers and varying host agencies; no fixed processing times or asset limits specified

**Source:** https://labor.hawaii.gov/wdd/job-seekers/scsep/

---

### Legal Aid Society of Hawaii Elder Law Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Low-income required, but exact dollar amounts or household size table not specified in available sources; cases evaluated individually based on limited income[4][7].
- Assets: Not specified; low assets implied as part of low-income evaluation, but no details on what counts or exemptions[4][7].
- Low-income individuals or families
- Civil legal needs only (e.g., no criminal or fee-generating cases)
- Priority to most needy due to limited resources[4][7]

**Benefits:** Free legal advice; advance planning services (specifics like advance health care directives, powers of attorney, wills not detailed for this program but implied in elder law context); areas include family, housing, consumer, public benefits[4][6][7].
- Varies by: priority_tier

**How to apply:**
- Phone: 808-536-4302 (Oahu) or 1-800-499-4302 (neighbor islands), Monday-Friday 9:00AM-11:30AM & 1:00PM-3:30PM[4][7]
- Website: https://www.legalaidhawaii.org/elder-law-services.html[4]
- No walk-in intake; physical offices not open to public, but accommodations for current clients[7]
- Mail or in-person not specified for initial intake

**Timeline:** Not specified
**Waitlist:** Not specified; priority given to most needy due to limited resources, implying potential delays[4][7]

**Watch out for:**
- Phone intake limited to specific hours (M-F 9-11:30AM & 1-3:30PM); no walk-in or public office access[4][7]
- Services free but limited to civil matters; priority to neediest may mean not all qualify or face waits[4][7]
- No fees, but does not handle criminal, business, personal injury, or fee-generating cases[4][7]
- Often confused with University of Hawaii Elder Law Program (UHELP), which is Oahu-only, student-supervised clinic with different contact (808-956-6544)[1][3][8]

**Data shape:** Statewide with island-specific intake lines; no detailed income/asset tables or forms listed; priority-based allocation due to high demand (serves 18,000+ clients yearly across Legal Aid)[5][7]; distinct from UHELP which is Oahu-restricted academic clinic

**Source:** https://www.legalaidhawaii.org/elder-law-services.html

---

### Long-Term Care Ombudsman Program (LTCOP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to all residents of long-term care facilities regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident (or acting on behalf of a resident) of a long-term care facility in Hawaii, such as nursing homes, assisted living facilities, adult residential care homes (ARCH), expanded ARCH, CCFFH, or similar settings.

**Benefits:** Identifies, investigates, and resolves complaints related to action, inaction, or decisions adversely affecting health, safety, welfare, and rights; provides information, referral, and consultation on long-term care issues including alternatives to nursing home placement, payment options, choosing facilities, power of attorney/guardianship, refusing treatment, and resident rights; supports resident and family councils; conducts confidential face-to-face visits by certified ombudsmen (volunteers commit to weekly visits).

**How to apply:**
- Phone: 808-586-7268 (Oahu) or 1-888-229-2231 (statewide toll-free)
- Email: eoa.ltcop@doh.hawaii.gov
- Website: https://health.hawaii.gov/eoa/home/long-term-care-ombudsman-program/ or https://www.hi-ltc-ombudsman.org
- In-person: Contact via phone for local office arrangements; Executive Office on Aging at 250 S. Hotel St., Ste. 406, Honolulu, HI 96813

**Timeline:** Not specified; complaint investigation begins promptly upon contact.

**Watch out for:**
- Not a direct service provider or financial aid program—offers advocacy and complaint resolution only, not healthcare or payment; requires resident consent for most actions (documented orally or in writing); confusion with volunteer recruitment (separate from receiving services); volunteers must reside locally (e.g., Oahu) with vehicle; not for non-facility residents unless seeking info/referral.

**Data shape:** no income test; advocacy-only for LTC facility residents statewide; volunteer-driven with certification requirements; free and open to all qualifying residents without financial barriers

**Source:** https://health.hawaii.gov/eoa/home/long-term-care-ombudsman-program/

---

### Kūpuna Aging in Place (KAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Low- to moderate-income levels; specific dollar amounts or household size tables not detailed in sources. Financial eligibility determined via intake process with case management[4][7].
- Assets: Not specified in sources.
- Hawaiʻi resident
- Nonprofit-provided services via 501(c)(3) organizations funded by Hawaiʻi Community Foundation grants
- Functional needs supporting aging in place (e.g., frailty, ADL/IADL limitations implied via similar programs)
- Not eligible for Medicaid or comparable government/private home- and community-based services (distinction from Kupuna Care)
- U.S. citizen or legal alien (from related Kupuna Care brochure)

**Benefits:** Community-based support services (case management, falls prevention education, home-delivered meals, transportation, socialization, respite, personal care); adult day care or adult day health (with tuition assistance); caregiver support (education, support groups, training, counseling). Provided in homes or at centers/facilities[4][7].
- Varies by: priority_tier

**How to apply:**
- Apply through funded nonprofit organizations providing KAP services (no central state application; contact providers via Hawaiʻi Community Foundation grantees)
- Formal intake process by providers for kūpuna and financial eligibility determination[4]
- Hawaiʻi Community Foundation Grants Portal for organizations (not individuals): applications for 2026-2029 open until March 20, 2026[7]

**Timeline:** Not specified.
**Waitlist:** Possible for services with prioritization for greatest economic/social need or institutional risk (from related programs)[1][6]; no specific KAP details.

**Watch out for:**
- KAP is a grant program funding nonprofits, not a direct state-run service like Kupuna Care; families must contact providers, not a single agency[1][4][7]
- Age 65+ (vs 60+ for OAA Title III or Kupuna Care); targets low-moderate income with case management required[1][4]
- No direct individual application to funders; relies on provider intake and care plans[4]
- Often confused with state Kupuna Care program, which has stricter non-Medicaid eligibility and cost-sharing[1][3][6]

**Data shape:** Grant-funded via Hawaiʻi Community Foundation to nonprofits; not a direct government entitlement program; benefits via provider networks with individual care plans and financial intake; age 65+ focus distinguishes from 60+ state programs

**Source:** https://www.hawaiicommunityfoundation.org/strengthening/kupuna-aging-in-place

---

### Kūpuna Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Program prioritizes those with 'greatest economic need' but no specific income thresholds or tables are documented.
- Assets: Not specified in available sources.
- U.S. citizen or legal alien[2]
- Not covered by any comparable government or private home- and community-based care services[2]
- Not residing in an institution (intermediate care facility, skilled nursing facility, adult residential care, hospital, or foster family)[2]
- Impairment of two or more ADL (Activities of Daily Living) or IADL (Instrumental Activities of Daily Living), or significantly reduced mental capacity[2]
- Unmet need in performing an ADL or IADL[2]
- Individual must be a care recipient, caregiver, or employed caregiver as defined in Hawaii Revised Statutes § 349-16[1]

**Benefits:** Services include: transportation, attendant care, case management, home-delivered meals, homemaker services, adult day care, and personal care services[5]. For employed caregivers specifically: up to $70 per day in services (subject to availability of funds, paid directly to contracted service providers, not the caregiver)[4].
- Varies by: priority_tier and caregiver_employment_status

**How to apply:**
- Phone: Aging and Disability Resource Center (ADRC) statewide number (808) 643-2372[4]
- Phone: ADRC TTY line (808) 643-0899[4]
- Phone: Alternative number for Kupuna Caregivers Program information: 808-768-7700[5]
- Online: www.hawaiiadrc.org[4]
- In-person: Area agencies on aging (specific locations not provided in sources)

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- Program explicitly excludes individuals already receiving comparable government or private home- and community-based care services[2] — dual enrollment is not permitted.
- Individuals residing in ANY institutional setting (including skilled nursing facilities, adult residential care, hospitals) are ineligible[2].
- For employed caregivers: must work at least 30 hours per week and provide direct care to qualify for the Kupuna Caregivers Program specifically[4].
- Services are paid directly to contracted service providers, NOT to the caregiver or family member[4] — this is not a cash payment program.
- Program funding is limited and subject to legislative appropriation[4] — availability may vary year to year.
- Eligibility is confirmed through in-home assessment; preliminary determination alone does not guarantee services[1].
- Individual can be deemed ineligible if they leave the state, refuse services, or their whereabouts become unknown[1].

**Data shape:** This program has two distinct service delivery models: traditional service delivery OR participant-directed services and support, based on individualized support plans[1]. Benefits scale by priority tier (economic need, social need, institutional placement risk) rather than by household size. No specific income or asset limits are documented in available sources, making this a needs-based rather than means-tested program. The program serves three populations: care recipients (frail older adults), caregivers (family members), and employed caregivers (working individuals providing direct care). Employed caregivers have a separate benefit structure ($70/day maximum) distinct from care recipients. Regional implementation varies through area agencies on aging, but no specific county-level variations are documented.

**Source:** Hawaii Revised Statutes § 349-17 (law.justia.com/codes/hawaii/title-20/chapter-349/section-349-17/); Hawaii Department of Human Services Elderly Affairs Division

---

### Senior Food Box Program (CSFP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Maximum monthly household income at or below 150% of the Federal Poverty Income Guidelines for Hawaii[3]. The exact dollar amounts vary by household size and are set annually by the federal government. For reference, in fiscal year 2022, the program nationally served participants with incomes at or below 130% of the federal poverty level[4], though Hawaii's state plan specifies 150%[3]. Applicants who are fully eligible for SNAP, FDPIR, SSI, LIS, or MSP may also be accepted as income-eligible[3].
- Must be a resident of the county in which applying to receive services[3]
- For Oahu-specific program: Oahu resident[1]
- Must show proof of nutritional risk (as determined by physician or local agency staff) in some cases, though this is not universally required[2]

**Benefits:** Monthly food boxes containing items from the following categories: cereal, juice, protein, milk, peanut butter/dry beans, potatoes/grains, cheese, fruit, and vegetables[3]. Boxes are designed to supplement diets with nutritious USDA Foods and provide nutrients typically lacking in the beneficiary population's diets[3].
- Varies by: fixed

**How to apply:**
- Online: Visit https://hawaiifoodbank.org/csfp/ and click 'DOWNLOAD AN APPLICATION'[1]
- Mail: Complete application and mail to Hawaii Foodbank, 2611 Kilihau St., Honolulu, HI 96819[1]
- Phone: (808) 836-3600[1]
- Email: info@hawaiifoodbank.org[1]

**Timeline:** Not specified in available sources. However, the program notes that slots can be filled quickly and there will be a waitlist[1].
**Waitlist:** Yes. If waitlisted, there is an option to attend the monthly pick-up at chosen location site and may be able to receive a food box if there are any left over[1]. For FFY 2024, Hawaii's caseload assignment is 3,226 participants[3].

**Watch out for:**
- Income limits vary by state: Hawaii uses 150% of Federal Poverty Income Guidelines[3], while the national baseline is 130%[4]. Verify the current year's income limits with Hawaii Department of Labor[3].
- Slots fill quickly with a waitlist[1]. Families should apply early in the fiscal year.
- Recertification required annually[1]. Applicants must reapply every 12 months to maintain eligibility.
- One source mentions recertification every 6 months[5], while another states annually[1]—clarify current requirement with Hawaii Foodbank.
- Valid photo ID required at every monthly pick-up[1], not just at application.
- County residency requirement: Must reside in the specific county where applying[3]. This is not statewide reciprocal.
- Program is exclusively for seniors 60+. Women, infants, and children are no longer eligible unless they were certified before February 6, 2014[4].
- Can be combined with SNAP and other benefits—no prohibition against receiving both[4].
- If waitlisted, attendance at monthly pick-up location may result in receiving a box if extras are available[1].

**Data shape:** This program's data structure is unique in that: (1) Hawaii's income limit (150% FPL) is higher than the national baseline (130% FPL)[3][4], (2) it operates on a caseload assignment system with limited slots (3,226 for FFY 2024)[3], creating a waitlist dynamic, (3) it requires county-level residency verification[3], (4) it is exclusively for seniors 60+ following 2014 legislative changes[4], and (5) recertification frequency may vary (sources cite both 6 months and 12 months—verify current requirement). The program is administered by Hawaii Department of Labor with Hawaii Foodbank as the primary provider for Oahu[1][3].

**Source:** https://labor.hawaii.gov/ocs/service-programs-index/federal-food-assistance-programs/csfp/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Med-QUEST Home and Community-Based Servi | benefit | state | deep |
| Hawai'i PACE (Program of All-Inclusive C | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | medium |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Hawaii Home Energy Assistance Program (H | navigator | federal | simple |
| Sage PLUS (SHIP - State Health Insurance | resource | federal | simple |
| Home-Delivered Meals (Meals on Wheels) | benefit | federal | deep |
| Executive Office on Aging Family Caregiv | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid Society of Hawaii Elder Law Pr | resource | state | simple |
| Long-Term Care Ombudsman Program (LTCOP) | resource | federal | simple |
| Kūpuna Aging in Place (KAP) | benefit | state | deep |
| Kūpuna Care Program | benefit | state | deep |
| Senior Food Box Program (CSFP) | benefit | state | medium |

**Types:** {"benefit":9,"navigator":1,"resource":3,"employment":1}
**Scopes:** {"state":6,"local":1,"federal":7}
**Complexity:** {"deep":8,"medium":2,"simple":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/HI/drafts.json`.

- **Med-QUEST Home and Community-Based Services (HCBS) Waivers** (benefit) — 5 content sections, 6 FAQs
- **Hawai'i PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 2 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **not_applicable — specific service hours, dollar amounts, or tiered benefits are not detailed in available sources**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **Two credit types available: Energy Credit (EC) or Energy Crisis Intervention (ECI). ECI requires a Notice of Disconnection.[1]**: 1 programs
- **not_applicable**: 2 programs
- **provider**: 1 programs
- **priority_tier and caregiver_employment_status**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Med-QUEST Home and Community-Based Services (HCBS) Waivers**: Multiple target-group waivers under Med-QUEST (e.g., I/DD via DDD); eligibility layered (Medicaid + division + LOC); no single elderly waiver specified, benefits need-assessed not fixed-dollar; statewide but division-specific.
- **Hawai'i PACE (Program of All-Inclusive Care for the Elderly)**: Hawaii PACE eligibility is defined by state regulation (Haw. Code R. § 17-1746-11) with specific acuity level requirements and QUEST program exclusion. However, critical operational details—provider locations, service areas, contact information, processing timelines, and specific application procedures—are not available in the search results. The program appears to be geographically restricted by provider service areas, but the number and location of providers are not specified. Income and asset limits are not explicitly stated in Hawaii regulations, suggesting they may follow federal Medicaid standards or be individually assessed.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Hawaii's Medicare Savings Programs are administered as a single Medicaid eligibility group with three tiers (QMB, SLMB, QI) based on income level. The key distinguishing feature is that Hawaii has raised income limits above federal standards for all three programs, making them more accessible than in most other states. QI differs from QMB and SLMB in that it operates on a first-come, first-served basis and requires annual reapplication. Benefits scale by program tier: QMB covers the most (premiums, deductibles, copayments), while SLMB and QI cover Part B premiums only. The search results lack critical operational details (phone numbers, specific office locations, processing times, detailed application procedures) that families would need for actual application.
- **SNAP (Supplemental Nutrition Assistance Program)**: Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); no asset test under BBCE but federal fallback for high-gross elderly/disabled households; statewide with ESAP option for seniors.
- **Hawaii Home Energy Assistance Program (H-HEAP, formerly LIHEAP)**: This program is geographically fragmented with different application methods and providers by island/county, creating significant regional variation in accessibility. The application window is extremely narrow (30 days annually), making timing critical. Benefits are one-time payments with unspecified dollar amounts. The program serves as a safety valve for utility crises rather than ongoing assistance. Eligibility is income-based with an automatic pathway for households receiving other safety-net benefits, but documentation requirements are extensive. No asset limits are disclosed, suggesting they may not apply or may be determined case-by-case.
- **Sage PLUS (SHIP - State Health Insurance Assistance Program)**: no income or asset test; volunteer counseling service only, not benefits-paying program; statewide uniform access via phone/virtual with no formal application
- **Home-Delivered Meals (Meals on Wheels)**: Multiple independent providers (not centralized state program); Oahu-heavy; no fixed income/asset tests but priority-based; varies by provider on delivery frequency/payment.
- **Executive Office on Aging Family Caregiver Support Program**: Administered statewide via 4 county AAAs with priority tiers for greatest needs; no fixed income/asset tests but funding-limited; benefits include caregiver-specific respite/counseling plus linkages
- **Senior Community Service Employment Program (SCSEP)**: Income at 125% federal poverty level (family-based, annual update); priority enrollment tiers; statewide with county sub-providers and varying host agencies; no fixed processing times or asset limits specified
- **Legal Aid Society of Hawaii Elder Law Program**: Statewide with island-specific intake lines; no detailed income/asset tables or forms listed; priority-based allocation due to high demand (serves 18,000+ clients yearly across Legal Aid)[5][7]; distinct from UHELP which is Oahu-restricted academic clinic
- **Long-Term Care Ombudsman Program (LTCOP)**: no income test; advocacy-only for LTC facility residents statewide; volunteer-driven with certification requirements; free and open to all qualifying residents without financial barriers
- **Kūpuna Aging in Place (KAP)**: Grant-funded via Hawaiʻi Community Foundation to nonprofits; not a direct government entitlement program; benefits via provider networks with individual care plans and financial intake; age 65+ focus distinguishes from 60+ state programs
- **Kūpuna Care Program**: This program has two distinct service delivery models: traditional service delivery OR participant-directed services and support, based on individualized support plans[1]. Benefits scale by priority tier (economic need, social need, institutional placement risk) rather than by household size. No specific income or asset limits are documented in available sources, making this a needs-based rather than means-tested program. The program serves three populations: care recipients (frail older adults), caregivers (family members), and employed caregivers (working individuals providing direct care). Employed caregivers have a separate benefit structure ($70/day maximum) distinct from care recipients. Regional implementation varies through area agencies on aging, but no specific county-level variations are documented.
- **Senior Food Box Program (CSFP)**: This program's data structure is unique in that: (1) Hawaii's income limit (150% FPL) is higher than the national baseline (130% FPL)[3][4], (2) it operates on a caseload assignment system with limited slots (3,226 for FFY 2024)[3], creating a waitlist dynamic, (3) it requires county-level residency verification[3], (4) it is exclusively for seniors 60+ following 2014 legislative changes[4], and (5) recertification frequency may vary (sources cite both 6 months and 12 months—verify current requirement). The program is administered by Hawaii Department of Labor with Hawaii Foodbank as the primary provider for Oahu[1][3].

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Hawaii?
