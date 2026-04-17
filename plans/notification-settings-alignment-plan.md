# Notification Settings Alignment Plan

## Overview

Align the notification settings UI with what's actually being sent, and add preference enforcement for activity-based notifications only. Marketing and transactional emails continue to send regardless of user preferences.

**Goal:** Users see accurate, controllable notification toggles. Backend continues working exactly as it does today.

---

## Current State

### Problems
1. Settings UI shows 12 notification types, but only ~6 are actually implemented
2. Toggles are stored but never enforced (except WhatsApp opt-in)
3. Caregiver settings show "message notifications" but caregivers don't have messaging
4. Users think they're controlling notifications, but toggles do nothing

### What We Have
- **Family:** 23 notifications firing (mix of transactional, marketing, activity)
- **Provider:** 15 notifications firing (mix of transactional, marketing, activity)
- **Caregiver:** 9 notifications firing (mix of transactional, marketing, activity)

---

## Design Decisions

### 1. Only Activity Notifications Are Controllable

| Type | User Can Toggle? | Reason |
|------|------------------|--------|
| Transactional | No | Required for account function (verification, confirmation) |
| Marketing/Nudge | No | Startup needs traction for growth |
| Activity | Yes | User choice for ongoing notifications |

### 2. Notification Types by Account

#### Family (2 controllable)
| Key | Label | Description | Channels |
|-----|-------|-------------|----------|
| `messages_and_responses` | Messages & responses | When a provider messages you or responds to your inquiry | Email, WhatsApp |
| `match_updates` | Match updates | When providers reach out to you on Matches | Email, WhatsApp |

**Always sends (no toggle):** Welcome, verification, care reports, profile reminders, go live reminders, recommendations, re-engagement, post-connection follow-up

#### Provider (3 controllable)
| Key | Label | Description | Channels |
|-----|-------|-------------|----------|
| `new_leads` | New leads | When families send you inquiries or connection requests | Email, SMS, WhatsApp |
| `reviews_and_questions` | Reviews & questions | When you receive new reviews or Q&A questions | Email |
| `messages` | Messages | When families message you | Email, WhatsApp |

**Always sends (no toggle):** Verification, claim emails, profile incomplete nudges, candidate alerts

#### Caregiver (2 controllable)
| Key | Label | Description | Channels |
|-----|-------|-------------|----------|
| `interview_requests` | Interview requests | When employers want to interview you | Email |
| `application_updates` | Application updates | When your application is accepted or declined | Email |

**Always sends (no toggle):** Welcome, activation, returning, profile nudges, application sent confirmation

### 3. Channel Availability

| Account | Email | SMS | WhatsApp |
|---------|:-----:|:---:|:--------:|
| Family | All | None | messages_and_responses, match_updates |
| Provider | All | new_leads only | new_leads, messages |
| Caregiver | All | None | None |

---

## Implementation Steps

### Phase 1: Update Settings UI Constants

**File:** `app/account/settings/page.tsx`

#### Step 1.1: Replace hardcoded notification arrays

```typescript
// BEFORE (lines 12-31)
const FAMILY_NOTIFICATIONS = [
  { key: "connection_updates", title: "Connection updates", description: "When a provider responds or messages you" },
  { key: "saved_provider_alerts", title: "Saved provider alerts", description: "When a saved provider becomes available" },
  { key: "match_updates", title: "Match updates", description: "New provider matches and care profile responses" },
  { key: "profile_reminders", title: "Profile reminders", description: "Tips to complete your care profile" },
] as const;

// AFTER
const FAMILY_NOTIFICATIONS = [
  {
    key: "messages_and_responses",
    title: "Messages & responses",
    description: "When a provider messages you or responds to your inquiry",
    channels: ["email", "whatsapp"] as const,
  },
  {
    key: "match_updates",
    title: "Match updates",
    description: "When providers reach out to you on Matches",
    channels: ["email", "whatsapp"] as const,
  },
] as const;
```

```typescript
// BEFORE
const ORGANIZATION_NOTIFICATIONS = [
  { key: "lead_notifications", title: "New leads", description: "When families send you inquiries or connection requests" },
  { key: "review_alerts", title: "Review alerts", description: "When you receive new reviews or Q&A questions" },
  { key: "message_notifications", title: "Message notifications", description: "When families message you" },
  { key: "profile_insights", title: "Profile insights", description: "Weekly performance insights and tips" },
] as const;

// AFTER
const ORGANIZATION_NOTIFICATIONS = [
  {
    key: "new_leads",
    title: "New leads",
    description: "When families send you inquiries or connection requests",
    channels: ["email", "sms", "whatsapp"] as const,
  },
  {
    key: "reviews_and_questions",
    title: "Reviews & questions",
    description: "When you receive new reviews or Q&A questions",
    channels: ["email"] as const,
  },
  {
    key: "messages",
    title: "Messages",
    description: "When families message you",
    channels: ["email", "whatsapp"] as const,
  },
] as const;
```

