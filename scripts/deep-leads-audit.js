require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deepAudit() {
  console.log("=".repeat(70));
  console.log("DEEP LEADS AUDIT - Checking for email sync issues");
  console.log("=".repeat(70));

  // Get ALL leads that would show in "needs email" tab
  // (non-archived, provider has no email in business_profiles, provider is active)
  const { data: allLeads, error } = await db
    .from('connections')
    .select(`
      id,
      type,
      status,
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

  if (error) {
    console.error("Error fetching leads:", error);
    return;
  }

  // Filter to leads that APPEAR to need email (provider active, no email in business_profiles)
  const leadsNeedingEmail = allLeads.filter(lead => {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
    if (!provider) return false;
    if (provider.is_active === false) return false;

    // Check if provider already responded
    const meta = lead.metadata || {};
    const thread = meta.thread || [];
    const hasResponded = thread.some(
      m => m.from_profile_id === lead.to_profile_id && m.is_auto_reply !== true
    );
    if (hasResponded) return false;

    return !provider.email; // No email in business_profiles
  });

  console.log("\nLeads showing as 'needs email' (business_profiles.email is null):", leadsNeedingEmail.length);

  // Now check if any of these providers have emails in olera-providers
  const providerIds = [];
  const sourceProviderIds = [];

  for (const lead of leadsNeedingEmail) {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
    if (provider?.slug) providerIds.push(provider.slug);
    if (provider?.source_provider_id) sourceProviderIds.push(provider.source_provider_id);
  }

  console.log("\nChecking olera-providers for emails...");
  console.log("  Provider slugs to check:", providerIds.length);
  console.log("  Source provider IDs to check:", sourceProviderIds.length);

  // Check olera-providers by slug
  const { data: oleraBySlug } = await db
    .from('olera-providers')
    .select('slug, provider_id, email, provider_name')
    .in('slug', providerIds)
    .not('deleted', 'is', true);

  // Check olera-providers by provider_id
  const { data: oleraByProviderId } = await db
    .from('olera-providers')
    .select('slug, provider_id, email, provider_name')
    .in('provider_id', sourceProviderIds)
    .not('deleted', 'is', true);

  // Build map of olera-providers emails
  const oleraEmails = new Map();
  for (const p of oleraBySlug || []) {
    if (p.email) oleraEmails.set(p.slug, { email: p.email, name: p.provider_name, source: 'slug' });
  }
  for (const p of oleraByProviderId || []) {
    if (p.email) oleraEmails.set(p.provider_id, { email: p.email, name: p.provider_name, source: 'provider_id' });
  }

  console.log("  Found emails in olera-providers:", oleraEmails.size);

  // Find mismatches - leads where business_profiles has no email but olera-providers does
  const syncIssues = [];
  for (const lead of leadsNeedingEmail) {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
    if (!provider) continue;

    const oleraBySlugEmail = oleraEmails.get(provider.slug);
    const oleraByIdEmail = oleraEmails.get(provider.source_provider_id);
    const oleraEmail = oleraBySlugEmail || oleraByIdEmail;

    if (oleraEmail) {
      syncIssues.push({
        leadId: lead.id,
        createdAt: lead.created_at,
        providerName: provider.display_name,
        providerSlug: provider.slug,
        sourceProviderId: provider.source_provider_id,
        businessProfileEmail: provider.email,
        oleraProvidersEmail: oleraEmail.email,
        matchSource: oleraEmail.source
      });
    }
  }

  if (syncIssues.length > 0) {
    console.log("\n" + "!".repeat(70));
    console.log("SYNC ISSUES FOUND - These providers have emails in olera-providers");
    console.log("but NOT in business_profiles (the field leads check)");
    console.log("!".repeat(70));
    console.log("\nTotal sync issues:", syncIssues.length);

    syncIssues.slice(0, 20).forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.providerName}`);
      console.log(`   Lead ID: ${issue.leadId}`);
      console.log(`   Provider slug: ${issue.providerSlug}`);
      console.log(`   source_provider_id: ${issue.sourceProviderId}`);
      console.log(`   business_profiles.email: ${issue.businessProfileEmail || '(null)'}`);
      console.log(`   olera-providers.email: ${issue.oleraProvidersEmail}`);
      console.log(`   Match via: ${issue.matchSource}`);
    });

    if (syncIssues.length > 20) {
      console.log(`\n... and ${syncIssues.length - 20} more`);
    }
  } else {
    console.log("\nNo sync issues found between business_profiles and olera-providers.");
  }

  // Also check for archived providers that might still show
  const archivedProviderLeads = allLeads.filter(lead => {
    const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
    return provider && provider.is_active === false;
  });

  console.log("\n" + "=".repeat(70));
  console.log("ARCHIVED PROVIDERS CHECK");
  console.log("=".repeat(70));
  console.log("Leads to archived providers (should NOT show in needs email):", archivedProviderLeads.length);

  if (archivedProviderLeads.length > 0) {
    console.log("\nArchived provider names:");
    const uniqueArchived = new Map();
    archivedProviderLeads.forEach(lead => {
      const provider = Array.isArray(lead.to_profile) ? lead.to_profile[0] : lead.to_profile;
      if (provider && !uniqueArchived.has(provider.display_name)) {
        uniqueArchived.set(provider.display_name, {
          name: provider.display_name,
          is_active: provider.is_active,
          email: provider.email
        });
      }
    });
    uniqueArchived.forEach((p, name) => {
      console.log(`  - ${name} (is_active: ${p.is_active}, email: ${p.email || 'null'})`);
    });
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(70));
  console.log("Total leads appearing as 'needs email':", leadsNeedingEmail.length);
  console.log("  - With email in olera-providers (SYNC ISSUE):", syncIssues.length);
  console.log("  - Genuinely no email anywhere:", leadsNeedingEmail.length - syncIssues.length);
  console.log("\nLeads to archived providers (should be filtered):", archivedProviderLeads.length);
}

deepAudit().catch(console.error);
