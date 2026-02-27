# Plan: Provider Home Page (Marketing Landing Page)

Created: 2026-02-27
Status: Not Started
Branch: `shiny-maxwell`
Notion Task: P2 — "Provider home page development"

## Goal

Build a polished marketing landing page at `/for-providers` that converts senior care providers into signing up on Olera. Replaces the current basic page with a 9-section design matching the Figma mockup (web + mobile + hamburger variants).

## Success Criteria

- [ ] All 9 sections from mockup implemented (Hero, Easy to Connect, Stats, Set Up Profile, Benefits, Leadership, FAQ, Bottom CTA, Footer)
- [ ] Responsive design matching web, mobile, and hamburger menu mockup variants
- [ ] Design language matches provider detail page and city page (font-serif headings, teal palette, vanilla accents, Untitled UI spacing)
- [ ] Interactive elements work: tab switcher (Profile/Reviews/Inbox/Leads), FAQ accordion, search inputs
- [ ] CTA buttons open auth modal with `intent="provider"`
- [ ] `next build` passes with no errors
- [ ] Lighthouse performance score > 85 (lazy load images, no layout shift)
- [ ] SEO metadata and OG tags present

## Architecture Decision

**Single file vs component-per-section?**
→ **Component-per-section.** The page has 9 distinct sections with independent interactivity (tabs, accordion, form). Breaking into components keeps each under ~100 lines and enables parallel work.

**File structure:**
```
app/for-providers/
  page.tsx                          # Server component (metadata + layout shell)

components/for-providers/
  HeroSection.tsx                   # Hero with search input + image
  EasyToConnectSection.tsx          # Tab pills + device mockup carousel
  StatsSection.tsx                  # Teal banner with metrics + partner logos
  SetUpProfileSection.tsx           # Inline form + screenshot
  BenefitsSection.tsx               # Video thumbnail + 4 benefit cards
  LeadershipSection.tsx             # 2 team member cards
  FAQSection.tsx                    # Accordion with 5 items
  BottomCTASection.tsx              # Final CTA with search bar
```

**Client vs Server:**
- `page.tsx` = Server component (SEO metadata, static shell)
- Each section = `"use client"` only if it needs interactivity (tabs, accordion, form)
- Static sections (Stats, Leadership) stay as server components

## Image Assets Needed

| Asset | Source | Path |
|-------|--------|------|
| Hero photo (caregiver + elderly woman) | From mockup / stock | `public/images/for-providers/hero.jpg` |
| Stats section photo (elderly couple) | From mockup / stock | `public/images/for-providers/stats-couple.jpg` |
| Benefits video thumbnail (elderly man) | From mockup / stock | `public/images/for-providers/benefits-video.jpg` |
| Device mockups (laptop + phone) — 4 variants | Screenshot staging site | `public/images/for-providers/mockup-profile.png` etc. |
| TJ headshot | Team photo | `public/images/team/tj-falohun.jpg` |
| Logan headshot | Team photo | `public/images/team/logan-dubose.jpg` |
| Partner logos (NIH, Caring, Yelp, Google) | Existing assets or SVG | Inline SVGs or `public/images/partners/` |
| NIH badge | Existing asset | `public/images/partners/nih-badge.svg` |

> **NOTE:** Phase 1 will use placeholder images (gray boxes with alt text). Real images are added in Phase 4 (Asset Integration).

## Tasks

### Phase 1: Page Scaffold + Static Sections (Foundation)

- [ ] **1. Create page shell and component files**
  - Files: `app/for-providers/page.tsx`, `components/for-providers/` (all 8 files)
  - What: Set up the server component with metadata, import all section components, establish the page layout with proper spacing between sections
  - Verify: `next build` passes, `/for-providers` renders section placeholders

- [ ] **2. Build HeroSection**
  - Files: `components/for-providers/HeroSection.tsx`
  - What: Split layout — left side has "Reach more families" (serif heading), subtitle, search input ("Business name or zip code") + teal "Get started" button. Right side has hero photo with teal gradient overlay at top-right corner. NIH badge bottom-right. Mobile: stacked centered layout per mockup.
  - Depends on: 1
  - Verify: Responsive layout matches mockup at desktop (1440px), tablet, and mobile breakpoints

