/**
 * lib/providers — THE front door for reading/resolving a provider.
 *
 * This module is the single sanctioned way to read provider data. Features must
 * NOT query `olera-providers` or `business_profiles` directly; once migration is
 * complete an eslint guard bans raw `.from(...)` on those tables outside here.
 * See plans/provider-data-foundation.md (Step 1).
 *
 * Status: parity-first. Reads + (starting with the crons) writes.
 *  - PR #1 (provider detail page): `resolveProvider` / `resolveProviderForMeta`.
 *  - PR #2 (read-heavy routes): `searchProviders` (organization-search) +
 *    `getProviderEmailsByIds` (admin leads email-fallback).
 *  - PR #2b (admin directory): `listDirectory` / `countDirectory` /
 *    `exportDirectoryRows` (OP + orphan-BP union reads).
 *  - PR #3 (sitemap): `countActiveProviders` / `getActiveProviderGeoByCategory`
 *    / `getActiveProvidersForSitemapShard` / `getActiveClaimedProviderSlugs`.
 *  - Crons A (aggregate-views + google-reviews): `getProviderDimensionsByIdentifiers`
 *    + `getClaimedProviderSlugs` / `getProvidersForReviewRefresh` /
 *    `updateProviderGoogleReviews` (first provider-table WRITE behind the door).
 */
export type { ProviderView, ProviderSource, ResolveResult } from "./types";
export { directoryRowToProvider, accountRowToProvider } from "./adapters";
export {
  resolveProvider,
  resolveProviderForMeta,
  getClaimedAccount,
  getProviderEmailsByIds,
  getProviderDimensionsByIdentifiers,
} from "./resolve.server";
export type { ProviderMeta, ClaimedAccount, ProviderDimensions } from "./resolve.server";
export {
  getClaimedProviderSlugs,
  getProvidersForReviewRefresh,
  updateProviderGoogleReviews,
} from "./reviews.server";
export type { ReviewRefreshProvider } from "./reviews.server";
export { searchProviders } from "./search.server";
export type { ProviderSearchResponse } from "./search.server";
export { countDirectory, listDirectory, exportDirectoryRows } from "./directory.server";
export type {
  DirectoryFilters,
  DirectoryListPage,
  DirectoryExportRow,
  DirectoryExportResult,
} from "./directory.server";
export {
  countActiveProviders,
  getActiveProviderGeoByCategory,
  getActiveProvidersForSitemapShard,
  getActiveClaimedProviderSlugs,
} from "./sitemap.server";
export type { ProviderGeoCombo, SitemapProviderRow } from "./sitemap.server";

// The canonical-id resolver already lived here; re-export so the front door is
// the one import site for provider identity too.
export { resolveCanonicalProviderId } from "@/lib/provider-identity";
