import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/update-tracking
 *
 * Update specific fields on a provider's outreach tracking record.
 * Used for saving enrichment data like contact_form_url, mail_address, etc.
 *
 * Request body:
 *   - provider_id: string (required)
 *   - updates: object with fields to update (required)
 *
 * Allowed update fields:
 *   - contact_form_url: string | null
 *   - mail_address: string | null
 *   - notes: string | null
 */

const ALLOWED_FIELDS = ["contact_form_url", "mail_address", "notes"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

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
    const { provider_id, updates } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates object is required" }, { status: 400 });
    }

    // Filter to only allowed fields
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (ALLOWED_FIELDS.includes(key as AllowedField)) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: `No valid fields to update. Allowed fields: ${ALLOWED_FIELDS.join(", ")}` },
        { status: 400 }
      );
    }

    const db = getServiceClient();
    const nowIso = new Date().toISOString();

    // Get tracking record
    const { data: tracking, error: trackingError } = await db
      .from("provider_outreach_tracking")
      .select("id, provider_id")
      .eq("provider_id", provider_id)
      .single();

    if (trackingError || !tracking) {
      return NextResponse.json({ error: "Provider not found in tracking" }, { status: 404 });
    }

    // Update tracking record
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({
        ...filteredUpdates,
        updated_at: nowIso,
      })
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[update-tracking] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update tracking record" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated_fields: Object.keys(filteredUpdates),
    });
  } catch (err) {
    console.error("[update-tracking] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
