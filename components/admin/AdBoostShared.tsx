// Shared types + presentation helpers for the Ad Boost concierge surfaces
// (the list at /admin/ad-boost and the per-campaign detail at
// /admin/ad-boost/[id]). Kept in one place so both render status, channel, and
// dates identically.

import type { AdBoostCommunicationSummary } from "@/lib/ad-boost/admin-communications";

export interface CampaignRequest {
  id: string;
  provider_id: string;
  provider_slug: string | null;
  display_name: string | null;
  requested_setup_week: string;
  completeness_at_submit: number | null;
  status: string;
  channel: string | null;
  /** Provider-chosen intended monthly ad budget in whole USD (non-binding —
   *  concierge confirms before spend). NULL = not chosen / legacy request. */
  intended_monthly_budget: number | null;
  campaign_tag: string | null;
  /** Last serving day of the ad flight (admin-entered from the ad platform).
   *  Null = not entered; the queue then shows only the setup week. */
  flight_end_date: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  /** Set when the request has been soft-deleted (archived); null when live. */
  deleted_at: string | null;
  /** Manual ad-platform metrics, entered by the operator on the detail page. */
  ad_spend_cents: number | null;
  ad_clicks: number | null;
  ad_impressions: number | null;
  /** Idempotency markers for request/readiness messages. A value means the
   *  provider communication completed successfully. */
  queued_email_sent_at?: string | null;
  requested_email_sent_at?: string | null;
  profile_reminder_email_sent_at?: string | null;
  promotion_email_sent_at?: string | null;
  /** Human-reviewed landing-page photo gate for paid traffic. */
  photo_readiness_status: "unreviewed" | "update_requested" | "review_requested" | "ready";
  photo_review_note?: string | null;
  photo_reviewed_at?: string | null;
  photo_reviewed_by?: string | null;
  photo_update_requested_at?: string | null;
  photo_update_submitted_at?: string | null;
  photo_nudge_email_sent_at?: string | null;
  photo_reminder_email_sent_at?: string | null;
  photo_ready_email_sent_at?: string | null;
  /** When the campaign-launched provider email actually went out. NULL on
   *  pre-launch rows, and on live rows whose email is scheduled or failed. */
  launched_email_sent_at?: string | null;
  /** Optional future send time for the launched email (UTC; picked as US
   *  Eastern in the detail page). NULL = send immediately on the live flip. */
  launched_email_scheduled_at?: string | null;
  traction_email_sent_at?: string | null;
  promo_complete_email_sent_at?: string | null;
  /** When the wrap-up email is due to go out (UTC; a 10:15 AM ET business
   *  morning). Set on the flip to `ended`, cleared once it sends. */
  promo_complete_email_scheduled_at?: string | null;
  /** When the campaign moved to `ended`, and by whom: `admin` (a concierge
   *  flipped it) or `flight_end` (the cron, the morning after the last
   *  serving day). NULL on rows that ended before these were tracked. */
  ended_at?: string | null;
  ended_reason?: "admin" | "flight_end" | null;
  /** Provider's own answer for the whole flight, captured one-tap from the
   *  zero-lead wrap-up: did any family reach them outside Olera. NULL = never
   *  answered, which is NOT the same as an answer of "no". */
  provider_reported_outcome?: "client" | "talking" | "no" | null;
  provider_reported_outcome_at?: string | null;
  /** Paid plan lifecycle from Stripe (Phase 2). NULL = never subscribed. */
  plan_status?: "active" | "past_due" | "canceled" | null;
  /** Subscribed monthly plan in whole USD (150/300/600). */
  plan_value?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscribed_at?: string | null;
  /** Ad clicks that landed: session-deduped page_views tagged with this
   *  campaign's managed UTM. The delivery half of the funnel next to
   *  `delivered` (conversions). */
  ad_landings?: number;
  /** Families delivered so far (campaign-attributed conversions across the
   *  inquiry + benefits funnels). Attached by the list + detail API branches. */
  delivered?: number;
  /** Questions received since launch (manageable only — archived/rejected
   *  excluded). Attached by the list API branch; 0 pre-launch. */
  questions_received?: number;
  /** Successful Ad Boost sends summarized by type for queue-level next-action
   *  decisions. This reconciles legacy email logs with marker columns. */
  communication_summary?: AdBoostCommunicationSummary;
}

/** A real Ad Boost communication associated with one campaign request. */
export interface CampaignCommunication {
  id: string;
  email_type: string;
  subject: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  bounced_at?: string | null;
  error_message?: string | null;
  metadata: Record<string, unknown> | null;
}

/** One delivered family behind a campaign — no PHI, just context. Mirrors
 *  CampaignLead in lib/ad-boost/delivered.server (kept client-safe here). */
export interface CampaignLead {
  created_at: string;
  careNeed: string | null;
  state: string | null;
  entrySource: string | null;
  connectionId?: string | null;
  /** Provider one-tap self-report: did this family become a client? */
  outcome?: "client" | "talking" | "no" | null;
}

export const STATUSES = ["pending_profile", "requested", "scheduled", "live", "ended", "cancelled"];
export const CHANNELS = ["", "google", "meta", "both"];

export const STATUS_LABELS: Record<string, string> = {
  pending_profile: "Waiting on provider",
  requested: "Requested",
  scheduled: "Scheduled",
  live: "Live",
  ended: "Ended",
  cancelled: "Cancelled",
};

/** Human label for a channel value, or null when unset. */
export function channelLabel(channel: string | null): string | null {
  if (channel === "google") return "Google";
  if (channel === "meta") return "Meta";
  if (channel === "both") return "Google + Meta";
  return null;
}

/** Format a YYYY-MM-DD date-only string as "Jun 22, 2026" WITHOUT a timezone
 *  shift. `new Date("2026-06-22")` parses as UTC midnight, so in US timezones it
 *  would render a day early — parse the parts as local instead. */
export function fmtDateOnly(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a full timestamp as "Jun 16, 2026". */
export function fmtTimestamp(ts: string): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Build the canonical managed-ads landing URL with UTM attribution params. */
export function utmUrl(slug: string | null, tag: string | null, id: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://olera.care";
  const campaign = tag || id;
  return `${origin}/provider/${slug ?? ""}?utm_source=olera_managed&utm_campaign=${campaign}`;
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    // Queued under 70% — not yet actionable; auto-promotes to `requested` when
    // the provider crosses the threshold. Muted so the queue reads at a glance.
    pending_profile: "bg-orange-50 text-orange-600",
    requested: "bg-amber-50 text-amber-700",
    scheduled: "bg-blue-50 text-blue-700",
    live: "bg-green-50 text-green-700",
    ended: "bg-gray-100 text-gray-500",
    cancelled: "bg-gray-100 text-gray-400",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone[status] ?? "bg-gray-100 text-gray-600"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export const PHOTO_READINESS_LABELS: Record<CampaignRequest["photo_readiness_status"], string> = {
  unreviewed: "Photos not reviewed",
  update_requested: "Waiting on photos",
  review_requested: "Photos updated",
  ready: "Photos ready",
};

export function PhotoReadinessBadge({
  status,
}: {
  status: CampaignRequest["photo_readiness_status"];
}) {
  const tone: Record<CampaignRequest["photo_readiness_status"], string> = {
    unreviewed: "bg-violet-50 text-violet-700",
    update_requested: "bg-amber-50 text-amber-700",
    review_requested: "bg-blue-50 text-blue-700",
    ready: "bg-emerald-50 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${tone[status]}`}>
      {PHOTO_READINESS_LABELS[status]}
    </span>
  );
}
