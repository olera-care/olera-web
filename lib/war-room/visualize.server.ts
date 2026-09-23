/**
 * "visualize" from Slack, carried out by a Claude Code routine.
 *
 * TJ, 2026-09-23, after Cortex summarised Minh-Nguyet's CARE-NAV feedback:
 * "/visualize the summary so I can consume it in a more complete fashion".
 * In Claude Code that skill publishes an artifact. Cortex runs on Olera's
 * servers against the model API and cannot publish one; the first time it was
 * asked, it claimed to have "attached" a visual that did not exist.
 *
 * So Cortex does the part it is good at -- gathering the real content through
 * its lookups into a complete brief -- and hands the brief to a Claude Code
 * routine, which runs the repo's copy of the visualize skill in a cloud session
 * and publishes a real artifact to TJ's account. Publishing a new artifact asks
 * first, and a routine has nobody to answer, so the session pauses there; the
 * link Cortex sends back is where TJ watches it and taps Allow (his choice over
 * a single standing page that each run would overwrite).
 *
 * Slack treats a message beginning with "/" as a slash command and swallows it,
 * so the plain word is what reaches Cortex; a leading space-and-slash, which is
 * how Slack lets a slash through, is accepted too.
 */

const VISUALIZE = /^\s*\/?visuali[sz]e\b[\s:,*_~`-]*/i;

// Slack delivers formatting as markup. The first live request, on 2026-09-23,
// arrived as "*visualize Minh-Nguyet's feedback*" (bold), so the anchored match
// failed and it was answered as an ordinary question. Wrapping bold, italic,
// strike, code and quote markers are removed before matching.
const SLACK_FORMATTING = /^[\s*_~`>]+|[\s*_~`]+$/g;

/** The subject of a visualize request, "" when it refers to the last exchange, or null when it is not one. */
export function visualizeSubject(text: string): string | null {
  const plain = text.replace(SLACK_FORMATTING, "");
  if (!VISUALIZE.test(plain)) return null;
  return plain.replace(VISUALIZE, "").trim();
}

export type RoutineStart =
  | { started: true; sessionUrl: string }
  | { started: false; reason: string };

/**
 * Fire the routine. The endpoint and its per-routine bearer token come from the
 * routine's API trigger on claude.ai (the token is shown once there). The text
 * reaches the session wrapped as untrusted fire payload; the routine's saved
 * prompt is what tells it to act on it.
 */
export async function startVisualRoutine(text: string): Promise<RoutineStart> {
  const url = process.env.CORTEX_VISUAL_ROUTINE_URL?.trim();
  const token = process.env.CORTEX_VISUAL_ROUTINE_TOKEN?.trim();
  if (!url || !token) return { started: false, reason: "the visual routine is not configured on the server yet" };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "anthropic-beta": "experimental-cc-routine-2026-04-01",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(20_000),
    });
    const body = await response.json().catch(() => ({})) as { claude_code_session_url?: string; error?: { message?: string } };
    if (!response.ok || !body.claude_code_session_url) {
      return { started: false, reason: body.error?.message ?? `the routine refused the request (HTTP ${response.status})` };
    }
    return { started: true, sessionUrl: body.claude_code_session_url };
  } catch (error) {
    return { started: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
