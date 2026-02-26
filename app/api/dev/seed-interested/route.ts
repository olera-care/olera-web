import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Admin client bypasses RLS — needed to insert inbound connections
// (from_profile_id != authenticated user)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

const REACH_OUT_MESSAGES = [
  (name: string, city: string) =>
    `We'd love to help with your mother's care. Our team at ${name} specializes in companion care with a focus on daily living support — meal prep, light housekeeping, and medication reminders are exactly what we do best. We have caregivers available in your area who can start within the week.`,
  (name: string, city: string) =>
    `Hi! I noticed your care post and wanted to reach out. ${name} has been serving families in ${city} for years, and your needs align well with the services we provide. We'd love to set up a free consultation to discuss how we can help.`,
  (name: string, city: string) =>
    `Your family's care needs caught our attention. At ${name}, we understand how important it is to find the right provider. We offer flexible scheduling and personalized care plans. Would love to connect and learn more about what you're looking for.`,
  (name: string, city: string) =>
    `We saw your care post and believe we can be a great fit. ${name} provides experienced, compassionate caregivers right here in ${city}. Let's start a conversation about how we can support your family.`,
  (name: string, city: string) =>
    `Hello! ${name} would be honored to help care for your loved one. We have availability in the ${city} area and our team is experienced with the specific care needs you described. Looking forward to connecting with you.`,
];

interface IOSProvider {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  main_category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  provider_logo: string | null;
  provider_images: string | null;
  google_rating: number | null;
  lower_price: number | null;
  upper_price: number | null;
}

