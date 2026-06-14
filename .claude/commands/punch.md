# Punch — Make It Bold, Simple, and Alive

Take a page or component screenshot and make it punchier, bolder, simpler. Not a full redesign — surgical sharpening. The goal: every element earns its space, text pops, the page has personality.

**Bar:** it should feel like *someone cared* — not a template, not a UI kit demo, not AI-generated. Calm confidence, clean hierarchy, restrained components, great spacing, human microcopy.

---

## First: study the inspiration folder (do NOT skip, do NOT anchor on one)

The reference set lives here and **grows over time** — read what's actually in it each run, don't assume:

```
~/Desktop/olera-hq/docs/Design Inspirations/
```

As of this writing it holds **Airbnb, Perena, Wispr Flow, Robinhood (mobile), Wise (mobile)**, with more coming (e.g. Grok). Before forming any opinion:

1. `ls` the folder and **open a representative sample across MULTIPLE subfolders** — not one. At least 3–4 different apps, 1–2 frames each.
2. Notice what they have *in common* (that's the transferable DNA) and where they *differ* (that's proof there's no single right answer).

> ⚠️ **The anti-anchor rule.** No single app is "the template." Perena is warm/cream/centered; Airbnb is clean/white/two-column; Robinhood and Wise are dark with a bright accent; Wispr is a warm split-flow. They're all excellent and they contradict each other on surface choices. **Treat any one example as ONE data point, never as the rule.** If you catch yourself making everything cream because Perena is cream, stop — that's the failure this command exists to prevent. Pull the *principle*, then choose the surface treatment that fits *this* screen.

---

## The transferable DNA (app-agnostic — these hold across every example)

These are the things that are true whether the screen is warm, white, or dark. This is what "study the references" should leave you with:

- **One focal point.** Each screen has a single thing the eye lands on first — a number, a card, a headline. Everything else is clearly secondary. When a section tries to say five things, it says nothing.
- **Headlines that command.** Big, tight leading, imperative/conversational. "Open your accounts." "Welcome TJ! A few questions to get started." The headline *is* the page — not "Eligibility Information."
- **Proof is scannable, never paragraphs.** A 3-up row works when each item is a *number or 2–3 words* (Robinhood: `4.25% · $2.5M · $0`). The same 3-up fails as three sentences. If you keep value props, compress them to label-scale.
- **Intentional composition.** Rarely everything-stacked-at-one-width. Split layouts (action left, support/visual right — Wispr, Airbnb), or a single hero number that dominates (Perena, Wise). Pick a composition; don't default to a vertical list.
- **One accent, used sparingly.** Whether it's Robinhood gold, Perena purple, or Olera teal — interactive emphasis is *one* color, not three.
- **A single high-contrast CTA.** Black on light, bright on dark — the heaviest, most unmissable element. Pinned or prominent. Never a polite, forgettable link.
- **Atmosphere = confidence.** Every example has a deliberate ground: warm cream, clean white, or rich dark — chosen, not accidental. Plus restraint: generous space, soft elevation, nothing sharp or loud.
- **Human microcopy.** Conversational, short, warm. "Here's what you'll need," not "Required Documentation List."
- **Motion with restraint.** Gentle entrances, 150–250ms transitions, alive-but-calm. Nothing bouncy or attention-grabbing for its own sake.

## Choosing the surface treatment for THIS screen

The DNA above is fixed; the *aesthetic* is a choice. Decide it from the screen's job and the closest-fitting reference — not from habit:

- **Background:** warm cream (welcoming, editorial — Perena/Wispr) vs. clean white (transactional clarity — Airbnb) vs. confident dark (focused, premium, data-forward — Robinhood/Wise). Match the *mood the task wants*.
- **Composition:** split flow for "pick options + continue"; single hero number when a number is the message; centered single card for one focused action.
- **Accent:** one color. In the Olera repo, the brand palette is teal (`#96c8c8` / `primary-*`) + warm amber (`#e9bd91`) on vanilla/warm neutrals — use it *when warmth fits*, but don't force warmth onto a screen that wants crisp white or focused dark.

Name the chosen treatment explicitly in your plan ("white, two-column, teal accent — Airbnb-leaning, because this is a transactional flow") so the choice is deliberate and reviewable.

---

## The Two Lenses (in priority order)

### 1. Simplicity & Boldness (most important)

The page should hit you — not with noise, with clarity.

**Text that pops:**
- Headlines COMMAND. Big, tight leading, imperative/conversational. One strong statement beats three weak ones.
- Kill filler microcopy. If the content is self-explanatory, the label is noise.
- Numbers are HEROES. Pull the key number out big; don't bury it in prose.

**Visual boldness:**
- Hierarchy obvious from 5 feet away (squint test).
- ONE thing per section. Whitespace is boldness — cramped reads as timid.
- One high-contrast CTA. Contrast *between* sections — not everything at one visual volume.

**Simplicity:**
- Count the elements. Can you cut 30%? Cards inside cards = visual bureaucracy.
- Every border, badge, label, icon: does it help the user DECIDE or ACT? If not, cut it.
- Trust through restraint — fewer elements read as more confidence.

### 2. Character & Style

Once it's bold and simple, give it soul — *in the chosen aesthetic*, not a fixed one.

- **Atmosphere** appropriate to the screen (warm / white / dark), with soft elevation and rounded, non-aggressive shapes.
- **Personality:** one organic or characterful element per scroll-height (a hand-drawn underline, a textured ground, a real illustration with specificity — not a generic icon). Bold scale shifts between sections.
- **Composition:** split layouts where they fit; quiet stat moments; at most one "dark/loud moment" per screen, card-sized, not a full-width band — *unless* the whole screen's chosen ground is dark.
- **Alive interactions:** hover/focus that shifts shadow/scale/border, not just color.

**What character is NOT:** decoration for its own sake; quirk at the expense of clarity; five organic elements where one would do; importing another app's palette wholesale.

---

## Process

### Step 1: Study the references
Open 3–4 frames across *different* subfolders (see top). Notice the space, the element count, how the headline hits — and how the apps *differ*, so you don't anchor on one.

### Step 2: Read the component
Read the actual code. Understand the data, what's conditional, what's interactive, what states exist.

### Step 3: The 5-second audit
1. **What draws the eye?** Is it the right thing?
2. **What's the hierarchy?** Can you tell in 3 seconds what this screen IS?
3. **What's redundant?** Same info twice? Labels restating the obvious?
4. **Where's the dead air?** Same bg, width, weight everywhere — no variety?
5. **What would the leanest reference cut?** Which 40–60% would disappear?

### Step 4: Name the direction (decide, don't list)
State the chosen surface treatment (background / composition / accent) and *why*, tied to the screen's job and the closest reference. One direction — no option menus.

### Step 5: Surgical edits (max 8)
Pick up to 8 specific changes, prioritized by impact, across: typography, layout, spacing, component density, tone/microcopy, motion.

### Step 6: Implement, then before/after
Build. Verify (typecheck/build). For each change state: **Before** (why it was flat) → **After** (what changed) → **Principle** (which lens).

---

## Implementation toolkit — creating rhythm, killing monotony

The principles say WHAT; this says HOW. A page that uses one max-width, one background, one text weight for every section is a wall — people bounce off walls. Make each section deliberately differ from the last so scrolling feels like progression.

### Width variation

| Content type | Width | Why |
|---|---|---|
| Focused prose | `max-w-2xl` | readable line length, intimate |
| Interactive tools (tables, forms, checklists) | `max-w-3xl` | tools need room |
| Hero / stat moments | `max-w-4xl` | scale commands attention |
| Maps, grids, spatial layouts | `max-w-5xl` | spatial content needs space |
| Full-bleed / loud moment | `max-w-none` | a scroll-stopping break |

The width *change* between sections is itself the visual interest.

### Background / zone shifts (in the chosen aesthetic)
Alternate grounds so zones don't bleed together — *within the palette you picked*. Warm scheme: vanilla base, white floating cards, one bold moment. White scheme: white base, faint-gray or tinted zones, white cards with hairline borders. Dark scheme: rich base, slightly-lighter elevated cards, the accent for emphasis. The move is the same (shift the ground between zones); the colors follow the chosen treatment.

### Typography scale shifts
Bold pages jump dramatically between sizes — uniform sizing is monotony.

| Element | Scale |
|---|---|
| Page title | `display-sm` / `display-md` (the biggest thing) |
| Section heading | `text-2xl` / `text-3xl` |
| Section label (eyebrow) | `text-xs uppercase tracking-wide` |
| Body | `text-base` / `text-lg` |
| Quiet metadata | `text-sm text-gray-500` |
| Hero number | `display-xs` / `display-sm` |

### Section spacing
| Transition | Spacing |
|---|---|
| Between major zones | `mb-16` (64px) min |
| Between items in a zone | `space-y-10` |
| Label → content | `mb-3` |

Generous spacing reads as confidence; cramped reads as anxiety.

### Organic / characterful elements (sparingly — one per scroll-height)
Used as scanning aids, not decoration: a hand-drawn underline on the key word; a wavy divider only between the 1–2 biggest zone transitions; a textured/atmospheric ground; an illustration with real specificity. One is personality; five is a craft fair.

---

## Quick reference: common punches

| Symptom | Punch | Principle |
|---|---|---|
| Headline doesn't command | Display scale, tight leading, imperative | Boldness |
| Key number buried in text | Extract to a standalone hero moment | Simplicity + Boldness |
| Section bleeds into next | Shift the ground, add a divider, or double the spacing | Boldness |
| Too many badges/pills/labels | Kill the ones restating the obvious | Simplicity |
| Value props as paragraphs | Compress to a label-scale 3-up (number/2–3 words) | Simplicity |
| CTA is polite and forgettable | One high-contrast CTA, pinned/prominent | Boldness |
| Everything stacked vertically | Split composition (action left, support/visual right) | Character |
| Flat interaction | Focus ring + hover shadow/scale, 150–250ms | Character |
| Page feels template-y | One characterful element + a deliberate ground | Character |
| One undifferentiated background | Shift zones — in the chosen aesthetic, not a default one | Boldness |
| Everything same width | Break one section wider or narrower | Boldness |
| 5+ things competing | Cut to 2. Restraint = confidence. | Simplicity |
| Corporate microcopy | Make it conversational | Character |

---

## Anti-patterns

- **Don't anchor on one example.** No single app is the template. Derive the principle, choose the surface treatment for *this* screen. (This is the #1 failure mode.)
- **Don't default to a fixed aesthetic.** Warm cream is not always right; neither is white or dark. Choose deliberately from the screen's job.
- **Don't add features.** This is sharpening, not building. No new sections, no new data.
- **Don't add copy.** Punch means LESS text, not more.
- **Don't over-decorate.** One characterful element per scroll-height. Two is personality; five is a craft fair.
- **Don't sacrifice clarity for style.** If the bold version is harder to understand, revert.
- **Don't make polite CTAs.** Direct, high-contrast, unmissable.
- **Don't ignore mobile.** Bold on desktop, broken on mobile = not bold.
