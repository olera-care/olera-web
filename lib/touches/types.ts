/**
 * Provider touch log — shared types and vocabulary.
 *
 * A touch is one human-level contact with a provider on any channel. The table
 * (`provider_touches`, migration 205) holds only what would otherwise be lost:
 * hand-sent emails, texts, calls, meetings. System sends stay in `email_log` and
 * campaign events stay in `ad_campaign_log`; the timeline merges them at read time.
 *
 * State is never stored. "Last touch", "days quiet", "overdue", "never had a human
 * touch" are all derived from rows, in `timeline.server.ts`.
 */

export const TOUCH_CHANNELS = ["email", "text", "call", "meeting", "in_app"] as const;
export type TouchChannel = (typeof TOUCH_CHANNELS)[number];

export const TOUCH_DIRECTIONS = ["out", "in"] as const;
export type TouchDirection = (typeof TOUCH_DIRECTIONS)[number];

export const TOUCH_SOURCES = ["manual", "gmail", "system"] as const;
export type TouchSource = (typeof TOUCH_SOURCES)[number];

export const CHANNEL_LABEL: Record<TouchChannel, string> = {
  email: "Email",
  text: "Text",
  call: "Call",
  meeting: "Meeting",
  in_app: "In app",
};

export type TouchRow = {
  id: string;
  provider_id: string;
  channel: TouchChannel;
  direction: TouchDirection;
  occurred_at: string;
  summary: string;
  detail: string | null;
  contact_name: string | null;
  contact_handle: string | null;
  source: TouchSource;
  source_ref: string | null;
  next_action: string | null;
  next_action_due: string | null;
  next_action_owner: string | null;
  next_action_done_at: string | null;
  author: string;
  admin_user_id: string | null;
  created_at: string;
};

/** What the API accepts on POST. */
export type TouchInput = {
  provider_id: string;
  channel: TouchChannel;
  direction: TouchDirection;
  occurred_at?: string;
  summary: string;
  detail?: string | null;
  contact_name?: string | null;
  contact_handle?: string | null;
  source?: TouchSource;
  source_ref?: string | null;
  next_action?: string | null;
  next_action_due?: string | null;
  next_action_owner?: string | null;
};

/**
 * Where a timeline row was read from. The first three are what a touch row can
 * declare (DB CHECK); the last two are read-only feeds the timeline merges in:
 * `gmail` also covers support_email_messages, `twilio` covers sms_inbound.
 */
export type TimelineSource = TouchSource | "twilio";

/** One line on a provider's timeline, whatever table it came from. */
export type TimelineItem = {
  id: string;
  /**
   * touch    = provider_touches (a person logged it)
   * email    = email_log (system sends, email and SMS)
   * campaign = ad_campaign_log
   * support  = support_email_messages (anything through support@, replies and Bcc'd copies)
   * sms      = sms_inbound (a text to the Olera number)
   */
  kind: "touch" | "email" | "campaign" | "support" | "sms";
  /** out = we did it, in = they did it, system = the application did it */
  actor: "out" | "in" | "system";
  channel: TouchChannel | "system";
  occurred_at: string;
  title: string;
  detail: string | null;
  source: TimelineSource;
  /**
   * System emails: delivered / opened / failed / complained.
   * Support and SMS rows: "needs reply" when nobody has answered them yet.
   */
  status?: string | null;
  contact_handle?: string | null;
  /** Where to go to act on it (the support inbox, the SMS inbox). */
  href?: string | null;
  /** Only on touch rows that declared a next action. */
  next_action?: {
    text: string;
    due: string | null;
    owner: string | null;
    done_at: string | null;
  } | null;
};

export type ProviderContact = {
  provider_id: string;
  display_name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  contact_name: string | null;
  email: string | null;
  claimer_email: string | null;
  phone: string | null;
  preferred_channel: "email" | "sms" | null;
};

export type OpenAction = {
  touch_id: string;
  text: string;
  due: string | null;
  owner: string | null;
  declared_at: string;
};

export type LastTouch = {
  occurred_at: string;
  channel: TouchChannel | "system";
  actor: "out" | "in" | "system";
  source: TimelineSource;
  title: string;
  status?: string | null;
};

/** One row of the Relationships list. Everything here is derived. */
export type RelationshipRow = ProviderContact & {
  last_touch: LastTouch | null;
  last_human_touch_at: string | null;
  human_touch_count: number;
  open_action: OpenAction | null;
  days_quiet: number | null;
  flags: RelationshipFlag[];
  campaign_status: string | null;
  /** Newest Ad Boost request, for the link back to /admin/ad-boost/[id]. */
  campaign_request_id: string | null;
};

/** One Ad Boost request, enough to link to it and say what state it is in. */
export type CampaignRef = {
  id: string;
  status: string;
  campaign_tag: string | null;
  created_at: string;
};

export type RelationshipFlag =
  | "overdue"
  | "awaiting_reply"
  | "never_human"
  | "complaint_on_file"
  | "prefers_text"
  | "unopened_streak";

/** What GET /api/admin/touches?provider=<id> returns. */
export type ProviderTimeline = {
  profile: ProviderContact;
  open_action: OpenAction | null;
  flags: RelationshipFlag[];
  /** Every Ad Boost request for this provider, newest first. */
  campaigns: CampaignRef[];
  items: TimelineItem[];
};
