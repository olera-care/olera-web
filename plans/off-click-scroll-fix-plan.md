# Plan: Off-Click Scroll Regression — Root Cause & Global Fix

Created: 2026-02-28
Status: Not Started
Notion: P1 — "Off-Click Scroll Regression: Root Cause & Global Fix"
Branch: `joyful-panini`

## Goal

Eliminate the scroll-to-footer regression that occurs when dismissing interactive elements (dropdowns, menus, modals) by clicking outside them, across every page that includes the Discovery Zone footer.

## Root Cause

When an interactive element containing a focused child is dismissed, React removes it from the DOM. The browser's native focus management then searches for the next focusable element in DOM order and scrolls to make it visible. The Footer's Discovery Zone has 70+ `<Link>` elements, making it the default scroll target.

This was previously fixed for modals in `components/ui/Modal.tsx` (commit `d2eea65`) by blurring the active element **before** the state change. That fix needs to be applied systematically to all click-outside patterns.

## Success Criteria

- [ ] No page scroll when dismissing any dropdown, menu, or popover via outside click
- [ ] No page scroll when pressing Escape to close any interactive element
- [ ] All click-outside handlers use `mousedown` (not `click`) for consistency
- [ ] All handlers blur the active element before closing
- [ ] Shared `useClickOutside` hook exists and is used by all affected components
- [ ] `next build` passes with no errors
- [ ] Manual test on: homepage, browse, provider page, portal, onboarding, benefits finder

## Tasks

### Phase 1: Create the shared hook

- [ ] 1. Create `hooks/use-click-outside.ts` — a `useClickOutside` hook
      - Files: `hooks/use-click-outside.ts` (new)
      - Depends on: none
      - Verify: TypeScript compiles, hook exports correctly

      **Hook API:**
      ```typescript
      function useClickOutside(
        ref: RefObject<HTMLElement | null>,
        handler: () => void,
        enabled?: boolean
      ): void
      ```

      **Behavior:**
      - Listens for `mousedown` on `document` (not `click` — fires earlier, prevents race conditions)
      - On outside click: blurs `document.activeElement` if it exists and isn't `document.body`, then calls `handler()`
      - Only active when `enabled` is true (defaults to true)
      - Cleans up listener on unmount or when `enabled` becomes false
      - Uses `useRef` for `handler` to avoid re-registering the listener on every render

      **Multi-ref variant:**
      ```typescript
      function useClickOutsideMulti(
        refs: RefObject<HTMLElement | null>[],
        handler: () => void,
        enabled?: boolean
      ): void
      ```
      - Same behavior, but checks if click target is outside ALL provided refs
      - Needed for components like `ConversationList` that have multiple independent dropdowns

### Phase 2: Migrate components (one at a time)

Each migration follows the same pattern:
1. Import `useClickOutside` (or `useClickOutsideMulti`)
2. Replace the inline `useEffect` + `addEventListener` block with the hook call
3. Remove the now-unused `handleClickOutside` function
4. Verify the component still works

**Simple migrations (single ref, single dropdown):**

- [ ] 2. Migrate `components/browse/BrowseFilters.tsx`
      - Files: `components/browse/BrowseFilters.tsx`
      - Depends on: 1
      - Current: `mousedown` + ref check → `setShowTypeDropdown(false)`
      - Verify: Care type dropdown closes on outside click, no scroll

- [ ] 3. Migrate `components/portal/matches/MatchSortBar.tsx`
      - Files: `components/portal/matches/MatchSortBar.tsx`
      - Depends on: 1
      - Current: `mousedown` + ref check → `setOpen(false)`, only when `open`
      - Verify: Sort dropdown closes on outside click, no scroll

- [ ] 4. Migrate `components/benefits/BenefitsIntakeForm.tsx`
      - Files: `components/benefits/BenefitsIntakeForm.tsx`
      - Depends on: 1
      - Current: `mousedown` + ref check → `setShowLocationDropdown(false)`
      - Verify: Location dropdown in benefits finder closes on outside click, no scroll

- [ ] 5. Migrate `components/shared/Navbar.tsx` (user menu)
      - Files: `components/shared/Navbar.tsx`
      - Depends on: 1
      - Current: `mousedown` + ref check → `setIsUserMenuOpen(false)`, plus Escape handler
      - Note: Keep the Escape handler separate (the hook only handles click-outside)
      - Verify: User avatar dropdown closes on outside click, no scroll

- [ ] 6. Migrate `components/shared/FindCareMegaMenu.tsx` (backdrop)
      - Files: `components/shared/FindCareMegaMenu.tsx`
      - Depends on: 1
      - Current: `onClick={onClose}` on backdrop div — no blur
      - Fix: Add blur before `onClose()` in the backdrop click handler
      - Note: This one is NOT a ref-based click-outside — it's a direct backdrop onClick.
        Don't use the hook here. Just add the blur-before-close inline.
      - Verify: Mega menu closes on backdrop click, no scroll

