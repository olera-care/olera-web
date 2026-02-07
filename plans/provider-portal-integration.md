# Provider Portal Integration Plan

> **Living Document** - Update this as decisions are made and work progresses.
>
> **Last Updated:** 2026-02-05
> **Status:** Planning
> **PR:** #21 (logan447)
> **iOS Status:** ✅ Approved (as of 2026-02-05)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State](#current-state)
3. [Goals & Non-Goals](#goals--non-goals)
4. [Architecture Decision](#architecture-decision)
5. [PR #21 File Triage](#pr-21-file-triage)
6. [Database Schema](#database-schema)
7. [Implementation Phases](#implementation-phases)
8. [Test Plan](#test-plan)
9. [Rollback Plan](#rollback-plan)
10. [Decision Log](#decision-log)
11. [Open Questions](#open-questions)

---

## Executive Summary

**What:** Integrate Logan's provider portal work (PR #21) into the main web app while preserving our existing care seeker experience and iOS Supabase integration.

**Why:** Enable providers to sign up, claim listings, and manage their profiles through a web portal.

**Risk Level:** Medium - iOS is now approved, but we still have live users on both platforms.

**Key Principle:** Additive changes only. Don't break what's working.

---

## Current State

### What We Have (Main Branch)
| Feature | Status | Notes |
|---------|--------|-------|
| Homepage | ✅ Working | Real Supabase data, city search |
| Browse Page | ✅ Working | Server-side filtering by city/state/care type |
| Provider Detail | ✅ Working | Esther's design, real Supabase data |
| City Search | ✅ Working | 18K+ cities, progressive loading |
| iOS Supabase | ✅ Connected | `olera-providers` table (39K+ records) |

### What Logan Built (PR #21)
| Feature | Status | Notes |
|---------|--------|-------|
| Unified Auth Flow | 🆕 New | AuthFlowModal - signup, login, OTP in one modal |
| OTP Verification | 🆕 New | 8-digit code entry, resend functionality |
| Provider Onboarding | 🆕 New | Collect info → auth → persist profile |
| Portal Dashboard | 🆕 New | Provider home after login |
| Profile Editing | 🆕 New | Edit org/caregiver/family profiles |
| ensure-account API | 🆕 New | Server-side account creation |
| Error Pages | 🆕 New | 404 and 500 pages |

### Supabase Tables

```
iOS Supabase (ocaabzfiiikjcgqwhbwr)
├── olera-providers     → 39K+ provider listings (iOS reads, web reads)
├── accounts            → User accounts (iOS uses?, web will use)
├── profiles            → User profiles (iOS uses?, web will use)
├── memberships         → Subscriptions (iOS uses?, web will use)
└── connections         → Inquiries/saves (iOS uses?, web will use)
```

**⚠️ Need to verify:** Do `accounts`, `profiles`, `memberships`, `connections` tables exist? What's their current schema?

---

## Goals & Non-Goals

### Goals
- ✅ Providers can sign up via web portal
- ✅ Providers can verify email with OTP
- ✅ Providers can claim existing listings
- ✅ Providers can edit their profile
- ✅ Care seekers can still browse/search (unchanged)
- ✅ iOS app continues working

### Non-Goals (This Phase)
- ❌ Family onboarding flow (defer)
- ❌ Payment/subscription flows (defer)
- ❌ Provider-to-family messaging (defer)
- ❌ Schema unification between iOS and web (defer)

---

## Architecture Decision

### Option A: Shared Tables (Recommended)
```
┌─────────────────────────────────────────────────────┐
│                   Supabase                          │
├─────────────────────────────────────────────────────┤
│  olera-providers  ←── iOS reads, Web reads          │
│  accounts         ←── iOS + Web (shared)            │
│  profiles         ←── iOS + Web (shared)            │
│  memberships      ←── iOS + Web (shared)            │
│  connections      ←── iOS + Web (shared)            │
└─────────────────────────────────────────────────────┘
```

**Pros:** Single source of truth, no duplication
**Cons:** Changes affect both platforms
**Mitigation:** Additive-only changes, thorough testing

### Option B: Separate Web Tables (Safer, More Work)
```
┌─────────────────────────────────────────────────────┐
│                   Supabase                          │
├─────────────────────────────────────────────────────┤
│  olera-providers  ←── iOS reads, Web reads          │
│  accounts         ←── iOS only                      │
│  profiles         ←── iOS only                      │
│  web_accounts     ←── Web only                      │
│  web_profiles     ←── Web only                      │
└─────────────────────────────────────────────────────┘
```

**Pros:** Complete isolation, zero iOS risk
**Cons:** Duplication, harder to unify later

### Decision: **Option A** (Shared Tables)
**Rationale:** iOS is approved, tables likely already exist, avoid duplication.

---

## PR #21 File Triage

### ✅ MERGE - Provider Portal Core
| File | Purpose | Risk |
|------|---------|------|
| `app/api/auth/ensure-account/route.ts` | Account creation API | Low |
| `app/error.tsx` | 500 error page | Low |
| `app/not-found.tsx` | 404 page | Low |
| `app/portal/layout.tsx` | Portal layout wrapper | Low |
| `app/portal/page.tsx` | Provider dashboard | Low |
| `app/portal/profile/page.tsx` | Profile editing | Low |
| `app/portal/calendar/page.tsx` | Activity page | Low |
| `app/portal/connections/[id]/page.tsx` | Connection detail | Low |
| `app/onboarding/page.tsx` | Onboarding flow | Medium |
| `app/for-providers/page.tsx` | Provider landing | Low |
| `app/for-providers/claim/page.tsx` | Claim search | Low |
| `app/for-providers/claim/[slug]/page.tsx` | Claim flow | Medium |
| `app/for-providers/create/page.tsx` | Create redirect | Low |

### ✅ MERGE - Auth Components
| File | Purpose | Risk |
|------|---------|------|
| `components/auth/AuthFlowModal.tsx` | Unified auth modal | Medium |
| `components/auth/AuthProvider.tsx` | Auth context updates | Medium |
| `components/auth/GlobalAuthFlowModal.tsx` | Root modal wrapper | Low |
| `components/auth/OtpInput.tsx` | OTP code input | Low |
| `components/onboarding/OrgClaimStep.tsx` | Claim step | Low |
| `components/onboarding/ProfileInfoStep.tsx` | Profile info step | Low |
| `components/providers/ProviderGetStartedButton.tsx` | CTA button | Low |

### ✅ MERGE - Utilities & UI
| File | Purpose | Risk |
|------|---------|------|
| `components/ui/Modal.tsx` | Modal bug fixes | Low |
| `components/shared/Footer.tsx` | Link fixes | Low |
| `components/shared/ProfileCard.tsx` | Profile card | Low |
| `components/shared/ProfileSwitcher.tsx` | Profile switch | Low |
| `components/shared/RoleGate.tsx` | Role gating | Low |
| `components/portal/PortalSidebar.tsx` | Sidebar updates | Low |
| `lib/membership.ts` | Membership utils | Low |
| `lib/profile-card.ts` | Card utilities | Low |
| `.env.example` | Env documentation | Low |

### ⚠️ MERGE WITH CARE - May Conflict
| File | Our Version | PR Version | Resolution |
|------|-------------|------------|------------|
| `app/page.tsx` | Working homepage | Link fixes | **Merge selectively** (keep ours, apply link fixes) |
| `app/layout.tsx` | Current layout | Adds GlobalAuthFlowModal | **Merge PR version** |
| `lib/supabase/middleware.ts` | Current | Minor change | **Review and merge** |

### ❌ SKIP - Different System / Conflicts
| File | Reason |
|------|--------|
| `app/browse/caregivers/page.tsx` | We don't have this browse variant |
| `app/browse/families/page.tsx` | We don't have this browse variant |
| `app/browse/providers/page.tsx` | We don't have this browse variant |
| `app/portal/discover/caregivers/page.tsx` | Different discovery system |
| `app/portal/discover/families/page.tsx` | Different discovery system |
| `app/portal/discover/providers/page.tsx` | Different discovery system |
| `components/browse/CaregiverBrowseView.tsx` | Different browse system |
| `components/browse/FamilyBrowseView.tsx` | Different browse system |
| `components/browse/ProviderJobBrowseView.tsx` | Different browse system |
| `components/auth/AuthModal.tsx` | Being deleted (replaced by AuthFlowModal) |

### 🔒 KEEP OURS - Critical Files
| File | Reason |
|------|--------|
| `app/browse/page.tsx` | Our working filtering (BrowsePageClient) |
| `app/browse/BrowsePageClient.tsx` | Server-side Supabase filtering |
| `app/provider/[slug]/page.tsx` | Esther's provider detail design |
| `components/browse/BrowseFilters.tsx` | Our filter component |
| `lib/us-city-search.ts` | City search service |
| `hooks/use-city-search.ts` | City search hook |

---

## Database Schema

### iOS Schema Analysis (2026-02-05)

**Existing iOS Tables:**

| Table | Purpose | Records | Key Columns |
|-------|---------|---------|-------------|
| `profiles` | User identity | 30 | id, email, full_name, avatar_url, is_admin |
| `olera-providers` | Provider listings | 39K+ | provider_id, provider_name, city, state, etc. |
| `provider_claims` | Claim workflow | 7 | user_id, provider_id, claim_status, verification_* |
| `conversations` | Chat threads | 4 | provider_id, care_seeker_user_id, match_id |
| `matches` | Care matches | ? | (not examined) |

**Schema Conflict:**
- iOS `profiles` = **user identity** (email, name, avatar)
- Logan's `profiles` = **business entities** (orgs, caregivers, families with addresses, services, etc.)

These are fundamentally different concepts with the same name!

### Reconciliation Strategy

**Approach: Create New Tables, Don't Modify iOS Tables**

```
iOS (Keep As-Is)                    Web Portal (Create New)
─────────────────                   ────────────────────────
profiles (user identity)      →     accounts (user identity for web)
olera-providers (listings)    →     (read-only, shared) ←── linked via source_provider_id
provider_claims               →     (reuse for claim workflow)
conversations                 →     connections (generic version)
```

**Why this approach:**
1. iOS app just approved - can't risk breaking it
2. Naming conflict requires either renaming (risky) or new tables (safe)
3. Can unify later when both platforms are stable

### Linking Strategy (2026-02-06)

**See:** `plans/provider-data-architecture.md` for full analysis.

**Decision:** Add `source_provider_id` to `business_profiles` to link claims to `olera-providers`.

```
┌──────────────────┐         ┌──────────────────┐
│  olera-providers │◄────────│ business_profiles │
│    (39K+ rows)   │ source_ │  (user-owned)    │
│  • Read-only     │ provider│  • Editable      │
│  • Public browse │ _id     │  • Portal view   │
└──────────────────┘         └──────────────────┘
```

**Rules:**
- Browse page → reads `olera-providers` (unchanged)
- Claiming → creates `business_profiles` row with `source_provider_id` pointing to original
- Edits → go to `business_profiles`
- Portal → shows/edits `business_profiles`

### Tables to Create

```sql
-- 1. accounts (NEW - web portal user identity)
-- Note: iOS has "profiles" for this, we use "accounts" to avoid conflict
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  active_profile_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. business_profiles (NEW - Logan's "profiles" concept, renamed to avoid conflict)
-- These are org/caregiver/family business entities, NOT user accounts
CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id),
  source_provider_id TEXT, -- Links to olera-providers.provider_id when claiming
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'organization' | 'caregiver' | 'family'
  category TEXT,
  display_name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  service_area TEXT,
  care_types TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  claim_state TEXT DEFAULT 'unclaimed', -- Links to provider_claims workflow
  verification_state TEXT DEFAULT 'unverified',
  source TEXT DEFAULT 'user_created',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. memberships (NEW - subscription/billing info)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id),
  plan TEXT DEFAULT 'free',
  billing_cycle TEXT,
  status TEXT DEFAULT 'free',
  trial_ends_at TIMESTAMPTZ,
  current_period_ends_at TIMESTAMPTZ,
  free_responses_used INTEGER DEFAULT 0,
  free_responses_reset_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. connections (NEW - generic inquiries/saves)
-- Note: iOS has "conversations" for chat, this is broader
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id UUID NOT NULL REFERENCES business_profiles(id),
  to_profile_id UUID NOT NULL REFERENCES business_profiles(id),
  type TEXT NOT NULL, -- 'inquiry' | 'save' | 'match'
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (add after table creation)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Basic RLS: users can read/write their own data
CREATE POLICY "Users can manage own account" ON accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own profiles" ON business_profiles
  FOR ALL USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own membership" ON memberships
  FOR ALL USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage own connections" ON connections
  FOR ALL USING (from_profile_id IN (SELECT id FROM business_profiles WHERE account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())));
```

### Code Changes Required

Since we renamed `profiles` → `business_profiles`, Logan's code needs updates:

| Original Reference | New Reference |
|-------------------|---------------|
| `profiles` table | `business_profiles` table |
| `profile_id` columns | Keep as-is (still refers to business_profiles) |
| Type definitions | Update `Profile` → `BusinessProfile` or add alias |

### Existing iOS Tables to Reuse

| Table | Use Case | Notes |
|-------|----------|-------|
| `provider_claims` | Claim workflow | Already has sophisticated status tracking |
| `olera-providers` | Provider listings | Read-only from web, 39K+ records |

### Future Unification (Not This Phase)

Eventually we may want to:
1. Migrate iOS `profiles` → `accounts`
2. Create unified user identity across platforms
3. Link iOS `conversations` with web `connections`

For now, keep them separate and functional.

### Environment Variables Needed

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://ocaabzfiiikjcgqwhbwr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# New (add to Vercel)
SUPABASE_SERVICE_ROLE_KEY=... # From Supabase Dashboard → Settings → API
```

---

## Implementation Phases

### Phase 1: Preparation (Database & Environment)
- [x] **1.1** ~~Verify Supabase tables exist~~ → Analyzed iOS schema (2026-02-05)
- [x] **1.2** Document schema differences → See "iOS Schema Analysis" section above
- [x] **1.3** Created SQL migration file: `supabase/migrations/001_provider_portal_tables.sql`
  - [~] `accounts` - SQL ready, needs to run in Supabase
  - [~] `business_profiles` - SQL ready, needs to run in Supabase
  - [~] `memberships` - SQL ready, needs to run in Supabase
  - [~] `connections` - SQL ready, needs to run in Supabase
- [~] **1.4** RLS policies included in migration file
- [ ] **1.5** Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment ← **USER ACTION NEEDED**
- [x] **1.6** Create feature branch: `feature/provider-portal`

### Phase 2: Code Merge ✅ COMPLETE (2026-02-06)
- [x] **2.1** Checkout PR #21 to examine
- [x] **2.2** Cherry-pick/merge auth components (AuthFlowModal, OtpInput, AuthProvider, GlobalAuthFlowModal)
- [x] **2.3** Cherry-pick/merge portal pages (dashboard, profile, calendar, connections)
- [x] **2.4** Cherry-pick/merge for-providers pages (landing, claim, create)
- [x] **2.5** Cherry-pick/merge API routes (ensure-account)
- [x] **2.6** Cherry-pick/merge utility files (lib/membership.ts, lib/profile-card.ts, components/ui/Modal.tsx)
- [x] **2.7** **UPDATED table references**: `profiles` → `business_profiles` in all merged files
- [x] **2.8** Kept our browse/provider pages (no conflicts)
- [x] **2.9** Updated app/layout.tsx to include GlobalAuthFlowModal
- [x] **2.10** Updated type definitions: Added `BusinessProfile` with `Profile` alias

### Phase 3: Integration Testing (Local)
- [x] **3.1** `npm run build` passes ✅
- [ ] **3.2** Homepage loads, featured providers display
- [ ] **3.3** Browse page filtering works
- [ ] **3.4** Provider detail page loads
- [ ] **3.5** /for-providers page loads
- [ ] **3.6** Auth flow: signup → OTP → account created
- [ ] **3.7** Portal dashboard loads after auth
- [ ] **3.8** Profile editing works

### Phase 4: Deploy & Verify
- [ ] **4.1** Push to main / merge PR
- [ ] **4.2** Vercel deployment succeeds
- [ ] **4.3** Production smoke test (care seeker flows)
- [ ] **4.4** Production smoke test (provider portal flows)
- [ ] **4.5** iOS app quick check (still loads providers)

### Phase 5: Cleanup
- [ ] **5.1** Update SCRATCHPAD.md with completion status
- [ ] **5.2** Close PR #21 with summary comment
- [ ] **5.3** Document any follow-up work needed

---

## Test Plan

### Care Seeker Flows (Must Not Break)
| Test | Steps | Expected |
|------|-------|----------|
| Homepage | Load / | Featured providers display |
| Browse | /browse → search "Chicago, IL" | Filtered results appear |
| Browse Filter | Select "Home Health" | Only home health providers |
| Provider Detail | Click any provider | Detail page loads with data |
| City Search | Type "Hou" in search | Houston suggestions appear |

### Provider Portal Flows (New)
| Test | Steps | Expected |
|------|-------|----------|
| Landing | /for-providers | Page loads with CTAs |
| Get Started | Click "Get Started" | Auth modal opens |
| Signup | Enter email, submit | OTP sent, verify screen shows |
| OTP Verify | Enter code | Account created, redirects |
| Dashboard | After auth | Portal dashboard loads |
| Profile Edit | /portal/profile | Edit form loads with data |
| Save Profile | Edit and save | Changes persist |

### iOS Compatibility
| Test | Method | Expected |
|------|--------|----------|
| Provider list | Open iOS app | Providers load normally |
| Provider detail | Tap any provider | Detail screen works |
| Search | Search for provider | Results appear |

---

## Rollback Plan

### If Merge Breaks Care Seeker Flows
```bash
# Revert to last known good commit
git revert HEAD --no-edit
git push origin main

# Or reset to specific commit
git reset --hard <last-good-commit>
git push origin main --force  # Use with caution
```

### If Database Changes Break iOS
```sql
-- Rollback is table-specific
-- Example: If we added a required column
ALTER TABLE profiles ALTER COLUMN new_column DROP NOT NULL;
-- Or drop the column entirely
ALTER TABLE profiles DROP COLUMN new_column;
```

### Vercel Rollback
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

---

## Decision Log

| Date | Decision | Rationale | Made By |
|------|----------|-----------|---------|
| 2026-02-05 | Use shared tables (not separate web tables) | iOS approved, avoid duplication | TJ + Claude |
| 2026-02-05 | Keep our browse/provider pages | Working filtering, Esther's design | TJ + Claude |
| 2026-02-05 | Skip browse variant pages | Different system, not needed now | TJ + Claude |
| 2026-02-06 | Rename Logan's `profiles` → `business_profiles` | iOS already has `profiles` for user identity, avoid conflict | TJ + Claude |
| 2026-02-06 | Create new tables instead of modifying iOS tables | iOS just approved, can't risk breaking it | TJ + Claude |
| 2026-02-06 | Reuse `provider_claims` table for claim workflow | Already has sophisticated status tracking | TJ + Claude |
| 2026-02-06 | Add `source_provider_id` to link claims to olera-providers | Enables claiming existing 39K listings without modifying iOS schema | TJ + Claude |

---

## Open Questions

1. **Do `accounts`, `profiles`, `memberships`, `connections` tables exist in iOS Supabase?**
   - Status: ✅ ANSWERED (2026-02-06)
   - Answer: `profiles` exists (user identity), others don't. Need to create `accounts`, `business_profiles`, `memberships`, `connections`.

2. **Does iOS app use these tables or different ones?**
   - Status: ✅ ANSWERED (2026-02-06)
   - Answer: iOS uses `profiles` (user identity), `olera-providers` (listings), `provider_claims` (claims), `conversations` (chat). Different naming/structure than Logan's expected schema.

3. **Is there a database trigger for account creation on auth.users insert?**
   - Status: ❓ Still need to verify
   - Action: Check Supabase Dashboard → Database → Triggers
   - Note: May need to create trigger for `accounts` table

4. **Do we need RLS policies for the new tables?**
   - Status: ✅ ANSWERED
   - Answer: Yes, basic policies included in schema above. Review before deployment.

5. **Should `connections` link to iOS `conversations` or stay separate?**
   - Status: ❓ Defer for now

6. **How should `business_profiles` link to `olera-providers` for claiming?**
   - Status: ✅ ANSWERED (2026-02-06)
   - Answer: Add `source_provider_id` column to `business_profiles` that references `olera-providers.provider_id`
   - See: `plans/provider-data-architecture.md` for full analysis
   - Action: Keep separate initially, unify later when both platforms stable

---

## Team Notes

### For Future Sessions
- This document is at `plans/provider-portal-integration.md`
- Update the checkboxes as phases complete
- Add decisions to the Decision Log
- Add any blockers to Open Questions

### Key Files to Protect
- `app/browse/page.tsx` - Our working filtering
- `app/browse/BrowsePageClient.tsx` - Server-side filtering logic
- `app/provider/[slug]/page.tsx` - Esther's provider detail design
- `lib/us-city-search.ts` - City search (18K+ cities)

### Contacts
- **Logan (logan447)** - Provider portal, auth flow
- **Esther (Efuanyamekye)** - Provider detail page, community forum
- **TJ** - iOS Supabase integration, city search

---

*End of Document*
