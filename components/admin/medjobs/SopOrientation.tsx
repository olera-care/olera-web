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

export default function SopOrientation({ onJump }: { onJump: (dest: string) => void }) {
  const [site, setSite] = useState<string | null>(null);
  // Off by default. With it off the map is the operating model; with it on it
  // is also the scoreboard.
  const [showStats, setShowStats] = useState(false);
  const { funnel, failed } = useFunnel30d(site);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col">
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
