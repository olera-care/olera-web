import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSlackAlert } from "@/lib/slack";

/**
 * Guidance-journey instrumentation (2026-07-03). Two sinks, no new tables:
 *
 *  1. Profile stamp — events append to metadata.guidance_events (capped ring,
 *     newest last) on the family profile, following the quiz_answers precedent.
 *     The family-comms dashboard scans these for windowed counts. No
 *     seeker_activity writes: a new event_type there needs a CHECK migration
 *     and fails silently without it.
 *
 *  2. Slack — one compact, PHI-free line per quiz answer ("A family in
 *     Killeen, TX ..."), through the house sendSlackAlert helper. Delightful
 *     at pilot volume; GUIDANCE_SLACK_DISABLED=1 is the mute switch for when
 *     volume outgrows it.
 */

const MAX_EVENTS = 100;

export type GuidanceEventType = "quiz_answered" | "brief_viewed" | "step_expanded";

export interface GuidanceEvent {
  t: GuidanceEventType;
  at: string;
  /** question for quiz_answered, program id for brief_viewed, step index for step_expanded. */
  ref?: string;
  answer?: string;
}

/** Append one event to the profile's capped ring. Best-effort: read-modify-write
 *  like every metadata writer; a lost race drops a counter tick, never data. */
export async function recordGuidanceEvent(
  db: SupabaseClient,
  familyProfileId: string,
  event: Omit<GuidanceEvent, "at">,
): Promise<void> {
  try {
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("id", familyProfileId)
      .maybeSingle();
    if (!profile) return;
    const meta = (profile.metadata as Record<string, unknown>) || {};
    const events = Array.isArray(meta.guidance_events) ? (meta.guidance_events as GuidanceEvent[]) : [];
    events.push({ ...event, at: new Date().toISOString() });
    meta.guidance_events = events.slice(-MAX_EVENTS);
    await db.from("business_profiles").update({ metadata: meta }).eq("id", familyProfileId);
  } catch (e) {
    console.error("[guidance-events] stamp failed:", e instanceof Error ? e.message : e);
  }
}

const PATH_LABELS: Record<string, string> = {
  a: "We can cover it comfortably (path A)",
  b: "Some savings, but not endless (path B)",
  c: "Resources are very limited (path C)",
};
const MEDICAID_LABELS: Record<string, string> = {
  alreadyHas: "Yes, already have it",
  applying: "Applying",
  notSure: "Applying / not sure",
  doesNotHave: "No",
};

/** One PHI-free Slack line per one-tap answer. Never names the family. */
export async function slackQuizAnswer(opts: {
  question: string;
  answer: string;
  careLabel: string | null;
  city: string | null;
  state: string | null;
}): Promise<void> {
  if (process.env.GUIDANCE_SLACK_DISABLED === "1") return;
  const where = [opts.city, opts.state].filter(Boolean).join(", ");
  const who = `A family${opts.careLabel ? ` looking for ${opts.careLabel}` : ""}${where ? ` in ${where}` : ""}`;
  let line: string;
  if (opts.question === "path") {
    line = `🧭 ${who} self-sorted: *${PATH_LABELS[opts.answer] || opts.answer}*`;
  } else if (opts.question === "medicaid") {
    line = `💊 ${who} answered Medicaid: *${MEDICAID_LABELS[opts.answer] || opts.answer}*`;
  } else if (opts.question === "veteran") {
    line = `🎖️ ${who} answered veteran: *${opts.answer === "yes" ? "Yes" : "No"}*`;
  } else if (opts.question === "age") {
    line = `🎂 ${who} shared an age band: *~${opts.answer}*`;
  } else {
    line = `🧭 ${who} answered ${opts.question}: *${opts.answer}*`;
  }
  await sendSlackAlert(line);
}
