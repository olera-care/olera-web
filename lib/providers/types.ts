import type { Profile, GoogleReviewsData, CMSData, AiTrustSignals } from "@/lib/types";

/**
 * Which underlying table a provider resolved from.
 * - `directory` = the `olera-providers` catalog row (the iOS-era directory).
 * - `account`   = a claimed `business_profiles` row.
 *
 * Step 1 is parity-first: a provider resolves to ONE source, never a merge of
 * both. The directory+account merge is Step 2's first task. See
 * plans/provider-data-foundation.md.
 */
export type ProviderSource = "directory" | "account";

/**
 * A fully-resolved provider, normalized from whichever table it lives in.
 * `profile` is the same `Profile` shape the UI already consumes; the rest are
 * the side-channel fields the provider detail page reads alongside it.
 */
export interface ProviderView {
  /** Normalized profile (UI-facing shape). */
  profile: Profile;
  /** Which table this resolved from. */
  source: ProviderSource;
  /** Underlying raw id: `olera-providers.provider_id` or `business_profiles.id`. */
  rawProviderId: string | null;
  placeId: string | null;
  googleReviewsData: GoogleReviewsData | null;
  cmsData: CMSData | null;
  aiTrustSignals: AiTrustSignals | null;
  parentOrganization: { name: string; url?: string } | null;
}

/**
 * Result of resolving a provider by slug-or-id. The caller (a page/route)
 * decides control flow — the resolver never calls `notFound()` /
 * `permanentRedirect()` itself, so those framework throws stay at the
 * page boundary.
 *  - `active`    → render `provider`
 *  - `redirect`  → 301 to `to` (soft-deleted, reason ≠ provider_request)
 *  - `gone`      → 410/404 (soft-deleted, reason = provider_request)
 *  - `not-found` → 404
 */
export type ResolveResult =
  | { kind: "active"; provider: ProviderView }
  | { kind: "redirect"; to: string }
  | { kind: "gone" }
  | { kind: "not-found" };
