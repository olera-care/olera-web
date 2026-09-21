import type { SupabaseClient } from "@supabase/supabase-js";
import { sendSlackAlert, sendSlackDirectMessage } from "@/lib/slack";
import { getSiteUrl } from "@/lib/site-url";
import type { WarRoomProposal } from "@/lib/war-room/types";

/**
 * Approved work that is not repository work.
 *
 * Until now, approving a `code` proposal dispatched a real coding agent that
 * opens a pull request, and approving anything else set a status column and
 * stopped. Five of the six action kinds -- research, operations,
 * business_development, content, decision -- had no destination at all. So
 * five-sixths of what Cortex can propose could be approved and then reach
 * nobody.
 *
 * That is the other half of why the loop never closed. On 2026-09-21 Cortex
 * wrote, unprompted: "All are read-only probes with a one-pull-request blast
 * radius and zero founder minutes", and "the one time-boxed act that matters is
 * the calling". It had found the right work and had nowhere to put it.
 *
 * TJ, the same day: "there's so much to chop in between understanding the
 * high-level thing and doing nothing at all... Cortex can help me plan this,
 * assign a task, come up with drafts."
 *
 * **This sends to TJ, never to the assignee.** Telling Chantel or Ces they have
 * been given work is a message to a person about their own workload, and it is
 * his to send in his own words. What lands in his DM is the finished artifact:
 * who, by when, the steps, the draft, and how it will be judged. One forward.
 *
 * Delivery never fails the approval. A Slack outage must not leave a proposal
 * that a human approved sitting in a state nobody can explain.
 */

function shortDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** Slack renders a single asterisk as bold and needs `<url|label>` for links. */
export function buildAssignedWorkText(proposal: WarRoomProposal, siteUrl: string): string {
  const owner = proposal.assigned_owner?.trim();
  const due = shortDate(proposal.measurement_due_at ?? null);
  const steps = Array.isArray(proposal.execution_plan) ? proposal.execution_plan : [];

  const lines: string[] = [
    `:white_check_mark: *Approved work* — ${proposal.title}`,
    "",
    // The two facts that turn a proposal into an assignment. Said first
    // because they are what he needs to forward it.
    owner ? `*Owner* ${owner}` : "*Owner* not named by the scan — decide who before sending this on.",
  ];
  if (due) lines.push(`*By* ${due}`);
  lines.push("", `*Why now* ${proposal.why_now}`);

  if (proposal.proposed_solution) {
    lines.push("", "*The move*", proposal.proposed_solution);
  }
  if (steps.length) {
    lines.push("", "*Steps*");
    for (const step of steps.slice(0, 5)) {
      lines.push(`• *${step.label}* ${step.detail}`);
    }
  }
  if (proposal.success_measure) {
    lines.push("", `*How we will know it worked* ${proposal.success_measure}`);
  }
  // An approved action with no stated way to be wrong is a plan nobody can
  // retire, which is how nine conditions reached 42 occurrences.
  if (proposal.cheapest_falsification) {
    lines.push("", `_Cheapest way to find out this is wrong: ${proposal.cheapest_falsification}_`);
  }

  lines.push("", `<${siteUrl}/admin/war-room|Open in Cortex>`);
  return lines.join("\n");
}

export async function deliverAssignedWork(
  db: SupabaseClient,
  proposal: WarRoomProposal,
): Promise<{ delivered: boolean; reason?: string; channel?: "dm" | "webhook" }> {
  try {
    if (proposal.action_kind === "code") {
      return { delivered: false, reason: "repository work is delivered by the executor" };
    }

    const text = buildAssignedWorkText(proposal, getSiteUrl());
    const dmUserId = process.env.WAR_ROOM_BRIEF_SLACK_USER_ID?.trim();
    let channel: "dm" | "webhook" = "webhook";
    let result: { success: boolean; error?: string } = { success: false, error: "not attempted" };

    if (dmUserId) {
      result = await sendSlackDirectMessage(dmUserId, text);
      if (result.success) channel = "dm";
    }
    if (!result.success) result = await sendSlackAlert(text);
    if (!result.success) return { delivered: false, reason: result.error ?? "Slack send failed" };

    // Only after it is out. An assignment recorded but never received is worse
    // than one nobody recorded, because the record says someone was told.
    await db.from("war_room_proposal_events").insert({
      proposal_id: proposal.id,
      event_type: "approved",
      actor: "cortex",
      details: {
        delivered: "assigned_work",
        channel,
        assigned_owner: proposal.assigned_owner ?? null,
      },
    }).then(() => undefined, () => undefined);

    return { delivered: true, channel };
  } catch (error) {
    return { delivered: false, reason: error instanceof Error ? error.message : "assigned work delivery failed" };
  }
}
