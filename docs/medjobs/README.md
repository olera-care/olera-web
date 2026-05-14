# MedJobs Documentation

Two complementary documents covering the MedJobs CRM system.

## Documents

### `EXECUTIVE_SUMMARY.md`
**Audience:** Engineering + outreach/admin team, on first read.
**Voice:** Strategic, philosophical, scannable, motivational.
**Reading time:** ~15 minutes.

Use this for team orientation, Slack distribution, and onboarding new contributors. Covers what the system is, why it exists, how the funnel works, the operational lifecycle, current state, and priorities.

### `OPERATIONAL_BRIEF.md`
**Audience:** Engineers, future Claude sessions, anyone iterating on the code.
**Voice:** Implementation-aware, reference-grade, exhaustive.
**Reading mode:** Reference document — sections read as needed.

Use this as the canonical engineering reference. Future MedJobs Claude sessions should begin: *"Read `docs/medjobs/OPERATIONAL_BRIEF.md` before we start."*

Includes:
- Full vocabulary with code references
- Complete outcomes map (every Log modal, every outcome, every dispatch)
- State machine reference (status transitions, sub-state transitions, stage derivation)
- Discipline rules (G1–G10) and deferred items registry (D1–D25)
- Critical files reference
- Open architectural decisions / unverified assumptions

## Source of truth

The markdown files in this directory are the **source of truth**. When the system evolves, update these documents.

## Converting to Word (for Slack / email distribution)

The executive summary is designed to read well in markdown and to convert cleanly to Word when needed. Three options:

1. **Copy-paste into Google Docs** — paste the markdown content into a Google Doc; tables and formatting render correctly. Export as `.docx` from there.
2. **Use pandoc** locally:
   ```
   pandoc EXECUTIVE_SUMMARY.md -o EXECUTIVE_SUMMARY.docx
   ```
3. **Any markdown-to-docx converter** (Typora, Pandoc Online, etc.).

The `.docx` is **not** version-controlled — the markdown is. Regenerate the Word file whenever you need to share an updated copy.

## Maintenance

Both documents share vocabulary, philosophy, and the canonical tables. They differ in abstraction level. When the system materially evolves, update both — usually the engineering doc first (source of truth for technical detail), then propagate the conceptual change to the executive summary.

A pointer to `OPERATIONAL_BRIEF.md` lives in the repo's top-level `CLAUDE.md` so future Claude sessions automatically discover it.
