-- War Room company model: replace the generic starter text with Olera's real
-- operating context, 2026-09-20.
--
-- WHY THIS MATTERS. discovery.server.ts loads this row at scan time and falls
-- back to DEFAULT_COMPANY_MODEL only on error. The row has been a byte-for-byte
-- copy of that default since it was seeded, so 53 daily Opus scans have reasoned
-- about "convert family demand into claimed provider pages" instead of the four
-- things TJ is actually working on.
--
-- The constraints below are not decoration. Every one is a fact War Room
-- rediscovered the hard way, or a number it drew a wrong conclusion from. The
-- GA4 caveat in particular is the answer to the `data` investigation that has
-- recurred 34 times and held down every other case.
--
-- Run in the Supabase SQL editor. Read-modify of a single row; no schema change.

UPDATE war_room_company_models SET
  stage = 'Early-stage marketplace with one paying Managed Ads subscriber ($75 MRR, first renewal 2026-10-15), ~700 claimed provider profiles, flat organic at ~3,300 Search Console clicks/week, and an NIH SBIR CRP application targeting January 2027.',

  north_star = 'Providers subscribing to Managed Ads, because that is the first revenue that repeats. Family outcomes are the product; provider subscriptions are the proof the product is worth paying for.',

  current_priorities = '[
    "Get providers subscribing to Managed Ads. Three sub-goals: deliver real leads to the one provider already paying (she has zero inquiries and renews 2026-10-15), get more trial providers in front of the pitch, and build human relationships with trial providers so the subscribe conversation lands. The binding question is whether the 12 campaigns that ended unpaid ever reached a Stripe checkout at all: 1 of 12 did, so this is a delivery problem, not a pricing problem.",
    "Grow organic traffic across the three drivers: provider pages, benefits pages, editorial articles. The provider-page decline is REAL and already diagnosed (2026-09-04): SERP-level click loss uniform across every segment after the June and August spam updates, corroborated by every competitor directory falling in the same window. Do not re-open whether it is real. Benefits pages are up strongly; provider pages carry the loss.",
    "Improve the Benefits Finder and Care Navigator. This is the product the NIH grant is about. The known defect is pick quality, not the review loop: across 303 navigator packets, 49% have every model calling the chosen program questionable or wrong, and 30% of sent letters went out flagged not-cleared. Intra-form drop-off is NOT instrumented and is a genuine blind spot.",
    "Land the NIH SBIR CRP application, now targeting January 2027 rather than September. The 18-week execution plan puts today in week 4 with weeks 1 to 3 outstanding, and the grant workspace has had no commits since 2026-09-02."
  ]'::jsonb,

  constraints = '[
    "NEVER quote GA4 total_users. Roughly 42% of mid-2026 GA4 traffic is bot traffic from a single AWS datacentre in Boardman, Oregon, averaging 7-second sessions. Quote Google Search Console clicks or GA4 Organic Search users instead. This caveat is the answer to the recurring data-integrity condition; stop re-deriving it.",
    "provider_activity page_view counts are server events and are bot-inclusive. They are NOT organic reach. The canonical organic series is growth_page_metrics (GA4 Organic Search + Search Console), which already categorises pages as provider, benefit, or editorial.",
    "Do not read 0 conversions on 11 Ad Boost wrap-up emails as a conversion rate. Two of the 11 never sent (suppressed), a twelfth campaign was never emailed, and not one of the 9 delivered was ever clicked. It is an undelivered ask, not a rejected offer.",
    "cta_id=benefits_intake on page_category=provider is phantom telemetry from a module that does not render. Roughly 43,000 of 50,000 such rows are fake. Never use it as a CTA or in any denominator.",
    "The SBF eligibility database is not versioned and not verified: last_verified_date and verified_by are empty on all 1,629 rows. Never quote a dollar value of aid identified, and never describe the database as curated, versioned, or re-verified.",
    "Olera company-wide revenue, cost, burn and runway are not consolidated. Ad Boost is the only connected revenue. Financial conclusions must stay bounded to what is measurable.",
    "Founder attention is the scarcest resource and TJ is at UTC+7, so work requiring US-hours phone calls does not scale to him. Provider calling is owned by Chantel, Graize and Ces, which means anything not written down does not reach the call.",
    "Olera has a large written record that is now readable as evidence: SCRATCHPAD.md, docs/, and the operating documents. Search it before forming a condition. On 2026-09-20 all four open binding questions had already been answered there."
  ]'::jsonb,

  guardrails = '[
    "Protect families and providers. Better nothing than wrong: never send a family a benefit, phone number, or program that has not been checked against the agency''s own current page.",
    "Do not trade trust for short-term metrics.",
    "No autonomous sends, spend, deployment, deletion, or production mutation.",
    "Prefer reversible learning before expensive commitment. A planned zero is a result, not a defect.",
    "Measure against the stated plan and the north star, not against raw counts."
  ]'::jsonb,

  strategic_questions = '[
    "Should the $75 Managed Ads Starter tier exist as a self-serve price at all? Blocked on asking the one paying provider why she actually paid. She was asked how she found Olera, which is a different question, and the purchase trigger is still unasked.",
    "When a family says they need help paying for care, should the Care Navigator letter lead with a budget-relief program (SNAP, LIHEAP, weatherization) or with a care-funding program? Raised repeatedly, most recently 2026-09-06, never settled. This is a pick-rule change, not a data problem.",
    "What should be done about the already-filed Phase IIB Year 2 progress report, which states 25,000 to 30,000 monthly visits and over 1,000 provider users, against the CRP application''s 15,500 and roughly 700? It is submitted and uneditable, and nothing in the grant workspace records a decision.",
    "Should the benefits-to-provider synergy test be run? The falsification design exists (three nearest providers in-path at the end of a completed screening, 50/50, about four weeks) and has been unbuilt since August. Measured crossover is 0.6%."
  ]'::jsonb,

  updated_by = 'tfalohun',
  updated_at = now()
WHERE key = 'olera';

-- Verify: should return one row with four priorities and four strategic questions.
SELECT key,
       jsonb_array_length(current_priorities)  AS priorities,
       jsonb_array_length(constraints)         AS constraints,
       jsonb_array_length(strategic_questions) AS questions,
       updated_at
FROM war_room_company_models
WHERE key = 'olera';
