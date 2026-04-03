# Plan: Provider Page CTA Conversion Redesign

Created: 2026-04-02
Status: Not Started
Branch: TBD (from staging)

## Goal

Increase provider page CTA conversion from 0.44% toward 2-5% industry average by reducing form friction (4 fields → 1), matching user intent ("What does this cost?"), and delivering real value post-submit (pricing ranges, funding education).

## Success Criteria

- [ ] Guest CTA is email-only (1 field) with new copy
- [ ] Logged-in CTA is one-click (0 fields)
- [ ] Post-submit shows pricing range, funding options, and enrichment questions
- [ ] First name collected in enrichment (fixes `rosebynum52` display name problem)
- [ ] Trust signals visible: "No spam. No sales calls." + social proof count
- [ ] Mobile bottom sheet matches desktop redesign
- [ ] All existing flows still work: guest account creation, provider email block, rate limiting, enrichment save/skip, redirect to /welcome
- [ ] No regressions in provider notifications (email, SMS, WhatsApp, Slack)

## Baseline Metrics (March 2026)

- 10,980 unique users on provider detail pages
- 48 real connections (0.44% conversion)
- Target: 2%+ (220+ connections/month at same traffic)

---

## Tasks

### Phase 1: CTA Form Redesign (InquiryForm.tsx)
The core change — strip form to email-only, new copy and trust signals.

- [ ] 1. Redesign InquiryForm component
      - File: `components/providers/connection-card/InquiryForm.tsx` (172 lines)
      - Changes:
        - Remove `fullName`, `phone`, `message` fields and state (lines 29-32)
        - Remove name+phone side-by-side layout (lines 94-113)
        - Remove message textarea (lines 116-122)
        - Change title "Get in touch" → "What does this cost?" (line 78)
        - Change button "Connect with us" → "Check cost & availability" (line 148)
        - Add trust line below button: "No spam. No sales calls."
        - Add social proof line: dynamic count from props
        - Keep honeypot field (anti-spam)
        - Keep email validation (line 37)
        - Keep Enter key submission (lines 64-72)
        - Update `onSubmit` to only pass `{ email }` (fullName/phone/message removed)
      - Props changes:
        - Remove `initialName`, `initialPhone` props
        - Add `connectionCount?: number` prop (social proof)
        - Simplify `onSubmit` signature: `(data: { email: string }) => void`
      - Verify: Form renders with 1 field, submits with email only, trust lines visible

- [ ] 2. Update InquiryForm props interface and hook integration
      - File: `components/providers/connection-card/use-connection-card.ts` (775 lines)
      - Changes:
        - Update `submitInquiryForm` (lines 516-655) to accept `{ email }` instead of `{ email, fullName, phone, message }`
        - Set `formData.fullName = ""`, `formData.phone = ""`, `formData.message = ""` in API payload (keep API contract stable initially)
        - Remove `userName`, `userPhone` from returned pre-fill values (lines 738-739)
      - File: `components/providers/connection-card/index.tsx` (134 lines)
        - Remove `initialName={hook.userName}` and `initialPhone={hook.userPhone}` from InquiryForm props (lines 67-68)
        - For logged-in users with email: render a one-click button instead of form
      - Verify: Guest submits email only, logged-in user sees one-click, API still receives valid payload

- [ ] 3. Add one-click state for logged-in users
      - File: `components/providers/connection-card/index.tsx`
      - Changes:
        - When `cardState === "default"` AND `hook.userEmail` exists:
          - Show "Signed in as {email}" text
          - Show "Check cost & availability" button (no form fields)
          - Click fires `submitInquiryForm({ email: hook.userEmail })` directly
        - When no email (guest): show email field as designed
      - Verify: Logged-in user sees button only, guest sees email field + button

### Phase 2: Enhanced Enrichment (Post-Submit Experience)
The value delivery — pricing ranges, funding options, first name collection.

