# Texas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 8 |
| Data discrepancies | 3 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 9 programs
- **in_kind**: 1 programs
- **financial**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### STAR+PLUS

- **min_age**: Ours says `21` → Source says `65` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-are-older/starplus-home-community-based-services-hcbs-waiver))
- **income_limit**: Ours says `$2,982` → Source says `$2,901` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-are-older/starplus-home-community-based-services-hcbs-waiver))
- **benefit_value**: Ours says `$20,000 – $50,000/year in 2026` → Source says `Managed care Medicaid including acute care (physician visits, hospital, pharmacy, dental, vision, NEMT), long-term services (service coordination, nursing, therapies), and HCBS waiver for those qualifying: Day Activity & Health Services (DAHS, up to 5 days/week Mon-Fri for physical/mental/medical/social needs), Personal Attendant Services (PAS), minor home modifications, specialized medical equipment, respite, transition services. Nursing facility residents get room/board, supplies, rehab. Extra plan-specific perks (e.g., Weight Watchers subscription, camp allowances, asthma supplies) vary by MCO.[3][5][6]` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-are-older/starplus-home-community-based-services-hcbs-waiver))

### Weatherization Assistance Program

- **benefit_value**: Ours says `$5,000 – $8,000 in free improvements` → Source says `Energy audit of home efficiency (identifies air leaks, inefficient appliances). Installation of weatherization measures including caulking, weather-stripping, ceiling/wall/floor insulation, patching building envelope holes, duct work, tune-up/repair/replacement of heating/cooling systems. Must meet specific energy-savings goals per DOE standards. No fixed dollar amount or hours; services based on audit results. Education on energy savings. Does not typically replace full HVAC systems[6][4][3].` ([source](https://www.tdhca.texas.gov/weatherization-assistance-program))

### Meals on Wheels

- **benefit_value**: Ours says `$1,500 – $3,600/year in 2026` → Source says `Home-delivered nutritious, often medically-tailored meals (typically 1 hot meal per weekday; some offer weekend frozen meals). Includes safety check and brief social contact by volunteer deliverers; case management for holistic needs assessment.[1][2][4]` ([source](https://www.mealsonwheelsamerica.org/find-meals-and-services/))

## New Programs (Not in Our Data)

- **Medicaid Buy-In for Children (MBIC) / Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** — service ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/medicaid-buy-children-mbic or www.hhsc.state.tx.us/Help/HealthCare/Children/MBIC.html; QMB/SLMB/QI: https://www.hhs.texas.gov/services/medicare-medicaid))
  - Shape notes: MBIC income scales by household size (300% FPL); premiums vary by income/insurance; QI capped enrollment; dual MBIC (kids) vs Medicare help (elderly); disability=SSI criteria key
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.cms.gov/medicare/medicaid-coordination/about/pace[5]))
  - Shape notes: Only available in limited Texas regions via specific providers like Bienvivir; no direct income/asset test for PACE but tied to Medicaid financials for full benefits; requires nursing home certification while allowing community living
- **Supplemental Nutrition Assistance Program (SNAP)** — in_kind ([source](https://www.yourtexasbenefits.com))
  - Shape notes: Seniors 60+ simplified: net income only, no gross test; benefits scale by household size; medical/shelter deductions key for elderly; Texas-specific asset limit and HHSC administration.
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.tdhca.texas.gov/comprehensive-energy-assistance-program-ceap))
  - Shape notes: Administered regionally via 254 county subrecipients (CAAs/CEAP); income by household size; no asset test; benefits vary by fuel type, crisis status, and local funding; waitlists and slight guideline variations by area.
- **Texas State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.shiphelp.org/ships/texas/[7]))
  - Shape notes: no income/asset test; counseling service only, not benefits; statewide via local networks; Texas-specific name HICAP; volunteer-driven with national oversight by ACL[1][2][4][7]
