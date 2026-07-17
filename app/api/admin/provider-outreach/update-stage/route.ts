import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { OUTREACH_STAGES, type OutreachStage } from "../route";
import {
  enrollProviderIntoCampaign,
  generateCampaignName,
  type ProviderOutreachRow,
  type EnrollResult,
} from "@/lib/provider-outreach/smartlead-enrollment";

/**
 * POST /api/admin/provider-outreach/update-stage
 *
 * Move provider(s) to a different stage.
 *
 * Body:
 *   - provider_ids: string[] (required) - List of provider IDs to update
 *   - stage: OutreachStage (required) - Target stage
 *   - reason?: string - Standardized reason code (required for archive/unarchive)
 *   - notes?: string - Optional notes to set/append
 *
 * Creates tracking rows if they don't exist, updates if they do.
 *
 * For stage = "archived":
 *   - Syncs with system-wide archive (business_profiles.metadata.admin_archived)
 *   - Writes to archived_question_providers table
 *   - Stops connection followup sequences
 *
 * For moving FROM "archived" to another stage:
 *   - Clears admin_archived from business_profiles
 *   - Removes from archived_question_providers
 *   - Clears followup_stopped_reason from connections
 */

// Standardized archive reasons (same as Questions/Connections)
const VALID_ARCHIVE_REASONS = [
  "provider_requested_no_emails",
  "inactive",
  "inactive_multiple_attempts",
  "uninterested_provider",
  "fax_only",
  "duplicate",
  "out_of_business",
  "invalid_provider",
  "wrong_contact_info",
  "relocated",
  "compliance_issue",
  "merged",
  "other",
] as const;

const VALID_UNARCHIVE_REASONS = [
  "archived_in_error",
  "provider_now_interested",
  "provider_now_wants_contact",
  "business_confirmed_operating",
  "provider_verified_valid",
  "not_a_duplicate",
  "provider_existence_verified",
  "provider_now_responsive",
  "email_obtained",
  "new_contact_info_obtained",
  "compliance_resolved",
  "not_merged",
  "other",
] as const;

