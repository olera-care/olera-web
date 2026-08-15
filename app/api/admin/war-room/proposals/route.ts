import { after, NextRequest, NextResponse } from "next/server";
import {
  getAdminUser,
  getAuthUser,
  getServiceClient,
  logAuditAction,
} from "@/lib/admin";
import {
  executeWarRoomDiscovery,
  queueWarRoomDiscovery,
} from "@/lib/war-room/discovery.server";
import { dispatchApprovedProposal } from "@/lib/war-room/executor.server";
import { integrationStatuses } from "@/lib/war-room/sources.server";
import type {
  WarRoomCompanyRead,
  WarRoomCompanyModel,
  WarRoomDiscoveryRun,
  WarRoomInvestigation,
  WarRoomProposal,
  WarRoomSupervisorPayload,
} from "@/lib/war-room/types";

export const maxDuration = 300;

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

function supervisorActionError(error: unknown, action?: string) {
  const rawMessage = errorMessage(error);
  if (/war_room_investigation_events_event_type_check|intervention_superseded/i.test(rawMessage)) {
    return "War Room database is missing migration 180. Apply migration 180, then scan again.";
  }
  if (
    /prompt_version|fact_pack_hash|raw_investigator_output|raw_council_output|validation_trace|war_room_investigation_events|hypotheses|next_probe|resolution_criteria|resolution_evidence|progress_summary|last_progress_at|evidence_hash/i
      .test(rawMessage)
  ) {
    return "War Room database is missing migration 179. Apply migrations 179 and 180, then scan again.";
  }
  return action === "discover"
    ? "War Room could not start this scan. No work was queued."
    : "War Room could not save this decision.";
}

function parseCompanyRead(run: WarRoomDiscoveryRun | null): WarRoomCompanyRead | null {
  const value = run?.source_summary?.company_read;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<WarRoomCompanyRead>;
  const validStances = new Set<WarRoomCompanyRead["stance"]>([
    "decision_required", "investigating", "monitoring", "stable",
  ]);
  if (
    typeof candidate.summary !== "string"
    || !candidate.stance
    || !validStances.has(candidate.stance)
    || !Array.isArray(candidate.investigationFingerprints)
    || !Array.isArray(candidate.evidenceIds)
    || !Array.isArray(candidate.unresolvedQuestions)
  ) return null;
  return candidate as WarRoomCompanyRead;
}

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const admin = await getAdminUser(user.id);
  if (!admin) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { admin };
}

