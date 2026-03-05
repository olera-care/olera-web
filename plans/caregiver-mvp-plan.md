# Caregiver MVP Implementation Plan

> Updated 2026-03-05 — First-principles approach optimizing for smooth UX and stability.

---

## Guiding Principles

1. **Extend, don't fork.** Reuse existing onboarding, inbox, and profile infrastructure. No parallel systems.
2. **Metadata-only data changes.** All new caregiver fields go into the existing JSONB `metadata` column — zero schema migrations.
3. **Role-aware, not role-duplicated.** One inbox, one dashboard, one connection system — with role-appropriate copy and behavior.
4. **MVP = demo-ready.** A caregiver can sign up, fill out a profile, appear in discovery, and receive messages. Nothing more.

---

## 1. Discovery Surface Architecture

### Current State (Confusing)

| Route | Shell | Role Gate | Purpose |
|-------|-------|-----------|---------|
| `/browse/caregivers` | Public site | `RoleGate: organization` | Orgs browse caregivers |
| `/portal/discover/caregivers` | Portal | `isOrg` check | Orgs browse caregivers (duplicate) |
| `/portal/discover/providers` | Portal | `isCaregiver` check | Caregivers find orgs/jobs |
| `/portal/discover/families` | Portal | `isProvider` (org or caregiver) | Providers find families |
| `/browse/providers` | Public site | None | Public provider search (SEO) |
| `/browse/families` | Public site | None | Unknown usage |

**Problems:**
- `/browse/caregivers` and `/portal/discover/caregivers` are near-identical duplicates
- No public path for families to discover caregivers
- `/browse/caregivers` requires org role — wrong if families should also see caregivers
- Naming inconsistency: "browse" vs "discover"

### Proposed Model (Clean)

**Rule:** `/browse/*` = public-facing, SEO-friendly, no auth required. `/portal/discover/*` = authenticated portal views with role-gating and engagement actions.

| Route | Shell | Access | Purpose | MVP? |
|-------|-------|--------|---------|------|
| `/browse` | Public | Anyone | Search providers (orgs) — existing | Exists |
| `/browse/caregivers` | Public | Anyone | Browse caregiver profiles — public directory | **Yes** |
| `/portal/discover/caregivers` | Portal | Orgs | Browse + invite caregivers (engagement actions) | Exists (keep) |
| `/portal/discover/providers` | Portal | Caregivers | Find job opportunities at orgs | Exists (keep) |
| `/portal/discover/families` | Portal | Org + Caregiver | Find families seeking care | Exists (keep) |

### Changes Required

1. **`/browse/caregivers`** — Remove `RoleGate` requiring `organization` type. Make fully public (no auth required). Any visitor can browse caregivers. Caregivers appear with public-safe info (name, city, care types, certifications). Contact requires auth.

2. **`/portal/discover/caregivers`** — Keep as org-only portal view with "Invite to Apply" actions. This is the *authenticated engagement* version.

3. **No new routes needed for MVP.** Families discover caregivers via `/browse/caregivers` (public). Orgs discover caregivers via either path. Caregivers discover orgs via `/portal/discover/providers`.

4. **Defer:** City pages with caregivers, homepage integration — post-MVP polish.

### Portal Left-Nav (Navbar) per Role

The app uses a **smart Navbar** (not a sidebar). Current nav items by context:

**Provider Hub (org or caregiver on `/provider/*`):**
```
Desktop: Dashboard | Inbox | Leads | Q&A | Reviews | Matches
Mobile:  My Hub accordion → Dashboard, Inbox, Leads, Q&A, Matches, Reviews
```

**Proposed changes for MVP:**

For **organizations** — add "Find Caregivers" link:
- Desktop center nav: `Dashboard | Inbox | Leads | Q&A | Reviews | Find Caregivers`
- Links to `/portal/discover/caregivers`

For **caregivers** — replace irrelevant items:
- Desktop center nav: `Dashboard | Inbox | Find Jobs | Matches`
- "Find Jobs" links to `/portal/discover/providers`
- Remove Q&A and Leads (not relevant for individual caregivers in MVP)
- Reviews stays if caregiver has a public profile

For **families** — add "Find Caregivers" alongside existing "Find Care":
- In the "Find Care" mega-menu, add a "Private Caregivers" link → `/browse/caregivers`

