import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

/**
 * POST /api/experiments/impression
 *
 * Fire-and-forget impression counter. Called on CTA mount.
 * Upserts a daily counter per variant — no PII, no auth required.
 */
export async function POST(request: Request) {
  try {
    const { variantId } = await request.json();

    if (!variantId || typeof variantId !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createClient();

    // Upsert: increment today's count for this variant
    // Uses the unique(variant_id, date) constraint
    const { error } = await supabase.rpc("increment_impression", {
      p_variant_id: variantId,
    });

    if (error) {
      // Fallback: try manual upsert if RPC doesn't exist yet
      const today = new Date().toISOString().split("T")[0];

      const { data: existing } = await supabase
        .from("cta_impressions")
        .select("id, count")
        .eq("variant_id", variantId)
        .eq("date", today)
        .single();

      if (existing) {
        await supabase
          .from("cta_impressions")
          .update({ count: existing.count + 1 })
          .eq("id", existing.id);
      } else {
        await supabase.from("cta_impressions").insert({
          variant_id: variantId,
          date: today,
          count: 1,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Silent fail — impressions are best-effort
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
