"use client";

import { useEffect, useState } from "react";
import type { FunnelResult } from "@/lib/medjobs/funnel-30d";

/**
 * The trailing-30-day tracker, shared by the System map and the three role
 * diagrams. Fails soft: the map is worth reading with or without the numbers,
 * so a failure drops the tracker rather than the diagram.
 */
export function useFunnel30d(site?: string | null) {
  const [funnel, setFunnel] = useState<FunnelResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFunnel(null);
    setFailed(false);
    const qs = site ? `?site=${encodeURIComponent(site)}` : "";
    fetch(`/api/admin/medjobs/funnel-30d${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: FunnelResult) => !cancelled && setFunnel(d))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [site]);

  return { funnel, failed };
}
