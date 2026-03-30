#!/usr/bin/env node
/**
 * Database-Wide Duplicate Finder
 * Queries all active providers from Supabase and finds duplicates using
 * three-tier matching (adapted from TJ's duplicate_finder.py):
 *   Tier 1: Exact normalized address + name similarity >= 75%
 *   Tier 2: Base address (suite stripped) + name similarity >= 75%
 *   Tier 3: Name + city match (>=90% fuzzy similarity)
 *
 * Usage:
 *   node scripts/dedup-database.js                    # Report only
 *   node scripts/dedup-database.js --delete           # Soft-delete duplicates (keeps best record)
 *   node scripts/dedup-database.js --export report.csv # Export pairs to CSV
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// NORMALIZATION (ported from duplicate_finder.py)
// ============================================================================

const ADDRESS_REPLACEMENTS = {
  ' street': ' st', ' avenue': ' ave', ' boulevard': ' blvd',
  ' drive': ' dr', ' road': ' rd', ' lane': ' ln', ' court': ' ct',
  ' place': ' pl', ' circle': ' cir', ' highway': ' hwy',
  ' parkway': ' pkwy', ' suite': ' ste', ' apartment': ' apt',
  ' building': ' bldg', ' floor': ' fl',
  ' north': ' n', ' south': ' s', ' east': ' e', ' west': ' w',
  ' northeast': ' ne', ' northwest': ' nw', ' southeast': ' se', ' southwest': ' sw',
};

function normalizeAddress(addr) {
  if (!addr) return '';
  let a = addr.toLowerCase().trim();
  a = a.replace(/[.,]/g, '');
  a = a.replace(/[–—−‐‑‒―]/g, '-');
  for (const [full, abbrev] of Object.entries(ADDRESS_REPLACEMENTS)) {
    a = a.split(full).join(abbrev);
  }
  return a.replace(/\s+/g, ' ').trim();
}

function getBaseAddress(normalized) {
  if (!normalized) return '';
  return normalized
    .replace(/\s+(ste|suite|apt|unit|fl|floor|bldg|building|rm|room|#)\s*\S*$/i, '')
    .replace(/\s+#\S*$/, '')
    .trim();
}

const NAME_SUFFIXES = [
  ' llc', ' inc', ' corp', ' co', ' company',
  ' of america', ' services', ' service', ' healthcare',
  ' health care', ' home care', ' homecare',
  ' assisted living', ' assisted', ' memory care',
  ' senior living', ' retirement', ' nursing',
  ' l.l.c.', ' incorporated', ' corporation', ' limited',
  ' ltd', ' l.p.', ' lp', ' llp',
];

function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  n = n.replace(/[.,]/g, '');
  for (const suffix of NAME_SUFFIXES) {
    if (n.endsWith(suffix)) {
      n = n.slice(0, -suffix.length);
    }
  }
  return n.trim();
}

// ============================================================================
// FUZZY MATCHING (simplified Levenshtein-based since we don't have rapidfuzz in Node)
// ============================================================================

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function ratio(a, b) {
  if (!a && !b) return 100;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return Math.round(((a.length + b.length - dist) / (a.length + b.length)) * 100);
}

function tokenSortRatio(a, b) {
  const sa = a.split(/\s+/).sort().join(' ');
  const sb = b.split(/\s+/).sort().join(' ');
  return ratio(sa, sb);
}

function tokenSetRatio(a, b) {
  const setA = new Set(a.split(/\s+/));
  const setB = new Set(b.split(/\s+/));
  const intersection = [...setA].filter(x => setB.has(x));
  const onlyA = [...setA].filter(x => !setB.has(x));
  const onlyB = [...setB].filter(x => !setA.has(x));
  const sorted_inter = intersection.sort().join(' ');
  const combined1 = (sorted_inter + ' ' + onlyA.sort().join(' ')).trim();
  const combined2 = (sorted_inter + ' ' + onlyB.sort().join(' ')).trim();
  return Math.max(
    ratio(sorted_inter, combined1),
    ratio(sorted_inter, combined2),
    ratio(combined1, combined2)
  );
}

function getNameSimilarity(name1, name2) {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (n1 === n2) return 100;
  return Math.max(ratio(n1, n2), tokenSortRatio(n1, n2), tokenSetRatio(n1, n2));
}

// ============================================================================
// SCORING: Which record to keep in a duplicate group
// ============================================================================

function scoreProvider(p, claimedIds) {
  let score = 0;
  // Claimed accounts get massive priority — never delete these
  if (claimedIds && claimedIds.has(p.provider_id)) score += 1000;
  if (p.provider_description) score += 10;
  if (p.google_reviews_data) score += 10;
  if (p.google_reviews_data?.reviews?.length > 0) score += 5;
  if (p.ai_trust_signals) score += 10;
  if (p.provider_images) score += 5;
  if (p.email) score += 5;
  if (p.phone) score += 3;
  if (p.website) score += 3;
  if (p.google_rating) score += parseFloat(p.google_rating);
  const reviewCount = p.google_reviews_data?.review_count || 0;
  score += Math.min(reviewCount / 10, 10); // Cap at 10 points for reviews
  return score;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');
  const exportIdx = args.indexOf('--export');
  const exportPath = exportIdx >= 0 ? args[exportIdx + 1] : null;

  console.log('='.repeat(60));
  console.log('DATABASE-WIDE DUPLICATE FINDER');
  console.log('='.repeat(60));
  console.log('Tier 1: Exact address + similar name (>=75%)');
  console.log('Tier 2: Base address + similar name (>=75%)');
  console.log('Tier 3: Name + city match (>=90% similarity)');
  console.log('='.repeat(60) + '\n');

  // Fetch all active providers (paginated)
  console.log('Fetching all active providers...');
  let allProviders = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    try {
      const { data, error } = await supabase
        .from('olera-providers')
        .select('provider_id, provider_name, address, city, state, google_rating, google_reviews_data, ai_trust_signals, provider_description, provider_images, email, phone, website, place_id')
        .or('deleted.is.null,deleted.eq.false')
        .order('provider_id')
        .range(from, from + PAGE_SIZE - 1);

      if (error) { console.error('Fetch error:', error.message); break; }
      if (!data || data.length === 0) break;
      allProviders.push(...data);
      from += PAGE_SIZE;
      process.stdout.write(`  Fetched ${allProviders.length} providers\r`);
    } catch (err) {
      console.error('Fetch exception at offset', from, ':', err.message);
      // Retry once with smaller page
      try {
        const { data, error } = await supabase
          .from('olera-providers')
          .select('provider_id, provider_name, address, city, state, google_rating, google_reviews_data, ai_trust_signals, provider_description, provider_images, email, phone, website, place_id')
          .or('deleted.is.null,deleted.eq.false')
          .order('provider_id')
          .range(from, from + 500 - 1);
        if (!error && data) { allProviders.push(...data); from += data.length; continue; }
      } catch (e2) { /* skip this page */ }
      from += PAGE_SIZE;
    }
  }

  console.log(`\nTotal active providers: ${allProviders.length}\n`);

  // Pre-compute keys
  const providers = allProviders.map(p => ({
    ...p,
    addressKey: normalizeAddress(p.address),
    baseAddressKey: getBaseAddress(normalizeAddress(p.address)),
    cityKey: (p.city || '').toLowerCase().trim(),
  }));

  const NAME_THRESHOLD = 75;
  const NAME_CITY_THRESHOLD = 90;
  const seenPairs = new Set();
  const pairs = [];

  function addPair(p1, p2, reason) {
    const key = [p1.provider_id, p2.provider_id].sort().join('|');
    if (seenPairs.has(key)) return;
    seenPairs.add(key);
    const sim = getNameSimilarity(p1.provider_name, p2.provider_name);
    if (reason === 'name_city' || sim >= NAME_THRESHOLD) {
      pairs.push({
        id1: p1.provider_id, id2: p2.provider_id,
        name1: p1.provider_name, name2: p2.provider_name,
        addr1: p1.address, addr2: p2.address,
        city1: p1.city, city2: p2.city,
        state1: p1.state, state2: p2.state,
        similarity: sim, reason,
      });
    }
  }

  // --- Tier 1: Exact address ---
  console.log('Tier 1: Exact address matching...');
  const addrGroups = {};
  for (const p of providers) {
    if (!p.addressKey) continue;
    (addrGroups[p.addressKey] ||= []).push(p);
  }

  let tier1 = 0;
  for (const group of Object.values(addrGroups)) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const before = pairs.length;
        addPair(group[i], group[j], 'exact_address');
        if (pairs.length > before) tier1++;
      }
    }
  }
  console.log(`  Tier 1 pairs: ${tier1}`);

  // --- Tier 2: Base address ---
  console.log('Tier 2: Base address matching...');
  const baseGroups = {};
  for (const p of providers) {
    if (!p.baseAddressKey) continue;
    (baseGroups[p.baseAddressKey] ||= []).push(p);
  }

  let tier2 = 0;
  for (const group of Object.values(baseGroups)) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const before = pairs.length;
        addPair(group[i], group[j], 'base_address');
        if (pairs.length > before) tier2++;
      }
    }
  }
  console.log(`  Tier 2 pairs (new): ${tier2}`);

  // --- Tier 3: Name + city ---
  console.log('Tier 3: Name + city matching...');
  const cityGroups = {};
  for (const p of providers) {
    if (!p.cityKey) continue;
    (cityGroups[p.cityKey] ||= []).push(p);
  }

  let tier3 = 0;
  let citiesChecked = 0;
  const totalCities = Object.keys(cityGroups).length;

  for (const [cityKey, group] of Object.entries(cityGroups)) {
    if (group.length < 2) continue;
    citiesChecked++;
    if (citiesChecked % 100 === 0) process.stdout.write(`  Tier 3: ${citiesChecked}/${totalCities} cities\r`);

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const sim = getNameSimilarity(group[i].provider_name, group[j].provider_name);
        if (sim >= NAME_CITY_THRESHOLD) {
          const key = [group[i].provider_id, group[j].provider_id].sort().join('|');
          if (!seenPairs.has(key)) {
            seenPairs.add(key);
            pairs.push({
              id1: group[i].provider_id, id2: group[j].provider_id,
              name1: group[i].provider_name, name2: group[j].provider_name,
              addr1: group[i].address, addr2: group[j].address,
              city1: group[i].city, city2: group[j].city,
              state1: group[i].state, state2: group[j].state,
              similarity: sim, reason: 'name_city',
            });
            tier3++;
          }
        }
      }
    }
  }
  console.log(`  Tier 3 pairs (new): ${tier3}                    `);

  // --- Results ---
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));
  console.log(`Total duplicate pairs: ${pairs.length}`);
  console.log(`  Tier 1 (exact address): ${tier1}`);
  console.log(`  Tier 2 (base address): ${tier2}`);
  console.log(`  Tier 3 (name + city): ${tier3}`);

  if (pairs.length === 0) {
    console.log('\nNo duplicates found!');
    return;
  }

  // Union-find for grouping
  const parent = {};
  function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
  function union(a, b) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }

  for (const p of pairs) {
    parent[p.id1] = parent[p.id1] || p.id1;
    parent[p.id2] = parent[p.id2] || p.id2;
    union(p.id1, p.id2);
  }

  // Build groups
  const groups = {};
  for (const id of Object.keys(parent)) {
    const root = find(id);
    (groups[root] ||= []).push(id);
  }

  const groupList = Object.values(groups).filter(g => g.length > 1);
  console.log(`Duplicate groups: ${groupList.length}`);

  // Unique duplicate records
  const allDupIds = new Set();
  for (const g of groupList) g.forEach(id => allDupIds.add(id));
  console.log(`Total duplicate records: ${allDupIds.size}`);

  // Provider lookup
  const providerMap = {};
  for (const p of providers) providerMap[p.provider_id] = p;

  // Show sample groups
  console.log('\nSample duplicate groups:');
  for (const group of groupList.slice(0, 10)) {
    const members = group.map(id => providerMap[id]).filter(Boolean);
    console.log(`\n  Group (${members.length} records):`);
    for (const m of members) {
      const score = scoreProvider(m);
      console.log(`    ${m.provider_id} | ${m.provider_name} | ${m.address}, ${m.city}, ${m.state} | score=${score}`);
    }
  }

  // Export
  if (exportPath) {
    const lines = ['id1,id2,name1,name2,addr1,addr2,city1,city2,state1,state2,similarity,reason'];
    for (const p of pairs) {
      lines.push([p.id1, p.id2, `"${p.name1}"`, `"${p.name2}"`, `"${p.addr1}"`, `"${p.addr2}"`, p.city1, p.city2, p.state1, p.state2, p.similarity, p.reason].join(','));
    }
    fs.writeFileSync(exportPath, lines.join('\n'));
    console.log(`\nExported ${pairs.length} pairs to ${exportPath}`);
  }

  // Soft-delete
  if (shouldDelete) {
    console.log('\n--- SOFT-DELETE MODE ---');

    // Fetch claimed provider IDs (business_profiles.source_provider_id)
    const { data: claimed } = await supabase
      .from('business_profiles')
      .select('source_provider_id')
      .not('source_provider_id', 'is', null);
    const claimedIds = new Set((claimed || []).map(c => c.source_provider_id));
    console.log(`Claimed providers (protected): ${claimedIds.size}`);

    let deleted = 0;
    let kept = 0;
    let protectedCount = 0;

    for (const group of groupList) {
      const members = group.map(id => providerMap[id]).filter(Boolean);
      if (members.length < 2) continue;

      // Score each member — keep the one with the highest score
      // Claimed accounts get +1000, so they always win
      members.sort((a, b) => scoreProvider(b, claimedIds) - scoreProvider(a, claimedIds));
      const keeper = members[0];
      const toDelete = members.slice(1);

      // Safety: never delete a claimed provider
      const safeToDelete = toDelete.filter(d => !claimedIds.has(d.provider_id));
      const protectedInGroup = toDelete.filter(d => claimedIds.has(d.provider_id));
      protectedCount += protectedInGroup.length;

      for (const d of safeToDelete) {
        const { error } = await supabase
          .from('olera-providers')
          .update({ deleted: true, deleted_at: new Date().toISOString() })
          .eq('provider_id', d.provider_id);

        if (error) {
          console.log(`  Error deleting ${d.provider_id}: ${error.message}`);
        } else {
          deleted++;
        }
      }
      kept++;
    }

    console.log(`\nSoft-deleted: ${deleted} duplicate records`);
    console.log(`Kept: ${kept} best records (one per group)`);
    console.log(`Protected (claimed accounts): ${protectedCount} records NOT deleted`);
  } else {
    console.log(`\nRun with --delete to soft-delete duplicates (keeps best record per group)`);
    console.log(`Run with --export dupes.csv to export pairs for review`);
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