**Implementation:** The Navbar (`components/shared/Navbar.tsx`) already checks `isProviderPortal` and profile type. We add a `isCaregiver` vs `isOrg` branch for the provider hub nav items.

---

## 2. Caregiver Onboarding (Branch Within Existing Wizard)

### Current State

- `/provider/onboarding/page.tsx` — single-file wizard with step type: `"resume" | 1 | "caregiver-coming-soon" | "search" | "verify" | 2 | 3 | 4 | 5`
- Step 1: Choose type (Organization / Private Caregiver)
- Clicking "Private Caregiver" → `setStep("caregiver-coming-soon")` → shows "Coming Soon" + notify form
- Steps 2-5 (org only): About → Location → Contact → Services + Submit
- Submit calls `POST /api/auth/create-profile` which **already handles `providerType: "caregiver"`** — creates a `type: "caregiver"` profile

### Proposed Changes

**Replace `"caregiver-coming-soon"` with actual caregiver steps.**

New step flow when `providerType === "caregiver"`:

| Step | Content | Fields Collected |
|------|---------|------------------|
| 1 | Choose type | `providerType: "caregiver"` (existing) |
| 2 | About you | `displayName` (full name), `description` (brief bio) |
| 3 | Location | `city`, `state`, `zip` (reuse existing Step 3 — identical) |
| 4 | Contact | `phone`, `email` (reuse existing Step 4 — minus website) |
| 5 | Experience + Submit | `careTypes` (multi-select), `years_experience`, `certifications` (multi-select), `hourly_rate_min/max` (optional) |

**What changes in the code:**

1. **`handleStep1Next()`** (line 417): Change `else` branch from `setStep("caregiver-coming-soon")` to `setStep(2)`. This is a one-line change.

2. **Step 2 heading/labels**: When `providerType === "caregiver"`, show "Tell us about yourself" instead of "Tell us about your organization". The `displayName` input becomes "Your full name" with placeholder "e.g. Maria Johnson". Hide the org category dropdown (already conditional on `providerType === "organization"`).

3. **Steps 3-4**: Reuse as-is. Copy adapts: "Families search by location" works for both. Step 4 can hide "Website" for caregivers.

4. **Step 5**: When `providerType === "caregiver"`, show caregiver-specific fields instead of org services:
   - Care types multi-select (reuse existing `CARE_TYPES` list + `toggleCareType`)
   - Years of experience (number input) → stored in `metadata.years_experience`
   - Certifications multi-select (CNA, HHA, CPR, First Aid, etc.) → stored in `metadata.certifications`
   - Hourly rate range (optional, two number inputs) → stored in `metadata.hourly_rate_min/max`

5. **Submit handler** (`handleSubmit`, ~line 690): Already passes `providerType` to `/api/auth/create-profile`. Add caregiver metadata fields to the request body. Update the API route to store them in the `metadata` JSONB.

6. **Remove** the `"caregiver-coming-soon"` step entirely. Remove `caregiverEmail`, `caregiverNotified`, `caregiverNotifying` state. Remove the Coming Soon UI block.

7. **`handleResume()`** (line 458): Change the caregiver branch from `setStep("caregiver-coming-soon")` to resume at the saved step (same logic as org flow).

8. **WizardNav**: Update step labels. Org: "Type → About → Location → Contact → Services". Caregiver: "Type → About → Location → Contact → Experience".

### API Changes

**`POST /api/auth/create-profile`** (already handles caregiver):
- Add new body fields: `yearsExperience`, `certifications`, `hourlyRateMin`, `hourlyRateMax`
- When `providerType === "caregiver"`, merge into metadata:
  ```typescript
  metadata: {
    visible_to_families: true,
    visible_to_providers: true,
    years_experience: yearsExperience,
    certifications: certifications,
    hourly_rate_min: hourlyRateMin,
    hourly_rate_max: hourlyRateMax,
  }
  ```
- Category auto-set to `"private_caregiver"` for caregivers

**No schema migration needed.** The `metadata` column is freeform JSONB. The `CaregiverMetadata` TypeScript interface already defines these fields.

---

## 3. Caregiver Dashboard (Adapt Existing Provider Dashboard)

### Current State

