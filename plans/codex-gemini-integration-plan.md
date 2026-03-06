# Plan: Codex & Gemini Migration Audit Integration

Created: 2026-03-05
Status: Not Started
Branch: `fine-bohr` (throwaway — will NOT be merged)

## Goal

Set up OpenAI Codex and Google Gemini Code Assist so they can independently audit the v1.0 to v2.0 migration for blind spots in redirects, SEO, user retention, and naming.

## Context

- The migration sanity check was already completed by Claude (PR #152, 11 of 13 gaps fixed)
- This is a **second-opinion audit** using different AI tools
- The branch is throwaway — config files stay on-branch, never merge to staging/main
- TJ is the primary user

## Success Criteria

- [ ] AGENTS.md exists with full project + migration context (works across all AI tools)
- [ ] `.gemini/` config exists (styleguide.md + config.yaml)
- [ ] `.codex/config.toml` exists with model + sandbox settings
- [ ] `.github/copilot-instructions.md` exists (for GitHub Copilot fallback)
- [ ] TJ can open the repo in VS Code with Gemini Code Assist extension and ask migration audit questions
- [ ] TJ can run `codex` CLI in the repo and it picks up context automatically
- [ ] Both tools can identify at least 1 issue or confirm existing findings

## Tasks

### Phase 1: Shared Foundation

- [ ] 1. Create `AGENTS.md` at repo root
      - Content: Project overview (senior care marketplace), tech stack, project structure, key files, git workflow
      - Migration-specific section: link to `docs/migration-sanity-check.md`, `docs/migration-playbook.md`, `docs/cutover-runbook.md`
      - Explicit audit prompt: "Review v1.0 to v2.0 migration for missed redirects, SEO regressions, broken user flows, and naming inconsistencies"
      - Include the 3 open items (#1, #12, #13) as known gaps to verify
      - Keep under 400 lines
      - Files: `AGENTS.md` (new)
      - Verify: File exists, reads well, no secrets

### Phase 2: Gemini Code Assist

- [ ] 2. Create `.gemini/styleguide.md`
      - Coding conventions (TypeScript strict, Tailwind, Next.js App Router patterns)
      - Migration audit focus areas (redirects in next.config.ts, middleware.ts, sitemap coverage)
      - Reference AGENTS.md and docs/ for deeper context
      - Files: `.gemini/styleguide.md` (new)
      - Verify: File exists

- [ ] 3. Create `.gemini/config.yaml`
      - Enable code review features
      - Set ignore patterns (node_modules, .next, public/data)
      - Files: `.gemini/config.yaml` (new)
      - Verify: File exists, valid YAML

- [ ] 4. Install Gemini Code Assist VS Code extension (manual step for TJ)
      - Sign in with Google account
      - Verify local codebase awareness is enabled
      - Test: Ask Gemini "What v1.0 URLs are not redirected in v2.0?"
      - Files: none (VS Code action)
      - Verify: Gemini responds with migration-aware answer

### Phase 3: OpenAI Codex CLI

- [ ] 5. Create `.codex/config.toml`
      - Model: latest codex model
      - Sandbox: read-only (audit only, no writes)
      - Personality: pragmatic
      - Files: `.codex/config.toml` (new)
      - Verify: File exists, valid TOML

- [ ] 6. Run Codex CLI audit (manual step for TJ)
      - Install: `npm i -g @openai/codex`
      - Run: `codex` in repo root
      - Prompt: "Read AGENTS.md and docs/migration-sanity-check.md. Audit the v1.0 to v2.0 migration. Check next.config.ts redirects, middleware.ts, sitemap.ts, and all route files under app/. Report any URLs that might 404 after DNS cutover."
      - Files: none (CLI action)
      - Verify: Codex produces audit output

### Phase 4: GitHub Copilot (bonus)

- [ ] 7. Create `.github/copilot-instructions.md`
      - Lightweight — reference AGENTS.md for full context
      - Add migration audit focus instructions
      - Files: `.github/copilot-instructions.md` (new)
      - Depends on: 1
      - Verify: File exists

### Phase 5: Run Audits & Compare

- [ ] 8. Run all three audits and compare findings
      - Collect outputs from Gemini, Codex, and Copilot
      - Compare against Claude's 13 findings in migration-sanity-check.md
      - Note any new findings not caught by Claude
      - Files: none (analysis)
      - Depends on: 4, 6, 7
      - Verify: Comparison documented (can be informal notes)

- [ ] 9. Update Notion task status to Done
      - Mark "Olera 2.0 Migration Sanity Check Integration (Codex & Gemini)" as Done
      - Files: none (Notion)
      - Depends on: 8

## Risks

- **Codex CLI may not be available**: OpenAI Codex requires ChatGPT Plus/Pro subscription. If not available, skip Phase 3 and use ChatGPT web instead.
- **Gemini codebase awareness is a preview feature**: May not index all files. Fallback: paste key files into context manually.
- **Config files on throwaway branch**: Since we're not merging, these files won't persist. That's intentional — this is a one-time audit.
- **AI tools may not find anything new**: Claude's audit was thorough (13 findings). The value is confirmation, not necessarily new discoveries.

## Notes

- AGENTS.md is the highest-value deliverable — it's the shared context all tools read
- Don't duplicate CLAUDE.md content into AGENTS.md; keep CLAUDE.md for Claude-specific workflow, AGENTS.md for universal project context
- The migration docs (migration-playbook.md, migration-sanity-check.md, cutover-runbook.md) are the primary audit targets
- Open items to verify: #1 (gated provider portal), #12 (research-and-press redirect), #13 (forum content equity)
