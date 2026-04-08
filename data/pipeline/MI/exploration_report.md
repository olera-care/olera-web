# Michigan Benefits Exploration Report

> Generated 2026-04-08 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 16 |
| New (not in our data) | 12 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 10 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (MSP) - QMB, SLMB, QI

- **source_url**: Ours says `MISSING` → Source says `https://www.michigan.gov/mdhhs/assistance-programs/healthcare/disabilities/dualeligible/medicare-savings-programs`

### SNAP Food Assistance (MiCAFE for seniors)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.michigan.gov/mdhhs/assistance-programs/food))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `SNAP benefits via Michigan Bridge Card for purchasing food at grocery stores, supermarkets, farmers markets. Single seniors receive $23 to $292 monthly (as of available data; amounts vary by income, household size, expenses). Supplements grocery budget for nutritious food.[1][6]` ([source](https://www.michigan.gov/mdhhs/assistance-programs/food))
- **source_url**: Ours says `MISSING` → Source says `https://www.michigan.gov/mdhhs/assistance-programs/food`

### Nursing Home Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free, confidential advocacy services including investigating and resolving complaints about care or services, explaining resident rights, empowering residents to voice concerns, providing information and consultation on long-term care issues, routine visits to facilities, community education, training for resident councils or staff, and systemic advocacy for laws, regulations, and policies benefiting residents.` ([source](https://mltcop.org))
- **source_url**: Ours says `MISSING` → Source says `https://mltcop.org`

### MI Choice Waiver Program

