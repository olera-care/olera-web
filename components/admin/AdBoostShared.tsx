// Shared types + presentation helpers for the Ad Boost concierge surfaces
// (the list at /admin/ad-boost and the per-campaign detail at
// /admin/ad-boost/[id]). Kept in one place so both render status, channel, and
// dates identically.

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
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  /** Set when the request has been soft-deleted (archived); null when live. */
  deleted_at: string | null;
  /** Manual ad-platform metrics, entered by the operator on the detail page. */
  ad_spend_cents: number | null;
  ad_clicks: number | null;
  /** Paid plan lifecycle from Stripe (Phase 2). NULL = never subscribed. */
  plan_status?: "active" | "past_due" | "canceled" | null;
  /** Subscribed monthly plan in whole USD (150/300/600). */
  plan_value?: number | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscribed_at?: string | null;
  /** Families delivered so far (campaign-attributed conversions across the
   *  inquiry + benefits funnels). Attached by the list + detail API branches. */
  delivered?: number;
}

/** One delivered family behind a campaign — no PHI, just context. Mirrors
 *  CampaignLead in lib/ad-boost/delivered.server (kept client-safe here). */
export interface CampaignLead {
  created_at: string;
  careNeed: string | null;
  state: string | null;
  entrySource: string | null;
}

export const STATUSES = ["pending_profile", "requested", "scheduled", "live", "ended", "cancelled"];
export const CHANNELS = ["", "google", "meta", "both"];

export const STATUS_LABELS: Record<string, string> = {
  pending_profile: "Queued",
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
