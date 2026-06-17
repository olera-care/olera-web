---
name: voice-ux
description: "Use when the user explicitly invokes /voice-ux, says voice-ux, or asks Codex to run the Olera Voice Assistant UX Review slash-command workflow. Thin Codex wrapper that reads .claude/commands/voice-ux.md and executes that command exactly."
---

# Voice Assistant UX Review

Run the Olera legacy slash-command workflow for `/voice-ux`.

## Workflow

1. Read `.claude/commands/voice-ux.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/voice-ux.md`; update this wrapper only if the command file moves or the invocation contract changes.