- **min_age**: Ours says `65` → Source says `65 or older, OR 18+ with documented disability` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services equivalent to nursing home care, including: Nursing Services (Preventative), Private Duty Nursing/Respiratory Care, Respite Care, Specialized Medical Equipment and Supplies, Supports Coordination, Training, and Personal Emergency Response Systems (PERS)` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
- **source_url**: Ours says `MISSING` → Source says `https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver`

## New Programs (Not in Our Data)

- **MI Health Link** — service ([source](https://www.michigan.gov/mdhhs/doing-business/providers/integrated))
  - Shape notes: County-restricted to specific lower peninsula counties plus entire Upper Peninsula; dual eligibility mandatory with full Medicaid (no spend down); regional ICO providers; automatic enrollment outreach via Michigan ENROLLS
- **MI Choice Medicaid Waiver** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
  - Shape notes: Administered regionally via local AAAs with individualized service plans; no fixed dollar/hour caps but NFLOC-based; statewide since 1998 with agency variations in access/wait times.
- **Michigan Program for All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace))
  - Shape notes: Multiple regional providers with exclusive service areas; no strict income/asset limits for enrollment but Medicaid determines costs; eligibility hinges on state-certified nursing home level of care assessment by PACE IDT; private pay option available
- **Michigan LIHEAP (Energy Assistance)** — financial ([source](https://www.michigan.gov/mdhhs/inside-mdhhs/reports-stats/plans-regs/plans-regs/low-income-home-energy-assistance-program-liheap-state-plans[6]))
  - Shape notes: Eligibility auto-qualifies via other MI programs (SNAP/Medicaid/SSI); income at 60% SMI with household table; crisis vs. non-crisis tiers; administered statewide but via local agencies/utilities with funding caps and first-come availability.
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.michigan.gov/mdhhs/doing-business/weatherization))
  - Shape notes: Administered statewide via regional Community Action Agencies with varying income tables, providers, and screening based on local funding; eligibility heavily home-condition dependent via audit.
- **Michigan Medicare Assistance Program (MMAP)** — service ([source](http://www.mmapinc.org))
  - Shape notes: no income/asset test for core counseling; statewide free service via regional volunteer counselors; focuses on education/enrollment help for Medicare/Medicaid rather than direct aid
- **Home Delivered Meals (Meals on Wheels)** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/other-help/food/home-delivered-meals[6]))
  - Shape notes: Decentralized by local AAAs/providers with core OAA standards but regional variations in operation, providers, and funding; no income/asset tests; prioritizes greatest need/homebound; Medicaid tiers add clinical criteria
- **Respite Care (via MI Choice Waiver)** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
  - Shape notes: Administered statewide via ~16 regional MI Choice Agencies; benefits not fixed hours/dollars but personalized by assessed need/priority; strict NFLOC + dual service requirement; annual federal income/asset adjustments; home equity limit unique to waivers.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); https://www.michigan.gov/mdhhs (Michigan Department of Health and Human Services administers statewide)))
  - Shape notes: SCSEP is a statewide program administered through multiple regional providers with consistent eligibility criteria (age 55+, unemployed, income ≤125% federal poverty level) but varying application processes and contact information by region. Benefits are fixed (20 hours/week at minimum wage) and do not vary by household size or priority tier, though enrollment priority does affect waitlist placement. Income limits scale by household size but are based on federal poverty guidelines updated annually. The program is administered by the Michigan Department of Health and Human Services at the state level but delivered through approximately 50 local partner organizations across the state, creating geographic variation in accessibility and specific services offered.
- **Legal Assistance for Seniors** — service ([source](https://www.michigan.gov/fyit/resources/legal (links to MichiganLegalAid.org)))
  - Shape notes: Decentralized by regional legal aid non-profits; no uniform income/asset table or statewide application; seniors (60+) prioritized or exempt from financial tests; varies significantly by provider geography and funding.
- **Home Help Program** — service ([source](https://www.michigan.gov/mdhhs/doing-business/providers/providers/other/homehelp[8]))
  - Shape notes: Tied to Medicaid eligibility with strict ADL assessment; caregiver payments via CHAMPS; hours tiered by need (up to 180+/month); statewide but county-administered with local variations.
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)** — advocacy ([source](https://www.elderlawofmi.org/micafe))
  - Shape notes: Advocacy-focused with eligibility tied to multiple programs (SNAP primary); no fixed MiCAFE-specific income/asset tables provided—uses program-specific rules with medical deductions; statewide network model with partner variations

## Program Details

### MI Health Link

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must qualify for full Medicaid benefits (dually eligible with Medicare); no specific dollar amounts listed for MI Health Link as it requires full Medicaid eligibility. General Michigan Medicaid income limits are approximately $18,000 for an individual or $24,000 for a couple (at or below 133% FPL), but MI Health Link excludes those with spend down. Spousal allowances: minimum $2,643.75/month, maximum $3,948/month (2025 figures).[1][2][6]
- Assets: Must meet full Medicaid asset limits (not explicitly quantified here); home equity exempt up to $730,000 if applicant lives there or intends to return, spouse lives there, or dependent child lives there. Other standard Medicaid asset rules apply.[1]
- Dually eligible for both full Medicare and full Medicaid
- Live in specific counties: Barry, Berrien, Branch, Calhoun, Cass, Kalamazoo, Macomb, St. Joseph, Van Buren, Wayne, or any Upper Peninsula county
- Not residing in a state-operated veteran's home
- Not currently enrolled in hospice
- Not eligible if enrolled in PACE or MI Choice (must leave those programs)
- People with Medicaid spend down are not eligible
- Nursing Facility Level of Care (NFLOC) required for HCBS, determined by Michigan Medicaid LOCD tool (assesses ADLs, cognition, behavior)[1][2][3][4]

**Benefits:** Integrated care including: no co-pays or deductibles for in-network services; medications (replaces Medicare Part D); care coordination; behavioral health care; dental care; hearing care; Medicare-covered care; vision care; home and community-based services (HCBS); nursing home care. Personal care services determined by ICO based on needs assessment, including paid family caregivers.[2][7]
- Varies by: region

**How to apply:**
- Automatic: Eligible individuals receive enrollment options letter from Michigan ENROLLS[2]
- Contact MI ENROLLS for assistance (specific phone/website not in results; apply via Medicaid channels or local MDHHS office)
- Forms: Authorization to Disclose Protected Health Information (DCH-1183), Behavioral Health Consent Form (MDHHS-5515)[2]

**Timeline:** Not specified in sources

**Watch out for:**
- Must leave PACE or MI Choice programs to join
- Medicaid spend down disqualifies
- MI Health Link Part D replaces Medicare Part D drug plan
- Nursing home residents must continue paying patient pay amount
- Limited to specific counties only—not statewide
- Requires NFLOC for HCBS, assessed via LOCD tool

**Data shape:** County-restricted to specific lower peninsula counties plus entire Upper Peninsula; dual eligibility mandatory with full Medicaid (no spend down); regional ICO providers; automatic enrollment outreach via Michigan ENROLLS

**Source:** https://www.michigan.gov/mdhhs/doing-business/providers/integrated

---

### MI Choice Medicaid Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18-64 with a disability+
- Income: Monthly income up to 300% of the Federal Benefit Rate (FBR), which adjusts annually. In 2025: $2,901 per applicant regardless of marital status (each spouse assessed individually if both apply). Recent regional figures: $2,982 (2026 estimate based on sources).[1][3][8]
- Assets: Countable assets limited to approximately $9,950 (excludes primary residence, one vehicle). Assets given away or sold below fair market value within 60 months trigger a Look-Back Rule penalty period. Home exempt during benefits but subject to Medicaid Estate Recovery. Federal spousal protection rules apply for married couples.[1][3][8]
- Nursing Facility Level of Care (NFLOC) determined via in-person Michigan Medicaid LOCD assessment (activities of daily living, cognitive abilities, behavior).
- Must require supports coordination plus at least one other waiver service.
- Medicaid-eligible financially and medically for long-term care.

**Benefits:** Home and community-based services equivalent to nursing home level: supports coordination, adult day health, respite, specialized medical equipment/supplies, private duty nursing/respiratory care, personal emergency response system (PERS), home delivered meals, chore services, community living supports, community transportation, counseling, environmental accessibility adaptations, training, vehicle modifications, fiscal intermediary, goods/services, supports brokerage, community health worker, residential services, nursing services. Provided by home health agencies, community health workers, or paid family caregivers. Person-centered plan developed by nurse/social worker team.[2][4][7][8]
- Varies by: individualized_plan_based_on_assessed_needs

**How to apply:**
- Phone: Regional MI Choice agencies (e.g., AAANM 1-800-442-1713, Area Agency on Aging 800-654-2810, The Senior Alliance 734.722.2830, or local Access and Eligibility Specialists).[3][8][9]
- Online referral forms: Agency-specific (e.g., The Senior Alliance referral form).[8]
- In-person or in-home: Assessment by Supports Coordinator (nurse/social worker) after phone screening.

**Timeline:** Initial phone screening followed by in-home assessment if qualified; timeline not specified statewide.
**Waitlist:** Possible if program at capacity in region; placement after screening.[3]

**Watch out for:**
- Income limit applies per applicant ($2,901+ in 2025), not household total; spousal rules differ.
- Must need supports coordination + one waiver service beyond basic Medicaid.
- 60-month Look-Back Rule penalties for asset transfers; home vulnerable to Estate Recovery post-death.
- Dementia diagnosis alone insufficient—must meet NFLOC via full assessment.
- Regional waitlists and agency-specific processes; not direct nursing home alternative without waiver approval.
- Annual income/asset limits adjust with Federal Benefit Rate.

**Data shape:** Administered regionally via local AAAs with individualized service plans; no fixed dollar/hour caps but NFLOC-based; statewide since 1998 with agency variations in access/wait times.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### Michigan Program for All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No strict income limits for PACE enrollment; financial eligibility tied to Medicaid for no-cost coverage. Medicaid eligibility requires meeting Michigan's income and asset limits (varies by household size; PACE providers assist with Medicaid applications and assessments). Dual Medicare/Medicaid eligible pay nothing; Medicare-only pay a premium based on income/assets.
- Assets: No strict asset limits for PACE enrollment itself; Medicaid portion follows standard Michigan Medicaid LTC rules (assets generally under $2,000 for individual, $3,000 for couple, with exemptions for home, one vehicle, personal belongings, burial funds; PACE helps verify).
- Live in the service area of an approved PACE provider
- Certified by the state as meeting nursing home level of care (nursing facility level of care criteria)
- Able to live safely in the community (home or community setting, not nursing facility) with PACE support at time of enrollment
- Not concurrently enrolled in Medicaid MIChoice waiver or HMO

**Benefits:** All Medicare- and Medicaid-covered services plus additional services deemed necessary by interdisciplinary team (IDT): primary and specialty medical care, nursing, physical/occupational/recreational therapy, social services, personal care/home care, adult day health center services (primarily delivered there, supplemented by in-home/referral), acute/hospital care, prescription drugs, transportation, meals, dental/vision/hearing aids, hospice if needed. No copays/deductibles if dual eligible; private pay option if not Medicaid-eligible.
- Varies by: region

**How to apply:**
- Contact specific PACE provider by phone or website for intake (e.g., Ascension Living PACE: ascensionliving.org; PACE Southwest MI: paceswmi.org; PACE Southeast MI: pacesemi.org)
- In-person intake assessment at PACE center
- PACE assists with Medicaid application if needed
- Referrals from community providers

**Timeline:** Intake assessment first, then enrollment assessment by IDT to create care plan; no statewide timeline specified (varies by provider)
**Waitlist:** Possible; varies by region/provider (not detailed statewide)

**Watch out for:**
- Not statewide—must live in specific provider service area; use zip code search on provider sites
- Must receive ALL care through PACE (except emergencies); out-of-network/unauthorized services may cost participant
- Nursing home level of care required but must live safely in community at enrollment (not in facility)
- No concurrent enrollment in MIChoice waiver or HMO
- Private pay premium if not Medicaid-eligible (amount based on income/assets; provider helps determine)
- Exclusive provider per area designated by state

**Data shape:** Multiple regional providers with exclusive service areas; no strict income/asset limits for enrollment but Medicaid determines costs; eligibility hinges on state-certified nursing home level of care assessment by PACE IDT; private pay option available

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace

---

### Medicare Savings Programs (MSP) - QMB, SLMB, QI


**Eligibility:**
- Income: {"description":"Income limits are based on Federal Poverty Level (FPL) and change annually on April 1. Three tiers exist with different coverage levels. Limits shown are for 2026 in Michigan; Alaska and Hawaii have slightly higher limits. States may set more generous standards than federal minimums.[5]","QMB":{"individual_monthly":"$1,350","couple_monthly":"$1,824","percentage_of_FPL":"100%"},"SLMB":{"individual_monthly":"$1,585","couple_monthly":"$2,135","percentage_of_FPL":"100% to 120% of FPL"},"QI":{"individual_monthly":"120% to 135% of FPL","couple_monthly":"120% to 135% of FPL","note":"Exact 2026 dollar amounts not provided in search results, but 2025 reference shows $1,761 individual/$2,379 couple at 135% FPL[8]"}}
- Assets: {"QMB_SLMB_ALMB":{"individual":"$9,950","couple":"$14,910","note":"Connecticut has no asset limit for QI as an example of state variation[1]"},"QDWI":{"individual":"$4,000","couple":"$6,000"},"what_counts":"Resources/assets (specific items not detailed in search results)","what_may_be_exempt":"Search results do not specify exemptions"}
- Must be eligible for Medicare (have Medicare Part A and/or Part B)[1][5]
- For SLMB and QI: Must have premium-free Medicare Part A[3][5]
- For QI: Must not qualify for any other Medicaid coverage or benefits[5]
- QI applicants must reapply every year[5]

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- Contact Michigan Department of Health and Human Services (MDHHS) — specific online portal URL not provided in search results
- Phone: 1-800-642-3195 or 1-866-501-5656 (TTY) for Medicaid Beneficiary Help Line[2]
- Contact state Medicaid agency (MDHHS) — mail and in-person options referenced but specific addresses not provided[1]
- Speak with MI Options or SHIP (State Health Insurance Assistance Program) for guidance[3]

**Timeline:** [object Object]
**Waitlist:** QI program operates on first-come, first-served basis with limited availability[5]

**Watch out for:**
- QMB coverage only goes forward from approval month — no retroactive coverage for previous months[3]
- SLMB coverage can be retroactive up to three months, but only if you were income-eligible during those months[1][3]
- QI coverage only starts from the calendar year MDHHS determines eligibility — even if you applied in December of the previous year, coverage begins January 1 of the approval year (with exception: if approved in April, coverage can go back to January)[3]
- QI requires annual reapplication[5]
- QI is only available on first-come, first-served basis with limited funding[5]
- You must have premium-free Medicare Part A to qualify for SLMB or QI[3][5]
- QI is only available if you don't qualify for any other Medicaid coverage[5]
- If you have SSI-related Medicaid coverage, you automatically qualify for QMB — no separate application needed[4]
- Income limits change every April 1[1]
- States can be more generous than federal minimums but not less generous[1]

**Data shape:** This program has three distinct tiers (QMB, SLMB, QI) with different income thresholds, coverage levels, and retroactivity rules. The key differentiator is retroactivity: QMB has none, SLMB has up to 3 months, QI has calendar-year-based retroactivity. QI operates on first-come, first-served basis with annual reapplication requirement, making it fundamentally different from QMB and SLMB. Income limits are tied to Federal Poverty Level and reset annually on April 1. Asset limits are uniform across QMB/SLMB/ALMB but vary by household size. Automatic enrollment exists for those with SSI-related Medicaid.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/disabilities/dualeligible/medicare-savings-programs

---

### SNAP Food Assistance (MiCAFE for seniors)


**Eligibility:**
- Age: 60+
- Income: For seniors (60+), disabled, or disabled veterans: Gross monthly income at or below 200% of the Federal Poverty Level (FPL); Net monthly income at or below 100% FPL after deductions. Exact dollar amounts vary by household size and year; check current FPL tables via MDHHS as they are updated annually. Traditional households: Gross at or below 130% FPL.[2][5]
- Assets: Most Food Assistance Program (FAP/SNAP) groups have no asset limit effective March 1, 2024. Asset limit of $3,000 applies if a group member is disqualified (e.g., Intentional Program Violation, employment/training disqualification for head of household, fleeing felon); increases to $4,500 if group includes someone 60+ or disabled. Countable assets: cash, checking/savings accounts, investments, some trusts, property/real estate (excludes primary home). Household must live in Michigan and have at least one U.S. citizen or acceptable non-citizen.[5]
- U.S. citizen or acceptable immigrant status.
- Reside in Michigan.
- Household-based: all who live together, purchase, and prepare food together.
- Certain deductions apply for shelter, child support, dependent care, medical expenses (for 60+ or disabled).

**Benefits:** SNAP benefits via Michigan Bridge Card for purchasing food at grocery stores, supermarkets, farmers markets. Single seniors receive $23 to $292 monthly (as of available data; amounts vary by income, household size, expenses). Supplements grocery budget for nutritious food.[1][6]
- Varies by: household_size

**How to apply:**
- Phone: MiCAFE Call Center at 1-877-664-2233 (Mon-Fri, 9:00 AM - 3:00 PM) for application assistance, recertification, and other benefits.[1][2][3][6]
- Online: MI Bridges portal at michigan.gov/mibridges to apply for SNAP/FAP, check status, manage account.[7]
- MiCAFE Network: In-home or community application assistance by trained professionals via local partners statewide.[1]
- Other: Utility assistance, tax programs via MiCAFE connections.[3]

**Timeline:** Not specified in sources; standard MDHHS processing applies (typically 30 days, expedited in some cases).

**Watch out for:**
- MiCAFE is not a separate program—it's assistance for standard SNAP/FAP, targeted at 60+ to overcome barriers/stigma; nearly 50% of eligible seniors do not apply.[1][2][6]
- Higher 200% FPL gross income limit specifically for seniors/disabled (not 130% for general households).[2]
- No asset limit for most, but applies in disqualification cases—many miss deductions for medical/shelter that lower net income.[5]
- Must recertify annually; MiCAFE helps with this.[1]
- Work requirements changed March 1, 2026 for ages 18-64 (proof of work needed).[7]

**Data shape:** MiCAFE provides application assistance for standard SNAP/FAP (not a distinct benefit program); eligibility uses household-based income/expenses with senior-specific higher gross income threshold (200% FPL) and deductions; benefits scale by household size, income, deductions; statewide with network partners.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/food

---

### Michigan LIHEAP (Energy Assistance)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income must be at or below 60% of State Median Income (SMI). Full table: 1 person: $36,517; 2: $47,753; 3: $58,989; 4: $70,225; 5: $81,461; 6: $92,697 annually. Adds approximately $11,236 per additional household member.[2][3][5]
- Assets: For some components like State Emergency Relief (SER)/LIHEAP crisis aid: up to $15,000 in cash assets and $15,000 in material assets. Specific exemptions not detailed in sources.[7]
- Enrollment in or receipt (past 12 months) of: SNAP, Medicaid, Home Heating Credit, State Emergency Relief, SSI, FAP, FIP, TANF, WIC, Head Start, or DHHS cash assistance automatically qualifies regardless of income.[2][4][5]
- Proof of ID, Social Security Number/Card, and income verification required.[2]
- Demonstration of need such as past due bill, shut-off notice, falling behind on payment plan, or need for deliverable fuel/home repair for crisis aid.[2][7]

**Benefits:** Supplemental bill payment assistance (one-time grants or credits toward heating/electric bills, reconnection fees, deliverable fuels like propane, or energy-related home repairs). Exact amounts not fixed; varies by funding, need, and household. Part of federal LIHEAP via SER for crisis situations; state MEAP for broader assistance. Monthly bill credits available via some utility-specific programs (e.g., Michigan Gas Utilities).[1][2][3][5][6]
- Varies by: priority_tier|household_size|region

**How to apply:**
- Online: MI Bridges at michigan.gov/mibridges or newmichigan.gov/s/isd-find-community-partners for help.[7]
- Phone: Contact local agencies via MI 211 (mi211.org), Michigan Gas Utilities at 800-401-6402, or MIHAF at 844-756-4423 (related).[1][7]
- In-person/mail: Local MDHHS offices, community partners via MI 211, or utility providers. Specific forms for utility programs (e.g., Michigan Gas Utilities eligibility form).[1][2][3]

**Timeline:** Not specified; first-come, first-served with limited availability for some programs.[1]
**Waitlist:** Limited funds filled first-come, first-served; potential waitlist or denial if funds exhausted.[1][2]

**Watch out for:**
- No longer requires SER decision letter; eligibility expanded to 60% SMI or auto-qualify via other programs—reapply if previously denied.[2][3][5]
- Funds limited, first-come first-served; apply early in heating season (e.g., Nov-Mar protections).[1][4]
- LIHEAP is crisis-focused via SER; MEAP is broader state program—distinguish for needs.[5][6]
- Utilities opting out of LIEAF must provide equivalent aid but may have shut-off protections Nov 1-Apr 15.[5][7]
- Seniors (65+) get extras like no shut-off payments in some utility Winter Protection Plans.[1][4]

**Data shape:** Eligibility auto-qualifies via other MI programs (SNAP/Medicaid/SSI); income at 60% SMI with household table; crisis vs. non-crisis tiers; administered statewide but via local agencies/utilities with funding caps and first-come availability.

**Source:** https://www.michigan.gov/mdhhs/inside-mdhhs/reports-stats/plans-regs/plans-regs/low-income-home-energy-assistance-program-liheap-state-plans[6]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Varies by region and is based on 200% of federal poverty guidelines, calculated as total gross household income over the last 3 months (or 1 month in some areas like Wayne Metro). Examples: NEMCSA - 1: $6,440 (3 mo), 2: $8,710, 3: $10,980, 4: $13,250, 5: $15,520; Wayne Metro - 1: $7,530 (3 mo)/$2,510 (1 mo), 2: $10,221/$3,407, 3: $12,909/$4,303, 4: $15,600/$5,200, 5: $18,291/$6,097. Auto-eligible for SSI, SDA, FIP recipients. Check local agency for current table.[1][3][5][7]
- Assets: No asset limits mentioned across sources.
- Homeowners or renters (landlord permission required for renters).
- Home must be occupied by applicant, not for sale, in foreclosure, or undergoing remodeling.
- Home not weatherized by WAP in last 15 years (or since 2006 in some areas).
- Home must pass energy audit; exclusions for major repairs like damaged roof, asbestos, knob & tube wiring, mold, standing water, missing drywall/windows.
- Access to basement and attic required.

**Benefits:** Free energy conservation and health/safety services based on whole-home energy audit, no guaranteed services. Includes: home energy audit, weather-stripping/caulking/air sealing, attic/foundation/wall/sill box insulation, programmable thermostat, furnace/water heater tune-up/replacement, refrigerator replacement, lightbulb replacement, door repair/replacement (some areas). Not for structural repairs, rehab, plumbing, electrical, roofs, windows, doors.[1][2][4][5]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (statewide via MDHHS contractors).
- Examples: Kent County - Call 616-632-7950; Wayne Metro - Online application or Connect Center call (number not specified in results); Allegan - Mail/drop-off questionnaire.
- Phone/website varies by region; no central statewide phone/form.
- In-person/mail for some agencies.

**Timeline:** Multi-step process taking several months.[2][3]
**Waitlist:** Screenings depend on available funding; funds limited, apply early.[2][6]

**Watch out for:**
- Not a repair/rehab/emergency program; major issues (roof, mold, wiring) disqualify home.
- No service guaranteed; based on audit.
- Funds limited, screenings only when funding available; process takes months.
- Home must be 'weatherization ready' per initial screening/audit.
- Renters need landlord approval; homes can't be re-weatherized within 15 years.

**Data shape:** Administered statewide via regional Community Action Agencies with varying income tables, providers, and screening based on local funding; eligibility heavily home-condition dependent via audit.

**Source:** https://www.michigan.gov/mdhhs/doing-business/weatherization

---

### Michigan Medicare Assistance Program (MMAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits for MMAP counseling services; available to all Michigan seniors, individuals with disabilities, caregivers, and those new to Medicare. Note: Counselors can screen for related Medicare Savings Programs (MSPs) with limits like QMB ($1,325/month single, $1,783 married), SLMB (up to $1,585 single, $2,135 married), QI (up to $1,781 single, $2,400 married)[1].
- Assets: No asset limits for MMAP itself. MSPs screened by counselors use federal limits of $9,660 single, $14,470 married (some sources note Michigan uses slightly higher $9,950/$14,910)[1].
- Must reside in Michigan
- Open to seniors (typically 65+), people with disabilities, caregivers, and families
- No restrictions on insurance affiliation; unbiased service

**Benefits:** Free one-on-one health insurance counseling, education on Medicare Parts A/B/D, Medicaid, Medigap, Medicare Advantage, long-term care insurance, prescription drug assistance, Medicare Savings Programs (QMB/SLMB/QI), Extra Help; help with bills/claims/appeals, fraud prevention, group presentations, eligibility screening/enrollment assistance, referrals; no direct financial aid or payments[2][3][4][6].

**How to apply:**
- Phone: Toll-free statewide hotline 1-800-803-7174 (connects to nearest office; local examples: 269-373-5158)[4][5][6][7][8]
- Website: http://www.mmapinc.org or regional sites like thesenioralliance.org[6][7]
- Email: Available via local offices (e.g., kalcounty.gov contact)[5]
- In-person: At local MMAP offices/providers across Michigan (e.g., CareWell Services in Barry/Calhoun Counties, The Senior Alliance)[4][7]

**Timeline:** Immediate phone screening; counseling appointments scheduled promptly (no fixed timeline specified)[7]

**Watch out for:**
- Not a direct benefits payer—provides counseling/education only, not enrollment or payments itself; counselors cannot sell insurance (unbiased)[2][5][6]
- People confuse with Medicare Savings Programs (MSPs) it helps screen for, which do have income/asset limits[1][3]
- Volunteers handle most counseling; thorough training but availability may vary by region[4][5]
- Free service funded by CMS/AoA grants—no cost, but must call hotline for local access[2][4]

**Data shape:** no income/asset test for core counseling; statewide free service via regional volunteer counselors; focuses on education/enrollment help for Medicare/Medicaid rather than direct aid

**Source:** http://www.mmapinc.org

---

### Home Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income or asset limits specified; eligibility prioritizes greatest need but is not income-based for core OAA program. Medicaid-linked programs require enrollment in participating plan but no dollar amounts listed[1][6].
- Assets: No asset limits or counts/exemptions specified in sources[1][2][6].
- Homebound (difficulty leaving home unassisted regularly) or prioritized older adult[2][6][7]
- Unable to prepare meals or shop independently due to physical, mental, or cognitive limitations[1][2][6]
- No able/willing adult in home or vicinity to prepare all meals[4][7]
- Able to feed self or with caregiver assistance[3][4][7]
- Must be home for delivery or arrange ahead and notify program of absences[2][3][6][7]
- Special dietary needs met by program meals without health risk[4][7]
- For Medicaid/OAA/PACE: enrolled in plan, food insecure, clinical risk (e.g., diabetes, CHF, cancer, recent hospitalization)[1][5]
- May extend to spouse/partner (any age), disabled household members, or caregivers if funding available[3][4][6][7]

**Benefits:** Nutritionally sound home-delivered meals (1+ per day based on assessment); may include medically tailored meals for conditions like diabetes or post-hospitalization. No fixed dollar value; opportunity to contribute voluntarily. Regular assessments (every 6 months)[1][2][3][6].
- Varies by: priority_tier|region

**How to apply:**
- Contact local Area Agency on Aging (AAA) for assessment (statewide entry point; no central phone listed, use regional providers e.g., Meals on Wheels Western Michigan: (616) 459-3111)[2][6]
- Staff home visit or call for needs assessment and eligibility determination[2][3]
- Medicaid/MA plans: Check plan manual or provider referral (e.g., Mom's Meals via participating plans)[1][5]

**Timeline:** Within a few days of assessment if eligible[3][6]
**Waitlist:** Possible due to funding/availability, especially for extended eligibility; varies regionally[7]

**Watch out for:**
- Not a single centralized program—must contact local AAA/provider; eligibility varies by region/provider[2][3][6]
- Homebound status strictly enforced; regular absences can disqualify[2][3]
- Voluntary contributions expected but no fixed cost; private pay options if ineligible[3]
- Medicaid/MA versions require plan enrollment and specific health risks—check plan manually[1][5]
- Must allow in-home assessments (initial + every 6 months)[2][3]
- Spouse/disabled extensions depend on funding availability[3][7]

**Data shape:** Decentralized by local AAAs/providers with core OAA standards but regional variations in operation, providers, and funding; no income/asset tests; prioritizes greatest need/homebound; Medicaid tiers add clinical criteria

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/other-help/food/home-delivered-meals[6]

---

### Respite Care (via MI Choice Waiver)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Gross monthly income cannot exceed 300% of the SSI federal benefit rate, which varies annually (e.g., $2,982 in one source for 2025, $2,829 in 2024). Excludes spousal income for singles. Special rules apply for married couples under federal protected spousal guidelines. No full household size table specified; set federally each year.
- Assets: Individual assets limited to $2,000 to $9,950 (sources vary; e.g., $9,950 allowable excluding one home and one car; $2,000 in another). Home equity interest no greater than $730,000 in 2025 if living in home or intending to return. Exemptions include: primary home (if equity limit met or spouse/disabled child/minor child lives there), one car, and federal protected spousal assets.
- Michigan resident at risk of nursing home placement.
- Medicaid eligible (categorically as aged 65+ or disabled 18+; disability determination required if under 65).
- Nursing Facility Level of Care (NFLOC) via in-person Michigan Medicaid LOCD assessment (functional needs in ADLs, cognition, behavior).
- Live in home/community setting (not nursing home; includes house, apartment, adult foster care, home for aged).
- Must require supports coordination plus at least one other waiver service.

**Benefits:** Respite services (temporary relief for caregivers, specific hours/dollar amounts not fixed statewide; part of array including adult day care, chore services, community living support/transportation, counseling, home-delivered meals, home modifications, medical equipment/supplies, nursing (preventative/private duty/respiratory), personal emergency response systems, supports coordination, training in independent living skills). Basic Medicaid services also covered.
- Varies by: priority_tier

**How to apply:**
- Contact local MI Choice Agency (statewide via regional agencies; e.g., CareWell Services for specific counties at phone provided by agency, The Senior Alliance at 734.722.2830, Region 7 AAA).
- Fill out MI Choice Waiver Referral Form (agency-specific).
- Telephone intake assessment by agency specialists.
- In-home Level of Care Determination (LOCD) by MI Choice Waiver Agency.

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by region/agency.

**Watch out for:**
- Must need supports coordination PLUS at least one other service; dementia diagnosis alone does not qualify.
- Income/asset limits change annually (300% SSI rate); home equity cap applies ($730,000 in 2025).
- Not for nursing home residents; only community settings.
- Financial eligibility stricter than standard Medicaid (special waiver limits).
- Regional agencies handle applications—must contact local one, not central state office.
- Married couples have special spousal impoverishment protections often missed.

**Data shape:** Administered statewide via ~16 regional MI Choice Agencies; benefits not fixed hours/dollars but personalized by assessed need/priority; strict NFLOC + dual service requirement; annual federal income/asset adjustments; home equity limit unique to waivers.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must be at or below 125% of the federal poverty guideline. Specific 2026 amounts: 1-person household $19,562 annually; 2-person household $26,437 annually[6]. These thresholds are updated annually based on federal poverty guidelines[4].
- Assets: Not specified in available search results. Contact local provider for asset limit information.
- Must be unemployed and actively seeking employment[4]
- Must register with Michigan Works[1]
- Must commit to training 19-20 hours per week[2][3]
- Must participate in job search activities[2]
- Must provide proof of all household income and family size documentation[1]

**Benefits:** Average 20 hours per week of paid part-time training at federal, state, or local minimum wage (whichever is highest)[3][4][5]. Includes: work experience for resume, on-the-job training in computer or vocational skills, professional job placement assistance, employment readiness training, resume writing assistance, career preparedness service, job training and related educational opportunities, yearly physical examinations, and access to American Job Centers[3][4][8].
- Varies by: fixed

**How to apply:**
- In-person: Contact local SCSEP provider or Michigan Works office (varies by county)[1][2]
- Phone: Contact Lauren Wonsowski at The Senior Alliance (specific to their service area)[1]. Regional providers vary; contact your local Area Agency on Aging or workforce development board.
- Online: Visit your regional provider's website (varies by service area)[2][5]
- Mail: Submit application through local provider (address varies by region)

**Timeline:** Not specified in available search results. Contact local provider for specific timeline.
**Waitlist:** Not specified in available search results. Contact local provider for waitlist information.

**Watch out for:**
- Income limits are strict: 125% of federal poverty level means a single person earning ~$19,562 annually qualifies, but higher earners do not[4][6]
- Must be actively unemployed—not underemployed or part-time employed[4]
- Enrollment priority is given to veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at-risk, low employment prospects, or those who failed to find employment through American Job Center[4][5]. This means non-priority applicants may face longer waits.
- Program is part-time (20 hours/week average), not full-time employment[3][4][5]
- Must commit to job search activities in addition to training hours[2]
- Must register with Michigan Works as a requirement[1]
- Program serves as a 'bridge' to unsubsidized employment—it's temporary training, not permanent employment[3][4]
- No specific information provided about asset limits; families should ask about this during application
- Processing time and waitlist information not publicly available—varies by region and provider
- Multiple regional providers operate in Michigan; the correct contact depends on the applicant's county of residence

**Data shape:** SCSEP is a statewide program administered through multiple regional providers with consistent eligibility criteria (age 55+, unemployed, income ≤125% federal poverty level) but varying application processes and contact information by region. Benefits are fixed (20 hours/week at minimum wage) and do not vary by household size or priority tier, though enrollment priority does affect waitlist placement. Income limits scale by household size but are based on federal poverty guidelines updated annually. The program is administered by the Michigan Department of Health and Human Services at the state level but delivered through approximately 50 local partner organizations across the state, creating geographic variation in accessibility and specific services offered.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); https://www.michigan.gov/mdhhs (Michigan Department of Health and Human Services administers statewide)

---

### Legal Assistance for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by regional provider and funding. Generally at or below 125% of Federal Poverty Level (FPL) for household income; up to 200% FPL with qualifying expenses in some cases (e.g., Legal Aid of Western Michigan). Seniors (60+) often exempt from income restrictions (e.g., Legal Services of Eastern Michigan, Lakeshore Legal Aid). No fixed dollar table provided; eligibility assessed case-by-case based on family size, income, and assets.
- Assets: Legal Aid of Western Michigan: No more than $15,000 in countable assets (e.g., bank accounts, recreational vehicles, rental properties). Exempt: primary home, transportation vehicles, retirement accounts. Other providers assess assets case-by-case without fixed statewide limit.
- Michigan resident
- Low-income priority (varies)
- Specific legal issues (civil matters)
- Not incarcerated
- Certain non-citizens excluded except domestic abuse cases

**Benefits:** Free civil legal services including advice, representation, advocacy on issues like housing, benefits, family law, domestic violence, elder rights, foreclosure prevention, discrimination. No charge for services (e.g., LSEM, Lakeshore Legal Aid). Modest Means Program alternative: reduced fee at $75/hour after $25 consultation (State Bar of Michigan).
- Varies by: region

**How to apply:**
- Phone: Lakeshore Legal Aid (888) 783-8190
- Online: MichiganLegalAid.org, LakeshoreLegalAid.org (apply online)
- Regional providers: Legal Aid of Western Michigan (lawestmi.org/i-need-help/eligibility/), Legal Services of Eastern Michigan (lsem-mi.org/clients/), LSNM (lsnm.org)
- State Bar Modest Means: lrs.michbar.org/LRS-Info/Modest-Means-Program

**Timeline:** Not specified; intake staff assess eligibility before advice. Modest Means: contact after application processed, then $25 fee for referral.
**Waitlist:** Not mentioned; depends on availability of lawyers/providers.

**Watch out for:**
- Not a single statewide program; must contact regional provider for exact eligibility.
- Seniors often qualify regardless of income, but low-income get priority.
- Services limited to civil legal matters; no criminal defense.
- Asset definitions vary; confirm countable vs. exempt.
- Modest Means is reduced-fee, not free.
- Eligibility determined case-by-case; funding restrictions apply.

**Data shape:** Decentralized by regional legal aid non-profits; no uniform income/asset table or statewide application; seniors (60+) prioritized or exempt from financial tests; varies significantly by provider geography and funding.

**Source:** https://www.michigan.gov/fyit/resources/legal (links to MichiganLegalAid.org)

---

### Nursing Home Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; services are free and available to all qualifying residents regardless of income.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a licensed long-term care facility in Michigan, including nursing homes, homes for the aged, adult foster care homes, and assisted living facilities.
- Services provided at the direction and with consent of the resident.

**Benefits:** Free, confidential advocacy services including investigating and resolving complaints about care or services, explaining resident rights, empowering residents to voice concerns, providing information and consultation on long-term care issues, routine visits to facilities, community education, training for resident councils or staff, and systemic advocacy for laws, regulations, and policies benefiting residents.

**How to apply:**
- Toll-free phone: 866-485-9393 (to contact local ombudsman)
- State office phone: 517-827-8040
- Website: https://mltcop.org (for information and materials)
- Regional offices, e.g., AgeWays for specific counties at 800-852-7795
- Email via MEJI or local providers

**Timeline:** Immediate response for concerns; ombudsmen provide timely assistance upon contact.

**Watch out for:**
- Services require resident consent and are directed by the resident's wishes; families cannot initiate action without it.
- Not a regulatory or licensing body; focuses on advocacy, not enforcement or surveys.
- Confidentiality means ombudsmen cannot disclose details without permission.
- Not for non-residents or unlicensed facilities.
- People may confuse with Medicaid or facility admission programs, which have financial eligibility.

**Data shape:** no income or asset test; resident consent required; statewide network of local ombudsmen with regional hosting but uniform services; advocacy-only, not financial or direct care provision.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mltcop.org

---

### MI Choice Waiver Program


**Eligibility:**
- Age: 65 or older, OR 18+ with documented disability+
- Income: {"2026_monthly_limit":"$2,982 per month (single applicant, regardless of marital status)","couples":"Each spouse can have up to $2,982 monthly income when both are applicants","note":"Income limits are set annually by the Federal Government. Even $1 over the limit disqualifies applicants."}
- Assets: {"2026_individual":"$9,950","2026_couple":"$14,910","exemptions":["Primary residence (home equity interest up to $730,000 in 2025; applicant must live in home or have 'Intent to Return')","One vehicle","Personal belongings"],"note":"Not all assets are counted. Home equity is calculated as current home value minus outstanding debt."}
- Must require Nursing Facility Level of Care (NFLOC) as determined by Michigan Medicaid Nursing Facility Level of Care Determination (LOCD) tool
- Must require supports coordination plus at least one additional waiver service
- Must qualify for Medicaid
- Cannot currently reside in a nursing home (MI Choice is for community-based care)
- Can live in: own home, apartment, condo, adult foster care, or home for the aged

**Benefits:** Home and community-based services equivalent to nursing home care, including: Nursing Services (Preventative), Private Duty Nursing/Respiratory Care, Respite Care, Specialized Medical Equipment and Supplies, Supports Coordination, Training, and Personal Emergency Response Systems (PERS)
- Varies by: Individual need and assessment; specific hours/frequency not detailed in search results but determined through care coordination

**How to apply:**
- Phone: Contact your county's MI Choice Waiver Agency (varies by region; example: Region 7 Area Agency on Aging at 1-800-858-1637)
- Phone: General information line (734) 722-2830
- In-person: Assessment completed by Registered Nurse at applicant's home, hospital, or nursing home
- Phone interview: Preliminary screening for Activities of Daily Living requirements, income, and asset test

**Timeline:** Initial screening conversation: 30-45 minutes; full processing timeline not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Diagnosis alone does not qualify: Having Alzheimer's disease or dementia does not automatically meet functional criteria; applicants must demonstrate specific functional needs through the LOCD assessment
- Income limit is strict: Even $1 over the $2,982 monthly limit disqualifies applicants; no exceptions
- Must require two services minimum: Applicants must need supports coordination PLUS at least one other waiver service; supports coordination alone is insufficient
- Cannot use while in nursing home: MI Choice is explicitly for community-based care; residents of nursing homes are ineligible
- Functional assessment is rigorous: The LOCD evaluates Activities of Daily Living (transferring, mobility, eating, toileting), cognitive abilities (decision-making, memory, communication), and behavioral factors (wandering, refusing care); applicants must demonstrate genuine need
- Annual income/asset limits reset: Limits are set by Federal Government each year and may change; 2026 limits differ from prior years
- Regional agency variation: Application process and wait times may vary by county; contact your specific county's waiver agency for accurate timelines
- Home equity cap: Home equity interest cannot exceed $730,000 (2025 figure); this may change annually

**Data shape:** MI Choice is a statewide program with county-level administration through designated regional agencies. Eligibility is uniform across the state (income, asset, age, functional requirements), but application processing and service delivery vary by region. The program is Medicaid-funded with strict federal income/asset limits that reset annually. Functional eligibility is determined through a standardized assessment tool (LOCD) but requires in-person evaluation. Benefits are service-based (not cash) and tailored to individual need rather than fixed amounts. The program explicitly excludes current nursing home residents and is designed as a community-based alternative to institutionalization.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### Home Help Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Single applicant: up to $1,305/month (effective 4/1/25, equivalent to 100% FPL, updates annually in April). Married couples (one or both applying): up to $1,763/month. Varies by household size and Medicaid program type; full table not specified in sources—must confirm current FPL via MDHHS as limits adjust yearly.[1][2]
- Assets: Home equity limit of $752,000 (2026) if intending to return home. Exemptions: primary residence if applicant/spouse/minor child/disabled child lives there; one vehicle. Other countable assets include savings, property (limits not specified numerically beyond home equity; typical Medicaid asset rules apply).[1][2]
- Michigan resident living in own home (or intent to return).
- Enrolled in Michigan Medicaid.
- Hands-on assistance needed with at least one Activity of Daily Living (ADL: eating, bathing, dressing, grooming, mobility, transferring, toilet use), assessed via Adult Services Comprehensive Assessment (MDHHS-5534).
- Caregivers (family/friends/neighbors, 18+, not spouse/parent of minor): background check, training, CHAMPS enrollment; responsible relatives must be unable/unavailable.
- U.S. citizen or legal resident.

**Benefits:** In-home personal care for ADLs (eating, bathing, dressing, grooming, mobility, transferring, toilet use) and IADLs. Up to 180 hours/month typically; additional hours based on assessed need and MDHHS approval. Pays family/friends/neighbors as caregivers (not spouses/parents of minors).
- Varies by: priority_tier

**How to apply:**
- Contact local MDHHS county office or Area Agency on Aging.
- Phone: Local MDHHS office (find via michigan.gov/mdhhs) or provider assistance lines like 833-447-3326.
- In-person: Local Department of Health and Human Services office.

**Timeline:** Not specified in sources.

**Watch out for:**
- Must be enrolled in Medicaid first—not Medicare alone.
- Income limit at 100% FPL (lower than some programs' 300% SSI); updates April annually.
- Caregivers cannot be spouses or parents of minors; responsible relatives must be unavailable.
- Home equity limit applies ($752,000 in 2026).
- Functional need assessed strictly via MDHHS-5534 form.

**Data shape:** Tied to Medicaid eligibility with strict ADL assessment; caregiver payments via CHAMPS; hours tiered by need (up to 180+/month); statewide but county-administered with local variations.

**Source:** https://www.michigan.gov/mdhhs/doing-business/providers/providers/other/homehelp[8]

---

### MiCAFE (Michigan's Coordinated Access to Food for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Based on household composition and monthly income minus medical expenses; specific dollar amounts or full table not detailed in available sources. Eligibility determined for programs like SNAP, which consider household financial situation.[1][4][6]
- Assets: Countable assets considered based on household composition; specific limits, what counts, or exemptions not detailed in sources.[1]
- Living on limited income
- Primarily for individuals 60 and older
- Eligibility varies by target program (e.g., SNAP, Medicare premiums, utilities) with deductions like medical expenses applied[1][2][4]

**Benefits:** Application assistance for SNAP (Bridge Card/food benefits), Medicare premiums, Medicare Part D prescription drug benefits, utility assistance, medical assistance, prescriptions, and other community programs; includes outreach, education, in-home assistance where available, and annual recertification support.[1][2][3][5]

**How to apply:**
- Phone: 1-877-664-2233 (Monday-Friday, 9:00 a.m. to 3:00 p.m.)[1][2][5][8]
- Website: elderlawofmi.org/micafe[2][8]
- In-home or in-community assistance via MiCAFE Network partners where available[3]

**Timeline:** Not specified; varies by target program (e.g., SNAP eligibility requirements)[5]

**Watch out for:**
- MiCAFE itself is not a direct benefit provider but an assistance program—families must qualify for underlying programs like SNAP based on household finances[1][2][6]
- Nearly 50% of eligible seniors do not enroll in SNAP without assistance, so proactive application via MiCAFE is key[8]
- Phone support limited to specific hours; eligibility for non-SNAP benefits (e.g., Medicare help) available even if SNAP-ineligible[2]
- Focuses on reducing stigma/barriers for food assistance but extends to utilities/medical[3]

**Data shape:** Advocacy-focused with eligibility tied to multiple programs (SNAP primary); no fixed MiCAFE-specific income/asset tables provided—uses program-specific rules with medical deductions; statewide network model with partner variations

**Source:** https://www.elderlawofmi.org/micafe

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MI Health Link | benefit | local | deep |
| MI Choice Medicaid Waiver | benefit | state | deep |
| Michigan Program for All-Inclusive Care  | benefit | local | deep |
| Medicare Savings Programs (MSP) - QMB, S | benefit | federal | deep |
| SNAP Food Assistance (MiCAFE for seniors | navigator | federal | simple |
| Michigan LIHEAP (Energy Assistance) | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Michigan Medicare Assistance Program (MM | benefit | federal | deep |
| Home Delivered Meals (Meals on Wheels) | benefit | federal | medium |
| Respite Care (via MI Choice Waiver) | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors | resource | local | simple |
| Nursing Home Long-Term Care Ombudsman | resource | federal | simple |
| MI Choice Waiver Program | benefit | state | deep |
| Home Help Program | benefit | state | deep |
| MiCAFE (Michigan's Coordinated Access to | navigator | state | simple |

**Types:** {"benefit":11,"navigator":2,"employment":1,"resource":2}
**Scopes:** {"local":3,"state":5,"federal":8}
**Complexity:** {"deep":11,"simple":4,"medium":1}

## Content Drafts

Generated 16 page drafts. Review in admin dashboard or `data/pipeline/MI/drafts.json`.

- **MI Health Link** (benefit) — 3 content sections, 6 FAQs
- **MI Choice Medicaid Waiver** (benefit) — 5 content sections, 6 FAQs
- **Michigan Program for All-Inclusive Care for the Elderly (PACE)** (benefit) — 5 content sections, 6 FAQs
- **Medicare Savings Programs (MSP) - QMB, SLMB, QI** (benefit) — 5 content sections, 6 FAQs
- **SNAP Food Assistance (MiCAFE for seniors)** (navigator) — 1 content sections, 6 FAQs
- **Michigan LIHEAP (Energy Assistance)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 6 content sections, 6 FAQs
- **Michigan Medicare Assistance Program (MMAP)** (benefit) — 5 content sections, 6 FAQs
- **Home Delivered Meals (Meals on Wheels)** (benefit) — 4 content sections, 6 FAQs
- **Respite Care (via MI Choice Waiver)** (benefit) — 4 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Legal Assistance for Seniors** (resource) — 3 content sections, 6 FAQs
- **Nursing Home Long-Term Care Ombudsman** (resource) — 1 content sections, 6 FAQs
- **MI Choice Waiver Program** (benefit) — 6 content sections, 6 FAQs
- **Home Help Program** (benefit) — 4 content sections, 6 FAQs
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)** (navigator) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **region**: 3 programs
- **individualized_plan_based_on_assessed_needs**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **priority_tier|household_size|region**: 1 programs
- **priority_tier**: 3 programs
- **not_applicable**: 3 programs
- **priority_tier|region**: 1 programs
- **fixed**: 1 programs
- **Individual need and assessment; specific hours/frequency not detailed in search results but determined through care coordination**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MI Health Link**: County-restricted to specific lower peninsula counties plus entire Upper Peninsula; dual eligibility mandatory with full Medicaid (no spend down); regional ICO providers; automatic enrollment outreach via Michigan ENROLLS
- **MI Choice Medicaid Waiver**: Administered regionally via local AAAs with individualized service plans; no fixed dollar/hour caps but NFLOC-based; statewide since 1998 with agency variations in access/wait times.
- **Michigan Program for All-Inclusive Care for the Elderly (PACE)**: Multiple regional providers with exclusive service areas; no strict income/asset limits for enrollment but Medicaid determines costs; eligibility hinges on state-certified nursing home level of care assessment by PACE IDT; private pay option available
- **Medicare Savings Programs (MSP) - QMB, SLMB, QI**: This program has three distinct tiers (QMB, SLMB, QI) with different income thresholds, coverage levels, and retroactivity rules. The key differentiator is retroactivity: QMB has none, SLMB has up to 3 months, QI has calendar-year-based retroactivity. QI operates on first-come, first-served basis with annual reapplication requirement, making it fundamentally different from QMB and SLMB. Income limits are tied to Federal Poverty Level and reset annually on April 1. Asset limits are uniform across QMB/SLMB/ALMB but vary by household size. Automatic enrollment exists for those with SSI-related Medicaid.
- **SNAP Food Assistance (MiCAFE for seniors)**: MiCAFE provides application assistance for standard SNAP/FAP (not a distinct benefit program); eligibility uses household-based income/expenses with senior-specific higher gross income threshold (200% FPL) and deductions; benefits scale by household size, income, deductions; statewide with network partners.
- **Michigan LIHEAP (Energy Assistance)**: Eligibility auto-qualifies via other MI programs (SNAP/Medicaid/SSI); income at 60% SMI with household table; crisis vs. non-crisis tiers; administered statewide but via local agencies/utilities with funding caps and first-come availability.
- **Weatherization Assistance Program (WAP)**: Administered statewide via regional Community Action Agencies with varying income tables, providers, and screening based on local funding; eligibility heavily home-condition dependent via audit.
- **Michigan Medicare Assistance Program (MMAP)**: no income/asset test for core counseling; statewide free service via regional volunteer counselors; focuses on education/enrollment help for Medicare/Medicaid rather than direct aid
- **Home Delivered Meals (Meals on Wheels)**: Decentralized by local AAAs/providers with core OAA standards but regional variations in operation, providers, and funding; no income/asset tests; prioritizes greatest need/homebound; Medicaid tiers add clinical criteria
- **Respite Care (via MI Choice Waiver)**: Administered statewide via ~16 regional MI Choice Agencies; benefits not fixed hours/dollars but personalized by assessed need/priority; strict NFLOC + dual service requirement; annual federal income/asset adjustments; home equity limit unique to waivers.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a statewide program administered through multiple regional providers with consistent eligibility criteria (age 55+, unemployed, income ≤125% federal poverty level) but varying application processes and contact information by region. Benefits are fixed (20 hours/week at minimum wage) and do not vary by household size or priority tier, though enrollment priority does affect waitlist placement. Income limits scale by household size but are based on federal poverty guidelines updated annually. The program is administered by the Michigan Department of Health and Human Services at the state level but delivered through approximately 50 local partner organizations across the state, creating geographic variation in accessibility and specific services offered.
- **Legal Assistance for Seniors**: Decentralized by regional legal aid non-profits; no uniform income/asset table or statewide application; seniors (60+) prioritized or exempt from financial tests; varies significantly by provider geography and funding.
- **Nursing Home Long-Term Care Ombudsman**: no income or asset test; resident consent required; statewide network of local ombudsmen with regional hosting but uniform services; advocacy-only, not financial or direct care provision.
- **MI Choice Waiver Program**: MI Choice is a statewide program with county-level administration through designated regional agencies. Eligibility is uniform across the state (income, asset, age, functional requirements), but application processing and service delivery vary by region. The program is Medicaid-funded with strict federal income/asset limits that reset annually. Functional eligibility is determined through a standardized assessment tool (LOCD) but requires in-person evaluation. Benefits are service-based (not cash) and tailored to individual need rather than fixed amounts. The program explicitly excludes current nursing home residents and is designed as a community-based alternative to institutionalization.
- **Home Help Program**: Tied to Medicaid eligibility with strict ADL assessment; caregiver payments via CHAMPS; hours tiered by need (up to 180+/month); statewide but county-administered with local variations.
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)**: Advocacy-focused with eligibility tied to multiple programs (SNAP primary); no fixed MiCAFE-specific income/asset tables provided—uses program-specific rules with medical deductions; statewide network model with partner variations

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Michigan?
