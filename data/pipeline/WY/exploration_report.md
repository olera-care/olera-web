# Wyoming Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.025 (5 calls, 2.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 3 |
| Programs deep-dived | 3 |
| New (not in our data) | 0 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **financial**: 3 programs

## Data Discrepancies

Our data differs from what official sources say:

### Wyoming State Parks Senior Discounts

- **source_url**: Ours says `MISSING` → Source says `https://wyoparks.wyo.gov/index.php/permits-reservations/permits-fees`

### Low Income Energy Assistance Program (LIHEAP)

- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/`

### Wyoming Tax Refund for Elderly & Disabled

- **source_url**: Ours says `MISSING` → Source says `https://www.lincolninst.edu/app/uploads/legacy-files/gwipp/upload/sources/Wyoming/2017/WY_Tax_Refund_for_Elderly_and_Disabled_Wyoming_Department_of_Health_2013.pdf (2013/2017 info; check Wyoming Department of Health for current)`

## Program Details

### Wyoming State Parks Senior Discounts


**Eligibility:**
- Age: 62+
- Income: No income limits; available to all Wyoming residents aged 62 and older.
- Assets: No asset limits.
- Must be Wyoming resident.

**Benefits:** Reduced fees for day-use, camping, and cabin rentals at Wyoming state parks and historic sites. Exact discount percentages or amounts not specified in sources; applies to activities like fishing, hiking, and camping.

**How to apply:**
- No formal application or pass purchase required; present proof of age (photo ID) and Wyoming residency at park entrance or historic site to receive reduced fees.
- Phone: 877-WYO-PARK (for general permits info, though not specific senior process).
- Online reservations with discounts: reserve.wyoming.gov (proof required on-site).

**Timeline:** Immediate at point of entry; no processing needed.

**Watch out for:**
- Discounts not automatic—must request and show proof of age/residency each time.
- Separate from federal Senior Pass (for national parks like Yellowstone).
- Annual camping passes (resident-only) provide discounts but are not senior-specific; seniors get on-the-spot reductions instead.
- No dedicated senior pass sticker; differs from states with formal senior passes like Nevada or Texas.
- Historic sites may have fixed senior pricing (e.g., $9 adult/$4.50 youth at some, but seniors qualify for reduced).

**Data shape:** No formal pass or application; simple proof-of-age/residency discount at entry. No income/asset tests. Distinct from annual resident passes which require purchase.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://wyoparks.wyo.gov/index.php/permits-reservations/permits-fees

---

### Low Income Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Annual household income (before taxes) at or below 60% of state median: 1 person: $60,609; 2: $61,986; 3: $63,364 (full table not complete in sources; for >8 add $1,377 per person). Equivalent monthly: 1: $2,985; 2: $3,904; 3: $4,823; 4: $5,741; 5: $6,660; 6: $7,579. Automatic eligibility if household receives SNAP, SSI, TANF, or certain veterans benefits.[1][2]
- Assets: No asset limits mentioned in current program details.[1][2]
- Wyoming resident.
- Need financial assistance for home energy costs.
- For crisis assistance: immediate threat like shut-off, fuel hook-up deposit, or heating failure in winter months (requires completing regular LIEAP application first).[1]

**Benefits:** Regular heating: one-time payment to utility (max $2,176, min $49). Crisis: winter max $550 (summer not available). Paid directly to utility/vendor for heating costs Nov-May. Related weatherization: insulation, heating repairs (separate program).[1][2][4]
- Varies by: household_size|priority_tier|fuel_type

**How to apply:**
- Phone: (800) 246-4221.
- Email: lieapinfo@wyo.gov.
- Online (implied via contractors like NOWCAP, specifics via phone/email).
- Mail or in-person via regional contractors (contact via phone for locations).[1][5][6]

**Timeline:** Not specified; funding limited, may close early.[2][6]
**Waitlist:** Funding limited; applications may stop if funds exhausted (no formal waitlist mentioned).[2]

