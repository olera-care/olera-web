# Provider-Family Engagement: Architectural Plan

## 1. Data Model Assessment

### Schema: Symmetric and sound

The `connections` table is already well-designed for bidirectional use:

```
connections
├── from_profile_id  (sender — FK to profiles, cascade delete)
├── to_profile_id    (recipient — FK to profiles, cascade delete)
├── type             (inquiry | save | application | invitation)
├── status           (pending | accepted | declined | archived)
├── message          (text — initial inquiry payload, JSON-encoded)
├── metadata         (JSONB — thread[], withdrawn, ended, hidden, next_step_request)
├── created_at
├── updated_at
└── UNIQUE(from_profile_id, to_profile_id, type)
```

**Verdict: No schema changes needed.** The table is role-agnostic. Direction is
determined by `from_profile_id` / `to_profile_id`. Any profile type can be
sender or receiver.

### Type mismatch (cosmetic, not blocking)

TypeScript declares `ConnectionStatus = "pending" | "accepted" | "declined" | "expired" | "archived"`
but the DB enum only has `pending | accepted | declined | archived`. The app uses
`"expired"` in TypeScript but stores `"archived"` with `metadata.withdrawn` to
simulate "expired." This is inconsistent but functional — we won't change it now.

### Messaging: Thread-in-metadata

Messages are stored as `metadata.thread[]` — an array of objects:
```json
{ "from_profile_id": "uuid", "text": "...", "created_at": "iso", "type?": "system|next_step_request" }
```

No separate `messages` table exists. This works for low-volume messaging (the
current use case) but won't scale. **Good enough for now.**

---

## 2. API Layer Assessment

| Route | Symmetric? | Issue |
|-------|-----------|-------|
| `/api/connections/request` | **NO** | Assumes family→provider. Auto-creates family profile. |
| `/api/connections/message` | YES | Checks participant, works for both roles. |
| `/api/connections/withdraw` | YES | Only sender can withdraw. Works for either role. |
| `/api/connections/hide` | YES | Both participants can hide past connections. |
| `/api/connections/end` | YES | Both participants can end accepted connections. |
| `/api/connections/next-step` | YES | Both participants can request/cancel. |
| `/api/connections/save` | **NO** | Family-only (save provider). Not relevant here. |

### What needs to change

**`/api/connections/request`** is the only blocking issue. It currently:
1. Auto-creates a family profile for the caller
2. Assumes the target is a provider
3. Does provider-specific iOS ID resolution

For provider→family connections (from Discover Families), the `ConnectButton`
component bypasses this route entirely — it inserts directly via the Supabase
client. This works but is inconsistent. Two options:

- **Option A**: Make `/api/connections/request` role-agnostic (detect caller role)
- **Option B**: Keep `ConnectButton` direct-insert for provider→family (already working)

**Recommendation: Option B.** The `/request` route has family-specific logic
(auto-profile creation, iOS provider resolution) that doesn't apply to providers.
`ConnectButton` already handles provider→family correctly via direct Supabase
insert. No API changes needed.

---

## 3. ConnectionDrawer: 5 Bugs to Fix

These are the real blockers. The drawer is the core interaction surface and it's
currently broken for providers.

### Bug 1: Providers can't accept/decline without paid membership

**Location:** `ConnectionDrawer.tsx` line ~1269
**Problem:** Accept/Decline buttons gated by `hasFullAccess` which requires paid
membership or free connections remaining.
**Fix:** Separate "respond to inquiry" from "view full details." Providers should
ALWAYS be able to accept/decline inbound pending connections. The paywall should
gate viewing contact details and messaging — not the ability to respond at all.

### Bug 2: Providers have no "End Connection" action

**Location:** `ConnectionDrawer.tsx` line ~665
**Problem:** `isRespondedDrawer = isAccepted && !isProvider && !isInbound` — this
is `false` for providers, so the two-column layout (which contains "End Connection")
never renders for them.
**Fix:** Add an "End connection" action to the single-column layout for providers
with accepted connections.

### Bug 3: Providers can't see family contact info on accepted connections

**Location:** `ConnectionDrawer.tsx` lines ~658-662
**Problem:** Contact info rendering is inside the two-column layout block, which
only renders for families. Providers in single-column layout see nothing.
**Fix:** Show contact info (phone, email) in the single-column layout header area
for providers viewing accepted connections.

### Bug 4: Providers can't use "Next Steps" feature

**Location:** `ConnectionDrawer.tsx` line ~1308
**Problem:** Next Steps cards only render inside `isRespondedDrawer` (family-only).
**Fix:** Add Next Steps UI to the single-column layout for providers viewing
accepted connections.

