import { AD_BOOST_PROVIDER_JOURNEY, type JourneyStep } from "@/lib/family-comms/journey";
import { addBusinessDaysET } from "@/lib/business-day";

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
  updated_at?: string;
  requested_setup_week: string;
  flight_end_date?: string | null;
  delivered?: number;
  ad_clicks?: number | null;
  ad_spend_cents?: number | null;
  /** Session-deduped managed-UTM landings measured on the provider page,
   *  internal traffic excluded. Attached by both admin API branches. Unlike
   *  the operator-entered figures above, this never goes stale. */
  ad_landings?: number;
  queued_email_sent_at?: string | null;
  requested_email_sent_at?: string | null;
  profile_reminder_email_sent_at?: string | null;
  promotion_email_sent_at?: string | null;
  photo_readiness_status?: "unreviewed" | "update_requested" | "review_requested" | "ready";
  photo_update_requested_at?: string | null;
  photo_update_submitted_at?: string | null;
  photo_nudge_email_sent_at?: string | null;
  photo_reminder_email_sent_at?: string | null;
  photo_ready_email_sent_at?: string | null;
  launched_email_sent_at?: string | null;
  launched_email_scheduled_at?: string | null;
  traction_email_sent_at?: string | null;
  promo_complete_email_sent_at?: string | null;
  promo_complete_email_scheduled_at?: string | null;
  ended_at?: string | null;
  ended_reason?: "admin" | "flight_end" | null;
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
  ad_boost_photo_update: "photo_nudge_email_sent_at",
  ad_boost_photo_reminder: "photo_reminder_email_sent_at",
  ad_boost_photos_ready: "photo_ready_email_sent_at",
  ad_boost_campaign_launched: "launched_email_sent_at",
  ad_boost_traction: "traction_email_sent_at",
  ad_boost_promo_complete: "promo_complete_email_sent_at",
};

// Existing campaigns were audited and imported before communication-state
// monitoring shipped. In particular, the Aug 2 Google Ads sync wrote metrics
// directly to the database, bypassing the API path that sends traction mail.
// Treat those gaps as unknown history, not live incidents. Any campaign change
// after this baseline is held to the new successful-send invariant.
const COMMUNICATION_MONITORING_BASELINE_AT = Date.parse("2026-08-06T12:00:00Z");

function validTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) return null;
  return value;
}

