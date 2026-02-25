"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const BENEFITS = [
  {
    title: "Higher SEO Ranking",
    desc: "Your listing optimized for Google so families find you first.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    title: "More Online Reviews",
    desc: "Built-in tools to collect and showcase reviews that build trust.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    title: "Easier Conversions",
    desc: "Quickly qualify and book leads with direct contact access.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
  },
  {
    title: "Unlimited Leads",
    desc: "No lead fees, no commissions \u2014 just direct family connections.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
];

const PLAN_FEATURES = [
  { text: "Listing on Olera", basic: true, pro: true, proLabel: "Optimized listing" },
  { text: "Images", basic: "Up to 3", pro: "Unlimited" },
  { text: "Google reviews", basic: "Up to 3", pro: "Unlimited" },
  { text: "Contact info visible", basic: false, pro: true },
  { text: "Review generation tools", basic: false, pro: true },
  { text: "Shareable review links", basic: false, pro: true },
  { text: "Q&A", basic: false, pro: true },
  { text: "Chat notes", basic: false, pro: true },
  { text: "Lead tracking & analytics", basic: false, pro: true },
];

const FAQ = [
  {
    q: "What is Olera Pro?",
    a: "Olera Pro gives your listing priority placement, unlimited lead access, review generation tools, and full analytics \u2014 everything you need to grow your care business online.",
  },
  {
    q: "What happens after the trial?",
    a: "After your trial ends, your listing reverts to the free tier. You\u2019ll keep your profile but lose access to Pro features like unlimited leads, review tools, and analytics. You can upgrade anytime.",
  },
  {
    q: "Can I cancel at anytime?",
    a: "Yes. You can cancel your subscription at any time with no penalties. Your Pro features remain active until the end of your current billing period.",
  },
];

