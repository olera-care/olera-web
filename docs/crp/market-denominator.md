# Market Denominators: the auditable calculations (2026-08-19)

Supports "The market" paragraph in research-strategy.md. The prose states three
numbers simply; this note preserves the arithmetic, sources, and conservatism
decisions so every figure survives audit. Bibliography keys in references.yaml.

## 1. The ~half-trillion-dollar care economy

| Component | Figure | Source | Quality |
|---|---|---|---|
| Home health care | $147.8B (2023), +10.8%/yr | CMS NHE (`nhe2023`) | Federal, primary |
| Nursing care facilities & CCRCs | $211.3B (2023), +9.5%/yr | CMS NHE (`nhe2023`) | Federal, primary |
| Non-medical home care | >$100B (analyst range $101-162B; ~7%/yr) | `homeCareMarketEst` | Industry, conservative floor; CP Table 6 consistent |
| Senior/assisted living | ~$94.2B (2023) | `seniorLivingRev2023` | Industry statistics |
| **Sum** | **~$553B** | | Stated as "roughly half a trillion" |

Overlap notes: CCRC assisted-living units sit inside the NHE nursing/CCRC line
and may partially overlap the senior-living industry figure; NHE's home health
line captures some personal care that analyst home-care figures also count.
"Roughly half a trillion" absorbs both overlaps with margin. Growth claim:
both NHE lines near 10%/yr; home care ~7%/yr; driven by population aging
(`censusProj2023`).

## 2. The ~165,000 provider denominator

| Segment | Count | Source |
|---|---|---|
| Non-medical home care agencies | ~100,000 (est.; state-licensed, no single federal registry) | industry estimates; CP Table 6 |
| Senior living & memory care communities | ~31,000 | CDC NPALS residential care (`cdcNpals2020`); memory care treated as a subset, not additive |
| CMS-certified home health agencies | ~11,000 | NPALS / CMS |
| Skilled nursing facilities | ~15,000 | NPALS |
| Hospices | ~5,000 | NPALS |
| Adult day services centers | ~4,600 | NPALS |
| **Total** | **~165,000** | matches CP Table 6 / Serviceable Market |

Double-counting treatment: memory care embedded in residential care (not added);
CCRC care levels embedded in their categories (not added); agencies holding both
Medicare home-health and private-duty licenses could appear in two rows, a small
overlap relative to the ~100K estimate's own stated uncertainty. The ~100K
state-licensed home care figure is the largest and softest input; the CP's own
caveat ("licensed by states rather than tracked through a single federal
system") is the honest label. NPALS's 68,150 is the federal floor.

## 3. The ≥$5B/year marketing-and-recruiting estimate (`oleraAcqSpendEst`)

| Component | Calculation | Result |
|---|---|---|
| Senior living client acquisition | $94.2B × 3% sales/marketing (low end of 3-6% benchmark, `slSalesMarketingBench`) | ~$2.8B |
| Home care advertising | $100B × 1.1% advertising (`homeCareAdSpendStudy`) | ~$1.1B |
| Home care caregiver recruiting | ~2.9M home-based direct-care workers (PHI) × ~75% turnover (Activated Insights, evidence ledger) ≈ 2M+ hires/yr × $520 median acquisition cost (`caregiverCAC2025`) | ~$1.1B |
| **Conservative floor** | | **~$5B/yr** |

Deliberately excluded (all downward-biasing): home health, hospice, and skilled
nursing marketing (no benchmark pulled → zeroed); nursing and assisted-living
staff recruiting (~1.2M workers, ~50%+ turnover → zeroed); referral and
placement fees beyond counted marketing budgets (A Place for Mom/Caring.com
charge $3,000-$6,000 per placement, per CP Table 7); the $520 per-hire figure is
the cheapest (word-of-mouth) channel median; 3% is the maintenance-mode floor
while much of the industry is in growth mode (6-10%). Mid-range read: $6-8B/yr.

## Retired figures (do not reintroduce)

- $173.6B home-care industry, $76B senior-living industry, $2.4B long-term-care
  software market: unsourced analyst figures from the pre-2026-08-19 paragraph,
  replaced by the federal-anchored components above. The "$2.4B LTC software"
  framing also misdescribed the addressable market (the Provider Tools compete
  for marketing and recruiting spend, not software licenses).

## Upgrade path

Pull the sales/marketing and recruitment chapters of the Activated Insights
Benchmarking Report (team has access; the evidence ledger already uses its
turnover figure) to replace the 1.1% single-study input and the word-of-mouth
CAC median with fuller per-channel data, and trace `seniorLivingRev2023` to
AHCA/NCAL primary data at the citation-integrity pass.

## Referral placement fee, sized (added 2026-08-19, competitive pass)

The competitive paragraph says referral marketplaces "charge roughly a month's
rent per placement," which is what the Washington Post's 2024 investigation
established (a fee equal to about one month's fees for a successful placement;
`wapoAPFM2024`). The dollar magnitude follows from the CareScout/Genworth Cost
of Care Survey 2024: assisted living ran a national median of $5,900 a month
($70,800 a year), up 10% year over year
(https://assets.carescout.com/55da049c1f/282102.pdf, verified 2026-08-19). That
brackets the CP's $3,000-$6,000 per-placement range without needing the
secondary industry sources the range currently rests on. No sentence in the
Research Strategy states the dollar figure, so the CareScout entry was kept out
of `references.yaml` rather than left as an uncited orphan; reinstate it if the
CP pass decides to state the range in prose.
