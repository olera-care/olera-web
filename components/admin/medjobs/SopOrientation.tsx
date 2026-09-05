"use client";

import { useEffect, useState } from "react";
import SystemArchitecture from "@/components/admin/medjobs/SystemArchitecture";
import SiteNavigator from "@/components/admin/medjobs/SiteNavigator";
import HealthBadge from "@/components/admin/medjobs/HealthBadge";
import StatsToggle from "@/components/admin/medjobs/StatsToggle";
import { useFunnel30d } from "@/components/admin/medjobs/useFunnel30d";

/**
 * The operating command centre: the architecture with its 30-day tracker, a
 * site filter over it, the health of whatever is currently in view, and the
 * navigator that answers which site needs attention.
 *
 * The two working surfaces the MedJobs nav used to carry, Sites and the In
 * Basket, are actions here rather than separate destinations.
 */

const VIDEO = "/api/admin/medjobs/sop?doc=video";

/** The little external-link mark beside the walkthrough. */
function LinkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path d="M6.5 3H3.5A0.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-3" strokeLinecap="round" />
      <path d="M9.5 2.5H13.5V6.5M13 3l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Action({
  href,
  children,
  count,
}: {
  href: string;
  children: React.ReactNode;
  /** Queue fraction, carried over from the sidebar badge these actions replace. */
  count?: { unread: number; total: number };
}) {
  const hot = !!count && count.unread > 0;
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
    >
      {children}
      {count && count.total > 0 ? (
        <span
          className={`rounded px-1 text-[11px] tabular-nums ${
            hot ? "bg-primary-100 font-semibold text-primary-900" : "text-gray-400"
          }`}
        >
          {hot ? `${count.unread}/${count.total}` : count.total}
        </span>
      ) : null}
    </a>
  );
}


export default function SopOrientation({ onJump }: { onJump: (dest: string) => void }) {
  const [site, setSite] = useState<string | null>(null);
  // Off by default: the health dots carry the state, the figures are detail.
  const [showStats, setShowStats] = useState(false);
  const { funnel, failed } = useFunnel30d(site);

  // The sidebar used to carry these fractions. Moving Sites and the In Basket
  // onto this page must not lose the one signal that made them worth glancing
  // at, so the counts come with them.
  const [counts, setCounts] = useState<Record<string, { unread: number; total: number }> | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/medjobs/sidebar-counts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !cancelled && setCounts(d))
      .catch(() => !cancelled && setCounts(null));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="relative rounded-lg border border-gray-200 bg-white p-4">
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
              <StatsToggle on={showStats} onChange={setShowStats} />
              <a
                href={VIDEO}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch the walkthrough"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800"
              >
                <LinkIcon />
                Walkthrough
              </a>
              {funnel ? (
                <HealthBadge
                  status={funnel.health.status}
                  score={funnel.health.score}
                  title={funnel.health.reads}
                />
              ) : null}
            </div>
          <SystemArchitecture
            onJump={onJump}
            metrics={funnel?.stages}
            yields={funnel?.yield}
            outcomes={funnel?.outcomes}
            showStats={showStats}
            site={funnel?.site ?? null}
          />
          {failed ? (
            <p className="mt-2 text-xs text-gray-500">
              The 30-day tracker could not be loaded, so the map is showing without
              numbers. The stages and handoffs are unaffected.
            </p>
          ) : null}
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Action href="/admin/medjobs/sites" count={counts?.sites}>
              Sites
            </Action>
            <Action href="/admin/medjobs/in-basket" count={counts?.in_basket}>
              In Basket
            </Action>
          </div>
          <SiteNavigator active={site} onPick={setSite} />
        </div>
      </div>

    </div>
  );
}
