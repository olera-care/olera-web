# Tennessee Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.065 (13 calls, 1.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 11 |
| Programs deep-dived | 9 |
| New (not in our data) | 7 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |

## Program Types

- **financial**: 1 programs
- **service**: 6 programs
- **employment**: 1 programs
- **service|advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### TennCare Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1605` → Source says `$1,350` ([source](https://www.tn.gov/tenncare/members-applicants/eligibility-reference-guide.html))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB:[7] Pays for Part A premiums (if you don't have premium-free Part A), Part B premiums, deductibles, coinsurance, and copayments for services and items Medicare covers. Also provides Extra Help for prescription drugs (maximum $12.65 per drug in 2026).[7] SLMB:[7] Pays for Part B premiums only, plus Extra Help for prescription drugs (maximum $12.65 per drug in 2026).[7] QI:[7] Pays for Part B premiums only, plus Extra Help for prescription drugs (maximum $12.65 per drug in 2026).[7] QMB also covers cost sharing for Medicare Advantage and full extra help for Part D plans.[3]` ([source](https://www.tn.gov/tenncare/members-applicants/eligibility-reference-guide.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/tenncare/members-applicants/eligibility-reference-guide.html`

### Tennessee State Health Insurance Assistance Program (TN SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, one-on-one counseling and education; assistance with Medicare enrollment, plan comparisons, applications for low-income programs (Medicare Savings Plans, Extra Help), fraud investigation, and billing issue resolution. No direct financial payments to beneficiaries.` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html`

## New Programs (Not in Our Data)

- **Tennessee Weatherization Assistance Program** — service ([source](https://thda.org/help-for-homeowners/weatherization-assistance-program/))
  - Shape notes: Administered statewide via local subgrantees in 95 counties with funding-based availability; priority tiers for vulnerable households; income at 200% FPL with automatic qualifiers like SSI/TANF.
- **Tennessee SHIP** — service ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html[3]))
  - Shape notes: No income/asset/age tests; counseling-only service via regional network; open access for Medicare beneficiaries/families statewide
- **Tennessee Meals on Wheels** — service ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/aging-nutrition-program.html))
  - Shape notes: Decentralized by  local AAAD per county/region with no statewide income/asset test; homebound requirement strictly assessed; over 150 congregate sites but home delivery zone-restricted
- **Tennessee Caregiver Respite Support** — service ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/caregiving.html[3]))
  - Shape notes: Decentralized via 10+ AAADs with local variation; voucher-based self-direction; ties to federal OAA/NFCSP and state grants; priority tiers and funding caps limit access
