---
name: explore
description: "Use when the user explicitly invokes /explore, says explore, or asks Codex to run the Olera Explore Before Building slash-command workflow. Thin Codex wrapper that reads .claude/commands/explore.md and executes that command exactly."
---

# Explore Before Building

Run the Olera legacy slash-command workflow for `/explore`.

## Workflow

1. Read `.claude/commands/explore.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/explore.md`; update this wrapper only if the command file moves or the invocation contract changes.
