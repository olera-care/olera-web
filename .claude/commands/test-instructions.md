# Test Instructions

Produce the manual QA checklist to follow when testing what was just built. Optional argument `$ARGUMENTS` names a specific feature/PR/area to scope to; with no argument, scope to the changes made in this session.

This is the **human-facing** complement to `/pre-test`:
- `/pre-test` = Claude stress-tests its own code to catch bugs *before* you test.
- `/test-instructions` = Claude tells you exactly how to *manually verify* it works, and what not to be fooled by.

Run `/pre-test` first when there's any doubt the code works; run `/test-instructions` to get the checklist you actually click through.

## Scope

- Default: the changes made in **this session** — read the actual diff (`git diff`, the files you edited). Do not work from memory.
- If `$ARGUMENTS` names a feature/PR/area, scope to that instead.

## How to build it

1. **Identify the user-facing surface.** What can a human actually see, click, or trigger? Skip pure-internal refactors with no observable behavior (say so plainly if there's nothing to manually test).
2. **Trace each flow end to end** from where the tester starts (a URL, a button, an email link) to the observable result. Note the exact path: page URL, tab, button label.
3. **Separate happy path from the part most likely to be broken.** Lead the happy path, but call out which step is the *real* test (the new/risky behavior), not just the obvious one.
4. **Hunt for expected-but-surprising behaviors** — things working as designed that look like bugs (an internal Slack alert still fires, a confirmation email still sends, a value is intentionally cached/stale). These cause the most false alarms. Flag each with ⚠️ and "expected, not a bug."
5. **List concrete failure signals** — what a broken result actually looks like, so the tester knows what they're hunting for, not just "check it works."
6. **Surface the traps** — deploy timing (wait for the Vercel build to go green), don't run destructive/suppressing actions on real data (staging shares the prod Supabase instance), which login/role is needed, etc.
7. **Edge cases worth one manual poke** — empty/zero state, multiple-variant data, reversibility (the undo path), the boundary the code keys on.

## Output format

Keep it tight and skimmable — terse, concrete, no filler. Use this shape, dropping any section that doesn't apply:

```
## Testing <feature> (on <env>)

**Before you start:** <preconditions — deploy green, migration applied, which login/role, which test record to use, what NOT to test on>

**Happy path**
1. <go to URL / tab> → <do X> → expect <observable result>
2. ...
   (call out which step is the actual test of the new behavior)

**Edge cases worth a poke**
- <empty/zero state> → expect ...
- <reversibility / undo> → expect ...

⚠️ **Expected, not bugs** (so you don't false-alarm)
- <surprising-but-correct behavior> — why it's fine

**Failure signals** (what broken looks like)
- <symptom> → would mean <root cause area>

**Traps**
- <deploy timing / shared staging+prod DB / prod data / auth>
```

## Rules

- **Ground every step in the real code.** If you didn't change a flow, don't tell anyone to test it. Read the diff.
- **Lead with the riskiest thing**, not the most obvious. The point is to catch the failure, not pad a checklist.
- **Be honest about coverage.** If something can't be manually verified (an analytics insert, a cron that runs later), say so and give the indirect check (DB row, log line, "watch X tomorrow") instead of pretending.
- **No invented severity or fake thoroughness.** A short checklist for a small change is the right answer.
- **Exact over vague.** "Refresh the Unanswered *and* Needs Email tabs" beats "check the queue."

Now generate the test instructions for the current change (or the feature named in `$ARGUMENTS`).
