# Safe PR Merge to Staging

Target PR: $ARGUMENTS (PR number, URL, or branch name)

## Purpose

Safely merge a pull request into staging by analyzing conflicts, comparing file freshness, detecting content regressions, and producing a clear report before executing the merge. Prevents newer staging work from being overwritten — even when git's merge-base says everything is clean.

---

## Phase 1: Gather Context

1. **Identify the PR**:
   - If a number or URL was given, use `gh pr view <PR> --json number,title,body,headRefName,baseRefName,files,additions,deletions,changedFiles,state,mergeable,mergeStateStatus`
   - If a branch name, find the corresponding PR with `gh pr list --head <branch> --json number,title,headRefName`
   - If no argument given, check current branch for an open PR

2. **Validate preconditions**:
   - PR must target `staging` (warn if targeting `main` — ask user if intentional)
   - PR must be in an open/mergeable state
   - Run `gh pr checks <PR>` to verify CI status

3. **Fetch latest state**:
   - `git fetch origin staging`
   - `git fetch origin <pr-branch>`

4. **Check branch age**:
   - `git rev-list --count origin/<pr-branch>..origin/staging` — how far behind is the PR?
   - If the PR is **>5 commits behind staging**, flag as WARNING: "PR is based on an old staging state — content regression risk is elevated"

---

## Phase 2: File-Level Analysis (Commit History)

For every file changed in the PR, determine freshness relative to staging:

1. **Find the merge base** (where the PR branch diverged from staging):
   ```
   git merge-base origin/staging origin/<pr-branch>
   ```

2. **Get files changed in the PR**:
   ```
   git diff --name-only <merge-base>..origin/<pr-branch>
   ```

3. **Get files changed on staging since the branch point**:
   ```
   git diff --name-only <merge-base>..origin/staging
   ```

4. **Classify each PR file into one of these categories**:

   | Category | Meaning | Icon |
   |----------|---------|------|
   | **Safe** | Only the PR touched this file — no staging changes | `+` |
   | **Overlap (PR newer)** | Both modified, but PR has the latest commit | `~` |
   | **Overlap (staging newer)** | Both modified, but staging has the latest commit | `!` |
   | **Overlap (diverged)** | Both modified independently — true conflict likely | `!!` |
   | **Deleted** | PR deletes a file that staging also modified | `x` |

5. **For overlapping files**, compare the last commit dates:
   ```
   git log -1 --format="%ai %s" origin/<pr-branch> -- <file>
   git log -1 --format="%ai %s" origin/staging -- <file>
   ```

6. **For diverged files**, show a preview of the conflict scope:
   ```
   git diff origin/staging...origin/<pr-branch> -- <file> | head -60
   ```

---

## Phase 2.5: Content Regression Check (CRITICAL)

> Added after post-mortem: PRs #66/#65 passed Phase 2 with "0 overlapping files"
> but silently regressed SEO, auth, and branding because git merge-base was misleading
> due to a revert→re-apply cycle. This phase catches what commit history analysis misses.

### Step 1: Detect Revert Chains

Check if the PR's commit history involves any reverts:
```
git log --oneline <merge-base>..origin/<pr-branch> | grep -i "revert"
git log --oneline <merge-base>..origin/staging | grep -i "revert"
```

If reverts are found, flag as **WARNING: "Revert chain detected — commit topology may be misleading. Running content-level regression check."**

### Step 2: Content-Diff Critical Files

Regardless of what Phase 2 says, **always** compare the actual file content between the PR branch and staging for the critical file watchlist. These are shared files that multiple workstreams frequently touch:

**Olera Critical File Watchlist:**
```
components/shared/Footer.tsx
components/shared/Navbar.tsx
components/auth/AuthProvider.tsx
components/auth/UnifiedAuthModal.tsx
app/page.tsx
app/layout.tsx
app/globals.css
middleware.ts
next.config.ts
app/provider/[slug]/page.tsx
components/shared/FindCareMegaMenu.tsx
components/providers/QASectionV2.tsx
```

For each critical file that exists on the PR branch:
```
git diff origin/staging..origin/<pr-branch> -- <file>
```

If the diff is non-empty, the PR **will change this file**. Classify:

| Situation | Risk |
|-----------|------|
| File is in Phase 2 "safe" category AND diff shows changes | **HIGH — silent regression.** The PR is changing a file that git thought was safe because it wasn't "overlapping." This is the exact scenario from the Feb 26 post-mortem. |
| File is in Phase 2 overlap category AND diff shows changes | Expected — already flagged |
| File not changed in PR at all | No risk |

