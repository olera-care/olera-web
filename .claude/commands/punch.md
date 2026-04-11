# Punch — Make It Bold, Simple, and Alive

Take a page or component screenshot and make it punchier, bolder, simpler. Not a full redesign — surgical sharpening. The goal: every element earns its space, text pops, the page has personality.

**Bar:** Perena warmth + Wispr Flow character + Apple simplicity + Airbnb confidence. It should feel like someone cared — not a template, not a UI kit demo, not AI-generated.

**Reference files:** Study the design inspiration screenshots before making changes:
- `~/Desktop/olera-hq/docs/Design Inspirations/Wispr Flow/` — onboarding flow, dashboard, illustrations
- `~/Desktop/olera-hq/docs/Design Inspirations/Perena/` — portfolio, convert, invest pages

## Input

$ARGUMENTS — Screenshot of the page/component to sharpen, or a file path to the component.

---

## The Design DNA (study these before every punch)

### Wispr Flow — what makes it feel alive

Wispr Flow's power comes from RESTRAINT combined with CONFIDENCE. Study the actual screenshots:

**Radical content restraint.** Each screen shows ONE thing. "Choose your Mac type" — two cards, nothing else. Massive empty space around them. The emptiness is intentional — it says "this is the only thing that matters right now." When a section tries to say 5 things, it says nothing.

**Headlines that command.** "Press the keyboard shortcut to use Flow." "Dictate 100 words, extend your trial a day." Not "Here you can learn about..." — DIRECT. Imperative mood. Tight leading. Big. Black. The headline IS the page.

**Split composition.** Content on the left, illustration/demo on the right. Not stacked vertically — side by side. The illustration gets 50%+ of the viewport. It's not decoration — it shows the product doing something (Slack conversation, person at desk). Context, not ornament.

**Black CTAs.** "Continue" buttons are full-width, black, pill-shaped. Not brand-purple, not gradient. Black on cream. Maximum contrast. Unmissable. The CTA is the heaviest element on the page.

**Conversational microcopy.** "Let's get the right version for your computer." "Trying this flow thing out. Let's see if I like it." Human warmth in 10 words. No corporate speak. No "please select your preferred option."

**Illustrations with personality.** The person at the desk has a specific posture, specific clothes, specific energy. The person juggling envelopes is in motion. These aren't stock — they're characters. They make you feel something.

