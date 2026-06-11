import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";
import { generateProviderSlug } from "@/lib/slugify";
import { verifyAndCache } from "@/lib/email-verification";

/**
 * POST /api/admin/questions/add-email
 *
 * Add email to a provider and send deferred question AND lead notifications.
 *
 * This uses the unified sendDeferredNotificationsForProvider() which handles:
 * - Finding all pending leads/questions without email_sent_at
 * - Sending notifications for both
 * - Marking them as sent
 *
 * Body: { providerSlug, email }
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

    const { providerSlug, email, force } = await request.json();

    if (!providerSlug || !email) {
      return NextResponse.json({ error: "Missing providerSlug or email" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Instant deliverability check on the freshly-fetched address. This endpoint
    // saves the email AND immediately fires the deferred question notification to
    // it — so a dead address here is a guaranteed bounce. ZeroBounce verifies +
    // caches the verdict (the subsequent send is a warm hit). Invalid → don't
    // save or send; tell the operator to find another, or force through.
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

    // Multi-strategy provider lookup (mirrors question submission logic)
    // Strategy 1: business_profiles by slug
    let provider = await db
      .from("business_profiles")
      .select("id, display_name, email, source_provider_id, slug, metadata")
      .eq("slug", providerSlug)
      .maybeSingle()
      .then(r => r.data);

    // Strategy 2: olera-providers by slug → linked business_profile
    let iosProvider: { provider_id: string; email: string | null; provider_name: string | null } | null = null;
    if (!provider) {
      iosProvider = await db
        .from("olera-providers")
        .select("provider_id, email, provider_name")
        .eq("slug", providerSlug)
        .not("deleted", "is", true)
        .maybeSingle()
        .then(r => r.data);

      if (!iosProvider) {
        // Strategy 3: olera-providers by provider_id (legacy alphanumeric ID)
        iosProvider = await db
          .from("olera-providers")
          .select("provider_id, email, provider_name")
          .eq("provider_id", providerSlug)
          .not("deleted", "is", true)
          .maybeSingle()
          .then(r => r.data);
      }

      if (!iosProvider) {
        // Strategy 4: reverse-match auto-generated slug
        const slugParts = providerSlug.split("-");
        const namePrefix = slugParts.slice(0, 3).join("-");
        const { data: candidates } = await db
          .from("olera-providers")
          .select("provider_id, email, provider_name, state")
          .not("deleted", "is", true)
          .is("slug", null)
          .ilike("provider_name", `${namePrefix.replace(/-/g, "%")}%`)
          .limit(20);
        if (candidates) {
          for (const c of candidates) {
            const generatedSlug = generateProviderSlug(c.provider_name, c.state);
            if (generatedSlug === providerSlug) {
              iosProvider = { provider_id: c.provider_id, email: c.email, provider_name: c.provider_name };
              break;
            }
          }
        }
      }

      // If found in olera-providers, try to find linked business_profile
      if (iosProvider) {
        provider = await db
          .from("business_profiles")
          .select("id, display_name, email, source_provider_id, slug, metadata")
          .eq("source_provider_id", iosProvider.provider_id)
          .maybeSingle()
          .then(r => r.data);
      }
    }

    if (!provider && !iosProvider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Use submitted email, or fall back to existing email on file
    const existingEmail = provider?.email || iosProvider?.email;
    const effectiveEmail = email || existingEmail;

    // Update email on whichever records we found (skip if unchanged)
    if (provider && provider.email !== effectiveEmail) {
      await db
        .from("business_profiles")
        .update({ email: effectiveEmail })
        .eq("id", provider.id);
    }

    const iosProviderId = provider?.source_provider_id || iosProvider?.provider_id;
    if (iosProviderId && iosProvider?.email !== effectiveEmail) {
      await db
        .from("olera-providers")
        .update({ email: effectiveEmail })
        .eq("provider_id", iosProviderId);
    }

    // Derive display name and ID from whichever record we found
    const displayName = provider?.display_name || iosProvider?.provider_name || providerSlug;
    const profileId = provider?.id || iosProviderId || providerSlug;

    // Check if provider has opted out of lead emails
    const profileMeta = (provider?.metadata as Record<string, unknown>) || {};

    // Build additional slug variants for question lookup
    // Questions may be stored with different provider_id values
    // Use Set to avoid duplicates
    const variantSet = new Set<string>();
    if (iosProviderId && iosProviderId !== providerSlug) {
      variantSet.add(iosProviderId);
    }
    if (provider?.source_provider_id && provider.source_provider_id !== providerSlug) {
      variantSet.add(provider.source_provider_id);
    }
    if (provider?.slug && provider.slug !== providerSlug) {
      variantSet.add(provider.slug);
    }
    const additionalSlugVariants = Array.from(variantSet);

    // Send deferred notifications using the unified function
    // Note: For questions-only providers (no business_profile), we still try to send
    // This handles the case where questions exist but no leads
    const result = await sendDeferredNotificationsForProvider({
      profileId: provider?.id || "",  // May be empty for olera-providers-only
      email: effectiveEmail,
      providerName: displayName,
      providerSlug,
      additionalSlugVariants,
      leadsUnsubscribed: !!profileMeta.leads_unsubscribed,
    });

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "add_provider_email_via_questions",
      targetType: provider ? "business_profile" : "olera_provider",
      targetId: profileId,
      details: {
        provider_name: displayName,
        provider_slug: providerSlug,
        email: effectiveEmail,
        previous_email: existingEmail || null,
        question_emails_sent: result.questionEmailsSent,
        lead_emails_sent: result.leadEmailsSent,
        leads_skipped: result.leadsSkipped,
      },
    });

    return NextResponse.json({
      success: true,
      emailsSent: result.leadEmailsSent + result.questionEmailsSent,
    });
  } catch (err) {
    console.error("Add email (questions) error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
