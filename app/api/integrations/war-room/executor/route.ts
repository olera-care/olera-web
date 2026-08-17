import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const secret = process.env.WAR_ROOM_RUNNER_CALLBACK_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json() as {
    proposalId?: string;
    status?: "executing" | "review_ready" | "failed";
    branch?: string;
    url?: string;
    error?: string;
  };
  if (!body.proposalId || !body.status) {
    return NextResponse.json({ error: "proposalId and status are required" }, { status: 400 });
  }
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.proposalId)) {
    return NextResponse.json({ error: "Invalid proposalId" }, { status: 400 });
  }
  if (body.branch && !body.branch.startsWith(`war-room/${body.proposalId}-`)) {
    return NextResponse.json({ error: "Unexpected execution branch" }, { status: 400 });
  }
  const repository = process.env.WAR_ROOM_GITHUB_REPOSITORY;
  if (body.url) {
    const pullPrefix = repository ? `https://github.com/${repository}/pull/` : "";
    const pullNumber = pullPrefix && body.url.startsWith(pullPrefix) ? body.url.slice(pullPrefix.length) : "";
    if (!pullPrefix || !/^[0-9]+$/.test(pullNumber)) {
      return NextResponse.json({ error: "Unexpected execution URL" }, { status: 400 });
    }
  }
  if (body.status === "review_ready" && (!body.branch || !body.url)) {
    return NextResponse.json({ error: "Review-ready callbacks require a branch and pull request URL" }, { status: 400 });
  }

  const db = getServiceClient();
  const now = new Date().toISOString();
  const values = body.status === "review_ready"
    ? {
      status: "review_ready",
      execution_branch: body.branch || null,
      execution_url: body.url || null,
      execution_error: null,
      execution_completed_at: now,
      updated_at: now,
    }
    : body.status === "failed"
      ? {
        status: "failed",
        execution_branch: body.branch || null,
        execution_url: body.url || null,
        execution_error: body.error?.slice(0, 1_000) || "Repository executor failed",
        execution_completed_at: now,
        updated_at: now,
      }
      : {
        status: "executing",
        execution_branch: body.branch || null,
        execution_error: null,
        execution_started_at: now,
        updated_at: now,
      };
  const { data, error } = await db.from("war_room_proposals")
    .update(values)
    .eq("id", body.proposalId)
    .in("status", ["approved", "dispatching", "executing"])
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: existing, error: existingError } = await db.from("war_room_proposals")
      .select("status, execution_branch, execution_url")
      .eq("id", body.proposalId)
      .maybeSingle();
    if (existingError) throw existingError;
    const sameResult = existing?.status === body.status
      && (!body.branch || existing.execution_branch === body.branch)
      && (!body.url || existing.execution_url === body.url);
    if (sameResult) return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: "Proposal is not executable" }, { status: 409 });
  }
  const { error: eventError } = await db.from("war_room_proposal_events").insert({
    proposal_id: body.proposalId,
    event_type: body.status === "review_ready" ? "review_ready" : body.status === "failed" ? "execution_failed" : "execution_started",
    actor: "github-runner",
    details: { branch: body.branch || null, url: body.url || null, error: body.error?.slice(0, 1_000) || null },
  });
  if (eventError) throw eventError;
  return NextResponse.json({ ok: true });
}
