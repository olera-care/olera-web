import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/dev/seed-interested
 *
 * DEV-ONLY: Seeds 4-6 "application" connections (provider → care seeker)
 * so the "Interested" tab in Matches has data for testing.
 *
 * Each connection uses type="application", status="pending", and includes
 * match_reasons and viewed=false in metadata.
 */
export async function POST() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user's active profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json(
        { error: "No active profile" },
        { status: 400 }
      );
    }

    const careSeekerProfileId = account.active_profile_id;

    // Get care seeker profile for match reason generation
    const { data: seekerProfile } = await supabase
      .from("business_profiles")
      .select("city, state, care_types, metadata")
      .eq("id", careSeekerProfileId)
      .single();

    const seekerCity = seekerProfile?.city || "Houston";
    const seekerState = seekerProfile?.state || "TX";
    const seekerCareTypes: string[] = seekerProfile?.care_types || [];
    const seekerMeta = (seekerProfile?.metadata || {}) as Record<string, unknown>;
    const seekerPayments = (seekerMeta.payment_methods as string[]) || [];

    // Find existing application connections to skip duplicates
    const { data: existingApps } = await supabase
      .from("connections")
      .select("from_profile_id")
      .eq("to_profile_id", careSeekerProfileId)
      .eq("type", "application");

    const existingProviderIds = new Set(
      (existingApps ?? []).map((c) => c.from_profile_id as string)
    );

    // Find provider profiles near care seeker's city
    const { data: providers, error: providerError } = await supabase
      .from("business_profiles")
      .select("id, display_name, image_url, city, state, care_types, category, description, metadata")
      .eq("type", "organization")
      .eq("city", seekerCity)
      .limit(20);

    if (providerError) {
      return NextResponse.json(
        { error: "Failed to query providers" },
        { status: 500 }
      );
    }

    // Filter out existing and pick 5
    const eligible = (providers ?? []).filter(
      (p) => !existingProviderIds.has(p.id)
    );
    const selected = eligible.slice(0, 5);

    if (selected.length === 0) {
      return NextResponse.json({
        status: "already_seeded",
        count: 0,
        message: "No eligible providers found or all already seeded.",
      });
    }

    // Generate match reasons based on overlap
    function generateMatchReasons(
      providerCareTypes: string[],
      providerMeta: Record<string, unknown>,
      providerCity: string | null
    ): string[] {
      const reasons: string[] = [];

      // Care type overlap
      for (const ct of seekerCareTypes) {
        if (providerCareTypes.some((pct) => pct.toLowerCase() === ct.toLowerCase())) {
          reasons.push(`Specializes in ${ct}`);
          break;
        }
      }

      // Location match
      if (providerCity && providerCity.toLowerCase() === seekerCity.toLowerCase()) {
        reasons.push(`Serves ${seekerCity} area`);
      }

      // Payment method overlap
      const provAcceptsMedicaid = providerMeta?.accepts_medicaid === true;
      if (provAcceptsMedicaid && seekerPayments.includes("Medicaid")) {
        reasons.push("Accepts Medicaid");
      }
      const provAcceptsMedicare = providerMeta?.accepts_medicare === true;
      if (provAcceptsMedicare) {
        reasons.push("Accepts Medicare");
      }

      // Fallback reasons if nothing matched
      if (reasons.length === 0) {
        reasons.push(`Serves ${seekerCity}, ${seekerState}`);
      }

      return reasons.slice(0, 3);
    }

    // Stagger creation dates for realistic ordering
    const now = new Date();
    const insertedIds: string[] = [];

    for (let i = 0; i < selected.length; i++) {
      const provider = selected[i];
      const provMeta = (provider.metadata || {}) as Record<string, unknown>;
      const matchReasons = generateMatchReasons(
        provider.care_types || [],
        provMeta,
        provider.city
      );

      // Stagger by hours so they appear at different times
      const createdAt = new Date(now);
      createdAt.setHours(createdAt.getHours() - i * 6 - Math.floor(Math.random() * 4));

      const { data: inserted, error: insertError } = await supabase
        .from("connections")
        .insert({
          type: "application",
          status: "pending",
          from_profile_id: provider.id,
          to_profile_id: careSeekerProfileId,
          message: null,
          metadata: {
            match_reasons: matchReasons,
            viewed: false,
          },
          created_at: createdAt.toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(`Insert error for provider ${provider.id}:`, insertError);
        continue;
      }

      if (inserted) insertedIds.push(inserted.id);
    }

    return NextResponse.json({
      status: "seeded",
      count: insertedIds.length,
      connectionIds: insertedIds,
      providers: selected.map((p) => ({
        profile_id: p.id,
        name: p.display_name,
      })),
    });
  } catch (err) {
    console.error("Seed interested error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
