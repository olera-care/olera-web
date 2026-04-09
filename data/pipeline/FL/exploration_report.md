# Florida Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 1.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 6 |
| Programs deep-dived | 6 |
| New (not in our data) | 5 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 3 programs
- **financial**: 2 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### SHINE (Serving Health Insurance Needs of Elders)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, unbiased, confidential one-on-one counseling on Medicare eligibility/enrollment, health plan choices, appeals, Medigap, long-term care insurance, prescription assistance, fraud prevention, and financial aid programs like Extra Help/Medicare Savings Programs. Educational presentations and community outreach also available.[3][5][6]` ([source](www.floridashine.org))
- **source_url**: Ours says `MISSING` → Source says `www.floridashine.org`

## New Programs (Not in Our Data)

- **Home Care for the Elderly (HCE) Program** — service ([source](https://elderaffairs.org/programs-services/home-care-for-elderly/ or https://www.agingcarefl.org/uploads/1/3/6/5/136526411/2020-chapter-6-home-care-for-the-elderly-program.pdf[1]))
  - Shape notes: Tied to ICP financial limits with automatic eligibility for SSI/QMB/SLMB; requires approved live-in caregiver and nursing home risk assessment; administered regionally via local AAAs/ADRCs[1]
- **Community Care for the Elderly (CCE) Program** — service ([source](https://elderaffairs.org/programs-services/community-care-for-the-elderly/))
  - Shape notes: State-funded (not Medicaid); eligibility prioritizes risk level with limited funds; administered regionally via local lead agencies with no statewide income/asset caps specified.
- **Respite for Elders Living in Everyday Families (RELIEF) Program** — service ([source](No official .gov URL identified in search results for this program.))
  - Shape notes: No data available in search results; program not referenced across provided sources, which cover LIHEAP, cash assistance, debt relief, housing waivers, and housing repairs instead.
- **Optional State Supplementation (OSS) for SSI Recipients** — financial ([source](https://www.myflfamilies.com/service-programs/access/florida-access/ (DCF ACCESS Florida); Fla. Admin. Code Ann. R. 65A-2.032))
  - Shape notes: Facility-specific payment rates with income offset; state-administered, direct-to-provider model; tied to SSI eligibility but only for licensed residential care settings, not independent living.
- **Additional Homestead Exemption for Seniors (Florida)** — financial ([source](https://floridarevenue.com/property/Documents/AdditionalHomesteadExemptions.pdf))
  - Shape notes: This program has two distinct tiers: (1) Limited-Income Senior Exemption ($50,000 off assessed value) available in most participating counties, and (2) Long-Term Residency Senior Exemption (full assessed value exemption) available only in select counties/municipalities with additional requirements (25-year residency, property value under $250,000). Availability is county-dependent, not statewide. Income limits are uniform statewide but adjusted annually. The exemption applies only to non-school tax millages, creating a significant limitation on benefit value. Application is decentralized through county property appraisers, with no centralized state application process.

## Program Details

### Home Care for the Elderly (HCE) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income and assets must not exceed Institutional Care Program (ICP) limits established by Medicaid and DCF. Exact 2026 dollar amounts not specified in sources; SSI, QMB, or SLMB recipients automatically qualify without further financial test. ICP for single nursing home Medicaid applicant is under $2,982/month income[1][4].
- Assets: Assets must not exceed ICP limits (e.g., under $2,000 for single nursing home Medicaid applicant). Specific counts/exemptions not detailed; SSI/QMB/SLMB automatic eligibility bypasses detailed asset review[1][4].
- Florida resident with intent to remain in state
- At risk of nursing home placement based on 701B assessment
- Live in a private home with an approved adult caregiver (age 18+ who provides full-time family-type living arrangement and meets Rule 58H-1.006, F.A.C. requirements; dwelling meets Rule 58H-1.007, F.A.C.)[1]

**Benefits:** Home care services to prevent nursing home placement, provided through approved caregiver in private home. Specific services, hours, or dollar amounts not detailed in sources; focuses on social, physical, and emotional needs[1].
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Department of Elder Affairs case manager (specific phone/website not in results; statewide via elderaffairs.org or local offices)
- In-person or phone assessment by case manager for functional, financial, and caregiver eligibility[1]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; potential regional waitlists implied but not detailed

**Watch out for:**
- Requires live-in adult caregiver (18+) who meets specific rules; not for those living alone
- Must be at risk of nursing home placement via 701B assessment, not just general home care needs
- Financial eligibility ties to ICP limits or automatic via SSI/QMB/SLMB; exceeding limits disqualifies unless automatic category
- Caregiver must provide full-time family-type care in private home meeting dwelling rules[1]
- Not Medicaid home health; distinct program with caregiver requirement[2]

**Data shape:** Tied to ICP financial limits with automatic eligibility for SSI/QMB/SLMB; requires approved live-in caregiver and nursing home risk assessment; administered regionally via local AAAs/ADRCs[1]

**Source:** https://elderaffairs.org/programs-services/home-care-for-elderly/ or https://www.agingcarefl.org/uploads/1/3/6/5/136526411/2020-chapter-6-home-care-for-the-elderly-program.pdf[1]

---

### Community Care for the Elderly (CCE) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits stated in program documents; eligibility based on age, functional impairment, and risk of institutionalization. General Florida Medicaid long-term care programs (for comparison) have 2026 limits of $2,982/month income and $2,000 assets for a single applicant, but CCE is state-funded via Department of Elder Affairs and does not explicitly reference these.
- Assets: No asset limits or exemptions detailed in CCE-specific sources.
- Functional impairment: Physical or mental limitations restricting ability to perform normal activities of daily living (assessed via comprehensive assessment).
- Risk of institutionalization without CCE services (priority given to those most at risk).
- Not dually enrolled in CCE and a Medicaid capitated long-term care program.
- Live in a community care service area served by a local CCE provider agency.

**Benefits:** Community-based services including medical supplies, emergency alert response, therapeutic services, and a continuum of care such as homemaker services, personal care, adult day care, respite care, and home-delivered meals (exact services coordinated by local provider based on assessment; no fixed dollar amounts or hours specified).
- Varies by: priority_tier

**How to apply:**
- Contact local Community Care for the Elderly (CCE) Lead Agency by phone or in-person for intake and screening (specific numbers vary by region; e.g., search for local provider via elderaffairs.org).
- Preliminary eligibility determination at intake, followed by comprehensive assessment.

**Timeline:** Intake screening as soon as possible if preliminarily eligible; full assessment and approval based on funds availability and priority ranking.
**Waitlist:** Approval depends on availability of funds and priority ranking (higher risk individuals prioritized; waitlists likely in high-demand areas).

**Watch out for:**
- No fixed income/asset limits, but funding is limited—eligibility also requires available funds and priority based on institutionalization risk.
- Must complete comprehensive assessment for functional impairment; preliminary intake may lead to referral if clearly ineligible.
- Cannot dual-enroll with Medicaid capitated long-term care programs.
- Services vary by local provider; not all areas have immediate availability.
- Annual reassessment required for ongoing eligibility.

**Data shape:** State-funded (not Medicaid); eligibility prioritizes risk level with limited funds; administered regionally via local lead agencies with no statewide income/asset caps specified.

**Source:** https://elderaffairs.org/programs-services/community-care-for-the-elderly/

---

### Respite for Elders Living in Everyday Families (RELIEF) Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific information found in search results for RELIEF program eligibility criteria, including income limits, asset limits, or age requirements.
- Assets: No specific information found.
- No details available from provided search results.

**Benefits:** No specific details on services, dollar amounts, hours, or tiers provided in search results.

**Timeline:** No information available.

**Watch out for:**
- Search results do not contain any information on the RELIEF program; it may not exist under this exact name, be newly established post-search data, or be administered locally without statewide documentation. Families should verify with Florida Department of Elder Affairs (DOEA) directly.

**Data shape:** No data available in search results; program not referenced across provided sources, which cover LIHEAP, cash assistance, debt relief, housing waivers, and housing repairs instead.

**Source:** No official .gov URL identified in search results for this program.

---

### Optional State Supplementation (OSS) for SSI Recipients

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income must meet SSI-related standards and not exceed specific limits based on living arrangement, such as up to $752.40 gross monthly countable income for community care programs. Exact limits vary by facility type and are calculated by subtracting countable income from the standard provider rate plus personal needs allowance (up to $78.40 state payment). Must be eligible for SSI or grandfathered (meet SSI criteria except income). Some sources note federal SSI limit of ~125% FPL, but Florida ties to facility-specific rates.
- Assets: Assets within SSA Title XVI SSI standards: $2,000 for individuals, $3,000 for couples. Counts standard SSI countable resources; exemptions include primary home (if applicable), one vehicle, household goods, etc., per federal SSI rules.
- Must be 65+, blind, or disabled (18+ for blind/disabled per SSA Title XVI criteria).
- Reside in specific licensed facilities: assisted living facilities (ALFs), adult family care homes (AFCs), or mental health residential treatment facilities.
- Need assistance with activities of daily living (ADLs) due to physical/mental conditions.
- Florida resident.
- Apply for and pursue all other potential benefits (SSI, Medicaid, etc.).
- Receiving SSI or grandfathered under prior SSI criteria.

**Benefits:** Monthly cash payments paid directly to the facility (assisted living, adult family care home, or mental health residential facility) to supplement SSI for room/board costs. Amounts vary by facility type: e.g., $184.40–$345 individual, $386.80–$690 couple (recent figures); up to $78.40 state payment after income offset; includes personal needs allowance (e.g., $54 in some cases). Total SSI + OSS can reach $1,233.94 independent or higher in facilities (e.g., $1,626.07 max in some 2026 scenarios). Payments cover provider rate + personal needs.
- Varies by: living_arrangement

**How to apply:**
- In-person or mail at local Florida Department of Children and Families (DCF) offices.
- Apply via ACCESS Florida system (state-administered).
- Phone: Local DCF office (e.g., North Broward Regional Service Center referenced; find via DCF directory).

**Timeline:** Not specified in sources; standard DCF processing applies, potentially weeks.
**Waitlist:** Possible proportional reduction if funding insufficient, but no standard waitlist mentioned.

**Watch out for:**
- Payments go directly to the facility, not the individual—facility acts as payee.
- Strictly for specific residential facilities; not for independent living (lower or no supplement).
- Must meet federal SSI asset/income rules exactly; grandfathering only if previously eligible.
- Funding shortfalls can lead to proportional payment cuts.
- Requires ADL assistance need and facility residency; not automatic with SSI alone.
- Apply for other benefits first (SSI/Medicaid); denial impacts OSS.
- Outdated data in some sources (e.g., 2010 SSA table); verify current rates with DCF.

**Data shape:** Facility-specific payment rates with income offset; state-administered, direct-to-provider model; tied to SSI eligibility but only for licensed residential care settings, not independent living.

**Source:** https://www.myflfamilies.com/service-programs/access/florida-access/ (DCF ACCESS Florida); Fla. Admin. Code Ann. R. 65A-2.032

---

### Additional Homestead Exemption for Seniors (Florida)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"2026_limit":"$38,686","description":"Total adjusted gross household income for all persons residing in the homestead cannot exceed $38,686[3][7][8]. This limit is adjusted annually by the percentage change in the average cost-of-living index[2][4]","what_counts":"Adjusted gross income includes Social Security benefits, pension, VA retirement annuities, interest income, wages, and Veteran's Affairs benefits[2][7]","calculation_method":"Adjusted gross income is the amount reported on IRS Form 1040 or Form 1040A. If the applicant is not required to file income tax, total income minus Social Security benefits[7]"}
- Must already have or qualify for a regular Homestead Exemption (own and reside on the property as permanent residence as of January 1)[1][4][7]
- Must be a permanent resident of Florida as of January 1 of the year of application[2][4]
- For Long-term Residency Senior Exemption variant: must have maintained permanent residence on the property for at least 25 consecutive years[3][5][7]
- For Long-term Residency variant: property must have a just value less than $250,000 in the first tax year of application[3][5][7]

**Benefits:** Up to $50,000 exemption off the assessed value for the limited-income senior exemption; full assessed value exemption for long-term residency senior exemption (25+ years residency)[5][8]
- Varies by: residency_duration_and_property_value

**How to apply:**
- In-person: Contact your local county property appraiser office (varies by county)
- Mail: Submit application to your county property appraiser
- Phone: Contact your county property appraiser for guidance (specific numbers vary by county)

**Timeline:** Not specified in available sources

**Watch out for:**
- This exemption is NOT automatic—applicants must apply and meet all requirements[1][7]
- The exemption applies ONLY to county and municipal tax millages, NOT to school district taxes or other taxing units[5][6]
- Income limits are based on PRIOR YEAR income, not current year[7][8]
- The income limit is adjusted annually in January—families must requalify each year if their income changes[2][4]
- Applicants must already have or qualify for a regular Homestead Exemption first; this is an ADDITIONAL exemption, not a standalone benefit[1][2][4]
- The long-term residency exemption (full assessed value) requires 25 consecutive years of permanent residence AND property value under $250,000—both conditions must be met[3][5][7]
- Social Security benefits COUNT toward the income limit[2][7]
- All household members' income counts, even if they are not on the property title[1][4]
- Availability varies significantly by county—not all Florida counties have adopted these exemptions[5]
- First-time applicants must submit a Household Income Sworn Statement (Form DR-501SC); renewal requirements may differ[1]

**Data shape:** This program has two distinct tiers: (1) Limited-Income Senior Exemption ($50,000 off assessed value) available in most participating counties, and (2) Long-Term Residency Senior Exemption (full assessed value exemption) available only in select counties/municipalities with additional requirements (25-year residency, property value under $250,000). Availability is county-dependent, not statewide. Income limits are uniform statewide but adjusted annually. The exemption applies only to non-school tax millages, creating a significant limitation on benefit value. Application is decentralized through county property appraisers, with no centralized state application process.

**Source:** https://floridarevenue.com/property/Documents/AdditionalHomesteadExemptions.pdf

---

### SHINE (Serving Health Insurance Needs of Elders)


**Eligibility:**
- Income: No income or asset limits for SHINE counseling itself; open to all Medicare beneficiaries, families, and caregivers. SHINE assists with programs like Extra Help (monthly income below $1,995 single; resources below $18,090) and Medicare Savings Programs (limits vary, apply even if slightly higher).[8]
- Assets: No asset limits for SHINE access. For assisted programs like Extra Help, resources below $18,090 (excludes home, car, etc.; consult SHINE for details).[8]
- Medicare beneficiary or prospective beneficiary (Parts A/B enrollment for some assisted benefits)
- Florida resident
- No affiliation requirement; services free to all regardless of income/age

**Benefits:** Free, unbiased, confidential one-on-one counseling on Medicare eligibility/enrollment, health plan choices, appeals, Medigap, long-term care insurance, prescription assistance, fraud prevention, and financial aid programs like Extra Help/Medicare Savings Programs. Educational presentations and community outreach also available.[3][5][6]

**How to apply:**
- Phone: Toll-free Elder Helpline 1-800-963-5337 (8am-5pm)
- Website: www.floridashine.org (find counseling sites, online volunteer app, orientation)
- In-person: Local Area Agency on Aging SHINE sites (locate via website)
- Online training/orientation: http://training.floridashine.org/STL_Modules/Orientation/story.html (for volunteers)

**Timeline:** Immediate counseling availability via phone/sites; no formal processing for service access

**Watch out for:**
- SHINE does not provide direct financial aid or healthcare; it counsels on accessing Medicare-related benefits. Not affiliated with insurers—volunteers neither sell nor recommend specific plans.
- Many eligible for savings programs (e.g., 35,000+ in some areas) remain unenrolled; must consult SHINE for application help.
- Virtual/in-person events vary; check site for availability.
- Assists with Extra Help/MSP but eligibility screened separately (e.g., DEERS for TRICARE).

**Data shape:** Counseling program with no client eligibility barriers; assists applying to tiered financial aid programs with income/resource tests; volunteer-driven via regional Area Agencies on Aging

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** www.floridashine.org

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Home Care for the Elderly (HCE) Program | benefit | state | deep |
| Community Care for the Elderly (CCE) Pro | benefit | state | deep |
| Respite for Elders Living in Everyday Fa | benefit | local | medium |
| Optional State Supplementation (OSS) for | benefit | state | medium |
| Additional Homestead Exemption for Senio | benefit | local | medium |
| SHINE (Serving Health Insurance Needs of | navigator | state | simple |

**Types:** {"benefit":5,"navigator":1}
**Scopes:** {"state":4,"local":2}
**Complexity:** {"deep":2,"medium":3,"simple":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/FL/drafts.json`.

- **Home Care for the Elderly (HCE) Program** (benefit) — 4 content sections, 6 FAQs
- **Community Care for the Elderly (CCE) Program** (benefit) — 3 content sections, 6 FAQs
- **Respite for Elders Living in Everyday Families (RELIEF) Program** (benefit) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **not_applicable**: 2 programs
- **living_arrangement**: 1 programs
- **residency_duration_and_property_value**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Home Care for the Elderly (HCE) Program**: Tied to ICP financial limits with automatic eligibility for SSI/QMB/SLMB; requires approved live-in caregiver and nursing home risk assessment; administered regionally via local AAAs/ADRCs[1]
- **Community Care for the Elderly (CCE) Program**: State-funded (not Medicaid); eligibility prioritizes risk level with limited funds; administered regionally via local lead agencies with no statewide income/asset caps specified.
- **Respite for Elders Living in Everyday Families (RELIEF) Program**: No data available in search results; program not referenced across provided sources, which cover LIHEAP, cash assistance, debt relief, housing waivers, and housing repairs instead.
- **Optional State Supplementation (OSS) for SSI Recipients**: Facility-specific payment rates with income offset; state-administered, direct-to-provider model; tied to SSI eligibility but only for licensed residential care settings, not independent living.
- **Additional Homestead Exemption for Seniors (Florida)**: This program has two distinct tiers: (1) Limited-Income Senior Exemption ($50,000 off assessed value) available in most participating counties, and (2) Long-Term Residency Senior Exemption (full assessed value exemption) available only in select counties/municipalities with additional requirements (25-year residency, property value under $250,000). Availability is county-dependent, not statewide. Income limits are uniform statewide but adjusted annually. The exemption applies only to non-school tax millages, creating a significant limitation on benefit value. Application is decentralized through county property appraisers, with no centralized state application process.
- **SHINE (Serving Health Insurance Needs of Elders)**: Counseling program with no client eligibility barriers; assists applying to tiered financial aid programs with income/resource tests; volunteer-driven via regional Area Agencies on Aging

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Florida?
