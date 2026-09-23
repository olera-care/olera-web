import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateAvailabilityToken } from "@/lib/claim-tokens";

/**
 * POST /api/provider/availability
 *
 * Handles provider availability self-report from building email buttons.
 * Updates metadata.accepting_new_clients on the provider's profile.
 *
 * Request body: { tok: string } (signed token containing profileId, value, email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tok } = body as { tok?: string };

    if (!tok) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
    }

    const validation = validateAvailabilityToken(tok);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { profileId, value, email } = validation;
    const db = getServiceClient();
    const now = new Date().toISOString();

    // Fetch profile to verify email match
    const { data: profile, error: fetchError } = await db
      .from("business_profiles")
      .select("id, email, metadata")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ ok: false, error: "Provider not found" }, { status: 404 });
    }

    if (profile.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Email mismatch" }, { status: 400 });
    }

    const meta = (profile.metadata || {}) as Record<string, unknown>;
    const accepting = value === "yes";

    // Update metadata with availability status
    const { error: updateError } = await db
      .from("business_profiles")
      .update({
        metadata: {
          ...meta,
          accepting_new_clients: accepting,
          accepting_new_clients_at: now,
          accepting_new_clients_source: "email_button",
        },
      })
      .eq("id", profileId);

    if (updateError) {
      console.error("[api/provider/availability] Update error:", updateError);
      return NextResponse.json({ ok: false, error: "Failed to update availability" }, { status: 500 });
    }

    // Log activity
    await db.from("provider_activity").insert({
      provider_id: profileId,
      event_type: "availability_reported",
      metadata: { value, source: "email_button" },
    }).then(({ error }) => {
      if (error) console.error("[api/provider/availability] Activity log error:", error);
    });

    return NextResponse.json({ ok: true, value, accepting });
  } catch (err) {
    console.error("[api/provider/availability] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
