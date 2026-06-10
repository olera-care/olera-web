# MedJobs — Partner Recruitment System (Canonical Spec)

> **Status:** Planning / pre-build. This is the engineering reference for the **partner (university stakeholder) recruitment** side of MedJobs — identifying, researching, contacting, and activating university recruitment partners who help us reach students.
>
> **Read first:** `docs/medjobs/OPERATIONAL_BRIEF.md` — the canonical CRM reference (vocabulary, state machine, discipline rules G1–G10, deferred registry). This document extends it; it does not replace it.
>
> **Reconciliation note:** the Operational Brief is dated May 14, 2026 (`main` at `5702be6`) and predates the **activation system** (the simplified post-outreach workflow: Interested → activation cadence → magic link → terminal-active). Where the Brief describes the four Log modals, this spec follows the **current activation model** that replaced them in the drawer. Both still share the same backend conversion engine.

---

## 1. Goal

Build a scalable **partner prospecting and outreach system** that recruits students through trusted university channels. The partner is not a customer and not an employer — they are a **trusted intermediary** who helps share the Student Caregiver Program with students.

The terminal positive state is **"Recruitment Partner Active"**: a partner who has agreed to help share the program and (Phase 3) has portal access.

Partner subtypes (MVP): **pre-health advisor, student organization leader, department head.** **Professor** is scaffolded but gated off until a department head grants permission.

---

## 2. The central realization: ~70% already exists

The partner/stakeholder funnel was the **original** MedJobs design; providers were layered on top later. Most of Phases 1–2 is revival/extension, not net-new.

| Capability | Status in code | Reference |
|---|---|---|
| Partner subtypes as first-class | ✅ `StakeholderType = "student_org" \| "advisor" \| "professor" \| "dept_head"` | `lib/student-outreach/types.ts:8` |
| Prospect rows carry the subtype | ✅ `kind: StakeholderType \| "provider"` | `types.ts:268` |
| Subtype-aware email copy (formal for dept_head/professor) | ✅ switch on `stakeholder_type` | `lib/student-outreach/templates.ts:232+` |
| Professor-permission gating + colleague referral | ✅ `permission_dependency_id`, `redirect_initiated` touchpoint | `types.ts:280`, `route.ts:496` |
| Outreach pipeline (pre-flight → email/call → reply → meeting) | ✅ shared with providers | `queue/route.ts`, `NextStepCard.tsx`, `cadence.ts`, `sequencer.ts` |
| Partner conversion engine | ✅ `mark_partner` → `active_partner` + `distribution_evidence` + `distribution_confirmed` touchpoint | `route.ts:handleMarkPartner` |
| Partners tab + metrics | ✅ | `tab-config.ts` (`partners`, `partners_added`) |
| Manual partner add | ✅ | `app/admin/student-outreach/AddStakeholderModal.tsx` |
| Magic-link auth + portal shell | ✅ (candidates) — reusable | `app/medjobs/m/[token]`, `lib/medjobs/welcome-token.ts`, `app/medjobs/candidates/` |
| Activation cadence + magic-link activation flow | ✅ (just shipped) | activation-system work |
| AI research accelerator pattern | ✅ (providers) — adapt | `app/api/admin/medjobs/enrich-contact`, `lib/medjobs/outreach-enrichment.ts`, `SnapshotCard.tsx` |

**Net-new work is only two things:** (1) the **AI partner-sourcing widget**, and (2) the **Partner Portal**.

---

## 3. Vocabulary (partner-specific; extends Brief §3)

| Term | Definition |
|---|---|
| **Recruitment Partner** | The role name. Backend state is the existing `active_partner` status on a stakeholder row; "Recruitment Partner Active" is its human label. |
| **Partner Prospect** | A stakeholder candidate (`kind ∈ {advisor, student_org, dept_head, professor}`) for a Site. Already defined in the Brief. |
| **Source map** | The set of university pages the AI identifies as worth checking for a given Site + subtype (advising pages, org directories, dept/faculty directories, career center, LinkedIn). |
| **Partner Portal** | A magic-link surface where an activated partner shares the flyer, adds colleagues/events, requests meetings, and sees outcomes. |
| **Recruitment Partner Active** | Human label for a stakeholder `active_partner` whose activation completed (agreement acknowledged). |
| **Permission dependency** | A professor/department row blocked from outreach until its dept-head parent grants permission (`permission_dependency_id`). |

