import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/directory/export
 *
 * Export filtered provider list as CSV for cold outreach.
 * Supports the same filters as the directory list endpoint, including the
 * OP + orphan-BP union when a search query is present.
 */
const BP_TO_OP_CATEGORY: Record<string, string> = {
  assisted_living: "Assisted Living",
  home_care_agency: "Home Care (Non-medical)",
  home_health_agency: "Home Health Care",
  independent_living: "Independent Living",
  memory_care: "Memory Care",
  hospice_agency: "Hospice",
  rehab_facility: "Rehab Facility",
};

const OP_TO_BP_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(BP_TO_OP_CATEGORY).map(([bp, op]) => [op, bp])
);

function displayBpCategory(category: string | null): string {
  if (!category) return "";
  return BP_TO_OP_CATEGORY[category] ?? category;
}

interface OpRow {
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

interface BpRow {
  display_name: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface CsvRow {
  name: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  rating: string;
  status: string;
  source: string;
}

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
    const includeBps = search.length > 0 && tab !== "deleted";

    // --- OP query with Supabase 1000-row pagination --------------------
    const PAGE_SIZE = 1000;
    let allOpRows: OpRow[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      let query = db
        .from("olera-providers")
        .select(
          "provider_name, provider_category, city, state, phone, email, website, google_rating, deleted"
        );

      if (tab === "published") query = query.or("deleted.is.null,deleted.eq.false");
      else if (tab === "deleted") query = query.eq("deleted", true);
      else if (tab === "no_city") query = query.is("city", null);
      if (search) query = query.ilike("provider_name", `%${search}%`);
      if (category) query = query.eq("provider_category", category);
      if (stateFilter) query = query.eq("state", stateFilter);

      query = query.order("provider_name", { ascending: true });
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data: pageData, error: pageError } = await query;

      if (pageError) {
        console.error("Directory export OP error:", pageError);
        return NextResponse.json({ error: "Failed to export providers" }, { status: 500 });
      }

      const rows = (pageData ?? []) as OpRow[];
      allOpRows = allOpRows.concat(rows);
      offset += PAGE_SIZE;
      hasMore = rows.length === PAGE_SIZE;
    }

    // --- Orphan BP query (only when search is active) -------------------
    let allBpRows: BpRow[] = [];
    if (includeBps) {
      let bpQuery = db
        .from("business_profiles")
        .select("display_name, category, city, state, phone, email, website")
        .in("type", ["organization", "caregiver"])
        .is("source_provider_id", null);

      if (tab === "no_city") bpQuery = (bpQuery as any).is("city", null);
      bpQuery = (bpQuery as any).ilike("display_name", `%${search}%`);
      if (category) {
        const bpCategory = OP_TO_BP_CATEGORY[category];
        bpQuery = (bpQuery as any).eq("category", bpCategory ?? "__no_match__");
      }
      if (stateFilter) bpQuery = (bpQuery as any).eq("state", stateFilter);
      bpQuery = (bpQuery as any).order("display_name", { ascending: true });

      const { data: bpData, error: bpError } = await bpQuery;
      if (bpError) {
        console.error("Directory export BP error:", bpError);
      } else {
        allBpRows = (bpData ?? []) as BpRow[];
      }
    }

    // --- Merge and sort -------------------------------------------------
    const csvRows: CsvRow[] = [
      ...allOpRows.map<CsvRow>((row) => ({
        name: row.provider_name ?? "",
        category: row.provider_category ?? "",
        city: row.city ?? "",
        state: row.state ?? "",
        phone: row.phone ?? "",
        email: row.email ?? "",
        website: row.website ?? "",
        rating: row.google_rating != null ? String(row.google_rating) : "",
        status: row.deleted ? "Deleted" : "Published",
        source: "olera-providers",
      })),
      ...allBpRows.map<CsvRow>((row) => ({
        name: row.display_name ?? "",
        category: displayBpCategory(row.category),
        city: row.city ?? "",
        state: row.state ?? "",
        phone: row.phone ?? "",
        email: row.email ?? "",
        website: row.website ?? "",
        rating: "",
        status: "Published",
        source: "business_profiles",
      })),
    ];
    csvRows.sort((a, b) => a.name.localeCompare(b.name));

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
        row_count: csvRows.length,
        op_count: allOpRows.length,
        bp_count: allBpRows.length,
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
