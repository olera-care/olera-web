# Matches Page & UX Refinement Plan

## 1. Restatement of Purpose

### Matches Page for Caregivers
**Core question it answers:** "Who needs my services right now, and how do I connect with them?"

A caregiver's primary goal is to find work. The page must serve as their **opportunity hub** — surfacing both people who specifically want *them* and people who are openly looking for someone like them. The page should make the highest-value opportunities unmissable and make outreach frictionless.

### Matches Page for Organizations
**Core question it answers:** "Who can we hire, and who already wants to work with us?"

An organization needs to staff caregivers. The page must surface both caregivers who have proactively applied and caregivers who are available and match the org's needs. For completeness, it also shows families seeking organizational care.

---

## 2. Proposed Page Structure

### Current problem
The page opens with a flat list of family cards and timeline-based filters (Immediate, Within 1 month, Exploring). This treats all opportunities as equal and provides no hierarchy of urgency or signal quality. A user landing here doesn't know what they're looking at or what to do first.

### Proposed structure: Two clear sections

**Section A: "Interested in you"** (direct interest — highest signal)
- Families who sent an inquiry *to this provider* (connection type=inquiry, to_profile_id=provider)
- Organizations who sent an invitation *to this caregiver* (connection type=invitation, to_profile_id=caregiver)
- These are people who **chose you specifically** — highest conversion probability
- Shown at the top of the page with a distinct visual treatment (e.g. highlighted card border, badge count)
- Primary CTA: "Respond" / "View & reply"
- If empty: a brief contextual note ("No one has reached out yet. Complete your profile and reach out to families below to increase your visibility.")

**Section B: "Open opportunities"** (discovery — proactive outreach)
- Families with active care posts matching the provider's services and location
- Organizations hiring caregivers (for caregivers)
- Caregivers available to hire (for organizations)
- This is where the provider takes initiative
- Primary CTA: "Reach out"
- The existing timeline filters (Immediate, Within 1 month, Exploring) move here as *sub-filters* within this section — they make sense for prioritizing within discovery, but they should not be the top-level page concept
- Sort options remain (best match, most recent, most urgent)

### Why this works
- **Principle 1** (proactive discovery): Section B is explicitly for browsing and outreach
- **Principle 2** (direct interest = high priority): Section A surfaces these first, visually separated
- **Principle 3** (generally visible profiles): Section B shows everyone who's open to contact
- The user immediately understands the two modes: "respond to interest" vs. "find new opportunities"

### Page header
**Title:** "Opportunities"
**Subtitle:** "People looking for caregivers like you. Respond to direct interest first, then discover new families and organizations to reach out to."

For organizations:
**Title:** "Opportunities"
**Subtitle:** "Caregivers and families looking for your services. Respond to direct interest first, then discover new matches."

### What replaces the current Families/Organizations toggle
- For caregivers: Section B gets a **Families | Organizations** toggle (same as now, but scoped to the discovery section only)
- For organizations: Section B gets a **Families | Caregivers** toggle
- Section A always shows all direct interest regardless of source type

---

## 3. Recommendation on Current Filters/Toggles

### Replace top-level timeline filters with the two-section model above

The current "All matches / Immediate / Within 1 month / Exploring" tabs are the primary controls on the page. This is problematic because:
- They only make sense for families (not orgs or caregivers)
- They don't communicate *what kind* of opportunity each card represents
- They hide the most important signal (direct interest vs. general visibility)

### Keep timeline filters, but demote them
Move them inside Section B as a secondary filter bar. They're useful for prioritizing within discovery, just not as the top-level page concept.

### Keep sort options as-is
"Best match", "Most recent", "Most urgent" remain useful within discovery.

---

## 4. Experience & Services Selector Design

### Corrected direction
Both **Services** and **Certifications** should use the **clean pill/box style**:
- Rounded outline boxes (`rounded-xl`)
- Unselected: white bg, gray border, gray text
- Selected: subtle colored background, colored border, colored text, optional inline checkmark icon (not a checkbox widget)
- No literal checkbox UI element
- `flex flex-wrap` layout for certifications (variable-length labels)
- `grid grid-cols-2` layout for services (since they have descriptions)

The org care types selector already uses this pattern correctly. The caregiver services and certifications selectors need to be updated to match.

### Specific changes
- **Caregiver services:** Remove the `<span>` checkbox element. Use the pill style: colored border + bg + inline checkmark SVG on selected state. Keep the 2-column grid since services have sub-descriptions.
- **Certifications:** Same pill style. Switch back to `flex flex-wrap` since cert labels are short and variable-length — a grid wastes space.

---

## 5. Organization Name Persistence

### Current bug
The onboarding prefill logic applies `account.display_name` to the organization name field. But `account.display_name` is the *person's* name from auth — not the organization's name.

### Fix
Skip the display name prefill when `providerType === "organization"`. The org name field should start blank. The person's name is irrelevant for the organization profile name.

---

## Implementation Order

1. Fix org name persistence (small, isolated change)
2. Fix services/certifications selector styling (contained to onboarding page)
3. Restructure matches page with two-section model (largest change)
