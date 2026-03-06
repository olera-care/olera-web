# Olera Web — AI Agent Context

> This file provides context for AI coding assistants (OpenAI Codex, Google Gemini, GitHub Copilot, Claude, etc.) working in this repository.

---

## What is Olera?

Olera is a **senior care discovery platform** — a two-sided marketplace connecting:
- **Families (seekers)** searching for senior care options by location
- **Providers** offering care services (assisted living, home care, memory care, skilled nursing, etc.)

The platform includes: provider search/browse, provider detail pages (~39,000), family-to-provider messaging, provider portal (claim/manage listings), admin dashboard, editorial content hub, benefits finder, and community forum.

**Live URLs:**
- Production: `olera2-web.vercel.app` (branch: `main`)
- Staging: `staging-olera2-web.vercel.app` (branch: `staging`)
- Legacy v1.0: `olera.care` (Rails + React — being replaced by this codebase)

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS with custom design system (`tailwind.config.ts`)
- **Database:** Supabase (PostgreSQL) — shared with iOS app, read-only + auth
- **Auth:** Supabase Auth (Google OAuth + email OTP)
- **Email:** Resend (`lib/email.ts`, `lib/email-templates.tsx`)
- **SMS:** Twilio (`lib/twilio.ts`)
- **Alerts:** Slack webhooks (`lib/slack.ts`)
- **Marketing:** Loops (`lib/loops.ts`)
- **Payments:** Stripe (configured, not fully live)
- **Hosting:** Vercel (auto-deploy on push)
- **Maps:** MapLibre GL

---

## Project Structure

```
olera-web/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Homepage
│   ├── layout.tsx              # Root layout + global metadata
│   ├── [category]/             # Browse: /{category}/{state}/{city}
│   ├── provider/[slug]/        # Provider detail (~39K dynamic pages)
│   ├── browse/                 # Search UI
│   ├── caregiver-support/      # Editorial content hub (~103 articles)
│   ├── community/              # Forum / community
│   ├── admin/                  # Admin dashboard (protected)
│   ├── portal/                 # Provider portal (protected)
│   ├── auth/                   # Auth callback routes
│   ├── for-providers/          # Provider marketing + claim flow
│   ├── benefits/               # Senior benefits finder
│   ├── api/                    # API routes (18+)
│   └── ...
│
├── components/                 # React components
│   ├── shared/                 # Navbar, Footer, Layout
│   ├── ui/                     # Base: Button, Card, Input, etc.
│   ├── home/                   # Homepage sections
│   ├── browse/                 # Browse/search components
│   ├── provider/               # Provider profile components
│   ├── admin/                  # Admin dashboard components
│   └── auth/                   # Auth modal (UnifiedAuthModal.tsx)
│
├── lib/                        # Utilities & business logic
│   ├── supabase/client.ts      # Browser Supabase client (preferred)
│   ├── supabase/server.ts      # Server Supabase client (can fail in prod)
│   ├── email.ts                # Resend email utility
│   ├── email-templates.tsx     # HTML email templates
│   ├── slack.ts                # Slack webhook alerts
│   ├── twilio.ts               # Twilio SMS utility
│   ├── types/                  # TypeScript interfaces
│   ├── content.ts              # CMS/article utilities
│   ├── us-city-search.ts       # City search (18K+ cities, progressive load)
│   └── ...
│
├── docs/                       # Documentation
│   ├── migration-playbook.md   # v1.0 -> v2.0 full migration strategy
│   ├── migration-sanity-check.md # Gap analysis (13 findings)
│   ├── cutover-runbook.md      # DNS cutover steps + rollback plan
│   └── ...
│
├── plans/                      # Feature implementation plans
├── middleware.ts                # Auth protection + URL redirects
├── next.config.ts              # Image config + 30+ redirect rules
├── tailwind.config.ts          # Custom design system
├── vercel.json                 # Cron job config
└── CONTRIBUTING.md             # Team workflow guide
```

---

## Git Workflow

```
feature branch -> PR to staging -> QA -> PR to main -> production
```

- Always branch from `staging`, not `main`
- PRs target `staging` by default
- Commit style: imperative mood ("Add X" not "Added X"), first line <50 chars

