# Promote Staging to Main (Production)

Optional argument: $ARGUMENTS (a release summary/title, or `--dry-run` to analyze only)

## Purpose

Safely promote everything currently on `staging` to `main` — i.e. ship QA'd work to **production**. This is the highest-stakes operation in the repo: a merge to `main` triggers the production deploy (olera2-web.vercel.app / olera.care).

Unlike `/pr-merge` (which lands a single feature branch into staging), this promotes the **cumulative delta** — every commit on `staging` that isn't yet on `main`. The regression risk is mostly inverted: `main` should always be a strict subset of `staging`, so the danger isn't overwriting newer work — it's (a) shipping something not yet QA'd, (b) shipping half-finished work that happens to be sitting on staging, or (c) clobbering a hotfix that went straight to `main` and was never back-merged to staging.

This command discovers exactly what would ship, surfaces those risks, gets explicit confirmation, executes the promotion as a real PR, and verifies production afterward.

---

## Phase 1: Gather Context

1. **Fetch fresh refs** — stale refs cause false reports:
   ```bash
   git fetch origin main staging --prune
   ```

2. **Compute the delta** — what would ship:
   ```bash
   git rev-list --count origin/main..origin/staging      # commits to promote
   git log --oneline origin/main..origin/staging          # the changelog
   git diff --stat origin/main..origin/staging | tail -1  # files / lines
   ```
   - If the count is **0**, stop: "Nothing to promote — main is already up to date with staging."

3. **Check for the inverted-direction hazard** (CRITICAL) — does `main` have *content* that `staging` lacks?

   ⚠️ Do **not** use `git rev-list --count origin/staging..origin/main` for this — it is misleading in this repo. Staging accumulates **squash** commits while main records **merge** commits, so their SHAs diverge by design; that count is routinely 40+ even when main is a perfect subset of staging. It is topology noise, not a hazard.

   Use a **content-level** check instead:
   ```bash
   git diff --stat origin/staging origin/main   # what main has that staging doesn't
   git diff --stat origin/main origin/staging   # the promotion delta (staging ahead)
   ```
   If main is a strict subset, the first diff is just the **exact inverse** of the second (same file list, insertions/deletions swapped). That is the healthy case → no hazard.

   The real hazard looks like: a file in `git diff origin/staging origin/main` whose change is **not** simply "revert staging's newer edits" — e.g. a file or hunk that exists only on main. That means a hotfix landed directly on `main` and was never back-merged to staging. Cross-check with PRs merged to main that did NOT come from staging:
   ```bash
   gh pr list --base main --state merged --limit 30 \
     --json number,title,headRefName,mergedAt \
     --jq '[.[] | select(.headRefName != "staging")]'
   ```
   If such a PR's content isn't already on staging, flag as **WARNING: "main has content not on staging — promoting may revert it."** Recommend back-merging main → staging first, then promoting.

4. **Map commits to PRs** — most staging commits are squash-merges with `(#NNN)` in the subject. Extract those PR numbers for the changelog. For each, you can pull the title/body with `gh pr view <N> --json number,title,url`.

---

## Phase 2: Production Pre-Flight Checks

1. **CI on staging must be green.** The tip of staging is what ships:
   ```bash
   gh api repos/{owner}/{repo}/commits/$(git rev-parse origin/staging)/status --jq '.state'
   gh run list --branch staging --limit 5
   ```
   - If checks are failing or pending, **warn and ask** before continuing. Do not promote red staging to production.

2. **Staging deploy health.** Confirm the staging Vercel deploy that corresponds to the current tip actually succeeded (the work has been live on staging-olera2-web.vercel.app for QA). If the latest staging deploy errored, the same code will likely fail on prod.

3. **Scan for un-QA'd or in-flight work.** Skim the changelog from Phase 1 for anything that looks half-finished, experimental, or explicitly flagged "do not ship" (WIP commits, `[skip]`, feature-flag-off work that shouldn't go live, debug/console changes). If anything looks risky to ship, list it and ask.

4. **Migration / env-var awareness.** Staging and production share one Supabase instance (see memory), but **check for**:
   - New DB CHECK-constraint migrations the promoted code depends on (event allowlist additions, etc.) — these must already be applied or inserts fail silently in prod.
   - New env vars referenced by the promoted code that exist on staging's Vercel project but may be missing on production's.
   - New `vercel.json` cron/route changes that behave differently in prod.
   If the diff touches `vercel.json`, `middleware.ts`, `next.config.ts`, or any `migrations/`/`schema.sql`, call it out explicitly.

