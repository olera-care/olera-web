import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/qr-scans
 *
 * Returns QR scan events (page_view with utm_source=fax or direct_mail)
 * for a list of provider slugs. Queries provider_activity table.
 *
 * Body: { slugs: string[] }
 *
 * Returns: { scans: Record<string, { source: string, scanned_at: string }[]> }
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

    const body = (await request.json()) as { slugs?: string[] };
    const slugs = body.slugs;

    if (!slugs || slugs.length === 0) {
      return NextResponse.json({ scans: {} });
    }

    const db = getServiceClient();

    // Query provider_activity for page_view events with outreach UTM sources.
    // The ViewTracker stores utm_source inside metadata JSONB.
    // provider_id in provider_activity is the slug for anonymous events.
    const { data, error } = await db
      .from("provider_activity")
      .select("provider_id, metadata, created_at")
      .eq("event_type", "page_view")
      .in("provider_id", slugs)
      .or(
        "metadata->>utm_source.eq.fax,metadata->>utm_source.eq.direct_mail"
      );

    if (error) {
      console.error("[qr-scans] Query error:", error);
      return NextResponse.json({ error: "Failed to fetch scan data" }, { status: 500 });
    }

    // Group by provider slug
    const scans: Record<string, { source: string; scanned_at: string }[]> = {};
    for (const row of data || []) {
      const slug = row.provider_id as string;
      const meta = row.metadata as Record<string, unknown> | null;
      const source = (meta?.utm_source as string) || "unknown";
      if (!scans[slug]) scans[slug] = [];
      scans[slug].push({
        source,
        scanned_at: row.created_at as string,
      });
    }

    return NextResponse.json({ scans });
  } catch (e) {
    console.error("[qr-scans] Error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch QR scans" },
      { status: 500 },
    );
  }
}
