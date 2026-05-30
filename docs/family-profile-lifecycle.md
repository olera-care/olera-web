# Family Profile Lifecycle & Connection Behavior

## Overview

This document defines the expected behavior for family profiles throughout their lifecycle, specifically how different states affect:
1. **Find Families Feed** - Provider discovery
2. **Connections** - Existing relationships with providers
3. **Provider Outreach Page** - Provider's view of their connections

---

## Family Profile States

| State | Technical Definition | User Intent |
|-------|---------------------|-------------|
| **Active** | `care_post.status = "active"` | Actively seeking care, open to outreach |
| **Paused** | `care_post.status = "paused"` | Temporarily not looking, but may resume |
| **Care Post Deleted** | `care_post_deleted = true`, no active care_post | No longer posting need, but account exists |
| **Profile Deleted** | `is_active = false` (soft delete) | Wants to remove profile but preserve data |
| **Account Deleted** | auth.user deleted, cascades to all | Wants complete removal from platform |

---

## Connection Types & Statuses

### Connection Types
| Type | Direction | Description |
|------|-----------|-------------|
| `inquiry` | Family → Provider | Family reaches out to provider |
| `request` | Provider → Family | Provider reaches out via Find Families |
| `save` | Either → Either | Saved/bookmarked for later |

### Connection Statuses
| Status | Meaning |
|--------|---------|
| `pending` | Awaiting response |
| `accepted` | Both parties connected |
| `declined` | Recipient declined |
| `expired` | Withdrawn or ended |
| `archived` | Hidden from view (metadata flag) |

---

## Behavior Matrix: Find Families Feed

| Family State | Current Behavior | Expected Behavior (LinkedIn-style) |
|--------------|------------------|-----------------------------------|
| **Active** | ✅ Shows in feed | ✅ Same |
| **Paused** | ❌ Hidden entirely | Shows at BOTTOM, "Paused" badge, reach-out DISABLED |
| **Care Post Deleted** | ❌ Hidden entirely | Shows at BOTTOM for CONNECTED providers only, "Inactive" badge |
| **Profile Deleted** | ❌ Hidden (RLS) | Shows at BOTTOM for CONNECTED providers only, "No Longer Active" badge |
| **Account Deleted** | ❌ Gone completely | Shows for CONNECTED providers, "No Longer Active" badge |

---

## Behavior Matrix: Connections

### When Family PAUSES Care Post

| Connection Status | Current Behavior | Expected Behavior |
|-------------------|------------------|-------------------|
| `pending` requests | ✅ Auto-declined | ✅ Same - auto-decline with reason "family_paused" |
| `accepted` connections | ✅ Unchanged | ✅ Same - connection preserved |
| Provider can message | ✅ Yes | ✅ Yes - existing connections still work |

**Current Code:** `app/api/care-post/publish/route.ts` lines 164-209 ✅ Correct

### When Family DELETES Care Post

| Connection Status | Current Behavior | Expected Behavior |
|-------------------|------------------|-------------------|
| `pending` requests | ✅ Auto-declined | ✅ Same |
| `accepted` connections | ✅ Unchanged | ✅ Same |
| Provider can message | ✅ Yes | ✅ Yes |

**Current Code:** Same as pause ✅ Correct

### When Family DELETES Profile (Soft Delete)

| Connection Status | Current Behavior | Expected Behavior |
|-------------------|------------------|-------------------|
| ALL connections | ❌ **HARD DELETED** | Preserved with `metadata.profile_deleted = true` |
| Provider sees in Outreach | ❌ **DISAPPEARS** | Shows with "No Longer Active" badge |
| Provider can message | ❌ **NO** | Yes (for record-keeping), or show "unavailable" |

**Current Code:** `app/api/auth/delete-profile/route.ts` lines 95-101 ❌ **BUG**
```typescript
// CURRENT: Hard deletes all connections
await admin
  .from("connections")
  .delete()
  .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);
```

### When Family DELETES Account (Hard Delete)

| Connection Status | Current Behavior | Expected Behavior |
|-------------------|------------------|-------------------|
| ALL connections | ❌ **CASCADE DELETED** | Preserve for provider history |
| Provider sees in Outreach | ❌ **DISAPPEARS** | Shows with "No Longer Active" badge |

**Current Code:** FK CASCADE on `auth.users` → `accounts` → `business_profiles` → `connections`

---

## Behavior Matrix: Provider Outreach Page

| Scenario | Current Query | Shows? | Expected |
|----------|---------------|--------|----------|
| Pending request | `status IN (pending, accepted, declined)` | ✅ Yes | ✅ Same |
| Accepted (connected) | Same | ✅ Yes | ✅ Same |
| Declined | Same | ✅ Yes | ✅ Same |
| Expired (withdrawn) | Same | ❌ **NO** | Show in "Past" section |
| Family paused | RLS allows | ✅ Yes (with badge) | ✅ Same |
| Family profile deleted | RLS blocks | ❌ **NO** | Show with "No Longer Active" badge |

**Current Code:** `app/provider/outreach/page.tsx` line 212
```typescript
.in("status", ["pending", "accepted", "declined"])  // Missing "expired"
```

---

## Gaps Fixed (2026-05-30)

### GAP 1: Profile deletion hard-deletes connections ✅ FIXED
**File:** `app/api/auth/delete-profile/route.ts`
**Fix:** Now soft-deletes connections (sets `metadata.profile_deleted = true`) instead of hard-deleting.
Also soft-deletes the profile itself (`is_active = false`) instead of hard-deleting.

### GAP 2: Account deletion cascades to connections ✅ FIXED
**File:** `app/api/auth/delete-account/route.ts`
**Fix:** Now soft-deletes connections before detaching profiles from account. Profiles are preserved
with `is_active = false` and `account_id = null` for connection history.

### GAP 3: Outreach page doesn't show "expired" connections ✅ FIXED
**File:** `app/provider/outreach/page.tsx`
**Fix:** Added "Past" tab for expired connections. Query now includes `status = "expired"`.

### GAP 4: Find Families hides paused families entirely ✅ FIXED
**File:** `app/provider/matches/page.tsx`
**Fix:** Now includes paused families in the feed, sorted at bottom.
- Active families show first
- Paused families show at bottom with "Profile Paused" badge
- Reach-out is disabled for paused families

### GAP 5: Inactive profiles not fetched due to RLS ✅ ALREADY FIXED
**File:** `app/provider/outreach/page.tsx`
**Status:** Uses `/api/matches/inactive-profiles` endpoint to bypass RLS.

### GAP 6: "End Connection" exists but not exposed in UI
**File:** `components/portal/ConnectionDetailContent.tsx`
**Status:** Deferred - not urgent. The UI exists in code but is not rendered.

---

## Testing Checklist

After fixes, test each scenario:

- [ ] Family publishes care post → shows in Find Families
- [ ] Provider sends request → shows in family inbox
- [ ] Family accepts → shows in provider Connected tab
- [ ] Family pauses → connection preserved, family shows at bottom of feed
- [ ] Family unpauses → back to normal
- [ ] Family deletes care post → connection preserved, family hidden from feed (except connected)
- [ ] Family deletes profile → connection preserved with badge, provider can still see history
- [ ] Family deletes account → same as profile delete for provider visibility
