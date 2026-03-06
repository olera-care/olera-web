# Olera Web — Gemini Code Assist Style Guide

## Project Context

Read `AGENTS.md` in the repo root for full project context, tech stack, and architecture.

## Primary Task: Migration Audit

You are being used to audit the v1.0 to v2.0 migration of Olera, a senior care platform. Your focus areas:

1. **Redirect completeness** — Check `next.config.ts` and `middleware.ts` for any v1.0 URLs that would 404 after DNS cutover. Cross-reference against `docs/migration-playbook.md` Section 2 (v1.0 Route Inventory).

2. **SEO preservation** — Verify structured data (JSON-LD) on provider pages, canonical URLs, sitemap coverage, and meta tags. See `docs/migration-playbook.md` Section 1 for the 40-element SEO report card.

3. **Broken user flows** — Check for hardcoded v1.0 URLs in emails, components, or API responses. Provider portal deep links (`/provider-portal/provider/{slug}/*`) are known broken — flag any others.

4. **Open items to verify** — See `docs/migration-sanity-check.md` items #1, #12, #13.

## Coding Conventions

When reviewing code (not applicable for audit-only mode):

- TypeScript strict mode — no `any` types
- Tailwind CSS for all styling — no inline styles or CSS modules
- Next.js App Router patterns — Server Components by default, `"use client"` only when needed
- Imperative commit messages: "Add X" not "Added X"
- Prefer `lib/supabase/client.ts` over `lib/supabase/server.ts` for data fetching
- Fire-and-forget pattern for notifications (email, SMS, Slack) — never block main flow
- Components go in `components/`, utilities in `lib/`, pages in `app/`
