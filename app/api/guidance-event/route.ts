import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateQuizToken, validateBriefToken } from "@/lib/claim-tokens";
import { recordGuidanceEvent } from "@/lib/family-comms/guidance-events.server";

/**
 * POST /api/guidance-event  { tok, type, ref? }
 *
 * Lightweight engagement beacon for the guidance journey (currently only
 * step_expanded — quiz answers and brief views are recorded by their own
 * routes). Accepts either token domain as proof of family context: quiz
 * tokens (the quiz-answer page holds one) or brief tokens. Writes only the
 * capped metadata.guidance_events ring — nothing here can alter facts, so a
 * replayed beacon is noise, not corruption.
 */

const ALLOWED_TYPES = new Set(["step_expanded"]);

export async function POST(request: NextRequest) {
  let tok = "";
  let type = "";
  let ref = "";
  try {
    const body = await request.json();
    tok = typeof body?.tok === "string" ? body.tok : "";
    type = typeof body?.type === "string" ? body.type : "";
    ref = typeof body?.ref === "string" ? body.ref.slice(0, 60) : "";
  } catch {
    /* fall through */
  }
  if (!tok || !ALLOWED_TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

  const quiz = validateQuizToken(tok);
  const brief = quiz.valid ? null : validateBriefToken(tok);
  const familyProfileId = quiz.valid ? quiz.familyProfileId : brief?.valid ? brief.familyProfileId : null;
  if (!familyProfileId) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const db = getServiceClient();
    await recordGuidanceEvent(db, familyProfileId, { t: "step_expanded", ref: ref || undefined });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[guidance-event] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
