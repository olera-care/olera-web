# Plan: Provider Data Architecture

Created: 2026-02-06
Status: Planning

## The Problem

We have two tables with overlapping purposes:

| Table | Purpose | Records | Owner |
|-------|---------|---------|-------|
| `olera-providers` | Directory listings (seeded) | 39K+ | iOS/scraped |
| `business_profiles` | User accounts | 0 (new) | Web portal |

**Question:** When a provider claims their listing, how do we link these?

---

## Analysis of Options

### Option A: Separate Systems (No Linking)
```
olera-providers     → Public browse (read-only)
business_profiles   → User profiles (fresh signups only)
```
- **Pros:** Simplest, no complexity
- **Cons:** Users can't claim existing 39K listings, must start fresh
- **Verdict:** ❌ Loses key value proposition

### Option B: Add `claimed_by` to `olera-providers`
```
olera-providers
├── ...existing columns...
└── claimed_by_account_id  ← NEW
```
- **Pros:** Single source of truth
- **Cons:** Changes iOS schema, iOS reads this table
- **Verdict:** ❌ Too risky for iOS

### Option C: Use iOS `provider_claims` Table
```
provider_claims (exists)
├── user_id → auth.users
├── provider_id → olera-providers
└── claim_status
```
- **Pros:** Already exists, iOS uses it
- **Cons:** Doesn't handle caregivers/families, separate from portal auth
- **Verdict:** ⚠️ Partial solution only

### Option D: Add `source_provider_id` to `business_profiles` (RECOMMENDED)
```
business_profiles
├── ...existing columns...
└── source_provider_id  ← NEW: nullable FK to olera-providers
```
- **Pros:** Clean separation, doesn't touch iOS, allows claiming
- **Cons:** Some data duplication
- **Verdict:** ✅ Best balance of simplicity and functionality

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │  olera-providers │         │ business_profiles │              │
│  │    (39K+ rows)   │◄────────│  (user-owned)    │              │
│  │                  │ source_ │                  │              │
│  │  • Read-only     │ provider│  • Editable      │              │
│  │  • Public browse │ _id     │  • Portal view   │              │
│  │  • iOS reads     │         │  • Auth required │              │
│  └──────────────────┘         └──────────────────┘              │
│           │                            │                         │
│           ▼                            ▼                         │
│  ┌──────────────────┐         ┌──────────────────┐              │
│  │   Browse Page    │         │  Provider Portal │              │
│  │   /browse        │         │  /portal         │              │
│  │   /provider/[id] │         │  /portal/profile │              │
│  └──────────────────┘         └──────────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Clear Rules

| Scenario | Table Used | Notes |
|----------|------------|-------|
| Care seeker browses | `olera-providers` | Public, 39K listings |
| Care seeker views detail | `olera-providers` | Shows "Claimed" badge if linked |
| Provider signs up (new) | `business_profiles` | `source_provider_id = null` |
| Provider claims listing | `business_profiles` | `source_provider_id = <id>`, copy base data |
| Provider edits profile | `business_profiles` | Their owned copy |
| Provider views portal | `business_profiles` | Their data |

### Claiming Flow

```
1. Provider clicks "Claim this listing" on /provider/[id]

2. System creates business_profiles row:
   {
     account_id: <their account>,
     source_provider_id: <olera-providers.provider_id>,
     display_name: <copied from olera-providers>,
     city, state, phone: <copied>,
     claim_state: "pending",
     ...
   }

3. (Optional) Admin approves claim
   → claim_state: "claimed"

4. Provider can now edit their business_profiles row

5. Public listing (/provider/[id]) shows:
   - Data from olera-providers (unchanged)
   - "Verified" badge if claim approved
   - Link to contact via portal
```

---

## Success Criteria

- [ ] Providers can claim existing listings from `olera-providers`
- [ ] Claimed providers have editable profiles in `business_profiles`
- [ ] Browse page continues to show 39K listings (unchanged)
- [ ] iOS app continues working (reads `olera-providers`)
- [ ] No data loss or schema breaks

---

## Tasks

### Phase 1: Schema Update
- [ ] **1.1** Add `source_provider_id` column to `business_profiles` migration
  - Files: `supabase/migrations/001_provider_portal_tables.sql`
  - Verify: Migration runs without error

### Phase 2: Claim Flow Update
- [ ] **2.1** Update claim page to copy data from `olera-providers`
  - Files: `app/for-providers/claim/[slug]/page.tsx`
  - Verify: Claiming copies provider data to business_profiles

- [ ] **2.2** Update AuthFlowModal claim logic
  - Files: `components/auth/AuthFlowModal.tsx`
  - Verify: Claim flow sets `source_provider_id`

### Phase 3: Display Logic
- [ ] **3.1** Add "Claimed/Verified" badge to provider detail page
  - Files: `app/provider/[slug]/page.tsx`
  - Verify: Badge shows when provider is claimed

- [ ] **3.2** (Optional) Show portal link for claimed providers
  - Files: `app/provider/[slug]/page.tsx`
  - Verify: Contact goes through portal for claimed providers

---

## Risks

| Risk | Mitigation |
|------|------------|
| Data duplication between tables | Accept for now; merge logic can come later |
| Stale data in business_profiles | User edits their copy; olera-providers stays as "original" |
| iOS breaks | We don't touch olera-providers schema |

---

## Future Considerations (Not This Phase)

1. **Merged display**: Show business_profiles edits on public listing
2. **Sync back**: Push verified edits back to olera-providers
3. **Deprecate duplication**: Eventually make business_profiles the single source

---

## Decision

**Recommendation:** Option D - Add `source_provider_id` to `business_profiles`

This is the most logical because:
1. **Doesn't break iOS** - `olera-providers` unchanged
2. **Preserves 39K listings** - Browse continues working
3. **Enables claiming** - Clear link between tables
4. **Clean separation** - Public vs owned data
5. **Incremental** - Can evolve later without breaking anything

---

*End of Plan*