- [ ] **3. Build StatsSection**
  - Files: `components/for-providers/StatsSection.tsx`
  - What: Full-width teal (`bg-primary-700`) background. Left: "Over 40,000 providers on Olera" heading + "Join thousands..." subtext + partner logo row. Right: elderly couple photo. Responsive: stack on mobile.
  - Depends on: 1
  - Verify: Teal banner renders, partner logos display

- [ ] **4. Build LeadershipSection**
  - Files: `components/for-providers/LeadershipSection.tsx`
  - What: "Our Leadership" heading, 2-column grid with cards. Each card: photo (left), role label, name, bio text, LinkedIn icon. Mobile: stacked vertically with full-width cards.
  - Content:
    - TJ Falohun, MS — CEO — "Before Olera, TJ worked at Pfizer as a biomedical engineer, designing auto-injectors."
    - Logan DuBose, MD, MBA — COO — "Logan combines his clinical and business expertise to transform senior care, driving Olera.care's mission to deliver compassionate, comprehensive solutions."
  - Depends on: 1
  - Verify: Cards render with correct content and LinkedIn links

- [ ] **5. Build BottomCTASection**
  - Files: `components/for-providers/BottomCTASection.tsx`
  - What: Dark/teal rounded container, "Ready to get started?" heading (white, serif), search input + teal "Get started" button (same pattern as hero). Centered layout.
  - Depends on: 1
  - Verify: CTA section renders, button triggers auth modal

### Phase 2: Interactive Sections

- [ ] **6. Build FAQSection (accordion)**
  - Files: `components/for-providers/FAQSection.tsx`
  - What: "FAQ" heading, expandable accordion items with +/- toggle. First item expanded by default. Smooth open/close animation (CSS `max-height` transition or `grid-template-rows` trick). Separator lines between items.
  - FAQ items:
    1. "Why We Created Olera?" — "We built Olera after seeing how most senior care directories fail both families and providers. Existing senior care websites focus on selling family contact information to the highest bidder. They're limited to a few types of care, packed with confusing ads, and driven more by lead volume than genuine connection."
    2. "What senior care businesses should join the Olera network?"
    3. "What are the benefits for my organization?"
    4. "Are there any costs to joining?"
    5. "How many new clients should I expect?"
  - Depends on: 1
  - Verify: Click toggles open/close, only one open at a time, smooth animation

- [ ] **7. Build SetUpProfileSection (form)**
  - Files: `components/for-providers/SetUpProfileSection.tsx`
  - What: "Set up your profile" heading. Left side: "Add your business detail" sub-heading, Business name input, Zip code input, "Get started" teal button. Right side: screenshot of provider profile page. Form submission triggers auth modal with `intent="provider"`. Mobile: form stacks above screenshot.
  - Depends on: 1
  - Verify: Form renders, inputs work, button triggers auth flow

- [ ] **8. Build EasyToConnectSection (tab carousel)**
  - Files: `components/for-providers/EasyToConnectSection.tsx`
  - What: "It's easy to connect with families on Olera" heading. 4 pill-style tabs (Profile = teal active, Reviews, Inbox, Leads — gray inactive). Below tabs: device mockup area showing laptop + phone screenshots. Caption text changes per tab. Carousel pagination (1/4) with prev/next arrow buttons. Tab click and arrows both switch content.
  - Tab content:
    - Profile: "Set up your profile" / "Fill in key business information to show up in local searches."
    - Reviews: "Manage your reviews" / "Respond to reviews and build your reputation."
    - Inbox: "Your inbox" / "Receive and respond to inquiries from families."
    - Leads: "Track your leads" / "See who's interested and follow up."
  - Depends on: 1
  - Verify: Tab switching works, carousel arrows work, captions update, active tab highlights

