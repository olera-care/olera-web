# /metrics -- Collect and Interpret Olera Growth

Collect Olera's latest completed growth week, save it to the canonical Supabase history, and brief the operator on what changed.

This command is designed for Claude Code first. Codex and humans call the same deterministic script, so the admin dashboard and the written interpretation cannot disagree.

Optional `$ARGUMENTS`:

- No argument: collect the most recent complete Sunday-Saturday week.
- `YYYY-MM-DD`: collect the Sunday-Saturday week containing that date.
- `backfill YYYY-MM-DD`: collect every missing week from that Sunday through the latest complete week. Existing weeks are skipped, so this safely fills gaps even when a newer live week already exists.
- `ga4-only`: explicitly skip Search Console if its access has not been granted yet.
- `dry-run`: query all sources and print the report without inserting a row.
- `force`: intentionally correct an existing week. Never infer permission to use this.

## Workflow

1. Read `docs/growth/README.md`. Its metric definitions and source-of-truth rules are canonical.
2. Determine the requested Sunday-Saturday reporting window in `America/Chicago`. Never include a partial week.
3. Run one of:

   ```bash
   npm run metrics
   npm run metrics -- --week-start YYYY-MM-DD --week-end YYYY-MM-DD
   npm run metrics -- --backfill --from YYYY-MM-DD
   ```

   Append `--ga4-only`, `--dry-run`, or `--force` only when explicitly requested or required by the invocation above.

4. Read the script's output. The saved Supabase row is the machine-readable source; stdout is a human companion, not a second stored report.
5. Brief the user in plain English:

   - The largest decision-relevant movement in reach.
   - Whether search visibility and search visits moved together.
   - Whether that reach became inquiries, questions, benefits completions, or provider responses.
   - Any anomaly worth investigating. Separate measured evidence from inferred cause.
   - The saved week and whether all three sources were available.

## Guardrails

- Tuesday is the scheduled collection day because Search Console commonly lags by roughly three days.
- Never read from or write to Airtable, Notion, or Olera-HQ during the normal workflow.
- Never print, commit, or summarize the Google service-account credential.
- Historical rows are immutable. If a week already exists, stop. Use `force` only for an explicit correction.
- A Search Console failure is not silently converted to zero. Use `ga4-only` to make the omission explicit.
- The organic-users-to-inquiry rate is directional, not attributed: its numerator is all Olera inquiries and its denominator is GA4 Organic Search users.
- `/metrics` is the acquisition-to-marketplace weekly view. `/product-led-growth` remains available for deeper product engagement analysis.

## Setup failure handling

If the database table is missing, apply `supabase/migrations/172_growth_metric_snapshots.sql` in the Supabase SQL editor.

For local collection, place the existing read-only credential at `secrets/ga4-service-account.json` or set `GOOGLE_APPLICATION_CREDENTIALS`.

For the scheduled Vercel job, set `GOOGLE_SERVICE_ACCOUNT_JSON` to the credential JSON as a protected server environment variable. It needs read access to GA4 property `357593677` and Search Console property `https://olera.care/`.
