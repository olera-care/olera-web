# Plan: Merge Outreach into Connections Page

## Status: Complete (Pending QA)
**Branch:** `user-connections`
**Created:** 2026-06-08

---

## Goal

Add "Inbound / Outbound" toggle to the existing Connections page so admins can view both:
- **Inbound:** Families reaching out to providers (current behavior)
- **Outbound:** Providers reaching out to families via "Find Families" (currently on separate Outreach page)

---

## Critical Constraints

**DO NOT TOUCH existing Connections page functionality:**
- All inbound flow, tabs, stats, perspective toggle, engagement tracking stays exactly as-is
- Existing ConnectionRow component behavior unchanged
- Current API behavior for inbound connections unchanged

**The approach:**
- Add a direction toggle that switches between inbound/outbound modes
- When `direction = "inbound"` → current behavior (untouched)
- When `direction = "outbound"` → load outreach data with its own tabs/stats

---

## Data Model Reference

| Direction | Connection Type | From Profile | To Profile |
|-----------|----------------|--------------|------------|
| **Inbound** | `type = 'inquiry'` | Family | Provider |
| **Outbound** | `type = 'request'` + `metadata.provider_initiated = true` | Provider | Family |

---

## Phase 1: API Changes (`/api/admin/connections/route.ts`) ✅ COMPLETE

- [x] 1.1 Add `direction` query param — Accept `"inbound"` (default) or `"outbound"`
- [x] 1.2 Add separate query path for outbound — Query `type = 'request'` + `metadata.provider_initiated = true`
- [x] 1.3 Swap profile mapping for outbound — provider=from_profile, family=to_profile
- [x] 1.4 Add outbound-specific stats — `total`, `accepted`, `pending`, `declined`, `acceptRate`
- [x] 1.5 Add outbound tab counts — `all`, `accepted`, `pending`, `declined`

**Implementation notes:**
- Outbound code path returns early (line 195-346), existing inbound code untouched (starts line 352)
- Returns `outboundCounts` for tabs and `outboundStats` for stats row
- Search, date filtering, and pagination all work for outbound

---

## Phase 2: UI Changes (`/app/admin/connections/page.tsx`) ✅ COMPLETE

- [x] 2.1 Add Direction toggle — "Inbound" / "Outbound" toggle at top of page
- [x] 2.2 Conditional tabs for outbound — All, Accepted, Pending, Declined
- [x] 2.3 Conditional stats for outbound — Sent, Accepted, Pending, Declined, Accept Rate
- [x] 2.4 Hide Perspective toggle when Outbound — Only relevant for inbound
- [x] 2.5 Pass `direction` param to API call
- [ ] 2.6 URL sync — Reflect direction in URL: `?direction=outbound` (deferred)

**Implementation notes:**
- Added `OutboundConnectionRow` component for rendering outbound connections (simpler than ConnectionRow, doesn't require temperature)
- Outbound stats displayed in same grid layout as existing stats
- Filter resets to appropriate default when switching direction (inbound→"new", outbound→"all")
- Direction toggle appears above perspective toggle with helper text explaining each mode

---

## Phase 3: ConnectionRow Compatibility ✅ COMPLETE

- [x] 3.1 Thread display works for outbound connections
- [x] 3.2 Email history works (queries `email_logs` by connection ID)
- [x] 3.3 Status badges show Accepted/Pending/Declined
- [x] 3.4 Row displays "Provider → Family" for outbound

**Implementation notes:**
- Enhanced `OutboundConnectionRow` with expand/collapse functionality
- Fetches detail data from API when expanded
- Shows contact cards for provider and family
- Shows conversation thread with correct role labels
- Shows collapsible email history
- Uses same detail API as inbound (with direction-aware profile mapping)

---

## Phase 4: Detail API (`/api/admin/connections/[id]/route.ts`) ✅ COMPLETE

- [x] 4.1 Verify detail API returns thread + emails for outbound connections
- [x] 4.2 Fix profile mapping for outbound

**Implementation notes:**
- Detect outbound: `type === "request"` && `metadata.provider_initiated === true`
- Swap profile mapping: provider=from_profile, family=to_profile for outbound
- Fixed thread role assignment to use direction-aware profile IDs
- Fixed engagement lookup to use direction-aware providerProfileId
- Fixed email lookup to use direction-aware providerProfileId
- Updated query to select all fields from both profiles (needed for swap)
- Added `isOutbound`, `type`, and `provider.id` to response

---

## Phase 5: Cleanup ✅ COMPLETE

- [x] 5.1 Add redirect from `/admin/outreach` → `/admin/connections?direction=outbound`
- [x] 5.2 Update sidebar nav — removed Outreach link (now part of Connections)
- [ ] 5.3 Delete old Outreach API files after confirming everything works (optional, deferred)

**Implementation notes:**
- Outreach page replaced with client-side redirect (preserves bookmarks)
- Sidebar Outreach link removed with comment explaining the merge
- Old `/api/admin/outreach/route.ts` kept for now — can delete after QA confirms everything works

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/api/admin/connections/route.ts` | Add direction param, outbound query path |
| `app/api/admin/connections/[id]/route.ts` | Verify/fix outbound support |
| `app/admin/connections/page.tsx` | Add direction toggle, conditional tabs/stats |
| `components/admin/ConnectionRow.tsx` | May need minor adjustments for outbound display |
| `app/admin/outreach/page.tsx` | Eventually redirect or delete |

---

## Current Outreach Page Stats (for reference)

From `/app/admin/outreach/page.tsx`:
- Active Providers
- Total Sent
- Accepted (highlight)
- Pending
- Declined
- Accept Rate

Tabs: All, Accepted, Pending, Declined

---

## Notes

- The existing Connections page is ~655 lines, Outreach is ~689 lines
- ConnectionRow already supports thread display and email history
- Both query the `connections` table, just different `type` filter