- [ ] 4. Create pricing data utility
      - File: `lib/pricing-ranges.ts` (NEW)
      - Purpose: Lookup table of typical pricing ranges by care type and optionally by state/metro
      - Structure:
        ```typescript
        export const CARE_TYPE_PRICING: Record<string, { low: number; high: number; unit: string; description: string }> = {
          "Assisted Living": { low: 3500, high: 6500, unit: "/mo", description: "Base rate + care level add-ons based on needs" },
          "Memory Care": { low: 5000, high: 9000, unit: "/mo", description: "Specialized dementia/Alzheimer's support included" },
          "Home Care (Non-medical)": { low: 20, high: 35, unit: "/hr", description: "Personal care, companionship, light housekeeping" },
          "Home Health Care": { low: 25, high: 50, unit: "/hr", description: "Skilled nursing, therapy, medical monitoring" },
          "Independent Living": { low: 1500, high: 4000, unit: "/mo", description: "Housing + amenities, minimal care services" },
          "Nursing Homes": { low: 7000, high: 12000, unit: "/mo", description: "24/7 skilled nursing, rehab, medical care" },
          // ... more categories
        };
        export const FUNDING_OPTIONS = [
          { label: "Long-term care insurance", icon: "shield" },
          { label: "VA Aid & Attendance", icon: "flag" },
          { label: "Medicaid", icon: "heart" },
          { label: "Medicare (limited)", icon: "plus" },
          { label: "Private pay", icon: "wallet" },
        ];
        export function getPricingForProvider(careTypes: string[], priceRange: string | null): PricingInfo { ... }
        ```
      - Verify: Import and call with test data, returns correct ranges

- [ ] 5. Redesign EnrichmentState with pricing + first name
      - File: `components/providers/connection-card/EnrichmentState.tsx` (109 lines)
      - Changes:
        - Add new props: `careTypes: string[]`, `priceRange: string | null`, `city: string`, `state: string`
        - Add `firstName` state and text input ("What should we call you?")
        - Show pricing section ABOVE enrichment questions:
          - "Typical range: $X,XXX – $X,XXX/mo" (from provider priceRange or care type lookup)
          - "How is this priced?" — 1-2 sentence explainer from CARE_TYPE_PRICING
          - "Ways to pay:" — bullet list from FUNDING_OPTIONS
        - Keep existing recipient + urgency pills below pricing section
        - Update `onSave` to include `firstName` in data
        - Update "Skip for now" to still work without any selections
      - File: `components/providers/connection-card/types.ts`
        - Add `firstName?: string` to enrichment save data type
      - Verify: After submit, pricing range displays correctly, first name field works, save/skip still function

- [ ] 6. Wire first name through to API
      - File: `app/api/connections/update-intent/route.ts`
        - Accept optional `firstName` parameter
        - Update `connections.message` JSON with first name
        - Update `business_profiles.display_name` if currently email-prefix
      - File: `components/providers/connection-card/use-connection-card.ts`
        - Update `saveEnrichment` (lines 671-702) to include `firstName`
      - Verify: Enrichment save updates display_name in DB, connection message includes name

- [ ] 7. Pass pricing props through ConnectionCard
      - File: `components/providers/connection-card/index.tsx`
        - Pass `careTypes`, `priceRange`, `city`, `state` to EnrichmentState
      - File: `components/providers/connection-card/types.ts`
        - Add `city: string`, `state: string` to ConnectionCardProps
      - File: `app/provider/[slug]/page.tsx`
        - Pass `city` and `state` to ConnectionCard (already available from provider data)
      - Verify: Pricing data flows from provider page → ConnectionCard → EnrichmentState

### Phase 3: Mobile CTA Update
Match mobile bottom sheet to desktop redesign.

- [ ] 8. Update MobileStickyBottomCTA
      - File: `components/providers/MobileStickyBottomCTA.tsx` (300+ lines)
      - Changes:
        - Update sheet title for "default" state: "What does this cost?" (line 220)
        - Update connect button text: "Check cost & availability" (line 254)
        - Pass pricing/city/state props through to ConnectionCard in bottom sheet
        - Add trust line to footer section
        - For logged-in users: show one-click in bottom sheet
      - Verify: Mobile CTA matches desktop — new copy, email-only form, trust signals

