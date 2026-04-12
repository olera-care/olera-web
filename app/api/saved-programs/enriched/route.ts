import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEnrichedProgram } from "@/lib/program-data";

/**
 * GET /api/saved-programs/enriched
 *
 * Returns the current user's saved benefit programs with live data
 * pulled from the program library at request time. This way the welcome
 * page reflects whatever's currently in waiver-library + pipeline-drafts —
 * including next steps that change as the pipeline updates content.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ programs: [] });
    }

    // Pull saved programs for this user
    const { data: saved, error } = await supabase
      .from("saved_programs")
      .select("program_id, state_id, name, short_name, savings_range, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[saved-programs/enriched] Failed to fetch saved:", error);
      return NextResponse.json({ programs: [] });
    }

    if (!saved || saved.length === 0) {
      return NextResponse.json({ programs: [] });
    }

    // Enrich each program from the live library
    const enriched = saved
      .map((s) => {
        const program = getEnrichedProgram(s.state_id, s.program_id);
        if (!program) {
          // Program not found in library — fall back to saved snapshot
          return {
            id: s.program_id,
            stateId: s.state_id,
            name: s.name,
            shortName: s.short_name || s.name,
            tagline: null,
            savingsRange: s.savings_range,
            nextStep: null,
            description: null,
          };
        }
        // Pull live data
        const firstStep = program.applicationGuide?.steps?.[0]?.title || null;
        const description = program.tagline?.split(/\.\s|,\s(?![0-9])/)[0] || null;
        return {
          id: program.id,
          stateId: s.state_id,
          name: program.name,
          shortName: program.shortName || program.name,
          tagline: program.tagline,
          savingsRange: program.savingsRange || s.savings_range,
          nextStep: firstStep,
          description,
        };
      });

    return NextResponse.json({ programs: enriched });
  } catch (err) {
    console.error("[saved-programs/enriched] Error:", err);
    return NextResponse.json({ programs: [] });
  }
}
