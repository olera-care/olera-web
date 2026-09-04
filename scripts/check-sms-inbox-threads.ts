import assert from "node:assert/strict";
import {
  buildSmsThreadSummaries,
  classifySmsThread,
  type SmsInboxInboundRow,
  type SmsInboxOutboundRow,
} from "../lib/sms/inbox-threads";

const phone = "+12562957906";

function inbound(overrides: Partial<SmsInboxInboundRow> = {}): SmsInboxInboundRow {
  return {
    id: 1,
    from_phone: phone,
    phone_last10: "2562957906",
    body: "Can you help me apply?",
    keyword: null,
    profile_id: "family-1",
    profile_type: "family",
    display_name: "Care Seeker",
    handled_at: null,
    created_at: "2026-08-19T12:05:00.000Z",
    ...overrides,
  };
}

function outbound(overrides: Partial<SmsInboxOutboundRow> = {}): SmsInboxOutboundRow {
  return {
    id: "outbound-1",
    recipient: phone,
    html_body: "Olera care team: We got your answers. Any questions about next steps?",
    email_type: "benefits_results_sms",
    provider_id: "family-1",
    recipient_type: "family",
    status: "sent",
    delivered_at: "2026-08-19T12:01:00.000Z",
    first_clicked_at: null,
    bounced_at: null,
    created_at: "2026-08-19T12:00:00.000Z",
    ...overrides,
  };
}

const silent = buildSmsThreadSummaries([], [outbound()]);
assert.equal(silent.length, 1);
assert.equal(silent[0].phone_last10, "2562957906");
assert.equal(silent[0].last_direction, "out");
assert.equal(silent[0].profile_id, "family-1");
assert.equal(silent[0].inbound_count, 0);
assert.equal(silent[0].outbound_count, 1);
assert.equal(
  classifySmsThread({
    suppressed: false,
    unhandled: silent[0].unhandled,
    hasDraft: false,
    lastDirection: silent[0].last_direction,
    lastOutboundStatus: silent[0].last_outbound_status,
    lastOutboundClickedAt: silent[0].last_outbound_clicked_at,
  }),
  "awaiting_family",
);

const clicked = buildSmsThreadSummaries(
  [],
  [outbound({ first_clicked_at: "2026-08-19T12:02:00.000Z" })],
)[0];
assert.equal(
  classifySmsThread({
    suppressed: false,
    unhandled: 0,
    hasDraft: false,
    lastDirection: clicked.last_direction,
    lastOutboundStatus: clicked.last_outbound_status,
    lastOutboundClickedAt: clicked.last_outbound_clicked_at,
  }),
  "self_served",
);

const failed = buildSmsThreadSummaries([], [outbound({ status: "failed" })])[0];
assert.equal(
  classifySmsThread({
    suppressed: false,
    unhandled: 0,
    hasDraft: false,
    lastDirection: failed.last_direction,
    lastOutboundStatus: failed.last_outbound_status,
    lastOutboundClickedAt: failed.last_outbound_clicked_at,
  }),
  "delivery_failed",
);

const replied = buildSmsThreadSummaries([inbound()], [outbound()])[0];
assert.equal(replied.last_direction, "in");
assert.equal(replied.last_body, "Can you help me apply?");
assert.equal(replied.unhandled, 1);
assert.equal(replied.oldest_promised_reply_at, "2026-08-19T12:05:00.000Z");
assert.equal(
  classifySmsThread({
    suppressed: false,
    unhandled: replied.unhandled,
    hasDraft: false,
    lastDirection: replied.last_direction,
    lastOutboundStatus: replied.last_outbound_status,
    lastOutboundClickedAt: replied.last_outbound_clicked_at,
  }),
  "needs_reply",
);

const followedUp = buildSmsThreadSummaries(
  [inbound({ handled_at: "2026-08-19T12:06:00.000Z" })],
  [outbound({ created_at: "2026-08-19T12:10:00.000Z", html_body: "Following up." })],
)[0];
assert.equal(followedUp.last_direction, "out");
assert.equal(followedUp.last_body, "Following up.");

const historicalAdminReply = buildSmsThreadSummaries(
  [inbound({ handled_at: "2026-08-19T12:06:00.000Z" })],
  [
    outbound({
      created_at: "2026-08-19T12:10:00.000Z",
      email_type: "admin_reply",
      recipient_type: null,
      provider_id: null,
      html_body: "Here is what we found.",
    }),
  ],
)[0];
assert.equal(historicalAdminReply.profile_id, "family-1");
assert.equal(historicalAdminReply.last_direction, "out");
assert.equal(
  classifySmsThread({
    suppressed: false,
    unhandled: historicalAdminReply.unhandled,
    hasDraft: false,
    lastDirection: historicalAdminReply.last_direction,
    lastOutboundStatus: historicalAdminReply.last_outbound_status,
    lastOutboundClickedAt: historicalAdminReply.last_outbound_clicked_at,
  }),
  "awaiting_family",
);

assert.equal(
  classifySmsThread({
    suppressed: true,
    unhandled: 2,
    hasDraft: true,
    lastDirection: "in",
    lastOutboundStatus: "sent",
    lastOutboundClickedAt: null,
  }),
  "opted_out",
);
assert.equal(
  classifySmsThread({
    suppressed: false,
    unhandled: 0,
    hasDraft: true,
    lastDirection: "in",
    lastOutboundStatus: "sent",
    lastOutboundClickedAt: null,
  }),
  "needs_reply",
);

const oldestPromise = buildSmsThreadSummaries(
  [
    inbound({ id: 2, created_at: "2026-08-19T12:08:00.000Z", body: "Second message" }),
    inbound({ id: 1, created_at: "2026-08-19T12:05:00.000Z", body: "First message" }),
  ],
  [],
)[0];
assert.equal(oldestPromise.oldest_promised_reply_at, "2026-08-19T12:05:00.000Z");
assert.equal(oldestPromise.last_body, "Second message");

assert.equal(buildSmsThreadSummaries([], [outbound({ recipient: "not-a-phone" })]).length, 0);

console.log("SMS inbox thread checks passed: outbound-only, reply, click, failure, opt-out, and draft states.");
