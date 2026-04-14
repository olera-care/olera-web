# Virginia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 3.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 5 |
| New (not in our data) | 3 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 4 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Commonwealth Coordinated Care Plus (CCC+) Waiver

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) including: Respite (480 hours per State fiscal year, July 1-June 30); Environmental Modifications (EM, up to $5,000 per individual per calendar year); Assistive Technology (AT, up to $5,000 per individual per calendar year); Private Duty Nursing (up to 112 hours per week); Transition Services (up to $5,000 per individual per lifetime). Other supports for older adults, physical disabilities, chronic illness; enrolled in managed care receive transition supports. Waiver reimbursement rates on DMAS site.[2][3]` ([source](https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/[2]`

### Virginia Insurance Counseling and Assistance Program (VICAP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, unbiased, confidential one-on-one counseling and group workshops. No dollar limits specified; services include plan comparison, enrollment assistance, appeals support, and fraud prevention education.` ([source](https://dars.virginia.gov/aging/home-community/medicare-counseling/))
- **source_url**: Ours says `MISSING` → Source says `https://dars.virginia.gov/aging/home-community/medicare-counseling/`

## New Programs (Not in Our Data)

- **Virginia Adult Services Program** — service ([source](https://www.dss.virginia.gov/adults.cgi))
  - Shape notes: Administered locally by 120+ DSS offices with state oversight; no fixed statewide income/asset test; services scale by assessed need/priority and local funding; provider approvals vary by locality
- **SeniorNavigator** — service ([source](https://www.virginianavigator.org/))
  - Shape notes: Resource directory with drill-down details on 27,000+ programs; varies by locality with no direct eligibility test for the tool itself; public-private nonprofit partnership unique in using technology for customized local searches[1]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dars.virginia.gov/aging/senior-employment-program/))
  - Shape notes: Federally-authorized (Older Americans Act) but regionally-administered by grantees like DARS; income at 125% FPL by household size (annual update); priority tiers; no asset test; availability/waitlists vary by local provider and funding

## Program Details

### Commonwealth Coordinated Care Plus (CCC+) Waiver


**Eligibility:**
- Income: Must meet Virginia Medicaid financial eligibility (income and assets). No specific dollar amounts or household size table provided in sources; spousal impoverishment protections apply where only the applicant spouse's income is counted toward eligibility, and income can be transferred to the non-applicant spouse as a Spousal Income Allowance. Use Virginia Medicaid Eligibility Test for details.[1]
- Assets: Must meet Virginia Medicaid financial eligibility (income and assets). No specific dollar amounts provided; spousal protections apply.[1]
- Virginia resident.
- Aged 65+ or under 65 and disabled (physical disability, chronically ill, or severely impaired with loss of vital body function).[1][2]
- Nursing Facility Level of Care (NFLOC) determined by Virginia Uniform Assessment Instrument (UAI), assessing Activities of Daily Living (ADLs) like transferring, mobility, bathing, toileting, eating; living situation, physical health, behavioral issues (e.g., for dementia); or Hospital Level of Care requiring medical device (e.g., ventilator) and ongoing skilled nursing to prevent death/disability.[1][2][3]
- Medicaid eligible.[2]
- At imminent risk of nursing facility placement without waiver services.[3]

**Benefits:** Home and Community-Based Services (HCBS) including: Respite (480 hours per State fiscal year, July 1-June 30); Environmental Modifications (EM, up to $5,000 per individual per calendar year); Assistive Technology (AT, up to $5,000 per individual per calendar year); Private Duty Nursing (up to 112 hours per week); Transition Services (up to $5,000 per individual per lifetime). Other supports for older adults, physical disabilities, chronic illness; enrolled in managed care receive transition supports. Waiver reimbursement rates on DMAS site.[2][3]
- Varies by: priority_tier

**How to apply:**
- Request LTSS Screening through local Department of Social Services (DSS); Community Based Screening Team (social worker and health dept. nurse) assesses need.[2]
- If hospitalized, screening by discharge planner.[2]
- Medicaid application: Online at CommonHelp.virginia.gov; phone Cover Virginia Call Center 1-833-522-5582 (TDD 1-888-221-1590); local DSS for paper application and Appendix D for long-term services.[2]
- Post-approval: Choose services; screening team assists with local providers.[2]

**Timeline:** Not specified in sources.
**Waitlist:** No current waiting list.[5]

**Watch out for:**
- Must meet Medicaid financial eligibility first; applying over limits leads to denial.[1]
- Dementia diagnosis alone does not qualify; must meet NFLOC via UAI.[1]
- Services more limited than DD waivers; can use CCC+ while on DD waitlist.[5][6]
- Must be at imminent risk of NF placement.[3]

**Data shape:** No waitlist unlike some waivers; eligibility ties to Medicaid with NFLOC via UAI tool; services have hard caps (e.g., 480 respite hours/year, 112 nursing hours/week); screenings always local via DSS/health depts.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/[2]

---

### Virginia Adult Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older for Adult Protective Services; 18+ for incapacitated adults; no strict age for general homemaker/chore services but targeted at elderly/disabled adults[2][7]+
- Income: No specific statewide income limits stated for Adult Services Program; financial eligibility assessed locally and may tie to Medicaid thresholds like $2,982/month for single applicants in related long-term care programs (2026 figures). Varies by service and local department; no table provided for household sizes[1][4]
- Assets: No specific asset limits stated for Adult Services Program; related Medicaid programs limit singles to $2,000 (exempt: primary home equity up to $603,000, one vehicle, personal belongings, furniture)[1][3]
- Virginia resident
- Functional need (e.g., dependent in ADLs/IADLs like meal prep, housekeeping, money management)
- Risk of abuse/neglect/exploitation or need for protective services
- No citizenship or residency duration requirement
- Anyone may apply; equal treatment regardless of race, color, religion, sex, national origin, or handicap[4][7]

**Benefits:** Homemaker services, chore/companionship (up to 15 hours/week in some areas like Companion Services), screenings for assisted living/nursing home/home-based care/adult day care/waiver services, Adult Protective Services (APS) including health/housing/social/legal arrangements to prevent mistreatment, adult day centers for health/social support[2][6][7]
- Varies by: priority_tier|region

**How to apply:**
- In-person or mail via local Department of Social Services (DSS) office (e.g., King George County sample form)
- Phone: local DSS or state hotline (specific number not listed; contact local office)
- Assistance available to complete application on request[4][6]

**Timeline:** Eligibility decision within 45 days; services begin within 45 days if eligible[4]
**Waitlist:** Depends on available funds/services; optional services subject to availability[4]

**Watch out for:**
- Not Medicaid (separate financial eligibility); services optional and funding-limited
- Must report changes within 10 days or risk prosecution for inaccurate info
- Targeted at at-risk elderly/disabled; anyone can apply but priority for protective needs
- Local variations in providers/hours; no guaranteed hours statewide[2][4][7]

**Data shape:** Administered locally by 120+ DSS offices with state oversight; no fixed statewide income/asset test; services scale by assessed need/priority and local funding; provider approvals vary by locality

**Source:** https://www.dss.virginia.gov/adults.cgi

---

### Virginia Insurance Counseling and Assistance Program (VICAP)


**Eligibility:**
- Income: Not specified in available sources. VICAP serves 'any beneficiary, including those with disabilities and younger than 65,' suggesting no strict age or income cutoff for counseling services themselves.
- Must be a Medicare beneficiary or soon-to-be eligible for Medicare
- Families, friends, and caregivers of Medicare beneficiaries can also access services

**Benefits:** Free, unbiased, confidential one-on-one counseling and group workshops. No dollar limits specified; services include plan comparison, enrollment assistance, appeals support, and fraud prevention education.

**How to apply:**
- Phone: (800) 552-3402 (statewide toll-free)
- Regional phone numbers: (703) 324-5851 (Fairfax County area), (540) 635-7141 (other regions)
- Email: Pamela.smith@dars.virginia.gov
- In-person: Contact your local Area Agency on Aging
- Mail: Alexandria DCHS-Aging and Adult Services Division, Attn: VICAP, 4850 Mark Center Dr. 9th Floor, Alexandria, VA 22311 (for Alexandria residents; other regions have different addresses)
- Web: https://www.vda.virginia.gov

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- VICAP counselors cannot sell insurance — they provide unbiased guidance only. Do not expect them to push any particular plan.
- You must contact your local Area Agency on Aging to access VICAP services; there is no direct walk-in service at the main DARS office.
- Medicare Annual Open Enrollment Period is October 15 to December 7 each year; changes made during this period are effective January 1 of the following year. Outside this window, plan changes are limited.
- VICAP serves not just seniors but 'any beneficiary, including those with disabilities and younger than 65,' meaning younger disabled Medicare beneficiaries qualify.
- The program is free and confidential — there are no hidden fees or sales pitches.
- Counselors are trained and certified specifically for Medicare counseling; they are not general financial advisors.
- If you have both Medicare and Medicaid, you may qualify for special Dual Eligible Special Needs Plans (D-SNPs) — VICAP counselors can help identify these.

**Data shape:** VICAP is a service-based counseling program, not a financial assistance program. There are no income limits, asset limits, or benefit dollar amounts because the program provides education and guidance, not direct payments. Eligibility is based on Medicare status, not financial need. The program is delivered through a network of local Area Agencies on Aging, so access points vary by county. The key distinction is that VICAP counselors do not sell insurance and cannot receive commissions, ensuring unbiased advice. Services are entirely free. Processing time and waitlist information are not publicly documented, suggesting either no significant delays or that this information is managed locally by each Area Agency on Aging.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dars.virginia.gov/aging/home-community/medicare-counseling/

---

### SeniorNavigator

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits; it is a resource directory, not a direct benefits program with financial thresholds[1][3].
- Assets: No asset limits; not applicable as this is an informational tool[1][3].
- Open to older adults, people with disabilities, veterans, families, and caregivers in Virginia; no formal eligibility to use the directory[1][3]

**Benefits:** Online searchable database of over 27,000 programs covering health, housing, transportation, employment, financial planning, technology, and more; includes eligibility criteria, intake processes, costs, fact sheets, articles, books, videos, and 'Ask an Expert' for personalized advice; specialized portals for seniors, disabilities, veterans, and caregivers[1].
- Varies by: region

**How to apply:**
- Online: virginianavigator.org and specialized sites (e.g., for seniors, disabilities, veterans, caregivers); search by topic and city/county[1][3]

**Timeline:** Immediate access to directory; no formal application processing[1].

**Watch out for:**
- Not a direct service or benefits program—it's a navigator tool to find and compare other programs' eligibility, applications, and costs; users must follow through on listed services separately, which may have their own waitlists or requirements[1][3]
- Over 1 million annual visits indicate high usage, but success depends on acting on referrals[1]

**Data shape:** Resource directory with drill-down details on 27,000+ programs; varies by locality with no direct eligibility test for the tool itself; public-private nonprofit partnership unique in using technology for customized local searches[1]

**Source:** https://www.virginianavigator.org/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of federal poverty level. Example for Northern Virginia (2023 figures): Family of 1: $16,988; 2: $22,888; 3: $28,788; 4: $34,688; 5: $40,588; add $5,900 per additional person. Figures adjust annually with federal poverty guidelines[3][1][2].
- Assets: No asset limits mentioned; eligibility based on income, not assets. Supplemental benefits like SSI/SSDI not counted toward income, but regular Social Security is[3].
- Unemployed (any hours worked disqualifies)[3][4]
- Resident of program service area (varies by provider)[1][3][4]
- Authorized to work in the US[1]
- Low employment prospects and need job skills training[6]

**Benefits:** Part-time paid community service job training up to 29 hours/week (average 20 hours/week) at nonprofit/public sites (e.g., senior centers, libraries, schools, hospitals). Roles include clerical work, teacher's aide, librarian assistant, childcare, customer service, maintenance. Paid highest of federal/state/local minimum wage stipend. Training in job skills, computer use. Bridge to unsubsidized permanent employment[4][5][7].
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP provider: e.g., Northern Virginia - call Virginia Judd at 571-363-7688 or email (via vcwnorthern.com/scsep/)[4]
- DARS statewide: Visit dars.virginia.gov/aging/senior-employment-program/[7]
- Span Center (Richmond area): Call (804) 343-3000 for Senior Employment Services[8]
- Find local office via national grantees or DOL site; complete enrollment packet in-person or by phone[2][3]

**Timeline:** Not specified; if eligible and no waitlist, enrolled promptly[2]
**Waitlist:** Possible waitlist depending on local availability; apply now to get on file as positions fluctuate[2]

**Watch out for:**
- Must be fully unemployed; any paid hours disqualifies[3][4]
- Income at 125% FPL (not 100%); regular Social Security counts, but SSI/SSDI does not[1][2][3]
- Priority service for veterans, 65+, disabled, rural, homeless, low literacy—not guaranteed slot[3][5]
- Temporary training only (up to 29 hrs/wk); goal is unsubsidized job exit[4][5][7]
- Regional providers only; must live in their coverage area[1][4]

**Data shape:** Federally-authorized (Older Americans Act) but regionally-administered by grantees like DARS; income at 125% FPL by household size (annual update); priority tiers; no asset test; availability/waitlists vary by local provider and funding

**Source:** https://dars.virginia.gov/aging/senior-employment-program/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Commonwealth Coordinated Care Plus (CCC+ | benefit | state | deep |
| Virginia Adult Services Program | benefit | state | deep |
| Virginia Insurance Counseling and Assist | resource | state | simple |
| SeniorNavigator | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |

**Types:** {"benefit":3,"resource":1,"employment":1}
**Scopes:** {"state":4,"federal":1}
**Complexity:** {"deep":3,"simple":1,"medium":1}

## Content Drafts

Generated 5 page drafts. Review in admin dashboard or `data/pipeline/VA/drafts.json`.

- **Commonwealth Coordinated Care Plus (CCC+) Waiver** (benefit) — 2 content sections, 6 FAQs
- **Virginia Adult Services Program** (benefit) — 3 content sections, 6 FAQs
- **Virginia Insurance Counseling and Assistance Program (VICAP)** (resource) — 2 content sections, 6 FAQs
- **SeniorNavigator** (benefit) — 1 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Commonwealth Coordinated Care Plus (CCC+) Waiver**: No waitlist unlike some waivers; eligibility ties to Medicaid with NFLOC via UAI tool; services have hard caps (e.g., 480 respite hours/year, 112 nursing hours/week); screenings always local via DSS/health depts.
- **Virginia Adult Services Program**: Administered locally by 120+ DSS offices with state oversight; no fixed statewide income/asset test; services scale by assessed need/priority and local funding; provider approvals vary by locality
- **Virginia Insurance Counseling and Assistance Program (VICAP)**: VICAP is a service-based counseling program, not a financial assistance program. There are no income limits, asset limits, or benefit dollar amounts because the program provides education and guidance, not direct payments. Eligibility is based on Medicare status, not financial need. The program is delivered through a network of local Area Agencies on Aging, so access points vary by county. The key distinction is that VICAP counselors do not sell insurance and cannot receive commissions, ensuring unbiased advice. Services are entirely free. Processing time and waitlist information are not publicly documented, suggesting either no significant delays or that this information is managed locally by each Area Agency on Aging.
- **SeniorNavigator**: Resource directory with drill-down details on 27,000+ programs; varies by locality with no direct eligibility test for the tool itself; public-private nonprofit partnership unique in using technology for customized local searches[1]
- **Senior Community Service Employment Program (SCSEP)**: Federally-authorized (Older Americans Act) but regionally-administered by grantees like DARS; income at 125% FPL by household size (annual update); priority tiers; no asset test; availability/waitlists vary by local provider and funding

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Virginia?
