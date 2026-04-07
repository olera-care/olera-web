import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/providers/export
 *
 * Export provider claims as CSV.
 * Query params: status (pending|claimed|rejected|all)
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
    const status = searchParams.get("status") || "all";

    const db = getServiceClient();

    interface ClaimRow {
      display_name: string | null;
      type: string | null;
      category: string | null;
      city: string | null;
      state: string | null;
      email: string | null;
      phone: string | null;
      claim_state: string | null;
      slug: string | null;
      created_at: string | null;
    }

    const PAGE_SIZE = 1000;
    let allRows: ClaimRow[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db
        .from("business_profiles")
        .select("display_name, type, category, city, state, email, phone, claim_state, slug, created_at")
        .in("type", ["organization", "caregiver"])
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (status !== "all") {
        query = query.eq("claim_state", status);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Claims export error:", error);
        return NextResponse.json({ error: "Failed to export claims" }, { status: 500 });
      }

      const rows = (data ?? []) as ClaimRow[];
      allRows = allRows.concat(rows);
      offset += PAGE_SIZE;
      hasMore = rows.length === PAGE_SIZE;
    }

    // Build CSV
    const headers = ["Name", "Type", "Category", "City", "State", "Email", "Phone", "Status", "Profile URL", "Date"];
    const csvRows = [headers.join(",")];

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";

    for (const row of allRows) {
      csvRows.push([
        csvEscape(row.display_name || ""),
        csvEscape(row.type || ""),
        csvEscape(row.category?.replace(/_/g, " ") || ""),
        csvEscape(row.city || ""),
        csvEscape(row.state || ""),
        csvEscape(row.email || ""),
        csvEscape(row.phone || ""),
        csvEscape(row.claim_state || ""),
        row.slug ? csvEscape(`${siteUrl}/provider/${row.slug}`) : "",
        row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : "",
      ].join(","));
    }

    const csv = csvRows.join("\n");

    const parts = ["olera-claims"];
    if (status !== "all") parts.push(status);
    const filename = `${parts.join("-")}-${new Date().toISOString().slice(0, 10)}.csv`;

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "export_claims",
      targetType: "business_profile",
      targetId: "bulk_export",
      details: { status, row_count: allRows.length },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Claims export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
