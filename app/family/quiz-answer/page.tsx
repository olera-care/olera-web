import Link from "next/link";
import { getServiceClient } from "@/lib/admin";
import { validateQuizToken, generateQuizAnswerUrl } from "@/lib/claim-tokens";
import { familyBenefitsFacts, getProgramsForFamily, pickQuizQuestion } from "@/lib/family-comms/benefits-guidance.server";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Landing screen after a one-tap micro-quiz answer (Guidance Layer). Reached
 * via /api/family-quiz → /api/claim-family, so the family arrives signed in.
 *
 * Shows the payoff for the tap immediately — the program list sharpened by the
 * answer they just gave — then chains the NEXT question as one-tap chips, so a
 * family can complete the whole benefits intake without ever seeing a form.
 * When no facts are missing, it points at the full benefits report instead.
 */

function acknowledgment(question: string, answer: string): string {
  if (question === "medicaid") {
    if (answer === "alreadyHas") return "Medicaid opens the most doors. These are strong fits for your situation:";
    if (answer === "doesNotHave") return "Good to know. None of these require Medicaid:";
    return "Good to know. While you sort out Medicaid, these are worth a look:";
  }
  if (question === "veteran") {
    if (answer === "yes") return "VA benefits are some of the most under-used help out there. With that in mind:";
    return "Got it. Here's what fits without the VA programs:";
  }
  if (question === "age") return "That helps. Here's what fits:";
  return "Got it. Here's what fits:";
}

export default async function QuizAnswerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const token = typeof sp.tok === "string" ? sp.tok : "";
  const v = token ? validateQuizToken(token) : { valid: false as const, error: "missing" };

  if (!v.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">That link has expired</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            No problem. You can see every program you may qualify for in a couple of minutes with the benefits finder.
          </p>
          <Link
            href="/benefits/finder"
            className="block w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Check your benefits
          </Link>
        </div>
      </div>
    );
  }

  const db = getServiceClient();
  const { data: profile } = await db
    .from("business_profiles")
    .select("id, display_name, state, care_types, metadata")
    .eq("id", v.familyProfileId)
    .maybeSingle();

  const facts = profile ? familyBenefitsFacts(profile) : { state: null, careTypes: [], medicaidStatus: null, veteranStatus: null, age: null };
  const programs = profile ? await getProgramsForFamily(db, facts, 4) : [];
  const nextAsk = profile ? pickQuizQuestion(facts) : null;
  const siteUrl = getSiteUrl();

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Got it</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">{acknowledgment(v.question, v.answer)}</p>

        {programs.length > 0 ? (
          <div className="mb-6">
            {programs.map((p, i) => (
              <div key={p.name} className={`py-4 ${i < programs.length - 1 ? "border-b border-gray-100" : ""}`}>
                <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                  {p.name}
                  {p.savingsRange ? <span className="ml-2 text-[13px] font-medium text-primary-600">{p.savingsRange}</span> : null}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">
                  {p.blurb}{" "}
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 whitespace-nowrap">
                      Learn more →
                    </a>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-6 leading-relaxed">
            We're still gathering programs for your area. The benefits finder has the full national picture in the meantime.
          </p>
        )}

        {nextAsk ? (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 mb-1">One more and we can narrow this further.</p>
            <p className="text-[15px] font-semibold text-gray-900 mb-3">{nextAsk.prompt}</p>
            <div className="flex flex-wrap gap-2">
              {nextAsk.chips.map((chip) => (
                <a
                  key={chip.answer}
                  href={generateQuizAnswerUrl(v.familyProfileId, nextAsk.question, chip.answer, v.email, siteUrl)}
                  className="inline-block px-4 py-2 rounded-full border border-primary-600 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors"
                >
                  {chip.label}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 mb-4">
              That's everything we needed. Your full report includes what each program covers and the exact first step to take.
            </p>
            <Link
              href="/benefits/finder"
              className="block w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors text-center"
            >
              See your full benefits report
            </Link>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Program details change; always confirm with the program directly.{" "}
          <Link href="/benefits/finder" className="text-primary-600 hover:text-primary-700">
            Full benefits finder
          </Link>
        </p>
      </div>
    </div>
  );
}
