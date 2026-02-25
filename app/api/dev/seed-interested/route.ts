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

/**
 * POST /api/dev/seed-interested
 *
 * DEV-ONLY: Seeds 4-6 provider-initiated "request" connections (provider → care seeker)
 * so the "Interested" tab in Matches has data for testing.
 *
 * Each connection uses type="request", status="pending", metadata.provider_initiated=true,
 * and includes match_reasons and viewed=false in metadata.
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
      .eq("type", "request");

    const existingProviderIds = new Set(
      (existingApps ?? []).map((c) => c.from_profile_id as string)
    );

    // Find provider profiles — prefer same city, fall back to any
    let providers: typeof providerResult.data = null;
    type ProviderResult = { data: { id: string; display_name: string; image_url: string | null; city: string | null; state: string | null; care_types: string[]; category: string | null; description: string | null; metadata: Record<string, unknown> }[] | null; error: unknown };
    const providerResult: ProviderResult = await supabase
      .from("business_profiles")
      .select("id, display_name, image_url, city, state, care_types, category, description, metadata")
      .eq("type", "organization")
      .eq("city", seekerCity)
      .limit(20);

    providers = providerResult.data;

    // Fall back to any organization if no city matches
    if (!providers || providers.length === 0) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("business_profiles")
        .select("id, display_name, image_url, city, state, care_types, category, description, metadata")
        .eq("type", "organization")
        .limit(20);

      if (fallbackError) {
        return NextResponse.json(
          { error: "Failed to query providers" },
          { status: 500 }
        );
      }
      providers = fallback;
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
      const provPayments: string[] = (providerMeta?.accepted_payments as string[]) || [];
      if (provPayments.includes("Medicaid") && seekerPayments.includes("Medicaid")) {
        reasons.push("Accepts Medicaid");
      }
      if (provPayments.includes("Medicare")) {
        reasons.push("Accepts Medicare");
      }

      // Fallback reasons if nothing matched
      if (reasons.length === 0) {
        reasons.push(`Serves ${seekerCity}, ${seekerState}`);
      }

      return reasons.slice(0, 3);
    }

    // Use admin client to bypass RLS for inbound connection inserts
    const admin = getAdminClient();
    const db = admin || supabase;

    // Stagger creation dates for realistic ordering
    const now = new Date();
    const insertedIds: string[] = [];
    const errors: { provider: string; error: string; code?: string }[] = [];

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

      const { data: inserted, error: insertError } = await db
        .from("connections")
        .insert({
          type: "request",
          status: "pending",
          from_profile_id: provider.id,
          to_profile_id: careSeekerProfileId,
          message: REACH_OUT_MESSAGES[i % REACH_OUT_MESSAGES.length](provider.display_name, provider.city || seekerCity),
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
        console.error(`Insert error for provider ${provider.id}:`, insertError);
        errors.push({ provider: provider.display_name, error: insertError.message, code: insertError.code });
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
