# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-04.md`

---

## Current Focus

### 2026-04-25 — Wispr-style dashboard polish (PR #631) — 6 commits added on top, ready to merge

**Branch:** `feature/dashboard-compact-activity` — PR [#631](https://github.com/olera-care/olera-web/pull/631), targets staging, mergeable, Vercel preview green.

**What this PR is:** A Wispr Flow-aesthetic reshape of the `/provider` analytics cluster sitting on top of the merged Phase 2 pillars. The Phase 2 cards (PR #625) read as "UI-kit stamp stamp stamp" once they landed — three bordered white cards competing visually. This PR commits to one dark moment (DashboardHero), one borderless typographic sidebar (SidebarSummary), and a content-first activity feed (RecentActivityCard).

**Today's session (2026-04-25 polish loop on top of the prior work):**
- ✅ Hero photo framing — `cover` was scaling the image off card width, so wide viewports stretched the photo huge and chopped the face vertically. Switched to `backgroundSize: auto 150%` (sized off card height) + `md:min-h-[260px]` so face frames consistently regardless of viewport. (`e77d4272`, `c00ffc6d`)
- ✅ Hero photo left-edge — gradient overlay had an opacity-rate inflection that read as a hard line. Added `mask-image` on the image div so the photo's left ~260px fades transparently into the warm-950 background. No more rectangle edge. (`0b684491`)
- ✅ Sidebar review CTA — collapsed count-conditional copy ("Invite another review" / "Invite a past client") into single "Get more reviews →". (`9735995b`)
- ✅ Sidebar traffic report link removed — was duplicative with the views number directly above. (`8ef69e3e`)
- ✅ Traffic report link relocated — added to the bottom Email preferences card with a divider, so the data dashboard isn't lost entirely. (`edaeffce`)

**Pre-test pass on the hero changes:** clean. Caught one near-miss while writing (image would have tiled horizontally without `backgroundRepeat: "no-repeat"` after dropping `cover`) — fixed in the same commit.

**Branch commits since last session (6 new on top of the Phase 2 base):**
1. `e77d4272` — Frame hero face consistently across viewport widths
2. `c00ffc6d` — Size hero image off card height, not width
3. `0b684491` — Soft-fade hero image's left edge with mask-image
4. `9735995b` — Simplify sidebar review CTA to 'Get more reviews'
5. `8ef69e3e` — Remove sidebar traffic report link
6. `edaeffce` — Move data dashboard link into bottom preferences card

**Resume next session:** PR #631 is ready to merge (`/pr-merge 631`). After merge, return to the Next Up backlog or pick up from the deferred Phase 2 polish items below.

---

### 2026-04-23 — Provider Analytics — Phase 2 (Dashboard Redesign) — MERGED via PR #625

**Phase 2 Brief (live doc):** https://www.notion.so/34b5903a0ffe81098302ce55d5df2a4d — source of truth for this workstream. Decisions + open questions live there.

**Branch:** `feature/dashboard-redesign-phase-2a-score-extension` — 8 commits ahead of staging, DRAFT PR #625.

**Resume next session:** Load this file, you'll have full context. Top priorities:
1. Run `/pre-test` — clean review of the 8 commits on the branch
2. Verify mobile responsive layout (right-sidebar stack on narrow viewports)
3. Mark PR #625 ready for review, then `/pr-merge 625`
4. Post-merge: pick the next ⏳ item from Phase 2 backlog below

**Where Phase 2 stands (2026-04-23 EOD):**
- ✅ 2A Score extension — 7 → 9 weighted sections (Reviews + Response Rate) in `lib/profile-completeness.ts`. Backward-compat preserved.
- ✅ Unified `/api/provider/dashboard` endpoint — greeting + activity + reviews + response-rate + cohort in one payload. Commit `9e0cb303`.
- ✅ Pillar A (DashboardHero) — priority-ranked greeting with one primary action CTA. `components/provider-dashboard/v2/DashboardHero.tsx`
- ✅ Pillar C (CohortContextCard) — reframed cohort demand narrative. `components/provider-dashboard/v2/CohortContextCard.tsx`
- ✅ Pillar D (ReviewInvitationsCard) — contextual review invitations, non-sales-y. `components/provider-dashboard/v2/ReviewInvitationsCard.tsx`
- ✅ Pillar E (RecentActivityCard) — merged timeline of questions/leads/reviews/views. `components/provider-dashboard/v2/RecentActivityCard.tsx`
- ✅ Pillar F (TrafficSummaryCard) — compact KPI snapshot + deep link to `/portal/analytics`. `components/provider-dashboard/v2/TrafficSummaryCard.tsx`
- ✅ All pillars wired into `/provider` behind `NEXT_PUBLIC_FF_PROVIDER_ANALYTICS_ONBOARD` flag (`components/provider-dashboard/DashboardPage.tsx` lines 310-325).
- ✅ Completeness sidebar shows 9 sections when v2 data available.
- ✅ Onboard teaser CTA repointed `/portal/analytics` → `/provider` ("See your dashboard").
- ✅ Weekly digest email CTA repointed `/portal/analytics` → `/provider` (`lib/email-templates.tsx` line 995).
- ✅ `/portal/analytics` header rebranded "Analytics" → "Traffic report" with back-to-dashboard link. Deliberately KEPT the route (it's a sub-report now, not a parallel home).
- ⏳ Final `/pre-test` + PR merge to staging.
- ⏳ Mobile responsive check — right sidebar should stack below on narrow viewports; confirmed by DOM but TJ should eyeball on mobile.
- ⏳ Phase 2 polish items (below) — defer to post-merge PRs.

**Phase 2 deferred / polish backlog (post-merge):**
- 🚫 Cohort card zero-demand variant — on staging the cohort shows demand=0 because no real organic traffic hits other TX Assisted Living pages. Card hides correctly by design. Real prod traffic will light it up. **Decided Option A: ship as-is, revisit after prod data accumulates.**
- Geocode business_profiles.city+state → lat/lon so radius-tier cohort works for providers without `source_provider_id` (Aggie + any future claim-flow-skipping providers).
- Pull shared cohort helpers out of `/api/provider/dashboard/route.ts` + `/api/provider/analytics/route.ts` (currently duplicated — Phase 2 TODO noted inline).
- Resend email BASE_URL handling — templates hardcode staging URL so notification emails always point at staging-olera2-web regardless of where we're testing. Proper fix: fallback to `VERCEL_URL` env var with staging as last resort. Not a blocker; workaround is to manually swap hostname in email URL when testing on preview.

**Key decisions locked in:**
- One unified dashboard at `/provider` is the home base. `/portal/analytics` survives as the detailed Traffic Report sub-page (cleaner than folding 606 lines into `/provider`).
- Quality score weights signed off (9 sections; heaviest on Gallery 15%, Reviews 15%, Response Rate 12%).
- Single scrolling page, no tabs.
- Same feature flag as onboard teaser — launches together.
- Review invitations framing is contextual + honest, NEVER sales-y — 60-70yo facility operators have been burned by Caring.com/APFM-style "get more business" hooks, that framing violates trust.
- First-principles over iteration per TJ's "what if current design sucks" instinct.

**Branch commit history (8 commits on feature/dashboard-redesign-phase-2a-score-extension):**
1. `446a4d85` — Extend completion score to 9 weighted sections
2. `9e0cb303` — Add /api/provider/dashboard unified endpoint
3. `76a248a7` — Wire Phase 2 dashboard pillars into /provider behind FF
4. `eea974ba` — Fix four Phase 2 bugs caught in pre-test (dead routes, dead anchors, fabricated stats, wasted fetch)
5. `5bdcd479` — Log end-of-session state for Phase 2 dashboard redesign
6. `8eabdd30` — Add cohort trace to /api/provider/dashboard for diagnostics (_debug field)
7. `d5b878cd` — Add Pillars D + F and repoint analytics CTAs to /provider
8. `[latest]` — Remove _debug diagnostic from dashboard endpoint (cohort behavior is working as designed)

**CohortContextCard diagnostic result (2026-04-23 evening):**
TJ loaded his dashboard on preview, pasted the `_debug` payload. Trace showed:
- Aggie has `source_provider_id: null` → no lat/lon → radius tiers correctly skipped (no-geo)
- State tier ran: 1000 TX Assisted Living slugs from `olera-providers` → passed 5-provider threshold
- Demand query returned 0 unique sessions → card hides correctly (by design — zero-demand would contradict pipeline-opportunity framing)
- **Conclusion: working as designed. Will light up in production with real traffic. Diagnostic code removed in commit 8.**

**Testing state:**
- ✅ Pillar A, E verified rendering by TJ on preview build `d5b878cd`
- ⏳ Pillars D, F — built but not visually verified by TJ yet (right sidebar stacks below on narrow viewports; TJ needs to scroll or widen window to see)
- ⏳ Full `/pre-test` pass on the 8-commit branch before merge

**Current preview URL** (check via `gh pr checks 625` to confirm latest):
`olera-web-git-feature-dashboard-redesign-phase-2a-06a582-olera.vercel.app`

**Strategy doc (parent thread):** https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
**Phase 0 plan:** `plans/provider-analytics-phase-0-instrumentation-plan.md` (shipped)
**Phase 1 plan:** `plans/provider-analytics-phase-1-surfaces-plan.md` (shipped to staging)

**Where everything stands overall:**
- Phase 0 (instrumentation) → SHIPPED (PR #620)
- Phase 1 (surfaces v1) → SHIPPED (PRs #623, #624, chore/dejank-onboard-teaser)
- Phase 2 (dashboard redesign) → mid-build on current branch
- Phase 3 (L3 monetization) → still deferred

**Phase 0 — DONE.** PR #620 merged to staging at commit `b18b08d6`. Instrumentation live. Admin sanity view at `/admin/analytics`. Nightly aggregation cron at 8 AM UTC. [Merge report](https://www.notion.so/34a5903a0ffe8163a88fd2569f8009c3).

**Phase 1 sub-phases shipped on the branch:**
- ✅ 1A Data layer — `/api/provider/analytics` endpoint, `lib/analytics/triage.ts`, migration 046 (provider-owner RLS, applied)
- ✅ 1B Onboard teaser card — `<AnalyticsTeaserCard />` in `ProfilePreviewCard`. Three tier variants (low=pipeline-opportunity framing, medium/high=personal count + delta + source). Behind feature flag `NEXT_PUBLIC_FF_PROVIDER_ANALYTICS_ONBOARD=true` (set on Vercel Preview env, NOT Production).
- ✅ 1C Dashboard — `/portal/analytics`. Owner-gated. Pipeline banner, KPI grid, trend chart, sources, funnel/summary, peer cohort. Not flag-gated.
- ✅ 1D Weekly digest — `/api/cron/weekly-provider-digest` (Mondays 13:00 UTC), tier-aware email template, new opt-out channel via extended `/api/providers/unsubscribe?type=analytics_digest`.
- ⏸ 1B task 8 — sequence reviews copy by analytics state. Deferred (needs shared state refactor).
- ⏸ 1E — distribution-derived thresholds, A/B rollout. Needs ~2 weeks real data.

**Bugs caught + fixed during this session (5 in total):**
1. Teaser card misleading copy when cohort data null + some personal views exist
2. Dashboard PipelineBanner deflating "0 families searched" empty state — hide when 0
3. Weekly digest cron missed legacy providers whose `provider_activity.provider_id` is a `source_provider_id` — added fallback lookup
4. `accounts.select().single()` returning 500 instead of friendly 400 — switched to `.maybeSingle()`
5. `reached_your_page_count` (cohort-stale-unique) contradicting `views.this_period` (real-time-raw) in adjacent dashboard UI — aligned both to `viewsThisPeriod`

**Test results from preview (TJ verified 2026-04-22 evening):**
- ✅ Dashboard at `/portal/analytics` renders perfectly. KPI grid, trend chart, sources, funnel all working.
- ✅ Teaser card appears on reload — confirmed tier-low fallback copy "Your traffic is just getting started" / "1 family viewed your page this month" working as designed.
- 🔴 → ✅ Teaser card invisible on FIRST load (auth race — auto-sign-in not done before fetch). Latest fix `36f172b9` added `useAuth` gate so card waits for auth resolution before fetching. Re-test pending.
- 🟡 → ✅ Funnel bar overflowed at 900% width because question_received historic count exceeded brand-new page_view count. Fixed to use max(stages) as denominator + visual cap at 100%. Renamed "Engagement funnel" → "Engagement summary" since the funnel metaphor breaks when step N exceeds step N-1.

**Notion email-link host issue (not a bug, an environmental constraint):**
Real notification emails sent via Resend point at `staging-olera2-web.vercel.app`, not the preview URL. To test the onboard flow on preview, take a real email's URL and **swap the hostname** for the preview branch URL. The `otk` token signature still verifies because preview + staging share `CLAIM_TOKEN_SECRET`.

**Latest commit:** `36f172b9` (auth race fix + funnel cap). Pre-test passed clean — no new bugs.

**Pre-PR refinement decided 2026-04-22 evening:** Add real-time adaptive cohort fallback to `/api/provider/analytics` BEFORE shipping. Rationale: tonight's preview test showed Aggie's teaser falling back to "1 family viewed your page" (raw count) instead of the pipeline-opportunity framing ("X families searched your area"). Cause: cohort data only comes from the nightly cron which hasn't run yet. Decision: real-time fallback + adaptive widening, ship the polished version.

### Adaptive cohort widening spec (next code change)

**Where:** `/api/provider/analytics/route.ts` — extend the cohort/pipeline_opportunity query branch.

**Logic (try in order, first one with cohort_size >= 5 wins):**
1. `(city, state, category)` — city-level
2. `(state, category)` — state-level fallback
3. `(state, *)` — state, all-categories last-resort fallback

**Real-time vs aggregation table:**
- For Phase 1B', query `provider_activity` directly (real-time COUNT(DISTINCT session_id))
- The nightly cron's `provider_page_view_stats` continues to power historical trend lines (separate use case)
- Acceptable because Phase 1 volume is low; Phase 2 might need caching

**Response shape addition:**
- `pipeline_opportunity.scope: "city" | "state" | "state-all"` — so card/dashboard can pick correct copy

**Copy per scope:**
- city → "X families searched for [category] in [city] this month"
- state → "X families searched for [category] in [state] this month"
- state-all → "X families searched for senior care in [state] this month"

**Cohort lookup approach:**
1. Get cohort provider slugs: `SELECT slug FROM "olera-providers" WHERE state=$1 AND provider_category=$2 [AND city=$3]` (city filter conditional)
2. Threshold check: if rows < 5, fall to next widening tier
3. Once cohort settled, COUNT(DISTINCT metadata->>'session_id') from `provider_activity` for those provider_ids in window

**Provider's own traffic IS included in `local_demand_count`.** Framing is "demand in your area" + "your slice of it" — both include same provider, X ⊃ Y semantically.

**UI changes needed after endpoint update:**
- AnalyticsTeaserCard `buildHeadline` / `buildSubline`: use `pipeline_opportunity.scope` to pick the right "[city]" vs "[state]" wording
- Dashboard PipelineBanner: same scope-aware copy

### Deferred to Phase 2 (decisions made tonight)

- **Geographic-radius cohorts** (lat/lon proximity instead of city name match) — better matches "near me" search behavior. Requires PostGIS or distance math + lat/lon completeness.
- **Population-density-weighted radius** — rural vs urban "near me" semantic difference.
- **Cron computing multi-granularity benchmarks** (city + state + state-all) so dashboard trend lines also adapt.
- **Cohort excluding own traffic** if framing pivots from "your area's demand including you" to "competitive landscape excluding you."

### Next action sequence (post-compact resume)

1. ⏭ Implement adaptive cohort widening in `/api/provider/analytics/route.ts` (~30 min)
2. ⏭ Update AnalyticsTeaserCard + dashboard PipelineBanner copy to consume `scope` field
3. ⏭ `/pre-test` one more sweep
4. ⏭ Commit + push
5. ⏭ Open PR to staging (admin bypass merge per CLAUDE.md)
6. ⏭ Apply migration 046 via Supabase dashboard if not already
7. ⏭ Set `NEXT_PUBLIC_FF_PROVIDER_ANALYTICS_ONBOARD=true` on staging env (Production stays off until full launch)
8. ⏭ Phase 1B task 8 (sequenced reviews copy) and Phase 1E (distribution-derived thresholds + A/B) are the natural follow-ups

**Most important deferred strategic question (Phase 3+):** What is Olera's L3 / monetizable layer? — captured in strategy doc as the highest-priority open question.

---

### 2026-04-21 → 2026-04-22 — 176-city expansion batch complete

176-city senior-care provider expansion. Ran end-to-end via `/city-pipeline`. No code changes — DB + Notion writes only.

**Final stats:**
- 170/176 cities loaded with providers; 6 empty (Holtsville NY, Hampton PA, Penn PA, Burke Centre VA, Bethpage NY, Weston WI — all survived 0 providers after keyword + AI classify + Perplexity entity verification + dedup)
- 3,655 active providers inserted (from 30,304 discovered → 5,754 post-classify → 2,099 soft-deleted by trust-signal entity verification)
- Enrichment: 5,751 descriptions, 1,824 trust signals confirmed, 4,836 review snippets, 4,044 images
- Cost: $386.57 (11,807 Google + 1,750 Perplexity calls)
- Wall time: ~9h15m (discovery 1h25m → clean 3h50m → load 45m → enrich 2h40m → finalize 5m)
- Pipeline logs: `/tmp/pipeline-all.log`, `/tmp/discovery-2026-04-21.log` (both will rotate)

**Data quality (verified via subagent spot-check during enrich):**
- 0 null place_ids, 0 bad categories, 0 out-of-state coordinates, 0 LLC/Inc/Corp suffixes
- Fixed 1 edge case: `vail-az-0005` had " LLP" suffix — stripped post-enrichment
- Name Check regex in pipeline doesn't catch LLP — consider adding for future batches

**Why clean took 3h50m (not "~5 min" per skill):** pooled AI classify ran on 30,304 providers (batch of 80 at a time × ~380 API calls × seconds each + retries). Skill's estimate was based on smaller batches. Expect proportional scaling on future big batches.

**Notion:** all 176 pages flipped "Upload to Backend" → "Complete" via subagent (14 Done boxes checked except "Fetch Email & Contact Info" per skill convention).

**Followups (low priority, carry forward):**
1. **ND/SD not in Notion State select** — Jamestown ND, Mitchell SD, Yankton SD got pages without State value. Add ND/SD options when convenient.
2. ~~**Stale Notion pages in "Discovery" status**~~ — CLEANED UP 2026-04-22. 128 stuck pages audited against Supabase: 127 flipped to Complete (100 from 2026-04-02 bulk seed + 16 more from same batch + 12 from 2026-04-15 184-city batch subagent misses). Port St. John, FL (0 providers after filters) soft-archived.
3. **6 empty cities** — safe to remove from expansion map as "verified empty" (no senior-care providers after all filters).
4. **Live-site check at end showed 5 FAILs** — cosmetic ISR cache warming noise per skill docs, not real failures. Pages will work after ISR warms (~1hr).

---

### 2026-04-21 — Admin Pulse Header (Questions + Leads)

**Branch:** `glad-pare` (tracks `origin/glad-pare`, no PR to `staging` yet — TJ has more feedback to land first)
**Head:** `540825b3`

Built a "pulse header" for `/admin/questions` and `/admin/leads`:
- Title + KPI ("X needing email") + delta line + full-width interactive chart
- Single date-range popover button (7 presets + custom from/to) replacing the old 3-row filter chrome
- Tabs, search, list, inline email form, archive/delete flows untouched

**Files created:**
- `lib/admin-stats.ts` — bucket helpers (hour/day/week/month auto-pick)
- `app/api/admin/questions/stats/route.ts` — returns `{ total, delta, series, bucket }`
- `app/api/admin/leads/stats/route.ts` — same shape
- `components/admin/DateRangePopover.tsx` — single-button popover with presets + stacked From/To custom range
- `components/admin/PulseHeader.tsx` — title/KPI/delta/sparkline + Y-axis max label + gridline + hover tooltip

**Files modified:**
- `app/admin/questions/page.tsx` — integrated PulseHeader, removed old header + filter chrome
- `app/admin/leads/page.tsx` — same

**Iteration log (why this took 8 commits):**
1. `6c9e9a34` — initial 48px sparkline — "looked bad"
2. `d4eded07` — width bug (ResizeObserver never attached) + empty-state bug (`Math.max(1, …)` masked all-zero case)
3. `382a49da` — height 140→180, padding 22px, UTC label formatting to fix Apr 13/14 off-by-one
4. `1811ac49` — added max-value label + dashed gridline at ceiling so peaks read as "at max" not "clipped"
5. `bb2bbddc` — tried hardcoded Y-max at 120 (TJ asked)
6. `10b95517` — TJ pushed back: hardcoded ages badly. Replaced with `niceCeiling()` auto-scale (1.5x → round up to 1/1.5/2/2.5/3/4/5/6/8/10 × 10^n). Added 90ms ease-out CSS transitions on SVG hover elements + row action slide-in translate.
7. `d1cee83a` — **semantic split**: KPI shows needs-email count (time-bounded), chart shows ALL question volume. Single DB query, two metrics computed in memory.
8. `540825b3` — **linear interpolation** (dropped Fritsch-Carlson monotone cubic). Smooth curves created "upward inflection" illusion — user read intermediate Bezier y-values as data that didn't exist. Also bumped niceCeiling 1.5x → 1.75x for peaks in 40-55% zone. Default range "all" → "30d". Stroke 1.75→2.

**Design decisions locked in:**
- **Chart ≠ KPI** intentionally. KPI is action queue (needs-email). Chart is platform pulse (all activity). Two metrics on one card — contextualizes the number with volume context.
- **Linear over smooth.** Monotone cubic's S-shape between discrete daily buckets visually implies intermediate values that don't exist. Linear = most honest read of time-series. Matches Linear / Stripe / Datadog.
- **Nice-number Y-axis**, not fixed. Hardcoded ceilings don't age with growth. `niceCeiling(realMax)` rounds up to clean steps with 1.75x headroom → peaks always at 40-55% of chart.
- **Server buckets UTC days**, labels formatted in UTC to match. Admin chart represents UTC-day windows; admin user understands this.
- **Date range popover > multi-row chips.** One button, one popover. Presets list (all/today/yesterday/7d/30d/90d/1y) + stacked custom From/To at bottom of dropdown. Widened from w-72 to w-80 so From/To inputs don't overflow.

**Hover feel:**
- Chart hover dot + crosshair + tooltip all smooth-follow (90ms ease-out on SVG cx/cy/x1/x2 and HTML left/top)
- Row action buttons (Archive/Remove/Delete) slide in 4px from right on row hover (translate-x-1 → translate-x-0 + opacity, 200ms)
- Popover still hard appears — low priority

**Known cross-page inconsistency (not fixed):**
- Admin overview card "Needs Email: X" is all-time count
- `/admin/leads?tab=needs_email` now opens at last-30-days default
- Numbers will differ between the two views
- Fixes: either scope the overview card to 30d, or pass `?range=all` when navigating from overview. Awaiting TJ's call.

**Other known limits (not bugs today):**
- `.limit(50000)` with `ascending: true` means if platform ever has >50k questions/leads, we'd fetch the oldest 50k and miss recent. Olera is at ~1300 questions. Non-issue.
- Chart first-hover pops in instantly (no fade-in). Subsequent moves smooth. Acceptable.

**TJ said "I have a few things to add"** — next feedback loop incoming. Pausing here.

---

## Blocked / Needs Input

- ~~**Migration Playbook → Notion:**~~ ✅ Done (2026-03-01) — updated via Notion MCP
- ~~**Top 100 pages from Search Console:**~~ ✅ Done — GSC export analyzed, 0 404 risks found
- ~~**Editorial content redirect decision:**~~ ✅ Done — all v1.0 content routes now have redirects in `next.config.ts`: `/research-and-press/*` → homepage, `/caregiver-forum/*` → `/`, `/caregiver-relief-network/*` → homepage, `/company/*` → dedicated pages

---

## Next Up

0. **Merge PR #631** (`/pr-merge 631`) once preview eyeball confirms the lady's image frames cleanly across wide+narrow viewports. Branch: `feature/dashboard-compact-activity`. 13 commits total (7 foundation + 6 polish). Targets staging. CI green.
1. **MedJobs candidates detail page taste pass** — Apply warm surface + Perena-inspired styling to `/medjobs/candidates/[slug]` and `/provider/medjobs/candidates/[slug]`
2. **MedJobs provider onboarding flow** — Ensure MedJobs tab → browse → candidate detail → auth → contact is butter smooth end-to-end
3. **Enrichment questions after connection** — Add follow-up questions after seeker submits connection to feed into their profile (separate workstream from onboard redesign)
4. **De-jank provider transitions** — Airbnb-smooth state transitions across provider flows (notification → dashboard, claim → portal)
5. **SEO Action 1: City-specific content sections** — Add cost snapshot, "Paying for Care" module (waiver library links), city stats, FAQ section to browse pages
2. **SEO Action 2: Internal linking** — Link caregiver articles → city pages, waiver library → city pages, nearby city cross-links
3. **SEO Action 3: Structured data + meta** — FAQ schema, AggregateRating schema, cost/review-enriched meta descriptions
4. **SEO Action 4: More caregiver content** — 10-15 articles targeting financial/benefits queries (Medicare, Medicaid, cost guides)
5. **Merge PR #219** (waiver library redesign) — waiting on Chantel to remove `package.json.tmp` + `.mcp.json`
6. **Fix Supabase 1000-row limit** in provider sitemap shards (returns 1000 instead of 10,000)
7. **Debug auto-sign-in** — check `[OneClick]` console logs, fix background auth
8. **Phase 2: Activity Center PII tracking** — log "viewed_lead_pii" events, Slack alerts for sensitive interactions
9. **Unmask question/review content** on onboard notification cards (public data, no privacy concern)
10. **Delete fake seed connections** from Supabase (Sarah Reynolds, James Adeyemi, etc.)
11. **Run backfill script** for source_provider_id (dry-run first): `scripts/backfill-source-provider-id.js`
12. **Add `CLAIM_TOKEN_SECRET` env var** to Vercel (currently falls back to SUPABASE_SERVICE_ROLE_KEY)

---

## Decisions Made

| Date | Decision | Rationale |
| 2026-04-25 | Hero `backgroundSize` should track card height, not width | `cover` ties image scale to card *width*; wide viewports made the card shorter (content fit on fewer lines) and over-scaled the photo, chopping the face. `auto 150%` ties it to card height (locked at min 260px), so the face frames consistently at any width. |
| 2026-04-25 | Use `mask-image` over gradient overlays to fade image edges | Stacking more dark-gradient stops to "soften" the hero's left edge just shifts the inflection point — eye still reads it as a line. `mask-image` fades the photo's pixels themselves into the bg, so there's no rectangle edge to hide. |
| 2026-04-25 | Single "Get more reviews →" CTA over count-conditional copy | "Invite another review" vs "Invite a past client" was conditional logic doing more work than it earned. Both routes lead to the same destination; one label is cleaner. |
| 2026-04-25 | Traffic report link belongs at the bottom of the dashboard, not in the sidebar | Sidebar already shows the views number — a "See full traffic report" link directly under it was redundant. Relocating to the Email preferences card (with a divider) keeps the link discoverable without crowding the stat block. |
| 2026-03-28 | MedJobs candidates page is a search tool, not a gallery | Hiring is purposeful evaluation, not emotional discovery. Giant image blocks waste space when most students don't have photos. List rows let providers scan 8-10 candidates per screen vs 3. |
| 2026-03-28 | Any authenticated user sees contact info (not just providers) | Provider profile creation is progressive profiling, not a prerequisite. Gating on "is provider" after auth creates a second wall that breaks the onboarding flow. |
| 2026-03-28 | Infinite scroll over pagination buttons | Pagination feels dated and adds cognitive load. IntersectionObserver with 200px rootMargin pre-fetches the next batch before the user reaches bottom. Feels like Telegram. |
| 2026-03-28 | Onboard page is a platform showcase, not a profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." Profile completion is ONE compact card, not the entire page. |
| 2026-03-28 | Platform cards use router.push, not Link elements | Avoids DOM swap when isSignedIn changes (div→Link remount re-triggers animations). Single div with onClick handler works for both auth states. |
| 2026-03-28 | Guard isNotificationEntry on notificationData presence | ActionCard notification renders require data — without it, renders nothing. SmartDashboardShell must check `&& !!notificationData` before treating as notification entry. Falls back to verify-form. |
| 2026-03-28 | No new API endpoints for v1 of onboard redesign | Value cards use aspirational copy + existing provider data (google_reviews_data). Live counts (lead count in area, Q&A pending) are a fast follow once design is validated. |
| 2026-03-28 | Profile editing removed from onboard page | Wizard/inline editing moves to the portal Dashboard. Onboard page is the "lobby" — sells the vision. Portal is where they work. |
| 2026-03-28 | MedJobs card on onboard is placeholder for now | Feature is early, will be refined in next work session with proper data + design |
| 2026-03-27 | /welcome page must be static, not force-dynamic | Server component ran 3+ Supabase queries that always fail for guests (no session cookie). Blocked page render 2-3s + AuthProvider timeout 5s = 6-8s blank screen. Static page + client-side data fetching = instant render. |
| 2026-03-27 | Never gate /welcome page render on auth state | Connection card, step cards, greeting all work without auth. Auth resolving in background upgrades the UI (profile %, live status) but shouldn't block first paint. Show skeleton for async data, not a loading spinner for the whole page. |
| 2026-03-27 | Side-by-side card layout (square image) > landscape hero for provider cards | Landscape aspect ratio crops provider logos/photos badly — most provider images are logos or square portraits, not wide photos. Square image left + content right works for all image shapes. |
| 2026-03-27 | City page SEO = content depth + authority, not technical fixes | Pages rank 35-60 because they're thin provider lists on a new domain (DA ~5). Competitors have DA 60-75 and editorial city guides. On-page fixes → position 20-25; page 1 requires 3-6mo authority building from article strategy |
| 2026-03-27 | Waiver Library is the unique SEO weapon for city pages | Nobody else connects Medicaid waiver program data to city browse pages. "Paying for Care" module linking waiver library to city pages gives Google content it can't find elsewhere |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail Link Tracking Protection strips params named "token" (both click and copy). `otk` (one-time key) is not on Apple's strip list. This was the root cause of ~10 failed debugging rounds. |
| 2026-03-27 | One-click flow stays on onboard page, not redirect to Leads | The onboard page (notification card hero + dashboard) IS the intended landing. Redirecting to Leads table gives first-time providers nothing to trust. Trojan horse: lead hooks, dashboard sells. |
| 2026-03-27 | Never name URL params `token`, `session`, `key` in email links | Email clients (Apple Mail, Outlook, privacy extensions) strip params that look like auth credentials. Use abbreviations: `otk`, `sid`, `k`. |
| 2026-03-27 | Finalize claim BEFORE refreshAccountData in one-click flow | First-time providers have no account until finalize creates it. Refreshing before finalize returns empty profiles → downstream pages break. |
| 2026-03-27 | Use createAuthClient() (implicit flow) for server-generated verifyOtp | SSR browser client forces PKCE. Server-generated magic link tokens don't have a code_challenge. Must use implicit flow + session transfer. Pattern documented in lib/supabase/auth-client.ts. |
| 2026-03-27 | Fetch notification data server-side in validate-token | The connections table has RLS — unauthenticated browser client can't read it. Notification data must be fetched server-side (service role key) and returned with the token validation response. |
| 2026-03-27 | Notification card display must never depend on auth state | The notification card is the hook — it must render for unauthenticated providers. All data it needs must come from server-side APIs (validate-token), not client-side queries that require auth. |
| 2026-03-26 | Lead email is Trojan horse — dashboard is the product demo | Bare notification page would look like another lead-gen scam. Providers burned by APFM/Caring.com need to see the full platform (gallery, reviews, completeness) to believe Olera is real. Hero card hooks, dashboard below sells. |
| 2026-03-26 | Always mask seeker info on onboard page | `isSignedIn` doesn't mean verified owner of this listing. Protect seekers in case email goes to wrong recipient. First name only, no photo, city only, message truncated. Full info after claiming. |
| 2026-03-26 | Notification card overrides "already claimed" for email entry | Provider clicking email link and seeing "This listing is claimed — Dispute" is hostile. Show the lead/question/review preview instead, let them verify to respond. |
| 2026-03-26 | BP-only providers need slug-based fallback in claim check | Second claim check queries by source_provider_id, which is NULL for BP-only providers. Fallback query by slug catches them. |
| 2026-03-26 | Dark CTA buttons (bg-gray-900) for provider onboarding | Matches MedJobs aesthetic — calm confidence over teal SaaS template. Consistent across provider-facing surfaces. |
| 2026-03-26 | One-click email tokens for provider onboarding (Phase 2) | Email IS the verification — asking for OTP after they clicked the email is proving the same thing twice. Signed JWT in email link = one click from email to full portal access. Zero friction. |
| 2026-03-26 | Two tiers, not three: Full Access + Trusted | Full access via one-click token (everything including seeker PII). Trusted tier (phone call from Olera) only for destructive actions (delete listing, transfer ownership). Middle "Verified" tier was mud that solved a problem we don't have at current scale. |
| 2026-03-26 | Observability over gates for PII protection | At 5-10 leads/day with ~10% provider engagement, manual oversight is feasible. Activity Center + Slack alerts when provider views seeker PII. Human review, not software gates. Gates only when volume demands it. |
| 2026-03-26 | Phone call (not SMS OTP) for Trusted tier | Senior care providers are 60-70yo facility operators. SMS OTP = friction and confusion. Human phone call to business number = highest trust, zero tech friction, builds relationship. Rare actions only (~2-3/week). |
| 2026-03-26 | Questions and reviews don't need privacy masking | Q&A and reviews are already public on the provider page. Only leads contain private seeker PII. Showing full question/review text on onboard page is fine and more compelling. |
| 2026-03-25 | Full apply must retry account creation if apply-partial failed | Two-phase form (partial on step 1, full on step 4) means the full submit UPDATE path must check `account_id` and create auth+account if null. Silent try/catch in apply-partial hid the failure |
| 2026-03-25 | `hero_image_url` column doesn't exist in `olera-providers` | The set_hero action wrote to it but it was never added to the table schema. All references must use `select("*")` and guard with `"hero_image_url" in provider` |
| 2026-03-25 | Hover overlay > exposed pill buttons for image actions | Colored pills (yellow/red/green) below each image were visual noise. Dark gradient overlay with icon buttons on hover — images are content, buttons are tools |
| 2026-03-25 | Quick discovery mode (3 terms/category) is sufficient for batch | Standard mode (12 terms) costs 4x more but yields mostly duplicates. Quick found 16K+ providers across 78 cities for $100. After dedup/filter, same quality |
| 2026-03-25 | 4 parallel processing/enrichment batches for large batches | Single batch would take ~10hrs for 78 cities. 4 parallel batches cut to ~2.7hrs. Tradeoff: 6 Supabase timeouts from concurrent load (easy sequential retry) |
| 2026-03-25 | Cap parallel enrichment batches at 4 to avoid Supabase timeouts | 4 concurrent `enrich-city.js` processes cause occasional statement timeouts. 3-4 batches is the sweet spot for speed vs stability |
| 2026-03-25 | Place ID dedup before fuzzy dedup | Same place_id = same business (100% precision). Run this first to eliminate obvious dupes, then fuzzy catches the rest. Avoids fuzzy false positives on chains with similar names |
| 2026-03-25 | Claimed accounts get +1000 score in dedup — never deleted | 152 providers linked via business_profiles. Even if a claimed provider is the "worse" record, it has real account data tied to it. Always keep it |
|------|----------|-----------|
| 2026-03-24 | Highlights are earned, not defaulted — fewer honest > 4 generic | Every Home Care agency showed identical "In-Home Care, Certified Caregivers, Companionship, Light Housekeeping". Users see through it. 1 verified fact ("State Licensed") builds more trust than 4 templated labels |
| 2026-03-24 | Skip capability label on browse cards (skipCapability) | On a Home Care filtered page, showing "In-Home Care" as a highlight is tautological. Category already visible in card header line. Only show Tiers 1-4 (earned signals) on cards |
| 2026-03-24 | "Well Reviewed" at 4.0★/15+ reviews below "Highly Rated" at 4.5★/10+ | Binary "Highly Rated" was too exclusive — many good providers missed Tier 2. Second tier creates visible variety across cards |
| 2026-03-24 | Backfill trust signals for all 22K non-CMS providers (~$22) | Trust signals are the only differentiator for Home Care/Assisted Living/Memory Care/Independent Living (no CMS data). Pipeline already existed, just hadn't been run on pre-existing providers |
| 2026-03-24 | Don't send MedJobs students to Loops seeker audience | Adding students as seeker contacts enrolls them in Logan's care-seeker onboarding drip. Students get their own Resend email flow |
| 2026-03-24 | Collapse 15 acknowledgment checkboxes into single "I agree" | Wall of legal text killed momentum at step 4. Consolidated into 5 summary bullets + one toggle. Same legal coverage, 90% less friction |
| 2026-03-24 | Dark buttons (bg-gray-900) over teal for MedJobs apply | Calm confidence aesthetic. Teal felt like every SaaS template. Dark is quieter, more Linear/Notion |
| 2026-03-24 | Private storage bucket for student documents | Driver's license and car insurance are PII. Unlike profile photos (public), these must be access-controlled |
| 2026-03-24 | Use generateLink to resolve existing auth users | `listUsers` has no email filter in this Supabase version. `generateLink` always returns the user object, even for existing users — clean and efficient |
| 2026-03-24 | Early account creation after step 1, not step 4 | Capture the lead as soon as we have name+email. Students who abandon mid-form can be nudged back. Two-phase: partial on step 1, full update on step 4 |
| 2026-03-24 | Save step 1 data only, not progressive per-step (approach B) | Steps 2-3 (certifications, availability) are fast to re-fill. Simpler than PATCH-per-step. We capture the valuable lead data (name, email, phone, city, state) |
| 2026-03-24 | Auto-sign-in via dual magic link tokens | Generate two magic links: one for email (reusable), one consumed client-side via verifyOtp. Student gets a browser session without clicking the email, nav updates mid-form |
| 2026-03-24 | Dashboard as the canonical return destination | `/portal/medjobs` is the persistent home for students. All magic links, auth redirects, and success screens point here. No more URL-param-dependent flows |
| 2026-03-24 | Hide footer on MedJobs form pages | Senior care discovery footer is wrong context for student application. Apply, submit-video, and portal/medjobs get no footer |
| 2026-03-24 | Typeform hybrid: 4 sections + Typeform components | Pure one-question-per-screen (17 clicks) is friction disguised as simplicity. Keep grouped fields but bring Typeform-quality interactions: borderless inputs, custom dropdowns, letter-badged multi-selects, slide transitions |
| 2026-03-23 | Post-geocoding area check is required | 36/269 Ramapo providers geocoded outside the area — discovery assigns city=Ramapo to everything regardless of actual location. Must validate coordinates fall within ~0.5° of target city after geocoding |
| 2026-03-23 | Slugs must include city to avoid collisions | Many NY providers share names across cities. Slug format `{name}-{city}-{state}` prevents unique constraint violations |
| 2026-03-23 | Don't run google_reviews_data hydration and review snippets in parallel | Both write to the same JSONB column — race condition causes data loss. Run hydration first, then snippets |
| 2026-03-22 | Never store raw Google Places photo reference URLs | Raw `places.googleapis.com/v1/.../photos/...` URLs are ephemeral API resource paths requiring an API key. Must resolve to permanent `lh3.googleusercontent.com` URLs using `skipHttpRedirect=true` |
| 2026-03-22 | Jettison "Add Score" from city pipeline | olera_score/community_Score/value_score/information_availability_score are dead columns from the old Perplexity AI scoring system, removed in commit 302a4e5. New system uses Google Reviews + CMS data + AI Trust Signals |
| 2026-03-22 | Replace "Add Score" with "Hydrate Google Reviews Data" | New pipeline step populates google_reviews_data JSONB (rating, review_count, snippets) instead of the old proprietary scores |
| 2026-03-22 | AI Trust Signals run as part of city pipeline | Unified workflow: after upload, run /api/admin/verify-trust-signals for non-CMS categories in the target city |
| 2026-03-22 | AI classification required before upload | 32% of Bellevue discovery was garbage (Walmart, GameStop, Roto-Rooter). Keyword filtering misses most false positives. Perplexity AI classification costs ~$0.40 per city and catches everything |
| 2026-03-22 | Run enrichment steps in parallel | Post-upload steps (descriptions, reviews, trust signals, images, email) are independent — run concurrently with background tasks. TJ explicitly praised this approach |
| 2026-03-22 | Trust signals + CMS are display-only, not ranking | Current recommendation engine sorts exclusively by evidence density (google rating × log(review count)). Ranking enhancement is a separate Notion task for deep dive |
| 2026-03-13 | Form-first, voice-second in mode selection | Most users expect a form; voice is a differentiator but shouldn't be the default path |
| 2026-03-13 | Auth gate on bookmark only, not on results | Let users see value first → higher conversion. Bookmark is the natural auth moment |
| 2026-03-13 | Web Speech Synthesis API for TTS (no external service) | Free, built into all browsers, zero latency, no API key. Good enough for intake prompts |
| 2026-03-13 | Borrow Chantel's results page ideas, not her code | Her Lovable prototype has great UX patterns (financial impact, action plan, print) but needs to be rebuilt in our stack |
| 2026-03-13 | Progressive disclosure over report layout | Results page had 9 sections — overwhelming. Reduced to 3 beats: hero card, program list, tools. Document checklist behind toggle. |
| 2026-03-13 | "Recommended First Step" hero > Action Plan list | One specific program with call script > 5 programs in a numbered list. Reduces decision paralysis. |
| 2026-03-13 | Remove SaveResultsBanner from results | Show value first, ask later. Auth only on bookmark. Banner was the first thing users saw — wrong priority. |
| 2026-03-13 | Print expands everything via beforeprint event | Progressive disclosure is great for screen, bad for paper. JS listener overrides collapsed state during print. |
| 2026-03-05 | Flat `/provider/{slug}` URL is correct | v1.0 already used flat canonical URLs — no SEO trade-off in migration |
| 2026-03-05 | Gated provider portal → Esther | `/provider-portal/provider/{slug}/*` needs smart landing page, not just redirect. Critical for provider email funnel |
| 2026-03-02 | 16:9 primary featured image, 4 featured articles | 3:2 and 4:3 were too tall — pushed article grid below fold. 4 featured (1 large + 3 small) fills the right column without blank space |
| 2026-03-01 | Skip MedicalBusiness schema, revisit later | Low reward: Google doesn't render it differently than LocalBusiness. No concrete SERP benefit. Competitors don't use it either. |
| 2026-02-28 | CTA: quiet nudge over teal gradient banner | Strip template blobs, one warm heading, one button — calm confidence over SaaS shouting |
| 2026-02-28 | Community section in unified gray container | Docuseries + flat links felt unbounded; single bg-gray-100 rounded card groups them |
| 2026-02-28 | NIH badge: actual logo, compact, bottom-right hero | Real logo image inverted to white; tight but not cramped spacing |
| 2026-02-28 | Uniform grid over bento for Explore Care | Equal-weight cards feel less template-y; bento asymmetry was visual noise |
| 2026-02-28 | Remove social proof trust strip | Fake numbers add no trust; section added no user value |
| 2026-02-28 | Community as editorial + flat link rows | Perena-style flat rows over boxed cards; docuseries gets hero treatment, community links are quiet and scannable |
| 2026-02-28 | Default care type to Home Care | Most common search intent; was incorrectly defaulting to Home Health |
| 2026-02-28 | Self-host bento images over Unsplash | Remove external dependency; own the imagery |
| 2026-02-28 | BrowseCard (compact 310px) for all homepage cards | More providers in less space; save ProviderCard for browse/search pages |
| 2026-02-26 | Only TJ can merge to main/staging | Rulesets + merge-admins team. Prevents uncontrolled merges |
| 2026-02-26 | Content regression checks beyond git merge-base | Revert→re-apply cycles make commit topology misleading |
| 2026-02-26 | PR merge reports go to Notion | Automated reports for audit trail and team visibility |
| 2026-03-10 | Dynamic API route for sitemap, not metadata file | `app/sitemap.ts` is statically generated at build time — Supabase queries fail, empty result cached permanently. `app/api/sitemap/route.ts` with `force-dynamic` works correctly |
| 2026-03-10 | Rewrite `/sitemap.xml` → `/api/sitemap` | `app/[category]` dynamic route catches `sitemap.xml` as a category slug → 404. Rewrite in `next.config.ts` bypasses the route conflict |
| 2026-03-10 | Static OG image over dynamic ImageResponse | Shutterstock photo looks better than teal gradient text; static `.jpg` is simpler and faster |
| 2026-03-10 | Web Speech API + Deepgram fallback for voice | Web Speech API is free and covers ~75% of traffic (Chrome/Edge). Deepgram at $0.008/min covers Firefox + iOS Safari. Cheaper and simpler than a single paid provider for all traffic |
| 2026-03-10 | Keyword parser over LLM for voice interpretation | iOS VoiceIntentParser uses keyword matching and handles all edge cases. No need for Claude API — deterministic, instant, zero cost. LLM can be added later for Plan C conversational mode |
| 2026-03-10 | Mic per step, not separate voice mode | Keeps voice as an enhancement to the existing form. Users can mix voice and tap freely. Lower engineering cost than a full voice overlay (Plan B) |
| 2026-03-10 | Voice on all 6 steps, not just text inputs | Even pill-select steps (care preference, needs, income, Medicaid) benefit from voice — "help with bathing and cooking" is natural speech that maps cleanly to pills |
| 2026-03-10 | Labeled pill over bare icon for voice button | Bare 40x40 gray circle has zero affordance — users won't discover it. Labeled pill with "Speak" text is discoverable without being pushy |
| 2026-03-10 | Teal listening state over red | Red = error/danger in every mental model. Teal (brand color) signals "active" with calm confidence |
| 2026-03-10 | Voice below options, not above | Voice is a secondary input method. Below the primary interaction (input/pills) communicates "or you can speak" without competing with the primary path |
| 2026-03-10 | City search over ZIP-only for voice | Users naturally say "I live in Katy Texas" not "seven seven four four nine". Reuse existing 18K city search infra with state name extraction. ZIP still works if spoken |
| 2026-03-10 | Auto-retry on audio-capture mic error | Chrome's Web Speech API flakes on mic access — abort→start race condition. One silent 500ms retry resolves most transient failures |
| 2026-02-21 | Server-side pagination for directory | 36K+ records — must use Supabase `.range()` |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-04-25 — Wispr-style polish loop on PR #631

Six commits added on top of `feature/dashboard-compact-activity`:

**Hero photo framing (3 commits)** — Started with a `min-h-[260px]` + vertical-anchor tweak (`e77d4272`) that didn't fully fix the issue. After deeper analysis, swapped `backgroundSize: cover` → `auto 150%` so image size tracks card *height* not width (`c00ffc6d`). Final touch: `mask-image` to fade the photo's left edge into warm-950, eliminating the visible rectangle edge (`0b684491`).

**Sidebar simplification (2 commits)** — Collapsed count-conditional review CTA into single "Get more reviews →" (`9735995b`), removed redundant "See full traffic report →" link sitting directly under the views number (`8ef69e3e`).

**Bottom-section relocation (1 commit)** — Added the traffic report link to the Email preferences card with a hairline divider (`edaeffce`).

Pre-test pass came back clean. PR #631 ready for merge.

Files touched:
- `components/provider-dashboard/v2/DashboardHero.tsx` — image sizing/positioning, mask
- `components/provider-dashboard/v2/SidebarSummary.tsx` — review CTA, removed link
- `components/provider-dashboard/DashboardPage.tsx` — added link to NotificationPreferencesCard

**End-of-session question — already addressed:** TJ asked "how do we make the lady's image always show like the compressed view?" comparing wide-viewport vs narrow-viewport renders. The fix was already in commit `c00ffc6d` (`backgroundSize: auto 150%`) which ties image scale to the card's height (locked at `min-h-[260px]`) instead of its width — so the face frames consistently regardless of viewport. Worth eyeballing on the latest preview to confirm the fix landed as intended; if the framing still drifts at extreme widths, next move is to nudge `backgroundPosition` percentage (currently `right 35%`).

