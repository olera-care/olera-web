# Pre-Test Critical Review

Before the user tests the latest changes, do a thorough self-review to catch bugs and unintended behaviors. The goal: stop the back-and-forth troubleshooting cycle that erodes trust by catching real issues BEFORE the user invests time in testing.

## The Bar

**Most code doesn't work the first time.** Treat this review as if you're stress-testing the code, not validating it. Assume there are bugs and look for them. If you don't find any, that's fine — but say so honestly. **Do not hallucinate issues to look thorough.**

## What to do

1. **Re-read every file you changed in this session.** Not summaries — the actual code. Pay attention to the parts you wrote quickly.

2. **Trace the full chain end-to-end.** For each user-facing feature, walk through:
   - Source data (DB schema, API response, URL params)
   - Server processing (route handlers, queries, RLS)
   - Client state (props, useState, derived values, useEffects)
   - Render guards (conditional rendering, loading states)
   - JSX output (what the user actually sees)
   
   If any link in the chain drops or transforms a value unexpectedly, the bug is there — not where the symptom shows up.

3. **Apply the /troubleshoot mental model.** Even though nothing is broken yet, ask:
   - Where could external systems modify inputs? (URL params, cookies, email clients)
   - Where could child components override parent state?
   - Where could a fetch silently fail (RLS, auth, network)?
   - Where could a render guard reject valid data?
   - Where could a CHECK constraint or NOT NULL break an insert?

4. **Verify schema assumptions.** If you wrote DB inserts/updates this session, re-check the actual migration files for the tables you touched. Column names, CHECK constraints, NOT NULL fields, FK references. **Do not trust your memory of the schema.**

5. **Test the data layer directly when possible.** Use `npx tsx -e '...'` or a temporary script to verify functions return expected shapes against real data. The pipeline-drafts and waiver-library are large and surprising — small assumptions break easily.

6. **Run type check.** `npx tsc --noEmit 2>&1 | grep "error TS" | wc -l`. Should be 0.

7. **Check for these common bug classes:**
   - **Race conditions** in client-side state (auth resolving after first render, fetch racing with navigation)
   - **Unreachable code** (skeletons inside conditionals that gate them out)
   - **Silently swallowed errors** (`.single()` instead of `.maybeSingle()`, missing error checks)
   - **Broken links** to routes that don't exist
   - **CHECK constraint mismatches** in DB inserts
   - **Hardcoded data that should be live** (program info that won't reflect pipeline updates)
   - **Render flicker** between loading states and final state
   - **Empty/zero edge cases** (what if the array is empty? what if the count is 0?)
   - **Cookie/session timing** (does the server see the cookie immediately after setSession?)
   - **Provider category / state filtering** assumptions (multi-category strings, null states)

8. **Read child components that consume props** you set. The notification card incident: the parent set the right value, the child overrode it. Always verify the value reaches the render layer.

## How to report

For each bug found:
- **Severity** (🔴 critical, 🟡 medium, 🟢 cosmetic)
- **Symptom** (what would the user see)
- **Root cause** (what's actually wrong)
- **Fix** (the specific change)

Then fix the bugs you found, type-check, commit, and push.

If you find nothing, **say so directly**. Don't pad the report. Don't invent issues. A clean review is a fine outcome — it means the work was solid the first time.

## What NOT to do

- Don't list every line you read as if it's a finding
- Don't list "potential" bugs that aren't actually bugs
- Don't claim to have found bugs you didn't actually find
- Don't add error handling for impossible scenarios
- Don't refactor or improve code beyond fixing the specific bugs found

## Reference: past sessions where pre-test review caught real bugs

- **Session 75 (benefits save-results route):** caught 4 critical bugs before user tested — accounts table no email column, seeker_activity CHECK constraint, duplicate profile creation, .single() vs .maybeSingle()
- **Session 76 (welcome page integration):** caught 3 bugs — race condition flash, unreachable skeleton, broken /portal/benefits link
- **Session 76 (lead with strongest screen):** caught 1 bug — save button shown when 0 matches, would have created confusing welcome page state

The pattern: every session has 1-4 real bugs that this review catches. Don't skip it.

Now execute this review for the most recent session's changes.
