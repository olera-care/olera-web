# MedJobs 30-day funnel measurement map

What each stage of the operating system can honestly be measured by today, and
what it cannot. Written by reading the schema and the code that writes to it,
not the intent in the matrix.

The rule applied throughout: **a stage gets an x/y only when both numbers come
from dated system events.** Where a denominator would have to be invented, the
stage shows throughput alone. Where neither number exists, the stage is marked
NOT INSTRUMENTED and the diagram says so rather than showing a plausible number.

Window is a rolling trailing 30 days, labelled **Last 30 days**, never a
calendar month.

---

## 1. What is instrumented

### Reliable, dated, append-only

| Source | What it gives |
|---|---|
| `student_outreach_touchpoints` | The event log for both outreach funnels. `touchpoint_type`, `created_at`, `payload`, `outreach_id`. **Append-only** at the database level, so history cannot drift. Types used here: `email_sent`, `email_replied`, `call_connected / _no_answer / _voicemail / _wrong_number`, `meeting_scheduled`, `meeting_held`, `meeting_no_show`, `distribution_confirmed`, `approval_requested / _granted`, `stage_change` |
| `student_outreach` | The row. `kind` is the discriminator: `provider` for the provider funnel, `advisor / student_org / dept_head / professor` for the university funnel. Also `created_at`, `status`, `campus_id` |
| `student_outreach_campuses` | Sites, with `created_at` |
| `business_profiles.metadata.interview_terms_accepted_at` | The dated provider conversion to Client |
| `business_profiles.claimed_at` | Dated since migration 182, trigger-backed |
| `email_log` | `email_type`, `recipient`, `provider_id`, `status`, `created_at`. Carries `medjobs_candidate_ready` (fires to catchment providers on a student's first go-live) |
| `interviews` | `created_at` = proposed, `status`, `confirmed_time` |
| `medjobs_placements` | `created_at` = offered, `status`, `internship_agreement_signed_at` |

### Gaps found in the code, not assumed

| # | Gap | Evidence |
|---|---|---|
| **G-a** | **Student go-live has no timestamp.** `POST /api/medjobs/go-live` sets `is_active = true` and `metadata.application_completed = true` and writes no dated event. The existing "candidates" metric uses the profile's `created_at`, so it measures *signed up in the window and live now*, which is not the same as *went live in the window* | `app/api/medjobs/go-live/route.ts:76-86`; `app/api/admin/student-outreach/stats/route.ts:fetchSignupTimestamps` |
| **G-b** | **QUAL has no qualification step.** Going live is the qualification event. There is no decision, no criteria, no reason field, so a qualification *rate* has no numerator distinct from its denominator | Matrix **B19**; no vetting code exists between go-live and the broadcast |
| **G-c** | **Interviews never reach `completed` or `no_show`.** The states exist in the CHECK constraint and nothing in the codebase ever sets them. "Interviews held" is therefore unmeasurable; only *proposed* and *confirmed* are | `grep` for `completed` across `app/api/medjobs` returns no interview writer. Matrix **B23** |
| **G-d** | **No shift concept anywhere.** `medjobs_placements.hours_threshold` defaults to **120 hours**, not six shifts. `medjobs_experience_logs` exists and no code reads or writes it | `supabase/migrations/103`, `019`. Matrix **B28** |
| **G-e** | **Payments are never written.** `provider_paid_at` and `student_paid_at` are declared in the row type and set by nothing | `lib/medjobs/placements.ts:37-38`, no writer. Matrix **B29** |
| **G-f** | **Active staffing needs are not instrumented.** `medjobs_job_posts` exists as a table and no code reads or writes it, so "provider account ready with a staffing need" has no field to count | `supabase/migrations/019`; no query references the table |
| **G-g** | **Activation channels are not modelled.** ST3 to ST7 collapse into one `distribution_confirmed` event plus a free-text `distribution_evidence` describing *how* it was confirmed, not *which channel*. Partial signal exists as `approval_requested` / `approval_granted` carrying `approval_type ∈ {job_board, listserv, department, marketing, other}`, but only when an operator uses the Request Approval modal | Matrix **B9**, **B12**; `RequestApprovalModal.tsx:20-21` |
| **G-h** | **Placement status transitions are not dated.** `medjobs_placements` has `created_at` (offered) and `updated_at`, but no `confirmed_at`. "Hire confirmed in the last 30 days" can only be approximated by a mutable column | `supabase/migrations/103` |
| **G-i** | **No application-source capture**, so no student-side denominator of reach | Matrix **B17** |

---

## 2. Stage-by-stage map

`P` = provider rows (`kind='provider'`). `U` = university rows (the four
stakeholder kinds). All touchpoint counts are filtered to the window by
`created_at`.

| Stage | Candidate metric | Numerator | Denominator | Data source | Instrumented | Reliable | Gap |
|---|---|---|---|---|---|---|---|
| **PR1** Target list built | Providers worked through pre-flight / providers put on the list | Distinct `P` rows with ≥1 call touchpoint in window | `P` rows created in window (materialization) | touchpoints + `student_outreach` | Yes | Yes | Catchment size is computed on read, never stored, so "list built" can only mean materialized |
| **PR-OUT** Outbound work | Meetings booked / providers worked | Distinct `P` rows with a `meeting_scheduled` in window | Distinct `P` rows with ≥1 `email_sent` or call in window | touchpoints | Yes | Yes | Opens and bounces need the send-engine webhook wired, but neither is used here |
| **PR2** Provider meeting held | Meetings held / meetings booked | `meeting_held` on `P` in window | `meeting_scheduled` on `P` in window | touchpoints | Yes | Yes, with care | Event-based, not cohort-based: a meeting booked on day 29 is held outside the window |
| **PR3** Client success | Clients converted / meetings held | `interview_terms_accepted_at` in window | `meeting_held` on `P` in window | `business_profiles.metadata` + touchpoints | Partly | Numerator yes | Terms acceptance is the only instrumented part of PR3. Profile updated, setup meeting held, account ready and staffing need recorded have no fields (**G-f**, matrix **B5**) |
| **ST1** Target advisors | Offices worked through pre-flight / offices generated | Distinct `U` rows with ≥1 call touchpoint in window | `U` rows created in window | touchpoints + `student_outreach` | Yes | Yes | No stored target or goal, so "against goal" is not available |
| **ST-OUT** University outbound | Meetings booked / offices worked | Distinct `U` rows with a `meeting_scheduled` in window | Distinct `U` rows with ≥1 `email_sent` or call in window | touchpoints | Yes | Yes | — |
| **ST2** Advisor meeting held | Meetings held / meetings booked | `meeting_held` on `U` in window | `meeting_scheduled` on `U` in window | touchpoints | Yes | Yes, with care | Same cohort caveat as PR2 |
| **ST3–ST7** University activation | Partners activated / advisor meetings held | `distribution_confirmed` in window | `meeting_held` on `U` in window | touchpoints | Partly | At the stage level only | **Per-channel is not measurable (G-g).** Which of the five channels went live, and whether a live channel is still live, exist only in meeting notes |
| **ST8** Student application submitted | Students live / students who applied | — | — | `business_profiles` | **No** | **No** | **G-a.** Go-live is not dated. Signups are dated, so throughput is available; the conversion is not |
| **QUAL** Portal vets the application | Qualified / total applications | — | — | — | **No** | **No** | **G-b.** There is no qualification step to measure. Numerator and denominator would be the same set |
| **MA1** Candidate intro | Providers told about a candidate | `medjobs_candidate_ready` sends in window, and distinct provider recipients | No sound denominator | `email_log` | Partly | Numerator yes | The intended denominator (qualified candidates available) needs **G-a**. The profile-PDF intro itself is matrix **B20**, unbuilt |
| **MA2** Interview held | Interviews confirmed / interviews proposed | `interviews` with `confirmed_time` in window | `interviews` with `created_at` in window | `interviews` | Partly | Yes, for *confirmed* | **G-c.** This measures confirmation, not attendance. Nothing records whether an interview happened |
| **MA3** Hire confirmed | Offers made / interviews confirmed | `medjobs_placements` created in window | `interviews` confirmed in window | `medjobs_placements` + `interviews` | Partly | Numerator yes | **G-h.** The acceptance that constitutes the hire has no dated transition |
| **MA4** Six or more shifts | Placements reaching six shifts / hires | — | — | — | **No** | **No** | **G-d.** No shift exists in the product |
| **MA5** Bill issued and collected | Bills collected / placements at six shifts | — | — | — | **No** | **No** | **G-e.** Payment fields exist and are never written |

---

## 3. Recommended single metric per stage

What the diagram shows. Anything not in this list shows a gap chip instead of a
number.

| Stage | Displayed | Reads as |
|---|---|---|
| **PR1** | pre-flighted / added | Of the providers we put on the list, how many did we actually work |
| **PR-OUT** | booked / worked | Outbound to meeting rate |
| **PR2** | held / booked | Do booked provider meetings happen |
| **PR3** | clients / meetings held | Do meetings convert to a commercial relationship |
| **ST1** | pre-flighted / added | Same question as PR1, university side |
| **ST-OUT** | booked / worked | Outbound to meeting rate |
| **ST2** | held / booked | Do booked advisor meetings happen |
| **ST3–ST7** | partners activated / meetings held | Do advisor meetings turn into distribution |
| **ST8** | signups (throughput) | New students entering, with the conversion flagged as unmeasurable |
| **QUAL** | NOT INSTRUMENTED | There is no vetting step |
| **MA1** | providers notified (throughput) | Reach of the candidate-ready broadcast |
| **MA2** | confirmed / proposed | Do interview requests get accepted |
| **MA3** | offers / interviews confirmed | Do interviews produce an offer |
| **MA4** | NOT INSTRUMENTED | No shift concept |
| **MA5** | NOT INSTRUMENTED | Payments never written |

### Yield

The yield the matrix implies, **paid placements / provider meetings**, cannot
be computed: MA4 and MA5 are both uninstrumented. Two that can be, shown under
MA5:

- **Commercial conversion** — clients converted / provider meetings held.
- **Placement yield** — placement offers / provider meetings held.

Both are honest today. Neither is revenue. The revenue yield needs **G-d** and
**G-e**.

---

## 4. What each missing metric needs

Smallest change that makes each blocked stage measurable, in dependency order.

| Blocked | Needs | Size |
|---|---|---|
| ST8 conversion, MA1 denominator | A dated go-live event. One column (`business_profiles.metadata.went_live_at`) written in `app/api/medjobs/go-live/route.ts` where `firstTime` is already computed | Very small |
| MA2 held | A writer for `interviews.status = 'completed' / 'no_show'` and a `held_at`. Matrix **B23** | Small, needs the did-it-happen loop |
| MA3 hire dated | `medjobs_placements.confirmed_at`, set in the PATCH that already writes `status: 'confirmed'` | Very small |
| MA4 | A shift count on the placement. Matrix **B26**, **B28** | Medium |
| MA5 | Writing `provider_paid_at`. Matrix **B29**, needs **B5** | Medium |
| QUAL rate | Written qualification criteria and a step that applies them. Matrix **B19** | Design, then small |
| PR3 completion | The client record. Matrix **B5**, plus a staffing-need field (**G-f**) | Large |
| Per-channel ST3–ST7 | The advisor follow-up tab. Matrix **B9**, **B12** | Medium |

The first and third are each a one-line write next to code that already runs,
and between them they unblock ST8, MA1 and MA3. They are the cheapest
instrumentation in the list by a wide margin.

---

## 5. Health thresholds

`lib/medjobs/funnel-health.ts` holds every number below in one table. Two rules
govern it.

**Each stage is judged on its own kind of metric.** A conversion stage on its
rate, a volume stage on 30-day throughput, a coverage stage on how much of its
own list has been worked. One universal threshold across all of them would be
meaningless.

**A stage the system cannot measure is not scored.** QUAL, MA4 and MA5 show
their structure and a zero and sit out of the score. Scoring a site red for
instrumentation we have not built tells an operator nothing about the site.

| Stage | Driver | Green | Yellow | Red |
|---|---|---|---|---|
| PR1 | coverage, share of the provider list worked | ≥ 70% | 40–69% | < 40% |
| PR-OUT | conversion, contacted to meeting booked | ≥ 8% | 3–8% | < 3% |
| PR2 | conversion, booked to held and logged | ≥ 80% | 60–79% | < 60% |
| PR3 | conversion, meetings held to Client | ≥ 40% | 20–39% | < 20% |
| ST1 | coverage, share of the office list worked | ≥ 70% | 40–69% | < 40% |
| ST-OUT | conversion, contacted to meeting booked | ≥ 15% | 6–15% | < 6% |
| ST2 | conversion, booked to held and logged | ≥ 80% | 60–79% | < 60% |
| ST3–ST7 | conversion, meetings held to distribution | ≥ 60% | 30–59% | < 30% |
| ST8 | volume, signups in the window | ≥ 20 | 5–19 | < 5 |
| MA1 | volume, providers reached by the broadcast | ≥ 10 | 3–9 | < 3 |
| MA2 | conversion, proposed to confirmed | ≥ 60% | 35–59% | < 35% |
| MA3 | conversion, confirmed to offer | ≥ 40% | 20–39% | < 20% |
| QUAL, MA4, MA5 | not instrumented | not scored | | |

The two sides carry different outbound bars on purpose: providers get three
emails and two calls to a business, advising offices five emails and one
meeting-first call. Their base rates are not the same thing.

**These are initial operating defaults, not observed baselines.** There is no
history to fit them to yet. They live in one table so that when real base rates
arrive, that file is the only edit.

### Site score

Each scored stage is worth **green 100, yellow 60, red 20**. The site score is
their mean, and the status is **green ≥ 75, yellow 50–74, red < 50**.

Then one cap, because rates alone can flatter a site that has stopped working
its pipeline. An active row with no touchpoint for **14 days** is stalled. If
more than 40% of active rows are stalled the site cannot be green; above 60% it
is red. The outreach cadence runs Day 0 to Day 7, so a fortnight of silence on a
row still marked active is a row nobody is working.

### What the site filter can and cannot narrow

Six stages carry `campus_id` through `student_outreach` and narrow cleanly: PR1,
PR-OUT, PR2, ST1, ST-OUT, ST2, plus ST3–ST7.

**Five have no campus link anywhere in the schema.** The Client flag lives on
`business_profiles`, the candidate-ready broadcast on `email_log`, and
`interviews` and `medjobs_placements` point at profiles rather than a site. Under
a site filter, PR3, ST8, MA1, MA2 and MA3 stay network-wide, say so on the map,
and sit out that site's score rather than being attributed to it.

Fixing that is a `campus_id` on the placement and a campus stamp on the student
profile at signup. Neither is large; both are listed here rather than assumed.
