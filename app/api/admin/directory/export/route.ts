import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { exportDirectoryRows, type DirectoryFilters } from "@/lib/providers";

/**
 * GET /api/admin/directory/export
 *
 * Export filtered provider list as CSV for cold outreach.
 * Supports the same filters as the directory list endpoint, including the
 * OP + orphan-BP union when a search query is present. The row-fetch +
 * reconciliation lives behind the provider front door (`lib/providers`); this
 * route owns CSV formatting and the audit log.
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
    const filters: DirectoryFilters = {
      search: searchParams.get("search")?.trim() || "",
      category: searchParams.get("category") || "",
      state: searchParams.get("state") || "",
      tab: searchParams.get("tab") || "all",
    };

    const db = getServiceClient();
    const { rows: csvRows, opCount, bpCount } = await exportDirectoryRows(filters, db);

    // --- Build CSV ------------------------------------------------------
    const headers = ["Name", "Category", "City", "State", "Phone", "Email", "Website", "Google Rating", "Status", "Source"];
    const lines = [headers.join(",")];
    for (const row of csvRows) {
      lines.push([
        csvEscape(row.name),
        csvEscape(row.category),
        csvEscape(row.city),
        csvEscape(row.state),
        csvEscape(row.phone),
        csvEscape(row.email),
        csvEscape(row.website),
        row.rating,
        row.status,
        row.source,
      ].join(","));
    }
    const csv = lines.join("\n");

    const parts = ["olera-providers"];
    if (filters.state) parts.push(filters.state);
    if (filters.category) parts.push(filters.category.replace(/\s+/g, "-").toLowerCase());
    if (filters.tab !== "all") parts.push(filters.tab);
    const filename = `${parts.join("-")}-${new Date().toISOString().slice(0, 10)}.csv`;

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "export_directory",
      targetType: "directory_provider",
      targetId: "bulk_export",
      details: {
        filters: { search: filters.search, category: filters.category, state: filters.state, tab: filters.tab },
        row_count: csvRows.length,
        op_count: opCount,
        bp_count: bpCount,
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Directory export error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
