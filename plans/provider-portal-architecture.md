# Provider Portal: Architecture Plan

## 1. Core Abstractions & Data Model

### The Profile Abstraction

The central object in the system is a **Profile**. Every entity — organization, facility, private caregiver, and family — is a profile. This is the key unifying abstraction.

```
Profile
├── id (uuid)
├── slug (unique, URL-friendly)
├── type: "organization" | "facility" | "caregiver" | "family"
├── category (nullable): specific subtype
├── name / display_name
├── description
├── image_url
├── contact info (phone, email, website)
├── location (address, lat/lng, service_area)
├── claim_state: "unclaimed" | "pending" | "claimed"
├── verification_state: "unverified" | "pending" | "verified"
├── source: "seeded" | "user_created"
├── created_at / updated_at
└── owner_id (nullable → FK to auth.users, null when unclaimed)
```

**Why one Profile table?** Every marketplace interaction (discovery, connection, messaging) operates on profiles. A single polymorphic profile table means the connection system, search index, and review system all target one entity type. The `type` + `category` fields control what fields are relevant and what UI is shown.

### Provider Categories

```
Organizations (seeded + claimable):
  Home-based:
    - home_care_agency
    - home_health_agency
    - hospice_agency
  Facility-based:
    - independent_living
    - assisted_living
    - memory_care
    - nursing_home
    - inpatient_hospice
    - rehab_facility
    - adult_day_care
    - wellness_center

Caregivers (never seeded):
    - private_caregiver
```

### Claim & Verification (two separate state machines)

These are intentionally decoupled:

```
Claim State:          unclaimed → pending → claimed
Verification State:   unverified → pending → verified
```

