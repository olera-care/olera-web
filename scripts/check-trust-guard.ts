/**
 * check:trust-guard — the admin "Trust" action must not re-enable a mailbox that
 * has never accepted mail.
 *
 * Context: trusting an address bypasses bounce suppression, so a dead address
 * that gets trusted is mailed indefinitely and every attempt counts toward the
 * account-wide bounce threshold that also carries family and auth mail. Measured
 * over 90 days of production sends, trusted addresses bounced at 10.4% against
 * 1.4% for everything else.
 *
 * The rule is deliberately narrow: one delivery ever, on any email type, means
 * the inbox works and the human override stands.
 */
import assert from "node:assert/strict";
import { isNeverDeliveredMailbox } from "../lib/email";

// Refuse: bounced and never once delivered.
assert.equal(isNeverDeliveredMailbox({ bounced: 1, everDelivered: false }), true, "single bounce, never delivered → refuse");
assert.equal(isNeverDeliveredMailbox({ bounced: 17, everDelivered: false }), true, "repeat bounces, never delivered → refuse");

// Allow: the inbox has demonstrably worked at least once.
assert.equal(isNeverDeliveredMailbox({ bounced: 5, everDelivered: true }), false, "bounced but has delivered → allow override");
assert.equal(isNeverDeliveredMailbox({ bounced: 0, everDelivered: true }), false, "clean history → allow");

// Allow: no evidence either way. The guard must fail OPEN so a brand-new address,
// or a transient lookup failure returning zeroes, never blocks a legitimate trust.
assert.equal(isNeverDeliveredMailbox({ bounced: 0, everDelivered: false }), false, "no history at all → allow (fails open)");

console.log("check:trust-guard — all assertions passed");