### Phase 4: Social Proof Data
Dynamic connection counts for the trust line.

- [ ] 9. Add social proof count
      - File: `app/api/connections/count/route.ts` (NEW)
        - GET endpoint returning total real connection count for the current month
        - Simple query: `connections` where `type = 'inquiry'` and `created_at >= start of month`
        - Cache with 1-hour TTL (ISR or in-memory)
      - File: `components/providers/connection-card/use-connection-card.ts`
        - Fetch connection count on mount, pass to InquiryForm
        - OR: pass as prop from provider detail page (fetched at build time via ISR)
      - Verify: "48 families checked this month" displays with real number

### Phase 5: Care Report Email
The automated follow-up that differentiates Olera from APFM.

- [ ] 10. Create care report email template
       - File: `lib/email-templates.tsx`
         - New function: `careReportEmail({ providerName, providerSlug, careTypes, priceRange, city, state, fundingOptions, similarProviders, seekerFirstName })`
         - Content:
           - "Hi {firstName}, here's what we found about {providerName}"
           - Pricing range for their care type in their area
           - How pricing works (1 paragraph)
           - Funding options checklist
           - 3 similar providers with links (name, rating, price range)
           - "Explore funding options →" link to Benefits Finder
           - "View your inbox →" link to portal
         - Design: Clean, informational, no hard-sell — anti-APFM tone
       - Verify: Template renders correctly with test data

- [ ] 11. Send care report email after connection
       - File: `app/api/connections/request/route.ts`
         - After connection creation (line ~700), add care report email send
         - Query 3 similar providers (same care type, same city/state, different ID)
         - Use pricing lookup for care type context
         - Send via Resend (same as existing emails)
       - Verify: Guest creates connection → receives care report email within 1 minute

### Phase 6: Handle API + Downstream Dependencies
Ensure the API and all downstream systems work cleanly with email-only submissions.

**Dependency audit completed** — the following systems parse connection form data:

- [ ] 12. Update guest connection handler for email-only
       - File: `app/api/connections/request/route.ts`
         - Lines 38-39: Remove `guestFullName`, `guestPhone` from handler params (make optional with defaults)
         - Lines 145-146: Default `displayName` to "Care Seeker" instead of email prefix when no name
         - Lines 291, 297, 356, 362: `normalizedPhone = null` when no phone provided (already nullable)
         - Lines 606-635: Message payload — `seeker_name` = "Care Seeker", `seeker_phone` = null, `message` = null
         - Lines 638-648: Auto-intro — use "A family in {city}, {state} is interested in your services" when no custom message
         - Lines 656-663: Auto-reply — use "Hello" instead of "Hello {firstName}" when name unknown
         - Lines 978-993: Make `formData` fields optional in request body validation
       - Verify: Guest submits email only → profile created with clean placeholder → auto-intro reads naturally

- [ ] 13. Update provider connections page (lead cards)
       - File: `app/provider/connections/page.tsx`
         - Line 1174: Phone fallback chain `familyProfile?.phone || seeker_phone` will be null — show "Contact via Olera inbox" instead of phone number when no phone available
         - Line 1096: Name fallback `seeker_name || [first, last].join(" ")` — add fallback to "Care Seeker" or profile display_name
         - Line 1196: `aboutSituation` from `additional_notes || message` will be null — show "No message provided — check inbox for details" or hide section
       - Verify: Provider views lead with no phone/message → sees email + "Contact via inbox" instead of blank fields

