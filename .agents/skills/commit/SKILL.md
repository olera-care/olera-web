---
name: commit
description: "Use when the user explicitly invokes /commit, says commit, or asks Codex to run the Olera Commit Changes slash-command workflow. Thin Codex wrapper that reads .claude/commands/commit.md and executes that command exactly."
---

# Commit Changes

Run the Olera legacy slash-command workflow for `/commit`.

## Workflow

1. Read `.claude/commands/commit.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/commit.md`; update this wrapper only if the command file moves or the invocation contract changes.
