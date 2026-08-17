import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findDecisionMaker, isApolloConfigured } from "@/lib/apollo/client";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";

/**
 * POST /api/admin/questions/find-decision-maker
 *
 * Find a decision-maker contact for a provider using Apollo.io.
 * This endpoint works with provider_slug (Questions use slugs, not provider_ids).
 *
 * Body: { provider_slug: string }
 *
 * Returns: {
 *   contact: ApolloContact | null,
 *   credits_used: number,
 *   auto_confirmed: boolean,
 *   notifications_sent: number,
 *   error?: string
 * }
 */

interface ApolloContactData {
  email: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  linkedin_url: string | null;
  found_at: string;
  credits_used: number;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if Apollo is configured
    if (!isApolloConfigured()) {
      return NextResponse.json(
        { error: "Apollo.io API key not configured", contact: null, credits_used: 0 },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { provider_slug, provider_editor_id } = body;

    if (!provider_slug) {
      return NextResponse.json(
        { error: "provider_slug is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // If we have provider_editor_id (olera-providers.provider_id), use it directly
    // This is the most reliable lookup since it comes from the enriched question data
    let businessProfile: {
      id: string;
      slug: string | null;
      display_name: string | null;
      email: string | null;
      source_provider_id: string | null;
      account_id: string | null;
    } | null = null;

    let iosProvider: {
      provider_id: string;
      provider_name: string | null;
      email: string | null;
      website: string | null;
      city: string | null;
      state: string | null;
      slug: string | null;
    } | null = null;

    // Priority lookup: Use provider_editor_id directly if available
    if (provider_editor_id) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, website, city, state, slug")
        .eq("provider_id", provider_editor_id)
        .not("deleted", "is", true)
        .maybeSingle();

      if (iosData) {
        iosProvider = iosData;
        // Also get linked business_profile
        const { data: linkedBp } = await db
          .from("business_profiles")
          .select("id, slug, display_name, email, source_provider_id, account_id")
          .eq("source_provider_id", iosData.provider_id)
          .maybeSingle();
        businessProfile = linkedBp;
      }
    }

    // Fallback: Try business_profiles by slug
    if (!iosProvider) {
      const { data: bpData } = await db
        .from("business_profiles")
        .select("id, slug, display_name, email, source_provider_id, account_id")
        .eq("slug", provider_slug)
        .maybeSingle();

      businessProfile = bpData;
    }

    // If business_profile found, get linked olera-provider
    if (!iosProvider && businessProfile?.source_provider_id) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, website, city, state, slug")
        .eq("provider_id", businessProfile.source_provider_id)
        .not("deleted", "is", true)
        .maybeSingle();
      iosProvider = iosData;
    }

    // Strategy 2: olera-providers by slug
    if (!iosProvider) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, website, city, state, slug")
        .eq("slug", provider_slug)
        .not("deleted", "is", true)
        .maybeSingle();

      if (iosData) {
        iosProvider = iosData;

        // Try to find linked business_profile
        if (!businessProfile) {
          const { data: linkedBp } = await db
            .from("business_profiles")
            .select("id, slug, display_name, email, source_provider_id, account_id")
            .eq("source_provider_id", iosData.provider_id)
            .maybeSingle();
          businessProfile = linkedBp;
        }
      }
    }

    // Strategy 3: olera-providers by provider_id (legacy alphanumeric ID)
    if (!iosProvider) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, website, city, state, slug")
        .eq("provider_id", provider_slug)
        .not("deleted", "is", true)
        .maybeSingle();

      if (iosData) {
        iosProvider = iosData;

        // Try to find linked business_profile
        if (!businessProfile) {
          const { data: linkedBp } = await db
            .from("business_profiles")
            .select("id, slug, display_name, email, source_provider_id, account_id")
            .eq("source_provider_id", iosData.provider_id)
            .maybeSingle();
          businessProfile = linkedBp;
        }
      }
    }

    // Strategy 4: business_profiles by UUID (some questions may use this as provider_id)
    if (!businessProfile && !iosProvider) {
      const { data: bpByUuid } = await db
        .from("business_profiles")
        .select("id, slug, display_name, email, source_provider_id, account_id")
        .eq("id", provider_slug)
        .maybeSingle();

      if (bpByUuid) {
        businessProfile = bpByUuid;
        if (bpByUuid.source_provider_id) {
          const { data: iosData } = await db
            .from("olera-providers")
            .select("provider_id, provider_name, email, website, city, state, slug")
            .eq("provider_id", bpByUuid.source_provider_id)
            .not("deleted", "is", true)
            .maybeSingle();
          iosProvider = iosData;
        }
      }
    }

    if (!iosProvider && !businessProfile) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // We need a provider_id to store in provider_outreach_tracking
    // Check this BEFORE calling Apollo to avoid wasting credits
    const providerId = iosProvider?.provider_id;
    if (!providerId) {
      return NextResponse.json(
        { error: "No olera-provider linked - cannot store Apollo contact" },
        { status: 400 }
      );
    }

    // Block Apollo lookup for claimed accounts - they should update their own email
    // Check this BEFORE calling Apollo to avoid wasting credits
    if (businessProfile?.account_id) {
      return NextResponse.json({
        contact: null,
        credits_used: 0,
        error: "Cannot look up decision-maker for claimed accounts",
      });
    }

    // Extract domain from website, or fall back to email domain
    let domain: string | null = null;

    // Try website first
    if (iosProvider?.website) {
      try {
        const url = new URL(
          iosProvider.website.startsWith("http")
            ? iosProvider.website
            : `https://${iosProvider.website}`
        );
        domain = url.hostname.replace(/^www\./, "");
      } catch {
        // Invalid URL, try email fallback
      }
    }

    // Fall back to extracting domain from email
    const providerEmail = iosProvider?.email || businessProfile?.email;
    if (!domain && providerEmail) {
      const emailMatch = providerEmail.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
      if (emailMatch) {
        domain = emailMatch[1].toLowerCase();
      }
    }

    // Apollo requires a domain - can't search by company name alone
    if (!domain) {
      return NextResponse.json({
        contact: null,
        credits_used: 0,
        error: "No website or email domain available for Apollo search",
      });
    }

    const providerName = iosProvider?.provider_name || businessProfile?.display_name || provider_slug;

    // Call Apollo API
    const result = await findDecisionMaker(providerName, domain);

    if (result.error) {
      return NextResponse.json({
        contact: null,
        credits_used: result.credits_used,
        error: result.error,
      });
    }

    if (!result.contact?.email) {
      // No decision-maker found
      return NextResponse.json({
        contact: result.contact,
        credits_used: result.credits_used,
        message: "No decision-maker with email found",
      });
    }

    // Build the contact data to store
    const apolloContactData: ApolloContactData = {
      email: result.contact.email,
      first_name: result.contact.first_name,
      last_name: result.contact.last_name,
      title: result.contact.title,
      linkedin_url: result.contact.linkedin_url,
      found_at: new Date().toISOString(),
      credits_used: result.credits_used,
    };

    // Check if provider already has an email on file
    const providerHasEmail = !!providerEmail?.trim();

    // Auto-confirm when provider has NO email (Needs Email tab use case)
    // Don't auto-confirm when provider HAS email (Delivery Issues tab - user should confirm)
    const autoConfirm = !providerHasEmail;

    // Ensure tracking record exists and save the Apollo contact
    const { data: existingTracking } = await db
      .from("provider_outreach_tracking")
      .select("id")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (existingTracking) {
      // Update existing tracking record
      const updateData: Record<string, unknown> = {
        apollo_contact: apolloContactData,
      };
      if (autoConfirm) {
        updateData.email_source = "decision_maker";
      }
      await db
        .from("provider_outreach_tracking")
        .update(updateData)
        .eq("id", existingTracking.id);
    } else {
      // Create new tracking record with Apollo contact
      const insertData: Record<string, unknown> = {
        provider_id: providerId,
        stage: "not_contacted",
        city: iosProvider?.city,
        state: iosProvider?.state,
        apollo_contact: apolloContactData,
      };
      if (autoConfirm) {
        insertData.email_source = "decision_maker";
      }
      await db.from("provider_outreach_tracking").insert(insertData);
    }

    // Only auto-update provider email if provider didn't have one (auto-confirm case)
    const apolloEmail = result.contact.email;
    let providerEmailError: Error | null = null;
    let notificationResult = { leadEmailsSent: 0, questionEmailsSent: 0, leadsSkipped: 0 };

    if (autoConfirm) {
      // Save Apollo email to directory level (olera-providers)
      const { error } = await db
        .from("olera-providers")
        .update({ email: apolloEmail })
        .eq("provider_id", providerId);

      if (error) {
        console.error("[find-decision-maker] Error updating provider email:", error);
        providerEmailError = error;
      }

      // Sync to business_profiles if linked (with claimed account protection)
      if (businessProfile?.id) {
        const isClaimed = !!businessProfile.account_id;
        const hasEmail = !!businessProfile.email;

        if (isClaimed && hasEmail) {
          // Don't overwrite claimed account's email
          console.log(`[find-decision-maker] Skipping business_profile sync for claimed account ${businessProfile.id}`);
        } else {
          // Safe to sync: either unclaimed, or claimed but no email yet
          await db
            .from("business_profiles")
            .update({ email: apolloEmail })
            .eq("id", businessProfile.id);
        }
      }

      // Clear email_dead and needs_provider_email flags from questions for this provider
      // Questions may store provider_id as: slug, source_provider_id, or business_profile UUID
      const slugVariants = [provider_slug];
      if (iosProvider?.slug && iosProvider.slug !== provider_slug) slugVariants.push(iosProvider.slug);
      if (businessProfile?.slug && businessProfile.slug !== provider_slug) slugVariants.push(businessProfile.slug);
      if (providerId !== provider_slug) slugVariants.push(providerId);
      // Include business_profile UUID - some questions use this as provider_id
      if (businessProfile?.id && businessProfile.id !== provider_slug) slugVariants.push(businessProfile.id);

      const { data: flaggedQuestions } = await db
        .from("provider_questions")
        .select("id, metadata")
        .in("provider_id", slugVariants);

      for (const q of flaggedQuestions ?? []) {
        const meta = (q.metadata || {}) as Record<string, unknown>;
        if (meta.email_dead || meta.needs_provider_email) {
          delete meta.email_dead;
          delete meta.needs_provider_email;
          await db.from("provider_questions").update({ metadata: meta }).eq("id", q.id);
        }
      }

      // Send deferred notifications for any pending questions/leads
      try {
        notificationResult = await sendDeferredNotificationsForProvider({
          profileId: businessProfile?.id || "",
          email: apolloEmail,
          providerName: providerName,
          providerSlug: provider_slug,
          additionalSlugVariants: slugVariants.filter(s => s !== provider_slug),
        });
      } catch (notifErr) {
        console.error("[find-decision-maker] Deferred notification error:", notifErr);
      }
    }

    // Log touchpoint
    await db.from("provider_outreach_touchpoints").insert({
      provider_id: providerId,
      touchpoint_type: "apollo_enrichment",
      admin_user_id: adminUser.id,
      details: {
        email_found: result.contact.email,
        name: `${result.contact.first_name || ""} ${result.contact.last_name || ""}`.trim(),
        title: result.contact.title,
        credits_used: result.credits_used,
        auto_confirmed: autoConfirm,
        directory_synced: autoConfirm && !providerEmailError,
        notifications_sent: notificationResult.leadEmailsSent + notificationResult.questionEmailsSent,
        source: "questions_page",
      },
    });

    return NextResponse.json({
      contact: result.contact,
      credits_used: result.credits_used,
      auto_confirmed: autoConfirm,
      directory_synced: autoConfirm && !providerEmailError,
      notifications_sent: notificationResult.leadEmailsSent + notificationResult.questionEmailsSent,
    });
  } catch (error) {
    console.error("[find-decision-maker] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
