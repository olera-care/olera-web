# Texas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 47s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 11 |
| New (not in our data) | 5 |
| Data discrepancies | 5 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 8 programs
- **financial**: 2 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### STAR+PLUS

- **min_age**: Ours says `21` → Source says `65` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-think-or-have-physical-disabilities/starplus-home-community-based-services-hcbs-waiver (inferred from sources; primary via Your Texas Benefits or HHS)))
- **income_limit**: Ours says `$2,982` → Source says `$2,901` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-think-or-have-physical-disabilities/starplus-home-community-based-services-hcbs-waiver (inferred from sources; primary via Your Texas Benefits or HHS)))
- **benefit_value**: Ours says `$20,000 – $50,000/year in 2026` → Source says `Managed care Medicaid program including acute medical care, long-term services/supports (e.g., Day Activity & Health Services up to 5 days/week Mon-Fri for physical/mental/medical/social needs; Personal Attendant Services; nursing facility services if applicable like room/board, medical supplies, rehab); dental/vision; NEMT; pharmacy; service coordination; consumer-directed services; extras vary by plan (e.g., Weight Watchers subscription for qualifying BMI/diagnoses, emergency response up to 6 months post-discharge, asthma supplies, IDD camp allowance up to $100, extra rides).[3][5][6]` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-think-or-have-physical-disabilities/starplus-home-community-based-services-hcbs-waiver (inferred from sources; primary via Your Texas Benefits or HHS)))

### PACE (Program of All-Inclusive Care for the Elderly)

