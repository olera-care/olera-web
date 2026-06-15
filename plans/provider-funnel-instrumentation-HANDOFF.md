# Provider Funnel Instrumentation + Managed Ads (banner/digest) — Handoff (2026-06-14)

**Branch:** `provider-funnel-instrumentation`
**Worktree:** `~/.claude-worktrees/olera-web/keen-stonebraker`  ⚠️ codename ≠ branch
**Status:** Ready for PR (open, unmerged)
**PR:** #1051 — https://github.com/olera-care/olera-web/pull/1051 → targets `staging`
**Behind staging:** 0

> ⚠️ Notion MCP not connected this session — couldn't publish to Branch Handoff Reports (`e3014bc0-3a03-40ed-9c09-a66994fb9e78`). This file is the report; paste it there or re-run `/notion-report` from a Notion-connected session.

---

## 1. Where it stands

🚧 **In progress — built + typecheck-clean + PR'd, NOT browser/email-tested.**

**Built/done (all committed + pushed, PR #1051):**
- **Funnel instrumentation** for the reworked provider surfaces. Migration `105_managed_ads_and_your_market_events.sql` adds 5 event types — **APPLIED to Supabase** (verified against the live CHECK; probe rows cleaned up). Shared `lib/analytics/track-provider-event.ts` (keepalive). 6 surfaces wired. 4 new Slack builders. New Activity Center "Growth" category + relabel of `market_diagnostic_viewed_no_leads` → "Saw the managed-ads pitch". Allowlist synced across migration / app `PROVIDER_EVENT_TYPES` / admin `PROVIDER_ACTION_EVENT_TYPES` / categories / labels.
- **Hero banner** (`DashboardHero.tsx` `resolveHook`): Managed Ads is the primary empty-handed fallback for the ~99% (no leads/questions/nearby family), shown regardless of completeness; completion + market rotate in; ≥10-views+gap still leads with completion.
- **Weekly digest variant** (`providerManagedAdsEmail` + cron): leads the no-leads cohort; `action=ads` magic link → `/provider/boost`; weekly rotation (~2 of 3 weeks); registered in admin automations + the email-preview picker; telemetry counter `managedAdsCount` added + `completionCount` fixed to count off `variant`.
- **Copy (final):** "Reach families already searching for care." + "We run the ads on Google, Facebook & Nextdoor and send them straight to your page — nothing for you to set up." + **"Get started"** — across hero / boost page / digest email.

**Not done:** browser QA, email render QA (preview-only), merge to staging.

**Test setup (live, must revert):** test account **Aggie Home Care** (`db312b06-b2d5-419a-92f4-57df91e565ca`) moved College Station, TX → **Boise, ID** so the no-leads hero banner shows. Shared prod instance — restore after testing.

---

## 2. Worktree (find-branch)

```
cd ~/.claude-worktrees/olera-web/keen-stonebraker
```

`branch: provider-funnel-instrumentation` (the worktree codename is `keen-stonebraker` — they differ).

Next phase off fresh staging (after this merges):
```
git worktree add ../olera-web-next -b <next-branch> origin/staging
```

---

## 3. Resume command (paste after compacting)

```
Resuming the provider funnel-instrumentation work on Olera (Next.js + Supabase, senior-care marketplace). Branch: provider-funnel-instrumentation, PR #1051 → staging (open, unmerged). cd ~/.claude-worktrees/olera-web/keen-stonebraker

Context: we reworked the provider IA (Find Families = leads; Your Market = the market diagnostic; Managed Ads = /provider/boost) — that's merged (PR #1050). THIS branch adds (1) funnel instrumentation mirroring the old measurement (event → provider_activity → Activity Center "Growth" category + Slack; migration 105 APPLIED), (2) a Managed Ads hero banner as the primary empty-handed fallback in DashboardHero.tsx resolveHook, and (3) a Managed Ads weekly-digest variant (providerManagedAdsEmail). Final copy: "Reach families already searching for care." + "Get started".

Read first: SCRATCHPAD.md (2026-06-14 "Current Focus" entry), plans/provider-funnel-instrumentation-plan.md, plans/provider-find-families-ia-rework-plan.md. Key memories: project_engagement_reframe, project_careseeker_leads_reframe, feedback_event_allowlist_needs_db_migration, feedback_provider_comms_governance, feedback_no_timeout_in_shell.

Verification note: the worktree has no node_modules — symlink Desktop's (`ln -sfn ~/Desktop/olera-web/node_modules ./node_modules`) then `npx --no-install tsc --noEmit` (ignore the 4 baseline missing-dep errors: @vercel/functions, @react-pdf/renderer, qrcode).

Next: browser-QA on the staging preview, RESTORE the Aggie test account, then merge. Don't write code before re-confirming with me on anything non-trivial.
```

---

## 4. What's next

1. **Browser QA on the staging preview** (PR #1051):
   - Hero managed-ads banner on Aggie Home Care (now Boise) → click → `/provider/boost`.
   - The event loop: BoostCard / boost view / Your Market view / playbook → Activity Center **"Growing their business"** category + Slack pings.
   - Digest: preview **"Managed ads"** in Admin → Automations → weekly-provider-digest; dry-run (this week is managed-ads-active → `managedAds=N`).
2. **Restore Aggie Home Care** → College Station, TX (`30.5852, -96.2959`). Originals saved below.
3. **Merge PR #1051 to staging** (via `/pr-merge`).
4. (Open product follow-ups from the earlier work: the `/provider/pro` page still advertises "Priority Search Placement" internal pay-to-rank — contradicts the ads product; sessionStorage first-touch UTM persistence.)

---

## 5. ⚠️ Blind spots & open risks

- **NOT browser-tested.** Typecheck-only (via symlinked node_modules). Client components can throw at runtime despite passing tsc (your own past lesson).
- **Email render unverified.** Can't render email in code — the managed-ads digest email is only verifiable via the admin Automations preview picker. Eyeball it + dry-run before it sends live. It's on the `olera.care` crown-jewel send path (reuses existing infra/unsubscribe — no new domain).
- **Aggie Home Care is mislocated in PROD right now** (Boise, ID). Single shared Supabase instance → it shows as a Boise listing on the live site until restored. **Restore:** `business_profiles` id `db312b06-b2d5-419a-92f4-57df91e565ca` → city "College Station", state "TX", lat 30.5852, lng -96.2959.
- **Slack volume.** "See everything" pinging — one journey fires several pings; expected, tune later.
- **Digest rotation** sends managed ads ~2 of 3 weeks; a dry-run on a rotation week shows `managedAds=0` by design (this week is NOT one).
- **Shared file touched:** `Navbar.tsx` (from the merged IA work, already on staging) and `DashboardHero.tsx` (this branch). Hero change is additive to `resolveHook`; verified the rotation math + that real signals (leads/questions/nearby) still win.

---

## 6. Key pointers

- **Plans:** `plans/provider-funnel-instrumentation-plan.md`, `plans/provider-find-families-ia-rework-plan.md`, `plans/provider-paid-ad-boost-plan.md`
- **Memories:** `project_engagement_reframe`, `project_careseeker_leads_reframe`, `feedback_event_allowlist_needs_db_migration`, `feedback_provider_comms_governance`, `feedback_dashboard_clicks_vs_completions`, `feedback_no_timeout_in_shell`, `feedback_design_taste`
- **Related PRs:** #1050 (merged IA rework — the base), #1051 (this branch)
- **Migration to apply for any future events:** extend `provider_activity` CHECK + `PROVIDER_EVENT_TYPES` + `PROVIDER_ACTION_EVENT_TYPES` + provider-categories together (the 7-hour lesson).
