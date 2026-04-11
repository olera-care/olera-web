# Rhode Island Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 9.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 17 |
| New (not in our data) | 9 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 5 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Rhode Island Medicaid (Long-Term Services and Supports for Elderly)

- **income_limit**: Ours says `$1304` → Source says `$2,982` ([source](https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term services and supports (LTSS): nursing home care, assisted living, shared living (adult foster care), in-home supports, adult day health, respite care. Basic Medicaid: physician visits, prescriptions, ER/hospital stays. Dual eligible (Medicare + Medicaid): coordinated via Neighborhood INTEGRITY plan, covers LTSS in home/facility. Nursing home: state receives most income post-$75 allowance.[1][5][8]` ([source](https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply`

### PACE (Program of All-Inclusive Care for the Elderly)

- **min_age**: Ours says `65` → Source says `55` ([source](https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/))
- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive coordinated care including primary/acute/specialty care, behavioral health, long-term services/supports (LTSS) in home/community, adult day services, transportation to/from centers/appointments/emergencies, social/behavioral supports, prescription drugs (no co-pays/deductibles). Manages care if hospitalized/nursing home needed. Provided by interdisciplinary team (doctors, nurses, social workers).` ([source](https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/))
- **source_url**: Ours says `MISSING` → Source says `https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/`

### Medicare Savings Programs (MSP)

- **income_limit**: Ours says `$1304` → Source says `$1,683` ([source](https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, co-payments, coinsurance, and deductibles. QI: Pays Medicare Part B premiums only (limited funds, first-come first-served). Automatic enrollment in Extra Help for prescription drugs if qualified. Part B premium ~$185/month in 2025 (state pays).[6][7]` ([source](https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx`

### Supplemental Nutrition Assistance Program (SNAP)

- **income_limit**: Ours says `$1980` → Source says `$2,608` ([source](https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits loaded on EBT card for food purchases at authorized stores. Maximum: ~$291 (1 person), ~$535 (2 people); actual amount reduced by income/deductions. Special for elderly: higher medical deduction (> $35/month out-of-pocket), excess shelter deduction, standard deduction $209 (1-3 people)[1][7].` ([source](https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$42,252` ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time grant paid directly to utility or fuel company to help with heating bills. Primary grants based on income, family size, fuel type, and minimum delivery requirements. Amount not fixed per household; varies by factors above. Crisis component for emergencies (e.g., shutoff, broken heater). No cooling assistance[1][4][6][7].` ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized health insurance counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy), understanding benefits, appeal rights, coverage rules, and preventing fraud via Senior Medicare Patrol; also includes outreach presentations, enrollment events, and education at health fairs[1][3][4][6]` ([source](https://oha.ri.gov/Medicare))
- **source_url**: Ours says `MISSING` → Source says `https://oha.ri.gov/Medicare`

### Meals on Wheels of Rhode Island

- **min_age**: Ours says `65` → Source says `60` ([source](https://vets.ri.gov/node/1151 (Rhode Island Office of Veterans Services listing) and www.rimeals.org))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered meals Monday-Friday that meet one-third of an older adult's daily dietary requirement. Meals prepared by professional third-party caterer. Capital City Café Program offers socialized dining at community sites throughout Providence, including an LGBTQIA+ café site.` ([source](https://vets.ri.gov/node/1151 (Rhode Island Office of Veterans Services listing) and www.rimeals.org))
- **source_url**: Ours says `MISSING` → Source says `https://vets.ri.gov/node/1151 (Rhode Island Office of Veterans Services listing) and www.rimeals.org`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints via mediation, negotiation, and administrative action; investigation of abuse, neglect, financial exploitation, or rights violations; education on residents' rights and good care practices; technical support for resident and family councils; representation before agencies; assistance with conflicts, facility inspections, access to facility lists, and systemic improvements at local, state, and national levels.` ([source](https://alliancebltc.org/ombudsman-program/overview/))
- **source_url**: Ours says `MISSING` → Source says `https://alliancebltc.org/ombudsman-program/overview/`

## New Programs (Not in Our Data)

- **Rhode Island Community Living and Attendant Services Waiver (CLASS)** — service ([source](https://eohhs.ri.gov/ (inferred from RI EOHHS context; specific CLASS page not in results)))
  - Shape notes: Limited specific data; aligns with general RI Medicaid waiver structure requiring NFLOC; no detailed service list, income tables by household, or application steps in results
- **Weatherization Assistance Program** — service ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/weatherization-assistance-program-wap[1]))
  - Shape notes: Requires prior LIHEAP approval; priority for elderly/disabled households; regional CAP agency delivery with town-specific service areas
- **Caregiver/Respite Support** — service ([source](https://oha.ri.gov/resources/caregiver-supportsrespite))
  - Shape notes: Income-based financial assistance connects to statewide providers; no fixed dollar/hour amounts or tables in sources; covers all ages via Lifespan Respite with caregiver focus regardless of recipient Medicaid status
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dlt.ri.gov/ (RI Department of Labor & Training; SCSEP via https://www.jotform.com/form/73065540820148); federal: https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: State-administered via RI DLT with county-specific service areas (e.g., Bristol); priority tiers affect access; no asset test, income scales by household size at 125% FPL; part-time hours fixed average, wage by local minimum
- **Legal Aid for Seniors** — service ([source](https://www.helprilaw.org))
  - Shape notes: No fixed income/asset tables published; eligibility via federal poverty screening. Multiple providers with overlapping services for 60+ low-income seniors. No wait times or processing details available.
- **Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)** — financial ([source](https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance))
  - Shape notes: Four income tiers with copay percentages (15%-85%) and full coverage after $1,500 OOP for lowest tier; no asset test; restricted to Part D deductible/non-covered drugs; separate tier for 55-64 disabled
- **At HOME Cost Share Program** — financial ([source](https://oha.ri.gov/resources/home-care/home-cost-share))
  - Shape notes: No asset test; tiered participant cost-share by income brackets scaling with FPL and household size (single/couple); non-Medicaid alternative with needs-based subsidy for in-home/personal care and adult day
- **HCC Senior Companion Program** — service ([source](https://oha.ri.gov/get-involved/volunteering/senior-companions))
  - Shape notes: Volunteer-based AmeriCorps Seniors program focused on frail/isolated elders; eligibility emphasizes frailty and income need over strict asset tests; services non-medical companionship and ADLs; statewide via regional agencies with limited exact income tables in public sources
- **The POINT** — service ([source](https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply))
  - Shape notes: Entry-point assessment for Medicaid LTSS; eligibility ties to Medicaid EAD/LTSS with NFLOC; benefits customized by assessed need, not fixed amounts; statewide but regional provider delivery

## Program Details

### Rhode Island Medicaid (Long-Term Services and Supports for Elderly)


**Eligibility:**
- Age: 65+
- Income: For 2026, single applicant: $2,982/month (Nursing Home Medicaid and LTSS). Almost all income counts (IRA, pensions, Social Security, wages, etc.), but nursing home residents keep $75/month personal needs allowance plus Medicare premiums if dual eligible. Married: up to $5,964/month ($2,982 per spouse). Higher income allowed for LTSS with co-share payment.[1][3][5]
- Assets: Single: $4,000 countable assets. Married: $8,000 ($4,000 per spouse). Countable: cash, bank accounts, stocks, bonds, second vehicles, non-exempt property. Exempt: primary home (equity up to $730,000 if intent to return, spouse/child/disabled child lives there), one vehicle, personal belongings, burial plots, life insurance up to $1,500 face value, irrevocable burial trusts. Home sale proceeds become countable.[1][3][4][5]
- Rhode Island resident
- U.S. citizen or qualified immigrant
- Nursing Facility Level of Care (NFLOC) for LTSS/nursing home: assessed via Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (shopping, cooking, cleaning); need full-time care equivalent to nursing home for 30+ consecutive days[1][2][3][4][5]
- For basic EAD Medicaid (non-LTSS): age 65+ or disabled, no NFLOC required[1]

**Benefits:** Long-term services and supports (LTSS): nursing home care, assisted living, shared living (adult foster care), in-home supports, adult day health, respite care. Basic Medicaid: physician visits, prescriptions, ER/hospital stays. Dual eligible (Medicare + Medicaid): coordinated via Neighborhood INTEGRITY plan, covers LTSS in home/facility. Nursing home: state receives most income post-$75 allowance.[1][5][8]
- Varies by: priority_tier

**How to apply:**
- Online: HealthSourceRI.com or HealthyRhode.ri.gov
- Phone: Contact RI DHS (specific number not in results; use HealthSourceRI for assistance)
- Paper application via HealthSourceRI
- In-person: Local assistance via HealthSourceRI locator[6][10]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by service demand

**Watch out for:**
- Most income goes to state for nursing home costs (only $75 personal allowance)[1]
- Selling exempt home makes proceeds countable, risking eligibility[3]
- LTSS allows higher income but requires co-share payment[8]
- NFLOC assessment required for LTSS, not just age/disability[1][5]
- Asset transfers: allowed to spouse/disabled child/sibling/caregiver child without penalty[3]

**Data shape:** Income/asset limits strict for LTC; NFLOC functional test required; dual eligible get managed care coordination; spousal protections double limits; home equity cap at $730,000

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply

---

### Rhode Island Community Living and Attendant Services Waiver (CLASS)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must meet Medicaid financial eligibility, typically income under $2,982/month for a single applicant in 2026 for nursing home level care; exact CLASS limits align with Medicaid long-term care standards and may require Nursing Facility Level of Care (NFLOC)[5]. No specific CLASS income table found in results.
- Assets: Assets under $4,000 for a single nursing home Medicaid applicant in 2026; applies to CLASS as a Medicaid waiver. What counts and exemptions not detailed in results[5].
- Nursing Facility Level of Care (NFLOC) required[5]
- Medical/functional need for long-term care services, assessed via ADLs for some benefits[5]

**Benefits:** Home and community-based services (HCBS) including attendant care and community living supports; specific services, hours, or dollar amounts not detailed in results. Provider manual references waiver services but no itemized list[9].

**Timeline:** Not specified in results

**Watch out for:**
- Requires NFLOC, not just ADL functional need for core benefits[5]
- Must be Medicaid-eligible first; similar to other waivers like Katie Beckett but targeted at community living[6][8]
- Provider-focused info dominates results; family application details sparse

**Data shape:** Limited specific data; aligns with general RI Medicaid waiver structure requiring NFLOC; no detailed service list, income tables by household, or application steps in results

**Source:** https://eohhs.ri.gov/ (inferred from RI EOHHS context; specific CLASS page not in results)

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No strict income limits for enrollment; financial criteria not considered for medical eligibility. Medicaid-eligible participants typically have income under 300% of Federal Benefit Rate ($2,901/month for 2025) and assets $2,000 or less (excluding primary home). Non-Medicaid eligible can private pay (~$4,000–$5,000/month average).[1][2][4]
- Assets: For Medicaid eligibility: $2,000 or less (excluding primary home, one vehicle). No asset test for program enrollment itself.[1]
- Need nursing home level of care (certified by state; extensive assistance with ADLs like bathing, grooming, etc.) but able to live safely in community with PACE support.
- Live in PACE service area (statewide excluding Block Island & Prudence Island).
- Agree to receive care exclusively from PACE network of doctors/providers.
- Eligible for Medicaid LTSS and/or Medicare (not required to be dual-eligible).
- US citizen or legal resident for 5 years (for Medicare); no Medicare Advantage, hospice, or other managed plans.

**Benefits:** Comprehensive coordinated care including primary/acute/specialty care, behavioral health, long-term services/supports (LTSS) in home/community, adult day services, transportation to/from centers/appointments/emergencies, social/behavioral supports, prescription drugs (no co-pays/deductibles). Manages care if hospitalized/nursing home needed. Provided by interdisciplinary team (doctors, nurses, social workers).
- Varies by: region

**How to apply:**
- Phone: 401-434-1400 (PACE RI) or 401-654-4176 (enrollment specialist).[2][8]
- In-person: Service centers in Providence, Woonsocket, Westerly.[4]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; potential regional variations.

**Watch out for:**
- Must use only PACE network providers (no outside doctors).
- Private pay ~$4,000–$5,000/month if not Medicaid-eligible.
- Cannot have Medicare Advantage, hospice, or other managed plans.
- Limited to 3 centers; not truly statewide (excludes islands, service area restrictions).
- Re-enrollment treated as new unless within 2 months of losing Medicaid.

**Data shape:** Only available at 3 centers; no financial test for enrollment but Medicaid determines free access; nursing home level care required while living in community; regional provider restrictions.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://eohhs.ri.gov/ (Rhode Island Executive Office of Health and Human Services); PACE RI: https://pace-ri.org/

---

### Medicare Savings Programs (MSP)


**Eligibility:**
- Age: 65+
- Income: Rhode Island's Medicare Premium Payment Program (MPP), also known as MSP, has two main tiers with updated limits as of February 2026: Qualified Medicare Beneficiary (QMB) - $1,683/month individual, $2,275/month married couple; Qualified Individual (QI) - $2,255/month individual, $3,050/month married couple. SLMB qualifiers are automatically enrolled in QMB. Must be a U.S. citizen or qualified immigrant (e.g., refugees, asylees, Lawful Permanent Residents meeting residency rules). QDWI available for under 65 working disabled individuals (limits not specified in sources).[1][6]
- Assets: Individual: $9,950; Married couple: $14,910 for both QMB and QI (federal limits used). Counts typical countable assets; exemptions not detailed in sources but follow federal MSP rules (e.g., home, car often exempt).[2][6]
- Must have Medicare Parts A and/or B.
- For QDWI: under age 65, working with disabling impairment, not eligible for regular Medicaid.
- Rhode Island expanded eligibility: SLMB moved to QMB as of Feb 2026.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, co-payments, coinsurance, and deductibles. QI: Pays Medicare Part B premiums only (limited funds, first-come first-served). Automatic enrollment in Extra Help for prescription drugs if qualified. Part B premium ~$185/month in 2025 (state pays).[6][7]
- Varies by: priority_tier

**How to apply:**
- Phone: Contact Rhode Island EOHHS (specific number not in results; call 401-462-0311 or local office per general RI Medicaid process).
- Online: eohhs.ri.gov (MPP section).
- Mail/In-person: Local Medicaid offices or download forms from site.
- Multiple routes via RI Medicaid Sherlock system.

**Timeline:** Not specified in sources.
**Waitlist:** QI has limited funds; first-come, first-served basis.

**Watch out for:**
- QI funds limited - apply early.
- SLMB auto-converts to QMB (expanded as of Feb 2026).
- Must be Medicare enrollee; QDWI only for working disabled under 65.
- Immigration status strict (qualified immigrants only).
- Assets use federal limits; some states disregard more but RI follows standard.
- Separate process for LTSS (long-term services).

**Data shape:** Tiered by QMB/QI with RI-specific income expansions; SLMB folded into QMB; QI first-come first-served with fund limits; statewide uniform.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: Households with a member age 60+ or disabled qualify if gross monthly income is under 200% FPL (e.g., $2,608/month for 1 person; expanded rules waive gross income test if net income ≤100% FPL). Standard households without elderly/disabled: <185% FPL. Households of 1-2 people may qualify on gross income alone. Annual equivalents for 2025: $15,060 (1 person), $20,440 (2 people). SSI recipients are categorically eligible[1][2][3][5][8].
- Assets: No asset limit in Rhode Island for households with a member 60+ or disabled. Federal fallback asset limit of $4,500 may apply if gross income exceeds expanded limits, but RI waives it. Exempt: primary home, retirement savings, most vehicles. Applications may still request asset info[1][2][9].
- U.S. citizen or qualified non-citizen
- Rhode Island resident
- Household includes all who buy/prepare food together
- For ESAP (simplified rules): All adults 60+/disabled, no earned income[4][6]

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized stores. Maximum: ~$291 (1 person), ~$535 (2 people); actual amount reduced by income/deductions. Special for elderly: higher medical deduction (> $35/month out-of-pocket), excess shelter deduction, standard deduction $209 (1-3 people)[1][7].
- Varies by: household_size

**How to apply:**
- Online: Rhode Island DHS portal (dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap)
- Phone: State SNAP hotline (contact local DHS office via 401-462-5300 or 1-855-697-4347)
- Mail/In-person: Local Department of Human Services/Department of Social Services offices
- Simplified ESAP paper form: 'Simple Application for SNAP for Elderly/Disabled Households' available at DHS[1][5][6]

**Timeline:** Standard SNAP: 30 days; expedited for urgent cases. ESAP extends certification to 36 months with simplified recertification[6].

**Watch out for:**
- No gross income test for elderly/disabled households—many miss this expanded 200% FPL eligibility[2][5][8]
- Higher deductions for medical/shelter expenses often boost benefits for seniors[1][7]
- ESAP auto-converts qualifying households for 36-month certification, simplified reporting[4][6]
- Own home, retirement savings, Social Security count but don't disqualify[3][9]
- Include all who share food prep in household size[3]

**Data shape:** Expanded eligibility (200% FPL, no asset test) for households with elderly/disabled; ESAP simplifies process for all-adult 60+/disabled with no earned income; benefits/deductions scale by household size and expenses

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross household income must be at or below 60% of Rhode Island's State Median Income (SMI). FFY2026 guidelines (mandatory as of October 1, 2024; applicable for 2026 season): For household size 1: $42,252 (12-month), $10,563 (3-month), $3,521 (1-month); size 2: $55,252/$13,813/$4,604; size 3: $68,253/$17,063/$5,687. Full table extends to size 14: $126,756/$31,689/$10,563. Exact limits set each program year; check current chart at local CAP[1][2][3][4][7].
- Assets: No asset limit applies[1].
- Household includes everyone at the address covered by the same utility bill[1]
- No requirement to be on public assistance, have an unpaid bill, or own/rent status[3]
- Must qualify for LIHEAP to access related programs like Weatherization[4]

**Benefits:** One-time grant paid directly to utility or fuel company to help with heating bills. Primary grants based on income, family size, fuel type, and minimum delivery requirements. Amount not fixed per household; varies by factors above. Crisis component for emergencies (e.g., shutoff, broken heater). No cooling assistance[1][4][6][7].
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online via local Community Action Program (CAP) agency portals (e.g., cappri.org, westbaycap.org, ebcap.org); verify email within 30 minutes[3][5][8]
- Phone: Local CAP (e.g., CAPP 401-273-2000, EBCAP 401-437-1000 ext. 6606)[5][8]
- In-person or dropbox at local CAP intake sites; new applicants preferred in-person, arrangements for elderly/disabled[3][5]
- Mail: Send application/documents to local CAP; renewal forms mailed to prior recipients[3][5][7]

**Timeline:** 3-5 business days for initial review after document submission; staff contacts for more info[5].
**Waitlist:** Funding limited; agencies may stop accepting if funds exhausted. Priority for termination notices, shutoffs, prior recipients[5][6].

**Watch out for:**
- Seasonal: Heating Oct-May (2026 opens Oct 1, 2025); funds limited, apply early[1][3][6]
- Household counts all at address on utility bill, differing from SNAP[1]
- New applicants: Apply in-person preferred; online needs active email verified in 30 min[3][5]
- Crisis only for true emergencies; no cooling aid[1]
- Must update address for renewals; appeals within 15 days[3]
- Related programs (Weatherization) require LIHEAP eligibility first[4]

**Data shape:** Income eligibility at 60% SMI with full table by household size up to 14 and multi-period limits (12/3/1 month); grants scale by income, size, fuel; administered via multiple regional CAP agencies with varying contact methods; no asset test

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must qualify for LIHEAP (income-eligible at or below federal poverty guidelines, typically 60% of state median income or low-income rate A-60 through RI Energy; exact dollar amounts not specified in sources and vary annually by household size) or have low-income rate A-60 through RI Energy. No specific table provided; families must apply for LIHEAP first to verify[1][2][3][6][7][9].
- Assets: No asset limits mentioned in sources.
- Must first apply for and qualify for LIHEAP (heating assistance)[1][3][6][9].
- Home must meet criteria (e.g., not recently weatherized; issues like mold may defer services)[3].
- Homeowners eligible; renters eligible with landlord approval[1][3][7].
- Priority for households with older adults, people with disabilities, or children[3].

**Benefits:** Whole house energy efficiency services including insulation (attic, wall, floor), heating system checks/tuning, boiler/furnace testing and repair/replacement, appliance replacements, smoke and carbon monoxide detectors, reducing drafts, proper ventilation, comprehensive electrical energy audit, and energy-efficient light bulbs[1][2][6][7].
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Program (CAP) agency (year-round applications; they guide the process and accommodate older adults, disabled individuals, non-English speakers, and those with literacy issues)[1][3].
- Tri-County CAP: Serves specific towns (Johnston, North Providence, Smithfield, Burrillville, Glocester, Charlestown, Exeter, Hopkinton, Narragansett, North Shoreham, North Kingstown, Richmond, South Kingstown, West Greenwich, Westerly)[4].
- BVCAP (Blackstone Valley CAP): Serves Pawtucket, Central Falls, Cumberland, Lincoln; call (401) 723-4520[7].
- CAPP RI: Contact via their site for low-income residents[6].
- First apply for LIHEAP at local CAP agency[1][3][6].

**Timeline:** Not specified in sources.

**Watch out for:**
- Must first qualify for LIHEAP; WAP not available independently[1][3][6][9].
- Renters need landlord approval[1][3][7].
- Homes recently weatherized or with issues like mold may be deferred[3].
- Administered locally via CAP agencies, not directly through state DHS[1][3].
- Post-COVID home visits resumed in 2020 with safety guidelines[1].

**Data shape:** Requires prior LIHEAP approval; priority for elderly/disabled households; regional CAP agency delivery with town-specific service areas

**Source:** https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/weatherization-assistance-program-wap[1]

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income or asset limits; prioritizes people with limited incomes, Medicare beneficiaries under age 65 with disabilities, and dually eligible for Medicare and Medicaid, but open to all Medicare beneficiaries, families, and caregivers[1][3]
- Assets: No asset limits or tests apply[1]
- Must be a Medicare beneficiary, family member, or caregiver[1][3][6]

**Benefits:** Free one-on-one personalized health insurance counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy), understanding benefits, appeal rights, coverage rules, and preventing fraud via Senior Medicare Patrol; also includes outreach presentations, enrollment events, and education at health fairs[1][3][4][6]

**How to apply:**
- Phone: Toll-free 1-888-884-8721 (primary contact) or TTY 401-462-0740[3][7][8]
- Regional phone: Providence dial 2-1-1 or 462-4444 (POINT); Northern RI (401) 349-5760 x2635[6]
- Website: https://oha.ri.gov/Medicare[3][8]
- In-person or phone via Office of Healthy Aging, 25 Howard Ave, Building 57, Cranston RI 02920[2]
- Through ADRC (Rhode Island Aging and Disability Resource Center)[3]

**Timeline:** Immediate assistance via phone or in-person counseling sessions; no formal application processing[1][4]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling and education, no direct payments or medical services[1][4]
- No income/asset test to receive counseling, but helps apply for programs that do have limits[1][3]
- Services rely on trained volunteers/staff; availability may depend on local partners[1][5]
- Focuses on Medicare navigation; for non-Medicare insurance, contact state insurance department[4]

**Data shape:** no income test, open to all Medicare beneficiaries/families; counseling-only service via statewide network with regional phone access; prioritizes limited-income and disabled under 65 but no barriers to entry

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oha.ri.gov/Medicare

---

### Meals on Wheels of Rhode Island


**Eligibility:**
- Age: 60+
- Income: Not specified in available program documentation. Search results indicate some programs adjust fees based on financial ability, but income is not always a disqualifying factor.
- Must be homebound (unable to safely leave the home on their own) for Home-Delivered Meal Program
- Cannot be a participant in an adult daycare or dining program on days scheduled to receive meals
- Must reside within a delivery zone served by the program
- For Capital City Café Program: must be 60+ OR under 60 with disability/receiving general public assistance

**Benefits:** Home-delivered meals Monday-Friday that meet one-third of an older adult's daily dietary requirement. Meals prepared by professional third-party caterer. Capital City Café Program offers socialized dining at community sites throughout Providence, including an LGBTQIA+ café site.
- Varies by: program_type

**How to apply:**
- Online: Visit www.rimeals.org to fill out and submit referral form (Home-Delivered) or enrollment form (Capital City Café)
- Mail: Download, print, and mail completed form to Meals on Wheels of RI, Inc., 70 Bath St., Providence, RI 02908
- Phone: (401) 351-6700 to speak with Programs & Mission Impact Director Shana DeFelice or team member
- Email: sdefelice@rimeals.org

**Timeline:** Not specified in program documentation. General Meals on Wheels programs process applications within a week to longer if waitlist exists.
**Waitlist:** Not specified in program documentation

**Watch out for:**
- Delivery zone requirement: Not all Rhode Island residents qualify based on geography alone. Must verify residence is within service area before applying.
- Homebound definition is strict: For Home-Delivered Program, applicants must be unable to safely leave home on their own. Those with mobility challenges but who can leave with assistance may not qualify.
- Program exclusion: Cannot receive meals on days already participating in adult daycare or other dining programs.
- Frequency limitation: Meals only offered Monday-Friday, not weekends or holidays.
- Dietary coverage: Meals meet only one-third of daily dietary requirement, not full nutrition.
- Two distinct programs with different eligibility: Home-Delivered vs. Capital City Café have different age/disability requirements and service models.
- Income documentation: While income may not disqualify, some programs require financial information to determine fee adjustments.

**Data shape:** This program operates two distinct service models (Home-Delivered and Capital City Café) with different eligibility criteria. The Home-Delivered program has strict homebound requirements, while Capital City Café serves more ambulatory seniors. Geographic service area is a critical limiting factor not always apparent to applicants. Income limits and specific processing timelines are not publicly documented in available sources, requiring direct contact with the program for complete financial information.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://vets.ri.gov/node/1151 (Rhode Island Office of Veterans Services listing) and www.rimeals.org

---

### Caregiver/Respite Support

> **NEW** — not currently in our data

**Eligibility:**
- Income: Based on caregiver's income for older adults and adults/children with disabilities (CareBreaks/Lifespan Respite); specific dollar amounts not listed in sources, but over $40,000 referenced in application without exact thresholds; for children under 21, based on household income if Medicaid-eligible; care recipient over 18 uses recipient/spouse income[1][4][6].
- Assets: For children under 21: based on child's assets with income/resource limits; not specified for adults[1].
- Caregiver provides unpaid care to older adults, adults/children with disabilities, or kinship minors without financial compensation[1][6].
- Available regardless of care recipient's Medicaid/Medicare status (Lifespan Respite/Carebreaks)[1].
- For children: under 21, Medicaid-eligible, lives at home, requires institutional level of care (hospital/nursing/ICF-IID)[1].
- Care recipient must need assistance with ADLs/IADLs for related programs like RIte@Home[2].

**Benefits:** Financial assistance/subsidy for respite care; connects approved caregivers to respite providers across state tailored to needs; respite breaks via trained professionals in-home or community settings; includes peer support, mentorship, advocacy[1][5][6][7].
- Varies by: income

**How to apply:**
- Contact respite provider agency for application packet (e.g., Carebreaks at Catholic Social Services via Family Caregiver Alliance of RI: https://www.unitedwayri.org/get-help/fcari/ or 401-421-7833)[1][4][7].
- Phone: 401-421-7833 (Rhode Island CareBreaks Respite Services Program)[7].
- EOHHS website for related respite (not specified URL for Carebreaks)[1].

**Timeline:** Not specified

**Watch out for:**
- Income-based subsidy determination varies by care recipient age (over/under 18) and household[4].
- Must complete full application with signed caregiver section and all proofs to avoid delays[4].
- Separate from Medicaid-specific programs like RIte@Home, which has stricter NFLOC and excludes spouses as paid caregivers[2][3].
- Respite under Medicaid waivers may require managed care contracts or self-direction[5].

**Data shape:** Income-based financial assistance connects to statewide providers; no fixed dollar/hour amounts or tables in sources; covers all ages via Lifespan Respite with caregiver focus regardless of recipient Medicaid status

**Source:** https://oha.ri.gov/resources/caregiver-supportsrespite

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level (FPL) for the past 12 months. Exact dollar amounts vary annually by household size and are based on federal guidelines published by HHS; for example, in 2023, 125% FPL for a single person was approximately $18,825 annually, for a household of 2 approximately $25,500 (check current HHS poverty guidelines for precise RI figures as they adjust yearly). Rhode Island residents must reside in service areas including Bristol County.
- Unemployed
- Eligible to work in the United States (per Immigration Reform and Control Act of 1986)
- Reside in Rhode Island (e.g., Bristol County or other served areas)
- Low employment prospects preferred; priority for veterans/qualified spouses, age 65+, disabled, rural residents, homeless/at risk, low literacy, limited English, or prior American Job Center users

**Benefits:** Part-time community service work-based job training (average 20 hours/week) at non-profits/public agencies (e.g., schools, hospitals, senior centers, day-care); paid the highest of federal, state, or local minimum wage; on-the-job skills training, resume-building experience, professional job placement assistance to unsubsidized employment; lifetime limit of 48 months participation.
- Varies by: priority_tier

**How to apply:**
- Online pre-application: https://www.jotform.com/form/73065540820148 (RI Department of Labor & Training SCSEP Pre-Application Survey; staff contacts you post-submission)
- Phone: Contact RI Department of Labor & Training (specific SCSEP line not listed; use general DLT inquiry at 401-462-8000 or national DOL SCSEP resources)
- In-person/mail: RI Department of Labor & Training centers (e.g., Providence office)

**Timeline:** Staff contacts after pre-application submission to assess eligibility (timeline not specified; typically prompt follow-up)
**Waitlist:** Possible due to funding limits and priority enrollment; varies by demand

**Watch out for:**
- Must be currently unemployed (employed applicants ineligible)
- Income test based on family/household for past 12 months at 125% FPL (not individual)
- 48-month lifetime participation limit, no exceptions
- Training wage only (not regular employment; bridge to unsubsidized jobs)
- Priority enrollment may create waitlists for non-priority applicants
- Residency restricted to served RI counties (confirm specific areas)

**Data shape:** State-administered via RI DLT with county-specific service areas (e.g., Bristol); priority tiers affect access; no asset test, income scales by household size at 125% FPL; part-time hours fixed average, wage by local minimum

**Source:** https://dlt.ri.gov/ (RI Department of Labor & Training; SCSEP via https://www.jotform.com/form/73065540820148); federal: https://www.dol.gov/agencies/eta/seniors

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: 125% of the 2024 Federal Poverty Guidelines (exact dollar amounts not specified in sources; low-income required for RI Legal Services Senior Citizens Program). No specific table by household size provided.
- Assets: Not specified or applicable for this legal aid program.
- Low-income status
- Rhode Island resident
- Legal issues related to government benefits (e.g., appeals of denials), landlord-tenant disputes, subsidized housing, consumer issues, family law

**Benefits:** Free legal advice, assistance, and representation on public-assistance programs, government benefits appeals, landlord-tenant disputes, subsidized housing admission, consumer issues, family law. Free half-hour consultation via RI Bar Association for age 60+.

**How to apply:**
- Phone: RI Legal Services at 401-274-2652 (Providence office) or 401-846-2264 (Newport office); RI Bar Association Lawyer Referral Service for the Elderly at 401-421-7799; Volunteer Lawyer Program at 401-421-7758 or 1-800-339-7758
- In-person: RI Legal Services at 56 Pine Street, Providence, RI 02903 or 50 Washington, Newport, RI 02840; RI Bar Association at 41 Sharpe Dr, Cranston, RI
- Website: https://www.helprilaw.org (Rhode Island Legal Services)

**Timeline:** Not specified.

**Watch out for:**
- Must qualify under 125% Federal Poverty Guidelines; not automatic for all seniors—screening required
- Focuses on specific legal areas like benefits appeals and housing; not general legal aid
- Clients may owe filing fees/court costs even with pro bono attorneys
- Free half-hour consultation only via RI Bar Association; full representation depends on eligibility and availability
- Separate from Medicaid—often confused as Medicaid provides healthcare, not legal aid

**Data shape:** No fixed income/asset tables published; eligibility via federal poverty screening. Multiple providers with overlapping services for 60+ low-income seniors. No wait times or processing details available.

**Source:** https://www.helprilaw.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a long-term care facility such as nursing home, assisted living, hospice, or licensed home care; or receiving services at Bristol Veterans Home, Eleanor Slater Hospital Regan Building in Cranston, or Zambarano Hospital in Pascoag; open to older persons and people with disabilities receiving long-term care services.

**Benefits:** Advocacy to resolve complaints via mediation, negotiation, and administrative action; investigation of abuse, neglect, financial exploitation, or rights violations; education on residents' rights and good care practices; technical support for resident and family councils; representation before agencies; assistance with conflicts, facility inspections, access to facility lists, and systemic improvements at local, state, and national levels.

**How to apply:**
- Phone: (401) 785-3340 or toll-free 1-888-351-0808
- Online contact form: https://alliancebltc.org/ombudsman-program/contact/
- Mail: Office of Healthy Aging, 25 Howard Ave, Building 57, Cranston, RI 02920

**Timeline:** Not specified; program responds to complaints and provides access to services on an as-needed basis without formal processing timeline.

**Watch out for:**
- Not a direct service provider like healthcare or financial aid; focuses solely on advocacy and complaint resolution, not personal care or funding.
- Requires the individual to be receiving long-term care services in a covered facility or program; does not cover independent living without licensed services.
- Anyone can file a complaint on behalf of the resident, but services target residents of facilities.
- Operates independently but reports suspected abuse to relevant authorities.

**Data shape:** no income test; advocacy-only program triggered by complaints rather than formal eligibility application; facility-resident specific; statewide with no financial barriers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://alliancebltc.org/ombudsman-program/overview/

---

### Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 55-64 if receiving Social Security Disability Insurance (SSDI)+
- Income: Income-based tiers for individuals and couples (2026 figures from sources; verify current at application):
- Level 1 (lowest): Individuals $0-$23,595, Couples $0-$31,900; state pays full cost after $1,500 out-of-pocket.
- Level 2: Individuals $23,596-$47,630, Couples $31,901-$59,558.
- Level 3: Individuals $47,631-$83,510, Couples $59,559-$95,261.
- Ages 55-64 disabled: $0-$83,510 (individual).
Participant copay: 40%, 70%, 85%, or 15% based on tier after discounts[1][2][3].
- Assets: No resource or asset test[1].
- Must be enrolled in Medicare Part D plan
- Not eligible for or enrolled in SSA Extra Help Program
- Rhode Island resident
- Proof of age, residence, income, and Part D enrollment required[2]

**Benefits:** Subsidies for RIPAE-approved medications during Medicare Part D deductible period or for non-covered Part D drugs; state pays portion after senior discounts, coupons, insurance, and federal discounts (e.g., full cost after $1,500 OOP for lowest tier; copays 15%-85% for others); access to other meds at RIPAE discount price. Eligible drugs dispensed within 1 year of prescription; excludes experimental drugs[1][2].
- Varies by: income_tier

**How to apply:**
- Download form from OHA website: https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance
- Phone: Office of Healthy Aging (OHA) at (401) 462-3000 or (401) 462-0560; The Point at (401) 462-4444
- In-person/mail: OHA or senior centers statewide; applications available at senior centers
- Appeal denial: Call OHA at (401) 462-3000[1][3]

**Timeline:** Not specified in sources

**Watch out for:**
- Only covers deductible period or non-covered Part D drugs; not a substitute for full Part D or Extra Help (which often provides better coverage)[1][4]
- Must already be enrolled in Medicare Part D; no coverage without it[2]
- Income tiers determine copay percentage (e.g., 40%, 70%, 85%); lowest tier gets full state payment after $1,500 OOP[1][2]
- Excludes experimental drugs; limited to 1 year from prescription[2]
- Check if Extra Help eligible first, as it may disqualify from RIPAE and offer better benefits[1][4]

**Data shape:** Four income tiers with copay percentages (15%-85%) and full coverage after $1,500 OOP for lowest tier; no asset test; restricted to Part D deductible/non-covered drugs; separate tier for 55-64 disabled

**Source:** https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance

---

### At HOME Cost Share Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 19-64 with diagnosis of Alzheimer’s or related dementia+
- Income: Capped at 250% of Federal Poverty Level (FPL). Tiered cost-sharing based on income (2024 figures): Tier 1: $18,825 (single), $25,550 (couple); Tier 2: $30,120 (single), $40,880 (couple). Exact 2026 FPL amounts adjust annually; confirm current via OHA[2][4].
- Assets: No asset limit[2][4][5].
- Rhode Island resident
- Does not qualify for Medicaid
- Needs assessment showing need for assistance with personal care, health care, housekeeping, or meal preparation (functional need, not full NFLOC like RIte@Home)
- Must require in-home or adult day services

**Benefits:** State subsidizes in-home services (housekeeping, personal care, meal preparation) and/or community adult day services (personal care, nursing support, meals, recreational/social activities). Participant pays tiered cost-share: Tier 1 ~$4.50/hour home care, $7/day adult day; Tier 2 ~$7.50/hour home care, $15/day adult day (2022-2024 rates; private pay averages $25-27/hour home care, $90-100/day adult day). Individualized care plan based on needs[2][4][5].
- Varies by: income_tier

**How to apply:**
- Phone: ADRC / POINT helpdesk at 401-462-4444[2][5]
- Contact Rhode Island Aging and Disability Resource Center (ADRC)[2]

**Timeline:** Not specified in sources

**Watch out for:**
- Separate from RIte@Home (Medicaid program with asset limits, NFLOC, higher income cap at 300% FBR ~$2,901/month); this is state-funded for non-Medicaid eligible[1][2]
- Cost-share required based on income tier; not free services[2][4]
- Eligibility requires needs assessment; not just income[2]
- Income limits and cost-share rates tied to annual FPL adjustments[2][4]
- Excludes those eligible for Medicaid—apply for Medicaid first if possibly eligible[4]
- Limited to specific services; no full homemaker-only without personal care need[6]

**Data shape:** No asset test; tiered participant cost-share by income brackets scaling with FPL and household size (single/couple); non-Medicaid alternative with needs-based subsidy for in-home/personal care and adult day

**Source:** https://oha.ri.gov/resources/home-care/home-cost-share

---

### HCC Senior Companion Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Must meet specified income limits to receive services; exact dollar amounts or table not detailed in sources but tied to low-income or poverty level guidelines, updated annually (similar programs reference up to 200% Federal Poverty Limit for related HCC services)[3][2]
- Rhode Island resident
- Frail or isolated older adults
- Unable to leave home without considerable assistance or facing isolation
- Need help with tasks of daily living
- Live alone or have no one to help (implied for some services)
- Low or poverty level income or demonstrate great need

**Benefits:** Trained volunteers (age 55+) provide companionship, assistance with daily tasks (e.g., transportation to medical appointments, shopping assistance, meal preparation, light housework, appropriate exercise, paying bills), advocacy, and respite for family caregivers; visits occur in homes, adult day centers, or community sites; serves nearly 500 elders weekly[3][4][5]

**How to apply:**
- Phone: 401-462-0569[3][4]


**Watch out for:**
- Program recruits and trains volunteers (55+) to serve clients; families request a companion volunteer, not paid staff—volunteers may receive stipends if low-income but services are free to clients
- No medical care (e.g., personal care, medication, wound care, lifting)
- Income eligibility required but exact current guidelines (e.g., FPL table) must be verified by calling as not listed
- Part of broader HCC programs with co-pays in related services, but Senior Companion appears free for eligible clients
- Volunteers must pass background checks and physical exams, which may affect matching availability

**Data shape:** Volunteer-based AmeriCorps Seniors program focused on frail/isolated elders; eligibility emphasizes frailty and income need over strict asset tests; services non-medical companionship and ADLs; statewide via regional agencies with limited exact income tables in public sources

**Source:** https://oha.ri.gov/get-involved/volunteering/senior-companions

---

### The POINT

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must qualify for Rhode Island Medicaid Long-Term Services and Supports (LTSS). For a single applicant in 2026: income under $2,982/month. Limits based on Federal Poverty Level (FPL) and adjusted for household size; higher than SSI (approx. 75% FPL). Exact table not specified in sources—contact DHS for current household-specific amounts.[5][3]
- Assets: Countable resources may not exceed $4,000 for an individual (spouse assets also assessed). SSI-related: $2,000 individual/$3,000 couple. What counts: typical countable assets like cash, bank accounts (exemptions not detailed; primary residence, one vehicle often exempt in Medicaid LTSS).[4][5][3]
- Rhode Island resident
- U.S. citizen or qualified immigrant
- Medicaid-eligible via Elders and Adults with Disabilities (EAD) pathway or LTSS
- Nursing Facility Level of Care (NFLOC) or clinical/functional need (e.g., unable to leave home without considerable assistance; impairment in activities of daily living)
- For related self-directed programs: ability to self-direct care or have representative; age 65+ or 18+ with disability

**Benefits:** Single entry point for Long-Term Services and Supports (LTSS) assessment, including home and community-based services to avoid nursing homes (e.g., personal care, homemaker services, respite). Provides eligibility screening, care planning, and referral to Medicaid LTSS programs like Personal Choice (self-directed care). No fixed dollar amount or hours specified—customized based on assessed needs.[3][4][2]
- Varies by: priority_tier

**How to apply:**
- Phone: (401) 462-4444
- In-person or referral via RI Department of Human Services (DHS) LTSS offices

**Timeline:** Not specified in sources
**Waitlist:** Possible for LTSS services after assessment; varies by need and availability

**Watch out for:**
- Must meet both financial AND clinical/level of care requirements—functional need (e.g., NFLOC) often overlooked
- The POINT is an entry/assessment service, not direct benefits; leads to Medicaid LTSS with potential waitlists
- Income/asset limits higher than SSI but spousal impoverishment rules apply; planning needed if over limits
- Blindness not separate category—requires disability determination
- Voluntary signatures (e.g., liens notice) but may affect eligibility

**Data shape:** Entry-point assessment for Medicaid LTSS; eligibility ties to Medicaid EAD/LTSS with NFLOC; benefits customized by assessed need, not fixed amounts; statewide but regional provider delivery

**Source:** https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Rhode Island Medicaid (Long-Term Service | benefit | state | deep |
| Rhode Island Community Living and Attend | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Programs (MSP) | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels of Rhode Island | benefit | federal | medium |
| Caregiver/Respite Support | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Rhode Island Pharmaceutical Assistance f | benefit | state | deep |
| At HOME Cost Share Program | benefit | state | deep |
| HCC Senior Companion Program | resource | state | simple |
| The POINT | benefit | state | deep |

**Types:** {"benefit":12,"resource":4,"employment":1}
**Scopes:** {"state":8,"local":1,"federal":8}
**Complexity:** {"deep":12,"simple":4,"medium":1}

## Content Drafts

Generated 16 page drafts. Review in admin dashboard or `data/pipeline/RI/drafts.json`.

- **Rhode Island Medicaid (Long-Term Services and Supports for Elderly)** (benefit) — 5 content sections, 6 FAQs
- **PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 5 content sections, 6 FAQs
- **Medicare Savings Programs (MSP)** (benefit) — 5 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 3 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels of Rhode Island** (benefit) — 4 content sections, 6 FAQs
- **Caregiver/Respite Support** (benefit) — 2 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Legal Aid for Seniors** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)** (benefit) — 3 content sections, 6 FAQs
- **At HOME Cost Share Program** (benefit) — 5 content sections, 6 FAQs
- **HCC Senior Companion Program** (resource) — 1 content sections, 6 FAQs
- **The POINT** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **not_applicable**: 5 programs
- **region**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **program_type**: 1 programs
- **income**: 1 programs
- **income_tier**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Rhode Island Medicaid (Long-Term Services and Supports for Elderly)**: Income/asset limits strict for LTC; NFLOC functional test required; dual eligible get managed care coordination; spousal protections double limits; home equity cap at $730,000
- **Rhode Island Community Living and Attendant Services Waiver (CLASS)**: Limited specific data; aligns with general RI Medicaid waiver structure requiring NFLOC; no detailed service list, income tables by household, or application steps in results
- **PACE (Program of All-Inclusive Care for the Elderly)**: Only available at 3 centers; no financial test for enrollment but Medicaid determines free access; nursing home level care required while living in community; regional provider restrictions.
- **Medicare Savings Programs (MSP)**: Tiered by QMB/QI with RI-specific income expansions; SLMB folded into QMB; QI first-come first-served with fund limits; statewide uniform.
- **Supplemental Nutrition Assistance Program (SNAP)**: Expanded eligibility (200% FPL, no asset test) for households with elderly/disabled; ESAP simplifies process for all-adult 60+/disabled with no earned income; benefits/deductions scale by household size and expenses
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income eligibility at 60% SMI with full table by household size up to 14 and multi-period limits (12/3/1 month); grants scale by income, size, fuel; administered via multiple regional CAP agencies with varying contact methods; no asset test
- **Weatherization Assistance Program**: Requires prior LIHEAP approval; priority for elderly/disabled households; regional CAP agency delivery with town-specific service areas
- **State Health Insurance Assistance Program (SHIP)**: no income test, open to all Medicare beneficiaries/families; counseling-only service via statewide network with regional phone access; prioritizes limited-income and disabled under 65 but no barriers to entry
- **Meals on Wheels of Rhode Island**: This program operates two distinct service models (Home-Delivered and Capital City Café) with different eligibility criteria. The Home-Delivered program has strict homebound requirements, while Capital City Café serves more ambulatory seniors. Geographic service area is a critical limiting factor not always apparent to applicants. Income limits and specific processing timelines are not publicly documented in available sources, requiring direct contact with the program for complete financial information.
- **Caregiver/Respite Support**: Income-based financial assistance connects to statewide providers; no fixed dollar/hour amounts or tables in sources; covers all ages via Lifespan Respite with caregiver focus regardless of recipient Medicaid status
- **Senior Community Service Employment Program (SCSEP)**: State-administered via RI DLT with county-specific service areas (e.g., Bristol); priority tiers affect access; no asset test, income scales by household size at 125% FPL; part-time hours fixed average, wage by local minimum
- **Legal Aid for Seniors**: No fixed income/asset tables published; eligibility via federal poverty screening. Multiple providers with overlapping services for 60+ low-income seniors. No wait times or processing details available.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only program triggered by complaints rather than formal eligibility application; facility-resident specific; statewide with no financial barriers
- **Rhode Island Pharmaceutical Assistance for the Elderly (RIPAE)**: Four income tiers with copay percentages (15%-85%) and full coverage after $1,500 OOP for lowest tier; no asset test; restricted to Part D deductible/non-covered drugs; separate tier for 55-64 disabled
- **At HOME Cost Share Program**: No asset test; tiered participant cost-share by income brackets scaling with FPL and household size (single/couple); non-Medicaid alternative with needs-based subsidy for in-home/personal care and adult day
- **HCC Senior Companion Program**: Volunteer-based AmeriCorps Seniors program focused on frail/isolated elders; eligibility emphasizes frailty and income need over strict asset tests; services non-medical companionship and ADLs; statewide via regional agencies with limited exact income tables in public sources
- **The POINT**: Entry-point assessment for Medicaid LTSS; eligibility ties to Medicaid EAD/LTSS with NFLOC; benefits customized by assessed need, not fixed amounts; statewide but regional provider delivery

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Rhode Island?
