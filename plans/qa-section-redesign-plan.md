# Plan: Q&A Section Redesign — "Ask Anything"

Created: 2026-04-06
Status: Not Started

## Goal

Redesign the provider page Q&A section so suggested questions are the primary interface (hero cards, not tiny pills above a textarea), with category-specific copy, Wispr Flow-inspired bold typography, and a compact chat-bar input as the secondary escape hatch.

## Context

- ~90%+ of providers have 0 questions — the empty state IS the experience for most users
- Current design leads with an empty textarea + 4 generic pills → high friction, low conversion
- Q&A is a micro-conversion: every question = contact info capture opportunity (guest enrichment)
- Wispr Flow inspiration: bold confident headers, tappable pill/card actions as primary UI, clean whitespace, warm palette

## Success Criteria

- [ ] Suggested questions are full-width tappable cards — the dominant visual element
- [ ] Questions are category-specific (12 categories × 4-6 questions each)
- [ ] Tapping a card submits instantly (no intermediate textarea step)
- [ ] Custom input is a compact chat-bar that expands on focus (not a pre-expanded textarea)
- [ ] Section header is bold and punchy ("Got questions?" / "Families are asking")
- [ ] When questions exist, they appear as social proof above the suggestions
- [ ] Guest enrichment post-submit uses pill-tap pattern (consistent with connection card)
- [ ] Mobile experience is tight and delightful
- [ ] No regressions: edit, enrichment, modal, and provider answer flows still work

## Design Language (Wispr-Inspired, Olera-Adapted)

### Typography
- Section header: large, bold, confident — `text-2xl md:text-3xl font-bold tracking-tight`
- Suggested question cards: `text-[15px] font-medium` — readable, not cramped
- Subtext/counts: small, muted, restrained

### Suggested Question Cards
- Full-width rows with subtle border, rounded-xl
- Left-aligned question text + right arrow icon (→) or send icon
- Hover: slight lift/shadow + border color shift
- Active: scale-down micro-animation
- Feel: "tap to ask" not "click to fill a form"

### Chat Bar Input
- Single-line input with send button inline (like iMessage/WhatsApp bar)
- Placeholder: "Ask something else..."
- Expands to multi-line on focus if needed
- Visually lighter than the suggestion cards — clearly secondary

### Color & Feel
- Warm neutrals (gray-50 backgrounds, gray-900 text)
- Primary accent on interactive elements only
- Cards: white bg, gray-200 border, primary-600 on hover
- No gradients on cards — flat, clean, confident

## Tasks

### Phase 1: Category-Specific Questions Map

- [ ] 1. Create `getSuggestedQuestions()` function
      - Files: `lib/provider-utils.ts`
      - Add function mapping ProfileCategory → string[] (4-6 questions each)
      - Categories: home_care_agency, home_health_agency, hospice_agency, independent_living, assisted_living, memory_care, nursing_home, inpatient_hospice, rehab_facility, adult_day_care, wellness_center, private_caregiver
      - Questions should be emotionally resonant, specific, and reflect real family concerns
      - Fallback: generic set for unknown categories
      - Verify: import + call with each category, confirm non-empty arrays

- [ ] 2. Wire category into QASectionV2 from provider page
      - Files: `app/provider/[slug]/page.tsx`
      - Pass `suggestedQuestions={getSuggestedQuestions(profile.category)}` to QASectionV2
      - Also pass `providerCategory={profile.category}` (needed for future personalization)
      - Verify: dev server, check different provider categories show different questions

### Phase 2: Redesign QASectionV2

- [ ] 3. Restructure QASectionV2 layout and header
      - Files: `components/providers/QASectionV2.tsx`
      - New header: bold "Got questions?" (0 questions) or "Families are asking" (has questions)
      - Social proof line when questions exist: "X questions · Y answered"
      - Reorder: existing Q&A threads ABOVE suggestions (when they exist)
      - When 0 questions: suggestions are the only content (no empty state text)
      - Verify: visual check with 0 questions and with questions

- [ ] 4. Redesign suggested questions as tappable cards
      - Files: `components/providers/QASectionV2.tsx`
      - Replace pill buttons with full-width card rows
      - Each card: question text left, arrow/send icon right
      - Styling: `bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-gray-300 hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer`
      - Tap = instant submit (call `submitQuestion(questionText)` directly)
      - After submit: card gets checkmark + "Asked!" state, then fades to enrichment
      - Hide remaining cards after one is tapped (or dim them)
      - Verify: tap a card, confirm question posts without textarea interaction

- [ ] 5. Replace textarea with compact chat-bar input
      - Files: `components/providers/QASectionV2.tsx`
      - Single-line input with inline send button (right-aligned inside input)
      - Placeholder: "Ask something else..."
      - On focus: optionally expand height (auto-resize)
      - Submit on Enter (single line) or click send icon
      - Visually smaller/lighter than the suggestion cards
      - Positioned below suggestion cards
      - Verify: type custom question, submit, confirm it posts

- [ ] 6. Polish post-submit enrichment flow
      - Files: `components/providers/QASectionV2.tsx`
      - After question posts (from card tap or custom input):
        - Show inline success + enrichment prompt
        - "Get notified when they reply" — email input + submit
        - Clean single-field design (not the current side-by-side name+email)
        - Skip link clearly visible
        - Auto-dismiss after enrichment or skip
      - Verify: post as guest, confirm enrichment prompt appears, test submit + skip