**Watch out for:**
- Applications Oct 1 - Apr 30 (2025-2026 season; heating through Mar 31, crisis to Apr 15); funds limited, may close early.
- Crisis requires regular app first.
- Everyone at address counts as household (even non-sharing expenses).
- Elderly: no special age priority beyond automatic via SSI; compare to property tax relief (different income/asset rules, residency req).[1][2][3][6]

**Data shape:** Income at 60% state median (recent ~$60k for 1); automatic eligibility via SNAP/SSI/TANF; crisis tiered; statewide but contractor-processed; seasonal/funding-limited.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/

---

### Wyoming Tax Refund for Elderly & Disabled


**Eligibility:**
- Age: 65 or older, or 18 or older and totally (100%) disabled for at least one full year prior to application+
- Income: Single: less than $17,500 per year (full refund if $10,000 or below; prorated $10,001-$17,500). Married: less than $28,500 per year (full refund if $16,000 or below; prorated $16,001-$28,500). Note: Older sources cite lower limits like $13,500 single/$? married with proration from $8,000, indicating possible updates.
- Assets: Total household assets must not exceed $29,950 per adult household member. Specific exemptions not detailed in sources.
- Wyoming resident for 12 months prior to application date
- Must submit new application each year
- Three applicant types: single, joint (married), or joint with deceased spouse (if spouse died in prior 1-2 years)

**Benefits:** Single: $250 to $800 (prorated by income). Married: $216 to $900 (prorated by income). Helps cover sales/use taxes, property taxes, utility/energy costs.
- Varies by: income_level

**How to apply:**
- Mail or in-person to Wyoming Department of Health (specific addresses not in results; contact WDH)
- Phone: Not specified in results; contact Wyoming Department of Health

**Timeline:** Not specified; refunds typically processed annually

**Watch out for:**
- Must reapply every year with new application
- Totally (100%) disabled for full year prior; not partial disability
- Income limits and refund amounts may have changed since 2013 data (e.g., older 2006/2007 figures differ)
- Asset limit per adult household member; excludes unclear items
- Distinguish from separate Property Tax Refund Program (administered by Dept. of Revenue, different eligibility like 5-year residency, median income-based)

**Data shape:** Annual reapplication required; refund prorated by income tiers (full below threshold, phased out above); statewide but data outdated (2013+); separate from property tax programs with different admins/eligibility

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.lincolninst.edu/app/uploads/legacy-files/gwipp/upload/sources/Wyoming/2017/WY_Tax_Refund_for_Elderly_and_Disabled_Wyoming_Department_of_Health_2013.pdf (2013/2017 info; check Wyoming Department of Health for current)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Wyoming State Parks Senior Discounts | benefit | state | medium |
| Low Income Energy Assistance Program (LI | benefit | federal | deep |
| Wyoming Tax Refund for Elderly & Disable | benefit | state | medium |

**Types:** {"benefit":3}
**Scopes:** {"state":2,"federal":1}
**Complexity:** {"medium":2,"deep":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/WY/drafts.json`.

- **Wyoming State Parks Senior Discounts** (benefit) — 2 content sections, 5 FAQs
- **Low Income Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Wyoming Tax Refund for Elderly & Disabled** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 1 programs
- **household_size|priority_tier|fuel_type**: 1 programs
- **income_level**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Wyoming State Parks Senior Discounts**: No formal pass or application; simple proof-of-age/residency discount at entry. No income/asset tests. Distinct from annual resident passes which require purchase.
- **Low Income Energy Assistance Program (LIHEAP)**: Income at 60% state median (recent ~$60k for 1); automatic eligibility via SNAP/SSI/TANF; crisis tiered; statewide but contractor-processed; seasonal/funding-limited.
- **Wyoming Tax Refund for Elderly & Disabled**: Annual reapplication required; refund prorated by income tiers (full below threshold, phased out above); statewide but data outdated (2013+); separate from property tax programs with different admins/eligibility

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Wyoming?
