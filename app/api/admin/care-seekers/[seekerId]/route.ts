import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { getEnrichedProgram } from "@/lib/program-data";

/**
 * GET /api/admin/care-seekers/[seekerId]
 *
 * Fetch care seeker profile detail with connection history.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seekerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { seekerId } = await params;
    const db = getServiceClient();

    const { data: seeker, error } = await db
      .from("business_profiles")
      .select("*")
      .eq("id", seekerId)
      .eq("type", "family")
      .single();

    if (error || !seeker) {
      return NextResponse.json({ error: "Care seeker not found" }, { status: 404 });
    }

    // Get connection count
    const { count: connectionCount } = await db
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("from_profile_id", seekerId);

    // Get last 10 connections with provider names
    const { data: connections } = await db
      .from("connections")
      .select(`
        id,
        type,
        status,
        message,
        created_at,
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, type, slug)
      `)
      .eq("from_profile_id", seekerId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Benefits: results-page views (token) + saved programs. saved_programs
    // keys off auth.users, so resolve profile → account → user first.
    const [{ data: tokenRows }, { data: account }] = await Promise.all([
      db
        .from("benefits_results_tokens")
        .select("last_viewed_at")
        .eq("profile_id", seekerId)
        .not("last_viewed_at", "is", null)
        .order("last_viewed_at", { ascending: false })
        .limit(1),
      seeker.account_id
        ? db.from("accounts").select("user_id").eq("id", seeker.account_id).single()
        : Promise.resolve({ data: null }),
    ]);

    let savedPrograms: unknown[] = [];
    if (account?.user_id) {
      const { data } = await db
        .from("saved_programs")
        .select("program_id, state_id, name, short_name, program_type, savings_range, created_at")
        .eq("user_id", account.user_id)
        .order("created_at", { ascending: false });
      // Re-read each saved program from the live library rather than trusting
      // the save-time snapshot. The row freezes name/short_name/savings_range
      // at the moment the family tapped save, so a benefits fact-check
      // correction never reached this view: 126 rows across 21 programs carried
      // a stale name and 107 carried a savings figure that had been deleted
      // from the library on purpose. Louisiana's "Caregiver Voucher Program" is
      // the sharpest case — it was reframed to "Paid Family Caregiver through
      // the Community Choices Waiver", so the old label names nothing real.
      // Same fix as app/api/saved-programs/enriched/route.ts, so TJ sees what
      // the family sees. The snapshot stays the fallback when a program has
      // been removed from the library and it is all we have.
      savedPrograms = (data ?? []).map((s) => {
        const program = s.state_id ? getEnrichedProgram(s.state_id, s.program_id) : undefined;
        if (!program) return s;
        return {
          ...s,
          name: program.name,
          short_name: program.shortName || program.name,
          savings_range: program.savingsRange || null,
        };
      });
    }

    return NextResponse.json({
      seeker,
      connectionCount: connectionCount ?? 0,
      connections: connections ?? [],
      savedPrograms,
      benefitsResultsViewedAt: tokenRows?.[0]?.last_viewed_at ?? null,
    });
  } catch (err) {
    console.error("Admin care-seeker detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/care-seekers/[seekerId]
 *
 * Hard delete a care seeker profile (FK cascades handle connections).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seekerId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { seekerId } = await params;
    const db = getServiceClient();

    // Fetch current for audit
    const { data: current, error: fetchError } = await db
      .from("business_profiles")
      .select("display_name, email")
      .eq("id", seekerId)
      .eq("type", "family")
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Care seeker not found" }, { status: 404 });
    }

    // Hard delete
    const { error: deleteError } = await db
      .from("business_profiles")
      .delete()
      .eq("id", seekerId);

    if (deleteError) {
      console.error("Admin care-seeker delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete care seeker" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "delete_care_seeker",
      targetType: "family",
      targetId: seekerId,
      details: { display_name: current.display_name, email: current.email },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin care-seeker delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