type ArchiveReason = (typeof VALID_ARCHIVE_REASONS)[number];
type UnarchiveReason = (typeof VALID_UNARCHIVE_REASONS)[number];
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { provider_ids, stage, reason, notes } = body;

    if (!provider_ids || !Array.isArray(provider_ids) || provider_ids.length === 0) {
      return NextResponse.json({ error: "provider_ids array is required" }, { status: 400 });
    }

    if (!stage || !OUTREACH_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Valid stage is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Get provider details for city/state denormalization and archive sync
    const { data: providers, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, city, state, slug, email, phone")
      .in("provider_id", provider_ids);

    if (provError) {
      console.error("[provider-outreach/update-stage] Provider query error:", provError);
      return NextResponse.json({ error: "Failed to fetch provider details" }, { status: 500 });
    }

    if (!providers || providers.length === 0) {
      return NextResponse.json({ error: "No valid providers found" }, { status: 404 });
    }

    const providerMap = new Map(providers.map((p) => [p.provider_id, p]));

    // Check which providers already have tracking rows
    const { data: existingTracking } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, id, stage, smartlead_campaign_id, smartlead_lead_id")
      .in("provider_id", provider_ids);

    const existingMap = new Map((existingTracking || []).map((t) => [t.provider_id, t]));

    // Detect archive/unarchive scenarios
    const isArchiving = stage === "archived";

    // Find providers that are currently archived and being moved to a different stage
    // Check BOTH tracking table AND system-wide archive (business_profiles.admin_archived)
    const providersBeingUnarchived: string[] = [];

    // First, check tracking table for archived/not_interested
    for (const pid of provider_ids) {
      const existing = existingMap.get(pid);
      if (existing && (existing.stage === "archived" || existing.stage === "not_interested") && stage !== "archived") {
        providersBeingUnarchived.push(pid);
      }
    }

    // Also check for system-archived providers (archived from Questions/Connections)
    // These may not have tracking rows but have admin_archived=true in business_profiles
    if (stage !== "archived") {
      const providerIdsToCheck = provider_ids.filter((pid) => !providersBeingUnarchived.includes(pid));
      if (providerIdsToCheck.length > 0) {
        const { data: systemArchivedBps } = await db
          .from("business_profiles")
          .select("source_provider_id")
          .in("source_provider_id", providerIdsToCheck)
          .filter("metadata->>admin_archived", "eq", "true");

        if (systemArchivedBps) {
          for (const bp of systemArchivedBps) {
            if (bp.source_provider_id && !providersBeingUnarchived.includes(bp.source_provider_id)) {
              providersBeingUnarchived.push(bp.source_provider_id);
            }
          }
        }
      }
    }

    const isUnarchiving = providersBeingUnarchived.length > 0;

    // Validate reason for archive/unarchive
    if (isArchiving) {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for archiving" }, { status: 400 });
      }
      if (!VALID_ARCHIVE_REASONS.includes(reason as ArchiveReason)) {
        return NextResponse.json(
          { error: `Invalid archive reason. Must be one of: ${VALID_ARCHIVE_REASONS.join(", ")}` },
          { status: 400 }
        );
      }
      if (reason === "other" && !notes?.trim()) {
        return NextResponse.json({ error: "Notes are required when reason is 'other'" }, { status: 400 });
      }
    }

    if (isUnarchiving) {
      if (!reason) {
        return NextResponse.json({ error: "Reason is required for unarchiving" }, { status: 400 });
      }
      if (!VALID_UNARCHIVE_REASONS.includes(reason as UnarchiveReason)) {
        return NextResponse.json(
          { error: `Invalid unarchive reason. Must be one of: ${VALID_UNARCHIVE_REASONS.join(", ")}` },
          { status: 400 }
        );
      }
      if (reason === "other" && !notes?.trim()) {
        return NextResponse.json({ error: "Notes are required when reason is 'other'" }, { status: 400 });
      }
    }

    const nowIso = new Date().toISOString();
    const adminEmail = user.email ?? adminUser.id;

    // Separate into updates and inserts
    const toUpdate: { id: string; provider_id: string; oldStage: string }[] = [];
    const toInsert: {
      provider_id: string;
      stage: OutreachStage;
      city: string | null;
      state: string | null;
      notes: string | null;
      sequence_started_at?: string;
      claimed_at?: string;
    }[] = [];

    for (const providerId of provider_ids) {
      const providerDetails = providerMap.get(providerId);
      if (!providerDetails) continue;

      const existing = existingMap.get(providerId);
      if (existing) {
        toUpdate.push({ id: existing.id, provider_id: providerId, oldStage: existing.stage });
      } else {
        // For archive/unarchive, combine reason + notes (consistent with update logic)
        let insertNotes: string | null = notes || null;
        if ((isArchiving || isUnarchiving) && reason) {
          insertNotes = notes?.trim() ? `${reason} - ${notes.trim()}` : reason;
        }

        const insertRow: typeof toInsert[number] = {
          provider_id: providerId,
          stage: stage as OutreachStage,
          city: providerDetails.city,
          state: providerDetails.state,
          notes: insertNotes,
        };

        // Set sequence_started_at for new in_sequence entries
        if (stage === "in_sequence") {
          insertRow.sequence_started_at = nowIso;
        }

        // Set claimed_at for new claimed entries
        if (stage === "claimed") {
          insertRow.claimed_at = nowIso;
        }

        toInsert.push(insertRow);
      }
    }

    // Perform updates
    if (toUpdate.length > 0) {
      const updateIds = toUpdate.map((t) => t.id);
      const updateData: { stage: OutreachStage; stage_changed_at: string; notes?: string | null } = {
        stage: stage as OutreachStage,
        stage_changed_at: nowIso,
      };
      if (notes !== undefined) {
        // For archive/unarchive, combine reason + notes
        if (isArchiving || isUnarchiving) {
          updateData.notes = reason ? `${reason}${notes?.trim() ? ` - ${notes.trim()}` : ""}` : notes;
        } else {
          updateData.notes = notes;
        }
      }

      const { error: updateError } = await db
        .from("provider_outreach_tracking")
        .update(updateData)
        .in("id", updateIds);

      if (updateError) {
        console.error("[provider-outreach/update-stage] Update error:", updateError);
        return NextResponse.json({ error: "Failed to update tracking records" }, { status: 500 });
      }
    }

    // Perform inserts
    if (toInsert.length > 0) {
      const { error: insertError } = await db
        .from("provider_outreach_tracking")
        .insert(toInsert);

      if (insertError) {
        console.error("[provider-outreach/update-stage] Insert error:", insertError);
        return NextResponse.json({ error: "Failed to create tracking records" }, { status: 500 });
      }
    }

    // ── SmartLead Enrollment: Enroll providers when moving to in_sequence ──
    let smartleadEnrolled = 0;
    let smartleadSkipped = 0;
    const smartleadErrors: { providerId: string; error: string }[] = [];

    if (stage === "in_sequence") {
      // Get fresh tracking rows with IDs (needed for tracking_id in claim URLs)
      const { data: freshTracking } = await db
        .from("provider_outreach_tracking")
        .select("id, provider_id, smartlead_campaign_id")
        .in("provider_id", provider_ids);

      const trackingIdMap = new Map(
        (freshTracking || []).map((t) => [t.provider_id, { id: t.id, campaignId: t.smartlead_campaign_id }])
      );

      // Find existing campaign for this city (reuse if available)
      // Group providers by city to batch campaign lookups
      const providersByCity = new Map<string, typeof providers>();
      for (const p of providers) {
        if (!p.city || !p.state) continue;
        const key = `${p.city}|${p.state}`;
        if (!providersByCity.has(key)) providersByCity.set(key, []);
        providersByCity.get(key)!.push(p);
      }

      // For each city, find existing campaign from other enrolled providers
      const cityCampaignMap = new Map<string, number>();
      for (const [cityKey] of providersByCity) {
        const [city, state] = cityKey.split("|");
        const { data: existingCampaign } = await db
          .from("provider_outreach_tracking")
          .select("smartlead_campaign_id")
          .eq("city", city)
          .eq("state", state)
          .not("smartlead_campaign_id", "is", null)
          .limit(1)
          .maybeSingle();

        if (existingCampaign?.smartlead_campaign_id) {
          cityCampaignMap.set(cityKey, existingCampaign.smartlead_campaign_id);
        }
      }

      // Enroll each provider
      for (const provider of providers) {
        const trackingInfo = trackingIdMap.get(provider.provider_id);
        if (!trackingInfo) continue;

        // Skip if already enrolled
        if (trackingInfo.campaignId) {
          smartleadSkipped++;
          continue;
        }

        // Skip if no email
        if (!provider.email?.trim()) {
          smartleadSkipped++;
          continue;
        }

        // Skip if no city (can't create campaign name)
        if (!provider.city?.trim() || !provider.state?.trim()) {
          smartleadSkipped++;
          continue;
        }

        const cityKey = `${provider.city}|${provider.state}`;
        const existingCampaignId = cityCampaignMap.get(cityKey) ?? null;

        const enrollRow: ProviderOutreachRow = {
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          email: provider.email,
          city: provider.city,
          state: provider.state,
          slug: provider.slug,
          tracking_id: trackingInfo.id,
        };

        try {
          const result: EnrollResult = await enrollProviderIntoCampaign({
            provider: enrollRow,
            campaignName: generateCampaignName(provider.city, provider.state),
            existingCampaignId,
          });

          if (result.enrolled && result.campaign_id) {
            // Update tracking row with SmartLead data
            const { error: updateErr } = await db
              .from("provider_outreach_tracking")
              .update({
                smartlead_campaign_id: result.campaign_id,
                // Note: smartlead_lead_id would come from addLeads response,
                // but SmartLead API doesn't return it directly. We'll get it
                // from webhook or subsequent API call if needed.
              })
              .eq("id", trackingInfo.id);

            if (updateErr) {
              console.error(`[provider-outreach] Failed to update tracking for ${provider.provider_id}:`, updateErr);
              smartleadErrors.push({ providerId: provider.provider_id, error: "Failed to save campaign ID" });
            } else {
              smartleadEnrolled++;
              // Update the city campaign map so subsequent providers reuse this campaign
              if (result.created) {
                cityCampaignMap.set(cityKey, result.campaign_id);
              }
            }
          } else if (result.skipped_reason) {
            smartleadSkipped++;
          } else if (result.errors.length > 0) {
            const errorMsg = result.errors.map((e) => `${e.stage}: ${e.message}`).join("; ");
            console.error(`[provider-outreach] SmartLead enrollment failed for ${provider.provider_id}:`, errorMsg);
            smartleadErrors.push({ providerId: provider.provider_id, error: errorMsg });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error(`[provider-outreach] SmartLead enrollment exception for ${provider.provider_id}:`, err);
          smartleadErrors.push({ providerId: provider.provider_id, error: errorMsg });
        }
      }

      if (smartleadEnrolled > 0 || smartleadErrors.length > 0) {
        console.log(
          `[provider-outreach/update-stage] SmartLead enrollment: ${smartleadEnrolled} enrolled, ` +
          `${smartleadSkipped} skipped, ${smartleadErrors.length} failed`
        );
      }
    }

    // ── Archive Sync: Sync with system-wide archive ──
    let connectionsAffected = 0;
    let businessProfilesUpdated = 0;
    let archivedQuestionProvidersUpdated = 0;
    let questionsRestored = 0;
    const syncErrors: { providerId: string; step: string; error: string }[] = [];

    if (isArchiving) {
      // Archiving: sync each provider to system-wide archive
      for (const providerId of provider_ids) {
        const provider = providers.find((p) => p.provider_id === providerId);
        if (!provider) continue;

        // Build variant set for this provider (provider_id, slug)
        const variantSet = new Set<string>([providerId]);
        if (provider.slug) variantSet.add(provider.slug);

        // Look for linked business_profile
        let businessProfileId: string | null = null;

        // Strategy 1: Check by source_provider_id
        const { data: linkedBp } = await db
          .from("business_profiles")
          .select("id, slug, source_provider_id, metadata")
          .eq("source_provider_id", providerId)
          .maybeSingle();

        if (linkedBp) {
          businessProfileId = linkedBp.id;
          if (linkedBp.slug) variantSet.add(linkedBp.slug);
          if (linkedBp.source_provider_id) variantSet.add(linkedBp.source_provider_id);

          // Update existing business_profile with admin_archived
          const meta = (linkedBp.metadata as Record<string, unknown>) ?? {};
          meta.admin_archived = true;
          meta.admin_archived_at = nowIso;
          meta.admin_archived_by = adminEmail;
          meta.admin_archived_reason = reason;
          meta.admin_archived_notes = notes?.trim() || null;

          const { error: updateErr } = await db
            .from("business_profiles")
            .update({ metadata: meta, updated_at: nowIso })
            .eq("id", businessProfileId);

          if (!updateErr) {
            businessProfilesUpdated++;
          } else {
            syncErrors.push({ providerId, step: "business_profiles_update", error: updateErr.message });
          }
        } else {
          // No business_profile exists - create a minimal one
          const slug = provider.slug || providerId;
          const { data: newBp, error: insertErr } = await db
            .from("business_profiles")
            .insert({
              type: "organization",
              display_name: provider.provider_name,
              slug: slug,
              source_provider_id: providerId,
              city: provider.city || null,
              state: provider.state || null,
              email: provider.email || null,
              phone: provider.phone || null,
              is_active: true,
              metadata: {
                admin_archived: true,
                admin_archived_at: nowIso,
                admin_archived_by: adminEmail,
                admin_archived_reason: reason,
                admin_archived_notes: notes?.trim() || null,
                created_from_outreach_archive: true,
              },
              created_at: nowIso,
              updated_at: nowIso,
            })
            .select("id")
            .single();

          if (!insertErr && newBp) {
            businessProfileId = newBp.id;
            businessProfilesUpdated++;
          } else if (insertErr) {
            // Slug collision or other issue - track but continue (non-blocking for archive)
            console.error(`[provider-outreach/update-stage] Failed to create business_profile for ${providerId}:`, insertErr);
            syncErrors.push({ providerId, step: "business_profiles_insert", error: insertErr.message });
          }
        }

        // Write to archived_question_providers (all variants)
        const variants = Array.from(variantSet);
        const { error: supErr } = await db.from("archived_question_providers").upsert(
          variants.map((id) => ({
            provider_id: id,
            reason,
            notes: notes?.trim() || null,
            archived_by: adminEmail,
            archived_at: nowIso,
          })),
          { onConflict: "provider_id" }
        );

        if (!supErr) {
          archivedQuestionProvidersUpdated += variants.length;
        } else {
          // This is critical - new questions won't be blocked without this
          console.error(`[provider-outreach/update-stage] Failed to upsert archived_question_providers for ${providerId}:`, supErr);
          syncErrors.push({ providerId, step: "archived_question_providers", error: supErr.message });
        }

        // Stop connection followup sequences
        if (businessProfileId) {
          const { data: connections } = await db
            .from("connections")
            .select("id, metadata")
            .eq("to_profile_id", businessProfileId)
            .eq("type", "inquiry");

          if (connections && connections.length > 0) {
            for (const conn of connections) {
              const connMeta = (conn.metadata as Record<string, unknown>) ?? {};
              if (!connMeta.followup_stopped_at) {
                const updatedConnMeta = {
                  ...connMeta,
                  followup_stopped_at: nowIso,
                  followup_stopped_reason: "provider_admin_archived",
                };
                const { error: connUpdateError } = await db
                  .from("connections")
                  .update({ metadata: updatedConnMeta })
                  .eq("id", conn.id);
                if (!connUpdateError) connectionsAffected++;
              }
            }
          }
        }
      }

      console.log(
        `[provider-outreach/update-stage] Archived ${provider_ids.length} provider(s), ` +
        `updated ${businessProfilesUpdated} business_profiles, ` +
        `${archivedQuestionProvidersUpdated} archived_question_providers rows, ` +
        `stopped ${connectionsAffected} followup sequences`
      );
    }

    if (isUnarchiving) {
      // Unarchiving: clear system-wide archive flags
      for (const providerId of providersBeingUnarchived) {
        const provider = providers.find((p) => p.provider_id === providerId);
        if (!provider) continue;

        // Build variant set for this provider
        const variantSet = new Set<string>([providerId]);
        if (provider.slug) variantSet.add(provider.slug);

        // Find linked business_profile
        const { data: linkedBp } = await db
          .from("business_profiles")
          .select("id, slug, source_provider_id, metadata")
          .eq("source_provider_id", providerId)
          .maybeSingle();

        if (linkedBp) {
          if (linkedBp.slug) variantSet.add(linkedBp.slug);
          if (linkedBp.source_provider_id) variantSet.add(linkedBp.source_provider_id);

          // Clear admin_archived from metadata
          const meta = (linkedBp.metadata as Record<string, unknown>) ?? {};
          delete meta.admin_archived;
          delete meta.admin_archived_at;
          delete meta.admin_archived_by;
          delete meta.admin_archived_reason;
          delete meta.admin_archived_notes;
          // Add unarchive tracking
          meta.admin_unarchived_at = nowIso;
          meta.admin_unarchived_by = adminEmail;
          meta.admin_unarchived_reason = reason;
          meta.admin_unarchived_notes = notes?.trim() || null;

          const { error: updateErr } = await db
            .from("business_profiles")
            .update({ metadata: meta, updated_at: nowIso })
            .eq("id", linkedBp.id);

          if (!updateErr) {
            businessProfilesUpdated++;
          } else {
            syncErrors.push({ providerId, step: "business_profiles_unarchive", error: updateErr.message });
          }

          // Clear followup_stopped_reason from connections
          const { data: connections } = await db
            .from("connections")
            .select("id, metadata")
            .eq("to_profile_id", linkedBp.id)
            .eq("type", "inquiry");

          if (connections && connections.length > 0) {
            for (const conn of connections) {
              const connMeta = (conn.metadata as Record<string, unknown>) ?? {};
              if (connMeta.followup_stopped_reason === "provider_admin_archived") {
                const updatedConnMeta = { ...connMeta };
                delete updatedConnMeta.followup_stopped_at;
                delete updatedConnMeta.followup_stopped_reason;
                const { error: connUpdateError } = await db
                  .from("connections")
                  .update({ metadata: updatedConnMeta })
                  .eq("id", conn.id);
                if (!connUpdateError) connectionsAffected++;
              }
            }
          }
        }

        // Remove from archived_question_providers
        const variants = Array.from(variantSet);
        const { error: delErr } = await db
          .from("archived_question_providers")
          .delete()
          .in("provider_id", variants);

        if (!delErr) {
          archivedQuestionProvidersUpdated += variants.length;
        } else {
          // This is critical - provider will still be blocked from receiving questions
          console.error(`[provider-outreach/update-stage] Failed to delete archived_question_providers for ${providerId}:`, delErr);
          syncErrors.push({ providerId, step: "archived_question_providers_delete", error: delErr.message });
        }

        // Restore ALL archived questions for this provider back to pending
        // This ensures parity with Questions page unarchive behavior
        const { data: archivedQuestions } = await db
          .from("provider_questions")
          .select("id, metadata")
          .in("provider_id", variants)
          .eq("status", "archived");

        if (archivedQuestions && archivedQuestions.length > 0) {
          for (const q of archivedQuestions) {
            const meta = (q.metadata as Record<string, unknown>) ?? {};
            // Clear archive-related metadata
            delete meta.archive_reason;
            delete meta.archived_at;
            delete meta.archived_via;
            // Add unarchive tracking
            meta.unarchived_at = nowIso;
            meta.unarchived_by = adminEmail;
            meta.unarchived_reason = reason;
            meta.unarchived_via = "provider_outreach";

            const { error: restoreErr } = await db
              .from("provider_questions")
              .update({ status: "pending", is_public: true, metadata: meta, updated_at: nowIso })
              .eq("id", q.id);

            if (!restoreErr) {
              questionsRestored++;
            } else {
              syncErrors.push({ providerId, step: "question_restore", error: restoreErr.message });
            }
          }
        }
      }

      console.log(
        `[provider-outreach/update-stage] Unarchived ${providersBeingUnarchived.length} provider(s), ` +
        `updated ${businessProfilesUpdated} business_profiles, ` +
        `removed ${archivedQuestionProvidersUpdated} archived_question_providers rows, ` +
        `resumed ${connectionsAffected} followup sequences, ` +
        `restored ${questionsRestored} questions`
      );
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "update_provider_outreach_stage",
      targetType: "provider_outreach",
      targetId: provider_ids.join(","),
      details: {
        provider_ids,
        new_stage: stage,
        reason: reason || null,
        notes: notes || null,
        updated_count: toUpdate.length,
        inserted_count: toInsert.length,
        is_archiving: isArchiving,
        is_unarchiving: isUnarchiving,
        connections_affected: connectionsAffected,
        business_profiles_updated: businessProfilesUpdated,
        questions_restored: questionsRestored,
        sync_errors: syncErrors.length > 0 ? syncErrors : undefined,
        // SmartLead enrollment (when moving to in_sequence)
        smartlead_enrolled: smartleadEnrolled,
        smartlead_skipped: smartleadSkipped,
        smartlead_errors: smartleadErrors.length > 0 ? smartleadErrors : undefined,
      },
    });

    // Build warnings array
    const warnings: string[] = [];

    // Archive/unarchive sync errors
    if (syncErrors.length > 0) {
      const archiveCriticalErrors = syncErrors.filter(e => e.step === "archived_question_providers");
      const unarchiveCriticalErrors = syncErrors.filter(e => e.step === "archived_question_providers_delete");

      if (archiveCriticalErrors.length > 0) {
        warnings.push(`Archive incomplete: ${archiveCriticalErrors.length} provider(s) not added to question block list.`);
      } else if (unarchiveCriticalErrors.length > 0) {
        warnings.push(`Unarchive incomplete: ${unarchiveCriticalErrors.length} provider(s) not removed from question block list.`);
      } else {
        const actionWord = isArchiving ? "Archive" : "Unarchive";
        warnings.push(`${actionWord} completed with ${syncErrors.length} non-critical sync error(s).`);
      }
    }

    // SmartLead enrollment errors (non-blocking but informative)
    if (smartleadErrors.length > 0) {
      warnings.push(`SmartLead enrollment failed for ${smartleadErrors.length} provider(s). They're marked in_sequence but emails won't send until re-enrolled.`);
    }

    // Build response
    const response: Record<string, unknown> = {
      success: true,
      updated: toUpdate.length,
      created: toInsert.length,
      connectionsAffected,
      businessProfilesUpdated,
      questionsRestored,
      // SmartLead enrollment results (only when moving to in_sequence)
      ...(stage === "in_sequence" && {
        smartleadEnrolled,
        smartleadSkipped,
        smartleadErrors: smartleadErrors.length > 0 ? smartleadErrors : undefined,
      }),
    };

    if (warnings.length > 0) {
      response.partialFailure = true;
      response.warnings = warnings;
      response.syncErrors = syncErrors.length > 0 ? syncErrors : undefined;
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("[provider-outreach/update-stage] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
