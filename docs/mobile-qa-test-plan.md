# Olera Mobile QA Test Plan

**Scope:** Mobile-specific testing at 390px (iPhone 14/15) and 360px (Android mid-range)
**Browsers:** iOS Safari 17+, Chrome Android 120+
**Reference build:** `staging` branch
**Last updated:** 2026-03-04

> This plan is intentionally separate from the web QA tracker. It captures behaviors that only matter on mobile — safe areas, virtual keyboards, touch targets, bottom sheets, scroll locking, iOS quirks, and portrait-first layout.

---

## How to Read This Plan

- **P0** — Ship blocker. Must pass before launch.
- **P1** — High priority. Fix before launch, but not a hard blocker for initial deploy.
- **P2** — Nice to have. Log as backlog if failing.
- **iOS** — Test on Safari (iPhone). Most critical: safe areas, rubber-band scroll, input zoom.
- **Android** — Test on Chrome (Android). Most critical: address bar resize, keyboard push.
- **Both** — Must pass on both platforms.

---

## Section 1 — Global / Every Page

These apply everywhere. If they fail on one page, assume they fail on all until proven otherwise.

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| G.1 | No horizontal scroll on any page | Both | Load each major page at 390px. Try swiping left/right. | Page does not scroll sideways. No element bleeds outside viewport. | P0 |
| G.2 | Navbar height is always 64px and stays fixed | Both | Scroll down rapidly on a long page. | Navbar stays pinned to top, does not disappear or jump. | P0 |
| G.3 | Navbar hides/shows smoothly on fast scroll | Both | Scroll down quickly, then scroll back up. | Navbar slides out on fast scroll down, slides back in on scroll up. No flicker or jump. | P1 |
| G.4 | No text is smaller than 12px (readability) | Both | Visually scan each page. | No body text, labels, or important UI copy is unreadably small. | P1 |
| G.5 | No input triggers iOS auto-zoom | iOS | Tap into any text input (email, password, search, textarea). | Keyboard appears but page does NOT zoom in. Font size of input must be ≥ 16px. | P0 |
| G.6 | Touch targets are at least 44×44px | Both | Tap each button, link, and icon. Especially icon-only buttons (close, back, heart). | No tap misses on first try. Accidental taps on adjacent elements are rare. | P1 |
| G.7 | Safe area insets respected on iPhone | iOS | Test on notched iPhone (X or later). Look at top and bottom of screen. | Nothing is cut off behind notch or home indicator bar at top or bottom. | P0 |
| G.8 | Footer is fully visible (not behind home bar) | iOS | Scroll to bottom of any page. | Footer content is not overlapped by the iOS home indicator. | P1 |
| G.9 | Tapping a link navigates without full page reload (SPA routing) | Both | Tap nav links and internal links. | Page transitions quickly without white flash of full reload. | P0 |
| G.10 | Portrait orientation is the primary layout | Both | Hold device in portrait the entire session. | All layouts designed and usable in portrait. Nothing requires landscape. | P0 |
| G.11 | Rotating to landscape does not break layout | Both | Rotate device while on homepage, browse, and portal. | Layout reflows gracefully. No elements overlap or disappear. Modals close or reflow correctly. | P2 |
| G.12 | Back button (browser or device) navigates correctly | Both | Use Android back button or iOS swipe-back gesture. | Navigates to previous page correctly. Does not exit the app or go to a blank page. | P0 |
| G.13 | Page does not shift when address bar hides/shows | Android | Load browse page. Scroll down to hide Chrome address bar, then scroll up. | No content jump or layout shift when address bar resizes the viewport. | P1 |
| G.14 | Images have correct aspect ratios (no oval avatars) | Both | Scroll through any page with profile photos (browse, inbox, connections). | All circular avatars are perfectly round, not oval or clipped. | P0 |
| G.15 | Tap highlight is not jarring | Both | Tap links and buttons quickly. | No strong blue/grey flash on tap. Tap feedback is subtle or per-design. | P2 |

---

## Section 2 — Navbar & Hamburger Menu

