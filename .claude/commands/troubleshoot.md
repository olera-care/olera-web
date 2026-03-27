# Troubleshoot Issue

Problem: $ARGUMENTS

## Rules of Engagement

**This is important. Take your time and dig deep.**

1. **Do NOT come back until this is fixed AND verified**
2. **This may be a repeat attempt** - the obvious fix likely didn't work. Look deeper.
3. **Assume the simple solution was already tried and failed**

## Troubleshooting Protocol

### Phase 1: Verify Inputs Before Debugging Processing (CRITICAL)

Before writing ANY code, confirm the data actually reaches your code:

1. **Check the raw input.** Ask the user: "What URL is in your browser bar?" / "What does the console show?" Compare what was SENT vs what ARRIVED.
2. **External systems modify inputs.** Email clients strip URL params (Apple Mail strips `token`, `session`, `key`). CDNs cache stale responses. Proxies rewrite headers. Browser extensions block requests.
3. **If the input is wrong, no amount of processing fixes will help.** You'll write 10 correct fixes that are all DOA.

### Phase 1b: Layer Analysis

Before writing ANY code, determine which layer is actually broken:

**For Web / React issues:**
| Layer | What it does | How to verify |
|-------|--------------|---------------|
| External input | URL params, API response, email link | Compare source URL vs browser URL. Console.log the raw value. |
| Data fetch | API call or DB query | Check network tab. Does the query return data? RLS blocking? Auth required? |
| Parent state | React state in the page component | Console.log after setState. Is the value what you expect? |
| Props to child | Parent passes state as props | Console.log inside child. Does the prop arrive? |
| Child state init | `useState(prop)` or derived state | **DANGER**: Child may override/transform the prop. Read the `useState` initializer. |
| Render guard | `if (state === "x" && data)` | Console.log inside the guard. Does it pass? Which condition fails? |
| Actual render | JSX output | Inspect the DOM. Is the right component rendered? |

**For Voice Assistant / NLU issues:**
| Layer | What it does | How to verify |
|-------|--------------|---------------|
| Speech Recognition | Converts voice to text | Check transcript - is the text correct? |
| LLM Extraction | Extracts structured data from text | Check logs for extracted values (city, age, etc.) |
| Keyword Fallback | Regex/pattern matching backup | Check if patterns exist for this input |
| Data Lookup | Converts extracted data to actionable values (e.g., city → ZIP) | Check if lookup function receives correct input |
| State Application | Applies extracted data to ViewModel | Check if state is being set |

**Ask yourself:**
- "What logging exists to verify each layer?"
- "If I add a console.log, where should it go?" **Put it at the RENDER site, not the fix site.**
- "Is the problem that data isn't arriving, isn't processed, or isn't rendered?"

**Common traps:**
- Fixing upstream while the bug is downstream (child overrides parent)
- Assuming the input arrives (email client stripped it)
- Fixing processing when the data fetch returned null (RLS, auth, network)

### Phase 2: Trace the Full Chain (Source → Pixel)
- Don't just grep for the obvious. Read the actual files involved.
- **Trace the FULL chain from data source to rendered output:**
  - Data source (API, DB, URL param) → fetch/query → parent state → props → child state initialization → render guards → JSX output
  - If ANY link drops or overrides the value, your fix upstream is worthless
- Check if there are multiple components that could be responsible
- Look for overrides, parent constraints, or conflicting styles
- **Read child component `useState` initializers** — `useState(prop)` only uses the prop on FIRST render. If the child has derivation logic (ternaries, conditionals), the prop may be silently overridden.
- **Add logging at the RENDER site, not the fix site** — a console.log inside the render guard tells you immediately if your fix is reaching the output

### Phase 3: Identify the Real Cause
- The symptom location may not be the cause location
- **When the same symptom persists across multiple fix attempts, move DOWNSTREAM** — you're probably fixing the right value at the wrong layer
- Check for:
  - **Child state overriding parent props** (e.g., `useState(preVerifiedEmail ? "X" : initialProp)`)
  - **Render guards with multiple conditions** (e.g., `if (state && data)` — state is right but data is null)
  - **Data fetches that silently fail** (RLS blocking anon client, auth required, network error swallowed)
  - **External systems modifying inputs** (email clients stripping URL params, CDN caching, proxy rewriting)
  - Parent view constraints overriding child settings
  - Multiple components with similar names (e.g., ProviderCard vs ProviderTile)
  - Cached/stale builds masking changes
  - Conditional rendering using different components
  - **Missing functionality** (feature not implemented, not just broken)
  - **Fallback paths not triggered** (condition prevents fallback from running)
  - **Silent failures** (no logging = no visibility into what's happening)

### Phase 4: Implement the Fix
- Fix ALL instances, not just the first one found
- Consider if similar issues exist elsewhere
- **If adding to a multi-path system (LLM + fallback), fix BOTH paths**
- Add logging if it was missing - future debugging depends on it

### Phase 5: Verify (REQUIRED)
- Build the project: `npx next build` (web) or `xcodebuild -scheme OleraClean -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build` (iOS)
- If possible, describe what visual change should be observable
- If the fix involves multiple files, list all files changed
- **If logging was added, explain what logs to look for**
- **For web: verify the deployment has your commit** — check Vercel deployment details before asking user to test

### Phase 6: Report Back
Only after verification, provide:
1. **Root cause**: What was actually causing the issue
2. **Why previous attempts may have failed**: What was missed
3. **What was changed**: Specific files and changes
4. **How to verify**: What the user should see differently
5. **Logging added**: What new logging can be checked in future

---

## Case Study: Notification Card Never Rendered (Mar 2026)

**12 failed fixes** across 3 compounding root causes. Each fix was correct at its layer but DOA because a downstream layer silently discarded it.

| Round | What was tried | Why it failed |
|-------|----------------|---------------|
| 1-5 | Fixed race conditions, PKCE, sequencing, session swap | Token was stripped by Apple Mail before code ran (input never arrived) |
| 6 ✅ | Renamed `token` param to `otk` | Token now arrives — but notification card still doesn't show |
| 7-9 | Set `actionCardState = "notification-lead"` in parent | Data fetch returned null (RLS blocks anon client) AND child component overrode the state |
| 10 ✅ | Fetched notification data server-side in validate-token | Data arrives — but child STILL shows "pre-verified" |
| 11 | Verified deployment, retested | Same result — something downstream is overriding |
| 12 ✅ | Found `SmartDashboardShell` line 257: `preVerifiedEmail ? "pre-verified" : initialActionState` | **This one line overrode every upstream fix.** Notification card finally renders. |

**Three lessons:**
1. **Verify inputs arrive before debugging processing.** "Show me the URL in your browser bar" should be the FIRST question.
2. **Trace the full render chain (source → pixel) before fixing.** A console.log at the render guard would have caught the override on attempt 1.
3. **When the same symptom persists, move downstream.** Stop fixing the parent when the child is silently overriding the prop.

---

## Case Study: City Recognition Bug (Jan 2026)

**8 failed fixes** because they all targeted the wrong layer.

| Attempt | What was tried | Why it failed |
|---------|----------------|---------------|
| 1-5 | Added keywords to VoiceIntentParser | LLM extraction was being used, not keyword parser |
| 6-7 | Fixed city lookup logic | City was never extracted to begin with |
| 8 ✅ | Added logging, found LLM wasn't extracting city, fixed LLM prompt AND added keyword fallback | Fixed the actual broken layer |

**Lesson**: Always verify which layer is broken before fixing. Logging is your friend.

---

Now investigate thoroughly. Don't rush.
