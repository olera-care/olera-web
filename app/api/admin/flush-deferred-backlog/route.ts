import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { sendDeferredNotificationsForProvider } from "@/lib/admin/send-deferred-notifications";

/**
 * Batch flush of the deferred-question backlog unblocked by the role-address
 * fix (effectiveStatus in lib/email-verification.ts; Step 3 of
 * plans/email-hygiene-rework-plan.md).
 *
 * After that fix shipped, the send gate sends to deliverable role addresses
 * (info@, admissions@) — but the existing pile of pending question
 * notifications doesn't re-fire on its own (nothing crons
 * sendDeferredNotificationsForProvider). This endpoint walks providers that
 * have pending, never-emailed questions and re-runs the unified deferred-send
 * for each. The (now-corrected) send gate is the single arbiter of what
 * actually leaves: role_based goes out, genuine bounces / spamtraps / invalid
 * stay suppressed (logged failed, no mail). So this is safe to run broadly —
 * it can't send to a bad address the gate would block.
 *
 * Paced two ways: a per-provider question cap (perProvider) so no single
 * provider gets blasted, and a wall-clock deadline per invocation (mirrors the
 * cron pattern). No offset cursor — a successful flush stamps email_sent_at, so
 * flushed providers drop out of the freshly-queried backlog; if a run hits the
 * deadline, just re-run the same URL and it picks up the remainder.
 *
 * GET / POST (admin auth, browser-triggerable):
 *   ?dryRun=1        count the target providers/questions, send nothing
 *   ?perProvider=N   max questions per provider this run (default 100)
 *   ?onlyDeliverable=0  also attempt providers whose on-file email isn't a
 *                       known-deliverable role address (default 1 = skip them,
 *                       avoids pointless suppressed-send churn)
 */

export const maxDuration = 300;

const DEADLINE_MS = 250_000; // ~50s headroom under maxDuration for the final writes
const DEFAULT_PER_PROVIDER = 100;

type Resolved = {
  email: string | null;
  name: string | null;
  profileId: string | null;
  sourceProviderId: string | null;
  bpSlug: string | null;
};

