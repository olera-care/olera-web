# Montana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 9.2m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
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

- **service**: 9 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Big Sky Waiver Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services including: Adult Residential Living, Adult Day Health, Case Management, Chemical Dependency Counseling, Dietician, Environmental Adaptations, Habilitation, Homemaker, Nutrition, Personal Assistance, PERS, Private Duty Nursing, Psychosocial Consultation, Respiratory Therapy, Respite Care, Special Child Care, Transportation, Therapies (OT, PT, Speech), Specially Trained Attendant, Specialized Medical Equipment/Supplies, TBI services.[2]` ([source](https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram[2]))
- **source_url**: Ours says `MISSING` → Source says `https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram[2]`

## New Programs (Not in Our Data)

- **Community First Choice Services (CFCS) / Personal Care Services (PCS)** — service ([source](https://medicaidprovider.mt.gov/12))
  - Shape notes: Two tiers: PCS (basic medically necessary) vs CFCS (NFLOC with extras); auto-upgrade from PCS to CFCS common; self-direct option allows family paid caregivers with restrictions.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](National PACE Association: npaonline.org/eligibility-requirements; Medicare.gov Find a PACE Plan tool))
  - Shape notes: PACE is a highly specialized program with no income or asset testing, making it unique among long-term care programs. Its primary limiting factor is geographic availability rather than financial or demographic criteria. The program requires state certification of nursing facility level of care need, which varies by state definition. Eligibility determination is functional and geographic, not financial. Montana-specific provider information and application procedures are not detailed in available sources; families must contact local PACE organizations directly.
- **Medicaid for the Aged, Blind, and Disabled (ABD)** — service ([source](https://dphhs.mt.gov/SLTC/eligible or https://dphhs.mt.gov/assets/hcsd/mamanual (ABD sections)))
  - Shape notes: Tied to SSI standards with auto-eligibility; separate MWD track for workers; LTC requires NFLOC; income/assets stricter than general Medicaid expansion (138% FPL)[1][2][6]
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** — financial ([source](https://dphhs.mt.gov/ (Montana DPHHS; manuals at dphhs.mt.gov/assets/hcsd/mamanual/)))
  - Shape notes: Tiered by income brackets (QMB 100% FPL, SLMB 120%, QI 135%) with Montana-specific dollar limits from April 1; benefits differ by tier (QMB fullest coverage); statewide but local offices handle apps; asset test applies (not waived); annual FPL updates.
- **SNAP (Food Stamps)** — financial ([source](https://dphhs.mt.gov/HCSD/SNAP))
  - Shape notes: Expanded eligibility for elderly/disabled (200% FPL gross or net/asset test); benefits scale by household size and net income; asset test conditional on income; statewide with local offices.
- **Montana Low Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://dphhs.mt.gov/hcsd/energyassistance/))
  - Shape notes: LIHEAP benefits scale by household size with different income thresholds for households 1-8 members versus 9+ members. The program has a strict seasonal window (October-April applications only) and prioritizes certain demographics (elderly, disabled, young children, SNAP recipients). Weatherization assistance is a separate but related program with different income limits (200% of poverty level) and its own priority system. Asset limits apply but specific exemptions are not detailed in available sources.
- **Weatherization Assistance Program** — service ([source](https://dphhs.mt.gov/HCSD/energyassistance/WeatherizationAssistanceProgram))
  - Shape notes: Tied to LIHEAP with priority tiers by need/vulnerable members; regional sub-grantees handle delivery; 'Weatherization Only' tier up to 200% FPL; annual renewal; homeowner/renter with access agreement.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://dphhs.mt.gov/SLTC/aging/SHIP[1]))
  - Shape notes: no income/asset test; counseling-only service delivered via decentralized local Area Agencies on Aging network; open to all Medicare beneficiaries/families without enrollment barriers
- **Meals on Wheels** — service ([source](No single statewide .gov; local examples: https://www.cascadecountymt.gov/163/Meals-on-Wheels[2]; national locator: https://www.mealsonwheelsamerica.org/find-meals-and-services/[3]))
  - Shape notes: Decentralized by county/local agency; no uniform income/assets; priority-based not strict eligibility; homebound + zone-restricted; OAA-funded with local variations
- **Respite Care (via Big Sky Waiver)** — service ([source](https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram))
  - Shape notes: Tied to Medicaid/NFLOC; services person-centered via case management team; no fixed hours/dollars for respite (tiered by need); statewide but county-administered; no unique income test beyond Medicaid.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://wsd.dli.mt.gov/_docs/wsd-policy/scsep-policy.pdf (Montana SCSEP Policy)[1]))
  - Shape notes: Federally funded with state oversight (MT DLI) and sub-grantee operator (Easterseals-Goodwill); priority tiers determine entry; slots limited by federal grant allocations; income follows annual federal poverty updates, no fixed MT-specific table in sources
- **Legal Services for Seniors** — service ([source](https://dphhs.mt.gov/sltc/aging/legal/))
  - Shape notes: No fixed income/asset limits—case-by-case screening; statewide clinics but local variation in scheduling/providers; focuses on free basic estate planning docs, not full representation or complex cases
- **Long-Term Care Ombudsman Program** — advocacy ([source](https://dphhs.mt.gov/sltc/aging/longtermcareombudsman/))
  - Shape notes: no income/asset/age test; advocacy-only for facility residents statewide via local ombudsmen; open to anyone on behalf of resident

## Program Details

### Big Sky Waiver Program


**Eligibility:**
- Income: 2025 limits: Individual applicant: $967/mo. Married spouses (both applying): $967/mo per applicant. When only one spouse applies, individual limit applies and spouse’s income is disregarded.[1]
- Assets: 2025 limits: Individual: $2,000. Married (both applying): $2,000 each. If only one spouse applies, both spouses' assets counted as jointly owned. Non-countable assets include primary home, household furnishings, one vehicle.[1]
- Montana resident.[7]
- Financially eligible for Medicaid.[2]
- Nursing Facility Level of Care (NFLOC) via in-person or phone interview.[1][2][6]
- Unmet need resolvable only by BSW services; need at least one waiver service monthly.[2][3]

**Benefits:** Home and community-based services including: Adult Residential Living, Adult Day Health, Case Management, Chemical Dependency Counseling, Dietician, Environmental Adaptations, Habilitation, Homemaker, Nutrition, Personal Assistance, PERS, Private Duty Nursing, Psychosocial Consultation, Respiratory Therapy, Respite Care, Special Child Care, Transportation, Therapies (OT, PT, Speech), Specially Trained Attendant, Specialized Medical Equipment/Supplies, TBI services.[2]
- Varies by: priority_tier

**How to apply:**
- Phone referral to Mountain Pacific: (800) 219-7035 or (406) 443-4020.[2]
- County Office of Public Assistance (OPA) for Medicaid eligibility.[2]
- In-person or over-the-phone interview for NFLOC.[1]

**Timeline:** Not specified in sources.
**Waitlist:** Currently has a waiting list.[2]

**Watch out for:**
- Must have unmet need only resolvable by BSW services.[2]
- Waiting list currently exists.[2]
- For couples, asset rules treat as jointly owned even if one applies.[1]
- Primary home exempt, but Medicaid planning may be needed if over limits.[1]
- No strict age minimum; serves elderly, disabled (including children in some services).[2][3][4]

**Data shape:** Medicaid eligibility required first; NFLOC assessment via interview; services for nursing home level care in community; waiting list; no household size-based income scaling beyond spousal rules.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram[2]

---

### Community First Choice Services (CFCS) / Personal Care Services (PCS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Single applicant: $967/month (100% FBR for 2025). Couple (one or both applying): $1,450/month. Must be Medicaid eligible.[1]
- Assets: Single: $2,000. Couple (one or both applying): $3,000. Home equity limit: $730,000 if intent to return and living in home. Home exempt if spouse, minor child, or disabled child of any age lives there.[1]
- Montana resident.
- Medicaid eligible.
- Health condition limits ability to perform ADLs (Activities of Daily Living).
- Participate in screening process by Mountain Pacific Quality Health (MPQH) nurse assessment.
- For CFCS: Nursing Facility Level of Care (NFLOC) required.
- For PCS: Medically necessary assistance.
- Able to direct care or have personal representative.[1][2][4][5]

**Benefits:** In-home personal assistance with ADLs and health maintenance. Additional for CFCS if medically appropriate: Personal Emergency Response System (PERS), community integration, yard hazard removal, correspondence assistance. Self-directed or agency-based; certain family members (adult children, ex-spouses) can be paid caregivers (not spouses, parents, legal guardians).[4][5][6]
- Varies by: priority_tier

**How to apply:**
- Contact local Medicaid office or provider agency for screening (specific phone/website not in results; start via medicaid.mt.gov).
- Screening by Mountain Pacific Quality Health (MPQH) nurse.
- Enroll with Medicaid; select self-directed (e.g., Summit Independent Living) or agency-based.[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Everyone approved for PCS is auto-reviewed for CFCS; CFCS covers 95% of enrollees.[4]
- Must demonstrate capacity to manage program (or via representative); spouses/parents/guardians cannot be paid caregivers.[5][6]
- Home equity counts toward limit unless exemptions apply; potential Medicaid estate recovery on home.[1]
- Requires NFLOC for CFCS (higher than PCS).[1][4]

**Data shape:** Two tiers: PCS (basic medically necessary) vs CFCS (NFLOC with extras); auto-upgrade from PCS to CFCS common; self-direct option allows family paid caregivers with restrictions.

**Source:** https://medicaidprovider.mt.gov/12

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits. PACE has no financial criteria for eligibility determination.[1][3]
- Assets: No asset limits. Financial criteria are not considered in determining eligibility.[1][3]
- Must be certified by your state as meeting the need for nursing home level of care (Nursing Facility Level of Care/NFLOC).[1][3] States define this differently, but it generally means the kind of care and supervision normally associated with a nursing home.[3]
- Must be able to live safely in the community with PACE services at the time of enrollment.[1][3]
- Must live in the service area of a PACE organization.[1][5]
- Cannot be enrolled in a Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan.[1]
- Cannot be enrolled in hospice services or certain other programs.[1]
- Do not need to be enrolled in Medicare or Medicaid to apply, though approximately 90% of participants are dually eligible.[1][3]

**Benefits:** Comprehensive coordinated healthcare and long-term care including: primary care doctor, nurse, therapists, caregivers, social workers, and all medications and services provided by the PACE interdisciplinary team. Once enrolled, participants never pay deductibles or co-pays for any care, medication, or service provided by PACE.[3]
- Varies by: not_applicable — benefits are comprehensive and uniform across the program

**How to apply:**
- Contact your local PACE program directly. Use Medicare's Find a PACE Plan tool to locate programs in your area.[5]
- The National PACE Association website (npaonline.org) provides a directory to find local PACE programs.[1]

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- Geographic availability is the primary barrier: PACE is not available statewide in Montana. Families must verify that a PACE program operates in their specific service area before pursuing eligibility.[5]
- The nursing facility level of care requirement is state-defined and varies: Montana's definition may differ from other states, and certification is required before enrollment.[3]
- Enrollment is voluntary but requires state certification: Simply meeting age and functional criteria is not sufficient; the state must formally certify the applicant's need for nursing home level of care.[1]
- Medicare Advantage plans are incompatible: If the applicant is enrolled in a Medicare Part C (Advantage) plan, they must disenroll before joining PACE.[1]
- No financial assistance for those without Medicaid: While PACE has no income or asset limits, Medicaid beneficiaries receive full coverage. Non-Medicaid beneficiaries must pay a monthly premium.[3]
- The average PACE participant is 76 years old with multiple complex medical conditions: This is not a requirement but reflects the typical population served, suggesting PACE is designed for individuals with significant care needs.[1]

**Data shape:** PACE is a highly specialized program with no income or asset testing, making it unique among long-term care programs. Its primary limiting factor is geographic availability rather than financial or demographic criteria. The program requires state certification of nursing facility level of care need, which varies by state definition. Eligibility determination is functional and geographic, not financial. Montana-specific provider information and application procedures are not detailed in available sources; families must contact local PACE organizations directly.

**Source:** National PACE Association: npaonline.org/eligibility-requirements; Medicare.gov Find a PACE Plan tool

---

### Medicaid for the Aged, Blind, and Disabled (ABD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: ABD follows SSI-related standards for categorically needy eligibility. SSI recipients are automatically eligible without further income test. For non-SSI ABD applicants, countable monthly income must meet or be below SSI standards (exact 2026 FPL-based amounts not specified in sources; general Medicaid limits cited as ~$14,580/year single (~$1,215/month), but ABD ties to SSI which is lower). Medically needy option available if income exceeds via spenddown. Varies by household size per federal SSI rules (e.g., higher for couples). MWD variant (working disabled) allows up to 250% FPL: ~$3,261/month individual, $4,407/month couple (2025 figures)[3][5].
- Assets: Countable assets up to $2,000 for individual, $3,000 for couple[1][2]. Home exempt if spouse, child under 21, or blind/disabled child lives there; otherwise, home equity limit $752,000 (2026)[2]. Retirement accounts excluded for MWD[3]. Other exemptions follow SSI rules (e.g., one vehicle, personal belongings).
- Must be Montana resident and U.S. citizen/qualified alien[4].
- Aged (65+), blind, or disabled per SSA criteria[1][3].
- For long-term care (e.g., nursing home, waivers): Nursing Facility Level of Care (NFLOC) required[2].
- Functional need for ADLs for regular Medicaid LTC[2].
- SSI approval auto-qualifies for ABD Medicaid[2][6].

**Benefits:** Comprehensive Medicaid coverage including vision care, prescription drugs, dental care (limited/zero out-of-pocket)[1]. Long-term services via Regular Medicaid, Nursing Home Medicaid, or Waivers (e.g., home modifications if unable to live safely at home). Covers acute medical needs[8]. No specific dollar amounts or hours stated; full Medicaid benefit package for qualified ABD.
- Varies by: priority_tier

**How to apply:**
- Online: apply.mt.gov[7]
- Phone: Not specified in sources; contact local DPHHS office via dphhs.mt.gov
- Mail/In-person: Local DPHHS offices (statewide via apply.mt.gov screening)[7]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned for ABD; may apply for LTC waivers with potential waitlists (varies by service)

**Watch out for:**
- SSI auto-eligibility often missed; apply for SSI first if applicable[2][6].
- Distinguish ABD (SSI-related, strict assets) from MWD (working disabled, higher income/assets, cost-share fees unless tribal)[3][5].
- Medically needy spenddown required if over categorical limits[4][6].
- Home equity limit $752,000 applies unless exempt occupant[2].
- NFLOC mandatory for nursing/waiver LTC, not just disability[2].
- MWD requires ongoing work activity each benefit month[3].

**Data shape:** Tied to SSI standards with auto-eligibility; separate MWD track for workers; LTC requires NFLOC; income/assets stricter than general Medicaid expansion (138% FPL)[1][2][6]

**Source:** https://dphhs.mt.gov/SLTC/eligible or https://dphhs.mt.gov/assets/hcsd/mamanual (ABD sections)

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Montana-specific limits effective April 1, 2025 (based on Federal Poverty Level with $20 general income disregard): QMB (≤100% FPL): Individual $0-$1,305; Couple $0-$1,763. SLMB (>100%-≤120% FPL): Individual $1,305.01-$1,565; Couple limits follow similar scaling. QI (>120%-≤135% FPL): Individual $1,565.01-$1,761; Couple limits follow similar scaling. Limits change annually April 1; SNAP benefits not counted toward income.[4][6]
- Assets: Countable resources cannot exceed federal standards (typically $9,950 individual/$14,910 couple in recent years, including real estate, retirement accounts, savings/checking; excludes primary home, one car, burial plots up to $1,500, certain other items). Montana follows standards in CMA 001; some states waive assets but Montana applies them. Yearly COLA disregarded for QMB to prevent loss of eligibility.[3][6]
- Must be eligible for Medicare Part A (enrolled or eligible, even if not yet enrolled).
- Montana resident (state Medicaid program).
- U.S. citizen or qualified immigrant.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/deductibles for Medicare-covered Parts A/B services; no billing allowed by providers for Medicare cost-sharing. SLMB: Pays Medicare Part B premiums. QI: Pays Medicare Part B premiums. All auto-qualify for Part D Extra Help (low-income subsidy for prescription drugs). No service hours; premium payments only for SLMB/QI.[2][4][6][7]
- Varies by: priority_tier

**How to apply:**
- Contact Montana state Medicaid agency (DPHHS): Call local office or helpline (specific numbers via dphhs.mt.gov); apply online/mail/in-person through Montana Access Portal or local offices.
- Mail or in-person at county/tribal DPHS offices statewide.
- Phone: Montana Medicaid general inquiry 1-800-362-1504 (or local OCHE offices).

**Timeline:** QMB: Up to 45 days, effective first of month after all info received (no retroactive). SLMB/QI: First of application month, retroactive up to 3 months prior.[2][6]
**Waitlist:** QI may have funding caps federally (first-come, first-served by priority); Montana specifics not detailed but possible waitlist for QI if funds exhausted.

**Watch out for:**
- QI has federal funding limits (priority to highest need; may close enrollment if exhausted).
- QMB no retroactive coverage; apply early. SLMB/QI retro up to 3 months.
- Providers cannot bill QMB enrollees for Medicare cost-sharing (federal protection often overlooked).
- Even if income slightly over, apply—$20 disregard, SNAP exclusion, COLA disregard may qualify.
- Auto-enrolls in Extra Help (Part D LIS); report changes promptly to avoid overpayments.
- Estate recovery does not apply to MSP-paid premiums since 2010.

**Data shape:** Tiered by income brackets (QMB 100% FPL, SLMB 120%, QI 135%) with Montana-specific dollar limits from April 1; benefits differ by tier (QMB fullest coverage); statewide but local offices handle apps; asset test applies (not waived); annual FPL updates.

**Source:** https://dphhs.mt.gov/ (Montana DPHHS; manuals at dphhs.mt.gov/assets/hcsd/mamanual/)

---

### SNAP (Food Stamps)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled, Montana uses expanded eligibility at 200% of federal poverty level (gross income test). If over this limit, qualify via net income and asset tests. Oct 1, 2025–Sept 30, 2026 gross monthly limits: 1 person $2608; 2 people $3526; 3 people $4442; 4 people $5358; 5 people $6276; 6 people $7192; 7 people $8108; each additional +$916. Net income determined after deductions (standard, earned income 20%, dependent care, child support, excess medical >$35 for elderly/disabled, shelter). Households without elderly/disabled face stricter gross/net tests.[1][3]
- Assets: Applies if not meeting expanded categorical eligibility and gross income >200% FPL: $4500 for households with member 60+ or disabled; $2750 for others. Counts: cash, bank accounts, non-exempt property. Exempt: home you live in, vehicles, tax-preferred educational/retirement accounts, combat-related military pay.[3]
- Montana resident
- U.S. citizen or qualifying immigration status for included members
- Social Security number (or apply for one) for all household members applying
- Household defined as those living together who buy/prepare food together (spouses and children under 22 under parents must be one household)
- Able-bodied members 16-59 must register for work (exempt if 60+ or disabled; no work requirements for all-elderly/disabled households)

**Benefits:** Monthly EBT card benefits for food purchases, amount based on net income (roughly $100 more net income = $30 less benefits), with minimum/maximum allotments varying by household size. Exact amounts not fixed but scale with household net income after deductions.[1]
- Varies by: household_size

**How to apply:**
- Online: https://apply.mt.gov (state portal)
- Phone: Contact local office via 1-855-642-8650 or 406-444-2990 (DPHHS helpline)
- Mail: Send application to local SNAP office
- In-person: Local DPHHS offices (find via https://dphhs.mt.gov/HCSD/SNAP)

**Timeline:** Typically 30 days; expedited within 7 days if very low income/no resources.

**Watch out for:**
- Elderly/disabled households skip gross income test if meeting net/asset; many miss expanded 200% FPL eligibility.[1][3]
- Assets only tested if over 200% gross and not categorically eligible; home/vehicles/retirement often exempt.[3]
- Medical expenses >$35/month deductible for 60+/disabled can significantly lower net income.[1]
- Household must include all who buy/prepare food together; spouses/kids under 22 can't separate.[3]
- Work registration required for able-bodied 16-59 unless exempt, but not for all-elderly households.[3][5]

**Data shape:** Expanded eligibility for elderly/disabled (200% FPL gross or net/asset test); benefits scale by household size and net income; asset test conditional on income; statewide with local offices.

**Source:** https://dphhs.mt.gov/HCSD/SNAP

---

### Montana Low Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: For households with 1-8 members: 60% of state median income. For households with 9+ members: 150% of federal poverty level, plus $8,250 for each member over 10. 2025-2026 limits by household size: 1 person ($33,719), 2 ($44,095), 3 ($54,470), 4 ($64,846), 5 ($75,221), 6 ($85,596), 7 ($87,542), 8 ($89,487), 9 ($91,432), 10 ($97,725), 11 ($105,975), 12 ($114,225), 13 ($122,475), 14 ($130,725), 15 ($138,975). Income is calculated as gross monthly household income (before taxes) from all sources for all household members age 18+.[3][4]
- Assets: Asset limit varies by household size, starting at $13,675 for single-person households.[1] Assets include bank accounts, property, real estate, CDs, stocks, and bonds.[2]
- Must pay for heating costs (renters or homeowners eligible).[4]
- All people residing in the dwelling must be included on the application.[6]
- Households with a dependent of an out-of-state resident (typically a parent living in a different state) are ineligible.[4]
- Households where all members receive SNAP are categorically eligible and very likely to receive benefits.[4]
- Households with young children or adults over age 60 are priority households and likely to be prioritized.[4]

**Benefits:** Regular LIHEAP provides one-time heating assistance payments made directly to utility companies. Crisis LIHEAP assists households facing immediate energy emergencies (broken heater, utility shutoff notice, running out of fuel). Benefit amounts are calculated based on household income, household size, and type of fuel used for heating.[1] Cooling assistance is not offered in Montana.[1]
- Varies by: household_size

**How to apply:**
- Online: apply.mt.gov[4]
- Paper application through the Office of Public Assistance (OPA)[4]
- Phone: 1-800-551-3191 (for households with members over 60 or with disabilities)[6]
- In-person: Local eligibility office[6]

**Timeline:** Not specified in search results
**Waitlist:** Funding is limited; some local agencies may stop accepting applications earlier if funds run out.[1]

**Watch out for:**
- Applications are only accepted October 1 – April 30 each year; heating assistance is only available fall and winter.[1][2]
- Roommates sharing the same utility bill are counted as part of the same LIHEAP household, even if they don't share most expenses.[1]
- Cooling assistance is not offered in Montana, only heating.[1]
- Crisis LIHEAP is only available for emergencies (broken furnace, utility shutoff notice), not routine heating needs.[1]
- Check with your local LIHEAP office for exact application deadlines and apply as early as possible, as funding is limited.[1]
- All household members age 18+ must sign the application.[6]
- Households with elderly (60+) or disabled members should call 1-800-551-3191 for application assistance.[6]
- Households receiving SNAP are categorically eligible and receive priority, which means non-SNAP households may face longer waits or lower benefit amounts.[4]

**Data shape:** LIHEAP benefits scale by household size with different income thresholds for households 1-8 members versus 9+ members. The program has a strict seasonal window (October-April applications only) and prioritizes certain demographics (elderly, disabled, young children, SNAP recipients). Weatherization assistance is a separate but related program with different income limits (200% of poverty level) and its own priority system. Asset limits apply but specific exemptions are not detailed in available sources.

**Source:** https://dphhs.mt.gov/hcsd/energyassistance/

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Primarily tied to LIHEAP eligibility: at or below 60% of state median income for households of 1-8 members (specific table not fully detailed in sources; example for larger households at 150% FPL includes: 8 members $52,720 for LIHEAP/60% SMI, $85,194 for 150% FPL, $105,440 for Weatherization Only/200% FPL; 9: $58,100/$87,150/$116,200; 10: $63,480/$95,220/$126,960; scales up for larger sizes). 'Weatherization Only' for otherwise LIHEAP-qualified households up to 200% Federal Poverty Level (FPL). Households on SNAP, SSI, or TANF are automatically eligible. Annual recertification required.[1][2][3][4]
- Assets: Resource limits apply (specific dollar amounts or exemptions not detailed in sources; income and resources considered together).[2][6]
- Must be LIHEAP eligible or qualify for 'Weatherization Only' (up to 200% FPL); home not previously weatherized; homeowners and renters eligible (requires owner/landlord signed access agreement DPHHS-EAP-013 for rentals); priority based on income, energy burden, vulnerable members (elderly, disabled, young children), home condition; U.S. citizen, qualified alien, or lawful permanent resident with SSN verification; tribal members use tribal LIHEAP priority.[1][2][3][4][5]

**Benefits:** Energy efficiency improvements including insulation, air sealing, heating system repairs/replacements, other upgrades; energy education; potential utility discounts. No specific dollar cap or hours stated; prioritized by need.[1][3][4][5][7]
- Varies by: priority_tier

**How to apply:**
- Combined LIHEAP/Weatherization application (2025-2026 version available via local providers); phone (e.g., Action for Eastern Montana not specified, Human Resource Council 406-728-3710); mail/drop-off (e.g., Action for Eastern Montana: 2030 N. Merrill Ave, Glendive MT 59330); fax (e.g., 406-377-3571); local eligibility offices or tribal LIHEAP offices statewide; accepted Oct 1-Apr 30 for standard, anytime via local offices.[1][3][4][6][7]

**Timeline:** Not specified; if approved but not in priority group, reapply after 1 year if no service.[4]
**Waitlist:** Ranked into priority groups by need (special priority for elderly/disabled); priority list used, position checked via local provider.[1][3][4][5][7]

**Watch out for:**
- Must be LIHEAP eligible first (stricter than Weatherization Only at 200% FPL); priority-based waitlist means no guaranteed timeline—reapply after 1 year if not served; rentals need landlord signed access agreement; home must not have been previously weatherized; applications mainly Oct 1-Apr 30, but anytime via locals; regional sub-grantees required—must contact specific office for area; auto-eligibility for SNAP/SSI/TANF but still need application/bills.[1][3][4]

**Data shape:** Tied to LIHEAP with priority tiers by need/vulnerable members; regional sub-grantees handle delivery; 'Weatherization Only' tier up to 200% FPL; annual renewal; homeowner/renter with access agreement.

**Source:** https://dphhs.mt.gov/HCSD/energyassistance/WeatherizationAssistanceProgram

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[1][2]
- Assets: No asset limits or tests apply[1]
- Must be a Medicare beneficiary, family member, or caregiver seeking counseling on Medicare-related issues[1][2]

**Benefits:** Free, confidential one-on-one health-benefits counseling and advocacy including: Medicare eligibility/enrollment/benefits; Part D plan comparisons; related health insurance; Medigap; Medicare Health Plans; Medicare fraud/waste/abuse; long-term care options. Home visits for homebound individuals. Assistance applying for low-income programs like Medicaid, Medicare Savings Programs, Extra Help/Low Income Subsidy[1][2]

**How to apply:**
- Phone: 1-800-551-3191 (statewide, connects to local counselor via Area Agency on Aging)[1]
- Phone: 406-444-4077 (state office)[3]
- In-person or home visit: Arranged via local Area Agency on Aging SHIP counselor after phone contact[1]
- Local examples: Roosevelt County (406-653-6221 or 406-653-6279), Richland County (406-433-3701)[4][5]

**Timeline:** Immediate phone triage with referral to local counselor; appointment scheduling varies by local availability, no fixed statewide timeline specified[1]

**Watch out for:**
- Not affiliated with insurance companies and does not sell insurance—counselors provide objective advice only[1]
- Must call to be connected to local counselor; no central online application[1]
- Primarily for Medicare navigation, not direct financial aid or healthcare services[1][2]
- Homebound services available but require contacting local SHIP first[1]

**Data shape:** no income/asset test; counseling-only service delivered via decentralized local Area Agencies on Aging network; open to all Medicare beneficiaries/families without enrollment barriers

**Source:** https://dphhs.mt.gov/SLTC/aging/SHIP[1]

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits or dollar amounts; income is not a factor for eligibility in Montana programs like Cascade County, but priority given to those with greatest economic need, low income, minorities, rural residents, limited English, or at risk of institutionalization[2]. Some related programs like CSFP require federal income guidelines but not specified here[7].
- Assets: No asset limits mentioned; financial ability may affect suggested donation or fees, not eligibility[1][2][6].
- Homebound or unable to cook/prepare meals due to disability, mobility issues, or health (e.g., post-hospital)[1][2][3][4]
- Reside in program delivery zone/service area[1][2]
- Overall health, mobility, living conditions, and food insecurity assessed via home visit[2]
- May serve spouses/dependents in some programs[1][7]

**Benefits:** Hot, nutritious home-delivered meal (meets 1/2 RDA, low-salt, low-fat) 5 days/week (weekdays), delivered 10am-12:30pm; includes informal welfare check by volunteer driver; may include liquid supplements if physician-ordered[2][6][7]. Suggested donation ~$4.50/meal, adjustable by ability; free/reduced via Medicaid waivers or Medicare Advantage[4][6].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging, senior center, or provider (e.g., Cascade County: call 406-454-6993 or 406-454-6990; kitchen at 1620 12th Avenue North, Great Falls)[2]
- Home visit for assessment (age, health, mobility, meal prep ability, dietary needs, emergency contacts)[1][2]
- Refer via family, doctor, social worker[3]
- For Medicaid-related (Mom's Meals): contact case manager or health plan[4]

**Timeline:** Varies; some within a week, longer with waitlist; home visit scheduled to assess[1][2][5]
**Waitlist:** Possible in some programs, leading to longer processing[1]

**Watch out for:**
- Not statewide—must confirm local delivery zone/provider; outside areas need alternatives[1][2]
- Income not a barrier but affects priority/donation; car ownership or ability to leave home may disqualify[1]
- Requires 5 days/week commitment; short-term (e.g., post-hospital) or long-term, but transition to congregate meals encouraged if able[2][6]
- Separate from Medicaid/Mom's Meals—check waivers for free meals[4]
- No weekends/holidays typically[6]

**Data shape:** Decentralized by county/local agency; no uniform income/assets; priority-based not strict eligibility; homebound + zone-restricted; OAA-funded with local variations

**Source:** No single statewide .gov; local examples: https://www.cascadecountymt.gov/163/Meals-on-Wheels[2]; national locator: https://www.mealsonwheelsamerica.org/find-meals-and-services/[3]

---

### Respite Care (via Big Sky Waiver)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Financially eligible for Montana Medicaid; specific dollar amounts and household size tables follow standard Medicaid thresholds (not detailed in BSW-specific sources; consult county OPA for current SSI-related limits, typically 100% FPL or SSI standard). No BSW-unique income limits stated.
- Assets: Follows Medicaid asset rules; primary home is exempt and not countable. Other assets subject to Medicaid limits (e.g., $2,000 for individual; consult OPA for spousal protections).
- Medicaid enrollment required.
- Nursing Facility Level of Care (NFLOC) via in-person or phone assessment.
- Unmet need resolvable only by BSW services.
- Need at least one waiver service monthly.
- For elderly: physical disabilities or older adults at risk of institutionalization.

**Benefits:** Respite Care as one of many HCBS; provides temporary relief for caregivers. Specifics: up to 30 days annually (extendable without variance for health/safety needs). Delivered in home, family home, provider home, community settings. Part of full list including Personal Assistance, Homemaker, Adult Day Health, Nursing, Therapies.
- Varies by: priority_tier

**How to apply:**
- Phone referral to Mountain Pacific: (800) 219-7035 or (406) 443-4020.
- County Office of Public Assistance (OPA) for Medicaid eligibility.
- No specific online URL or mail/in-person detailed beyond phone/county offices.

**Timeline:** Not specified in sources.
**Waitlist:** Likely due to waiver caps (not explicitly stated; common for HCBS waivers).

**Watch out for:**
- Must already qualify for Medicaid; BSW is waiver on top.
- Requires NFLOC (nursing home level) – not for low needs.
- Respite limited to 30 days/year base (extendable case-by-case).
- Waiver slots may be capped, leading to waitlists.
- Primary home exempt, but other assets count per Medicaid rules.
- Not just respite – part of comprehensive plan; unmet need must justify waiver services.

**Data shape:** Tied to Medicaid/NFLOC; services person-centered via case management team; no fixed hours/dollars for respite (tiered by need); statewide but county-administered; no unique income test beyond Medicaid.

**Source:** https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually via HHS Poverty Guidelines (effective January 15, 2025). Families must check current guidelines at the application stage, as specific tables are not detailed in Montana sources but follow federal standards[2].
- Assets: No asset limits mentioned in sources[1][2][5].
- Unemployed or underemployed
- Low-income (≤125% federal poverty level)
- U.S. work authorization required (must verify)
- Priority for: veterans and qualified spouses, individuals over 65, those with disabilities, low literacy skills, limited English proficiency, rural residents, homeless/at risk of homelessness, low employment prospects, or prior American Job Center users[2]

**Benefits:** Paid community service work experience at non-profit/public sites (e.g., schools, hospitals, senior centers); average 20 hours/week at highest of federal/state/local minimum wage; training including resume workshops, interviewing, computer skills, literacy, English proficiency; job placement assistance and leads to unsubsidized employment; assignments last 6-12 months[2][5].
- Varies by: priority_tier

**How to apply:**
- Contact Easterseals-Goodwill Northern Rocky Mountain (SCSEP sub-grantee for Montana): www.esgw.org/scsep[5]
- Call national SCSEP toll-free help line: 1-877-872-5627 (1-877-US2-JOBS)[2]
- Visit Montana Department of Labor & Industry Workforce Services Division (grantee) or Job Service Montana offices for referrals/orientation[1]
- Use CareerOneStop's Older Worker Program Finder for local programs[2]

**Timeline:** Not specified in sources
**Waitlist:** Likely due to limited slots (federally allocated); varies by region and provider capacity[5]

**Watch out for:**
- Must be assigned to a community service worksite before any training; no direct cash assistance—focus is transitional employment[1]
- Ineligible applicants referred to Job Service Montana, not guaranteed entry[1]
- Limited federal slots lead to waitlists/priority screening[2][5]
- Income test strictly at 125% poverty level—updates annually, so verify current figures[2]
- Not permanent jobs; designed as bridge to unsubsidized private employment[2][5]

**Data shape:** Federally funded with state oversight (MT DLI) and sub-grantee operator (Easterseals-Goodwill); priority tiers determine entry; slots limited by federal grant allocations; income follows annual federal poverty updates, no fixed MT-specific table in sources

**Source:** https://wsd.dli.mt.gov/_docs/wsd-policy/scsep-policy.pdf (Montana SCSEP Policy)[1]

---

### Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits mentioned; program targets low-income individuals but eligibility is determined by providers like Montana Legal Services Association (MLSA) based on household income, assets, citizenship status, and legal problem details. For related low-income legal aid via MLSA, screening includes income and assets without fixed dollar amounts provided[8][10].
- Assets: Assets considered in screening by MLSA, but no specific dollar limits or exemptions detailed[8][10].
- Montana resident
- Low-income status (screened case-by-case)
- Civil legal issues related to aging, disability, or estate planning
- For some providers like MLSA, U.S. citizenship or eligible immigration status

**Benefits:** Free legal advice clinics, telephone consultations, help drafting/reviewing/notarizing estate planning documents (wills, powers of attorney, transfer deeds, living wills, health care power of attorney, declaration of homestead), referrals to legal/advocacy organizations, training/education for seniors/caregivers/professionals, annual estate planning clinics statewide. Services limited to basic estate planning; does not cover complex estates, large assets, or trusts[4].

**How to apply:**
- Online application via Montana Legal Services Association (MLSA) at montanalawhelp.org/apply-legal-services or mtlawhelp.org/apply-legal-services[8][10]
- Phone: MLSA Helpline 1-800-666-6899 (Tue-Thu 9am-1pm MT); Legal Services Developer Program 1-800-332-2272[8][9]
- In-person: Statewide legal document clinics hosted by Montana Aging Services Bureau (locations vary, check DPHHS for schedule)[4]
- Mail: Not specified, but online/phone lead to intake

**Timeline:** MLSA: Expect callback in 3-5 business days; urgent deadlines noted on application get priority[8].
**Waitlist:** High call volume may cause delays; keep trying phone or use online form[8].

**Watch out for:**
- Services limited to basic estate planning only—no complex estates, large assets, trusts, or non-civil matters[4]
- Simple statutory forms may not suit all situations; consult licensed attorney for complex needs[4]
- High phone volume at MLSA; use online form if can't get through[8]
- Individuals under 60 directed to MLSA or State Bar, not this program[4]
- No compensation allowed for emeritus attorneys in related pro bono (separate program)[2]

**Data shape:** No fixed income/asset limits—case-by-case screening; statewide clinics but local variation in scheduling/providers; focuses on free basic estate planning docs, not full representation or complex cases

**Source:** https://dphhs.mt.gov/sltc/aging/legal/

---

### Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Resident of a nursing home, assisted living facility, or Critical Access Hospital (including swing beds) in Montana.
- Or family member, friend, staff, or any concerned individual on behalf of such a resident.

**Benefits:** Investigation and resolution of complaints related to resident rights, quality of care/life, administrative decisions, Medicaid/Medicare/long-term care programs, improper transfer/discharge, abuse/neglect/exploitation, and quality of life/well-being. Provides information on long-term care issues/services/placement options, referrals to aging services, assistance for staff, public education, advocacy for legislation/policies, and promotion of resident/family councils. All contacts confidential; services at resident's request.

**How to apply:**
- Phone: 1-800-332-2272 (State Long Term Care Ombudsman, business hours only; emergencies call 911).
- Local Ombudsman via Area Agencies on Aging or County Councils on Aging (statewide directory at https://dphhs.mt.gov/sltc/aging/longtermcareombudsman/).
- Mail: Montana Senior and Long Term Care, PO Box 4210, Helena, MT 59604.
- In-person: Local ombudsman offices through Area Agencies on Aging.

**Timeline:** Immediate response to complaints; ombudsmen move into action at resident's request.

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy and complaint resolution; no direct services like personal care or funding.
- Help line business hours only (not 24/7); for emergencies, call 911.
- Must be for residents in certified long-term care facilities—does not cover home-based or independent living.
- Ombudsmen act at resident's request and maintain confidentiality; family cannot override resident wishes.
- Separate from Mental Health Ombudsman or Child and Family Ombudsman.

**Data shape:** no income/asset/age test; advocacy-only for facility residents statewide via local ombudsmen; open to anyone on behalf of resident

**Source:** https://dphhs.mt.gov/sltc/aging/longtermcareombudsman/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Big Sky Waiver Program | benefit | state | deep |
| Community First Choice Services (CFCS) / | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicaid for the Aged, Blind, and Disabl | benefit | state | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | deep |
| SNAP (Food Stamps) | benefit | federal | deep |
| Montana Low Income Home Energy Assistanc | navigator | federal | simple |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels | benefit | federal | medium |
| Respite Care (via Big Sky Waiver) | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"navigator":1,"resource":3,"employment":1}
**Scopes:** {"state":5,"local":1,"federal":8}
**Complexity:** {"deep":9,"simple":4,"medium":1}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/MT/drafts.json`.

