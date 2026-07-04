import ProgramBriefClient from "./ProgramBriefClient";

/**
 * The program brief — the guided "Learn more" destination (Guidance Layer,
 * orientation revision 2026-07-03). One decision-sized screen per program,
 * generated entirely from the sbf_* row + the family's known facts: could you
 * qualify (checklist with one-tap chips for unknowns), what it's worth, and
 * the exact first step (phone + what to say). The dense article/official site
 * is demoted to a quiet link at the bottom.
 *
 * Rendering and the eligibility data live in the client component (GET
 * /api/family-brief), because chip taps write via POST /api/family-quiz and
 * re-fetch so checkmarks resolve in place — same scanner-safe pattern as the
 * quiz-answer page.
 */
export default async function ProgramBriefPage({
  params,
  searchParams,
}: {
  params: Promise<{ pid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { pid } = await params;
  const sp = await searchParams;
  const tok = typeof sp.tok === "string" ? sp.tok : "";
  return <ProgramBriefClient pid={pid} tok={tok} />;
}
