import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/caregivers/[caregiverId]
 *
 * Fetch caregiver/student profile detail with connection history.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caregiverId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { caregiverId } = await params;
    const db = getServiceClient();

    const { data: caregiver, error } = await db
      .from("business_profiles")
      .select("*")
      .eq("id", caregiverId)
      .in("type", ["caregiver", "student"])
      .single();

    if (error || !caregiver) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    // Get connection count (applications made by this caregiver)
    const { count: connectionCount } = await db
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("from_profile_id", caregiverId);

    // Get last 20 connections with provider names
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
      .eq("from_profile_id", caregiverId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Also get invitations TO this caregiver (providers reaching out)
    const { data: invitations } = await db
      .from("connections")
      .select(`
        id,
        type,
        status,
        message,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, type, slug)
      `)
      .eq("to_profile_id", caregiverId)
      .eq("type", "invitation")
      .order("created_at", { ascending: false })
      .limit(20);

    // Get interview history if any
    const { data: interviews } = await db
      .from("interviews")
      .select(`
        id,
        status,
        type,
        proposed_time,
        confirmed_time,
        duration_minutes,
        location,
        notes,
        created_at,
        provider_profile:business_profiles!interviews_provider_profile_id_fkey(id, display_name, slug)
      `)
      .eq("student_profile_id", caregiverId)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      caregiver,
      connectionCount: connectionCount ?? 0,
      connections: connections ?? [],
      invitations: invitations ?? [],
      interviews: interviews ?? [],
    });
  } catch (err) {
    console.error("Admin caregiver detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/caregivers/[caregiverId]
 *
 * Hard delete a caregiver/student profile (FK cascades handle connections).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ caregiverId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { caregiverId } = await params;
    const db = getServiceClient();

    // Fetch current for audit
    const { data: current, error: fetchError } = await db
      .from("business_profiles")
      .select("display_name, email, type")
      .eq("id", caregiverId)
      .in("type", ["caregiver", "student"])
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    }

    // Hard delete - include type constraint to prevent accidental deletion of other profile types
    const { error: deleteError } = await db
      .from("business_profiles")
      .delete()
      .eq("id", caregiverId)
      .in("type", ["caregiver", "student"]);

    if (deleteError) {
      console.error("Admin caregiver delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete caregiver" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "delete_caregiver",
      targetType: current.type,
      targetId: caregiverId,
      details: { display_name: current.display_name, email: current.email },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin caregiver delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
