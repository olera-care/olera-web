---
name: pre-test
description: Use when the user says pre-test, pretest, before I test, what should I test, or asks for a critical review before preview/QA. Re-read recent changes, trace behavior end-to-end, verify schema and integration assumptions, run focused checks, fix real bugs, and report what to test.
---

# Pre-Test Critical Review

Run this before the user spends time previewing or QAing recent changes.

## Goal

Catch real issues before the user tests. Treat the work as suspect until it has been stress-tested. Do not invent findings; a clean review is acceptable.

## Workflow

1. Identify the scope:
   - Run `git status -sb`.
   - Determine the active branch and PR if one exists.
   - List files changed against the PR base, usually `origin/staging`.

2. Re-read changed files:
   - Read the actual changed code, not just summaries.
   - Pay special attention to code written quickly, DB writes, auth/session paths, render guards, and metadata/event names.

3. Trace the full chain:
   - Source data: DB schema, migrations, API inputs, URL params, cookies.
   - Server processing: route handlers, queries, auth/RLS assumptions, error handling.
   - Client state: props, state, effects, optimistic updates, retries.
   - Rendering: conditionals, empty/loading/error states, child components that may override parent values.
   - Admin/reporting surfaces: filters, labels, timelines, analytics attribution.

4. Verify schema assumptions:
   - Re-open migrations/table definitions for any table inserted or updated.
   - Check column names, NOT NULL, CHECK constraints, FK expectations, and identity namespace assumptions.
   - Confirm app allowlists and DB constraints are updated together for new event types.

5. Run focused checks:
   - For TypeScript/code changes: `npx --no-install tsc --noEmit`.
   - For cron/automation changes: `npm run check:crons`.
   - Use targeted scripts or SQL when useful for real data shape checks.
   - If a repo-wide check is blocked by known tooling, say so and run the closest focused substitute.

6. Look for common bug classes:
   - CHECK constraint mismatches or missing allowlist entries.
   - Silent fetch/insert failures.
   - `.single()` where `.maybeSingle()` is safer.
   - Null/empty/zero edge cases.
   - Auth or cookie timing assumptions.
   - Broken links/routes.
   - Race conditions in optimistic client state.
   - Analytics events using the wrong provider id namespace.
   - Admin filters that accidentally query `email_type` instead of `event_type`.

7. Fix real bugs:
   - If you find a real issue, patch it.
   - Re-run relevant checks.
   - Commit and push the fix to the active PR branch when appropriate.

8. Report:
   - Lead with any findings, ordered by severity.
   - For each finding include symptom, root cause, and fix.
   - If no issues were found, say that directly.
   - Provide a concise preview checklist for the user.

## Safety

- Do not refactor beyond the bug or test gap found.
- Do not list speculative issues as findings.
- Do not merge PRs.
- Do not stage unrelated user changes.
