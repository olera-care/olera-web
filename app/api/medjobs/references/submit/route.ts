import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * GET /api/medjobs/references/submit?token=xxx
 * Unauthenticated: validate token and return context for the referee form.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    const { data: reference, error } = await admin
      .from("medjobs_student_references")
      .select("id, student_profile_id, relationship, status")
      .eq("token", token)
      .maybeSingle();

    if (error || !reference) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (reference.status === "completed") {
      return NextResponse.json({ error: "already_completed", message: "This reference has already been submitted" }, { status: 409 });
    }

    // Fetch student name for context
    const { data: student } = await admin
      .from("business_profiles")
      .select("display_name")
      .eq("id", reference.student_profile_id)
      .single();

    return NextResponse.json({
      referenceId: reference.id,
      studentName: student?.display_name || "the student",
      relationship: reference.relationship,
    });
  } catch (err) {
    console.error("[medjobs/references/submit] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/medjobs/references/submit
 * Unauthenticated: referee submits their recommendation via token.
 * Body: { token, refereeName, refereeTitle, refereeOrganization, recommendation }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, refereeName, refereeTitle, refereeOrganization, recommendation } = body;

    if (!token || !refereeName || !recommendation) {
      return NextResponse.json({ error: "token, refereeName, and recommendation are required" }, { status: 400 });
    }

    if (recommendation.trim().length < 50) {
      return NextResponse.json({ error: "Recommendation must be at least 50 characters" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Verify token exists and is still in 'requested' status
    const { data: reference, error: fetchError } = await admin
      .from("medjobs_student_references")
      .select("id, status")
      .eq("token", token)
      .maybeSingle();

    if (fetchError || !reference) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    if (reference.status !== "requested") {
      return NextResponse.json({ error: "This reference has already been submitted" }, { status: 409 });
    }

    const { error: updateError } = await admin
      .from("medjobs_student_references")
      .update({
        referee_name: refereeName.trim(),
        referee_title: refereeTitle?.trim() || null,
        referee_organization: refereeOrganization?.trim() || null,
        recommendation: recommendation.trim(),
        status: "completed",
      })
      .eq("id", reference.id)
      .eq("status", "requested"); // Double-check status to prevent race condition

    if (updateError) {
      console.error("[medjobs/references/submit] POST error:", updateError);
      return NextResponse.json({ error: "Failed to submit reference" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[medjobs/references/submit] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
