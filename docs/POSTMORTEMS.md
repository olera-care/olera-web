# Post-Mortems

> Lessons learned from bugs and issues. Each entry makes the system smarter.

---

### 2026-02-20: Design regression — 2-column vertical cards replaced with horizontal single-column

**Symptom**: The browse page's polished 2-column vertical card grid (Realtor.com style, iterated over Sessions 15 and 15b through 6+ commits) was replaced with a horizontal single-column layout in one commit. User noticed immediately and asked for it back.

**Root Cause**: A stale plan was followed without questioning it. Here's the timeline:

1. **Session 15** (initial browse redesign) — plan written with horizontal TripAdvisor-style cards
2. **Session 15b** (polish pass) — design iterated to 2-column vertical cards (`27b24e8`), which the user preferred. The plan was **never updated** to reflect this decision.
3. **This session** — the old plan was given as instructions ("Implement the following plan"). The plan still said "Horizontal layout like TripAdvisor: image on left, content on right" and "single column of BrowseCard components."
4. Claude read the current code (2-column vertical cards), saw it conflicted with the plan, and **followed the plan instead of questioning the discrepancy**. The existing design was overwritten.

The core error: **treating the plan as authoritative when the code told a different story.** The 2-column vertical layout had been deliberately iterated to through multiple commits — it wasn't accidental. But because the plan said "horizontal," the agent rewrote the working design without flagging the conflict.

**Fix**: Reverted BrowseCard to vertical layout and BrowseClient to 2-column grid in `dc56a62`.

**Time to Resolution**: ~10 minutes once the user noticed, but the unnecessary churn touched 2 files and required a revert commit.

**Prevention**: Added to CLAUDE.md:
- When a plan conflicts with the current state of the code, **ask the user** before overwriting — the code may have been intentionally iterated past the plan
- Plans can go stale between sessions; the code is the source of truth for current design intent

**Lesson**: If the code has clearly been iterated (multiple commits refining a design), treat it as an intentional decision — not something to overwrite because a plan doc says otherwise. When in doubt, ask.

---

### 2026-02-25: Modal close scrolls page to footer (4 attempts to fix)

**Symptom**: Closing the auth modal on the homepage caused the page to instantly snap to the pre-footer "Find senior care by city" section instead of staying at the user's scroll position.

**Root Cause**: When React removes a portal from the DOM while an element inside it has focus, the browser's native focus management instantly moves focus to the next focusable element in DOM order and scrolls to make it visible. The portal is appended at the end of `document.body`, so the "next" focusable elements are links in the pre-footer. This scroll fires during React's DOM mutation phase — before any effect cleanup runs, even `useLayoutEffect`.

**Fix**: Added `handleClose()` in `components/ui/Modal.tsx` (line 59) that blurs the active element BEFORE calling `onClose`. Applied to all three close paths: backdrop click, X button, Escape key. No focused element in the portal when it's removed = no browser focus management = no scroll. The `useLayoutEffect` body lock with `scrollTo({ behavior: 'instant' })` was kept as a safety net.

**Time to Resolution**: ~90 minutes across 4 failed-then-succeeded attempts:
1. `useEffect` + `scrollTo` — cleanup is deferred, runs after paint (too late)
2. `useLayoutEffect` + `position:fixed` + `scrollTo` — right timing, but `scroll-behavior:smooth` CSS animated the scroll
3. Added `behavior:'instant'` — still failed because scroll happens during DOM mutation, before any effect
4. Blur before close — correct: prevents the scroll instead of undoing it

**Prevention**:
- When debugging scroll jumps in portaled components, check focus management FIRST — ask "instant or smooth?" to distinguish focus-based scroll from CSS/JS scroll
- `useLayoutEffect` cleanup runs after DOM mutations, not before — don't assume it can prevent browser behavior triggered by DOM removal
- Always check `globals.css` for `scroll-behavior: smooth` when dealing with scroll issues — it silently changes `scrollTo` semantics
- For modal scroll locks: blur the active element in the event handler (before state change), not in effect cleanup (after DOM mutation)

**Lesson**: When the browser does something during DOM mutation, no React effect can prevent it — you must act before React processes the state change. Prefer preventing problems over undoing them.

---
