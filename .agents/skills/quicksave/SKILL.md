---
name: quicksave
description: Use when the user says quicksave, quick save, save progress, save progress and PR, make a PR I can preview, or asks to finish a session by saving work. Saves session context, commits relevant changes, pushes a branch, and creates or updates a ready-for-review PR against staging for Vercel preview.
---

# Quicksave

Run the end-of-session Olera save-and-PR workflow.

## Workflow

1. Inspect state:
   - Run `git status -sb`.
   - Review the diff and identify only the files that belong to the current task.
   - If unrelated changes are present, do not stage them. Ask only if scope is ambiguous.

2. Save context:
   - Read `SCRATCHPAD.md`.
   - Add a concise session entry with date, changed files, decisions, validation, PR/branch if known, and next step.
   - Keep it short and practical.

3. Branch:
   - If on `main`, detached `HEAD`, or a branch not suitable for the task, create a new branch from `origin/staging`.
   - Use `codex/<short-task-slug>` unless the user supplied a name.
   - Default PR base is `staging`. Use `main` only for explicit production/hotfix/promote requests.

4. Verify:
   - Run the smallest relevant checks.
   - Prefer `npx --no-install tsc --noEmit` for TypeScript/code changes when dependencies exist.
   - Run `npm run check:crons` if cron or automation code changed.
   - If `npm run lint` fails because of the repo's `next lint` tooling issue, report it and continue with targeted verification.

5. Commit:
   - Stage only relevant files.
   - Commit with an imperative subject under 50 characters.
   - Include a short body only when the why is not obvious.

6. Push and PR:
   - Push the current branch.
   - Check for an existing PR for the branch.
   - If one exists, verify it targets `staging`; retarget if needed.
   - If none exists, create a ready-for-review PR against `staging` so Vercel can preview it. Use draft only if the user asks.
   - If the branch was accidentally based on `main`, rebase/cherry-pick it onto `origin/staging` before the final push.

7. Report:
   - Give branch, commit, PR URL, base branch, and validation results.
   - Include the Vercel preview link/check status when available.

## Safety

- Never merge the PR.
- Never stage unrelated user changes.
- Never push directly to `main` or `staging`.
- Use explicit file paths for staging in mixed worktrees.
