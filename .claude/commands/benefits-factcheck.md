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

Confirmed blocking: `des.az.gov`, `cdhs.colorado.gov`, `hcpf.colorado.gov`, `ldh.la.gov`, `cms.gov` (HTML; the `ma-plan-directory.zip` download works), `hhs.texas.gov` (PDFs), `dhhs.nh.gov`, `medicare.gov`, `ahca.myflorida.com` (WAF 403s even its own PDFs), `goea.la.gov` / `goea.louisiana.gov`, `ssa.gov` (Akamai), `fns.usda.gov` (the COLA tables; `fns-prod.azureedge.us` PDFs take direct curl), `mass.gov` (403s curl *and* WebFetch), `dss.mo.gov` / `mydss.mo.gov` (WAF), `dcf.ks.gov` (returns HTTP 000 even with a browser UA and `--tlsv1.2 --http1.1`), `dhss.delaware.gov` (HTTP 999), `housing.nv.gov` (F5 reject, **and Wayback holds no capture** — r.jina.ai is the only route), `adrcoforegon.org`, `vialink.org`, `fl211.org` and `211colorado.org` (Cloudflare; 211colorado.org defeats Wayback too, which returns only a JS shell), `acaaa.org` (times out), and every Illinois `.gov` host (DNS-unreachable from the sandbox, not a block).

Three corrections to this list from 2026-09-03, all of which cost real time:

- **`chfs.ky.gov` is no longer curl-proof: `r.jina.ai` returns the LIVE page.** That mattered — Kentucky dropped Saturday DCBS hours between the newest Wayback snapshot (2026-06-07) and that date, so stopping at Wayback would have wrongly *rejected* a correct high-severity finding. When a claim turns on hours or a schedule, prefer a live proxy fetch over Wayback and say which snapshot you read.
- **`mn.gov` and every subdomain (incl. `dcyf.mn.gov`) is Radware CAPTCHA-walled and returns HTTP 200 with a CAPTCHA body**, so it *looks* like a success. Wayback works. `r.jina.ai` returns garbage for this domain (tracker-pixel titles) — do not trust it here. `dhs.state.mn.us` separately returns "Unusual Activity Blocked".
- **`floridajobs.org` answers 403 to `curl -I` (HEAD) and 200 to a GET with a browser UA.** Do not let a HEAD check convince a future round that a live page is dead.

Host notes from 2026-09-06 (ten programs, one verifier each):

- **`dhhs.ne.gov` is DNS-unreachable from the sandbox** (curl exit 000, WebFetch ENOTFOUND), not on the list above. `r.jina.ai` returns the live HTML cleanly and Wayback holds the PDFs. `/Pages/ADRC.aspx` and `/Pages/Developmental-Disabilities.aspx` are 404; the real pages are `Aging-and-Disability-Resource-Center.aspx` and `ACCESSNebraska-Contact-Us.aspx`.
- **`hfs.illinois.gov` no longer fetches live** despite the "fetched fine" note; `r.jina.ai` works for it and for `dhs.state.il.us`, and matched the March 2026 Wayback text. `abe.illinois.gov` has no readable copy anywhere.
- **`mn.gov/senior-linkage-line` now redirects to `mn.gov/aging-pathways`**; the Senior LinkAge Line was renamed Minnesota Aging Pathways in 2025 (same number). `seniorlinkageline.com` is a hijacked domain serving casino spam. Never link it.
- **`gefa.georgia.gov`'s CAA list renders "Loading..." in any text view**; the data is in the raw HTML. `law.justia.com` 403s and Wayback has nothing; Georgia statutes are readable as PDFs on `audits2.ga.gov`. `actionpact.org` redirects to a Milwaukee organization, not Georgia's Waycross agency.
- **`csraeoa.org`'s 2024 WAP packet is a scanned PDF with no text layer**; `pdftotext` returns nothing, render pages with `pdftoppm` and read them as images.
- `oregon.gov` PDFs and HTML all fetched live; `secure.sos.state.or.us` (OAR text) needs `r.jina.ai`. The reviewer's `opi-m-1115-waiver-qa.pdf` citation is 404 live and dates from January 2022.
- `alabamaageline.gov`, `nacolg.org`, `immanuel.com`, `elderaffairs.org` (HTML and handbook PDFs), `leg.state.fl.us`, `threeriverscap.org`, `meals-on-wheels.com`, `capai.org`, `healthandwelfare.idaho.gov`, `liheapch.acf.gov` (state plan PDFs), `ncliftss.acentra.com`, `medicaid.ncdhhs.gov`, `tax.ny.gov` all fetched live with a browser UA. `idahocap.org` does not resolve; the Idaho CAA association is `capai.org`. `publicdocuments.dhw.idaho.gov` (Laserfiche) times out and Wayback holds only the viewer shell.

