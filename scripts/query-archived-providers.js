#!/usr/bin/env node
/**
 * Query archived_question_providers and check sync with business_profiles.admin_archived
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Query archived_question_providers
  console.log("=== ARCHIVED QUESTION PROVIDERS ===\n");
  const { data: archived, error: err1 } = await supabase
    .from('archived_question_providers')
    .select('provider_id, reason, notes, archived_by, archived_at')
    .order('archived_at', { ascending: false });

  if (err1) {
    console.error("Error:", err1.message);
    return;
  }

  const total = archived ? archived.length : 0;
  console.log("Total: " + total + " providers\n");

  if (total === 0) {
    console.log("No providers in archived_question_providers table.");
    return;
  }

  // Group by reason
  const byReason = {};
  for (const p of archived) {
    const r = p.reason || '(no reason)';
    if (!byReason[r]) byReason[r] = [];
    byReason[r].push(p);
  }

  console.log("=== BY REASON ===");
  for (const [reason, providers] of Object.entries(byReason)) {
    console.log("\n" + reason + ": " + providers.length + " providers");
    for (const p of providers.slice(0, 5)) {
      const date = p.archived_at ? p.archived_at.split('T')[0] : 'unknown';
      const notes = p.notes ? " [" + p.notes + "]" : "";
      console.log("  - " + p.provider_id + " (" + date + ")" + notes);
    }
    if (providers.length > 5) {
      console.log("  ... and " + (providers.length - 5) + " more");
    }
  }

  // Check which have admin_archived in business_profiles
  console.log("\n\n=== CHECKING SYNC WITH business_profiles.admin_archived ===\n");

  const providerIds = archived.map(p => p.provider_id);

  const { data: bpWithArchived, error: err2 } = await supabase
    .from('business_profiles')
    .select('slug, display_name, metadata')
    .in('slug', providerIds);

  if (err2) {
    console.error("Error fetching business_profiles:", err2.message);
    return;
  }

  const adminArchivedSet = new Set();
  const bpBySlug = {};
  for (const bp of bpWithArchived || []) {
    const meta = bp.metadata || {};
    bpBySlug[bp.slug] = bp;
    if (meta.admin_archived === true) {
      adminArchivedSet.add(bp.slug);
    }
  }

  const inQuestionsArchiveOnly = providerIds.filter(id => !adminArchivedSet.has(id));
  const inBoth = providerIds.filter(id => adminArchivedSet.has(id));

  console.log("In archived_question_providers only (NOT admin_archived): " + inQuestionsArchiveOnly.length);
  console.log("In BOTH (properly synced): " + inBoth.length);

  if (inQuestionsArchiveOnly.length > 0) {
    console.log("\n--- Providers in Questions archive but NOT admin_archived ---");
    for (const id of inQuestionsArchiveOnly) {
      const p = archived.find(a => a.provider_id === id);
      const bp = bpBySlug[id];
      const name = bp ? bp.display_name : '(no business_profile)';
      console.log("  - " + id);
      console.log("    Name: " + name);
      console.log("    Reason: " + (p.reason || '(none)'));
      console.log("    Notes: " + (p.notes || '(none)'));
      console.log("    Archived by: " + (p.archived_by || '(unknown)'));
      console.log("    Archived at: " + (p.archived_at ? p.archived_at.split('T')[0] : '(unknown)'));
      console.log("");
    }
  }

  if (inBoth.length > 0) {
    console.log("\n--- Providers properly synced (in both) ---");
    for (const id of inBoth) {
      const p = archived.find(a => a.provider_id === id);
      const bp = bpBySlug[id];
      const meta = bp ? bp.metadata : {};
      console.log("  - " + id);
      console.log("    Name: " + (bp ? bp.display_name : '(unknown)'));
      console.log("    Q&A Reason: " + (p.reason || '(none)'));
      console.log("    admin_archived_reason: " + (meta.admin_archived_reason || '(none)'));
      console.log("");
    }
  }
}

main().catch(console.error);
