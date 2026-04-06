# Senior Benefits Pipeline — System Plan

> How we discover, verify, publish, and maintain benefits data at scale.
> Reference doc for the Apr 7 meeting with Chantel + Logan.

---

## The Problem

We have 528 benefit programs across 50 states. None had source citations. None had verification dates. Savings estimates were category-based guesses ("every PACE program gets $15K–$35K/yr"). Google classifies this as YMYL (Your Money or Your Life) — inaccurate eligibility info can suppress the entire domain.

We need a system where:
- Every claim has a source URL
- Every number has been checked against an official .gov source
- New states can be expanded with a single command
- Quality is gated — nothing goes live unverified

---

## What's Already Built (Foundation)

| Component | Status | What it does |
|-----------|--------|-------------|
| **Verification metadata** | ✅ Done | Every program can now carry `sourceUrl`, `lastVerifiedDate`, `verifiedBy`, `savingsSource`, `savingsVerified` |
| **Chantel's Texas audit** | ✅ Ingested | 12 TX programs verified — corrected income limits, savings ranges, source URLs |
| **Admin dashboard** | ✅ Built | `/admin/benefits` — state grid with verification progress → program detail → content preview → deep link to live page |
| **SQL migration** | ✅ Run | New columns on `sbf_state_programs` and `sbf_federal_programs` |
| **Seed endpoint** | ✅ Updated | Passes verification metadata through; dry_run shows verification coverage stats |
| **Page auto-generation** | ✅ Existing | `generateStaticParams` reads from `waiver-library.ts` — adding programs = pages appear on next deploy |

---

## What's Left to Build

### 1. Benefits Pipeline Script (`scripts/benefits-pipeline.js`)

The core engine. Five phases, modeled on the city pipeline:

```
benefits-pipeline.js --state MI [--phase discover|verify|generate|qa|finalize]
```

#### Phase 1: DISCOVER
**Input:** State code (e.g., `MI`)
**What it does:**
- Query Perplexity for all senior benefit programs in the state
- Search terms: Medicaid waivers, HCBS programs, PACE, SNAP, LIHEAP, state-unique programs, Area Agency on Aging programs
- Cross-reference with existing `waiver-library.ts` entries for that state
- Flag new programs not yet in our data, flag programs in our data not found by discovery (possibly defunct)

**Output:** `data/pipeline/{state}/programs_discovered.json`

#### Phase 2: VERIFY
**Input:** Discovered programs
**What it does:**
- For each program, query Perplexity/web against official `.gov` sources:
  - Income limits → actual numbers from state Medicaid/HHS site
  - Age requirements → from program eligibility rules
  - Savings → from benefit schedule (or flagged "unverifiable — use category estimate")
  - Phone numbers → validated against official contact pages
  - Application URLs → HTTP HEAD check (200 OK? correct destination?)
  - Program website → validate it loads
- Each program gets: `sourceUrl`, `lastVerifiedDate`, `verifiedBy: "pipeline"`, `issuesFound`

**Output:** `data/pipeline/{state}/programs_verified.json`

**Chantel's role here:** The pipeline does the first pass. Chantel reviews the output for programs where the pipeline flags uncertainty (e.g., "income limit found on page but format unclear"). She doesn't have to verify from scratch — she spot-checks the pipeline's work.

#### Phase 3: GENERATE
**Input:** Verified programs
**What it does:**
- Generate/update TypeScript entries in `waiver-library.ts` for the state
- Format: same structure as existing programs (name, shortName, tagline, description, eligibility, applicationSteps, forms, FAQs, serviceAreas)
- For new programs: generate FAQs via Perplexity (3 per program — "Who is eligible?", "How do I apply?", "How is this different from X?")
- For existing programs: update only fields where verification found different data
- Seed to Supabase `sbf_state_programs` via the admin endpoint

**Output:** Updated `waiver-library.ts` + seeded DB rows

#### Phase 4: QA GATE
**Input:** All programs for the state
**What it does:**
- Automated quality checks — every program must pass:
  - [ ] Has a `sourceUrl` (official .gov link)
  - [ ] `sourceUrl` returns HTTP 200
  - [ ] Has `lastVerifiedDate` within the last 90 days
  - [ ] Phone number is valid format (if present)
  - [ ] Application URL returns HTTP 200 (if present)
  - [ ] Savings estimate either has `savingsVerified: true` OR `savingsRange` is empty
  - [ ] Description is > 50 characters
  - [ ] At least 1 eligibility highlight
  - [ ] At least 2 application steps
- Produces a pass/fail report per program and an overall state readiness score

**Output:** QA report — state either passes (all programs green) or fails with specific issues listed

**Gate rule:** State does NOT go live on main until QA score = 100%. Can go to staging for preview.

#### Phase 5: FINALIZE
**Input:** QA-passed state
**What it does:**
- Print summary table (programs, verified count, QA score)
- Optionally update Notion tracking (if we set up a benefits tracking database)
- Log the run to `data/pipeline/{state}/run_log.json`

---

### 2. Deploy + Seed Current Work

Before the pipeline script, we need to ship what's already built:

1. PR `noble-pare` → staging
2. Vercel deploys staging
3. Hit `/api/admin/seed-sbf-programs?state=TX&confirm=true` to seed TX with verification data
4. Visit `/admin/benefits` on staging → verify the dashboard works
5. Click through to live TX program pages → verify data renders correctly

