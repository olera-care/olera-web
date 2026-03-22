# Plan: Add & Delete Providers in Admin Directory

Created: 2026-03-17
Status: Not Started

## Goal

Enable admin users to add new providers and soft-delete providers directly from the admin directory, without needing to go through Supabase.

## Success Criteria

- [ ] "Add Provider" button on directory list page creates a new provider and navigates to its edit page
- [ ] Providers can be soft-deleted from the list page via a row action (without opening detail page)
- [ ] Soft-deleted providers can be restored from the list page (when on "Deleted" tab)
- [ ] All actions are audit-logged
- [ ] Existing edit functionality remains unchanged

## Tasks

### Phase 1: API — POST endpoint for creating providers

- [ ] 1. Add `POST` handler to `app/api/admin/directory/route.ts`
      - Files: `app/api/admin/directory/route.ts`
      - Accept: `{ provider_name, provider_category }` (minimum required)
      - Generate `provider_id` (UUID via `crypto.randomUUID()`)
      - Generate `slug` via `generateProviderSlug(name, null)` (no state yet)
      - Insert into `olera-providers` with defaults: `deleted: false, deleted_at: null`
      - Log audit action: `create_directory_provider`
      - Return: `{ provider: { provider_id } }`
      - Verify: `curl -X POST /api/admin/directory` returns new provider_id

### Phase 2: API — PATCH endpoint for soft-delete/restore from list

- [ ] 2. The existing `PATCH /api/admin/directory/[providerId]` already handles `deleted` field changes with auto `deleted_at` — no new API needed. The frontend will call PATCH with `{ deleted: true }` or `{ deleted: false }`.
      - Files: none (already works)
      - Verify: Confirm PATCH with `{ deleted: true }` sets `deleted_at` automatically

### Phase 3: Frontend — Add Provider button + creation modal

- [ ] 3. Add "Add Provider" button and simple creation modal to the directory list page
      - Files: `app/admin/directory/page.tsx`
      - Pattern: Follow content page's `handleCreate` pattern
      - Button: "+ Add Provider" in header row (next to title/count)
      - Modal: Simple form with provider_name (text input) + provider_category (dropdown using `PROVIDER_CATEGORIES`)
      - On submit: POST to `/api/admin/directory`, then `router.push(/admin/directory/${id})`
      - Loading state: button shows "Creating..." while in flight
      - Verify: Click button → fill modal → see redirect to new provider detail page

### Phase 4: Frontend — Delete/Restore actions on list rows

- [ ] 4. Add action column to the directory table with delete/restore buttons
      - Files: `app/admin/directory/page.tsx`
      - Add "Actions" column header to the table
      - For published providers: red "Delete" button (trash icon or text)
      - For deleted providers (on "Deleted" tab): green "Restore" button
      - Confirmation: `window.confirm()` before delete (simple, no modal needed)
      - On confirm: PATCH `/api/admin/directory/[providerId]` with `{ deleted: true/false }`
      - Optimistic UI: update local state immediately, revert on error
      - Stop row click propagation on action button (don't navigate to detail)
      - Verify: Delete a provider from list → see status change to "Deleted". Switch to Deleted tab → restore it → see status change back.

### Phase 5: Polish

- [ ] 5. Toast feedback for add/delete/restore actions
      - Files: `app/admin/directory/page.tsx`
      - Success: "Provider created", "Provider deleted", "Provider restored"
      - Error: Show API error message
      - Verify: See toast messages after each action

## Risks

- **Slug collisions**: Two providers with the same name could generate the same slug. Mitigation: append a short random suffix if the slug already exists (check in POST handler), or just let the detail page handle slug uniqueness later.
- **Accidental deletion**: Mitigated by soft delete + confirmation dialog + restore capability.
- **provider_id format**: Existing IDs look like UUIDs from Google Places. Using `crypto.randomUUID()` for new ones is compatible.

## Architecture Notes

- **No new files needed** — all changes fit in existing route + page files
- **Reuses existing PATCH** for delete/restore — no new endpoint
- **One new POST handler** in the existing `route.ts` (same file as GET)
- **Content page pattern** is the exact precedent for the "create and redirect" flow

## Notes

- The detail page already has a "Deleted" checkbox that handles soft delete — this plan adds the *quick action* on the list page so admins don't have to open each provider
- The "Add Provider" flow intentionally captures minimal data upfront (name + category), then redirects to the full edit form — this matches how Content articles work
