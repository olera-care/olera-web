# War Room operating agent

War Room is a read-first control plane. It autonomously discovers and
investigates work, but no state-changing executor starts until an admin approves
one exact proposal. The first executor is deliberately limited to repository
work: branch, tests, and a PR against `staging`. It cannot merge or deploy.

## Runtime shape

1. `/api/cron/war-room-discovery` runs daily at 10:30 UTC.
2. It refreshes bounded, allowlisted Slack and Notion evidence and freezes the
   existing company fact pack.
3. An Opus scout forms zero to three repository proposals. A separate critic
   may lower confidence, rewrite, or delete every proposal.
4. `/admin/war-room` reads only the precomputed proposal rows. Admin login and
   page load never wait for source sync or AI.
5. **Build this** records a durable authorization and emits the
   `war-room-approved` repository dispatch.
6. `.github/workflows/war-room-agent.yml` runs Claude Code in an isolated GitHub
   runner and may create a branch + ready PR against `staging`. It reports the
   result back to the proposal. There is no merge or deployment permission.
7. When shipped work is marked complete, the next evidence cycle measures the
   stated outcome after seven days and records validated, missed, or
   inconclusive.

## Required migration

Apply `supabase/migrations/177_war_room_operating_agent.sql` before opening the
new supervisor inbox.

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

- Automatic: observe, retrieve, compare, investigate, criticize, propose, and
  later measure.
- Founder-approved: create a repository branch, edit code, run checks, and open
  a PR against `staging`.
- Never automatic: merge, deploy, production-data mutation, customer messages,
  spending, deletion, secrets, permissions, or repository settings.
