import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/outreach
 *
 * Returns provider outreach data - which providers are reaching out to families,
 * and how those families are responding.
 *
 * Response structure:
 * - providers: list of providers who have sent outreach, with their stats and outreach items
 * - totals: aggregate counts across all providers
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const db = getServiceClient();

    // Fetch all provider-initiated outreach with both profiles
    const { data: connections, error: connError } = await db
      .from("connections")
      .select(`
        id,
        status,
        message,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(
          id,
          display_name,
          slug,
          city,
          state
        ),
        to_profile:business_profiles!connections_to_profile_id_fkey(
          id,
          display_name,
          city,
          state
        )
      `)
      .eq("type", "request")
      .contains("metadata", { provider_initiated: true })
      .order("created_at", { ascending: false });

    if (connError) {
      console.error("[admin/outreach] Failed to fetch connections:", connError);
      return NextResponse.json({ error: "Failed to fetch outreach data" }, { status: 500 });
    }

    // Type the profile data
    type ProfileData = {
      id: string;
      display_name: string;
      slug?: string;
      city: string | null;
      state: string | null;
    };

    type ConnectionWithMetadata = {
      id: string;
      status: string;
      message: string | null;
      metadata: { reply_message?: string; replied_at?: string } | null;
      created_at: string;
      from_profile: ProfileData | null;
      to_profile: ProfileData | null;
    };

    // Group connections by provider
    const providerMap = new Map<string, {
      provider: {
        id: string;
        name: string;
        slug: string;
        location: string;
      };
      outreach: {
        id: string;
        status: "pending" | "accepted" | "declined";
        message: string | null;
        created_at: string;
        family: {
          id: string;
          name: string;
          location: string;
        };
        reply_message?: string | null;
        replied_at?: string | null;
      }[];
    }>();

    // Process each connection
    for (const conn of (connections || []) as unknown as ConnectionWithMetadata[]) {
      const fromProfile = conn.from_profile;
      const toProfile = conn.to_profile;

      if (!fromProfile || !toProfile) continue;

      const providerId = fromProfile.id;
      const meta = conn.metadata;

      // Initialize provider entry if not exists
      if (!providerMap.has(providerId)) {
        providerMap.set(providerId, {
          provider: {
            id: fromProfile.id,
            name: fromProfile.display_name,
            slug: fromProfile.slug || fromProfile.id,
            location: [fromProfile.city, fromProfile.state].filter(Boolean).join(", "),
          },
          outreach: [],
        });
      }

      // Map status - database uses "accepted" but we want to keep it consistent
      const status = conn.status === "accepted" ? "accepted"
        : conn.status === "declined" ? "declined"
        : "pending";

      // Add outreach item
      providerMap.get(providerId)!.outreach.push({
        id: conn.id,
        status: status as "pending" | "accepted" | "declined",
        message: conn.message,
        created_at: conn.created_at,
        family: {
          id: toProfile.id,
          name: toProfile.display_name,
          location: [toProfile.city, toProfile.state].filter(Boolean).join(", "),
        },
        reply_message: meta?.reply_message || null,
        replied_at: meta?.replied_at || null,
      });
    }

    // Convert to array and calculate stats
    const providers = Array.from(providerMap.values()).map((entry) => ({
      provider: entry.provider,
      stats: {
        total: entry.outreach.length,
        pending: entry.outreach.filter((o) => o.status === "pending").length,
        accepted: entry.outreach.filter((o) => o.status === "accepted").length,
        declined: entry.outreach.filter((o) => o.status === "declined").length,
      },
      outreach: entry.outreach,
    }));

    // Sort by total outreach (most active first)
    providers.sort((a, b) => b.stats.total - a.stats.total);

    // Calculate totals
    const totals = {
      providers: providers.length,
      sent: providers.reduce((sum, p) => sum + p.stats.total, 0),
      accepted: providers.reduce((sum, p) => sum + p.stats.accepted, 0),
      declined: providers.reduce((sum, p) => sum + p.stats.declined, 0),
      pending: providers.reduce((sum, p) => sum + p.stats.pending, 0),
    };

    return NextResponse.json({
      providers,
      totals,
    });
  } catch (err) {
    console.error("[admin/outreach] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
