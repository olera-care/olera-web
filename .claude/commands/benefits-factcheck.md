# Benefits Fact-Check Over-Read — Apply an External AI Review

TJ ran the navigator draft queue's "Copy AI review prompt" export through an external AI (ChatGPT/Perplexity/Grok) and now hands you the resulting report — as a file path, a paste, or "here's what Codex said." Your job: over-read it skeptically, verify what matters, apply the surviving corrections upstream, and tell TJ exactly what still needs his hands. This ran for the first time on 2026-07-31 (PRs #1431/#1432) — that session is the reference implementation.

## The posture

The external reviewer is a lead generator, not an authority. It was right about 6 of 7 high-severity claims on the first run — but "mostly right" is exactly why every claim you apply must be re-verified. The failure mode this workflow exists to prevent: SEO aggregator sites echo each other's fictions (the CO "Older Coloradans Cash Fund" — a hallucinated $1,200 consumer grant our own data marked `savingsVerified: true`), so **source-counting proves nothing. Only primary sources settle a claim**: state statute, .gov program pages, the program operator, LIHEAP Clearinghouse, USDA/CMS schedules.

## Procedure

1. **Read the report.** Find the CORRECTIONS block (the export prompt demands one: `[STATE] [program]: [field] — [old] → [new] (source)`). If there isn't one, extract the same structure from the findings tables. Separate corrections (data changes) from pick-fit/voice observations (report those to TJ; they're composer-level, not data).

2. **Verify before applying.** For every high-severity correction, and any correction that removes or fundamentally reclassifies a program: independently confirm via WebFetch/WebSearch against primary sources. Government sites often block fetches (403/ECONNREFUSED) — fall back to WebSearch and read which domain the answer actually comes from. CAUTION (2026-08-01): WebSearch answer summaries can blend aggregator text into what looks like an official page's instruction — a summary claimed ADECA takes LIHEAP applications when ADECA's own page says the opposite. Phone NUMBERS from search summaries held up; ROUTING/PROCESS claims ("call X to apply") did not. For any claim about how to apply, fetch the operator's page directly or treat it as unverified. Med/low corrections (hours, document list wording) may be applied on the report's citation if the cited source is official. **If your verification disagrees with the report, or sources genuinely conflict (see the open MA FEW 60-month dispute), do NOT apply — flag it to TJ as disputed.**

3. **Apply to `data/pipeline/<ST>/drafts.json`** (the source of truth — `drafts.ts` is generated). Write a Node script that locates programs by id/name regex and **fails loudly when a target isn't found**; never silently skip. Conventions:
   - `contacts[0]` is the letter's call anchor — the program's application door, not a generic referral line. 2-1-1 is only acceptable when it genuinely handles the program (TX SNAP) or is honestly labeled as a locator (FL LIHEAP).
   - **Institutional front doors over named-person desk lines.** "Currently published" is not a high enough bar for a phone verdict: the pipeline scraped staff-directory lines (Wake County 2026-07-31 — both top contacts were individual supervisors' desks, "confirmed" by two audit rounds because NCDHHS publishes them). A desk line rots when one person changes roles; a main line survives reorgs. Verify the number is an organization's line; demote desk lines to secondary with a "may change" note, and have the letter call the main line and ask for the unit.
   - `savingsRange` must be a verified figure with its basis in `savingsSource` — maximums labeled as maximums, never "typical" ranges without official support.
   - Stamp `lastVerifiedDate: <today>` on every corrected program.
   - A program that doesn't exist as a consumer benefit gets **removed** — saved references drop out gracefully (`draftFor` returns null) and the page 404s.

4. **Regenerate + de-churn:** `node scripts/benefits-pipeline.js --regen-index`, then revert the untouched states' `drafts.ts` (the regen rewrites all 51 headers with a new timestamp — keep only edited states + real changes; `git diff --numstat` = 1 line means timestamp-only). Then `tsc --noEmit` (run the binary directly, no `timeout` wrapper).

5. **Branch + PR to staging** (`benefits-data-corrections-<date>` off `origin/staging`). PR body: what was verified against what source, what was deliberately not applied and why. Never merge — TJ merges via /pr-merge.

6. **Patch the pending drafts directly — do not hand TJ an edit list.** Already-composed navigator drafts carry the old facts, and drafts are DATABASE rows (`business_profiles.metadata.benefits_navigator`), so corrections reach them without any deploy. For each pending draft citing corrected data: write a patch script with exact-string replacements on the letter body (miss = throw, never silently half-patch), keep the letter's voice (short sentences, 6th grade, no em dashes), fresh-read merge on write, stamp `factcheck_patched_at`. TJ still gates every send, so patched text gets his read at send time. First run: 2026-07-31, 10 letters patched in place. Special cases: a letter whose program was REMOVED can't be text-patched — flag it for TJ to dismiss, or recompose it after the data PR deploys (recompose re-picks from the deployed bundle and will choose the next-best program). Drafts for programs the report didn't cover stay untouched and are named in the summary for the next run.

7. **Report to TJ:** corrections applied (with the one-line-each summary), disputes flagged, pick-fit/voice observations from the report worth a composer-rail change, and the recompose-after-deploy checklist.

## Standing disputes / lessons

- **MA Frail Elder Waiver, 60-month bank statements**: ChatGPT calls it institutional-lookback conflation (45-day current statements per MassHealth verification list); FEW-specific sources say 60 months is required. Unresolved as of 2026-07-31 — data unchanged, letters should soften to "recent bank statements."
- Recurring report themes worth watching: 2-1-1 given as an application door; "families that qualify often save $X" phrasing on figures that are maximums; entry-source inferred as the family's need ("paying for care" ≠ energy bills).
- **Seasonality**: LIHEAP-class programs have application windows (IA: Nov 1–Apr 30, October for 60+; TN: fall portal opening). A letter composed off-season sends a family to call about a program that isn't taking applications — check the window and add a timing sentence, or question the pick. Found 2026-08-01.
