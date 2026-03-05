# Caregiver MVP — Consolidated Development Plan

> Updated 2026-03-05 — Single source of truth for the caregiver system implementation.
> Incorporates engineering strategy, UI consistency, execution tracking, merge safety, and regression prevention.

---

## 1. Project Overview

### Problem

The Olera platform supports three profile types — family, organization, and caregiver — but the caregiver path is blocked. Selecting "Private Caregiver" during provider onboarding shows a "Coming Soon" dead end. The database schema, API, type system, and auth infrastructure all support caregivers already. The gap is entirely in the UX layer.

### What We're Building

A complete caregiver onboarding and profile system that allows individual caregivers to:

1. Sign up and complete an onboarding wizard
2. Create and manage a caregiver profile
3. Appear in public browse and portal discover pages
4. Receive connection requests from families and organizations
5. Communicate via the existing inbox/messaging system

### Intended Outcome

Caregivers become first-class participants on the platform, alongside families and organizations. The feature integrates naturally into the existing architecture — same auth, same inbox, same connection system, same portal.

---

## 2. Guiding Principles

1. **Extend, don't fork.** Reuse existing onboarding, inbox, and profile infrastructure. No parallel systems.
2. **Metadata-only data changes.** All new caregiver fields go into the existing JSONB `metadata` column — zero schema migrations.
3. **Role-aware, not role-duplicated.** One inbox, one dashboard, one connection system — with role-appropriate copy and behavior.
4. **MVP = demo-ready.** A caregiver can sign up, fill out a profile, appear in discovery, and receive messages. Nothing more.
5. **Design consistency.** Every new UI element matches the existing platform design language — same components, spacing, typography, colors, and interaction patterns.
6. **Incremental delivery.** Each step is small, independently testable, and validated before moving to the next.
7. **Regression prevention.** Existing flows (family browse, org onboarding, connections, auth) must remain stable throughout.
8. **Merge safety.** Small, focused commits. No unnecessary changes to shared infrastructure. Branch stays mergeable into staging.

---

## 3. MVP Scope

### Included

| Feature | Description |
|---------|-------------|
| Caregiver onboarding | Replace "Coming Soon" with real wizard steps in existing `/provider/onboarding` |
| Profile creation | Caregiver profile stored in `business_profiles` with metadata (rate, certs, experience) |
| Profile management | Caregiver dashboard with relevant cards and edit modals in existing provider dashboard |
| Public browse | `/browse/caregivers` made public (remove org-only RoleGate) |
| Portal discover | Existing `/portal/discover/caregivers` works as-is for org engagement |
| Public profile page | Existing `/provider/[slug]` renders caregiver profiles with conditional sections |
| Inbox/connections | Existing inbox expanded to show invitation/application connection types |
| Navigation | Role-aware nav items (caregiver-specific hub links) |

### Intentionally Deferred (Post-MVP)

| Feature | Reason |
|---------|--------|
| Homepage caregiver integration | Requires design work, not needed for demo |
| City/state pages with caregivers | SEO optimization, not MVP-critical |
| Caregiver-specific Q&A section | Low priority for individual caregivers |
| Background check verification | Needs external integration |
| Advanced search/filter on browse pages | MVP shows simple list |
| Stripe payments for caregivers | Payment system not fully live |
| Shared CaregiverCard extraction | Cleanup task — defer to Step 5 polish |
| `/browse/families` page cleanup | Exists but unclear purpose — leave as-is |

---

## 4. Step-by-Step Implementation Plan

### Step 1: Caregiver Onboarding

**Objective:** Allow users to select "Private Caregiver" and complete the onboarding wizard, resulting in a caregiver profile in the database.

**Systems affected:**
- `app/provider/onboarding/page.tsx` — Replace "Coming Soon" step with caregiver wizard steps
- `app/api/auth/create-profile/route.ts` — Accept and store caregiver metadata fields

**What changes:**
1. `handleStep1Next()`: Change caregiver branch from `setStep("caregiver-coming-soon")` to `setStep(2)`
2. Steps 2-4: Conditional labels/fields when `providerType === "caregiver"` (name → "Your full name", hide org category, hide website)
3. Step 5: Caregiver-specific fields — care types (reuse existing), years of experience, certifications (multi-select), hourly rate range (optional)
4. Submit handler: Pass caregiver metadata to API
5. API: Store `years_experience`, `certifications`, `hourly_rate_min/max` in metadata JSONB
6. Remove "Coming Soon" step, waitlist state, and notify form code
7. Update `handleResume()` to resume caregiver wizard at saved step
8. Update WizardNav step labels for caregiver flow

