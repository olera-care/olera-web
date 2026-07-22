import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * POST /api/admin/provider-outreach/load-state
 *
 * Loads all active olera-providers for a given state into the pipeline.
 *
 * If the provider_outreach table exists, inserts rows there.
 * If not, just validates the state has providers and returns the count
 * (the frontend persists which states are "loaded" in localStorage).
 *
 * Body: { state: "NY" }
 */

const VALID_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DC","DE","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","MA","MD","ME","MI","MN","MO","MS","MT","NC","ND","NE",
  "NH","NJ","NM","NV","NY","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VA","VT","WA","WI","WV","WY",
]);

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const state = (body.state as string)?.toUpperCase()?.trim();

  if (!state || !VALID_STATES.has(state)) {
    return NextResponse.json({ error: "Invalid state abbreviation" }, { status: 400 });
  }

  const db = getServiceClient();

  // Count providers for this state in the directory
  const { count, error: countErr } = await db
    .from("olera-providers")
    .select("provider_id", { count: "exact", head: true })
    .eq("deleted", false)
    .eq("state", state);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  if (!count || count === 0) {
    return NextResponse.json({ error: `No active providers found for ${state}` }, { status: 404 });
  }

  // Try to insert into provider_outreach if the table exists
  let insertedToPipeline = false;
  const { error: testErr } = await db
    .from("provider_outreach")
    .select("id")
    .limit(1);

  if (!testErr) {
    // Table exists — load providers into it
    const { data: providers } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, city, state, phone, email, website, slug")
      .eq("deleted", false)
      .eq("state", state);

    if (providers && providers.length > 0) {
      // Check which are already loaded
      const { data: existing } = await db
        .from("provider_outreach")
        .select("provider_id")
        .eq("state", state);

      const existingIds = new Set((existing || []).map((r) => r.provider_id));
      const toInsert = providers.filter((p) => !existingIds.has(p.provider_id));

      if (toInsert.length > 0) {
        const BATCH_SIZE = 500;
        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
          const batch = toInsert.slice(i, i + BATCH_SIZE).map((p) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            provider_category: p.provider_category,
            city: p.city,
            state: p.state,
            phone: p.phone,
            email: p.email,
            website: p.website,
            slug: p.slug,
            status: p.email ? "send_ready" : "queued",
            sequence_status: "pending",
          }));

          const { error: insertErr } = await db.from("provider_outreach").insert(batch);
          if (insertErr) {
            return NextResponse.json(
              { error: `Insert failed: ${insertErr.message}` },
              { status: 500 },
            );
          }
        }
        insertedToPipeline = true;
      }
    }
  }

  return NextResponse.json({
    message: `Loaded ${count} ${state} providers`,
    total: count,
    pipeline: insertedToPipeline ? "populated" : "directory_only",
  });
}

/**
 * DELETE /api/admin/provider-outreach/load-state
 *
 * Removes all provider_outreach rows for a given state.
 * Body: { state: "CA" }
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const state = (body.state as string)?.toUpperCase()?.trim();

  if (!state || !VALID_STATES.has(state)) {
    return NextResponse.json({ error: "Invalid state abbreviation" }, { status: 400 });
  }

  const db = getServiceClient();

  const { error: delErr, count } = await db
    .from("provider_outreach")
    .delete({ count: "exact" })
    .eq("state", state);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Removed ${count ?? 0} ${state} providers from pipeline`,
    deleted: count ?? 0,
  });
}
