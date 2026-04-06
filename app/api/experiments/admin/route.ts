import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/admin";

/**
 * PATCH /api/experiments/admin
 *
 * Admin operations for experiments. Uses service role to bypass RLS.
 * Supports: toggle experiment status, update variant weight.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const admin = getServiceClient();

    if (action === "toggle_status") {
      const { experimentId, currentStatus } = body;
      if (!experimentId || !currentStatus) {
        return NextResponse.json({ error: "Missing experimentId or currentStatus" }, { status: 400 });
      }

      const newStatus = currentStatus === "active" ? "paused" : "active";
      const { error } = await admin
        .from("experiments")
        .update({ status: newStatus })
        .eq("id", experimentId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, newStatus });
    }

    if (action === "update_weight") {
      const { variantId, weight } = body;
      if (!variantId || weight == null) {
        return NextResponse.json({ error: "Missing variantId or weight" }, { status: 400 });
      }

      const clampedWeight = Math.max(0, Math.min(100, weight));
      const { error } = await admin
        .from("experiment_variants")
        .update({ weight: clampedWeight })
        .eq("id", variantId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, weight: clampedWeight });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
