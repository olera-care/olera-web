import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * GET /api/admin/images/[providerId]
 *
 * Get all images for a provider with metadata.
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

    // Get provider info
    const { data: provider, error: providerError } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, hero_image_url, provider_logo, provider_images")
      .eq("provider_id", providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Get classified image metadata (may be empty if script hasn't run)
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
      // Table may not exist yet — that's fine
    }

    // Parse raw images from the provider record as fallback
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
    console.error("Admin images detail error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/images/[providerId]
 *
 * Admin override actions on provider images.
 * Body: { action, image_url?, new_type? }
 *
 * Actions:
 * - override_type: Change image_type for a specific image
 * - set_hero: Set a specific image as hero
 * - clear_hero: Remove hero (revert to stock)
 * - mark_reviewed: Mark all provider images as admin_reviewed
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
    const { action, image_url, new_type } = body;

    if (!["override_type", "set_hero", "clear_hero", "mark_reviewed"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'override_type', 'set_hero', 'clear_hero', or 'mark_reviewed'." },
        { status: 400 }
      );
    }

    const db = getServiceClient();
    const now = new Date().toISOString();

    if (action === "override_type") {
      if (!image_url || !["logo", "photo", "unknown"].includes(new_type)) {
        return NextResponse.json(
          { error: "override_type requires image_url and new_type (logo | photo | unknown)" },
          { status: 400 }
        );
      }

      const { error } = await db
        .from("provider_image_metadata")
        .update({
          image_type: new_type,
          review_status: "admin_overridden",
          reviewed_by: adminUser.id,
          reviewed_at: now,
        })
        .eq("provider_id", providerId)
        .eq("image_url", image_url);

      if (error) {
        console.error("Override type error:", error);
        return NextResponse.json({ error: "Failed to override type" }, { status: 500 });
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "override_image_type",
        targetType: "provider_image",
        targetId: providerId,
        details: { image_url, new_type },
      });
    }

    if (action === "set_hero") {
      if (!image_url) {
        return NextResponse.json({ error: "set_hero requires image_url" }, { status: 400 });
      }

      // Clear existing hero
      await db
        .from("provider_image_metadata")
        .update({ is_hero: false })
        .eq("provider_id", providerId);

      // Set new hero
      const { error } = await db
        .from("provider_image_metadata")
        .update({
          is_hero: true,
          review_status: "admin_overridden",
          reviewed_by: adminUser.id,
          reviewed_at: now,
        })
        .eq("provider_id", providerId)
        .eq("image_url", image_url);

      if (error) {
        console.error("Set hero error:", error);
        return NextResponse.json({ error: "Failed to set hero" }, { status: 500 });
      }

      // Update denormalized hero_image_url
      await db
        .from("olera-providers")
        .update({ hero_image_url: image_url })
        .eq("provider_id", providerId);

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "set_hero_image",
        targetType: "provider_image",
        targetId: providerId,
        details: { image_url },
      });
    }

    if (action === "clear_hero") {
      await db
        .from("provider_image_metadata")
        .update({ is_hero: false })
        .eq("provider_id", providerId);

      await db
        .from("olera-providers")
        .update({ hero_image_url: null })
        .eq("provider_id", providerId);

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "clear_hero_image",
        targetType: "provider_image",
        targetId: providerId,
        details: {},
      });
    }

    if (action === "mark_reviewed") {
      const { error } = await db
        .from("provider_image_metadata")
        .update({
          review_status: "admin_reviewed",
          reviewed_by: adminUser.id,
          reviewed_at: now,
        })
        .eq("provider_id", providerId)
        .neq("review_status", "admin_overridden"); // Don't downgrade overrides

      if (error) {
        console.error("Mark reviewed error:", error);
        return NextResponse.json({ error: "Failed to mark reviewed" }, { status: 500 });
      }

      await logAuditAction({
        adminUserId: adminUser.id,
        action: "mark_images_reviewed",
        targetType: "provider_image",
        targetId: providerId,
        details: {},
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin images action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
