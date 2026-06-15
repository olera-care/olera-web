# PR #1051 — Provider funnel instrumentation + Managed Ads — MERGE REPORT (2026-06-15)

Branch `provider-funnel-instrumentation` → `staging`. Merged via `gh pr merge 1051 --merge --admin`.
staging now at `d2772760` (Merge pull request #1051).

## Analysis
- Merge base `1a060aeb` == staging HEAD → PR is a clean superset of staging.
- **All 50 changed files: Safe.** No overlap, no divergence, no staging-newer risk.
- Revert chain: none. CI: Vercel pass.
- Critical/SEO watchlist: NONE touched (Footer/Navbar/AuthProvider/homepage/layout/middleware/next.config/provider[slug]/OG-Twitter/waiver-library/section layouts all untouched).

## Content regression check (post-merge, staging)
- Footer discovery zone: intact (5 markers)
- AuthProvider CACHE_TTL: intact (2)
- Navbar logo: intact
- next.config permanent redirects: 83 (intact)
- boost page (ApplyExperience/standing order): present on staging

## What shipped
Managed Ads concierge funnel (boost page: standing-order/pending_profile, two-column apply + live summary, inline section editing), funnel instrumentation (events → provider_activity → Activity Center "Growth" + Slack), Find Families Slack (page_viewed + outreach_sent), dejank (boost + Find Families deferred fetch), completion score = controllable sections + reviews/response as non-gating boosters, gallery iOS-backfill scoring fix, real brand-logo marquee, /punch de-anchor (docs), migrations 105+106 (already applied to shared Supabase).

## Decision
Direct merge (merge commit), branch KEPT for follow-ups.

## Post-merge follow-ups
- Restore Aggie Home Care → College Station, TX (was parked in Boise for hero testing).
- Confirm SLACK_WEBHOOK_URL scoped to the staging env (else Slack silent on staging).
- Other open PRs now behind staging: #1049 (scratchpad — trivial SCRATCHPAD.md conflict possible), #1043 (content article).
- Offered/not-built: per-section legibility hints, Find Families prefetch/geo-scope, cold-entry layout-spinner fix.

## Note
Notion PR Merge Reports DB not reachable this session (Notion MCP not connected) — this local file is the fallback record.
