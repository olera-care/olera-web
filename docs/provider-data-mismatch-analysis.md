# Provider Data Mismatch Analysis

**Date:** 2026-03-26
**Severity:** Critical
**Affects:** Providers who create accounts (vs claiming existing listings)

---

## Executive Summary

Providers who create new accounts (instead of claiming their existing listing) cannot see their reviews and Q&A in the Provider Hub. This is because their `business_profiles` record is not linked to the `olera-providers` record where reviews/questions are stored.

**Impact:** Providers think the system is broken, can't respond to reviews, and may create duplicate accounts trying to fix it.

---

## Root Cause

### The Two-Table System

| Table | Purpose | ID Format |
|-------|---------|-----------|
| `olera-providers` | Scraped/seeded provider listings (legacy) | `provider_id` (alphanumeric, e.g., `"sunshine-care-houston-tx-h5ar"`) |
| `business_profiles` | User accounts and claimed profiles | `id` (UUID), `slug` (human-readable), `source_provider_id` (link to olera-providers) |

### How Data Gets Stored

When a family submits a review on a public provider page:
- The public page serves data from `olera-providers` (if exists) or `business_profiles`
- Review is stored with `provider_id = slug` (from the public page)
- For olera-providers listings, this is the **olera-providers slug**

### The Mismatch

**Scenario: Provider creates account instead of claiming**

1. Provider's listing exists in `olera-providers` with `slug = "sunshine-care-houston-tx-h5ar"`
2. Families submit reviews → stored with `provider_id = "sunshine-care-houston-tx-h5ar"`
3. Provider creates NEW account via onboarding
4. New `business_profiles` record created with:
   - `id = "uuid-123..."` (new UUID)
   - `slug = "sunshine-care-houston-tx-xyz"` (newly generated, may differ)
   - `source_provider_id = NULL` (not linked!)
5. Provider Hub queries reviews with `[slug, id, source_provider_id]`
6. **None match** → Provider sees 0 reviews

### Visual Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PUBLIC PAGE                                  │
│     Shows data from: olera-providers                            │
│     Reviews stored with: olera-providers.slug                   │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                     NOT LINKED
                    (source_provider_id = NULL)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   PROVIDER HUB                                   │
│     Queries with: business_profiles.slug, .id, .source_provider_id │
│     Result: No match → 0 reviews shown                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## How to Identify Affected Providers

### SQL Query: Find Unlinked Provider Accounts

```sql
-- Find business_profiles that SHOULD be linked to olera-providers but aren't
SELECT
  bp.id as business_profile_id,
  bp.slug as bp_slug,
  bp.display_name as bp_name,
  bp.city as bp_city,
  bp.state as bp_state,
  bp.source_provider_id,
  bp.created_at,
  op.provider_id as ios_provider_id,
  op.slug as ios_slug,
  op.provider_name as ios_name
FROM business_profiles bp
LEFT JOIN "olera-providers" op
  ON LOWER(TRIM(bp.display_name)) = LOWER(TRIM(op.provider_name))
  AND LOWER(TRIM(bp.city)) = LOWER(TRIM(op.city))
  AND LOWER(TRIM(bp.state)) = LOWER(TRIM(op.state))
WHERE bp.type IN ('organization', 'caregiver')
  AND bp.source_provider_id IS NULL
  AND op.provider_id IS NOT NULL
  AND op.deleted IS NOT TRUE
ORDER BY bp.created_at DESC;
```

### SQL Query: Find Reviews Orphaned from Provider Hub

```sql
-- Find reviews that exist but won't show in Provider Hub
SELECT
  r.id as review_id,
  r.provider_id as stored_provider_id,
  r.reviewer_name,
  r.rating,
  r.created_at,
  bp.id as business_profile_id,
  bp.slug as bp_slug,
  bp.source_provider_id
FROM reviews r
LEFT JOIN business_profiles bp
  ON r.provider_id = bp.slug
  OR r.provider_id = bp.id::text
  OR r.provider_id = bp.source_provider_id
WHERE r.status = 'published'
  AND bp.id IS NULL
ORDER BY r.created_at DESC;
```

### SQL Query: Count Affected Providers

```sql
-- Count providers with potential data mismatch
SELECT
  COUNT(*) as total_unlinked_profiles,
  COUNT(CASE WHEN op.provider_id IS NOT NULL THEN 1 END) as have_matching_ios_record
FROM business_profiles bp
LEFT JOIN "olera-providers" op
  ON LOWER(TRIM(bp.display_name)) = LOWER(TRIM(op.provider_name))
  AND LOWER(TRIM(bp.city)) = LOWER(TRIM(op.city))
WHERE bp.type IN ('organization', 'caregiver')
  AND bp.source_provider_id IS NULL;
```

---

## Proposed Solutions

