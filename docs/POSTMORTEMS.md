# Post-Mortems

> Lessons learned from bugs and issues. Each entry makes the system smarter.

---

### 2026-02-20: Design regression — 2-column vertical cards replaced with horizontal single-column

**Symptom**: The browse page's polished 2-column vertical card grid (Realtor.com style, iterated over Sessions 15 and 15b through 6+ commits) was replaced with a horizontal single-column layout in one commit. User noticed immediately and asked for it back.

**Root Cause**: A stale plan was followed without questioning it. Here's the timeline:

1. **Session 15** (initial browse redesign) — plan written with horizontal TripAdvisor-style cards
2. **Session 15b** (polish pass) — design iterated to 2-column vertical cards (`27b24e8`), which the user preferred. The plan was **never updated** to reflect this decision.
3. **This session** — the old plan was given as instructions ("Implement the following plan"). The plan still said "Horizontal layout like TripAdvisor: image on left, content on right" and "single column of BrowseCard components."
4. Claude read the current code (2-column vertical cards), saw it conflicted with the plan, and **followed the plan instead of questioning the discrepancy**. The existing design was overwritten.

The core error: **treating the plan as authoritative when the code told a different story.** The 2-column vertical layout had been deliberately iterated to through multiple commits — it wasn't accidental. But because the plan said "horizontal," the agent rewrote the working design without flagging the conflict.

**Fix**: Reverted BrowseCard to vertical layout and BrowseClient to 2-column grid in `dc56a62`.

**Time to Resolution**: ~10 minutes once the user noticed, but the unnecessary churn touched 2 files and required a revert commit.

**Prevention**: Added to CLAUDE.md:
- When a plan conflicts with the current state of the code, **ask the user** before overwriting — the code may have been intentionally iterated past the plan
- Plans can go stale between sessions; the code is the source of truth for current design intent

**Lesson**: If the code has clearly been iterated (multiple commits refining a design), treat it as an intentional decision — not something to overwrite because a plan doc says otherwise. When in doubt, ask.

---

### 2026-02-25: Modal close scrolls page to footer (4 attempts to fix)

**Symptom**: Closing the auth modal on the homepage caused the page to instantly snap to the pre-footer "Find senior care by city" section instead of staying at the user's scroll position.

**Root Cause**: When React removes a portal from the DOM while an element inside it has focus, the browser's native focus management instantly moves focus to the next focusable element in DOM order and scrolls to make it visible. The portal is appended at the end of `document.body`, so the "next" focusable elements are links in the pre-footer. This scroll fires during React's DOM mutation phase — before any effect cleanup runs, even `useLayoutEffect`.

**Fix**: Added `handleClose()` in `components/ui/Modal.tsx` (line 59) that blurs the active element BEFORE calling `onClose`. Applied to all three close paths: backdrop click, X button, Escape key. No focused element in the portal when it's removed = no browser focus management = no scroll. The `useLayoutEffect` body lock with `scrollTo({ behavior: 'instant' })` was kept as a safety net.

**Time to Resolution**: ~90 minutes across 4 failed-then-succeeded attempts:
1. `useEffect` + `scrollTo` — cleanup is deferred, runs after paint (too late)
2. `useLayoutEffect` + `position:fixed` + `scrollTo` — right timing, but `scroll-behavior:smooth` CSS animated the scroll
3. Added `behavior:'instant'` — still failed because scroll happens during DOM mutation, before any effect
4. Blur before close — correct: prevents the scroll instead of undoing it

**Prevention**:
- When debugging scroll jumps in portaled components, check focus management FIRST — ask "instant or smooth?" to distinguish focus-based scroll from CSS/JS scroll
- `useLayoutEffect` cleanup runs after DOM mutations, not before — don't assume it can prevent browser behavior triggered by DOM removal
- Always check `globals.css` for `scroll-behavior: smooth` when dealing with scroll issues — it silently changes `scrollTo` semantics
- For modal scroll locks: blur the active element in the event handler (before state change), not in effect cleanup (after DOM mutation)

**Lesson**: When the browser does something during DOM mutation, no React effect can prevent it — you must act before React processes the state change. Prefer preventing problems over undoing them.

---

### 2026-02-26: PR merge silently regressed SEO, auth, and branding on staging

