import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

const EDITABLE_FIELDS = new Set([
  "title",
  "subtitle",
  "slug",
  "excerpt",
  "content_json",
  "content_html",
  "cover_image_url",
  "care_types",
  "category",
  "author_name",
  "author_role",
  "author_avatar",
  "status",
  "featured",
  "tags",
  "reading_time",
  // SEO
  "meta_title",
  "meta_description",
  "og_title",
  "og_description",
  "og_image_url",
  "canonical_url",
  "noindex",
  "structured_data_type",
  "focus_keyword",
  "twitter_card_type",
  // Timestamps managed by the API
  "published_at",
]);

/**
 * GET /api/admin/content/[articleId]
 *
 * Full article detail for the admin editor.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { articleId } = await params;
    const db = getServiceClient();

    const { data: article, error } = await db
      .from("content_articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (error || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({ article });
  } catch (err) {
    console.error("Content detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/content/[articleId]
 *
 * Update article fields with allowlist + audit logging.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { articleId } = await params;
    const body = await request.json();
    const db = getServiceClient();

    // Filter to allowed fields only
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (EDITABLE_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Always update the audit columns
    updates.updated_at = new Date().toISOString();
    updates.updated_by = user.id;

    // Auto-set published_at when publishing for the first time
    if (updates.status === "published") {
      const { data: current } = await db
        .from("content_articles")
        .select("published_at, status")
        .eq("id", articleId)
        .single();

      if (current && !current.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    // Fetch current state for audit diff
    const { data: current, error: fetchError } = await db
      .from("content_articles")
      .select("*")
      .eq("id", articleId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Apply update
    const { error: updateError } = await db
      .from("content_articles")
      .update(updates)
      .eq("id", articleId);

    if (updateError) {
      console.error("Content update error:", updateError);
      return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
    }

    // Build audit diff (skip content_json/content_html to keep log concise)
    const skipDiffFields = new Set(["content_json", "content_html", "updated_at", "updated_by"]);
    const changedFields: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (skipDiffFields.has(key)) continue;
      const currentVal = current[key as keyof typeof current];
      if (JSON.stringify(currentVal) !== JSON.stringify(value)) {
        changedFields[key] = { from: currentVal, to: value };
      }
    }

    if (Object.keys(changedFields).length > 0) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "update_content_article",
        targetType: "content_article",
        targetId: articleId,
        details: {
          title: current.title,
          changed_fields: changedFields,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Content update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
