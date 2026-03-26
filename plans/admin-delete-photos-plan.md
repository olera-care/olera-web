# Plan: Admin Dashboard — Delete Provider Photos

Created: 2026-03-25
Status: Not Started
Notion: [Task](https://www.notion.so/Admin-dashboard-Add-the-ability-for-providers-to-delete-photos-3295903a0ffe805dbc3bec53b1eca849)

## Goal

Add a "Delete" button to each photo in the admin provider detail page so TJ can remove bad/irrelevant images.

## Success Criteria

- [ ] Each image thumbnail (classified + raw) has a red "Delete" button
- [ ] Clicking Delete shows a browser `confirm()` dialog before proceeding
- [ ] Deletion removes the URL from `provider_images` pipe-separated string
- [ ] Deletion removes the row from `provider_image_metadata` (if exists)
- [ ] If the deleted image was the hero, `hero_image_url` is cleared on `olera-providers`
- [ ] If the image is in Supabase Storage (`provider-directory-images` bucket), the file is deleted
- [ ] Action is audit-logged
- [ ] UI refreshes after deletion (same pattern as other image actions)

## Tasks

### Phase 1: API — Add `delete_image` action (backend)

- [ ] 1. Add `delete_image` to the PATCH handler in the images endpoint
      - Files: `app/api/admin/images/[providerId]/route.ts`
      - Logic:
        1. Validate `image_url` is provided
        2. Delete row from `provider_image_metadata` where `provider_id` + `image_url` match
        3. Fetch current `provider_images` from `olera-providers`, remove the URL, update the field
        4. If `hero_image_url` === deleted URL, set `hero_image_url = null`
        5. If URL contains the Supabase storage bucket host, extract the path and call `storage.from(BUCKET).remove([path])`
        6. Audit log the action
      - Verify: `curl -X PATCH` with `action: "delete_image"` returns `{ success: true }`

### Phase 2: UI — Add Delete button to image grid (frontend)

- [ ] 2. Add "Delete" button to classified image thumbnails
      - Files: `app/admin/directory/[providerId]/page.tsx`
      - Add a red delete button in the `flex-wrap gap-1` div alongside "Mark Photo", "Mark Logo", "Set Hero"
      - Wrap the `handleImageAction` call in a `window.confirm("Delete this image?")` guard
      - Verify: Button visible on each classified image, confirm dialog appears on click

- [ ] 3. Add "Delete" button to raw image thumbnails
      - Files: `app/admin/directory/[providerId]/page.tsx`
      - Same pattern as task 2, in the raw images fallback grid
      - Verify: Button visible on each raw image

## Risks

- **External CDN images** (e.g., `cdn-api.olera.care`, `lh3.googleusercontent.com`): Storage delete will be skipped for these — only the DB reference is removed. The file continues to exist at the CDN but is no longer linked to the provider. This is fine.
- **Pipe-separated string manipulation**: Careful to handle edge cases (first item, last item, single item, URL with spaces). Will use split/filter/join pattern matching the upload route.

## Notes

- Matches existing patterns exactly — just a new `action` case in the PATCH handler + a new button in the UI
- No new files needed
- No new dependencies
- ~50 lines of backend code, ~20 lines of frontend code
