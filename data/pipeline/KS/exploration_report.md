# Kansas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.060 (12 calls, 1.2m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 10 |
| Programs deep-dived | 8 |
| New (not in our data) | 5 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **financial**: 3 programs
- **service**: 4 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### SNAP (Food Assistance)

- **income_limit**: Ours says `$1922` → Source says `$1,695` ([source](https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits loaded on EBT card for food purchases at authorized stores. Max ~$291 (1 person), ~$535 (2 people); actual amount based on income, deductions, household size—most seniors get less than max.[1]` ([source](https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care, in-home support, personal care, homemaker services; K-RAD subsidizes up to $1,000/year per care recipient for respite (paid to provider); other waivers offer paid family caregiving hours via Medicaid but specific hours/dollars not quantified; varies by waiver/program.` ([source](https://www.kdads.ks.gov/services-programs/aging/caregivers))
- **source_url**: Ours says `MISSING` → Source says `https://www.kdads.ks.gov/services-programs/aging/caregivers`

### Legal Assistance for Older Kansans

- **income_limit**: Ours says `$3091` → Source says `$14,610` ([source](https://www.kdads.ks.gov/services-programs/aging/older-americans-act))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free legal advice, counseling, referrals, limited representation; covers housing/eviction/foreclosure, public benefits (SSI/Medicaid/Medicare/VA), consumer fraud/debt/bankruptcy, elder law (wills, long-term care rights), family law (divorce/protection orders), guardianship; volunteer attorneys provide advice (no drafting/representation via hotline)[3][4][6][8]` ([source](https://www.kdads.ks.gov/services-programs/aging/older-americans-act))
- **source_url**: Ours says `MISSING` → Source says `https://www.kdads.ks.gov/services-programs/aging/older-americans-act`

## New Programs (Not in Our Data)

- **KanCare Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://kancare.ks.gov/apply-now/eligibility))
  - Shape notes: Tiered by income brackets (QMB lowest, QI highest) tied to FPL %; household size limited to individual/couple (no larger tables); assets exempt key items; statewide but local aging agencies help; annual FPL/asset updates with $20 income disregard in KS.
- **LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx))
  - Shape notes: Income based on full household at address (not just applicants); benefit scales by income/size/fuel/dwelling; seasonal app period only; regional DCF processing
- **Weatherization Assistance Program (WAP)** — service ([source](https://kshousingcorp.org/homeowners/weatherization-assistance/))
  - Shape notes: Statewide with county-specific providers; income at 200% FPL or auto-eligible via TAF/SSI/LIEAP; 15-year weatherization repeat ban; priority tiers not detailed but federal DOE structure implies elderly/disabled/children prioritized.
- **Kansas Senior Nutrition Program (Meals on Wheels)** — service ([source](https://www.kdads.ks.gov/services-programs/aging/kansas-senior-nutrition-program))
  - Shape notes: Administered locally through Aging and Disability Resource Centers with minimal statewide eligibility restrictions; services include both congregate and home-delivered meals without fixed income tables.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://workforce-ks.com/programs/seniorcommunityserviceemploymentprogram/))
  - Shape notes: Federally standardized (age 55+, ≤125% FPL, unemployed) but administered by grantees (e.g., SER in Kansas); benefits fixed at ~20 hours/week minimum wage; priority tiers affect access; no fixed income table or asset limits in sources—use annual federal poverty guidelines

## Program Details

### KanCare Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must be entitled to Medicare Part A (age 65+ or disabled). Limits vary by program and are updated annually (2026 federal limits from Medicare.gov used as most current; Kansas follows with possible state disregards). Full table for 2026 (individual/monthly unless noted):
- **QMB**: $1,350 individual, $1,824 couple (up to 100% FPL)[3]
- **SLMB**: $1,601 individual, $2,161 couple (120% FPL, table cut off in source but standard)[3]
- **QI**: $1,801 individual, $2,433 couple (135% FPL)[3]
Older 2022 KS-specific: QMB $1,153 ind/$1,546 couple; SLMB $1,379/$1,851; QI $1,549/$2,080 (includes $20 disregard)[1]. Confirm current via 1-800-792-4884 as FPL adjusts May annually[2][4][7].
- Assets: 2026: QMB/SLMB/QI - $9,950 individual, $14,910 couple. What counts: Bank accounts, stocks, bonds. Exempt: Home, one car, burial plots, life insurance (up to $1,500 face value), personal belongings[3]. Older KS 2022: $8,400 ind/$12,600 couple[1]. Varies slightly by year/source; call to confirm[4][5][7].
- Must be enrolled in Medicare Part A (hospital) for QMB/SLMB; Part A & B for SLMB/QI[1][2][3].
- Kansas resident.
- U.S. citizen or qualified immigrant.
- Not trying to qualify for full Medicaid in some cases (e.g., Expanded LMB)[2].
- Automatic Extra Help for Part D if approved[1][2].

**Benefits:** **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums ($174.70/mo in 2024 std), deductibles ($240 Part B/2024), coinsurance, copayments for Medicare-covered services/items[1][3]. **SLMB/QI**: Pays Part B premiums only[1][3]. All auto-qualify for Extra Help (lowers Part D costs up to $5,030 value/yr)[1][2].
- Varies by: priority_tier

**How to apply:**
- Online: KanCare website (https://kancare.ks.gov/apply-now/eligibility)[4][6].
- Phone: Call 1-800-792-4884 for paper app or assistance[4][7].
- Mail: Send to KanCare, PO Box 3599, Topeka, KS 66601[7].
- In-person: Local KDHE/KanCare offices or Area Agencies on Aging (e.g., Northeast Kansas AAA)[1][6].

**Timeline:** Determined eligible month of application; retroactive prior months if qualify. No specific timeline stated; paper mail may delay[2][4].

**Watch out for:**
- Limits change yearly (FPL update May); always call 1-800-792-4884 to confirm current amounts—don't rely on old charts[2][4][7].
- Must have Part A; SLMB/QI require Part B too—enroll first[1][3].
- Assets include most savings/stocks; exemptions narrow (home/car ok)[3].
- QI has highest income but waitlisted federally if funds exhausted (rare in KS reports)[3].
- Approval auto-triggers Extra Help but report changes in 10 days or risk overpayment[1][2].
- Not full Medicaid—only specific Medicare costs; compare to MediKan for non-Medicare needs[6].

**Data shape:** Tiered by income brackets (QMB lowest, QI highest) tied to FPL %; household size limited to individual/couple (no larger tables); assets exempt key items; statewide but local aging agencies help; annual FPL/asset updates with $20 income disregard in KS.

**Source:** https://kancare.ks.gov/apply-now/eligibility

---

### SNAP (Food Assistance)


**Eligibility:**
- Age: 60+
- Income: For households with any member 60+ or disabled, there is **no gross income limit** in Kansas. Gross income limit otherwise is 130% FPL: 1 person $1,695/mo, 2 $2,291, 3 $2,887, 4 $3,482, 5 $4,079, 6 $4,674, 7 $5,270, +$595 each additional (Oct 2025-Sep 2026). Net income must be at or below 100% FPL after deductions. Seniors on SSI are categorically eligible.[1][3]
- Assets: No asset limits for households where all members are 60+ or disabled. Otherwise, standard asset test applies (exempt: primary home, retirement savings, household goods, most vehicles; countable: cash, bank accounts).[1][2][3]
- U.S. citizen or qualified non-citizen (e.g., 5+ years residency, certain disability benefits).[5][6]
- Household includes those who live together and share food purchases/preparation.[2][4]
- No work requirements for households entirely 60+ or disabled.[4][5]
- Income includes Social Security, SSI, pensions, VA benefits.[2][4]

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized stores. Max ~$291 (1 person), ~$535 (2 people); actual amount based on income, deductions, household size—most seniors get less than max.[1]
- Varies by: household_size

**How to apply:**
- Online: Kansas online application portal (via local DCF office).[1]
- Phone: State SNAP hotline or local DCF office (arrange home visit/telephone interview for elderly).[1][7]
- In-person/mail: Local Department of Children and Families (DCF) office.[1][7]

**Timeline:** Not specified in sources; typically 30 days standard, expedited possible for urgent need.

**Watch out for:**
- No gross income test for elderly/disabled households—many miss this and think they earn too much.[1][3]
- Higher deductions for seniors: medical >$35/mo, excess shelter—crucial for qualification.[1][3][7]
- SSI recipients often auto-eligible; apply even on fixed income.[1]
- Include all household food-sharers, even non-relatives.[2]
- EBT only for food, not cash/hot meals (some exceptions).[1]

**Data shape:** No gross income limit or asset test for elderly/disabled households; benefits/deductions scale heavily by household size and senior-specific expenses (medical/shelter); statewide uniform rules via local DCF.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx

---

### LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Combined gross monthly income (before deductions) of all persons living at the address must not exceed 150% of the federal poverty level. 2026 guidelines: 1: $1,956; 2: $2,644; 3: $3,331; 4: $4,019; 5: $4,706; 6: $5,394; 7: $6,081; 8: $6,769; +1: add $688 per additional person.[4][2]
- Assets: No specific asset limits mentioned in program guidelines.[4]
- An adult living at the address must be personally responsible for paying heating costs, payable to landlord or fuel vendor.[2][4][5]
- Household must live in a Kansas county and be legally capable of acting on their own behalf (or applied for by guardian/conservator if incapacitated).[1]
- At least one U.S. citizen or qualified alien in household; proof required if not on other assistance.[1][5]
- No duplicate benefits from state LIEAP and tribal LIHEAP in same year; tribal members referred to tribe.[1]
- No more than one regular benefit per program year.[1]
- College students ineligible if living in dorms or away; must live at home full-time to count.[1]

**Benefits:** One-time payment for home energy costs, amount determined by household income, size, dwelling type, heating fuel type, and utility rates.[6]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: DCF Self-Service Portal at www.dcf.ks.gov (click 'Apply for Services').[2][3]
- Paper: Request from local DCF Service Center, helping agencies, or utilities.[2][5]
- In-person: Local DCF Service Centers, Evergy Wichita Connect walk-in center, or Kansas LIEAP application events (list on DCF website).[3]
- Mail: Submit to designated DCF Regional LIEAP processing office.[5]

**Timeline:** Not specified; applications processed after submission during period.[5]
**Waitlist:** Subject to available federal funding; no waitlist mentioned, but funding-limited.[4]

**Watch out for:**
- All household members' income counts, even if not on other aid like TANF (which only counts parent/child).[5]
- Must be personally responsible for heating costs; ineligible if fully included in subsidized rent.[2][5]
- College students away (dorms/apartments) don't count and are ineligible.[1]
- Application period limited (e.g., 2026: Jan 20–Mar 31); funding not guaranteed.[4]
- Separate LIEAP app required, not auto from other benefits.[5]
- No duplicates with tribal programs.[1]

**Data shape:** Income based on full household at address (not just applicants); benefit scales by income/size/fuel/dwelling; seasonal app period only; regional DCF processing

**Source:** https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households qualify if they receive TAF, SSI, or LIEAP within the last 12 months (automatic eligibility) or total gross income does not exceed 200% of Federal Poverty Level: 1: $25,760; 2: $34,840; 3: $43,920; 4: $53,000; 5: $62,080; 6: $71,160; 7: $80,240; 8: $89,320. Add $9,080 per additional person.[3][1]
- Assets: No asset limits mentioned in sources.
- Household must occupy the home; all utilities (electric, gas) must be active and present.[1]
- Home not designated for acquisition/clearance within 12 months.[1]
- Home not weatherized by federal/state/local program in past 15 years (unless damaged by fire/flood/act of God without insurance coverage for repairs).[1]
- For rentals: landlord must sign release form and agree not to raise rent for 2 years.[5][2]
- Evergy customers: account must be active (not disconnected).[5]

**Benefits:** Free comprehensive home energy audit; sealing drafts/air leaks, caulking/stripping doors/windows; insulation (ceilings/walls/floors/foundations); heating/cooling/water heater testing/cleaning/repairs; lighting/refrigerator/fan upgrades; potential furnace replacement. All at no cost.[3][7][8]
- Varies by: priority_tier

**How to apply:**
- Visit https://kshousingcorp.org/homeowners/weatherization-assistance/ to find county provider and apply.[3][7]
- Contact local provider: e.g., NCRPC (800) 432-0303 for application by mail/email.[2]
- Download Standardized Weatherization Application from https://kshousingcorp.org/wp-content/uploads/2024/06/Standardized-Weatherization-Application-2.23.26.pdf; mail/scan/email with signature.[1][2]
- Contact agency in your area via Evergy form or local offices (e.g., SCKEDD for specific counties).[5][8]

**Timeline:** Not specified; applications accepted year-round, audit and work follow approval.[3]
**Waitlist:** Not mentioned; regional variation likely due to local providers.

**Watch out for:**
- Home disqualified if weatherized in past 15 years (no repeats of prior measures even if older).[1]
- Must occupy home with active utilities; not for vacant/inactive properties.[1]
- Renters need landlord approval and no-rent-increase pledge.[5]
- Certain homes ineligible: threat of violence, health conditions aggravated by work, mold/moisture, pollutants (asbestos/radon).[1]
- Eligibility based solely on income/household criteria; no age requirement, but prioritizes vulnerable (elderly/disabled inferred via federal guidelines).[1][6]

**Data shape:** Statewide with county-specific providers; income at 200% FPL or auto-eligible via TAF/SSI/LIEAP; 15-year weatherization repeat ban; priority tiers not detailed but federal DOE structure implies elderly/disabled/children prioritized.

**Source:** https://kshousingcorp.org/homeowners/weatherization-assistance/

---

### Kansas Senior Nutrition Program (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified in program guidelines. Contact local provider for details.
- Assets: No asset limits mentioned.
- Individuals 60 years of age or older and their spouses.
- Program volunteers (for congregate services).

**Benefits:** Congregate Nutrition Services: Nutritious meals in group settings. Home-Delivered Nutrition Services: Nutritious meals delivered to residence (aligns with Meals on Wheels). Nutrition Education: Information on food, nutrition, and physical activity.
- Varies by: service_type

**How to apply:**
- Phone: 855-200-ADRC (2372) to contact local Aging and Disability Resource Center.
- Email: KDADSOAASCA@ks.gov
- Mail: Kansas Department for Aging and Disability Services, Attention: Long Term Services & Supports, 503 S. Kansas Ave., Topeka, KS 66603-3404

**Timeline:** Not specified; contact local provider.
**Waitlist:** Not mentioned.

**Watch out for:**
- No explicit income or asset tests listed, but local providers may have additional criteria—always confirm locally.
- Spouses of 60+ individuals qualify regardless of age.
- Program emphasizes reducing hunger and promoting socialization, not just meals.
- Distinguish from Kansas Senior Farmers Market Nutrition Program, which has income limits at 185% FPL and provides $50 coupons.

**Data shape:** Administered locally through Aging and Disability Resource Centers with minimal statewide eligibility restrictions; services include both congregate and home-delivered meals without fixed income tables.

**Source:** https://www.kdads.ks.gov/services-programs/aging/kansas-senior-nutrition-program

---

### Family Caregiver Support Program


**Eligibility:**
- Income: No specific income limits detailed for a statewide Family Caregiver Support Program; related programs like KanCare (Kansas Medicaid) require low-income qualification based on medical need, but exact dollar amounts or household tables not provided in sources.
- Assets: Not specified; Medicaid-linked programs typically assess income and medical need without detailed asset rules here.
- Caregiver typically 18+ years old
- Care recipient often needs nursing facility level of care or meets waiver criteria (e.g., frail elderly 65+, physical disabilities 16-64, I/DD 5+)
- Often requires Medicaid enrollment or eligibility
- Caregiver may need to live with recipient, pass background check, complete training
- For specialized programs like K-RAD: caregiver for individual with probable Alzheimer's/dementia

**Benefits:** Respite care, in-home support, personal care, homemaker services; K-RAD subsidizes up to $1,000/year per care recipient for respite (paid to provider); other waivers offer paid family caregiving hours via Medicaid but specific hours/dollars not quantified; varies by waiver/program.
- Varies by: priority_tier|region

**How to apply:**
- Phone: Kansas Aging and Disability Resource Center at 1-855-200-2372 (ADRC) or 1-866-448-3619
- Email for K-RAD example: donalds@eckaaa.org (East Central AAA)
- In-person or referral via local Area Agencies on Aging (AAA)
- Medicaid waivers via KanCare/KDADS

**Timeline:** Not specified; K-RAD processed in order received on first-come, first-served basis.
**Waitlist:** Funding limited for programs like K-RAD (no awards guaranteed); potential waitlists due to limited funds.

**Watch out for:**
- Not a single uniform program—often tied to Medicaid waivers (e.g., Frail Elderly, PD Waiver) requiring nursing facility level of care
- Funding limited/first-come first-served (e.g., K-RAD)
- Caregiver may need to be family/related, live with recipient, pass checks/training
- Medicaid eligibility mandatory for paid services
- Regional AAA differences in access/providers
- Spouses may qualify in some cases but check specifics

**Data shape:** Decentralized via 11 Area Agencies on Aging with county variations; linked to Medicaid waivers without fixed statewide income/assets; respite-focused with caps like $1,000/year in examples; no uniform hours/dollar benefits across sources

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kdads.ks.gov/services-programs/aging/caregivers

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by federal poverty guidelines (not specified in current sources for 2026; check current HHS poverty guidelines for precise figures). Priority given to veterans/qualified spouses, individuals over 65, those with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users.[2][5][7]
- Unemployed
- Poor employment prospects
- Low-income (≤125% FPL)
- U.S. citizen or eligible resident (inferred from federal program)

**Benefits:** Part-time paid community service work (average 20 hours/week at highest of federal/state/local minimum wage); on-the-job training in nonprofits/public facilities (e.g., schools, hospitals, senior centers); skill development (e.g., computer/digital literacy, vocational skills); job placement assistance to unsubsidized employment; supportive services (e.g., dental, vision, clothing, transportation).[2][3][4][6]
- Varies by: priority_tier

**How to apply:**
- Phone: 316-771-6750 (Kansas SCSEP team)
- Contact SER Jobs For Progress (provider in Kansas via Kansas WorkforceONE)
- Contact AARP Foundation SCSEP or local grantees for intake
- American Job Centers for employment assistance


**Watch out for:**
- Income limit strictly ≤125% FPL (not just 'low-income'); program is temporary training bridge to unsubsidized jobs, not permanent employment; priority tiers may cause delays for non-priority applicants; no asset test but poor employment prospects required; supportive services vary by grantee; must be unemployed to enroll.[2][5][7]

**Data shape:** Federally standardized (age 55+, ≤125% FPL, unemployed) but administered by grantees (e.g., SER in Kansas); benefits fixed at ~20 hours/week minimum wage; priority tiers affect access; no fixed income table or asset limits in sources—use annual federal poverty guidelines

**Source:** https://workforce-ks.com/programs/seniorcommunityserviceemploymentprogram/

---

### Legal Assistance for Older Kansans


**Eligibility:**
- Age: 60+
- Income: No specific income limits stated in sources; services prioritize older individuals with economic or social needs, low-income preferred. Medicare Extra Help example (not core program): $14,610 single/$29,160 married (excludes home, vehicles, etc.)[5].
- Assets: No program-wide asset limits; Medicare Extra Help reference excludes home, vehicles, personal possessions, life insurance, burial plots/contracts, back payments[5].
- Kansas resident
- Civil legal issues only (e.g., housing, public benefits, consumer, elder/family law)
- Economic or social needs prioritized[4]

**Benefits:** Free legal advice, counseling, referrals, limited representation; covers housing/eviction/foreclosure, public benefits (SSI/Medicaid/Medicare/VA), consumer fraud/debt/bankruptcy, elder law (wills, long-term care rights), family law (divorce/protection orders), guardianship; volunteer attorneys provide advice (no drafting/representation via hotline)[3][4][6][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Kansas Elder Law Hotline 1-888-353-5337 (toll-free) or 316-267-3975 (8am-4:30pm M-F)[3][6][8]
- Online application via operator on hotline call[6]
- Kansas Legal Services general intake (implied for full services)[5]

**Timeline:** Not specified

**Watch out for:**
- Hotline offers advice/referrals only—no drafting documents or court representation[6]
- Volunteer attorneys; may not cover all law areas—seek further referral if needed[6]
- Income guidelines may apply for full representation (not detailed); prioritizes greatest need[4][8]
- Availability varies by location/provider[2]

**Data shape:** No fixed income/asset tables; priority-based on need; hotline centralized but services via regional OAA providers; advice-only vs. full representation distinction

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kdads.ks.gov/services-programs/aging/older-americans-act

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| KanCare Medicare Savings Programs (QMB,  | benefit | federal | deep |
| SNAP (Food Assistance) | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Kansas Senior Nutrition Program (Meals o | benefit | federal | medium |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Older Kansans | resource | state | simple |

**Types:** {"benefit":6,"employment":1,"resource":1}
**Scopes:** {"federal":6,"state":2}
**Complexity:** {"deep":6,"medium":1,"simple":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/KS/drafts.json`.

- **KanCare Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 4 content sections, 6 FAQs
- **SNAP (Food Assistance)** (benefit) — 4 content sections, 6 FAQs
- **LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **service_type**: 1 programs
- **priority_tier|region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **KanCare Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB lowest, QI highest) tied to FPL %; household size limited to individual/couple (no larger tables); assets exempt key items; statewide but local aging agencies help; annual FPL/asset updates with $20 income disregard in KS.
- **SNAP (Food Assistance)**: No gross income limit or asset test for elderly/disabled households; benefits/deductions scale heavily by household size and senior-specific expenses (medical/shelter); statewide uniform rules via local DCF.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: Income based on full household at address (not just applicants); benefit scales by income/size/fuel/dwelling; seasonal app period only; regional DCF processing
- **Weatherization Assistance Program (WAP)**: Statewide with county-specific providers; income at 200% FPL or auto-eligible via TAF/SSI/LIEAP; 15-year weatherization repeat ban; priority tiers not detailed but federal DOE structure implies elderly/disabled/children prioritized.
- **Kansas Senior Nutrition Program (Meals on Wheels)**: Administered locally through Aging and Disability Resource Centers with minimal statewide eligibility restrictions; services include both congregate and home-delivered meals without fixed income tables.
- **Family Caregiver Support Program**: Decentralized via 11 Area Agencies on Aging with county variations; linked to Medicaid waivers without fixed statewide income/assets; respite-focused with caps like $1,000/year in examples; no uniform hours/dollar benefits across sources
- **Senior Community Service Employment Program (SCSEP)**: Federally standardized (age 55+, ≤125% FPL, unemployed) but administered by grantees (e.g., SER in Kansas); benefits fixed at ~20 hours/week minimum wage; priority tiers affect access; no fixed income table or asset limits in sources—use annual federal poverty guidelines
- **Legal Assistance for Older Kansans**: No fixed income/asset tables; priority-based on need; hotline centralized but services via regional OAA providers; advice-only vs. full representation distinction

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Kansas?
