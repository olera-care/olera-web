# Plan: WhatsApp Care Seeker Enrichment Flow

Created: 2026-04-03
Status: Not Started

## Goal

Build a 3-message WhatsApp conversation that collects care recipient, specific care needs (open text), and urgency from seekers who just submitted a connection request — turning email-only leads into rich, matchable profiles without making them visit a portal.

## Context

- Current CTA redesign (`fine-dijkstra`) collects email only at submission, with an optional enrichment panel that most seekers will skip
- WhatsApp is the recovery channel for that enrichment — it comes to them, no login required
- 5 leads/day means we don't need NLP parsing yet — TJ reads open-text responses directly
- Care TYPE is already known (from the provider page category). We need specific care NEEDS (what's going on with their loved one)
- Provider-facing WhatsApp is already built (4 PRs merged). This is the seeker-facing complement

## Design: The 3-Message Conversation

### Message 1 — Immediate (Quick Reply)
> Hi {{1}} — your inquiry to {{2}} has been sent. {{3}} in the {{4}} area typically runs {{5}}.
>
> To help them respond with the right information — who is the care for?

Buttons: `My parent` | `My spouse` | `Myself`

Variables: {{1}} seeker first name, {{2}} provider name, {{3}} care type label, {{4}} city, {{5}} price range

### Message 2 — After reply (Text template, expects open reply)
> Got it — thank you. Can you share a little about what's going on? What's been the hardest part?
>
> Even a sentence or two helps providers understand your situation and respond faster.

No buttons — open text response expected.

### Message 3 — After reply (Quick Reply)
> Thank you for sharing that, {{1}}. We've passed this along so they can give you a much more specific response.
>
> One last thing — how soon are you looking for help?

Buttons: `Right away` | `Within a month` | `Just exploring`

### Message 4 — Final (after urgency reply, no response expected)
> All set. We'll message you here as soon as they respond.

(Simple text, no template needed — this is a free-form reply within the 24hr conversation window)

## Success Criteria

- [ ] Seeker receives Message 1 within 30s of submitting a connection request (if phone + WhatsApp opt-in)
- [ ] Tapping a Quick Reply button triggers the next message automatically
- [ ] Open-text reply in Message 2 is stored on the connection record and synced to profile
- [ ] Care recipient + urgency are written to seeker's profile metadata
- [ ] Provider sees enriched details on their lead (connection detail page)
- [ ] Conversation state survives server restarts (DB-backed, not in-memory)
- [ ] Twilio webhook signature is verified on every inbound request
- [ ] Existing provider-facing WhatsApp continues working unchanged

## Architecture

```
Seeker submits connection
        │
        ▼
POST /api/connections/request
        │
        ├── (existing) WhatsApp → provider
        │
        └── (new) WhatsApp Message 1 → seeker
                │
                ▼
        Seeker taps Quick Reply
                │
                ▼
POST /api/whatsapp/webhook (Twilio inbound)
        │
        ├── Look up conversation state by phone number
        ├── Store reply data
        ├── Advance state machine
        └── Send next message
                │
                ▼
        (repeat for Messages 2→3→4)
                │
                ▼
        PATCH /api/connections/update-intent
        (syncs all collected data to connection + profile)
```

### State Machine

| State | Waiting for | On receive | Next state |
|-------|-------------|------------|------------|
| `sent_q1_recipient` | Quick Reply (parent/spouse/myself) | Store care_recipient, send Message 2 | `sent_q2_needs` |
| `sent_q2_needs` | Open text | Store care_needs text, send Message 3 | `sent_q3_urgency` |
| `sent_q3_urgency` | Quick Reply (right away/within month/exploring) | Store urgency, send Message 4, call update-intent | `complete` |
| `complete` | — | Any further messages → ignore or "Thanks, we'll be in touch" | `complete` |

### Data Storage

Add columns to `whatsapp_log` or create a new `whatsapp_conversations` table:

```sql
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES connections(id),
  profile_id UUID NOT NULL,
  phone TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'sent_q1_recipient',
  care_recipient TEXT,
  care_needs_text TEXT,
  urgency TEXT,
  provider_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wa_conv_phone ON whatsapp_conversations(phone);
CREATE INDEX idx_wa_conv_state ON whatsapp_conversations(state) WHERE state != 'complete';
```

Phone is the lookup key because Twilio inbound webhooks identify the sender by phone number, not by any Olera ID.

## Tasks

### Phase 1: Database + Webhook Foundation

- [ ] 1. Create Supabase migration `032_whatsapp_conversations.sql`
      - Files: `supabase/migrations/032_whatsapp_conversations.sql`
      - Verify: Migration runs clean, table exists with correct schema

- [ ] 2. Create inbound webhook handler `POST /api/whatsapp/webhook`
      - Files: `app/api/whatsapp/webhook/route.ts`
      - Details:
        - Verify Twilio signature using `TWILIO_AUTH_TOKEN` (use twilio.validateRequest)
        - Parse inbound message: `Body`, `From`, `ButtonText` (for Quick Reply)
        - Look up active conversation by sender phone (most recent non-complete)
        - Route to state handler
        - Return TwiML 200 (empty `<Response/>` — we send replies via API, not TwiML)
      - Depends on: Task 1
      - Verify: POST to endpoint with invalid signature → 403. Valid signature + no conversation → 200 (no-op)

- [ ] 3. Add `TWILIO_WEBHOOK_SECRET` env var to Vercel (or confirm TWILIO_AUTH_TOKEN suffices for signature validation)
      - Files: Vercel dashboard
      - Verify: Webhook validation works in staging

### Phase 2: Conversation Engine

- [ ] 4. Create conversation orchestrator module `lib/whatsapp-conversation.ts`
      - Files: `lib/whatsapp-conversation.ts`
      - Details:
        - `startSeekerConversation(connectionId, profileId, phone, providerName, careType, city, state)` → creates DB row + sends Message 1
        - `handleInboundMessage(phone, body, buttonText)` → looks up state, processes reply, sends next message, advances state
        - `buildMessage1Variables(firstName, providerName, careTypeLabel, city, priceRange)` → formats template variables
        - Maps Quick Reply button text to data values (e.g., "My parent" → "parent", "Right away" → "immediate")
        - On state `complete`: calls update-intent API internally to sync all collected data
      - Depends on: Task 1, 2
      - Verify: Unit-testable state transitions

- [ ] 5. Create 3 Twilio Content API templates and submit for Meta approval
      - Templates:
        - `olera_seeker_recipient` (Quick Reply type): Message 1 with 5 variables + 3 buttons
        - `olera_seeker_needs` (Text type): Message 2, simple text with 0 variables
        - `olera_seeker_urgency` (Quick Reply type): Message 3 with 1 variable + 3 buttons
      - Add env vars: `TWILIO_WA_TPL_SEEKER_Q1`, `TWILIO_WA_TPL_SEEKER_Q2`, `TWILIO_WA_TPL_SEEKER_Q3`
      - Depends on: None (can do in parallel — Meta approval takes up to 48hrs)
      - Verify: All 3 templates show "Approved" in Twilio console

### Phase 3: Integration + Send

- [ ] 6. Wire seeker WhatsApp send into connection request flow
      - Files: `app/api/connections/request/route.ts`
      - Details:
        - After existing provider WhatsApp send block (~line 875)
        - Check seeker phone + whatsapp_opted_in on seeker's profile metadata
        - If opted in: call `startSeekerConversation()` from Task 4
        - Fire-and-forget (try/catch, non-blocking like provider WhatsApp)
        - Need provider category for pricing lookup — already available as `providerCategory`
      - Depends on: Task 4, 5
      - Verify: Create test connection with WhatsApp-opted-in seeker → Message 1 arrives

- [ ] 7. Wire webhook replies to update-intent for profile sync
      - Files: `lib/whatsapp-conversation.ts`, `app/api/connections/update-intent/route.ts`
      - Details:
        - When conversation reaches `complete` state, build update-intent payload:
          - `careRecipient` from Q1 reply
          - `additionalNotes` from Q2 open text (care needs)
          - `urgency` from Q3 reply
        - Call update-intent internally (not HTTP — direct function call using admin client)
        - This triggers `syncIntentToProfile()` which writes to seeker's profile metadata
      - Depends on: Task 4, 6
      - Verify: Complete a full 3-message conversation → check connection record has enriched message JSON + profile has updated metadata

### Phase 4: Polish + Safety

- [ ] 8. Handle edge cases in webhook
      - Files: `app/api/whatsapp/webhook/route.ts`, `lib/whatsapp-conversation.ts`
      - Details:
        - Seeker sends message but has no active conversation → ignore gracefully
        - Seeker sends free text instead of tapping Quick Reply on Q1/Q3 → fuzzy match ("parent" → "My parent") or re-send the question
        - Seeker sends multiple messages before we process → idempotency (check state hasn't changed)
        - Conversation older than 24hrs (Twilio window) → mark as expired, don't try to send
        - Multiple active conversations for same phone → use most recent
      - Depends on: Task 4
      - Verify: Manual testing of each edge case

- [ ] 9. Add WhatsApp conversation data to provider-facing lead view
      - Files: `app/provider/connections/page.tsx` or connection detail component
      - Details:
        - When provider views a lead, show enrichment data collected via WhatsApp
        - Care needs text (Q2) is the most valuable — show prominently
        - "Who needs care" + "How soon" as pills/badges
      - Depends on: Task 7
      - Verify: Provider sees enriched lead details after seeker completes WhatsApp flow

- [ ] 10. Configure Twilio webhook URL in Twilio console
      - Set inbound message webhook to: `https://olera.care/api/whatsapp/webhook` (POST)
      - Set status callback to same URL (optional, for delivery tracking)
      - IMPORTANT: Do this AFTER webhook is deployed to staging, not before (per feedback_twilio_webhook_first.md)
      - Depends on: Task 2 deployed to staging
      - Verify: Send test WhatsApp to Olera number → webhook receives it

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta rejects Quick Reply templates | Blocks Messages 1 & 3 | Use sandbox fallback text while re-submitting. Template copy is transactional/utility, should pass |
| Seeker doesn't have WhatsApp on their phone number | Message fails silently | `sendWhatsApp` already handles this — logs error, doesn't break connection flow |
| 24-hour WhatsApp conversation window expires | Can't send Messages 2-4 | Track `created_at`, skip sending if >23hrs elapsed. Most conversations complete in minutes |
| Phone number used by multiple seekers | Wrong conversation state | Index lookup returns most recent active conversation. Edge case at 5/day volume |
| Seeker replies with unexpected text on Quick Reply questions | Can't parse intent | Fuzzy match common phrases ("my mom" → parent). If no match, re-ask once. If still no match, skip to next question |
| Twilio signature verification fails in Vercel | Webhook rejects all messages | Vercel modifies request body. May need raw body parsing. Test early in staging |

## Template Details for Twilio Console

### Template 1: `olera_seeker_recipient` (Quick Reply)
- **Category:** Utility
- **Body:** `Hi {{1}} — your inquiry to {{2}} has been sent. {{3}} in the {{4}} area typically runs {{5}}.\n\nTo help them respond with the right information — who is the care for?`
- **Buttons:** `My parent`, `My spouse`, `Myself`
- **Sample values:** {{1}}=Sarah, {{2}}=Sunrise Senior Care, {{3}}=Home care, {{4}}=Phoenix, {{5}}=$5,200–$6,400/mo

### Template 2: `olera_seeker_needs` (Text)
- **Category:** Utility
- **Body:** `Got it — thank you. Can you share a little about what's going on? What's been the hardest part?\n\nEven a sentence or two helps providers understand your situation and respond faster.`
- **No variables, no buttons**
- Note: This must be a template (not free-form) because we're outside the 24hr user-initiated window if they take time to reply to Q1

### Template 3: `olera_seeker_urgency` (Quick Reply)
- **Category:** Utility
- **Body:** `Thank you for sharing that, {{1}}. We've passed this along so they can give you a much more specific response.\n\nOne last thing — how soon are you looking for help?`
- **Buttons:** `Right away`, `Within a month`, `Just exploring`
- **Sample values:** {{1}}=Sarah

## Notes

- The open-text response (Message 2) is the crown jewel. At 5 leads/day, TJ reads these directly. At scale, AI extracts structured care needs.
- Message 4 (final confirmation) is sent as free-form within the 24hr conversation window opened by the seeker's reply — no template needed.
- The `fine-dijkstra` branch is adding phone collection to the enrichment panel (framed as "How should we let you know when they respond?" with WhatsApp/Text/Email options). This is the primary source of seeker phone numbers.
- Provider WhatsApp and seeker WhatsApp share the same Twilio number. Inbound webhook must distinguish by checking for active conversations.
- `update-intent` already supports guest auth via claim tokens, but the webhook will use admin client directly (server-to-server, no user auth needed).
