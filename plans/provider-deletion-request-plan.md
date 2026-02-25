# Plan: Provider Deletion Request & Admin Approval

Created: 2026-02-25
Status: Not Started
Branch: `relaxed-babbage` (from `staging`)

## Goal

Allow providers to request deletion of their listing pages, and admins to approve/deny those requests — porting the existing iOS flow to web with polish-pass quality.

## Success Criteria

- [ ] Provider can request deletion of their claimed listing from the Provider Hub
- [ ] Provider sees confirmation that request was submitted (with "2-3 business days" messaging)
- [ ] Provider cannot re-request deletion while one is pending
- [ ] Admin sees "Deletions" tab in admin dashboard with Requests and History sub-tabs
- [ ] Requests sub-tab shows pending deletion requests with provider info, email, role, days pending
- [ ] Admin can approve deletion (soft-deletes the `olera-providers` listing)
- [ ] Admin can deny deletion (clears the request, provider returns to normal)
- [ ] History sub-tab shows previously deleted providers with Restore and Purge options
- [ ] All actions are audit-logged
- [ ] Empty states match iOS ("No deletion requests — All provider pages are active")

## Architecture Decision: Schema Approach

**Add columns to `business_profiles`** (matching how iOS uses `provider_claims`):

| Column | Type | Purpose |
|--------|------|---------|
| `deletion_requested` | BOOLEAN DEFAULT FALSE | Flag: provider wants deletion |
| `deletion_requested_at` | TIMESTAMPTZ | When they requested |
| `deletion_approved_at` | TIMESTAMPTZ | When admin approved |

This is simpler than a separate table — no joins needed, queries stay fast, and it mirrors the iOS pattern exactly.

**Soft-delete target**: When approved, the linked `olera-providers` row gets `deleted=true, deleted_at=NOW()` (this column already exists). The `business_profiles.claim_state` changes to `'rejected'` (or we could add a `'deleted'` state — TBD).

## Tasks

### Phase 1: Database Migration
- [ ] **1. Create migration `006_deletion_request_columns.sql`**
  - Files: `supabase/migrations/006_deletion_request_columns.sql`
  - Depends on: none
  - Changes:
    - `ALTER TABLE business_profiles ADD COLUMN deletion_requested BOOLEAN DEFAULT FALSE;`
    - `ALTER TABLE business_profiles ADD COLUMN deletion_requested_at TIMESTAMPTZ;`
    - `ALTER TABLE business_profiles ADD COLUMN deletion_approved_at TIMESTAMPTZ;`
  - Verify: Run migration against Supabase, confirm columns exist

- [ ] **2. Update TypeScript types**
  - Files: `lib/types.ts`
  - Depends on: 1
  - Changes:
    - Add `deletion_requested?: boolean`, `deletion_requested_at?: string`, `deletion_approved_at?: string` to `BusinessProfile` interface
  - Verify: `npm run build` passes with no type errors

