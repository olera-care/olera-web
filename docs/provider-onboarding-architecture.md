# Provider Onboarding Architecture

*Last updated: March 26, 2026*

---

## The Problem

Providers don't sign up for Olera. We build their listings from pipeline data and email them when families reach out. That first email click is the entire acquisition moment — and it was full of friction.

**Before:** Email → onboard page → verify email (OTP) → auth modal → sign in → claim → redirect. Nine steps. Providers burned by APFM and Caring.com would bounce at step 2.

**After:** Email → click → in. One step.

---

## Core Insight

We were asking providers to prove they own the email we just emailed them at. The email IS the verification. A signed token in the link proves they received it. Everything else was redundant.

---

## Architecture

### Two-Tier Trust Model

| Tier | How it's granted | What it unlocks |
|------|-----------------|-----------------|
| **Full Access** | One-click from email (signed token) | Everything: leads with full PII, Q&A, reviews, profile, gallery, editing |
| **Trusted** | Phone call from Olera team | Destructive actions: delete listing, transfer ownership |

No middle tier. No OTP. No progressive reveal. The email link grants full access. Destructive actions (which happen maybe 2-3 times per week) require a human phone call.

### Why Not More Gates?

At 5-10 leads/day with ~10% provider engagement, the volume is low enough for human oversight. The risk of a wrong-email recipient seeing seeker info is real but low-probability. The risk of a real provider bouncing from friction is high-probability and high-cost. We optimize for the common case and observe the edge cases.

---

## How It Works

### 1. Email Sending (Token Generation)

When any provider notification email is sent (lead, question, review), a signed claim token is embedded in the URL.

**Token format:** HMAC-SHA256 signed JSON containing `{ providerId, email, expiresAt, signature }`, base64url-encoded.

**Token properties:**
- Self-validating (no database lookup needed)
- 72-hour expiry
- Tied to a specific provider email

**Email link format:**
```
/provider/{slug}/onboard?action=lead&actionId={id}&token={signed-jwt}
```

**Files:** `lib/claim-tokens.ts` (token generation), three email sending routes

### 2. One-Click Flow (Token Consumption)

When the provider clicks the email link:

1. Onboard page extracts `token` param
2. Validates token via `/api/claim/validate-token` (signature + expiry check)
3. Auto-creates auth account via `/api/auth/auto-sign-in` (generateLink + verifyOtp)
4. Establishes browser session
5. Finalizes listing claim via `/api/claim/finalize`
6. Redirects to destination (`/provider/connections`, `/provider/qna`, or `/provider/reviews`)

Total time: ~2 seconds. Provider sees a brief "Finalizing..." state, then they're in the portal.

**Fallback:** If any step fails (token expired, auto-sign-in error, already claimed by someone else), the page falls back to the notification card with a "Verify your email to respond" button — the previous flow still works as a safety net.

**File:** `app/provider/[slug]/onboard/page.tsx`

### 3. Observability (Slack + Activity Center)

Every one-click access is logged and alerted:

**Activity Center:** `one_click_access` event written to `provider_activity` table with metadata: provider name, email, action type, action ID, source.

**Slack alert:** Fires on every one-click access:
```
One-Click Provider Access
Provider: Sunrise Senior Care
Email: info@sunrisesenior.com
Action: Viewed lead
Listing: [View]
```

At current volume (~1 lead/day where a provider actually engages), the team can glance at every Slack ping and confirm it looks normal. If something looks suspicious (random Gmail on a facility listing, viewed PII but never responded), investigate manually.

**Files:** `lib/slack.ts` (alert builder), `app/api/activity/track/route.ts` (event logging + Slack dispatch)

---

## What's Public vs. Private

| Data | Sensitivity | Handling |
|------|------------|----------|
| Seeker name, email, phone, care needs | Private | Full access after one-click token. Masked (first name only) on onboard preview if token fails. |
| Reviews | Public | Shown unmasked everywhere. Already visible on the provider's public page. |
| Q&A | Public | Shown unmasked everywhere. Already visible on the provider's public page. |
| Provider profile, gallery, contact info | Public | Visible on onboard dashboard as the "Trojan horse" — shows platform value before verification. |
| Answering a question | Moderate | Requires claimed + signed-in state (prevents impersonation). |
| Profile editing | Moderate | Requires claimed + signed-in state. |
| Listing deletion, ownership transfer | High | Requires phone call from Olera team. |

---

## The Trojan Horse

The one-click flow doesn't just reduce friction — it changes the acquisition strategy.

**Old model:** Lead email → verification wall → claim → portal access. The provider had to work to see value.

