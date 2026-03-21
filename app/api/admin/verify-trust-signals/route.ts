import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getAuthUser, isMasterAdmin } from "@/lib/admin";
import { verifyProviderTrustSignals, NON_CMS_CATEGORIES } from "@/lib/ai-trust-signals";

/**
 * Admin endpoint: AI-powered trust signal verification for providers
 * not covered by CMS (non-medical home care, assisted living, etc.)
 *
 * Uses Perplexity Sonar API for grounded web search with citations.
 * Cost: ~$1 per 1,000 providers.
 *
 * Query params:
 *   ?state=TX           — process providers in this state (required)
 *   &limit=20           — max providers per batch (default 20, max 30)
 *   &offset=0           — skip first N eligible providers
 *   &dry_run=true       — just count eligible, don't call AI
 *   &force=true         — re-verify even if already verified
 *   &categories=...     — comma-separated category filter (defaults to non-CMS categories)
 *
 * Usage:
 *   1. ?state=TX&dry_run=true — see how many providers need verification
 *   2. ?state=TX&limit=5 — verify 5 providers (test run)
 *   3. ?state=TX&limit=20&offset=0 — batch through all TX providers
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !(await isMasterAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const state = searchParams.get("state")?.toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 30);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const dryRun = searchParams.get("dry_run") === "true";
  const force = searchParams.get("force") === "true";
  const categoriesParam = searchParams.get("categories");
  const categories = categoriesParam
    ? categoriesParam.split(",").map((c) => c.trim()).filter(Boolean)
    : NON_CMS_CATEGORIES;

  if (!state || state.length !== 2) {
    return NextResponse.json(
      { error: "state parameter required (2-letter code, e.g. TX)" },
      { status: 400 },
    );
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    return NextResponse.json(
      { error: "PERPLEXITY_API_KEY not configured" },
      { status: 500 },
    );
  }

  const db = getServiceClient();

  try {
    // Count total eligible
    let countQuery = db
      .from("olera-providers")
      .select("provider_id", { count: "exact", head: true })
      .eq("state", state)
      .or("deleted.is.null,deleted.eq.false")
      .in("provider_category", categories);

    if (!force) {
      countQuery = countQuery.is("ai_trust_signals", null);
    }

    const { count: totalEligible, error: countErr } = await countQuery;
    if (countErr) {
      console.error("[verify-trust-signals] Count error:", countErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        state,
        total_eligible: totalEligible,
        categories,
        estimated_cost: `$${((totalEligible ?? 0) / 1000).toFixed(2)}`,
        message: `${totalEligible} providers eligible for AI verification.`,
      });
    }

    // Fetch the batch
    let dataQuery = db
      .from("olera-providers")
      .select("provider_id, provider_name, address, city, state, zipcode, provider_category, website")
      .eq("state", state)
      .or("deleted.is.null,deleted.eq.false")
      .in("provider_category", categories)
      .order("provider_id", { ascending: true })
      .range(offset, offset + limit - 1);

    if (!force) {
      dataQuery = dataQuery.is("ai_trust_signals", null);
    }

    const { data: providers, error: fetchErr } = await dataQuery;
    if (fetchErr) {
      console.error("[verify-trust-signals] Fetch error:", fetchErr);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    if (!providers?.length) {
      return NextResponse.json({
        message: "No providers in this batch",
        state,
        offset,
        limit,
        total_eligible: totalEligible,
        processed: 0,
      });
    }

    let verified = 0;
    let errors = 0;
    let totalConfirmed = 0;
    const errorDetails: string[] = [];

    for (const p of providers) {
      try {
        const signals = await verifyProviderTrustSignals({
          provider_name: p.provider_name,
          address: p.address,
          city: p.city,
          state: p.state,
          zipcode: p.zipcode,
          provider_category: p.provider_category,
          website: p.website,
        });

        const { error: updateErr } = await db
          .from("olera-providers")
          .update({ ai_trust_signals: signals })
          .eq("provider_id", p.provider_id);

        if (updateErr) {
          console.error(`[verify-trust-signals] Update failed for ${p.provider_id}:`, updateErr);
          errors++;
          errorDetails.push(`${p.provider_name}: DB update failed`);
        } else {
          verified++;
          totalConfirmed += signals.summary_score;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[verify-trust-signals] Failed for ${p.provider_name}:`, msg);
        errors++;
        errorDetails.push(`${p.provider_name}: ${msg.slice(0, 100)}`);

        // If Perplexity returns 429, stop early
        if (msg.includes("429")) {
          errorDetails.push("Rate limited — stopping batch early");
          break;
        }
      }

      // Small delay between requests to respect rate limits
      if (providers.indexOf(p) < providers.length - 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return NextResponse.json({
      message: "Verification batch complete",
      state,
      offset,
      limit,
      total_eligible: totalEligible,
      processed: providers.length,
      verified,
      errors,
      avg_confirmed_signals: verified > 0 ? (totalConfirmed / verified).toFixed(1) : "0",
      next_offset: offset + limit < (totalEligible ?? 0) ? offset + limit : null,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[verify-trust-signals] Unexpected error:", message);
    return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
  }
}
