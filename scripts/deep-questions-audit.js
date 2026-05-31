require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepAudit() {
  console.log("=".repeat(70));
  console.log("DEEP QUESTIONS AUDIT - Checking for email sync issues");
  console.log("=".repeat(70));

  // Get ALL questions with needs_provider_email flag that are active
  const { data: allQuestions } = await db
    .from('provider_questions')
    .select('id, provider_id, status, metadata, created_at')
    .neq('status', 'archived')
    .neq('status', 'rejected')
    .order('created_at', { ascending: false });

  const questionsWithFlag = allQuestions.filter(q => {
    const meta = q.metadata || {};
    return meta.needs_provider_email === true;
  });

  console.log("\nQuestions with needs_provider_email flag (active):", questionsWithFlag.length);

  // Get unique provider IDs
  const providerIds = [...new Set(questionsWithFlag.map(q => q.provider_id).filter(Boolean))];
  console.log("Unique provider IDs:", providerIds.length);

  // Look up in business_profiles
  const { data: bpProviders } = await db
    .from('business_profiles')
    .select('slug, email, is_active, source_provider_id')
    .in('slug', providerIds);

  // Look up in olera-providers
  const { data: oleraProviders } = await db
    .from('olera-providers')
    .select('slug, email, provider_name, provider_id')
    .in('slug', providerIds)
    .not('deleted', 'is', true);

  // Build maps
  const bpMap = new Map();
  (bpProviders || []).forEach(p => {
    bpMap.set(p.slug, { email: p.email, is_active: p.is_active, source_provider_id: p.source_provider_id });
  });

  const oleraMap = new Map();
  (oleraProviders || []).forEach(p => {
    oleraMap.set(p.slug, { email: p.email, provider_name: p.provider_name, provider_id: p.provider_id });
  });

  // Categorize questions
  const categories = {
    notFound: [],
    archived: [],
    hasEmailInBP: [],
    hasEmailInOlera: [], // Email in olera-providers but not in business_profiles
    genuinelyNoEmail: []
  };

  for (const q of questionsWithFlag) {
    const bp = bpMap.get(q.provider_id);
    const olera = oleraMap.get(q.provider_id);

    if (!bp && !olera) {
      categories.notFound.push({ id: q.id, provider_id: q.provider_id });
    } else if (bp && bp.is_active === false) {
      categories.archived.push({ id: q.id, provider_id: q.provider_id });
    } else if (bp && bp.email) {
      categories.hasEmailInBP.push({ id: q.id, provider_id: q.provider_id, email: bp.email });
    } else if (olera && olera.email) {
      categories.hasEmailInOlera.push({
        id: q.id,
        provider_id: q.provider_id,
        oleraEmail: olera.email,
        providerName: olera.provider_name,
        bpEmail: bp?.email || '(not in BP)'
      });
    } else {
      categories.genuinelyNoEmail.push({ id: q.id, provider_id: q.provider_id });
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("BREAKDOWN");
  console.log("=".repeat(70));
  console.log("Provider NOT FOUND:", categories.notFound.length);
  console.log("Provider ARCHIVED:", categories.archived.length);
  console.log("Has email in business_profiles:", categories.hasEmailInBP.length);
  console.log("Has email in olera-providers (SYNC ISSUE):", categories.hasEmailInOlera.length);
  console.log("Genuinely no email anywhere:", categories.genuinelyNoEmail.length);

  if (categories.hasEmailInOlera.length > 0) {
    console.log("\n" + "!".repeat(70));
    console.log("SYNC ISSUES - Email in olera-providers but code doesn't check there");
    console.log("!".repeat(70));
    categories.hasEmailInOlera.slice(0, 15).forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.providerName || issue.provider_id}`);
      console.log(`   Question ID: ${issue.id}`);
      console.log(`   olera-providers.email: ${issue.oleraEmail}`);
    });
    if (categories.hasEmailInOlera.length > 15) {
      console.log(`... and ${categories.hasEmailInOlera.length - 15} more`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("FINAL SUMMARY FOR QUESTIONS");
  console.log("=".repeat(70));
  console.log("Current 'needs email' count (with flag):", questionsWithFlag.length);
  console.log("  - Provider not found:", categories.notFound.length);
  console.log("  - Provider archived:", categories.archived.length);
  console.log("  - Has email in business_profiles:", categories.hasEmailInBP.length);
  console.log("  - Has email in olera-providers (SYNC ISSUE):", categories.hasEmailInOlera.length);
  console.log("  - Genuinely no email:", categories.genuinelyNoEmail.length);
}

deepAudit().catch(console.error);
