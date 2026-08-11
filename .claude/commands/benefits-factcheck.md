# Benefits Fact-Check Over-Read — Apply an External AI Review

TJ ran the navigator draft queue's "Copy AI review prompt" export through an external AI (ChatGPT/Perplexity/Grok) and now hands you the resulting report — as a file path, a paste, or "here's what Codex said." Your job: over-read it skeptically, verify what matters, apply the surviving corrections upstream, and tell TJ exactly what still needs his hands. This ran for the first time on 2026-07-31 (PRs #1431/#1432) — that session is the reference implementation.

## The posture

The external reviewer is a lead generator, not an authority. It was right about 6 of 7 high-severity claims on the first run — but "mostly right" is exactly why every claim you apply must be re-verified. The failure mode this workflow exists to prevent: SEO aggregator sites echo each other's fictions (the CO "Older Coloradans Cash Fund" — a hallucinated $1,200 consumer grant our own data marked `savingsVerified: true`), so **source-counting proves nothing. Only primary sources settle a claim**: state statute, .gov program pages, the program operator, LIHEAP Clearinghouse, USDA/CMS schedules.

**Open question on the round trip itself (raised 2026-08-07, undecided).** On that round the reviewer produced 14 usable leads out of 18, every one of which had to be re-verified from scratch, and two were overruled. It is a lead generator whose leads we re-derive — a lot of human latency for TJ (copy, paste, wait, paste back) on a mechanical step. The independence is still worth something: a different model catches what a Claude-only pipeline would systematically miss, which is a real argument against dropping it. Two reshapes are on the table, TJ's call and not yours: keep it but shrink the prompt via the `lastVerifiedDate` gate and the offline lint, or invert it so Claude subagents generate leads and the external model is used only as an adversarial check on disputed and high-severity items. **Until TJ decides, run it as written.**

**2026-08-11 datapoint for that decision.** 12 corrections offered, 11 survived verification — a good hit rate. But the parallel subagents re-derived every one from scratch and independently turned up roughly eight things the reviewer missed or got wrong: SD's service-area list (5 towns vs the operator's 20) and its statewide-scope problem, GA's fourth eligibility gate, LA (its single highest-impact finding, filed as a "pick fit" aside rather than a correction), FL meals' dead citation, the NM `$100` provenance, two unsourced phone numbers, and KY's level-of-care claim. Two of its citations 404'd. The reviewer's durable value was **targeting** — naming which programs to open — which the `lastVerifiedDate` gate plus the lint could do offline for free. The independence argument still stands on its own merits; this is one round's evidence, not a verdict.

## Speed budget (added 2026-08-07)

The 2026-08-07 round took over two hours. Much of that was one-time discovery now written down below, but the recurring cost was real. **Target for a steady-state round: 15–20 minutes of Claude time, a couple of minutes of TJ's.** If you are exceeding that, you are probably re-verifying something already verified, or fetching serially.

The order of leverage is **shrink → automate → parallelize**, in that order. Parallelism is the third lever, not the first.

1. **Shrink the input.** Do not review a program whose `lastVerifiedDate` is within 30 days unless the report flags it high-severity. On 2026-08-07 this alone would have cut 13 programs to roughly 4. The export should gate on this itself (see Code dependencies); until it does, drop fresh programs yourself before verifying anything.
2. **Lint offline first.** Most findings are instances of a few recurring patterns, not novel facts. Run the mechanical checks below with zero network calls before touching the report. CT's 2026-08-07 error was findable with a grep: `savingsRange` said "$1,500–$6,000" while the same record's tagline, intro, `savingsSource`, and FAQ all said $7,500.
3. **Parallelize the residue.** Whatever survives 1 and 2 gets one subagent per program, each hunting primary sources and returning a structured verdict. Wall clock becomes the slowest single verification, not the sum. Do NOT verify 18 claims in serial batches of three — that was the single largest recurring cost on 2026-08-07.

### Offline lint — run these before any web call

Each is a pure data check over `data/pipeline/*/drafts.json`. All produced real findings on 2026-08-07:

- **Medicare "Parts A and B" on a non-Medicare program.** Grep `documentsNeeded[0..2]` for `/parts a and b/i`, cross-reference `structuredEligibility.summary` and `name` for `/waiver|medicaid|nursing home level/i`. 49 programs nationally match, 34 of them wrongly (including 11 PACE, which CMS directly contradicts).
- **Internal contradiction.** Grep the whole record for the `savingsRange` figures. If the tagline/intro/`savingsSource`/FAQ disagree with `savingsRange`, the outlier is almost always `savingsRange`. Settles the claim with no source needed.
- **Null lead phone.** `contacts[0].phone === null` means the composer silently falls through to the next contact, usually 2-1-1. A data error, not a blank.
- **Generic anchor.** `contacts[0].phone` is `2-1-1` or a card-services/status line rather than an application door.
- **Unsourced savings.** `savingsRange` set with a vague or missing `savingsSource`, or a maximum phrased as a typical range.
- **Stale.** `lastVerifiedDate` null or older than ~6 months.

