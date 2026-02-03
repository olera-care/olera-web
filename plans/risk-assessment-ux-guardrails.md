# Risk Assessment & UX Guardrails

## Part 1: Strategy & Build-Phase Risks

### Risk 1: Auth Modal + Onboarding Sequence Conflict (HIGH)

**The problem:** We said auth happens in a modal and the user never leaves the page. We also said onboarding is a multi-step flow (intent → threshold info → profile creation). For organizations, onboarding includes a claim search with database results. That's 4-5 steps. Putting all of that inside a modal is bad UX — modals are for quick, focused interactions, not multi-step workflows.

Worse: if the auth modal triggers onboarding, and onboarding triggers a claim search, we're stacking complex flows inside a single overlay. For a 65-year-old user, this is overwhelming.

**The deeper issue:** The deferred action pattern (click "Save" → auth modal → resume action) assumes auth is fast. But if auth requires onboarding (new user), there's a long gap between "I clicked Save" and the action completing. The user may not even remember what they were doing by the end of onboarding.

**Mitigation — split auth and onboarding:**
- **Auth modal** handles ONLY sign-in and sign-up (email + password, 1 step).
- **Onboarding** is a dedicated full-page flow (`/onboarding`) that new users are redirected to after first auth. This is an acceptable redirect because the user understands they're in a setup phase.
- The deferred action is preserved in `localStorage` (not React state, which dies on navigation): `{ action: "save", targetProfileId: "abc-123", returnUrl: "/provider/sunrise-senior-living" }`.
- After onboarding completes, the user is redirected to `returnUrl` and the deferred action fires.

**Decision needed now:** Auth modal = sign-in/sign-up only. Onboarding = separate page. This must be settled before Phase 0 begins.

---

### Risk 2: Deferred Action State Loss (MEDIUM)

**The problem:** The deferred action context was designed as React state in a context provider. React state doesn't survive:
- Page navigations (onboarding is multi-page)
- Browser refreshes
- Tab switches on mobile (Safari aggressively kills background tabs)

If a user clicks "Request Consultation," signs up in the modal, gets redirected to onboarding, completes 3 steps, and is then redirected back — the React state holding their intended action is gone.

**Mitigation:** Store deferred actions in `sessionStorage` (survives same-tab navigation, dies on tab close — which is correct behavior). Structure:

```json
{
  "deferredAction": {
    "action": "inquiry",
    "targetProfileId": "abc-123",
    "returnUrl": "/provider/sunrise-senior-living",
    "createdAt": "2026-02-03T12:00:00Z"
  }
}
```

On return to the page after onboarding: read `sessionStorage`, execute the action, clear the entry. Expire stale entries older than 1 hour.

---

### Risk 3: Permission State Staleness (MEDIUM)

**The problem:** The permission check (can this user engage?) depends on 5 things being in sync: auth session, account record, active profile, membership status, and trial expiry timestamp. In a Next.js app with server components, some of this is fetched server-side (fresh) and some is cached client-side (potentially stale).

**Scenario:** User's trial expires while they're browsing. Client-side cache says "trialing." User clicks "Respond to Inquiry." Client says "go ahead," renders the response form. They type a reply, submit, and the server rejects: "Trial expired." The user loses their typed response and sees an error. This is a terrible experience.

**Mitigation:**
- All engagement actions are **server actions** (Next.js `"use server"` functions) or **API routes** that check permissions at the point of execution, not at the point of rendering.
- The UI shows the best-known state but treats it as advisory. If the server rejects, the response UI gracefully shows an upgrade prompt with the user's drafted content preserved (not lost).
- For critical state (trial remaining days), fetch it on each page load via the portal layout's server component — not from a client-side cache.

---

### Risk 4: Profile Table as Junk Drawer (MEDIUM, grows over time)

**The problem:** Three profile types share one table. Today that means nullable columns for type-specific fields: `service_area` (home-based only), `care_needs` (family only), `hourly_rate` (caregiver only), `bed_count` (facility only), `license_number` (org only), etc. As features are added, nullable columns accumulate.

At ~10 nullable type-specific columns, the schema is manageable. At 25+, every query returns mostly null fields, migrations become confusing, and it's unclear which columns apply to which type.

**Mitigation — decide the boundary now:**
- Core shared fields (name, location, contact, image, description, care_types) stay as direct columns on the profiles table. These apply to all types.
- Type-specific fields go in a `metadata JSONB` column with a validated schema per type. Example:

