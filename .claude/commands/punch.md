# Punch — Make It Bold, Simple, and Alive

Take a page or component screenshot and make it punchier, bolder, simpler. Not a full redesign — surgical sharpening. The goal: every element earns its space, text pops, the page has personality.

**Bar:** Perena warmth + Wispr Flow character + Apple simplicity + Airbnb confidence. It should feel like someone cared — not a template, not a UI kit demo, not AI-generated.

## Input

$ARGUMENTS — Screenshot of the page/component to sharpen, or a file path to the component.

---

## The Two Lenses (in priority order)

### 1. Simplicity & Boldness (most important)

The page should hit you. Not with noise — with clarity.

**Text that pops:**
- Headlines should be confident. Big serif, tight leading, real words.
- Kill filler microcopy ("Here you can find...", "This section shows..."). Say the thing.
- Numbers should be bold. "$2,901/month" not "the monthly income limit is approximately $2,901"
- One strong statement > three weak ones. Edit ruthlessly.

**Visual boldness:**
- Hierarchy should be obvious from 5 feet away. If you squint, can you tell what matters?
- Contrast between sections — not everything at the same visual volume
- Whitespace is boldness. Cramped = timid. Breathing room = confidence.
- One bold moment per scroll-height. Not zero (flat), not three (noisy).

**Simplicity:**
- Count the visual elements. Can you kill 20% of them?
- Every border, badge, label, icon — does it help the user decide or act? If not, kill it.
- Reduce nesting. Cards inside cards inside sections = visual bureaucracy.
- If two things say the same thing (text + icon + badge), keep one.

### 2. Character & Style

Once it's bold and simple, give it soul.

**Perena energy:**
- Soft atmospheric warmth — organic shapes, not geometric precision
- Teal (#96c8c8) + warm amber (#e9bd91) as accent colors, always subtle
- Rounded corners, gentle shadows, nothing sharp or clinical

**Wispr Flow energy:**
- Hand-drawn elements: organic SVG paths, slightly imperfect lines, floating dots
- Bold scale shifts — jump from text-sm to display-md between sections
- "Confident imperfection" — elements that say "a human designed this"
- Small delights: hover states that feel alive, transitions that breathe

**What character is NOT:**
- Decorative illustration for decoration's sake
- Excessive organic elements on every section
- "Quirky" at the expense of clarity
- More visual elements (character often means FEWER elements, each with more personality)

---

## Process

### Step 1: Read Before Touching

Read the actual component code. Understand what data flows in, what's conditional, what's interactive. Don't design in a vacuum.

### Step 2: The 5-Second Audit

Look at the screenshot (or render the page) and answer:
1. **What draws the eye?** Is it the right thing?
2. **What's the hierarchy?** Can you tell in 3 seconds what this page/component IS?
3. **What's redundant?** Same information shown twice? Labels restating what's obvious?
4. **Where's the dead air?** Sections with no visual personality — same bg, same width, same weight as everything around them?
5. **Where's the clutter?** Too many borders, badges, pills, or boxes competing for attention?

### Step 3: Surgical Edits (max 8)

Pick up to 8 specific changes. Each one should be implementable in under 5 minutes. Prioritize by impact.

**Typography punches:**
- Bump key headlines to display scale (display-sm, display-md)
- Kill unnecessary labels/descriptions — if the content is self-explanatory, the label is noise
- Tighten line-height on headlines (leading-tight, leading-snug)
- Make numbers bold and prominent — don't bury them in sentences

**Layout punches:**
- Add breathing room (py-16 between major sections, not py-8)
- Width variation — break the same-width monotony
- Background shifts between zones (vanilla-200/30, white, gray-50)
- Kill nested containers — flatten the visual hierarchy

**Visual punches:**
- Add ONE organic element if the section has none (wavy divider, hand-drawn underline, accent blob)
- Make the primary CTA unmissable — size, contrast, position
- Hover states that feel alive (not just color change — shadow, slight scale, border shift)
- Kill visual noise: unnecessary borders, redundant icons, badge soup

### Step 4: Implement

Make the changes. Build. Verify.

### Step 5: Before/After Check

For each change, state:
- **Before:** what it looked like and why it was flat
- **After:** what changed and why it's better
- **Principle:** which lens this serves (simplicity, boldness, or character)

---

## Quick Reference: Common Punches

| Symptom | Punch | Principle |
|---------|-------|-----------|
| Headline doesn't pop | Bump to display scale, serif, tighter leading | Boldness |
| Wall of same-weight text | Pull key numbers/facts into their own visual moment | Simplicity |
| Section bleeds into next | Add bg shift, wavy divider, or extra spacing | Boldness |
| Too many badges/pills/labels | Kill the ones that restate the obvious | Simplicity |
| Card feels like a database row | Reduce fields, increase spacing, add warmth (rounded, softer border) | Character |
| CTA is easy to miss | Bigger, darker, more contrast, more breathing room around it | Boldness |
| Interactive element feels flat | Add focus ring, hover shadow, transition duration 200ms | Character |
| Page feels template-y | One organic SVG element (underline, blob, divider) | Character |
| Numbers buried in prose | Extract to standalone stat — big font, quiet label | Simplicity + Boldness |
| Everything same width | Break one section wider or narrower | Boldness |

---

## Anti-Patterns

- **Don't add features.** This is sharpening, not building. No new sections, no new data.
- **Don't add copy.** Punch means LESS text, not more. Kill labels before adding them.
- **Don't over-decorate.** One organic element per scroll-height. Two is personality, five is a craft fair.
- **Don't sacrifice clarity for style.** If the bold version is harder to understand, revert.
- **Don't ignore mobile.** Bold on desktop, broken on mobile = not bold. Check both.