Component: `components/shared/Navbar.tsx` — overlay rendered via `createPortal` to escape CSS `transform` stacking context.

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| N.1 | Hamburger icon tap opens full-screen overlay | Both | Tap ☰ icon in top-right corner. | Full-screen white overlay covers entire viewport (including behind navbar). Logo on left, circular X on right. | P0 |
| N.2 | Overlay covers full screen, not just navbar | Both | Open hamburger menu. | Overlay fills 100% of viewport — top to bottom, edge to edge. Underlying page content is completely hidden. | P0 |
| N.3 | X button closes overlay | Both | Open menu, tap X. | Overlay closes. Underlying page is visible again immediately. | P0 |
| N.4 | Tapping logo in overlay navigates home and closes menu | Both | Open menu, tap Olera logo. | Navigates to `/`. Overlay closes. | P1 |
| N.5 | Tapping any nav link closes menu and navigates | Both | Open menu, tap Find Care. | Menu closes instantly. Browser navigates to `/browse`. | P0 |
| N.6 | Route change auto-closes overlay | Both | Open menu. Trigger a route change by tapping Back (browser). | Menu closes when route changes. | P1 |
| N.7 | Logged-out menu shows correct 5 items | Both | Sign out. Open menu. | Items visible: Find Care, Community, Caregiver Support, Benefits Center, Saved. Each has an icon. | P0 |
| N.8 | Auth card is pinned to the bottom (logged-out) | Both | Sign out. Open menu on a device with short screen. | Log in + Sign up buttons are always at the bottom, not pushed off screen. Auth card is not scrolled past accidentally. | P0 |
| N.9 | "Log in" button opens auth modal in sign-in mode | Both | Sign out, open menu, tap Log in. | Auth modal appears in sign-in mode (not sign-up). | P0 |
| N.10 | "Sign up" button opens auth modal in sign-up mode | Both | Sign out, open menu, tap Sign up. | Auth modal appears in sign-up/registration mode. | P0 |
| N.11 | Provider links trigger auth (logged-out) | Both | Sign out, open menu, tap "List your organization". | Auth modal opens with provider intent pre-selected. | P1 |
| N.12 | Family logged-in: My Account accordion open by default | Both | Sign in as family user. Open menu. | My Account section is expanded. Inbox, Matches, Saved, Account visible without tapping. | P0 |
| N.13 | Family logged-in: Discover accordion collapsed by default | Both | Sign in as family user. Open menu. | Discover section is collapsed. Find Care etc. not visible until tapped. | P1 |
| N.14 | Opening Discover closes My Account (exclusivity) | Both | Sign in as family. Open menu. Tap Discover header. | Discover expands, My Account collapses simultaneously. Both cannot be open at once. | P1 |
| N.15 | Family My Account contains: Inbox, Matches, Saved, Account | Both | Sign in as family. Open menu, expand My Account. | All 4 items present with icons. Inbox and Matches show badge if there are unread/pending items. | P0 |
| N.16 | Family Discover contains: Find Care, Community, Caregiver Support, Benefits Center | Both | Sign in as family. Open menu, expand Discover. | All 4 items present with icons. | P0 |
| N.17 | Profile card shows name, profile type badge, and email | Both | Sign in as family. Open menu. | Top of menu shows avatar (or initials), display name, "Family" badge, and email address. Avatar is circular. | P0 |
| N.18 | Sign out button is always visible (sticky footer) | Both | Sign in. Open menu. Scroll the menu content if long. | Sign out button stays fixed at the very bottom of the overlay. Never scrolls off screen. | P0 |
| N.19 | Sign out works from hamburger menu | Both | Sign in. Open menu. Tap Sign out. | Session ends. Redirect to home. Menu closes. | P0 |
| N.20 | Provider logged-in: My Hub open by default | Both | Sign in as provider. Open menu. | My Hub (Dashboard, Inbox, Leads, Matches, Reviews) is expanded. | P0 |
| N.21 | Provider My Hub contains: Dashboard, Inbox, Leads, Matches, Reviews | Both | Sign in as provider. Open menu, view My Hub. | All 5 items with correct labels. Inbox shows unread badge. Leads shows new leads badge. | P0 |
| N.22 | Provider Account accordion contains: Profile, Q&A, Identity Verification, Olera Pro | Both | Sign in as provider. Open menu, expand Account. | All 4 items present with icons. | P0 |
| N.23 | Mode switcher pill shows when user has both profiles | Both | Sign in as user with family + provider profiles. Open menu. | Segmented control shows "Family Portal" / "Provider Hub". Tapping switches context. | P1 |
| N.24 | Active nav item is highlighted (teal accent) | Both | Navigate to /browse. Open menu. | Find Care item shows teal text + teal background highlight. | P1 |
| N.25 | Navbar px-5 padding matches overlay px-5 padding | Both | Open menu. Compare left edge of logo in normal navbar vs overlay header. | Logo starts at the same horizontal position in both states. No visible jump or misalignment. | P1 |

---

## Section 3 — Authentication