---

### 3. First Pipeline Run: Michigan

Michigan is the next target (per Notion strategy doc — already has 359 impressions at position 19.7 for "medicare savings program michigan"). Michigan currently has 9 programs in `waiver-library.ts`, all unverified.

```
node scripts/benefits-pipeline.js --state MI
```

Expected outcome:
- Discovery finds additional MI programs not in our data
- Verification checks all 9+ programs against michigan.gov sources
- Generate updates the waiver-library entries with verified data
- QA gate produces a report
- Chantel reviews the QA output, spot-checks 3-4 programs
- TJ reviews at `/admin/benefits` → clicks Michigan → sees verified programs
- PR to staging → preview → merge to main → live

---

## Workflow: Who Does What

### Expanding to a New State

```
┌─────────────────────────────────────────────────────┐
│  1. CLAUDE runs pipeline: discover + verify          │
│     → Produces verified data + QA report             │
├─────────────────────────────────────────────────────┤
│  2. CHANTEL reviews QA report                        │
│     → Spot-checks 3-5 programs against .gov sources  │
│     → Flags any issues back to Claude                │
├─────────────────────────────────────────────────────┤
│  3. CLAUDE fixes flagged issues, re-runs QA          │
│     → QA passes → generates pages + seeds DB         │
├─────────────────────────────────────────────────────┤
│  4. TJ reviews at /admin/benefits                    │
│     → Clicks through live pages on staging preview   │
│     → Merges PR → pages go live                      │
└─────────────────────────────────────────────────────┘
```

### Ongoing Maintenance (Monthly)

```
┌─────────────────────────────────────────────────────┐
│  1. CLAUDE runs verify phase on all live states      │
│     → Checks if income limits changed (annual FPL)   │
│     → Checks if URLs still resolve                   │
│     → Checks if phone numbers still work             │
├─────────────────────────────────────────────────────┤
│  2. QA report surfaces changes                       │
│     → "TX SNAP income limit changed: $2,152 → $X"   │
│     → "MI PACE application URL returns 404"          │
├─────────────────────────────────────────────────────┤
│  3. CLAUDE updates data + re-seeds                   │
│  4. TJ reviews at /admin/benefits                    │
└─────────────────────────────────────────────────────┘
```

---

## Expansion Roadmap

| Priority | State | Why | Programs | Status |
|----------|-------|-----|----------|--------|
| 1 | **Texas** | Highest traffic, Chantel audited | 15 | 12/15 verified |
| 2 | **Michigan** | 359 GSC impressions, Chantel has data | 9+ | Unverified |
| 3 | **Florida** | Largest senior population | ~12 | Unverified |
| 4 | **California** | Largest state, complex programs | ~15 | Unverified |
| 5+ | Remaining 46 | Prioritize by GSC impressions | ~10 each | Unverified |

**Pace:** ~1 state per week once the pipeline is built. Discovery + verify is automated. Chantel spot-checks. TJ reviews and merges.

---

## Cost Estimate per State

Based on city pipeline costs (Perplexity at ~$0.005/call):

| Phase | API calls | Est. cost |
|-------|-----------|-----------|
| Discover | 5-10 Perplexity queries | ~$0.05 |
| Verify | 1 per program (10-15 programs) | ~$0.07 |
| Generate FAQs | 1 per new program | ~$0.05 |
| URL checks | HTTP HEAD, free | $0 |
| **Total per state** | | **~$0.17** |

Negligible. The bottleneck is review time, not API costs.

---

## Files & Architecture

```
scripts/
  benefits-pipeline.js          ← The pipeline engine (to build)

data/
  waiver-library.ts             ← Source of truth (528+ programs)
  pipeline/                     ← Pipeline working directory
    TX/
      programs_discovered.json
      programs_verified.json
      qa_report.json
      run_log.json
    MI/
      ...

app/
  admin/benefits/page.tsx       ← Admin dashboard (built)
  waiver-library/[state]/       ← Auto-generated state pages
  waiver-library/[state]/[benefit]/ ← Auto-generated program pages

supabase/migrations/
  034_sbf_verification_metadata.sql ← DB columns (run)

lib/types/benefits.ts           ← BenefitProgram with verification fields
```

---

## Meeting Talking Points (Apr 7)

1. **Texas is the proof of concept.** Chantel's audit is already in the system. 12/15 programs verified with real source URLs. We can show the admin dashboard.

2. **The pipeline makes this repeatable.** "Expand to Michigan" becomes a single command. Discovery, verification, page generation, and quality gating — all automated with human spot-checks.

3. **Quality gate is non-negotiable.** No state goes live without 100% verification. Every income limit, every savings estimate, every URL — sourced and checked. This protects the domain from YMYL suppression.

4. **Chantel's role evolves.** From "verify every field manually" to "spot-check the pipeline's work." She reviews the QA report, checks 3-5 programs per state, and flags issues. The pipeline does the heavy lifting.

5. **Pace: ~1 state per week.** Michigan is next (already has GSC impressions). Then Florida, California. 50 states verified by end of Q2 if we maintain pace.

6. **The admin dashboard is the review interface.** TJ and Chantel can see verification status, preview content, and click through to live pages — all without touching code.
