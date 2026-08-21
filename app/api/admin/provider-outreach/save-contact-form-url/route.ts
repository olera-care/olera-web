import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/save-contact-form-url
 *
 * Save a manually entered contact form URL for a provider.
 * Used when admin enters URL manually instead of using the crawler.
 *
 * Request body:
 *   - provider_id: string (required)
 *   - url: string (required) - the contact form URL
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
    const { provider_id, url } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Update tracking record with the URL
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        contact_form_url: url,
        contact_form_status: "manual",
        updated_at: nowIso,
      })
      .eq("provider_id", provider_id);

    if (updateError) {
      console.error("[save-contact-form-url] Update error:", updateError);
      return NextResponse.json({ error: "Failed to save URL" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-contact-form-url] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
