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
2. It refreshes bounded, allowlisted Slack and Notion evidence and freezes the
   existing company fact pack.
3. A chief-of-staff pass explicitly reviews all ten company lenses, then forms
   zero to eight **private opportunity dossiers**. A private investigation needs
   a supported material condition and a consequential unresolved question; it
   does not need a finished causal theory or two pre-baked solutions. Richer
   dossiers separate the situation, likely cause, counter-evidence, existing
   capabilities, unknowns, and alternative interventions.
4. A CEO agenda council classifies every dossier as investigate, watchlist,
   drop, or agenda. At most one agenda case survives. A deterministic gate then
   requires all of the following: high materiality and central strategic fit;
   supported cause; multiple evidence families; verified existing state for
   code work; a real comparison against alternatives; a measurable outcome;
   and no unfinished audit or conditional build.
   The council may drop a central, high-impact case only when current evidence
   proves it resolved or contradicted. Missing evidence demotes a case to private
   investigation; it does not erase the case. A rejected or superseded proposal
   retires that intervention, not the underlying business condition.
5. A repository-owned capability index supplies positive evidence for systems
   that models commonly rediscover. It proves presence, never absence. Until a
   live repository reader exists, code proposals may improve an indexed system
   but may not claim that an unindexed feature is missing.
6. `/admin/war-room` reads only precomputed rows. Admin login and
   page load never wait for source sync or AI. Each proposal opens as a
   CEO-length decision brief; private investigations and watchlist cases stay
   compact and do not masquerade as work.
7. Approving code emits the `war-room-approved` repository dispatch. Approving
   any other action kind records the decision without taking external action.
8. `.github/workflows/war-room-agent.yml` runs Claude Code in an isolated GitHub
   runner and may create a branch + ready PR against `staging`. It reports the
   result back to the proposal. There is no merge or deployment permission.
9. When work is marked complete, the next evidence cycle measures the stated
   outcome after the proposal-specific evaluation window and records validated,
   missed, or inconclusive.

Rejecting a proposal may include a blunt reason such as "this already exists."
That note remains visible in memory and is included in later discovery context,
so the same fingerprint stays rejected instead of being repackaged every day.
The waiting inbox presents one proposal at a time. **Pass for now** advances the
local decision queue without changing proposal state; previous/next controls
make every passed proposal immediately recoverable.

## Required migrations

Apply `supabase/migrations/177_war_room_operating_agent.sql` before opening the
supervisor inbox. Apply `178_war_room_ceo_operating_system.sql` before running
the CEO discovery pipeline.

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
