#!/usr/bin/env node
/**
 * fix-archived-providers.js
 *
 * Migration script to fix archived_question_providers sync issues:
 *
 * Phase 1: Fix "uninterested provider" entries (70 providers)
 * - These were incorrectly archived when they should be "Not Interested"
 * - Remove from archived_question_providers
 * - Set provider_not_interested: true on their questions
 * - Restore questions to status: pending
 *
 * Phase 2: Sync truly archived providers (~104)
 * - For providers WITH business_profiles: Set admin_archived = true
 * - For providers WITHOUT business_profiles: Create minimal business_profile, then set admin_archived
 * - Map free-text reasons to standard values where possible
 * - Keep Q&A archive table entries
 *
 * Usage:
 *   DRY_RUN=true node scripts/fix-archived-providers.js  # Preview changes
 *   node scripts/fix-archived-providers.js               # Execute migration
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey);

const DRY_RUN = process.env.DRY_RUN === "true";

// Patterns that indicate "uninterested provider" (soft reject, not archive-worthy)
// IMPORTANT: Review DRY_RUN output carefully! Some patterns like "declined" might
// match legitimately archived providers (e.g., "declined because out of business").
// If you see false positives, add them to trulyArchivedEntries manually.
const UNINTERESTED_PATTERNS = [
  /uninterested/i,
  /not interested/i,
  /declined/i,
  /no longer interested/i,
  /provider declined/i,
  /does not want/i,
  /doesn't want/i,
  /opted out/i,
];

// Map free-text reasons to standard archive reasons
const REASON_MAPPING = {
  // Direct mappings
  out_of_business: "out_of_business",
  invalid_provider: "invalid_provider",
  wrong_contact_info: "wrong_contact_info",
  duplicate: "duplicate",
  relocated: "relocated",
  merged: "merged",
  inactive: "inactive",
  compliance_issue: "compliance_issue",
  provider_requested_no_emails: "provider_requested_no_emails",
  // Pattern-based mappings
};

function mapReasonToStandard(freeTextReason) {
  if (!freeTextReason) return "other";

  const lower = freeTextReason.toLowerCase().trim();

  // Direct match
  if (REASON_MAPPING[lower]) return REASON_MAPPING[lower];

  // Pattern matching
  if (/out of business|closed|permanently closed|no longer in business/i.test(lower)) {
    return "out_of_business";
  }
  if (/invalid|fake|not a real|doesn't exist|does not exist/i.test(lower)) {
    return "invalid_provider";
  }
  if (/wrong (email|contact|phone|address)|bad (email|contact)|bounced|undeliverable/i.test(lower)) {
    return "wrong_contact_info";
  }
  if (/duplicate|dupe|already exists/i.test(lower)) {
    return "duplicate";
  }
  if (/moved|relocated/i.test(lower)) {
    return "relocated";
  }
  if (/merged|acquired/i.test(lower)) {
    return "merged";
  }
  if (/inactive|no response|unreachable|unresponsive/i.test(lower)) {
    return "inactive";
  }
  if (/compliance|violation|legal/i.test(lower)) {
    return "compliance_issue";
  }
  if (/requested no (emails|contact)|asked to stop|unsubscribe/i.test(lower)) {
    return "provider_requested_no_emails";
  }

  return "other";
}

function isUninterestedReason(reason) {
  if (!reason) return false;
  return UNINTERESTED_PATTERNS.some((pattern) => pattern.test(reason));
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Fix Archived Providers Migration ${DRY_RUN ? "(DRY RUN)" : "(LIVE)"}`);
  console.log(`${"=".repeat(60)}\n`);

  // Fetch all archived_question_providers entries
  const { data: archivedProviders, error: fetchError } = await db
    .from("archived_question_providers")
    .select("*");

  if (fetchError) {
    console.error("Failed to fetch archived_question_providers:", fetchError);
    process.exit(1);
  }

  console.log(`Found ${archivedProviders.length} entries in archived_question_providers\n`);

  // Phase 1: Identify and fix "uninterested provider" entries
  const uninterestedEntries = archivedProviders.filter((p) => isUninterestedReason(p.reason));
  const trulyArchivedEntries = archivedProviders.filter((p) => !isUninterestedReason(p.reason));

  console.log(`Phase 1: ${uninterestedEntries.length} entries are "uninterested" (should be Not Interested)`);
  console.log(`Phase 2: ${trulyArchivedEntries.length} entries are truly archived (should sync admin_archived)\n`);

  // === PHASE 1: Fix "uninterested provider" entries ===
  console.log(`${"─".repeat(60)}`);
  console.log("PHASE 1: Moving 'uninterested' entries to Not Interested\n");

  let phase1Removed = 0;
  let phase1QuestionsUpdated = 0;

  for (const entry of uninterestedEntries) {
    console.log(`  Provider: ${entry.provider_id}`);
    console.log(`    Reason: ${entry.reason}`);
    console.log(`    Archived by: ${entry.archived_by} at ${entry.archived_at}`);

    // Find questions for this provider
    const { data: questions } = await db
      .from("provider_questions")
      .select("id, status, metadata")
      .eq("provider_id", entry.provider_id);

    const questionsToUpdate = (questions || []).filter(
      (q) => q.status === "archived" || q.status === "pending" || q.status === "approved"
    );

    if (!DRY_RUN) {
      // Remove from archived_question_providers
      await db.from("archived_question_providers").delete().eq("provider_id", entry.provider_id);
      phase1Removed++;

      // Update questions: restore to pending and mark as not interested
      for (const q of questionsToUpdate) {
        const meta = (q.metadata || {});
        meta.provider_not_interested = true;
        meta.not_interested_reason = entry.reason || "Migrated from archive";
        meta.not_interested_at = entry.archived_at || new Date().toISOString();
        meta.not_interested_by = entry.archived_by || "migration-script";
        meta.not_interested_notes = "Auto-migrated from archived_question_providers";

        // Remove archive markers if present
        delete meta.archive_reason;
        delete meta.archived_at;
        delete meta.archived_via;

        await db
          .from("provider_questions")
          .update({
            status: "pending",
            is_public: true,
            metadata: meta,
            updated_at: new Date().toISOString(),
          })
          .eq("id", q.id);

        phase1QuestionsUpdated++;
      }
    } else {
      console.log(`    Would update ${questionsToUpdate.length} questions to Not Interested`);
    }
    console.log("");
  }

  console.log(`Phase 1 Summary:`);
  console.log(`  Entries removed from archived_question_providers: ${DRY_RUN ? uninterestedEntries.length : phase1Removed}`);
  console.log(`  Questions moved to Not Interested: ${DRY_RUN ? "TBD" : phase1QuestionsUpdated}\n`);

  // === PHASE 2: Sync truly archived providers ===
  console.log(`${"─".repeat(60)}`);
  console.log("PHASE 2: Syncing truly archived providers to admin_archived\n");

  let phase2SyncedExisting = 0;
  let phase2CreatedNew = 0;
  let phase2AlreadySynced = 0;

  for (const entry of trulyArchivedEntries) {
    const standardReason = mapReasonToStandard(entry.reason);
    const providerId = entry.provider_id;

    console.log(`  Provider: ${providerId}`);
    console.log(`    Original reason: ${entry.reason || "(none)"}`);
    console.log(`    Mapped to: ${standardReason}`);

    // Check if business_profiles exists (try by slug first)
    let { data: bp } = await db
      .from("business_profiles")
      .select("id, slug, metadata")
      .eq("slug", providerId)
      .maybeSingle();

    // Also try by source_provider_id
    if (!bp) {
      const { data: bpBySource } = await db
        .from("business_profiles")
        .select("id, slug, metadata")
        .eq("source_provider_id", providerId)
        .maybeSingle();
      bp = bpBySource;
    }

    if (bp) {
      const meta = (bp.metadata || {});

      if (meta.admin_archived) {
        console.log(`    Already has admin_archived = true`);
        phase2AlreadySynced++;
      } else {
        console.log(`    Setting admin_archived = true on existing business_profile`);

        if (!DRY_RUN) {
          meta.admin_archived = true;
          meta.admin_archived_at = entry.archived_at || new Date().toISOString();
          meta.admin_archived_by = entry.archived_by || "migration-script";
          meta.admin_archived_reason = standardReason;
          meta.admin_archived_notes = entry.notes || (entry.reason !== standardReason ? entry.reason : null);

          await db
            .from("business_profiles")
            .update({ metadata: meta, updated_at: new Date().toISOString() })
            .eq("id", bp.id);
        }
        phase2SyncedExisting++;
      }
    } else {
      // No business_profile - check olera-providers and create minimal record
      // Try by slug first, then by provider_id (safer than using .or() with string interpolation)
      let { data: oleraProvider } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, slug, city, state, email, phone")
        .eq("slug", providerId)
        .maybeSingle();

      if (!oleraProvider) {
        const { data: oleraByProviderId } = await db
          .from("olera-providers")
          .select("provider_id, provider_name, slug, city, state, email, phone")
          .eq("provider_id", providerId)
          .maybeSingle();
        oleraProvider = oleraByProviderId;
      }

      if (oleraProvider) {
        console.log(`    Creating minimal business_profile from olera-providers`);

        if (!DRY_RUN) {
          const nowIso = new Date().toISOString();
          const slug = oleraProvider.slug || providerId;

          const { error: insertError } = await db.from("business_profiles").insert({
            type: "organization",
            display_name: oleraProvider.provider_name,
            slug: slug,
            source_provider_id: oleraProvider.provider_id,
            city: oleraProvider.city || null,
            state: oleraProvider.state || null,
            email: oleraProvider.email || null,
            phone: oleraProvider.phone || null,
            is_active: true,
            metadata: {
              admin_archived: true,
              admin_archived_at: entry.archived_at || nowIso,
              admin_archived_by: entry.archived_by || "migration-script",
              admin_archived_reason: standardReason,
              admin_archived_notes: entry.notes || (entry.reason !== standardReason ? entry.reason : null),
              created_from_archive_migration: true,
            },
            created_at: nowIso,
            updated_at: nowIso,
          });

          if (insertError) {
            console.log(`    Failed to create business_profile: ${insertError.message}`);
          } else {
            phase2CreatedNew++;
          }
        } else {
          phase2CreatedNew++;
        }
      } else {
        console.log(`    No olera-providers record found - skipping`);
      }
    }
    console.log("");
  }

  console.log(`Phase 2 Summary:`);
  console.log(`  Already synced (had admin_archived): ${phase2AlreadySynced}`);
  console.log(`  Updated existing business_profiles: ${phase2SyncedExisting}`);
  console.log(`  Created new business_profiles: ${phase2CreatedNew}`);

  // === FINAL SUMMARY ===
  console.log(`\n${"=".repeat(60)}`);
  console.log("MIGRATION COMPLETE");
  console.log(`${"=".repeat(60)}`);
  console.log(`\nPhase 1 (Uninterested → Not Interested):`);
  console.log(`  - ${uninterestedEntries.length} providers moved from archive to Not Interested`);
  console.log(`\nPhase 2 (Archive Sync):`);
  console.log(`  - ${phase2AlreadySynced} providers already synced`);
  console.log(`  - ${phase2SyncedExisting} existing business_profiles updated`);
  console.log(`  - ${phase2CreatedNew} new business_profiles created`);

  if (DRY_RUN) {
    console.log(`\nThis was a DRY RUN. No changes were made.`);
    console.log(`Run without DRY_RUN=true to execute the migration.`);
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
