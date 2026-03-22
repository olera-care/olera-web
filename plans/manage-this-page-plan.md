# Plan: "Manage this page" CTA + Fix Provider Email Links

Created: 2026-03-18
Status: Not Started
Notion task: "Add a very visible 'Manage this page' to the detailed provider page"

## Goal

Make it effortless for providers (especially angry ones) to find and manage their listing, and fix email campaign links so they land on the portal preview instead of the public page.

## Success Criteria

- [ ] Prominent "Manage this page" CTA visible near the hero on the provider detail page
- [ ] CTA links to `/provider/[slug]/onboard` (portal preview with claim/manage flow)
- [ ] Email "View your page" buttons link to `/provider/[slug]/onboard` for Q&A notifications
- [ ] "Request to hide or remove" is accessible as a secondary action (not buried)
- [ ] Signed-in owners clicking "Manage this page" go to their dashboard (not onboarding)
- [ ] Design feels restrained and intentional (Airbnb/Claude style), not template-y

## Architecture Insight

The smart portal preview already exists at `/provider/[slug]/onboard`:
- Shows blurred dashboard preview, profile completeness widget, onboarding wizard
- Handles: unclaimed (verify + claim), already-claimed (dispute), pre-verified (token from email)
- Accessible without auth
- `SmartDashboardShell` component stitches dashboard cards + ActionCard + OnboardingWizard

The problem is nothing links to it properly:
- Emails link to `/provider/{slug}` (public page)
- "Are you the owner?" is at the very bottom of the detail page
- ManageListingModal shows a modal instead of routing to onboard

## Tasks

### Phase 1: Hero "Manage this page" CTA (the Notion task)

- [ ] 1. Add "Manage this page" inline CTA near the hero section
      - Files: `app/provider/[slug]/page.tsx`
      - Design: Subtle but unmissable. Below the highlights grid (after line 751), a clean horizontal bar:
        - Left: small shield/building icon + "Is this your business?" text
        - Right: "Manage this page" link → `/provider/[slug]/onboard`
        - For **claimed** providers: link goes to `/provider` (dashboard) instead
        - Restrained: single line, no box/card, just text + link. Like Airbnb's "Report this listing" but positive.
        - Mobile: same pattern, full width
      - Verify: Visit any provider page → CTA visible without scrolling past the fold on desktop
      - Verify: Click links to `/provider/[slug]/onboard` for unclaimed, `/provider` for claimed

- [ ] 2. Remove or simplify the bottom "Are you the owner?" section
      - Files: `app/provider/[slug]/page.tsx`
      - Keep the Disclaimer text, but replace the ManagePageButton with a simple text link to `/provider/[slug]/onboard` (or remove entirely since hero CTA handles it)
      - Verify: Bottom section is cleaner, not duplicating the hero CTA

### Phase 2: Fix Email Campaign Links (the operational gap)

- [ ] 3. Fix Q&A email "View your page" URL to point to onboard
      - Files: `app/api/questions/route.ts` (lines 193, 325), `app/api/admin/questions/route.ts` (line 127)
      - Change: `providerUrl = ${siteUrl}/provider/${slug}` → `${siteUrl}/provider/${slug}/onboard`
      - Note: Need slug not provider_id in the URL — verify the variable used is the slug
      - Verify: Trigger a Q&A question → email "View your page" links to `/provider/[slug]/onboard`

- [ ] 4. Audit remaining email routes for provider-facing URLs
      - Files to check:
        - `app/api/reviews/route.ts:159` — `/provider/reviews` (auth-gated, OK for claimed providers)
        - `app/api/connections/request/route.ts:433,1001` — `/provider/connections` (auth-gated)
        - `app/api/connections/manage/route.ts:169` — `/provider/connections` (auth-gated)
        - `app/api/connections/respond-interest/route.ts:194` — `/provider/connections` (auth-gated)
        - `app/api/admin/leads/add-email/route.ts:107` — `/provider/connections` (auth-gated)
        - `app/api/admin/directory/[providerId]/route.ts:262` — `/provider/connections` (auth-gated)
      - Decision: Connection/review emails go to auth-gated hub pages. These work for claimed providers but will show sign-in wall for unclaimed ones getting cold outreach. May need conditional logic (if claimed → hub page, if unclaimed → onboard) — but this is a Phase 3 concern.
      - Verify: Document which routes need future attention

### Phase 3: Onboard page handles signed-in owners (stretch)

- [ ] 5. Make `/provider/[slug]/onboard` redirect claimed owners to dashboard
      - Files: `app/provider/[slug]/onboard/page.tsx`
      - Currently shows "already-claimed" ActionCard state. For the owner specifically, should redirect to `/provider` (their dashboard) instead of showing the dispute form.
      - Check: `bp.account_id === user.account_id` → redirect to `/provider`
      - Verify: Signed-in owner visiting onboard page lands on dashboard

## Design Direction

Per TJ's brief and reference screenshots:

**The hero CTA should be:**
- A single horizontal line below the highlights, not a card or box
- Calm and confident — "Is this your business?" + "Manage this page →" link
- Uses primary teal for the link, gray for the label text
- No icons bloat, no explanatory paragraphs
- Feels like it belongs, not bolted on

**Inspiration:** Think Google Maps "Own this business?" link on business listings — one line, clearly actionable, not screaming.

**What the reference mockups showed (from Notion task):**
- First popup: "Manage this page" + "Update your details, respond to inquiries, and stand out to families" + "Get started" button + "Or — Request to hide or remove page"
- But TJ said we can make it better — the onboard page already handles all this, so the CTA just needs to route there

## Risks

- **Email URL change affects live notifications:** Q&A questions are actively being sent to providers. Changing the URL is safe since `/onboard` handles all states gracefully, but verify the slug is correct (not provider_id).
- **Claimed providers clicking hero CTA:** Need to route to dashboard, not onboard. Onboard page currently handles this but shows "already-claimed" state — need to verify it redirects owners.
- **Bottom section removal:** If external links (SEO, etc.) reference the "Are you the owner?" section, simplifying it could affect discoverability. Keep the text, just change the CTA.

## Notes

- This was identified as "one of the biggest operational gaps" in TJ's Slack message to Esther
- Critical for email campaigns: providers getting Q&A questions, leads, reviews, cold outreach need working links
- The SmartDashboardShell + OnboardingWizard + ActionCard already do the heavy lifting — this plan is about connecting the dots
- The `/api/removal-request` endpoint is referenced in ManageListingModal but may not exist yet — separate issue, not blocking this work
