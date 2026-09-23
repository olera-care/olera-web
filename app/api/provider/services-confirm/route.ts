import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateServicesConfirmToken } from "@/lib/claim-tokens";
import { calculateProfileCompleteness } from "@/lib/profile-completeness";
import type { Profile } from "@/lib/types";

/**
 * POST /api/provider/services-confirm
 *
 * Handles one-click service confirmation from building email buttons.
 * Adds the category-specific services to the provider's care_types array.
 *
 * Request body: { tok: string } (signed token containing profileId, services[], email)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tok } = body as { tok?: string };

    if (!tok) {
      return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
    }

    const validation = validateServicesConfirmToken(tok);
    if (!validation.valid) {
      return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
    }

    const { profileId, services, email } = validation;
    const db = getServiceClient();

    // Fetch profile to verify email match and check completeness for graduation
    const { data: profile, error: fetchError } = await db
      .from("business_profiles")
      .select("id, email, care_types, metadata, display_name, description, images, image, slug, provider_category, city, state, type")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ ok: false, error: "Provider not found" }, { status: 404 });
    }

    if (profile.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Email mismatch" }, { status: 400 });
    }

    // Merge new services with existing, avoiding duplicates
    const existing = Array.isArray(profile.care_types) ? profile.care_types : [];
    const merged = [...new Set([...existing, ...services])];

    const { error: updateError } = await db
      .from("business_profiles")
      .update({ care_types: merged })
      .eq("id", profileId);

    if (updateError) {
      console.error("[api/provider/services-confirm] Update error:", updateError);
      return NextResponse.json({ ok: false, error: "Failed to update services" }, { status: 500 });
    }

    // Log activity
    await db.from("provider_activity").insert({
      provider_id: profileId,
      event_type: "services_confirmed",
      metadata: { services, source: "email_button" },
    }).then(({ error }) => {
      if (error) console.error("[api/provider/services-confirm] Activity log error:", error);
    });

    // Check if profile now qualifies for graduation (building -> growth at 80%)
    const meta = (profile.metadata || {}) as Record<string, unknown>;
    const updatedProfile = { ...profile, care_types: merged };
    const completeness = calculateProfileCompleteness(updatedProfile as unknown as Profile, meta);
    if (completeness.overall >= 80 && meta.lifecycle_stage === "building") {
      await db.from("business_profiles")
        .update({ metadata: { ...meta, lifecycle_stage: "growth", graduated_at: new Date().toISOString() } })
        .eq("id", profileId)
        .then(({ error: gradError }) => {
          if (gradError) console.error("[api/provider/services-confirm] Graduation error:", gradError);
          else console.log("[api/provider/services-confirm] Provider graduated to growth:", profileId);
        });
    }

    return NextResponse.json({ ok: true, services: merged });
  } catch (err) {
    console.error("[api/provider/services-confirm] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
