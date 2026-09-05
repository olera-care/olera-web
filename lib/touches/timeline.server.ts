import { getServiceClient } from "@/lib/admin";
import type {
  LastTouch,
  OpenAction,
  ProviderContact,
  ProviderTimeline,
  RelationshipFlag,
  RelationshipRow,
  TimelineItem,
  TouchRow,
} from "./types";

export type { ProviderTimeline } from "./types";

/**
 * Read side of the provider touch log.
 *
 * Two reads:
 *   loadRelationships()      — the Tuesday list. One row per provider we are in a
 *                              relationship with, derived state, sorted by silence.
 *   loadProviderTimeline(id) — everything that happened with one provider, in order,
 *                              from three sources: provider_touches (people),
 *                              email_log (system sends), ad_campaign_log (campaign
 *                              events). Each row says which.
 *
 * "In a relationship with" is defined, for now, as: has an Ad Boost request, or has
 * at least one touch. That set is small (tens), so these functions join in memory
 * rather than in SQL. Revisit if it grows past a few hundred.
 *
 * Nothing here writes. Nothing here stores state.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// email_log.provider_id is a mixed key space (business_profiles UUID in some
// senders, the provider slug in others). We match on every key a profile is known
// by, plus the recipient address, and union the results.
type ProfileRow = {
  id: string;
  display_name: string | null;
  slug: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact_channel: "email" | "sms" | null;
  source_provider_id: string | null;
  metadata: Record<string, unknown> | null;
};

type EmailRow = {
  id: string;
  provider_id: string | null;
  recipient: string | null;
  email_type: string;
  subject: string | null;
  status: string;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  error_message: string | null;
};

type CampaignLogRow = {
  id: string;
  request_id: string | null;
  entry_type: string;
  summary: string;
  detail: string | null;
  occurred_at: string;
  author: string;
};

function toContact(p: ProfileRow): ProviderContact {
  const meta = p.metadata ?? {};
  const claimer = typeof meta.claimer_name === "string" ? meta.claimer_name : null;
  const contactName = typeof meta.contact_name === "string" ? meta.contact_name : null;
  const claimerEmail = typeof meta.claimer_email === "string" ? meta.claimer_email : null;
  return {
    provider_id: p.id,
    display_name: p.display_name ?? p.slug ?? p.id,
    slug: p.slug,
    city: p.city,
    state: p.state,
    contact_name: claimer ?? contactName,
    email: p.email,
    claimer_email: claimerEmail && claimerEmail !== p.email ? claimerEmail : null,
    phone: p.phone,
    preferred_channel: p.preferred_contact_channel ?? null,
  };
}

function profileKeys(p: ProfileRow): string[] {
  return [p.id, p.slug, p.source_provider_id].filter((k): k is string => !!k);
}

function profileAddresses(p: ProfileRow): string[] {
  const meta = p.metadata ?? {};
  const claimerEmail = typeof meta.claimer_email === "string" ? meta.claimer_email : null;
  return [p.email, claimerEmail].filter((k): k is string => !!k).map((e) => e.trim());
}

function emailStatus(e: EmailRow): string {
  if (e.complained_at) return "complained";
  if (e.bounced_at) return "bounced";
  if (e.first_opened_at) return "opened";
  if (e.delivered_at) return "delivered";
  if (e.status === "failed" || e.status === "suppressed") return "failed";
  return e.status;
}

function humanizeEmailType(t: string): string {
  return t.replace(/_/g, " ");
}

function emailToItem(e: EmailRow): TimelineItem {
  const status = emailStatus(e);
  return {
    id: `email:${e.id}`,
    kind: "email",
    actor: "system",
    channel: "email",
    occurred_at: e.created_at,
    title: e.subject ? `${e.subject}` : humanizeEmailType(e.email_type),
    detail:
      status === "failed"
        ? e.error_message ?? "Not sent"
        : `${humanizeEmailType(e.email_type)} · ${status}`,
    source: "system",
    status,
    contact_handle: e.recipient,
    next_action: null,
  };
}

function touchToItem(t: TouchRow): TimelineItem {
  return {
    id: `touch:${t.id}`,
    kind: "touch",
    actor: t.direction,
    channel: t.channel,
    occurred_at: t.occurred_at,
    title: t.summary,
    detail: t.detail,
    source: t.source,
    contact_handle: t.contact_handle,
    next_action: t.next_action
      ? { text: t.next_action, due: t.next_action_due, owner: t.next_action_owner, done_at: t.next_action_done_at }
      : null,
  };
}

function campaignToItem(c: CampaignLogRow): TimelineItem {
  return {
    id: `campaign:${c.id}`,
    kind: "campaign",
    actor: "system",
    channel: "system",
    occurred_at: c.occurred_at,
    title: c.summary,
    detail: c.entry_type.replace(/_/g, " "),
    source: "system",
    next_action: null,
  };
}

function byNewest(a: { occurred_at: string }, b: { occurred_at: string }): number {
  return new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime();
}

function openActionOf(touches: TouchRow[]): OpenAction | null {
  // Touches arrive newest first; the first open declaration is the current one.
  const t = touches.find((x) => x.next_action && !x.next_action_done_at);
  if (!t) return null;
  return {
    touch_id: t.id,
    text: t.next_action as string,
    due: t.next_action_due,
    owner: t.next_action_owner,
    declared_at: t.occurred_at,
  };
}

function daysSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / DAY_MS));
}

async function fetchEmailsFor(
  db: ReturnType<typeof getServiceClient>,
  profiles: ProfileRow[],
  sinceIso: string | null,
): Promise<EmailRow[]> {
  const keys = Array.from(new Set(profiles.flatMap(profileKeys)));
  // email_log stores recipients as sent; profiles may carry mixed case. Query both.
  const addrs = Array.from(new Set(profiles.flatMap(profileAddresses).flatMap((a) => [a, a.toLowerCase()])));
  const select =
    "id, provider_id, recipient, email_type, subject, status, created_at, delivered_at, first_opened_at, bounced_at, complained_at, error_message";

  const out: EmailRow[] = [];
  const seen = new Set<string>();
  const push = (rows: EmailRow[] | null) => {
    for (const r of rows ?? []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
  };

  if (keys.length) {
    let q = db.from("email_log").select(select).eq("recipient_type", "provider").in("provider_id", keys);
    if (sinceIso) q = q.gte("created_at", sinceIso);
    const { data } = await q.order("created_at", { ascending: false }).limit(2000);
    push(data as EmailRow[] | null);
  }
  if (addrs.length) {
    let q = db.from("email_log").select(select).eq("recipient_type", "provider").in("recipient", addrs);
    if (sinceIso) q = q.gte("created_at", sinceIso);
    const { data } = await q.order("created_at", { ascending: false }).limit(2000);
    push(data as EmailRow[] | null);
  }
  return out;
}

/** Which profile does this email belong to? Keys first, then the address. */
function emailOwner(e: EmailRow, byKey: Map<string, string>, byAddr: Map<string, string>): string | null {
  if (e.provider_id && byKey.has(e.provider_id)) return byKey.get(e.provider_id) as string;
  const addr = e.recipient?.toLowerCase();
  if (addr && byAddr.has(addr)) return byAddr.get(addr) as string;
  return null;
}

