import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/analytics/variant-sessions/[session_id]?variant=<arm>
 *
 * Drill-in detail for one session in the Family Intake variant table.
 * The list endpoint at the parent route returns one row per session
 * with the furthest stage; this endpoint adds the full event timeline
 * + arm-specific submission extras so the drawer can show everything
 * we know about that session in one place.
 *
 * Response shape:
 *   {
 *     session_id, variant,
 *     events: [{ event_type, created_at, metadata, source }, ...],  // sorted oldest-first
 *     submission?: {
 *       // benefits arms
 *       email?, phone?, city?, state?, care_types?, timeline?, relationship?, account_id?,
 *       // outreach arm
 *       email?, relationship?, target_providers?, question_text?,
 *       // qa_email_capture arm
 *       email?, question_text?,
 *     }
 *   }
 *
 * `source` on each event tells the drawer which table the event came
 * from ("seeker_activity" / "provider_activity") so the operator can
 * tell apart provider-side telemetry from family-side.
 */

const VALID_VARIANTS = new Set([
  "availability",
  "loss",
  "empathic",
  "outreach",
  "qa_email_capture",
  "control",
  "money_loss",
]);

interface TimelineEvent {
  event_type: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
  source: "seeker_activity" | "provider_activity";
}

interface SubmissionDetail {
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  care_types?: string[] | null;
  timeline?: string | null;
  relationship?: string | null;
  account_id?: string | null;
  target_providers?: Array<{ id: string; name: string; slug?: string | null }> | null;
  question_text?: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { session_id: sessionId } = await params;
    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }
    const variant = request.nextUrl.searchParams.get("variant") || "";
    if (!VALID_VARIANTS.has(variant)) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }

    const db = getServiceClient();

    // ── Event timeline ───────────────────────────────────────────────────
    // Pull seeker_activity + provider_activity events keyed on
    // metadata.session_id. Both tables matter — benefits funnel events
    // live in provider_activity, the others in seeker_activity. Dedup
    // is unnecessary because event_type spaces don't overlap.
    const [seekerRes, providerRes] = await Promise.all([
      db
        .from("seeker_activity")
        .select("event_type, created_at, metadata")
        .filter("metadata->>session_id", "eq", sessionId)
        .order("created_at", { ascending: true })
        .limit(200),
      db
        .from("provider_activity")
        .select("event_type, created_at, metadata")
        .filter("metadata->>session_id", "eq", sessionId)
        .order("created_at", { ascending: true })
        .limit(200),
    ]);

    const events: TimelineEvent[] = [];
    if (!seekerRes.error) {
      for (const row of (seekerRes.data ?? []) as Array<{
        event_type: string;
        created_at: string;
        metadata: Record<string, unknown> | null;
      }>) {
        events.push({ ...row, source: "seeker_activity" });
      }
    }
    if (!providerRes.error) {
      for (const row of (providerRes.data ?? []) as Array<{
        event_type: string;
        created_at: string;
        metadata: Record<string, unknown> | null;
      }>) {
        events.push({ ...row, source: "provider_activity" });
      }
    }
    // Merge-sort across the two tables.
    events.sort((a, b) =>
      a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0,
    );

    // ── Submission detail (only meaningful when session reached Submitted) ──
    let submission: SubmissionDetail | undefined;

    if (variant === "outreach") {
      // agent_outreach_requests stores only seeker_email, target_provider_ids
      // (slug-like text array), question_text, and standard fulfillment
      // metadata. relationship/target_provider_names are NOT persisted —
      // the form collects relationship for the Slack alert but the row
      // doesn't carry it forward. Drawer just shows what's there.
      const { data: row } = await db
        .from("agent_outreach_requests")
        .select("seeker_email, target_provider_ids, question_text")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (row) {
        const ids = Array.isArray(row.target_provider_ids) ? (row.target_provider_ids as string[]) : [];
        const target_providers = ids.map((id) => ({ id, name: id, slug: id }));
        submission = {
          email: row.seeker_email as string | null,
          target_providers: target_providers.length > 0 ? target_providers : null,
          question_text: (row.question_text as string | null) ?? null,
        };
      }
    } else if (variant === "qa_email_capture") {
      // Find the linked provider_question. Two paths:
      //   1. Modern: enrichment event's metadata.question_id (post-#753
      //      session_id threading).
      //   2. Legacy fallback: the list endpoint uses question_id as the
      //      row key when the enrichment event predates session_id
      //      threading. In that case the URL's `session_id` param IS the
      //      question_id, and looking it up against provider_questions.id
      //      directly finds the row.
      const enrichEvent = events.find(
        (e) => e.event_type === "question_email_enriched" && typeof e.metadata?.question_id === "string",
      );
      const qid = enrichEvent
        ? (enrichEvent.metadata?.question_id as string)
        : sessionId;
      if (qid) {
        const { data: q } = await db
          .from("provider_questions")
          .select("asker_email, question, asker_name")
          .eq("id", qid)
          .maybeSingle();
        if (q) {
          submission = {
            email: (q.asker_email as string | null) ?? null,
            question_text: (q.question as string | null) ?? null,
          };
        }
      }
    } else {
      // benefits arms (availability/loss/empathic/control/money_loss)
      const { data: acct } = await db
        .from("accounts")
        .select("id, active_profile_id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (acct?.active_profile_id) {
        const { data: bp } = await db
          .from("business_profiles")
          .select("email, phone, city, state, care_types, metadata")
          .eq("id", acct.active_profile_id)
          .eq("type", "family")
          .maybeSingle();
        if (bp) {
          const meta = (bp.metadata as Record<string, unknown> | null) ?? {};
          submission = {
            email: (bp.email as string | null) ?? null,
            phone: (bp.phone as string | null) ?? null,
            city: (bp.city as string | null) ?? null,
            state: (bp.state as string | null) ?? null,
            care_types: Array.isArray(bp.care_types) ? (bp.care_types as string[]) : null,
            timeline: typeof meta.timeline === "string" ? (meta.timeline as string) : null,
            relationship:
              typeof meta.relationship_to_recipient === "string"
                ? (meta.relationship_to_recipient as string)
                : null,
            account_id: acct.active_profile_id as string,
          };
        }
      }
    }

    return NextResponse.json({
      session_id: sessionId,
      variant,
      events,
      submission,
    });
  } catch (err) {
    console.error("[variant-sessions detail] uncaught:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
