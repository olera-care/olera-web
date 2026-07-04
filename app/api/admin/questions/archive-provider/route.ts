import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";

/**
 * Archive a PROVIDER from the Questions queue (FULL provider archive).
 *
 * This is now a DEFINITIVE action that:
 *   1. Sets admin_archived = true on business_profiles (stops ALL emails — crons check this flag)
 *   2. Bulk-archives that provider's existing open questions (pending/approved/
 *      flagged) → status='archived', is_public=false.
 *   3. Records the provider_id (+ resolved variants) in archived_question_providers
 *      so NEW questions for it are auto-archived at submission.
 *   4. For olera-providers without business_profiles, creates a minimal business_profile
 *      so we can set admin_archived consistently.
 *
 * This is now synced with the Connections page archive — archiving from Questions
 * also archives from Connections and vice versa.
 *
 * GET and POST both supported so it's triggerable straight from a browser.
 *   POST body:   { providerId | providerSlug, reason, notes?, unarchive? }
 *   GET query:   ?providerId=...&reason=...&notes=...&unarchive=1
 *
 * Reversible: ?unarchive=1 removes archive flags and suppression rows.
 * Already-archived questions stay archived — restore them individually if needed.
 */

// Standardized archive reasons (same as Connections page)
const VALID_ARCHIVE_REASONS = [
  "provider_requested_no_emails",
  "inactive",
  "duplicate",
  "out_of_business",
  "invalid_provider",
  "wrong_contact_info",
  "relocated",
  "compliance_issue",
  "merged",
  "other",
] as const;

const VALID_UNARCHIVE_REASONS = [
  "provider_reactivated",
  "contact_info_updated",
  "archived_in_error",
  "provider_requested",
  "compliance_resolved",
  "other",
] as const;

