import QuizAnswerClient from "./QuizAnswerClient";

/**
 * Landing screen for a one-tap micro-quiz answer (Guidance Layer). Email chips
 * arrive here through /api/claim-family (signed in). The actual answer write
 * happens in the client component via POST on mount — never on this GET — so
 * email link-scanners that fetch every href can't corrupt the family's answers
 * (the /connection-outcome pattern). The POST response carries the sharpened
 * program list and the NEXT question, and the chips chain in place, so a
 * family can finish the whole benefits intake in a few taps with no form.
 */
export default async function QuizAnswerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const tok = typeof sp.tok === "string" ? sp.tok : "";
  // Source attribution: chips arrive with the email-log id (?eid=) that
  // appendTrackingParams stamped. Threading it through the POST lets the
  // answer record which EMAIL produced the tap (campaign vs day-3 rung vs
  // compare cascade). Read-only downstream — it can never alter facts.
  const eid = typeof sp.eid === "string" ? sp.eid.slice(0, 64) : "";
  return <QuizAnswerClient tok={tok} eid={eid} />;
}
