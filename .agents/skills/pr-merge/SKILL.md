---
name: pr-merge
description: "Use when the user says pr-merge, merge PR, safely merge a PR, analyze a PR before merging to staging, or asks whether a PR is safe to merge. Performs conflict, branch-age, CI, overlapping-file, and content-regression analysis before asking for explicit confirmation to merge, rebase, reconcile, or abort."
---

# Safe PR Merge

Safely analyze and, only after explicit user confirmation, merge a PR into `staging`.

## Core Rule

Never merge, force-push, rebase, or delete a branch without explicit confirmation after the analysis report. Default target is `staging`; merging to `main` requires an explicit production/main confirmation.

## Workflow

1. Identify the PR:
   - If the user gave a PR number, URL, or branch, resolve it with `gh pr view` or `gh pr list --head`.
   - If no argument was given, check the current branch for an open PR.
   - Collect: number, title, body, headRefName, baseRefName, files, additions, deletions, changedFiles, state, mergeable, mergeStateStatus, and status checks.

2. Validate preconditions:
   - Warn if the base is not `staging`.
   - Confirm the PR is open and mergeable or explain why it is blocked.
   - Check CI with `gh pr checks <PR>` when available, or `gh pr view <PR> --json statusCheckRollup`.
   - Fetch fresh refs: `git fetch origin staging` and `git fetch origin <headRefName>`.

3. Branch-age and file analysis:
   - Find merge base: `git merge-base origin/staging origin/<headRefName>`.
   - Count how far the PR is behind staging: `git rev-list --count origin/<headRefName>..origin/staging`.
   - Flag `>5` commits behind staging as elevated regression risk.
   - List PR files: `git diff --name-only <merge-base>..origin/<headRefName>`.
   - List staging files since branch point: `git diff --name-only <merge-base>..origin/staging`.
   - Classify PR files:
     - Safe: only PR touched it.
     - Overlap, PR newer: both touched; PR has latest commit.
     - Overlap, staging newer: both touched; staging has latest commit.
     - Diverged: both changed independently; manual review likely.
     - Deleted: PR deletes a file staging modified.
   - For overlaps, compare last commits with `git log -1 --format="%ai %s" <ref> -- <file>`.

4. Content-regression check:
   - Always compare actual content for critical shared files, even if git history says no overlap.
   - Detect revert chains with `git log --oneline <merge-base>..origin/<headRefName>` and `git log --oneline <merge-base>..origin/staging` searched for `revert`.
   - For every critical file that exists on the PR branch, run `git diff origin/staging..origin/<headRefName> -- <file>`.
   - If a critical file would change, inspect for lost indicators and flag real regressions.

## Critical File Watchlist

Shared app files:
- `components/shared/Footer.tsx`
- `components/shared/Navbar.tsx`
- `components/auth/AuthProvider.tsx`
- `components/auth/UnifiedAuthModal.tsx`
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `middleware.ts`
- `next.config.ts`
- `app/provider/[slug]/page.tsx`
- `components/shared/FindCareMegaMenu.tsx`
- `components/providers/QASectionV2.tsx`
- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`

SEO and v1-to-v2 sensitive files:
- `app/waiver-library/page.tsx`
- `app/waiver-library/[state]/page.tsx`
- `app/waiver-library/[state]/[benefit]/page.tsx`
- `app/waiver-library/[state]/[benefit]/forms/page.tsx`
- `app/waiver-library/forms/page.tsx`
- `app/waiver-library/forms/[state]/page.tsx`
- `app/benefits/layout.tsx`
- `app/caregiver-support/layout.tsx`
- `app/research-and-press/layout.tsx`
- `app/about/page.tsx`
- `app/contact/page.tsx`
- `app/for-providers/page.tsx`
- `app/team/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`

Indicators to spot-check when relevant:
- `Footer.tsx`: discovery zone, city rows, popular cities.
- `AuthProvider.tsx`: cache/query timeout values.
- `app/page.tsx`: geo personalization / power-page routing.
- `app/layout.tsx`: GA4, self-hosted font imports.
- `middleware.ts`: v1 category slug redirects.
- `next.config.ts`: permanent redirects count.
- `Navbar.tsx`: Olera logo.
- `provider/[slug]/page.tsx`: parallel queries and v1-compatible title format.
- Metadata pages: canonical, Open Graph, Twitter metadata.

## Report Shape

Lead with the recommendation.

Include:
- PR number/title, branch, base, file count, additions/deletions.
- CI status.
- Merge base and commits behind staging.
- Revert-chain status.
- File breakdown by category.
- Content-regression check results.
- Other open PRs that may touch the same files: `gh pr list --base staging --state open --json number,title,headRefName`.
- Recommendation:
  - Clean merge.
  - Minor overlaps.
  - Caution, staging newer.
  - Manual merge/rebase needed.
  - Content regression; do not merge directly.

## Confirmation Options

Ask the user to choose:
1. Merge directly.
2. Rebase first, then merge.
3. Reconcile first.
4. Abort.
5. Show specific diffs.

If content regressions are detected, recommend reconcile first.

## Execute After Confirmation

Direct merge:
- Use `gh pr merge <PR> --merge --delete-branch` unless the user requests squash.
- If GitHub blocks the merge only because base branch policy/review protection prohibits it, and TJ has already explicitly chosen the direct-merge option after the analysis report, rerun with `--admin` instead of asking again. This is the established Olera workflow for TJ-approved staging merges.
- Do not use admin override for unresolved conflicts, red CI, content regressions, missing production/main confirmation, or any blocker that was not already disclosed in the analysis report.
- Fetch `origin/staging` afterward and confirm the merge commit exists.
- Re-run critical spot-checks on `origin/staging`.

Rebase path:
- Create a local working branch from the PR branch.
- Rebase onto `origin/staging`.
- If conflicts occur, show them and ask for resolution direction.
- Ask before force-pushing with lease.

Reconcile path:
- Create a reconciliation branch from the branch with the good known state.
- Merge the other branch without committing.
- Resolve by domain ownership.
- Push and open a new PR to `staging`.

## Post-Merge Report

After a merge or reconciliation, report:
- Final staging SHA and commit title.
- Critical file verification status.
- Staging/Vercel link if available.
- Open PRs that may need rebasing.

If Notion is available and the user wants a record, create a concise PR Merge Report under the team’s PR Merge Reports page. If Notion is not available, include the report in chat.

## Safety

- Never merge to `main` without explicit confirmation.
- Never force-push without explicit confirmation.
- Never merge with failing CI unless the user explicitly accepts the risk.
- Admin override is allowed for `staging` PRs only after TJ explicitly confirms merge and the remaining blocker is branch protection/review policy, not code safety.
- Always fetch fresh before analysis.
- Treat revert chains and old PR branches as high-signal risk.
- Do not claim a PR is safe based only on GitHub’s mergeable status.