**Multi-ref / multi-dropdown migrations:**

- [ ] 7. Migrate `app/page.tsx` (homepage search dropdowns)
      - Files: `app/page.tsx`
      - Depends on: 1
      - Current: `mousedown` + two ref checks → close location + care type dropdowns
      - Use: `useClickOutsideMulti` with both refs, single handler that closes both
      - Verify: Homepage search dropdowns close on outside click, no scroll

- [ ] 8. Migrate `app/provider/onboarding/page.tsx`
      - Files: `app/provider/onboarding/page.tsx`
      - Depends on: 1
      - Current: `mousedown` + two ref checks → close location dropdown + city picker
      - Use: `useClickOutsideMulti` with both refs
      - Verify: Onboarding dropdowns close on outside click, no scroll

- [ ] 9. Migrate `components/messaging/ConversationList.tsx`
      - Files: `components/messaging/ConversationList.tsx`
      - Depends on: 1
      - Current: `mousedown` + two ref checks → close menu + filter dropdown
      - Use: `useClickOutsideMulti` with both refs
      - Verify: Conversation list menus close on outside click, no scroll

**CSS-class-based migrations (need different approach):**

- [ ] 10. Migrate `components/browse/BrowseClient.tsx`
       - Files: `components/browse/BrowseClient.tsx`
       - Depends on: 1
       - Current: `click` (not `mousedown`) + `.dropdown-container` CSS class check → close 5 dropdowns
       - Fix: Switch from `click` to `mousedown`, add blur before closing.
         Keep the CSS class approach (5 dropdowns share one handler) but add blur.
         OR refactor to use refs for each dropdown container.
       - Preferred: Keep CSS class approach but wrap in a small inline handler that blurs first.
         Don't force-fit the hook here — the CSS class pattern is different enough.
       - Verify: All 5 browse dropdowns close on outside click, no scroll

- [ ] 11. Migrate `components/browse/CityBrowseClient.tsx`
       - Files: `components/browse/CityBrowseClient.tsx`
       - Depends on: 1
       - Current: `click` + `.dropdown-container` CSS class check → close 4 dropdowns
       - Same approach as task 10 — add blur, switch to `mousedown`
       - Verify: City browse dropdowns close on outside click, no scroll

### Phase 3: Verification

- [ ] 12. Run `next build` and fix any type/import errors
       - Files: potentially any of the above
       - Depends on: 2-11
       - Verify: `next build` exits 0

- [ ] 13. Manual testing across all pages
       - Depends on: 12
       - Test matrix:
         - [ ] Homepage: click outside search dropdowns
         - [ ] Browse page: click outside all 5 filter dropdowns
         - [ ] City browse page: click outside filter dropdowns
         - [ ] Provider page: no regressions
         - [ ] Navbar: click outside user menu
         - [ ] Navbar: click outside mega menu (backdrop)
         - [ ] Portal matches: click outside sort dropdown
         - [ ] Benefits finder: click outside location dropdown
         - [ ] Onboarding: click outside location/city picker
         - [ ] Messaging: click outside conversation menus
         - [ ] Auth modal: still works (don't touch Modal.tsx)

## Risks

| Risk | Mitigation |
|------|------------|
| Blur prevents intended focus flow (e.g., clicking from one input to another) | `useClickOutside` only blurs when clicking OUTSIDE the ref — clicking another input inside the same container won't trigger it |
| CSS-class-based handlers (BrowseClient, CityBrowseClient) are harder to migrate | Keep their existing pattern but add blur + switch to mousedown — don't force the hook |
| Some dropdowns may rely on `click` event ordering | Test each migration individually; `mousedown` fires before `click` and before `focus`, so it should be safe |
| `scroll-behavior: smooth` in globals.css | The blur-before-close approach PREVENTS the scroll entirely — `scroll-behavior` only matters if we try to scroll back after the fact |

## Architecture Decision

**Why a hook and not a global event listener?**

A single global `mousedown` listener that prevents scroll on ALL outside clicks would be fragile — it can't know which elements are "interactive" without a registry. The per-component hook approach is explicit: each component opts in and controls its own cleanup. This matches React's component model and is easier to debug.

**Why not modify the Footer to prevent being a scroll target?**

Adding `tabindex="-1"` to footer links or wrapping them in an inert container would break accessibility and SEO (those links need to be focusable and crawlable). The correct fix is to prevent the browser from needing to find a new focus target in the first place.

## Notes

- **Do NOT modify `components/ui/Modal.tsx`** — it already has the correct fix and is battle-tested
- The `useClickOutside` hook is intentionally simple — it doesn't handle Escape key, scroll lock, or focus traps (those are modal-specific concerns)
- This fix also improves UX consistency: all dropdowns will now close on `mousedown` instead of some closing on `click` (delayed) and others on `mousedown` (immediate)
- Post-mortem reference: `docs/POSTMORTEMS.md` lines 32-52
