import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/leads
 *
 * List all connections with from/to profile info.
 * Query params: status, type, limit, offset, count_only
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
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const countOnly = searchParams.get("count_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const search = searchParams.get("search")?.trim() || "";

    const db = getServiceClient();
    const needsEmail = searchParams.get("needs_email") === "true";
    const showArchived = searchParams.get("archived") === "true";

    // If searching, find matching profile IDs first (fast indexed lookup)
    let searchProfileIds: string[] | null = null;
    if (search) {
      const { data: matchingProfiles } = await db
        .from("business_profiles")
        .select("id")
        .ilike("display_name", `%${search}%`)
        .limit(200);

      searchProfileIds = (matchingProfiles ?? []).map((p) => p.id);
      if (searchProfileIds.length === 0) {
        return NextResponse.json({ connections: [], total: 0 });
      }
    }

    // Build base filter helper
    function applyFilters(q: typeof query) {
      if (status) q = q.eq("status", status);
      if (type) q = q.eq("type", type);
      if (needsEmail) q = q.contains("metadata", { needs_provider_email: true });
      // Show archived OR non-archived
      if (showArchived) {
        q = q.contains("metadata", { archived: true });
      } else {
        // Exclude archived leads using NOT contains.
        // metadata defaults to '{}' so null is rare. For null metadata,
        // NOT(null @> ...) = NULL which Postgres treats as FALSE, excluding the row.
        // This is acceptable since null metadata means it's not archived anyway.
        // If needed, we can revisit with a raw SQL filter.
        q = q.not("metadata", "cs", JSON.stringify({ archived: true }));
      }
      if (searchProfileIds) {
        q = q.or(
          `from_profile_id.in.(${searchProfileIds.join(",")}),to_profile_id.in.(${searchProfileIds.join(",")})`
        );
      }
      return q;
    }

    if (countOnly) {
      let countQuery = db
        .from("connections")
        .select("*", { count: "exact", head: true });
      countQuery = applyFilters(countQuery);
      const { count } = await countQuery;
      return NextResponse.json({ count: count ?? 0 });
    }

    // Get total count for pagination
    let totalQuery = db
      .from("connections")
      .select("*", { count: "exact", head: true });
    totalQuery = applyFilters(totalQuery);
    const { count: total } = await totalQuery;

    // Fetch connections with joined profile names
    let query = db
      .from("connections")
      .select(`
        id,
        type,
        status,
        message,
        metadata,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(id, display_name, type, email, phone, metadata, care_types),
        to_profile:business_profiles!connections_to_profile_id_fkey(id, display_name, type, slug, source_provider_id)
      `)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    query = applyFilters(query);

    const { data: connections, error } = await query;

    if (error) {
      console.error("Failed to fetch leads:", error);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    return NextResponse.json({ connections: connections ?? [], total: total ?? 0 });
  } catch (err) {
    console.error("Admin leads error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/leads
 *
 * Archive or unarchive connections.
 * Body: { ids: string[], action: "archive" | "unarchive", reason?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const { ids, action, reason } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }
    if (action !== "archive" && action !== "unarchive") {
      return NextResponse.json({ error: "action must be 'archive' or 'unarchive'" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch current metadata for each connection
    const { data: connections, error: fetchErr } = await db
      .from("connections")
      .select("id, metadata")
      .in("id", ids);

    if (fetchErr) {
      return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
    }

    let updated = 0;
    for (const conn of connections ?? []) {
      const meta = (conn.metadata || {}) as Record<string, unknown>;
      if (action === "archive") {
        meta.archived = true;
        meta.archive_reason = reason || null;
        meta.archived_at = new Date().toISOString();
      } else {
        delete meta.archived;
        delete meta.archive_reason;
        delete meta.archived_at;
      }

      const { error: updateErr } = await db
        .from("connections")
        .update({ metadata: meta })
        .eq("id", conn.id);

      if (!updateErr) updated++;
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: action === "archive" ? "archive_leads" : "unarchive_leads",
      targetType: "connection",
      targetId: ids.length === 1 ? ids[0] : "bulk",
      details: { ids, reason: reason || null, count: updated },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Admin leads PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/leads
 *
 * Hard delete one or more connections by ID.
 * Body: { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const ids: string[] = body.ids;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Cannot delete more than 100 leads at once" }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch connection details before deleting (for audit log)
    const { data: toDelete } = await db
      .from("connections")
      .select(`
        id,
        type,
        status,
        created_at,
        from_profile:business_profiles!connections_from_profile_id_fkey(display_name),
        to_profile:business_profiles!connections_to_profile_id_fkey(display_name)
      `)
      .in("id", ids);

    // Hard delete
    const { error: deleteError, count } = await db
      .from("connections")
      .delete({ count: "exact" })
      .in("id", ids);

    if (deleteError) {
      console.error("Admin leads delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete leads" }, { status: 500 });
    }

    // Audit log each deletion
    for (const conn of toDelete ?? []) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "delete_lead",
        targetType: "connection",
        targetId: conn.id,
        details: {
          type: conn.type,
          status: conn.status,
          from: (conn.from_profile as unknown as { display_name: string } | null)?.display_name,
          to: (conn.to_profile as unknown as { display_name: string } | null)?.display_name,
          created_at: conn.created_at,
        },
      });
    }

    return NextResponse.json({ success: true, deleted: count ?? 0 });
  } catch (err) {
    console.error("Admin leads delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
