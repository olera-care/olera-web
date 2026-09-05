# MedJobs role Operations Manuals

Three role views of `../matrix-src/MATRIX.md`, which stays the canonical source
of truth for the operating model.

```
FULL SYSTEM OPERATIONS  (matrix-src/MATRIX.md)
        |
   canonical source of truth
        |
  +-----+-----+-----------+
  ADMIN       SALES       CRM
  Admin Team  Sales Lead  User Success Manager
```

| Source | Role | Deliverable | Pages |
|---|---|---|---|
| `ADMIN.md` | Admin Team | `../MedJobs_Admin_Team_Operations.pdf` | 11 |
| `SALES.md` | Sales Lead | `../MedJobs_Sales_Lead_Operations.pdf` | 9 |
| `CRM.md` | User Success Manager | `../MedJobs_User_Success_Manager_Operations.pdf` | 12 |

```
python3 build_roles.py     # all three, and copies them to docs/medjobs/
python3 validate.py        # consistency check against the master
```

## The rule these documents live by

They are **filtered and reorganised views of one operating system**, not three
interpretations of it. Same terminology, same stage names and numbering, same
ownership and handoffs, same definitions, same sequence, same business rules,
same distinction between Portal-supported and human-led work.

Where the master does not specify something a role needs, the manual carries a
**GAP / DECISION NEEDED** block rather than inventing a procedure. There are two
of those beyond the master's own deferred build list:

- **ADMIN** and the provider cadence. The master records that Graize's written
  protocol calls it the D0 to 30 campaign while what ships is three emails and
  two calls over seven days, and says plainly that this is *"flagged rather than
  reconciled."*
- **SALES** and the provider meeting agenda. PR2 says to *"run the standard
  structure"* and gives only its closing move. The master specifies the ST2
  meeting channel by channel and never sets out the provider meeting's agenda.

## Role mapping, from the master's own owner lines

| Stage | Master owner | Manual |
|---|---|---|
| PR1, PR-OUT, ST1, ST-OUT | Admin Team | ADMIN |
| PR2, ST2 | Sales Lead | SALES |
| PR3, MA3, MA4, MA5 | User Success Manager | CRM |
| ST3 to ST7 | User Success Manager, with the Sales Lead where a physician in the room changes the answer | CRM, with the boundary stated in SALES |
| ST8, QUAL, MA1, MA2 | Portal | CRM, as the exception handler the master names |

Booking the 30-minute slot sits inside PR2 and ST2 but the master assigns it to
the Admin Team, so ADMIN carries it and SALES describes receiving it.

## How the build works

`build_roles.py` imports `md2html.build` from `../matrix-src`, so the four
documents cannot drift apart typographically. What it adds:

- **A nav bar of internal anchors** at the top of each manual, and a return link
  at the end of every section. Chromium's print-to-PDF turns both into real PDF
  GoTo links, verified by `validate.py`'s sibling check in the build log and by
  reading the links back with pymupdf.
- **Field tables.** A stage's operating spine is a headerless two-column table.
  They are tagged by shape rather than with `attr_list`, which does not attach
  to a table in python-markdown.
- **Gap blocks.** `<div class="gap" markdown="1">`, which needs the `md_in_html`
  extension. It was added to the shared `md2html.py`; the matrix source has no
  markdown attributes, so its render is unaffected.
- **A page break before every h2**, so a section always starts at the top of a
  page and the jump targets stay stable. `.nobreak` opts the first one out.

The role sources contain **no em dashes**, so they need no `dedash.py` pass. The
build asserts this.

## Page numbers

`app/admin/medjobs/sop/*/page.tsx` holds a jump bar per manual whose page
numbers mirror the PDF's own anchors. Re-derive them after a rebuild:

```
python3 -c "
import pymupdf
for f in ('admin','sales','crm'):
    d = pymupdf.open(f + '.pdf'); seen = {}
    for l in d[0].get_links():
        n = l.get('nameddest')
        if n and n != 'top' and n not in seen: seen[n] = l['page'] + 1
    print(f, d.page_count, seen)
"
```

## What validate.py checks

Mechanical checks only. It cannot judge whether a sentence means the same thing;
it catches the drift that is checkable.

1. **Stage codes.** Every PR/ST/MA/QUAL code used exists in the master.
2. **Vocabulary.** No term the master never uses, and no *human*.
3. **Role names.** Written exactly as the master writes them, every time.
4. **Ownership.** Each manual claims only the stages the master's owner line
   gives it, and CRM names itself the exception handler on the four Portal
   stages rather than their owner.
5. **Completion criteria.** Carried word for word, compared with punctuation and
   HTML entities normalised away.
6. **Deferred items.** Every B-number cited exists, and each manual carries every
   deferred item that sits on a stage it works.
7. **Structure.** The five orientation headings, the nav bar, a return link per
   section, and the gaps and traceability sections.

It exits non-zero on any failure, so it belongs in front of a rebuild.