- **Big Sky Waiver Program** (benefit) — 4 content sections, 6 FAQs
- **Community First Choice Services (CFCS) / Personal Care Services (PCS)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 2 content sections, 6 FAQs
- **Medicaid for the Aged, Blind, and Disabled (ABD)** (benefit) — 5 content sections, 6 FAQs
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Food Stamps)** (benefit) — 4 content sections, 6 FAQs
- **Montana Low Income Home Energy Assistance Program (LIHEAP)** (navigator) — 2 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 5 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels** (benefit) — 4 content sections, 6 FAQs
- **Respite Care (via Big Sky Waiver)** (benefit) — 4 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Legal Services for Seniors** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **not_applicable — benefits are comprehensive and uniform across the program**: 1 programs
- **household_size**: 2 programs
- **not_applicable**: 3 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Big Sky Waiver Program**: Medicaid eligibility required first; NFLOC assessment via interview; services for nursing home level care in community; waiting list; no household size-based income scaling beyond spousal rules.
- **Community First Choice Services (CFCS) / Personal Care Services (PCS)**: Two tiers: PCS (basic medically necessary) vs CFCS (NFLOC with extras); auto-upgrade from PCS to CFCS common; self-direct option allows family paid caregivers with restrictions.
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE is a highly specialized program with no income or asset testing, making it unique among long-term care programs. Its primary limiting factor is geographic availability rather than financial or demographic criteria. The program requires state certification of nursing facility level of care need, which varies by state definition. Eligibility determination is functional and geographic, not financial. Montana-specific provider information and application procedures are not detailed in available sources; families must contact local PACE organizations directly.
- **Medicaid for the Aged, Blind, and Disabled (ABD)**: Tied to SSI standards with auto-eligibility; separate MWD track for workers; LTC requires NFLOC; income/assets stricter than general Medicaid expansion (138% FPL)[1][2][6]
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)**: Tiered by income brackets (QMB 100% FPL, SLMB 120%, QI 135%) with Montana-specific dollar limits from April 1; benefits differ by tier (QMB fullest coverage); statewide but local offices handle apps; asset test applies (not waived); annual FPL updates.
- **SNAP (Food Stamps)**: Expanded eligibility for elderly/disabled (200% FPL gross or net/asset test); benefits scale by household size and net income; asset test conditional on income; statewide with local offices.
- **Montana Low Income Home Energy Assistance Program (LIHEAP)**: LIHEAP benefits scale by household size with different income thresholds for households 1-8 members versus 9+ members. The program has a strict seasonal window (October-April applications only) and prioritizes certain demographics (elderly, disabled, young children, SNAP recipients). Weatherization assistance is a separate but related program with different income limits (200% of poverty level) and its own priority system. Asset limits apply but specific exemptions are not detailed in available sources.
- **Weatherization Assistance Program**: Tied to LIHEAP with priority tiers by need/vulnerable members; regional sub-grantees handle delivery; 'Weatherization Only' tier up to 200% FPL; annual renewal; homeowner/renter with access agreement.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling-only service delivered via decentralized local Area Agencies on Aging network; open to all Medicare beneficiaries/families without enrollment barriers
- **Meals on Wheels**: Decentralized by county/local agency; no uniform income/assets; priority-based not strict eligibility; homebound + zone-restricted; OAA-funded with local variations
- **Respite Care (via Big Sky Waiver)**: Tied to Medicaid/NFLOC; services person-centered via case management team; no fixed hours/dollars for respite (tiered by need); statewide but county-administered; no unique income test beyond Medicaid.
- **Senior Community Service Employment Program (SCSEP)**: Federally funded with state oversight (MT DLI) and sub-grantee operator (Easterseals-Goodwill); priority tiers determine entry; slots limited by federal grant allocations; income follows annual federal poverty updates, no fixed MT-specific table in sources
- **Legal Services for Seniors**: No fixed income/asset limits—case-by-case screening; statewide clinics but local variation in scheduling/providers; focuses on free basic estate planning docs, not full representation or complex cases
- **Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy-only for facility residents statewide via local ombudsmen; open to anyone on behalf of resident

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Montana?
