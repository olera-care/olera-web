import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";
import { getThreadLead, getFamilyTimeline, postProviderMessage, type ThreadLead } from "@/lib/city-ads/thread.server";

/**
 * The shared thread for one family from a provider's own ad.
 *
 * GET  ?leadId=…              the merged timeline (lib/city-ads/thread.server.ts)
 * POST { leadId, body }       a message from the provider to the family
 *
 * Only for a lead handed to one of the caller's own campaigns.
 */

type Owned =
  | { ok: true; lead: ThreadLead; provider: { id: string; name: string } }
  | { ok: false; res: NextResponse };

async function ownedLead(leadId: string | null): Promise<Owned> {
  const elig = await loadAdBoostEligibility();
  if (!elig.ok) return { ok: false, res: NextResponse.json({ error: elig.error }, { status: elig.status }) };
  const notYours = { ok: false as const, res: NextResponse.json({ error: "That family isn't on your campaign." }, { status: 404 }) };
  if (!leadId) return notYours;
  const db = getServiceClient();
  const lead = await getThreadLead(db, leadId);
  if (!lead?.handed_request_id) return notYours;
  const { data: owner } = await db
    .from("ad_campaign_requests")
    .select("provider_id")
    .eq("id", lead.handed_request_id)
    .maybeSingle();
  if (!owner || String(owner.provider_id) !== String(elig.profileId)) return notYours;
  return { ok: true, lead, provider: { id: elig.profileId, name: elig.displayName ?? "Your care provider" } };
}

export async function GET(request: NextRequest) {
  const owned = await ownedLead(request.nextUrl.searchParams.get("leadId"));
  if (!owned.ok) return owned.res;
  const entries = await getFamilyTimeline(getServiceClient(), owned.lead, {
    audience: "provider",
    providerName: owned.provider.name,
  });
  return NextResponse.json({ entries, closed: !!owned.lead.archived_at });
}

export async function POST(request: NextRequest) {
  let body: { leadId?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }
  const owned = await ownedLead(body.leadId ?? null);
  if (!owned.ok) return owned.res;
  const r = await postProviderMessage(getServiceClient(), owned.lead, owned.provider, String(body.body ?? ""));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ success: true });
}
