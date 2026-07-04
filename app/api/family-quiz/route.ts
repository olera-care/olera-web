import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateQuizToken, generateQuizToken, generateBriefToken, type QuizQuestion } from "@/lib/claim-tokens";
import {
  familyBenefitsFacts,
  friendlyCareLabel,
  getProgramsForFamily,
  getPathNarrative,
  pickQuizQuestion,
} from "@/lib/family-comms/benefits-guidance.server";
import { US_STATES } from "@/lib/us-states";
import { recordGuidanceEvent, slackQuizAnswer } from "@/lib/family-comms/guidance-events.server";

/**
 * POST /api/family-quiz  { tok }
 *
 * The in-email micro-quiz write path (Guidance Layer, 2026-07-03). Email chips
 * link to /family/quiz-answer (through claim-family sign-in); that page calls
 * this endpoint on mount with the signed token. The write deliberately does
 * NOT happen on a GET: corporate link-scanners (Outlook SafeLinks etc.) follow
 * every href in an email, and with three mutually exclusive answer chips a
 * scanner would silently overwrite the family's real answer with whichever
 * chip it fetched last. Same defense as /connection-outcome (client-side POST
 * on mount — scanners don't execute JS).
 *
 * Records ONE benefits-intake fact on the family profile, then returns the
 * payoff: the program list sharpened by the answer plus the NEXT question
 * (chips carry fresh signed tokens), so the page can chain the whole intake
 * without a form. The signed token (family + question + answer + email, HMAC,
 * 72h, distinct "quiz:" domain) makes every part untamperable; answers are
 * validated against the per-question allowlist anyway. Replays are idempotent.
 */

const ALLOWED_ANSWERS: Record<QuizQuestion, Set<string>> = {
  path: new Set(["a", "b", "c"]),
  medicaid: new Set(["alreadyHas", "applying", "notSure", "doesNotHave"]),
  veteran: new Set(["yes", "no"]),
  age: new Set(["60", "70", "80", "87"]),
};

export async function POST(request: NextRequest) {
  let token = "";
  try {
    const body = await request.json();
    token = typeof body?.tok === "string" ? body.tok : "";
  } catch {
    /* fall through to the invalid response */
  }
  const invalid = () => NextResponse.json({ ok: false, error: "expired" }, { status: 400 });

  if (!token) return invalid();
  const v = validateQuizToken(token);
  if (!v.valid) return invalid();
  const { familyProfileId, question, answer, email } = v;
  if (!ALLOWED_ANSWERS[question]?.has(answer)) {
    console.error(`[family-quiz] answer not allowed: ${question}=${answer}`);
    return invalid();
  }

  try {
    const db = getServiceClient();
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, city, state, care_types, metadata")
      .eq("id", familyProfileId)
      .maybeSingle();
    if (!profile) return invalid();

    const meta = (profile.metadata as Record<string, unknown>) || {};
    if (question === "path") meta.financial_path = answer;
    else if (question === "medicaid") meta.medicaid_status = answer;
    else if (question === "veteran") meta.veteran_status = answer;
    else if (question === "age") meta.age = parseInt(answer, 10);
    const quizAnswers = (meta.quiz_answers as Record<string, unknown>) || {};
    quizAnswers[question] = { answer, at: new Date().toISOString(), via: "one_tap" };
    meta.quiz_answers = quizAnswers;

    const { error: updErr } = await db
      .from("business_profiles")
      .update({ metadata: meta })
      .eq("id", familyProfileId);
    if (updErr) {
      console.error("[family-quiz] profile update failed:", updErr.message);
      return NextResponse.json({ ok: false, error: "write_failed" }, { status: 500 });
    }

    // Instrumentation: profile-stamped event (dashboard) + a PHI-free Slack
    // line per tap. Awaited — Vercel kills pending promises after the response.
    const factsForLabel = familyBenefitsFacts({ ...profile, metadata: meta });
    const careLabelEarly = friendlyCareLabel(factsForLabel.careTypes[0]);
    await recordGuidanceEvent(db, familyProfileId, { t: "quiz_answered", ref: question, answer });
    await slackQuizAnswer({
      question,
      answer,
      careLabel: careLabelEarly,
      city: (profile as { city?: string | null }).city || null,
      state: factsForLabel.state,
    });

    // The payoff: recompute with the answer applied, plus the next question.
    // A path answer additionally returns its narrative (the orientation page).
    const facts = familyBenefitsFacts({ ...profile, metadata: meta });
    const programs = await getProgramsForFamily(db, facts, 4);
    const nextAsk = pickQuizQuestion(facts);
    const briefTok = generateBriefToken(familyProfileId, email);
    const careLabel = careLabelEarly;
    const stateName = US_STATES.find((st) => st.value === (facts.state || ""))?.label || null;
    const narrative =
      question === "path" && facts.financialPath
        ? getPathNarrative(facts.financialPath, careLabel, stateName)
        : null;
    return NextResponse.json({
      ok: true,
      question,
      answer,
      pathNarrative: narrative
        ? { title: narrative.title, intro: narrative.intro, steps: narrative.steps }
        : null,
      programs: programs.map((p) => ({
        name: p.name,
        savingsRange: p.savingsRange,
        blurb: p.blurb,
        url: p.url,
        briefUrl: `/family/program/${p.id}?tok=${encodeURIComponent(briefTok)}`,
      })),
      next: nextAsk
        ? {
            prompt: nextAsk.prompt,
            chips: nextAsk.chips.map((ch) => ({
              label: ch.label,
              tok: generateQuizToken(familyProfileId, nextAsk.question, ch.answer, email),
            })),
          }
        : null,
    });
  } catch (e) {
    console.error("[family-quiz] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

/** Defensive GET: any stale link lands on the page (which owns the POST). */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const token = url.searchParams.get("tok");
  return NextResponse.redirect(
    token
      ? `${siteUrl}/family/quiz-answer?tok=${encodeURIComponent(token)}`
      : `${siteUrl}/benefits/finder`,
    { status: 303 },
  );
}
