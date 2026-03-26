# Parked Feature: Review Requests (In Person + Send Invites)

> **Status:** Parked as of March 2026
> **Reason:** Google Reviews integration handles most review collection needs. Revisit when ready to expand provider-initiated review collection.

## What This Feature Does

Allows providers to proactively request reviews from families/clients via two methods:

### 1. Send Invites Tab
- Provider adds recipients (name + email/phone)
- Customizes a message
- Sends email invitations with a link to `/review/{slug}`
- Families receive branded email and can submit reviews without logging in

### 2. In Person Tab
- Generates a shareable link: `{origin}/review/{slug}?ref=qr`
- One-click copy for texting to families or sharing with staff
- Intended for on-site review collection during care visits

## Files in This Archive

| File | Description |
|------|-------------|
| `RequestNowContent.tsx` | The "Send Invites" form component (recipient management, message customization, send button) |
| `api-review-requests.ts` | API endpoint that sends review request emails |
| `email-template-snippet.ts` | Email template function for review request emails |
| `types.ts` | TypeScript types for the feature |

## How to Re-integrate

### 1. Restore the API endpoint
Copy `api-review-requests.ts` back to `app/api/review-requests/route.ts`

### 2. Add the email template
Add `reviewRequestEmail()` from `email-template-snippet.ts` to `lib/email-templates.tsx`

### 3. Restore the tabs in the reviews page
In `app/provider/reviews/page.tsx`:

1. Add the types from `types.ts`
2. Add the `RequestNowContent` component from `RequestNowContent.tsx`
3. Update the `TABS` array to include:
   ```typescript
   const TABS: { id: TabFilter; label: string }[] = [
     { id: "request_onsite", label: "In Person" },
     { id: "request_now", label: "Send Invites" },
     { id: "all", label: "All Reviews" },
     { id: "replied", label: "Replied" },
   ];
   ```
4. Update `TabFilter` type to include `"request_now" | "request_onsite"`
5. Wire up the tab content rendering

### 4. Verify the public review page still exists
The `/review/[slug]` page should already exist — it's the landing page for review links.

## Dependencies

- `lib/email.ts` — `sendEmail()` function
- `lib/email-templates.tsx` — email layout helpers
- `lib/admin.ts` — `getServiceClient()` for database access
- Supabase tables: `business_profiles`, `accounts`, `review_request_logs`

## Notes

- SMS sending was shown in UI but never implemented (API skips phone-only clients)
- The `/review/[slug]` public page remains active — families can still submit reviews organically
- Review request logs are stored in `review_request_logs` table for analytics
