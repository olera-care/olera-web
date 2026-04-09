# North Carolina Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.030 (6 calls, 47s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 4 |
| Programs deep-dived | 4 |
| New (not in our data) | 3 |
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
- **in_kind**: 1 programs
- **service**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### North Carolina Seniors Farmers' Market Nutrition Program

- **income_limit**: Ours says `$2500` → Source says `$2,322` ([source](https://www.ncdhhs.gov (NC DHHS Division of Aging leads; specific SFMNP page referenced in sources, also check county CES or agr.gov for updates)[1][3]))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `$50 in vouchers per eligible senior to purchase fresh fruits, vegetables, raw honey, and fresh-cut herbs at certified farmers' markets, roadside stands, or CSAs. Minimum $20, maximum $50 per federal guidelines, redeemable July 1–September 30[1][3][5].` ([source](https://www.ncdhhs.gov (NC DHHS Division of Aging leads; specific SFMNP page referenced in sources, also check county CES or agr.gov for updates)[1][3]))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncdhhs.gov (NC DHHS Division of Aging leads; specific SFMNP page referenced in sources, also check county CES or agr.gov for updates)[1][3]`

## New Programs (Not in Our Data)

- **North Carolina Homestead Exemption** — financial ([source](North Carolina General Statute § 105-277.1; county tax assessor offices))
  - Shape notes: This program has multiple tiers: (1) Elderly/Disabled Exclusion (one-time application, permanent benefit, income-based), (2) Elderly/Disabled Tax Limitation (annual application required, income-tiered tax rates), and (3) Disabled Veteran Exclusion (no income/age limits). The search results primarily address the Elderly/Disabled Exclusion. Income limits are set statewide but administered by county. Benefits are fixed dollar amounts or percentages, not scaled by household size. Application is decentralized to county level.
- **Project C.A.R.E.** — service ([source](https://www.ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty[7]))
  - Shape notes: Regionally administered through 6 host agencies covering 100 counties; respite funds limited and prioritized by crisis need; no fixed income/asset tables or age minimum for care recipient
- **NC Lifespan Respite Program** — financial ([source](www.highcountryaging.org/services/lifespan-respite-project))
  - Shape notes: Referral-only applications via professionals; priority-based rather than strict income/asset tests; administered regionally by High Country AAA with statewide NC resident eligibility

## Program Details

### North Carolina Homestead Exemption

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 years old as of January 1 of the tax year, OR totally and permanently disabled (any age)+
- Income: {"description":"Annual household income cannot exceed the limit set by NC Department of Revenue on or before July 1 each year","2025_limit":"$37,900 for household","historical_reference":"$38,800 mentioned in some county materials (may reflect prior year)","note":"Income limits vary annually and are set by state; check with your county assessor for current year"}
- Assets: No asset limits specified in statute
- Must be a North Carolina resident
- Must own and occupy the property as a permanent residence on or before January 1 of the tax year
- Property must be primary residence only (not vacation homes, rental properties, or other real estate investments)
- Property can be a single-family residence, manufactured home, condominium, or townhome
- Property includes dwelling, dwelling site (not to exceed 1 acre), and related improvements (garage, carport, storage building)

**Benefits:** Property tax exclusion of the greater of $25,000 OR 50% of the appraised value of the residence[1][3][4]
- Varies by: fixed

**How to apply:**
- In-person at county tax assessor's office (example: Iredell County Tax Department, 135 E Water St, Room 100, Statesville, NC 28677)[5]
- By mail to your county tax assessor
- Online through your county's website (varies by county)

**Timeline:** Not specified in search results; contact your county assessor for specific timeline

**Watch out for:**
- Income limits are set annually by NC Department of Revenue (as of July 1 each year) and change year to year—verify current limits with your county[6]
- This is a property tax exclusion program, NOT the same as the homestead exemption used in bankruptcy proceedings[2][7]
- You cannot receive other property tax relief if you receive this exclusion[3]
- Property must be occupied as primary residence; temporary absences for health reasons or nursing home confinement are permitted if spouse or dependent occupies it[3]
- The exclusion is permanent once approved, but you must meet eligibility requirements each year[1]
- If you recently moved assets into your home to avoid creditors, courts may disallow the exemption[2]
- For those 65+, there is also a separate Tax Limitation program (different from the Elderly/Disabled Exclusion) that requires annual application by June 1 deadline and has different income tiers (4% tax on income $0-$38,800; 5% on $38,801-$55,050; does not qualify over $55,050)[1]
- Disabled veterans have a separate, more generous program: $45,000 exclusion with NO age or income requirements[1][4][6]

**Data shape:** This program has multiple tiers: (1) Elderly/Disabled Exclusion (one-time application, permanent benefit, income-based), (2) Elderly/Disabled Tax Limitation (annual application required, income-tiered tax rates), and (3) Disabled Veteran Exclusion (no income/age limits). The search results primarily address the Elderly/Disabled Exclusion. Income limits are set statewide but administered by county. Benefits are fixed dollar amounts or percentages, not scaled by household size. Application is decentralized to county level.

**Source:** North Carolina General Statute § 105-277.1; county tax assessor offices

---

### North Carolina Seniors Farmers' Market Nutrition Program


**Eligibility:**
- Age: 60+
- Income: Household income at or below 185% of the Federal Poverty Level. Examples: $2,322 or less per month for 1-person household; $3,152 or less per month for 2-person household (2024 figures); $2,413/$3,261 cited for 2025 in some regions[1][2][3]. Full table varies by year and household size—check current FPL guidelines via local agency.
- Assets: No asset limits mentioned in program details[1][2][3][4][5].
- Reside in a participating county (not statewide; available in 49-57 of 100 counties)[1][2]
- Not an entitlement program—vouchers not guaranteed even if eligible due to limited funding[1]

**Benefits:** $50 in vouchers per eligible senior to purchase fresh fruits, vegetables, raw honey, and fresh-cut herbs at certified farmers' markets, roadside stands, or CSAs. Minimum $20, maximum $50 per federal guidelines, redeemable July 1–September 30[1][3][5].
- Varies by: fixed

**How to apply:**
- Fill out NC SFMNP Voucher Interest Form (pre-application to join interest list; notified in June of local agency contacts)[2]
- Contact local agency in participating county for eligibility screening, application, and voucher distribution (varies by county—no central statewide phone/website listed; e.g., NC DHHS Division of Aging leads, partners with county DSS)[3]
- In-person at participating farmers' markets or local agencies (e.g., Mecklenburg County DSS)[3]

**Timeline:** Interest list notifications in June; applications open around then for July start—no specific processing timeline stated[2].
**Waitlist:** Not guaranteed due to limited funds; interest form acts as pre-waitlist mechanism[1][2].

**Watch out for:**
- Not available in all 100 NC counties—must confirm participating county first[1][2]
- Limited funding means no guarantee even if eligible[1]
- Summer-only (July 1–Sept 30); vouchers unusable outside season or at non-certified vendors[1][3][5]
- Distinct from WIC FMNP (for pregnant/postpartum/children) and SNAP doubling[2][7]
- Income limits based on annual FPL updates—2024/2025 figures differ slightly by source[1][2][3]

**Data shape:** County-restricted (not statewide); fixed $50 voucher regardless of household size; no asset test; pre-application interest form required due to funding limits; varies by local agency administration

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncdhhs.gov (NC DHHS Division of Aging leads; specific SFMNP page referenced in sources, also check county CES or agr.gov for updates)[1][3]

---

### Project C.A.R.E.

> **NEW** — not currently in our data

**Eligibility:**
- Income: Targets low-income families; most recipients are just above Medicaid eligibility or on waiting lists for Medicaid/other public funds. No exact dollar amounts or household size table specified in sources.
- Person with dementia must have confirmed Alzheimer's disease or other types of dementia (memory loss and confusion) by caregiver, physician, or healthcare provider[2][3]
- Residence of the person with dementia must be in one of the counties served by the regional host agency (e.g., 29 counties in Northeastern NC Project C.A.R.E.: Northampton, Hertford, Gates, Currituck, Camden, Pasquotank, Chowan, Washington, Tyrrell, Dare, Hyde, Halifax, Bertie, Nash, Edgecombe, Martin, Wilson, Pitt, Beaufort, Wayne, Greene, Lenoir, Craven, Pamlico, Jones, Duplin, Onslow, Carteret[2]; program serves 100 counties statewide[2])
- Caregiver must be at least 18 years old[3]
- Caregivers in Medicaid CAP/DA are eligible for all benefits except additional respite funding; may receive respite while on CAP/DA waitlist[2]

**Benefits:** Care consultation, individualized care planning, caregiver assessment, dementia-specific education and training, information and referrals, connections to community resources (e.g., Area Agencies on Aging, Family Caregiver Support Program), limited self-directed respite care funds (vouchers for in-home respite or group settings like Adult Day Care/Health; excludes additional respite for CAP/DA enrollees)[2][3][5][6]
- Varies by: priority_tier

**How to apply:**
- Phone: Regional intake lines (e.g., Just1Call at 704-432-1111 for Mecklenburg[6]; State Director Laura Jane Strunin at 984-365-6992[3])
- Contact regional host agencies: Northeastern (Albemarle/Mid-East Commission[2]), Southeastern (Cape Fear Council of Governments[5]), South Central (Mecklenburg County DSS[6]), Central (Duke Dementia Family Support Program[3][8]), Foothills (Western Piedmont Council of Government[2]), Western (Land of Sky Regional Council[2])
- No statewide online application or specific form name listed; applications go through regional Family Consultants or host agencies

**Timeline:** Not specified
**Waitlist:** Funds are limited; prioritizes caregivers in crisis; may involve waitlists similar to Medicaid CAP/DA[2][5]

**Watch out for:**
- Limited funds; respite vouchers subject to availability and not additional for CAP/DA enrollees[2][5]
- Must reside in specific regional counties; not all NC counties may be covered uniformly[2]
- Targets low-income/rural/minority caregivers just above Medicaid; those who can pay may get consultation only[4]
- Apply through regional host agency, not centralized statewide process[1][2][3]

**Data shape:** Regionally administered through 6 host agencies covering 100 counties; respite funds limited and prioritized by crisis need; no fixed income/asset tables or age minimum for care recipient

**Source:** https://www.ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty[7]

---

### NC Lifespan Respite Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No specific dollar amounts or household size table stated; priority given to those with greatest economic need[1][3][5]
- Assets: No asset limits or exemptions mentioned[1][3][5]
- North Carolina resident[1][3][5]
- Providing unpaid care to older adult (60+) or adult/minor of any age with disabilities requiring regular assistance with activities of daily living[1][3]
- Neither caregiver nor care recipient receiving ongoing publicly-funded in-home care or respite care[1][3]
- Must use voucher funds within 90 days[3]
- Priority: greatest economic need, provided direct care for at least 3 months in home-like setting, no publicly-funded respite in last 3 months, emergency/extenuating circumstances[3]

**Benefits:** $500 reimbursement voucher (some sources state up to $750 per calendar year); flexible for hiring agency, facility, or individual for respite care[1][5]
- Varies by: priority_tier

**How to apply:**
- Online: www.highcountryaging.org/services/lifespan-respite-project (secure application; must be submitted by referring agency/professional, not directly by caregiver)[1][5][6]
- Phone: 828-265-5434 ext. 139 (Pat Guarnieri or Tammy Nelson); email: pguarnieri@regiond.org or lifespan@hccog.org[1][4][5]

**Timeline:** Takes only minutes to complete online application; further contact handled by High Country Area Agency on Aging (no specific processing timeline stated)[1][5]
**Waitlist:** Not mentioned

**Watch out for:**
- Applications must come from a referring agency/professional (caregivers cannot apply directly)[1][5][7]
- Not available if receiving ongoing publicly-funded in-home or respite care[1][3]
- Funds must be used within 90 days[3]
- Reimbursement-based voucher (pay provider first, then reimbursed)[1][4]

**Data shape:** Referral-only applications via professionals; priority-based rather than strict income/asset tests; administered regionally by High Country AAA with statewide NC resident eligibility

**Source:** www.highcountryaging.org/services/lifespan-respite-project

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| North Carolina Homestead Exemption | benefit | state | deep |
| North Carolina Seniors Farmers' Market N | benefit | local | deep |
| Project C.A.R.E. | benefit | state | deep |
| NC Lifespan Respite Program | benefit | state | deep |

**Types:** {"benefit":4}
**Scopes:** {"state":3,"local":1}
**Complexity:** {"deep":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NC/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **fixed**: 2 programs
- **priority_tier**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **North Carolina Homestead Exemption**: This program has multiple tiers: (1) Elderly/Disabled Exclusion (one-time application, permanent benefit, income-based), (2) Elderly/Disabled Tax Limitation (annual application required, income-tiered tax rates), and (3) Disabled Veteran Exclusion (no income/age limits). The search results primarily address the Elderly/Disabled Exclusion. Income limits are set statewide but administered by county. Benefits are fixed dollar amounts or percentages, not scaled by household size. Application is decentralized to county level.
- **North Carolina Seniors Farmers' Market Nutrition Program**: County-restricted (not statewide); fixed $50 voucher regardless of household size; no asset test; pre-application interest form required due to funding limits; varies by local agency administration
- **Project C.A.R.E.**: Regionally administered through 6 host agencies covering 100 counties; respite funds limited and prioritized by crisis need; no fixed income/asset tables or age minimum for care recipient
- **NC Lifespan Respite Program**: Referral-only applications via professionals; priority-based rather than strict income/asset tests; administered regionally by High Country AAA with statewide NC resident eligibility

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in North Carolina?