Two lessons from the same round worth more than the host list:

- **A state's own fact sheet can carry the wrong number.** NC's Feb 2025 CAP/DA fact sheet says "call 1-833-470-0597" for CAP/DA; that is the referral fax, and every other page on the same site says so. The operator's contact page settles it, not the agency's PDF.
- **A verified record can still be built on a proposal.** Every FCAP fact in the Oregon caregiver record came from a 2022 OHA sheet describing a program that "would" exist; the waiver CMS approved in 2024 contains no FCAP. When a record's numbers all trace to one document, check whether that document describes something that launched.

**Verify rather than trusting this list, and correct it when it drifts.** Two entries here were wrong on 2026-09-03 and the previous round's `goea.la.gov` note was wrong before that.

Fetched fine: `wvdrs.org`, `portal.ct.gov`, `hfs.illinois.gov`, `fhb.hhs.texas.gov`, `elderaffairs.org` (PDFs via curl), `flrules.org` (cleanest route to Florida rule text), `broc.org`, `dcf.vermont.gov`, `nmwic.org`, `dfcs.georgia.gov`, `activegenerations.org`, `oregon.gov`, and parish/county `.gov` sites, plus `oregon.gov`, `dphhs.mt.gov`, `commerce.wa.gov`, `wa211.org`, `cdss.ca.gov`, `cmca.us`, `regulations.delaware.gov`, `delawareadrc.com`, `legis.la.gov`, `dcfs.louisiana.gov`, `liheapch.acf.gov` (the LIHEAP Clearinghouse state profiles, a good federal cross-check on benefit amounts and program dates), `ecfr.gov`, `mountainpacific.org`, `trinityhealthpace.org`, and county/parish `.gov` sites.

**When a primary source blocks, get its bytes another way before you settle for a search summary.** In order of preference:

1. **Wayback** — `curl 'https://web.archive.org/web/2026/<url>'` returns full page bytes including PDFs. This is how KY (chfs.ky.gov) and LA (ldh.la.gov) were verified on 2026-08-11 with no aggregator involved. The availability JSON API rate-limits (429); the `/web/<year>/` redirect path and the CDX endpoint both work.
2. **Text proxy** — `r.jina.ai` got past Florida's WAF for `ahca.myflorida.com`.
3. **Fetch the PDF and extract locally** — WebFetch's summarizer silently fails on compressed text layers. Download it and run `pdftotext -layout`. Oregon's ERA factsheet reads as empty via WebFetch and verbatim via pdftotext.

Only after all three fail should you use WebSearch, and then you must name the domain the answer actually came from and mark routing/process claims UNVERIFIED.

**Beware our own footprint.** `olera.care` pages rank for these programs and surfaced as a top result during OR verification. Our own errors can come back as "corroboration." Weight nothing from that direction.

### Code dependencies

