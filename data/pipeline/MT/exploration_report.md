# Montana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

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

- **service**: 2 programs
- **advocacy|service|in_kind**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Big Sky Waiver Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Comprehensive home and community-based services for individuals who would otherwise require nursing facility placement` ([source](https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram))
- **source_url**: Ours says `MISSING` → Source says `https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram`

## New Programs (Not in Our Data)

- **TCARE** — service ([source](https://dphhs.mt.gov/ (contact via Patrick.Kelley@mt.gov or (406) 444-0998)[7]))
  - Shape notes: Evidence-based caregiver assessment program using specialized software; rollout via local Area Agencies on Aging in select areas; no financial eligibility test specified
- **State Health Insurance Assistance Program (S.H.I.P.)** — advocacy|service|in_kind ([source](https://dphhs.mt.gov/SLTC/aging/SHIP))
  - Shape notes: SHIP is a counseling and advocacy program, not a direct financial benefit program. It coordinates access to multiple assistance programs (Medicare Savings Program, Low-Income Subsidy/Extra Help, Big Sky RX Program) which have their own eligibility and application processes. Specific income limits, asset limits, processing times, and required documents are not provided in Montana SHIP materials — families must contact a counselor or visit program-specific websites (apply.mt.gov, SSA.gov) for detailed eligibility information. The program is delivered through a decentralized network of Area Agencies on Aging, so regional variation exists in specific counselor availability but not in core services offered.
- **Commodity Supplemental Food Program (CSFP)** — in_kind ([source](https://dphhs.mt.gov/HCSD/CSFP/[4] and https://www.fns.usda.gov/csfp/eligibility-how-apply[1]))
  - Shape notes: This program's data structure is county-based: eligibility is uniform statewide (age 60+, 150% poverty level), but application, processing, and distribution are handled by separate local county agencies with different contact information, offices, and potentially different wait times. The income limit table scales by household size. Benefits are fixed (not tiered) but distribution methods vary by county provider. The program is exclusively for seniors 60+ in Montana (unlike the federal program which also serves women, infants, and children in other states).

## Program Details

### Big Sky Waiver Program


**Eligibility:**
- Income: {"description":"2025 limits apply; program serves aged, blind, disabled, and disabled but working individuals","individual_applicant":"$967/month","married_both_applying":"$967/month per applicant","married_one_applying":"Individual limit applies; spouse's income disregarded","note":"If only one spouse applies, both spouses' assets are counted as jointly owned"}
- Assets: {"individual":"$2,000","married_both_applying":"$2,000 each","married_one_applying":"Both spouses' combined assets limited to $2,000 (counted as jointly owned)","exempt_assets":["Primary home (unlimited equity)","Household furnishings","One vehicle"]}
- Must require Nursing Facility Level of Care (NFLOC)
- Must be financially eligible for Medicaid
- Must demonstrate need for at least one waiver service on a monthly basis
- Must be Montana resident
- Must have unmet need that can only be resolved through BSW services
- In-person or over-the-phone functional needs assessment required to establish NFLOC

**Benefits:** Comprehensive home and community-based services for individuals who would otherwise require nursing facility placement
- Varies by: Individual needs and assessment; specific services determined through care planning

**How to apply:**
- Phone: Mountain Pacific (800) 219-7035 or (406) 443-4020 (to make referral to BSW)
- In-person: County Office of Public Assistance (OPA) office for Medicaid eligibility determination
- Contact: Eligibility specialists at your county OPA office

**Timeline:** Not specified in available sources
**Waitlist:** Currently has a waiting list (specific wait times by region not provided)

**Watch out for:**
- Program currently has a waiting list — eligibility does not guarantee immediate enrollment
- If only one spouse applies, BOTH spouses' assets are counted as jointly owned and must stay under $2,000 combined — this is a significant limitation for married couples
- Primary home is exempt, but if only one spouse applies and requires care, the non-applicant spouse can continue living in the home (important for married couples)
- Functional needs assessment is required and must demonstrate need for NFLOC — this is not automatic based on age or diagnosis
- Must demonstrate unmet need that can ONLY be resolved through BSW services — other community resources may disqualify applicants
- Income and asset limits are strict ($967/month, $2,000 assets) — Medicaid planning strategies may be necessary for those slightly above limits
- Program operates under Section 1915(c) of Social Security Act, which means it's a waiver program with limited slots and waiting lists
- Services are provided in home and community settings, NOT in institutions — this is the core purpose but means applicants must be able to live in community

**Data shape:** This program's eligibility is highly restrictive on assets and income but flexible on age (serves aged, disabled, and disabled-but-working individuals). The key differentiator is functional need (NFLOC requirement) rather than age. Married couples face a significant gotcha: if only one spouse applies, both spouses' assets are pooled and limited to $2,000. The program has a waiting list, so eligibility ≠ immediate access. Services are individualized based on assessment, not tiered or standardized by category. Regional variation exists primarily through county OPA offices and Mountain Pacific as the referral coordinator, but the program itself is statewide.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dphhs.mt.gov/sltc/csb/BSW/BigSkyWaiverProgram

---

### TCARE

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits mentioned for TCARE; it is a caregiver support program that assesses family caregivers without financial criteria detailed in available sources[7].
- Assets: No asset limits specified[7].
- Family caregivers supporting elderly loved ones (likely 60+ or 65+ based on context of Montana aging programs)[7]
- Caregivers experiencing stress, burnout, or depression[7]

**Benefits:** Assessment of family caregivers using TCARE software to create individualized care plans addressing burnout, stress, and depression; connects caregivers to programs and resources to reduce stress[7].

**How to apply:**
- Contact Patrick Kelly by phone at (406) 444-0998 or email Patrick.Kelley@mt.gov for information on participation[7]
- Referrals through local Area Agencies on Aging (AAA) and participating planning and service areas[7]

**Timeline:** Not specified; soft launch ongoing in participating areas as of 2024-25[7].

**Watch out for:**
- New program with software rollout in soft launch phase; not yet fully statewide—check local AAA availability[7]
- Focuses on caregiver assessment and resource connection, not direct financial aid or personal care services[7]
- Requires referral through participating local agencies, not direct open enrollment[7]

**Data shape:** Evidence-based caregiver assessment program using specialized software; rollout via local Area Agencies on Aging in select areas; no financial eligibility test specified

**Source:** https://dphhs.mt.gov/ (contact via Patrick.Kelley@mt.gov or (406) 444-0998)[7]

---

### State Health Insurance Assistance Program (S.H.I.P.)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available sources. Search results indicate that some assistance programs coordinated through SHIP (such as Medicare Savings Program, Low-Income Subsidy/Extra Help, and Big Sky RX Program) have income and resource requirements, but specific dollar amounts and household-size tables are not provided in the search results.
- Assets: Big Sky RX Program has no resource limits. Other programs coordinated through SHIP have income/resource requirements, but specific asset limits and exemptions are not detailed in available sources.
- Must be a Medicare beneficiary or family member/caregiver of a Medicare beneficiary
- Nationally, SHIP also serves Medicare beneficiaries under age 65 with disabilities and individuals dually eligible for Medicare and Medicaid

**Benefits:** Free, no-cost counseling and education. Services include: one-on-one counseling via phone and in-person; group presentations; education on Medicare eligibility, enrollment, and benefits; Medicare Part D plan comparisons; Medigap (Supplemental) Insurance guidance; Medicare Health Plans information; Medicare Fraud, Waste and Abuse education; Long Term Care options and information; assistance applying for Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy, and Big Sky RX Program. Homebound counseling available in-home if transportation is unavailable.

**How to apply:**
- Phone: 1-800-551-3191 (statewide Montana SHIP line)
- Phone: 406-444-4077 (alternative Montana SHIP contact)
- In-person: Local Area Agency on Aging (referral provided by phone)
- Online: apply.mt.gov (for some assistance programs like Medicare Savings Program)
- Online: SSA.gov (for Low-Income Subsidy/Extra Help application)

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SHIP counselors are NOT insurance agents and cannot sell insurance — they provide objective, independent advice
- SHIP is funded by the Administration on Community Living and is not affiliated with the insurance industry
- Counselors will not make decisions for you; they empower you to make your own decisions
- Some assistance programs (Medicare Savings Program, Low-Income Subsidy/Extra Help, Big Sky RX Program) have separate eligibility requirements and application processes — SHIP can help you apply but does not directly provide these benefits
- Income and resource limits for assistance programs vary and must be verified with SHIP counselor or at apply.mt.gov/SSA.gov
- Homebound individuals should specifically request in-home counseling when calling

**Data shape:** SHIP is a counseling and advocacy program, not a direct financial benefit program. It coordinates access to multiple assistance programs (Medicare Savings Program, Low-Income Subsidy/Extra Help, Big Sky RX Program) which have their own eligibility and application processes. Specific income limits, asset limits, processing times, and required documents are not provided in Montana SHIP materials — families must contact a counselor or visit program-specific websites (apply.mt.gov, SSA.gov) for detailed eligibility information. The program is delivered through a decentralized network of Area Agencies on Aging, so regional variation exists in specific counselor availability but not in core services offered.

**Source:** https://dphhs.mt.gov/SLTC/aging/SHIP

---

### Commodity Supplemental Food Program (CSFP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: 150% of Federal Poverty Level (effective February 13, 2026)[4]. For a household of 1: $35,213 annual / $2,935 monthly / $677 weekly. For each additional household member, add $8,070 annually / $673 monthly[2]. Income is self-declared and not investigated by local agencies[3].
- Assets: Not specified in available search results
- Must be a Montana resident[4]
- Must reside in a county or service area that participates in CSFP[1]
- Cannot simultaneously participate in WIC (Women, Infants, and Children program)[1]
- Women, infants, and children who apply after February 7, 2014 are not eligible for CSFP; they should apply for WIC or SNAP instead[1]

**Benefits:** Monthly food package (approximately 40 pounds) containing: 3 bottles of Ensure Protein Drink, 2 lbs of Cheese, 2 Liquid and/or Powdered Milk, 3 cans/boxes of Fruit, 6-8 cans of variety vegetables/soup/dehydrated potatoes, plus canned meats, pasta/rice, dry beans, peanut butter, fruit juices, dry cereals[3][5]. Foods align with Dietary Guidelines for Americans and contain reduced sodium, saturated fat, and added sugar[4][6].
- Varies by: fixed

**How to apply:**
- In-person: Contact your local county aging services office or CSFP provider (varies by county)
- Mail: Send completed application to your local eligibility office (address varies by county)
- Phone: Call your local eligibility office with questions (numbers vary by county)[4]
- Example: Roosevelt County Aging Services, 124 Custer St, Wolf Point, MT 59201, 406-653-6221[6]; Powell County: 406-846-9789[7]; Richland County Commission on Aging, 2190 W Holly Street, Sidney, MT 59270[2]

**Timeline:** Notification of eligibility, waitlist placement, or ineligibility within 10 days of receipt of correctly completed and signed application[3][4]
**Waitlist:** Yes, slots are limited and there may be a waiting list[6]

**Watch out for:**
- Income limits are 150% of Federal Poverty Level in Montana, which is higher than the federal baseline of 130% for elderly participants, making Montana more generous[1][4]
- Income is self-declared and not verified by local agencies, but false statements could have legal consequences[3]
- Slots are limited and waiting lists exist; availability varies by county[6]
- You cannot receive both CSFP and WIC simultaneously[1]
- Women, infants, and children applying after February 7, 2014 are ineligible for CSFP and must apply for WIC or SNAP instead[1]
- The program is federal, so all food must be delivered; you cannot opt out of receiving items[3]
- Some counties have redesigned distribution to allow 'shopping' for items rather than prepackaged bundles, but this varies by provider[2]
- You have the right to appeal any denial or termination decision and request a fair hearing[3][4]
- Contact your specific county office first, as food pantries and agencies providing CSFP services can change annually[5]

**Data shape:** This program's data structure is county-based: eligibility is uniform statewide (age 60+, 150% poverty level), but application, processing, and distribution are handled by separate local county agencies with different contact information, offices, and potentially different wait times. The income limit table scales by household size. Benefits are fixed (not tiered) but distribution methods vary by county provider. The program is exclusively for seniors 60+ in Montana (unlike the federal program which also serves women, infants, and children in other states).

**Source:** https://dphhs.mt.gov/HCSD/CSFP/[4] and https://www.fns.usda.gov/csfp/eligibility-how-apply[1]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Big Sky Waiver Program | benefit | state | deep |
| TCARE | benefit | local | medium |
| State Health Insurance Assistance Progra | navigator | state | simple |
| Commodity Supplemental Food Program (CSF | benefit | state | deep |

**Types:** {"benefit":3,"navigator":1}
**Scopes:** {"state":3,"local":1}
**Complexity:** {"deep":2,"medium":1,"simple":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/MT/drafts.json`.

