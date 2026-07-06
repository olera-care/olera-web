"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// When multiple hook instances write within the same render pass (e.g. a
// direction toggle that also resets a filter), the useSearchParams snapshot
// is stale for every write after the first — composing on it would drop the
// earlier write. Track the most recently written query string so later
// writes stack on top of it instead.
let pendingSearch: string | null = null;

/**
 * Named filter state synced to a URL search param, so refresh, back-nav and
 * deep links all work. Mirrors the pattern used on /admin/analytics: local
 * state for instant UI, `router.replace` (no scroll, no history entries) to
 * keep the URL shareable, and the param is omitted when the value equals the
 * default.
 *
 *   const [tab, setTab] = useUrlFilterState("tab", "all");
 *
 * Values are plain strings; validate/narrow at the call site if the param
 * can arrive from an untrusted deep link.
 */
export function useUrlFilterState<T extends string = string>(
  key: string,
  defaultValue: T
): [T, (next: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get(key);

  const [value, setValue] = useState<T>((urlValue as T | null) ?? defaultValue);

  // Keep state in sync when the URL changes (back/forward, cross-links from
  // another surface). A new snapshot also means the router has processed any
  // queued writes, so the composition overlay is done.
  useEffect(() => {
    pendingSearch = null;
    const next = (urlValue as T | null) ?? defaultValue;
    setValue((prev) => (prev === next ? prev : next));
    // Only react to URL changes — defaultValue is expected to be stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const set = useCallback(
    (next: T) => {
      setValue(next);
      const params = new URLSearchParams(pendingSearch ?? searchParams.toString());
      if (next === defaultValue) params.delete(key);
      else params.set(key, next);
      const qs = params.toString();
      pendingSearch = qs;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, defaultValue, router, pathname, searchParams]
  );

  return [value, set];
}
