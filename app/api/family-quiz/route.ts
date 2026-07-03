import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateQuizToken, generateFamilyInboxUrl, type QuizQuestion } from "@/lib/claim-tokens";
import { getSiteUrl } from "@/lib/site-url";

/**
 * GET /api/family-quiz?tok=<quiz-token>
 *
 * The in-email micro-quiz write path (Guidance Layer, 2026-07-03). A family
 * taps a one-tap answer chip in the paying-for-care email (or on the
 * quiz-answer page, which chains the next question); this records ONE
 * benefits-intake fact on their profile, signs them in, and lands them on
 * /family/quiz-answer showing the sharpened program list.
 *
 * Safe as a GET write because the signed token (family + question + answer +
 * email, HMAC, 72h, distinct "quiz:" domain) makes every part untamperable,
 * and the write is idempotent — replaying a chip sets the same fact to the
 * same value. Answers are validated against the per-question allowlist anyway
 * (defense in depth).
 */

const ALLOWED_ANSWERS: Record<QuizQuestion, Set<string>> = {
  medicaid: new Set(["alreadyHas", "applying", "notSure", "doesNotHave"]),
  veteran: new Set(["yes", "no"]),
  age: new Set(["60", "70", "80", "87"]),
};

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("tok");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Anything off → land on the benefits finder, never a hard error page.
  const bail = () => NextResponse.redirect(`${siteUrl}/benefits/finder`, { status: 303 });

  if (!token) return bail();
  const v = validateQuizToken(token);
  if (!v.valid) {
    console.error("[family-quiz] token invalid:", v.error);
    return bail();
  }
  const { familyProfileId, question, answer, email } = v;
  if (!ALLOWED_ANSWERS[question]?.has(answer)) {
    console.error(`[family-quiz] answer not allowed: ${question}=${answer}`);
    return bail();
  }

  try {
    const db = getServiceClient();
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("id", familyProfileId)
      .maybeSingle();
    if (!profile) return bail();

    const meta = (profile.metadata as Record<string, unknown>) || {};
    if (question === "medicaid") meta.medicaid_status = answer;
    else if (question === "veteran") meta.veteran_status = answer;
    else if (question === "age") meta.age = parseInt(answer, 10);
    const quizAnswers = (meta.quiz_answers as Record<string, unknown>) || {};
    quizAnswers[question] = { answer, at: new Date().toISOString(), via: "email_chip" };
    meta.quiz_answers = quizAnswers;

    const { error: updErr } = await db.from("business_profiles").update({ metadata: meta }).eq("id", familyProfileId);
    if (updErr) {
      console.error("[family-quiz] profile update failed:", updErr.message);
      return bail();
    }
  } catch (e) {
    console.error("[family-quiz] error:", e instanceof Error ? e.message : e);
    return bail();
  }

  // Sign them in on landing (claim-family flow) and show the sharpened list.
  // The page re-validates the same token to know whose picture to render.
  return NextResponse.redirect(
    generateFamilyInboxUrl(
      email.trim().toLowerCase(),
      `/family/quiz-answer?tok=${encodeURIComponent(token)}`,
      getSiteUrl(),
    ),
    { status: 303 },
  );
}
