# Week-by-week plan to CRP submission, house style

Attachment to `../../Olera_Pre_CRP_Commercialization_and_Execution_Plan.pdf`.
Two pages, PDF and Word, both.

```
python3 build_plan.py                  # plan.html, then print to PDF
WORD_EXPORT=1 python3 build_plan.py    # plan_word.html
python3 mkdocx_plan.py                 # Olera_Pre_CRP_Week_by_Week_Plan.docx
```

## Where the content comes from

Everything traces to the memo. Nothing here adds a commitment the memo does not
already make.

| Plan element | Memo source |
|---|---|
| The four tracks running through every week | Section 1, Table 1 |
| Beachhead, offers, pricing, sales workflow | Section 2 |
| Pre-CRP product completion plan | Section 4, Pre-CRP row |
| Buyer hypothesis, interview guide, evidence requirements | Section 5 |
| Investor updates and milestone-tied support | Section 6 |
| Month checkpoints and the January minimums | Section 7, Table 3 |
| Month-by-month shape resolved to weeks | Section 8, Table 4 |
| Monday stand-up, Friday numbers, monthly review | Section 11, third bullet |
| The three items to confirm before approving | Section 11, first two bullets |

## Calendar facts the plan is built on

- Week 1 is the week of Monday 31 August 2026. Week 18 ends Friday 1 January 2027.
- Week 13 contains Thanksgiving, weeks 17 and 18 contain Christmas and New Year.
  No new work is planned into any of them.
- The internal deadline is **Week 16, 18 December**, not 1 January. The memo's own
  instruction to avoid holiday-dependent late rescue plans is what drives this.

## A note on the Word export

`mkdocx_plan.py` differs from its siblings in one place: a table cell containing
`<br>` becomes one paragraph per line rather than one run with breaks in it.
Run-level breaks came out of Word with the formatting bleeding across lines.
