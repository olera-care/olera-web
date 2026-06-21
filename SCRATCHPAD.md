# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-04.md`

---

## Current Focus

### 2026-06-21 — Franchil managed-ads activation: real campaign performance to provider + admin (branch `smart-hopper`, PRs #1161/#1163 → SHIPPED TO PROD)

> **UPDATE (PM):** Shipped to prod (#1161 → staging, #1163 staging→main, main `f5a85d05`). **Google Search campaign published live** with TJ (click-by-click): Search-only (Display + partners off), $50 total-budget cap, Killeen 20mi, EN+ES, 8 phrase-match keywords + 9 negatives, tagged Final URL, Maximize-clicks $2.50 cap — now in Google policy review. Tracking is wired end-to-end (provider `/provider/boost` panel + admin `/admin/ad-boost` parity). **Phase 2 queued as 3 Web App board tasks:** (1) clean multi-provider UTM attribution on `connection_sent` [P2], (2) backfill Franchil null lat/lng [P2], (3) conversion-rate estimate in budget step [P3]. Only open item: ads flip from "under review" → "Eligible" (Google's call).

First real provider through Find Families → Managed Ads (Franchil LLC, Killeen TX) needed her ads live by 6/22 + a self-serve view of visits + conversions. Deep investigation reframed the whole problem before any code.

**Key findings (the "aha"s):**
- **Attribution was wired to the wrong event.** The Ad Boost "delivered" count reads `benefits_completed` (UTM-tagged) — but the live provider page rarely shows the benefits flow. The page runs TWO live A/B systems: intake variant (`empathic` 60% benefits / `outreach` 20% / `qa_email_capture` 20%) + CTA variant (`legacy` 100%). The **real conversion is the legacy CTA** (`lead_received` / `connection_sent`), which carries **no UTM** and was never counted. Admin CTA funnel confirms it: legacy CTA 3936 impressions → 81–88 leads/wk (~2%). So `delivered` would show "0 forever" while real leads arrive.
- **The $422 in Google Ads is historical/paused, not live spend** (account banner: "none of your ads are running"). No live waste — wire + optimize before re-enabling.
- **Lead delivery to Hilda verified GREEN:** awaited email (ZeroBounce `valid`), SMS, unconditional `/provider/connections` visibility, full contact (she's verified). Not suppressed; `leads_unsubscribed` unset.

**Built (PR #1161, code-clean tsc, validated vs real data — 8 page-views→5 deduped sessions):**
- `getCampaignStats()` in `lib/ad-boost/delivered.server.ts` — real **Visitors** (session-deduped `page_view`) + **Leads** (`lead_received`) on the provider's page since launch. Reads `provider_activity`; **does NOT touch `/api/connections/request`** (the critical leads route).
- Provider self-serve panel: `CampaignInMotion` (`/provider/boost`) now shows Visitors / Leads / Conversion (capped 100%, honest empty state).
- Admin parity: "What the provider sees" panel on `/admin/ad-boost/[id]` — identical numbers via the same reader.
- Single-provider attribution by approximation (her ~0 organic baseline) — no UTM refactor needed for one provider; that's the multi-provider Phase 2.

**Ops done:** Franchil campaign row flipped `status=live`, `campaign_tag=franchil-killeen-jun26`, `channel=google`. Ad-ops package handed to TJ (UTM URL `…/provider/franchil-llc-killeen-tx-o4iq?utm_source=olera_managed&utm_campaign=franchil-killeen-jun26`, Killeen-radius keywords, copy). Decision: **$50 intro on Google Search only** (skip Meta at this budget).

**Decisions:** measure-then-optimize (no bespoke landing page); attribution fix is the real lever, arm-pinning + UTM-threading deferred to Phase 2 (touches the critical leads route — not under a deadline); concierge-manual ad setup stays (no Google/Meta API).

**Next up:** (1) Merge #1161 → staging → QA on `staging-olera2-web.vercel.app` → promote to main (panel is NOT live in prod until deployed; only the DB row is flipped). (2) TJ enables the Google campaign at the tagged URL. (3) Phase 2: thread UTM into `connection_sent`/`question_asked` + extend `delivered.server.ts` to count `connection_sent` (clean multi-provider attribution); backfill Franchil's null `lat/lng` (breaks organic Find Families matching). (4) Conversion-rate-as-expectation in the budget step (~2% impression→lead, cold-traffic caveat). Notion handoff: `Managed Ads — Franchil campaign activation` (needs rewrite with corrected CTA-not-benefits architecture).

### 2026-06-21 — Email arc wrap-up: Ticket 2 promoted, Loops retired, architecture documented (all in prod)

Closed the email/Questions arc end-to-end. Everything below is **in production**.

**Shipped to prod:**
- **Ticket 2 promoted** (#1154 → #1157) — provider-level "Archive provider" on `/admin/questions` is live.
- **Loops RETIRED** (#1158 → #1159) — `LOOPS_ENABLED` flag in `lib/loops.ts` defaults off; app pushes no events/contacts to Loops. TJ paused all Loops campaigns dashboard-side same day. Resend is now the single email system. Kills double-sends + `oleracare.com` complaint/ToS exposure.
- **`/test-instructions`** (#1155) + scratchpad (#1156) promoted.

**Investigation (no code, informed decisions):**
- **"Separate Resend accounts?" → NO.** Only benefit is suspension blast-radius isolation, already mitigated: verification holds rates, true cold is off Resend (Smartlead), cockpit surfaces trouble at half the limit. Confirmed via Resend dashboard: ONE account ("olera Pro"), two verified root domains (`olera.care` + `oleracare.com`).
- **Loops audit:** every active Loops trigger had a Resend twin already sending; Loops' own lifecycle groups (Onboarding/Retention/Reengagement) were empty. Loops was stale duplicates → safe to retire.
- **Deliverability instrumentation is LIVE** (the May "0%/blind" note was stale): Resend webhook → `email_events` → `/admin/automations` cockpit vs `lib/email-thresholds.ts`. 30-day: **bounce 1.99%, complaint 0.0433%** — under hard lines, near yellow.

**Decisions:** Loops retired (not just paused — code-gated too); no separate Resend account; role-address `effectiveStatus` handling documented as canonical.

**Comms + docs:** Slack note to #ai-product-development (Graize/Cess/Esther) with the go-forward rule (Archive=disinterest, not REMOVE; email issues = add/override real address). Notion handoff fully rewritten as the journey record + role-email reference. New memory `project_email_architecture.md` (current canonical) + reframed `project_email_deliverability.md` as history.

**Open tail (small):** (1) Step 2 lane split — `PROVIDER_NOTIFY_FROM`/`oleracare.com` already live but same Resend account (no account isolation); weekly-digest carve-out in `lib/email.ts` is load-bearing, don't remove. (2) `new_verification (import)` Loops campaign (~5,331 cold sends) now dark — move to Smartlead if it's a recurring funnel. (3) optional flush-endpoint throttle (~4/sec).

### 2026-06-20 — Ticket 2: provider-level archive for Questions queue + `/test-instructions` command (PR #1154 merged→staging; PR #1155 open)

**Trigger:** The email-hygiene thread's original ask ("Ticket 2"). The QA team (Graize/Cess) kept re-clearing new questions for providers they'd decided to stop working — a treadmill. Per-question archive existed; provider-level did not, and the submission path only skipped the *email* for `admin_archived` providers (still inserted a `pending` row), so the queue refilled.

**Shipped — #1154 (merged to staging, QA'd, NOT yet on main):**
- New `archived_question_providers` table (migration 114), keyed by literal `provider_id` — covers olera-providers-only providers (no metadata column). **Q&A-scoped:** does NOT touch `admin_archived`, so nudges/leads/connections untouched. Reversible.
- `app/api/admin/questions/archive-provider/route.ts` (POST+GET): resolves id variants, upserts suppression rows, bulk-archives existing open questions (metadata merged, not clobbered), audit-logs; `?unarchive=1` reverses.
- `app/api/questions/route.ts`: pre-insert suppression lookup → archived providers' new questions land `status=archived, is_public=false`, no email/needs-email flag. **Fails open** if table absent.
- `app/admin/questions/page.tsx`: per-provider "Archive provider" action + confirmation modal.

**Shipped — #1155 (open):** `/test-instructions` command — manual-QA-checklist generator, the human-facing complement to `/pre-test`. Lives BOTH global (`~/.claude/skills/test-instructions/SKILL.md`) and in-repo (`.claude/commands/test-instructions.md`, team-shared).

**Validation:** tsc 0; live service-role probe of the new table (SELECT/UPSERT/maybeSingle/DELETE) passed; migration 029 confirms `archived` in the status CHECK; **migration 114 applied to the shared Supabase**. End-to-end QA on staging: bulk-clear verified via UI + DB (3 sample questions → archived); suppression row armed. Sample data seeded then fully cleaned up.

**Decisions:** Q&A-scoped archive (not full `admin_archived`) — chosen for blast radius (QA clearing their queue must not sever a live provider's lead pipeline) and because olera-providers has no metadata column to hang a flag on. `/test-instructions` placed globally AND in-repo per TJ. Two intentional non-bugs: archived providers' askers still get the "submitted" confirmation; internal Slack "question asked" alert still fires (only the provider *email* is suppressed).

**Next up:**
- Merge #1155 to staging (awaiting TJ go).
- `/promote-to-main` to ship #1154 (+#1155 if merged) to production (awaiting TJ go).
- **Step 2 — lane split** (`PROVIDER_NOTIFY_FROM`): verify the cousin domain is a separate Resend reputation unit before flipping it on. The weekly-digest carve-out in the send gate depends on this staying OFF until verified — do not remove that carve-out first.

### 2026-06-18 — De-"host" copy + MedJobs admin reorg + flyer floor (branch `claude/keen-mendel-6i8iW`)

**Trigger:** Logan — (1) "host" was vestigial internship language; students are now in a regular paid placement where the family/agency is the employer. (2) Simplify the MedJobs admin sidebar and split the dual-purpose Prospects surface by audience. (3) The "no student flyer configured" launch blocker.

**Shipped on branch (6 chunks, each tsc + lint clean):**
- **De-host pass:** "host" → "employer" (formal) / "the family or agency" (warm) across agreements, emails, UI; renamed agreement PDFs → `employer-agreement(-sample).pdf` (regenerated); `HOST_AGREEMENT_URL` → `EMPLOYER_AGREEMENT_URL`; "Offer to host" → "Offer to hire". (Earlier commit set.)
- **Chunk 1 — flyer floor:** `GENERIC_PROVIDER` brochure + `resolveProgramPdfConfig` fallback; program-pdf route serves generic on a miss; `requireProgramPdf` + preflight modal honor the floor (red block → soft "standard flyer" note); Resend attachment renders generic when no campus config. Removes the launch-blocking flyer error.
- **Chunk 2 (collapsed):** no new metric split needed — `prospects_added` is already partner-only; provider prospects are virtual/no-history (count-only). Subtype breakdown handled in the Operations summary endpoint.
- **Chunk 3 — In Basket audience queues:** new `providers` + `partner_book` tabs fold each audience's prospecting + active work (sectioned); server-composed `counts.providers`/`counts.partner_book`; per-section card-slot dispatch; old keys retained for dedicated pages/queue/deep links. **Needs browser QA.**
- **Chunk 4 — Operations hub:** `/admin/medjobs/operations` with Pipeline/Activity/Roster tiles (headline + delta + sparkline + View all). New `operations-summary` endpoint (provider count + partner subtype breakdowns); clients/candidates counts reused from their endpoints to avoid drift.
- **Chunk 5 — sidebar:** collapsed to In Basket · Sites · Operations · Logs.
- **Plan + pre-build risk review:** `plans/medjobs-nav-operations-flyer-plan.md`.

**Validation:** `npx tsc --noEmit` clean; eslint clean on all 31 changed files. `next build` blocked only by sandbox Google-Fonts fetch (env, unrelated).

**QA next (before promote):** Click-test the In Basket Providers/Partners tabs (both sections render, counts/bolding/auto-pivot correct, drawers open, slot actions right per section); Operations tiles load + links land on the right pages; launch outreach for a campus with no config and confirm the standard flyer attaches/links (no block).

### 2026-06-18 — Managed ads conversion + A/B test (branch `codex/managed-ads-conversion`)

**Trigger:** TJ wanted to move providers from impressions to real managed-ads signups, then previewed the copy and asked for a sharper testable path. Later asked to adopt the richer design critique slash-command wrapper from the staging repo.

**Shipped on branch:**
- Reframed managed ads across provider surfaces around a clearer external-ads promise: ads run on Google/Meta/local channels, families land on the provider's Olera page, provider picks timing/budget.
- Added local-demand context to `/provider/boost` and managed-ads tracking/Slack metadata; fixed the category namespace issue in `app/api/provider/ad-boost/request/route.ts`.
- Added provider-level managed-ads pitch A/B test instrumentation: `direct_reach` vs `local_plan`, deterministic assignment, event metadata, variant copy helpers, admin allocation controls, and Analytics funnel card (`Shown -> Clicked -> Viewed Plan -> Requested`).
- Added migration `supabase/migrations/111_managed_ads_pitch_variant_experiment.sql` to seed `managed_ads_pitch_variant` 50/50 and register `managed_ads_pitch_viewed` while preserving existing provider-event CHECK values.
- Sharpened the `local_plan` variant after preview feedback: headline now reads "Send local families straight to your page" with body copy that says exactly what happens.
- Added `.agents/skills/design-improvements/SKILL.md` so Codex can invoke the richer `/design-improvements` Claude command workflow; also copied it to the user-level skills folder.

**Validation:** `npx --no-install tsc --noEmit` and `git diff --check` passed during build. Re-run once more in quicksave before PR. No cron/automation code changed.

**QA next:** Apply migration 111, then preview `/provider/boost?preview_managed_ads=direct_reach` and `/provider/boost?preview_managed_ads=local_plan`; verify `/admin/analytics` Managed Ads Variants allocation/funnel; click through dashboard/Find Families nudges and confirm `managed_ads_pitch_viewed`, click, boost-view, and request events carry variant + market metadata.

### 2026-06-18 — Fix post-sign-in "Sign in required" flash + close 2 stale Notion cards (`/dejank` → `/pre-test`, branch `eager-newton`, PR #1114 → staging)

**Trigger:** TJ reported jank signing into the provider portal — after sign-in he'd first see the "Sign in required" gate, then the real Profile page after a refresh (sometimes auto-refreshing). Plus two "validate before building" passes on Notion cards.

**Main fix (`/dejank`, PR #1114):** classic state-setter race.
- **Root cause:** every sign-in path does `await refreshAccountData(userId)` then navigates, but `refreshAccountData` set `account` + `isLoading:false` and **never set `user`**. `user` was set *only* by the async `SIGNED_IN` event handler. When `SIGNED_IN` landed after navigation, the gate (`app/provider/layout.tsx:65`, and `RoleGate`) saw account-loaded-but-user-null → rendered "Sign in required" until the event fired and re-rendered (the perceived "auto-refresh").
- **Fix:** set `user` atomically with `account`. `refreshAccountData(userId, overrideUser?)` now sets both in one `setState`; the 3 modal sign-in methods (password/passkey/OTP) pass the verified user via a new `toAuthUser()` helper. No-arg callers preserve `prev.user` (background refreshes unaffected). Fixes all sign-in methods + `RoleGate` at once. OAuth/magic-link were already fine (full reload re-bootstraps via `init()`).
- **Files:** `components/auth/AuthProvider.tsx`, `components/auth/UnifiedAuthModal.tsx` (+34/−5).
- **`/pre-test`:** clean — traced both version-counter interleavings between `refreshAccountData` and the `SIGNED_IN` handler; no flash in either (worst case = correct brief spinner). Confirmed `createClient()` is a singleton (the assumption the fix rests on). tsc clean.

**Two Notion cards validated + CLOSED (no build):**
1. **Email pre-verification cron + cold-lane suppression** — already shipped in PR #1096 (staging+main, same day card was filed). Pulled bounce data from `email_log`: account-wide **3.40%/60d, falling to 1.91%/7d** (under Resend's 4%); `oleracare.com` 3.08%→0/178 post-deploy; `question_received` 7.99%→0/20 post. Lever 4 (TTL re-verify) not warranted. CAVEAT: post-deploy window ~1d, weekly digest burst not yet fired — re-check after next digest.
2. **Add ISR to benefits routes** — closed as won't-do/mis-scoped. Benefits content is committed TS (`pipeline-drafts.ts`/`waiver-library.ts`), not a runtime store, so "edit content → rebuild one page" is unachievable with ISR alone (every fix triggers a full rebuild regardless). Real (narrower) win = lazy SSG to cap build time at ~2,400 pages, premature until build time is a measured problem. Reopen trigger noted on card.

**Run-env note:** worktree had no `node_modules`; symlinked from `~/Desktop/olera-web` (+ `.env.local`) to run tsc against current files instead of copying into the stale Desktop checkout. SCRATCHPAD updated off fresh staging (this branch) per `feedback_scratchpad_out_of_code_prs`.

**NEXT:** TJ to sign in as a provider on the PR #1114 preview to confirm the flash is gone (not yet exercised on a live deploy). Then merge #1114. After next weekly digest fires, re-check `email_log` bounce by lane to confirm the deliverability fix held under burst load.

### 2026-06-18 — Organic-traffic explainer for marketing team (no code; analysis + Slack memo + memory)

**Trigger:** Logan asked "other reasons behind the increase in our traffic." TJ wanted a thorough, code-grounded analysis to relay to the team.

**Method:** Fanned out 4 parallel agents over the codebase + git history, then dug into the repo's GSC exports directly (`docs/https___olera.care_-Coverage-Drilldown-2026-05-19/Chart.csv`, `docs/SEO Reports/.../Performance-on-Search-2026-03-27/`, and the `-2026-03-08/` Pages/Queries CSVs). Verified claims against real data instead of asserting.

**Key findings (data-grounded):**
- **Recovery, not pure growth:** the fast 4-wk climb is mostly the Vercel WAF region-block fix (403'd Googlebot ~Apr 9→mid-May) + `/review/*` noindex (PR #771, ~55% of the "crawled not indexed" bucket). Bucket doubled 31K→66K Apr 9→May 14, tracking city-pipeline thin-page growth.
- **Benefits/insurance editorial is the organic engine.** March GSC top non-brand pages = Logan's VA-caregiver-assessment (399 clicks, pos 4.9) + BCBS-caregiver (238, pos 3.6). Chantel's TX benefits cluster (published Mar 30–May 26, so NOT in the repo's March exports — her real numbers live only in the live `/seo` thread) extends the proven shape; 640-page Senior Benefits Finder = breadth.
- **Provider directory is an organic non-entity:** not 1 page in top 50; head terms ~pos 40. The 21K description rewrite was a wash because at pos ~40 CTR is ranking-bound, not copy-bound.

**Forward direction captured (TJ, this session):** next technical-cleanup focus pivots to provider pages — category-tailored first-principles rebuild FIRST, then drive UGC completion (owner section, about, photos). Sequencing deliberate: page first so UGC lands on a page built to perform. Saved to memory `project_provider_page_seo_optimization` (+ index).

**Shipped:** memo posted to **#marketing-team** (cc Chantel + Logan) via `/slack-notes`. Iterated heavily with TJ on framing — killed the "correcting our prior mistakes" spine, rebalanced so benefits content is a bright-spot-to-lean-into (not a pivot), fixed attribution (VA/BCBS = Logan's, not Chantel's).

**NEXT (open, both quick GSC pulls):** (1) clicks 28d-before-Apr-9 vs latest-28d to confirm *above* baseline vs merely recovered; (2) Chantel's six TX URLs' current clicks/impressions to quantify her contribution (offered to post a follow-up in-thread once TJ supplies them).

### 2026-06-18 — Benefits program page: single layout spine (`/design-improvements` → `/punch`, branch `sparky-noether`, PR #1109 → staging)

**Trigger:** TJ ran `/design-improvements` on a desktop full-page capture of `/benefits/texas/star-plus-medicaid-hcbs`. Phase 1 diagnosis surfaced 4 findings; TJ picked **#1, the layout spine alignment** to execute via `/punch`.

**Root cause:** On `xl` benefit pages the hero (`max-w-2xl mx-auto`, centers in full viewport) and the body+rail (separate `xl:max-w-[84rem]` flex, content centered in a ~60rem `flex-1`) hung off **three different centering axes**. The H1 and body left edges didn't match, and the sticky "Could you qualify?" card floated with a ~12rem dead gulf beside the content.

**Fix (`components/waiver-library/ProgramPageV3.tsx`, +13/−5, 4 surgical `xl:`-gated edits):**
1. Container `xl:max-w-[84rem] gap-12` → `[69rem] gap-10` — `flex-1` now lands at the readable ~41.5rem so content *fills* its column (no gulf, no inter-section wander).
2. Hero wrapped in the same two-column frame + a `21rem` reserved rail column (only when `showBenefitsCTA`), so the H1 shares the body's left gutter.
3. Section nav (`SectionNav` got a `hasRail` prop) gets the same frame — full-width sticky bar preserved, pills shift to the content gutter.
4. All gated on `showBenefitsCTA` + `xl:` — resource/navigator (no-rail) pages stay viewport-centered; below-xl is byte-identical to before.

**Verified:** `/pre-test` traced all 4 breakpoint×rail states — hero/body/nav/card share one left gutter in the rail case (math: both `flex-1` text-left = `container_left + 4rem`), viewport-centered in the no-rail case, original below xl. tsc clean (0). Key alignment math holds to the pixel because hero `flex-1` carries `px-6 lg:px-8` matching the body section gutter, and both `flex-1`s are the same width.

**Disclosed tradeoff (not a bug):** the `max-w-5xl` service-area map clamps to the column on xl-rail pages → tighter 2-up grid. But `draftToWaiverProgram` (page.tsx) never maps `serviceAreas`, so draft-based pages (e.g. TX STAR+PLUS) render no map at all; only rarer waiver-library base programs are affected.

**NEXT:** TJ to eyeball the Vercel preview at **≥1280px** (xl breakpoint — won't show on mobile), confirm one clean column, then merge #1109. Remaining `/design-improvements` findings if he wants more: #2 elevate the conversion card, #3 de-template "What's covered" (both `/punch`), #4 mobile container discipline (`/mobilize`, needs a 375px shot).

### 2026-06-17 — Design slash-command family: improve `/ui-critique` + add `/design-improvements` master (branch `graceful-mcclintock`)

**Trigger:** TJ compared `/ui-critique` against `/punch` and asked where it could improve, then to fold in `/mobilize`, then to build a master command stringing them together.

**Changes (`.claude/commands/`, tooling — no product code):**
- **`ui-critique.md` (modified):** grafted `/punch`'s mandatory inspiration-folder study + anti-anchor rule (was a static brand-name prose list, no real frames); added a "Read the component" section (screenshot shows one state, code shows all — empty/loading/error); added a **Mobile/Responsive lens** (375px, tap targets, container discipline) that hands off to `/mobilize` instead of duplicating its 7 lenses; fixed positioning (diagnoses-not-builds, routes to `/punch` or `/mobilize`); killed the hardcoded "they mentioned having ideas" line.
- **`design-improvements.md` (NEW):** master orchestrator. **Reads each sub-command file at runtime** (DRY — doesn't duplicate their logic, so it never goes stale). Pipeline `ui-critique → punch → mobilize → dejank → verify` (order deliberate: shape→mobile→motion). Phase 2 triages findings into lanes + asks TJ for scope before executing; honors each sub's own confirmation gates; verify once at the end via Vercel preview.

**Command family now:** `/ui-critique` (diagnose, no build) → `/punch` (boldness/copy), `/mobilize` (mobile, waits), `/dejank` (motion). `/design-improvements` conducts all four.

**`/pre-test`:** caught 1 real bug — `design-improvements` claimed "all four share the same inspiration folder + anti-anchor rule"; verified false (dejank is a console/state-tracing motion tool, reads no folder; mobilize has no formal anti-anchor rule + uses a 2nd folder). Scoped the claim to the 3 aesthetic lanes. Fixed. Inspiration folder + all 4 command paths confirmed on disk.

**NEXT:** none required — self-contained tooling change. PR to staging.

### 2026-06-17 — Author byline on all weekly-digest variants (branch `good-pasteur`, PR #1093 → staging)

**Trigger:** TJ noticed the "About the Author" trust byline (photo + "Olera is built by Dr. Logan DuBose … and TJ Falohun …") shipped on only some weekly-digest variants. Audit → game plan → build.

**Audit:** byline on **3 of 8** variants as **three drifting copies** — `managed_ads` (inline), `referral_teaser` (`referralTeaserTrustBlock`, richer "Why Olera maps this"), `cold_rank_note` (deliberate Logan-only CRO sig). One copy had a wrong WAF-blocked `olera.care/images` photo URL. **5 bare:** `family_question`, `leads_recap`, `market_rank_digest`, `weekly_digest_plain`, `completion_nudge`.

**Built (`lib/email-templates.tsx`):** new `authorBylineBlock({topBorder?,heading?,tail?})` helper = one source of truth (Supabase-hosted photo — olera.care/images is WAF-challenged in email). Added to all 5 bare variants; refactored `managed_ads` + `referral_teaser` onto it; left `cold_rank_note` alone. `/pre-test` = clean (balanced HTML all 3 shapes, 0 tsc errors, no signature changes). Commit `dc91d3a7`, **PR #1093 → staging**.

**NEXT (in progress):** move outbound weekly-digest sends **off `olera.care`** to a cousin domain to protect the crown-jewel domain from bounce/reputation damage — auditing send-from wiring + path forward. See [[project_email_deliverability]] (three-tier domains; provider-notify domain split shipped via PR #860, env-gated).

### 2026-06-17 — June 16 mega-meeting → per-team brief in Notion (no code)

Read the **full transcript** (not just the auto-summary) of the June 16 "Careshifts (Chantel Workflow Integration) & Olera Product Development Meeting" and split it into 3 copy-paste team chunks (metrics + summary + action items): **(1) CareShifts** (Chantel onboarding to staging/main cadence; ~50–60% reusable from MedJobs; Approach A student/internship pipeline vs B recruit-10-vetted-caregivers fork), **(2) Eng & Ops** (provider email bouncing on leads/Daily Digest; claimed-provider email-change-overrides-verification security hole, editing temp-disabled; first-ever paying customer re-engaged), **(3) Marketing/SEO** (4-wk WoW organic uptrend, provider pages 90%/benefits #2/blogs punch above weight; Instagram CTA → move to FB ads; editorial = Cess audits→Logan rewrites; provider-page UGC/category levers **deferred 2–4wk** until MVPs stabilize). Notion brief: `3825903a-0ffe-8182-9f92-c39617e1f01b` (child of meeting note `3815903a-0ffe-8019-…`). Name fix: transcript "Seth"→**Cess**, "Gracie/Greasy"→**Graize**. TJ distributed chunks to #marketing-team + #ai-product-development. No repo changes.

### 2026-06-16 — First managed-ads conversion (Franchil) + Ad Boost admin overhaul (branch `adboost-admin-delete`, PR #1073)

**Trigger:** Franchil LLC (Killeen TX home-care, self-serve signup 6/11, 95% complete, 0 organic leads) became the **first real managed-ads concierge conversion** — submitted a Google+Meta request, setup week 6/22. Sparked two threads.

**Thread 1 — Franchil outreach + terms (PR #1072, MERGED to staging; TJ promoted staging→main separately).**
- Drafted the outreach email to Hilda Boiwo → **Notion page** under "Olera Pro 2.0 / monetization exploration" (`3815903a…`). Iterations: dropped "you're our first" framing (reads as untested), reframed $50 as no-risk "to get you started," **killed the meeting ask** → one-reply "go" close ($50 starter run needs no budget decision; budget convo deferred to after results).
- **New hosted T&C page `/managed-ads-terms`** (`app/managed-ads-terms/page.tsx`, noindex, reuses `LegalPageLayout`) — email links to it instead of pasting terms inline. Covers: claimed+consenting only, campaigns on Olera's own accounts→own page, **no guaranteed results**, leads stay provider's/no commission, cancel anytime, TX law. Pressure-tested the legal model (own-page + consent = clean; counsel sign-off + fee-vs-at-cost decision flagged before scaling).

**Thread 2 — Ad Boost admin queue rebuilt (PR #1073, branch `adboost-admin-delete`, NOT yet merged).** Files: `app/admin/ad-boost/page.tsx` (list), `app/admin/ad-boost/[id]/page.tsx` (NEW detail), `app/api/admin/ad-boost/route.ts`, `components/admin/AdBoostShared.tsx` (NEW shared), `lib/ad-boost/delivered.server.ts`, migrations 108+109.
- **Delete + soft-delete/archive.** Hard delete (test scrub) + reversible archive (`deleted_at`) for real providers. Active/Archived tabs w/ counts. Migration **108** (`deleted_at`) — APPLIED.
- **List redesigned** from sloppy stacked form-cards → dense 3-column triage table (Provider · Status · Setup week + Archive/Delete), fixed-width cols (fixed an `auto`-last-column misalignment bug), sorted by setup week asc, channel as subline tag, inline edit removed. Date formatting unified + local-parse fix (UTC off-by-one).
- **Per-campaign detail page** (provider name → `/admin/ad-boost/[id]`): Campaign setup (status/channel/setup-week/tag/note + UTM URL), **Leads** (real benefits_completed families attributed by utm_campaign, no PHI — care need/state/date), **Performance** (delivered + manual spend/clicks entry → cost-per-family computed; migration **109** `ad_spend_cents`/`ad_clicks` — APPLIED), Manage (archive/delete). Header "View provider record" → `/admin/directory/[providerId]` (admin record w/ comms timeline), not bare public page.
- **`/code-review` (high effort, 8 angles): clean** — no reachable correctness bugs. Survivors all low: optional race-guard on detail fetch (practically unreachable), `Number.isFinite` spend hardening (devtools-only), duplicated archive/delete handlers (could be a hook). tsc clean throughout.

**Thread 2 update (PM) — all merged + a reconcile.** `/pr-merge` landed **#1073** (Ad Boost rework) and **#1076** to staging. **#1056** (`fix-boost-gallery-completeness`, a parallel session) came up for merge but was 68 commits behind and diverged on the now-rewritten `page.tsx`+`route.ts` with a redundant admin-delete → **reconciled**: cherry-picked only its still-current completeness work (`scoreGallery` 3-photos→100, `scorePricing` decision-not-a-wall, eligibility remaining-impact sort, EditPricingModal copy) into **#1076** off fresh staging; **#1056 CLOSED**. Skipped the 2 optional hardenings (review was clean). Migrations 108+109 applied. Notion PR-merge reports filed for #1073/#1076/#1056-reconcile.

**Thread 1 update (PM) — Franchil email fully scrubbed + ready to send.** Worked the outreach email line-by-line with TJ (Notion `3815903a…`, "Email — ready to copy" block). Key honesty/voice fixes: **killed the `$50 → "bring in your first lead"` overpromise** (cost math: home-care lead ~$80–150; $50 ≈ ~1 at best, contradicts terms §5 "no guaranteed results" + the #1075 budget-step copy) → reframed $50 as "get live + families seeing your page"; **dropped "one of the most complete we've seen / nothing to fix"** (unsubstantiated + her photos are okay-not-great) → "in good shape, can launch as-is" + soft post-launch "stronger photos" nudge (page photos = ad creative); **dropped the "reply 'go'" CTA** (she already requested it — don't re-ask consent) → confirmation tone; **clarified budget roles** ("you set the spend, we run the campaign", not vague "we'll set the budget"); **removed all em dashes** (AI tell); dropped the fixed "live by June 22" date → "within a few days". Subject: **"Getting Franchil's campaign live"** (TJ's pick over my options). Solo TJ sig (dropped two-founder bio). **Terms link is on main/prod but render NOT machine-confirmed (WAF/429) — TJ to eyeball `olera.care/managed-ads-terms` in browser before sending.**

**NEXT:** TJ sends the Franchil email (after browser-checking the terms link), then builds the actual Google+Meta $50 campaign (concierge v1, manual). **#1075 `managed-ads-budget-step` MERGED** (parallel session, 10:29 UTC) — migration collision resolved by renumber **108→110** (`110_ad_campaign_budget.sql`, adds `intended_monthly_budget` column), rebased onto the rewritten admin files. Verify migration 110 is applied to the shared DB (108+109 were applied this session; 110 likely applied by the other session — confirm). Other opens: per-channel (Google-vs-Meta) Performance split; connection-request leads (need utm-on-event check); counsel sign-off + fee-vs-at-cost decision before scaling; suggested-to-skip detail-page hardenings (race guard + isFinite) if ever revisited.

### 2026-06-14 — Provider outreach reframed to host-site / eligibility-screener funnel (branch `claude/keen-mendel-6i8iW`)

**Context:** Long design session (with Logan) reworking the MedJobs **provider funnel** around a lightweight **eligibility screener** as the single converging CTA, an **internship/host-site** framing, a **two-tier terms** model (free non-circumvention "interview terms" = existing `interview_terms_accepted_at` / `PilotTermsModal`, before any interview; paid internship agreement at good-fit), **coarse coverage buckets + PRN** for matching, **term-scoped** availability with finals re-plans, and a **pay-once, guaranteed-until-threshold-hours** fee. Funnel is being designed step-by-step ("inch by inch") before any build.

**Locked + shipped this session — provider outreach copy rewritten in the new voice:**
- **`lib/student-outreach/templates.ts`** — `providerIntroEmail` (Day 0), `providerFollowupEmail` (Day 3), `providerFinalEmail` (Day 7): new host-site/eligibility copy, bullet list (vetted+PRN / predictable+attestation / lower-cost+experience / evergreen pipeline), subjects aligned to `Host {campus} student caregivers this fall (pilot)`. Activation cadence (`activationIntroEmail/Nudge/Final`, **non-partner branches only**) re-pointed from "get set up → candidate board" to "check your eligibility" + Dr. DuBose call. Legacy `callScript()` Day-0 over-promise ("reliable coverage") removed.
- **`lib/student-outreach/sequencer.ts`** — `defaultCallScriptForDay` + `defaultCallTipsForDay`: provider call-day keys realigned **0/1 → 3/5** (actual v10 call days), new host-site/eligibility talk tracks; activation check-in call re-pointed to the eligibility check.
- CTA links: `[check your eligibility]` → `{welcome_url}` (magic-link/authed entry, future screener), `[see our website]` → `{program_url}`. No em dashes. `tsc --noEmit` clean.

**DO NOT FORGET — follow-ups before/at build (Logan flagged):**
1. **Smartlead campaigns** must be updated with this new copy + CTA. Not live-sending to providers yet, so a dead eligibility link is fine for now — but the campaigns are the source of live sends and must be synced.
2. **Outreach + activation sequence launch UI** (PreFlight snapshots / launch screen) needs to reflect the new email snapshots + call scripts.
3. **Cold send pipeline must populate `{welcome_url}` for cold provider sends** — today only the activation path builds a welcome token; cold used `{program_url}`. Until wired, `[check your eligibility]` falls back to `PROGRAM_URL` (acceptable pre-launch).
4. **The eligibility screener itself (the `{welcome_url}` destination) is the next build (funnel step "S2").** Today the magic link lands on `/medjobs/candidates` with `WelcomeBanner` → `PilotTermsModal`. Plan inserts the screener before the board; screener end-state writes `interview_terms_accepted_at` (reuse existing flag; honors D15/D16, no new enums/actions per G1–G3).
5. **PDF one-pager** (`lib/program-pdf/configs/texas-am.ts`) still has older "recurring shifts" framing — reframe later; for now it lives in the email signature.
6. **Single-body-link policy deviation:** emails now carry two body links (eligibility + website) vs the documented one-link-in-body / program-in-signature policy (templates.ts:111). Approved by Logan; revisit if deliverability needs it.

**Full build plan (durable source of truth):** the end-to-end provider funnel — Loops 1 (cold→eligibility→board), 2 (browse→interview), 2b (re-activation), 3 (offer→accept→confirm) — is now written up in **`docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md`**: every flag, screen, reuse/adapt/build, the dual-pay (authorize-at-offer/capture-at-confirm) model, the `placements`-table + Stripe schema decisions flagged for approval, discipline/deferred checks, and a 5-phase build sequence.

### 2026-06-15 — Real email complaint/bounce rate in admin (branch `complaint-rate-instrumentation`, off staging, PR'd→staging)

Closed the Notion card "Fix complaint-rate instrumentation (reads 0.00% = blind, not healthy)". **/explore reframed the premise:** the complaint path is NOT blind. The Resend webhook (`supabase/functions/resend-webhook/index.ts`) handles `email.complained` correctly and writes `email_events` + `email_log.complained_at` in real time (`received_at` ~2s after `occurred_at`; 53,623 events captured). The real gap was **display**: no percentage was computed anywhere — admin showed only raw counts, which read as a healthy "0.00%" by absence. **The actual number is uncomfortable:** complaint rate **0.041%** (over the 0.04% warn line, ~half Resend's 0.08% suspension line), riding there for weeks unseen on the crown-jewel account.

**Built (PR, `/admin/automations` = email cockpit):** account-wide Complaint rate (30d) + Bounce rate (30d) as colored % StatCards, replacing the combined raw-count card. Numerator = **`email_events`** distinct webhook events (Resend's own count, =4 complaints) — NOT `email_log.complained_at` (=12, inflated). Denominators match Resend's defs: complaint = /delivered, bounce = /sent. Colors: yellow at half-threshold (0.04% / 2%), red at AUP line (0.08% / 4%); both currently yellow. Thresholds extracted to dependency-free `lib/email-thresholds.ts` (client can import w/o pulling in Resend); `lib/email.ts` re-exports. Plan at `plans/complaint-rate-instrumentation-plan.md`.

**The 4-vs-12 discrepancy — investigated, BENIGN.** `email_events` complained=4, `email_log.complained_at`=12; the gap is 8 rows for one provider (`rdoyle@rlcommunities.com`), identical sub-second timestamp, zero `email_events` complained (but 60 other events — webhook healthy for them). No code writes `complained_at` except the webhook → these are **manual/out-of-band suppressions** (flagged by direct DB edit). So `email_events` = Resend-counted (canonical), `email_log.complained_at` = superset incl. manual flags. No lost webhook events. **Filed Notion follow-up card** (P3, Backend, Owner TJ): "Reconcile email_events vs email_log complaint counts" — decision = accept divergence as by-design vs add provenance flag. **TJ wants both cards closed together.**

**Pre-test (/pre-test) caught 2 real bugs, both fixed:** (1) 🟡 bounce rate divided by `delivered` — but bounced mail is by definition not delivered → overstated ~17% (3.14% vs correct 2.68%); switched to /sent to match Resend's 4% math. (2) 🟢 skeleton showed 5 cards/5-col vs the real 6/6-col → load reflow; matched it. tsc clean (0 errors; ran `npm ci` in the worktree — had no node_modules). Numbers verified by replaying the route's exact queries against live DB.

**NOT browser-tested** (admin-auth-gated) — verified data + computation, not render. Staging QA: load `/admin/automations`, eyeball the two rate cards.

### 2026-06-15 (PM) — Find Families digest rung + managed-ads email overhaul (branch `find-families-digest-rung`, PR #1052 → staging, built off staging AFTER #1051 landed)

Started as an audit ("are Find Families emails in the digest tracker?"), became a build. Commits through `69b463bf`, all pushed, tsc clean (node_modules symlinked from keen-stonebraker for tsc).

**1. Find Families digest rung.** New `find_families` cascade variant gated on a real active published care-seeker within ~50mi (haversine, same catchment as `/provider/matches`). New `providerFindFamiliesDigestEmail` (no PHI — town + care need only), one-click `matches` magic link → `/provider/matches` (added "matches" portal action in claim-tokens + onboard). **Expansion:** also enrolls claimed providers (account_id) within ~50mi of any published seeker into the pool on the seeker signal alone (box-query per seeker + haversine refine). Logs `seekerEnrolled`/`findFamiliesSent`. Tracker wired (`find_families` in automations variant maps, conversion=`matches_outreach_sent`) + `weekly_analytics_digest`/`matches_encouragement` added to `/admin/emails` dropdown. **Latent bug fixed:** `managed_ads` was missing from `classifyVariant`'s metadata allowlist (would misclassify as weekly_digest).

**2. Managed-ads email rewritten diagnosis-led** (`providerManagedAdsEmail`). Was offer-led ("we run targeted ads on your behalf" + platform logos = broker-pitch shape). Now: leads with a TRUE local-demand number — `localDemand` (unique provider-page viewers in city+category this week, from provider_page_view_stats), **floored at ≥5** so a thin "1 family" never undersells; qualitative fallback below. Softened per 6.5/10 feedback: dropped accusatory "your page usually isn't one of them," reframed "we run ads" → **"We're testing a simple way to help local agencies show up earlier… you fund a small local campaign, Olera runs it, and shows you exactly what happened"**; stacked anti-broker lines (added "No bidding against other agencies for the same family"). Subject demand-led + distinct from find_families; classifier regex + preview sample updated. Signature swapped to the **two-founder bio** (Logan + TJ, NIH SBIR + biomed eng, "less opaque") per TJ — reused from the referral-teaser email.

**3. Move 2 — per-provider staggered rotation** (`providerAdsRotationPhase`, salted "ads:" so it doesn't correlate with the weekday bucket). Was a GLOBAL `floor(now/WEEK)%3` flip → whole cohort went dark together 1 week in 3 (killed continuous measurement + arbitrary Thursday boundary). Now ~1/3 of the eligible cohort is in an off-week at any moment, staggered; variant always live for most, each provider still gets a ~1-in-3 break.

**Decisions made (strategy):**
- **Managed Ads is PAID** — providers fund their own ad budget, Olera does NOT subsidize. Email says paid but does NOT name a price. NEVER write "free"/"nothing to buy" copy (that's the cold-rank line). See memory `project_managed_ads_positioning`.
- **Don't gate the email audience by completeness** (TJ corrected my first instinct) — it's the top-of-funnel magnet; gating to ≥70% kills growth. Instead **segment the DESTINATION**, not the audience.
- **Digest is signal-gated** (page views/clicks/questions/leads/rank-eligible/nearby-seeker) — it reaches the warm-ish semi-engaged, NOT truly-cold "never heard of us" providers. Cold acquisition is a separate channel (Smartlead / cold_rank); the demand-hook message can be repurposed there.
- Verified the **question recency decay** system (PR #997, 2026-06-09) for TJ: fresh question (≤30d) leads, stale demotes → falls to next real signal or goes quiet, quarterly resurface. Screenshot still 92% family_question because the 30-day window mostly predates the 6-day-old fix + fresh questions legitimately lead.

**Timing facts (for the live send):** cron fires 13:00 UTC (9 AM ET) Mon–Fri. New copy only goes out today if #1052 is merged to main before the fire. Total daily send ≈360 (unchanged by Move 2). managed_ads slice: ~230–300 under old global rotation (today was ads-ON), ~150–200 under new per-provider rotation. Exact count = browser dry-run (`?dry_run=true`; staging=new code, prod=old).

**NEXT (decided, NOT built):** the keystone — **demand-breakdown landing with state-aware routing** on `/provider/boost`: lead with the local-demand breakdown, then route by provider state — unclaimed→claim, claimed-incomplete→"here's what's missing to run ads" (the completion-urge path), complete→set up campaign. This makes broad-sending tasteful AND unlocks the concrete "See the {city} breakdown →" CTA (CTA held at "See how it works" until the page can honestly deliver a breakdown). Offered to spec a focused plan OR build just the claimed-incomplete slice first — TJ to pick. Also still open: trigger a staging dry-run to confirm seekerEnrolled/findFamiliesSent before live; merge #1052.

### 2026-06-14 — Provider funnel instrumentation + Managed Ads in the banner/digest system (branch `provider-funnel-instrumentation`, off staging, NOT yet PR'd→ now PR'd)

Built on top of the merged IA rework (PR #1050). Three layers this session:

**1. Funnel instrumentation** (mirrors the old Find Families measurement: event → provider_activity → Activity Center + Slack). Migration `105_managed_ads_and_your_market_events.sql` adds 5 event types (managed_ads_cta_clicked/boost_viewed/requested, your_market_viewed, your_market_playbook_clicked) — **APPLIED to Supabase (probed the live CHECK, all accepted)**. Shared `lib/analytics/track-provider-event.ts` (keepalive). Wired into 6 surfaces (BoostCard, ManagedAdsPitch, ManagedAdsCTA, boost page, /provider/market, playbook). 4 new Slack builders. Relabeled `market_diagnostic_viewed_no_leads` → "Saw the managed-ads pitch"; new Activity Center "Growth" category. Allowlist synced across migration/app(`PROVIDER_EVENT_TYPES`)/admin(`PROVIDER_ACTION_EVENT_TYPES`)/categories/labels.

**2. Hero banner integration** (`DashboardHero.tsx` `resolveHook`): for the empty-handed ~99% (no leads/questions/nearby family), Managed Ads is now the **primary fallback** (the one lever that generates demand), shown regardless of completeness — the 70% gate on /provider/boost turns ads-desire into a completion pull. Completion + market-intel rotate in (~1/3 visits); ≥10-views+gap still leads with completion. Hero ads click fires managed_ads_cta_clicked{source:hero} (Slack dedup'd).

**3. Weekly digest variant** (`providerManagedAdsEmail` + the cron): leads the no-leads cohort with the managed-ads email (action="ads" magic link → /provider/boost). Priority: question→leads→cold_rank→MANAGED ADS→completion→market_rank→weekly. Weekly rotation (~2 of 3 weeks) to avoid olera.care fatigue. Registered in admin automations (label/order/conversion=managed_ads_boost_viewed) + the **email-preview picker** (Admin→Automations→digest job→"Managed ads"). Telemetry: added managedAdsCount; fixed completionCount to count off `variant` not URL presence.

**Copy (final, after deep iteration with TJ):** banners DIRECT action, don't pitch Olera. Winner = **"Reach families already searching for care."** + "We run the ads on Google, Facebook & Nextdoor and send them straight to your page — nothing for you to set up." + **"Get started"** CTA. Applied to all 3 surfaces.

**Test setup:** moved test account **Aggie Home Care** (`db312b06…`) College Station,TX → **Boise, ID** (0 nearby families) so the managed-ads hero banner shows. Reversible — original: College Station, TX (30.5852, -96.2959). It has 0 connections/questions, so nothing deleted. (Shared prod instance — restore when done testing.)

**Pre-test:** ran twice, caught + fixed 2 telemetry bugs (digest completionCount miscount; missing managed_ads in buildBannerPreviews) + a Slack-copy relabel. Full tsc clean (symlinked node_modules). **NOT browser/email-tested** — preview the email via the admin picker + dry-run the digest (this week is managed-ads-active).

**Next:** browser QA on staging-preview (hero banner on Aggie/Boise, the event→Activity Center "Growth"+Slack loop, /provider/market, digest dry-run + email preview). Restore Aggie to College Station after. Then merge to staging.

### 2026-06-15 — Same branch: restraint, standing-order, boost redesign, /punch de-anchor, Find Families Slack, dejank, completion-as-boosters, inline edit (commits through `07281840`, PR #1051)

Continuation of the managed-ads work, layering UX/design polish:

**Restraint — sidebar card → post-edit nudge.** Removed the always-on `BoostCard` from the dashboard (felt "upgrade now"); deleted the component. Added `components/provider/PostEditAdsNudge.tsx` — fires **once per session after a profile save** (the earned, high-intent moment; ~50 real editors), wired via `DashboardPage` `handleSaved`. Suppressed when the hero already resolved to the managed_ads banner (added `onBannerResolved` callback to `DashboardHero`) so the pitch never doubles on one screen. New `source:post_edit` Slack label.

**Standing-order flow (key product change).** Boost page no longer slams a 70% door. Migration **`106_ad_campaign_pending_profile.sql`** adds `pending_profile` to the status CHECK — **APPLIED + probed (pending_profile/requested accepted, bogus rejected)**. POST: drops the 403; <70% queues as `pending_profile` (quiet, concierge NOT paged), ≥70% inserts `requested` + pings. GET: auto-promotes `pending_profile`→`requested` + pings concierge (`launchReady`) the moment they cross 70% (re-checked on every boost load — profile saves are client-direct, no server hook; GET is the promotion point). New `PendingProfile` state ("your campaign is queued · 1 step to launch") replaces the dead-end CompletenessGate; everyone can pick week+channel (the "taste") regardless of completeness. Admin badge/dropdown/VALID_STATUSES updated.

**Boost apply-page redesign.** Replaced stacked pitch→form sections with a **two-column transactional split** (chosen treatment: **white, two-column, teal accent — Airbnb Confirm-and-pay-leaning, NOT Perena cream**). Left = action spine (headline→week→channel→black CTA); right = **live "Your campaign" summary** (`CampaignSummary`) that fills in as they pick + value props compressed to scannable label-scale. Mobile: stacks, one-line live confirmation above CTA.

**Real brand logos** in `PlatformMarquee` (Google 4-color / FB / IG gradient / Nextdoor / YouTube / X) — local SVGs in `public/images/platform-logos/` (vectorlogo.zone), `<img>` on white chips, no CDN dep. Hero subline readability bump (`warm-100/70`→`/90` + text-shadow). Boost hero image swapped to a unique seniors photo (earlier).

**Snappiness.** Boost page no longer full-page-skeletons on load — hero+pickers paint instantly; only CTA (disabled) + summary status wait on `ready`. **In-app nav is snappy; cold/magic-link entry still hits the shared `/provider` layout auth spinner** (untouched — shared across all hub routes; offered the surgical fix, not yet done).

**`/punch` de-anchored (meta).** TJ flagged it over-anchored on Perena/warm-cream. Went through ALL 109 inspiration frames across 9 folders (incl. new Grok/OpenAI/DayOne/Duolingo). Rewrote `.claude/commands/punch.md`: reads the folder fresh each run, contradiction table (each app's ground/composition/accent/headline), explicit anti-anchor rule, **dark called out as a first-class/common mobile treatment**, app-agnostic DNA separated from per-screen surface choice. Docs-only.

**Pre-test (twice):** caught + fixed font inconsistency (boost headline font-serif→font-display brand match) and a sticky summary-card height jump (reserved `min-h-[2.5rem]`). tsc clean throughout (one-tsc-at-a-time discipline — see new memory + postmortem; a gated-on-tsc commit pipeline silently never pushed when concurrent tsc runs starved each other).

**Find Families instrumentation verified + Slack added (`cea1454f`).** TJ "didn't see what I expected" on preview. Audited all 6 layers (client fire → app allowlist → DB CHECK → Slack conditional+builder → admin allowlist → Activity Center category/label) — ALL wired; live DB query proved the full funnel fires (TJ's own aggie preview test recorded). Root cause of "didn't see": `sendSlackAlert` gates on `process.env.SLACK_WEBHOOK_URL`, which Vercel scopes per-env — **preview likely lacks it** (events still write to DB + Activity Center; just no Slack). Separately: `matches_page_viewed` etc. had NO Slack by design. Per TJ ("don't worry about spam; impressions are the data at tens of providers"), added Slack for **`matches_page_viewed`** (every Find Families visit — "showed up and bounced" is signal) + **`matches_outreach_sent`** (conversion; AI-vs-manual; family kept to opaque id, no PHI). Added provider_name/city/state metadata at the call sites. No migration (event types already existed).

**Dejank boost transitions (`6cc0f3b5`).** The "Get Started → snap snap" = the page rendered the apply form optimistically before the fetch, then snapped to PendingProfile/CampaignInMotion for anyone with a request (aggie has `pending_profile`). Fix: hold ONE calm loader until the fetch resolves (never render a guessed sub-view) + a per-session in-memory prefetch cache (`lib/ad-boost/boost-state.ts`) warmed by Find Families mount + the dashboard managed-ads hero, so the common in-app nav initializes from cache and paints the correct page on the first frame. Cold load → loader. Removed the optimistic `ready` shimmer plumbing + dead BoostSkeleton.

**Completion score = controllable; reviews/response = boosters (`624c92c5`, decided via AskUserQuestion).** Reviews was a weighted section scoring 0 when absent → showed as a required to-do + dragged the score. Circular dependency (need families to earn reviews; ads bring families) + asymmetry (response_rate already N/A'd when absent, reviews didn't). Redefined the ONE `calculateProfileCompleteness` so `overall`/`sections` = the 7 self-completable sections (achievable to 100); reviews + response_rate move to a non-gating `boosters` field. System-wide (dashboard meter, hero, onboarding, ad gate). **Effect: scores RISE for low-review providers** (intended). `AdBoostEligibility` exposes `boosters`; removed `WEIGHT_REVIEWS`/`WEIGHT_RESPONSE_RATE`.

**Inline section editing on the boost page (`07281840`, decided via AskUserQuestion).** "Next: Gallery" was a full route change → whole dashboard load → modal, no return (the "snaps me out" jank). New reusable hook `hooks/useProfileSectionEditor.tsx` packages the dashboard edit modals + the verification gate (no loophole, no DashboardPage refactor); the boost page opens editors INLINE; on save → refresh profile + refetch boost state (list updates in place, auto-promotes if they cross 70%). PendingProfile section buttons → inline open; added the "Boost your results" carrot (reviews/response as carrots, not requirements).

**Perf — Find Families load (`15430ab2`).** TJ: "load from Get families banner → Find Families feels 2018." `/provider/matches` gated the whole page on `loading` until 4 fetches finished (families+connections parallel, THEN inactive-profiles, THEN reach-out-counts). Banner already navigates via `<Link>` (chunk prefetched), so cost was the data. Fix: paint as soon as families+connections resolve; run inactive-profiles + reach-out-counts in the BACKGROUND (inactive append via setFamilies(prev); counts default to 0 per card). Critical path: 4 round-trips → 1 parallel pair. **Awaiting TJ's feel-check.** Next levers if still slow: prefetch families+connections on the dashboard banner (boost-state pattern), or geo-scope the families query (currently fetches the WHOLE active-families table + full metadata, filters nearby client-side).

**Gallery scoring bug (`adc8e8ac`).** TJ: boost page said "add gallery photos" while he already has images. Real inconsistency: dashboard score + live page backfill `metadata.images` from iOS `provider_images`/logo (via useProviderDashboardData), but `eligibility.server` scored gallery from RAW metadata.images → gate counted an emptier gallery than what's displayed. Fix: eligibility.server backfills the same effective images before scoring (extended its existing olera-providers query). Boost gate now scores the gallery families actually see. `scoreGallery` wants 8 imgs for 100% (5-7=75, 3-4=50) — **legibility offered, not built**: "what's left" rows still show abstract "% done" with no "add N more" lever; TJ to decide if we add per-section hints.

**Pre-test fix (`97ad34d6`).** Inline editor fed raw profile.metadata; dashboard feeds enriched (gallery iOS backfill) → inline Gallery editor would've shown an emptier gallery than the dashboard. Now uses useProviderDashboardData (same enriched source).

**Next:** browser QA on preview — (1) Find Families Slack (confirm SLACK_WEBHOOK_URL scope for Preview, or verify on prod); (2) boost flow eligible→"Ready to launch", sub-70→"Queue my campaign"→PendingProfile, cross-70-then-revisit→auto-promote→CampaignInMotion; (3) inline section edit (open Gallery on the queued page, save, list updates in place, no dashboard jump); (4) confirm Reviews is gone from "what's left" + boosters carrot shows + gallery no longer falsely flagged; (5) **TJ feel-check the Find Families load speed**. Restore Aggie → College Station. Decide: cold-entry layout-spinner fix, Find Families prefetch/geo-scope, per-section legibility hints. Re-share boost screenshots for a deeper week/channel polish. Then merge #1051 → staging.

**Watch:** completion-score change is system-wide → the dashboard completeness meter % rises for providers with few/no reviews (intended). Gallery backfill means iOS-scraped images now count toward gallery completion (already true on the dashboard; boost now matches).

### 2026-06-13 — Provider Paid Ad Boost (Managed Lead-Gen, concierge v1) — PLANNED

Explored + planned TJ's "Sri Lanka" idea: Olera runs paid **external** ads (Google/Meta) on a provider's behalf → families land on the provider's Door B intake. Providers pay. Profile must clear a completeness threshold first; "select next week" = concierge setup window. Exploration killed the two objections: external ads make their own demand (no empty-theater) and we never touch internal browse ranking (no collision with the resolved no-pay-to-win-rank decision). Dropped the "not enough families" scarcity message at TJ's direction.

Plan: **`plans/provider-paid-ad-boost-plan.md`**. Concierge v1 = thin request→schedule→measure rails, NOT an ad-platform integration. Payment out-of-band (Stripe inert). Reuses: `calculateProfileCompleteness` (`lib/profile-completeness.ts:217`), Door B `BenefitsDiscoveryModule`, `connections/request`, `seeker_activity`, `lib/analytics/referrer`. Existing `app/provider/pro/page.tsx` promises off-strategy "Priority Search Placement" (internal rank) — must reframe to external ads. This is the paid evolution of the Comfort Keepers lead-gen ask + the market-diagnostic engine.

**Decisions locked (TJ 2026-06-13):** threshold 70% · dedicated `ad_campaign_requests` table · provider-facing ROI (build it) · provider-agnostic (no CK hardcoding).

**Phase 1 backend SHIPPED (typechecked clean, uncommitted):**
- `lib/ad-boost/eligibility.ts` — pure evaluator (`evaluateAdBoostEligibility`, `AD_BOOST_THRESHOLD=70`, missing-sections sorted by weight w/ edit deep-links).
- `lib/ad-boost/eligibility.server.ts` — authoritative loader; resolves provider profile + assembles reviews/response-rate like the dashboard endpoint, returns eligibility.
- `supabase/migrations/104_ad_campaign_requests.sql` — TEXT+CHECK status, RLS service-role-only. **NOT YET APPLIED — ops step.**
- `app/api/provider/ad-boost/request/route.ts` — POST (server-gated at 70%, validates setup week, blocks dup open requests, inserts, awaits Slack) + GET (eligibility + latest request).
- `slackAdBoostRequested` builder in `lib/slack.ts`.

Typecheck note: worktree has no node_modules; tsc was run by copying files into ~/Desktop/olera-web (then cleaned up). No ad-boost/slack errors.

**Phase 1 UI SHIPPED:** new `app/provider/boost/page.tsx` (TJ chose a dedicated page; `/provider/pro` left as-is, its off-strategy "Priority Search Placement" copy NOT touched per his call). Three states — gate (<70%, missing sections deep-linked), apply (≥70%, next-4-Mondays picker + Google/Meta/Both channel + submit), in-motion (open request). Reads authoritative state from GET /api/provider/ad-boost/request. Typechecked clean.

**PHASE 1 COMPLETE + LIVE-READY.**
- Migration 104 APPLIED to Supabase (TJ, 2026-06-13).
- Entry point wired: `components/provider-dashboard/BoostCard.tsx` — completeness-aware CTA on the dashboard left column (mobile+desktop, hidden in preview). TJ chose dashboard CTA over global nav.
- `/provider/boost` registered in `app/provider/layout.tsx` HUB_ROUTES (auth-gated).

**Phase 1 committed:** `3e9e6953`.

**PHASE 2 COMPLETE (committed next):**
- Admin queue: `app/admin/ad-boost/page.tsx` + `app/api/admin/ad-boost/route.ts` (GET list + POST status/tag/note edits, auto campaign_tag=id on go-live). Linked in AdminSidebar (Operations → Ad Boost). Per-row copy-ready UTM landing URL.
- Attribution: CORRECTION — Door B → `/api/benefits/save-results` (not connections/request = Door A). Wired UTM via `lib/ad-boost/utm.ts` (`readUtmParams` reads window.location.search, no Suspense) → both BenefitsDiscoveryModule variants pass utmSource/utmCampaign → save-results persists into the `benefits_completed` seeker_activity metadata. Same event Phase 3 ROI reads. Limitation: same-page capture only (no first-touch persistence).

**PHASE 3 COMPLETE (committed next):** `lib/ad-boost/delivered.server.ts` counts benefits_completed seeker_activity scoped to utm_source=olera_managed, grouped by utm_campaign. Admin queue shows "N delivered" pill per request; provider /provider/boost in-motion state shows "N families reached out so far" (live + delivered>0) linking to leads; provider GET returns `delivered`.

**ALL 3 PHASES DONE.** Phase 1 `3e9e6953`, Phase 2 `c4780660`, Phase 3 = next commit.

**Remaining before merge:** (1) browser QA click-through (typecheck only so far; client components can throw at runtime); (2) Pro-page "Priority Search Placement" copy still promises internal pay-to-rank — TJ deferred the fix, but it now contradicts the live ads product; (3) PR to staging. Optional polish: sessionStorage first-touch UTM persistence (currently same-page capture only).

### 2026-06-14 — Provider IA rework: Find Families (leads) vs Your Market (intel) [commit 4a076858]

Reorganized the overloaded `/provider/matches` (which forked gated market-intel vs ungated marketplace via the marketGate flag). Plan: `plans/provider-find-families-ia-rework-plan.md`. Decisions (TJ): no-leads FF = managed-ads pitch; managed ads lives in FF (boost = deeper setup); has-leads = nearby ~50mi → cards + slim "even more" banner below; ship to everyone, retire flag; tab name = "Your Market" (city dynamic in header).

Built: new `/provider/market` route (lifted FindFamiliesMarketView) + "Your Market" nav tab; matches rewritten to two states (nearbySeekers>0 → marketplace + banner; else → ManagedAdsPitch); marketGate fork removed from matches (flag KEPT — AnalyticsTeaserCard still uses it); no-leads tracking event de-flagged + preserved (same name, no migration); extracted shared `ManagedAdsPitch` (hero+marquee+pillars, used by boost + no-leads FF) and `ManagedAdsCTA` (banner/empty, `tone` prop); registered /provider/market + /provider/boost in layout HUB_ROUTES + both Navbar provider-nav booleans.

Verification: symlinked ~/Desktop/olera-web/node_modules into the worktree → full `tsc` clean except 4 known baseline missing-deps (@vercel/functions, @react-pdf/renderer, qrcode — newer than Desktop's install). NOT browser-tested yet. Next: /pre-test + QA the preview (FF two states, /provider/market, nav highlight, boost pitch parity).
### 2026-06-12 (PM) — GA4 ghost spam: measurement ID rotated + shipped to prod, old stream deleted (CLOSED)

GA4 realtime was showing ~90-110 "active users" vs the real 20-30 US baseline. Diagnosis: **ghost spam** — bots sending fake hits directly to Google's collect endpoint using our public measurement ID (`G-ZLP95NWSZW`). Never touched olera.care/Vercel, so the WAF couldn't block it. Telltales: nonexistent page paths (`/about-usda/news/blog`, `/cars/used-cars/all-india`), active users with 0 views, 94 session_starts vs ~24 page_views, Ghana/India-heavy country mix while the WAF challenges that traffic at the edge.

**Fix shipped same night:** rotated to a fresh GA4 web data stream **G-XX0KRLT4FE** ("olera.care web v2", same property). One-line swap in `app/layout.tsx:17` (only occurrence in repo) — PR #1047 → staging, promoted to main via #1048 (also carried #1045 admin connections + #1046 email-lock revert). Verified prod serves the new tag (view-source), verified clean stream separation via a Realtime "Stream name" comparison (new stream = 2 real users, legit pages only), then TJ **deleted the old data stream** — the step that actually drops the spam. Logan notified via DM.

**Why rotation works / caveats:** spam targets the harvested ID; streams in a property share reports, so deleting the old stream is mandatory, not optional. New ID is also public in page source — if spam returns, the durable fix is server-side tagging (first-party proxy), deliberately deferred. **GA data before 2026-06-13 is inflated** — add a Country=US comparison when reading historical windows. Gotcha for next time: when creating a replacement stream, GA's "Set up a Google tag" dialog defaults to reusing the existing on-site tag (would carry the spam over) — always pick "Install manually". Full detail in memory `project_ga4_ghost_spam_rotation` + Notion PR Merge Reports (#1047, #1048).

**Decision (don't relitigate):** did NOT touch the Vercel "Block Restricted Regions" WAF rule — it wasn't the leak, it allowlists team countries, and it carries the verified-bot Bypass from the May Googlebot-403 incident.

### 2026-06-12 — Provider value loop: referral teaser digest + proactive market warming (PR #1040 → staging, OPEN)

Built the next provider-engagement loop around "Your Market" / referral-source curiosity, inside the existing weekly provider digest instead of a standalone blast. The thesis: providers will rarely do referral work cold, but a specific local map of hospitals / rehab / senior-resource teams gives them a juicier reason to return, and can later become the sticky loop/paywall surface.

**What changed in PR #1040 (`codex/referral-teaser-digest`, base `staging`):**
- `weekly-provider-digest` now has a `referral_teaser` variant that routes providers to the market call sheet when we have referral targets. It stays below fresh questions, fresh leads, and claimed-provider completion nudges.
- Email copy/HTML added: local-area subject/body, first 3 referral/source teams, "See the {city} map" CTA, and a trust block with Logan + TJ LinkedIn context.
- Admin automation analytics now classify/report `referral_teaser`; conversion maps to `market_outreach_status_updated`; sample preview exists in the weekly-digest admin page.
- Safety guard: referral teaser only sends when `referralGraph.prioritizedTargets` exists. If not, provider falls back to safe market-rank email; cron reports `referralTeaserSent` and `marketRankMissingReferralTargets`.
- Cache freshness tightened: old diagnostics that have rank but no referral graph are treated as stale so they can self-heal.
- Important correction from TJ: do **not** limit the funnel to markets already computed by user visits. Added bounded proactive warming: each weekday digest scans a rotating slice of email-reachable directory providers with email/place/city/state, warms up to 6 missing city-care markets, and reports `proactiveWarmQueued`. `warmCity` still dedupes and enforces monthly spend limits.

**Validation:** `git diff --check`, `npx --no-install tsc --noEmit`, and `npm run check:crons` passed. PR #1040 is ready-for-review against `staging`; Vercel check was pending after the latest push.

**Next:** QA the Vercel preview email/admin surfaces; watch first dry/live run summary for `referralTeaserSent`, `marketRankMissingReferralTargets`, `proactiveWarmQueued`, and `warmCities`. If missing-targets stays high, next product PR should be an explicit pre-send market research queue rather than more copy tweaking.

### 2026-06-11 (PM) — seniorlistings.net: Resend rotation built→closed, then pivoted to Smartlead warm-up (LIVE)

Two threads. **(1) Resend sender-pool rotation (#1023) — built then CLOSED.** Built a sticky weighted multi-domain sender pool for the Resend provider-notify path (`lib/email.ts` `resolveSender`, new `PROVIDER_NOTIFY_POOL` env JSON, per-recipient FNV-1a hash, env-gated + backward-compatible, unit-tested: stickiness + ~weighted distribution + fail-safe) to add `seniorlistings.net` as a 2nd Resend outreach domain. Then TJ reframed: warm `seniorlistings.net` in **Smartlead (cold lane)** like findmedjobs.co — NOT a Resend secondary — and don't send from it yet, just warm. So **closed #1023** (no Resend domain to rotate to; code is sound + recoverable if we ever add one). Prod send path stays single `oleracare.com`.

**(2) seniorlistings.net warm-up stood up end-to-end (infra/dashboard, no repo code).** Bare domain → Google Workspace Business Starter (`hello@seniorlistings.net`) → GoDaddy DNS (MX `smtp.google.com`; SPF `v=spf1 include:_spf.google.com ~all`; DMARC `p=none`; DKIM `google._domainkey` 2048-bit) → Gmail activated + **DKIM "Authenticating email"** = fully authenticated → connected to Smartlead → **warm-up STARTED 2026-06-11** (30% reply rate, 40/day ceiling, no campaign). Seasoned ~early-July. Gotchas logged in memory `project_email_deliverability` (DKIM copy-paste-only; Smartlead+Workspace needs BOTH Domain-Wide Delegation AND App-Access "Trusted"; Workspace defaults to pricey Plus → pick Business Starter).

### 2026-06-11 — Email deliverability: verify-on-send + dead-email surfacing + Email Verifier tool — ALL SHIPPED TO PROD (branches `email-verify-on-send` → `admin-email-verifier` → `admin-needs-email-redesign`)

Started from the Smartlead warm-up thread, pivoted into closing the actual bounce problem. `oleracare.com` (the `PROVIDER_NOTIFY_FROM` domain) was bouncing at **5.1%** — over Resend's account-wide 4% suspension line — because the send path only suppressed *cached* invalids, so new/team-fetched directory addresses sent blind. A backfill found **43% of `question_received` addresses are dead**. Resend's thresholds are account-wide, so this threatened olera.care transactional mail too.

Shipped to production today across 4 PRs:
- **#1014 — verify-on-send** (`lib/email.ts:330`): the 9 `PROVIDER_NOTIFY_FROM_TYPES` now verify-on-miss (`verifyAndCache`, fail-open, skip-on-invalid) instead of cache-only. Plus instant verify in both `add-email` endpoints (leads + questions) with a Send-anyway force override, and **dead on-file emails surface in the "Needs Email" queues** (leads + questions). For questions, the send path sets `metadata.{needs_provider_email,email_dead}` on suppression so the question re-enters the queue instead of going dark.
- Backfill: **987 dead addresses cached + suppressed**; **384 historical dead-email questions flagged** (one-time script, merged metadata).
- **#1016 — Email Verifier admin tool** (Records → Email Verifier): paste any address → Valid/Invalid/Risky + reason + live ZeroBounce credit balance. Thin UI over the same engine. `app/admin/email-verifier/page.tsx` + `app/api/admin/verify-email/route.ts` + `getZeroBounceCredits()`.
- **#1017 — Needs Email redesign**: reworked the input toward the calm/typographic direction (Perena/Airbnb/Linear) — amber-dot cue, focal rounded input, "send anyway" → quiet text link, plain language, "find one →" lookup, hairline dividers. Presentation only.

**Infra (TJ did):** ZeroBounce funded — 5,000 credits + autopay. `ZEROBOUNCE_API_KEY` set in Vercel (Production + Preview). Team announced in #ai-product-development.

**Pre-test gotcha caught:** A & B were first built on the *leads* surface, but the scenario (provider *questions*) runs through a separate questions surface — ported both before QA. Also: ZeroBounce sits behind Cloudflare (HTTP 429 / "error 1015" on bursts) — throttle bulk runs ≤1 req/1.5s.

### 2026-06-11 — Notion P1 board triage + olera.care human-send email auth FIXED (DNS-only session, repo untouched)

Two threads, neither touching the codebase (DNS + Notion + memory only — `git status` stayed clean all session).

**1. Notion board triage (Web App roadmap, Owner=TJ).** Audited all 4 P1s + the 36 remaining To-Dos against current code via parallel Explore agents. Headline: 3 of 4 P1s were already shipped (SBF V3 cutover `c749e993`; both outreach enrichers `3cc152b1`) — closed/reframed. Broader sweep: closed Hero image library + WEB-08 (done), archived SMS-toggle + WEB-07 (obsolete), rescoped 3 partials (deletion audit trail → only "source" field left; draft_reviews → UI wiring; Benefits CMS → write path), marked staffing-outreach Done (Logan owns it in a separate flow — corrected the stale "staffing retired" memory; it's still live in-repo). Caught + reversed one bad close: the "Fix " card *looked* empty but was the email-auth task below — title was truncated by an inline `olera.care` link in the list view.

**2. olera.care human-send email auth FIXED (Notion P2 → Done, live-verified).** Manual Gmail sends from @olera.care (TJ/Logan/Graize) were landing in spam — mail-tester 4/10, driven entirely by a −6 SPF/DKIM/DMARC auth fail. Two root causes, both fixed in Cloudflare DNS + Google Admin: (a) duplicate root SPF (Google + leftover Squarespace = RFC-7208 PermError) → merged to one `v=spf1 include:_spf.google.com include:squarespace-mail.com ~all`, deleted the standalone Squarespace record; (b) no Google DKIM → published the Workspace 2048-bit key at `google._domainkey` (Cloudflare auto-split the 408-char value, correct) + clicked Start Authentication. Re-test **10/10**, "properly authenticated" green. Resend transactional path verified unaffected throughout (own `resend._domainkey` + `send.olera.care` envelope SPF — the broken root SPF never touched it). → memory `project_email_deliverability` updated; Slack-noted to #ai-product-development.

**Next up:** remaining open P1 work = connect-two-sides remnants (email-quality badge, lead-outcome cron, `connection_succeeded` event) + the overdue SBF V3 keep/kill decision (variant's been live at ~60% — pull the funnel and call it). Squarespace SPF include can be trimmed later if olera.care no longer sends via Squarespace.

### 2026-06-17 — Admin overview provider count: show live listings, not raw table total (branch `codex/admin-provider-live-count`)

**What:** Fixed the admin Overview "Provider Directory" stat after DB analysis showed `olera-providers` has 115,598 total rows but only ~74,139 active/live listings; the rest are soft-deleted data-sweep cleanup rows. The card was misleading because it fetched `/api/admin/directory?tab=all&count_only=true`, which intentionally includes deleted rows.

**Change:** `app/admin/page.tsx` now fetches `/api/admin/directory?tab=published&count_only=true` and renames the card subtitle from "Total providers" to **"Live listings"**. This reuses the existing directory API's published scope (`deleted IS NULL OR false`) instead of changing API semantics for other screens.

**Verification:** Static sanity check clean. `npm run lint` could not run in this worktree because `node_modules` is missing (`next: command not found`).

**Next up:** Push/open PR, let preview/staging confirm the card shows the ~74k live count, then merge/deploy.

### 2026-06-10 — Editorial freshness: /caregiver-support/ decay audit + byline refresh-date emphasis (branch `modest-nobel`)

Worked through the "Olera Action Items" Notion board. Two items shipped, one archived.

**1. Freshness audit across /caregiver-support/ (Notion P2 → Done).** Built `olera-hq/scripts/audit_caregiver_support_decay.py` — extends the old 2-URL `diagnose_editorial_decay.py` into a full content-group audit: 6mo daily GSC per article, first-half/second-half Declining/Flat/Growing classification, ranked by clicks-lost-per-day. Output: `olera-hq/strategy/seo/caregiver-support-decay-audit-2026-06-07.md` (committed locally to olera-hq, `b69882e`, not pushed).
- **Sanity check PASSED:** VA page ranked #1/Declining; BCBS independently classified Flat (-10%) — reproduced both known diagnoses.
- **Headline:** 82 of 89 articles are Negligible (sub-0.3 clicks/day). Real refresh queue is ~3, not 83. The one clean NEW candidate for Logan: `how-to-prove-primary-caregiver-custody` (-34%, 146 clk, pos 4.0→5.6).
- **Gotcha (durable):** GSC service-account calls were stalling ~75s each via an IPv6 happy-eyeballs black-hole on googleapis.com. Fix baked into the script: monkeypatch `socket.getaddrinfo` to AF_INET only → <1min full run. Reuse this for any GSC script on this machine.

**2. Byline refresh-date emphasis (commit `f4a4ea7d`, this branch).** TJ spotted that `how-to-prove-primary-caregiver-custody` — which Logan refreshed May 1 2026 — still showed the 2024 publish date prominently with "Verified May 1, 2026" as an equally-subtle tail, burying the refresh for readers AND Google's freshness crawl. Fixed in `app/caregiver-support/[slug]/page.tsx`: when an article was re-verified >1 day after publish (`REFRESH_MIN_GAP_MS` guard), byline now leads with prominent **"Updated {date}"** (gray-700/medium) and demotes original to subtle "originally {date}" (gray-400). The 83 never-refreshed articles unchanged; standalone VA/Texas pages have no byline date so untouched. Verified rendering in-browser + screenshot; `/pre-test` review clean (0 bugs, tsc 0 errors).

**3. Archived moot 410 ticket** — "Provider page returns 410 Gone" Notion P5 → Archive (deleted providers already 301-redirect; PR #983 was built+closed for the same reason; the 410 bucket is empty).

**Local-env note (not a code bug):** the anon key in `~/Desktop/olera-web/.env.local` is INVALID ("Invalid API key") — local dev can't read Supabase via the normal client path until refreshed. Production is fine. I temporarily aliased anon→service-role in a disposable worktree `.env.local` to render the page, then deleted it.

**Next up:** TJ's call on whether to PR the byline change to staging (this quicksave does it). Other board items remaining are TJ's manual provider follow-ups + P2/P3 SEO investigations (`anytime-home-care-il`, Always Best Care WA).
### 2026-06-10 — Provider-comms system SHIPPED end-to-end (decay → governance → cadence) + automations next-run forecast

The arc TJ set out on — distribute provider emails through the week + learn rapidly — is built, with the governance layer it needed underneath it. Most of it is in production.

**SHIPPED TO PRODUCTION (main):**
- **Question recency decay** (#997 → #998). Digest was 99.7% `family_question` (the audience is *defined by* open questions — 3,450, 64% of them >30d old). Now a question only LEADS the digest when fresh (≤30d) or on a ~quarterly resurface; stale → demoted, the provider cascades to other rungs (completion / rank / leads) or goes quiet. Stateless (question-age based). Recipients sorted **send-worthy-first** so the 2,000 cap reaches the activity/rank audience, not just question-holders. `app/api/cron/weekly-provider-digest/route.ts`. → memory `project_question_recency_decay`.
- **Frequency gate (Phase 1) + canonical provider identity** (#1001 → #1002). Caps PROACTIVE NUDGES at **3 per provider per rolling 7d** inside `sendEmail` (the universal chokepoint; **fails open**; transactional/real-time mail always sends + never counts). `lib/email-governance.ts` + `lib/email.ts` (new `skipReason`). Reconciled a same-day collision with Esther's #1000 (both fixed `email_log.provider_id` fragmentation — she → UUID, us → slug): canonical = **`olera-providers.slug`** (only id spanning claimed+unclaimed AND matching `provider_activity` / the conversion dashboard; `bp.slug` is a legacy id for ~16% of claimed). Shared resolver `lib/provider-identity.ts`; reverted her UUID + fixed my `bp.slug` in unread-reminders / matches-unread / reengagement-blast. `send-deferred-notifications` left on UUID (transactional → dashboard-attribution fast-follow). → memory `project_provider_comms_governance`. Messaged Esther (#ai-product-development).
- **Through-the-week cadence** (#1003 → #1004). Digest Monday-only → **Mon–Fri** (`vercel.json` + `lib/crons/registry.ts` synced). Each provider on a fixed weekday (hash of id); ~1/5 audience/day; each provider still ≤1 digest/week so the decay math is unchanged. `?all_days` override + `dayBucket` stamped in the run summary. Pre-test caught a rank-eligible double-send (legacy-id key vs slug key → two buckets) — fixed with a hybrid key.

**ON STAGING (pending promote):**
- **#967** "cold mail off olera.care" — rebased (was 62 behind, conflicting with the gate in `lib/email.ts`) + merged. Removes `weekly_analytics_digest` from the off-domain set: keep the healthy, brand-recognized digest on olera.care (its weekly burst shouldn't land on the warming oleracare.com). Coexists cleanly with the gate.
- **#1005** `/slack-notes` command updated with this session's ship-note learnings (lead with the quantified change; tag most-involved first; don't read TJ-hq SCRATCHPAD for Slack tone — it's documentation voice). Merged.

**OPEN PR #1006 — automations "next run" forecast + header refresh:**
- New forward-looking line on `/admin/automations/[id]`: next-run time (dependency-free cron parse, UTC→ET, weekday-aware) + **~anticipated sends** + ~duration. Display-only, zero backend/cost — estimates from recent post-cadence weekday runs (current daily; cold-start bootstrap = last sent ÷5). Pre-test caught + fixed a too-short cron scan cap (quarterly cron returned null). `app/admin/automations/[id]/page.tsx`.
- Header visual refresh from a `/ui-critique` (grounded in TJ's Design Inspirations folder — Perena/Robinhood/Wise): elevated the Next-run block into a calm surface with the send count as a confident **teal** number; trimmed the schedule meta (full schedule → Details); description recedes. **Awaiting TJ's visual QA on the preview.**

**Learnings → memories created this session:** `feedback_cron_schedule_registry_sync` (vercel.json cron change needs a `lib/crons/registry.ts` edit or the build fails on a prebuild guard — tsc/eslint stay clean; pull the real log via `vercel inspect --logs --scope olera`), `project_question_recency_decay`, `project_provider_comms_governance` (incl. Esther = GitHub `Efuanyamekye`).

**Next up:**
- QA + merge #1006 (visual). Held two optional touches: a recent-sends sparkline + live-ticking time.
- Promote staging → main (carries #967, #1005, and #1006 once merged — note: `vercel.json` already promoted with the cadence, so the cron is live Mon–Fri).
- `send-deferred-notifications` → canonical slug (fixes conversion-dashboard attribution for question/lead emails).
- **WATCH the first weekday cron runs:** even daily send counts, `family_question` share drops, `nudge_cap` skips appear in skipReasons, and the forecast flips from the ÷5 bootstrap to real weekday data. (Cap runs ~7 days lenient until old-key rows age out.) Side note surfaced: some past Monday digest runs stuck `status="running"` (timeouts on the big batch) — the weekday cadence should largely fix it.

### 2026-06-09 (late) — T1 deliverability SHIPPED + VERIFIED: provider notifications now send from `oleracare.com`

**Supersedes the "T1 ops never done (the real blocker)" note further below — T1 is now DONE and live in production.**

**What happened:** the #967 code (env-gated `PROVIDER_NOTIFY_FROM` split in `lib/email.ts`, `resolveFromAddress`) is in production. Tonight TJ did the ops, and they were far simpler than the planned runbook:
- **Domain LOCKED:** `oleracare.com` (TJ chose it over seniorlistings.net), and the **root** — NOT a `notify.` subdomain. KEY DISCOVERY: `oleracare.com` was **already verified in Resend** (added ~6mo ago via GoDaddy) → the entire subdomain/DNS/SPF-merge runbook was MOOT. Zero DNS work.
- **Vercel env (Production + Preview, both Sensitive = write-only):** `PROVIDER_NOTIFY_FROM = Olera <noreply@oleracare.com>`, `PROVIDER_NOTIFY_REPLY_TO = hello@olera.care`. Redeployed production (the #996 deploy) to activate — env vars only attach to deployments created after they're set.

**VERIFIED via email_log + the actual delivered email:** test `question_received` → `tfalohun@gmail.com` from `Olera <noreply@oleracare.com>`, Reply-To `hello@olera.care` (subject "A family has a question about Aggie Assisted Living"). All provider-directed sends ≤14:19 UTC were `olera.care` → clean cutover at the redeploy (~15:00 UTC on). Family nudges (`welcome`/`publish_nudge_*`/`completion_nudge_*`) correctly STAYED on `olera.care`. The Reply-To header only gets set on the oleracare.com path (`lib/email.ts:363-367`), so its presence is independent proof.

**Gotcha resolved live:** TJ saw a family "Aggie Home Care is waiting to hear from you" nudge from olera.care and thought T1 failed — that's a *family* email (to the care seeker), not in the rerouted provider set; correctly stays on the crown jewel.

**Watching (passive, no action):** that the ~7.2% bounce lands on `oleracare.com` and its reputation holds sharing space with the cold/Loops stream over a few days. Reversible: delete `PROVIDER_NOTIFY_FROM` in Vercel + redeploy → back to olera.care.

**Separate follow-up (NOT T1):** family-nudge copy "Aggie Home Care is waiting to hear from you" reads like "Aggie" is a person's name — needs a copy pass.

**Durable handoff:** Notion "Branch Handoff Reports" page (updated to VERIFIED). Also note: `staging` == `main` (delta 0); completion preview #984 already live in production.

### 2026-06-09 — Per-variant conversion + weekly leads-recap variant (branch `variant-conversion`, PR #993, awaiting copy approval)

**Outcome:** Two layers on the digest variant dashboard (#982). Both committed, pushed, type-clean. Holding the merge for TJ's read on the leads-email copy.

**Phase 1 — per-variant downstream conversion.** Added a **Converted** column to the by-variant table: share of *delivered* sends whose provider took the variant's goal action within **14 days**, last-touch attributed (no double-count across the weekly cadence). Each variant → one distinct `provider_activity` event: family_question→`question_responded`, leads→`lead_opened`, completion→`profile_published`, cold_rank→`claim_completed`, weekly_digest→`one_click_access`. Cron sends one variant per provider per run + distinct events ⇒ unambiguous attribution. Conversion is the honest signal (opens are Apple-Mail-inflated).
- `app/api/admin/automations/[id]/route.ts` — `provider_id` added to email_log select; `vSends` per variant; fetch `provider_activity` over the window; `countConverted()` last-touch helper; returns `converted/convRate/convEvent/convLabel`.
- `app/admin/automations/[id]/page.tsx` — Converted column (funnel-end, before Bounced) + header InfoDot explaining the 14d model.

**Phase 2 — weekly leads-recap variant.** Providers with `bucket.leads>0` got the generic digest; now get a dedicated "A family reached out about you" recap, CTA→ connections inbox. Outranks all but an open question; short-circuits completion + the market-rank resolve (no wasted Places call). Distinct from real-time `connectionRequestEmail` (this is the Monday nudge). Wired end-to-end into the dashboard (labels, order, classifier, conversion map, sample, tooltip).
- `lib/email-templates.tsx` — `providerLeadDigestEmail()` (house style, no em-dashes, singular/plural).
- `lib/claim-tokens.ts` + `app/provider/[slug]/onboard/page.tsx` — new `"leads"` magic-link destination → `/provider/connections` (mirrors the `"market"` addition).
- `app/api/cron/weekly-provider-digest/route.ts` — `hasLead` gate, `leadsUrl`, html/subject/variant branches.
- `app/api/admin/automations/[id]/preview/route.ts` — `leads` sample.

**Pre-test:** clean. Verified `email_log.provider_id` exists (mig 024) before adding it to the select; confirmed the html/subject/variant ternaries are mutually exclusive (no mismatch); `countConverted` can't exceed delivered; 7-column table alignment. Fixed 1 stale tooltip (weekly_digest no longer lists "leads"). **Blind spot to watch on staging:** if Converted shows "—" for ALL variants with sends → provider_id format mismatch between email_log and provider_activity. First leads sends + real conversion data land Mon Jun 15.

### 2026-06-09 — Provider engagement build: completion carrot Phase 1 + Phase 2 preview both MERGED to staging

**Strategy (Notion "Provider Engagement Reframe" `3795903a-0ffe-8174…`; memory `project_engagement_reframe`):** ONE ladder = provider discoverability/chooseability. Completion = activation milestone (juiciest carrot), reviews→rank = recurring engine, answering = episodic conversion (69% of providers get 1 question ever). Digest = the recurring trigger surfacing each provider's next rung.

**Shipped/merged this session:**
- **T1 — `question_received` off olera.care:** PR **#967** (env-gated `PROVIDER_NOTIFY_FROM` split; digest stays on olera.care). **STILL OPEN — not merged, and INERT.** Analyzed clean-to-merge (51 behind staging but no semantic conflict with #982's `lib/email.ts` variant change — staging only references the renamed const in the 2 spots #967 renames). **CONFIRMED this session: the oleracare.com OPS WERE NEVER DONE** — that's the real blocker, not the merge. T1 goes live only when ALL of: (1) #967 merged [code, inert], (2) oleracare.com verified in Resend + DNS added at GoDaddy **MERGING the SPF with Loops'** existing record (one TXT, not two), (3) `PROVIDER_NOTIFY_FROM`/`PROVIDER_NOTIFY_REPLY_TO` set in Vercel. Steps 2–3 are TJ-only (dashboard/DNS; the WAF blocks the assistant). TJ started "do the ops now" then paused. **Open question worth revisiting: oleracare.com already carries Loops cold outreach (Logan flagged flakiness) — reusing it mixes streams; a clean cousin domain (seniorlistings.net) was the alternative.**
- **Step 1 (ID resolver) — VALIDATED, no build needed.** `lib/provider-id-variants.ts resolveCanonicalProviderKeys` already exists; running the non-answerer join through it collapsed the bogus "85% no-notify" artifact → real funnel (unreachable 27.6% · delivered-not-opened 42.2% dominant · …). Apply per-feature.
- **Completion carrot Phase 1:** PR **#978** (merged) — claimed providers w/ no owner story get a "sell the output" digest variant + `/api/claim-complete` one-click auth + `?edit=<section>` deep-link. **Reconciled with #966** (parallel cold-rank expansion that hit the same cron) into one router: question > completion > cold-first-contact > rank > analytics.

**Phase 2 preview (PR #984 — MERGED to staging `a5b219b8`, clean squash, zero file overlap):** in-dashboard "Preview as families" toggle → `FamilyViewPreview` (family-framed view of their page; ghosts for empty high-impact sections led by the owner story; per-section Edit). Iterated hard via /pre-test + /dejank + /mobilize + /ui-critique: fixed broken-thumb (Next optimizer racing fresh Supabase uploads → `unoptimized` on owner-only thumbs), EditAbout (Bed Count gated by category — robust to mixed enum/label data; fields marked optional), and a full mobile pass (de-nested containers → divider-led layout Robinhood/Wise-style, utility-bar header, name-as-hero killing the flex-row ladder, hide completeness banner). **Awaiting TJ's mobile QA on the PR preview link.**

**Decisions:** completion is claimed-only (warm; keeps cold volume off the crown jewel); preview reuses public-page section pieces, NOT the public server component (SEO/CTA-router/reverted-mobile-nav-500 traps); mobile = no card-in-card, dividers do the work; rank stays Google-pure (never inflated by completion).

**Next up:** (1) **T1 is THE open thread** — merge #967 (clean+inert) AND do the oleracare.com ops (NOT done; TJ-only dashboard/DNS work; the WAF blocks the assistant from the cron) — or reconsider the domain (oleracare.com mixes with Loops; seniorlistings.net is cleaner). Until the ops are done, `question_received` still bounces 7.2% on the crown jewel. (2) Completion carrot is otherwise live end-to-end on staging (Ph1 #978 + Ph2 preview #984) — NOT yet promoted to main. (3) Follow-ups: heavier preview sections, "see your page" link from the completion email, dedicated dormant-claimer audience source, non-answerer diagnose-then-respond system (data now legible via the resolver). Variant-stamp + admin variant-visibility already shipped to staging in TJ's parallel branch (#982).

### 2026-06-09 — Remove "Submissions by Entry Source" from admin analytics (branch `noble-mendel`, PR open)

**Outcome:** Deleted the unused "Submissions by Entry Source" section from the admin analytics panel — TJ confirmed no one uses it. Pure deletion, 213 deletions / 1 insertion.

**What changed:**
- **`app/admin/analytics/page.tsx`** — removed the `<CollapsibleSection>`, the `EntrySourceCard` + `EntrySourceStat` components, the `EntrySourceBreakdown` interface, and its fields in `SummaryResponse` (windowed + prior).
- **`app/api/admin/analytics/summary/route.ts`** — removed the `accounts.signup_source` query (one fewer Supabase call per analytics request), the `EntrySourceBreakdown` type, `EMPTY_ENTRY_SOURCE_BREAKDOWN`, the bucketing loop, and all `entry_source_breakdown` payload fields. `accountsQ`/`accountsRes` dropped from the `Promise.all` (13 queries now, destructuring matches).

**Pre-test review caught 1 leftover:** an orphaned doc comment from the deleted `EntrySourceCard` was stranded above the unrelated `FunnelStat` function — removed it. Repo-wide grep confirms zero remaining references; `tsc --noEmit` = 0 errors.

### 2026-06-07 — New `/promote-to-main` slash command + shipped #955 to production

**Outcome:** Built a reusable staging→main production-promotion command and used it to ship the pending delta live.

**What shipped:**
- **`.claude/commands/promote-to-main.md`** — new `/promote-to-main` command. Models `/pr-merge`'s rigor but adapted for the reverse direction (cumulative staging→main promotion, not a single feature branch into a moving target). Phases: delta/changelog → production pre-flight (staging CI green, deploy health, migration/env-var awareness) → report → production confirmation gate → create merge-commit PR + merge as TJ → prod smoke-check → Notion report. Supports `<summary>` arg and `--dry-run`.
- **Promotion executed:** PR **#956** (staging→main) merged → main now at `af6bc1d1`. Shipped **#955** (Family & Lead Experience: email previews, analytics cleanup, engagement tracking fix) to production. Pre-flight was clean (staging CI green, main confirmed strict subset of staging).

**Key mechanic learned — DON'T use commit-count for the staging↔main hazard check.** `git rev-list --count origin/staging..origin/main` reads ~45 even when main is a perfect subset, because staging accumulates **squash** commits while main records **merge** commits (SHAs diverge by design). The reliable signal is **content-level**: `git diff --stat origin/staging origin/main` should be the exact inverse of the promotion delta (same files, ins/del swapped). The command was fixed to use this, not the misleading count.

**Known gap (flagged to TJ, not yet decided):** the command does NOT port `/pr-merge`'s Phase 2.5 critical-file watchlist + indicator spot-checks (Footer discovery zone, GA4, canonicals, redirect count). Reasoning: in the promotion direction the inverted-hazard subset check structurally subsumes "silent loss of a main feature." Open offer: add those specific indicator assertions to Phase 6 post-deploy verification if TJ wants belt-and-suspenders.

**Note:** #956 promotion touched `vercel.json` (+12, cron/route config) — first place to look if prod behaves oddly.

### 2026-06-06 — Benefits pipeline: PUBLISHED NY (Ces QA) + FL (State Page QA) → PR to staging (awaiting TJ merge)

**Outcome:** Applied all QA corrections, set programs `approved`, regenerated `drafts.ts`, opened PR → staging. **TJ merges to publish** (he asked to "come in at the end"; per CLAUDE.md only TJ can merge anyway). Branch `publish-benefits-ny-fl`.

**What shipped:**
- **NY (17/17 approved):** Pulled Ces's per-program corrections from her Notion QA queue (`035ff597…`) via 17 parallel subagents — each applied her Numbers/Phone/LINKS/COPY/STRUCTURE/FAQ scripts to the program in `data/pipeline/NY/drafts.json` AND web-verified every changed number against .gov sources (TJ's second-review ask). Highlights: MSP → no asset test (nulled assetLimits, QMB/QI tiers $1,856/$2,494), HEAP phone → 1-800-342-3009, SCSEP income $1,663 (125% FPL). Kept SNAP age **60** (the factcheck's "65" flag is wrong — senior SNAP/ESAP = 60). Fixed 3 agent-flagged internal contradictions (Enhanced STAR applicationNotes, SCHE FAQ#5, WRAP 15-yr alignment).
- **FL (14/14 approved):** Applied the "FL — State Page" QA corrections (HCE income $2,829 + reframed as $160/mo caregiver subsidy, LIHEAP crisis max $2,000, PACE → statewide, Meals on Wheels no fixed limit, ADI/SHINE human-touch intros). Agent caught 2026 Part D cap = **$2,100** (QA doc said $2,000 = 2025). Flipped remaining 11 FL programs to approved.
- **TX = already done** (verified `star-plus-medicaid-hcbs` has correct 2026 values $2,982/$752k; `cba-waiver` is a stale legacy **duplicate** left unapproved — duplicate cleanup is out of publish scope per CA precedent).
- **CA = already done** (#854; 14/17 approved; 3 deliberately-deferred drafts left as-is: CBAS, SSP, Property Tax Postponement).

**Key mechanics learned:** state pages render ALL pipeline programs **regardless of contentStatus** (status only drives the admin dashboard badge), so corrected content goes live only after `drafts.ts` regen. Regenerated ONLY NY+FL `drafts.ts` (replicated `cleanStateEntry`+`writePerStateDraftFile`, not `--regen-index`) — matches prior publish convention (TX #857 touched only `{ST}/drafts.json`+`drafts.ts`). `cleanStateEntry` filters incomeTable rows lacking numeric householdSize.

**Skipped this session:** author-bio action item (Logan→Ces) — TJ deselected it.
**Open / follow-ups (flagged, non-blocking):** TX `cba-waiver` duplicate cleanup; FL legal-services/CCE/elder-options were marked approved on prior review (no fresh pass this session); minor SNAP intro-vs-table threshold-basis nuance noted in NY reports (`/tmp/ny-reports/`).

**Original context:** `/benefits-pipeline` invoked with a Slack "Senior Benefits Update" screenshot. TJ picked **publish FL, CA, TX, NY** (state pages). Skipped the author-bio action item (Logan→Ces) for now.

**What I found (reconciled Slack note vs. actual `data/pipeline/{ST}/drafts.json` + git history):**
- **CA** — programs 14/17 `approved` ✅ (PR #854 merged). State overview = no status. Gap = publish the **state overview** only. (drafts.json has 0/17 `lastVerifiedDate`.)
- **TX** — programs 11/12 `approved` ✅ (PR #857 merged). State overview = no status. Gap = **state overview** only.
- **FL** — programs **3/14 approved** (8 still `pipeline-draft`, 3 `under-review`). Gap = overview + decide on the 11 unapproved.
- **NY** — programs **0/17 approved**, all `pipeline-draft`. "Ces completed NY" = her QA corrections are in the **Notion QA queue** (`035ff597-d5ff-4813-b744-6f717e77dbe0`), NOT yet applied to drafts.json. Gap = apply Ces's Notion corrections FIRST, then publish + state page.
- **All 4 `stateOverview`s have no contentStatus** — the state *pages* were never published. Matches Slack "State pages QAd but not updated."

**Factcheck high-severity flags to triage before publish:** FL SNAP age 60→65 + income_1 $1,255→$2,610; TX CBA Waiver age 21→65; NY MSP assets_individual $9,950→$33,308, NY SNAP age 60→65, NY HEAP assets $2,500→$3,750. Some are likely the known age-parser false-positives (SNAP-60 is intentional per MI learnings), some may be real.

**BLOCKED — two questions posed to TJ, awaiting answer:**
1. **NY** — pull Ces's corrections from her Notion QA queue and apply, or publish NY's current drafts as-is? (I started the Notion query; TJ interrupted.)
2. **Factcheck flags** — fix before publishing, or publish + flag for follow-up?

**Publish mechanism reference:** memory `project_benefits_publish_mechanism` — corrections land in `drafts.json` (set `contentStatus: approved`), regen ONLY that state's `drafts.ts` (not `--regen-index`, avoids churning all 50 states' timestamps), legacy-shadow check in `data/waiver-library.ts`. Worktrees have no node_modules → can't `next build` locally; staging CI compiles.

**No repo changes this session** — investigation/triage only. Resume = answer the 2 questions, then execute publish for all four.

### 2026-06-05 — Find Families v2: pinned nearby seekers + calm-premium card (PR #936 → staging, OPEN)

**What:** The provider Find Families page now leads with **"Your Market"** (the diagnostic) and pins a **real published care-seeker within 50 mi** on top when one exists — replacing the national-families browse list that showed a TX provider families in Maine. Branch `market-noleads-alert`, worktree `market-phase2`. PR #936 bundles: the no-leads Slack/Activity alert, the pin + reach-out wiring, a mobile pass, the coordinate foundation, and a dedicated calm-premium card.

**Key decisions:**
- **Catchment = 50 mi haversine**, not exact-city (which hid Austin families from a Round Rock provider). Pinned seekers above the diagnostic; diagnostic = the product, seeker = the scarce cherry.
- **Coordinates** (the real unlock): `business_profiles.lat/lng` was universally null. Providers' real coords live in **`olera-providers.lat/lon`** (TJ caught my wrong-table diagnosis); seekers have none but carry a **city** (inherited from the provider they connect to, via `syncIntentToProfile`). Fix = provider coords from olera-providers (exact, at claim-finalize) + seeker coords city-resolved (`lib/profile-coords.ts`) at the ~3 city-setting write points. **No cron** (TJ: tech-debt) — write-time + a re-runnable backfill (`scripts/backfill-profile-coords.ts`, **APPLIED: 1,341 rows; live data change that also un-broke Esther's Near You tab**).
- **Dedicated `PinnedSeekerCard`** (not Esther's browse card) — reuses her data derivations (now exported), but calm-premium: warm paper, one amber accent (the need), teal for the action only, flat button, slow-breathe header. Taste pass killed the emoji / color-soup / box-in-box.

**Verified live:** Aggie Assisted Living (College Station) pins **Test McTest (0 mi)** + **George Cox (Caldwell, 24 mi)** — proving nearby-cities catchment. Coverage: providers 917/924, pin-eligible seekers 53/53.

**Open / next:** ⚠️ apply **migration 100** in Supabase at merge (no-leads event CHECK). Merge **#936 before #935** (the gate flip) so rollout ships the pin, not the exact-city blind spot. Deferred (both marginal, noted): ZIP-level seeker precision; the diagnostic's "Olera sees N families" footnote. **Resume:** TJ QAs #936 preview → merge #936 (+migration 100) → merge #935 → flip gate live.

### 2026-06-05 (Thu) — New `/notion-report` slash command (branch `radiant-snyder`)

**What:** Built `/notion-report` — a mid-project **branch handoff** command that publishes a resume-ready page to Notion. Distinct from `/save` (SCRATCHPAD session log) and `/pr-merge` (post-merge record): this is the "I'm pausing this branch" artifact, optimized for picking work back up cold after compacting.

**Report shape** (modeled on the proven "Market Diagnostic — Phase-2 Resume" handoff page): Where it stands → Worktree (find-branch `cd` line) → Resume command (paste-after-compacting prompt) → What's next → **⚠️ Blind spots & open risks (required, non-skippable)** → Key pointers. Runs autonomously; prints the `cd` line back to terminal.

**Decisions:** (1) publishes to a NEW dedicated Notion DB **Product Development › Branch Handoff Reports** (data source `e3014bc0-3a03-40ed-9c09-a66994fb9e78`) with Branch/Worktree/Status/PR/Date props — hardcoded ID like `/pr-merge` does. (2) Blind-spots section is load-bearing (TJ's explicit ask). (3) Lives in `.claude/commands/notion-report.md` alongside the other olera-web commands (NOT TJ-hq — that's for personal cross-project skills).

**Files:** `.claude/commands/notion-report.md` (new).

**Next:** none — self-contained. Future: could auto-set Status from git state, or call `/save` first automatically.

**Post-merge session work (Notion + PR triage, no repo changes):**
- **#940 merged** to staging (the command itself), report filed to PR Merge Reports.
- **PR cleanup** of stale open PRs: closed **#872** (email-deliverability scratchpad) + **#897** (2026-05-30 session log) as superseded — both pure stale/already-shipped, branches handled (delete vs keep-if-live-worktree); reports filed. Archived **#864** (provider-page custom work, 226 behind) by closing it but **keeping the branch** as a GitHub back-pocket reference (not merging to staging). Left open: **#878** (Medicaid look-back article — real unpublished content, needs reconcile/abandon decision), **#935** + **#936** (active Market Diagnostic work).
- **Notion consolidation:** created the **Branch Handoff Reports** DB (Product Development), then gathered 5 scattered handoff/resume pages into it (2× Market Diagnostic resume, Email Deliverability resume note, Slack MCP OAuth note, Weekly provider digest runbook) + backfilled props. Removed 4 stray columns (Owner/Priority/Product Category/Timeline) dragged in by the move to restore the clean 6-prop schema. DB: `eb2362fd189041f6813af6d4dee9b92c`.

### 2026-06-04 — Market Diagnostic PHASE 2: compute-on-visit for any city (PR #924 → staging, OPEN)

**Goal:** the diagnostic works for **any provider's city**, computed on first visit + cached — not College-Station-by-hand. Then flip `lib/market-gate.ts` for rollout.

**Decided lazy-only (NOT batch), grounded in live data:** pulled `get_coverage_summary()` → **74,159 providers / 4,008 cities; top 100 cities = only 12.8%** (Houston #1 = 0.3%). Flat tail, no head to batch; and only a sliver of providers ever open Find Families → a batch would be ~90% wasted spend. So compute a city only when a real provider lands on it; cache shared by city×care-type (2nd provider in a city = instant). (Earlier I misread a stale `24MAR` CSV showing 38K/2K — TJ corrected; live numbers above.)

**Built (branch `market-diagnostic-phase2`, worktree `/Users/tfalohun/.claude-worktrees/olera-web/market-phase2`):**
- **migration 098** `market_diagnostics` (city,state,care_type → data jsonb, status pending|ready|failed, cost_estimate; unique triple; atomic pending-claim). **APPLIED by TJ + verified** (table writable, CHECK enforced, probes cleaned).
- **`lib/market-diagnostic/`** — engine ported to server TS: `resolve` (free city→lat/lng+ZCTA from `data/geo/city-zips.json`, a slim port of the expansion-map cities.json — no geocoding), `fetch` (Places+Census+Olera; **lean** = referral queries 1 page + 2 weakest roles dropped → ~40% fewer Places calls → ~$1/city/~90s), `analyze` (Haiku; output shape == committed `*.analysis.json`), `cache` (serve/claim/write, **90-day TTL** stale-while-revalidate, **$300/mo circuit-breaker** + Slack).
- **serve route** cache-first; miss → claim pending + compute in background via Next `after()` → `{status:"building"}`; committed CS file served from disk as zero-cost fallback (no regression). **client** `FindFamiliesMarketView` polls until ready, `MarketLoading` softens to "still building, check back" after ~20s (TJ's pick). **admin** `/api/admin/market-backfill` (GET seed/warm/status + month spend).
- **Validated live (CS, ~$1 real spend):** 97s, $1.03, 20 competitors, Comfort Keepers #1 @15.3% SoV, 76 referral sources. `tsc` clean (only pre-existing dep-skew).

**Next:** #924 merges → watch cost/quality on a few real cities → flip the gate. Notes: `maxDuration=300` assumes Pro (confirm; cron-drain fallback in plan); city-own-ZIPs → city-scoped demand vs CS file's metro number. Plan: `plans/market-diagnostic-phase2-plan.md`. Memory: `project_market_diagnostic`.

### 2026-06-04 (Wed) — MedJobs MASTER PLAN drafted

**Context:** Logan asked for one master plan capturing everything we've discussed across all sessions — completeness before phasing. Goal: source of truth so nothing important is lost as planning has evolved.

**Drafted:** [`plans/medjobs-master-plan.md`](plans/medjobs-master-plan.md) (686 lines, 14 sections). Structured as a CATALOG that points to canonical detailed plans, NOT a re-specification. Each item carries a status tag (SHIPPED / STAGING / LOCKED / SKETCHED / GAP / DEFERRED / OUT-OF-SCOPE) so the depth disparity from v3.1 reconciliation stays visible.

Sections:
1. North star + funnel architecture
2. Architecture summary (state model, G1-G10 discipline, outcomes map)
3. What's already SHIPPED (Pre-Flight v9.x Research Card consolidation, Pre-Flight call modal, Decision Maker single-slot, "Mark not available" flags, Smartlead bridge PR #900, catchment correction PR #919, Find Email/Form enrichment PR #925, Connections tracker, pre-existing CRM scaffold)
4. What's LOCKED but not built (17 sub-items from v3 plan — cadence, terminal state, magic-link journey, four-axis state, welcome page, empty-state ladder, T&C triggers + UX, pilot activation API, co-tenancy, deletion policy, pilot tier, engagement tracking, token security, Smartlead webhook expansion)
5. CRM operational surfaces SKETCHED (in-basket tabs locked but P2.A-F at light depth — Calls 6 lines, Emails 39, Meetings 49 vs P1.E magic-link 311; plus gaps for engagement→call priority, returning-provider experience)
6. Items requiring deeper specification (truly missing: Smartlead-inbox deep-link, Calendly cancel/reschedule, post-meeting sub-state machine, pilot-metrics dashboard, feedback collection, dormancy re-engagement, brand-consistency one-liner)
7. Adjacent/parallel systems (student-side flow OUT, stakeholder funnel SHIPPED, multi-team-member DEFERRED, pilot continuation DEFERRED, etc.)
8. Canonical references table
9. Decisions log consolidated (Pre-Flight redesign + v3 13 questions + infrastructure constraints)
10. Open items / unresolved
11. Risks consolidated
12. Provisional phase structure (Phase 0 Pre-Flight DONE / Phase 1 Conversion MVP LOCKED / Phase 2 Operational surfaces with strategy-depth-pass-first / Phase 3 Polish DEFERRED)
13. Glossary
14. Master plan status

**Updated 2026-06-04 (Wed) — Phasing breakdown added to master plan** ([§12](plans/medjobs-master-plan.md#12-development-phases), 1000 total lines). Six phases plus out-of-scope, with full traceability matrix mapping every master-plan §§3-7+10.4 item to exactly one phase (or explicit OUT-OF-SCOPE).

**Phase summary:**
- **Phase 0 — Stabilize what's shipped** (~2 days, mostly waiting). QA merge/medjobs-staging-2026-06-02 → staging; Logan Smartlead signoffs; Smartlead env vars + webhook URL registration.
- **Phase 1 — Conversion path MVP** (~23 days / ~4.5 weeks). v3 plan's 11 tickets + brand-consistency one-liner amendment. Cadence + email rewrite + pilot-tier predicate + magic-link infra + preview-mode board + T&C modal + empty-state ladder + co-tenancy + Smartlead open/click webhook + CRM stage signals + deletion guard.
- **Phase 2 — Strategy depth pass** (~3 days, NO CODE). Three parallel passes A/B/C to deepen Calls/Emails/Meetings/Next Step/Timeline specs from concept to ticket-cuttable. Resolves §6.1/6.2/6.3 gaps. Can run parallel to Phase 1 dev.
- **Phase 3 — Operational surface implementation** (~3-4 weeks). 7 tickets: in-basket tab rename + timeline split + Next Step branches + Emails tab + Calls tab + Meetings tab base + Calendly webhook.
- **Phase 4 — Engagement-driven workflows** (~2 weeks). Engagement → call priority bumping + dormancy re-engagement + pilot-metrics dashboard + returning-provider experience.
- **Phase 5 — Pilot lifecycle** (~2 weeks). Pilot expiry behavior + self-serve End-Pilot + provider feedback collection + pilot continuation (needs TJ product decision on post-pilot pricing).
- **Phase 6 — Long-tail polish** (open-ended). Inline Smartlead reply UI / magic-token verification / provider self-serve admin / Calendly migration / multi-team-member support.

**Out-of-scope (tracked separately):** student-side flow (critical: confirm minimum notification path before Phase 1 ships invites at volume); adjacent workstreams (market diagnostic, family-side, benefits, general platform).

**Total to Phase 5 complete: ~10 weeks** at 1 dev. Phase 6 ongoing as demand surfaces.

**Resume next session here →** Logan reviews phasing breakdown in §12 of master plan. If approved, start Phase 0 (QA the staging branch). Phase 1 ticket cutting begins after Phase 0 closes.

**2026-06-04 update — going phase by phase.** Logan flagged the phasing in §12 was at "schedule depth" not "executable depth." Approach now: one detailed plan per phase, stored as `plans/medjobs-phase-N-<name>.md`, reviewed + approved sequentially. Master plan §12 stays as the index.

**Updated 2026-06-04 second pass — Logan reframed into 5 build phases by feature coherence.** He pushed back on the Phase 0 detail expanding into Pre-Flight QA (already done; TJ just needs to merge the branch). New framing:
- **Phase I (~6 wks):** Admin operational backbone (tab redesign, Calls/Emails/Meetings, new cadence, open/click tracking, Calendly webhook)
- **Phase II+III (~3 wks):** Magic link + provider landing experience (ships to prod together)
- **Phase IV+V (~2 wks):** Conversion gate + activation (ships to prod together)
- **Phase VI:** Post-launch ops (deferred, after real pilot providers exist)
- **Phase VII:** Polish + extensions (demand-driven)

Phase 0 obsolete plan deleted. New phase plan files created:
- [`plans/medjobs-phase-1-operational-backbone.md`](plans/medjobs-phase-1-operational-backbone.md) — **DETAILED** plan, 12 bullets, ~1000 lines, ready for Logan scope approval
- [`plans/medjobs-phase-2-3-magic-link-and-landing.md`](plans/medjobs-phase-2-3-magic-link-and-landing.md) — skeleton, detail-pass before build
- [`plans/medjobs-phase-4-5-conversion.md`](plans/medjobs-phase-4-5-conversion.md) — skeleton
- [`plans/medjobs-phase-6-postlaunch-ops.md`](plans/medjobs-phase-6-postlaunch-ops.md) — skeleton, deferred
- [`plans/medjobs-phase-7-polish.md`](plans/medjobs-phase-7-polish.md) — skeleton, demand-driven
- [`plans/medjobs-known-issues.md`](plans/medjobs-known-issues.md) — empty drain log for mid-build findings

**Workflow protocols locked:**
- Plans live in the filesystem, not the conversation. Ideas captured to disk IMMEDIATELY.
- One feature branch per phase pair. Phase 1 alone; then II+III; then IV+V; then VI; then VII.
- Phase complete = acceptance criteria met on Vercel preview → Logan QAs → TJ merges to staging.
- Inter-phase bug fixes: small ones patch staging directly; bigger ones roll into next phase's first commit.
- Logan approves at scope/bullet level. No per-commit gating during build.
- Build log section + Open Issues section maintained per phase plan as build progresses.
- End-of-session: update SCRATCHPAD "Resume here" pointer (reanchors next session in ~5 seconds).
- New sessions start with reading active phase plan + master plan §12.

Master plan §12 rewritten as clean INDEX (phase table + workflow + traceability matrix). Old per-phase detail removed from §12 since it's now in per-phase files. New traceability matrix maps every § 3-7 item to Logan's I-V framing — no decisions lost across the four prior planning passes.

**Resume next session here →** Logan reviews Phase 1 detailed plan ([`plans/medjobs-phase-1-operational-backbone.md`](plans/medjobs-phase-1-operational-backbone.md)) at scope/bullet level. If approved, Phase 0 closes (TJ merges current branch + Smartlead env vars + Logan signoffs on sender/footer/copy) THEN Phase 1 branch is cut and build starts.

**2026-06-04 — MVP COMPLETE. All four phase pairs merged to staging (~33 bullets across 12 weeks of planned work, single session):**
- Phase 1 (PR #926) — Admin operational backbone
- Phase 2+3 (PR #927) — Magic Link + Provider Landing
- Phase 4+5 (PR #928) — Conversion gate + Pilot Active activation

**Staging now at `bd2db628`. Cold-provider conversion path is end-to-end functional once TJ completes activation:**
1. Set `MEDJOBS_MAGIC_LINK_SECRET` on Vercel prod + preview (`openssl rand -base64 48`)
2. Upload `public/medjobs/pilot-agreement.pdf` (template version is fine)
3. Run `npx tsx scripts/medjobs-refresh-smartlead-sequences.ts --apply` to push current templates to existing Smartlead campaigns (addresses Logan's stale-copy bug — Smartlead campaigns are stateful; existing ones retain baked-in sequence text until explicitly updated)
4. Carry-over from earlier phases: Calendly webhook activation (CALENDLY_WEBHOOK_SECRET + URL registered); Smartlead webhook open/click subscription enabled

**Logan QA path post-activation:** open Smartlead admin → spot-check sequence text shows new v10 copy → send fresh test email → click magic link → land on candidate board → activate pilot → board flips to full mode → drawer shows "Pilot Active 🎉" with countdown.

**Deferred items (logged in `plans/medjobs-known-issues.md`):**
- Phase 1 Bullet 8b: full event-stream UI for Emails tab (~3 days; Logan decides post-QA whether minimal-viable suffices)
- Phase 1 Bullet 10b: unmatched Calendly bookings tray (G3 — needs new table)
- Phase 2+3 Bullet 8: explicit preview-mode card UI with disabled-action buttons (moot until Phase 6+ adds the actions)
- Phase 2+3 Bullet 9: catchment filter defaults from ?campus=<slug> (needs campus→geo mapping)
- Phase 4+5 Bullet 5: PDF asset (TJ upload task)
- Smartlead deep-link URL verification (live spot-check during Logan QA)

**What's left (Phase 6 + 7 — deferred for post-MVP-data):**
- **Phase 6 (post-launch ops):** pilot-active dormancy re-engagement, pilot metrics dashboard, provider feedback collection, pilot expiry behavior + Day-T-7 reach-out, self-serve End-Pilot surface. Plan skeleton at `plans/medjobs-phase-6-postlaunch-ops.md`.
- **Phase 7 (polish):** provider self-serve admin tools, pilot continuation (needs TJ pricing input), inline Smartlead reply UI, magic-token verification flow, Calendly migration to Olera org, multi-team-member support. Plan skeleton at `plans/medjobs-phase-7-polish.md`. Demand-driven.

**Resume next session here →** TJ activates secrets + uploads PDF + runs Smartlead refresh script. Logan QAs end-to-end on staging. After confirmation that the conversion path works for at least one fixture provider, decide whether to: (a) promote to main / production, (b) start Phase 6 if a couple real pilot providers exist and need post-launch ops attention, or (c) iterate on the deferred Phase 1 Bullet 8b / Phase 2+3 Bullet 8 / etc. based on QA findings.

**2026-06-04 — PR #925 MERGED + Phase 1 COMPLETE (12 of 12 bullets, ~30 commits).** Branch `medjobs/phase-1-operational-backbone` carries the full Phase 1 build. Tomorrow's resume: Logan QA on Vercel preview, then PR + merge to staging.

Phase 1 build summary (chunked 4-way for review checkpoints):
- **Chunk 1+2** (Bullets 1-6): strategy depth pass + cadence (v9 → v10) + Smartlead webhook expansion (per-touchpoint open/click payload) + tab rename ("Emails") + smart-hide of clients/partners/candidates + timeline split (Upcoming/Past + engagement chips) + Next Step engagement branches + Pilot Active 🎉 ConvertedBody.
- **Chunk 3** (Bullets 7-9): Calls tab sectioned (Today + Upcoming) + clicked-priority sort + per-row purpose hint + 🖱 Clicked pill; Emails tab minimal viable (tab label + Smartlead inbox deep-link button as headlineAccessory).
- **Chunk 4** (Bullets 10-12): LogMeetingModal "Activate pilot" outcome + handleMakeClient extended to set pilot_active_through + terms_accepted_via="admin"; Calendly webhook edge function (INERT until secret + URL registered); Meetings tab sectioned (Upcoming/Needs logging/Finding a time).

**Deferred follow-ups logged in `plans/medjobs-known-issues.md`:**
- Bullet 8b: full event-stream UI (Bounced pinned section + filter chips + EmailEventCard + URL-persisted pagination). ~3 days. Logan decides post-QA whether the current minimal-viable Emails tab suffices.
- Bullet 10b: unmatched Calendly bookings tray (requires new table against G3). MVP behavior is admin sees the booking natively in Calendly's UI.
- Calendly webhook activation: TJ deploys + sets secret + registers URL in Dr. DuBose's Calendly admin (post-staging-merge).
- Smartlead deep-link URL convention: spot-check live during Logan QA.

**Next session:** Logan QA on Vercel preview → if green, PR `medjobs/phase-1-operational-backbone` → `staging` → merge → Phase 2+3 detail pass starts (magic-link + landing experience).

---

### 2026-06-03 (Tue) — Post-launch outreach plan **v3 FINAL** (ready for ticket cutting)

**Context:** Four feedback passes from Logan over one session (v1 → v2 → v2.1 → v2.2 → v3). v3 is the decision-locked final. All 13 questions resolved. Ready to cut MVP Implementation Phase 1 tickets 1–11 next session.

**Locked decisions:** pilot framing (not trial); single terminal state `interview_terms_accepted_at` + new `pilot_active_through` field (3-month timer); magic-link click advances only auth + 2a (account-linkage), terms acceptance advances 2b (claim-status) + 3 (pilot); three actions trigger T&C (Invite + See contact + Save); T&C modal = 4 plain-language reassurance bullets + unchecked checkbox + verb-matched continue; public listing required while pilot active (backend guard blocks deletion); no welcome banner; Logan as the labeled demo candidate; read-only co-tenancy on org-already-claimed edge case; 30-day token TTL; Dr. DuBose's personal Calendly for Phase 2 webhook.

**Plan v3:** [`plans/post-launch-outreach-redesign-plan.md`](plans/post-launch-outreach-redesign-plan.md). Decisions log at top of doc lists every Q with locked answer. 16 strategic shifts (S1–S16). MVP scope: 11 tickets, ~23 days (~4.5 weeks at 1 dev). Phase 2 surfaces (tabs, timeline, Calendly webhook, End-Pilot self-serve) deferred until MVP data flows.

**One assumption flagged for Logan to override if wrong:** Q1 (admin `make_client` ALSO sets `pilot_active_through = now + 90d`) — Logan didn't explicitly address in pass 4; I locked with my recommendation so admin and self-serve paths produce identical state. Override if not.

**Resume next session here →** Cut MVP Implementation Phase 1 tickets 1–11 in the order defined in P1.J. Journey heart (tickets 4 + 5 + 6 + 8) ships as a coupled PR sequence. Branch from staging; no merge until end-to-end works on a Vercel preview.

**Pass 6 (Logan, reconciliation):** Logan flagged that Phase 2 surfaces (Calls/Emails/Meetings tabs, Next Step, Timeline) are at lighter depth than the magic-link journey (P1.E = 311 lines; P2.D = 6 lines). I added a "Reconciliation pass (v3.1)" section to the plan answering Logan's 6 questions honestly. Verdict: phasing is right (ship MVP conversion path first, deepen surfaces second) but doc depth for Phase 2 is genuinely lighter than the discussion warrants. Recommendation: don't promote anything to MVP; add brand-consistency one-liner to ticket 2; deepen P2.A/D/E/F in three parallel passes (A/B/C) during MVP development so Phase 2 tickets are ready when MVP ships. Truly missing items identified (Smartlead-inbox deep-link, Calendly cancel/reschedule webhooks, post-meeting sub-state machine, engagement-driven call priority, returning-provider experience, brand-consistency in email body, admin pilot-metrics dashboard, provider feedback collection surface, student-side flow). Awaiting Logan's call: ship MVP first (recommended) or pause to deepen Phase 2 strategy now (~2 days).

---

### 2026-06-03 (Tue) — Post-launch outreach STRATEGY PLAN v2.1 (no code yet)

**Context:** Logan pushed back on v2's hand-wavy treatment of Δ5 (magic-link as MVP) and Δ6 (just-in-time account creation), demanding rigorous step-by-step modeling of how the cold provider's identity / claim / pilot / verification states interact across the email → click → browse → activate journey. Read the pilot agreement PDF + ran another infra survey (`claim_state` semantics, `account_id` cardinality, conflict handling) before revising.

**Material v2 → v2.1 revisions:**
- Split axis 2 (profile ownership) into **2a (account-linkage, set by magic-link click)** and **2b (claim-status, set by terms acceptance)**. v2.0 had click setting both, which would have spuriously triggered existing crons that gate on `claim_state="claimed"` (medjobs-digest, google-reviews refresh, etc.). v2.1's split keeps cron triggers aligned to real provider commitment.
- Defined four orthogonal state axes (auth identity / 2a account-link / 2b claim / 3 pilot / 4 public verification) — provider can be in any combination; magic-link advances 1+2a only, terms accept advances 2b+3, formal verification advances 4 separately.
- Explicit answers to Logan's 10 step-by-step questions (T0–T10 journey table) — token signing, account resolution, profile resolution, browse mode, T&C trigger placement, activation, CRM reflection.
- Co-tenancy edge case (org already claimed by different account): read-only co-tenancy + admin `claim_conflict` task, not auto-merge.
- Email CTA finalized: **"Review {campus} student caregivers →"** (campus-personalized), not generic "Review the candidate board." Strongest of the four options Logan offered.
- T&C placement: appears at the **first axis-3 action attempt** ("Invite to interview" / "Save student" / "See contact info"), NOT on landing. Browse is free; modal CTA carries the verb of the action they were trying to take.

**Plan v2.1:** [`plans/post-launch-outreach-redesign-plan.md`](plans/post-launch-outreach-redesign-plan.md) (771 lines). Strategic shifts now S1–S14 (added S13/S14 for axis orthogonality + T&C placement). MVP scope grew from ~17 to ~22 days because the journey is the load-bearing piece (items 4–6 + 8 are tightly coupled and ship as a coherent PR sequence). 10 open questions for Logan; 4 new ones in v2.1.

**Resume next session here →** Logan reviews v2.1 — especially the four-axis state model in P1.E, the T0–T10 journey, the co-tenancy edge case, and Open Questions 7–10 (T&C trigger action, co-tenancy default, axis 2 split, welcome banner copy). Critical: does the axis 2a/2b split feel right? If so, MVP Implementation Phase 1 tickets 1–10 in order.

---

### 2026-06-03 (Tue) — Pre-Flight v9.x: Research Card consolidation merged (Phases 2b–2e, branch `merge/medjobs-staging-2026-06-02`)

**Context:** Continuing the v9.x Pre-Flight rethink. Phase 2b–2e collapsed the duplicate Pre-Flight surface — the Research Card is now self-contained (Verification status + Pre-Flight action footer with Visit Website / Call to Confirm / Launch Outreach + inline Contact Form banner). NextStepCard prospect body collapsed from ~480 lines to a thin "Pre-Flight in progress" indicator that points admin downward. Net: single source of truth for Pre-Flight; no more two-card divergence.

**Commits pushed to `merge/medjobs-staging-2026-06-02`:** `f57d0d0` (2b verification), `04352ff` (2c action footer), `1da0764` (2d inline contact form banner), `73df792` (2e NextStepCard collapse). All four commits typecheck clean (one pre-existing unrelated `@vercel/functions` error).

**Resume next session here →** Phase 3 manual QA on Vercel preview: walk through prospect / call_due / meeting_set / in_outreach / converted / closed stages to confirm NextStepCard still renders correctly (only the prospect branch was touched). Launch flow test: from Research Card footer, confirm cadence schedules + row transitions to in_outreach. Override path test: pick Override Pre-Flight in call modal; verify Verification subsection shows "Overridden" (amber) and Launch label reads "(override)". After QA passes, merge to staging.

---

### 2026-06-02/03 — Market Diagnostic: "SEMrush for senior-care client acquisition" (PR #916, DEMO-READY)

**Context:** Shower revelation off the Comfort Keepers / College Station thread → the real product. Olera has a two-sided "mall" (recurring care-seeker demand + engaged providers) but no goods to sell. The good = **client-acquisition intelligence** a single provider can't assemble: their local demand, competition, and referral map. Wedge = Olera sees demand (the funnel) no provider can. Framing locked: **intelligence is the hook, the qualified-lead outcome is the revenue — *because* the outcome is scarce (75k providers, ~100 live leads) and the intelligence is abundant.**

**Built this session (PR #916 → staging, branch `market-diagnostic-v0`):**
- **Engine** (`scripts/market-diagnostic/`): `fetch-diagnostic.mjs` (dependency-free; Google Places competitors+referral graph, Census ACS5 65+/income by ZCTA, Supabase funnel — families=`business_profiles` type=family, `provider_questions` has no city col→join via provider_id) + `analyze-diagnostic.mjs` (Claude Haiku classification, cached; competitor share-of-voice, prioritized referral-BD call sheet, channel ranking).
- **Real College Station home-care numbers:** 22,339 seniors (9.8%, $30k–93k by ZIP; private-pay density in 77845/77802/77808, campus skipped); 17 local competitors (Comfort Keepers #1 @16.9% SoV; median 27 rev/4.9★); 212→147 referral sources, diverse deduped BD list (hospitals/SNF/hospice/AL/senior-resources). Olera has only 6 CS families → demographics = denominator, funnel = growing fulfillment.
- **Credibility pass** (2nd commit): fixed criminal-defense-as-elder-law + ER-as-top-target + low-value buckets leading; value-ranked, interleaved diverse call sheet, name-guards. Honest gap: generically-named estate firms unverifiable → elder-law left empty not padded.
- **Render**: `components/provider/market/MarketDiagnostic.tsx` (reusable, warm/serif) + admin preview `/admin/market-diagnostic`.
- **Find Families integration** (3rd commit): diagnostic is now the **default** Find Families experience. `components/provider/market/FindFamiliesMarketView.tsx` (diagnostic-first; compact live-leads urgency strip pins on top only when local families exist) + `app/api/provider/market-diagnostic` (serves precomputed city×caretype snapshot; lazy-compute = Phase 2) + early-return gate in `app/provider/matches/page.tsx` (gated to Aggie / TJ email / `?market=1`; **zero change for all other providers**). Find Families = `app/provider/matches/page.tsx` (2013 lines), data via `/api/matches/*`. Typechecks clean (0 errors).
- **Post-Q&A teaser → Your Market** (6th commit): `components/provider-onboarding/AnalyticsTeaserCard.tsx` (the post-answer discovery door) now points gated providers' CTA to `/provider/matches` ("See your market") instead of generic `/provider`. Live conversion/instrumentation untouched for everyone else. Gate centralized to **`lib/market-gate.ts`** — single flip-point; global rollout = make `marketGateEnabled` return `true`.
- **Section reorder** (7th commit): demand → competition → referral map → **where-to-focus** → playbook (TJ's call; targeting ZIPs land right before the action playbook).
- **Susan follow-up filed** (time-sensitive, TJ's ask): [Notion task on Olera Action Items board](https://www.notion.so/3735903a0ffe81aea151e182846ff451), **P1 · Fri Jun 5**, with a ready-to-send email (headline recs + asks for ad-spend/platforms + avg client LTV) + checklist. Needs her address to send.
- **Workspace layer (DONE + LIVE):** referral call-sheet is now a tool — mark each target To contact→Contacted→Responded→Referring, progress bar, persists per provider. `supabase/migrations/097_market_referral_outreach.sql` (provider_id × google place id; TEXT status+CHECK; RLS-on, service-role-only) — **TJ APPLIED the migration; write path verified end-to-end (valid status saves, bad status blocked by CHECK 23514)**. `app/api/provider/market-outreach` (GET/POST, provider from session, degrades if table absent). `ReferralTargets.tsx` (status controls, optimistic, tel: links, "Referring" celebration pop).
- **UI-critique redesign (DONE, chunks 1-4):** competition-first hero ("21 agencies competing for 22,339 seniors in College Station" — TJ's instinct; demand folded in as stakes, not a scrolled-past section), Perena-style stat cards w/ count-up (`CountUp.tsx`), "You" highlight in SoV bars (Google-listed providers), sticky scroll-spy section nav + two-column (`SectionNav.tsx`), real **catchment map** colored by source type (`CatchmentMap.tsx` + dynamic ssr:false loader), "Your first call" teal CTA, `tel:` links. Refs: Perena + Wispr Flow (`~/Desktop/olera-hq/docs/Design Inspirations`). Skipped donut on purpose (count-cards show composition; exact counts are actionable).
- **MAP FIX:** map rendered as a flat green box — **MapTiler key 403s** (expired/over-quota); switched `CatchmentMap` to **key-free CARTO Positron raster tiles** (mirrors BrowseMap's fallback). Map now shows real streets. (Renew the MapTiler key separately if other maps need it.)
- **Susan EMAILED** (TJ sent it himself, not me): Fri Jun 5 **10 AM** call, to recruiter696@gmail.com cc Logan + Graize. TJ has the relationship/meeting side handled — see memory `feedback_dont_over_anchor_offers`.
- **Find Families optimizations (2026-06-03, post-redesign):**
  - **Call sheet "daunting wall" fix:** 16-row list → **top 5 + "Show all N" toggle**, softened counter ("Start with your first 5" / "3 worked" instead of "0 of 16"). Shrinks the wall to what's actionable; full list one tap away. (`ReferralTargets.tsx`)
  - **Playbook /punch:** flat equal-weight list → **#1 is the visual hero** (tinted card, big teal numeral), #2-4 recede; rationales cut to one punchy line (dropped #1's redundant counts + "0 elder-law"); "↳ Olera" → "→ {tool}" pointer. (`MarketDiagnostic.tsx`)
  - **Playbook reorder (TJ):** **Reviews now #1** ("fastest win you control" — we've actually built `/provider/reviews`), Referrals #2 ("biggest lever", the deep map+call-sheet section above). Channels carry a `key` (reviews/callsheet/community/ads). Reasoning: order = "where to start," not strictly leverage.
  - **Playbook actions are REAL now (were fake affordances):** reviews→`/provider/reviews`, callsheet→`#referral` anchor, community/ads→**one-click "contact the Olera team"** (`PlaybookAction.tsx` + `app/api/provider/market-request` → `sendSlackAlert` from `lib/slack.ts`, awaited; button morphs to "✓ Got it — the team will reach out"; error state "tap to try again" added in /pre-test). TJ's call: ads/PPC isn't self-serve → consultative contact is the honest action.
  - **Reviews CTA repeated in the competition section** ("Request reviews to climb the ranking →" teal pill) so they act on the share-of-voice insight without scrolling to the bottom. TJ: repeating is right here.
  - **Actionability of the page = ~6/10** (TJ asked): strong diagnostically, one real action spine (call sheet); the path to 8-9 = an action per recommendation (now done for playbook) + a "your move this week" synthesis (not built).
- **Build status:** PR #916 **Vercel CI = PASS** (~20 commits). Local `tsc` via borrowed desktop node_modules shows 8 errors in UNRELATED files (PasskeysSection/UnifiedAuthModal/program-pdf) — a Supabase-2.106 deps-skew artifact, NOT real; CI green.

**HONEST STATE (what's real vs not):** Demo-ready **vertical slice** — ONE city (College Station), ONE gated provider (Aggie Home Care), real data end-to-end, full redesign + persisting workspace. NOT system-wide: (a) data only precomputed for CS (engine run manually, output committed; other cities → "Building your market report" placeholder); (b) gated to Aggie/TJ/`?market=1`. System-wide needs: **Phase-2 lazy-compute-on-visit + cache infra (NEXT — plan with TJ before coding)**, then flip the gate (1 line in `lib/market-gate.ts`).

**IA DECISION (locked):** Diagnostic = strategic layer of the existing **Find Families** tab (provider nav = Profile/Find Families/Hire Caregivers), NOT standalone, NOT on the dense Profile page. Single adaptive page, leads+market combined (no separate toggle). Leads scoped LOCAL-only (fixes the MA/VA over-promise). Read-only now, workspace later (mark-target-contacted, review-climb). The old "43 families looking" image banner is retired.

**Cost/scale answer:** ~$1.75/market one-time (Places ~$1.20 + Haiku ~$0.50; Census free). Unit = **city×caretype, shared across all local providers** → not 75k. Lazy-compute-on-visit + cache + quarterly refresh (the reviews-hydration pattern). Don't geo-limit; gate by rollout for quality. Cache-miss wrinkle (~60-90s compute can't block load) → Phase 2 background job or precompute-on-claim.

**Next up →** (1) **More Find Families optimizations** — active thread; TJ is iterating on the page section-by-section (call sheet, playbook done). Ask him what's next on the page. (2) **PHASE 2 — PARKED** at [`plans/market-diagnostic-phase2-plan.md`](plans/market-diagnostic-phase2-plan.md) (full plan written; multi-city on-demand compute; **PLAN WITH TJ BEFORE CODING** — his ask; recommend batch-first/Option A). (3) Later: "your move this week" synthesis (the actionability 6→8 lever); review-climb tracking; verify-attorney enrichment (elder-law); care-type-adaptive copy. (4) Ops note: one-click team-request relies on Slack delivery (no durable store) — fine for v1; add a table if these requests matter. Memory: `project_market_diagnostic`, `feedback_dont_over_anchor_offers`, `feedback_error_feedback_first`.

---

### 2026-06-03 (Tue) — MedJobs catchment undercount fix + provider city-mislabel discovery (branch `vibrant-joliot`)

**Origin:** Logan flagged catchments may undercount providers. Investigation cascaded into three layers.

**Layer 1 — wrong-table bug (FIXED, PR #919 → staging).** Catchment COUNT/AUDIT surfaces read `business_profiles` (Olera account-holders, tiny) while the prospect LIST reads `olera-providers` (the 75K directory). 7–140× undercount. Decision (TJ): count **non-medical home care only** (`Home Care (Non-medical)`). Fixed `lib/medjobs/{catchment,prospect-counts,catchment-audit}.ts` → read olera-providers + non-medical filter; kept business_profiles only for the client-unlock gate. Added shared `NON_MEDICAL_ILIKE` + paginated `fetchNonMedicalProviders()` with **stable `.order("provider_id")`** (pre-test caught unstable pagination skipping/duping rows past the 10k PostgREST cap). Verified vs live DB: Houston 42→106, Emory 2→76, U.Florida 0→21. Committed `30df681b`, PR #919.

**Layer 2 — discovery completeness.** Built `scripts/medjobs-homecare-backfill.js` (Places New text search → classify non-medical → dedup by place_id/phone/brand → review-ranked coverage report; dry-run default, `--import` reads reviewed JSON). Imported 3 solid net-new: SYNERGY HomeCare (Bryan `bryan-tx-0026`), Visiting Angels (Houston `houston-tx-0091`), TheKey (Houston `houston-tx-0092`). Hardened after TJ's "table stakes" push: franchise brand-probes default-on, **metro-wide capture** (assign each place to its REAL locality, not the query city) + coverage report ranking by Google reviews so a top-of-market miss can't be silent.

**Layer 3 — THE REAL DEFECT (in progress).** BCS coverage proof showed all 8 top agencies as `✓have` — but they were "missing" from a College Station/Bryan filter because a **legacy import batch mislabeled their `city`/`state`**. The `Navasota, TX` bucket (26 rows) is a dumping ground: real Navasota + Bryan/CS agencies (Home Instead, Right at Home, CareCo, Amada, Visiting Angels — all addressed in CS/Bryan per lat/lon) + out-of-area (Dallas, Denton, Athens, Kilgore) + **3 Florida rows** (lat 27.x labeled TX). Tells: mislabeled rows have **random-prefix legacy IDs**; **lat/lon are accurate, city/state are not**. Not a discovery miss — a data-integrity bug. Fix = reverse-geocode lat/lon → correct city/state.

**Next up:** (1) RUN Navasota geocode-fix (26 rows) as proof; (2) RUN directory-wide lat/lon-vs-city audit to size the corruption; (3) Notion report of findings (append branch name); (4) PR #919 merge; (5) decide breadth of directory repair. NOT done: importing the 2 tiny BCS net-new (Margie Stibora ★5/1, Mir ★1/1 — low value, skip).

**Cost note:** Places New text search ~$32/1k requests; this session spent ~$5–6 across diagnostics/sweeps.

---

### 2026-06-02 (Tue eve) — Provider page-creation bugs: schema column + post-create redirect (branch `proud-feynman`, pushed)

**Context:** Esther flagged in Slack that creating new home-care provider pages failed. Two distinct bugs found and fixed; both verified working live by TJ.

**Bug 1 — page creation failed entirely (the red error).** `claim-instant` + `claim-listing` routes inserted a non-existent `care_services` column into `business_profiles`; the real column is `care_types TEXT[]` (used in ~40 other places). Schema-cache rejected every insert → "Could not find the 'care_services' column". Affected ALL service categories, not just Home Care. Fix: rename `care_services` → `care_types` in both routes (`app/api/provider/claim-instant/route.ts:230`, `app/api/provider/claim-listing/route.ts:185`). Commit `222585b6`.

**Esther's account-separation theory — investigated, ruled out.** There IS a real `check-email-type` gate that blocks a provider signup if the email already has a *family* profile. But it was NOT the cause: (1) it would've shown a "use a different email" message, not the schema error; (2) DB query proved `tj@findmedjobs.co` had ZERO business_profiles. Also confirmed: **asking a provider question does NOT create a family profile** — the Q&A flow only writes a `provider_questions` row (asker_email), no account/profile. The email was never "tagged as a care seeker."

**Bug 2 — after successful creation, landed on family inbox (`/portal/inbox`) instead of provider dashboard.** Onboarding intends `router.push("/provider")`, but `handleInstantCreate`/`handleInstantClaim` called `setSession` then navigated WITHOUT refreshing the auth context. Provider layout (`app/provider/layout.tsx:120-123`) mounted with stale empty `profiles`, saw no provider profile, bounced to `/portal`. Masked until now because Bug 1 blocked creation entirely. Fix: `await refreshAccountData(verifyData.session.user.id)` after `setSession`, before navigating, in BOTH instant flows (`app/provider/onboarding/page.tsx`). Commit `646dd8c9`.

**Verified:** `/pre-test` run twice (both clean). Traced refresh chain against real schema+RLS: shared browser client carries the session, RLS allows reading own account/profiles, new org profile matches the `.or()` filter, single Supabase instance = no read-after-write lag. tsc clean (0 errors) throughout. TJ confirmed creation + (after fix) dashboard landing work.

**Next up:** (1) open + merge PR to staging (both commits); (2) Esther Slack reply — blocker cleared + the "not a care seeker" clarification; (3) test-data note: `tj@findmedjobs.co` now owns a real org profile, so re-testing the *create* flow needs a fresh email (or delete that test profile).

---

### 2026-06-02 (Tue) — Provider outreach enrichment (P1 #2 emails + #3 contact-form URLs) — PLANNED

**Context:** `/explore` audited all 7 of TJ's P1 cards → 3 already done (closed on Notion: Smartlead bridge, Benefits mobile +P2 dup, portal post-Q sign-in mobile), 1 mostly-done/diverged (SBF 2-step → empathic arm), 1 half-shipped (#4 connect-two-sides), 2 genuinely unbuilt: the paired email + contact-form enrichers. TJ chose to build both together (shared toolchain).

**Plan:** [`plans/provider-outreach-enrichment-plan.md`](plans/provider-outreach-enrichment-plan.md). Batch enrichers (workhorse) + per-row "Find X" drawer buttons (escape hatch) writing onto `student_outreach.research_data.general_contact` (Option A). Shared TS finder lib consumed by both tsx batch scripts AND the button endpoint. No new CRM action/enum/touchpoint (G1–G4).

**Built + verified this session (Tasks 1–3 of 4):**
- `lib/medjobs/outreach-enrichment.ts` — shared finder: `resolveWebsite` / `findEmail` (scrape→role-rank→Perplexity, ZeroBounce-ready) / `findContactFormUrl` (path-ranked links + real-contact-form validation, NOT any `<form>`). Lazy env reads (tsx load-order safe). tsc clean + live smoke-tested.
- `scripts/enrich-outreach-emails.ts` — `--city <City> <ST>` (directory, writes `olera-providers.email`) or `--outreach` (writes `research_data.general_contact.email`). Dry-run default, `--apply` gate, ZeroBounce verify, concurrency pool. **College Station --apply: 18 targets → 6 found, ZeroBounce dropped 3 invalid, 3 real emails written** (Allumine, Five Points, Interim). ~17% hit (chains hide email behind forms).
- `scripts/enrich-outreach-contact-forms.ts` — `--outreach` (writes) or `--city` (preview, no write — directory has no column). **College Station preview: 28/37 forms found (~76%)** incl. the chains email missed. `--outreach --apply --limit 1` verified the JSONB merge preserves research_data on a staging row.
- `package.json`: `enrich:outreach-emails`, `enrich:outreach-forms`.
- Test scaffolding: worktree has symlinked `node_modules` + `.env.local` → main checkout (gitignored) so `npx tsx` runs locally.

- **Task 4 (buttons) — DONE (code):** read-only `POST /api/admin/medjobs/enrich-contact` (auth-guarded, mode email|contact_form, resolves website from research_data→linked directory, runs shared finder, returns value, NO write) + "✦ Find email"/"✦ Find contact form" buttons in `SnapshotCard` General Contact (show when field empty, pre-fill via existing `saveField`/`update_general_contact`, loading + calm error). Full project `tsc` clean for all 4 files (8 unrelated pre-existing errors: passkey WIP + missing optional deps).

**All 4 tasks built + verified (tsc + live data). COMMITTED + PUSHED** → `clever-jemison` (commit `3cc152b1`).
**Pre-test review:** found + fixed 1 bug — `--outreach` status filter used non-existent values (`"converted"`/`"closed"`); only `do_not_contact` was actually excluded. Fixed → positive `.in()` of live-outreach statuses (research + in_progress groups). Validated: contact-form targets 13→12. Everything else traced clean.
**Remaining QA:** click-test the "✦ Find email"/"✦ Find contact form" buttons in the live admin drawer (needs auth/running app → staging).
**Outreach-mode write runs available when wanted:** 7 rows need email, 12 need contact_form_url (live CRM, across cities — not auto-run).

**Next up:** (1) open/merge PR to staging + QA the buttons; (2) decide whether to fire the live `--outreach --apply` runs (7 emails / 12 forms); (3) optional follow-on: contact-form/email enrichment feeds the emailless-tail of P1 #4 "Connect the two sides" (sub-task 3). Note: worktree has gitignored symlinks (`node_modules`, `.env.local`) → main checkout so `npx tsx` runs locally.

---

### 2026-06-02 (Tue) — Provider-page Q&A: asked-aware suggested questions (branch `hardy-nobel`, pushed)

**Context:** Explored the questions care seekers ask on provider pages. Data finding (8wk, 4,541 Qs): **98.8% are one-tap clicks on the fixed suggested-question chips** — only 17 genuinely typed in 8 weeks. The repetition floods providers with identical Qs (1,139× "What's included in the monthly fee?"). Cost/payment ≈48% of all questions. The 1.2% typed are 10× more likely to carry an email — the real leads.

**Shipped (commit `b0acfaa7`, 4 files + new `lib/qa-utils.ts`):**
- Deepened the **six live directory categories** (AL, MC, NH, IL, home care, home health) from **5→8** suggested questions (`lib/provider-utils.ts`). New Qs grounded in real organic asks (affordability/income-based, payment beyond Medicare, dementia progression, special diets). The other 7 switch cases are dead code (no provider hits them).
- **Asked-aware ordering** in `QASectionV2.tsx`: show top 5, hold 3 as reserve. Already-**answered** topic → drops from chips (answer shows as thread) + thread gains "N people asked this" badge (N≥2). Already-**asked-unanswered** → sinks below un-asked so a fresh Q surfaces. Un-asked topics keep the proven order (new visitor unaffected).
- Per-provider asked tally built server-side (`page.tsx`, query by `provider_id=slug`), shared `normalizeQuestion` (`lib/qa-utils.ts`, dependency-free for client import), threaded through `QASectionWithVariant`.

**Decisions (WHY):**
- **Don't shuffle / don't reorder un-asked Qs** — TJ: every visitor is new, so the optimized fixed order is best *for them*; repetition is a team/DB illusion. Fix is de-prioritize-on-asked only.
- **De-prioritize, not remove** — diverse Qs = higher ROI, and sinking (vs removing) kills the pool-depletion trap, so no bench expansion beyond 5→8 needed.
- **Count badge only on answered Qs** — social proof reinforces real content; showing it on unanswered chips would re-boost the topic we're sinking.
- **Keep 6 category sets, not collapse to 2** — TJ's "senior living + home care" is the right *business* framing (97.5% of providers) but the code tailors per sub-type (MC dementia Qs, NH Medicaid Qs); keeping that is more thoughtful.

**Status:** `/pre-test` clean (no bugs), tsc clean on changed files, committed + pushed. **PR to staging via this quicksave.**

**Process note:** initially edited `~/Desktop/olera-web` (stale, on `chore/rename-compact-skill`, ~440 lines behind on QASectionV2) — caught it, reverted Desktop, redid against the worktree. New memory `feedback_edit_in_worktree_not_desktop`.

**Next up (deferred surgical edits, not built):** provider-side duplicate-question collapse + notification suppression; promote the typed-question path; the answer-side problems (93% unanswered, 15% no provider email). UX idea worth revisiting: answer-in-the-moment from data we already have (pricing/payments/care types) so a tap returns value even when the provider never replies.

---

### 2026-06-02 (Tue) — PMF strategy session: Comfort Keepers / College Station paid-acquisition analysis (no code)

**Context:** Deep strategy conversation, no code. TJ asked me to absorb the Comfort Keepers meeting (5/22) + recent product-team meetings (5/5, 5/20, 5/29) and think through Olera's path to PMF. Worked through a chain of his pushbacks to a concrete recommendation.

**The thinking, in order (each step was a real update, not hand-waving):**
1. **Two working halves that don't meet.** Care-seeker funnel produces demand (~700 visitors/day, ~20 conv/day, ~600 leads/mo); provider side engaged (131 claims/30d, self-running) — but only 3 providers have ever reached out to a family. KPI = connections, not leads.
2. **Why they don't meet:** plumbing (small, the gating thread), empty shelf (structural — 75k providers thin across thousands of cities), behavioral (families ghost; 2 of 47 publish).
3. **TJ's "build useful → monetization follows" thesis:** right in spirit, but in senior care you can't monetize attention-at-scale (too niche) — "useful" has to mean *delivering the outcome (connections/clients)*, and the monetizable engagement is the *provider's* (recurring), not the seeker's (episodic).
4. **TJ pushed: that runs counter to "win one city."** Real fork surfaced — horizontal utility (monetize scale) vs. marketplace (monetize local liquidity). Evidence (engagement grew, connections stayed ~0) says outcomes don't emerge from breadth; they're manufactured. Reconciled: product/supply stays broad (the useful engine), liquidity *effort* goes narrow.
5. **TJ: 700/day "might be worth something."** Correct — it retires the "will anyone show up" risk and is *inventory for a lead-gen business* (the A Place for Mom / Caring.com model), which fits the traffic + is proven in senior care. Gate: leads must be qualified (Door B, not email-only) + a provider must pay. CK = the buyer.
6. **TJ: but no organic leads in College Station where CK is.** True — organic is scattered, no clusters yet. So the question becomes "can we *manufacture* density with paid?" → led to the PPC analysis.

**Researched + delivered — College Station paid-acquisition unit economics** (web-sourced 2026 in-home-care benchmarks):
- Cost to make a CS home-care lead ≈ **$90–175** (~$130 planning). Worth to CK ≈ **$550–900 gross profit/lead** (LTV ~$18,500; ~30–40% margin; 10–20% close). ~4x spread = the business.
- Catches: (1) CS is a senior-thin college town → volume-capped ~10–25 leads/mo; (2) bidding vs CK's own ads; (3) pure arbitrage is thin → price on **closed clients**, not clicks.
- Recommendation: small CK-co-funded paid test ($1–1.5k/mo), Google + B-CS FB groups, route through Olera's funnel, per-closed-client referral fee. 60–90 day **motion proof** (not scale). If it works → replicate in denser metros.

**Artifacts created (Notion):**
- 📍 [Paid Acquisition Analysis](https://www.notion.so/3725903a0ffe815e99e6f7d2049875d7) (child of the 💰 Olera Pro 2.0 monetization card) — full model + sources + branch-resume command appended + the draft email to Susan.
- 🧪 [TEST: College Station Paid Acquisition — 60–90 day motion proof](https://www.notion.so/3725903a0ffe8192a6e0e25b35551b34) — tracked spec: metrics table, weekly tracker, 30/60/90 go-no-go gates.
- ✉️ Draft email to Susan (co-funded test pitch, soft pricing, re-requests her ad spend + asks client LTV) — saved at the bottom of the test page. **Not sent.**

**Also this session (tooling):** Made the `find-branch` skill (aka "branch finder" — maps a branch → worktree path, prints a `cd` line) **user-global**: moved `~/Desktop/TJ-hq/.claude/skills/find-branch/` → `~/.claude/skills/find-branch/` so `/find-branch` loads in every session, not just TJ-hq. Single canonical copy (no duplicate). Exception to the "personal skills live in TJ-hq" convention. Restart sessions to pick it up.

**Resume next session here →** (1) Decide whether to **send the email to Susan** (or firm up co-funding/referral terms first; offered a Gmail draft — needs her address). (2) Get Susan's outstanding inputs: current ad spend + platforms, and avg client value (hours/wk × tenure). (3) Optionally add the concrete campaign plan (keywords, FB targeting, intake flow) to the test page. (4) Decide funding + who runs the campaign. Memory: `project_comfort_keepers`, `project_careseeker_leads_reframe`.

---

### 2026-06-01 (Mon) — Smartlead cold-email BRIDGE built end-to-end (PR #900 → staging, inert)

**Context:** Resumed the cold-outreach engine (mailboxes `logan@`/`partnerships@findmedjobs.co` warming since 5/29, ~late June ready). Goal: build the software that turns CRM rows into live Smartlead campaigns — the "engine room" — ahead of warmup, then demo it. Branch `medjobs-smartlead-bridge` off `staging`; `lib/smartlead.ts` cherry-picked onto it from `save/email-deliverability-session`.

**Built + committed (PR #900, 9 commits):**
- `lib/medjobs/smartlead-bridge.ts` — pure helpers (`selectEligibleRows` w/ reasoned skips, `rowToLead` baking `custom_fields.outreach_id` as the D2 join key, `buildEmailSequence` provider email-days 0/3/7 → delays [0,3,4]) + orchestration (`launchCampaign` batch, `enrollRowIntoCampusCampaign` per-row, `resolveMailboxPool`, shared `provisionCampaign`/`finalizeCampaign`). **PAUSED-only — no `START` literal exists.**
- `lib/student-outreach/email-markdown.ts` — `bodyToHtml` extracted (was private in `email-send.ts`) so Resend + Smartlead render identical HTML.
- `lib/smartlead.ts` — added `deleteCampaign`.
- `route.ts` `handleScheduleSequence` — engine branch (config `MEDJOBS_OUTREACH_ENGINE`, optional `body.engine`); smartlead mode enrolls first, queues only call tasks, skips Day-0 Resend fire, writes `research_data.smartlead` linkage + `note_added` touchpoint. `ResearchData.smartlead` type field added (JSONB, no migration).
- `supabase/functions/smartlead-webhook/` — D2 reply/bounce → touchpoints, INERT until `SMARTLEAD_WEBHOOK_SECRET` set.
- `docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md` — design doc.

**Validated:** pure helpers via tsx; orchestration mock 15/15 + per-row 14/14; **live PAUSED campaign against the real Smartlead account — every mutation path confirmed (create/attach/sequence/leads/schedule/status=PAUSED), then deleted, account clean.** `tsc` 0 errors.

**Decisions (WHY):**
- **No new frontend.** Interface = existing pre-flight "Schedule sequence" action; Smartlead is a backend swap chosen by config flag. Cockpit (dashboard) vs engine-room (Claude) — frontend emerges with the team, don't build a UI nobody asked for.
- **Channel split:** Smartlead owns the EMAIL drip; CRM keeps CALL tasks + stays system of record.
- **Campus-campaign reuse = approach (b):** per-row enroll looks up the campus's campaign id from a sibling row's `research_data.smartlead.campaign_id` (no new engine surface).
- **D2 = service-role direct write (sanctioned G4 exception).** Original plan (route through `log_email_replied`) is impossible — the Vercel WAF that forces D2 off Vercel also blocks an Edge→Vercel callback. Kept faithful by replicating `insertTouchpoint`+`handleLogReply` + leaning on derived state. Documented in fn header/README/spec §10.
- **Logan's role is NOT messaging approval** (that was overthinking) — narrow: sees copy once (his name on it), okays being the sender face. Monday = courtesy walkthrough.

**Demo (live meeting w/ Logan):** connected `tj@findmedjobs.co` to Smartlead as a throwaway demo sender (warmup OFF — do NOT warm; it's the admin acct, not a 3rd cold sender). Campaigns now in account: MOCK `3433423` (no-sender PAUSED), DEMO `3433546` (ACTIVE, sending to tj@/logan@/graize@olera.care — new-mailbox dispatch delay, hadn't landed yet), DEMO-for-Logan `3434880` (PAUSED, tj@ sender). Gmail connector authed to `partnerships@` (DRAFT-ONLY — no send tool); confirmed partnerships@ actively warming via connector inbox read.

**Resume next session here →**
1. **Push pending** (this quicksave pushes the D2 commit + scratchpad → updates PR #900). PR is TJ-merge-only.
2. **Logan sign-off** on messaging + the cold-channel **footer/sender-identity/unsubscribe** (the one deferred body piece) + audience read.
3. **Before activating D2:** verify Smartlead webhook payload shape vs their docs; set `SMARTLEAD_WEBHOOK_SECRET` + register URL in Smartlead.
4. **Post-warmup (~late June):** set `MEDJOBS_OUTREACH_ENGINE=smartlead` + `SMARTLEAD_SENDER_EMAILS` in prod, then a human clicks START.
5. **Clean up** demo campaigns (`deleteCampaign` 3433423/3433546/3434880) when team's done; consider disconnecting tj@ from Smartlead.
6. **3 sibling deliverability tasks** on Web App board (P2/P3): activate provider-notify domain split (#860, `PROVIDER_NOTIFY_FROM` unset in prod), fix complaint-rate instrumentation (reads 0.00%), move provider cold off Loops. + confirm staffing-outreach retired (P4).
- Refs: memory `project_smartlead_bridge`; Logan one-pager (Notion, updated); spec `docs/medjobs/SMARTLEAD_BRIDGE_SPEC.md`.

---

### 2026-06-01 (Mon) — Connections tracker planned (gating-thread sub-task 4)

**Context:** `/explore` → restructured the P1 "Connect the two sides" gating-thread card into 5 sub-tasks (Notion `3725903a-0ffe-81f1-8a54-d32371a60243`); folded + retired the P2 "Connection ledger" card. Audited lead delivery, the connection state machine, re-engagement crons, and email infra. Corrected two card errors: auto-send already works when a provider has an email (hard stop is only the emailless tail), and the "30-day post-connection email" doesn't exist (`accepted_at` is set but never read; true re-engage trigger = provider's first non-auto thread reply).

**Planned (not started):** Connections tracker — hero "successful connections" KPI + prioritized intervention queue at `/admin/connections`. Plan: [`plans/connections-tracker-plan.md`](plans/connections-tracker-plan.md). Establishes the canonical "successful connection" definition (provider-responded OR accepted, server-confirmed) + a centralized temperature module (whose-turn + staleness). Design locked: Perena/Wispr — warm, big serif KPI, calm fading dot, NO heatmap.

**Built this session (Phases 1–3, MVP complete):**
- `lib/connection-temperature.ts` — canonical predicates (`providerResponded`, `isSuccessfulConnection` = replied OR accepted, TJ-approved) + `getConnectionTemperature` (whose-turn + staleness; awaiting_provider/awaiting_family/live/going_cold/closed; `GOING_COLD_MS`=3d) + `TEMPERATURE_CONFIG`/`dotOpacityForStaleness`/`formatAge`/`INTERVENTION_PRIORITY`. Unit-tested 6/6 via node type-strip.
- Refactored 3 clean dup sites to `providerResponded()` (`leads/route` ×2, `leads/stats`); left analytics `.find` sites + `lead-response-nudge` (name collision) on purpose.
- `GET /api/admin/connections/pulse` (KPI `{total,delta,series,bucket}`) + `GET /api/admin/connections` (temperature-sorted queue + per-state counts + engagement + truncation flag). **Verified vs 305 real conns: 6 successful, 218 going_cold, 31 awaiting_provider.**
- UI: `app/admin/connections/page.tsx` + `components/admin/ConnectionRow.tsx` + sidebar link (Inbox › Connections). Serif hero, fading dots, tabs, search.

**Resume next session here →** (1) **No local build** (worktree has no node_modules) — needs a staging CI build / `/run` on a built checkout for typecheck + visual pass; I caught+fixed a DateRangePopover default-import bug by hand but more may surface. (2) Eyeball against the Perena/Wispr mock (serif hero, calm fading dot, no heatmap). (3) Then commit + PR to staging. (4) Follow-ons: row click-through to a connection detail (none exists yet), email-quality badge (sub-task 1), provider lead-outcome follow-up. Plan: `plans/connections-tracker-plan.md`. Memory: `project_careseeker_leads_reframe`.

---

### 2026-05-22 (Fri) — Comfort Keepers (College Station) engagement kickoff (no code)

**Context:** TJ met with Susan (Comfort Keepers, ~5 yrs, caregiver-recruiting side) — a home care agency, 20 yrs in Bryan-College Station, warm relationship (we've helped them recruit before). First time in Susan's tenure they have **more caregivers than clients**, so the ask flipped: they need family/client lead-gen, not recruiting. Lead volume down (word-of-mouth + past-client referrals dried up); competition ~doubled in 5 yrs (new franchises, Houston entrants, cheap private caregivers); their paid ads skew to recruiting (Meta great for caregivers, weak for family leads); most family leads still organic Google; families increasingly source recs in local FB groups (B-CS women's group) where CK isn't present.

**Done this session:** Pulled the Notion meeting notes (`Meeting Notes` data source) + reviewed the Slack thread, drafted a team recap in TJ's voice, posted to the Comfort Keepers thread in `#ai-product-development` (tagged Graize + Logan).

**Framing:** A learning engagement — **not charging initially.** Positioned as a clean test case for the provider client-acquisition side of Olera (provider-as-customer). Win for CK + sharpen our provider playbook.

**Resume next session here →** (1) **TJ's deep dive** into CK's specific lead-gen levers (PPC vs content vs optimization) — the committed next step. (2) Follow up with tailored proposals + next steps, possibly a budget rec. (3) Awaiting from Susan: current ad spend + which platforms ads run on. (4) Memory: `project_comfort_keepers`.

---

### 2026-05-21 (Thu) — TX benefits QA published; CA + TX promoted to PRODUCTION (decoupled)

**Context:** Continuation of the CA publish (entry below). Cess re-reviewed Texas under the same per-program audit paradigm. Shipped TX, merged both states to staging, and promoted only the benefits content to production.

**Shipped:**
- **Texas — PR #857 → staging (MERGED):** 11 programs Cess re-reviewed, applied to `data/pipeline/TX/drafts.json` (`contentStatus: approved`), regenerated TX `drafts.ts`. TX was **partially remediated in a prior pass**, so I built a precise stale-value map and applied only the remaining deltas (SNAP $4,500 asset + $1,305/$1,766 income + Lone Star Card + candy/soda rule; Medicare Savings $202.90 + $9,950/$14,910 + de-conflated title; STAR+PLUS $2,982 + $752,000; CCAD 2026 figures; PACE ext. 2300; Weatherization 15-yr; Meals homebound + 1-800-458-9858; Ombudsman any-age). Same mechanism as CA — live pages render from pipeline drafts; `texasPrograms` (Chantel's) scaffolds use different ids so no shadow. Old `/texas/benefits` parallel route is retired (301 → `/benefits/texas`). `cba-waiver` excluded (Cess tagged "[DELETE - OLD STAR+PLUS]").
- **Staging merges — PR #854 (CA) + #857 (TX), admin bypass:** clean, 0 file overlap with staging's care-seeker/cron work.
- **Production — PR #858 → main (MERGED):** **decoupled** promotion. Fresh branch off `main` carrying ONLY the 4 CA/TX pipeline data files. main HEAD `f2fdb3da`; content verified live (CA 14 + TX 11 approved).
- **Slack:** notified Ces (Cecille Chavez, `U063P1X0WUE`) in `#provider-listings-management` that CA+TX are live; TJ doing state pages next week.

**Decisions made (with why):**
- **Decouple, don't full-promote.** A staging→main promotion would bundle a care-seeker re-engagement + cron nudge/email workstream (sends real production emails) that isn't mine and isn't vetted. Cut a fresh branch off `main` with just the data files instead.
- **Divergence was topological, not content.** staging showed "27 commits behind main," but those are historical `Merge PR from staging` promotion commits; staging was content-ahead on all 15 differing files. rev-list counts mislead — file-overlap/freshness is the real signal.
- **TX delta-only apply.** Prior partial remediation meant blind re-application would clobber correct content; assertion-guarded script + stale-map caught what was already done.

**Resume next session here →** (1) **Notion Status → Approved** for the 25 rows (14 CA + 11 TX) — now genuinely production-live; offered, TJ's call. (2) **CA stragglers:** SSP + Property Tax Postponement (Cess finished after the CA cut) not yet shipped. (3) **`tx-cba-waiver`** stale page — recommend deleting the draft. (4) **Care-seeker/cron work** still on staging awaiting its owners' production promotion. (5) **TJ doing benefits state pages next week.** Mechanism: memory `project_benefits_publish_mechanism`.

---

### 2026-05-20 (Wed) — Publish Cess's California benefits QA corrections (PR #854 → MERGED to staging + production)

**Context:** Workflow = Cess QAs each CA Senior Benefits Finder program in the Notion Benefits QA queue (writes findings in the page body under Numbers/Phone/Links/Copy/Structure/FAQ), then TJ gets them live. Ran `/benefits-pipeline` publish mode. CA scope: 13 fully-reviewed programs + MSSP Waiver (its phone fix) = **14 programs**. SSP, Property Tax Postponement, and a duplicate CBAS row left out (not yet reviewed / Notion cleanup).

**Shipped — PR #854 → staging (branch `publish-ca-benefits-qa`):**
- Applied all 14 programs' corrections to `data/pipeline/CA/drafts.json`, set `contentStatus: "approved"`, regenerated `data/pipeline/CA/drafts.ts` (CA-only, replicating the generator's `cleanStateEntry`/`writePerStateDraftFile` logic — **not** `--regen-index`, which would churn all 50 states' timestamps). Built via an extensible, assertion-guarded Node apply-script sourced from a pristine backup.
- Key facts corrected: Medi-Cal MSP $1,330/$1,796; IHSS $1,836/$2,490 + asset $130k/$195k + 127hr avg; CalFresh min $24 + BenefitsCal.com portal; MSSP Waiver dropped obsolete $2k asset limit + phone→Ombudsman 1-888-452-8609; WAP 15-yr re-weatherization rule + 200% FPL + shut-offs→LIHEAP ECIP + CSD 600/43B docs; SCSEP CA min wage $16.90 + savings $2,700–$7,200; HICAP all 58 counties (was nine); LIHEAP app line 1-866-675-6623; CBAS 800-430-4263 + CDA 916-419-7545; Ombudsman 8,000+ facilities. Plus FAQ/tone rewrites per her scripts.
- `/pre-test` caught **2 stale-value bugs** (commit `32670f95`): CalFresh assisted-living FAQ still said `$15` → $24; MSSP Caregiver Support step 1 still said `(800) 677-1116` → 1-800-510-2020. Post-fix stale-token sweep across all 14 = clean.

**Decisions made (with why):**
- **Edit `drafts.json` (source), not `waiver-library.ts`.** CA live pages (`/benefits/california/{program}`) render from pipeline drafts via `getEnrichedProgram`; legacy `californiaPrograms` (data/waiver-library.ts ~917) are thin scaffolds lacking `intro`/`faqs`, so the merge surfaces draft corrections. HICAP shares an exact id but defines none of the corrected fields → **no waiver-library edit needed** (verified against the render path).
- **Cess's body notes override the auto-flag.** MSSP Waiver phone: factcheck auto-flag suggested 800-510-2020; her human review prescribed the Ombudsman 1-888-452-8609. Followed her.
- **Didn't pre-mark Notion Status=Approved** — that's TJ's post-merge sign-off (signals production-live, which only happens after merge→staging→main).
- Couldn't `next build` locally (no node_modules in worktree); staging CI compiles. Data-only, shapes unchanged → ~zero type risk.

**Resume next session here →** (1) **PR #854 OPEN** — TJ's call to merge → staging → main (only he can). (2) **After merge:** mark the 14 CA rows Status=Approved in the Notion queue (offered; held until live). (3) **Held back:** SSP + Property Tax Postponement (not yet reviewed by Cess), duplicate CBAS row tagged for deletion in Notion. (4) **Future cleanup:** stale legacy `californiaPrograms` scaffold entries still generate duplicate `-for-seniors` pages. (5) **Next state in the queue: New York.** Full mechanism captured in memory `project_benefits_publish_mechanism`.

---

### 2026-05-19 (Tue) — `/mobilize` pass on Benefits Section program pages (PR #850 → staging, OPEN)

**Context:** TJ ran `/mobilize` on the LIHEAP/Texas page (`/benefits/[state]/[program]`, rendered by `components/waiver-library/ProgramPageV3.tsx` — the shared template for **every benefit program page in every state**). Desktop fine; mobile had three concrete failures: the breadcrumb wrapped the full program title to 6 lines (then the H1 repeated it), the H1 fragmented one-word-per-line, and the page was a ~39-screen wall with no anchored action.

**Shipped — PR #850 → staging (branch `heroic-wiles`):**
- **Mobile breadcrumb → "‹ State" back link** (`sm:hidden`); desktop trail kept `hidden sm:flex` with the long crumb `truncate`. SEO BreadcrumbList JSON-LD is separate, zero SEO cost.
- **Floating "Call to apply" pill** (mobile-only, safe-area padded, `print:hidden`, derived from `program.phone || contacts.find(c=>c.phone)?.phone`).
- **Section-gap density** trimmed on mobile only (`mb-16` → `mb-10 sm:mb-16`, how-to-apply `py-14` → `py-10 sm:py-14`).
- **Correctness wins:** empty `Things to know` callout no longer renders an orphan heading (gated on callout text actually existing — 15 callouts scanned, LIHEAP had a `text`-key-absent edge); contrast bump on tagline + "Full requirements" (`gray-500`→`gray-600`); section-nav pills given legible `bg-white/60 border` surfaces with active pill matching height; `min-h-screen` → `min-h-[100dvh]`; tap feedback on touched buttons; scroll-spy `id="overview"` fix so the sticky nav stops falsely highlighting "Eligibility" in the hero.
- **THE saga:** title kept laddering one-word-per-line. Tried `min-w-0 flex-1` on the title column — still laddered. Tried `text-wrap:balance`→`pretty`, size 26→22px — still laddered. Realized the title was *structurally* trapped in a `flex justify-between` row with the share/bookmark buttons; CSS tweaks couldn't rescue it. **Restructured**: extracted `HeaderActions` (own `copied` state), put it in a new mobile top utility bar next to the back link, made the title wrapper `sm:flex` only (plain block on mobile so the H1 has no flex sibling). Then bumped H1 back to 26px (`text-[1.625rem]`) — the earlier "too big" call was a misdiagnosis; it felt too big *because it was also collapsed*. Desktop is byte-for-byte identical via `sm:`/`md:` scoping throughout. Commits: `2ccf1b9b` → `a5803b0d` → `3346bd6f` → `437d5666` (the restructure) → `32bbd7fe` → markdown-only.

**Decisions made (with why):**
- **Restructure > nth-tweak.** Two speculative CSS one-liners failed in sequence. Reasoning about flex + intrinsic sizing + `text-wrap` interactions from source alone is unreliable. Removed the failure mode (H1 not a flex sibling on mobile) instead of debugging it further.
- **No redesign, only mobile adaptation.** TJ explicitly reined in a strategic decision-card / illustration / IA-resequencing proposal — that was scope creep. The mobilize pass is desktop-byte-for-byte preserved; every change scoped behind `sm:`/`md:`.
- **FAB style = labeled pill, not icon-only.** Senior audience clarity; icon-only is ambiguous for 70+. TJ confirmed.
- **Verification path = PR Vercel preview, not pinned deployment hashes.** This was the most painful lesson: TJ kept opening the original `bdoikbl98` deployment URL (which was pre-fix), seeing the laddered title, and concluding the fix didn't work — burned **4 verification rounds**. Opening PR #850 gave a single auto-updating branch alias (`olera-web-git-heroic-wiles-olera.vercel.app`) and ended the back-and-forth. Curl/WebFetch can't read the deployed DOM (Vercel WAF serves a 33KB 429 bot-challenge to both), so this is the only viable loop.

**Lessons encoded into `.claude/commands/mobilize.md` (commits `01ed4611` / `06b21e0f` / `e30d211e`):**
- Phase 0 now `ls`'s `~/Desktop/olera-web/docs/Mobile Optimized Pages/` (TJ's curated folder; Zapier blog is the first PDF in it, more to come) and instructs the future run to **`Read` the matching PDF before writing any class**. Five named patterns lifted from the folder: utility bar over headline / full-width bold headline / lighter full-width dek / small byline row with dot separator / category eyebrow. Attribution is to the folder generically (per TJ's "Actually" course-correction — don't pin Zapier as THE anchor).
- Lens 3: hard rule — **headlines never share a flex row with action buttons on mobile**; restructure to utility-bar-above; title wrapper `sm:flex` only.
- Lens 4: refines "don't shrink headlines" — applies to *short marketing headlines* only; long content/reference titles (Notion/Zapier register) sit at ~24-28px on mobile and earn weight from *full-width room*, not bigger font.
- Phase 4 blindspot table + Quick reference: two new rows for the title-in-flex-row symptom.
- Phase 7: rewritten — **open a PR after the first commit; use the auto-updating branch-aliased preview**. Don't let TJ verify on pinned deployment hashes. Curl/WebFetch are WAF-blocked; can't programmatically read the deployed DOM.
- Anti-patterns: don't ship a third speculative CSS one-liner — restructure to remove the failure mode.

**Resume next session here →** (1) **PR #850 is open, not merged** — TJ's call when to merge to staging. The Vercel preview auto-updates per push (current HEAD `e30d211e`). (2) Out-of-scope items I deliberately did NOT touch this session: the *global site footer's* mobile city-state grid ("Los Angeles, CA" wrapping to 3 lines) is the biggest length contributor to the page (~30%+ of 19,770px), but it's a separate component (not `ProgramPageV3`) — flagged as a future `/mobilize` target, **don't** roll it into this PR. The provider-page Door A/B work, decision-card hero, warm illustration, FAQ promotion, etc. — all explicitly out of scope per TJ ("we'll do that later"). (3) `useSavedPrograms` is context-backed (verified `hooks/use-saved-programs.tsx:41,44`), so the two `BookmarkButton` instances (mobile top bar + hidden desktop one) share state — confirmed in `/pre-test`. (4) If TJ wants to QA the typographic landing one more time, the H1 is at `text-[1.625rem]` / `leading-[1.15]` / `[text-wrap:pretty]` on mobile, scaling to `display-sm`/`display-md` at `sm:`/`md:`.


---

### 2026-05-19 (Tue) — GSC: invalid `reviewCount:0` in provider JSON-LD — SHIPPED TO PROD

**Context:** Google Search Console email (WNC-10030322, to tj@olera.care 2026-03-11) flagged 1 critical Review-snippets structured-data issue site-wide: `Value in property "reviewCount" must be positive`.

**Root cause:** `app/provider/[slug]/page.tsx` LocalBusiness JSON-LD. The `aggregateRating` block was gated only on `googleReviewsData.rating > 0`, but `reviewCount` was emitted whenever `review_count != null`. `lib/google-places.ts:96` defaults `review_count: data.userRatingCount ?? 0`, so any provider with a Google rating but **zero reviews** emitted `"reviewCount": 0` → Google rejects the entire review snippet for the page. Sole JSON-LD `aggregateRating` site (verified via full sweep — layout/article/breadcrumb schemas carry no ratings).

**Fix (commit `23c59c53`):** Gate `aggregateRating` on `review_count > 0` (added `review_count != null && review_count > 0` to the spread guard) so the block is omitted entirely without a positive count rather than emitting an invalid one. Also corrected `worstRating: 0 → 1` — Google reviews are a 1–5 scale, the outer `rating > 0` guard already excludes sub-1, and the `Review` objects directly below already use `worstRating: 1` (now internally consistent).

**Verification:** `/pre-test` — clean, no bugs. Traced the spread-of-`&&`-chain (object-spreading `false`/`null`/`undefined` is a no-op; same pattern used on adjacent lines 776/786). Confirmed no new structured-data invalidity: a curated-reviews provider with `review_count:0` now emits `review[]` without `aggregateRating`, which is valid per Google (snippet needs *either*). `tsc --noEmit`: 0 errors.

**Decisions made:** Suppress over-emit — fewer-but-valid beats more-but-invalid for structured data (one bad `reviewCount` invalidates the whole snippet). Same honesty principle as the provider-highlights waterfall.

**Shipped:** PR #848 → staging (`df4d3232`), promoted to prod via PR #849 → main (`63dd013d`). TJ clicked **Validate Fix** in GSC same day (validation started 5/19, 421 affected items). Reminder task on Olera Action Items board for 2026-05-24 to check validation status. Both /pr-merge Notion reports filed.
---

### 2026-05-19 (Tue) — De-indexing: description-rewrite theory tested against real GSC data — LARGELY DISPROVEN

**Context:** TJ questioned the assumption that templated provider descriptions cause the GSC "Crawled — currently not indexed" bucket (66K and growing). Asked for evidence before spending on a 27K description backfill.

**What was done:** (1) Measured backfill completeness vs prod DB — 75,076 active providers, only 21,165 rewritten (5/11 run), ~27K still templated (36%). Found the **structural leak**: `scripts/enrich-city.js:293` + `scripts/pipeline-batch.js:1291` still mint Gen-2 templated descriptions for every new pipeline provider, so a one-time backfill never converges. (2) TJ exported the GSC drilldown to `docs/https___olera.care_-Coverage-Drilldown-2026-05-19/` (Chart/Metadata/Table.csv, 999-URL sample). Analyzed: 585 `/provider/*` (58%), 308 `/review/*` (31%). Cross-referenced 583 rejected provider slugs against DB.

**Finding (theory disproven):** Of rejected provider pages — only 51% still templated, **33% unique-prose all along yet still rejected, 77% have real Google reviews**, median desc 203 chars. Weak positive signal only (templated over-represented ~1.4x vs 36% baseline). Bucket grew monotonically 19K (Feb)→66K (May), steepest late-Apr/early-May = tracks **city-pipeline page growth, not content quality**. It's a large-thin-directory scale/duplication problem, not a per-page description bug. Caveat: every export URL was crawled BEFORE both 5/11 fixes (sample crawled 5/3–7) — measures the problem, not the cure.

**Decisions made:** Killed "rewrite 27K to fix de-indexing" as the plan. Revised: (1) let `/review/` noindex propagate (highest-confidence, monitor only — verified live on main since 5/11, server-rendered); (2) be selective about what gets indexed (noindex/consolidate thin stubs); (3) throttle the pipeline; (4) finish backfill eventually as UX cleanup not de-indexing fix; (5) re-measure ~mid-June with fresh export post-recrawl. Notion task `3655903a-0ffe-8163-ad78-c8d4a39df9d1`; memory `project_deindexing_p5_diagnostic` corrected.

**Resume next session here →** Mid-June: pull a fresh GSC "Crawled — currently not indexed" export, check `/review/` URLs leaving the bucket + compare index rates of the 21K-rewritten cohort vs the still-templated cohort (the real A/B test, valid only after recrawl). Decide on selective-indexing + pipeline throttle then.
---

### 2026-05-17→18 (Sun–Mon) — @wehaveprepared.com fraud ring: CLOSED — DB remediated + domain block live in prod

**Context:** Esther flagged in #ai-product-development that `@wehaveprepared.com` accounts exploited the pre-April-7 account-separation gap — created **family** accounts, then also **claimed provider listings** they didn't own (Visiting Angels, Griswold, Andwell, Home Helpers, HomeWell, Casa Care, Seniors Helping Seniors, Right at Home). Real providers hit a dead end claiming their own listings. TJ took the task; Esther's hard constraint = don't delete real listings.

**Investigation (read-only, `scripts/investigate-wehaveprepared.mjs`):** **28 accounts with profiles** on the domain — 23 dual-profile (Esther's count) **+5 single-profile** she'd missed. 24 family profiles, 33 provider profiles. Only **1** linked to a real directory listing (`olera-providers` `mKQD35X`, HomeWell Care Services). 1 anomaly: a `verified`/`self_service` BrightStar Care row on the fraud domain.

**Shipped — PR #844 → staging (branch `elegant-spence`):**
- `lib/email-validation.ts`: `BLOCKED_DOMAINS` + `isBlockedEmailDomain()` (subdomain-aware), enforced at 4 entry points — `check-email`, `check-email-type` (pre-OTP UX gate) and `create-profile`, `claim-instant` (hard 403). Typechecks clean (only 3 preexisting unrelated `@react-pdf` errors).
- `scripts/cleanup-wehaveprepared-fraud.sql`: STEP 0 preview → STEP 1 dry-run (`ROLLBACK`) → STEP 2 apply (`COMMIT`) → STEP 3 verify. Deletes fraud family profiles, **unclaims** (not deletes) provider profiles, mirrors the admin unclaim API exactly, **never references `olera-providers`**. FK cascades verified safe (migration `001` + `033/035/041/062`).
- `scripts/investigate-wehaveprepared.mjs`: read-only audit (in the PR for auditability).

**Decisions made:**
- Teardown = **unclaim only** (Esther's plan): reversible, directory untouched, no auth-user/account deletion. (Rejected: full teardown / row deletion.)
- Execution = **TJ runs the SQL himself** in the Supabase SQL editor; AI prepares only. The strict separation that closed the hole was **code, not a migration** (commits `d5f05f83`, `3eea1761`) — hence no DB constraint, hence these predating accounts need manual SQL.
- Account separation enforcement has **no DB-level constraint** — purely route-handler code. Documented in memory `project_wehaveprepared_fraud.md`.

**2026-05-18 closeout (done):** TJ ran STEP 0–4 in Supabase. Verified: 24 fraud family profiles deleted, 33 provider claims severed/unclaimed, 32 fabricated listings hidden (`is_active=false`, STEP 4), real `mKQD35X` (HomeWell) intact + claimable, `olera-providers` untouched. `/pre-test` caught a critical bypass — original block only covered create-profile + claim-instant, but OTP sign-in is client-side so the actual claim paths (`claim-listing`, `create-listing`, `claim/finalize`) were unguarded; hardened to all 5 chokepoints before merge. PR #844 → staging, promoted to prod via PR #846 (`main` @ `aae16797`, includes #845 Careseeker Re-engagement as a conscious rider). Both `/pr-merge` Notion reports filed. Team note posted to #general. `project_wehaveprepared_fraud.md` marked CLOSED.

**`/slack-notes` skill updated** (`.claude/commands/slack-notes.md`, this branch): two hard rules added from TJ feedback — (a) no PR links/numbers in Slack notes (changelog noise; PR refs belong in Notion), (b) no engineer metaphors / no tying pieces together with cause analogies — state the plain user-visible outcome only.

**Resume next session here →** Fraud incident fully closed, nothing outstanding. This branch (`wehaveprepared-closeout-docs`) carries only doc updates (SCRATCHPAD + slack-notes skill) — merge to staging when convenient, low priority.
---

### 2026-05-16 (Fri) — Care Shifts staging arc: #824 review → #832 cleanup → #833 deletion → #838 mobile triage (all merged to staging)

**Context:** Chantel's combined care-shifts work (PR #824, ~15K lines, mostly hardcoded mock) was reviewed and merged to staging per the morning CareShifts Demo meeting (merge-first, integrate-later; keep siloed). Then a multi-PR reconciliation:

- **#824 merged** (`cefe9862`-prior). Family-facing browse + student landing + caregiver dashboards/care-log/apply. Architecture map + lead-loss caveats in Notion PR-merge reports.
- **#832 merged** — restored the live family-portal nav that #824's `Navbar.tsx`/`LayoutShell.tsx` dev-branch artifacts had silently swapped for mocked caregiver surfaces; added paired footer previews; resurrected the orphaned families waitlist landing (`/care-shifts/families`, from PR #674).
- **#833 merged** (`ae196479`) — `/pre-test` caught the resurrected waitlist writing to a **nonexistent `care_shifts_waitlist` table** (real table is `feature_waitlist {feature,email,...}`) with a non-functional "fallback" → 100% lead loss. TJ's product call: family front door is `/care-shifts` (the browse, "Compassionate care, half the cost"), **not** a waitlist. So the page was *deleted* (kills build break + lead-loss + redundancy at the root). Footer "Hire a caregiver (preview)" → `/care-shifts`. Resolved a delete/modify conflict from #835's scope-bleed (a CTA-tracking PR that bundled an unrelated `lucide-react` dep + families-page edit).
- **#838 merged** (`9b16ce47`) — `/mobilize` triage of `/care-shifts`. Page had **zero mobile-first breakpoints** (3,510 lines, `sm:`/`md:` = 0). Fixed: full-width hero, headline `display-md→sm:lg→lg:xl`, `<br/>` now `lg:`-only, single-column card grid, two-pane stacks on mobile, side-panel `hidden lg:block`, filter pill `flex w-full` (was `inline-flex` clipping) + icon-only search + viewport-capped dropdowns. +19/−19, every change `sm:`/`lg:`-guarded so desktop is byte-identical. TJ confirmed good on staging.

**Decisions made:**
- **Family front door = `/care-shifts`** (the browse), not a pre-launch waitlist. Waitlist work preserved on `care-shift-lead` branch / PR #674 if ever wanted.
- **Care Shifts is a volatile early mockup** — TJ: "might look entirely different in a week, don't over-optimize." Triage-level only until it stabilizes. Saved to memory (`feedback_care_shifts_mockup_dont_overoptimize.md`). Do NOT proactively push the deferred full structural mobilize.
- Merge-to-staging is the verification surface for mobile work (staging IS the QA preview); merge-then-eyeball legitimate for staging, not main.

**Team notified:** posted staging landing-page links to `#ai-product-development` (footer-under-Company location, siloed framing, pre-empted mobile caveat).

**Notion:** three PR-merge reports filed (#832, #833, #838) under PR Merge Reports.

**Resume next session here →** (1) Care-shifts is parked at triage — don't deepen unless TJ asks. (2) **Deferred, not lost:** full structural mobilize (card→full-screen profile, sticky Connect, bottom-sheet filters, 48px tap targets, `dvh`); remove now-unused `lucide-react` from package.json (#835 scope-bleed cruft, needs lockfile regen in a working npm env); pre-main-promotion safeguards PR (noindex/robots/password-gate before staging→main); close PR #674 (waitlist source) + #778 (superseded by #824), decide #675 (provider banner). (3) Esther owns inbox-integration assessment per the meeting; Chantel ~60% on care-shifts ops planning.
---

### 2026-05-15→16 (Fri–Sat) — Weekly digest reliability + Provider Activation panel/redesign/drill + page-views counter fix → ALL PROMOTED TO PRODUCTION (PR #834/#840/#841/#842 merged 2026-05-16)

Long session, three connected threads. All on shared file `app/api/admin/analytics/summary/route.ts` — sequenced deliberately to avoid stacking semantic rewrites.

**Thread 1 — Weekly digest hardening before Monday's full-pool auto-fire (PR #834 `warm-gates` → staging, MERGED 2026-05-16 via admin-bypass, staging `3a2bd172`).**
- **Unclaimed-provider unsubscribes never persisted.** `app/api/providers/unsubscribe/route.ts` olera-providers branch wrote to a non-existent `metadata` column = silent no-op; providers saw the confirmation page but kept getting the digest. Fix: new `supabase/migrations/084_provider_unsubscribes.sql` (email-keyed `(email,channel)` table). Digest pre-fetches it (`app/api/cron/weekly-provider-digest/route.ts`) and ORs into the existing opt-out gate. Pre-test caught a silent 1000-row Supabase default-limit truncation → added explicit `.limit(100000)`.
- **Digest never stamped `email_log.provider_id`** → 100% of `weekly_analytics_digest` rows had `provider_id=null` → Comms Funnel weekly_digest column structurally 0 despite 44 answerers/14d. Fix: stamp the loop `providerId` in the sendEmail call.
- **Comms-funnel namespace split**: dashboard events use suffixed `business_profiles.slug`; digest/email_log + `question_responded` use `olera-providers.slug`. Added `resolveCanonicalProviderKeys` to `lib/provider-id-variants.ts`, applied symmetrically to both sides of the funnel intersection in summary route.
- **Backfill (already run against prod, irreversible-but-additive):** `scripts/backfill-digest-email-log-provider-id.js` repaired 2,281 NULL rows. Verified 0 NULL remaining, 401 clicks now attributable, weekly_digest "Answered" 0→32. Reconciled via two independent forensics.
- Migration 084 applied in Supabase by TJ + verified (CHECK enforced, upsert/conflict/delete round-trip). `/pr-merge` Phase 6 Notion report filed (PR Merge Reports, page `3625903a-0ffe-8186-8c86-e16f03e3a285`).

**Thread 2 — Diagnosed why activation looks like ~0.** Forensic over 7d profile editors: **100% were notified by us, but ~2/3 never registered a tracked click** (Apple MPP / proxies / one-click links / verification emails). The Comms Funnel gates every downstream metric on `email_log.first_clicked_at`, so it structurally undercounts activation ~3x. Also found `claim_completed` had THREE emitters (`claim-listing`→`source:"page"`, `claim/finalize`→`"email"`, `claim-instant`→`"instant_claim"`); the page flow is dead, so the funnel's `source==="page"` filter made **104 claims/30d 100% invisible**.

**Thread 3 — Provider Activation panel (PR #840 `provider-activation-panel` → staging, OPEN).**
- New `fetchProviderActivation()` in summary route: un-gated 30d-rolling distinct counts (Claimed / Profile edits / Answered / Owner story) + prior-30d + section breakdown + named BD feed (cap 60), canonicalized via the #834 helper. Wired into the GET `Promise.all` + `provider_activation` response field; non-fatal on error.
- New `ProviderActivationCard` in `app/admin/analytics/page.tsx`, collapsible section placed ABOVE Provider Comms Funnel. Tile order (TJ's call): Claimed | Profile edits | Answered | **Owner story added** (high-intent, amber emphasis slot). Progressive disclosure: feed expander + "See section breakdown".
- Fixed the dead `page_claims` filter (now counts all claim sources); relabeled the existing "Page-flow claims" tile → "Claimed". Verified isolated — `pickInsight` doesn't read it, no funnel/composite regression.
- Verified against prod: Claimed 104, Owner story 4, Answered 85, 9 distinct editors — reconcile with the forensic. Type-check 0 errors.
- Pre-test caught + fixed: feed expander over-promised ("See all 284" but only 60 sent) → relabeled "Show 60 most recent (of 284)".

**Decisions made (with why):**
- Email-keyed `provider_unsubscribes` (not slug) — digest dedupes recipients by email; one unsubscribe must cover all id variants.
- Backfill resolves email→`olera-providers.slug` table-direct, NOT by reconstructing the open-questions audience — that filter excludes providers who already answered, i.e. exactly the converters we most need to attribute.
- Provider Activation is a SEPARATE un-gated panel, not a patch to the click-gated funnel. Backward-attribution rebuild of the Comms Funnel **deliberately deferred** (larger; would stack a 3rd semantic rewrite on the same file as #834/#837).
- Omitted "last email touched" feed column in v1 — re-enters the email↔provider identity fragility this session just fixed; feed is BD-actionable without it.
- Merged #834 via documented admin-bypass (TJ sole `merge-admins` bypass actor; standard merge correctly blocked by ruleset).

**Continued 2026-05-16 — PR #840 grew through a design loop (all pushed, branch `provider-activation-panel`):**
- **Page-views counter fixed** (`app/api/admin/analytics/views/stats/route.ts`): was pinned at exactly 10,000 — row-fetch + JS count hit PostgREST's `max-rows` ceiling, which overrides even `.limit(50000)`. Real value ~19,235. Now `count:exact/head:true` for KPI (uncapped) + paginated/bounded series. Same silent-truncation class as the digest/funnel bugs.
- **Activation panel reframed BD→health-read** (TJ: "we're feeling out usage to inform product, not working a call list"). Went through `~/Desktop/olera-hq/docs/Design Inspirations` (Perena, Wispr). Killed both explainer blocks + amber-as-warning; 4 stats are the typographic hero each with a 12-week distinct-provider **sparkline**; section breakdown promoted to always-on ("What they're editing"); feed demoted to a calm borderless chronological strip (no dedupe/high-intent — repeated multi-section edits are a *useful* usage pattern in a health read). Removed the BD-only `high_intent` field.
- Pre-test caught a regression I introduced: extending the scan 60d→84d (for sparklines) made the prior bucket catch 30–84d instead of 30–60d → would corrupt every delta % as data ages. Fixed: `prv` strictly 30–60d; 60–84d feeds only the sparkline.
- **Cohort drill-down** (new `app/api/admin/analytics/activation-drill/route.ts` + `ActivationDrillModal` in page.tsx): the 4 KPI tiles are clickable → modal listing the distinct providers behind that metric, reusing the analytics `DateRangePopover` (full presets + custom + specific-date, defaults 30d so it reconciles with the tile, widen freely). Owner-stories drill = the owner-section editors (TJ's original ask). Summary panel stays fixed-30d; drill is the separate flexible-range surface. Verified vs prod: 30d == tiles (104/10/85/4), all-time widens (answered 85→107).

**Decisions added:** summary vs detail are different intents — never share a window (summary fixed-30d health read; drill range-parameterized investigative). Reuse `DateRangePopover` not `/admin/activity` (latter's `?days=N` is a weaker control + wrong framing = forcing it). Drill is study/understand, not outbound (no contact/export affordances).

**Shipped to production 2026-05-16 (the rest of the arc):**
- **PR #840 merged to staging** — rebased onto staging (only conflict was SCRATCHPAD, two independent log appends, kept both); admin-bypass merge. TJ QA'd: sparklines, drill modals, page-views counter all good.
- **Production-exposure blindspot caught during the `staging→main` /pr-merge analysis** — staging carried the volatile Care Shifts mock arc (#824/#832/#833/#838, 6 routes) with **zero noindex/robots**; SCRATCHPAD's own deferred list flagged "noindex/robots/password-gate before staging→main" as required-but-never-built. Halted the promotion.
- **PR #841 (new branch `care-shifts-noindex-safeguards`) — merged staging+main.** New `app/care-shifts/layout.tsx` (`metadata.robots = {index:false,follow:false}`, inherits to all 6 routes — 5 are client components, `students` sets no `robots`) + `/care-shifts` added to `app/robots.ts` Disallow. Defense in depth. TJ verified live on staging (`<meta robots noindex,nofollow>` + `Disallow: /care-shifts`).
- **PR #842 — `staging → main` PRODUCTION PROMOTION done + verified.** main `ab8deb8f`. The +23 on main were benign historical promotion-merge commits, not hotfixes (clean topology). Post-merge verified on main: #841 safeguard live, migration 084 present, #840 routes present, Footer/Navbar/redirects watchlist clean. Three Notion PR-merge reports filed (#840, #841-context-in-#842, #842).
- **Provider activation read + team message.** 30d prod numbers: 104 claimed / 85 answered / 10 profile edits / 4 owner stories. Ran `/product-led-growth` (Head-of-Growth candid read for TJ: this is an *acquisition* win not revenue yet; the 85→10 drop is a retention cliff; the weekly digest is the only proactive re-touch so it IS the retention product; we have **zero return/repeat instrumentation** — the real blind spot). Drafted team message in TJ's voice (rebuilt from his original after a first draft missed his register; tj-voice.md = no em dashes, no "not X" punches, no buzzwords, warm/inclusive/causal). **Posted to #ai-product-development** (C0A91BA205T, msg ts 1778972849.205399). Notion draft synced at page `3625903a-0ffe-81f4-9f7f-cdbd6ab2c7cb`.

**Resume next session here →** (1) **Monday 2026-05-18 13:00 UTC**: weekly-provider-digest auto-cron fires `?limit=2000` to the full reachable pool, now LIVE IN PRODUCTION with #834's unsubscribe persistence + providerId stamp (migration 084 in prod). Watch `/admin/automations` + complaint rate + open/answer rate holding at ~10x volume — this is the scale test for growth-point-1. (2) **Highest-leverage growth gap: zero return/repeat-visit instrumentation.** We just made retention the focus and can't measure it. First task to spec. (3) Product decision to make: declare the weekly digest the provider retention loop (not a notification) — turns growth-point-2 from a wish into a build. (4) Open Q for TJ: two "Claimed" numbers (windowed-strip vs 30d panel) — intentional, both tooltipped; reconcile only if it bugs him. (5) Deferred: backward-attribution rebuild of the Comms Funnel; Care Shifts full structural mobilize + `lucide-react` removal + password-gate (the 3rd safeguard half) if ever wanted.

---

### 2026-05-14 (Thu) — Admin "Delete Provider" cascade fix (PR #820, tested, ready to merge)

**Bug TJ surfaced from teammates:** deleting a provider via `/admin/directory` removed it from the admin UI but it kept appearing on city pages and provider detail pages. Audit traced it: admin PATCH only set `olera-providers.deleted=true`, leaving linked `business_profiles` rows fully active. Two read paths kept serving the listing:
- `lib/power-pages.ts:255-275` city-page parallel BP query (filters `claim_state=claimed AND is_active=true` — no check against the linked OP's deleted flag)
- `app/provider/[slug]/page.tsx:332-340` provider-detail BP fallback (no filter; the comment at lines 361-367 explicitly says it's there so claimed BPs survive OP soft-deletes for SEO — but the assumption was that the BP would also be deactivated, which the directory PATCH never did)

**Sizing (before fix):** 40,518 `deleted=true` OPs. 40 had linked active BPs (most unclaimed, naturally excluded by the read-path filters). **3 were claimed+active and currently leaking publicly** — Beverly Farm Group Home (Godfrey, IL), CARE Cafe (Albemarle, NC), Cornerstone at Barnegat 55+ (Barnegat, NJ).

**Fix (PR #820 → staging, branch `graceful-franklin`, 3 commits):**
- `app/api/admin/directory/[providerId]/route.ts`: PATCH handler cascades `is_active=false` to linked BPs on delete (and `=true` on restore). Gated on actual flip (mirrors the `deleted_at` block 5 lines above) so future idempotent payloads can't clobber an intentional is_active. With the BP deactivated, the provider-detail page's soft-deleted-row branch at line 373 fires → 301 to `/{category}/{state}/{city}`. SEO equity preserved exactly as the original author intended.
- `app/provider/[slug]/page.tsx`: both BP fallback queries (main render + `generateMetadata`) tightened with `.eq("is_active", true)` so a future re-activated BP can't accidentally undo a takedown.
- `scripts/backfill-deleted-provider-bps.mjs` (new): one-shot data fix, ordered pagination + idempotent. **Ran against prod, deactivated 40 BPs.** Verified the 3 user-visible leaks were among them and their OP `deletion_reason` values are `data_sweep`/`other` (not `provider_request`), so all three now 301 cleanly.
- `scripts/create-test-provider.mjs` (new): helper for verifying the cascade end-to-end. Creates an OP + linked claimed BP. `--cleanup <id>` hard-deletes the pair.

**Pre-test self-review caught 1 🟡 medium:** original cascade fired whenever `deleted` was a *key* in the payload, even when unchanged. No current admin code path triggers it (both UI entry points only include `deleted` on an actual flip), but a future bulk-edit form would have stepped on it. Fixed by gating on the same actual-flip check the `deleted_at` block uses.

**TJ tested end-to-end via the test helper — works.** Test pair (`test-cascade-mp64ceyd`) is still alive in prod in soft-deleted state after his test run. Cleanup pending.

**Resume next session here →** (1) Merge PR #820 to staging. (2) Hard-cleanup the test provider: `node scripts/create-test-provider.mjs --cleanup test-cascade-mp64ceyd` (run from `~/Desktop/olera-web` once merged, or worktree now). (3) Bake on staging, then promote to main. (4) Optional follow-up: confirm `/api/admin/deletions/[profileId]` (provider-requested deletion approval, different code path) doesn't have an inverse leak. Quick scan suggests it's fine — it cascades `business_profiles.claim_state="rejected"` plus `olera-providers.deleted=true` together — but worth a confirming audit when convenient.

---

### 2026-05-14 (Wed, midday) — Team alignment notes from morning product-dev meeting (posted to Slack)

Reviewed today's Olera Product Development Meeting (Notion page `3605903a0ffe802ca153de18946962e9`). Drafted a team-facing alignment note through multiple revision passes with TJ. Posted to `#ai-product-development`: https://oleraworkspace.slack.com/archives/C0A91BA205T/p1778786749880819

**Framing TJ approved (canonical for future strategic comms):**
- Not a pivot. Exploration with aggressive movement. Curiosity + urgency, not commitment.
- Distribution is the moat. Product will get commoditized. Win or lose on reach at scale.
- Everything so far has been a dress rehearsal.
- "Shift as the underlying unit" is a hypothesis being pulled on, not a decision. If it holds, agency/facility/individual collapse into one supply layer.
- Two paths, sequenced but not framed as phases: students→providers (MedJobs CRM, one signed client gates university outreach), then eventually families→caregivers direct. Research-study evidence backs family engagement; the "snake in the garden" is whether they'd invite a stranger into a parent's home.
- Esther + TJ continue stabilizing the funnel; the connection work above feeds it (better carrot, better conversions).

**Voice lessons (for future strategic comms drafting):**
- Provisional prose has different sentence shapes than declarative prose. "The idea we are pulling on" / "if that holds" / "we need to push and see" — not "X is Y."
- Strategy-memo structure (`Phase 1` / `Phase 2`) leaks commitment even when the vocabulary hedges. The structural noun does the work the words tried to undo.
- Read the meeting *transcript*, not the AI summary. The summary flattens textured exploration into a clean plan.
- Match TJ-voice via Oculo Labs strategy memo + CRP brief + `~/Desktop/TJ-hq/.claude/commands/tj-voice.md`. Don't over-anchor on a single sample.
- Pack punch per sentence. No long preambles.

**Memory files updated this session (outside repo):**
- `project_olera_3_phasing.md` — two-path exploration framing
- `project_team_contributors.md` — Grazie spelling (not "Grazy"), Logan attribution for MedJobs CRM
- `feedback_dont_bake_corrections_into_draft.md` — when TJ corrects framing in meta-conversation, the correction is the spec, not text to include literally

**Resume next session here →** (1) Chantel reconciliation meeting tomorrow (2026-05-15) on care-shifts integration — team needs to pick which version of each overlapping piece (two landing pages, two intake funnels, two dashboards, two scheduling platforms) it converges on. (2) Q&A improvements meeting needs an owner + date. (3) Provider image bug (default placeholder superimposing over uploaded images) is on no one's plate yet. (4) Outstanding code work from prior sessions still applies: PR #802 (Provider Comms Timeline), PR #805 (Lite admin detail mode), and the slug-vs-raw-id intersection fix on `fancy-mahavira` (commit `e2273150`, no PR yet) — see sessions below.

**This session produced:** PR #822 (SCRATCHPAD-only), rebased onto staging after a structural conflict with PR #820's own log entry. No code changes.

---

### 2026-05-13 (Wed, late afternoon) — Provider Comms Funnel: slug vs raw-id intersection bug (fix shipped on `fancy-mahavira`)

**Symptom TJ caught:** funnel showed `0 / 0 / 0 / 0` for row 2 (Signed in / Answered / Clicked dashboard / Edited profile) today despite a clear Slack alert that Moore Street Senior Apartments did one_click_access → question_responded → dashboard_arrival via the question_received email.

**Root cause:** the funnel intersects `email_log.provider_id` (mix of `olera-providers.provider_id` short codes + `business_profiles.id` UUIDs — same observation already documented in `lib/provider-id-variants.ts` header) against `provider_activity.provider_id` (slug-only). Disjoint namespaces → intersection is structurally near-empty. Verified empirically:
- Today's 38 clicks vs 9 sign-ins / 5 answers in activity → 0/0/0/0 raw, **4/2/0/0 after slug canonicalization**
- Last 7d: 174 distinct click PIDs (109 short-code, 21 UUID, 44 slug-form) vs 36 distinct activity PIDs (33 slug, 0 UUID, 0 short-code) → 0-1 raw intersections, **25/14/2/3 after fix**

The bug existed since the funnel shipped (PR #802); was undercounting by ~1 OOM the whole time. Q&A funnel just above it is fine because it projects activity-set sizes directly (no intersection).

**Fix (commit `e2273150`, branch `fancy-mahavira`, no PR yet):**
- `lib/provider-id-variants.ts`: new `resolveSlugsForRawIds(db, ids)` helper. Partitions by UUID-shape regex, runs two bulk `IN` lookups (`olera-providers.provider_id → slug`, `business_profiles.id → slug`), returns `Map<rawId, slug>`. Slug-shaped raws / unresolvables are absent from map; caller falls back to raw with `map.get(x) ?? x`.
- `app/api/admin/analytics/summary/route.ts`: in `fetchWindow()` after `commsFunnelRes`, collect raw clicked ids, resolve once for the window, then in the existing loop store `slug` (resolved or raw fallback) in `clickedByBucket[k]` + `lastClickByProviderByBucket[k]`. Bouncer table's `top_bouncers[].provider_id` is now slug, which matches `/admin/directory/[providerId]`'s accept-any-shape contract.

**Verification done:** standalone simulator against real DB (today + 7d) ran the same partition + lookup + intersect logic and produced the numbers above. tsc --noEmit clean on changed files. /pre-test self-review found 0 additional bugs. Pushed but not yet opened as a PR.

**Resume next session here →** (1) Open PR against staging (no PR exists yet — `gh pr create` ready to run). (2) Browser-verify on Vercel preview that `/admin/analytics` row 2 now shows non-zero numbers and the bouncer table links resolve. (3) Consider whether to backfill: counts for past days will improve on next page-load since computation is live, no migration needed. (4) Open follow-up to retire raw-id storage on `email_log.provider_id` — would prefer slug there too, but that's a wider sender-side change; the canonicalization keeps reads correct in the meantime.

---

### 2026-05-13 (Wed, afternoon) — PR #805: lite admin detail mode + analytics relinks (built, awaiting browser test → merge)

**Status:** `feature/lite-admin-detail-mode` → staging, https://github.com/olera-care/olera-web/pull/805 — 3 commits, tsc clean, pre-test review found and fixed one PATCH-path bug before TJ tested. Awaiting Vercel preview browser test, then merge.

**What shipped (three sequenced increments):**

1. **Lite admin detail mode (`9fff483c`)** — original ask. `app/api/admin/directory/[providerId]/route.ts` GET falls back to `business_profiles` by id (UUID) when `olera-providers` misses, returns `source: "user-created" | "scraped"`. Detail page renders a stripped lite view when user-created: name + claim_state pill + "User-created" badge + "Open public page →" button + Comms timeline + amber banner. Directory list row click is now unconditional `router.push("/admin/directory/<id>")` — drops the old `window.open("/provider/<slug>")` path for BP-only rows.

2. **Analytics provider relinks (`8ca28500`)** — follow-on from TJ's screenshot. Three `/admin/analytics` tables (Top providers, Latest events, Latest leads) now link in-tab to `/admin/directory/<id>` instead of opening `/provider/<slug>` in a new tab. Required two backend resilience fixes because the analytics tables emit four different identifier shapes: `op.provider_id`, `op.slug`, `bp.id` UUID, `bp.slug` — and only one of those resolved before today.
   - GET handler now resolves ANY of the four input shapes to scraped or user-created. A claim-linked BP slug short-circuits to the linked OP for full editing.
   - `lib/provider-id-variants.ts` resolver now expands any input shape into the union of variants stored on `email_log`/`provider_activity` (verified empirically: ~80% of provider-anchored email_log rows under BP UUIDs, ~20% under OP provider_ids, never slugs). Before this fix, navigating in via an OP slug would show an empty Comms timeline even when emails existed under the canonical provider_id.

3. **Canonical-id mutations (`edc8eced`, pre-test fix)** — caught during /pre-test self-review: the GET resolver fixed reads, but the page's mutation handlers (handleSave, handleImageAction, handleImageUpload, handleSaveStaff, handleStaffPhotoUpload, danger-zone delete/restore) were still using `useParams().providerId` directly in PATCH URLs. PATCH does exact-match `.eq("provider_id", <slug>)` → 404. Page now stores `canonicalProviderId` from the GET response (op.provider_id for scraped, bp.id for user-created) and routes every mutation through it. Initial GET still uses URL param (resolver handles all shapes).

**Files touched on PR #805:**
- NEW behavior in `app/api/admin/directory/[providerId]/route.ts` (4-shape input resolution, source field)
- NEW behavior in `lib/provider-id-variants.ts` (4-shape variant expansion)
- M `app/admin/directory/[providerId]/page.tsx` (lite branch + canonical-id mutations)
- M `app/admin/directory/page.tsx` (unconditional row click + updated tooltip)
- M `app/admin/analytics/page.tsx` (3 link swaps to /admin/directory)

**Verified against real DB rows:**
- Resolver: `r4HIF35` → `[r4HIF35, 469de674-...]` (catches both storage shapes). `glebeview-residence-ottawa-il` (op.slug) → canonical `ottawa-il-0012`. `aggie-home-health-and-companion-care` (bp.slug) → adds bp.id. UUID input doesn't fan out (correct).
- email_log sample: empirically ~80% BP UUIDs, ~20% OP provider_ids. Never slugs.
- OP slug ≠ OP provider_id (different columns; e.g. `north-lauderdale-fl-0040` vs `sarahcare-of-coral-springs-...`).

**Resume next session here →** (1) Browser-test PR #805 on the Vercel preview: scraped row click from /admin/directory → full edit surface unchanged; user-created (yellow badge) row click → lite mode with name + claim pill + Open Public Page button + populated Comms timeline + amber banner; Top Providers click from /admin/analytics → admin detail (with Comms timeline) NOT public page; same for Latest events + Latest leads; save any field on a provider reached via Top Providers → no 404. (2) Merge #805 to staging if clean. (3) Bake everything (#799 + #802 + #805) on staging for ~1 day, then promote staging → main. (4) Open Notion report for #805 after merge.

**Two deferred follow-ups (still pending, not blocking):**
- Migrate legacy `/api/admin/emails` `.eq("provider_id")` to use `lib/provider-id-variants.ts` (~10 lines).
- Polish pass on activity-event labels in `summarizeActivity()` once real staging data shape is visible.

---

### 2026-05-13 (Wed, late morning) — Request B: per-provider Comms Timeline on /admin/directory/[providerId] (built, merged in PR #802)

PR #799 (Request A) merged to staging at 13:23 UTC. Worktree spun up off staging tip (`11ad30c5`), branch `feature/provider-comms-timeline`. Request B replaces the existing single-purpose `<EmailTimeline>` mount on the provider directory page with a unified `<ProviderCommsTimeline>` that interleaves emails AND meaningful on-Olera activity events chronologically — the CRM contact-card view that answers "what is THIS provider experiencing?" rather than "is this campaign performing?"

**Implementation:**
- `lib/provider-id-variants.ts` (new): the ID resolver. URL `[providerId]` is always the `olera-providers.provider_id` slug, but `email_log.provider_id` and `provider_activity.provider_id` are TEXT columns whose callers sometimes write the slug and sometimes the `business_profiles.id` UUID. The resolver does one lookup against `business_profiles.source_provider_id` and returns the union of variants for subsequent `.in("provider_id", variants)` queries. Built this FIRST because A exposed that the existing `/api/admin/emails` route silently misses rows under either variant — confirmed by grep of `app/api/admin/emails/route.ts:72` which uses `.eq("provider_id", X)` single-match. Leaving that legacy route alone (out of scope) and using the new pattern in the new endpoint.
- `app/api/admin/directory/[providerId]/comms-timeline/route.ts` (new): parallel queries against email_log + provider_activity using the resolver, merged + sorted desc by timestamp, sliced to a configurable limit (default 50, max 200). Activity event allowlist of 11 meaningful events (`one_click_access`, `question_responded`, `provider_profile_edited`, `provider_picker_clicked`, `analytics_teaser_cta_clicked`, `claim_completed`, `dashboard_arrival`, `contact_revealed`, `reviews_cta_clicked`, `lead_opened`, `review_viewed`) — explicitly excludes `page_view` and tracking events that would drown the signal. Conservative `summarizeActivity()` mapper turns event_type + metadata into a one-line label (e.g. `one_click_access` + `metadata.action="question"` → "Signed in via Q&A email (one-click)").
- `components/admin/ProviderCommsTimeline.tsx` (new): client component, single fetch, table layout with two row types — emails show 📧 icon + email_type + subject + EmailStatusPill + preview-expand button; activity rows show ⚡ icon + event_type + summary, colspan=3 for the wider content. Reuses the shared `<EmailStatusPill>` for status. Preview expansion reuses the existing `/api/admin/emails` POST handler.
- `app/admin/directory/[providerId]/page.tsx` (modified): swapped `EmailTimeline` import + mount for `ProviderCommsTimeline`. Section title changed from "Automated emails" to "Comms timeline". `EmailTimeline` component is preserved — still used on `/admin/care-seekers/[seekerId]` filtered by recipient email.

**Validation:** `tsc --noEmit` 0 errors. `eslint` clean on the 3 new files. Not yet browser-tested at end of initial build.

**Why TJ chose to keep going after I recommended pausing:** the real risks of doing B in the same session were (1) data correctness on the ID-variant resolution and (2) stacked rollback complexity if A needs a hotfix tomorrow. The first I addressed by building the resolver as commit #1 of the work; the second is acceptable because A and B touch different surfaces (analytics page vs directory page), so a surgical revert is doable either direction. The soft "context budget / fresh attention" framing didn't survive scrutiny.

**PR #802 opened** (`feature/provider-comms-timeline → staging`): https://github.com/olera-care/olera-web/pull/802

**Pre-test self-review caught 4 issues (commit `46c42025`):**
- 🟡 Resolver could miss multiple `business_profiles` rows pointing to the same `source_provider_id` (no UNIQUE constraint on that column). Was using `.maybeSingle()`. Now collects all matching rows up to a defensive cap of 10, appends every UUID to `allVariants`.
- 🟡 Misleading total counts: route was returning `totalEmails: emailEvents.length` which is the FETCHED count, capped at `perSourceCap=200`. For a provider with 1000+ events, the UI's "N of M events" line would lie. Added two parallel count-only queries (`count: 'exact', head: true`) for honest totals. New shape: `totalEmails` + `totalActivity` (true counts) plus `fetchedEmails` + `fetchedActivity` (debugging).
- 🟡 Behavioral regression vs existing EmailTimeline: hardcoded `recipient_type='provider'` was tighter than the existing surface (which uses no recipient_type filter). Would silently drop legacy rows where the column is null. Relaxed to `.or("recipient_type.is.null,recipient_type.eq.provider")` — still excludes admin/family recipients (semantically right).
- 🟢 Variant chip was hidden when count=1, mismatching the pre-test instructions to operator. Now renders always with proper plural handling.

**TJ flagged a real UX flaw mid-test (will be addressed in this PR, not a follow-up):** clicking a row in `/admin/directory` for "user-created" providers (rows with the yellow USER-CREATED badge — providers who self-registered via `business_profiles` without an `olera-providers` scraped row) **opens the public `/provider/<slug>` page in a new tab** instead of an admin detail view. That's because the existing admin detail page hard-404s when there's no `olera-providers` row (see `app/api/admin/directory/[providerId]/route.ts:60-65`). So user-created rows have no admin destination today. TJ's correct read: the public page link is a useful secondary action, NOT the primary one — the admin detail (where Comms timeline lives) should be the destination, even if the editing surface is limited for user-created.

**Decision: extend PR #802 with a "lite admin detail mode" for user-created providers rather than spinning a separate PR.** Reasoning: efficient (no separate review cycle), tightly coupled (both pieces are about making admin work flow naturally toward the Comms timeline), small enough scope (~1 hour) that it doesn't bloat the PR semantically. Three options were considered (full edit support, lite mode w/ just Comms timeline, redirect to /admin/verification); chose lite mode because the Comms timeline is the load-bearing reason a user-created provider has admin value (they get emails + take actions exactly like scraped providers — editing their fields can wait).

**Files touched so far (commits `ef829368` + `46c42025` on `feature/provider-comms-timeline`):**
- NEW `lib/provider-id-variants.ts`
- NEW `app/api/admin/directory/[providerId]/comms-timeline/route.ts`
- NEW `components/admin/ProviderCommsTimeline.tsx`
- M `app/admin/directory/[providerId]/page.tsx` (4-line mount swap)

**About to add (lite admin detail mode):**
- M `app/api/admin/directory/[providerId]/route.ts` — fall back to `business_profiles` lookup (by `id` UUID or `slug`) when `olera-providers` is missing. Return `{provider, source: "user-created" | "scraped", ...}` so the page can render appropriately.
- M `app/admin/directory/[providerId]/page.tsx` — render a stripped-down view when `source === "user-created"`: provider name + claim status + "Open public page →" button + the Comms timeline. No editing form, no image manager, no Google rating, no facility-manager block.
- M `app/admin/directory/page.tsx` — change the row-click handler to always `router.push(/admin/directory/<id>)`, with the `id` being whichever identifier the row carries (slug for scraped, business_profile.id for user-created). Drop the `window.open(/provider/<slug>)` path entirely; public-page access is now via the button inside the detail.

**Resume next session here →** Implementing the lite-mode extension now in the same PR (#802). After that ships and #802 is reviewed/merged, the two follow-ups still hold: (1) migrate legacy `/api/admin/emails` to use the new resolver for consistency; (2) polish pass on activity-event labels once we see real staging data shape.

---

### 2026-05-13 (Wed) — Provider comms visibility: generalize the Q&A funnel + add per-provider drill-down (design locked, about to implement)

TJ on `jolly-wright`: the Automation Console + analytics page each tell half the story. Automations is campaign-centric — Sent / Delivered / Opened / Clicked / Bounced **per cron**, stops at the click. The analytics page's `Provider Q&A Email Funnel` is the *only* surface that crosses from email-domain into provider-action-domain — but it's hardcoded to `email_type = "question_received"`. Every other provider email (digest, verification reminders, claim, nudges) has no equivalent. TJ's words: *"I need to know what providers do after they land, not just if they click."* Diagnosed it as **the classic campaign-vs-audience reconciliation problem.**

**Design locked (via AskUserQuestion):**
- **Request A first, then B.** A = generalize the Q&A funnel into a "Provider Comms Funnel" section on `/admin/analytics`. B = per-provider drill-down ("Comms timeline" tab on `/admin/directory/[providerId]`).
- **Approximate attribution** (not strict). Same model as today's Q&A funnel — anchored on activity time within the window, not on email send time. Cheap; ships fast. Strict attribution would require `?em=<email_log_id>` tokens in every emailed link + every template change; explicitly deferred.
- **Engagement bounce** = clicked email but produced zero of the 4 downstream events within the window. Not Resend hard-bounce (that's already covered for Q&A; cross-type panel is a small add).
- **Four downstream events**, identical for every email type filter: `one_click_access` (Signed in), `question_responded` (Answered), `provider_picker_clicked ∪ analytics_teaser_cta_clicked` (Clicked dashboard), `provider_profile_edited` (Edited profile).

**Request A — SHIPPED (on `jolly-wright`, awaiting browser test):**
- `lib/analytics/provider-email-funnels.ts` (new): typed mapping with 6 buckets — `all`, `question_received`, `weekly_digest` (= `weekly_analytics_digest`), `verification` (the full claim/verification arc: 8 email types), `nudges` (`provider_nudge`, `provider_incomplete_profile`), `connections` (`connection_request`, `new_message`, `new_review`, `reach_out_accepted`). Dropped the `claim` bucket from the original sketch after grepping recipientType — `claim_notification` is admin-bound, not provider. Staffing + MedJobs explicitly excluded (separate audiences).
- `app/api/admin/analytics/summary/route.ts`: added `provider_comms_funnel_by_type` field. New `commsFunnelQ` runs alongside the existing Q&A funnel query (kept untouched so the A/B variant logic is undisturbed). Aggregation: one pass over email_log rows, partition by bucket via `bucketForEmailType`, row counts go into the specific bucket AND `all` (so `all` is the union, not double-counted within a single email). Downstream counts use **per-bucket intersection** — `signed_in = |clicked_set ∩ any_signin|` etc. — a tighter framing than the Q&A funnel's window-global projections, on purpose (each downstream column ties to "of those who clicked an email of THIS bucket, how many did event X?"). Engagement bounce = `clicked_set − (any_signin ∪ question_answerers ∪ any_dashboard_clickers ∪ profile_editors)`. Top-10 bouncers: per-bucket map of `provider_id → {last_clicked_at, last_clicked_email_type}`, filtered to bouncers, sorted desc, sliced. Added `sets.any_signin` to capture **all** `one_click_access` actions (question | lead | review) — the existing code only bucketed question/lead.
- `app/admin/analytics/page.tsx`: new "Provider Comms Funnel" `<CollapsibleSection>` (storageKey `providerCommsFunnel`) sitting right below the existing Q&A section. `<ProviderCommsFunnelCard>` reads `?comms_filter=` from URL, syncs via `router.replace`. Header has a dropdown (6 options, "All provider email" default). Funnel grid: 8 stages (Sent / Delivered / Opened / Clicked / Signed in / Answered / Clicked dashboard / Edited profile) using the existing `FunnelStat` component. Engagement bounce panel below: count + % of clicked + top-10 table (provider_id linked to `/admin/directory/[id]`, last_clicked_email_type, time-ago).
- `app/admin/automations/[id]/page.tsx`: cross-link "See provider-action funnel →" in the MPP-caveat footnote on the Overview tab. Maps the cron's `emailTypes[]` via `bucketForEmailType`; if all types resolve to one bucket, link pre-sets the filter; if zero types map (e.g. family-bound crons), no link rendered.
- `components/admin/CollapsibleSection.tsx`: added `id={storageKey}` + `scroll-mt-24` so the cross-link's `#providerCommsFunnel` anchor scrolls correctly under the sticky header. Tiny, low-risk change — benefits every existing section equally.

**Validation:** `tsc --noEmit` 0 errors. `eslint` clean on the new code (the 4 `react/no-unescaped-entities` errors in the file pre-existed on the CTA section's apostrophes). `npm run check:crons` passes. Not yet browser-tested — needs the Vercel preview to confirm the funnel renders correctly with real data.

**Pre-test self-review caught 4 things (all fixed in-session):**
- 🟡 Unit-mix bug in engagement-bounce %: `f.clicked` is raw row count, `f.engagement_bounces` is distinct providers — dividing them mixed units. Added `f.distinct_clickers = clickedByBucket[k].size` as the proper denominator. UI now reads "X of Y clickers" instead of "X% of clicked".
- 🟢 URL-state drift: when `?comms_filter` was deep-linked then removed (browser back from /admin/analytics?comms_filter=verification → /admin/analytics), the dropdown stayed on "verification" while the URL was clean. useEffect now resets to "all" when urlFilter becomes null.
- 🟢 Stale-deploy crash: `summary.windowed.provider_comms_funnel_by_type[filter]` would throw if a transient response predated the new field. Added a defensive guard that renders a placeholder instead.
- 🟢 Label/order duplication: `COMMS_FILTER_LABELS` + `COMMS_FILTER_ORDER` were defined in both the lib and the page. Removed the page-local copies, imported from the lib. Also: added `add_email_notification` to the CONNECTIONS bucket (provider-bound lead email; was missing).

**Files touched / created:**
- NEW `lib/analytics/provider-email-funnels.ts`
- M `app/api/admin/analytics/summary/route.ts`
- M `app/admin/analytics/page.tsx`
- M `app/admin/automations/[id]/page.tsx`
- M `components/admin/CollapsibleSection.tsx`

**Plan for Request B (after A ships, ~half day):**
- New "Comms timeline" tab on `/admin/directory/[providerId]`. Single query against `email_log` + `provider_activity` joined client-side by `provider_id`. Interleaved chronologically: emails on the left (subject + status pill via the existing `EmailStatusPill`), activity events on the right. CRM contact-card view. Reuses `components/admin/EmailTimeline.tsx` as the starting point — it already does the email half; just need to add the activity half + the merge.

**Blindspots flagged to TJ:**
- Apple Mail Privacy Protection inflates Opens 30-50% — tooltip caveat already in the Q&A section, will mirror in the new one.
- Approximate attribution noisier on single-type views than on `all` (a provider may have received multiple email types in the window); tooltip will name this.
- Cron registry already has a `successSignal` text field but it's free-text — the new mapping file becomes the machine-readable version for *just* the downstream-event mapping. They coexist.
- Bounces/complaints across all provider email types aren't aggregated anywhere today. Small cross-type panel is the easy add but deferred until A ships.
- The event_type allowlist + DB CHECK constraint trap ([feedback_event_allowlist_needs_db_migration](.claude/projects/-Users-tfalohun-Desktop-olera-web/memory/feedback_event_allowlist_needs_db_migration.md)) — not triggered here since we're querying existing event types, not adding new ones.

**Resume next session here →** (1) Browser-test Request A on a Vercel preview deploy from `jolly-wright`: open `/admin/analytics`, scroll to "Provider Comms Funnel", confirm the `all` view shows non-zero numbers, switch through each bucket, confirm the engagement bounce panel + top-10 list render. Then from `/admin/automations/[id]` (e.g. weekly-provider-digest), click "See provider-action funnel →" and confirm it deep-links to the section with the right filter pre-set. (2) Open PR `jolly-wright → staging`. (3) Build Request B: "Comms timeline" tab on `/admin/directory/[providerId]`. Single query against `email_log` + `provider_activity` joined client-side by `provider_id`, interleaved chronologically. `components/admin/EmailTimeline.tsx` already does the email half — extend with the activity half. CRM contact-card view. Roughly half a day. No DB migration. (4) Defer for later: a cross-type bounce/complaint panel (small add — current Q&A funnel only shows it for one bucket).

---

### 2026-05-12 (Tue, even later) — Automation Console Phase 2 — per-recipient view + email timelines (PR #797, on staging)

Built on `feature/automation-console-phase2` (off `staging`). The linkage call from Phase 1 got decided: **Option C — the hybrid**. Don't thread a `cron_run_id` through every `sendEmail`; instead add one nullable `email_log.cron_run_id` column and have `withCronRun()` stamp it at run-end.

**PR #797 (`feature/automation-console-phase2` → staging) — awaiting merge.**
- **migration 083** (`083_email_log_cron_run_id.sql`): `email_log.cron_run_id UUID REFERENCES cron_runs(id) ON DELETE SET NULL` + a partial index. Nullable — non-cron sends and pre-migration rows stay NULL. **Needs applying in the Supabase dashboard.**
- **`withCronRun()` stamping** (`lib/crons/run.ts:stampEmails`): after `finishRun` (on the ok, error, and Response paths), `UPDATE email_log SET cron_run_id = <runId> WHERE email_type = ANY(<job's emailTypes from getCronJob>) AND created_at >= <startedAt> AND cron_run_id IS NULL`. `startedAt` is a JS timestamp captured just before the run-row insert. Two overlapping runs of the same job race for the overlap (first finisher wins) — documented, acceptable. Best-effort: the column being absent (pre-migration) → one `console.error` per cron run, swallowed, no job breakage.
- **`GET /api/admin/automations/[id]/recipients?run=&page=&status=`**: confirms the run belongs to the job, returns `{ run, rollup (per-run sent/delivered/opened/clicked/bounced/complained), columnMissing, page, pageSize, total, recipients[], note }`. Status filter: all / opened / clicked / bounced / complained / undelivered. Page size 100. Fails soft → `columnMissing:true` if migration 083 isn't applied.
- **`/admin/automations/[id]` — new "Recipients" section** (only for email jobs): a run picker (`<select>` over the last 100 runs, labelled `date · status · N sent`, defaults to the most recent run that actually sent something), the per-run rollup line, filter chips, a paginated table (Recipient / Sent / Del / Open / Click / Status), recipients with a `provider_id` link to `/admin/directory/[id]`. Amber note if `columnMissing`.
- **`components/admin/EmailTimeline.tsx`** — compact "every automated email this person/provider got" list: When / Type / Subject / Status (lifecycle badge) + an inline `html_body` iframe preview per row (POST `/api/admin/emails` `{id}`). Mounted as an "Automated emails" `<Section>` on `/admin/directory/[providerId]` (filtered by `provider_id`) and `/admin/care-seekers/[seekerId]` (filtered by exact `recipient` = seeker email; guests with no email get a placeholder).
- **`/api/admin/emails`**: added a `recipient` exact-match query param (takes precedence over the existing `search` ilike); used by the care-seeker timeline.
- Deferred Phase 2 follow-ons: drip-sequence flow view, program-level rollup.

**Visual redesign (later same day, TJ: "looks phenomenal" on the detail page, then asked for the cockpit too).** The detail page was a debug dump — flat hierarchy, no containers, a 600px iframe dominating, run history as raw monospace, raw cron expr/route at operator weight. Reworked into the Resend/Loops "broadcast detail" idiom (refs: Perena's Transparency dashboard, Wispr Flow's whitespace + pill chips):
- `/admin/automations/[id]`: header (title + Active/Paused pill + ghost Pause/Related buttons + one clean meta line + description) with a collapsed **"Details"** `<details>` holding the cohort blurb / success signal / route / cron expr / email-type links. **Tabs: Overview · Recipients · Runs.** Overview = a 5-card stat row (Sent w/ a tiny inline-SVG sparkline of the weekly trend, Delivered %, Opened %, Clicked %, Bounced — gray "0" or red) + one MPP footnote + a "Weekly breakdown" `<details>` + a capped, expandable **"Latest email"** card (fade-out gradient + Expand/Collapse). Recipients = a card with the restyled run picker + `←`/`→` step arrows, a per-run stat strip, the filter chips, and a clean table — the three ✓ columns collapsed into **one progressive status pill** (clicked ⊃ opened ⊃ delivered; colored dot + label; full timeline in the title). Runs = de-terminalized: status dot, when, duration, readable result (`runResult`: "251 sent · 149 skipped", skipReasons on hover via `ⓘ`), "manual" badge; 15 shown, "Show all N" expands. `<Skeleton>` instead of "Loading…" (only on first load — pause toggles don't flash it).
- `components/admin/EmailStatusPill.tsx` — new shared component: the one place "what does this email's lifecycle look like" is decided. Used by the Recipients table AND the directory/care-seeker timeline.
- `EmailTimeline` restyled to match (bordered card, the shared status pill, capped inline preview).
- `/admin/automations` cockpit (PR adds it): same language — a fleet stat-card row (Active / Paused / Errored / Sent 30d / Bounced) where the **Paused & Errored cards click through to that filter** (card counts are computed client-side from `data.jobs` so they exactly equal what each filter shows); search + filter chips + expand/collapse all kept; audience groups as bordered hairline cards; each job row gets a left **status dot** (green/amber/red), a "Paused"/"Errors" pill only on the exceptional states, the gray fn chip, and a trimmed meta line ("Last run Nh ago · 251 sent · 27% open · 30d" — full run result on hover). Skeleton; the `→` no longer eats its own click (only the Pause button is `z-10` above the row link).

**Self-review (across the build + redesign):** tsc clean, no new eslint errors (the `no-explicit-any` "rule not found" on the care-seekers page + the `<img>` warnings on the directory page are pre-existing), `check-cron-registry.js` passes. Verified migration 083 + the route query shapes against the live DB; `preLogEmail` is awaited inside `sendEmail` so all `email_log` rows exist when `stampEmails` runs; `updateEmailLog` (fire-and-forget) never touches `cron_run_id`. Flagged tradeoffs: (a) the per-cron `console.error` noise between deploy and the migration landing (TJ ran 083 on 2026-05-12); (b) `matches-unread` + `unread-reminders` both emit `unread_reminder`, so at the 4 daily 6-hour marks the per-run linkage races (first finisher wins) — strictly better than the Phase 1 rollup's double-count; (c) "View all in Email Log →" lands on the unfiltered `/admin/emails` (that page doesn't read URL params yet). Pre-test caught + fixed: a "couldn't load recipients" flicker (error sentinel), a confusing empty Recipients table for pre-deploy runs (now a "reported N sent but not linked" note), a stale-preview race on rapid type-picker change (cancelled flag).

**Resume next session here →** (1) Apply migration 083 in the Supabase dashboard, then trigger a cron (or wait for one) and confirm `email_log.cron_run_id` populates and the Recipients section renders. (2) The Wed `?limit=800` / Fri `?limit=1500` digest ramp is still TJ's manual browser action on `olera.care` (runbook: Notion `35e5903a0ffe81d9b577d4724794b923`); PR #794 (digest default `?limit` 500→2000) is merged to `staging`, needs `staging → main` after Friday. (3) First digest funnel read ~5/19. (4) Flip the done Notion tasks: digest build `34c5903a0ffe81468186f69077e6410b`, Tuesday-fire runbook `35d5903a0ffe81ea971ecd7c0ba7f7b6`. (5) Open follow-up still not fixed: unclaimed-provider digest unsubscribes don't persist (no `metadata` column on `olera-providers`). (6) The Phase 2 Notion task `35e5903a0ffe81a98cb2c0470d6dfdaf` — flip to done once #797 merges.

---

### 2026-05-12 (Tue, later) — Automation Console v1.5 (cockpit + detail page), digest first ramped send fired, team briefed

Picked up from Phase 1 (below). TJ wanted the `/admin/automations` page less of a flat 16-card scroll and more navigable, with drill-down per automation. After a design pass, settled on: list page = the cockpit, `/admin/automations/[id]` = the deep view. Then iterated the alerts down to nothing (see below). Also fired the first real ramped send of the expanded weekly digest, and posted a team brief to Slack.

**Shipped — PR #790 (`feature/automation-console-cockpit`), merged to staging then `staging → main` (#791). All in production.**
- Registry restructured (`lib/crons/registry.ts`): `category` (8 fine-grained "what it does" buckets) → `audience` (Providers / Care seekers / MedJobs / Students / Internal / Data & maintenance — the cut that survives the eventual Loops-drip migration), + a `fn` chip (nudge / alert / digest / outreach / refresh / maintenance), + first-class `recipientCohort` and `relatedAdminPath` fields. `kind` is derived (`isEmailJob` = fn not in {refresh, maintenance}).
- List page = cockpit (`app/admin/automations/page.tsx`): lighter header (numbers + an ⓘ tooltip for the MPP caveat), filter row (search + All/Email/Errored/Paused), **Expand all / Collapse all**, collapsible audience groups (collapse state persisted in localStorage, SVG chevron), borderless rows in a hairline-divided container with a hover wash, whole-row stretched-link to the detail page, Pause + → only on hover, "No runs recorded yet" gone from the resting state, uniform gray `fn` chips (emerald/amber/red reserved for status).
- Detail page `app/admin/automations/[id]/page.tsx` + `app/api/admin/automations/[id]/route.ts` + `.../[id]/preview/route.ts`: full description + recipientCohort + schedule/path/cron + 30-day rollup + a 4-week trend table + pause control + a "Related queue →" link + the **email preview** (iframe of the most recent *actual* email this automation sent, pulled from `email_log.html_body` — no template re-render; type picker when >1 email_type; `?raw=1` opens it in a new tab) + the full run history (last 100). The orphaned `/api/admin/automations/runs` route was deleted (run history moved to the detail page).
- Per the design pass, an **explainer card** and a **consolidated/dismissible alert system** (migration `083_cron_alert_acks`, snooze-7d/acknowledge-with-value-tracking) were built — then **both removed** at TJ's call: two stacked top banners looked bad; the alert recommendations were noisy without context (the "<70% delivered" flags are the historical-rows tracking artifact, not real problems — `email_log.delivered_at` only populates for rows created after migration 051); "an auto-flag you can't trust is worse than none." So `/admin/automations` has no top banners — just header / filter / collapsible audience groups. Per-row status badges + header counts stay (state, not recommendations). Migration 083 was committed then `git rm`'d within the branch (net zero); the only migration to apply is **082**.

**Migration 082 (`cron_runs` + `cron_config`) applied** by TJ in the Supabase dashboard. (The tables already existed with a compatible schema per an earlier probe; applying it ensures RLS + the `status` CHECK + indexes.) Pause/Resume now persists for real; run history records every cron execution. Crons only fire on production, so run history fills in there; on a preview deploy nothing auto-fires (the manual digest browser-trigger is the way to get a `cron_runs` row on staging).

**Weekly digest — first ramped send fired (2026-05-12).** Promoted `staging → main` first (so prod has the expanded digest). Browser-triggered on `olera.care` as admin: dry-run `?dry_run=true&limit=400` → `{processed:400, sent:251, skipped:149, skipReasons:{no_email:146, unclaimed_or_missing_profile:3}}`; then the real send `?limit=400` → same numbers, `dry_run:false`. **251 demand-led digest emails went out** (each provider's newest unanswered question + a one-click answer link), up from the old ~20. Logged a `cron_runs` row tagged `admin:tfalohun@gmail.com`, visible in the Console. Ramp plan: `?limit=800` Wed, `?limit=1500` Fri, then the Monday cron auto-fires at the default `?limit=500`. Sent TJ two sample emails (live template, real data — CareMax Kissimmee provider) so he could eyeball what recipients get; he approved ("It's perfect").

**Team brief posted** to Slack `#ai-product-development` (https://oleraworkspace.slack.com/archives/C0A91BA205T/p1778619042229709) — provider behavior analysis → the per-question email converts (~58% of openers answer) but ~7% open it, while the digest is the one provider email people actually open (~64%) and was underutilized at ~20/wk → rebuilt + scaled to 251 → the Automations dashboard → goal is providers using/sticking with Olera = path to revenue. Voice was re-calibrated from TJ's actual Slack messages in `~/Desktop/TJ-hq` (terse, first-person on the work, no bullet lists, colons over em dashes, the message frames the work rather than recapping it).

**Decisions:**
- Grouping = audience-first + a function chip (option B), because it scales when the ~20 Loops marketing drips eventually migrate into codebase crons; the 8 fine-grained "what it does" buckets would balloon to ~15.
- List page = navigate; `/admin/automations/[id]` = drill. Email preview reuses `email_log.html_body` (cheap, real data) — not a template re-render. Per-recipient tables stay Phase 2 because they need the `cron_runs ↔ email_log` linkage decision (add a `cron_run_id` column threaded through every `sendEmail` inside a cron, vs approximate by time-window) — bolting it on now would be the duct-tape move.
- Auto-flagged "Needs attention" alerts removed entirely: noisy without context, and most of what they'd flag (low tracked-delivery) is a historical-data artifact, not a problem.
- Fire the digest from production, not staging — otk/unsubscribe links + logo are built from `NEXT_PUBLIC_SITE_URL`; a staging deploy would point providers at `staging-olera2-web.vercel.app`.

**Resume next session here →** (1) Watch the `weekly_analytics_digest` rollup in the Console + Resend for bounces/complaints over the next ~24h; if clean, fire `?limit=800` (Wed), then `?limit=1500` (Fri). (2) First real read on the digest funnel — open → click → sign-in → answer (`/admin/questions` + the funnel) — after one full week (~5/19). (3) Phase 2 of the Console (Notion `35e5903a0ffe81a98cb2c0470d6dfdaf`): per-recipient tables, provider/seeker email timeline on `/admin/directory/[providerId]` + `/admin/care-seekers/[seekerId]`, per-run detail page — the per-recipient one needs the `cron_runs ↔ email_log` linkage call first. (4) Optional polish on the detail page (it's functional but didn't get the v2 visual pass). (5) Open follow-up, not fixed: unclaimed-provider digest unsubscribes don't persist (no `metadata` column on `olera-providers`; the unsubscribe route's olera-providers branch silently 404s) — needs a real opt-out store. (6) The `weekly-provider-digest` build task `34c5903a0ffe81468186f69077e6410b` and the Tuesday-fire runbook task `35d5903a0ffe81ea971ecd7c0ba7f7b6` are now executed — flip to done in Notion when convenient.

---

### 2026-05-12 (Tue) — Automation Console — Phase 1 built (admin surface for the 16 cron jobs)

TJ wants a Loops-grade cockpit for every automated email/data job the codebase runs — see the screenshots he shared (Loops Workflows list / Campaign Metrics / Contact page). Scoped it as **Phase 1 = visibility + control** ("just need to see what the crons are doing"), **Phase 2 = the drill-downs + contact 360** (toward the Loops experience; we're "more than likely" taking over the Loops marketing drips, so the Console is the eventual home for all automated email). Two cross-linked Notion tasks on the Web App board: **Phase 1** `35e5903a0ffe81348542ddb5a01bb371`, **Phase 2** `35e5903a0ffe81a98cb2c0470d6dfdaf` — both carry the same north-star block and vocab ("Automation Console" / "registry" / "run history").

**Phase 1 — complete, on PR #788** (same branch/PR as the digest changes — 5 commits total):
- `lib/crons/registry.ts` — typed list of all 16 crons (name, what it does + who it targets, category, schedule + human schedule, `kind` = email / data-refresh / maintenance, the `email_type`(s) it sends, an optional `successSignal` string). Source of truth the Console renders.
- `supabase/migrations/082_cron_observability.sql` — `cron_runs` (one row per execution incl. manual admin fires: `job_id`, `started_at`, `finished_at`, `status` = running/ok/error/skipped_paused, `summary` JSONB, `error`, `triggered_by`) + `cron_config` (per-job pause: `enabled`, `paused_at/by/reason/until`). Service-role RLS, mirrors `email_log`. **Apply via the Supabase dashboard before deploy** — code fails soft without it (nothing breaks; Console just shows no run/pause data).
- `lib/crons/run.ts` — `withCronRun(jobId, fn, {triggeredBy})`. Checks `cron_config` (a paused job still logs a `skipped_paused` row every cycle so it can't hide; auto-reenables once `paused_until` passes); records `running` → `ok`+summary / `error`+message. Accepts either a plain summary object (clean pattern — the digest uses it; throws → errored run) OR a `NextResponse` (retrofit pattern — peeks the JSON body for the summary, status ≥ 400 → errored run; existing handler bodies stay untouched). All run/config writes best-effort.
- **All 16 cron handlers wrapped** — `weekly-provider-digest` got the clean refactor (errors → `throw`, success → plain object, outer try/catch removed); the other 15 got the non-invasive retrofit (wrap the body after the auth check, add the matching close brace, done). Manual browser fires of the digest are tagged `admin:<email>` in run history.
- `/admin/automations` (`page.tsx` + `route.ts` GET/POST + `runs/route.ts`) — jobs grouped by category; per job: status badge (Active / Paused amber / Errors red), last-run line with the summary ("processed 300 · sent 146 · skipped 154 · (no_email=151, ...)"), 30-day email rollup (sent / delivered / open % / click % / bounced / complaints from `email_log`'s denormalized lifecycle columns keyed by `email_type` — open/click have an "i" tooltip noting Apple Mail Privacy Protection inflates them), pause/resume button (prompts a reason; 30-day auto-expiry), expandable details (path/cron, email-type links into `/admin/emails`, success signal, pause state, **and the last 20 runs lazy-loaded from `cron_runs`** — when/status/duration/who/summary/error).
- Loud guard: paused-count banner on `/admin` home + on the Console page. "Automations" nav item under Operations in `AdminSidebar.tsx`.
- `scripts/check-cron-registry.js` + `npm run check:crons` — asserts vercel.json crons and the registry match (path + schedule) both ways. **Wired into `prebuild`** so `npm run build` / the Vercel deploy fails on drift. Passes today (16/16).

**Decisions:**
- Phase 1 scope = registry + run history + honest rollup + pause; NOT per-recipient tables, contact-360, or a visual flow builder (those are Phase 2 / never). Don't water down the ambition — everything lays groundwork for the Loops-grade end state.
- Pause control: DB flag, but made loud (skipped_paused run rows + admin banner + 30-day auto-expiry) so a forgotten pause self-heals — addresses the no-invisible-killswitch instinct.
- Open + click rates ARE shown (TJ's call — useful as a trend even though MPP inflates the absolute), with a tooltip caveat. Don't bury them.
- Bundled onto PR #788 with the digest changes (sequential commits on `relaxed-maxwell`) — not ideal but the branch is the unit; PR body covers both.

**New memory:** `feedback_cron_routes_browser_triggered.md` — Vercel WAF serves a bot-challenge to curl on the deployed site (curl can't hit `/api/cron/*`); give cron/admin routes an admin-session auth path so they're browser-triggerable. Also: `olera-providers` has no `metadata` column (silent-error trap — destructure `error`, not just `data`).

**Resume next session here →** (1) Merge PR #788 → staging → eyeball `/admin/automations` on the staging deploy → apply migration 082 in Supabase → merge `staging → main`. (2) The digest's Tuesday fire is still pending (open `https://olera.care/api/cron/weekly-provider-digest?dry_run=true&limit=400` in a browser as admin, eyeball, drop `dry_run`; runbook `35d5903a0ffe81ea971ecd7c0ba7f7b6`) — it'll now log to `cron_runs`. (3) Flip the Phase 1 Notion task to QA/Done once verified. (4) Phase 2 when ready: per-recipient tables on each job/run + provider/seeker email timeline on `/admin/directory/[providerId]` and `/admin/care-seekers/[seekerId]` — built on Phase 1's `registry` + `cron_runs` + `withCronRun`. (5) Open follow-up noted but not fixed: unclaimed-provider digest unsubscribes don't persist (no `metadata` col on `olera-providers`; the unsubscribe route's olera-providers branch silently 404s) — needs a real opt-out store for unclaimed providers.

---

### 2026-05-11 (Mon evening) → 2026-05-12 — Weekly provider digest expanded to the unanswered-question audience (~20 → ~146+ sends)

Turned `app/api/cron/weekly-provider-digest/route.ts` (Mondays 13:00 UTC) from a ~20-provider analytics email into a demand email to **everyone with a live unanswered question** (~2,700 providers; ~half have an email on file, so ~1,300 reachable). The question is the hook; page views / area demand are a personalization line, not a recipient filter. Collapsed three overlapping Notion tasks (digest revisit / 10-views nudge / Q&A-unopened-followup Phase 3) into one — build task `34c5903a0ffe81468186f69077e6410b`.

**Shipped (all merged to `staging`):**
- **PR #782** — Diff 1+2+3 to the cron + `lib/email-templates.tsx`: new recipient source (`provider_questions` WHERE `answered_at IS NULL AND status NOT IN ('archived','rejected')`), resolution via `business_profiles` (slug, source_provider_id) → `olera-providers` (slug, provider_id), synthesized BP-like record for unclaimed rows, ordering by freshest question DESC then views DESC, email-level dedupe; signal gate now counts a live unanswered question; new demand-led `providerWeeklyDigestEmail` variant (leads with newest question verbatim + "N more questions waiting" line + one-click `generateNotificationUrl` answer button; subject "A family has a question about {business}" — PHI-safe; question HTML-escaped). `emailType` stays `weekly_analytics_digest` (no CHECK-constraint migration).
- **PR #784** — admin-session auth on the cron route. `curl` can't reach the deployed route — Vercel's firewall serves a bot-challenge ("Security Checkpoint") page before the `Bearer ${CRON_SECRET}` check ever runs, which also breaks the manual ramp plan. The route now also accepts a logged-in admin session, so it's dry-run-able + fireable from a browser URL.
- **PR #785** — fix: `olera-providers` has **no `metadata` column**. The fallback `select("...metadata")` errored, `data` came back null, and since only `data` was destructured the resolution loop silently did nothing → 263/300 fell to `unclaimed_or_missing_profile` in the first staging dry-run. Dropped `metadata` from the select (synthesized rows carry `metadata: null` — nowhere on `olera-providers` to store the per-provider opt-out; the unsubscribe route's olera-providers branch has the same latent bug). Added `console.error` on the fallback queries so a bad column can't silently empty the result set again.

**Committed by this `/quicksave` (PR pending):** area-signal fallback for the no-views case — the cron builds a city+state-level demand aggregate from the `cohortRows` it already fetches; the demand-led template's lead line is now, in priority order: views>0 → "Your page got N visits this week, and a family asked you this:"; else areaDemand≥5 → "{N} families looked at senior care in {city} this week. One of them asked you this:"; else city known → "A family looking at care near {city} asked you this:"; else (rare) → "A family on Olera asked you this:". Was a miss from the build spec — for the ~2,700 mostly-unclaimed audience, no-views is the **common** case, not the exception.

**Validated:** staging dry-run `?dry_run=true&limit=300` after PR #785 → `{processed:300, sent:146, skipped:154, skipReasons:{no_email:151, unclaimed_or_missing_profile:3}}`. `unclaimed_or_missing_profile` dropped 263→3. `no_email` ≈ 50% of the freshest-300 slice — the question audience is effectively ~half its size in reachable addresses, so `limit=400` → ~200 sends, `limit=600` → ~300. Sent 6 test emails to tfalohun@gmail.com rendering the real template + real data (Cherry Hill Manor) across all view/no-view/area variants — render is clean (the dark card in Apple Mail is just MPP dark-mode inversion).

**Decisions:**
- Audience = unanswered-question cohort, **not** "providers with >10 views" (only 116, barely above the ~20 already reached). Views are a personalization line, not a recipient filter.
- **Fire from PRODUCTION, not staging** — the otk answer links + unsubscribe links + logo are built from the deployment's `NEXT_PUBLIC_SITE_URL`; a staging deploy would point providers at `staging-olera2-web.vercel.app`. Tuesday fire = promote `staging → main`, prod deploy, then browser-trigger the URL on `olera.care`.
- v1 out of scope (per build plan): `last_digest_sent_at` per-provider guard, ramp-config UI, analytics-only mode for traffic-but-no-question providers, demand line in the per-question transactional email.

**Resume next session here →** (1) Merge the area-signal PR → staging, then merge `staging → main` for the prod deploy. (2) Tuesday fire: open `https://olera.care/api/cron/weekly-provider-digest?dry_run=true&limit=400` in a browser (logged-in admin), eyeball the JSON, then drop `dry_run=true`. Runbook: `35d5903a0ffe81ea971ecd7c0ba7f7b6`. (3) Watch Resend complaint/unsubscribe rate before ramping to ~800/~1500 over the week; Monday 5/18 cron auto-fires at the default `limit=500` (consider bumping the default after the first data lands). (4) First funnel read (digest open → click → sign-in → answer) after one full week. (5) Pre-existing bug noted, not fixed: unclaimed-provider unsubscribes don't persist (no `metadata` column on `olera-providers`; unsubscribe route's olera-providers branch silently 404s) — a real opt-out store for unclaimed providers is a separate follow-up. (6) Build task `34c5903a0ffe81468186f69077e6410b`, diagnostic `35d5903a0ffe81939532c62b7f50e44f`.

---

### 2026-05-11 (Mon) — `/product-led-growth --weekly` (first weekly run) + 10-view provider nudge tasks crafted

First `/weekly` run after two skipped Mondays. Pulled `scripts/growth-pull.js --days 7`, read the Growth Strategy Brief / Running Thread / Command Center, measured the in-flight experiments, wrote the weekly report + Running Thread run entry, then turned to crafting the 10-view nudge task per TJ.

**Weekly findings (current 5/4–5/11 vs prior 4/27–5/4):**

- Demand up, provider response down. 584 questions received (+20% WoW), 10 distinct providers answered anything (down from 22). Unanswered backlog crossed **3,517** and grows ~475/wk. Open→sign-in on Q&A emails fell to ~7.5% (from ~20%). **This is the binding constraint** — and we'd shipped seven seeker-side post-question CTA arms in two weeks with zero real conversions.
- Traffic down ~26–31% WoW (5,153 page views / 4,151 unique sessions vs 6,936 / 6,022). Cause unclear — variance + ongoing organic demotion (the 5/8 GSC diagnostic). Watch; if sessions stay sub-4.5K next week, escalate.
- `benefits_started` −68% is an **instrumentation artifact** — the empathic_single arm renders `EmpathicSingleStep`, which fires `step_name=contact` / `empathic_single_submitted`, not `benefits_started`. `benefits_completed` only −18% (server-side). Metric is unreliable while empathic_single is live.
- **`saves` = 0 this week vs 7 prior.** The guest-save fix shipped 5/1; zero `connections type='save'` rows in a 4,151-session week is a candidate regression. Needs a 5-min check.
- `matches_activated` = 2 — first non-zero ever. `family_profiles_total` = **407**, not the "17" the Strategy Brief quoted (that 17 was the "let providers find me" toggle subset, not the family-profile base). +43 new family profiles this week.

**Shipped:** PR #772 — `scripts/growth-pull.js` now reports seeker relational metrics (`connections type='save'` per window, `business_profiles type='family'` per window + total). We shipped save=profile on 5/1 with no way to read it from the weekly pull; this closes the gap (and immediately surfaced saves=0). Worktree at `~/Desktop/olera-web-growth-seeker-metrics`.

**Notion writes:** Weekly report ("Weekly — May 4–11, 2026") created under Growth Command Center; Command Center snapshot rewritten; Running Thread got a weekly run entry + Active Experiments table updated (outreach arm → "shipped, paused (dial=0%)"; empathic_single + multi_provider arms added; post-answer-hook decide-by → 5/18); Strategy Brief Strategic Backlog #4 elevated to "Next up (active P1)".

**10-view provider nudge — tasks crafted (both P1, Esther, Web App board):**

1. **Parent rewritten** → "Provider nudge email — page views + an unanswered question as the hook" (`34e5903a0ffe8064b7b8c0f8cd7ff8f4`). Reframed the hook from profile-completion to "unanswered question + a real page-view count." TJ's calls baked in: **monthly (30-day) view window**, not weekly/biweekly — senior care web traffic is low and a short window means the number is almost always deflating; and **the number never deflates** — below the bar, stretch to 60/90 days or fall back to an area-level signal, zero views = don't mention views. Generic cron + send pipeline so the stale-Q backlog nudge and the Meet-the-Owner/Photos trigger reuse it. Three-section task convention (Context / What we need / Done when) + a "why now" footer.
2. **v0 split out** → "Add a demand-signal frame to the question-received email" (`35d5903a0ffe810abf0af6603bd37d72`). Folds the demand-signal frame into the existing `questionReceivedEmail` (fires for every question already) — one copy change + one query at send time. Ships first; tells us whether the demand hook moves answer rate at all before the standalone cron gets built.

Build order: v0 in `questionReceivedEmail` → measure answer-rate movement → if it moves, build the standalone monthly-view cron + add the profile-completion trigger on top.

**New memory:** `feedback_senior_care_monthly_windows.md` — use 30-day rolling windows for provider-facing metrics, not weekly.

**Resume next session here →** (1) Check whether the save flow regressed — `connections type='save'` = 0 this week, save fix shipped 5/1. (2) The v0 demand-signal email is the elevated priority — Esther's queue. (3) Watch traffic next Monday's `/weekly`; sub-4.5K sessions = escalate to the GSC/de-indexing track. (4) Decide-or-retire the outreach arm (darked at 0% since 5/6, merged-but-dormant reframe). (5) Post-answer hook formal read needs the `/admin/analytics` funnel columns (`qa_success_arrivals` → picker click → profile edit), not in the weekly pull. (6) Drop `benefits_started` from the weekly KPI block or re-instrument it in the empathic component.

---

### 2026-05-11 (Sun, later) — Found AND fixed a real crawl-access bug: Vercel firewall was denying non-US Googlebot

Followed up on the "Vercel bot challenge" hypothesis from the Project 5 diagnostic (below). It started looking like a dead end — then GSC Host status flipped it: **"Server connectivity: HIGH fail rate, ramping since ~April 9, growing"** (robots.txt fetch + DNS both fine, just server connectivity). That's Googlebot getting refused on a growing 5–20% of crawl attempts. Tracked it to the Vercel Firewall.

**Root cause (confirmed against Vercel's docs):** Vercel WAF executes **custom rules BEFORE managed rulesets**. The managed Bot Protection ruleset auto-exempts verified bots (Googlebot, Bingbot) — but a **custom rule** doesn't. Olera has a custom rule **"Block Restricted Regions"** (created Mar 11, modified through Apr 25): `Country is not any of {Colombia, Ghana, Mauritius, Philippines, Poland, South Africa, United States} → Deny`. Googlebot does geo-distributed crawling — when it crawls from a non-US Google IP, that custom rule **403s it before the managed ruleset's verified-bot exemption ever applies**. Amplified by the Apr 3 firewall changes (Bot Protection → Challenge mode, AI Bots → Deny mode), which line up with the ~Apr 9 start of the server-connectivity ramp; the bucket's steepest jump (Apr 24→May 1, +12K) overlaps the Apr 21/25 region-rule edits. This is a *separate* problem from the content-quality bucket — two real issues stacked.

**Fix shipped (TJ, in Vercel dashboard):** New custom WAF rule **"Allow verified search bots"** — `If User Agent Matches expression: Googlebot|Google-InspectionTool|bingbot|Applebot` → action **Bypass** (skips all subsequent custom + managed rules), placed **above "Block Restricted Regions"** in the custom-rules list. Published (takes effect immediately, no redeploy). This is exactly Vercel's documented pattern for allowlisting traffic blocked by your own custom rule.

**Verified:** GSC URL Inspection → Test Live URL on `https://olera.care/` (run *after* publishing the bypass rule) → returns the real homepage HTML — `<title>Olera | Find Senior Care Near You</title>`, `<meta robots content="index, follow">`, full Next.js app markup, **zero "Vercel Security Checkpoint" markup**. Crawler access restored.

**Still pending (lagging metric):** GSC → Settings → Crawl stats → **Host status** — "server connectivity" fail rate should fall toward ~0% over the next 3–7 days. Check next week. Also watch the 14% 404 crawl-share decline over 30–60 days (proof Project 4's deletion-redirects are working).

**Decisions left for TJ:**
- The "Block Restricted Regions" rule is an aggressive 7-country *allowlist* (Deny everything else) — also 403s real US families traveling abroad + anyone in Canada/UK/AU/etc. The bypass rule protects crawlers regardless, so not urgent, but worth reconsidering (a *denylist* of bad ASNs/countries, or switching action Deny→Challenge, would be gentler). TJ's product call.
- Whether the Apr 3 Bot Protection (Challenge) + AI Bots (Deny) settings are worth keeping as-is — they auto-exempt verified bots so they're probably fine now that the bypass rule fronts them.

**Net for de-indexing recovery:** two fixes landed this session — PR #771 (noindex `/review/*` forms, ~55% of the 52.4K not-indexed bucket) + the firewall bypass + Deny→Challenge on the region rule (restores intermittent-denied Googlebot crawl). Both should compound over the next 30–90 days. **Project 6 scoped** (2026-05-11) in the Notion tracker — provider-page content uplift (run `scripts/backfill-highlights-data.js` for reviews + trust signals; new `scripts/backfill-provider-descriptions.js` to regenerate the 43% boilerplate descriptions via Perplexity) + sitemap quality threshold (exclude zero-signal providers from `app/sitemap.ts` + `app/api/sitemap/route.ts`; page stays live, just not submitted). ~3–5 working days, ~$50–60 Perplexity. Sequencing: let the firewall fix's server-connectivity fail rate settle to ~0 first. Also a P3 task on the Web App board: rebuild "Block Restricted Regions" as an ASN denylist + rate limit (or retire it).

---

### 2026-05-11 (Sun) — Project 5 diagnostic complete: the 52.4K "Crawled, not indexed" bucket is mostly junk that shouldn't be indexed

Parsed the GSC export TJ pulled (`docs/https___olera.care_-Coverage-Drilldown-2026-05-09/Table.csv` — 999 URLs, ~1.9% sample of the 52,398-page bucket). Diagnostic-only session — **no code changed**. Full report shipped as a Notion sub-page under the tracker: [Project 5 Diagnostic](https://www.notion.so/35d5903a0ffe8166a3d4dc9132ac2c23).

**The headline:** the bucket is not "directory too thin" — it's majority pages that should never have been indexable.
- **`/review/[slug]` — 55% of the sample (~29K est.)** — these are the client-rendered review *submission* forms (star picker + textarea), not content pages. `"use client"` → only a spinner in initial HTML, no `noindex`. Discovered via a `<Link href="/review/{slug}">` in `ReviewsSection`, which renders on every provider page → Google crawls all ~75K of them. Not in any sitemap. **Fix: noindex the route (`app/review/layout.tsx`) + de-link / `nofollow` the `<Link>`.** Not a directory page, so TJ's "noindex too drastic" concern doesn't apply. ~30 min, zero downside, removes >half the bucket over the next recrawl cycle.
- **`/provider/[slug]` — 34% (~18K est.)** — the real thin-content bucket. The pages are fine structurally (SSR, metadata, breadcrumb/LocalBusiness/FAQ JSON-LD). The gap is unique-content density: 76% of descriptions are 150–300 chars, 43% are literal boilerplate ("X provides [category] services for senior elders in the [City] area. To find the right care…"). Un-indexed ~18K ≈ {boilerplate} ∩ {few/no reviews} ∩ {no AI trust signals}. 75,352 active providers, all in the sitemap at flat priority 0.7. **Fix (per TJ's hierarchy uplift > prune > noindex): backfill reviews + trust signals (`scripts/backfill-highlights-data.js`) + regenerate boilerplate descriptions via the pipeline's Perplexity step, then sitemap-prune the zero-signal long tail (page stays live for navigational queries, just not submitted).** Days of backfill + ~2 hr sitemap work.
- The rest is small: power pages + `/page/N` pagination ~5% (~2.6K), `/_next/static/chunks/*?dpl=*` ~2.7% (~1.4K, cosmetic — don't block /_next, Google needs JS/CSS), `/benefits` + `/waiver-library` stubs ~2% (~1.1K, let benefits pipeline catch up), `/browse?type=&q=` faceted-search URLs ~0.8% (~420, should be `noindex`).

**Hypothesis flagged for TJ to rule out FIRST (before any code):** curl-as-Googlebot and WebFetch both got Vercel's **"Security Checkpoint"** interstitial instead of page content. Real Googlebot is IP-verified so it *should* be allowlisted — but if Vercel bot protection / Attack Challenge Mode is challenging verified Googlebot or its render-fetches, that's a site-wide indexing killer and would also explain the unexplained Aug-2025 cliff. **Check (~10 min): GSC URL Inspection → "Test Live URL" on 3 un-indexed URLs → "View tested page". If it shows the Vercel checkpoint → fix bot-protection settings. If it shows the real page → hypothesis dead.**

**Sample caveat:** `/review/`'s 55% is probably inflated (linked from 75K provider pages → over-crawled → over-represented in a recency-weighted sample). Even at a conservative 30% it's ~15K and still the #1 lever. A tighter number needs the GSC API or a Bing Webmaster cross-check — not worth it; the action order doesn't change.

**Top 3 actions (TJ's call which become Project 6+):** (1) noindex `/review/*` + de-link — ship first, ~30 min. (2) Verify the Vercel bot-challenge hypothesis in GSC — ~10 min. (3) Provider-page content uplift + sitemap prune — addresses the ~18K real bucket. Everything else (pagination noindex, `/browse` noindex, benefits stubs, `/_next` noise) is ≤half-a-day cleanup, schedule when convenient.

**Resume next session here →** wait for TJ to decide which of the 3 (or the cleanup items) becomes Project 6. If #1 ("noindex `/review/*`"): add `app/review/layout.tsx` with `export const metadata = { robots: { index: false, follow: true } }`, change the `<Link href={reviewPageUrl}>` in `components/providers/ReviewsSection.tsx` (~L460/L480) to a button + `router.push` or add `rel="nofollow"` — leave the `window.location.href = reviewPageUrl` redirects alone (not crawlable). Branch off `staging`, PR to `staging`. Don't touch the other buckets unless TJ scopes them in.

Open follow-ups carried forward: re-submit the 4 GSC-removal-expired URLs; diagnose the Aug-2025 cliff (may collapse into the Vercel-bot check or the provider-uplift work); Projects 2 + 3 (audit script + pipeline pre-filter) — still lower urgency than the de-indexing fixes.

---

### 2026-05-08 (Fri evening) — Project 4 shipped same-day, Project 5 added when TJ flagged we missed the biggest GSC bucket

Continued from this morning's session. Where we landed:

**Project 4 shipped (PR #766, merged to staging at `bc8dd8bf`).** Adds `deletion_reason` column to `olera-providers` + reason-aware response in `app/provider/[slug]/page.tsx`. Soft-deleted providers now redirect (HTTP 308) to `/{category}/{state}/{city}` instead of returning a generic 404. Volume of impact: 40,240 deleted rows total — much larger than the original ~7K estimate. Of GSC's 18,281 "Not found" bucket, an estimated 10–15K should transition to 301s once Google recrawls (30–60 days).

**Files in PR #766** (commits `1594b6c1`, `e650cf7f`, `c8935c67`, `d7cf067f` on staging):
- Migration `081_provider_deletion_reason.sql` (originally drafted as 079, renumbered after PR #767 took the slot mid-session). Applied to production by TJ via Supabase dashboard before the rename — DB had no migration tracker so the rename was purely codebase hygiene.
- `lib/classify-deletion-reason.ts` — keyword classifier mirroring the migration regex; reused by admin PATCH so future deletes get structured reasons.
- `lib/power-pages.ts` — added `buildPowerPageUrlForDeletedProvider()` that walks category → state → city, falling back to `/{category}/{state}` when city is missing.
- `app/api/admin/directory/[providerId]/route.ts` — writes `deletion_reason` on the same UPDATE that toggles `deleted=true` (NULL on restore).
- `app/provider/[slug]/page.tsx` — third lookup without the deleted filter, branches on reason. **Critical ordering: runs AFTER the business_profiles lookup** so a claimed page whose underlying iOS row got soft-deleted still wins. (Caught this in pre-test review — fixed in commit `c8935c67`.)
- Page response logic: `provider_request` → `notFound()` (404 placeholder; HTTP 410 needs middleware refactor — deferred since 0 rows currently in this bucket; the 5 confirmed takedowns are pre-soft-delete-era, tracked in `provider_removal_blocklist` from PR #764). Everything else (incl. NULL) → `permanentRedirect()` to power page.

**The course-correction that prompted Project 5 (the most important moment of the evening):** After PR #766 merged, TJ asked "do any of our projects actually address the currently-not-indexed problem?" — and they don't. The 4-project plan was 100% focused on the 18K "Not found" bucket. The 52.4K "Crawled — currently not indexed" bucket — the **largest** GSC bucket — was completely untouched.

That's a content-quality / page-authority problem, structurally different from removal hygiene. Likely candidates: thin programmatic provider pages (~40K providers, many sparse), power pages too similar to each other, weak unique content on benefits/waiver/state hubs. **Different causes need different fixes — don't fix blind.**

**Project 5 created** as a diagnostic before any implementation work. Full plan in the Notion tracker.

**Step 1 already done by TJ tonight.** GSC export saved to `eager-yalow/docs/https___olera.care_-Coverage-Drilldown-2026-05-09/` — three CSVs inside (`Table.csv` is the URL list, `Chart.csv` is time series, `Metadata.csv` is filters). Note: nested in the worktree's `docs/` folder (untracked, intentional — not committed). Next session jumps straight to parsing + categorizing the URLs in `Table.csv`.

**Remaining steps:** (2) Parse the CSV, categorize by URL pattern. (3) Sample 20–30 URLs per major bucket. (4) Output a categorized report with prioritized fix levers + effort estimates. **Then TJ decides what to ship as Project 6+.**

**Tracker:** [De-indexing Recovery — 5-project plan](https://www.notion.so/35a5903a0ffe814ea770d346230207c4) (title bumped from 4-project this evening). PR #766 merge needs a Notion merge report next session if desired.

**Resume next session here → Project 5 diagnostic.** Cold-start checklist for the next Claude:
1. Read this SCRATCHPAD entry + the [Project 5 section in Notion](https://www.notion.so/35a5903a0ffe814ea770d346230207c4) for full context.
2. **CSV is already exported** — read `Table.csv` from `/Users/tfalohun/.claude-worktrees/olera-web/eager-yalow/docs/https___olera.care_-Coverage-Drilldown-2026-05-09/`. No need to ask TJ.
3. Parse the CSV, group URLs by route shape (see Notion bucket list).
4. Sample 20–30 URLs per major bucket, fetch live pages, inspect: word count + unique-content density, schema present (FAQPage / LocalBusiness / Review / Article), internal links pointing in, provider-specific data density (review count, photo count, description length, AI trust signals), `last-modified` / canonical / robots.
5. Output a categorized report: URL pattern → count → likely cause → recommended fix lever → effort estimate. 5–10 example URLs per pattern with diagnostic notes. Top 3 prioritized actions.
6. Ship the report as a Notion sub-page under the tracker + a SCRATCHPAD entry. **Do NOT start implementation work in this session — TJ wants to see the diagnostic first and decide.**

**Files the next session should read for context:** `app/sitemap.ts` (current sitemap structure), `app/provider/[slug]/page.tsx` (provider detail render — most likely thin bucket), `app/[category]/[state]/[city]/page.tsx` (3-tier power page), `lib/provider-highlights.ts` (content density signals), `lib/power-pages.ts` (query/render utilities). Plus this SCRATCHPAD entry and the Notion tracker.

**Behavioral guidance for next session:** TJ pushed back hard this morning when I recommended noindex as a fix for the 52K bucket — called it "too drastic for a directory" since noindex blocks navigational queries (families searching specific provider names). The right framing for any fix recommendation is to favor uplift > sitemap pruning > consolidation > noindex (last resort). Sitemap pruning is the gentler version of noindex; noindex itself stays off the table unless TJ raises it.

**Open follow-ups (lower priority than Project 5):**
- Re-submit the 4 GSC-removal-expired URLs (Mariemont, Kendra's, Johnson, Next Best Home) to GSC's Removals tool — ~5 min lever to accelerate de-indexing.
- Diagnose the August 2025 traffic cliff (~98% unexplained). May actually overlap with Project 5 — if the demotion was content-quality driven, fixing the 52K bucket is also the cliff fix.
- Project 2 (periodic audit) + Project 3 (pipeline pre-filter) — prevent future re-adds, don't heal current bleeding. Schedule when convenient.

**Diagnostic on the bigger picture:** The 4-project plan addressed an SEO hygiene problem (deletion handling). The August 2025 cliff + 52K not-indexed are an SEO authority problem (content quality, page authority). Different domain. The hygiene work was necessary but not sufficient — Project 5 starts the pivot to the authority side.

---

### 2026-05-08 (Fri) — GSC indexing diagnostic + Project 1 shipped: provider removal blocklist (P1, on `quiet-kepler`, ready for PR)

Started as "why so many crawled-not-indexed pages?" Pivoted twice as the evidence reframed the question, ended with a 4-project plan AND shipped the foundation (Project 1: data layer + admin surface). Migration applied to production Supabase mid-session; TJ caught up the blocklist with all known provider-requested takedowns via the admin UI before the PR was opened.

**The investigation chain:**

1. **GSC shows 52.4K "Crawled - currently not indexed"** trending up (rising faster than indexed line is growing). Initial framing: thin-content programmatic SEO problem. Recommended sitemap pruning + content uplift.
2. **TJ pushed back on noindex as too drastic** for a directory. Re-read: noindex blocks navigational queries (family searches "X care center"); right move is sitemap hygiene + content uplift, not blanket noindex. Walked back the recommendation.
3. **Pulled the full not-indexed breakdown.** 127K total not-indexed across 12 buckets. Surprising sub-buckets: 18,281 "Not found (404)" + 12,287 "Page with redirect" + 2,929 "Soft 404" = ~33K technical hygiene problems. The 52K is partly a downstream symptom of upstream URL instability.
4. **Pulled Performance over 16mo.** Found a cliff in late August 2025 — daily traffic dropped ~40-50% (peak ~900 clicks/day → post-cliff ~300-500/day) and never recovered. Likely aligns with August 2025 Core Update. Reframed the problem: this is a traffic demotion, not just an indexing issue.
5. **Top historical query was "mariemont care center" (1,038 clicks).** Provider-name navigational queries used to drive substantial traffic. They've collapsed post-cliff.
6. **TJ noted Mariemont was a removal request.** Quantified: removal accounts for ~1-2% of cliff, not 50%. Cliff is still mostly unexplained — but raised the removal-handling question.
7. **TJ confirmed ~7,000 cumulative removals** (15 provider-requested, ~7K from data-sweep cleanup processes). Investigated how removals are handled.

**Key technical findings:**

- **Soft-delete returns HTTP 404 with no redirect.** `app/provider/[slug]/page.tsx:294,310` filters out deleted rows; line 357 calls `notFound()` → generic 404 page. No middleware logic for deleted providers (`middleware.ts` only handles v1.0 URL redirects). Each of the ~7K deletions becomes a 404 in GSC's "Not found" bucket — explains ~39% of the 18,281 there.
- **`app/not-found.tsx` is a generic template.** No "this provider was removed" context, no redirect to similar-in-city. Bad signal for both Google and users.
- **Pipeline dedup IS architected correctly.** `scripts/pipeline-batch.js:645-676` loads `deletedNameSet` (name|state) + `deletedPlaceSet` (place_id) at startup, rejects matches in the city-clean step. Comment: "the pipeline never re-adds a [soft-deleted provider]."
- **But there are gaps:** (a) name|state key has no normalization shown — misses "The Mariemont" vs "Mariemont", "Kendra's" vs "Kendras", "& vs and"; (b) place_id occasionally reassigned by Google on merges; (c) no `deletion_reason` column to distinguish provider-request (legal/ethical, never re-add) from data-sweep (could re-add with override); (d) silent skip on match — no log, no alert; (e) phone number is a stable signal not used in dedup.
- **CRITICAL: Source-of-truth drift between Airtable and Supabase.** Two of nine visible takedown cases (Mariemount Care Center, Next Best Home) are tagged "Requested Takedown" in Airtable but `deleted=false` in Supabase. **Their pages are likely live and indexed against the providers' explicit request.** GSC removal expired Dec 22 / Nov 18 2025 respectively (temporary tool only lasts ~6 months), so they came back to public search. This is a legal/ethical issue independent of SEO and the urgent fix.

**The 4-project plan:**

1. **Reconcile existing drift** (~1hr): cross-check all Airtable "Requested Takedown" rows vs Supabase `deleted` flag. Flip the unhonored ones. Re-submit expired URLs to GSC Removals tool. Urgent for Mariemount + Next Best Home.
2. **Add `deletion_reason` column + reason-aware handling** (~half day): `'data_sweep' | 'provider_request' | 'duplicate' | 'out_of_scope'`. Drives different page response: provider_request → HTTP 410 Gone with "no longer listed" + alternatives. data_sweep → 301 to `/{category}/{state}/{city}` power page. Preserves equity for ~7K bleeding 404s.
3. **Harden pipeline dedup** (~half day): `normalizeProviderKey()` (lowercase, strip articles/punctuation/&-and, suffixes), add phone as third dedup signal, looser fuzzy match for `provider_request` rows, hard-fail loud (Slack alert) when pipeline tries to re-add a provider-request-deleted business.
4. **Sync + audit** (~scaffold in 2hr, ongoing): Airtable→Supabase sync (one-way, single source of truth), monthly cron audit (drift detection, re-add detection, page-status check), update data-sweep skill Phase 0 to verify Airtable/Supabase consistency before any cleanup work.

**Mariemount + Next Best Home urgency dissolved** mid-session: queried Supabase by every available angle (slug, name ilike, provider_id from Airtable) — both records are gone entirely. Hard-deleted pre-soft-delete-era. Page returns 404 (notFound() in route), so the takedown was effectively honored, just via a path that left no audit trail. Legal/ethical urgency dissolves; the actual risk is the city pipeline re-discovering and re-adding via fresh Google Places search.

**TJ's pragmatic reframe:** real-time blocking is overkill — re-adds aren't instant in their effect. Google takes days to re-index, weeks to re-rank. Periodic audit catches drift before it ever becomes user-visible. Keeps architecture simple. Replaced the earlier "harden pipeline dedup with real-time check + Slack alert" with a periodic audit script approach.

**What shipped (commit `08d3dcc1` on `quiet-kepler`, ready for PR):**

1. **Migration `078_provider_removal_blocklist.sql`** — new `provider_removal_blocklist` table, independent of `olera-providers.deleted` so hard-deleted-era takedowns are still enforced. Columns: provider_name, normalized_name, city, state, phone, place_id, reason (provider_request | data_sweep | duplicate | out_of_scope | other), evidence, notes, added_by_email, added_at. UNIQUE(normalized_name, state). Indexes on normalized_name, phone (partial), place_id (partial), reason. RLS-on, service-role-only. Seeded with 5 confirmed provider-requested takedowns (Conejo Valley, Kendra's Place, Johnson Residential, Mariemont, Next Best Home) cross-referenced from email + GSC removals.

2. **`lib/normalize-provider-name.ts`** — shared helper for symmetric matching at seed-time + check-time. Lowercase, strip leading article (the/a/an), `&→and`, strip apostrophes WITHOUT inserting a space ("Kendra's"→"kendras", caught a real bug here mid-build), other punctuation→space, strip trailing business suffixes (LLC/Inc/Corp/etc), collapse spaces. 10/10 unit cases pass including all variant equivalence (apostrophe / "The X" / "& vs and" / "LLC"). Used by both API endpoint and admin UI's live-normalization preview.

3. **`app/api/admin/removal-blocklist/route.ts`** — GET (with `?q=` substring search using normalized form), POST (validates required fields, computes normalized_name, returns 409 on UNIQUE violation), DELETE (`?id=` query param, audit-logged). All wrapped in `getAdminUser()` gate matching existing admin route pattern.

4. **`app/admin/removal-blocklist/page.tsx`** — table view (Provider / Location / Reason / Evidence / Added). Debounced search box that shows the live normalized form below as you type (so admins see what's being matched). Add modal with full field set. Delete with confirm. Reason badges colored: provider_request=rejected/red, data_sweep=pending/yellow, others=default/gray.

5. **AdminSidebar.tsx** — "Removal Blocklist" link added under Manage section, alongside Verification / Disputes / Removals.

**Migration applied to production Supabase mid-session** (TJ ran it via dashboard). All 5 seed rows verified via direct REST query — normalized_name values match what the helper produces. TJ then used the admin UI to add the remaining ambiguous-but-confirmed cases (Suwanna Buntyn, Nitu Aggarwal, etc.). Blocklist is current.

**Resume next session here →** Project 2 (audit script). `scripts/audit-removal-blocklist.js`: load blocklist, fuzzy-match against active `olera-providers` (deleted=false) using normalized_name + phone + place_id, alert on hits via Slack. Run cadence: weekly cron + manually after every city pipeline batch. Once Project 2's matching logic is settled, Project 3 (~30 min) wires the same check into `scripts/pipeline-batch.js` as a pre-filter alongside the existing deletedNameSet — belt-and-suspenders. Project 4 (the SEO equity fix for the 18K 404s) is independent and can ship anytime: add `deletion_reason` column to olera-providers, route soft-deleted pages to HTTP 410 (provider_request) or 301 to `/{category}/{state}/{city}` (data_sweep) instead of generic 404.

**Open diagnostic questions still on the table:**

- What caused the August 2025 cliff specifically? Need GSC Performance comparison (pre-cliff vs post-cliff) on Queries tab and Pages tab, sorted by Click difference. Mariemont removal explains <2% of it; ~98% of the loss is unexplained. The hygiene fixes will repair ongoing damage but don't diagnose the original wound.
- Did a major deletion wave happen around August 2025 (sweep before the formalized data-sweep skill)? `deleted_at` timeline analysis would correlate.

---

### 2026-05-07 (Thu) — Empathic single-step (Arm D) consolidation + mobile UX foundation (P1, PR #760 awaiting merge)

Reframed the empathic arm of the post-question CTA from a 3-step relay (care need → relationship → email) into a single-step capture with value preview, modeled on the only post-question mechanic that's converting (qa_email_capture). Branch `feature/empathic-single-mobile` → 6 commits → PR open to staging.

**The strategic arc (yesterday's funnel review → today's ship):**

Pulled real conversion numbers across all 5 arms in the post-question CTA family. None converted. With iCloud test submissions filtered out: 0 of 956 empathic, 0 of 944 availability (the dashboard's "2" was click-events, no real account creations), 0 of 973 loss, 0 of 418 outreach (4 of 4 were TJ tests), and the only directional signal was qa_email_capture's 2 of 126 (~1.6%). TJ's Door-A-vs-Door-B framing landed: the sticky "Check cost" bar produces 138 thin email-only leads/30d while the post-question CTA produces ~5 fully-qualified ones — the ~10x lead-value multiplier on a qualified lead means the post-question lane is real but the multi-step structure is broken. TJ chose to invest in Door B as the qualified lane and keep iterating; redesign the empathic arm specifically since "questions draw the most engagement."

**What shipped on PR #760:**

1. **`d2a61711`** — Initial implementation. New `EmpathicSingleStep` component renders inline within `BenefitsDiscoveryModule` via early-return when variant === "empathic". Question echo (12px italic gray) → intent-mapped H2 (cost / care-type / fit / default) → 2 real program preview chips → email field with autofill + 16px font + 48px tap height → dynamic CTA "Email me my N {state} matches →" → trust line. Care need + intent inferred from question text via keyword classifier (`lib/benefits/infer-care-need-from-question.ts`). Three retired arms' copy frames preserved as situational copy mapped by intent — empathic warmth as default, loss data point ($400-900/mo) for cost questions, availability "families like yours" for care-type. New shared hooks: `useViewportGate`, `useReducedMotion`, `useKeyboardOpen`, `tapHaptic` in `MobileUXPrimitives.tsx`. Sticky "Check cost" bar viewport-suppressed when benefits module ≥50% in viewport (Door-A-vs-Door-B cannibalization fix). New endpoint `/api/benefits/update-relationship` for soft post-submit enrichment via session_id join.

2. **`ce258988`** — Pre-test self-review caught two critical bugs. (1) `BenefitsDiscoveryModule` was using a standalone 3-arm hash (`assignBenefitsVariant`) uncorrelated with the 5-arm dial — so setting empathic=60% on the dial would have only delivered empathic_single to ~20% of total traffic (the other 40% landed on legacy availability/loss copy via the inner uniform hash). Switched to `useIntakeVariant()` so the dial drives copy. (2) `MobileStickyBottomCTA`'s IntersectionObserver attached on mount to the SSR-rendered legacy section; when variant resolved to empathic, React replaced that section with `EmpathicSingleStep`'s new section and the observer was orphaned — sticky bar would NEVER suppress for the 60% empathic audience. Added MutationObserver on document.body to re-attach IO when `#benefits` reference changes.

3. **`a0453808`** — UX pivot per TJ feedback. Original implementation opened the full `ResultsSheet` on submit (match list + provider tie-in + benefit-detail links). TJ flagged it as a hijack: user came for a specific provider, sheet pulled them off into a benefits-detail flow. Replaced with an inline success state in the same section: "✓ Sent — check your inbox. We emailed your N {state} matches to {email}." + the relationship pill row. Match list, provider tie-in, and benefit-detail links all live in the email instead. Page UI keeps the user on the provider they came to see. Reverted the `showRelationshipPills` prop addition to ResultsSheet since empathic_single was the only consumer and now handles pills inline.

4. **`0202a73a`** — Scroll behavior fix. Post-question scrollIntoView was over-scrolling on iPhone — module's bottom landed near the top of the viewport, H2 + echo cropped above the visible area + sticky tab nav. Two fixes stacked: `block: "start"` → `"center"` (so the module's middle aligns with the viewport's middle, no nav cropping), and single rAF → double rAF (lets React commit the quotedQuestion state update + Q&A's question-card DOM insertion settle before measuring scroll target). Applied to both legacy 3-step and empathic_single listeners.

5. **`2e305dce`** — Stale docstring cleanup referencing the removed ResultsSheet.

6. **`1359e2ef`** — Empty commit to force a Vercel rebuild after the dashboard wasn't picking up `ce258988`.

**Admin parity verified:** empathic_single appears in the Family Intake variant dial (relabeled "Empathic — single-step (D)" surface label, "Single-step capture w/ value preview" sub-label), the Preview ↗ link forces the empathic_single render via `?preview_arm=empathic` (also fixed `assignBenefitsVariant` to honor the URL override — was a real gap before), and events fire with `variant=empathic` so the dashboard buckets correctly without a code change. Funnel continuity preserved via `step_name=contact` on submit; new `step_name=empathic_single_submitted` added for structural segmentation.

**Notion catalog updated:** SBF Copy Variants DB has `empathic_single` as Arm D (Status: Planned) carrying the full locked spec. The 3 retired arms (availability/loss/empathic) moved from Live → Paused (new status added to the schema), notes reframed as iterable bench assets ready to re-deploy + optimize when D's read is in. Two legacy V2 arms (control, money_loss) remain Archived.

**Default weights flipped in code (60/0/0/20/20)** but the live `experiment_weights` row still reads `25/0/25/50/0` (the dashboard showed it at v7) — TJ's call when to re-balance via the dial post-merge.

**Files modified (10 total):** new `lib/benefits/infer-care-need-from-question.ts`, `components/providers/connection-card/MobileUXPrimitives.tsx`, `components/providers/BenefitsDiscoveryModule.empathic.tsx`, `app/api/benefits/update-relationship/route.ts`. Modified `components/providers/BenefitsDiscoveryModule.tsx`, `components/providers/MobileStickyBottomCTA.tsx`, `components/benefits/ResultsSheet.tsx`, `lib/analytics/variant-copy.ts`, `lib/analytics/variant.ts`, `app/admin/analytics/page.tsx`.

**Tips for future variants** (embedded in the PR + memory):
- Add to `INTAKE_VARIANTS` array first — TS errors are the checklist (default weights, surface labels, sub labels, dashboard buckets, drillable variants set).
- Variant assignment must honor `getPreviewArm()` / `?preview_arm=` — either use `useIntakeVariant` (already wired) or add the URL check at the top of any custom assigner.
- Always check `isPreviewMode()` in submit handlers — block API calls + show "Preview mode — submission disabled."
- Fire `step_name=contact` on submit (canonical dashboard marker) AND your variant-specific marker on top — never instead.
- Don't change variant identifiers post-launch. To evolve an arm, keep the variant value the same and change only what it renders.
- Update Notion SBF Copy Variants + admin's `activeArms` description for the human-facing surfaces.
- Server-side `seeker_activity.benefits_completed` is the source of truth for conversion. Client-side `step=contact` is a click event that fires before the API call — over-counts retries, masks failures.

**Resume next session here →** PR #760 awaiting TJ's mobile test on the branch preview (`olera-web-git-feature-empathic-single-mobile-olera.vercel.app`). When green, merge to staging → main. Decide on dial allocation (recommended: 60/0/0/20/20 to give empathic_single full benefits-arm budget + keep outreach + qa_email_capture running for comparison). Watch funnel daily for 5–7 days against current 0/956 baseline. If empathic_single moves the needle even modestly (>1% submit/imp), that's a 10x+ lift.

---

### 2026-05-06 (Wed) — Outreach variant reframe + measurement instrumentation (P1, on `lively-ride`, awaiting PR)

The outreach arm of the 5-way intake A/B (`AgentOutreachModule`) was getting impressions and almost no engagement. TJ flagged it as a "great potential" surface that wasn't converting. Pulled the data, diagnosed three structural issues, shipped fixes for the first two on `lively-ride`. Branch has 4 commits, pushed, ready for PR.

**Data pulled (Supabase live):** Outreach arm ran ~2 days at full weight before TJ darked it to 0% earlier today. 330 distinct sessions saw the module → 11 card clicks (3.3%) → 3 submits (0.9%). Target was 6%. EVERY surface on provider pages converts <1% — outreach isn't uniquely broken, but the gap to target is real.

**Diagnoses, ranked:**

1. **CTA competition.** Sticky bottom "Check cost" bar (`MobileStickyBottomCTA`) is always-visible on mobile after 100px scroll, more concrete copy ("What does this cost?"), thumb-reachable. Outreach module is below the fold of Q&A. Most outreach-arm sessions were converting via the sticky bar instead — but cannibalization was UNMEASURABLE because `lead_received` events didn't carry `session_id`.
2. **Ghost impressions.** `outreach_module_impression` fired in `useEffect` on mount, not on viewport entry. Module is below Q&A so meaningful share of arm sessions never scrolled to it. Real "viewed it" denominator was probably 30-50% of mount impressions — making the conversion rate look worse than it is.
3. **Persona mismatch.** Old copy ("Skip the phone calls" / "Have an AI agent contact the top providers") read as a service offering. TJ's persona reframe: spouse/adult-child of elder in care-decision crisis — lost, time-pressed, wary of sales pressure. Wants orientation, not concierge. "AI agent" is loaded for this audience.

**What shipped (4 commits on `lively-ride`):**

1. **`0a9d9476`** — Copy reframe across 6 files. New H1: "Don't know which one to trust?" New sub: "Our care team will get pricing, availability, and how to start from the top N {category} providers in {City} — in one email." CTA: "Send me the comparison." Trust line ("No phone calls. No sales pitch. Just the facts.") promoted from 11px fine print to 13px medium body. Post-submit anchors a 24-hour SLA. Old caption removed (sub does that work). Source-of-truth copy in `lib/analytics/variant-copy.ts` updated so admin preview + dial description + surface labels all match. Reframed from service-offering to guide-orientation — "our care team has vetted these and will hand you the answers."

2. **`60bcfd63`** — IntersectionObserver gate for impression. Wraps the section in observer, fires `outreach_module_impression` only when ≥50% in viewport. Ref-guarded so React strict-mode double-mount can't double-count. Falls back to immediate fire when IntersectionObserver unavailable. Means the conversion-rate denominator is now "actually saw it" rather than "server rendered it" — critical for re-baselining against the 6% greenlight target.

3. **`37c520e5`** — `session_id` threaded through `lead_received` events. Three insertion sites updated (`connections/create-inquiry`, `connections/request` × 2 — guest path + auth path). Frontend hook `use-connection-card.ts` sends `session_id: getOrCreateSessionId()` in all 4 fetch bodies. Server routes destructure as optional, write to metadata. Existing `lead_received` allowlist unchanged (no new event_type, no migration). Now joinable to arm impressions in `seeker_activity` for cannibalization analysis the moment the next leads land.

4. **`15e77b50`** — Pre-test fix. Self-review caught: with the IntersectionObserver gate, `sessionIdRef` was only populated when impression fired (≥50% threshold). But cards sit at the top of the section, form at the bottom — a user scrolling and tapping a card before the threshold would send `outreach_card_clicked` with empty session_id. Fix: separate mount effect populates `sessionIdRef` eagerly, decoupled from impression gating.

**The dial is still at outreach=0%.** Re-enabling is a separate decision. Recommended: drop qa_email_capture (49 sessions / 0 enrichments in 7d — effectively dead) and run 50/50 availability vs outreach for the cleanest read. Aim for ~600 viewport-gated impressions per arm before deciding (~5–7 days at current traffic).

**Decision rule, re-baselined:** With viewport-gated impressions, the denominator means real views. The original 6% target was set against inflated mount-impression denominators. New thresholds: green ≥4%, yellow 1.5–4% (iterate, don't kill), red <1.5% (reframe wrong direction).

**Resume next session here →** Open PR `lively-ride` → `staging`. Once merged + Vercel deploys, bump dial to 50/50 availability/outreach. Watch funnel daily for 5–7 days. If green, ramp outreach to 70% and queue UX layer (carousel earning its keep, drop relationship chips, address dual-CTA problem with sticky bar). The third structural diagnosis from today (CTA competition) is unfixed — we instrumented it (cannibalization is measurable now) but didn't change the UX. If the new copy doesn't move the needle, that's the next lever.

---

### 2026-05-06 (Wed, early AM) — Production promotion + dial in live use (continuation of last night's work)

Promoted the staging backlog to main via PR #745 (33 commits, 50 files, +5,225/-894). Final main SHA: `68fef731`. All three migrations (068, 069, 070) verified applied to the shared Supabase before the merge.

**TJ's first real dial use, saved overnight:** `{availability:50, loss:0, empathic:0, outreach:0, qa_email_capture:50}` at version 2. Head-to-head between the SBF availability-framing arm and the qa_email_capture (no SBF / Q&A enrichment) arm. Other arms zeroed out — exactly the use case the dial was designed for ("sometimes I want two arms only").

**6am follow-up — apparent leakage on dark'd arms.** TJ noticed the variant split table showed non-zero impressions on loss/empathic/outreach despite those being at 0% in the dial. Diagnosed via direct DB query:

```
                   before save    after save
  availability         173            28
  loss                 176            26    ← should be 0
  empathic             202            26    ← should be 0
  outreach             237            10    ← should be 0
  qa_email_capture       9            46
```

Two effects, both expected:

1. **Most "wrong arm" impressions are pre-dial-save data (v1, equal-split mod-5)** still in the analytics window. Aggregator doesn't know about version transitions; date-range filter is the workaround. Will age out within 24h on "Today" filter, ~1 week on default windows.

2. **Small post-save in-tab leak (62 impressions over 4-5 hours)** from users whose tabs were already open when TJ saved the dial. The `useIntakeVariant` hook caches `weightsPromise` at module level for the tab's lifetime — so users with continuous tabs stay on their v1-assigned arm until they close/reopen. Bounded by tab churn; expected to drop below 10% in steady state, dilute to noise by end-of-week.

**Decision: leave the cache alone** (TJ chose path 3 of 3 options I offered — "leave it" vs "refetch on visibility change" vs "TTL the cache"). Saved the trade as `feedback_intake_variant_cache_tradeoff.md` so future sessions don't re-propose tightening it.

**Net:** dial works as intended. Over the course of the day, signal will favor availability+qa_email_capture by ~80-90%; by end-of-week, ~95%+. Plenty of statistical power to read a winner.

**Resume next session here →** Watch the variant split on the new live allocation. If qa_email_capture clearly out-performs availability over 7-14 days, ramp via the dial (e.g. 100 to qa_email_capture to confirm at scale, or run qa_email_capture vs availability at 70/30 if signal is borderline). First formal `/weekly` measurement: Mon 5/11.

---

### 2026-05-05 (Tue, evening) — Admin dial for intake A/B traffic allocation (P1, shipped on `great-jackson` branch)

Replaces the hardcoded equal split with a per-arm percentage dial in `/admin/analytics`. Operator can ramp a winning arm to 100, dark a losing arm to 0, or run a 50/50 head-to-head — without a deploy. Built directly on top of PR #743's qa_email_capture work; includes the merge resolution.

**The motivation (why now):** Now that there are 5 arms in flight and the data is starting to point somewhere (qa_email_capture is the early candidate per the same-day session), TJ asked for a way to control allocation without touching code. "Sometimes I want two arms only, sometimes one, sometimes all five."

**What shipped (2 commits on `great-jackson`):**

1. **`6c951623`** — Add admin dial. New `experiment_weights` table (migration 070, RLS-on, service-role-only). Public read at `/api/variant-weights/intake` is CDN-cached (s-maxage=30) so weight changes propagate within ~30s. Admin GET/POST at `/api/admin/analytics/variant-weights`. Saving bumps a `version` int that's namespaced into the variant assignment hash (`djb2(sessionId + ":v" + version)`), so a save reshuffles returning sessions in one cut instead of grandfathering them. UI is a card at the top of Family Intake — 5 arm-cards in an auto-fit grid (handles future N>5 cleanly), live "Sum: X / 100" badge, Save button gated on dirty + sum=100, Reset to equal split, Discard changes, error feedback, version display.

2. **`debca38e`** — Pre-test fix. Admin GET fetch chain returned null on `r.ok=false` then early-returned without setting `loaded=true` — a 401/403/500 left the form in a permanent disabled state with no error visible. Fixed: every failure path now lands at loaded+errorFeedback. Plus three stale-comment refreshes (4-arm/25-25-25-25 references from before the qa_email_capture merge).

**Architectural decision worth remembering:** Built a shared `useIntakeVariant()` hook at `hooks/use-intake-variant.ts` so both `IntakeVariantSlots` (SBF/outreach surface) and `QASectionV2` (qa_email_capture surface) read from one source of truth. Without this consolidation, the dial would have controlled 4 of 5 surfaces only — `QASectionV2` was calling `assignIntakeVariant` directly with the equal-split mod-5, and would have stayed on equal-split even after the dial darked an arm. **Single client-side authority for variant assignment is now an invariant** — any future caller of "which arm is this session in?" must use this hook.

**Variant set is now expansion-proof:** `INTAKE_VARIANTS as const` is the single source of truth; `IntakeVariant` derives from it via `(typeof ...)[number]`; the validation, assignment, default-weights, and admin UI all iterate the array. Adding an arm = one append + a `variantSurfaceLabel` + `variantSubLabel` case + an `INTAKE_VARIANT_DEFAULT_WEIGHTS` entry. TypeScript flags all three as missing if you skip them.

**Migration 070 seeds at 20/20/20/20/20** — matches the live qa_email_capture-era equal split, so applying it is a net no-op for traffic. Only effect: the dial becomes editable.

**Merge resolution (with PR #743):** Resolved 4 file conflicts cleanly. Renamed my migration 069 → 070 (theirs took 069). Updated `BenefitsArmGate` to hide for both `outreach` AND `qa_email_capture`. Updated `INTAKE_VARIANT_DEFAULT_WEIGHTS` to include the 5th arm at 20. Refactored `QASectionV2` from local `assignIntakeVariant` call to the shared hook.

**TJ tested live:** Set `25/25/25/25/0` (qa_email_capture darked out, others bumped to 25 each) — sum stayed at 100, Save worked, version bumped. Confirmed the "zero an arm without removing the code path" use case.

**RLS handled in the migration file** — `ALTER TABLE experiment_weights ENABLE ROW LEVEL SECURITY;` with zero policies. Anon/authenticated keys blocked entirely. Service role bypasses RLS, which is the only legitimate access path for this config table.

**Resume next session here →** Open the PR to staging, run TJ through the test plan one more time on the Vercel preview, then merge → staging → main. Watch the dial in production for 7-14 days alongside the qa_email_capture experiment; if qa_email_capture wins, ramp it via the dial (100/0/0/0/0 or 50/50 against a control) instead of a code revert. First formal `/weekly` measurement window: Mon 5/11.

---

### 2026-05-05 (Tue) — qa_email_capture: 5th arm of SBF intake A/B (P1, shipped on PR #743)

Day-long session that started as a `/product-led-growth` daily run, surfaced the structural conversion problem on provider pages, and ended shipping a new A/B arm to test the fix.

**The diagnosis (the strategic arc):**

Family intake on provider pages is converting at 0.21% (3,809 module impressions → 8 submits in the visible window). V2 (5-step) historical screenshot showed similar near-zero rates. V3 (2-step) and outreach (4th arm) all converged around the same. Across four mechanic shapes, none win — meaning the form structure isn't the binding constraint.

The codebase audit revealed why: `QASectionV2` has a polished post-submit guest enrichment prompt with email capture, but it's gated behind `hasBenefitsSection`. On most pages SBF is on, so the gate evaluated true and Q&A's own email capture never ran. We disabled the surface that was actually working in favor of one that didn't.

**What shipped (PR #743 → staging, awaiting promotion):**

A 5th arm `qa_email_capture` in the existing 4-way djb2 split (mod 4 → mod 5). 20% of provider-page visitors:

- See NO `BenefitsDiscoveryModule` and NO `AgentOutreachModule` (both gated off via extended `BenefitsArmGate`)
- Get the Q&A enrichment prompt forced ON (`effectiveHasBenefitsSection = false` override inside QASectionV2)
- See a redesigned compact prompt: "Top 3 [Category] in [City]." + 3 text-only mini cards (name + ★ rating + city) + email + "Email me these" CTA + "Free. No spam." + tiny Skip
- Get a confirmation email with the 3 alternative providers inline; subject reads "Top 3 [Category] in [City]" so the inbox preview matches the in-page promise

8 commits on `qa-email-capture-arm`:

1. **`b525dfc9`** — Initial 5-arm wiring: variant.ts mod 5, BenefitsArmGate hides for both `outreach` and `qa_email_capture`, QASectionV2 variant detection + impression event + override hasBenefitsSection, PATCH /api/questions fires `question_email_enriched` + sends enhanced email with alternatives, migration 069 extends `seeker_activity_event_type_check`, admin analytics 5-arm split.
2. **`765548e`** — Pre-test fixes: silent Supabase insert errors (try/catch doesn't catch return-error pattern; destructure `{ error }` explicitly), `excludeProviderId` mismatch (helper compares on `provider_id` not slug — was potentially recommending the same provider as a "similar alternative").
3. **`5b4a64c2`** — Vercel build fix: missing `qa_email_capture` branches in `variantSurfaceLabel` switch + `VariantPreviewCard` component. Caught only after deps were installed for real (the earlier "tsc clean" claims were grep-filter false-positives — `./node_modules/.bin/tsc` didn't exist in the worktree).
4. **`b6f47c2a`** — Compact mobile-first redesign of the enrichment prompt. Replaced gray-box gray-text dim version with no-box flush-with-section design, headline + 3 inline text-only cards + Linear-style black CTA. Mobile lesson learned from the outreach module's image-heavy version that doesn't convert.
5. **`ed38fd4c`** — Pre-test fix: email subject mismatched the in-page promise. User taps "Send the list" but inbox preview said "Your question to [Provider]." Subject now reads "[N] similar providers in [City]" when alternatives sent.
6. **`02a45ed0`** — 4 copy swaps for stronger conviction: headline `{N} more` → `Top {N}` (curation signal), new sub-line "Plus, we'll email when [Provider] replies." (surfaces dual promise), CTA `Send the list` → `Email me these` (first-person + deictic), email subject leads with "Top".
7. **`87bccb2d`** — Include category in headline + email subject: "Top 3 Assisted Living in [City]" instead of generic "Top 3 in [City]." Synced both code paths (page-side + PATCH-side) to use the same `PROFILE_CAT_TO_SUPABASE_CAT` + `getCategoryDisplayName` resolution.
8. **`79379b73`** — Slack alert on email enrichment. New `slackQuestionEmailEnriched` helper in `lib/slack.ts`. Mirrors `slackOutreachRequestSubmitted`'s shape: header "✉️ Q&A Email Captured — qa_email_capture", reply-to email, source page link, location, category, the 3 alternatives we sent (clickable links), the asker's question, question_id footer. PHI-free notification preview. Awaited per `feedback_serverless_fire_and_forget.md`.

**Decision rule:** ≥6% email-capture rate in 30-90 days vs the existing arms' near-zero. If qa_email_capture beats meaningfully, next move is killing SBF on provider pages entirely (not part of this PR).

**What's measured:**

- `/admin/analytics` — 5-arm split table tracks impressions (`qa_email_capture_impression`) + saved (`question_email_enriched`) on shared denominator.
- Slack alert per email captured — gives TJ real-time visibility into conversion events.
- Admin VariantPreviewCard branch renders an explainer card for the new arm.

**Migration 069 applied to Supabase by TJ mid-session.** Live now.

**TJ tested it on the Aggie Assisted Living provider page (College Station). Variant detected correctly, prompt rendered with personalized copy, email capture worked end-to-end. Confirmed live and converting.**

**Mid-session detours / lessons:**

- **The V2 revival thesis was wrong.** TJ's intuition that V2 (5-step) was converting better than V3 turned out to be incorrect — historical V2 screenshot showed control: 4 submits / 917 imps = 0.44%, money_loss: 1 / 973 = 0.10%. V3 at 0.21% sits in the middle. Form structure isn't the lever. Removed from active recommendations mid-doc.
- **The Outreach Module on mobile is the cautionary tale.** Image-heavy 280px-tall cards + relationship pills + verbose microcopy + sticky bottom CTA all compete for the same viewport, and the form lives below the fold. qa_email_capture's redesign explicitly reverse-engineered that anti-pattern: text-only ~50px cards, no pills, "Free. No spam." (4 words, not 18), no sticky competition.
- **The `hasBenefitsSection` gate was the hidden insight.** Q&A's email enrichment had been silently disabled for ~6 months. The flag flip alone (set to false in qa_email_capture arm) is the single most important code change in the variant. Everything else amplifies it.
- **Pre-test depth lesson.** My `./node_modules/.bin/tsc | grep -v ...` pipeline returned 0 from the grep filter even though tsc didn't exist in the worktree. False clean signal. Caught only when Vercel build failed. Rule going forward: verify deps installed (`ls node_modules/.bin/tsc`) before relying on typecheck output, or run `tsc; echo "exit=$?"` directly.
- **Silent Supabase error pattern.** `try { await db.from(...).insert(...) } catch` does NOT catch insert errors — Supabase returns `{ data, error }`, doesn't throw. The catch is dead code. Always destructure `{ error }` and log explicitly. Affects the `seeker_activity` insert in PATCH `/api/questions` — fixed.
- **`excludeProviderId` mismatch.** The `getTopProvidersByCityAndCategory` helper compares against `olera-providers.provider_id` (alphanumeric), not the page slug. Was passing slug → exclusion never matched → could have recommended the same provider being asked about as a "similar alternative." Fixed by capturing `source_provider_id` during the multi-strategy lookup.

**Other artifacts shipped today:**

- **`/ceo-brief` slash command** at `.claude/commands/ceo-brief.md` (PR #736, merged to staging+main). Captures the "explain to a busy CEO" pattern: bottom line first, only decision-changing context, end with concrete next steps. Operator voice, no filler. Use after dense working sessions or when asked to "explain in simple terms."
- **`plans/family-acquisition-radical-ideas.md`** — strategic doc with the 10 mechanic ideas (Preview-before-email, Reverse Marketplace, Sibling Mode, AI Benefits Screen, Care Receipt, Earned-Access Concierge, Voice-First Triage, Hospital Discharge Trojan Horse, Insurance-First Reorder, Care-Readiness Points). Top 3 picks revised twice through the session (first by TJ's reframe — Sibling Mode and Reverse Marketplace don't directly address conversion; second after the V2 data confirmed form-shape isn't the lever). Honorable mentions section captures the cuts.
- **Notion strategy page:** [Family Acquisition: 10 Radical Mechanics](https://www.notion.so/3575903a0ffe81f1852eebcfc8571b84). Created and revised inline in chat. Worth rewriting cleanly once we have first-week data on the variant per TJ's earlier ask.
- **`/product-led-growth` daily run earlier in the session** caught up state hygiene on Active Experiments — 5 untracked shipments from the 5/1→5/4 cadence gap added to the board (Agent Outreach Module, H2 capture layer, SBF V3 editorial mount, save bug fix, post-answer hook). Daily report at [Daily — Tue, May 5, 2026](https://www.notion.so/3575903a0ffe81c2ac75feeb7931bd17). Flagged: `/weekly` was due Mon 5/4 and didn't run; recommend Mon 5/11 for first formal measurement window.

**Resume next session here →** Promote PR #743 to staging when satisfied with the Vercel preview test. Promote staging → main when ready. Watch `/admin/analytics` 5-arm split for the next 7-14 days; ≥6% qa_email_capture saved-rate vs the SBF arms' near-zero is the greenlight. Mon 5/11 `/weekly` should be the first formal measurement window.

### 2026-05-04 — Mount SBF V3 on /caregiver-support/ article template (P1, planning)

Retargeting a stale Apr 21 task ("topic-seeded question funnel" was architecturally invalid — `/api/questions` requires `provider_id`, no general entry point exists). SBF V3 cut over to provider pages on Apr 18, three days before the original task was written; SBF is the actual unified inquiry pipeline today and is provider-agnostic. Same goal as the original (turn editorial traffic into pipeline), correct mechanism.

**Decision:** ship single-variant on editorial (no 4-arm A/B replication — want clean editorial-vs-provider baseline). Replace the existing `/browse?type=` CTA at `app/caregiver-support/[slug]/page.tsx:395-410` with `BenefitsDiscoveryModule`. Instrument `signup_source = '/caregiver-support/{slug}'` so "conversion by entry page" is answerable 4-6 weeks out.

**Notion (canonical):** [Mount SBF V3 (Benefits Discovery) on /caregiver-support/ article template](https://www.notion.so/Mount-SBF-V3-Benefits-Discovery-on-caregiver-support-article-template-3495903a0ffe81f085fdde9b8dc149ac). RETARGETED block appended preserves the original framing as historical context.

**Plan:** [`plans/editorial-sbf-mount-plan.md`](plans/editorial-sbf-mount-plan.md). 11 tasks across 4 phases (plumbing → editorial wrapper → mount → verify).

**What shipped as code (not yet deployed):**

1. **Migration `065_accounts_signup_source.sql`** — adds `accounts.signup_source TEXT NULL` + partial index `WHERE signup_source IS NOT NULL`. Apply via Supabase dashboard before deploy or the editorial submit will 500 on the accounts insert.

2. **`BenefitsDiscoveryModule` (modified)** — new optional `entrySource?: string` prop, threaded into `fireFunnelEvent` (event payload), `/api/benefits/track-start` body, and `/api/benefits/save-results` body. Provider pages leave it undefined; behavior unchanged. Required no null-state copy work after all — handled in the editorial wrapper instead (ResultsSheet hard-depends on `state.name`/`state.slug` for `/benefits/{slug}` links, so making the module null-state would have rippled into a parallel rewrite of the success overlay).

3. **`/api/benefits/save-results` (modified)** — accepts `entrySource` in payload, writes it to `accounts.signup_source` on the new-account insert. Existing rows + provider-page submits stay NULL.

4. **`/api/geo` (new)** — returns `{ state: string | null, city: string | null }` from Vercel `x-vercel-ip-country-region` / `x-vercel-ip-city`, gated through the `US_STATES` allowlist. `force-dynamic` (header-derived). Reuses the same pattern as `app/page.tsx`.

5. **`/api/benefits/programs` (new)** — `?state=XX` returns `{ topPrograms, allPrograms, stateId, stateName }` from the in-memory program library. **Bug caught + fixed during smoke test:** initial `force-static` declaration prerendered the route with empty searchParams and 400'd every real call; flipped to `force-dynamic`. No DB calls so latency stays low.

6. **`components/article/EditorialBenefitsModule.tsx` (new)** — `"use client"` wrapper. Fetches `/api/geo` then `/api/benefits/programs?state=XX` on mount, renders `BenefitsDiscoveryModule` with `entrySource={'/caregiver-support/' + slug}`. Three states: `loading` (height-stable pulse skeleton matching step-1 footprint, CLS guard), `resolved` (full module), `fallback` (styled link to `/benefits/finder` when geo can't resolve — better than reverting to the old `/browse` CTA, simpler than building a no-state path through ResultsSheet).

7. **`app/caregiver-support/[slug]/page.tsx` (modified)** — replaced the old `/browse?type=` Link block (lines 395-410 pre-edit) with `<EditorialBenefitsModule articleSlug={slug} />`. Single-variant — NO `BenefitsArmGate` wrap, no `AgentOutreachSlot`. Want clean editorial-vs-provider baseline data, not arm-vs-arm noise inside editorial.

**Smoke tests passed (local dev):** page returns 200, SSR markup contains the skeleton at the correct spot (between article body and Author + Tags section), `/api/geo` returns `{state:null,city:null}` on localhost (expected — no Vercel headers in dev) and resolves correctly with mocked headers, `/api/benefits/programs?state=TX` returns the full library shape. Typecheck clean (`tsc --noEmit` exit 0). ESLint clean on touched files (apostrophe-escape errors in the wrapper fixed mid-build; the pre-existing img + no-explicit-any warnings are unrelated).

**Files touched:**
- New: `supabase/migrations/065_accounts_signup_source.sql`, `app/api/geo/route.ts`, `app/api/benefits/programs/route.ts`, `components/article/EditorialBenefitsModule.tsx`, `plans/editorial-sbf-mount-plan.md`
- Modified: `components/providers/BenefitsDiscoveryModule.tsx`, `app/api/benefits/save-results/route.ts`, `lib/analytics/track-step.ts`, `app/caregiver-support/[slug]/page.tsx`, `SCRATCHPAD.md`

**Mid-build decisions (deviations from the plan worth flagging):**
- **Plan task 2 dropped (null-state in BenefitsDiscoveryModule).** ResultsSheet hard-depends on `state.name`/`state.slug` for the `/benefits/{slug}` link — making the module null-state would have rippled. Wrapper-level handling (geo-fail → styled fallback to `/benefits/finder`) is strictly cleaner.
- **Editorial step-level funnel events deferred to v2.** Both `track-start` and `track-step` gate inserts on `(providerSlug && sessionId)` — on editorial mounts (no providerSlug), inserts silently drop. `accounts.signup_source` is the canonical leading-metric source for v1. Full editorial funnel parity would require either a new event-type set in `seeker_activity` (with the matching DB CHECK migration per the Apr 29 lesson) or routing `benefits_*` events to seeker_activity when providerSlug is null.

**What's NOT done (intentional — out of scope for v1):**
- Article-aware copy / pre-selected care-need card by article topic.
- Editorial-specific A/B variants.
- Inline mid-article placement.
- Admin analytics breakdown by entry source — query directly from `accounts.signup_source` for the first 4 weeks.
- Migration 065 applied to Supabase (TJ to apply via dashboard before staging promote).
- TJ's manual end-to-end submit on staging (Slack alert, accounts row, ResultsSheet overlay).

**Status:** code complete, awaiting (a) TJ to apply migration 065 via Supabase dashboard, (b) TJ's manual submit test on a real article slug (e.g., `/caregiver-support/caregiver-burnout-prevention`), (c) PR to staging.

### 2026-05-03 — Build Olera into the agent-callable layer for senior care (P1)

Day-long strategic + writing session to lock the thesis behind the three sibling P1 CTA-copy variants and ship a clean Notion workbook.

**Thesis:** Olera becomes the data and functions AI calls when families make senior care decisions. Two routes hit the same primitives. **H1**: Olera-hosted agent on olera.care. **H2**: bring-your-own-AI calling Olera via MCP/ChatGPT App/REST. We test both. Build value first, gate later (Resend/Airtable/Fathom Loops playbook).

**What we ship now** — three categories, parallel clocks, all TJ-owned:
- **Engineering** (a few hours capture + a day for outreach module): llms.txt + JSON-LD + AI-referral instrumentation + new outreach arm as 4th SBF intake A/B variant. djb2 4-way split. AgentOutreachModule renders on Q&A surface for the 25% in outreach arm. 3 mini provider cards (top in city + category, current excluded) as visual proof. Email submit → DB row + Slack alert with full fulfillment context.
- **Content** (a few days, TJ writes/records): Medicaid guide as **article + YouTube video**. "How to apply for Medicaid for a parent in Texas using ChatGPT and Olera." Founder voice. TJ as AI-use expert, Olera as real-world tool layer. Be one of one. Article ranks on Google, video ranks on YouTube and gets cited by AI agents that browse video sources. Cap the bet at one of each.
- **Operations** (continuous, TJ owns): outreach fulfilled manually in Claude Code via Slack alert. 24h SLA. No admin UI in v0.

**Decision gate at 30-90 days** — three usage signals: SBF step-1 pickup ≥55%, outreach email-capture ≥6% (vs 3% baseline), AI referrals ≥10/day + Medicaid content ranks. 2 of 3 = greenlight scaling.

**Notion (canonical):** [Build Olera into the agent-callable layer for senior care](https://www.notion.so/Build-Olera-into-the-agent-callable-layer-for-senior-care-3555903a0ffe81e18e63f566794560a6). Old duct-taped parent + child workbook trashed. Three sibling CTA-copy tasks were closed earlier with "superseded by [old parent]" notes — those links break against the trashed page but the siblings are Done so it's cosmetic.

**Local mirror:** [`plans/agent-outreach-cta-workbook.md`](plans/agent-outreach-cta-workbook.md). Stays in sync with Notion. [`plans/agent-outreach-cta-plan.md`](plans/agent-outreach-cta-plan.md) is the engineering task breakdown.

**Doc structure choices made along the way:** hybrid (strategic narrative on top + execution by category + decision gate + conditional scale). Not phase-numbered for execution because the work runs in parallel on different clocks. Verb-led titles for orientation. TJ voice throughout: no em dashes (use `--`), direct, no PR-speak, no jargon ("lever," "asymmetry buys us," etc. all dropped). Multi-session-friendly.

**Working-pattern split (locked):** markdown file is the source of truth for content (mine to edit). Notion is the presentation surface (TJ's to format with collapsibles, callouts, headings). When iterating on this task in future sessions, work from `plans/agent-outreach-cta-workbook.md`. Surface content changes in chat; TJ syncs to Notion. If TJ changes copy in Notion, he'll tell me to sync the markdown — otherwise the two will quietly diverge.

**Tooling note:** Notion `update-a-block` MCP wraps payload in `body.type` which the API rejects. Workaround pattern that worked: delete-old + patch-block-children with `after` anchor to insert at the correct position. Used this to surgically add the article+video split without duct-taping. Documented in case I hit the same flow again.

**Team comms (drafted in chat for TJ's Slack to #marketing-team):** "Build Olera into the AI agent layer for senior care. ChatGPT already sends us referrals every day. We make Olera the data and tools AI agents call when families apply for Medicaid, find providers, or send connection requests. Two tracks running in parallel: an Olera-hosted AI on our site, and a bring-your-own-AI version for families using ChatGPT, Claude, or Gemini." TJ's broader Slack message reframes team focus: Chantel mostly on care shifts (1 article every 3 weeks), Logan on staffing (revenue path), TJ owns this agent-layer work for the next few weeks.

**End of session — final state of the strategic doc:**
- Cut redundant sections: Operations H3 (was duplicating "What we capture and how TJ acts on it") and the entire Non-goals H2 (most items were already implied; the load-bearing ones — MCP premature, OpenClaw lesson, auto-submission — are covered in surrounding sections).
- "Read the signals" simplified from 3 to 2 signals. Cut signal #1 (SBF benefits prompt) — wasn't about agent-callable, was anchoring on the wrong thing. New gate: H1 signal (outreach email capture ≥6%) + H2 signal (AI referrals ≥10/day + Medicaid content ranks). Decision: scale whichever route signaled.
- Final structure: 8 H2 sections, 3 H3 under "What we ship now" (Capture, Olera-hosted outreach module, Medicaid guide), 4 H4 under the outreach module.
- Notion is fully structured by TJ — toggles wrap Scale/Risks/Where-the-gate. Markdown stays in sync as of session end.

**Tooling note for future Notion writes:** `mcp__notion__API-update-a-block` rejects `body.type` wrapper — workaround is delete + `patch-block-children` with `after` anchor. Also: when TJ formats in Notion (creating toggles, converting list types), block IDs and parent relationships shift — stale anchors fail with "not parented by" errors. Solution: refetch children before patching, or ask TJ to paste content himself.

### 2026-05-03 (PM) — Phase 2 build: H1 Olera-hosted outreach module shipped end-to-end

All 6 build tasks from `plans/agent-outreach-cta-plan.md` landed in one focused session. Branch: `lively-poitras` (one commit behind staging at session start; rebase later when ready). Migration 064 applied to Supabase by TJ mid-session. Typecheck clean across all touched files (sole noise was a duplicate `BenefitsFunnelByVariant` declaration in `app/admin/analytics/page.tsx` that was caught + fixed).

**What's now live as code (not yet deployed):**

1. **Migration `064_agent_outreach_requests.sql`** — creates `agent_outreach_requests` table (id, seeker_user_id, seeker_email, source_provider_id, city/state/category, question_id/text, target_provider_ids[], status, claim metadata) + extends `seeker_activity_event_type_check` to allow `outreach_module_impression`, `outreach_card_clicked`, `outreach_request_submitted`. App allowlist + DB CHECK coupled in one migration per `feedback_event_allowlist_needs_db_migration.md`. RLS enabled (service-role only). 3 indexes: status+created (queue), email+created (rate limit), source_provider (per-page analytics).

2. **`lib/analytics/variant.ts`** — added `IntakeVariant` (4 arms with "outreach") + `assignIntakeVariant` (mod 4) alongside the legacy 3-arm `BenefitsVariant`/`assignBenefitsVariant`. Kept legacy intact so BenefitsDiscoveryModule's internal mod-3 copy A/B continues working untouched. **Math note: gcd(3,4)=1, so independent mod-3 + mod-4 on the same sessionId yield a uniform 1/4 distribution across all 4 arms.** No need to lift variant assignment to a single source.

3. **`lib/agent-outreach-providers.ts`** — `getTopProvidersByCityAndCategory({ city, state, category, excludeProviderId, limit })`. Composite score `weight × rating × log(reviews+1) × completeness`. Score precomputed once per provider (not per sort comparison — would burn ~140 buildHighlights calls otherwise). City → state fallback. Claim weight wired up properly via parallel business_profiles query (verified=1.5, claimed=1.2, unclaimed=1.0) — TJ pushed back on the "stub at 1.0 for v0" approach with "Claude Code makes hard things easy, don't underdo it" ([feedback_default_to_now_not_later.md](feedback_default_to_now_not_later.md) reflex). Completeness floor 0.5 / ceiling 1.0 so unenriched providers can still compete in small-city pools. 10-min in-memory cache keyed by `(state|city|category)`; cache stores `limit+1` and excludes self at read time so adjacent provider pages share hits.

4. **`components/providers/AgentOutreachModule.tsx`** — client component with horizontal-scroll mini cards (next/image + onError fallback to category stock), email capture, honeypot, inline error + success states. Slate/cream palette. Impression fires once via ref guard (handles React strict-mode double-mount). Submit body now passes `target_providers: { id, name, slug, address }[]` so the Slack alert has rich per-provider links without a server-side slug lookup.

5. **`app/api/activity/track/route.ts`** — added 3 new event types to `FAMILY_EVENT_TYPES` AND `profileOptionalEvents` (so guests fire them without a profile_id, matching `save_nudge_*` precedent).

6. **`components/providers/IntakeVariantSlots.tsx` (new)** — `BenefitsArmGate` (renders children eagerly during SSR; hides post-mount on outreach arm) + `AgentOutreachSlot` (renders AgentOutreachModule iff outreach arm). Both share the same `assignIntakeVariant(getOrCreateSessionId())` call. SSR trade: 25% in outreach arm see brief flash of BenefitsDiscoveryModule disappearing + AgentOutreachModule appearing on Q&A surface; 75% see no change. Chose to preserve first-paint UX for the majority arm.

7. **`app/provider/[slug]/page.tsx`** — added 4th item to existing `Promise.all` for top providers fetch (cached, returns [] gracefully on missing context). Wrapped `<div id="benefits">` in `BenefitsArmGate`. Inserted `AgentOutreachSlot` inside `<div id="qa">` below `QASectionV2` with `mt-6` spacing. Exported `PROFILE_CAT_TO_SUPABASE_CAT` from `lib/types/provider.ts` for the ProfileCategory→supabase string map.

8. **`POST /api/outreach/request`** — validates email + target_providers shape + honeypot, rate-limits 3/email/hour, attaches seeker_user_id when authenticated, inserts row, fires `outreach_request_submitted` to seeker_activity (fire-and-forget), fires Slack via `slackOutreachRequestSubmitted` (fire-and-forget). Returns `{ ok, id }`.

9. **`slackOutreachRequestSubmitted` in `lib/slack.ts`** — self-contained fulfillment alert. Reply-to email, source page link, target provider bullet list with name + city + Olera detail link, full question text (no truncation — TJ needs full context), city/state/category metadata, request-ID footer with 24h SLA reminder. The `text` notification preview is PHI-free per `feedback_phi_in_subject_lines.md` ("Outreach request: 3 Memory Care providers in Austin, TX").

10. **Admin analytics 4th row** — extended `BenefitsFunnelByVariant` type (in BOTH `app/api/admin/analytics/summary/route.ts` and the duplicate declaration in `app/admin/analytics/page.tsx`), added `outreach: emptyStages()` to bucket sets, separate seeker_activity query for outreach events, distinct-session bucketing into the new `outreach` `BenefitsBucket`. UI table renders `—` for the middle "Care need ✓" cell on outreach since the funnel skips that step. Subtitle now reads "1/4 split by djb2 mod 4 — 3 benefits-copy arms + 1 outreach arm."

**Files touched:**
- New: `supabase/migrations/064_agent_outreach_requests.sql`, `lib/agent-outreach-providers.ts`, `components/providers/AgentOutreachModule.tsx`, `components/providers/IntakeVariantSlots.tsx`, `app/api/outreach/request/route.ts`, `plans/agent-outreach-cta-plan.md`, `plans/agent-outreach-cta-workbook.md`
- Modified: `lib/analytics/variant.ts`, `lib/types/provider.ts`, `lib/slack.ts`, `app/api/activity/track/route.ts`, `app/api/admin/analytics/summary/route.ts`, `app/admin/analytics/page.tsx`, `app/provider/[slug]/page.tsx`

**What's NOT done (intentional — out of scope for v0):**
- Daily digest extension (Phase A task 5 in `plans/agent-outreach-cta-plan.md`) — admin row covers daily visibility for now.
- Manual end-to-end test on a real provider page — TJ to do this when ready.
- Vercel preview / staging promotion / PR.

### 2026-05-03 (late PM) — Design pass + Slack fire-and-forget bug fix (post-test iteration)

TJ tested the v1 module on a Washington DC nursing-home page. Visual was solid but he had a sharper design vision and one functional bug: no Slack alert landed.

**Design crit + redesign — both sides agreed direction first, then I shipped:**

- **Killed cream-bg + full border container.** Was reading as "ad callout" — too much chrome around content. Now borderless with a subtle top divider (`mt-8 pt-8 border-t border-slate-200`) so the module reads as part of the page flow.
- **Two-line H2:** outcome hook ("Skip the phone calls.") + mechanic line ("Have an AI agent contact the top providers in [City] for you."). TJ's argument for keeping "AI agent" in the second line: brand-education tax to drop entirely; this plants the seed for future agent-callable products (Medicaid apps, etc.). Outcome leads, mechanic supports.
- **Anthropic/Claude/Grok-style 3x3 pulsing dot grid** prefixed to H2 (and persists into success state). Staggered diagonal wave on a 1.5s cycle. Visual shorthand for "AI is at work" without saying "loading." TJ proposed this from a walk; locked the inline-grid (option A) over background-texture (option B) — more explicit signal, gives the static module a motion moment. Custom keyframe in `app/globals.css` (`animate-outreach-dot`) with prefers-reduced-motion override.
- **Caption above cards:** "Top 3 [Category] providers in [City], where families are actively reaching out." Social proof anchored to behavior we actually measure (engagement events) — not "booking" data we don't have. TJ originally said "booking"; we negotiated honest framing. ✅ landed in sentence case after pre-test caught all-caps reading badly on a sentence-length string.
- **Optional relationship chip row:** Parent / Spouse / Me / Family. Toggling on/off; selected = inverted dark slate. Lifts fulfillment context without forcing collection. TJ confirmed name field NOT viable (we don't capture it on questions).
- **Card click → opens in new tab** (`target="_blank" rel="noopener noreferrer"`). Was a conversion leak; family who clicked a card lost their place in the form.
- **Pill colors unified** to single muted slate (was multi-color from trust-signals system, looked ad-hoc).
- **Submit copy:** "Get the answers" (was "Send the agent" — cold/novel).
- **Success state honest:** "On it. We'll email you back with what we hear from these N providers." Dropped the "24h SLA" promise — TJ flagged we can't guarantee it.

**Then a real bug bit:** TJ submitted, got the success state, no Slack alert.

**Root cause:** `app/api/outreach/request/route.ts` was firing both the `seeker_activity` insert and `sendSlackAlert` as fire-and-forget Promises after returning the response. **In Vercel's serverless runtime the function instance can be torn down right after the response goes out, killing pending Promises.** Every other `sendSlackAlert` call site in the codebase awaits; mine didn't. Pre-test review missed it because I traced the logic but didn't compare to the rest-of-codebase pattern.

**Fix:** Both side effects now run via `await Promise.allSettled([activityInsert, sendSlackAlert])` before the response. Parallel so neither blocks the other; failure-tolerant so neither aborts the response (the canonical `agent_outreach_requests` row is already saved at that point). Adds ~200-400ms response latency. Logged this lesson — pre-test reviews need a "does this match the rest-of-codebase pattern" pass.

**Other bugs caught in two pre-test review rounds (all fixed):**
- Phantom `mt-6` div for 75% of visitors who weren't in outreach arm (wrapping div rendered without children → empty 24px gap)
- Double-fire of `outreach_request_submitted` event (server route + client both fired; set semantics in admin saved the count, but raw log got dupes — dropped client fire)
- Unused `Link` import
- Caption all-caps unreadable on long sentence (sentence case)
- Pulsing dots ignored `prefers-reduced-motion` (added override to existing reduced-motion block)

**Final commit chain on `lively-poitras`:**
- `02c4098e` — Initial 6-task build
- `01ee2420` — First pre-test fixes (phantom div, double-fire, unused import)
- `4a2b3c2a` — Design pass (dots, caption, chips, kill cream box, kept "AI agent" line per TJ)
- `a8b85c28` — Second pre-test fixes (caption case, prefers-reduced-motion)
- `b3ad7ee5` — Slack fire-and-forget fix (await + Promise.allSettled)

### 2026-05-04 (PM) — H2 capture PR #726 open on staging. Pre-test clean. Awaiting Vercel preview test.

**Branch + commit chain on `keen-hopper`** (off latest `origin/staging` `4eb7808a`):

- `f54eac82` — H1 ship marker + H2 plan in SCRATCHPAD
- `afba46c4` — `app/llms.txt/route.ts` (curated AI-agent map per llmstxt.org spec; 6 categories + top 10 state benefits pages dynamic from pipeline data; 1hr ISR)
- `880cbacd` — Article + GovernmentService JSON-LD on `/benefits/[slug]` and `/benefits/[slug]/[program]`; FAQPage on program pages when `program.faqs` populated; fix broken Org logo path in `app/layout.tsx` (`/logo.png` → `/images/olera-logo.png`)
- `65c2f820` — `lib/analytics/referrer.ts` classifier + extracted `sanitizeReferrer`/`OLERA_HOSTS`; track route writes `referrer_class` to anonymous page_view metadata; admin summary buckets page_views by class; admin UI adds "Traffic source" SubRow with 6 stats + prior-window deltas
- `f640d2d3` — SCRATCHPAD H2 status update

**Pushed + PR opened:** [PR #726 — `keen-hopper` → `staging`](https://github.com/olera-care/olera-web/pull/726). State: open, mergeable.

**Scope calls (deliberate skips):**
- Provider detail JSON-LD: already comprehensive (LocalBusiness with reviews, offers, geo, sameAs, priceSpec). No work needed.
- `/m/[token]` SBF results ItemList: page is `robots: noindex` for PII reasons. AI agents won't crawl. Skipped.

**Verification done:**
- Zero new TS errors over baseline (56 phantom-module errors pre-existing, all `@phosphor-icons/react` / `isbot` unrelated to H2 changes).
- Pre-test caught two bugs during build (overpromising savings on llms.txt benefits-finder line; broken Org logo path) — fixed inline.
- Final /pre-test review (post-commit, pre-merge): **clean — no bugs found.** Walked all 8 files end-to-end, traced every data chain, confirmed JSONB freeform metadata adds no DB risk, confirmed `dynamic="force-static"` + `revalidate=3600` is the right ISR combo, confirmed `program.faqs` shape matches schema generation, confirmed no event_type allowlist trap.

**Decision-gate measurement (now with admin visibility):** /admin/analytics → "Traffic source" → AI chat counts. Baseline is whatever lands in the first day or two. Decision question after 2-4 weeks: did llms.txt + JSON-LD move ai_chat counts up materially, OR did total page views grow without ai_chat moving (meaning agents aren't citing us yet — we'd then need outreach to crawl directly).

**Resume next session here →** Test on Vercel preview (URL appears as a check in PR #726). Test plan: (1) `/llms.txt` renders + state benefits links resolve; (2) `view-source` on `/benefits/california` shows Article schema; (3) `view-source` on a program page shows Article + GovernmentService + FAQPage; (4) Org logo URL resolves (no more 404); (5) Admin /admin/analytics shows new "Traffic source" SubRow. If healthy, /pr-merge 726 → /pr-merge promote staging to main.

---

### 2026-05-04 (AM) — H1 outreach module shipped to production.

PR #722 merged to staging (squash, commit `420aba6a`). PR #725 promoted staging to main (`--merge`, commit `81d1d8d6`). Vercel production deploy rolling out. Outreach module is now live for ~25% of provider-page visitors on `olera.care` — Slack alerts will route to TJ for manual fulfillment.

**Notion merge reports:**
- [PR #722 — staging merge](https://www.notion.so/PR-722-Add-agent-outreach-module-as-4th-SBF-intake-A-B-arm-2026-05-04-3565903a0ffe81b0bbced66bd0318832)
- [PR #725 — production promotion](https://www.notion.so/PR-725-Promote-staging-to-main-2026-05-04-3565903a0ffe81a1bd46cb5857495623)

**Decision-gate measurement window for H1 starts now (30-90 days):** ≥6% email-capture rate vs 3% baseline = greenlight Phase 4 (real agent build).

---

**Next chunk: H2 capture work** (~3 hours total, single PR back to staging).

Per the locked workbook section "Capture work for H2": ChatGPT/Claude/Gemini already cite Olera (~4 visits/day from ChatGPT alone, no optimization). Three small infra pieces to close the gap:

1. **`llms.txt` at site root.** Curated map AI agents read like a sitemap. Static text — list browse, SBF, top cities, top benefits, key landing pages. Either `public/llms.txt` (static) or `app/llms.txt/route.ts` (dynamic, generated from current cities/benefits data — preferred so it stays fresh as we add coverage). ~30 min.

2. **JSON-LD on key pages.** Provider detail pages already have BreadcrumbList; extend with `LocalBusiness` (name, address, telephone, priceRange, aggregateRating, image). Benefits pages (`app/waiver-library/[state]/[benefit]/page.tsx`) need `GovernmentBenefitsType` or `Article` schema. SBF results / `/m/[token]` page — `WebPage` + `ItemList` of matched programs. Goal: agents quote provider name + rating + price + benefit-savings accurately when families ask. ~1.5 hours.

3. **AI-referral instrumentation.** Detect `Referer` header host on incoming requests and tag in page_view metadata. Hosts to flag: `chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com`, `perplexity.ai`, `copilot.microsoft.com`. Plug into existing `seeker_activity` / `provider_activity` page_view tracking — add `ai_referrer` field (or `referrer_class` enum: ai_chat / search / direct / olera_internal / other). Surface count in admin analytics so we can measure baseline. ~30 min.

**Workflow when this resumes:**
- Cut new branch off `origin/staging` (suggest tribute name; lively-poitras worktree is fine to reuse — branch + commit + PR back to staging).
- Working tree currently on `lively-poitras` branch (now stale — merged + remote-deleted). After compact, first action: `git checkout staging` then `git checkout -b <new-branch>` from latest staging.
- Single PR back to staging when done. Same /pre-test → /pr-merge → promote-to-main flow as H1.

**Files most likely to touch:**
- New: `app/llms.txt/route.ts` (or `public/llms.txt`)
- Modified: `app/provider/[slug]/page.tsx` (add LocalBusiness JSON-LD), benefits library pages (Article/Benefits schema), the welcome/results sheet pages (ItemList schema)
- Modified: `app/api/activity/track/route.ts` (capture referrer host) and/or `lib/analytics/session.ts`, plus admin analytics route to surface the new dimension

**Ship lessons captured this session:**
- [feedback_serverless_fire_and_forget.md](feedback_serverless_fire_and_forget.md) — always `await` side-effect Promises in Next.js routes; Vercel's serverless runtime kills pending Promises post-response. Pre-test reviews need a "does this match the rest-of-codebase pattern" pass — internal correctness alone shipped the bug.

### 2026-05-03 (late PM) — Design pass + Slack fire-and-forget bug fix (post-test iteration)

TJ tested the v1 module on a Washington DC nursing-home page. Visual was solid but he had a sharper design vision and one functional bug: no Slack alert landed.

**Design crit + redesign — both sides agreed direction first, then I shipped:**

- **Killed cream-bg + full border container.** Was reading as "ad callout" — too much chrome around content. Now borderless with a subtle top divider (`mt-8 pt-8 border-t border-slate-200`) so the module reads as part of the page flow.
- **Two-line H2:** outcome hook ("Skip the phone calls.") + mechanic line ("Have an AI agent contact the top providers in [City] for you."). TJ's argument for keeping "AI agent" in the second line: brand-education tax to drop entirely; this plants the seed for future agent-callable products (Medicaid apps, etc.). Outcome leads, mechanic supports.
- **Anthropic/Claude/Grok-style 3x3 pulsing dot grid** prefixed to H2 (and persists into success state). Staggered diagonal wave on a 1.5s cycle. Visual shorthand for "AI is at work" without saying "loading." TJ proposed this from a walk; locked the inline-grid (option A) over background-texture (option B) — more explicit signal, gives the static module a motion moment. Custom keyframe in `app/globals.css` (`animate-outreach-dot`) with prefers-reduced-motion override.
- **Caption above cards:** "Top 3 [Category] providers in [City], where families are actively reaching out." Social proof anchored to behavior we actually measure (engagement events) — not "booking" data we don't have. TJ originally said "booking"; we negotiated honest framing. Landed in sentence case after pre-test caught all-caps reading badly on a sentence-length string.
- **Optional relationship chip row:** Parent / Spouse / Me / Family. Toggling on/off; selected = inverted dark slate. Lifts fulfillment context without forcing collection. TJ confirmed name field NOT viable (we don't capture it on questions).
- **Card click → opens in new tab** (`target="_blank" rel="noopener noreferrer"`). Was a conversion leak; family who clicked a card lost their place in the form.
- **Pill colors unified** to single muted slate (was multi-color from trust-signals system, looked ad-hoc).
- **Submit copy:** "Get the answers" (was "Send the agent" — cold/novel).
- **Success state honest:** "On it. We'll email you back with what we hear from these N providers." Dropped the "24h SLA" promise — TJ flagged we can't guarantee it.

**Then a real bug bit:** TJ submitted, got the success state, no Slack alert. Root cause: fire-and-forget Promises in Vercel's serverless runtime get killed after the response returns. Fix: `await Promise.allSettled([activityInsert, sendSlackAlert])`. Saved as feedback memory; pre-test reviews missed it because I didn't pattern-match against the rest of the codebase (every other `sendSlackAlert` call site awaits).

**Other bugs caught in two pre-test review rounds (all fixed):**
- Phantom `mt-6` div for 75% of visitors who weren't in outreach arm (wrapping div rendered without children → empty 24px gap)
- Double-fire of `outreach_request_submitted` event (server route + client both fired; set semantics in admin saved the count, but raw log got dupes — dropped client fire)
- Unused `Link` import
- Caption all-caps unreadable on long sentence (sentence case)
- Pulsing dots ignored `prefers-reduced-motion` (added override to existing reduced-motion block)

**Final commit chain on `lively-poitras` (squashed into staging as `420aba6a`):**
- `02c4098e` — Initial 6-task build
- `01ee2420` — First pre-test fixes (phantom div, double-fire, unused import)
- `4a2b3c2a` — Design pass (dots, caption, chips, kill cream box, kept "AI agent" line per TJ)
- `a8b85c28` — Second pre-test fixes (caption case, prefers-reduced-motion)
- `b3ad7ee5` — Slack fire-and-forget fix (await + Promise.allSettled)
- `3f2b85d4` — Admin eyebrow 3-arm → 4-arm

### 2026-05-02 — Places Photo + Reviews API leak patches (P1)

Mercury alert May 1: $4,531 April Google Cloud bill, +184% MoM on Places API (New), $25K/yr pace.

**Three suspected leaks identified, in order of likely cost share**:
1. **Google Reviews per-pageview leak** on `/provider/[slug]` (high-traffic page) — backfill route silently returns on null without writing to DB, so providers Google has no reviews for (or any API hiccup) re-fetch on every visit forever. 12.4% of providers (9,159) in this leak surface. Plan: [`plans/google-reviews-leak-patch-plan.md`](plans/google-reviews-leak-patch-plan.md). Branch: `quiet-tabby` (off `staging`).
2. **Discovery pipeline Text Search** in `scripts/discovery-batch.py` — re-ran across 2,362 cities in 90d at $0.035/call. Deferred to follow-up plan.
3. **Photo leak in `/api/provider/[slug]/info`** — already patched in [PR #717](https://github.com/olera-care/olera-web/pull/717) on branch `fierce-panini`. Honest re-assessment: probably <5% of the bill since `/review/[slug]` gets minimal traffic. Ship as cleanup, expectations calibrated.

**Process learning** (saved as [feedback_no_killswitch_for_slow_leaks.md](feedback_no_killswitch_for_slow_leaks.md)): for cost leaks, audit ALL Places API callers + measure traffic before scoping a fix. Anchored on the named culprit too early; missed the bigger leak on the provider profile page. TJ pushed back twice before I revised. Lesson: when user says "we ran X a lot" or "nobody goes to Y," that's a measurement signal, not a side note.
### 2026-04-30 → 2026-05-01 — SBF redesign (P1) — full V3 stack + Phase 6 + multiple QA-driven fixes shipped to `good-thompson`, awaiting final QA

Branch `good-thompson` has 11 commits covering the complete V3 redesign + welcome-email upgrade + multiple post-QA refinements. **Migrations applied to Supabase** (057, 058, 059). Vercel preview deploys on each push for build validation.

**Plan:** [`plans/sbf-2step-redesign-plan.md`](plans/sbf-2step-redesign-plan.md) — original was 9 phases / 8 PRs; actual ship was 5 commits on a single branch (faster iteration cycle).

**Notion:** [P1 task](https://app.notion.com/p/3525903a0ffe81338f59d5b5326b1796) · [sibling P2 closed via metadata-blob deletion](https://app.notion.com/p/3525903a0ffe81a2b7a8c0e746ad35ae) · [SBF Copy Variants tracking DB](https://app.notion.com/p/ec27110d1c6a4cc1a76bdf991344f63d) (5 rows seeded — control/money_loss legacy, availability/loss/empathic planned)

**Commits on `good-thompson`:**

- `a9631f90` — Phase 0/1/2: 3 migrations + token lib + email validation extension + Resend bounce → `email_validity` flag + save-results route major update (channel toggle, drops `metadata.benefits_results.answers` duplicate blob, hardened validation, token issuance, SMS-anonymous path via Supabase phone auth, channel-specific welcome dispatch). Backend foundation, silent.
- `3fe7531e` — Phase 4/5: `ResultsSheet` unified component (mobile bottom sheet / desktop right panel, Telegram-grade animation, body-scroll lock, focus mgmt) + `/m/[token]` standalone page (token-as-auth, no login wall, force-dynamic, noindex robots) + `lib/benefits/provider-tie-in.ts` (heuristic overlap → "Some of these may help cover services at {Provider X}.") + new `panel-in-right` keyframe in globals.css. Components silent — not yet wired.
- `c749e993` — Phase 3 CUTOVER: variant rename (`control|money_loss` → `availability|loss|empathic`, djb2 mod 3) + rewrote `BenefitsDiscoveryModule` for 2 steps (was 917 → 585 lines) + admin analytics 3-arm split table with auto-collapsing legacy V2 row + `care_need_selected` event property for per-card pickup + provider page passes `care_types`/`category` for tie-in. **Visible change.**
- `22cb1933` — pre-test review fixes (4 bugs caught before user testing): Twilio Node SDK leaking into client bundle via `lib/twilio` import in ResultsSheet (would have failed prod build); hero copy *"0 programs"* mismatch with empty-state below; last_viewed_at error handler used `.then(undefined, ...)` which never fires for Supabase resolved-with-error promises; `preferred_contact_channel` read from metadata blob instead of column.
- `ab05f9dd` — 3-step restructure (TJ flagged step 2 felt unnatural): inserted *"Who is care for?"* tap-question between care need + contact (4 cards: parent/spouse/me/other-family) → step 3 H2 personalized via `relationshipPhrase()` ("Save your parent's 11 matches"). Switched framing from "send" to "save" (matches actual experience — matches are computed, we're preserving them). Killed channel toggle in favor of email + phone both visible, phone optional. Combined honest consent. Empathic H2 anchored to state ("Care is expensive in {state}." — was naked). All variant subs use "find" not "show" — fixes show/send framing whiplash.
- `6a8ec1fe` — Phase 6 welcome email upgrade: replaces generic "your results saved" body with state-filtered top-5 program list, personalized for relationship, primary CTA → `/m/{token}` (token IS auth — dropped Supabase magic-link generateLink + verifyOtp roundtrip, saves ~200-400ms). Subject personalized: "Your parent's 11 care benefit matches in Texas." Email body uses display-font headers, scannable program cards with savings + tap-through to `/benefits/{state}/{programId}`. SMS body also relationship-aware. Helpers extracted: `relationshipFamilyPhrase` / `relationshipPossessive` / `stateDisplayName` / `topSavingsCopy` / `CARE_NEED_LABEL_FOR_COPY`. Drops the unsubscribe link (transactional email; existing `/unsubscribe/[slug]` route is provider-focused).
- `f936f117` — pre-test review caught critical regression from sibling P2 cleanup: removing `metadata.benefits_results.answers` entirely broke `WelcomeClient.tsx:401-411` which reads `benefitsAnswers.careNeed` for the careNeedLabel switch + careNeedProviderCategory mapping. The UI care-need bucket has NO flat-metadata equivalent (top-level `care_needs` is the granular array). V3 users clicking "See full list at olera.care" from the overlay would land on degraded `/welcome`. Fix: restored minimal `answers: { careNeed }` blob; truly-duplicate fields (age/income/medicaid/stateCode) stayed deleted.
- `6b77a107` — dejank pass (TJ: "progress bars don't really make sense and the animation transitions look odd and janky"): replaced 3 segmented progress bars with a single proportional bar across the full width (the old design's filled segment only spanned ~30% of visual width — eye reads as "barely started" not "1/3 done"). Added `step-in` keyframe (220ms slide-up + fade) + keyed wrapper `<div key={step}>` so React remounts on step change → animation plays. Dropped indefinite progress-dot pulse (was annoying on step 3 where it never filled). Tightened post-click setTimeout 180ms → 140ms now that step-in animation provides smooth visual continuity.
- `31bd59f5` — two QA-found bugs: (1) 🔴 clicking match cards → 404. Root cause: `app/benefits/[slug]/[program]/page.tsx`'s `resolveProgram()` only looked up programs in pipelineDrafts, but `getEnrichedProgram` returns waiver-library IDs for any program in base data — those never matched. Added waiver-library fallback path. (2) 🟡 `/portal/profile` "Who needs care" empty after V3 submit. Root cause: V3 wrote relationship to `metadata.relationship` (new V3 enum field) but every existing UI consumer reads `metadata.relationship_to_recipient` (free-form text). Fix: added `relationshipDisplayName()` mapping ("my-parent" → "Parent") and write to BOTH fields. Profile + admin views + completeness scorer all light up.
- `f0e685bf` — copy refresh based on TJ feedback ("There's help paying for care in Texas + Paying for care as an option as a low-income user"): dropped trust strip (Free · Under a minute · Never sold to insurers · N programs — chrome fighting for attention), bumped subtitle visual weight (text-sm/gray-500 → text-base/gray-700) so it carries the "do this" beat. Reframed H2 vocabulary from "paying for care" (overlapped with the first card label) to "care benefits" (umbrella concept above the cards): availability *"Texas care benefits for families like yours."* / loss *"Most Texas families miss the care benefits they qualify for."* / empathic unchanged. Notion variant rows synced to deployed copy.

**Locked decisions:** retire 5-step entirely (no gated revert — git is revert); 3-arm A/B on entry-point copy (availability/loss/empathic) replaces V2 control/money_loss; "Paying for care" first card (highest pain-universality + H2 fluency across all arms); per-card pickup tracking via `care_need_selected` property on existing `benefits_step_completed` event; phone is now optional bonus signal (not forced channel); welcome notifications fire email always + SMS additionally when phone provided; `/welcome` stays untouched as opt-in destination via "See full list" CTA only. Decision rule = step-1 pickup (39% → 55%+) AND contact submission (8.2% → 15%+); <8% triggers revert.

**Phase 0.1 verification result** (preserved at `scripts/verify-arm-b-dollar-floor.ts`): sampled enriched program data across TX/FL/CA × 4 care needs → 10/12 combos clear the $400/mo floor. `payingForCare` (most-clicked card) clears comfortably everywhere. Two failures: `companionship` in FL+CA (programs match but no savings data). Verdict: ship Arm B as written; "often" qualifier defends population-level claim. Watch for companionship-pickup conversion under Arm B in FL/CA. Logged in Notion `loss` row.

**Audience truth that drove the design:** TJ's sustained-audience knowledge → ~95% of users won't engage with email (and senior-care families are typical users). This made Pattern G (in-session overlay as deliverable) the right move over the original Pattern A (redirect to /welcome): the SESSION is the conversion, email is a backup for the 5%. SMS (~98% read rate) is the strategic upside — driven the channel toggle decision, then evolved to phone-as-optional-bonus when toggle felt too friction-y.

**What's NOT polished (intentionally — known follow-up phases):**
- ~~Phase 6: welcome email body~~ ✅ shipped in `6a8ec1fe` — state-filtered top-5 list, personalized, links to `/m/{token}`
- Phase 7: Privacy policy page not yet updated. Inline consent text in module IS shipped.
- Phase 8: Admin per-card pickup chart not yet — data flowing via `care_need_selected` event property, just no UI exposure.
- Phase 9: Notion legacy `control`/`money_loss` archival → wait for V3 to have a few weeks of data before flipping their Status to Archived with final numbers.

**Pre-test reviews caught real bugs at every stage:**
- 4 bugs in initial cutover (Twilio in client bundle, hero "0 programs" mismatch, last_viewed_at error swallow, preferred_contact_channel from wrong location)
- 1 bug after Phase 6 (sibling P2 cleanup over-deletion broke WelcomeClient)
- 0 bugs in dejank pass (clean)
- 2 bugs from QA on preview (404 on match clicks, "Who needs care" empty)
The pattern of every-pass-finds-1-4-bugs continues to hold. Skipping the pre-test would have shipped most of these.

**Surprising data discoveries that shape the system:**
- `getEnrichedProgram` returns the waiver-library ID for any program in base data, even when a draft fuzzy-matches it. Pipeline-only programs return draft IDs. Mixed sourcing of IDs means routes that consume "any program ID" need to handle both. The `/benefits/[slug]/[program]` route was waiver-library-blind — fixed in `31bd59f5`.
- `metadata.relationship_to_recipient` is the canonical display field across `/portal/profile`, admin views, CarePostSidebar, ProfileEditWizard, completeness scorer. Anything writing relationship data to a different field is invisible to the existing UI. V3 now writes both the enum and the display version.
- Removing the `benefits_results.answers` blob entirely is NOT safe even though most fields have flat-metadata equivalents — `answers.careNeed` (UI bucket) has no flat equivalent. Single source of truth is fine; over-deleting breaks downstream consumers.

**Vercel preview status:** auto-deploys on each push to `good-thompson`. PR creation URL: https://github.com/olera-care/olera-web/pull/new/good-thompson

### 2026-04-30 — SBF redesign — original planning entry (kept for context)

Cutting the embedded SBF on provider pages from 5 steps to 2 (care need → contact). Silent profile creation via existing `/api/benefits/save-results`. Pattern G post-submit: side-panel/bottom-sheet overlay on the provider page, not a redirect to `/welcome`. Same component renders at new `/m/[token]` route. Email or SMS — user picks. Three copy arms (`availability` / `loss` / `empathic`) replace the existing copy A/B.

**Locked decisions** (from extended exploration with TJ): retire 5-step entirely (no gated revert — git is revert), three copy arms in 3-way A/B, refined trust strip (drops "Private" filler + the now-false "No signup to start"), 4 cards reordered with "Paying for care" first (highest pain-universality + H2 fluency), per-card pickup tracking, contact channel toggle (email default, SMS opt-in via existing Twilio infra) — TJ's audience knowledge = ~95% won't engage with email, so SMS (~98% read rate) is the strategic upside. Pattern G makes the in-session experience the deliverable rather than email follow-up. `/welcome` stays untouched as opt-in destination only. Decision rule = two metrics: step-1 pickup (39% → 55%+) AND contact submission (8.2% → 15%+ for clear win, <8% revert).

**Pre-implementation check** (Phase 0): sample SBF match output for $400+ floor in Arm B's subhead; if matched programs don't credibly hit that range, soften Arm B to drop the dollar specificity.

### 2026-04-30 — /product-led-growth strategic session: revenue architecture embedded, 5 Notion tasks queued

Long strategic session. Started as a /product-led-growth daily run, surfaced a 3-day state drift (post-answer hook shipped 4/29 across 9 PRs, never tracked on Active Experiments board), pivoted into a deep revenue conversation, ended with 5 tasks on the Web App Action Items board and the slash command rewired to load revenue context up front.

**State hygiene first.** Post-answer hook (Strategic Backlog #5 / TJ Task B) finally landed on the Active Experiments board with shipped 2026-04-29, decide-by 2026-05-13. Strategic Backlog row 5 status updated to shipped. Run entry appended to the Running Thread. Daily Report created at https://app.notion.com/p/3525903a0ffe81ea978cd7a9c0e30bb5. Three skipped daily runs (4/27-29) had let the post-answer hook ship into prod with no measurement plan or kept/rolled-back trigger — the failure mode the Running Thread exists to prevent.

**Pulled real funnel data instead of relying on the screenshot.** 7d window: page views 9x prior week (642 → 5,996), question volume slightly down (497 → 458), provider distinct sign-ins flat (25 → 25), benefits intake completion 7/50 = 14%. Q&A funnel cohort: 377 sent → 145 opened (56% of delivered) → 110 clicked (76% of opened) → 25 signed in (~23% of clicked) → 21 answered (84% of signed-in). My initial "click-to-signin leak" framing was sloppy because of time-window misalignment between email-send-date and activity-event-date. TJ called it: "providers are skeptical, get tons of spam, don't know we're legit." The right read on the Q&A funnel is provider trust, not a backend bug. Could spend hours diagnosing residual unexplained drop — agreed not the highest-leverage next move.

**The 96% asker orphan rate is the actual structural ceiling.** 458 weekly questions, only ~12 askers leave email (3-4%). One `questionAnsweredEmail` actually fires per week (because asker_email is empty for 96% of askers). My family-return instrumentation play was dead in the water as framed — the link doesn't exist for 96% of askers. This is the variable that bounds revenue across all three streams.

**Revenue architecture conversation.** TJ pushed back on me re-explaining what he'd already documented. Read what I'd missed: `/Users/tfalohun/Desktop/olera-hq/strategy/BUSINESS-MODEL.md` (canonical) + Olera Strategic Narrative (Notion `3025903a-0ffe-816d-9ceb-c8986c17425a`). Ranked the three streams: MedJobs ($49/mo, live since 4/10, 0 paid in 20d, retarget at senior living not small home care), Olera Pro (intentionally unpackaged, Q&A is the de facto provider acquisition funnel — 24/24 sign-ins via Q&A, 0 via claim CTA), Marketplace transaction rails (parked, Phase 3). The wedge (SBF) is acquisition not revenue. TJ explicitly chose to stay build-value-first per Resend / Airtable / Fathom Loops playbook — don't gate prematurely, watch usage form, gate where logical. Acknowledged risk: defers revenue, requires discipline reading signal.

**Embedded revenue context into /product-led-growth command.** New "Revenue architecture" section (lines 18-30) lays out the three streams + customer profiles + the wedge + company horizon ($1M ARR threshold). New "Product philosophy" section (lines 32-46) states the build-value-first bet explicitly and tells future runs not to propose paywalls or pricing changes as daily/weekly moves. Phase 1 context-loading expanded to read BUSINESS-MODEL.md + Strategic Narrative before drawing conclusions. Reference section updated. Memory file `feedback_build_value_first_gate_later.md` saved + indexed in MEMORY.md so the philosophy is durable across conversations even outside /product-led-growth.

**Deep research on what makes Olera sticky for senior care providers, staffing aside.** Walked the operator's day, the competitive landscape (APFM/Caring on lead gen; Birdeye/Reputation on review management; HubSpot/Salesforce on CRM; Tadpoles for daycare communication as a model; nothing strong on family communication for home care; nothing on benefits navigation for providers). Identified three things Olera is uniquely positioned to build: lead intelligence (Zillow Premier Agent model, intent signals competitors can't replicate), SBF for providers as a tour-day tool ($1,800/mo paying-capacity unlock for the family at the moment of decision), Q&A SEO attribution (turn answered questions into measurable marketing). Three rhythms align with sticky power-user behavior: daily / per-prospect / weekly.

**Five tasks created on the Web App Action Items board:**

- [Lead intelligence: turn provider analytics into a daily intent feed](https://app.notion.com/p/3525903a0ffe816ebc6de2392d161ace) — P3, concept exploration
- [SBF for providers: pre-tour benefits screening tool](https://app.notion.com/p/3525903a0ffe8125b4b4c15575db52d7) — P3, concept exploration
- [Q&A SEO attribution: show providers what their answers earn](https://app.notion.com/p/3525903a0ffe8152b920fc367f30f190) — P3, concept exploration
- [SBF redesign: cut embedded form to Care Need + Email, silently create the care profile](https://app.notion.com/p/3525903a0ffe81338f59d5b5326b1796) — **P1, frontend, TJ owning**
- [Unify SBF results with existing care profile: one family record, not two parallel systems](https://app.notion.com/p/3525903a0ffe81a2b7a8c0e746ad35ae) — P2, backend

**The SBF redesign discovery is the headline of this session.** Pulled per-step funnel data on the embedded `BenefitsDiscoveryModule.tsx`. 14-day window: 50 sessions started, 18 reached care need (36%), 8 reached age (16%), 4 reached financial (8%), 3 saved (6%). 64% of starters never even pick a care need. Of 3 completers, 1 is the Aggie test profile — so 2 real completions in 14 days. The 5-step SBF on provider pages is structurally broken at step 1. TJ's proposal: cut to 2 steps (Care Need → Email), silently create the care profile, redirect to `/welcome` (`app/welcome/page.tsx` rendering `components/welcome/WelcomeClient.tsx` — the existing "Your matches are saved" page). Conservative estimate of completion lift: 3% → 18-26%. The orphan-rate ceiling (which has been blocking everything across the three revenue streams) gets a 6-9x lift. This is the move TJ flagged as next.

**Files modified:**

- `.claude/commands/product-led-growth.md` — added revenue architecture (lines 18-30) and product philosophy (lines 32-46) sections; expanded Phase 1 to load BUSINESS-MODEL.md + Strategic Narrative; expanded Reference section with the new doc paths

**Memory updates** (outside git):

- `feedback_build_value_first_gate_later.md` — TJ's Resend / Airtable / Fathom Loops monetization sequencing philosophy
- MEMORY.md index entry pointing to it

**Next up:** TJ working on the SBF redesign (P1, Care Need + Email + redirect to /welcome). Sibling tasks queue behind it. Three concept tasks deserve due diligence as separate explorations. Post-answer hook continues measuring through 2026-05-13. First /weekly run scheduled for Mon 2026-05-04.

### 2026-04-29 — Post-answer hook P1 + dashboard hero overhaul — all merged to staging

Massive day. 6 PRs merged to staging in sequence. Architecture pivoted twice based on TJ feedback. Hero is now a fully dynamic, photo-driven, 6-tier priority surface with per-section imagery and skeleton loading.

**PR #676 — `60bab22c`.** Smart picker folded into existing DashboardHero as 6-tier priority stack:
1. Fresh leads → "View inquiries" (engagement, leads supersede questions per TJ)
2. Unanswered Qs → "Review questions" (engagement)
3. View spike ≥25% → no CTA (positive reinforcement)
4. Views ≥ 10 + incomplete → engagement headline + section-specific CTA
5. Views < 10 + incomplete → section-specific completion pick (full headline)
6. Views < 10 + complete → "Your page is live" fallback (no CTA)

Engagement-tier CTAs (1-3) navigate via `<Link>`; completion-tier CTAs (4-5) fire `provider_picker_clicked` with `metadata.source: "hero"` and open the relevant edit modal in place. Pre-test caught one phantom-impression race — fixed by reading localStorage in `useState` initializer. [Notion merge report](https://app.notion.com/p/3515903a0ffe8187b714d2d097cbcf42).

**PR #679 — `3df7442e`.** Post-answer hook on `/provider/[slug]/onboard`. After 4/10 self-assessment of the picker-on-success-state approach (4 stacked cards), pivoted to **auto-redirect**: brief 400ms "✓ Response sent" pulse → `router.push("/provider?from=qa-success")` → dashboard hero handles next-action from there. Pure subtraction — deleted `PostAnswerPicker.tsx`, `SmartNextActionCard.tsx`, simplified ActionCard + DashboardPage. Funnel sharpened: dropped `picker_qa_success_clickers` bucket, added `qa_success_arrivals` column backed by new `dashboard_arrival` event. Diagnostic: separates "did redirect work?" from "did hero nudge action?" Bug shipped to staging then fixed (`9731698a`): redirect was via `useEffect` on `submitted`, but `onSubmitted` flipped parent's `questionAnswered`, the `{!questionAnswered && (...)}` conditional collapsed children, React's reconciler unmounted `InlineQuestionResponse`, useEffect cleanup killed the timer. Fix: moved `setTimeout` into submit handler closure (timer survives unmount; `router` from `useRouter` is stable global). [Notion merge report](https://app.notion.com/p/3515903a0ffe8108ae80f54e70d04ce4).

**PR #683 — `614d0738`.** Hotfix: `/api/provider/dashboard` resolved wrong profile for multi-profile accounts. Query did `.eq("account_id", id) .in("type", [org, caregiver]) .limit(1)` with no ORDER BY — Postgres returned rows in unspecified order. With TJ's account having both Aggie + a `[TEST]` profile, dashboard rendered Aggie's "4 inquiries" hero on the test profile. Fix: query by `account.active_profile_id` first, fall back to limit(1) for legacy accounts. Same anti-pattern in ~14 other endpoints (review-requests, care-post/*, medjobs/*, etc.) — flagged in commit message, latent until multi-profile becomes a real flow.

**PR #685 + #686 — `b0a78dae` + `30256cba`.** Per-tier and per-section hero images. 11 unique 1920×1080 images sourced via Pexels/Unsplash:
- Tier 1: `dashboard-hero-leads.jpg`
- Tier 2: `dashboard-hero-questions.jpg`
- Tier 3: `dashboard-hero-spike.jpg`
- Tier 4 + 5: section-specific (gallery, about, pricing, services, screening, payment, overview)
- Tier 6: `dashboard-hero-fallback.jpg`

Visual mood matches the ask — gallery prompt gets a community/photographer image, leads get an active inquiry image, etc. `imageUrl` field on `Hook` interface; `hook.imageUrl ?? HERO_IMAGE_DEFAULT` fallback. Image hunt spec saved at `docs/hero-image-hunt.md` for future hunts.

**PR #687 — `91ec835f`.** De-jank: hero used to wait ~500ms for V2 fetch with empty slot, then pop in causing layout shift. Fixed three ways: (a) inline `DashboardHeroSkeleton` reserves identical dimensions (no layout shift on swap), (b) "Hey {firstName}" greeting renders immediately during skeleton (we have it from auth context — partial-content load, not pure shimmer), (c) all 11 tier images preloaded on mount via `new Image()` so tier swaps during the session are instant from cache. Dropped the misplaced top-level `DashboardPillarsSkeleton` (62 lines removed) — it was rendered above the page header, causing a double layout shift TJ wasn't even seeing.

**PR #688 — Slack alerts + daily digest extension.** Three new alerts: 🎯 dashboard arrival (qa-success only), ✋ hero CTA click, ✅ profile edit. Daily digest gains a 3rd Providers row covering same chain. `slackHeroCtaClicked` + `slackDashboardArrival` + `slackProfileEdited` helpers in `lib/slack.ts`. Wired through activity-track route. Daily digest extended in `app/api/cron/daily-digest/route.ts`.

**PR #690 — engagement-tier click tracking.** TJ caught on prod that clicking Aggie's leads banner (Tier 1) didn't fire a Slack alert. Original tracking only covered completion-tier (section pickers). Engagement-tier `<Link>` CTAs were navigations with no event handler. Fix: added `engagementTier?: "leads" | "questions"` to `NavCta`, fire `provider_picker_clicked` from Link onClick with metadata.tier + metadata.destination. `slackHeroCtaClicked` extended to render engagement shape ("Going to: Inquiries (/provider/connections)") OR completion shape ("Opening section: Gallery") based on which fields are present. PR #691 — cosmetic tooltip update on /admin/analytics to reflect that the "Clicked dashboard" hero bucket now covers both engagement + completion tiers.

**Test infrastructure used + cleaned up:**
- Created `[TEST] Empty State Provider` (Tier 5 — gallery completion pick, place-based memory care) — TJ screenshot grabbed, deleted.
- Created `[TEST] Questions State Provider` with 3 unanswered questions (Tier 2 — questions hero) — TJ screenshot grabbed, deleted.
- Created `[TEST] Completion State Provider` (memory care, place-based) — TJ screenshot grabbed, deleted.
- TJ's `active_profile_id` restored to Aggie (`d4242723-f94b-4c3a-92c3-dc65ad44e72a`).
- Three distinct hero visual states captured for team demo (leads / questions / completion).

**🚨 PR #693 — CRITICAL silent-failure bug + hotfix.** After staging→main promote, TJ noticed engagement-tier hero clicks were producing no Slack alerts. Diagnostic: ZERO rows in `provider_activity` for any of the four new event types (`provider_picker_impression`, `provider_picker_clicked`, `provider_profile_edited`, `dashboard_arrival`) across the entire history. Root cause: PRs #676 / #679 / #688 / #690 added the events to the application allowlist but **NEVER added a migration to extend the DB CHECK constraint** on `provider_activity.event_type`. Every insert failed silently — route's fire-and-forget client `.catch(() => {})` swallowed the rejection. Memory `feedback_schema_text_not_enum.md` (43 days old) literally documented this pattern. I had it but didn't apply it. **Detection latency: ~7 hours. Resolution latency: ~30 min.** Migration `055_post_answer_engagement_event_types.sql` extends the constraint. TJ applied via Supabase dashboard SQL editor; events started landing immediately, Slack alerts began firing on real engagement.

**PR #694 — postmortem.** Documented in `docs/POSTMORTEMS.md`. New memory `feedback_event_allowlist_needs_db_migration.md` saved (sharper guidance than the 43-day-old one — leads with the specific reflex `grep -rn "provider_activity_event_type_check" supabase/migrations/` whenever adding event types).

**Notion tasks created:**
- [Mobile-optimize provider portal: drop card containers on phones](https://app.notion.com/p/3515903a0ffe81baa949f4e34b5ebfb8) — P2, triple-nesting wastes horizontal real estate on mobile
- [Hero image library: per-tier asset hunt + wiring](https://app.notion.com/p/3515903a0ffe81709c0eef2b1bf74cee) — P3, completed (all 11 images sourced)

**Memories saved (4 project dirs):**
- `feedback_default_to_now_not_later.md` in olera-web, olera-hq, TJ-hq, olera-expansion-map. TJ called out the "save it for later" reflex as outdated — AI-paired dev inverts the cost calculus.
- `feedback_event_allowlist_needs_db_migration.md` in olera-web. Sharper guidance for adding event types, born from the 7h silent-failure incident.

**Live on main:** all of today's work has been promoted (staging → main multiple times). All 4 new event types now logging + Slack alerts firing + funnel columns incrementing.

**Still open:**
- Mobile container cleanup (separate P2)
- Image preload could be optimized (currently 1.6MB on mount; lazy load per-tier on demand would be lighter but needs more code)
- ~14 other endpoints share the `account_id + .limit(1)` anti-pattern — latent until multi-profile becomes a real flow

### 2026-04-28 — Post-answer hook + smart picker (P1) — planned, not started

Three-PR sequence to capture peak engagement at the post-answer moment and redirect providers into the V2 dashboard. Plan: [`plans/post-answer-hook-and-smart-picker-plan.md`](plans/post-answer-hook-and-smart-picker-plan.md). Notion: [P1 task](https://www.notion.so/Hook-the-post-answer-moment-lure-providers-into-the-V2-profile-edit-dashboard-34e5903a0ffe818eb372fb6539e65391).

Discovery confirmed: the answer form already lives on `/provider/[slug]/onboard` (`ActionCard.tsx`), so this is a success-state UI swap, not an architecture rebuild. Esther confirmed the verification gate on answer publication is intentional — keep it, monitor. Smart picker is a single component shared between the post-answer surface and the dashboard's existing static 30%-banner (which gets upgraded in the same work).

- **PR A (funnel instrumentation, ships first):** extend `qa_funnel` rollup with `clicked_dashboard` (reads existing `analytics_teaser_cta_clicked` events) + `edited_profile` columns on `/admin/analytics`. Baseline before any UI ships.
- **PR B (smart picker on dashboard):** new `<SmartNextActionCard>` + `lib/next-best-action.ts` scoring function. Replaces the static "Complete your profile" banner on `DashboardPage.tsx`. Category-aware soft-honest copy (no data-claim multipliers).
- **PR C (post-answer hook):** swap the `if (submitted)` branch in `ActionCard.tsx` for the same picker with `source="qa-success"`. Source-tagged links + per-source funnel attribution.

### 2026-04-28 — Restore category stock-image fallback (P2) — shipped to staging via PR #670

**[PR #670](https://github.com/olera-care/olera-web/pull/670)** on branch `feat/provider-stock-image-fallback`. Two commits:

1. **`8a5b488b`** — empty-array fix. Wired `getCategoryFallbackImage` into the provider detail hero (`app/provider/[slug]/page.tsx`) and fixed `businessProfileToCardFormat` so `imageType: "photo"` for stock URLs (was `"placeholder"`, short-circuiting three card components to gradient). Helper + 15-image library at `public/images/fallback/` had existed since `d4ffa24a` but was never wired to the V2 hero. TJ verified the photoless case works on staging across all 6 in-scope categories.

2. **`17ce40cf`** — runtime-failure extension (TJ asked to keep the extension on the same PR to avoid context fragmentation). TJ found a second case via DevTools: providers WITH image URLs that 502 through next/image (R2 / cdn-api hosts on staging) still showed gradient. The carousel cycled "1/6 → 1/5 → ... → 1/1 → gradient" as each onError fired. Fix: new `fallbackImage` prop on `ProviderHeroGallery` and new `fallbackImage` field on `ProviderCardData`. When `validImages.length === 0` (whether from empty array OR runtime onError cascade) the gallery now renders the stock photo, not the gradient. Same fallback path added to all three browse-card components. Verified working on Visiting Angels + Choice Home Care detail pages, plus Comfort Keepers / Visiting Angels browse cards.

3. **`217a2f7a`** — polish (TJ flagged "a little bit of jank" — the counter cycling "1/6 → 1/5 → ..." was still visible during the onError cascade even though the end state was correct). Render-stack approach: stock photo as a base layer (z-0) always rendered when fallback available; real image(s) as overlay (z-1). While real image is loading it's transparent, so the stock shows through — no flash. Once real image loads, it covers stock. If it fails, stock stays. Gallery's counter + arrows now gated on `anyRealImageLoaded` — only appear once a real image confirms `onLoad`, hiding the cycling visibility entirely. Same pattern applied to all three browse-card components (`BrowsePageClient`, `BrowseCard`, `ProviderCard`).

**Diff: 8 files, +258 / -110.** Build clean (3795/3795), typecheck 0 errors. Pre-test review traced 18 vectors — no bugs.

**Categories in scope:** 6 (Home Care Non-medical, Home Health Care, Assisted Living, Independent Living, Memory Care, Nursing Home). Two home-care types share the home-care pool. Artifact categories (hospice/rehab/adult day care/wellness/private caregiver) fall through to home-care imagery via `DEFAULT_FALLBACK_POOL` — separate cleanup project per TJ.

**Underlying root cause** (not addressed in this PR): some real provider image URLs are 502'ing through Vercel's `/next/image` optimizer on staging — could be stale R2 URLs, image-domain config, or a transient. Worth its own investigation; this PR makes the symptom invisible.

**Next:** TJ to re-verify the polish commit on staging (counter "1/6 → 1/1" cycle should no longer be visible on detail pages with broken images), then merge to main via `/pr-merge`.

### 2026-04-28 — Benefits QA queue populated for all 49 remaining states

Bulk-populated the [Benefits QA — Program Review Queue](https://www.notion.so/fb03b87a9918460086ae728ee879b9e2) Notion DB with **614 program rows** across all states with completed pipeline data (FL + TX were already there). Queue now has 626 total rows. Cess can filter by State and work through states one at a time; the high-severity rows (62 across 49 states) are the priority since they're real numeric mismatches >15% from a fresh source check.

**Approach:** built `scripts/build-qa-rows.js` to assemble row data from `data/pipeline/{STATE}/{classify,drafts,factcheck}.json`, derive Severity from flag list, format flag fields as readable summaries. Split into 100-page batches and delegated insertion to a subagent (the MCP `notion-create-pages` payload was too large to inline). One typo introduced in a Wyoming source URL (`Database` → `Department`) caught and corrected via update-page.

**Flag totals across 49 new states:** 161 programs flagged, 62 high-severity, 99 medium. Most medium flags are phone mismatches where pipeline drafted local numbers and verifier returned a national hotline — judgment calls, not defects.

### 2026-04-28 — Benefits intake conversion lift (P1) — planned, not started

Three-PR sequence to lift visit→started + started→completed on the embedded benefits intake on provider pages. Plan: [`plans/benefits-intake-conversion-lift-plan.md`](plans/benefits-intake-conversion-lift-plan.md). Notion: [P1 task](https://www.notion.so/Improve-benefits-intake-conversion-copy-visual-treatment-to-lift-completion-rate-34e5903a0ffe813aa547d2cc4378e761).

Audit of all 5 steps showed only the **save step** has fat to trim (the others are clean). Resequenced to fix that first — instrumenting before the redesign would give us a week of baseline data on a form we're about to change.

- **PR A (save-step rework, ships first):** drop name field; cut redundant "We found programs for your family." H2 (eyebrow + button already carry the proof); drop pointless "1 ·" / "2 ·" field-label numbering (one field doesn't need a counter). Backend tolerates missing firstName via existing `display_name: "Care Seeker"` fallback. Single-field forms convert dramatically better than multi-field — likely 10-25% lift on its own.
- **PR B (per-step instrumentation, after PR A stable):** new `/api/benefits/track-step` route + `useTrackStep` helper; fires `benefits_entry_viewed`, `benefits_step_viewed`, `benefits_step_completed` to `provider_activity`. All carry a `variant` field (forced to `"control"` in PR B). No Slack pings on the new events. Watch ~1 week before PR C.
- **PR C (entry-point copy A/B + trust strip, after PR B watch):** deterministic 50/50 hash on `session_id` (no GrowthBook installed); money-loss headline + dynamic-state sub-line on the variant arm; trust strip on **both** arms. Decision rule: 20%+ lift → ship; <5% movement → kill and look downstream.
- **Scope:** ONLY `BenefitsDiscoveryModule` (the embedded 5-step entry on provider pages). Standalone `BenefitsIntakeForm` out of scope.

### 2026-04-27 — Sweep #1 (provider data-quality cleanup) shipped

End-to-end provider directory cleanup. Started with 73,304 active providers, ended with 70,722 — net 2,582 deletes + 270 reclassifications.

**Approach evolution (regex iteration → LLM self-correction):**
- v1 (sweep day): regex amnesia detector caught 320 amnesia cases (199 reclass-eligible).
- v2.0–v2.2 (this morning): widened regex 4x to catch ThedaCare-style long-list-negation FPs, Lexie Rae-style "residential care facility" FNs, Joyful-style definitional-context confusions. Reached 245 reclass / 2,569 deletions.
- **Final: scrapped regex.** Did a focused LLM re-pass (4.1 min, ~$5) on the 2,936 OUT_OF_SCOPE verdicts with a forced-choice anti-amnesia prompt. 354 recovered (271 reclass / 83 silent), 2,582 confirmed deletions. Replaced regex output with this.
- **Disagreement file:** generated alongside (regex v2.2 vs re-pass) — 233 cases where the two signals diverged. Useful sanity-check artifact for TJ's spot-check.

**Total cost: ~$170** ($0 Tier 1 + $3 calibration + $160 Phase 3 LLM verify + $5 LLM re-pass + $2 retries).

**Files in this PR (`feat/data-sweep-skill` off staging):**
- `docs/provider-category-definitions.md` (NEW) — 6-category source of truth, with state-specific terms (RCFE, PCH, AFH).
- `docs/data-sweep-runbook.md` (NEW) — operational details: Tier 1 regex, inverted Phase 3 prompt, contradiction detection logic, MD format, cost expectations, change log.
- `.claude/commands/data-sweep.md` (NEW) — slash command / skill for future sweeps.
- `scripts/pipeline-batch.js` — three Stream A prompts now share the new `SIX_CATEGORY_DEFINITIONS` + `OUT_OF_SCOPE_TYPES` constants. Tight YES list (the 6) + comprehensive NO list. Stream B Places call now also fetches `types`/`businessStatus`/`addressComponents` (stored in `google_reviews_data` for future filter logic).
- `scripts/discovery-batch.py` — search terms tightened: removed '55+', 'senior apartments', 'rehabilitation center', 'cognitive care', 'memory support', 'visiting nurse' (alone), and other contamination sources. New comment block documents the rationale.

**Backups for revert (in `~/Desktop/TJ-hq/Olera/Provider Database/Cleanup/`):**
- `deletions-executed-2026-04-27.csv` (2,582 rows: provider_id, name, current_category, city, state)
- `reclassifications-executed-2026-04-27.csv` (270 rows: provider_id, name, old_category, new_category, city, state)
- All MD versions kept: `*.v1.md`, `*.v2-regex.md`, current files = LLM re-pass output.

**Key learnings → runbook for sweep #2:**
- Free-text LLM reasoning + regex parsing = compounding fragility. Default to forced-choice prompts when possible.
- Whenever you find yourself patching regex 5+ times, step back and ask if the approach is wrong.
- LLM re-pass with anti-amnesia prompt gives structured output for ~$5; replaces regex post-processing entirely.
- Some patterns regex still catches that LLM misses, and vice versa — disagreement file surfaces these for human triage.

**Next steps after this PR merges:**
- Phase 7 reflection (already in runbook — formalize once we run sweep #2).
- Wrong-category cleanup of INSUFFICIENT_EVIDENCE providers (~50K) — would need different prompt + signal.
- Backfill `google_reviews_data.{places_types, business_status, country_code}` for existing providers (separate workstream).
- Migrate the 13-type backend ProfileCategory enum to match the 6 (longer-term cleanup).

---

### 2026-04-27 EOD — Phase 2 A/B live in prod, Phase 3 picked up tomorrow

Four PRs shipped in one day across Phase 1 + Phase 2:
- PR #648 / #651 — Phase 1 funnel visibility on `/admin/analytics`
- PR #653 — Phase 2 A/B variant assignment + admin split table
- PR #658 — Phase 2 to prod (bundled with Cess's FL editorial)
- PR #659 / #661 — visibility fix so the A/B table renders before first send

Slack [addendum thread](https://oleraworkspace.slack.com/archives/C0A91BA205T/p1777334076195659?thread_ts=1777319720.741329) live in `#ai-product-development` to inform the team.

Resuming tomorrow: Phase 3 (follow-ups for unopened — biggest open-rate lever per audit). Notion task ([Phase 3 Resume-here pre-flight](https://www.notion.so/34f5903a0ffe81809188d977573d27d2)) updated with file paths, sequence priority, and the Phase 2 dependency note. Pre-flight summary:
- All infra in place: cron route just needs to be added at `app/api/cron/qa-email-followups/route.ts` + `vercel.json` cron entry
- Sequence #1 (24h unopened resend) ships first; #2 (channel switch via Twilio/Slack) and #3 (6h opened-not-clicked nudge) are follow-ups
- Earliest clean ship date: 2026-05-04 (lets Phase 2 A/B accumulate ~1 week of un-tainted signal). Or accept noise and run concurrently — velocity call

---

### 2026-04-27 — Q&A email A/B test on subject + preheader (Phase 2 of P1) — PR #653

**Status:** shipped to staging via PR #653, promoted to main via PR #658. Visibility fix shipped via PR #659/#661. Notion task moved to In Progress/Doing — awaiting 2-3 weeks of A/B data.

Started Phase 2 ([Notion](https://www.notion.so/34f5903a0ffe81dc8d6fd39cdb40fe23)) the same day Phase 1 shipped — startup velocity, no point waiting for clean baseline data to start iterating on copy. First commit was a tame "for"-instead-of-"about" subject + preheader = question excerpt. TJ pushed back twice: (1) PHI concern on asker name in subject, (2) "we can do way better, do research." Refolded into a real A/B with research-backed B variant.

**Variants:**
- A (control) — exact production: `A family has a question about {Provider}`, no preheader
- B — the question text itself, quote-wrapped, truncated 48 chars: `"Can residents bring their own furniture?"` + preheader `From a family on Olera · {Provider}`
- B PHI-fallback — when question text matches `/(dementi|alzheim|parkinson|cancer|stroke|hospice|als|dialysis|...)/i`, fall back to `A new family question for {Provider}` + generic preheader

**Why this B:** B2B subject-line research (2026 benchmarks, Apollo/Prospeo/Campaign Monitor) shows question-format subjects average ~46% open vs ~32% for statements; short subjects (≤4 words) lift opens 45%; marketing-urgency language drops opens below 36% and 69% of decision-makers report being annoyed by it. The format that wins is "looks like a colleague forwarded a real question" — which is literally what B is.

**Implementation:**
- `lib/email-templates.tsx` — `assignQuestionVariant()` (random 50/50), `questionReceivedInbox()` returns `{subject, preheader, phiFiltered}`, PHI keyword regex
- 3 send sites (live + 2 deferred) use the same helper, persist `variant` + `phi_filtered` to `email_log.metadata`
- `app/api/admin/analytics/summary/route.ts` — `qa_funnel_by_variant` rollup added; reads `metadata.variant` from each `email_log` row
- `app/admin/analytics/page.tsx` — new `<VariantSplit>` table inside Q&A funnel card, shows per-variant sent/delivered/opened/clicked + open rate + CTR. Hidden until variant data exists. Footnote when pre-deploy emails (no variant) appear in the window.

**Volume math:** 70 sends/day ÷ 2 arms = 35/arm/day. Directional signal in 2-3 weeks; statistical significance in 6-8 weeks. Ship the directional winner without waiting for p<0.05.

**Memory:** `feedback_phi_in_subject_lines.md` saved (no asker names / health detail in subjects — server logs, push notifications, lock screens leak).

**Next up:**
- Wait for Vercel green, merge PR #653 → staging
- Then promote staging → main (Q&A funnel admin tile already on main from PR #651, but A/B variants need to flow to prod sends)
- Watch the Variant Split table on /admin/analytics over the next 2-3 weeks
- Phase 3 ([follow-ups for unopened](https://www.notion.so/34f5903a0ffe81809188d977573d27d2)) is queued; biggest open-rate lever per audit but blocks on Phase 2 isolation

**Skipped (deliberate):**
- Resend backfill — send-only API key blocks `GET /emails/:id`; cohort self-corrects by 2026-05-03 once 7d window is entirely post-webhook
- Send-time / sender / DMARC audit — flagged for follow-up, not on critical path
- Preheaders on the other 5+ email templates — strict improvement, deferred (infra now in place)

---

### 2026-04-27 — Production missing V2 dashboard hero — FF removed (PR #647)

**Symptom:** olera.care `/provider` was showing the old "Profile completeness + provider card" layout. Staging had the V2 hero ("34 questions waiting for your answer" orientation banner), prod did not. Slack to Logan/Esther: TJ flagged the gap to avoid duplicate work before resuming the post-care-secret-question optimization.

**Root cause:** `NEXT_PUBLIC_FF_PROVIDER_ANALYTICS_ONBOARD` env var was set in Vercel staging but not production. Both branches had identical code; the gate at `components/provider-dashboard/DashboardPage.tsx:39-40` and `components/provider-onboarding/ActionCard.tsx:10-11` short-circuited the V2 layout when the flag wasn't `"true"`.

**Fix path chosen:** Path B — rip the flag out (vs Path A flip the env var). V2 has been live on staging since 2026-04-23, no remaining "off" use case. PR #647 open against staging.

**Diff: -202 lines.** Net deletion. Files:
- `components/provider-dashboard/DashboardPage.tsx` — flag const + 4 inline references removed; `useProviderDashboardV2Data("30d", true, user?.id)`
- `components/provider-onboarding/ActionCard.tsx` — flag const + both FF-off branches deleted; dead helpers stripped from `ProfilePreviewCard` (`handleReviewsCtaClick`, `reviewsCta`, `reviewsContent`, `snippetText`, `starPath`); `googleReviewSnippet` and `unansweredCount` props dropped

**Validation:** typecheck 0 errors, build clean (3,794 static pages), eslint shows only pre-existing 8 errors on `<a href="/provider/reviews">` (unchanged from staging baseline). Pre-test review found nothing — the V2 path being kept is the same path staging has been running for 4 days.

**Next up:**
- Merge PR #647 staging → main → olera.care redeploys with hero visible
- Then resume the post-answer provider journey optimization (the original Slack thread context: "before optimizing the provider journey from care secret question")
- Reply in `#ai-product-development` once merged so Logan/Esther know the gap is closed

---

### 2026-04-27 — Q&A email funnel visibility shipped (Phase 1 of P1 task) — PR #648 / #651

**Status:** shipped to staging via PR #648, promoted to main via PR #651. Notion task marked Done 🙌. Phase 2 ([Notion](https://www.notion.so/34f5903a0ffe81dc8d6fd39cdb40fe23)) and Phase 3 ([Notion](https://www.notion.so/34f5903a0ffe81809188d977573d27d2)) split off as sibling tasks.

Audited the P1 task ([Notion](https://www.notion.so/34e5903a0ffe80a3989ee19c09dc110a)). Key finding: the leak is the provider notification email open rate, not anything on the care-seeker side. Last 7d on staging: 520 sent → 36 opens → 27 sign-ins → 19 answered. Once they open, ~58% answer. Once they sign in, we got them.

The visibility gap: we saw opens (existing `qa_email_openers` tile) and downstream sign-ins/answered, but nothing upstream. Sent / delivered / bounced / marked-spam were all captured in `email_events` + denormalized on `email_log` (since 2026-04-26 commit `9b1f74f5`), just not displayed. PR #648 surfaces them as a new "Provider Q&A Email Funnel" card on `/admin/analytics`.

Two-file diff (`app/api/admin/analytics/summary/route.ts` + `app/admin/analytics/page.tsx`). Pre-test review caught one bug pre-ship: cohort vs event anchor mismatch on bounced/complained — fixed by event-anchoring those side stats so they stay in lockstep with the issues list.

Resend backfill skipped: full-access API key required (current key is send-only). Instead, the cohort will fully reconcile by 2026-05-03 once the 7d window is entirely post-webhook. Phase 2 (subject line / preheader / sender rep / send-time) and Phase 3 (follow-ups for unopened) build on this baseline.

Notion task body updated with TARGET METRIC + Phase 1/2/3. Memory `project_qa_funnel.md` saved so future sessions don't re-misread the funnel direction.

---

### 2026-04-27 — Benefits QA: em-dash cleanup shipped (PR #650), Cess's FL audits surfaced

**PR #650 shipped to staging** — em-dash stragglers + draft prompt hardening.
- Branch: `chore/em-dash-stragglers-cleanup`. 2 commits: `fce38c6c` (9 sites in FL drafts.json + Rule 9 in prompt), `3d6d18e2` (pre-test follow-up: cleaned ~14 prose em dashes from prompt EXEMPLARs/placeholders that were teaching Claude by example).
- Cause of stragglers: prior sweep (`6a0f8c99`) regex matched literal `—` but JSON stores `—` escape form; 9 leaked through in TJ's WAP audit content. Five replaced with comma, 1 period, 2 semicolons, 1 parens (failing roof / active mold / unsafe electrical comma-soup).
- Pre-test review caught Rule 9 contradicting itself via the `applicationNotes` EXEMPLAR (3 em dashes in sample "good" output) + ~10 placeholder descriptions. Fixed in second commit. Icon-menu structural separators (47, "House" — home care) left intentionally; clearly list format, not prose.
- Renderer chain verified: callout text rendered via `String(section.text)` plain, FAQ answers via `<p>{faq.answer}</p>` + JSON-LD schema. Both safe.

**🚨 Critical discovery — Cess has been QA'ing FL programs since 2026-04-22 and her work was invisible to my Notion query.**
- TJ called this out by sharing a screenshot showing 11/14 FL rows with all 5 checkboxes ticked. My API filter (`Status equals Approved/In Progress/Needs Changes/Blocked`) returned only 3 rows because **Cess ticks per-step checkboxes but leaves Status="Not Started" and Reviewer="Open"**.
- 8 Cess-touched FL rows discovered: CCE (1 phone flag), Elder Options, HCE, MoW, Legal Aid, LIHEAP, PACE, SHINE. Audit findings live inside page bodies under "## Audit Results", not on the queue row metadata.
- Read 4 of 8 page bodies so far (CCE/HCE/MoW/PACE). Remaining 4: SHINE, Elder Options, Legal Aid, LIHEAP — fetching next.

**Patterns surfacing in Cess's audits (so far):**
- **Real factual errors:** PACE income `$2,901 → $2,982/mo` (300% FBR 2026, same fix as SMMC-LTC). PACE service-area: page says "Miami-Dade only" but Cess reports "now available in 30+ counties incl. Tampa, Orlando, Jacksonville, Panhandle." CCE phone `211 → 1-800-963-5337` (Elder Helpline).
- **Site-wide bugs (every FL page she touched):** "Related programs" cross-links broken on every program (renderer issue, not content). "Free — no cost to you" header showing on programs that aren't free (HCE has $160/mo subsidy; PACE has private-pay premium for non-Medicaid).
- **Editorial scripts pending:** Full prose rewrites for Overview / Eligibility details / How to apply / Steps / Multiple FAQs across CCE, HCE, MoW, PACE. Substantial.

**Recommended path forward (3-PR split):**
1. Site-wide bug PR — debug "Related programs" cross-link breakage + "Free" header gate. Fixes apply to all 51 states, highest leverage.
2. FL factual corrections PR — PACE income + service area, CCE phone. Small/fast, denial-risk numbers.
3. FL editorial rewrites PR — apply Cess's prose scripts. Bigger, taste-driven, slower review.

**Memory saved:** `feedback_benefits_qa_status_filter.md` — Notion QA queue: Cess ticks checkboxes without changing Status; don't filter by Status alone, query all rows + read page bodies.

**Read all 8 Cess-reviewed FL page bodies. Full audit inventory captured.**

**Chunk 1 shipped — PR #652** `qa/benefits-site-wide-bugs` — three site-wide renderer bugs in `components/waiver-library/ProgramPageV3.tsx` (+31/-20):
- `relatedPrograms` filter: drop unresolvable entries instead of rendering gray non-link pills. Audit showed 1,820 of 2,332 entries (78%) across all 51 states currently render as broken-looking pills because they reference programs not in our pipeline (TANF, SSI, Senior Farmers Market, etc.). Now: section either shows working links or doesn't render at all. Net 2,332 visible pills → 512 working links.
- "Free, no cost to you" hero banner: removed entirely. Was tripping on HCE ($160/mo subsidy), PACE (private-pay premium), Elder Options (sliding-scale co-pay) — promotional rather than editorial. `savingsRange` already handles the truly-free case.
- `useSectionObserver` rewrite: was only reacting to `isIntersecting=true`, leaving active id stuck on prior sections. Now tracks the set of currently-intersecting sections and picks topmost in document order. Fixes the "Eligibility highlighted while at Overview" screenshot Cess sent twice.
- Typecheck clean. Both production routes (`/benefits/[slug]/[program]` + `/senior-benefits/[state]/[benefit]`) use V3; V2 is unimported dead code.

**Chunk 2 shipped — PR #654** `qa/fl-factual-corrections` — 6 denial-risk fact fixes in `data/pipeline/FL/drafts.json` (+drafts.ts auto-regen):
- PACE income $2,901 → **$2,982/mo** (FAQ); same correction we applied to SMMC-LTC.
- PACE service area Miami-Dade only → **30+ counties** (4 sites: localEntities, intro, applicationNotes, FAQ). Page was actively turning away caregivers in 30+ counties.
- CCE top-level phone `null` → **`1-800-963-5337`** (Elder Helpline) + replaced placeholder DOEA contact + filled empty `sourceUrl`.
- Elder Options home equity cap $585,000 → **$752,000** (3 sites: exemptAssets, structuredEligibility.homeEquityCap numeric, FAQ Q1 + spouse-waives-cap nuance added).
- Elder Options service area 5 counties → **16 counties** (4 sites: intro, eligibility requirements, applicationNotes, FAQ Q2). Page was telling caregivers in 11 N.C. FL counties they were out of area when ElderOptions actually serves them.
- LIHEAP "not all Florida counties participate" → **"active in all 67 Florida counties"** + heating cycle (through March 31) + cooling cycle (April 1+).

**Editorial inventory for chunk 3 (still pending):**
- CCE: Overview, "What's Covered" (medication clarity), Eligibility details, Steps, FAQ Q2/3/5/6/7/8
- HCE: Header, Overview ($160/mo subsidy detail), asset/income/medical scripts, How to apply, FAQ Q4
- MoW: Overview ¶2 ($7-9.49/meal pricing), Other Requirements, How to apply, Get in touch contacts, FAQ Q4/5/8
- PACE: Header (already partly handled by chunk 1), Overview, eligibility scripts, Good to Know, Steps, FAQ Q2/Q7
- SHINE: Remove personal staff email, use Elder Helpline + floridashine.org Find-a-Site
- Elder Options: 16-county throughout (factual core handled by chunk 2; remaining script-rewrites for Good to know + Get in touch voicemail + Step 2 financial eligibility)
- Legal Aid: Senior Legal Helpline hours fix, Coast-to-Coast Legal Aid (Broward) phone fix
- LIHEAP: All-67-counties throughout (factual core handled by chunk 2; remaining application steps + processing/waitlist context + FAQ Q2)

**Next up:**
- Chunk 3 starting now (per TJ "let's continue" after chunk 2 ship)
- After chunk 3: investigate the related-programs data fix (update prompt to constrain to in-state programs, regen) as a separate PR
- Test chunks 1+2 on staging preview when TJ has bandwidth

---

### 2026-04-26 — /product-led-growth bootstrap + Esther/TJ task split shipped

**Built and shipped `/product-led-growth` slash command.** PR #642 merged to staging (squash, commit `0e674a43`). Two PRs total: V1 daily-mode + V1.5 reframe to daily-build / weekly-stats / monthly-strategy after the dry-run revealed daily-pulse produced false signal from Sunday baselines. Files: `.claude/commands/product-led-growth.md`, `scripts/growth-pull.js`. PR #643 open with Working Principle #8 (trust the implementer, don't over-prescribe when writing Notion tasks for the team).

**Notion infrastructure set up:**
- 📈 [Growth Command Center](https://www.notion.so/34e5903a0ffe81ca950ed0d00dde74a9) — weekly snapshot dashboard
- 🧠 [Growth Running Thread](https://www.notion.so/34e5903a0ffe8165abf5c4b84d84d06c) — patterns, observations, open questions, run entries
- 🧭 [Growth Strategy Brief](https://www.notion.so/34e5903a0ffe8159b1eef1d266f9c62c) — diagnosis, seeker journey design, backlog play, Strategic Backlog

**Strategic diagnosis confirmed by 4-flow code walk:** Olera has no relational mechanism today. Q&A is page comments (no `connections` row, no thread, no reply path). Saves are silent (provider never learns). Benefits intake creates a profile that does nothing afterward. The `connections` table primitive exists in schema; it just isn't being written to for the highest-value interactions.

**Six Notion tasks created/refined across Esther + TJ owners.** Esther's active P1 queue narrowed to 2 items (focus on hire-ROI):
- [Fix save button for non-signed-in users](https://www.notion.so/34e5903a0ffe81fb85baf7b7c502859a) — 401s silently for guests; includes contextual save prompt + Slack alerts + admin tile
- [10-views provider nudge](https://www.notion.so/34e5903a0ffe8064b7b8c0f8cd7ff8f4) — email providers with proven page-view demand to complete Meet the Author + Photos

TJ's active P1 queue:
- [Increase open rates via follow-up emails](https://www.notion.so/34e5903a0ffe80a3989ee19c09dc110a) for unanswered questions
- [Hook the post-answer moment](https://www.notion.so/34e5903a0ffe818eb372fb6539e65391) to bring providers into the V2 dashboard
- [Improve benefits intake conversion](https://www.notion.so/34e5903a0ffe813aa547d2cc4378e761) — TJ kept this since he built the original with Chantel

Backlog (deferred for focus): question = profile hook, save = profile strategic UX layer.

**Team kickoff Slack** sent to `#ai-product-development` ([link](https://oleraworkspace.slack.com/archives/C0A91BA205T/p1777244098651849)). Frame: providers respond at ~70% when they land on the answer page, so a lot of the work is about getting them there. Esther + product team meeting tomorrow.

**Writing-style learnings captured to memory** (`feedback_tj_writing_style.md` updated 3x this session):
- Notion tasks: 3 sections max (Context / What we need / Done when), context-rich, don't over-prescribe — collaborators are capable humans with their own design opinions
- TJ voice: no em dashes (use `--`), no rhetorical colons, no flourishes ("the wedge is real but unattended"), no marketing words, numbers stand alone
- Sunday-baseline trap: ran growth-pull on Sunday afternoon and locked "52 questions/day" into multiple tasks. Actual rate is ~70/day. Single-day pulls are not canonical
- Don't simplify TJ's product framing: Olera Pro is a package (reviews, leads, growth tools, GBP optimizations, comparison data, insights, family care profile access), not just one thing. Reducing it to make a clean argument misleads audiences

**Next up:**
- Esther/product team meeting tomorrow on the new task split
- PR #643 (Working Principle #8) ready to merge — ~12 lines added
- First `/product-led-growth --weekly` run on Monday will baseline funnel ratios; revisit deferred items after that data arrives

---

### 2026-04-26 — Resend webhook integration — SHIPPED + VERIFIED (PRs #635, #637)

**Status:** ✅ live and verified. First real `opened` event landed and `email_log` denormalized columns updated correctly. Loop is closed.

**Verification (2026-04-26 ~12:57 UTC):**
- `email_events` row: `event_type=opened`, `svix_id=msg_3CtZbMfHTSucgRzuXhkRzvH8E9f`, `occurred_at=2026-04-26T12:34:55Z`
- This was a Resend retry of an event that earlier 403'd against Vercel — proves the URL change worked, signature verified, idempotent insert succeeded
- `email_log` denormalized state for the matching email (question_received → tfalohun@gmail.com): `first_opened_at=2026-04-26T12:34:55Z`, `last_event_type=opened`, `last_event_at=2026-04-26T12:34:55Z` ✓

**The pivot:** started from the open Olera Action Items task "Audit provider question/lead notification email — find the open-rate lift" (P1 🔥). Territory mapping uncovered the foundational gap: we don't track email opens at all (only sends + click-throughs via `appendTrackingParams`). Without webhooks, the audit's data path is one-shot (call Resend's API per email, retain nothing). Promoted webhook integration to the primary task; audit becomes downstream and gets re-run on real data once webhooks live.

**The pivot:** started from the open Olera Action Items task "Audit provider question/lead notification email — find the open-rate lift" (P1 🔥). Territory mapping uncovered the foundational gap: we don't track email opens at all (only sends + click-throughs via `appendTrackingParams`). Without webhooks, the audit's data path is one-shot (call Resend's API per email, retain nothing). Promoted webhook integration to the primary task; audit becomes downstream and gets re-run on real data once webhooks live.

**Notion task created** for the new scope: [Resend webhook integration — unlock email open/click tracking (prerequisite for the email audit)](https://www.notion.so/Resend-webhook-integration-unlock-email-open-click-tracking-prerequisite-for-the-email-audit-34e5903a0ffe81ef87facb32a7437132) — P1 🔥, owner TJ, timeline 2026-05-02. Sibling to the original audit task.

**PR #635 — MERGED to staging** (commit `d6a7387f`). 9 files, +694/-15. Breakdown:
- `supabase/migrations/051_email_webhook_events.sql` (new) — applied to Supabase ✅
- `app/api/resend/webhook/route.ts` (new) — POST handler, raw body, svix signature verify, returns 200 always so Resend doesn't retry
- `lib/resend-events.ts` (new) — `verifyResendSignature()` (uses `svix` npm package, NOT raw HMAC — Resend uses Svix infra) + `recordEmailEvent()` (idempotent insert + monotonic email_log update)
- `scripts/backfill-resend-events.js` (new) — one-shot, manual `--apply` invocation, ~2 req/sec, deterministic `backfill-{resend_id}` svix_id so re-runs are no-ops
- `app/api/admin/emails/route.ts` + `.../export/route.ts` (modified) — extended SELECT to include 7 new lifecycle columns + CSV export columns
- `app/admin/emails/page.tsx` (modified) — `EmailLog` interface extended, new `lifecycleBadge()` helper prefers `last_event_type` (opened/clicked/bounced/etc) over send-time status, preview drawer shows lifecycle timestamps
- `package.json` + `package-lock.json` — `svix@^1.92.2` added at top-level (was transitive only — Vercel `npm ci` would have failed without this)

**Schema design (chosen — hybrid):**
- New `email_events` table — full event history, one row per webhook delivery, `UNIQUE(svix_id)` for idempotency, joined to `email_log` via `resend_id`
- Denormalized columns on `email_log` — `delivered_at` / `first_opened_at` / `first_clicked_at` / `bounced_at` / `complained_at` / `last_event_type` / `last_event_at` so "open rate" SQL stays a flat scan, no join required
- Why hybrid: pure events table forces a join + aggregation per query; pure denormalized columns lose timeline data. Hybrid gives both.

**Idempotency:** `UNIQUE(svix_id)` enforced at DB level. Replays from Resend hit the constraint and silently no-op. Email_log denormalized columns use monotonic UPDATEs ("first" timestamps only set when null, "last_event" only advances when newer) so out-of-order replays can't move time backward.

**Pre-test bugs caught + fixed before push:**
1. Initial `delivered_at` guard used wrong field (`logRow.last_event_at` instead of `logRow.delivered_at`) and didn't SELECT the column for guarding. Fixed both.
2. Backfill script was treating `result.error` from Resend SDK as "no last_event" instead of surfacing it. Now checks `result.error` explicitly and reports failures.

**Setup state — COMPLETE:**
- ✅ Migration 051 applied to Supabase
- ✅ PR #635 merged (Vercel route + DB schema + admin UI) at `d6a7387f`
- ✅ Vercel returned 403 on Resend POSTs as predicted (Bot Protection vs Svix-on-GCP) — same pattern as Stripe
- ✅ PR #637 merged — webhook ported to Supabase Edge Function
- ✅ Edge Function deployed: `https://ocaabzfiiikjcgqwhbwr.supabase.co/functions/v1/resend-webhook`
- ✅ `RESEND_WEBHOOK_SECRET` set as Supabase secret (and still in Vercel env for the deprecated route as fallback)
- ✅ Resend webhook URL updated to point at the Supabase function
- ✅ First real `opened` event landed and verified end-to-end (see Verification section above)

**Vercel Bot Protection (confirmed + mitigated):** Resend uses Svix infra on GCP. Vercel's edge Bot Protection layer blocked GCP-origin POSTs with 403. Migrated to Supabase Edge Function — same Svix verify, same idempotent insert, same monotonic UPDATE, just outside Vercel's edge. Vercel route at `app/api/resend/webhook/route.ts` retained with deprecation notice as documented backup.

**Apple Mail caveat (framing for the audit re-open):** Apple Mail Privacy Protection prefetches images on receipt, inflating opens 30-50% for that cohort. Click rate is the cleaner signal for iteration. The audit's "find the open-rate lift" framing should reframe to "find the engagement lift, primarily measured by clicks" when the audit task re-opens.

**Next steps:**
1. ✅ Webhook live + verified.
2. New tile in `/admin/analytics` Providers section: "Opened Q&A emails" (distinct providers who opened a `question_received` email in the window) — shipping in a separate PR alongside this scratchpad update. Apple Mail caveat in the tooltip. Ratio is implicit vs the existing "Questions" tile in Engagement (every question → one email).
3. Re-open the audit task ([Notion](https://www.notion.so/Audit-provider-question-lead-notification-email-Resend-find-the-open-rate-lift)) once ~7 days of real data has accumulated.
4. Optional: run `node scripts/backfill-resend-events.js` to populate ~30 days of history from Resend's retained per-email status.

**Stranded local branches (cleanup):**
- `chore/scratchpad-resend-webhook-pivot` (local, never pushed) — yesterday's mid-session save with the pivot decision but pre-execution state. Superseded by this entry; safe to delete.
- `chore/scratchpad-2026-04-26-webhooks` (current) — this entry.

**Deferred follow-ups (post-merge, separate PRs):**
- Auto-suppression for hard bounces / complaints — needs policy doc (false-positive risk for 60-70yo audience is real)
- `/admin/analytics` Opens tile — best designed as part of the audit re-run, where the consumer picks the right windowed denominator
- A/B testing framework for subject lines — webhooks unlock the data; testing UI is its own scope
- Periodic reconciliation cron — for `email_events` rows where `email_log_id IS NULL` (race: webhook arrives before our send pipeline writes resend_id). Low priority unless we observe lookup misses in practice.
- `email_events` retention policy — table grows ~1k-3k rows/day. Not blocking, but worth a 12-month archive policy eventually.

---

### 2026-04-25 — Admin Analytics — KPI strip rebuilt + design pass (3 PRs)

**Where it landed:**
- ✅ **PR #632 MERGED** to staging (commit `1519f266`) — grouped KPI strip (Discovery / Engagement / Families), range-aware (follows the date picker), benefits_started instrumentation. Migration 049 applied to staging Supabase.
- ⏸ **PR #633 OPEN** — Providers section (5 distinct-provider tiles). Migration 050 applied. **Superseded by #634** — close after #634 lands.
- ⏸ **PR #634 OPEN** — Design pass (audience grouping, deltas, insight strip, animated counters, URL-encoded range, click-throughs, tooltips, top-providers polish). Includes #633's commits cherry-picked. Active branch: `feature/admin-analytics-design-pass`. Latest commit: `dc7ba414` (audience tints amber-50/70 warm, sky-50/70 cool).

**Layout that landed in #634 (Wave 1 design pass):**

```
[ Insight strip ]   ✦ "Page views up 100% last 7 days (2,181 vs 1,066 prior)."
[ Last 7 days ]
  Care seekers   (warm amber tint)
    Discovery        Page views · Unique sessions · Card clicks
    Engagement       Questions · Leads · Reviews
    Family funnel    Benefits started · Benefits finished · Profiles published
  Providers      (cool sky tint)
    Sign-ins from Q&A · Page-flow claims · Answered questions · Engaged with leads · Clicked dashboard CTA
[ Top providers ]   sortable, display name primary, slug as muted mono
[ Latest 50 events ]
[ Footer ]   "Bot rejects today: N" — relocated out of the windowed card
```

Per-tile delta lines (↑12% emerald / ↓4% rose / "flat" gray / "new" emerald), tooltips, click-throughs to filtered admin views, animated counters (cubic ease-out 600ms), `?preset=7d` URL param.

**Files modified across all 3 PRs:**
- `supabase/migrations/049_benefits_started_event.sql` (new) — applied
- `supabase/migrations/050_claim_completed_event.sql` (new) — applied
- `app/api/admin/analytics/summary/route.ts` — major rewrite, range-aware + prior-window deltas + insight generator + olera-providers name lookup
- `app/admin/analytics/page.tsx` — major rewrite, audience grouping, all polish touches
- `app/api/activity/track/route.ts` — `benefits_started` added to ANONYMOUS_EVENT_TYPES
- `app/api/benefits/track-start/route.ts` — DB persist on top of existing Slack alert + sessionId
- `app/api/claim/finalize/route.ts` — fires `claim_completed` with `metadata.source='email'`
- `app/api/provider/claim-listing/route.ts` — fires `claim_completed` with `metadata.source='page'`, keyed on slug
- `components/providers/BenefitsDiscoveryModule.tsx` — passes sessionId to track-start
- `hooks/use-animated-count.ts` (new) — value-tweening hook (re-runs on value change, unlike useAnimatedCounters which only fires on mount)

**Wave 2 (deferred — not in #634):**
- Per-tile sparklines (60×16 mini-charts inside each tile) — needs new time-series-per-metric endpoint
- Multi-series chart upgrade with annotations + benchmarks — needs annotations data model + design conversation

**Resume next session:** TJ tested #634's preview. Once happy, `/pr-merge 634` to staging, then close #633. Wave 2 sparklines + chart upgrade is the natural follow-up.

**Key decisions locked in this session:**
- "Search clicks" was misleading (counted card click-throughs from results pages, not home-page search) → renamed "Card clicks" in the UI; underlying event_type stays `search_click`. Home-page search button remains uninstrumented (deferred).
- "CTA clicks" tile dropped — only ever counted Save (heart) clicks; Connect/Contact instrumentation was a never-shipped TODO. Underlying `cta_click_public` event still used by provider-side dashboards.
- Two claim endpoints map naturally to source attribution: `/api/provider/claim-listing` → `source='page'`, `/api/claim/finalize` → `source='email'`. No request-body `source` param needed.
- Distinct-provider counts (not raw events) for Providers section — different shape than the rest of the strip but matches "how many people did X" framing.
- `lead_opened` event is whitelisted in CHECK but never written by any code path. Switched "Engaged with leads" filter to `one_click_access AND metadata.action='lead'` (production has 2 such events confirming the path fires). If we later instrument a real lead_opened in the portal, can swap back.
- Audience grouping (Care seekers / Providers) replaces the inconsistent flat 4-section labels (Discovery/Engagement/Families/Providers — three actions + one audience).
- Audience tints: started at /30 opacity → looked like off-white smudges → bumped to /70 (amber warm, sky cool) so they read as intentional design, not render artifacts.
- claim_completed (page-flow) keyed on `providerSlug` not `providerId` — matches the slug format every other anonymous event uses, enables future cross-event joins. Email-flow path still uses providerId since slug isn't in that body — known caveat.

**Pre-test bugs caught + fixed before push:**
- PR #632: "All time" preset returned last-24h (endpoint defaulted to 24h fallback when no params)
- PR #633: "Engaged with leads" filtered on `lead_opened` which has zero rows ever in production
- PR #634: skeleton flickered on range change (re-mounted tiles, broke counter tween); 3-tile rows in 5-col grid created awkward empty columns; claim_completed keyed on wrong ID format

---

### 2026-04-23 — Provider Analytics — Phase 2 (Dashboard Redesign) — ALL PILLARS BUILT, ready for PR polish + merge

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

**Email deliverability follow-ups (updated 2026-06-11 PM):**
- ⏳ **`seniorlistings.net` warming in Smartlead** (started 2026-06-11, seasoned ~early-July). Decide its eventual send-use closer to July (cold outreach via Smartlead, or wherever it fits). Optionally connect + warm `team@seniorlistings.net` (2nd mailbox).
- 🅿️ **Resend sticky sender-pool rotation (#1023) — CLOSED/parked.** Built (`lib/email.ts` `resolveSender` + `PROVIDER_NOTIFY_POOL`, env-gated, unit-tested) but seniorlistings went to the Smartlead cold lane, not Resend — so no domain to rotate to. Reopen only if we ever add a 2nd *Resend* provider-notification sender.
- ⏳ **Email Verifier v2** — bulk list paste + CSV export, throttled (≤1 req/1.5s under ZeroBounce's Cloudflare limit). Only if the team leans on v1.
- Note: `oleracare.com` is still cold (no warm-up ramp) — verify-on-send protects the bounce *rate*, but the domain itself wants a real ramp.

**Provider-removal hygiene (multi-session, started 2026-05-08):**
- ✅ **Project 1: Blocklist data layer + admin surface.** Shipped on `quiet-kepler` as commit `08d3dcc1`, migration applied, blocklist caught up via admin UI. Awaiting PR open.
- ⏳ **Project 2: Periodic audit script** — `scripts/audit-removal-blocklist.js`. Load blocklist + olera-providers, fuzzy-match (normalized_name + phone + place_id), Slack alert on hits. Weekly cron + manual run after every city pipeline batch. ~1-2 hours.
- ⏳ **Project 3: Wire blocklist check into `scripts/pipeline-batch.js`** as pre-filter alongside existing deletedNameSet. Belt-and-suspenders. ~30 min after Project 2 settles the matching logic.
- ⏳ **Project 4: SEO equity fix for 18K 404s** (independent, can ship anytime). Add `deletion_reason` column to olera-providers + reason-aware page response: provider_request → HTTP 410 Gone. data_sweep → 301 to `/{category}/{state}/{city}` power page. Stops the bleeding from soft-delete-as-404 pattern that's been accumulating since the data-sweep workflow began.

**After PR `feat/data-sweep-skill` merges:**
- Backfill `google_reviews_data.{places_types, business_status, country_code}` for existing 70,722 active providers (Stream B only populates this on next sync — separate one-shot script if we want it sooner).
- Run sweep #2 in ~3 months (default quarterly cadence) on full DB — see runbook for procedure. Validate the v2.2 regex isn't catching new patterns before scrapping it for sweep #3.
- Wrong-category cleanup of `INSUFFICIENT_EVIDENCE` providers (~50K) — would need different prompt + signal (website fetch, Google Places `types`).
- Migrate the 13-type backend `ProfileCategory` enum down to the 6 — separate workstream for claim UI restriction + dead enum cleanup.

0. **Re-open the email audit task** ([Notion](https://www.notion.so/Audit-provider-question-lead-notification-email-Resend-find-the-open-rate-lift)) after ~7 days of real webhook data accumulates. Reframe primary metric from "open-rate lift" to "engagement lift, primarily clicks" given Apple Mail noise.
0a. **Wave 2 admin analytics polish** — per-tile sparklines + multi-series chart upgrade with annotations. Deferred from PR #634 (which merged 2026-04-25). Needs a new time-series-per-metric endpoint.
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
| 2026-04-27 | Scrap regex amnesia detector for LLM self-correction pass | After 5 regex iterations (v1 → v2.2) chasing TJ-flagged FPs, recognized regex-on-LLM-free-text is fundamentally fragile. Forced-choice anti-amnesia prompt on the 2,936 OUT_OF_SCOPE verdicts gave structured output for ~$5 in 4 min. Replaced regex output entirely. |
| 2026-04-27 | Generate disagreements file as third review artifact | When two noisy signals disagree (regex v2.2 vs LLM re-pass), the cases worth highest scrutiny are the 233 disagreements (8% of OUT_OF_SCOPE). Cheap to produce, valuable for spot-check, surfaces blindspots in either signal. |
| 2026-04-27 | Backup CSVs written BEFORE DB writes, not after | If execution fails partway, we still have the full intended-state record. Recovery is a single SQL UPDATE per CSV. Previous data sweeps generated backups after which is recoverable but more painful. |
| 2026-04-27 | Tighten discovery search terms over relying on entity verification to clean up | Sweep #1's $160 entity verification cost reflects too-loose discovery: '55+', 'senior apartments', 'rehab center', 'cognitive care' pulled massive false positives. Tightening discovery prevents pollution; cheaper than per-batch LLM cleanup. |
| 2026-04-27 | Forced-choice prompts > free-text reasoning for verification | Free-text LLM reasoning often contradicts its own verdict (amnesia: "Non-medical home care provider" → marked OUT_OF_SCOPE). Forced-choice with anti-amnesia guidance forces the LLM to commit to one of {6 cats, NONE} without contradicting itself. |
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

### 2026-06-11 (PM) — seniorlistings.net cold-domain warm-up stood up; Resend rotation pool closed

Built then closed the Resend sticky sender-pool rotation (#1023, `lib/email.ts` `resolveSender`, env-gated, unit-tested) after TJ reframed `seniorlistings.net` to the Smartlead cold lane (warm-only, not a Resend secondary). Then stood the domain up end-to-end (infra only, no repo code): Google Workspace + GoDaddy DNS (MX/SPF/DMARC/DKIM all authenticated) + Smartlead connect (cleared the Domain-Wide-Delegation + "app blocked"/App-Access-Trusted hurdles) + warm-up started 2026-06-11 (seasoned ~early-July). No code merged (rotation parked). Detail in Current Focus + memory `project_email_deliverability`.

### 2026-06-11 — Email verify-on-send + dead-email surfacing + Email Verifier — shipped to prod (#1014, #1016, #1017)

Closed the provider-email bounce problem end-to-end. Send path now verifies provider-notification addresses via ZeroBounce on cache-miss (was cache-only → new addresses bounced; oleracare.com hit 5.1%, over Resend's account-wide 4% line; 43% of addresses dead). Dead on-file emails now surface in the "Needs Email" queues (questions flagged on send-suppression via `email_dead`). Built an admin Email Verifier tool (Records → Email Verifier) on the same engine. Redesigned the Needs Email input (calm/typographic). Backfill: 987 dead addresses suppressed + 384 stuck questions surfaced. ZeroBounce funded (5k credits + autopay) + key in Vercel Prod+Preview. All PRs (#1014, #1016, #1017, promotions #1015/#1019) merged staging→main, live in prod. Team announced in #ai-product-development. Pre-test caught: A/B were on the leads surface, the scenario is questions — ported. Next: `seniorlistings.net` send-domain rotation pool; Email Verifier v2 (bulk + CSV). See Current Focus for detail.

### 2026-06-09 — Per-variant conversion + leads-recap variant (PR #993)

Built the "Both, conversion first" task off the #982 digest dashboard. Planned the attribution model with TJ first (14-day last-touch window, `one_click_access` for weekly_digest, delivered as denominator), then built. Phase 1: Converted column. Phase 2: leads-recap variant + new `"leads"` magic-link destination. Pre-test clean (caught/fixed 1 stale tooltip). Both phases committed (`fb5578ba`, `58b627fe`, `48e7b74f`), pushed, PR #993 → staging. Holding merge for TJ's leads-email copy approval. See Current Focus for full detail. Next: TJ verifies dashboard + copy on the `git-variant-conversion` Vercel alias → merge → first real data Mon Jun 15.

### 2026-05-01 → 2026-05-02 — Texas expansion (293 cities) — full Atlas batch shipped

**Scope:** Atlas-flagged TX batch from `map.olera.care`, 293 cities. 50 fresh (Atlas `missing` + 1 `covered` Mission Bend that DB said was empty), 243 expand (29 thin + 56 moderate + 158 covered).

**Two-phase run:**
- **Phase A (Fresh, 50 cities):** discovery → pipeline-batch `--phase all`. 1,332 active providers loaded. 1h17m + 20.4m discovery. Cost: $48.64 + $134.51 = $183.15.
- **Phase B (Expand, 243 cities):** discovery `--force` → pipeline-batch `--force --cities="..." --phase all`. Killed mid-enrich on a false-alarm panic, resumed at `--phase enrich`. 6,260 → 9,341 active (+3,081). 2h20m discovery + 2h13m clean+load + 3h58m enrich resume. Cost: $269.02 + $29.69 + $185.23 = $483.94.

**Combined: 6,316 → 10,729 statewide TX active (+4,413 net). Total spend: $667.09.** Atlas estimated $7,325 — ran ~9% of estimate.

**Key numbers from the run:**
- 1,239 trust signals confirmed senior care; 1,665 false positives soft-deleted by entity verification (wedding venues / DME / community centers)
- 2,201 review snippets fetched; 1,877 photos resolved to permanent lh3 URLs
- 146 expand cities with real expansion (+5 or more); 18 dedup-blocked (Atlas correctly labeled "covered"); 22 with small -delta (max -12 Fresno, all from entity-verify cleanup)
- Top expand winners: San Antonio +74, Houston +70, Arlington +63, Dallas +62, El Paso +61, Austin +50, Amarillo +44

**Notion state:** 50 fresh pages created + flipped to Complete with Done boxes. 66 individual TX expand pages reset to "Upload to Backend" mid-run, then restored to Complete. 2 "Texas Group" rollup pages also patched (172 of the 243 expand cities live in those rollups, not as individual rows — left them rolled up vs creating 172 new pages).

**Slack notified:** Logan tagged in #ai-product-development for provider outreach handoff.

**Mistake to remember:** mid-enrich QC reported "massive deletions" (Garland 196 → 21, etc.) and I raised a 5-alarm panic. **Bug was in my QC query** — I used `provider_id LIKE 'garland-tx-%'` while the legacy Garland providers use random-prefix IDs (`4trRGPZ-...`, `pLaafyS-...`) from an older import format. Cross-checking by `city='Garland', state='TX'` showed 217 active (not 21) — pipeline was fine. Killed and resumed pipeline lost ~30 min. **Lesson:** baseline used `city=` field, but I built the QC with `provider_id LIKE` — always match the QC pattern to the baseline pattern, OR use `city=`/`state=` as the canonical truth. Saved this as a memory.

**Branch:** `fast-dijkstra` (worktree off staging). No code changes — pipeline-running session only. SCRATCHPAD update only.

### 2026-04-27 — Sweep #1 wrap (resume → execution → pipeline updates)

**Resumed** the data-sweep work paused at end of 2026-04-26. TJ had paused review on the deletions + reclass-from-deletions MDs after flagging Lexie Rae's Care Home as another regex amnesia gap.

**Iterated regex 4x (v1 → v2.2):**
- v2: widened AL pattern (drop "for the elderly"), added META_REFS for category-by-name signals ("falls under", "matches", "should be reclassified as"), service vocab broadened
- v2.1: added clause-level negation after TJ flagged ThedaCare Physicians (long-list-of-negation FP that fixed-window check missed)
- v2.2: added definitional-context exclusion + "indicate" META_REF after TJ flagged Joyful Home Health Care (LLM described HHC business model but my regex matched the definitional sentence about HC Non-medical)

**Strategic pivot:** TJ called out that the fix-cycle pattern was a smell — 5+ patches without converging. Stepped back, articulated that regex-on-LLM-free-text is fundamentally fragile, and proposed an LLM self-correction pass with forced-choice anti-amnesia prompt. TJ agreed.

**Executed the pivot:** Wrote `repass-out-of-scope.js` + `regen-from-repass.js`. Re-pass on 2,936 OUT_OF_SCOPE verdicts: 4.1 min, ~$5. Produced 2,582 confirmed deletions / 271 reclass / 83 silent / 0 missing. Generated `disagreements-2026-04-27.md` (233 cases where regex v2.2 vs re-pass diverged) as a third review artifact.

**TJ reviewed all 3 files:** approved. Found one stale-website edge case (`8M1Gdy4` Oakview Park — actually AL/MC, but website field points at a Comfort Keepers office that misled the LLM). Unchecked that row with a TJ override note.

**Executed cleanup:** `execute-cleanup.js` ran in 4.6s. Soft-deleted 2,582 providers, reclassified 270 (Oakview Park stayed AL|MC). Active providers: 73,304 → 70,722. Backup CSVs written before any DB writes.

**Pipeline updates** (this session, ready for PR):
- `scripts/pipeline-batch.js`: 3 prompts unified via `SIX_CATEGORY_DEFINITIONS` + `OUT_OF_SCOPE_TYPES` constants. Tight YES list (the 6) + comprehensive NO list. Each prompt now also returns `category` (one of the 6) for richer signal. Stream B Places call expanded with `types`/`businessStatus`/`addressComponents`, stored in `google_reviews_data.{places_types, business_status, country_code}` for future filter logic.
- `scripts/discovery-batch.py`: search terms tightened, removed contamination sources from sweep #1 (55+, senior apartments, rehab center, cognitive care, memory support, visiting nurse alone, personal care, caregiver). Comment block at top documents the rationale.
- `docs/data-sweep-runbook.md`: updated change log with v2/v2.1/v2.2 + the "scrapped regex for LLM re-pass" learning.
- `SCRATCHPAD.md`: this file.

**Branch state:** `feat/data-sweep-skill` off `origin/staging`. 3 modified files (SCRATCHPAD, pipeline-batch.js, discovery-batch.py), 3 untracked (definitions doc, runbook, skill). Ready to commit + PR.

**Cost summary for sweep #1:** ~$170 total ($0 Tier 1 + $3 calibration + $160 LLM verify on 73K + $5 LLM re-pass + $2 retries). Active providers post-sweep: 70,722.

**Skill + runbook artifacts:**
- `.claude/commands/data-sweep.md` — slash command for sweep #2+
- `docs/data-sweep-runbook.md` — operational details (regex, prompts, cost, change log)
- `docs/provider-category-definitions.md` — source of truth for the 6 categories