- [ ] **9. Build BenefitsSection**
  - Files: `components/for-providers/BenefitsSection.tsx`
  - What: "Benefits of your profile" heading on teal background strip. Large video thumbnail image with centered play button overlay ("Watch a Video" label). Below: 4-column grid of benefit cards, each with teal icon, bold title, subtitle. Mobile: 2x2 grid or single column.
  - Benefits:
    1. Higher SEO Ranking — "Profile optimised for google" (rocket/chart icon)
    2. More Online Reviews — "Create trust in your brand" (star icon)
    3. Easier conversions — "Quickly qualify & book leads" (lightning icon)
    4. Unlimited Leads — "No lead fees or commissions" (megaphone icon)
  - Depends on: 1
  - Verify: Video placeholder renders, benefit cards display in grid

### Phase 3: Polish & Responsiveness

- [ ] **10. Responsive pass — mobile + tablet**
  - Files: All `components/for-providers/*.tsx`
  - What: Test all sections against mockup's mobile and hamburger variants. Fix breakpoints, spacing, font sizes, image scaling. Ensure hero search stacks correctly, tabs scroll horizontally on mobile, leadership cards stack vertically.
  - Depends on: 2-9
  - Verify: Matches mobile mockup at 375px and 768px breakpoints

- [ ] **11. Scroll animations + polish**
  - Files: Section components as needed
  - What: Add `useInView` fade-in animations for sections on scroll (subtle, 200ms). Add hover effects on benefit cards and leadership cards. Ensure smooth tab transitions in EasyToConnectSection. Match focus states on inputs for accessibility.
  - Depends on: 10
  - Verify: Smooth scroll reveals, hover states, no janky animations

- [ ] **12. SEO metadata + OG tags**
  - Files: `app/for-providers/page.tsx`
  - What: Update `generateMetadata()` with optimized title ("For Providers | Reach More Families on Olera"), description, OG image, canonical URL. Add Organization JSON-LD if not already inherited from layout.
  - Depends on: 1
  - Verify: `next build` passes, inspect page source for meta tags

### Phase 4: Asset Integration

- [ ] **13. Add real images**
  - Files: `public/images/for-providers/`, `public/images/team/`, section components
  - What: Replace placeholder gray boxes with real hero photo, team headshots, device mockups, stats couple photo, video thumbnail, partner logos. Optimize all images (WebP, appropriate dimensions). Use `next/image` with proper `width`/`height`/`priority` attributes.
  - Depends on: 10 (need responsive layouts finalized first)
  - Verify: All images load, no CLS, LCP image has `priority`

- [ ] **14. FAQ content completion**
  - Files: `components/for-providers/FAQSection.tsx`
  - What: Fill in answer text for FAQ items 2-5 (only item 1 has answer from mockup). TJ to provide or approve content.
  - Depends on: 6
  - Verify: All 5 FAQ items have answers

### Phase 5: Verification

- [ ] **15. Final QA + build check**
  - Files: n/a
  - What: `next build` clean, test on Chrome/Safari/Firefox, test mobile with devtools, verify auth flow from both search inputs, verify all links work (LinkedIn, nav). Check Lighthouse for performance/accessibility scores.
  - Depends on: all above
  - Verify: Build passes, no console errors, Lighthouse > 85 performance, all interactions work

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Image assets not ready | Page looks unfinished | Phase 1-3 use gray placeholders; assets are a separate phase |
| Device mockup screenshots hard to capture cleanly | Tab carousel section looks off | Can use static screenshots from staging; iterate later |
| Video embed source unknown | Benefits section incomplete | Use thumbnail + play icon overlay as placeholder; link to YouTube later |
| FAQ answer content not written | FAQ section incomplete | Ship with item 1 answered; add rest in Phase 4 |
| Existing `/for-providers` page has no client interactivity | Need to convert to client component | Split: server shell for metadata + client sections for interactivity |

## Notes

- The existing `ProviderGetStartedButton` component already handles auth with `intent="provider"` — reuse it in CTA sections
- The hero search input in the mockup shows "Business name or zip code" — this should trigger the auth modal (not actually search), matching the current behavior
- The mockup shows a specific footer design with partner logos (NIH, A&M, Blackstone) — use the existing site Footer component for now; a custom footer is out of scope
- `useAnimatedCounters` and `useInView` are currently defined inline in `app/page.tsx` — extract to `lib/hooks/` if reusing for stats section counter
- The mockup shows 3 responsive variants: Desktop (1440px), Mobile, Hamburger menu — all need testing
