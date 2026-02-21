import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { DirectoryListItem } from "@/lib/types";

/**
 * GET /api/admin/directory
 *
 * List providers from olera-providers with search, filters, and server-side pagination.
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "50", 10)));

    const db = getServiceClient();

    let query = db
      .from("olera-providers")
      .select(
        "provider_id, provider_name, provider_category, city, state, google_rating, deleted, hero_image_url, provider_images",
        { count: "exact" }
      );

    // Tab filters
    if (tab === "published") {
      query = query.or("deleted.is.null,deleted.eq.false");
    } else if (tab === "deleted") {
      query = query.eq("deleted", true);
    } else if (tab === "no_city") {
      query = query.is("city", null);
    }

    // Search
    if (search) {
      query = query.ilike("provider_name", `%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq("provider_category", category);
    }

    // State filter
    if (stateFilter) {
      query = query.eq("state", stateFilter);
    }

    // Ordering
    query = query.order("provider_name", { ascending: true });

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Directory list error:", error);
      return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    // Derive image info from provider_images string
    const providers: DirectoryListItem[] = (data ?? []).map((row) => {
      const images = row.provider_images
        ? (row.provider_images as string).split(" | ").filter(Boolean)
        : [];
      return {
        provider_id: row.provider_id,
        provider_name: row.provider_name,
        provider_category: row.provider_category,
        city: row.city,
        state: row.state,
        google_rating: row.google_rating,
        deleted: row.deleted ?? false,
        hero_image_url: row.hero_image_url,
        has_images: images.length > 0,
        image_count: images.length,
      };
    });

    return NextResponse.json({ providers, total, page, per_page: perPage, total_pages: totalPages });
  } catch (err) {
    console.error("Directory list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