async function handle(params: {
  dryRun: boolean;
  perProvider: number;
  onlyDeliverable: boolean;
  adminUserId: string;
}) {
  const { dryRun, perProvider, onlyDeliverable } = params;
  const db = getServiceClient();

  // 1) Distinct providers with pending, never-emailed questions (the backlog).
  const { data: pending, error: qErr } = await db
    .from("provider_questions")
    .select("provider_id, metadata")
    .eq("status", "pending");
  if (qErr) {
    return NextResponse.json({ error: "Failed to read questions", detail: qErr.message }, { status: 500 });
  }
  const deferred = (pending ?? []).filter(
    (q) => !(q.metadata as Record<string, unknown> | null)?.email_sent_at,
  );
  // Stable, deterministic order so the offset cursor is consistent across calls.
  const providerIds = Array.from(new Set(deferred.map((q) => q.provider_id as string))).sort();
  const totalProviders = providerIds.length;

  // 2) Deliverable-email set: role_based verdicts (now sendable), minus any with
  // a real bounce/complaint on record (those stay blocked by the bounce gate).
  // Only built when onlyDeliverable is on — it's the targeting filter.
  let deliverable: Set<string> | null = null;
  if (onlyDeliverable) {
    const { data: roleRows } = await db
      .from("email_verifications")
      .select("email")
      .eq("status", "invalid")
      .eq("sub_status", "role_based");
    deliverable = new Set((roleRows ?? []).map((r) => (r.email as string).toLowerCase()));
    const { data: bounced } = await db
      .from("email_log")
      .select("recipient")
      .or("bounced_at.not.is.null,complained_at.not.is.null");
    for (const r of bounced ?? []) {
      const e = (r.recipient as string | null)?.toLowerCase();
      if (e) deliverable.delete(e);
    }
  }

  // 3) Resolve email/name for the providers we're about to process. Batch the
  // lookups (slug / source_provider_id on business_profiles; provider_id / slug
  // on olera-providers) instead of per-provider round trips.
  //
  // No offset cursor: a successful flush stamps email_sent_at, so flushed
  // providers fall OUT of this (freshly-queried) backlog on the next call. The
  // list shrinks as we go, so we always process from the start — a plain re-run
  // continues where the last one stopped. An index cursor would skip providers
  // here precisely because the list it indexes into keeps shrinking.
  const slice = providerIds;
  // Chunk size for the .in() lookups. A PostgREST .or(...in.(...)) filter rides
  // in the URL/query string, so a few hundred ids silently overflows the server
  // limit and returns ZERO rows with no error. Keep each query small.
  const RESOLVE_CHUNK = 80;
  const resolveBatch = async (ids: string[]): Promise<Map<string, Resolved>> => {
    const map = new Map<string, Resolved>();
    for (let i = 0; i < ids.length; i += RESOLVE_CHUNK) {
      const chunk = ids.slice(i, i + RESOLVE_CHUNK);
      if (chunk.length === 0) continue;
      const inList = `(${chunk.map((id) => `"${id}"`).join(",")})`;
      const { data: bps } = await db
        .from("business_profiles")
        .select("id, display_name, email, source_provider_id, slug")
        .or(`slug.in.${inList},source_provider_id.in.${inList}`);
      for (const bp of bps ?? []) {
        const entry: Resolved = {
          email: bp.email,
          name: bp.display_name,
          profileId: bp.id,
          sourceProviderId: bp.source_provider_id,
          bpSlug: bp.slug,
        };
        if (bp.slug) map.set(bp.slug, entry);
        if (bp.source_provider_id) map.set(bp.source_provider_id, entry);
      }
      // Fall through to olera-providers for any id we still lack a usable EMAIL
      // for — not just ids missing entirely. A business_profile can exist with a
      // null email while the deliverable address lives on the olera-providers
      // row; keying off map.has() alone silently skips those providers.
      const unresolved = chunk.filter((id) => !map.get(id)?.email);
      if (unresolved.length) {
        const uIn = `(${unresolved.map((id) => `"${id}"`).join(",")})`;
        const { data: ops } = await db
          .from("olera-providers")
          .select("provider_id, slug, provider_name, email")
          .or(`provider_id.in.${uIn},slug.in.${uIn}`)
          .not("deleted", "is", true);
        for (const op of ops ?? []) {
          // Preserve a business_profile link (profileId) that only lacked an
          // email; otherwise stand up a fresh olera-providers entry.
          const prior = map.get(op.provider_id) ?? map.get(op.slug);
          const entry: Resolved = {
            email: op.email,
            name: prior?.name ?? op.provider_name,
            profileId: prior?.profileId ?? null,
            sourceProviderId: prior?.sourceProviderId ?? op.provider_id,
            bpSlug: prior?.bpSlug ?? op.slug,
          };
          // Only fill entries still missing an email — never clobber a
          // business_profile that already resolved to a real address.
          if (op.provider_id && !map.get(op.provider_id)?.email) map.set(op.provider_id, entry);
          if (op.slug && !map.get(op.slug)?.email) map.set(op.slug, entry);
        }
      }
    }
    return map;
  };

  // Dry run: just count the target (deliverable) providers + their questions.
  if (dryRun) {
    const resolved = await resolveBatch(slice);
    let targetProviders = 0;
    let targetQuestions = 0;
    const pendingByProvider = new Map<string, number>();
    for (const q of deferred) pendingByProvider.set(q.provider_id as string, (pendingByProvider.get(q.provider_id as string) ?? 0) + 1);
    for (const id of slice) {
      const r = resolved.get(id);
      const email = r?.email?.toLowerCase();
      if (!email) continue;
      if (deliverable && !deliverable.has(email)) continue;
      targetProviders++;
      targetQuestions += Math.min(pendingByProvider.get(id) ?? 0, perProvider);
    }
    return NextResponse.json({
      dryRun: true,
      totalProvidersWithBacklog: totalProviders,
      targetProviders,
      targetQuestionsCapped: targetQuestions,
      perProvider,
      onlyDeliverable,
    });
  }

  // 4) Flush, bounded by the wall-clock deadline. resolveBatch chunks its DB
  // lookups internally, so resolving the whole backlog up front is cheap and
  // safe; the per-provider sends are what the deadline guards.
  const resolved = await resolveBatch(slice);
  const deadline = Date.now() + DEADLINE_MS;
  let questionEmailsSent = 0;
  let leadEmailsSent = 0;
  let providersFlushed = 0;
  let scanned = 0;
  let hitDeadline = false;

  for (const id of slice) {
    if (Date.now() > deadline) {
      hitDeadline = true;
      break;
    }
    scanned++;
    const r = resolved.get(id);
    const email = r?.email?.toLowerCase();
    if (!email) continue;
    if (deliverable && !deliverable.has(email)) continue;

    const variantSet = new Set<string>();
    if (r!.sourceProviderId && r!.sourceProviderId !== id) variantSet.add(r!.sourceProviderId);
    if (r!.bpSlug && r!.bpSlug !== id) variantSet.add(r!.bpSlug);

    try {
      const res = await sendDeferredNotificationsForProvider({
        profileId: r!.profileId || "",
        email: r!.email!,
        providerName: r!.name || id,
        providerSlug: id,
        additionalSlugVariants: Array.from(variantSet),
        maxQuestions: perProvider,
      });
      questionEmailsSent += res.questionEmailsSent;
      leadEmailsSent += res.leadEmailsSent;
      if (res.questionEmailsSent > 0 || res.leadEmailsSent > 0) providersFlushed++;
    } catch (err) {
      console.error(`[flush-backlog] provider ${id} failed:`, err);
    }
  }

  // Done when we walked the whole current backlog without hitting the deadline.
  const done = !hitDeadline;

  await logAuditAction({
    adminUserId: params.adminUserId,
    action: "flush_deferred_backlog",
    targetType: "email",
    targetId: `flush:${totalProviders}`,
    details: { scanned, totalProviders, providersFlushed, questionEmailsSent, leadEmailsSent, perProvider, onlyDeliverable, done },
  });

  return NextResponse.json({
    success: true,
    providersFlushed,
    questionEmailsSent,
    leadEmailsSent,
    providersScanned: scanned,
    totalProvidersWithBacklog: totalProviders,
    done,
    message: done
      ? `Backlog drained. Sent ${questionEmailsSent} question + ${leadEmailsSent} lead notification(s) across ${providersFlushed} provider(s).`
      : `Sent ${questionEmailsSent} question + ${leadEmailsSent} lead notification(s) across ${providersFlushed} provider(s). Hit the time limit — re-run the same URL (no offset) to continue.`,
  });
}

async function authed() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const adminUser = await getAdminUser(user.id);
  if (!adminUser) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { adminUserId: adminUser.id };
}

function parseParams(sp: URLSearchParams, adminUserId: string) {
  const perProvider = (() => {
    const n = parseInt(sp.get("perProvider") || "", 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PER_PROVIDER;
  })();
  return {
    dryRun: sp.get("dryRun") === "1" || sp.get("dryRun") === "true",
    perProvider,
    onlyDeliverable: sp.get("onlyDeliverable") !== "0",
    adminUserId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const a = await authed();
    if (a.error) return a.error;
    return await handle(parseParams(request.nextUrl.searchParams, a.adminUserId));
  } catch (err) {
    console.error("Flush deferred backlog error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const a = await authed();
    if (a.error) return a.error;
    const body = await request.json().catch(() => ({}));
    const sp = new URLSearchParams();
    for (const k of ["dryRun", "perProvider", "onlyDeliverable"]) {
      if (body[k] != null) sp.set(k, String(body[k]));
    }
    return await handle(parseParams(sp, a.adminUserId));
  } catch (err) {
    console.error("Flush deferred backlog error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
