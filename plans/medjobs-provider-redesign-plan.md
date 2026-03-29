# Plan: MedJobs Provider Experience Redesign

Created: 2026-03-28
Status: Not Started

## Goal

Transform the MedJobs provider experience from a stats dashboard into a curated talent showcase — with a compelling empty state that shows real students and drives early access signups for cities we haven't reached yet.

## Success Criteria

- [ ] Q&A card hidden from provider toolbar — 3 cards remain (Find families, Reviews, Hire staff)
- [ ] "Hire staff" links directly to candidates page (skip stats hub)
- [ ] Provider candidates page uses photo cards matching public page design
- [ ] City-aware: shows "Students near [City]" when local students exist
- [ ] Empty state: shows real global students as showcase + "MedJobs is coming to [City]" header + early access CTA
- [ ] Warm background, dark buttons, font-display headings — consistent with onboard page
- [ ] Provider-only contact info (email/phone) visible on cards

## Tasks

### Phase 1: Toolbar Cleanup

- [ ] 1. Hide Q&A card + update Hire staff link
      - File: `components/provider-onboarding/PlatformShowcase.tsx`
      - Changes:
        - Remove the "Answer questions" ValueCard
        - Change "Hire staff" href from `/provider/medjobs` to `/provider/medjobs/candidates`
        - Adjust animation delays for 3-card layout
      - Verify: Provider toolbar shows 3 cards, "Hire staff" goes directly to candidates

### Phase 2: Candidates Page Redesign

- [ ] 2. Add city filter support to candidates API
      - File: `app/api/medjobs/candidates/route.ts`
      - Changes:
        - API already supports `city` param (line 54-55, ilike filter) — no API change needed
        - Also add `image_url` to the provider SELECT (currently missing — public page queries it directly from Supabase, provider page uses the API)
      - Verify: `GET /api/medjobs/candidates?city=Austin` returns only Austin students; response includes `image_url`

- [ ] 3. Redesign provider candidates page with photo cards
      - File: `app/provider/medjobs/candidates/page.tsx` (full rewrite)
      - Design ported from: `app/medjobs/candidates/page.tsx`
      - Changes:
        - Warm bg: `bg-[#faf9f7]` or `bg-stone-50`
        - City-aware header: fetch provider's city from `useAuth().activeProfile.city`
        - First load: fetch with provider's city filter
        - Photo cards: `aspect-square` with image or gradient fallback (port GRADIENTS array + getGradient helper)
        - Structured info rows (School, Location, Avail., Commit, Certs) matching public page
        - Provider-only: show email/phone below card content (already returned by API for providers)
        - Dark CTA: `bg-gray-900 text-white hover:bg-gray-800` for "View Profile" button
        - Borderless filter row: remove white container box, inputs float with `border-0 bg-white shadow-sm rounded-xl`
        - `font-display` for page title, `text-gray-400` for subtitle
        - Card enter animation stagger
      - Verify: Cards show photos/gradients, provider sees contact info, warm bg, dark buttons

- [ ] 4. Build aspirational empty state
      - File: `app/provider/medjobs/candidates/page.tsx` (within the same rewrite)
      - Behavior: When city filter returns 0 results, show:
        - **Header section**: "MedJobs is coming to [City]" + warm subtitle like "We're building a network of pre-screened healthcare students. Request early access to connect with talent in your area."
        - **Early access CTA**: email input (pre-filled with provider email if available) + "Notify me" button → POST to a simple endpoint or Supabase insert
        - **Divider**: "Meet some of our students" or "See who's already on the platform"
        - **Real student grid**: fetch global students (no city filter) and render the same photo card grid — real faces, real profiles, fully tappable (link to `/provider/medjobs/candidates/[slug]`)
        - Design: centered header area, max-w-lg for text, then full-width card grid below
      - Verify: Provider from unlaunched city sees aspirational header + real student cards below

- [ ] 5. Early access endpoint
      - File: new `app/api/medjobs/early-access/route.ts`
      - Changes:
        - POST handler: accepts `{ email, city, state, profileId? }`
        - Inserts into a `medjobs_early_access` table (or a lightweight approach: insert into `connections` with type='medjobs_waitlist', or just send a Slack notification with the details)
        - Slack alert to #medjobs channel with provider name, city, email
        - Returns 200
      - Verify: Submitting early access form sends Slack notification

### Phase 3: Cleanup

- [ ] 6. Simplify/redirect the stats hub page
      - File: `app/provider/medjobs/page.tsx`
      - Changes: Replace with a redirect to `/provider/medjobs/candidates` (keep the file but make it a simple `redirect()` call so any deep links don't break)
      - Verify: `/provider/medjobs` redirects to candidates page

## Risks

- **No `image_url` in API response**: The candidates API doesn't currently select `image_url` for provider requests. Need to add it to the select string in task 2. Low risk — one-line change.
- **Provider city might be null**: Some providers may not have a city set. Fallback: skip city filter, show all students (same as current behavior). Empty state triggers only when city IS set but has zero results.
- **Early access storage**: Simplest approach is a Slack notification (no new table needed). Can graduate to a table later if volume warrants it.

## Architecture Notes

- `useAuth().activeProfile` gives us `city`, `state`, `email` — all needed for the city-aware experience
- The candidates API already supports `city` param — just not used by the provider page currently
- Photo cards + gradient fallback are proven patterns from the public page — direct port, not new invention
- The public page queries Supabase directly (client-side); the provider page uses the API (for auth gating). We keep this separation — just add `image_url` to the API response.

## Design Tokens (for consistency)

| Token | Value |
|-------|-------|
| Background | `bg-[#faf9f7]` |
| Card | `bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md` |
| Primary CTA | `bg-gray-900 text-white hover:bg-gray-800 rounded-xl` |
| Secondary CTA | `bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl` |
| Heading | `font-display font-bold text-gray-900` |
| Subtitle | `text-gray-400` |
| Card enter | `animation: card-enter 0.3s ease-out both` with staggered delays |
| Photo gradient fallback | primary/teal/emerald/cyan gradients (from public page) |
