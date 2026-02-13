# Connection Experience Elevation Plan

## Audit Summary

### What's Working
- Core data flow is solid (service-client reads/writes, 5s polling)
- Inbound/outbound routing logic is correct
- Message threading, next-step requests, and status transitions are functional
- Access control (blurring, upgrade prompts) is well-structured
- Past-connection recovery CTAs (reconnect, browse similar) are thoughtful
- Provider 3-tab layout (Needs Attention / Active / Past) is well-organized
- Provider display statuses and tab routing work correctly

### Weaknesses Identified

**Layout Inconsistency**
- Family accepted outbound -> 2-column (720px): conversation left, contact/next-steps right
- Provider accepted (any direction) -> 1-column (480px): next-steps stacked below conversation
- These should match. The 2-column layout is superior for accepted connections.

**Copy Gaps**
- "New connection request" (pending inbound) -- tells provider nothing about who or what
- "checkmark [Name] responded" (accepted) -- doesn't say *accepted*, doesn't guide next action
- "[Name] isn't taking new clients" (declined outbound) -- assumes a reason, can feel harsh
- "Responded" tab label for family view -- should say "Connected"
- "Responded" status badge -- should say "Connected"
- Acceptance bubble lacks warmth or forward guidance
- No guidance copy at any transition point ("What happens next?")

**Status Chip Ambiguity**
- Both inbound pending and outbound pending show "Pending" on the family side -- no distinction between "needs your action" vs "waiting on them"
- Provider outbound pending shows amber (action color) despite requiring no action

**Scheduling/Next-Steps**
- Next steps appear after acceptance -- correct, but with no prompt or nudge
- No guidance on when/why to schedule a call
- No "completed" state for next-step requests -- can request but never resolve
- Call/consultation descriptions feel like a feature list, not guided progression

**Thread UX**
- No date separators when conversations span multiple days
- Empty thread (no messages beyond request) has no guidance
- Connection request bubble header ("Connection request") is generic -- doesn't indicate direction
- Accepted-state system message is just a checkmark pill -- no warmth, no next-step guidance

---

## Plan

### Phase 1: Layout Consistency + Copy + Visual Polish

**1A. Unified Layout for Accepted Connections**

Change `isRespondedDrawer` from `isAccepted && !isProvider && !isInbound` to just `isAccepted && !shouldBlur`. Both roles get the 2-column layout when connected:

```
+--------------------------------------------------+
|  Header: "Connection" + Close                    |
|  Provider/Family info + Status chip              |
+------------------------+-------------------------+
|  Conversation          |  Contact Info           |
|  (scrollable thread)   |  Next Steps / Status    |
|                        |  End Connection         |
|  Message input         |                         |
+------------------------+-------------------------+
```

Single-column remains for pending and past states (appropriate -- less content, simpler actions).

Files: `ConnectionDrawer.tsx` (change `isRespondedDrawer` condition)

---

**1B. Context-Aware System Notes**

Replace the `SystemNote` component copy with role-aware, guidance-oriented messages:

| State | Current | Proposed |
|-------|---------|----------|
| Pending (inbound provider) | "New connection request" | "[Family] is looking for [care_type] care" |
| Pending (outbound family) | "Sent - Providers typically respond within a few hours" | "Request sent - Most providers respond within a few hours" |
| Pending (outbound provider) | "Sent - Waiting for family to respond" | "Message sent - Waiting for [family] to respond" |
| Accepted (family) | "checkmark [Name] responded" | "Connected - You can now message and schedule" |
| Accepted (provider) | "checkmark [Name] responded" | "Connected - Send a message to get started" |
| Declined (outbound) | "[Name] isn't taking new clients" | "[Name] isn't available right now" |
| Archived (ended) | "You ended this connection" | "Connection ended - You can reconnect anytime" |
| Expired (not withdrawn) | "This request expired" | "This request expired - No response was received" |

The system note needs access to `parsedMsg` (care type info from the connection request message), so the `SystemNote` component will accept an additional `careType` prop.

Color updates:
- Pending inbound -> amber (action needed) -- keep
- Pending outbound -> soft blue (`text-blue-600 bg-blue-50`) -- waiting, not action
- Accepted -> emerald -- keep

Files: `ConnectionDrawer.tsx` (`SystemNote` component)

---

**1C. Acceptance Bubble Refinement**

Replace the current acceptance messages with warmer, action-oriented copy:

Family viewing accepted connection:
> "Great news -- [Provider] accepted your request. Send a message or schedule a call to take the next step."

Provider viewing accepted connection:
> "You're connected with [Family]. Send a message to introduce yourself and learn about their care needs."

Files: `ConnectionDrawer.tsx` (acceptance message section in `renderConversation`)

---

**1D. Connection Request Bubble Header**

Change generic "Connection request" to direction-aware:
- Outbound: "Your request"
- Inbound: "Request from [Name]"

Files: `ConnectionDrawer.tsx` (request bubble in `renderConversation`)

---

**1E. Status Chips -- Contextual Labels**

Drawer status chips (STATUS_CONFIG, right of profile info):

