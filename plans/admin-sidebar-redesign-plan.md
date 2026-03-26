# Plan: Admin Sidebar Redesign

Created: 2026-03-25
Status: Not Started
Notion: [Task](https://www.notion.so/) — "Organize the left toolbar section of the admin panel into collapsable logical groupings"

## Problem

The sidebar is a flat list of 15 equally-weighted nav items named after database tables, not user tasks. No visual hierarchy, no spatial chunking, no way for the eye to skip sections. The header wastes 80px on identity display. The teal active state and 15 identical stroke icons add visual noise. It reads "admin template," not "tool built by someone who uses it."

## Design Thesis

Replace the flat list with labeled sections separated by whitespace. No collapse mechanics — hierarchy is always visible, always scannable. Items are text-only. Active state is a quiet left border. The sidebar feels like Linear's or Notion's: confident, quiet, fast.

## Success Criteria

- [ ] Nav items grouped into 4 sections with muted labels
- [ ] Icons removed from individual items (text-only links)
- [ ] Header block replaced by initials avatar in footer
- [ ] Active state: left border + font-medium (no teal background fill)
- [ ] Sidebar narrowed from w-64 to w-52
- [ ] Item density tightened (text-sm, py-2, space-y-0.5)
- [ ] Mobile bottom nav limited to 5-6 key items (not all 15)
- [ ] Build passes with zero errors

## Information Architecture

### Section grouping

```
Overview                          ← standalone, top of sidebar, no section label

PROVIDERS                         ← section label
  Claims
  Verification
  Directory
  Images
  Removals

ACTIVITY                          ← section label
  Leads
  Questions
  Reviews
  Emails
  Matches
  Care Seekers

OPERATIONS                        ← section label
  Content
  MedJobs
  Team

─────────────────────────────     ← border-t
  TJ (initials)  Back to Portal
```

### Mobile bottom nav (5 items only)

Overview, Directory, Leads, Content, MedJobs — the daily-use subset. Everything else is accessible from Overview stats or by switching to desktop. 15 items in a bottom bar is unusable.

## Design Specs

### Typography

| Element | Classes |
|---------|---------|
| Section label | `text-[11px] uppercase tracking-widest text-gray-400 font-medium` |
| Nav item (inactive) | `text-[13px] text-gray-500 font-normal` |
| Nav item (hover) | `text-gray-900 bg-gray-50/80` |
| Nav item (active) | `text-[13px] text-gray-900 font-medium border-l-2 border-gray-900` |
| Footer link | `text-[13px] text-gray-400` |

### Spacing

| Element | Value |
|---------|-------|
| Sidebar width | `w-52` (208px) |
| Nav padding (top) | `pt-5` |
| Section label margin | `mt-5 mb-1.5` (first section: `mt-0`) |
| Item vertical gap | `space-y-0.5` (2px) within group |
| Item padding | `px-3 py-[7px]` |
| Item border-radius | `rounded-md` |
| Footer padding | `p-4` |

### Active state

- Left border: `border-l-2 border-gray-900`
- Text: `text-gray-900 font-medium`
- Background: none (no fill)
- The border creates a subtle left accent — Linear-style

### Hover state

- `bg-gray-50/80 rounded-md`
- `transition-colors duration-150`

### Container

- Sidebar border: `border-r border-gray-100` (lighter than current gray-200)
- Background: `bg-white`
- No internal dividers between sections — whitespace only

### Footer

- Initials avatar: `w-7 h-7 rounded-full bg-gray-100 text-[11px] font-medium text-gray-500 flex items-center justify-center`
- Extract initials from email (e.g., `tfalohun@gmail.com` → `TF`)
- "Back to Portal" as text link, no arrow icon
- Layout: `flex items-center gap-3`

## Tasks

### Phase 1: Data Structure
- [ ] 1. Restructure navItems from flat array to grouped sections
      - Files: `components/admin/AdminSidebar.tsx`
      - Change: Replace `NavItem[]` with `NavSection[]` where each section has `label?: string` and `items: NavItem[]`. Overview section has no label.
      - Verify: TypeScript compiles, no rendering changes yet

### Phase 2: Desktop Sidebar
- [ ] 2. Remove the header block (Admin Dashboard / email / badge)
      - Files: `components/admin/AdminSidebar.tsx`
      - Change: Delete the `p-6 border-b` header div. Remove `Badge` import.
      - Verify: Build passes, sidebar starts directly with nav

- [ ] 3. Render grouped sections with muted labels
      - Files: `components/admin/AdminSidebar.tsx`
      - Change: Map over `NavSection[]`, render section labels with `text-[11px] uppercase tracking-widest text-gray-400 font-medium`, `mt-5 mb-1.5` spacing. Items within each section use `space-y-0.5`.
      - Verify: Sections visually separated by whitespace + labels

- [ ] 4. Remove icons, apply new typography + active state
      - Files: `components/admin/AdminSidebar.tsx`
      - Change: Delete the entire `icons` object (~75 lines). Remove `icon` from `NavItem` interface. Update `renderNavLink`: text-only, `text-[13px]`, inactive `text-gray-500 font-normal`, active `text-gray-900 font-medium border-l-2 border-gray-900`, hover `bg-gray-50/80 rounded-md`.
      - Verify: No icons rendered, active item shows left border

- [ ] 5. Narrow sidebar + lighten border
      - Files: `components/admin/AdminSidebar.tsx`, `app/admin/layout.tsx`
      - Change: `md:w-64` → `md:w-52`. `border-gray-200` → `border-gray-100` on aside.
      - Verify: Sidebar narrower, content area gains ~32px

- [ ] 6. Redesign footer with initials avatar
      - Files: `components/admin/AdminSidebar.tsx`
      - Change: Extract initials from `adminUser.email`. Render small circle with initials + "Back to Portal" text link. No back-arrow icon.
      - Verify: Footer shows initials circle + exit link

### Phase 3: Mobile Bottom Nav
- [ ] 7. Limit mobile nav to 5 key items
      - Files: `components/admin/AdminSidebar.tsx`
      - Change: Define `mobileNavItems` subset: Overview, Directory, Leads, Content, MedJobs. Keep compact icon rendering for mobile only (re-add 5 icons inline for mobile). These 5 get dedicated icons since mobile requires them.
      - Verify: Mobile bottom nav shows 5 items, touch targets remain ≥44px

### Phase 4: Polish
- [ ] 8. Final build check + visual QA
      - Files: none (verification only)
      - Verify: `npm run build` passes, no TypeScript errors, desktop + mobile rendering correct

## Risks

| Risk | Mitigation |
|------|------------|
| Removing icons may feel too sparse | The section labels + position provide spatial memory. If TJ feels naked without icons, we can add back 1 icon per section header as a second pass — but try text-only first. |
| Mobile 5-item subset may miss edge cases | Overview stats link to all admin pages. Infrequent pages (Team, Removals, Verification) are one tap from Overview. |
| `adminUser.email` may not have usable initials | Fallback to first character of email. `tfalohun@` → "T", worst case. |
| Layout shift from w-64 → w-52 | Content area is `flex-1 min-w-0` — it will expand naturally. No fixed widths downstream. |

## Notes

- No collapse/accordion mechanics. This is a deliberate choice — collapsing hides hierarchy instead of showing it. The grouping is visual (whitespace + labels), always visible.
- The `Deletions` page exists at `/admin/deletions` but isn't in the current nav. Leave it out — it's not in the current sidebar either.
- Mobile bottom nav is a separate concern from desktop grouping but fixing it now prevents leaving 15 items in `justify-around` (currently broken/unusable at that count).