/**
 * POST /api/dev/seed-interested
 *
 * DEV-ONLY: Seeds 5 provider-initiated "request" connections (provider → care seeker)
 * so the "Interested" tab in Matches has data for testing.
 *
 * Queries real iOS providers from olera-providers, creates linked business_profiles
 * entries (with source_provider_id), so match cards display images, pricing, and ratings.
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

    // Find existing connections to skip duplicates
    const { data: existingApps } = await supabase
      .from("connections")
      .select("from_profile_id")
      .eq("to_profile_id", careSeekerProfileId)
      .eq("type", "request");

    const existingProviderIds = new Set(
      (existingApps ?? []).map((c) => c.from_profile_id as string)
    );

    // Use admin client to bypass RLS
    const admin = getAdminClient();
    const db = admin || supabase;

    // ── Query iOS providers from olera-providers ──
    let iosProviders: IOSProvider[] | null = null;

    const { data: cityProviders } = await db
      .from("olera-providers")
      .select(
        "provider_id, provider_name, provider_category, main_category, city, state, phone, provider_logo, provider_images, google_rating, lower_price, upper_price"
      )
      .ilike("city", seekerCity)
      .not("deleted", "is", true)
      .limit(20);

    iosProviders = cityProviders as IOSProvider[] | null;

    // Fall back to any providers if no city matches
    if (!iosProviders || iosProviders.length === 0) {
      const { data: fallback } = await db
        .from("olera-providers")
        .select(
          "provider_id, provider_name, provider_category, main_category, city, state, phone, provider_logo, provider_images, google_rating, lower_price, upper_price"
        )
        .not("deleted", "is", true)
        .limit(20);

      iosProviders = fallback as IOSProvider[] | null;
    }

    if (!iosProviders || iosProviders.length === 0) {
      return NextResponse.json({
        status: "no_providers",
        count: 0,
        message: "No iOS providers found in olera-providers table.",
      });
    }

    // ── Find or create business_profiles entries for each iOS provider ──
    type ResolvedProvider = {
      profileId: string;
      ios: IOSProvider;
      careTypes: string[];
    };

    const resolved: ResolvedProvider[] = [];

    for (const ios of iosProviders) {
      if (resolved.length >= 5) break;

      // Check if a business_profiles entry already exists for this iOS provider
      const { data: existing } = await db
        .from("business_profiles")
        .select("id")
        .eq("source_provider_id", ios.provider_id)
        .limit(1)
        .single();

      let profileId: string | null = existing?.id ?? null;

      if (!profileId) {
        // Also check if slug matches (in case it was created without source_provider_id)
        const { data: bySlug } = await db
          .from("business_profiles")
          .select("id")
          .eq("slug", ios.provider_id)
          .limit(1)
          .single();

        profileId = bySlug?.id ?? null;
      }

      if (!profileId) {
        // Create a new business_profiles entry linked to iOS data
        const iosImage =
          ios.provider_logo ||
          ios.provider_images?.split(" | ")?.[0] ||
          null;
        const careTypes: string[] = [ios.provider_category];
        if (ios.main_category && ios.main_category !== ios.provider_category) {
          careTypes.push(ios.main_category);
        }

        const { data: newProfile, error: insertErr } = await db
          .from("business_profiles")
          .insert({
            source_provider_id: ios.provider_id,
            slug: ios.provider_id,
            type: "organization",
            category: ios.provider_category,
            display_name: ios.provider_name,
            phone: ios.phone,
            city: ios.city,
            state: ios.state,
            image_url: iosImage,
            care_types: careTypes,
            claim_state: "unclaimed",
            verification_state: "unverified",
            source: "seeded",
            is_active: true,
            metadata: {},
          })
          .select("id")
          .single();

        if (insertErr) {
          // Handle unique constraint (slug collision) — try to find existing
          if (insertErr.code === "23505") {
            const { data: retry } = await db
              .from("business_profiles")
              .select("id")
              .eq("source_provider_id", ios.provider_id)
              .limit(1)
              .single();
            profileId = retry?.id ?? null;
          }
          if (!profileId) continue; // Skip this provider
        } else {
          profileId = newProfile?.id ?? null;
        }
      }

      if (!profileId || existingProviderIds.has(profileId)) continue;

      const careTypes: string[] = [ios.provider_category];
      if (ios.main_category && ios.main_category !== ios.provider_category) {
        careTypes.push(ios.main_category);
      }

      resolved.push({ profileId, ios, careTypes });
    }

    if (resolved.length === 0) {
      return NextResponse.json({
        status: "already_seeded",
        count: 0,
        message: "No eligible providers found or all already seeded.",
      });
    }

    // ── Generate match reasons ──
    function generateMatchReasons(
      providerCareTypes: string[],
      providerCity: string | null,
      googleRating: number | null
    ): string[] {
      const reasons: string[] = [];

      // Care type overlap
      for (const ct of seekerCareTypes) {
        if (
          providerCareTypes.some(
            (pct) => pct.toLowerCase() === ct.toLowerCase()
          )
        ) {
          reasons.push(ct);
          break;
        }
      }

      // Location match
      if (
        providerCity &&
        providerCity.toLowerCase() === seekerCity.toLowerCase()
      ) {
        reasons.push(`Serves ${seekerCity} area`);
      }

      // Rating
      if (googleRating && googleRating >= 4.0) {
        reasons.push(`Highly rated (${googleRating.toFixed(1)} stars)`);
      }

      // Payment overlap
      if (seekerPayments.includes("Medicaid")) {
        reasons.push("Accepts Medicaid");
      }

      // Fallback
      if (reasons.length === 0) {
        reasons.push(`Serves ${seekerCity}, ${seekerState}`);
      }

      return reasons.slice(0, 3);
    }

    // ── Create connections ──
    const now = new Date();
    const insertedIds: string[] = [];
    const errors: { provider: string; error: string; code?: string }[] = [];

    for (let i = 0; i < resolved.length; i++) {
      const { profileId, ios, careTypes } = resolved[i];
      const matchReasons = generateMatchReasons(
        careTypes,
        ios.city,
        ios.google_rating
      );

      // Stagger creation dates
      const createdAt = new Date(now);
      createdAt.setHours(
        createdAt.getHours() - i * 6 - Math.floor(Math.random() * 4)
      );

      const { data: inserted, error: insertError } = await db
        .from("connections")
        .insert({
          type: "request",
          status: "pending",
          from_profile_id: profileId,
          to_profile_id: careSeekerProfileId,
          message: REACH_OUT_MESSAGES[i % REACH_OUT_MESSAGES.length](
            ios.provider_name,
            ios.city || seekerCity
          ),
          metadata: {
            match_reasons: matchReasons,
            viewed: false,
            provider_initiated: true,
          },
          created_at: createdAt.toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `Insert error for provider ${ios.provider_name}:`,
          insertError
        );
        errors.push({
          provider: ios.provider_name,
          error: insertError.message,
          code: insertError.code,
        });
        continue;
      }

      if (inserted) insertedIds.push(inserted.id);
    }

    return NextResponse.json({
      status: "seeded",
      count: insertedIds.length,
      connectionIds: insertedIds,
      hasAdmin: !!admin,
      errors,
      providers: resolved.map((r) => ({
        profile_id: r.profileId,
        name: r.ios.provider_name,
        ios_id: r.ios.provider_id,
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

/**
 * DELETE /api/dev/seed-interested
 *
 * Removes all provider-initiated request connections for the current user,
 * so you can re-seed with fresh data.
 */
export async function DELETE() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

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

    const admin = getAdminClient();
    const db = admin || supabase;

    // Delete all provider-initiated request connections to this care seeker
    const { data: deleted, error: delError } = await db
      .from("connections")
      .delete()
      .eq("to_profile_id", account.active_profile_id)
      .eq("type", "request")
      .select("id");

    if (delError) {
      return NextResponse.json(
        { error: delError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "cleared",
      count: deleted?.length ?? 0,
    });
  } catch (err) {
    console.error("Delete interested error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
