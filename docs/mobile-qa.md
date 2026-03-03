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
| 5 | Browse — Providers | `/browse/providers` | ⬜ | Filter chips, map view, pagination |
| 6 | Browse — Caregivers | `/browse/caregivers` | ⬜ | Same checks as above |
| 7 | Community | `/community` | ⬜ | Category tabs, post cards |
| 8 | Community post | `/community/post/[slug]` | ⬜ | Article body, comment thread, reply input |
| 9 | Caregiver support article | `/caregiver-support/[slug]` | ⬜ | Article text, images, content width |
| 10 | Benefits finder | `/benefits/finder` | ⬜ | Multi-step form, step nav buttons |
| 11 | For Providers landing | `/for-providers` | ⬜ | Hero, pricing cards, feature list |
| 12 | Provider onboarding wizard | `/for-providers/create` | ⬜ | Wizard steps, form inputs, progress bar |
| 13 | Claim listing | `/for-providers/claim/[slug]` | ⬜ | Minimal nav, each step renders |
| 14 | Removal request | `/for-providers/removal-request/[slug]` | ⬜ | No main nav, form fields, sticky submit |
| 15 | Family portal — Dashboard | `/portal` | ⬜ | No split-view, tabs/sidebar collapse |
| 16 | Family portal — Inbox | `/portal/inbox` | ⬜ | Conversation list, thread, keyboard |
| 17 | Family portal — Connections | `/portal/connections` | ⬜ | Status tabs, list single column |
| 18 | Family portal — Connection detail | `/portal/connections/[id]` | ⬜ | Stacks correctly, action buttons |
| 19 | Family portal — Matches | `/portal/matches` | ⬜ | Cards, action buttons |
| 20 | Family portal — Discover | `/portal/discover/providers` | ⬜ | Cards, filters |
| 21 | Family portal — Saved | `/portal/saved` | ⬜ | Saved cards, empty state |
| 22 | Family portal — Profile | `/portal/profile` | ⬜ | Edit form, photo upload, save button |
| 23 | Family portal — Settings | `/portal/settings` | ⬜ | List items, delete account |
| 24 | Provider hub — Dashboard | `/provider` | ⬜ | Stats stack, sidebar collapses |
| 25 | Provider hub — Inbox | `/provider/inbox` | ⬜ | Thread view, keyboard-safe input |
| 26 | Provider hub — Connections | `/provider/connections` | ⬜ | Inquiry list, detail view |
| 27 | Provider hub — Profile | `/provider/profile` | ⬜ | Edit form stacks, photo upload |
| 28 | Provider hub — Reviews | `/provider/reviews` | ⬜ | Review cards, star ratings |
| 29 | Provider hub — Pro | `/provider/pro` | ⬜ | Pricing card, upgrade button full-width |
| 30 | Provider hub — Verification | `/provider/verification` | ⬜ | Status, steps readable |
| 31 | Provider hub — Q&A | `/provider/qna` | ⬜ | List readable, add question input |
| 32 | Team page | `/team` | ⬜ | Team member cards stack |
| 33 | Research & Press article | `/research-and-press/[slug]` | ⬜ | Article content readable |
| 34 | Connected confirmation | `/connected/[connectionId]` | ⬜ | Confirmation page fits screen |
| 35 | Public saved | `/saved` | ⬜ | Cards single column |

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
