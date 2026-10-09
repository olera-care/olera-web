/**
 * Deterministic checks for Cortex on call (lib/war-room/oncall.ts).
 *
 *   npx tsx scripts/check-cortex-oncall.ts
 */
import assert from "node:assert/strict";
import { footerFor, isBuildable, parseReplyKind, planRevisedSincePr, bodyHasMarker, canStartBuild, isGoCommand, isStopCommand, mentionsUser, oncallMarker, oncallText, routinePayload, threadTranscript } from "../lib/war-room/oncall";

// Mentions are stripped; the words stay.
assert.equal(oncallText("<@U09CORTEX> texts show only Admin Reply"), "texts show only Admin Reply");
assert.equal(oncallText("<@U09CORTEX|cortex>   go"), "go");
assert.ok(mentionsUser("hey <@U09CORTEX> look", "U09CORTEX"));
assert.ok(mentionsUser("hey <@U09CORTEX|cortex>", "U09CORTEX"));
assert.ok(!mentionsUser("hey <@U0OTHER>", "U09CORTEX"));
assert.ok(!mentionsUser("hey", null));

// Go is the whole message, never a leading word.
for (const go of ["go", "Go!", "go ahead", "build it", "ship it", "approved", "yes, build it", "go ahead please", "*go*"]) assert.ok(isGoCommand(go), go);
for (const not of ["go ahead and check the logs first", "going to look", "why did it go wrong", "", "go to the case page"]) assert.ok(!isGoCommand(not), not);
assert.ok(isStopCommand("never mind"));
assert.ok(isStopCommand("cancel"));
assert.ok(!isStopCommand("cancel the old texts too"));

// Only the founder starts a build.
assert.ok(canStartBuild("UTJ", "UTJ"));
assert.ok(!canStartBuild("UCES", "UTJ"));
assert.ok(!canStartBuild("UTJ", null));

// The marker is what the cron finds the PR by.
const id = "3faa8e71-ae73-4c0f-be30-51afc3fd0c0f";
assert.ok(bodyHasMarker(`Fixes texts\n\n${oncallMarker(id)}\n`, id));
assert.ok(!bodyHasMarker("cortex-oncall:someone-else", id));
assert.ok(!bodyHasMarker(null, id));
assert.ok(routinePayload({ caseId: id, brief: "# Brief", channelName: "careseeker-support", permalink: null }).includes(oncallMarker(id)));

// Transcript: names, Cortex labelled, long threads keep the report and the end.
const msgs = [
  { user: "UCES", name: "Ces", text: "<@U09CORTEX> texts show only Admin Reply", ts: "1", fromCortex: false, files: 1 },
  { user: "UBOT", name: null, text: "What I think is happening...", ts: "2", fromCortex: true, files: 0 },
];
assert.equal(threadTranscript(msgs), "Ces: texts show only Admin Reply [1 attachment]\nCortex: What I think is happening...");
const long = Array.from({ length: 200 }, (_, i) => ({ user: "U", name: "A", text: `message ${i} ${"x".repeat(80)}`, ts: String(i), fromCortex: false, files: 0 }));
const cut = threadTranscript(long, 2_000);
assert.ok(cut.length <= 2_100, String(cut.length));
assert.ok(cut.startsWith("A: message 0 "));
assert.ok(cut.includes("(earlier messages left out)"));
assert.ok(cut.trimEnd().endsWith("x".repeat(80)) && cut.includes("message 199"));

// With a PR up, only a plan posted after it can be built again.
assert.ok(planRevisedSincePr({ plan_at: "2026-10-08T10:00:00Z", pr_opened_at: null }));
assert.ok(!planRevisedSincePr({ plan_at: "2026-10-08T10:00:00Z", pr_opened_at: "2026-10-08T11:00:00Z" }));
assert.ok(planRevisedSincePr({ plan_at: "2026-10-08T12:00:00Z", pr_opened_at: "2026-10-08T11:00:00Z" }));
assert.ok(!planRevisedSincePr({ plan_at: null, pr_opened_at: null }));

// Reply kinds: the tag is stripped and decides the footer.
assert.deepEqual(parseReplyKind("[[plan]]\n\n*Plan:* 1. Fix it"), { kind: "plan", body: "*Plan:* 1. Fix it" });
assert.deepEqual(parseReplyKind("[[ Answer ]]\nWe had 10 inquiries."), { kind: "answer", body: "We had 10 inquiries." });
assert.equal(parseReplyKind("[[kind: done]]\nShipped in #2459.").kind, "done");
assert.equal(parseReplyKind("[[gap]]\nI can't see leads by source.").kind, "gap");
// No tag, or an unknown one: an answer, and no stray brackets reach Slack.
assert.deepEqual(parseReplyKind("Just text."), { kind: "answer", body: "Just text." });
assert.deepEqual(parseReplyKind("[[maybe]]\nHmm."), { kind: "answer", body: "Hmm." });
assert.ok(isBuildable("plan") && isBuildable("gap") && !isBuildable("done") && !isBuildable("answer"));
assert.ok(footerFor("plan", "UTJ")?.includes("@Cortex go"));
assert.ok(footerFor("gap", "UTJ")?.includes("build the lookup"));
assert.equal(footerFor("answer", "UTJ"), null);
assert.equal(footerFor("done", "UTJ"), null);

// "hand this off" is recognised the same way on every surface; questions about it are not commands.
import("../lib/war-room/handoff.server").then(({ handoffNote, handoffQuestion }) => {
  assert.equal(handoffNote("Hand this off"), "");
  assert.equal(handoffNote("hand this off: the five-checkpoint measures"), "the five-checkpoint measures");
  assert.equal(handoffNote("should we hand this off to Logan?"), null);
  assert.equal(handoffNote("Send this off"), null);
  const q = handoffQuestion("", "Slack #cortex", "TJ: measure interviews begun");
  assert.ok(q.includes("from Slack #cortex") && q.includes("TJ: measure interviews begun"));
  assert.ok(handoffQuestion("x").includes("from Telegram"));
  console.log("cortex on-call checks passed");
});
