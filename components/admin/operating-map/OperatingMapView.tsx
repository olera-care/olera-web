"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import OperatingMap from "./OperatingMap";

/**
 * Holds the map's scope in the URL rather than component state, so a city
 * view can be linked and shared the same way the rest of the admin console
 * handles its date ranges.
 */
export default function OperatingMapView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCity = searchParams.get("city");

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

  return <OperatingMap selectedCity={selectedCity} onSelectCity={onSelectCity} />;
}
