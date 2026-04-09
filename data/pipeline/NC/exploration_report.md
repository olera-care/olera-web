# North Carolina Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 31s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 6 |
| Programs deep-dived | 6 |
| New (not in our data) | 4 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |
| `asset_limits` | 1 | Our model has no asset limit fields |

## Program Types

- **financial**: 3 programs
- **service**: 2 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### North Carolina Seniors Farmers' Market Nutrition Program

- **income_limit**: Ours says `$2500` → Source says `$2,413` ([source](https://www.ncagr.gov/news/events/seniors-farmers-market-nutrition-program-charlotte-regional-farmers-market-10 and https://www.charlottefoodpolicy.com/seniorvouchers))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `$50 in vouchers per eligible senior per season[1][2]` ([source](https://www.ncagr.gov/news/events/seniors-farmers-market-nutrition-program-charlotte-regional-farmers-market-10 and https://www.charlottefoodpolicy.com/seniorvouchers))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncagr.gov/news/events/seniors-farmers-market-nutrition-program-charlotte-regional-farmers-market-10 and https://www.charlottefoodpolicy.com/seniorvouchers`

### State-County Special Assistance - In Home

- **income_limit**: Ours says `$800` → Source says `$1,117` ([source](https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Monthly cash supplement for living expenses (food, shelter, clothing, daily necessities); amount determined by income and approved rates (historically up to ~$1,500/month, higher for dementia/Alzheimer's); automatic Medicaid eligibility for medical/personal care services.[4][5][7]` ([source](https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]`

## New Programs (Not in Our Data)

- **North Carolina Homestead Exemption** — financial ([source](https://www.gastongov.com/618/Homestead-Exclusions (example county); North Carolina General Statute § 105-277.1))
  - Shape notes: This program has two distinct components: (1) Elderly/Disabled Homestead Exclusion (property tax relief based on income and age/disability status) and (2) Disabled Veteran's Homestead Exclusion (separate program with no income/age limits). Income limits are set statewide but vary annually. Application is county-based. The benefit is a property tax exclusion (not a cash payment), calculated as the greater of a fixed dollar amount or a percentage of home value. Some counties require annual reapplication while others are one-time. Verify with your specific county assessor for exact procedures and deadlines.
- **North Carolina Long-Term Care Medicaid** — service ([source](https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care))
  - Shape notes: Income tied to regional nursing home rates (not fixed table); multiple programs/waivers (nursing home vs. HCBS) with tiered NFLOC; county-administered with regional cost variations; no household size income table—marital status key.
- **Project C.A.R.E.** — service ([source](https://www.ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty[7]))
  - Shape notes: Regionally administered by 6 host agencies covering specific counties (100 total); respite funding limited and crisis-prioritized; no fixed income/asset tables published; dementia-specific for caregivers.
- **NC Lifespan Respite Program** — financial ([source](www.highcountryaging.org/services/lifespan-respite-project))
  - Shape notes: Referral-only applications via professionals; priority tiers over strict income/assets; administered regionally by High Country AAA under state/federal grant; flexible voucher for any-age special needs.

## Program Details

### North Carolina Homestead Exemption

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 years old as of January 1 of the tax year, OR totally and permanently disabled (any age)+
- Income: {"description":"Household income limit (applicant and spouse combined if applicable)","2025_limit":"$37,900","note":"Income limits are set annually by the North Carolina Department of Revenue on or before July 1. The limit has been approximately $38,800 in recent years but varies year to year."}
- Assets: No asset limits specified in statute
- Must be a North Carolina resident
- Must own and occupy the property as a permanent residence on or before January 1 of the tax year
- Property must be primary residence only (not vacation homes, rental properties, or investment real estate)
- Property can be a single-family residence, manufactured home, condominium, or townhome
- Dwelling site cannot exceed 1 acre (includes dwelling, garage, carport, storage building)

**Benefits:** Property tax exclusion of the greater of $25,000 OR 50% of the appraised home value (whichever is larger), applied to the first $25,000 or 50% of assessed value
- Varies by: home_value

**How to apply:**
- In-person at county tax assessor's office (varies by county)
- Mail to county tax assessor
- Phone to county tax assessor (varies by county)

**Timeline:** Not specified in search results

**Watch out for:**
- Income limits are set annually and change year to year—verify current year limit before applying
- This is a property tax exclusion program, NOT the same as the homestead exemption used in bankruptcy proceedings (different dollar amounts and rules)
- One-time application required for elderly/disabled exclusion; however, some counties require annual reapplication for the tax limitation program (verify with your county)
- Cannot receive other property tax relief simultaneously—must choose this program or another relief program
- Temporary absences for health reasons or nursing home/rest home confinement do not disqualify you, but the home must remain unoccupied or occupied by spouse/dependent
- Property must be primary residence only—rental properties and vacation homes do not qualify
- Income includes both applicant and spouse (if married)—joint income must be under the limit
- The exclusion amount is the GREATER of $25,000 or 50% of appraised value—so if your home is worth $40,000, you get 50% ($20,000) excluded; if worth $60,000, you get 50% ($30,000) excluded
- Fraudulent claims (recently moving assets into home to avoid creditors, false statements about assets) can result in disallowance of exemption
- Different program exists for disabled veterans with no age or income requirement—verify if veteran qualifies for that instead

**Data shape:** This program has two distinct components: (1) Elderly/Disabled Homestead Exclusion (property tax relief based on income and age/disability status) and (2) Disabled Veteran's Homestead Exclusion (separate program with no income/age limits). Income limits are set statewide but vary annually. Application is county-based. The benefit is a property tax exclusion (not a cash payment), calculated as the greater of a fixed dollar amount or a percentage of home value. Some counties require annual reapplication while others are one-time. Verify with your specific county assessor for exact procedures and deadlines.

**Source:** https://www.gastongov.com/618/Homestead-Exclusions (example county); North Carolina General Statute § 105-277.1

---

### North Carolina Long-Term Care Medicaid

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No fixed income cap; income must be less than the regional nursing home cost of care ($8,004–$11,093/month in 2025). Nearly all income counts (IRA, pensions, Social Security, wages, etc.). Applicant pays most income toward care minus $70/month personal needs allowance, health insurance premiums, uncovered medical expenses, spousal/dependent allowances, and home maintenance allowance if return home expected within 6 months. For ABD Medicaid (gateway), single applicant limit is $1,330/month (April 2026–March 2027). Varies by marital status and program (nursing home, HCBS waivers, ABD). No household size table specified; SSI recipients auto-eligible.[1][2][5][6]
- Assets: $2,000 limit for single applicant (cash/non-exempt assets); $3,000 if both spouses need care. Exempt: primary home (equity ≤$730,000 if intent to return, spouse/child <21/disabled lives there), one vehicle, personal belongings/household items, burial plots/funds, life insurance (face value under set amount). For married (one institutionalized), community spouse resource allowance up to $157,920 (2025).[2][4][6]
- NC resident and US citizen/eligible immigrant.
- Nursing Facility Level of Care (NFLOC): need full-time care for ≥30 days based on ADL/IADL assessment (mobility, bathing, dressing, eating, toileting, cleaning, cooking, shopping, bills, cognitive/behavioral issues).
- For HCBS waivers or specific programs (e.g., CAP/DA, PACE): additional criteria like age 55+, reside in service area, community living safety.

**Benefits:** Nursing home care, assisted living, home/community-based services (HCBS) waivers (personal care, adult day health, respite), intermediate care facilities. Covers costs exceeding patient's income liability; no fixed dollar/hour amounts—varies by assessed needs and program. Examples: PACE (comprehensive for 55+), CAP/DA (disabled adults 18+ for home-based alternatives to institutions).[1][3][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Local Department of Social Services (DSS) offices (county-specific; e.g., Wake County via wake.gov).[7]
- Online: NC Medicaid portal (medicaid.ncdhhs.gov).[8]
- In-person/mail: County DSS offices statewide.

**Timeline:** Not specified in sources; varies by county/program.
**Waitlist:** Possible for HCBS waivers if slots unavailable (e.g., CAP/DA).[3]

**Watch out for:**
- No single income limit—income < facility cost but most paid as 'patient liability' (missed by many).[5][6][7]
- Home equity cap $730,000; intent to return must be realistic.[2][6]
- HCBS waivers have waitlists/slots; NFLOC required even for home care.[1][3]
- Spousal protections (CSRA $157,920) but community spouse income not counted unless both applying.[4][6]
- SSI auto-qualifies; others need full ABD/NFLOC assessment.[5]

**Data shape:** Income tied to regional nursing home rates (not fixed table); multiple programs/waivers (nursing home vs. HCBS) with tiered NFLOC; county-administered with regional cost variations; no household size income table—marital status key.

**Source:** https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care

---

### Project C.A.R.E.

> **NEW** — not currently in our data

**Eligibility:**
- Income: Targets low-income families; most recipients are just above Medicaid eligibility or on waiting lists for Medicaid/other public funds. No exact dollar amounts or household size table specified in sources.[2][4]
- Assets: Not applicable or not specified.
- Person with dementia must have confirmed Alzheimer's disease or other types of dementia (memory loss and confusion) by caregiver, physician, or healthcare provider.[2]
- Residence of the person with dementia must be in one of the counties served by the regional host agency (e.g., 29 counties in Northeastern NC Project C.A.R.E.: Northampton, Hertford, Gates, Currituck, Camden, Pasquotank, Chowan, Washington, Tyrrell, Dare, Hyde, Halifax, Bertie, Nash, Edgecombe, Martin, Wilson, Pitt, Beaufort, Wayne, Greene, Lenoir, Craven, Pamlico, Jones, Duplin, Onslow, Carteret.[2])
- Caregiver must be at least 18 years old.[3]
- Caregivers receiving Medicaid CAP/DA services eligible for all benefits except additional respite funding; eligible for respite while on CAP/DA waitlist.[2]

**Benefits:** Care consultation, individualized care planning, caregiver assessment, dementia-specific education and training, information and referrals, connections to community resources, self-directed respite care (e.g., in-home respite, group settings like Adult Day Care/Health via vouchers).[2][3][5][6]
- Varies by: priority_tier

**How to apply:**
- Phone: Regional offices or intake lines (e.g., Just1Call at 704-432-1111 for Mecklenburg; State Director Laura Jane Strunin at 984.365.6992).[3][6]
- Contact regional host agencies: Northeastern (Albemarle/Mid-East Commission), Southeastern (Cape Fear Council of Governments), South Central (Mecklenburg County DSS), Central (Duke Family Support Program), Foothills (Western Piedmont Council of Government), Western (Land of Sky Regional Council).[2][3]
- State oversight: NC DHHS DAAS (ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty).[7]

**Timeline:** Not specified.
**Waitlist:** Funds are limited; caregivers on waitlists for other programs (e.g., CAP/DA, Medicaid) may receive services.[2][4][5]

**Watch out for:**
- Funds for respite are limited and subject to availability; not guaranteed.[5]
- CAP/DA Medicaid recipients excluded from additional respite funding.[2]
- Must contact specific regional host agency based on county; not a single statewide application.[1][2][3]
- Targets those just above Medicaid eligibility who can't afford private respite.[4]
- No age limit on care recipient, but dementia diagnosis required.[2]

**Data shape:** Regionally administered by 6 host agencies covering specific counties (100 total); respite funding limited and crisis-prioritized; no fixed income/asset tables published; dementia-specific for caregivers.

**Source:** https://www.ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty[7]

---

### North Carolina Seniors Farmers' Market Nutrition Program


**Eligibility:**
- Age: 60+
- Income: Household income must not exceed 185% of the Federal Poverty Level. Specific limits: one-person household $2,413/month or less; two-person household $3,261/month or less[1][2]
- Must live in a county with a participating local agency[3]
- Some state agencies accept proof of participation in means-tested programs (CSFP, SNAP) as alternative eligibility documentation[5]

**Benefits:** $50 in vouchers per eligible senior per season[1][2]
- Varies by: fixed

**How to apply:**
- In-person at participating farmers markets during designated enrollment dates (September 2025 enrollment dates listed: Davidson Farmers Market 9/20 9am-12pm, North Meck Community Farmers Market 9/17 9am-12pm, Uptown Farmers Market 9/13 8am-12:30pm, Charlotte Regional Farmers Market 9/20 8am-12:30pm, Matthews Community Farmers Market 9/20 8am-12pm)[1]
- Contact Mecklenburg County Department of Social Services or The Charlotte-Mecklenburg Food Policy Council for application information[2]

**Timeline:** Not specified in available sources
**Waitlist:** No guaranteed vouchers — even if eligible, funding may not cover all applicants[3]

**Watch out for:**
- Vouchers are NOT guaranteed — even if all eligibility requirements are met, insufficient funding may prevent issuance[3]
- This is a summer-only program (July-September); it does not operate year-round[2][3]
- Vouchers can only be used at SFMNP-certified farmers markets, not grocery stores or other retailers[1][2]
- Only North Carolina-grown produce qualifies; items grown elsewhere cannot be purchased[1]
- Program is federally funded through USDA; federal budget cuts could affect availability[3]
- Enrollment appears to occur at specific farmers markets on specific dates in September; missing these dates may require contacting the local agency directly[1]
- Income limits are based on 185% of Federal Poverty Level, which may change annually

**Data shape:** This is a fixed-benefit, in-kind program with no variation by household size (all eligible seniors receive $50). It is geographically restricted to counties with participating local agencies and operates only during summer months (July-September). The program is demand-limited with no guaranteed benefits despite meeting eligibility criteria. Enrollment is decentralized through participating farmers markets rather than centralized online or phone application.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncagr.gov/news/events/seniors-farmers-market-nutrition-program-charlotte-regional-farmers-market-10 and https://www.charlottefoodpolicy.com/seniorvouchers

---

### NC Lifespan Respite Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No specific dollar amounts or household size table stated; priority given to caregivers with the greatest economic need.[2][4][6]
- Assets: No asset limits mentioned.[2][4][6]
- Caregiver must be a North Carolina resident.
- Caregiver must provide unpaid care to an older adult (60+) or an adult/minor of any age with disabilities requiring regular assistance with activities of daily living.
- Neither caregiver nor care recipient can be receiving ongoing, publicly-funded in-home care or respite care.
- Priority to those who have provided direct care for at least 3 months in a home-like setting, have not received publicly-funded respite within the last 3 months, or are in an emergency/extenuating circumstances.
- Must be referred by a professional or referring agency (applications by caregivers directly not accepted).[2][4][6]

**Benefits:** $500 to $750 reimbursement voucher per calendar year for respite care services (hire agency, facility, or individual); must use within 90 days; flexible options for short-term breaks from caregiving.[2][6]
- Varies by: priority_tier

**How to apply:**
- Online: Submit secure referral application at www.highcountryaging.org/services/lifespan-respite-project (by health/human service professionals on behalf of caregiver).
- Phone: Contact Pat Guarnieri or Tammy Nelson at 828-265-5434 ext. 139 or lifespan@hccog.org.[2][5][6]

**Timeline:** Not specified; application takes minutes to complete online.[2]
**Waitlist:** Not mentioned.

**Watch out for:**
- Applications must come from referring agencies/professionals (caregivers cannot apply directly).
- No ongoing publicly-funded respite or in-home care allowed.
- Funds must be used within 90 days of approval.
- Priority-based, not guaranteed for all eligible.
- Reimbursement-based voucher, not direct payment in all cases.

**Data shape:** Referral-only applications via professionals; priority tiers over strict income/assets; administered regionally by High Country AAA under state/federal grant; flexible voucher for any-age special needs.

**Source:** www.highcountryaging.org/services/lifespan-respite-project

---

### State-County Special Assistance - In Home


**Eligibility:**
- Age: 65+
- Income: Monthly income must be below the federal poverty level or up to $1,117.50 (as of available data; exact current FPL varies by household size but tied to SSI financial ineligibility due to excess income). Same limits as traditional Special Assistance; higher for dementia/Alzheimer's patients. Spouse's income/assets do not affect eligibility.[1][2][3][5]
- Assets: Less than $2,000 for individuals (savings and assets; excludes certain items per standard rules like primary home, one vehicle, household goods; trust funds owned by applicant/spouse count).[2][3]
- U.S. citizen or qualified legal alien.
- North Carolina resident (at least 90 days or recent arrival to be near close relative: parent, grandparent, sibling, spouse, child).
- Require level of care provided in licensed Adult Care Facility but desire to remain in home/private living setting; health/safety/well-being maintainable with in-home services (e.g., aides, modifications, case management, supplies).
- Receive SSI or financially ineligible for SSI solely due to excess income.
- Not inmate of public institution.
- Disabled (18-64) per Social Security definition, or legally blind (under 18 or under 65). Doctor must complete FL-2 form confirming Adult Care Home level of care.[1][2][3][5]

**Benefits:** Monthly cash supplement for living expenses (food, shelter, clothing, daily necessities); amount determined by income and approved rates (historically up to ~$1,500/month, higher for dementia/Alzheimer's); automatic Medicaid eligibility for medical/personal care services.[4][5][7]
- Varies by: income|dementia_or_alzheimers_diagnosis|priority_tier

**How to apply:**
- Contact local Department of Social Services (DSS) office.
- Phone examples: Wake County - Catherine Goldman 919-250-3835 (info), Tracy Gregory 919-212-7549 (apply); Pisgah Legal Services (Western NC) 800-489-6144.[1][5]
- In-person at local DSS.
- NC DHHS website for info/application start: https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]

**Timeline:** 45 days for age 65+; 60 days for 18-64 disabled.[1][2]
**Waitlist:** Eliminated; approved without delay if eligible.[5]

**Watch out for:**
- All Medicaid/community resources must be exhausted first; not a first-line option.[1]
- Must need Adult Care Home level of care but choose to stay home; doctor FL-2 required.[5]
- Automatic Medicaid but facility acceptance varies for related services (check if providers accept rates).[4]
- Case management mandatory: monthly contact, quarterly visits, annual assessment.[1]
- Income/assets case-by-case; SSI tie-in means strict federal poverty alignment.[3]
- Higher benefits for dementia/Alzheimer's often missed.[5]

**Data shape:** County-administered statewide with local DSS variation; benefits as cash supplement scaled by income/diagnosis; tied to SSI/FPL with Adult Care Home care level requirement despite in-home setting; no spouse deeming.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| North Carolina Homestead Exemption | benefit | state | deep |
| North Carolina Long-Term Care Medicaid | benefit | state | deep |
| Project C.A.R.E. | benefit | state | deep |
| North Carolina Seniors Farmers' Market N | benefit | state | medium |
| NC Lifespan Respite Program | benefit | state | deep |
| State-County Special Assistance - In Hom | benefit | state | deep |

**Types:** {"benefit":6}
**Scopes:** {"state":6}
**Complexity:** {"deep":5,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NC/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **home_value**: 1 programs
- **priority_tier**: 3 programs
- **fixed**: 1 programs
- **income|dementia_or_alzheimers_diagnosis|priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **North Carolina Homestead Exemption**: This program has two distinct components: (1) Elderly/Disabled Homestead Exclusion (property tax relief based on income and age/disability status) and (2) Disabled Veteran's Homestead Exclusion (separate program with no income/age limits). Income limits are set statewide but vary annually. Application is county-based. The benefit is a property tax exclusion (not a cash payment), calculated as the greater of a fixed dollar amount or a percentage of home value. Some counties require annual reapplication while others are one-time. Verify with your specific county assessor for exact procedures and deadlines.
- **North Carolina Long-Term Care Medicaid**: Income tied to regional nursing home rates (not fixed table); multiple programs/waivers (nursing home vs. HCBS) with tiered NFLOC; county-administered with regional cost variations; no household size income table—marital status key.
- **Project C.A.R.E.**: Regionally administered by 6 host agencies covering specific counties (100 total); respite funding limited and crisis-prioritized; no fixed income/asset tables published; dementia-specific for caregivers.
- **North Carolina Seniors Farmers' Market Nutrition Program**: This is a fixed-benefit, in-kind program with no variation by household size (all eligible seniors receive $50). It is geographically restricted to counties with participating local agencies and operates only during summer months (July-September). The program is demand-limited with no guaranteed benefits despite meeting eligibility criteria. Enrollment is decentralized through participating farmers markets rather than centralized online or phone application.
- **NC Lifespan Respite Program**: Referral-only applications via professionals; priority tiers over strict income/assets; administered regionally by High Country AAA under state/federal grant; flexible voucher for any-age special needs.
- **State-County Special Assistance - In Home**: County-administered statewide with local DSS variation; benefits as cash supplement scaled by income/diagnosis; tied to SSI/FPL with Adult Care Home care level requirement despite in-home setting; no spouse deeming.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in North Carolina?