**New model:** Lead email → one click → they're in the portal seeing their leads, reviews, profile, gallery, completeness score. The lead was the hook. The portal is the product demo. They didn't sign up for a platform — they clicked to see who reached out. But now they're inside a polished directory with their profile already built, reviews already collected, and tools ready to use.

This is why the onboard page shows the full dashboard below the notification card when the token flow fails (fallback path). Even without one-click, the provider sees enough platform value to justify verifying.

---

## Scaling Considerations

**Current state (5-10 leads/day):** Manual Slack review is feasible. Every PII access is eyeballed by the team.

**~100 leads/day:** Automate flagging. Only surface anomalies in Slack (mismatched email domains, view-without-response patterns, multiple claims from same email). Activity Center handles routine monitoring.

**~1000 leads/day:** Add rate limiting on token consumption. Consider short-lived tokens (24h instead of 72h). Auto-flag and auto-freeze suspicious patterns. The two-tier model still holds — just the observability layer gets smarter.

---

## Entry Points Summary

| Entry Point | Token? | Flow |
|-------------|--------|------|
| Lead email notification | Yes | One-click → portal |
| Question email notification | Yes | One-click → portal |
| Review email notification | Yes | One-click → portal |
| Campaign marketing email | Yes (existing) | Pre-verified → claim |
| "Manage this listing" on public page | No | OTP verification → claim |
| Direct URL (organic discovery) | No | Full onboard flow |

---

## Action Items

### Ship Now (This PR)
- [ ] **Merge PR #421 to staging** — all Phase 1 + Phase 2 code is ready, build passes
- [ ] **Run backfill script** — `node scripts/backfill-source-provider-id.js` (dry-run first, then `--apply`). Links existing unlinked business_profiles to olera-providers records. Fixes "0 reviews" for providers who created accounts from scratch.
- [ ] **Test one-click flow end-to-end** — Send a test lead to a test provider email, click the link, confirm one-click lands in portal. Confirm Slack alert fires.

### Ship This Week
- [ ] **Improve pipeline email accuracy** — The one-click architecture trusts the email. Bad emails = wrong person gets access. Audit the top 50 providers by lead volume — verify their pipeline emails are correct. This is the highest-leverage action for the whole system.
- [ ] **Add `CLAIM_TOKEN_SECRET` to Vercel env vars** — Currently falls back to `SUPABASE_SERVICE_ROLE_KEY`. Dedicated secret is better practice. Generate a random 64-char string.
- [ ] **Test the fallback path** — Open a notification link with an expired/invalid token. Confirm the notification card shows correctly with verify button. This is the safety net.

### Ship This Month
- [ ] **Seeker-side friction reduction** — Apply the same "form-first, auth-after" pattern to the seeker connection flow. The "Connect" button currently opens an auth modal before the form. Should be: fill form (name, email, phone, care type, message) → submit → account created silently from form data. Doubles as signup.
- [ ] **Phone call gate for Trusted tier** — Build the UI for "Request deletion" → "Our team will call [phone] to verify" → admin approval workflow. Low urgency (maybe 2-3 requests ever) but should exist before it's needed.
- [ ] **Anomaly detection in Activity Center** — Auto-flag suspicious one-click access patterns: mismatched email domains (Gmail on a facility), view-without-response, multiple claims from same IP. Surface as a filtered view in admin, not Slack noise.

### Monitor
- [ ] **Track one-click success rate** — What % of email clicks result in successful one-click flow vs. fallback to notification card? If fallback rate is high, debug the common failure mode.
- [ ] **Track provider activation after one-click** — Do providers who enter via one-click actually come back? Complete their profile? Respond to leads? This is the metric that validates the whole approach.

---

## Implementation Reference

| Component | File |
|-----------|------|
| Token generation + validation | `lib/claim-tokens.ts` |
| Auto-sign-in endpoint | `app/api/auth/auto-sign-in/route.ts` |
| Token validation endpoint | `app/api/claim/validate-token/route.ts` |
| Claim finalization | `app/api/claim/finalize/route.ts` |
| Onboard page (one-click flow) | `app/provider/[slug]/onboard/page.tsx` |
| Lead email sending | `app/api/connections/request/route.ts` |
| Question email sending | `app/api/questions/route.ts` |
| Review email sending | `app/api/reviews/public/route.ts` |
| Activity tracking | `app/api/activity/track/route.ts` |
| Slack alerts | `lib/slack.ts` |
| Notification card UI | `components/provider-onboarding/ActionCard.tsx` |
| Dashboard shell | `components/provider-onboarding/SmartDashboardShell.tsx` |
| Backfill script | `scripts/backfill-source-provider-id.js` |
