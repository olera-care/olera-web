# District of Columbia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.010 (2 calls, 18s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | ? |
| Programs deep-dived | 6 |
| New (not in our data) | 6 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 5 programs
- **financial**: 1 programs

## New Programs (Not in Our Data)

- **Elderly and Persons with Physical Disabilities (EPD) Waiver Program** — service ([source](https://dacl.dc.gov/service/epd-waiver))
  - Shape notes: Income at 300% SSI (updates annually, no household table); fixed $4,000 individual asset limit with home equity cap; services tiered by assessed NFLOC level; waitlisted with statewide first-come processing
- **Qualified Medicare Beneficiaries (QMB) Program** — financial ([source](https://dhcf.dc.gov/service/qualified-Medicare-beneficiary-qmb))
  - Shape notes: DC-specific: 300% FPL income threshold (higher than federal), no asset limits, uniform statewide administration, integrates with Full Duals/QMB Plus for broader benefits
- **DC State Health Insurance Assistance Program (SHIP)** — service ([source](https://dacl.dc.gov/service/health-insurance-counseling))
  - Shape notes: no income or asset test; counseling-only service for Medicare beneficiaries; single centralized DC provider via DACL with phone/email/in-person access
- **DACL Senior Wellness Centers** — service ([source](https://dacl.dc.gov/service/senior-centers))
  - Shape notes: Ward-specific centers with direct sign-up, no income/asset test, open to age 60+ DC residents; separate from stricter EPD Waiver program
- **Legal Services for Seniors** — service ([source](https://dacl.dc.gov/service/legal-services-seniors[1]))
  - Shape notes: No income/asset tests specified; age/residency-based with needs priority; delivered via specific DC providers/hotlines under OAA framework[1][2][3]
- **Community Transition Program** — service ([source](https://dacl.dc.gov/sites/default/files/dc/sites/dacl/service_content/attachments/Community%20Transition%20Flyer.pdf[1]))
  - Shape notes: Sparse official details; flyer cuts off key info like full eligibility and services. Administered by DACL (likely Department on Aging and Community Living). No income/asset tests explicitly stated, distinguishing from means-tested programs[1]

## Program Details

### Elderly and Persons with Physical Disabilities (EPD) Waiver Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 18-64 with physical disability[1][2][3]+
- Income: Countable income must not exceed 300% of SSI (e.g., $2,743/month in 2023, $2,382/month in 2021, $2,130/month in 2013) or meet Medicaid spend-down; no household size table specified, applies to individual[2][3][5]
- Assets: $4,000 countable assets for individual (e.g., checking/savings/investments); home equity ≤$1,130,000 in 2026 if living in home or intent to return (exempt if spouse or dependent child in home); exemptions include primary home under equity limit, spouse/dependent child home occupancy[1][2][3][4]
- DC resident
- US citizen or qualified immigrant
- Nursing Facility Level of Care (NFLOC) via interRAI Home Care Assessment (≥9 points on ADLs, cognition, behavior)
- DC Medicaid provider-completed Prescription Order Form (POF) signed by physician/APRN
- Liberty Healthcare face-to-face assessment for level of need
- Live in home, family home, or assisted living (no room/board coverage)

**Benefits:** Long-term care services/supports in home or assisted living to avoid nursing home: personal care aide, adult day health, home health aide, Services My Way (family/friend paid caregiving); specific hours/dollars not fixed, based on assessed level of need[2][3][4][7]
- Varies by: priority_tier

**How to apply:**
- Contact Aging and Disability Resource Center (ADRC) via dacl.dc.gov/service/epd-waiver or Department of Aging and Community Living (DACL) Medicaid Enrollment Services Unit (MES)
- Phone: 1-800-677-1116 (Elder Locator) or local Department of Aging[7]
- In-person: ADRC or DACL offices

**Timeline:** ESA determines eligibility within 45 calendar days after complete application submission[3]
**Waitlist:** Currently has a waiting list on first-come, first-served basis[5]

**Watch out for:**
- Must be Medicaid-eligible (or become so via spend-down), but apply for waiver first[7]
- POF must be fully completed by DC Medicaid provider; incomplete forms delay processing[3]
- NFLOC not automatic (e.g., dementia diagnosis alone insufficient; needs ≥9 points on assessment)[1]
- Home equity limit applies ($1,130,000 in 2026); countable assets strictly $4,000[1][4]
- Waitlist is first-come, first-served; no priority bypassing mentioned[5]
- No room/board in assisted living; services only[4]

**Data shape:** Income at 300% SSI (updates annually, no household table); fixed $4,000 individual asset limit with home equity cap; services tiered by assessed NFLOC level; waitlisted with statewide first-come processing

**Source:** https://dacl.dc.gov/service/epd-waiver

---

### Qualified Medicare Beneficiaries (QMB) Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: In the District of Columbia, eligibility requires household income up to 300% of the Federal Poverty Level (FPL) plus a $20 disregard. For 2026 (approximate based on available data): 1-person household: $3,990 + $20 = $4,010 monthly; 2-person household: $5,410 + $20 = $5,430 monthly. Limits scale by household size per FPL tables, with DC applying higher threshold than federal standard[1][2].
- Assets: DC does not impose asset limits for QMB eligibility, aligning with states that eliminated resource tests[1][4].
- Entitled to Medicare Part A or Part B (or both)
- District of Columbia resident
- U.S. citizen or eligible immigration status

**Benefits:** Pays Medicare Part A and Part B premiums, deductibles, coinsurance, and copayments for covered services. Also provides Extra Help for Medicare Part D, limiting prescription costs to a few dollars each. Providers cannot bill QMB enrollees for Medicare cost-sharing; payments are considered full[1][2][5][6][7].

**How to apply:**
- Phone: 202-727-8370 (DC State Health Insurance Assistance Program/SHIP) or contact DHCF
- Email: [email protected]
- Website: https://dhcf.dc.gov/service/qualified-Medicare-beneficiary-qmb
- In-person or mail: Contact DC Department of Health Care Finance (DHCF) for locations and addresses

**Timeline:** Not specified in sources; automatic enrollment required in DC starting October 1, 2024, for eligible individuals[4].

**Watch out for:**
- DC uses higher 300% FPL limit vs. federal 100% FPL standard, but confirm current FPL figures as they update annually[1][2]
- No asset test in DC, unlike many states[4]
- QMB Plus (Full Duals) provides full Medicaid + Medicare help; distinguish from QMB-only[1][9]
- Providers cannot bill you for Medicare cost-sharing, even if out-of-state[6]
- Must already have Medicare Part A; automatic enrollment may apply post-2024[3][4]

**Data shape:** DC-specific: 300% FPL income threshold (higher than federal), no asset limits, uniform statewide administration, integrates with Full Duals/QMB Plus for broader benefits

**Source:** https://dhcf.dc.gov/service/qualified-Medicare-beneficiary-qmb

---

### DC State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries, families, and caregivers[1][3]
- Assets: No asset limits or tests apply[1]
- Must be a Medicare beneficiary, family member, or caregiver living in the District of Columbia[1][3]

**Benefits:** Free one-on-one personalized health insurance counseling, education, and assistance on Medicare (Parts A, B, C, D), Medigap, Medicaid, Medicare Savings Programs, Extra Help/Low Income Subsidy, federal retiree benefits, durable medical equipment, billing issues; group educational presentations, outreach at community events, and Senior Medicare Patrol services to prevent fraud[1][3][4]

**How to apply:**
- Phone: (202) 727-8370[2][4][5]
- Email: ship.dacl@dc.gov[2][4][5]
- Website: https://dacl.dc.gov/service/health-insurance-counseling[2][3]
- In-person: DC Dept. of Aging and Community Living, 250 E Street SW, Washington DC 20024 (hours 9:00 am - 5:00 pm)[2][4]

**Timeline:** No formal application or processing time; services provided directly upon contact[1][3][4]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling and education, no direct payments or medical services; services are unbiased and do not sell plans; prioritizes limited-income and dually eligible but open to all; increasing demand may affect availability despite no waitlist[1][3][6]

**Data shape:** no income or asset test; counseling-only service for Medicare beneficiaries; single centralized DC provider via DACL with phone/email/in-person access

**Source:** https://dacl.dc.gov/service/health-insurance-counseling

---

### DACL Senior Wellness Centers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits identified; open to DC residents age 60+ without mention of financial thresholds in program descriptions[3][5][6]
- Assets: No asset limits specified for Senior Wellness Centers[3][5][6]
- District of Columbia resident[3][5][6]

**Benefits:** Comprehensive programs promoting health and wellness, including health activities, social activities, nutrition services, trips, and events; typically available Monday-Friday 8:00 AM-5:00 PM (varies slightly by center); programming offered virtually and in-person[3][5]
- Varies by: region

**How to apply:**
- Contact specific center directly by phone to sign up for activities and trips (e.g., Bernice Fonteneau: (202) 727-0338; Model Cities: (202) 635-1900; Hayes: (202) 727-0357; Congress Heights: (202) 563-7225); Call DACL Information and Referral Assistance (I&R/A) line for general intake and screening; Visit centers in-person or check event calendars on center websites[2][5]

**Timeline:** No formal processing time; direct sign-up for activities, no enrollment or re-certification required for trips and programs[2]
**Waitlist:** No waitlist mentioned; expansions at some centers (e.g., Model Cities, Congress Heights) to increase capacity[2][3]

**Watch out for:**
- Not a Medicaid waiver program (confused with EPD Waiver which has strict income <$2,382/mo, assets <$4,000, age 65+ or disabled); no formal eligibility screening or income test—direct center contact; availability limited to specific wards/centers, not citywide; primarily drop-in wellness/social, not medical care or home assistance[1][3][5][6]
- Expansions ongoing at select centers may affect capacity[2][3]

**Data shape:** Ward-specific centers with direct sign-up, no income/asset test, open to age 60+ DC residents; separate from stricter EPD Waiver program

**Source:** https://dacl.dc.gov/service/senior-centers

---

### Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits stated for AARP Legal Counsel for the Elderly (LCE) or DACL program; prioritizes those with economic or social needs. Related programs like Legal Aid DC use 200-300% of Federal Poverty Guidelines, but not explicitly tied here[1][2][4].
- Assets: No asset limits mentioned in sources[1][2].
- Must be DC resident
- For LCE Legal Hotline: DC residents 60+ or 55+ with Social Security/SSI disability issues[2]
- Targeted to older individuals with economic or social needs per OAA guidelines[3]

**Benefits:** Free legal advice, assistance, referrals, and representation by attorneys/paralegals in: victims of abuse, medical bills, advocacy, public benefits (SS/SSI/SSDI, Medicaid, Medicare, veterans benefits), drafting wills, conservatorship/guardianship, housing/eviction/foreclosure, long-term care access, elder abuse/financial exploitation, tenant advocacy, notary services[1][2][3].

**How to apply:**
- Phone: AARP LCE (202) 434-2120[1][2]
- Phone: DACL/DC Office on Aging (202) 724-5626 or TTY 711[1]
- Website: AARP LCE https://www.aarp.org/legal-counsel-for-elderly/[1][2]
- LCE Legal Hotline for advice/referrals/intake[2]
- DC Resource Bridge referral: 202-933-HELP[4][5]

**Timeline:** Not specified; LCE hotline provides quick access to advice/referrals/intake[2].

**Watch out for:**
- No explicit income/asset dollar limits for core LCE/DACL services, unlike some related programs (e.g., Legal Aid DC at 200-300% FPG)[4]; eligibility focuses on age, residency, and needs[1][2][3]
- Services via hotline or specific providers; may need referral through DC Resource Bridge for broader help[4][5]
- Targeted representation not guaranteed for all issues; often advice/referrals first[2]

**Data shape:** No income/asset tests specified; age/residency-based with needs priority; delivered via specific DC providers/hotlines under OAA framework[1][2][3]

**Source:** https://dacl.dc.gov/service/legal-services-seniors[1]

---

### Community Transition Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 and older, or 18 and older with a disability[1]+
- Income: No specific income limits stated in program materials; must have current DC Long-Term (likely Long-Term Care) services[1]
- Assets: No asset limits specified[1]
- District of Columbia resident[1]
- Have current DC Long-Term (incomplete in source, likely Long-Term Care services or Medicaid enrollment)[1]

**Benefits:** Supports transition from institutional settings to community living (specific services not detailed in available sources)[1]

**Timeline:** No information available

**Watch out for:**
- Limited public details available; eligibility tied to 'current DC Long-Term' which is truncated in sources—likely requires prior Long-Term Care enrollment or assessment[1]
- May overlap with Medicaid waivers or DBH transition services for mental health, but distinct program under DACL[2]
- Not the same as school-based CTP or other transitional programs[4]

**Data shape:** Sparse official details; flyer cuts off key info like full eligibility and services. Administered by DACL (likely Department on Aging and Community Living). No income/asset tests explicitly stated, distinguishing from means-tested programs[1]

**Source:** https://dacl.dc.gov/sites/default/files/dc/sites/dacl/service_content/attachments/Community%20Transition%20Flyer.pdf[1]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Elderly and Persons with Physical Disabi | benefit | state | deep |
| Qualified Medicare Beneficiaries (QMB) P | benefit | federal | medium |
| DC State Health Insurance Assistance Pro | resource | federal | simple |
| DACL Senior Wellness Centers | benefit | local | medium |
| Legal Services for Seniors | resource | state | simple |
| Community Transition Program | benefit | state | medium |

**Types:** {"benefit":4,"resource":2}
**Scopes:** {"state":3,"federal":2,"local":1}
**Complexity:** {"deep":1,"medium":3,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/DC/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 1 programs
- **not_applicable**: 4 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Elderly and Persons with Physical Disabilities (EPD) Waiver Program**: Income at 300% SSI (updates annually, no household table); fixed $4,000 individual asset limit with home equity cap; services tiered by assessed NFLOC level; waitlisted with statewide first-come processing
- **Qualified Medicare Beneficiaries (QMB) Program**: DC-specific: 300% FPL income threshold (higher than federal), no asset limits, uniform statewide administration, integrates with Full Duals/QMB Plus for broader benefits
- **DC State Health Insurance Assistance Program (SHIP)**: no income or asset test; counseling-only service for Medicare beneficiaries; single centralized DC provider via DACL with phone/email/in-person access
- **DACL Senior Wellness Centers**: Ward-specific centers with direct sign-up, no income/asset test, open to age 60+ DC residents; separate from stricter EPD Waiver program
- **Legal Services for Seniors**: No income/asset tests specified; age/residency-based with needs priority; delivered via specific DC providers/hotlines under OAA framework[1][2][3]
- **Community Transition Program**: Sparse official details; flyer cuts off key info like full eligibility and services. Administered by DACL (likely Department on Aging and Community Living). No income/asset tests explicitly stated, distinguishing from means-tested programs[1]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in District of Columbia?