---

## Phase 3: Produce the Promotion Report

Present findings before doing anything:

```markdown
## Promotion Analysis: staging → main

**Commits to promote**: <N>
**Files changed**: <count> | **+<additions> / -<deletions>**
**Staging CI**: <pass/fail/pending>
**Inverted hazard (main ahead of staging)**: <none / WARNING: N commits>

### What ships (changelog)
- #<PR> — <title>
- #<PR> — <title>
- <loose commit subject> (if not from a PR)
- ...

### Risk Flags
- [Migrations needed?] <none / list>
- [New env vars?] <none / list>
- [Infra/config files touched?] <none / vercel.json, middleware.ts, ...>
- [Anything that looks un-QA'd or WIP?] <none / list>

### Recommendation
[One of:]
- "Clean promotion — staging is green, main is a strict subset, no migration/env risks. Safe to ship."
- "Caution — <reason>. Recommend <action> before promoting."
- "DO NOT promote — <blocker> (red CI / main-ahead hazard / pending migration). Resolve first."
```

---

## Phase 4: Confirm (Production Gate)

Promoting to `main` deploys to **production**. Never proceed without explicit confirmation.

Present options:
1. **Promote now** — create the staging → main PR and merge it (production deploy).
2. **Dry run only** — produce the report, create nothing. (Default if `--dry-run` was passed.)
3. **Back-merge main → staging first** — if the inverted hazard was detected.
4. **Abort** — user wants to review manually.

If any blocker was flagged in Phase 2/3, the default recommendation is NOT "promote now." State the blocker plainly and let the user override.

Wait for an explicit choice. Do not promote on ambiguous input.

---

## Phase 5: Execute the Promotion

1. **Create the PR** (head = `staging`, base = `main`). Match the repo's established title convention:
   - `Promote staging → main: <summary> (<YYYY-MM-DD>)`
   - Use the `$ARGUMENTS` summary if provided; otherwise synthesize a short summary from the changelog.
   ```bash
   gh pr create --base main --head staging \
     --title "Promote staging → main: <summary> (<date>)" \
     --body "<changelog from Phase 3 + 🤖 footer>"
   ```
   Body should list every promoted PR/commit so the production release is self-documenting.

2. **Merge it.** Only `tfalohun` (TJ) can merge to `main`; this command authenticates as TJ. Use a **merge commit** (not squash) so the promotion preserves the individual PR history on main, matching prior "Promote …" PRs:
   ```bash
   gh pr merge <PR> --merge
   ```
   - Do **not** delete the `staging` branch — it is permanent.

3. **Confirm the merge landed:**
   ```bash
   git fetch origin main
   git log -1 --oneline origin/main
   git rev-list --count origin/main..origin/staging   # should now be 0
   ```

---

## Phase 6: Post-Deploy Verification

Production deploys automatically on push to `main` (GitHub-linked Vercel project — never use `npx vercel`).

1. Confirm the production deploy started/succeeded (Vercel dashboard or `gh run list --branch main`).
2. Smoke-check production once the deploy is live:
   - `https://olera.care` (or olera2-web.vercel.app) loads
   - Any feature shipped in this promotion is visibly live
   - No console errors on the homepage / a key provider page
   - Note: `curl` against the prod URL returns **HTTP 429** (the Vercel WAF bot-challenge) — that is expected, not an outage. Verify in a real browser, not curl.

3. **Critical-file indicator assertions** (ported from `/pr-merge` Phase 2.5). Confirm the code that just shipped to `main` still contains each load-bearing SEO/analytics/auth/branding indicator — these are the features most likely to be *silently* lost in a large promotion. Assert against `origin/main` (what actually shipped), and only bother checking a file if the promotion touched it (`git diff --name-only origin/main@{1}..origin/main`, or the Phase 1 file list):

   ```bash
   # each grep should return ≥1; a 0 is a REGRESSION
   git show origin/main:app/layout.tsx        | grep -c "G-"                  # GA4 measurement id present
   git show origin/main:app/layout.tsx        | grep -c "next/font"           # self-hosted fonts
   git show origin/main:components/shared/Footer.tsx | grep -c "Find senior care"  # discovery zone
   git show origin/main:app/page.tsx          | grep -c "geoState\|geoCity"   # geo-personalization
   git show origin/main:middleware.ts         | grep -c "V1_CATEGORY_SLUGS"   # v1 redirect map
   git show origin/main:next.config.ts        | grep -c "permanent: true"     # SEO redirects (baseline ~54)
   git show origin/main:components/shared/Navbar.tsx | grep -c "olera-logo"   # branding
   # SEO metadata must survive on any page with generateMetadata that shipped:
   git show origin/main:app/provider/[slug]/page.tsx | grep -c "canonical"
   git show origin/main:app/provider/[slug]/page.tsx | grep -c "openGraph"
   ```

   For any indicator that returns 0 on a file the promotion changed, flag:
   **REGRESSION SHIPPED: `<file>` lost `<indicator>` in this promotion.** This shouldn't happen if the Phase 1 inverted-hazard check was clean (main is a subset of staging), so treat it as a sign staging itself regressed — investigate before it propagates, and consider a hotfix/revert. For `next.config.ts`, compare the `permanent: true` count to the ~54 baseline rather than just ">0".