function latestTimestamp(values: Array<string | null | undefined>): string | null {
  return values
    .filter((value): value is string => Boolean(validTimestamp(value)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}

function predatesCommunicationMonitoring(
  request: AdBoostCommunicationRequest,
  lifecycleAt?: string | null,
): boolean {
  // The automatic end worker updates older campaigns as it closes them. Using
  // updated_at universally would turn an untracked historical launch into a
  // brand-new launch-email incident merely because the flight ended today.
  const observedAt = validTimestamp(lifecycleAt) ?? validTimestamp(request.created_at);
  return observedAt
    ? new Date(observedAt).getTime() < COMMUNICATION_MONITORING_BASELINE_AT
    : false;
}

function historicalUnknownState(detail: string): AdBoostStepState {
  return {
    label: "Historical send unknown",
    detail,
    tone: "muted",
  };
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
    case "photo_review": {
      if (["live", "ended"].includes(status)) return { label: "Complete", tone: "sent" };
      if (request.photo_readiness_status === "ready") return { label: "Approved", tone: "sent" };
      if (request.photo_readiness_status === "update_requested") {
        return { label: "Blocked", detail: "waiting on provider photos", tone: "waiting" };
      }
      if (request.photo_readiness_status === "review_requested") {
        return { label: "Review updated photos", tone: "active" };
      }
      return ["requested", "scheduled"].includes(status)
        ? { label: "Needs review", detail: "paid-traffic gate", tone: "active" }
        : { label: "Not due", tone: "muted" };
    }
    case "photo_update_requested": {
      if (sent) return sent;
      if (["update_requested", "review_requested"].includes(request.photo_readiness_status ?? "")) {
        return { label: "Email missing", detail: "photo update was requested", tone: "waiting" };
      }
      return { label: "Not this path", tone: "muted" };
    }
    case "photo_update_reminder": {
      if (sent) return sent;
      if (request.photo_readiness_status !== "update_requested") {
        return { label: "Skipped", tone: "muted" };
      }
      const requestedAt = request.photo_update_requested_at ?? request.photo_nudge_email_sent_at;
      if (!requestedAt) return { label: "Waiting on first email", tone: "waiting" };
      const dueAt = addBusinessDaysET(new Date(requestedAt), 3);
      return dueAt.getTime() <= now
        ? { label: "Due now", detail: "three business days", tone: "waiting" }
        : {
            label: "Watching",
            detail: `due ${formatAdBoostScheduledTime(dueAt.toISOString(), now)}`,
            tone: "scheduled",
          };
    }
    case "photos_ready": {
      if (sent) return sent;
      if (
        request.photo_readiness_status === "ready" &&
        sentInfoForType(request, communications, "ad_boost_photo_update").lastSentAt
      ) {
        return { label: "Confirmation missing", tone: "waiting" };
      }
      if (request.photo_readiness_status === "review_requested") {
        return { label: "Waiting on review", tone: "active" };
      }
      return { label: "Not due", tone: "muted" };
    }
    case "concierge_setup":
      if (status === "pending_profile") return { label: "Blocked", tone: "waiting" };
      if (
        ["requested", "scheduled"].includes(status) &&
        request.photo_readiness_status !== "ready"
      ) {
        return { label: "Blocked", detail: "photo gate", tone: "waiting" };
      }
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
      if (["live", "ended"].includes(status)) {
        return predatesCommunicationMonitoring(request)
          ? historicalUnknownState("older campaign—delivery was not tracked")
          : {
              label: "Launch email missing",
              detail: "no successful send found",
              tone: "waiting",
            };
      }
      return { label: "Not due", tone: "muted" };
    case "traction":
      if (sent) return sent;
      // Measured landings are traction even when nobody has typed the ad
      // platform's numbers in yet — otherwise a delivering campaign sits on
      // "Watching metrics" indefinitely (Rosemonte: 10 landings, typed 0).
      if (
        status === "live" &&
        ((request.ad_clicks ?? 0) > 0 ||
          (request.ad_spend_cents ?? 0) > 0 ||
          (request.ad_landings ?? 0) > 0)
      ) {
        return predatesCommunicationMonitoring(request, request.updated_at)
          ? historicalUnknownState("metrics were imported outside the email trigger")
          : {
              label: "Traction email missing",
              detail: "activity is recorded; no successful send found",
              tone: "waiting",
            };
      }
      if (status === "live") return { label: "Watching metrics", tone: "active" };
      if (status === "ended") return { label: "Skipped", tone: "muted" };
      return { label: "Not due", tone: "muted" };
    case "lead_delivered": {
      const leadCount = options.leadCount ?? request.delivered ?? 0;
      const sentCount = sent?.sentCount ?? 0;
      if (leadCount > sentCount) {
        if (predatesCommunicationMonitoring(request)) {
          return historicalUnknownState("older leads—delivery was not tracked");
        }
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
      if (request.promo_complete_email_scheduled_at) {
        const scheduledAt = new Date(request.promo_complete_email_scheduled_at).getTime();
        const overdue = scheduledAt <= now;
        return {
          label: overdue ? "Send overdue" : "Scheduled",
          detail: formatAdBoostScheduledTime(request.promo_complete_email_scheduled_at, now),
          tone: overdue ? "waiting" : "scheduled",
        };
      }
      if (status === "live") return { label: "Campaign in flight", tone: "active" };
      if (status === "ended") {
        return predatesCommunicationMonitoring(request, request.ended_at)
          ? historicalUnknownState("older campaign—delivery was not tracked")
          : {
              label: "Wrap-up email missing",
              detail: "campaign ended; no successful send found",
              tone: "waiting",
            };
      }
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

  if (["requested", "scheduled"].includes(request.status)) {
    const photoStatus = request.photo_readiness_status ?? "unreviewed";
    if (photoStatus === "unreviewed") {
      return { label: "Review campaign photos", detail: "Paid-traffic gate not reviewed", level: "attention", stepKey: "photo_review", priority: 4 };
    }
    if (photoStatus === "review_requested") {
      return { label: "Review updated photos", detail: "Provider saved a new gallery", level: "attention", stepKey: "photos_ready", priority: 4 };
    }
    if (photoStatus === "update_requested") {
      const requestEmail = state("photo_update_requested");
      if (requestEmail.tone === "waiting") {
        return { label: "Photo email missing", detail: requestEmail.detail ?? "No successful send recorded", level: "attention", stepKey: "photo_update_requested", priority: 3 };
      }
      const reminder = state("photo_update_reminder");
      return {
        label: reminder.label === "Due now" ? "Photo reminder due" : "Waiting on photo update",
        detail: reminder.detail ?? "Provider request is saved",
        level: reminder.label === "Due now" ? "attention" : "waiting",
        stepKey: "photo_update_reminder",
        priority: reminder.label === "Due now" ? 11 : 35,
      };
    }
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
      label: launch.label === "Send overdue" ? "Launch email overdue" : "Launch email missing",
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
    if (wrap.tone === "scheduled") {
      return {
        label: "Wrap-up scheduled",
        detail: wrap.detail ?? "Next provider-friendly business window",
        level: "waiting",
        stepKey: "promo_complete",
        priority: 45,
      };
    }
    if (wrap.tone === "waiting") {
      return {
        label: wrap.label === "Send overdue" ? "Wrap-up overdue" : "Schedule campaign wrap-up",
        detail: wrap.detail ?? "Campaign ended without a successful send",
        level: "attention",
        stepKey: "promo_complete",
        priority: 7,
      };
    }
    return {
      label: "Campaign complete",
      detail:
        wrap.label === "Historical send unknown"
          ? "Wrap-up email history unavailable"
          : "Wrap-up recorded",
      level: "done",
      stepKey: "promo_complete",
      priority: 80,
    };
  }

  if (request.status === "live") {
    const traction = state("traction");
    if (traction.tone === "waiting") {
      return { label: "Traction email missing", detail: traction.detail ?? "No successful send found", level: "attention", stepKey: "traction", priority: 9 };
    }
    if (traction.label === "Historical send unknown") {
      return {
        label: "Campaign in flight",
        detail: "Traction email history unavailable",
        level: "healthy",
        stepKey: "traction",
        priority: 60,
      };
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