- **`scripts/benefits-lint.js` — BUILT (2026-08-07), use it.** Every check in the section above is implemented. Run `node scripts/benefits-lint.js --state=<states>` before touching the report, and `--json` when you want to filter to the report's programs. It confirmed KY's null-lead-phone on 2026-08-11 before a single web call. When a round turns up a recurring pattern the script does not catch, add the check rather than describing it here — `medicare-card-parts` was added on 2026-08-11 for exactly that reason, after `medicare-not-required`'s `/parts a and b/` pattern missed the `(both parts)` phrasing and let a wrong Alabama letter reach the pending queue.
- **`scripts/benefits-draft-patch.js` and `scripts/benefits-draft-schedule.js` — BUILT (2026-09-06), use them.** Draft patching and scheduling are no longer per-round scratch scripts. Both dry-run by default, locate `node_modules` and `.env.local` themselves, and are allow-listed for auto mode in TJ's user settings (`~/.claude/settings.json`). Shared plumbing (pick rebuild, Eastern-time slot math, holiday list mirror of `lib/business-day.ts`) lives in `scripts/lib/benefits-draft-db.js`; update the holiday list there when `lib/business-day.ts` rolls a year.
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
   - **Propagate the fact, don't patch the field the reviewer named.** The report points at one field; the fact usually lives in four. On 2026-08-22 the first pass fixed `contacts[0].phone` and `name` but left the retired Ohio number sitting in `applicationGuide.steps[0]`, left KEPRO in WV's `applicationGuide` + `applicationNotes` after moving the documents list to Acentra, and — worst — corrected Nevada 2-1-1's hours in only the three records the report happened to open while **ten other Nevada programs** kept telling families to call any hour. Statewide facts (a 2-1-1 line's hours, an agency rename, a retired phone) are state-wide edits, not program edits. All three shipped as a second PR (#1673) that should never have been needed.

   **Three propagation surfaces this list did not name, all of which leaked on 2026-09-03 and were caught only by the grep in 3b:** the program's **top-level `phone`** (which the lint compares against `contacts[0]` as `anchor-phone-drift`, so moving the anchor without it *creates* a finding), **`sourceUrl`** (Louisiana's dead application URL lived there as well as in `applicationGuide.urls`), and **`geographicScope.localEntities`** (which carried a retired Missouri vendor, an obsolete Arkansas provider count, a Nevada agency that is not a subgrantee, and a Montana provider-billing step). Add all three to the grep, and re-grep after a structural edit rather than assuming a `contacts` rewrite reached them.

   **A statewide replace must target the field, not the string.** Correcting a 2-1-1 line's hours by substring across a state file also rewrites genuinely-24/7 numbers sharing those records — on 2026-09-03 that would have wrongly changed Washington's Healthplanfinder and relay lines and Colorado's EBT card line. Match on `contacts[].phone === '2-1-1'` instead.

3b. **Grep the corrected value before you open the PR, not after the merge.** For every value you changed, grep the OLD value across the whole state file and expect zero. This is the check that would have caught all three misses above, costs one command, and needs no network:

   ```bash
   for pat in "848-1300" "24 hours, 7 days a week" "KEPRO"; do
     echo "$pat: $(grep -ro "$pat" data/pipeline/{OH,NV,WV}/drafts.json | wc -l)"
   done
   ```

   A non-zero count is either a second record carrying the same stale fact or an adjacent field (`applicationGuide`, `applicationNotes`, `intro`, `faqs`) the structured edit didn't reach. Both are the same bug. Do the same for the NEW value to confirm it actually landed everywhere it should.

4. **Regenerate + de-churn:** `node scripts/benefits-pipeline.js --regen-index`, then revert the untouched states' `drafts.ts` (the regen rewrites all 51 headers with a new timestamp — keep only edited states + real changes; `git diff --numstat` = 1 line means timestamp-only). Then `tsc --noEmit` (run the binary directly, no `timeout` wrapper). **Skip tsc entirely on a data-only round** — `drafts.ts` is generated from JSON with an unchanged shape, so there is nothing new to typecheck, and a fresh worktree carries no `node_modules`, making `npm install` pure dead time. Typecheck only when the round also touches code.

5. **Branch + PR to staging** (`benefits-data-corrections-<date>` off `origin/staging`). PR body: what was verified against what source, what was deliberately not applied and why. Never merge — TJ merges via /pr-merge. **One PR per round, not one per discovery.** On 2026-08-07 a late finding produced a second PR and a second full regen/de-churn/tsc/merge cycle. Hold every data change until the whole report is triaged, then open once.