**Warm beige everywhere.** Not white. Not gray. A warm cream/beige (#f5f0eb) that says "welcome." The warmth IS the brand. White would feel clinical. Gray would feel corporate.

**One dark moment per screen.** The notification card ("You earned an extra free day") — dark background, small, with an illustration inside. Not a full-width band. A CARD-sized dark moment. Precious, not loud.

**Stats as quiet confidence.** Dashboard sidebar: "12.2K total words | 121 again | 5 day streak" — prominent but not screaming. The numbers are big enough to read at a glance. No charts, no graphs. Just the number and a quiet label.

### Perena — what makes it feel trustworthy

Perena's power comes from ZEN-LEVEL SIMPLICITY combined with ATMOSPHERIC WARMTH.

**Numbers as heroes.** "$3.999" takes up half the viewport. MASSIVE serif number. Everything else — tabs, table, buttons — is secondary. The number IS the product. When you have a key number, make it the biggest thing on the page.

**Atmospheric background texture.** Soft photographic/painterly texture behind the content — not a flat color, not a CSS gradient. Organic depth. Like looking through frosted glass at a warm landscape. Gives soul without competing with content.

**One card, one action.** The convert page: one white card, one input field, one button. The buy page: one card, one amount field, one "Buy USD*" button. Minimal to the point of confidence. "We don't need to explain — just do the thing."

**Trust through restraint.** For a financial product, showing LESS is MORE trustworthy. The same applies to senior benefits. A page with 20 elements says "we're trying to convince you." A page with 3 elements says "we're confident in what we have."

**Purple as the singular accent.** One color for interactive elements. Consistent, sparse. Not teal AND amber AND emerald. One.

**Soft elevation.** Cards float on the cream background with barely-there shadows. Elevated but gentle. Nothing sharp, nothing aggressive.

---

## The Two Lenses (in priority order)

### 1. Simplicity & Boldness (most important)

The page should hit you. Not with noise — with clarity.

**Text that pops:**
- Headlines should COMMAND. Big, black, tight leading. Imperative mood. "Do you qualify?" not "Eligibility Information"
- Kill filler microcopy. If the content is self-explanatory, the label is noise.
- Numbers should be HEROES. "$2,901/month" pulled out, big, prominent — not buried in a paragraph.
- One strong statement > three weak ones. Edit ruthlessly.
- Conversational tone. "Here's what you'll need" not "Required Documentation List"

**Visual boldness:**
- Hierarchy obvious from 5 feet away. Squint test.
- ONE thing per section. Not three things crowded together.
- Whitespace is boldness. Cramped = timid. Empty space = confidence.
- Black CTAs for primary actions. Maximum contrast. Unmissable.
- Contrast between sections — not everything at the same visual volume.

**Simplicity:**
- Count the visual elements. Can you kill 30%?
- Every border, badge, label, icon — does it help the user DECIDE or ACT?
- Reduce nesting. Cards inside cards = visual bureaucracy.
- If two things say the same thing, keep one.
- Trust through restraint — fewer elements = more confidence.

### 2. Character & Style

Once it's bold and simple, give it soul.

**Warmth:**
- Warm backgrounds (vanilla/cream, not white). White is clinical. Warmth says welcome.
- Organic shapes over geometric. Rounded corners, soft shadows, hand-drawn paths.
- Teal (#96c8c8) + warm amber (#e9bd91) as accents, always subtle.

**Personality:**
- One organic SVG element per scroll-height (underline, blob, divider). Enough to say "a human designed this."
- Bold scale shifts — jump from text-sm to display-md between sections.
- Illustrations with SPECIFICITY — not generic icons. Characters, scenes, context.
- Hover states that feel alive — not just color swap. Shadow shift, gentle scale, border warmth.

**Composition:**
- Split layouts where possible (content left, visual right) instead of everything stacked.
- Stats as quiet sidebar moments — big number, small label, no chart.
- One dark card-sized moment (not full-width band) for the most important single fact.

**What character is NOT:**
- Decoration for decoration's sake
- Excessive organic elements on every section
- "Quirky" at the expense of clarity
- More elements with less personality each

---

## Process

### Step 1: Study the References

Before touching code, open 2-3 screenshots from the design inspiration folders. Let the energy soak in. Notice the SPACE. Notice how few elements are on each screen. Notice how the headlines hit.

### Step 2: Read the Component

Read the actual code. Understand what data flows in, what's conditional, what's interactive.

### Step 3: The 5-Second Audit

Look at the screenshot and answer:
1. **What draws the eye?** Is it the right thing?
2. **What's the hierarchy?** Can you tell in 3 seconds what this page IS?
3. **What's redundant?** Same info shown twice? Labels restating the obvious?
4. **Where's the dead air?** Same bg, same width, same weight — no visual variety?
5. **What would Wispr Flow cut?** If this were a Wispr Flow screen, which 60% would disappear?

### Step 4: Surgical Edits (max 8)

Pick up to 8 specific changes. Prioritize by impact.

**Typography punches:**
- Bump key headlines to display scale. Tight leading. Black. Imperative.
- Kill unnecessary labels — if content is self-explanatory, the label is noise
- Pull key numbers OUT of prose into standalone moments (big number, quiet label)
- Make microcopy conversational. "Here's what you'll need" not "Required Documents"

**Layout punches:**
- Add breathing room (py-16 between major sections, not py-8)
- Width variation — break monotony
- Background shifts between zones (vanilla-200, white, cream)
- Try split composition — content left, visual right — instead of stacked

**Visual punches:**
- Black primary CTAs. Not brand-colored. Black.
- ONE organic element per scroll-height (hand-drawn underline, wavy divider, accent blob)
- Warm background — replace white with vanilla/cream where possible
- Kill visual noise: unnecessary borders, redundant icons, badge soup

### Step 5: Implement

Make the changes. Build. Verify.

### Step 6: Before/After Check

For each change, state:
- **Before:** what it looked like and why it was flat
- **After:** what changed and why it's better
- **Principle:** which lens (simplicity, boldness, or character)

---

## Quick Reference: Common Punches

| Symptom | Punch | Principle |
|---------|-------|-----------|
| Headline doesn't command | Display scale, black, tight leading, imperative mood | Boldness |
| Key number buried in text | Extract to standalone hero moment (big serif, quiet label) | Simplicity + Boldness |
| Section bleeds into next | Background shift, wavy divider, or double the spacing | Boldness |
| Too many badges/pills/labels | Kill the ones that restate the obvious | Simplicity |
| CTA is polite and forgettable | Black, full-width or near-full, pill-shaped. Unmissable. | Boldness |
| Everything stacked vertically | Try split composition (content left, visual right) | Character |
| Interactive element feels flat | Focus ring, hover shadow+scale, transition 200ms | Character |
| Page feels template-y | One organic SVG element (underline, blob, divider) | Character |
| White background everywhere | Warm cream/vanilla. White is clinical. | Character |
| Everything same width | Break one section wider or narrower | Boldness |
| 5+ things competing for attention | Cut to 2. Restraint = confidence. | Simplicity |
| Corporate microcopy | Conversational. "Here's what you need" not "Required Items" | Character |

---

## Anti-Patterns

- **Don't add features.** This is sharpening, not building. No new sections, no new data.
- **Don't add copy.** Punch means LESS text, not more.
- **Don't over-decorate.** One organic element per scroll-height. Two is personality, five is a craft fair.
- **Don't sacrifice clarity for style.** If the bold version is harder to understand, revert.
- **Don't use white backgrounds.** Default to warm cream/vanilla unless there's a reason for white (cards that float on cream).
- **Don't make polite CTAs.** "Continue" not "Click here to proceed." Black, bold, direct.
- **Don't ignore mobile.** Bold on desktop, broken on mobile = not bold.