```typescript
// BEFORE
const CAREGIVER_NOTIFICATIONS = [
  { key: "job_alerts", title: "Job alerts", description: "New job opportunities matching your preferences" },
  { key: "interview_reminders", title: "Interview reminders", description: "Upcoming interviews and status updates" },
  { key: "application_updates", title: "Application updates", description: "Status changes on your applications" },
  { key: "message_notifications", title: "Message notifications", description: "When employers message you" },
] as const;

// AFTER
const CAREGIVER_NOTIFICATIONS = [
  {
    key: "interview_requests",
    title: "Interview requests",
    description: "When employers want to interview you",
    channels: ["email"] as const,
  },
  {
    key: "application_updates",
    title: "Application updates",
    description: "When your application is accepted or declined",
    channels: ["email"] as const,
  },
] as const;
```

#### Step 1.2: Update UI to only show available channels

Update the notification row rendering to only show toggles for channels that apply to that notification type. If a notification only has email, don't show SMS/WhatsApp toggles.

```typescript
// In the notification row rendering, check notification.channels
{notification.channels.includes("email") && (
  <Toggle checked={getNotifOn(notification.key, "email")} onChange={() => handleNotifToggle(notification.key, "email")} />
)}
{notification.channels.includes("sms") && (
  <Toggle checked={getNotifOn(notification.key, "sms")} onChange={() => handleNotifToggle(notification.key, "sms")} />
)}
{notification.channels.includes("whatsapp") && hasPhone && (
  <Toggle checked={getNotifOn(notification.key, "whatsapp")} onChange={() => handleNotifToggle(notification.key, "whatsapp")} />
)}
```

---

### Phase 2: Update Type Definitions

**File:** `lib/types.ts`

#### Step 2.1: Add notification_prefs to OrganizationMetadata

```typescript
// Add to OrganizationMetadata interface (around line 237)
export interface OrganizationMetadata {
  // ... existing fields ...

  notification_prefs?: {
    new_leads?: { email?: boolean; sms?: boolean; whatsapp?: boolean };
    reviews_and_questions?: { email?: boolean };
    messages?: { email?: boolean; whatsapp?: boolean };
  };
}
```

#### Step 2.2: Add notification_prefs to CaregiverMetadata/StudentMetadata

```typescript
// Add to CaregiverMetadata and StudentMetadata interfaces
notification_prefs?: {
  interview_requests?: { email?: boolean };
  application_updates?: { email?: boolean };
};
```

#### Step 2.3: Update FamilyMetadata notification_prefs

```typescript
// Update FamilyMetadata interface to use new keys
notification_prefs?: {
  messages_and_responses?: { email?: boolean; whatsapp?: boolean };
  match_updates?: { email?: boolean; whatsapp?: boolean };
};
```

---

### Phase 3: Add Preference Checking Helper

**File:** `lib/notification-prefs.ts` (new file)

```typescript
import { createClient } from "@/lib/supabase/server";

type Channel = "email" | "sms" | "whatsapp";

interface NotificationPrefs {
  [key: string]: {
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  };
}

/**
 * Check if a notification should be sent based on user preferences.
 *
 * IMPORTANT: Only checks activity-based notifications.
 * Marketing and transactional emails bypass this check.
 *
 * @returns true if notification should be sent (default: true)
 */
export async function shouldSendNotification(
  profileId: string,
  notificationType: string,
  channel: Channel
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("metadata")
      .eq("id", profileId)
      .single();

    if (!profile?.metadata) return true; // Default: send

    const prefs = profile.metadata.notification_prefs as NotificationPrefs | undefined;
    if (!prefs) return true; // Default: send

    const notifPref = prefs[notificationType];
    if (!notifPref) return true; // Default: send

    // If explicitly set to false, don't send
    return notifPref[channel] !== false;
  } catch (error) {
    console.error("[notification-prefs] Error checking preferences:", error);
    return true; // Default: send on error
  }
}

/**
 * Mapping of email types to notification preference keys.
 * Only activity-based notifications are listed here.
 * Marketing/transactional emails are not in this map and always send.
 */
export const EMAIL_TYPE_TO_PREF_KEY: Record<string, string> = {
  // Family
  "new_message": "messages_and_responses",
  "connection_response": "messages_and_responses",
  "provider_reach_out": "match_updates",

  // Provider
  "connection_request": "new_leads",
  "new_review": "reviews_and_questions",
  "question_received": "reviews_and_questions",
  "provider_new_message": "messages",

  // Caregiver
  "interview_request": "interview_requests",
  "application_response": "application_updates",
};

/**
 * Check if an email type is controllable by user preferences.
 * Returns false for marketing/transactional emails.
 */
export function isControllableNotification(emailType: string): boolean {
  return emailType in EMAIL_TYPE_TO_PREF_KEY;
}
```

