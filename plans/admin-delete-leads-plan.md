# Plan: Admin Lead Deletion (Inline + Bulk)

Created: 2026-03-20
Status: Not Started

## Goal

Add inline and bulk hard-delete for connections on the admin leads page (`/admin/leads`), with confirmation dialogs and audit logging.

## Success Criteria

- [ ] Each row has a trash icon that deletes a single lead after confirmation
- [ ] Checkbox column enables selecting multiple leads, with a "Delete selected" bulk action
- [ ] Confirmation dialog shows count and is required before any delete
- [ ] Deletions are hard deletes from the `connections` table
- [ ] Every deletion is audit-logged with `logAuditAction()`
- [ ] Optimistic UI removal with rollback on failure

## Tasks

### Phase 1: API — DELETE handler

- [ ] 1. Add DELETE handler to `app/api/admin/leads/route.ts`
      - Accepts JSON body: `{ ids: string[] }` (works for single or bulk)
      - Auth: `getAuthUser()` + `getAdminUser()` guard
      - Fetches connection details before delete (for audit log)
      - Hard deletes from `connections` table using `.in("id", ids)`
      - Audit logs each deletion: action `"delete_lead"`, targetType `"connection"`
      - Returns `{ success: true, deleted: number }`
      - Files: `app/api/admin/leads/route.ts`
      - Verify: `curl -X DELETE /api/admin/leads` with test IDs returns success

### Phase 2: UI — Inline delete per row

- [ ] 2. Add trash icon button to each row's Actions column
      - Red trash icon (inline SVG or heroicon), visible on hover or always
      - Clicking opens a confirmation dialog: "Delete this lead from {from_name} → {to_name}?"
      - On confirm: call DELETE API with `[lead.id]`, optimistically remove row
      - On failure: re-add row, show error toast
      - Files: `app/admin/leads/page.tsx`
      - Verify: Click trash on a row → confirmation appears → confirm → row disappears

### Phase 3: UI — Bulk select + delete

- [ ] 3. Add checkbox column and bulk delete bar
      - Checkbox in header (select all visible) + checkbox per row
      - `selectedIds: Set<string>` state
      - When selections exist, show floating/sticky bar: "{N} selected — Delete"
      - "Delete" opens confirmation: "Permanently delete {N} leads?"
      - On confirm: call DELETE API with all selected IDs, optimistically remove rows, clear selection
      - On failure: rollback, show error
      - Files: `app/admin/leads/page.tsx`
      - Verify: Select 3 rows → bulk delete bar appears → confirm → rows removed

### Phase 4: Confirmation dialog component

- [ ] 4. Build inline confirmation dialog (no external deps)
      - Simple modal overlay with title, message, Cancel + Delete buttons
      - Delete button is red, Cancel is gray
      - Can be shared between inline and bulk flows
      - Kept inside `page.tsx` or extracted to a small local component if it helps readability
      - Files: `app/admin/leads/page.tsx`
      - Verify: Dialog renders centered, dismisses on Cancel, fires callback on Delete

## Implementation Order

Task 4 (dialog) → Task 1 (API) → Task 2 (inline delete) → Task 3 (bulk delete)

Build the dialog first since both UI tasks depend on it. API next since both UI tasks call it.

## Risks

- **Accidental bulk delete**: Mitigated by confirmation dialog showing exact count
- **Stale UI after delete**: Optimistic removal handles this; rollback on API failure
- **No undo**: Hard delete is permanent — confirmation dialog is the safety net. Audit log preserves a record of what was deleted.

## Notes

- This directly enables the "Delete fake seed connections" item from the scratchpad
- The DELETE API accepts an array, so a single endpoint handles both inline (1 ID) and bulk (N IDs)
- Follow the same auth + audit pattern from `app/api/admin/care-seekers/[seekerId]/route.ts`
- No new dependencies needed — confirmation dialog is plain React + Tailwind
