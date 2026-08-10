import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { OUTREACH_STAGES, type OutreachStage } from "../route";
import { pauseLeadInCampaign, getLeadByEmail } from "@/lib/smartlead";
import { NOT_INTERESTED_REASON_VALUES, type NotInterestedReason } from "@/lib/provider-outreach";

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
    const { provider_ids, stage, reason, notes, not_interested_reason } = body;

    if (!provider_ids || !Array.isArray(provider_ids) || provider_ids.length === 0) {
      return NextResponse.json({ error: "provider_ids array is required" }, { status: 400 });
    }

    if (!stage || !OUTREACH_STAGES.includes(stage)) {
      return NextResponse.json({ error: "Valid stage is required" }, { status: 400 });
    }

    // Validate not_interested_reason when moving to not_interested
    if (stage === "not_interested") {
      if (!not_interested_reason || !NOT_INTERESTED_REASON_VALUES.includes(not_interested_reason as NotInterestedReason)) {
        return NextResponse.json(
          { error: `not_interested_reason is required. Must be one of: ${NOT_INTERESTED_REASON_VALUES.join(", ")}` },
          { status: 400 }
        );
      }
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

    // Log provider state values for debugging multi-tab appearance bug
    console.log("[update-stage] Provider states from olera-providers:",
      providers.map(p => ({ provider_id: p.provider_id, name: p.provider_name?.substring(0, 30), state: p.state, city: p.city }))
    );

    const providerMap = new Map(providers.map((p) => [p.provider_id, p]));

    // Check which providers already have tracking rows
    // Include cycle_number for re_engage → not_contacted cycle handling
    const { data: existingTracking } = await db
      .from("provider_outreach_tracking")
      .select("provider_id, id, stage, smartlead_data, cycle_number")
      .in("provider_id", provider_ids);

    const existingMap = new Map((existingTracking || []).map((t) => [t.provider_id, t]));

    // ── Clean up pending tasks when moving OUT of in_sequence ──
    // Find providers being moved FROM in_sequence to another stage
    const providersLeavingSequence: string[] = [];
    for (const pid of provider_ids) {
      const existing = existingMap.get(pid);
      if (existing && existing.stage === "in_sequence" && stage !== "in_sequence") {
        providersLeavingSequence.push(pid);
      }
    }

    // Delete their pending tasks to prevent stale emails from firing
    if (providersLeavingSequence.length > 0) {
      // Get tracking IDs for these providers
      const trackingIdsToClean = providersLeavingSequence
        .map((pid) => existingMap.get(pid)?.id)
        .filter((id): id is string => !!id);

      if (trackingIdsToClean.length > 0) {
        const { error: cleanupError, count: deletedCount } = await db
          .from("provider_outreach_tasks")
          .delete()
          .in("tracking_id", trackingIdsToClean)
          .eq("status", "pending");

        if (cleanupError) {
          console.error("[provider-outreach/update-stage] Task cleanup error:", cleanupError);
          // Non-fatal - continue with stage update
        } else {
          console.log(
            `[provider-outreach/update-stage] Cleaned up ${deletedCount ?? 0} pending task(s) for ${providersLeavingSequence.length} provider(s) leaving in_sequence`
          );
        }
      }

      // ── Pause SmartLead leads to stop further emails ──
      // For providers with smartlead_data, call pauseLeadInCampaign
      // Note: lead_id may not be stored (addLeads API doesn't return it), so we look it up by email
      for (const pid of providersLeavingSequence) {
        const tracking = existingMap.get(pid);
        const smartleadData = tracking?.smartlead_data as {
          campaign_id?: number;
          lead_id?: number;
          lead_email?: string;
        } | null;

        if (smartleadData?.campaign_id) {
          try {
            let leadId = smartleadData.lead_id;

            // If no lead_id stored, look it up by email
            if (!leadId && smartleadData.lead_email) {
              const lookup = await getLeadByEmail(smartleadData.lead_email);
              if (lookup.ok && lookup.data?.id) {
                leadId = lookup.data.id;
              }
            }

            if (leadId) {
              const result = await pauseLeadInCampaign(smartleadData.campaign_id, leadId);
              if (result.ok) {
                console.log(`[provider-outreach/update-stage] Paused SmartLead lead ${leadId} in campaign ${smartleadData.campaign_id}`);
              } else {
                console.warn(`[provider-outreach/update-stage] Failed to pause SmartLead lead: ${result.error}`);
              }
            } else {
              console.warn(`[provider-outreach/update-stage] Could not resolve SmartLead lead_id for ${pid} (email: ${smartleadData.lead_email})`);
            }
          } catch (err) {
            console.error(`[provider-outreach/update-stage] Error pausing SmartLead lead:`, err);
            // Non-fatal - continue with stage update
          }
        }
      }
    }

    // ── Identify providers moving FROM re_engage TO not_contacted ──
    // These need cycle increment + counter resets in an atomic update
    const providersLeavingReEngage: Array<{ id: string; provider_id: string; cycle_number: number }> = [];
    if (stage === "not_contacted") {
      for (const pid of provider_ids) {
        const existing = existingMap.get(pid);
        if (existing && existing.stage === "re_engage") {
          providersLeavingReEngage.push({
            id: existing.id,
            provider_id: pid,
            cycle_number: (existing.cycle_number as number) ?? 1,
          });
        }
      }
    }
    // Set of IDs to exclude from bulk update (handled individually with cycle logic)
    const reEngageIds = new Set(providersLeavingReEngage.map((p) => p.id));

    // Detect archive/unarchive scenarios
    const isArchiving = stage === "archived";

    // Find providers that are currently archived and being moved to a different stage
    // Check BOTH tracking table AND system-wide archive (business_profiles.admin_archived)
    const providersBeingUnarchived: string[] = [];

    // First, check tracking table for archived (hard terminal only)
    // not_interested is soft terminal - no system-wide archive to undo
    for (const pid of provider_ids) {
      const existing = existingMap.get(pid);
      if (existing && existing.stage === "archived" && stage !== "archived") {
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
      needs_call_reason?: string;
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

        // Set needs_call_reason for new needs_call entries
        if (stage === "needs_call") {
          insertRow.needs_call_reason = "manual";
        }

        toInsert.push(insertRow);
      }
    }

    // Perform updates
    if (toUpdate.length > 0) {
      // Log what we're updating for debugging
      console.log("[update-stage] Updating tracking records:",
        toUpdate.map(t => ({ id: t.id, provider_id: t.provider_id, oldStage: t.oldStage, newStage: stage }))
      );

      // Build base update data (shared fields)
      const baseUpdateData: Record<string, unknown> = {
        stage: stage as OutreachStage,
        stage_changed_at: nowIso,
      };

      if (notes !== undefined) {
        // For archive/unarchive, combine reason + notes
        if (isArchiving || isUnarchiving) {
          baseUpdateData.notes = reason ? `${reason}${notes?.trim() ? ` - ${notes.trim()}` : ""}` : notes;
        } else {
          baseUpdateData.notes = notes;
        }
      }
      // Set needs_call_reason for moves to needs_call
      if (stage === "needs_call") {
        baseUpdateData.needs_call_reason = "manual";
      }

      // ── Handle re_engage → not_contacted with atomic cycle updates ──
      // These providers need cycle_number increment + counter resets IN THE SAME update as stage change
      if (providersLeavingReEngage.length > 0) {
        for (const item of providersLeavingReEngage) {
          const newCycle = item.cycle_number + 1;
          const providerDetails = providerMap.get(item.provider_id);

          const reEngageUpdateData = {
            ...baseUpdateData,
            cycle_number: newCycle,
            resend_count: 0,
            re_engage_entered_at: null,
            ...(providerDetails && { city: providerDetails.city, state: providerDetails.state }),
          };

          const { error: reEngageError } = await db
            .from("provider_outreach_tracking")
            .update(reEngageUpdateData)
            .eq("id", item.id);

          if (reEngageError) {
            console.error(`[update-stage] Re-engage update error for ${item.provider_id}:`, reEngageError);
            return NextResponse.json({ error: "Failed to update re-engage provider" }, { status: 500 });
          }
          console.log(`[update-stage] Atomically updated ${item.provider_id}: stage=not_contacted, cycle=${newCycle}`);
        }
      }

      // ── Handle remaining providers with bulk update ──
      const remainingIds = toUpdate
        .filter((t) => !reEngageIds.has(t.id))
        .map((t) => t.id);

      if (remainingIds.length > 0) {
        // Also update city/state from provider details to ensure consistency
        // This fixes cases where tracking record has stale/wrong location data
        const remainingItems = toUpdate.filter((t) => !reEngageIds.has(t.id));
        for (const item of remainingItems) {
          const providerDetails = providerMap.get(item.provider_id);
          if (providerDetails && remainingItems.length === 1) {
            // Only set city/state if updating a single provider (bulk updates might have mixed states)
            baseUpdateData.city = providerDetails.city;
            baseUpdateData.state = providerDetails.state;
          }
        }

        const { error: updateError } = await db
          .from("provider_outreach_tracking")
          .update(baseUpdateData)
          .in("id", remainingIds);

        if (updateError) {
          console.error("[provider-outreach/update-stage] Update error:", updateError);
          return NextResponse.json({ error: "Failed to update tracking records" }, { status: 500 });
        }
      }
    }

    // Perform inserts
    if (toInsert.length > 0) {
      // Log what we're inserting for debugging
      console.log("[update-stage] Inserting tracking records:",
        toInsert.map(r => ({ provider_id: r.provider_id, stage: r.stage, state: r.state, city: r.city }))
      );

      const { error: insertError } = await db
        .from("provider_outreach_tracking")
        .insert(toInsert);

      if (insertError) {
        console.error("[provider-outreach/update-stage] Insert error:", insertError);
        return NextResponse.json({ error: "Failed to create tracking records" }, { status: 500 });
      }
    }

    // ── Log stage_changed touchpoints ──
    // Record permanent event history for all providers whose stage changed
    const touchpointRows: Array<{
      provider_id: string;
      touchpoint_type: string;
      details: Record<string, unknown>;
      admin_user_id: string;
      created_at: string;
    }> = [];

    // Log cycle_started touchpoints for providers moving from re_engage to not_contacted
    for (const item of providersLeavingReEngage) {
      touchpointRows.push({
        provider_id: item.provider_id,
        touchpoint_type: "cycle_started",
        details: {
          cycle: item.cycle_number + 1,
          previous_stage: "re_engage",
          new_stage: "not_contacted",
          trigger: "manual_stage_move",
          ...(notes?.trim() && { notes: notes.trim() }),
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });
    }

    // Providers that had existing tracking rows (stage change from old to new)
    for (const item of toUpdate) {
      // Only log if stage actually changed
      if (item.oldStage === stage) continue;
      touchpointRows.push({
        provider_id: item.provider_id,
        touchpoint_type: "stage_changed",
        details: {
          old_stage: item.oldStage,
          new_stage: stage,
          ...(reason && { reason }),
          ...(notes?.trim() && { notes: notes.trim() }),
          ...(stage === "not_interested" && not_interested_reason && { not_interested_reason }),
        },
        admin_user_id: adminUser.id,
        created_at: nowIso,
      });
    }

    // Providers that were newly inserted (implicit stage change from not_contacted)
    // Only log if actually changing to a different stage
    if (stage !== "not_contacted") {
      for (const item of toInsert) {
        touchpointRows.push({
          provider_id: item.provider_id,
          touchpoint_type: "stage_changed",
          details: {
            old_stage: "not_contacted",
            new_stage: stage,
            ...(reason && { reason }),
            ...(notes?.trim() && { notes: notes.trim() }),
            ...(stage === "not_interested" && not_interested_reason && { not_interested_reason }),
          },
          admin_user_id: adminUser.id,
          created_at: nowIso,
        });
      }
    }

    if (touchpointRows.length > 0) {
      const { error: touchpointError } = await db
        .from("provider_outreach_touchpoints")
        .insert(touchpointRows);

      if (touchpointError) {
        // Non-fatal: log but don't fail the request (tracking update already succeeded)
        console.error("[provider-outreach/update-stage] Touchpoint insert error:", touchpointError);
      }
    }

    // ── Archive Sync: Sync with system-wide archive ──
    let connectionsAffected = 0;
    let businessProfilesUpdated = 0;
    let archivedQuestionProvidersUpdated = 0;

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

          if (!updateErr) businessProfilesUpdated++;
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
            // Non-fatal - slug collision or other issue
            console.error(`[provider-outreach/update-stage] Failed to create business_profile for ${providerId}:`, insertErr);
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
          console.error(`[provider-outreach/update-stage] Failed to upsert archived_question_providers for ${providerId}:`, supErr);
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

          if (!updateErr) businessProfilesUpdated++;

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
          console.error(`[provider-outreach/update-stage] Failed to delete archived_question_providers for ${providerId}:`, delErr);
        }
      }

      console.log(
        `[provider-outreach/update-stage] Unarchived ${providersBeingUnarchived.length} provider(s), ` +
        `updated ${businessProfilesUpdated} business_profiles, ` +
        `removed ${archivedQuestionProvidersUpdated} archived_question_providers rows, ` +
        `resumed ${connectionsAffected} followup sequences`
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
      },
    });

    return NextResponse.json({
      success: true,
      updated: toUpdate.length,
      created: toInsert.length,
      connectionsAffected,
      businessProfilesUpdated,
    });
  } catch (err) {
    console.error("[provider-outreach/update-stage] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
