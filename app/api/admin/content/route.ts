import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { slugify } from "@/lib/slugify";
import type { ContentArticleListItem } from "@/types/content";

const LIST_FIELDS =
  "id, slug, title, excerpt, cover_image_url, care_types, category, author_name, status, featured, reading_time, published_at, created_at, updated_at";

/**
 * GET /api/admin/content
 *
 * List articles with search, status tab, category filter, and pagination.
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
    const status = searchParams.get("status") || "all";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "20", 10)));

    const db = getServiceClient();

    let query = db
      .from("content_articles")
      .select(LIST_FIELDS, { count: "exact" });

    // Status tab
    if (status === "draft") {
      query = query.eq("status", "draft");
    } else if (status === "published") {
      query = query.eq("status", "published");
    } else if (status === "archived") {
      query = query.eq("status", "archived");
    }

    // Search
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Category filter
    if (category) {
      query = query.eq("category", category);
    }

    // Order by most recently updated
    query = query.order("updated_at", { ascending: false });

    // Pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Content list error:", error);
      return NextResponse.json(
        { error: `Failed to fetch articles: ${error.message}` },
        { status: 500 }
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    const articles: ContentArticleListItem[] = (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      cover_image_url: row.cover_image_url,
      care_types: row.care_types ?? [],
      category: row.category,
      author_name: row.author_name,
      status: row.status,
      featured: row.featured,
      reading_time: row.reading_time,
      published_at: row.published_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ articles, total, page, per_page: perPage, total_pages: totalPages });
  } catch (err) {
    console.error("Content list error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/content
 *
 * Create a new draft article. Returns { article: { id, slug } }.
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
    const title = (body.title as string)?.trim() || "Untitled Article";
    const slug = slugify(title);

    const db = getServiceClient();

    // Check slug uniqueness — append timestamp if collision
    const { data: existing } = await db
      .from("content_articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const { data: article, error } = await db
      .from("content_articles")
      .insert({
        title,
        slug: finalSlug,
        status: "draft",
        category: body.category || "guide",
        author_name: adminUser.email?.split("@")[0] || "Olera Team",
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id, slug")
      .single();

    if (error) {
      console.error("Content create error:", error);
      return NextResponse.json(
        { error: `Failed to create article: ${error.message}` },
        { status: 500 }
      );
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "create_content_article",
      targetType: "content_article",
      targetId: article.id,
      details: { title, slug: finalSlug },
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    console.error("Content create error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