Component: `components/auth/UnifiedAuthModal.tsx` — renders as bottom sheet on mobile, centered modal on desktop.

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| A.1 | Auth modal renders as bottom sheet (not centered modal) | Both | Open auth modal on mobile. | Modal slides up from bottom of screen. Top has rounded corners. Drag handle visible. Full width. | P0 |
| A.2 | Email input does not trigger zoom | iOS | Tap email input field. | Keyboard appears. Page does NOT zoom. Input font-size ≥ 16px. | P0 |
| A.3 | Password input does not trigger zoom | iOS | On sign-in step, tap password field. | Keyboard appears. Page does NOT zoom. | P0 |
| A.4 | Virtual keyboard does not push modal off screen | Both | Open auth modal. Tap email input. | Keyboard appears. Modal stays visible and usable. CTA button not hidden behind keyboard. | P0 |
| A.5 | Background scroll is locked while modal is open | Both | Open auth modal. Try to scroll the page behind it. | Page behind modal does not scroll. Scroll is contained inside modal. | P0 |
| A.6 | Background scroll position restores after modal closes | Both | Scroll halfway down home page. Open and close auth modal. | Page returns to same scroll position after close. Does not jump to top or bottom. | P1 |
| A.7 | OTP input shows numeric keyboard on mobile | Both | Complete email step. When OTP input appears, tap first box. | Numeric keypad appears (not full QWERTY). | P0 |
| A.8 | OTP auto-advances through boxes on each digit | Both | Enter OTP code one digit at a time. | Focus moves to next box automatically after each digit. | P0 |
| A.9 | OTP paste fills all boxes | Both | Long-press on OTP input, paste a 6-digit code copied from SMS/email. | All 6 boxes fill simultaneously. Form auto-submits or enables submit. | P1 |
| A.10 | "Email me a code instead" link is large enough to tap | Both | On password sign-in step, look at the bottom links. | Both "Email me a code instead" and "Forgot password?" are easily tappable. Minimum 44px tap area. | P0 |
| A.11 | "Email me a code" and Sign in button are not too close | Both | On password sign-in step, look at spacing. | There is visible padding/space between the links and the Sign in button. Not at risk of accidental tap. | P0 |
| A.12 | Sign up → Sign in toggle works | Both | Open auth in sign-up mode. Tap "Already have an account? Sign in". | Switches to sign-in flow. No page reload. | P0 |
| A.13 | X (close) button is reachable with thumb | Both | Open auth modal. Look at close button position. | Close button is in top-right of modal. Reachable without stretching. | P1 |
| A.14 | Modal dismisses on backdrop tap | Both | Open auth modal. Tap the dark overlay area outside the modal. | Modal closes. | P1 |
| A.15 | Google OAuth button is full width and easily tappable | Both | Open auth modal. | Google sign-in button spans the full width of the modal. Min 44px tall. | P1 |
| A.16 | Post-auth redirect works correctly | Both | Complete sign-in. | User is redirected appropriately (home or portal depending on profile state). | P0 |

---

## Section 4 — Homepage

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| H.1 | Hero section is visible without scrolling | Both | Load homepage. | Hero headline and CTA visible in viewport without scrolling. Image does not push content below fold. | P0 |
| H.2 | Hero CTA button is large and tappable | Both | Look at primary hero button. | Button is at least 48px tall. Text is clearly legible. | P0 |
| H.3 | Care type browse section scrolls horizontally (if applicable) | Both | Scroll horizontally on the care category row. | Cards scroll smoothly. No layout break. Last card fully visible (not clipped). | P1 |
| H.4 | Provider cards layout is 1-column on mobile | Both | Scroll to provider listing section. | Cards stack in 1 column. Not 2 or 3 columns. Full card is visible without sideways scrolling. | P0 |
| H.5 | "Find Care" CTA in hero navigates to browse | Both | Tap primary CTA. | Navigates to `/browse`. | P0 |
| H.6 | Footer is readable and links work | Both | Scroll to footer. | Text is legible. Links are tappable. Footer does not overlap page content. | P1 |

---

## Section 5 — Browse & Search

