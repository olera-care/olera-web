# War Room operating agent

War Room is a read-first CEO operating system. It investigates the company
across customers, providers, growth, revenue, product, content, operations,
market risk, and data. Most observations remain private investigations or a
watchlist. At most one case per scan may clear the founder-interruption gate.

No state-changing executor starts until an admin approves one exact proposal.
The automated executor remains deliberately limited to repository work: branch,
edits, and a PR against `staging`, with ordinary PR CI providing executable
verification. It cannot merge or deploy. Research,
operations, business-development, content, and founder-decision proposals record
an approved direction but remain human-controlled.

## Runtime shape

1. `/api/cron/war-room-discovery` runs daily at 10:30 UTC.
2. The cron and the admin **Scan now** action only queue a run and start a
   Vercel Workflow. They do not hold an HTTP request open while Claude reasons.
3. The workflow checkpoints source refresh, operating-pack preparation, the
   ten-lens sweep, the dossier pass, agenda triage, decision drafting, and
   persistence as separate durable steps. A transient timeout retries only the
   failed step; completed model calls are read from their database checkpoints
   instead of being purchased twice. The admin page may be closed while a scan
   runs.
4. Source preparation refreshes bounded, allowlisted Slack and Notion evidence
   and freezes the existing company fact pack for the rest of that run.
5. A chief-of-staff pass explicitly reviews all ten company lenses, then forms
   zero to eight **private opportunity dossiers**. A private investigation needs
   a supported material condition and a consequential unresolved question; it
   does not need a finished causal theory or two pre-baked solutions. Richer
   dossiers separate the situation, likely cause, counter-evidence, existing
   capabilities, unknowns, and alternative interventions.
6. A CEO agenda council classifies every dossier as investigate, watchlist,
   drop, or agenda. At most one agenda case survives. A deterministic gate then
   requires all of the following: high materiality and central strategic fit;
   supported cause; multiple evidence families; verified existing state for
   code work; a real comparison against alternatives; a measurable outcome;
   and no unfinished audit or conditional build.
   The council may drop a central, high-impact case only when current evidence
   proves it resolved or contradicted. Missing evidence demotes a case to private
   investigation; it does not erase the case. A rejected or superseded proposal
   retires that intervention, not the underlying business condition.
7. A repository-owned capability index supplies positive evidence for systems
   that models commonly rediscover. It proves presence, never absence. Until a
   live repository reader exists, code proposals may improve an indexed system
   but may not claim that an unindexed feature is missing.
8. `/admin/war-room` reads only precomputed rows. Admin login and
   page load never wait for source sync or AI. Each proposal opens as a
   CEO-length decision brief; private investigations and watchlist cases stay
   compact and do not masquerade as work.
9. Approving code emits the `war-room-approved` repository dispatch. Approving
   any other action kind records the decision without taking external action.
10. `.github/workflows/war-room-agent.yml` runs Claude Code in an isolated GitHub
   runner and may create a branch + ready PR against `staging`. It reports the
   result back to the proposal. There is no merge or deployment permission.
11. When work is marked complete, the next evidence cycle measures the stated
   outcome after the proposal-specific evaluation window and records validated,
   missed, or inconclusive.

Rejecting a proposal may include a blunt reason such as "this already exists."
That note remains visible in memory and is included in later discovery context,
so the same fingerprint stays rejected instead of being repackaged every day.
The waiting inbox presents one proposal at a time. **Pass for now** advances the
local decision queue without changing proposal state; previous/next controls
make every passed proposal immediately recoverable.

The execution architecture is intentionally identical on preview and main.
Main has richer credentials and live evidence, but it does not receive a longer
or more reliable request budget. A preview timeout is therefore a real runtime
defect, not something production would magically fix. Missing preview Slack or
Notion credentials should reduce evidence coverage honestly; they should never
change the orchestration model or produce a false all-clear.

## The investigation probe executor

War Room could always *design* the next probe for an open condition and never
run it. Nothing in the codebase emitted `probe_completed`. Because
`applyAgendaGate` requires `readiness === "decision_ready"`, and
`validateInvestigations` demotes any case whose `causeConfidence` is `low`, and
cause confidence only rises when a probe resolves a hypothesis, the loop had no
exit. Zero founder proposals was not a judgement. It was the only reachable
output, every day, forever.

`lib/war-room/probes.server.ts` closes it. A fixed menu of read-only,
row-capped, window-bounded queries the investigation loop can actually execute:

| Probe | Question it answers |
|---|---|
| `question_to_claim_conversion` | Does question volume on a page actually pull that provider into claiming? |
| `question_inventory_health` | Is the question inventory usable as provider-acquisition demand? |
| `provider_contactability` | Can Olera reach the providers holding unanswered questions? |
| `traffic_by_page_family` | Which page family gained or lost organic reach? |
| `revenue_by_product` | Where does the Ad Boost funnel stop? |
| `support_backlog_composition` | What is actually in the support backlog? |

