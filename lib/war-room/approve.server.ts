import type { SupabaseClient } from "@supabase/supabase-js";
import { dispatchApprovedProposal } from "@/lib/war-room/executor.server";
import type { WarRoomProposal } from "@/lib/war-room/types";

/**
 * Approve a waiting proposal and start what approval starts.
 *
 * Moved out of the admin route so the founder's DM can approve too. On
 * 2026-09-25 he replied "Approved, go ahead" to the brief and nothing changed:
 * approval existed only as a button on the admin page, and the brief kept
 * listing the proposal as waiting. The steps are unchanged: flip the status,
 * log the event, deliver non-code work to its owner, dispatch code work to the
 * repository executor.
 */
export type ApprovalResult =
  | { approved: true; proposal: WarRoomProposal; dispatch: { dispatched: boolean; detail: string } }
  | { approved: false; status: number; error: string };

export async function approveWarRoomProposal(
  db: SupabaseClient,
  proposal: WarRoomProposal,
  actor: string,
): Promise<ApprovalResult> {
  // A parked proposal is approved by "Take it up". Its approval clock and
  // assigned-work delivery start then, not when it was first accepted.
  if (proposal.status !== "proposed" && proposal.status !== "parked") {
    return { approved: false, status: 409, error: "Only a waiting or parked proposal can be approved" };
  }
  const now = new Date().toISOString();
  const { data: approvedData, error } = await db.from("war_room_proposals").update({
    status: "approved",
    approved_by: actor,
    approved_at: now,
    updated_at: now,
  }).eq("id", proposal.id).eq("status", proposal.status).select("*").maybeSingle();
  if (error) throw error;
  if (!approvedData) return { approved: false, status: 409, error: "Proposal changed before approval" };
  const { error: eventError } = await db.from("war_room_proposal_events").insert({
    proposal_id: proposal.id,
    event_type: "approved",
    actor,
    details: {
      authorization: proposal.action_kind === "code" ? "repository_branch_and_pr_only" : "human_controlled_plan",
      action_kind: proposal.action_kind,
    },
  });
  if (eventError) throw eventError;
  // Non-repository work used to end here: status set to "approved", event
  // logged, and nobody told. Five of six action kinds had no destination at
  // all, so an approved operations or content proposal reached no one.
  // Delivery is awaited rather than fired and forgotten -- a Next route can
  // be frozen the moment it responds -- and it never fails the approval.
  if (proposal.action_kind !== "code") {
    const { deliverAssignedWork } = await import("@/lib/war-room/assigned-work.server");
    await deliverAssignedWork(db, approvedData as WarRoomProposal)
      .catch(() => ({ delivered: false }));
  }
  let dispatch: { dispatched: boolean; detail: string };
  if (proposal.action_kind === "code") {
    try {
      dispatch = await dispatchApprovedProposal(db, approvedData as WarRoomProposal);
      if (!dispatch.dispatched) {
        await db.from("war_room_proposals").update({
          execution_error: dispatch.detail,
          updated_at: new Date().toISOString(),
        }).eq("id", proposal.id);
      }
    } catch (dispatchError) {
      const detail = dispatchError instanceof Error ? dispatchError.message : "Executor dispatch failed";
      await db.from("war_room_proposals").update({ execution_error: detail, updated_at: new Date().toISOString() }).eq("id", proposal.id);
      dispatch = { dispatched: false, detail };
    }
  } else {
    dispatch = { dispatched: false, detail: "Plan approved. External or operational execution remains human-controlled." };
  }
  return { approved: true, proposal: approvedData as WarRoomProposal, dispatch };
}
