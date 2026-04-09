# Rhode Island Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 14 |
| New (not in our data) | 6 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 6 programs
- **financial**: 5 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid

- **income_limit**: Ours says `$1304` → Source says `$2,982` ([source](https://staycovered.ri.gov/ or https://eohhs.ri.gov/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Comprehensive health coverage including doctor visits, hospital care, prescriptions. For elderly/LTSS: nursing home care, assisted living, home-based non-medical supports (personal care, homemaker), shared living. Medicare-Medicaid Plan (Neighborhood INTEGRITY) coordinates Medicare + Medicaid + LTSS. PACE for community-based LTSS. Office of Healthy Aging covers limited home services for 65+ or dementia under 65. No fixed dollar/hour amounts; comprehensive coverage with potential co-share for LTSS.[6][2][4]` ([source](https://staycovered.ri.gov/ or https://eohhs.ri.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://staycovered.ri.gov/ or https://eohhs.ri.gov/`

### Long Term Services & Supports (LTSS)

- **min_age**: Ours says `65` → Source says `65+ for seniors; 18+ for adults with disabilities` ([source](https://eohhs.ri.gov/consumer/health-care/long-term-services-and-supports and https://dhs.ri.gov/programs-and-services/long-term-services-and-supports))
- **income_limit**: Ours says `$2901` → Source says `$2,982` ([source](https://eohhs.ri.gov/consumer/health-care/long-term-services-and-supports and https://dhs.ri.gov/programs-and-services/long-term-services-and-supports))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Rhode Island Medicaid covers an array of Long-Term Services and Supports (LTSS) for adults eligible for Home and Community Based Services (HCBS)[6]. Services may be provided in a person's home, the community (shared living, assisted living), or institutional settings (intermediate care facilities, hospitals, nursing homes)[7]. The search results do not specify exact dollar amounts, hours per week, or a complete list of covered services.` ([source](https://eohhs.ri.gov/consumer/health-care/long-term-services-and-supports and https://dhs.ri.gov/programs-and-services/long-term-services-and-supports))
- **source_url**: Ours says `MISSING` → Source says `https://eohhs.ri.gov/consumer/health-care/long-term-services-and-supports and https://dhs.ri.gov/programs-and-services/long-term-services-and-supports`

### PACE (Program of All-Inclusive Care for the Elderly)

- **min_age**: Ours says `65` → Source says `55` ([source](https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/))
- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive coordinated care including primary/acute/specialty/behavioral health, long-term services/supports (LTSS), adult day services, transportation to/from centers/appointments/emergencies, social/behavioral supports, home-based LTSS if needed, hospital/nursing home coordination. No copays/deductibles. All Medicare/Medicaid services via interdisciplinary team (social workers, nurses, etc.)[2][4][5].` ([source](https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/))
- **source_url**: Ours says `MISSING` → Source says `https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/`

### Medicare Savings Programs (MSP): QMB, SLMB, QI

- **income_limit**: Ours says `$1304` → Source says `$1,683` ([source](https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance/copayments for Medicare-covered services; auto-qualifies for Extra Help (Part D low-income subsidy, ≤$12.65/generic drug copay in 2026). SLMB: Part B premiums only (but auto-converted to QMB in RI). QI: Part B premiums only; auto-Extra Help.[4][3][1]` ([source](https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx`

### Supplemental Nutrition Assistance Program (SNAP)

- **income_limit**: Ours says `$1980` → Source says `$2,608` ([source](https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits loaded on EBT card for food purchases at authorized stores. Maximum ~$291 for 1-person household, ~$535 for 2-person (2026 estimates; actual amount based on income, deductions, household size). Seniors get higher medical (> $35/month) and shelter deductions.[1]` ([source](https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$42,252` ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time grant paid directly to utility or fuel company for heating costs (Regular LIHEAP); crisis grants for emergencies like shutoffs or broken heaters (Crisis LIHEAP). Grant amounts based on income, family size, fuel type, and minimum delivery requirements; specific dollar values not fixed but vary (e.g., primary grants scaled per eligibility chart). No cooling assistance[1][4][6][7].` ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized counseling and assistance on Medicare coverage (Parts A, B, C, D, Medigap), applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy), appeal rights, fraud prevention via Senior Medicare Patrol, outreach presentations, and education at health fairs[1][3][4][5][6]` ([source](https://oha.ri.gov/Medicare[3]))
- **source_url**: Ours says `MISSING` → Source says `https://oha.ri.gov/Medicare[3]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints via mediation, negotiation, and administrative action; investigation of abuse, neglect, mistreatment, financial exploitation; education on residents' rights; support for resident and family councils; facility inspections; representation before agencies; assistance with issues like improper discharge, food quality, medication, and care quality; no financial aid, hours, or dollar amounts provided.` ([source](https://alliancebltc.org/ombudsman-program/overview/))
- **source_url**: Ours says `MISSING` → Source says `https://alliancebltc.org/ombudsman-program/overview/`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program (WAP)** — service ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/weatherization-assistance-program-wap))
  - Shape notes: Eligibility gated through LIHEAP qualification; delivered via regional CAP agencies with varying service towns; prioritizes vulnerable households (elderly, disabled, children); services free but home-condition dependent.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](U.S. Department of Labor: dol.gov/agencies/eta/seniors[2]; Rhode Island Department of Labor & Training: dlt.ri.gov[8]))
  - Shape notes: SCSEP is a nationally administered program with local variation by provider. The search results provide national program structure but lack Rhode Island-specific details including: exact income thresholds in dollars, specific local office locations and phone numbers, regional wait times, asset limits, and which nonprofits operate SCSEP in Rhode Island. Families must contact their local Rhode Island Department of Labor & Training office or use the AARP Foundation locator to access Rhode Island-specific application details and current availability.
- **Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)** — financial ([source](https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance))
  - Shape notes: Four income-based tiers with copay percentages (15-85%); benefits only during Part D deductible/non-covered drugs; no asset test; separate rules for 55-64 disabled
- **At Home Cost Share Program** — financial ([source](https://oha.ri.gov/resources/home-care/home-cost-share))
  - Shape notes: Income-based sliding scale co-pays with tiers (no asset test); benefits via state subsidy on services, not fixed hours/dollars; FPL-based limits adjust yearly; needs assessment mandatory
- **Senior Companion Program** — service ([source](https://oha.ri.gov/get-involved/volunteering/senior-companions[6]))
  - Shape notes: Volunteer-based AmeriCorps program pairing senior volunteers with frail elders; limited RI-specific details on income/assets; statewide via Office of Healthy Aging[6]
- **RIPTA Senior Reduced Fare Bus Pass** — in_kind ([source](https://www.ripta.com/reducedfare))
  - Shape notes: This program has a bifurcated structure: low-income seniors/persons with disabilities receive free all-day travel, while non-low-income seniors/persons with disabilities receive half-fare off-peak travel. Income eligibility is tied to 200% of Federal Poverty Level (not a fixed dollar amount), which varies by household size and year. The program is statewide but administered through a single Photo ID Office with mobile outreach. Processing timelines and waitlist information are not publicly documented.

## Program Details

### Medicaid


**Eligibility:**
- Age: 65+
- Income: For long-term care Medicaid (relevant for elderly): Single applicants must have income under $2,982/month (2026). Married couples (both applying) and one spouse applying have specific limits detailed in state tables; higher income allowed for LTSS with potential co-share payment. General Medicaid for adults 65+ uses modified adjusted gross income (MAGI); SSI recipients automatically qualify. Exact FPL percentages: adults up to 138% (expansion), but seniors often qualify under aged/disabled pathways with asset tests.[2][1][4]
- Assets: Applies to long-term care programs for seniors 65+: Specific dollar limits for singles, married couples (both or one applying) per 2026 RI tables (e.g., countable assets under thresholds like $2,000-$3,000 typical for singles in similar programs, but RI-specific chart required). What counts: most savings, investments, second homes. Exempt: primary home (if intent to return and equity under limit), one vehicle, personal belongings, burial funds. Strategies exist to qualify over limits via planning.[2][5]
- Rhode Island resident
- U.S. citizen or qualified immigrant (e.g., refugees, lawful permanent residents after 5 years)
- For LTSS: Meet nursing facility level of care or need help with activities of daily living
- Medicare enrollees may qualify via Medicare-Medicaid program
- SSI automatic eligibility; otherwise, financial criteria for aged/blind/disabled

**Benefits:** Comprehensive health coverage including doctor visits, hospital care, prescriptions. For elderly/LTSS: nursing home care, assisted living, home-based non-medical supports (personal care, homemaker), shared living. Medicare-Medicaid Plan (Neighborhood INTEGRITY) coordinates Medicare + Medicaid + LTSS. PACE for community-based LTSS. Office of Healthy Aging covers limited home services for 65+ or dementia under 65. No fixed dollar/hour amounts; comprehensive coverage with potential co-share for LTSS.[6][2][4]
- Varies by: priority_tier

**How to apply:**
- Online: HealthSourceRI.com or HealthyRhode.ri.gov
- Paper application via mail
- Phone: HealthSource RI (1-855-840-4774 implied via site; confirm via official)
- In-person: Local assistance via HealthSourceRI navigators

**Timeline:** Not specified in sources; standard Medicaid processing applies (typically 45 days for aged/disabled).
**Waitlist:** Possible for LTSS due to level of care assessment; not detailed.

**Watch out for:**
- Asset limits apply strictly for LTSS/nursing home; home equity may count if over limits
- Higher income OK for LTSS but requires co-share payment
- Must prove nursing level of care for LTSS, separate from financial eligibility
- SSI auto-qualifies; others need full review
- Medicare-Medicaid dual eligible get integrated care via NHPRI, not standard Medicaid
- Planning needed to spend down assets legally

**Data shape:** Eligibility splits by standard Medicaid vs. LTSS (higher income/assets allowed with co-share); tiered by aged/disabled pathways; LTSS requires level-of-care test; 2026 income/asset tables specific to marital status and applicant count.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://staycovered.ri.gov/ or https://eohhs.ri.gov/

---

### Long Term Services & Supports (LTSS)


**Eligibility:**
- Age: 65+ for seniors; 18+ for adults with disabilities+
- Income: Single applicant: $2,982/month (2026)[2]. For married couples where both spouses are applicants, each spouse is considered individually with each allowed up to $2,982/month[1]. Income includes IRA payments, pension payments, Social Security benefits, property income, alimony, wages, salary, and stock dividends[2]. If monthly income exceeds the limit, the applicant may have to pay a portion toward care costs (patient share)[3].
- Assets: Single applicant: $4,000 or less in countable assets (2026)[2][3]. The search results do not specify asset limits for married couples or what assets are exempt from the count. Consult a Certified Medicaid Planner or Elder Law Attorney for specifics on asset exemptions[2].
- Rhode Island residency[1]
- Citizenship and immigration status requirements[4]
- Functional/medical requirement: Must require Nursing Facility Level of Care (NFLOC), meaning full-time care normally associated with a nursing home[2]
- Functional assessment evaluates ability to perform Activities of Daily Living (mobility, bathing, dressing, eating, toileting) and Instrumental Activities of Daily Living (shopping, cooking, cleaning, laundry)[2]

**Benefits:** Rhode Island Medicaid covers an array of Long-Term Services and Supports (LTSS) for adults eligible for Home and Community Based Services (HCBS)[6]. Services may be provided in a person's home, the community (shared living, assisted living), or institutional settings (intermediate care facilities, hospitals, nursing homes)[7]. The search results do not specify exact dollar amounts, hours per week, or a complete list of covered services.
- Varies by: level_of_care_and_setting

**How to apply:**
- Online through HealthSource RI customer portal (HealthSource RI | Your Health)[3]
- Mail: Rhode Island Department of Human Services, P.O. Box 8709, Cranston, RI 02920-8787[3]
- Download and mail application[3]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Strict asset limits: $4,000 maximum in countable assets for single applicants[2][3]. Applying when over the income and/or asset limit(s) will result in denial of benefits[1].
- Income counts almost everything: Nearly all income is counted toward the limit, including Social Security, pensions, and investment income[2].
- Patient share requirement: If income exceeds the limit, applicants must contribute a portion of their income toward care costs[3][5].
- Functional assessment is mandatory: Meeting financial criteria alone is insufficient; applicants must also demonstrate need for Nursing Facility Level of Care through a functional assessment[2][3].
- Complex eligibility determination: The state reviews past financial transactions, not just current income and assets[5]. Medicaid planning strategies may be necessary to achieve eligibility.
- No specific processing timeline provided: Families should contact DHS directly to understand expected approval timelines.
- Supplemental forms required: The basic DHS Application for Assistance is not sufficient; supplemental LTSS forms must also be completed[3].

**Data shape:** LTSS eligibility is determined by three categories: general eligibility factors (residency, citizenship, age, marital status), financial eligibility factors (income and assets), and clinical/functional eligibility (level of care need)[4]. Benefits vary by the applicant's level of care needs and the setting in which services are provided (home, community, or institutional)[7][8]. The program serves both seniors 65+ and working-age adults 18+ with disabilities, but eligibility criteria are applied uniformly statewide. Income and asset limits are fixed dollar amounts that adjust annually (income limit increased from $2,901/month in 2025 to $2,982/month in 2026)[1][2]. The search results do not provide information on processing times, waitlists, regional office locations, or a complete list of covered services and their specific values.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://eohhs.ri.gov/consumer/health-care/long-term-services-and-supports and https://dhs.ri.gov/programs-and-services/long-term-services-and-supports

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No strict income limits for enrollment; financial eligibility tied to Medicaid LTSS if seeking no-cost coverage. For Medicaid long-term services and supports (LTSS) in Rhode Island (2025 figures): income under 300% of Federal Benefit Rate ($2,901/month for single person). Private pay available for non-Medicaid eligible (average $4,000–$5,000/month). Limits may vary by household size per state Medicaid rules; consult EOHHS for full table[1][4].
- Assets: For Medicaid LTSS: assets $2,000 or less (excluding primary home, one vehicle, and certain exempt items like personal belongings). No asset test for initial PACE enrollment if private pay[1].
- Need nursing home level of care (certified by state; extensive assistance with ADLs like bathing, grooming, toileting, walking, transferring, eating)
- Able to live safely in the community with PACE support
- Live in PACE RI service area (statewide excluding Block Island and Prudence Island)
- Agree to receive care exclusively from PACE network of doctors/providers
- Eligible for Medicaid LTSS and/or Medicare (dual eligible preferred but not required; Medicare: US citizen/legal resident 5+ years, 65+ or disabled/ALS/ESRD)
- No Medicare Advantage, prepayment plan, Part D, hospice, or managed Medicare

**Benefits:** Comprehensive coordinated care including primary/acute/specialty/behavioral health, long-term services/supports (LTSS), adult day services, transportation to/from centers/appointments/emergencies, social/behavioral supports, home-based LTSS if needed, hospital/nursing home coordination. No copays/deductibles. All Medicare/Medicaid services via interdisciplinary team (social workers, nurses, etc.)[2][4][5].
- Varies by: region

**How to apply:**
- Phone: 401-434-1400 (PACE RI) or 401-654-4176 (enrollment specialist)[2][9]
- In-person: Meet with enrollment specialist at service centers (Providence, Woonsocket, Westerly)[4][9]
- Contact PACE provider for assessment (no specific online URL or mail listed; state via EOHHS)[3]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; potential regional variations[4]

**Watch out for:**
- Must use only PACE network providers (no outside doctors)
- Private pay expensive ($4k–$5k/month) if not Medicaid-eligible
- Cannot have Medicare Advantage, Part D, hospice, or other managed plans
- Limited to 3 centers; not truly statewide (excludes islands, service area restrictions)
- Functional need for nursing home care but must live safely in community—no institutionalization
- Re-enrollment treated as new unless within 2 months of losing Medicaid[5]

**Data shape:** Limited to 3 service centers; no upfront financial test for enrollment but Medicaid determines free access; private pay option; regional center-based delivery

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/

---

### Medicare Savings Programs (MSP): QMB, SLMB, QI


**Eligibility:**
- Age: 65+
- Income: Rhode Island-specific 2026 limits (updated Feb 1, 2026): QMB: $1,683/month individual, $2,275/month couple; QI: $2,255/month individual, $3,050/month couple. SLMB: Technically offered but former SLMB qualifiers auto-enrolled in QMB. Must have Medicare Part A (and Part B for SLMB/QI). Limits apply to countable monthly income.[4][2]
- Assets: Federal limits used in RI: $9,950 individual, $14,910 couple for QMB, SLMB, QI. Countable assets include savings/checking, stocks; exempt: home, one car, burial plots, life insurance up to $1,500 face value, personal belongings. If assets ≤$4,000 individual/$6,000 couple, may qualify for full Medicaid instead (more benefits).[2][4][3]
- Must be RI resident
- U.S. citizen or qualified immigrant
- 65+ or disabled (receiving SSDI/SSI)
- Enrolled in Medicare Parts A/B as applicable

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance/copayments for Medicare-covered services; auto-qualifies for Extra Help (Part D low-income subsidy, ≤$12.65/generic drug copay in 2026). SLMB: Part B premiums only (but auto-converted to QMB in RI). QI: Part B premiums only; auto-Extra Help.[4][3][1]
- Varies by: program_tier

**How to apply:**
- Online: https://apply.eohhs.ri.gov/
- Phone: 1-855-697-4347 (RI DHS Helpline)
- Mail: Rhode Island DHS, P.O. Box 880, Providence, RI 02901
- In-person: Local DHS offices (find via eohhs.ri.gov/locations)

**Timeline:** 45-90 days typical; state determines eligibility level upon application.[3]
**Waitlist:** QI only: First-come, first-served with priority to prior-year recipients; funds limited.[4][3]

**Watch out for:**
- SLMB auto-converts to QMB in RI (expanded eligibility as of Feb 2026)—don't assume separate SLMB.[4]
- QI requires annual reapplication + waitlist risk.[3]
- Assets over $4k/$6k disqualify from full Medicaid (better coverage) but ok for MSP.[5][2]
- Must apply even if unsure—state assigns best program.[3]
- QMB providers can't bill you for Medicare-covered services (but some miss this).[1]

**Data shape:** RI expanded QMB to cover former SLMB (Feb 2026); uses federal asset limits but screens for full Medicaid first if assets low; QI waitlist/annual renewal; no household size beyond individual/couple in limits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: Households with a member age 60+ or disabled qualify if gross monthly income is under 200% FPL (e.g., $2,608/month for 1 person; exact amounts scale by household size and annual FPL updates for Oct 1, 2025–Sept 30, 2026). Net income must be at or below 100% FPL. No gross income test if all members are 60+ or disabled. Households without elderly/disabled: under 185% FPL gross.[2][5]
- Assets: No asset limit in Rhode Island for households with a member 60+ or disabled. Federal fallback asset limit of $4,500 may apply if gross income exceeds expanded limits, but RI waives it broadly. Exempt: primary home, retirement savings, most vehicles. Applications may still request asset info.[2][8]
- U.S. citizen or qualified non-citizen
- Rhode Island resident
- Household includes those who buy/prepare food together
- For ESAP (simplified rules): All adults 60+ or disabled, no earned income[4][6]

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized stores. Maximum ~$291 for 1-person household, ~$535 for 2-person (2026 estimates; actual amount based on income, deductions, household size). Seniors get higher medical (> $35/month) and shelter deductions.[1]
- Varies by: household_size

**How to apply:**
- Online: Rhode Island DHS portal (dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap)
- Phone: State SNAP hotline (contact local DHS office or 1-855-697-4347 for RI)
- Mail/In-person: Local Department of Human Services (DHS) offices statewide
- Simplified ESAP paper form: 'Simple Application for the Supplemental Nutrition Assistance Program (SNAP) for Elderly and/or Disabled Households' (optional)[6]

**Timeline:** Standard 30 days; expedited for urgent need. ESAP extends certification to 36 months with simplified reporting[1][6]

**Watch out for:**
- Social Security/pensions count as income; many eligible seniors miss out (only ~half participate)[3]
- Higher 200% FPL gross limit for elderly/disabled often overlooked—focus on net income[2][5]
- ESAP auto-converts qualifying households for 36-month certification but requires no earned income[6]
- Medical expenses >$35/month deductible boost benefits significantly for seniors[1][7]
- Own home/savings don't disqualify; program emphasizes current income[3][8]

**Data shape:** Expanded 200% FPL gross for elderly/disabled (no asset test); ESAP simplifies for all-adult elderly/disabled households with no earned income; benefits/deductions scale by household size and medical/shelter costs

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Households must be at or below 60% of Rhode Island's Median Income Levels (State Median Income). Exact FFY2026 limits (effective October 1, 2025) from official DHS table: Household size 1: $42,252 (12-month), $10,563 (3-month), $3,521 (1-month); size 2: $55,252 / $13,813 / $4,604; size 3: $68,253 / $17,063 / $5,687. Full table extends to size 14: $126,756 / $31,689 / $10,563. Gross monthly income before taxes; all at address counted as household if sharing utility bill[1][2][4][7].
- Assets: No asset or resource limits; resources not counted[1][3].
- Citizen or lawfully present immigrant (mixed-status households eligible based on eligible members' income[3])
- Renters or homeowners eligible; no requirement for public assistance or unpaid bill[2]

**Benefits:** One-time grant paid directly to utility or fuel company for heating costs (Regular LIHEAP); crisis grants for emergencies like shutoffs or broken heaters (Crisis LIHEAP). Grant amounts based on income, family size, fuel type, and minimum delivery requirements; specific dollar values not fixed but vary (e.g., primary grants scaled per eligibility chart). No cooling assistance[1][4][6][7].
- Varies by: household_size|priority_tier

**How to apply:**
- Online: Through local Community Action Program (CAP) agency portals (e.g., cappri.org, westbaycap.org, ebcap.org, or DHS-linked system; email verification required within 30 min[2][5][8])
- Phone: Local CAP agencies (e.g., CAPP: 401-273-2000; EBCAP: 401-437-1000 ext. 6606[5][8])
- In-person: Local CAP intake sites (new applicants preferred in-person; accommodations for elderly/disabled[2][5])
- Mail/Dropbox: To local CAP (e.g., CAPP dropbox; cannot fax/email[5])

**Timeline:** 3-5 business days for initial review after document submission; staff contacts for more info[5].
**Waitlist:** Funding limited; applications may close early if funds exhausted (typically Sept-May/Nov-Mar); priority for shutoff/termination notices[1][2][5][6].

**Watch out for:**
- Must apply through local CAP agency, not directly DHS; new applicants should go in-person[2]
- Funding limited—apply early (season starts ~Oct 1); may close before May if funds run out[1][2][5]
- Online requires active email and quick verification; mail/dropbox only for some CAPs, no fax/email[2][5]
- Renewals mailed but update address; priority for crisis/shutoff but all eligible apply ASAP[2][5][7]
- Household includes all sharing utility bill, even roommates[1]

**Data shape:** Income tested at 60% SMI with full household size table scaling to 14 members; grants vary by income/size/fuel; administered via multiple regional CAP agencies with local application methods; no assets; crisis priority tier

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must qualify for LIHEAP (Low-Income Home Energy Assistance Program) or have low-income rate A-60 through RI Energy. Exact dollar amounts not specified in sources; follows federal low-income guidelines, typically 60% of state median income or 150% federal poverty level for LIHEAP. Varies by household size per LIHEAP tables (contact local CAP for current FY table). Prioritizes households with older adults, people with disabilities, or children.
- Assets: No asset limits mentioned.
- First apply and qualify for LIHEAP.
- Home must meet criteria: not recently weatherized (e.g., within last 10 years), no disqualifying conditions like mold.
- Homeowners eligible; renters eligible with landlord approval.
- Rhode Island resident.

**Benefits:** Whole-house energy efficiency services including insulation (attic, wall, floor), heating system checks/tuning, boiler/furnace testing and repair/replacement, appliance replacements, health/safety measures (smoke/carbon monoxide detectors, draft reduction, proper ventilation), energy audit, compact fluorescent light bulbs, potential free appliance replacement via RI Energy.
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Program (CAP) agency (year-round applications).
- Phone examples: BVCAP (401) 723-4520; Tri-County contact via their sites.
- In-person at CAP intake locations (accommodations for older adults, disabled, non-English speakers).
- First apply for LIHEAP at local CAP.

**Timeline:** Not specified; home visits resumed fall 2020 post-COVID.
**Waitlist:** Not mentioned; applications accepted year-round but may depend on funding.

**Watch out for:**
- Must first qualify for LIHEAP—WAP is not standalone.
- Renters need landlord approval.
- Home may be deferred if recently weatherized, has mold, or other issues beyond scope (e.g., costly wiring repairs).
- No recent weatherization (last 10 years) or energy audit may disqualify.
- Funding limited; prioritizes elderly, disabled, families with children—may affect wait times.
- Not all energy sources covered if receiving other assistance.

**Data shape:** Eligibility gated through LIHEAP qualification; delivered via regional CAP agencies with varying service towns; prioritizes vulnerable households (elderly, disabled, children); services free but home-condition dependent.

**Source:** https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/weatherization-assistance-program-wap

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income or asset limits; prioritizes people with limited incomes, Medicare beneficiaries under 65 with disabilities, and dually eligible for Medicare and Medicaid, but open to all Medicare beneficiaries, families, and caregivers[1][3][6]
- Assets: No asset limits or tests apply[1]
- Must be a Medicare beneficiary, family member, or caregiver seeking counseling on Medicare options[1][3][4][6]

**Benefits:** Free one-on-one personalized counseling and assistance on Medicare coverage (Parts A, B, C, D, Medigap), applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy), appeal rights, fraud prevention via Senior Medicare Patrol, outreach presentations, and education at health fairs[1][3][4][5][6]

**How to apply:**
- Phone: Toll-free 1-888-884-8721 or TTY 401-462-0740[3][7][8]
- Providence area: Dial 2-1-1 or 401-462-4444 (POINT)[6]
- Northern RI: 401-349-5760 x2635[6]
- Website: https://oha.ri.gov/Medicare[3][7][8]
- In-person: Office of Healthy Aging, 25 Howard Ave, Building 57, Cranston RI 02920[2]

**Timeline:** Immediate counseling available via phone or in-person; no formal application processing[1][4]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling, no direct payments or services[1][4]
- Helps apply for other programs like Extra Help but does not guarantee approval[1][3]
- Use regional phone lines for faster local access; statewide toll-free may route broadly[6]
- Open to all Medicare-related questions, not just low-income; people miss that it's free and unbiased[5]

**Data shape:** no income/asset test, counseling-only service, regional phone access points, statewide via single state agency with local partners

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oha.ri.gov/Medicare[3]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Annual household income at or below 125% of the federal poverty level[2]. The search results do not provide specific dollar amounts or household-size tables for Rhode Island or nationally.
- Assets: Not specified in available search results
- Must be unemployed[2]
- Enrollment priority given to: veterans and qualified spouses (first priority), then individuals who are over 65, have a disability, have low literacy skills or limited English proficiency, reside in a rural area, are homeless or at risk of homelessness, have low employment prospects, or have failed to find employment after using American Job Center services[2]

**Benefits:** Paid on-the-job training at average of 20 hours per week[2]. Participants earn the highest of federal, state, or local minimum wage[2]. Most participants train for approximately six months before placement into permanent employment[3]. Program also provides access to supportive services including assistance with food insecurities, housing, access to reliable medical care, and transportation assistance[5].
- Varies by: fixed (20 hours/week standard; supportive services vary by local provider)

**How to apply:**
- In-person: Contact your local SCSEP office[3]
- Phone: Rhode Island Department of Labor & Training (specific SCSEP phone number not provided in search results; general jobseeker resources available at dlt.ri.gov)[8]
- Online locator: AARP Foundation maintains a zip-code searchable locator at my.aarpfoundation.org/locator/scsep/[6]

**Timeline:** Not specified in search results. One source notes 'If you're eligible and there is no waiting list, you will be enrolled to train at a non-profit organization in your community'[3], implying enrollment can be immediate but does not specify typical processing timelines.
**Waitlist:** Waitlists may exist but are not described in detail. Enrollment depends on availability[3].

**Watch out for:**
- Income limits are tied to 125% of federal poverty level, which changes annually—families must verify current thresholds with their local office, as dollar amounts are not provided in search results[2]
- Program is experiencing 'a period of transition due to changes and delays in federal funding,' meaning availability and services may be unstable[3]
- Participants must be unemployed—those with any current employment may not qualify[2]
- Training is part-time (20 hours/week average) and temporary, not full-time permanent employment; the goal is transition to unsubsidized employment outside the program[1]
- Waitlists may exist; enrollment is not guaranteed even if eligible[3]
- Search results do not clarify whether asset limits exist, which could disqualify seniors with savings or property

**Data shape:** SCSEP is a nationally administered program with local variation by provider. The search results provide national program structure but lack Rhode Island-specific details including: exact income thresholds in dollars, specific local office locations and phone numbers, regional wait times, asset limits, and which nonprofits operate SCSEP in Rhode Island. Families must contact their local Rhode Island Department of Labor & Training office or use the AARP Foundation locator to access Rhode Island-specific application details and current availability.

**Source:** U.S. Department of Labor: dol.gov/agencies/eta/seniors[2]; Rhode Island Department of Labor & Training: dlt.ri.gov[8]

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a long-term care facility such as nursing home, assisted living, hospice, or licensed home care; or receiving services at Bristol Veterans Home, Eleanor Slater Hospital Regan Building in Cranston, or Zambarano Hospital in Pascoag; open to older persons and people with disabilities receiving long-term care services.

**Benefits:** Advocacy to resolve complaints via mediation, negotiation, and administrative action; investigation of abuse, neglect, mistreatment, financial exploitation; education on residents' rights; support for resident and family councils; facility inspections; representation before agencies; assistance with issues like improper discharge, food quality, medication, and care quality; no financial aid, hours, or dollar amounts provided.

**How to apply:**
- Phone: (401) 785-3340 or toll-free 1-888-351-0808
- Online contact form: https://alliancebltc.org/ombudsman-program/contact/
- Mail: Office of Healthy Aging, 25 Howard Ave, Building 57, Cranston, RI 02920

**Timeline:** Not specified in sources.

**Watch out for:**
- Not a direct service provider or financial assistance program—focuses solely on advocacy and complaint resolution; only for those already in long-term care facilities or specific services, not for placement or pre-admission help; anyone (resident, family, staff, agency) can file complaints on behalf of residents; operates independently but funded by federal Older Americans Act, state grants, and donations.

**Data shape:** no income test; advocacy-only with no financial benefits or waitlists; restricted to residents of defined long-term care settings statewide; contact-based rather than formal application.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://alliancebltc.org/ombudsman-program/overview/

---

### Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 55-64 if receiving Social Security Disability Insurance (SSDI)+
- Income: Four levels based on annual income; no resource test. For ages 65+: Level 1 (lowest income): $0-$47,630 individual / $0-$59,558 couple (state pays full cost after $1,500 out-of-pocket); Level 2: up to specified higher threshold (participant pays 40%); Level 3: $47,631-$83,510 individual / $59,559-$95,261 couple (participant pays 15%, subsidy 80%). Ages 55-64 disabled: $0-$83,510 (15% copay, 85% subsidy). Income guidelines adjusted 5.9% effective 1/1/2023[1][2][7].
- Assets: No resource test or asset limits[1].
- Enrolled in Medicare Part D plan
- Not enrolled in or eligible for SSA Extra Help Program
- Rhode Island resident[1][2][7]

**Benefits:** Subsidies for RIPAE-approved medications during Medicare Part D deductible period or for non-covered Part D drugs; participants pay tiered copays (40%, 70%, 85%, or 15%) of cost, state covers remainder; Level 1 (65+) gets full state payment after $1,500 annual out-of-pocket; RIPAE discount on other prescribed meds[1][2][5].
- Varies by: priority_tier

**How to apply:**
- Download application from OHA website
- Phone: Office of Healthy Aging (OHA) at (401) 462-3000 or (401) 462-0560; The Point at (401) 462-4444
- In-person: Office of Healthy Aging or senior centers statewide
- Mail: via OHA
- Appeal denial: call OHA at (401) 462-3000[1][2]

**Timeline:** Not specified in sources

**Watch out for:**
- Only covers deductible period or non-covered Part D drugs; must be enrolled in Medicare Part D but ineligible for Extra Help
- Income tiers determine copay percentage and subsidy; check exact current limits as adjusted 1/1/2023
- Ages 55-64 limited to SSDI recipients with separate income cap
- No resource test, but must prove RI residency and Part D status[1][2][3]

**Data shape:** Four income-based tiers with copay percentages (15-85%); benefits only during Part D deductible/non-covered drugs; no asset test; separate rules for 55-64 disabled

**Source:** https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance

---

### At Home Cost Share Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 19-64 with a diagnosis of Alzheimer’s or a related dementia+
- Income: Capped at 250% of the Federal Poverty Level (FPL). Specific tiers from 2024 factsheet: Tier 1 - $18,825 (single), $25,550 (couple); Tier 2 - $30,120 (single), $40,880 (couple). Limits vary by household size and are adjusted annually; contact OHA for current FPL-based table[1][5][6].
- Assets: No asset limit[1][4][5].
- Needs assessment to determine eligibility for in-home or community-based services
- Do not qualify for Rhode Island’s Medicaid program[4][5]
- Need assistance at home with personal or health care, housekeeping, personal care, or meal preparation[1][4][5]

**Benefits:** State shares cost of in-home services (e.g., housekeeping, personal care, meal preparation) and/or community adult-day programs (personal care, nursing, meals, recreational/social activities). Participant pays sliding scale co-pay based on income: e.g., Tier 1 - $4.50/hour home care, $7.00/day adult day; Tier 2 - $7.50/hour home care, $15.00/day adult day (2024 rates; private pay averages $25-27/hour home care, $90-100/day adult day). Individualized assessment and care plan provided[1][4][5].
- Varies by: income_tier

**How to apply:**
- Phone: Contact ADRC/POINT at 401-462-4444[1][4]
- No specific online URL, mail, or in-person details listed; start via phone for assessment

**Timeline:** Not specified in sources
**Waitlist:** Not specified in sources

**Watch out for:**
- Not Medicaid (RIte@Home); separate program for non-Medicaid eligible with needs assessment required[1][4][5]
- Income tiers determine co-pay amounts, not full coverage; participants pay share (e.g., $4.50-$15/day)[5]
- Eligibility expanded in recent years to 250% FPL and younger adults with dementia—check current limits as FPL adjusts annually[1][6]
- Distinct from Medicaid programs with asset tests or NFLOC requirements[2]
- Private pay costs much higher, so program subsidizes but does not eliminate participant costs[4][5]

**Data shape:** Income-based sliding scale co-pays with tiers (no asset test); benefits via state subsidy on services, not fixed hours/dollars; FPL-based limits adjust yearly; needs assessment mandatory

**Source:** https://oha.ri.gov/resources/home-care/home-cost-share

---

### Senior Companion Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Income must meet AmeriCorps guidelines to receive stipend (specific dollar amounts not listed in RI sources; reviewed annually; low-income required for stipend eligibility)[1][6]
- Assets: No asset limits specified in RI sources
- Physical exam certifying ability to volunteer without detriment to self or clients[1]
- Pass criminal history and background checks[1]
- For volunteers: capable of providing companionship and assistance with daily tasks[6]

**Benefits:** Companionship for frail older adults in home, day centers, or community sites; assistance with daily tasks (e.g., transportation to medical appointments, shopping assistance, meal preparation, advocacy); respite for caregivers; volunteers (age 55+) receive training, supervision, annual recognition, and if income-eligible: tax-free stipend, travel/meal reimbursements (does not affect SSI/SSDI, etc.)[1][6]

**How to apply:**
- Phone: 401-462-0569 (Rhode Island Senior Companion Program)[6]

**Timeline:** Not specified in sources

**Watch out for:**
- Program recruits volunteers (seniors 55+) to serve frail elders, not direct financial aid to recipients; stipend and benefits are for volunteers, not clients; clients receive non-medical companionship/services only; income eligibility applies only for volunteer stipends, not clients[1][6]
- No specific RI income tables or client eligibility details provided; contact program for current AmeriCorps guidelines[1][6]

**Data shape:** Volunteer-based AmeriCorps program pairing senior volunteers with frail elders; limited RI-specific details on income/assets; statewide via Office of Healthy Aging[6]

**Source:** https://oha.ri.gov/get-involved/volunteering/senior-companions[6]

---

### RIPTA Senior Reduced Fare Bus Pass

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Total household income must not exceed 200% of the Federal Poverty Level[2]. The search results do not provide specific dollar amounts or a full household-size table, but applicants can verify their eligibility using the most recent Federal Poverty Guidelines by consulting the IRS or RIPTA's application materials.
- Assets: Not specified in available documentation
- Must be a Rhode Island resident[2]
- Must provide proof of age (Driver's License, Passport, Medicare Card, or Green Card/Citizenship Papers)[1]
- Must provide proof of identity (Driver's License, U.S. Passport, State ID Card, or Veterans Administration ID Card)[1][3]
- Must provide proof of low-income status[2]

**Benefits:** Free bus travel on RIPTA fixed-route service for two years[3]. Alternatively, seniors regardless of income can access half-fare boarding during off-peak hours (weekends, holidays, and weekdays outside 7am-9am and 3pm-6pm) with a 'Valid Off Peak' photo ID card or Medicare Card[3][4]
- Varies by: income_level

**How to apply:**
- Online: Visit www.ripta.com/reducedfare[3][4]
- In-person: Photo ID Office in Kennedy Plaza, Monday, Tuesday, Wednesday, and Friday from 8am-4pm (closed 12pm-1pm)[4]. RIPTA also conducts Photo ID road trips throughout the state—check RIPTA.com/calendar for upcoming dates[4]
- By mail: Send completed application with supporting documentation to Attention: Photo ID Office, RIPTA, 705 Elmwood Avenue, Providence, RI 02907[4]

**Timeline:** Not specified in available documentation
**Waitlist:** Not mentioned in available documentation

**Watch out for:**
- There are TWO separate programs: (1) Free all-day travel for low-income seniors/persons with disabilities, and (2) Half-fare off-peak travel for seniors/persons with disabilities regardless of income[3][4]. Families must determine which applies to their situation.
- Income limit is 200% of Federal Poverty Level, not a fixed dollar amount—this varies annually and by household size[2]. Applicants must verify current thresholds.
- Photo requirements are strict: submitted photos that differ considerably from submitted Proof of Identity will not be accepted, which can delay processing[3]
- RIPTA encourages renewal applications to begin at least one month before expiration[3]
- The Photo ID Office in Kennedy Plaza has limited hours (Monday-Friday, 8am-4pm, closed noon-1pm) and is closed on weekends and holidays[4]
- If applying by mail or online, processing time is not specified—families should plan accordingly
- Medicare Card alone qualifies for off-peak discounts but does not provide free all-day travel; a photo ID card is required for the free program[3][4]

**Data shape:** This program has a bifurcated structure: low-income seniors/persons with disabilities receive free all-day travel, while non-low-income seniors/persons with disabilities receive half-fare off-peak travel. Income eligibility is tied to 200% of Federal Poverty Level (not a fixed dollar amount), which varies by household size and year. The program is statewide but administered through a single Photo ID Office with mobile outreach. Processing timelines and waitlist information are not publicly documented.

**Source:** https://www.ripta.com/reducedfare

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid | benefit | state | deep |
| Long Term Services & Supports (LTSS) | benefit | state | medium |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Programs (MSP): QMB, SL | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Rhode Island Pharmaceutical Assistance f | benefit | state | deep |
| At Home Cost Share Program | benefit | state | deep |
| Senior Companion Program | resource | state | simple |
| RIPTA Senior Reduced Fare Bus Pass | resource | state | simple |

**Types:** {"benefit":9,"resource":4,"employment":1}
**Scopes:** {"state":6,"local":1,"federal":7}
**Complexity:** {"deep":9,"medium":1,"simple":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/RI/drafts.json`.

- **Medicaid** (benefit) — 5 content sections, 6 FAQs
- **Long Term Services & Supports (LTSS)** (benefit) — 4 content sections, 6 FAQs
- **PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 6 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **level_of_care_and_setting**: 1 programs
- **region**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **not_applicable**: 3 programs
- **fixed (20 hours/week standard; supportive services vary by local provider)**: 1 programs
- **income_tier**: 1 programs
- **income_level**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid**: Eligibility splits by standard Medicaid vs. LTSS (higher income/assets allowed with co-share); tiered by aged/disabled pathways; LTSS requires level-of-care test; 2026 income/asset tables specific to marital status and applicant count.
- **Long Term Services & Supports (LTSS)**: LTSS eligibility is determined by three categories: general eligibility factors (residency, citizenship, age, marital status), financial eligibility factors (income and assets), and clinical/functional eligibility (level of care need)[4]. Benefits vary by the applicant's level of care needs and the setting in which services are provided (home, community, or institutional)[7][8]. The program serves both seniors 65+ and working-age adults 18+ with disabilities, but eligibility criteria are applied uniformly statewide. Income and asset limits are fixed dollar amounts that adjust annually (income limit increased from $2,901/month in 2025 to $2,982/month in 2026)[1][2]. The search results do not provide information on processing times, waitlists, regional office locations, or a complete list of covered services and their specific values.
- **PACE (Program of All-Inclusive Care for the Elderly)**: Limited to 3 service centers; no upfront financial test for enrollment but Medicaid determines free access; private pay option; regional center-based delivery
- **Medicare Savings Programs (MSP): QMB, SLMB, QI**: RI expanded QMB to cover former SLMB (Feb 2026); uses federal asset limits but screens for full Medicaid first if assets low; QI waitlist/annual renewal; no household size beyond individual/couple in limits.
- **Supplemental Nutrition Assistance Program (SNAP)**: Expanded 200% FPL gross for elderly/disabled (no asset test); ESAP simplifies for all-adult elderly/disabled households with no earned income; benefits/deductions scale by household size and medical/shelter costs
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income tested at 60% SMI with full household size table scaling to 14 members; grants vary by income/size/fuel; administered via multiple regional CAP agencies with local application methods; no assets; crisis priority tier
- **Weatherization Assistance Program (WAP)**: Eligibility gated through LIHEAP qualification; delivered via regional CAP agencies with varying service towns; prioritizes vulnerable households (elderly, disabled, children); services free but home-condition dependent.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test, counseling-only service, regional phone access points, statewide via single state agency with local partners
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a nationally administered program with local variation by provider. The search results provide national program structure but lack Rhode Island-specific details including: exact income thresholds in dollars, specific local office locations and phone numbers, regional wait times, asset limits, and which nonprofits operate SCSEP in Rhode Island. Families must contact their local Rhode Island Department of Labor & Training office or use the AARP Foundation locator to access Rhode Island-specific application details and current availability.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only with no financial benefits or waitlists; restricted to residents of defined long-term care settings statewide; contact-based rather than formal application.
- **Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)**: Four income-based tiers with copay percentages (15-85%); benefits only during Part D deductible/non-covered drugs; no asset test; separate rules for 55-64 disabled
- **At Home Cost Share Program**: Income-based sliding scale co-pays with tiers (no asset test); benefits via state subsidy on services, not fixed hours/dollars; FPL-based limits adjust yearly; needs assessment mandatory
- **Senior Companion Program**: Volunteer-based AmeriCorps program pairing senior volunteers with frail elders; limited RI-specific details on income/assets; statewide via Office of Healthy Aging[6]
- **RIPTA Senior Reduced Fare Bus Pass**: This program has a bifurcated structure: low-income seniors/persons with disabilities receive free all-day travel, while non-low-income seniors/persons with disabilities receive half-fare off-peak travel. Income eligibility is tied to 200% of Federal Poverty Level (not a fixed dollar amount), which varies by household size and year. The program is statewide but administered through a single Photo ID Office with mobile outreach. Processing timelines and waitlist information are not publicly documented.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Rhode Island?