- **benefit_value**: Ours says `$15,000 – $35,000/year in 2026` → Source says `Comprehensive, all-inclusive care at adult day health center and home: primary/acute/specialty medical care, prescription drugs, hospital/inpatient care, therapy (PT/OT/ST), home care (personal attendants, homemaker, respite), transportation, social services, adult day health (meals, activities, therapies ~20-30 hours/week typical), dental/vision/hearing aids, palliative care. No copays/deductibles for enrollees; covers all Medicare/Medicaid-covered + extras. Average participant: age 76, multiple chronic conditions.[1][2][4]` ([source](https://www.npaonline.org/find-pace (national locator); https://www.texashealthandhumanservices.gov/services/aging (Texas HHSC); provider sites like https://www.bienvivir.org/eligibility))

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1,796` → Source says `$1,350` ([source](https://www.yourtexasbenefits.com or https://www.hhs.texas.gov/services/health/medicaid-chip/medicare-savings-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year in 2026` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums (~$185/month 2026), annual deductible, coinsurance/copayments for Medicare-covered Parts A/B services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only; auto-qualifies for Extra Help (prescription drugs, max $12.65 copay/drug 2026).[1][6]` ([source](https://www.yourtexasbenefits.com or https://www.hhs.texas.gov/services/health/medicaid-chip/medicare-savings-programs))

### Weatherization Assistance Program

- **benefit_value**: Ours says `$5,000 – $8,000 in free improvements` → Source says `Energy audit to identify inefficiencies; installation of weatherization materials including caulking, weather-stripping, ceiling/wall/floor insulation, hole patching, duct work, heating/cooling system tune-up/repair/replacement. Ensures energy savings, health/safety improvements, minor repairs. No fixed dollar amount or hours; scope based on audit using DOE-approved measures (10 CFR Part 440 Appendix A)[5]. Available once every 10-15 years[4][7].` ([source](https://www.tdhca.texas.gov/weatherization-assistance-program))

### Meals on Wheels

- **benefit_value**: Ours says `$1,500 – $3,600/year in 2026` → Source says `One hot, nutritious, often medically-tailored meal delivered weekdays; optional weekend frozen meals; case management/assessment; personal volunteer contact. No fixed dollar amount or hours specified[2].` ([source](https://www.mealsonwheelsamerica.org/find-meals-and-services/))

## New Programs (Not in Our Data)

- **Medicaid for Seniors/Disabled** — service ([source](https://www.yourtexasbenefits.com or https://www.hhs.texas.gov/services/health/medicaid-chip))
  - Shape notes: Multiple tiers/programs (Nursing Home entitlement, HCBS waivers with caps, Regular ABD); eligibility pathways vary by marital status/SSI; functional NFLOC assessment key; annual limit updates.
- **Community Based Alternatives (CBA) Waiver** — service ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-all-medicaid-chip-programs/community-first-choice))
  - Shape notes: Tied to Medicaid State Plan (no waitlist, unlike 1915(c) waivers); requires NFLOC; delivered via managed care like STAR+PLUS with regional MCO variations; income via SSI/300% SSI pathways, assets standard Medicaid with home exemptions
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.tdhca.texas.gov/comprehensive-energy-assistance-program-ceap))
  - Shape notes: Administered via 254 county subrecipients with regional variations in providers and waitlists; benefits via CEAP integration; income at 150% FPG, no asset test; seasonal components.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.shiphelp.org/ships/texas/ (Texas SHIP page); national: https://acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[2][8]))
  - Shape notes: no income/asset test for counseling access; statewide via regional local partners; service-based not financial aid; open to Medicare families/caregivers[1][2][3][8]
- **Community Caregiver Support Program** — service ([source](https://www.law.cornell.edu/regulations/texas/40-Tex-Admin-Code-SS-700-1017 (Texas Admin Code § 700.1017)[5]))
  - Shape notes: Sparse data; appears tied to Texas DFPS caregiver regulations (§700.1017 cross-ref §700.1003), not elderly-focused like query assumes; no dedicated elderly caregiver program clearly identified

## Program Details

### Medicaid for Seniors/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026, single nursing home applicant: under $2,982/month. Varies by program and marital status; e.g., 2025 STAR+PLUS HCBS waiver: $2,829 individual, $5,658 couple. SSI recipients automatically qualify. Full household table not specified; use Texas Medicaid calculator for precise household size adjustments.[3][8]
- Assets: Countable assets under $2,000 for single applicants (may vary slightly by program). Counts: bank accounts, CDs, property (non-primary), cash value of most life insurance, stocks, bonds. Exempt: primary home (under certain equity limits), one vehicle, personal belongings, burial plots. Strict asset transfer rules apply.[3][4][6]
- Texas resident
- U.S. citizen, national, or qualified legal alien
- 65+, blind, or permanently disabled with Nursing Facility Level of Care (NFLOC) for long-term care programs
- Medical/functional need (e.g., assistance with ADLs for some benefits)

**Benefits:** Health coverage including nursing home care (full coverage), home/community-based services (HCBS) waivers like STAR+PLUS (personal care, meals, medication management, adult day care, assisted living support), Day Activity and Health Services (DAHS: supervision, personal care). Specifics vary by program: Institutional Medicaid (nursing homes), Regular Medicaid/ABD (home/adult day care), waivers (limited slots).[3][4][5]
- Varies by: priority_tier

**How to apply:**
- Online: YourTexasBenefits.com
- Phone: 2-1-1 or 877-541-7905
- Mail or in-person: Local Health and Human Services office
- Any time if eligible

**Timeline:** Not specified in sources; typically 45-90 days for long-term care, varies.
**Waitlist:** Yes for HCBS waivers (limited participants); none for nursing home or Regular Medicaid (entitlement programs).[4]

**Watch out for:**
- Multiple programs with varying rules (e.g., waivers have waitlists, Regular Medicaid requires SSI)
- Asset transfers penalized (look-back period)
- Dual Medicare/Medicaid eligible still qualify but benefits coordinate
- NFLOC required for long-term care, not automatic
- Income/asset limits change annually; 2026 figures apply
- HCBS prefers home over nursing home; limited waiver slots

**Data shape:** Multiple tiers/programs (Nursing Home entitlement, HCBS waivers with caps, Regular ABD); eligibility pathways vary by marital status/SSI; functional NFLOC assessment key; annual limit updates.

**Source:** https://www.yourtexasbenefits.com or https://www.hhs.texas.gov/services/health/medicaid-chip

---

### Community Based Alternatives (CBA) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Income: Follows standard Medicaid eligibility under the State Plan (e.g., SSI limits or 300% of SSI for most HCBS waivers; specific 2026 dollar amounts not in results—use TX Medicaid calculator for current). Income over SSI may qualify via 1915(c) waiver pathways but requires at least one waiver service monthly. Parental income not considered except for TxHmL.
- Assets: Standard Medicaid asset limits apply (e.g., home exempt if applicant lives there/intends to return with equity ≤$730,000, spouse/child under 21/disabled child in home, or spouse lives there). Use TX Medicaid Spend Down Calculator for estimates. What counts: most assets except exempt items like primary home under conditions.
- Texas resident
- Medicaid-eligible under State Plan group including nursing facility services (excludes some STAR+PLUS 1115 waiver participants)
- Meet institutional level of care (NFLOC): nursing facility, hospital, or ICF (assessed via ADLs like bathing, eating, toileting; behavioral issues for dementia)
- Need assistance with activities of daily living (dressing, bathing, eating)
- U.S. citizen or qualified legal resident (for related programs)

**Benefits:** Home and community-based attendant services and supports (personal assistance, habilitation); specific services not enumerated but for those needing ADL help without full institutional care. No fixed dollar amounts or hours stated; cost-effective basic attendant services.
- Varies by: priority_tier

**How to apply:**
- Contact Texas Health and Human Services (HHSC) via phone (specific number not in results; use 2-1-1 Texas or HHSC site)
- Online via Your Texas Benefits (yourtexasbenefits.com)
- Download forms from hhsc.texas.gov
- In-person at local HHSC offices

**Timeline:** Not specified in results
**Waitlist:** No waitlist (unlike 1915(c) waivers; available to eligible Medicaid recipients needing services)

**Watch out for:**
- Not a standalone waiver—requires underlying Medicaid State Plan eligibility (excludes some STAR+PLUS 1115 waiver participants with income >SSI)
- Must meet institutional NFLOC, not just disability/dementia diagnosis
- Overlaps/confused with STAR+PLUS HCBS (for 65+/21+ disabled) or other waivers like HCS/TxHmL which have waitlists
- Home equity limit $730,000 for exemption; estate recovery risk post-death
- No services if already in 1115 waiver category without State Plan tie

**Data shape:** Tied to Medicaid State Plan (no waitlist, unlike 1915(c) waivers); requires NFLOC; delivered via managed care like STAR+PLUS with regional MCO variations; income via SSI/300% SSI pathways, assets standard Medicaid with home exemptions

**Source:** https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-all-medicaid-chip-programs/community-first-choice

---

### STAR+PLUS

> Last verified: 2026-04-04

**Eligibility:**
- Age: 65+
- Income: Monthly income limit up to 300% of the Federal Benefit Rate (FBR), which is $2,901 per applicant regardless of marital status. When both spouses apply, each is evaluated individually up to $2,901/month.[1]
- Assets: No more than $2,000 in countable assets. Exemptions include primary home if equity interest ≤ $730,000 and applicant lives there or intends to return, spouse living in home, child under 21 or disabled/blind child of any age living in home.[1][4]
- Texas resident
- 65+ years old or 21+ and disabled
- At risk of nursing home placement (requires Nursing Facility Level of Care - NFLOC, determined by Medical Necessity/Level of Care Assessment signed by physician and approved by TMHP)
- Medicaid eligible (e.g., SSI recipient with low income, MAO protected status, or meets nursing home Medicaid income/resource rules)
- Not enrolled in another Medicaid waiver program (can remain on other interest lists)
- For HCBS waiver: Need for at least one waiver benefit >$0 (excluding PAS/ERS), unstable medical condition requiring nurse intervention, costs under institutional limits[1][2][3][4]

**Benefits:** Managed care Medicaid program including acute medical care, long-term services/supports (e.g., Day Activity & Health Services up to 5 days/week Mon-Fri for physical/mental/medical/social needs; Personal Attendant Services; nursing facility services if applicable like room/board, medical supplies, rehab); dental/vision; NEMT; pharmacy; service coordination; consumer-directed services; extras vary by plan (e.g., Weight Watchers subscription for qualifying BMI/diagnoses, emergency response up to 6 months post-discharge, asthma supplies, IDD camp allowance up to $100, extra rides).[3][5][6]
- Varies by: priority_tier|region

**How to apply:**
- Join interest list first (long wait, many years unless exceptions): Call 2-1-1 or 877-541-7905
- After invitation: Apply for Medicaid via Your Texas Benefits (yourtexasbenefits.com), phone 2-1-1, or local HHS office
- Select managed care organization (e.g., Community First, Molina, Superior, Wellpoint) post-eligibility
- In-person at HHS benefits offices or nursing homes for residents

**Timeline:** Interest list wait many years; post-invitation processing varies, MN/LOC assessment by MCO then TMHP approval.
**Waitlist:** Very long interest list (years) for HCBS; exceptions exist.[1]

**Watch out for:**
- Long interest list wait (years) for HCBS - must join list first, not direct apply
- Income limit applies per applicant ($2,901/mo), not household
- Must meet NFLOC (nursing home level need) via physician/MCO assessment
- Home equity limit $730,000 if intending to return
- Managed care plan selection post-eligibility; auto-assigned if no choice
- Cannot be in another waiver while enrolled (but can stay on lists)
- Some benefits/extras region/plan-specific or require functional need >$0

**Data shape:** Managed care waiver program with mandatory MCO enrollment post-eligibility; long interest list gating HCBS access; benefits tiered by HCBS waiver vs. nursing facility; varies by MCO service area and priority (e.g., SSI vs. non-SSI); NFLOC medical criteria central

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-programs/services-people-who-think-or-have-physical-disabilities/starplus-home-community-based-services-hcbs-waiver (inferred from sources; primary via Your Texas Benefits or HHS)

---

### PACE (Program of All-Inclusive Care for the Elderly)

> Last verified: 2026-04-04

**Eligibility:**
- Age: 55+
- Income: No strict income limits for PACE enrollment itself; eligibility is not based on financial criteria. However, for full Medicaid coverage (covering ~90-99% of participants who are dual-eligible), Texas long-term care Medicaid requires income under 300% of the Federal Benefit Rate ($2,901/month in 2025 for an individual). Limits scale for couples/households (generally double for couples). Private pay option exists if over limits, costing $7,000+/month or share-of-cost $200-$900/month. Assets for Medicaid: $2,000 or less (excluding primary home, one vehicle). Medicaid planning can qualify those over limits.[2][6]
- Assets: No asset limits for PACE enrollment. For Medicaid eligibility: $2,000 countable assets for individual (exempt: primary home, one vehicle, personal belongings, burial plots). Prepaid funeral expenses and other strategies may exempt more via Medicaid planning.[2][6]
- Live in the service area of a Texas PACE provider (not statewide; limited to specific counties/regions with centers).
- Certified by Texas as needing nursing home level of care (e.g., extensive help with 2+ ADLs like bathing, eating, transferring).
- Able to live safely in the community (non-institutional) with PACE support at enrollment time.
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, prescription drug plan, or hospice.
- US citizen or 5-year legal resident for Medicare; voluntary enrollment.[1][2][4][5]

**Benefits:** Comprehensive, all-inclusive care at adult day health center and home: primary/acute/specialty medical care, prescription drugs, hospital/inpatient care, therapy (PT/OT/ST), home care (personal attendants, homemaker, respite), transportation, social services, adult day health (meals, activities, therapies ~20-30 hours/week typical), dental/vision/hearing aids, palliative care. No copays/deductibles for enrollees; covers all Medicare/Medicaid-covered + extras. Average participant: age 76, multiple chronic conditions.[1][2][4]
- Varies by: region

**How to apply:**
- Contact local Texas PACE provider for screening (e.g., Bienvivir in El Paso: bienvivir.org).[5]
- Provider assists with state Medicaid/Medicare apps; phone/website via findyourpace.org or npaonline.org locator.[1]
- Texas Medicaid: yourtexasbenefits.com (online), 2-1-1, or local HHSC office in-person/mail.[2]
- No specific national form; state nursing home cert + provider enrollment process.

**Timeline:** Varies; initial screening immediate, state certification 30-90 days, full enrollment after assessment.
**Waitlist:** Common due to limited centers; lengths vary by region (e.g., months to years; check provider).[1]

**Watch out for:**
- Not statewide—must live in one of few service areas near a PACE center; no eligibility if outside.
- 90%+ are dual-eligible; private pay very expensive ($7k+/mo) if not Medicaid-qualified.
- Cannot be on Medicare Advantage/hospice; must disenroll first.
- Waitlists long in popular areas; nursing home cert required but must prove community safety.
- Voluntary but hard to exit if health declines (full risk on PACE).[1][2][4][6]

**Data shape:** Limited to specific regional providers/centers (not statewide); no direct income/asset test for PACE but tied to Medicaid for free access; dual-eligible focus; service area residency strict; waitlisted/high demand.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.npaonline.org/find-pace (national locator); https://www.texashealthandhumanservices.gov/services/aging (Texas HHSC); provider sites like https://www.bienvivir.org/eligibility

---

### Medicare Savings Programs (QMB, SLMB, QI)

> Last verified: 2026-04-04

**Eligibility:**
- Income: Must be entitled to Medicare Part A (typically age 65+ or disabled). Income limits effective 2026 (federal standards; Texas follows with possible state adjustments): QMB - Individual: $1,350/month (100% FPL), Couple: $1,824/month; SLMB - Individual: ~$1,620/month (120% FPL), Couple: ~$2,189/month; QI - Individual: ~$1,823/month (135% FPL), Couple: ~$2,462/month. Limits updated annually April 1 based on Federal Poverty Level and apply to countable monthly income after standard disregards ($20 general + $65 earned + half remaining earned income).[1][6]
- Assets: 2026 resource limits (countable assets): Individual: $9,950; Married couple: $14,910. Counts: Cash, bank accounts, stocks, bonds (excluding exempt items). Exempt: Primary home, one vehicle, household goods, wedding/engagement rings, burial plots, up to $1,500 burial expenses, life insurance under $1,500 face value, certain Native American funds.[4][6]
- Entitled to Medicare Part A (even if not enrolled)
- Texas resident
- U.S. citizen or qualified immigrant
- For QI: Must have Part A and Part B; annual reapplication required; first-come first-served with priority to prior recipients

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums (~$185/month 2026), annual deductible, coinsurance/copayments for Medicare-covered Parts A/B services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only; auto-qualifies for Extra Help (prescription drugs, max $12.65 copay/drug 2026).[1][6]
- Varies by: program_tier

**How to apply:**
- Online: YourTexasBenefits.com
- Phone: Texas Health and Human Services (HHSC) at 2-1-1 or 1-877-541-7905
- Mail: HHSC forms to local office (find via 211texas.org)
- In-person: Local HHSC offices or Area Agencies on Aging (find via 211)

**Timeline:** QMB: Up to 45 days from complete application; effective first of next month. SLMB/QI: Up to 45 days; retroactive up to 3 months prior.[1]
**Waitlist:** QI: First-come, first-served; limited federal funding may create waitlist after slots fill (priority to prior year recipients).[1][6]

**Watch out for:**
- QI has limited enrollment and requires annual reapplication; may run out of funds mid-year
- Must have Part A (and B for SLMB/QI); QMB protects from provider billing for copays (providers can't charge you)
- Income disregards often overlooked ($20 + earned income deductions can qualify higher gross incomes)
- Assets include spouse's even if not applying; Texas follows federal asset test (some states eliminated it)
- Auto-enrolls in Extra Help for Rx but notify plans to avoid duplicate premiums
- Outdated limits common; always check current FPL-based figures (change April 1)

**Data shape:** Three tiers (QMB/SLMB/QI) with escalating income thresholds (100%/120%/135% FPL) and tiered benefits; QI capped funding creates waitlist risk; income after disregards; statewide but local HHSC processing

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.yourtexasbenefits.com or https://www.hhs.texas.gov/services/health/medicaid-chip/medicare-savings-programs

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income limits (2025): 1 person: $2,815; 2 people: $3,681; 3 people: $4,547; 4 people: $5,414; 5 people: $6,280; 6 people: $7,146. Equivalent to at or below 150% of Federal Poverty Guidelines. Automatic eligibility if enrolled in SNAP, SSI, TANF, or certain veterans' programs. Applies to homeowners and renters; public/subsidized housing eligibility varies by payment of energy costs.[1][2][3][8]
- Assets: No asset limit.[1]
- Household includes all at address sharing utility bill.
- U.S. citizen or qualified non-citizen in household.
- Financial need demonstrated, especially for crisis assistance (e.g., shutoff notice, broken equipment).

**Benefits:** Heating: $1-$12,300; Cooling: $1-$12,300; Crisis: up to $2,400. Payments go directly to utility providers. Also includes energy education and efficiency measures via CEAP integration.[1][6]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Phone: (877) 399-8939 or 211.
- Website: 211Texas.org to find local agency.
- In-person/mail: Local community action agencies/CEAP subrecipients covering all 254 counties (e.g., Travis County CEAP: (512) 584-4120).
- Online account with utility (e.g., Texas Gas Service) recommended to speed documentation.

**Timeline:** Varies by agency; placed on waitlist upon submission, caseworker calls when turn arrives.[4]
**Waitlist:** Yes, common; applications placed in line by site, processed when funding available.[4]

**Watch out for:**
- Not year-round: heating (fall/winter), cooling (summer), crisis (emergencies only).[1]
- Funding limited by federal availability; subject to waitlists.[4]
- Household defined broadly (all sharing utility bill, unlike SNAP).[1]
- Must contact specific local agency; no central statewide application.[4][6]
- Public/subsidized housing eligibility depends on how energy costs are paid.[2][3]

**Data shape:** Administered via 254 county subrecipients with regional variations in providers and waitlists; benefits via CEAP integration; income at 150% FPG, no asset test; seasonal components.

**Source:** https://www.tdhca.texas.gov/comprehensive-energy-assistance-program-ceap

---

### Weatherization Assistance Program

> Last verified: 2026-04-04

**Eligibility:**
- Income: Varies by funding source and subrecipient: DOE WAP at 200% of Federal Poverty Level (FPL); LIHEAP WAP at 150% FPL. Income calculated from all sources for household members 18+ over the 30 days prior to application, annualized. Specific 2024-2026 guidelines (effective Jan 2025) referenced but not tabulated in sources; e.g., South Plains at 200% FPL, CACOST differentiates 150%/200%[2][3][5]. Austin Energy variant requires 80% Median Family Income plus enrollment in Customer Assistance Program or Medically Vulnerable Registry[4]. No statewide table; check subrecipient for current FPL chart[6].
- Assets: No asset limits mentioned across sources.
- Proof of U.S. citizenship or legal residency for all household members (e.g., birth certificate with ID, passport, naturalization certificate)[3].
- Home must be owner-occupied or rented with landlord permission; single-family, duplex, triplex, fourplex, or mobile home; pre-qualifying conditions like <2,500 sq ft, >10 years old, improvement value ≤$478,195 (Austin-specific)[4].
- Household must benefit from weatherization; no prior participation in last 10-15 years[4][7].
- Priority often for elderly, disabled, or LIHEAP qualifiers, but no strict age requirement[3][5].

**Benefits:** Energy audit to identify inefficiencies; installation of weatherization materials including caulking, weather-stripping, ceiling/wall/floor insulation, hole patching, duct work, heating/cooling system tune-up/repair/replacement. Ensures energy savings, health/safety improvements, minor repairs. No fixed dollar amount or hours; scope based on audit using DOE-approved measures (10 CFR Part 440 Appendix A)[5]. Available once every 10-15 years[4][7].
- Varies by: priority_tier|region

**How to apply:**
- Contact local subrecipient agency via TDHCA list (PDF download from site)[5].
- Online portals/pre-screening (e.g., Travis County Application Portal, Austin Energy form)[1][4].
- Phone (e.g., Austin Energy 512-482-5346, Dallas County 214-819-2000)[4][7].
- Mail (e.g., Austin Energy: 4815 Mueller Blvd, Austin, TX 78723-3573)[4].
- Downloadable forms (e.g., WAP Application Dallas, CCSCT Uvalde Application, Weatherization Assistance Program Form Austin)[4][6][7].
- In-person at county offices (e.g., Dallas County Health and Human Services, 2377 N. Stemmons Freeway, Dallas, TX 75207)[7].

**Timeline:** Not specified statewide; involves audit, scope of work, crew scheduling, final inspection—timeline explained post-audit[3].
**Waitlist:** Likely due to funding limits; varies by subrecipient and demand, not detailed[1][2].

**Watch out for:**
- Not direct to TDHCA—must contact county-specific subrecipient from list; availability limited by funding[5].
- Two tracks (DOE 200% FPL vs LIHEAP 150% FPL)—check which your area uses; LIHEAP qualifiers often priority for DOE[3].
- Income proof strict: 30 days prior, annualized, all adult members, specific docs only (no bank statements)[2][3][6].
- Home must qualify (age, size, value, prior participation); renters need landlord sign-off[4].
- Elderly priority implied but not guaranteed—competes with disabled/children households[5].
- Once every 10-15 years only[4][7].

**Data shape:** Decentralized by 50+ subrecipients per county/service area with unique forms/sites/phone/docs; dual funding (DOE/LIHEAP) creates 150%/200% FPL split; heavy doc burden for 30-day income proof; no central app/age cutoff but elderly prioritized; Austin Energy variant adds MFI/CAP rules.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tdhca.texas.gov/weatherization-assistance-program

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to all Medicare-eligible individuals regardless of income[1][2]
- Assets: No asset limits; no financial tests apply[1][2]
- Must be eligible for Medicare (typically age 65+ or under 65 with disabilities), soon-to-be eligible, family members, or caregivers of Medicare beneficiaries[1][2][3]

**Benefits:** Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D), Medigap, plan reviews, applying for low-income programs (Medicare Savings Programs, Extra Help/LIS, Medicaid), claims/billing resolution, enrollment help, public education presentations, outreach events, and fraud prevention via Senior Medicare Patrol (SMP)[2][4][7]

**How to apply:**
- Phone: 1-800-252-9240 (Texas HICAP)[8]
- Website: shiphelp.org (use SHIP Locator for Texas), Texas-specific website via shiphelp.org/ships/texas/[8][9]
- In-person or phone counseling via local SHIP sites (find via shiphelp.org or 1-877-839-2675 national line)[1][8]

**Timeline:** Immediate assistance available via phone or scheduled appointments; no formal application processing[1][4]

**Watch out for:**
- Not a healthcare or financial benefit provider—only free counseling/advocacy; people mistake it for direct aid[1][4]
- Services are free but appointment-based in some areas; contact early (e.g., 3 months before Medicare eligibility)[1]
- Assists with low-income programs but eligibility for those separate (e.g., MSP/LIS have income/asset tests)[2]
- Operated as HICAP in Texas—use state-specific contact[8]

**Data shape:** no income/asset test for counseling access; statewide via regional local partners; service-based not financial aid; open to Medicare families/caregivers[1][2][3][8]

**Source:** https://www.shiphelp.org/ships/texas/ (Texas SHIP page); national: https://acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[2][8]

---

### Meals on Wheels

> Last verified: 2026-04-04

**Eligibility:**
- Age: 60+
- Income: No income limits or tests; eligibility based on need regardless of income. Voluntary contributions requested but not required[1][3][4][6].
- Assets: No asset limits mentioned across programs.
- Primarily homebound and unable to prepare nutritious meals[1][2][3][4][5][6]
- No consistent daytime assistance from others[2]
- Reside in the specific program's service area or delivery zone[1][2][3][5][6]
- Able to accept meals during delivery window (e.g., 10:30 a.m.-1:00 p.m.)[3]
- Physical/mental impairments making meal prep difficult; nutritionally at risk[3][6]
- May include disabled under 60, spouses/dependents/caregivers in some cases[1][6]
- Priority for greatest economic/social need, disabilities, dementia, etc.[5]

**Benefits:** One hot, nutritious, often medically-tailored meal delivered weekdays; optional weekend frozen meals; case management/assessment; personal volunteer contact. No fixed dollar amount or hours specified[2].
- Varies by: region

**How to apply:**
- Contact local provider: e.g., phone 817-336-0912 (Tarrant County)[4]; 972-771-9514 (Rockwall)[6]
- Online referral forms: e.g., Meals on Wheels Central Texas apply page[2]; Tarrant County referral form[4]
- Phone referral from anyone (family, hospitals, etc.)[4]
- In-person/home assessment by case manager/social worker[1][2][3][4][6]

**Timeline:** Varies; caseworker appointment within 2 working days (Tarrant); some within a week, longer with waitlists[1][4].
**Waitlist:** Possible in some programs if high demand[1].

**Watch out for:**
- Not statewide; must confirm local provider and exact service area—outside zones ineligible[1][7]
- Homebound required; car ownership or easy mobility may disqualify[1]
- Assessment/home visit mandatory, not instant signup[1][2][4]
- Voluntary contributions expected but no one denied for inability to pay[3][4]
- Priority tiers may delay service for non-highest need[5]
- Short-term only for some (e.g., 6 weeks recuperation)[3]

**Data shape:** Decentralized local providers per county/region with no uniform state eligibility/income test; service area residency critical; no central Texas application portal.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mealsonwheelsamerica.org/find-meals-and-services/

---

### Community Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits identified for this program in search results. Related programs like Texas CCAD (2024): single $2,829/month, couple $5,658/month[3]; CAS (2025): single $2,901/month, couple $5,802/month[1].
- Assets: No specific asset limits identified. Related: CCAD (2024) single $5,000, couple $6,000[3]; CAS home exempt but subject to estate recovery, nursing home waiver home equity limit $730,000[1].
- Caregiver must meet eligibility in 40 Tex. Admin. Code § 700.1003 and be Texas resident[5]
- Functional/medical need not detailed specifically for this program

**Benefits:** Support services for caregivers (details not specified in results; cross-references child welfare caregiver assistance under DFPS § 700.1017[5])

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) for related community care programs: call 1-855-937-2372 or find local office[3]

**Timeline:** Not specified

**Watch out for:**
- Limited details available; may relate to DFPS child caregiver support rather than elderly (no elderly-specific matches)[5]
- Confused with CCAD, CAS, or VA PCAFC which have distinct eligibility/services[1][2][3]
- Search results lack comprehensive program details

**Data shape:** Sparse data; appears tied to Texas DFPS caregiver regulations (§700.1017 cross-ref §700.1003), not elderly-focused like query assumes; no dedicated elderly caregiver program clearly identified

**Source:** https://www.law.cornell.edu/regulations/texas/40-Tex-Admin-Code-SS-700-1017 (Texas Admin Code § 700.1017)[5]

---

### Long-Term Care Ombudsman Program

> Last verified: 2026-04-04

**Eligibility:**
- Income: No income limits; services are free and available to all residents regardless of financial status.
- Assets: No asset limits; no financial eligibility requirements.
- Resident must live in a Texas nursing facility or assisted living facility.
- Services also extend to certain caregivers and family members of persons 60 years of age or older.
- For developmental disabilities in state supported living centers, contact separate Office of the Independent Ombudsman.

**Benefits:** Advocacy for residents' rights including protection from abuse, restraints, and discrimination; privacy and visitation rights; informed consent on services and costs; no unwarranted transfers or discharges; complaint resolution without reprisal; assistance with personal affairs, advance directives, and grievances. Ombudsmen investigate complaints, monitor care quality, participate in hearings, and ensure access to records and inspection reports.

**How to apply:**
- Phone: 1-800-252-2412 to speak with an LTC Ombudsman in your area.
- Website: https://ltco.texas.gov (find local ombudsman or email office).
- Local programs (varies by region, e.g., contact Cizik School of Nursing for Harris County or The Senior Source for Dallas County).

**Timeline:** Immediate response for complaints and advocacy; no formal processing as services are provided on-demand.

**Watch out for:**
- Not a direct service provider (e.g., no healthcare or financial aid)—only advocacy and complaint resolution.
- Confidential but independent of facilities; ombudsmen cannot determine Medicaid eligibility or conduct PASRR screenings.
- Volunteers must be 18+, pass background checks, and have no conflicts of interest (e.g., no facility employment).
- Separate ombudsman for state supported living centers or non-LTC issues.
- Families may confuse with paid care services; this is free advocacy only.

**Data shape:** no income or asset test; advocacy-only for LTC facility residents statewide via local independent programs; volunteer-driven with regional administration

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ltco.texas.gov

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid for Seniors/Disabled | benefit | state | deep |
| Community Based Alternatives (CBA) Waive | benefit | state | deep |
| STAR+PLUS | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels | benefit | federal | medium |
| Community Caregiver Support Program | benefit | state | deep |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"resource":2}
**Scopes:** {"state":4,"local":1,"federal":6}
**Complexity:** {"deep":8,"simple":2,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/TX/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **priority_tier|region**: 2 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for Seniors/Disabled**: Multiple tiers/programs (Nursing Home entitlement, HCBS waivers with caps, Regular ABD); eligibility pathways vary by marital status/SSI; functional NFLOC assessment key; annual limit updates.
- **Community Based Alternatives (CBA) Waiver**: Tied to Medicaid State Plan (no waitlist, unlike 1915(c) waivers); requires NFLOC; delivered via managed care like STAR+PLUS with regional MCO variations; income via SSI/300% SSI pathways, assets standard Medicaid with home exemptions
- **STAR+PLUS**: Managed care waiver program with mandatory MCO enrollment post-eligibility; long interest list gating HCBS access; benefits tiered by HCBS waiver vs. nursing facility; varies by MCO service area and priority (e.g., SSI vs. non-SSI); NFLOC medical criteria central
- **PACE (Program of All-Inclusive Care for the Elderly)**: Limited to specific regional providers/centers (not statewide); no direct income/asset test for PACE but tied to Medicaid for free access; dual-eligible focus; service area residency strict; waitlisted/high demand.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Three tiers (QMB/SLMB/QI) with escalating income thresholds (100%/120%/135% FPL) and tiered benefits; QI capped funding creates waitlist risk; income after disregards; statewide but local HHSC processing
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered via 254 county subrecipients with regional variations in providers and waitlists; benefits via CEAP integration; income at 150% FPG, no asset test; seasonal components.
- **Weatherization Assistance Program**: Decentralized by 50+ subrecipients per county/service area with unique forms/sites/phone/docs; dual funding (DOE/LIHEAP) creates 150%/200% FPL split; heavy doc burden for 30-day income proof; no central app/age cutoff but elderly prioritized; Austin Energy variant adds MFI/CAP rules.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test for counseling access; statewide via regional local partners; service-based not financial aid; open to Medicare families/caregivers[1][2][3][8]
- **Meals on Wheels**: Decentralized local providers per county/region with no uniform state eligibility/income test; service area residency critical; no central Texas application portal.
- **Community Caregiver Support Program**: Sparse data; appears tied to Texas DFPS caregiver regulations (§700.1017 cross-ref §700.1003), not elderly-focused like query assumes; no dedicated elderly caregiver program clearly identified
- **Long-Term Care Ombudsman Program**: no income or asset test; advocacy-only for LTC facility residents statewide via local independent programs; volunteer-driven with regional administration

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Texas?
