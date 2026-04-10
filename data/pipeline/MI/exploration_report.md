# Michigan Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 3.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 6 |
| Programs deep-dived | 6 |
| New (not in our data) | 5 |
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

- **service**: 4 programs
- **in_kind**: 1 programs
- **advocacy|service**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Michigan Choice Waiver Program

- **min_age**: Ours says `65` → Source says `65+ for elderly/frail adults; 18-64 if disabled` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
- **income_limit**: Ours says `$2,901` → Source says `$2,982` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Medicaid-covered basics plus supports coordination and waiver services: adult day health, chore services, community health worker, community living supports, community transportation, counseling, environmental accessibility adaptations, fiscal intermediary, goods/services, home delivered meals, nursing services (preventative), personal emergency response systems (PERS), private duty nursing/respiratory care, respite, specialized medical equipment/supplies, training. No fixed dollar/hour amounts; individualized based on needs.[4][7]` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))

## New Programs (Not in Our Data)

- **MI Health Link Program** — service ([source](https://www.michigan.gov/mdhhs/doing-business/providers/integrated))
  - Shape notes: Dual-eligible only (full Medicare + Medicaid), county-restricted to 25 areas with regional ICO providers, requires NFLOC for HCBS, no spend down or conflicting programs allowed
- **MI Options** — service ([source](https://www.michigan.gov/mdhhs/inside-mdhhs/newsroom/2025/08/22/mi-options))
  - Shape notes: no income/asset test; counseling/referral service via statewide call center and regional AAA/nonprofit network; distinct from entitlement-based MI Choice Waiver; open to all adults/caregivers regardless of finances
- **Senior Project Fresh Program** — in_kind ([source](https://www.michigan.gov/mdhhs/adult-child-serv/adults-and-seniors/acls/special-programs/senior-project-freshmarket-fresh))
  - Shape notes: This is a seasonal, county-based program with variable regional administration. Benefits are fixed ($25 per eligible person) but scale by household size since each eligible member can apply. Income eligibility is tied to federal poverty guidelines updated annually. The program transitioned to a fully digital system in 2025, eliminating paper-based applications. Nutrition education requirements vary by county and lead agency. The program is tightly geographically restricted — applicants must live in and receive benefits from their home county.
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)** — advocacy|service ([source](elderlawofmi.org/micafe[1]))
  - Shape notes: MiCAFE is primarily an application assistance and advocacy program rather than a direct benefit provider. The actual benefits come through SNAP (Bridge Card) administered by Michigan Department of Health and Human Services. MiCAFE's value is in helping eligible seniors navigate the application process and access benefits they might otherwise miss. Specific income and asset limits are not published in available sources — they follow SNAP federal guidelines as administered by Michigan DHHS. The program serves both elderly and disabled individuals. As of 2015, approximately 4,000 seniors were actively receiving SNAP through MiCAFE assistance[3].
- **Senior Companion Program** — service ([source](https://www.michigan.gov/mdhhs/adult-child-serv/adults-and-seniors/acls/special-programs))
  - Shape notes: Federally-funded under Older Americans Act, locally administered by non-profits with regional providers and varying minimum service hours; eligibility for volunteer companions (not recipients); referral-based matching rather than direct family application

## Program Details

### Michigan Choice Waiver Program

> Last verified: 2026-04-08

**Eligibility:**
- Age: 65+ for elderly/frail adults; 18-64 if disabled+
- Income: Gross monthly income cannot exceed 300% of the Federal Benefit Rate (FBR)/SSI rate. 2025 limit: $2,982 (single applicant, excludes spousal income); prior years e.g., $2,910 or $2,523. Varies annually; no household size table specified as it's individual cap with spousal exclusions.[1][3][5]
- Assets: Countable assets limited to $9,950 (2025 figure, excludes one home, one car, and spousal protections under Federal Protected Spousal Asset guidelines). Home equity limit: $730,000 if intent to return (2025). 60-month look-back rule applies; assets given away/sold below fair market value trigger penalty period. Exempt: primary home (if equity ≤$730,000 or spouse/minor/disabled child lives there), one vehicle.[1][3]
- Medicaid eligible
- Nursing Facility Level of Care (NFLOC) determined via in-person Michigan Medicaid LOCD assessment (activities of daily living, cognitive, behavioral needs)
- Require supports coordination plus at least one other waiver service
- Live in home/community setting (not nursing home); available statewide since 1998

**Benefits:** Medicaid-covered basics plus supports coordination and waiver services: adult day health, chore services, community health worker, community living supports, community transportation, counseling, environmental accessibility adaptations, fiscal intermediary, goods/services, home delivered meals, nursing services (preventative), personal emergency response systems (PERS), private duty nursing/respiratory care, respite, specialized medical equipment/supplies, training. No fixed dollar/hour amounts; individualized based on needs.[4][7]
- Varies by: priority_tier

**How to apply:**
- Contact local MI Choice Waiver Agency by region (phone interview for preliminary screening, then in-person LOCD)
- e.g., The Senior Alliance: 734.722.2830[3]
- Regional agencies listed on state site (no central online/mail/in-person specified; agency-directed)

**Timeline:** Not specified in sources
**Waitlist:** Exists; varies by region (not detailed)

**Watch out for:**
- Strict income cap (e.g., $1 over disqualifies; gross before deductions)[5]
- 60-month look-back penalty for asset transfers[1]
- Must need NFLOC + supports coordination + 1 waiver service; dementia diagnosis alone insufficient[1]
- Not for nursing home residents; community/home only[4][7]
- Annual income/asset limits change (track 300% FBR)[3]
- Regional agency required—must contact specific local provider, not central hotline[5][7]

**Data shape:** Administered via 10+ regional agencies with county assignments; eligibility has fixed individual income cap (not household-scaled) but spousal exemptions; benefits individualized by assessed needs/priority, not fixed hours/dollars; statewide but regionally varied providers/waitlists

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### MI Health Link Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: No specific income dollar limits stated for MI Health Link itself; requires full Medicaid eligibility, which has income thresholds (e.g., for HCBS waiver context, applicant income limit equivalent to 300% of Federal Benefit Rate). People with Medicaid spend down are not eligible. Varies by household size per standard Medicaid rules, but no table provided in sources.[3][2]
- Assets: No specific asset dollar limits stated for MI Health Link itself; requires full Medicaid eligibility. For HCBS waiver context: Home equity interest no greater than $730,000 (2025) if intending to return home. Exemptions include spouse or dependent child(ren) living in home.[3]
- Enrolled in both full Medicare (Parts A, B, and D) and full Medicaid benefits.
- Live in specific Michigan counties: Barry, Berrien, Branch, Calhoun, Cass, Kalamazoo, Macomb, St. Joseph, Van Buren, Wayne, or any county in the Upper Peninsula (25 counties total, including Alger, Baraga, Chippewa, Delta, Dickinson, Gogebic, Houghton, Iron, Keweenaw, Luce, Mackinac, Marquette, Menominee, Ontonagon, Schoolcraft).[1][3][7]
- Not residing in a state-operated veteran's home.
- Not currently enrolled in hospice.
- Not enrolled in PACE or MI Choice (must leave these programs to join).[2][8]
- For HCBS: Nursing Facility Level of Care (NFLOC) determination via Michigan Medicaid LOCD, considering ADLs, cognitive abilities, and behaviors.[3][5]

**Benefits:** Integrated Medicare and Medicaid benefits in one plan: medical services, behavioral health services, pharmacy (replaces Medicare Part D, no co-pays/deductibles on covered meds), home and community-based services (HCBS) including personal care (authorized for ADL level 3+), nursing home care, transportation, care coordination. One card for all services; care coordinator assists with plan, appointments, providers.[1][6][4][5]
- Varies by: region

**How to apply:**
- Passive enrollment: Eligible individuals receive letter from Michigan ENROLLS with ICO (Integrated Care Organization) options; no choice leads to auto-assignment.[1][7]
- Opt-in for certain phases/regions (e.g., Macomb/Wayne Phase 2 starting April 2015).[7]
- Contact health plan or Michigan ENROLLS (specific phone/website not listed; forms include Authorization to Disclose Protected Health Information (DCH-1183), Behavioral Health Consent Form (MDHHS-5515)).[1]

**Timeline:** Varies by enrollment phase; e.g., services begin May 1, 2015 for Phase 2 opt-ins (historical).[7]

**Watch out for:**
- Must disenroll from PACE, MI Choice, or hospice to join; spend down Medicaid ineligible.[2]
- County-restricted; moving out of eligible area ends participation.[8]
- Nursing home residents pay patient pay amount.[2]
- Auto-assignment if no choice made during enrollment window.[7]
- Replaces Medicare Part D drug plan.[1]

**Data shape:** Dual-eligible only (full Medicare + Medicaid), county-restricted to 25 areas with regional ICO providers, requires NFLOC for HCBS, no spend down or conflicting programs allowed

**Source:** https://www.michigan.gov/mdhhs/doing-business/providers/integrated

---

### MI Options

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No income or asset limits; open to all adults 18+, people with disabilities, Medicare beneficiaries, caregivers, and family members. (Note: Distinct from MI Choice Medicaid Waiver, which has income up to 300% of SSI/FPL for elderly/disabled.)[3][4]
- Assets: No asset limits or tests apply.[3][4]
- Michigan resident
- No disability requirement for counseling access
- Includes caregivers and family members seeking guidance on long-term care or Medicare

**Benefits:** Free person-centered options counseling for long-term care (exploring home/community-based services, housing, transportation, caregiver respite, planning after life events); Medicare counseling (enrollment, plans, costs, scams); personalized action plans; sessions ~90 minutes with follow-up; provided by certified counselors via network of Area Agencies on Aging, Centers for Independent Living, nonprofits.[2][3][4][6]

**How to apply:**
- Phone: Statewide call center 800-803-7174 (8 a.m.-8 p.m. Mon-Fri) to speak with agent, schedule appointment, or get referral to local counselor[2][6]
- Local providers: e.g., AgeWays (833-801-5587 or OptionsCounseling@AgeWays.org)[6]; WellWise Services (517-592-1974 or intake.referral@wellwiseservices.org)[7]; The Senior Alliance (via local AAA)[3][4]

**Timeline:** Immediate phone access; counselor appointments scheduled via call center (timeline not specified)

**Watch out for:**
- Not a direct service provider or Medicaid program—provides counseling and referrals only, not benefits itself; often confused with MI Choice Waiver (which has slots, income limits, HCBS services); free but connects to potentially paid/eligibility-based programs; launched 2025, so verify current availability[1][2][3][5]

**Data shape:** no income/asset test; counseling/referral service via statewide call center and regional AAA/nonprofit network; distinct from entitlement-based MI Choice Waiver; open to all adults/caregivers regardless of finances

**Source:** https://www.michigan.gov/mdhhs/inside-mdhhs/newsroom/2025/08/22/mi-options

---

### Senior Project Fresh Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years old or older (or 55+ if member of Michigan federally recognized tribe or urban tribal group)+
- Income: Household income at or below 185% of Federal Poverty Guidelines. For 2024 (most recent data in search results): Individual $27,861/year ($2,321.75/month); Couple $37,814/year ($3,151.17/month); Household of 3: $47,767/year ($3,980.58/month); Household of 4: $57,720/year ($4,810/month). Note: Income limits are updated annually based on Federal Poverty Guidelines. Alternative income threshold mentioned in one source: $28,952.50 for individual, $39,127.50 for couple, but the 185% poverty guideline is the authoritative standard[1][2].
- Assets: Not specified in search results
- Must be a Michigan resident[1]
- Must live in the county where coupons are being distributed[2]
- Benefits must be obtained in the county in which the applicant lives[1]
- Every eligible household member may apply separately[1]

**Benefits:** $25 in coupons per eligible person that can be exchanged for fresh produce (fruits, vegetables, cut herbs, mushrooms, honey) at farmers markets and roadside stands[8]. Includes free nutrition counseling[8].
- Varies by: household_size (each eligible household member receives coupons)

**How to apply:**
- Online application through Healthy Together platform (digital system as of 2025)[4]
- In-person at local senior centers or community agencies[7]
- Contact local lead agencies by county (varies by region)[2]
- Email: MDHHS-SeniorProjectFresh@michigan.gov[1]

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Program runs May 1 – October 31 only; coupons expire on October 31 each year[2]
- Online application opens May 1, 2026 (not available year-round)[1]
- Income eligibility is based on yearly gross household income, and household is defined as people sharing an address and pooling income/expenses — this may include non-relatives[1]
- If receiving coupons from MSU Extension staff, attendance at nutrition education class may be required (format varies by county)[2]
- Transition to digital system (Healthy Together) as of 2025 means no more paper coupons or applications[4]
- Farmers must grow Michigan-grown produce and sell only at farmers markets or roadside stands to participate[1][4]
- Farmers must complete required Senior Project Fresh Farmer Training after applying[1]
- If using a proxy to receive/redeem coupons, proxy must be at least 18 years old and provide identification plus written approval from the eligible person[3]
- Income limits are updated annually based on Federal Poverty Guidelines — verify current year limits before applying

**Data shape:** This is a seasonal, county-based program with variable regional administration. Benefits are fixed ($25 per eligible person) but scale by household size since each eligible member can apply. Income eligibility is tied to federal poverty guidelines updated annually. The program transitioned to a fully digital system in 2025, eliminating paper-based applications. Nutrition education requirements vary by county and lead agency. The program is tightly geographically restricted — applicants must live in and receive benefits from their home county.

**Source:** https://www.michigan.gov/mdhhs/adult-child-serv/adults-and-seniors/acls/special-programs/senior-project-freshmarket-fresh

---

### MiCAFE (Michigan's Coordinated Access to Food for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Primarily seniors, though individuals with disabilities also qualify[4]+
- Income: Based on income minus medical expenses[5]. Specific dollar amounts not provided in available sources. Eligibility determined through application process by Michigan Department of Health and Human Services[4].
- Assets: Not specified in available sources
- Must be potentially eligible for SNAP (Supplemental Nutrition Assistance Program) benefits[3]
- Household composition: all persons living together and purchasing/preparing food together are considered one household group[7]

**Benefits:** Primary benefit is assistance accessing SNAP benefits via Michigan Bridge Card for purchasing food at authorized retailers[3]. Also assists with applying for utility assistance, tax programs, and other community programs[6]. Includes help paying for Medicare and Medicare Part D Prescription Drug Benefit for those who don't qualify for Bridge Card[1].
- Varies by: Individual eligibility and circumstances

**How to apply:**
- Phone: (877) 664-2233[1] or (866) 400-9164[2]
- Website: elderlawofmi.org/micafe[1]
- In-person: Elder Law of Michigan, Inc., 3815 W. St. Joseph St., Suite C-200, Lansing, MI 48917[2]
- In-home application assistance by trained, certified professionals where available[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- Nearly 50% of seniors eligible for SNAP are not enrolling — MiCAFE exists specifically to address this gap[9]
- Over 160,000 Michigan seniors still face hunger despite program availability[3]
- Program focuses on reducing 'barriers and stigma' — suggests application process or stigma may deter eligible seniors[3]
- Phone hours are limited: Monday-Friday, 9:00 a.m. to 3:00 p.m.[1]
- All information shared during MiCAFE appointment is confidential and not discussed outside the benefit eligibility determination process[2]
- Eligibility is based on 'income minus medical expenses' — medical costs can significantly reduce countable income[5]

**Data shape:** MiCAFE is primarily an application assistance and advocacy program rather than a direct benefit provider. The actual benefits come through SNAP (Bridge Card) administered by Michigan Department of Health and Human Services. MiCAFE's value is in helping eligible seniors navigate the application process and access benefits they might otherwise miss. Specific income and asset limits are not published in available sources — they follow SNAP federal guidelines as administered by Michigan DHHS. The program serves both elderly and disabled individuals. As of 2015, approximately 4,000 seniors were actively receiving SNAP through MiCAFE assistance[3].

**Source:** elderlawofmi.org/micafe[1]

---

### Senior Companion Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Limited income at or below 200% of the federal poverty level; exact dollar amounts not specified in sources and vary by household size per federal guidelines (e.g., consult current HHS poverty guidelines for table). No specific table provided for Michigan.
- Meet income eligibility guidelines
- Willing to serve a minimum of 15-20 hours per week (varies by provider: 15 hours in some, 20 in others)
- Participate in pre-service orientation and monthly in-service training
- Pass FBI fingerprinting and National Sex Offender background checks

**Benefits:** One-on-one companionship and assistance with activities of daily living for adults 21+ with special needs (e.g., developmental disabilities, mental illness, frail health, dementia, physical/visual impairments, loneliness, isolation); provided by volunteer Senior Companions aged 55+ who receive tax-exempt hourly stipend, mileage reimbursement, meal assistance; service helps recipients maintain independence at home, with family, in group/nursing homes, or adult day care.
- Varies by: region

**How to apply:**
- Contact regional providers: e.g., Catholic Services of Macomb (phone not listed), Family Service Agency of Mid Michigan (810-257-3769), CCSEM Oakland/Macomb (248-537-3300, email lacommarec@ccsem.org), Milestone Senior Services (269-382-0515)
- Referrals from non-profit/health agencies via Memorandums of Understanding
- Pre-screening of homes/sites


**Watch out for:**
- This is a volunteer program for low-income seniors (55+) to provide services to others, not direct benefits for the elderly loved one seeking care; families request matching via referrals, not direct enrollment
- Income eligibility applies to the volunteer companion, not the care recipient (though recipients often frail/low-income)
- No statewide centralized application; must contact local providers serving your county
- Stipend for volunteers is tax-exempt and not counted as income
- Not healthcare—focuses on companionship and non-medical ADL support
- Limited to 73/83 counties; check local availability

**Data shape:** Federally-funded under Older Americans Act, locally administered by non-profits with regional providers and varying minimum service hours; eligibility for volunteer companions (not recipients); referral-based matching rather than direct family application

**Source:** https://www.michigan.gov/mdhhs/adult-child-serv/adults-and-seniors/acls/special-programs

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Michigan Choice Waiver Program | benefit | state | deep |
| MI Health Link Program | benefit | local | deep |
| MI Options | resource | state | simple |
| Senior Project Fresh Program | resource | state | simple |
| MiCAFE (Michigan's Coordinated Access to | navigator | state | simple |
| Senior Companion Program | benefit | state | medium |

**Types:** {"benefit":3,"resource":2,"navigator":1}
**Scopes:** {"state":5,"local":1}
**Complexity:** {"deep":2,"simple":3,"medium":1}

## Content Drafts

Generated 6 page drafts. Review in admin dashboard or `data/pipeline/MI/drafts.json`.

- **Michigan Choice Waiver Program** (benefit) — 4 content sections, 6 FAQs
- **MI Health Link Program** (benefit) — 4 content sections, 6 FAQs
- **MI Options** (resource) — 2 content sections, 6 FAQs
- **Senior Project Fresh Program** (resource) — 2 content sections, 6 FAQs
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)** (navigator) — 2 content sections, 6 FAQs
- **Senior Companion Program** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 1 programs
- **region**: 2 programs
- **not_applicable**: 1 programs
- **household_size (each eligible household member receives coupons)**: 1 programs
- **Individual eligibility and circumstances**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Michigan Choice Waiver Program**: Administered via 10+ regional agencies with county assignments; eligibility has fixed individual income cap (not household-scaled) but spousal exemptions; benefits individualized by assessed needs/priority, not fixed hours/dollars; statewide but regionally varied providers/waitlists
- **MI Health Link Program**: Dual-eligible only (full Medicare + Medicaid), county-restricted to 25 areas with regional ICO providers, requires NFLOC for HCBS, no spend down or conflicting programs allowed
- **MI Options**: no income/asset test; counseling/referral service via statewide call center and regional AAA/nonprofit network; distinct from entitlement-based MI Choice Waiver; open to all adults/caregivers regardless of finances
- **Senior Project Fresh Program**: This is a seasonal, county-based program with variable regional administration. Benefits are fixed ($25 per eligible person) but scale by household size since each eligible member can apply. Income eligibility is tied to federal poverty guidelines updated annually. The program transitioned to a fully digital system in 2025, eliminating paper-based applications. Nutrition education requirements vary by county and lead agency. The program is tightly geographically restricted — applicants must live in and receive benefits from their home county.
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)**: MiCAFE is primarily an application assistance and advocacy program rather than a direct benefit provider. The actual benefits come through SNAP (Bridge Card) administered by Michigan Department of Health and Human Services. MiCAFE's value is in helping eligible seniors navigate the application process and access benefits they might otherwise miss. Specific income and asset limits are not published in available sources — they follow SNAP federal guidelines as administered by Michigan DHHS. The program serves both elderly and disabled individuals. As of 2015, approximately 4,000 seniors were actively receiving SNAP through MiCAFE assistance[3].
- **Senior Companion Program**: Federally-funded under Older Americans Act, locally administered by non-profits with regional providers and varying minimum service hours; eligibility for volunteer companions (not recipients); referral-based matching rather than direct family application

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Michigan?
