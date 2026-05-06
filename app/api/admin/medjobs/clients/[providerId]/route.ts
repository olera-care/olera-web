import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  getClientStatus,
  type ProviderMetadata,
} from "@/lib/medjobs/clients";

/**
 * GET /api/admin/medjobs/clients/[providerId]
 *
 * Returns full management context for a single provider client — used
 * by the provider variant of the unified Drawer (v9.0 Phase 2).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { providerId } = await params;

    const db = getServiceClient();
    const { data, error } = await db
      .from("business_profiles")
      .select(
        "id, display_name, business_name, slug, email, phone, city, state, metadata, is_active, image_url, created_at, updated_at, type",
      )
      .eq("id", providerId)
      .in("type", ["organization", "caregiver"])
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Provider not found" },
        { status: 404 },
      );
    }

    const metadata = (data.metadata ?? {}) as ProviderMetadata;
    const status = getClientStatus(metadata);

    return NextResponse.json({
      id: data.id,
      display_name: data.business_name || data.display_name || "(unnamed provider)",
      slug: data.slug,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      image_url: data.image_url,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      stripe_customer_id: metadata.medjobs_stripe_customer_id ?? null,
      subscription_id: metadata.medjobs_subscription_id ?? null,
      subscription_active: !!metadata.medjobs_subscription_active,
      interview_terms_accepted_at: metadata.interview_terms_accepted_at ?? null,
      credits_used: metadata.medjobs_credits_used ?? 0,
      status: status.status,
      pilot_started_at: status.pilotStartedAt?.toISOString() ?? null,
      pilot_ends_at: status.pilotEndsAt?.toISOString() ?? null,
      days_remaining_in_pilot: status.daysRemainingInPilot,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/clients/[id]] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
