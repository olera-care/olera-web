import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateCityThreadToken } from "@/lib/claim-tokens";
import { getThreadLead, postFamilyReply } from "@/lib/city-ads/thread.server";

/**
 * POST { token, body } — a family's reply on /f/thread/{token}. The signed
 * token is the credential. The provider is told by text and email.
 */
export async function POST(request: NextRequest) {
  let body: { token?: string; body?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  }
  const v = validateCityThreadToken(String(body.token ?? ""));
  if (!v.valid) return NextResponse.json({ error: "This link isn't valid." }, { status: 403 });
  const db = getServiceClient();
  const lead = await getThreadLead(db, v.leadId);
  if (!lead) return NextResponse.json({ error: "This conversation isn't available." }, { status: 404 });
  const r = await postFamilyReply(db, lead, String(body.body ?? ""));
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json({ success: true });
}
