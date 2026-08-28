# Commercialization Plan, compression and consistency passes

**Date:** 2026-08-28
**Input:** the rebased plan, 21 pages.
**Output:** `Olera_CRP_CommercializationPlan_rebased.pdf` and `.docx`, **12 pages each**.
**Reduction:** 9,489 words to 6,340 (33%); 16 figures to 5; 13 tables to 10.
**Method:** deletion, not rewriting. 151 deletions removed 3,399 words of prose. Every deleted
sentence is listed in `removed-material-cp-compression.md`. `audit_edits.py` re-splits each edited
paragraph and classifies every surviving sentence: 221 are verbatim or clean truncations, and the
50 it flags are section, figure and table renumbering plus five paragraph joins created by removing
a middle sentence.

---

## 1. Major cuts and consolidations

### Figures: 16 to 5

Kept: the vicious cycle (Fig 1), the Valley of Death (Fig 2), the product and county figure
(Fig 3), the growth flywheel (Fig 4), organic traffic (Fig 5). Three of the five float, so they
cost almost no vertical space.

| Cut | Why it was safe |
|---|---|
| Care pathway spine | Its seven steps are the seven columns of Figure 3 and the seven rows of Table 1. |
| Progression, R&D to commercial scale | The paragraph beneath it said the same thing in the same order; the paragraph is cheaper. |
| Management capacity | Restated three surrounding paragraphs with no added information. |
| Two markets | Every value in it (4.68M aides, 760,500 openings, 75% turnover, 35.2M MA, 14.3M ACO) is in the two paragraphs above it, with the citations. |
| IP protections | 4.34in for four categories the Protection strategy paragraph already names. The largest figure in the document against the shortest section. |
| Financing transition | The two Finance paragraphs state the same timing: federal during, Staffing revenue from Year 2, third-party before runway ends. |
| Local-market process | The Market selection paragraph carries the same sequence. |
| Replication economics | The same three scale points ($3.0M, $7.5M, $15M) are in the paragraph above it. |
| Evidence chain | Uncaptioned, unnumbered, and a restatement of the institutional paragraphs. |
| Revenue by year | Table 8 carries the same series and adds Years 5 to 10. |
| Stages and gates | Table 9's Period and Decision columns carry it. |

### Tables: 13 to 10, and the survivors trimmed

- **Fundraising plan** cut. Its three rows are the Fundraising Plan paragraph and Table 9's gate column.
- **Management timeline**: the *Research and product execution* column removed. The paragraph
  introducing it already says the experimental timeline lives in the Research Strategy, so the
  column was duplicating another attachment. Remaining cells shortened.
- **Olera at a glance**: 12 rows to 9. Technical, Operations and Research merged into one **Team**
  row; Finance and Regulatory merged.
- **Model inputs**: the two *equation* rows removed (both equations are stated in the prose) and
  the *institutional payment precedent* row removed (GUIDE and the ACO market are in the paragraph
  below with the same citations).
- **Current approaches**: the *What exists today* column removed; *Where families still fall off*
  carries the weakness the brief asks for.
- Cell text tightened in the acquisition, impact, SBIR-history and hurdles tables.

### Prose

The heaviest repetition was structural. Each of these was established once and repeated downstream:

| Repeated concept | Was in | Now in |
|---|---|---|
| CareNavigator and Caregiver Staffing defined | 8 places | Sections 1 and 2, once each |
| Two buyer classes / two revenue engines | 5 places | Sections 4 and 8 |
| County as the unit of commercialization | 4 places | Sections 4 and 7 |
| Y1 build / Y2 free / Y3 paid chronology | 8 places | Section 8 and Table 9 |
| Post-CRP third-party capital | 7 places | Section 6 |
| Provider remains the employer of record | 3 places | Sections 2 and 4 |
| Interoperability with general-purpose AI | 3 places | Sections 4 and 7 |
| $120K / $600K / $1.5M revenue figures | 6 places | Section 6 and Tables 8, 9 |
| AHRQ 52%/34% utilization statistic | 2 places | Section 1, cross-referenced from Section 8 |

Also removed: nine closing or transitional paragraphs that only summarised the section above them
(the ends of Sections 1, 2, 3, 4 and 7), the five risk paragraphs' second sentences (each restated
the aim that follows), and the "Working legal basis for drafting" paragraph, which was an
instruction to consult counsel rather than a statement about Olera's IP.

**Not cut, deliberately.** Every quantitative claim, every citation, the five expected outcomes,
the market-acceptance hurdles, the competitive landscape, the financing gap arithmetic, the
unit economics, the named investors, the advisor credentials, and the SBIR history table.

---

## 2. Logical inconsistencies corrected

