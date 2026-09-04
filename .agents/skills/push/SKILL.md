---
name: push
description: Use when the user invokes /push, says push, asks Codex to push its thinking, break its own recommendation, pressure-test a plan, or seek the stronger second iteration before implementation.
---

# Push — Break Your Own Answer

Run the Olera `/push` thinking-quality workflow.

## Workflow

1. Read `.claude/commands/push.md` completely before taking action.
2. Treat the prior recommendation or plan as the artifact under review.
3. Follow the command's method in order, including its ground-truth requirement and reporting structure.
4. Do not implement, edit product code, commit, deploy, or mutate external systems while running this skill.
5. Stop after delivering the sharper model, corrected path, remaining unknowns, and the evidence that would settle them. Resume implementation only after the user has seen that result and asks to proceed.

Keep the detailed workflow in `.claude/commands/push.md`; update this wrapper only if that command moves or its invocation contract changes.
