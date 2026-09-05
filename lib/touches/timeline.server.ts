import { getServiceClient } from "@/lib/admin";
import type {
  CampaignRef,
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
 *                              from five sources: provider_touches (people),
 *                              email_log (system sends, email and SMS),
 *                              ad_campaign_log (campaign events),
 *                              support_email_messages (anything through support@:
 *                              their replies, and copies of emails we Bcc'd),
 *                              sms_inbound (texts to the Olera number). Each row
 *                              says which.
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
  /** 'sms' for texts sent through lib/twilio.ts; null or 'email' otherwise. */
  channel: string | null;
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

function isSms(e: EmailRow): boolean {
  return e.channel === "sms";
}

function emailToItem(e: EmailRow): TimelineItem {
  const status = emailStatus(e);
  const sms = isSms(e);
  return {
    id: `email:${e.id}`,
    kind: "email",
    actor: "system",
    channel: sms ? "text" : "email",
    occurred_at: e.created_at,
    title: sms ? `Text · ${humanizeEmailType(e.email_type)}` : e.subject ? `${e.subject}` : humanizeEmailType(e.email_type),
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
    "id, provider_id, recipient, channel, email_type, subject, status, created_at, delivered_at, first_opened_at, bounced_at, complained_at, error_message";

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

// ── Support inbox (support@olera.care) ───────────────────────────────────────
//
// Since 5 Sep 2026 every provider notification replies to support@, and the
// habit for hand-written email is to Bcc support@. So the support mailbox holds
// both halves of every email conversation with a provider, already synced and
// matched by lib/support-email/sync.server.ts. We read it; we never write it.

type SupportMessageRow = {
  id: string;
  thread_id: string;
  direction: "in" | "out";
  from_email: string | null;
  from_name: string | null;
  to_emails: string[];
  cc_emails: string[];
  subject: string;
  snippet: string;
  internal_date: string;
  auto_submitted: string | null;
};

type SupportThreadRow = {
  id: string;
  subject: string;
  state: string;
  category: string;
  matched_profile_id: string | null;
  matched_provider_id: string | null;
  last_message_at: string;
};

type SupportRead = {
  /** Every message in every thread that involves one of the profiles, newest first. */
  messages: SupportMessageRow[];
  threads: Map<string, SupportThreadRow>;
  /** thread id → business_profiles.id */
  ownerOfThread: Map<string, string>;
};

/** Mailboxes we send from. A message from one of these is "us", whoever typed it. */
const OUR_DOMAINS = ["olera.care", "oleracare.com", "findmedjobs.co"];

function isOurAddress(addr: string | null | undefined): boolean {
  const domain = (addr ?? "").toLowerCase().split("@")[1];
  return !!domain && OUR_DOMAINS.includes(domain);
}

/** Gmail snippets arrive HTML-escaped ("I&#39;m", "&amp;"). Undo that before display. */
function decodeEntities(s: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return named[code.toLowerCase()] ?? m;
  });
}

function clip(s: string | null | undefined, n: number): string | null {
  const t = decodeEntities(s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

async function fetchSupportFor(
  db: ReturnType<typeof getServiceClient>,
  profiles: ProfileRow[],
  sinceIso: string | null,
): Promise<SupportRead> {
  const empty: SupportRead = { messages: [], threads: new Map(), ownerOfThread: new Map() };
  if (!profiles.length) return empty;

  const ids = profiles.map((p) => p.id);
  const keys = Array.from(new Set(profiles.flatMap(profileKeys)));
  const addrs = Array.from(new Set(profiles.flatMap(profileAddresses).map((a) => a.toLowerCase())));
  const byKey = new Map<string, string>();
  const byAddr = new Map<string, string>();
  for (const p of profiles) {
    for (const k of profileKeys(p)) byKey.set(k, p.id);
    for (const a of profileAddresses(p)) byAddr.set(a.toLowerCase(), p.id);
  }

  const threadSelect = "id, subject, state, category, matched_profile_id, matched_provider_id, last_message_at";
  const msgSelect = "id, thread_id, direction, from_email, from_name, to_emails, cc_emails, subject, snippet, internal_date, auto_submitted";

  // 1. Threads the sync already matched to one of these providers, and messages
  //    where one of their addresses is a participant (catches threads matched
  //    to nobody, or to a family, that still involve the provider).
  const threadQ = <Q extends { gte: (c: string, v: string) => Q }>(q: Q): Q => (sinceIso ? q.gte("last_message_at", sinceIso) : q);
  const msgQ = <Q extends { gte: (c: string, v: string) => Q }>(q: Q): Q => (sinceIso ? q.gte("internal_date", sinceIso) : q);
  const [byProfile, byProvider, fromUs, toThem, ccThem] = await Promise.all([
    threadQ(db.from("support_email_threads").select(threadSelect).in("matched_profile_id", ids)).limit(500),
    keys.length
      ? threadQ(db.from("support_email_threads").select(threadSelect).in("matched_provider_id", keys)).limit(500)
      : Promise.resolve({ data: [] as SupportThreadRow[] }),
    addrs.length
      ? msgQ(db.from("support_email_messages").select("thread_id, from_email, to_emails, cc_emails").in("from_email", addrs)).limit(2000)
      : Promise.resolve({ data: [] }),
    addrs.length
      ? msgQ(db.from("support_email_messages").select("thread_id, from_email, to_emails, cc_emails").overlaps("to_emails", addrs)).limit(2000)
      : Promise.resolve({ data: [] }),
    addrs.length
      ? msgQ(db.from("support_email_messages").select("thread_id, from_email, to_emails, cc_emails").overlaps("cc_emails", addrs)).limit(2000)
      : Promise.resolve({ data: [] }),
  ]);

  const threads = new Map<string, SupportThreadRow>();
  const ownerOfThread = new Map<string, string>();
  for (const t of [...((byProfile.data ?? []) as SupportThreadRow[]), ...((byProvider.data ?? []) as SupportThreadRow[])]) {
    threads.set(t.id, t);
    const owner =
      (t.matched_profile_id && ids.includes(t.matched_profile_id) ? t.matched_profile_id : null) ??
      (t.matched_provider_id ? byKey.get(t.matched_provider_id) ?? null : null);
    if (owner && !ownerOfThread.has(t.id)) ownerOfThread.set(t.id, owner);
  }
  type Participant = { thread_id: string; from_email: string | null; to_emails: string[]; cc_emails: string[] };
  for (const m of [...(fromUs.data ?? []), ...(toThem.data ?? []), ...(ccThem.data ?? [])] as Participant[]) {
    if (ownerOfThread.has(m.thread_id)) continue;
    const parts = [m.from_email, ...(m.to_emails ?? []), ...(m.cc_emails ?? [])].map((a) => (a ?? "").toLowerCase());
    const owner = parts.map((a) => byAddr.get(a)).find((o): o is string => !!o);
    if (owner) ownerOfThread.set(m.thread_id, owner);
  }
  const threadIds = Array.from(ownerOfThread.keys());
  if (!threadIds.length) return empty;

  // 2. Every message in those threads, plus thread rows we only found via participants.
  const missingThreadIds = threadIds.filter((id) => !threads.has(id));
  const [{ data: messages }, missing] = await Promise.all([
    db.from("support_email_messages").select(msgSelect).in("thread_id", threadIds).order("internal_date", { ascending: false }).limit(3000),
    missingThreadIds.length
      ? db.from("support_email_threads").select(threadSelect).in("id", missingThreadIds)
      : Promise.resolve({ data: [] as SupportThreadRow[] }),
  ]);
  for (const t of (missing.data ?? []) as SupportThreadRow[]) threads.set(t.id, t);

  return { messages: ((messages ?? []) as SupportMessageRow[]).filter((m) => !m.auto_submitted), threads, ownerOfThread };
}

/** Did they write it, or did we? By sender address, never by Gmail's direction alone. */
function supportActor(m: SupportMessageRow, ownerAddrs: Set<string>): "out" | "in" {
  const from = (m.from_email ?? "").toLowerCase();
  if (from && ownerAddrs.has(from)) return "in";
  if (m.direction === "out" || isOurAddress(from)) return "out";
  // A reply from an address we do not have on file, inside a thread about this
  // provider, is far more likely to be them than us.
  return "in";
}

function supportToItem(m: SupportMessageRow, thread: SupportThreadRow | undefined, ownerAddrs: Set<string>, latestInThread: boolean): TimelineItem {
  const actor = supportActor(m, ownerAddrs);
  const needsReply = latestInThread && actor === "in" && thread?.state === "needs_reply";
  const handle =
    actor === "in"
      ? m.from_email
      : [...(m.to_emails ?? []), ...(m.cc_emails ?? [])].find((a) => ownerAddrs.has((a ?? "").toLowerCase())) ?? m.to_emails?.[0] ?? null;
  return {
    id: `support:${m.id}`,
    kind: "support",
    actor,
    channel: "email",
    occurred_at: m.internal_date,
    title: m.subject?.trim() || thread?.subject || "(no subject)",
    detail: clip(m.snippet, 220),
    source: "gmail",
    status: needsReply ? "needs reply" : null,
    contact_handle: handle,
    href: "/admin/support-email",
    next_action: null,
  };
}

// ── Inbound texts (sms_inbound) ──────────────────────────────────────────────
//
// Every text to the Olera number lands in sms_inbound whether or not the sender
// resolved to an account. The webhook's provider match is against the directory
// and stores a name only, so we match by phone: the profile's own number, and any
// number a text touch was logged against (a provider's personal mobile lives
// there, not on the profile).

type SmsInboundRow = {
  id: number;
  from_phone: string;
  phone_last10: string;
  body: string;
  keyword: string | null;
  profile_id: string | null;
  created_at: string;
  handled_at: string | null;
};

function last10(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

async function fetchSmsFor(
  db: ReturnType<typeof getServiceClient>,
  profiles: ProfileRow[],
  touches: TouchRow[],
  sinceIso: string | null,
): Promise<{ rows: SmsInboundRow[]; ownerOf: (r: SmsInboundRow) => string | null }> {
  const ids = profiles.map((p) => p.id);
  const byPhone = new Map<string, string>();
  for (const p of profiles) {
    const k = last10(p.phone);
    if (k) byPhone.set(k, p.id);
  }
  for (const t of touches) {
    if (t.channel !== "text") continue;
    const k = last10(t.contact_handle);
    if (k && !byPhone.has(k)) byPhone.set(k, t.provider_id);
  }
  const phones = Array.from(byPhone.keys());
  const select = "id, from_phone, phone_last10, body, keyword, profile_id, created_at, handled_at";
  const since = <Q extends { gte: (c: string, v: string) => Q }>(q: Q): Q => (sinceIso ? q.gte("created_at", sinceIso) : q);
  const [byProfile, byNumber] = await Promise.all([
    ids.length ? since(db.from("sms_inbound").select(select).in("profile_id", ids)).limit(1000) : Promise.resolve({ data: [] }),
    phones.length ? since(db.from("sms_inbound").select(select).in("phone_last10", phones)).limit(1000) : Promise.resolve({ data: [] }),
  ]);
  const seen = new Set<number>();
  const rows: SmsInboundRow[] = [];
  for (const r of [...(byProfile.data ?? []), ...(byNumber.data ?? [])] as SmsInboundRow[]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    rows.push(r);
  }
  const ownerOf = (r: SmsInboundRow) =>
    (r.profile_id && ids.includes(r.profile_id) ? r.profile_id : null) ?? byPhone.get(r.phone_last10) ?? null;
  return { rows, ownerOf };
}

function smsToItem(r: SmsInboundRow): TimelineItem {
  return {
    id: `sms:${r.id}`,
    kind: "sms",
    actor: "in",
    channel: "text",
    occurred_at: r.created_at,
    title: clip(r.body, 160) ?? "(empty text)",
    detail: r.keyword ? `keyword ${r.keyword}` : null,
    source: "twilio",
    status: r.handled_at ? null : "needs reply",
    contact_handle: r.from_phone,
    href: "/admin/inbox",
    next_action: null,
  };
}

/** Group support messages per owning profile, marking which is the latest in its thread. */
function supportItemsByOwner(read: SupportRead, profiles: ProfileRow[]): Map<string, TimelineItem[]> {
  const addrsOf = new Map<string, Set<string>>();
  for (const p of profiles) addrsOf.set(p.id, new Set(profileAddresses(p).map((a) => a.toLowerCase())));
  const latestSeen = new Set<string>();
  const out = new Map<string, TimelineItem[]>();
  // messages arrive newest first, so the first one per thread is the latest
  for (const m of read.messages) {
    const owner = read.ownerOfThread.get(m.thread_id);
    if (!owner) continue;
    const latest = !latestSeen.has(m.thread_id);
    latestSeen.add(m.thread_id);
    const item = supportToItem(m, read.threads.get(m.thread_id), addrsOf.get(owner) ?? new Set(), latest);
    const arr = out.get(owner) ?? [];
    arr.push(item);
    out.set(owner, arr);
  }
  return out;
}

// ── Relationships list ────────────────────────────────────────────────────────

export async function loadRelationships(): Promise<RelationshipRow[]> {
  const db = getServiceClient();
  const now = new Date();

  const [{ data: requests }, { data: touchedIds }] = await Promise.all([
    db
      .from("ad_campaign_requests")
      .select("id, provider_id, status, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    db.from("provider_touches").select("provider_id"),
  ]);

  const campaignStatus = new Map<string, string>();
  const campaignRequestId = new Map<string, string>();
  for (const r of (requests ?? []) as { id: string; provider_id: string; status: string }[]) {
    // newest request wins (ordered desc above)
    if (!campaignStatus.has(r.provider_id)) {
      campaignStatus.set(r.provider_id, r.status);
      campaignRequestId.set(r.provider_id, r.id);
    }
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
  const allTouches = (touches ?? []) as TouchRow[];
  const since = new Date(now.getTime() - 120 * DAY_MS).toISOString();
  const [emails, support, sms] = await Promise.all([
    fetchEmailsFor(db, profileRows, since),
    fetchSupportFor(db, profileRows, since),
    fetchSmsFor(db, profileRows, allTouches, since),
  ]);
  const supportBy = supportItemsByOwner(support, profileRows);
  const smsBy = new Map<string, TimelineItem[]>();
  for (const r of sms.rows) {
    const owner = sms.ownerOf(r);
    if (!owner) continue;
    const arr = smsBy.get(owner) ?? [];
    arr.push(smsToItem(r));
    smsBy.set(owner, arr);
  }

  const byKey = new Map<string, string>();
  const byAddr = new Map<string, string>();
  for (const p of profileRows) {
    for (const k of profileKeys(p)) byKey.set(k, p.id);
    for (const a of profileAddresses(p)) byAddr.set(a.toLowerCase(), p.id);
  }

  const touchesBy = new Map<string, TouchRow[]>();
  for (const t of allTouches) {
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

    // A human touch is anything a person did on either side: a logged touch, an
    // email through support@ (their reply or our Bcc'd copy), a text they sent.
    const inbound: TimelineItem[] = [...(supportBy.get(p.id) ?? []), ...(smsBy.get(p.id) ?? [])].sort(byNewest);
    const humanTouches: { occurred_at: string }[] = [
      ...ts.filter((t) => t.source !== "system"),
      ...inbound,
    ].sort(byNewest);
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
    if (inbound[0]) {
      lastTouchCandidates.push({
        occurred_at: inbound[0].occurred_at,
        channel: inbound[0].channel,
        actor: inbound[0].actor,
        source: inbound[0].source,
        title: inbound[0].title,
        status: inbound[0].status ?? null,
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
    // They wrote to us and nobody has answered: a support thread still marked
    // needs_reply, or a text nobody has handled. Most urgent thing on the list.
    if (inbound.some((it) => it.status === "needs reply")) flags.push("awaiting_reply");
    if (humanTouches.length === 0) flags.push("never_human");
    if (es.some((e) => e.complained_at)) flags.push("complaint_on_file");
    if (contact.preferred_channel === "sms") flags.push("prefers_text");
    // Three or more system emails in a row with no open and no bounce: they are
    // not reading us, and more email is not the answer. Texts have no opens, so
    // they do not count either way.
    const recent = es.filter((e) => !isSms(e)).slice(0, 3);
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
      campaign_request_id: campaignRequestId.get(p.id) ?? null,
    };
  });

  // Unanswered replies and overdue actions first (soonest due), then due dates
  // ascending, then no action sorted by silence — the longest-quiet at the top,
  // which is the point of the list.
  const urgent = (r: RelationshipRow) => (r.flags.includes("awaiting_reply") || r.flags.includes("overdue") ? 0 : 1);
  rows.sort((a, b) => {
    const ao = urgent(a);
    const bo = urgent(b);
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

  const [{ data: touches }, emails, support, { data: requests }] = await Promise.all([
    db.from("provider_touches").select("*").eq("provider_id", providerId).order("occurred_at", { ascending: false }),
    fetchEmailsFor(db, [p], null),
    fetchSupportFor(db, [p], null),
    db
      .from("ad_campaign_requests")
      .select("id, status, campaign_tag, created_at")
      .eq("provider_id", providerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);
  const campaigns = ((requests ?? []) as CampaignRef[]).map((r) => ({
    id: r.id,
    status: r.status,
    campaign_tag: r.campaign_tag ?? null,
    created_at: r.created_at,
  }));
  const ts = ((touches ?? []) as TouchRow[]).slice().sort(byNewest);
  // Texts need the touches first: a personal mobile is only known from a logged text.
  const sms = await fetchSmsFor(db, [p], ts, null);
  const inbound: TimelineItem[] = [
    ...(supportItemsByOwner(support, [p]).get(p.id) ?? []),
    ...sms.rows.filter((r) => sms.ownerOf(r) === p.id).map(smsToItem),
  ];

  const requestIds = campaigns.map((r) => r.id);
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

  const items: TimelineItem[] = collapseRepeats(
    [...ts.map(touchToItem), ...emails.map(emailToItem), ...campaignRows.map(campaignToItem), ...inbound].sort(byNewest),
  );

  const openAction = openActionOf(ts);
  const flags: RelationshipFlag[] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (openAction?.due && openAction.due < today) flags.push("overdue");
  if (inbound.some((it) => it.status === "needs reply")) flags.push("awaiting_reply");
  if (!ts.some((t) => t.source !== "system") && inbound.length === 0) flags.push("never_human");
  if (emails.some((e) => e.complained_at)) flags.push("complaint_on_file");
  if (p.preferred_contact_channel === "sms") flags.push("prefers_text");

  return { profile: toContact(p), open_action: openAction, flags, campaigns, items };
}

/**
 * A retrying system email (the outcome ping fires twice a day against an address
 * that already complained) would bury a timeline under identical failed rows. Fold
 * consecutive system emails with the same title and status into one row that says
 * how many and over what span. Human touches are never folded.
 */
function collapseRepeats(items: TimelineItem[]): TimelineItem[] {
  const out: TimelineItem[] = [];
  let run: TimelineItem[] = [];
  const sameRun = (a: TimelineItem, b: TimelineItem) =>
    a.kind === "email" && b.kind === "email" && a.title === b.title && a.status === b.status && (a.status === "failed" || a.status === "bounced");
  const flush = () => {
    if (!run.length) return;
    if (run.length < 3) {
      out.push(...run);
    } else {
      const newest = run[0];
      const oldest = run[run.length - 1];
      out.push({
        ...newest,
        id: `${newest.id}:x${run.length}`,
        title: `${newest.title} · ×${run.length}`,
        detail: `${newest.detail ?? ""} · repeated ${run.length} times, ${oldest.occurred_at.slice(0, 10)} to ${newest.occurred_at.slice(0, 10)}`.replace(/^ · /, ""),
      });
    }
    run = [];
  };
  for (const it of items) {
    if (run.length && sameRun(run[0], it)) run.push(it);
    else {
      flush();
      run = [it];
    }
  }
  flush();
  return out;
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
