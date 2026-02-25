"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import TestimonialCarousel from "@/components/providers/TestimonialCarousel";

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

const PLAN_FEATURES: { text: string; free: string | boolean; pro: string | boolean }[] = [
  { text: "Search placement", free: "Standard", pro: "Priority" },
  { text: "Lead responses", free: "3/month", pro: "Unlimited" },
  { text: "Match reach-outs", free: "3/month", pro: "Unlimited" },
  { text: "Contact info visible", free: false, pro: true },
  { text: "Reviews & shareable links", free: false, pro: true },
  { text: "Analytics, SEO & chat notes", free: false, pro: true },
];

const FAQ = [
  {
    q: "What\u2019s in the free trial?",
    a: "You get full access to every Pro feature for 14 days \u2014 priority placement, unlimited leads, review tools, analytics, and more. No credit card required to start.",
  },
  {
    q: "What happens after the trial?",
    a: "After your trial ends, your listing reverts to the free tier. You\u2019ll keep your profile but lose access to Pro features like unlimited leads, review tools, and analytics. You can upgrade anytime.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time with no penalties. Your Pro features remain active until the end of your current billing period.",
  },
  {
    q: "How is this different from lead gen sites?",
    a: "Lead gen sites charge per lead and sell your information to multiple providers. Olera connects you directly with families \u2014 no per-lead fees, no bidding wars. You pay one flat monthly price and keep every connection.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I went from one or two calls a week to hearing from families every day. Pro paid for itself before the trial ended\u00a0\u2014 I booked three new families in the first week.",
    name: "Maria Rodriguez",
    initials: "MR",
    role: "Home Care Provider",
    location: "Austin, TX",
  },
  {
    quote:
      "The review tools alone are worth it. Families tell me they chose us because of our Olera reviews. We\u2019ve doubled our monthly inquiries since upgrading.",
    name: "James Thompson",
    initials: "JT",
    role: "Assisted Living Director",
    location: "Denver, CO",
  },
  {
    quote:
      "Before Pro, I was spending hours on lead-gen sites and paying per click. Now families come to me directly and I keep every dollar. It\u2019s the best investment I\u2019ve made in my business.",
    name: "Priya Sharma",
    initials: "PS",
    role: "In-Home Care Provider",
    location: "Charlotte, NC",
  },
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

function ComparisonTable({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm border-t-[3px] border-t-primary-400 overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 px-5 sm:px-6 py-4 hover:bg-vanilla-50/50 transition-colors"
      >
        <span className="text-[15px] font-display font-semibold text-gray-900">
          Compare Free vs Pro
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* Collapsible body */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] items-center px-5 sm:px-6 py-4 border-y border-gray-100 bg-vanilla-50/50">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-wide">Feature</span>
            <span className="text-sm font-semibold text-gray-500 text-center">Free</span>
            <span className="text-sm font-semibold text-primary-600 text-center">Pro</span>
          </div>

          {/* Rows */}
          {PLAN_FEATURES.map((f, i) => (
            <div
              key={f.text}
              className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] items-center px-5 sm:px-6 py-4 ${
                i < PLAN_FEATURES.length - 1 ? "border-b border-gray-100/80" : ""
              }`}
            >
              <span className="text-[15px] text-gray-700">{f.text}</span>

              {/* Free column */}
              <div className="flex justify-center">
                {typeof f.free === "boolean" ? (
                  f.free ? (
                    <CheckIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <span className="text-gray-300">&mdash;</span>
                  )
                ) : (
                  <span className="text-sm text-gray-500">{f.free}</span>
                )}
              </div>

              {/* Pro column */}
              <div className="flex justify-center">
                {typeof f.pro === "boolean" ? (
                  f.pro ? (
                    <CheckIcon className="w-4 h-4 text-primary-600" />
                  ) : (
                    <span className="text-gray-300">&mdash;</span>
                  )
                ) : (
                  <span className="text-sm font-medium text-primary-700">{f.pro}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero skeleton */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center animate-pulse">
          <div className="h-9 w-32 bg-warm-100 rounded-full mx-auto mb-8" />
          <div className="h-12 w-80 bg-warm-100 rounded mx-auto mb-3" />
          <div className="h-12 w-64 bg-warm-50 rounded mx-auto mb-6" />
          <div className="h-5 w-72 bg-warm-50 rounded mx-auto mb-10" />
          <div className="h-14 w-56 bg-warm-100 rounded-full mx-auto" />
        </div>
      </section>

      {/* Stats strip skeleton */}
      <section className="bg-vanilla-50 border-y border-warm-100/60 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-warm-100/60 border-t-[3px] border-t-warm-200 px-6 py-5 text-center">
                <div className="h-8 w-16 bg-warm-100 rounded mx-auto mb-2" />
                <div className="h-4 w-24 bg-warm-50 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
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
  const [tableOpen, setTableOpen] = useState(true);

  // Preview mode: cycle through views before Stripe is connected
  // Remove this block once Stripe integration is live
  const [previewStatus, setPreviewStatus] = useState<"free" | "active" | "canceled">("free");

  // Membership state (preview overrides real status)
  const status = membership?.status;
  const isSubscribed = previewStatus === "active" || (!previewStatus && status === "active");
  const isTrial = previewStatus === "free" ? false : status === "trialing";
  const isCanceled = previewStatus === "canceled" || (!previewStatus && status === "canceled");
  const isPastDue = previewStatus ? false : status === "past_due";

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

  // Handle ?upgraded=true — refresh membership data
  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      refreshAccountData();
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

  // Preview toggle — remove once Stripe integration is live
  const previewToggle = (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 bg-white/90 backdrop-blur border border-gray-200 rounded-full px-1 py-1 shadow-lg">
      {(["free", "active", "canceled"] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => { setPreviewStatus(s); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
            previewStatus === s
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {s === "free" ? "Free" : s === "active" ? "Pro" : "Canceled"}
        </button>
      ))}
    </div>
  );

  // =====================================================================
  // Active Subscriber View
  // =====================================================================
  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-white">
        {previewToggle}
        {/* ── HERO ── */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50/60 border border-primary-100/60 mb-8">
              <CheckIcon className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-primary-700">You&apos;re on Pro</span>
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-display font-bold text-gray-900 leading-[1.1] tracking-tight">
              You&apos;re getting the<br />
              most out of <span className="text-primary-600 italic">Olera</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-500 mt-6 leading-relaxed">
              Your Pro plan is active. Here&apos;s what you have.
            </p>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="bg-vanilla-50 border-y border-warm-100/60 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "3.2\u00d7", label: "more inquiries", detail: "vs. free listings" },
                { value: "500+", label: "providers on Pro", detail: "and growing" },
                { value: "89%", label: "fill rate", detail: "within 30 days" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-warm-100/60 border-t-[3px] border-t-primary-400 px-6 py-5 text-center"
                >
                  <p className="text-3xl font-display font-bold text-gray-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON TABLE + BILLING ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <ComparisonTable open={tableOpen} onToggle={() => setTableOpen(!tableOpen)}>
              {/* Billing details */}
              <div className="px-6 pt-8 pb-6 flex justify-center">
                <div className="w-full max-w-xl bg-vanilla-50/60 rounded-2xl border border-gray-200/60 overflow-hidden">
                  {[
                    { label: "Plan", value: "Olera Pro" },
                    { label: "Status", value: "Active", teal: true },
                    {
                      label: "Billing",
                      value: `${membership?.billing_cycle === "annual" ? "$249/yr" : "$25/mo"} \u00b7 ${membership?.billing_cycle === "annual" ? "Annual" : "Monthly"}`,
                    },
                    ...(nextBillingDate ? [{ label: "Next payment", value: nextBillingDate }] : []),
                    ...(membership?.created_at
                      ? [{
                          label: "Member since",
                          value: new Date(membership.created_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }),
                        }]
                      : []),
                  ].map((row, i, arr) => (
                    <div
                      key={row.label}
                      className={`flex items-center justify-between px-6 py-4 ${
                        i < arr.length - 1 ? "border-b border-gray-100/80" : ""
                      }`}
                    >
                      <span className="text-[15px] text-gray-500">{row.label}</span>
                      <span className={`text-[15px] font-semibold ${"teal" in row && row.teal ? "text-primary-600" : "text-gray-900"}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}

                  {/* Manage billing button */}
                  <div className="px-6 py-5 border-t border-gray-100/80 flex justify-center">
                    <a
                      href="/portal/settings"
                      className="inline-flex items-center px-6 py-2.5 rounded-full border border-gray-200 text-[15px] font-medium text-gray-700 hover:bg-vanilla-50 hover:border-gray-300 transition-all duration-200"
                    >
                      Manage billing
                    </a>
                  </div>
                </div>
              </div>
            </ComparisonTable>
          </div>
        </section>

        <TestimonialCarousel testimonials={TESTIMONIALS} />

        {/* ── FAQ ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">
              Questions &amp; answers
            </h2>
            <div className="space-y-3">
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
                      <span className="text-[15px] font-display font-semibold text-gray-900">
                        {item.q}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </button>
                    <div
                      className="grid transition-all duration-200 ease-in-out"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
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
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="bg-vanilla-50 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-8 py-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-6">
                You&apos;re all set.
              </h2>
              <a
                href="/provider"
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-gray-900 hover:bg-gray-800 text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-all duration-200"
              >
                Back to dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =====================================================================
  // Canceled / Past Due View
  // =====================================================================
  if (isCanceled || isPastDue) {
    const endedDate = membership?.current_period_ends_at
      ? new Date(membership.current_period_ends_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return (
      <div className="min-h-screen bg-white">
        {previewToggle}
        {/* ── HERO ── */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50/60 border border-red-100/60 mb-8">
              <XMarkIcon className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">Pro canceled</span>
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-display font-bold text-gray-900 leading-[1.1] tracking-tight">
              We saved your spot.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-500 mt-6 leading-relaxed">
              {isPastDue
                ? "There was an issue with your payment. Update your billing to keep Pro."
                : endedDate
                  ? `Your Pro benefits ended on ${endedDate}. Pick up where you left off.`
                  : "Your Pro benefits have ended. Pick up where you left off."}
            </p>

            {/* CTA */}
            <div className="mt-10">
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[17px] font-semibold rounded-full shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_16px_rgba(25,144,135,0.35)] active:scale-[0.98] transition-all duration-200"
              >
                {subscribing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Resubscribe to Pro
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="bg-vanilla-50 border-y border-warm-100/60 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "3.2\u00d7", label: "more inquiries", detail: "vs. free listings" },
                { value: "500+", label: "providers on Pro", detail: "and growing" },
                { value: "89%", label: "fill rate", detail: "within 30 days" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-warm-100/60 border-t-[3px] border-t-primary-400 px-6 py-5 text-center"
                >
                  <p className="text-3xl font-display font-bold text-gray-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARISON + PRICING (unified card) ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">
              Why providers upgrade
            </h2>

            <ComparisonTable open={tableOpen} onToggle={() => setTableOpen(!tableOpen)}>
              <div className="border-t border-gray-100 bg-vanilla-50/50 px-5 sm:px-6 py-10 text-center">
                <div className="flex justify-center mb-5">
                  <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
                </div>

                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-5xl font-display font-bold text-gray-900 tracking-tight">
                    ${billingCycle === "monthly" ? "25" : "249"}
                  </span>
                  <span className="text-lg text-gray-400 font-medium">
                    /{billingCycle === "monthly" ? "mo" : "yr"}
                  </span>
                </div>

                <p className="text-[15px] text-gray-500 mb-8">
                  One new family more than covers it.
                </p>

                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="inline-flex items-center gap-2.5 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[17px] font-semibold rounded-full shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_16px_rgba(25,144,135,0.35)] active:scale-[0.98] transition-all duration-200"
                >
                  {subscribing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Resubscribe to Pro
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-sm text-gray-400 mt-4">
                  Instant reactivation &middot; Cancel anytime
                </p>
              </div>
            </ComparisonTable>
          </div>
        </section>

        <TestimonialCarousel testimonials={TESTIMONIALS} />

        {/* ── FAQ ── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">
              Questions &amp; answers
            </h2>
            <div className="space-y-3">
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
                      <span className="text-[15px] font-display font-semibold text-gray-900">
                        {item.q}
                      </span>
                      <ChevronIcon open={isOpen} />
                    </button>
                    <div
                      className="grid transition-all duration-200 ease-in-out"
                      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
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
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="bg-vanilla-50 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-8 py-12 text-center">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-6">
                Your families are waiting.
              </h2>
              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[17px] font-semibold rounded-full shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_16px_rgba(25,144,135,0.35)] active:scale-[0.98] transition-all duration-200"
              >
                {subscribing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Resubscribe to Pro
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
              <p className="text-sm text-gray-400 mt-4">
                $25/mo &middot; Instant reactivation
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // =====================================================================
  // Free / Trialing View (Landing Page)
  // =====================================================================

  const priceLabel = billingCycle === "monthly" ? "$25/mo" : "$249/yr";

  return (
    <div className="min-h-screen bg-white">
      {previewToggle}
      {/* ── HERO SECTION ── */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50/60 border border-primary-100/60 mb-8">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
            </svg>
            <span className="text-sm font-semibold text-primary-700">Olera Pro</span>
          </div>

          {/* Headline */}
          <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-display font-bold text-gray-900 leading-[1.1] tracking-tight">
            More families.<br />
            Less <span className="text-primary-600 italic">wondering</span>.
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-500 mt-6 leading-relaxed">
            Everything you need to fill your calendar.{" "}
            <span className="font-semibold text-gray-700">{priceLabel}</span>.
          </p>

          {/* Trial badge */}
          {isTrial && trialDaysLeft !== null && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                <span className="w-1.5 h-1.5 bg-primary-500 rounded-full" />
                {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in trial
              </span>
            </div>
          )}

          {/* CTA */}
          <div className="mt-10">
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="inline-flex items-center gap-2.5 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[17px] font-semibold rounded-full shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_16px_rgba(25,144,135,0.35)] active:scale-[0.98] transition-all duration-200"
            >
              {subscribing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Try Pro free for 14 days
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-vanilla-50 border-y border-warm-100/60 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: "3.2\u00d7", label: "more inquiries", detail: "vs. free listings" },
              { value: "500+", label: "providers on Pro", detail: "and growing" },
              { value: "89%", label: "fill rate", detail: "within 30 days" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-warm-100/60 border-t-[3px] border-t-primary-400 px-6 py-5 text-center"
              >
                <p className="text-3xl font-display font-bold text-gray-900 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-700 mt-1">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON + PRICING (unified card) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">
            Why providers upgrade
          </h2>

          <ComparisonTable open={tableOpen} onToggle={() => setTableOpen(!tableOpen)}>
            <div className="border-t border-gray-100 bg-vanilla-50/50 px-5 sm:px-6 py-10 text-center">
              <div className="flex justify-center mb-5">
                <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
              </div>

              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-5xl font-display font-bold text-gray-900 tracking-tight">
                  ${billingCycle === "monthly" ? "25" : "249"}
                </span>
                <span className="text-lg text-gray-400 font-medium">
                  /{billingCycle === "monthly" ? "mo" : "yr"}
                </span>
              </div>

              <p className="text-[15px] text-gray-500 mb-8">
                One new family more than covers it.
              </p>

              <button
                onClick={handleSubscribe}
                disabled={subscribing}
                className="inline-flex items-center gap-2.5 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[17px] font-semibold rounded-full shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_16px_rgba(25,144,135,0.35)] active:scale-[0.98] transition-all duration-200"
              >
                {subscribing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Start your free trial
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-sm text-gray-400 mt-4">
                14-day free trial &middot; Cancel anytime &middot; No contracts
              </p>
            </div>
          </ComparisonTable>
        </div>
      </section>

      <TestimonialCarousel testimonials={TESTIMONIALS} />

      {/* ── FAQ ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-gray-900 text-center mb-8">
            Questions &amp; answers
          </h2>
          <div className="space-y-3">
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
                    <span className="text-[15px] font-display font-semibold text-gray-900">
                      {item.q}
                    </span>
                    <ChevronIcon open={isOpen} />
                  </button>
                  <div
                    className="grid transition-all duration-200 ease-in-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
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
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="bg-vanilla-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm px-8 py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-6">
              One new family covers the cost.
            </h2>
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="inline-flex items-center gap-2.5 px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white text-[17px] font-semibold rounded-full shadow-[0_2px_8px_rgba(25,144,135,0.25)] hover:shadow-[0_4px_16px_rgba(25,144,135,0.35)] active:scale-[0.98] transition-all duration-200"
            >
              {subscribing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Start your free trial
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
            <p className="text-sm text-gray-400 mt-4">
              14-day free trial &middot; Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
