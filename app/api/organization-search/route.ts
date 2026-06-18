import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStrategies,
  firstImageFromPipeList,
  pickStrongestClaimState,
  type SearchResult,
  type SearchStrategies,
} from "@/lib/organization-search";

/**
 * GET /api/organization-search
 *
 * Union search across `olera-providers` (scraped/seeded) and `business_profiles`
 * (user accounts/claims), deduplicated by canonical identity (source_provider_id).
 *
 * Query params:
 *   - q: search query (required, min 2 chars)
 *   - limit: max final results (default 100, max 200)
 */
const PER_STRATEGY_LIMIT = 500;

interface OpRow {
  provider_id: string;
  provider_name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  provider_images: string | null;
}

interface BpRow {
  id: string;
  display_name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  claim_state: string | null;
  source_provider_id: string | null;
  image_url: string | null;
}

// PostgREST `.or()` uses commas to separate filter clauses, so commas in the
// user's query would corrupt the string. Strip commas and parens defensively.
function sanitizeForOr(s: string): string {
  return s.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
}

async function queryOleraProviders(
  db: SupabaseClient,
  strategies: SearchStrategies
): Promise<OpRow[]> {
  const safeFull = sanitizeForOr(strategies.fullPhrase);
  const fullPattern = `*${safeFull}*`;
  const columns =
    "provider_id, provider_name, slug, city, state, email, provider_images";

  const fullPhraseQuery = db
    .from("olera-providers")
    .select(columns)
    .not("deleted", "is", true)
    .or(`provider_name.ilike.${fullPattern},city.ilike.${fullPattern}`)
    .order("provider_name", { ascending: true })
    .limit(PER_STRATEGY_LIMIT);

  const multiWordQuery =
    strategies.isMultiWord && strategies.nameWords && strategies.lastWord
      ? db
          .from("olera-providers")
          .select(columns)
          .not("deleted", "is", true)
          .ilike("provider_name", `%${strategies.nameWords}%`)
          .ilike("city", `%${strategies.lastWord}%`)
          .order("provider_name", { ascending: true })
          .limit(PER_STRATEGY_LIMIT)
      : Promise.resolve({ data: [] as OpRow[], error: null });

  const [fullResult, multiResult] = await Promise.all([fullPhraseQuery, multiWordQuery]);

  if (fullResult.error) {
    console.error("[organization-search] op full-phrase error:", fullResult.error);
  }
  if ("error" in multiResult && multiResult.error) {
    console.error("[organization-search] op multi-word error:", multiResult.error);
  }

  const combined: OpRow[] = [
    ...((fullResult.data as OpRow[] | null) || []),
    ...((multiResult.data as OpRow[] | null) || []),
  ];
  const seen = new Set<string>();
  const deduped: OpRow[] = [];
  for (const row of combined) {
    if (seen.has(row.provider_id)) continue;
    seen.add(row.provider_id);
    deduped.push(row);
  }
  return deduped;
}

async function queryBusinessProfiles(
  db: SupabaseClient,
  strategies: SearchStrategies
): Promise<BpRow[]> {
  const safeFull = sanitizeForOr(strategies.fullPhrase);
  const fullPattern = `*${safeFull}*`;
  const columns =
    "id, display_name, slug, city, state, email, claim_state, source_provider_id, image_url";

  // Null-safe guard: never surface MedJobs guest profiles (metadata.is_guest)
  // in search — they're inactive placeholders from "Continue as guest".
  const notGuest = "metadata->>is_guest.is.null,metadata->>is_guest.neq.true";

  const fullPhraseQuery = db
    .from("business_profiles")
    .select(columns)
    .in("type", ["organization", "caregiver"])
    .or(`display_name.ilike.${fullPattern},city.ilike.${fullPattern}`)
    .or(notGuest)
    .order("display_name", { ascending: true })
    .limit(PER_STRATEGY_LIMIT);

  const multiWordQuery =
    strategies.isMultiWord && strategies.nameWords && strategies.lastWord
      ? db
          .from("business_profiles")
          .select(columns)
          .in("type", ["organization", "caregiver"])
          .ilike("display_name", `%${strategies.nameWords}%`)
          .ilike("city", `%${strategies.lastWord}%`)
          .or(notGuest)
          .order("display_name", { ascending: true })
          .limit(PER_STRATEGY_LIMIT)
      : Promise.resolve({ data: [] as BpRow[], error: null });

  const [fullResult, multiResult] = await Promise.all([fullPhraseQuery, multiWordQuery]);

  if (fullResult.error) {
    console.error("[organization-search] bp full-phrase error:", fullResult.error);
  }
  if ("error" in multiResult && multiResult.error) {
    console.error("[organization-search] bp multi-word error:", multiResult.error);
  }

  const combined: BpRow[] = [
    ...((fullResult.data as BpRow[] | null) || []),
    ...((multiResult.data as BpRow[] | null) || []),
  ];
  const seen = new Set<string>();
  const deduped: BpRow[] = [];
  for (const row of combined) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    deduped.push(row);
  }
  return deduped;
}

