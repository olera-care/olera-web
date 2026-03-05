# Plan: Leadership Team Page

Created: 2026-03-03
Status: Not Started
Branch: `joyful-goodall`
Notion: P1 — "Leadership Team Section"

## Goal

Create a standalone `/team` page for Olera 2.0 that showcases the leadership team (TJ Falohun, CEO & Logan DuBose, COO) with a modern, editorial design that matches the quality of the best existing pages. Polish pass with tasteful animations and micro-interactions.

## Design Thesis

The leadership page should feel like a mission statement brought to life — not a corporate "meet the team" template. Calm confidence, generous whitespace, large portrait photography, serif typography for editorial gravitas, and restrained motion. Inspired by Perena, Notion's about page, and Airbnb's leadership section.

## Success Criteria

- [ ] `/team` page renders with zero layout shift, fully responsive (mobile → desktop)
- [ ] Hero section with mission-driven headline (not "Meet Our Team")
- [ ] Large, editorial-quality team member cards with expanded bios
- [ ] Tasteful scroll-triggered animations (fade-in, not flashy)
- [ ] LinkedIn links for each team member
- [ ] Footer "Company" section includes "Our Team" link
- [ ] Sitemap includes `/team`
- [ ] SEO metadata (title, description, OpenGraph)
- [ ] Page passes visual "taste test" — feels like someone cared
- [ ] `next build` succeeds with no errors

## Content

### Team Members

**TJ Falohun, MS** — Co-Founder & CEO
- Image: `/images/for-providers/team/tj.jpg` (exists)
- LinkedIn: https://www.linkedin.com/in/tj-falohun/
- Bio: Expanded version (pull from Sanity CMS or write fresh — the current one-liner is too short for a dedicated page)

**Logan DuBose, MD, MBA** — Co-Founder & COO
- Image: `/images/for-providers/team/logan.jpg` (exists)
- LinkedIn: https://www.linkedin.com/in/logan-dubose/
- Bio: Expanded version

### Page Sections

1. **Hero** — Mission-driven headline + subtitle. Clean, white bg, serif display text. No image in hero (let the portraits do the work below).
2. **Team Grid** — Two large portrait cards. Vertical layout: large image (portrait aspect ~3:4), name, title, expanded bio, LinkedIn. Cards side by side on desktop, stacked on mobile.
3. **Mission/Values** (optional, lightweight) — A brief statement about what drives Olera, positioned below the team. Could be a single quote or 2-3 value pillars. Keep it minimal — this isn't an "about" page essay.

## Tasks

### Phase 1: Page Foundation

- [ ] 1. Create `/team` route and page component
      - Files: `app/team/page.tsx` (new)
      - Create server component with metadata export (title, description, OG tags)
      - Compose page from section components: `<HeroSection />` + `<TeamSection />`
      - Verify: Page renders at `localhost:3000/team`, metadata visible in page source

- [ ] 2. Build HeroSection component
      - Files: `components/team/HeroSection.tsx` (new)
      - White background, centered layout
      - Serif display heading: something mission-driven like "The people behind Olera" or "Built by caregivers, for caregivers"
      - Subtle subtitle in gray-600 sans-serif
      - Generous top/bottom padding (`py-20 md:py-28`)
      - Container: `max-w-4xl mx-auto text-center`
      - Verify: Hero renders cleanly, text hierarchy reads well

- [ ] 3. Build TeamSection component with team member cards
      - Files: `components/team/TeamSection.tsx` (new)
      - Data: Hardcoded array of team members (name, role, credentials, bio, image, linkedin)
      - Layout: `grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14`
      - Each card:
        - Large portrait image (Next.js `Image`, `aspect-[3/4]`, `rounded-2xl`, `object-cover`)
        - Name: serif display, `text-display-sm font-bold text-gray-900`
        - Role: `text-text-sm font-medium text-primary-600 uppercase tracking-wide`
        - Bio: `text-text-md text-gray-600 leading-relaxed` (3-5 sentences)
        - LinkedIn icon link: `text-gray-400 hover:text-primary-600 transition-colors`
      - Container: `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8`
      - Section padding: `pb-20 md:pb-28`
      - Verify: Cards render, images load, layout is responsive, LinkedIn links work

### Phase 2: Polish & Delight

