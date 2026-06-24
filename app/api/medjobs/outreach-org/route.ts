import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { getProviderOwnership } from "@/lib/providers/ownership.server";

/**
 * GET /api/medjobs/outreach-org?outreach_id=...
 *
 * Chunk 5: resolves a cold-outreach row to its linked directory listing so the
 * public candidate board can pre-lock the eligibility screener to the
 * provider's OWN listing (they claim it instead of creating a duplicate).
 *
 * Public + read-only. Returns only public directory display fields shaped like
 * the screener's `SelectedOrg`. The `outreach_id` is a plain CRM row id (not an
 * auth token); it grants no access — the claim still requires the provider's
 * email + the normal claim flow. `claimState` lets the screener surface the
 * co-tenancy case (org already owned).
 */
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const outreachId = request.nextUrl.searchParams.get("outreach_id")?.trim();
  if (!outreachId) {
    return NextResponse.json({ error: "outreach_id required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: row } = await db
    .from("student_outreach")
    .select("organization_name, research_data")
    .eq("id", outreachId)
    .maybeSingle();
  if (!row) return NextResponse.json({ org: null });

  const research = ((row as { research_data: Record<string, unknown> | null })
    .research_data ?? {}) as { olera_provider_id?: string | null };
  const oleraProviderId = research.olera_provider_id ?? null;
  if (!oleraProviderId) return NextResponse.json({ org: null });

  const { data: op } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, slug, city, state, email")
    .eq("provider_id", oleraProviderId)
    .maybeSingle();
  if (!op) return NextResponse.json({ org: null });
  const o = op as {
    provider_id: string;
    provider_name: string | null;
    slug: string | null;
    city: string | null;
    state: string | null;
    email: string | null;
  };

  // Ownership → claimState so the screener can detect the co-tenancy case
  // (org already owned by an account → block the anon claim).
  const ownership = await getProviderOwnership(db, oleraProviderId);
  const claimState = ownership.owned
    ? "claimed"
    : (ownership.claimState as "unclaimed" | "pending" | "claimed" | null) ?? "unclaimed";

  return NextResponse.json({
    org: {
      name: o.provider_name || (row as { organization_name: string | null }).organization_name || "Provider",
      slug: o.slug ?? "",
      city: o.city,
      state: o.state,
      email: o.email,
      claimState,
      source: "olera-providers" as const,
      providerId: o.provider_id,
    },
  });
}
