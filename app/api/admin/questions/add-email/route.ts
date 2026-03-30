import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendEmail, reserveEmailLogId, appendTrackingParams } from "@/lib/email";
import { questionReceivedEmail } from "@/lib/email-templates";
import { generateProviderSlug } from "@/lib/slugify";

/**
 * POST /api/admin/questions/add-email
 *
 * Add email to a provider and send deferred question notifications.
 * Also clears needs_provider_email flags on any pending leads for the same provider.
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

    const { providerSlug, email } = await request.json();

    if (!providerSlug || !email) {
      return NextResponse.json({ error: "Missing providerSlug or email" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const db = getServiceClient();

    // Multi-strategy provider lookup (mirrors question submission logic)
    // Strategy 1: business_profiles by slug
    let provider = await db
      .from("business_profiles")
      .select("id, display_name, email, source_provider_id, slug")
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
        // When olera-providers.slug is null, iosProviderToProfile generates a slug from
        // provider_name + state (e.g., "acme-home-care-tx"). The stored question
        // provider_id may be this ephemeral slug. Extract a name prefix to narrow the
        // DB search, then confirm by regenerating the full slug.
        // Slug format: "{slugified-name}-{state}" — state is last 2 chars if present
        const slugParts = providerSlug.split("-");
        // Use first few words as a ILIKE prefix to narrow candidates (avoid full table scan)
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
          .select("id, display_name, email, source_provider_id, slug")
          .eq("source_provider_id", iosProvider.provider_id)
          .maybeSingle()
          .then(r => r.data);
      }
    }

    if (!provider && !iosProvider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check existing email on whichever record we found
    const existingEmail = provider?.email || iosProvider?.email;
    if (existingEmail) {
      return NextResponse.json({ error: "Provider already has an email" }, { status: 400 });
    }

    // Update email on business_profiles if we have one
    if (provider) {
      await db
        .from("business_profiles")
        .update({ email })
        .eq("id", provider.id);
    }

    // Update email on olera-providers (either via linked source_provider_id or direct iosProvider)
    const iosProviderId = provider?.source_provider_id || iosProvider?.provider_id;
    if (iosProviderId) {
      await db
        .from("olera-providers")
        .update({ email })
        .eq("provider_id", iosProviderId);
    }

    // Derive display name and ID from whichever record we found
    const displayName = provider?.display_name || iosProvider?.provider_name || providerSlug;
    const providerId = provider?.id || iosProviderId || providerSlug;

    // Find flagged questions for this provider
    const { data: flaggedQuestions } = await db
      .from("provider_questions")
      .select("id, question, asker_name, asker_email, metadata")
      .eq("provider_id", providerSlug)
      .contains("metadata", { needs_provider_email: true });

    let emailsSent = 0;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    if (flaggedQuestions && flaggedQuestions.length > 0) {
      for (const q of flaggedQuestions) {
        try {
          const emailSubject = `A family has a question about ${displayName}`;
          const emailLogId = await reserveEmailLogId({
            to: email,
            subject: emailSubject,
            emailType: "question_received",
            recipientType: "provider",
            providerId,
          });

          await sendEmail({
            to: email,
            subject: emailSubject,
            html: questionReceivedEmail({
              providerName: displayName,
              askerName: q.asker_name || "A family",
              question: q.question,
              providerUrl: appendTrackingParams(`${siteUrl}/provider/${providerSlug}/onboard`, emailLogId),
              providerSlug,
            }),
            emailType: "question_received",
            recipientType: "provider",
            providerId,
            emailLogId: emailLogId ?? undefined,
          });

          // Clear the flag
          const meta = (q.metadata as Record<string, unknown>) || {};
          delete meta.needs_provider_email;
          meta.email_sent_at = new Date().toISOString();
          await db
            .from("provider_questions")
            .update({ metadata: meta })
            .eq("id", q.id);

          emailsSent++;
        } catch (emailErr) {
          console.error(`Failed to send deferred question email for ${q.id}:`, emailErr);
        }
      }
    }

    // Also clear needs_provider_email flags on any pending leads for this provider
    let flaggedLeads: { id: string; metadata: Record<string, unknown> | null }[] | null = null;
    if (provider?.id) {
      const { data } = await db
        .from("connections")
        .select("id, metadata")
        .eq("to_profile_id", provider.id)
        .contains("metadata", { needs_provider_email: true });
      flaggedLeads = data;
    }

    if (flaggedLeads && flaggedLeads.length > 0) {
      for (const lead of flaggedLeads) {
        try {
          const meta = (lead.metadata as Record<string, unknown>) || {};
          delete meta.needs_provider_email;
          meta.email_sent_at = new Date().toISOString();
          await db
            .from("connections")
            .update({ metadata: meta })
            .eq("id", lead.id);
        } catch (err) {
          console.error(`Failed to clear lead flag for ${lead.id}:`, err);
        }
      }
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "add_provider_email_via_questions",
      targetType: provider ? "business_profile" : "olera_provider",
      targetId: providerId,
      details: {
        provider_name: displayName,
        provider_slug: providerSlug,
        email,
        question_emails_sent: emailsSent,
        lead_flags_cleared: flaggedLeads?.length ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      emailsSent,
    });
  } catch (err) {
    console.error("Add email (questions) error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
