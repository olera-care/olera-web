import assert from "node:assert/strict";
import { cleanDmText, imageFiles, isApproval, isOwnMessage, isReadableDm } from "../lib/war-room/dm-intake";

// Which DM messages Cortex reads. The two founder messages it dropped on
// 2026-09-25/26 are cases 2 and 3; case 1 is the reply loop the old filter
// existed to prevent, and must stay blocked.

const OURS = "A0AK7OLERA";
const FOUNDER = "U0131NJURA7";
const envelope = (event: Record<string, unknown>) => ({
  api_app_id: OURS,
  authorizations: [{ user_id: "U0AJCRTHG02", is_bot: true }],
  event,
});

// 1. Cortex's own reply: never read.
assert.equal(isOwnMessage(envelope({ user: "U0AJCRTHG02", bot_id: "B0AK74BBS4Q", app_id: OURS, text: "Mixed, and not good?" })), true);
assert.equal(isReadableDm(envelope({ user: "U0AJCRTHG02", bot_id: "B0AK74BBS4Q", app_id: OURS, text: "Is that right?" })), false);
// Our bot user without an app id is still ours.
assert.equal(isOwnMessage(envelope({ user: "U0AJCRTHG02", text: "brief" })), true);
// Another app's post from the founder's account, with only a bot id: read.
assert.equal(isOwnMessage(envelope({ user: FOUNDER, bot_id: "B_CLAUDE", text: "Approved" })), false);
// Legacy bot posts come as subtype bot_message: never read.
assert.equal(isReadableDm(envelope({ bot_id: "B_WEBHOOK", subtype: "bot_message", text: "alert?" })), false);

// 2. The founder, posting through the Claude Slack connector: another app's id.
const viaClaude = envelope({ user: FOUNDER, app_id: "A_CLAUDE_CONNECTOR", bot_id: "B_CLAUDE", text: "Approved, go ahead\n*Sent using* <https://claude.ai|Claude>" });
assert.equal(isOwnMessage(viaClaude), false);
assert.equal(isReadableDm(viaClaude), true);
assert.equal(cleanDmText(viaClaude.event.text as string), "Approved, go ahead");
assert.equal(cleanDmText("Approved, go ahead\n*Sent using* Claude"), "Approved, go ahead");

// 3. The founder, with a screenshot: subtype file_share.
const screenshot = envelope({
  user: FOUNDER,
  subtype: "file_share",
  text: "whats the deal with Rudy here?",
  files: [{ id: "F1", mimetype: "image/png", size: 1_000_000, url_private: "https://files.slack.com/x.png" }],
});
assert.equal(isReadableDm(screenshot), true);
assert.equal(imageFiles(screenshot.event.files as never).length, 1);
// A screenshot with no text is still a message.
assert.equal(isReadableDm(envelope({ user: FOUNDER, subtype: "file_share", text: "", files: screenshot.event.files })), true);

// 4. Plain text from the founder.
assert.equal(isReadableDm(envelope({ user: FOUNDER, text: "How's organic traffic looking lately?" })), true);

// 5. Edits, deletions and joins are not messages to answer.
assert.equal(isReadableDm(envelope({ user: FOUNDER, subtype: "message_changed", text: "edited" })), false);
assert.equal(isReadableDm(envelope({ user: FOUNDER, subtype: "message_deleted" })), false);
assert.equal(isReadableDm(envelope({ user: FOUNDER, text: "" })), false);

// 6. Without our own app id, anything app-posted is treated as ours: a missed
// message is recoverable, a reply loop is not.
assert.equal(isOwnMessage({ event: { user: FOUNDER, app_id: "A_CLAUDE_CONNECTOR", text: "hi" } }), true);

// 7. Approvals: short and leading with the verdict. Questions and long messages are conversation.
for (const yes of ["Approved, go ahead", "approve", "Approved.", "yes, approve it", "Go ahead", "ship it"]) {
  assert.equal(isApproval(yes), true, yes);
}
for (const no of ["Approved?", "What did you approve yesterday", "Is the funnel split approved by Logan already, or does it still need me?", "the approval flow is broken"]) {
  assert.equal(isApproval(no), false, no);
}
// Images: only inline-sized images with a download link.
assert.equal(imageFiles([{ mimetype: "application/pdf", url_private: "x" }, { mimetype: "image/png", size: 9_000_000, url_private: "y" }]).length, 0);

console.log("slack DM intake checks passed");
