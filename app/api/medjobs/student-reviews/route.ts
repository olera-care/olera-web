import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * GET /api/medjobs/student-reviews?studentProfileId=xxx
 * Public: returns published reviews for a student.
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

    const { data, error } = await admin
      .from("medjobs_student_reviews")
      .select("id, reviewer_name, rating, comment, relationship, created_at")
      .eq("student_profile_id", studentProfileId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[medjobs/student-reviews] GET error:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    return NextResponse.json({ reviews: data || [] });
  } catch (err) {
    console.error("[medjobs/student-reviews] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/medjobs/student-reviews
 * Unauthenticated: anyone can submit a review (goes to under_review).
 * Body: { studentProfileId, reviewerName, reviewerEmail, rating, comment, relationship }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentProfileId, reviewerName, reviewerEmail, rating, comment, relationship } = body;

    if (!studentProfileId || !reviewerName || !rating || !comment || !relationship) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    if (comment.trim().length < 50) {
      return NextResponse.json({ error: "Review must be at least 50 characters" }, { status: 400 });
    }

    const validRelationships = ["client", "employer", "supervisor", "coworker"];
    if (!validRelationships.includes(relationship)) {
      return NextResponse.json({ error: "Invalid relationship type" }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }

    // Verify the student profile exists and is active
    const { data: student } = await admin
      .from("business_profiles")
      .select("id")
      .eq("id", studentProfileId)
      .eq("type", "student")
      .eq("is_active", true)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check email dedup (one review per email per student)
    if (reviewerEmail) {
      const { data: existing } = await admin
        .from("medjobs_student_reviews")
        .select("id")
        .eq("student_profile_id", studentProfileId)
        .eq("reviewer_email", reviewerEmail.trim().toLowerCase())
        .neq("status", "removed")
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: "You have already submitted a review for this student" }, { status: 409 });
      }
    }

    const { error } = await admin
      .from("medjobs_student_reviews")
      .insert({
        student_profile_id: studentProfileId,
        reviewer_name: reviewerName.trim(),
        reviewer_email: reviewerEmail?.trim().toLowerCase() || null,
        rating: Math.round(rating),
        comment: comment.trim(),
        relationship,
        status: "under_review",
      });

    if (error) {
      console.error("[medjobs/student-reviews] POST error:", error);
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[medjobs/student-reviews] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