The model never writes a query. It picks a probe id from an enum, and
`nextProbe.kind` *is* that id. A condition raised by the lens sweep has no
model-chosen probe, so its domain maps to one. `none` is a valid, honest answer.

Probes run in their own durable step after persistence, deduplicated across
conditions and ordered by how many conditions are waiting on each, so a bound
never silently drops the most-wanted probe. Anything the bound does drop is
recorded under `source_summary.probes.skipped`. Answers are appended to the
condition's event trail as `probe_completed` and become `probe:<id>` evidence in
the next scan, so a question is answered once rather than re-asked every
morning. A probe failure never fails the scan that produced it.

The probe id list exists in three places (the runnable registry, the
deterministic validator, and the dossier wire schema).
`npm run check:war-room` asserts all three are identical, because drift
reintroduces exactly the "plans a probe nobody runs" defect.

**Pagination must carry a stable total order.** Range paging without
`.order("id")` lets Postgres return a different row order per page, silently
skipping and duplicating rows. An unordered scan of the provider directory
undercounted it by a third while this module was being written.

## The daily brief

Probe answers were only ever addressed to the next scan. They landed in
`war_room_investigation_events` as `probe_completed` and became `probe:<id>`
evidence, and a person had to read a JSONB blob under a case marked "not ready
for the founder" to see them.

`lib/war-room/briefing.server.ts` addresses the same rows to the founder.
`loadWarRoomBriefing` returns the latest answer per probe id, newest first,
deduplicated so a re-run supersedes rather than stacks. `/admin/war-room`
renders them as **Today's read**, above the company verdict and the decision
queue.

This is a deliberate inversion of what the page leads with. Founder proposals
are rare by design — the agenda gate is twelve conjunctive conditions and at
most one case per scan may clear it — so a page that surfaces only proposals
reads as "War Room found nothing" on days when it measured a great deal. The
brief is the primary output; a proposal is the exception.

The brief re-measures nothing. It is exactly as fresh as the last scan, and each
reading states the date it was measured. A missing migration costs the reader
the brief, not the dashboard: `loadWarRoomBriefing` returns an empty list on a
read error rather than failing the page.

`warRoomScanCost` prices the run row's existing `input_tokens` /
`output_tokens` against a small published-price table and shows the result in
the brief header. An unknown model reports its token counts with no dollar
figure rather than guessing one. A daily cron that buys a full reasoning pass
should not be an unknown number on the founder's own dashboard.

## What Olera actually sells

`WAR_ROOM_OPERATING_MECHANICS` in `lib/war-room/strategy.ts` states the funnel
explicitly, because the agent otherwise infers a business model from raw counts
and gets it wrong. A care-seeker question is **provider-acquisition inventory**,
not a support ticket: the path is question lands on a provider page, provider is
notified, provider claims the page to answer, claimed provider can be sold
Ad Boost. Only about 3% of askers leave an email, so answering a question is
usually not a way to reach that family, and the answer rate is not a
customer-service metric. Without this stated, the ten-lens sweep read a 4%
answer rate as a trust failure and proposed that the founder answer questions
personally, which burns the demand signal and does not scale.

## Provider tool contract

Anthropic compiles every `strict` tool schema into a decoding grammar and
refuses the request when that grammar is too large or too slow to compile. The
refusal happens **before any inference**, so it is invisible to prompt design
and to every offline test. Three things were measured directly against
`claude-opus-5`, not inferred:

- **Ten sibling lens objects in one call are rejected in half a second**, no
  matter how small each lens body is. A five-property body fails exactly as fast
  as a ten-property one. Five sibling lens objects compile in about twenty
  seconds. That is why the sweep is two tool calls.
- **A single object carrying all 27 proposal properties never compiles**, and
  regrouping the same 27 into nested sub-objects does not help. Two sibling
  groups of ten do compile, which is the shape `submit_agenda_proposal` uses.
- **`maxLength` and `pattern` are expensive and enforce nothing.** Strict tool
  use ignores string constraints, but they still compile into bounded
  repetition, and near the budget they are the difference between a twenty-
  second compile and `Grammar compilation timed out`. `toWireSchema` strips
  them from every request; the declarations keep them only as the documented
  budget, and fingerprints are normalized on the server instead.

The compiled-grammar budget is not derivable from the schema and no static
check can prove a schema will be accepted. `npm run check:war-room:contract`
sends every production tool object to the production model with synthetic input
and `max_tokens: 1`. It writes no Olera state and starts no scan. Run it
whenever a War Room tool schema changes — a contract regression otherwise
surfaces only when someone presses **Scan now**.

A failed run records sanitized forensics on the run row: stage, contract name,
failure category, provider status, provider request id, prompt version, and
model. Those reach the admin page under **Diagnostic detail**. Prompts,
evidence, company facts, and credentials never do.

Raw model output is checkpointed **before** the deterministic contract runs, so
a scan rejected by our own completeness gate leaves the answer behind for
diagnosis instead of discarding it and re-purchasing Opus blind.

## Required migrations

Apply `supabase/migrations/177_war_room_operating_agent.sql` before opening the
supervisor inbox. Apply `178_war_room_ceo_operating_system.sql` before running
the CEO discovery pipeline.