### Solution 1: Fix Existing Accounts (Database)

**Action:** Update `source_provider_id` on affected `business_profiles` records

```sql
-- PREVIEW ONLY - Review before running
UPDATE business_profiles bp
SET source_provider_id = op.provider_id
FROM "olera-providers" op
WHERE LOWER(TRIM(bp.display_name)) = LOWER(TRIM(op.provider_name))
  AND LOWER(TRIM(bp.city)) = LOWER(TRIM(op.city))
  AND LOWER(TRIM(bp.state)) = LOWER(TRIM(op.state))
  AND bp.source_provider_id IS NULL
  AND bp.type IN ('organization', 'caregiver')
  AND op.deleted IS NOT TRUE;
```

**Risk:** Low - only sets NULL fields, doesn't overwrite existing data
**Reversible:** Yes - can set back to NULL if needed

### Solution 2: Fix Account Creation Flow (Code)

**File:** `/app/api/auth/create-profile/route.ts`

**Change:** When creating a provider profile, check if a matching `olera-providers` record exists and auto-link it.

```typescript
// After line 206, before inserting new profile:
// Check for existing olera-providers record
const { data: existingIOS } = await db
  .from("olera-providers")
  .select("provider_id, slug")
  .ilike("provider_name", name)
  .eq("city", city)
  .eq("state", state)
  .not("deleted", "is", true)
  .maybeSingle();

// Include in insert if found
const insertData = {
  // ... existing fields ...
  source_provider_id: existingIOS?.provider_id || null,
  slug: existingIOS?.slug || slug,  // Use iOS slug if exists
};
```

**Risk:** Medium - changes account creation flow
**Testing Required:** Yes - needs thorough testing of onboarding

### Solution 3: Fix Provider Hub Query (Code - Safest)

**File:** `/app/api/provider/reviews/route.ts`

**Change:** Before building `providerIdVariants`, also look up potential matching `olera-providers` record.

```typescript
// After getting profile, before building variants:
let additionalProviderId: string | null = null;
if (!profile.source_provider_id) {
  // Try to find matching olera-providers record
  const { data: iosMatch } = await db
    .from("olera-providers")
    .select("provider_id")
    .ilike("provider_name", profile.display_name || "")
    .eq("city", profile.city || "")
    .eq("state", profile.state || "")
    .not("deleted", "is", true)
    .maybeSingle();

  additionalProviderId = iosMatch?.provider_id || null;
}

// Build variants including the lookup result
const providerIdVariants = [profile.slug, profile.id];
if (profile.source_provider_id) {
  providerIdVariants.push(profile.source_provider_id);
}
if (additionalProviderId) {
  providerIdVariants.push(additionalProviderId);
}
```

**Risk:** Low - additive query, doesn't change storage
**Performance:** Adds one extra query per request (can be optimized)

---

## Recommended Approach

### Immediate (Safe, No Database Changes)
1. Implement **Solution 3** (Provider Hub query fix) - catches existing mismatched data
2. Apply same pattern to `/app/api/provider/questions/route.ts`

### Short-term (Requires Database Access)
3. Run identification queries to understand scope
4. Run **Solution 1** (database fix) to properly link existing accounts

### Long-term (Prevents Future Issues)
5. Implement **Solution 2** (account creation fix) to prevent new cases
6. Consider adding a "Link Existing Listing" feature in Provider Hub

---

## Files Involved

| File | Purpose | Change Needed |
|------|---------|---------------|
| `/app/api/provider/reviews/route.ts` | Provider Hub reviews query | Add iOS lookup fallback |
| `/app/api/provider/questions/route.ts` | Provider Hub Q&A query | Add iOS lookup fallback |
| `/app/api/auth/create-profile/route.ts` | Account creation | Auto-link to iOS record |
| `/app/provider/[slug]/page.tsx` | Public page queries | Already fixed (uses slug) |

---

## Questions for Team Lead

1. How many providers are currently affected? (Run identification queries)
2. Should we auto-link via database update, or notify affected providers?
3. For account creation fix - should we auto-link silently or prompt users?
4. Do we need to handle the case where name/city match but it's actually a different business?

---

## Appendix: Code References

### Where reviews are stored
`/app/api/reviews/public/route.ts` line 130:
```typescript
provider_id: providerSlug,  // Always stores slug
```

### Where Provider Hub queries reviews
`/app/api/provider/reviews/route.ts` lines 53-65:
```typescript
const providerIdVariants = [profile.slug, profile.id];
if (profile.source_provider_id) {
  providerIdVariants.push(profile.source_provider_id);
}
// Query with .in("provider_id", providerIdVariants)
```

### Where accounts are created without linking
`/app/api/auth/create-profile/route.ts` lines 209-241:
```typescript
// No source_provider_id set for new profiles
```
