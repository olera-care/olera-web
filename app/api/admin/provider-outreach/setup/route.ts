import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/setup
 *
 * One-time setup: creates the provider_outreach tables if they don't exist.
 * Uses individual Supabase operations since we can't run raw DDL through
 * the JS client. Instead, we check if the table exists and create test rows
 * to verify the schema.
 *
 * NOTE: The actual DDL must be run via Supabase SQL Editor. This endpoint
 * verifies the tables exist and reports what's missing.
 */

export async function POST(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();
  const results: Record<string, string> = {};

  // Test provider_outreach
  const { error: poErr } = await db
    .from("provider_outreach")
    .select("id")
    .limit(1);
  results.provider_outreach = poErr ? `MISSING: ${poErr.message}` : "OK";

  // Test provider_outreach_touchpoints
  const { error: tpErr } = await db
    .from("provider_outreach_touchpoints")
    .select("id")
    .limit(1);
  results.provider_outreach_touchpoints = tpErr ? `MISSING: ${tpErr.message}` : "OK";

  // Test provider_outreach_contacts
  const { error: ctErr } = await db
    .from("provider_outreach_contacts")
    .select("id")
    .limit(1);
  results.provider_outreach_contacts = ctErr ? `MISSING: ${ctErr.message}` : "OK";

  const allOk = Object.values(results).every((v) => v === "OK");

  return NextResponse.json({
    status: allOk ? "ready" : "tables_missing",
    tables: results,
    message: allOk
      ? "All provider outreach tables exist and are accessible."
      : "Some tables are missing. Run migration 131_provider_outreach.sql in the Supabase SQL Editor.",
  });
}
