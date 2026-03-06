# GitHub Copilot Instructions — Olera Web

Read `AGENTS.md` in the repo root for full project context, architecture, and migration audit details.

## Current Focus: v1.0 to v2.0 Migration Audit

This repo is a Next.js 16 senior care marketplace migrating from a legacy Rails+React stack. The DNS cutover has not happened yet.

When asked about the migration:
- Cross-reference `docs/migration-playbook.md` (v1.0 route inventory) against `next.config.ts` redirects and `middleware.ts`
- Check `docs/migration-sanity-check.md` for known gaps (13 findings, 11 fixed, 2 open)
- Verify `app/sitemap.ts` covers all content types
- Look for hardcoded v1.0 URLs anywhere in the codebase

## Conventions

- TypeScript strict, no `any`
- Tailwind CSS only (no CSS modules)
- Next.js App Router (Server Components default)
- Branch from `staging`, PR to `staging`
- Imperative commits: "Add X" not "Added X"
