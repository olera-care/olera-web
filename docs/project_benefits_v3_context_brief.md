---
name: Benefits Pipeline v3 Context Brief
description: Context from Apr 9 session — Chantel meeting insights, editorial quality gaps, new fields, rendering patterns, and pipeline mode concepts to apply on eager-ride branch
type: project
originSessionId: c0fd36a4-f96c-4455-a1fc-5c2b4503272e
---
# Benefits Pipeline v3 — Context Brief for eager-ride

Feed this into a session on the `eager-ride` branch. It captures everything learned from the Apr 9 session (plucky-rubin branch) that eager-ride doesn't already know.

---

## 1. Chantel Meeting Notes (Apr 9, 2026)

**Notion page:** "Benefits Hub Next Steps & Olera Growth Plan (Accuracy Check & Expansion)"

**Key decisions from TJ + Chantel:**
- Each program gets a 4-tab structure: **About / Eligibility / How to Apply / Resources**
- But NOT all programs need all 4 tabs — resources (ombudsman, legal hotline, SHIP) only need About + Resources. Tab structure adapts to program type.
- AI pipeline should have **complexity classification** to determine research depth — some pages need deep dives, others are simple contact-focused pages
- AI gets **latitude to create optimal page structure** per program type, rather than forcing uniform templates
- State-by-state deep dive reviews start with AI-generated content, then human review
- Pipeline must **NEVER cite Olera as a source** (circular reference)
- Geography is a **property of programs**, not a rigid URL hierarchy — pipeline discovers natural geographic units (federal with state variation, state-specific, county/city/service area)
- Focus on **most popular providers and top counties** rather than comprehensive county-level coverage

**Platform engagement context (as of Apr 9):**
- 76 questions posted yesterday, 600 views/day, ~5 leads/day
- 10 provider responses in past 7 days (Trinity Health, Complete Care, Synergy)
- Benefits library positioned as key value prop to drive care seeker sign-ups

---

## 2. Chantel's PR #523 — Editorial Quality Patterns to Extract

Chantel's Texas PR is **NOT to be merged as-is** (container-heavy design). But the editorial quality bar and content patterns should inform the pipeline's draft prompts.

### Document Checklists (the biggest gap)
Current pipeline drafts have generic or missing document lists. Chantel's Texas content shows program-specific granularity:

- **MEPD (15 items):** "Social Security cards for all household members", "Medicare card (both parts)", "Bank statements for all accounts (last 3 months)", "Investment documents (stocks, bonds, annuities, trust agreements)", "Property documents (deeds, tax statements, royalty statements)", "Life insurance policies with face values", "Vehicle titles and registration", "Pre-need burial contracts or irrevocable burial trusts"
- **MOW (6 items, simpler):** "Government-issued photo ID to verify age", "Documentation of homebound status or medical necessity", "Basic medical information — diagnoses, mobility limitations, dietary restrictions"
- **STAR+PLUS (7 items):** Includes "Bank statements up to 60 months prior to application" (longest lookback)

**Rule:** Documents must be CONCRETE — "Social Security award letter" not "proof of income"

### FAQ Quality
Current pipeline FAQs are shallow/definitional. Chantel's FAQs answer real decision-making questions:

- "Can my parent keep their house if it's worth more than $2,000?" (asset limit confusion)
- "Can a family member apply on behalf of an elderly parent?" (common use case)
- "What if my landlord won't sign the permission form?" (weatherization blocker)
- "How long is the waitlist really?" (STAR+PLUS: months to years by region)
- "Can I apply for weatherization and CEAP at the same time?" (cross-program)
- "What happens after I am already enrolled and my needs change?" (reassessment)

**Rules:**
- Minimum 6 FAQs for deep programs, 4 for medium, 2 for simple
- Must include at least one cross-program FAQ if related programs exist
- Must answer decision-making questions, not definitions

### Application Notes (conditional guidance)
Chantel added contextual warnings/tips that depend on the situation:

- "Crisis cases with active disconnection notices may get expedited processing within 48 hours"
- "Some MCOs have immediate openings while others maintain 6-month waitlists — ask about availability when choosing"
- "You can apply while still in the hospital; discharge planners often initiate the process"

### Contacts
Program-specific phone numbers with hours and descriptions:

```json
[
  {"label": "Texas 2-1-1", "phone": "2-1-1", "description": "Free 24/7 helpline for all social services", "hours": "24 hours, 7 days a week"},
  {"label": "HHSC Benefits Line", "phone": "(877) 541-7905", "description": "Medicaid and benefits questions", "hours": "Mon-Fri 8am-6pm CT"}
]
```

### Regional Applications
For programs with regional intake (CEAP in Texas has Coastal Bend, Austin, Dallas offices):

```json
{"region": "Coastal Bend", "counties": ["Nueces", "Kleberg", "San Patricio"], "url": "https://...", "isPdf": true}
```

### Resource Program Distinction
Simpler programs (legal aid, SHIP counseling, ombudsman, companion program) get a 1-page treatment — just what it is, who to call, and where to go. No eligibility gates, no application process.

