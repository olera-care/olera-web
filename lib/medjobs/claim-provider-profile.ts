/**
 * resolveOrClaimProviderProfile — the single owned-claim primitive for the
 * MedJobs conversion paths (self-serve `pilot/activate` + admin
 * `handleMakeClient`). Cold-provider stabilization, Chunk 0 (2026-06-04).
 *
 * WHY THIS EXISTS
 * Both MedJobs conversion paths used to create a `business_profiles` row
 * inline, each with three defects:
 *   - D-DUP   no dedup against an existing `source_provider_id` claim →
 *             a second profile for the same directory listing.
 *   - D-OWNER no `account_id` set → an orphaned "claimed" profile nobody owns.
 *   - D-SLUG  raw `olera-providers` slug instead of a uniqueness-checked slug.
 *
 * This primitive replicates the behavior the DIRECTORY claim path
 * (`/api/provider/claim-instant`) already enforces — resolve-by
 * `source_provider_id`, set `account_id`, unique slug — so the broken MedJobs
 * paths converge on the proven directory semantics. It does NOT modify any
 * directory claim path; those stay byte-for-byte untouched (directory-safety
 * guardrail, see plans/medjobs-cold-provider-journey-stabilization.md).
 *
 * INVARIANT: at most one non-rejected `business_profiles` row per
 * `source_provider_id`. The public directory page and the hiring workspace
 * are the two faces of that single owned row.
 *
 * CO-TENANCY (decision 3): when a profile already exists under a DIFFERENT
 * account, we never duplicate and never transfer ownership — we return
 * `{ conflict: true }` and leave the row untouched. The caller signs the
 * clicker in read-only and surfaces "ask to join the team".
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateUniqueSlug } from "@/lib/slug";
import { directoryHydrationFields, DIRECTORY_HYDRATION_COLUMNS } from "@/lib/providers/directory-hydrate";

export interface ClaimArgs {
  /** The olera-providers directory id (= outreach research_data.olera_provider_id). */
  oleraProviderId: string;
  /** The claiming org's account id. Always set by the self-serve activation
   *  path (the only conversion path now that admin-on-behalf was removed).
   *  Nullable is retained only so the primitive can still ADOPT a legacy
   *  unowned "claimed" row left by the old admin path — it never CREATES a new
   *  unowned row in practice. */
  accountId: string | null;
  /** Pilot metadata to merge onto business_profiles.metadata
   *  (interview_terms_accepted_at, pilot_active_through, terms_accepted_via). */
  pilotMetadata: Record<string, unknown>;
  /** Fallback display name when the directory row has none. */
  fallbackName?: string | null;
}

export interface ClaimResult {
  business_profile_id: string | null;
  /** A new business_profiles row was inserted. */
  created: boolean;
  /** Existing profile owned by a different account — caller handles
   *  co-tenancy. No mutation was performed. */
  conflict: boolean;
}

/**
 * Resolve the canonical owned profile for a directory listing, claiming it
 * (claim_state="claimed") and stamping pilot metadata. Idempotent.
 *
 * Pass a service-role client (mutations require it).
 */
export async function resolveOrClaimProviderProfile(
  db: SupabaseClient,
  args: ClaimArgs,
): Promise<ClaimResult> {
  const { oleraProviderId, accountId, pilotMetadata } = args;
  const nowIso = new Date().toISOString();

  // ── Resolve by source_provider_id ──────────────────────────────────────
  // Fetch-then-filter (rather than `.neq("claim_state","rejected")`) so we
  // also catch legacy rows with a NULL claim_state — a PostgREST `neq` would
  // skip those and we'd mint a duplicate, defeating the whole point.
  const { data: candidates } = await db
    .from("business_profiles")
    .select("id, account_id, metadata, claim_state")
    .eq("source_provider_id", oleraProviderId)
    .order("created_at", { ascending: true });
  const existing =
    ((candidates ?? []) as Array<{
      id: string;
      account_id: string | null;
      metadata: Record<string, unknown> | null;
      claim_state: string | null;
    }>).find((r) => r.claim_state !== "rejected") ?? null;

  if (existing) {
    const existingAccountId = (existing.account_id as string | null) ?? null;

    // Owned by a different account → co-tenancy. Never duplicate or transfer.
    if (existingAccountId && accountId && existingAccountId !== accountId) {
      return { business_profile_id: existing.id as string, created: false, conflict: true };
    }

    // Same owner, or currently unowned → adopt + claim + stamp pilot metadata.
    const mergedMeta = {
      ...(((existing.metadata as Record<string, unknown> | null) ?? {})),
      ...pilotMetadata,
    };
    const patch: Record<string, unknown> = {
      metadata: mergedMeta,
      claim_state: "claimed",
      updated_at: nowIso,
    };
    // Adopt an unowned row (e.g. created earlier by admin handleMakeClient).
    if (!existingAccountId && accountId) patch.account_id = accountId;

    const { error: updErr } = await db
      .from("business_profiles")
      .update(patch)
      .eq("id", existing.id);
    if (updErr) throw new Error(`claim update failed: ${updErr.message}`);

    return { business_profile_id: existing.id as string, created: false, conflict: false };
  }

  // ── No profile yet → create one from the directory row ──────────────────
  // Pull the full DISPLAY data too, so the claimed profile is hydrated (one
  // complete, editable record) rather than a thin shell.
  const { data: op, error: opErr } = await db
    .from("olera-providers")
    .select(
      `provider_id, provider_name, city, state, email, phone, website, address, zipcode, ${DIRECTORY_HYDRATION_COLUMNS}`,
    )
    .eq("provider_id", oleraProviderId)
    .maybeSingle();
  if (opErr || !op) {
    throw new Error(`olera-providers entry not found: ${oleraProviderId}`);
  }

  const displayName = (op.provider_name as string | null) || args.fallbackName || "Provider";
  const slug = await generateUniqueSlug(
    db,
    displayName,
    (op.city as string | null) || "",
    (op.state as string | null) || "",
  );

  const hydration = directoryHydrationFields(op as Record<string, unknown>);

  const { data: newBp, error: createErr } = await db
    .from("business_profiles")
    .insert({
      account_id: accountId, // may be null (admin-on-behalf); adopted later
      type: "organization",
      display_name: displayName,
      slug,
      city: op.city,
      state: op.state,
      email: op.email,
      phone: op.phone,
      website: op.website,
      address: op.address,
      zip: op.zipcode != null ? String(op.zipcode) : null,
      // Hydrated from the directory listing (the one record).
      description: hydration.description,
      care_types: hydration.care_types,
      category: hydration.category,
      image_url: hydration.image_url,
      source_provider_id: oleraProviderId,
      source: "claimed_from_directory",
      claim_state: "claimed",
      verification_state: "unverified", // claim != verification
      is_active: true,
      metadata: hydration.images.length ? { ...pilotMetadata, images: hydration.images } : pilotMetadata,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .single();
  if (createErr || !newBp) {
    throw new Error(`Failed to create business_profiles: ${createErr?.message ?? "unknown"}`);
  }

  return { business_profile_id: newBp.id as string, created: true, conflict: false };
}
