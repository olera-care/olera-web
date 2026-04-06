# Plan: Aging in America — Migration from Framer to Olera Web

Created: 2026-04-06
Status: Not Started

## Goal

Migrate the Aging in America documentary series from a static Framer site (aginginamerica.co) into olera.care/aging-in-america — a dark, cinematic landing page with episode detail pages, season organization, and a clear funnel back to Olera.

## Design References

1. **bfnadocs.org** (Bertelsmann Foundation Documentaries) — Primary template. Dark mode, cinematic hero with gradient overlay, episode grid with metadata pills (duration, year, topic tags), clean detail pages with tabs.
2. **thewhy.dk** (The Why / BBC World) — Season accordion pattern. Collapsed seasons with expand/collapse, latest season open by default.
3. **water.org/our-impact/all-stories** — Human-first storytelling. Portrait photos, paragraph explainers, pull quotes alongside thumbnails. Not just a video catalog.
4. **aginginamerica.co** (current Framer site) — Copy to preserve. Hero typography, "Every family has their version of this story", "If we're lucky, we will all grow old" about section.

## Success Criteria

- [ ] `olera.care/aging-in-america` renders a cinematic dark-mode landing page
- [ ] `olera.care/aging-in-america/[slug]` renders individual episode detail pages
- [ ] `aginginamerica.co` 301 redirects to `olera.care/aging-in-america` (DNS config — separate from code)
- [ ] All Season 1 (3 episodes) and Season 2 (trailer + 4 episodes) content is present
- [ ] Each episode has: thumbnail, title, subject name, human summary, pull quote, duration, topic tags
- [ ] YouTube videos load via poster image → lazy iframe (not eager iframes killing LCP)
- [ ] Page passes Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] VideoObject + CreativeWorkSeries JSON-LD structured data on both index and detail pages
- [ ] Mobile-responsive (single column, touch-friendly)
- [ ] Funnel CTA present: email capture or "Find Care" link back to olera.care

## Architecture

### URL Structure
```
olera.care/aging-in-america              → Index (hero + about + seasons + episodes)
olera.care/aging-in-america/[slug]       → Episode detail (hero + video + story + related)
```

### Data Strategy
Static data file (`lib/aging-in-america-data.ts`) — not a DB table. This is editorial content with ~10 episodes that changes rarely. A static typed array is simpler, faster, and easier to maintain than a Supabase table or API endpoint. Can always move to CMS later if the library grows past ~30 episodes.

```typescript
type Episode = {
  slug: string
  title: string
  subject: string           // "Carol Dean"
  summary: string           // 2-3 sentence human story
  pullQuote: string         // "When your parent no longer recognizes you..."
  youtubeId: string
  thumbnailUrl: string      // poster image (not YouTube default — custom)
  season: 1 | 2
  episodeNumber: number
  durationMinutes: number
  year: number
  topics: string[]          // ["Dementia", "Family Caregiving"]
  releaseDate: string       // ISO date
  status: "published" | "coming-soon"
}
```

### Dark Mode Approach
Scoped to the AIA pages only — not a site-wide dark mode toggle. Use a wrapper div with dark background classes. The Olera navbar/footer stay as-is (light) — the dark content area sits between them, creating a "theater mode" effect like bfnadocs.

Alternative: Custom layout with dark navbar variant. Decision in Phase 1.

## Tasks

### Phase 1: Foundation (data + routing + layout)

- [ ] 1. Create episode data file
      - Files: `lib/aging-in-america-data.ts`
      - Details: Define Episode type + static array with all S1 (3 eps) and S2 (trailer + 4 eps) content. Pull titles, descriptions, YouTube IDs from Notion. Mark Ep 3-4 as "coming-soon".
      - Verify: Import and log data, confirm all fields populated

- [ ] 2. Create index page route + dark layout shell
      - Files: `app/aging-in-america/page.tsx`, `app/aging-in-america/layout.tsx`
      - Details: Layout sets dark bg (`bg-gray-950` or `bg-[#0a0a0a]`), metadata (title, OG, description). Page imports data and renders placeholder sections. Decide navbar treatment (light on dark vs dark variant).
      - Verify: Navigate to `/aging-in-america`, see dark page with Olera nav

- [ ] 3. Create episode detail page route
      - Files: `app/aging-in-america/[slug]/page.tsx`
      - Details: Dynamic route, `generateStaticParams` from episode data, `generateMetadata` for SEO. Placeholder layout.
      - Verify: Navigate to `/aging-in-america/carol-dean`, see detail page shell

### Phase 2: Index Page Sections

- [ ] 4. Build Hero section
      - Files: `components/aging-in-america/HeroSection.tsx`
      - Details: Full-viewport dark hero. Large serif "AGING IN AMERICA" title (font-display). Tagline: "Every family has their version of this story." Right-side copy block. "Watch Latest Episode" CTA button. Background: cinematic still from the series with gradient overlay. Reference: bfnadocs hero + existing Framer hero layout.
      - Verify: Hero renders full-width, text readable over image, CTA links to latest episode

