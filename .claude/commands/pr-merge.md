# Safe PR Merge to Staging

Target PR: $ARGUMENTS (PR number, URL, or branch name)

## Purpose

Safely merge a pull request into staging by analyzing conflicts, comparing file freshness, and producing a clear report before executing the merge. Prevents newer staging work from being overwritten.

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

---

## Phase 2: File-Level Analysis

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

## Phase 3: Produce the Report

Present findings in this format:

```markdown
## PR Merge Analysis: #<number> — <title>

**Branch**: <head> -> <base>
**Files changed**: <count> | **Additions**: +<n> | **Deletions**: -<n>
**CI checks**: <pass/fail/pending>
**Merge base**: <short-sha> (<how far behind staging>)

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

### Dependency Check
- Are there other open PRs that depend on or conflict with this one?
  - `gh pr list --base staging --state open --json number,title,headRefName`
  - Flag any that touch the same files

### Recommendation
[One of:]
- "Clean merge — no overlapping files. Safe to proceed."
- "Minor overlaps — PR is newer on all contested files. Should merge cleanly."
- "Caution — staging has newer changes in <N> files. Review before merging."
- "Manual merge needed — <N> files have diverged. Recommend rebasing first."
```

---

## Phase 4: Ask for Confirmation

Present the user with clear options:

1. **Merge directly** (if clean or minor overlaps) — `gh pr merge <PR> --squash` or `--merge`
2. **Rebase first, then merge** (if behind staging) — safer for diverged files
3. **Abort** — user wants to review manually first
4. **Show me the diffs** — drill into specific overlapping files before deciding

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

### Post-Merge Verification
After merge completes:
1. `git fetch origin staging`
2. Verify key files weren't regressed by spot-checking "staging newer" files:
   ```
   git show origin/staging:<file> | head -20
   ```
3. Report final status:
   ```
   ## Merge Complete

   PR #<number> merged into staging.
   Staging is now at: <sha> — "<commit msg>"

   ### Quick Verification
   - [file]: confirmed intact
   - [file]: confirmed intact

   ### Next Steps
   - Check staging deployment: https://staging-olera2-web.vercel.app
   - Other open PRs that may need rebasing: #<list>
   ```

---

## Safety Rails

- **Never force-push without asking**
- **Never merge to `main`** unless user explicitly confirms a production merge
- **If CI checks are failing**, warn and ask before proceeding
- **If the PR has merge conflicts GitHub can't resolve**, recommend the rebase path
- **Always fetch fresh** before any comparison — stale refs cause false reports
- **Log what was done** — if something goes wrong, the user needs a trail

---

## Quick Reference

| Command | Action |
|---------|--------|
| `/pr-merge 66` | Analyze and merge PR #66 to staging |
| `/pr-merge feature-branch` | Find PR for branch and analyze |
| `/pr-merge` | Analyze PR for current branch |