**Risks/dependencies:**
- Onboarding page is 2000+ lines — changes are additive within conditional branches, not restructuring
- API already handles `providerType: "caregiver"` — minimal change needed

**Validation checklist:**
- [ ] Select "Private Caregiver" → wizard progresses (no "Coming Soon")
- [ ] Complete all wizard steps → profile created in `business_profiles` with `type='caregiver'`
- [ ] Metadata fields (rate, certs, experience) stored correctly in JSONB
- [ ] Family profile auto-created alongside caregiver profile
- [ ] Membership record created (free tier)
- [ ] Loops `onboarding_completed` event fires with correct properties
- [ ] **Regression:** Existing org onboarding flow works identically (select "Organization" → same wizard as before)
- [ ] **Regression:** Resume/prefill logic works for both org and caregiver

---

### Step 2: Caregiver Profile Management

**Objective:** Caregiver can view and edit their profile in the provider dashboard with caregiver-relevant sections.

**Systems affected:**
- `components/provider-dashboard/DashboardPage.tsx` — Conditional card rendering by profile type
- Dashboard card components — Adapt labels/fields for caregiver
- Edit modal components — Adapt fields for caregiver
- `lib/profile-completeness.ts` — Add caregiver completeness scoring

**What changes:**
1. Dashboard renders relevant cards for caregivers (hide StaffScreening, PaymentInsurance; show certifications, experience)
2. ProfileOverviewCard: "Private Caregiver" label, person name instead of org name
3. AboutCard: Years experience instead of beds/staff/license
4. PricingCard: Hourly rate range instead of service pricing
5. Edit modals: Conditional fields matching card content
6. New EditCertificationsModal (same multi-select pattern as existing modals)
7. Profile completeness: caregiver-specific sections and scoring

**Risks/dependencies:**
- Dashboard components are well-structured — conditional rendering is straightforward
- Must match existing card/modal design patterns exactly

**Validation checklist:**
- [ ] Caregiver sees tailored dashboard with relevant sections
- [ ] All edit modals open, save, and persist correctly
- [ ] Profile completeness score calculates correctly for caregivers
- [ ] Profile switcher shows caregiver with secondary (teal) color
- [ ] `isProfileShareable()` returns correct results for caregiver profiles
- [ ] **Regression:** Organization dashboard renders identically (no visual changes)
- [ ] **Regression:** Profile switching between org/caregiver/family works

---

### Step 3: Public Profile + Discovery

**Objective:** Caregivers are discoverable — appear in browse pages and have a public profile page.

**Systems affected:**
- `app/provider/[slug]/page.tsx` — Conditional sections for caregiver profiles
- `app/browse/caregivers/page.tsx` — Remove org-only RoleGate, make public
- `components/shared/Navbar.tsx` — Role-aware nav items

**What changes:**
1. `/browse/caregivers`: Remove `RoleGate` requiring `organization` type. Make fully public.
2. `/provider/[slug]`: Conditional rendering — hide org-specific sections (staff, Q&A), show caregiver sections (certs, rate, experience)
3. Navbar: Add caregiver-specific provider hub nav items ("Find Jobs" → `/portal/discover/providers`). Add "Private Caregivers" to family "Find Care" menu.

**Risks/dependencies:**
- Navbar is 2600+ lines — changes are small conditional additions
- Public browse already works, just needs RoleGate removed
- Profile page already renders any profile type via slug lookup

**Validation checklist:**
- [ ] `/browse/caregivers` accessible without auth — shows caregiver cards
- [ ] Caregiver profile page renders correctly at `/provider/[slug]`
- [ ] Caregiver-specific sections display (certs, rate, experience)
- [ ] Org-specific sections hidden on caregiver profiles
- [ ] Navbar shows correct items per role (org vs caregiver vs family)
- [ ] **Regression:** `/browse` (main page) unchanged
- [ ] **Regression:** Organization profile pages render identically
- [ ] **Regression:** Navbar works correctly for existing roles

