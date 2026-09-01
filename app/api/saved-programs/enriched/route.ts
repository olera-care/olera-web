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
          // Live value only, never the save-time snapshot. A blank savingsRange
          // in the library is a deliberate statement that no official figure is
          // published, so falling back here resurrected exactly the numbers the
          // benefits fact-check rounds had removed: 107 saved cards across 11
          // programs were still showing deleted figures, including a Mississippi
          // respite voucher amount the state itself no longer publishes.
          // `s.savings_range` remains the fallback in the branch above, where the
          // program is gone from the library and the snapshot is all we have.
          savingsRange: program.savingsRange || null,
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
