import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * POST /api/experiments/impression
 *
 * Fire-and-forget impression counter. Called on CTA mount.
 * Upserts a daily counter per variant — no PII, no auth required.
 * Uses service role client to bypass RLS (server-side route).
 */
export async function POST(request: Request) {
  try {
    const { variantId } = await request.json();

    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const admin = getServiceClient();
    const today = new Date().toISOString().split("T")[0];

    // Try update first (most common path — row already exists for today)
    const { data: existing } = await admin
      .from("cta_impressions")
      .select("id, count")
      .eq("variant_id", variantId)
      .eq("date", today)
      .single();

    if (existing) {
      await admin
        .from("cta_impressions")
        .update({ count: existing.count + 1 })
        .eq("id", existing.id);
    } else {
      await admin.from("cta_impressions").insert({
        variant_id: variantId,
        date: today,
        count: 1,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Silent fail — impressions are best-effort
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
