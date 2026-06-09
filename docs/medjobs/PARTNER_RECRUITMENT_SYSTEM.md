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

**End of document.** Companion: `docs/medjobs/OPERATIONAL_BRIEF.md` (CRM canon) and the activation-system spec.
