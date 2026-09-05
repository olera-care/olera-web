"use client";

import { useEffect, useState } from "react";
import SystemArchitecture from "@/components/admin/medjobs/SystemArchitecture";
import SiteNavigator from "@/components/admin/medjobs/SiteNavigator";
import HealthBadge from "@/components/admin/medjobs/HealthBadge";
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
const WALKTHROUGH = "/api/admin/medjobs/sop?doc=walkthrough";

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

function Resource({ href, kind, title, detail }: { href: string; kind: string; title: string; detail: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <span className="mt-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {kind}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900 group-hover:underline">{title}</span>
        <span className="block text-xs text-gray-500">{detail}</span>
      </span>
    </a>
  );
}

export default function SopOrientation({ onJump }: { onJump: (dest: string) => void }) {
  const [site, setSite] = useState<string | null>(null);
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
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Action href="/admin/medjobs/sites" count={counts?.sites}>Sites</Action>
        <Action href="/admin/medjobs/in-basket" count={counts?.in_basket}>In Basket</Action>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />
        <span className="text-xs text-gray-500">
          {funnel?.site ? funnel.site.name : "All sites"} · last 30 days
        </span>
        {funnel ? (
          <HealthBadge
            status={funnel.health.status}
            score={funnel.health.score}
            size="lg"
            title={funnel.health.reads}
          />
        ) : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-gray-900">
              System Architecture{funnel ? ", last 30 days" : ""}
            </h2>
            <p className="text-xs text-gray-500">
              Click a stage to jump the reader to it
              {funnel ? " · hover a number for what it counts" : ""}
            </p>
          </div>
          <SystemArchitecture
            onJump={onJump}
            metrics={funnel?.stages}
            yields={funnel?.yield}
            outcomes={funnel?.outcomes}
          />
          {failed ? (
            <p className="mt-2 text-xs text-gray-500">
              The 30-day tracker could not be loaded, so the map is showing without
              numbers. The stages and handoffs are unaffected.
            </p>
          ) : null}
          {funnel?.site ? (
            <p className="mt-2 text-xs text-gray-500">
              Five stages have no campus link in the schema and stay network-wide
              under a site filter: PR3, ST8, MA1, MA2 and MA3. They are marked on the
              map and sit out this site&rsquo;s health score.
            </p>
          ) : null}
        </div>

        <SiteNavigator active={site} onPick={setSite} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Resource
          href={VIDEO}
          kind="Video"
          title="Operating system walkthrough"
          detail="Recorded 4 September 2026 · opens in a new tab"
        />
        <Resource
          href={WALKTHROUGH}
          kind="PDF"
          title="Walkthrough summary and reader guide"
          detail="Two pages · how to read the matrix below"
        />
      </div>
    </div>
  );
}
