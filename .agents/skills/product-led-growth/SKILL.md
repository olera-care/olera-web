---
name: product-led-growth
description: "Use when the user explicitly invokes /product-led-growth, says product-led-growth, or asks Codex to run the Olera /product-led-growth -- Olera's Head of Growth, in code slash-command workflow. Thin Codex wrapper that reads .claude/commands/product-led-growth.md and executes that command exactly."
---

# /product-led-growth -- Olera's Head of Growth, in code

Run the Olera legacy slash-command workflow for `/product-led-growth`.

## Workflow

1. Read `.claude/commands/product-led-growth.md` completely before taking action.
2. Treat that file as the source of truth for this workflow.
3. Execute its steps in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve the command file's safety gates, reporting format, and stopping conditions.

## Compatibility Note

This skill exists because Codex does not auto-load `.claude/commands` as slash-command autocomplete. Keep command behavior in `.claude/commands/product-led-growth.md`; update this wrapper only if the command file moves or the invocation contract changes.
