import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/matches/reach-out-counts
 *
 * Returns count of interested providers for each family profile.
 * Uses service role key to bypass RLS (providers can only see their own connections
 * via RLS, but this endpoint needs to count ALL connections to show aggregate counts).
 *
 * Request body: { familyIds: string[] }
 * Response: { counts: Record<string, number> }
 */
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("[reach-out-counts] Missing Supabase config");
    return NextResponse.json({ counts: {} });
  }

  try {
    const body = await request.json();
    const { familyIds } = body as { familyIds: string[] };

    if (!familyIds || !Array.isArray(familyIds) || familyIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    // Limit to prevent abuse
    if (familyIds.length > 500) {
      return NextResponse.json(
        { error: "Too many family IDs requested" },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS
    const db = createClient(url, serviceKey);

    // Count connections (type=request, status=pending or accepted) for each family
    const { data: connections, error } = await db
      .from("connections")
      .select("to_profile_id")
      .in("to_profile_id", familyIds)
      .eq("type", "request")
      .in("status", ["pending", "accepted"]);

    if (error) {
      console.error("[reach-out-counts] Query error:", error);
      return NextResponse.json({ counts: {} });
    }

    // Aggregate counts per family
    const counts: Record<string, number> = {};
    for (const conn of connections || []) {
      const familyId = conn.to_profile_id;
      counts[familyId] = (counts[familyId] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("[reach-out-counts] Error:", err);
    return NextResponse.json({ counts: {} });
  }
}
