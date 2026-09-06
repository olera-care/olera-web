"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DateRangePopover, {
  resolveRange,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import { useUrlDateRangeState } from "@/hooks/useUrlDateRangeState";
import OperatingMap, { type MetricNodes } from "./OperatingMap";
import MapChecks from "./MapChecks";
import NodeInspector from "./NodeInspector";
import type { MapCheck } from "@/lib/operating-map/checks";

/**
 * Scope and period for the map, both held in the URL so a view can be linked
 * the way the rest of the admin console links its reporting.
 *
 * The range control lives here rather than inside the figure on purpose: the
 * figure is scaled down to fit the screen, and a control rendered inside it
 * would shrink with everything else.
 */

/**
 * 30 days rather than the console's usual default. Referrer classification
 * shipped 2026-08-12, so a longer window would mostly report the period
 * before organic traffic could be identified at all.
 */
const DEFAULT_RANGE: DateRangeValue = { preset: "30d", customFrom: "", customTo: "" };

export default function OperatingMapView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCity = searchParams.get("city");

  const [range, setRange] = useUrlDateRangeState(DEFAULT_RANGE);
  const resolved = useMemo(() => resolveRange(range), [range]);

  const [nodes, setNodes] = useState<MetricNodes>({});
  const [checks, setChecks] = useState<MapCheck[]>([]);
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const onSelectCity = useCallback(
    (slug: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (slug) next.set("city", slug);
      else next.delete("city");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (resolved.from) params.set("date_from", resolved.from);
    if (resolved.to) params.set("date_to", resolved.to);
    if (selectedCity) params.set("city", selectedCity);

    setMetricsLoading(true);
    fetch(`/api/admin/operating-map/metrics?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("metrics failed"))))
      .then((d) => {
        setNodes((d.nodes ?? {}) as MetricNodes);
        setChecks((d.checks ?? []) as MapCheck[]);
        setMetricsLoading(false);
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        // Every instrumented node renders as unavailable rather than zero.
        setNodes({ cr2: { value: null, caveat: "This metric failed to load." } });
        setChecks([]);
        setMetricsLoading(false);
      });

    return () => controller.abort();
  }, [resolved.from, resolved.to, selectedCity]);

  // The inspector reads the same window and city the numbers were counted
  // over, so its rows can never describe a different query than the value.
  const inspectParams = useMemo(() => {
    const p = new URLSearchParams();
    if (resolved.from) p.set("date_from", resolved.from);
    if (resolved.to) p.set("date_to", resolved.to);
    if (selectedCity) p.set("city", selectedCity);
    return p.toString();
  }, [resolved.from, resolved.to, selectedCity]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <MapChecks checks={checks} />
        </div>
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      <OperatingMap
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        nodes={nodes}
        metricsLoading={metricsLoading}
        onInspect={setInspecting}
      />

      {inspecting && (
        <NodeInspector
          node={inspecting}
          params={inspectParams}
          onClose={() => setInspecting(null)}
        />
      )}
    </div>
  );
}
