"use client";

import { useEffect, useState } from "react";
import SystemArchitecture from "@/components/admin/medjobs/SystemArchitecture";
import type { FunnelResult } from "@/lib/medjobs/funnel-30d";

/**
 * What sits above the reader on the System page: the operating system as a
 * picture, and the two orientation assets next to it.
 *
 * The diagram is the same map that opens the master document, drawn rather
 * than rasterised so it stays sharp and so every stage can be a jump target.
 */

const VIDEO = "/api/admin/medjobs/sop?doc=video";
const WALKTHROUGH = "/api/admin/medjobs/sop?doc=walkthrough";

function Resource({
  href,
  kind,
  title,
  detail,
}: {
  href: string;
  kind: string;
  title: string;
  detail: string;
}) {
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
        <span className="block text-sm font-medium text-gray-900 group-hover:underline">
          {title}
        </span>
        <span className="block text-xs text-gray-500">{detail}</span>
      </span>
    </a>
  );
}

export default function SopOrientation({
  onJump,
}: {
  /** Jump the reader below to a PDF named destination. */
  onJump: (dest: string) => void;
}) {
  const [funnel, setFunnel] = useState<FunnelResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // The map is worth reading with or without the numbers, so a failure here
    // drops the tracker rather than the diagram.
    fetch("/api/admin/medjobs/funnel-30d")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: FunnelResult) => !cancelled && setFunnel(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-900">
            The operating system{funnel ? ", last 30 days" : ""}
          </h2>
          <p className="text-xs text-gray-500">
            Click any stage to jump the reader to it
            {funnel ? " · hover a number for what it counts" : ""}
          </p>
        </div>
        <SystemArchitecture onJump={onJump} metrics={funnel?.stages} yields={funnel?.yield} />
        {failed ? (
          <p className="mt-2 text-xs text-gray-500">
            The 30-day tracker could not be loaded, so the map is showing without
            numbers. The stages and handoffs are unaffected.
          </p>
        ) : null}
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