6. **Patch the pending drafts in the same run. Do not stop and wait for "update messages."** Already-composed navigator drafts carry the old facts, and drafts are DATABASE rows (`business_profiles.metadata.benefits_navigator`), so corrections reach them without any deploy. The data PR and the draft patch are one motion: the moment the data edits are verified, build the edits file and run the patcher. TJ still gates every send, so patched text gets his read at send time.

   The patcher is checked in: `scripts/benefits-draft-patch.js`. It is driven by a JSON edits file (find/replace pairs are data, not code), refreshes the frozen `pick` snapshot from the pipeline in the same write, stamps `factcheck_patched_at`, and throws on any edit that does not match exactly once. It locates `node_modules` and `.env.local` itself, so it runs from a bare worktree:

   ```
   node scripts/benefits-draft-patch.js --edits=<scratchpad>/edits.json --pipeline=data/pipeline          # dry run, read every letter
   node scripts/benefits-draft-patch.js --edits=<scratchpad>/edits.json --pipeline=data/pipeline --apply
   ```

   Edits file shape: `{ "<8-char profile id prefix>": [["body", "old", "new"], ["sms", "old", "new"]], "<prefix>": [] }`. An empty array is a pick-only refresh, for a draft whose data changed but whose prose did not print the stale value (a relabeled contact, a reordered document list). Find the drafts with `scripts/benefits-draft-lint.js`: after the data edits, every affected pending draft reports `snapshot-drift`, and that list IS the patch list, including drafts for programs the report never named (2026-09-06: an Illinois Medicaid letter and a Georgia Senior SNAP letter surfaced this way).

   **Both scripts are allow-listed in TJ's user settings (`~/.claude/settings.json`, `permissions.allow`)**, so auto mode does not block the write. The rules live at user level because the repo gitignores `.claude/settings.json`, so a project file would not reach other worktrees. On 2026-09-06 the write was refused twice by the auto-mode classifier and TJ had to paste two commands into a terminal, which is the delay this step now exists to remove. If a write is still refused, say so in one sentence, hand TJ exactly one command, and continue; never present a hand-run as the plan.

   **Mechanics that cost real time on 2026-08-07 — get them right the first time:**
   - **Apostrophes.** Letter bodies in the DB use straight `'`, not curly `’`. A patch string with the wrong one throws on the exact-match guard.
   - **Chain edits on one field.** Two body edits on the same letter must each read the result of the last; on 2026-09-06 a first draft of the patcher read the original each time and only the last edit survived. The checked-in script chains correctly. Read the dry-run output anyway.
   - **Sanity-check counts after editing.** Removing a document from a letter that says "have three things nearby" leaves it listing two. Grep the patched body for number words.
   - **Vanity names read as phone numbers.** "1-800-AGE-LINE" in prose trips the lint's `stale-phone-in-text` check because it is not on the contact list. Write "the Alabama AgeLine at (800) 243-5463", not the vanity form.
   - **A removed program cannot be text-patched.** `rebuildPick` throws when the program is gone from the pipeline. Flag that draft for TJ to dismiss, or recompose it after the data PR deploys (recompose re-picks from the deployed bundle; staging and production share one database, so recompose from the STAGING admin until the data is promoted).

   **Patch all four text fields, not just the body.** A draft carries `subject`, `body`, and `sms`, plus `edited_subject` / `edited_body` / `edited_sms` when TJ has edited it in the drawer. The script prefers the edited variant when present and writes back to the same key. On 2026-08-11 a Georgia letter was corrected to "Elderly and Disabled Waiver Program" while its SMS still said "CCSP", the name Georgia retired. **A body change and its SMS change move together, always.**

