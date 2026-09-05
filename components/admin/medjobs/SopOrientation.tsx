"use client";

import { useState } from "react";
import SystemArchitecture from "@/components/admin/medjobs/SystemArchitecture";
import SiteNavigator from "@/components/admin/medjobs/SiteNavigator";
import StatsToggle from "@/components/admin/medjobs/StatsToggle";
import { useFunnel30d } from "@/components/admin/medjobs/useFunnel30d";

/**
 * The operating command centre: the architecture, a site list beside it that
 * filters the map, and one switch for the numbers.
 *
 * No cards. The map and the list sit on the page with a rule between them,
 * because two boxes side by side draw a border the eye has to cross before it
 * reaches anything worth reading.
 */

const VIDEO = "/api/admin/medjobs/sop?doc=video";

/** The external-link mark beside the walkthrough. */
function LinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
    >
      <path d="M6.5 3H3.5A0.5.5 0 0 0 3 3.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-3" strokeLinecap="round" />
      <path d="M9.5 2.5H13.5V6.5M13 3l-5.5 5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SopOrientation({ onJump }: { onJump: (dest: string) => void }) {
  const [site, setSite] = useState<string | null>(null);
  // Off by default. With it off the map is the operating model; with it on it
  // is also the scoreboard.
  const [showStats, setShowStats] = useState(false);
  const { funnel, failed } = useFunnel30d(site);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col">
        <div className="mb-1 flex justify-end">
          <a
            href={VIDEO}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-800"
          >
            <LinkIcon />
            Walkthrough
          </a>
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

        <div className="mt-3 flex justify-end">
          <StatsToggle on={showStats} onChange={setShowStats} />
        </div>
      </div>

      <SiteNavigator active={site} onPick={setSite} showStats={showStats} />
    </div>
  );
}