- [ ] 5. Build About section
      - Files: `components/aging-in-america/AboutSection.tsx`
      - Details: Two-column layout on dark bg. Left: large serif "If we're lucky, we will all grow old". Right: body copy explaining the series + Olera connection. Subtle divider or section label ("\ ABOUT"). Reference: Framer about section copy.
      - Verify: Section renders with correct copy, readable on dark bg

- [ ] 6. Build Season Accordion + Episode Cards
      - Files: `components/aging-in-america/SeasonAccordion.tsx`, `components/aging-in-america/EpisodeCard.tsx`
      - Details: 
        - SeasonAccordion: Expand/collapse per season (reuse FAQSection grid-rows pattern). Latest season expanded by default. Large serif "Season 2" / "Season 1" headers. Reference: thewhy.dk.
        - EpisodeCard: Thumbnail (poster image, not YouTube default) + title + subject name + 2-line summary + pull quote (italic) + metadata pills (duration, year, topics). "coming-soon" badge for unreleased. Reference: bfnadocs card metadata + water.org human text. 3-column grid desktop, 1-column mobile.
      - Verify: Seasons expand/collapse, episode cards show all metadata, coming-soon episodes visually distinct

- [ ] 7. Build CTA / Funnel section
      - Files: `components/aging-in-america/CtaSection.tsx`
      - Details: Bottom section before footer. Two paths: (a) "Share Your Story" — link to contact/story submission, (b) "Find Care for Your Family" — link to olera.care homepage or benefits finder. Optional: email capture for series updates. Dark bg with subtle gradient or border treatment.
      - Verify: CTAs render, links work

- [ ] 8. Compose index page from sections
      - Files: `app/aging-in-america/page.tsx`
      - Details: Import and compose: Hero → About → SeasonAccordion (with EpisodeCards) → CTA. Add JSON-LD structured data (CreativeWorkSeries + VideoObject per published episode).
      - Verify: Full page scroll works, all sections present, structured data validates in Google Rich Results Test

### Phase 3: Episode Detail Page

- [ ] 9. Build episode detail page
      - Files: `app/aging-in-america/[slug]/page.tsx`, `components/aging-in-america/YouTubePlayer.tsx`
      - Details:
        - YouTubePlayer: Poster image with play button overlay → lazy loads iframe on click (not eager embed). Responsive aspect-video.
        - Detail layout (reference: bfnadocs detail page): Hero area with episode thumbnail/still as background, back button, title, subject, metadata pills (duration, year, topics). Below: YouTube player + story text (full summary + pull quote). Related episodes grid (other episodes from same season, or all episodes).
        - JSON-LD: VideoObject structured data per episode.
      - Verify: Episode pages render with video player, poster → iframe works, back button navigates to index, related episodes link correctly

### Phase 4: Polish + SEO

- [ ] 10. Responsive pass + Core Web Vitals
       - Files: All AIA components
       - Details: Test on mobile viewport (375px), tablet (768px), desktop (1280px). Ensure single-column mobile layout, touch-friendly cards, no horizontal overflow. Check LCP (poster images should be optimized), CLS (no layout shift from lazy iframe).
       - Verify: Lighthouse mobile score > 90, no layout shifts

- [ ] 11. Update CommunitySection homepage reference
       - Files: `components/home/CommunitySection.tsx`
       - Details: Update the existing "Aging in America" embed on the homepage to link to `/aging-in-america` instead of (or in addition to) the YouTube channel. This becomes a cross-promotion rather than the primary home for AIA content.
       - Verify: Homepage community section links to /aging-in-america

- [ ] 12. Sitemap + meta tags
       - Files: Sitemap config, `app/aging-in-america/layout.tsx`
       - Details: Add `/aging-in-america` and all episode slugs to sitemap. Ensure OG images are set (use episode thumbnails for detail pages, series hero for index). Twitter card meta.
       - Verify: `/sitemap.xml` includes AIA URLs, social preview renders correctly

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Dark mode clashes with Olera navbar/footer | Scope dark bg to content area only; navbar stays light. Or build a dark navbar variant — decide in Task 2 |
| YouTube poster images need custom thumbnails | Use YouTube's `maxresdefault.jpg` as fallback (`img.youtube.com/vi/{id}/maxresdefault.jpg`), replace with custom assets later |
| Episode data gets stale as new eps release | Static data file is easy to update — just add entries. If it grows past 30+, migrate to Supabase/CMS |
| SEO: New URL needs to build authority | 301 redirect from aginginamerica.co transfers existing authority. Internal links from homepage CommunitySection + research-and-press articles help |
| "Coming soon" episodes with no video | Show thumbnail + "Coming [date]" badge, disable play button, link to YouTube channel for notifications |

## Notes

- **Copy is written** — hero tagline, about section, and series description all come from the existing Framer site. No copywriting needed.
- **Episode content lives in Notion** — titles, descriptions, YouTube IDs, metadata, scheduled dates. Pull from there when populating the data file.
- **DNS redirect** (aginginamerica.co → olera.care/aging-in-america) is a separate infrastructure task — needs domain registrar or Vercel config, not code.
- **Season 2 Ep 2 releases Apr 7** (tomorrow) — good timing to have the page ready.
- **Dark mode is scoped** — this is NOT a site-wide dark mode feature. It's a "theater mode" for the documentary section only.
