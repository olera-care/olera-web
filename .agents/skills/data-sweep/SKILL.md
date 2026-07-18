---
name: data-sweep
description: "Use when the user explicitly invokes /data-sweep, says data-sweep, or asks Codex to run the Olera Olera Provider Data Sweep slash-command workflow. Thin Codex wrapper that reads .claude/commands/data-sweep.md and executes that command exactly."
---

# Olera Provider Data Sweep

Run the Olera legacy slash-command workflow for `/data-sweep`.

## Workflow

1. Read `.claude/commands/data-sweep.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/data-sweep.md`; update this wrapper only if the command file moves or the invocation contract changes.
