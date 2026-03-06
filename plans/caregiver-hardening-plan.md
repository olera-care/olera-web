# Caregiver Hardening Sprint — Plan

> Updated 2026-03-06

---

## Conceptual Model: Unified Matches

### The Problem

The current provider hub has fragmented navigation:

| Profile Type | Nav Items | What They Do |
|---|---|---|
| **Organization** | Dashboard, Inbox, **Leads**, **Q&A**, Reviews, **Matches** | Leads = connection cards from families. Matches = browse all family profiles. Two separate pages with overlapping concerns. |
| **Caregiver** | Dashboard, Inbox, **Find Jobs**, Reviews, **Matches** | Find Jobs = browse orgs (broken nav, `/portal/` route). Matches = browse family profiles. Two separate pages with overlapping concerns. |

Problems:
- "Find Jobs" lives at `/portal/discover/providers` — a family-portal route. The Navbar detects `pathname.startsWith("/portal")` and switches to family navigation. This is the root cause of issue #9.
- "Leads" (`/provider/connections`) is a 1,178-line page that duplicates much of what Matches already does (timeline filters, urgency badges, match scoring).
- Organizations see families in Matches but discover caregivers in a separate page (`/portal/discover/caregivers`). There's no nav link to this — it's only reachable from the dashboard.
- Caregivers see families in Matches but discover organizations in Find Jobs. The two halves of their discovery surface are in different navigation systems.

### The Solution: Matches as a Role-Aware Hub

**Matches becomes the single place to see "who's out there for me."** It combines passive discovery (browsable profiles) with active interest (direct outreach), organized by tabs.

**Provider hub nav (both types):** Dashboard, Inbox, Matches, Reviews

That's it. Four items. Clean, symmetrical, memorable.

### Tab Structure

**For Caregivers:**

```
[Families]                    [Organizations]
─────────────────────────────────────────────

Reached Out to You (2)        Reached Out to You (1)
┌─────────────────────┐       ┌──────────────────────┐
│ Sarah M. — Home Care│       │ Sunrise Senior Living │
│ Immediate · 5 mi    │       │ Hiring · Home Health  │
└─────────────────────┘       └──────────────────────┘

Discover                      Discover
┌─────────────────────┐       ┌──────────────────────┐
│ Browse families     │       │ Browse organizations │
│ looking for care    │       │ looking to hire       │
│ (existing Matches   │       │ (existing Find Jobs   │
│  page content)      │       │  page content)        │
└─────────────────────┘       └──────────────────────┘
```

**For Organizations:**

```
[Families]                    [Caregivers]
─────────────────────────────────────────────

Reached Out to You (3)        Applied (1)
┌─────────────────────┐       ┌──────────────────────┐
│ John D. — Memory Cr │       │ Maria J. — CNA       │
│ Immediate · 12 mi   │       │ 5 yrs · $25-35/hr    │
└─────────────────────┘       └──────────────────────┘

Discover                      Discover
┌─────────────────────┐       ┌──────────────────────┐
│ Browse families     │       │ Browse caregivers    │
│ looking for care    │       │ looking for work     │
│ (existing Matches   │       │ (existing Discover   │
│  page content)      │       │  Caregivers content) │
└─────────────────────┘       └──────────────────────┘
```

### Data Sources Per Tab

| Tab | "Reached Out" Section | "Discover" Section |
|---|---|---|
| Families (both roles) | Connections where `type=inquiry` AND `to_profile_id=me` AND `status=pending` | All family profiles where `is_active=true` AND `care_post.status=active` (existing Matches query) |
| Organizations (caregiver) | Connections where `type=invitation` AND `to_profile_id=me` AND `status=pending` | All org profiles where `is_active=true` (existing Find Jobs query) |
| Caregivers (org) | Connections where `type=application` AND `to_profile_id=me` AND `status=pending` | All caregiver profiles where `is_active=true` (existing Discover Caregivers query) |

### Relationship to Inbox

- **Matches** = "who's out there" — discovery + pending inbound interest. Action: accept, decline, or reach out.
- **Inbox** = "who am I talking to" — active conversations with accepted connections.

When a user accepts from Matches, the connection moves to `status=accepted` and the conversation continues in Inbox. Matches and Inbox are complementary, not overlapping.

### What Gets Consolidated

