#!/usr/bin/env node
/**
 * City Pipeline Processor
 * Handles: keyword filter → AI classify → dedup → category map → name check →
 *          provider IDs → upload → geocode → out-of-area cleanup
 *
 * Usage: node scripts/process-city.js <discovery-csv> <city> <state>
 * Example: node scripts/process-city.js ~/path/to/providers.csv Greenburgh NY
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

// ============================================================================
// CONFIGURATION
// ============================================================================

const CATEGORY_MAP = {
  'assisted_living': 'Assisted Living',
  'memory_care': 'Memory Care',
  'nursing_home': 'Nursing Home',
  'home_health_care': 'Home Health Care',
  'home_care_non_medical': 'Home Care (Non-medical)',
  'independent_living': 'Independent Living',
  'home_care': 'Home Health Care',
};

const KEYWORD_BLACKLIST = [
  'pharmacy', 'hospital', 'pediatric', 'veterinary', 'dental', 'optometrist',
  'chiropractor', 'urgent care', 'physical therapy', 'dialysis', 'medical supply',
  'staffing agency', 'storage', 'plumbing', 'construction', 'insurance',
  'real estate', 'auto', 'restaurant', 'grocery', 'hardware'
];

const BUSINESS_SUFFIXES = /\s*,?\s*\b(LLC|Inc|Corp|Ltd|L\.L\.C\.|Inc\.|Corp\.|Ltd\.|Incorporated|Corporation|Limited|Company|Co\.|LP|L\.P\.|LLP|L\.L\.P\.)\s*\.?\s*$/gi;

const DESCRIPTION_TEMPLATES = {
  'Assisted Living': { article: 'an', desc: 'assisted living community offering personal care support and daily living assistance' },
  'Memory Care': { article: 'a', desc: 'memory care community providing specialized support for individuals with Alzheimer\'s and dementia' },
  'Nursing Home': { article: 'a', desc: 'skilled nursing facility providing 24-hour medical care and rehabilitation services' },
  'Home Health Care': { article: 'a', desc: 'home health care agency delivering skilled nursing and therapeutic services in the comfort of home' },
  'Home Care (Non-medical)': { article: 'a', desc: 'non-medical home care provider offering companionship, personal care, and daily living support' },
  'Independent Living': { article: 'an', desc: 'independent living community designed for active seniors seeking a maintenance-free lifestyle' },
};

// State bounding boxes for geocoding validation (approximate)
const STATE_BOUNDS = {
  'NY': { minLat: 40.4, maxLat: 45.1, minLon: -79.8, maxLon: -71.8 },
};

// ============================================================================
// HELPERS
// ============================================================================

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function slugify(name, city, state) {
  const slug = `${name}-${city}-${state}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug;
}

function cleanName(name) {
  return name.replace(BUSINESS_SUFFIXES, '').trim();
}

// ============================================================================
// STEP 1: Load & Parse CSV
// ============================================================================

function loadCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// ============================================================================
// STEP 2: Keyword Filter
// ============================================================================

function keywordFilter(providers) {
  const removed = [];
  const kept = [];

  for (const p of providers) {
    const nameAndCat = `${p.provider_name || ''} ${p.provider_category || ''} ${p.subcategory || ''}`.toLowerCase();
    const matched = KEYWORD_BLACKLIST.find(kw => nameAndCat.includes(kw));
    if (matched) {
      removed.push({ ...p, removal_reason: `keyword: ${matched}` });
    } else {
      kept.push(p);
    }
  }

  console.log(`  Keyword filter: removed ${removed.length}, kept ${kept.length}`);
  return { kept, removed };
}

// ============================================================================
// STEP 3: AI Classification (Perplexity)
// ============================================================================

async function aiClassify(providers) {
  const BATCH_SIZE = 25;
  const removed = [];
  const kept = [];

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE);
    const batchList = batch.map((p, idx) =>
      `${i + idx + 1}. "${p.provider_name}" — Category: ${p.provider_category}, Address: ${p.address || 'unknown'}`
    ).join('\n');

    const prompt = `For each business below, determine if its PRIMARY BUSINESS is providing senior care.

Answer YES only if the entity is one of these:
- Residential senior living facility (assisted living, memory care, nursing home, independent living)
- In-home care agency (home health, non-medical home care, hospice)
- Dedicated senior care program (adult day care, geriatric care management)

Answer NO if the entity is:
- A place seniors might USE but that is not a care provider (community centers, recreation facilities, YMCAs, activity centers)
- General medical (family medicine, urgent care, VA clinics, hospitals, rehab clinics)
- Mental health / therapy only (counselors, psychologists, behavioral health)
- Retail, food service, construction, IT, storage, or any non-care business
- Nonprofit / community service that serves the general public (food pantries, housing authorities, United Way)
- Funeral homes, universities, churches, government agencies
- Durable medical equipment suppliers
- General apartment complexes (not senior-specific)

Return JSON only: {"results": [{"num": <number>, "is_senior_care": true/false, "reason": "brief reason"}]}

Businesses:
${batchList}`;

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

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*"results"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const result of parsed.results) {
          const idx = result.num - 1;
          if (idx >= i && idx < i + batch.length) {
            const provider = providers[idx];
            if (result.is_senior_care) {
              kept.push(provider);
            } else {
              removed.push({ ...provider, removal_reason: `AI: ${result.reason}` });
            }
          }
        }

        // Handle any providers not in the response (keep them to be safe)
        const processedNums = new Set(parsed.results.map(r => r.num - 1));
        for (let j = i; j < i + batch.length; j++) {
          if (!processedNums.has(j)) {
            kept.push(providers[j]);
          }
        }
      } else {
        // If parsing fails, keep all providers in this batch
        console.log(`  Warning: Could not parse AI response for batch starting at ${i}, keeping all`);
        kept.push(...batch);
      }
    } catch (err) {
      console.log(`  Warning: AI classify error for batch at ${i}: ${err.message}, keeping all`);
      kept.push(...batch);
    }

    if (i + BATCH_SIZE < providers.length) {
      await sleep(500);
    }
    process.stdout.write(`  AI classify: ${Math.min(i + BATCH_SIZE, providers.length)}/${providers.length}\r`);
  }

  console.log(`  AI classification: removed ${removed.length}, kept ${kept.length}     `);
  return { kept, removed };
}

// ============================================================================
// STEP 4: Dedup against existing DB
// ============================================================================

function loadDedupIndex(csvPath) {
  return new Promise((resolve, reject) => {
    const existing = new Set();
    const placeIds = new Set();
    let count = 0;

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const name = (row.provider_name || '').trim().toLowerCase();
        const state = (row.state || '').trim().toUpperCase();
        if (name && state) {
          existing.add(`${name}|${state}`);
        }
        if (row.place_id) {
          placeIds.add(row.place_id);
        }
        count++;
      })
      .on('end', () => {
        console.log(`  Dedup index loaded: ${count} existing providers`);
        resolve({ existing, placeIds });
      })
      .on('error', reject);
  });
}

function dedup(providers, dedupIndex) {
  const { existing, placeIds } = dedupIndex;
  const kept = [];
  const dupes = [];

  for (const p of providers) {
    const key = `${(p.provider_name || '').trim().toLowerCase()}|${(p.state || '').trim().toUpperCase()}`;
    const pid = p.place_id || '';

    if (existing.has(key) || placeIds.has(pid)) {
      dupes.push(p);
    } else {
      kept.push(p);
      // Add to index to catch intra-batch dupes
      existing.add(key);
      if (pid) placeIds.add(pid);
    }
  }

  console.log(`  Dedup: removed ${dupes.length} duplicates, ${kept.length} new providers`);
  return { kept, dupes };
}

// ============================================================================
// STEP 5: Category Map + Name Check + Provider IDs
// ============================================================================

function prepareProviders(providers, city, state) {
  // Get next provider ID number
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state.toLowerCase();

  let nextId = 1;

  return providers.map((p, idx) => {
    const mappedCategory = CATEGORY_MAP[p.provider_category] || CATEGORY_MAP[p.provider_category?.toLowerCase()] || p.provider_category;
    const cleanedName = cleanName(p.provider_name || '');
    const providerId = `${citySlug}-${stateSlug}-${String(nextId++).padStart(4, '0')}`;
    const slug = slugify(cleanedName, citySlug, stateSlug);

    return {
      provider_id: providerId,
      provider_name: cleanedName,
      provider_category: mappedCategory,
      address: p.address || '',
      city: city,
      state: state,
      zipcode: p.zipcode || '',
      lat: parseFloat(p.lat) || null,
      lon: parseFloat(p.lon) || null,
      phone: p.phone || '',
      website: p.website || '',
      google_rating: parseFloat(p.google_rating) || null,
      place_id: p.place_id || '',
      slug: slug,
      review_count: parseInt(p.review_count) || 0,
    };
  });
}

// ============================================================================
// STEP 6: Upload to Supabase
// ============================================================================

async function uploadToSupabase(providers) {
  const BATCH_SIZE = 50;
  let uploaded = 0;
  let errors = 0;

  for (let i = 0; i < providers.length; i += BATCH_SIZE) {
    const batch = providers.slice(i, i + BATCH_SIZE).map(p => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      provider_category: p.provider_category,
      address: p.address,
      city: p.city,
      state: p.state,
      zipcode: p.zipcode,
      lat: p.lat,
      lon: p.lon,
      phone: p.phone,
      website: p.website,
      google_rating: p.google_rating,
      place_id: p.place_id,
      slug: p.slug,
    }));

    const { data, error } = await supabase
      .from('olera-providers')
      .upsert(batch, { onConflict: 'provider_id' });

    if (error) {
      console.log(`  Upload error at batch ${i}: ${error.message}`);
      // Try individually for slug conflicts
      for (const p of batch) {
        const { error: e2 } = await supabase
          .from('olera-providers')
          .upsert([p], { onConflict: 'provider_id' });
        if (e2) {
          // Try with modified slug
          p.slug = `${p.slug}-${p.provider_id.split('-').pop()}`;
          const { error: e3 } = await supabase
            .from('olera-providers')
            .upsert([p], { onConflict: 'provider_id' });
          if (e3) {
            console.log(`  Failed to upload ${p.provider_name}: ${e3.message}`);
            errors++;
          } else {
            uploaded++;
          }
        } else {
          uploaded++;
        }
      }
    } else {
      uploaded += batch.length;
    }

    process.stdout.write(`  Uploaded: ${uploaded}/${providers.length}\r`);
  }

  console.log(`  Upload complete: ${uploaded} succeeded, ${errors} failed     `);
  return uploaded;
}

// ============================================================================
// STEP 7: Geocode
// ============================================================================

const STATE_NAMES = {
  'NY': 'New York', 'CA': 'California', 'TX': 'Texas', 'FL': 'Florida',
  'NV': 'Nevada', 'NE': 'Nebraska', 'PA': 'Pennsylvania', 'OH': 'Ohio',
  'IL': 'Illinois', 'GA': 'Georgia', 'NC': 'North Carolina', 'MI': 'Michigan',
  'NJ': 'New Jersey', 'VA': 'Virginia', 'WA': 'Washington', 'AZ': 'Arizona',
  'MA': 'Massachusetts', 'TN': 'Tennessee', 'IN': 'Indiana', 'MO': 'Missouri',
  'MD': 'Maryland', 'WI': 'Wisconsin', 'CO': 'Colorado', 'MN': 'Minnesota',
  'SC': 'South Carolina', 'AL': 'Alabama', 'LA': 'Louisiana', 'KY': 'Kentucky',
  'OR': 'Oregon', 'OK': 'Oklahoma', 'CT': 'Connecticut', 'UT': 'Utah',
  'IA': 'Iowa', 'NV': 'Nevada', 'AR': 'Arkansas', 'MS': 'Mississippi',
  'KS': 'Kansas', 'NM': 'New Mexico', 'WV': 'West Virginia', 'HI': 'Hawaii',
};

async function geocodeProviders(city, state) {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state.toLowerCase();
  const prefix = `${citySlug}-${stateSlug}-`;

  // Fetch all providers for this city
  const { data: providers, error } = await supabase
    .from('olera-providers')
    .select('provider_id, provider_name, address, city, state, lat, lon')
    .like('provider_id', `${prefix}%`);

  if (error) { console.log(`  Geocode fetch error: ${error.message}`); return; }

  const stateName = STATE_NAMES[state] || state;
  const bounds = STATE_BOUNDS[state];
  let corrections = 0;
  let outOfBounds = 0;

  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    const addr = `${p.address}, ${p.city}, ${stateName}`;

    try {
      const resp = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${GOOGLE_API_KEY}`
      );
      const data = await resp.json();

      if (data.results?.[0]) {
        const loc = data.results[0].geometry.location;
        const newLat = loc.lat;
        const newLon = loc.lng;

        // Check if within state bounds
        if (bounds && (newLat < bounds.minLat || newLat > bounds.maxLat || newLon < bounds.minLon || newLon > bounds.maxLon)) {
          outOfBounds++;
          continue; // Will be cleaned up later
        }

        // Check if significant change (>0.01°)
        const latDiff = Math.abs(newLat - (p.lat || 0));
        const lonDiff = Math.abs(newLon - (p.lon || 0));

        if (latDiff > 0.01 || lonDiff > 0.01 || !p.lat || !p.lon) {
          corrections++;
          await supabase
            .from('olera-providers')
            .update({ lat: newLat, lon: newLon })
            .eq('provider_id', p.provider_id);
        }
      }
    } catch (err) {
      // Skip on error
    }

    if (i % 10 === 0) {
      process.stdout.write(`  Geocoding: ${i + 1}/${providers.length}\r`);
    }
    await sleep(50); // Rate limit
  }

  console.log(`  Geocoding complete: ${corrections} corrections, ${outOfBounds} out-of-bounds     `);
  return { corrections, outOfBounds };
}

// ============================================================================
// STEP 8: Out-of-area cleanup
// ============================================================================

async function outOfAreaCleanup(city, state) {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const stateSlug = state.toLowerCase();
  const prefix = `${citySlug}-${stateSlug}-`;

  // Get city center coordinates from first few providers
  const { data: sample } = await supabase
    .from('olera-providers')
    .select('lat, lon')
    .like('provider_id', `${prefix}%`)
    .not('lat', 'is', null)
    .not('deleted', 'eq', true)
    .limit(20);

  if (!sample || sample.length < 5) {
    console.log('  Not enough providers for area check');
    return 0;
  }

  // Calculate median center
  const lats = sample.map(p => p.lat).sort((a, b) => a - b);
  const lons = sample.map(p => p.lon).sort((a, b) => a - b);
  const centerLat = lats[Math.floor(lats.length / 2)];
  const centerLon = lons[Math.floor(lons.length / 2)];

  // Get all providers
  const { data: all } = await supabase
    .from('olera-providers')
    .select('provider_id, provider_name, lat, lon')
    .like('provider_id', `${prefix}%`)
    .not('lat', 'is', null);

  const MAX_DISTANCE = 0.5; // ~35 miles at NY latitude
  let deleted = 0;

  for (const p of all || []) {
    const dist = Math.sqrt(Math.pow(p.lat - centerLat, 2) + Math.pow(p.lon - centerLon, 2));
    if (dist > MAX_DISTANCE) {
      await supabase
        .from('olera-providers')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .eq('provider_id', p.provider_id);
      deleted++;
    }
  }

  console.log(`  Out-of-area cleanup: ${deleted} providers deleted (>${MAX_DISTANCE}° from center)`);
  return deleted;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const [csvPath, city, state] = process.argv.slice(2);

  if (!csvPath || !city || !state) {
    console.log('Usage: node scripts/process-city.js <discovery-csv> <city> <state>');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`PROCESSING: ${city}, ${state}`);
  console.log(`${'='.repeat(70)}\n`);

  // Step 1: Load CSV
  console.log('Step 1: Loading discovery CSV...');
  let providers = await loadCSV(csvPath);

  // Filter to just this city's providers if the CSV contains multiple cities
  const cityProviders = providers.filter(p => {
    const pCity = (p.city || '').trim().toLowerCase();
    const pState = (p.state || '').trim().toUpperCase();
    return pCity === city.toLowerCase() && pState === state.toUpperCase();
  });

  if (cityProviders.length > 0) {
    providers = cityProviders;
  }

  console.log(`  Loaded ${providers.length} providers`);

  // Step 2: Keyword filter
  console.log('\nStep 2: Keyword filter...');
  const kf = keywordFilter(providers);
  providers = kf.kept;

  // Step 3: AI classification
  console.log('\nStep 3: AI classification...');
  const ai = await aiClassify(providers);
  providers = ai.kept;

  // Step 4: Dedup
  console.log('\nStep 4: Dedup against existing DB...');
  const dedupCSV = path.join(process.env.HOME, 'Desktop/TJ-hq/Olera/Provider Database/olera-providers_rows.csv');
  const dedupIndex = await loadDedupIndex(dedupCSV);
  const dd = dedup(providers, dedupIndex);
  providers = dd.kept;

  // Step 5: Prepare (category map, name check, IDs)
  console.log('\nStep 5: Category map + name check + provider IDs...');
  providers = prepareProviders(providers, city, state);

  // Validate categories
  const unmapped = providers.filter(p => !Object.values(CATEGORY_MAP).includes(p.provider_category));
  if (unmapped.length > 0) {
    console.log(`  WARNING: ${unmapped.length} providers with unmapped categories:`);
    const cats = [...new Set(unmapped.map(p => p.provider_category))];
    cats.forEach(c => console.log(`    - ${c}`));
  }

  const catBreakdown = {};
  providers.forEach(p => { catBreakdown[p.provider_category] = (catBreakdown[p.provider_category] || 0) + 1; });
  console.log('  Category breakdown:');
  Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`    ${cat}: ${count}`);
  });

  // Step 6: Upload
  console.log(`\nStep 6: Upload ${providers.length} providers to Supabase...`);
  const uploaded = await uploadToSupabase(providers);

  // Step 7: Geocode
  console.log('\nStep 7: Re-geocoding...');
  const geo = await geocodeProviders(city, state);

  // Step 8: Out-of-area cleanup
  console.log('\nStep 8: Out-of-area cleanup...');
  const ooa = await outOfAreaCleanup(city, state);

  // Summary
  const finalCount = uploaded - ooa;
  console.log(`\n${'='.repeat(70)}`);
  console.log(`PROCESSING COMPLETE: ${city}, ${state}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  Discovered: ${(await loadCSV(csvPath)).filter(p => (p.city || '').toLowerCase() === city.toLowerCase()).length || providers.length + kf.removed.length + ai.removed.length + dd.dupes.length}`);
  console.log(`  Keyword filter removed: ${kf.removed.length}`);
  console.log(`  AI classification removed: ${ai.removed.length}`);
  console.log(`  Duplicates removed: ${dd.dupes.length}`);
  console.log(`  Uploaded: ${uploaded}`);
  console.log(`  Geocoding corrections: ${geo?.corrections || 0}`);
  console.log(`  Out-of-area deleted: ${ooa}`);
  console.log(`  Final active: ~${finalCount}`);
  console.log(`${'='.repeat(70)}\n`);

  // Output JSON summary for the caller
  const summary = {
    city, state,
    discovered: providers.length + kf.removed.length + ai.removed.length + dd.dupes.length,
    keyword_removed: kf.removed.length,
    ai_removed: ai.removed.length,
    dupes_removed: dd.dupes.length,
    uploaded,
    geocode_corrections: geo?.corrections || 0,
    out_of_area: ooa,
    final_count: finalCount,
    categories: catBreakdown,
  };

  // Write summary
  const summaryPath = path.join(path.dirname(csvPath), `${city.replace(/\s+/g, '-')}-${state}-summary.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary saved to: ${summaryPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
