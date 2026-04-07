import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/providers
 *
 * List business profiles filtered by claim_state.
 * Query params: status (default: "pending"), count_only, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const countOnly = searchParams.get("count_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const db = getServiceClient();

    if (countOnly) {
      const { count } = await db
        .from("business_profiles")
        .select("*", { count: "exact", head: true })
        .eq("claim_state", status)
        .in("type", ["organization", "caregiver"]);

      return NextResponse.json({ count: count ?? 0 });
    }

    let query = db
      .from("business_profiles")
      .select("id, display_name, type, category, city, state, claim_state, created_at, email, phone, slug, source_provider_id")
      .in("type", ["organization", "caregiver"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== "all") {
      query = query.eq("claim_state", status);
    }

    const { data: providers, error } = await query;

    if (error) {
      console.error("Failed to fetch providers:", error);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    return NextResponse.json({ providers: providers ?? [] });
  } catch (err) {
    console.error("Admin providers error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/providers
 *
 * Bulk approve or reject provider claims.
 * Body: { ids: string[], action: "approve" | "reject" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const newState = action === "approve" ? "claimed" : "rejected";
    const db = getServiceClient();

    const { error: updateError, count } = await db
      .from("business_profiles")
      .update({ claim_state: newState, updated_at: new Date().toISOString() })
      .in("id", ids)
      .in("type", ["organization", "caregiver"]);

    if (updateError) {
      console.error("Bulk provider action error:", updateError);
      return NextResponse.json({ error: "Failed to update providers" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: action === "approve" ? "bulk_approve_providers" : "bulk_reject_providers",
      targetType: "business_profile",
      targetId: "bulk",
      details: { ids, new_state: newState, count: count ?? ids.length },
    });

    return NextResponse.json({ success: true, updated: count ?? ids.length });
  } catch (err) {
    console.error("Bulk provider action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/providers
 *
 * Bulk delete provider claims.
 * Body: { ids: string[], reason?: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { ids, reason } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch names before deleting for audit
    const { data: toDelete } = await db
      .from("business_profiles")
      .select("id, display_name")
      .in("id", ids);

    const { error: deleteError, count } = await db
      .from("business_profiles")
      .delete({ count: "exact" })
      .in("id", ids)
      .in("type", ["organization", "caregiver"]);

    if (deleteError) {
      console.error("Bulk provider delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete providers" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "bulk_delete_providers",
      targetType: "business_profile",
      targetId: "bulk",
      details: {
        ids,
        names: (toDelete ?? []).map((p) => p.display_name),
        reason: reason || null,
        count: count ?? ids.length,
      },
    });

    return NextResponse.json({ success: true, deleted: count ?? 0 });
  } catch (err) {
    console.error("Bulk provider delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
