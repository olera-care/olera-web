import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { findDecisionMaker, isApolloConfigured } from "@/lib/apollo/client";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";

/**
 * POST /api/admin/provider-outreach/find-decision-maker
 *
 * Find a decision-maker contact for a provider using Apollo.io.
 * This is a premium enrichment that costs credits, so it's triggered
 * explicitly rather than being part of the free email scrape waterfall.
 *
 * Body: { provider_id: string }
 *
 * Returns: {
 *   contact: ApolloContact | null,
 *   credits_used: number,
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
    const { provider_id } = body;

    if (!provider_id) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Fetch provider data - include email for domain fallback, slug for notifications
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, website, email, city, state, slug")
      .eq("provider_id", provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Extract domain from website, or fall back to email domain
    let domain: string | null = null;

    // Try website first
    if (provider.website) {
      try {
        const url = new URL(
          provider.website.startsWith("http")
            ? provider.website
            : `https://${provider.website}`
        );
        domain = url.hostname.replace(/^www\./, "");
      } catch {
        // Invalid URL, try email fallback
      }
    }

    // Fall back to extracting domain from email
    if (!domain && provider.email) {
      const emailMatch = provider.email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
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

    // Call Apollo API
    const result = await findDecisionMaker(provider.provider_name, domain);

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

    // Ensure tracking record exists and save the Apollo contact
    const { data: existingTracking } = await db
      .from("provider_outreach_tracking")
      .select("id")
      .eq("provider_id", provider_id)
      .maybeSingle();

    // Check if provider already has an email on file
    const providerHasEmail = !!provider.email?.trim();

    // Determine if we should auto-confirm (set email_source and update email)
    // Auto-confirm when provider has NO email (Needs Email tab use case)
    // Don't auto-confirm when provider HAS email (Ready tab use case - user should confirm)
    const autoConfirm = !providerHasEmail;

    if (existingTracking) {
      // Update existing tracking record
      const updateData: Record<string, unknown> = {
        apollo_contact: apolloContactData,
      };
      // Only set email_source if auto-confirming
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
        provider_id: provider_id,
        stage: "not_contacted",
        city: provider.city,
        state: provider.state,
        apollo_contact: apolloContactData,
      };
      // Only set email_source if auto-confirming
      if (autoConfirm) {
        insertData.email_source = "decision_maker";
      }
      await db.from("provider_outreach_tracking").insert(insertData);
    }

    // Only auto-update provider email if provider didn't have one (auto-confirm case)
    // Otherwise, user should explicitly confirm via "Use This" or "Confirm"
    const apolloEmail = result.contact.email;
    let providerEmailError: Error | null = null;

    if (autoConfirm) {
      // Save Apollo email to directory level (olera-providers)
      // This ensures pending questions/leads can be sent to this email
      const { error } = await db
        .from("olera-providers")
        .update({ email: apolloEmail })
        .eq("provider_id", provider_id);

      if (error) {
        console.error("[find-decision-maker] Error updating provider email:", error);
        providerEmailError = error;
        // Non-fatal - continue with the rest
      }
    }

    // Only sync to business_profiles and send notifications when auto-confirming
    // (when provider had no email and we're filling in the gap)
    let linkedProfile: { id: string; slug: string | null } | null = null;
    let notificationResult = { leadEmailsSent: 0, questionEmailsSent: 0, leadsSkipped: 0 };

    if (autoConfirm) {
      // Sync to business_profiles if linked (with claimed account protection)
      const { data: profile } = await db
        .from("business_profiles")
        .select("id, slug, account_id, email")
        .eq("source_provider_id", provider_id)
        .maybeSingle();

      linkedProfile = profile;

      if (profile?.id) {
        const isClaimed = !!profile.account_id;
        const hasEmail = !!profile.email;

        if (isClaimed && hasEmail) {
          // Don't overwrite claimed account's email
          console.log(`[find-decision-maker] Skipping business_profile sync for claimed account ${profile.id}`);
        } else {
          // Safe to sync: either unclaimed, or claimed but no email yet
          await db
            .from("business_profiles")
            .update({ email: apolloEmail })
            .eq("id", profile.id);
        }
      }

      // Send deferred notifications for any pending questions/leads
      const providerSlug = provider.slug || profile?.slug || provider_id;
      const additionalSlugVariants: string[] = [];
      if (provider.slug && provider.slug !== providerSlug) {
        additionalSlugVariants.push(provider.slug);
      }
      if (profile?.slug && profile.slug !== providerSlug) {
        additionalSlugVariants.push(profile.slug);
      }
      if (provider_id !== providerSlug) {
        additionalSlugVariants.push(provider_id);
      }

      try {
        notificationResult = await sendDeferredNotificationsForProvider({
          profileId: profile?.id || "",
          email: apolloEmail,
          providerName: provider.provider_name || providerSlug,
          providerSlug,
          additionalSlugVariants,
        });
      } catch (notifErr) {
        // Log but don't fail - Apollo contact was saved successfully
        console.error("[find-decision-maker] Deferred notification error:", notifErr);
      }
    }

    // Check if emails match (for frontend display logic)
    const emailsMatch = apolloEmail.toLowerCase() === provider.email?.toLowerCase();

    // Log touchpoint
    await db.from("provider_outreach_touchpoints").insert({
      provider_id: provider_id,
      touchpoint_type: "apollo_enrichment",
      admin_user_id: adminUser.id,
      details: {
        email_found: result.contact.email,
        name: `${result.contact.first_name || ""} ${result.contact.last_name || ""}`.trim(),
        title: result.contact.title,
        credits_used: result.credits_used,
        auto_confirmed: autoConfirm,
        emails_match: emailsMatch,
        directory_synced: autoConfirm && !providerEmailError,
        notifications_sent: notificationResult.leadEmailsSent + notificationResult.questionEmailsSent,
      },
    });

    return NextResponse.json({
      contact: result.contact,
      credits_used: result.credits_used,
      auto_confirmed: autoConfirm,
      emails_match: emailsMatch,
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
