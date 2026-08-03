"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  dateRangeFromSearchParams,
  dateRangeSearchParams,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";

/**
 * Date-range state that survives refreshes, back/forward navigation, and
 * cross-links between admin reporting surfaces.
 */
export function useUrlDateRangeState(defaultValue: DateRangeValue) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState<DateRangeValue>(() =>
    dateRangeFromSearchParams(searchParams, defaultValue)
  );

  useEffect(() => {
    const next = dateRangeFromSearchParams(searchParams, defaultValue);
    setValue((current) =>
      current.preset === next.preset &&
      current.customFrom === next.customFrom &&
      current.customTo === next.customTo
        ? current
        : next
    );
  }, [searchParams, defaultValue]);

  const set = useCallback(
    (next: DateRangeValue) => {
      setValue(next);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("range");
      params.delete("from");
      params.delete("to");

      const nextRangeParams = dateRangeSearchParams(next);
      // Keep default ranges out of the URL unless a custom boundary is needed.
      if (next.preset !== defaultValue.preset || next.preset === "custom") {
        nextRangeParams.forEach((paramValue, key) => params.set(key, paramValue));
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [defaultValue.preset, pathname, router, searchParams]
  );

  return [value, set] as const;
}
