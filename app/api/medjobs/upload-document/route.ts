import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const BUCKET = "student-documents";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const VALID_DOCUMENT_TYPES = ["drivers_license", "car_insurance"] as const;
type DocumentType = (typeof VALID_DOCUMENT_TYPES)[number];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/medjobs/upload-document
 *
 * Upload a sensitive document (driver's license, car insurance) for a student profile.
 * Requires authentication — the logged-in user must own the profile.
 * Files are stored in a private bucket (not publicly accessible).
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const profileId = formData.get("profileId") as string | null;
    const documentType = formData.get("documentType") as string | null;

    if (!file || !profileId || !documentType) {
      return NextResponse.json(
        { error: "file, profileId, and documentType are required" },
        { status: 400 }
      );
    }

    if (!VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: `documentType must be one of: ${VALID_DOCUMENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Please upload a JPEG, PNG, WebP, or PDF file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10MB." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Storage is not configured." },
        { status: 500 }
      );
    }

    // Verify the authenticated user owns this profile
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 403 });
    }

    const { data: profile } = await admin
      .from("business_profiles")
      .select("id, account_id, metadata")
      .eq("id", profileId)
      .eq("type", "student")
      .maybeSingle();

    if (!profile || profile.account_id !== account.id) {
      return NextResponse.json(
        { error: "Profile not found or not owned by you" },
        { status: 403 }
      );
    }

    // Ensure private bucket exists
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === BUCKET);
    if (!bucketExists) {
      await admin.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });
    }

    const ext = file.name.split(".").pop() || "pdf";
    const filePath = `${profileId}/${documentType}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("[medjobs/upload-document] upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload document." },
        { status: 500 }
      );
    }

    // Update profile metadata with document reference + recalculate completeness
    const metadataKey = `${documentType}_url` as const;
    const uploadedAtKey = `${documentType}_uploaded_at` as const;
    const existingMeta = (profile.metadata as Record<string, unknown>) || {};

    const updatedMeta = {
      ...existingMeta,
      [metadataKey]: filePath,
      [uploadedAtKey]: new Date().toISOString(),
    };

    // Recalculate profile completeness with new document
    const { data: fullProfile } = await admin
      .from("business_profiles")
      .select("display_name, city, state")
      .eq("id", profileId)
      .single();

    if (fullProfile) {
      const fields = [
        { filled: !!fullProfile.display_name, weight: 10 },
        { filled: !!(updatedMeta.university as string), weight: 10 },
        { filled: !!(updatedMeta.major as string), weight: 5 },
        { filled: !!(updatedMeta.intended_professional_school as string), weight: 5 },
        { filled: !!fullProfile.city && !!fullProfile.state, weight: 10 },
        { filled: (Array.isArray(updatedMeta.availability_types) ? updatedMeta.availability_types.length : 0) > 0, weight: 10 },
        { filled: (Array.isArray(updatedMeta.certifications) ? updatedMeta.certifications.length : 0) > 0, weight: 5 },
        { filled: (Array.isArray(updatedMeta.care_experience_types) ? updatedMeta.care_experience_types.length : 0) > 0, weight: 5 },
        { filled: !!(updatedMeta.video_intro_url as string), weight: 15 },
        { filled: !!(updatedMeta.drivers_license_url as string), weight: 10 },
        { filled: !!(updatedMeta.car_insurance_url as string), weight: 10 },
        { filled: !!(updatedMeta.acknowledgments_completed), weight: 5 },
      ];
      updatedMeta.profile_completeness = fields.reduce((sum, f) => sum + (f.filled ? f.weight : 0), 0);
    }

    const { error: updateError } = await admin
      .from("business_profiles")
      .update({ metadata: updatedMeta })
      .eq("id", profileId);

    if (updateError) {
      console.error("[medjobs/upload-document] metadata update error:", updateError);
      return NextResponse.json(
        { error: "Document uploaded but failed to update profile." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documentType,
      filePath,
      uploadedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[medjobs/upload-document] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