**Symptom**: After merging PRs #66 and #65 to staging, the footer discovery zone (72+ SEO links), homepage power page routing, auth OTP performance (24hr cache → 30min, 5s timeout → 15s), GA4 analytics, v1.0 301 redirects, provider detail JSON-LD, and teal bird branding were all silently reverted to older versions. Staging looked fine at a glance but had lost critical care-seeker infrastructure.

**Root Cause**: The `/pr-merge` command analyzed PR #66 using `git merge-base` and found that staging had 0 files changed since the branch point — technically correct, but dangerously misleading. PR #66 was a "revert of the revert" of PR #64, which restored PR #64's file versions. Those versions were **older** than what existed on staging after TJ's PRs #53-55 improved shared files (footer, auth, homepage, SEO config). The revert→re-apply cycle made git's commit topology look clean while the file content was regressive. The command only compared commit history (which files were modified recently), not actual file content (would merging change files that are already in a good state).

**Fix**: Created `reconcile-staging` branch from `fond-fermi` (TJ's known-good state), merged staging in, explicitly restored fond-fermi's versions of 17 care-seeker/SEO/auth files, kept staging's provider hub files. One type fix needed (`isActive` prop). PR #67 merged cleanly.

**Prevention**:
- Updated `/pr-merge` command with **Phase 2.5: Content Regression Check** — compares actual file content between the PR branch and staging for high-value files, regardless of what git merge-base says
- Added **revert chain detection** — flags PRs whose history includes revert commits touching shared files
- Added **critical file watchlist** for Olera (footer, auth, homepage, SEO config, navbar, layout) that always get content-diffed
- Added warning for PRs branched from old staging states (>5 commits behind)

**Lesson**: Git merge-base analysis detects *structural* conflicts (two people editing the same file). It cannot detect *semantic* regressions (a PR bringing back old versions of files that were improved after it branched). When a PR involves reverts, always compare actual file content against the target branch — not just commit history.

---

### 2026-03-04: Notion MCP tool Cloudflare blocks + children schema mismatch

**Symptom**: After creating one Notion page successfully (PR merge report), three consecutive attempts to create the notification test matrix page failed with Cloudflare "Sorry, you have been blocked" errors. Falling back to the raw Notion MCP tool also failed with a schema validation error.

**Root Cause**: Two issues compounded:
1. The Claude AI Notion tool (`mcp__claude_ai_Notion`) routes through Anthropic's proxy, which gets Cloudflare rate-limited after rapid successive calls. The first call succeeded; the next 3 within ~2 minutes were all blocked.
2. The raw Notion tool (`mcp__notion__API-post-page`) accepts `children` typed as `items: { type: "string" }` in its MCP schema, but Notion's API actually expects JSON objects. Passing stringified JSON objects caused a 400 validation error.

**Fix**: Used a 2-step approach with the raw Notion MCP tools:
1. `mcp__notion__API-post-page` — create the page with just title + parent (no children)
2. `mcp__notion__API-patch-block-children` — append content blocks as proper JSON objects in batches

**Time to Resolution**: ~4 minutes (3 Cloudflare failures + 1 schema error + successful 2-step approach)

**Prevention**:
- When the Claude AI Notion tool is Cloudflare-blocked, immediately fall back to raw Notion MCP tools (`mcp__notion__API-*`) instead of retrying
- For the raw tools: create page first (no children), then use `patch-block-children` to add content — this avoids the `children` schema issue on `post-page`
- Space out rapid Notion calls when possible to avoid rate limiting

**Lesson**: MCP tool schemas don't always match the underlying API's expectations. When a tool's schema says `string` for a field that semantically holds objects, test with a minimal call first. And when a proxy-based tool gets rate-limited, fall back to the direct integration immediately — don't retry the same blocked path.

---

### 2026-04-01: Slack private channel lookup — 4 rounds of unnecessary back-and-forth

**Symptom**: When asked to message `#ai-product-development`, Claude spent 4 search attempts with `slack_search_channels` (trying "ai-development", "ai development", "development", "ai") before TJ had to explain it's a private channel, then point out we'd messaged it the day before.

**Root Cause**: `slack_search_channels` doesn't return private channels. Instead of switching tools after the first miss, Claude kept retrying with different search terms — the definition of insanity. The fix was trivial: `slack_read_channel` accepts channel names (not just IDs) and works for any channel the bot is a member of, including private ones. One call would have resolved it.

**Fix**: Used `slack_read_channel("ai-product-development")` which returned the channel ID and messages. Message sent successfully.

**Time to Resolution**: ~3 minutes of wasted back-and-forth that TJ had to guide.

**Prevention**:
- Saved memory: when `slack_search_channels` returns no results on the first try, immediately fall back to `slack_read_channel` with the channel name. If that also fails, *then* ask the user for the channel ID.
- Never retry `slack_search_channels` with query variations — if the first search misses, the channel is either private or doesn't exist. Retrying with different terms won't surface a private channel.

**Lesson**: When a tool fails, switch tools — don't retry the same tool with slightly different inputs. The user should never have to debug your tool usage for you.

---

### 2026-03-27: Notification card never rendered — 3 compounding root causes over 12+ rounds

**Symptom**: Provider clicks notification email link. Expected: notification card hero ("A family is interested in your services") + dashboard. Actual: "Email verified / Claim this listing" every single time, across 12+ fix attempts over ~4 hours.

**Root Causes (three, compounding):**

1. **Apple Mail strips `token` param** — Link Tracking Protection removes URL params named "token" (both click and copy). The one-click flow never ran because the token never arrived. Fixed by renaming to `otk`.

2. **Notification data blocked by RLS** — The connections table has Row Level Security. The browser client (anon key, unauthenticated user) can't read it. `notificationData` was always null. The ActionCard guard `if (state === "notification-lead" && notificationData)` failed silently. Fixed by fetching notification data server-side in `validate-token` using the service role key.

3. **SmartDashboardShell overrode the state** — Line 257: `preVerifiedEmail ? "pre-verified" : initialActionState`. When `preVerifiedEmail` was set (always true in the token flow), this ternary forced the ActionCard state to `"pre-verified"` regardless of what the parent passed as `initialActionState`. Every upstream fix that set `"notification-lead"` was immediately overridden by this one line. Fixed with a priority check for notification states.

**Time to Resolution**: ~4 hours, 12+ fix rounds, 12 commits. Each root cause masked the next — fixing #1 revealed #2, fixing #2 revealed #3.

**Why Each Round Failed:**
- Rounds 1-5: Fixed real but unreachable bugs (race conditions, PKCE, sequencing). The token wasn't arriving (root cause #1).
- Rounds 6-7: Token arrived via `otk` rename. Set `actionCardState = "notification-lead"` in parent. But notification data was null (root cause #2) AND state was overridden by SmartDashboardShell (root cause #3). Same "pre-verified" screenshot.
- Rounds 8-9: Fixed notification data fetch (server-side). But SmartDashboardShell still overrode the state (root cause #3). Same screenshot.
- Round 10: Fixed the one-line ternary override. Notification card finally rendered.

**Prevention:**
- **Trace the full render chain before fixing.** State set in parent → prop passed to child → child's internal state init → render guard → actual render. If ANY link in this chain overrides or drops the value, the fix is DOA. I fixed the first link 10 times without checking the last three.
- **When the same symptom persists across multiple fixes, the bug is downstream of where you're looking.** Move toward the render, not away from it.
- **Read child component state initialization.** `useState(initialProp)` only uses the prop on FIRST render. If the child has its own state derivation logic (like the ternary override), the prop is meaningless.
- **Verify fixes with console.log at the render site, not at the fix site.** A `console.log` inside ActionCard's notification-lead render block would have shown it was never reached — on the first attempt.

**Lesson**: When you fix the same bug 10 times and it doesn't go away, you're fixing the wrong layer. Stop, trace the full chain from data source to pixel, and find where the value gets dropped. The most expensive debugging pattern is repeatedly fixing upstream code while a downstream override silently discards every fix.

---

### 2026-03-27: One-click provider onboarding never executed — Apple Mail strips `token` param

**Symptom**: Provider clicks notification email link. Expected: onboard page with lead preview + dashboard. Actual: "This listing is claimed" error, skeleton loaders, or wrong page. Debugged across ~10 rounds, 2.5 hours, 7 commits — none of which fixed the user-facing problem.

**Root Cause**: Apple Mail's Link Tracking Protection silently strips URL parameters named `token` from email links — both on click AND on copy-link. The `token` query parameter (a signed JWT for zero-friction auth) was removed before the browser ever loaded the page. `searchParams.get("token")` returned `null`, so the one-click flow never ran and the page fell through to the default claim-check path.

Evidence that revealed it: comparing the URL in the email (`...&token=eyJ...&ref=email`) to the URL in the browser bar (`...&ref=email` — token gone, params reordered). TJ had been copying links from Apple Mail into Dia browser, unaware Apple was modifying the clipboard.

**Fix**: Renamed query param from `token` to `otk` (one-time key) in `lib/claim-tokens.ts` and `app/provider/[slug]/onboard/page.tsx`. Apple doesn't strip `otk`.

**Time to Resolution**: ~2.5 hours total. ~2 hours on real-but-unreachable downstream bugs. ~15 minutes to find the actual root cause once the right question was asked ("show me the URL you clicked vs the URL you landed on").

**Prevention**:
- **Never name URL params `token`, `session`, `key`, `auth` in email links.** Apple Mail, Outlook, Brave, and Firefox Enhanced Tracking Protection strip params that look like tracking/auth identifiers. Use abbreviations: `otk`, `sid`, `k`.
- **Verify inputs before debugging processing.** When a feature "never works," check that the data reaches the code before tracing logic paths. A single `console.log("tokenParam:", tokenParam)` would have caught this in round 1.
- **Ask for the actual URL early.** "Show me the URL in your browser bar" should be the first troubleshooting question, not the sixth.
- Added to memory: `feedback_email_param_names.md` — never use `token` as a URL param name in emails.

**Lesson**: When every code fix is correct but the bug persists, the problem is upstream of your code. Verify the inputs arrive before debugging how they're processed. The most expensive assumption in debugging is "the data reaches my code."

---

### 2026-03-25: Admin image delete returned 500 — `hero_image_url` column doesn't exist

**Symptom**: Clicking "Delete" on a provider photo in the admin dashboard did nothing. The image stayed in the grid and could be "deleted" infinitely. No error was shown to the user.

**Root Cause**: The delete handler queried `olera-providers` with an explicit column list: `.select("provider_images, hero_image_url, provider_logo")`. The `hero_image_url` column does not exist in the table. Supabase rejects queries referencing non-existent columns with a 500. This was masked by two layers of silent failure: (1) the catch block returned generic "Internal server error" with no detail, and (2) the UI checked `if (res.ok)` and did nothing on failure — no error feedback. The directory endpoint worked because it uses `select("*")`.

**Fix**: Switched to `select("*")` in both GET and PATCH handlers. Guarded `hero_image_url` references with `"hero_image_url" in provider`. Added error feedback in UI. Made outer catch return the real error message. Wrapped `provider_image_metadata` ops in try/catch.

**Time to Resolution**: ~75 minutes across 7 commits. First commit had correct delete logic but hit hidden 500. Took 6 iterations of error surfacing before the Network tab Response body revealed the actual cause.

**Prevention**:
- Always use `select("*")` for admin API queries unless there's a performance reason for specific columns
- New admin endpoints must include error feedback — never swallow errors silently
- First debugging step for "button doesn't work" = ask user to open DevTools Network tab and check the response body immediately

**Lesson**: When a new feature silently fails, the first priority is making the failure loud — surface the actual error before attempting to fix the logic. Would have saved 60 minutes if the first commit had included error banners and console logging.

---

### 2026-03-27: /welcome page connection card disappears — 3 compounding root causes over 6 commits

**Symptom**: After enrichment questions, the /welcome page either showed a blank white screen for 6 seconds, or the connection card with the provider photo flashed for one second and then disappeared, leaving an empty gap between the heading and step cards.

**Root Causes (3, each masking the next)**:

1. **Server-side blocking (6-second delay)**: `force-dynamic` server component ran `getUserCity()` which called `supabase.auth.getUser()` for guests with no session cookie — slow fail (2-3s). Then client-side AuthProvider's `fetchAccountData()` timed out at 5000ms waiting for an `accounts` row not yet created. Total: 5-8s before `loading=false`.

2. **Missing Suspense boundary**: After converting to a static page (fixing #1), `useSearchParams()` in the client component needed a `<Suspense>` boundary to properly read URL params on a static page. Without it, `connectionIdParam` was empty on initial render.

3. **Inquiry message counted as "user has messaged"**: `showConnectionCard` required `!hasUserMessaged`, but the initial inquiry form submission itself creates a thread message from the user's profile (not marked `is_auto_reply`). So `hasUserMessaged` was `true` immediately for EVERY fresh connection, causing `showConnectionCard = false`. The skeleton would flash (connection null -> shown), then the connection data would load (connection set, but `showConnectionCard` false -> card hidden, nothing replaces it).

**Fix (3 commits)**:
1. Removed `force-dynamic`, converted to static page, moved provider fetching to client-side, removed `loading` gate
2. Wrapped `WelcomeClient` in `<Suspense fallback={<WelcomeLoading />}>`
3. Changed `showConnectionCard` from `isConnected && !hasUserMessaged && isFreshConnection` to `isConnected && isFreshConnection` — fresh connections always show the card

**Time to Resolution**: ~2 hours across 6 commits. First 2 issues were found via code analysis. Third issue required the user reporting "it flashed for a second" — that phrase was the critical clue that the skeleton rendered then disappeared, meaning `connection` was being set but `showConnectionCard` was evaluating to false.

**Why I didn't catch this earlier**:
- **Wrong assumption**: I assumed `hasUserMessaged` only captured deliberate follow-up messages. I didn't consider that the initial inquiry form message IS a thread message from the user's profile. The condition was logically correct for returning users but wrong for fresh connections.
- **Surface-level fix pattern**: I shipped the server-blocking fix (correct), then the Suspense fix (correct), without verifying the FULL render chain end-to-end. Each fix addressed a real issue but didn't check whether the downstream logic would actually show the card.
- **Debugged by hypothesis instead of tracing state**: I should have added the diagnostic `console.log` from the start — it would have immediately shown `hasUserMessaged: true` and pointed to the real issue.

**Prevention**:
- Added `[welcome-card]` diagnostic logging that traces all card state values on every render
- `/troubleshoot` learning: when UI "flashes and disappears," the first question is "what state changed to HIDE it?" not "what state failed to SHOW it?"
- The `showConnectionCard` condition now has a comment explaining why fresh connections skip the `hasUserMessaged` check

**Lesson**: "Flashes then disappears" is a different bug class than "never shows." It means the data loaded successfully but a downstream condition rejected it. Always trace the full conditional chain (data fetch -> state set -> condition evaluation -> render) before shipping. The user describing the BEHAVIOR ("flashed for a second") was more diagnostic than any code analysis — listen to the symptom description precisely.

---

### 2026-04-05: pipeline-batch.js enrichment phase hangs for hours on redundant re-hydration loop

**Symptom**: City expansion pipeline (193 cities) completed clean, load, and enrichment streams successfully, then hung indefinitely at "Re-hydrating reviews (merging snippets into JSONB)..." — twice. First run hung for 5+ hours before being killed. Second run hung for 40+ minutes.

**Root Cause**: Post-streams re-hydration loop (lines 924-947) iterated over all 700 city directories, re-queried Supabase for each city's providers, then did ~22,000 individual sequential `await supabase.update()` calls — one per provider, no batching, no parallelism, no progress logging. This was **100% redundant work**:
- Stream D (line 899-910) already hydrated `rating` + `review_count` into `google_reviews_data` JSONB
- Stream B (`enrichReviewsAndImages`, line 1078-1081) already merged review snippets into the same JSONB column and wrote to Supabase

The re-hydration loop re-set the same `rating` and `review_count` values that were already there. With 22K sequential writes over a single connection, it either exhausted the connection pool or hit Supabase statement timeouts and hung silently (no error handling, no timeout, no progress logging).

**Fix**: Removed the redundant loop entirely (replaced with a comment explaining why). The enrichment phase now ends cleanly after streams A/B complete. Total fix: deleted 23 lines, added 3-line comment.

**Time to Resolution**: ~20 minutes of investigation once `/troubleshoot` was invoked. But ~16 hours of wall clock time were wasted across two runs before the investigation started — the first run was left overnight assuming it was "just slow," the second run was given 40 minutes before recognizing the same pattern.

**Why I didn't catch this earlier**:
- **Assumed "still running" = "making progress."** The process had 0.9% CPU and open TCP connections, which I reported as "still alive." I should have checked the log's last-modified timestamp immediately — 5 hours without a log write is not "slow," it's hung.
- **No progress logging in the loop.** 22K sequential writes with zero console output means no way to distinguish "working" from "stuck" without external monitoring.
- **Didn't read the code until asked.** I checked `ps`, `tail`, `lsof` — all process-level diagnostics. I never read `pipeline-batch.js` to understand what "Re-hydrating reviews" actually does until TJ invoked `/troubleshoot`. One `grep` for the log message would have found the loop and the redundancy in 2 minutes.

**Prevention**:
- When a long-running script stops producing log output for >5 minutes, check the log file's modification timestamp immediately — don't assume the process is working just because `ps` shows CPU usage
- Any loop doing >100 sequential DB writes MUST have progress logging (at minimum every 100 iterations)
- Before writing a post-processing step, check if upstream steps already did the same work — trace which functions write to the same column
- Added this pattern to `/troubleshoot`: for batch scripts, "log not updating" is the equivalent of "flashes then disappears" — the process reached a point and got stuck, not failed

**Lesson**: A process with CPU usage and open connections is not necessarily making progress. The absence of log output IS the diagnostic signal — treat "no new log lines" the same way you'd treat an error message. And always read the code before monitoring the process: understanding what a step does takes 2 minutes and prevents 16 hours of wasted wall time.

---

### 2026-04-09: Five bugs from entity refactor — variable renaming without full grep

**Symptom**: Pipeline batch run failed on 49 out of 50 states. `ReferenceError: stateCode is not defined` in phaseDive. Separately, phaseReport would have written files to the wrong directory for regions. Admin dashboard had a state/region selection collision. And `searchParams` silently converted 50+ static pages to dynamic rendering.

**Root Cause**: All 5 bugs shared one pattern: **renaming a variable or changing a function signature without grepping for all downstream references.**

The entity refactor changed pipeline functions from `(stateCode, stateName)` to `(entity)` and set local vars like `const stateName = entity.name`. But:

1. **phaseDive return object** still had `state: stateCode` — `stateCode` was no longer defined. This one bug crashed all 49 batch states.
2. **phaseReport** set `const stateCode = entity.stateCode || entity.dirName` but used `stateCode` for `writeFile()`. For regions, `entity.stateCode` = parent state ("FL"), so the report would write to `data/pipeline/FL/` instead of `data/pipeline/miami-dade-county-fl/`.
3. **phaseReport line 1484** referenced `stateCode` in a template literal after the variable was renamed to `dirName`. Would throw ReferenceError.
4. **Admin dashboard** added `selectedRegion` state but the state card `onClick` didn't clear it. Both could be selected simultaneously.
5. **State page searchParams** — `await searchParams` in a server component opts the page out of static generation. Added `?v=1` toggle, didn't realize it made ALL state pages dynamic (`ƒ` instead of `●` in build output).

**Fix**: Bugs 1-4 were caught in self-review after TJ asked for a thorough audit. Bug 5 was caught in the second audit. All fixed: `stateCode` → `entity.stateCode`, `writeFile(stateCode,...)` → `writeFile(dirName,...)`, added `setSelectedRegion(null)`, replaced `?v=1` with `/current` sub-route.

**Time to Resolution**: Bugs 1-3: ~10 minutes in first self-review. Bug 4: ~2 minutes. Bug 5: ~15 minutes (required build verification to spot the SSG→dynamic change).

**Why I didn't catch these earlier**:
- **Rushed the refactor.** Changed function signatures across 6 functions and their call sites in one pass without running `grep stateCode` on each function body after the change. The return objects and console.log strings retained old variable names.
- **Didn't verify build output changed.** After adding `searchParams`, I ran `next build` and checked it passed — but didn't compare the route markers (`●` vs `ƒ`) against the previous build.
- **Self-review was prompted, not proactive.** TJ had to ask "think critically about what we just built" before I caught these. Should have done a `grep stateCode` sweep after the refactor as a matter of course.

**Prevention**:
- **After ANY function signature refactor**: grep for the old parameter name in the entire function body, including return statements and string templates. `sed -n 'START,ENDp' file | grep oldVar` takes 5 seconds.
- **After changing a server component's props**: compare build output route markers (`●` static vs `ƒ` dynamic) before and after. Reading `searchParams` or `cookies()` silently opts out of static generation.
- **After adding parallel state (e.g., `selectedRegion` alongside `selectedState`)**: check all `setState` calls clear the other selection.

**Lesson**: When you rename a variable across a large function, the compiler catches type errors but NOT runtime references in string templates, return object literals, or console.log calls. JavaScript's loose typing means `stateCode` in `{ state: stateCode }` compiles fine — it just throws at runtime. Grep is your friend after every refactor, not just when something breaks.

---

### 2026-04-06: `/erase` slash command missing across instances

**Symptom**: TJ couldn't find the `/erase` command in a new Claude Code session, despite the erase script being merged to staging (PR #485).

**Root Cause**: The erase tool was built as a standalone Node script (`scripts/erase.mjs`) but no `.claude/commands/erase.md` slash command was created to wire it up. The script existed, but the discoverability layer was missing. Secondary issue: `.claude/` was in `.gitignore`, which would have blocked future command files from being committed (existing commands were grandfathered in from before the ignore rule).

**Fix**: Created `.claude/commands/erase.md` wrapping the script with mode detection, preview-before-confirm safety, and usage docs. Updated `.gitignore` from `.claude/` to `.claude/*` + `!.claude/commands/` so future commands are always committable.

**Prevention**: When building a new tool script, always create the matching slash command in the same PR. Added to `/troubleshoot`: if a user says a command is "missing," check both the script AND the `.claude/commands/` wiring.

**Lesson**: A tool that exists but can't be discovered doesn't exist.

---

### 2026-04-09: 85% draft failure rate — misdiagnosed as parse errors, actually API rate limiting

**Symptom**: Pipeline discovered 10-16 programs per state but only 3-8 got drafted. TJ saw state pages with 3 programs when 15 existed. Ran the batch 3 times over several hours — same result each time. 479 out of 561 draft attempts failed (14.6% success rate).

**Root Cause**: Claude API rate limit of 8,000 output tokens per minute. Each draft call generates ~4,000 tokens. With 3 concurrent draft workers across 3 concurrent states, we were requesting ~36,000 output tokens/minute — 4.5x the limit. The first 2-3 programs per state succeeded, then every subsequent call returned HTTP 429. The 429 error was caught by the generic error handler and stored as `_error`, but the batch kept running and counting them as permanent failures.

The error message was clear: `"rate_limit_error","message":"This request would exceed your organization's rate limit of 8,000 output tokens per minute"`. But I never looked at the actual error content — I assumed "parse errors" based on the field name `_parseError` and the general concept of "Claude returning malformed JSON." Three separate batch runs hit the same rate limit, and I kept re-running with the same configuration expecting different results.

**How It Was Fixed**:
1. Added 429 retry with exponential backoff to `claudeChat()` — up to 5 retries, 15-60s waits
2. Increased Claude rate limiter from 300ms to 8s between calls
3. Dropped draft concurrency from 3 to 1 (sequential within a state)
4. Dropped batch concurrency default from 3 to 1 (sequential across states)

Florida test: 16/16 programs drafted (was 3/16). Takes ~8 min/state but 100% success.

**Time to Resolution**: The rate limit was present from the very first batch run. Three re-runs over ~2 hours before TJ pushed me to investigate the actual error. The fix itself took 15 minutes once the real cause was identified. ~2+ hours wasted on re-runs.

**Why I didn't catch this earlier**:
- **Never read the error messages.** I ran aggregate statistics (`filter(p => p._error || p._parseError).length`) but never printed the actual `_error` string. One `console.log(f._error)` would have shown `429: rate_limit_error` immediately.
- **Assumed the diagnosis.** The field was called `_parseError` so I assumed parse errors. The pipeline has two failure types (`_parseError` for JSON parse failures, `_error` for API errors) — I conflated them. Most failures were `_error` (429), not `_parseError`.
- **Re-ran without changing anything.** Three identical batch runs with the same concurrency hitting the same rate limit. The definition of insanity. After run 2 showed the same 14% success rate, I should have investigated why, not run it again.
- **Optimized the wrong thing.** I spent effort parallelizing dive (5x) and draft (3x) calls to make the pipeline faster, without checking if the API could handle the throughput. Speed optimization before reliability is backwards.

**Prevention**:
- **Before adding API concurrency: check rate limits.** Read the API docs or check the dashboard for the key's tier/limits. The Anthropic rate limit was documented and would have been visible in the API console.
- **After a batch run fails: read the ACTUAL error messages, not just counts.** `errors.slice(0, 3).forEach(e => console.log(e._error))` takes 10 seconds.
- **If the same batch fails twice with the same rate: the problem is systemic, not transient.** Don't re-run — investigate.
- **Add 429 retry as default for ANY API integration.** Rate limits are not exceptional — they're expected operating conditions. Every `fetch` to an external API should handle 429.

**Lesson**: When a batch job fails at a consistent rate across multiple runs, the failure is deterministic — something about the approach is fundamentally wrong. Don't re-run; investigate. And always read the actual error messages before theorizing about the cause.

---

### 2026-04-11: Texas routes bypass V3 — parallel route shadows

**Symptom**: Texas state page and program pages rendered V1/V2 layouts on Vercel despite V3 being built and working for all other states. User saw the old dark-header program list page instead of the StatePageV3 discovery platform, and the old tabbed/V2 program page instead of ProgramPageV3.

**Root Cause**: Texas has a **parallel route structure** that shadows the generic routes:

| Generic route (V3-enabled) | Texas-specific route (V1 hardcoded) | Redirect |
|---|---|---|
| `/senior-benefits/[state]/page.tsx` → `StatePageV3` | `/texas/benefits/page.tsx` → hardcoded V1 | `/senior-benefits/texas` → `/texas/benefits` (301) |
| `/senior-benefits/[state]/[benefit]/page.tsx` → `ProgramPageV3` | `/texas/benefits/[slug]/page.tsx` → hardcoded V2 | `/senior-benefits/texas/:benefit` → `/texas/benefits/:slug` (301) |

The Texas routes were created for SEO-friendly URLs (`/texas/benefits/star-plus` instead of `/texas/star-plus-home-and-community-based-services`) but were never updated when V3 was built. The 301 redirects in `next.config.ts` ensured that all Texas traffic went to the V1 routes, completely bypassing the V3 code.

Two compounding issues on program pages:
1. The Texas route used `getProgramById` (raw) instead of `getEnrichedProgram` (merge layer) — so pipeline data never merged in
2. The merge layer's `findDraftMatch` couldn't match base IDs (`star-plus-home-and-community-based-services`) to pipeline IDs (`tx-star-plus-medicaid-hcbs`) — the fuzzy matching only did exact normalized comparison, missing the `texas-` vs `tx-` prefix difference

**How It Was Fixed**:
1. `lib/program-data.ts`: Added state-prefix-stripped matching and name-based fallback matching to `findDraftMatch`
2. `app/texas/benefits/[slug]/page.tsx`: Switched from `getProgramById` to `getEnrichedProgram`, added `ProgramPageV3` branch
3. `app/texas/benefits/page.tsx`: Added `pipelineDrafts` + `StatePageV3` rendering with social proof queries, matching the generic route exactly

**Time to Resolution**: ~25 minutes for program pages (found via user screenshot showing V2), ~10 minutes for state page (same pattern, caught on second report). Total: ~35 minutes across both fixes.

**Why I didn't catch this earlier**:
- I built V3 by modifying the generic `/senior-benefits/` routes, never checking if parallel routes existed
- The Texas routes were created in an earlier session by a different context — I didn't have awareness they existed
- My dev server testing used `/senior-benefits/texas/...` URLs which correctly render V3, but the production redirects send traffic to `/texas/benefits/...`
- The self-review bug sweep checked component rendering and type safety, but not **route-level rendering paths**

**Prevention**:

1. **CLAUDE.md addition**: When upgrading a page component to a new version (V2→V3), grep for ALL routes that render that page type — not just the one you're editing. Search: `grep -r "ComponentName\|page-type-keyword" app/`
2. **Route audit checklist**: Before declaring a page upgrade "done," check `next.config.ts` redirects for any paths that bypass the upgraded route
3. **Memory saved**: Texas has parallel routes at `/texas/benefits/` that shadow `/senior-benefits/texas/` — any future benefits page changes must update BOTH

**Lesson**: When a Next.js project has 301 redirects, the redirect destination is the REAL route that users hit. Upgrading the source route without upgrading the destination means nobody sees your changes. Always follow the redirect chain to find where traffic actually lands.