### Phase 3: Polish & Edge Cases

- [ ] 7. Animate transitions
      - Files: `components/providers/QASectionV2.tsx`
      - Card tap → success state: smooth transition (not jarring swap)
      - Enrichment appear/dismiss: fade + slide
      - Question appears in list after posting: slide-in from top
      - Verify: visual smoothness on desktop + mobile

- [ ] 8. Mobile optimization
      - Files: `components/providers/QASectionV2.tsx`
      - Cards should be full-width, comfortable tap targets (min 48px height)
      - Chat bar input: appropriate mobile keyboard handling
      - Test in responsive mode at 375px, 390px widths
      - Verify: mobile simulator, all interactions work

- [ ] 9. Update "See all questions" modal styling
      - Files: `components/providers/QASectionV2.tsx`
      - Align modal typography with new section styling
      - Keep existing functionality (bottom sheet mobile, centered desktop)
      - Verify: open modal, confirm styling consistency

## Question Copy — Draft per Category

### Home Care (`home_care_agency`)
1. "Can I meet the caregiver before they start?"
2. "What happens if my caregiver calls in sick?"
3. "Do you have a minimum number of hours per visit?"
4. "Are your caregivers background-checked?"
5. "Can caregivers help with medication reminders?"

### Home Health (`home_health_agency`)
1. "Does Medicare cover your services?"
2. "How quickly can a nurse start visiting?"
3. "Can you coordinate with my doctor's office?"
4. "What happens after my insurance authorization ends?"
5. "Do you offer physical therapy at home?"

### Assisted Living (`assisted_living`)
1. "Can I tour the community before deciding?"
2. "What's included in the monthly cost?"
3. "How do you handle medical emergencies?"
4. "Can residents bring their own furniture?"
5. "What activities and outings do you offer?"

### Memory Care (`memory_care`)
1. "How do you keep residents with dementia safe?"
2. "What's the staff-to-resident ratio?"
3. "Can my parent still go outside?"
4. "How do you handle sundowning behavior?"
5. "What training do your caregivers receive?"

### Nursing Home (`nursing_home`)
1. "Does Medicare or Medicaid cover the stay?"
2. "Can I visit anytime?"
3. "What's the staff-to-patient ratio?"
4. "How do you handle a change in care needs?"
5. "What are the options for rehab-to-long-term transitions?"

### Hospice (`hospice_agency`)
1. "Is hospice really free for families?"
2. "Can my loved one stay at home for hospice?"
3. "How quickly can services start?"
4. "What support do you offer for family caregivers?"
5. "What if my loved one improves — can they leave hospice?"

### Independent Living (`independent_living`)
1. "What's included in the monthly fee?"
2. "Are there options if I need more help later?"
3. "What social activities are available?"
4. "Can I bring my pet?"
5. "Is there a waitlist?"

### Inpatient Hospice (`inpatient_hospice`)
1. "When is inpatient hospice the right choice?"
2. "Can family stay overnight?"
3. "Is this covered by Medicare?"
4. "How is pain managed for patients?"
5. "What support do you offer the family?"

### Rehabilitation (`rehab_facility`)
1. "How long does the average stay last?"
2. "What does a typical day look like?"
3. "Will insurance cover my rehab stay?"
4. "Can family visit during therapy hours?"
5. "What's the transition plan for going home?"

### Adult Day Care (`adult_day_care`)
1. "What hours are you open?"
2. "Do you offer transportation?"
3. "Can you accommodate special dietary needs?"
4. "What activities do participants do during the day?"
5. "Do you accept Medicaid or VA benefits?"

### Wellness Center (`wellness_center`)
1. "What programs do you offer for seniors?"
2. "Do I need a referral to join?"
3. "Are group classes available?"
4. "What does a first visit look like?"

### Private Caregiver (`private_caregiver`)
1. "Are you available on weekends?"
2. "Can you help with bathing and personal care?"
3. "Do you have experience with dementia patients?"
4. "What are your rates?"
5. "Can you provide references?"

### Fallback (unknown category)
1. "What services do you provide?"
2. "What are your rates or pricing?"
3. "How quickly can you get started?"
4. "Do you accept insurance or Medicaid?"

## Risks

- **Instant-submit on card tap could surprise users** — Mitigation: show brief "Asked!" confirmation state on the card before transitioning to enrichment. The question text is already visible (it's the card label), so there's no "what did I just send?" confusion.
- **Category mapping may not cover all providers** — Mitigation: fallback generic questions for unknown/null categories.
- **Existing Q&A threads could look disconnected from new card style** — Mitigation: task 9 aligns modal styling.
- **Guest enrichment changes must not break existing flow** — Mitigation: keep the same API calls (POST + PATCH /api/questions), only change the UI.

## Non-Goals (for this PR)

- Provider answer notification improvements
- Q&A SEO/structured data changes
- Threading beyond single Q→A
- Voting or reactions on questions
- AI-generated answers

## Notes

- The `suggestedQuestions` prop already exists on QASectionV2 — we just need to pass category-specific values
- `getDefaultQA()` in `lib/provider-utils.ts` already has a category-switching pattern we can follow
- The guest enrichment PATCH endpoint (`/api/questions` PATCH) is unchanged — only UI changes
- Connection card enrichment uses pill-tap auto-advance pattern — Q&A enrichment should feel similar
