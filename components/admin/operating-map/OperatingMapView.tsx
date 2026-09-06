"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DateRangePopover, {
  resolveRange,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import { useUrlDateRangeState } from "@/hooks/useUrlDateRangeState";
import OperatingMap, { type MetricNodes } from "./OperatingMap";

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

    setMetricsLoading(true);
    fetch(`/api/admin/operating-map/metrics?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("metrics failed"))))
      .then((d) => {
        setNodes((d.nodes ?? {}) as MetricNodes);
        setMetricsLoading(false);
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        // Every instrumented node renders as unavailable rather than zero.
        setNodes({ cr2: { value: null, note: "unavailable", allCities: true } });
        setMetricsLoading(false);
      });

    return () => controller.abort();
  }, [resolved.from, resolved.to]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      <OperatingMap
        selectedCity={selectedCity}
        onSelectCity={onSelectCity}
        nodes={nodes}
        metricsLoading={metricsLoading}
      />
    </div>
  );
}