- [ ] 14. Update messaging/conversation components
       - File: `components/messaging/ConversationPanel.tsx`
         - Line 182: `displayMessage = careRequest.message || careRequest.additionalNotes` will be null
         - Show Olera-generated intro instead: "A family inquired about pricing and availability" (from auto_intro in metadata)
         - Line 92: `hasData` check — ensure it still passes with just `seeker_email`
       - File: `components/messaging/ConversationList.tsx`
         - Lines 130-153: Message preview generation — when no `additional_notes`, use care_type or "New inquiry" as preview text
       - File: `components/messaging/RequestDetailPanel.tsx`
         - Message display — fall back to auto_intro from connection metadata when no user message
       - Verify: Conversation thread shows Olera-generated intro, not empty message. List preview shows "New inquiry" or care type.

- [ ] 15. Update admin leads page
       - File: `app/admin/leads/page.tsx`
         - Lines 590-600: Already handles null gracefully for care_type/urgency
         - Add: when `msg.seeker_name` is "Care Seeker" or null, display email instead
         - Ensure lead table doesn't show blank name/phone columns
       - Verify: Admin sees leads with email prominently displayed, no blank rows

- [ ] 16. Update notification messages for no-name/no-message
       - File: `app/api/connections/request/route.ts`
         - Lines 784-799: Provider email — `familyName` fallback already uses "A family" (line 789) ✓
         - Lines 806-835: SMS — `firstName || "a family"` fallback already works ✓
         - Lines 837-878: WhatsApp — `firstName || "A family"` fallback already works ✓
         - Lines 880-917: Slack alert — verify it doesn't show "null" for name/phone
       - File: `lib/email-templates.tsx`
         - `connectionRequestEmail()`: `message` param not used in output ✓ (confirmed)
         - Ensure no template renders "null" or empty strings visibly
       - Verify: Provider receives notification "A family is interested in your services" — not "null is interested"

---

## Risks

1. **Provider lead display breaks** — `app/provider/connections/page.tsx` shows phone and message from connection JSON. With email-only, these are null. Mitigation: Task 13 adds "Contact via inbox" fallback.

2. **Conversation threads show empty messages** — `ConversationPanel.tsx`, `ConversationList.tsx`, `RequestDetailPanel.tsx` all parse message JSON for preview text. Mitigation: Task 14 falls back to auto_intro from connection metadata.

3. **Admin dashboard blank rows** — Leads page could show empty name/phone. Mitigation: Task 15 ensures email displayed prominently.

4. **Notifications render "null"** — SMS, WhatsApp, Slack templates could show literal "null". Mitigation: Task 16 audits all paths — most already have "A family" fallbacks (confirmed).

5. **API contract change** — Form stops sending name/phone/message. Mitigation: Task 12 makes fields optional with clean defaults.

6. **Enrichment save regression** — Adding firstName could break if API doesn't expect it. Mitigation: make optional, test save/skip.

7. **Mobile bottom sheet mismatch** — Has its own title/button logic. Mitigation: Task 8 explicitly updates.

8. **Pricing data accuracy** — Ranges are estimates. Mitigation: label "Typical range", add "costs vary" disclaimer.

9. **Social proof low numbers** — "3 families" in small city hurts credibility. Mitigation: site-wide count or hide below threshold.

## Implementation Order

**Phase 1** (Tasks 1-3: form + copy) → **Phase 6** (Tasks 12-16: API + all downstream fixes) → **Phase 2** (Tasks 4-7: enrichment + pricing) → **Phase 3** (Task 8: mobile) → **Phase 4** (Task 9: social proof) → **Phase 5** (Tasks 10-11: care report email)

Rationale: Ship form reduction + copy change first (biggest conversion lever). Immediately fix API and all downstream displays so providers/admin don't see broken data. Then build value delivery. Mobile and email follow.

## Notes

- The `priceRange` prop ALREADY exists on ConnectionCardProps and flows from the provider detail page — we don't need to add new data fetching for per-provider pricing
- `acceptedPayments` is already displayed in CardBottomSection — keep this as-is
- The `intent` and `email_capture` and `returning` card states are unused dead code — don't touch them in this PR, clean up separately
- The 90% drop-off constraint means: ALL new UI (pricing, funding, first name) goes in the post-submit enrichment, NEVER before the form
- Care type pricing lookup table can be expanded over time with metro-specific data
