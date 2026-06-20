import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * Archive a PROVIDER from the Questions queue (Q&A-scoped).
 *
 * One action that ends the QA treadmill for a provider the team has decided to
 * stop working:
 *   1. Bulk-archives that provider's existing open questions (pending/approved/
 *      flagged) → status='archived', is_public=false.
 *   2. Records the provider_id (+ resolved variants) in archived_question_providers
 *      so NEW questions for it are auto-archived at submission
 *      (app/api/questions/route.ts) and never re-enter the queue.
 *
 * Scoped to Q&A only — this does NOT touch business_profiles.metadata.admin_archived,
 * so nudges, lead routing, welcome/re-engagement emails, and connection routing
 * are unaffected. Full provider archive remains a separate directory action.
 *
 * GET and POST both supported so it's triggerable straight from a browser.
 *   POST body:   { providerId | providerSlug, reason?, notes?, unarchive? }
 *   GET query:   ?providerId=...&reason=...&notes=...&unarchive=1
 *
 * Reversible: ?unarchive=1 deletes the suppression rows (resumes normal intake).
 * Already-archived questions stay archived — restore them individually if needed.
 */

// Statuses that are still "in the queue" / live and should be swept to archived.
// Leave 'answered' (published Q&A) and 'rejected'/'archived' (already out) alone.
const OPEN_STATUSES = ["pending", "approved", "flagged"];

