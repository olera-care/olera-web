---
name: benefits-pipeline
description: "Use when the user explicitly invokes /benefits-pipeline, says benefits-pipeline, or asks Codex to run the Olera Senior Benefits Pipeline — Content Production System slash-command workflow. Thin Codex wrapper that reads .claude/commands/benefits-pipeline.md and executes that command exactly."
---

# Senior Benefits Pipeline — Content Production System

Run the Olera legacy slash-command workflow for `/benefits-pipeline`.

## Workflow

1. Read `.claude/commands/benefits-pipeline.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/benefits-pipeline.md`; update this wrapper only if the command file moves or the invocation contract changes.
