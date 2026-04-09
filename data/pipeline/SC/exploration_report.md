# South Carolina Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 57s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 13 |
| New (not in our data) | 7 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 5 programs
- **financial**: 3 programs
- **advocacy**: 2 programs
- **in_kind + service**: 1 programs
- **employment**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Healthy Connections Medicaid

- **income_limit**: Ours says `$1305` → Source says `$2,982` ([source](https://www.scdhhs.gov))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Pays for medical bills, nursing facility care, other medical expenses for eligible elderly/disabled. Covers doctor visits, hospital care, prescriptions via managed care plans. Specific long-term care requires NFLOC; no fixed dollar/hour amounts listed.[1][3][6]` ([source](https://www.scdhhs.gov))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov`

### Community Choices Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18-64 with physical disability` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]))
- **income_limit**: Ours says `$2982` → Source says `$1,330` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health care, case management, personal care, respite (institutional, CRCF, in-home), adult day health care transportation/nursing, attendant care, companion care (agency/individual), home accessibility adaptations/environmental modifications, home delivered meals, personal emergency response system (installation/monitoring), pest control, residential personal care II, specialized medical equipment/supplies, telemonitoring[4][6]` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1305` → Source says `$20` ([source](https://www.scdhhs.gov/members/program-eligibility-and-income-limits))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments. SLMB: Part B premiums only (~$202.90/month in 2026). QI: Part B premiums only. Automatic Extra Help for prescription drugs if qualified.[1][4]` ([source](https://www.scdhhs.gov/members/program-eligibility-and-income-limits))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/members/program-eligibility-and-income-limits`

### LIHEAP (Home Energy Assistance)

- **income_limit**: Ours says `$2800` → Source says `$2,666` ([source](https://oeo.sc.gov/managedsites/prd/oeo/liheap.html))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payments to utility providers for heating/cooling bills. Max: Heating $850, Cooling $775, Crisis $1,500 (up to $1,500 per service, max 2 services/year).[2][4] Min: $200 (heating/cooling). Covers electricity, natural gas, propane, fuel oil, kerosene, wood/coal; cooling may include window AC/fans.[7] Crisis for shutoffs/emergencies; separate weatherization possible.` ([source](https://oeo.sc.gov/managedsites/prd/oeo/liheap.html))
- **source_url**: Ours says `MISSING` → Source says `https://oeo.sc.gov/managedsites/prd/oeo/liheap.html`

### South Carolina Family Caregiver Support Program & Respite Care Services

- **min_age**: Ours says `60` → Source says `Caregivers must be 55+ for most programs; Voucher Program requires caregivers aged 18-54[4]` ([source](https://aging.sc.gov/programs-initiatives/family-caregiver-support))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Voucher Program: $500 per eligible family per 12-month federal fiscal year[6]. Family Caregiver Support Program: respite care, supplemental services, counseling, and resource connection (amounts not specified)[1]. LifeSpan Respite: community-based respite care services (amounts not specified)[1]` ([source](https://aging.sc.gov/programs-initiatives/family-caregiver-support))
- **source_url**: Ours says `MISSING` → Source says `https://aging.sc.gov/programs-initiatives/family-caregiver-support`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigates and resolves complaints; advocates for resident rights; assists with appeals/grievances; provides education on resident rights/benefits; offers information/referrals for long-term care services; mediates between residents/families and facilities; promotes community involvement; no cost for services; no fixed dollar amounts or hours—support provided as needed per complaint.` ([source](https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program[1]))
- **source_url**: Ours says `MISSING` → Source says `https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program[1]`

## New Programs (Not in Our Data)

- **South Carolina PACE** — service ([source](https://www.scdhhs.gov/members/managed-care-plan-information/program-all-inclusive-care-elderly-pace/members))
  - Shape notes: Limited to specific counties/service areas with PACE organizations; no income/asset test for enrollment itself, but tied to Medicare/Medicaid and nursing home-level care; not statewide.
- **SHIP (I-Care) — State Health Insurance Assistance Program** — advocacy ([source](https://www.scdhhs.gov/members/program-eligibility-and-income-limits and https://www.scacog.org/i-care))
  - Shape notes: SHIP (I-Care) is a counseling and advocacy program, not a direct benefit program. It has no income or asset limits because it is universally available to Medicare-eligible individuals. Its value lies in helping families navigate complex Medicare and Medicaid rules, not in providing direct financial or service benefits. The program is statewide with centralized contact but counseling can be provided remotely via phone.
- **Meals on Wheels** — service ([source](No single statewide .gov site; find locals via mealsonwheelsamerica.org/find-meals-and-services or SCDHHS for Medicaid HDM (scdhhs.gov)[4][8]))
  - Shape notes: Decentralized local providers with no uniform statewide eligibility/income rules; heavy variation by region/provider in age, homebound definition, costs, and delivery; often tied to Medicaid/insurance for free meals
- **SCSEP (Senior Community Service Employment Program)** — employment ([source](https://aging.sc.gov/programs-initiatives/senior-community-service-employment-program-scsep[1]))
  - Shape notes: National program with SC-specific administration via Dept. on Aging and Goodwill grantees; priority-based enrollment; no fixed income table or asset test in sources; benefits fixed at ~20 hrs/wk minimum wage regardless of household size.
- **Legal Aid for Seniors** — service ([source](https://www.santeelynchescog.org/sites/default/files/uploads/aging/legalservicesform.pdf (example AAA); sclegal.org (referral partner)))
  - Shape notes: No income/asset test but priority-based on need tiers; delivered via 10 regional AAAs/COGs; referrals to means-tested alternatives scale by household FPL and assets.
- **State Property Tax Assistance (Homestead Exemption)** — financial ([source](South Carolina Code § 12-37-250[1]))
  - Shape notes: No income or asset limits. Fixed benefit amount ($50,000) with no variation by household size or priority tier. Statewide program with consistent eligibility but county-level administration. Pending legislation would create tiered benefits based on residency length for new applicants. Creditor protection homestead exemption exists separately ($63,250 individual / $126,500 married) but is distinct from property tax exemption[1].
- **Senior Farmers Market Nutrition Program** — in_kind ([source](https://dss.sc.gov/ (via DSS.SC.gov) and https://agriculture.sc.gov/divisions/agency-operations/grants/sfmnp/[1][5]))
  - Shape notes: County-restricted to 42/46 counties with local in-person events; fixed $50 benefit; no asset test or detailed income table in sources (self-declared at 185% FPL); administered by SC DSS with SCDA partnership

## Program Details

### Healthy Connections Medicaid


**Eligibility:**
- Age: 65+
- Income: For elderly (65+): Income under $2,982/month for single nursing home applicants in 2026. General Medicaid: Varies by category—parents/caretakers up to 100% FPL, children up to 213% FPL, pregnant women up to 199% FPL. Exact dollar amounts depend on current FPL and household size; no full table in sources but includes 5% disregard. For long-term care, requires Nursing Facility Level of Care (NFLOC).[2][6]
- Assets: For elderly long-term care (e.g., nursing home): $2,000 for single applicants. Counts checking/savings accounts and other resources; exemptions not detailed but typical Medicaid rules apply (e.g., primary home often exempt). Eligibility based on income and assets.[3][6]
- Blind or totally/permanently disabled
- Nursing home level of care for long-term services
- Functional need for ADLs in regular program
- U.S. citizen or qualified immigrant
- South Carolina resident

**Benefits:** Pays for medical bills, nursing facility care, other medical expenses for eligible elderly/disabled. Covers doctor visits, hospital care, prescriptions via managed care plans. Specific long-term care requires NFLOC; no fixed dollar/hour amounts listed.[1][3][6]
- Varies by: priority_tier

**How to apply:**
- Online: https://apply.scdhhs.gov or https://www.scdhhs.gov/how-to-apply
- Phone: 1-888-549-0820 (TTY: 888-842-3620)
- Mail: Request paper application by calling 888-549-0820
- In-person: Local county office or authorized hospitals/Family Health Centers (e.g., call 803-531-6900)

**Timeline:** Up to 45 days; longer for certain categories like disability.[7]

**Watch out for:**
- Must enroll in managed care plan (90-day switch window, then limited changes).[5]
- SC did not expand Medicaid under ACA, so limited parental coverage.[2]
- Apply directly to SCDHHS, not Marketplace for final determination if assessed eligible there.[7]
- Hospitals cannot delegate eligibility determinations.[7]
- Long-term care needs NFLOC; income/assets strictly for nursing home programs.[6]

**Data shape:** Elderly focus on long-term care with strict $2,982 income/$2,000 asset for singles; managed care mandatory post-eligibility; no statewide waitlist info; varies by care need (NFLOC/ADL)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov

---

### Community Choices Waiver


**Eligibility:**
- Age: 65+ or 18-64 with physical disability+
- Income: At or below 100% of the Federal Poverty Level (FPL), effective 03/01/2026: Family Size 1 - Monthly $1,330 / Annual $15,960; Family Size 2 - Monthly $1,804 / Annual $21,640[3]
- Assets: Resources effective 01/01/2026: Family Size 1 - $9,950; Family Size 2 - $14,910. Home exempt if applicant lives there or intends to return (home equity ≤ $730,000 in 2025), spouse lives there, child under 21 lives there, or disabled/blind child of any age lives there[1][3]
- South Carolina resident
- U.S. citizen or qualified alien
- Nursing Facility Level of Care (NFLOC): requires 8+ hours skilled nursing/day or inability to independently complete ADLs (mobility, eating, toileting, bathing, dressing, transitioning); Alzheimer's/dementia may qualify if NFLOC met[1][2]
- At risk of nursing home placement
- Healthy Connections (SC Medicaid) eligible[2]

**Benefits:** Adult day health care, case management, personal care, respite (institutional, CRCF, in-home), adult day health care transportation/nursing, attendant care, companion care (agency/individual), home accessibility adaptations/environmental modifications, home delivered meals, personal emergency response system (installation/monitoring), pest control, residential personal care II, specialized medical equipment/supplies, telemonitoring[4][6]
- Varies by: priority_tier

**How to apply:**
- Online via SCDHHS website
- Phone: local Health and Human Services Community Long Term Care (CLTC) Office or SCDHHS
- Mail: SCDHHS-Central Mail, P.O. Box 100101, Columbia, SC 29202-3101 or fax to 8888201204@fax.scdhhs.gov
- In-person: local county office or CLTC Office[3][5]

**Timeline:** Not specified in sources
**Waitlist:** Waiver slots required; reserved capacity categories and priority for entrance (e.g., at risk of institutionalization); must use services regularly to retain slot[2][7]

**Watch out for:**
- Must meet NFLOC (not just dementia diagnosis) and be at risk of nursing home placement[1]
- Waiver slot required; priority tiers and reserved capacities determine entry; must use services regularly or lose slot[2][7]
- Disabled enrollees (18-64) can continue benefits after 65[1]
- Home equity limit applies ($730,000 in 2025)[1]
- Apply for Healthy Connections Medicaid first[2]

**Data shape:** Income/assets vary by household size with specific FPL tables; tiered priority for slots; NFLOC based on 8+ hours nursing/ADLs; statewide but local offices handle intake

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]

---

### South Carolina PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits; participants must have Medicare or Medicaid (or both). For Medicaid long-term care eligibility, income generally under $2,901/month (300% of Federal Benefit Rate in 2025), but varies by state rules and not a direct PACE barrier.[1][4]
- Assets: No asset limits for PACE enrollment itself. Medicaid may require assets $2,000 or less (excluding primary home) for dual eligibles.[4]
- Live in the service area of a PACE organization.
- Meet nursing home-level of care as certified by South Carolina Department of Health and Human Services.
- Be able to live safely in the community with PACE help.
- Have Medicare or Medicaid (or both); cannot be in Medicare Advantage, hospice, or certain other programs.

**Benefits:** All-inclusive care for the elderly including primary care, hospital care, prescription drugs, social services, restorative therapies, home care, respite care, and all other needed services to maintain community living; no specific dollar amounts or hours stated, comprehensive coverage via PACE organization.[1][2]
- Varies by: region

**How to apply:**
- Contact SCDHHS or PACE organization in service area (specific phone/website via https://www.scdhhs.gov/members/managed-care-plan-information/program-all-inclusive-care-elderly-pace/members)
- No specific forms, phone numbers, or addresses listed in sources; start via SCDHHS site or local PACE provider.

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may exist due to limited service areas.

**Watch out for:**
- Not statewide—must live in a PACE service area; check specific counties.
- Requires nursing home-level care certification, but must be able to live safely in community (not for those needing full nursing home).
- No financial eligibility barrier for enrollment, but most need Medicaid/Medicare; cannot be in Medicare Advantage or hospice.
- Voluntary enrollment; average participant is 76 with complex needs.

**Data shape:** Limited to specific counties/service areas with PACE organizations; no income/asset test for enrollment itself, but tied to Medicare/Medicaid and nursing home-level care; not statewide.

**Source:** https://www.scdhhs.gov/members/managed-care-plan-information/program-all-inclusive-care-elderly-pace/members

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits are monthly amounts including a $20 general income disregard and vary by program (QMB: ≤100% FPL, ~$1,275 individual/$1,724 couple; SLMB: 100-120% FPL, ~$1,526 individual/$2,064 couple; QI: 120-135% FPL, ~$1,715 individual/$2,320 couple). Limits apply to individuals or couples; larger households use FPL-based calculations. Exact 2026 South Carolina figures available via SCDHHS as they adjust annually with FPL.[1][3][4][8]
- Assets: Resources ≤$9,430 individual/$14,130 couple (or ~$9,660/$14,470 per some sources) across all programs. Counts: checking/savings, stocks, bonds, mutual funds, IRAs. Exempt: primary home, one car, household goods, life insurance, burial plots, food stamps.[2][3]
- Must be enrolled in or eligible for Medicare Part A and B
- South Carolina resident
- U.S. citizen or qualified immigrant
- Not eligible for full Medicaid
- Annual reapplication required

**Benefits:** QMB: Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments. SLMB: Part B premiums only (~$202.90/month in 2026). QI: Part B premiums only. Automatic Extra Help for prescription drugs if qualified.[1][4]
- Varies by: priority_tier

**How to apply:**
- Phone: South Carolina Department of Health and Human Services (SCDHHS) at 1-888-549-0820
- Online: SCDHHS portal at https://apply.scdhhs.gov/
- Mail: SCDHHS, P.O. Box 8206, Columbia, SC 29202-8206
- In-person: Local SCDHHS county offices (find via https://www.scdhhs.gov/)

**Timeline:** Typically 45 days, but may vary
**Waitlist:** QI has limited funding and operates first-come, first-served with potential waitlist or denial if funds exhausted

**Watch out for:**
- QI funding is limited and first-come, first-served—apply early in federal fiscal year (October)
- Income includes $20 disregard but excludes some items like food stamps; couples calculated jointly
- Assets include IRAs; must report all countable resources accurately
- Automatic enrollment possible if on Medicaid, but manual application needed otherwise
- Qualifying auto-enrolls in Extra Help, but confirm LIS status
- Reapply annually; missing deadline loses benefits
- Not full Medicaid—providers cannot charge you for Medicare-covered services (QMB protection often missed)

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) with fixed asset caps for individual/couple; QI capped by federal funding availability; statewide but county-administered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/members/program-eligibility-and-income-limits

---

### LIHEAP (Home Energy Assistance)


**Eligibility:**
- Income: Varies by provider and guidelines used (e.g., 60% State Median Income (SMI), 150% Federal Poverty Level (FPL), or Federal Poverty Guidelines). Exact limits differ; examples: From [2] (monthly gross income): 1: $2,666; 2: $3,486; 3: $4,306; 4: $5,127; 5: $5,947; 6: $6,767. From [3] (60% SMI monthly): 1: $2,332.83; 2: $3,050.58; 3: $3,768.42; 4: $4,486.25; 5: $5,204; 6: $5,921.83; 7: $6,056.42; 8: $6,191. Households assessed individually; priority for elderly, disabled, children ≤5, or high energy burden.
- Assets: No asset limit statewide.[2]
- SC resident in service area of local Community Action Agency (county-specific).
- Proof of income for past 30 days for all household members.
- SC-issued picture ID with current address.
- Social Security cards for all household members.
- Energy bill in household member's name.
- Citizenship status verification.
- Priority for vulnerable households (elderly, disabled, young children, emergencies).

**Benefits:** One-time payments to utility providers for heating/cooling bills. Max: Heating $850, Cooling $775, Crisis $1,500 (up to $1,500 per service, max 2 services/year).[2][4] Min: $200 (heating/cooling). Covers electricity, natural gas, propane, fuel oil, kerosene, wood/coal; cooling may include window AC/fans.[7] Crisis for shutoffs/emergencies; separate weatherization possible.
- Varies by: priority_tier|region|household_size

**How to apply:**
- Contact local Community Action Agency by county (see map at oeo.sc.gov).[4][5]
- Phone: Governor’s Office of Economic Opportunity 803-734-0662 for info/direction.[4]
- Online: Provider-specific (e.g., carolinacommunityactions.org/apply-here, palmettocap.org).[1][3]
- In-person/mail: Local agency offices (e.g., GLEAMNS: 237 N Hospital St, Greenwood, SC).[5][6]

**Timeline:** Not specified; intake interview scheduled after contact.
**Waitlist:** Funds limited; available until exhausted. Seasonal: Heating Oct-winter, Cooling May-Sep, Crisis year-round emergencies.[2]

**Watch out for:**
- Not statewide uniform—must use exact county agency; income calculated uniquely (past 30 days, full household incl. roommates on bill).[1][2]
- Funds exhaust quickly; seasonal availability.[2][7]
- Priority for elderly/vulnerable/emergencies—others may miss out.[3][6]
- Renter with included utilities needs itemized bill.[4]
- Max 2 services/year.[4]

**Data shape:** County-administered via local agencies with varying income guidelines (60% SMI, FPL), providers, and limits; priority-tiered for vulnerable (elderly prioritized); funds limited/seasonal; no asset test.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oeo.sc.gov/managedsites/prd/oeo/liheap.html

---

### SHIP (I-Care) — State Health Insurance Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or under 65 with certain disabilities+
- Income: No income limits for SHIP counseling eligibility. SHIP is a counseling service, not a financial assistance program. However, counselors help beneficiaries understand eligibility for Medicare and Medicaid, which have separate income limits.
- Assets: Not applicable — SHIP is a counseling service, not a needs-based program
- Must be eligible for Medicare (age 65+, or under 65 with disability)
- Can be a Medicare beneficiary, family member, or caregiver

**Benefits:** Free personalized health insurance counseling. Counselors review Medicare Summary Notices, explain coverage options, help navigate plan changes, advise on prescription drug coverage, Medigap plans, and Medicare Advantage options. Counselors can also help determine Medicaid eligibility and guide applications.

**How to apply:**
- Phone: 1-800-868-9095
- Website: South Carolina SHIP website (accessible via scacog.org/i-care or through Lt. Governor's Office on Aging)
- In-person: Lt. Governor's Office on Aging, 1301 Gervais Street, Suite 350, Columbia, SC 29201

**Timeline:** Not specified in available sources — counseling is typically provided during initial contact or scheduled appointment
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SHIP is NOT a financial assistance program — it provides counseling only. Families often confuse it with Medicaid or Medicare itself.
- SHIP counselors help determine Medicaid eligibility but do not process Medicaid applications. Medicaid has strict income and asset limits (e.g., $2,982/month for nursing home applicants in 2026) that SHIP can explain but cannot waive.
- Medicare does not cover non-medical personal care (dressing, bathing, toileting) — counselors can clarify this common misconception and explain what Medicaid might cover instead.
- Open enrollment for Medicare plans is October 15–December 7 annually — missing this window limits plan change options.
- SHIP is funded by federal agencies and is independent of insurance companies — this is important for families concerned about bias in recommendations.
- Counselors need actual bills or Medicare Summary Notices to review — calling without documentation limits what they can help with immediately.

**Data shape:** SHIP (I-Care) is a counseling and advocacy program, not a direct benefit program. It has no income or asset limits because it is universally available to Medicare-eligible individuals. Its value lies in helping families navigate complex Medicare and Medicaid rules, not in providing direct financial or service benefits. The program is statewide with centralized contact but counseling can be provided remotely via phone.

**Source:** https://www.scdhhs.gov/members/program-eligibility-and-income-limits and https://www.scacog.org/i-care

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income limits; varies by provider. Some follow federal poverty guidelines or prioritize low-income/Medicaid/SSI recipients. Many programs (e.g., Summerville, Upstate) explicitly state eligibility is NOT based on income.[3][9]
- Assets: No asset limits mentioned across sources.
- Primarily homebound due to age, illness, disability, or infirmity[1][3][5]
- Unable to shop for food or prepare meals independently[1][2][3][4]
- Live in provider's delivery/service area[1][3][6]
- Some serve under 60 if disabled/homebound (varies by provider)[1][2][3][9]
- May include spouses/dependents if also eligible[1][3]
- For Medicaid HDM: Must be Medicaid-eligible and referred[7][8]

**Benefits:** Home-delivered nutritious meals (e.g., protein, two sides, fruit/dessert, bread). Typically 5 meals per week delivered once weekly (e.g., Tue-Fri delivery in Horry County). Delivery windows 10am-2pm Mon-Thu or similar. Free if covered by Medicaid/Medicare/SNAP/insurance; private pay $6-8 per meal.[3][5][6][9]
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging by phone (e.g., Summerville: (843) 873-8224[3]; Palmetto: 843-627-3212[6]; Upstate: 1-888-516-4788[9]; Horry not specified[5])
- Online form (e.g., Palmetto: form on mealsonwheelspalmetto.com[6]; Summerville: apply link on mowsummerville.org[3])
- Phone assessment with local agency[1][2]
- For Medicaid: Referral via Community Choices or local CLTC office[7][8]

**Timeline:** Varies; some within 1 week, others longer if waitlist. Medicaid providers must accept/decline referrals within 2 working days[1][8]
**Waitlist:** Possible at some programs; varies by location[1]

**Watch out for:**
- Not a single statewide program—must contact specific local provider for area; eligibility/delivery varies widely[1][3][6]
- Homebound strictly defined (e.g., can't shop/cook easily; car ownership may disqualify)[1][2]
- Must be home during delivery window[6]
- Private pay if no insurance coverage ($6-8/meal); donations/suggested[3][6][9]
- Medicaid version requires referral and ongoing eligibility checks[8]
- Waitlists common in high-demand areas[1]

**Data shape:** Decentralized local providers with no uniform statewide eligibility/income rules; heavy variation by region/provider in age, homebound definition, costs, and delivery; often tied to Medicaid/insurance for free meals

**Source:** No single statewide .gov site; find locals via mealsonwheelsamerica.org/find-meals-and-services or SCDHHS for Medicaid HDM (scdhhs.gov)[4][8]

---

### South Carolina Family Caregiver Support Program & Respite Care Services


**Eligibility:**
- Age: Caregivers must be 55+ for most programs; Voucher Program requires caregivers aged 18-54[4]+
- Income: Not specified in available documentation. Income limits not disclosed in search results[1][4][6]
- Assets: Not specified in available documentation
- Caregiver must be unpaid (or not receiving Medicaid waiver employment compensation)[4]
- Caregiver cannot be a legally responsible person or legal guardian for respite services[2]
- Care recipient must meet specific criteria based on program type (see below)
- For Voucher Program: Care receiver must be unable to be left alone due to disability, special needs, or terminal illness, and no more than 59 years old without Alzheimer's/dementia diagnosis[4]
- For Family Caregiver Support: Care recipient must be 60+ requiring ADL assistance, any age with Alzheimer's/dementia, or adult 18-59 with disabilities[1]
- For Seniors Raising Children: Caregiver 55+ caring for child under 18 whose parents are unable/unwilling to provide care[1]

**Benefits:** Voucher Program: $500 per eligible family per 12-month federal fiscal year[6]. Family Caregiver Support Program: respite care, supplemental services, counseling, and resource connection (amounts not specified)[1]. LifeSpan Respite: community-based respite care services (amounts not specified)[1]
- Varies by: program_type_and_priority_tier

**How to apply:**
- Mail: SC Respite Coalition (address available via respite@screspitecoalition.org)[6]
- Email: respite@screspitecoalition.org[6]
- Phone: (803) 935-5027 ext. 6 (Rena) or ext. 12 (Jennifer)[6]
- Local Area Agency on Aging (for Family Caregiver Support Program)[1]
- Local DHHS Community Long-term Care Office (for some respite programs)[2]

**Timeline:** Voucher reimbursement takes up to 45 days but usually 2-3 weeks[4]. Overall application processing time not specified
**Waitlist:** Voucher Program: Applications placed into priority queue based on: (1) individuals who haven't received voucher in past 24 months, (2) underserved areas, (3) greatest economic need, (4) limited English-speaking ability[4]. No specific waitlist timeline provided

**Watch out for:**
- Voucher Program has strict age limits: caregivers must be 18-54, NOT 55+[4] — this is different from the broader Family Caregiver Support Program which targets 55+[1]
- Vouchers cannot be used to pay family members who live in the home[6]
- Vouchers cannot offset cost of paid care already in place[6]
- Vouchers cannot be used for care that occurred before voucher was issued[6]
- Vouchers cannot be used to pay caregiver directly for care they're providing[6]
- Vouchers cannot be used for work-related childcare[6]
- Caregivers receiving financial compensation (including Medicaid waiver employment as Personal Care Aid) are ineligible for Voucher Program[4]
- Care receivers in Voucher Program cannot have Alzheimer's or dementia-related illness if over 59 years old[4]
- Respite caregivers cannot be legal guardians or legally responsible persons[2]
- Respite care in CRCF requires prior admission agreement specifying admission/discharge dates[3]
- Respite care and Attendant Care/Personal Assistance cannot be provided simultaneously[5]
- Participants receiving Residential Habilitation cannot receive Respite Care on same day through HASCI Waiver[5]
- No income or asset limits disclosed in available documentation — eligibility criteria may exist but are not publicly detailed in search results

**Data shape:** South Carolina operates multiple overlapping respite and caregiver support programs with different eligibility criteria, age requirements, and benefit structures. The Voucher Program (18-54 caregivers, $500/year) is distinct from the broader Family Caregiver Support Program (55+ caregivers). Enrollment limits vary significantly by program and region, suggesting capacity constraints. The program structure is fragmented across multiple agencies (Area Agencies on Aging, DHHS, DDSN, SC Respite Coalition), requiring applicants to identify which program matches their situation. Income and asset limits are not disclosed in available public documentation, which is unusual for means-tested programs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.sc.gov/programs-initiatives/family-caregiver-support

---

### SCSEP (Senior Community Service Employment Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources; families must verify current federal poverty guidelines (typically published by HHS) against 125% threshold.[1][2][3]
- Assets: No asset limits mentioned in program sources.
- Unemployed
- Enrollment priority: veterans and qualified spouses first, then individuals over 65, with a disability, low literacy skills or limited English proficiency, residing in a rural area, homeless or at risk of homelessness, low employment prospects, or failed to find employment after using SC Works/American Job Center services.[1][2]

**Benefits:** Paid community service work-based job training at non-profit and public facilities (e.g., schools, hospitals, day-care centers, senior centers); average 20 hours per week at the highest of federal, state, or local minimum wage; on-the-job training; bridge to unsubsidized employment; access to employment assistance through American Job Centers/SC Works; average training period 36 months.[1][2]
- Varies by: priority_tier

**How to apply:**
- Phone: South Carolina Department on Aging (specific number not listed; contact via aging.sc.gov), Palmetto Goodwill (843) 408-6030[3], Goodwill Industries of Upstate/Midlands SC (via goodwillsc.org)[6]
- In-person or assessment: Contact local Goodwill SCSEP providers or SC Department on Aging offices[1][3][6]
- Online form: Palmetto Goodwill contact form at palmettogoodwill.org/service/senior-job-training/[3]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may depend on funding and slots as a grant-based program.

**Watch out for:**
- Must be unemployed to enroll; program is temporary training (avg. 36 months) aimed at unsubsidized private-sector jobs, not permanent public employment.[1][2]
- Priority tiers mean non-priority applicants may face delays or ineligibility if slots full.[1][2]
- Income test is strict at 125% FPL; excludes those above threshold despite other needs.[1][3]
- No specific dollar amounts for wages beyond minimum wage tie; actual pay depends on location's highest minimum.[1]
- Funded by DOL grants to state/non-profits; availability tied to funding cycles (e.g., 2025 grant data).[3][7]

**Data shape:** National program with SC-specific administration via Dept. on Aging and Goodwill grantees; priority-based enrollment; no fixed income table or asset test in sources; benefits fixed at ~20 hrs/wk minimum wage regardless of household size.

**Source:** https://aging.sc.gov/programs-initiatives/senior-community-service-employment-program-scsep[1]

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not means-tested; no income or asset disclosure required for denial of services. Prioritizes those with Greatest Economic Need (income at or below poverty line, generally 125%-200% of federal poverty guidelines in SC) and Greatest Social Need (non-economic factors like disabilities, isolation, language barriers). For referrals to SC Legal Services, income typically ≤125% FPL (exceptions to 200% FPL) with assets ≤$3,000 per person (exclusions apply).[1][3][4]
- Assets: No asset limits or tests for the core Legal Assistance Services Program. SC Legal Services (referral option) has $3,000 per person limit (liquid/non-liquid) with certain exclusions.[1][3]
- Greatest Economic Need or Greatest Social Need prioritized due to limited resources.
- South Carolina resident.
- Civil legal matters only (non-criminal).

**Benefits:** Free legal assistance and elder rights services under Older Americans Act (OAA), including representation, advice, and advocacy to maximize independence and well-being. Specific areas: elder rights, autonomy protection. Referrals to SC Legal Services or SC Bar if not prioritized.[1]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) or Council on Aging (COG), e.g., Santee Lynches COG form: https://www.santeelynchescog.org/sites/default/files/uploads/aging/legalservicesform.pdf (mail/submit).
- SC Legal Services (referral): Online intake at sclegal.org; phone 1-888-346-5592 or regional (e.g., Charleston: 843-720-7044, toll-free 888-720-2320).
- SC Bar Lawyer Referral: (803) 799-7100 or online.
- In-person/walk-in/phone at local offices with proof of residence/income/ID/legal docs.[3][5]

**Timeline:** Not specified in sources.
**Waitlist:** Possible due to limited OAA resources; prioritization affects access.[1]

**Watch out for:**
- Not means-tested but heavily prioritized for greatest economic/social need—higher income seniors may get referrals only, not direct services.[1]
- Limited OAA funding means not all seniors served; expect referrals to means-tested SC Legal Services (125% FPL, $3k assets).[1][3][4]
- Focus on elder rights/OAA-specific issues; not general legal aid.
- No criminal matters; prisoners excluded from some providers.[3]
- Income questions asked for resource targeting, despite no denial based on them.[1]

**Data shape:** No income/asset test but priority-based on need tiers; delivered via 10 regional AAAs/COGs; referrals to means-tested alternatives scale by household FPL and assets.

**Source:** https://www.santeelynchescog.org/sites/default/files/uploads/aging/legalservicesform.pdf (example AAA); sclegal.org (referral partner)

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Resident must be in a long-term care facility (nursing homes, assisted living, community residential care facilities, DDSN or DMH facilities) in South Carolina.
- Complaint must relate to quality of care, quality of life, rights violations, improper transfer/discharge, benefits assistance, dignity/respect, or abuse/neglect/exploitation.
- Available to residents, family, friends, facility staff, or any concerned community member filing on behalf of a resident.

**Benefits:** Investigates and resolves complaints; advocates for resident rights; assists with appeals/grievances; provides education on resident rights/benefits; offers information/referrals for long-term care services; mediates between residents/families and facilities; promotes community involvement; no cost for services; no fixed dollar amounts or hours—support provided as needed per complaint.

**How to apply:**
- Phone: Statewide toll-free 1-800-868-9095 (for abuse/neglect suspicions or general complaints)[1]
- Phone: State office 803-734-9900[1][5]
- Regional offices (examples: Santee-Lynches at 803-774-1983 or sbrooks@slcog.org[2]; Appalachian COG at 864-242-9733 or ombudintake@scacog.org[3])
- In-person or walk-in at regional offices
- Email to regional coordinators
- No specific online application form; contact to file complaint

**Timeline:** Not specified; ombudsman investigates promptly upon contact, determines validity, mediates resolution, and follows up—no formal processing timeline stated.

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy for complaints in facilities; does not provide direct services like care or payments.
- Only for long-term care facility residents—not community-dwelling adults (separate reporting for community abuse).
- Complaints handled confidentially, but identity may need disclosure for resolution (resident chooses).
- Anyone can file, not just family or residents.
- Volunteers also provide visits/encouragement, but core service is complaint resolution.

**Data shape:** no income test; free advocacy service only for LTC facility residents statewide via 10 regional offices; complaint-driven, not enrollment-based; not a qualification/application program but open-access support.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program[1]

---

### State Property Tax Assistance (Homestead Exemption)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Must hold complete fee simple title, life estate, or be beneficiary of a trust holding title to primary legal residence[1][5]
- Must be legal resident of South Carolina for one full calendar year as of December 31 preceding the tax year of exemption[2][5]
- Property must be primary legal residence where you reside for majority of year[1]
- Alternatively qualify if: totally and permanently disabled (certified by state or federal agency)[2][5] OR legally blind (certified by licensed ophthalmologist)[2][5]

**Benefits:** $50,000 exemption from fair market value of primary residence for property tax calculation[1][6]. If home valued at $50,000 or less, completely exempt from all property taxes[6]
- Varies by: fixed

**How to apply:**
- In-person at county auditor or assessor office (varies by county)
- Mail application to county auditor
- Phone contact to county auditor office

**Timeline:** Not specified in search results; varies by county

**Watch out for:**
- One-time application required, but continues automatically once approved—however, counties may have varying documentation requirements for renewal[1]
- If deed is in applicant's name and someone other than spouse, exemption is prorated based on ownership interest shown on deed; full $50,000 only if spouse is co-owner or applicant is sole owner[6]
- Applicant must be 66 years old in the year they qualify (turning 66 in that calendar year), not just 65[7]
- Residency requirement is strict: must be legal SC resident for entire calendar year as of December 31 preceding tax year—one-year gap disqualifies[2][5]
- Applies only to primary legal residence; does not extend to secondary properties, rentals, or investment homes[1]
- Often confused with 'Application for Special Assessment as Legal Residence 4%' administered by Tax Assessor's Office—these are different programs[6]
- For disability claims, applicant must be certified by state or federal agency; self-declaration insufficient. Those not yet classified can apply to state Vocational Rehabilitation agency[2]
- Expired IDs not accepted; must provide valid identification[7]
- Proposed expansion to $150,000 (with 10-year residency) or $75,000 (with 5-year residency) applies only to new applicants after 2025; existing $50,000 exemption holders would receive tripled amount to $150,000[3]

**Data shape:** No income or asset limits. Fixed benefit amount ($50,000) with no variation by household size or priority tier. Statewide program with consistent eligibility but county-level administration. Pending legislation would create tiered benefits based on residency length for new applicants. Creditor protection homestead exemption exists separately ($63,250 individual / $126,500 married) but is distinct from property tax exemption[1].

**Source:** South Carolina Code § 12-37-250[1]

---

### Senior Farmers Market Nutrition Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Total household gross income cannot exceed 185% of the federal poverty income limits. Specific dollar amounts not listed in sources; applicants self-declare annual gross income and household size. Visit DSS.SC.gov for current table by household size[1][2][4].
- Reside in South Carolina
- Apply in person at approved local senior-serving organizations or distribution events in county of residence (some counties like Moncks Corner allow online)
- Must reapply each year
- Proof of identity required (valid SC driver's license or state-issued ID)

**Benefits:** $50 in checks/vouchers usable for fresh, unprocessed fruits, vegetables, honey, and herbs at authorized local farmers’ markets, roadside stands, and community-supported agriculture programs. Program runs May 1 to October 15 (checks redeemable through November 15 in 2024; 2026 dates TBD)[1][2][3][5].
- Varies by: fixed

**How to apply:**
- In-person at approved local senior-serving organizations or distribution events in county of residence (statewide requirement per DSS)
- Online in some counties (e.g., Moncks Corner: specific link not provided in results)
- Phone for info: DSS Coordinator Willie Nixon at 803-898-1760; SCDA Coordinator Anne Nidiffer at 803-734-0347[2][5]
- Website: DSS.SC.gov for eligibility details and events

**Timeline:** Eligibility determination via email (for online) or at event; issued first-come, first-served until funds exhausted[1][2].
**Waitlist:** Possible referral to waiting list if funds low[1][2].

**Watch out for:**
- Program is seasonal and currently ended; returns in 2026—do not apply now[1]
- In-person application required statewide at county events (exceptions rare like Moncks Corner online)[1][3]
- First-come, first-served until funds gone—early application critical[2]
- Must be 60+ on application date; reapply yearly[1][2]
- Only unprocessed local produce; check authorized markets[1][3]

**Data shape:** County-restricted to 42/46 counties with local in-person events; fixed $50 benefit; no asset test or detailed income table in sources (self-declared at 185% FPL); administered by SC DSS with SCDA partnership

**Source:** https://dss.sc.gov/ (via DSS.SC.gov) and https://agriculture.sc.gov/divisions/agency-operations/grants/sfmnp/[1][5]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Healthy Connections Medicaid | benefit | state | deep |
| Community Choices Waiver | benefit | state | deep |
| South Carolina PACE | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| LIHEAP (Home Energy Assistance) | benefit | federal | deep |
| SHIP (I-Care) — State Health Insurance A | resource | federal | simple |
| Meals on Wheels | benefit | federal | medium |
| South Carolina Family Caregiver Support  | benefit | state | medium |
| SCSEP (Senior Community Service Employme | employment | federal | deep |
| Legal Aid for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| State Property Tax Assistance (Homestead | benefit | state | medium |
| Senior Farmers Market Nutrition Program | benefit | local | medium |

**Types:** {"benefit":9,"resource":3,"employment":1}
**Scopes:** {"state":5,"local":2,"federal":6}
**Complexity:** {"deep":6,"simple":3,"medium":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/SC/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 2 programs
- **priority_tier|region|household_size**: 1 programs
- **not_applicable**: 2 programs
- **program_type_and_priority_tier**: 1 programs
- **fixed**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Healthy Connections Medicaid**: Elderly focus on long-term care with strict $2,982 income/$2,000 asset for singles; managed care mandatory post-eligibility; no statewide waitlist info; varies by care need (NFLOC/ADL)
- **Community Choices Waiver**: Income/assets vary by household size with specific FPL tables; tiered priority for slots; NFLOC based on 8+ hours nursing/ADLs; statewide but local offices handle intake
- **South Carolina PACE**: Limited to specific counties/service areas with PACE organizations; no income/asset test for enrollment itself, but tied to Medicare/Medicaid and nursing home-level care; not statewide.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI) with fixed asset caps for individual/couple; QI capped by federal funding availability; statewide but county-administered
- **LIHEAP (Home Energy Assistance)**: County-administered via local agencies with varying income guidelines (60% SMI, FPL), providers, and limits; priority-tiered for vulnerable (elderly prioritized); funds limited/seasonal; no asset test.
- **SHIP (I-Care) — State Health Insurance Assistance Program**: SHIP (I-Care) is a counseling and advocacy program, not a direct benefit program. It has no income or asset limits because it is universally available to Medicare-eligible individuals. Its value lies in helping families navigate complex Medicare and Medicaid rules, not in providing direct financial or service benefits. The program is statewide with centralized contact but counseling can be provided remotely via phone.
- **Meals on Wheels**: Decentralized local providers with no uniform statewide eligibility/income rules; heavy variation by region/provider in age, homebound definition, costs, and delivery; often tied to Medicaid/insurance for free meals
- **South Carolina Family Caregiver Support Program & Respite Care Services**: South Carolina operates multiple overlapping respite and caregiver support programs with different eligibility criteria, age requirements, and benefit structures. The Voucher Program (18-54 caregivers, $500/year) is distinct from the broader Family Caregiver Support Program (55+ caregivers). Enrollment limits vary significantly by program and region, suggesting capacity constraints. The program structure is fragmented across multiple agencies (Area Agencies on Aging, DHHS, DDSN, SC Respite Coalition), requiring applicants to identify which program matches their situation. Income and asset limits are not disclosed in available public documentation, which is unusual for means-tested programs.
- **SCSEP (Senior Community Service Employment Program)**: National program with SC-specific administration via Dept. on Aging and Goodwill grantees; priority-based enrollment; no fixed income table or asset test in sources; benefits fixed at ~20 hrs/wk minimum wage regardless of household size.
- **Legal Aid for Seniors**: No income/asset test but priority-based on need tiers; delivered via 10 regional AAAs/COGs; referrals to means-tested alternatives scale by household FPL and assets.
- **Long-Term Care Ombudsman Program**: no income test; free advocacy service only for LTC facility residents statewide via 10 regional offices; complaint-driven, not enrollment-based; not a qualification/application program but open-access support.
- **State Property Tax Assistance (Homestead Exemption)**: No income or asset limits. Fixed benefit amount ($50,000) with no variation by household size or priority tier. Statewide program with consistent eligibility but county-level administration. Pending legislation would create tiered benefits based on residency length for new applicants. Creditor protection homestead exemption exists separately ($63,250 individual / $126,500 married) but is distinct from property tax exemption[1].
- **Senior Farmers Market Nutrition Program**: County-restricted to 42/46 counties with local in-person events; fixed $50 benefit; no asset test or detailed income table in sources (self-declared at 185% FPL); administered by SC DSS with SCDA partnership

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in South Carolina?
