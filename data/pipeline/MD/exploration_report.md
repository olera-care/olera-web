# Maryland Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 8.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 16 |
| New (not in our data) | 16 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **in_kind**: 1 programs
- **service**: 8 programs
- **financial**: 4 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **service + financial**: 1 programs

## New Programs (Not in Our Data)

- **Maryland Durable Medical Equipment Reuse Program (DME)** — in_kind ([source](https://aging.maryland.gov/pages/DME.aspx))
  - Shape notes: No income/age/asset tests; free to all MD residents with need; two-tier equipment (basic vs complex with provider form); stock-dependent availability; statewide with regional pickup sites only
- **Community First Choice (CFC)** — service ([source](https://health.maryland.gov/mmcp/ltss/Pages/community-first-choice.aspx))
  - Shape notes: CFC has multiple eligibility pathways: (1) Regular State Medicaid Plan with income below 150% of federal poverty level; (2) SSI recipients (automatic Medicaid eligibility); (3) Community Options Medicaid Waiver (allows higher income). Income limits are fixed at $350/month (individual) and $392/month (couple) for 2026 under the standard pathway[1]. The program is statewide but administered through county-level Health Departments and Departments of Social Services, creating potential regional variation in processing and service delivery. No specific dollar amounts or hours per week are provided for individual services—benefits are service-based rather than cash-based. Processing timelines and waitlist status are not publicly documented in available sources.
- **Maryland PACE** — service ([source](https://regs.maryland.gov/us/md/exec/comar/10.09.44.05))
  - Shape notes: Provider-specific service areas only (not statewide); no fixed income/asset caps for core eligibility (Medicaid-tied); multiple regional PACE organizations; dual-eligible focus (90%+ participants)
- **Maryland Medicare Savings Program (MSP)** — financial ([source](https://health.maryland.gov/mmcp/eligibility/Pages/medicare-savings-programs.aspx))
  - Shape notes: Tiered by income brackets (QMB/SLMB/QI) with federal asset caps; disregards for earned/unearned income; statewide but local DSS processing; auto-linked to MA application
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://dhs.maryland.gov/supplemental-nutrition-assistance-program/))
  - Shape notes: Benefits scale by household size and net income (30% deduction for elderly/disabled); higher income threshold (165% poverty) and asset limit for households with 60+/disabled; statewide with local offices; state supplement for seniors 62+
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://dhs.maryland.gov/office-of-home-energy-programs/[4][7]))
  - Shape notes: Administered via OHEP as MEAP (heating) + EUSP (electric) + crisis; year-round but heating-focused fall/winter; categorical eligibility for SNAP/TCA; varies by fuel type, income, size; local offices handle large households
- **Maryland Weatherization Assistance Program** — service ([source](https://dhcd.maryland.gov/Energy-Home-Repair/pages/homeowner-grants/wap.aspx))
  - Shape notes: Statewide with local agency delivery and priority tiers; income max(60% SMI, 200% FPL) auto-eligible via specific programs only; no asset test; benefits via professional assessment not fixed dollar.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://aging.maryland.gov/pages/state-health-insurance-program.aspx))
  - Shape notes: no income test for counseling; county-based delivery with local senior centers/Area Agencies on Aging; assists with but separate from income-tested programs like MSPs
- **Home Delivered Meals** — service ([source](https://aging.maryland.gov/pages/nutrition.aspx))
  - Shape notes: Decentralized by county/provider with unique eligibility/providers/wait times; no uniform income table; often no caregiver + homebound core req; some fee-based or referral-only
- **National Family Caregiver Support Program** — service ([source](https://aging.maryland.gov/pages/national-family-caregiver-support.aspx[1]))
  - Shape notes: Administered locally via Area Agencies on Aging with no income/asset tests; services fixed at five types with limited supplemental; eligibility tiered by caregiver-care recipient relationship and ages
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://labor.maryland.gov/employment/scsep.shtml))
  - Shape notes: Administered statewide by MD Labor but via local grantees with residency rules; income at 125% FPL (annual update, household size-based); priority tiers affect access; no asset test
- **Senior Legal Assistance Program (Sixty Plus Legal Program)** — service ([source](https://aging.maryland.gov/pages/senior-legal-assistance.aspx))
  - Shape notes: Decentralized via 19 local AAAs with contracted providers; income follows variable MLSC guidelines (50% median or 125% FPL); priority tier determines free vs low-cost; regional provider differences
- **Long-Term Care Ombudsman Program** — advocacy ([source](https://aging.maryland.gov/pages/state-long-term-care-ombudsman.aspx[3]))
  - Shape notes: no income test; resident consent-driven advocacy; delivered via 19 regional local programs statewide; free to all in nursing homes/assisted living; not financial aid
- **Maryland Senior Call Check Program (SCC)** — service ([source](https://aging.maryland.gov/pages/senior-call-check.aspx))
  - Shape notes: No financial means test; purely service-based with simple telephony requirements; statewide uniform operation; self-application only.
- **Senior Assisted Living Subsidy Program (SALS)** — financial ([source](https://aging.maryland.gov/pages/senior-assisted-living-subsidy-program.aspx))
  - Shape notes: Statewide framework with county-administered variations in contacts, exact income figures, rate caps, and providers; subsidy calculated individually after deductions; limited funding drives waitlists
- **Senior Care Program** — service + financial ([source](https://aging.maryland.gov/ (Maryland Department of Aging); contact your county Area Agency on Aging for specific program details))
  - Shape notes: Senior Care Program is county-administered with state oversight, creating significant regional variation in eligibility timelines, available services, and waitlist status. Income/asset limits scale by household size. Program is grant-funded and non-entitlement, meaning approval depends on available funding. Eligibility requires both financial qualification AND medical/functional need (ADL assistance). The program functions as a gap-filler for community-based services rather than providing direct care or fixed benefit amounts.

## Program Details

### Maryland Durable Medical Equipment Reuse Program (DME)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available regardless of income
- Assets: No asset limits or tests mentioned
- Maryland resident
- Any illness, injury, or disability
- For complex equipment: Form Parts B and C completed by healthcare provider (Physician, Physical Therapist, Occupational Therapist, Physician’s Assistant, or Nurse Practitioner)

**Benefits:** Free durable medical equipment including: Basic - Canes, crutches, walkers, rollators, shower chairs, tub transfer benches, bedside commodes, toilet safety rails, transfer boards. Complex (requires provider form) - Manual wheelchairs, transport wheelchairs, knee scooters, semi/electric home hospital beds, patient (Hoyer) lifts, trapeze bars, power wheelchairs (PT/OT only), power scooters (PT/OT only), upright rollators, rolling shower chairs. Other items like bedrails, over bed tables, toilet risers may be available. Equipment is sanitized, repaired, donated stock; kept permanently by recipient
- Varies by: equipment_type

**How to apply:**
- Online: https://onestop.md.gov/forms/basic-durable-medical-equipment-request-form-618bcb19e9b09f023f463960 (Basic DME Request Form; use Complex Request Form for advanced items)
- Phone: 240-230-8000 or (410)-767-1100 / 1-800-243-3425
- Email: dme.mdoa@maryland.gov
- In-person pickup by appointment at multiple state locations (e.g., 11701 Crain Highway, Cheltenham, MD 20623); no home delivery

**Timeline:** After submission, form goes 'In-Review'; staff contact via preferred method to confirm stock and schedule pickup (timeline not specified)
**Waitlist:** No waitlist mentioned; depends on equipment availability in stock

**Watch out for:**
- No home delivery; must pickup by appointment
- Complex items require healthcare provider to complete form parts
- Availability depends on donated stock - call ahead to verify
- All required form fields (*) must be filled or request is voided
- Encouraged but not required to donate back when no longer needed

**Data shape:** No income/age/asset tests; free to all MD residents with need; two-tier equipment (basic vs complex with provider form); stock-dependent availability; statewide with regional pickup sites only

**Source:** https://aging.maryland.gov/pages/DME.aspx

---

### Community First Choice (CFC)

> **NEW** — not currently in our data

**Eligibility:**
- Income: In 2026, individual applicant income limit is $350/month; couple income limit (both spouses as applicants) is $392/month[1]. When only one spouse is an applicant, the individual limit of $350/month applies and the non-applicant spouse's income is not counted[1]. However, persons receiving Supplemental Security Income (SSI) automatically qualify for MD Medicaid regardless of income[1]. Persons enrolled in the Community Options Medicaid Waiver may qualify for CFC with higher monthly income limits than those qualifying via Regular State Medicaid Plan or SSI[1]. Additionally, a single person can make up to $16,243 per year and qualify for Medicaid[3].
- Assets: Specific asset limits are not detailed in available sources. However, the following assets are NOT counted: primary home, household furnishings and appliances, personal effects, and one vehicle[1]. Home equity interest must not exceed $730,000 if the applicant lives in the home or has intent to return[1]. Assets should not be given away or sold under fair market value prior to applying, as MD Medicaid has a 60-month Look-Back Rule for applicants of long-term Home and Community Based Services; violating this results in a Penalty Period of Medicaid ineligibility[1].
- Must require an institutional level of care based on a uniform medical assessment[3][6]
- Must reside in the community[6]
- Must already have full Medicaid (red and white card)[7]
- Must be eligible for medical assistance in an eligibility group whose benefits include nursing facility services, or have countable income below 150% of the federal poverty level if their eligibility group does not cover nursing facility services[2]
- If qualifying through a 1915(c) waiver, must continue to meet all waiver criteria and receive at least one waiver service per year[2]

**Benefits:** Services include: Personal Assistance Services (help with activities of daily living such as bathing, grooming, dressing, getting around); Supports Planning; Nurse Monitoring; Personal Emergency Response Systems; Assistive Technology; Home-delivered Meals; Environmental Assessments by licensed occupational therapist; Durable Medical Equipment; Disposable Medical Supplies; Accessibility Adaptations; Assistive Devices; Behavior Consultation Services; Medical Adult Day Services; Senior Center Plus Services; Diet and Nutritional Services; Family and Consumer Training; Assistance with Transitional Costs[2][5][6]

**How to apply:**
- Phone: Maryland Access Point at 1-844-MAP-LINK (1-844-627-5465)[4]
- Phone: Maryland Department of Health Community First Choice at 877-463-3464 or 410-767-1739[4]
- In-person: Local Health Department (determines medical eligibility) or local Department of Social Services (determines financial eligibility)[4]
- In-person: County-specific offices (e.g., Washington County Health Department at 240-313-3229; Washington County Commission on Aging at 301-790-0275; St. Mary's County MAP Coordinator at 301-475-4200 ext. 1057)[4][5]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- CFC is a state plan benefit, meaning applicants must already have full Medicaid (red and white card) to qualify[7]. This is a critical first step often missed by families.
- The 60-month Look-Back Rule means any assets given away or sold below fair market value within 5 years before application can trigger a Penalty Period of Medicaid ineligibility[1]. Families should not transfer assets before consulting with a Medicaid planner.
- Income limits are extremely low ($350/month for individuals in 2026)[1]. However, SSI recipients automatically qualify regardless of income, and waiver programs allow higher income limits[1]. Families with income above the standard limit should explore SSI or waiver eligibility.
- Institutional level of care is required—this is not a program for seniors who simply need minor assistance[2][6]. A uniform medical assessment must confirm this need.
- If only one spouse applies, the non-applicant spouse's income is not counted, but a Spousal Income Allowance (Monthly Maintenance Needs Allowance) may apply[1]. This can be advantageous for couples.
- Home equity interest cannot exceed $730,000[1], but the home itself is protected as an exempt asset if the applicant lives there or intends to return[1].
- Individuals qualifying through a 1915(c) waiver must receive at least one waiver service per year to maintain eligibility[2].
- Services must be delivered in the most integrated setting appropriate to the individual's needs, as required by the Affordable Care Act[2].

**Data shape:** CFC has multiple eligibility pathways: (1) Regular State Medicaid Plan with income below 150% of federal poverty level; (2) SSI recipients (automatic Medicaid eligibility); (3) Community Options Medicaid Waiver (allows higher income). Income limits are fixed at $350/month (individual) and $392/month (couple) for 2026 under the standard pathway[1]. The program is statewide but administered through county-level Health Departments and Departments of Social Services, creating potential regional variation in processing and service delivery. No specific dollar amounts or hours per week are provided for individual services—benefits are service-based rather than cash-based. Processing timelines and waitlist status are not publicly documented in available sources.

**Source:** https://health.maryland.gov/mmcp/ltss/Pages/community-first-choice.aspx

---

### Maryland PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No strict income limits for medical eligibility; financial eligibility follows Medicaid rules. Categorically needy: SSI recipients, low-income families per §1931 SSA, or other per COMAR 10.09.24.03. Optionally categorically needy: countable income ≤300% of SSI payment rate; resources ≤SSI standard for one individual (2026 SSI federal rate ~$967/month income, ~$2,000 resources; state supplement varies).[1]
- Assets: For optionally categorically needy: resources ≤SSI standard (~$2,000 for one; excludes primary home, one vehicle, burial plots, etc., per Medicaid rules in COMAR 10.09.24.09-10-1). No asset test for pure medical eligibility.[1]
- Reside in the PACE provider's approved service area upon enrollment[1][2]
- Able to be maintained in community setting with PACE assistance without jeopardizing health/safety of participant or others[1][2]
- Certified by state as needing nursing facility level of care for >4 months[1]
- Agree to receive all health/long-term care exclusively from PACE provider and its contractors/referrals[1][2]
- Not enrolled in Medicare Advantage, hospice, or certain other programs[3]

**Benefits:** All-inclusive comprehensive care: primary/acute/specialty medical care, prescription drugs, hospitalization, social services, therapeutic services (OT/PT/speech), home care (personal/ homemaker), respite, adult day health, meals (home-delivered/congregate), transportation, preventive care. Sole source for Medicare/Medicaid-covered services; no specific dollar/hour limits stated, tailored by interdisciplinary team[1][3][4]
- Varies by: region

**How to apply:**
- Contact local PACE provider (e.g., PACE of West Baltimore for specific zips: implied via site, phone not listed in results)[2]
- Trinity Health PACE for Montgomery County (site implies contact form/visit)[8]
- State Medicaid assistance for financial eligibility (no specific phone/URL in results)
- Private pay option available without Medicaid[2]

**Timeline:** Not specified in sources
**Waitlist:** Possible; varies by provider/service area (not detailed)[2]

**Watch out for:**
- Must live in specific provider service area; not statewide[1][2]
- Nursing home level of care required (>4 months), but must be safe in community with PACE[1]
- Exclusive use of PACE providers only—no outside Medicare/Medicaid services[1][2]
- Cannot be in Medicare Advantage or hospice[3]
- Private pay option exists if not Medicaid-eligible, but costly (~$7k+/month elsewhere; share-of-cost $200-900)[6]
- Note: Maryland also has C-PACE (clean energy financing)—unrelated to elderly care[7]

**Data shape:** Provider-specific service areas only (not statewide); no fixed income/asset caps for core eligibility (Medicaid-tied); multiple regional PACE organizations; dual-eligible focus (90%+ participants)

**Source:** https://regs.maryland.gov/us/md/exec/comar/10.09.44.05

---

### Maryland Medicare Savings Program (MSP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: MSP includes multiple tiers with income limits based on Federal Poverty Level (FPL), updated annually. For 2025 (most recent cited): QMB ≤100% FPL ($1,235/month single, $1,663/month couple); SLMB >100%-120% FPL ($1,235-$1,478/month single, $1,663-$1,992/month couple); QI/SLMB II >120%-135% FPL ($1,478-$1,660/month single, $1,992-$2,239/month couple). Limits include $20 unearned income disregard and $65 earned income deduction; higher if working. Applies to assistance unit size (individual or couple). Full FPL table not in results—check current via official site as limits rise yearly[1][2][4][5][9].
- Assets: Federal limits apply: $9,090 single/$13,630 couple for QMB/SLMB/QI. Countable: cash, bank accounts, stocks, bonds, retirement accounts. Exempt: primary home, one car, burial plots/funds up to $1,500, life insurance under $1,500 cash value[3][4][5][9].
- Maryland resident (at least 6 months for some sub-programs)
- Entitled to Medicare Part A (even if not enrolled) or Part B
- Not enrolled in full Medical Assistance or Maryland Children's Health Program
- Meet non-financial Medical Assistance requirements

**Benefits:** QMB: Pays Medicare Part A premiums (if owed), Part B premiums/deductible, Part A/B coinsurance/deductibles. SLMB: Pays Part B premiums (effective month of application; retroactive up to 3 months). QI/SLMB II: Pays Part B premiums. No direct services—reimburses costs via Medicaid[2][4][6].
- Varies by: priority_tier

**How to apply:**
- Online: Maryland Health Connection (health.maryland.gov)
- Phone: Local Department of Social Services or Maryland Department of Health (specific numbers via 211 or local DSS)
- Mail/In-person: Local Department of Social Services offices statewide
- Apply for Medical Assistance—MSP determined automatically

**Timeline:** SLMB/QI effective first day of application month; others vary—not specified precisely[2].

**Watch out for:**
- Automatic MSP check during Medical Assistance application—apply even if unsure
- Income disregards ($20 unearned/$65 earned) often missed; working income may qualify higher
- Assets exempt (home/car/burial) commonly overlooked
- SLMB/QI no card issued—just letter; QMB gets gray/white card[9]
- Not for families—individual/couple only[5]
- Limits update annually (April); use current FPL[6][8][9]
- Must apply for other benefits (e.g., SSI/SS) first[3]

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) with federal asset caps; disregards for earned/unearned income; statewide but local DSS processing; auto-linked to MA application

**Source:** https://health.maryland.gov/mmcp/eligibility/Pages/medicare-savings-programs.aspx

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Maryland SNAP income limits for Oct 1, 2025–Sep 30, 2026 (most households at or below 200% federal poverty level; more flexible for households with members 60+ or disabled). Elderly/disabled separate households use 165% of poverty. Table for maximum gross monthly income (130% poverty), net (100% poverty), elderly/disabled (165%), and max allotment:

|Household Size|Max Gross (130%)|Max Net (100%)|Elderly/Disabled (165%)|Max Allotment|
|-|-|-|-|-|
|1|$1,696|$1,305|$2,152|$298|
|2|$2,292|$1,763|$2,909|$546|
|3|$2,888|$2,221|$3,665|$785|
|4|$3,483|$2,680|$4,421|$994|
|5|$4,079|$3,138|$5,177|$1,183|
|6|$4,675|$3,596|$5,934|$1,421|
|7|$5,271|$4,055|$6,690|$1,571|
|8|$5,867|$4,513|$7,446|$1,789|
|Each additional|$596|$459|$757|$218|

For 2025: $15,060 annual ($1,255 monthly) for 1 person; $20,440 annual ($1,703 monthly) for 2[1][2][6].
- Assets: Households with member 60+ or disabled: combined bank savings/checking under $3,001. Other households: under $2,001. Exempt: home value if owned, retirement savings, cash value of life insurance, income-producing property, household goods. Some states waive asset test if income below federal poverty line[1][5].
- Maryland resident
- U.S. citizen or lawfully present non-citizen
- Social Security number for each household member
- Able-bodied adults 16-60 (with exceptions) must register for work, accept suitable employment, participate in employment/training if referred
- Unemployed adults without children/disabilities limited to 3 months benefits every 3 years
- Include all who live together and buy/prepare food
- Verification of income, child support, immigrant status, medical expenses (for 60+ or disabled)

**Benefits:** Monthly benefits on Maryland Independence EBT card for SNAP-approved foods at grocery stores/farmers markets. Average ~$188/month for older adults. Minimum $30/month for seniors 62+ (state supplement effective Oct 1, nearly doubling federal $16 min). Max allotment scales by household size/income (see eligibility table). Calculation for elderly/disabled: subtract 30% net income from max allotment[2][3][6][7].
- Varies by: household_size

**How to apply:**
- Online: myDHR portal (mydhrbenefits.dhr.state.md.us)
- Phone: Maryland SNAP hotline 1-800-332-6347
- Mail: Local Department of Social Services (find via dhs.maryland.gov/local-offices)
- In-person: Local Department of Social Services office

**Timeline:** Must file application, be interviewed, meet eligibility; some expedited processing available but not specified

**Watch out for:**
- Include all household members who buy/prepare food together, even non-eligible ones
- Social Security, veterans benefits, disability count as income
- Work registration required for able-bodied 16-60 (exceptions for elderly/disabled)
- 3-month limit for unemployed childless adults without disability
- Asset test applies differently for elderly/disabled households
- Medical expenses deductible for 60+ or disabled—don't miss reporting them
- State minimum $30 for 62+ starts Oct 1, but federal min otherwise
- Only ~half of eligible seniors enroll[1]

**Data shape:** Benefits scale by household size and net income (30% deduction for elderly/disabled); higher income threshold (165% poverty) and asset limit for households with 60+/disabled; statewide with local offices; state supplement for seniors 62+

**Source:** https://dhs.maryland.gov/supplemental-nutrition-assistance-program/

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: FY26 income guidelines (at or below 150% of Federal Poverty Guidelines, gross monthly income before taxes): 1: $2,608; 2: $3,525; 3: $4,441; 4: $5,358; 5: $6,275; 6: $7,191; 7: $8,108; 8: $9,025; 9: $9,942; 10: $10,859; 11+: Contact local OHEP office. Households receiving SNAP or TCA are categorically eligible without income proof or full application.[4][5]
- Assets: No asset limit applies.[1]
- Household includes everyone at the address covered by the same utility bill, even if not sharing expenses.[1]
- Income-based only; no turn-off notice required.[4][5][7]

**Benefits:** Maryland Energy Assistance Program (MEAP): Heating assistance max $750, min $25; Crisis assistance (year-round) winter max $600 (summer cooling not available). Payments made directly to utility/fuel supplier. Additional programs: EUSP (electric grant, once per July-June year); USPP (turn-off protection during heating season with budget billing).[1][7]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: https://marylandbenefits.gov or https://mydhrbenefits.dhr.state.md.us[5][6]
- Phone: 1-800-332-6347 (request application or assistance)[4][5][6]
- Mail: Submit completed DHS-FIA-9780-OHEP-Application for Energy Assistance with documents[4]
- In-person: Local OHEP/energy office or home visits for seniors/disabled/homebound[5]

**Timeline:** Not specified; apply early as funding limited and may close when funds exhausted[1]
**Waitlist:** No waitlist mentioned; first-come, first-served until funds run out[1][6]

**Watch out for:**
- Funding limited; apply early as applications may close when funds exhausted, even if program year-round[1][5]
- Household counts all at address on utility bill, unlike SNAP[1]
- SNAP/TCA recipients auto-eligible post-redetermination, no app needed[5]
- Must reapply annually[6]
- EUSP once per program year (July-June); USPP requires budget billing adherence[7]
- No cooling assistance except crisis[1]

**Data shape:** Administered via OHEP as MEAP (heating) + EUSP (electric) + crisis; year-round but heating-focused fall/winter; categorical eligibility for SNAP/TCA; varies by fuel type, income, size; local offices handle large households

**Source:** https://dhs.maryland.gov/office-of-home-energy-programs/[4][7]

---

### Maryland Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Statewide DOE WAP limits (updated 2/11/2026): max of 60% State Median Income (SMI) or 200% Federal Poverty Level (FPL), whichever is higher. Table for HH size 1: $48,085 (60% SMI); HH size 2: $62,880 (60% SMI). Full table not completely listed in sources but follows this pattern. Automatic eligibility if receiving: OHEP Utility Bill Pay Assistance, SNAP, TANF, SSI, HUD housing. Not automatic: Fuel Fund, Medicaid, etc. Priority for elderly (60+), disabled, families with children, high energy users/burden.[1][2][3]
- Assets: No asset limits mentioned in sources.
- Homeowners must prove ownership; renters eligible if landlord agrees.[3]
- Cannot have received weatherization services in last 12 months via WAP or similar.[2]
- Household must meet income guidelines; preference for elderly (60+), disabled, children under 5, high energy use.[1][2][4]

**Benefits:** Free in-home energy efficiency upgrades including: insulation (attic, floors, walls), blower door air infiltration reduction, hot water system improvements, lighting retrofits, furnace clean/tune/safety repairs/replacement/burner retrofit, health/safety items. Reduces energy costs by avg 30-35%. No specific dollar cap per home; based on assessment.[2][3]
- Varies by: priority_tier

**How to apply:**
- Phone: 844-400-3423 or 1-800-756-0119 (Office of Energy Efficiency, DHCD); 1-855-583-8976 (OHEP help); 240-777-4450 (EmPOWER MD).[2][3][7]
- DHCD application (screens for multiple programs); MCEEP Application (Montgomery).[3][7]
- Local agencies for assessment after eligibility.

**Timeline:** Not specified; local agency schedules energy assessment after eligibility determination.[3]
**Waitlist:** Not mentioned; priority given to elderly/disabled/families/high energy users, implying possible delays.[1]

**Watch out for:**
- Not auto-eligible from Medicaid, Fuel Fund, or DHCD rehab programs—must meet income directly.[1]
- Renters need landlord approval; no repeat services within 12 months.[2][3]
- Priority tiers mean elderly may wait less, but high demand possible; prove ownership strictly for homeowners.[1][2]
- Commercial spaces ineligible; multi-unit buildings limited (≤4 units standard).[4]

**Data shape:** Statewide with local agency delivery and priority tiers; income max(60% SMI, 200% FPL) auto-eligible via specific programs only; no asset test; benefits via professional assessment not fixed dollar.

**Source:** https://dhcd.maryland.gov/Energy-Home-Repair/pages/homeowner-grants/wap.aspx

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits for SHIP counseling services themselves. However, when assisting with related programs like Medicare Savings Programs (MSPs), Qualified Medicare Beneficiary (QMB), Specified Low Income Medicare Beneficiary (SLMB), or Extra Help, eligibility is determined by federal/state income and asset guidelines (specific dollar amounts not detailed in sources; counselors help assess). Low-income individuals are explicitly served.[1][3][4]
- Assets: No asset limits for core SHIP services. For programs SHIP assists with (e.g., QMB, SLMB, prescription assistance), assets are evaluated per federal guidelines (e.g., what counts as assets not specified; exemptions like primary home typically apply in MSPs, but counselors guide on details).[3]
- Medicare beneficiaries (age 65+ or under 65 with disabilities)
- Individuals nearing Medicare eligibility
- Caregivers and family members assisting Medicare recipients

**Benefits:** Free, unbiased, confidential one-on-one counseling and education on: Medicare Parts A/B/C/D basics; Medicare Advantage and Medigap plan comparisons; Prescription Drug Coverage (Part D); financial assistance programs (MSPs, Medicaid, Extra Help); enrollment assistance; claims/appeals/denials support; preventative/wellness benefits; billing issues; health care fraud; long-term care insurance; referrals to resources. Provided via phone, in-person, or community education (no fixed hours/dollar amounts; personalized sessions).[1][2][3][4]
- Varies by: region

**How to apply:**
- Phone: 1-800-243-3425 (statewide)[7]
- In-person: Local county offices, senior centers, or Area Agencies on Aging (e.g., Prince George's County, Carroll County at 125 Stoner Avenue, Westminster, MD 21157 / 410-386-3800; St. Mary's County senior activity centers)[1][2][3]
- Website: aging.maryland.gov (state site for info and local contacts); shiphelp.org/ships/maryland for directory[4][7]
- No specific online application form; contact for appointment-based counseling. For related programs (e.g., QMB/SLMB), applications available at senior centers.[3]

**Timeline:** No formal application processing; counseling available by appointment (timelines not specified; immediate phone assistance implied)

**Watch out for:**
- SHIP does not provide direct financial aid or healthcare; it's counseling/advocacy only—people confuse it with MSPs/QMB/Extra Help it helps apply for.[1][3]
- No income test for counseling, but assisted programs have strict limits (missed if not consulting counselor).[3]
- Services are appointment-based in some areas; call ahead for local availability.[2][3]
- Volunteers are local peers, unbiased—not sales agents (common misconception).[4]
- Focus on Medicare Open Enrollment (Oct 15-Dec 7); timely contact saves penalties.[4]

**Data shape:** no income test for counseling; county-based delivery with local senior centers/Area Agencies on Aging; assists with but separate from income-tested programs like MSPs

**Source:** https://aging.maryland.gov/pages/state-health-insurance-program.aspx

---

### Home Delivered Meals

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income limits specified; some providers like Meals on Wheels of Central Maryland assess fees based on reported monthly income and expenses via telephone intake, but documentation not required[4]. Medicaid waiver programs (CFC, HCBOW, ICS) require financial eligibility for institutional level of care, but specific dollar amounts not listed[3].
- Assets: No asset limits or details on countable/exempt assets mentioned across sources.
- Homebound (unable to leave home without assistance or shop/cook for self)[1][2][7]
- No caregiver to help with meal preparation[1]
- Live within delivery area of local provider[1]
- For Medicaid waivers: Medically necessary, pre-authorized in service plan, prevents institutionalization; cannot require assistance to warm/feed/clean up meal[3]
- Some programs require referral (e.g., healthcare provider for Moveable Feast)[6]

**Benefits:** Nutritionally balanced meals (at least 1/3 RDA/DRI, physician-certified menus); typically 1 hot meal/day M-F plus cold meal or frozen (5/week); weekly delivery of 10 frozen medically tailored entrees + produce for some; friendly volunteer visit; special diets accommodated; max 14/week in Medicaid waivers[2][3][6][7]
- Varies by: region

**How to apply:**
- Phone: Varies by region/provider, e.g., Meals on Wheels Central MD 410-558-0923[4], Anne Arundel 410-222-4257[7]
- Online: Meals on Wheels Central MD application form at mealsonwheelsmd.org/meal-connect/apply/[4]
- Referral: Required for some (e.g., provider referral to Moveable Feast)[6]
- Contact local Area Agency on Aging via Maryland Department of Aging site aging.maryland.gov for county-specific[8]

**Timeline:** Usually within a few days (Anne Arundel)[7]; telephone intake follow-up for Central MD[4]
**Waitlist:** Not mentioned; varies by local agency capacity[1]

**Watch out for:**
- Not a single statewide program—contact local Area Agency on Aging for your county; some charge sliding-scale fees based on income (e.g., Central MD); spouses/dependents may qualify but check locally; disabled non-seniors may be ineligible or pay (e.g., quadriplegic son disqualified)[1][4]; Medicaid waivers limit to 14/week, no assist with warming/feeding; referral required for specialized providers[3][6]

**Data shape:** Decentralized by county/provider with unique eligibility/providers/wait times; no uniform income table; often no caregiver + homebound core req; some fee-based or referral-only

**Source:** https://aging.maryland.gov/pages/nutrition.aspx

---

### National Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits specified in program guidelines[1][3][4]
- Assets: No asset limits specified; no mention of what counts or exemptions[1][3][4]
- Adult family members or other informal caregivers age 18 and older providing care to individuals 60 years of age and older[1][3][4]
- Adult family members or other informal caregivers age 18 and older providing care to individuals of any age with Alzheimer's disease and related disorders[1][3][4]
- Grandparents and other relatives (not parents) 55 years of age and older providing care to children under the age of 18[1][3][4]
- Grandparents and other relatives (not parents) 55 years of age and older providing care to adults age 18-59 with disabilities[1][3][4]

**Benefits:** Five specific services: 1. Information to caregivers about available services; 2. Assistance to caregivers in gaining access to services; 3. Individual counseling, organization of support groups, and caregiver training; 4. Respite care; 5. Supplemental services (on a limited basis). No specified dollar amounts or hours per week[1][3][4][7]

**How to apply:**
- Contact local Area Agency on Aging (administered by local network of Area Agencies on Aging)[1]
- No specific statewide phone number, URL, or form listed; eligibility screenings and application help provided by local providers (e.g., MAC Inc. for certain areas, Montgomery County HHS)[5][7]

**Timeline:** Not specified

**Watch out for:**
- No fees for core services, but supplemental services limited[1][7]
- Must contact local Area Agency on Aging; not a centralized application[1]
- Eligibility focuses on caregiver type and care recipient criteria, not income/assets[1][3][4]
- Program supports unpaid/informal caregivers only[1][4]

**Data shape:** Administered locally via Area Agencies on Aging with no income/asset tests; services fixed at five types with limited supplemental; eligibility tiered by caregiver-care recipient relationship and ages

**Source:** https://aging.maryland.gov/pages/national-family-caregiver-support.aspx[1]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually (e.g., via HHS Poverty Guidelines effective January 15, 2025). Families must confirm current thresholds with program staff, as they calculate based on all household income sources over the past 6-12 months, including Social Security, SSDI, SSI, and disability benefits. No specific table provided in sources; use DOL or MD Labor tools for precise figures.[1][2][3][4]
- Assets: No asset limits mentioned in sources.[1][2][3][4]
- Unemployed or poor employment prospects
- Legally eligible to work in the U.S.
- Resident of the service area (e.g., Prince George's County for some providers)
- Desire training and employment opportunities; need job skills training
- Priority for veterans/qualified spouses, over 65, disabled, low literacy/limited English, rural residents, homeless/at risk, or American Job Center users[1][2][3][4]

**Benefits:** Part-time on-the-job training (average 20 hours/week) at community service host agencies (non-profits/government, e.g., schools, hospitals, senior centers). Paid stipend at the highest of federal, state, or local minimum wage. Supportive services: personal/job counseling, job training, job referral. Wages exempt from income eligibility for federal housing programs and food stamps. Bridge to unsubsidized private sector jobs.[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Phone: MD Labor SCSEP Program Manager Josephine Cabi at 410-767-2160 or email josephine.cabi@maryland.gov; Lorella Dicks at 410-767-2093 or lorella.dicks@maryland.gov[3]
- Online form: Prince George's County provider at https://www.tfaforms.com/4891021[2]
- In-person: Local providers like Prince George's County Family Services (details via county site)[1]
- National finder: CareerOneStop Older Worker Program Finder or 1-877-872-5627[4]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by provider demand.

**Watch out for:**
- Income at exactly 125% FPL requires staff confirmation—self-calculations may err[1]
- Must be unemployed with poor prospects; currently employed generally ineligible[2]
- County-specific residency (e.g., Prince George's)[1]
- Priority tiers limit access for non-priority applicants[4]
- Temporary training only (20 hrs/wk); goal is unsubsidized job placement, not long-term subsidy[3][4]

**Data shape:** Administered statewide by MD Labor but via local grantees with residency rules; income at 125% FPL (annual update, household size-based); priority tiers affect access; no asset test

**Source:** https://labor.maryland.gov/employment/scsep.shtml

---

### Senior Legal Assistance Program (Sixty Plus Legal Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Annual income must meet Maryland Legal Services Corporation (MLSC) guidelines, typically 50% of Maryland median income or up to 125% of federal poverty level depending on provider. Example from 2012-2013: $26,521 individual, $34,681 couple. Recent MVLS guidelines (50% median): Family of 1: $39,125/year; 2: $52,875; 3: $66,625; 4: $80,375; 5: $94,125; 6: $107,875. Senior Legal Helpline up to 500% FPL. Exact current limits confirmed via local AAA[1][2][3][4][9].
- Assets: Assets considered (property, vehicles, financial accounts); exceptions for medical expenses or other factors per MLSC guidelines. No fixed dollar limits specified statewide[3].
- Maryland resident
- Priority for greatest economic or social need
- Focus on civil legal issues like income maintenance, public benefits, housing, abuse

**Benefits:** Free or low-cost legal advice, counseling, and representation by local attorneys or law centers. Priority areas: income maintenance, nutrition, public/disability benefits, health care, protective services, abuse, housing, utilities, consumer protection, employment, age discrimination, advocacy for institutionalized persons. No cost for priority issues; low-cost via private attorneys for others[1][2][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) Maryland Access Point (MAP) - find via aging.maryland.gov
- Senior Legal Helpline: 1-800-896-4213 (Mon-Fri 9am-4pm)
- Eldercare Locator: 1-800-677-1116 or eldercare.acl.gov
- Local examples: St. Mary's (301-475-4200 ext. 1064), Baltimore Senior Legal Services (410-396-1322)
- In-person/mail via local AAA or contracted providers like Maryland Legal Aid

**Timeline:** Not specified in sources

**Watch out for:**
- Income based on MLSC guidelines which update yearly - verify current via AAA; free only for priority issues, low-cost otherwise; preference for greatest need may limit access; some counties have specialized exclusions/providers; not full representation always - may be advice/referral only[1][2][3][9].

**Data shape:** Decentralized via 19 local AAAs with contracted providers; income follows variable MLSC guidelines (50% median or 125% FPL); priority tier determines free vs low-cost; regional provider differences

**Source:** https://aging.maryland.gov/pages/senior-legal-assistance.aspx

---

### Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; this is not a financial assistance program. Note: Search result [1] confuses it with Medicaid eligibility, which is separate and requires income/resources tests for those 65+ or disabled (specific limits not detailed here).[1]
- Assets: No asset limits; advocacy services are free and available to all residents regardless of finances.[3][4]
- Resident (or prospective resident) of a nursing home or assisted living facility in Maryland.
- Services are resident-directed and require resident consent (or resident representative if applicable).
- Available to residents, families, friends, facility staff, or community members with concerns about resident rights, care, or quality of life.[3][5][6]

**Benefits:** Advocacy for health, safety, well-being, and rights; complaint investigation and resolution (resolves ~3,300 complaints/year); regular facility visits (~7,000/year across 1,850 facilities); education on rights and aging issues; information/referral; consultation; policy advocacy; monitoring conditions; support until disputes resolved. Free and confidential. No dollar amounts, hours, or tiers specified.[3][4][6][7]

**How to apply:**
- Contact local LTC Ombudsman program via 19 Local Programs at Area Agencies on Aging (regions served statewide).
- State Office: Maryland Department of Aging (website: https://aging.maryland.gov/pages/state-long-term-care-ombudsman.aspx).[3]
- Examples: Howard County - Phone: 410-313-6423, Email: LTCOmbudsman@howardcountymd.gov.[7]
- Montgomery County - Phone for related info: 240-777-3005 (Medicaid confusion noted).[1]
- No formal application form; services start with contacting Ombudsman to discuss concerns (consent obtained as needed).[2][3]

**Timeline:** Immediate response for consultation; complaint resolution varies by case (no fixed timeline specified).[3][4]

**Watch out for:**
- Not a Medicaid or financial aid program—pure advocacy only (often confused as in [1]).
- Requires resident consent for actions; Ombudsman works at resident direction, not automatically.
- Free/confidential, but independent of facilities (no conflicts of interest).
- Anyone can contact (not just residents), but prioritizes resident needs.
- For emergencies or regulatory violations, may refer to Office of Health Care Quality (OHCQ).[6][7]

**Data shape:** no income test; resident consent-driven advocacy; delivered via 19 regional local programs statewide; free to all in nursing homes/assisted living; not financial aid

**Source:** https://aging.maryland.gov/pages/state-long-term-care-ombudsman.aspx[3]

---

### Maryland Senior Call Check Program (SCC)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; program is free for all eligible Maryland residents.
- Assets: No asset limits or tests.
- Maryland resident
- Has a working landline or cell phone (TTY available)
- No automated telephone system blocking technology (must disable if present)
- Must apply on their own behalf (no one else can apply for them)
- Highly recommended: willing alternate contact person (e.g., adult child, neighbor, loved one)

**Benefits:** Daily automated telephone call or text message at a pre-selected one-hour time block between 8 a.m. and 4 p.m. (e.g., 8-10 a.m. or 2-4 p.m.). If unanswered after three attempts, calls alternate contact to encourage welfare check. If alternate also unreachable, contacts local non-emergency law enforcement for welfare check. Available every day except six holidays (New Year’s, Memorial Day, 4th of July, Labor Day, Thanksgiving, Christmas).

**How to apply:**
- Online: http://aging.maryland.gov/Pages/senior-call-check-sign-up.aspx
- Phone: toll-free 1-866-502-0560 (Senior Call Check Program lines open Monday-Friday 8 a.m.-5 p.m., Saturday 9 a.m.-3 p.m.)
- Mail: Request paper application by phone; mail completed form to Maryland Department of Aging, 217 E. Redwood St., 9th Floor, Baltimore MD 21202

**Timeline:** Typically immediate enrollment upon acceptance; verification and enrollment can be completed within 24 hours Monday-Saturday.

**Watch out for:**
- Must apply individually; no proxy applications allowed.
- Automated call blocking must be disabled on participant and alternate phones.
- Program does not guarantee timely law enforcement welfare checks due to limited resources.
- Age eligibility listed variably as 60 or 65 across sources; official site states 60+.
- No service on six specified holidays.
- Alternate contact is highly recommended but not strictly required; without one, escalates directly to non-emergency services.

**Data shape:** No financial means test; purely service-based with simple telephony requirements; statewide uniform operation; self-application only.

**Source:** https://aging.maryland.gov/pages/senior-call-check.aspx

---

### Senior Assisted Living Subsidy Program (SALS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: Net monthly income not higher than 60% of state median income. Specific figures vary slightly by county and date: Individual - $4,350/month ($52,200/year) [2][5][6]; Couple - income assessed individually [2]. Personal allowance of $130/month deducted from income for subsidy calculation [1].
- Assets: Individual: $20,064; Couple: $26,400. Counts typical countable assets; exemptions not detailed but personal allowance, medical expenses, and other costs considered in eligibility [1][2][3][5].
- Maryland resident [2]
- Physically or mentally impaired, needing assistance with activities of daily living (ADLs) like bathing, grooming, dressing, mobility [1][3]
- Require 24-hour supervision, documented by nurse assessment (e.g., from Department of Health and Human Services) [2]
- Already resident in participating assisted living facility, approved for entrance, or entered service agreement with Area Agency on Aging [1][3]
- Functional assessment required (e.g., AERS assessment) [6]

**Benefits:** Subsidy covers difference between resident's net monthly income (after $130 personal allowance) and approved monthly assisted living fee. Covers services including meals, personal care, 24-hour supervision. Maximum monthly subsidy: $1,000 [5][6]. Total monthly care rate capped (e.g., $3,300 in Montgomery County) [2].
- Varies by: region

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA), Maryland Access Point (MAP), or county offices (e.g., Montgomery: 240-777-1138 [2]; Howard/MAP: 410-313-1234 [3]; Anne Arundel/MAP: 410-222-4257 [6]; Queen Anne's: 410-758-0848 [7])
- Mail/In-person: Submit application to local AAA (e.g., Anne Arundel: 2666 Riva Rd., Suite 200, Annapolis, MD 21401 [6])
- Request application by phone; no statewide online application specified

**Timeline:** Not specified statewide; applications date-stamped and processed per funding availability [2]
**Waitlist:** Yes, statewide and county-specific due to limited funding; first-come, first-served after complete application; eligible applicants wait for space/funding [2][3][5]

**Watch out for:**
- Must be in or approved for a participating assisted living facility; families responsible for finding one [2]
- Waitlists common due to limited funding; first-come, first-served only after full application completion [2][3][5]
- Income/assets change periodically (e.g., tied to 60% state median, CPI adjustments [1][2])
- Requires functional/nurse assessment for ADL needs and 24-hour supervision [1][2][6]
- Not Medicaid waiver (different from MA-P for Assisted Living, which has separate rules like age 50+ [4])
- VA Aid & Attendance excluded from income limit [5]

**Data shape:** Statewide framework with county-administered variations in contacts, exact income figures, rate caps, and providers; subsidy calculated individually after deductions; limited funding drives waitlists

**Source:** https://aging.maryland.gov/pages/senior-assisted-living-subsidy-program.aspx

---

### Senior Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"description":"2025 income and asset limits (varies by household size)","single":{"gross_monthly_income":"$3,997.50","assets":"$11,000"},"couple":{"gross_monthly_income":"$4,656.83","assets":"$14,000"},"note":"Final eligibility determined at county level; limits may be updated annually"}
- Assets: {"single":"$11,000","couple":"$14,000","what_counts":"Individual's income and assets are reviewed; specific countable/exempt assets determined during assessment","what_may_be_exempt":"Primary residence may be exempt (varies by program variant and county)"}
- Must be at least 65 years of age
- Must be a Maryland resident
- Must be at risk for nursing home placement OR moderately disabled
- Typically requires assistance with at least 1 of 3 activities of daily living (ADLs)
- Must live in the community

**Benefits:** Case management, comprehensive needs assessment, case manager to coordinate services, and gap-filling Senior Care funds to purchase services (specific dollar amounts not disclosed in available sources)
- Varies by: funding availability and county; gap-filling funds are discretionary

**How to apply:**
- Phone: Contact your county's Area Agency on Aging or Aging and Disability Services office (example: Montgomery County: 240-777-3000)
- In-person: Visit local county Aging and Disability Services office
- Mail: Contact county office for mailing address
- Online: Check your county government website (varies by county)

**Timeline:** State law requires decision within 30 days of application; however, actual approval timeframe varies by county and funding availability
**Waitlist:** Program is grant-funded and NOT an entitlement program. Eligibility period, approval, and waitlist time vary according to funding availability. No specific waitlist timeline provided in available sources.

**Watch out for:**
- NOT an entitlement program — funding is grant-based and limited. Approval is not guaranteed even if you meet eligibility criteria.
- Waitlist and approval times vary dramatically by county and funding availability. Some counties may have significant delays.
- Income and asset limits are updated annually (2025 figures provided; verify current limits with your county office).
- Final eligibility is determined at the COUNTY level, not state level. Requirements and available services may differ between counties.
- Program requires assistance with activities of daily living (ADLs) — not all seniors qualify even if they meet age and income requirements.
- Gap-filling funds are discretionary and depend on funding availability; not all services may be available in all counties.
- This is a community-based program for seniors at risk of nursing home placement — it is NOT nursing home care itself.
- Similar programs exist (Community First Choice, Community Personal Assistance Services, Senior Assisted Living Subsidy Program) with different eligibility criteria and benefits; ensure you're applying to the correct program for your situation.

**Data shape:** Senior Care Program is county-administered with state oversight, creating significant regional variation in eligibility timelines, available services, and waitlist status. Income/asset limits scale by household size. Program is grant-funded and non-entitlement, meaning approval depends on available funding. Eligibility requires both financial qualification AND medical/functional need (ADL assistance). The program functions as a gap-filler for community-based services rather than providing direct care or fixed benefit amounts.

**Source:** https://aging.maryland.gov/ (Maryland Department of Aging); contact your county Area Agency on Aging for specific program details

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Maryland Durable Medical Equipment Reuse | resource | state | simple |
| Community First Choice (CFC) | benefit | state | deep |
| Maryland PACE | benefit | local | deep |
| Maryland Medicare Savings Program (MSP) | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Maryland Weatherization Assistance Progr | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Home Delivered Meals | benefit | local | deep |
| National Family Caregiver Support Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Senior Legal Assistance Program (Sixty P | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Maryland Senior Call Check Program (SCC) | benefit | state | medium |
| Senior Assisted Living Subsidy Program ( | benefit | state | deep |
| Senior Care Program | benefit | state | deep |

**Types:** {"resource":4,"benefit":11,"employment":1}
**Scopes:** {"state":7,"local":2,"federal":7}
**Complexity:** {"simple":4,"deep":10,"medium":2}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/MD/drafts.json`.

- **Maryland Durable Medical Equipment Reuse Program (DME)** (resource) — 3 content sections, 6 FAQs
- **Community First Choice (CFC)** (benefit) — 4 content sections, 6 FAQs
- **Maryland PACE** (benefit) — 5 content sections, 6 FAQs
- **Maryland Medicare Savings Program (MSP)** (benefit) — 4 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Maryland Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Home Delivered Meals** (benefit) — 4 content sections, 6 FAQs
- **National Family Caregiver Support Program** (benefit) — 1 content sections, 6 FAQs
- **Maryland Senior Call Check Program (SCC)** (benefit) — 2 content sections, 6 FAQs
- **Senior Assisted Living Subsidy Program (SALS)** (benefit) — 5 content sections, 6 FAQs
- **Senior Care Program** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **equipment_type**: 1 programs
- **not_applicable**: 4 programs
- **region**: 4 programs
- **priority_tier**: 4 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **funding availability and county; gap-filling funds are discretionary**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Maryland Durable Medical Equipment Reuse Program (DME)**: No income/age/asset tests; free to all MD residents with need; two-tier equipment (basic vs complex with provider form); stock-dependent availability; statewide with regional pickup sites only
- **Community First Choice (CFC)**: CFC has multiple eligibility pathways: (1) Regular State Medicaid Plan with income below 150% of federal poverty level; (2) SSI recipients (automatic Medicaid eligibility); (3) Community Options Medicaid Waiver (allows higher income). Income limits are fixed at $350/month (individual) and $392/month (couple) for 2026 under the standard pathway[1]. The program is statewide but administered through county-level Health Departments and Departments of Social Services, creating potential regional variation in processing and service delivery. No specific dollar amounts or hours per week are provided for individual services—benefits are service-based rather than cash-based. Processing timelines and waitlist status are not publicly documented in available sources.
- **Maryland PACE**: Provider-specific service areas only (not statewide); no fixed income/asset caps for core eligibility (Medicaid-tied); multiple regional PACE organizations; dual-eligible focus (90%+ participants)
- **Maryland Medicare Savings Program (MSP)**: Tiered by income brackets (QMB/SLMB/QI) with federal asset caps; disregards for earned/unearned income; statewide but local DSS processing; auto-linked to MA application
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits scale by household size and net income (30% deduction for elderly/disabled); higher income threshold (165% poverty) and asset limit for households with 60+/disabled; statewide with local offices; state supplement for seniors 62+
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered via OHEP as MEAP (heating) + EUSP (electric) + crisis; year-round but heating-focused fall/winter; categorical eligibility for SNAP/TCA; varies by fuel type, income, size; local offices handle large households
- **Maryland Weatherization Assistance Program**: Statewide with local agency delivery and priority tiers; income max(60% SMI, 200% FPL) auto-eligible via specific programs only; no asset test; benefits via professional assessment not fixed dollar.
- **State Health Insurance Assistance Program (SHIP)**: no income test for counseling; county-based delivery with local senior centers/Area Agencies on Aging; assists with but separate from income-tested programs like MSPs
- **Home Delivered Meals**: Decentralized by county/provider with unique eligibility/providers/wait times; no uniform income table; often no caregiver + homebound core req; some fee-based or referral-only
- **National Family Caregiver Support Program**: Administered locally via Area Agencies on Aging with no income/asset tests; services fixed at five types with limited supplemental; eligibility tiered by caregiver-care recipient relationship and ages
- **Senior Community Service Employment Program (SCSEP)**: Administered statewide by MD Labor but via local grantees with residency rules; income at 125% FPL (annual update, household size-based); priority tiers affect access; no asset test
- **Senior Legal Assistance Program (Sixty Plus Legal Program)**: Decentralized via 19 local AAAs with contracted providers; income follows variable MLSC guidelines (50% median or 125% FPL); priority tier determines free vs low-cost; regional provider differences
- **Long-Term Care Ombudsman Program**: no income test; resident consent-driven advocacy; delivered via 19 regional local programs statewide; free to all in nursing homes/assisted living; not financial aid
- **Maryland Senior Call Check Program (SCC)**: No financial means test; purely service-based with simple telephony requirements; statewide uniform operation; self-application only.
- **Senior Assisted Living Subsidy Program (SALS)**: Statewide framework with county-administered variations in contacts, exact income figures, rate caps, and providers; subsidy calculated individually after deductions; limited funding drives waitlists
- **Senior Care Program**: Senior Care Program is county-administered with state oversight, creating significant regional variation in eligibility timelines, available services, and waitlist status. Income/asset limits scale by household size. Program is grant-funded and non-entitlement, meaning approval depends on available funding. Eligibility requires both financial qualification AND medical/functional need (ADL assistance). The program functions as a gap-filler for community-based services rather than providing direct care or fixed benefit amounts.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Maryland?