6b. **Gate on `scripts/benefits-draft-lint.js` before saying anything is updated.** It reads pending drafts from the database and checks them against pipeline data. The lint still needs `dotenv` and `@supabase/supabase-js`, so from a worktree borrow them and point `--pipeline` at the worktree holding the corrections:

   ```
   NODE_PATH=~/Desktop/olera-web/node_modules node scripts/benefits-draft-lint.js \
     --env=~/Desktop/olera-web/.env.local --pipeline=data/pipeline --state=<states>
   ```

   **Check the `Branch:` line it prints before believing any finding.** Every `snapshot-drift` result is relative to the pipeline it loaded; aim it at a branch that predates your corrections and every corrected program reports as drifted. The same command produced 15 highs and 0 highs minutes apart during development purely because the worktree had moved. `~/Desktop/olera-web` itself is a stale checkout (no draft lint script in it as of 2026-09-06); run the worktree's copy.

   Fix until `--high` is empty, then read the `low` findings, which are deliberately advisory rather than automatic:

   - `snapshot-drift` — the frozen `pick` disagrees with live data. This is the ghost that kept re-surfacing corrected programs in later review exports. It compares `contactLabel` as of 2026-08-22: a correction that only renames a contact (CA LIHEAP "Application Line" → "CSD Call Center", because that line answers questions and cannot take an application) leaves phone, name and documents identical, so every other comparison passed while the letter kept telling the family to apply on the wrong line.
   - `stale-phone-in-text` / `cross-field-drift` — a number or retired program name printed in one field and not the others. This is the class the body-only patch created.
   - `sms-assembly` — simulates what is actually transmitted, since the send path appends the STOP and CALLED lines at send time. Catches doubled suffixes, a missing `{link}`, and punctuation flush against `{link}` (some clients pull it into the tapped URL and the link 404s).
   - `banned-phrase` — voice-spec violations, especially speed promises. "It's one phone call" is the banned "just one call" with the qualifier removed.
   - `count-word` — a patched letter that states a count. Prose lists are not reliably parseable, so this asks you to read the list rather than asserting a miscount. Read it.
   - `non-dialable-anchor` — prose or an email sitting where the phone number goes, which renders as "Call X at Contact information not specified in available sources."

   **A clean run is not verification.** The lint catches inconsistency, not wrongness. A draft whose phone is wrong but consistent everywhere passes. That is the 2026-08-11 SoonerCare case: a real, staffed, official number that could not take the caller's application. Only reading the operator's own page catches that.

6c. **Scheduling walkthrough. Tell TJ where the letters stand, then ask one question.** Visibility is the point of this step: TJ should never have to ask "did the messages get updated?" or "are they scheduled?".

   1. Run the scheduler dry run first, so the question shows the real list:
      ```
      node scripts/benefits-draft-schedule.js --patched=<today>
      ```
      It proposes the next business-day slot (Mon–Fri, not a US federal holiday, 11:00 AM Eastern, which fires at 11:10 ET and lands at 8:10 AM Pacific, inside every text window), reports how many drafts are already due at or before that slot against the cron's 20-per-run cap, and **skips any draft whose packet route is `recompose` or `ask`**. The scheduler cron enforces that gate at fire time and would clear the schedule with a Slack ping, so scheduling those is a wasted Tuesday.
   2. Say the status in one line, in these words or close to them: **"Messages updated: N letters patched, lint clean. Not yet scheduled."** Then list the held letters with the packet's reason (2026-09-06: three held, each because both fit models preferred a different first program, the same three the external reviewer flagged in its pick-fit notes).
   3. Ask with AskUserQuestion, one question: **"Do you want to schedule the N ready letters for <slot>?"** Options: schedule for that slot (recommended), pick a different time (`--at=YYYY-MM-DDTHH:MM`, Eastern wall-clock), hold. A second question only if letters are held: recompose from the staging admin, send anyway in the drawer, or dismiss, per letter or as a group.
   4. On yes: `--apply`, re-run the dry run (everything should now report "already scheduled"), and close with **"Scheduled: N letters for <slot>. You're good to go."** plus the held ones and what TJ chose for them. The scheduler pings Slack after each run; a blocked fire shows its reason on the draft in `/admin/benefits`.

7. **Report to TJ:** corrections applied (with the one-line-each summary), disputes flagged, pick-fit/voice observations from the report worth a composer-rail change, the status line from 6c, and the held-letter decisions still open.

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
