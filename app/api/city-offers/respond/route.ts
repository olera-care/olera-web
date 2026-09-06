import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";
import { validateCityOfferToken } from "@/lib/claim-tokens";
import { acceptOffer, declineOffer, type CityOfferRow } from "@/lib/city-ads/offers.server";

/**
 * POST /api/city-offers/respond — the buttons on /p/offer/{token}.
 *
 * Form-encoded (plain HTML form, no client JS) or JSON:
 *   token, action = take | pass | reason, reason? = capacity|area|payment|medical|other
 *
 * Writes happen here, never on the GET that renders the page (an email link
 * must not write). Redirects back to the page so the provider sees the result.
 */

const REASONS = new Set(["capacity", "area", "payment", "medical", "other"]);

export async function POST(req: NextRequest) {
  let token = "";
  let action = "";
  let reason: string | null = null;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    token = String(b.token ?? "");
    action = String(b.action ?? "");
    reason = b.reason ? String(b.reason) : null;
  } else {
    const f = await req.formData().catch(() => null);
    token = String(f?.get("token") ?? "");
    action = String(f?.get("action") ?? "");
    reason = f?.get("reason") ? String(f.get("reason")) : null;
  }

  const v = validateCityOfferToken(token);
  if (!v.valid) return NextResponse.json({ error: "This link is not valid." }, { status: 400 });

  const db = getServiceClient();
  const { data: offer } = await db.from("city_lead_offers").select("*").eq("id", v.offerId).maybeSingle();
  if (!offer) return NextResponse.json({ error: "Offer not found." }, { status: 404 });
  const o = offer as CityOfferRow;

  if (action === "take") {
    if (!o.accepted_at && !o.declined_at) await acceptOffer(db, o, "provider_page");
  } else if (action === "pass") {
    if (!o.accepted_at && !o.declined_at) await declineOffer(db, o, reason && REASONS.has(reason) ? reason : null);
  } else if (action === "reason") {
    if (o.declined_at && reason && REASONS.has(reason)) {
      await db.from("city_lead_offers").update({ decline_reason: reason }).eq("id", o.id);
    }
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const back = new URL(`/p/offer/${token}`, req.nextUrl.origin);
  return NextResponse.redirect(back, { status: 303 });
}
