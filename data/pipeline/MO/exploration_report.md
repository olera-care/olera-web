# Missouri Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 10.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 17 |
| New (not in our data) | 10 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 7 programs
- **financial**: 5 programs
- **service|advocacy**: 1 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### MO HealthNet (Medicaid)

- **income_limit**: Ours says `$1109` → Source says `$860` ([source](https://mydss.mo.gov/healthcare/apply))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Doctor visits including yearly check-ups, hospital stays, prescription medicines, mental health services, long-term care (nursing home, home and community-based services via waivers), dental/vision in some cases. Specific programs like MHABD cover aged/blind/disabled needs; Medicare Savings Programs (QMB, SLMB, QI) pay Medicare premiums/cost-sharing up to specified limits.[5][7]` ([source](https://mydss.mo.gov/healthcare/apply))
- **source_url**: Ours says `MISSING` → Source says `https://mydss.mo.gov/healthcare/apply`

### Missouri PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$1690` → Source says `$2,901` ([source](https://mydss.mo.gov/mhd/pace))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive health care, social, recreational, and wellness services including primary care, hospital/institutional care when needed, prescription drugs, medical equipment, therapies, personal care, adult day health care, home care, respite care—all to enable living at home instead of nursing facilities. No specific dollar amounts or hours stated; individualized based on needs[2][3][8].` ([source](https://mydss.mo.gov/mhd/pace))
- **source_url**: Ours says `MISSING` → Source says `https://mydss.mo.gov/mhd/pace`

### Medicare Savings Program (MSP)

- **income_limit**: Ours says `$1407` → Source says `$1,325` ([source](https://mydss.mo.gov/medicare-cost-savings-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums ($202.90/month in 2026[7]), and cost-sharing (deductibles, copayments, coinsurance) for Parts A and B[2][3]. SLMB1 and SLMB2: Pay Part B premiums only ($202.90/month in 2026[7]). QI: Pays Part B premiums only ($202.90/month in 2026[7]). Potential monthly savings: $202.90 or more depending on tier[6].` ([source](https://mydss.mo.gov/medicare-cost-savings-programs))
- **source_url**: Ours says `MISSING` → Source says `https://mydss.mo.gov/medicare-cost-savings-programs`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `No minimum age requirement for the household, but special rules apply if any household member is 60 or older` ([source](mydss.mo.gov/food-assistance/apply-for-snap and fns.usda.gov/snap/eligibility/elderly-disabled-special-rules))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly food assistance benefits; amount varies by household income and size. Example: 2-person elderly/disabled household with $1,200 gross income receives $415/month[5]` ([source](mydss.mo.gov/food-assistance/apply-for-snap and fns.usda.gov/snap/eligibility/elderly-disabled-special-rules))
- **source_url**: Ours says `MISSING` → Source says `mydss.mo.gov/food-assistance/apply-for-snap and fns.usda.gov/snap/eligibility/elderly-disabled-special-rules`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including identifying, investigating, and resolving complaints related to health, safety, welfare, and rights; providing information on long-term services and supports; representing residents before agencies; seeking remedies; regular facility visits by trained volunteer ombudsmen to promote dignity, respect, protect rights, and voice concerns to facility management; community education on resident rights and long-term care issues` ([source](http://health.mo.gov/seniors/ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `http://health.mo.gov/seniors/ombudsman/`

### Missouri Property Tax Credit (Circuit Breaker)

- **income_limit**: Ours says `$30000` → Source says `$30,000` ([source](https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Tax credit up to $750 for renters/part-year owners; up to $1,100 for full-year homeowners. Exact amount based on real estate taxes or rent paid and total household income (phases down incrementally above $14,300 until full phase-out at income limits).[1][3][4][6][8]` ([source](https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/))
- **source_url**: Ours says `MISSING` → Source says `https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/`

### Aged and Disabled Waiver (ADW)

- **income_limit**: Ours says `$1690` → Source says `$903` ([source](https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services (HCBS): adult day care, homemaker services, chore services, basic respite, advanced respite, home-delivered meals. Specific hours/dollars not fixed; based on assessed needs to avoid nursing home placement[1][4][5][6][7].` ([source](https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm))
- **source_url**: Ours says `MISSING` → Source says `https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm`

## New Programs (Not in Our Data)

- **Structured Family Caregiving Waiver** — service ([source](https://mydss.mo.gov/mhd/waiver/structured-family-caregiving))
  - Shape notes: Strictly limited to Alzheimer's/related dementias age 21+; requires live-in primary caregiver (paid via provider) with mandatory substitute; no fixed service hours/dollars—instead plan-of-care based; statewide but provider-dependent; excludes other waivers/facility residents.
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://dss.mo.gov/fsd/energy-assistance (inferred from policy manual); agency-specific sites like https://www.ameren.com/bill/assistance/liheap))
  - Shape notes: Priority tiers for elderly (60+) and disabled with earlier access; two components (regular Energy Assistance + Crisis); local agency administration leads to regional processing variations; annual reapplication required
- **Weatherization Assistance Program (WAP)** — service ([source](https://dnr.mo.gov/energy/weatherization[4][7]))
  - Shape notes: Administered statewide by 18 local agencies with priority tiers; income at 200% FPL; services determined by energy audit per home.
- **Missouri State Health Insurance Assistance Program (Missouri SHIP)** — service|advocacy ([source](missouriship.org))
  - Shape notes: Missouri SHIP is a counseling and education service, not a financial assistance or insurance program. It has no income limits, asset limits, or application process in the traditional sense — it's a free resource anyone Medicare-eligible can access by calling or visiting a local partner. The program's 'benefit' is information and guidance, not direct financial aid or coverage. This is fundamentally different from needs-based programs like Medicaid.
- **Commodity Supplemental Food Program (CSFP)** — in_kind ([source](https://health.mo.gov/living/wellness/nutrition/foodprograms/csfp/[2]))
  - Shape notes: Statewide but site-specific distribution; income at 150% FPL (higher than federal max 130%); fixed monthly food package; funding caps create local waitlists; self-declared income with age/residency proof only.
- **Alzheimer’s Association Caregiver Resource Program** — service ([source](https://health.mo.gov/seniors/dementia-caregiving/))
  - Shape notes: Part of Missouri Caregiver Program with tracks by provider (Alzheimer’s Association handles Track Two relief/reimbursement); no income/asset tests; statewide but funding-limited; partners deliver services.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://health.mo.gov/seniors/senioremployment/[1]))
  - Shape notes: Grantee-administered with regional providers; income test at 125% FPL with specific exclusions; county-restricted availability; priority-based enrollment
- **Legal Services of Eastern Missouri (Advocates for Older Adults Program)** — advocacy ([source](https://lsem.org/advocates-for-older-adults/ and https://health.mo.gov/seniors/aaa/legal.php))
  - Shape notes: This program's eligibility and benefits structure is not publicly detailed with specific dollar amounts or service hour limits. The program is geographically restricted to 21 eastern Missouri counties and operates through a single organization (Legal Services of Eastern Missouri) rather than multiple providers. Income eligibility is required but thresholds are not published; families must apply directly. The program provides comprehensive civil legal advocacy rather than financial assistance or time-limited services. Phone intake is limited to three days per week.
- **Missouri Rx Program (MoRx)** — financial ([source](https://mydss.mo.gov/mhd/morx-general-faqs))
  - Shape notes: Post-2017 eligibility fully tied to MO HealthNet categories (full, spenddown, QMB); no standalone MoRx for pure Medicare seniors; income/assets historical and now MO HealthNet-dependent; dual eligibles get integrated Part D + MoRx layering
- **Senior Independent Living Program (SILP)** — service ([source](https://health.mo.gov/seniors/pdf/program-info.pdf[4]; https://oa.mo.gov/sites/default/files/dhss_senior_independent_living_program.pdf[5]))
  - Shape notes: Limited to 4 specific providers in urban areas; services customized per client and region, no standardized income/asset tests or fixed benefits; data sparse on application details and processing

## Program Details

### MO HealthNet (Medicaid)


**Eligibility:**
- Age: 65+
- Income: For elderly/disabled (MHABD Non-Spend down): Single - $860/month (elderly/disabled) or $1,012/month (blind); Couple - $1,166/month (elderly/disabled) or $1,372/month (blind). Spend-down option available where medical expenses reduce income to these limits. Limits based on 2026 figures; general adult expansion up to 138% FPL, but seniors use categorical programs with asset tests.[4][5]
- Assets: Single: $3,000 (elderly/disabled or blind); Couple: $6,000 (elderly/disabled or blind). Countable assets include savings and other resources; exemptions apply (e.g., primary home often exempt up to certain equity limits, one vehicle, personal belongings). Resource criteria apply primarily to aged, blind, disabled.[2][4][5]
- Missouri resident
- U.S. citizen or qualified non-citizen
- Meet level of care for long-term care if applicable (e.g., nursing facility level)
- Not eligible for Medicare in some categories, or qualify for Medicare Savings Programs
- For long-term care: may need to spend down assets/income

**Benefits:** Doctor visits including yearly check-ups, hospital stays, prescription medicines, mental health services, long-term care (nursing home, home and community-based services via waivers), dental/vision in some cases. Specific programs like MHABD cover aged/blind/disabled needs; Medicare Savings Programs (QMB, SLMB, QI) pay Medicare premiums/cost-sharing up to specified limits.[5][7]
- Varies by: priority_tier

**How to apply:**
- Online: https://mydss.mo.gov/healthcare/apply or HealthCare.gov
- Phone: 855-373-9994 or 800-318-2596
- Mail: Download form from myDSS and send to local Family Support Division (FSD) Resource Center
- In-person: 144 FSD Resource Centers throughout Missouri

**Timeline:** Typically 45 days for aged/blind/disabled; 90 days if disability determination needed; varies by complexity.[2]
**Waitlist:** Possible for Home and Community Based Waivers due to limited slots; no general waitlist for basic MO HealthNet.[4]

**Watch out for:**
- Asset limits apply strictly to seniors/aged/blind/disabled (not families/children); many miss exemptions like home equity limits.
- Spend-down required if over income limits; medical bills count toward it.
- Different programs (e.g., MHABD vs. expansion); seniors often need categorical eligibility, not just 138% FPL.
- Waivers for home care have waitlists; nursing home care may require level-of-care determination.
- Medicare Savings Programs have higher asset limits ($7,560 single) but separate apps.
- 5% income disregard built into some limits.[1][2][4][5]

**Data shape:** Elderly use categorical ABD programs with fixed low income/asset caps ($860-$1,372 income, $3k/$6k assets) and spend-down; varies by blind vs non-blind and marital status; waivers have separate higher income ($1,311) but asset tests; 144 local offices handle apps; waitlists on HCBS.

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
- Income: Up to approximately $1,109 per month for a single applicant (2025 figures); standard Medicaid income limits apply via MO HealthNet enrollment. No full household size table specified in sources, but follows MO HealthNet rules which may adjust for household composition. Participants receiving Medicaid via Blind Pension (BP) are ineligible.[1][3]
- Assets: Up to $6,068.80 for a single applicant (2025 figures). For seniors 65+, additional Medicaid asset rules: home equity interest no greater than $730,000 (2025) if living in the home or intending to return; exempt if spouse, minor child under 21, or blind/permanently disabled adult child (21+) lives in the home.[1][2]
- Diagnosed with Alzheimer's disease or related dementia disorder as defined by state statute 172.800 RSMo by a licensed healthcare professional.[3][4]
- Reside full-time in the same household as the primary caregiver (can be family, spouse, legal guardian, or non-family).[1][3][4]
- Meet Nursing Facility Level of Care (NFLOC), assessed via InterRAI HC tool covering ADLs, cognition, etc.[1][2][3]
- Enrolled in Missouri Medicaid (MO HealthNet) with appropriate eligibility code and active status.[1][3]
- Have an established backup plan with a qualified substitute caregiver (chosen by participant/guardian, employed by provider) available when primary is unavailable.[3]
- Not reside in any facility, group home, boarding home, hospital, nursing facility, or ICF/MR.[2][3]
- Not enrolled in any other Missouri HCBS state plan or waiver services.[1][3]

**Benefits:** Homemaker and attendant care services per approved plan of care, including ADLs (e.g., mobility, eating, toileting, bathing, dressing/grooming), medication oversight, escorting to therapeutic doctor/community appointments, supportive health-related services substituting for physical/cognitive impairments. Includes qualified substitute caregiver for primary caregiver absences. No fixed dollar amount or hours specified; tailored to plan of care (e.g., need 5+ hours of care noted in some descriptions).[3][4][6]
- Varies by: plan_of_care

**How to apply:**
- Contact Missouri Department of Health and Senior Services (DHSS), Division of Senior and Disability Services for assessment (administers program).[8]
- Reach out to local providers like UCP Heartland, Emerest, Circle of Care St. Louis, or others for services post-eligibility.[1][4][6]
- Online: mydss.mo.gov/mhd/waiver/structured-family-caregiving (waiver info and public notices).[8]
- No specific phone, mail, or in-person details listed; start with Medicaid eligibility screening via MO HealthNet, then DHSS/provider assessment.

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; potential due to waiver caps, but no details.

**Watch out for:**
- Must already live with primary caregiver full-time; program pays existing live-in caregiver via provider, doesn't create new arrangements.[1][2][4]
- Cannot use with any other HCBS waiver or state plan services.[1][3]
- Dementia diagnosis alone doesn't qualify; must pass NFLOC assessment (e.g., via InterRAI HC scoring ADLs/cognition).[2]
- Blind Pension Medicaid recipients ineligible.[3]
- Requires provider-employed substitute caregiver backup plan.[3]
- Services only via approved structured family caregiving agency/provider.[4][7]

**Data shape:** Strictly limited to Alzheimer's/related dementias age 21+; requires live-in primary caregiver (paid via provider) with mandatory substitute; no fixed service hours/dollars—instead plan-of-care based; statewide but provider-dependent; excludes other waivers/facility residents.

**Source:** https://mydss.mo.gov/mhd/waiver/structured-family-caregiving

---

### Missouri PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; however, for full Medicaid coverage (no private pay required), Missouri long-term care Medicaid typically requires income under $2,901/month (300% of Federal Benefit Rate for 2025) and assets $2,000 or less (excluding primary home) for a single person. Dual Medicare/Medicaid eligibility covers ~90-99% of participants, but private pay is an option if over limits[1][2][3][6]. Limits may vary by household size per state Medicaid rules; consult MO HealthNet for table.
- Assets: No asset limits for PACE enrollment; for Medicaid eligibility, assets $2,000 or less excluding primary home and one vehicle. Medicaid planning can help qualify[1].
- Live in the service area of a Missouri PACE organization
- Certified by Missouri (MO HealthNet/Medicaid) as needing nursing home level of care
- Able to live safely in the community with PACE support
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare Rx plan, or hospice

**Benefits:** Comprehensive health care, social, recreational, and wellness services including primary care, hospital/institutional care when needed, prescription drugs, medical equipment, therapies, personal care, adult day health care, home care, respite care—all to enable living at home instead of nursing facilities. No specific dollar amounts or hours stated; individualized based on needs[2][3][8].
- Varies by: region

**How to apply:**
- Contact specific PACE organization: PACE KC (Jackson County/Kansas City) via enrollment specialist[3]
- Jordan Valley Senior Care (Southwest Missouri)[8]
- EverTrue PACE (St. Louis)[8]
- Email MO HealthNet for questions: MHD.PACE@dss.mo.gov[8]
- Phone/website not listed in results; contact local PACE provider directly

**Timeline:** Not specified in available data
**Waitlist:** Not specified; may vary by provider/region

**Watch out for:**
- Not statewide—must live in one of 3 limited service areas; check specific provider
- No financial criteria for enrollment, but Medicaid needed for free services (private pay ~$7,000+/month otherwise)
- Cannot be in Medicare Advantage or hospice
- Note: Separate 'Missouri PACE' for property/energy financing exists but unrelated to elderly care[5][7]
- Functional assessment required; must be able to live safely at home with support

**Data shape:** Limited to 3 regional PACE centers; no income/asset test for enrollment but Medicaid determines cost share; nursing home level of care certification by MO HealthNet required

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mydss.mo.gov/mhd/pace

---

### Medicare Savings Program (MSP)


**Eligibility:**
- Income: Missouri MSP has three tiers with income limits based on Federal Poverty Level (FPL), announced annually in April[2][3]. As of 2026: QMB: $1,325/month single, $1,783/month married (100% FPL)[3]. SLMB1 (Group 1): $1,585/month single, $2,135/month married (100-120% FPL)[3]. SLMB2 (Group 2): up to 130% FPL[2]. QI (Qualifying Individual): $1,781/month single, $2,400/month married (120-135% FPL)[3]. Note: Income limits include a $20 general income disregard[7]. For applicants still working, less than half of employment income is counted, potentially allowing higher total income[3].
- Assets: Federal asset limits apply: $9,660 if single, $14,470 if married for QMB, SLMB, and QI[3][7]. Missouri may have more generous standards than federal minimums[8].
- Must be a Missouri resident and plan to stay[1]
- Must be enrolled in Medicare Part A (Hospital Insurance)[2]
- Must have healthcare coverage through Medicare or MO HealthNet (Missouri Medicaid)[1]

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums ($202.90/month in 2026[7]), and cost-sharing (deductibles, copayments, coinsurance) for Parts A and B[2][3]. SLMB1 and SLMB2: Pay Part B premiums only ($202.90/month in 2026[7]). QI: Pays Part B premiums only ($202.90/month in 2026[7]). Potential monthly savings: $202.90 or more depending on tier[6].
- Varies by: priority_tier

**How to apply:**
- Online: Apply at myDSS.mo.gov or download PDF application at tinyurl.com/MSP-apply[1]
- Phone: Call FSD Information Center at 1-855-373-4636 to request application by mail[5]
- In-person: Visit local Family Support Division (FSD) Resource Center[1]
- Mail: Request application by phone and return by mail

**Timeline:** Not specified in available sources
**Waitlist:** QI program is limited and available on first-come, first-served basis[7]; other tiers have no waitlist mentioned

**Watch out for:**
- SLMB2 (Group 2) cannot be active at the same time as MO HealthNet insurance, unlike QMB and SLMB1[2]
- QI program is first-come, first-served with limited funding[7]
- Income limits change annually each April when federal poverty level is announced[4]
- You must be eligible for Medicare Part A to qualify, but do not need to be currently enrolled[4]
- Some states have more generous income/asset disregards than federal standards; verify Missouri's specific disregards[8][9]
- If approved, you must verify that your chosen healthcare provider accepts your MSP coverage and offers Medicare services[1]
- Employment income is treated more favorably (less than half counted), which may allow working individuals with disabilities to qualify despite higher total income[3]

**Data shape:** MSP is structured as three distinct tiers (QMB, SLMB1/2, QI) with progressively higher income limits but decreasing benefit scope. Income limits are pegged to annual Federal Poverty Level announcements, making them variable year-to-year. QI differs from other tiers by being first-come, first-served. SLMB2 has a unique restriction preventing simultaneous MO HealthNet enrollment. Application can be combined with MO HealthNet or standalone. Processing timeline and regional office locations are not publicly detailed in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mydss.mo.gov/medicare-cost-savings-programs

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: No minimum age requirement for the household, but special rules apply if any household member is 60 or older+
- Income: {"general_households":"Maximum gross income of 130% of Federal Poverty Level (FPL); must also meet net income test[6]","households_with_elderly_or_disabled":"No gross income limit; must meet net income limit of 100% FPL only[6]. For 2025-2026, net income limits are: 1 person: $1,415/month, 2 people: $1,903/month, 3 people: $2,391/month, 4 people: $2,879/month, with $488 added per additional member[5]","note":"Net income is calculated by subtracting allowable deductions from gross income[1]"}
- Assets: {"households_with_member_60_or_older_or_disabled":"$4,500[4]","all_other_households":"$3,000[4]","what_counts":"Money in bank accounts and liquid resources[3]","what_is_exempt":"Home, vehicle(s), life insurance, burial plots, prepaid burials, personal property that does not generate income, savings and pension plans, Indian and Alaskan Native payments, and resources you do not have access to[4]"}
- Must live in Missouri[4]
- All household members must have (or agree to apply for) a Social Security Number[4]
- Household must include everyone who lives with you and buys and prepares food with you[2]
- Adults age 55–64 without dependents may need to work or join a SNAP job program under new rules[6]

**Benefits:** Monthly food assistance benefits; amount varies by household income and size. Example: 2-person elderly/disabled household with $1,200 gross income receives $415/month[5]
- Varies by: household_size and income

**How to apply:**
- Online: mydss.mo.gov (Missouri Department of Social Services)[4]
- In-person: Local Missouri Department of Social Services office
- Phone: Contact your local DSS office (specific phone numbers not provided in search results)
- Mail: Contact local DSS office for mailing address

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Only about half of eligible seniors apply for SNAP despite being eligible; many don't realize they qualify[2]
- Households with elderly or disabled members do NOT need to meet a gross income test—only net income—making qualification easier[1][6]
- Social Security, veterans' benefits, and disability payments all count toward income limits[2]
- Retirement savings generally do NOT count as assets, but liquid savings in bank accounts do[3]
- Elderly households (60+) have a higher asset limit ($4,500 vs. $3,000) and may not need to recertify as often; some states offer 24-month certification periods[3]
- Households with elderly or disabled members can claim an excess medical deduction to reduce countable income[3]
- You may qualify for SNAP even if you own your home, have retirement savings, or receive Social Security[2]
- The One Big Beautiful Bill Act of 2025 changed certain SNAP eligibility factors including work requirements and non-citizen eligibility; verify current rules[5]
- Net income calculation is complex and involves multiple deductions; using an online SNAP calculator is recommended[1]

**Data shape:** SNAP in Missouri has fundamentally different eligibility rules for households with members 60+ or disabled: they bypass the gross income test entirely and only need to meet a net income limit (100% FPL), have higher asset limits ($4,500 vs. $3,000), and may qualify for longer certification periods (up to 24 months). Benefits are calculated individually based on household size and net income, not fixed tiers. The program is statewide with no regional variations in eligibility or benefits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** mydss.mo.gov/food-assistance/apply-for-snap and fns.usda.gov/snap/eligibility/elderly-disabled-special-rules

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly income limits (2025): 1 person $2,839; 2 people $3,713; 3 people $4,587; 4 people $5,461; 5 people $6,335; 6 people $7,209. Limits vary by household size and are at or below 60% of state median income. Income based on month prior to application (e.g., September for elderly/disabled applying in October).[2][4]
- Assets: Households must have $3,000 or less in bank accounts, investments, or retirement accounts. Specific exemptions not detailed in sources.[1][5]
- Missouri resident
- U.S. citizen or legally admitted for permanent residence
- Live in the household and be responsible for paying the utility bill (must be over 18 and included on application)
- Provide Social Security numbers for all household members

**Benefits:** Heating assistance: $153 minimum to $495 maximum. Winter Crisis: up to $800. Summer Crisis: up to $300. Payments made directly to energy suppliers. Varies by income, household size, fuel type, and crisis status. No routine cooling assistance.[2]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact local contracted agency (use agency finder tools from providers like Ameren or CMCA)
- Phone: Energy Assistance Line (573) 200-6655 option 1 for status, option 2 for crisis[5]
- In-person or mail via local agencies (e.g., CMCA or Ameren participating agencies)
- No statewide online application specified; agency-specific processes

**Timeline:** Eligibility notifications and payments after program start dates (e.g., post-October 1 for elderly/disabled). Exact processing varies by agency and intake month[4][5]
**Waitlist:** Funds limited; priority for elderly (60+), disabled, families with children, multi-person households. Applications processed first-come basis within priority periods; may exhaust funding[3][4]

**Watch out for:**
- Priority application windows: Elderly/disabled from Oct 1/Nov 1, others Dec 1; funds may run out[2][4][5]
- Must reapply every year; changes require new application[5]
- Asset limit of $3,000 strictly applies to countable resources[1]
- Everyone on utility bill counts as household, unlike SNAP[2]
- No cooling assistance except summer crisis[2]

**Data shape:** Priority tiers for elderly (60+) and disabled with earlier access; two components (regular Energy Assistance + Crisis); local agency administration leads to regional processing variations; annual reapplication required

**Source:** https://dss.mo.gov/fsd/energy-assistance (inferred from policy manual); agency-specific sites like https://www.ameren.com/bill/assistance/liheap

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level (FPL). Exact table not in sources; for households over 8 members, add $10,760 per additional member. Automatic eligibility if receiving SSI or TANF. Priority for elderly (over 60), families with children, or disabilities.[1][2][3][4]
- Assets: No asset limits mentioned in sources.
- Missouri resident.
- Homeowners or renters (renters need written landlord permission).
- Single-family homes, multi-family up to 4 units, or mobile homes.
- Home not previously weatherized.

**Benefits:** Free energy-efficient home improvements including: reducing air infiltration (weather-stripping, caulking), increasing insulation (attics, walls, floors, foundations, pipes, ducts), HVAC repair/replacement, water heater blankets, LED lighting installation. Focus on health/safety. Average savings $370/year per home.[2][3][4][6][7]
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization agency (18 statewide; find via dnr.mo.gov/energy/weatherization).[4]
- Phone varies by agency (e.g., check agency sites like cmca.us, jfcac.org).
- In-person or mail application to local agency.
- Forms include Missouri Low Income Weatherization Assistance Program Application and agency-specific instructions.[5]

**Timeline:** Not specified; involves eligibility check, waitlist, energy audit, contractor work, final inspection.[2][4]
**Waitlist:** Eligible applicants placed on waiting list.[2]

**Watch out for:**
- Renters need landlord permission; multi-unit owners may share costs.[6]
- Home cannot be weatherized more than once.[6]
- Priority groups (elderly, disabled, children) get preference, but all eligible apply.[1][3]
- Must submit application even if auto-eligible via SSI/TANF.[3]
- Provide 3 months income proof for all household members; zero-income forms required and notarized.[2][5]

**Data shape:** Administered statewide by 18 local agencies with priority tiers; income at 200% FPL; services determined by energy audit per home.

**Source:** https://dnr.mo.gov/energy/weatherization[4][7]

---

### Missouri State Health Insurance Assistance Program (Missouri SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available sources. SHIP serves 'people with limited incomes' but no dollar thresholds are provided.
- Must be eligible for Medicare (age 65+, OR under 65 with disability or end-stage renal disease)
- U.S. citizen or legal resident who has lived in the U.S. for at least 5 years
- Service also available to Medicare beneficiaries' families and caregivers

**Benefits:** Free, one-on-one counseling and education. Specific services include: answering questions about Medicare eligibility and benefits; helping compare Medicare plans for prescription drug coverage (Part D); assisting with Medicare enrollment; checking for savings programs; answering questions about Medicare and Medicaid eligibility, benefits, and claims; helping apply for Medicaid, Medicare Savings Program, and Extra Help/Low Income Subsidy programs.
- Varies by: not_applicable — services are standardized, though delivery is localized

**How to apply:**
- Phone: 1-800-390-3330
- Website: missouriship.org (specific online application method not detailed in sources)
- In-person: Through local community partners and Area Agencies on Aging throughout Missouri (specific office locations not provided in sources)

**Timeline:** Not specified in available sources

**Watch out for:**
- SHIP is NOT an insurance company and does NOT sell insurance — it provides free counseling only.
- SHIP is a Medicare-focused program, not a general health insurance program. It helps people understand and enroll in Medicare, not obtain Medicare itself.
- In 2023, Missouri CLAIM changed its name to Missouri SHIP — older resources may reference the former name.
- SHIP is distinct from Medicaid (MO HealthNet) — it counsels about both programs but is not a Medicaid application service.
- Services are provided by trained, certified volunteers and staff — availability may depend on local volunteer capacity.

**Data shape:** Missouri SHIP is a counseling and education service, not a financial assistance or insurance program. It has no income limits, asset limits, or application process in the traditional sense — it's a free resource anyone Medicare-eligible can access by calling or visiting a local partner. The program's 'benefit' is information and guidance, not direct financial aid or coverage. This is fundamentally different from needs-based programs like Medicaid.

**Source:** missouriship.org

---

### Commodity Supplemental Food Program (CSFP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income at or below 150% of Federal Poverty Guidelines (effective March 7, 2025): Family Size 1: Annual $23,475 / Monthly $1,957 / Weekly $452; 2: $31,725 / $2,644 / $611; 3: $39,975 / $3,332 / $769; 4: $48,225 / $4,019 / $928; 5: $56,475 / $4,707 / $1,087; 6: $64,725 / $5,394 / $1,245; 7: $72,975 / $6,082 / $1,404; 8: $81,225 / $6,769 / $1,563; each additional: +$8,250 annual / +$688 monthly / +$159 weekly. Note: Some sources cite 130%, but Missouri official site specifies 150%.[1][2][4]
- Assets: No asset limits mentioned in Missouri-specific sources.[1][2]
- Missouri resident.
- Verification: Age (e.g., birth certificate, driver's license, ID); Income (self-declaration); Residency (e.g., utility bill, driver's license, SSA document).[1][2]

**Benefits:** Monthly food package of nutritious USDA commodity foods (canned fruits/vegetables/meat, cheese, cereal/grain products, milk products), worth approximately $50.[2][4]
- Varies by: fixed

**How to apply:**
- Phone: 800-733-6251 (statewide locator for local sites).
- Website: https://health.mo.gov/living/wellness/nutrition/foodprograms/csfp/ (find site near you).
- In-person: Local distribution sites (contact via phone/website for locations, e.g., Platte County: 816-270-4100).[1][4][6]

**Timeline:** Not specified in sources.
**Waitlist:** Program limited by funding; may have waitlists at local sites as it serves only as many as funding allows.[7]

**Watch out for:**
- Cannot participate in both CSFP and WIC simultaneously.[2][5]
- Limited by funding, so not all eligible seniors can be served; check local availability/waitlist.[7]
- Only for those 60+; women/infants/children grandfathered pre-2014, no new certifications.[2][5]
- Income is 150% FPL per MO DHSS (conflicts with some generic 130% sources).[1][4]
- Must pick up monthly or arrange local home delivery; mobility-limited should confirm with site.[7]

**Data shape:** Statewide but site-specific distribution; income at 150% FPL (higher than federal max 130%); fixed monthly food package; funding caps create local waitlists; self-declared income with age/residency proof only.

**Source:** https://health.mo.gov/living/wellness/nutrition/foodprograms/csfp/[2]

---

### Alzheimer’s Association Caregiver Resource Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; program is free of charge to all eligible caregivers[2][4].
- Assets: No asset limits mentioned[2][4].
- Care recipient must reside in Missouri and live at home (not in long-term care facilities)[1][2][4].
- Caregiver must live in the same home as the care recipient[1][2][4].
- Care recipient must have a probable diagnosis of Alzheimer's disease or related dementia[2][4].
- Enrollment contingent on funding availability, first-come first-served[2].

**Benefits:** Track Two (Caregiver Relief via Alzheimer’s Association): Reimbursement up to $700 for respite services including assessment/care coordination, adult day care, in-home care, nutritional supplements, safety/supportive programs, education/counseling[1][2]. Other tracks (via partners): Track One - in-home assessment, customized caregiver training/education[1][4]; Track Three - assistive technology[4]. Also includes home safety improvements, respite, training[5].
- Varies by: fixed

**How to apply:**
- Phone: Call Alzheimer’s Association 24/7 Helpline at 800.272.3900 to set up free care consultation and enroll[7].
- Website: https://health.mo.gov/seniors/dementia-caregiving/ for Missouri Caregiver Program information[2].

**Timeline:** Funds must be used within 45 days of enrollment (noted in prior year; current timelines not specified)[1].
**Waitlist:** First-come, first-served based on funding availability; no formal waitlist details[2].

**Watch out for:**
- Limited to those living at home; ineligible if in long-term care[1][2].
- Funding capped and first-come first-served; may run out[2].
- Must use funds quickly (e.g., within 45 days in past cycles)[1].
- Specific to Alzheimer's/related dementias; not general caregiving[2].
- Reimbursement-based for qualified expenses, not direct payment[1][2].

**Data shape:** Part of Missouri Caregiver Program with tracks by provider (Alzheimer’s Association handles Track Two relief/reimbursement); no income/asset tests; statewide but funding-limited; partners deliver services.

**Source:** https://health.mo.gov/seniors/dementia-caregiving/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income must not exceed 125% of the federal poverty level. Specific dollar amounts vary annually and by household size; families must check current federal poverty guidelines (e.g., via HHS.gov) as exact 2026 figures not in sources. Excluded income includes: Social Security Disability Income, 25% of Social Security Income, unemployment benefits, SNAP benefits, housing benefits, and certain veterans' payments[1].
- Assets: No asset limits mentioned in sources[1][2].
- Unemployed at time of application[1][2]
- U.S. citizen or eligible non-citizen (inferred from federal program standards)
- Priority for veterans/qualified spouses, individuals over 65, those with disabilities, low literacy/limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users[2]

**Benefits:** Part-time community service work-based job training (average 20 hours/week) at nonprofits/public agencies (e.g., schools, hospitals, senior centers); paid at highest of federal/state/local minimum wage; Individual Employment Plan (IEP) with skills training, job search assistance (resumes, interviews), annual health screening, supportive services (benefit applications, local resources); goal of transition to unsubsidized employment[1][2][3].
- Varies by: priority_tier

**How to apply:**
- Phone: 573-526-4542 (Missouri Department of Health & Senior Services)[1]
- Contact MERS Goodwill for eastern/central/southeast Missouri (application request link noted, specific URL not provided)[4]
- Through local grantees like state agencies or nonprofits (national info via DOL or AARP Foundation, but MO-specific via state)[1][2][5]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; availability varies by county[1]

**Watch out for:**
- Income exclusions are specific (e.g., only 25% of SS income excluded)—calculate carefully using current 125% FPL[1]
- Must be unemployed at application; program is temporary training bridge to unsubsidized jobs, not permanent[1][2]
- Availability limited to certain counties; contact state for local provider[1]
- Priority tiers may delay non-priority applicants[2]
- Host agencies are nonprofits/government only—no private sector placements[1][2]

**Data shape:** Grantee-administered with regional providers; income test at 125% FPL with specific exclusions; county-restricted availability; priority-based enrollment

**Source:** https://health.mo.gov/seniors/senioremployment/[1]

---

### Legal Services of Eastern Missouri (Advocates for Older Adults Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Financial eligibility based on household income required; specific dollar amounts not provided in available sources[1][2]
- Assets: Not specified in available sources
- Must be low-income or meet other qualifications for consultation or representation[2]
- Civil cases only — cannot assist with criminal cases or traffic citations[3]

**Benefits:** Free civil legal assistance, advice, and representation. Specific service areas include: housing issues (eviction defense, lease terminations, bad housing conditions, disability accommodations), public benefits (SNAP, Medicaid, Social Security, Medicare, TANF), consumer law (creditor/debtor problems, predatory lending), domestic abuse, orders of protection, estate planning, immigration, and legal help for grandparents/relatives caring for minors[1][2][4]
- Varies by: not_applicable — services are comprehensive across all eligible clients, though some staff primarily serve specific regions (e.g., St. Louis City)[1]

**How to apply:**
- Phone: 800.444.0514 (toll-free) or 314.534.4200 (general line) — applications available 9:00 AM to 5:00 PM Monday, Wednesday, and Thursday only[6]
- Online: Apply anytime via the organization's website at lsem.org[1][6]
- In-person: Legal Services of Eastern Missouri offices (five regional offices available)[10]
- In-person clinic: Third Thursday of each month, 9:00 AM to noon at St. Louis Public Library Central Library[5]

**Timeline:** After phone application, someone will call back within 3-5 business days to conduct intake screening[6]
**Waitlist:** Not specified in available sources

**Watch out for:**
- Phone applications are only available Monday, Wednesday, and Thursday, 9:00 AM to 5:00 PM — not all weekdays[6]
- This program serves only 21 counties of eastern Missouri; seniors outside this region must contact their local Area Agency on Aging for legal assistance[3]
- Civil cases only — the program cannot help with criminal cases or traffic citations[3]
- Financial eligibility is required, but specific income thresholds are not publicly stated in available materials; families must apply to learn if they qualify[2]
- Community legal education is available for seniors and groups, but representation is the primary service[1]
- The Missouri Senior Resource Helpline (1-800-235-5503) can connect seniors to local legal assistance if they are outside the Legal Services of Eastern Missouri service area[3]

**Data shape:** This program's eligibility and benefits structure is not publicly detailed with specific dollar amounts or service hour limits. The program is geographically restricted to 21 eastern Missouri counties and operates through a single organization (Legal Services of Eastern Missouri) rather than multiple providers. Income eligibility is required but thresholds are not published; families must apply directly. The program provides comprehensive civil legal advocacy rather than financial assistance or time-limited services. Phone intake is limited to three days per week.

**Source:** https://lsem.org/advocates-for-older-adults/ and https://health.mo.gov/seniors/aaa/legal.php

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to any resident regardless of financial status
- Assets: No asset limits; no financial tests apply
- Must be a resident of a long-term care facility in Missouri, such as nursing homes, residential care facilities, assisted living, skilled care nursing homes, residential care homes, or veteran homes

**Benefits:** Advocacy services including identifying, investigating, and resolving complaints related to health, safety, welfare, and rights; providing information on long-term services and supports; representing residents before agencies; seeking remedies; regular facility visits by trained volunteer ombudsmen to promote dignity, respect, protect rights, and voice concerns to facility management; community education on resident rights and long-term care issues

**How to apply:**
- Phone: (800) 309-3282 or local (573) 526-0727
- Email: LTCOmbudsman@health.mo.gov
- Contact regional Area Agency on Aging (AAA) or local ombudsman program for in-person assistance
- Website: http://health.mo.gov/seniors/ombudsman/

**Timeline:** Immediate assistance upon contact; no formal application processing as it is a complaint-resolution and advocacy service

**Watch out for:**
- Not a financial aid or direct service program—provides advocacy only, not healthcare, housing, or payments; families may confuse it with entitlement programs; services are for residents already in facilities, not for admission or placement; relies on volunteers, so availability may depend on local coordinators; strict conflict-of-interest rules for ombudsmen ensure independence

**Data shape:** no income or asset test; advocacy-only for LTC facility residents; delivered via statewide network of regional AAAs with volunteer ombudsmen; immediate access without application

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** http://health.mo.gov/seniors/ombudsman/

---

### Missouri Rx Program (MoRx)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Historically (pre-2017): Single household annual gross income ≤ $20,800-$21,660; married couple ≤ $28,000-$29,140. Post-2017 changes: No longer eligible if only Medicare Part D (no Medicaid); now requires MO HealthNet (Medicaid) eligibility, including full benefits, spenddown (met at least once/year), or qualified Medicare beneficiary status. Suggested LIS income thresholds (may overlap): single ≤ $15,315, couple ≤ $20,535 (202? figures).[2][1]
- Assets: Historical (pre-2017): Single ≤ $11,990-$11,710; married couple ≤ $23,970-$23,410. What counts: total resources (not fully detailed in sources). Post-2017: Tied to MO HealthNet asset rules, which vary by category (e.g., not specified here but typically apply to countable assets like bank accounts; exemptions for home, car often apply—confirm via MO HealthNet rules).[2][3]
- Missouri resident
- Enrolled in Medicare Part D plan (required for all)
- Eligible for or enrolled in MO HealthNet (Medicaid), including spenddown met at least once per year, full MO HealthNet, Ticket to Work, Home and Community Based Services, or qualified Medicare Part B premium payment
- Not eligible if only Medicare Part D without MO HealthNet (ended June 30, 2017)
- HIV-specific programs mentioned separately but not core MoRx

**Benefits:** Pays 50% of Medicare Part D out-of-pocket costs (deductible, co-pays, coverage gap); covers Medicare-excluded drugs (e.g., specific OTC drugs, vitamins, minerals, limited cough/cold) if MO HealthNet eligible. For dual eligibles: 50% of co-pays/deductibles after Part D pays; MO HealthNet covers certain excluded drugs.

**How to apply:**
- Online via mydss.mo.gov (MO HealthNet application integrates with MoRx)
- Phone: Not specified in results; use MO HealthNet helpline (implied via DSS)
- Mail: MoRx Enrollment Form (historical, pre-2017; now via MO HealthNet app)
- In-person: Local Family Support Division (FSD) offices for MO HealthNet

**Timeline:** Not specified in sources

**Watch out for:**
- Major 2017 change: Ended for those with only Medicare Part D (no Medicaid/MO HealthNet)—last coverage June 30, 2017[2][7]
- Must enroll in Medicare Part D plan first; no MO HealthNet pharmacy coverage for Part D drugs without it[4][6]
- Spenddown participants: Must meet spenddown at least once/year for MoRx to activate 50% coverage[4]
- Automatic enrollment if receiving Medicare + MO HealthNet; otherwise apply via MO HealthNet[4]
- Does not cover drugs excluded by both Medicare Part D and not MO HealthNet approved[4]
- Outdated info common (e.g., pre-2017 income/assets still cited); always verify current MO HealthNet eligibility[1][3]

**Data shape:** Post-2017 eligibility fully tied to MO HealthNet categories (full, spenddown, QMB); no standalone MoRx for pure Medicare seniors; income/assets historical and now MO HealthNet-dependent; dual eligibles get integrated Part D + MoRx layering

**Source:** https://mydss.mo.gov/mhd/morx-general-faqs

---

### Missouri Property Tax Credit (Circuit Breaker)


**Eligibility:**
- Age: 65+
- Income: Homeowners (owned and occupied entire year): Single ≤ $30,000; Married filing combined ≤ $34,000. Renters or part-year owners: Single ≤ $27,200; Married filing combined ≤ $29,200. Income includes Social Security, pensions, wages, dividends, interest, rental income, public assistance, SSI, TANF, child support, non-business losses, and most veteran benefits (except 100% disability). Credits phase out incrementally above $14,300, with full maximum only at or below that threshold.[1][4][6]
- Assets: No asset limits or tests apply.[1][6]
- 65+ years old by December 31 of tax year, or 18-64 and 100% disabled (per Social Security or VA), or 60+ receiving surviving spouse Social Security benefits.
- Missouri resident entire year.
- Homeowners must have owned and occupied home (full-year) or part-year; renters must have paid rent to a property that pays real estate taxes (not eligible if renting from non-profit assisted living or similar tax-exempt facility).
- Must truthfully state no employment of illegal/unauthorized aliens (per qualification chart).[6]

**Benefits:** Tax credit up to $750 for renters/part-year owners; up to $1,100 for full-year homeowners. Exact amount based on real estate taxes or rent paid and total household income (phases down incrementally above $14,300 until full phase-out at income limits).[1][3][4][6][8]
- Varies by: homeowner_renter_status|income_level

**How to apply:**
- File with Missouri income tax return (attach Form MO-PTS to MO-1040).
- Standalone Form MO-PTC if not filing income tax return.
- Mail to: Missouri Department of Revenue, PO Box 3340, Jefferson City, MO 65105-3340 (implied from DOR process).
- Email questions: PropertyTaxCredit@dor.mo.gov.
- Local assistance: Contact Aging Ahead at 800-243-6060 or 636-207-0847; some cities like Eureka accept forms by April 15 for utility adjustments.[2][5]

**Timeline:** Not specified in sources; typically processed with tax returns (standard DOR timelines apply).

**Watch out for:**
- Renters ineligible if facility doesn't pay property taxes (e.g., non-profit assisted living).[1][8]
- Income includes nontaxable sources like Social Security/SSI—many miss this, causing overestimation of eligibility.[4]
- Full max credit ($750/$1,100) only for incomes ≤$14,300; phases down above that—middle-income qualify for less.[1][3]
- Cannot use MO-PTC if filing MO-1040 (must use MO-PTS instead).[6]
- Must be full-year resident; part-year owners use lower income limits.[4][6]
- Proposed expansions (e.g., higher limits) not yet law as of 2023 data.[3]

**Data shape:** Income limits differ by filer status (single/married) and tenure (full-year owner vs. renter/part-year); refundable credit scales by taxes/rent paid and phases by income brackets, not household size beyond couple filing.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/

---

### Aged and Disabled Waiver (ADW)


**Eligibility:**
- Age: 63+
- Income: As of 2023, single applicant: $903/month; married couple: $1,215/month. Must be within MO HealthNet limits; certain disregards may apply. Updated figures should be verified with current MO HealthNet guidelines as they adjust annually[2].
- Assets: Single: $5,000; married couple: $10,000. Exempt: primary home (if spouse/minor child/disabled adult child lives there), one vehicle, household furnishings, personal effects, appliances. 60-month look-back rule applies; transfers below fair market value result in penalty period[1][2].
- Missouri resident, U.S. citizen or qualified alien, valid SSN[2][9].
- Meet Nursing Facility Level of Care (NFLOC) via InterRAI HC assessment (typically ≥21 points on 0-60 scale, based on ADLs like mobility, eating, bathing, cognition)[1][2].
- At risk of institutionalization; live in home/community setting (not assisted living or foster care)[2].
- Enrolled in MO HealthNet (Missouri Medicaid)[2].
- For ages 63-64: must be physically disabled; services continue after 65[1].

**Benefits:** Home and community-based services (HCBS): adult day care, homemaker services, chore services, basic respite, advanced respite, home-delivered meals. Specific hours/dollars not fixed; based on assessed needs to avoid nursing home placement[1][4][5][6][7].
- Varies by: priority_tier

**How to apply:**
- Contact Missouri Department of Social Services (DSS) or local case management agencies[4].
- Department of Health and Senior Services, Division of Senior and Disability Services (administers program)[6][7].
- Area Agencies on Aging (for older adults)[4].
- Phone/website not specified in sources; start via mydss.mo.gov or dss.mo.gov/mhd/waivers[6][7].

**Timeline:** Not specified in sources.
**Waitlist:** Yes; not an entitlement program with limited enrollment slots[8].

**Watch out for:**
- Not entitlement: limited slots mean waitlist even if eligible[8].
- 60-month look-back on asset transfers triggers penalties[1].
- Home exempt only under specific conditions (e.g., spouse/child living there); subject to estate recovery[1].
- Dementia diagnosis alone insufficient; must meet NFLOC score[1].
- Must live in community setting, not assisted living[2].
- Income/asset limits from 2023; verify current as they change yearly[2].

**Data shape:** Limited enrollment slots create waitlists; NFLOC determined by scored InterRAI HC assessment; services needs-based without fixed hours/dollars; income/assets tied to MO HealthNet with annual adjustments.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm

---

### Senior Independent Living Program (SILP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits stated; program targets seniors with insufficient resources to age independently in their own homes[4][5].
- Assets: No asset limits mentioned in available sources[4][5].
- Missouri resident[4]
- Seniors who have insufficient resources to age independently in their own homes[4][5]

**Benefits:** Wrap-around services tailored to individual needs to help seniors age 60+ remain in their homes; specific services vary by SILP and client needs (most utilized services listed by category per provider in FY2021, but exact lists not detailed); focuses on health and safety improvements[4][5].
- Varies by: region

**How to apply:**
- Contact specific SILP providers: Jewish Federation of St. Louis (Creve Coeur), A Caring Plus Foundation (Jennings), Palestine Senior Center (Kansas City), Aging Best Senior Independent Living (location unspecified)[5]

**Timeline:** Not specified

**Watch out for:**
- Not statewide—only available through 4 specific providers in select urban areas; families must contact the relevant SILP directly[4][5]
- Not a Medicaid waiver program; state-funded and distinct from Independent Living Waiver (which is for younger adults 18+ with disabilities)[1][8]
- Services are needs-based and vary by provider—no fixed dollar amounts or hours specified[4][5]
- Limited to age 60+; excludes general independent living communities for 55+[6]

**Data shape:** Limited to 4 specific providers in urban areas; services customized per client and region, no standardized income/asset tests or fixed benefits; data sparse on application details and processing

**Source:** https://health.mo.gov/seniors/pdf/program-info.pdf[4]; https://oa.mo.gov/sites/default/files/dhss_senior_independent_living_program.pdf[5]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MO HealthNet (Medicaid) | benefit | state | deep |
| Structured Family Caregiving Waiver | benefit | state | deep |
| Missouri PACE (Program of All-Inclusive  | benefit | local | deep |
| Medicare Savings Program (MSP) | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | medium |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Missouri State Health Insurance Assistan | resource | federal | simple |
| Commodity Supplemental Food Program (CSF | benefit | state | medium |
| Alzheimer’s Association Caregiver Resour | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services of Eastern Missouri (Advo | resource | local | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Missouri Rx Program (MoRx) | benefit | state | medium |
| Missouri Property Tax Credit (Circuit Br | benefit | state | medium |
| Aged and Disabled Waiver (ADW) | benefit | state | deep |
| Senior Independent Living Program (SILP) | benefit | local | medium |

**Types:** {"benefit":13,"resource":3,"employment":1}
**Scopes:** {"state":7,"local":3,"federal":7}
**Complexity:** {"deep":8,"medium":6,"simple":3}

## Content Drafts

Generated 17 page drafts. Review in admin dashboard or `data/pipeline/MO/drafts.json`.

- **MO HealthNet (Medicaid)** (benefit) — 5 content sections, 6 FAQs
- **Structured Family Caregiving Waiver** (benefit) — 5 content sections, 6 FAQs
- **Missouri PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 5 content sections, 6 FAQs
- **Medicare Savings Program (MSP)** (benefit) — 6 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 5 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 4 content sections, 6 FAQs
- **Missouri State Health Insurance Assistance Program (Missouri SHIP)** (resource) — 1 content sections, 6 FAQs
- **Commodity Supplemental Food Program (CSFP)** (benefit) — 3 content sections, 6 FAQs
- **Alzheimer's Association Caregiver Resource Program** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Legal Services of Eastern Missouri (Advocates for Older Adults Program)** (resource) — 3 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs
- **Missouri Rx Program (MoRx)** (benefit) — 3 content sections, 5 FAQs
- **Missouri Property Tax Credit (Circuit Breaker)** (benefit) — 2 content sections, 6 FAQs
- **Aged and Disabled Waiver (ADW)** (benefit) — 4 content sections, 6 FAQs
- **Senior Independent Living Program (SILP)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **plan_of_care**: 1 programs
- **region**: 2 programs
- **household_size and income**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable — services are standardized, though delivery is localized**: 1 programs
- **fixed**: 2 programs
- **not_applicable — services are comprehensive across all eligible clients, though some staff primarily serve specific regions (e.g., St. Louis City)[1]**: 1 programs
- **not_applicable**: 2 programs
- **homeowner_renter_status|income_level**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MO HealthNet (Medicaid)**: Elderly use categorical ABD programs with fixed low income/asset caps ($860-$1,372 income, $3k/$6k assets) and spend-down; varies by blind vs non-blind and marital status; waivers have separate higher income ($1,311) but asset tests; 144 local offices handle apps; waitlists on HCBS.
- **Structured Family Caregiving Waiver**: Strictly limited to Alzheimer's/related dementias age 21+; requires live-in primary caregiver (paid via provider) with mandatory substitute; no fixed service hours/dollars—instead plan-of-care based; statewide but provider-dependent; excludes other waivers/facility residents.
- **Missouri PACE (Program of All-Inclusive Care for the Elderly)**: Limited to 3 regional PACE centers; no income/asset test for enrollment but Medicaid determines cost share; nursing home level of care certification by MO HealthNet required
- **Medicare Savings Program (MSP)**: MSP is structured as three distinct tiers (QMB, SLMB1/2, QI) with progressively higher income limits but decreasing benefit scope. Income limits are pegged to annual Federal Poverty Level announcements, making them variable year-to-year. QI differs from other tiers by being first-come, first-served. SLMB2 has a unique restriction preventing simultaneous MO HealthNet enrollment. Application can be combined with MO HealthNet or standalone. Processing timeline and regional office locations are not publicly detailed in available sources.
- **Supplemental Nutrition Assistance Program (SNAP)**: SNAP in Missouri has fundamentally different eligibility rules for households with members 60+ or disabled: they bypass the gross income test entirely and only need to meet a net income limit (100% FPL), have higher asset limits ($4,500 vs. $3,000), and may qualify for longer certification periods (up to 24 months). Benefits are calculated individually based on household size and net income, not fixed tiers. The program is statewide with no regional variations in eligibility or benefits.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Priority tiers for elderly (60+) and disabled with earlier access; two components (regular Energy Assistance + Crisis); local agency administration leads to regional processing variations; annual reapplication required
- **Weatherization Assistance Program (WAP)**: Administered statewide by 18 local agencies with priority tiers; income at 200% FPL; services determined by energy audit per home.
- **Missouri State Health Insurance Assistance Program (Missouri SHIP)**: Missouri SHIP is a counseling and education service, not a financial assistance or insurance program. It has no income limits, asset limits, or application process in the traditional sense — it's a free resource anyone Medicare-eligible can access by calling or visiting a local partner. The program's 'benefit' is information and guidance, not direct financial aid or coverage. This is fundamentally different from needs-based programs like Medicaid.
- **Commodity Supplemental Food Program (CSFP)**: Statewide but site-specific distribution; income at 150% FPL (higher than federal max 130%); fixed monthly food package; funding caps create local waitlists; self-declared income with age/residency proof only.
- **Alzheimer’s Association Caregiver Resource Program**: Part of Missouri Caregiver Program with tracks by provider (Alzheimer’s Association handles Track Two relief/reimbursement); no income/asset tests; statewide but funding-limited; partners deliver services.
- **Senior Community Service Employment Program (SCSEP)**: Grantee-administered with regional providers; income test at 125% FPL with specific exclusions; county-restricted availability; priority-based enrollment
- **Legal Services of Eastern Missouri (Advocates for Older Adults Program)**: This program's eligibility and benefits structure is not publicly detailed with specific dollar amounts or service hour limits. The program is geographically restricted to 21 eastern Missouri counties and operates through a single organization (Legal Services of Eastern Missouri) rather than multiple providers. Income eligibility is required but thresholds are not published; families must apply directly. The program provides comprehensive civil legal advocacy rather than financial assistance or time-limited services. Phone intake is limited to three days per week.
- **Long-Term Care Ombudsman Program**: no income or asset test; advocacy-only for LTC facility residents; delivered via statewide network of regional AAAs with volunteer ombudsmen; immediate access without application
- **Missouri Rx Program (MoRx)**: Post-2017 eligibility fully tied to MO HealthNet categories (full, spenddown, QMB); no standalone MoRx for pure Medicare seniors; income/assets historical and now MO HealthNet-dependent; dual eligibles get integrated Part D + MoRx layering
- **Missouri Property Tax Credit (Circuit Breaker)**: Income limits differ by filer status (single/married) and tenure (full-year owner vs. renter/part-year); refundable credit scales by taxes/rent paid and phases by income brackets, not household size beyond couple filing.
- **Aged and Disabled Waiver (ADW)**: Limited enrollment slots create waitlists; NFLOC determined by scored InterRAI HC assessment; services needs-based without fixed hours/dollars; income/assets tied to MO HealthNet with annual adjustments.
- **Senior Independent Living Program (SILP)**: Limited to 4 specific providers in urban areas; services customized per client and region, no standardized income/asset tests or fixed benefits; data sparse on application details and processing

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Missouri?
