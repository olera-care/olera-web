# Maryland Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 17 |
| New (not in our data) | 17 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **in_kind**: 2 programs
- **service**: 8 programs
- **financial**: 5 programs
- **employment**: 1 programs
- **unknown**: 1 programs

## New Programs (Not in Our Data)

- **Maryland Durable Medical Equipment Reuse Program (DME)** — in_kind ([source](https://aging.maryland.gov/pages/dmehp.aspx))
  - Shape notes: No income/asset/age tests; healthcare provider-gated; inventory-driven with statewide satellites but main processing in Cheltenham; donation-reliant with no fixed quantities.
- **Maryland Community First Choice (CFC) and Home and Community-Based Services (HCBS) Waivers** — service ([source](https://health.maryland.gov (general MD Dept. of Health); specific CFC pages not directly linked in results))
  - Shape notes: CFC is entitlement (no waitlist, immediate if eligible) vs. slot-limited HCBS Waivers; eligibility ties to specific public benefits or Waivers with varying income; services personalized via plan of service assessment
- **Maryland Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://regs.maryland.gov/us/md/exec/comar/10.09.44.05 (Maryland regulations); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal Medicaid PACE information)))
  - Shape notes: Maryland PACE is geographically restricted by provider service areas (only PACE of West Baltimore detailed in search results). No statewide income or asset limits exist for program eligibility, but Medicaid coverage (used by ~90% of participants) has strict financial limits. The program is all-or-nothing: participants must use PACE exclusively for all services. Search results do not provide comprehensive statewide provider list, application processing times, or detailed benefit specifications beyond 'comprehensive services.'
- **Maryland Medicare Savings Program (MSP) including QMB, SLMB, QI** — financial ([source](https://health.maryland.gov/mmcp/eligibility/Pages/medicare-savings-programs.aspx[10]))
  - Shape notes: Tiered by income brackets (QMB/SLMB/QI) with household size scaling; asset exemptions detailed; annual reapplication and QI funding caps create unique renewal/wait dynamics
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://dhs.maryland.gov/supplemental-nutrition-assistance-program/))
  - Shape notes: Expanded to 200% FPL gross income; special elderly/disabled rules skip gross test; state minimum benefit supplement for 62+; benefits scale by household size and net income
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://dhs.maryland.gov/office-of-home-energy-programs/[4][8]))
  - Shape notes: Administered via OHEP as MEAP (heating) and EUSP (electric); income-based statewide with local offices; categorical eligibility for SNAP/TCA; benefits vary by fuel type, size, crisis status; year-round but heating-focused with limited funds
- **Weatherization Assistance Program (WAP)** — service ([source](https://dhcd.maryland.gov/Energy-Home-Repair/pages/homeowner-grants/wap.aspx))
  - Shape notes: Administered statewide by DHCD but via local agencies with regional providers and slight priority variations; income max(60% SMI, 200% FPL); strong priority tiers heavily favor elderly/disabled/families; automatic eligibility tied to specific aid programs only.
- **Meals on Wheels (via Senior Care Services and Area Agencies on Aging)** — service ([source](https://www.mealsonwheelsamerica.org/find-meals-and-services/ (national locator; contact Maryland AAoAs via aging.maryland.gov)))
  - Shape notes: Highly decentralized by county/provider via local Area Agencies on Aging; no uniform income table or statewide asset test; contact local AAoA required for precise details
- **National Family Caregiver Support Program** — service ([source](https://aging.maryland.gov/pages/national-family-caregiver-support.aspx[1]))
  - Shape notes: Administered through local Area Agencies on Aging with no statewide income/asset tests; services capped as 'limited basis' for some categories; regional provider variations require local contact[1][5][7]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://labor.maryland.gov/employment/scsep.shtml))
  - Shape notes: Delivered via county-specific sub-grantees under state oversight; income tied to 125% FPL (updates annually, verify current); no statewide uniform application—use regional contacts; limited slots imply waitlists by region.
- **Legal Aid for Seniors (via Maryland Legal Aid and Area Agencies on Aging)** — service ([source](https://aging.maryland.gov/pages/senior-legal-assistance.aspx))
  - Shape notes: This program is complex because it comprises multiple overlapping programs (Maryland Legal Aid, Sixty Plus Legal Program, Senior Legal Services, Senior Legal Helpline) with slightly different eligibility criteria, service areas, and income limits. Benefits are service-based (free legal representation) rather than financial. Eligibility varies by household size (income/asset limits scale for couples vs. individuals). Geographic variation is significant: some programs are Baltimore City-only, others are statewide. Income limits are tied to federal poverty guidelines, which change annually. Priority-tier system means acceptance depends on both meeting income/asset thresholds AND case type AND relative economic need. No specific processing times or waitlist information is publicly available.
- **Maryland Long-Term Care Ombudsman Program** — unknown
  - Shape notes: This program has a fundamentally different structure than typical benefits programs. It is a statewide advocacy network with no eligibility barriers, no application process, and no financial benefits. The 'gotcha' is that families often confuse this with a financial assistance or care coordination program when it is purely an independent advocacy and complaint resolution service.
- **Maryland Senior Call Check Program (SCC)** — service ([source](https://aging.maryland.gov/pages/senior-call-check.aspx))
  - Shape notes: No financial means test; purely welfare check service via daily automated calls with escalation to alternate and law enforcement; centrally managed statewide with no county variations or caps.
- **Senior Assisted Living Subsidy Program (SALS)** — financial ([source](https://aging.maryland.gov/pages/senior-assisted-living-subsidy-program.aspx[1]))
  - Shape notes: This is a statewide program with county-level administration, creating regional variation in wait times, participating facilities, and specific contact procedures. Benefits are fixed at a maximum of $1,000/month but vary by individual based on income and approved facility costs. Eligibility is determined by a combination of age (62+), functional need (24-hour supervision requirement), income (60% of state median), and assets ($20,064 individual/$26,400 couple). The program has a significant waitlist due to limited state funding. Unlike some assistance programs, SALS does not have tiered benefits or priority levels — it operates on first-come, first-served basis once all eligibility steps are complete.
- **Senior Care Services Program** — service ([source](https://aging.maryland.gov/pages/senior-care.aspx))
  - Shape notes: County-administered via local AAAs with varying contacts and funding; no fixed income/asset dollar limits published centrally (assessed locally); benefits via gap-filling only if funds available; requires county residency match
- **MTA Senior Discount Program (Reduced Fare CharmCard®)** — financial ([source](https://www.mta.maryland.gov/senior-reduced-fare-program))
  - Shape notes: no income test; ID-based only; transitioning from physical CharmCard to mobile CharmPass app; uniform eligibility statewide on MTA services
- **Golden Age Pass** — in_kind ([source](https://dnr.maryland.gov/publiclands/pages/goldenage.aspx))
  - Shape notes: This is a straightforward, fixed-benefit program with no income or asset testing. The primary complexity lies in the multi-step process for certain parks (obtaining swipe cards after pass receipt) and the restriction of camping discounts to specific days and seasons. Unlike many senior programs, there is no tiered benefit structure, no household-size variation, and no waitlist. The $10 lifetime fee is the only cost.

## Program Details

### Maryland Durable Medical Equipment Reuse Program (DME)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits or requirements. Open to all Maryland residents regardless of income or insurance status.
- Assets: No asset limits or requirements.
- Must be a Maryland resident.
- Any injury, illness, or medical status (including disability).
- Must have exhausted all other means of attaining DME (e.g., insurance, other programs).
- Requests must be initiated by healthcare professionals (PT, OT, MD, DO, PA, or CRNP); power wheelchairs/scooters require PT or OT only.

**Benefits:** Free gently-used, sanitized, and refurbished durable medical equipment including: canes, crutches, walkers, rollators, shower chairs, tub transfer benches, bedside commodes, toilet safety rails, transfer boards, manual wheelchairs, transport wheelchairs, knee scooters, semi/electric hospital beds, patient (Hoyer) lifts, trapeze bars, power wheelchairs, power scooters, upright rollators, rolling shower chairs, bedrails, over bed tables, toilet risers. No dollar limit; based on availability and inventory from donations. Unlimited borrowing time.

**How to apply:**
- Online: Basic DME Request Form via https://onestop.md.gov/forms/basic-durable-medical-equipment-request-form-618bcb19e9b09f023f463960 or Complex DME Request Form (download from https://aging.maryland.gov/pages/dmehp.aspx).
- Email: Scan and email completed form to dme.mdoa@maryland.gov.
- Mail: Maryland Durable Medical Equipment Re-Use, 11701 Crain Highway, Cheltenham, MD 20623.
- Phone: 240-230-8000 (to inquire or verify stock).

**Timeline:** Not specified; after review, contacted via provided phone/email to notify if in-stock and schedule pickup.
**Waitlist:** No waitlist mentioned; depends on inventory availability. Limited inventory due to reliance on donations.

**Watch out for:**
- Must exhaust all other means first (e.g., insurance denials or delays).
- No delivery; must pick up in person at Cheltenham or satellite sites.
- Limited inventory based on donations; call ahead to verify stock.
- Healthcare professional must initiate/complete form; patient/caregiver cannot submit alone.
- Complex items require specific provider signatures (PT/OT for power equipment).
- Program reserves service for those with no other options due to limited supply.

**Data shape:** No income/asset/age tests; healthcare provider-gated; inventory-driven with statewide satellites but main processing in Cheltenham; donation-reliant with no fixed quantities.

**Source:** https://aging.maryland.gov/pages/dmehp.aspx

---

### Maryland Community First Choice (CFC) and Home and Community-Based Services (HCBS) Waivers

> **NEW** — not currently in our data

**Eligibility:**
- Income: For non-Medicare eligible individuals: up to $16,105/year for a single person, $21,707/year for a couple. Higher income allowed if qualifying via certain Medicaid Waivers like Community Options or SSI. SSI recipients automatically qualify for Medicaid and thus CFC[1][3].
- Assets: Not specified in available sources; general Maryland Medicaid asset limits apply (typically $2,500 for individual, $6,000 for couple, excluding home, one vehicle, personal belongings, burial plots). Live-in caregiver exemption may apply separately[5].
- Financially eligible for Maryland Medicaid
- Medically eligible (need for personal care assistance, assessed by local health department)
- Receive public benefits like Medicaid, SSI, TCA, foster care, or enrolled in a Medicaid Waiver (e.g., Home and Community-Based Options Waiver). Not eligible if only on Medicare, private insurance, QMB, or SLMB[3][6]

**Benefits:** Personal care assistance and limited Home and Community-Based Services (HCBS) such as help with daily activities (bathing, eating, mobility). Specific hours determined by supports planner via 'plan of service' assessment. Fewer services than HCBS Waivers[4][6][7].
- Varies by: priority_tier

**How to apply:**
- Contact local health department or supports planner for assessment and plan of service
- Mail or fax appeal/denial to: Maryland Department of Health, Office of Health Services, Attention: Appeals, 201 W. Preston St., 1st Floor, Baltimore, MD 21201; Fax: 410-333-5154[6]
- No specific online URL or phone listed; use Maryland Medicaid eligibility test via American Council on Aging[1]

**Timeline:** Not specified; Medicaid staff reviews assessment and plan of service after local health department evaluation[6].
**Waitlist:** No waitlist for CFC (entitlement program); immediate services if eligible. HCBS Waivers have waitlists[4].

**Watch out for:**
- CFC has stricter income limits than some Waivers; higher income possible via Waiver enrollment[1][4]
- Not all Medicaid recipients qualify—must receive specific benefits and be medically needy[3][6]
- Fewer services than HCBS Waivers; check needs before choosing[4]
- Waivers have waitlists, CFC does not[4]
- Must appeal denials within 10 days to continue benefits[3][6]
- Inadequate financial planning leads to denial[1]

**Data shape:** CFC is entitlement (no waitlist, immediate if eligible) vs. slot-limited HCBS Waivers; eligibility ties to specific public benefits or Waivers with varying income; services personalized via plan of service assessment

**Source:** https://health.maryland.gov (general MD Dept. of Health); specific CFC pages not directly linked in results

---

### Maryland Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for program eligibility itself[4]. However, for Medicaid coverage (which most participants use), income must not exceed 300% of the Federal Benefit Rate (approximately $2,901/month for 2025)[3]. Medicare has no income test[4].
- Assets: No asset limits for program eligibility itself[4]. For Medicaid coverage, assets (excluding primary home and one automobile) must not exceed $2,000[3][7].
- Reside in the PACE approved service area upon enrollment[1][2]
- Be certified by the state as needing nursing home level of care (requiring extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, eating)[3][4]
- Be able to be maintained in a community-based setting with PACE assistance without jeopardizing the participant's or others' health or safety[1][2]
- Be willing to receive all health and long-term care services exclusively from the PACE provider and its contracted or referred providers[1][2]
- Not be enrolled in Medicare Advantage (Part C), Medicare prepayment plans, Medicare prescription drug plans, or hospice services[4]
- For Medicare: Be a U.S. citizen or legal resident for 5 years prior to application, and be age 65+ OR disabled OR have ALS OR have end-stage renal disease[3]

**Benefits:** Comprehensive health and long-term care services provided as the sole source of care for Medicare/Medicaid eligible enrollees. Services include medical care, preventive services, hospitalization, prescription drugs, and long-term care services[5]. Approximately 90% of participants are dually eligible for Medicare and Medicaid, with costs covered by these programs[4]. Private pay option available at approximately $7,000+ monthly or $200-$900 monthly 'share of cost'[7].
- Varies by: Medicare/Medicaid eligibility status and private pay option

**How to apply:**
- In-person at PACE of West Baltimore (specific address not provided in search results)
- Phone contact with PACE of West Baltimore (specific phone number not provided in search results)
- Contact through PACE provider's enrollment office

**Timeline:** Not specified in available search results
**Waitlist:** Not specified in available search results

**Watch out for:**
- No income or asset limits for program eligibility, but most participants need Medicaid to afford it—and Medicaid has strict income ($2,901/month) and asset ($2,000) limits[3][4][7]
- Participants must receive ALL services exclusively from the PACE provider—cannot use outside providers[1][2]
- Cannot be enrolled in Medicare Advantage, Medicare prescription drug plans, or hospice simultaneously[4]
- Nursing home level of care certification is required and varies by state definition[3]
- Approximately 99% of PACE participants are dual-eligible for Medicare and Medicaid; private pay is expensive ($7,000+/month)[7]
- Enrollment is voluntary but once enrolled, PACE becomes the sole source of Medicare/Medicaid services[5]
- Participants can leave the program at any time for any reason[5]
- The interdisciplinary team must assess whether the individual can be safely cared for in a community setting before enrollment[2]

**Data shape:** Maryland PACE is geographically restricted by provider service areas (only PACE of West Baltimore detailed in search results). No statewide income or asset limits exist for program eligibility, but Medicaid coverage (used by ~90% of participants) has strict financial limits. The program is all-or-nothing: participants must use PACE exclusively for all services. Search results do not provide comprehensive statewide provider list, application processing times, or detailed benefit specifications beyond 'comprehensive services.'

**Source:** https://regs.maryland.gov/us/md/exec/comar/10.09.44.05 (Maryland regulations); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal Medicaid PACE information)

---

### Maryland Medicare Savings Program (MSP) including QMB, SLMB, QI

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income limits are based on % of Federal Poverty Level (FPL), updated annually (typically April 1), and vary by program tier and household size (individual or couple). Must be eligible for Medicare Part A (even if not enrolled) and not financially eligible for full Medicaid. Maryland follows federal standards:
- **QMB**: ≤100% FPL (e.g., ~$1,235 single/$1,663 couple monthly in recent data)[2][6]
- **SLMB**: >100% to ≤120% FPL (e.g., ~$1,478 single/$1,992 couple)[2][6]
- **QI (QI-1 or SLMB II in MD)**: >120% to ≤135% FPL (e.g., ~$1,660 single/$2,239 couple)[4][6]
Exact current limits posted on Medicare.gov; check for 2026 updates as figures vary yearly[1][2][9]. Limits may differ if working[2].
- Assets: Maryland uses federal asset limits: $9,430 individual / $14,130 couple (2024 figures; confirm current on Medicare.gov)[5][7]. Countable assets include cash, bank accounts, stocks, bonds. Exempt: primary home, one car, $1,500 burial fund, burial plot, life insurance (cash value <$1,500), furniture, household/personal items[2][4].
- Eligible for Medicare Part A (65+ or disabled, even if not enrolled)
- Maryland resident
- Not financially eligible for full Medical Assistance (Medicaid)
- U.S. citizen or qualified immigrant

**Benefits:** **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/deductibles for A/B services[1][2][3][8]. **SLMB**: Pays Part B premiums[1][3]. **QI-1**: Pays Part B premiums (retroactive to Jan 1 of application year if eligible)[3][4]. State covers these via Medical Assistance; QMB recipients get gray/white QMB card, must use providers accepting Medicare/QMB[8].
- Varies by: priority_tier

**How to apply:**
- Online: https://www.marylandhealthconnection.gov/[4]
- Phone: (855) 642-8572 (toll-free) or TTY (855) 642-8573[4]
- In-person: Local Department of Social Services office[4]
- Mail: Download application from Maryland Department of Human Resources Medical Assistance page[4]

**Timeline:** QMB effective first day of month after determination; SLMB/QI specifics not detailed but annual reapplication required[3][4].
**Waitlist:** QI granted first-come, first-served with priority to prior-year recipients; potential waitlist if funds exhausted[4].

**Watch out for:**
- Must reapply every year[4]
- QI has limited funding—first-come/priority for renewals; may exhaust[4]
- No retroactive QMB coverage before application month[3]
- Providers must accept Medicare/QMB for full benefits (QMB gotcha)[8]
- Income/assets counted net; working income may adjust limits[2]
- Outdated limits in sources—always verify current FPL-based figures on Medicare.gov[1][2][9]

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) with household size scaling; asset exemptions detailed; annual reapplication and QI funding caps create unique renewal/wait dynamics

**Source:** https://health.maryland.gov/mmcp/eligibility/Pages/medicare-savings-programs.aspx[10]

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Maryland uses expanded eligibility at 200% of federal poverty level for gross income (Oct 1, 2025 - Sept 30, 2026): 1 person $2608/month, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, each additional +$916. Households with member 60+ or disabled may qualify via net income and asset tests if over gross limit. Standard limits shown elsewhere at 130% gross/100% net, but Maryland encourages applications up to 200%[1][3]. Elderly/disabled separate household: 165% poverty (e.g., 1 person $2152/month)[7].
- Assets: Households with member 60+ or disabled: $3001 combined bank savings/checking; others $2001. Exemptions not detailed, but standard SNAP excludes home, most vehicles, retirement accounts[6]. Many households exempt from asset test[1].
- Maryland resident
- U.S. citizen or qualified non-citizen with proof
- Social Security number for all household members
- Able-bodied adults 16-60 (with exceptions) must register for work, accept suitable employment, participate in employment/training; unemployed childless adults limited to 3 months every 3 years[5][6]
- Household includes those who buy/prepare food together[2]

**Benefits:** Monthly EBT card (Maryland Independence Card) for groceries at stores/farmers markets. Amount based on net income ($100 more net income = ~$30 less benefit). Minimums: $50 if anyone 60+, $30 for 62+ per state law (effective Oct 1). Averages ~$188/month for seniors. Max allotment table (e.g., 1 person $298, 2 $546)[1][3][4][7].
- Varies by: household_size

**How to apply:**
- Online: myDHR portal at dhs.maryland.gov (mydhrbenefits.dhr.state.md.us)
- Phone: 1-800-332-6347
- In-person: local Department of Human Services office
- Mail: to local DHS office

**Timeline:** Must be interviewed and meet eligibility; expedited for urgent cases, otherwise 30 days typical[9][10].

**Watch out for:**
- Elderly/disabled households skip gross income test, use net/asset only if over limit—many miss this expanded path[1]
- Maryland's 200% FPL gross is broader than federal 130%; other sites show stricter limits[1][3]
- Minimum benefits state-boosted ($30+ for 62+), but still low—worth applying[4]
- Work registration required for able-bodied 16-60 unless exempt; 3-month limit for childless unemployed[6]
- Include all who buy/prepare food as household[2]
- Medical deductions key for seniors—provide expense proofs[5]

**Data shape:** Expanded to 200% FPL gross income; special elderly/disabled rules skip gross test; state minimum benefit supplement for 62+; benefits scale by household size and net income

**Source:** https://dhs.maryland.gov/supplemental-nutrition-assistance-program/

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly income at or below 150% of Federal Poverty Guidelines (FY26): 1: $2,608; 2: $3,525; 3: $4,441; 4: $5,358; 5: $6,275; 6: $7,191; 7: $8,108; 8: $9,025; 9: $9,942; 10: $10,859; 11+: Contact local OHEP office[1][4]
- Assets: No asset limit[1]
- Household includes everyone at the address covered by the utility bill[1]
- SNAP or TCA recipients are categorically eligible without additional application or documentation[5]
- Proof of residency and SSN for all household members required[2][4]

**Benefits:** MEAP (heating): $25 minimum to $750 maximum; Crisis (winter): up to $600; EUSP (electric): separate grant once per July-June year; payments made directly to utility/fuel supplier[1][8]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://marylandbenefits.gov or https://mydhrbenefits.dhr.state.md.us[5][6]
- Phone: 1-800-332-6347[4][5][7]
- Mail: To local OHEP office[4][7]
- In-person: Local OHEP/energy office or home visits for seniors/disabled[5][7]

**Timeline:** Not specified; apply early as funding limited[1]
**Waitlist:** Funds may run out; some agencies stop accepting applications early[1]

**Watch out for:**
- No shut-off notice required to apply or qualify—apply early to prevent crisis[4][5][8]
- Cooling assistance not offered[1]
- Crisis only for emergencies like shutoff or broken furnace[1]
- Household counts all at address on utility bill, including roommates[1]
- EUSP once per program year only; MEAP separate from electric[8]
- Funding limited—apply ASAP as agencies may close early[1]
- USPP protection requires budget billing and consecutive payments[8]

**Data shape:** Administered via OHEP as MEAP (heating) and EUSP (electric); income-based statewide with local offices; categorical eligibility for SNAP/TCA; benefits vary by fuel type, size, crisis status; year-round but heating-focused with limited funds

**Source:** https://dhs.maryland.gov/office-of-home-energy-programs/[4][8]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income must not exceed 60% State Median Income (SMI) or 200% Federal Poverty Level (FPL), whichever is higher. Updated 2/11/2026. Full table for DOE WAP: Household Size 1: $48,085 (60% SMI); 2: $62,880 (60% SMI). (Note: Full table partially provided in sources; higher sizes follow similar scaling.) Automatic eligibility if receiving: OHEP Utility Bill Pay Assistance, SNAP, TANF, SSI, HUD housing assistance. Not automatic: Fuel Fund, DHCD Rehab, Medicaid, etc.[1][2][3]
- Assets: No asset limits mentioned in sources.
- Priority for age 60+, disabled, families with children (some sources specify under 5), high energy usage/burden.
- Homeowners must prove ownership; renters eligible with landlord permission.
- No prior weatherization services from WAP or MD Office of Energy Efficiency in last 12 months.
- Single-family homes or apartments up to 4 units (larger reviewed case-by-case in some areas like Frederick).[1][2][4]

**Benefits:** Free in-home energy assessment followed by improvements including: blower door air infiltration reduction, insulation (attic, floors, walls), hot water system improvements, lighting retrofits, furnace clean/tune/safety repairs/burner retrofit/replacement, health/safety items. Lowers energy costs by average 30-35%. No specific dollar cap per home stated; grant-funded.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Phone: Call Office of Energy Efficiency at Maryland DHCD: 844-400-3423 or 1-800-756-0119.[2]
- Contact local providers (e.g., Community Action Council in Howard County, City of Frederick programs).[4][5]
- Online/application details via DHCD (specific form not named; apply through local agency after eligibility).[1][3]

**Timeline:** Not specified; local agency schedules energy assessment once eligible.
**Waitlist:** Likely due to priority system and funding limits; not explicitly detailed but implied by prioritization.[1]

**Watch out for:**
- Automatic eligibility only for specific programs (e.g., not Medicaid or Fuel Fund).[1]
- Renters need landlord sign-off; not all multi-unit buildings qualify (e.g., >4 units case-by-case).[4]
- Cannot have received WAP services recently; priority tiers mean elderly may wait less but funding limited.[1][2]
- Must prove ownership for homeowners; local variations in sub-priorities (e.g., children under 5 in some counties).

**Data shape:** Administered statewide by DHCD but via local agencies with regional providers and slight priority variations; income max(60% SMI, 200% FPL); strong priority tiers heavily favor elderly/disabled/families; automatic eligibility tied to specific aid programs only.

**Source:** https://dhcd.maryland.gov/Energy-Home-Repair/pages/homeowner-grants/wap.aspx

---

### Meals on Wheels (via Senior Care Services and Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No fixed statewide dollar amounts specified; meals may be free, suggested donation, or sliding scale based on location, income, and need. Monthly income and expenses requested during intake to determine fees, but no documentation required[1][7].
- Assets: No asset limits or exemptions mentioned in available sources.
- Homebound due to illness, physical/mental disability, or mobility challenges preventing shopping, meal preparation, or safe cooking[1][2][4][6]
- No caregiver available to assist with food shopping/preparation[4]
- Chronic health condition or disability may qualify those under 60 in some areas[2][4]

**Benefits:** Home-delivered nutritious meals (typically 1 hot midday meal + 1 cold meal for later; 5 days/week Monday-Friday); special diets like diabetic/low carb, low sodium, mechanical soft; planned to meet RDAs for older adults. Varies by provider (e.g., 2 meals/day in Frederick County)[3][4]
- Varies by: region

**How to apply:**
- Online form at Meals on Wheels of Central Maryland (mealsonwheelsmd.org/client-application/) for Central MD counties[7]
- Phone: 301-942-1111 for Montgomery County (mowwheaton.org)[2]
- Contact local Area Agency on Aging or provider directly; telephone intake common with needs assessment[1][7]
- Referral from doctor/social worker may be requested by some providers[1]

**Timeline:** Allow 3 business days for start after application (Central MD)[7]
**Waitlist:** Not specified; varies by region and provider demand (e.g., high need in Baltimore City, Essex, Dundalk, Glen Burnie)[3]

**Watch out for:**
- Must contact local provider/AAoA for exact eligibility/fees as no uniform statewide rules—varies significantly by county[1][4]
- Not automatically free; sliding scale or suggested donation based on income despite no strict limits[1][7]
- Primarily weekday delivery (Mon-Fri), no weekends standard[3][7]
- High demand areas like Baltimore City may have longer waits[3]
- Younger than 60 may qualify only with chronic disability in select programs[2][4]

**Data shape:** Highly decentralized by county/provider via local Area Agencies on Aging; no uniform income table or statewide asset test; contact local AAoA required for precise details

**Source:** https://www.mealsonwheelsamerica.org/find-meals-and-services/ (national locator; contact Maryland AAoAs via aging.maryland.gov)

---

### National Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits specified in program guidelines[1][3][4]
- Assets: No asset limits specified; no information on what counts or exemptions[1][3][4]
- Adult family members or other informal caregivers age 18 and older providing care to individuals 60 years of age and older[1][3][4]
- Adult family members or other informal caregivers age 18 and older providing care to individuals of any age with Alzheimer's disease and related disorders[1][3][4]
- Grandparents and other relatives (not parents) 55 years of age and older providing care to children under the age of 18[1][3][4]
- Grandparents and other relatives (not parents) 55 years of age and older providing care to adults age 18-59 with disabilities[1][3][4]

**Benefits:** Five specific services: 1) Information to caregivers about available services; 2) Assistance to caregivers in gaining access to services; 3) Individual counseling, organization of support groups, and caregiver training; 4) Respite care; 5) Supplemental services on a limited basis. No specified dollar amounts or hours per week[1][3][4][7]

**How to apply:**
- Contact local Area Agency on Aging (AAA); administered by Maryland's local network of Area Agencies on Aging[1]
- No specific statewide phone, online URL, mail, or in-person details in sources; eligibility screenings and application help provided by local providers like Montgomery County HHS or MAC Inc[5][7]

**Timeline:** No specific timeline provided in sources
**Waitlist:** No information on waitlists; may vary regionally but not specified

**Watch out for:**
- Must contact local Area Agency on Aging, not a centralized state application; no uniform process or forms[1]
- No income or asset tests, but services like supplemental and respite are limited availability[1][3][4]
- Eligibility focuses on caregiver types and care recipient categories, not financial need[1][4]
- Processing times, waitlists, and exact documents vary by local provider[5][7]

**Data shape:** Administered through local Area Agencies on Aging with no statewide income/asset tests; services capped as 'limited basis' for some categories; regional provider variations require local contact[1][5][7]

**Source:** https://aging.maryland.gov/pages/national-family-caregiver-support.aspx[1]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources; families must confirm with program staff using the latest federal poverty guidelines[1][3][4][5].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Desire training and employment opportunity
- U.S. resident legally eligible to work (for some providers)
- Priority: veterans/qualified spouses, over 65, disability, low literacy/limited English, rural resident, homeless/at-risk, low employment prospects, or prior American Job Center users[4]

**Benefits:** On-the-job training (20 hours/week average) at non-profit/government host agencies (e.g., schools, hospitals, senior centers); paid stipend at highest of federal/state/local minimum wage; support for unsubsidized job placement; wages exempt from income eligibility for federal housing/food stamps[1][2][4].

**How to apply:**
- Statewide: Call Josephine Cabi at 410-767-2160 or email josephine.cabi@maryland.gov; or Lorella Dicks at 410-767-2093 or lorella.dicks@maryland.gov[1][2]
- Montgomery/Frederick counties: Jewish Council for the Aging (JCA), Cathy Nestoriak at (301) 255-4249 or cnestoriak@accessjca.org[3][6]
- Prince George's County: Diann James at (301) 265-8487 or dbjames@co.pg.md.us[5][6]
- Other counties (Anne Arundel, Baltimore City/County, Carroll, Cecil, Dorchester, Harford, Howard, Somerset, Wicomico, Worcester): CWI Works, Laketa Hooper at (410) 801-6088 or lhooper@cwiworks.org[6]
- Website: https://labor.maryland.gov/employment/scsep.shtml[1]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by region due to limited slots.

**Watch out for:**
- Program administered by MD Dept. of Labor since July 2016 (not Aging Dept.)[2]
- Income at exactly 125% FPL; confirm current thresholds with staff as they update yearly[4][5]
- County-specific providers; must contact local partner, not just state office[6]
- Part-time training (20 hrs/wk) as bridge to unsubsidized work, not permanent job[1][4]
- Priority groups may limit access for others[4]

**Data shape:** Delivered via county-specific sub-grantees under state oversight; income tied to 125% FPL (updates annually, verify current); no statewide uniform application—use regional contacts; limited slots imply waitlists by region.

**Source:** https://labor.maryland.gov/employment/scsep.shtml

---

### Legal Aid for Seniors (via Maryland Legal Aid and Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income must be below 125% of the federal poverty income guidelines[4][5]. The exact dollar amounts vary by household size and are updated annually. For reference, the 2012-2013 Sixty Plus Legal Program used limits of $26,521 for an individual or $34,681 for a couple, but current guidelines should be verified by contacting Maryland Legal Aid or your local Area Agency on Aging[1]. Some programs (Maryland Senior Legal Helpline) allow income up to 500% of federal poverty level[6].
- Assets: Under the Sixty Plus Legal Program: assets cannot exceed $20,000 for an individual or $40,000 for a couple[1]. However, the following are NOT counted as assets: your home, one car (or two cars for a couple), and personal property[1]. Note: Asset limits may vary by specific program; verify with your local provider.
- Must be a Maryland resident[2][6]
- Caregiver of a senior (60+) may also qualify[2]
- Preference given to those with greatest economic or social need[2]

**Benefits:** Free legal advice, counseling, and representation. No cost for assistance with priority issues[2]. Priority areas include: income maintenance, nutrition, public/disability benefits, health care, protective services, abuse, housing, utilities, consumer protection, employment, age discrimination/civil rights, and advocacy for institutionalized persons[2]. Specific services include estate planning, wills, advanced medical directives, financial power of attorney, life estate deeds, foreclosure/tax sale assistance, debt collection, consumer issues, and elder abuse/neglect/financial exploitation cases[3].
- Varies by: priority_tier

**How to apply:**
- Phone: Maryland Legal Aid main line (410) 951-7750[10] or toll-free 1-888-465-2468[4]
- Phone: Maryland Senior Legal Helpline (for seniors 60+) - specific number not provided in search results; contact through Area Agency on Aging[6]
- Online: Apply through Maryland Legal Aid's online intake system[4][10]
- In-person: Attend a FREE legal clinic (locations vary by region)[4][10]
- In-person: Visit one of Maryland Legal Aid's 12 office locations[10]
- Contact your local Area Agency on Aging's Maryland Access Point (MAP)[2]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limits are strict: 125% of federal poverty guidelines for most Maryland Legal Aid programs, though some programs allow up to 500% of poverty level[4][5][6]. Verify your specific eligibility before applying.
- Asset limits exist and are relatively low ($20,000 individual/$40,000 couple under Sixty Plus)[1]. Home and vehicles are exempt, but other assets count.
- Priority is given to cases involving specific issues (income maintenance, housing, abuse, etc.)[2]. Your case type may affect whether you're accepted.
- Preference given to those with 'greatest economic or social need'[2] — this means even if you meet income/asset limits, acceptance is not guaranteed.
- Maryland Legal Aid cannot accept criminal cases, personal injury cases, or cases where income exceeds their limits[9].
- Processing time and waitlist status are not publicly specified — contact your local office for current timelines.
- Multiple programs exist (Maryland Legal Aid, Sixty Plus Legal Program, Senior Legal Services, Senior Legal Helpline) with slightly different eligibility and service areas. Confirm which program serves your location.
- Income guidelines are updated annually (effective July 1 each year)[5] — the 2012-2013 figures in some documents are outdated; always request current guidelines.
- Area Agencies on Aging coordinate services through Maryland Access Point (MAP), but you must contact your local AAA to access this route[2].

**Data shape:** This program is complex because it comprises multiple overlapping programs (Maryland Legal Aid, Sixty Plus Legal Program, Senior Legal Services, Senior Legal Helpline) with slightly different eligibility criteria, service areas, and income limits. Benefits are service-based (free legal representation) rather than financial. Eligibility varies by household size (income/asset limits scale for couples vs. individuals). Geographic variation is significant: some programs are Baltimore City-only, others are statewide. Income limits are tied to federal poverty guidelines, which change annually. Priority-tier system means acceptance depends on both meeting income/asset thresholds AND case type AND relative economic need. No specific processing times or waitlist information is publicly available.

**Source:** https://aging.maryland.gov/pages/senior-legal-assistance.aspx

---

### Maryland Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Must be a resident of a Maryland nursing home or assisted living facility (or a family member/advocate for such a resident)
- No application or qualification process required

**Data shape:** This program has a fundamentally different structure than typical benefits programs. It is a statewide advocacy network with no eligibility barriers, no application process, and no financial benefits. The 'gotcha' is that families often confuse this with a financial assistance or care coordination program when it is purely an independent advocacy and complaint resolution service.

---

### Maryland Senior Call Check Program (SCC)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; program is free for all eligible Maryland residents.
- Assets: No asset limits or tests.
- Maryland resident
- Has a working landline or cell phone (TTY available)
- No automated call blocking technology (must disable if present)
- Must apply on their own behalf (no one else can apply for them)
- Highly recommended: willing alternate contact person (adult child, neighbor, etc.)

**Benefits:** Daily automated telephone call or text message at a pre-selected one-hour time block between 8 a.m. and 4 p.m. (e.g., 8-9 a.m. or 2-3 p.m.). If unanswered after 3 attempts, calls alternate contact to encourage welfare check. If alternate also unreachable, notifies local non-emergency law enforcement for welfare check. Available every day except 6 holidays (New Year’s, Memorial Day, 4th of July, Labor Day, Thanksgiving, Christmas). COVID-era updates included messages on outbreaks.
- Varies by: fixed

**How to apply:**
- Online: http://aging.maryland.gov/Pages/senior-call-check-sign-up.aspx
- Phone: toll-free 1-866-502-0560 (Senior Call Check phone lines open Monday-Friday 8 a.m.-5 p.m., Saturday 9 a.m.-3 p.m.)
- Mail: Request paper application by phone; mail completed form to Maryland Department of Aging, 160 S. Water Street, Suite 316, Baltimore MD 21202

**Timeline:** Typically immediate enrollment upon acceptance; informed when daily calls begin. During COVID-19, verification and enrollment within 24 hours Monday-Saturday.

**Watch out for:**
- Must apply individually; no proxy applications.
- Automated call blocking must be disabled.
- Not a guaranteed emergency response; law enforcement resources limited, no promise of timely welfare checks.
- Age eligibility listed variably as 60 or 65 across sources—official site states 60.
- Service skips 6 major holidays.
- Alternate contact highly recommended but not mandatory; program assigns one if none provided.

**Data shape:** No financial means test; purely welfare check service via daily automated calls with escalation to alternate and law enforcement; centrally managed statewide with no county variations or caps.

**Source:** https://aging.maryland.gov/pages/senior-call-check.aspx

---

### Senior Assisted Living Subsidy Program (SALS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: {"description":"Net monthly income may not exceed 60% of state median income. As of the most recent data available (July 2023), specific limits are:","individual":"$4,350/month ($52,200/year)","couple":"Income evaluated individually; each person's income subject to individual limits","note":"Income limits are adjusted periodically; verify current limits with your local Area Agency on Aging"}
- Assets: {"individual":"$20,064","couple":"$26,400","what_counts":"Total assets; specific exemptions not detailed in available sources","deductions_applied":"A $130/month personal allowance is deducted from net monthly income when calculating subsidy amount. Monthly medical expenses and other costs are also considered in determining eligibility."}
- Must be a Maryland resident[2]
- Must require 24-hour supervision as documented by a nurse assessment from the Department of Health and Human Services (provided on-site at no cost)[2]
- Must be physically or mentally impaired and in need of assistance with activities of daily living (bathing, grooming, dressing, getting around)[1][3]
- Must be approved for entrance into or already a resident in a licensed assisted living facility that has entered into a service agreement with an Area Agency on Aging[1][3]
- Applicant or their representative must find an assisted living facility that participates in the program[2]

**Benefits:** Up to $1,000/month maximum subsidy[5][6]. The subsidy covers the difference between the resident's net monthly income (after the $130/month personal allowance deduction) and the approved monthly assisted living fee. Total monthly care rate charged to subsidy participants may not exceed $3,300/month[2].
- Varies by: Individual income and approved facility costs; fixed maximum of $1,000/month

**How to apply:**
- Phone: Contact your local Area Agency on Aging or Maryland Access Point (MAP) at 211md.org or call 1-866-417-3480 (toll-free Waiver Services Registry)[4]. County-specific numbers: Montgomery County 240-777-1138[2], Howard County 410-313-1234[3], Anne Arundel County 410-222-4257[6], Queen Anne's County 410-758-0848[7]
- In-person: Visit your local Area Agency on Aging or Department of Aging office
- Mail: Applications can be mailed to local offices (example: Anne Arundel County address: 2666 Riva Rd., Suite 200, Annapolis, MD 21401[6])
- Online: Contact Maryland Access Point at marylandaccesspoint.211md.org for information and referral[8]

**Timeline:** Not specified in available sources; applications are processed according to funding availability[2]
**Waitlist:** Yes. Applications are date-stamped and placed on a waiting list upon receipt. Applications are served on a first-come, first-served basis when all steps of the application process are complete. Due to budget limits, eligible applicants may need to wait for a space in the program[2][3][5]. Slots become available each July 1st for some programs[4].

**Watch out for:**
- Applicants are responsible for finding an assisted living facility that participates in the program — the program does not place you[2]. You must request a list of participating facilities from your local office.
- The program has a waiting list due to limited funding. Eligible applicants may wait months or longer for a subsidy slot[2][3][5].
- A functional assessment (AERS) is required and must document that you need 24-hour supervision. This is not automatic based on age or income alone[2][5].
- The $1,000/month maximum subsidy may not cover the full cost of assisted living. Residents are responsible for any costs above what the subsidy covers (up to the $3,300/month facility rate cap)[2].
- Income limits are strict and include all sources of income. VA Aide & Attendance benefits are specifically excluded from income calculations in some counties[5], but verify this with your local office.
- Asset limits are relatively low ($20,064 for individuals). Applicants with more assets may not qualify regardless of income.
- The program requires proof of citizenship and identity as of September 1, 2006[4].
- Facility participation is voluntary — not all assisted living facilities accept SALS subsidies. Availability varies significantly by region.
- Income and asset limits are adjusted periodically (at minimum annually). Always verify current limits with your local Area Agency on Aging before applying.

**Data shape:** This is a statewide program with county-level administration, creating regional variation in wait times, participating facilities, and specific contact procedures. Benefits are fixed at a maximum of $1,000/month but vary by individual based on income and approved facility costs. Eligibility is determined by a combination of age (62+), functional need (24-hour supervision requirement), income (60% of state median), and assets ($20,064 individual/$26,400 couple). The program has a significant waitlist due to limited state funding. Unlike some assistance programs, SALS does not have tiered benefits or priority levels — it operates on first-come, first-served basis once all eligibility steps are complete.

**Source:** https://aging.maryland.gov/pages/senior-assisted-living-subsidy-program.aspx[1]

---

### Senior Care Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Specific dollar amounts not explicitly stated in sources; must meet income criteria for gap-filling funds alongside case management eligibility. References Maryland Department of Aging guidelines at 60% of some threshold (exact figure not detailed). Varies by household size not specified; financial assessment required.[1][2]
- Assets: Assets must not exceed established resource limits for gap-filling funds (exact dollar amount not specified in sources; local assessment determines). What counts and exemptions not detailed.[2]
- Maryland resident living in the county where services are received
- Severely or moderately disabled
- At risk of nursing home placement (functional eligibility via assessment)
- US citizen or qualified alien (per some county implementations)
- Screening and face-to-face assessment to confirm functional needs and develop plan of care[2][4]

**Benefits:** Case management; gap-filling funds (funding availability dependent) for personal care, household chores, medications, medical equipment/supplies, adult day care, respite care, home-delivered meals, transportation, emergency response systems (PERS), incontinent supplies, nutritional supplements, medical reimbursement, health/wellness programs. No specific dollar amounts or hours per week stated; services outlined in person-centered plan of care.[2][4][6]
- Varies by: funding_availability

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA), Aging and Disability Resource Center (ADRC)/Maryland Access Point (MAP), or county-specific (e.g., Montgomery County: 240-777-3000; St. Mary's County: 301-475-4200 ext. 1057)
- In-person: Local AAA or ADRC/MAP offices for screening, assessment, and referral
- Referral-based screening by participating agencies (no central online or mail specified)

**Timeline:** Varies; state law requires decision within 30 days for some related processes, but not explicitly for Senior Care[7]
**Waitlist:** Yes, varies by funding availability; not an entitlement program, grant-funded[4]

**Watch out for:**
- Not an entitlement; services depend on grant funding availability and may have waitlists[4]
- Gap-filling funds require meeting both case management and stricter financial criteria; case management alone does not guarantee funding[2]
- Must reside in the specific county for services; functional eligibility confirmed via in-person assessment, not self-reported[2][4]
- People miss that it's distinct from Medicaid programs like Community First Choice (ages 18+)[1]

**Data shape:** County-administered via local AAAs with varying contacts and funding; no fixed income/asset dollar limits published centrally (assessed locally); benefits via gap-filling only if funds available; requires county residency match

**Source:** https://aging.maryland.gov/pages/senior-care.aspx

---

### MTA Senior Discount Program (Reduced Fare CharmCard®)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits or asset limits apply. Eligibility is based solely on age or disability status, with no household size variations or financial tests.
- Assets: Not applicable; no asset requirements.
- Valid government-issued photo ID showing date of birth (e.g., driver's license, state ID, passport).
- Alternatively: Medicare card paired with government-issued photo ID.
- MTA Senior Photo ID (no longer issued, but existing cards accepted).

**Benefits:** Reduced (typically half) fares on MTA Local Bus, Commuter Bus, Light Rail, Metro Subway, and MARC Train services. Exact reduced fare amounts available on MTA Fares page; payable via CharmPass app, cash, or compatible cards (note: physical CharmCards phased out as of March 1, 2026).
- Varies by: fixed

**How to apply:**
- Online via CharmPass app: https://www.mta.maryland.gov/charmpass-reduced-fare-application (link eligibility with photo ID upload).
- In-person at MTA Reduced Fare Certification Office, 4201 Patterson Ave, 1st Floor, Baltimore, MD 21215 (Mon-Thu 8:30am-4:30pm).
- Phone: 410-767-3438 or 410-767-3441.
- Email: MTAReduceFareCertification@mta.maryland.gov.

**Timeline:** Immediate for in-person verification; app-based linking is instant upon approval.

**Watch out for:**
- Physical CharmCards are no longer accepted for fare payment as of March 1, 2026—must use CharmPass mobile app, cash with ID, or compatible digital cards.
- MTA Senior Photo IDs are no longer issued; apply for free Maryland MVA Photo ID instead.
- Must show valid ID every time to board at reduced fare; operators may request proof.
- Not compatible with all regional systems without additional verification (e.g., WMATA SmarTrip for cross-agency use).
- No free rides—only reduced fares.

**Data shape:** no income test; ID-based only; transitioning from physical CharmCard to mobile CharmPass app; uniform eligibility statewide on MTA services

**Source:** https://www.mta.maryland.gov/senior-reduced-fare-program

---

### Golden Age Pass

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Must be a legal resident of the State of Maryland

**Benefits:** Free day-use entry to all Maryland state parks that charge service fees; 50% discount on camping (campsites and mini-cabins only, Sunday–Thursday, excluding holidays); free boat launching fees at Maryland State Parks
- Varies by: fixed

**How to apply:**
- Online: Purchase and upload age verification at Maryland DNR website
- Mail: Complete online order without age verification, then mail proof of age document with confirmation to Maryland Park Service, 580 Taylor Avenue, E-3, Annapolis, MD 21401, Attn: Golden Age Pass Application
- In-person: Purchase at designated state parks

**Timeline:** Not specified in available sources

**Watch out for:**
- Pass is not valid until the physical card is received in the mail—you cannot use it immediately after online purchase[3]
- The physical pass must be presented at check-in; it is non-transferrable[3]
- Camping discount (50% off) applies only Sunday–Thursday and excludes holidays; full-service cabins and houses are excluded from the discount[2][3]
- For camping, the pass holder must be part of the camping party for the entire stay[2][3]
- If the pass is lost, stolen, or damaged, a new pass must be purchased—there is no replacement or reissuance process[3]
- Boat launching fees are waived, but the Universal Disability Pass does not waive boat launch charges except where included in day-use fees[3]
- Sandy Point State Park and Point Lookout/St. Mary's River State Parks require separate phone calls to obtain magnetic swipe cards after receiving the physical pass[2]
- Day-use entry for cardholders only unless a per-vehicle fee is in effect, in which case free entry applies to everyone in the vehicle[2][3]

**Data shape:** This is a straightforward, fixed-benefit program with no income or asset testing. The primary complexity lies in the multi-step process for certain parks (obtaining swipe cards after pass receipt) and the restriction of camping discounts to specific days and seasons. Unlike many senior programs, there is no tiered benefit structure, no household-size variation, and no waitlist. The $10 lifetime fee is the only cost.

**Source:** https://dnr.maryland.gov/publiclands/pages/goldenage.aspx

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Maryland Durable Medical Equipment Reuse | resource | state | simple |
| Maryland Community First Choice (CFC) an | benefit | state | deep |
| Maryland Program of All-Inclusive Care f | benefit | local | deep |
| Maryland Medicare Savings Program (MSP)  | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | medium |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Meals on Wheels (via Senior Care Service | benefit | federal | medium |
| National Family Caregiver Support Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors (via Maryland Lega | resource | state | simple |
| Maryland Long-Term Care Ombudsman Progra | resource | federal | simple |
| Maryland Senior Call Check Program (SCC) | benefit | state | medium |
| Senior Assisted Living Subsidy Program ( | benefit | state | deep |
| Senior Care Services Program | benefit | state | deep |
| MTA Senior Discount Program (Reduced Far | benefit | state | deep |
| Golden Age Pass | resource | state | simple |

**Types:** {"resource":4,"benefit":12,"employment":1}
**Scopes:** {"state":9,"local":1,"federal":7}
**Complexity:** {"simple":4,"deep":9,"medium":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/MD/drafts.json`.

- **Maryland Durable Medical Equipment Reuse Program (DME)** (resource) — 3 content sections, 6 FAQs
- **Maryland Community First Choice (CFC) and Home and Community-Based Services (HCBS) Waivers** (benefit) — 4 content sections, 6 FAQs
- **Maryland Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 3 programs
- **priority_tier**: 4 programs
- **Medicare/Medicaid eligibility status and private pay option**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **region**: 1 programs
- **fixed**: 3 programs
- **Individual income and approved facility costs; fixed maximum of $1,000/month**: 1 programs
- **funding_availability**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Maryland Durable Medical Equipment Reuse Program (DME)**: No income/asset/age tests; healthcare provider-gated; inventory-driven with statewide satellites but main processing in Cheltenham; donation-reliant with no fixed quantities.
- **Maryland Community First Choice (CFC) and Home and Community-Based Services (HCBS) Waivers**: CFC is entitlement (no waitlist, immediate if eligible) vs. slot-limited HCBS Waivers; eligibility ties to specific public benefits or Waivers with varying income; services personalized via plan of service assessment
- **Maryland Program of All-Inclusive Care for the Elderly (PACE)**: Maryland PACE is geographically restricted by provider service areas (only PACE of West Baltimore detailed in search results). No statewide income or asset limits exist for program eligibility, but Medicaid coverage (used by ~90% of participants) has strict financial limits. The program is all-or-nothing: participants must use PACE exclusively for all services. Search results do not provide comprehensive statewide provider list, application processing times, or detailed benefit specifications beyond 'comprehensive services.'
- **Maryland Medicare Savings Program (MSP) including QMB, SLMB, QI**: Tiered by income brackets (QMB/SLMB/QI) with household size scaling; asset exemptions detailed; annual reapplication and QI funding caps create unique renewal/wait dynamics
- **Supplemental Nutrition Assistance Program (SNAP)**: Expanded to 200% FPL gross income; special elderly/disabled rules skip gross test; state minimum benefit supplement for 62+; benefits scale by household size and net income
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered via OHEP as MEAP (heating) and EUSP (electric); income-based statewide with local offices; categorical eligibility for SNAP/TCA; benefits vary by fuel type, size, crisis status; year-round but heating-focused with limited funds
- **Weatherization Assistance Program (WAP)**: Administered statewide by DHCD but via local agencies with regional providers and slight priority variations; income max(60% SMI, 200% FPL); strong priority tiers heavily favor elderly/disabled/families; automatic eligibility tied to specific aid programs only.
- **Meals on Wheels (via Senior Care Services and Area Agencies on Aging)**: Highly decentralized by county/provider via local Area Agencies on Aging; no uniform income table or statewide asset test; contact local AAoA required for precise details
- **National Family Caregiver Support Program**: Administered through local Area Agencies on Aging with no statewide income/asset tests; services capped as 'limited basis' for some categories; regional provider variations require local contact[1][5][7]
- **Senior Community Service Employment Program (SCSEP)**: Delivered via county-specific sub-grantees under state oversight; income tied to 125% FPL (updates annually, verify current); no statewide uniform application—use regional contacts; limited slots imply waitlists by region.
- **Legal Aid for Seniors (via Maryland Legal Aid and Area Agencies on Aging)**: This program is complex because it comprises multiple overlapping programs (Maryland Legal Aid, Sixty Plus Legal Program, Senior Legal Services, Senior Legal Helpline) with slightly different eligibility criteria, service areas, and income limits. Benefits are service-based (free legal representation) rather than financial. Eligibility varies by household size (income/asset limits scale for couples vs. individuals). Geographic variation is significant: some programs are Baltimore City-only, others are statewide. Income limits are tied to federal poverty guidelines, which change annually. Priority-tier system means acceptance depends on both meeting income/asset thresholds AND case type AND relative economic need. No specific processing times or waitlist information is publicly available.
- **Maryland Long-Term Care Ombudsman Program**: This program has a fundamentally different structure than typical benefits programs. It is a statewide advocacy network with no eligibility barriers, no application process, and no financial benefits. The 'gotcha' is that families often confuse this with a financial assistance or care coordination program when it is purely an independent advocacy and complaint resolution service.
- **Maryland Senior Call Check Program (SCC)**: No financial means test; purely welfare check service via daily automated calls with escalation to alternate and law enforcement; centrally managed statewide with no county variations or caps.
- **Senior Assisted Living Subsidy Program (SALS)**: This is a statewide program with county-level administration, creating regional variation in wait times, participating facilities, and specific contact procedures. Benefits are fixed at a maximum of $1,000/month but vary by individual based on income and approved facility costs. Eligibility is determined by a combination of age (62+), functional need (24-hour supervision requirement), income (60% of state median), and assets ($20,064 individual/$26,400 couple). The program has a significant waitlist due to limited state funding. Unlike some assistance programs, SALS does not have tiered benefits or priority levels — it operates on first-come, first-served basis once all eligibility steps are complete.
- **Senior Care Services Program**: County-administered via local AAAs with varying contacts and funding; no fixed income/asset dollar limits published centrally (assessed locally); benefits via gap-filling only if funds available; requires county residency match
- **MTA Senior Discount Program (Reduced Fare CharmCard®)**: no income test; ID-based only; transitioning from physical CharmCard to mobile CharmPass app; uniform eligibility statewide on MTA services
- **Golden Age Pass**: This is a straightforward, fixed-benefit program with no income or asset testing. The primary complexity lies in the multi-step process for certain parks (obtaining swipe cards after pass receipt) and the restriction of camping discounts to specific days and seasons. Unlike many senior programs, there is no tiered benefit structure, no household-size variation, and no waitlist. The $10 lifetime fee is the only cost.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Maryland?
