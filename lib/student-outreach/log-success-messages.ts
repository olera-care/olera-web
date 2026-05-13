/**
 * E1: centralized success-message lookup for Log actions.
 *
 * Maps (action, outcome) → human-facing progression sentence. Used by
 * Log modal dispatch sites to surface a toast after a successful
 * submit. Returns null when the action doesn't have a registered
 * message (no toast renders).
 *
 * Philosophy: every Log outcome should feel meaningful, intentional,
 * and visibly progressive. The message names the consequence
 * ("cadence stopped", "row moved", "Partner Prospects unlocked") so
 * admins SEE the movement instead of inferring it.
 *
 * Adding a new action / outcome: just add to MESSAGES. No other code
 * to update.
 */

type MessageEntry = string | Record<string, string>;

const MESSAGES: Record<string, MessageEntry> = {
  log_call: {
    no_answer: "Call logged — row reappears on the next phone day",
    voicemail: "Voicemail logged — row moved to Replies",
    promised_callback: "Callback expected — row moved to Replies",
    connected_engaged: "Interested — cadence stopped, row moved to Replies",
    convert_to_partner: "Marked as Partner — row converted",
    convert_to_client: "Became a Client — Partner Prospects unlocked",
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
    convert_to_client: "Became a Client — Partner Prospects unlocked",
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
  flag_wants_meeting: "Meeting in flight — row moved to Meetings",
  mark_meeting_scheduled: "Meeting scheduled — row moved to Meetings",
  mark_meeting_followup: "Sent to Replies for follow-up",
  mark_partner: "Marked as Partner — row converted",
  mark_not_interested: "Closed as Not interested",
  mark_dnc: "Closed — communications stopped",
  mark_no_response_closed: "Archived as no response",
  mark_wrong_contact: "Closed — wrong contact",
  make_client: "Became a Client — Partner Prospects unlocked",
  schedule_sequence: "Outreach launched — cadence queued",
  reopen: "Row reopened",
  add_contact: "Contact added",
};

export function logActionSuccessMessage(
  action: string,
  outcome?: string | null,
): string | null {
  const entry = MESSAGES[action];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (outcome && entry[outcome]) return entry[outcome];
  return null;
}