type ArchiveReason = (typeof VALID_ARCHIVE_REASONS)[number];
type UnarchiveReason = (typeof VALID_UNARCHIVE_REASONS)[number];

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

  // Validate reason for archiving
  if (!unarchive) {
    if (!reason) {
      return NextResponse.json({ error: "Reason is required for archiving" }, { status: 400 });
    }
    if (!VALID_ARCHIVE_REASONS.includes(reason as ArchiveReason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${VALID_ARCHIVE_REASONS.join(", ")}` },
        { status: 400 }
      );
    }
    if (reason === "other" && !notes?.trim()) {
      return NextResponse.json({ error: "Notes are required when reason is 'other'" }, { status: 400 });
    }
  }

  const db = getServiceClient();

  // Resolve the provider's id variants so we catch questions stored under any of
  // them (slug, legacy provider_id, source_provider_id) — mirrors the lookup in
  // /api/admin/questions/add-email. The submitted providerId is always included.
  const variantSet = new Set<string>([providerId]);
  let providerName: string | null = null;
  let businessProfileId: string | null = null;
  let oleraProviderData: { provider_id: string; provider_name: string; slug: string | null; city?: string; state?: string; email?: string; phone?: string } | null = null;

  // Strategy 1: business_profiles by slug
  const bp = await db
    .from("business_profiles")
    .select("id, display_name, slug, source_provider_id")
    .eq("slug", providerId)
    .maybeSingle()
    .then((r) => r.data);

  if (bp) {
    businessProfileId = bp.id;
    providerName = bp.display_name ?? null;
    if (bp.slug) variantSet.add(bp.slug);
    if (bp.source_provider_id) variantSet.add(bp.source_provider_id);
  } else {
    // Strategy 2/3: olera-providers by slug, then by legacy provider_id
    let ios = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug, city, state, email, phone")
      .eq("slug", providerId)
      .maybeSingle()
      .then((r) => r.data);
    if (!ios) {
      ios = await db
        .from("olera-providers")
        .select("provider_id, provider_name, slug, city, state, email, phone")
        .eq("provider_id", providerId)
        .maybeSingle()
        .then((r) => r.data);
    }
    if (ios) {
      oleraProviderData = ios;
      providerName = ios.provider_name ?? null;
      if (ios.provider_id) variantSet.add(ios.provider_id);
      if (ios.slug) variantSet.add(ios.slug);
      // Linked business_profile, if any
      const linked = await db
        .from("business_profiles")
        .select("id, display_name, slug, source_provider_id")
        .eq("source_provider_id", ios.provider_id)
        .maybeSingle()
        .then((r) => r.data);
      if (linked) {
        businessProfileId = linked.id;
        providerName = providerName || linked.display_name || null;
        if (linked.slug) variantSet.add(linked.slug);
        if (linked.source_provider_id) variantSet.add(linked.source_provider_id);
      }
    }
  }

  const variants = Array.from(variantSet);

  // ── Unarchive: clear admin_archived and stop suppressing future questions ──
  if (unarchive) {
    const nowIso = new Date().toISOString();

    // Validate unarchive reason
    if (!reason) {
      return NextResponse.json({ error: "Reason is required for unarchiving" }, { status: 400 });
    }
    if (!VALID_UNARCHIVE_REASONS.includes(reason as UnarchiveReason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${VALID_UNARCHIVE_REASONS.join(", ")}` },
        { status: 400 }
      );
    }
    if (reason === "other" && !notes?.trim()) {
      return NextResponse.json({ error: "Notes are required when reason is 'other'" }, { status: 400 });
    }

    // 1. Clear admin_archived from business_profiles (if exists)
    if (businessProfileId) {
      const { data: bpData } = await db
        .from("business_profiles")
        .select("metadata")
        .eq("id", businessProfileId)
        .single();

      if (bpData) {
        const meta = (bpData.metadata as Record<string, unknown>) ?? {};
        // Remove archive flags
        delete meta.admin_archived;
        delete meta.admin_archived_at;
        delete meta.admin_archived_by;
        delete meta.admin_archived_reason;
        delete meta.admin_archived_notes;
        // Add unarchive tracking
        meta.admin_unarchived_at = nowIso;
        meta.admin_unarchived_by = adminEmail;
        meta.admin_unarchived_reason = reason;
        meta.admin_unarchived_notes = notes || null;

        await db
          .from("business_profiles")
          .update({ metadata: meta, updated_at: nowIso })
          .eq("id", businessProfileId);
      }
    }

    // 2. Remove from Q&A suppression table
    const { data: deleted, error: delErr } = await db
      .from("archived_question_providers")
      .delete()
      .in("provider_id", variants)
      .select("provider_id");
    if (delErr) {
      console.error("Archive-provider unarchive error:", delErr);
      return NextResponse.json({ error: "Failed to unarchive" }, { status: 500 });
    }

    // 3. Clear followup_stopped_reason for connections that were stopped due to archiving
    if (businessProfileId) {
      const { data: connections } = await db
        .from("connections")
        .select("id, metadata")
        .eq("to_profile_id", businessProfileId)
        .eq("type", "inquiry");

      if (connections && connections.length > 0) {
        for (const conn of connections) {
          const connMeta = (conn.metadata as Record<string, unknown>) ?? {};
          if (connMeta.followup_stopped_reason === "provider_admin_archived") {
            const updatedConnMeta = { ...connMeta };
            delete updatedConnMeta.followup_stopped_at;
            delete updatedConnMeta.followup_stopped_reason;
            await db
              .from("connections")
              .update({ metadata: updatedConnMeta })
              .eq("id", conn.id);
          }
        }
      }
    }

    await logAuditAction({
      adminUserId,
      action: "questions_unarchive_provider",
      targetType: "provider",
      targetId: providerId,
      details: {
        provider_id: providerId,
        provider_name: providerName,
        variants,
        rows_removed: deleted?.length ?? 0,
        reason,
        notes,
        business_profile_id: businessProfileId,
      },
    });
    return NextResponse.json({
      success: true,
      action: "unarchive",
      providerId,
      providerName,
      variants,
      suppressionRowsRemoved: deleted?.length ?? 0,
      message: `Unarchived ${providerName || providerId}. Provider is now active again — Q&A intake resumed and emails will be sent.`,
    });
  }

  // ── Archive: set admin_archived + suppress future + sweep existing open questions ──

  const nowIso = new Date().toISOString();
  let connectionsAffected = 0;

  // 1. Set admin_archived on business_profiles (or create minimal record if needed)
  if (businessProfileId) {
    // Provider has a business_profile — update it
    const { data: bpData } = await db
      .from("business_profiles")
      .select("metadata")
      .eq("id", businessProfileId)
      .single();

    const meta = (bpData?.metadata as Record<string, unknown>) ?? {};
    meta.admin_archived = true;
    meta.admin_archived_at = nowIso;
    meta.admin_archived_by = adminEmail;
    meta.admin_archived_reason = reason;
    meta.admin_archived_notes = notes || null;

    const { error: updateErr } = await db
      .from("business_profiles")
      .update({ metadata: meta, updated_at: nowIso })
      .eq("id", businessProfileId);

    if (updateErr) {
      console.error("Archive-provider business_profiles update error:", updateErr);
      return NextResponse.json({ error: "Failed to archive provider" }, { status: 500 });
    }

    // Stop all active followup sequences for this provider's connections
    const { data: connections } = await db
      .from("connections")
      .select("id, metadata")
      .eq("to_profile_id", businessProfileId)
      .eq("type", "inquiry");

    if (connections && connections.length > 0) {
      for (const conn of connections) {
        const connMeta = (conn.metadata as Record<string, unknown>) ?? {};
        if (!connMeta.followup_stopped_at) {
          const updatedConnMeta = {
            ...connMeta,
            followup_stopped_at: nowIso,
            followup_stopped_reason: "provider_admin_archived",
          };
          const { error: connUpdateError } = await db
            .from("connections")
            .update({ metadata: updatedConnMeta })
            .eq("id", conn.id);
          if (!connUpdateError) connectionsAffected++;
        }
      }
    }
  } else if (oleraProviderData) {
    // Provider only exists in olera-providers — create a minimal business_profile
    // so we have a place to store admin_archived consistently
    const slug = oleraProviderData.slug || providerId;
    const { data: newBp, error: insertErr } = await db
      .from("business_profiles")
      .insert({
        type: "organization",
        display_name: oleraProviderData.provider_name,
        slug: slug,
        source_provider_id: oleraProviderData.provider_id,
        city: oleraProviderData.city || null,
        state: oleraProviderData.state || null,
        email: oleraProviderData.email || null,
        phone: oleraProviderData.phone || null,
        is_active: true,
        metadata: {
          admin_archived: true,
          admin_archived_at: nowIso,
          admin_archived_by: adminEmail,
          admin_archived_reason: reason,
          admin_archived_notes: notes || null,
          created_from_questions_archive: true,
        },
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("id")
      .single();

    if (insertErr) {
      // If insert fails (e.g., slug collision), log but continue — Q&A archive still works
      console.error("Archive-provider business_profiles insert error:", insertErr);
      // Don't fail the whole operation — Q&A-specific archive will still work
    } else if (newBp) {
      businessProfileId = newBp.id;
    }
  }

  // 2. Suppress future questions — one row per variant.
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

  // 3. Sweep existing open questions to archived. Fetch first so we can merge
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
        meta.archive_reason = reason;
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
      connections_affected: connectionsAffected,
      business_profile_id: businessProfileId,
    },
  });

  return NextResponse.json({
    success: true,
    action: "archive",
    providerId,
    providerName,
    variants,
    questionsArchived,
    connectionsAffected,
    message: `Archived ${providerName || providerId}: ${questionsArchived} question(s) cleared, ${connectionsAffected} followup sequences stopped. All emails to this provider are now stopped.`,
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
