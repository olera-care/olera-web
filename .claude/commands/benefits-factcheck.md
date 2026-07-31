# Benefits Fact-Check Over-Read — Apply an External AI Review

TJ ran the navigator draft queue's "Copy AI review prompt" export through an external AI (ChatGPT/Perplexity/Grok) and now hands you the resulting report — as a file path, a paste, or "here's what Codex said." Your job: over-read it skeptically, verify what matters, apply the surviving corrections upstream, and tell TJ exactly what still needs his hands. This ran for the first time on 2026-07-31 (PRs #1431/#1432) — that session is the reference implementation.

## The posture

The external reviewer is a lead generator, not an authority. It was right about 6 of 7 high-severity claims on the first run — but "mostly right" is exactly why every claim you apply must be re-verified. The failure mode this workflow exists to prevent: SEO aggregator sites echo each other's fictions (the CO "Older Coloradans Cash Fund" — a hallucinated $1,200 consumer grant our own data marked `savingsVerified: true`), so **source-counting proves nothing. Only primary sources settle a claim**: state statute, .gov program pages, the program operator, LIHEAP Clearinghouse, USDA/CMS schedules.

## Procedure

1. **Read the report.** Find the CORRECTIONS block (the export prompt demands one: `[STATE] [program]: [field] — [old] → [new] (source)`). If there isn't one, extract the same structure from the findings tables. Separate corrections (data changes) from pick-fit/voice observations (report those to TJ; they're composer-level, not data).

2. **Verify before applying.** For every high-severity correction, and any correction that removes or fundamentally reclassifies a program: independently confirm via WebFetch/WebSearch against primary sources. Government sites often block fetches (403/ECONNREFUSED) — fall back to WebSearch and read which domain the answer actually comes from. Med/low corrections (hours, document list wording) may be applied on the report's citation if the cited source is official. **If your verification disagrees with the report, or sources genuinely conflict (see the open MA FEW 60-month dispute), do NOT apply — flag it to TJ as disputed.**

3. **Apply to `data/pipeline/<ST>/drafts.json`** (the source of truth — `drafts.ts` is generated). Write a Node script that locates programs by id/name regex and **fails loudly when a target isn't found**; never silently skip. Conventions:
   - `contacts[0]` is the letter's call anchor — the program's application door, not a generic referral line. 2-1-1 is only acceptable when it genuinely handles the program (TX SNAP) or is honestly labeled as a locator (FL LIHEAP).
   - `savingsRange` must be a verified figure with its basis in `savingsSource` — maximums labeled as maximums, never "typical" ranges without official support.
   - Stamp `lastVerifiedDate: <today>` on every corrected program.
   - A program that doesn't exist as a consumer benefit gets **removed** — saved references drop out gracefully (`draftFor` returns null) and the page 404s.

4. **Regenerate + de-churn:** `node scripts/benefits-pipeline.js --regen-index`, then revert the untouched states' `drafts.ts` (the regen rewrites all 51 headers with a new timestamp — keep only edited states + real changes; `git diff --numstat` = 1 line means timestamp-only). Then `tsc --noEmit` (run the binary directly, no `timeout` wrapper).

5. **Branch + PR to staging** (`benefits-data-corrections-<date>` off `origin/staging`). PR body: what was verified against what source, what was deliberately not applied and why. Never merge — TJ merges via /pr-merge.

6. **Close the loop on pending drafts.** Already-composed navigator drafts carry the old facts. List which pending drafts cite corrected data. The fix is the drawer's **Recompose** button — but it re-drafts from the *deployed* bundle, so the order is: merge data PR → promote to main → then recompose. Until deploy, recompose reproduces the stale facts. A letter whose program was removed entirely can't recompose (409) — TJ dismisses it.

7. **Report to TJ:** corrections applied (with the one-line-each summary), disputes flagged, pick-fit/voice observations from the report worth a composer-rail change, and the recompose-after-deploy checklist.

## Standing disputes / lessons

- **MA Frail Elder Waiver, 60-month bank statements**: ChatGPT calls it institutional-lookback conflation (45-day current statements per MassHealth verification list); FEW-specific sources say 60 months is required. Unresolved as of 2026-07-31 — data unchanged, letters should soften to "recent bank statements."
- Recurring report themes worth watching: 2-1-1 given as an application door; "families that qualify often save $X" phrasing on figures that are maximums; entry-source inferred as the family's need ("paying for care" ≠ energy bills).
