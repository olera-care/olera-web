import { fetchPlaceRatingCount } from "@/lib/google-places";

/**
 * Per-provider "self rank" overlay for the market diagnostic.
 *
 * The cached diagnostic (market_diagnostics) is shared by city × care-type — it must NOT carry
 * any one provider's position. This module computes a provider's own rank at READ time by
 * matching their Google `place_id` against the cached `competitorLandscape.ranked` array
 * (persisted by the step-1 cache-shape change), so the same shared cache serves every provider.
 *
 * Two surfaces call this:
 *   - the serve route (app/api/provider/market-diagnostic) → returns `self` alongside `data`
 *   - the weekly provider digest cron (future) → reads the cached diagnostic + provider place_id
 *     directly, no HTTP round-trip.
 *
 * Match strategy: exact `place_id` join (the reliable key, 87–95% provider coverage). When the
 * provider isn't in the surfaced competitor set at all, `resolveSelfRank` fires ONE lean Places
 * lookup by their place_id, inserts them at their true position, and derives the rank — so a
 * provider Google didn't return in the city search still gets an honest rank instead of vanishing.
 */

/** A single competitor row as persisted in competitorLandscape.ranked (step-1 shape). */
export interface RankedEntry {
  id?: string;
  name: string;
  reviews: number;
  rating: number | null;
  shareOfVoicePct: number;
}

export interface SelfRank {
  rank: number;            // 1-based position among home-care agencies in the catchment
  outOf: number;           // total agencies ranked (incl. self)
  reviews: number;
  rating: number | null;
  shareOfVoicePct: number;
  /** "place_id" = found in the surfaced set; "fetched" = absent, looked up + inserted. */
  matchedBy: "place_id" | "fetched";
}

/** Exact place_id match against the ranked list. Returns the row + its 0-based index, or null. */
export function findSelfIndex(
  ranked: RankedEntry[],
  placeId: string,
): { entry: RankedEntry; index: number } | null {
  if (!placeId) return null;
  const index = ranked.findIndex((r) => r.id && r.id === placeId);
  return index === -1 ? null : { entry: ranked[index], index };
}

/**
 * Build the SelfRank from a provider already located in `ranked` (exact place_id match).
 * Rank + SoV come straight from the shared cache — zero cost, fully consistent with the bars.
 */
function fromMatched(ranked: RankedEntry[], index: number): SelfRank {
  const entry = ranked[index];
  return {
    rank: index + 1,
    outOf: ranked.length,
    reviews: entry.reviews,
    rating: entry.rating,
    shareOfVoicePct: entry.shareOfVoicePct,
    matchedBy: "place_id",
  };
}

/**
 * Build the SelfRank for a provider NOT in the surfaced set, by inserting their fetched
 * review count at the correct position. Rank = (# competitors with more reviews) + 1.
 * `totalReviewsInMarket` is the denominator the cached leaders' SoV already used; we reuse it
 * so the provider's bar is comparable to theirs (the ~1-agency denominator difference from
 * inserting an outsider is immaterial at display precision).
 */
function fromFetched(
  ranked: RankedEntry[],
  totalReviewsInMarket: number,
  self: { reviews: number; rating: number | null },
): SelfRank {
  const ahead = ranked.reduce((n, r) => n + ((r.reviews || 0) > self.reviews ? 1 : 0), 0);
  const denom = totalReviewsInMarket + self.reviews; // self wasn't in the market pull → add them
  return {
    rank: ahead + 1,
    outOf: ranked.length + 1,
    reviews: self.reviews,
    rating: self.rating,
    shareOfVoicePct: denom ? +((self.reviews / denom) * 100).toFixed(1) : 0,
    matchedBy: "fetched",
  };
}

/** Injectable fetcher so callers/tests can stub the Places lookup. */
export type RatingCountFetcher = (
  placeId: string,
) => Promise<{ rating: number | null; reviewCount: number } | null>;

/**
 * Resolve a provider's rank within their cached market.
 *   1. Exact place_id match in `ranked`           → free, consistent with the bars.
 *   2. Miss + fetchMissing                         → one lean Places lookup, insert, derive rank.
 *   3. No place_id / not found / fetch failed      → null (caller falls back to name-match UI).
 */
export async function resolveSelfRank(
  args: {
    ranked: RankedEntry[] | undefined | null;
    totalReviewsInMarket: number;
    placeId: string | null | undefined;
    fetchMissing?: boolean;
  },
  fetcher: RatingCountFetcher = fetchPlaceRatingCount,
): Promise<SelfRank | null> {
  const { ranked, totalReviewsInMarket, placeId, fetchMissing = true } = args;
  if (!placeId || !ranked || ranked.length === 0) return null;

  const matched = findSelfIndex(ranked, placeId);
  if (matched) return fromMatched(ranked, matched.index);

  if (!fetchMissing) return null;
  const fetched = await fetcher(placeId);
  if (!fetched || !fetched.reviewCount) return null;
  return fromFetched(ranked, totalReviewsInMarket, { reviews: fetched.reviewCount, rating: fetched.rating });
}