---

## Key Architectural Patterns

1. **Client-side Supabase preferred** — `lib/supabase/client.ts` is reliable; `server.ts` can fail in production Vercel environment. Use client-side fetching when possible.

2. **Fire-and-forget notifications** — Email, SMS, and Slack calls never throw. They log errors and return `{ success, error }`. Callers should not block on notification delivery.

3. **Dual-sided data model** — `olera-providers` table (public listings) vs `business_profiles` table (claimed/managed by providers). Approved business_profiles surface in public search alongside olera-providers.

4. **URL redirect layers** — Two systems handle v1.0 -> v2.0 redirects:
   - `next.config.ts` `redirects()` — 30+ static redirect rules
   - `middleware.ts` — Dynamic redirects (state abbreviations, 4-segment provider URLs, category-scoped content)

5. **Progressive data loading** — City search loads in tiers: fallback -> tier1 (200 cities) -> tier2 (18K cities) -> ZIP index.

---

## v1.0 -> v2.0 Migration Context

**IMPORTANT: This is the primary audit target.**

Olera is migrating from v1.0 (Rails backend + React frontend, hosted at `olera.care`) to v2.0 (this Next.js codebase). The DNS cutover has NOT happened yet — v1.0 is still live.

### Goals
- Zero traffic loss during cutover
- All v1.0 URLs either have a v2.0 equivalent or a 301 redirect
- SEO rankings preserved or improved (currently scoring 90% / A- on 40-element audit)
- No broken user flows (especially provider portal emails with deep links)

### Migration Documents (READ THESE)
- **`docs/migration-playbook.md`** — Full strategy: 40-element SEO report card, 49 v1.0 routes mapped to v2, DNS cutover plan, CMS migration plan
- **`docs/migration-sanity-check.md`** — Gap analysis: 13 findings from comparing v1.0 source code against v2.0. 11 fixed, 2 open.
- **`docs/cutover-runbook.md`** — Step-by-step DNS cutover with pre-flight checks, 5 phases, rollback plan

### Known Open Items (Verify These)
1. **Gated provider portal page missing** — `/provider-portal/provider/{slug}/*` URLs used in all provider emails are dead links. These are operational (not SEO), but critical to provider activation. Assigned to Esther.
2. **Research & Press redirect status** — `migration-playbook.md` says `/research-and-press/*` redirects to homepage, but v2.0 has live pages at those URLs. The redirect may have been removed — verify in `next.config.ts`.
3. **Forum content equity** — All ~100+ forum discussions redirect to `/community`. If any had backlinks, that SEO equity is lost. Monitor after cutover.

### Audit Checklist
When reviewing this migration, check:
- [ ] Every v1.0 route in `docs/migration-playbook.md` Section 2 has a v2 equivalent or redirect
- [ ] `next.config.ts` redirect rules cover all documented v1.0 URLs
- [ ] `middleware.ts` handles dynamic URL patterns (state abbreviations, pagination, category-scoped URLs)
- [ ] `app/sitemap.ts` covers all content types (providers, articles, power pages, browse pages, benefits)
- [ ] No hardcoded v1.0 URLs exist in the codebase
- [ ] Provider portal deep links from emails resolve correctly
- [ ] Structured data (JSON-LD) is present on provider detail pages
- [ ] Canonical URLs are set correctly on all public pages
- [ ] 404 pages return proper HTTP 404 status codes

### Key Files for Migration Audit
- `next.config.ts` — All static redirect rules (lines 30-105)
- `middleware.ts` — Dynamic redirect logic
- `app/sitemap.ts` — Sitemap generation
- `app/provider/[slug]/page.tsx` — Provider detail page (SEO, structured data)
- `app/layout.tsx` — Root metadata and canonical defaults
- `docs/migration-playbook.md` — v1.0 route inventory (Section 2)
- `docs/migration-sanity-check.md` — Known gaps and findings

---

## What NOT to Do

- Do not modify code on this branch — this is a read-only audit
- Do not commit secrets or environment variable values
- Do not assume v1.0 URLs are dead — DNS cutover has not happened yet
- Do not trust `server.ts` Supabase client in production — prefer `client.ts`
