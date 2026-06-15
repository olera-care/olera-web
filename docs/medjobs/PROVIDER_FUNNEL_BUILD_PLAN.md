# MedJobs Provider Funnel — Build Plan (Loops 1–3)

> **Status:** Plan / pre-build. Branch `claude/keen-mendel-6i8iW`. Date 2026-06-15.
> **Relationship to the brief:** This is portal/candidate-side product work (the conversion path D15 anticipated — "portal/Stripe work, not CRM"). The admin outreach CRM (`app/api/admin/student-outreach/[id]/route.ts`, its enums and actions) is **not** touched here, so discipline rules G1–G10 are preserved on the CRM. See `OPERATIONAL_BRIEF.md`.
> **Already shipped:** provider outreach cadence email + call-script copy (`lib/student-outreach/templates.ts`, `sequencer.ts`) — commit `0797635`.

---

## 0. Goal

Take a home-care agency from a cold outreach email all the way to a **confirmed, paid host–intern relationship**, one low-commitment "inch" at a time, reusing the live MVP wherever possible.

```
cold outreach → eligibility → browse candidates → schedule interview
→ interview complete → offer → accept → sign + pay → host–intern relationship confirmed
```

### The three loops
- **Loop 1** — cold email → eligibility screener → welcome browse-candidates page.
- **Loop 2** — browse → view a profile (real student, or fallback recruiting state) → schedule + hold an interview.
- **Loop 2b** — "a student joined" re-activation of the recruiting hold → back into Loop 2.
- **Loop 3** — interview complete → offer → accept → sign + pay → confirmed.

---

## 1. Cross-cutting decisions (apply across all loops)

| # | Decision |
|---|---|
| **Access re-key** | Replace `medjobsAccessActive` (pilot/subscription) as the gate for **board full-access (un-redact), invite ability, and banner state** with a new flag **`medjobs_eligibility_completed_at`** set on screener finish. Pilot/subscription metadata stays only for legacy billing. |
| **Vocabulary** | "regular recurring shifts" / "PRN" — never "steady." |
| **Pricing** | Absent from all core funnel screens. *Pull*: FAQ + Sample Hosting Agreement. *Push*: definitively at the Loop 3 offer/commit. Always bundled with **guarantee + value anchor + the credential line** ("the student earns verified hours + a recommendation through Olera"). |
| **Deplatforming / ToU** | Lightweight **platform Terms (non-circumvention)** via sign-in-wrap (a line under the S6 advance button) + a **welcome email on first auth**. Primary moat = the student's on-platform credential incentive. Direct contact gated until Loop 3 confirm. |
| **Guarantee** | "If it doesn't work out, your next term is on us" — good-faith hours shortfall waives the next-term fee + rematches (same pair or new). |
| **Fee timing** | **Authorize at offer/accept, capture at confirm** (manual-capture PaymentIntents). Both parties pay. |

---

## 2. Data & state changes

### 2.1 Metadata flags — `business_profiles.metadata` (JSON, no migration; in-spirit with discipline)
- `medjobs_eligibility_completed_at` *(provider)* — set on screener finish; **the new access gate.**
- `medjobs_demand_profile` *(provider)* — `{ demand_shape: "regular"|"varies"|"unpredictable", prn_open: "yes"|"maybe"|"no", coverage_buckets: ["day"|"evening"|"overnight"|"weekend"] }`. Drives match filtering + reassurance + Loop 2b targeting.
- `platform_terms_accepted_at` *(provider + student)* — sign-in-wrap acceptance.

### 2.2 The placement record — **SCHEMA DECISION, needs approval (G7 spirit: surface, don't add silently)**
The offer → accept → confirm relationship needs a durable record:
`provider_id · student_id · interview_id · status (offered|accepted|confirmed|declined|cancelled|completed) · internship_agreement_signed_at · provider_payment_intent · student_payment_intent · fee amounts · term · guarantee state`.
- **Options:** (a) extend the existing `interviews` table / its `connection_id`; (b) a dedicated **`placements`** table.
- **Recommendation:** a dedicated `placements` table — this is a genuinely new primitive (peer to D23 Care Shifts, D24 caregiver pool). Flagged for explicit approval.

### 2.3 Payments — Stripe (D15)
- One-time **internship fee, per party, per placement**, via **manual-capture PaymentIntents** (authorize at offer/accept, capture at confirm). Distinct from the existing subscription/pilot Stripe path (`medjobs_subscription_active`). New payment records on the placement.
- **Student auto-release:** if the placement isn't confirmed, authorizations release, never captured.

---

## 3. Loop-by-loop build

Legend: **Reuse** (as-is) · **Adapt** (small change to existing) · **Build** (new).

