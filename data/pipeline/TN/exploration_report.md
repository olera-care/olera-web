# Tennessee Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 1.1m)

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

- **advocacy**: 1 programs
- **service**: 4 programs

## Data Discrepancies

Our data differs from what official sources say:

### TennCare CHOICES

- **min_age**: Ours says `65` → Source says `65+ OR 21+ with physical disability` ([source](TennCare official website (specific URL not provided in search results; contact through local Area Agency on Aging and Disability or nursing facility)))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Program covers long-term services and supports in nursing home, assisted living facility, or in-home care[2]. Specific service hours, dollar amounts, or benefit tiers are not detailed in available sources.` ([source](TennCare official website (specific URL not provided in search results; contact through local Area Agency on Aging and Disability or nursing facility)))
- **source_url**: Ours says `MISSING` → Source says `TennCare official website (specific URL not provided in search results; contact through local Area Agency on Aging and Disability or nursing facility)`

## New Programs (Not in Our Data)

- **Senior Advocate Program** — advocacy ([source](No single primary .gov URL identified; related info at tn.gov/disability-and-aging[7]))
  - Shape notes: Highly regional via 9 AAADs and local senior centers; no uniform eligibility/income test; only 3 dedicated programs in state; grassroots focus on assistance gaps rather than fixed benefits
- **OPTIONS Program** — service ([source](https://www.ftaaad.org/options (FTAAAD) or regional AAA sites; statewide intake via 1-866-836-6678[3][6]))
  - Shape notes: No income/asset test but ADL-based functional need and cost-share fees; slot-limited with regional agency administration; often paired/confused with Title III-B[3][6]
- **Single Point of Entry (SPOE)** — service ([source](https://www.tn.gov/tenncare.html (TennCare LTSS/CHOICES); regional AAAD sites))
  - Shape notes: Regional AAADs as SPOE providers; eligibility tied to CHOICES tiers (Groups 1/2/3) with NF LOC and Medicaid financial test; no fixed income/asset dollar tables in sources (linked to SSI-FBR/institutional Medicaid)
- **Aging Nutrition Program** — service ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/aging-nutrition-program.html[6]))
  - Shape notes: Statewide via 13 regional AAADs with local intake/assessment; no fixed income test, priority-based for home delivery; contributions voluntary for congregate

## Program Details

### Senior Advocate Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific statewide income limits identified; local programs like McMinn Senior Activity Center target economically disadvantaged older adults who do not qualify for other assistance due to financial reasons or age restrictions[5]. Legal Assistance for the Elderly requires age 60+ with no income test mentioned[3][8].
- Assets: No asset limits specified in search results for this program[1][3][5].
- Must be 60 years or older[3][5][8]
- Personally contact program office to request help (may be waived in emergencies)[3]
- Priority for cases involving imminent harm or death[3]
- Economically disadvantaged or falling into assistance 'gap' for local programs like Senior Safe at Home[5]

**Benefits:** Dedicated staff help navigating red tape, accessing food, home repairs, safety assistance via Senior Safe at Home (up to 25% of unmet financial needs in gap areas); legal assistance and referrals for those 60+; partnerships with housing, VA, AARP, SHIP, Social Security[3][5][8]
- Varies by: region

**How to apply:**
- Phone for East TN Legal Assistance: (865) 691-2551 ext 4212 or ext 4216[3]
- Email: bbowers@ethra.org or abradley@ethra.org[3]
- In-person/mail donations to ETHRA, 9111 Cross Park Drive Ste. D-100, Knoxville, TN 37923 (indicates contact point)[3]
- Contact local senior centers like McMinn Senior Activity Center in Athens, TN for grassroots advocacy[5]
- Statewide toll-free numbers via Area Agencies on Aging and Disability (AAADs) for related services[7]

**Timeline:** Priority cases given immediate attention; others first-come, first-served as capacity allows[3]
**Waitlist:** Yes, when caseload maxed; option to join waitlist or get referrals[3]

**Watch out for:**
- Not a formal statewide program with uniform rules—mostly local senior center or AAAD initiatives; people may miss that it's one of only 3 dedicated programs in TN; capacity limits lead to waitlists; must personally request services[3][5]
- Confused with professional senior advocate careers or other programs like CHOICES/TennCare which have strict income/asset limits ($2,901/mo individual in 2025, $2,000 assets)[2]
- Priority for emergencies; non-urgent on waitlist[3]

**Data shape:** Highly regional via 9 AAADs and local senior centers; no uniform eligibility/income test; only 3 dedicated programs in state; grassroots focus on assistance gaps rather than fixed benefits

**Source:** No single primary .gov URL identified; related info at tn.gov/disability-and-aging[7]

---

### OPTIONS Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income eligibility requirement. Sliding fee scale applies if income exceeds Federal Poverty Guidelines; cost share required based on income level[3][6][8].
- Assets: No asset limits mentioned[3][6].
- Tennessee resident[6][8]
- Needs assistance with at least 3 Activities of Daily Living (ADLs) or Instrumental Activities of Daily Living (IADLs), such as housekeeping, shopping, bathing, walking without assistance[6][8]
- General qualifications must be met; determined via intake assessment[5][6]

**Benefits:** Homemaker services, personal care, assistance with bathing, light housekeeping, home-delivered meals, case management[3][6]. Specific hours or amounts not fixed; based on assessment needs.

**How to apply:**
- Phone: Call intake line at 1-866-836-6678[3][5][6]
- Prepare intake form in advance (downloadable from Area Agency on Aging websites like ETHRA)[6]

**Timeline:** Intake screening by phone; if eligible and slot available, case manager contacts for in-home assessment to set up services[6]. No specific timeline stated.
**Waitlist:** Depends on slot availability; may be turned away if no slots[6].

**Watch out for:**
- No income limit but sliding fee/cost share if over Federal Poverty Guidelines—many assume it's free[3][6]
- Requires at least 3 ADLs/IADLs deficits; functional assessment determines eligibility[6][8]
- Slot availability limits access; waitlists or denials common if full[6]
- Separate from Medicaid-funded CHOICES program (which has strict income/asset limits and nursing home level of care)[1][2]
- State-funded (Options) vs. federally funded Title III-B (similar services, slightly different eligibility)[3]

**Data shape:** No income/asset test but ADL-based functional need and cost-share fees; slot-limited with regional agency administration; often paired/confused with Title III-B[3][6]

**Source:** https://www.ftaaad.org/options (FTAAAD) or regional AAA sites; statewide intake via 1-866-836-6678[3][6]

---

### TennCare CHOICES


**Eligibility:**
- Age: 65+ OR 21+ with physical disability+
- Income: {"description":"Gross income limit is $2,901/month as of January 1, 2025[3]. When both spouses are applicants, each spouse is allowed income up to $2,901/month individually[1]. If gross income exceeds $2,901/month, applicant must establish a Qualified Income Trust (QIT) to qualify[3]. Minimum income allowance for non-applicant spouse is $2,643.75/month (effective 7/1/25–6/30/26), allowing applicant spouse to supplement non-applicant spouse's income up to this threshold[1].","note":"QIT must be established within the month of application[3]"}
- Assets: {"countable_assets":"For married couples: assets must be between $31,584.00 and $157,920.00 as of January 1, 2025[3]. If total assets are $22,000 or less, applicant is under the floor and spend-down may not be required[3].","home_exemption":"Home is exempt (non-countable) if: (1) applicant lives in home or has intent to return AND home equity interest does not exceed $730,000 in 2025[1]; (2) applicant's spouse lives in home[1]; (3) applicant has child under 21 living in home[1]; or (4) applicant has blind or disabled child of any age living in home[1]. Home equity = current home value minus outstanding mortgage[1]."}
- Must be Tennessee resident[4]
- Must meet medical criteria: require Nursing Facility Level of Care (NFLOC) or be 'at risk' of needing this level of care[1]
- Must pass Pre-Admission Evaluation (PAE) with minimum score of 9 out of 26 points[3]
- PAE assesses Activities of Daily Living (ADLs): ability to transfer, mobility, eating, toileting, communication, medication administration, behaviors, and orientation[3]
- For CHOICES Group 3 (home/community care): must be receiving SSI (Supplemental Security Income) payments from Social Security Administration[5]

**Benefits:** Program covers long-term services and supports in nursing home, assisted living facility, or in-home care[2]. Specific service hours, dollar amounts, or benefit tiers are not detailed in available sources.
- Varies by: location_of_care (nursing home vs. assisted living vs. home-based)

**How to apply:**
- In-person at nursing facility (if already in facility, staff may approach applicant)[2]
- In-person at local Area Agency on Aging and Disability (conducts PAE if not in nursing facility)[2]
- Pre-application: can apply before entering nursing home or facility[2]

**Timeline:** TennCare has 90 days to process application; they attempt to complete within 45 days[2]. Cannot file for delay until 90 days has passed[2].
**Waitlist:** Employment and Community First CHOICES (separate I/DD program) has limited annual funding with referral list; not everyone who applies can enroll immediately[6]. No waitlist information provided for standard CHOICES program.

**Watch out for:**
- PAE score is the most critical factor—if applicant does not meet minimum 9 out of 26 points, income and asset totals do not matter[3]
- Qualified Income Trust (QIT) must be established within the month of application if gross income exceeds $2,901/month; missing this deadline can jeopardize eligibility[3]
- Home equity limit is $730,000 (as of 2025); homes exceeding this value may not qualify for exemption[1]
- Spend-down process requires spending excess resources to qualify; case workers may request detailed documentation and clarification[2]
- Short response timelines from TennCare for additional information requests; delays in responding can slow processing[2]
- CHOICES Group 3 (home/community care) requires SSI payments—not all disabled individuals qualify[5]
- Employment and Community First CHOICES (for I/DD) is a separate program with limited funding and referral list; standard CHOICES is for elderly and physically disabled[6]

**Data shape:** TennCare CHOICES has three distinct groups with different care settings and requirements (nursing facility vs. home/community). Income and asset limits are fixed statewide as of specific effective dates (January 1, 2025 for income/assets; July 1, 2025 for minimum income allowance). Medical eligibility (PAE score) is the primary gating factor. Home exemption has specific equity thresholds. Processing involves both medical evaluation (PAE) and financial review (spend-down). Application routes vary by current location (facility vs. community). No specific dollar amounts for benefits provided in available sources—program appears to cover costs of services rather than providing direct payments.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** TennCare official website (specific URL not provided in search results; contact through local Area Agency on Aging and Disability or nursing facility)

---

### Single Point of Entry (SPOE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Tied to Medicaid institutional eligibility: 300% of SSI Federal Benefit Rate (SSI-FBR) for institutional categories; SSI cash recipients qualify for CHOICES Group 3 without additional income test beyond SSI. Exact dollar amounts not specified in sources (vary annually with SSI-FBR). No household size table provided; assessed via Medicaid/TennCare financial approval.
- Assets: Medicaid resource limits apply (standard for institutional care: typically $2,000 for individual, but relies on SSA determination for SSI recipients). Specific countable/exempt assets not detailed; standard Medicaid rules presumed (e.g., primary home often exempt up to equity limits).
- Nursing facility level of care (NF LOC) via approved Pre-Admission Evaluation (PAE) for CHOICES Groups 1 & 2.
- Financially qualify for Medicaid LTSS (TennCare reimbursement).
- For CHOICES Group 3: 'At risk' of NF LOC and receiving SSI payments.
- For NF services: Completed PASRR process if applicable, admitted to NF.

**Benefits:** Access to CHOICES program Home and Community-Based Services (HCBS) and/or Nursing Facility (NF) services for elderly (65+) and adults 21+ with physical disabilities. Specific services include long-term services and supports (LTSS) like personal care, homemaker services, adult day care (exact hours/dollars not specified; based on approved PAE and enrollment). Also information/referral to non-Medicaid aging/disability programs.
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free 1-866-836-6678 (statewide AAAD SPOE line); local example (731) 668-6967.
- In-person: Local Area Agency on Aging and Disability (AAAD) offices by development district.
- TennCare Medicaid application required for financial eligibility (details via TennCare).

**Timeline:** Not specified in sources.
**Waitlist:** CHOICES has enrollment caps; waitlists possible for Groups 1/2 (not detailed).

**Watch out for:**
- SPOE is entry point to CHOICES LTSS, not direct benefits; requires separate Medicaid financial approval and PAE.
- Must meet NF level of care; Group 3 limited to SSI 'at risk' individuals.
- Not for intellectual/developmental disabilities (separate processes); PASRR required for certain conditions.
- Enrollment caps may cause waitlists; SSI recipients handled differently.
- NF services don't always require SPOE if not seeking Medicaid HCBS.

**Data shape:** Regional AAADs as SPOE providers; eligibility tied to CHOICES tiers (Groups 1/2/3) with NF LOC and Medicaid financial test; no fixed income/asset dollar tables in sources (linked to SSI-FBR/institutional Medicaid)

**Source:** https://www.tn.gov/tenncare.html (TennCare LTSS/CHOICES); regional AAAD sites

---

### Aging Nutrition Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific statewide income limits stated; contributions suggested but not required for congregate meals. Home-delivered meals assessed via intake by local AAAD case manager. Note: Separate CSFP (sometimes referenced) limited to 150% FPL in Davidson, Dyer, Shelby Counties only[2][4][6].
- Assets: No asset limits mentioned[6].
- Must be 60+ for primary eligibility; spouses (any age) and sometimes disabled under 60 in senior housing eligible for congregate meals[3][6][8]
- Home-delivered: Homebound, ill/incapacitated, unable to prepare meals or access from others (assessed via intake)[3][6][9]
- Available in all 95 counties via local AAAD[6]

**Benefits:** Congregate meals (1 nutritionally balanced meal weekdays at 150+ sites, plus socialization, nutrition education/counseling); home-delivered meals (noontime meal meeting 1/3 RDA, with volunteer safety check/visit) for qualified homebound[5][6][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free 1-866-836-6678 to contact local Area Agency on Aging and Disability (AAAD)[5][6]
- Find congregate sites via AAAD or tn.gov link (no direct URL specified)[6]
- Local AAAD for intake assessment (in-person possible via sites)[6]

**Timeline:** Not specified
**Waitlist:** Not mentioned; advance reservations required at congregate sites[5]

**Watch out for:**
- Not an entitlement; home-delivered requires case manager assessment and may have priority for highest need (e.g., homebound/greatest need)[6][9]
- Congregate often free/suggested donation only, but not guaranteed daily[5][8]
- Confused with county-limited CSFP (food boxes, 150% FPL, only Davidson/Dyer/Shelby)[2][4]
- SNAP outreach offered but separate application[6]
- Meals weekdays only, holidays excluded; advance reservations needed[5][8]

**Data shape:** Statewide via 13 regional AAADs with local intake/assessment; no fixed income test, priority-based for home delivery; contributions voluntary for congregate

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/aging-nutrition-program.html[6]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Senior Advocate Program | resource | local | simple |
| OPTIONS Program | benefit | state | deep |
| TennCare CHOICES | benefit | state | deep |
| Single Point of Entry (SPOE) | benefit | state | deep |
| Aging Nutrition Program | benefit | state | deep |

**Types:** {"resource":1,"benefit":4}
**Scopes:** {"local":1,"state":4}
**Complexity:** {"simple":1,"deep":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/TN/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **region**: 1 programs
- **not_applicable**: 1 programs
- **location_of_care (nursing home vs. assisted living vs. home-based)**: 1 programs
- **priority_tier**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Senior Advocate Program**: Highly regional via 9 AAADs and local senior centers; no uniform eligibility/income test; only 3 dedicated programs in state; grassroots focus on assistance gaps rather than fixed benefits
- **OPTIONS Program**: No income/asset test but ADL-based functional need and cost-share fees; slot-limited with regional agency administration; often paired/confused with Title III-B[3][6]
- **TennCare CHOICES**: TennCare CHOICES has three distinct groups with different care settings and requirements (nursing facility vs. home/community). Income and asset limits are fixed statewide as of specific effective dates (January 1, 2025 for income/assets; July 1, 2025 for minimum income allowance). Medical eligibility (PAE score) is the primary gating factor. Home exemption has specific equity thresholds. Processing involves both medical evaluation (PAE) and financial review (spend-down). Application routes vary by current location (facility vs. community). No specific dollar amounts for benefits provided in available sources—program appears to cover costs of services rather than providing direct payments.
- **Single Point of Entry (SPOE)**: Regional AAADs as SPOE providers; eligibility tied to CHOICES tiers (Groups 1/2/3) with NF LOC and Medicaid financial test; no fixed income/asset dollar tables in sources (linked to SSI-FBR/institutional Medicaid)
- **Aging Nutrition Program**: Statewide via 13 regional AAADs with local intake/assessment; no fixed income test, priority-based for home delivery; contributions voluntary for congregate

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Tennessee?
