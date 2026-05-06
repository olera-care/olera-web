import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { StakeholderType } from "@/lib/student-outreach/types";

/**
 * GET /api/admin/student-outreach/emails-sent
 *
 * Returns the most recent `email_sent` touchpoints across all
 * stakeholders, with the stakeholder context inlined so the UI can
 * render row cards without follow-up fetches.
 *
 * Each row carries:
 *   - touchpoint id, outreach_id, sent_at
 *   - recipient (name + email, from payload)
 *   - cadence_day + template (from payload)
 *   - success (from payload — failed sends still create a touchpoint)
 *   - has_reply: true if the same outreach has any email_replied
 *     touchpoint AFTER this email's sent_at (single-pass match)
 *   - org / campus / type, primary contact name (for the row card chrome)
 *
 * Optional query params:
 *   - campus    campus slug; narrows to that campus's outreach rows
 *   - type      stakeholder_type; narrows to that type
 *   - limit     default 100, max 500
 */

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const campusSlug = url.searchParams.get("campus");
  const type = url.searchParams.get("type") as StakeholderType | null;
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 100 : limitRaw), 500);

  const db = getServiceClient();

  // Resolve campus id once if filter set.
  let campusId: string | null = null;
  if (campusSlug) {
    const { data: campus } = await db
      .from("student_outreach_campuses")
      .select("id")
      .eq("slug", campusSlug)
      .single();
    if (!campus) return NextResponse.json({ rows: [] });
    campusId = (campus as { id: string }).id;
  }

  // Pull recent email_sent touchpoints. Server-side ORDER BY created_at
  // DESC + LIMIT keeps the payload bounded.
  const { data: tps, error: tpErr } = await db
    .from("student_outreach_touchpoints")
    .select("id, outreach_id, created_at, payload")
    .eq("touchpoint_type", "email_sent")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (tpErr) {
    console.error("emails-sent fetch:", tpErr);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
  const sentRows = (tps ?? []) as Array<{
    id: string;
    outreach_id: string;
    created_at: string;
    payload: Record<string, unknown> | null;
  }>;
  if (sentRows.length === 0) return NextResponse.json({ rows: [] });

  const outreachIds = Array.from(new Set(sentRows.map((r) => r.outreach_id)));

  // Stakeholder context.
  let outreachQ = db
    .from("student_outreach")
    .select("id, organization_name, stakeholder_type, campus_id")
    .in("id", outreachIds);
  if (campusId) outreachQ = outreachQ.eq("campus_id", campusId);
  if (type) outreachQ = outreachQ.eq("stakeholder_type", type);
  const { data: outreaches } = await outreachQ;
  const outreachMap = new Map(
    ((outreaches ?? []) as Array<{
      id: string;
      organization_name: string;
      stakeholder_type: StakeholderType;
      campus_id: string;
    }>).map((o) => [o.id, o]),
  );

  // Campus names (for the subtitle).
  const campusIds = Array.from(
    new Set(Array.from(outreachMap.values()).map((o) => o.campus_id)),
  );
  const campusMap = new Map<string, string>();
  if (campusIds.length > 0) {
    const { data: camps } = await db
      .from("student_outreach_campuses")
      .select("id, name")
      .in("id", campusIds);
    for (const c of (camps ?? []) as Array<{ id: string; name: string }>) {
      campusMap.set(c.id, c.name);
    }
  }

  // Primary contact per outreach (for the headline fallback).
  const primaryByOutreach = new Map<string, string>();
  if (outreachIds.length > 0) {
    const { data: contacts } = await db
      .from("student_outreach_contacts")
      .select("outreach_id, name, title, first_name, last_name, is_primary, created_at")
      .in("outreach_id", outreachIds)
      .eq("status", "active")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });
    for (const c of (contacts ?? []) as Array<{
      outreach_id: string;
      name: string;
      title: string | null;
      first_name: string | null;
      last_name: string | null;
    }>) {
      if (primaryByOutreach.has(c.outreach_id)) continue;
      const composed = [c.title, c.first_name, c.last_name]
        .map((s) => s?.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      primaryByOutreach.set(c.outreach_id, composed || c.name);
    }
  }

  // Reply-after-sent: find the latest email_replied per outreach so we can
  // mark a sent email as "replied" if it was followed by a reply.
  const latestReplyByOutreach = new Map<string, string>();
  if (outreachIds.length > 0) {
    const { data: replies } = await db
      .from("student_outreach_touchpoints")
      .select("outreach_id, created_at")
      .in("outreach_id", outreachIds)
      .eq("touchpoint_type", "email_replied")
      .order("created_at", { ascending: false });
    for (const r of (replies ?? []) as Array<{ outreach_id: string; created_at: string }>) {
      if (latestReplyByOutreach.has(r.outreach_id)) continue;
      latestReplyByOutreach.set(r.outreach_id, r.created_at);
    }
  }

  const rows = sentRows
    .map((tp) => {
      const o = outreachMap.get(tp.outreach_id);
      if (!o) return null; // filtered out by campus/type
      const payload = tp.payload ?? {};
      const lastReply = latestReplyByOutreach.get(tp.outreach_id);
      const hasReply = lastReply ? lastReply > tp.created_at : false;
      return {
        id: tp.id,
        outreach_id: tp.outreach_id,
        sent_at: tp.created_at,
        recipient_name:
          typeof payload.recipient_name === "string"
            ? (payload.recipient_name as string)
            : null,
        recipient_email:
          typeof payload.recipient_email === "string"
            ? (payload.recipient_email as string)
            : null,
        cadence_day:
          typeof payload.cadence_day === "number"
            ? (payload.cadence_day as number)
            : null,
        template:
          typeof payload.template === "string" ? (payload.template as string) : null,
        success: payload.success !== false, // legacy rows w/o flag count as sent
        has_reply: hasReply,
        organization_name: o.organization_name,
        stakeholder_type: o.stakeholder_type,
        campus_name: campusMap.get(o.campus_id) ?? "(unknown campus)",
        primary_contact_name: primaryByOutreach.get(tp.outreach_id) ?? null,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ rows });
}