---

## 4. The funnel (reconciled with the activation model)

```
  Site  ──►  Partner Prospect  ──►  Pre-Flight  ──►  Outreach  ──►  Warm signal  ──►  Activation  ──►  Recruitment Partner Active
 (campus)   (advisor/org/dept,     (verify        (subtype-     (reply/call/      (cadence +        (mark_partner →
            AI-sourced)            contact)       aware email   meeting:           magic link →      active_partner +
                                                  + calls)      "Interested")      portal agree)     distribution_evidence)
```

This mirrors the provider funnel exactly, with two substitutions:
- **The ask** is "help share this with students," not "hire students."
- **Conversion** routes through `mark_partner` (stakeholder), never `make_client` (provider) — the single most important invariant (Brief §2.5). The portal "agree to be a Recruitment Partner" step is the partner analog of the provider Terms acceptance; it records `distribution_evidence` and fires `mark_partner`.

---

## 5. Phase 1 — AI partner sourcing + verification (the real new build)

**Problem:** unlike providers, we have no clean directory of university partners. Data is scattered across advising pages, org directories, dept/faculty directories, LinkedIn, career portals. So the widget is a **research accelerator, never a truth source** (human-in-the-loop, same as provider pre-flight).

### 5.1 Two-stage contract

1. **Source-map stage** — input: a Site + subtype. Output: a ranked list of **pages to check** with URLs (pre-health advising, student-org directory, dept faculty/staff directory, student affairs, career center, relevant LinkedIn). Valuable even when extraction is weak — it turns "research from scratch" into "audit a list."
2. **Extract stage** — output: structured candidate records, **every field carrying a source URL**, all marked `unverified`:
   - **Advisor:** name, title/role, email, phone, advising-office page, LinkedIn, notes.
   - **Student org:** org name, leader name(s), org email, officer emails, socials, directory/website link, GroupMe/Discord/Slack/WhatsApp references, notes.
   - **Dept head:** department, chair/head name, email, phone, profile link, notes. Relevant departments: biology, chemistry, psychology, public health, kinesiology, nursing/pre-nursing, allied-health prereq depts.

### 5.2 Human-in-the-loop

Admin reviews each candidate → accept / edit / reject / add-missing → accepted records **materialize into `student_outreach` rows** (`kind` = the subtype), entering the existing pre-flight. Mirrors provider materialization (`provider-prospects/materialize`). Pre-flight verifies: name/org, role/subtype, email, phone (if any), source URL, Site association, notes.

### 5.3 Discipline fit (Phase 1)

