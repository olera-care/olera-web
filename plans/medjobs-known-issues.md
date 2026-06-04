# MedJobs Known Issues / Mid-Build Findings

Created: 2026-06-04
Status: Drain log — bugs and optimizations surfaced during phase builds.

## How to use

- Items found mid-build that don't block phase completion land here
- Each item has an owner + a target resolution (next phase / patch staging / explicit defer)
- Cleared between phases (either fixed before next phase starts, or rolled into next phase's first commit)
- This file is NOT a backlog — items are real bugs/optimizations with a clear owner and resolution path

## Format

```
### YYYY-MM-DD — short title
- Found in: <phase> / <file> / <component>
- Severity: blocker / major / minor / polish
- Owner: Claude / Logan / TJ
- Target resolution: next phase / patch staging / explicit defer (link)
- Notes: ...
```

---

## Open

### 2026-06-04 — Smartlead deep-link URL convention needs live verification
- Found in: Phase 1 Bullet 3 strategy depth pass
- Severity: minor (works under assumption; worst case fallback URL)
- Owner: Logan to verify via Vercel preview QA
- Target resolution: spot-check on Vercel preview before Phase 1 merges to staging
- Notes: Plan assumes `https://app.smartlead.ai/app/master-inbox?lead_id=<lead_id>&campaign_id=<campaign_id>` deep-links to the right thread. Bullet 9 ships with this URL. The link builder gracefully falls back to root master inbox when lead_id is missing. If Smartlead's UI URL convention has changed, update the URL in `smartleadInboxUrl()` in `components/admin/medjobs/cards/StakeholderCard.tsx`.

### 2026-06-04 — Phase 1 Bullet 8 follow-up: full event-stream UI deferred
- Found in: Phase 1 Bullet 8 build
- Severity: deferred enhancement (current state is fully functional)
- Owner: Claude (resume in Phase 1b if needed)
- Target resolution: Phase 1b after Logan QA on current Phase 1
- Notes: The v3 plan's Bullet 8 spec called for a full single-stream event API with per-event row types (sent / opened / clicked / replied / bounced), pinned Needs Reply + Bounced sections, filter chips, and a 50-per-page activity log with URL-persisted filters. The current Phase 1 ship covers: (1) tab rename to "Emails" via Bullet 4, (2) Smartlead inbox deep-link via Bullet 9, (3) engagement chips in the drawer timeline via Bullet 5, (4) existing repliesGroupedList smart-sort prioritizes high-touch states. **Deferred for now:** dedicated Bounced pinned section + activity log filter chips + per-event card component. These would require a new EmailEventCard component and a new email-event-stream lib (~3 days). Logan to evaluate whether the current Phase 1 is sufficient or whether the full event-stream UI is needed.

## Resolved

(none yet)
