# UI/UX Critique

Diagnose a screen and recommend visual/UX improvements. This command **diagnoses, it does not build** — it produces a prioritized critique, not edits. When you want the recommendations actually implemented, run `/punch` (the execution counterpart).

Screenshot: $ARGUMENTS

## First: study the inspiration folder (do NOT skip, do NOT anchor on one)

Before forming any opinion, ground the critique in real reference frames — not abstract adjectives. The reference set lives here and **grows over time**, so read what's actually in it each run:

```
~/Desktop/olera-hq/docs/Design Inspirations/
```

As of this writing it holds **Airbnb, Perena, Wispr Flow, Robinhood, Wise, Grok, Open AI, Day One, Duolingo** — and it keeps growing. Open what's actually there; don't trust this list.

1. `ls` the folder and **open a real spread across the subfolders** — several different apps, multiple frames each. This is the input that makes the critique non-generic; skimming it is the failure mode.
2. Notice what they have *in common* (the transferable DNA) and where they *differ* (proof there's no single right answer).

> ⚠️ **The anti-anchor rule.** No single app is "the template." They contradict each other on nearly every surface choice — warm cream vs. clean white vs. confident dark, serif vs. bold sans, centered card vs. split layout. Treat any one example as ONE data point, never the rule. If you catch yourself recommending everything be warm cream because Perena is cream — stop. Pull the *principle*, then judge the surface treatment that fits *this* screen. (Many of the most polished mobile products in the set are **dark** — dark is a first-class choice, not an exception.)

## Design Philosophy

Olera's visual identity should capture:
- **Airbnb**: Clean, spacious, trustworthy, photography-forward, user-friendliness and thoughtfulness
- **Apple**: Simplicity, precision, restraint
- **Claude**: Warm, calm, sophisticated, thoughtful use of whitespace, product value
- **The Browser Company**: UX innovation, delightful interactions
- **Telegram/Revolut**: Responsiveness and animations
- **Linear/Notion/Luma**: Modern but simple and elegant
- **Robinhood**: Approachable UX for complex decisions
- **Instagram**: Visual-first, scroll-stopping design
- **Modern simplicity**: Nothing unnecessary, every element earns its place
- **Elegant restraint**: Premium feel without being flashy or corporate

The goal is an interface that feels calm and reassuring (important for senior care) while being modern and trustworthy. Think "boutique hotel" not "hospital" or "insurance company".

Note: The screenshot is for content/layout reference — focus suggestions on styling and visual treatment.

## Read the component (when a path is available)

If you're given (or can locate) the component file, read it before critiquing. The screenshot shows one state; the code shows them all. Understand the data, what's conditional, what's interactive, and what states exist (empty, loading, error, populated) — a critique blind to the empty/loading/error states misses half the screen. If only a screenshot is available, say so and scope the critique to what's visible.

## Core Design Values

Every critique should evaluate through these lenses:
- **Anticipate needs**: Does the UI predict what the user wants next? Does it surface the right information at the right time?
- **Reduce friction**: Is there anything unnecessary between the user and their goal? Can we remove a step, a click, a moment of confusion?
- **Exceed expectations**: Does this feel generic, or does it have a thoughtful touch that makes the user feel cared for?

## Analysis Framework

### 1. First Impressions (3-second test)
- What draws the eye first?
- Is the hierarchy clear?
- Does it feel cluttered or balanced?

### 2. Visual Design
- **Spacing**: Is there consistent padding/margins? Does it feel cramped or too sparse?
- **Typography**: Is the hierarchy clear? Are text sizes appropriate?
- **Colors**: Good contrast? Consistent with Olera's palette (teal accent, warm backgrounds)?
- **Alignment**: Are elements properly aligned? Any visual tension?
- **Do you see any way we can improve the UI/visuals here?**

### 3. UX Evaluation
- Before we write any code, do you see any way we can thoughtfully improve the UX here?
- Does the layout anticipate what the user needs to decide?
- Is there unnecessary friction between the user and their goal?
- Does the experience exceed expectations or feel generic?

### 4. Olera-Specific
- Matches the "calm, premium, Airbnb-simple" aesthetic?
- Appropriate use of cards/surfaces?
- Does it communicate trust and warmth for the senior care context?

### 5. Mobile / Responsive
- **Does it hold up at 375px wide?** Bold on desktop, broken on mobile = not bold.
- Tap targets large enough; nothing relying on hover-only affordances?
- On mobile, are there unneeded containers? Prefer whitespace + hairline dividers over nested boxes (one hero surface, never nest boxes).
- Does the layout reflow sensibly, or does desktop spacing/columns just get crushed?
- For deeper mobile-specific refinement, hand off to `/mobilize`.

### 6. Accessibility
- Sufficient color contrast?
- Would it work in Dark Mode?
- Text readable at default sizes?

## Output Format

Provide:
1. **What's Working** - Don't just criticize, note what's good
2. **Suggested Improvements** - Prioritized list with specific, actionable changes
3. **Quick Wins** - Small changes with big impact
4. **Optional Enhancements** - Nice-to-haves if time permits

Be specific. Instead of "improve spacing", say "Add 16pt padding between the cards".

Invite the user's own read before finalizing — they often have a take on the screen.

---

When the recommendations are ready to build, run `/punch` to implement them (or `/mobilize` for a mobile-specific pass). This command stops at the diagnosis.