- **Tennessee SCSEP** — employment ([source](https://www.tn.gov/content/dam/tn/workforce-services-tn/documents/SCSEP-Procedure-Manual.pdf))
  - Shape notes: Administered statewide via regional sub-grantees with county-specific providers and contacts; income test at 125% FPL by family size (annual HHS table); priority tiers for veterans/65+; temporary paid training slots limited by federal funding and local capacity
- **Tennessee Legal Aid for Seniors** — service ([source](https://www.tals.org/page/453/free-senior-legal-helpline (statewide helpline); https://www.ethra.org/programs/21/legal-assistance-for-the-elderly (East TN example)))
  - Shape notes: Regionally administered via multiple providers (not single statewide program); priority tiers by case type/emergency; some no income test but most Legal Aid have poverty guideline limits; varies heavily by East/Middle/West TN
- **OPTIONS for Community Living** — service ([source](https://www.ftaaad.org/options-subpage[2]))
  - Shape notes: State-funded via Tennessee Commission on Aging and Disability; no strict income/asset caps but cost share applies; regional delivery through Area Agencies with waitlists and prioritization; functional need (3+ ADLs) drives eligibility, not Medicaid linkage.

## Program Details

### TennCare Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Income limits are based on Federal Poverty Guidelines and vary by program and household size. For 2026:[7] QMB: Individual $1,350/month, Married couple $1,824/month. SLMB: Individual income at least 100% but less than 120% of poverty level. QI: Individual income at least 120% but less than 135% of poverty level. Note: Search results contain varying 2024 figures ($1,526 for SLMB individual, $1,715 for QI individual)[4], indicating annual adjustments. Applicants should verify current limits with TennCare, as these are updated yearly in January.[6]
- Assets: Resource limits for 2026:[7] QMB: Individual $9,950, Married couple $14,910. SLMB and QI: Same as QMB. Assets that COUNT include: money in bank accounts, stocks, and bonds.[3] Assets that DO NOT count include: the house you live in, one car, a burial plot, up to $1,500 in burial expenses, furniture, and household and personal items.[3]
- Must be eligible for or enrolled in Medicare Part A and Part B[6]
- Cannot be eligible for another category of Medicaid at the same time (applies to QI)[1]
- For QI specifically: Cannot be eligible for Medicaid[6]

**Benefits:** QMB:[7] Pays for Part A premiums (if you don't have premium-free Part A), Part B premiums, deductibles, coinsurance, and copayments for services and items Medicare covers. Also provides Extra Help for prescription drugs (maximum $12.65 per drug in 2026).[7] SLMB:[7] Pays for Part B premiums only, plus Extra Help for prescription drugs (maximum $12.65 per drug in 2026).[7] QI:[7] Pays for Part B premiums only, plus Extra Help for prescription drugs (maximum $12.65 per drug in 2026).[7] QMB also covers cost sharing for Medicare Advantage and full extra help for Part D plans.[3]
- Varies by: program_tier

**How to apply:**
- Phone: Call SHIP (State Health Insurance Assistance Program) for free assistance at 1-877-801-0044[4]
- Mail or in-person: Contact the Bureau of TennCare (specific address not provided in search results)
- Online: Visit TN.gov TennCare website (www.tn.gov/tenncare)[1]

**Timeline:** Not specified in search results
**Waitlist:** QI program operates on first-come, first-served basis until funds run out; priority given to those who received QI benefits in the previous year.[2][3][7]

**Watch out for:**
- QI program is NOT guaranteed funding — it operates on first-come, first-served basis until state funds run out.[2][3][7] Families should apply early in the year.
- QI requires annual reapplication; benefits are not continuous.[3][7]
- If someone qualifies for Medicaid, they cannot use QI — they must use QMB or SLMB instead.[6]
- QI does not affect Medicare Advantage (Part C) or Medigap plans, but only applies to original Medicare (Parts A and B).[6]
- Income and resource limits change every year (new limits released each January).[6] Families should not rely on prior-year figures.
- CHOICES recipients do not qualify for QI-1.[4]
- Medicare providers cannot bill for covered services under QMB, but small Medicaid copayments may still apply.[7]

**Data shape:** This program consists of three distinct tiers (QMB, SLMB, QI) with progressively higher income thresholds but decreasing benefits. Income and resource limits scale by household size (individual vs. married couple). QI has unique first-come, first-served funding constraints and annual reapplication requirements, making it less stable than QMB/SLMB. All three programs are administered by a single state entity (Bureau of TennCare) with no regional variation in eligibility or benefits. Income limits are tied to Federal Poverty Guidelines and adjust annually.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/tenncare/members-applicants/eligibility-reference-guide.html

---

### Tennessee Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Total countable household income must be at or below 200% of the federal poverty level for the household size, based on the 12 months preceding application. Example for single-person household: $25,550 upper limit; add $8,960 per additional person (figures from 2020, adjust for current year via FPL tables). SSI or TANF recipients automatically qualify. No specific elderly age requirement, but priority for households with individuals over 60, disabled persons, or young children.
- Assets: No asset limits mentioned in program guidelines.
- Applicant must be 18 or older.
- U.S. citizen or legal alien (proof required: driver's license, birth certificate, passport, naturalization certificate, etc.).
- Tennessee resident with proof of residence in the home to be weatherized.
- Own or rent the dwelling.
- Home must be single-family or eligible multifamily (for multifamily: subsidized properties or 66% of residents at/below 80% AMI or 200% FPL).

**Benefits:** Home energy efficiency improvements based on certified energy audit, including air sealing, duct sealing, insulation (attics, walls, floors), caulking, storm windows, window/door replacement. No fixed dollar amount; site-specific measures to reduce heating/cooling costs and improve health/safety.
- Varies by: priority_tier

**How to apply:**
- Contact local agency serving your county via THDA Weatherization Agency Locator (no direct URL in results; access through THDA site).
- Phone or in-person: Local community agencies/governments in all 95 counties.
- Submit WAP application through THDA-approved local providers (e.g., South Central Human Resource Agency or others).

**Timeline:** Not specified; involves energy assessment, scope of work approval, upgrades, and final inspections.
**Waitlist:** Availability based on federal funding; potential waitlists due to limited funds (varies by county).

**Watch out for:**
- Must contact specific local agency for your county, not apply directly to THDA.
- Priority for elderly/disabled/child households, but no automatic elderly-only qualification.
- Income calculated over full 12 prior months; all countable income included.
- Funding-limited; not all eligible homes served immediately.
- Separate multifamily track with property-level eligibility.
- Citizenship verified per Tennessee law for all applicants.

**Data shape:** Administered statewide via local subgrantees in 95 counties with funding-based availability; priority tiers for vulnerable households; income at 200% FPL with automatic qualifiers like SSI/TANF.

**Source:** https://thda.org/help-for-homeowners/weatherization-assistance-program/

---

### Tennessee SHIP

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to anyone with Medicare questions, focused on Medicare-eligible individuals (typically 65+ or disabled) and their families/caregivers[1][3][8][9]
- Assets: No asset limits or tests apply[9]
- Must be Medicare-eligible or have Medicare-related questions; no other restrictions[3][8]

**Benefits:** Free, unbiased one-on-one counseling on Medicare (Parts A/B, Advantage, Part D, Medigap), enrollment assistance, Medicare Savings Programs (QMB/SLMB/QI), Extra Help/LIS applications, plan comparisons, billing errors/fraud reporting, preventive services education, community outreach/presentations; no financial payments or fixed hours/dollars[1][2][3][6][7]

**How to apply:**
- Phone: 1-877-801-0044 (statewide toll-free), local examples 901-222-4111 (Shelby); Email: dda.ship@tn.gov; Online contact form at tn.gov/disability-and-aging; In-person at regional offices; Mail not specified[2][3][7]

**Timeline:** Immediate phone/email assistance; in-person appointments scheduled upon request, no fixed processing time[3]

**Watch out for:**
- Not a direct financial aid program—provides counseling only, not payments; does not sell/endorses insurance; must disenroll from ACA Marketplace upon Medicare eligibility to avoid penalties; focused on Medicare, not general healthcare[3][5]; regional offices handle local service but statewide consistency[2]

**Data shape:** No income/asset/age tests; counseling-only service via regional network; open access for Medicare beneficiaries/families statewide

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html[3]

---

### Tennessee Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits apply; income is not a factor in determining eligibility, though programs target low-income seniors and may suggest contributions on a sliding scale based on ability to pay[1][6][8]
- Assets: No asset limits; no information on what counts or exemptions as assets are not tested[1][6]
- Homebound due to illness, incapacitation, disability, or mobility challenges that make shopping, preparing meals, or socializing difficult[1][2][3][4][8]
- Reside in the service area or delivery zone of the local provider (varies by region)[1][2]
- Unable to obtain nutritious meals from family, friends, or other resources[2]
- For some programs, spouses or dependents of eligible 60+ individuals may qualify regardless of age; disabled under 60 in specific settings like senior high-rises[2][8]

**Benefits:** Home-delivered nutritionally balanced noontime meal providing one-third of daily RDA requirements (typically weekdays); includes friendly volunteer visit and safety check; congregate meals available at senior centers/community sites for socialization and nutrition education[1][2][4][7][8][9]
- Varies by: region

**How to apply:**
- Phone: Toll-free 1-866-836-6678 to contact local Area Agency on Aging and Disability (AAAD)[7][8][9]
- Online: Use screening tool at local AAAD sites (e.g., NWTDD) or find provider via Meals on Wheels America locator[3][9]
- In-person: At local AAAD offices, senior centers, or congregate meal sites[8]
- Referral: Doctor, social worker, or family can refer[3]

**Timeline:** Varies; some process within a week, others longer if waitlisted; intake assessment by case manager required[1]
**Waitlist:** Possible in some programs/regions due to high demand[1]

**Watch out for:**
- Not a single centralized program—must contact local AAAD for your county as rules/zones vary; car ownership or ability to leave home easily may disqualify; some programs funded via Title III (no cost, donations suggested) vs. Medicaid CHOICES (separate qualification); congregate vs. home-delivered have different criteria; outside service areas requires alternatives[1][2][5][8]

**Data shape:** Decentralized by  local AAAD per county/region with no statewide income/asset test; homebound requirement strictly assessed; over 150 congregate sites but home delivery zone-restricted

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/aging-nutrition-program.html

---

### Tennessee Caregiver Respite Support

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Contributions encouraged if income at or above 185% of Federal Poverty Guidelines; no strict cutoff, but preference to those with greatest economic need[2][3]
- Assets: No asset limits specified[2][3]
- Care receiver 60+ or with Alzheimer's/related dementia; unable to perform at least 2 ADLs without substantial assistance; cognitive impairment requiring supervision to prevent harm[2]
- Caregiver is unpaid family member; caregiver 55+ if caring for minor child[2][3]
- For Lifespan Respite Voucher: family caregiver living in same home as care recipient with disability/chronic illness[7]
- Not eligible if receiving certain Medicaid HCBS waivers like ECF CHOICES[1][6]

**Benefits:** In-home respite up to 6 hours/week; vouchers for respite services (amounts not specified, low/no-cost via Lifespan Respite Grant); may include counseling, training, personal care, homemaker, adult day care[2][3][7]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-866-836-6678 (NFCSP intake line, statewide AAADs)[2][3]
- Phone: 615-269-8687 (Emergency Respite Voucher, Annisha)[4]
- Email: respite@tnrespite.org (Tennessee Lifespan Respite Voucher, Jack Read)[5]
- Phone assessment followed by in-home visit[2]

**Timeline:** Funds within 1 week after approval and documents for Emergency Voucher[4]; varies for others
**Waitlist:** Slots availability-based; not all eligible enrolled due to funding/priorities (e.g., Family Support)[2][6]

**Watch out for:**
- Multiple programs (NFCSP, Lifespan Respite Voucher, Emergency Voucher, Medicaid waivers, Family Support) often lumped as 'respite'; check specific fit[1][3][5][6]
- Caregiver is the client; preference to greatest needs; slots limited, eligibility ≠ enrollment[2][6]
- Excludes those on certain Medicaid waivers; not substitute for comprehensive services[1][6]
- Varies by AAAD region; contributions if higher income[2][3]

**Data shape:** Decentralized via 10+ AAADs with local variation; voucher-based self-direction; ties to federal OAA/NFCSP and state grants; priority tiers and funding caps limit access

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/caregiving.html[3]

---

### Tennessee SCSEP

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level, as established by the U.S. Department of Health and Human Services, based on family size. Exact dollar amounts vary annually and by household size; families must contact a local provider or check current HHS poverty guidelines for the table (e.g., via ASPE.hhs.gov). No specific dollar figures or table provided in state manual[1][2][4].
- Assets: No asset limits mentioned; eligibility focuses on income, not assets[1][2].
- Current resident of Tennessee[1][5]
- Unemployed and actively seeking employment[2][3][4][5]
- U.S. citizen or legally able to work[6]

**Benefits:** Paid on-the-job training averaging 20 hours per week at the highest of federal ($7.25/hour), state, or local minimum wage. Training roles include child care provider, customer service representative, teachers’ aide, computer technician, building maintenance worker, health care worker, nurse’s aide, library clerk, adult/child day care assistance, maintenance workers. Typically lasts about 6 months, bridging to permanent unsubsidized employment. Includes skills training (e.g., computer use) and support services[1][2][3][4][5].
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP provider (e.g., East Tennessee: (865) 691-2551 ext 4347, rhawkins@ethra.org for specific counties[3]; First Tennessee Human Resource Agency for Carter, Greene, Hancock, Hawkins, Johnson, Sullivan, Unicoi, Washington counties[8]; Knox Seniors for Knox County[6]; find via CWI Works state selector for Tennessee[4])
- In-person or phone intake at local American Job Centers or sub-grantees (e.g., TN Virtual AJC[5])
- Complete application at local SCSEP office; no central online form specified, but SER National has a general SCSEP Application for Services[7]

**Timeline:** Not specified; enrollment if eligible and no waitlist[2].
**Waitlist:** Possible waitlist depending on local capacity; contact local office to check[2].

**Watch out for:**
- Must register at nearest TN American Job Center within 90 days of enrollment for dual WIOA eligibility[1]
- Enrollment priority: veterans/qualified spouses first, then over age 65[4]
- Unemployed status required; program is temporary training (avg. 6 months) to bridge to unsubsidized jobs, not permanent income support[2][4]
- Income calculated for family size at 125% FPL using HHS guidelines; verify current levels as they update annually[1][2]
- No health questions during intake; focus on skills, barriers, job interests[1]
- Local waitlists and slots vary; not guaranteed immediate entry[2]

**Data shape:** Administered statewide via regional sub-grantees with county-specific providers and contacts; income test at 125% FPL by family size (annual HHS table); priority tiers for veterans/65+; temporary paid training slots limited by federal funding and local capacity

**Source:** https://www.tn.gov/content/dam/tn/workforce-services-tn/documents/SCSEP-Procedure-Manual.pdf

---

### Tennessee Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by program; some like Legal Aid of East Tennessee require income under 125% of Federal Poverty Guidelines (exact dollar amounts not specified in sources and vary by household size/year); others like Free Senior Legal Helpline have no income limits[1][7][8].
- Assets: No asset limits mentioned for senior-specific programs; Free Senior Legal Helpline explicitly states no asset test[7].
- Must personally contact program office (waivable in emergencies)[1]
- Civil legal issues only (e.g., not criminal cases)[1][4]
- Priority for emergencies threatening harm or death[1]
- Specific case types set by state priority categories[1]

**Benefits:** Free confidential legal advice, representation, and referrals on civil matters including landlord/tenant, probate, healthcare access (TennCare/Medicare), domestic violence family issues, Medicaid eligibility, guardianship/conservatorship; no charge for attorney time (may have court costs); remote delivery available[1][4][7].
- Varies by: priority_tier

**How to apply:**
- Phone: Free Senior Legal Helpline 844-435-7486 (statewide)[7]
- Phone: ETHRA Legal Assistance for Elderly (865) 691-2551 ext 4212 or ext 4216 (East TN)[1]
- Website: https://www.ethra.org/programs/21/legal-assistance-for-the-elderly (East TN)[1]
- Website: https://www.tals.org/page/453/free-senior-legal-helpline[7]
- Website: https://www.laet.org (Legal Aid East TN)[10]
- In-person: ETHRA Knoxville office 1514 E. Fifth Avenue, Knoxville, TN 37917; Legal Aid offices vary by region[1]
- Online legal advice: https://tn.freelegalanswers.org/ (statewide for qualifying seniors)[5]

**Timeline:** Emergencies given priority; others first-come first-served as capacity allows; no specific timelines stated[1].
**Waitlist:** Yes, when caseload maxed; option for waiting list or referral to others[1].

**Watch out for:**
- Not all civil cases covered (e.g., no criminal, no fee-generating like car accidents)[1][4]
- May need to pay court costs despite free legal help[4]
- Personal contact required (waivable only in emergencies)[1]
- Limited capacity leads to waitlists/referrals[1]
- Income screening even if not always disqualifying[2][4][8]

**Data shape:** Regionally administered via multiple providers (not single statewide program); priority tiers by case type/emergency; some no income test but most Legal Aid have poverty guideline limits; varies heavily by East/Middle/West TN

**Source:** https://www.tals.org/page/453/free-senior-legal-helpline (statewide helpline); https://www.ethra.org/programs/21/legal-assistance-for-the-elderly (East TN example)

---

### OPTIONS for Community Living

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict upper income limit; if income exceeds Federal Poverty Guidelines, a cost share is required. Medicaid-related programs like CHOICES have separate limits (e.g., $2,982/month for 2026, or 3x SSI Federal Benefit Rate).[3][4]
- Assets: No asset limits mentioned for OPTIONS; Medicaid-linked programs like CHOICES limit countable assets to $2,000 (home exempt if equity ≤$730,000 in 2025, or if spouse/child lives there).[1][3]
- Tennessee resident.
- Require assistance with at least 3 Activities of Daily Living (ADLs) or Instrumental ADLs (IADLs), such as mobility, toileting, hygiene, dressing, housekeeping, cooking, shopping, bathing; certified by medical professional.
- For ages 18-60, must be disabled per Social Security determination.[2][4]

**Benefits:** Light housekeeping, assistance with bathing, home-delivered meals, case management.[4]
- Varies by: income (cost share if over FPL); physical need and availability (prioritization on waitlist); region (via local Area Agencies on Aging).[2][4]

**How to apply:**
- Phone: Call FTAAAD Information and Assistance line at 1-866-836-6678 for screening and application.[2][4]
- In-person or mail: Contact local Area Agency on Aging and Disability (e.g., ETHRA for specific counties); download intake form from agency website.[4]

**Timeline:** Intake screening by phone; if eligible and slot available, in-home assessment by case manager (timeline not specified).[4]
**Waitlist:** Waiting lists have existed in past years; prioritization based on income and physical need. Slots must be available.[2][4]

**Watch out for:**
- Waiting lists common; eligibility doesn't guarantee immediate services—prioritized by income/need.[2]
- Cost share if income over FPL—often missed.[4]
- Must have at least 3 ADL/IADL deficits; re-screen if previously denied due to health changes.[2][4]
- Separate from TennCare CHOICES (which requires NFLOC and has stricter financial rules)—don't confuse.[1][3]

**Data shape:** State-funded via Tennessee Commission on Aging and Disability; no strict income/asset caps but cost share applies; regional delivery through Area Agencies with waitlists and prioritization; functional need (3+ ADLs) drives eligibility, not Medicaid linkage.

**Source:** https://www.ftaaad.org/options-subpage[2]

---

### Tennessee State Health Insurance Assistance Program (TN SHIP)


**Eligibility:**
- Income: No income limits specified in available documentation. Program serves 'people with limited incomes' but does not enforce strict thresholds.
- Assets: Not specified in available documentation
- Must be Medicare-eligible or currently enrolled in Medicare
- No formal eligibility requirements stated — assistance provided to general public who calls

**Benefits:** Free, one-on-one counseling and education; assistance with Medicare enrollment, plan comparisons, applications for low-income programs (Medicare Savings Plans, Extra Help), fraud investigation, and billing issue resolution. No direct financial payments to beneficiaries.
- Varies by: not_applicable — counseling services are standardized; specific assistance depends on individual circumstances

**How to apply:**
- Phone: 1-877-801-0044 (statewide toll-free)
- Phone: 844-887-7447 (East Tennessee regional line)
- Phone: 901-222-4111 (local, Shelby County area)
- Email: dda.ship@tn.gov
- Online form: Available at tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html
- In-person: Contact local SHIP coordinator (varies by region)

**Timeline:** Not specified in available documentation
**Waitlist:** Not mentioned in available documentation

**Watch out for:**
- SHIP does NOT provide direct financial assistance or pay premiums — it provides counseling and helps beneficiaries apply for OTHER programs (Medicare Savings Plans, Extra Help) that may pay premiums or copays. Families expecting direct payment should understand this distinction.
- Medicare enrollment is mandatory once eligible; failure to enroll timely can result in penalties. SHIP can help navigate this transition, especially for those currently on ACA Marketplace plans.
- SHIP is free and unbiased — it does not sell insurance or endorse any company. This is a strength, but means it cannot provide personalized recommendations, only objective information.
- Program created in early 1990s but significantly expanded after Medicare Part D launched in 2006; families should not assume outdated information about program scope.
- Regional variation means wait times, counselor availability, and local outreach may differ significantly by county.
- No eligibility screening mentioned — anyone can call, but actual assistance depends on Medicare eligibility and specific needs.

**Data shape:** TN SHIP is a counseling and advocacy program, not a direct-benefit program. It has no income or asset limits, no formal application process, and no waiting period — beneficiaries simply call to access services. The program's value lies in helping beneficiaries navigate complex Medicare options and apply for OTHER assistance programs. Regional variation is significant: nine separate offices serve different areas with different phone numbers and coverage areas. The program is federally funded but state-administered, creating a hybrid governance structure. Unlike many assistance programs, there is no 'approval' or 'denial' — SHIP provides services to anyone who contacts them and is Medicare-eligible.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| TennCare Medicare Savings Programs (QMB, | benefit | federal | deep |
| Tennessee Weatherization Assistance Prog | benefit | federal | deep |
| Tennessee SHIP | resource | federal | simple |
| Tennessee Meals on Wheels | benefit | federal | medium |
| Tennessee Caregiver Respite Support | benefit | state | deep |
| Tennessee SCSEP | employment | federal | deep |
| Tennessee Legal Aid for Seniors | resource | local | simple |
| OPTIONS for Community Living | benefit | state | medium |
| Tennessee State Health Insurance Assista | resource | federal | simple |

**Types:** {"benefit":5,"resource":3,"employment":1}
**Scopes:** {"federal":6,"state":2,"local":1}
**Complexity:** {"deep":4,"simple":3,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/TN/drafts.json`.

- **TennCare Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Tennessee Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **Tennessee SHIP** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_tier**: 1 programs
- **priority_tier**: 4 programs
- **not_applicable**: 1 programs
- **region**: 1 programs
- **income (cost share if over FPL); physical need and availability (prioritization on waitlist); region (via local Area Agencies on Aging).[2][4]**: 1 programs
- **not_applicable — counseling services are standardized; specific assistance depends on individual circumstances**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **TennCare Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three distinct tiers (QMB, SLMB, QI) with progressively higher income thresholds but decreasing benefits. Income and resource limits scale by household size (individual vs. married couple). QI has unique first-come, first-served funding constraints and annual reapplication requirements, making it less stable than QMB/SLMB. All three programs are administered by a single state entity (Bureau of TennCare) with no regional variation in eligibility or benefits. Income limits are tied to Federal Poverty Guidelines and adjust annually.
- **Tennessee Weatherization Assistance Program**: Administered statewide via local subgrantees in 95 counties with funding-based availability; priority tiers for vulnerable households; income at 200% FPL with automatic qualifiers like SSI/TANF.
- **Tennessee SHIP**: No income/asset/age tests; counseling-only service via regional network; open access for Medicare beneficiaries/families statewide
- **Tennessee Meals on Wheels**: Decentralized by  local AAAD per county/region with no statewide income/asset test; homebound requirement strictly assessed; over 150 congregate sites but home delivery zone-restricted
- **Tennessee Caregiver Respite Support**: Decentralized via 10+ AAADs with local variation; voucher-based self-direction; ties to federal OAA/NFCSP and state grants; priority tiers and funding caps limit access
- **Tennessee SCSEP**: Administered statewide via regional sub-grantees with county-specific providers and contacts; income test at 125% FPL by family size (annual HHS table); priority tiers for veterans/65+; temporary paid training slots limited by federal funding and local capacity
- **Tennessee Legal Aid for Seniors**: Regionally administered via multiple providers (not single statewide program); priority tiers by case type/emergency; some no income test but most Legal Aid have poverty guideline limits; varies heavily by East/Middle/West TN
- **OPTIONS for Community Living**: State-funded via Tennessee Commission on Aging and Disability; no strict income/asset caps but cost share applies; regional delivery through Area Agencies with waitlists and prioritization; functional need (3+ ADLs) drives eligibility, not Medicaid linkage.
- **Tennessee State Health Insurance Assistance Program (TN SHIP)**: TN SHIP is a counseling and advocacy program, not a direct-benefit program. It has no income or asset limits, no formal application process, and no waiting period — beneficiaries simply call to access services. The program's value lies in helping beneficiaries navigate complex Medicare options and apply for OTHER assistance programs. Regional variation is significant: nine separate offices serve different areas with different phone numbers and coverage areas. The program is federally funded but state-administered, creating a hybrid governance structure. Unlike many assistance programs, there is no 'approval' or 'denial' — SHIP provides services to anyone who contacts them and is Medicare-eligible.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Tennessee?
