"use client";

import { useState } from "react";
import Link from "next/link";
import type { BoostRequest } from "@/lib/ad-boost/boost-state";
import {
  PlanActive,
  WrapUpMoment,
} from "@/components/provider/boost/BoostCampaignViews";

/**
 * Wrap-up moment preview gallery — renders the EXACT provider-facing Phase 2
 * money views (components shared with /provider/boost) against sample data, so
 * the team can see what a provider sees without seeding a campaign. The
 * checkout button is stubbed: nothing here can charge anyone.
 */

type PreviewKey = "wrapup" | "wrapup_one" | "weak" | "celebrate" | "steady";

const SAMPLE_BASE: BoostRequest = {
  id: "preview",
  status: "live",
  requested_setup_week: "2026-06-22",
  channel: "google",
  intended_monthly_budget: 150,
  campaign_tag: "preview-campaign",
  created_at: "2026-06-16T12:00:00Z",
  plan_status: null,
  plan_value: null,
  promo_complete_email_sent_at: "2026-07-06T12:00:00Z",
};

const PREVIEWS: {
  key: PreviewKey;
  label: string;
  blurb: string;
}[] = [
  {
    key: "wrapup",
    label: "Wrap-up · strong",
    blurb: "The payment ask. Arms after the 3rd lead or the promo-complete email. Sample numbers are Franchil-shaped: 19 visitors, 3 leads.",
  },
  {
    key: "wrapup_one",
    label: "Wrap-up · 1 lead",
    blurb: "Same ask with a single lead (“A family reached out.”) — the weakest state that still asks.",
  },
  {
    key: "weak",
    label: "Wrap-up · zero leads",
    blurb: "The honest no-ask path. A quiet intro never gets an invoice; we offer another window on us.",
  },
  {
    key: "celebrate",
    label: "Plan active · just paid",
    blurb: "What they see returning from Stripe Checkout (?subscribed=true), even before the webhook lands.",
  },
  {
    key: "steady",
    label: "Plan active · steady state",
    blurb: "Every later visit to /provider/boost while the plan runs.",
  },
];

export default function AdBoostPreviewPage() {
  const [view, setView] = useState<PreviewKey>("wrapup");
  const [fakeSubmitting, setFakeSubmitting] = useState(false);
  const [fakeError, setFakeError] = useState<string | null>(null);

  const stubCheckout = (planValue: number) => {
    // Stubbed on purpose — show the loading beat, then explain.
    setFakeError(null);
    setFakeSubmitting(true);
    setTimeout(() => {
      setFakeSubmitting(false);
      setFakeError(
        `Preview only — a real provider would now be on Stripe Checkout for $${planValue}/mo.`,
      );
    }, 600);
  };

  const stats = (leads: number) => ({
    visitors: 19,
    leads,
    since: "2026-06-22T00:00:00Z",
  });

  const active: BoostRequest = {
    ...SAMPLE_BASE,
    plan_status: "active",
    plan_value: 150,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Wrap-up moment — preview</h1>
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            sample data · checkout stubbed
          </span>
        </div>
        <p className="text-gray-500 mt-1 text-sm max-w-2xl">
          The exact components providers see on /provider/boost (shared code, not
          a mockup). The wrap-up is the only payment ask in the system; it arms on
          the 3rd lead or the promo-complete email.{" "}
          <Link href="/admin/ad-boost" className="text-primary-600 font-medium hover:underline">
            Back to the queue
          </Link>
        </p>
      </header>

      {/* State picker */}
      <div className="flex flex-wrap gap-2 mb-2">
        {PREVIEWS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setView(p.key);
              setFakeError(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === p.key
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-6 max-w-2xl">
        {PREVIEWS.find((p) => p.key === view)?.blurb}
      </p>

      {/* The provider's viewport — same warm shell as /provider/boost */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-2 text-xs text-gray-400">
          provider view · /provider/boost
        </div>
        <div className="bg-gradient-to-b from-vanilla-50 via-white to-white px-6 sm:px-10 py-10">
          {view === "wrapup" && (
            <WrapUpMoment
              key="wrapup"
              request={SAMPLE_BASE}
              campaignStats={stats(3)}
              onCheckout={stubCheckout}
              submitting={fakeSubmitting}
              error={fakeError}
            />
          )}
          {view === "wrapup_one" && (
            <WrapUpMoment
              key="wrapup_one"
              request={SAMPLE_BASE}
              campaignStats={stats(1)}
              onCheckout={stubCheckout}
              submitting={fakeSubmitting}
              error={fakeError}
            />
          )}
          {view === "weak" && (
            <WrapUpMoment
              key="weak"
              request={SAMPLE_BASE}
              campaignStats={stats(0)}
              onCheckout={stubCheckout}
              submitting={false}
              error={null}
            />
          )}
          {view === "celebrate" && (
            <PlanActive request={active} campaignStats={stats(3)} celebrate />
          )}
          {view === "steady" && (
            <PlanActive request={active} campaignStats={stats(5)} celebrate={false} />
          )}
        </div>
      </div>
    </div>
  );
}
