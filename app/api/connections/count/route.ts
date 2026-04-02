import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/connections/count
 *
 * Returns the count of real inquiry connections for the current month.
 * Used for social proof on the CTA: "X families checked this month"
 *
 * Cached via Next.js ISR — revalidates every hour.
 */

export const revalidate = 3600; // 1 hour

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json({ count: 0 });
  }

  const db = createClient(url, serviceKey);

  // Start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await db
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("type", "inquiry")
    .gte("created_at", startOfMonth);

  if (error) {
    console.error("[connections/count] error:", error);
    return NextResponse.json({ count: 0 });
  }

  return NextResponse.json({ count: count || 0 });
}
