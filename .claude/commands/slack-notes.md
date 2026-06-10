# Slack Notes — Post PR Update to Team

Post a short, problem-focused Slack note to the team channel in TJ's voice. Length: 2–4 sentences. Not a press release.

## Usage

`/slack-notes <channel> <PR or topic>` — e.g. `/slack-notes ai-product-development PR #582`

If no args, default to:
- Channel: `#ai-product-development` (ID `C0A91BA205T`)
- Topic: the most recently merged PR on `staging`

## The bar

**Problem-focused, not task- or detail-technical.** TJ's voice frames ships in terms of the *user problem solved*, not the code paths touched. Resist the urge to write a PR description in Slack.

Two failure modes to avoid:
- **Too verbose** — bulleted lists of outcomes, named examples of providers, root-cause technical explanation. Reads like a PR body.
- **Too task-y** — "I wrote X. I changed Y. I filed Z." — reads like a status report.

The target: one sentence naming the problem, one sentence on what shipped, one sentence with a forward-looking ask or deploy plan. Done.

**Hard rules (TJ, learned the hard way):**
- **No PR links or numbers in the note.** "Shipped via #844 → promoted to main in #846" means nothing to the team — it reads like a changelog. State that it's live in prod; drop the PR trail entirely. (PR refs belong in the Notion report, not Slack.)
- **No internal/engineer metaphors, no tying pieces together with cause analogies.** Phrases like "same root shape", "same kind of bug as X", "ghost record", "strangler-fig" are jargon nobody outside the work cares about. Don't explain *why* two things are related. If a second piece of work is worth mentioning, state plainly what the user can now do: e.g. "Also fixed: deleting a provider in the admin panel now actually removes it from olera.care (before, it could still show up on the site)." Outcome the user sees — nothing about tables, root causes, or shared patterns.
- **Lead with the concrete, quantified change. Demote what the team already knows.** Open on the specific operational thing that changed — a number, a frequency, a timing shift ("capped at 3 a week per provider", "spread across the week instead of one big Monday blast"). The conceptual / "smart" angle the team has already heard about (e.g. "meets each provider where they are") gets ONE passing clause at most, never the lede. If TJ has to tell you to emphasize the number and de-emphasize the known part, the draft led with the wrong thing.
- **Tag order = most-involved first.** Don't default to a fixed `@Logan @Esther`. Tag whoever's work this ship most directly touches first (e.g. Esther first when it reconciled with / built on her area), then the others.
- **One clause to stop a tagged teammate misreading the change.** If the headline ("capped at 3 a week") could make a tagged person think their own feature got hit when it didn't, add a short clarifying clause ("real-time stuff like new leads still always sends"). One clause — not a paragraph.