```json
// Organization metadata
{ "bed_count": 120, "license_number": "TX-12345", "year_founded": 2005 }

// Caregiver metadata
{ "hourly_rate_min": 25, "hourly_rate_max": 45, "certifications": ["CNA", "CPR"] }

// Family metadata
{ "care_needs": ["memory_care"], "timeline": "within_3_months", "budget_range": "3000-5000" }
```

**Tradeoff:** JSONB is less queryable than direct columns (no native foreign keys, harder to index individual fields). But Postgres supports JSONB indexing via GIN indexes, and for v1 filter volumes this is a non-issue. The alternative — separate `organization_details`, `caregiver_details`, `family_details` tables — adds JOIN complexity to every query.

**Decision needed now:** Adopt the `metadata JSONB` pattern from the start. Define TypeScript types per profile type that validate the JSONB shape.

---

### Risk 5: Slug Collisions for Seeded Profiles (LOW but must solve early)

**The problem:** If we seed 10,000 provider profiles, many will share names ("Sunrise Senior Living" exists in dozens of cities). Slug generation from name alone will collide.

**Resolution:** Slugs include location: `sunrise-senior-living-denver-co`, `sunrise-senior-living-austin-tx`. If still ambiguous, append a short hash: `sunrise-senior-living-austin-tx-a3f2`. Slug generation must be deterministic and collision-resistant. Solve this in the seed script, not as an afterthought.

---

### Risk 6: RLS Policy Complexity (MEDIUM)

**The problem:** Row-Level Security policies are powerful but error-prone. We need policies for:
1. Public profiles (unclaimed orgs): readable by everyone
2. Family profiles: readable only by authenticated providers
3. Profile editing: only by the owner account
4. Connections: readable only by the two participants
5. Memberships: readable/writable only by the owning account
6. Reviews: publicly readable, writable only by authenticated users

That's ~15 policies across 4 tables. Each policy is a SQL expression that runs on every query. Debugging is painful — when a query returns no rows, it's unclear if the data doesn't exist or if RLS blocked it.

**Mitigation:**
- Write RLS policies in a dedicated migration file with extensive comments.
- Create a test script that runs queries as different user roles (anon, family, provider) and asserts expected results.
- Use Supabase's `service_role` key (bypasses RLS) only in server-side seed scripts, never in client code.
- Log RLS-related issues early: add a dev-only helper that queries with `service_role` and compares results to the RLS-filtered query.

---

### Risk 7: Connection Model Ambiguity (LOW now, HIGH later)

**The problem:** In v1, a "connection" is an inquiry (family → provider). In v2, we want messaging, invitations, applications. If v1's Connection table conflates "the initial inquiry" with "the ongoing conversation," the v2 migration to a proper messaging system requires restructuring the connection model.

**Mitigation — design for separation now, build only v1:**
- A Connection represents a **relationship** between two profiles (inquiry, application, save).
- A Connection has a `status` and a `type`, but it does NOT contain messages.
- For v1, the inquiry's initial message is stored in a `message` text field on the Connection. This is explicitly a temporary pattern.
- For v2, introduce a `messages` table (FK → connection_id) and migrate the `message` field to the first message in the thread.

As long as we don't build v1 features that assume the Connection IS the conversation (e.g., a "reply" field on the Connection table), the v2 migration is clean. The key rule: **one Connection = one relationship. Messages live separately.**

---

### Risk 8: Navbar Complexity Creep (MEDIUM)

**The problem:** The Navbar currently has 4 links and 2 auth buttons. Our plan has it rendering differently for:
- Unauthenticated users
- Authenticated families
- Authenticated organizations
- Authenticated caregivers

That's 4 navbar variants. Each with different links, different CTAs, different mobile behavior. The Navbar becomes the most complex component in the app — a single file managing 4 distinct states with role-switching logic.

**Mitigation:** Don't make the Navbar role-aware in early phases. For Phase 0-2, the Navbar has exactly two states: unauthenticated (current) and authenticated (replace "Log In / Get Started" with a user avatar dropdown). Role-specific navigation lives in the `/portal` sidebar, not the Navbar. Defer role-aware Navbar links to Phase 4.

---

## Part 2: UX Quality Guardrails

### Problem: No Design System, Only Ad Hoc Tailwind

The current codebase has 4 CSS classes (`.btn-primary`, `.btn-secondary`, `.input-field`, `.card`) and otherwise uses inline Tailwind. This works at the current scale (5 files) but will degrade quickly as the portal, onboarding, browse, and auth components are added.

