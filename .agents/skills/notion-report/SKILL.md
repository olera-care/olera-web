---
name: notion-report
description: "Use when the user explicitly invokes /notion-report, says notion-report, or asks Codex to run the Olera NotionReport — Branch Handoff to Notion slash-command workflow. Thin Codex wrapper that reads .claude/commands/notion-report.md and executes that command exactly."
---

# NotionReport — Branch Handoff to Notion

Run the Olera legacy slash-command workflow for `/notion-report`.

## Workflow

1. Read `.claude/commands/notion-report.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/notion-report.md`; update this wrapper only if the command file moves or the invocation contract changes.