### Step 3: Spot-Check Regressions

For any critical file the PR would change (from Step 2), show a brief comparison of key indicators:

```bash
# Example: check if Footer still has discovery zone
git show origin/staging:<file> | grep -c "pattern"  # current staging
git show origin/<pr-branch>:<file> | grep -c "pattern"  # after merge
```

**Indicators to check per file:**
- `Footer.tsx`: "Find senior care by city" / "CityRow" / "popularCities"
- `AuthProvider.tsx`: CACHE_TTL value, QUERY_TIMEOUT value
- `page.tsx` (homepage): `/memory-care` vs `/browse?type=`
- `layout.tsx`: GA4 measurement ID
- `middleware.ts`: V1_CATEGORY_SLUGS
- `next.config.ts`: count of `permanent: true` redirects
- `Navbar.tsx`: olera-logo.png

If any indicator disappears between staging and the PR branch, flag as:
**REGRESSION DETECTED: `<file>` would lose `<indicator>` after merge**

---

## Phase 3: Produce the Report

Present findings in this format:

```markdown
## PR Merge Analysis: #<number> — <title>

**Branch**: <head> -> <base>
**Files changed**: <count> | **Additions**: +<n> | **Deletions**: -<n>
**CI checks**: <pass/fail/pending>
**Merge base**: <short-sha> (<how far behind staging>)
**Branch age**: <N> commits behind staging [WARNING if >5]
**Revert chain**: <detected/none> [WARNING if detected]

### File Breakdown

#### Safe (no conflicts) — <count> files
- `path/to/file.tsx` (added/modified)
- ...

#### Overlap — PR newer — <count> files
- `path/to/file.tsx`
  - PR: <date> — "<commit msg>"
  - Staging: <date> — "<commit msg>"
  - Risk: Low (PR is more recent)

#### Overlap — Staging newer — <count> files
- `path/to/file.tsx`
  - PR: <date> — "<commit msg>"
  - Staging: <date> — "<commit msg>"
  - Risk: **Medium** — merging may overwrite staging work

#### Diverged (both modified independently) — <count> files
- `path/to/file.tsx`
  - PR: <date> — "<commit msg>"
  - Staging: <date> — "<commit msg>"
  - Risk: **High** — manual review needed
  - [Show diff preview snippet]

#### Deleted on PR but modified on staging — <count> files
- `path/to/file.tsx`
  - Risk: **High** — PR removes file staging still uses

### Content Regression Check
[For each critical file that would change:]
- `Footer.tsx`: [OK / REGRESSION — loses discovery zone]
- `AuthProvider.tsx`: [OK / REGRESSION — cache TTL drops from 24hr to 30min]
- `page.tsx`: [OK / REGRESSION — power page routing lost]
- etc.

### Dependency Check
- Are there other open PRs that depend on or conflict with this one?
  - `gh pr list --base staging --state open --json number,title,headRefName`
  - Flag any that touch the same files

### Recommendation
[One of:]
- "Clean merge — no overlapping files, no content regressions. Safe to proceed."
- "Minor overlaps — PR is newer on all contested files. Should merge cleanly."
- "Caution — staging has newer changes in <N> files. Review before merging."
- "Manual merge needed — <N> files have diverged. Recommend rebasing first."
- "CONTENT REGRESSION — PR would silently downgrade <N> critical files. DO NOT merge without reconciliation."
```

---

## Phase 4: Ask for Confirmation

Present the user with clear options:

1. **Merge directly** (if clean, no regressions) — `gh pr merge <PR> --squash` or `--merge`
2. **Rebase first, then merge** (if behind staging) — safer for diverged files
3. **Reconcile first** (if content regressions detected) — create a reconciliation branch that preserves both workstreams
4. **Abort** — user wants to review manually first
5. **Show me the diffs** — drill into specific overlapping/regressed files before deciding

If content regressions were detected in Phase 2.5, **default recommendation is option 3 (reconcile), not option 1.** Warn the user explicitly:
> "This PR would regress <N> critical files. Merging directly will lose work. Recommend creating a reconciliation branch instead."

Wait for the user to choose. Do NOT proceed without explicit confirmation.

---

## Phase 5: Execute the Merge

Based on user's choice:

### Option 1: Direct Merge
```bash
gh pr merge <PR> --merge --delete-branch
```
- Verify the merge succeeded
- Run `git fetch origin staging` and confirm the merge commit exists

