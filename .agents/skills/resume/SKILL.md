---
name: resume
description: "Use when the user explicitly invokes /resume, says resume, or asks Codex to run the Olera Resume Previous Work slash-command workflow. Thin Codex wrapper that reads .claude/commands/resume.md and executes that command exactly."
---

# Resume Previous Work

Run the Olera legacy slash-command workflow for `/resume`.

## Workflow

1. Read `.claude/commands/resume.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/resume.md`; update this wrapper only if the command file moves or the invocation contract changes.
