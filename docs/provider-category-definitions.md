# Provider Category Definitions

> **Status:** Definitions confirmed by TJ 2026-04-26. Open for further refinement; ready to consume downstream.
> **Purpose:** Define the substantive boundaries of each Olera provider category so that entity verification (AI prompt + manual review by Grace), audit scripts, future provider onboarding flows, and cleanup tooling all apply the same rules.

This doc is the **single source of truth** for what each of Olera's 6 categories means. Until now no written definition has existed — six different category mappings live in the codebase (`CATEGORY_CONFIGS`, `SUPABASE_CAT_TO_PROFILE_CATEGORY`, etc.) but they only handle slug/label translation, not substantive boundaries. As a result, every entity-verification call (Perplexity prompt, Grace's manual review, future contributor reviewing data) has been silently reinventing the rules. This doc fixes that.

---

## Olera matches care seekers to providers in 6 categories

**2 home / in-home:**
1. Home Care (Non-medical)
2. Home Health Care

**4 residential / live-in:**
3. Assisted Living
4. Independent Living
5. Memory Care
6. Nursing Home

**Anything outside these 6 is out of scope** — even if the provider is real, operating, and senior-related. The category boundaries are defined by **what the primary service is**, not by what the business calls itself, and not by whether seniors happen to use it.

---

## 1. Home Care (Non-medical)

**Definition:** In-home, non-clinical assistance for older adults, delivered by trained caregivers who help with activities of daily living (ADLs) and instrumental activities of daily living (IADLs). The caregiver is NOT a licensed clinician practicing within their licensed scope on the visit.

**Primary services:** Bathing assistance, dressing, grooming, toileting, feeding, mobility assistance, medication reminders (NOT administration), light housekeeping, meal preparation, companionship, transportation, respite for family caregivers.

**Setting:** Client's private home or apartment.

**Typical payer:** Private pay, long-term care (LTC) insurance, some state Medicaid HCBS waivers (varies state-to-state). NOT Medicare.

**Provider type:** Licensed home care agency (where state requires licensure), franchised brands (Visiting Angels, Home Instead, Comfort Keepers, Right at Home), independent local agencies.

**INCLUDE — examples:**
- Companion care / personal care agencies
- Senior helpers / caregiver placement agencies that employ + manage caregivers
- Respite care services for family caregivers of seniors
- Live-in / 24-hour in-home caregiver agencies
- Combined home-care + home-health agencies (per TJ: keep)