| # | Found | Resolution |
|---|---|---|
| 1 | **Two sections numbered 9** (Production and Marketing, Revenue Stream); sections ran 1, 2, 3 unnumbered then 4, 5, 7, 9, 9, 11 with no 6, 8 or 10. | Renumbered 1 to 9 in document order. The order already matches SF424's a→g with the Statement of Need first, so only the numbers moved. |
| 2 | **"Section 10 describes how these activities convert into revenue"** (twice) pointed at the Revenue Stream, which was numbered 9. | Both now point to Section 8. |
| 3 | **"Section 9" was ambiguous**, used four times for the Revenue Stream and once for Production and Marketing, both numbered 9. | Resolved by the renumbering. |
| 4 | **Two figures numbered 10**, no Figure 9, two placeholders numbered "Figure X", one figure with no caption at all. | Surviving figures renumbered 1 to 5; every in-text reference updated. |
| 5 | **Two tables numbered 4, two numbered 5, no Table 3, one "Table X".** | Surviving tables renumbered 1 to 9; every in-text reference updated. |
| 6 | **Table 9's milestone column carried the gate column's text.** My own cell edits used post-drop column indices while the edit layer applies before the column drop. | Indices corrected; the two columns now carry different content. |
| 7 | **Figure 1's caption said unmet needs "drive" a vicious cycle**; the source says "can drive". A hedge had been dropped, strengthening a causal claim. | "can drive" restored. |
| 8 | **The pricing-plausibility argument was lost.** Cutting the prose that duplicated Table 7's benchmark numbers also removed the inference the table cannot make, that $250 is modest against the burden providers already bear. | Restored as one sentence pointing at Table 7. |
| 9 | **Table 4's caption used a colon** where all others use a period. | Normalised. |
| 10 | **The plan ended mid-sentence**: "…in response to measured technical, market, workforce, economic, and outcome". | Sentence removed. See item 7 below. |

### Verified consistent, no change needed

The quantitative spine reconciles end to end, including the arithmetic:

- 8 markets x 10 hires/month x $250 = **$20,000/month = $240,000 annualised run rate**, matching
  Section 8 and Section 6.
- 6 paid-month equivalents x $20,000 = **$120,000 recognised in Year 3**, matching Table 8's
  footnote, Table 9 and Section 6.
- Year 4: 15 markets x $30,000 = **$450,000 Staffing**, matching Table 8.
- Year 5 lower bound: 25 counties x $30,000 = **$750,000**, matching Table 8's $0.75M.
- 500 counties x $30,000 = **$15.0M**, matching Section 8 and Table 8.
- Year 5 institutional: 3 relationships x $250K = **$750,000**, matching Table 8's $0.75M.
- Financing gaps: $1.4M − $600K = **$800K**; $1.85M − $1.5M = **$350K**. Both as stated.

Also verified stable: the Year 1 build / Year 2 validate free / Year 3 monetize / Year 4 expand /
Year 5 scale chronology in the prose, Figure 2, Table 8 and Table 9; one local market = one county
in Sections 4 and 7; Staffing serving provider workforce need independently of CareNavigator-
generated cases in Sections 4, 7 and 8; and the four participant classes (family users, provider
customers, institutional customers, caregiver participants) used consistently.

---

## 3. Items requiring your judgment

| # | Issue | Why I did not decide it |
|---|---|---|
| **1** | **Table 8 shows ~$150K institutional revenue in Year 4 against one relationship, while Table 7 values a relationship at ~$250K a year.** Year 5 reconciles exactly (3 x $250K = $750K), so Year 4 implies a partial year, but nothing says so. | Either add a footnote like Table 8's Staffing footnote, or change the number. Both are your call. |
| **2** | **Qiping Fan is "MD, MS" in Section 3 (twice) and "PhD" in Section 9.** | A fact about a person. I cannot tell which is right. |
| **3** | **Two citation numbering schemes still collide**: Section 4 uses 26 to 34, Section 8 uses 1 to 8. There is still **no bibliography in the document**. | You deferred the citation pass. Merging the schemes without the list present would destroy the mapping you need. |
| **4** | **`[refs]` twice and `[cite]` once remain in Section 1**, on page 1. | The sources for those three claims are not in the repository. |
| **5** | **The four-advantages table in Section 4 is the only table with no number and no caption.** | The source had it that way. Numbering it shifts every table after it; leaving it unnumbered is also defensible. |
| **6** | **Terminology variants for the same capabilities.** "Task-based AI Agent Execution" / "AI execution layer" / "AI-supported execution" / "AI-agent execution"; "Analytic Outcomes Data" / "Longitudinal outcomes layer" / "longitudinal care-establishment and outcomes architecture". | Unifying them is rewriting, which you asked me not to do in this pass. |
| **7** | **The plan now ends on Table 9's caption**, because the closing sentence was truncated in the source and I removed it. | A one-sentence close would be a new sentence, not a cut. |
| **8** | **Figure 3 is 5.0in tall, the largest single object in the document**, and its bottom third is labelled ILLUSTRATIVE ONLY. | If your own pass needs another half page, that register is the cheapest cut available. I left it because you asked for all three registers. |
| **9** | **Section 2's heading** reads "What does CRP create?" after the earlier one-line request, where the rest read naturally with "this". | Trivial, but it is now the only heading phrased that way. |

---

## Verification

- 12 pages in both the PDF and the `.docx`.
- No em dashes.
- Type: 11pt body, 9.5pt and up inside figures, 9pt tables and captions, 8pt superscript markers only.
- All 16 figures pass the glyph-box check (`checkfigs.py`): nothing clipped, off the artboard, or overlapping.
- All section, figure and table numbers and every cross-reference resolve.
