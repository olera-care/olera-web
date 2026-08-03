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

const PRIMARY_ACTIVITY_CARD_COUNT = 4;

type StatValue = number | null | undefined;

interface StatCard {
  label: string;
  /** null = loading, undefined = failed, number = loaded */
  value: StatValue;
  displayValue?: string;
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
  const [needsEmail, setNeedsEmail] = useState<StatValue>(null);
  const [totalQuestions, setTotalQuestions] = useState<StatValue>(null);
  const [questionsNeedEmail, setQuestionsNeedEmail] = useState<StatValue>(null);
  const [totalReviews, setTotalReviews] = useState<StatValue>(null);
  const [providerPageViews, setProviderPageViews] = useState<StatValue>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState<StatValue>(null);
  const [questionAnswerRate, setQuestionAnswerRate] = useState<StatValue>(null);
  const [meaningfullyActiveProviders, setMeaningfullyActiveProviders] = useState<StatValue>(null);
  const [leadsReceived, setLeadsReceived] = useState<StatValue>(null);
  const [benefitsRequested, setBenefitsRequested] = useState<StatValue>(null);
  const [providerAccountsClaimed, setProviderAccountsClaimed] = useState<StatValue>(null);
  const [emailClicks, setEmailClicks] = useState<StatValue>(null);
  const [textMessagesReceived, setTextMessagesReceived] = useState<StatValue>(null);
  const [referralSourcesReviewed, setReferralSourcesReviewed] = useState<StatValue>(null);
  const [referralCallsStarted, setReferralCallsStarted] = useState<StatValue>(null);
  const [referralPartnersGained, setReferralPartnersGained] = useState<StatValue>(null);
  const [liveProviders, setLiveProviders] = useState<StatValue>(null);
  const [adBoostProviders, setAdBoostProviders] = useState<StatValue>(null);
  const [activeCareRequests, setActiveCareRequests] = useState<StatValue>(null);
  const [careRequestsReached, setCareRequestsReached] = useState<StatValue>(null);
  const [careRequestReachRate, setCareRequestReachRate] = useState<StatValue>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[] | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
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

