# Phase 6 — Post-Launch Operational Items

Status: **SKELETON / DEFERRED** (items don't fit Phases I-V but must not be lost)
Branch: TBD (created after Phase V ships and real Pilot Active providers exist)
Owner: Claude (build) + Logan (approval gate before build starts)

## Goal

Handle the workflows that only matter once providers are actually in the pilot — dormancy detection, metrics visibility, feedback collection, expiry handling, and self-serve end-pilot.

## Bullets

1. **Pilot-active dormancy re-engagement** — provider activates but doesn't invite a student in 7 days → admin gets a "check in with {org}" task; provider doesn't visit in 14 days → admin reach-out task
2. **Pilot metrics dashboard** — surface at `/admin/medjobs/metrics` showing CTR (clicks/sent), activation rate (pilot_active/sent), reply rate, meeting rate, by campus and by week. Reuses the connections-tracker pattern.
3. **Provider feedback collection** — surface for the optional feedback the pilot agreement mentions ("Olera may request feedback... feedback sessions, surveys, or other formal or informal ways"). MVP: simple "How's the pilot going?" prompt + free-text + optional follow-up call request. Triggered at Day-30 + Day-60 of pilot.
4. **Pilot expiry behavior** — Day-T-7 admin reach-out task automatically generated; on `pilot_active_through < now()`, candidate board re-redacts (free-tier predicate stops returning true); outreach drawer surfaces "pilot expired" status.
5. **Self-serve End-Pilot surface** — provider portal page where Pilot Active providers can voluntarily end the pilot. Sets `pilot_active_through = now()` + emits admin notification + unlocks listing deletion.

## Dependencies

- Phase 5 complete (Pilot Active state wired)
- At least one provider in active pilot for testing
- (For pilot continuation, separate Phase 7 item) TJ product decision on post-pilot pricing

## Estimated work

Sized in master plan §12 as ~2 weeks at 1 dev. Detail-pass per bullet before build.

## References

- Master plan: [`medjobs-master-plan.md`](medjobs-master-plan.md) § 5.7, 5.8, 6.4, 6.5, 6.6, 7.7
- v3 post-launch plan: relevant sub-sections in § P2.A (Next Step post-launch states for "pilot-active-going-dormant" etc.)
