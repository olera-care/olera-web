# Post-Mortem Analysis

Issue that was fixed: $ARGUMENTS

## Purpose

After fixing a bug or resolving an issue, analyze what happened to prevent recurrence. Every painful bug should make the system smarter.

## Reflection Protocol

### 1. Document the Issue

Write a brief summary:

```markdown
## Post-Mortem: [Date] - [One-line title]

### What Happened
[1-2 sentences describing the symptom the user would see]

### Root Cause
[What actually caused it - be specific about the code/logic error]

### How It Was Fixed
[What change resolved it - reference files/lines]

### Time to Resolution
[How long did debugging take - honest assessment]
```

### 2. Analyze the Process

Ask yourself:
- **Why didn't I catch this earlier?** (Missing test? Bad assumption? Unfamiliar pattern?)
- **What assumption was wrong?** (About the data? The API? The UI behavior?)
- **Was there a pattern I should have recognized?** (Similar bug elsewhere?)

For agent-workflow failures, also ask:

- Did a workflow default become an invented permission gate despite existing user authorization?
- Did I preserve the user's eligibility and total-budget constraints, or broaden them while following a unit-price approval?
- Did I distinguish a tool rejection from a product limitation, reassess after new explicit authorization, and avoid bypassing review?
- Did I verify external writes before retrying, and stop blind writes when screenshot and accessibility state conflicted?
- Is the operational issue actually resolved? Record partial success and unresolved tool faults separately from command/documentation fixes; do not invent a resolution time.

Update the canonical shared command that caused the behavior, remove contradictory old wording, and inspect its linked workflows. A post-mortem entry alone is not prevention. Added based on the September 16, 2026 Nextdoor setup post-mortem.

### 3. Identify Tooling Improvements

Consider updates to prevent recurrence:

**CLAUDE.md updates:**
- [ ] New "Don't Do" item?
- [ ] New pattern to document?
- [ ] New file to call out as important?

**validate-swift.py updates:**
- [ ] New pattern to flag?
- [ ] New warning to add?
- [ ] Existing check that could be stricter?

**Command updates:**
- [ ] `/troubleshoot` needs new investigation step?
- [ ] `/review` checklist needs new item?
- [ ] `/explore` should look for this pattern?

### 4. Make the Updates

If any improvements identified:
1. Make the specific changes to the files
2. Log in SCRATCHPAD.md under "Decisions Made"
3. Note: "Added based on [issue] post-mortem"

### 5. Log the Post-Mortem

Append to `docs/POSTMORTEMS.md`:

```markdown
---

### [Date]: [One-line title]

**Symptom**: [What the user saw]

**Root Cause**: [Technical explanation]

**Fix**: [What changed]

**Prevention**: [What we updated to catch this in the future]

**Lesson**: [One-sentence takeaway]

---
```

Create the file if it doesn't exist with this header:
```markdown
# Post-Mortems

> Lessons learned from bugs and issues. Each entry makes the system smarter.

---
```

---

## When to Run This

- After any bug that took more than 30 minutes to debug
- After any bug that was embarrassing or would have affected users
- After any bug where you said "I should have caught that"
- When you want to turn frustration into improvement

## The Mindset

Bugs aren't failures - they're tuition. The goal isn't to never have bugs (impossible), but to:
1. Never have the *same* bug twice
2. Catch bugs earlier in the process
3. Build knowledge that compounds over time

---

## Example

```
/postmortem Fixed the navigation crash when tapping provider twice

## Post-Mortem: Jan 20, 2026 - Double-tap navigation crash

### What Happened
App crashed when user tapped a provider card twice quickly.

### Root Cause
NavigationLink was being triggered twice, pushing two views onto the stack simultaneously. The second push happened before the first finished animating.

### How It Was Fixed
Added `.disabled(isNavigating)` state that sets true on first tap and resets in `.onDisappear`. Prevents double-push.

### Time to Resolution
45 minutes (20 min reproducing, 25 min fixing)

---

Updates made:
- Added to /review checklist: "Check NavigationLinks for double-tap handling"
- Added to CLAUDE.md Don't Do: "Don't use NavigationLink without preventing double-taps"
```
