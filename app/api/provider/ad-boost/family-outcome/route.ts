import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";

/**
 * A provider recording how a family from her own ad went, from her campaign
 * page. The form-lead counterpart of /api/provider/lead-outcome, which covers
 * page inquiries by connection id.
 *
 * Authenticated, and only for a lead handed to one of the caller's own
 * campaigns (city_leads.handed_request_id -> ad_campaign_requests.provider_id).
 * Last write wins, so "talked" can become "became a client" later.
 *
 * POST body: { leadId: string, value: "talking" | "client" | "no" }
 */

const VALUES = ["talking", "client", "no"] as const;
type Value = (typeof VALUES)[number];
const STATUS: Record<Value, string> = { talking: "contacted", client: "client", no: "no_fit" };

export async function POST(request: NextRequest) {
  const elig = await loadAdBoostEligibility();
  if (!elig.ok) return NextResponse.json({ error: elig.error }, { status: elig.status });

  let body: { leadId?: string; value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a lead and an outcome." }, { status: 400 });
  }
  const value = body.value as Value | undefined;
  if (!body.leadId || !value || !VALUES.includes(value)) {
    return NextResponse.json({ error: "Send a lead and an outcome." }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: lead } = await db
    .from("city_leads")
    .select("id, handed_request_id")
    .eq("id", body.leadId)
    .maybeSingle();
  if (!lead?.handed_request_id) {
    return NextResponse.json({ error: "That family isn't on your campaign." }, { status: 404 });
  }
  const { data: owner } = await db
    .from("ad_campaign_requests")
    .select("provider_id")
    .eq("id", lead.handed_request_id)
    .maybeSingle();
  if (!owner || String(owner.provider_id) !== String(elig.profileId)) {
    return NextResponse.json({ error: "That family isn't on your campaign." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const { error } = await db
    .from("city_leads")
    .update({
      outcome: value,
      outcome_at: now,
      outcome_source: "provider_app",
      status: STATUS[value],
      ...(value !== "no" ? { reached_at: now } : {}),
      updated_at: now,
    })
    .eq("id", lead.id);
  if (error) {
    console.error("[ad-boost/family-outcome] write failed", error);
    return NextResponse.json({ error: "Couldn't save that. Try again in a moment." }, { status: 500 });
  }
  return NextResponse.json({ success: true, value });
}
