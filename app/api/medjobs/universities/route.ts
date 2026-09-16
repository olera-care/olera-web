import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/medjobs/universities
 * Returns all universities from the medjobs_universities table.
 * Uses service role to bypass RLS (which restricts to is_active=true).
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all universities (service role bypasses RLS)
    const { data: universities, error } = await supabase
      .from("medjobs_universities")
      .select("id, name, state, lat, lng")
      .order("name");

    if (error) {
      console.error("[medjobs/universities] query error:", error);
      return NextResponse.json({ error: "Failed to fetch universities" }, { status: 500 });
    }

    return NextResponse.json({ universities: universities || [] });
  } catch (err) {
    console.error("[medjobs/universities] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