### Phase 2: Provider Portal — Request Deletion UI
- [ ] **3. Create API route: `POST /api/portal/request-deletion`**
  - Files: `app/api/portal/request-deletion/route.ts` (new)
  - Depends on: 2
  - Logic:
    1. Auth check (getUser)
    2. Validate profileId in body
    3. Verify ownership (profile.account_id matches user's account)
    4. Verify profile is organization or caregiver type (not family)
    5. Verify profile has `source_provider_id` (is a claimed listing, not user-created)
    6. Verify `deletion_requested` is not already true
    7. PATCH `business_profiles`: `deletion_requested=true, deletion_requested_at=NOW()`
    8. Return `{ success: true }`
  - Verify: cURL/Postman test with valid profile

- [ ] **4. Add "Request Listing Deletion" section to provider settings**
  - Files: `app/portal/settings/page.tsx`
  - Depends on: 3
  - UI (matching iOS screenshot):
    - Card with title "Request Listing Deletion"
    - Subtitle: "We'll review your request and remove this listing within 2-3 business days. This cannot be undone."
    - Red outlined "Request Deletion" button
    - "Cancel" button
    - Confirmation modal before submitting
    - Only visible for organization/caregiver profiles with `source_provider_id`
    - If `deletion_requested` is already true, show disabled state: "Deletion requested — under review"
  - Verify: Visual match to iOS screenshot, button submits correctly

### Phase 3: Admin Dashboard — Deletions Tab
- [ ] **5. Create API route: `GET /api/admin/deletions`**
  - Files: `app/api/admin/deletions/route.ts` (new)
  - Depends on: 2
  - Logic:
    - Admin auth check (getAuthUser + getAdminUser)
    - Query param: `tab=requests|history`
    - **Requests**: `SELECT * FROM business_profiles WHERE deletion_requested=true ORDER BY deletion_requested_at DESC`
      - Join with accounts for email
    - **History**: `SELECT * FROM "olera-providers" WHERE deleted=true ORDER BY deleted_at DESC`
      - Also fetch business_profiles with `claim_state='rejected'` and `deletion_approved_at IS NOT NULL` for claims that were deleted
    - Return both datasets
  - Verify: cURL test with admin auth token

- [ ] **6. Create API route: `PATCH /api/admin/deletions/[profileId]`**
  - Files: `app/api/admin/deletions/[profileId]/route.ts` (new)
  - Depends on: 5
  - Actions via `action` body param:
    - **`approve`**:
      1. Look up the profile's `source_provider_id`
      2. If linked provider exists in `olera-providers`: PATCH `deleted=true, deleted_at=NOW()`
      3. PATCH `business_profiles`: `deletion_requested=false, deletion_approved_at=NOW(), claim_state='rejected'`
      4. Audit log: `action="approve_deletion"`
    - **`deny`**:
      1. PATCH `business_profiles`: `deletion_requested=false, deletion_requested_at=NULL`
      2. Audit log: `action="deny_deletion"`
    - **`restore`**:
      1. PATCH `olera-providers`: `deleted=false, deleted_at=NULL`
      2. PATCH `business_profiles`: `claim_state='claimed', deletion_approved_at=NULL`
      3. Audit log: `action="restore_provider"`
    - **`purge`**:
      1. DELETE from `olera-providers` WHERE `provider_id=X`
      2. DELETE associated `business_profiles` row (or revert to unclaimed)
      3. Audit log: `action="purge_provider"`
  - Verify: Test each action via cURL

- [ ] **7. Create admin Deletions page**
  - Files: `app/admin/deletions/page.tsx` (new)
  - Depends on: 5, 6
  - UI (matching iOS screenshots):
    - **Two sub-tabs**: Requests (with count badge) | History (with count badge)
    - **Requests tab**:
      - Warning banner: "Providers listed here have requested deletion of their page."
      - Cards showing: provider name, "Requested X days ago", email, role
      - Red "Review Deletion Request" button per card
      - Clicking opens confirmation dialog: "Approving will soft-delete {name}. You can restore or permanently purge it later from History."
      - Two buttons: "Approve Deletion" (red) | "Deny Request"
      - Empty state: green checkmark icon, "No deletion requests", "All provider pages are active"
    - **History tab**:
      - Info text: "Previously deleted providers. Restore or permanently purge records."
      - Cards showing: provider name (strikethrough), city/state, type, phone, ID, DELETED badge
      - "Restore or Purge" button per card
      - Confirmation dialogs for restore and purge actions
  - Verify: Visual match to iOS screenshots, all actions work

- [ ] **8. Add Deletions tab to admin sidebar and dashboard**
  - Files: `components/admin/AdminSidebar.tsx`, `app/admin/page.tsx`
  - Depends on: 7
  - Changes:
    - Add "Deletions" link in AdminSidebar (between Claims and Directory, or after Claims)
    - Add deletion request count card on admin overview dashboard
    - Badge with pending count (like iOS shows)
  - Verify: Navigation works, count displays correctly

### Phase 4: Polish & Edge Cases
- [ ] **9. Handle edge cases**
  - Files: various
  - Depends on: 4, 7
  - Cases:
    - Provider with pending deletion request tries to edit their profile → show read-only banner
    - Provider profile appears in profile switcher with "Pending deletion" indicator
    - Multiple profiles: deleting one claimed listing doesn't affect others
    - Provider who was denied can re-request later
    - Admin approves deletion but provider_id doesn't exist in olera-providers (user-created listing) → handle gracefully
  - Verify: Manual testing of each case

- [ ] **10. Update admin dashboard audit formatting**
  - Files: `app/admin/page.tsx`
  - Depends on: 6
  - Changes:
    - Add formatAction cases for: `request_deletion`, `approve_deletion`, `deny_deletion`, `restore_provider`, `purge_provider`
    - Badge variants: red for approve/purge, green for restore, yellow for request/deny
  - Verify: Audit log entries render correctly on dashboard

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration on shared `business_profiles` table | Could affect iOS if they read this table | Columns are nullable with defaults — no breaking change |
| Soft-deleting from `olera-providers` affects search results on both web and iOS | Intended behavior — deletion should be cross-platform | Verify existing `.not('deleted','is',true)` filters already handle this |
| Purge is irreversible | Data loss | Require typed confirmation ("purge") before permanent delete |
| RLS policies may block admin operations | Admin can't approve | Use service role client for admin mutations (existing pattern) |
| Profile switcher gets cluttered with deleted profiles | UX issue | Filter out profiles where `deletion_requested=true` from switcher, or show with badge |

## Data Flow Diagram

```
PROVIDER FLOW:
Provider Hub Settings → "Request Listing Deletion" button
  → POST /api/portal/request-deletion { profileId }
  → PATCH business_profiles: deletion_requested=true, deletion_requested_at=NOW
  → Provider sees "Deletion requested — under review" state

ADMIN FLOW:
Admin Dashboard → Deletions tab → Requests sub-tab
  → GET /api/admin/deletions?tab=requests
  → Shows pending requests with provider info

  → Click "Review Deletion Request"
    → APPROVE: PATCH /api/admin/deletions/{id} { action: "approve" }
      → olera-providers: deleted=true, deleted_at=NOW
      → business_profiles: deletion_requested=false, deletion_approved_at=NOW, claim_state='rejected'
      → Provider listing disappears from search
      → Moves to History tab

    → DENY: PATCH /api/admin/deletions/{id} { action: "deny" }
      → business_profiles: deletion_requested=false, deletion_requested_at=NULL
      → Provider returns to normal

Admin Dashboard → Deletions tab → History sub-tab
  → GET /api/admin/deletions?tab=history
  → Shows deleted providers

  → RESTORE: PATCH /api/admin/deletions/{id} { action: "restore" }
    → olera-providers: deleted=false, deleted_at=NULL
    → business_profiles: claim_state='claimed', deletion_approved_at=NULL
    → Provider reappears in search

  → PURGE: PATCH /api/admin/deletions/{id} { action: "purge" }
    → DELETE from olera-providers
    → business_profiles: claim_state='unclaimed' (or delete)
    → Permanent removal
```

## Notes

- The iOS uses `provider_claims` table while web uses `business_profiles` — these are parallel tables for the same concept. We add deletion columns to `business_profiles` to stay consistent with web architecture.
- The `olera-providers` table already has `deleted` and `deleted_at` columns — we just need to use them.
- Existing admin directory page already has a "Deleted" tab and manual checkbox — the new Deletions page is for the formal request/approval workflow.
- Consider: should the deletion request also be visible in the admin directory detail page? Probably yes — show a banner "This provider has requested deletion" with approve/deny links.
