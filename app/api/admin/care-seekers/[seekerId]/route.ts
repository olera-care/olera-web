import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

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

    return NextResponse.json({
      seeker,
      connectionCount: connectionCount ?? 0,
      connections: connections ?? [],
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