### Bug 5: Blurred view is a dead end

**Location:** `ConnectionDrawer.tsx` lines ~874-883
**Problem:** When `shouldBlur` is true, provider sees blurred names, no message,
no actions — just an upgrade prompt. But basic actions (accept/decline) should
still work even without full access.
**Fix:** Show accept/decline buttons even when blurred. Only blur contact details
and full message content.

---

## 4. connection-utils.ts: Add Provider Display Logic

Currently all display status logic is family-centric (`FamilyDisplayStatus`,
`FAMILY_STATUS_CONFIG`). Need to add symmetric provider equivalents.

### Provider display statuses

| DB Status | Provider Inbound | Provider Outbound |
|-----------|-----------------|------------------|
| pending | "New Request" | "Pending" |
| accepted | "Connected" | "Connected" |
| declined | "Declined" | "Declined" |
| archived (ended) | "Ended" | "Ended" |
| archived (withdrawn) | "Withdrawn" | "Withdrawn" |

### Provider tab structure

Mirror the family's 3-tab layout:
- **Needs Attention** — Pending inbound requests
- **Active** — Accepted connections + pending outbound
- **Past** — Declined, expired, ended, withdrawn

---

## 5. Connections Page: Provider View Polish

The provider view currently uses a group-based layout (Needs Attention / Active / Past)
without tabs. To mirror the family experience:

- Add a proper 3-tab bar matching the family's pill-style tabs
- Add unread indicators for newly accepted connections
- Show direction label (Received / Sent) on each card
- Add empty state CTAs per tab

---

## 6. Edge Cases

### Multiple profiles per user
- `activeProfile` determines which connections load
- Switching profiles re-fetches connections — no cross-contamination
- Already handled correctly by `fetchConnections` which filters by `activeProfile.id`

### User switches profiles mid-session
- `useEffect` depends on `activeProfile` — re-fetches on switch
- Drawer state (open connection) should close on profile switch → **needs check**

### Duplicate connection requests
- DB constraint `UNIQUE(from_profile_id, to_profile_id, type)` prevents this
- `ConnectButton` checks for existing connection on mount
- `/api/connections/request` returns `{ status: "duplicate" }` on conflict

### Profile deletion
- `ON DELETE CASCADE` on both FK columns — connection auto-deleted
- No orphan risk

### Ghost states after refresh
- `fetchConnections` is a fresh DB query — no stale cache risk
- `ConnectionDrawer` fetches independently on open — always fresh
- `localStorage` read-state could desync if connection is deleted → harmless

---

## 7. Execution Plan

### Phase 1: Fix ConnectionDrawer (critical bugs)

1. **Decouple accept/decline from paywall** — show buttons even when `shouldBlur`
2. **Add "End Connection" to single-column layout** for providers on accepted connections
3. **Show contact info in single-column header** for providers on accepted connections
4. **Add Next Steps to single-column layout** for providers on accepted connections
5. **Close drawer on profile switch** to prevent stale state

### Phase 2: Add provider display utils

6. **Add `getProviderDisplayStatus()`** and `PROVIDER_STATUS_CONFIG` to `connection-utils.ts`
7. **Add `getProviderConnectionTab()`** for provider tab routing

### Phase 3: Rebuild provider connections page

8. **Replace group layout with 3-tab layout** matching family design
9. **Add unread tracking** for provider connections (reuse `readIds` pattern)
10. **Add per-tab empty states** with appropriate CTAs

### Phase 4: Verify end-to-end

11. **Manual test sequence:**
    - Family submits connection request to provider
    - Provider sees it in Needs Attention tab
    - Provider opens drawer → sees request details → accepts
    - Provider sends message → family sees it
    - Family responds → provider sees response
    - Provider requests next step → family sees it
    - Either party ends connection → both see "Ended"

---

## 8. What We Are NOT Doing

- No schema migrations
- No new API routes
- No separate messages table
- No real-time/WebSocket messaging
- No email/push notifications
- No provider→provider connections
- No changes to the family-side flow (it works)

---

## 9. Success Criteria

After implementation:

1. ✓ Family submits connection request
2. ✓ Provider sees request in Connections tab → "Needs Attention"
3. ✓ Provider opens drawer → sees family info + Accept/Decline
4. ✓ Provider accepts → status changes to "Connected"
5. ✓ Provider sends message → family sees it in Responded tab
6. ✓ Family replies → provider sees reply in thread
7. ✓ Provider requests next step (call/visit) → family sees it
8. ✓ Either party ends connection → both see "Ended" in Past tab
9. ✓ State is consistent on refresh for both sides
