import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import {
  loadProviderTimeline,
  loadRelationships,
  relationshipsToMarkdown,
  timelineToMarkdown,
} from "@/lib/touches/timeline.server";
import { TOUCH_CHANNELS, TOUCH_DIRECTIONS, TOUCH_SOURCES, type TouchInput } from "@/lib/touches/types";

/**
 * Provider touch log.
 *
 * A relationship is a history, not a status. This reads and writes that history:
 * hand-sent emails, texts, calls, meetings, and the one next action each implies.
 * System sends (email_log) and campaign events (ad_campaign_log) are merged into
 * the timeline at read time and never copied.
 *
 * GET  — reads. Supported in the browser so a record can be opened without tooling.
 *
 *   /api/admin/touches                         the Relationships list (Tuesday view)
 *   /api/admin/touches?provider=<uuid>         one provider's full timeline
 *   ...&format=md                              either read as markdown, for pasting
 *                                              into a session or reading in a tab
 *
 * POST — append one touch. Body is a TouchInput (lib/touches/types.ts).
 *
 *   Logging a touch that declares a next action closes the provider's earlier open
 *   next actions. "The next action" is therefore always the latest declared, and
 *   the list never shows two for one provider.
 *
 * PATCH — { id, done: true } marks a touch's next action done.
 *         { id, next_action, next_action_due, next_action_owner } edits it.
 *
 * Auth: admin only.
 */

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const admin = await getAdminUser(user.id);
  if (!admin) return { error: NextResponse.json({ error: "Access denied" }, { status: 403 }) };
  return { admin };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  const params = new URL(request.url).searchParams;
  const provider = params.get("provider");
  const md = params.get("format") === "md";

  try {
    if (provider) {
      if (!UUID_RE.test(provider)) {
        return NextResponse.json({ error: "provider must be a business_profiles UUID" }, { status: 400 });
      }
      const timeline = await loadProviderTimeline(provider);
      if (!timeline) return NextResponse.json({ error: "Provider not found" }, { status: 404 });
      if (md) return new NextResponse(timelineToMarkdown(timeline), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
      return NextResponse.json(timeline);
    }
    const rows = await loadRelationships();
    if (md) return new NextResponse(relationshipsToMarkdown(rows), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[touches] GET failed:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

function clean(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return t.length ? t : null;
}

export async function POST(request: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  const { admin } = gate;

  let body: Partial<TouchInput>;
  try {
    body = (await request.json()) as Partial<TouchInput>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const provider_id = clean(body.provider_id);
  const channel = clean(body.channel);
  const direction = clean(body.direction);
  const summary = clean(body.summary);
  const source = clean(body.source) ?? "manual";
  const occurred_at = clean(body.occurred_at);
  const next_action = clean(body.next_action);
  const next_action_due = clean(body.next_action_due);
  const next_action_owner = clean(body.next_action_owner);

  if (!provider_id || !UUID_RE.test(provider_id)) {
    return NextResponse.json({ error: "provider_id must be a business_profiles UUID" }, { status: 400 });
  }
  if (!channel || !(TOUCH_CHANNELS as readonly string[]).includes(channel)) {
    return NextResponse.json({ error: `channel must be one of ${TOUCH_CHANNELS.join(", ")}` }, { status: 400 });
  }
  if (!direction || !(TOUCH_DIRECTIONS as readonly string[]).includes(direction)) {
    return NextResponse.json({ error: "direction must be out or in" }, { status: 400 });
  }
  if (!(TOUCH_SOURCES as readonly string[]).includes(source)) {
    return NextResponse.json({ error: `source must be one of ${TOUCH_SOURCES.join(", ")}` }, { status: 400 });
  }
  if (!summary) return NextResponse.json({ error: "summary is required" }, { status: 400 });
  if (summary.length > 240) return NextResponse.json({ error: "summary is one line; put the rest in detail" }, { status: 400 });
  if (occurred_at && Number.isNaN(Date.parse(occurred_at))) {
    return NextResponse.json({ error: "occurred_at must be an ISO timestamp" }, { status: 400 });
  }
  if (next_action_due && !DATE_RE.test(next_action_due)) {
    return NextResponse.json({ error: "next_action_due must be YYYY-MM-DD" }, { status: 400 });
  }
  if (!next_action && (next_action_due || next_action_owner)) {
    return NextResponse.json({ error: "a due date or owner needs a next action" }, { status: 400 });
  }

  const db = getServiceClient();

  // Confirm the provider exists before writing; a typo here would 500 on the FK.
  const { data: profile } = await db.from("business_profiles").select("id").eq("id", provider_id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const nowIso = new Date().toISOString();
  const author = admin.display_name || admin.email || "admin";

  // A new next action supersedes the open ones. Done, not deleted: the history of
  // what we meant to do next is part of the record.
  if (next_action) {
    const { error: closeErr } = await db
      .from("provider_touches")
      .update({ next_action_done_at: nowIso })
      .eq("provider_id", provider_id)
      .not("next_action", "is", null)
      .is("next_action_done_at", null);
    if (closeErr) {
      console.error("[touches] failed to close prior actions:", closeErr);
      return NextResponse.json({ error: "Failed to update earlier next actions" }, { status: 500 });
    }
  }

  const { data, error } = await db
    .from("provider_touches")
    .insert({
      provider_id,
      channel,
      direction,
      occurred_at: occurred_at ?? nowIso,
      summary,
      detail: clean(body.detail),
      contact_name: clean(body.contact_name),
      contact_handle: clean(body.contact_handle),
      source,
      source_ref: clean(body.source_ref),
      next_action,
      next_action_due,
      next_action_owner,
      author,
      admin_user_id: admin.id,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[touches] insert failed:", error);
    return NextResponse.json({ error: "Failed to log touch" }, { status: 500 });
  }
  return NextResponse.json({ touch: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;

  let body: { id?: string; done?: boolean; next_action?: string | null; next_action_due?: string | null; next_action_owner?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = clean(body.id);
  if (!id || !UUID_RE.test(id)) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const db = getServiceClient();
  const patch: Record<string, unknown> = {};

  if (body.done === true) {
    patch.next_action_done_at = new Date().toISOString();
  } else {
    if ("next_action" in body) patch.next_action = clean(body.next_action);
    if ("next_action_due" in body) {
      const d = clean(body.next_action_due);
      if (d && !DATE_RE.test(d)) return NextResponse.json({ error: "next_action_due must be YYYY-MM-DD" }, { status: 400 });
      patch.next_action_due = d;
    }
    if ("next_action_owner" in body) patch.next_action_owner = clean(body.next_action_owner);
    if (patch.next_action === null) {
      patch.next_action_due = null;
      patch.next_action_owner = null;
      patch.next_action_done_at = null;
    }
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await db.from("provider_touches").update(patch).eq("id", id).select("*").single();
  if (error) {
    console.error("[touches] patch failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  return NextResponse.json({ touch: data });
}
