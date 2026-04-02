import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * GET /api/medjobs/references?studentProfileId=xxx
 * Public: returns completed references.
 * If authenticated as the owning student: returns ALL references (including requested + tokens).
 */
export async function GET(req: NextRequest) {
  try {
    const studentProfileId = req.nextUrl.searchParams.get("studentProfileId");
    if (!studentProfileId) {
      return NextResponse.json({ error: "studentProfileId is required" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Check if the requester is the student who owns these references
    let isOwner = false;
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: account } = await admin
          .from("accounts")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (account) {
          const { data: profile } = await admin
            .from("business_profiles")
            .select("id")
            .eq("account_id", account.id)
            .eq("type", "student")
            .eq("id", studentProfileId)
            .maybeSingle();
          isOwner = !!profile;
        }
      }
    } catch {
      // Not authenticated — fall through to public view
    }

    const selectFields = isOwner
      ? "id, referee_name, referee_title, referee_organization, referee_email, relationship, recommendation, token, status, display_order, created_at"
      : "id, referee_name, referee_title, referee_organization, relationship, recommendation, status, display_order, created_at";

    let query = admin
      .from("medjobs_student_references")
      .select(selectFields)
      .eq("student_profile_id", studentProfileId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!isOwner) {
      query = query.eq("status", "completed");
    }

    const { data, error } = await query;

    if (error) {
      console.error("[medjobs/references] GET error:", error);
      return NextResponse.json({ error: "Failed to fetch references" }, { status: 500 });
    }

    return NextResponse.json({ references: data || [], isOwner });
  } catch (err) {
    console.error("[medjobs/references] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/medjobs/references
 * Authenticated: student creates a reference request.
 * Body: { refereeEmail, relationship }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { refereeEmail, relationship } = body;

    if (!refereeEmail || !relationship) {
      return NextResponse.json({ error: "refereeEmail and relationship are required" }, { status: 400 });
    }

    const validRelationships = ["professor", "employer", "supervisor", "colleague", "other"];
    if (!validRelationships.includes(relationship)) {
      return NextResponse.json({ error: "Invalid relationship type" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Verify the authenticated user owns a student profile
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
      .select("id")
      .eq("account_id", account.id)
      .eq("type", "student")
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 403 });
    }

    const token = crypto.randomUUID();

    const { data: reference, error } = await admin
      .from("medjobs_student_references")
      .insert({
        student_profile_id: profile.id,
        referee_email: refereeEmail.trim().toLowerCase(),
        relationship,
        token,
      })
      .select("id, referee_email, relationship, token, status, created_at")
      .single();

    if (error) {
      console.error("[medjobs/references] POST error:", error);
      return NextResponse.json({ error: "Failed to create reference request" }, { status: 500 });
    }

    return NextResponse.json({ reference });
  } catch (err) {
    console.error("[medjobs/references] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/medjobs/references
 * Authenticated: student deletes a reference request.
 * Body: { referenceId }
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { referenceId } = body;

    if (!referenceId) {
      return NextResponse.json({ error: "referenceId is required" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Verify ownership
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
      .select("id")
      .eq("account_id", account.id)
      .eq("type", "student")
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 403 });
    }

    const { error } = await admin
      .from("medjobs_student_references")
      .delete()
      .eq("id", referenceId)
      .eq("student_profile_id", profile.id);

    if (error) {
      console.error("[medjobs/references] DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete reference" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[medjobs/references] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
