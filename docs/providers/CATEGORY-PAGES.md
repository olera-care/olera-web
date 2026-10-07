# Category-specific provider pages

TJ, 6 Oct 2026: "Category-specific provider pages, like home care and nursing homes, should not have the same form factor." One template for every category is wrong. This doc scopes the change from data, sets the section order per category, and records what is built and what is only planned.

**Built:** Home Care and Nursing Home section orders, and a Facebook link for every category (`lib/provider-section-order.ts`, `app/provider/[slug]/page.tsx`).
**Planned only:** Home Health, Assisted Living, Memory Care, Independent Living. Until each gets its own order, it keeps the original one (`DEFAULT_SECTION_ORDER`).

## 1. What is actually populated

Counted on 7 Oct 2026 against production, non-deleted rows only. Percentages are the share of the category's rows with the field present.

### Directory (`olera-providers`), which is what about 99% of pages render

| Category | Rows | Phone | Website | Description | Photos | Price | Google reviews | 10+ reviews | CMS data | CMS 4-5 stars (shown) | Trust signals | Facebook (raw) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home Health Care | 19,306 | 94% | 68% | 100% | 50% | 31% | 63% | 21% | 16% | 4% | 1% | 28% |
| Assisted Living | 17,359 | 93% | 76% | 99% | 72% | 39% | 82% | 47% | 7% | 3% | 45% | 39% |
| Home Care (Non-medical) | 13,118 | 90% | 83% | 99% | 64% | 59% | 69% | 36% | 3% | 1% | 55% | 40% |
| Nursing Home | 10,844 | 95% | 86% | 100% | 80% | 32% | 90% | 76% | 36% | 12% | 1% | 45% |
| Independent Living | 6,680 | 93% | 83% | 99% | 78% | 47% | 88% | 56% | 4% | 2% | 48% | 34% |
| Memory Care | 4,019 | 94% | 83% | 100% | 74% | 24% | 82% | 51% | 8% | 3% | 38% | 44% |

The directory has **no columns** for care types, services, amenities, hours, availability, bed count or Medicare/Medicaid acceptance. "Services" on an unclaimed page is the category's inferred default list (`getCategoryServices`), not provider data. CMS data on Nursing Homes carries `overall_rating`, `health_inspection_rating`, `staffing_rating`, `quality_rating`, `deficiency_count`, `penalty_count`, `total_fines` and `abuse_icon` for 3,740 of 3,857 rows, but the page only shows CMS publicly at 4 or 5 stars (a standing decision; lower scores rank only).

### Claimed profiles (`business_profiles`, claimed, active organizations)

| Category | Claimed | Care types | Itemized pricing | Price range | Staff screening | Payments accepted | Medicaid/Medicare flags | Year founded | Bed count | Photos | Manager | Amenities | Hours |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home Care | 287 | 287 | 20 | 40 | 81 | 128 | 127 | 95 | 3 | 141 | 96 | 0 | 0 |
| Assisted Living | 163 | 162 | 7 | 15 | 24 | 27 | 27 | 10 | 9 | 30 | 18 | 0 | 0 |
| Independent Living | 118 | 118 | 2 | 5 | 6 | 6 | 6 | 4 | 0 | 6 | 6 | 0 | 0 |
| Home Health | 114 | 114 | 1 | 7 | 24 | 27 | 27 | 16 | 0 | 36 | 15 | 0 | 0 |
| Nursing Home | 44 | 43 | 0 | 2 | 5 | 7 | 7 | 5 | 1 | 13 | 4 | 0 | 0 |
| Memory Care | 14 | 14 | 1 | 1 | 1 | 1 | 1 | 0 | 0 | 4 | 1 | 0 | 0 |

A further ~260 claimed rows carry a legacy category string ("Home Care (Non-medical)", "Assisted Living", ...) or none, and are almost empty. **Nobody records amenities or hours anywhere.** A page section for either would be empty on every provider today.

### Facebook (`olera-providers.facebook_url`, migration 273)

27,870 rows have a value, but about 3,200 are not a provider's page and the page refuses them (`safeFacebookUrl`):

| Value | Rows | Why it is wrong |
|---|---|---|
| `facebook.com/2008/fbml` | 1,514 | The sweep matched the old `xmlns:fb` namespace in page markup |
| `facebook.com/profile.php` | 1,336 | The sweep drops the query string, so the `?id=` that names the page is gone |
| `facebook.com/wix`, `wordpresscom` | 224 | Site-builder footer links |
| `facebook.com/share/...` | 120 | Share buttons |

A second, softer issue: 394 URLs are shared by 5 or more providers (9,725 rows), almost all corporate brand pages (Brookdale 556, LHC Group 230, Sunrise 206). On a location's page that link is the company's Facebook, not the location's. It is shown; see the open decision in the PR.

## 2. What families ask, per category

`provider_questions`, weighted by `asked_count`, top suggestion keys. Caveat: most rows start from the suggested-question chips each category shows (`getSuggestedQuestions`), so the topic list is partly what we offered. Within the offered set, what families pick is still signal.