A profile can be **claimed but unverified** (owner has taken control but hasn't proven identity). A seeded profile starts as **unclaimed + unverified**. A user-created profile starts as **claimed + unverified**.

### Connection Model

```
Connection
├── id
├── from_profile_id (FK → Profile)
├── to_profile_id (FK → Profile)
├── type: "inquiry" | "save" | "application" | "invitation"
├── status: "pending" | "accepted" | "declined" | "archived"
├── message (optional)
├── created_at
```

Symmetric by design — either side can initiate. The `type` field distinguishes intent:
- **inquiry**: family → provider ("I'm interested")
- **save**: family bookmarks a provider (or vice versa)
- **application**: caregiver → organization ("I want to work here")
- **invitation**: organization → caregiver ("We'd like you to apply")

### Review Model

```
Review
├── id
├── profile_id (FK → Profile, the one being reviewed)
├── author_profile_id (FK → Profile)
├── rating (1-5)
├── body (text)
├── status: "published" | "flagged" | "removed"
├── created_at
```

---

## 2. Route Structure

### Public Routes (unauthenticated)

```
/                             → Homepage (family-facing, existing)
/provider/[slug]              → Public provider profile (existing, extend)
/for-providers                → Provider landing page (value prop, CTA)
/for-providers/claim          → Claim flow: search for your organization
/for-providers/create         → Create flow: choose type → fill profile
/for-providers/claim/[slug]   → Claim a specific unclaimed profile
```

### Authenticated Portal Routes

```
/portal                       → Dashboard (role-aware)
/portal/profile               → Edit profile
/portal/connections           → Inbound inquiries, saved families
/portal/reviews               → Manage reviews
/portal/hiring                → (org only) Browse caregivers, invitations
/portal/applications          → (caregiver only) Track applications
/portal/settings              → Account settings
```

### Auth Routes

```
/auth/login                   → Login (with ?redirect support)
/auth/signup                  → Signup (with ?type=provider|family|caregiver)
```

### Key Routing Decisions

- `/for-providers` is the **unauthenticated** marketing/entry point (public, SEO-indexed)
- `/portal` is the **authenticated** management area (protected by middleware)
- `/provider/[slug]` remains the public profile page — shows different CTAs by viewer context

---

## 3. Component Architecture

### File Structure

```
app/
├── layout.tsx                    → Root layout (existing)
├── for-providers/
│   ├── layout.tsx                → Inherits root, no sidebar
│   ├── page.tsx                  → Landing page
│   ├── claim/
│   │   ├── page.tsx              → Search/claim flow
│   │   └── [slug]/page.tsx       → Claim specific profile
│   └── create/
│       └── page.tsx              → Create new profile (multi-step)
├── portal/
│   ├── layout.tsx                → Authenticated: sidebar nav + content
│   ├── page.tsx                  → Dashboard overview
│   ├── profile/page.tsx
│   ├── connections/page.tsx
│   ├── reviews/page.tsx
│   ├── hiring/page.tsx
│   ├── applications/page.tsx
│   └── settings/page.tsx

components/
├── providers/ProviderCard.tsx    → Existing (keep)
├── shared/Navbar.tsx             → Existing (extend with auth state)
├── shared/Footer.tsx             → Existing (keep)
├── portal/
│   ├── PortalSidebar.tsx         → Role-aware sidebar nav
│   ├── ProfileForm.tsx           → Profile editing (adapts by type)
│   ├── ClaimSearch.tsx           → Search unclaimed profiles
│   ├── ConnectionCard.tsx        → Display a connection
│   └── StatCard.tsx              → Dashboard metric card
├── forms/
│   ├── MultiStepForm.tsx         → Multi-step form wrapper
│   └── FormField.tsx             → Consistent form field styling
└── ui/
    ├── Badge.tsx                 → Status badges
    ├── Modal.tsx                 → Confirmation dialogs
    └── EmptyState.tsx            → "No data yet" placeholders
```

### Role-Aware Rendering Pattern

Single pages that conditionally render by role:

```tsx
const profile = await getMyProfile();

return (
  <Dashboard>
    <StatCards profile={profile} />
    <RecentConnections profile={profile} />
    {profile.type === "organization" && <RecentApplicants />}
    {profile.type === "caregiver" && <ApplicationStatus />}
  </Dashboard>
);
```

---

## 4. Edge Cases & Pitfalls

### Profile Ownership Conflicts
Multiple people may try to claim the same organization. V1: first-come-first-served with email verification to the organization's public contact. V2: dispute resolution flow.

### Seeded Data Quality
Seeded profiles will have incomplete data. Use progressive disclosure — show what exists, hide empty sections, display "Claim this profile to add more details" CTA on unclaimed profiles.

### Caregiver Visibility
A private caregiver hired by an agency may want to hide their independent profile. V1: simple `is_active` boolean. V2: granular visibility (`public` | `hidden` | `agency_only`).

### Profile Type Immutability
Once created, a profile's `type` cannot change. Category can be updated (e.g., facility adds memory care).

### Connection Spam
V1: simple daily outbound limit (e.g., 10/day) enforced at API layer.

### SEO for Seeded Profiles
Unclaimed profiles must be indexable but clearly labeled: "Unclaimed profile — information may be outdated."

---

## 5. V1 Scope

### In Scope
- `/for-providers` landing page with value proposition
- Claim flow (search → claim → basic verification)
- Create flow (caregiver profile creation)
- `/portal` dashboard with profile editing
- Basic connection model (inquiry: families contact providers)
- Public profiles showing claim/verification state

### Deferred to V2
- Full bidirectional messaging
- Hiring marketplace (org ↔ caregiver)
- Review management system
- Advanced verification (license lookup, NPI)
- Claim disputes
- Analytics dashboard
- Notification system (email/SMS)

---

## 6. Mental Model

```
┌─────────────────────────────────────────────────────┐
│                    PROFILES                          │
│  (The universal entity — everything is a profile)   │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │  Family   │  │   Org    │  │ Caregiver│         │
│  │ Profile   │  │ Profile  │  │ Profile  │         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
│       │              │              │                │
│       └──────┬───────┴──────┬───────┘                │
│              │              │                        │
│       CONNECTIONS     CONNECTIONS                    │
│     (inquiry, save)  (apply, invite)                │
│                                                     │
│  Claim State:  unclaimed → pending → claimed         │
│  Verify State: unverified → pending → verified       │
│  Source:       seeded | user_created                 │
└─────────────────────────────────────────────────────┘
```

### Why It Feels Simple

1. **One profile type** with role-based field visibility (not 3 separate models)
2. **One connection model** with type discrimination (not separate tables)
3. **Claim + verification as orthogonal state machines** (not tangled)
4. **Role-aware rendering** on shared routes (not duplicated pages)