---

### Phase 4: Add Preference Enforcement to Send Functions

#### Step 4.1: Update email sending

**File:** `lib/email.ts`

Add preference check before sending activity emails:

```typescript
import { shouldSendNotification, EMAIL_TYPE_TO_PREF_KEY, isControllableNotification } from "./notification-prefs";

// In sendEmail function, add check for controllable notifications:
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, emailType, recipientProfileId } = options;

  // Check preferences for controllable notifications
  if (recipientProfileId && emailType && isControllableNotification(emailType)) {
    const prefKey = EMAIL_TYPE_TO_PREF_KEY[emailType];
    const shouldSend = await shouldSendNotification(recipientProfileId, prefKey, "email");
    if (!shouldSend) {
      console.log(`[email] Skipped ${emailType} to ${to} - user preference disabled`);
      return { success: true, skipped: true };
    }
  }

  // ... rest of existing sendEmail logic
}
```

#### Step 4.2: Update SMS sending

**File:** `lib/twilio.ts`

```typescript
import { shouldSendNotification } from "./notification-prefs";

export async function sendSMS(options: SendSMSOptions & {
  recipientProfileId?: string;
  notificationType?: string;
}) {
  const { to, body, recipientProfileId, notificationType } = options;

  // Check preferences if this is a controllable notification
  if (recipientProfileId && notificationType) {
    const shouldSend = await shouldSendNotification(recipientProfileId, notificationType, "sms");
    if (!shouldSend) {
      console.log(`[sms] Skipped to ${to} - user preference disabled`);
      return { success: true, skipped: true };
    }
  }

  // ... rest of existing sendSMS logic
}
```

#### Step 4.3: Update WhatsApp sending

**File:** `lib/whatsapp.ts`

WhatsApp already checks `whatsapp_opted_in`. Add additional per-notification check:

```typescript
import { shouldSendNotification } from "./notification-prefs";

// In sendWhatsApp function, add:
if (recipientProfileId && notificationType) {
  const shouldSend = await shouldSendNotification(recipientProfileId, notificationType, "whatsapp");
  if (!shouldSend) {
    console.log(`[whatsapp] Skipped to ${to} - user preference disabled`);
    return { success: true, skipped: true };
  }
}
```

---

### Phase 5: Update API Routes to Pass Profile IDs

Update the API routes that send activity notifications to pass `recipientProfileId` and `emailType` to the send functions.

#### Routes to update:

1. **`/api/connections/request/route.ts`**
   - Pass provider profile ID for lead notification
   - Pass family profile ID for connection confirmation

2. **`/api/connections/message/route.ts`**
   - Pass recipient profile ID for message notification

3. **`/api/reviews/route.ts`**
   - Pass provider profile ID for new review notification

4. **`/api/questions/route.ts`**
   - Pass provider profile ID for new question notification

5. **`/api/provider/questions/route.ts`**
   - Pass family profile ID for question answered notification

6. **`/api/matches/notify-reach-out/route.ts`**
   - Pass family profile ID for reach-out notification

7. **`/api/medjobs/interviews/route.ts`**
   - Pass student profile ID for interview request

8. **`/api/medjobs/apply-to-provider/route.ts`**
   - Pass student profile ID for application response

---

### Phase 6: Add SMS Logging (Bonus)

**File:** Create migration for `sms_log` table

```sql
CREATE TABLE sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  body TEXT,
  sms_type TEXT,
  recipient_type TEXT,
  profile_id UUID REFERENCES business_profiles(id),
  status TEXT DEFAULT 'pending',
  twilio_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sms_log_recipient ON sms_log(recipient);
CREATE INDEX idx_sms_log_profile ON sms_log(profile_id);
CREATE INDEX idx_sms_log_created ON sms_log(created_at DESC);
```