### Known 403 walls — do not burn a fetch, and do NOT drop to search

Confirmed blocking: `des.az.gov`, `cdhs.colorado.gov`, `ldh.la.gov`, `cms.gov`, `hhs.texas.gov` (PDFs), `dhhs.nh.gov`, `medicare.gov`, `chfs.ky.gov` (403s WebFetch *and* curl-with-browser-UA), `ahca.myflorida.com` (WAF 403s even its own PDFs), `goea.la.gov` / `goea.louisiana.gov`. **The last one was listed as working through 2026-08-07 and is not — verify rather than trusting this list, and correct it when it drifts.**

Fetched fine: `wvdrs.org`, `portal.ct.gov`, `hfs.illinois.gov`, `fhb.hhs.texas.gov`, `elderaffairs.org` (PDFs via curl), `flrules.org` (cleanest route to Florida rule text), `broc.org`, `dcf.vermont.gov`, `nmwic.org`, `dfcs.georgia.gov`, `activegenerations.org`, `oregon.gov`, and parish/county `.gov` sites.

**When a primary source blocks, get its bytes another way before you settle for a search summary.** In order of preference:

1. **Wayback** — `curl 'https://web.archive.org/web/2026/<url>'` returns full page bytes including PDFs. This is how KY (chfs.ky.gov) and LA (ldh.la.gov) were verified on 2026-08-11 with no aggregator involved. The availability JSON API rate-limits (429); the `/web/<year>/` redirect path and the CDX endpoint both work.
2. **Text proxy** — `r.jina.ai` got past Florida's WAF for `ahca.myflorida.com`.
3. **Fetch the PDF and extract locally** — WebFetch's summarizer silently fails on compressed text layers. Download it and run `pdftotext -layout`. Oregon's ERA factsheet reads as empty via WebFetch and verbatim via pdftotext.

Only after all three fail should you use WebSearch, and then you must name the domain the answer actually came from and mark routing/process claims UNVERIFIED.

**Beware our own footprint.** `olera.care` pages rank for these programs and surfaced as a top result during OR verification. Our own errors can come back as "corroboration." Weight nothing from that direction.

### Code dependencies

- **`scripts/benefits-lint.js` — BUILT (2026-08-07), use it.** Every check in the section above is implemented. Run `node scripts/benefits-lint.js --state=<states>` before touching the report, and `--json` when you want to filter to the report's programs. It confirmed KY's null-lead-phone on 2026-08-11 before a single web call. When a round turns up a recurring pattern the script does not catch, add the check rather than describing it here — `medicare-card-parts` was added on 2026-08-11 for exactly that reason, after `medicare-not-required`'s `/parts a and b/` pattern missed the `(both parts)` phrasing and let a wrong Alabama letter reach the pending queue.
- **`lastVerifiedDate` gate in the export — still not built.** `lib/benefits/navigator-review-prompt.ts` should omit programs verified within N days so the prompt, TJ's wait, and the verification all shrink together. Until it exists, drop fresh programs by hand and say so in the report.

## Procedure

1. **Read the report.** Find the CORRECTIONS block (the export prompt demands one: `[STATE] [program]: [field] — [old] → [new] (source)`). If there isn't one, extract the same structure from the findings tables. Separate corrections (data changes) from pick-fit/voice observations (report those to TJ; they're composer-level, not data).

2. **Verify before applying — in parallel, not serially.** Fan out one subagent per surviving program (not per claim), each given the program's current record, the report's claims for it, the 403 list above, and instructions to return a structured verdict per claim naming the source domain the answer actually came from. For every high-severity correction, and any correction that removes or fundamentally reclassifies a program: independently confirm via WebFetch/WebSearch against primary sources. Government sites often block fetches (403/ECONNREFUSED) — fall back to WebSearch and read which domain the answer actually comes from. CAUTION (2026-08-01): WebSearch answer summaries can blend aggregator text into what looks like an official page's instruction — a summary claimed ADECA takes LIHEAP applications when ADECA's own page says the opposite. Phone NUMBERS from search summaries held up; ROUTING/PROCESS claims ("call X to apply") did not. For any claim about how to apply, fetch the operator's page directly or treat it as unverified. Med/low corrections (hours, document list wording) may be applied on the report's citation if the cited source is official. **If your verification disagrees with the report, or sources genuinely conflict (see the open MA FEW 60-month dispute), do NOT apply — flag it to TJ as disputed.**

