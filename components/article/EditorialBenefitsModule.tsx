"use client";

/**
 * EditorialBenefitsModule
 *
 * Wraps BenefitsDiscoveryModule for /caregiver-support/[slug] article pages.
 *
 * Why a wrapper: BenefitsDiscoveryModule expects providerState/stateId/
 * stateName to be present at render time (provider pages know their state
 * server-side). Editorial articles don't — visitor state is per-request
 * and the article body is ISR-cached (revalidate=60). Resolving state in
 * a server component would force dynamic rendering and tank TTFB on the
 * SEO surface this whole module exists to convert.
 *
 * Flow on mount:
 *   1. Hit /api/geo for the visitor's US state.
 *   2. If state resolved → hit /api/benefits/programs?state=XX → render
 *      BenefitsDiscoveryModule with entrySource=`/caregiver-support/{slug}`.
 *   3. If geo fails (non-US, missing region header, ad-block) → render a
 *      styled fallback link to /benefits/finder. Better than the old
 *      /browse CTA (still feeds the inquiry funnel) and avoids building
 *      a no-state path through ResultsSheet.
 *
 * The skeleton during resolution is height-stable so CLS stays clean on
 * SEO-cached pages. ~250-500ms typical end-to-end (geo + programs +
 * hydration), most of which is parallelizable in v2.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import BenefitsDiscoveryModule, {
  type BenefitsProgram,
} from "@/components/providers/BenefitsDiscoveryModule";

interface ResolvedBenefits {
  state: string;
  stateId: string;
  stateName: string;
  topPrograms: BenefitsProgram[];
  allPrograms: BenefitsProgram[];
}

type ResolveStatus = "loading" | "resolved" | "fallback";

interface EditorialBenefitsModuleProps {
  /** Article slug — used to build the entrySource path for analytics. */
  articleSlug: string;
}

export default function EditorialBenefitsModule({ articleSlug }: EditorialBenefitsModuleProps) {
  const [status, setStatus] = useState<ResolveStatus>("loading");
  const [data, setData] = useState<ResolvedBenefits | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const geoRes = await fetch("/api/geo", { cache: "no-store" });
        if (!geoRes.ok) {
          if (!cancelled) setStatus("fallback");
          return;
        }
        const geo = (await geoRes.json()) as { state: string | null };
        if (!geo.state) {
          if (!cancelled) setStatus("fallback");
          return;
        }

        const progRes = await fetch(`/api/benefits/programs?state=${encodeURIComponent(geo.state)}`);
        if (!progRes.ok) {
          if (!cancelled) setStatus("fallback");
          return;
        }
        const progData = (await progRes.json()) as Omit<ResolvedBenefits, "state">;
        if (cancelled) return;

        setData({
          state: geo.state,
          stateId: progData.stateId,
          stateName: progData.stateName,
          topPrograms: progData.topPrograms,
          allPrograms: progData.allPrograms,
        });
        setStatus("resolved");
      } catch {
        if (!cancelled) setStatus("fallback");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <BenefitsModuleSkeleton />;
  }

  if (status === "fallback" || !data) {
    return <BenefitsFallbackCTA />;
  }

  return (
    <div className="my-12">
      <BenefitsDiscoveryModule
        providerState={data.state}
        stateId={data.stateId}
        stateName={data.stateName}
        topPrograms={data.topPrograms}
        allPrograms={data.allPrograms}
        entrySource={`/caregiver-support/${articleSlug}`}
      />
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
// Height-stable placeholder that roughly matches BenefitsDiscoveryModule's
// step-1 footprint (H2 + sub + 4 care-need cards). Keeps CLS clean while
// geo + programs resolve. Animation is subtle pulse.
function BenefitsModuleSkeleton() {
  return (
    <div className="my-12" aria-hidden="true">
      <div className="animate-pulse">
        <div className="h-8 w-3/4 rounded bg-gray-100 mb-3" />
        <div className="h-4 w-1/2 rounded bg-gray-100 mb-6" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-50 border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fallback CTA ────────────────────────────────────────────────────────
// Rendered when geo can't resolve (non-US visitor, missing region header,
// or programs lookup fails). Sends the visitor to /benefits/finder where
// they can pick their state manually. Visual stays close to the article's
// editorial restraint — no shouting boxes.
function BenefitsFallbackCTA() {
  return (
    <Link
      href="/benefits/finder"
      className="group block my-12 p-5 rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all duration-200"
    >
      <p className="text-base font-semibold text-gray-900 mb-1">
        Find care benefits programs in your state.
      </p>
      <p className="text-sm text-gray-500 flex items-center gap-1">
        Tell us what&apos;s needed — we&apos;ll match programs that may help.
        <svg
          className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </p>
    </Link>
  );
}
