require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  console.log("=".repeat(60));
  console.log("COMPREHENSIVE LEADS VERIFICATION");
  console.log("=".repeat(60));

  // Get ALL leads (connections of type inquiry/request, non-archived)
  const { data: allLeads, error } = await db
    .from('connections')
    .select(`
      id,
      type,
      status,
      message,
      metadata,
      created_at,
      to_profile_id,
      to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, email, is_active, slug)
    `)
    .in('type', ['inquiry', 'request'])
    .not('metadata', 'cs', JSON.stringify({ archived: true }))
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) {
    console.error("Error fetching leads:", error);
    return;
  }

  console.log("\n1. TOTAL LEADS (non-archived inquiry/request):", allLeads.length);

  // Helper to check if provider needs email (same logic as route)
  const providerNeedsEmail = (conn) => {
    const provider = Array.isArray(conn.to_profile) ? conn.to_profile[0] : conn.to_profile;
    if (!provider || provider.is_active === false) return false;
    const meta = conn.metadata || {};
    const thread = meta.thread || [];
    const hasResponded = thread.some(
      (m) => m.from_profile_id === conn.to_profile_id && m.is_auto_reply !== true
    );
    if (hasResponded) return false;
    return !provider.email;
  };

  // Categorize leads
  const categories = {
    providerNotFound: [],       // to_profile is null
    providerArchived: [],       // is_active === false
    providerHasEmail: [],       // provider has email
    providerResponded: [],      // provider already responded
    providerNeedsEmail: []      // truly needs email
  };

  for (const lead of allLeads) {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;

    if (!provider) {
      categories.providerNotFound.push(lead);
    } else if (provider.is_active === false) {
      categories.providerArchived.push({ ...lead, providerName: provider.display_name });
    } else {
      const meta = lead.metadata || {};
      const thread = meta.thread || [];
      const hasResponded = thread.some(
        (m) => m.from_profile_id === lead.to_profile_id && m.is_auto_reply !== true
      );

      if (hasResponded) {
        categories.providerResponded.push({ ...lead, providerName: provider.display_name });
      } else if (provider.email) {
        categories.providerHasEmail.push({ ...lead, providerName: provider.display_name, email: provider.email });
      } else {
        categories.providerNeedsEmail.push({ ...lead, providerName: provider.display_name });
      }
    }
  }

  console.log("\n2. LEAD BREAKDOWN");
  console.log("   Provider NOT FOUND (no business_profile):", categories.providerNotFound.length);
  console.log("   Provider ARCHIVED (is_active=false):", categories.providerArchived.length);
  console.log("   Provider HAS EMAIL:", categories.providerHasEmail.length);
  console.log("   Provider RESPONDED:", categories.providerResponded.length);
  console.log("   Provider NEEDS EMAIL:", categories.providerNeedsEmail.length);

  // Show details for NOT FOUND providers
  if (categories.providerNotFound.length > 0) {
    console.log("\n   === Leads where provider NOT FOUND ===");
    console.log("   (These are leads to providers not in business_profiles)");
    const sample = categories.providerNotFound.slice(0, 5);
    sample.forEach(lead => {
      console.log("     - Lead ID:", lead.id);
      console.log("       to_profile_id:", lead.to_profile_id);
      console.log("       Created:", lead.created_at);
    });
    if (categories.providerNotFound.length > 5) {
      console.log("     ... and", categories.providerNotFound.length - 5, "more");
    }
  }

  // Show details for ARCHIVED providers
  if (categories.providerArchived.length > 0) {
    console.log("\n   === Leads to ARCHIVED providers ===");
    const uniqueArchived = [...new Set(categories.providerArchived.map(l => l.providerName))];
    uniqueArchived.slice(0, 10).forEach(name => {
      const count = categories.providerArchived.filter(l => l.providerName === name).length;
      console.log("     -", name, ":", count, "leads");
    });
    if (uniqueArchived.length > 10) {
      console.log("     ... and", uniqueArchived.length - 10, "more providers");
    }
  }

  // Double-check using the same logic as the route
  const needsEmailCount = allLeads.filter(providerNeedsEmail).length;

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  console.log("What admin 'needs email' tab will show:", needsEmailCount);
  console.log("(This should match 'Provider NEEDS EMAIL' above)");

  console.log("\nWhat gets FILTERED OUT from 'needs email':");
  console.log("  - Provider not found:", categories.providerNotFound.length);
  console.log("  - Provider archived:", categories.providerArchived.length);
  console.log("  - Provider has email:", categories.providerHasEmail.length);
  console.log("  - Provider responded:", categories.providerResponded.length);
  console.log("  - TOTAL filtered:",
    categories.providerNotFound.length +
    categories.providerArchived.length +
    categories.providerHasEmail.length +
    categories.providerResponded.length
  );

  // Verify counts match
  const calculatedNeedsEmail = categories.providerNeedsEmail.length;
  if (calculatedNeedsEmail === needsEmailCount) {
    console.log("\n✓ Counts match! The leads filtering is working correctly.");
  } else {
    console.log("\n✗ COUNT MISMATCH!");
    console.log("  Categorized:", calculatedNeedsEmail);
    console.log("  Route logic:", needsEmailCount);
  }

  // Show unique providers needing email
  const uniqueProvidersNeedingEmail = [...new Set(categories.providerNeedsEmail.map(l => l.providerName))];
  console.log("\nUnique providers in 'needs email':", uniqueProvidersNeedingEmail.length);
  if (uniqueProvidersNeedingEmail.length <= 20) {
    console.log("Provider names:");
    uniqueProvidersNeedingEmail.forEach(name => console.log("  -", name));
  }
}

verify().catch(console.error);
