import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";

/**
 * POST /api/admin/questions/use-apollo-email
 *
 * Apply the Apollo decision-maker email to a provider.
 * This is called when the user clicks "Use This" after an Apollo contact is found.
 *
 * Body: { provider_slug: string }
 *
 * Actions:
 * 1. Get apollo_contact email from provider_outreach_tracking
 * 2. Update email in olera-providers (and business_profiles if linked)
 * 3. Set email_source = 'decision_maker' in outreach tracking
 * 4. Clear email_dead / needs_provider_email flags from questions
 * 5. Send pending notifications via sendDeferredNotificationsForProvider()
 */
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

    const body = await request.json();
    const { provider_slug } = body;

    if (!provider_slug) {
      return NextResponse.json(
        { error: "provider_slug is required" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Multi-strategy provider lookup
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
      slug: string | null;
    } | null = null;

    // Try business_profiles by slug first
    const { data: bpData } = await db
      .from("business_profiles")
      .select("id, slug, display_name, email, source_provider_id, account_id")
      .eq("slug", provider_slug)
      .maybeSingle();

    businessProfile = bpData;

    // If business_profile found, get linked olera-provider
    if (businessProfile?.source_provider_id) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, slug")
        .eq("provider_id", businessProfile.source_provider_id)
        .not("deleted", "is", true)
        .maybeSingle();
      iosProvider = iosData;
    }

    // Strategy 2: olera-providers by slug
    if (!iosProvider) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, slug")
        .eq("slug", provider_slug)
        .not("deleted", "is", true)
        .maybeSingle();

      if (iosData) {
        iosProvider = iosData;

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

    // Strategy 3: olera-providers by provider_id
    if (!iosProvider) {
      const { data: iosData } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, email, slug")
        .eq("provider_id", provider_slug)
        .not("deleted", "is", true)
        .maybeSingle();

      if (iosData) {
        iosProvider = iosData;

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

    // Strategy 4: business_profiles by UUID
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
            .select("provider_id, provider_name, email, slug")
            .eq("provider_id", bpByUuid.source_provider_id)
            .not("deleted", "is", true)
            .maybeSingle();
          iosProvider = iosData;
        }
      }
    }

    const providerId = iosProvider?.provider_id;
    if (!providerId) {
      return NextResponse.json(
        { error: "Provider not found or no olera-provider linked" },
        { status: 404 }
      );
    }

    // Fetch apollo_contact from provider_outreach_tracking
    const { data: tracking } = await db
      .from("provider_outreach_tracking")
      .select("id, apollo_contact")
      .eq("provider_id", providerId)
      .maybeSingle();

    if (!tracking?.apollo_contact) {
      return NextResponse.json(
        { error: "No Apollo contact found for this provider" },
        { status: 400 }
      );
    }

    const apolloContact = tracking.apollo_contact as {
      email: string;
      first_name: string | null;
      last_name: string | null;
      title: string | null;
    };

    if (!apolloContact.email) {
      return NextResponse.json(
        { error: "Apollo contact has no email" },
        { status: 400 }
      );
    }

    const apolloEmail = apolloContact.email;
    const previousEmail = iosProvider?.email || businessProfile?.email || null;

    // Protection: If this account is claimed AND already has an email, block the change
    if (businessProfile?.account_id && businessProfile?.email) {
      return NextResponse.json(
        {
          error: "claimed_account",
          message: "This provider has claimed their account. Their email cannot be changed by admins.",
        },
        { status: 403 }
      );
    }

    // Update email_source to decision_maker in tracking
    await db
      .from("provider_outreach_tracking")
      .update({ email_source: "decision_maker" })
      .eq("id", tracking.id);

    // Update email in olera-providers
    const { error: iosError } = await db
      .from("olera-providers")
      .update({ email: apolloEmail })
      .eq("provider_id", providerId);

    if (iosError) {
      console.error("[use-apollo-email] Error updating olera-providers:", iosError);
    }

    // Sync to business_profiles if linked
    if (businessProfile?.id) {
      const isClaimed = !!businessProfile.account_id;
      const hasEmail = !!businessProfile.email;

      if (isClaimed && hasEmail) {
        console.log(`[use-apollo-email] Skipping business_profile sync for claimed account ${businessProfile.id}`);
      } else {
        await db
          .from("business_profiles")
          .update({ email: apolloEmail })
          .eq("id", businessProfile.id);
      }
    }

    // Clear email_dead and needs_provider_email flags from questions
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

    let flagsCleared = 0;
    for (const q of flaggedQuestions ?? []) {
      const meta = (q.metadata || {}) as Record<string, unknown>;
      if (meta.email_dead || meta.needs_provider_email) {
        delete meta.email_dead;
        delete meta.needs_provider_email;
        const { error } = await db.from("provider_questions").update({ metadata: meta }).eq("id", q.id);
        if (!error) flagsCleared++;
      }
    }

    // Send deferred notifications
    const providerName = iosProvider?.provider_name || businessProfile?.display_name || provider_slug;
    let notificationResult = { leadEmailsSent: 0, questionEmailsSent: 0, leadsSkipped: 0 };

    try {
      notificationResult = await sendDeferredNotificationsForProvider({
        profileId: businessProfile?.id || "",
        email: apolloEmail,
        providerName: providerName,
        providerSlug: provider_slug,
        additionalSlugVariants: slugVariants.filter(s => s !== provider_slug),
      });
    } catch (notifErr) {
      console.error("[use-apollo-email] Deferred notification error:", notifErr);
    }

    // Log audit action
    await logAuditAction({
      adminUserId: adminUser.id,
      action: "use_apollo_email_via_questions",
      targetType: businessProfile ? "business_profile" : "olera_provider",
      targetId: businessProfile?.id || providerId,
      details: {
        provider_name: providerName,
        provider_slug: provider_slug,
        apollo_email: apolloEmail,
        previous_email: previousEmail,
        question_emails_sent: notificationResult.questionEmailsSent,
        lead_emails_sent: notificationResult.leadEmailsSent,
        leads_skipped: notificationResult.leadsSkipped,
        question_flags_cleared: flagsCleared,
      },
    });

    // Log touchpoint
    await db.from("provider_outreach_touchpoints").insert({
      provider_id: providerId,
      touchpoint_type: "apollo_email_confirmed",
      admin_user_id: adminUser.id,
      details: {
        email: apolloEmail,
        previous_email: previousEmail,
        notifications_sent: notificationResult.leadEmailsSent + notificationResult.questionEmailsSent,
        source: "questions_page",
      },
    });

    return NextResponse.json({
      success: true,
      email: apolloEmail,
      notifications_sent: notificationResult.leadEmailsSent + notificationResult.questionEmailsSent,
      flags_cleared: flagsCleared,
    });
  } catch (error) {
    console.error("[use-apollo-email] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
