# New Mexico Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.025 (5 calls, 38s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 3 |
| Programs deep-dived | 3 |
| New (not in our data) | 3 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 1 programs
- **in_kind**: 1 programs
- **financial**: 1 programs

## New Programs (Not in Our Data)

- **Community Benefit Program (Centennial Care)** — service ([source](https://www.hca.nm.gov/community-benefit-program/))
  - Shape notes: This program has a dual-track structure: (1) for those with full-coverage Medicaid through standard income/asset limits, and (2) for those without Medicaid eligibility who enter a waitlist-based allocation system. The functional requirement (NFLOC + 2+ ADL assistance) is consistent across both tracks. Income and asset limits are indexed annually (2025 and 2026 figures provided). Home equity protections create significant exemptions for homeowners. MCO enrollment is a critical but often-missed requirement. Specific service types, hours, and dollar amounts are not detailed in available documentation.
- **New Mexico Senior Farmers' Market Nutrition Program (SFMNP)** — in_kind ([source](https://www.nmwic.org/fmnp/[3]))
  - Shape notes: One-time fixed annual benefit; automatic eligibility via other programs like CSFP/SNAP; statewide but first-come-first-served with seasonal issuance (e.g., July); honey exclusive to seniors
- **PNM Good Neighbor Fund** — financial ([source](https://www.pnm.com/goodneighborfund))
  - Shape notes: Proof-based via LIHEAP/SNAP (no direct income test); seniors prioritized with auto-max grant; PNM-service-area restricted; varies by admin partner/location.

## Program Details

### Community Benefit Program (Centennial Care)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ (elderly) OR 0-64 (disabled); persons over 64 who are disabled qualify under the aged category[1]+
- Income: {"description":"Two pathways to financial eligibility[1]","pathway_1_full_coverage_medicaid":{"single_senior_2025":"$967/month","married_couple_2025":"$1,450/month (regardless of whether one or both spouses apply)[1]"},"pathway_2_waiver_category":"Available for those who do not qualify for full-coverage Medicaid but meet functional needs; allocation-based through Central Registry[7]"}
- Assets: {"single_applicant_2026":"$2,000 in countable assets[3]","what_counts":"Liquid assets and financial holdings","home_equity_exception":"Home equity interest up to $730,000 is exempt if applicant lives in home or has Intent to Return[1]","spouse_in_home_exception":"Home is protected if spouse lives in home[1]","minor_or_disabled_child_exception":"Home is protected if minor child or disabled adult child lives in home[1]"}
- Must be New Mexico resident[1][4]
- Must require Nursing Facility Level of Care (NFLOC)[1][4]
- Must need assistance with 2 or more Activities of Daily Living (ADLs): bathing, dressing, eating, toileting, mobility, transitioning[1]
- Functional assessment required to determine NFLOC[1]
- Dementia diagnosis alone does not automatically qualify; functional assessment still required[1]
- Must have full Medicaid coverage OR waiver category of eligibility (COE) through allocation process[4]

**Benefits:** Home and community-based long-term care services allowing individuals to remain in their homes instead of nursing facilities; specific services and hours not detailed in search results[1][4]
- Varies by: Individual need and allocation; specific service levels not provided in available documentation

**How to apply:**
- Online: yes.nm.gov or Centennial Care website[7]
- Phone: 1-800-283-4465 (MCO enrollment and eligibility information)[7]
- Phone: 1-800-318-2596 (general Medicaid application)[5]
- In-person: New Mexico Human Services Department field office[5]
- Paper application: Available through HSD field offices[5]
- For waiver allocation (if not Medicaid-eligible): Email abcbproviderenrollment@state.nm.us to be placed on Central Registry[8]

**Timeline:** Not specified in available documentation
**Waitlist:** Central Registry maintained by New Mexico Aging and Long-Term Services Department (ALTSD) for those who need long-term services but do not qualify for full-coverage Medicaid; slots available based on need[7][8]

**Watch out for:**
- MCO enrollment required: If already enrolled in full-coverage Medicaid but NOT with an MCO, must enroll with an MCO to receive Community Benefit services[7]
- Functional assessment is mandatory: Having a qualifying diagnosis (even dementia) does not automatically qualify; a functional assessment determining need for 2+ ADL assistance is required[1]
- Two pathways with different processes: Full-coverage Medicaid applicants follow one path; those without Medicaid eligibility must apply through Central Registry waitlist[7][8]
- Home equity limit is substantial but not unlimited: $730,000 home equity exemption exists, but exceeding this disqualifies applicants[1]
- Intent to Return matters: If applicant is temporarily out of home, 'Intent to Return' must be documented to protect home equity[1]
- 120-day minimum in Agency-Based Community Benefit before switching to Self-Directed Community Benefit[6]
- Income limits are monthly, not annual: $967/month for single seniors (2025) is approximately $11,604 annually[1]
- Spouse's income may affect eligibility: Married couples have different limits; verify if both spouses must apply[1]

**Data shape:** This program has a dual-track structure: (1) for those with full-coverage Medicaid through standard income/asset limits, and (2) for those without Medicaid eligibility who enter a waitlist-based allocation system. The functional requirement (NFLOC + 2+ ADL assistance) is consistent across both tracks. Income and asset limits are indexed annually (2025 and 2026 figures provided). Home equity protections create significant exemptions for homeowners. MCO enrollment is a critical but often-missed requirement. Specific service types, hours, and dollar amounts are not detailed in available documentation.

**Source:** https://www.hca.nm.gov/community-benefit-program/

---

### New Mexico Senior Farmers' Market Nutrition Program (SFMNP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 or older for non-Native American individuals; 55 or older for Native American individuals[1][2][3]+
- Income: Household income at or below 185% of the federal poverty level. Exact amounts vary by household size and year; for example, in 2021-2022, $1986 monthly for household of 1 (older guidelines shown in sources; check current via federal poverty levels link on nmwic.org). Participation in SNAP, TEFAP, or CSFP may qualify automatically without income proof[2][3][5][8]
- Assets: No asset limits mentioned in program sources[1][2][3]
- Reside in New Mexico[1][2][3]
- First-time and previous applicants must reapply annually to confirm eligibility[2]

**Benefits:** One-time annual stipend of up to $50 (some sources note up to $100 for 2024) provided as electronic shopper card or coupon to buy locally grown fresh fruits, vegetables, herbs, and honey (honey only for seniors) at participating farmers' markets, roadside stands, and mobile markets[1][2][3][4][5]
- Varies by: fixed

**How to apply:**
- Online: Senior Online Application at nmwic.org[3]
- Phone: 505-469-0548 or 575-528-5197 (office), 575-649-0754 (mobile)[2][5]
- Email: DOH.FMNP@state.nm.us[5]
- Mail: New Mexico WIC Farmers Market Nutrition Program, 2040 S. Pacheco St., Santa Fe, NM 87505[3][5]
- In-person: New Mexico Senior Centers, Commodity Supplemental Food Locations, New Mexico Public Health WIC Clinics, or Farmers Market Program State office at 2040 South Pacheco St., Santa Fe, NM 87505[3]

**Timeline:** Benefits issued within the month of July (historical); open enrollment example began Feb 15 for that year[2][5]
**Waitlist:** First-come, first-served basis; may fill up[5]

**Watch out for:**
- Must reapply every year even if previously eligible[2]
- First-come, first-served and may run out of funds[5]
- Benefits only at authorized farmers/markets (not wholesalers or distributors); eligible foods strictly fresh, local, unprocessed produce/herbs/honey[3][4]
- Native American age threshold is lower (55+ vs 60+)[1][2][3]
- Income at exactly 185% FPL; check current guidelines as they update annually[3][8]

**Data shape:** One-time fixed annual benefit; automatic eligibility via other programs like CSFP/SNAP; statewide but first-come-first-served with seasonal issuance (e.g., July); honey exclusive to seniors

**Source:** https://www.nmwic.org/fmnp/[3]

---

### PNM Good Neighbor Fund

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income at or below 150% of the Federal Poverty Level (FPL). Proof required via current-year LIHEAP or SNAP participation (no specific dollar table provided in sources; FPL varies by household size and is updated annually by HHS).[1]
- Assets: No asset limits mentioned.
- PNM electric customer.
- Proof of current-year LIHEAP or SNAP participation.
- Past-due balance or disconnect notice on PNM bill (not required for seniors 60+).
- Valid photo ID matching the name on the PNM account.[1][2]

**Benefits:** Direct credit to PNM electric bill. Seniors (60+) automatically approved for maximum grant (sources vary: $120[1], up to $175[2][3], up to $370 once per year[7]). General low-income: portion of past-due bill (specific amounts not fixed; emergency aid once per calendar year).[1][2][7][8]
- Varies by: priority_tier

**How to apply:**
- Online: Visit pnm.com/help or pnm.com/goodneighborfund to apply.[1][4]
- Phone: 1-888-342-5766.[7]
- In-person: By appointment at community agency offices (e.g., Rio Grande Food Project, 600 Coors Blvd. NW, Albuquerque, NM 87121; walk-ins Wed/Fri 9-11 a.m., or call 505-526-1005 for appt.); pop-up events like Goodwill or MLK March.[1][2]
- Mail: Not specified.

**Timeline:** Not specified; on-site events provide immediate help.
**Waitlist:** Not mentioned.

**Watch out for:**
- Must be PNM customer; not for other utilities.
- Requires current-year LIHEAP/SNAP proof—no standalone income verification.
- Seniors exempt from past-due notice but still need LIHEAP/SNAP proof.
- Once per calendar year only.
- By appointment only at most locations; bring all docs or cannot apply.[1]
- Grant amounts inconsistent across sources (check current via official site).[1][2][7]

**Data shape:** Proof-based via LIHEAP/SNAP (no direct income test); seniors prioritized with auto-max grant; PNM-service-area restricted; varies by admin partner/location.

**Source:** https://www.pnm.com/goodneighborfund

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Community Benefit Program (Centennial Ca | benefit | state | deep |
| New Mexico Senior Farmers' Market Nutrit | benefit | state | deep |
| PNM Good Neighbor Fund | benefit | local | deep |

**Types:** {"benefit":3}
**Scopes:** {"state":2,"local":1}
**Complexity:** {"deep":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NM/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **Individual need and allocation; specific service levels not provided in available documentation**: 1 programs
- **fixed**: 1 programs
- **priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Community Benefit Program (Centennial Care)**: This program has a dual-track structure: (1) for those with full-coverage Medicaid through standard income/asset limits, and (2) for those without Medicaid eligibility who enter a waitlist-based allocation system. The functional requirement (NFLOC + 2+ ADL assistance) is consistent across both tracks. Income and asset limits are indexed annually (2025 and 2026 figures provided). Home equity protections create significant exemptions for homeowners. MCO enrollment is a critical but often-missed requirement. Specific service types, hours, and dollar amounts are not detailed in available documentation.
- **New Mexico Senior Farmers' Market Nutrition Program (SFMNP)**: One-time fixed annual benefit; automatic eligibility via other programs like CSFP/SNAP; statewide but first-come-first-served with seasonal issuance (e.g., July); honey exclusive to seniors
- **PNM Good Neighbor Fund**: Proof-based via LIHEAP/SNAP (no direct income test); seniors prioritized with auto-max grant; PNM-service-area restricted; varies by admin partner/location.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Mexico?