async function handle(params: {
  providerId?: string | null;
  reason?: string | null;
  notes?: string | null;
  unarchive?: boolean;
  adminEmail: string;
  adminUserId: string;
}) {
  const providerId = params.providerId?.trim() || null;
  const reason = params.reason?.trim() || null;
  const notes = params.notes?.trim() || null;
  const { unarchive, adminEmail, adminUserId } = params;

  if (!providerId) {
    return NextResponse.json({ error: "Provide a providerId (or providerSlug)" }, { status: 400 });
  }

  const db = getServiceClient();

  // Resolve the provider's id variants so we catch questions stored under any of
  // them (slug, legacy provider_id, source_provider_id) — mirrors the lookup in
  // /api/admin/questions/add-email. The submitted providerId is always included.
  const variantSet = new Set<string>([providerId]);
  let providerName: string | null = null;

  // Strategy 1: business_profiles by slug
  const bp = await db
    .from("business_profiles")
    .select("display_name, slug, source_provider_id")
    .eq("slug", providerId)
    .maybeSingle()
    .then((r) => r.data);

  if (bp) {
    providerName = bp.display_name ?? null;
    if (bp.slug) variantSet.add(bp.slug);
    if (bp.source_provider_id) variantSet.add(bp.source_provider_id);
  } else {
    // Strategy 2/3: olera-providers by slug, then by legacy provider_id
    let ios = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug")
      .eq("slug", providerId)
      .maybeSingle()
      .then((r) => r.data);
    if (!ios) {
      ios = await db
        .from("olera-providers")
        .select("provider_id, provider_name, slug")
        .eq("provider_id", providerId)
        .maybeSingle()
        .then((r) => r.data);
    }
    if (ios) {
      providerName = ios.provider_name ?? null;
      if (ios.provider_id) variantSet.add(ios.provider_id);
      if (ios.slug) variantSet.add(ios.slug);
      // Linked business_profile, if any
      const linked = await db
        .from("business_profiles")
        .select("display_name, slug, source_provider_id")
        .eq("source_provider_id", ios.provider_id)
        .maybeSingle()
        .then((r) => r.data);
      if (linked) {
        providerName = providerName || linked.display_name || null;
        if (linked.slug) variantSet.add(linked.slug);
        if (linked.source_provider_id) variantSet.add(linked.source_provider_id);
      }
    }
  }

  const variants = Array.from(variantSet);

  // ── Unarchive: stop suppressing future questions for these ids ──
  if (unarchive) {
    const { data: deleted, error: delErr } = await db
      .from("archived_question_providers")
      .delete()
      .in("provider_id", variants)
      .select("provider_id");
    if (delErr) {
      console.error("Archive-provider unarchive error:", delErr);
      return NextResponse.json({ error: "Failed to unarchive" }, { status: 500 });
    }
    await logAuditAction({
      adminUserId,
      action: "questions_unarchive_provider",
      targetType: "provider",
      targetId: providerId,
      details: { provider_id: providerId, provider_name: providerName, variants, rows_removed: deleted?.length ?? 0 },
    });
    return NextResponse.json({
      success: true,
      action: "unarchive",
      providerId,
      providerName,
      variants,
      suppressionRowsRemoved: deleted?.length ?? 0,
      message: `Resumed Q&A intake for ${providerName || providerId}. New questions will reach the queue again.`,
    });
  }

  // ── Archive: suppress future + sweep existing open questions ──

  // 1. Suppress future questions — one row per variant.
  const nowIso = new Date().toISOString();
  const { error: supErr } = await db.from("archived_question_providers").upsert(
    variants.map((id) => ({
      provider_id: id,
      reason,
      notes,
      archived_by: adminEmail,
      archived_at: nowIso,
    })),
    { onConflict: "provider_id" },
  );
  if (supErr) {
    console.error("Archive-provider suppression upsert error:", supErr);
    return NextResponse.json({ error: "Failed to record provider archive" }, { status: 500 });
  }

  // 2. Sweep existing open questions to archived. Fetch first so we can merge
  // (not clobber) each row's metadata — preserves needs_provider_email/email_dead
  // markers while adding the archive trail.
  const { data: openQuestions, error: fetchErr } = await db
    .from("provider_questions")
    .select("id, metadata")
    .in("provider_id", variants)
    .in("status", OPEN_STATUSES);
  if (fetchErr) {
    console.error("Archive-provider fetch open questions error:", fetchErr);
    return NextResponse.json({ error: "Failed to load provider questions" }, { status: 500 });
  }

  let questionsArchived = 0;
  const rows = openQuestions ?? [];
  // Small batches keep this responsive even for a provider with a big backlog.
  for (let i = 0; i < rows.length; i += 25) {
    const batch = rows.slice(i, i + 25);
    const results = await Promise.all(
      batch.map((q) => {
        const meta = ((q.metadata as Record<string, unknown> | null) || {});
        meta.archive_reason = reason || "Provider archived from Questions queue";
        meta.archived_at = nowIso;
        meta.archived_via = "provider_archive";
        return db
          .from("provider_questions")
          .update({ status: "archived", is_public: false, metadata: meta, updated_at: nowIso })
          .eq("id", q.id)
          .then((r) => !r.error);
      }),
    );
    questionsArchived += results.filter(Boolean).length;
  }

  await logAuditAction({
    adminUserId,
    action: "questions_archive_provider",
    targetType: "provider",
    targetId: providerId,
    details: {
      provider_id: providerId,
      provider_name: providerName,
      variants,
      reason,
      notes,
      questions_archived: questionsArchived,
    },
  });

  return NextResponse.json({
    success: true,
    action: "archive",
    providerId,
    providerName,
    variants,
    questionsArchived,
    message: `Archived ${providerName || providerId}: ${questionsArchived} existing question(s) cleared. Future questions will be auto-archived.`,
  });
}

async function authed() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { adminUser, adminEmail: user.email ?? adminUser.id };
}

export async function POST(request: NextRequest) {
  try {
    const a = await authed();
    if (a.error) return a.error;
    const body = await request.json().catch(() => ({}));
    return await handle({
      providerId: body.providerId ?? body.providerSlug ?? null,
      reason: body.reason ?? null,
      notes: body.notes ?? null,
      unarchive: body.unarchive === true || body.unarchive === "1",
      adminEmail: a.adminEmail,
      adminUserId: a.adminUser.id,
    });
  } catch (err) {
    console.error("Archive-provider error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const a = await authed();
    if (a.error) return a.error;
    const sp = request.nextUrl.searchParams;
    return await handle({
      providerId: sp.get("providerId") ?? sp.get("providerSlug"),
      reason: sp.get("reason"),
      notes: sp.get("notes"),
      unarchive: sp.get("unarchive") === "1" || sp.get("unarchive") === "true",
      adminEmail: a.adminEmail,
      adminUserId: a.adminUser.id,
    });
  } catch (err) {
    console.error("Archive-provider error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
