# Missouri Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.030 (6 calls, 22s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 4 |
| Programs deep-dived | 4 |
| New (not in our data) | 2 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **financial**: 2 programs
- **service**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Missouri Property Tax Credit (Circuit Breaker)

- **income_limit**: Ours says `$30000` → Source says `$27,200` ([source](https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Tax credit up to $750 for renters/part-year owners; up to $1,100 for full-year homeowners. Amount is calculated based on real estate taxes or rent paid and total household income, fully available at ≤$14,300 income with phase-out to zero at max limits[1][2][3][4][5][6][7][8].` ([source](https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/))
- **source_url**: Ours says `MISSING` → Source says `https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/`

### Aged and Disabled Waiver (ADW)

- **income_limit**: Ours says `$1690` → Source says `$903` ([source](https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[8]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Homemaker services, chore services, basic and advanced respite, home-delivered meals, adult day care[4][5][7][8].` ([source](https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[8]))
- **source_url**: Ours says `MISSING` → Source says `https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[8]`

## New Programs (Not in Our Data)

- **Missouri Rx Program (MoRx)** — financial ([source](https://mydss.mo.gov/mhd/morx-general-faqs))
  - Shape notes: Eligibility now strictly linked to MO HealthNet enrollment/spenddown (not standalone SPAP); auto-enrollment for qualified; benefits fixed at 50% cost-share regardless of household size; major 2017 changes excluded pure Medicare Part D users; data conflicts on exact income/assets due to dated sources.
- **Senior Independent Living Program (SILP)** — service ([source](https://health.mo.gov/seniors/pdf/program-info.pdf or https://oa.mo.gov/sites/default/files/dhss_senior_independent_living_program.pdf))
  - Shape notes: Limited to 4-5 regional providers in urban areas; services customized per SILP with no standardized income/asset tests or statewide application process; data sparse on exact services, timelines, and documents.

## Program Details

### Missouri Rx Program (MoRx)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility tied to MO HealthNet (Medicaid) programs, not standalone Medicare Part D. Individuals: yearly income less than $15,315; married couple: less than $20,535. Older sources mention single $20,800-$21,660 or married $28,000-$29,140, but post-2017 changes restrict to MO HealthNet enrollment (full benefits, spenddown met at least once, Medicare Savings Programs like QMB/SLMB, or specific waivers). No table by household size beyond individual/couple; based on MO HealthNet rules which vary.[2][1][3]
- Assets: Individuals: total resources less than $11,710; married couple: less than $23,410 (older figures: single $11,990, couple $23,970). Liquid assets (savings, investments, real estate) counted; primary home, vehicles, burial plots, personal possessions exempt. Required for some eligibility checks but program primarily MO HealthNet-linked.[2][3]
- Missouri resident
- Enrolled in Medicare Part D plan (required for coordination)
- Enrolled in or eligible for MO HealthNet (Medicaid): full benefits, spenddown (met at least once per year), Medicare Savings Programs (QMB, SLMB1, SLMB2), Ticket to Work (paying premium), Home and Community Based Services, or receive MO HealthNet-related supplemental payments/checks
- Not eligible if only Medicare Part D without MO HealthNet (change effective July 1, 2017)
- HIV program requires verified HIV+ status (separate but mentioned)

**Benefits:** Pays 50% of out-of-pocket costs (deductible, co-pays, coverage gap) on medications covered by Medicare Part D plan after Part D pays. Covers Medicare-excluded drugs (specific OTC drugs, vitamins, minerals, limited cough/cold) if meeting MO HealthNet eligibility. Participant pays remaining 50% co-pay (pharmacy may refuse if unpaid). No co-pay after first full month in long-term care facilities (SNF, ICF, psych hospital). For dual eligibles, co-pays capped (e.g., 2021: $3.30 generic, $9.20 brand).[4][5]
- Varies by: priority_tier

**How to apply:**
- Automatically enrolled if receiving MO HealthNet benefits (full, spenddown, Medicare premiums only)
- Phone: Family Support Division at 1-855-373-4636 (for MO HealthNet eligibility check)
- Website: mydss.mo.gov (MO HealthNet application integrates with MoRx)
- Older form: MoRx Enrollment Form (requires Medicare Part D enrollment first; do not send if in MO HealthNet or employer plan)[3]

**Timeline:** Not specified; automatic for MO HealthNet enrollees. Spenddown must be met once per year for benefits to activate.[4]

**Watch out for:**
- Post-2017: No longer available for Medicare Part D only (without MO HealthNet); coverage ended June 30, 2017 for those.[2][7]
- Must pay your 50% co-pay share or pharmacy may refuse service (real co-pays, unlike some Medicaid).[4][5]
- Spenddown must be met at least once per calendar year for MoRx to activate on Part D costs.[4]
- Must enroll in Medicare Part D first; MoRx coordinates, does not replace.[3]
- Income/asset limits outdated in some sources; verify via MO HealthNet current FPL (up to 185% possible but fixed lower).[8]
- Dual eligibles pay premium difference if choosing non-benchmark Part D plan (2021 benchmark $30.48).[5]

**Data shape:** Eligibility now strictly linked to MO HealthNet enrollment/spenddown (not standalone SPAP); auto-enrollment for qualified; benefits fixed at 50% cost-share regardless of household size; major 2017 changes excluded pure Medicare Part D users; data conflicts on exact income/assets due to dated sources.

**Source:** https://mydss.mo.gov/mhd/morx-general-faqs

---

### Missouri Property Tax Credit (Circuit Breaker)


**Eligibility:**
- Age: 65+
- Income: Income limits vary by filer status and housing type: Renters or part-year owners - Single: ≤$27,200; Married (combined): ≤$29,200. Full-year homeowners - Single: ≤$30,000; Married (combined): ≤$34,000. Household income includes Social Security, pensions, wages, dividends, interest, rental income, public assistance, unemployment, SSI, TANF, child support, veteran benefits (unless 100% disabled), and non-business losses[1][2][4][6][8].
- Assets: No asset limits apply[1][2][4][6][8].
- 65+ years old (on or before December 31 of tax year), or 18-64 and 100% disabled, or 60+ receiving surviving spouse Social Security benefits[1][2][4][5][6][8].
- Missouri resident for the entire year[5][6].
- For renters: Must rent from a property that pays property taxes (not eligible if from non-profit assisted living or similar facility that does not pay property taxes)[1][8].
- Homeowners must have owned and occupied the home (limits differ for part-year owners, treated as renters)[4][6].

**Benefits:** Tax credit up to $750 for renters/part-year owners; up to $1,100 for full-year homeowners. Amount is calculated based on real estate taxes or rent paid and total household income, fully available at ≤$14,300 income with phase-out to zero at max limits[1][2][3][4][5][6][7][8].
- Varies by: household_size

**How to apply:**
- File Form MO-PTC (standalone) or Form MO-PTS (with MO-1040 income tax return)[5][6].
- Online/mail via Missouri Department of Revenue at dor.mo.gov/forms[6].
- Assistance: Call Aging Ahead at 800-243-6060 or 636-207-0847[2].
- Email questions to PropertyTaxCredit@dor.mo.gov[6].
- Local options (e.g., Eureka: Submit copy of MO-PTC by April 15 for utility adjustment)[5].

**Timeline:** Not specified in sources; typically processed with tax returns (file by April 15)[5].

**Watch out for:**
- Renters from facilities not paying property taxes (e.g., non-profit assisted living) ineligible[1][8].
- Income includes all sources, taxable and nontaxable, often leading to surprises[4][6].
- Part-year owners use renter limits ($27,200 single/$29,200 married)[4][6].
- Do not use MO-PTC if filing MO-1040 (use MO-PTS instead)[6].
- Limits unchanged since 2008; may not reflect current costs, with phase-out starting at $14,300[1][3][7].
- Must be full-year Missouri resident[5][6].

**Data shape:** Income limits differ by single/married and renter vs. full-year owner; credit phases out incrementally by income with separate max amounts ($750/$1,100); no asset test

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dor.mo.gov/taxation/individual/tax-types/property-tax-credit/

---

### Aged and Disabled Waiver (ADW)


**Eligibility:**
- Age: 63+
- Income: As of 2023, single applicants: $903 monthly; married applicants: $1,215 monthly. Limits set by MO HealthNet; certain exclusions and disregards may apply. No full household size table specified; consult MO HealthNet for updates[1][2].
- Assets: Single: $5,000; married: $10,000. Home equity limit in 2026: $752,000 if intending to return home. Home exempt if spouse, minor child under 21, or blind/disabled adult child (21+) lives there. Potential exposure to Medicaid Estate Recovery[1][2].
- Missouri resident, U.S. citizen or qualified alien, valid Social Security number[1][9].
- Meet Nursing Facility Level of Care (NFLOC) via InterRAI HC assessment (typically 21+ points on 0-60 scale, assessing ADLs like mobility, eating, bathing, cognition)[1][2][4].
- Live in home or community setting (not assisted living or adult foster care)[1].
- Need at least one ADW service to remain safely at home[1].
- For ages 63-64: physical disability required; 65+: age-based[2][5].

**Benefits:** Homemaker services, chore services, basic and advanced respite, home-delivered meals, adult day care[4][5][7][8].
- Varies by: priority_tier

**How to apply:**
- Contact Missouri Department of Social Services (DSS), local case management agencies, or Area Agencies on Aging (for older adults)[4].
- Administered by Department of Health and Senior Services, Division of Senior and Disability Services[7].
- No specific phone, URL, mail, or in-person details in results; start via mydss.mo.gov or dss.mo.gov[7][8].

**Timeline:** Not specified in results.
**Waitlist:** Not an entitlement program; limited enrollment slots may cause waitlists despite meeting eligibility[6].

**Watch out for:**
- Not entitlement-based: eligibility met does not guarantee slot due to limited enrollment[6].
- Must live in home/community, not assisted living[1].
- Home equity limit ($752,000 in 2026) and estate recovery risk[2].
- Income/asset limits outdated (2023 figures); verify current with MO HealthNet[1].
- For 18-62: some sources conflict on ADW vs. separate Adult Day Care Waiver; ADW primarily 63+[5].
- Functional assessment required; dementia alone insufficient[2].

**Data shape:** Limited slots create waitlists; tiered/prioritized access; financials tied to MO HealthNet Medicaid eligibility with specific LOC assessment; statewide but local agency delivery.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.mo.gov/mhd/waivers/1915c-home-and-community-waivers/aged-and-disabled.htm[8]

---

### Senior Independent Living Program (SILP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits detailed in available sources; eligibility focuses on age, residency, and need for services to remain independent at home. Sources do not provide dollar amounts or household size tables.
- Assets: No asset limits specified.
- Missouri resident
- Age 60 or older
- Have lived in Missouri for at least five years (noted in one source)
- Legally in the United States
- Seniors with insufficient resources to age independently in their own homes, facing health or safety barriers

**Benefits:** Wrap-around services tailored to individual needs to help seniors age 60+ remain in their homes; specific services vary by program and include the most utilized categories (e.g., personal care, homemaker services, transportation—not itemized by hours or dollars in sources); goal is to improve health and safety.
- Varies by: region

**How to apply:**
- Contact specific SILP providers directly (no statewide centralized phone or URL listed; programs operated by local agencies)

**Timeline:** Not specified in sources

**Watch out for:**
- Not statewide—only available through specific regional providers in select urban areas; families must contact local SILP directly.
- Not a Medicaid waiver program (distinct from Independent Living Waiver, which targets younger adults 18+ with disabilities).
- Services are needs-based and vary by location/provider—no fixed hours, dollars, or universal list.
- Limited to 4-5 programs; may not cover rural areas.
- No detailed eligibility dollar limits or application forms published, requiring direct provider contact.

**Data shape:** Limited to 4-5 regional providers in urban areas; services customized per SILP with no standardized income/asset tests or statewide application process; data sparse on exact services, timelines, and documents.

**Source:** https://health.mo.gov/seniors/pdf/program-info.pdf or https://oa.mo.gov/sites/default/files/dhss_senior_independent_living_program.pdf

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Missouri Rx Program (MoRx) | benefit | state | deep |
| Missouri Property Tax Credit (Circuit Br | benefit | state | deep |
| Aged and Disabled Waiver (ADW) | benefit | state | deep |
| Senior Independent Living Program (SILP) | benefit | local | deep |

**Types:** {"benefit":4}
**Scopes:** {"state":3,"local":1}
**Complexity:** {"deep":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MO/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **household_size**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Missouri Rx Program (MoRx)**: Eligibility now strictly linked to MO HealthNet enrollment/spenddown (not standalone SPAP); auto-enrollment for qualified; benefits fixed at 50% cost-share regardless of household size; major 2017 changes excluded pure Medicare Part D users; data conflicts on exact income/assets due to dated sources.
- **Missouri Property Tax Credit (Circuit Breaker)**: Income limits differ by single/married and renter vs. full-year owner; credit phases out incrementally by income with separate max amounts ($750/$1,100); no asset test
- **Aged and Disabled Waiver (ADW)**: Limited slots create waitlists; tiered/prioritized access; financials tied to MO HealthNet Medicaid eligibility with specific LOC assessment; statewide but local agency delivery.
- **Senior Independent Living Program (SILP)**: Limited to 4-5 regional providers in urban areas; services customized per SILP with no standardized income/asset tests or statewide application process; data sparse on exact services, timelines, and documents.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Missouri?
