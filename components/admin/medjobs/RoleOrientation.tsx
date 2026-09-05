"use client";

import RoleDiagram from "@/components/admin/medjobs/RoleDiagram";
import { useFunnel30d } from "@/components/admin/medjobs/useFunnel30d";

/**
 * What sits above the reader on a role page: that role's steps, with their
 * trailing-30-day numbers, and one dashed step past each handoff.
 */

export default function RoleOrientation({
  role,
  onJump,
}: {
  role: "admin" | "sales" | "crm";
  onJump: (dest: string) => void;
}) {
  const { funnel, failed } = useFunnel30d();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Your steps{funnel ? ", last 30 days" : ""}
        </h2>
        <p className="text-xs text-gray-500">
          Click a step to jump the reader to it
          {funnel ? " · hover a number for what it counts" : ""}
        </p>
      </div>
      <RoleDiagram
        role={role}
        onJump={onJump}
        metrics={funnel?.stages}
        yields={role === "crm" ? funnel?.yield : undefined}
      />
      {failed ? (
        <p className="mt-2 text-xs text-gray-500">
          The 30-day tracker could not be loaded, so the steps are showing without
          numbers. The stages and handoffs are unaffected.
        </p>
      ) : null}
    </div>
  );
}