Component: `components/browse/BrowseClient.tsx`, `BrowseMap.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| B.1 | Provider cards render in 1-column grid | Both | Load `/browse`. | Cards render in a single column. No overflow. Full card content visible. | P0 |
| B.2 | Search input does not cause zoom | iOS | Tap the search/city input field. | No zoom. Keyboard appears normally. | P0 |
| B.3 | Filter controls are accessible via tap | Both | Tap filter button or filter pills. | Filter UI opens (sheet or dropdown). All filter options reachable. | P0 |
| B.4 | Map/list toggle switches views | Both | Tap map toggle button. | Map view loads. Markers are visible. Toggle back to list works. | P1 |
| B.5 | Map is pannable and zoomable with touch | Both | Switch to map view. Pinch to zoom. Drag to pan. | Map responds to touch gestures smoothly. Does not interfere with page scroll. | P1 |
| B.6 | Map markers are large enough to tap | Both | Load map view. Tap a provider marker. | Marker is tappable without zooming in first. Popup or card appears. | P1 |
| B.7 | Pagination controls are tappable | Both | Scroll to bottom of results. | Next/Previous buttons are large enough to tap. Tapping loads new results without full page reload. | P0 |
| B.8 | Saving a provider (heart icon) works from browse card | Both | Tap the heart/bookmark icon on a card. | Icon fills/confirms. Provider is saved. No accidental navigation to provider detail. | P1 |
| B.9 | Tapping a provider card navigates to detail | Both | Tap on the provider name or card (not the heart). | Navigates to `/provider/[slug]`. | P0 |
| B.10 | Empty state (no results) renders correctly | Both | Search for something unlikely to have results. | "No results" or equivalent message renders cleanly. No broken layout. | P1 |
| B.11 | /browse/providers and /browse/caregivers filter pre-applies | Both | Navigate to `/browse/caregivers`. | Results are pre-filtered to caregivers. Filter chip shows active state. | P1 |

---

## Section 6 — Provider Detail Page

Component: `app/provider/[slug]/page.tsx`, `MobileStickyBottomCTA.tsx`, `MobileGalleryActionBar.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| PD.1 | Hero gallery is full-width on mobile | Both | Load a provider detail page. | Gallery image spans full width of device. No side margins. | P0 |
| PD.2 | Gallery carousel is swipeable | Both | Swipe left/right on gallery images. | Images advance smoothly. Swipe gesture does not accidentally trigger page scroll. | P1 |
| PD.3 | Mobile gallery action bar is visible (back, save, share) | Both | Load provider detail. | Back arrow, heart, and share icons overlay the gallery at top. Visible on dark and light images. | P0 |
| PD.4 | Back button in gallery navigates correctly | Both | Tap gallery back arrow. | Returns to previous page (browse or wherever user came from). Does not go to home if there is history. | P0 |
| PD.5 | Share button uses native share sheet | iOS | Tap share icon in gallery. | iOS native share sheet appears (not a web popup). | P1 |
| PD.6 | Sticky bottom CTA appears after scrolling | Both | Scroll down ~100px on provider detail. | Price + Connect bar appears at bottom, above home indicator. | P0 |
| PD.7 | Sticky bottom CTA hides correctly at top of page | Both | Scroll back to top. | Sticky CTA disappears. Does not flicker near scroll threshold. | P1 |
| PD.8 | Sticky bottom CTA respects iPhone safe area | iOS | On notched iPhone, look at sticky CTA. | CTA bar does not overlap home indicator bar. Has padding below button. | P0 |
| PD.9 | "Connect" tap in sticky CTA opens intent bottom sheet | Both | Tap Connect. | Bottom sheet slides up from bottom. Step 1 (Who needs care?) visible. Price estimate not shown in body. | P0 |
| PD.10 | Intent flow step 1: recipient selection works | Both | Tap Connect → Step 1 opens. Tap a recipient pill. | Pill highlights. "Next" or Continue button becomes active. | P0 |
| PD.11 | Intent flow step 2: care type selection works | Both | Complete step 1. Step 2 opens. Tap a care type. | Care type pill highlights. | P0 |
| PD.12 | Intent flow step 3: urgency selection works | Both | Complete step 2. Step 3 opens. Tap an urgency option. | Urgency option highlights. Connect button becomes active (not greyed). | P0 |
| PD.13 | Back button in intent sheet navigates between steps | Both | On step 2, tap back. | Returns to step 1. Previous selection preserved. | P0 |
| PD.14 | Connected state renders in sheet (not full page) | Both | Complete intent flow and connect. | Success state appears inside the bottom sheet. Phone + Message buttons in sticky footer. | P0 |
| PD.15 | Provider phone number reveals on mobile | Both | In connected state, tap "Call" or phone button. | Phone number is displayed or native phone dialer opens. | P1 |
| PD.16 | "About" section expand/collapse works | Both | Tap "See more" on the About section. | Text expands. Button changes to "See less". Works without zoom. | P1 |
| PD.17 | Reviews section renders with correct stars | Both | Scroll to reviews section. | Star ratings display correctly. Review cards are full-width and readable. | P1 |
| PD.18 | "Write a review" opens review modal (bottom sheet) | Both | Tap Write a review button. | Review modal opens as bottom sheet from bottom. | P1 |
| PD.19 | Review step 1: star picker is large enough to tap | Both | In review modal, tap stars. | Each star is clearly tappable. Selected stars show filled state. | P1 |
| PD.20 | Review step 2: title and comment inputs don't zoom | iOS | In review modal, tap title input. | No zoom. Keyboard appears. Content stays visible. | P1 |
| PD.21 | Breadcrumb navigation works | Both | Tap breadcrumb links above provider name. | Navigates to correct parent page. | P2 |
| PD.22 | Q&A section renders and questions are readable | Both | Scroll to Q&A section. | Questions and answers are legible, properly sized, no overflow. | P2 |
| PD.23 | "Get a custom quote" (scroll-to-card) works on mobile | Both | Tap any "Get a quote" CTA on the page. | Triggers the Connect bottom sheet to open. | P1 |

---

## Section 7 — Family Portal: Inbox

Component: `app/portal/inbox/page.tsx` — uses `h-[calc(100dvh-64px)]` container.

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| FI.1 | Inbox loads and conversation list is visible | Both | Navigate to `/portal/inbox`. | List of conversations renders. Each row shows provider name, snippet, and timestamp. | P0 |
| FI.2 | Inbox height fills screen without overflow scrollbars | Both | Load inbox. | The inbox occupies the full visible area. No double scrollbar. No content cut off. | P0 |
| FI.3 | Tapping a conversation opens the message thread | Both | Tap a conversation row. | Message thread panel appears. On mobile, replaces list view (not side-by-side). | P0 |
| FI.4 | Back button from message thread returns to conversation list | Both | Open a conversation. Tap back button. | Returns to full conversation list view. | P0 |
| FI.5 | Message thread scrolls to most recent message | Both | Open a conversation with many messages. | View auto-scrolls to the bottom (most recent). Not stuck at top. | P0 |
| FI.6 | Message input is visible when keyboard opens | Both | Open a conversation. Tap message input. | Keyboard opens. Input box scrolls above keyboard. Not hidden behind it. | P0 |
| FI.7 | Typing and sending a message works | Both | Type a message and tap Send. | Message appears in thread. Input clears. | P0 |
| FI.8 | Message input does not trigger zoom | iOS | Tap message input. | No zoom. Keyboard appears without viewport scaling. | P0 |
| FI.9 | Long messages wrap correctly, do not overflow | Both | View a conversation with long messages. | Text wraps within the bubble. No horizontal scroll. No overflow outside container. | P0 |
| FI.10 | Unread badge count is visible in navbar after new message | Both | Receive or check a thread with unread messages. | Badge on inbox icon in nav shows the correct unread count. | P1 |
| FI.11 | Inbox accessible from hamburger menu | Both | Open hamburger. Tap Inbox. | Navigates to `/portal/inbox`. Menu closes. | P0 |
| FI.12 | Empty inbox state renders cleanly | Both | View inbox with no conversations. | Empty state message is visible. Not a blank white screen. | P1 |

