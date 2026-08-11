# Olera Growth Metrics

Olera Web owns the complete growth loop: collection, durable history, visualization, and interpretation. Olera-HQ and Airtable are migration sources only.

```text
GA4 + Search Console + Olera product events
                    ↓
       shared TypeScript collector
                    ↓
      growth_metric_snapshots (Supabase)
             ↓              ↘
  Organic Growth page      /metrics maintenance
```

## Canonical weekly record

One `growth_metric_snapshots` row represents one completed Sunday-Saturday week in `America/Chicago`. The row is inserted atomically and is immutable unless an operator explicitly performs a correction.

| Question | Source | Measures |
|---|---|---|
| Are we reaching more people? | GA4 | Users, new users, sessions, page views, engagement, and users by channel |
| Where does organic traffic come from? | GA4 | Organic source/medium and organic landing pages |
| Is search visibility improving? | Search Console | Clicks, impressions, CTR, position, top queries/pages, and branded versus non-branded query mix |
| Is reach becoming useful activity? | Supabase | Inquiries, questions, benefits completions, and distinct providers answering questions |

`organic_users_to_inquiry_rate_directional` divides all inquiries by GA4 Organic Search users. It is useful as a directional blended signal, but it is not session-level attribution and must never be presented as such.

The dedicated `/admin/organic-growth` page is the routine reporting surface and reads this table through an authenticated admin-only API. Its calendar-style range picker defaults to the latest 12 completed weeks and can expand to six months, one year, all 180 stored weeks, or a custom range. Product experimentation and operational signals remain on `/admin/analytics`. The `/metrics` command is the maintenance hatch for backfills, intentional corrections, source debugging, and Claude interpretation. There are no generated weekly files to reconcile.

## Cadence

Vercel calls `/api/cron/growth-metrics` every Tuesday at 14:00 UTC, after the usual Search Console delay. The collector chooses the latest completed Sunday-Saturday week and safely skips it if already present.

Normal operation is passive; nobody needs to run a weekly command. For maintenance, use `/metrics` from Claude Code or call the collector directly:

```bash
npm run metrics
npm run metrics -- --week-start 2026-08-02 --week-end 2026-08-08
npm run metrics -- --dry-run
npm run metrics -- --backfill --from 2024-08-04
```

An isolated worktree can reuse an existing local configuration without copying it:

```bash
npm run metrics -- --env-file /path/to/olera-web/.env.local --credentials /path/to/ga4-service-account.json --dry-run
```

The first backfill requires `--from`. Backfill scans the whole requested range, skips stored weeks, and fills gaps even when a newer live week already exists. Collection stops on the first source failure rather than writing misleading partial history.

## Credentials

Local development reads, in order:

1. `GOOGLE_SERVICE_ACCOUNT_JSON`
2. `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`
3. `GOOGLE_APPLICATION_CREDENTIALS`
4. `secrets/ga4-service-account.json`

`secrets/` is gitignored. The existing Olera-HQ credential can be copied there locally, but its contents must never enter Git, chat, logs, or documentation.

Vercel should use the protected server-only `GOOGLE_SERVICE_ACCOUNT_JSON` variable. The service account needs read access to:

- GA4 property `357593677`
- Search Console property `https://olera.care/`

The normal Supabase server variables are also required: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Anomaly prompts

The saved row flags these week-over-week movements for investigation:

- Total users: 20% or more
- Organic Search users: 15% or more
- Search clicks: 20% or more
- Inquiries: 25% or more, only when both weeks have at least 10

These are prompts, not explanations. Check releases, campaigns, tracking changes, bot traffic, and source availability before asserting a cause.

## Organic acquisition breakdown

Definition version 2 adds three weekly breakdowns to the same atomic row:

- GA4 organic users and sessions by `sessionSourceMedium`.
- GA4 organic users and sessions by `landingPage`, which excludes query strings.
- Search Console branded versus non-branded query clicks and impressions, with “branded” defined as the standalone word `olera`.

Search Console omits some low-volume queries for privacy, so the branded mix includes `classified_click_coverage`. The admin labels the mix as a share of classified clicks rather than pretending it covers every search click. Landing-page outcomes are not attributed yet; the dashboard presents destinations and overall directional inquiry conversion separately.

## Historical Airtable data

Historical Airtable weeks may be imported once with `source = 'airtable_legacy'` and the definition version documented at import time. Import only observed values. Do not recreate Airtable formulas, interfaces, empty columns, auto-number fields, PDFs, or automations.

Export the Airtable grid as CSV, validate it, then import it:

```bash
npm run metrics:import-airtable -- /absolute/path/to/weekly-web-traffic.csv --dry-run
npm run metrics:import-airtable -- /absolute/path/to/weekly-web-traffic.csv
```

The importer accepts the column labels visible in the existing Web Traffic base, preserves the original row under `legacy`, and skips any week already present. It never overwrites a Google/Supabase week.

When Airtable and Google data cover the same week, keep the Google/Supabase row and skip the legacy duplicate. Indexed-page counts are a legacy diagnostic, not a headline growth metric; Search Console clicks and impressions replace them in the live system.
