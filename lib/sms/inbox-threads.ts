export type SmsThreadState =
  | "needs_reply"
  | "awaiting_family"
  | "self_served"
  | "opted_out"
  | "delivery_failed"
  | "handled";

export interface SmsInboxInboundRow {
  id: number;
  from_phone: string;
  phone_last10: string;
  body: string;
  keyword: string | null;
  profile_id: string | null;
  profile_type: string | null;
  display_name: string | null;
  handled_at: string | null;
  created_at: string;
}

export interface SmsInboxOutboundRow {
  id: string;
  recipient: string;
  html_body: string | null;
  email_type: string;
  provider_id: string | null;
  recipient_type: string | null;
  status: string;
  delivered_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  created_at: string;
}

export interface SmsThreadSummary {
  phone_last10: string;
  from_phone: string;
  display_name: string | null;
  profile_type: string | null;
  profile_id: string | null;
  last_body: string;
  last_keyword: string | null;
  last_at: string;
  last_direction: "in" | "out";
  last_email_type: string | null;
  last_outbound_status: string | null;
  last_outbound_delivered_at: string | null;
  last_outbound_clicked_at: string | null;
  unhandled: number;
  oldest_promised_reply_at: string | null;
  inbound_count: number;
  outbound_count: number;
  total: number;
}

type MutableSmsThreadSummary = SmsThreadSummary & { latest_outbound_at: string | null };

export function smsPhoneLast10(raw: string | null | undefined): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function newThread(phoneLast10: string, fromPhone: string): MutableSmsThreadSummary {
  return {
    phone_last10: phoneLast10,
    from_phone: fromPhone || `+1${phoneLast10}`,
    display_name: null,
    profile_type: null,
    profile_id: null,
    last_body: "",
    last_keyword: null,
    last_at: "",
    last_direction: "out",
    last_email_type: null,
    last_outbound_status: null,
    last_outbound_delivered_at: null,
    last_outbound_clicked_at: null,
    unhandled: 0,
    oldest_promised_reply_at: null,
    inbound_count: 0,
    outbound_count: 0,
    total: 0,
    latest_outbound_at: null,
  };
}

function isLater(candidate: string, current: string | null): boolean {
  return !current || Date.parse(candidate) > Date.parse(current);
}

/**
 * Build one conversation summary per phone from our durable inbound store and
 * outbound SMS ledger. The two sources are intentionally independent: a silent
 * recipient has no sms_inbound row, while an unknown inbound sender may have no
 * email_log history at all.
 */
export function buildSmsThreadSummaries(
  inboundRows: SmsInboxInboundRow[],
  outboundRows: SmsInboxOutboundRow[],
): SmsThreadSummary[] {
  const threads = new Map<string, MutableSmsThreadSummary>();

  for (const row of inboundRows) {
    const key = smsPhoneLast10(row.phone_last10 || row.from_phone);
    if (!key) continue;
    const thread = threads.get(key) ?? newThread(key, row.from_phone);
    threads.set(key, thread);

    thread.inbound_count += 1;
    thread.total += 1;
    thread.display_name ||= row.display_name;
    thread.profile_type ||= row.profile_type;
    thread.profile_id ||= row.profile_id;

    if (isLater(row.created_at, thread.last_at)) {
      thread.from_phone = row.from_phone || thread.from_phone;
      thread.last_body = row.body;
      thread.last_keyword = row.keyword;
      thread.last_at = row.created_at;
      thread.last_direction = "in";
      thread.last_email_type = null;
    }

    if (!row.handled_at) {
      thread.unhandled += 1;
      if (row.profile_type === "family" && !row.keyword) {
        const oldest = thread.oldest_promised_reply_at;
        if (!oldest || Date.parse(row.created_at) < Date.parse(oldest)) {
          thread.oldest_promised_reply_at = row.created_at;
        }
      }
    }
  }

  for (const row of outboundRows) {
    const key = smsPhoneLast10(row.recipient);
    if (!key) continue;
    const thread = threads.get(key) ?? newThread(key, row.recipient);
    threads.set(key, thread);

    thread.outbound_count += 1;
    thread.total += 1;
    thread.profile_type ||= row.recipient_type;
    thread.profile_id ||= row.provider_id;

    if (isLater(row.created_at, thread.latest_outbound_at)) {
      thread.latest_outbound_at = row.created_at;
      thread.last_outbound_status = row.status;
      thread.last_outbound_delivered_at = row.delivered_at;
      thread.last_outbound_clicked_at = row.first_clicked_at;
    }

    if (isLater(row.created_at, thread.last_at)) {
      thread.from_phone = row.recipient || thread.from_phone;
      thread.last_body = row.html_body || `SMS: ${row.email_type}`;
      thread.last_keyword = null;
      thread.last_at = row.created_at;
      thread.last_direction = "out";
      thread.last_email_type = row.email_type;
    }
  }

  return [...threads.values()]
    .filter((thread) => Boolean(thread.last_at))
    .map(({ latest_outbound_at: _latestOutboundAt, ...thread }) => thread)
    .sort((a, b) => Date.parse(b.last_at) - Date.parse(a.last_at));
}

export function classifySmsThread(input: {
  suppressed: boolean;
  unhandled: number;
  hasDraft: boolean;
  lastDirection: "in" | "out";
  lastOutboundStatus: string | null;
  lastOutboundClickedAt: string | null;
}): SmsThreadState {
  if (input.suppressed) return "opted_out";
  if (input.unhandled > 0 || input.hasDraft) return "needs_reply";
  if (input.lastDirection === "out" && input.lastOutboundStatus === "failed") {
    return "delivery_failed";
  }
  if (input.lastDirection === "out" && input.lastOutboundClickedAt) return "self_served";
  if (input.lastDirection === "out") return "awaiting_family";
  return "handled";
}
