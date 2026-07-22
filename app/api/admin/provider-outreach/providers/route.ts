import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/providers
 *
 * Sales worklist API. Classifies every provider into a task bucket:
 *   - email_ready:    has email              → "Send email now"
 *   - call_for_email: no email + has phone   → "Call to get email"
 *   - needs_research: no email + no phone    → "Needs research"
 *
 * Query params:
 *   state       — filter by state
 *   search      — search by provider name
 *   bucket      — "email_ready" | "call_for_email" | "needs_research"
 *   page / per_page
 *   counts_only — if "1", returns only bucket counts (no rows)
 */

const PER_PAGE_DEFAULT = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyBucketFilter(query: any, bucket: string | null) {
  if (bucket === "email_ready") return query.not("email", "is", null);
  if (bucket === "call_for_email") return query.is("email", null).not("phone", "is", null);
  if (bucket === "needs_research") return query.is("email", null).is("phone", null);
  return query;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const state = url.searchParams.get("state")?.toUpperCase() || null;
  const search = url.searchParams.get("search")?.trim() || null;
  const bucket = url.searchParams.get("bucket") || null;
  const countsOnly = url.searchParams.get("counts_only") === "1";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") || String(PER_PAGE_DEFAULT), 10)));
  const offset = (page - 1) * perPage;

  const db = getServiceClient();

  // Check if pipeline table exists
  const { error: testErr } = await db.from("provider_outreach").select("id").limit(1);
  const usePipeline = !testErr;

  // --- Counts-only mode ---
  if (countsOnly) {
    let countQuery = usePipeline
      ? db.from("provider_outreach").select("email, phone")
      : db.from("olera-providers").select("email, phone").eq("deleted", false);

    if (state) countQuery = countQuery.eq("state", state);
    if (search) countQuery = countQuery.ilike("provider_name", `%${search}%`);

    const { data: allRows, error: cErr } = await countQuery;
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    let emailReady = 0, callForEmail = 0, needsResearch = 0;
    for (const r of allRows || []) {
      if (r.email) emailReady++;
      else if (r.phone) callForEmail++;
      else needsResearch++;
    }

    return NextResponse.json({
      counts: {
        email_ready: emailReady,
        call_for_email: callForEmail,
        needs_research: needsResearch,
        total: emailReady + callForEmail + needsResearch,
      },
    });
  }

  // --- Pipeline table path ---
  if (usePipeline) {
    let query = db
      .from("provider_outreach")
      .select("*", { count: "exact" })
      .order("provider_name", { ascending: true })
      .range(offset, offset + perPage - 1);

    if (state) query = query.eq("state", state);
    if (search) query = query.ilike("provider_name", `%${search}%`);
    query = applyBucketFilter(query, bucket);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      rows: data || [],
      total: count || 0,
      page,
      per_page: perPage,
      bucket,
      source: "pipeline",
    });
  }

  // --- Fallback: olera-providers ---
  let query = db
    .from("olera-providers")
    .select("provider_id, provider_name, provider_category, city, state, phone, email, website, google_rating, slug", { count: "exact" })
    .eq("deleted", false)
    .order("provider_name", { ascending: true })
    .range(offset, offset + perPage - 1);

  if (state) query = query.eq("state", state);
  if (search) query = query.ilike("provider_name", `%${search}%`);
  query = applyBucketFilter(query, bucket);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data || []).map((p) => ({
    id: p.provider_id,
    provider_id: p.provider_id,
    provider_name: p.provider_name,
    provider_category: p.provider_category,
    city: p.city,
    state: p.state,
    phone: p.phone,
    email: p.email,
    website: p.website,
    slug: p.slug,
    google_rating: p.google_rating,
    status: "queued",
  }));

  return NextResponse.json({
    rows,
    total: count || 0,
    page,
    per_page: perPage,
    bucket,
    source: "directory",
  });
}
