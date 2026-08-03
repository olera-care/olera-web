import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/provider-tier
 *
 * Determines the tier (Enterprise / Regional / Local) for a list of providers
 * by counting how many locations share a similar provider name in the database.
 *
 * Enterprise: 10+ locations
 * Regional:   3-9 locations
 * Local:      1-2 locations
 *
 * Body: { provider_ids: string[] }
 *
 * Returns: { tiers: Record<string, { tier: string, location_count: number }> }
 */
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = await getAdminUser(user.id);
    if (!admin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = (await request.json()) as { provider_ids?: string[] };
    const providerIds = body.provider_ids;

    if (!providerIds || providerIds.length === 0) {
      return NextResponse.json({ tiers: {} });
    }

    const db = getServiceClient();

    // Fetch provider names for the requested IDs
    const { data: providers, error: provError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name")
      .in("provider_id", providerIds);

    if (provError || !providers) {
      console.error("[provider-tier] Query error:", provError);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    const tiers: Record<string, { tier: string; location_count: number }> = {};

    // For each provider, count how many locations share a similar name
    // We normalize the name by removing location suffixes and common variations
    for (const provider of providers) {
      const name = provider.provider_name;
      if (!name) {
        tiers[provider.provider_id] = { tier: "local", location_count: 1 };
        continue;
      }

      // Normalize: strip city/state suffixes, "of [City]", trailing location info
      const normalized = name
        .replace(/\s+(of|in|at)\s+.+$/i, "")
        .replace(/\s*[-–]\s+.+$/, "")
        .replace(/\s*\(.+\)\s*$/, "")
        .trim();

      // Count providers with names starting with this normalized prefix
      // Using ilike for case-insensitive matching
      const { count, error: countError } = await db
        .from("olera-providers")
        .select("provider_id", { count: "exact", head: true })
        .ilike("provider_name", `${normalized}%`);

      if (countError) {
        tiers[provider.provider_id] = { tier: "local", location_count: 1 };
        continue;
      }

      const locationCount = count || 1;
      let tier: string;

      if (locationCount >= 10) {
        tier = "enterprise";
      } else if (locationCount >= 3) {
        tier = "regional";
      } else {
        tier = "local";
      }

      tiers[provider.provider_id] = { tier, location_count: locationCount };
    }

    return NextResponse.json({ tiers });
  } catch (e) {
    console.error("[provider-tier] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Tier detection failed" },
      { status: 500 },
    );
  }
}