| Current Page | Lines | Absorbed Into |
|---|---|---|
| `/provider/matches` (Families tab) | 1,673 | Matches → Families tab (keep as-is, becomes the default tab) |
| `/provider/connections` (Leads) | 1,178 | Matches → Families tab, "Reached Out" section (inbound connections with pending status) |
| `/portal/discover/providers` (Find Jobs) | 201 | Matches → Organizations tab, "Discover" section |
| `/portal/discover/caregivers` (Discover Caregivers) | ~120 (shared CaregiverCard) | Matches → Caregivers tab, "Discover" section |
| `/portal/discover/families` (Discover Families) | 229 | Matches → Families tab (redundant with existing Matches) |

### What Gets Removed from Nav

- "Find Jobs" (caregiver nav) → gone
- "Leads" (org nav) → gone
- "Q&A" (org nav) → stays for now (not part of this consolidation)

Actually — reconsidering Q&A. The target nav is: **Dashboard, Inbox, Matches, Reviews**. Q&A is org-specific and low-traffic. Two options:
1. Keep Q&A as a 5th nav item for orgs only
2. Move Q&A under Dashboard as a section or link

Recommend option 1 for now — keep Q&A for orgs, defer cleanup. The nav difference between org (5 items) and caregiver (4 items) is acceptable.

### Risk Assessment

The Matches page is 1,673 lines. The Leads page is 1,178 lines. This consolidation is **not a small change**.

**Mitigation strategy:**
1. Don't rewrite from scratch — the existing Matches page becomes the Families tab with minimal changes
2. Add the second tab (Organizations/Caregivers) as a new section that imports existing card components
3. Add the "Reached Out" section at the top of each tab — this is a focused query for pending inbound connections
4. Remove/redirect the old routes only after the new tabs are working

---

## Sprint Plan

### Phase 1: Quick Wins (Low Risk)

These are string changes, copy updates, and small fixes. No architectural changes. Can be done in parallel.

#### H1: Terminology Sweep

**Objective:** Replace "Private Caregiver" with "Caregiver" in all display strings.

**Affected files (estimated ~15):**
- `components/shared/ProfileSwitcher.tsx` — `TYPE_LABELS` map
- `app/provider/onboarding/page.tsx` — step labels, headings
- `app/provider/profile/page.tsx` — section labels
- `components/shared/Navbar.tsx` — mobile menu "Private Caregivers" link
- `app/browse/caregivers/page.tsx` — page heading
- `app/portal/discover/caregivers/page.tsx` — page heading
- `components/shared/NavMenuData.ts` — "Private Caregivers" label
- `components/shared/FindCareMegaMenu.tsx` — dropdown labels
- `lib/profile-completeness.ts` — display strings
- `components/providers/SectionNav.tsx` — role gate labels
- `app/provider/[slug]/page.tsx` — profile page labels

**Approach:** Grep for "Private Caregiver" and "private caregiver" (case-insensitive), replace display strings only. Do NOT change the database enum `caregiver` or any internal type values.

**Risks:** Wide blast radius — must verify no display regressions in other profile types.

**Validation:**
- `grep -ri "private caregiver"` returns only comments, database enum references, or intentional technical identifiers
- Visual spot-check: onboarding, profile switcher, browse page, dashboard

---

#### H2: Copy Fixes (Batch)

**Objective:** Fix incorrect/narrow copy across caregiver UX.

| Location | Current | New |
|---|---|---|
| Onboarding Step 2 subtitle | "This is what families and organizations will see" | "This is how you'll appear to people searching for care." |
| Onboarding contact heading | "How can families reach you?" | "How should people reach you?" |
| Onboarding rate helper | "Helps families understand your pricing." | Remove entirely (field label + "(Optional)" is sufficient) |
| Browse heading | "Find experienced private caregivers in your area." | "Find experienced caregivers in your area." |
| Gallery card (org) | "Upload images to showcase your facility" | "Upload photos to showcase your organization" |
| Gallery card (caregiver) | Same as org | "Upload photos to showcase your caregiving experience" |

**Gallery helper tooltip (new):**
- Org: "Photos of your facility, team, and logo help families build trust."
- Caregiver: "A professional headshot or photos of you providing care help people feel comfortable hiring you."

**Affected files:**
- `app/provider/onboarding/page.tsx`
- `app/browse/caregivers/page.tsx`
- `app/provider/profile/page.tsx` (gallery section)

