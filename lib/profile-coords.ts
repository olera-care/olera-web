import { resolveCity } from "@/lib/market-diagnostic/resolve";

/**
 * Resolve approximate coordinates (city centroid) from a city + state, using the
 * canonical city dataset — the same resolver the market diagnostic uses to place a
 * provider. Returns null if the city isn't in the dataset.
 *
 * These are CITY-CENTER coordinates: precise enough for the ~50-mile "families near
 * you" catchment, but NOT a precise map pin. Server-only (reads the city dataset from
 * disk). Care seekers have no real coordinates (we never ask their address), so we
 * derive them from whatever location we know — their own city when they give it, or the
 * city of the provider they connected to as a fallback. See `setSeekerCoords` callers.
 */
export function resolveCoordsFromCity(
  city: string | null | undefined,
  state: string | null | undefined,
): { lat: number; lng: number } | null {
  if (!city || !state) return null;
  const resolved = resolveCity(city, state);
  return resolved ? { lat: resolved.lat, lng: resolved.lng } : null;
}
