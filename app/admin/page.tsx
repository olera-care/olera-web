"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import DateRangePopover, {
  dateRangeSearchParams,
  rangeLabel,
  resolveRange,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import { useUrlDateRangeState } from "@/hooks/useUrlDateRangeState";

const DEFAULT_ACTIVITY_RANGE: DateRangeValue = {
  preset: "30d",
  customFrom: "",
  customTo: "",
};

type StatValue = number | null | undefined;

interface StatCard {
  label: string;
  /** null = loading, undefined = failed, number = loaded */
  value: StatValue;
  subtitle: string;
  href: string;
  isWarning?: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
  admin_email?: string;
}

/** Fetch a count from an admin API endpoint */
async function fetchCount(url: string, key = "count", signal?: AbortSignal): Promise<number> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`${url} failed`);
  const data = await res.json();
  return data[key] ?? 0;
}

export default function AdminOverviewPage() {
  const [activityRange, setActivityRange] = useUrlDateRangeState(DEFAULT_ACTIVITY_RANGE);
  // Each stat loads independently — no more Promise.all blocking
  const [unverifiedClaims, setUnverifiedClaims] = useState<StatValue>(null);
  const [totalInquiries, setTotalInquiries] = useState<StatValue>(null);
  const [needsEmail, setNeedsEmail] = useState<StatValue>(null);
  const [totalQuestions, setTotalQuestions] = useState<StatValue>(null);
  const [questionsNeedEmail, setQuestionsNeedEmail] = useState<StatValue>(null);
  const [totalReviews, setTotalReviews] = useState<StatValue>(null);
  const [providerPageViews, setProviderPageViews] = useState<StatValue>(null);
  const [leadsReceived, setLeadsReceived] = useState<StatValue>(null);
  const [benefitsRequested, setBenefitsRequested] = useState<StatValue>(null);
  const [providerAccountsClaimed, setProviderAccountsClaimed] = useState<StatValue>(null);
  const [liveProviders, setLiveProviders] = useState<StatValue>(null);
  const [adBoostProviders, setAdBoostProviders] = useState<StatValue>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[] | null>(null);
  const [pausedAutomations, setPausedAutomations] = useState<number>(0);

  useEffect(() => {
    // Current-state metrics do not change meaning when the activity range changes.
    fetch("/api/admin/verification?counts_only=true")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("verification counts failed")))
      .then((d) => setUnverifiedClaims(d?.counts?.unverified_claims ?? 0))
      .catch(() => setUnverifiedClaims(undefined));

    // Needs Email is a current backlog, not a period total.
    fetch("/api/admin/connections?count_only=true")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("connections counts failed")))
      .then((d) => setNeedsEmail(d?.engagementCounts?.needs_email ?? 0))
      .catch(() => setNeedsEmail(undefined));

    fetchCount("/api/admin/questions?needs_email=true&count_only=true")
      .then(setQuestionsNeedEmail)
      .catch(() => setQuestionsNeedEmail(undefined));

    fetchCount("/api/admin/directory?tab=published&count_only=true", "total")
      .then(setLiveProviders)
      .catch(() => setLiveProviders(undefined));

    // Current Ad Boost cohort — distinct providers queued, active, or paying.
    fetch("/api/admin/ad-boost?program_count_only=true")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("ad-boost program count failed"))))
      .then((d) => setAdBoostProviders(d?.providers ?? 0))
      .catch(() => setAdBoostProviders(undefined));

    // Audit log
    fetch("/api/admin/audit?limit=10")
      .then((r) => r.ok ? r.json() : { entries: [] })
      .then((d) => setAuditLog(d.entries ?? []))
      .catch(() => setAuditLog([]));

    // Paused-automations guard — surfaces here so a forgotten pause can't hide.
    fetch("/api/admin/automations")
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => setPausedAutomations((d.jobs ?? []).filter((j: { paused?: boolean }) => j.paused).length))
      .catch(() => setPausedAutomations(0));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { from, to } = resolveRange(activityRange);

    setTotalQuestions(null);
    setTotalInquiries(null);
    setTotalReviews(null);
    setProviderPageViews(null);
    setLeadsReceived(null);
    setBenefitsRequested(null);
    setProviderAccountsClaimed(null);

    const questionParams = new URLSearchParams({ count_only: "true" });
    const connectionParams = new URLSearchParams({ submitted_count_only: "true" });
    const reviewParams = new URLSearchParams({ status: "all", limit: "1" });
    if (from) {
      questionParams.set("date_from", from);
      connectionParams.set("date_from", from);
      reviewParams.set("from_date", from);
    }
    if (to) {
      questionParams.set("date_to", to);
      connectionParams.set("date_to", to);
      reviewParams.set("to_date", to);
    }

    fetchCount(`/api/admin/questions?${questionParams}`, "count", controller.signal)
      .then(setTotalQuestions)
      .catch((fetchError: unknown) => {
        if ((fetchError as Error)?.name === "AbortError") return;
        setTotalQuestions(undefined);
      });

    fetch(`/api/admin/connections?${connectionParams}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("connections counts failed")))
      .then((data) => setTotalInquiries(data?.total ?? 0))
      .catch((fetchError: unknown) => {
        if ((fetchError as Error)?.name === "AbortError") return;
        setTotalInquiries(undefined);
      });

    fetchCount(`/api/admin/reviews?${reviewParams}`, "count", controller.signal)
      .then(setTotalReviews)
      .catch((fetchError: unknown) => {
        if ((fetchError as Error)?.name === "AbortError") return;
        setTotalReviews(undefined);
      });

    const networkHealthParams = new URLSearchParams();
    if (from) networkHealthParams.set("date_from", from);
    if (to) networkHealthParams.set("date_to", to);
    fetch(`/api/admin/network-health?${networkHealthParams}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("network health failed")))
      .then((data) => {
        setProviderPageViews(data?.providerPageViews ?? 0);
        setLeadsReceived(data?.leadsReceived ?? 0);
        setBenefitsRequested(data?.benefitsRequested ?? 0);
        setProviderAccountsClaimed(data?.providerAccountsClaimed ?? 0);
      })
      .catch((fetchError: unknown) => {
        if ((fetchError as Error)?.name === "AbortError") return;
        setProviderPageViews(undefined);
        setLeadsReceived(undefined);
        setBenefitsRequested(undefined);
        setProviderAccountsClaimed(undefined);
      });

    return () => controller.abort();
  }, [activityRange]);

  const selectedRangeLabel = rangeLabel(activityRange);

  function activityHref(path: string, extra?: Record<string, string>) {
    const params = dateRangeSearchParams(activityRange);
    for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value);
    return `${path}?${params}`;
  }

  // Analytics predates the shared admin range convention and still calls its
  // preset key `preset`; translate it without losing custom boundaries.
  function analyticsHref() {
    const params = dateRangeSearchParams(activityRange);
    const preset = params.get("range") ?? activityRange.preset;
    params.delete("range");
    params.set("preset", preset);
    return `/admin/analytics?${params}`;
  }

  const activityCards: StatCard[] = [
    {
      label: "Provider Page Views",
      value: providerPageViews,
      subtitle: `Public profile loads · ${selectedRangeLabel}`,
      href: analyticsHref(),
    },
    {
      label: "Questions asked",
      value: totalQuestions,
      subtitle: `Every submission · ${selectedRangeLabel}`,
      href: activityHref("/admin/questions", { tab: "all" }),
    },
    {
      label: "Total Inquiries",
      value: totalInquiries,
      subtitle: `Connections · ${selectedRangeLabel}`,
      href: activityHref("/admin/connections", { filter: "all" }),
    },
    {
      label: "Reviews received",
      value: totalReviews,
      subtitle: `Submitted · ${selectedRangeLabel}`,
      href: activityHref("/admin/reviews"),
    },
    {
      label: "Leads Received",
      value: leadsReceived,
      subtitle: `Inquiries + Q&A captures · ${selectedRangeLabel}`,
      href: analyticsHref(),
    },
    {
      label: "Benefits Requested",
      value: benefitsRequested,
      subtitle: `Completed benefits intakes · ${selectedRangeLabel}`,
      href: activityHref("/admin/benefits"),
    },
    {
      label: "Provider Accounts Claimed",
      value: providerAccountsClaimed,
      subtitle: `New claims · ${selectedRangeLabel}`,
      href: analyticsHref(),
    },
  ];

  const hasUnavailableStats = [
    totalQuestions,
    totalInquiries,
    totalReviews,
    providerPageViews,
    leadsReceived,
    benefitsRequested,
    providerAccountsClaimed,
    adBoostProviders,
    unverifiedClaims,
    needsEmail,
    questionsNeedEmail,
    liveProviders,
  ].some((value) => value === undefined);

  const currentCards: StatCard[] = [
    {
      label: "Ad Boost Providers",
      value: adBoostProviders,
      subtitle: "Queued or currently active",
      href: "/admin/ad-boost",
    },
    { label: "Unverified Claims", value: unverifiedClaims, subtitle: "Claimed, not yet verified", href: "/admin/verification" },
    { label: "Needs Email", value: needsEmail, subtitle: "Connections needing email", href: "/admin/connections?filter=needs_email", isWarning: true },
    { label: "Q&A Needs Email", value: questionsNeedEmail, subtitle: "Questions blocked", href: "/admin/questions", isWarning: true },
    { label: "Provider Directory", value: liveProviders, subtitle: "Live listings", href: "/admin/directory" },
  ];

  function renderCard(card: StatCard) {
    const showWarning = card.isWarning && typeof card.value === "number" && card.value > 0;
    return (
      <Link key={card.label} href={card.href} className="block">
        <div
          className={[
            "p-5 rounded-xl border transition-colors",
            showWarning
              ? "bg-amber-50 border-amber-200 hover:border-amber-300"
              : "bg-white border-gray-200 hover:border-gray-300",
          ].join(" ")}
        >
          <p className="text-[13px] text-gray-500 mb-1">{card.label}</p>
          {card.value === null ? (
            <div className="h-9 flex items-center">
              <div className="w-12 h-6 bg-gray-100 rounded animate-pulse" />
            </div>
          ) : card.value === undefined ? (
            <p className="text-lg font-medium text-gray-400 mb-1">Unavailable</p>
          ) : (
            <p
              className={[
                "text-2xl font-semibold mb-1",
                showWarning ? "text-amber-600" : "text-gray-900",
              ].join(" ")}
            >
              {card.value.toLocaleString()}
            </p>
          )}
          <p className="text-[13px] text-gray-400">{card.subtitle}</p>
        </div>
      </Link>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
      </div>

      {pausedAutomations > 0 && (
        <Link href="/admin/automations" className="block mb-6">
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:border-amber-400">
            ⚠️ {pausedAutomations} automation{pausedAutomations === 1 ? "" : "s"} paused — view Automations
          </div>
        </Link>
      )}

      {hasUnavailableStats && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          Some data failed to load. Unavailable cards are not reported as zero.
        </div>
      )}

      {/* Period-based activity metrics */}
      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Activity</h2>
            <p className="text-sm text-gray-400 mt-0.5">Reporting in Central Time</p>
          </div>
          <DateRangePopover value={activityRange} onChange={setActivityRange} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {activityCards.map((card) => renderCard(card))}
        </div>
      </section>

      {/* Current-state metrics intentionally do not follow the activity filter. */}
      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">Current operations</h2>
          <p className="text-sm text-gray-400 mt-0.5">Live totals and action queues right now</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentCards.map((card) => renderCard(card))}
        </div>
      </section>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-3">
          Recent Activity
        </h2>
        {auditLog === null ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <div className="w-48 h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="w-32 h-3 bg-gray-50 rounded animate-pulse" />
                  </div>
                  <div className="w-24 h-6 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : auditLog.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No activity yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {auditLog.map((entry) => (
              <div key={entry.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-gray-900">
                    {formatAction(entry.action, entry.target_type)}
                  </p>
                  <p className="text-[13px] text-gray-400">
                    {entry.admin_email ?? "Unknown"} &middot; {formatDate(entry.created_at)}
                  </p>
                </div>
                <Badge variant={getActionBadgeVariant(entry.action)}>
                  {entry.action}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatAction(action: string, targetType: string): string {
  const actionLabels: Record<string, string> = {
    approve_provider: "Approved a provider",
    reject_provider: "Rejected a provider",
    approve_review: "Published a review",
    reject_review: "Rejected a review",
    remove_review: "Removed a review",
    add_admin: "Added an admin",
    remove_admin: "Removed an admin",
    update_directory_provider: "Updated a directory provider",
    delete_image: "Deleted a provider image",
    deferred_lead_emails_sent: "Sent deferred lead emails",
    add_provider_email_via_questions: "Added provider email via Q&A",
  };
  return actionLabels[action] ?? `${action} on ${targetType}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getActionBadgeVariant(action: string): "verified" | "pending" | "default" {
  if (action.includes("approve")) return "verified";
  if (action.includes("reject")) return "pending";
  return "default";
}