---

### Step 4: Connections + Inbox

**Objective:** Caregivers can receive and respond to connection requests. All connection flows work end-to-end.

**Systems affected:**
- `app/provider/inbox/page.tsx` — Expand connection type filter
- Messaging components — Dynamic copy and connection type badges
- Connection utilities — Context-aware display logic

**What changes:**
1. Inbox query: Replace `.eq("type", "inquiry")` with `.in("type", ["inquiry", "invitation", "application"])` (~6 line changes)
2. Empty state copy: Dynamic based on profile type
3. Connection type badges in conversation list ("Care Request", "Hiring Invitation", "Job Application")
4. Context-aware care request card in conversation panel

**Risks/dependencies:**
- Inbox type filter expansion could surface unexpected connections → only expand to known types
- Messaging system is profile-type-agnostic → should work without changes

**Validation checklist:**
- [ ] Family can send inquiry to caregiver
- [ ] Caregiver receives connection in inbox
- [ ] Caregiver can respond and send messages
- [ ] Organization can "Invite to Apply" a caregiver
- [ ] Connection type labels display correctly
- [ ] Email notifications fire for both parties
- [ ] **Regression:** Family→org inquiry flow unchanged
- [ ] **Regression:** Existing connections/messages still display correctly
- [ ] **Regression:** Archive/report/delete actions work

---

### Step 5: Cleanup + Polish

**Objective:** Consolidate duplicated components, verify end-to-end quality, final staging validation.

**Systems affected:**
- Extract inline `CaregiverCard` from browse/discover pages to shared component
- Extract inline `OrgJobCard` and `FamilyCard` similarly (if time permits)
- Final cross-browser and mobile verification

**What changes:**
1. Extract `CaregiverCard` to `components/shared/CaregiverCard.tsx`
2. Update `/app/browse/caregivers/page.tsx` and `/app/portal/discover/caregivers/page.tsx` to use shared component
3. Same for `OrgJobCard` and `FamilyCard` if applicable
4. Final visual review of all new/modified pages
5. Update `SCRATCHPAD.md` with complete session log

**Validation checklist:**
- [ ] All browse/discover pages render identically after component extraction
- [ ] No duplicate component definitions remain
- [ ] Full end-to-end journey works: caregiver signup → profile → browse → connection → messaging
- [ ] All regression flows verified one final time
- [ ] SCRATCHPAD.md updated with complete project log

---

## 5. Execution Tracking Framework

### Live Tracking

A running todo list maintained throughout implementation. Shows current step, completed steps, and remaining work in real-time.

### Step Completion Gates

Before moving to the next step, a completion summary is posted for confirmation:

```
Step N Complete: [title]
- What was done: [1-2 sentences]
- Files changed: [list]
- What was validated: [checklist items verified]
- Anything deferred: [if applicable]
→ Ready to proceed to Step N+1: [title]
```

No step advances without explicit confirmation.

### Debugging Detour Recovery

When debugging pulls focus away from the current step:

1. Acknowledge the detour — note what broke
2. Fix as a sub-task, not a replacement
3. Post recovery checkpoint — "Detour resolved. Returning to Step N. Remaining: [specifics]"
4. Resume exactly where we left off

### Scratchpad Persistence

After each major step or session end, `SCRATCHPAD.md` is updated with:
- Branch name and commits
- Steps complete / in progress / remaining
- Debugging detours and resolutions
- Decisions made
- What to pick up next

---

## 6. UI Consistency Safeguards

### Design System Alignment

Every new UI element follows established patterns:

| Element | Pattern | Source |
|---------|---------|--------|
| Typography | `font-display` (serif) for headings, sans for body | Consistent across site |
| Colors by role | Organization = `primary-*`, Caregiver = `secondary-*`, Family = `warm-*` | `ProfileSwitcher`, `ProfileCard` |
| Spacing | `space-y-5` sections, `gap-3` grids, `px-4 py-3` inputs | Onboarding wizard, portal pages |
| Cards | `rounded-2xl`, `border-2`, lift on hover | `PostAuthOnboarding`, browse cards |
| Inputs | `Input` component, `rounded-xl` | Shared UI component |
| Buttons | `Button` component with `loading`/`disabled` states | Shared UI component |