4. Report final status:
   ```markdown
   ## Promotion Complete

   staging → main merged via PR #<number>.
   main is now at: <sha> — "<commit msg>"
   Production deploy: <triggered/live>

   ### Verification
   - olera.care: [loads / issue]
   - Shipped features live: [yes / list]

   ### Critical-file indicators (only files this promotion touched)
   - layout.tsx: GA4 [intact/MISSING], self-hosted fonts [intact/MISSING]
   - Footer.tsx: discovery zone [intact/MISSING]
   - page.tsx: geo-personalization [intact/MISSING]
   - middleware.ts: V1_CATEGORY_SLUGS [intact/MISSING]
   - next.config.ts: permanent redirects [N / baseline ~54]
   - Navbar.tsx: logo [intact/MISSING]
   - provider/[slug]: canonical + openGraph [intact/MISSING]

   ### Next
   - Watch the Vercel production deploy to green.
   ```

---

## Phase 7: Record the Promotion in Branch Handoff Reports

After a real promotion completes (skip for dry-run / abort), publish a **per-promotion record** to the **Branch Handoff Reports** database — the same artifact `/notion-report` writes to. (The old flat "PR Merge Reports" folder is retired; nobody read it.)

A promotion isn't a feature branch — it ships *staging → main*, and `staging` is permanent — so this is **always a fresh page**, not an update. It's the canonical "what shipped to production, and when" record.

**Database:** Product Development › **Branch Handoff Reports**
**Data source ID:** `e3014bc0-3a03-40ed-9c09-a66994fb9e78`

Use `mcp__claude_ai_Notion__notion-create-pages` with `parent: { data_source_id: "e3014bc0-3a03-40ed-9c09-a66994fb9e78" }` and a `🧭` icon.

**Properties:**

| Property | Value |
|----------|-------|
| `Title` | `Promote staging → main — <summary> (<YYYY-MM-DD>)` |
| `Branch` | `staging` |
| `Worktree` | leave empty (no feature worktree) |
| `Status` | `Merged` |
| `PR` | the promotion PR number/URL |
| `Date` | today |

**Body (Phase 2 of `/notion-report` structure, adapted for a shipped release):**
1. Callout — promotion PR number + GitHub link + production URL (olera.care)
2. **Changelog** — the list of PRs/commits shipped (from Phase 3)
3. **Pre-flight results** — CI state, inverted-hazard check, migration/env flags
4. **Outcome** — final main SHA, production deploy status, smoke-check + critical-file-indicator results (from Phase 6)
5. **Lesson Learned** (if any) — callout block

Always `await` the Notion call before reporting success. If Cloudflare-blocked, fall back to the raw `mcp__notion__API-*` tools per memory `Notion MCP Tools`.

---

## Safety Rails

- **Merging to `main` ships to production.** Always confirm explicitly (Phase 4).
- **Never promote red staging.** If staging CI is failing/pending, warn and ask.
- **Inverted hazard is a hard flag.** If `main` has commits not on `staging`, promoting can revert them — recommend back-merge first.
- **Always fetch fresh** before any comparison.
- **Never use `npx vercel`** — production deploys via GitHub push to main (see memory).
- **Never delete `staging`** after merge — it is a permanent long-lived branch.
- **Watch for silent-failure traps** — pending DB migrations / missing prod env vars surface only after deploy.

---

## Quick Reference

| Command | Action |
|---------|--------|
| `/promote-to-main` | Analyze + (after confirm) promote all of staging to main |
| `/promote-to-main <summary>` | Same, using your text as the release title |
| `/promote-to-main --dry-run` | Report only — show what would ship, create nothing |