Currently using a static config. Needs to be dynamic based on `isInbound`:
- Pending inbound: "Needs response" (amber) -- calls to action
- Pending outbound: "Awaiting reply" (blue) -- reduces anxiety, signals patience
- Accepted: "Connected" (emerald) -- keep
- Declined: "Not available" (gray) -- softer than "Declined"
- Ended/Withdrawn/Expired: keep as-is

Connection cards on the page:
- `FAMILY_STATUS_CONFIG.responded.label`: "Responded" -> "Connected"
- `FAMILY_STATUS_CONFIG.pending.label`: "Pending" -> "Awaiting Reply"
- Family tab: "Responded" -> "Connected"
- `PROVIDER_STATUS_CONFIG.pending_outbound`: color from amber to blue (`text-blue-600`, `bg-blue-50`, `dot: bg-blue-400`)

Also update `connection-utils.ts` type: `ConnectionTab = "active" | "responded" | "past"` -> `"active" | "connected" | "past"` and all references.

Files: `ConnectionDrawer.tsx` (STATUS_CONFIG -> dynamic), `connection-utils.ts` (label/color updates, type rename), `connections/page.tsx` (tab label, tab id)

---

**1F. Message Input Placeholder**

- Pending: "Add a note..." (lower pressure than "Add a message...")
- Accepted (family): "Message [Provider name]..."
- Accepted (provider): "Message [Family name]..."

Files: `ConnectionDrawer.tsx` (messagePlaceholder)

---

**1G. Thread Visual Polish**

1. **Date separators**: When messages are on different calendar days, insert a centered date label (e.g., "-- January 15 --")
2. **Empty-thread guidance**: For accepted connections with no thread messages yet, show a subtle prompt: "No messages yet. Start the conversation -- a quick introduction goes a long way."
3. **Care type tag**: On the connection request bubble, show care type as a small colored tag above the message body

Files: `ConnectionDrawer.tsx` (renderConversation)

---

### Phase 2: Scheduling & Next-Steps Refinement

**2A. Next-Step Nudge After Acceptance**

When accepted and no next-step has been requested yet, add a gentle prompt above the next-step cards:

> "Ready for the next step? Most families schedule a call within the first day."

Appears in sidebar (2-column). Disappears once a next-step is requested.

Files: `ConnectionDrawer.tsx` (renderNextSteps)

---

**2B. Next-Step Card Copy Improvement**

Current descriptions are feature-oriented. Replace with outcome-oriented copy:

| Step | Current Desc | Proposed Desc |
|------|-------------|---------------|
| Call | "Provider will receive your phone number" | "Talk directly to discuss care needs" |
| Consultation | "Request a free in-person or virtual visit" | "Meet in person or virtually to assess fit" |
| Home Visit | "Request an in-home assessment" | "See the care environment firsthand" |

Files: `ConnectionDrawer.tsx` (nextSteps definitions)

---

**2C. Next-Step Request Status -- Better Progress Feel**

Current: Shows "Requested" with amber dot + date + "Waiting for [Name] to respond"

Proposed improvements:
- Use relative time: "Requested 2 hours ago" instead of just the date
- Add clearer expectation: "Waiting for [Name] to suggest available times"
- Keep cancel option

Files: `ConnectionDrawer.tsx` (renderRequestStatus)

---

**2D. Provider-Side Next-Step Response**

When a next-step request is active and the current user is the *recipient* (not the requester), show an action prompt instead of just the status card:

> "[Family] would like to schedule a call."
> [Suggest times] [Decline request]

"Suggest times" pre-fills the message input with placeholder: "I'm available..."

This bridges the gap between "requested" and "actually scheduled" -- currently the provider just sees a status card with no clear action.

Files: `ConnectionDrawer.tsx` (renderRequestStatus -- add responder view)

---

### Phase 3: Advanced Enhancements (Deferred -- Not This Pass)

Noted for future consideration:
- Response time indicator on provider cards ("Typically responds within 2 hours")
- Trust signals (verified badge, profile completeness)
- Relative timestamps throughout ("Sent 2 hours ago")
- Smart re-engagement nudge if no messages in 48h after acceptance
- Resolved/completed state for next-step requests

---

## Implementation Order

1. **Phase 1A**: Layout unification (smallest change, biggest visual impact)
2. **Phase 1B-D**: Copy overhaul (system notes, acceptance, request bubble)
3. **Phase 1E**: Status chips (page + drawer consistency)
4. **Phase 1F-G**: Input placeholders + thread polish
5. **Phase 2A-C**: Next-step nudge, copy, and status
6. **Phase 2D**: Provider-side next-step response

## Files Changed

| File | Changes |
|------|---------|
| `components/portal/ConnectionDrawer.tsx` | Layout condition, system notes, acceptance copy, request bubble, status config, message placeholder, thread polish, next-step nudge/copy/responder |
| `lib/connection-utils.ts` | Tab type rename, FAMILY_STATUS_CONFIG label updates, PROVIDER_STATUS_CONFIG color updates |
| `app/portal/connections/page.tsx` | Tab label + id "responded" -> "connected", minor card adjustments |

No new files. No new API routes. No schema changes.