### Option 2: Rebase First
```bash
# Create a local working branch
git checkout -b merge/<pr-branch> origin/<pr-branch>

# Rebase onto latest staging
git rebase origin/staging

# If conflicts arise:
#   - Show each conflicting file
#   - Ask user how to resolve (keep ours, keep theirs, manual edit)
#   - After resolution: git rebase --continue

# Force-push the rebased branch (ASK USER FIRST)
git push origin merge/<pr-branch>:<pr-branch> --force-with-lease

# Then merge the clean PR
gh pr merge <PR> --merge --delete-branch
```

### Option 3: Reconcile (for content regressions)
```bash
# Identify which branch has the "good" versions of regressed files
# (Ask user: "Which branch has the correct state for care-seeker/SEO files?")

# Create reconciliation branch from the good-state branch
git checkout -b reconcile-<pr-branch> origin/<good-state-branch>

# Merge staging into it
git merge origin/staging --no-commit

# For each conflicting file, resolve based on domain ownership:
#   - Provider-side files → take staging/PR version
#   - Care-seeker/SEO/auth files → take good-state version
#   - Shared files (navbar) → manual merge, verify both sides intact

# Commit, push, create new PR targeting staging
# Verify build passes before submitting
```

### Post-Merge Verification
After merge completes:
1. `git fetch origin staging`
2. **Always run content regression checks on critical files** (not just "staging newer" files):
   ```
   git show origin/staging:components/shared/Footer.tsx | grep "Find senior care"
   git show origin/staging:components/auth/AuthProvider.tsx | grep "CACHE_TTL"
   git show origin/staging:app/page.tsx | grep "/memory-care"
   ```
3. Report final status:
   ```
   ## Merge Complete

   PR #<number> merged into staging.
   Staging is now at: <sha> — "<commit msg>"

   ### Critical File Verification
   - Footer: discovery zone [intact/MISSING]
   - AuthProvider: 24hr cache [intact/REGRESSED]
   - Homepage: power page routing [intact/REGRESSED]
   - Layout: GA4 analytics [intact/MISSING]

   ### Next Steps
   - Check staging deployment: https://staging-olera2-web.vercel.app
   - Other open PRs that may need rebasing: #<list>
   ```

---

## Phase 6: Publish Report to Notion

After the merge completes (or after a reconciliation), create a report in the **PR Merge Reports** folder on Notion.

**Notion folder:** Product Development > PR Merge Reports
**Parent page ID:** `3135903a-0ffe-81e1-bee6-c3cdabd61965`

Use the `mcp__claude_ai_Notion__notion-create-pages` tool to create a page under that parent with:

**Title:** `PR #<number> — <title> (<date>)`

**Content should include:**
1. A callout block with PR number, branch, and GitHub link
2. **Context** — why this PR exists, what it changes
3. **Analysis Summary** — file breakdown (safe / overlap / diverged / regressed)
4. **Content Regression Check Results** — which critical files were checked, any regressions found
5. **Decision** — what the user chose (merge / rebase / reconcile / abort)
6. **Outcome** — final staging SHA, verification results
7. **File Resolution Table** — for reconciliation PRs, show which files came from which workstream (with contributor names, not branch names)
8. **Lesson Learned** (if applicable) — callout block with any insights

Use Notion-flavored Markdown formatting: callout blocks, tables, headings, color attributes for risk levels.

**When to create the report:**
- Always after a merge completes
- Always after a reconciliation PR is created
- Skip for aborted merges (no action taken)

---

## Safety Rails

- **Never force-push without asking**
- **Never merge to `main`** unless user explicitly confirms a production merge
- **If CI checks are failing**, warn and ask before proceeding
- **If the PR has merge conflicts GitHub can't resolve**, recommend the rebase path
- **If content regressions are detected**, recommend reconciliation over direct merge
- **Always fetch fresh** before any comparison — stale refs cause false reports
- **Log what was done** — if something goes wrong, the user needs a trail
- **Revert chains are red flags** — if a PR's history includes reverts, git merge-base is unreliable; always run content checks
- **Branch age matters** — PRs >5 commits behind staging have elevated regression risk

---

## Quick Reference

| Command | Action |
|---------|--------|
| `/pr-merge 66` | Analyze and merge PR #66 to staging |
| `/pr-merge feature-branch` | Find PR for branch and analyze |
| `/pr-merge` | Analyze PR for current branch |