**What happens without guardrails:**
- Buttons get inconsistent padding (one dev uses `py-3`, another `py-2.5`)
- Headings vary in size/weight across pages
- Spacing between sections drifts
- Focus states are forgotten on new components
- Mobile breakpoints are applied inconsistently
- The site starts feeling "pieced together" — exactly what we need to avoid

### Guardrail 1: Establish Design Tokens Before Phase 0

Define these as a reference and enforce them in code review. Not a library — just documented decisions.

**Typography Scale:**

```
Body text:      text-lg (18px) — NOT text-base (16px)
                Reason: 16px is too small for 65+ users
Small text:     text-base (16px) — captions, labels, metadata
H1 (page):     text-3xl md:text-4xl font-bold
H2 (section):  text-2xl md:text-3xl font-bold
H3 (card/sub):  text-xl font-semibold
H4 (label):    text-lg font-semibold
```

The current homepage uses `text-base` for body and `text-lg` for subtitle. This should shift up one size globally.

**Spacing Scale:**

```
Section padding:     py-16 md:py-24  (already used, keep consistent)
Content max-width:   max-w-7xl       (already used, keep consistent)
Card padding:        p-6             (standardize)
Element gap:         gap-4 (small), gap-6 (medium), gap-8 (large)
Form field spacing:  space-y-4       (standardize)
```

**Color Usage Rules:**

```
Primary (green):    CTAs, active states, links, brand elements
Secondary (blue):   Informational backgrounds, secondary text
Warm (orange):      Highlights, accent CTAs (sparingly)
Gray-900:           Headings, primary text
Gray-600:           Body text, descriptions
Gray-400:           Placeholder text, disabled states
White:              Backgrounds, cards
```

**Interactive Element Sizing:**

```
Minimum touch target: 44px x 44px (WCAG / Apple HIG)
Button padding:       px-6 py-3 (standard), px-8 py-4 (hero)
Input padding:        px-4 py-3
Rounded corners:      rounded-lg (buttons/inputs), rounded-xl (cards/modals)
```

### Guardrail 2: Component Patterns (Enforce Before Phase 1)

Before building portal pages, create these foundational components:

```
Button          → Variants: primary, secondary, ghost, danger
                → States: default, hover, focus, disabled, loading
                → Sizes: sm, md, lg
                → Always meets 44px touch target minimum

Input           → Variants: text, select, textarea
                → States: default, focus, error, disabled
                → Always includes label + optional error message

FormField       → Wraps Input with label, help text, error
                → Consistent spacing and alignment

Badge           → Variants: verified, unclaimed, pending, trial
                → Consistent sizing and color mapping

Modal           → Consistent overlay, padding, close behavior
                → Traps focus, closes on Escape
                → Animates in/out (subtle, fast: 150ms)

EmptyState      → Illustration + message + single CTA
                → Used on every "no data" screen
```

This is 6 components. Building them before portal pages prevents every page from reinventing button styles and form layouts.

### Guardrail 3: Accessibility Baseline (Non-Negotiable)

For a 65+ user base, these are not optional:

```
1. Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text)
   - Current primary-600 (#227551) on white: ~4.8:1 ✓
   - Current gray-600 (#466182... wait, that's secondary) — need to verify
   - Warm-500 (#d67f42) on white: ~2.8:1 ✗ FAILS
     → The orange search button on the hero has white text on warm-500
     → This needs to be warm-700 or darker for accessible contrast

2. Focus indicators: Every interactive element must have a visible focus ring
   - Current buttons have focus:ring-2 ✓
   - Links in the Navbar do NOT have focus indicators ✗

3. Font size: Body text minimum 18px (text-lg), never smaller for primary content

4. Touch targets: All clickable elements minimum 44x44px
   - Current carousel arrows are w-10 h-10 (40x40) ✗ — too small

5. Motion: Respect prefers-reduced-motion
   - Add to globals.css:
     @media (prefers-reduced-motion: reduce) {
       *, *::before, *::after {
         animation-duration: 0.01ms !important;
         transition-duration: 0.01ms !important;
       }
     }

6. Semantic HTML: Use <main>, <nav>, <section>, <article>, <aside> correctly
   - Current layout uses <main> ✓
   - Navbar uses <nav> ✓

7. Screen reader support: aria-labels on icon-only buttons, alt text on images
   - Mobile menu button has aria-label ✓
   - Heart/save buttons on ProviderCard lack aria-label ✗
```

### Guardrail 4: Copy & Language Rules

