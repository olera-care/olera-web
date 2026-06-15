# Step 2 — Destinations Reframe Plan

**Status:** Approved 2026-06-14. Building.
**Context:** The cold + warm outreach emails were reframed to "Pre-Health Caregiving
Internship" language (Step 1, already shipped on this branch). This step closes the gap
between what the emails *promise* and what recipients *land on*. The destination pages,
PDFs, and apply form still use the old "Student Caregiver Program / Pilot / Hire Local
Caregivers" framing.

## Locked decisions

1. **Reframe browse-and-hire in place.** Keep the candidate-board mechanism; repackage it
   as the internship. No structural/marketplace rebuild.
2. **Tiered student commitment.** Top of funnel (home, apply hero, student PDF) =
   low-friction "paid + credential + experience." The semester-commitment ask moves to the
   matching/interview step, not the apply form.
3. **Public name: "Pre-Health Caregiving Internship."** "MedJobs" stays internal (routes,
   code, internal docs). Never surface "MedJobs" in user-facing copy.

## The gap (email promise → page reality)

| Persona | Cold-email link | Lands on | Mismatch |
|---|---|---|---|
| Advisor | `[overview]` → program PDF | PDF titled "Student Caregiver Program" | naming |
| Dept head | `[overview]` → program PDF | same | naming |
| Student org | `[flyer]` + `[application link]` | PDF + `/medjobs/apply` (commitment-heavy top) | naming + friction |
| Provider | `[website]` → `/medjobs/providers` | "Staff who show up for your clients" / "Browse Candidates" | reads as staffing marketplace, not matched internship; no DuBose/NIH |

## Build order (steps 1–4)

### Step 1 — Page copy + naming reframe (no mechanism change)
- `app/medjobs/page.tsx` — home: internship framing, tiered (paid + credential first).
- `app/medjobs/providers/page.tsx` — **heaviest.** Repackage as managed internship:
  semester/matched framing, port Dr. DuBose + NIH credibility from the partner portal,
  relabel "Browse Candidates" → intern language, add a "talk with Dr. DuBose" path.
- `app/medjobs/candidates/page.tsx` — "Hire Local Caregivers" → intern framing.
- `app/medjobs/staffing-pilot/page.tsx` — "Student Caregiver Pilot" T&C → internship.
- `app/medjobs/partner/[token]/page.tsx` — residual "Student Caregiver Program" strings.
- Metadata/`<title>` strings across the above.

### Step 2 — PDFs
- `lib/program-pdf/Template.tsx` — hardcoded title + DuBose signature title →
  "Pre-Health Caregiving Internship" (highest-leverage string; in every PDF).
- provider + student config copy → internship framing (tiered for student).
- **Audience routing — already correct on the live path.** The live Smartlead
  channel (`smartlead-bridge.ts` → `toSmartleadHtml`) already builds
  `&audience=student` for partner/org emails and `&audience=provider` for
  provider emails, and `/api/medjobs/program-pdf` honors the param. No fix needed.

### Step 3 — Tiered apply
- `app/medjobs/apply/page.tsx` — soften the top (paid + credential first); keep
  attestations but move the semester-commitment framing to the matching step.

### Step 4 — Plumbing parity — RESOLVED BY INVESTIGATION (no build)
- The Resend path (`email-send.ts` / `sendOutreachEmail`) is **dead for the live
  funnel**: `auto-send-executor.ts` → `executeEmailTask` short-circuits with
  `skipped_smartlead_owned` and returns before `sendOutreachEmail` is ever
  called. Smartlead owns delivery. No token-parity work needed; treat
  `email-send.ts` as deprecated/legacy.

## Discipline
- No new backend enum values / actions without checking `OPERATIONAL_BRIEF.md`.
- Keep mechanism intact — this is a copy/framing pass, not a refactor.
- "MedJobs" never appears in user-facing copy.
