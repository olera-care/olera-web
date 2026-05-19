# Mobilize — Mobile-First Refinement for Olera Webpages

Take a page that's fine on desktop and make it feel **native, calm, and confident** on mobile. Not a redesign. Not copy-punching (that's `/punch`). Not state-transition smoothing (that's `/dejank`). This is the *mobile-specific* pass: thumb economics, viewport reality, native flows, mobile typography, mobile motion, mobile density.

**Bar:** Airbnb's bottom-anchored Reserve button. Apple's one-thing-per-screen restraint. Telegram's instant gestures. Luma's full-bleed event hero. Linear's tight vertical rhythm. Instagram's gesture-first media. Robinhood's confident numbers + bottom nav. Wispr Flow's black pill CTA. Perena's atmospheric calm.

**Sacred rule:** Think before code. Restate the problem. Surface blindspots. Ask clarifying questions. **Wait for confirmation before editing.**

---

## Input

`$ARGUMENTS` — a screenshot of the page (mobile viewport preferred) plus a short description of what page this is and what feels off. If TJ pastes a screenshot without words, ask which page it is before doing anything else.

You will **not** boot a local browser. After implementation, TJ deploys to Vercel and shares fresh screenshots — that is your verification loop.

---

## Phase 0 — Ground in the inspirations (always, every run)

Before opening any code, `ls` the inspirations folder and pick exemplars that match the page archetype:

```
~/Desktop/olera-hq/docs/Design Inspirations/
  ├── Wispr Flow/      # onboarding, conversational flows, black CTAs, warm cream
  └── Perena/          # quiet trust, hero numbers, atmospheric texture, one-action cards
```

(More may have been added since this command was written — always `ls` fresh.)

**Always also `ls` `~/Desktop/olera-web/docs/Mobile Optimized Pages/`** — TJ's curated set of mobile pages he wants Olera to feel like. This is the most direct signal of taste; if a captured example matches the archetype you're working on, **open the PDF with the Read tool (`pages: "1-8"`) before writing a single class.**

The anchor reference in that folder is **`~/Desktop/olera-web/docs/Mobile Optimized Pages/Zapier Mobile Blog.pdf`** (Zapier blog index, mobile). Concrete patterns to lift from it:

1. **Utility bar over headline.** A small top row owns site nav + actions (Zapier logo + "Categories ▾"). The article headline sits *below* that row, **never beside it**. Olera's equivalent: back-link left, share/bookmark right, in one slim row above the title.
2. **Full-width bold headline.** Article H1 is ~28-30px bold sans, tight leading, edge-to-edge — wraps to ~3-4 lines, no narrow column, no action buttons competing for space. (Olera renders this at ~26px serif to honor the brand; the principle is the *room*, not the font.)
3. **Lighter dek, also full-width.** ~17-18px body weight under the H1, same edge-to-edge measure as the headline. Carries the explanation the H1 can't.
4. **Small byline row with dot separator.** Tiny avatar + "By Author · N min read" at ~13-14px gray. The smallest unit, last in the stack. (Olera's "Reviewed by Dr. Logan DuBose · Last verified <date>" follows the same shape.)
5. **Category eyebrow as small underlined link.** Above the H1, ~14-15px, indigo underlined — a tap target for browse, not a breadcrumb. Optional; Olera tends to use a back-link instead.

The recurring shape across this whole folder: **utility-bar-above / eyebrow / bold full-width headline / lighter full-width dek / byline.** The title and dek are never in the same row as action buttons.

Skim 2-3 screenshots that match the archetype of the page in question. **Let the spacing soak in. Notice how few elements appear per screen. Notice where the CTA sits. Notice how text scale jumps.** You're not copying the look — you're calibrating your taste before you critique.

If the inspirations folder has no good match for the archetype, lean on your trained knowledge of Airbnb, Apple, Telegram, Linear, Luma, Claude, Browser Company, Revolut, Robinhood, Instagram. Name the specific reference when you cite a principle ("Airbnb's sticky-bottom price band" not "good mobile UX").

---

## Phase 1 — Locate the code

From TJ's description, identify the page file(s). Likely paths:

- `app/<route>/page.tsx` — the route entry
- `components/<Feature>/<X>.tsx` — the components rendered inside
- `app/globals.css` / `tailwind.config.ts` — design tokens if anything global is in play

If the description is ambiguous (e.g., "the provider page" — there are several), **ask** which route. Don't guess. Wrong file = wasted critique.

Read the full component(s) before critiquing. Look specifically for:

- Tailwind responsive prefixes already in use (`md:`, `lg:`, `sm:`)
- Existing mobile-specific code paths (`useMediaQuery`, `isMobile`, sticky positioning)
- Door A / Door B logic on provider pages — sticky Connect button vs post-question Benefits flow ([[project_door_a_vs_door_b_dilemma]])
- Any `100vh` / `h-screen` (the iOS Safari trap)

---

## Phase 2 — Restate the problem

Before critiquing, say back to TJ in plain language:

1. **What page this is** (route + purpose)
2. **What the user is on this page to do** (book a consultation? ask a question? read a benefit? compare providers?)
3. **What you see going wrong on mobile specifically**, separated from "what's just a desktop preference"

Not "the design feels off" — concrete: *"The CTA is mid-page, requires scrolling past three sections to reach. Touch targets on the FAQ accordion look ~32px. The hero image is letterboxed because aspect ratio is fixed to 16:9 instead of fluid."*

If you can't yet name three concrete mobile problems, you haven't looked hard enough. Look again.

---

## Phase 3 — Critique through the six mobile lenses

Every critique must touch each lens. Skip a lens only if you can explain why it doesn't apply to this page.

### Lens 1 — Thumb Economics

The bottom third of the screen is prime real estate. The top third requires a stretch. Primary action lives at the bottom; passive info lives at the top.

- Where does the primary CTA sit? Is it reachable with one thumb without shifting grip?
- Is it **sticky to the bottom** with `pb-[env(safe-area-inset-bottom)]` on iOS? Airbnb's Reserve, Luma's RSVP, Robinhood's Buy — all sticky-bottom. Match that energy when the page has a single dominant action.
- If the page has multiple CTAs, which is primary? Is the visual weight aligned with intent, or are they all the same?
- Are tap targets at least **44px (iOS HIG) / 48dp (Material)** in their smallest dimension, including padding? Squint test: can a 50-year-old with adult-onset hand stiffness tap this without missing?

### Lens 2 — Viewport Reality

iOS Safari is not Chrome devtools. Real-device gotchas:

- `100vh` is broken on iOS Safari (URL bar in/out). Use `100dvh` (dynamic) or `100svh` (small) instead.
- Safe-area insets: any sticky-bottom element needs `padding-bottom: env(safe-area-inset-bottom)` or it sits under the home-indicator on iPhones.
- Top safe-area on notched devices: hero banners that hit the very top edge.
- Keyboard-open viewport collapse: forms that should scroll the active input into view; sticky-bottom elements that should hide when keyboard is up.
- Inputs at `< 16px` font-size trigger Safari zoom on focus. Always `text-base` (16px) minimum on inputs.

### Lens 3 — Native Flows (gestures, sheets, transitions)

The page should feel like a native app touched the web.

- **Bottom sheets > modals.** A modal that fills 90% of screen is just a sheet that forgot it was a sheet. If a flow doesn't need a destination URL, prefer a drag-handle bottom sheet (Instagram comments, Robinhood quick trade, Linear command-K on mobile).
- **Full-bleed media.** Hero images on mobile should hit edge-to-edge. Letterboxed images inside `max-w-2xl` look like a desktop screenshot pasted on a phone (the Airbnb/Luma/Instagram move).
- **Horizontal scroll for content shelves.** Stacking 8 provider cards vertically = an endless wall. A `snap-x` shelf with 1.2 cards visible = a curated row (Airbnb experiences, Apple App Store editorial). ([[feedback_horizontal_scroll_pattern]])
- **Swipe + back gesture.** Don't trap navigation in modals that swallow the iOS back swipe.
- **No hover states.** `:hover` is a no-op on touch. Pair every hover with `:active` (touch press feedback) and `:focus-visible` (keyboard).
- **Headlines never share a flex row with action buttons on mobile.** This is a hard rule, not a suggestion. A long H1 in `flex justify-between` with a `shrink-0` icon cluster will collapse toward its longest-word width on mobile and ladder one-word-per-line — and `flex-1 min-w-0` doesn't always rescue it (interactions with `inline-block` shrink-to-fit, `text-wrap: balance/pretty`, and intrinsic-size contributions defeat the naive model). The Zapier/Notion pattern: actions live in a **utility bar above** the title (back-link left, share/bookmark right). The headline wrapper is plain block on mobile (`sm:flex` only at desktop) so the H1 is a block-level child with no flex sibling — **unconditionally 100% width, regardless of any flex/inline-block subtlety**.

### Lens 4 — Typography & Density

Mobile typography is **less restrained**, not more. Bigger headlines, tighter leading, more whitespace between sections. The temptation to "shrink everything for mobile" is wrong — shrink margins, not headlines.

- Page title: depends on archetype. **Short marketing headlines** (Apple/Wispr) stay big — `clamp(28px, 8vw, 44px)` or `text-4xl` — they're the focal point. **Long content/reference titles** (Notion docs, Zapier feature guides, Olera benefits programs — sentence-length, often 50+ characters) sit in the Linear/Notion/Zapier register: ~24–28px bold on mobile, **owning the full content width**. Bigger than that on a long bureaucratic title fragments awkwardly; smaller (≤20px) feels timid. The "don't shrink headlines for mobile" rule applies to *short* headlines — long titles get full-width room, not bigger font.
- Section spacing: `py-12` minimum between major zones on mobile (less than desktop's `py-16`, but more than `py-6`).
- Line length: prose at `max-w-prose` even on mobile reads better than full-bleed text.
- One-screen rule: the hero + primary CTA should both be visible on a single iPhone 15 viewport (~852pt tall in portrait) without scrolling. If not, something else got prioritized over the action.
- **Senior-user reality:** Olera's audience includes 60+ adult children and the seniors themselves. Default to **17-18px body** not 14-15px. Default to **48px+ tap targets** not 44px. Calmer motion (no aggressive springs), generous spacing.

### Lens 5 — Mobile Motion

Telegram and Revolut feel premium on mobile because every tap has instant visual feedback. Olera should match.

- Tap feedback: `active:scale-[0.98]` or `active:opacity-80` on every interactive element. The element should *acknowledge the touch* in under 100ms.
- Spring physics for sheet open/close, not linear easing. Framer Motion: `{ type: "spring", stiffness: 300, damping: 30 }` for sheet entry.
- Page transitions: if the page sits inside a flow (provider → question → answer), each transition should feel like a slide-forward, not a hard cut. (Not every page needs this — but flows do.)
- **Respect `prefers-reduced-motion`** — wrap non-essential motion in a media query or use Framer Motion's `useReducedMotion`.
- **Don't animate layout properties** (`width`, `height`, `top`). Use `transform` and `opacity` — GPU-accelerated, no jank.

### Lens 6 — Performance & Network

Mobile users are often on 4G in a Starbucks. The page must paint fast.

- Above-the-fold images: `<Image priority>` with explicit `sizes`. Below the fold: `loading="lazy"`.
- Total mobile page weight target: **< 1MB on first paint**. Anything bigger needs justification.
- Avoid CLS (cumulative layout shift): reserve image dimensions, use skeleton placeholders for async content.
- Don't ship desktop-only JavaScript to mobile (e.g., complex hover interactions, large carousel libs) — code-split or conditionally import.

---

## Phase 4 — Surface blindspots (Olera-specific gotchas)

These are mistakes that have happened or could happen on Olera webpages specifically. Call out any that apply.

| Gotcha | Why it bites on mobile | Check |
|---|---|---|
| Sticky-bottom CTA without `env(safe-area-inset-bottom)` | CTA sits under home-indicator on iPhones, partially un-tappable | Grep for `fixed bottom-0` / `sticky bottom-0` |
| `h-screen` / `100vh` on hero sections | iOS Safari URL bar pushes hero off-screen | Replace with `min-h-[100dvh]` or `min-h-[100svh]` |
| Door A sticky Connect vs Door B post-question CTA | Mobile-optimizing one can accidentally kill the other | Confirm which door this page is. [[project_door_a_vs_door_b_dilemma]] |
| Form inputs < 16px font-size | iOS Safari auto-zooms on focus, breaks layout | `text-base` minimum on every input |
| Modal that fills the whole screen | Should be a bottom sheet with drag-to-dismiss | Look for `<Dialog>` / `<Modal>` with `max-w-md` on mobile |
| Hover-only states for tooltips, dropdowns | Tap dead-zones on mobile | Pair with `:active` / tap-to-toggle |
| Image weight not differentiated by viewport | Mobile users download desktop-sized images | `<Image sizes="(max-width: 768px) 100vw, 50vw">` |
| Email link routing back to mobile flow | Apple Mail strips `?token=` / `?session=` / `?key=` URL params | [[feedback_email_param_names]] |
| Carousel that requires arrow buttons | Arrow buttons are a desktop affordance | `overflow-x-auto snap-x snap-mandatory` for native swipe |
| Animation on `width` / `height` / `top` | Janky on mobile GPUs | Migrate to `transform: translate/scale` + `opacity` |
| Senior-user tap target < 48px | Misses + double-taps + frustration | Audit every interactive element |
| H1 sharing `flex justify-between` with action buttons | Title collapses to longest-word width, ladders one-word-per-line; `flex-1 min-w-0` often doesn't rescue it; multiple speculative CSS tweaks fail in sequence | Restructure: actions move to a utility bar above; title wrapper `sm:flex` only (block on mobile); H1 is a block-level child with no flex sibling |

---

## Phase 5 — Ask clarifying questions, then WAIT

After the critique, ask 2-4 sharp questions that would change the implementation. Examples of good questions:

- "This page has both a 'Connect' and 'Ask a question' CTA — on mobile, which is primary? I'd default to Connect as the sticky-bottom anchor, but Door B work suggests questions are the real engagement magnet."
- "Should the provider hero image go full-bleed edge-to-edge on mobile (Airbnb/Luma style), or stay inside the content gutter? Full-bleed is bolder but breaks the card aesthetic the rest of the page uses."
- "The FAQ accordion has 12 items — on mobile I'd suggest collapsing to 5 with a 'See all' link. Is the long form intentional for SEO, or can we shorten?"

Examples of **bad** questions (don't ask these):
- "Should I make it look more mobile-friendly?" (Empty — be specific.)
- "Do you want me to start coding?" (Yes, after you've answered the substantive questions — don't ask this separately.)

**Then stop. Wait for TJ's answers. Do not write code.**

Output a clear "Awaiting your call on the above before I edit." line at the end of the critique.

---

## Phase 6 — Implement (after confirmation)

Once TJ confirms direction:

1. **Scope to mobile breakpoints by default.** Most edits should be unprefixed (mobile-first) or `sm:`/`md:` overrides for larger screens. Don't break desktop unless explicitly cleared to.
2. **Touch one thing at a time when possible.** If three lenses fail (thumb economics, viewport, motion), make the thumb-economics fixes first, summarize, then continue. Easier to roll back partial state.
3. **Reference the inspiration when commenting commits.** "Sticky-bottom CTA pattern (Airbnb-style)" beats "improve CTA."
4. **Run the build before declaring done.** `npx next build` — Olera deploys via push, broken builds = wasted Vercel cycles.

After implementing, give a short summary:

- **What changed** (3-6 bullets, file paths included)
- **Which lens each change addressed** (thumb / viewport / native / type / motion / performance)
- **What to verify on Vercel** — specific things to check on a real iPhone, not generic "looks good"

---

## Phase 7 — Hand off to Vercel verification

After the **first commit** on the branch, **open a PR** (`gh pr create --base staging --head <branch>`). Vercel posts a preview comment on the PR with a **branch-aliased URL** (e.g., `olera-web-git-<branch>-olera.vercel.app`) that **always tracks the latest commit**. That URL is your one source of truth for the rest of the session — every subsequent push auto-updates it.

**Do not let TJ verify against pinned deployment URLs** (the random-hash subdomains like `olera-xyzabc-olera-vercel-app`). Each push mints a new hash; reopening an old one shows old code forever. This session lost 4 verification rounds to that exact trap — the user reopening a pre-fix deployment, seeing the bug, and concluding the fix didn't work. The PR preview link is the only link to share.

**Curl/WebFetch the deployment to verify which commit is live? Don't bother.** Vercel's WAF serves an HTTP 429 bot-challenge page (~33KB) to both `curl` and `WebFetch` on preview URLs — you get the challenge, not the real HTML. You can confirm the *committed source* via `git show` and the *deployed commit* via the PR's preview link in a browser; you cannot read the deployed DOM programmatically.

End the implementation phase with this exact handoff:

> "I won't test locally. The PR's Vercel preview link auto-updates on every push — use **only** that link (not a pinned deployment hash). I'm specifically watching for:
> - [thing X — e.g., 'CTA doesn't sit under the home-indicator']
> - [thing Y — e.g., 'hero image is full-bleed without horizontal scroll']
> - [thing Z — e.g., 'FAQ items are tappable without missing']
>
> If anything's off, paste the screenshot back and I'll iterate."

The local dev server is not the source of truth — the PR's auto-updating preview on TJ's real phone is.

---

## Phase 8 — Iteration loop (when screenshots come back)

When TJ shares back-from-Vercel screenshots:

1. **Compare to intent.** Each thing flagged in Phase 7 — did it land? Don't take the screenshot at face value; look hard.
2. **Identify what regressed.** Mobile changes sometimes break desktop. Ask if desktop still looks right or if a screenshot of desktop is needed too.
3. **Resist scope creep.** If TJ points out a new problem ("oh and also the footer is weird") — note it, but don't fix it in the same pass unless it's a 1-line change. Multiple-issue passes muddle which fix solved which problem.
4. **Close the loop.** Once the original problems are resolved on the real Vercel preview, say "this looks done — anything else?" and stop. Don't keep polishing.

---

## Anti-patterns

- **Don't redesign.** This is surgical mobile refinement, not a from-scratch rebuild. Three lenses fixed > all six attempted shallowly.
- **Don't break desktop to fix mobile.** Use Tailwind responsive prefixes; default to mobile-first.
- **Don't add features.** Mobile optimization is not the place for new sections, new CTAs, new data.
- **Don't trust devtools mobile emulation.** Chrome's iPhone emulator lies about: safe-area-insets, real keyboard behavior, real touch latency, real `100vh` quirks. Vercel + a real phone is the only source of truth.
- **Don't fix what TJ didn't flag.** If the screenshot shows the FAQ, don't critique the footer.
- **Don't skip the inspirations folder.** Ten seconds of `ls` and a glance at a Wispr Flow screen recalibrates your taste before every critique. Skipping it leads to generic recommendations.
- **Don't write code in Phase 3.** The critique is the deliverable for Phase 3. Code comes after Phase 5 confirmation.
- **Don't claim "tested" without Vercel screenshots.** If TJ hasn't shared screenshots back, you haven't verified — you've implemented. Be honest about that distinction. ([[feedback_tj_writing_style]] — terse + direct + honest beats hedged.)
- **Don't ship a third speculative CSS one-liner.** If your first fix was `flex-1 min-w-0` and the screenshot still shows the bug, and your second fix tweaked `text-wrap` / `inline-block` / sizing and the screenshot *still* shows the bug — **stop tweaking and restructure**. Reasoning about flexbox + intrinsic sizing + `text-wrap: balance`/`pretty` interactions from source alone is unreliable; the model says "it should work" while reality says it doesn't. Remove the failure mode entirely (e.g., extract action buttons out of the title's flex row so the H1 is a block-level child with no flex sibling). Restructure > nth-tweak.

---

## Quick reference — common mobile punches

| Symptom | Punch | Lens |
|---|---|---|
| Primary CTA mid-page | Move to sticky bottom with safe-area padding | Thumb |
| `h-screen` hero crops on iOS | Swap to `min-h-[100dvh]` | Viewport |
| Modal feels like a desktop dialog | Convert to bottom sheet with drag handle | Native |
| Body text < 16px | `text-base` floor everywhere | Type |
| Inputs trigger iOS zoom | `text-base` (16px) on `<input>` | Viewport |
| Stacked vertical card wall | Horizontal `snap-x` shelf with 1.2 cards peeking | Native |
| Hover-only dropdown | Tap-to-toggle, `:active` press feedback | Native |
| No tap feedback | `active:scale-[0.98] transition` on every button | Motion |
| Cramped sections | `py-12` between zones, `space-y-6` within | Type |
| Letterboxed hero image | Full-bleed `w-screen -mx-[gutter]` | Native |
| Long FAQ wall | Collapse to top 5 + "See all" link | Density |
| Animated `width` / `height` | Migrate to `transform` + `opacity` | Motion |
| Mobile downloads desktop image | `<Image sizes>` with viewport-aware sources | Performance |
| Layout shift on async content | Skeleton placeholders reserving space | Performance |
| Long H1 ladders one-word-per-line on mobile | Title sharing flex row with action buttons — restructure: actions to utility bar above, title wrapper `sm:flex` only | Native |
| `flex-1` "should" expand but doesn't | Don't keep tweaking — restructure so the element has no flex sibling at that breakpoint (`block` on mobile, `sm:flex`) | Native |
