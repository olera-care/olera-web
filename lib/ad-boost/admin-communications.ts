import { AD_BOOST_PROVIDER_JOURNEY, type JourneyStep } from "@/lib/family-comms/journey";

export type AdBoostCommunicationTone =
  | "sent"
  | "active"
  | "scheduled"
  | "waiting"
  | "muted";

export type AdBoostAttentionLevel = "attention" | "waiting" | "healthy" | "done";

export interface AdBoostCommunicationRecord {
  id?: string;
  email_type: string;
  subject?: string | null;
  status: string;
  created_at: string;
  delivered_at?: string | null;
  bounced_at?: string | null;
  error_message?: string | null;
}

export interface AdBoostCommunicationSummaryEntry {
  count: number;
  last_sent_at: string;
  last_subject?: string | null;
}

export interface AdBoostCommunicationSummary {
  by_type: Record<string, AdBoostCommunicationSummaryEntry>;
  last: {
    email_type: string;
    subject: string | null;
    sent_at: string;
  } | null;
}

export interface AdBoostCommunicationRequest {
  id: string;
  status: string;
  deleted_at?: string | null;
  created_at: string;
  requested_setup_week: string;
  flight_end_date?: string | null;
  delivered?: number;
  ad_clicks?: number | null;
  ad_spend_cents?: number | null;
  queued_email_sent_at?: string | null;
  requested_email_sent_at?: string | null;
  profile_reminder_email_sent_at?: string | null;
  promotion_email_sent_at?: string | null;
  launched_email_sent_at?: string | null;
  launched_email_scheduled_at?: string | null;
  traction_email_sent_at?: string | null;
  promo_complete_email_sent_at?: string | null;
  plan_status?: "active" | "past_due" | "canceled" | null;
  communication_summary?: AdBoostCommunicationSummary;
}

export interface AdBoostStepState {
  label: string;
  detail?: string;
  tone: AdBoostCommunicationTone;
  sentAt?: string;
  sentCount?: number;
}

export interface AdBoostJourneyState {
  step: JourneyStep;
  state: AdBoostStepState;
}

export interface AdBoostNextAction {
  label: string;
  detail: string;
  level: AdBoostAttentionLevel;
  stepKey?: string;
  priority: number;
}

const MARKER_BY_EMAIL_TYPE: Record<string, keyof AdBoostCommunicationRequest> = {
  ad_boost_queued: "queued_email_sent_at",
  ad_boost_requested: "requested_email_sent_at",
  ad_boost_profile_reminder: "profile_reminder_email_sent_at",
  ad_boost_ready: "promotion_email_sent_at",
  ad_boost_campaign_launched: "launched_email_sent_at",
  ad_boost_traction: "traction_email_sent_at",
  ad_boost_promo_complete: "promo_complete_email_sent_at",
};

function validTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) return null;
  return value;
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  return values
    .filter((value): value is string => Boolean(validTimestamp(value)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function successfulRecords(
  communications: AdBoostCommunicationRecord[],
  emailType: string,
): AdBoostCommunicationRecord[] {
  return communications.filter(
    (communication) =>
      communication.email_type === emailType &&
      !communication.bounced_at &&
      (communication.status === "sent" || Boolean(communication.delivered_at)),
  );
}

export function formatAdBoostRelativeTime(
  iso: string | null | undefined,
  now = Date.now(),
): string {
  if (!iso) return "";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatAdBoostScheduledTime(iso: string, now = Date.now()): string {
  const scheduled = new Date(iso);
  if (scheduled.getTime() <= now) return formatAdBoostRelativeTime(iso, now);
  return scheduled.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

/** Resolve a send from either the campaign marker or the canonical email log.
 * Markers are the idempotency guard; logs recover legacy/missing-marker rows.
 */
export function sentInfoForType(
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[],
  emailType: string,
): { count: number; lastSentAt: string | null; subject: string | null } {
  const markerKey = MARKER_BY_EMAIL_TYPE[emailType];
  const marker = markerKey ? validTimestamp(request[markerKey]) : null;
  const records = successfulRecords(communications, emailType);
  const summary = request.communication_summary?.by_type[emailType];
  const recordLast = latestTimestamp(records.map((record) => record.delivered_at ?? record.created_at));
  const lastSentAt = latestTimestamp([marker, recordLast, summary?.last_sent_at]);
  const recordSubject = [...records].reverse().find((record) => record.subject)?.subject ?? null;
  const count = Math.max(records.length, summary?.count ?? 0, marker ? 1 : 0);
  return {
    count,
    lastSentAt,
    subject: recordSubject ?? summary?.last_subject ?? null,
  };
}

function sentState(
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[],
  emailType: string,
  now: number,
): AdBoostStepState | null {
  const info = sentInfoForType(request, communications, emailType);
  if (!info.lastSentAt) return null;
  return {
    label: info.count > 1 ? `${info.count} sent` : "Sent",
    detail: formatAdBoostRelativeTime(info.lastSentAt, now),
    tone: "sent",
    sentAt: info.lastSentAt,
    sentCount: info.count,
  };
}

export function getAdBoostStepState(
  step: JourneyStep,
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[] = [],
  options: { leadCount?: number; unresolvedOutcomes?: number; now?: number } = {},
): AdBoostStepState {
  const now = options.now ?? Date.now();
  const status = request.status;
  const sent = step.emailType
    ? sentState(request, communications, step.emailType, now)
    : null;

  switch (step.key) {
    case "request_queued":
      return sent ??
        (sentInfoForType(request, communications, "ad_boost_requested").lastSentAt
          ? { label: "Not this path", tone: "muted" }
          : status === "pending_profile"
            ? { label: "Waiting on profile", tone: "waiting" }
            : { label: "Not recorded", tone: "muted" });
    case "request_ready":
      return sent ??
        (sentInfoForType(request, communications, "ad_boost_queued").lastSentAt
          ? { label: "Queued path", tone: "muted" }
          : { label: "Not recorded", tone: "muted" });
    case "profile_reminder": {
      if (sent) return sent;
      if (status !== "pending_profile") return { label: "Skipped", tone: "muted" };
      const dueAt = new Date(request.created_at).getTime() + 48 * 60 * 60 * 1000;
      return dueAt <= now
        ? { label: "Due now", detail: "queued 48h+", tone: "waiting" }
        : {
            label: "Watching",
            detail: `due ${formatAdBoostScheduledTime(new Date(dueAt).toISOString(), now)}`,
            tone: "scheduled",
          };
    }
    case "promotion_ready":
      return sent ??
        (status === "pending_profile"
          ? { label: "Blocked", detail: "profile gate", tone: "waiting" }
          : sentInfoForType(request, communications, "ad_boost_queued").lastSentAt
            ? { label: "Not recorded", tone: "muted" }
            : { label: "Not this path", tone: "muted" });
    case "concierge_setup":
      if (status === "pending_profile") return { label: "Blocked", tone: "waiting" };
      if (status === "requested") return { label: "Ready for setup", tone: "active" };
      if (status === "scheduled") return { label: "Scheduled", tone: "scheduled" };
      if (["live", "ended"].includes(status)) return { label: "Complete", tone: "sent" };
      return { label: status, tone: "muted" };
    case "campaign_launched":
      if (sent) return sent;
      if (request.launched_email_scheduled_at) {
        return {
          label:
            new Date(request.launched_email_scheduled_at).getTime() <= now
              ? "Send overdue"
              : "Scheduled",
          detail: formatAdBoostScheduledTime(request.launched_email_scheduled_at, now),
          tone:
            new Date(request.launched_email_scheduled_at).getTime() <= now
              ? "waiting"
              : "scheduled",
        };
      }
      if (["live", "ended"].includes(status)) return { label: "Not recorded", tone: "waiting" };
      return { label: "Not due", tone: "muted" };
    case "traction":
      if (sent) return sent;
      if (status === "live" && ((request.ad_clicks ?? 0) > 0 || (request.ad_spend_cents ?? 0) > 0)) {
        return { label: "Send unconfirmed", detail: "metrics are live", tone: "waiting" };
      }
      if (status === "live") return { label: "Watching metrics", tone: "active" };
      if (status === "ended") return { label: "Skipped", tone: "muted" };
      return { label: "Not due", tone: "muted" };
    case "lead_delivered": {
      const leadCount = options.leadCount ?? request.delivered ?? 0;
      const sentCount = sent?.sentCount ?? 0;
      if (leadCount > sentCount) {
        return {
          label: sentCount > 0 ? `${sentCount}/${leadCount} sent` : "Email unconfirmed",
          detail: `${leadCount} attributed lead${leadCount === 1 ? "" : "s"}`,
          tone: "waiting",
          sentAt: sent?.sentAt,
          sentCount,
        };
      }
      if (sent) return sent;
      return ["live", "ended"].includes(status)
        ? { label: "No attributed leads", tone: "muted" }
        : { label: "Not due", tone: "muted" };
    }
    case "lead_outcome":
      if (sent) {
        return {
          ...sent,
          detail: `${options.unresolvedOutcomes ?? 0} unresolved`,
        };
      }
      return (options.leadCount ?? request.delivered ?? 0) > 0 && ["live", "ended"].includes(status)
        ? { label: "Watching lead age", detail: "7d / 21d", tone: "active" }
        : { label: "Not due", tone: "muted" };
    case "promo_complete":
      if (sent) return sent;
      if (status === "live") return { label: "Campaign in flight", tone: "active" };
      if (status === "ended") return { label: "Send unconfirmed", tone: "waiting" };
      return { label: "Not due", tone: "muted" };
    case "plan_decision":
      if (request.plan_status) {
        return {
          label: request.plan_status.replace("_", " "),
          tone: request.plan_status === "active" ? "sent" : "waiting",
        };
      }
      if (
        (request.delivered ?? 0) >= 3 ||
        sentInfoForType(request, communications, "ad_boost_promo_complete").lastSentAt
      ) {
        return { label: "Decision open", tone: "active" };
      }
      return { label: "Value gate closed", tone: "muted" };
    default:
      return { label: "Not due", tone: "muted" };
  }
}

export function getAdBoostJourneyStates(
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[] = [],
  options: { leadCount?: number; unresolvedOutcomes?: number; now?: number } = {},
): AdBoostJourneyState[] {
  return AD_BOOST_PROVIDER_JOURNEY.steps.map((step) => ({
    step,
    state: getAdBoostStepState(step, request, communications, options),
  }));
}

export function getAdBoostLastContact(
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[] = [],
): { label: string; sentAt: string; emailType: string } | null {
  const candidates = AD_BOOST_PROVIDER_JOURNEY.steps.flatMap((step) => {
    if (!step.emailType) return [];
    const info = sentInfoForType(request, communications, step.emailType);
    return info.lastSentAt
      ? [{
          label: step.title,
          sentAt: info.lastSentAt,
          emailType: step.emailType,
        }]
      : [];
  });
  return candidates.sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
  )[0] ?? null;
}

/** Count resolved sends once per email type. This includes older sends that
 * only have an idempotency marker as well as canonical email-log records.
 */
export function getAdBoostRecordedSendCount(
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[] = [],
): number {
  const emailTypes = new Set(
    AD_BOOST_PROVIDER_JOURNEY.steps.flatMap((step) => step.emailType ? [step.emailType] : []),
  );
  return [...emailTypes].reduce(
    (total, emailType) => total + sentInfoForType(request, communications, emailType).count,
    0,
  );
}

export function getAdBoostNextAction(
  request: AdBoostCommunicationRequest,
  communications: AdBoostCommunicationRecord[] = [],
  options: { leadCount?: number; unresolvedOutcomes?: number; now?: number } = {},
): AdBoostNextAction {
  const now = options.now ?? Date.now();
  const states = new Map(
    getAdBoostJourneyStates(request, communications, { ...options, now }).map(({ step, state }) => [
      step.key,
      state,
    ]),
  );
  const state = (key: string) => states.get(key)!;

  if (request.deleted_at) {
    return { label: "Archived", detail: "No active next action", level: "done", priority: 95 };
  }

  if (request.status === "pending_profile") {
    const reminder = state("profile_reminder");
    if (reminder.label === "Due now") {
      return { label: "Profile reminder due", detail: "Blocked for 48+ hours", level: "attention", stepKey: "profile_reminder", priority: 10 };
    }
    return { label: "Waiting on provider", detail: reminder.detail ?? "Profile gate", level: "waiting", stepKey: "profile_reminder", priority: 40 };
  }

  if (request.status === "requested") {
    return { label: "Start concierge setup", detail: "Provider is launch-ready", level: "attention", stepKey: "concierge_setup", priority: 15 };
  }

  if (request.status === "scheduled") {
    const setupAt = new Date(`${request.requested_setup_week}T23:59:59`).getTime();
    return setupAt < now
      ? { label: "Launch date passed", detail: "Confirm or reschedule", level: "attention", stepKey: "concierge_setup", priority: 12 }
      : { label: "Prepare scheduled launch", detail: request.requested_setup_week, level: "waiting", stepKey: "concierge_setup", priority: 35 };
  }

  const launch = state("campaign_launched");
  if (["live", "ended"].includes(request.status) && launch.tone === "waiting") {
    return {
      label: launch.label === "Send overdue" ? "Launch email overdue" : "Verify launch email",
      detail: launch.detail ?? "No successful send recorded",
      level: "attention",
      stepKey: "campaign_launched",
      priority: 5,
    };
  }

  const leadDelivery = state("lead_delivered");
  if (leadDelivery.tone === "waiting") {
    return { label: "Verify lead email", detail: leadDelivery.detail ?? "Delivery mismatch", level: "attention", stepKey: "lead_delivered", priority: 8 };
  }

  if (request.status === "ended") {
    const wrap = state("promo_complete");
    if (wrap.tone === "waiting") {
      return { label: "Send campaign wrap-up", detail: "Campaign has ended", level: "attention", stepKey: "promo_complete", priority: 7 };
    }
    return { label: "Campaign complete", detail: "Wrap-up recorded", level: "done", stepKey: "promo_complete", priority: 80 };
  }

  if (request.status === "live") {
    const traction = state("traction");
    if (traction.tone === "waiting") {
      return { label: "Verify traction update", detail: traction.detail ?? "Metrics are live", level: "attention", stepKey: "traction", priority: 9 };
    }
    if ((options.leadCount ?? request.delivered ?? 0) > 0) {
      return { label: "Watch lead outcomes", detail: "Checks run around day 7 and 21", level: "healthy", stepKey: "lead_outcome", priority: 55 };
    }
    return { label: "Campaign in flight", detail: "Watching for traction", level: "healthy", stepKey: "traction", priority: 60 };
  }

  if (request.status === "cancelled") {
    return { label: "No next message", detail: "Campaign cancelled", level: "done", priority: 90 };
  }

  return { label: "Review campaign", detail: "Next step is unclear", level: "waiting", priority: 70 };
}