- [ ] 4. Add scroll-triggered fade-in animations
      - Files: `components/team/TeamSection.tsx`, `components/team/HeroSection.tsx`
      - Use existing `useInView` hook from `hooks/use-in-view.ts`
      - Hero: fade-in + slight upward translate on mount
      - Team cards: staggered fade-in (left card first, right card 150ms later)
      - Keep motion restrained — `duration-700`, `ease-out`, `translate-y-4` max
      - Mark components `"use client"` where needed for animation hooks
      - Verify: Scroll down to section, animations trigger smoothly, no jank

- [ ] 5. Add hover interactions to team cards
      - Files: `components/team/TeamSection.tsx`
      - Image: subtle scale on hover (`group-hover:scale-[1.02]`, `transition-transform duration-500`)
      - Card: slight shadow lift (`hover:shadow-lg transition-shadow`)
      - LinkedIn icon: scale + color change on hover
      - Ensure overflow-hidden on image container to prevent scale bleed
      - Verify: Hover over cards, effects are smooth and tasteful

- [ ] 6. Write expanded bios for both team members
      - Files: `components/team/TeamSection.tsx`
      - TJ: Expand from the one-liner. Mention biomedical engineering at Pfizer, the personal motivation for Olera, the mission to transform senior care discovery.
      - Logan: Expand from current bio. Mention clinical + business background (MD, MBA), what drives the operational vision.
      - Keep tone warm but professional — not corporate, not casual. 3-4 sentences each.
      - Verify: Bios read naturally, no typos, balanced length between both

### Phase 3: Integration & SEO

- [ ] 7. Add "Our Team" link to footer Company section
      - Files: `components/shared/Footer.tsx`
      - Add `<li>` with `<Link href="/team">` to Company section, after "Research & Press"
      - Label: "Our Team"
      - Verify: Footer link appears, navigates to `/team`

- [ ] 8. Add `/team` to sitemap
      - Files: `app/sitemap.ts`
      - Add static entry: `{ url: '/team', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 }`
      - Verify: Visit `/sitemap.xml`, `/team` entry present

- [ ] 9. Update LeadershipSection on /for-providers to link to full page
      - Files: `components/for-providers/LeadershipSection.tsx`
      - Add a subtle "Learn more about our team →" link below the card grid
      - Link to `/team`
      - Keep the existing compact cards as-is (they serve a different purpose on the provider landing page)
      - Verify: Link renders on `/for-providers`, navigates to `/team`

### Phase 4: Final Review

- [ ] 10. Visual QA and taste pass
       - Run `next build` to verify no errors
       - Check responsive breakpoints: mobile (375px), tablet (768px), desktop (1280px)
       - Verify image loading performance (no CLS)
       - Check dark/light contrast ratios (accessibility)
       - Compare against design inspirations — does it feel "calm confidence"?
       - Verify: Build passes, all breakpoints look good, page feels polished

## Risks

| Risk | Mitigation |
|------|------------|
| Team headshot images may be too low-res for large display | Check image dimensions; if under 600px wide, crop/position carefully with `object-cover` + `object-top` to hide artifacts |
| Bio content too short for a dedicated page | Write expanded 3-4 sentence bios; if TJ wants different copy, easy to swap (hardcoded data) |
| Page feels thin with only 2 team members | Lean into generous whitespace and large portraits — 2 people with presence > 6 people crammed in. The hero + mission framing adds substance |
| Existing LeadershipSection on /for-providers could diverge | Keep them intentionally different: compact on /for-providers, editorial on /team. Link between them |

## Architecture Notes

- **No Supabase needed** — 2 team members, hardcoded data is appropriate
- **Server component by default** — only add `"use client"` to animated sections
- **No new dependencies** — use existing `useInView` hook, Tailwind, Next.js Image
- **File structure**: `components/team/` directory (new), mirrors pattern of `components/home/`, `components/for-providers/`

## Design Reference

- **Typography**: Serif display (`font-serif`) for hero heading and member names; sans-serif for everything else
- **Colors**: White bg for hero, gray-50 or white for team section. Primary-600 for role labels and accent links.
- **Spacing**: Generous — `py-20 md:py-28` between sections, `gap-10 lg:gap-14` between cards
- **Images**: `aspect-[3:4]` portrait, `rounded-2xl`, large (fill available card width)
- **Motion**: Restrained — fade + translate-y only, no bouncing/scaling on enter

## Notes

- This is a net-new page — no existing `/team` or `/about` route
- The old Olera 1.0 had a leadership section in Sanity CMS that was "limited" per TJ
- Design north star from Notion task: "It should feel like someone cared. Not a dashboard template. Not a UI kit demo. Not AI-generated."
- Bios should be reviewed/approved by TJ before shipping to production
