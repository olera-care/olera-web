# North Dakota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 1.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 14 |
| New (not in our data) | 9 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 5 programs
- **in_kind**: 4 programs
- **financial**: 2 programs
- **financial|service**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (MSP)

- **income_limit**: Ours says `$1300` → Source says `$1,781` ([source](https://www.hhs.nd.gov/medicaid (North Dakota Health & Human Services); https://www.insurance.nd.gov/consumers/medicare/medicare-financial-assistance-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Pays Medicare Part B premiums (all tiers); QMB also covers Part A/B deductibles, coinsurance; SLMB/QI1: Part B premium only; may include Part D premium help and automatic Extra Help for drugs (no more than $12.65 per drug in 2026 for SLMB). QMB/SLMB eligible for other Medicaid benefits; QI1 not combinable with full Medicaid.[3][2][5][7]` ([source](https://www.hhs.nd.gov/medicaid (North Dakota Health & Human Services); https://www.insurance.nd.gov/consumers/medicare/medicare-financial-assistance-programs))
- **source_url**: Ours says `MISSING` → Source says `https://www.hhs.nd.gov/medicaid (North Dakota Health & Human Services); https://www.insurance.nd.gov/consumers/medicare/medicare-financial-assistance-programs`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `No minimum age requirement for the household, but seniors (60+) receive special eligibility rules` ([source](https://www.hhs.nd.gov/applyforhelp/snap and https://www.fns.usda.gov/snap/eligibility/elderly-disabled-special-rules))
- **income_limit**: Ours says `$1984` → Source says `$1,575` ([source](https://www.hhs.nd.gov/applyforhelp/snap and https://www.fns.usda.gov/snap/eligibility/elderly-disabled-special-rules))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Food assistance provided via EBT card (electronic benefits transfer). Benefit amount varies by household size and income. Example: A 2-person elderly/disabled household with $1,200 gross monthly income ($1,000 Social Security + $200 pension) would receive approximately $415/month in SNAP benefits after deductions.[2]` ([source](https://www.hhs.nd.gov/applyforhelp/snap and https://www.fns.usda.gov/snap/eligibility/elderly-disabled-special-rules))
- **source_url**: Ours says `MISSING` → Source says `https://www.hhs.nd.gov/applyforhelp/snap and https://www.fns.usda.gov/snap/eligibility/elderly-disabled-special-rules`

### LIHEAP (Low Income Home Energy Assistance Program)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `LIHEAP covers a portion of heating and cooling costs for natural gas, electricity, propane, fuel oil, coal, wood, or other fuel sources[3]. Also covers: weatherization services (insulation, weather stripping), furnace cleaning/repair/replacement, chimney cleaning/inspection, and emergency assistance[3]. Specific dollar amounts vary by household income, household size, and fuel type used[2]; maximum benefit amounts are calculated individually but exact figures not provided in search results.` ([source](https://www.hhs.nd.gov/applyforhelp/liheap))
- **source_url**: Ours says `MISSING` → Source says `https://www.hhs.nd.gov/applyforhelp/liheap`

### Family Caregiver Support Program / Lifespan Respite Care

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Family Paid Caregiver Pilot: Payments to family caregivers for extraordinary care (specific rates not detailed). SPED (related non-Medicaid): Up to $48/day payments + respite up to $1,142/month to enrolled family caregivers living with recipient.[5]` ([source](https://www.hhs.nd.gov/individuals-disabilities/family-paid-caregiver-pilot-program[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.hhs.nd.gov/individuals-disabilities/family-paid-caregiver-pilot-program[4]`

### Long-Term Care Ombudsman Services

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free and confidential services including: education on resident rights, service options, and regulations; support to resolve complaints on quality of care/services, quality of life, rights violations, access to services, transfer/discharge/eviction; promotion of resident/family/community involvement; identification of systems issues and advocacy for change.` ([source](https://www.hhs.nd.gov/sites/www/files/documents/New%20LTCOP%20Brochure%202023%20v4%20(1).pdf))
- **source_url**: Ours says `MISSING` → Source says `https://www.hhs.nd.gov/sites/www/files/documents/New%20LTCOP%20Brochure%202023%20v4%20(1).pdf`

## New Programs (Not in Our Data)

- **North Dakota Home and Community Based Services (HCBS) Waiver** — service ([source](https://www.hhs.nd.gov/healthcare/medicaid/medicaid-waivers))
  - Shape notes: Services via individualized care plan based on needs; tiered by aged/disabled categories (65+ vs 18-64); statewide but centrally administered; participant caps create waitlists; excludes IDD/mental illness (separate waivers)
- **Program of All-Inclusive Care for the Elderly (PACE)** — in_kind ([source](https://www.hhs.nd.gov/healthcare/medicaid/pace))
  - Shape notes: PACE in North Dakota is geographically restricted to specific service areas (currently Bismarck, Dickinson, Minot, Fargo via Northland PACE). The program has no income or asset limits for enrollment, but most participants rely on Medicaid, which does have financial limits. Benefits are fixed and comprehensive (all-inclusive) rather than tiered. The program is designed for individuals already certified as needing nursing home-level care but able to remain in the community. Processing timelines, waitlist specifics, and application procedures are not detailed in publicly available sources.
- **Weatherization Assistance Program** — service ([source](https://www.commerce.nd.gov/community-services/low-income-programs/weatherization-assistance))
  - Shape notes: Administered statewide via 8 regional CAP agencies; automatic eligibility for LIHEAP; 200% FPL income table scales by household size; one-time service rule with 15-year reweatherization exception.
- **Older Adult Nutrition Program** — service ([source](No single primary .gov URL identified; see https://ndseniorservices.org/Feeding%20Grandma.pdf (ND Senior Service Providers) and local HHS or Aging offices[1]))
  - Shape notes: No income/asset test; priority-based targeting; locally administered with homebound criteria for delivery; open to spouses/under 60 in limited cases; rural focus[1][3]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.hhs.nd.gov/vr/scsep))
  - Shape notes: County-restricted to 12-14 specific counties; income table scales by household size; priority enrollment tiers; grant-funded with limited slots via state VR provider.
- **Service Payments for Elderly and Disabled (SPED)** — service ([source](https://www.nd.gov/dhs/policymanuals/52505/Content/525_05_25_20.htm))
  - Shape notes: Two-tier structure: SPED (non-Medicaid) and Expanded SPED (SSI-level income + Medicaid-eligible); sliding scale by income/assets; rural travel enhancements; pool-based prioritization.
- **North Dakota Aging in Community (AIC) Project** — service ([source](https://www.ndsu.edu/agriculture/extension/programs/aging-community-program[8]))
  - Shape notes: Community-based pilot model limited to select rural counties; no income/asset tests or fixed benefits; relies on local volunteers and needs assessment rather than statewide bureaucracy
- **Senior Safety Program (ND Assistive)** — in_kind ([source](https://ndassistive.org/our-programs/[1]))
  - Shape notes: No income or asset test; fixed in-kind safety devices statewide from single Fargo-based provider; age 60+ with residency and non-nursing facility restriction
- **Basic Care Assistance Program (BCAP)** — financial ([source](https://www.nd.gov/dhs/policymanuals/40029/PDF_of_Manual/ML3906%20SC%20400-29%20BCAP%20FULL.pdf))
  - Shape notes: Restricted to licensed Basic Care Facility residents; uses Medicaid financial framework without published BCAP-specific income/asset tables; county-administered assessments; no standalone dollar caps, ties to room/board costs

## Program Details

### North Dakota Home and Community Based Services (HCBS) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 18-64 with physical disability+
- Income: Must be Medicaid eligible as aged, blind, disabled, working individuals with disabilities who buy into Medicaid, or medically needy. Specific dollar amounts not listed in sources; follows standard Medicaid financial criteria which may include SSI-related limits (e.g., ~$943/month for individual in 2023, subject to annual updates). No household size table provided.
- Assets: Not specified in sources; follows standard Medicaid asset rules for aged/disabled (typically $2,000 for individual, with exemptions for primary home, one vehicle, personal belongings, burial funds). What counts: cash, bank accounts, investments. Exempt: primary residence (if intent to return), household goods.
- Nursing facility level of care
- Physically disabled per Social Security Disability criteria (includes brain injury, dementia; excludes mental illness or intellectual disability as primary cause)
- Able to direct own care
- Living in own home or apartment
- Medicaid recipient
- Functional impairment not resulting from mental illness or intellectual disability
- Need at least one monthly waiver service

**Benefits:** Adult Day Care/Health, Adult Foster Care, Adult Residential Care (for memory loss/brain injuries), Case Management, Chore Services, Community Support, Community Transition Services, Companionship, Emergency Response Systems, Extended Personal Care (skilled/nursing), Family Personal Care (pays live-in family including spouses/adult children), Home Delivered Meals, Home Modifications (ramps, grab bars), Homemaker (cleaning, meals, laundry), Residential Habilitation, Respite Care (in/out-of-home), Specialized Equipment/Supplies/Assistive Technology, Supervision, Supported Employment, Transitional Living (independent skills training), Non-Medical Transportation, Waiver Personal Care (hands-on assistance/cueing). Services determined by individualized care plan; no fixed dollar amounts or hours specified.
- Varies by: priority_tier

**How to apply:**
- Phone: Aging and Disability Resource-LINK toll free 1-855-462-5465
- Phone: Developmental Disabilities (701) 328-8930 or toll free (800) 755-8529
- Email: carechoice@nd.gov or dhsddreq@nd.gov
- In-person: Aging Services, 1237 W. Divide Ave., Suite 6, Bismarck, ND 58501; Developmental Disabilities, 1237 W. Divide Ave., Suite 1A, Bismarck, ND 58501
- Website: https://www.hhs.nd.gov/healthcare/medicaid/medicaid-waivers (waiver info and PDFs)

**Timeline:** Not specified
**Waitlist:** Possible due to participant limits (not detailed; waivers cap enrollment)

**Watch out for:**
- Excludes mental illness or intellectual disability as primary impairment (use separate DD waiver)
- Must meet nursing facility level of care and direct own care
- Enrollment capped (waitlists likely)
- Effective Jan. 1, 2026 (current version); check for updates
- Family caregivers can be paid, but only if live-in and providing personal care
- Not automatic Medicaid eligibility; must qualify financially first

**Data shape:** Services via individualized care plan based on needs; tiered by aged/disabled categories (65+ vs 18-64); statewide but centrally administered; participant caps create waitlists; excludes IDD/mental illness (separate waivers)

**Source:** https://www.hhs.nd.gov/healthcare/medicaid/medicaid-waivers

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for PACE eligibility itself[3]. However, Medicaid eligibility (which most participants use) typically requires income under 300% of the Federal Benefit Rate (~$2,901/month as of 2025)[6]. North Dakota Medicaid long-term care eligibility requires income limits, but PACE enrollment does not require Medicaid pre-enrollment[3]. If you have Medicare only and transition to nursing home care long-term, you may face $4,000-$5,000/month premiums[2].
- Assets: No asset limits specified for PACE enrollment itself[3]. Medicaid eligibility (if pursuing that route) typically requires assets ≤$2,000 (excluding primary home)[6]. PACE is not tied to asset verification for enrollment[3].
- Must be certified by the state of North Dakota as meeting nursing home level of care (extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, eating)[6]
- Must be able to live safely in the community with PACE support at time of enrollment[3][4]
- Must live within a PACE service area in North Dakota[3][4]
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice services[3]
- Must be U.S. citizen or legal resident for 5 years prior to application (if Medicare-eligible)[6]

**Benefits:** Comprehensive all-inclusive care with no co-pays, deductibles, or coverage gaps for approved services[1]. Services include: primary and specialty medical care, prescription medications, physical/occupational/speech therapy, transportation to PACE center and medical appointments, home care and personal assistance, hospital care, and nursing home care when needed[1]. PACE is intended as a lifetime program covering assisted living, basic care facility, or nursing home placement if needed[4].

**How to apply:**
- Contact North Dakota Health and Human Services (HHS) Medicaid office
- Contact a PACE program directly in your service area (Northland PACE operates in Bismarck, Dickinson, Minot, and Fargo)[1]
- Call Medicare at 1-800-633-4227 for referral[2]
- Contact your state Medicaid office[2]

**Timeline:** Not specified in available sources
**Waitlist:** Nearby PACE programs may have waitlists for enrollment[2]. No specific North Dakota waitlist data provided.

**Watch out for:**
- Geographic availability is the primary barrier — if you don't live in a PACE service area, you cannot enroll, regardless of other qualifications[2]
- You cannot be enrolled in Medicare Advantage (Part C) or Medicare prescription drug plans to join PACE[3] — this may require disenrolling from existing coverage
- If you have Medicare only (not Medicaid) and later need long-term nursing home care, you could face $4,000-$5,000/month premiums to cover Medicaid long-term care benefits[2]
- PACE is voluntary enrollment but intended as a lifetime program — you can disenroll at any time for any reason, but re-enrollment may not be guaranteed[4]
- Average PACE participant is 76 years old with multiple complex medical conditions; approximately 90% are dually eligible for Medicare and Medicaid, and almost half have dementia[2] — this is not a program for mildly frail seniors
- You must receive care from healthcare professionals and caregivers selected by your PACE program — you cannot choose your own providers[2]
- No income test for PACE enrollment itself, but Medicaid eligibility (which covers most participants) has income limits that vary by state and household composition

**Data shape:** PACE in North Dakota is geographically restricted to specific service areas (currently Bismarck, Dickinson, Minot, Fargo via Northland PACE). The program has no income or asset limits for enrollment, but most participants rely on Medicaid, which does have financial limits. Benefits are fixed and comprehensive (all-inclusive) rather than tiered. The program is designed for individuals already certified as needing nursing home-level care but able to remain in the community. Processing timelines, waitlist specifics, and application procedures are not detailed in publicly available sources.

**Source:** https://www.hhs.nd.gov/healthcare/medicaid/pace

---

### Medicare Savings Programs (MSP)


**Eligibility:**
- Income: MSPs in North Dakota have four tiers with income limits tied to the Federal Poverty Level (FPL), typically up to 135% FPL, though exact dollar amounts vary annually. Recent figures include: Single monthly income under $1,781 or couple $2,400 for premiums and cost-sharing (likely QMB/SLMB); older data shows single $1,641, $1,009, or $940, couple $1,267. QMB: ≤100% FPL; SLMB: 100-120% FPL; QI1: 120-135% FPL. Must be entitled to Medicare Parts A and B. Limits may be higher than federal baselines in ND.[2][3][1][4]
- Assets: Countable assets cannot exceed full low-income subsidy resource levels (e.g., single $9,660, couple $14,470; or single $17,600/$3,000, couple $35,130/$6,000 in varying reports). Assets include savings, checking, stocks, bonds, mutual funds, retirement accounts, real estate (non-primary). Exemptions not detailed in sources, but federal rules often exclude primary home, one car, household goods. Varies by tier and year.[2][1][4][3]
- Entitled to Medicare Parts A and B
- North Dakota resident
- U.S. citizen or qualified immigrant
- Limited income and resources

**Benefits:** Pays Medicare Part B premiums (all tiers); QMB also covers Part A/B deductibles, coinsurance; SLMB/QI1: Part B premium only; may include Part D premium help and automatic Extra Help for drugs (no more than $12.65 per drug in 2026 for SLMB). QMB/SLMB eligible for other Medicaid benefits; QI1 not combinable with full Medicaid.[3][2][5][7]
- Varies by: priority_tier

**How to apply:**
- Contact county social services office (find via North Dakota Department of Health & Human Services website)
- Phone: 1-800-472-2622 (general Medicaid line, inferred from state HHS)
- Online: North Dakota Medicaid application portal (dhhs.nd.gov/apply)
- Mail or in-person at county offices

**Timeline:** Not specified in sources

**Watch out for:**
- Multiple tiers (QMB, SLMB, QI1) with different income brackets and benefits—state determines which you qualify for upon application
- QI1 cannot combine with full ND Medicaid
- Must have both Medicare Parts A and B; apply even if slightly over federal limits as ND may have higher thresholds
- Assets include retirement accounts and non-primary real estate—often overlooked
- Automatic Extra Help for Part D with most MSPs, but confirm enrollment
- Income/asset limits change yearly; 2026 figures may differ from cited 2023 data
- Apply through county offices, not SSA directly for MSP (SSI/Extra Help separate)

**Data shape:** Tiered by income relative to FPL (QMB ≤100%, SLMB 100-120%, QI1 120-135%); asset limits match LIS levels; county-administered statewide with potential local processing variations; benefits scale by tier, not household size beyond couple/single

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.nd.gov/medicaid (North Dakota Health & Human Services); https://www.insurance.nd.gov/consumers/medicare/medicare-financial-assistance-programs

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: No minimum age requirement for the household, but seniors (60+) receive special eligibility rules+
- Income: For elderly or disabled household members (60+), only the net income limit applies. For Oct. 1, 2025 through Sept. 30, 2026: $1,575/month for 1 person, $2,048/month for 2 people (these are net income limits after deductions). Households without elderly or disabled members must meet both gross income (130% of federal poverty level) and net income tests. Social Security, veterans' benefits, and disability payments all count toward total income.[1][2]
- Assets: Households with an elderly or disabled member: up to $4,500 in countable assets. Other households: up to $3,000. Assets that do NOT count include: the value of your house if you own it, retirement savings, cash value of life insurance policies, income-producing property, and household goods. Some states like California have no asset test unless income exceeds the federal poverty line.[1][5]
- Must apply in the state where you currently live (North Dakota)[6]
- Household members must live together, buy food, and prepare meals together[7]
- Elderly (60+) and disabled people count as household members only if you buy/make food for them or buy/make food together; if they live with you but buy/make food separately, they do not count[4]
- Work requirements do not apply to seniors[6]

**Benefits:** Food assistance provided via EBT card (electronic benefits transfer). Benefit amount varies by household size and income. Example: A 2-person elderly/disabled household with $1,200 gross monthly income ($1,000 Social Security + $200 pension) would receive approximately $415/month in SNAP benefits after deductions.[2]
- Varies by: household_size

**How to apply:**
- Phone: 1-866-614-6005 (Customer Support Center)[7]
- Email: applyforhelp@nd.gov[7]
- In-person: Local Human Service Zone office[7]
- Mail: Contact local Human Service Zone for mailing address[7]
- Online: Visit hhs.nd.gov/applyforhelp/snap (specific URL not provided in search results, but referenced as available)[7]

**Timeline:** Not specified in available search results
**Waitlist:** Not specified in available search results

**Watch out for:**
- Only about 30% of eligible elderly people in North Dakota received SNAP in 2018, suggesting significant underutilization—many eligible seniors don't apply[8]
- Seniors (60+) have a major advantage: they only need to meet the net income test, not the gross income test, making qualification easier than for younger households[1][6]
- Household composition matters critically: elderly or disabled people living with you only count as household members if you buy/prepare food together; if they buy/prepare food separately, they're excluded from the calculation[4]
- Starting November 2025, some people's SNAP eligibility will change—families should verify current status on the 'Stay Enrolled' webpage[7]
- The One Big Beautiful Bill Act of 2025 changed certain SNAP eligibility factors including work requirements and non-citizen eligibility—verify current rules[2]
- Medical expenses over $35/month for elderly/disabled households can be deducted, reducing countable income and potentially increasing benefits[5]
- About 4.8 million seniors nationally receive SNAP, but that's only about half of all eligible seniors, indicating widespread underutilization[1]

**Data shape:** SNAP for elderly/disabled households (60+) operates under fundamentally different rules than standard SNAP: they only need to meet net income limits (not gross income limits), have higher asset limits ($4,500 vs. $3,000), and are exempt from work requirements. This creates a simpler pathway to eligibility for seniors. Benefits scale by household size and are calculated after specific deductions (20% of earned income, standard deduction by household size, medical expenses over $35/month). The program is administered statewide through local Human Service Zones but has significant underutilization among eligible seniors.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.nd.gov/applyforhelp/snap and https://www.fns.usda.gov/snap/eligibility/elderly-disabled-special-rules

---

### LIHEAP (Low Income Home Energy Assistance Program)


**Eligibility:**
- Income: Household income must be at or below 60 percent of North Dakota's median income[1][4]. Specific dollar amounts by household size are referenced but not provided in available search results; families must check hhs.nd.gov/liheap for current 2025-2026 income limit tables[1][5]. All persons living in the household are counted toward total adjusted income[5].
- Assets: There is no asset limit for LIHEAP in North Dakota[2].
- Applicant must ordinarily reside in North Dakota[6]
- For tribal LIHEAP (MHA Nation program): head of household must be a member of Three Affiliated Tribes or other Federal Recognized Tribe and reside on or within 12-mile radius of Fort Berthold Indian Reservation (FBIR); if outside 12-mile radius, must apply to state program[4]
- Household must have a heating or cooling need (utility bill required)[1]

**Benefits:** LIHEAP covers a portion of heating and cooling costs for natural gas, electricity, propane, fuel oil, coal, wood, or other fuel sources[3]. Also covers: weatherization services (insulation, weather stripping), furnace cleaning/repair/replacement, chimney cleaning/inspection, and emergency assistance[3]. Specific dollar amounts vary by household income, household size, and fuel type used[2]; maximum benefit amounts are calculated individually but exact figures not provided in search results.
- Varies by: household_size, fuel_type, income_level

**How to apply:**
- Online via Self-Service Portal (SSP): Create North Dakota login, link case to login[1]
- Phone: Community Options at 800-823-2417 for application help[1]
- Mail: Print application and mail to Customer Support Center or local Human Service Zone office[1]
- In-person: Submit completed application at local Human Service Zone office or Customer Support Center[1]
- In-home assistance: Community Options outreach workers can meet you at home to help gather documents and complete application[3]

**Timeline:** Notice of Eligibility sent within 45 days of application receipt; all verifications must be returned within 30 days from receipt of application[6]
**Waitlist:** No formal waitlist described, but funding is limited and distributed until money runs out; not all eligible households receive assistance, so applying early when application period opens is critical[2]

**Watch out for:**
- Funding is limited and distributed until money runs out—not all eligible households receive assistance[2]. Apply as early as possible when application period opens.
- Program moved to year-round eligibility model, meaning if currently approved, you do NOT need to reapply; however, if unsure of status, confirm via Self-Service Portal[1].
- Heating assistance typically available fall/winter (October 1 – May 31); cooling assistance typically summer; crisis assistance available year-round for emergencies[2][5].
- Household definition includes all persons at your address, even roommates not sharing most expenses if covered by same utility bill[2].
- Income limits are based on 60% of North Dakota's median income, which changes annually; families must verify current dollar amounts at hhs.nd.gov/liheap rather than relying on prior-year figures[1][4].
- LIHEAP can be backdated to October (start of heating season) if applying later in season; provide all household income from October onward[3].
- Allowable expense deductions (childcare, child support, medical expenses, 27% earned income deduction) reduce countable income and may affect eligibility[5].
- If no open LIHEAP case exists, must apply and be approved for heating/emergency assistance before contacting local CAPND agency for cooling assistance[1].
- You have right to appeal and request fair hearing if denied or if you don't receive written notice within 45 days[6].

**Data shape:** Benefits scale by household income, household size, and fuel type; no fixed benefit amount. Program operates on fixed annual state funding with first-come, first-served distribution. Eligibility is year-round under new model, but application periods vary by assistance type (heating Oct-May, cooling summer, crisis year-round). Income limits tied to state median income percentage rather than fixed dollar amounts. No asset limit creates broader eligibility than many assistance programs. Tribal and state programs operate in parallel with different eligibility criteria for reservation areas.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.nd.gov/applyforhelp/liheap

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income cannot exceed 200% of the federal poverty level. 2024 Guidelines: 1: $30,120; 2: $40,880; 3: $51,640; 4: $62,400; 5: $73,160; 6: $83,920; 7: $94,680; 8: $105,440; each additional: +$10,760.[1]
- Assets: No asset limits mentioned in program guidelines.[1][2][3]
- LIHEAP clients are automatically eligible.[1][2]
- Households may receive services only once unless weatherized more than 15 years ago.[1]
- Applies to owners or renters in single-family homes, mobile homes, or apartments.[2][4]

**Benefits:** Energy efficiency improvements including insulation, caulking, weather-stripping, furnace and moisture repairs, addressing health/safety issues like air infiltration and heat loss; determined by professional home energy assessment; no specific dollar amounts or hours stated; repairs only if they support weatherization measures with SIR over 1 (no general rehab, cosmetics, or low-payback like mobile home skirting).[1][2][4]
- Varies by: priority_tier

**How to apply:**
- Online: Complete questions at https://www.commerce.nd.gov/community-services/low-income-programs/weatherization-assistance (forwards to regional Community Action Agency).[1]
- Phone: State Weatherization Program Manager Alyssa Kroshus at (701) 328-5341; or regional CAP offices (e.g., Region I: 701-572-8191).[1]
- Regional CAP agencies handle intake (see geography.offices_or_providers).[1]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; funds allocated to CAP agencies based on availability, continuation contingent on federal funding and performance.[3]

**Watch out for:**
- Services limited to one-time per household unless >15 years since prior weatherization; no general home repairs, cosmetics, or low-SIR measures.[1]
- Must contact regional CAP after state application; eligibility uses DOE or LIHEAP criteria interchangeably.[1][3]
- Income based on 200% FPL (higher than some programs' 60% state median, e.g., certain rehab).[1][5]
- Priority for LIHEAP clients; funded by DOE/LIHEAP with potential funding limits.[3]

**Data shape:** Administered statewide via 8 regional CAP agencies; automatic eligibility for LIHEAP; 200% FPL income table scales by household size; one-time service rule with 15-year reweatherization exception.

**Source:** https://www.commerce.nd.gov/community-services/low-income-programs/weatherization-assistance

---

### Older Adult Nutrition Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No means test or specific income limits; services targeted to those with greatest economic need but open to all 60+ regardless of income[1].
- Assets: No asset limits or tests mentioned[1].
- Priority to rural residents, greatest economic/social need, severe disabilities, limited English proficiency[1]
- Spouses of any age eligible[1][3]
- Disabled persons under 60 residing in congregate sites or with eligible participants, only if it does not deprive 60+ participants[1][3]
- Home-delivered meals require homebound status due to physical incapacity, mental/social conditions, isolation, limited mobility, or remote location[3]

**Benefits:** Congregate meals in social/group settings; home-delivered meals for homebound seniors; each meal provides at least 1/3 of recommended dietary allowances per Dietary Guidelines for Americans and Dietary Reference Intakes; voluntary contributions requested but no one denied for inability to pay[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Provider or Area Agency on Aging; regional variations apply (e.g., Morton County Council on Aging for local sites)[3]
- No statewide phone or URL specified in sources; eligibility determined locally (e.g., Nutrition Coordinator at Morton County Council on Aging)[3]

**Timeline:** Not specified; annual redetermination for home-delivered meals[3]
**Waitlist:** Not mentioned; meals for under 60 only if no deprivation of 60+ slots, implying potential capacity limits[3]

**Watch out for:**
- No income test but priority to highest need, so low-income/rural may get served first[1]
- Under 60 eligibility very limited and secondary to 60+ participants[1][3]
- Home-delivered requires proof of homebound status, not just age[3]
- Voluntary contributions expected but not mandatory[1][3]
- Often confused with SNAP or CSFP which have strict income limits[2][7]

**Data shape:** No income/asset test; priority-based targeting; locally administered with homebound criteria for delivery; open to spouses/under 60 in limited cases; rural focus[1][3]

**Source:** No single primary .gov URL identified; see https://ndseniorservices.org/Feeding%20Grandma.pdf (ND Senior Service Providers) and local HHS or Aging offices[1]

---

### Family Caregiver Support Program / Lifespan Respite Care


**Eligibility:**
- Income: No income limits specified for Family Paid Caregiver Pilot Program (requires Medicaid 1915(c) waiver enrollment). For related SPED program (non-Medicaid), sliding scale based on countable income by family size and liquid assets under $50,000 (specific table not detailed; home value exempt).[5]
- Assets: SPED: Liquid assets < $50,000 (home exempt). No asset limits mentioned for Family Paid Caregiver Pilot.[5]
- Care recipient enrolled in specific Medicaid 1915(c) waivers: ASD Birth-17, Medically Fragile, Children’s Hospice, Traditional IID/DD.[1][4]
- Care must meet 'extraordinary care' standard (beyond typical tasks, significant medical/behavioral needs).[1][4]
- Caregiver is legally responsible individual (parent, guardian, custodian, spouse) living with or providing daily care.[1][4]
- No duplication of other Medicaid services.[1]

**Benefits:** Family Paid Caregiver Pilot: Payments to family caregivers for extraordinary care (specific rates not detailed). SPED (related non-Medicaid): Up to $48/day payments + respite up to $1,142/month to enrolled family caregivers living with recipient.[5]
- Varies by: program_type|medicaid_waiver

**How to apply:**
- Online: Family Paid Caregiver Portal at https://familycaregiver.hhs.nd.gov/ (create account, add caregiver/recipient info, submit application).[4]
- Email contact: familycaregiver@nd.gov[4]

**Timeline:** Applications processed in order received; post-submission review and assessment by HHS team (timeline not specified).[4]
**Waitlist:** Processed in order received (implies potential wait based on volume).[4]

**Watch out for:**
- Must meet strict 'extraordinary care' definition; typical household tasks don't qualify.[1][4]
- Caregiver must be 'legally responsible individual' (e.g., not all relatives).[1][4]
- Requires Medicaid waiver enrollment first (not standalone).[1][4]
- Background check and assessment mandatory post-application.[4][6]
- SPED is separate non-Medicaid program with asset test; don't confuse with Medicaid pilot.[5]

**Data shape:** Tied to specific Medicaid 1915(c) waivers with 'extraordinary care' test; two tracks (Medicaid pilot vs. SPED non-Medicaid); online portal only for pilot; no fixed hours/dollar rates detailed beyond SPED max

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.nd.gov/individuals-disabilities/family-paid-caregiver-pilot-program[4]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income must not exceed 125% of federal poverty level. North Dakota specific maximum annual income levels (before taxes): Household of 1: $19,563; Household of 2: $24,638; Household of 3: $33,313; Household of 4: $40,188. Levels increase for larger households.[3]
- Assets: No asset limits mentioned in available sources.
- Unemployed
- Have barriers to employment (e.g., low employment prospects)
- Priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, or those who failed to find employment via American Job Centers.[1][2][4]

**Benefits:** Part-time community service work training (average 20 hours/week) at non-profit/public sites (e.g., childcare centers, schools, hospitals, senior centers); paid highest of federal/state/local minimum wage; on-the-job training; annual physical examinations; job-related counseling; assistance to transition to unsubsidized employment.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Phone or contact: North Dakota HHS Vocational Rehabilitation at https://www.hhs.nd.gov/vr/scsep (specific phone not listed; statewide Job Service ND resources at https://www.jobsnd.com/job-seeker/resources-assistance); national SCSEP help line: 1-877-872-5627 (1-877-US2-JOBS); CareerOneStop Older Worker Program Finder.[1][2][3]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; potential due to limited slots as grant-funded program.

**Watch out for:**
- Not statewide—only select counties, excluding many rural areas outside listed 12-14; income based on household size at 125% poverty level (use current HHS guidelines as listed figures may update annually); must be unemployed and seeking training bridge to private employment, not full-time jobs directly; priority tiers may create wait times; no asset test but barriers to employment required.[1][2][3]

**Data shape:** County-restricted to 12-14 specific counties; income table scales by household size; priority enrollment tiers; grant-funded with limited slots via state VR provider.

**Source:** https://www.hhs.nd.gov/vr/scsep

---

### Long-Term Care Ombudsman Services


**Eligibility:**
- Income: No income limits; services are free and available to all qualifying residents regardless of financial status.
- Assets: No asset limits or tests apply.
- Must reside in a participating long-term care facility in North Dakota, including basic care facility, nursing home, assisted living facility, or swing bed hospital.

**Benefits:** Free and confidential services including: education on resident rights, service options, and regulations; support to resolve complaints on quality of care/services, quality of life, rights violations, access to services, transfer/discharge/eviction; promotion of resident/family/community involvement; identification of systems issues and advocacy for change.

**How to apply:**
- Phone: Toll-free 1.855.462.5465 option 3 or 701.328.4617 (TTY: 711)
- Mail/In-person: State Long-Term Care Ombudsman, Adult and Aging Services, 1237 W. Divide Ave., Ste 6, Bismarck, ND 58501
- Referrals accepted from residents, families/friends, community members, facility staff, agencies/providers—no formal application form required

**Timeline:** No formal processing; ombudsman responds to concerns as submitted, typically through visits and advocacy.

**Watch out for:**
- Services are for current residents of qualifying facilities only—not for admission assistance or non-residents; requires resident consent for active advocacy; not a regulatory or enforcement body but an independent advocate partnering with residents to resolve issues; anyone can refer a concern, but ombudsman verifies it exists before proceeding.

**Data shape:** no income/asset/age test; open to all residents in specified facility types statewide; advocacy-based rather than financial or direct service provision; consent-driven and resident-directed

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.nd.gov/sites/www/files/documents/New%20LTCOP%20Brochure%202023%20v4%20(1).pdf

---

### Service Payments for Elderly and Disabled (SPED)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Monthly income and assets must fall below state limits (exact dollar amounts vary by household size; use SFN 820 SPED Income and Asset form for determination). For Expanded SPED, income cannot exceed SSI level if not receiving SSI. Sliding scale based on countable income and family size.
- Assets: Liquid assets less than $50,000 for full eligibility; sliding scale up to higher amounts. Home value is exempt. Countable assets determined via SFN 820.
- North Dakota resident living in private family dwelling (not institution).
- Functional impairment in at least two ADLs or four IADLs (e.g., bathing, dressing, meal prep, laundry), lasting or expected to last 3+ months.
- Impairments not due to intellectual disability, related condition, or mental illness.
- Does not qualify for Medicaid (Medicaid-eligible go to Medicaid instead).

**Benefits:** Homemaker support, personal care, respite care, home modifications, adult day care, adult foster care, chore & emergency response, companionship, home-delivered meals, non-medical transportation. Family caregivers (enrolled providers living with recipient) up to $48/day or $1,142/month respite. Max service amount example: $224 after deductions (e.g., from $1,418 less medically needy amount and $20 disregard). Enhanced rates for rural travel (20+ miles, 50+ miles, 70+ miles).
- Varies by: priority_tier

**How to apply:**
- Contact local HCBS Case Manager via Human Service Zone offices statewide.
- Submit SFN 1820 (SPED Program Pool Data) and SFN 676 (Add New Record to MMIS Eligibility File) to HCBS Program Administration.

**Timeline:** Not specified; immediate authorization possible if urgent need pending Medicaid determination.
**Waitlist:** SPED Pool maintained by HCBS Program Administration; potential wait based on pool entry.

**Watch out for:**
- Not for Medicaid-eligible (they use Medicaid waiver instead).
- Ex-SPED payments subject to estate recovery (e.g., adult day care, respite).
- Case may close if no services used in 30 days.
- Must exclude intellectual disability/mental illness impairments.
- Family caregivers must enroll as providers to receive payments.

**Data shape:** Two-tier structure: SPED (non-Medicaid) and Expanded SPED (SSI-level income + Medicaid-eligible); sliding scale by income/assets; rural travel enhancements; pool-based prioritization.

**Source:** https://www.nd.gov/dhs/policymanuals/52505/Content/525_05_25_20.htm

---

### North Dakota Aging in Community (AIC) Project

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits mentioned; open to older adults in targeted rural communities seeking to age in place[3][6][8]
- Assets: No asset limits specified; program focuses on community support rather than financial means-testing[3][6][8]
- Residency in targeted rural areas (e.g., Lisbon and western Morton Counties)
- Desire to remain in rural home and community
- No formal medical or functional need requirement stated; based on community needs assessment[3][6][8]

**Benefits:** Tailored community resources including volunteer support for transportation, food and nutrition classes, fall prevention education, technology assistance, and fostering community connections to enhance quality of life, safety, and confidence in aging in place[3][6][8]
- Varies by: region

**How to apply:**
- Contact NDSU Extension (specific phone or URL not listed in sources; visit NDSU Extension agriculture page for Aging in Community Program)
- Community-based model; likely through local Extension offices or partners in targeted areas[6][8]

**Timeline:** Not specified

**Watch out for:**
- Not a statewide entitlement program; limited to specific rural pilot areas, not available everywhere in ND
- Not a Medicaid or financial payment program (unlike SPED or long-term care Medicaid); focuses on volunteer/community connections rather than paid services or direct aid
- No formal eligibility barriers, but access depends on local implementation and partnerships—may not serve urban areas or all rural spots
- People may confuse with Medicaid HCBS or SPED, which have strict income/asset tests[1][3][6][7][8]

**Data shape:** Community-based pilot model limited to select rural counties; no income/asset tests or fixed benefits; relies on local volunteers and needs assessment rather than statewide bureaucracy

**Source:** https://www.ndsu.edu/agriculture/extension/programs/aging-community-program[8]

---

### Senior Safety Program (ND Assistive)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits mentioned; program appears open to all qualifying based on age and residency[1][3]
- Assets: No asset limits mentioned[1][3]
- North Dakota resident
- Not living in a basic or skilled nursing facility[3]

**Benefits:** Free home safety devices including: Alerting Devices for Hearing Loss, Anti-Elopement Devices, and professional setup assistance. Exact list of eligible items available on application form[1][5]
- Varies by: fixed

**How to apply:**
- Online: https://ndassistive.org/senior-safety-program/asdds-application/[6]
- Download PDF form: https://ndassistive.org/wp-content/uploads/2025/03/2025-Senior-Safety-Application-Standard-Print.pdf[2]
- Download Large Print DOC: https://ndassistive.org/wp-content/uploads/2025/03/2025-SeniorSafety_LargePrintAccessible_Request.docx[4]
- Mail: ND Assistive/ Senior Safety, 3240 15th St. S, Suite B, Fargo, ND 58104[4]
- Fax: 701-365-6242 Attn.: Senior Safety[4]
- Phone: 800 (number partially shown in results; call for questions)[4]
- Email: seniorsafety (full email likely seniorsafety@ndassistive.org based on context)[5]

**Timeline:** Not specified in available sources

**Watch out for:**
- Must not be living in a nursing facility—common oversight for those in transitional care[3]
- Program prioritizes safety devices only; not general healthcare or financial aid[1][5]
- Free devices but professional setup assistance may have limits not quantified in sources

**Data shape:** No income or asset test; fixed in-kind safety devices statewide from single Fargo-based provider; age 60+ with residency and non-nursing facility restriction

**Source:** https://ndassistive.org/our-programs/[1]

---

### Basic Care Assistance Program (BCAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18 or older and disabled or blind+
- Income: Follows Medicaid financial eligibility rules; specific 2026 dollar amounts not detailed in sources but aligns with ABD Medicaid ($3,000 asset limit for singles noted in related programs; income applied toward eligibility similar to Medicaid)[1][2]
- Assets: Follows Medicaid asset rules (e.g., $3,000 for single applicants in related ABD Medicaid); exact BCAP details require financial eligibility verification including countable income and assets, excluding occasional small gifts; liquid interest income counted[1][2]
- North Dakota resident
- Resident of a licensed Basic Care Facility
- Meets functional criteria via Personal Care Services Assessment by county social worker
- Provide SSN, proof of age, residence, disability, financial eligibility
- Apply for and receive Medicare benefits if eligible
- No disqualifying asset transfers

**Benefits:** Payment for room and board costs in a licensed Basic Care Facility; personal care services covered via assessment; Transmittal Between Units (SFN 21) for room/board[1][5][6]
- Varies by: functional_assessment_level

**How to apply:**
- Paper form: Application for Assistance SFN 405 (complete Sections 1, 3, 4, 6, 8 for BCAP)[5]
- County social services office (in-person or mail; contact local county for address)
- If already on Medicaid, use redetermination of eligibility[1][3]

**Timeline:** Eligibility date is date of application if eligible; no specific timeline stated[1]

**Watch out for:**
- Only for residents of licensed Basic Care Facilities (not home care or nursing homes)[1][5][6]
- Requires Personal Care Services Assessment; functional need but not full Nursing Facility Level of Care[1]
- Must meet all Medicaid-like financial rules; apply for Medicare if eligible[1][3]
- Date of eligibility is application date, but must provide all info promptly[1]
- Friends/relatives cannot be paid providers like in some other programs (Qualified Service Provider required for related services)[4]

**Data shape:** Restricted to licensed Basic Care Facility residents; uses Medicaid financial framework without published BCAP-specific income/asset tables; county-administered assessments; no standalone dollar caps, ties to room/board costs

**Source:** https://www.nd.gov/dhs/policymanuals/40029/PDF_of_Manual/ML3906%20SC%20400-29%20BCAP%20FULL.pdf

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| North Dakota Home and Community Based Se | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (MSP) | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Older Adult Nutrition Program | benefit | state | deep |
| Family Caregiver Support Program / Lifes | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman Services | resource | federal | simple |
| Service Payments for Elderly and Disable | benefit | state | deep |
| North Dakota Aging in Community (AIC) Pr | benefit | local | deep |
| Senior Safety Program (ND Assistive) | resource | state | simple |
| Basic Care Assistance Program (BCAP) | benefit | state | deep |

**Types:** {"benefit":11,"employment":1,"resource":2}
**Scopes:** {"state":6,"local":2,"federal":6}
**Complexity:** {"deep":11,"medium":1,"simple":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/ND/drafts.json`.

- **North Dakota Home and Community Based Services (HCBS) Waiver** (benefit) — 5 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (MSP)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **not_applicable**: 2 programs
- **household_size**: 1 programs
- **household_size, fuel_type, income_level**: 1 programs
- **program_type|medicaid_waiver**: 1 programs
- **region**: 1 programs
- **fixed**: 1 programs
- **functional_assessment_level**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **North Dakota Home and Community Based Services (HCBS) Waiver**: Services via individualized care plan based on needs; tiered by aged/disabled categories (65+ vs 18-64); statewide but centrally administered; participant caps create waitlists; excludes IDD/mental illness (separate waivers)
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE in North Dakota is geographically restricted to specific service areas (currently Bismarck, Dickinson, Minot, Fargo via Northland PACE). The program has no income or asset limits for enrollment, but most participants rely on Medicaid, which does have financial limits. Benefits are fixed and comprehensive (all-inclusive) rather than tiered. The program is designed for individuals already certified as needing nursing home-level care but able to remain in the community. Processing timelines, waitlist specifics, and application procedures are not detailed in publicly available sources.
- **Medicare Savings Programs (MSP)**: Tiered by income relative to FPL (QMB ≤100%, SLMB 100-120%, QI1 120-135%); asset limits match LIS levels; county-administered statewide with potential local processing variations; benefits scale by tier, not household size beyond couple/single
- **SNAP (Supplemental Nutrition Assistance Program)**: SNAP for elderly/disabled households (60+) operates under fundamentally different rules than standard SNAP: they only need to meet net income limits (not gross income limits), have higher asset limits ($4,500 vs. $3,000), and are exempt from work requirements. This creates a simpler pathway to eligibility for seniors. Benefits scale by household size and are calculated after specific deductions (20% of earned income, standard deduction by household size, medical expenses over $35/month). The program is administered statewide through local Human Service Zones but has significant underutilization among eligible seniors.
- **LIHEAP (Low Income Home Energy Assistance Program)**: Benefits scale by household income, household size, and fuel type; no fixed benefit amount. Program operates on fixed annual state funding with first-come, first-served distribution. Eligibility is year-round under new model, but application periods vary by assistance type (heating Oct-May, cooling summer, crisis year-round). Income limits tied to state median income percentage rather than fixed dollar amounts. No asset limit creates broader eligibility than many assistance programs. Tribal and state programs operate in parallel with different eligibility criteria for reservation areas.
- **Weatherization Assistance Program**: Administered statewide via 8 regional CAP agencies; automatic eligibility for LIHEAP; 200% FPL income table scales by household size; one-time service rule with 15-year reweatherization exception.
- **Older Adult Nutrition Program**: No income/asset test; priority-based targeting; locally administered with homebound criteria for delivery; open to spouses/under 60 in limited cases; rural focus[1][3]
- **Family Caregiver Support Program / Lifespan Respite Care**: Tied to specific Medicaid 1915(c) waivers with 'extraordinary care' test; two tracks (Medicaid pilot vs. SPED non-Medicaid); online portal only for pilot; no fixed hours/dollar rates detailed beyond SPED max
- **Senior Community Service Employment Program (SCSEP)**: County-restricted to 12-14 specific counties; income table scales by household size; priority enrollment tiers; grant-funded with limited slots via state VR provider.
- **Long-Term Care Ombudsman Services**: no income/asset/age test; open to all residents in specified facility types statewide; advocacy-based rather than financial or direct service provision; consent-driven and resident-directed
- **Service Payments for Elderly and Disabled (SPED)**: Two-tier structure: SPED (non-Medicaid) and Expanded SPED (SSI-level income + Medicaid-eligible); sliding scale by income/assets; rural travel enhancements; pool-based prioritization.
- **North Dakota Aging in Community (AIC) Project**: Community-based pilot model limited to select rural counties; no income/asset tests or fixed benefits; relies on local volunteers and needs assessment rather than statewide bureaucracy
- **Senior Safety Program (ND Assistive)**: No income or asset test; fixed in-kind safety devices statewide from single Fargo-based provider; age 60+ with residency and non-nursing facility restriction
- **Basic Care Assistance Program (BCAP)**: Restricted to licensed Basic Care Facility residents; uses Medicaid financial framework without published BCAP-specific income/asset tables; county-administered assessments; no standalone dollar caps, ties to room/board costs

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in North Dakota?