- `components/provider-dashboard/DashboardPage.tsx` renders 7 section cards
- `useProviderProfile()` returns first profile where `type === "organization" || type === "caregiver"` — already works for caregivers
- All cards reference `profile` and `metadata` (cast as `ExtendedMetadata`)

### Proposed Changes

The dashboard already loads for caregivers (the layout gate passes both types). We need to **adapt the section cards** to show caregiver-relevant content.

**Cards to keep (with adapted content):**

| Card | Org Version | Caregiver Version |
|------|-------------|-------------------|
| ProfileOverviewCard | Org name, category, address, contact | Full name, "Private Caregiver", city, contact |
| AboutCard | Description + founded/beds/staff/license | Bio + years experience |
| GalleryCard | Facility photos | Profile photo(s) |
| PricingCard | Price range + service breakdown | Hourly rate range |

**Cards to hide for caregivers (MVP):**

| Card | Reason |
|------|--------|
| StaffScreeningCard | Not relevant for individuals |
| PaymentInsuranceCard | Not relevant for individuals |

**Cards to add for caregivers (MVP):**

| Card | Content |
|------|---------|
| CertificationsCard (new) | List of certifications (CNA, HHA, etc.) |
| AvailabilityCard (new or reuse CareServicesCard) | Care types offered + availability |

**Implementation approach:**

1. In `DashboardPage.tsx`, check `profile.type` and conditionally render the appropriate set of cards.
2. Create minimal new card components or adapt existing ones with conditional rendering.
3. Update `EditOverviewModal` to show "Your name" instead of "Organization name" for caregivers.
4. Update `EditAboutModal` to show years_experience instead of founded/beds/staff/license for caregivers.
5. Update `EditPricingModal` to show hourly rate inputs instead of service pricing for caregivers.
6. Reuse `EditCareServicesModal` — care types work the same way.

**Profile completeness scoring** (`lib/profile-completeness.ts`):
- Add a `computeCaregiverCompleteness()` function alongside the existing org one
- Sections: Overview (name, city, image), About (bio, experience), Services (care types), Rate (hourly range), Certifications
- The main `computeCompleteness()` dispatches based on `profile.type`

### Edit Modals

Reuse existing modal infrastructure. Each modal already receives `profile` and `metadata`. For fields that differ:

- `EditOverviewModal`: Conditional labels (name, hide category for caregiver)
- `EditAboutModal`: Conditional fields (years_experience vs bed_count/staff_count)
- `EditPricingModal`: Conditional fields (hourly rate vs service breakdown)
- New `EditCertificationsModal`: Simple multi-select (same pattern as `EditStaffScreeningModal`)

All saves go through `saveProfile()` which handles both `topLevelFields` and `metadataFields` — no changes needed.

---

## 4. Public Caregiver Profile Page

### Current State

