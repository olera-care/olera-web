---
name: test-instructions
description: "Use when the user explicitly invokes /test-instructions, says test-instructions, asks what manual QA steps to run, or asks Codex to generate test instructions for recent changes. Thin Codex wrapper that reads .claude/commands/test-instructions.md and executes that command exactly."
---

# Test Instructions

Run the Olera legacy slash-command workflow for `/test-instructions`.

## Workflow

1. Read `.claude/commands/test-instructions.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's scope rules, output format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/test-instructions.md`; update this wrapper only if the command file moves or the invocation contract changes.
