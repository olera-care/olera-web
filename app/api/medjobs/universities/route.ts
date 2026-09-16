import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/medjobs/universities
 * Returns universities that have at least one student candidate.
 * Uses service role to bypass RLS (so we can include universities
 * that may have is_active=false but still have students).
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all distinct university_ids from student profiles
    const { data: students, error: studentsError } = await supabase
      .from("business_profiles")
      .select("metadata")
      .eq("type", "student")
      .eq("is_active", true)
      .contains("metadata", { application_completed: true });

    if (studentsError) {
      console.error("[medjobs/universities] students query error:", studentsError);
      return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
    }

    // Extract unique university_ids
    const universityIds = new Set<string>();
    for (const s of students || []) {
      const uniId = (s.metadata as Record<string, unknown>)?.university_id;
      if (typeof uniId === "string" && uniId) {
        universityIds.add(uniId);
      }
    }

    if (universityIds.size === 0) {
      return NextResponse.json({ universities: [] });
    }

    // Fetch the university details
    const { data: universities, error: uniError } = await supabase
      .from("medjobs_universities")
      .select("id, name, state, lat, lng")
      .in("id", Array.from(universityIds))
      .order("name");

    if (uniError) {
      console.error("[medjobs/universities] universities query error:", uniError);
      return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
    }

    return NextResponse.json({ universities: universities || [] });
  } catch (err) {
    console.error("[medjobs/universities] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
