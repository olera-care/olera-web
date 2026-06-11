import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";
import { verifyAndCache } from "@/lib/email-verification";

/**
 * POST /api/admin/leads/add-email
 *
 * Add email to a provider (business_profiles + olera-providers) and
 * send deferred lead AND question notification emails.
 *
 * This uses the unified sendDeferredNotificationsForProvider() which handles:
 * - Finding all pending leads/questions without email_sent_at
 * - Sending notifications for both
 * - Marking them as sent
 */
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

    const { profileId, email, force } = await request.json();

    if (!profileId || !email) {
      return NextResponse.json({ error: "Missing profileId or email" }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Instant deliverability check on the freshly-fetched address. This endpoint
    // saves the email AND immediately fires the deferred question/lead
    // notification to it — so a dead address here means a guaranteed bounce on
    // a brand-new domain. ZeroBounce verifies + caches the verdict (so the
    // subsequent send is a warm cache hit, never re-checked). If it's invalid,
    // don't save or send — tell the operator to find another address. Force
    // through with { force: true } for the rare case the operator is certain.
    // Fails OPEN: a verification error returns 'unknown' and we proceed.
    if (!force) {
      const verdict = await verifyAndCache(email);
      if (verdict.status === "invalid") {
        return NextResponse.json(
          {
            error: "undeliverable",
            message: "That address can't receive mail — it would bounce. Try another.",
          },
          { status: 422 },
        );
      }
    }

    const db = getServiceClient();

    // Get the business profile
    const { data: profile, error: profileErr } = await db
      .from("business_profiles")
      .select("id, display_name, email, source_provider_id, slug, metadata")
      .eq("id", profileId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Use submitted email, or fall back to existing email on file
    const effectiveEmail = email || profile.email;

    // Update email on whichever records need it (skip if unchanged)
    if (profile.email !== effectiveEmail) {
      await db
        .from("business_profiles")
        .update({ email: effectiveEmail })
        .eq("id", profileId);
    }

    if (profile.source_provider_id) {
      const { data: iosProvider } = await db
        .from("olera-providers")
        .select("email")
        .eq("provider_id", profile.source_provider_id)
        .maybeSingle();
      if (iosProvider?.email !== effectiveEmail) {
        await db
          .from("olera-providers")
          .update({ email: effectiveEmail })
          .eq("provider_id", profile.source_provider_id);
      }
    }

    // Check if provider has opted out of lead emails
    const profileMeta = (profile.metadata as Record<string, unknown>) || {};
    const providerSlug = profile.slug || profile.source_provider_id || profileId;

    // Build additional slug variants for question lookup
    const additionalSlugVariants: string[] = [];
    if (profile.source_provider_id && profile.source_provider_id !== providerSlug) {
      additionalSlugVariants.push(profile.source_provider_id);
    }

    // Send deferred notifications using the unified function
    const result = await sendDeferredNotificationsForProvider({
      profileId,
      email: effectiveEmail,
      providerName: profile.display_name || "Provider",
      providerSlug,
      additionalSlugVariants,
      leadsUnsubscribed: !!profileMeta.leads_unsubscribed,
    });

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "add_provider_email",
      targetType: "business_profile",
      targetId: profileId,
      details: {
        provider_name: profile.display_name,
        email: effectiveEmail,
        previous_email: profile.email || null,
        lead_emails_sent: result.leadEmailsSent,
        question_emails_sent: result.questionEmailsSent,
        leads_skipped: result.leadsSkipped,
      },
    });

    if (result.leadsSkipped > 0 && result.leadEmailsSent === 0 && result.questionEmailsSent === 0) {
      return NextResponse.json({ success: true, emailsSent: 0, skipped: "unsubscribed" });
    }

    return NextResponse.json({
      success: true,
      emailsSent: result.leadEmailsSent + result.questionEmailsSent,
    });
  } catch (err) {
    console.error("Add email error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