| Category | Asks | Top topics (asks) |
|---|---|---|
| Home Care | 2,289 | minimum visit hours (111), meet the caregiver first (109), hourly rates (72), backup caregiver (70), background checks (47), consistent caregiver (30), medication reminders (24) |
| Nursing Home | 1,196 | Medicare/Medicaid for the stay (94), staff-to-patient ratio (40), visiting hours (38), rehab to long-term (21), Medicare quality rating (13), private rooms (10) |
| Home Health | 1,635 | Medicare coverage (142), when the nurse starts (53), insurance plan accepted (47), physical therapy at home (42), when authorization ends (38), doctor coordination (33) |
| Assisted Living | 3,211 | what the monthly cost includes (187), bringing furniture (103), touring (84), Medicaid/LTC insurance (75), activities (50), medical emergencies (48), extra care costs (42) |
| Independent Living | 6,870 | monthly fee inclusions (156), waitlist (132), affordable options (106), pets (102), floor plans (90), future care options (81) |
| Memory Care | 268 | staff-to-resident ratio (18), dementia safety (13), outdoor access (10), sundowning support (8), caregiver training (5) |

Read across: home care families ask **who the caregiver is and how scheduling works** before price. Nursing home and home health families ask **whether Medicare or Medicaid pays**. Assisted and independent living families ask **what the monthly price includes**.

## 3. Section order per category

Every section hides itself when empty, as before. An order only decides what comes first among the sections a provider has. Highlights stay in the hero for every category.

### Home Care (built)

| # | Section | Shown when | Why here |
|---|---|---|---|
| 1 | Care Services | always (inferred list if no data) | TJ: lead with services |
| 2 | Staff Screening | provider entered screening (81 claimed) | caregiver questions are the top topic |
| 3 | Verified credentials | trust signals > 0 (55%) | State Licensed, background checks: the screening answer for unclaimed pages |
| 4 | Itemized pricing | provider entered rows (20 claimed) | hourly rates; the headline price is already in the hero |
| 5 | Google reviews | any reviews (69%) | |
| 6 | Q&A | always (family context) | |
| 7 | Benefits | state has programs | |
| 8 | Payment options | provider entered (128 claimed) | |
| 9 | About | always | |
| 10 | Manager | provider entered | |
| 11 | Reviews empty state | no Google reviews | |
| 12 | CMS quality | 4-5 stars (1%) | rarely applies to non-medical home care |

**Hours/availability** has no data source. The minimum-visit-hours and backup-caregiver questions are answered today only through Q&A. Collecting it is new data collection, out of scope here; it is the first field to add to the provider portal for home care.

### Nursing Home (built)

| # | Section | Shown when | Why here |
|---|---|---|---|
| 1 | CMS quality | 4-5 stars (12%) | the comparison families make first |
| 2 | Google reviews | any reviews (90%) | |
| 3 | Payment options | provider entered (7 claimed) | Medicare/Medicaid is the top question |
| 4 | Q&A | always (family context) | |
| 5 | Verified credentials | trust signals > 0 (1%) | |
| 6 | Care Services | always | |
| 7 | Staff Screening | provider entered | |
| 8 | Benefits | state has programs | |
| 9 | About | always | |
| 10 | Itemized pricing | provider entered | |
| 11 | Manager | provider entered | |
| 12 | Reviews empty state | no Google reviews | |

**Gaps:** beds and Medicare/Medicaid acceptance are not in the directory. CMS-certified homes are, by definition, certified for Medicare and/or Medicaid, so a "Medicare/Medicaid certified" line could be derived from `cms_data.ccn` without new collection; it was left out because the brief allows no new data logic. The 88% of nursing homes below 4 stars show no CMS section at all; whether to show inspection history (deficiencies, penalties) regardless of stars is a decision for TJ, not this PR.

### Home Health (planned)

Lead with payment and services: Medicare coverage dominates questions. Order: Google reviews, Payment options, Care Services, Q&A, CMS quality (4-5 stars, 4%), Staff Screening, Benefits, About, Itemized pricing, Manager. CMS star data exists for 16% of rows; the same show-below-4 decision applies.

### Assisted Living (planned)

Lead with price and what it includes: Itemized pricing, Google reviews, Q&A, Care Services, Verified credentials (45%), Payment options, Benefits, About, Manager. Amenities and levels of care have no data; the "what the monthly cost includes" question needs a pricing-inclusions field in the portal before a section can answer it.

### Memory Care (planned)

Lead with safety and staffing: Staff Screening, Verified credentials (38%), Care Services, Google reviews, Q&A, Itemized pricing, Payment options, About, Manager. Staff ratio and dementia safety questions have no structured data yet.

### Independent Living (planned)

Same as Assisted Living, with Benefits lower (less coverage relevance). Floor plans, pets and waitlist have no data; photos (78%) carry most of the weight.

## 4. Contact block: Facebook

Shown for every category, in the hero identity block (under the address on desktop, under the location on mobile), when `safeFacebookUrl` accepts the value. The link is `nofollow` and opens in a new tab. It is not added to the JSON-LD `sameAs`: with ~11% junk and many brand-level pages in the column, asserting identity to search engines should wait until the sweep is fixed.

**Follow-ups, not in this PR:**
1. Fix the sweep (`scripts/sweep-provider-websites.ts`): keep `profile.php?id=`, skip the `2008/fbml` namespace and builder footers, then null the bad rows.
2. Decide whether brand-level Facebook pages should show on location pages.
3. Once clean, add Facebook to `sameAs`.
