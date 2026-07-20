import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * Mark a PROVIDER as "no contact" in Questions.
 *
 * This is a purely organizational tag for providers where admin couldn't find
 * contact info. Unlike archive or not-interested, this doesn't affect the
 * provider at all - it just moves questions to the No Contact tab to reduce
 * clutter in Needs Email.
 *
 * POST body: { providerId, unmark? }
 */

async function handle(params: {
  providerId?: string | null;
  unmark?: boolean;
  adminEmail: string;
  adminUserId: string;
}) {
  const providerId = params.providerId?.trim() || null;
  const { unmark, adminEmail, adminUserId } = params;

  if (!providerId) {
    return NextResponse.json({ error: "Provide a providerId" }, { status: 400 });
  }

  const db = getServiceClient();

  // Resolve provider variants (same pattern as mark-not-interested)
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

  // ── Unmark: remove no_contact from questions ──
  if (unmark) {
    // Find all questions marked as no contact for this provider
    const { data: markedQuestions, error: fetchErr } = await db
      .from("provider_questions")
      .select("id, metadata")
      .in("provider_id", variants);

    if (fetchErr) {
      console.error("Mark-no-contact fetch error:", fetchErr);
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    let questionsUnmarked = 0;
    for (const q of markedQuestions ?? []) {
      const meta = (q.metadata as Record<string, unknown> | null) || {};
      if (meta.provider_no_contact) {
        delete meta.provider_no_contact;
        delete meta.no_contact_at;
        delete meta.no_contact_by;
        // Restore needs_provider_email flag so it goes back to Needs Email tab
        meta.needs_provider_email = true;
        const { error: updateErr } = await db
          .from("provider_questions")
          .update({ metadata: meta })
          .eq("id", q.id);
        if (!updateErr) questionsUnmarked++;
      }
    }

    await logAuditAction({
      adminUserId,
      action: "questions_unmark_no_contact",
      targetType: "provider",
      targetId: providerId,
      details: { provider_id: providerId, provider_name: providerName, variants, questions_unmarked: questionsUnmarked },
    });

    return NextResponse.json({
      success: true,
      action: "unmark",
      providerId,
      providerName,
      variants,
      questionsUnmarked,
      message: `Unmarked ${providerName || providerId} as no contact. ${questionsUnmarked} question(s) returned to queue.`,
    });
  }

  // ── Mark as no contact ──
  const nowIso = new Date().toISOString();

  // Fetch questions that need email for this provider (same filter as Needs Email tab)
  const { data: needsEmailQuestions, error: fetchErr } = await db
    .from("provider_questions")
    .select("id, metadata")
    .in("provider_id", variants)
    .neq("status", "archived")
    .neq("status", "rejected");

  if (fetchErr) {
    console.error("Mark-no-contact fetch error:", fetchErr);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }

  let questionsMarked = 0;
  for (const q of needsEmailQuestions ?? []) {
    const meta = (q.metadata as Record<string, unknown> | null) || {};
    // Only mark questions that need email
    if (meta.needs_provider_email === true || meta.email_dead === true) {
      meta.provider_no_contact = true;
      meta.no_contact_at = nowIso;
      meta.no_contact_by = adminEmail;
      // Clear needs_provider_email so it doesn't appear in both tabs
      delete meta.needs_provider_email;
      // Keep email_dead if present - the no_contact flag takes precedence

      const { error: updateErr } = await db
        .from("provider_questions")
        .update({ metadata: meta })
        .eq("id", q.id);
      if (!updateErr) questionsMarked++;
    }
  }

  await logAuditAction({
    adminUserId,
    action: "questions_mark_no_contact",
    targetType: "provider",
    targetId: providerId,
    details: {
      provider_id: providerId,
      provider_name: providerName,
      variants,
      questions_marked: questionsMarked,
    },
  });

  return NextResponse.json({
    success: true,
    action: "mark",
    providerId,
    providerName,
    variants,
    questionsMarked,
    message: `Tagged ${providerName || providerId} as no contact. ${questionsMarked} question(s) moved to No Contact tab.`,
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
      unmark: body.unmark === true,
      adminEmail: a.adminEmail,
      adminUserId: a.adminUser.id,
    });
  } catch (err) {
    console.error("Mark-no-contact error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
