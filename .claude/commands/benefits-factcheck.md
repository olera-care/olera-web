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

## What the reviewer is actually looking at (read before trusting a verdict)

Two mechanics decide whether a reported "correction" is real. Both were discovered on 2026-08-07 after the reviewer flagged GA data that had been fixed a week earlier.

- **The export prompt renders the draft's frozen `pick` snapshot, not live pipeline data.** A draft stores `metadata.benefits_navigator.pick` at compose time. Step 6 patches letter bodies but historically left the snapshot alone, so corrected programs kept re-appearing in later reviews with their pre-correction values, and the plan page kept rendering them. **Always diff the CORRECTIONS block against the current `drafts.json` before verifying anything** — on 2026-08-07, 2 of 18 were already-fixed ghosts. And when you patch a body, refresh the snapshot in the same write.
- **The composer shows only `documentsNeeded.slice(0, 3)`** (`lib/family-comms/benefits-cascade.server.ts:309`). The reviewer sees three documents and reasonably concludes the rest are missing; usually the right items are in the list but buried. So most document corrections are **reorderings, not replacements** — lead with what the operator actually asks for on a first call. Check the full array before rewriting it.

Corollary for phones: `toPick` takes the first contact with a non-null `phone`. A `contacts[0]` with `phone: null` silently falls through to whatever is next, which is how WV VISIONS letters ended up sending people to 2-1-1 instead of the program's own line. A null phone on the lead contact is a bug, not a blank.

## Standing disputes / lessons

- **MA Frail Elder Waiver, 60-month bank statements**: ChatGPT calls it institutional-lookback conflation (45-day current statements per MassHealth verification list); FEW-specific sources say 60 months is required. Unresolved as of 2026-07-31 — data unchanged, letters should soften to "recent bank statements."
- Recurring report themes worth watching: 2-1-1 given as an application door; "families that qualify often save $X" phrasing on figures that are maximums; entry-source inferred as the family's need ("paying for care" ≠ energy bills).
- **Savings fields drift from their own record.** CT Respite's `savingsRange` read "$1,500 – $6,000/year" while the same program's tagline, intro, `savingsSource`, and FAQ all said $7,500. Before web-verifying a savings claim, grep the whole record for the figure — an internal contradiction settles it faster than a source does, and it tells you which field is the outlier.
- **A call anchor can be a real number for the wrong thing.** CO SNAP pointed at (888) 328-2656, which is genuinely the EBT customer service line and genuinely answers, but it handles lost cards and cannot take an application. "The number works" is not the test; "the number does the thing the letter says" is. Found 2026-08-07.
- **Seasonality**: LIHEAP-class programs have application windows (IA: Nov 1–Apr 30, October for 60+; TN: fall portal opening). A letter composed off-season sends a family to call about a program that isn't taking applications — check the window and add a timing sentence, or question the pick. Found 2026-08-01.
