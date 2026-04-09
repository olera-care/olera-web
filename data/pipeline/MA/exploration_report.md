# Massachusetts Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 57s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 14 |
| New (not in our data) | 11 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **financial**: 3 programs
- **service**: 8 programs
- **advocacy**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Frail Elder Waiver (FEW)

- **min_age**: Ours says `60` → Source says `60-64 with a disability, or 65 and older[1][2][4][5]` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants[1]))
- **income_limit**: Ours says `$2901` → Source says `$2,199` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants[1]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services (HCBS) including home care, respite, adult day health, Alzheimer's/dementia coaching, supportive services by qualified providers (e.g., RN, social workers, OT); supports to avoid nursing home placement; specific services determined by assessment; no fixed dollar/hour amounts stated, varies by need[1][7][8]` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants[1]`

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$1305` → Source says `$2,829` ([source](https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical/social services including: adult day care, dentistry/vision, emergency services, home care, hospital care, laboratory/x-ray, meals, medical specialty services, nursing home care (if needed), nutritional counseling, occupational/physical/recreational therapy, prescription drugs, primary care (doctors/nurses), social services/work counseling, transportation. All Medicare/Medicaid-covered services plus more, via Interdisciplinary Team and individualized care plan. No co-pays/out-of-pocket for covered services.` ([source](https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation and resolution of complaints related to health, safety, welfare, rights; mediation between residents and facilities; protection of resident rights; regular facility visits; education on rights and regulations; assistance with facility selection; support for resident/family councils; advocacy for systemic changes. Complaint categories include abuse/neglect, care, discharge/eviction, autonomy/rights, dietary, environment, and more. Provided by paid staff (41) and certified volunteers (199) who visit facilities routinely (e.g., weekly).[1][3][4][5][7][8]` ([source](https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program`

## New Programs (Not in Our Data)

- **MassHealth Medicare Savings Program** — financial ([source](https://www.mass.gov/info-details/get-help-paying-medicare-costs))
  - Shape notes: Tiered by QMB (full coverage), SLMB/QI (premiums only); no asset test for MSP-only since 2024; income at 225% FPL; scales minimally by household size (single/couple shown); statewide uniform.
- **Massachusetts Weatherization Assistance Program (WAP)** — service ([source](https://www.mass.gov/info-details/weatherization-assistance-program-wap))
  - Shape notes: Tied directly to HEAP/LIHEAP eligibility (60% SMI, categorical via TAFDC/SSI); local agency delivery with town-specific providers and prioritization; income table scales precisely by household size; tenant landlord covenants are a key unique restriction.
- **SHINE (Serving Health Insurance Needs of Everyone)** — advocacy ([source](https://www.mass.gov/info-details/serving-the-health-insurance-needs-of-everyone-shine-program))
  - Shape notes: no income/asset test for counseling; statewide but regionally delivered via local providers and volunteers; focuses on advocacy/eligibility screening for Medicare-related cost-saving programs rather than direct benefits
- **Meals on Wheels** — service ([source](https://www.massmealsonwheels.org (state coordination); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/[8][3]))
  - Shape notes: Decentralized by local providers/regions with varying contacts, zones, and minor eligibility nuances; no uniform state income test or fixed forms; spouse/dependent inclusion regardless of age
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors[3]))
  - Shape notes: County-restricted grantees with varying providers; priority tiers determine access; funding-driven waitlists; no asset test or fixed statewide application portal
- **Massachusetts Senior Legal Helpline** — service ([source](https://www.mass.gov/doc/senior-legal-help-line/download))
  - Shape notes: no income test for helpline access; age 60+ Massachusetts residents; free info/referrals primary, free attorney rare via referral
- **Prescription Advantage** — financial ([source](https://www.prescriptionadvantagema.org/))
  - Shape notes: Tiered by income categories (S0-S5) with premiums/copays; requires coordination with Medicare/MSP/Extra Help; no asset test except for required sub-programs; statewide uniform
- **Home Care Program (HCP)** — service ([source](https://www.mass.gov/info-details/home-care-program))
  - Shape notes: Eligibility hinges on MassHealth status or strict income caps without household size adjustment; services tiered by functional assessment priority (ADLs over IADLs); funding-driven waitlists common.
- **Enhanced Community Options Program (ECOP)** — service ([source](https://www.mass.gov (specific ECOP page not directly linked; see Mass.gov elder services summaries)))
  - Shape notes: Administered via 26 regional ASAPs with statewide cap and waitlist; targets pre-MassHealth frail elders at nursing-home clinical level but asset-ineligible; max 7.5 hrs/week services; recent 2026 eligibility tightening and slot cap
- **Home Modification Loan Program** — financial ([source](https://www.mass.gov/home-modification-loan-program-hmlp))
  - Shape notes: Statewide with regional providers handling applications; income limits scale by household size; loan amounts vary by home type (standard vs. mobile); strictly accessibility-focused, not repairs.
- **Senior Care Options (SCO)** — service ([source](https://www.mass.gov/senior-care-options))
  - Shape notes: Delivered via 5 regional SCO plans with overlapping but not fully statewide coverage; inherits MassHealth Standard financial/functional rules with Medicare integration; eligibility tightening for Medicare requirement in 2026; varies significantly by plan service area and provider

## Program Details

### MassHealth Medicare Savings Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be a Medicare beneficiary (typically age 65+ or under 65 with certain disabilities). Countable income at or below 225% of the Federal Poverty Level (FPL), which changes yearly on March 1. For 2025: $2,993/month for a single individual; $4,058/month for a married couple. Higher incomes may qualify for full MassHealth if assets meet limits. Under age 65 on MassHealth Standard may qualify without asset test.[1][2][3][5]
- Assets: No asset limit for MSP-only eligibility (effective March 1, 2024; home and savings not counted). For combined MSP and certain MassHealth benefits: $2,000 for single applicants, $3,000 for married couples.[2][3][4][5]
- Massachusetts resident.
- Enrolled in Medicare (Part A and/or B).
- Meet MassHealth immigration criteria.
- For full MassHealth + MSP: Meet rules for MassHealth Standard or CommonHealth if income ≤225% FPL.[1][2][3]

**Benefits:** Pays Medicare premiums (Part A and/or B), deductibles, coinsurance, copays (full for QMB; Part B premium only for SLMB/QI). Includes automatic enrollment in Medicare Part D Extra Help for prescription drugs. Provides Health Safety Net coverage at acute care hospitals and community health centers (CHCs). QMB: Pays all Part A/B costs. SLMB/QI: Part B premium only. Saves up to $3,000/year.[2][4]
- Varies by: priority_tier

**How to apply:**
- Online: MassHealth portal (mass.gov for application).
- Phone: MassHealth Customer Service Center (call for details).
- Mail: MassHealth Enrollment Center (address on application form).
- Download and submit PDF application from mass.gov.[2][5]

**Timeline:** Notice about decision within 30 days.[5]

**Watch out for:**
- No asset test only for MSP-only; assets checked for combined MassHealth benefits.
- Income limits update yearly on March 1—verify current FPL.
- Must be on Medicare; not for MassHealth-only.
- QMB provides more benefits (full cost coverage) than SLMB/QI (premium only)—state assigns tier.
- Do not need MassHealth to qualify for MSP.
- Under 65 on MassHealth Standard: income test applies, no assets.[1][2][3][4]

**Data shape:** Tiered by QMB (full coverage), SLMB/QI (premiums only); no asset test for MSP-only since 2024; income at 225% FPL; scales minimally by household size (single/couple shown); statewide uniform.

**Source:** https://www.mass.gov/info-details/get-help-paying-medicare-costs

---

### Frail Elder Waiver (FEW)


**Eligibility:**
- Age: 60-64 with a disability, or 65 and older[1][2][4][5]+
- Income: Must qualify for MassHealth Standard under 300% of Federal Poverty Level (FPL) or SSI-related limits, approximately under $2,199 per month for an individual (varies annually); special rules like spend-down for medically needy over $2,901/month; spousal income protected[2][4][5][6]
- Assets: Individual: $2,000 maximum; spousal asset allowance: $154,140; certain exemptions apply under MassHealth rules (e.g., primary home may be protected in some cases); special financial rules for waiver participants[4][5][6]
- Meet Nursing Facility Level of Care (NFLOC) via clinical assessment using Comprehensive Data Set (CDS) for ADLs like mobility, toileting, cognitive function[1][2][3][4]
- Live in community setting (own home, family home, congregate housing; not assisted living, group homes, rest homes, or institutions except brief respite)[1]
- Receive at least one FEW service per month to remain eligible[1][4]
- Safely serveable in community with FEW services[1][5]
- Enrolled in MassHealth; not in another HCBS waiver, One Care, or PACE[1]
- Eligible for state home care services via local ASAP[3][4]

**Benefits:** Home and community-based services (HCBS) including home care, respite, adult day health, Alzheimer's/dementia coaching, supportive services by qualified providers (e.g., RN, social workers, OT); supports to avoid nursing home placement; specific services determined by assessment; no fixed dollar/hour amounts stated, varies by need[1][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Access Point (ASAP) for clinical eligibility assessment[1]
- Complete and mail application to local ASAP[1]
- Referral to ASAP (e.g., ESWA, AgeSpan) for home care assessment; then Senior Affordable Care Act (SACA) MassHealth application with Long Term Care supplement (A)[4]
- In-person or phone via local ASAP (e.g., AgeSpan, ASNCM, ESWA)[3][4][6]

**Timeline:** Often 3 months or more[2]
**Waitlist:** Possible, with regional variations; must receive one service monthly to stay eligible[1][4]

**Watch out for:**
- Must receive at least one FEW service monthly or lose eligibility[1][4]
- Cannot live in assisted living, group homes, or rest homes (congregate housing allowed)[1]
- Financial eligibility tied to MassHealth Standard (300% FPL/$2,000 assets); spend-down available but complex[2][4][5]
- No participation in other waivers/One Care/PACE[1]
- Age 60-64 requires proven long-term disability[2][4]
- Spousal protections exist but verify with MassHealth[4][6]

**Data shape:** Tied to MassHealth with 300% SSI/FPL income test and strict $2,000 individual asset limit; regional ASAP delivery with clinical NFLOC assessment required; must use services monthly; spousal asset allowance unique

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants[1]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No strict statewide dollar limits specified; often suitable for extremely low-income (below 300% Federal SSI rate, approximately $2,829/month for individual in 2024, assets under $2,000). MassHealth may cover premium if income/asset guidelines met; some pay monthly share-of-cost premium based on income. Varies by MassHealth eligibility, no fixed table by household size in sources.
- Assets: Often under $2,000 for low-income applicants; MassHealth asset rules apply if seeking premium coverage (details not specified here). No comprehensive exempt/counts list provided.
- Nursing home level of care (nursing facility level of care determination by Massachusetts)
- Ability to live safely in community with PACE services
- Reside in service area of a PACE provider (271 of 351 MA cities/towns)
- 55 years or older

**Benefits:** Comprehensive medical/social services including: adult day care, dentistry/vision, emergency services, home care, hospital care, laboratory/x-ray, meals, medical specialty services, nursing home care (if needed), nutritional counseling, occupational/physical/recreational therapy, prescription drugs, primary care (doctors/nurses), social services/work counseling, transportation. All Medicare/Medicaid-covered services plus more, via Interdisciplinary Team and individualized care plan. No co-pays/out-of-pocket for covered services.
- Varies by: region

**How to apply:**
- Contact local PACE provider (use MassPace zip code directory at masspace.net to find)
- Phone examples: Summit ElderCare 1-877-837-9009; general via MassHealth/Medicare
- In-person at PACE centers
- PACE enrollment specialists assist families

**Timeline:** Not specified in sources
**Waitlist:** Possible regional waitlists (not detailed statewide)

**Watch out for:**
- Not statewide—check zip code for availability; only 271/351 towns covered
- Must qualify for nursing home level care but live safely in community with PACE support
- Not limited to MassHealth/Medicare dually eligible, but premiums/share-of-cost may apply if not
- All services must be via PACE Interdisciplinary Team (except emergencies)
- Regional providers differ; use MassPace directory first
- Often for very low-income/assets, but open to others who can pay premium

**Data shape:** Limited to specific provider service areas (not statewide); no fixed income/asset tables (tied to MassHealth/SSI); multiple regional providers/centers; nursing home cert required despite community focus

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace

---

### Massachusetts Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross annual household income must not exceed 60% of Estimated State Median Income. For 2025-2026 heating season (relevant to applications starting Oct 1, 2025): |Household Size|Gross Annual Income| |1|$51,777| |2|$67,709| |3|$83,641| |4|$99,573| |5|$115,504| |6|$131,436| |7|$134,423| |8|$137,410| |9|$140,397| |10|$143,385| |11|$146,372| |12|$149,360|. Households eligible for Home Energy Assistance Program (HEAP/LIHEAP), TAFDC, or SSI are categorically eligible[1][4][9].
- Assets: No asset limits mentioned in program guidelines[1].
- Households must not have been previously weatherized through this program[2].
- Homeowners eligible; tenants eligible with landlord permission and if they pay their own heating bills (1-4 unit buildings or mobile homes; entire building if >50% units eligible, with landlord agreement not to raise rent or evict for 1 year except good cause, and landlord current on taxes/utilities)[1][2].
- Condominiums with >4 units ineligible[2].

**Benefits:** Free energy efficiency measures averaging $4,725 per eligible household, including air sealing, attic/sidewall/floor insulation, pipe/duct insulation, and limited energy-related repairs. May also access utility-funded programs varying by area[1].
- Varies by: priority_tier

**How to apply:**
- Online starting October 1 through April 30 (HEAP application serves as WAP application): mass.gov (specific portal opens Oct 1, 2025)[1][5].
- In-person or mail at local fuel/energy assistance agency serving your city/town (agency list by town on mass.gov)[1].
- Regional providers: e.g., Community Teamwork (email energyprograms@commteam.org for Bedford/Billerica/etc.), CFC Inc. (call 508-675-2157 or email ee@cfcinc.org for Fall River/Taunton/New Bedford areas), SSCAC (call 508-747-7575 x6240 for Carver/Duxbury/etc.)[2][3][6].

**Timeline:** Not specified; prioritized households contacted if high priority (elderly, disabled, children under 6, high energy users, Native Americans)[1][3][6].
**Waitlist:** Limited funding leads to prioritization system; not all eligible households receive services immediately[1][6].

**Watch out for:**
- Application is via HEAP (Oct 1 - Apr 30); WAP not separate—must apply for fuel assistance first[1][6].
- Priority to elderly/disabled/young children/high energy/Native Americans; limited funds mean not all eligible get services[1][3][6].
- Tenants: strict landlord agreement required (no rent hike/eviction 1 year, taxes paid); >4 unit condos ineligible[2].
- No prior WAP weatherization allowed; homeowners/tenants only with permission[1][2].
- Reapply annually via HEAP[1].

**Data shape:** Tied directly to HEAP/LIHEAP eligibility (60% SMI, categorical via TAFDC/SSI); local agency delivery with town-specific providers and prioritization; income table scales precisely by household size; tenant landlord covenants are a key unique restriction.

**Source:** https://www.mass.gov/info-details/weatherization-assistance-program-wap

---

### SHINE (Serving Health Insurance Needs of Everyone)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits for SHINE counseling itself; available to all Massachusetts residents eligible for Medicare (typically age 65+) or approaching eligibility, including those with limited income for related programs like Medicare Savings Programs (QMB, SLMB, QI), MassHealth, Extra Help/LIS, and Prescription Advantage. Counselors screen for these programs' specific income guidelines, but exact dollar amounts not specified in sources.
- Assets: No asset limits for SHINE; applies to screened programs like Medicare Savings Programs where counselors explain guidelines, but details on countable assets/exemptions not provided.
- Massachusetts resident
- Eligible for Medicare or approaching eligibility
- Includes elders, individuals with disabilities, and caregivers

**Benefits:** Free, unbiased health insurance information, counseling, and assistance covering Medicare Parts A/B/D, Medicare Advantage (HMO/PPO), Medigap, prescription drug plans, MassHealth/Medicaid, Medicare Savings Programs (QMB/SLMB/QI), Extra Help/LIS, Prescription Advantage, retiree plans, and other options for limited resources. Counselors screen eligibility, help with applications/enrollment, compare costs/benefits, and explain timelines. Provided in-person, phone, email, mail, or virtual.

**How to apply:**
- Phone: Call MassOptions at 1-800-243-4636 or local SHINE lead; email SHINE@mass.gov
- In-person: Senior centers, Councils on Aging, Regional Aging Services Access Points, or local providers (e.g., Ethos in Boston at 617-522-9270, Mystic Valley Elder Services at 781-388-4845, Mattapoisett at 508-758-4110)
- Online referral: Some local sites like Mystic Valley Elder Services have referral forms
- Other: Counselors assist with applications for related programs like MassHealth

**Timeline:** SHINE counselor contact/return call typically within 2 business days at some sites; no standard statewide timeline specified.

**Watch out for:**
- Not a direct service or financial benefit program—provides counseling only, not healthcare or payments; people may confuse it with MassHealth/Medicare itself
- Must be Medicare-eligible or approaching (not general elder care); for limited-income programs, separate eligibility applies
- Services free/confidential but relies on volunteers/agency staff—availability varies locally
- Open Enrollment (Oct 15-Dec 7) critical for changes
- Contact local lead for site-specific recruiting/volunteering, not central office

**Data shape:** no income/asset test for counseling; statewide but regionally delivered via local providers and volunteers; focuses on advocacy/eligibility screening for Medicare-related cost-saving programs rather than direct benefits

**Source:** https://www.mass.gov/info-details/serving-the-health-insurance-needs-of-everyone-shine-program

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned across sources; some programs are free with optional donations (e.g., $2 per meal suggested), others may adjust fees based on ability to pay but income not always a factor in eligibility[2][6]
- Assets: No asset limits or details on what counts/exempts mentioned[1][2][5]
- Chronically or temporarily homebound (unable to leave home safely without assistance due to illness, disability, or mobility issues)
- Unable to shop for or prepare at least one nutritious meal per day
- Inadequate family or formal support for meal preparation
- Lack transportation to stores or senior dining sites
- Reside in the program's service/delivery area (varies by local provider)
- May include spouses or dependents regardless of age[5][8]

**Benefits:** Nutritionally balanced home-delivered lunch (at least 1/3 of daily recommended dietary allowance); special diets for conditions like diabetes/heart disease; daily wellness check-in by driver; delivered weekdays (e.g., 5 days/week, 10:30am-2pm); free or donation-based (suggested $2/meal)[1][6][7]
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging (find via https://www.mealsonwheelsamerica.org/find-meals-and-services/ or https://www.massmealsonwheels.org)[3][8]
- Phone examples: Greater Springfield (specific number not listed[1]), AgeSpan (specific number not listed[6]), Boston Elder Info (617) 292-6211 or (617) 477-6606[7]
- In-person assessment by provider staff
- Referral from doctor/social worker may be required by some[3]

**Timeline:** Varies; some within a week, others longer if waitlist exists[2]
**Waitlist:** Possible depending on local program demand[2]

**Watch out for:**
- Not statewide—must confirm residence in specific delivery zone/provider area; outside areas need alternatives[2]
- Homebound status strictly assessed (car ownership or ability to leave home may disqualify)[2]
- Meals only weekdays; no door-left deliveries if not home (must answer door)[7]
- Weather/school closures may cancel deliveries[7]
- Optional fees/donations at some programs despite 'free' label[2][6]

**Data shape:** Decentralized by local providers/regions with varying contacts, zones, and minor eligibility nuances; no uniform state income test or fixed forms; spouse/dependent inclusion regardless of age

**Source:** https://www.massmealsonwheels.org (state coordination); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/[8][3]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually by the U.S. Department of Health and Human Services; contact local SCSEP office for current table as 2026 figures not specified in sources[1][2][3][4].
- Assets: No asset limits mentioned in sources.
- Unemployed
- U.S. citizen or authorized to work
- Enrollment priority: Veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users[2][3][4][5]

**Benefits:** Part-time community service work (average 20 hours/week) at non-profits/public agencies (e.g., schools, hospitals, senior centers, day care); paid highest of federal/state/local minimum wage; on-the-job training (e.g., computer skills); job placement assistance to unsubsidized employment[1][3][4][5][7].
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP provider/office (e.g., Fall River Office: sherilyn.benedetti@cfcinc.org for Bristol/Plymouth/Hampden Counties[2]; CCWORC: 508-860-2241 for Worcester/Franklin Counties[5]; Springfield Dept of Elder Affairs for Hampden/Hampshire Counties[4])
- No central statewide phone/website listed; find local grantee via DOL or NCOA
- In-person at local offices

**Timeline:** Not specified; if eligible and no waitlist, enrolled promptly[1].
**Waitlist:** Possible depending on location and funding; varies by local availability and funding levels (some pauses in 2025)[1].

**Watch out for:**
- Not statewide uniform—must contact county-specific provider; funding flux caused 2025 pauses, check local availability[1]
- Priority selection based on 'most in need' characteristics (veterans first), not all eligible get immediate placement[2][3]
- Temporary bridge program (part-time subsidized work) aimed at unsubsidized jobs, not long-term income support[3][4]
- Income at 125% FPL only—no exact MA 2026 table in sources, verify locally[1][2]

**Data shape:** County-restricted grantees with varying providers; priority tiers determine access; funding-driven waitlists; no asset test or fixed statewide application portal

**Source:** https://www.dol.gov/agencies/eta/seniors[3]

---

### Massachusetts Senior Legal Helpline

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified for the helpline itself. Free attorney representation through referrals may require low-income eligibility (e.g., below 125% of federal poverty level for some civil legal services programs), determined by helpline advocates.[1][2][3]
- Assets: No asset limits mentioned.
- Massachusetts resident
- Civil legal issues only (e.g., social security/SSI, veterans benefits, MassHealth, Medicare, consumer issues, public benefits, unemployment, foreclosures, guardianship, power of attorney, bankruptcy, evictions, landlord/tenant, utilities, family law, nursing home issues)

**Benefits:** Free legal information, advice, and referral services. May assist with application for free attorney (most callers ineligible), referrals to reduced-fee or private attorneys, or provision of links/written materials via text, email, or mail. Covers civil law topics only; no representation by helpline itself.[1][2]

**How to apply:**
- Phone: 800-342-5297 (Mon-Fri 9am-12pm)
- Download brochure/form: https://www.mass.gov/doc/senior-legal-help-line/download

**Timeline:** Immediate phone assistance during hours; attorney eligibility determination and referral handled during call.

**Watch out for:**
- Most callers not eligible for free attorney; helpline provides info/referrals instead.
- Limited to civil law; excludes criminal, medical malpractice, workers’ comp, personal injury (though referrals possible).
- Phone hours only 9am-12pm Mon-Fri; no mention of online application.
- Not full representation—initial screening for other programs.

**Data shape:** no income test for helpline access; age 60+ Massachusetts residents; free info/referrals primary, free attorney rare via referral

**Source:** https://www.mass.gov/doc/senior-legal-help-line/download

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; support is free for all eligible residents.[2][3]
- Assets: No asset limits; support is free for all eligible residents.[2][3]
- Must reside in a nursing home, rest home, or assisted living facility in Massachusetts.[1][2][3][8]

**Benefits:** Investigation and resolution of complaints related to health, safety, welfare, rights; mediation between residents and facilities; protection of resident rights; regular facility visits; education on rights and regulations; assistance with facility selection; support for resident/family councils; advocacy for systemic changes. Complaint categories include abuse/neglect, care, discharge/eviction, autonomy/rights, dietary, environment, and more. Provided by paid staff (41) and certified volunteers (199) who visit facilities routinely (e.g., weekly).[1][3][4][5][7][8]

**How to apply:**
- Phone: 617-222-7495 (statewide main line to connect to local ombudsman).[2][3][6]
- Website: https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program (for regional contacts).[2][4]
- Local/regional offices: Contact via city/town-aligned agency or host site (17 host sites statewide; e.g., LifePath at 413-829-9234, Springwell for 22-town area).[7][8][9]
- Anyone can file a complaint on behalf of a resident (no formal application; call to report issue).[3][6]

**Timeline:** Not specified; ombudsmen respond to complaints and visit facilities regularly (e.g., weekly), aiming for prompt resolution before escalation.[1][3][8]

**Watch out for:**
- Not a regulatory or licensing agency; focuses on advocacy and mediation, not enforcement or fines.[5]
- Services only for those already residing in covered facilities—not for community-dwelling elders or pre-admission help (though some assist with facility selection).[1][5][7]
- Complaints can be anonymous/confidential, but identity may be disclosed if needed for abuse/neglect reporting to authorities.[4][7]
- Families must contact local ombudsman via main line or regional lookup, as no single statewide application.[7]
- Not a substitute for facility grievance process, which facilities must provide.[5]

**Data shape:** no income/asset test; residency in certified facility required; regionally delivered via 17 host sites and local agencies; free advocacy service, not financial aid or direct care

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program

---

### Prescription Advantage

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older (or under 65 if disabled, working 40 hours or fewer per month or not at all, meeting MassHealth CommonHealth disability guidelines)+
- Income: Varies by Medicare eligibility and category (effective January 1, 2026 for Medicare-eligible). No asset limits for general eligibility. Medicare-eligible (65+): Up to 500% FPL (~$78,250 single/$105,750 married for highest category S5). Specific categories (yearly): S0: 0-$21,128 single/0-$28,553 married; S5: $46,951-$78,250 single/$63,451-$105,750 married. Lower categories (e.g., S1 ~$22,590 single). Disabled under 65: Up to ~$22,334 single/$30,118 married. Must apply for MSP if income ≤$35,213 single/$47,588 married; Extra Help if ≤$22,590 single/$30,660 married.
- Assets: No general asset limits. Required applications have limits: MSP (assets N/A); Extra Help ($17,220 single/$34,360 married, excluding home, life insurance, burial plots, personal possessions).
- Massachusetts resident with primary residence in state
- Not receiving MassHealth/CommonHealth prescription drug benefits (some MSP exceptions)
- Medicare-eligible must enroll in primary Medicare Part D, Medicare Advantage with drugs, or creditable coverage
- Must apply for MSP/Extra Help if potentially eligible, or ineligible for Prescription Advantage assistance

**Benefits:** Financial assistance for prescription drugs: premiums, deductibles, copays/coinsurance based on income category (S0-S5). Fills gaps in Medicare/other coverage; primary coverage if not Medicare-eligible. Pays difference after primary coverage. No fixed dollar/hour amount—scales by income and drug costs.
- Varies by: priority_tier

**How to apply:**
- Online: www.prescriptionadvantagema.org
- Phone: 1-800-243-4636 (TTY 711, Mon-Fri 9am-5pm EST)
- Mail: Prescription Advantage, P.O. Box 15153, Worcester, MA 01615-0153
- In-person: Application assistance via customer service phone

**Timeline:** Benefits begin first day of month following complete processing

**Watch out for:**
- Must enroll in primary Medicare Part D/equivalent if Medicare-eligible
- Ineligible if receiving MassHealth/CommonHealth drug benefits (some MSP exceptions)
- Mandatory application for MSP/Extra Help if income qualifies, or lose Prescription Advantage aid
- Open enrollment periods for some; under 65 anytime if eligible; 66+ exceptions for life changes (6 months)
- Income-based premiums/deductibles/copays—not free drug coverage
- Primary residence in MA required

**Data shape:** Tiered by income categories (S0-S5) with premiums/copays; requires coordination with Medicare/MSP/Extra Help; no asset test except for required sub-programs; statewide uniform

**Source:** https://www.prescriptionadvantagema.org/

---

### Home Care Program (HCP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Annual gross income limit of $33,948 ($2,829/month) as of 2024 for non-MassHealth members; updated to less than $2,901/month or $34,812/year in 2025. MassHealth members are financially eligible without separate income test. Limits do not specify variation by household size in available data.
- Assets: No specific asset limits mentioned; financial eligibility primarily tied to MassHealth enrollment or income guidelines.
- Massachusetts resident living at home (not in institutional setting or certified assisted living).
- Under 60 only if diagnosed with early-onset Alzheimer’s or related dementia.
- Functional need: Assessed inability to perform activities of daily living (ADLs) like bathing, dressing, meal preparation, medication management; higher priority for more ADLs needed.
- MassHealth enrollment often required or facilitates eligibility.

**Benefits:** In-home services based on assessed need and income, including homemaker services, personal care assistance, Adult Day Health program, home-delivered meals, transportation, money management. Hours and specific tasks determined by case manager after in-home assessment; cost shared based on income.
- Varies by: priority_tier

**How to apply:**
- Phone: Call MassAbility Home Care Program at 617-204-3853 or MassAbility Connect at 617-204-3665.
- Online: Start an online referral for Home Care Assistance via Mass.gov.
- In-person/in-home: Assessment arranged by case manager after initial eligibility.

**Timeline:** Up to 3-4 months to process application, determine eligibility, and arrange services.
**Waitlist:** May have waitlist depending on funding or open enrollment periods only.

**Watch out for:**
- Financial eligibility often the biggest barrier; many exceed income limits if not MassHealth-enrolled.
- Must live at home, not in assisted living or institutions.
- Priority based on ADL needs; IADL-only (e.g., chores) may not qualify or get lower priority.
- Waitlists or enrollment periods due to funding; other benefits investigated first.
- Services cost-shared based on income, not fully free.

**Data shape:** Eligibility hinges on MassHealth status or strict income caps without household size adjustment; services tiered by functional assessment priority (ADLs over IADLs); funding-driven waitlists common.

**Source:** https://www.mass.gov/info-details/home-care-program

---

### Enhanced Community Options Program (ECOP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: At or below ASAP income guidelines for an individual or couple (specific 2026 dollar amounts not detailed in sources; guidelines vary by household size and are set by Aging Services Access Points (ASAPs))[2][3][4]
- Assets: No strict asset limits specified, but designed for 'middle-income' elders in process of spending down assets to qualify for MassHealth/Frail Elder Waiver; less restrictive resources than nursing home eligibility per CMS guidance[3][4]
- Determined frail and clinically eligible for nursing home placement (nursing facility level of care)
- Ineligible for MassHealth Standard (e.g., not MassHealth Basic or HMO-managed; for those not yet MassHealth-eligible)
- Meets State Home Care Program eligibility criteria
- Recent changes (as of Feb 2026): Higher minimum spend threshold on services for new enrollees[4]

**Benefits:** Intensive in-home supportive services including personal care (e.g., bathing), homemaking, shopping, cleaning, chore, laundry, companion care, adult day care, home-delivered meals, grocery shopping, transportation, personal emergency response systems; maximum 7.5 hours per week of assistance; higher level than standard Home Care Program[3][5][6]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Access Point (ASAP) for intake and assessment (single point of entry; e.g., Springwell for their region)
- Direct referrals to ASAP Intake department
- In-person or in-home comprehensive assessment by ASAP care manager and nurse

**Timeline:** Not specified
**Waitlist:** Statewide enrollment cap at 7,322 slots (reduced from 9,000 in June 2025); new enrollees waitlisted once cap reached, leading to months-long delays; intake remains open for documentation and referrals[3][4]

**Watch out for:**
- Enrollment cap causes waitlists for new applicants, risking health decline and nursing home placement[3][4]
- Ineligible if on MassHealth Basic or HMO-managed (must be community MassHealth Standard or applying via spousal waiver)[2]
- Recent tightening: New enrollees need higher service spend threshold; lower needs directed to basic home care[4]
- Not Medicaid-funded (state-funded); bridges to MassHealth programs like Frail Elder Waiver[3][4][8]
- Existing enrollees protected from cap changes[4]

**Data shape:** Administered via 26 regional ASAPs with statewide cap and waitlist; targets pre-MassHealth frail elders at nursing-home clinical level but asset-ineligible; max 7.5 hrs/week services; recent 2026 eligibility tightening and slot cap

**Source:** https://www.mass.gov (specific ECOP page not directly linked; see Mass.gov elder services summaries)

---

### Home Modification Loan Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household gross annual income must be at or below: 1: $207,800; 2: $237,600; 3: $267,200; 4: $296,800; 5: $320,600; 6: $344,400; 7: $368,200; 8: $391,800. Limits based on HUD median income and updated annually[4][1][9].
- Assets: No asset limits mentioned in program guidelines[6].
- Massachusetts resident[2].
- Homeowner of primary, permanent residence (or landlord with <10 units for tenant at 3% interest)[1][3].
- Household member is frail elder (60+), person with disability, or family with child with disability[1][2][3].
- Modifications must relate to beneficiary's functional limitation, documented by professional with client history (not general home repairs like windows, roof, heating, septic)[1][2][3].
- Verification of paid state income and property taxes[3].

**Benefits:** 0% interest loans up to $50,000 for property owners; up to $30,000 for manufactured/mobile homes. No monthly payments; repayment due on property sale/transfer. Funds specific accessibility modifications: ramps/lifts, kitchen/bathroom adaptations, sensory spaces, fencing, handrails, lighting, doorway widening, flooring, accessory dwelling units/in-law apartments[1][2][4][6][7]. Landlords (<10 units): 3% interest loan for tenant[1][3].
- Varies by: home_type

**How to apply:**
- Phone: Susan Gillam at 1-866-500-5599[7].
- Contact regional provider agencies (e.g., Valley CDC for Hampshire/Hampden Counties[1]; Berkshire Planning for Berkshire County at 413-442-1521 x25 or HMLP@berkshireplanning.org[5]; Way Finders[6]; SMOC[9])[1][3][5].
- Mail: Community Economic Development Assistance Corp., Attn: Susan Gillam, 18 Tremont Street, Suite 500, Boston, MA 02108[2].

**Timeline:** Not specified; applications reviewed by regional providers[3].

**Watch out for:**
- Not a general home repair program; modifications must specifically address disability/elder functional needs, documented by professional[1][2][3].
- Excludes window, roof, heating, septic repairs[2].
- Repayment required upon property sale/transfer[1][7].
- Landlord loans at 3% interest (not 0%) and limited to <10 units[1][3].
- Must apply through regional providers, not centrally[3][4].
- No credit checks, but income/tax verification required[6][3].

**Data shape:** Statewide with regional providers handling applications; income limits scale by household size; loan amounts vary by home type (standard vs. mobile); strictly accessibility-focused, not repairs.

**Source:** https://www.mass.gov/home-modification-loan-program-hmlp

---

### Senior Care Options (SCO)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No specific dollar amounts or household size table listed for SCO directly; eligibility requires qualification for MassHealth Standard, which has asset limits but income details vary and are not SCO-specific in sources. MassHealth Standard for long-term care typically assesses income post-eligibility[1][2][3].
- Assets: MassHealth Standard requires no more than $2,000 in countable assets for individuals (excluding primary house, one car, personal belongings). For married couples, assets are divided equally, with the community spouse allowed up to $109,560 in assets (figure from older source, may be outdated) and $2,739 monthly income. SCO inherits these MassHealth rules; a 60-month look-back period applies for asset transfers if entering via certain paths like Frail Elder Waiver[2][3].
- Eligible for MassHealth Standard
- Medicare Parts A and B (required as of January 1, 2026; previously not always required but qualify for Part D)[1][6]
- Live at home or in a long-term care facility (not inpatient in chronic/rehab hospital or intermediate care facility for intellectual disabilities)[1][2]
- Not subject to six-month MassHealth deductible period[1]
- Live in a SCO service area (excludes Dukes and Nantucket Counties; parts of Hampshire, Berkshire, Franklin may have limited coverage)[2][4][5][6]
- No end-stage renal disease[2][5]
- Functional need: Assistance with at least one ADL (e.g., bathing, dressing, eating, toileting, transferring, mobility) for long-term care services; NFLOC (Nursing Facility Level of Care) required via Frail Elder Waiver[2][3]

**Benefits:** Integrates MassHealth and Medicare into one plan with one card and care team; covers medical care, mental health, prescription drugs (via Medicare Part D), specialized geriatric support services (e.g., via Geriatric Support Services Coordinators/social workers), care coordination to manage health and prevent nursing home placement. No or low premiums/copays/out-of-pocket costs for most services; additional perks like YMCA membership in some plans[6][7][8].
- Varies by: region

**How to apply:**
- Contact local Aging Service Access Point (ASAP) for referral[3][5]
- Contact SCO plan directly (e.g., Tufts Health Plan, Commonwealth Care Alliance, NaviCare, Senior Whole Health, UnitedHealthcare; 5 SCOs total)[5]
- Send enrollment form to MassHealth[5]
- No additional application beyond MassHealth eligibility; SCO coordinates after referral[5]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by region/plan

**Watch out for:**
- Must enroll in Medicare Parts A/B by Jan 1, 2026 to keep coverage[6]
- Not available in all areas (e.g., islands, some western counties)[2][5]
- Requires MassHealth Standard first; asset look-back (60 months) for transfers if via Frail Elder Waiver[2]
- Functional ADL need required for long-term services; dementia alone insufficient[2]
- Voluntary enrollment; can disenroll anytime, but uses single card only for SCO[4][5]
- No other comprehensive insurance allowed[4]

**Data shape:** Delivered via 5 regional SCO plans with overlapping but not fully statewide coverage; inherits MassHealth Standard financial/functional rules with Medicare integration; eligibility tightening for Medicare requirement in 2026; varies significantly by plan service area and provider

**Source:** https://www.mass.gov/senior-care-options

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MassHealth Medicare Savings Program | benefit | federal | deep |
| Frail Elder Waiver (FEW) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Massachusetts Weatherization Assistance  | benefit | federal | deep |
| SHINE (Serving Health Insurance Needs of | resource | state | simple |
| Meals on Wheels | benefit | federal | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Massachusetts Senior Legal Helpline | navigator | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Prescription Advantage | benefit | state | medium |
| Home Care Program (HCP) | benefit | state | deep |
| Enhanced Community Options Program (ECOP | benefit | state | deep |
| Home Modification Loan Program | benefit | state | deep |
| Senior Care Options (SCO) | benefit | local | deep |

**Types:** {"benefit":10,"resource":2,"employment":1,"navigator":1}
**Scopes:** {"federal":5,"state":7,"local":2}
**Complexity:** {"deep":9,"simple":3,"medium":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **region**: 3 programs
- **not_applicable**: 3 programs
- **home_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MassHealth Medicare Savings Program**: Tiered by QMB (full coverage), SLMB/QI (premiums only); no asset test for MSP-only since 2024; income at 225% FPL; scales minimally by household size (single/couple shown); statewide uniform.
- **Frail Elder Waiver (FEW)**: Tied to MassHealth with 300% SSI/FPL income test and strict $2,000 individual asset limit; regional ASAP delivery with clinical NFLOC assessment required; must use services monthly; spousal asset allowance unique
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific provider service areas (not statewide); no fixed income/asset tables (tied to MassHealth/SSI); multiple regional providers/centers; nursing home cert required despite community focus
- **Massachusetts Weatherization Assistance Program (WAP)**: Tied directly to HEAP/LIHEAP eligibility (60% SMI, categorical via TAFDC/SSI); local agency delivery with town-specific providers and prioritization; income table scales precisely by household size; tenant landlord covenants are a key unique restriction.
- **SHINE (Serving Health Insurance Needs of Everyone)**: no income/asset test for counseling; statewide but regionally delivered via local providers and volunteers; focuses on advocacy/eligibility screening for Medicare-related cost-saving programs rather than direct benefits
- **Meals on Wheels**: Decentralized by local providers/regions with varying contacts, zones, and minor eligibility nuances; no uniform state income test or fixed forms; spouse/dependent inclusion regardless of age
- **Senior Community Service Employment Program (SCSEP)**: County-restricted grantees with varying providers; priority tiers determine access; funding-driven waitlists; no asset test or fixed statewide application portal
- **Massachusetts Senior Legal Helpline**: no income test for helpline access; age 60+ Massachusetts residents; free info/referrals primary, free attorney rare via referral
- **Long-Term Care Ombudsman Program**: no income/asset test; residency in certified facility required; regionally delivered via 17 host sites and local agencies; free advocacy service, not financial aid or direct care
- **Prescription Advantage**: Tiered by income categories (S0-S5) with premiums/copays; requires coordination with Medicare/MSP/Extra Help; no asset test except for required sub-programs; statewide uniform
- **Home Care Program (HCP)**: Eligibility hinges on MassHealth status or strict income caps without household size adjustment; services tiered by functional assessment priority (ADLs over IADLs); funding-driven waitlists common.
- **Enhanced Community Options Program (ECOP)**: Administered via 26 regional ASAPs with statewide cap and waitlist; targets pre-MassHealth frail elders at nursing-home clinical level but asset-ineligible; max 7.5 hrs/week services; recent 2026 eligibility tightening and slot cap
- **Home Modification Loan Program**: Statewide with regional providers handling applications; income limits scale by household size; loan amounts vary by home type (standard vs. mobile); strictly accessibility-focused, not repairs.
- **Senior Care Options (SCO)**: Delivered via 5 regional SCO plans with overlapping but not fully statewide coverage; inherits MassHealth Standard financial/functional rules with Medicare integration; eligibility tightening for Medicare requirement in 2026; varies significantly by plan service area and provider

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Massachusetts?
