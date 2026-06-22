# Olera Codex Instructions

## Default Shipping Workflow

- Branch from `origin/staging`, not `main`.
- Open PRs against `staging` by default so Vercel creates a preview for QA.
- Target `main` only when the user explicitly says production, hotfix, or promote to main.
- Do not merge PRs unless TJ explicitly asks.
- When the user says `quicksave`, `quick save`, or `save progress and PR`, use the repo skill `quicksave`.
- When the user says `pre-test`, `pretest`, or asks what to test before previewing, use the repo skill `pre-test`.
- When the user says `test-instructions`, `/test-instructions`, asks for manual QA instructions, or asks what to test in preview, use the repo skill `test-instructions`.
- When the user says `pr-merge`, `/pr-merge`, `merge PR`, or asks whether a PR is safe to merge, use the repo skill `pr-merge`.
- When the user says `promote-to-main`, `/promote-to-main`, `promote staging to main`, or asks to ship staging to production, use the repo skill `promote-to-main`.

## Verification

- For TypeScript/code changes, run `npx --no-install tsc --noEmit` when dependencies are installed.
- Run `npm run check:crons` when cron or automation code changes.
- If `npm run lint` fails because `next lint` is treated as a directory, report that repo tooling blocker and use targeted checks instead.

## Existing Context

- `CLAUDE.md` is still the canonical team workflow reference; mirror its branch and PR rules.
- `SCRATCHPAD.md` is the living context log. Update it during quicksave.
