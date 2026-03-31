import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/directory/export
 *
 * Export filtered provider list as CSV for cold outreach.
 * Supports the same filters as the directory list endpoint.
 * Returns all matching rows (no pagination limit).
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
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const stateFilter = searchParams.get("state") || "";
    const tab = searchParams.get("tab") || "all";

    const db = getServiceClient();

    // Paginate through all results since Supabase caps at 1,000 rows per query
    interface ProviderRow {
      provider_name: string | null;
      provider_category: string | null;
      city: string | null;
      state: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      google_rating: number | null;
      deleted: boolean | null;
    }
    const PAGE_SIZE = 1000;
    let allRows: ProviderRow[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db
        .from("olera-providers")
        .select(
          "provider_name, provider_category, city, state, phone, email, website, google_rating, deleted"
        );

      // Tab filters
      if (tab === "published") {
        query = query.or("deleted.is.null,deleted.eq.false");
      } else if (tab === "deleted") {
        query = query.eq("deleted", true);
      } else if (tab === "no_city") {
        query = query.is("city", null);
      }

      if (search) {
        query = query.ilike("provider_name", `%${search}%`);
      }
      if (category) {
        query = query.eq("provider_category", category);
      }
      if (stateFilter) {
        query = query.eq("state", stateFilter);
      }

      query = query.order("provider_name", { ascending: true });
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data: pageData, error: pageError } = await query;

      if (pageError) {
        console.error("Directory export error:", pageError);
        return NextResponse.json({ error: "Failed to export providers" }, { status: 500 });
      }

      const rows = (pageData ?? []) as ProviderRow[];
      allRows = allRows.concat(rows);
      offset += PAGE_SIZE;
      hasMore = rows.length === PAGE_SIZE;
    }

    // Build CSV
    const headers = ["Name", "Category", "City", "State", "Phone", "Email", "Website", "Google Rating", "Status"];
    const csvRows = [headers.join(",")];

    for (const row of allRows) {
      csvRows.push([
        csvEscape(row.provider_name || ""),
        csvEscape(row.provider_category || ""),
        csvEscape(row.city || ""),
        csvEscape(row.state || ""),
        csvEscape(row.phone || ""),
        csvEscape(row.email || ""),
        csvEscape(row.website || ""),
        row.google_rating != null ? String(row.google_rating) : "",
        row.deleted ? "Deleted" : "Published",
      ].join(","));
    }

    const csv = csvRows.join("\n");

    // Build filename from filters
    const parts = ["olera-providers"];
    if (stateFilter) parts.push(stateFilter);
    if (category) parts.push(category.replace(/\s+/g, "-").toLowerCase());
    if (tab !== "all") parts.push(tab);
    const filename = `${parts.join("-")}-${new Date().toISOString().slice(0, 10)}.csv`;

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "export_directory",
      targetType: "directory_provider",
      targetId: "bulk_export",
      details: {
        filters: { search, category, state: stateFilter, tab },
        row_count: allRows.length,
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
