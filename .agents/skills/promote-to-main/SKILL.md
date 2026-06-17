---
name: promote-to-main
description: "Use when the user says promote-to-main, /promote-to-main, promote staging to main, ship staging to production, production release, or asks to analyze whether staging is safe to promote to main. Performs staging-to-main delta, CI, production-risk, migration/env, and content-regression checks before asking for explicit confirmation to create and merge a production PR."
---

# Promote Staging To Main

Safely analyze and, only after explicit user confirmation, promote everything currently on `staging` to `main`.

This is the production release workflow. A merge to `main` deploys to production, so default to a report/dry-run posture until TJ explicitly confirms the promotion.

## Core Rule

Never create, merge, force-push, rebase, or delete anything in a production promotion without explicit confirmation after the promotion report.

Promoting means the cumulative delta from `origin/main` to `origin/staging`, not a single feature PR. `main` should be a strict content subset of `staging`; if `main` contains hotfix content not present on `staging`, promoting can revert production fixes.

## Workflow

1. Gather fresh context:
   - Fetch fresh refs: `git fetch origin main staging --prune`.
   - Count commits to promote: `git rev-list --count origin/main..origin/staging`.
   - List changelog: `git log --oneline origin/main..origin/staging`.
   - Summarize size: `git diff --stat origin/main..origin/staging`.
   - If there are zero commits to promote, stop and report that `main` is already up to date with `staging`.

2. Check the inverted production hazard:
   - Do not rely on `git rev-list --count origin/staging..origin/main`; squash merges and promotion merge commits make SHA topology noisy in this repo.
   - Compare content instead:
     - `git diff --stat origin/staging origin/main`
     - `git diff --stat origin/main origin/staging`
   - Healthy case: the first diff is only the inverse of the promotion delta.
   - Hazard case: `main` has hunks or files that are not simply older versions of staging edits. Cross-check merged main PRs whose head was not `staging`:
     - `gh pr list --base main --state merged --limit 30 --json number,title,headRefName,mergedAt`
   - If main-only content exists, recommend back-merging `main` into `staging` first.

3. Map commits to PRs:
   - Extract `#NNN` references from staging commit subjects when present.
   - For each PR number, use `gh pr view <N> --json number,title,url,baseRefName,headRefName,mergedAt`.
   - Keep loose commit subjects in the changelog when no PR number is present.

4. Production pre-flight:
   - CI/checks on the `origin/staging` tip must be green or explicitly accepted by TJ.
   - Check staging deployment health when available from GitHub/Vercel statuses.
   - Scan changelog for WIP, experimental, `[skip]`, debug, or "do not ship" signs.
   - Flag touched files that affect production configuration or runtime assumptions:
     - `vercel.json`
     - `middleware.ts`
     - `next.config.ts`
     - `migrations/`
     - `schema.sql`
     - Supabase SQL files
     - cron or automation routes
   - Search the promotion diff for newly referenced env vars and call them out.
   - Flag database CHECK-constraint or event allowlist changes that must already be applied before production code writes those values.

5. Content-regression checks:
   - For load-bearing files touched by the promotion, compare `origin/main..origin/staging` and verify important indicators are not lost.
   - Critical indicators:
     - `app/layout.tsx`: GA4 measurement id and `next/font`.
     - `components/shared/Footer.tsx`: "Find senior care" discovery zone/city links when touched.
     - `app/page.tsx`: `geoState` or `geoCity` when touched.
     - `middleware.ts`: `V1_CATEGORY_SLUGS` when touched.
     - `next.config.ts`: `permanent: true` redirect count, with the repo baseline around 54.
     - `components/shared/Navbar.tsx`: `olera-logo` or equivalent brand image marker.
     - `app/provider/[slug]/page.tsx`: `canonical` and `openGraph`.
   - A missing indicator in a touched file is a regression risk. Do not proceed without calling it out.

## Promotion Report

Present findings before doing anything.

Use this shape:

```markdown
## Promotion Analysis: staging -> main

**Commits to promote**: <N>
**Files changed**: <count> | **+<additions> / -<deletions>**
**Staging CI**: <pass/fail/pending/unknown>
**Main-only content hazard**: <none / warning>

### What Ships
- #<PR> - <title>
- <loose commit subject>

### Risk Flags
- Migrations needed: <none / list>
- New env vars: <none / list>
- Infra/config touched: <none / list>
- WIP or un-QA'd signs: <none / list>
- Critical indicators: <intact / concerns>

### Recommendation
<Clean promotion / Caution / Do not promote>
```

## Confirmation Gate

Make the production consequence explicit: merging `staging` to `main` deploys production.

Ask TJ to choose:
1. Promote now: create the `staging -> main` PR and merge it.
2. Dry run only: report only, create nothing.
3. Back-merge `main -> staging` first: if main-only content exists.
4. Abort.

If checks are red/pending, main-only content exists, or migrations/env risks are unresolved, recommend against promoting now unless TJ explicitly accepts the risk.

## Execute After Confirmation

Create the production PR:
- Head: `staging`
- Base: `main`
- Title: `Promote staging -> main: <summary> (<YYYY-MM-DD>)`
- Use the user-provided summary if they gave one; otherwise synthesize a short summary from the changelog.
- Body should include the changelog, risk flags, CI/deploy status, and a note that the promotion was prepared by Codex.

Merge the PR:
- Use `gh pr merge <PR> --merge`.
- Do not squash.
- Do not delete `staging`; it is a permanent branch.

Confirm the merge landed:
- Fetch main: `git fetch origin main`.
- Show the new tip: `git log -1 --oneline origin/main`.
- Confirm no remaining promotion delta: `git rev-list --count origin/main..origin/staging` should be zero.

## Post-Deploy Verification

Production deploys from the GitHub merge to `main`; do not use `npx vercel` for production deployment.

After the merge:
- Confirm production deployment started or succeeded from GitHub/Vercel statuses when available.
- Smoke-check production in a real browser if requested or available:
  - `https://olera.care` loads.
  - A key provider page loads.
  - Any promoted feature is visibly live.
  - No obvious console errors on the checked pages.
- Treat `curl` HTTP 429 from the production URL as expected Vercel WAF behavior, not proof of outage.
- Re-run critical indicator checks against `origin/main` for files touched by the promotion.

## Final Report

Report:
- Promotion PR number and link.
- Final `origin/main` SHA and commit title.
- Production deploy status.
- Smoke-check status.
- Critical indicator status for touched files.
- Follow-up risks, if any.

If Notion is available and TJ wants a release record, create a concise Product Development PR Merge Report. If Notion is unavailable, keep the report in chat.

## Safety

- Merging to `main` ships production.
- Always fetch fresh before comparison.
- Never promote red staging without explicit risk acceptance.
- Never proceed past main-only content hazards without making the revert risk plain.
- Never delete `staging`.
- Never use `npx vercel` to deploy production.
- Do not claim a promotion is safe from GitHub mergeability alone.
