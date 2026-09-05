"use client";

import { useState } from "react";

import RoleDiagram from "@/components/admin/medjobs/RoleDiagram";
import SiteNavigator from "@/components/admin/medjobs/SiteNavigator";
import StatsToggle from "@/components/admin/medjobs/StatsToggle";
import { useFunnel30d } from "@/components/admin/medjobs/useFunnel30d";

/**
 * What sits above the reader on a role page: that role's steps, with their
 * trailing-30-day numbers, and one dashed step past each handoff.
 *
 * Laid out like the System page — map on the left, the site list beside it —
 * so every page in the workspace filters to a site the same way.
 */

export default function RoleOrientation({
  role,
  onJump,
}: {
  role: "admin" | "sales" | "crm";
  onJump: (dest: string) => void;
}) {
  const [site, setSite] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { funnel, failed } = useFunnel30d(site);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="flex flex-col">
        <RoleDiagram
          role={role}
          onJump={onJump}
          metrics={funnel?.stages}
          yields={role === "crm" ? funnel?.yield : undefined}
          outcomes={role === "crm" ? funnel?.outcomes : undefined}
          showStats={showStats}
          site={funnel?.site ?? null}
        />

        {failed ? (
          <p className="mt-2 text-xs text-gray-500">
            The 30-day tracker could not be loaded, so the steps are showing without
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
