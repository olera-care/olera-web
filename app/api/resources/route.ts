import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/resources
 *
 * Public endpoint — returns published articles only.
 * Uses the anon client so RLS applies.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const careType = searchParams.get("care_type") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("per_page") || "20", 10)));

    const supabase = await createClient();

    let query = supabase
      .from("content_articles")
      .select(
        "id, slug, title, subtitle, excerpt, cover_image_url, care_types, category, author_name, author_role, author_avatar, featured, reading_time, tags, published_at",
        { count: "exact" }
      )
      .eq("status", "published")
      .not("published_at", "is", null);

    if (careType) {
      query = query.contains("care_types", [careType]);
    }

    if (category) {
      query = query.eq("category", category);
    }

    query = query.order("published_at", { ascending: false });

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Public resources error:", error);
      return NextResponse.json(
        { error: "Failed to fetch resources" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
      total_pages: Math.ceil((count ?? 0) / perPage),
    });
  } catch (err) {
    console.error("Public resources error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
