# Plan: Meet the Owner Section

Created: 2026-03-19
Status: Not Started

## Goal

Add a "Facility Manager / Meet the Owner" section to provider detail pages with owner photo, name, title, care motivation, verified badge, and "Connect with us" CTA — and let providers edit this info from their portal dashboard.

## Success Criteria

- [ ] Provider detail page shows compact "Managed by" badge below Highlights (with verified checkmark)
- [ ] Provider detail page shows full "Facility Manager" section above Disclaimer with photo card, care motivation text, "Show more" expand, trust line, and "Connect with us" CTA
- [ ] Provider portal has an edit modal for staff/owner info (name, position, photo, care motivation)
- [ ] Photo upload uses existing upload infrastructure
- [ ] Section gracefully hidden when no owner data exists

## Tasks

### Phase 1: Data Layer
- [ ] 1. Extend `metadata.staff` type with `care_motivation` field
      - Files: `lib/types.ts` (OrganizationMetadata → staff type)
      - Verify: TypeScript compiles, no type errors

### Phase 2: Public Display — Provider Detail Page
- [ ] 2. Update "Managed by" compact badge with verified checkmark icon
      - Files: `app/provider/[slug]/page.tsx` (~line 760)
      - Verify: Badge shows avatar + name + green verified check (matches mockup)

- [ ] 3. Redesign "Facility Manager" full section above Disclaimer
      - Files: `app/provider/[slug]/page.tsx` (~line 950)
      - Layout: Left photo card (circular photo, verified badge, name, position) + right "Care motivation" text block with "Show more" expand
      - Add "Connect with us" CTA button in section header (scrolls to connection card)
      - Add trust line: "To help protect your family, the Olera team vet facility managers for information accuracy."
      - Verify: Section matches mockup layout, hidden when no staff data

### Phase 3: Provider Portal — Edit Modal
- [ ] 4. Create `EditOwnerModal.tsx` in `components/provider-dashboard/edit-modals/`
      - Files: New file `components/provider-dashboard/edit-modals/EditOwnerModal.tsx`
      - Fields: Name (text), Position (text), Care Motivation (textarea), Photo (upload)
      - Uses existing `saveProfile()` for metadata persistence
      - Uses existing `/api/profile/upload-image` for photo upload
      - Depends on: Task 1
      - Verify: Modal opens, fields populate from existing data, saves correctly

- [ ] 5. Wire edit modal into provider dashboard
      - Files: `components/provider-dashboard/DashboardPage.tsx`
      - Add "Facility Manager" card/section to dashboard with edit button
      - Depends on: Task 4
      - Verify: Dashboard shows owner card, edit button opens modal, changes persist

### Phase 4: Polish & Test
- [ ] 6. End-to-end test
      - Add owner info via portal → verify it appears on public provider page
      - Test with no owner data → section should be hidden
      - Test "Show more" expand on care motivation text
      - Test "Connect with us" CTA scrolls to connection card
      - Mobile responsive check

## Risks

- **No migration needed**: `care_motivation` is added to JSONB metadata, not a new column — no schema change required
- **Existing staff data preserved**: `saveProfile()` merges metadata, so adding `care_motivation` won't clobber existing `name`/`position`/`bio` fields
- **Photo upload reuse**: Same bucket (`profile-images`) and API route — no new infrastructure
- **iOS providers**: iOS-sourced providers won't have owner data until claimed — section stays hidden (safe)

## Notes

- The `bio` field already exists in `metadata.staff` — `care_motivation` is a separate, user-facing "why I do this" field distinct from the general bio/description
- The mockup shows a verified badge (green checkmark) on the avatar — for MVP, show this for all claimed providers (claim_state = 'approved')
- "Connect with us" CTA reuses the existing connection card scroll behavior
- Edit modals follow established pattern: see `EditOverviewModal.tsx`, `EditAboutModal.tsx` as references
