import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, getAuthUser, getServiceClient } from "@/lib/admin";
import { CONTENT_PAGE_FILTERS } from "@/lib/analytics/content-pages";

/**
 * GET /api/admin/operating-map/inspect?node=cr2&date_from&date_to&city
 *
 * The receipts behind one number on the operating map: which table it came
 * from, exactly which rows were counted, and the most recent handful with
 * timestamps.
 *
 * This exists so a number on the map can be checked rather than trusted.
 * Every figure on that page is one query against one table, and anyone who
 * doubts a value should be able to see the query in words and the rows
 * underneath it without asking an engineer.
 */

export const dynamic = "force-dynamic";

const SAMPLE_SIZE = 8;

/**
 * One descriptor per instrumented node. Adding a node to the map means
 * adding it here too — a number nobody can inspect is exactly the kind this
 * page is meant to stop producing.
 */
const SOURCES: Record<
  string,
  {
    title: string;
    table: string;
    select: string;
    where: string[];
    eventType?: string;
    contentFilter?: string;
    /** These nodes count page views, so a visitor city applies. */
    cityScoped: boolean;
    summarize: (row: Record<string, unknown>) => string;
  }
> = {
  cr2: {
    title: "Organic visitors",
    table: "page_events",
    select: "created_at, page, session_id, metadata",
    where: [
      "event_type is page_view",
      "referrer_class is search",
      "counted once per visitor (olera_session cookie)",
    ],
    eventType: "page_view",
    cityScoped: true,
    summarize: (r) => String(r.page ?? "—"),
  },
  cr4: {
    title: "Page visits — content pages",
    table: "page_events",
    select: "created_at, page, session_id, metadata",
    where: ["event_type is page_view", "session id is present"],
    eventType: "page_view",
    cityScoped: true,
    summarize: (r) => String(r.page ?? "—"),
  },
  cr5: {
    title: "Questions asked",
    table: "provider_question_asks",
    select: "created_at, provider_id, original_question",
    where: ["every row is one question submitted"],
    cityScoped: false,
    summarize: (r) => String(r.original_question ?? "").slice(0, 90) || "—",
  },
  cr6a: {
    title: "Benefits CTAs",
    table: "seeker_activity",
    select: "created_at, event_type, related_provider_id",
    where: ["event_type is benefits_completed"],
    eventType: "benefits_completed",
    cityScoped: false,
    summarize: () => "Benefits screener completed",
  },
  cr6b: {
    title: "Connection CTAs",
    table: "provider_activity",
    select: "created_at, event_type, provider_id",
    where: ["event_type is lead_received"],
    eventType: "lead_received",
    cityScoped: false,
    summarize: (r) => `Provider ${String(r.provider_id ?? "—")}`,
  },
  cr6c: {
    title: "Profiles made live",
    table: "seeker_activity",
    select: "created_at, event_type, related_provider_id",
    where: ["event_type is matches_activated"],
    eventType: "matches_activated",
    cityScoped: false,
    summarize: () => "Care post published",
  },
};

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
    const node = searchParams.get("node") ?? "";
    const from = searchParams.get("date_from");
    const to = searchParams.get("date_to");
    const city = searchParams.get("city");

    const source = SOURCES[node];
    if (!source) {
      return NextResponse.json(
        { error: "That node cannot be inspected yet." },
        { status: 404 },
      );
    }

    const db = getServiceClient();
    let query = db
      .from(source.table)
      .select(source.select)
      .order("created_at", { ascending: false })
      .limit(SAMPLE_SIZE);

    const where = [...source.where];
    if (source.eventType) query = query.eq("event_type", source.eventType);
    if (node === "cr2") {
      query = query.filter("metadata->>referrer_class", "eq", "search");
    }
    if (node === "cr4") {
      query = query.or(
        `${CONTENT_PAGE_FILTERS.benefit},${CONTENT_PAGE_FILTERS.guide}`,
      );
      where.push("benefits and editorial pages (provider pages counted separately)");
    }
    if (city && source.cityScoped) {
      query = query.filter("metadata->>geo_city", "eq", city);
      where.push(`visitor city is ${city}`);
    } else if (city) {
      where.push("city filter does not apply — city is only recorded on page views");
    }
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lt("created_at", to);

    const { data, error } = await query;
    if (error) throw error;

    const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
      when: String(r.created_at ?? ""),
      summary: source.summarize(r),
    }));

    return NextResponse.json({
      node,
      title: source.title,
      table: source.table,
      where,
      window: { from, to },
      rows,
      // A node whose sample is empty over a range with a non-zero count is
      // itself a signal worth seeing, so this is never dressed up.
      note:
        rows.length === 0
          ? "No matching rows in this window."
          : `Most recent ${rows.length} matching rows.`,
    });
  } catch (error) {
    console.error("[operating-map/inspect] Failed:", error);
    return NextResponse.json({ error: "Failed to load rows" }, { status: 500 });
  }
}