### Component Reuse Priority

| Need | Reuse | File |
|------|-------|------|
| Form inputs | `Input` | `components/ui/Input.tsx` |
| Buttons | `Button` | `components/ui/Button.tsx` |
| Wizard navigation | `WizardNav` | `components/ui/WizardNav.tsx` |
| Care type pills | Toggle pill pattern | Onboarding wizard |
| Error banners | `bg-red-50 text-red-700` | Admin pages |
| Loading spinners | `border-primary-600 animate-spin` | Throughout app |
| Profile cards | `ProfileCard` | `components/shared/ProfileCard.tsx` |
| Role gating | `RoleGate` | `components/shared/RoleGate.tsx` |
| Empty states | `EmptyState` pattern | Discover pages |

### Quality Rules

- No placeholder or prototype UI ships — every element is production-quality before commit
- No `TODO` comments for "style later"
- No missing hover/focus/disabled/loading states
- Every new UI block pattern-matched against its closest existing equivalent before writing
- No inline styles — everything uses existing Tailwind classes from the design system

---

## 7. Regression Prevention

### Critical Flows That Must Remain Stable

| Flow | Protection |
|------|-----------|
| Homepage + navigation | Zero files touched |
| `/browse` (provider search) | Zero changes to this page |
| Provider pages (`/provider/[slug]`) | Additive conditional sections only — existing org rendering untouched |
| Authentication (OAuth + OTP) | Zero changes to auth modal, provider, or middleware |
| Organization onboarding | Same file modified, but all caregiver logic behind `providerType === "caregiver"` guard. Org flow is the untouched `else` branch |
| Messaging / connections | Inbox filter expanded additively. Existing `inquiry` type still works. Thread/archive/report unchanged |
| Portal routing | Zero changes to portal layout or middleware |
| Admin dashboard | Zero changes |

### Verification Process

After each step, the relevant regression items from the validation checklist are verified. Before final merge, all critical flows are tested end-to-end on staging.

---

## 8. Merge Strategy

### Commit Discipline

- One concern per commit
- No reformatting, renaming, or reorganizing untouched code
- No "while I'm here" improvements
- Each commit independently reviewable

### Conflict Minimization

| Area | Conflict Risk | Reason |
|------|--------------|--------|
| `/provider/onboarding/page.tsx` | Low-Medium | Large file, but changes additive behind type guard |
| `components/shared/CaregiverCard.tsx` | None | New file |
| Dashboard components | Low | Conditional additions only |
| API routes | None | No changes planned |
| Middleware, auth, layout | None | No changes planned |

### Staging Sync

Before beginning each new step, check if staging has diverged. If so, merge staging into our branch (merge, not rebase — preserves history). This surfaces conflicts early.

### Feature Isolation

No feature flags needed. The caregiver flow is naturally gated:
- Only reachable when user selects "Private Caregiver" in type selector
- Browse pages query `type='caregiver'` — show empty state if none exist
- All existing routes already deployed
- Rollback is trivial — restore "Coming Soon" conditional

If controlled launch is desired, a `NEXT_PUBLIC_CAREGIVER_ENABLED` env var can gate the type selector.

### Pre-Merge Checklist

**Critical path tests:**
- [ ] Family signup → browse → send inquiry → confirmation email
- [ ] Organization onboarding → complete wizard → appears in browse
- [ ] Existing connections load in inbox
- [ ] Messages send/receive between existing profiles
- [ ] Profile switching works (family ↔ org ↔ caregiver)
- [ ] Auth flow (Google OAuth + email OTP) end-to-end
- [ ] Admin dashboard loads, approve/reject works

**New caregiver tests:**
- [ ] Caregiver signup → wizard → profile created
- [ ] Caregiver in `/browse/caregivers`
- [ ] Caregiver card renders with correct metadata
- [ ] Connection to caregiver works
- [ ] Caregiver inbox shows received connections

**Visual regression:**
- [ ] Homepage renders correctly
- [ ] Navbar correct for all roles
- [ ] `/browse` page correct
- [ ] Provider detail pages correct

---

## 9. Risks and Unknowns

