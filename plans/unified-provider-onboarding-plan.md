# Unified Provider Onboarding Plan

## Goal
Consolidate all provider acquisition paths (leads, questions, reviews, interviews, claim, signup) into one unified flow that uses email as the single authentication gateway, landing on the shared `/provider/{slug}/onboard` page with consistent ActionCard visuals.

---

## What's Already Done (committed on `claude/keen-wescoff`)

### MedJobs Interview → Shared Onboard Page
- **ActionCard** updated with `notification-interview`, `notification-claim`, `notification-signup` states and rendering blocks
- **validate-token API** handles `action=interview` — fetches interview data from `interviews` table with student profile join
- **finalize API** maps `interview` action → redirect to `/provider/caregivers`
- **Onboard page** passes `action=interview` through the flow
- **Footer** text changed: "Claim Your Listing" → "Find Your Organization"
- **Email templates** added: `claimVerificationEmail()`, `signupVerificationEmail()`

### Action → Destination Mapping
| Action | Destination |
|---|---|
| lead | `/provider/connections?id={actionId}` |
| question | `/provider/qna?id={actionId}` |
| review | `/provider/reviews?id={actionId}` |
| message | `/provider/inbox?id={actionId}` |
| campaign | `/provider` |
| interview | `/provider/caregivers` |
| claim | `/provider` (dashboard) |
| signup | `/provider` (profile setup) |

---

## Phase 2: Onboarding Wizard Rewrite

### Current State
- `/provider/onboarding` has a multi-step wizard: search → verify → create → potential-matches → auth
- `/for-providers/claim` is a separate search page
- Multiple entry points with different UX patterns
- Duplicate detection happens late (only during "create")

### New Flow: 3 Screens Max

#### Screen 1: Search Form
- **Fields:** Organization name (required), City/State (required), Email (required)
- **One button:** "Find Your Organization"
- **Entry points:** Footer link, navbar dropdown, marketing page CTAs
- Marketing page search bars pre-fill org name, user just adds city + email
- Runs ONE comprehensive search across both `olera-providers` AND `business_profiles`
- Search matches on: name (fuzzy) + city/state, OR exact email match

#### Screen 2: Search Results
Cards with prioritized actions:
- **Email match + claimed account** → "Sign In" button (opens existing `UnifiedAuthModal`)
- **Email match + unclaimed** → "Manage" button (priority)
- **Name/city match + unclaimed** → "Manage" button
- **Name/city match + claimed by someone else** → "Dispute" (lower priority, separate flow)
- **Bottom card:** "Can't find your organization? Create a new one"

Priority order: Sign In > Manage > Dispute

#### Screen 3: Check Your Email
- Triggered by clicking "Manage" OR "Create new"
- "We sent a verification link to **j***@sunrise.com**"
- "Click the link in your email to get started"
- Resend button
- After clicking email → lands on `/provider/{slug}/onboard` → ActionCard

### Flow Diagram
```
Screen 1 (Search) → Screen 2 (Results)
                        ├── "Sign In"  → Auth modal → /provider (done)
                        ├── "Manage"   → Screen 3 (Check email) → Inbox → /provider/{slug}/onboard
                        └── "Create"   → Screen 3 (Check email) → Inbox → /provider/{slug}/onboard
```

### Key Principle
**Search hard first, create only as last resort.** Three fields (name, city, email) give us enough signal to run a comprehensive search across 50,000+ providers. Only when we're confident the org doesn't exist do we create a new one.

### What "Manage" Does (Backend)
1. We have their email from Screen 1
2. Generate claim token with `generateClaimToken(slug, email)`
3. Send `claimVerificationEmail()` to their email
4. Show Screen 3

### What "Create New" Does (Backend)
1. We have name, city, email from Screen 1
2. Create ghost `business_profile` (unclaimed, no account_id)
3. Generate claim token
4. Send `signupVerificationEmail()` to their email
5. Show Screen 3

### Text Changes
- **Footer:** "Claim Your Listing" → "Find Your Organization" ✅ (done)
- **Navbar dropdown:** "List Your Organization" → "Find Your Organization"
- Both point to `/provider/onboarding` (the rewritten wizard)

---

## Phase 3: Future Considerations

### Duplicate Detection Improvements
- Current search only uses `ilike` (fuzzy substring) — could miss variations
- No phone number matching in search (both tables have phone fields)
- No email normalization (gmail `+` aliases treated as different)
- Could add phone as optional 4th field for better matching

### Dispute Flow
- Separate from this work — has its own path
- Triggered when someone finds a claimed listing they believe is theirs
- Existing dispute flow can stay as-is

### Provider Count
- `olera-providers`: ~50,000+ records (per TJ, recently expanded)
- `business_profiles`: growing — includes claimed profiles + new signups
- Many `olera-providers` records lack email addresses — name+city search is critical

---

## Implementation Order
1. ~~MedJobs interview → shared onboard page~~ ✅
2. Rewrite Screen 1 (search form with 3 fields)
3. Rewrite Screen 2 (results with Sign In / Manage / Create)
4. Build Screen 3 (check your email confirmation)
5. Wire "Manage" → send claim email → Screen 3
6. Wire "Create" → create ghost profile → send signup email → Screen 3
7. Add `notification-claim` and `notification-signup` ActionCard rendering
8. Update navbar dropdown text
9. Remove old `/for-providers/claim` page (now redundant)
10. Test end-to-end: marketing page → search → manage → email → onboard → dashboard
