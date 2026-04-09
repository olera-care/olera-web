# Ohio Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 36s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 6 |
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

- **service**: 3 programs
- **financial**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Elderly Services Program (ESP)

- **min_age**: Ours says `55` → Source says `60` ([source](https://www.warrencountyohio.gov/HealthFamily/ElderlyServices/Index))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Support services to remain safe and independent at home, including care management, home delivered meals (free to eligible seniors), and other coordinated services like personal care or respite as determined by care plan. Specific services vary by individual assessment[4][5][6].` ([source](https://www.warrencountyohio.gov/HealthFamily/ElderlyServices/Index))
- **source_url**: Ours says `MISSING` → Source says `https://www.warrencountyohio.gov/HealthFamily/ElderlyServices/Index`

## New Programs (Not in Our Data)

- **Healthy Aging Grants** — service ([source](https://aging.ohio.gov/care-and-living/healthy-aging))
  - Shape notes: Funds to counties for subcontracting to local providers; no direct individual eligibility/application; county-specific variations in service mix, priorities, and access; time-limited (10/2023-9/2024)[1][2][3][4].
- **Ohio Senior Citizen Tax Credit** — financial ([source](https://tax.ohio.gov/individual/file-now/senior-citizens-and-ohio-income-tax))
  - Shape notes: This program has two distinct credits with overlapping eligibility but different benefit amounts and income thresholds. The Senior Citizen Credit is a flat $50, while the Qualifying Retirement Income Credit scales up to $200 based on retirement income. The critical gotcha is the lifetime mutual exclusivity with the Lump Sum Distribution Credit. Unlike the Homestead Exemption (a property tax program), this is purely an income tax credit requiring a filed return. No asset limits, no household size adjustments, and no regional variations.
- **Franklin County Senior Services Levy Programs (Senior Options)** — service ([source](https://www.franklincountyohio.gov/Resident-Services/Seniors/Senior-Options-Programs))
  - Shape notes: Senior Options is a coordinated system of home and community-based care services rather than a single benefit program. Eligibility is based solely on age (60+) and county residency with no documented income or asset testing. Benefits are individualized through case management assessment rather than standardized by tier or household size. The program is entirely funded by a county property tax levy, making it vulnerable to voter approval cycles. Service delivery is distributed across a network of partner agencies, not centralized in a single office.

## Program Details

### Healthy Aging Grants

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Priority for low-or-moderate income older Ohioans (at or below 300% of Federal Poverty Guidelines or 65% of area median income for the county and household size, based on most recent data). No strict statewide dollar amounts or table; varies by county and household size. Exact limits set locally by counties[1][2][3].
- Assets: No asset limits specified in program guidelines[1][2][3].
- Services targeted at older adults (60+) disproportionately impacted by COVID-19, such as those facing food/housing insecurity, unemployment, or other priority populations in Ohio’s 2023-2026 State Plan on Aging. Counties self-identify at-risk individuals; no direct individual application by families—services accessed via local county-funded providers[1][2][3].

**Benefits:** Home and community-based services addressing social determinants of health, including: food assistance (at least 20% of funds in some counties), housing assistance (at least 20% in some counties), internet access/digital literacy (at least 10% in some counties), transportation, nutrition, physical activity, health insurance enrollment, financial stability. Evidence-based/informed programs aligned with Ohio’s 2023-2026 State Plan on Aging. No fixed dollar amounts or hours per individual; $40 million total distributed to all 88 counties (most get minimum $100,000+ based on at-risk older residents)[1][2][3][4][5].
- Varies by: region

**How to apply:**
- Families do not apply directly to state program; contact local county aging office or funded providers for services. County commissioners applied via Ohio Grants Portal (https://grantsportal.ohio.gov/)—closed 10/13/2023. Project period: 10/1/2023–9/30/2024[2][4].

**Timeline:** N/A for individuals (not direct grant application)[4].
**Waitlist:** Varies by county and service; regional variation likely[1][5].

**Watch out for:**
- Not a direct grant to families/individuals—counties fund local nonprofits who deliver services. One-time funding (2023-2024); may not renew. Priority on COVID-impacted, not open to all seniors. Families must go through county-specific channels, not state. Application portal closed; now implementation phase[2][4][5].

**Data shape:** Funds to counties for subcontracting to local providers; no direct individual eligibility/application; county-specific variations in service mix, priorities, and access; time-limited (10/2023-9/2024)[1][2][3][4].

**Source:** https://aging.ohio.gov/care-and-living/healthy-aging

---

### Ohio Senior Citizen Tax Credit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"description":"Modified Adjusted Gross Income (AGI) must be less than $100,000","note":"This is an individual income limit, not household-based. The limit applies to the taxpayer's modified AGI."}
- You must have been 65 years of age or older during the tax year
- You did not previously take the Ohio lump sum distribution credit (these two credits are mutually exclusive — you can only claim one in your lifetime)

**Benefits:** $50 fixed credit per tax year; however, a separate Qualifying Retirement Income Credit is also available with a maximum value of $200 for those receiving retirement benefits, annuities, or distributions included in Ohio AGI
- Varies by: fixed

**How to apply:**
- File your current year Ohio state income tax return (Ohio IT 1040)
- Phone: 1-800-282-1780 (Ohio Department of Taxation) — for questions about which form to file

**Timeline:** Not specified in available sources; standard tax return processing timelines apply

**Watch out for:**
- This is a tax credit, not a standalone benefit program — you must file an Ohio income tax return to claim it, even if you would otherwise have no tax liability
- The $50 Senior Citizen Credit and the Lump Sum Distribution Credit are mutually exclusive. If you claim the Lump Sum Distribution Credit, you permanently forfeit the right to claim the $50 Senior Citizen Credit on any future return
- The income limit is $100,000 modified AGI, which is higher than the Homestead Exemption income limit ($38,600 for 2024). Do not confuse these two separate programs
- The Qualifying Retirement Income Credit (up to $200) requires that the retirement income be included in your Ohio AGI — some retirement income may be excluded, making you ineligible for this credit even if you receive retirement benefits
- You must not have previously claimed the lump sum retirement credit to qualify for either the Senior Citizen Credit or the Qualifying Retirement Income Credit
- This credit is nonrefundable, meaning it can only reduce your tax liability to zero; it cannot generate a refund

**Data shape:** This program has two distinct credits with overlapping eligibility but different benefit amounts and income thresholds. The Senior Citizen Credit is a flat $50, while the Qualifying Retirement Income Credit scales up to $200 based on retirement income. The critical gotcha is the lifetime mutual exclusivity with the Lump Sum Distribution Credit. Unlike the Homestead Exemption (a property tax program), this is purely an income tax credit requiring a filed return. No asset limits, no household size adjustments, and no regional variations.

**Source:** https://tax.ohio.gov/individual/file-now/senior-citizens-and-ohio-income-tax

---

### Elderly Services Program (ESP)


**Eligibility:**
- Age: 60+
- Income: No strict income qualification; many services free, others on sliding fee scale based on ability to pay. Eligibility for each service determined by care manager during home visit[4][5][6].
- Assets: No asset limits mentioned; needs-based assessment only[4][5][6].
- Warren County (primarily), Clinton County, Butler County, Hamilton County residents[4][5][6][8]
- 60 years or older[6][8]
- Require help with Activities of Daily Living (ADLs) and Instrumental Activities of Daily Living (IADLs)[6]
- Assessment by ESP care manager during home visit[4][5][6]

**Benefits:** Support services to remain safe and independent at home, including care management, home delivered meals (free to eligible seniors), and other coordinated services like personal care or respite as determined by care plan. Specific services vary by individual assessment[4][5][6].
- Varies by: needs_assessment

**How to apply:**
- Phone: (513) 695-2271 for Lebanon & surrounding areas (Warren County Community Services Intake)[6]
- Email: Contact WCCS intake department[6]
- Online intake form available in some regions (e.g., Community First Solutions ESP Intake Form)[7]
- In-person: Home visit assessment follows intake

**Timeline:** Not specified; begins with intake call/email, followed by home visit for assessment[6].
**Waitlist:** Not mentioned[6].

**Watch out for:**
- Not statewide—limited to specific counties (e.g., Warren primary); not Medicaid/PASSPORT (those have income/asset limits and nursing home-level care needs)[1][2][4]
- No automatic eligibility—must have home visit assessment by care manager for each service[4][5][6]
- Some services sliding fee, not all free despite 'no income qualification'[6]
- Often confused with PASSPORT Medicaid waiver, which requires Medicaid eligibility and higher care needs[1][2]

**Data shape:** County-specific (Warren-led), no income/asset tests, services determined post-home assessment by care manager, funded by local levy—not statewide Medicaid program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.warrencountyohio.gov/HealthFamily/ElderlyServices/Index

---

### Franklin County Senior Services Levy Programs (Senior Options)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Search results do not provide income thresholds or limits.
- Assets: Not specified in available sources. Search results do not provide asset limits or exemptions.
- Must reside in Franklin County, Ohio[1]
- Younger spouses of eligible residents may participate in meals and other programs[6]

**Benefits:** Multiple services including: home delivered meals, homemaker services, personal care, respite care, adult day care, transportation to medical facilities (including wheelchair transportation), emergency response systems, minor home repair, information and referrals, case management, and caregiver relief[1][5]. Adult day care includes health services, personal care, meals, activities, transportation, and may include social work services and rehabilitation therapies[1]. Caregiver Support Program provides assistance on a short-term basis limited to three months[7].
- Varies by: Service availability and intensity vary by individual need and case management assessment. Approximately 70% of enrolled participants receive case management development and ongoing case management, while approximately 30% receive face-to-face case management through partner agencies[3].

**How to apply:**
- Online enrollment (specific URL not provided in sources)[1]
- Phone: (614) 525-6200, weekdays 9 AM–4:30 PM ET; Thursday 9 AM–7 PM[1][5]
- In-person or mail application methods not explicitly detailed in available sources

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- No income or asset limits are documented in available sources — families should verify directly with the program whether means-testing applies, as this is unusual for property-tax-funded senior services[1][2]
- The program is entirely dependent on passage of the Senior Services Levy, a property tax renewal. Without levy passage, the program shuts down entirely[2]. The most recent levy cycle (2023–2027) was approved in 2022; families should verify current levy status[4]
- Caregiver Support Program assistance is limited to three months, not ongoing[7]
- The program serves over 60,000 seniors as of 2023, suggesting potential high demand; processing times and waitlist status are not documented[2]
- This is a 'one-stop shop' for information and referrals, but actual service delivery is coordinated through a network of partner agencies — not all services may be directly provided by Franklin County Office on Aging[1][3]
- Reasonable donations are suggested for meals and other programs, though eligibility is not contingent on ability to pay[6]

**Data shape:** Senior Options is a coordinated system of home and community-based care services rather than a single benefit program. Eligibility is based solely on age (60+) and county residency with no documented income or asset testing. Benefits are individualized through case management assessment rather than standardized by tier or household size. The program is entirely funded by a county property tax levy, making it vulnerable to voter approval cycles. Service delivery is distributed across a network of partner agencies, not centralized in a single office.

**Source:** https://www.franklincountyohio.gov/Resident-Services/Seniors/Senior-Options-Programs

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Healthy Aging Grants | benefit | state | deep |
| Ohio Senior Citizen Tax Credit | benefit | state | medium |
| Elderly Services Program (ESP) | resource | local | simple |
| Franklin County Senior Services Levy Pro | benefit | local | medium |

**Types:** {"benefit":3,"resource":1}
**Scopes:** {"state":2,"local":2}
**Complexity:** {"deep":1,"medium":2,"simple":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/OH/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **region**: 1 programs
- **fixed**: 1 programs
- **needs_assessment**: 1 programs
- **Service availability and intensity vary by individual need and case management assessment. Approximately 70% of enrolled participants receive case management development and ongoing case management, while approximately 30% receive face-to-face case management through partner agencies[3].**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Healthy Aging Grants**: Funds to counties for subcontracting to local providers; no direct individual eligibility/application; county-specific variations in service mix, priorities, and access; time-limited (10/2023-9/2024)[1][2][3][4].
- **Ohio Senior Citizen Tax Credit**: This program has two distinct credits with overlapping eligibility but different benefit amounts and income thresholds. The Senior Citizen Credit is a flat $50, while the Qualifying Retirement Income Credit scales up to $200 based on retirement income. The critical gotcha is the lifetime mutual exclusivity with the Lump Sum Distribution Credit. Unlike the Homestead Exemption (a property tax program), this is purely an income tax credit requiring a filed return. No asset limits, no household size adjustments, and no regional variations.
- **Elderly Services Program (ESP)**: County-specific (Warren-led), no income/asset tests, services determined post-home assessment by care manager, funded by local levy—not statewide Medicaid program
- **Franklin County Senior Services Levy Programs (Senior Options)**: Senior Options is a coordinated system of home and community-based care services rather than a single benefit program. Eligibility is based solely on age (60+) and county residency with no documented income or asset testing. Benefits are individualized through case management assessment rather than standardized by tier or household size. The program is entirely funded by a county property tax levy, making it vulnerable to voter approval cycles. Service delivery is distributed across a network of partner agencies, not centralized in a single office.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Ohio?
