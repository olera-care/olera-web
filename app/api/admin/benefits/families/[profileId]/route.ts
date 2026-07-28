import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  readBenefitsCascade,
  readBenefitsCase,
  type BenefitsCaseMeta,
} from "@/lib/family-comms/benefits-cascade.server";

/**
 * Per-family case endpoints for the Benefits caseload view
 * (plans/benefits-case-management.md).
 *
 * GET  → the case timeline: every touch in chronological order, assembled
 *        from data that already exists (seeker_activity, email_log, the
 *        benefits_cascade stamps, results-page views, case actions). The
 *        story of one family, and where it stopped.
 * POST → case actions: { action: "note", text } | { action: "contacted" } |
 *        { action: "resolved" } | { action: "reopen" }. Stored on
 *        metadata.benefits_case so casework leaves a record Cess can inherit.
 */

interface TimelineEvent {
  at: string;
  kind: string;
  label: string;
  detail?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { profileId } = await params;
    const db = getServiceClient();

    const { data: profile } = await db
      .from("business_profiles")
      .select("id, email, metadata")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const meta = (profile.metadata as Record<string, unknown>) || {};
    const cascade = readBenefitsCascade(meta);
    const caseMeta = readBenefitsCase(meta);
    const events: TimelineEvent[] = [];
    const push = (at: string | null | undefined, kind: string, label: string, detail?: string) => {
      if (at) events.push({ at, kind, label, detail });
    };

    // Activity events
    const { data: acts } = await db
      .from("seeker_activity")
      .select("event_type, created_at, metadata")
      .eq("profile_id", profileId)
      .in("event_type", ["benefits_completed", "profile_enriched", "benefits_outcome_reported"])
      .order("created_at");
    for (const a of acts ?? []) {
      const m = (a.metadata as Record<string, unknown>) || {};
      if (a.event_type === "benefits_completed") {
        push(a.created_at, "intake", "Completed benefits intake", `${m.match_count ?? "?"} programs matched · ${m.entry_source || "direct"}`);
      } else if (a.event_type === "profile_enriched") {
        const fields = Array.isArray(m.enriched_fields) ? (m.enriched_fields as string[]).join(", ") : "";
        push(a.created_at, "enriched", "Answered follow-up questions", fields + (m.sms_sent ? " · results texted" : ""));
      } else {
        push(a.created_at, "outcome", `Check-in answer: ${String(m.value || "?").replace(/_/g, " ")}`);
      }
    }

    // Cascade emails + engagement
    if (profile.email) {
      const { data: logs } = await db
        .from("email_log")
        .select("email_type, created_at, first_opened_at, first_clicked_at, status")
        .eq("recipient", profile.email)
        .in("email_type", ["benefits_results_saved", "benefits_first_step", "benefits_check_in"])
        .order("created_at");
      const LABELS: Record<string, string> = {
        benefits_results_saved: "Results email",
        benefits_first_step: "First-step email (day 2-3)",
        benefits_check_in: "Check-in email (day 5-6)",
      };
      for (const l of logs ?? []) {
        push(l.created_at, "email", `${LABELS[l.email_type] || l.email_type} sent`);
        push(l.first_opened_at, "email_open", `${LABELS[l.email_type] || l.email_type} opened`);
        push(l.first_clicked_at, "email_click", `${LABELS[l.email_type] || l.email_type} clicked`);
      }
    }

    // Cascade stamps (SMS mirrors + journey acts)
    push(cascade.first_step_sms_at, "sms", "First-step text sent");
    push(cascade.check_sms_at, "sms", "Check-in text sent");
    push(
      cascade.first_step_done_at,
      "acted",
      "Marked the call done on their plan",
      cascade.first_step_program_name || undefined,
    );

    // Plan views + checklist
    const { data: tokens } = await db
      .from("benefits_results_tokens")
      .select("last_viewed_at")
      .eq("profile_id", profileId);
    for (const t of tokens ?? []) {
      push(t.last_viewed_at, "viewed", "Viewed their plan page (latest)");
    }
    if (cascade.docs_checked?.length) {
      events.push({
        at: cascade.first_step_done_at || new Date().toISOString(),
        kind: "docs",
        label: `Checked ${cascade.docs_checked.length} document${cascade.docs_checked.length === 1 ? "" : "s"} on their checklist`,
        detail: cascade.docs_checked.join("; "),
      });
    }

    // Case actions
    for (const n of caseMeta.notes ?? []) push(n.at, "note", `Note by ${n.by}`, n.text);
    push(caseMeta.contacted_at, "case", "Marked contacted");
    push(caseMeta.resolved_at, "case", "Marked resolved");

    events.sort((a, b) => a.at.localeCompare(b.at));
    return NextResponse.json({ events, caseMeta });
  } catch (err) {
    console.error("Admin benefits timeline error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { profileId } = await params;
    const body = await request.json();
    const action: string = body.action || "";
    if (!["note", "contacted", "resolved", "reopen"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = getServiceClient();
    const { data: profile } = await db
      .from("business_profiles")
      .select("id, metadata")
      .eq("id", profileId)
      .maybeSingle();
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const meta = (profile.metadata as Record<string, unknown>) || {};
    const caseMeta = readBenefitsCase(meta);
    const now = new Date().toISOString();
    const by = adminUser.display_name || user.email || "admin";
    let next: BenefitsCaseMeta = caseMeta;

    if (action === "note") {
      const text = typeof body.text === "string" ? body.text.trim().slice(0, 1000) : "";
      if (!text) return NextResponse.json({ error: "Note text required" }, { status: 400 });
      next = { ...caseMeta, notes: [...(caseMeta.notes ?? []), { at: now, by, text }].slice(-20) };
    } else if (action === "contacted") {
      next = { ...caseMeta, contacted_at: now };
    } else if (action === "resolved") {
      next = { ...caseMeta, resolved_at: now };
    } else {
      next = { ...caseMeta, resolved_at: undefined, contacted_at: undefined };
    }

    const { error: updErr } = await db
      .from("business_profiles")
      .update({ metadata: { ...meta, benefits_case: next } })
      .eq("id", profileId);
    if (updErr) {
      console.error("Admin benefits case update failed:", updErr);
      return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, caseMeta: next });
  } catch (err) {
    console.error("Admin benefits case error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
