/**
 * E1: centralized success-message lookup for Log actions.
 *
 * Maps (action, payload) → human-facing progression sentence. Used by
 * Log modal dispatch sites to surface a toast after a successful
 * submit. Returns null when the action doesn't have a registered
 * message (no toast renders).
 *
 * Philosophy: every Log outcome should feel meaningful, intentional,
 * and visibly progressive. The message names the consequence
 * ("cadence stopped", "row moved", "Partner Prospects unlocked") so
 * admins SEE the movement instead of inferring it.
 *
 * Lookup precedence within an action's sub-map:
 *   1. payload.outcome / payload.classification (string keys)
 *   2. boolean-flag keys (payload.no_show, etc. — first matching key)
 *   3. "default" key
 *   4. null (no toast)
 *
 * Adding a new action / outcome: just add to MESSAGES. No call-site
 * changes needed.
 */

type MessageEntry = string | Record<string, string>;

const MESSAGES: Record<string, MessageEntry> = {
  log_call: {
    no_answer: "Call logged — row reappears on the next phone day",
    voicemail: "Voicemail logged — row moved to Replies",
    promised_callback: "Callback expected — row moved to Replies",
    connected_engaged: "Interested — cadence stopped, row moved to Replies",
    convert_to_partner: "Marked as Partner — row converted",
    connected_not_interested: "Closed as Not interested",
    wrong_number: "Closed — wrong contact",
  },
  // Same vocabulary, aliased — handleLogCall handles both action names.
  log_call_outcome: {
    no_answer: "Call logged — row reappears on the next phone day",
    voicemail: "Voicemail logged — row moved to Replies",
    promised_callback: "Callback expected — row moved to Replies",
    connected_engaged: "Interested — cadence stopped, row moved to Replies",
    convert_to_partner: "Marked as Partner — row converted",
    connected_not_interested: "Closed as Not interested",
    wrong_number: "Closed — wrong contact",
  },
  log_research_call: {
    no_answer: "Pre-flight call logged — no answer",
    voicemail: "Pre-flight call logged — voicemail / message left",
    connected: "Pre-flight call logged — reached someone",
    wrong_number: "Closed — wrong number",
  },
  classify_reply: {
    keep_emailing: "Reply logged — cadence stopped",
    wants_meeting: "Row moved to Meetings — finding a time",
    already_booked: "Meeting booked — row moved to Meetings",
    committed: "Marked as Partner — row converted",
    not_interested: "Closed as Not interested",
  },
  log_email_replied: "Reply logged — cadence stopped",
  // P6: flag_wants_meeting has a no-show variant — dispatchers pass
  // payload.no_show=true and the helper picks the variant message via
  // the boolean-flag lookup. The default still applies when admin
  // is just flagging an in-flight meeting from scratch.
  flag_wants_meeting: {
    default: "Meeting in flight — row moved to Meetings",
    no_show: "No-show logged — row ready for rescheduling",
  },
  mark_meeting_scheduled: "Meeting scheduled — row moved to Meetings",
  mark_meeting_followup: "Sent to Replies for follow-up",
  mark_partner: "Marked as Partner — row converted",
  mark_not_interested: "Closed as Not interested",
  mark_dnc: "Closed — communications stopped",
  mark_no_response_closed: "Archived as no response",
  mark_wrong_contact: "Closed — wrong contact",
  schedule_sequence: "Outreach launched — cadence queued",
  reopen: "Row reopened",
  add_contact: "Contact added",
};

export function logActionSuccessMessage(
  action: string,
  payload?: Record<string, unknown> | null,
): string | null {
  const entry = MESSAGES[action];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  // Outcome / classification keys take precedence over boolean flags.
  const outcome =
    typeof payload?.outcome === "string"
      ? payload.outcome
      : typeof payload?.classification === "string"
        ? payload.classification
        : null;
  if (outcome && entry[outcome]) return entry[outcome];
  // Boolean-flag keys (e.g. no_show) — first matching key wins. Skip
  // the reserved "default" key during this pass.
  for (const key of Object.keys(entry)) {
    if (key === "default") continue;
    if (payload?.[key] === true) return entry[key];
  }
  return entry.default ?? null;
}