// Active subscriber feature list (for the post-subscribe and canceled views)
const PRO_FEATURE_LIST = [
  "Optimized listing",
  "Unlimited images",
  "Unlimited reviews",
  "Contact info visible",
  "Review generation tools",
  "Shareable review links",
  "Q&A",
  "Chat notes",
  "Lead tracking & analytics",
];

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: "monthly" | "annual";
  onChange: (c: "monthly" | "annual") => void;
}) {
  return (
    <div className="inline-flex items-center bg-vanilla-50 border border-warm-100/60 p-0.5 rounded-xl">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-200 ${
          cycle === "monthly"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={`px-4 py-2 text-sm font-medium rounded-[10px] transition-all duration-200 flex items-center gap-1.5 ${
          cycle === "annual"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Annual
        <span className={`text-xs font-semibold ${cycle === "annual" ? "text-primary-600" : "text-primary-600/60"}`}>
          Save 17%
        </span>
      </button>
    </div>
  );
}

function PriceDisplay({ cycle, centered }: { cycle: "monthly" | "annual"; centered?: boolean }) {
  const monthly = cycle === "monthly";
  return (
    <div className={`flex items-baseline gap-1 ${centered ? "justify-center" : ""}`}>
      <span className="text-4xl font-display font-bold text-gray-900 tracking-tight">
        ${monthly ? "25" : "249"}
      </span>
      <span className="text-base text-gray-500 font-medium">/{monthly ? "mo" : "yr"}</span>
    </div>
  );
}

function FeatureCheck({ included }: { included: boolean }) {
  return included ? (
    <div className="w-5 h-5 bg-primary-50 rounded-full flex items-center justify-center shrink-0">
      <CheckIcon className="w-3 h-3 text-primary-600" />
    </div>
  ) : (
    <div className="w-5 h-5 bg-warm-50 rounded-full flex items-center justify-center shrink-0">
      <XMarkIcon className="w-3 h-3 text-gray-400" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-3xl">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div>
            <div className="h-6 w-32 bg-warm-100 rounded" />
            <div className="h-4 w-64 bg-warm-50 rounded mt-2" />
          </div>
          {/* Hero skeleton */}
          <div className="bg-white rounded-2xl border border-warm-100/60 p-8">
            <div className="h-8 w-72 bg-warm-100 rounded mb-3" />
            <div className="h-4 w-96 bg-warm-50 rounded mb-6" />
            <div className="flex items-center gap-4">
              <div className="h-10 w-48 bg-warm-50 rounded-xl" />
              <div className="h-12 w-40 bg-warm-100 rounded-xl" />
            </div>
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-warm-100/60 p-5">
                <div className="w-9 h-9 bg-warm-50 rounded-lg mb-3" />
                <div className="h-4 w-24 bg-warm-100 rounded mb-2" />
                <div className="h-3 w-full bg-warm-50 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OleraProPage() {
  const { membership, isLoading, refreshAccountData } = useAuth();
  const searchParams = useSearchParams();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [subscribing, setSubscribing] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);

  // Membership state
  const status = membership?.status;
  const isSubscribed = status === "active";
  const isTrial = status === "trialing";
  const isCanceled = status === "canceled";
  const isPastDue = status === "past_due";

  // Trial days remaining
  const trialDaysLeft = membership?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(membership.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  // Next billing date
  const nextBillingDate = membership?.current_period_ends_at
    ? new Date(membership.current_period_ends_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Handle ?upgraded=true
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setShowUpgradedBanner(true);
      refreshAccountData();
      const timer = setTimeout(() => setShowUpgradedBanner(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, refreshAccountData]);

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle, returnPath: "/provider/pro" }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      setSubscribing(false);
    }
  };

  // Loading
  if (isLoading) return <ProPageSkeleton />;

  // =====================================================================
  // Active Subscriber View
  // =====================================================================
  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">Olera Pro</h1>
            <p className="text-[15px] text-gray-500 mt-1">
              Manage your subscription and see what&apos;s included.
            </p>
          </div>

          {/* Upgraded banner */}
          {showUpgradedBanner && (
            <div className="mb-6 bg-primary-50 border border-primary-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                <CheckIcon className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-900">
                  Welcome to Olera Pro!
                </p>
                <p className="text-sm text-primary-700">
                  Your subscription is active. All Pro features are now unlocked.
                </p>
              </div>
            </div>
          )}

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-primary-200 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-display font-semibold text-gray-900">
                      Pro Plan
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                      Active
                    </span>
                  </div>
                  <p className="text-[15px] text-gray-500 mt-0.5">
                    {membership?.billing_cycle === "annual" ? "Annual" : "Monthly"}{" "}
                    billing
                    {nextBillingDate && (
                      <> &middot; Renews {nextBillingDate}</>
                    )}
                  </p>
                </div>
              </div>
              <a
                href="/portal/settings"
                className="text-[15px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Manage subscription &rarr;
              </a>
            </div>
          </div>

          {/* Your Pro features */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
            <h2 className="text-[15px] font-display font-semibold text-gray-900 mb-4">
              Your Pro Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRO_FEATURE_LIST.map((text) => (
                <div key={text} className="flex items-center gap-2.5">
                  <FeatureCheck included />
                  <span className="text-[15px] text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // =====================================================================
  // Canceled / Past Due View
  // =====================================================================
  if (isCanceled || isPastDue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-gray-900">Olera Pro</h1>
            <p className="text-[15px] text-gray-500 mt-1">
              Re-subscribe to unlock all Pro features.
            </p>
          </div>

          {/* Status card */}
          <div className="bg-white rounded-2xl border border-warm-200 shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warm-50 rounded-2xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-display font-semibold text-gray-900">
                  {isPastDue ? "Payment issue" : "Subscription ended"}
                </p>
                <p className="text-[15px] text-gray-500 mt-0.5">
                  {isPastDue
                    ? "We couldn\u2019t process your last payment. Update your payment method to keep Pro features."
                    : "Your Pro plan has been canceled. Re-subscribe to regain access."}
                </p>
              </div>
            </div>
          </div>

          {/* What you're missing */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 mb-8">
            <h2 className="text-[15px] font-display font-semibold text-gray-900 mb-4">
              What you&apos;re missing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRO_FEATURE_LIST.map((text) => (
                <div key={text} className="flex items-center gap-2.5">
                  <FeatureCheck included={false} />
                  <span className="text-[15px] text-gray-500">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Re-subscribe CTA */}
          <div className="bg-vanilla-50 border border-warm-100/60 rounded-2xl p-8 text-center">
            <h2 className="text-lg font-display font-semibold text-gray-900 mb-2">
              Pick up where you left off
            </h2>
            <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto">
              Re-subscribe to unlock unlimited leads, review tools, and
              analytics.
            </p>

            <div className="flex justify-center mb-5">
              <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
            </div>

            <PriceDisplay cycle={billingCycle} centered />

            <div className="mt-5">
              <Button onClick={handleSubscribe} loading={subscribing}>
                Re-subscribe to Pro
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Cancel anytime. No penalties.
            </p>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // =====================================================================
  // Free / Trialing View (Conversion Page)
  // =====================================================================
  return (
    <div className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-gray-900">Olera Pro</h1>
          {isTrial && trialDaysLeft !== null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
              {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in trial
            </span>
          )}
        </div>
        <p className="text-[15px] text-gray-500 mt-1">
          Everything you need to grow your care business online.
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Hero / Value Proposition */}
        <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50/60 via-white to-white p-8 mb-8">
          <h2 className="text-2xl font-display font-bold text-gray-900 tracking-tight leading-tight">
            Convert more leads with{" "}
            <span className="text-primary-600">Olera Pro</span>
          </h2>
          <p className="text-base text-gray-600 mt-3 leading-relaxed max-w-lg">
            Get priority placement, unlimited leads, review tools, and full
            analytics. Everything you need to fill your calendar.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="space-y-3">
              <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
              <PriceDisplay cycle={billingCycle} />
            </div>
            <div className="sm:ml-auto">
              <Button onClick={handleSubscribe} loading={subscribing} size="md">
                Subscribe to Pro
              </Button>
            </div>
          </div>
        </div>

        {/* Benefit Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 hover:shadow-lg hover:border-primary-200 transition-all duration-300"
            >
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-3">
                {b.icon}
              </div>
              <h3 className="text-[15px] font-display font-semibold text-gray-900">{b.title}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Basic */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
            <div className="mb-5 pb-5 border-b border-warm-100/60">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-display font-semibold text-gray-900">
                  Basic
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warm-50 text-gray-500">
                  Current plan
                </span>
              </div>
              <p className="text-[15px] text-gray-500 mt-1">Free forever</p>
            </div>
            <div className="space-y-3">
              {PLAN_FEATURES.map((f) => {
                const included =
                  typeof f.basic === "boolean" ? f.basic : true;
                const label =
                  typeof f.basic === "string" ? f.basic : f.text;
                return (
                  <div key={f.text} className="flex items-center gap-2.5">
                    <FeatureCheck included={included} />
                    <span
                      className={`text-[15px] ${included ? "text-gray-700" : "text-gray-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-2xl border-2 border-primary-200 shadow-sm p-6 relative">
            <div className="absolute -top-3 left-5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-600 text-white">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
                Recommended
              </span>
            </div>
            <div className="mb-5 pb-5 border-b border-warm-100/60">
              <h3 className="text-[15px] font-display font-semibold text-gray-900">Pro</h3>
              <p className="text-[15px] text-gray-500 mt-1">
                ${billingCycle === "monthly" ? "25/mo" : "249/yr"}
                {billingCycle === "annual" && (
                  <span className="text-primary-600 font-medium">
                    {" "}&middot; Save 17%
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-3">
              {PLAN_FEATURES.map((f) => {
                const label =
                  typeof f.pro === "string"
                    ? f.pro
                    : f.proLabel || f.text;
                return (
                  <div key={f.text} className="flex items-center gap-2.5">
                    <FeatureCheck included />
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <Button
                onClick={handleSubscribe}
                loading={subscribing}
                fullWidth
              >
                Get started
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-[15px] font-display font-semibold text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => {
              const isOpen = faqOpen === i;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-vanilla-50/50 transition-colors"
                  >
                    <span className="text-[15px] font-medium text-gray-900">
                      {item.q}
                    </span>
                    <ChevronIcon open={isOpen} />
                  </button>
                  <div
                    className="grid transition-all duration-200 ease-in-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-[15px] text-gray-500 leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-vanilla-50 border border-warm-100/60 rounded-2xl p-8 text-center">
          <h2 className="text-lg font-display font-semibold text-gray-900 mb-2">
            Ready to grow your business?
          </h2>
          <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto">
            Join providers who are filling their calendars with Olera Pro.
          </p>
          <Button onClick={handleSubscribe} loading={subscribing} size="md">
            Subscribe to Pro &mdash; $
            {billingCycle === "monthly" ? "25/mo" : "249/yr"}
          </Button>
          <p className="text-sm text-gray-400 mt-3">
            Cancel anytime. No long-term contracts.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
