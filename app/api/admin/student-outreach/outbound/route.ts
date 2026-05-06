import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import type { StakeholderType } from "@/lib/student-outreach/types";

/**
 * GET /api/admin/student-outreach/outbound
 *
 * Activity-log view of outbound communications across stakeholders,
 * grouped by stakeholder thread (one row per outreach_id) and sorted
 * Gmail-inbox style — threads whose latest reply is newer than their
 * latest outbound float to the top, then everything else by recency.
 *
 * "Outbound" includes:
 *   - email_sent
 *   - ig_dm_sent
 *   - contact_form_submitted
 *
 * "Reply" includes:
 *   - email_replied
 *   - ig_dm_replied
 *
 * Each row carries:
 *   - outreach_id, stakeholder context (org / campus / type / primary
 *     contact)
 *   - latest_outbound_at + channel of that latest send
 *   - latest_reply_at + channel (null when no replies yet)
 *   - has_pending_reply: latest_reply_at is newer than latest_outbound_at
 *     (i.e. a reply landed and we haven't sent anything since)
 *   - outbound_count: total outbound touchpoints on this stakeholder
 *
 * Optional query params:
 *   - campus    campus slug
 *   - type      stakeholder_type
 *   - limit     default 100, max 500 — caps the result count after sort
 */

const OUTBOUND_TYPES = ["email_sent", "ig_dm_sent", "contact_form_submitted"];
const REPLY_TYPES = ["email_replied", "ig_dm_replied"];

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const campusSlug = url.searchParams.get("campus");
  const typeFilter = url.searchParams.get("type") as StakeholderType | null;
  const limitRaw = parseInt(url.searchParams.get("limit") ?? "100", 10);
  const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 100 : limitRaw), 500);

  const db = getServiceClient();

  // Resolve campus filter once.
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

  // Pull recent outbound + reply touchpoints in one shot. Bounded by
  // a generous-but-finite limit so we have enough data to group by
  // outreach without dragging the entire history every page load.
  // We pull more than `limit` because grouping reduces row count.
  const fetchCap = Math.max(limit * 6, 600);

  const [outboundRes, replyRes] = await Promise.all([
    db
      .from("student_outreach_touchpoints")
      .select("outreach_id, touchpoint_type, created_at")
      .in("touchpoint_type", OUTBOUND_TYPES)
      .order("created_at", { ascending: false })
      .limit(fetchCap),
    db
      .from("student_outreach_touchpoints")
      .select("outreach_id, touchpoint_type, created_at")
      .in("touchpoint_type", REPLY_TYPES)
      .order("created_at", { ascending: false })
      .limit(fetchCap),
  ]);

  if (outboundRes.error) {
    console.error("outbound fetch:", outboundRes.error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }

  type Tp = { outreach_id: string; touchpoint_type: string; created_at: string };
  const outboundTps = (outboundRes.data ?? []) as Tp[];
  const replyTps = (replyRes.data ?? []) as Tp[];

  if (outboundTps.length === 0) return NextResponse.json({ rows: [] });

  // Aggregate per outreach.
  type Bucket = {
    outreach_id: string;
    latest_outbound_at: string;
    latest_outbound_channel: string;
    outbound_count: number;
    latest_reply_at: string | null;
    latest_reply_channel: string | null;
  };
  const byOutreach = new Map<string, Bucket>();
  for (const t of outboundTps) {
    const b = byOutreach.get(t.outreach_id);
    if (!b) {
      byOutreach.set(t.outreach_id, {
        outreach_id: t.outreach_id,
        latest_outbound_at: t.created_at,
        latest_outbound_channel: channelOf(t.touchpoint_type),
        outbound_count: 1,
        latest_reply_at: null,
        latest_reply_channel: null,
      });
    } else {
      b.outbound_count++;
      // outboundTps is desc-sorted so the first one we saw is the latest.
    }
  }
  for (const t of replyTps) {
    const b = byOutreach.get(t.outreach_id);
    if (!b) continue; // reply with no prior outbound — skip (rare)
    if (b.latest_reply_at === null) {
      b.latest_reply_at = t.created_at;
      b.latest_reply_channel = channelOf(t.touchpoint_type);
    }
  }

  const outreachIds = Array.from(byOutreach.keys());

  // Stakeholder context, with campus + type filtering.
  let outreachQ = db
    .from("student_outreach")
    .select("id, organization_name, stakeholder_type, campus_id, status")
    .in("id", outreachIds);
  if (campusId) outreachQ = outreachQ.eq("campus_id", campusId);
  if (typeFilter) outreachQ = outreachQ.eq("stakeholder_type", typeFilter);
  const { data: outreaches } = await outreachQ;
  type OutreachLite = {
    id: string;
    organization_name: string;
    stakeholder_type: StakeholderType;
    campus_id: string;
    status: string;
  };
  const outreachMap = new Map<string, OutreachLite>(
    ((outreaches ?? []) as OutreachLite[]).map((o) => [o.id, o]),
  );

  if (outreachMap.size === 0) return NextResponse.json({ rows: [] });

  // Campus names.
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

  // Primary contact per outreach.
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

  // Build rows + sort: replies-after-outbound first (Gmail-inbox feel),
  // then by latest_outbound_at desc.
  const rows = Array.from(byOutreach.values())
    .filter((b) => outreachMap.has(b.outreach_id))
    .map((b) => {
      const o = outreachMap.get(b.outreach_id)!;
      const hasPendingReply =
        b.latest_reply_at !== null && b.latest_reply_at > b.latest_outbound_at;
      return {
        outreach_id: b.outreach_id,
        organization_name: o.organization_name,
        stakeholder_type: o.stakeholder_type,
        campus_name: campusMap.get(o.campus_id) ?? "(unknown campus)",
        primary_contact_name: primaryByOutreach.get(b.outreach_id) ?? null,
        latest_outbound_at: b.latest_outbound_at,
        latest_outbound_channel: b.latest_outbound_channel,
        latest_reply_at: b.latest_reply_at,
        latest_reply_channel: b.latest_reply_channel,
        has_pending_reply: hasPendingReply,
        outbound_count: b.outbound_count,
      };
    })
    .sort((a, b) => {
      if (a.has_pending_reply !== b.has_pending_reply) {
        return a.has_pending_reply ? -1 : 1;
      }
      // For threads with pending replies, sort by reply time. For others,
      // by latest send time. Both desc.
      const aKey = a.has_pending_reply
        ? a.latest_reply_at ?? a.latest_outbound_at
        : a.latest_outbound_at;
      const bKey = b.has_pending_reply
        ? b.latest_reply_at ?? b.latest_outbound_at
        : b.latest_outbound_at;
      return bKey.localeCompare(aKey);
    })
    .slice(0, limit);

  return NextResponse.json({ rows });
}

function channelOf(touchpointType: string): string {
  if (touchpointType.startsWith("email_")) return "email";
  if (touchpointType.startsWith("ig_dm_")) return "ig_dm";
  if (touchpointType === "contact_form_submitted") return "contact_form";
  return "other";
}
