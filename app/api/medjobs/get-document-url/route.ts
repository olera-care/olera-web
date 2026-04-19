import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

const BUCKET = "student-documents";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * POST /api/medjobs/get-document-url
 *
 * Generate a signed URL for a private document.
 * Requires authentication and proper access:
 * - Document owner can always access their own documents
 * - Providers can access student documents if they have a confirmed interview
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

    const body = await req.json();
    const { path, studentProfileId } = body;

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Storage is not configured." },
        { status: 500 }
      );
    }

    // Get the requester's account
    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 403 });
    }

    // Check if requester owns this document (path starts with their profile ID)
    const { data: ownProfile } = await admin
      .from("business_profiles")
      .select("id")
      .eq("account_id", account.id)
      .eq("type", "student")
      .maybeSingle();

    const isOwner = ownProfile && path.startsWith(ownProfile.id);

    if (!isOwner) {
      // Check if requester is a provider with access to this student
      // They need either:
      // 1. A confirmed interview with the student, OR
      // 2. Paid access to view the student's profile

      const { data: providerProfile } = await admin
        .from("business_profiles")
        .select("id")
        .eq("account_id", account.id)
        .eq("type", "provider")
        .maybeSingle();

      if (!providerProfile) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      // If studentProfileId provided, verify access
      if (studentProfileId) {
        // Check for confirmed interview
        const { data: interview } = await admin
          .from("interviews")
          .select("id")
          .eq("provider_profile_id", providerProfile.id)
          .eq("student_profile_id", studentProfileId)
          .eq("status", "confirmed")
          .maybeSingle();

        // Check for paid access
        const { data: access } = await admin
          .from("medjobs_provider_access")
          .select("tier")
          .eq("provider_profile_id", providerProfile.id)
          .maybeSingle();

        const isPaid = access && (access as { tier?: string }).tier === "paid";

        if (!interview && !isPaid) {
          return NextResponse.json(
            { error: "Access denied - no confirmed interview or paid access" },
            { status: 403 }
          );
        }
      } else {
        // Without studentProfileId, we can't verify access properly
        // Check if provider has any paid access
        const { data: access } = await admin
          .from("medjobs_provider_access")
          .select("tier")
          .eq("provider_profile_id", providerProfile.id)
          .maybeSingle();

        if (!access || (access as { tier?: string }).tier !== "paid") {
          return NextResponse.json(
            { error: "Access denied" },
            { status: 403 }
          );
        }
      }
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error("[get-document-url] signed URL error:", error);
      return NextResponse.json(
        { error: "Failed to generate document URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error("[get-document-url] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