async function expireStaleWork(db: ReturnType<typeof getServiceClient>) {
  const now = new Date().toISOString();
  const discoveryLease = new Date(Date.now() - 12 * 60_000).toISOString();
  const executionLease = new Date(Date.now() - 60 * 60_000).toISOString();
  const [discoveryResult, executionResult] = await Promise.all([
    db.from("war_room_discovery_runs").update({
      status: "failed",
      error_message: "Discovery exceeded its 12-minute lease.",
      completed_at: now,
    }).in("status", ["queued", "running"]).lt("created_at", discoveryLease),
    db.from("war_room_proposals").update({
      status: "failed",
      execution_error: "Repository runner did not report back within its 60-minute lease.",
      execution_completed_at: now,
      updated_at: now,
    }).in("status", ["dispatching", "executing"]).lt("execution_started_at", executionLease)
      .select("id"),
  ]);
  if (discoveryResult.error) throw discoveryResult.error;
  if (executionResult.error) throw executionResult.error;
  const expired = (executionResult.data ?? []) as Array<{ id: string }>;
  if (expired.length) {
    const { error } = await db.from("war_room_proposal_events").insert(expired.map((proposal) => ({
      proposal_id: proposal.id,
      event_type: "execution_failed",
      actor: "war-room",
      details: { reason: "runner_lease_expired" },
    })));
    if (error) throw error;
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    const db = getServiceClient();
    await expireStaleWork(db);
    const [proposalResult, investigationResult, companyModelResult, discoveryResult, integrations] = await Promise.all([
      db.from("war_room_proposals").select("*")
        .order("last_seen_at", { ascending: false })
        .limit(30),
      db.from("war_room_investigations").select("*")
        .in("status", ["investigating", "watchlist", "decision_ready"])
        .order("last_seen_at", { ascending: false })
        .limit(24),
      db.from("war_room_company_models").select("*").eq("key", "olera").maybeSingle(),
      db.from("war_room_discovery_runs").select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      integrationStatuses(db),
    ]);
    if (proposalResult.error) throw proposalResult.error;
    if (discoveryResult.error) throw discoveryResult.error;
    const v2Unavailable = (error: { code?: string } | null) =>
      Boolean(error && ["42P01", "PGRST205"].includes(error.code ?? ""));
    if (investigationResult.error && !v2Unavailable(investigationResult.error)) throw investigationResult.error;
    if (companyModelResult.error && !v2Unavailable(companyModelResult.error)) throw companyModelResult.error;
    const proposals = (proposalResult.data ?? []) as WarRoomProposal[];
    const investigations = (investigationResult.data ?? []) as WarRoomInvestigation[];
    const latestDiscovery = discoveryResult.data as WarRoomDiscoveryRun | null;
    const companyRead = parseCompanyRead(latestDiscovery);
    const payload: WarRoomSupervisorPayload = {
      generatedAt: new Date().toISOString(),
      proposals,
      investigations,
      companyModel: companyModelResult.data as WarRoomCompanyModel | null,
      companyRead,
      companyVerdict: companyRead?.summary ?? (typeof latestDiscovery?.source_summary?.company_verdict === "string"
        ? latestDiscovery.source_summary.company_verdict
        : null),
      latestDiscovery,
      integrations,
      counts: {
        waiting: proposals.filter((proposal) => proposal.status === "proposed").length,
        working: proposals.filter((proposal) => ["approved", "dispatching", "executing"].includes(proposal.status)).length,
        reviewReady: proposals.filter((proposal) => proposal.status === "review_ready").length,
        measuring: proposals.filter((proposal) => proposal.status === "completed" && proposal.outcome_status === "pending").length,
        investigating: investigations.filter((investigation) => investigation.status === "investigating").length,
        watchlist: investigations.filter((investigation) => investigation.status === "watchlist").length,
      },
    };
    return NextResponse.json(payload);
  } catch (error) {
    console.error("[war-room] supervisor load failed:", error);
    const message = error instanceof Error && /war_room_(?:investigations|company_models)/.test(error.message)
      ? "Apply migration 178 before using the CEO operating system."
      : error instanceof Error && /war_room_(?:proposals|discovery_runs|source_)/.test(error.message)
        ? "Apply migration 177 before using the operating agent."
        : "War Room could not load its proposal queue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  let requestedAction: string | undefined;
  try {
    const body = await request.json() as {
      action?: "discover" | "approve" | "retry" | "reject" | "complete";
      proposalId?: string;
      note?: string;
    };
    requestedAction = body.action;
    const db = getServiceClient();
    if (body.action === "discover") {
      const queued = await queueWarRoomDiscovery(db, "manual", auth.admin.email);
      if (!queued.reused) after(() => executeWarRoomDiscovery(queued.run.id));
      await logAuditAction({
        adminUserId: auth.admin.id,
        action: "war_room_discovery_started",
        targetType: "war_room_discovery_run",
        targetId: queued.run.id,
        details: { reused: queued.reused },
      });
      return NextResponse.json(queued, { status: queued.reused ? 200 : 202 });
    }

    if (!body.proposalId || !body.action) {
      return NextResponse.json({ error: "Proposal action is required" }, { status: 400 });
    }
    const { data: proposalData, error: proposalError } = await db.from("war_room_proposals")
      .select("*")
      .eq("id", body.proposalId)
      .maybeSingle();
    if (proposalError) throw proposalError;
    if (!proposalData) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    const proposal = proposalData as WarRoomProposal;
    const now = new Date().toISOString();

    if (body.action === "approve") {
      if (proposal.status !== "proposed") {
        return NextResponse.json({ error: "Only a waiting proposal can be approved" }, { status: 409 });
      }
      const { data: approvedData, error } = await db.from("war_room_proposals").update({
        status: "approved",
        approved_by: auth.admin.email,
        approved_at: now,
        updated_at: now,
      }).eq("id", proposal.id).eq("status", "proposed").select("*").maybeSingle();
      if (error) throw error;
      if (!approvedData) return NextResponse.json({ error: "Proposal changed before approval" }, { status: 409 });
      const { error: eventError } = await db.from("war_room_proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "approved",
        actor: auth.admin.email,
        details: {
          authorization: proposal.action_kind === "code" ? "repository_branch_and_pr_only" : "human_controlled_plan",
          action_kind: proposal.action_kind,
        },
      });
      if (eventError) throw eventError;
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
      await logAuditAction({
        adminUserId: auth.admin.id,
        action: "war_room_proposal_approved",
        targetType: "war_room_proposal",
        targetId: proposal.id,
        details: { title: proposal.title, action_kind: proposal.action_kind, dispatched: dispatch.dispatched, execution_boundary: proposal.action_kind === "code" ? "branch_and_pr_only" : "human_controlled" },
      });
      return NextResponse.json({ proposal: approvedData, dispatch });
    }

    if (body.action === "retry") {
      if (proposal.action_kind !== "code") {
        return NextResponse.json({ error: "Only repository work uses the automated executor" }, { status: 409 });
      }
      if (proposal.status !== "approved" && !(proposal.status === "failed" && proposal.approved_at)) {
        return NextResponse.json({ error: "Only previously approved work can be retried" }, { status: 409 });
      }
      let retryProposal = proposal;
      if (proposal.status === "failed") {
        const { data, error } = await db.from("war_room_proposals").update({
          status: "approved",
          execution_branch: null,
          execution_url: null,
          execution_error: null,
          execution_started_at: null,
          execution_completed_at: null,
          updated_at: now,
        }).eq("id", proposal.id).eq("status", "failed").select("*").maybeSingle();
        if (error) throw error;
        if (!data) return NextResponse.json({ error: "Proposal changed before retry" }, { status: 409 });
        retryProposal = data as WarRoomProposal;
      }
      let dispatch: { dispatched: boolean; detail: string };
      try {
        dispatch = await dispatchApprovedProposal(db, retryProposal);
        if (!dispatch.dispatched) {
          await db.from("war_room_proposals").update({
            execution_error: dispatch.detail,
            updated_at: new Date().toISOString(),
          }).eq("id", proposal.id).eq("status", "approved");
        }
      } catch (dispatchError) {
        const detail = dispatchError instanceof Error ? dispatchError.message : "Executor dispatch failed";
        await db.from("war_room_proposals").update({ execution_error: detail, updated_at: new Date().toISOString() }).eq("id", proposal.id);
        dispatch = { dispatched: false, detail };
      }
      return NextResponse.json({ proposal: retryProposal, dispatch });
    }

    if (body.action === "reject") {
      if (proposal.status !== "proposed") {
        return NextResponse.json({ error: "Only a waiting proposal can be rejected" }, { status: 409 });
      }
      const { data, error } = await db.from("war_room_proposals").update({
        status: "rejected",
        rejected_by: auth.admin.email,
        rejected_at: now,
        rejection_note: body.note?.trim().slice(0, 1_000) || null,
        updated_at: now,
      }).eq("id", proposal.id).eq("status", "proposed").select("*").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Proposal changed before rejection" }, { status: 409 });
      const { error: eventError } = await db.from("war_room_proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "rejected",
        actor: auth.admin.email,
        details: { note: body.note?.trim().slice(0, 1_000) || null },
      });
      if (eventError) throw eventError;
      const rejectionReason = body.note?.trim().slice(0, 500) || "No reason supplied.";
      const { data: investigations, error: investigationError } = await db.from("war_room_investigations").update({
        status: "investigating",
        proposal_id: null,
        progress_summary: `The linked intervention was rejected. The underlying condition remains open: ${rejectionReason}`,
        readiness_reason: `The proposed intervention was rejected, not the underlying condition: ${rejectionReason}`,
        last_progress_at: now,
        updated_at: now,
      }).eq("proposal_id", proposal.id).select("id");
      if (investigationError && !["42P01", "PGRST205"].includes(investigationError.code ?? "")) throw investigationError;
      if (investigations?.length) {
        const { error: investigationEventError } = await db.from("war_room_investigation_events").insert(
          investigations.map((investigation) => ({
            investigation_id: investigation.id,
            event_type: "intervention_rejected",
            actor: auth.admin.email,
            details: { proposal_id: proposal.id, reason: rejectionReason },
          })),
        );
        if (investigationEventError) throw investigationEventError;
      }
      await logAuditAction({
        adminUserId: auth.admin.id,
        action: "war_room_proposal_rejected",
        targetType: "war_room_proposal",
        targetId: proposal.id,
        details: { title: proposal.title },
      });
      return NextResponse.json({ proposal: data });
    }

    if (body.action === "complete") {
      const humanPlanComplete = proposal.action_kind !== "code" && proposal.status === "approved";
      if (proposal.status !== "review_ready" && !humanPlanComplete) {
        return NextResponse.json({ error: "Only review-ready code or an approved human plan can be marked complete" }, { status: 409 });
      }
      const requestedWindow = Number(proposal.strategic_case?.evaluationWindowDays ?? 7);
      const evaluationWindowDays = Math.max(1, Math.min(180, Number.isFinite(requestedWindow) ? requestedWindow : 7));
      const { data, error } = await db.from("war_room_proposals").update({
        status: "completed",
        completed_by: auth.admin.email,
        completed_at: now,
        measurement_due_at: new Date(Date.now() + evaluationWindowDays * 86_400_000).toISOString(),
        outcome_status: "pending",
        outcome_note: null,
        outcome_evidence: [],
        updated_at: now,
      }).eq("id", proposal.id).eq("status", proposal.status).select("*").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Proposal changed before completion" }, { status: 409 });
      const { error: eventError } = await db.from("war_room_proposal_events").insert({
        proposal_id: proposal.id,
        event_type: "completed",
        actor: auth.admin.email,
        details: { outcome_measurement: "pending" },
      });
      if (eventError) throw eventError;
      const { data: investigations, error: investigationError } = await db.from("war_room_investigations").update({
        status: "watchlist",
        progress_summary: "The linked intervention was completed. The condition remains open while War Room measures the outcome.",
        readiness_reason: "Intervention completion is not condition resolution. Wait for measured outcome evidence.",
        last_progress_at: now,
        updated_at: now,
      }).eq("proposal_id", proposal.id).select("id");
      if (investigationError && !["42P01", "PGRST205"].includes(investigationError.code ?? "")) throw investigationError;
      if (investigations?.length) {
        const { error: investigationEventError } = await db.from("war_room_investigation_events").insert(
          investigations.map((investigation) => ({
            investigation_id: investigation.id,
            event_type: "intervention_completed",
            actor: auth.admin.email,
            details: { proposal_id: proposal.id, outcome_measurement: "pending" },
          })),
        );
        if (investigationEventError) throw investigationEventError;
      }
      return NextResponse.json({ proposal: data });
    }

    return NextResponse.json({ error: "Unknown proposal action" }, { status: 400 });
  } catch (error) {
    console.error("[war-room] supervisor action failed:", error);
    return NextResponse.json({ error: supervisorActionError(error, requestedAction) }, { status: 500 });
  }
}
