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
- Owner: Claude
- Target resolution: verify during Bullet 9 build (the deep-link button)
- Notes: Plan assumes `https://app.smartlead.ai/app/master-inbox?lead_id=<lead_id>&campaign_id=<campaign_id>` deep-links to the right thread. Verify by manually clicking one on Smartlead's UI before committing the URL constant. If Smartlead's UI URL convention has changed, fall back to root master inbox `https://app.smartlead.ai/app/master-inbox` and document in known-issues.

## Resolved

(none yet)