---

## 3. Five New Draft Fields to Add

Add to the pipeline's draft prompt schema and the `PipelineDraft` interface:

```typescript
documentsNeeded?: string[] | null;  // 6-15 program-specific items
contacts?: { label: string; description?: string; phone: string; hours?: string }[] | null;
regionalApplications?: { region: string; counties?: string[]; url: string; isPdf?: boolean }[] | null;
applicationNotes?: string[] | null;  // Conditional guidance strings
relatedPrograms?: string[] | null;   // Sibling programs by name
```

**Also add to `WaiverProgram` interface** in `data/waiver-library.ts` so hand-curated programs can have these fields too.

### Few-Shot Exemplars for the Draft Prompt

Include these in the draft prompt to calibrate quality:

```
EXEMPLAR — Document Checklists (MEPD, 15 items):
["Social Security cards for all household members", "Medicare card (both parts)", "Proof of age (birth certificate or passport)", "Proof of Texas residency (utility bill, lease, or state-issued document)", "Most recent Social Security award letter", "Pension or retirement income statements", "Bank statements for all accounts (last 3 months)", "Investment documents (stocks, bonds, annuities, trust agreements)", "Property documents (deeds, tax statements, royalty statements)", "Life insurance policies with face values", "Vehicle titles and registration", "Pre-need burial contracts or irrevocable burial trusts", "Legal documents if you have a representative", "Documentation of medical expenses paid out-of-pocket (last 3 months)", "Proof of health insurance premiums paid"]

EXEMPLAR — FAQs (decision-making, not definitions):
Q: "Can my parent keep their house if it's worth more than $2,000?" A: "Yes, the primary home doesn't count toward the $2,000 asset limit as long as your parent lives there (or intends to return) and the home equity is $730,000 or less."
Q: "Can a family member apply on behalf of an elderly parent?" A: "Yes. You can apply as an authorized representative. Bring your own ID and your parent's documents."

EXEMPLAR — Application notes:
["Crisis cases with active disconnection notices may get expedited processing within 48 hours", "Some MCOs have immediate openings while others maintain 6-month waitlists"]

EXEMPLAR — Contacts:
[{"label": "Texas 2-1-1", "phone": "2-1-1", "description": "Free 24/7 helpline", "hours": "24/7"}]
```

---

## 4. Rendering Approach (What Worked)

### BenefitPageShell, NOT layout.tsx
A `layout.tsx` at `app/waiver-library/[state]/[benefit]/` wraps ALL child routes including `checklist/` and `forms/` — causing double hero and broken layouts. Use a shared `BenefitPageShell` component instead, which each tab page explicitly wraps itself in.

### Data Merge Layer (lib/program-data.ts)
- `getEnrichedProgram(stateId, programId)` — merges WaiverProgram + PipelineDraft
- Hand-curated fields always win over pipeline-generated
- Maps state slugs ("alabama") to abbreviations ("AL") for pipeline lookup
- Fuzzy ID matching for pipeline drafts (normalize to lowercase alphanumeric)
- `getAvailableTabs(program, basePath)` — returns tabs based on programType + data availability
- `getProgramType(program)` — auto-detects from name patterns, manual override via `programType` field

### Tab Availability Rules
| Program Type | Tabs |
|---|---|
| benefit (deep/medium) | About, Eligibility, How to Apply, Resources |
| benefit (simple) | About, How to Apply, Resources |
| resource / navigator | About, Resources |
| employment | About, How to Apply, Resources |

---

## 5. Pipeline Mode Concepts

The pipeline should support modes beyond initial seeding:

- **`seed`** (default): Full 6-phase pipeline — explore → dive → compare → classify → draft → report
- **`refine`**: Load existing drafts, identify weak areas (FAQs < 5, missing documents, no contacts), re-draft only weak programs with augmented prompt
- **`update`**: Re-run explore + dive, diff against existing drafts for changed data (income limits, URLs, phones). Patch fields without full re-draft.

Refine weakness detection:
```javascript
if (!draft.documentsNeeded || draft.documentsNeeded.length < 3) weaknesses.push("documents");
if (!draft.faqs || draft.faqs.length < 4) weaknesses.push("faqs");
if (!draft.contacts || draft.contacts.length === 0) weaknesses.push("contacts");
if (!draft.applicationNotes || draft.applicationNotes.length === 0) weaknesses.push("applicationNotes");
if (!draft.relatedPrograms || draft.relatedPrograms.length === 0) weaknesses.push("relatedPrograms");
```

---

## 6. TypeScript Lesson: null vs undefined

**All TypeScript interfaces for JSON-serialized data must accept `| null` on array and object fields.** JSON has no `undefined` — absent arrays serialize as `null`. This caused 2 Vercel build failures on plucky-rubin.

Applies to: `PipelineDraft`, `WaiverProgram`, `StructuredEligibility`, `ApplicationGuide` — every `string[]`, `object[]`, or nested object field needs `| null`.