**EXCLUDE — examples:**
- Medicare-certified Home Health Care (separate category, see #2)
- Hospice agencies (end-of-life palliative service, out of scope)
- Pediatric home care (children, not seniors)
- Independent caregivers acting as direct employees of one family without an agency (no business entity to list)
- Domestic workers / housekeepers without senior-care framing
- Geriatric care managers (service intermediary, not direct care delivery)
- Senior placement agencies (broker-style — they refer, don't deliver)

**Edge cases:**
- **Combined HC + HHC agencies** → INCLUDE under whichever is the primary line; if both equal, prefer Home Health Care (skilled is more specific).
- **HC agencies that also accept pediatric clients** → INCLUDE if seniors are a meaningful portion of their book.
- **State-specific licensure variations** (e.g., "Personal Care Agency" in some states): include if the substantive service matches.

---

## 2. Home Health Care

**Definition:** Medicare-certified, physician-ordered, intermittent skilled clinical care delivered in the patient's home, primarily for post-acute recovery or chronic condition management. The defining feature is that licensed clinicians (RN, LPN, PT, OT, SLP, MSW) provide care under a physician's plan of care.

**Primary services:** Skilled nursing visits, wound care, IV therapy, physical/occupational/speech therapy, medical social work, home health aide services (under nurse oversight).

**Setting:** Patient's private home.

**Typical payer:** Medicare Part A (most common), some Medicaid, some private health insurance. Per-episode billing under the Patient-Driven Groupings Model (PDGM).

**Provider type:** Medicare-certified Home Health Agency (HHA) — has a CMS Provider Number (CCN). Some are hospital-based; most are freestanding.

**INCLUDE — examples:**
- Medicare-certified HHAs
- Visiting Nurse Associations (VNAs) that provide home health (most do)
- Hospital-affiliated home health programs (e.g., "Mayo Clinic Home Health")
- Combined home-health + hospice agencies (per TJ: keep — they offer the home-health service)
- Combined HHC + HC (non-medical) agencies — keep; the HHC line qualifies them

**EXCLUDE — examples:**
- Pure hospice agencies (separate Medicare benefit, end-of-life)
- Home palliative care agencies that do NOT also provide home health
- Private duty nursing (long-term shifts, not Medicare-certified intermittent)
- DME (durable medical equipment) suppliers — Apria, Lincare, oxygen vendors
- Infusion-only services
- Telehealth-only providers
- Geriatric primary care house-call practices (clinical visits but not Medicare HHA-certified)
- Pediatric home health agencies
- Hospitals' "home care program" if that program is just discharge planning, not actual home health delivery

**Edge cases:**
- **Combined HHC + Hospice** → INCLUDE (per TJ). Description should emphasize the home-health line.
- **Visiting nurse associations** → INCLUDE if they hold Medicare HHA certification. Some historical VNAs have stopped doing home health; verify.
- **Hospital-based home health** → INCLUDE if it's a distinct Medicare-certified entity.
- **Private duty nursing** → EXCLUDE — different service model.

---

## 3. Assisted Living

**Definition:** A residential community where seniors live in their own apartment or suite and receive 24/7 staff support with activities of daily living, communal dining, organized activities, and oversight. State-licensed (under varying state titles: Assisted Living Facility, Residential Care Facility for the Elderly, Personal Care Home, etc.).

**Primary service:** Long-term residential care with ADL support, medication management, dining, housekeeping, transportation, and structured social/wellness programming.

**Setting:** Standalone residential community OR a level within a Continuing Care Retirement Community (CCRC).

**Typical payer:** Private pay (most common), LTC insurance, some state Medicaid waivers (varies — e.g., NJ, FL, OR have AL waivers; many states do not).

**Provider type:** State-licensed assisted living facility / RCFE / personal care home.

**INCLUDE — examples:**
- Standalone assisted living communities
- AL-with-MC-wing (list each separately if MC is a distinct level)
- AL within a CCRC campus (list separately if there's a distinct AL building)
- Combined AL + Adult Day program (per TJ: keep, the AL line qualifies)

**EXCLUDE — examples:**
- Independent Living without ADL support (see #4)
- Skilled nursing facilities (higher acuity — see #6)
- Memory care facilities / units (separate category — see #5)
- Generic apartments without care services
- Boarding houses (not state-licensed for senior care)
- Group homes for non-senior populations (developmental disability, behavioral health)

**Edge cases:**
- **Adult Family Homes (AFH)** — state-specific category in WA, OR, ID. Small (typically 4-6 beds), residential, ADL support. Substantively similar to AL but separately licensed. **INCLUDE under Assisted Living.** Provider name should retain "Adult Family Home" so users see the model. *Confirmed 2026-04-26.*
- **Personal Care Homes (PA terminology) and Residential Care Facilities for the Elderly (CA terminology)** → INCLUDE as Assisted Living.
- **CCRC AL component** → INCLUDE as a separate AL listing if it's a distinct building/level.
- **State-licensed AL but the facility primarily serves people <60** (e.g., disability AL) → EXCLUDE — not senior care.

---

## 4. Independent Living

**Definition:** A senior-restricted residential community (typically 55+ or 62+) where residents live in private apartments, cottages, or villas WITHOUT required daily care services. The community provides lifestyle amenities, social programming, dining (often included or à la carte), housekeeping, and transportation, with NO staff-provided ADL support.

**Primary service:** Senior-only residential lifestyle with optional services. Residents are generally autonomous.

**Setting:** Senior living community / retirement community / "active adult" community.

**Typical payer:** Private pay (rent / monthly service fee). Some communities accept long-term care insurance for optional services. Some HUD Section 202 senior housing programs include light services.

**Provider type:** Senior living operator, retirement community, lifestyle community.

**INCLUDE — examples:**
- Standalone senior independent living communities
- Active adult communities WITH meaningful service amenities (dining, transportation, programming)
- IL within a CCRC campus
- Senior cohousing communities
- HUD Section 202 senior housing if it offers any services

**EXCLUDE — examples:**
- 55+ apartments with NO services (just age-restricted housing — not a care product)
- Regular market-rate apartments without senior focus
- Assisted Living (which has required ADL support — see #3)
- Senior boarding houses (not service-oriented)
- Vacation/seasonal "senior resorts"
- Mobile home / RV parks for seniors

**Edge cases:**
- **Active adult community** (e.g., Del Webb, K. Hovnanian-style) — INCLUDE only if there are meaningful on-site services beyond the homeowner's association. Just having an HOA pool doesn't qualify; on-site dining, programming, or transportation does.
- **Section 202 / Section 8 senior apartments** — INCLUDE if any services. EXCLUDE if it's purely income-restricted senior housing without services. *Likely judgment call per listing.*
- **Senior co-op / condo with shared services** — INCLUDE if shared services exist.
- **CCRC IL component** → INCLUDE separately.

---

## 5. Memory Care

**Definition:** A secured residential community specialized in caring for residents with Alzheimer's disease, dementia, or other cognitive impairments. Distinguishing features: secured environment to prevent wandering, staff trained in dementia care, programmed cognitive engagement and reminiscence therapy, dementia-specific environmental design (color contrast, wayfinding cues).

**Primary service:** 24/7 specialized residential care for cognitive impairment. ADL support is included; residents typically have moderate-to-severe dementia.

**Setting:** Standalone memory care community OR a secured wing within an Assisted Living facility OR a memory care unit within a Skilled Nursing Facility.

**Typical payer:** Private pay (most common), some LTC insurance, occasional state Medicaid waivers, very rarely Medicaid (depending on state and acuity).

**Provider type:** Standalone memory care community, AL with MC license, or SNF with secured dementia unit.

**INCLUDE — examples:**
- Standalone memory care communities
- Memory care wings within AL (list separately as a distinct provider IF the wing is operated as a distinct level of care with its own admission criteria)
- Memory care units within SNFs (similar — list separately if distinct)
- Hospice partnerships INSIDE a memory care facility (the MC facility qualifies)

**EXCLUDE — examples:**
- Adult day programs that focus on dementia (out of scope — day, not residential)
- Dementia therapy clinics / neuropsychology practices
- General Assisted Living without a specific MC license/wing
- "Memory support" wellness programs for cognitively healthy seniors

**Edge cases:**
- **AL facility that markets "memory care services"** without a dedicated MC license/wing → EXCLUDE from MC category, INCLUDE under AL only.
- **Cognitive therapy / neuropsychology practice** — EXCLUDE entirely.
- **Adult Day Care for dementia** — EXCLUDE (it's a day program, not residential).

---

## 6. Nursing Home

**Definition:** A 24/7 skilled nursing facility (SNF) where residents receive ongoing medical care from licensed nurses (RN/LPN) and other clinicians under a physician's plan of care. Includes both long-term residents and short-stay post-acute rehabilitation patients. Federally regulated and CMS-rated (5-star quality rating).

**Primary service:** 24/7 skilled nursing care, medication administration, rehabilitation services (PT/OT/SLP), medical oversight.

**Setting:** State-licensed nursing facility / skilled nursing facility (SNF).

**Typical payer:** Medicare (post-acute / short-stay rehab), Medicaid (long-term residents — Medicaid covers ~62% of nursing home days nationally), private pay, LTC insurance.

**Provider type:** State-licensed SNF; has a CMS Provider Number (CCN).

**INCLUDE — examples:**
- Standalone skilled nursing facilities
- Hospital-based SNF units
- Convalescent homes (older terminology, especially in California — usually SNFs)
- "Nursing and Rehabilitation Center" — INCLUDE (it's an SNF that includes a rehab unit, not a separate IRF)
- SNF within a CCRC
- Memory care unit within an SNF (list separately as MC if distinct)

**EXCLUDE — examples:**
- **Inpatient Rehabilitation Hospitals (IRFs)** — distinct license, separate Medicare benefit, intensive 3 hours/day rehab requirement. Examples: Encompass Health Rehabilitation Hospital. **EXCLUDE — these are not SNFs.**
- **Long-Term Acute Care Hospitals (LTACHs)** — distinct license, hospital-level care for medically complex patients with extended stays.
- **Hospitals** of any kind (acute care, specialty, behavioral health)
- **Hospice facilities** (inpatient hospice)
- **Assisted Living** (lower acuity — see #3)
- **Adult Day Care** even if labeled "skilled" or "health"

**Edge cases:**
- **"Rehabilitation" in the name** — INCLUDE if it's "Nursing and Rehabilitation Center" (SNF model). EXCLUDE if it's "Rehabilitation Hospital" (IRF model). The distinction is the licensure, not the name.
- **VA Community Living Centers** — INCLUDE (VA SNFs).
- **State-operated psychiatric facilities for elderly** — usually EXCLUDE (different service model).

---

## Cross-cutting exclusions (the open NO universe)

Anything that doesn't match one of the 6 above, regardless of how senior-related it is. Examples that we've seen slip in:

| Out-of-scope type | Why it's out |
|---|---|
| Hospice (pure) | End-of-life palliative service, distinct billing/regulation |
| Home palliative care (non-hospice) | Symptom management service, not skilled home health |
| Adult day care / adult day health | Daytime non-residential — different service model |
| PACE programs | Federally-defined integrated care, distinct service model |
| Geriatric primary care clinics / house call practices | Clinical service, not residential or HHC |
| Inpatient rehab hospitals (IRFs) | Distinct from SNFs |
| Long-term acute care hospitals (LTACHs) | Hospital, not nursing home |
| Senior placement agencies (A Place for Mom-style) | Broker, not direct care |
| Care management / aging life care professionals | Service intermediary |
| Senior move managers | Relocation service |
| Elder law firms / estate planning | Professional services |
| LTC insurance brokers | Insurance, not care |
| Reverse mortgage lenders | Financial services |
| Aging-in-place contractors | Construction / accessibility modifications |
| Medical equipment / DME suppliers | Equipment, not care delivery |
| Pharmacy chains | Pharmacy, not care |
| Senior transportation | Transportation, not care |
| Senior meal delivery (Meals on Wheels) | Meal service, not care |
| Senior fitness programs (SilverSneakers) | Wellness, not care |
| Senior centers / community programs | Social/recreational, not care |
| Funeral homes / mortuaries | End-of-life logistics, not care |
| Cemeteries / memorial parks | Same |
| Adult Family Homes for non-senior populations | Same model, different population |
| Wedding venues with senior-related names | False match on name |
| Hotels / resorts with "Lodge" / "Inn" naming | Often confused with senior living |
| Restaurants / cafes / retail | Obvious mismatch |
| Hospitals / urgent cares / clinics | Acute / primary medical care, not senior care |
| Pediatric daycare / childcare | Wrong age population |
| Government offices (Office on Aging, etc.) | Public services, not direct care |
| Religious services / churches | Even faith-based senior living is fine; pure church isn't |

This list is illustrative, not exhaustive. The rule is: **if the primary business doesn't match one of the 6 with crisp definitions above, it's out — regardless of how senior-related it is.**

---

## Country / geography

Olera's product is **United States only**. Providers must operate within US borders.

**EXCLUDE — examples found in the wild:**
- Mexican senior care facilities (`Asilo Para Adultos Mayores Pan de Vida A.C.`, `Casa Sacerdotal San José`, `Estancia Geriátrica La Edad Oro`) — these slipped in via Google Places returning border-region results
- Canadian / Caribbean / international facilities

**Detection:** Discovery's geo validation should check both state bounding box AND country (Google Places API returns `addressComponents` with country code). Flag any provider whose `place_id` resolves to a non-US country code.

---

## Combined-service providers (per TJ: keep)

A provider that legitimately offers multiple services where AT LEAST ONE is in our 6 should be kept. Examples:

- "South Davis Home Health & Hospice" → KEEP (home health is in #2; hospice is bonus, doesn't disqualify)
- "Sunrise of [City] Assisted Living and Memory Care" → KEEP (both are in our 6)
- "Greenleaf Adult Family Home and Day Program" → KEEP if AFH alone qualifies as AL (per the AFH edge case above)

**Listing strategy:** Categorize under the IN-SCOPE service that's primary. If both are in-scope, pick the more specific one. Provider description and search results can reflect the full service mix.

---

## Continuing Care Retirement Communities (CCRCs)

**Definition:** A single campus or community that offers multiple levels of care — typically Independent Living + Assisted Living + Memory Care + Skilled Nursing — with residents able to move between levels as their needs change.

**Position:** List each substantive level as a separate provider entry (one for IL, one for AL, etc.) if the levels are operated as distinct care environments with distinct admission criteria. Don't try to make CCRCs a 7th category — the levels themselves still match our 6. *Confirmed 2026-04-26.*

---

## Application — how this doc gets used

**1. Entity verification prompt (`scripts/pipeline-batch.js:1191`)**
Replace the current prompt with the inverted form:
```
Mark is_senior_care = TRUE only if the PRIMARY BUSINESS matches one of these EXACTLY:
1. Home Care (Non-medical) — [definition]
2. Home Health Care — [definition]
3. Assisted Living — [definition]
4. Independent Living — [definition]
5. Memory Care — [definition]
6. Nursing Home — [definition]

Mark FALSE for ANYTHING ELSE — even if senior-related (hospice, adult day care,
PACE, rehab hospitals, geriatric clinics, care management, placement agencies,
elder law, DME, senior centers, funeral services, etc.).

Also mark FALSE if the business is outside the United States.
```

**2. Audit / cleanup script**
Use this doc's exclusion list as the basis for the audit's name-pattern heuristics, plus a country-code check on `place_id`.

**3. Grace's manual review**
She should reference the same definitions when deciding to soft-delete or keep.

**4. Future provider onboarding (claim flow)**
The category dropdown should match the 6 (currently allows 13, including off-scope types — this is an architectural cleanup separate from this doc).

---

## Confirmed decisions (2026-04-26)

1. **Adult Family Homes (WA/OR/ID)** — INCLUDE under Assisted Living. Retain "Adult Family Home" in name.
2. **CCRCs** — List each substantive care level as a separate provider entry. No 7th category.
3. **Pure hospice agencies (no home health line)** — OUT. Combined HHC + Hospice agencies are IN.
4. **HUD Section 202 senior housing without services** — EXCLUDE. (IL requires a service component.)
5. **13-type ProfileCategory backend enum** — Position (Claude's judgment, exercised at TJ's request):
   - **Converge user-facing surfaces to 6.** Provider claim UI should restrict to the 6 canonical categories. Frontend already enforces 6 (router 404s on off-scope slugs); claim UI should match.
   - **Don't touch the backend enum yet.** The 7 off-scope ProfileCategory types (`hospice_agency`, `inpatient_hospice`, `rehab_facility`, `adult_day_care`, `wellness_center`, `private_caregiver`, `palliative_care` if present) exist in the type union but no production code path makes them surface to users. Removing them risks subtle breakage; the cost of leaving them is just dead code, not user-facing harm.
   - **Don't treat them as a future-vertical strategy.** No evidence in the codebase that Olera plans hospice or adult day care as upcoming product lines. If those verticals get added later, defining them fresh from current product requirements is cleaner than maintaining latent dead types in the meantime.
   - **Action items (deferred — separate workstream from this cleanup):**
     - Tighten `EditOverviewModal.tsx` and any other claim-side UI to restrict the category dropdown to the 6
     - Add a build-time assertion that the canonical-6 list in `lib/power-pages.ts` is the only set of slugs the router accepts (already true, but worth a test)
     - Future cleanup ticket: deprecate the 7 off-scope ProfileCategory types from `lib/types.ts` once we've confirmed no orphan claimed-provider records depend on them

---

## Appendix: Industry references

For substantive boundary lines I drew on (no formal citations in this draft):
- CMS provider categorization (CCN types: 01 Home Health, 12 Inpatient Hospital, 22 Skilled Nursing, 28 Hospice, etc.)
- Genworth Cost of Care Survey categories (the standard senior-care taxonomy)
- AHCA / NCAL definitions (Assisted Living, Memory Care)
- Argentum Executive Roundtable definitions for senior living
- State licensure variations (WA Adult Family Home, CA RCFE, PA Personal Care Home — researched but not exhaustively)

If the industry would generally agree on a boundary, this doc reflects that. Where it doesn't, the doc takes a position and flags it for TJ review.
