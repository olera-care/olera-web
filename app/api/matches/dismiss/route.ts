import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * POST /api/matches/dismiss
 *
 * Records a dismissed match by creating a connection with type "dismiss".
 * Reuses the provider resolution pattern from /api/connections/request.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { providerId, providerName } = body as {
      providerId: string;
      providerName: string;
    };

    if (!providerId) {
      return NextResponse.json({ error: "providerId required" }, { status: 400 });
    }

    // Get user's family profile
    const { data: account } = await supabase
      .from("accounts")
      .select("active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) {
      return NextResponse.json({ error: "No active profile" }, { status: 400 });
    }

    // Resolve provider to business_profiles UUID
    let toProfileId: string;

    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        providerId
      );

    if (isUUID) {
      const { data: existing } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("id", providerId)
        .single();

      if (existing) {
        toProfileId = existing.id;
      } else {
        return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      }
    } else {
      // iOS provider — look up by source_provider_id or create
      const { data: existing } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("source_provider_id", providerId)
        .limit(1)
        .single();

      if (existing) {
        toProfileId = existing.id;
      } else {
        // Look up in olera-providers for full data
        const { data: iosProvider } = await supabase
          .from("olera-providers")
          .select("provider_name, provider_category, main_category, city, state, phone")
          .eq("provider_id", providerId)
          .single();

        const providerCareTypes = iosProvider
          ? [
              iosProvider.provider_category,
              ...(iosProvider.main_category &&
              iosProvider.main_category !== iosProvider.provider_category
                ? [iosProvider.main_category]
                : []),
            ]
          : [];

        const slug =
          (providerName || "provider")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") +
          "-" +
          Math.random().toString(36).substring(2, 6);

        const { data: newProvider, error: providerError } = await supabase
          .from("business_profiles")
          .insert({
            source_provider_id: providerId,
            slug,
            type: "organization",
            category: iosProvider?.provider_category || null,
            display_name: providerName || iosProvider?.provider_name || "Provider",
            phone: iosProvider?.phone || null,
            city: iosProvider?.city || null,
            state: iosProvider?.state || null,
            care_types: providerCareTypes,
            claim_state: "unclaimed",
            verification_state: "unverified",
            source: "seeded",
            is_active: true,
            metadata: {},
          })
          .select("id")
          .single();

        if (providerError) {
          if (providerError.code === "23505") {
            const { data: raceProvider } = await supabase
              .from("business_profiles")
              .select("id")
              .eq("source_provider_id", providerId)
              .limit(1)
              .single();
            if (raceProvider) {
              toProfileId = raceProvider.id;
            } else {
              return NextResponse.json({ error: "Failed to resolve provider" }, { status: 500 });
            }
          } else {
            return NextResponse.json({ error: "Failed to create provider record" }, { status: 500 });
          }
        } else {
          toProfileId = newProvider!.id;
        }
      }
    }

    // Create dismiss connection
    const { error: connError } = await supabase.from("connections").insert({
      from_profile_id: account.active_profile_id,
      to_profile_id: toProfileId,
      type: "dismiss",
      status: "archived",
    });

    if (connError) {
      console.error("Dismiss error:", connError);
      return NextResponse.json({ error: "Failed to dismiss" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Dismiss error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
