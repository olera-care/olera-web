import assert from "node:assert/strict";
import { buildWarRoomBriefText, sendableQuestion } from "../lib/war-room/brief-delivery.server";
import { fallbackMove, parseMoveReply, pickMove, type MoveCandidate } from "../lib/war-room/brief-move.server";

// The brief leads with one move, asks at most one question he alone can
// answer, and puts everything measured below a divider.

const run = { status: "completed" as const, created_at: "2026-09-24T10:30:09Z", error_message: null, source_summary: {} };
const base = {
  run,
  siteUrl: "https://olera.care",
  readings: [],
  proposals: [],
  approvedOpen: [],
  open: 6,
  watching: 6,
  costUsd: 2.39,
};
const DIVIDER = "───────────";

// 1. A move is the first line, with its draft quoted under it, and the data is below the divider.
const withMove = buildWarRoomBriefText({
  ...base,
  proposals: [{ title: "Funnel split", why_now: "x", decision_required: "y", created_at: "2026-09-23T04:41:41Z" }],
  approvedOpen: [{ title: "Call Liz", approved_at: "2026-09-21T14:04:46Z", assigned_owner: "TJ" }],
  move: { title: "Call Liz", line: "Hoop Cares renews in 29 days. Ces should call Liz Hoop this week.", draft: "Hi Liz,\nQuick one." },
});
const lines = withMove.split("\n");
assert.equal(lines[0], "*Hoop Cares renews in 29 days. Ces should call Liz Hoop this week.*");
assert.ok(withMove.indexOf("> Hi Liz,") < withMove.indexOf(DIVIDER), "draft sits above the divider");
assert.ok(withMove.indexOf("_This scan cost $2.39._") > withMove.indexOf(DIVIDER), "cost sits below the divider");
assert.ok(!withMove.includes("• Call Liz"), "the move is not repeated in the lists below");
assert.ok(withMove.includes("• Funnel split"), "other waiting decisions stay below the divider");

// 2. Nothing passes: one short line, then the data.
const quiet = buildWarRoomBriefText(base);
assert.equal(quiet.split("\n")[0], "Nothing needs you today.");

// 3. A question that fails the founder-answerable test is never sent.
const analystQuestion = {
  investigationId: "i1",
  title: "Direct traffic",
  question: "What composes the 4,992 Direct sessions by landing-page family?",
};
assert.equal(sendableQuestion(analystQuestion), null);
const noBadQuestion = buildWarRoomBriefText({ ...base, question: analystQuestion });
assert.ok(!noBadQuestion.includes("4,992"), "an analyst-grade question is dropped");
assert.equal(noBadQuestion.split("\n")[0], "Nothing needs you today.");

// 4. A good question leads when there is no move, named by its title.
const good = { investigationId: "i2", title: "Starter tier", question: "Seen 42 times since 2026-08-16 and it hasn't moved. Make a real plan for it, or stop raising it?" };
assert.ok(sendableQuestion(good), "the stalled-condition question passes the founder test");
const asked = buildWarRoomBriefText({ ...base, question: good });
assert.ok(asked.startsWith("*Only you can answer this.* Starter tier: Seen 42 times"));
assert.equal((asked.slice(0, asked.indexOf(DIVIDER)).match(/\?/g) ?? []).length, 1, "at most one question above the divider");

// 5. Failed scans still report loudly and ask nothing.
const failed = buildWarRoomBriefText({ ...base, run: { ...run, status: "failed", error_message: "boom" }, question: good });
assert.ok(failed.includes("scan failed") && !failed.includes("Only you can answer"));

// 6. Move choice: approved work nobody did outranks a waiting decision; oldest first.
const candidate = (over: Partial<MoveCandidate>): MoveCandidate => ({
  kind: "decision_waiting", title: "t", why_now: "Because. More.", decision_required: null, assigned_owner: null,
  action_kind: null, proposed_solution: null, finding: null, execution_plan: null, evidence: null, since: null, ...over,
});
const approvedOld = candidate({ kind: "approved_not_done", title: "old", since: "2026-09-01" });
const approvedNew = candidate({ kind: "approved_not_done", title: "new", since: "2026-09-20" });
const waiting = candidate({ title: "waiting", since: "2026-08-01" });
assert.equal(pickMove([approvedNew, approvedOld], [waiting])?.title, "old");
assert.equal(pickMove([], [waiting])?.title, "waiting");
assert.equal(pickMove([], []), null);

// 7. The fallback is one plain sentence from the row, and the model's reply is bounded.
assert.equal(fallbackMove(candidate({ title: "Approve the report" })).line, "Decide: Approve the report. Because.");
assert.deepEqual(parseMoveReply('{"line":"Approve the funnel report today.","draft":null}'), { line: "Approve the funnel report today.", draft: null });
assert.equal(parseMoveReply('{"line":"Call Liz this week — renewal is close.","draft":null}')?.line, "Call Liz this week, renewal is close.");
assert.equal(parseMoveReply("not json"), null);
assert.equal(parseMoveReply('{"line":"short"}'), null);

console.log("war room brief checks passed");
