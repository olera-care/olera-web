import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPowerPageUrlForDeletedProvider } from "@/lib/power-pages";
import type { Provider as IOSProvider } from "@/lib/types/provider";
import type { Profile, ClaimState, VerificationState } from "@/lib/types";
import { directoryRowToProvider, accountRowToProvider } from "./adapters";
import type { ResolveResult } from "./types";

/**
 * THE front door for resolving a provider by slug-or-id.
 *
 * Resolution order (parity with the original inline logic in
 * `app/provider/[slug]/page.tsx`):
 *   1. directory (`olera-providers`) by `slug`, then by `provider_id`
 *   2. claimed account (`business_profiles`) by `slug` (active org/caregiver)
 *   3. soft-deleted directory row → reason-aware redirect / gone
 *   4. not-found
 *
 * Pass the caller's Supabase client so RLS visibility (anon vs service-role
 * vs SSR) matches the call site — the resolver never picks its own client.
 *
 * Returns data only. The caller maps the result to `notFound()` /
 * `permanentRedirect()`, keeping those control-flow throws at the page boundary.
 */
export async function resolveProvider(
  slugOrId: string,
  db: SupabaseClient,
): Promise<ResolveResult> {
  // 1. Directory (olera-providers) — slug first, then legacy provider_id.
  try {
    const { data: bySlug } = await db
      .from("olera-providers")
      .select("*")
      .eq("slug", slugOrId)
      .not("deleted", "is", true)
      .single<IOSProvider>();
    if (bySlug) return { kind: "active", provider: directoryRowToProvider(bySlug) };

    const { data: byId } = await db
      .from("olera-providers")
      .select("*")
      .eq("provider_id", slugOrId)
      .not("deleted", "is", true)
      .single<IOSProvider>();
    if (byId) return { kind: "active", provider: directoryRowToProvider(byId) };
  } catch {
    // iOS Supabase not configured / not found — fall through.
  }

  // 2. Claimed account (business_profiles).
  try {
    const { data } = await db
      .from("business_profiles")
      .select("*")
      .eq("slug", slugOrId)
      .eq("is_active", true)
      .in("type", ["organization", "caregiver"])
      .single<Profile>();
    if (data) return { kind: "active", provider: accountRowToProvider(data) };
  } catch {
    // fall through
  }

  // 3. Reason-aware response for soft-deleted directory rows (migration 081).
  //    Runs AFTER both active lookups so a claimed account whose underlying
  //    directory row was soft-deleted still wins above.
  try {
    const { data: deletedRow } = await db
      .from("olera-providers")
      .select("provider_category, state, city, deletion_reason")
      .or(`slug.eq.${slugOrId},provider_id.eq.${slugOrId}`)
      .eq("deleted", true)
      .limit(1)
      .maybeSingle<{
        provider_category: string | null;
        state: string | null;
        city: string | null;
        deletion_reason: IOSProvider["deletion_reason"];
      }>();

    if (deletedRow) {
      if (deletedRow.deletion_reason === "provider_request") return { kind: "gone" };
      const to = buildPowerPageUrlForDeletedProvider({
        category: deletedRow.provider_category,
        state: deletedRow.state,
        city: deletedRow.city,
      });
      // A null url means no power page to land on → fall through to not-found,
      // matching the original `if (deletedRedirect) permanentRedirect(...)`.
      if (to) return { kind: "redirect", to };
    }
  } catch {
    // Supabase unreachable — fall through to not-found.
  }

  return { kind: "not-found" };
}

/**
 * The claimed-account fields a directory provider needs to know its real claim
 * state (the directory row always reads "unclaimed"). `metadata` is left as
 * `unknown` so the caller casts it to whatever metadata shape it expects.
 */
export interface ClaimedAccount {
  claim_state: ClaimState;
  account_id: string | null;
  metadata: unknown;
  verification_state: VerificationState | null;
}

/**
 * Directory → account linkage: given an `olera-providers.provider_id`, fetch the
 * claimed `business_profiles` row linked via `source_provider_id`, if any.
 */
export async function getClaimedAccount(
  sourceProviderId: string,
  db: SupabaseClient,
): Promise<ClaimedAccount | null> {
  try {
    const { data } = await db
      .from("business_profiles")
      .select("claim_state, account_id, metadata, verification_state")
      .eq("source_provider_id", sourceProviderId)
      .maybeSingle();
    return (data as ClaimedAccount | null) ?? null;
  } catch {
    return null;
  }
}

/** Lighter projection used for SEO metadata (no full row, no side-channels). */
export interface ProviderMeta {
  provider_name: string | null;
  provider_category: string | null;
  city: string | null;
  state: string | null;
  provider_description: string | null;
  provider_images: string | null;
  provider_logo: string | null;
}

/**
 * Resolve only the fields needed for `generateMetadata`. Mirrors
 * `resolveProvider`'s source order (directory by slug/id, then account),
 * mapping account columns onto the directory-shaped meta keys.
 */
export async function resolveProviderForMeta(
  slugOrId: string,
  db: SupabaseClient,
): Promise<ProviderMeta | null> {
  const COLS = "provider_name, provider_category, city, state, provider_description, provider_images, provider_logo";
  try {
    const { data: bySlug } = await db
      .from("olera-providers")
      .select(COLS)
      .eq("slug", slugOrId)
      .not("deleted", "is", true)
      .single();
    if (bySlug) return bySlug as unknown as ProviderMeta;

    const { data: byId } = await db
      .from("olera-providers")
      .select(COLS)
      .eq("provider_id", slugOrId)
      .not("deleted", "is", true)
      .single();
    if (byId) return byId as unknown as ProviderMeta;
  } catch {
    // fall through
  }

  try {
    const { data } = await db
      .from("business_profiles")
      .select("display_name, category, city, state, description, image_url")
      .eq("slug", slugOrId)
      .eq("is_active", true)
      .in("type", ["organization", "caregiver"])
      .single();
    if (data) {
      const d = data as unknown as {
        display_name: string | null;
        category: string | null;
        city: string | null;
        state: string | null;
        description: string | null;
        image_url: string | null;
      };
      return {
        provider_name: d.display_name,
        provider_category: d.category,
        city: d.city,
        state: d.state,
        provider_description: d.description,
        provider_images: null,
        provider_logo: d.image_url,
      };
    }
  } catch {
    // fall through
  }

  return null;
}