**Voice reference (don't go fetch it):** TJ's voice = terse, direct, concrete, problem-focused — and the ✅ examples in this file ARE the calibration. Do NOT go read `~/Desktop/TJ-hq/SCRATCHPAD.md` or other TJ-hq docs "to get a sense of his voice" — those are long-form, Claude-written session logs (documentation voice, not Slack voice) and will only pull the draft toward verbose. The step-4 cues + the examples below are the source of truth.

## Steps

1. **Gather minimum context**
   - PR number, title, merge status
   - Two or three words for the problem ("org search", "provider onboarding routing", "caregiver dashboard polish")
   - Nothing more — don't read the PR body looking for facts to include

2. **Find channel ID**
   - Default: `#ai-product-development` = `C0A91BA205T`
   - Other channels: try `slack_search_channels`; fall back to `slack_read_channel` with the channel name on miss (per memory `feedback_slack_private_channels.md`)

3. **Find the right people to tag**
   - For provider/MedJobs/caregiver work: Logan + Esther — but order by who this ship most directly touches (most-involved first; see Hard rules), not a fixed order.
   - Scan the recent channel history for who's been working on adjacent pieces and tag them

4. **Draft the message in TJ's voice — TIGHT**

   Voice cues from TJ's actual ship messages:
   - Opens: `Hey @person @person` — not "Hey y'all" for channel shares
   - Names the problem, not the solution: "Fixed the org search issue" — not "Org search now does X across Y + Z"
   - One sentence of technical detail at most. No bullets. No named examples (no "Home Instead Houston", no "Aggie").
   - Include deploy plan casually: "On staging, will be promoted to main later today" or "Shipping to staging tonight"
   - Close with a collaborator ask: "Will be looking for bugs but let me know if you catch any related to X"
   - No sign-off, no "thanks", no emojis (unless the update warrants celebration — rare)

5. **Format for Slack**

   **Do:**
   - Inline links: `<https://url|Link label>` — never `[label](url)`
   - Bold: `*single asterisks*`
   - Italic: `_underscores_`
   - Inline code: `` `backticks` ``
   - Tag users: `<@U0131NJURA7>` (or use their `@Name` which Slack resolves)
   - Em-dashes `—` for asides

   **Don't:**
   - No markdown headers (`#`, `##`)
   - No `**bold**`
   - No bullet lists in short notes — prose flows better when the message is 2-3 sentences
   - No triple-backtick code blocks

6. **Review step — always**

   Show the draft to TJ before sending. Ask: "Send as-is, revise, or skip?"

   TJ has explicitly flagged that messages from Claude Code to Slack sometimes look unwieldy. Never assume the draft is good enough. Use `slack_send_message_draft` if unsure.

## The gold-standard template

```
Hey @Person @Person
<Verb + problem>. <One sentence of tight technical detail if needed>. On staging, <deploy plan>.

<Ask: what you want them to watch for>
```

## Examples

### ✅ Correct tone (TJ's actual PR #582 ship, 2026-04-17)

> Hey @Logan @Esther
> Fixed the org search issue. Now does a proper union across olera-providers + business_profiles. On staging will be promoted to main later today.
>
> Will be looking for bugs and such but let me know if you catch any related to provider search and matching on staging

### ❌ Wrong tone — too verbose (what Claude drafted first for PR #582)

> Hey y'all — first of the two P1s from yesterday shipped.
>
> PR #582 merged to staging. Org search now does a proper union across olera-providers + business_profiles:
> • MedJobs "Your organization" finds franchise locations like Home Instead Houston (was returning zero)
> • BP-only providers like Aggie Assisted Living are findable — previously invisible despite being live + claimed + actively engaged
>
> Turned out the real cause was every olera-providers query silently erroring on a nonexistent hero_image_url column. The merge logic masked it, and two prior fixes tweaked dedup around a broken select. Good reminder to check server logs first when a query returns unexpectedly empty.
>
> Filed a companion P2 for the admin directory — same bug, opposite direction.

Why it's wrong:
- Names specific providers (Home Instead Houston, Aggie) — too much detail
- Bulleted user-visible outcomes — reads like marketing copy
- Root-cause technical paragraph — nobody asked
- References companion P2 — scope creep for a ship note
- Sign-off with thanks + emoji — not TJ's voice

### ✅ Correct tone (TJ's DB diagnosis message, 2026-04-16)

> Hey @Logan @Esther — Did some work on diagnosing the database issue for providers who can get a match
>
> So we have two provider tables (`olera-providers` + `business_profiles`) that should really be one. Causing lingering issues: partial MedJobs search results, providers seeing 0 reviews after creating accounts from scratch, ~110 orphaned provider accounts as of today.
>
> Two different issues to tackle. Two P1 tasks now on the Notion board:
> • _<notion-url|Fix provider onboarding search dropping unclaimed franchise locations>_ — the MedJobs symptom. Tackling in the next 36 hours.
> • _<notion-url|Unify olera-providers and business_profiles tables>_ — the structural fix. 1-2 week strangler-fig migration, chipping away over the coming weeks.
>
> Both have full context written out

Note: this is a **setup message for a larger body of work** — so it's allowed to be longer and include Notion refs. Ship messages stay tight.

## When to break the short-form rule

Longer messages are appropriate when:
- Setting up a new body of work (like the DB diagnosis message above)
- Post-mortem or incident update
- Process/policy change that needs explanation
- Explicit request for detailed feedback

For standard ship messages after a PR merge: **always short**.

## Safety

- Always show the draft before sending
- Only post to shared channels after explicit "send" confirmation from TJ
- Default to `slack_send_message_draft` when uncertain
- Never post on TJ's behalf without him seeing the draft first
