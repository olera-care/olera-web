/**
 * lib/providers — THE front door for reading/resolving a provider.
 *
 * This module is the single sanctioned way to read provider data. Features must
 * NOT query `olera-providers` or `business_profiles` directly; once migration is
 * complete an eslint guard bans raw `.from(...)` on those tables outside here.
 * See plans/provider-data-foundation.md (Step 1).
 *
 * Status: parity-first, reads only.
 *  - PR #1 (provider detail page): `resolveProvider` / `resolveProviderForMeta`.
 *  - PR #2 (read-heavy routes): `searchProviders` (organization-search) +
 *    `getProviderEmailsByIds` (admin leads email-fallback).
 */
export type { ProviderView, ProviderSource, ResolveResult } from "./types";
export { directoryRowToProvider, accountRowToProvider } from "./adapters";
export {
  resolveProvider,
  resolveProviderForMeta,
  getClaimedAccount,
  getProviderEmailsByIds,
} from "./resolve.server";
export type { ProviderMeta, ClaimedAccount } from "./resolve.server";
export { searchProviders } from "./search.server";
export type { ProviderSearchResponse } from "./search.server";

// The canonical-id resolver already lived here; re-export so the front door is
// the one import site for provider identity too.
export { resolveCanonicalProviderId } from "@/lib/provider-identity";
