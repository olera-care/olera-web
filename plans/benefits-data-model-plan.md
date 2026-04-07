# Plan: Benefits Data Model Redesign

Created: 2026-04-06
Status: Not Started

## Goal

Redesign the benefits data model from first principles so it captures the real diversity of senior benefit programs — income tables, asset limits, regional variations, wait times, service catalogs — instead of flattening everything into generic text fields. The pipeline's SURVEY phase uses the program shape to ask the right verification questions.

## Success Criteria

- [ ] Every program has a `shape` that determines what data it carries
- [ ] Income-tested programs have structured household-size tables, not a single number
- [ ] Free services (Ombudsman, Legal, Companion) don't carry fake savings data
- [ ] Regional variations (wait times, providers, county restrictions) are structured, not prose
- [ ] Pipeline SURVEY phase classifies program shape before verification
- [ ] Pipeline VERIFY phase asks shape-specific questions
- [ ] Existing 528 programs continue to work (backward-compatible)
- [ ] Admin dashboard renders shape-specific data
- [ ] Build passes clean

## The Five Program Shapes

| Shape | Examples | What makes it unique |
|-------|----------|---------------------|
| **income_based** | SNAP, MEPD, SCSEP, Medicare Savings | Income tables by household size, asset limits, benefit amounts scale |
| **hcbs_waiver** | STAR+PLUS, Primary Home Care, MI Choice, Respite | Functional assessment, service hours, priority tiers, enrollment caps |
| **service** | SHIP, Legal Aid, Ombudsman, Senior Companion | No income test, no financial benefit, time-bounded, volunteer/advocate delivered |
| **home_improvement** | Weatherization, CEAP repair component | In-kind improvements, regional providers, audit/inspection steps |
| **nutrition** | Meals on Wheels, congregate meals | Decentralized providers, regional wait times, wellness check component |

Note: Some programs span shapes (CEAP has both bill payment = income_based and HVAC repair = home_improvement). Use the primary shape and capture secondary aspects in structured fields.

## Tasks

### Phase 1: Data Model (types + interfaces)

- [ ] 1. Define the new type system in `lib/types/benefits.ts`
      - Files: `lib/types/benefits.ts`
      - Add `ProgramShape` type and shape-specific structured data interfaces
      - Add to `WaiverProgram`: `shape`, `incomeTable`, `assetLimits`, `benefitTable`, `waitlistInfo`, `regionalVariations`, `applicationChannels`, `documentsRequired`, `fundingSource`
      - All new fields optional (backward-compatible with existing 528 programs)
      - Verify: `npx next build` passes, existing pages render unchanged

- [ ] 2. Add corresponding columns to Supabase schema
      - Files: `supabase/migrations/035_sbf_program_shapes.sql`
      - Add `shape TEXT`, `structured_data JSONB` to `sbf_state_programs`
      - JSONB approach: one column holds shape-specific data (income tables, asset limits, etc.) — avoids 20+ nullable columns
      - Verify: Migration runs without error

- [ ] 3. Update seed endpoint to pass shape + structured data
      - Files: `app/api/admin/seed-sbf-programs/route.ts`
      - Infer shape from program data (category + keywords)
      - Pack shape-specific fields into `structured_data` JSONB
      - Verify: Dry-run shows shape distribution

### Phase 2: Pipeline SURVEY Phase

- [ ] 4. Add SURVEY as Phase 0 in the pipeline
      - Files: `scripts/benefits-pipeline.js`
      - Before DISCOVER: classify each existing program's shape
      - For new programs: ask Perplexity to classify shape
      - Output: `programs_surveyed.json` with shape + required fields per program
      - Verify: `node scripts/benefits-pipeline.js --state TX --phase survey --run`

- [ ] 5. Make VERIFY phase shape-aware
      - Files: `scripts/benefits-pipeline.js`
      - Shape-specific prompts:
        - `income_based`: "What are the income limits by household size? What are the asset limits?"
        - `hcbs_waiver`: "What functional assessment is required? What services are covered? How many hours per week?"
        - `service`: "What does this service provide? Is there an income test? How do you access it?"
        - `home_improvement`: "What improvements are included? What is the max value? What is the regional provider structure?"
        - `nutrition`: "How are meals delivered? What is the wait time by region? What additional services?"
      - Compare against existing data — output diffs, not just new data
      - Verify: Michigan run produces shape-specific verified data with diffs

### Phase 3: Ingest Chantel's Rich Data

- [ ] 6. Re-ingest Texas programs with structured data from Chantel's CSV
      - Files: `data/waiver-library.ts`
      - SNAP: add `incomeTable` (8 household sizes), `benefitTable` (monthly amounts)
      - MEPD: add `assetLimits` (countable vs exempt), correct `incomeTable`
      - Weatherization: add `regionalVariations` (5 provider regions with different wait times)
      - Respite Care: add county restrictions, voucher caps
      - PACE: add center locations (El Paso, Amarillo, Lubbock)
      - Meals on Wheels: add regional wait times
      - Verify: Build passes, admin dashboard shows structured data

### Phase 4: Admin Dashboard + Page Rendering

- [ ] 7. Update admin dashboard to render shape-specific data
      - Files: `app/admin/benefits/page.tsx`
      - Income tables render as actual tables
      - Regional variations show as expandable sections
      - Asset limits display structured rules
      - Verify: Visual check at `/admin/benefits` → TX programs show rich data

- [ ] 8. Update waiver library pages to render structured data
      - Files: `app/waiver-library/[state]/[benefit]/page.tsx`
      - If program has `incomeTable`, render as a real table (not "Income below $X")
      - If program has `regionalVariations`, render provider map/list
      - If program has `assetLimits`, render countable vs exempt
      - Verify: Visit a TX program page, see structured data rendered

## Risks

- **Breaking existing pages**: All new fields are optional. Existing programs render exactly as before until enriched. No risk.
- **JSONB vs flat columns**: Using JSONB for shape-specific data avoids schema sprawl but means Supabase can't index individual fields. Acceptable — we query by state_code, not by income_limit.
- **528 programs need shape classification**: Can be done in bulk by the pipeline's SURVEY phase. Start with Texas (15 programs), then batch the rest.
- **Chantel's CSV has richer data than what the pipeline can auto-discover**: The pipeline does the first pass; Chantel enriches with details the pipeline can't find (regional office addresses, specific form requirements). The structured data model gives her findings a place to live.

## Notes

- This redesign is backward-compatible. Phase 1 adds optional fields. Existing programs keep working. New data is additive.
- The `shape` field drives the pipeline's behavior — it determines what questions to ask during verification and what data to collect.
- The JSONB approach for Supabase (`structured_data` column) is the same pattern used for `google_reviews_data` on providers — proven at scale.
- Chantel's Texas CSV is the gold standard. The data model should be able to represent everything in that CSV without loss.
