import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

const EDITABLE_FIELDS = new Set([
  "provider_name",
  "provider_category",
  "main_category",
  "provider_description",
  "phone",
  "email",
  "website",
  "address",
  "city",
  "state",
  "zipcode",
  "lat",
  "lon",
  "place_id",
  "lower_price",
  "upper_price",
  "contact_for_price",
  "google_rating",
  "community_Score",
  "value_score",
  "information_availability_score",
  "provider_logo",
  "provider_images",
  "hero_image_url",
  "deleted",
]);

/**
 * GET /api/admin/directory/[providerId]
 *
 * Full provider detail with image metadata.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
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

    const { providerId } = await params;
    const db = getServiceClient();

    // Get full provider record
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Get classified image metadata
    let images: Record<string, unknown>[] = [];
    try {
      const { data, error: imagesError } = await db
        .from("provider_image_metadata")
        .select("*")
        .eq("provider_id", providerId)
        .order("quality_score", { ascending: false });

      if (!imagesError && data) {
        images = data;
      }
    } catch {
      // Table may not exist yet
    }

    // Parse raw images from the provider record
    const rawImages: string[] = [];
    if (provider.provider_logo) {
      rawImages.push(provider.provider_logo);
    }
    if (provider.provider_images) {
      const parsed = (provider.provider_images as string)
        .split(" | ")
        .map((u: string) => u.trim())
        .filter(Boolean);
      for (const url of parsed) {
        if (url !== provider.provider_logo) rawImages.push(url);
      }
    }

    return NextResponse.json({ provider, images, rawImages });
  } catch (err) {
    console.error("Directory detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/directory/[providerId]
 *
 * Update provider fields with allowlist + audit logging.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
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

    const { providerId } = await params;
    const body = await request.json();
    const db = getServiceClient();

    // Filter to only allowed fields
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (EDITABLE_FIELDS.has(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Fetch current state for audit diff
    const { data: current, error: fetchError } = await db
      .from("olera-providers")
      .select("*")
      .eq("provider_id", providerId)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Auto-set deleted_at when deleted changes
    if ("deleted" in updates) {
      if (updates.deleted === true && !current.deleted) {
        updates.deleted_at = new Date().toISOString();
      } else if (!updates.deleted && current.deleted) {
        updates.deleted_at = null;
      }
    }

    // Apply update
    const { error: updateError } = await db
      .from("olera-providers")
      .update(updates)
      .eq("provider_id", providerId);

    if (updateError) {
      console.error("Directory update error:", updateError);
      return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
    }

    // Build audit diff
    const changedFields: Record<string, { from: unknown; to: unknown }> = {};
    for (const [key, value] of Object.entries(updates)) {
      const currentVal = current[key as keyof typeof current];
      if (currentVal !== value) {
        changedFields[key] = { from: currentVal, to: value };
      }
    }

    if (Object.keys(changedFields).length > 0) {
      await logAuditAction({
        adminUserId: adminUser.id,
        action: "update_directory_provider",
        targetType: "directory_provider",
        targetId: providerId,
        details: {
          provider_name: current.provider_name,
          changed_fields: changedFields,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Directory update error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
