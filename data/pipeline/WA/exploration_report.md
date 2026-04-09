# Washington Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 29s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 5 |
| New (not in our data) | 4 |
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

- **financial**: 2 programs
- **financial|in_kind|service**: 1 programs
- **financial + service referral**: 1 programs
- **service**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Tailored Supports for Older Adults (TSOA)

- **income_limit**: Ours says `$2901` → Source says `$3,868` ([source](https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Supports for unpaid family caregivers/older adults: housekeeping/errands, support groups/counseling, specialized medical equipment/supplies, respite care, training, adult day health/care, caregiving info/resources. No cost to recipient; assigned case manager authorizes monthly[3][6][7].` ([source](https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615))
- **source_url**: Ours says `MISSING` → Source says `https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615`

## New Programs (Not in Our Data)

- **Charity Care for Low-Income Seniors** — financial ([source](https://www.washingtonlawhelp.org/en/guide-charity-care (consumer guide); state law via WA DOH: RCW 70.41 & WAC 246-453 (not direct URL in results).))
  - Shape notes: Hospital-specific with tiered income bands by group (Group 1/2); no senior-specific rules or central application; benefits tied to bill amounts, not fixed services/dollars; statewide mandate but massive provider variation.
- **Housing and Essential Needs (HEN) Referral Program** — financial|in_kind|service ([source](https://app.leg.wa.gov/rcw/default.aspx?cite=74.04.805 (RCW 74.04.805); https://www.law.cornell.edu/regulations/washington/WAC-388-400-0070 (WAC 388-400-0070)))
  - Shape notes: Referral-based only (must get DSHS approval first); services via local providers with funding/capacity variations by county; tied to ABD-like incapacity/income tests; 12-month cap with reviews.
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program** — financial + service referral ([source](https://www.law.cornell.edu/regulations/washington/WAC-388-400-0060 (Washington Administrative Code § 388-400-0060)))
  - Shape notes: Benefits scale by household size (individual vs. married couple). Program is statewide but administered through DSHS with HEN referrals processed through CCS offices. This is a state-funded interim program designed to bridge applicants to federal SSI; it has strict income/resource limits and excludes those already receiving SSI or TANF. Search results do not provide specific dollar amounts for income/asset limits, processing timelines, or complete application procedures — families must contact DSHS directly or use Washington Connection for current, detailed information.
- **WA Cares Fund** — financial ([source](https://esd.wa.gov/ (Employment Security Department; specific WA Cares pages referenced indirectly)))
  - Shape notes: Insurance-style program funded by payroll premiums ($0.58/$100 earnings); eligibility via work/contribution history only—no income/asset tests; multiple vesting pathways including partial for pre-1968 births; exemptions critically affect access.

## Program Details

### Charity Care for Low-Income Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Income: Varies by hospital group and not specific to seniors (applies to all ages). Group 1 hospitals: free care at ≤300% FPL (federal poverty level, adjusted for family size); 75% discount at 301-350% FPL. Group 2 hospitals: free care at ≤200% FPL; 75% discount at 201-250% FPL. Some hospitals extend to 400% FPL. Exact dollar amounts depend on annual FPL guidelines (e.g., for 2026, check current HHS FPL table; no fixed table in sources as it adjusts yearly). Must exhaust third-party coverage like insurance or Medicaid (unless obviously ineligible).
- Assets: For discount tiers (e.g., 301-350% FPL in Group 1), discounts may be reduced based on certain assets (details hospital-specific; not applied for free care tiers). Overlake Hospital does not consider assets for ≤300% FPL.
- Patient or guarantor must be uninsured, self-pay, underinsured, or have high medical costs after insurance.
- Received services at a qualifying hospital (all acute care under RCW 70.41 and psychiatric under RCW 71.12).
- No requirement to apply for other programs if obviously/categorically ineligible or denied in prior 12 months.

**Benefits:** Free care (100% write-off of patient responsibility portion of hospital charges) for lowest income tiers; 75-80% discount on patient responsibility for higher tiers. Covers hospital services (inpatient, outpatient, emergency); exact services per hospital policy (e.g., eligible hospital services only). No fixed dollar amounts or hours—scales to bill amount.
- Varies by: priority_tier

**How to apply:**
- In-person or during hospital admission/discharge: request Charity Care application from hospital financial assistance staff.
- Phone: contact specific hospital's Financial Assistance Coordinator (e.g., Kaiser/Group Health: 1-888-901-4636).
- Mail or after discharge: submit application to hospital business office (no central statewide form; hospital-specific).
- No statewide online portal; apply directly at hospital where services received.

**Timeline:** Hospital-specific; initial determination can be immediate (prima facie for obvious cases); full review varies (e.g., approved within collection process). No statewide timeline.

**Watch out for:**
- Not a central program—must apply separately at each hospital; rules differ (e.g., Group 1 more generous than Group 2).
- Only covers hospital charges (patient responsibility after insurance); not doctor fees, non-hospital care, or ongoing services.
- No age requirement—open to all low-income, but seniors may need to confirm Medicaid denial first.
- Unlimited application window post-discharge, but apply early to avoid collections.
- Hospitals must screen at admission, but families must request application proactively.
- FPL adjusts yearly; verify current levels.

**Data shape:** Hospital-specific with tiered income bands by group (Group 1/2); no senior-specific rules or central application; benefits tied to bill amounts, not fixed services/dollars; statewide mandate but massive provider variation.

**Source:** https://www.washingtonlawhelp.org/en/guide-charity-care (consumer guide); state law via WA DOH: RCW 70.41 & WAC 246-453 (not direct URL in results).

---

### Housing and Essential Needs (HEN) Referral Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Countable income at or below monthly limits in WAC 388-478-0090 (varies by assistance unit size; specific dollar amounts not listed in sources but tied to ABD cash assistance standards in chapter 388-450 WAC). Must be in financial need per income rules in chapter 388-450 WAC.[1]
- Assets: Countable resources not in excess of limits in RCW 74.04.005 and chapter 388-470 WAC (specific amounts not detailed; excludes federal aid eligibility other than basic food and medical assistance).[1][3]
- Apply for cash assistance (WAC 388-406-0010) and complete DSHS interview.
- Incapacitated (unable to work, per WAC 388-447-0001 through 388-447-0100; at least 90 days due to physical/mental incapacity).[1][2]
- Not in public correctional facility or custody.[1]
- Citizenship/qualified alien status (WAC 388-424-0015).[1][3]
- Social Security number verification (WAC 388-476-0005).[1][3]
- Washington residency (WAC 388-468-0005).[1]
- Verification of circumstances (WAC 388-490-0005).[1]
- Not receiving TANF or SSI (though ABD recipients now eligible per recent law change).[2][5]
- Often requires homelessness or housing instability (self-attestation possible).[2][4]
- DSHS determines eligibility for referral; provider determines service eligibility.[4]

**Benefits:** Rent and utility assistance (if homeless/at risk); essential needs items (e.g., hygiene bags); transportation assistance; rapid rehousing/homeless prevention (duration up to 12 months or as long as DSHS eligible; no fixed dollar/hour amounts specified).[2][4][5][6][7][8]
- Varies by: priority_tier|region

**How to apply:**
- Visit nearest DSHS Community Services Office.
- Apply online at www.washingtonconnection.org.
- Phone: 1-877-501-2233 (general inquiries); 206-328-5755 (King County HEN Resource Line, Mon-Fri 9am-2:30pm).[2][5][8]
- Request DSHS evaluation for HEN referral; if approved, provider contacts for intake.

**Timeline:** Not specified.
**Waitlist:** Regional waitlists exist (e.g., King County rent interest list; no new rent/utility for new clients as of source date).[8]

**Watch out for:**
- It's a DSHS referral program; DSHS approves referral, but local provider determines actual service eligibility/funding.[1][4]
- 12-month limit typical, even if incapacity lasts longer; DSHS reviews after 12 months for ABD eligibility.[3][7]
- Referrals expire if not acted on; must report changes and stay in contact.[1][2]
- ABD recipients now eligible in addition to cash benefits (recent change).[5]
- Not for those in correctional facilities or receiving TANF/SSI.[1][2]
- Regional capacity limits (e.g., no new rent clients in some areas).[8]
- Pregnant women assistance recipients eligible for 24 months if otherwise qualified.[3]

**Data shape:** Referral-based only (must get DSHS approval first); services via local providers with funding/capacity variations by county; tied to ABD-like incapacity/income tests; 12-month cap with reviews.

**Source:** https://app.leg.wa.gov/rcw/default.aspx?cite=74.04.805 (RCW 74.04.805); https://www.law.cornell.edu/regulations/washington/WAC-388-400-0070 (WAC 388-400-0070)

---

### Aged, Blind, or Disabled (ABD) Cash Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18 years or older (with exceptions: under 18 only if member of a married couple)[1]+
- Income: Monthly countable income must be at or below limits defined in WAC 388-478-0090[1]. Search results do not provide the specific dollar amounts for these limits. You must consult WAC 388-478-0090 or contact DSHS directly for current thresholds by household size.[1]
- Assets: Must meet resource requirements defined in chapters 388-450, 388-470, and 388-488 WAC[1]. Specific asset limits and exemptions are not detailed in available search results; contact DSHS for current thresholds.
- Must be: (i) at least 65 years old; (ii) blind as defined by Social Security Administration; or (iii) likely to be disabled as defined in WAC 388-449-0001 through 388-449-0100[1]
- Disability must be expected to last 12 months or more and not be primarily due to substance abuse disorder[3]
- Must be in financial need according to ABD cash income and resource rules[1]
- Must meet citizenship and alien status requirements under WAC 388-424-0015[1]
- Must provide a Social Security number[1]
- Must reside in the state of Washington[1]
- Must sign an interim assistance reimbursement authorization agreeing to repay benefits if subsequently duplicated by SSI[1]
- Cannot currently receive SSI[3]
- Cannot be eligible for or already receiving TANF (Temporary Assistance for Needy Families)[3]

**Benefits:** $450/month for individuals; $570/month for married couples[2][3]. Additionally, recipients receive a referral to the Housing and Essential Needs (HEN) program[1][3] and assignment of a facilitator to help apply for SSI[3]
- Varies by: household_size

**How to apply:**
- Online: Washington Connection (specific URL not provided in search results; contact DSHS for access)
- Phone: Contact DSHS (specific phone number not provided in search results)
- In-person: DSHS office locations (specific addresses not provided in search results)
- Mail: DSHS (specific mailing address not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- ABD is an interim benefit designed to help people while they pursue SSI — it is not a permanent program[3]
- If you receive SSI, you are NOT eligible for ABD[3]
- If you qualify for TANF, you should pursue TANF instead, as it offers higher benefits[3]
- You must sign an interim assistance reimbursement authorization, meaning you agree to repay ABD benefits if SSI later duplicates them[1]
- Disability must be expected to last at least 12 months and cannot be primarily due to substance abuse disorder — this is a strict requirement[3]
- If you contact HEN before receiving an ABD referral from DSHS, you will be redirected to apply for ABD first[3]
- Medical verification of disability is required; your doctor must confirm your condition and limitations[2]

**Data shape:** Benefits scale by household size (individual vs. married couple). Program is statewide but administered through DSHS with HEN referrals processed through CCS offices. This is a state-funded interim program designed to bridge applicants to federal SSI; it has strict income/resource limits and excludes those already receiving SSI or TANF. Search results do not provide specific dollar amounts for income/asset limits, processing timelines, or complete application procedures — families must contact DSHS directly or use Washington Connection for current, detailed information.

**Source:** https://www.law.cornell.edu/regulations/washington/WAC-388-400-0060 (Washington Administrative Code § 388-400-0060)

---

### Tailored Supports for Older Adults (TSOA)


**Eligibility:**
- Age: 55+
- Income: Care recipient income limit is $3,868/month in 2025 (spouse income not counted; each spouse assessed individually if both apply). Conflicting figures in sources: $2,349 (possibly outdated) or $3,868/month[1][4].
- Assets: Countable resources up to $77,052 if single, $145,353 if married (some sources cite $53,100 single/$111,175 married or program-specific limits under WAC 182-513-1640). Exempt: primary home (if applicant lives there, intends to return, spouse/dependent lives there), car, personal items[1][3][4].
- Washington state resident
- Nursing Facility Level of Care (NFLOC) via CARE assessment tool (daily nursing or assistance with 3+ ADLs like mobility, eating, toileting, bathing, transferring, meds; or extensive help with 2)
- Live at home (not residential/institutional)
- Eligible unpaid caregiver (18+) or meet criteria without one (WAC 388-106-1910)
- U.S. citizen, national, qualifying American Indian, or qualified alien (5-year bar met/exempt)
- Valid SSN
- Not enrolled in full Washington Apple Health (Medicaid) programs (limited enrollment ok)

**Benefits:** Supports for unpaid family caregivers/older adults: housekeeping/errands, support groups/counseling, specialized medical equipment/supplies, respite care, training, adult day health/care, caregiving info/resources. No cost to recipient; assigned case manager authorizes monthly[3][6][7].
- Varies by: priority_tier

**How to apply:**
- Online via Washington Apple Health application (under Long Term Services and Supports banner)
- Local DSHS office (in-person)
- Phone: contact local Area Agency on Aging or DSHS (no central number specified)
- Paper: mail to DSHS (ask for help)

**Timeline:** Services can begin right away depending on provider availability[3].
**Waitlist:** Possible due to provider availability; varies regionally[3].

**Watch out for:**
- Pre-Medicaid program: no estate recovery risk, but excludes those on full Medicaid (use MAC instead if Medicaid-eligible)[3][4]
- Spouse income not counted, but no spousal maintenance allowance (unlike COPES)[1]
- Must live at home; NFLOC required (not just general aging needs)
- Conflicting income/asset figures across sources—verify current with DSHS
- Services via approved providers only; case manager controls monthly authorizations[3]

**Data shape:** Income/assets assessed on care recipient only (spouse excluded); requires unpaid caregiver or specific no-caregiver criteria; tiered by NFLOC; statewide but provider/waitlist varies regionally; non-Medicaid alternative

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615

---

### WA Cares Fund

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No income limits; eligibility based on work history and contributions, not income or assets.
- Assets: No asset limits or tests; program functions as insurance funded by payroll premiums without means-testing.
- Reside in Washington state or have elected to keep coverage after relocating out-of-state.
- Worked at least 500 hours per year in Washington.
- Met one of these contribution pathways: (1) Total of 10 years (no more than 5 consecutive years break); or (2) 3 of the last 6 years at time of application; or (3) For those born before Jan 1, 1968, partial benefits at 10% per year worked.
- Have qualifying long-term care health needs (specific needs not detailed in sources).
- Not holding an active permanent exemption (e.g., veteran with 70%+ service-connected disability); conditional exemptions (e.g., out-of-state resident, military spouse, nonimmigrant visa) pause contributions but may affect vesting.

**Benefits:** Full benefit amount available under lifetime or early access pathways (exact dollar amount, hours, or service details not specified in sources); partial benefits for near-retirees born before Jan 1, 1968 (10% of full amount per year worked). Provides cash benefits for long-term care services.
- Varies by: contribution_pathway

**How to apply:**
- Contact Employment Security Department (ESD) for benefits application (specific phone/website not in sources; exemptions via ESD webpage).
- Exemptions: Apply through ESD’s Exemptions webpage (details at esd.wa.gov assumed from context).

**Timeline:** Not specified in sources.

**Watch out for:**
- Permanent exemptions (e.g., 70%+ veteran disability) make you ineligible for benefits unless rescinded.
- Conditional exemptions pause contributions and may prevent vesting if not managed (must notify ESD within 90 days if status changes).
- Must have worked 500 hours/year and meet exact contribution pathways; breaks over 5 years reset 10-year clock.
- Benefits start Jan 1, 2025; near-retirees get only partial (pro-rated) benefits.
- Not traditional welfare—insurance model; no opt-in if exempt or non-contributor.
- Qualifying health needs required but undefined in sources.

**Data shape:** Insurance-style program funded by payroll premiums ($0.58/$100 earnings); eligibility via work/contribution history only—no income/asset tests; multiple vesting pathways including partial for pre-1968 births; exemptions critically affect access.

**Source:** https://esd.wa.gov/ (Employment Security Department; specific WA Cares pages referenced indirectly)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Charity Care for Low-Income Seniors | resource | state | simple |
| Housing and Essential Needs (HEN) Referr | benefit | state | medium |
| Aged, Blind, or Disabled (ABD) Cash Assi | benefit | state | deep |
| Tailored Supports for Older Adults (TSOA | resource | state | simple |
| WA Cares Fund | benefit | state | medium |

**Types:** {"resource":2,"benefit":3}
**Scopes:** {"state":5}
**Complexity:** {"simple":2,"medium":2,"deep":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/WA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **priority_tier|region**: 1 programs
- **household_size**: 1 programs
- **contribution_pathway**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Charity Care for Low-Income Seniors**: Hospital-specific with tiered income bands by group (Group 1/2); no senior-specific rules or central application; benefits tied to bill amounts, not fixed services/dollars; statewide mandate but massive provider variation.
- **Housing and Essential Needs (HEN) Referral Program**: Referral-based only (must get DSHS approval first); services via local providers with funding/capacity variations by county; tied to ABD-like incapacity/income tests; 12-month cap with reviews.
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program**: Benefits scale by household size (individual vs. married couple). Program is statewide but administered through DSHS with HEN referrals processed through CCS offices. This is a state-funded interim program designed to bridge applicants to federal SSI; it has strict income/resource limits and excludes those already receiving SSI or TANF. Search results do not provide specific dollar amounts for income/asset limits, processing timelines, or complete application procedures — families must contact DSHS directly or use Washington Connection for current, detailed information.
- **Tailored Supports for Older Adults (TSOA)**: Income/assets assessed on care recipient only (spouse excluded); requires unpaid caregiver or specific no-caregiver criteria; tiered by NFLOC; statewide but provider/waitlist varies regionally; non-Medicaid alternative
- **WA Cares Fund**: Insurance-style program funded by payroll premiums ($0.58/$100 earnings); eligibility via work/contribution history only—no income/asset tests; multiple vesting pathways including partial for pre-1968 births; exemptions critically affect access.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Washington?