```
1. Reading level: ~3rd grade (short sentences, common words)
   - "Find care near you" not "Discover comprehensive elder care solutions"
   - "Save this provider" not "Add to your curated shortlist"
   - "Your trial ends in 7 days" not "Your complimentary trial period expires in 7 days"

2. One CTA per context: Every screen/section has ONE primary action
   - If there are two buttons, one is primary (solid) and one is secondary (outline)
   - Never two solid buttons side by side

3. Labels over icons: Always pair icons with text labels
   - Exception: universally understood icons (close X, back arrow, search magnifier)
   - A heart icon without "Save" text is risky for 65+ users

4. Error messages: Say what happened + what to do next
   - "That email is already registered. Try signing in instead." (link)
   - NOT "Error: duplicate key violation"

5. Confirmation over assumption: After any significant action, confirm it explicitly
   - "Inquiry sent. The provider will see your message."
   - Not just a green toast that fades away
```

### Guardrail 5: Layout Principles

```
1. Single-column content on mobile. Always.
   - No horizontal scrolling
   - No side-by-side cards below 640px

2. Max content width: 65ch for readable text blocks
   - max-w-prose on long descriptions

3. Consistent page structure:
   - Page header: title + optional subtitle + optional primary action
   - Content area
   - No floating action buttons or surprise elements

4. Whitespace is a feature, not waste
   - Sections have py-16 md:py-24 — do not compress this
   - Cards have p-6 minimum
   - Groups of elements have gap-6 minimum

5. Progressive disclosure: Show the minimum, offer "Learn more" or "See details"
   - Provider cards show 2 care types + "+3 more" (already implemented ✓)
   - Profile editor should group fields into collapsible sections
```

---

## Part 3: Decisions That Must Be Made Before Phase 0

These cannot be deferred without causing rework:

| # | Decision | Options | Recommended |
|---|----------|---------|-------------|
| 1 | Auth modal scope | Auth+onboarding in modal vs. auth-only modal + onboarding page | Auth-only modal, onboarding as /onboarding page |
| 2 | Deferred action storage | React context vs. sessionStorage | sessionStorage (survives navigation) |
| 3 | Type-specific profile fields | More nullable columns vs. JSONB metadata | JSONB metadata column with typed schemas |
| 4 | Slug generation for seeded profiles | Name-only vs. name+location | Name + city + state (e.g., sunrise-senior-living-austin-tx) |
| 5 | Body text base size | text-base (16px) vs. text-lg (18px) | text-lg (18px) for 65+ readability |
| 6 | Component library approach | Continue ad-hoc Tailwind vs. build small component set first | Build 6 foundational components before portal pages |
| 7 | Connection vs. message separation | Messages in Connection table vs. separate | Separate from start (message field on Connection is temporary v1 shortcut) |
| 8 | Navbar role-awareness timing | Role-aware from Phase 0 vs. defer to Phase 4 | Defer. Two states only: unauth and auth. Role nav lives in /portal sidebar. |

---

## Part 4: Things That Will Quietly Degrade the Experience

These are not dramatic failures. They're slow erosion of quality that compounds over time.

**1. Inconsistent loading states.** Without a standard skeleton/spinner pattern, some pages will show a blank white flash, others will show a spinner, others will show skeleton cards. Users (especially older users) won't understand whether the page is broken or loading. Solution: Define one loading pattern (skeleton screens, not spinners) and apply it to every async page from Phase 0.

**2. Toast notification creep.** Once we add toast notifications for "Saved!" or "Inquiry sent!", it becomes tempting to toast everything. Toasts are invisible to users who aren't looking at the right part of the screen. For important confirmations, use inline confirmation (the button itself changes to "Sent ✓") or a visible status change on the page. Reserve toasts for low-priority feedback only.

**3. Form validation inconsistency.** Every form needs the same validation UX: inline errors below fields, shown on blur (not on submit), with the same red-500 color and text-sm size. If one form validates on submit and another validates inline, the product feels inconsistent.

**4. Navigation dead ends.** Every page must have a clear "what do I do next?" affordance. Portal pages should never show empty states without a CTA. "No connections yet" must include "Here's how to get started." Browse pages with no results must suggest broadening filters or trying a different location.

**5. Mobile keyboard behavior.** On mobile, when a user taps an input field, the keyboard pushes the viewport up. If a modal is open, the modal may scroll behind the keyboard and the input becomes hidden. This is a common bug on iOS. Test every form in the auth modal and onboarding on a real mobile device (or simulator) before shipping.

**6. Portal sidebar on mobile.** The desktop portal has a sidebar. On mobile, this must collapse to either a bottom navigation bar or a hamburger-accessible drawer. If we don't decide this in Phase 1, the portal will look like a shrunk desktop app on phones.
