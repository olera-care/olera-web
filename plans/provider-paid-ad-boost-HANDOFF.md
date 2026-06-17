# Provider Paid Ad Boost (Managed Lead-Gen) — Handoff (2026-06-13)

**Branch:** `keen-stonebraker`
**Worktree:** `~/.claude-worktrees/olera-web/keen-stonebraker`
**Status:** Paused — exploration + plan done, no code written
**PR:** none
**Owner:** TJ

> ⚠️ Notion publish was blocked this session — the Notion MCP server isn't connected (no `mcp__claude_ai_Notion__*` or `mcp__notion__API-*` tools). This file is the handoff content; paste it into **Branch Handoff Reports** (data source `e3014bc0-3a03-40ed-9c09-a66994fb9e78`) when the MCP is back, or re-run `/notion-report` from a session that has it.

---

## 1. Where it stands

🔬 **Spike / planning only.** This is TJ's "Sri Lanka" idea, explored and planned — **zero implementation**.

**Done:**
- Full codebase audit (provider visibility, completeness, demand data, Stripe, ads infra).
- Strategic reframe locked with TJ via clarifiers.
- Implementation plan written: `plans/provider-paid-ad-boost-plan.md` (3 phases, 7 tasks).
- SCRATCHPAD "Current Focus" updated.

**Not done:**
- No code. No migration. No PR. Nothing wired.

**The reframe (what the idea actually is now):**
- Olera runs paid **external** ads (Google/Meta) on a provider's behalf → families land on the provider's **Door B** intake (`BenefitsDiscoveryModule`) on their Olera page. Providers **pay**.
- Profile must clear a **completeness threshold** before a campaign can be set up. "Select next week" = a **concierge setup window**.
- **Dropped at TJ's direction:** the "Sorry, not enough families in your area" scarcity message.

**Why the original objections died:** external ads generate their own demand (no empty-theater problem on the illiquid marketplace), and we never touch internal browse ranking (no collision with the resolved 2026-06-08 "no pay-to-win rank" decision).

---

## 2. Worktree (find-branch)

```
cd ~/.claude-worktrees/olera-web/keen-stonebraker
```

`branch: keen-stonebraker` (codename == branch here). Clean relative to staging (0 ahead / 0 behind); only uncommitted work is the plan file + SCRATCHPAD edit.

---

## 3. Resume command (paste after compacting)

```
I'm resuming the "Provider Paid Ad Boost (Managed Lead-Gen)" work on Olera (Next.js 16 + Supabase senior-care marketplace). It's planning-only so far — no code.

The idea: Olera runs paid EXTERNAL ads (Google/Meta) on a provider's behalf, driving families to that provider's Door B intake (BenefitsDiscoveryModule) on their Olera page. Providers pay. A profile must clear a completeness threshold before a campaign is set up; "select next week" = a concierge setup window. We do NOT touch internal browse ranking, and payment is out-of-band (Stripe is inert) for v1 — it's a concierge pilot, not a self-serve ad platform.

Read first:
- plans/provider-paid-ad-boost-plan.md  (the plan — 3 phases, 7 tasks, open decisions)
- SCRATCHPAD.md "Current Focus" (2026-06-13 entry)
- Memory: project_engagement_reframe, project_door_a_vs_door_b_dilemma, project_comfort_keepers, project_market_diagnostic, feedback_build_value_first_gate_later, feedback_event_allowlist_needs_db_migration

Key reusable code: lib/profile-completeness.ts:217 (calculateProfileCompleteness), components/providers/BenefitsDiscoveryModule.tsx (Door B), app/api/connections/request/route.ts (lead delivery), seeker_activity events, lib/analytics/referrer (traffic classification), app/provider/pro/page.tsx (existing static "Olera Pro" page that promises off-strategy internal "Priority Search Placement" — must reframe).

Before writing code: confirm the 4 open decisions in the plan with me (threshold %, table-vs-metadata storage, provider-facing ROI yes/no, Comfort Keepers as pilot anchor). Then start Phase 1 task 1 (eligibility helper). Plan with me before coding.
```

---

## 4. What's next (plan first)

Confirm the **4 open decisions** in `plans/provider-paid-ad-boost-plan.md`:
1. Completeness **threshold** number (plan assumes 70%).
2. **Storage** — dedicated `ad_campaign_requests` table (preferred) vs `business_profiles.metadata`.
3. **Provider-facing ROI** — show provider their campaign results, or admin-only in v1?
4. **Pilot anchor** — Comfort Keepers as first provider?

Then Phase 1 task 1: build `lib/ad-boost/eligibility.ts` reusing the completeness scorer. Plan each phase before coding.

---

## 5. ⚠️ Blind spots & open risks

- **Nothing is built or verified.** This is a plan; all file paths in it are proposed, not written.
- **Off-strategy collision risk:** `app/provider/pro/page.tsx` already advertises "Priority Search Placement" (internal rank). The plan reframes it to external ads — if a future session wires a boost into `BrowseClient` ranking instead, it directly violates the resolved no-pay-to-win-rank decision (`project_engagement_reframe`). Hold the line: external ads only.
- **Monetization-timing tension:** charging providers conflicts with build-value-first (`feedback_build_value_first_gate_later`). Mitigation baked into plan: out-of-band pilot pricing + Phase 3 ROI reporting *before* any Stripe/self-serve. Don't let scope creep into an ad-platform integration or Stripe checkout for v1.
- **DB CHECK trap:** any new `event_type` or status enum needs a matching migration or inserts fail silently (`feedback_event_allowlist_needs_db_migration`).
- **Attribution fragility:** referrer headers get stripped by email/privacy clients — plan relies on UTM params on the landing URL (first-touch), not referrers. Unvalidated until built.
- **Comfort Keepers framing shift:** that memory says "learning engagement, not charging" — this introduces paid. Flag the shift when proposing to them.
- **Completeness inputs:** `calculateProfileCompleteness` needs profile + metadata + reviews + response-rate assembled the way `DashboardPage.tsx` does it — the eligibility helper must replicate that assembly, not call the scorer with partial inputs.

---

## 6. Key pointers

- **Plan:** `plans/provider-paid-ad-boost-plan.md`
- **Memory:** `project_engagement_reframe`, `project_door_a_vs_door_b_dilemma`, `project_careseeker_leads_reframe`, `project_comfort_keepers`, `project_market_diagnostic`, `feedback_build_value_first_gate_later`, `feedback_event_allowlist_needs_db_migration`, `feedback_serverless_fire_and_forget`, `feedback_admin_endpoints_get`
- **Reusable code:** `lib/profile-completeness.ts:217`, `components/providers/BenefitsDiscoveryModule.tsx`, `app/api/connections/request/route.ts`, `lib/analytics/referrer.ts`, `app/provider/pro/page.tsx`
- **Related threads:** Comfort Keepers lead-gen pilot; market-diagnostic "SEMrush for senior-care acquisition" engine.
