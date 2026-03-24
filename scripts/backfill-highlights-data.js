#!/usr/bin/env node
/**
 * Backfill trust signals + Google reviews data for existing providers.
 *
 * This is a one-time script to enrich the ~40K existing providers with
 * data needed for the highlight waterfall on browse cards + detail pages.
 *
 * Two passes:
 *   1. Hydrate google_reviews_data for providers with rating but no JSONB
 *      (instant, no API cost — populates Tier 2 "Highly Rated"/"Well Reviewed")
 *   2. Trust signals via Perplexity for non-CMS providers without ai_trust_signals
 *      (populates Tier 1 "State Licensed", "BBB Rated", etc.)
 *
 * Cost: ~$25 for ~25K non-CMS providers ($1/1000 via Perplexity Sonar)
 * Time: ~4-6 hours at 300ms delay between calls
 *
 * Usage:
 *   node scripts/backfill-highlights-data.js                  # dry-run (count only)
 *   node scripts/backfill-highlights-data.js --run             # full run
 *   node scripts/backfill-highlights-data.js --run --reviews-only  # only hydrate reviews
 *   node scripts/backfill-highlights-data.js --run --trust-only    # only trust signals
 *   node scripts/backfill-highlights-data.js --run --limit 500     # process 500 max
 *   node scripts/backfill-highlights-data.js --run --category "Assisted Living" # one category
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Categories that get CMS Medicare data instead of AI trust signals
const CMS_CATEGORIES = ['Home Health Care', 'Nursing Home', 'Hospice'];

// Categories that need AI trust signals
const NON_CMS_CATEGORIES = ['Assisted Living', 'Memory Care', 'Home Care (Non-medical)', 'Independent Living'];

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = !args.includes('--run');
const REVIEWS_ONLY = args.includes('--reviews-only');
const TRUST_ONLY = args.includes('--trust-only');
const limitIdx = args.indexOf('--limit');
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : null;
const catIdx = args.indexOf('--category');
const CATEGORY_FILTER = catIdx !== -1 ? args[catIdx + 1] : null;

// ============================================================================
// Pass 1: Hydrate google_reviews_data (instant, no API cost)
// ============================================================================

async function hydrateReviewsGlobal() {
  console.log('\n=== Pass 1: Hydrate Google Reviews Data ===');

  // Query providers with google_rating but no google_reviews_data JSONB
  let query = supabase
    .from('olera-providers')
    .select('provider_id, provider_name, google_rating, review_count, provider_category', { count: 'exact' })
    .is('google_reviews_data', null)
    .not('google_rating', 'is', null)
    .or('deleted.is.null,deleted.eq.false');

  if (CATEGORY_FILTER) query = query.eq('provider_category', CATEGORY_FILTER);

  const { data: all, count, error } = await query.limit(LIMIT || 50000);

  if (error) {
    console.error('Query error:', error.message);
    return 0;
  }

  console.log(`Found ${count} providers needing google_reviews_data hydration`);

  if (DRY_RUN) {
    // Show category breakdown
    const byCat = {};
    for (const p of all) {
      byCat[p.provider_category] = (byCat[p.provider_category] || 0) + 1;
    }
    console.log('By category:', JSON.stringify(byCat, null, 2));
    return count;
  }

  let hydrated = 0;
  const BATCH = 100;

  for (let i = 0; i < all.length; i += BATCH) {
    const batch = all.slice(i, i + BATCH);

    for (const p of batch) {
      const reviewsData = {
        rating: parseFloat(p.google_rating),
        review_count: parseInt(p.review_count || '0') || 0,
        reviews: [],
        last_synced: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('olera-providers')
        .update({ google_reviews_data: reviewsData })
        .eq('provider_id', p.provider_id);

      if (!updateErr) hydrated++;
    }

    process.stdout.write(`[Reviews] ${Math.min(i + BATCH, all.length)}/${all.length} hydrated\r`);
  }

  console.log(`\n[Reviews] Done: ${hydrated} hydrated`);
  return hydrated;
}

// ============================================================================
// Pass 2: Trust Signals via Perplexity (non-CMS only)
// ============================================================================

async function backfillTrustSignals() {
  console.log('\n=== Pass 2: Trust Signals (Perplexity) ===');

  if (!PERPLEXITY_API_KEY) {
    console.error('Missing PERPLEXITY_API_KEY in .env.local');
    return { confirmed: 0, deleted: 0, errors: 0 };
  }

  // Query non-CMS providers without trust signals
  let query = supabase
    .from('olera-providers')
    .select('provider_id, provider_name, provider_category, address, city, state, website', { count: 'exact' })
    .is('ai_trust_signals', null)
    .or('deleted.is.null,deleted.eq.false');

  if (CATEGORY_FILTER) {
    query = query.eq('provider_category', CATEGORY_FILTER);
  } else {
    query = query.in('provider_category', NON_CMS_CATEGORIES);
  }

  const { data: all, count, error } = await query.limit(LIMIT || 50000);

  if (error) {
    console.error('Query error:', error.message);
    return { confirmed: 0, deleted: 0, errors: 0 };
  }

  console.log(`Found ${count} non-CMS providers needing trust signals`);

  if (DRY_RUN) {
    const byCat = {};
    for (const p of all) {
      byCat[p.provider_category] = (byCat[p.provider_category] || 0) + 1;
    }
    console.log('By category:', JSON.stringify(byCat, null, 2));
    const estimatedCost = (count / 1000).toFixed(2);
    const estimatedHours = ((count * 0.35) / 3600).toFixed(1);
    console.log(`Estimated cost: ~$${estimatedCost}`);
    console.log(`Estimated time: ~${estimatedHours} hours (at 300ms/call)`);
    return { confirmed: 0, deleted: 0, errors: 0 };
  }

  let confirmed = 0;
  let deleted = 0;
  let errors = 0;
  const startTime = Date.now();

  for (let i = 0; i < all.length; i++) {
    const p = all[i];

    const prompt = `Search the web for this business and answer two questions.

Provider: ${p.provider_name}
Location: ${p.address || ''}, ${p.city}, ${p.state}
Listed Category: ${p.provider_category}
Website: ${p.website || 'unknown'}

QUESTION 1 — ENTITY VERIFICATION
Based on what you find on the web (their website, reviews, directory listings, business registrations), what does this business ACTUALLY do?

Is its PRIMARY BUSINESS one of these senior care types?
- Residential senior living (assisted living, memory care, independent living for seniors)
- In-home senior care (home health, non-medical home care, hospice)
- Dedicated senior program (adult day care, geriatric care management)

Mark is_senior_care = FALSE if it is:
- A wedding venue, event space, or banquet hall
- A community recreation center, YMCA, or activity center
- A general medical clinic, therapy practice, or mental health provider
- A durable medical equipment supplier or medical supply store
- Retail, construction, IT, food service, or any non-care business
- A nonprofit or government service not specific to senior care
- A general apartment complex (not senior-specific independent living)
- A childcare/daycare center (not adult day care)

Also verify LOCATION: Is this business actually in ${p.city}, ${p.state}?

QUESTION 2 — TRUST SIGNALS (only if is_senior_care = true)
Verify these 8 signals. For each, set status to "confirmed", "not_found", or "unclear":
1. state_licensed — Licensed by state? Include license number in detail if found.
2. accredited — Joint Commission, CHAP, CARF, or ACHC accreditation?
3. bbb_rated — BBB profile/rating? Include rating in detail.
4. years_in_operation — When was it founded/incorporated? Include year in detail.
5. regulatory_actions — Any violations or regulatory actions?
6. active_website — Active website with real content?
7. google_business — Google Business Profile listing?
8. community_presence — Social media, Yelp, Caring.com, directories?

Return ONLY this JSON:
{
  "is_senior_care": true/false,
  "entity_reason": "What this business actually is",
  "signals": [
    {"signal": "state_licensed", "status": "confirmed/not_found/unclear", "detail": "specific info or null", "source_url": "url or null"},
    {"signal": "accredited", "status": "confirmed/not_found/unclear", "detail": null, "source_url": null},
    ...all 8 signals
  ],
  "confidence": "high/medium/low"
}`;

    try {
      const resp = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1
        })
      });

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*"is_senior_care"[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.is_senior_care) {
          // Soft-delete false positive
          await supabase
            .from('olera-providers')
            .update({ deleted: true, deleted_at: new Date().toISOString() })
            .eq('provider_id', p.provider_id);
          deleted++;
          console.log(`  [DELETED] ${p.provider_name}: ${parsed.entity_reason}`);
        } else {
          // Compute summary_score (count of confirmed signals)
          const signals = parsed.signals || [];
          const summaryScore = signals.filter(s => s.status === 'confirmed').length;

          const trustData = {
            provider_name: p.provider_name,
            state: p.state,
            category: p.provider_category,
            signals: signals,
            summary_score: summaryScore,
            last_verified: new Date().toISOString(),
            model: 'sonar',
            confidence: parsed.confidence || 'medium',
            entity_reason: parsed.entity_reason,
          };

          await supabase
            .from('olera-providers')
            .update({ ai_trust_signals: trustData })
            .eq('provider_id', p.provider_id);
          confirmed++;
        }
      } else {
        errors++;
      }
    } catch (err) {
      console.log(`  Error for ${p.provider_name}: ${err.message}`);
      errors++;
    }

    await sleep(300);

    // Progress every 25 providers
    if (i % 25 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      const rate = (i / ((Date.now() - startTime) / 1000)).toFixed(1);
      const eta = ((all.length - i) / (rate || 1) / 60).toFixed(0);
      process.stdout.write(
        `[Trust] ${i + 1}/${all.length} | ✓${confirmed} ✗${deleted} ⚠${errors} | ${elapsed}m elapsed, ~${eta}m remaining\r`
      );
    }
  }

  console.log(`\n[Trust Signals] Done: ${confirmed} confirmed, ${deleted} deleted, ${errors} errors`);
  return { confirmed, deleted, errors };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('=== Backfill Highlights Data ===');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (add --run to execute)' : 'LIVE'}`);
  if (LIMIT) console.log(`Limit: ${LIMIT}`);
  if (CATEGORY_FILTER) console.log(`Category: ${CATEGORY_FILTER}`);

  if (!TRUST_ONLY) {
    await hydrateReviewsGlobal();
  }

  if (!REVIEWS_ONLY) {
    await backfillTrustSignals();
  }

  console.log('\n=== Complete ===');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
