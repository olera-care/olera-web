import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

// Top-level fields on business_profiles that admins can edit
const EDITABLE_TOP_FIELDS = new Set([
  "display_name",
  "email",
  "phone",
  "city",
  "state",
  "image_url",
  "is_active",
]);

// Metadata keys that admins can edit
const EDITABLE_META_FIELDS = new Set([
  "university",
  "university_id",
  "campus",
  "major",
  "graduation_year",
  "gpa",
  "program_track",
  "certifications",
  "years_caregiving",
  "care_experience_types",
  "languages",
  "availability_type",
  "hours_per_week",
  "available_start",
  "transportation",
  "willing_to_relocate",
  "max_commute_miles",
  "resume_url",
  "video_intro_url",
  "linkedin_url",
  "total_verified_hours",
  "verified_care_types",
  "profile_completeness",
  "seeking_status",
]);

/**
 * GET /api/admin/medjobs/[studentId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { studentId } = await params;
    const db = getServiceClient();

    const { data: student, error } = await db
      .from("business_profiles")
      .select("*")
      .eq("id", studentId)
      .eq("type", "student")
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Get application count
    const { count: applicationCount } = await db
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("from_profile_id", studentId)
      .eq("type", "application");

    return NextResponse.json({ student, applicationCount: applicationCount ?? 0 });
  } catch (err) {
    console.error("Admin medjobs detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/medjobs/[studentId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { studentId } = await params;
    const body = await request.json();
    const db = getServiceClient();

    // Fetch current record
    const { data: current, error: fetchError } = await db
      .from("business_profiles")
      .select("*")
      .eq("id", studentId)
      .eq("type", "student")
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Separate top-level and metadata updates
    const topUpdates: Record<string, unknown> = {};
    const metaUpdates: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (EDITABLE_TOP_FIELDS.has(key)) {
        topUpdates[key] = value;
      } else if (EDITABLE_META_FIELDS.has(key)) {
        metaUpdates[key] = value;
      }
    }

    if (Object.keys(topUpdates).length === 0 && Object.keys(metaUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Build the final update object
    const updates: Record<string, unknown> = { ...topUpdates };

    if (Object.keys(metaUpdates).length > 0) {
      const currentMeta = (current.metadata as Record<string, unknown>) || {};
      updates.metadata = { ...currentMeta, ...metaUpdates };
    }

    const { error: updateError } = await db
      .from("business_profiles")
      .update(updates)
      .eq("id", studentId);

    if (updateError) {
      console.error("Admin medjobs update error:", updateError);
      return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
    }

    // Build audit diff
    const changedFields: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(topUpdates)) {
      const currentVal = current[key as keyof typeof current];
      if (currentVal !== value) {
        changedFields[key] = { from: currentVal, to: value };
      }
    }
    const currentMeta = (current.metadata as Record<string, unknown>) || {};
    for (const [key, value] of Object.entries(metaUpdates)) {
      if (currentMeta[key] !== value) {
        changedFields[`metadata.${key}`] = { from: currentMeta[key], to: value };
      }
    }

    if (Object.keys(changedFields).length > 0) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "update_student_profile",
        targetType: "student",
        targetId: studentId,
        details: {
          display_name: current.display_name,
          changed_fields: changedFields,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin medjobs update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/medjobs/[studentId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { studentId } = await params;
    const db = getServiceClient();

    // Fetch current for audit
    const { data: current, error: fetchError } = await db
      .from("business_profiles")
      .select("display_name")
      .eq("id", studentId)
      .eq("type", "student")
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Hard delete
    const { error: deleteError } = await db
      .from("business_profiles")
      .delete()
      .eq("id", studentId);

    if (deleteError) {
      console.error("Admin medjobs delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "delete_student_profile",
      targetType: "student",
      targetId: studentId,
      details: { display_name: current.display_name },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin medjobs delete error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