Update `lib/twilio.ts` to log SMS sends to this table.

---

## Migration Strategy

### Handling Existing Preferences

Users may have old preference keys stored (`connection_updates`, `lead_notifications`, etc.). Options:

**Option A (Recommended):** Treat missing new keys as default ON
- If user has no `messages_and_responses` pref, default to enabled
- Old prefs are ignored but don't break anything
- Clean migration, no data updates needed

**Option B:** Migrate old keys to new keys
- Write a script to map old keys to new keys
- More complex, risk of data issues

**Recommendation:** Go with Option A. Simpler and safer.

---

## Testing Plan

### Manual Testing

1. **Family account:**
   - Go to settings, verify 2 notification types shown
   - Toggle email off for "Messages & responses"
   - Have a provider send a message
   - Verify NO email received
   - Toggle back on, verify email works

2. **Provider account:**
   - Go to settings, verify 3 notification types shown
   - Toggle SMS off for "New leads"
   - Have a family send inquiry
   - Verify NO SMS received (email still sends)
   - Toggle back on, verify SMS works

3. **Caregiver account:**
   - Go to settings, verify 2 notification types shown
   - Toggle email off for "Interview requests"
   - Have provider request interview
   - Verify NO email received
   - Toggle back on, verify email works

4. **Marketing emails (no toggle):**
   - Verify profile reminders, nudges, recommendations still send
   - Verify no toggle appears for these in settings

### Automated Testing

Add unit tests for:
- `shouldSendNotification()` function
- `isControllableNotification()` function
- Settings UI rendering correct notification types per account

---

## Rollout Plan

### Phase 1: Settings UI Update (Low Risk)
- Update notification arrays
- Update UI to show correct channels
- Deploy and verify UI looks correct
- **No backend changes yet** - toggles still don't enforce

### Phase 2: Type Definitions
- Add notification_prefs to type definitions
- No runtime impact, just TypeScript

### Phase 3: Preference Helper + Enforcement
- Add `lib/notification-prefs.ts`
- Update send functions with preference checks
- Update API routes to pass profile IDs
- Deploy with feature flag if needed

### Phase 4: SMS Logging (Optional)
- Add sms_log table
- Update twilio.ts to log
- Deploy

---

## Files to Modify

| File | Change |
|------|--------|
| `app/account/settings/page.tsx` | Update notification arrays, UI rendering |
| `lib/types.ts` | Add notification_prefs to Org/Caregiver metadata |
| `lib/notification-prefs.ts` | New file - preference checking helper |
| `lib/email.ts` | Add preference check before sending |
| `lib/twilio.ts` | Add preference check + optional logging |
| `lib/whatsapp.ts` | Add per-notification preference check |
| `app/api/connections/request/route.ts` | Pass profile IDs to send functions |
| `app/api/connections/message/route.ts` | Pass profile IDs to send functions |
| `app/api/reviews/route.ts` | Pass profile IDs to send functions |
| `app/api/questions/route.ts` | Pass profile IDs to send functions |
| `app/api/provider/questions/route.ts` | Pass profile IDs to send functions |
| `app/api/matches/notify-reach-out/route.ts` | Pass profile IDs to send functions |
| `app/api/medjobs/interviews/route.ts` | Pass profile IDs to send functions |
| `app/api/medjobs/apply-to-provider/route.ts` | Pass profile IDs to send functions |

---

## What Does NOT Change

- All 23 family notifications continue firing
- All 15 provider notifications continue firing
- All 9 caregiver notifications continue firing
- Marketing/transactional emails always send (no preference check)
- WhatsApp opt-in flow (already working)
- Email logging (already working)
- WhatsApp logging (already working)
- Cron jobs (unchanged)
- Slack alerts (unchanged)

---

## Future Work (Out of Scope)

1. **Naming cleanup:** Standardize caregiver/student/medjobs terminology
2. **Build missing notifications:** saved_provider_alerts, profile_insights, job_alerts
3. **Unsubscribe links:** Add one-click unsubscribe for marketing emails
4. **GDPR/CCPA:** Notification data deletion on account delete

---

## Summary

| Before | After |
|--------|-------|
| 4 fake toggles per account type | 2-3 real toggles per account type |
| Toggles do nothing | Toggles control activity notifications |
| SMS has no preference | SMS respects new_leads toggle for providers |
| Confusing UI | Clear, honest UI |
| Marketing could be turned off | Marketing always sends |