---

## Section 8 — Family Portal: Connections

Component: `app/portal/connections/page.tsx`, `SplitViewLayout.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| FC.1 | Connections page loads — list is visible | Both | Navigate to `/portal/connections`. | Connections list renders on mobile. No blank screen. | P0 |
| FC.2 | On mobile, only the list shows (not split-view) | Both | Load connections on mobile. | List takes full width. Right panel (detail) is not visible until a connection is selected. | P0 |
| FC.3 | Status tabs are all visible and tappable | Both | Look at the top of the connections page. | Tabs for Active, Interested, Responded, Ended (or equivalent) are all visible. Scrollable if necessary. | P0 |
| FC.4 | Tapping a connection opens the detail view | Both | Tap a connection row. | Detail view replaces or overlays the list. Provider info loads. | P0 |
| FC.5 | Back button from detail returns to list | Both | Open connection detail. Tap back arrow. | Returns to connection list. Correct tab is still active. | P0 |
| FC.6 | Connection detail shows provider name, care type, status | Both | Open a connection. | Provider name, care type, connection status, and relevant actions are all visible without scrolling. | P0 |
| FC.7 | Message button in connection detail navigates to inbox thread | Both | Open connection, tap Message. | Navigates to inbox with that specific conversation open. | P1 |
| FC.8 | Interested providers tab shows card stack | Both | Switch to Interested tab. | Cards render. Each card shows provider info. | P1 |
| FC.9 | Report connection flow opens modal | Both | Open a connection. Find Report or flag option. Tap it. | Report modal opens as bottom sheet. Options are tappable. | P2 |
| FC.10 | Archive/hide conversation works | Both | Find archive/hide option on a connection. Tap it. | Connection disappears from active list or moves to correct status. | P2 |

---

## Section 9 — Family Portal: Matches

Component: `app/portal/matches/page.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| FM.1 | Matches page loads with interested provider cards | Both | Navigate to `/portal/matches`. | Cards render. Provider name, care type visible. | P0 |
| FM.2 | Match cards are full-width and readable | Both | View matches list. | Cards take full width on mobile. Not 2-up. Content readable. | P0 |
| FM.3 | Tapping a match opens the provider detail or connection | Both | Tap a match card. | Opens appropriate detail view. | P1 |
| FM.4 | Publish care post works | Both | Find "Publish care post" or equivalent action. Tap it. | Care post is published. Confirmation shown. | P1 |
| FM.5 | Deactivate care post works | Both | Find deactivate option. Tap it. | Confirmation shown. Post deactivated. | P1 |
| FM.6 | Edit care post modal opens as bottom sheet | Both | Tap edit on a care post. | Modal opens from bottom. Form fields visible. Inputs don't zoom. | P1 |
| FM.7 | Pending match badge count matches nav badge | Both | Note badge count in nav. Check matches page. | Same count shown in both places. | P1 |

---

## Section 10 — Family Portal: Saved

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| FS.1 | Saved page loads with saved providers | Both | Navigate to `/saved` or `/portal/saved`. | Saved provider cards are visible. | P0 |
| FS.2 | Saved cards show provider name, type, and rating | Both | View saved list. | Each card has enough info to distinguish providers. | P1 |
| FS.3 | Unsaving from saved page works | Both | Tap the heart/bookmark on a saved card. | Card disappears from saved list. | P1 |
| FS.4 | Tapping a saved provider navigates to their detail page | Both | Tap a card. | Navigates to `/provider/[slug]`. | P1 |
| FS.5 | Empty state renders when no saved providers | Both | Remove all saved providers. Load saved page. | Shows empty state message, not blank screen. | P1 |

---

## Section 11 — Family Portal: Profile

