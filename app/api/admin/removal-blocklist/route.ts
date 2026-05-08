import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { normalizeProviderName } from "@/lib/normalize-provider-name";

const VALID_REASONS = new Set([
  "provider_request",
  "data_sweep",
  "duplicate",
  "out_of_scope",
  "other",
]);

/**
 * GET /api/admin/removal-blocklist
 *
 * List all blocklist entries, newest first.
 * Optional query: ?q=<text> — substring match against normalized_name.
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

    const db = getServiceClient();
    const q = request.nextUrl.searchParams.get("q")?.trim();

    let query = db
      .from("provider_removal_blocklist")
      .select("*")
      .order("added_at", { ascending: false });

    if (q) {
      const normalized = normalizeProviderName(q);
      if (normalized.length > 0) {
        query = query.ilike("normalized_name", `%${normalized}%`);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("[blocklist GET]", error);
      return NextResponse.json({ error: "Failed to load blocklist" }, { status: 500 });
    }

    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    console.error("[blocklist GET] unexpected", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/removal-blocklist
 *
 * Add a new blocklist entry.
 * Body: { provider_name, city?, state?, phone?, place_id?, reason, evidence?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();

    const provider_name = typeof body.provider_name === "string" ? body.provider_name.trim() : "";
    if (!provider_name) {
      return NextResponse.json({ error: "provider_name is required" }, { status: 400 });
    }

    const reason = typeof body.reason === "string" ? body.reason : "";
    if (!VALID_REASONS.has(reason)) {
      return NextResponse.json(
        { error: `reason must be one of: ${[...VALID_REASONS].join(", ")}` },
        { status: 400 }
      );
    }

    const normalized_name = normalizeProviderName(provider_name);
    if (!normalized_name) {
      return NextResponse.json(
        { error: "provider_name normalizes to empty string" },
        { status: 400 }
      );
    }

    const city = typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;
    const state =
      typeof body.state === "string" && body.state.trim() ? body.state.trim().toUpperCase() : null;
    const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    const place_id =
      typeof body.place_id === "string" && body.place_id.trim() ? body.place_id.trim() : null;
    const evidence =
      typeof body.evidence === "string" && body.evidence.trim() ? body.evidence.trim() : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    const db = getServiceClient();
    const { data, error } = await db
      .from("provider_removal_blocklist")
      .insert({
        provider_name,
        normalized_name,
        city,
        state,
        phone,
        place_id,
        reason,
        evidence,
        notes,
        added_by_email: adminUser.email,
      })
      .select()
      .single();

    if (error) {
      // 23505 = unique_violation on (normalized_name, state)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An entry with this name + state already exists" },
          { status: 409 }
        );
      }
      console.error("[blocklist POST]", error);
      return NextResponse.json({ error: "Failed to add entry" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "blocklist_add",
      targetType: "removal_blocklist",
      targetId: data.id,
      details: { provider_name, normalized_name, state, reason },
    });

    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error("[blocklist POST] unexpected", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/removal-blocklist?id=<uuid>
 *
 * Remove a blocklist entry. Only use when an entry was added in error —
 * legitimate provider-requested takedowns should remain.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: existing } = await db
      .from("provider_removal_blocklist")
      .select("provider_name, normalized_name, state, reason")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const { error } = await db.from("provider_removal_blocklist").delete().eq("id", id);
    if (error) {
      console.error("[blocklist DELETE]", error);
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "blocklist_remove",
      targetType: "removal_blocklist",
      targetId: id,
      details: existing,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[blocklist DELETE] unexpected", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
