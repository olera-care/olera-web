---
name: ad-boost-setup
description: "Use when the user invokes /ad-boost-setup, says ad-boost-setup, or asks Codex to prepare, configure, launch, publish, or reconcile an Olera Ad Boost campaign on Google Ads, Nextdoor Ads, or both. Covers the required channel choice, cross-channel budget allocation, browser-driven setup, publish approval, tracking, and admin reconciliation workflow."
---

# Ad Boost Campaign Setup

Run Olera's shared Ad Boost campaign setup workflow for Google Ads, Nextdoor Ads, or both platforms.

## Workflow

1. Read `.claude/commands/ad-boost-setup.md` completely before taking any campaign action.
2. Treat that command file as the single source of truth for this workflow.
3. Execute its phases in order, adapting only where Codex tooling differs from Claude Code.
4. Preserve every required gate and invariant, especially:
   - the upfront platform, total-budget, allocation, flight-date, and goal decision;
   - the rule that selecting both platforms must not silently double the total budget;
   - browser visibility and advertiser-account verification;
   - per-platform tracking parameters and shared campaign-tag requirements;
   - the final publish confirmation before any spend can begin;
   - post-publish Admin Ad Boost reconciliation and reporting limitations.
5. If the user supplies only part of the setup inputs, collect only the missing required inputs described by the command file.

## Compatibility Note

Codex does not automatically expose `.claude/commands` as its own slash-command catalog. This thin skill makes the same workflow discoverable to Codex without copying its operating instructions. Keep campaign behavior in `.claude/commands/ad-boost-setup.md`; update this wrapper only if that file moves or the invocation contract changes.