Component: `app/portal/profile/page.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| FP.1 | Profile page loads with correct info | Both | Navigate to `/portal/profile`. | User's name, email, and profile type visible. | P0 |
| FP.2 | Edit form fields do not trigger zoom | iOS | Tap name, email, or any text input. | No zoom. Input font-size ≥ 16px. | P0 |
| FP.3 | Form fields stack vertically (1-column layout) | Both | View profile edit form. | Fields stack vertically. Not side-by-side. Full-width labels and inputs. | P0 |
| FP.4 | Save button is accessible (not hidden behind keyboard) | Both | Fill out profile form on mobile. Tap a field near bottom. | Save button can be reached by scrolling up after typing. Not permanently hidden. | P0 |
| FP.5 | Avatar/image upload works on mobile | Both | Tap profile photo or upload button. | Native file picker or camera opens. Image can be selected. | P1 |
| FP.6 | Save changes persists to database | Both | Edit a field. Tap Save. Reload page. | Updated value shows after reload. | P0 |

---

## Section 12 — Provider Hub: Dashboard

Component: `app/provider/page.tsx`, `DashboardPage.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| PH.1 | Dashboard loads — profile completeness card visible | Both | Sign in as provider. Navigate to `/provider`. | Dashboard renders. Profile completeness tracker is visible. | P0 |
| PH.2 | Stat cards are readable on mobile | Both | View dashboard stat cards. | Cards are full-width or 2-up. Numbers and labels are legible. | P0 |
| PH.3 | Profile completeness meter renders correctly | Both | Look at the completeness tracker. | Progress bar or percentage is visible. Steps are listed. | P1 |
| PH.4 | "View your listing" link works | Both | Tap "View your listing" or profile preview. | Navigates to the public `/provider/[slug]` page for this provider. | P1 |
| PH.5 | Dashboard nav items in hamburger menu work | Both | Open hamburger. Tap Dashboard. | Navigates to `/provider`. Menu closes. | P0 |

---

## Section 13 — Provider Hub: Leads (Connections)

Component: `app/provider/connections/page.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| PL.1 | Leads page loads — inbound inquiries visible | Both | Navigate to `/provider/connections`. | List of family inquiries renders. Each row shows family name, care type, status. | P0 |
| PL.2 | On mobile, list takes full width (no split view) | Both | Load leads on mobile. | Right detail panel is hidden. List is full-width. | P0 |
| PL.3 | Tapping a lead opens the detail view | Both | Tap a lead row. | Lead detail opens. Family info, care request, status visible. | P0 |
| PL.4 | Back button returns to leads list | Both | Open lead detail. Tap back. | Returns to list. Correct tab/filter preserved. | P0 |
| PL.5 | New leads badge count in nav matches page | Both | Check badge on nav and on page. | Same count in both places. | P1 |
| PL.6 | Detail panel action buttons are reachable | Both | Open a lead detail. Look at action buttons (message, accept, etc.). | Buttons are visible without excessive scrolling. Tappable. | P0 |

---

## Section 14 — Provider Hub: Inbox

Component: `app/provider/inbox/page.tsx` — uses `h-[calc(100dvh-64px)]`

Same constraints as Family Inbox. Run the same tests FI.1–FI.12 on the provider inbox at `/provider/inbox`.

| ID | Test | Platform | Pass Criteria | Risk |
|---|---|---|---|---|
| PI.1 | Provider inbox loads and fills screen | Both | See FI.1–FI.2 criteria applied to `/provider/inbox`. | P0 |
| PI.2 | Keyboard does not hide message input | Both | See FI.6. | P0 |
| PI.3 | Messages send and appear | Both | See FI.7. | P0 |
| PI.4 | Back navigation works (mobile list → thread → list) | Both | See FI.4. | P0 |

---

## Section 15 — Provider Hub: Profile Edit

Component: `app/provider/profile/page.tsx`, edit modals in `components/provider-dashboard/edit-modals/`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| PP.1 | Profile page loads with current info | Both | Navigate to `/provider/profile`. | Name, bio, care types, pricing all visible. | P0 |
| PP.2 | Edit About modal opens as bottom sheet | Both | Tap edit on About section. | Bottom sheet opens. Textarea visible. Text input does not zoom. | P0 |
| PP.3 | Edit modal save button is accessible | Both | Open any edit modal. Scroll to bottom. | Save button is always reachable. Not hidden behind keyboard permanently. | P0 |
| PP.4 | Edit modals close on tap of backdrop | Both | Open any edit modal. Tap outside it. | Modal closes without saving. | P1 |
| PP.5 | Gallery image upload works on mobile | Both | Tap edit gallery. Select image from device. | Image uploads and appears in gallery. | P1 |
| PP.6 | Pricing/payment fields do not zoom | iOS | Tap pricing input fields. | No zoom. | P1 |

---

## Section 16 — Provider Hub: Reviews, Q&A, Verification, Pro

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| PR.1 | Reviews page loads — feedback cards readable | Both | Navigate to `/provider/reviews`. | Reviews listed. Star ratings, names, and comments visible. Readable on mobile. | P1 |
| PR.2 | Q&A page loads — questions listed | Both | Navigate to `/provider/qna`. | Q&A pairs rendered. Text is readable. Not overflowing. | P1 |
| PR.3 | Add/edit Q&A inputs don't zoom | iOS | Tap question or answer input on Q&A page. | No zoom. | P1 |
| PR.4 | Verification page shows status clearly | Both | Navigate to `/provider/verification`. | Current verification status visible. Next steps (if any) are actionable on mobile. | P2 |
| PR.5 | Olera Pro page shows pricing and features | Both | Navigate to `/provider/pro`. | $25/mo (or current pricing), feature list, and upgrade CTA all visible without scrolling. | P1 |
| PR.6 | Pro upgrade CTA button is large and tappable | Both | Tap upgrade button on Pro page. | Button is ≥ 44px. Taps register reliably. | P1 |

---

## Section 17 — Community

Component: `app/community/page.tsx`, `GuidelinesDrawer.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| CM.1 | Community page loads — posts are listed | Both | Navigate to `/community`. | Forum posts rendered. Each shows title, author, preview, timestamp. | P1 |
| CM.2 | Post cards are full-width and readable | Both | View community post list. | Each card spans full width. Author avatar is circular. Text doesn't overflow. | P1 |
| CM.3 | Author avatars are circular (not oval) | Both | Look at post cards. | All author avatars are perfectly round. | P0 |
| CM.4 | Tapping a post navigates to post detail | Both | Tap a post card. | Navigates to `/community/post/[slug]`. | P1 |
| CM.5 | Post detail page is readable | Both | Open a post. | Full post content renders. Text size readable. Code blocks (if any) scroll horizontally. | P1 |
| CM.6 | Comments are listed below post | Both | Scroll down on a post detail page. | Comments visible. Author, text, timestamp shown. | P1 |
| CM.7 | Guidelines drawer opens from correct trigger | Both | Find and tap "Community Guidelines" link/button. | Drawer slides in from the right. Content scrollable. Backdrop visible. | P2 |
| CM.8 | Guidelines drawer closes on X or backdrop tap | Both | Open guidelines drawer. Tap X or backdrop. | Drawer closes. Background scroll is restored. | P2 |
| CM.9 | Care type filter tabs are tappable | Both | Tap care type tabs on community page. | Tabs filter posts correctly. Active tab is highlighted. | P1 |

