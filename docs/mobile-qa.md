# Mobile QA — Responsive Testing Checklist

**Device:** iPhone 13 Pro (390px width)
**Environment:** Vercel preview deployments
**Branch:** `esther/qa-responsive` → merged into `staging` per section

---

## What to check on every page

When you open a page on your phone, look for these same things every time:

| Check | What it means |
|-------|--------------|
| No horizontal scroll | Nothing overflows off the right edge of the screen |
| Single column | Side-by-side layouts collapse and stack vertically |
| Full-width inputs | Form fields and buttons stretch edge to edge |
| Tappable targets | Buttons, links, icons are easy to tap (≥ 44px) |
| Text readable | Font is not too small, nothing cut off or truncated |
| Fixed bars don't overlap | Sticky navs/footers don't permanently hide content |

---

## Pages

| # | Page | URL | Status | Notes |
|---|------|-----|--------|-------|
| 1 | Homepage | `/` | ✅ Done | Hero, browse cards, footer |
| 2 | Browse | `/browse` | ✅ Done | Cards, pagination |
| 3 | Provider detail | `/provider/[slug]` | ✅ Done | Gallery, sticky CTA, bottom sheets |
| 4 | Hamburger menu + Auth modal | — | ⬜ | Sign in, sign up, profile switcher |
| 5 | Browse — Providers | `/browse/providers` | ✅ Done | Filters, map view, pagination — passed |
| 6 | Browse — Caregivers | `/browse/caregivers` | ✅ Done | Filters, map view, pagination — passed |
| 7 | Community | `/community` | ✅ Done | Composer padding fixed — PR #110 |
| 8 | Community post | `/community/post/[slug]` | ✅ Done | max-w-3xl container, comment form stacks cleanly |
| 9 | Caregiver support article | `/caregiver-support/[slug]` | ✅ Done | px-5 container, TOC hidden on mobile, prose readable |
| 10 | Benefits finder | `/benefits/finder` | ✅ Done | max-w-lg centered form, full-width inputs |
| 11 | For Providers landing | `/for-providers` | ✅ Done | Hero search bar stacks, all sections responsive |
| 12 | Provider onboarding wizard | `/for-providers/create` | ⏭ Skip | Redirects to /onboarding |
| 13 | Claim listing | `/for-providers/claim/[slug]` | ✅ Done | Minimal nav — PR #105 |
| 14 | Removal request | `/for-providers/removal-request/[slug]` | ✅ Done | Dedicated page, sticky submit — PR #105 |
| 15 | Family portal — Dashboard | `/portal` | ⏭ Skip | Redirects to /portal/inbox |
| 16 | Family portal — Inbox | `/portal/inbox` | ✅ Done | Split view collapses: list hides when thread selected, back btn |
| 17 | Family portal — Connections | `/portal/connections` | ✅ Done | Tab bar full-width on mobile — PR #110 |
| 18 | Family portal — Connection detail | `/portal/connections/[id]` | ✅ Done | Grids collapse, buttons stack — PR #110 |
| 19 | Family portal — Matches | `/portal/matches` | ✅ Done | grid-cols-1 lg:grid-cols-3 — sidebar below content on mobile |
| 20 | Family portal — Discover | `/portal/discover/providers` | ✅ Done | Padding fixed px-8→px-4 sm:px-8 — PR #111 |
| 21 | Family portal — Saved | `/portal/saved` | ✅ Done | grid-cols-1 sm:grid-cols-2, banner flex-wrap |
| 22 | Family portal — Profile | `/portal/profile` | ✅ Done | Tab bar full-width on mobile — PR #110 |
| 23 | Family portal — Settings | `/portal/settings` | ✅ Done | Notification rows stack on mobile — PR #110 |
| 24 | Provider hub — Dashboard | `/provider` | ✅ Done | Header stacks on mobile, grid-cols-1 lg:grid-cols-3, sidebar below — PR #111 |
| 25 | Provider hub — Inbox | `/provider/inbox` | ✅ Done | Split view collapses: list hides when thread selected |
| 26 | Provider hub — Connections | `/provider/connections` | ✅ Done | Drawer grids collapse on mobile — PR #110 |
| 27 | Provider hub — Profile | `/provider/profile` | ⏭ Skip | Redirects to /provider |
| 28 | Provider hub — Reviews | `/provider/reviews` | ✅ Done | Coming soon — centered column, full-width form |
| 29 | Provider hub — Pro | `/provider/pro` | ✅ Done | grid-cols-1 sm:grid-cols-3, comparison table fixed cols, centered |
| 30 | Provider hub — Verification | `/provider/verification` | ✅ Done | Accordion single column, full-width inputs, w-full selects |
| 31 | Provider hub — Q&A | `/provider/qna` | ✅ Done | Coming soon — centered column, full-width form |
| 32 | Team page | `/team` | ✅ Done | grid-cols-1 md:grid-cols-2 — stacks to single on mobile |
| 33 | Research & Press article | `/research-and-press/[slug]` | ✅ Done | px-5 container, desktop TOC hidden on mobile |
| 34 | Connected confirmation | `/connected/[connectionId]` | ✅ Done | Centered card max-w-lg, pill tags flex-wrap |
| 35 | Public saved | `/saved` | ✅ Done | grid-cols-1 sm:grid-cols-2 lg:grid-cols-3, banner flex-wrap |

---

## How to update this file

When a page passes with no issues:
```
| 4 | Hamburger menu + Auth modal | — | ✅ Done | No issues |
```

When a page has issues that need fixing:
```
| 7 | Community | `/community` | 🔧 In progress | Category tabs overflow on mobile |
```

When a page has been fixed and merged:
```
| 7 | Community | `/community` | ✅ Done | Category tabs fixed — merged in PR #106 |
```

---

## Status key

| Symbol | Meaning |
|--------|---------|
| ✅ Done | Tested, passes, or fixed and merged |
| 🔧 In progress | Issues found, fix being worked on |
| ⬜ Not yet tested | Untouched |
| ⏭ Skip | Not applicable (e.g. admin-only pages) |

---

## History

| Date | PR | What was fixed |
|------|----|---------------|
| 2026-03-03 | #105 | Homepage, Browse, Provider detail — gallery, sticky CTA, iOS scroll lock on modals, removal request page, claim page nav, ReviewModal asterisks |
| 2026-03-03 | #110 | Portal connections tab bar, connection detail grids, profile tab bar, settings notification rows, provider connections drawer grids, community composer padding |
| 2026-03-03 | #111 | Discover page padding (px-8→px-4 sm:px-8), provider dashboard header stacks vertically on mobile |