3. **Apply to `data/pipeline/<ST>/drafts.json`** (the source of truth — `drafts.ts` is generated). Write a Node script that locates programs by id/name regex and **fails loudly when a target isn't found**; never silently skip. Conventions:
   - `contacts[0]` is the letter's call anchor — the program's application door, not a generic referral line. 2-1-1 is only acceptable when it genuinely handles the program (TX SNAP) or is honestly labeled as a locator (FL LIHEAP).
   - **Institutional front doors over named-person desk lines.** "Currently published" is not a high enough bar for a phone verdict: the pipeline scraped staff-directory lines (Wake County 2026-07-31 — both top contacts were individual supervisors' desks, "confirmed" by two audit rounds because NCDHHS publishes them). A desk line rots when one person changes roles; a main line survives reorgs. Verify the number is an organization's line; demote desk lines to secondary with a "may change" note, and have the letter call the main line and ask for the unit.
   - `savingsRange` must be a verified figure with its basis in `savingsSource` — maximums labeled as maximums, never "typical" ranges without official support.
   - Stamp `lastVerifiedDate: <today>` on every corrected program.
   - A program that doesn't exist as a consumer benefit gets **removed** — saved references drop out gracefully (`draftFor` returns null) and the page 404s.

4. **Regenerate + de-churn:** `node scripts/benefits-pipeline.js --regen-index`, then revert the untouched states' `drafts.ts` (the regen rewrites all 51 headers with a new timestamp — keep only edited states + real changes; `git diff --numstat` = 1 line means timestamp-only). Then `tsc --noEmit` (run the binary directly, no `timeout` wrapper). **Skip tsc entirely on a data-only round** — `drafts.ts` is generated from JSON with an unchanged shape, so there is nothing new to typecheck, and a fresh worktree carries no `node_modules`, making `npm install` pure dead time. Typecheck only when the round also touches code.

5. **Branch + PR to staging** (`benefits-data-corrections-<date>` off `origin/staging`). PR body: what was verified against what source, what was deliberately not applied and why. Never merge — TJ merges via /pr-merge. **One PR per round, not one per discovery.** On 2026-08-07 a late finding produced a second PR and a second full regen/de-churn/tsc/merge cycle. Hold every data change until the whole report is triaged, then open once.

6. **Patch the pending drafts directly — do not hand TJ an edit list.** Already-composed navigator drafts carry the old facts, and drafts are DATABASE rows (`business_profiles.metadata.benefits_navigator`), so corrections reach them without any deploy. For each pending draft citing corrected data: write a patch script with exact-string replacements on the letter body (miss = throw, never silently half-patch), keep the letter's voice (short sentences, 6th grade, no em dashes), fresh-read merge on write, stamp `factcheck_patched_at`. TJ still gates every send, so patched text gets his read at send time. First run: 2026-07-31, 10 letters patched in place. Special cases: a letter whose program was REMOVED can't be text-patched — flag it for TJ to dismiss, or recompose it after the data PR deploys (recompose re-picks from the deployed bundle and will choose the next-best program). Drafts for programs the report didn't cover stay untouched and are named in the summary for the next run.

   **Mechanics that cost real time on 2026-08-07 — get them right the first time:**
   - **Apostrophes.** Letter bodies in the DB use straight `'`, not curly `’`. A patch string with the wrong one throws on the exact-match guard. Normalize before writing the script, and remember single-quoted JS literals then need double quotes or escaping.
   - **Drive the patcher from the CORRECTIONS block**, not hand-written per-state blocks. The find/replace pairs are data and belong in a table.
   - **Refresh the `pick` snapshot in the same write as the body**, rebuilt from current pipeline data using the composer's own rules: first contact with a non-null phone, `documentsNeeded.slice(0, 3)`.
   - **Sanity-check counts after editing.** Removing a document from a letter that says "have three things nearby" leaves it listing two. Grep the patched body for number words.
   - **Run DB scripts from a checkout that has `node_modules`.** Worktrees usually don't.

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
- **Never leave `documentsNeeded` empty.** `toPick()` returns null when the list is empty, so a program with no documents silently drops out of letters entirely. When the finding is "this operator publishes no document packet" (OR ERA, SD, FL meals, NM SFMNP on 2026-08-11), rewrite the entries as *what to have ready* — the facts the phone screen actually asks for. That is more useful than a document list anyway, and it is what the family will be asked.
- **Pin the anchor with a `(start here)` label, not array order.** `toPick()` prefers the first contact whose label matches `/start here/i` before falling back to the first with a phone. A label is stable; an array index is not.
- **Check collisions at the PROGRAM level, not the file level.** On 2026-08-11 the merge with staging's #1546 reported 14 conflicting files; only one program had actually collided. Diff base/staging/branch per program id before concluding anything about a conflict. And never resolve `drafts.ts` by picking a side — it is generated. Resolve the JSON, then `--regen-index`.
- **Two independent efforts landing on the same number is the strongest evidence there is.** #1546 and the 2026-08-11 round both reached (877) 564-0330 for KY Transitions by different routes. When that happens, reconcile as a union and keep the better structure from each side rather than choosing a winner.
- **Seasonality**: LIHEAP-class programs have application windows (IA: Nov 1–Apr 30, October for 60+; TN: fall portal opening). A letter composed off-season sends a family to call about a program that isn't taking applications — check the window and add a timing sentence, or question the pick. Found 2026-08-01.
