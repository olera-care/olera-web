# Missouri Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 16 |
| New (not in our data) | 8 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 7 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### MO HealthNet

- **income_limit**: Ours says `$1109` → Source says `$860` ([source](https://mydss.mo.gov/healthcare/apply))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Basic healthcare (physician visits, prescriptions, ER, short-term hospital); long-term care via ABD: nursing home (covers costs beyond patient income), HCBS waivers (home health, personal care, adult day, home modifications), non-medical personal needs; supplemental nursing care. Specifics depend on NFLOC assessment; no fixed hours/dollars stated, varies by need.[2][4][5]` ([source](https://mydss.mo.gov/healthcare/apply))
- **source_url**: Ours says `MISSING` → Source says `https://mydss.mo.gov/healthcare/apply`

### Program of All-Inclusive Care for the Elderly (PACE) - Missouri

- **income_limit**: Ours says `$1690` → Source says `$2,901` ([source](mydss.mo.gov/mhd/pace))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive health care, social, recreational, and wellness services. No deductibles or co-pays for any care, medication, or service provided by the PACE interdisciplinary team.` ([source](mydss.mo.gov/mhd/pace))
- **source_url**: Ours says `MISSING` → Source says `mydss.mo.gov/mhd/pace`

### Medicare Savings Program (MSP)

- **income_limit**: Ours says `$1407` → Source says `$20` ([source](https://mydss.mo.gov/medicare-cost-savings-programs or https://dmh.mo.gov/medicaid-eligibility/qmb-slmb-coverage))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A/B premiums (if owed), deductibles, coinsurance/copays. SLMB1/SLMB2/QI: Part B premium only ($202.90/month in 2026). Automatic Low Income Subsidy (LIS) eligibility.[1][2][4][6][8]` ([source](https://mydss.mo.gov/medicare-cost-savings-programs or https://dmh.mo.gov/medicaid-eligibility/qmb-slmb-coverage))
- **source_url**: Ours says `MISSING` → Source says `https://mydss.mo.gov/medicare-cost-savings-programs or https://dmh.mo.gov/medicaid-eligibility/qmb-slmb-coverage`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://mydss.mo.gov/food-assistance/apply-for-snap))
- **income_limit**: Ours says `$1992` → Source says `$15,060` ([source](https://mydss.mo.gov/food-assistance/apply-for-snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for groceries (no cash). Amount based on household size, net income, deductions. Example: 2-person elderly/disabled household with $1,200 gross may get $415/month (max allotment minus 30% net income). Varies; scales with household size and expenses.[6]` ([source](https://mydss.mo.gov/food-assistance/apply-for-snap))
- **source_url**: Ours says `MISSING` → Source says `https://mydss.mo.gov/food-assistance/apply-for-snap`

### Missouri Caregiver Program (Alzheimer’s Association Caregiver Relief Track)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Track Two (Alzheimer’s Association): Reimbursement up to $700 for respite services including assessment/care coordination, adult day care, in-home care, nutritional supplements, safety/supportive programs, education/counseling[1][2]. Other tracks: Track One (Memory Care Home Solutions) - in-home assessment, customized caregiver training/education; Track Three - assistive technology/devices[2][5].` ([source](https://health.mo.gov/seniors/dementia-caregiving/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://health.mo.gov/seniors/dementia-caregiving/[2]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including identifying, investigating, and resolving complaints related to health, safety, welfare, and rights; providing information on long-term services and supports; representing residents before governmental agencies; seeking administrative, legal, or other remedies; regular facility visits by trained volunteers; education on resident rights; mediation and problem-solving to improve quality of life.` ([source](https://health.mo.gov/seniors/ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://health.mo.gov/seniors/ombudsman/`

### Missouri Property Tax Credit (Circuit Breaker)

- **income_limit**: Ours says `$30000` → Source says `$30,000` ([source](https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Tax credit up to $750 for renters/part-year owners (based on rent paid); up to $1,100 for full-year homeowners (based on real estate taxes paid). Amount determined by taxes/rent paid and total household income; phases out incrementally.[1][2][3][5][7]` ([source](https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/))
- **source_url**: Ours says `MISSING` → Source says `https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/`

### Missouri Aged & Disabled Waiver (ADW)

- **income_limit**: Ours says `$1690` → Source says `$1,109` ([source](https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[7]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day care, homemaker services, chore services, basic respite, advanced respite, home-delivered meals[1][3][5][6][7]. Specific dollar amounts or hours per week not specified; services to meet unmet needs equivalent to nursing home care[6].` ([source](https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[7]))
- **source_url**: Ours says `MISSING` → Source says `https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[7]`

## New Programs (Not in Our Data)

- **Structured Family Caregiving Waiver** — financial ([source](https://mydss.mo.gov/mhd/waiver/structured-family-caregiving[8]; MO HCBS Manual 3.60: https://health.mo.gov/seniors/hcbs/hcbsmanual/pdf/3.60.pdf[2]))
  - Shape notes: Tied to existing live-in caregiver (not new hires); requires agency employment for payment and substitute; dementia-specific with NFLOC; Medicaid prerequisite with no unique income/asset tables beyond standard.
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://dss.mo.gov/fsd/energy-assistance (policy manual at https://dss.mo.gov/fsd/energy-assistance/pdf/liheap-manual.pdf)))
  - Shape notes: Administered via 50+ local contracted agencies by county; priority tiers for elderly/disabled; two components (regular heating EA + crisis ECIP); benefits scale by income/size/fuel; seasonal with early access for seniors.
- **Weatherization Assistance Program (WAP)** — service ([source](https://dnr.mo.gov/energy/weatherization/low-income-assistance[3]))
  - Shape notes: Administered by 18 regional agencies with service areas; income at 200% FPL with priority tiers; no statewide central application—local contacts required; documents emphasize 3-month income verification and zero-income certifications.
- **Missouri State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.missouriship.org[4]))
  - Shape notes: no income/asset test; counseling-only service via statewide volunteer network; focuses on Medicare navigation and subsidy eligibility assistance rather than direct financial aid
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://health.mo.gov/seniors/senioremployment/))
  - Shape notes: Income test at 125% FPL with specific exclusions; county-restricted availability via sub-grantees like MERS Goodwill; priority tiers for enrollment; not statewide
- **Legal Services of Eastern Missouri (Senior Legal Hotline)** — service ([source](https://lsem.org/advocates-for-older-adults/))
  - Shape notes: county-restricted to 21 eastern Missouri counties; priority to Older Americans Act areas (income/healthcare/housing/abuse); no specific income/asset dollar limits published; services via central intake with regional offices
- **Missouri Rx Program (MoRx)** — financial ([source](https://mydss.mo.gov/mhd/morx-general-faqs))
  - Shape notes: Eligibility overhauled in 2017 to require MO HealthNet enrollment (not standalone); auto-enrollment for qualified; benefits fixed at 50% OOP on Part D drugs; outdated sources show pre-change income/asset tables; spenddown activation once/year
- **No Tax on Social Security Benefits** — financial ([source](https://dor.mo.gov/faq/taxation/individual/pension.html))
  - Shape notes: Tax deduction claimed on annual state income tax return, not a standalone program with application; changed in 2024 to full exemption without income limits.[1][2][4]

## Program Details

### MO HealthNet


**Eligibility:**
- Age: 65+
- Income: For MO HealthNet for the Aged, Blind, and Disabled (MHABD) Non-Spend down: Individual Elderly/Disabled $860 monthly, Blind $1,012 monthly; Couple Elderly/Disabled $1,166 monthly, Blind $1,372 monthly. Spend down option reduces income to these limits via medical expenses. Home and Community Based Waiver: $1,311 monthly individual. Nursing home vendor coverage requires all income toward care cost (no fixed limit like HCBS waivers at $1,690 monthly in 2025). Limits from 2019 chart; check current FPL adjustments as they vary by household size for some categories but fixed for ABD elderly.[8][5][4]
- Assets: Individual Elderly/Disabled or Blind: $3,000; Couple: $6,000. Exemptions typically include primary home (with equity limits, consult elder law attorney for 55+ with real property), one vehicle, personal belongings, burial plots. What counts: cash, bank accounts, investments, second vehicles/properties.[8][6]
- Missouri resident
- U.S. citizen or qualified immigrant
- For long-term care (nursing home, HCBS waivers): Nursing Facility Level of Care (NFLOC) based on ADLs/IADLs assessment
- Blind or disabled status may have separate criteria
- Functional need for regular ABD Medicaid long-term services (ADLs assessment, NFLOC not always required)

**Benefits:** Basic healthcare (physician visits, prescriptions, ER, short-term hospital); long-term care via ABD: nursing home (covers costs beyond patient income), HCBS waivers (home health, personal care, adult day, home modifications), non-medical personal needs; supplemental nursing care. Specifics depend on NFLOC assessment; no fixed hours/dollars stated, varies by need.[2][4][5]
- Varies by: priority_tier

**How to apply:**
- Online: https://mydss.mo.gov/healthcare/apply
- Phone: 855-373-9994 or 1-800-318-2596 via HealthCare.gov transfer
- Paper: Download from myDSS.mo.gov and mail
- In-person: Local Family Support Division offices or nursing home assistance

**Timeline:** Not specified in sources; typically 45-90 days for long-term care due to assessments
**Waitlist:** Possible for HCBS waivers due to limited slots (not detailed by region)

**Watch out for:**
- Nursing home income rules differ (all income to care, no $1,690 cap like HCBS); spend down via medical bills for over-limit income; home equity limits for 55+ (consult attorney); HCBS waivers have waitlists; must complete Supplemental Form or risk denial; ABD requires disability/age 65+ even for basic coverage.[4][5][8][1]

**Data shape:** Fixed asset/income limits for ABD elderly (not scaling by household size beyond couple); separate tracks for nursing home vs HCBS (different income rules); NFLOC mandatory for long-term care; spend down pathway unique for medically needy

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mydss.mo.gov/healthcare/apply

---

### Structured Family Caregiving Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must have appropriate Medicaid Eligibility (ME) code and be in active Medicaid status. Participants eligible on a spenddown basis may receive services when liability is met; otherwise, private pay applies. Specific 2026 income limits follow standard Missouri Medicaid rules (generally $2,982/month for applicant; non-applicant spouse income not counted, with possible spousal allowance). No unique program-specific income table provided[1][2][4][5].
- Assets: Follows Missouri Medicaid asset rules (generally $2,000 for applicant; higher Community Spouse Resource Allowance if married). For seniors 65+, home equity limit of $730,000 in 2025 (current value minus mortgage; exemptions if spouse, minor child, or blind/disabled adult child lives in home)[1].
- Diagnosed with Alzheimer's or related dementia disorder as defined by RSMo 172.800 by licensed Missouri physician[2][4].
- Reside full-time in same household as primary caregiver[2][4].
- Meet Nursing Facility Level of Care (NFLOC) via InterRAI HC assessment (scoring ADLs like mobility, eating, toileting, bathing, dressing; cognition for dementia)[1][2].
- Have established backup plan with qualified substitute caregiver (chosen by participant/guardian, employed by provider, familiar with needs)[2].
- Primary caregiver (family or non-family, including spouse/guardian) already providing care; continues upon authorization[1][2].
- Not reside in facility, group home, or boarding home[2].
- Not enrolled in other HCBS state plan or waiver[2].
- Not eligible if receiving Medicaid via Blind Pension (BP)[2].

**Benefits:** Payment to structured family caregiving agency, which employs and pays primary caregiver (and substitute) for hands-on services per approved plan of care. Exact rates/hours not specified in sources; designed as cost-effective alternative to nursing facility[2][8].

**How to apply:**
- Contact Missouri Department of Health and Senior Services (DHS), Division of Senior and Disability Services (DSDS) for assessment and enrollment[2][8].
- No specific phone, online URL, mail, or in-person details in sources; start via mydss.mo.gov or local DSDS office.
- Assessment by healthcare professional evaluates needs, diagnosis confirmation, NFLOC via InterRAI HC, and caregiver identification[1][2][3].

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; potential due to waiver nature (renewal notice Dec 2025 suggests ongoing capacity management)[8].

**Watch out for:**
- Must already have live-in primary caregiver before applying; program authorizes payment to existing arrangement via agency[1][2].
- Dementia diagnosis alone insufficient; must meet NFLOC via InterRAI HC scoring[1].
- No facility/group home residence allowed; must live full-time with caregiver[2].
- Blind Pension (BP) Medicaid recipients ineligible[2].
- Spenddown participants: services pause if liability unmet (private pay option)[4].
- Caregiver (even spouse) allowed, but must pass background (general SFC rule; MO-specific not detailed)[5].
- Waiver expires 06/30/2025; renewal pending (public notice 12/18/2025)[7][8].

**Data shape:** Tied to existing live-in caregiver (not new hires); requires agency employment for payment and substitute; dementia-specific with NFLOC; Medicaid prerequisite with no unique income/asset tables beyond standard.

**Source:** https://mydss.mo.gov/mhd/waiver/structured-family-caregiving[8]; MO HCBS Manual 3.60: https://health.mo.gov/seniors/hcbs/hcbsmanual/pdf/3.60.pdf[2]

---

### Program of All-Inclusive Care for the Elderly (PACE) - Missouri


**Eligibility:**
- Age: 55+
- Income: Not specified in search results; varies by state Medicaid rules. Search results indicate up to 300% of Federal Benefit Rate (~$2,901/month) for Medicaid coverage, but note that financial criteria are NOT required for PACE enrollment itself.
- Assets: Not specified in search results; Medicaid typically requires assets ≤$2,000 (excluding primary home), but PACE itself has no financial requirements.
- Must require nursing facility level of care (as certified by your state)
- Must be able to live safely in the community with PACE support at time of enrollment
- Must live in the service area of a PACE organization
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plans, Medicare prescription drug plans, or hospice

**Benefits:** Comprehensive health care, social, recreational, and wellness services. No deductibles or co-pays for any care, medication, or service provided by the PACE interdisciplinary team.
- Varies by: not_applicable — coverage is comprehensive once enrolled

**How to apply:**
- Contact local PACE organization directly (see providers below)
- Email: MHD.PACE@dss.mo.gov
- Website: mydss.mo.gov/mhd/pace

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- PACE is NOT a financial assistance program — it's a comprehensive care delivery model. Approximately 90% of participants are dual-eligible for Medicare and Medicaid, meaning Medicaid and Medicare cover costs. Non-Medicaid participants pay monthly premiums ($7,000+ annually mentioned in search results).
- You must be certified by your state as needing nursing facility level of care to enroll, even though PACE's goal is to prevent nursing home placement.
- Availability is geographically limited — you must live in a PACE organization's service area.
- The program is voluntary enrollment, but once enrolled, participants cannot be in Medicare Advantage plans or hospice.
- Search results do not provide specific income/asset limits for Missouri PACE specifically — these vary by state Medicaid rules and should be verified with your local PACE organization.

**Data shape:** This program has no income or asset requirements for enrollment itself, though Medicaid coverage (which funds ~90% of participants) has its own financial criteria. The program is service-based, not cash-based. Availability is provider-limited, not statewide.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** mydss.mo.gov/mhd/pace

---

### Medicare Savings Program (MSP)


**Eligibility:**
- Income: MSP in Missouri includes QMB (≤100% FPL), SLMB1 (100-120% FPL), SLMB2/QI (120-135% FPL). Exact 2026 monthly limits (with $20 general disregard): QMB single $1,325/couple $1,783; SLMB single $1,585/couple $2,135; QI single $1,781/couple $2,400. Limits based on Federal Poverty Level for assistance group size; higher for working disabled (half employment income counted).[1][2][4][6]
- Assets: Resources ≤$9,660 single/$14,470 couple (federal standard used in MO for QMB/SLMB/QI); some sources cite $9,950 single/$14,910 couple. Counts typical countable assets (bank accounts, stocks); exempts home, one car, burial plots, life insurance (details per federal/MO rules). Refer to MO Aged/Blind/Disabled chart for current.[1][2][4][6]
- Enrolled in Medicare Part A
- Missouri resident intending to stay
- U.S. citizen or qualified non-citizen

**Benefits:** QMB: Medicare Part A/B premiums (if owed), deductibles, coinsurance/copays. SLMB1/SLMB2/QI: Part B premium only ($202.90/month in 2026). Automatic Low Income Subsidy (LIS) eligibility.[1][2][4][6][8]
- Varies by: priority_tier

**How to apply:**
- Online: mydss.mo.gov or tinyurl.com/MSP-apply (download PDF)
- In-person: Local FSD Resource Center
- Phone/mail: Contact local FSD office (numbers via mydss.mo.gov)
- Standard MO HealthNet app covers MSP too

**Timeline:** Not specified; FSD mails approval/denial notice
**Waitlist:** QI (SLMB2) first-come first-served with potential funding limits[6]

**Watch out for:**
- SLMB2/QI cannot overlap with full MO HealthNet[1]
- Must be enrolled in Medicare Part A first[1][3]
- QI has first-come funding caps[4][6]
- Working disabled: only ~half employment income counted, may qualify higher[2]
- Assets exempt home/car/burial but countable items often missed[1][2]
- Automatic LIS but apply even if unsure[4]

**Data shape:** Tiered by income %FPL (QMB/SLMB1/SLMB2-QI) with federal asset limits; scales by household size via FPL; statewide but local FSD processing; no age req but Medicare-tied (typically 65+ or disabled)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mydss.mo.gov/medicare-cost-savings-programs or https://dmh.mo.gov/medicaid-eligibility/qmb-slmb-coverage

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member aged 60+ or disabled (relevant for elderly loved ones): No gross income limit. Net income limit at 100% of Federal Poverty Level (FPL). Examples for Oct 1, 2025–Sept 30, 2026: $15,060 annual ($1,255 monthly) for 1 person; $20,440 annual ($1,703 monthly) for 2 people. Most households (without elderly/disabled) must meet gross income at 130% FPL and net at 100% FPL. Net income = gross minus deductions (e.g., 20% earned income, standard deduction, medical expenses over $35/month for elderly/disabled, shelter costs).[1][2][4][5][7]
- Assets: Households with member 60+ or disabled: $4,500 (FY2025). All others: $3,000. Exempt: home, vehicles, life insurance, burial plots/prepaid burials, personal property not producing income, retirement savings/pension plans, Native payments, inaccessible resources.[4][5][7]
- Reside in Missouri.
- Have or apply for SSN for all household members.
- Household includes those who live together and buy/prepare food together.
- U.S. citizen or qualified non-citizen (recent changes via One Big Beautiful Bill Act of 2025 may affect non-citizen eligibility).[5][6]

**Benefits:** Monthly EBT card for groceries (no cash). Amount based on household size, net income, deductions. Example: 2-person elderly/disabled household with $1,200 gross may get $415/month (max allotment minus 30% net income). Varies; scales with household size and expenses.[6]
- Varies by: household_size

**How to apply:**
- Online: mydss.mo.gov/food-assistance/apply-for-snap
- Phone: Local Family Support Division office (find via mydss.mo.gov/contact)
- Mail: Form to local FSD office
- In-person: Local Family Support Division office

**Timeline:** Typically 30 days; expedited if very low income (7 days). Elderly/disabled may get longer certification (up to 24 months).[4][5]

**Watch out for:**
- Households with elderly (60+) exempt from gross income test and have higher asset limit ($4,500), but still need net income test—many miss deductions like medical/shelter costs.[1][4]
- Only 43% of eligible Missouri seniors participate due to application stigma, tech barriers, or unawareness.[8]
- Social Security/pensions count as income; must include all who buy/prepare food.[2][5]
- Resources exclude retirement savings but include accessible cash—people often overlook.[4][5]
- Recent federal changes (2025 Act) affect work rules for 55-64 and non-citizens.[6][7]

**Data shape:** Elderly households (60+) exempt from gross income test, higher asset limit, excess medical deductions via Simplified Medical Deduction (SMD) option; benefits scale by household size/net income; statewide uniform but local FSD offices process.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mydss.mo.gov/food-assistance/apply-for-snap

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Gross monthly income limits (2025): 1 Person $2,839; 2 People $3,713; 3 People $4,587; 4 People $5,461; 5 People $6,335; 6 People $7,209. Varies by household size; uses prior month's income (e.g., September for October applications by elderly/disabled).[1][3]
- Assets: Available resources limited to $3,000 or less in bank accounts, investments, or retirement accounts. Counts liquid assets; exemptions not specified in sources.[2][5]
- Missouri resident
- U.S. citizen or legally admitted for permanent residence
- Responsible for paying home energy costs (included on utility bill)
- Over 18 and live in household
- Social Security numbers for all household members
- Household includes all at address sharing utility bill

**Benefits:** Heating Assistance: $153 minimum to $495 maximum. Winter Crisis: up to $800. Summer Crisis: up to $300. Payments sent directly to energy suppliers.[1]
- Varies by: household_size|priority_tier|fuel_type

**How to apply:**
- Contact local contracted agency by county (agency finder via state site or utilities like Ameren)
- Phone: Varies by agency, e.g., (573) 200-6655 for some regions[5]
- In-person or mail to local agency
- No statewide online application specified; apply through local providers

**Timeline:** Eligibility determined via LIHEAP Worksheet (E1LW); notifications and payments after verification. Pre-certification for elderly/disabled.[3]
**Waitlist:** Funds limited; applications processed first-come first-served by priority (elderly/disabled start Oct 1/Nov 1).[1][3][5]

**Watch out for:**
- Priority for elderly (60+) and disabled: applications start Oct 1, others Nov/Dec 1; funds often run out[1][3][5]
- No cooling assistance except summer crisis emergencies[1]
- Household includes all sharing utility bill, even non-related[1]
- Must reapply yearly; changes require new app[5]
- Assets include retirement/investments up to $3,000 limit[2][5]
- EA now Oct-Sep, but crisis has specific windows[4]

**Data shape:** Administered via 50+ local contracted agencies by county; priority tiers for elderly/disabled; two components (regular heating EA + crisis ECIP); benefits scale by income/size/fuel; seasonal with early access for seniors.

**Source:** https://dss.mo.gov/fsd/energy-assistance (policy manual at https://dss.mo.gov/fsd/energy-assistance/pdf/liheap-manual.pdf)

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the federal poverty guidelines. Priority given to those over age 60, with disabilities, or children in the home. SSI or TANF recipients automatically eligible. For households over 8 members, add $10,760 per additional member (per some agencies); 2026 guidelines referenced with additions of $11,000 per person over 4 (per Spire). Exact table not in results—contact local agency for current 200% FPL by household size[1][2][3][8].
- Assets: No asset limits mentioned[1][2][3][4][5][6].
- Own or rent single-family home, multi-family up to 4 units, or mobile home[1].
- Renters need written landlord permission[1][3][5][6].
- Home not previously weatherized[4][5].
- Proof of income for prior 3 months for all household members[1][4].

**Benefits:** Free energy-efficient home improvements including: reducing air infiltration (weather-stripping, caulking), increasing insulation (attics, walls, floors, foundations, pipes, ducts), HVAC repair/replacement, water heater blankets, LED lighting, furnace tune-up/repair/replacement, addressing health/safety issues. Determined by on-site energy audit. Saves average $370/year in heating/cooling[2][3][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization agency (18 statewide)—call 211 or find via Missouri DNR[3][7][8].
- Examples: CMCA (Audrain, Boone, etc. counties) at cmca.us/get-help/weatherization/[1]; Jefferson Franklin CAC at jfcac.org/weatherization.html[2]; CAASTLC application instructions[4]; East MO Action Agency at eastmoaa.org/services/weatherization/[5].
- In-person/mail with forms and documents[1][4].

**Timeline:** Not specified—follows steps: eligibility check, waitlist, audit, contractor work, inspection[1][3].
**Waitlist:** Eligible applicants placed on waiting list[1].

**Watch out for:**
- Must contact specific local agency for your area—not centralized[3][7].
- Renters absolutely need landlord permission in writing[1][3][5].
- Home cannot have been weatherized before[4][5].
- Priority to elderly/disabled/families with kids, but all under 200% FPL can apply[2].
- Waiting lists common[1].
- Owners of multi-unit/rental may share costs[5].
- Provide income proof for ALL household members, including zero-income forms[1][4].

**Data shape:** Administered by 18 regional agencies with service areas; income at 200% FPL with priority tiers; no statewide central application—local contacts required; documents emphasize 3-month income verification and zero-income certifications.

**Source:** https://dnr.mo.gov/energy/weatherization/low-income-assistance[3]

---

### Missouri State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare-eligible individuals, their families, and caregivers, including those with limited incomes[1][2][4]
- Assets: No asset limits or tests apply[1][2][4]
- Must be eligible for Medicare (typically age 65+ or under 65 with certain disabilities), or be a family member/caregiver of a Medicare beneficiary[1][2][4]

**Benefits:** Free, unbiased, confidential one-on-one counseling and education on Medicare options (Parts A, B, C, D, Medigap); help choosing plans; assistance determining eligibility for Low-Income Subsidy (Extra Help) and Medicare Savings Programs; help with appeals, claims, and reporting fraud via Senior Medicare Patrol (SMP); group presentations and outreach; no sales or fees[1][2][4]

**How to apply:**
- Phone: 1-800-390-3330[1][3][5][6]
- Website: https://www.missouriship.org (for counseling requests and info)[4][6]
- In-person: Through local volunteer counselors and community partners throughout Missouri[4]
- No specific online form or mail application mentioned; contact initiates service

**Timeline:** No formal processing; counseling available throughout the year upon contact, though one-on-one may require scheduling[1][4]

**Watch out for:**
- Not an insurance seller—does not enroll you directly but guides you; rebranded from Missouri CLAIM in 2023, so search old name may confuse[1][4]
- Services are year-round but emphasize Medicare Open Enrollment (Oct 15-Dec 7); review plans annually[1][3]
- For actual subsidies like Extra Help, separate applications needed post-counseling[1][2]
- Targeted at Medicare eligibles—does not provide direct healthcare or payments[2][4]

**Data shape:** no income/asset test; counseling-only service via statewide volunteer network; focuses on Medicare navigation and subsidy eligibility assistance rather than direct financial aid

**Source:** https://www.missouriship.org[4]

---

### Missouri Caregiver Program (Alzheimer’s Association Caregiver Relief Track)


**Eligibility:**
- Income: No income limits; program is free of charge to all eligible caregivers[2][5].
- Assets: No asset limits mentioned[2][5].
- Care recipient must reside in Missouri and live at home (not in long-term care facilities)[1][2][5].
- Caregiver must live in the same home as the care recipient and be the primary/full-time caregiver[1][2][5].
- Care recipient must have a probable diagnosis of Alzheimer's disease or related dementia[2][5].
- Enrollment contingent on funding availability, first-come first-served[2].

**Benefits:** Track Two (Alzheimer’s Association): Reimbursement up to $700 for respite services including assessment/care coordination, adult day care, in-home care, nutritional supplements, safety/supportive programs, education/counseling[1][2]. Other tracks: Track One (Memory Care Home Solutions) - in-home assessment, customized caregiver training/education; Track Three - assistive technology/devices[2][5].
- Varies by: fixed

**How to apply:**
- Phone: Contact Missouri Department of Health and Senior Services or partners (specific numbers not listed in sources; call local Alzheimer’s Association chapter)[2].
- Visit: https://health.mo.gov/seniors/dementia-caregiving/ for details and enrollment[2].
- Partners: Alzheimer’s Association Greater Missouri Chapter, Memory Care Home Solutions[1][5].

**Timeline:** Funds must be used within 45 days of enrollment (older info); current timelines not specified[1].
**Waitlist:** First-come, first-served based on funding availability; potential waitlist if funds exhausted[2].

**Watch out for:**
- Limited to home-dwelling care recipients; ineligible if in long-term care[1][2].
- Funding capped and first-come first-served; may run out[2].
- Must use funds quickly (e.g., within 45 days per older flyer); check current rules[1].
- Three tracks available; caregivers can enroll in multiple, but confirm with provider[5].
- Not ongoing; appears grant/temporally funded (e.g., FY25 references, past deadlines like May 2021)[1][8].

**Data shape:** Grant-funded with tracks (Training via Memory Care, Relief via Alzheimer’s Assoc., Assistive Tech); no income/asset tests; statewide but partner-delivered; funding-limited with use-it-quickly rules[1][2][5].

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.mo.gov/seniors/dementia-caregiving/[2]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; families must check current federal poverty guidelines as specific 2026 figures are not listed in sources. Excluded income includes: Social Security Disability Income, 25% of Social Security Income, unemployment benefits, SNAP benefits, housing benefits, and certain veterans' payments[1][2][3][7].
- Assets: No asset limits mentioned in sources[1][2][3].
- Unemployed at time of application[1][2][3][7]
- U.S. citizen or eligible non-citizen (inferred from federal program standards, not explicitly stated for MO)
- Priority given to veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, low employment prospects, or prior American Job Center users[3]

**Benefits:** Part-time community service work-based job training (average 20 hours/week at highest of federal, state, or local minimum wage); Individual Employment Plan (updated every 6 months); on-the-job skill training; job placement assistance (resume help, interview coaching, job search); annual health screening; supportive services (benefit application assistance, access to local resources for basic needs); placements at non-profits or public agencies like schools, hospitals, senior centers[1][2][3][4][5].
- Varies by: priority_tier

**How to apply:**
- Phone: Missouri Department of Health and Senior Services (contact via main site) or MERS/Goodwill SCSEP at 1-888-651-4177[1][5][7]
- Online: Request application via MERS Goodwill form (eastern/central/southeast MO)[5]
- In-person: Local providers like MERS Goodwill offices in St. Louis and surrounding counties, southeast MO[5][7]
- Mail: Not specified, but applications can be requested via phone/online[5][7]

**Timeline:** Not specified in sources
**Waitlist:** Likely due to availability in many counties (not statewide); regional variations implied but not detailed[1]

**Watch out for:**
- Income exclusions are specific (e.g., only 25% of SS income excluded, full SSDI excluded)—families must calculate carefully[1]
- Not available in all MO counties; check local availability[1][5]
- Must be unemployed at application; program emphasizes transition to unsubsidized jobs with required job search[3][4]
- Priority tiers affect entry, not benefits[3]
- Part-time training wage only, not full employment or other benefits like healthcare[1][3]

**Data shape:** Income test at 125% FPL with specific exclusions; county-restricted availability via sub-grantees like MERS Goodwill; priority tiers for enrollment; not statewide

**Source:** https://health.mo.gov/seniors/senioremployment/

---

### Legal Services of Eastern Missouri (Senior Legal Hotline)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Low-income status required; specific dollar amounts or household size table not detailed in sources. Families must provide household income information during application screening.
- Assets: Assets considered; specific limits or exemptions not detailed. Families must provide household asset information during application.
- Resident of one of 21 counties in eastern Missouri
- Civil legal issues only (no criminal, traffic, bankruptcy, or personal injury cases; family law limited to domestic violence/abuse)
- Consistent with available resources

**Benefits:** Free civil legal assistance including: eviction defense, lease terminations, bad housing conditions, disability accommodations, SNAP benefits, Medicaid, older adult abuse, orders of protection, divorces, resources/referrals, immigration, legal help for grandparents/relatives caring for minors; community legal education for seniors/groups/agencies
- Varies by: priority_tier

**How to apply:**
- Online: https://lsem.org/get-help-now/ (Apply Now tab, anytime)
- Phone: 800.444.0514 or 314.534.4200 (intake 9AM-5PM Monday, Wednesday, Thursday only; calls directed to messaging center for callback)
- In-person: Five regional offices (contact closest via main numbers); monthly clinic at St. Louis Public Library Central Library (9AM-noon, third Thursday of each month)

**Timeline:** Callback within 3-5 business days for intake screening after phone message or online application
**Waitlist:** Services consistent with available resources (implying potential wait or prioritization)

**Watch out for:**
- Phone applications only Monday, Wednesday, Thursday 9AM-5PM; all calls go to messaging for 3-5 day callback
- Not a dedicated 'hotline'—part of Advocates for Older Adults Program; services limited by resources/priority
- Excludes criminal/traffic/bankruptcy/personal injury; family law only if abuse-related
- Must reside in specific 21 eastern Missouri counties
- Prepare income/assets info upfront

**Data shape:** county-restricted to 21 eastern Missouri counties; priority to Older Americans Act areas (income/healthcare/housing/abuse); no specific income/asset dollar limits published; services via central intake with regional offices

**Source:** https://lsem.org/advocates-for-older-adults/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to any resident regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a long-term care facility in Missouri, such as nursing homes, residential care facilities, assisted living, skilled care nursing homes, residential care homes, or veteran homes.

**Benefits:** Advocacy services including identifying, investigating, and resolving complaints related to health, safety, welfare, and rights; providing information on long-term services and supports; representing residents before governmental agencies; seeking administrative, legal, or other remedies; regular facility visits by trained volunteers; education on resident rights; mediation and problem-solving to improve quality of life.

**How to apply:**
- Phone: (800) 309-3282 (toll-free) or (573) 526-0727 (local)
- Email: LTCOmbudsman@health.mo.gov
- Contact regional Area Agency on Aging (AAA) or service provider for local assistance
- In-person: Through local ombudsman programs operated by AAAs

**Timeline:** Immediate assistance upon contact; no formal processing as it is complaint-driven advocacy, not an enrollment program.

**Watch out for:**
- This is not a financial aid, healthcare, or housing program—it's purely advocacy and complaint resolution for residents already in facilities; families cannot 'apply' for placement via this program; services are for residents, not prospective ones; relies on volunteers, so response may vary by local coverage; not for facility staff or volunteers to use personally due to conflict of interest rules.

**Data shape:** no income or asset test; complaint-driven advocacy only for current long-term care residents; delivered via statewide network of regional AAAs with volunteer ombudsmen; no enrollment or waitlist.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.mo.gov/seniors/ombudsman/

---

### Missouri Rx Program (MoRx)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility tied to MO HealthNet (Medicaid) enrollment, not standalone Medicare Part D. Post-2017 changes: Individuals with only Medicare are ineligible. Eligible if enrolled in straight MO HealthNet (paying premium via Ticket to Work or Home and Community Based Services), MO HealthNet spenddown (met at least once per year), or Medicare Savings Programs (QMB, SLMB1, SLMB2). Older sources list income limits like single ≤$20,800-$21,660 or married ≤$28,000-$29,140 gross annual household income, or single ≤$15,315/maried ≤$20,535 with resources ≤$11,710/$23,410, but current eligibility requires MO HealthNet linkage.[1][2][3]
- Assets: Older eligibility (pre-2017 changes) had asset limits: single ≤$11,990-$11,710, married ≤$23,970-$23,410. Liquid assets include savings, investments, real estate (primary home, vehicles, burial plots, personal possessions exempt). Current eligibility via MO HealthNet may involve similar resource tests depending on category.[2][3]
- Missouri resident
- Enrolled in Medicare Part D plan (required for coordination)
- Automatically enrolled if receiving MO HealthNet benefits (full, spenddown met once/year, or Medicare premium coverage)
- Not eligible if only Medicare Part D without MO HealthNet (expired June 30, 2017)

**Benefits:** Pays 50% of out-of-pocket costs (deductible, co-pays, coverage gap) on medications covered by Medicare Part D plan after Part D pays. Covers Medicare-excluded drugs (specific OTC drugs, vitamins, minerals, limited cough/cold drugs) if MO HealthNet eligibility met. Participant pays remaining 50% co-pay (pharmacy may refuse service if unpaid). No co-pay after first full month in long-term care facilities (skilled nursing, ICF-MR, inpatient psych). For dual eligibles, 2021 co-pays capped at $3.30 generic/$9.20 brand (MoRx pays 50%).[3][4][5]
- Varies by: priority_tier

**How to apply:**
- Automatically enrolled if eligible via MO HealthNet/Medicare Savings Programs[2][4]
- For MO HealthNet spenddown or eligibility changes, call Family Support Division: 1-855-373-4636[2]
- Older enrollment via MoRx Enrollment Form (mailed? specific address/form not in current sources; do not send if in MO HealthNet or employer plan)[3]
- Website: https://mydss.mo.gov/mhd/morx-general-faqs (FAQs, no direct apply link)[4]

**Timeline:** Not specified in sources

**Watch out for:**
- Major 2017 change: No longer eligible with only Medicare Part D; must have MO HealthNet linkage (full, spenddown met once/year, or Medicare Savings). Last day for pure Medicare Part D was June 30, 2017[2][7]
- Participant must pay their 50% co-pay share; pharmacy can refuse service[4][5]
- Spenddown must be met at least once per calendar year for MoRx to activate on meds[4]
- Dual eligibles pay premium difference if choosing non-benchmark Part D plan (2021 benchmark $30.48)[5]
- Older income/asset limits in sources may not reflect current MO HealthNet rules; verify via FSD[1][2][3]
- Do not apply MoRx form if already in MO HealthNet[3]

**Data shape:** Eligibility overhauled in 2017 to require MO HealthNet enrollment (not standalone); auto-enrollment for qualified; benefits fixed at 50% OOP on Part D drugs; outdated sources show pre-change income/asset tables; spenddown activation once/year

**Source:** https://mydss.mo.gov/mhd/morx-general-faqs

---

### Missouri Property Tax Credit (Circuit Breaker)


**Eligibility:**
- Age: 65+
- Income: Income limits vary by filer status and housing type. For homeowners who owned and occupied the entire year: single filers $30,000 or less; married filing combined $34,000 or less. For renters or part-year owners: single filers $27,200 or less; married filing combined $29,200 or less. Household income includes Social Security, pensions, wages, dividends, interest, rental income, public assistance, unemployment, SSI, TANF, child support, and non-business losses (veteran benefits excluded if 100% disabled). Credits phase out incrementally above $14,300, fully at maximum limits.[1][2][3][5]
- Assets: No asset limits apply.[5]
- Must be Missouri resident for entire calendar year.
- Age 65 or older by December 31 of tax year, OR under 65 and 100% disabled (as determined by Social Security Administration, Veterans Affairs, or Railroad Retirement Board).
- For renters: Landlord must pay property taxes (ineligible if renting from facility that does not pay property taxes).
- Homeowners: Owned and occupied home (full year for higher limits).
- Must truthfully state no employment of illegal or unauthorized aliens.[5]
- Surviving spouses age 65+ who met requirements before death may qualify.[8]

**Benefits:** Tax credit up to $750 for renters/part-year owners (based on rent paid); up to $1,100 for full-year homeowners (based on real estate taxes paid). Amount determined by taxes/rent paid and total household income; phases out incrementally.[1][2][3][5][7]
- Varies by: household_income|housing_type

**How to apply:**
- File with Missouri income tax return (Form MO-1040) using Form MO-PTS.
- If no income tax return required, file standalone Form MO-PTC.
- Download forms and instructions from dor.mo.gov/forms.
- Email questions to PropertyTaxCredit@dor.mo.gov.
- Call for assistance: Aging Ahead at 800-243-6060 or 636-207-0847.[1]
- Local options (e.g., Eureka: Submit MO-PTC or MO-PTS copy to city by April 15 for utility adjustment).[4]

**Timeline:** Not specified in sources; typically processed with tax return (file by April 15).

**Watch out for:**
- Do not use MO-PTC if filing MO-1040 (use MO-PTS instead).[5]
- Renters ineligible if facility does not pay property taxes.[7]
- Income includes nontaxable sources like Social Security and SSI.[3]
- Limits unchanged since 2008; inflation reduces real value; proposed bills (e.g., SB 15, HB518) seek increases but not yet law.[2][8]
- Dependent/ joint tenancy situations may affect household income calculation.[1]
- Must be full-year resident.[5]

**Data shape:** Income limits differentiated by single/married and full-year homeowner vs. renter/part-year; refundable credit scales by taxes/rent paid and phases by income tiers; no asset test; tax form-integrated.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/

---

### Missouri Aged & Disabled Waiver (ADW)


**Eligibility:**
- Age: 63+
- Income: Specific income limits not detailed in sources; must be enrolled in Missouri Medicaid (MO HealthNet) with correct eligibility code. Other waivers mention approximate limits like $1,109/month for single applicant (2025 figures from similar programs, not confirmed for ADW)[2].
- Assets: Home equity interest no greater than $752,000 in 2026. Home exempt if applicant lives there or intends to return, or if spouse/minor child (under 21)/adult blind or disabled child (21+) lives there. Subject to Medicaid Estate Recovery[1]. Other assets up to approximately $6,068.80 for single applicant referenced in similar waiver (2025, not confirmed for ADW)[2].
- Missouri resident
- U.S. citizen or qualified alien
- Social Security number[8]
- Nursing Facility Level of Care (NFLOC) determined by InterRAI HC assessment (scores based on ADLs like mobility, eating, toileting, bathing, dressing; cognition for dementia)[1]
- At risk of institutionalization; live in home or intend to return[1][6]
- Enrolled in MO HealthNet/Medicaid[2]

**Benefits:** Adult day care, homemaker services, chore services, basic respite, advanced respite, home-delivered meals[1][3][5][6][7]. Specific dollar amounts or hours per week not specified; services to meet unmet needs equivalent to nursing home care[6].
- Varies by: fixed

**How to apply:**
- Contact Department of Health and Senior Services, Division of Senior and Disability Services (administers program)[6][7]
- Local case management agencies or Area Agencies on Aging[3]
- No specific phone, online URL, mail, or in-person details in sources; start via MO HealthNet/DSS
- Functional assessment (InterRAI HC) required[1]

**Timeline:** Not specified in sources
**Waitlist:** Limited enrollment slots; not an entitlement program, so waitlist possible despite meeting eligibility[4]

**Watch out for:**
- Not an entitlement; limited slots mean possible waitlist even if eligible[4]
- Home equity limit $752,000 (2026); home may be subject to Medicaid Estate Recovery[1]
- Dementia diagnosis alone does not qualify; must meet NFLOC via InterRAI HC assessment[1]
- Must be enrolled in MO HealthNet first[2]
- Ages 63-64 must have physical disability; continues at 65[1]

**Data shape:** Limited enrollment (not entitlement); NFLOC via specific InterRAI HC tool; home equity-capped exemption with estate recovery risk; statewide but local agency delivery[1][4][6][7]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[7]

---

### No Tax on Social Security Benefits

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: For tax years 2023 and prior: Missouri adjusted gross income must be $85,000 or less for single, head of household, or qualifying widow(er); $100,000 or less for married filing combined; $85,000 or less for married filing separately to qualify for full deduction. For tax years beginning on or after January 1, 2024: No income limits; 100% of social security benefits for individuals age 62 or older (and 100% of social security disability benefits) are not taxed, as long as included in federal adjusted gross income under IRC §86.[1]
- Assets: No asset limits apply.
- Benefits must be included in federal adjusted gross income under IRC §86 (for post-2024).
- Applies to social security benefits or social security disability benefits.[1]

**Benefits:** 100% exemption from Missouri state income tax on social security benefits (or social security disability benefits). No specific dollar amount, as it depends on the individual's benefit amount; full exemption regardless of benefit size once eligible.[1][4]
- Varies by: fixed

**How to apply:**
- Claim the deduction when filing Missouri state income tax return (MO-1040). No separate application; handled through standard tax filing process. Contact Missouri Department of Revenue for tax assistance: (573) 751-3505 or visit dor.mo.gov.[1]

**Timeline:** Determined upon filing and processing of annual Missouri state income tax return; typically aligns with standard tax refund/processing timelines (6-8 weeks for e-filed returns).

**Watch out for:**
- Pre-2024 income limits still apply if filing for those years; exceeds limits means partial or no deduction.[1]
- Deduction only for benefits included in federal AGI under IRC §86; not all benefits qualify federally.[1][7]
- Public pension deductions reduced if also claiming social security deduction.[1]
- Federal taxes may still apply (up to 85% taxable based on combined income).[7]
- Not a cash benefit or service; only affects state income tax liability when filing.[4]

**Data shape:** Tax deduction claimed on annual state income tax return, not a standalone program with application; changed in 2024 to full exemption without income limits.[1][2][4]

**Source:** https://dor.mo.gov/faq/taxation/individual/pension.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MO HealthNet | benefit | state | deep |
| Structured Family Caregiving Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Program (MSP) | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Missouri State Health Insurance Assistan | resource | federal | simple |
| Missouri Caregiver Program (Alzheimer’s  | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services of Eastern Missouri (Seni | resource | local | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Missouri Rx Program (MoRx) | benefit | state | deep |
| Missouri Property Tax Credit (Circuit Br | benefit | state | deep |
| Missouri Aged & Disabled Waiver (ADW) | benefit | state | deep |
| No Tax on Social Security Benefits | benefit | state | medium |

**Types:** {"benefit":12,"resource":3,"employment":1}
**Scopes:** {"state":7,"local":2,"federal":7}
**Complexity:** {"deep":11,"simple":3,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/MO/drafts.json`.

- **MO HealthNet** (benefit) — 5 content sections, 6 FAQs
- **Structured Family Caregiving Waiver** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE) - Missouri** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **not_applicable**: 3 programs
- **not_applicable — coverage is comprehensive once enrolled**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|fuel_type**: 1 programs
- **fixed**: 3 programs
- **household_income|housing_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MO HealthNet**: Fixed asset/income limits for ABD elderly (not scaling by household size beyond couple); separate tracks for nursing home vs HCBS (different income rules); NFLOC mandatory for long-term care; spend down pathway unique for medically needy
- **Structured Family Caregiving Waiver**: Tied to existing live-in caregiver (not new hires); requires agency employment for payment and substitute; dementia-specific with NFLOC; Medicaid prerequisite with no unique income/asset tables beyond standard.
- **Program of All-Inclusive Care for the Elderly (PACE) - Missouri**: This program has no income or asset requirements for enrollment itself, though Medicaid coverage (which funds ~90% of participants) has its own financial criteria. The program is service-based, not cash-based. Availability is provider-limited, not statewide.
- **Medicare Savings Program (MSP)**: Tiered by income %FPL (QMB/SLMB1/SLMB2-QI) with federal asset limits; scales by household size via FPL; statewide but local FSD processing; no age req but Medicare-tied (typically 65+ or disabled)
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly households (60+) exempt from gross income test, higher asset limit, excess medical deductions via Simplified Medical Deduction (SMD) option; benefits scale by household size/net income; statewide uniform but local FSD offices process.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered via 50+ local contracted agencies by county; priority tiers for elderly/disabled; two components (regular heating EA + crisis ECIP); benefits scale by income/size/fuel; seasonal with early access for seniors.
- **Weatherization Assistance Program (WAP)**: Administered by 18 regional agencies with service areas; income at 200% FPL with priority tiers; no statewide central application—local contacts required; documents emphasize 3-month income verification and zero-income certifications.
- **Missouri State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling-only service via statewide volunteer network; focuses on Medicare navigation and subsidy eligibility assistance rather than direct financial aid
- **Missouri Caregiver Program (Alzheimer’s Association Caregiver Relief Track)**: Grant-funded with tracks (Training via Memory Care, Relief via Alzheimer’s Assoc., Assistive Tech); no income/asset tests; statewide but partner-delivered; funding-limited with use-it-quickly rules[1][2][5].
- **Senior Community Service Employment Program (SCSEP)**: Income test at 125% FPL with specific exclusions; county-restricted availability via sub-grantees like MERS Goodwill; priority tiers for enrollment; not statewide
- **Legal Services of Eastern Missouri (Senior Legal Hotline)**: county-restricted to 21 eastern Missouri counties; priority to Older Americans Act areas (income/healthcare/housing/abuse); no specific income/asset dollar limits published; services via central intake with regional offices
- **Long-Term Care Ombudsman Program**: no income or asset test; complaint-driven advocacy only for current long-term care residents; delivered via statewide network of regional AAAs with volunteer ombudsmen; no enrollment or waitlist.
- **Missouri Rx Program (MoRx)**: Eligibility overhauled in 2017 to require MO HealthNet enrollment (not standalone); auto-enrollment for qualified; benefits fixed at 50% OOP on Part D drugs; outdated sources show pre-change income/asset tables; spenddown activation once/year
- **Missouri Property Tax Credit (Circuit Breaker)**: Income limits differentiated by single/married and full-year homeowner vs. renter/part-year; refundable credit scales by taxes/rent paid and phases by income tiers; no asset test; tax form-integrated.
- **Missouri Aged & Disabled Waiver (ADW)**: Limited enrollment (not entitlement); NFLOC via specific InterRAI HC tool; home equity-capped exemption with estate recovery risk; statewide but local agency delivery[1][4][6][7]
- **No Tax on Social Security Benefits**: Tax deduction claimed on annual state income tax return, not a standalone program with application; changed in 2024 to full exemption without income limits.[1][2][4]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Missouri?