- **Community Based Alternatives (CBA) Waiver** — service ([source](https://www.hhs.texas.gov/services/long-term-care/home-community-based-care/community-based-alternatives-cba))
  - Shape notes: Capped by nursing facility payment rate; priority-based waitlist; integrated with STAR+PLUS managed care; financial eligibility via standard Medicaid + waiver-specific NFLOC; no fixed service hours/dollars, plan individualized.
- **Community Caregiver Support Program** — service ([source](No primary .gov URL for exact 'Community Caregiver Support Program'; see Texas HHS for CCAD/CCSE: implied via ADRC contacts[2]))
  - Shape notes: No dedicated Texas 'Community Caregiver Support Program' found; data fragmented across CCAD (non-Medicaid in-home aid), STAR+PLUS (Medicaid waiver), and possible confusion with VA program; county-level ADRC delivery with income/functional tests
- **Legal Aid for Seniors through AAAs** — service ([source](https://texaslawhelp.org/article/area-agencies-on-aging-a-place-to-get-help[4]))
  - Shape notes: Decentralized across 28 regional AAAs covering all counties; no fixed income/asset tests but need-based prioritization; focuses on referrals to civil legal aid with separate eligibility; services free with ombudsman/benefit counseling core[3][4]

## Program Details

### Medicaid Buy-In for Children (MBIC) / Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 0-18 years for MBIC; 65+ for QMB/SLMB/QI (elderly Medicare beneficiaries)+
- Income: MBIC: Family adjusted gross income up to 300% of federal poverty level (e.g., ~$3,913/month for family with one child; ~$66,700/year for family of four; scales by household size—check current FPL table on official site). QMB/SLMB/QI: Monthly income limits (2026 figures vary; e.g., QMB ≤100% FPL ~$1,275 individual/$1,724 couple; SLMB ≤120% FPL ~$1,526 individual/$2,055 couple; QI ≤135% FPL ~$1,718 individual/$2,309 couple—confirm current via SSA/HHSC as they adjust annually).
- Assets: MBIC: Not specified in sources (focus on income; some exclusions apply). Adult Buy-In (related): Countable assets < $5,000 (cash, bank accounts counted; exemptions not detailed). QMB/SLMB/QI: ≤$9,660 individual/$14,470 couple (2026; excludes home, car, burial plots, etc.—standard Medicaid asset rules).
- MBIC: Disability meeting SSI criteria (significantly restricts daily activities); Texas resident; U.S. citizen/legal resident; unmarried; family income exceeds traditional Medicaid limits.
- QMB/SLMB/QI: Enrolled in Medicare Part A; Texas resident; U.S. citizen/legal resident; for elderly loved ones (65+); QI has priority/waitlist risk.
- Not living in institution for adult programs (related)

**Benefits:** MBIC: Full Medicaid child benefits—doctor/hospital visits (incl. emergency), prescriptions, dental, mental health, glasses, home care, speech/OT/PT therapies, case management, checkups. Premium based on income/family size/employer insurance (sliding scale, e.g., $20-$40/month possible). QMB: Medicare premiums/cost-sharing paid (Part A/B full coverage). SLMB: Part B premium paid. QI: Part B premium paid (limited enrollment).
- Varies by: household_size|priority_tier

**How to apply:**
- MBIC Online: www.hhsc.state.tx.us/Help/HealthCare/Children/MBIC.html (download form);
- Phone: 2-1-1 (request forms/mail/application help);
- Mail: Submit completed form to HHSC;
- QMB/SLMB/QI: YourTexasBenefits.com (online), 2-1-1, local HHSC office, or Form H1200 (general Medicaid app)

**Timeline:** Not specified; confirm receipt via 2-1-1 (Option 2, head of household SSN)
**Waitlist:** QI: Possible waitlist/priority (funds limited); others null

**Watch out for:**
- MBIC premium required (sliding scale—not free; based on AGI, family size, employer insurance).
- Income up to 300% FPL only—many assume 'too high' disqualifies entirely.
- QI: Waitlist/annual funding limits (not guaranteed).
- QMB/SLMB/QI assets exclude home/car but count cash—providers can't bill QMB patients.
- Must meet SSI-level disability (not just diagnosis).
- Children up to 18 only (transition to adult Buy-In at 19 if working).
- Forms computer-only; confirm receipt post-submit.

**Data shape:** MBIC income scales by household size (300% FPL); premiums vary by income/insurance; QI capped enrollment; dual MBIC (kids) vs Medicare help (elderly); disability=SSI criteria key

**Source:** https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/medicaid-buy-children-mbic or www.hhsc.state.tx.us/Help/HealthCare/Children/MBIC.html; QMB/SLMB/QI: https://www.hhs.texas.gov/services/medicare-medicaid

---

### STAR+PLUS

> Last verified: 2026-04-04

**Eligibility:**
- Age: 65+
- Income: Monthly income limit is $2,901 per applicant (300% of Federal Benefit Rate for 2025), regardless of marital status or household size. Each spouse applying is evaluated individually up to this amount.[1]
- Assets: Assets limited to $2,000 (countable resources). Exempt: primary home if equity ≤ $730,000 and applicant lives there or intends to return, or if spouse/child under 21/disabled child lives there; one vehicle; personal belongings; burial plots; life insurance up to $1,500 face value.[1][4]
- Texas resident
- 65+ years old or 21+ and disabled
- At risk of nursing home placement (requires Nursing Facility Level of Care, determined by MN/LOC assessment signed by physician and approved by TMHP)
- Medicaid eligible (e.g., SSI recipient, MAO protected, or meets nursing home Medicaid income/resources)
- Not enrolled in another Medicaid waiver (can remain on other interest lists)

**Benefits:** Managed care Medicaid including acute care (physician visits, hospital, pharmacy, dental, vision, NEMT), long-term services (service coordination, nursing, therapies), and HCBS waiver for those qualifying: Day Activity & Health Services (DAHS, up to 5 days/week Mon-Fri for physical/mental/medical/social needs), Personal Attendant Services (PAS), minor home modifications, specialized medical equipment, respite, transition services. Nursing facility residents get room/board, supplies, rehab. Extra plan-specific perks (e.g., Weight Watchers subscription, camp allowances, asthma supplies) vary by MCO.[3][5][6]
- Varies by: priority_tier

**How to apply:**
- Join interest list first (required due to waitlist): Call 211 or 877-541-7905
- After invitation: Apply for Medicaid via Your Texas Benefits (yourtexasbenefits.com), phone 211/877-541-7905, local HHS office in-person, or mail
- Select MCO (e.g., Community First, Molina, Superior, Wellpoint) after approval

**Timeline:** Medicaid approval varies; HCBS assessment by MCO post-Medicaid approval
**Waitlist:** Long interest lists (many years wait for HCBS invitation); some exceptions exist

**Watch out for:**
- Must join interest list first; years-long wait for HCBS (not immediate)
- Income/asset limits apply individually even for couples; home equity cap $730,000
- Requires NFLOC (nursing home level need); not just low income/age
- Managed by MCOs—select carefully as benefits/extras vary by plan/region
- Cannot be in another waiver; nursing home residents may transition out
- Applicant pays applied income toward nursing facility if applicable

**Data shape:** Long interest list wait for HCBS waiver; MCO-specific in regions; fixed individual income/asset limits (no household scaling); NFLOC medical tier required

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-are-older/starplus-home-community-based-services-hcbs-waiver

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; however, for Medicaid eligibility (common for participants), Texas long-term care Medicaid generally requires income under 300% of the Federal Benefit Rate ($2,901/month in 2025); asset limit of $2,000 (excluding primary home); Medicaid offers pathways like spend-down if limits not met[3].
- Assets: No asset limits for PACE enrollment; Medicaid-related assets $2,000 or less (excludes primary home, one vehicle, personal belongings, burial plots); countable assets include bank accounts, secondary properties, investments[3].
- State-certified (Texas) as needing nursing home level of care
- Live in the service area of a Texas PACE provider
- Able to live safely in the community with PACE support
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice

**Benefits:** Comprehensive medical and social services including primary care, hospital care, prescription drugs, social services, restorative therapies, home care, day center care (transportation to adult day health center), personal care, homemaker services, respite care, all coordinated to nursing home level in community setting; no specific dollar amounts or hours stated, covers all needed services without copays for dually eligible[2][4][5].
- Varies by: region

**How to apply:**
- Phone: Contact provider intake, e.g., Bienvivir (El Paso) at (915) 562-3444 ext. 1442[1]
- Online form: Provider-specific, e.g., Bienvivir eligibility form at https://es.bienvivir.org/eligibility[1]
- In-person: At PACE provider centers
- Assisted by provider; state (Texas) approves enrollment[1]

**Timeline:** Not specified in sources
**Waitlist:** Possible, as some HCBS waivers have waitlists but PACE may serve as alternative[3]

**Watch out for:**
- Limited geographic availability in Texas—not statewide, must live in specific provider service area[1][2]
- No Medicare Advantage or hospice enrollment allowed[2]
- State certification for nursing home level care required, involves assessment[1][4]
- Most participants dually eligible, but private pay possible if not Medicaid-qualified[2][3]
- Voluntary enrollment; approval by Texas state after provider assistance[1]

**Data shape:** Only available in limited Texas regions via specific providers like Bienvivir; no direct income/asset test for PACE but tied to Medicaid financials for full benefits; requires nursing home certification while allowing community living

**Source:** https://www.cms.gov/medicare/medicaid-coordination/about/pace[5]

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For seniors (60+), only the **net income test** applies. Federal limits effective Oct 1, 2025–Sept 30, 2026: **$15,060/year ($1,255/month) for 1 person**; **$20,440/year ($1,703/month) for 2 people**. Texas gross income limits (approximate, vary by source): 1 person ≤$2,152/month; add ~$757/person. Net income calculated by deducting standard deduction, medical expenses >$35/month (for elderly), shelter costs. Income includes Social Security, pensions, VA/disability benefits[1][2][3][5].
- Assets: Texas has **$2,000 asset limit** for household of 1 (increases by household size). Counts: bank accounts, cash, stocks, IRA/ retirement savings (if accessible). Exempt: primary home, most vehicles, household goods, life insurance cash value (varies), income-producing property (sometimes). Some states waive asset test; Texas applies it[1][4][6].
- Household includes everyone who lives together and buys/prepares food.
- U.S. citizen or qualified non-citizen.
- Seniors 60+ exempt from work requirements.
- Must live in Texas.
- Medical expenses deductible for elderly/disabled.

**Benefits:** EBT card for groceries (food only, no hot/prepared foods, alcohol, tobacco). Max monthly: **$298 for 1 person**; add **$218/additional person** (e.g., $516 for 2). Actual amount = max allotment minus 30% of net income. Seniors average ~$188/month[2][3][4][6].
- Varies by: household_size

**How to apply:**
- Online: https://www.yourtexasbenefits.com[4][7]
- Phone: Dial 211 (statewide) to request mailed app or assistance[4]
- Mail: Request via 211; send to local HHSC office
- In-person: Local Texas Health and Human Services (HHSC) office (find via 211 or YourTexasBenefits.com)

**Timeline:** Typically 30 days; expedited (7 days) if income <$150/month and assets <$100, or utility shutoff risk.

**Watch out for:**
- Seniors only need **net income test** (not gross)—deduct medical/shelter costs to qualify[1][3].
- Own home/savings? Often still eligible (exempt assets)[1].
- Include **all household members** who share food, even non-eligible[1].
- Social Security/pensions **count as income**[1][3].
- Texas has **asset test** ($2k); not waived like some states[4].
- Work rules exempt seniors 60+, but verify if under 60[2][5].
- 2025 changes: Updated work/non-citizen rules via One Big Beautiful Bill Act[3][5].

**Data shape:** Seniors 60+ simplified: net income only, no gross test; benefits scale by household size; medical/shelter deductions key for elderly; Texas-specific asset limit and HHSC administration.

**Source:** https://www.yourtexasbenefits.com

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income at or below 150% of federal poverty level (varies by household size). For 2025: 1 person $2,815/month; 2 people $3,681/month; 3 people $4,547/month; 4 people $5,414/month; 5 people $6,280/month; 6 people $7,146/month. Annual example for 2-person household: $38,541 or less. Automatic eligibility if receiving SNAP, SSI, TANF, or certain veterans' benefits.[2][3]
- Assets: No asset limit.[2]
- Texas resident with proof (e.g., utility bill, lease).
- U.S. citizen or qualified non-citizen (e.g., lawful permanent resident, refugee).
- Prioritizes elderly, disabled, families with young children, or energy crisis (e.g., shutoff notice).[1]

**Benefits:** One-time payment to utility company for heating/cooling bills. Regular: $1 minimum to $12,300 maximum (heating/cooling). Crisis: up to $2,400 maximum. Also includes related weatherization (insulation, repairs).[2]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Phone: (877) 399-8939 or 211.
- Website: 211Texas.org to find local agency.
- In-person/mail: Local Community Action Agency (CAA) or CEAP subrecipient (covers all 254 counties; e.g., Travis County CEAP at (512) 584-4120).
- Online account with utility (e.g., Texas Gas Service) speeds documentation.[4]

**Timeline:** Varies by region; placed on waitlist after submission, caseworker calls when turn arrives.[4]
**Waitlist:** Yes, common; applications placed in line by site, funding-dependent.[4]

**Watch out for:**
- Primarily delivered as CEAP in Texas (integrates LIHEAP funds); contact local CAA, not statewide office.
- Household includes all at address sharing utility bill (unlike SNAP).
- Funding limited by federal availability; waitlists common.
- Benefits paid directly to utility, not applicant.
- Priorities for elderly/disabled/crisis, but open to all qualifying.[1][2][4]

**Data shape:** Administered regionally via 254 county subrecipients (CAAs/CEAP); income by household size; no asset test; benefits vary by fuel type, crisis status, and local funding; waitlists and slight guideline variations by area.

**Source:** https://www.tdhca.texas.gov/comprehensive-energy-assistance-program-ceap

---

### Weatherization Assistance Program

> Last verified: 2026-04-04

**Eligibility:**
- Income: Household gross income at or below 200% of the federal poverty level. Income is calculated by collecting documentation from all household members age 18 and older for the entire 30-day period prior to application, then annualized. Varies by household size; exact dollar amounts follow current federal poverty guidelines (e.g., consult subrecipient for PY2025 table as no specific numbers in sources). No age requirement for households, but priority often given to elderly, disabled, or families with children under 6.
- Assets: No asset limits mentioned across sources.
- U.S. Citizen, U.S. National, or Qualified Alien status for all household members[4][1].
- Occupy the home as primary residence (must live in the house to be weatherized)[5][3].
- Home must be single-family, duplex, triplex, fourplex, or in some regions eligible mobile homes (not eligible in all areas, e.g., excluded by ATCog)[3][5].
- Home must pass energy audit to confirm need[3][6].
- Household defined as all persons living under one roof[4].
- Some regions require enrollment in specific programs like Customer Assistance Program or Medically Vulnerable Registry (e.g., Austin Energy)[5].
- Property value limits in some areas (e.g., $478,195 or less excluding land in Austin)[5].
- Home more than 10 years old and not previously weatherized in last 10 years (some regions)[5].

**Benefits:** Energy audit of home efficiency (identifies air leaks, inefficient appliances). Installation of weatherization measures including caulking, weather-stripping, ceiling/wall/floor insulation, patching building envelope holes, duct work, tune-up/repair/replacement of heating/cooling systems. Must meet specific energy-savings goals per DOE standards. No fixed dollar amount or hours; services based on audit results. Education on energy savings. Does not typically replace full HVAC systems[6][4][3].
- Varies by: priority_tier|region

**How to apply:**
- Contact local subrecipient agency (statewide list at TDHCA site; examples: TCOG phone 800-677-8264 ext. 3530, mail to TCOG 1117 Gallagher Dr. STE 450 Sherman TX 75090[1]; Austin Energy online form or mail to 4815 Mueller Blvd Austin TX 78723, phone 512-482-5346[5]; CCSCT application for specific counties[7]; SPCAA for South Plains[2]; Dallas County via local HHS[4]; ATCog[3].
- In-person or mail applications common; complete agency-specific forms.
- Online in some areas (e.g., Austin Energy form).
- Phone intake varies by subrecipient.

**Timeline:** Varies widely by region, number of clients, and funding; no fixed statewide timeline. Eligibility memo sent via mail after processing[1][4].
**Waitlist:** Common due to funding limits; prioritization matrix used (e.g., points for elderly, disabled, children under 6); strive for timely service but patience requested[4].

**Watch out for:**
- Must contact correct regional subrecipient, not state directly; statewide but hyper-local[6].
- Income proof strictly last 30 days annualized, no bank statements/W2s; notarized zero-income declaration required[1][7].
- Citizenship/qualified alien verification for EVERY household member, including children[4][1].
- Home must pass energy audit; no service if not needed. Mobile homes often excluded[3][6].
- Prioritization tiers (elderly/disabled/young kids first); long waitlists common[4].
- Renter needs landlord permission; owners may need financial commitment info[1][5].
- No recent prior weatherization (e.g., last 10 years in some areas)[5].
- Varies by utility/provider in some regions (e.g., Austin Energy customers only)[5].

**Data shape:** Administered via ~30 regional subrecipients with unique apps/forms/contacts; 200% FPL income test; priority tiers by vulnerability; services audit-driven, not fixed amount; county-restricted providers; mobile home eligibility varies; strict 30-day income docs only.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tdhca.texas.gov/weatherization-assistance-program

---

### Texas State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare-eligible individuals, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[1][2][3]
- Assets: No asset limits or tests apply[2][3]
- Must be Medicare-eligible (typically age 65+ or under 65 with certain disabilities); families and caregivers also eligible[1][2][3]

**Benefits:** Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), plan reviews, applications for Medicare Savings Programs (MSP), Low-Income Subsidy (Extra Help/LIS), Medicaid; group presentations, outreach, education on fraud prevention via Senior Medicare Patrol (SMP); provided in-person, by phone, media[1][2][3][4][7]

**How to apply:**
- Phone: 1-800-252-9240[7]
- Website: Texas Health Information, Counseling, and Advocacy Program (HICAP) site via shiphelp.org/ships/texas/[7]
- In-person or local counseling through community-based networks (contact via phone for local sites)[1][2][7]
- No specific online form or mail application mentioned; services accessed by contacting for appointment[2][3]

**Timeline:** No formal application processing; counseling provided upon contact, typically immediate or by appointment[2][3]

**Watch out for:**
- Not a direct healthcare or financial aid program—provides counseling only, not payments or services; in Texas called Health Information, Counseling, and Advocacy Program (HICAP); free but relies on trained volunteers/staff, so availability may depend on local capacity; often confused with Medicare Savings Programs it helps apply for[1][3][6][7]
- No enrollment wait or caps, but peak times (e.g., Open Enrollment) may have higher demand[2]

**Data shape:** no income/asset test; counseling service only, not benefits; statewide via local networks; Texas-specific name HICAP; volunteer-driven with national oversight by ACL[1][2][4][7]

**Source:** https://www.shiphelp.org/ships/texas/[7]

---

### Meals on Wheels

> Last verified: 2026-04-04

**Eligibility:**
- Age: 60+
- Income: No income limits or tests; eligibility based on need, not income. Voluntary contributions requested but no one denied for inability to pay.[1][3][4][6]
- Assets: No asset limits mentioned across programs.
- Primarily homebound and unable to prepare nutritious meals without consistent daytime assistance.[1][2][3][4][5][6]
- Reside in the specific program's delivery zone or service area (varies by local provider).[1][2][3][5][6]
- 60+ years old or disabled (some programs specify totally disabled).[1][2][3][5][6]
- Able to accept meals during delivery window (e.g., 10:30 a.m.-1:00 p.m.).[3]
- Nutritionally at risk or have physical/mental impairments making meal prep difficult.[3][6]
- Priority often given to greatest economic/social need, severe disabilities, dementia, etc.[5]

**Benefits:** Home-delivered nutritious, often medically-tailored meals (typically 1 hot meal per weekday; some offer weekend frozen meals). Includes safety check and brief social contact by volunteer deliverers; case management for holistic needs assessment.[1][2][4]
- Varies by: region

**How to apply:**
- Contact local provider: e.g., Tarrant County phone 817-336-0912 or online referral form; Meals on Wheels Central Texas 'Apply for our services' online; North Central Texas online referral; call local Area Agency on Aging or program directly (e.g., Rockwall 972-771-9514).[1][2][3][4][6]
- Anyone can refer (family, friends, hospitals, self).[4][7]
- In-person assessment/home visit by case manager or social worker follows initial contact.[1][2][3][4]

**Timeline:** Varies; some within a week, caseworker appointment within 2 working days (Tarrant); others longer if waitlist.[1][4]
**Waitlist:** Possible in some programs, leading to longer processing.[1]

**Watch out for:**
- Not a single statewide program—must find and contact the specific local provider for your area; eligibility/geography strictly local.[1][2][3][6]
- Homebound status key: those who can easily leave home or have cooking help may not qualify.[1][4]
- Car ownership or non-homebound status may disqualify.[1]
- Voluntary contributions expected but not required; some trial meals require payment if skipping full assessment.[6]
- Short-term service available for recovery but limited (e.g., 6 weeks).[3]

**Data shape:** Decentralized local providers with no statewide uniformity; no income/asset tests; service area and minor eligibility nuances vary by county/region; find via local Area Agency on Aging or Meals on Wheels America search.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mealsonwheelsamerica.org/find-meals-and-services/

---

### Community Based Alternatives (CBA) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Financial eligibility determined by Texas Health and Human Services Commission (HHSC) under Medicaid rules; must qualify for Medicaid. For HCBS waivers like CBA, income typically limited to 300% of SSI (approximately $2,829/month for an individual in 2025; exact amount varies annually and confirmed via HHSC). No specific household size table provided in sources, but parental income not considered for adults. STAR+PLUS HCBS (related program) follows standard Medicaid income rules with no unique CBA table.
- Assets: Standard Medicaid asset limits apply (typically $2,000 for individual; $3,000 for couple). Home exempt if applicant lives there or intends to return with equity ≤$730,000, or if spouse/child under 21/disabled child lives there. Other exemptions include one vehicle, personal belongings, burial plots. Countable assets: bank accounts, investments, second vehicles/properties.
- Must meet medical necessity for nursing facility level of care (NFLOC) and be at risk for nursing facility placement.
- Cost of service plan cannot exceed nursing facility payment rate.
- Must choose waiver services over nursing facility care via informed choice.
- Texas resident; not already in a nursing facility.
- Functional needs: assistance with activities of daily living (e.g., bathing, eating, mobility) or behavioral issues indicating NFLOC.

**Benefits:** Home and community-based services (HCBS) as alternative to nursing facility care, including personal attendant services, respite, minor home modifications, adaptive aids, nursing, therapies (OT/PT/ST), day habilitation, behavioral supports. Specific services tailored to service plan; no fixed dollar amounts or hours stated, but total plan cost capped at nursing facility rate.
- Varies by: priority_tier

**How to apply:**
- Contact local providers like Good Samaritan (specific contact via their site; general HHSC phone: 2-1-1 or 877-541-7905).
- Apply for Medicaid/HCBS via Your Texas Benefits portal (yourtexasbenefits.com).
- Phone: Call HHSC at 2-1-1 or local Area Agency on Aging.
- In-person: Local HHSC offices or aging/disability resource centers.
- Mail: Form H1200 or related Medicaid applications to HHSC.

**Timeline:** Varies; Medicaid eligibility determination typically 45 days, but waiver interest list immediate.
**Waitlist:** Yes, interest/waiting lists common for HCBS waivers as not an entitlement; length varies by region and priority (e.g., highest need first).

**Watch out for:**
- Must choose waiver over nursing facility (informed choice required; cannot dual-enroll).
- Not automatic Medicaid; separate financial/functional eligibility checks.
- Waitlists can be years long; apply to interest list early even if not ready.
- Income over SSI may still qualify via waiver rules (up to 300% SSI) but requires spend-down.
- Home equity limit $730,000; estate recovery may apply post-death.
- Overlaps with STAR+PLUS HCBS; some STAR+PLUS enrollees excluded if under 1115 waiver.
- Services capped by nursing facility cost; not unlimited.

**Data shape:** Capped by nursing facility payment rate; priority-based waitlist; integrated with STAR+PLUS managed care; financial eligibility via standard Medicaid + waiver-specific NFLOC; no fixed service hours/dollars, plan individualized.

**Source:** https://www.hhs.texas.gov/services/long-term-care/home-community-based-care/community-based-alternatives-cba

---

### Community Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits identified for a program named 'Community Caregiver Support Program' in Texas; related programs like Community Care for Aged/Disabled (CCAD) have limits such as $2,829/month for a single person and $5,658 for a couple (2024 figures, adjusted annually)[2].
- Assets: No specific asset limits for this program; CCAD references $5,000 for single and $6,000 for couples, with lower limits for some services like Community Attendant Services[2].
- No exact match found in Texas state sources for 'Community Caregiver Support Program'; closest is CCAD (Community Care for Aged/Disabled), requiring Texas residency, age 18+, disability or need for daily activities help, not receiving Medicaid for same services[2]
- Texas regulations reference caregiver support services eligibility under 40 Tex. Admin. Code § 700.1003 and § 700.1017, requiring Texas residency, but details not in results[5]
- VA Caregiver Support Program (national, not Texas-specific) requires veteran/service member with serious injury, need for 6+ months personal care, caregiver 18+ and family relation or live-in[1]

**Benefits:** No specific benefits detailed for 'Community Caregiver Support Program'; CCAD provides non-medical support for independent living, help with everyday tasks for older adults/disabled[2]

**How to apply:**
- For CCAD (related): Call Aging and Disability Resource Center (ADRC) at 1-855-937-2372 or find local ADRC[2]
- Contact Texas Health and Human Services or local Area Agency on Aging for caregiver programs like STAR+PLUS or CAS[6]

**Timeline:** Not specified

**Watch out for:**
- Program name may refer to VA national program, not Texas-specific; families should verify with Texas HHS as results point to CCAD or STAR+PLUS instead[1][2][6]
- Eligibility often tied to not receiving duplicate Medicaid services; income/assets adjusted annually[2]
- Caregiver support under Texas Admin Code requires meeting broader criteria in §700.1003, details unavailable here[5]

**Data shape:** No dedicated Texas 'Community Caregiver Support Program' found; data fragmented across CCAD (non-Medicaid in-home aid), STAR+PLUS (Medicaid waiver), and possible confusion with VA program; county-level ADRC delivery with income/functional tests

**Source:** No primary .gov URL for exact 'Community Caregiver Support Program'; see Texas HHS for CCAD/CCSE: implied via ADRC contacts[2]

---

### Legal Aid for Seniors through AAAs

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict financial criteria; income and resources may be reviewed to prioritize highest need, but services are available regardless of income level[4].
- Assets: No asset limits specified; prioritization based on need indicators like functional impairment, isolation, or low income, but not a barrier to eligibility[3][4].
- Texas resident aged 60 or older (or family/caregiver of such person)
- Live in a county served by one of Texas's 28 AAAs (covers all 254 counties)
- Civil legal matters only (e.g., benefits, housing, consumer issues); no criminal or personal injury cases[1][2][4]

**Benefits:** Free legal aid services including one-on-one counseling on Medicare/Medicaid benefits, ombudsman advocacy for nursing homes/assisted living, referrals to legal aid organizations, and assistance with civil issues like benefits enrollment, housing, and consumer rights to support independent living[4][5]. No specific dollar amounts or hours defined; services provided as needed without charge[4].
- Varies by: priority_tier

**How to apply:**
- Contact local AAA by phone (examples: Concho Valley AAA (325) 223-5704[5], West Central Texas AAA (325) 672-8544[5], Capital Area AAA (512) 916-6062[5]; find local via Texas AAAs directory)
- In-person at local AAA offices (e.g., 2801 W. Loop 306, San Angelo, TX 76904 for Concho Valley[5]; 3702 Loop 322, Abilene, TX for West Central[5])
- Referrals through general legal aid lines like Legal Aid of NorthWest Texas (325) 677-8591[1][5] or Texas RioGrande Legal Aid (512) 374-2700[5]

**Timeline:** Not specified in sources; typically immediate counseling or referral upon contact[4].
**Waitlist:** No waitlist mentioned; services prioritized by need but available to all eligible[3][4].

**Watch out for:**
- Not direct legal representation; primarily counseling, ombudsman advocacy, and referrals to low-income legal aid orgs like Legal Aid of NorthWest Texas which have stricter 125-200% FPL income limits[1][2][4]
- Legal aid referrals require separate low-income eligibility (e.g., below 125-200% Federal Poverty Guidelines, U.S. citizen/LPR)[1][2]
- Prioritization for highest need (e.g., low-income minorities, rural, isolated, high nutritional risk); others may get referrals only[3][4]
- Civil matters only; no criminal/personal injury[1]
- Contact local AAA first, not statewide number[4][5]

**Data shape:** Decentralized across 28 regional AAAs covering all counties; no fixed income/asset tests but need-based prioritization; focuses on referrals to civil legal aid with separate eligibility; services free with ombudsman/benefit counseling core[3][4]

**Source:** https://texaslawhelp.org/article/area-agencies-on-aging-a-place-to-get-help[4]

---

### Long-Term Care Ombudsman Program

> Last verified: 2026-04-04

**Eligibility:**
- Income: No income limits; services are free and available to all residents regardless of financial status.
- Assets: No asset limits; no financial eligibility requirements apply.
- Must be a resident of a nursing facility or assisted living facility in Texas. Certain caregivers and family members of persons 60 years or older may also receive assistance.[2]

**Benefits:** Advocacy for residents' rights including investigating and resolving complaints, ensuring quality of life and care, providing resident rights information, monitoring laws and policies, representing residents in hearings, pursuing remedies, and protecting against abuse, neglect, or rights violations. Specific rights protected: respect/dignity, privacy, freedom from restraints/abuse, participation in care planning, choice of physician/pharmacy, grievance filing without reprisal, and access to records/inspection reports.[4][6][7]

**How to apply:**
- Phone: 800-252-2412 to speak with a local LTC ombudsman[7]
- Email: Contact form via ltco.texas.gov[7]
- In-person: Visit local ombudsman council/agency (find via ltco.texas.gov)[7]
- Online: Use 'Find an LTC Ombudsman' tool at ltco.texas.gov[7]

**Timeline:** Immediate response for complaints and advocacy; no formal processing as it's not an entitlement program.

**Watch out for:**
- Not a service provider or eligibility-determining program—purely advocacy for existing LTC residents, not for admission or financial aid.[5][9]
- Volunteers/staff must be independent with no conflicts (e.g., no facility employment or Medicaid eligibility roles).[2]
- Confidentiality applies to all complaints.[5]
- Does not cover non-LTC settings or developmental disability state centers.[7]
- People mistake it for direct care/funding; it's complaint resolution and rights protection only.

**Data shape:** no income test; open to all LTC residents statewide via local independent councils; advocacy-focused, not benefits/entitlements; volunteer-driven with regional administration

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ltco.texas.gov

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Buy-In for Children (MBIC) / Qu | benefit | federal | deep |
| STAR+PLUS | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | medium |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Texas State Health Insurance Assistance  | resource | federal | simple |
| Meals on Wheels | benefit | federal | medium |
| Community Based Alternatives (CBA) Waive | benefit | state | deep |
| Community Caregiver Support Program | benefit | state | medium |
| Legal Aid for Seniors through AAAs | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"resource":3}
**Scopes:** {"federal":7,"state":4,"local":1}
**Complexity:** {"deep":6,"medium":3,"simple":3}

## Content Drafts

Generated 12 page drafts. Review in admin dashboard or `data/pipeline/TX/drafts.json`.

- **Medicaid Buy-In for Children (MBIC) / Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** (benefit) — 5 content sections, 6 FAQs
- **STAR+PLUS** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 6 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 3 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **Texas State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels** (benefit) — 4 content sections, 6 FAQs
- **Community Based Alternatives (CBA) Waiver** (benefit) — 4 content sections, 6 FAQs
- **Community Caregiver Support Program** (benefit) — 2 content sections, 5 FAQs
- **Legal Aid for Seniors through AAAs** (resource) — 3 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **household_size|priority_tier**: 1 programs
- **priority_tier**: 3 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Buy-In for Children (MBIC) / Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)**: MBIC income scales by household size (300% FPL); premiums vary by income/insurance; QI capped enrollment; dual MBIC (kids) vs Medicare help (elderly); disability=SSI criteria key
- **STAR+PLUS**: Long interest list wait for HCBS waiver; MCO-specific in regions; fixed individual income/asset limits (no household scaling); NFLOC medical tier required
- **Program of All-Inclusive Care for the Elderly (PACE)**: Only available in limited Texas regions via specific providers like Bienvivir; no direct income/asset test for PACE but tied to Medicaid financials for full benefits; requires nursing home certification while allowing community living
- **Supplemental Nutrition Assistance Program (SNAP)**: Seniors 60+ simplified: net income only, no gross test; benefits scale by household size; medical/shelter deductions key for elderly; Texas-specific asset limit and HHSC administration.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered regionally via 254 county subrecipients (CAAs/CEAP); income by household size; no asset test; benefits vary by fuel type, crisis status, and local funding; waitlists and slight guideline variations by area.
- **Weatherization Assistance Program**: Administered via ~30 regional subrecipients with unique apps/forms/contacts; 200% FPL income test; priority tiers by vulnerability; services audit-driven, not fixed amount; county-restricted providers; mobile home eligibility varies; strict 30-day income docs only.
- **Texas State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling service only, not benefits; statewide via local networks; Texas-specific name HICAP; volunteer-driven with national oversight by ACL[1][2][4][7]
- **Meals on Wheels**: Decentralized local providers with no statewide uniformity; no income/asset tests; service area and minor eligibility nuances vary by county/region; find via local Area Agency on Aging or Meals on Wheels America search.
- **Community Based Alternatives (CBA) Waiver**: Capped by nursing facility payment rate; priority-based waitlist; integrated with STAR+PLUS managed care; financial eligibility via standard Medicaid + waiver-specific NFLOC; no fixed service hours/dollars, plan individualized.
- **Community Caregiver Support Program**: No dedicated Texas 'Community Caregiver Support Program' found; data fragmented across CCAD (non-Medicaid in-home aid), STAR+PLUS (Medicaid waiver), and possible confusion with VA program; county-level ADRC delivery with income/functional tests
- **Legal Aid for Seniors through AAAs**: Decentralized across 28 regional AAAs covering all counties; no fixed income/asset tests but need-based prioritization; focuses on referrals to civil legal aid with separate eligibility; services free with ombudsman/benefit counseling core[3][4]
- **Long-Term Care Ombudsman Program**: no income test; open to all LTC residents statewide via local independent councils; advocacy-focused, not benefits/entitlements; volunteer-driven with regional administration

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Texas?
