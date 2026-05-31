# Connection & Profile State Behavior Analysis

## Current System vs Expected Behavior (LinkedIn-style)

### Family Profile States

| State | Description |
|-------|-------------|
| **Active** | `care_post.status = "active"`, `is_active = true` |
| **Paused** | `care_post.status = "paused"`, `is_active = true` |
| **Care Post Deleted** | `care_post_deleted = true`, `is_active = true` |
| **Profile Deleted** | `is_active = false` (soft) or row deleted (hard) |
| **Account Deleted** | User and all profiles completely removed |

---

## Scenario Analysis: Find Families Feed

| Scenario | Current Behavior | Expected Behavior (LinkedIn-style) |
|----------|------------------|-----------------------------------|
| **Family is Active** | Shows in feed, provider can reach out | Same |
| **Family is Paused** | Hidden from feed entirely | Shows at BOTTOM of feed, marked "Paused", reach-out DISABLED |
| **Family Deleted Care Post** | Hidden from feed entirely | Shows at BOTTOM of feed, marked "Inactive", reach-out DISABLED |
| **Family Deleted Profile** | Hidden (RLS blocks or row gone) | Shows at BOTTOM for CONNECTED providers only, marked "No Longer Active" |
| **Family Deleted Account** | Gone completely | Shows at BOTTOM for CONNECTED providers only, marked "No Longer Active" |

---

## Scenario Analysis: Provider's Outreach Page (My Outreach)

| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| **Pending request to Active family** | Shows in Pending tab | Same |
| **Pending request to Paused family** | Auto-declined, shows in Declined tab | Same, but should show "Family paused their profile" reason |
| **Accepted connection to Active family** | Shows in Connected tab | Same |
| **Accepted connection to Paused family** | Should show in Connected tab | Shows in Connected tab with "Profile Paused" badge |
| **Accepted connection to Deleted Care Post** | Should show in Connected tab | Shows in Connected tab with "Profile Inactive" badge |
| **Accepted connection to Deleted Profile** | CONNECTION DELETED - disappears | Shows in Connected tab with "No Longer Active" badge, can still message |
| **Accepted connection to Deleted Account** | CONNECTION DELETED - disappears | Shows in Connected tab with "No Longer Active" badge |
| **Ended connection (by family)** | Status = "expired", NOT shown | Should show in a "Past" or "Ended" section |

---

## Scenario Analysis: Family's Inbox

| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| **Pending request from provider** | Shows in Requests tab | Same |
| **Accepted connection** | Shows in Connected tab | Same |
| **Family pauses their profile** | Pending requests auto-declined | Same |
| **Family deletes care post** | Pending requests auto-declined | Same |
| **Family ends a connection** | Status = "expired", archived | Same |

---

## Connection Deletion Paths (CURRENT - PROBLEMATIC)

| Action | What Currently Happens | What SHOULD Happen |
|--------|----------------------|-------------------|
| **Family pauses care post** | Pending requests → declined (good), Accepted connections → unchanged (good) | Same - this is correct |
| **Family deletes care post** | Pending requests → declined (good), Accepted connections → unchanged (good) | Same - this is correct |
| **Family deletes their profile** | ALL connections HARD DELETED | Soft-delete: set `metadata.profile_deleted = true`, preserve for provider history |
| **Family deletes their account** | ALL connections HARD DELETED | Same as above - preserve for provider history |
| **Admin deletes connection** | HARD DELETED | Only admin can do this, should be rare and logged |

---

## Gap Analysis: What's Broken

### GAP 1: Find Families doesn't show paused/inactive families at bottom
- **Current:** Query filters to only `care_post.status = "active"`
- **Fix:** Include paused families, sort active first, paused at bottom

### GAP 2: Connections are hard-deleted when profile is deleted
- **Current:** FK CASCADE and explicit delete removes all connections
- **Fix:** Use soft-delete, mark connections as `metadata.profile_deleted = true`

### GAP 3: Outreach page doesn't show "expired" connections
- **Current:** Query only includes `pending`, `accepted`, `declined`
- **Fix:** Include `expired` in a "Past Connections" section

### GAP 4: Inactive families aren't fetched when connections exist
- **Current:** Recovery query uses client Supabase (subject to RLS)
- **Fix:** Use service client or API endpoint

### GAP 5: No "Profile Paused/Inactive" badge in UI
- **Current:** Badge exists but not consistently applied
- **Fix:** Ensure all views show appropriate status badge

---

## The Mystery: Why Did the Connection Disappear?

Based on the user's test scenario (paused profile, accepted connection disappeared):

| Possibility | Likelihood | Why |
|-------------|------------|-----|
| Connection was actually still "pending" when paused | Medium | Would have been auto-declined, should still show in Declined tab |
| Family "ended" the connection | Low | Would set status="expired", wouldn't show in current query |
| Family deleted their profile | Low | User says profile still exists with `is_active=true` |
| Bug in care-post/publish | Unknown | Code only touches pending connections |
| Database cascade triggered somehow | Unknown | Would require profile deletion |

**To verify:** Need to query database directly for any connection between the two profiles, checking ALL statuses.

---

## Recommended Fixes (Priority Order)

1. **Fix profile deletion to soft-delete connections** - Preserve connection history
2. **Update Find Families to show paused families at bottom** - With disabled reach-out
3. **Update Outreach page to include "expired" connections** - In a Past section
4. **Use service client for inactive family recovery** - Bypass RLS
5. **Ensure profile status badges are consistent** - Paused, Inactive, No Longer Active