**Risks:** Low — string-only changes.

**Validation:** Visual review of each screen.

---

#### H3: Name Field Pre-Population

**Objective:** Pre-fill onboarding name from the account record so users don't re-enter it.

**Approach:**
- In the onboarding page init logic, read `accounts.display_name` for the current user
- Set `data.displayName` if it's empty and the account has a name
- User can still edit the pre-filled value

**Affected files:**
- `app/provider/onboarding/page.tsx` (init/resume logic)

**Risks:** OAuth users may have truncated or weirdly formatted names from Google. The field is editable, so this is recoverable.

**Validation:**
- New signup with name "Jane Smith" → onboarding shows "Jane Smith" pre-filled
- User can clear and re-enter a different name
- OAuth user sees their Google display name pre-filled

---

### Phase 2: Caregiver Skill Taxonomy

#### H4: Replace Care Type List with Caregiver Skills

**Objective:** Caregivers should see skill-based options (what they do), not facility types (where care happens).

**New constant `CAREGIVER_SKILLS`:**

```typescript
const CAREGIVER_SKILLS = [
  { id: "personal_care", label: "Personal Care", description: "Bathing, dressing, grooming" },
  { id: "mobility_assistance", label: "Mobility Assistance", description: "Transfers, walking, fall prevention" },
  { id: "medication_reminders", label: "Medication Reminders", description: "Organizing and reminding" },
  { id: "meal_preparation", label: "Meal Preparation", description: "Cooking, nutrition, feeding" },
  { id: "companionship", label: "Companionship", description: "Social engagement, outings" },
  { id: "dementia_support", label: "Dementia / Memory Support", description: "Alzheimer's, cognitive decline" },
  { id: "housekeeping", label: "Housekeeping", description: "Light cleaning, laundry" },
  { id: "transportation", label: "Transportation", description: "Errands, appointments" },
  { id: "overnight_care", label: "Overnight / Live-in Care", description: "Extended hour shifts" },
  { id: "hospice_support", label: "Hospice Support", description: "Palliative comfort care" },
  { id: "respite_care", label: "Respite Care", description: "Relief for primary caregivers" },
];
```

**Where it's used:**
- Onboarding Step 5 — replace `CARE_TYPE_OPTIONS` with `CAREGIVER_SKILLS` when `providerType === "caregiver"`
- Profile page — same conditional for the services/skills editing section
- Public profile page — render skills instead of care types for caregiver profiles
- Browse/discover pages — skill badges on CaregiverCard
- Shared `CaregiverCard.tsx` — display skill names instead of raw care_type values

**Storage:** Skills are stored in the existing `care_types` column on `business_profiles`. The column is `text[]` — it stores whatever string IDs we put in. No schema change needed.

