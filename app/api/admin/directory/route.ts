import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { generateProviderSlug } from "@/lib/slugify";
import { PROVIDER_CATEGORIES } from "@/lib/types";
import { countDirectory, listDirectory, type DirectoryFilters } from "@/lib/providers";

/**
 * GET /api/admin/directory
 *
 * List providers with search, filters, and server-side pagination.
 *
 * Union behavior: when a search query is present, the list also includes orphan
 * `business_profiles` rows (source_provider_id IS NULL, type IN (organization,
 * caregiver)) whose display_name matches. This makes BP-only providers
 * (e.g., Aggie Assisted Living) findable by admin search. Without search, the
 * list stays OP-only to preserve existing pagination semantics. The OP + BP
 * reconciliation lives behind the provider front door (`lib/providers`).
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
    const countOnly = searchParams.get("count_only") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "50", 10)));

    const db = getServiceClient();

    if (countOnly) {
      const total = await countDirectory(filters, db);
      return NextResponse.json({ total });
    }

    const result = await listDirectory(filters, page, perPage, db);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Directory list error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/directory
 *
 * Create a new provider with minimal required fields.
 * Redirects to detail page for full editing.
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
    const providerName = (body.provider_name || "").trim();
    const providerCategory = (body.provider_category || "").trim();

    if (!providerName) {
      return NextResponse.json({ error: "Provider name is required" }, { status: 400 });
    }
    if (!providerCategory || !PROVIDER_CATEGORIES.includes(providerCategory)) {
      return NextResponse.json({ error: "Valid provider category is required" }, { status: 400 });
    }

    const db = getServiceClient();
    const providerId = crypto.randomUUID();
    const baseSlug = generateProviderSlug(providerName, null);

    // Ensure slug uniqueness — append random suffix if base slug exists
    let slug = baseSlug;
    const { data: existing } = await db
      .from("olera-providers")
      .select("provider_id")
      .eq("slug", baseSlug)
      .limit(1);
    if (existing && existing.length > 0) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    }

    const { error: insertError } = await db
      .from("olera-providers")
      .insert({
        provider_id: providerId,
        provider_name: providerName,
        provider_category: providerCategory,
        slug,
        deleted: false,
        deleted_at: null,
      });

    if (insertError) {
      console.error("Directory create error:", insertError);
      return NextResponse.json(
        { error: `Failed to create provider: ${insertError.message}` },
        { status: 500 }
      );
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "create_directory_provider",
      targetType: "directory_provider",
      targetId: providerId,
      details: {
        provider_name: providerName,
        provider_category: providerCategory,
        slug,
      },
    });

    return NextResponse.json({ provider: { provider_id: providerId } }, { status: 201 });
  } catch (err) {
    console.error("Directory create error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