---

## Section 18 — Caregiver Support & Resources

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| CS.1 | Caregiver support page loads — articles listed | Both | Navigate to `/caregiver-support`. | Article cards visible. Full-width on mobile. | P1 |
| CS.2 | Article page loads with readable content | Both | Tap an article. | Full article content renders. Text size readable (≥ 14px). Images are full-width. | P1 |
| CS.3 | Author avatar in article is circular | Both | View article page. | Author avatar at top/bottom of article is round, not oval. | P0 |
| CS.4 | Article page has no horizontal scroll | Both | Load an article. Try to swipe left/right. | No horizontal scroll. | P0 |

---

## Section 19 — Benefits Center

Component: `components/benefits/BenefitsIntakeForm.tsx` — 7-step form

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| BC.1 | Benefits landing page loads | Both | Navigate to `/benefits`. | Page renders. CTA to start finder is visible. | P0 |
| BC.2 | Benefits finder form starts from step 1 | Both | Tap "Find Benefits" or equivalent CTA. | Step 1 of 7 renders. Step indicator visible. | P0 |
| BC.3 | Location autocomplete works on mobile | Both | On location step, type a city name. | Suggestions appear below input. Tapping a suggestion fills the field. | P0 |
| BC.4 | Location input does not trigger zoom | iOS | Tap location input. | No zoom. | P0 |
| BC.5 | Age input does not trigger zoom | iOS | Tap age input. | No zoom. | P0 |
| BC.6 | Pill/chip selection buttons are large enough | Both | Tap care preference pills. | Minimum 44px height. Selected state clearly visible (teal highlight). | P0 |
| BC.7 | Step back button preserves previous answers | Both | Fill step 1. Go to step 2. Tap back. | Returns to step 1 with previous answer still selected. | P1 |
| BC.8 | Step indicator is visible throughout | Both | Progress through all 7 steps. | Step counter or progress bar visible on every step. | P1 |
| BC.9 | Results page renders matching programs | Both | Complete all 7 steps. Submit. | Benefits results page renders. Cards or list shows programs. Not blank. | P0 |
| BC.10 | Reset clears all form state | Both | Complete steps, then tap Reset. | All selections cleared. Returns to step 1. | P2 |

---

## Section 20 — Modals & Bottom Sheets (System-wide)

Component: `components/ui/Modal.tsx`

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| MB.1 | All modals render as bottom sheet on mobile | Both | Trigger any modal (auth, review, connect, manage listing). | Modal slides up from bottom. Top edge has rounded corners. Drag handle visible. | P0 |
| MB.2 | Drag handle is visible at top of all bottom sheets | Both | Open any modal. | Small grey pill/handle at top center of sheet. Mobile-only. | P1 |
| MB.3 | Modal header (title + close button) is always visible | Both | Open a tall modal (review or edit profile). | Title and X remain at top even when scrolling content inside modal. | P0 |
| MB.4 | Modal footer (action buttons) is always visible | Both | Open any modal with sticky footer (review, connection intent). | Footer with CTA button stays fixed at bottom. Not pushed off by content. | P0 |
| MB.5 | Content inside modal scrolls independently | Both | Open a modal with long content. Scroll inside it. | Only modal content scrolls. Background page does not scroll. | P0 |
| MB.6 | Background scroll is locked while modal open | Both | Open any modal. Try scrolling the page behind it. | Page behind modal does not move. | P0 |
| MB.7 | Scroll position restores after modal close | Both | Scroll 50% down page. Open and close a modal. | Page returns to same scroll position. | P1 |
| MB.8 | Modal close button is reachable with thumb | Both | Open modal. Look at X button. | Close button is in top-right corner. Within comfortable thumb reach. | P1 |
| MB.9 | Multi-step modals: back button goes to previous step | Both | Open review modal. Go to step 2. Tap back. | Returns to step 1. Not to page. | P0 |
| MB.10 | Safe area padding at bottom of modals | iOS | Open any modal on notched iPhone. | Button/footer does not overlap home indicator. | P0 |
| MB.11 | Backdrop tap closes modal | Both | Open modal. Tap dark overlay area. | Modal closes. | P1 |
| MB.12 | Escape key closes modal (if hardware keyboard) | Both | Connect bluetooth keyboard. Press Escape while modal open. | Modal closes. | P2 |