- `/provider/[slug]/page.tsx` — server component, fetches by slug, renders full public profile
- Works for any profile type (the slug lookup doesn't filter by type)
- Already linked from discover pages: `href={/provider/${caregiver.slug}}`

### Proposed Changes

The existing `/provider/[slug]` route **already works** for caregiver profiles. We need to:

1. **Conditionally render sections** based on `profile.type`:
   - Hide: Staff screening, payment/insurance, Q&A (org-specific)
   - Show: Certifications, hourly rate, years experience, availability
   - Keep: About, care services, gallery, connection card, reviews

2. **Adapt the header/hero**: Show person-style layout (circular avatar) vs facility-style (gallery)

3. **Connection card**: Already works — creates a connection. Copy should say "Request Care" for families, "Invite to Apply" for orgs.

**No new route needed.** `/provider/[slug]` serves both org and caregiver profiles.

---

## 5. Inbox & Connections (Extend, Don't Fork)

### Current State

- **Schema supports all connection types already:**
  ```typescript
  ConnectionType = "inquiry" | "save" | "match" | "request" | "application" | "invitation" | "dismiss"
  ```
- **Inbox is hardcoded to `type = "inquiry"`** in 6+ places in `/app/provider/inbox/page.tsx`
- **Copy assumes family→provider**: "When families connect with you, their messages will appear here"
- **Messaging components are type-agnostic**: `ConversationList`, `ConversationPanel`, `ProviderDetailPanel` work with any profile pair
- **Connection creation API** (`/api/connections/request/route.ts`) accepts any profile IDs

### Supported Connection Flows (MVP)

| From | To | Connection Type | Action Label | Already Works? |
|------|----|----------------|--------------|----------------|
| Family → Organization | `inquiry` | "Request Care" | Yes (existing) |
| Family → Caregiver | `inquiry` | "Request Care" | Yes (no code change needed) |
| Organization → Caregiver | `invitation` | "Invite to Apply" | Partially (ConnectButton exists, inbox won't show it) |
| Caregiver → Organization | `application` | "Apply" | Partially (ConnectButton exists, inbox won't show it) |

### Changes Required

1. **Inbox query filter** — Replace `.eq("type", "inquiry")` with `.in("type", ["inquiry", "invitation", "application"])` in both provider and portal inbox pages. This is the critical fix — ~6 line changes.

2. **Empty state copy** — Make dynamic based on profile type:
   - Org: "When families and caregivers connect with you, their messages will appear here"
   - Caregiver: "When families and organizations reach out, their messages will appear here"
   - Family: "Browse providers and caregivers to start a conversation"

3. **Connection type badges** — Show contextual label in conversation list:
   - `inquiry` → "Care Request"
   - `invitation` → "Hiring Invitation"
   - `application` → "Job Application"

4. **No new inbox page.** Caregivers use `/provider/inbox` (same as orgs). The provider layout already allows `type === "caregiver"`.

5. **Care request card in ConversationPanel** — Currently renders family care needs. For org→caregiver `invitation` type, render "Hiring inquiry" with org details instead. For caregiver→org `application`, render caregiver summary.

### What Requires No Changes

- Thread/message system (profile-type agnostic)
- Archive/report/delete actions
- Real-time updates
- `ConnectButton` component (already accepts `connectionType` prop)
- Connection creation API

---

## 6. Data Fields & Schema Assessment

### All Fields — No Schema Migration Required

Every proposed caregiver field fits in the existing `metadata` JSONB column. The `CaregiverMetadata` TypeScript interface already defines the types.

| Field | Storage | Type | Schema Change? | Status |
|-------|---------|------|----------------|--------|
| `display_name` | Top-level column | `text` | No | Exists |
| `description` (bio) | Top-level column | `text` | No | Exists |
| `city`, `state`, `zip` | Top-level columns | `text` | No | Exists |
| `phone`, `email` | Top-level columns | `text` | No | Exists |
| `care_types` | Top-level column | `text[]` | No | Exists |
| `image_url` | Top-level column | `text` | No | Exists |
| `category` | Top-level column | `text` | No | Set to `"private_caregiver"` |
| `hourly_rate_min` | `metadata` JSONB | `number` | No | Type defined, unused |
| `hourly_rate_max` | `metadata` JSONB | `number` | No | Type defined, unused |
| `certifications` | `metadata` JSONB | `string[]` | No | Type defined, unused |
| `years_experience` | `metadata` JSONB | `number` | No | Type defined, unused |
| `languages` | `metadata` JSONB | `string[]` | No | Type defined, unused |
| `availability` | `metadata` JSONB | `string` | No | Type defined, unused |

### What's Blocked Without Schema Changes

**Nothing is blocked for MVP.** All fields exist or fit in metadata.

### Future Schema Considerations (Post-MVP)

- If caregiver search needs to filter by `hourly_rate_min` efficiently → consider promoting to a top-level column or adding a GIN index path
- If we want caregiver-specific RLS policies → may need a view or policy update
- Background check verification status → could add `background_check_state` column later

---

## 7. Implementation Sequence

### Phase 1: Onboarding (Unblock caregiver creation)

**Files changed:**
- `app/provider/onboarding/page.tsx` — Replace Coming Soon with caregiver steps
- `app/api/auth/create-profile/route.ts` — Accept + store caregiver metadata fields

**Result:** A user can select "Private Caregiver", complete the wizard, and have a caregiver profile created.

### Phase 2: Dashboard (Caregiver can manage their profile)

**Files changed:**
- `components/provider-dashboard/DashboardPage.tsx` — Conditional card rendering
- `components/provider-dashboard/*Card.tsx` — Adapt 4 existing cards for caregiver fields
- `components/provider-dashboard/edit-modals/` — Adapt 4 existing modals + 1 new certifications modal
- `lib/profile-completeness.ts` — Add caregiver completeness scoring

**Result:** Caregiver sees a tailored dashboard with relevant sections and can edit their profile.

### Phase 3: Public Profile + Discovery (Caregiver is findable)

**Files changed:**
- `app/provider/[slug]/page.tsx` — Conditional sections for caregiver profiles
- `app/browse/caregivers/page.tsx` — Remove org-only RoleGate, make public
- `components/shared/Navbar.tsx` — Add caregiver-specific nav items

**Result:** Caregivers appear in public browse. Families can find them. Profile pages render correctly.

### Phase 4: Connections + Inbox (Caregiver can communicate)

**Files changed:**
- `app/provider/inbox/page.tsx` — Expand connection type filter
- `components/messaging/ConversationList.tsx` — Dynamic copy + connection type badges
- `components/messaging/ConversationPanel.tsx` — Context-aware care request card

**Result:** All connection flows work. One unified inbox for all roles.

---

## 8. Files Summary

| Phase | File | Change Type |
|-------|------|-------------|
| 1 | `app/provider/onboarding/page.tsx` | Modify (replace Coming Soon with caregiver steps) |
| 1 | `app/api/auth/create-profile/route.ts` | Modify (accept caregiver metadata) |
| 2 | `components/provider-dashboard/DashboardPage.tsx` | Modify (conditional card rendering) |
| 2 | `components/provider-dashboard/ProfileOverviewCard.tsx` | Modify (caregiver labels) |
| 2 | `components/provider-dashboard/AboutCard.tsx` | Modify (experience vs beds/staff) |
| 2 | `components/provider-dashboard/PricingCard.tsx` | Modify (hourly rate vs service pricing) |
| 2 | `components/provider-dashboard/CareServicesCard.tsx` | Modify (shared, minimal changes) |
| 2 | `components/provider-dashboard/edit-modals/EditOverviewModal.tsx` | Modify (conditional labels) |
| 2 | `components/provider-dashboard/edit-modals/EditAboutModal.tsx` | Modify (caregiver fields) |
| 2 | `components/provider-dashboard/edit-modals/EditPricingModal.tsx` | Modify (hourly rate) |
| 2 | `components/provider-dashboard/edit-modals/EditCertificationsModal.tsx` | **New** (multi-select) |
| 2 | `lib/profile-completeness.ts` | Modify (add caregiver scoring) |
| 3 | `app/provider/[slug]/page.tsx` | Modify (conditional sections) |
| 3 | `app/browse/caregivers/page.tsx` | Modify (remove RoleGate) |
| 3 | `components/shared/Navbar.tsx` | Modify (role-aware nav items) |
| 4 | `app/provider/inbox/page.tsx` | Modify (~6 lines: expand type filter) |
| 4 | `components/messaging/ConversationList.tsx` | Modify (dynamic copy) |
| 4 | `components/messaging/ConversationPanel.tsx` | Modify (context-aware cards) |

**New files: 1** (EditCertificationsModal). **Modified files: 17.** **Deleted files: 0.**

---

## 9. What's Explicitly Deferred (Post-MVP)

| Feature | Reason |
|---------|--------|
| Homepage caregiver integration | Requires design work, not needed for demo |
| City pages with caregivers | SEO optimization, not MVP-critical |
| Caregiver-specific Q&A | Low priority for individual caregivers |
| Background check verification | Needs external integration |
| Advanced search/filter on browse pages | MVP shows simple list |
| Caregiver-to-caregiver connections | No use case identified |
| Stripe payments for caregivers | Payment system not fully live |
| `/browse/families` page cleanup | Exists but unclear purpose — leave as-is |

---

## 10. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Onboarding page is a 2000+ line single file | Changes are additive (new step branches), not restructuring. Conditional rendering within existing structure. |
| Navbar is 2600+ lines | Changes are small: add 2-3 nav items conditionally based on profile type. |
| Metadata typing is runtime-only | TypeScript interfaces already defined. No DB validation exists for org metadata either — consistent approach. |
| Inbox type filter expansion could surface unexpected connections | Only expand to known types (`invitation`, `application`). `ConnectButton` already uses these types. |
| Public caregiver browse could expose PII | Same pattern as org browse — only public-safe fields (name, city, care types). No contact details without auth. |
