import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient, logAuditAction } from "@/lib/admin";
import { recheckDraft } from "@/lib/family-answers/engine.server";
import { MAX_REPLY_CHARS, type RecheckRecord } from "@/lib/family-answers/types";

/**
 * POST /api/admin/sms-inbox/[phone]/recheck  — { body }
 *
 * Run the adversarial pass against a draft a human wrote, rather than the one
 * the engine did.
 *
 * The packet on the thread carries objections, sources and a rebuttal, all of
 * them about `packet.draft`. Edit that draft and the panel keeps displaying
 * them, so the review surface looks MORE trustworthy for a replacement nobody
 * has checked than it would for an empty one. This is the endpoint that closes
 * that, and it exists because on 2026-08-31 the only way to do it was to paste
 * the message into a browser and read Perplexity by hand.
 *
 * Slow on purpose: web search plus two model calls, tens of seconds. It is a
 * button a person presses while looking at a message they are about to send to
 * a stranger about their parent, not something on a hot path.
 */

export const maxDuration = 300;

function normalizeLast10(raw: string): string | null {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { phone } = await params;
    const last10 = normalizeLast10(phone);
    if (!last10) return NextResponse.json({ error: "Invalid phone" }, { status: 400 });

    const payload = (await request.json().catch(() => ({}))) as { body?: unknown };
    const text = typeof payload.body === "string" ? payload.body.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Nothing to check." }, { status: 400 });
    }
    if (text.length > MAX_REPLY_CHARS) {
      return NextResponse.json(
        { error: `Draft is too long (${MAX_REPLY_CHARS} characters max)` },
        { status: 400 },
      );
    }

    const db = getServiceClient();

    // The checker needs the question to judge whether the answer is responsive,
    // not merely true. A message can be entirely accurate and still answer
    // something nobody asked, which is the failure mode a fact-checker alone
    // will never report.
    const { data: job } = await db
      .from("family_answer_jobs")
      .select("id, body, packet, rechecks")
      .eq("phone_last10", last10)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const question =
      job?.body ??
      (
        await db
          .from("sms_inbound")
          .select("body")
          .eq("phone_last10", last10)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data?.body ??
      "(no inbound question on file)";

    const result = await recheckDraft({ draft: text, question });

    // Persisted as history, not as the packet's own objections: the packet
    // records what the ENGINE was told about its own draft, and overwriting it
    // with a check of someone else's text would destroy the only measurement of
    // whether the engine is improving.
    if (job?.id) {
      const record: RecheckRecord = {
        at: result.at,
        by: user.email ?? admin.id,
        draft: result.draft,
        claims: result.claims,
        objections: result.objections,
        suggestedDraft: result.suggestedDraft,
        notes: result.notes,
        ...(result.errors ? { errors: result.errors } : {}),
      };
      const history = Array.isArray(job.rechecks) ? (job.rechecks as RecheckRecord[]) : [];
      const { error } = await db
        .from("family_answer_jobs")
        .update({ rechecks: [...history, record] })
        .eq("id", job.id);
      if (error) console.error("[admin/sms-inbox/recheck] history write failed:", error);
    }

    await logAuditAction({
      adminUserId: admin.id,
      action: "sms_draft_rechecked",
      targetType: "phone",
      targetId: last10,
      details: {
        length: text.length,
        objections: result.objections.length,
        accepted: result.objections.filter((o) => o.verdict === "accepted").length,
        changed: result.suggestedDraft !== result.draft,
      },
    });

    return NextResponse.json({ success: true, recheck: result });
  } catch (error) {
    console.error("[admin/sms-inbox/recheck] error:", error);
    return NextResponse.json({ error: "Re-check failed" }, { status: 500 });
  }
}