function mergeByCanonicalIdentity(
  ops: OpRow[],
  bps: BpRow[]
): SearchResult[] {
  // Index BPs by their source_provider_id (only for linked BPs)
  const bpsByOpId = new Map<string, BpRow[]>();
  for (const bp of bps) {
    if (!bp.source_provider_id) continue;
    const bucket = bpsByOpId.get(bp.source_provider_id) ?? [];
    bucket.push(bp);
    bpsByOpId.set(bp.source_provider_id, bucket);
  }

  const merged: SearchResult[] = [];
  const emittedOpIds = new Set<string>();

  // Pass 1: OPs are the canonical display source. Layer BP claim data where linked.
  for (const op of ops) {
    const linkedBps = bpsByOpId.get(op.provider_id) ?? [];
    const claimState = pickStrongestClaimState(linkedBps.map((b) => b.claim_state));
    // Prefer the claimed BP's email (provider-owned inbox). Fall back to OP's scraped email.
    const claimedBpWithEmail = linkedBps.find(
      (b) => b.claim_state === "claimed" && b.email
    );
    const email = claimedBpWithEmail?.email ?? op.email ?? null;

    // Defensive: ensure all fields are strings to prevent React Error #310
    merged.push({
      id: String(op.provider_id || ""),
      name: String(op.provider_name || ""),
      slug: String(op.slug || op.provider_id || ""),
      city: op.city ? String(op.city) : null,
      state: op.state ? String(op.state) : null,
      email: email ? String(email) : null,
      claimState,
      source: "olera-providers",
      providerId: String(op.provider_id || ""),
      imageUrl: firstImageFromPipeList(op.provider_images),
    });
    emittedOpIds.add(op.provider_id);
  }

  // Pass 2: BP-only orphans and BPs linked to OPs that didn't match the query.
  const seenBpIds = new Set<string>();
  for (const bp of bps) {
    if (seenBpIds.has(bp.id)) continue;
    // If this BP is linked to an OP we already emitted, skip (already merged in pass 1)
    if (bp.source_provider_id && emittedOpIds.has(bp.source_provider_id)) continue;
    seenBpIds.add(bp.id);

    // Defensive: ensure all fields are strings to prevent React Error #310
    merged.push({
      id: String(bp.id || ""),
      name: String(bp.display_name || ""),
      slug: String(bp.slug || bp.id || ""),
      city: bp.city ? String(bp.city) : null,
      state: bp.state ? String(bp.state) : null,
      email: bp.email ? String(bp.email) : null,
      claimState: (bp.claim_state as SearchResult["claimState"]) || null,
      source: "business_profiles",
      providerId: String(bp.source_provider_id || bp.id || ""),
      imageUrl: bp.image_url ? String(bp.image_url) : null,
    });
  }

  return merged;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)));

    if (query.length < 2) {
      return NextResponse.json({ results: [], total: 0 });
    }

    const db = getServiceClient();
    const strategies = buildStrategies(query);

    // Run both source queries independently — partial failures degrade gracefully.
    const [opSettled, bpSettled] = await Promise.allSettled([
      queryOleraProviders(db, strategies),
      queryBusinessProfiles(db, strategies),
    ]);

    const ops = opSettled.status === "fulfilled" ? opSettled.value : [];
    const bps = bpSettled.status === "fulfilled" ? bpSettled.value : [];

    if (opSettled.status === "rejected") {
      console.error("[organization-search] op query rejected:", opSettled.reason);
    }
    if (bpSettled.status === "rejected") {
      console.error("[organization-search] bp query rejected:", bpSettled.reason);
    }
    if (opSettled.status === "rejected" && bpSettled.status === "rejected") {
      return NextResponse.json(
        { error: "Failed to search organizations" },
        { status: 500 }
      );
    }

    const merged = mergeByCanonicalIdentity(ops, bps);
    merged.sort((a, b) => a.name.localeCompare(b.name));
    const capped = merged.slice(0, limit);

    console.log(
      `[organization-search] op=${ops.length} bp=${bps.length} merged=${merged.length} capped=${capped.length} query=${JSON.stringify(query)}`
    );

    return NextResponse.json({ results: capped, total: merged.length });
  } catch (err) {
    console.error("[organization-search] Error:", err);
    return NextResponse.json(
      { error: "Failed to search organizations" },
      { status: 500 }
    );
  }
}