**Migration for existing profiles:** Existing caregiver profiles have values like "Assisted Living" in `care_types`. Options:
1. **Do nothing** — old values render as-is (won't match new labels, will look wrong)
2. **Map old → new on display** — add a fallback mapping
3. **Clear on next edit** — when a caregiver next edits their profile, the old values are shown as unselected and they pick from the new list

Recommend option 3 — it's the simplest and self-healing. On the profile edit page, if the stored value doesn't match any `CAREGIVER_SKILLS.id`, it's simply not checked. The caregiver selects their actual skills and saves.

**Affected files:**
- New: `lib/constants/caregiver-skills.ts`
- Modified: `app/provider/onboarding/page.tsx`, `app/provider/profile/page.tsx`, `app/provider/[slug]/page.tsx`, `components/shared/CaregiverCard.tsx`

**Risks:**
- Existing profiles will show no skills until the caregiver re-edits. This is acceptable for MVP (low caregiver volume right now).
- Need to ensure org profiles still use `CARE_TYPE_OPTIONS` — the conditional must be clean.

**Validation:**
- New caregiver onboarding shows skill list, not facility types
- Org onboarding still shows facility types
- Profile page shows correct list per type
- Public profile renders skill labels correctly

---

#### H5: Onboarding Step 5 Layout Density

**Objective:** Ensure the profile preview card is visible alongside skill selection.

**Approach:**
1. Make the preview card `position: sticky; top: 1rem` so it follows scroll
2. Use a compact 2-column grid for skill toggles (instead of full-width list items)
3. Each toggle: small checkbox/chip with skill name — no long description inline

**Affected files:**
- `app/provider/onboarding/page.tsx` (Step 5 section layout)

**Risks:** Must not break org onboarding layout. Use `providerType === "caregiver"` conditional for the compact grid.

**Validation:**
- On desktop, preview card visible alongside skill selection
- On mobile, skills don't overflow excessively
- Org onboarding layout unchanged

---

### Phase 3: Matches Consolidation

This is the largest change. It should be done after Phase 1 and 2 are stable.

#### H6: Unified Matches Page

**Objective:** Consolidate Matches, Leads, Find Jobs, and Discover pages into a single tabbed Matches page.

**Implementation approach:**

1. **Keep the existing `/provider/matches/page.tsx` as the foundation.** The Families tab is essentially this page with minor modifications.

2. **Add a tab bar** at the top of the Matches page:
   - Caregiver: `[Families] [Organizations]`
   - Organization: `[Families] [Caregivers]`
   - Default to Families tab

3. **Add "Reached Out" section** at the top of each tab:
   - Query `connections` table for `to_profile_id = me` AND `status = pending` AND appropriate `type`
   - Render as compact connection cards (reuse existing card components)
   - Show count badge on tab if pending connections exist

4. **Second tab content:**
   - For caregivers → Organizations tab: import and render the org browse grid (from current discover/providers page)
   - For organizations → Caregivers tab: import and render the caregiver browse grid (from current discover/caregivers page, using shared `CaregiverCard`)

5. **Update Navbar:**
   - Remove "Find Jobs" from caregiver nav
   - Remove "Leads" from org nav
   - Both now have: Dashboard, Inbox, Matches, Reviews (+ Q&A for org)

6. **Redirect old routes:**
   - `/portal/discover/providers` → `/provider/matches?tab=organizations`
   - `/portal/discover/families` → `/provider/matches`
   - `/provider/connections` → `/provider/matches`

**Affected files:**
- `app/provider/matches/page.tsx` — add tab system, second tab content, "reached out" sections
- `components/shared/Navbar.tsx` — remove Find Jobs, remove Leads, update nav arrays
- `app/portal/discover/providers/page.tsx` — add redirect
- `app/portal/discover/families/page.tsx` — add redirect
- `app/provider/connections/page.tsx` — add redirect

**Risks:**
- The Matches page is already 1,673 lines. Adding tab content will make it larger. Mitigation: extract each tab into its own component file.
- The Leads page (1,178 lines) has its own lead status tracking, archiving, etc. Some of this may be redundant with Matches. Need to identify what's unique and preserve it.
- URL bookmarks/deep links to old routes — redirects handle this.

**Validation:**
- Caregiver sees Families + Organizations tabs
- Organization sees Families + Caregivers tabs
- "Reached Out" section shows pending inbound connections
- Tab switching preserves state
- Old routes redirect correctly
- Navbar shows correct items for each profile type
- No family portal nav switching (the `/portal/` route bug is eliminated because everything is under `/provider/`)

---

## Execution Order

```
Phase 1 (parallel, low risk):
  H1: Terminology sweep
  H2: Copy fixes
  H3: Name pre-population

Phase 2 (sequential, medium risk):
  H4: Caregiver skill taxonomy
  H5: Onboarding layout density

Phase 3 (sequential, higher complexity):
  H6: Unified Matches page
```

Phase 1 tasks are independent — all three can be done in a single commit or in parallel.

Phase 2 depends on Phase 1 (terminology) being done first so labels are correct.

Phase 3 depends on Phase 2 (skill taxonomy) being done so the Caregivers tab in Matches shows the right skills.

---

## Out of Scope (Deferred)

| Item | Reason |
|---|---|
| Family portal Matches redesign | Family side (`/portal/matches`) has its own care post system. Not touching it in this sprint. |
| Leads page feature parity audit | Some Leads features (lead status tracking, archiving) may need to be preserved. Full audit deferred to implementation. |
| Q&A consolidation | Q&A is org-specific and not part of the Matches consolidation. Defer. |
| Connection type mapping updates | `connection-card/constants.ts` care type mapping — update after skill taxonomy is stable. |
| `/browse/families` page cleanup | Exists but unclear purpose. Leave as-is. |