- **No new enums** — subtypes already exist (`StakeholderType`). ✅ G1
- **No new tables** — output is ephemeral (returned to client) or written to `research_data`; accepted records are normal `student_outreach` rows. ✅ G3
- **New admin route + UI** for the widget — allowed (it's tooling, like `enrich-contact`), not a new CRM action/enum. Materialization should reuse the existing action path. ✅ G2/G4
- AI engine: reuse **Perplexity** (already used in enrichment) — budget per-Site cost.

---

## 6. Phase 2 — Partner outreach (mostly wiring existing pieces)

Route stakeholder rows through the **existing** pipeline and activation model:
- **Subtype-aware copy** already exists (`templates.ts` switches on `stakeholder_type`, formal for dept_head/professor) — extend wording per the partner "ask," don't invent new infrastructure.
- **Calls** where phone exists; **replies/meetings** via the same drawer.
- **Warm signal → activation:** the drawer's Interested action launches the activation cadence; terminal is `mark_partner` → `active_partner`.
- **Permission gating:** professor/dept rows respect `permission_dependency_id` — no outreach to a professor until the dept-head parent is `active_partner` or grants permission. Colleague referrals from a partner create new prospects (the `redirect_initiated` / referral primitive).

### 6.1 The four subtype "asks" (copy, not code)

| Subtype | Tone | Core ask |
|---|---|---|
| Advisor | warm-professional | share flyer / forward to pre-health student list; introduce colleagues |
| Student org leader | peer, energetic | post flyer to IG/GroupMe/Discord/Slack; mention at a meeting |
| Dept head | formal | permission to reach professors; share with the department; intro |
| Professor *(later)* | formal, permissioned | class visit / share with students — only after dept-head permission |

### 6.2 Discipline fit (Phase 2)

- **Terminal state reuses `active_partner` + `mark_partner`** — "Recruitment Partner Active" is a label, **not a new status**. ✅ G1/G2
- **`distribution_evidence`** already captures partner commitment (verbal / flyer share / email forward / class visit). ✅
- No new tables/actions. ✅ G3/G4

---

## 7. Phase 3 — Recruitment Partner Portal (net-new; reuses magic-link)

A lightweight magic-link portal — the partner analog of the provider activation/Terms surface. Reuses `welcome-token` + `m/[token]` + the candidate portal shell.

### 7.1 MVP features

1. **Program overview** — what the Student Caregiver Program is and why it helps students.
2. **Agree to be a Recruitment Partner** — light, non-employment acknowledgment → records `distribution_evidence`, fires `mark_partner` (= "Recruitment Partner Active").
3. **Share the flyer** — download/share; for orgs, per-channel prompts (IG, GroupMe, Discord, Slack, WhatsApp, email lists).
4. **Add colleagues** — partner suggests advisors/professors/dept heads/org leaders → become new **Partner Prospects** for the admin team (network effect; uses the referral primitive).
5. **Add events** — career fairs, org meetings, pre-health events, class visits, tabling, info sessions.
6. **Request a meeting** — the per-provider Calendly link pattern (`?utm_content=<outreach_id>`), reused from the booking work.
7. **Outcomes** — students applied / hired / hours / references, per university, with **"coming soon" empty states**.

### 7.2 Storage decisions (the one place that may need G3 approval)

- **Agreement** → `distribution_evidence` on the row (existing). ✅
- **Colleagues** → new `student_outreach` rows via referral (existing). ✅
- **Outcomes** → computed reads, no storage. ✅
- **Events** → the only genuinely new persistence need. Proposal, least-invasive first: a `note_added` touchpoint on the partner's row (no new table) for MVP; promote to a small table only if events need structured querying. **Any new table requires explicit approval (G3).**

### 7.3 Discipline note

The Brief explicitly defers "conversion via portal" to non-CRM work (D15). The portal is a **separate surface** outside the CRM G-rules (like the candidate portal). It must still route conversion through `mark_partner` so the CRM stays the single writer of partner state (G4).

---

## 8. Naming

**Role:** Recruitment Partner. **Terminal label:** Recruitment Partner Active. **Backend:** existing `active_partner` status (no new enum). Chosen for legitimacy + low-pressure professional tone across advisor / org / dept-head audiences.

---

## 9. Discipline reconciliation (G1–G10) — summary

| Area | Reuse | Net-new (needs care) |
|---|---|---|
| Subtypes | `StakeholderType` (G1 ✅) | — |
| Outreach copy | subtype templates (extend) | per-subtype "ask" wording |
| Conversion | `mark_partner` / `active_partner` / `distribution_evidence` (G1/G2 ✅) | — |
| Prospecting | `student_outreach` rows + materialize (G3 ✅) | **AI sourcing widget** (new route+UI; tooling, allowed) |
| Permission/referral | `permission_dependency_id`, `redirect_initiated` (✅) | — |
| Portal | magic-link infra, `mark_partner` writer (G4 ✅) | **Portal surface** (outside CRM G-rules); **events storage** may need a table → explicit approval |

**Net:** Phases 1–2 fit inside the existing discipline. Phase 3 (portal) is a sanctioned separate surface; the only G3 risk is events storage, to be approved before building.

---

## 10. Deferred (partner-specific registry; extends Brief Appendix B)

| ID | Item | Defer reason |
|---|---|---|
| P-D1 | Professor outreach | Gated on dept-head permission; scaffold only for MVP |
| P-D2 | Partner incentives / referral rewards / leaderboards | Phase 3+; trust-first MVP |
| P-D3 | Recurring (monthly/semester) partner re-engagement emails | After portal proves engagement |
| P-D4 | Advanced outcomes analytics + impact reports | After basic outcomes ship |
| P-D5 | Structured events table | Start with `note_added`; promote only if needed |
| P-D6 | Automated event-planning workflows (sessions, class visits) | Manual coordination first |

---

## 11. Open decisions (resolve before/within each phase)

1. **Terminal status mapping** — confirm "Recruitment Partner Active" maps cleanly onto `active_partner` for stakeholders in the *current* activation model (vs. the old four-modal flow). Verify against current `route.ts`.
2. **Per-subtype "ask" copy** — advisor / org / dept-head wording (RA-voiced, approved before sending, per the existing copy-approval discipline).
3. **Agreement wording** — the light, non-employment acknowledgment shown in the portal.
4. **Outcomes metric definitions + data source** — students applied/hired/hours/references per university.
5. **Events storage** — `note_added` vs. table (G3 approval gate).
6. **AI engine cost** — Perplexity per-Site budget and rate limits.

---

## 12. Phasing / sequencing

- **Phase 1 — AI sourcing + verification.** The real new build; highest leverage. Ship the source-map + extract widget and materialization into pre-flight.
- **Phase 2 — Partner outreach.** Wire stakeholder rows through the activation model with subtype-aware asks; terminal `Recruitment Partner Active`.
- **Phase 3 — Partner Portal.** Magic-link surface: overview, agree, share flyer, add colleagues/events, request meeting, outcomes.
- **Later (P-D registry):** professors, incentives, recurring engagement, analytics, structured events/sessions.

Each phase ships as independently revertable commits (G6), typecheck-clean, staging → main.

---

## 13. Design-review refinements (locked, 2026-06-10)

Outcome of two UI-sketch review rounds with Logan. These augment/supersede the high-level sections above; they are the decisions we build to.

**R1 · Branding (hard rule).** Never imply university ownership. Copy is **"Olera's Student Caregiver Program for {University} students"** — never "{University}'s program." Enforced in the template layer.

**R2 · Salutation resolver.** Greeting picked per contact: title present → "Dr./Professor X"; name only → "Hi {first}" (or "Hi Ms./Mr. {last}" for dept_head/professor); generic office / no name → "Hello". Reuses existing `{salutation}` merge mechanics.

**R3 · Required manual-audit gate (new surface).** AI sourcing is never sufficient by itself. Before a Site's partner prospecting can be marked complete **per subtype**, the admin must complete an audit checklist (review all AI source links, run a pre-filled set of manual Google/LinkedIn/directory searches, add missed prospects by hand, confirm research exhausted). Gates the **existing** `student_outreach_campuses.research_complete` flag; checklist state stored in campus `research_data`. No new table.

**R4 · Source map persists.** AI source links are saved on the Site (per subtype) and per-field source URLs on each prospect — reusable for the manual audit and later research. In `research_data`.

**R5 · Partner pre-flight is phone-conditional.** Phone present → confirm call strongly encouraged (not blocking). No phone → email-only launch allowed. Never block partner outreach for a missing phone. Required to launch: usable email + confirmed role/type + Site association.

**R6 · Student orgs are org-shaped, multi-contact.** One org row carries org-level fields + a contact list (President / VP / Recruitment Chair / **Faculty Advisor**), each with its own email, all on the one row (reuses `student_outreach_contacts`). **AI always attempts the faculty advisor even when officers are found** (year-to-year continuity = highest long-term value). Org data fields: org name, org email, officer names/roles/emails, social links, website, directory link, faculty advisor name/email/profile, notes.

**R7 · Lightweight activation (no formal T&C).** Two routes to **Recruitment Partner Active**, both → existing `mark_partner`:
- **Admin activates** with a recorded confirmation method — **email / verbal / meeting / other** (+ optional note) → fires confirmation email + portal magic link.
- **Partner self-activates** in the portal (soft "Agree & continue" acknowledgment, not a Terms gate).

**R8 · Drawer outcomes for partners.** Interested (start nurture cadence) · **Activate partner** (direct convert, 4-way confirm) · Not interested · Couldn't reach (calls) · 📅 Book a meeting. **Interested ≠ Activated:** Interested = shown interest, not committed (send info, answer questions, invite to activate); Activated = clearly agreed (portal link + tools).

**R9 · Portal = design-consistent, not a one-off.** Built from the existing design system: `components/caregiver-portal/cards/*` (section cards), the `PulseHeader`/stat-card pattern for the impact metrics, `components/ui/EmptyState` for "coming soon", and shared buttons/typography/spacing/container width.

**R10 · Portal content (lightweight but useful).** Home shows: **impact stat cards** (hero), **flyer sharing as the central action**, a right-column of secondary actions (add colleague / tell us about an event / meet with Dr. DuBose), a "Why this exists" trust block (Dr. DuBose photo + credentials + short mission), an **FAQ**, and a top-right **"Need help?"** chat. Partner can: understand the program, share the flyer, add colleagues, tell us about events, ask for help, see impact.

**R11 · Impact metrics.** Live where available, `EmptyState` "coming soon" otherwise: students applied · hired · hours of experience completed · student ratings/feedback · **(coming soon)** accepted to professional school · letters of recommendation · references provided · clinical/caregiving hours · outcomes by semester.

**R12 · Add-colleague safety copy.** Explicit transparency: respectful outreach, no spam, we mention the referrer only if they allow it, optional context note. Colleagues become new Partner Prospects via the existing referral primitive.

**R13 · Events are a signal, not instant scheduling.** Two buckets: existing events (career fairs, org meetings, dept events, pre-health nights, tabling) vs. new events we could help create (virtual info session, classroom visit, org presentation, recruitment event). Fields: name, date if known, approximate timing, in-person/virtual + location, who to contact, notes, "other". Signals the team to follow up ≥1 month ahead. MVP storage = `note_added` timeline touchpoint (structured table deferred, P-D5).

**R14 · Need-help chat.** Top-right `?` button → small message box; states "Graize / Dr. DuBose's team replies within a few business days"; or book a call. Routes to the Activity Center inbox for MVP (Slack fast-follow).

**R15 · Notifications.** Activity Center line in MVP (lightweight); Slack notifications (added colleague / event / meeting / question / became active) as a fast-follow.

**R16 · Flyer.** Ship against a **placeholder** UT-Austin student flyer now; campus-specific designed PDFs are a fast-follow. Audience = students (what's in it for them, easy apply) but credible/safe enough that a partner is comfortable sharing it; includes simple FAQ + benefits + the honest "not university-run" line (R1).

---

## 14. UI surface inventory (S1–S27)

| # | Surface | Phase |
|---|---|---|
| S1 | Sites page · "Find partners ✦" entry | 1 |
| S2 | Sourcing modal · choose subtype + scope | 1 |
| S3 | Sourcing modal · persistent tiered source map | 1 |
| S4 | Sourcing modal · candidate review (accept/edit/reject, per-field sources) | 1 |
| S5 | Candidate edit · click-into-source before deciding | 1 |
| S6 | Partner Prospects list (In Basket → Prospects) | 1 |
| S7 | Partner pre-flight drawer (phone-conditional; person variant) | 1 |
| S8 | Dept-head professor-permission control + professor lock banner | 1 |
| S11 | Student-org drawer · multi-contact + faculty-advisor star | 1 |
| S25 | **Required manual-audit gate** (per Site + subtype) | 1 |
| S9 | Outreach launch module · subtype copy + salutation + branding | 2 |
| S10 | In Basket tabs (Calls/Emails/Meetings/Replies), partners mixed in | 2 |
| S12 | Partner drawer · call face (subtype script) | 2 |
| S13 | Partner drawer · reply face + outcomes (incl. Activate, 4-way confirm) | 2 |
| S14 | Terminal · Recruitment Partner Active | 2 |
| S15 | Magic-link landing · soft agree / self-activate | 3 |
| S16 | Portal home (impact hero + flyer center + right column + Why + FAQ) | 3 |
| S17 | Flyer sharing (download/copy/social/link; per-channel for orgs) | 3 |
| S18 | Add a colleague (safety copy) | 3 |
| S19 | Tell us about an event (two buckets) | 3 |
| S20 | Impact dashboard (stat cards + coming-soon) | 3 |
| S26 | Need-help chat (top-right) | 3 |
| S27 | "Why this exists" + FAQ | 3 |
| S22 | Admin: portal-referred colleagues → Partner Prospects | 3 |
| S23 | Admin: portal activity on partner drawer timeline | 3 |
| S24 | Admin: Activity Center line for portal activity | 3 |

---

## 15. Build plan — chronological development chunks

Each chunk = one or a few independently revertable commits (G6), typecheck-clean, PR to staging. Ordered so each leaves the system shippable. "First usable slice" is marked.

### PHASE 1 — Partner Prospecting

**Chunk 1.1 — Sourcing engine (backend, read-only)**
- Delivers: AI source-map + per-subtype extract; faculty-advisor-always for orgs (R6).
- New: `lib/medjobs/partner-sourcing.ts`; route `app/api/admin/medjobs/source-partners/route.ts` (admin-gated, `runtime=nodejs`, `maxDuration=120`).
- Modified: `lib/medjobs/outreach-enrichment.ts` (export `perplexityJson` + `CostTracker`).
- Reuses: Perplexity infra. Discipline: writes nothing to `student_outreach` (G1–G4 safe); may persist the source map to campus `research_data` (tool metadata, not CRM state).
- Accept: `POST {campus_slug, subtype, stage}` returns tiered sources + candidates with per-field source URLs + cost.

**Chunk 1.2 — Sourcing widget UI** *(first usable slice — AI-assisted prospecting works end to end)*
- Delivers: S1–S5. Subtype select → source map → extract → review/edit/accept.
- New: `components/admin/medjobs/PartnerSourcingModal.tsx`. Modified: `app/admin/medjobs/sites/page.tsx` (entry button).
- Reuses: `POST /api/admin/student-outreach/stakeholders` for accept (no new write path); dedup check against the Site's rows.
- Accept: accepted candidates become Partner Prospects (correct `kind`) with sources saved; source map persists on the Site.

**Chunk 1.3 — Required manual-audit gate (S25, R3)**
- Delivers: per-subtype audit checklist with pre-filled manual searches; gates "Mark research complete."
- New: `components/admin/medjobs/PartnerAuditModal.tsx`. Modified: `app/api/admin/student-outreach/campuses/[slug]/route.ts` (accept audit state + per-subtype `research_complete`), Sites/Partner-Prospects header indicator.
- Accept: cannot mark a subtype's prospecting complete until required boxes + the exhausted-confirm are checked; state persists.

**Chunk 1.4 — Partner pre-flight adaptations (S7, S8, S11; R5, R6)**
- Delivers: phone-conditional launch; org multi-contact + faculty-advisor star; source links in drawer; professor-permission control (reuses existing approval/`permission_dependency`).
- Modified: `SnapshotCard.tsx` (+ drawer pre-flight) for `kind ∈ stakeholder`.
- Accept: email-only launch allowed when no phone; org shows officer list w/ faculty advisor; professor rows show locked banner until dept-head permission.

### PHASE 2 — Partner Outreach

**Chunk 2.1 — Subtype copy + salutation + branding (R1, R2)**
- Delivers: partner "ask" copy per subtype (RA-voiced, on behalf of Dr. DuBose, program + call links), salutation resolver, branding rule.
- Modified: `lib/student-outreach/templates.ts`; verify `lib/medjobs/smartlead-bridge.ts` flows them.
- Accept: launch previews show correct per-subtype copy; no "University's program" phrasing anywhere.

**Chunk 2.2 — Partner outreach launch (S9, S10; R5)**
- Delivers: stakeholder rows launch through the existing cadence/sequencer; email-only path; partners flow into Calls/Emails/Meetings/Replies.
- Reuses: `schedule_sequence`, queue. Accept: launching a phone-less advisor queues email cadence; rows appear in the right tabs.

**Chunk 2.3 — Partner drawer outcomes + activation (S12–S14; R7, R8)**
- Delivers: Interested / **Activate partner** (4-way confirm → `mark_partner` + confirmation email + magic link) / Not interested / Couldn't reach / Book a meeting; "Recruitment Partner Active" terminal face.
- Modified: `NextStepCard.tsx` (partner faces + Activate confirm sub-UI). Reuses: `mark_partner` (G2 ✅), activation cadence, Book-a-meeting link, welcome-token.
- Accept: admin can activate on verbal/email/meeting/other; partner receives welcome email + portal link.

### PHASE 3 — Recruitment Partner Portal

**Chunk 3.1 — Portal scaffold + magic-link + self-activate (S15; R7, R9)**
- Delivers: magic-link entry, design-system shell, "Agree & continue" self-activation → `mark_partner` + portal access.
- New: partner portal route (under `app/medjobs/...`) + token handling reusing `welcome-token` / `m/[token]`.
- Accept: a valid link opens the portal; agreeing flips the row to active.

**Chunk 3.2 — Portal home: impact + Why + FAQ (S16, S20, S27; R10, R11)** *(first partner-facing usable slice)*
- Delivers: impact stat cards (live + `EmptyState` coming-soon), "Why this exists" trust block, FAQ.
- Reuses: `caregiver-portal` cards, `PulseHeader`/stat pattern, `EmptyState`.
- Dependency: outcomes data source for live metrics (applied/hired/hours) — ships coming-soon until wired.
- Accept: polished, design-consistent home renders with correct metrics/empty states.

**Chunk 3.3 — Flyer sharing (S17; R16)**
- Delivers: placeholder UT flyer asset + download / copy email / copy social / copy link / per-channel guidance / request-updated.
- New: placeholder flyer asset + program-info URL wiring. Accept: partner can share via every listed channel in ≤1 action.

**Chunk 3.4 — Add colleague + events (S18, S19, S22, S23; R12, R13)**
- Delivers: colleague form (safety copy) → new Partner Prospects via referral; event form (two buckets) → `note_added` on the partner row; both surface to admin (drawer timeline + Partner Prospects).
- New: portal action endpoints (colleague reuses stakeholders endpoint; event writes a touchpoint). Accept: a portal-added colleague appears as a referred Partner Prospect; an event appears on the timeline.

**Chunk 3.5 — Need help + Activity Center (S26, S24; R14, R15)**
- Delivers: top-right `?` chat (message → admin, "few business days" expectation) or book-a-call; Activity Center line for portal activity.
- Accept: a partner message reaches the Activity Center; portal actions show there. (Slack = post-MVP fast-follow.)

### Cross-cutting / fast-follow (post-MVP)
Professors outreach (P-D1) · Slack notifications · campus-specific designed flyers · structured events table (P-D5) · listserv/CSV flyer-send · incentives/recurring engagement/advanced analytics.

---

**End of document.** Companion: `docs/medjobs/OPERATIONAL_BRIEF.md` (CRM canon) and the activation-system spec.
