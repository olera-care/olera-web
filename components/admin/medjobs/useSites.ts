"use client";

import { useCallback, useEffect, useState } from "react";
import type { Health } from "@/lib/medjobs/funnel-health";

/** One scored site, as the site-health route returns it. */
export interface SiteRow {
  slug: string;
  name: string;
  logoUrl: string | null;
  score: number;
  status: Health;
  reads: string;
}

/**
 * Every targeted university, scored. Two things read this list — the
 * navigator beside the map, and the map's own CW1 header, which counts it —
 * so the page owns one fetch and hands the result to both rather than each
 * asking for the same rows.
 *
 * `reload` exists for the moment a site is added, which is the only thing
 * that changes the list from inside the page.
 */
export function useSites() {
  const [rows, setRows] = useState<SiteRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/medjobs/site-health");
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as { sites: SiteRow[] };
      setRows(d.sites);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rows, failed, reload };
}
