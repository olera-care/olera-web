import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

const BUCKET = "provider-directory-images";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * POST /api/admin/directory/upload
 *
 * Upload an image to Supabase Storage for a provider.
 * Appends the new URL to the provider's provider_images field.
 * Returns { imageUrl: string }.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const providerId = formData.get("providerId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!providerId) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Please upload a JPEG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 5MB." },
        { status: 400 }
      );
    }

    const db = getServiceClient();

    // Ensure bucket exists
    const { data: buckets } = await db.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET);
    if (!bucketExists) {
      await db.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
    }

    // Build file path
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${providerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Directory upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    // Append to provider_images field
    const { data: provider, error: fetchError } = await db
      .from("olera-providers")
      .select("provider_images, provider_name")
      .eq("provider_id", providerId)
      .single();

    if (fetchError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const existing = provider.provider_images
      ? (provider.provider_images as string).split(" | ").filter(Boolean)
      : [];
    existing.push(imageUrl);
    const updatedImages = existing.join(" | ");

    const { error: updateError } = await db
      .from("olera-providers")
      .update({ provider_images: updatedImages })
      .eq("provider_id", providerId);

    if (updateError) {
      console.error("Failed to update provider_images:", updateError);
      return NextResponse.json({ error: "Image uploaded but failed to link to provider." }, { status: 500 });
    }

    await logAuditAction({
      adminUserId: adminUser.id,
      action: "upload_directory_image",
      targetType: "directory_provider",
      targetId: providerId,
      details: {
        provider_name: provider.provider_name,
        image_url: imageUrl,
      },
    });

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Directory upload error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
