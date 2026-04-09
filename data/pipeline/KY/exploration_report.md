# Kentucky Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.025 (5 calls, 18s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 3 |
| Programs deep-dived | 2 |
| New (not in our data) | 2 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 2 programs

## New Programs (Not in Our Data)

- **Senior CommUnity Care of Kentucky (PACE)** — service ([source](https://chfs.ky.gov/agencies/dail/Pages/pace.aspx[4]))
  - Shape notes: County-restricted to provider service areas (not statewide); no direct income/asset test for enrollment (Medicaid separate); requires state nursing home certification; multiple regional PACE providers in KY with own contacts
- **Senior CommUnity Care of Northern Kentucky (PACE)** — service ([source](https://www.seniorcommunitycarenky.org[1][3]))
  - Shape notes: Restricted to Northern Kentucky service area with one main center; no fixed income/asset dollar tables (tied to Medicaid); comprehensive in-kind services via interdisciplinary team, no tiers or hours specified

## Program Details

### Senior CommUnity Care of Kentucky (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment; eligibility not based on financial criteria. Medicaid eligibility (which covers part of premium) depends on separate KY Medicaid income/asset limits, which PACE staff can assess[1][3][5][6].
- Assets: No asset limits for PACE enrollment itself. Medicaid portion requires meeting KY Medicaid asset rules (e.g., typically $2,000 for individual), assessed by PACE staff[6][7].
- Live in the Senior CommUnity Care of Kentucky service area
- Certified by Kentucky as meeting nursing home level of care (per 907 KAR 1:022 or 907 KAR 3:250)
- Able to live safely in the community at time of enrollment with PACE services
- Have Medicare, Medicaid, or ability to privately pay monthly premium

**Benefits:** All-inclusive: primary/specialty medical care, prescription medications, adult day services, home care, mental health/social services, skilled therapies, nursing home care, hospital care; coordinated by interdisciplinary team; covers all preventive, primary, acute, long-term needs[1][6][7].

**How to apply:**
- Phone: (502) 314-2059 (Enrollment Team)[6]
- In-person: Visit PACE Center (locations in Services section of seniorcommunitycareky.org)[1][6]
- Contact for intake, clinical assessment at center, custom care plan development, enrollment paperwork completed by team[1]

**Timeline:** Not specified; involves intake, clinical assessment, care plan review, paperwork[1].

**Watch out for:**
- Must live in specific PACE provider's service area; not statewide—confirm counties with provider[1][2][6]
- Nursing home level of care certification required by KY (not automatic; assessed)[1][3][4]
- Private pay option if no Medicaid (covers Medicaid's premium share; costs vary)[3][6]
- Cannot be in Medicare Advantage, hospice, or certain other programs[5]
- Voluntary; can dis-enroll anytime via social worker[1]

**Data shape:** County-restricted to provider service areas (not statewide); no direct income/asset test for enrollment (Medicaid separate); requires state nursing home certification; multiple regional PACE providers in KY with own contacts

**Source:** https://chfs.ky.gov/agencies/dail/Pages/pace.aspx[4]

---

### Senior CommUnity Care of Northern Kentucky (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific dollar amounts or household size table provided; eligibility tied to Medicaid income limits. If eligible for Medicaid, services are free; if over limits, pay premium or Patient Monthly Liability. PACE staff assist with Medicaid determination.[1][3]
- Assets: Tied to Medicaid asset limits (specific amounts not detailed); PACE staff help determine eligibility.[3][4]
- Live in the Senior CommUnity Care of Northern Kentucky service area (Northern Kentucky region)
- Meet nursing home level of care (as defined in 907 KAR 1:022)
- Be able to live safely in the community with program services[1][2][3]

**Benefits:** Primary and specialty medical care, prescription medications, adult day services, home care services, mental health and social services, skilled therapies, nursing home care, hospital care, rehabilitation, transportation, day center, social activities, meal assistance—all coordinated by interdisciplinary team with custom care plan. No specific dollar amounts or hours stated.[3][4][7]

**How to apply:**
- Phone: (859) 970-2450 (PACE Enrollment Team)[1][3][7]
- In-person: Visit PACE Center at 47 Cavalier Blvd, Ste 140, Florence, KY 41042[3][8]
- Email: nkyenrollment@voa.org[8]

**Timeline:** Not specified; process includes intake, clinical assessment at center, custom care plan development, enrollment paperwork[1]

**Watch out for:**
- Must follow custom care plan; liable for unauthorized/out-of-program services (except emergencies)[1]
- Enrollment voluntary; can dis-enroll anytime via social worker[1]
- Paid by Medicare/Medicaid or private premium if over Medicaid limits—staff handles claims but confirm personal liability[1][3]
- Service area restricted to Northern Kentucky; not statewide[1][6]
- Requires nursing home level of care certification but ability to live safely in community with services[2][3]

**Data shape:** Restricted to Northern Kentucky service area with one main center; no fixed income/asset dollar tables (tied to Medicaid); comprehensive in-kind services via interdisciplinary team, no tiers or hours specified

**Source:** https://www.seniorcommunitycarenky.org[1][3]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Senior CommUnity Care of Kentucky (PACE) | benefit | local | deep |
| Senior CommUnity Care of Northern Kentuc | benefit | local | deep |

**Types:** {"benefit":2}
**Scopes:** {"local":2}
**Complexity:** {"deep":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/KY/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Senior CommUnity Care of Kentucky (PACE)**: County-restricted to provider service areas (not statewide); no direct income/asset test for enrollment (Medicaid separate); requires state nursing home certification; multiple regional PACE providers in KY with own contacts
- **Senior CommUnity Care of Northern Kentucky (PACE)**: Restricted to Northern Kentucky service area with one main center; no fixed income/asset dollar tables (tied to Medicaid); comprehensive in-kind services via interdisciplinary team, no tiers or hours specified

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Kentucky?
