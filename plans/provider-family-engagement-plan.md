# Provider–Family Engagement Loop — Implementation Plan

## Goal

Enable the complete provider–family engagement loop:
1. Provider logs in → discovers families → sends connection request
2. Family logs in → sees the request → accepts/declines
3. Both portals reflect the engagement cleanly

## Current State Analysis

### What exists and works:
- **Connections table** with types: `inquiry`, `save`, `application`, `invitation`
- **Connections page** (`/portal/connections`) — loads inbound/outbound connections with parallel queries, dedup, batch profile fetch
- **ConnectionDrawer** — slide-out detail panel with accept/decline actions
- **ConnectButton** — reusable component with modal, paywall, duplicate checks
- **Discover Families page** (`/portal/discover/families`) — queries family profiles, renders cards
- **Family profile page** (`/profile/[id]`) — server-rendered profile view
- **Connection request API** (`/api/connections/request`) — handles family→provider inquiry creation with iOS provider bridging

### Bugs and gaps found:

#### BUG 1: Provider→Family connections are blocked
`ConnectButton.tsx:197-199` blocks ALL provider-initiated inquiries:
```tsx
if (isProviderProfile && connectionType === "inquiry") {
  setModal({ kind: "wrong-profile-type" });
  return;
}
```
The guard was intended to prevent provider→provider care requests, but it also blocks the legitimate provider→family connection flow. The Discover Families page uses `connectionType="inquiry"` which hits this guard.

**Fix**: Add a `toProfileType` prop to ConnectButton so the guard only triggers for provider→provider inquiries, not provider→family.

#### BUG 2: Discover Families "Initiate Contact" button uses wrong label/semantics
The button uses `connectionType="inquiry"` and `label="Initiate Contact"`. Once the guard is fixed, this will work, but the label should be clearer from the provider's perspective.

**Fix**: Change to `connectionType="inquiry"` (keep, it's semantically correct — provider inquiring about care needs) with label "Connect" / sentLabel "Request Sent".

#### GAP 1: Family portal has no discover-providers-in-portal flow
Families browse providers on `/browse` (the public page), not inside the portal. The connection request goes through the multi-step intent capture form on provider profile pages. This is already functional.

#### GAP 2: Connections page doesn't show "Sent" vs "Received" tabs
The tab system only filters by connection type (inquiry/invitation/application), not direction. For the engagement loop, it's more useful to see "Received" vs "Sent" groupings.

#### GAP 3: Family→Provider inquiry via `/api/connections/request` doesn't check for existing connections from the other direction
If a provider already reached out to a family, and the family then requests a consultation with that same provider, it creates a second connection. The UNIQUE constraint prevents same-direction duplicates `(from, to, type)` but not reverse-direction ones `(to, from, type)`.

---

## Implementation Plan

### Phase 1: Fix Provider→Family Connection Flow (Critical)

**Files to modify:**

1. **`components/shared/ConnectButton.tsx`**
   - Add `toProfileType?: ProfileType` prop
   - Change the wrong-profile-type guard: only block when `isProviderProfile && connectionType === "inquiry" && toProfileType !== "family"`
   - This lets providers send inquiries to families while still blocking provider→provider care requests

2. **`app/portal/discover/families/page.tsx`**
   - Pass `toProfileType="family"` to ConnectButton in FamilyCard
   - Update labels: `label="Connect"`, `sentLabel="Request Sent"`
   - ConnectButton now correctly allows the connection

**Validation**: Provider can click "Connect" on a family card → confirmation modal → connection created in DB with type=inquiry, status=pending.

### Phase 2: Harden Connections Page

**Files to modify:**

3. **`app/portal/connections/page.tsx`**
   - Add "Received" / "Sent" filter buttons alongside type tabs
   - Improve empty states with role-specific messaging
   - Add a manual refresh button for reliability
   - Ensure loading → data → error transitions are clean

**Validation**: Both provider and family can see their connections accurately categorized.

### Phase 3: Improve Discover Families Page

**Files to modify:**

4. **`app/portal/discover/families/page.tsx`**
   - Add search by name/location
   - Show existing connection status on family cards (already connected indicator)
   - Improve empty state with actionable guidance
   - Add pagination or "load more" for larger datasets

**Validation**: Provider can efficiently find families and see which ones they've already contacted.

### Phase 4: End-to-End Validation & Polish

5. **Verify bidirectional connection visibility**
   - Ensure provider-sent inquiry shows in family's connections as "Received"
   - Ensure family can accept/decline from connections page
   - Ensure status update reflects in both portals
   - Verify ConnectionDrawer shows correct details for both directions

6. **Fix the profile link in ConnectionDrawer**
   - `ConnectionDrawer.tsx:231-234` links family profiles to `/profile/${id}` — verify this works
   - Verify "View full profile" opens correctly for both profile types

7. **Polish connection card displays**
   - Show connection direction more clearly ("You → Family Name" or "Family Name → You")
   - Add connection type context (e.g., "Care consultation request" not just "Inquiry")

---

## No Schema Changes Required

The existing `connections` table with type `inquiry` handles both directions:
- Family → Provider inquiry (family requesting care consultation)
- Provider → Family inquiry (provider reaching out about care needs)

The UNIQUE constraint `(from_profile_id, to_profile_id, type)` correctly prevents same-direction duplicates while allowing bidirectional connections.

---

## Execution Order

| Step | What | Risk | Files |
|------|------|------|-------|
| 1 | Fix ConnectButton guard | Low — single conditional change | ConnectButton.tsx |
| 2 | Wire up Discover Families | Low — props change | discover/families/page.tsx |
| 3 | Test provider→family flow | Validation | — |
| 4 | Harden Connections page | Medium — UI changes | connections/page.tsx |
| 5 | Add search to Discover | Low — additive | discover/families/page.tsx |
| 6 | E2E validation + polish | Low | Multiple |

---

## Out of Scope (This Session)
- Email notifications for new connections
- Real-time updates (WebSocket/polling)
- Chat/messaging between connected parties
- Stripe payment integration
- Schema changes to the connections table
- Onboarding flow changes (unless directly blocking engagement)
