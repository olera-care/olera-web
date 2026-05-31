require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log("=".repeat(70));
  console.log("VERIFICATION: What 'needs email' will show AFTER the fix");
  console.log("=".repeat(70));

  // Get ALL leads (same as the route does)
  const { data: allLeads } = await db
    .from('connections')
    .select(`
      id,
      type,
      metadata,
      created_at,
      to_profile_id,
      to_profile:business_profiles!connections_to_profile_id_fkey(
        id, display_name, email, is_active, slug, source_provider_id
      )
    `)
    .in('type', ['inquiry', 'request'])
    .not('metadata', 'cs', JSON.stringify({ archived: true }))
    .order('created_at', { ascending: false })
    .limit(10000);

  console.log("\nTotal non-archived leads:", allLeads.length);

  // Get source_provider_ids for providers without email in business_profiles
  const sourceProviderIds = allLeads
    .map((lead) => {
      const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
      if (!provider || provider.is_active === false || provider.email) return null;
      return provider.source_provider_id;
    })
    .filter(Boolean);

  // Look up emails in olera-providers (same as the fixed code does)
  const { data: oleraProviders } = await db
    .from('olera-providers')
    .select('provider_id, email')
    .in('provider_id', sourceProviderIds)
    .not('deleted', 'is', true);

  const oleraEmailMap = new Map();
  (oleraProviders || []).forEach(p => {
    if (p.email) oleraEmailMap.set(p.provider_id, p.email);
  });

  console.log("Providers with email in olera-providers (found via fallback):", oleraEmailMap.size);

  // Categorize leads using the FIXED logic
  const categories = {
    providerNotFound: [],
    providerArchived: [],
    providerResponded: [],
    hasEmailInBP: [],
    hasEmailInOlera: [],
    genuinelyNeedsEmail: []
  };

  for (const lead of allLeads) {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;

    if (!provider) {
      categories.providerNotFound.push(lead);
      continue;
    }

    if (provider.is_active === false) {
      categories.providerArchived.push(lead);
      continue;
    }

    // Check if provider already responded
    const meta = lead.metadata || {};
    const thread = meta.thread || [];
    const hasResponded = thread.some(
      m => m.from_profile_id === lead.to_profile_id && m.is_auto_reply !== true
    );

    if (hasResponded) {
      categories.providerResponded.push(lead);
      continue;
    }

    // Check business_profiles.email
    if (provider.email) {
      categories.hasEmailInBP.push(lead);
      continue;
    }

    // Check olera-providers.email (the NEW fallback check)
    if (provider.source_provider_id && oleraEmailMap.has(provider.source_provider_id)) {
      categories.hasEmailInOlera.push({
        ...lead,
        providerName: provider.display_name,
        oleraEmail: oleraEmailMap.get(provider.source_provider_id)
      });
      continue;
    }

    // Genuinely needs email
    categories.genuinelyNeedsEmail.push({
      ...lead,
      providerName: provider.display_name
    });
  }

  console.log("\n" + "=".repeat(70));
  console.log("BREAKDOWN AFTER FIX");
  console.log("=".repeat(70));
  console.log("Provider NOT FOUND:", categories.providerNotFound.length);
  console.log("Provider ARCHIVED:", categories.providerArchived.length);
  console.log("Provider RESPONDED:", categories.providerResponded.length);
  console.log("Has email in business_profiles:", categories.hasEmailInBP.length);
  console.log("Has email in olera-providers (NEW filter):", categories.hasEmailInOlera.length);
  console.log("GENUINELY needs email:", categories.genuinelyNeedsEmail.length);

  console.log("\n" + "=".repeat(70));
  console.log("COMPARISON");
  console.log("=".repeat(70));
  const oldCount = categories.genuinelyNeedsEmail.length + categories.hasEmailInOlera.length;
  const newCount = categories.genuinelyNeedsEmail.length;
  console.log("BEFORE fix - 'needs email' count:", oldCount);
  console.log("AFTER fix - 'needs email' count:", newCount);
  console.log("Reduction:", oldCount - newCount, "leads now correctly filtered out");

  // List providers that genuinely need email
  if (categories.genuinelyNeedsEmail.length > 0 && categories.genuinelyNeedsEmail.length <= 30) {
    console.log("\n" + "=".repeat(70));
    console.log("PROVIDERS THAT GENUINELY NEED EMAIL");
    console.log("=".repeat(70));
    const uniqueProviders = [...new Set(categories.genuinelyNeedsEmail.map(l => l.providerName))];
    uniqueProviders.forEach((name, i) => {
      const count = categories.genuinelyNeedsEmail.filter(l => l.providerName === name).length;
      console.log(`${i + 1}. ${name} (${count} leads)`);
    });
  }

  // Show what's being filtered out
  if (categories.hasEmailInOlera.length > 0) {
    console.log("\n" + "=".repeat(70));
    console.log("PROVIDERS FILTERED OUT (have email in olera-providers)");
    console.log("=".repeat(70));
    const uniqueFiltered = new Map();
    categories.hasEmailInOlera.forEach(l => {
      if (!uniqueFiltered.has(l.providerName)) {
        uniqueFiltered.set(l.providerName, l.oleraEmail);
      }
    });
    Array.from(uniqueFiltered.entries()).slice(0, 20).forEach(([name, email], i) => {
      console.log(`${i + 1}. ${name}: ${email}`);
    });
    if (uniqueFiltered.size > 20) {
      console.log(`... and ${uniqueFiltered.size - 20} more`);
    }
  }
}

verify().catch(console.error);