| Risk | Severity | Mitigation |
|------|----------|------------|
| Onboarding page is 2000+ lines | Medium | Changes are additive conditional branches, not restructuring |
| Navbar is 2600+ lines | Low | Small conditional additions (2-3 nav items) |
| Metadata typing is runtime-only | Low | TypeScript interfaces already defined. Same approach as org metadata |
| Inbox type filter expansion could surface unexpected connections | Low | Only expand to known types (`invitation`, `application`) |
| Public caregiver browse could expose PII | Low | Same pattern as org browse — only public-safe fields |
| Provider dashboard cards tightly coupled to org assumptions | Medium | Audit each card's data assumptions before modifying |
| Messaging components may have hardcoded org-specific copy | Low | Review and make dynamic where needed |
| Staging may diverge during development | Low | Periodic merge-from-staging sync |

---

## 10. Files Summary

| Step | File | Change Type |
|------|------|-------------|
| 1 | `app/provider/onboarding/page.tsx` | Modify (replace Coming Soon with caregiver steps) |
| 1 | `app/api/auth/create-profile/route.ts` | Modify (accept caregiver metadata) |
| 2 | `components/provider-dashboard/DashboardPage.tsx` | Modify (conditional card rendering) |
| 2 | `components/provider-dashboard/*Card.tsx` | Modify (4 cards — caregiver labels/fields) |
| 2 | `components/provider-dashboard/edit-modals/*` | Modify (4 modals) + New (1 certifications modal) |
| 2 | `lib/profile-completeness.ts` | Modify (add caregiver scoring) |
| 3 | `app/provider/[slug]/page.tsx` | Modify (conditional sections) |
| 3 | `app/browse/caregivers/page.tsx` | Modify (remove RoleGate) |
| 3 | `components/shared/Navbar.tsx` | Modify (role-aware nav items) |
| 4 | `app/provider/inbox/page.tsx` | Modify (~6 lines: expand type filter) |
| 4 | Messaging components | Modify (dynamic copy + badges) |
| 5 | `components/shared/CaregiverCard.tsx` | New (extracted from inline duplicates) |
| 5 | Browse/discover pages | Modify (use shared component) |

**New files: 2** (CaregiverCard, EditCertificationsModal). **Modified files: ~17.** **Deleted files: 0.**

---

## 11. Discovery Surface Architecture

### Current State

| Route | Access | Purpose |
|-------|--------|---------|
| `/browse` | Public | Search providers (orgs) — existing |
| `/browse/caregivers` | Org-only (RoleGate) | Orgs browse caregivers |
| `/portal/discover/caregivers` | Org (component check) | Orgs browse + invite caregivers |
| `/portal/discover/providers` | Caregiver (component check) | Caregivers find orgs/jobs |
| `/portal/discover/families` | Org + Caregiver (component check) | Providers find families |

### MVP Target

| Route | Access | Purpose | Change |
|-------|--------|---------|--------|
| `/browse` | Public | Search providers (orgs) | None |
| `/browse/caregivers` | **Public** | Browse caregiver profiles | Remove RoleGate |
| `/portal/discover/caregivers` | Org | Browse + invite caregivers | None (keep) |
| `/portal/discover/providers` | Caregiver | Find job opportunities | None (keep) |
| `/portal/discover/families` | Org + Caregiver | Find families seeking care | None (keep) |

### Navbar Changes per Role

**Organizations** — add "Find Caregivers" link to provider hub nav
**Caregivers** — show "Find Jobs" instead of org-specific items (Leads, Q&A)
**Families** — add "Private Caregivers" to "Find Care" mega-menu

---

## 12. Data Fields

All caregiver fields fit in existing schema — no migrations required.

| Field | Storage | Schema Change? |
|-------|---------|----------------|
| `display_name`, `description`, `city`, `state`, `zip` | Top-level columns | No — exist |
| `phone`, `email`, `care_types`, `image_url` | Top-level columns | No — exist |
| `category` | Top-level column | No — set to `"private_caregiver"` |
| `hourly_rate_min`, `hourly_rate_max` | `metadata` JSONB | No — type defined |
| `certifications` | `metadata` JSONB | No — type defined |
| `years_experience` | `metadata` JSONB | No — type defined |
| `languages` | `metadata` JSONB | No — type defined |
| `availability` | `metadata` JSONB | No — type defined |
