/**
 * Bulk fix article metadata:
 * 1. Author roles for TJ, Logan, Lisa Fields, Laura Herman, Jamie DuBose
 * 2. Normalize "Logan DuBose" → "Dr. Logan DuBose"
 * 3. Normalize "Laura Herman - Dementia Care Specialist, CCF" → author_name + author_role
 * 4. Best-fit care_types for articles missing them
 * 5. Fix wrong tags on how-to-prove-primary-caregiver-custody
 *
 * Usage:
 *   node scripts/fix-article-metadata.mjs --dry-run   # preview changes
 *   node scripts/fix-article-metadata.mjs              # apply changes
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
// Use service role key to bypass RLS (anon key silently fails on updates)
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── Author bios ──────────────────────────────────────────────
const AUTHOR_ROLES = {
  'TJ Falohun': 'TJ Falohun, co-founder and CEO of Olera, is a trained biomedical engineer passionate about developing novel digital health and medical technologies. His passion for innovative solutions drives him to write about the cost of healthcare in America and to revolutionize the senior healthcare industry.',
  'Dr. Logan DuBose': 'Dr. Logan DuBose is a MD and co-founder of Olera.care. He writes about dementia, Alzheimer\'s, and other age-related conditions. He is a Texas A&M MD/MBA alum. Olera specializes in merging clinical practice with innovative solutions for the aging population.',
  'Lisa Fields': 'Lisa Fields is a passionate healthcare writer and advocate for better senior care in America. This article has been reviewed by TJ Falohun, co-founder and CEO of Olera. He is a trained biomedical engineer and writes about the cost of healthcare in America for seniors.',
  'Laura Herman': 'Laura Herman is an elder and dementia care professional who advocates for better senior care in America. This article has been reviewed by TJ Falohun, co-founder and CEO of Olera. He is a trained biomedical engineer and writes about the cost of healthcare in America for seniors.',
  'Jamie DuBose': 'Jamie DuBose, MD, MPH, is a pediatric hospitalist at Children\'s National Hospital in Washington, D.C., and affiliated community sites, including Mary Washington and Stafford Hospitals. Her primary interests include newborn care, global health and hospital-to-community care transitions.',
};

// ── Author name normalizations ───────────────────────────────
const AUTHOR_NAME_FIXES = {
  'Logan DuBose': 'Dr. Logan DuBose',
  'Laura Herman - Dementia Care Specialist, CCF': 'Laura Herman',
};

// ── Best-fit care_types for articles currently missing them ──
// Philosophy: Tag based on what a reader filtering by that care type
// would expect to find. Company news/press/editorial opinion pieces
// are left empty — they're not care-type-specific content.
const CARE_TYPE_ASSIGNMENTS = {
  // ─── Caregiving guides (general → home-care) ───
  'a-guide-to-the-beginning-of-the-caregiving-journey': ['home-care'],
  'a-practical-guide-to-managing-a-loved-ones-care': ['home-care'],
  'a-quick-start-guide-to-caring-for-your-elder-one': ['home-care'], // already has it, skip
  'are-caregiver-expenses-tax-deductible': ['home-care'],
  'average-cost-of-a-live-in-caregiver': ['home-care'],
  'can-a-caregiver-receive-benefits-from-social-security': ['home-care'],
  'caregiver-counseling-near-me': ['home-care'],
  'caregiver-for-the-elderly-daily-log-app': ['home-care'],
  'caregiver-support-groups': ['home-care'],
  'do-you-have-to-be-certified-to-be-a-caregiver': ['home-care'],
  'does-blue-cross-blue-shield-cover-caregiver-expenses': ['home-care', 'home-health'],
  'elder-transportation-services-a-guide-to-safe-and-reliable-options': ['home-care'],
  'family-caregiver-support-finding-local-resources-and-assistance-programs-near-you': ['home-care'],
  'finding-your-way-forward-after-a-loved-one-is-gone': ['home-care'],
  'home-care-strategic-scheduling': ['home-care'],
  'how-to-prove-primary-caregiver-custody': ['home-care'],
  'in-home-caregivers-finding-the-right-caregiver-for-your-loved-one': ['home-care'], // already has it
  'professional-caregiver-education-requirements': ['home-care'],
  'reducing-stress-in-senior-care': ['home-care'],
  'what-is-the-hourly-rate-for-an-in-home-caregiver': ['home-care'],
  'what-to-consider-when-hiring-a-private-caregiver': ['home-care'], // already has it
  'when-caregiving-becomes-a-24-7-job': ['home-care'],
  'your-legal-rights-as-a-family-caregiver': ['home-care'], // already has it

  // ─── VA / home health ───
  'what-is-the-va-caregiver-functional-assessment': ['home-care', 'home-health'],

  // ─── Financial / legal (relevant to family caregivers) ───
  'affordable-elder-law-solutions-alternatives-for-legal-assistance-when-on-a-budget': ['home-care'],
  'choosing-a-certified-financial-planner-factors-to-consider': ['home-care'],
  'choosing-the-right-elder-law-attorney-essential-tips': ['home-care'],
  'compensating-family-caregivers-understanding-medicaid-friendly-personal-care-agreements': ['home-care'],
  'guardianship-conservatorship-and-poa-comparing-setting-up-and-selecting-the-best-option': ['home-care'],
  'legal-considerations-for-family-caregivers-navigating-the-complexities-of-aging-care': ['home-care'],
  'managing-elderly-parents-finances-a-guide-to-assistance-and-support': ['home-care'],
  'managing-finances-for-aging-parents-a-comprehensive-guide-to-elderly-financial-management': ['home-care'],
  'power-of-attorney-simplified-understanding-rights-limitations-and-decision-making': ['home-care'],
  'senior-care-insurance-a-guide-to-finding-the-ideal-agent-for-your-needs': ['home-care'],

  // ─── Medicaid (spans home care + nursing homes) ───
  'is-my-loved-one-eligible-for-medicaid': ['home-care', 'nursing-homes'],
  'understanding-medicaid-eligibility-planning-securing-healthcare-for-seniors': ['home-care', 'nursing-homes'],
  'what-is-medicaid-spend-down': ['home-care', 'nursing-homes'],

  // ─── Assisted living ───
  'assisted-living-costs-a-guide-to-financing-and-finding-the-ideal-facility': ['assisted-living'],
  'finding-a-senior-care-advisor-a-guide': ['assisted-living'],
  'senior-facility-placement-services-weighing-the-benefits-for-your-decision': ['assisted-living'],
  'staying-connected-with-your-parent-in-a-long-term-care-facility': ['assisted-living', 'nursing-homes'],

  // ─── Dementia / memory care ───
  'advance-care-planning-ensuring-quality-dementia-care-and-support': ['memory-care'],
  'alzheimer-s-disease-understanding-the-7-stages-and-identifying-symptoms': ['memory-care'],
  'complete-guide-to-advance-care-planning-for-family-caregivers': ['home-care', 'memory-care'],
  'dealing-with-loss-when-a-parent-with-dementia-fails-to-recognize-you': ['memory-care'],
  'debunking-dementia-myths-5-misconceptions-you-should-dismiss': ['memory-care'],
  'dementia-care-finances-tips-and-tricks': ['memory-care'],
  'dementia-care-discover-the-perfect-doctor-for-your-parent-s-needs': ['memory-care'],
  'dementia-diagnosis-insights-geriatricians-advice-for-family-members': ['memory-care'],
  'dementia-diagnosis-3-essential-steps-for-supporting-your-parent': ['memory-care'],
  'dementia-support-for-seniors-and-caregivers-top-agencies-and-organizations': ['memory-care'],
  'dementia-related-expenses-exploring-insurance-coverage-options': ['memory-care'],
  'maintaining-meaningful-connections-with-parents-suffering-from-dementia': ['memory-care'],
  'unexpected-dementia-expenses-3-overlooked-financial-considerations': ['memory-care'],

  // ─── Hospice (closest fit: home-health for medical care) ───
  'hospice-care-a-guide-for-families-and-caregivers': ['home-health'],
  'hospice-selection-4-key-criteria-for-making-the-right-choice': ['home-health'],

  // ─── Adult daycare (supports aging in place) ───
  'adult-daycare-centers-a-guide-to-choosing-the-right-service-for-your-loved-one': ['home-care'],

  // ─── Cross-category guides ───
  'senior-care-types-a-guide-to-provider-options': ['home-care', 'assisted-living'], // already has home-care
  'senior-living-facilities-vs-in-home-care-a-comprehensive-comparison-for-elderly-care-options': ['home-care', 'assisted-living'], // already has home-care
  'find-top-house-and-yard-maintenance-services-for-seniors-enhance-your-living-space': ['home-care', 'independent-living'],
  'top-meal-services-for-seniors-and-caregivers-healthy-and-convenient-dining-options': ['home-care', 'independent-living'],

  // ─── Left empty (company news / press / editorial opinion) ───
  // olera-s-q3-2023-update
  // aging-in-america-season-2
  // aging-in-america-the-conversations-we-need
  // america-s-aging-care-system-is-broken
  // ceo-tj-falohun-to-represent-olera
  // co-founder-spotlight-olera-s-tj-falohun
  // dr-logan-dubose-podcast-appearances
  // inflation-and-labor-costs-increasing-for-senior-care
  // new-study-uncovering-the-real-challenges
  // olera-care-takes-aim-at-pay-per-lead
  // olera-earns-third-place
  // olera-enters-phase-2-of-the-cares-study
  // olera-featured-in-the-local-news
  // olera-receives-usd3m-grant
  // olera-s-innovation-in-senior-care-recognized
  // the-origins-of-olera
  // video-podcast-an-exclusive-conversation
  // why-americas-aging-care-system-is-broken
};

// ── Tag fixes (only correcting wrong tags) ───────────────────
const TAG_FIXES = {
  'how-to-prove-primary-caregiver-custody': ['legal', 'guardianship', 'custody'],
};

// ══════════════════════════════════════════════════════════════
// Execute
// ══════════════════════════════════════════════════════════════

async function main() {
  console.log(DRY_RUN ? '🔍 DRY RUN — no changes will be made\n' : '🚀 APPLYING CHANGES\n');

  const { data: articles, error } = await sb
    .from('content_articles')
    .select('id,slug,author_name,author_role,care_types,tags')
    .eq('status', 'published');

  if (error) { console.error('Fetch error:', error); return; }

  let updateCount = 0;
  const updates = [];

  for (const article of articles) {
    const patch = {};
    let reasons = [];

    // 1. Author name normalization
    if (AUTHOR_NAME_FIXES[article.author_name]) {
      patch.author_name = AUTHOR_NAME_FIXES[article.author_name];
      reasons.push(`name: "${article.author_name}" → "${patch.author_name}"`);
    }

    // 2. Author role
    const effectiveName = patch.author_name || article.author_name;
    if (AUTHOR_ROLES[effectiveName] && article.author_role !== AUTHOR_ROLES[effectiveName]) {
      patch.author_role = AUTHOR_ROLES[effectiveName];
      reasons.push(`role: set bio for ${effectiveName}`);
    }
    // Special case: Laura Herman with CCF credential gets Laura Herman's role + credential prefix
    if (article.author_name === 'Laura Herman - Dementia Care Specialist, CCF') {
      patch.author_role = 'Dementia Care Specialist, CCF. ' + AUTHOR_ROLES['Laura Herman'];
      reasons.push('role: added CCF credential + Laura Herman bio');
    }

    // 3. Care types (only if article currently has none AND we have an assignment)
    const currentCt = article.care_types || [];
    if (CARE_TYPE_ASSIGNMENTS[article.slug]) {
      const newCt = CARE_TYPE_ASSIGNMENTS[article.slug];
      // Merge: keep existing + add new (deduplicated)
      const merged = [...new Set([...currentCt, ...newCt])];
      if (JSON.stringify(merged.sort()) !== JSON.stringify([...currentCt].sort())) {
        patch.care_types = merged;
        reasons.push(`care_types: [${currentCt.join(',')||'none'}] → [${merged.join(',')}]`);
      }
    }

    // 4. Tag fixes (only for articles with known wrong tags)
    if (TAG_FIXES[article.slug]) {
      const currentTags = article.tags || [];
      const newTags = TAG_FIXES[article.slug];
      if (JSON.stringify(currentTags.sort()) !== JSON.stringify(newTags.sort())) {
        patch.tags = newTags;
        reasons.push(`tags: [${currentTags.join(',')||'none'}] → [${newTags.join(',')}]`);
      }
    }

    if (reasons.length > 0) {
      updates.push({ id: article.id, slug: article.slug, patch, reasons });
    }
  }

  // Report
  console.log(`Found ${updates.length} articles to update:\n`);
  for (const u of updates) {
    console.log(`  ${u.slug}`);
    u.reasons.forEach(r => console.log(`    → ${r}`));
  }

  if (DRY_RUN) {
    console.log(`\n🔍 Dry run complete. ${updates.length} articles would be updated.`);
    console.log('Run without --dry-run to apply.');
    return;
  }

  // Apply updates
  console.log(`\nApplying ${updates.length} updates...`);
  let success = 0;
  let failed = 0;

  for (const u of updates) {
    const { error } = await sb
      .from('content_articles')
      .update(u.patch)
      .eq('id', u.id);

    if (error) {
      console.error(`  ✗ ${u.slug}: ${error.message}`);
      failed++;
    } else {
      success++;
    }
  }

  console.log(`\n✅ Done: ${success} updated, ${failed} failed`);
}

main();
