import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  renderVariantEmail,
  previewEmail,
  buildContextFromProvider,
} from "@/lib/provider-outreach";

/**
 * POST /api/admin/provider-outreach/preview-email
 *
 * Generate an HTML preview of a composed email without sending it.
 * Used by the compose modal to show what the final email will look like.
 *
 * Request body:
 *   - provider_id: string (required)
 *   - custom_subject: string (optional) - Custom email subject
 *   - custom_body: string (optional) - Custom email body (markdown supported)
 *
 * Returns:
 *   - html: string - Rendered HTML of the email
 *   - subject: string - Final subject line
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

    const body = await request.json();
    const { provider_id, custom_subject, custom_body } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch provider data
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, slug, provider_name, email, city, state, provider_category")
      .eq("provider_id", provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (!provider.email) {
      return NextResponse.json({ error: "Provider has no email address" }, { status: 400 });
    }

    // Build context for email rendering
    const context = buildContextFromProvider({
      provider_id: provider.provider_id,
      name: provider.provider_name,
      email: provider.email,
      city: provider.city,
      state: provider.state,
      category: provider.provider_category,
      slug: provider.slug,
    });

    // Render email - use custom content if provided, otherwise default nudge template
    let rendered;
    const isCustomEmail = !!(custom_subject || custom_body);

    if (isCustomEmail) {
      // Use custom content with standard footer
      const preview = previewEmail("nudge", context);

      // Substitute {claim_url} in custom body if present
      let finalBody = custom_body || preview.editableBody;
      if (finalBody.includes("{claim_url}")) {
        finalBody = finalBody.replace(/\{claim_url\}/g, context.claim_url);
      }

      rendered = renderVariantEmail(
        {
          subject: custom_subject || preview.subject,
          body: finalBody,
        },
        context,
        "nudge"
      );
    } else {
      // Use default nudge template preview
      const preview = previewEmail("nudge", context);
      rendered = {
        subject: preview.subject,
        html: preview.html,
      };
    }

    return NextResponse.json({
      html: rendered.html,
      subject: rendered.subject,
    });
  } catch (err) {
    console.error("[preview-email] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
