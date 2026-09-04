# Defect Log

> **Owner:** Esther · **Method:** [`../09-TECH-READINESS.md`](../09-TECH-READINESS.md) Pass E.
> **Status:** empty until live validation starts.

Everything found while running test entities end to end. **Log it even if you worked around it** — the
workaround is the finding.

**Severity** uses the same scale as the matrix: **P0** blocks the operating system or risks data ·
**P1** prevents reliable scaling or creates substantial manual work · **P2** meaningful improvement ·
**P3** can wait.

**Type:** bug · UX · missing state · missing comms · manual workaround · instrumentation · permissions ·
handoff.

| # | Stage | User | Type | Expected | Actual | Severity | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

---

## Carried forward from the strategy meeting

Three failures were observed live on 2026-09-04 and belong in the validation pass. Confirm whether each
still reproduces before spending time on it.

| # | Stage | Type | Expected | Actual | Severity | Status |
|---|---|---|---|---|---|---|
| C-1 | Student portal | bug | Magic-link sign-in lands a caregiver on the student portal | Rendered a family-role view; roles confused | ? | To reproduce |
| C-2 | Student portal | bug | Magic-link path completes to the portal | Path broke mid-demo | ? | To reproduce |
| C-3 | Provider portal | UX | Clean end-to-end walkthrough | Multiple placeholder screens and dead ends | ? | To reproduce |

---

## How a defect leaves this log

1. Classified and prioritized during the Day 10 review.
2. **P0 and P1** are fixed in the Days 11–14 window and re-tested in the Day 15 pass.
3. **P2 and P3** move to [`../08-ITERATION-LOG.md`](../08-ITERATION-LOG.md) and wait for real operating data.
4. Anything reclassified as **MANUAL BY DESIGN** moves to the matrix with a named owner and stops being a
   defect.
