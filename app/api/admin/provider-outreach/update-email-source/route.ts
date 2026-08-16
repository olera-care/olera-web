import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * PATCH /api/admin/provider-outreach/update-email-source
 *
 * Toggle a provider's email_source between 'organization' and 'decision_maker'.
 * Used to move providers between sub-tabs on the Ready tab.
 *
 * Body:
 *   - provider_id: string (required)
 *   - email_source: 'organization' | 'decision_maker' (required)
 *
 * Validation:
 *   - Can always set to 'organization' (safe fallback)
 *   - Can only set to 'decision_maker' if apollo_contact.first_name exists
 *     (otherwise personalized greeting won't work)
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
    const { provider_id, email_source } = body;

    if (!provider_id || typeof provider_id !== "string") {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    if (!email_source || !["organization", "decision_maker"].includes(email_source)) {
      return NextResponse.json(
        { error: "email_source must be 'organization' or 'decision_maker'" },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Get current tracking record
    const { data: tracking, error: fetchError } = await db
      .from("provider_outreach_tracking")
      .select("id, email_source, apollo_contact")
      .eq("provider_id", provider_id)
      .maybeSingle();

    if (fetchError) {
      console.error("[update-email-source] Fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch tracking record" }, { status: 500 });
    }

    if (!tracking) {
      return NextResponse.json({ error: "Provider not found in outreach tracking" }, { status: 404 });
    }

    // If setting to decision_maker, verify Apollo contact has first_name
    if (email_source === "decision_maker") {
      const apolloContact = tracking.apollo_contact as { first_name?: string } | null;
      if (!apolloContact?.first_name) {
        return NextResponse.json(
          { error: "Cannot set as Decision Maker without Apollo contact first name. Find a decision maker first." },
          { status: 400 }
        );
      }
    }

    // Update email_source
    const { error: updateError } = await db
      .from("provider_outreach_tracking")
      .update({ email_source })
      .eq("id", tracking.id);

    if (updateError) {
      console.error("[update-email-source] Update error:", updateError);
      return NextResponse.json({ error: "Failed to update email source" }, { status: 500 });
    }

    // Log touchpoint (non-fatal - don't fail the request if this fails)
    try {
      await db.from("provider_outreach_touchpoints").insert({
        provider_id,
        touchpoint_type: "email_source_changed",
        admin_user_id: adminUser.id,
        details: {
          old_source: tracking.email_source || "organization",
          new_source: email_source,
        },
        created_at: new Date().toISOString(),
      });
    } catch (touchpointErr) {
      console.error("[update-email-source] Touchpoint logging failed:", touchpointErr);
      // Continue - main operation succeeded
    }

    return NextResponse.json({
      success: true,
      email_source,
    });
  } catch (err) {
    console.error("[update-email-source] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