    fetch("/api/admin/marketplace-health")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("marketplace health failed"))))
      .then((d) => {
        setActiveCareRequests(d?.activeCareRequests ?? 0);
        setCareRequestsReached(d?.careRequestsReached ?? 0);
        setCareRequestReachRate(d?.careRequestReachRate ?? 0);
      })
      .catch(() => {
        setActiveCareRequests(undefined);
        setCareRequestsReached(undefined);
        setCareRequestReachRate(undefined);
      });

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
    setTotalReviews(null);
    setProviderPageViews(null);
    setQuestionsAnswered(null);
    setQuestionAnswerRate(null);
    setMeaningfullyActiveProviders(null);
    setLeadsReceived(null);
    setBenefitsRequested(null);
    setProviderAccountsClaimed(null);
    setEmailClicks(null);
    setTextMessagesReceived(null);
    setReferralSourcesReviewed(null);
    setReferralCallsStarted(null);
    setReferralPartnersGained(null);

    const networkHealthParams = new URLSearchParams();
    if (from) networkHealthParams.set("date_from", from);
    if (to) networkHealthParams.set("date_to", to);
    fetch(`/api/admin/network-health?${networkHealthParams}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("network health failed")))
      .then((data) => {
        setProviderPageViews(data?.providerPageViews ?? 0);
        setTotalQuestions(data?.questionsAsked ?? 0);
        setQuestionsAnswered(data?.questionsAnswered ?? 0);
        setQuestionAnswerRate(data?.questionAnswerRate ?? 0);
        setMeaningfullyActiveProviders(data?.meaningfullyActiveProviders ?? 0);
        setLeadsReceived(data?.leadsReceived ?? 0);
        setBenefitsRequested(data?.benefitsRequested ?? 0);
        setProviderAccountsClaimed(data?.providerAccountsClaimed ?? 0);
        setEmailClicks(data?.emailClicks ?? 0);
        setTotalReviews(data?.reviewsReceived ?? 0);
        setReferralSourcesReviewed(data?.referralSourcesReviewed ?? 0);
        setReferralCallsStarted(data?.referralCallsStarted ?? 0);
        setReferralPartnersGained(data?.referralPartnersGained ?? 0);
      })
      .catch((fetchError: unknown) => {
        if ((fetchError as Error)?.name === "AbortError") return;
        setProviderPageViews(undefined);
        setTotalQuestions(undefined);
        setQuestionsAnswered(undefined);
        setQuestionAnswerRate(undefined);
        setMeaningfullyActiveProviders(undefined);
        setLeadsReceived(undefined);
        setBenefitsRequested(undefined);
        setProviderAccountsClaimed(undefined);
        setEmailClicks(undefined);
        setTotalReviews(undefined);
        setReferralSourcesReviewed(undefined);
        setReferralCallsStarted(undefined);
        setReferralPartnersGained(undefined);
      });

    const smsParams = new URLSearchParams({ count_only: "true" });
    if (from) smsParams.set("date_from", from);
    if (to) smsParams.set("date_to", to);
    if (!from && !to && activityRange.preset === "all") smsParams.set("all_time", "true");
    fetch(`/api/admin/family-comms-analytics/sms?${smsParams}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("SMS received count failed")))
      .then((data) => {
        if (data?.configured === false || data?.error || data?.truncated) {
          setTextMessagesReceived(undefined);
          return;
        }
        setTextMessagesReceived(data?.received ?? 0);
      })
      .catch((fetchError: unknown) => {
        if ((fetchError as Error)?.name === "AbortError") return;
        setTextMessagesReceived(undefined);
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
      label: "Questions asked",
      value: totalQuestions,
      subtitle: `Every submission · ${selectedRangeLabel}`,
      href: activityHref("/admin/questions", { tab: "all" }),
    },
    {
      label: "Leads Received",
      value: leadsReceived,
      subtitle: `Inquiries + Q&A captures · ${selectedRangeLabel}`,
      href: analyticsHref(),
    },
    {
      label: "Active Providers",
      value: meaningfullyActiveProviders,
      subtitle: `Took a meaningful platform action · ${selectedRangeLabel}`,
      href: activityHref("/admin/activity", { actor: "providers", view: "people" }),
    },
    {
      label: "Question Answer Rate",
      value: questionAnswerRate,
      displayValue: typeof questionAnswerRate === "number" ? `${questionAnswerRate.toLocaleString()}%` : undefined,
      subtitle:
        typeof questionsAnswered === "number" && typeof totalQuestions === "number"
          ? `${questionsAnswered.toLocaleString()} of ${totalQuestions.toLocaleString()} submissions answered · ${selectedRangeLabel}`
          : `Submitted-question cohort · ${selectedRangeLabel}`,
      href: activityHref("/admin/questions", { tab: "answered" }),
    },
    {
      label: "Provider Page Views",
      value: providerPageViews,
      subtitle: `Public profile loads · ${selectedRangeLabel}`,
      href: analyticsHref(),
    },
    {
      label: "Benefits Requested",
      value: benefitsRequested,
      subtitle: `Completed benefits intakes · ${selectedRangeLabel}`,
      href: activityHref("/admin/benefits"),
    },
    {
      label: "Emails clicked",
      value: emailClicks,
      subtitle: `Unique emails with a recorded click · ${selectedRangeLabel}`,
      href: "/admin/family-comms",
    },
    {
      label: "Text messages received",
      value: textMessagesReceived,
      subtitle: `Inbound to Olera’s SMS number · ${selectedRangeLabel}`,
      href: "/admin/family-comms",
    },
    {
      label: "Referral sources reviewed",
      value: referralSourcesReviewed,
      subtitle: `Unique local opportunities opened · ${selectedRangeLabel}`,
      href: activityHref("/admin/activity", { actor: "providers", view: "feed", event_type: "referral_source_viewed" }),
    },
    {
      label: "Referral calls started",
      value: referralCallsStarted,
      subtitle: `Call links tapped in Growth · ${selectedRangeLabel}`,
      href: activityHref("/admin/activity", { actor: "providers", view: "feed", event_type: "referral_call_clicked" }),
    },
    {
      label: "Referral partners gained",
      value: referralPartnersGained,
      subtitle: `Sources marked “They’ll refer me” · ${selectedRangeLabel}`,
      href: "/admin/market-outreach",
    },
    {
      label: "Reviews received",
      value: totalReviews,
      subtitle: `Submitted · ${selectedRangeLabel}`,
      href: activityHref("/admin/reviews"),
    },
    {
      label: "Provider Accounts Claimed",
      value: providerAccountsClaimed,
      subtitle: `New claims · ${selectedRangeLabel}`,
      href: analyticsHref(),
    },
  ];
  const visibleActivityCards = showAllActivity
    ? activityCards
    : activityCards.slice(0, PRIMARY_ACTIVITY_CARD_COUNT);
  const hiddenActivityCardCount = activityCards.length - PRIMARY_ACTIVITY_CARD_COUNT;

  const hasUnavailableStats = [
    totalQuestions,
    totalReviews,
    providerPageViews,
    questionsAnswered,
    questionAnswerRate,
    meaningfullyActiveProviders,
    leadsReceived,
    benefitsRequested,
    providerAccountsClaimed,
    emailClicks,
    textMessagesReceived,
    referralSourcesReviewed,
    referralCallsStarted,
    referralPartnersGained,
    adBoostProviders,
    unverifiedClaims,
    needsEmail,
    questionsNeedEmail,
    liveProviders,
    activeCareRequests,
    careRequestsReached,
    careRequestReachRate,
  ].some((value) => value === undefined);

  const currentCards: StatCard[] = [
    {
      label: "Active Care Requests",
      value: activeCareRequests,
      subtitle: "Families currently looking for care",
      href: "/admin/demand",
    },
    {
      label: "Care Requests Reached",
      value: careRequestReachRate,
      displayValue: typeof careRequestReachRate === "number" ? `${careRequestReachRate.toLocaleString()}%` : undefined,
      subtitle:
        typeof careRequestsReached === "number" && typeof activeCareRequests === "number"
          ? `${careRequestsReached.toLocaleString()} of ${activeCareRequests.toLocaleString()} received provider outreach`
          : "Active requests receiving provider outreach",
      href: "/admin/activity?actor=providers&view=feed&category=outbound",
    },
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
              {card.displayValue ?? card.value.toLocaleString()}
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
          {visibleActivityCards.map((card) => renderCard(card))}
        </div>
        {hiddenActivityCardCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAllActivity((visible) => !visible)}
            aria-expanded={showAllActivity}
            className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {showAllActivity
              ? "Collapse activity"
              : `See all activity (${hiddenActivityCardCount} more) →`}
          </button>
        )}
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
