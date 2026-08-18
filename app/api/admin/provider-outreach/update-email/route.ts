import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";
import { getLeadByEmail, updateLeadInCampaign } from "@/lib/smartlead";

/**
 * PATCH /api/admin/provider-outreach/update-email
 *
 * Update a provider's email address in olera-providers table.
 * Also triggers deferred notifications for any pending questions/leads.
 *
 * Body:
 *   - provider_id: string (required)
 *   - email: string (required) - new email to set
 *   - confirm_apollo: boolean (optional) - if true, also sets email_source = 'decision_maker'
 *     Use this when confirming an Apollo contact to move provider to Decision Maker tab
 */
export async function PATCH(request: NextRequest) {
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
    const { provider_id, email, confirm_apollo } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const db = getServiceClient();
    const trimmedEmail = email.trim();

    // Get current provider data
    const { data: existing } = await db
      .from("olera-providers")
      .select("email, provider_name, slug")
      .eq("provider_id", provider_id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Update the email
    const { error: updateError } = await db
      .from("olera-providers")
      .update({ email: trimmedEmail })
      .eq("provider_id", provider_id);

    if (updateError) {
      console.error("[provider-outreach/update-email] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update email" }, { status: 500 });
    }

    // Check for linked business_profile
    const { data: linkedProfile } = await db
      .from("business_profiles")
      .select("id, slug, metadata, account_id, email")
      .eq("source_provider_id", provider_id)
      .maybeSingle();

    // Sync email to business_profile if linked, but protect claimed accounts
    // If account is claimed (has account_id) AND already has an email, don't overwrite
    // The provider owns their email and should update it themselves
    if (linkedProfile && linkedProfile.id) {
      const isClaimed = !!linkedProfile.account_id;
      const hasEmail = !!linkedProfile.email;

      if (isClaimed && hasEmail) {
        // Don't overwrite claimed account's email, but continue with other operations
        console.log(`[provider-outreach/update-email] Skipping business_profile sync for claimed account ${linkedProfile.id}`);
      } else {
        // Safe to sync: either unclaimed, or claimed but no email yet (enrichment case)
        await db
          .from("business_profiles")
          .update({ email: trimmedEmail })
          .eq("id", linkedProfile.id);
      }
    }

    // Fetch tracking record for confirmation reset and SmartLead sync
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("id, stage, smartlead_data, email_source")
      .eq("provider_id", provider_id)
      .maybeSingle();

    // Sync email to SmartLead if provider has an active/paused SmartLead enrollment
    // This ensures that even paused leads get updated, so if resumed later,
    // remaining emails go to the new address
    let smartleadSynced = false;
    let smartleadError: string | null = null;
    if (tracking?.smartlead_data) {
      const slData = tracking.smartlead_data as {
        campaign_id?: number;
        lead_id?: number;
        lead_email?: string;
      };

      if (slData.campaign_id && slData.lead_email && slData.lead_email !== trimmedEmail) {
        try {
          // Look up lead by OLD email to get lead_id
          let leadId = slData.lead_id;
          if (!leadId) {
            const lookup = await getLeadByEmail(slData.lead_email);
            if (lookup.ok && lookup.data?.id) {
              leadId = lookup.data.id;
            }
          }

          if (leadId) {
            // Update lead email in SmartLead
            const updateResult = await updateLeadInCampaign(
              slData.campaign_id,
              leadId,
              { email: trimmedEmail }
            );

            if (updateResult.ok) {
              console.log(`[provider-outreach/update-email] SmartLead email updated for lead ${leadId}`);

              // Update smartlead_data.lead_email in tracking table
              const updatedSlData = {
                ...slData,
                lead_email: trimmedEmail,
                lead_id: leadId, // Persist lead_id now that we have it
              };
              const { error: slDataUpdateErr } = await db
                .from("provider_outreach_tracking")
                .update({ smartlead_data: updatedSlData })
                .eq("id", tracking.id);

              if (slDataUpdateErr) {
                // SmartLead was updated but local sync failed - log mismatch
                console.error("[provider-outreach/update-email] Failed to update local smartlead_data:", slDataUpdateErr.message);
                smartleadError = "SmartLead updated but local sync failed";
              } else {
                smartleadSynced = true;
              }
            } else {
              smartleadError = updateResult.error || "Unknown SmartLead error";
              console.error(`[provider-outreach/update-email] SmartLead update failed:`, smartleadError);
            }
          } else {
            smartleadError = "Could not find lead in SmartLead";
            console.warn(`[provider-outreach/update-email] Lead not found for ${slData.lead_email}`);
          }
        } catch (slErr) {
          smartleadError = slErr instanceof Error ? slErr.message : "SmartLead sync error";
          console.error("[provider-outreach/update-email] SmartLead sync error:", slErr);
        }
      }
    }

    // Reset confirmation status since contact info changed
    // Also set email_source if confirming Apollo contact
    if (tracking) {
      const trackingUpdate: Record<string, unknown> = {
        confirmed_at: null,
        confirmed_by: null,
      };
      if (confirm_apollo) {
        trackingUpdate.email_source = "decision_maker";
      }
      await db
        .from("provider_outreach_tracking")
        .update(trackingUpdate)
        .eq("id", tracking.id);
    } else if (confirm_apollo) {
      // Create tracking record if it doesn't exist (shouldn't happen normally)
      const { data: provider } = await db
        .from("olera-providers")
        .select("city, state")
        .eq("provider_id", provider_id)
        .single();

      await db.from("provider_outreach_tracking").insert({
        provider_id,
        stage: "not_contacted",
        city: provider?.city,
        state: provider?.state,
        email_source: "decision_maker",
      });
    }

    // Build slug variants for deferred notifications
    const providerSlug = existing.slug || linkedProfile?.slug || provider_id;
    const additionalSlugVariants: string[] = [];
    if (existing.slug && existing.slug !== providerSlug) {
      additionalSlugVariants.push(existing.slug);
    }
    if (linkedProfile?.slug && linkedProfile.slug !== providerSlug) {
      additionalSlugVariants.push(linkedProfile.slug);
    }
    if (provider_id !== providerSlug) {
      additionalSlugVariants.push(provider_id);
    }

    // Send deferred notifications for any pending questions/leads
    let notificationResult = { leadEmailsSent: 0, questionEmailsSent: 0, leadsSkipped: 0 };
    try {
      notificationResult = await sendDeferredNotificationsForProvider({
        profileId: linkedProfile?.id || "",
        email: trimmedEmail,
        providerName: existing.provider_name || providerSlug,
        providerSlug,
        additionalSlugVariants,
      });
    } catch (notifErr) {
      // Log but don't fail the request - email was saved successfully
      console.error("[provider-outreach/update-email] Deferred notification error:", notifErr);
    }

    // Clear email_dead/needs_provider_email flags from questions
    const allSlugVariants = [providerSlug, ...additionalSlugVariants];
    let questionFlagsCleared = 0;
    try {
      const { data: flaggedQuestions } = await db
        .from("provider_questions")
        .select("id, metadata")
        .in("provider_id", allSlugVariants);

      if (flaggedQuestions?.length) {
        for (const q of flaggedQuestions) {
          const meta = (q.metadata || {}) as Record<string, unknown>;
          if (meta.email_dead || meta.needs_provider_email) {
            delete meta.email_dead;
            delete meta.needs_provider_email;
            const { error: flagUpdateErr } = await db
              .from("provider_questions")
              .update({ metadata: meta })
              .eq("id", q.id);
            if (!flagUpdateErr) {
              questionFlagsCleared++;
            }
          }
        }
      }
    } catch (flagErr) {
      console.error("[provider-outreach/update-email] Flag clearing error:", flagErr);
    }

    // Log touchpoint for email change (enables UI history view)
    // Non-fatal: don't fail the request if touchpoint logging fails
    if (existing.email !== trimmedEmail) {
      try {
        await db.from("provider_outreach_touchpoints").insert({
          provider_id,
          touchpoint_type: "email_changed",
          admin_user_id: adminUser.id,
          details: {
            old_email: existing.email,
            new_email: trimmedEmail,
            source: confirm_apollo ? "apollo_confirm" : "manual_edit",
            old_source: tracking?.email_source || "organization",
            new_source: confirm_apollo ? "decision_maker" : (tracking?.email_source || "organization"),
          },
        });
      } catch (touchpointErr) {
        console.error("[provider-outreach/update-email] Touchpoint logging failed:", touchpointErr);
        // Continue - main operation succeeded
      }
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "update_provider_email",
      targetType: "provider",
      targetId: provider_id,
      details: {
        provider_name: existing.provider_name,
        old_email: existing.email,
        new_email: trimmedEmail,
        question_emails_sent: notificationResult.questionEmailsSent,
        lead_emails_sent: notificationResult.leadEmailsSent,
        leads_skipped: notificationResult.leadsSkipped,
        question_flags_cleared: questionFlagsCleared,
        smartlead_synced: smartleadSynced,
        smartlead_error: smartleadError,
      },
    });

    return NextResponse.json({
      success: true,
      email: trimmedEmail,
      email_source: confirm_apollo ? "decision_maker" : undefined,
      notificationsSent: notificationResult.leadEmailsSent + notificationResult.questionEmailsSent,
      smartleadSynced,
      smartleadError,
    });
  } catch (err) {
    console.error("[provider-outreach/update-email] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
