import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/medjobs
 *
 * List student profiles with search, filters, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "50", 10)));

    const db = getServiceClient();

    let query = db
      .from("business_profiles")
      .select("id, slug, display_name, email, city, state, metadata, is_active, image_url, created_at", { count: "exact" })
      .eq("type", "student")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error("Admin medjobs list error:", error);
      return NextResponse.json({ error: `Failed to fetch students: ${error.message}` }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({ students: data ?? [], total, page, per_page: perPage, total_pages: totalPages });
  } catch (err) {
    console.error("Admin medjobs list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/medjobs
 *
 * Create a new student profile.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const body = await request.json();
    const displayName = (body.display_name || "").trim();
    const university = (body.university || "").trim();

    if (!displayName) return NextResponse.json({ error: "Student name is required" }, { status: 400 });

    const db = getServiceClient();

    // Generate slug
    const baseSlug = `${displayName}-${university || "student"}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const suffix = Math.random().toString(36).slice(2, 6);
    const slug = `${baseSlug}-${suffix}`;

    const profileId = crypto.randomUUID();

    const { error: insertError } = await db
      .from("business_profiles")
      .insert({
        id: profileId,
        type: "student",
        display_name: displayName,
        slug,
        is_active: true,
        metadata: {
          university: university || undefined,
          profile_completeness: university ? 20 : 10,
        },
      });

    if (insertError) {
      console.error("Admin medjobs create error:", insertError);
      return NextResponse.json({ error: `Failed to create student: ${insertError.message}` }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "create_student_profile",
      targetType: "student",
      targetId: profileId,
      details: { display_name: displayName, university, slug },
    });

    return NextResponse.json({ student: { id: profileId } }, { status: 201 });
  } catch (err) {
    console.error("Admin medjobs create error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