`staging` independently used the numbers 177 and 178 for
`provider_outreach_apollo_contact` and `provider_outreach_email_source`. The
prefixes collide; the migrations do not. They alter
`provider_outreach_tracking`, which no War Room migration touches, and this
repository has carried duplicate migration prefixes since 003. All four War
Room migrations are idempotent (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`,
`ON CONFLICT DO NOTHING`), and both sets are already applied to the shared
Supabase instance. Renumbering the War Room files after the fact would
misrepresent what was applied, so the filenames stay as they are and no
reconciliation migration is needed.

## Company model and interruption standard

`war_room_company_models` stores Olera's purpose, stage, north star, current
priorities, strategic bets, constraints, guardrails, and open strategic
questions. It is operating context, not an excuse to fabricate facts.

A founder-facing proposal must be more than useful. It must be material to the
company, causally supported, verified against existing capabilities, better than
the considered alternatives, measurable, and bounded to no more than 30 minutes
of founder attention for the decision itself. The model may recommend zero.

`war_room_investigations` stores the cases that do not clear that standard. This
is intentional: War Room should spend most of its compute eliminating bad work
before the founder sees it.

Migrations 179 and 180 separate those durable company conditions from individual
interventions. Each investigation now records competing hypotheses, the next
bounded read-only probe, explicit resolution criteria, evidence changes, and an
append-only progress trail. Rejecting or superseding a proposal retires that
intervention only. Completing an intervention moves the condition to outcome
monitoring; it does not declare the condition solved.

The deterministic reasoning boundary in `lib/war-room/reasoning.ts` is shared by
production and the replay harness. Run `npm run check:war-room:replay` to verify
the seven strategic failure classes that previously produced false-empty scans:
provider liquidity, monetization, traffic attribution, stale operational data,
rejected conditions, blocked repeat interventions, and a genuinely clear ten-lens read. Replays do not call
the model or write to Supabase.

The company read uses two separate answers: whether a founder decision is ready
and whether unresolved work exists. A scan with no agenda proposal may still be
actively investigating or monitoring structural risk. If no dossier survives,
the UI describes that as an evidence limitation rather than claiming Olera has
nothing important to do. Flat but dangerous levels remain active until resolved;
they do not disappear merely because a comparison window was unchanged.

## Slack reader

Use a dedicated Slack bot, not a user token.

- Give it only `channels:history` and, if needed, `groups:history`.
- Invite it only to the channels War Room may observe.
- Set `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`,
  `WAR_ROOM_SLACK_CHANNELS`, and `WAR_ROOM_SLACK_WORKSPACE_URL` in Vercel.
- Configure the Events API request URL as
  `https://olera.care/api/integrations/slack/events`.
- Subscribe only to `message.channels` and, for allowlisted private channels,
  `message.groups`.

Fresh conversations arrive through events. Discovery backfills one 15-message
channel page per run, rotating through the allowlist, because Slack throttles
custom history readers. DMs are unsupported. Raw Slack content is untrusted
context and is never copied into the coding-agent prompt.

## Notion reader

Create a read-content-only Notion connection and share only the Meeting Notes
and Action Items data sources with it. Set `NOTION_API_KEY` and
`WAR_ROOM_NOTION_DATA_SOURCES` in Vercel using the format documented in
`.env.example`.

Notion rows retain their creation time, last-edit time, status-like properties,
and a `current` / `aging` / `stale` label. The analyst is explicitly forbidden
from treating an old action item as current work merely because it exists.

## Repository executor

Vercel needs:

- `WAR_ROOM_GITHUB_REPOSITORY=olera-care/olera-web`
- `WAR_ROOM_GITHUB_TOKEN` — a fine-grained token scoped to this repository with
  **Contents: write**, which GitHub requires to emit `repository_dispatch`.
- `WAR_ROOM_RUNNER_CALLBACK_SECRET` — a long random secret.

GitHub Actions secrets need:

- `ANTHROPIC_API_KEY`
- `WAR_ROOM_CALLBACK_URL` — the deployed
  `/api/integrations/war-room/executor` URL.
- `WAR_ROOM_RUNNER_CALLBACK_SECRET` — exactly the same value as Vercel.

The dispatch token never reaches Claude or the GitHub runner. The runner uses
the job-scoped GitHub token with repository contents and PR permissions. Its
prompt excludes raw Slack, Notion, email, and customer content. Claude receives
file read/write tools but no shell tool; checkout credentials are not persisted,
and ordinary PR CI performs executable verification after the branch is created.

## Hard boundaries

- Automatic: observe, retrieve, compare, form private dossiers, investigate,
  challenge, maintain a watchlist, propose at most one decision, and later
  measure.
- Founder-approved: record a strategic direction; for code only, create a
  repository branch, edit code, and open a PR against `staging` for ordinary CI
  and human review.
- Never automatic: merge, deploy, production-data mutation, customer messages,
  spending, deletion, secrets, permissions, or repository settings.