// ── Relationships list ────────────────────────────────────────────────────────

export async function loadRelationships(): Promise<RelationshipRow[]> {
  const db = getServiceClient();
  const now = new Date();

  const [{ data: requests }, { data: touchedIds }] = await Promise.all([
    db
      .from("ad_campaign_requests")
      .select("provider_id, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    db.from("provider_touches").select("provider_id"),
  ]);

  const campaignStatus = new Map<string, string>();
  for (const r of (requests ?? []) as { provider_id: string; status: string }[]) {
    // newest request wins (ordered desc above)
    if (!campaignStatus.has(r.provider_id)) campaignStatus.set(r.provider_id, r.status);
  }
  const ids = Array.from(
    new Set([
      ...campaignStatus.keys(),
      ...((touchedIds ?? []) as { provider_id: string }[]).map((t) => t.provider_id),
    ]),
  );
  if (!ids.length) return [];

  const [{ data: profiles }, { data: touches }] = await Promise.all([
    db
      .from("business_profiles")
      .select("id, display_name, slug, city, state, email, phone, preferred_contact_channel, source_provider_id, metadata")
      .in("id", ids),
    db.from("provider_touches").select("*").in("provider_id", ids).order("occurred_at", { ascending: false }),
  ]);

  const profileRows = (profiles ?? []) as ProfileRow[];
  const since = new Date(now.getTime() - 120 * DAY_MS).toISOString();
  const emails = await fetchEmailsFor(db, profileRows, since);

  const byKey = new Map<string, string>();
  const byAddr = new Map<string, string>();
  for (const p of profileRows) {
    for (const k of profileKeys(p)) byKey.set(k, p.id);
    for (const a of profileAddresses(p)) byAddr.set(a.toLowerCase(), p.id);
  }

  const touchesBy = new Map<string, TouchRow[]>();
  for (const t of (touches ?? []) as TouchRow[]) {
    const arr = touchesBy.get(t.provider_id) ?? [];
    arr.push(t);
    touchesBy.set(t.provider_id, arr);
  }
  const emailsBy = new Map<string, EmailRow[]>();
  for (const e of emails) {
    const owner = emailOwner(e, byKey, byAddr);
    if (!owner) continue;
    const arr = emailsBy.get(owner) ?? [];
    arr.push(e);
    emailsBy.set(owner, arr);
  }

  const rows: RelationshipRow[] = profileRows.map((p) => {
    const contact = toContact(p);
    const ts = (touchesBy.get(p.id) ?? []).slice().sort(byNewest);
    const es = (emailsBy.get(p.id) ?? []).slice().sort((a, b) => byNewest({ occurred_at: a.created_at }, { occurred_at: b.created_at }));

    const humanTouches = ts.filter((t) => t.source !== "system");
    const lastHuman = humanTouches[0] ?? null;
    const lastTouchCandidates: LastTouch[] = [];
    if (ts[0]) {
      lastTouchCandidates.push({
        occurred_at: ts[0].occurred_at,
        channel: ts[0].channel,
        actor: ts[0].direction,
        source: ts[0].source,
        title: ts[0].summary,
      });
    }
    if (es[0]) {
      lastTouchCandidates.push({
        occurred_at: es[0].created_at,
        channel: "email",
        actor: "system",
        source: "system",
        title: es[0].subject ?? humanizeEmailType(es[0].email_type),
        status: emailStatus(es[0]),
      });
    }
    const lastTouch = lastTouchCandidates.sort(byNewest)[0] ?? null;

    const openAction = openActionOf(ts);
    const flags: RelationshipFlag[] = [];
    const today = now.toISOString().slice(0, 10);
    if (openAction?.due && openAction.due < today) flags.push("overdue");
    if (humanTouches.length === 0) flags.push("never_human");
    if (es.some((e) => e.complained_at)) flags.push("complaint_on_file");
    if (contact.preferred_channel === "sms") flags.push("prefers_text");
    // Three or more system emails in a row with no open and no bounce: they are
    // not reading us, and more email is not the answer.
    const recent = es.slice(0, 3);
    if (recent.length >= 3 && recent.every((e) => !e.first_opened_at && !e.bounced_at && emailStatus(e) === "delivered")) {
      flags.push("unopened_streak");
    }

    return {
      ...contact,
      last_touch: lastTouch,
      last_human_touch_at: lastHuman?.occurred_at ?? null,
      human_touch_count: humanTouches.length,
      open_action: openAction,
      days_quiet: daysSince(lastHuman?.occurred_at ?? lastTouch?.occurred_at ?? null, now),
      flags,
      campaign_status: campaignStatus.get(p.id) ?? null,
    };
  });

  // Overdue first (soonest due), then due dates ascending, then no action sorted by
  // silence — the longest-quiet at the top, which is the point of the list.
  rows.sort((a, b) => {
    const ao = a.flags.includes("overdue") ? 0 : 1;
    const bo = b.flags.includes("overdue") ? 0 : 1;
    if (ao !== bo) return ao - bo;
    const ad = a.open_action?.due ?? null;
    const bd = b.open_action?.due ?? null;
    if (ad && bd && ad !== bd) return ad < bd ? -1 : 1;
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return (b.days_quiet ?? -1) - (a.days_quiet ?? -1);
  });

  return rows;
}

// ── One provider's timeline ───────────────────────────────────────────────────

export async function loadProviderTimeline(providerId: string): Promise<ProviderTimeline | null> {
  const db = getServiceClient();

  const { data: profile } = await db
    .from("business_profiles")
    .select("id, display_name, slug, city, state, email, phone, preferred_contact_channel, source_provider_id, metadata")
    .eq("id", providerId)
    .maybeSingle();
  if (!profile) return null;
  const p = profile as ProfileRow;

  const [{ data: touches }, emails, { data: requests }] = await Promise.all([
    db.from("provider_touches").select("*").eq("provider_id", providerId).order("occurred_at", { ascending: false }),
    fetchEmailsFor(db, [p], null),
    db.from("ad_campaign_requests").select("id").eq("provider_id", providerId),
  ]);

  const requestIds = ((requests ?? []) as { id: string }[]).map((r) => r.id);
  let campaignRows: CampaignLogRow[] = [];
  if (requestIds.length) {
    const { data } = await db
      .from("ad_campaign_log")
      .select("id, request_id, entry_type, summary, detail, occurred_at, author")
      .in("request_id", requestIds)
      .in("entry_type", ["setup", "outcome", "alert", "tweak"])
      .order("occurred_at", { ascending: false });
    campaignRows = (data ?? []) as CampaignLogRow[];
  }

  const ts = ((touches ?? []) as TouchRow[]).slice().sort(byNewest);
  const items: TimelineItem[] = [
    ...ts.map(touchToItem),
    ...emails.map(emailToItem),
    ...campaignRows.map(campaignToItem),
  ].sort(byNewest);

  const openAction = openActionOf(ts);
  const flags: RelationshipFlag[] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (openAction?.due && openAction.due < today) flags.push("overdue");
  if (!ts.some((t) => t.source !== "system")) flags.push("never_human");
  if (emails.some((e) => e.complained_at)) flags.push("complaint_on_file");
  if (p.preferred_contact_channel === "sms") flags.push("prefers_text");

  return { profile: toContact(p), open_action: openAction, flags, items };
}

// ── Markdown rendering (GET ...&format=md) ────────────────────────────────────

function fmt(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function timelineToMarkdown(t: ProviderTimeline): string {
  const p = t.profile;
  const lines: string[] = [];
  lines.push(`# ${p.display_name}${p.contact_name ? ` · ${p.contact_name}` : ""}`);
  const where = [p.city, p.state].filter(Boolean).join(", ");
  const handles = [p.email, p.claimer_email, p.phone].filter(Boolean).join(" · ");
  lines.push(`${where}${where && handles ? " · " : ""}${handles}`);
  if (t.flags.length) lines.push(`Flags: ${t.flags.join(", ")}`);
  lines.push("");
  if (t.open_action) {
    lines.push(`**Next action:** ${t.open_action.text}${t.open_action.due ? ` · due ${t.open_action.due}` : ""}${t.open_action.owner ? ` · ${t.open_action.owner}` : ""}`);
  } else {
    lines.push("**Next action:** none declared");
  }
  lines.push("");
  for (const it of t.items) {
    const who = it.actor === "out" ? "us" : it.actor === "in" ? "them" : "system";
    const head = `- ${fmt(it.occurred_at)} · ${who} · ${it.channel}${it.status ? ` · ${it.status}` : ""} · ${it.source} — ${it.title}`;
    lines.push(head);
    if (it.detail) lines.push(`  ${it.detail.replace(/\n+/g, " ")}`);
    if (it.next_action) {
      lines.push(`  → next: ${it.next_action.text}${it.next_action.due ? ` · due ${it.next_action.due}` : ""}${it.next_action.done_at ? ` · done ${fmt(it.next_action.done_at)}` : ""}`);
    }
  }
  return lines.join("\n");
}

export function relationshipsToMarkdown(rows: RelationshipRow[]): string {
  const lines: string[] = ["# Relationships", "", "| Provider | Last touch | Next action | Due | Flags |", "|---|---|---|---|---|"];
  for (const r of rows) {
    const lt = r.last_touch ? `${r.last_touch.actor === "system" ? "system" : r.last_touch.actor === "out" ? "us" : "them"} · ${r.last_touch.channel} · ${r.last_touch.occurred_at.slice(0, 10)} — ${r.last_touch.title}` : "—";
    lines.push(`| ${r.display_name}${r.contact_name ? ` (${r.contact_name})` : ""} | ${lt} | ${r.open_action?.text ?? "—"} | ${r.open_action?.due ?? "—"} | ${r.flags.join(", ")} |`);
  }
  return lines.join("\n");
}