- **Big Sky Waiver Program** (benefit) — 4 content sections, 6 FAQs
- **TCARE** (benefit) — 1 content sections, 6 FAQs
- **State Health Insurance Assistance Program (S.H.I.P.)** (navigator) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **Individual needs and assessment; specific services determined through care planning**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Big Sky Waiver Program**: This program's eligibility is highly restrictive on assets and income but flexible on age (serves aged, disabled, and disabled-but-working individuals). The key differentiator is functional need (NFLOC requirement) rather than age. Married couples face a significant gotcha: if only one spouse applies, both spouses' assets are pooled and limited to $2,000. The program has a waiting list, so eligibility ≠ immediate access. Services are individualized based on assessment, not tiered or standardized by category. Regional variation exists primarily through county OPA offices and Mountain Pacific as the referral coordinator, but the program itself is statewide.
- **TCARE**: Evidence-based caregiver assessment program using specialized software; rollout via local Area Agencies on Aging in select areas; no financial eligibility test specified
- **State Health Insurance Assistance Program (S.H.I.P.)**: SHIP is a counseling and advocacy program, not a direct financial benefit program. It coordinates access to multiple assistance programs (Medicare Savings Program, Low-Income Subsidy/Extra Help, Big Sky RX Program) which have their own eligibility and application processes. Specific income limits, asset limits, processing times, and required documents are not provided in Montana SHIP materials — families must contact a counselor or visit program-specific websites (apply.mt.gov, SSA.gov) for detailed eligibility information. The program is delivered through a decentralized network of Area Agencies on Aging, so regional variation exists in specific counselor availability but not in core services offered.
- **Commodity Supplemental Food Program (CSFP)**: This program's data structure is county-based: eligibility is uniform statewide (age 60+, 150% poverty level), but application, processing, and distribution are handled by separate local county agencies with different contact information, offices, and potentially different wait times. The income limit table scales by household size. Benefits are fixed (not tiered) but distribution methods vary by county provider. The program is exclusively for seniors 60+ in Montana (unlike the federal program which also serves women, infants, and children in other states).

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Montana?