---

## Section 21 — Forms (System-wide)

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| FM.1 | No text input smaller than 16px in any form | iOS | Tap into every form input across the app. | No auto-zoom occurs on any input. | P0 |
| FM.2 | Textarea inputs do not zoom | iOS | Tap textarea fields (review comment, profile bio, Q&A answers). | No zoom. Keyboard appears normally. | P0 |
| FM.3 | Form submit button is not hidden behind keyboard | Both | Open any form. Tap an input near the bottom. | Submit/Save button can be reached by scrolling without dismissing keyboard. | P0 |
| FM.4 | Validation errors show inline (not just toast) | Both | Submit a form with empty required fields. | Error messages appear next to the relevant field. Not just a toast at top. | P1 |
| FM.5 | Dropdown/select menus work on mobile | Both | Tap any dropdown (relationship selector in review, urgency in intent form). | Native picker or custom dropdown opens. All options are selectable. | P0 |
| FM.6 | Pill/chip selectors work with single tap | Both | Tap care type or urgency pills in any form. | One tap selects/deselects. No need for double-tap. | P0 |

---

## Section 22 — Performance & Polish

| ID | Test | Platform | How to Test | Pass Criteria | Risk |
|---|---|---|---|---|---|
| PF.1 | First page load under 3 seconds on WiFi | Both | Open homepage fresh (no cache). Time it. | Page is visually complete within 3s. | P1 |
| PF.2 | No layout shift when images load | Both | Load browse page. Watch the card grid. | Cards do not jump position as images load. Aspect ratios are pre-reserved. | P1 |
| PF.3 | Animations are not janky (60fps) | Both | Navigate between pages. Open/close modals. | No obvious jank or lag. Animations feel smooth. | P1 |
| PF.4 | App does not crash on low memory (older device) | Both | Use the app on an older device for 10 minutes. | No crashes or white screen of death. | P1 |
| PF.5 | Images are lazy-loaded below the fold | Both | Open Network tab (DevTools). Load browse page. | Images not in viewport do not load immediately. They load as you scroll. | P2 |

---

## Known Issues Already Fixed (Do Not Re-Test as Bugs)

These were caught and fixed during earlier QA sessions. Verify they remain fixed.

| Issue | Fix Applied | Verify |
|---|---|---|
| Mobile hamburger only showed close button | `createPortal` to escape nav `transform` stacking context | Open hamburger on provider detail page (which has `transform` on nav). Full overlay appears. |
| Inbox input hidden behind Safari bottom chrome | `100dvh` instead of `100vh` | Open inbox on iOS Safari. Input is visible without scrolling. |
| Avatar images squished oval | Added `aspect-square shrink-0` to all `<Image>` with `rounded-full` | Check browse cards, inbox, community, connection detail — all avatars perfectly round. |
| Auth modal links too small and close to button | `text-xs` → `text-sm`, added `py-1` padding, `pt-4` gap | Tap "Email me a code instead" — no accidental tap on Sign in button. |
| Provider mobile menu missing Matches, Q&A, Verification, Pro | Added to provider accordion | Open hamburger as provider. Both My Hub and Account sections complete. |
| Navbar padding inconsistent (px-4 vs px-5) | `px-4` → `px-5` on main nav container | Logo aligns flush with overlay header logo. |

---

## Device Coverage Matrix

| Page / Feature | iPhone 15 Safari | iPhone SE Safari | Pixel 7 Chrome | Samsung A54 Chrome |
|---|---|---|---|---|
| Homepage | P0 | P1 | P0 | P1 |
| Browse | P0 | P1 | P0 | P1 |
| Provider Detail | P0 | P1 | P0 | P1 |
| Auth Modal | P0 | P0 | P0 | P1 |
| Hamburger Menu | P0 | P0 | P0 | P1 |
| Portal Inbox | P0 | P1 | P0 | P1 |
| Portal Connections | P0 | P1 | P0 | P1 |
| Provider Hub | P0 | P1 | P0 | P1 |
| Benefits Form | P0 | P1 | P0 | P1 |
| Community | P1 | P2 | P1 | P2 |

---

*This document lives at `docs/mobile-qa-test-plan.md`. Update the "Known Issues" section as bugs are found and fixed. Update "Pass Criteria" if design decisions change.*
