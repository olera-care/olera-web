require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log("=".repeat(60));
  console.log("COMPREHENSIVE QUESTIONS VERIFICATION");
  console.log("=".repeat(60));

  // Get ALL questions with needs_provider_email flag
  const { data: allQuestions } = await db
    .from('provider_questions')
    .select('id, provider_id, status, metadata, created_at')
    .order('created_at', { ascending: false });

  const withFlag = allQuestions.filter(q => {
    const meta = q.metadata || {};
    return meta.needs_provider_email === true;
  });

  console.log("\n1. QUESTIONS WITH needs_provider_email FLAG");
  console.log("   Total questions with flag:", withFlag.length);
  console.log("   By question status:");
  const byStatus = {};
  withFlag.forEach(q => {
    byStatus[q.status] = (byStatus[q.status] || 0) + 1;
  });
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log("     - " + status + ": " + count);
  });

  // Get questions that would show in "needs email" tab (non-archived, non-rejected)
  const activeWithFlag = withFlag.filter(q =>
    q.status !== 'archived' && q.status !== 'rejected'
  );
  console.log("\n   Active (non-archived/rejected) with flag:", activeWithFlag.length);

  // Get unique provider IDs
  const providerIds = [...new Set(activeWithFlag.map(q => q.provider_id).filter(Boolean))];
  console.log("\n2. PROVIDER LOOKUP");
  console.log("   Unique provider IDs:", providerIds.length);

  // Look up in business_profiles
  const { data: bpProviders } = await db
    .from('business_profiles')
    .select('slug, email, is_active, display_name')
    .in('slug', providerIds);

  // Look up in olera-providers
  const { data: oleraProviders } = await db
    .from('olera-providers')
    .select('slug, email, provider_name, deleted')
    .in('slug', providerIds)
    .not('deleted', 'is', true);

  console.log("   Found in business_profiles:", (bpProviders || []).length);
  console.log("   Found in olera-providers:", (oleraProviders || []).length);

  // Build comprehensive provider map
  const providerMap = new Map();

  // From business_profiles (takes precedence)
  for (const p of bpProviders || []) {
    if (p.slug) {
      providerMap.set(p.slug, {
        name: p.display_name,
        email: p.email,
        isArchived: p.is_active === false,
        source: 'business_profiles'
      });
    }
  }

  // From olera-providers (only if not in business_profiles)
  for (const p of oleraProviders || []) {
    if (p.slug && !providerMap.has(p.slug)) {
      providerMap.set(p.slug, {
        name: p.provider_name,
        email: p.email,
        isArchived: false,
        source: 'olera-providers'
      });
    }
  }

  // Categorize each question
  const categories = {
    providerNotFound: [],
    providerArchived: [],
    providerHasEmail: [],
    providerNeedsEmail: []
  };

  for (const q of activeWithFlag) {
    const provider = providerMap.get(q.provider_id);
    if (!provider) {
      categories.providerNotFound.push({ id: q.id, provider_id: q.provider_id });
    } else if (provider.isArchived) {
      categories.providerArchived.push({ id: q.id, provider_id: q.provider_id, name: provider.name });
    } else if (provider.email) {
      categories.providerHasEmail.push({ id: q.id, provider_id: q.provider_id, name: provider.name, email: provider.email });
    } else {
      categories.providerNeedsEmail.push({ id: q.id, provider_id: q.provider_id, name: provider.name });
    }
  }

  console.log("\n3. QUESTION BREAKDOWN (what code fix will filter)");
  console.log("   Provider NOT FOUND:", categories.providerNotFound.length, "(we just archived 18 of these)");
  console.log("   Provider ARCHIVED:", categories.providerArchived.length);
  console.log("   Provider HAS EMAIL:", categories.providerHasEmail.length);
  console.log("   Provider NEEDS EMAIL:", categories.providerNeedsEmail.length, "(will show in 'needs email' tab)");

  // Show details for archived providers
  if (categories.providerArchived.length > 0) {
    console.log("\n   === Questions to ARCHIVED providers ===");
    const uniqueArchived = [...new Set(categories.providerArchived.map(q => q.provider_id))];
    for (const pid of uniqueArchived) {
      const count = categories.providerArchived.filter(q => q.provider_id === pid).length;
      const item = categories.providerArchived.find(q => q.provider_id === pid);
      console.log("     - " + (item.name || pid) + ": " + count + " questions");
    }
  }

  // Show details for providers that now have email
  if (categories.providerHasEmail.length > 0) {
    console.log("\n   === Questions where provider NOW HAS EMAIL ===");
    const uniqueHasEmail = [...new Set(categories.providerHasEmail.map(q => q.provider_id))];
    for (const pid of uniqueHasEmail.slice(0, 10)) {
      const item = categories.providerHasEmail.find(q => q.provider_id === pid);
      console.log("     - " + item.name + ": " + item.email);
    }
    if (uniqueHasEmail.length > 10) {
      console.log("     ... and " + (uniqueHasEmail.length - 10) + " more");
    }
  }

  // Show not found (should be 0 after archiving)
  if (categories.providerNotFound.length > 0) {
    console.log("\n   === Questions where provider NOT FOUND (should be 0) ===");
    const uniqueNotFound = [...new Set(categories.providerNotFound.map(q => q.provider_id))];
    uniqueNotFound.slice(0, 10).forEach(pid => {
      console.log("     - " + pid);
    });
  }

  // Final count
  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("Current 'needs email' count (before code fix):", activeWithFlag.length);
  console.log("New 'needs email' count (after code fix):", categories.providerNeedsEmail.length);
  console.log("\nBreakdown of what gets filtered OUT:");
  console.log("  - Provider not found:", categories.providerNotFound.length);
  console.log("  - Provider archived:", categories.providerArchived.length);
  console.log("  - Provider has email:", categories.providerHasEmail.length);
  console.log("  - TOTAL filtered out:", categories.providerNotFound.length + categories.providerArchived.length + categories.providerHasEmail.length);
}

verify().catch(console.error);