### Loop 1 — cold → eligibility → welcome board
| Item | Type | Files |
|---|---|---|
| Cold email + call copy (CTA: check eligibility) | ✅ shipped | `templates.ts`, `sequencer.ts` |
| Magic-link landing → candidates board, campus-filtered | Reuse | `app/medjobs/m/[token]/route.ts`, `welcome-token.ts`, `app/medjobs/candidates/page.tsx` (`?welcome=1&university=`) |
| Cold link → magic link (so cold entrants are identified) | Adapt | cold send pipeline must populate `{welcome_url}` (today only activation does; falls back to `{program_url}`) — multi-use/per-send token |
| **Eligibility screener modal** (S1 intro → Q1 demand → Q2 PRN → Q3 coverage → loading) over the greyed board | **Build** | new modal; mount via the existing `?welcome=1` auto-open mechanism (the slot `WelcomeBanner`/`PilotTermsModal` use today) |
| On finish: write `medjobs_eligibility_completed_at` + `medjobs_demand_profile`, then reveal board | Build | screener submit → metadata; board reads the new flag for full access |
| "You're a fit" **matches** state (preview + Dr. DuBose welcome graphic + `[Browse interns]`, terms line under button) | Build (reframe) | repurpose `WelcomeBanner.tsx` |
| "You're a fit" **recruiting** state (= board empty state: recruiting + Dr. DuBose welcome + `[Meet Dr. DuBose]` Calendly) | Adapt | existing empty state in `candidates/page.tsx` (reframe the DEMO slot into the Dr. DuBose CTA) |
| Welcome browse page banner: "Interview students before you commit" + `[Learn more about hosting]` | Adapt | `WelcomeBanner.tsx` (stateful: pre-eligibility = "Check eligibility"; post = "Learn more") |
| **Learn-more info modal** (CTA "Interview students"; links Sample Hosting Agreement + Hosting FAQ) | Build (evolve) | from `PilotTermsModal.tsx` shell |
| Board full-access / redaction re-keyed to eligibility flag | Adapt | `candidates/page.tsx`, `lib/medjobs/pilot-tier.ts` readers |
| Welcome email on first auth (ToU + what's next) | Build | `lib/email-templates.tsx` |

### Loop 2 — browse → profile → interview
| Item | Type | Files |
|---|---|---|
| Browse card + match line ("covers your evenings & weekends") | Adapt | `CandidateCard.tsx` (MVP match = campus-level) |
| Candidate profile | Reuse | `app/medjobs/candidates/[slug]/page.tsx` |
| CTA → "Invite to a video interview"; **remove `!hasPilot` PilotTermsModal gate** | Adapt | `ContactSection.tsx` (`handleScheduleClick`, lines ~123–133, 286–296) |
| Schedule modal: default video, **remove `termsAccepted` checkbox**, "invite/no-commitment" copy | Adapt | `ScheduleInterviewModal.tsx` |
| `POST /interviews`: gate on eligibility (not pilot), notify student immediately (reconcile `is_pending_verification`) | Adapt | `app/api/medjobs/interviews/route.ts` (paywall ~147–155, notify ~296) |
| Proposed → student notified → accept/propose | Reuse | `interviewProposedEmail`, `/portal/medjobs/interviews`, `InterviewCalendar` |
| Confirmed → `.ics` + confirmation emails | Reuse | `ics-generator.ts`, `interviewConfirmedEmail` |
| Video link in `.ics` + email | Build (**parked**) | `ics-generator.ts` LOCATION ("link TBD") — provider TBD |

### Loop 2b — "a student joined" re-activation
| Item | Type | Files |
|---|---|---|
| New student onboarded matching `medjobs_demand_profile` (+ campus) → email → magic link → profile + invite CTA → re-enter Loop 2 | Build | scheduled match check + email + reuse magic-link→profile |

### Loop 3 — interview → offer → accept → confirmed
| Item | Type | Files |
|---|---|---|
| Auto post-interview emails at scheduled end (provider: "decide" w/ magic link to the calendar popup · student: "send intent to accept") | Build | scheduled job + `email-templates.tsx` |
| Student "intent to accept" → thank-you/nudge email to provider w/ `[Offer to host]` | Build | endpoint + email |
| **L3·S1 = the existing calendar detail popup**, + actions `[Offer to host]` / `[Not a fit]` for held interviews | Adapt | `InterviewCalendar.tsx` (detail modal ~464–891) |
| **Offer** = sign Internship Agreement + **authorize** fee → send offer | Build | Internship Agreement modal (evolve `PilotTermsModal`); Stripe manual-capture; `placements` record |
| **Accept** = student agree + **authorize** fee | Build | student offer view + Stripe |
| **Confirmed** (auto on accept) = capture both → internship begins; contact unlocked; hours tracking begins | Build | capture + placement status + reuse verified-hours |
| 3-day no-offer reminder (provider + student); offer-auth-expiry re-auth nudge | Build | scheduled jobs |
| Internship Agreement content (student owns hours + letter; "keep on Olera" dropped; fee + guarantee + credential line) | Build | placeholder in §5 below |

---

## 4. Emails & scheduled jobs

**Reuse:** `interviewProposedEmail`, `interviewConfirmedEmail` (+`.ics`), `interviewCancelledEmail`; provider outreach cadence (shipped).
**New emails:** welcome (first auth); post-interview "decide" (provider) + "intent to accept" (student); intent-to-accept provider nudge; offer / accept / confirmed transactional; 3-day no-offer reminder; offer-auth-expiry nudge; Loop 2b "a student joined."
**New scheduled jobs (none exist today beyond `publish-pending-interviews`):** fire post-interview emails at the invite's end time; 3-day no-offer reminder; offer-auth-expiry/re-auth; Loop 2b match-on-new-student.

---

## 5. Placeholder Internship Agreement (host-facing; for review)

> **Olera Internship Agreement** — a short mutual agreement to run an Olera caregiving internship together. Covers the Olera internship only; your normal hiring/employment steps happen separately during onboarding.
> **Both agree to:** run it in good faith, communicate openly, and keep the availability you agreed on, barring emergencies.
> **The host agrees to:** be the employer (schedule, pay, supervision, your own background check before they start); **confirm the student's logged hours**; give a reference + recommendation **if asked and they meet your standards**.
> **The student agrees to:** **log their own hours**, drive their own letter-of-rec request, keep agreed availability and communicate changes, act professionally, meet the hours threshold.
> **Fee + guarantee:** [fee] per party, one time. If it doesn't work out in good faith (client demand / availability shifts), your next term is on us and we rematch — same pair or new — until it works.

---

## 6. Discipline & deferred-registry check

- **CRM discipline (G1–G10): preserved** — no admin outreach `route.ts` actions, no `Status`/`Stage`/`TouchpointType` enum changes, no CRM tables touched. This is portal-side.
- **Metadata-over-schema honored** except the two flagged net-new pieces — the **`placements` table** and **payment records** — which are surfaced here for explicit approval (G7), not added silently.
- **Builds D15** (portal/Stripe conversion).
- **New deferrals to register** (D-series): video-call link generation; interview/calendar reminders beyond native `.ics`; match-ranking beyond campus-level; Google Calendar/Meet integration; Loop 2b auto-reactivation (if not in MVP).

---

## 7. Resolved vs. parked decisions
- **Resolved:** fee timing = authorize-at-offer/capture-at-confirm · both parties pay · terms held to Loop 3 · "regular recurring/PRN" vocabulary · ToU via sign-in-wrap + welcome email · contact unlock at confirm · student owns hours + letter.
- **Parked (for the audit pass):** video provider (Jitsi/Whereby/Meet) · email/SMS reminders beyond `.ics` · exact contact-gating strictness · **student-fee amount/affordability (the one seam where the student could balk)** · `placements` table vs. extend interviews.

---

## 8. Suggested build sequencing (each phase independently shippable)
- **Phase A — Foundations:** `medjobs_eligibility_completed_at` flag + re-key board/invite/banner gates + `medjobs_demand_profile` storage + ToU sign-in-wrap + welcome email.
- **Phase B — Loop 1:** eligibility screener (S1–S6) + `WelcomeBanner` reframe + you're-a-fit matches/recruiting states + Learn-more modal.
- **Phase C — Loop 2:** `ContactSection` + `ScheduleInterviewModal` + `POST /interviews` adaptations → interview flow live end-to-end (reusing emails/`.ics`/`InterviewCalendar`).
- **Phase D — Loop 3:** `placements` table + dual-pay Stripe + Internship Agreement modal + offer/accept/confirm + post-interview emails/reminders + contact unlock + hours-tracking handoff.
- **Phase E — Loop 2b:** "a student joined" re-activation.

---

## 9. Fall-off hotspots to watch (from the end-to-end review)
1. Cold-email engagement (VERY HIGH, structural — volume leak).
2. Loop 3 money moment / dual-pay (HIGH — defended by guarantee + value + credential + auth-at-offer).
3. Seeding-market fallback / no students (HIGH — structural liquidity; Loop 2b + Dr. DuBose are the recovery).
4. Two-sided handshakes — interview-accept, offer-accept (MED–HIGH — defended by the notification/reminder layer).
5. Post-interview stall (MED–HIGH — the auto-emails + 3-day reminder target this).
6. **Student-fee affordability** — validate; the student is the cash-poor side.

> Throughput is ultimately gated by **student supply** — the provider funnel converts only as fast as recruiting feeds matching students.
