import { createHash, createHmac, timingSafeEqual } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WarRoomIntegrationStatus, WarRoomProposalEvidence } from "@/lib/war-room/types";

type SourceItemInput = {
  source: "slack" | "notion";
  external_id: string;
  source_group: string;
  source_kind: string;
  title: string;
  content: string;
  source_url: string | null;
  occurred_at: string;
  last_edited_at: string | null;
  freshness: "current" | "aging" | "stale";
  trust: "context" | "corroborated";
  metadata: Record<string, unknown>;
};

type SlackChannelConfig = { id: string; label: string };
type NotionSourceConfig = { id: string; kind: string; label: string };

const NOTION_VERSION = "2026-03-11";
const MAX_SOURCE_CONTENT = 6_000;

function bounded(value: string, max = MAX_SOURCE_CONTENT) {
  const clean = value.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function contentHash(item: SourceItemInput) {
  return createHash("sha256")
    .update(`${item.title}\n${item.content}\n${item.last_edited_at ?? item.occurred_at}`)
    .digest("hex");
}

function freshness(value: string | null): SourceItemInput["freshness"] {
  if (!value) return "stale";
  const age = Date.now() - new Date(value).getTime();
  if (age <= 21 * 86_400_000) return "current";
  if (age <= 60 * 86_400_000) return "aging";
  return "stale";
}

function slackChannels(): SlackChannelConfig[] {
  return (process.env.WAR_ROOM_SLACK_CHANNELS ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, label] = entry.split("|").map((part) => part.trim());
      return { id, label: label || id };
    })
    .filter((entry) => /^[CG][A-Z0-9]+$/.test(entry.id));
}

function notionSources(): NotionSourceConfig[] {
  return (process.env.WAR_ROOM_NOTION_DATA_SOURCES ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, kind, label] = entry.split("|").map((part) => part.trim());
      return { id, kind: kind || "meeting_notes", label: label || kind || id };
    })
    .filter((entry) => /^[a-f0-9-]{32,36}$/i.test(entry.id));
}

async function upsertSourceItems(db: SupabaseClient, items: SourceItemInput[]) {
  if (!items.length) return 0;
  const now = new Date().toISOString();
  const rows = items.map((item) => ({
    ...item,
    title: bounded(item.title, 300),
    content: bounded(item.content),
    content_hash: contentHash(item),
    ingested_at: now,
    updated_at: now,
  }));
  const { error } = await db.from("war_room_source_items")
    .upsert(rows, { onConflict: "source,external_id" });
  if (error) throw error;
  return rows.length;
}

async function writeSourceState(
  db: SupabaseClient,
  sourceKey: string,
  values: { cursor?: string | null; error?: string | null; success?: boolean; metadata?: Record<string, unknown> },
) {
  const now = new Date().toISOString();
  await db.from("war_room_source_state").upsert({
    source_key: sourceKey,
    ...(values.cursor !== undefined ? { cursor: values.cursor } : {}),
    last_synced_at: now,
    ...(values.success ? { last_success_at: now } : {}),
    last_error: values.error ?? null,
    metadata: values.metadata ?? {},
    updated_at: now,
  }, { onConflict: "source_key" });
}

function slackMessageUrl(channel: string, ts: string) {
  const workspace = (process.env.WAR_ROOM_SLACK_WORKSPACE_URL ?? "").replace(/\/$/, "");
  return workspace ? `${workspace}/archives/${channel}/p${ts.replace(".", "")}` : null;
}

type SlackMessage = {
  ts?: string;
  thread_ts?: string;
  text?: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  reply_count?: number;
  reactions?: Array<{ name?: string; count?: number }>;
};

export async function syncSlackHistoryEvidence(db: SupabaseClient) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channels = slackChannels();
  if (!token || !channels.length) {
    return { configured: false, imported: 0, detail: "Slack reader is not configured" };
  }

  const { data: state } = await db.from("war_room_source_state")
    .select("metadata")
    .eq("source_key", "slack_history")
    .maybeSingle();
  const previousIndex = Number((state?.metadata as { channel_index?: number } | null)?.channel_index ?? -1);
  const channelIndex = (previousIndex + 1) % channels.length;
  const channel = channels[channelIndex];
  const oldest = String(Math.floor((Date.now() - 90 * 86_400_000) / 1_000));

  try {
    // Slack's custom-app history limit is intentionally respected here: one
    // allowlisted channel, one bounded page, per discovery run. Fresh messages
    // arrive through the Events API endpoint instead of repeated polling.
    const response = await fetch("https://slack.com/api/conversations.history", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ channel: channel.id, oldest, limit: 15 }),
      signal: AbortSignal.timeout(20_000),
    });
    const payload = await response.json() as { ok?: boolean; error?: string; messages?: SlackMessage[] };
    if (!response.ok || !payload.ok) throw new Error(payload.error || `Slack HTTP ${response.status}`);
    const items = (payload.messages ?? [])
      .filter((message) => message.ts && message.text?.trim() && !message.bot_id && !message.subtype)
      .map((message): SourceItemInput => {
        const occurredAt = new Date(Number(message.ts) * 1_000).toISOString();
        return {
          source: "slack",
          external_id: `${channel.id}:${message.ts}`,
          source_group: channel.label,
          source_kind: message.thread_ts ? "thread_reply" : "channel_message",
          title: `#${channel.label} conversation`,
          content: message.text || "",
          source_url: slackMessageUrl(channel.id, message.ts || ""),
          occurred_at: occurredAt,
          last_edited_at: null,
          freshness: freshness(occurredAt),
          trust: "context",
          metadata: {
            channel_id: channel.id,
            user_id: message.user ?? null,
            thread_ts: message.thread_ts ?? null,
            reply_count: message.reply_count ?? 0,
            reactions: message.reactions ?? [],
          },
        };
      });
    const imported = await upsertSourceItems(db, items);
    await writeSourceState(db, "slack_history", {
      success: true,
      metadata: { channel_index: channelIndex, channel_id: channel.id, channel_label: channel.label },
    });
    return { configured: true, imported, detail: `Backfilled #${channel.label}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await writeSourceState(db, "slack_history", {
      error: message,
      metadata: { channel_index: channelIndex, channel_id: channel.id, channel_label: channel.label },
    });
    return { configured: true, imported: 0, detail: `Slack backfill failed: ${message}` };
  }
}

export function verifySlackRequest(signature: string | null, timestamp: string | null, body: string) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret || !signature || !timestamp) return false;
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Math.floor(Date.now() / 1_000) - timestampNumber) > 300) return false;
  const expected = `v0=${createHmac("sha256", secret).update(`v0:${timestamp}:${body}`, "utf8").digest("hex")}`;
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function ingestSlackEventEvidence(
  db: SupabaseClient,
  event: SlackMessage & { channel?: string; type?: string; channel_type?: string },
) {
  const channel = slackChannels().find((candidate) => candidate.id === event.channel);
  if (!channel || event.type !== "message" || !event.ts || !event.text?.trim() || event.bot_id || event.subtype) {
    return { accepted: false };
  }
  const occurredAt = new Date(Number(event.ts) * 1_000).toISOString();
  const imported = await upsertSourceItems(db, [{
    source: "slack",
    external_id: `${channel.id}:${event.ts}`,
    source_group: channel.label,
    source_kind: event.thread_ts ? "thread_reply" : "channel_message",
    title: `#${channel.label} conversation`,
    content: event.text,
    source_url: slackMessageUrl(channel.id, event.ts),
    occurred_at: occurredAt,
    last_edited_at: null,
    freshness: "current",
    trust: "context",
    metadata: {
      channel_id: channel.id,
      channel_type: event.channel_type ?? null,
      user_id: event.user ?? null,
      thread_ts: event.thread_ts ?? null,
    },
  }]);
  await writeSourceState(db, "slack_events", { success: true, metadata: { channel_id: channel.id } });
  return { accepted: imported > 0 };
}

function richText(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value.map((part) => {
    if (!part || typeof part !== "object") return "";
    const item = part as { plain_text?: string; text?: { content?: string } };
    return item.plain_text ?? item.text?.content ?? "";
  }).join("");
}

function notionPropertyText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const property = value as Record<string, unknown>;
  const type = String(property.type || "");
  if (type === "title" || type === "rich_text") return richText(property[type]);
  if (type === "select" || type === "status") return String((property[type] as { name?: string } | null)?.name ?? "");
  if (type === "multi_select") return ((property.multi_select as Array<{ name?: string }> | undefined) ?? []).map((item) => item.name).filter(Boolean).join(", ");
  if (type === "date") {
    const date = property.date as { start?: string; end?: string } | null;
    return date?.start ? `${date.start}${date.end ? ` → ${date.end}` : ""}` : "";
  }
  if (type === "people") return ((property.people as Array<{ name?: string; person?: { email?: string } }> | undefined) ?? []).map((person) => person.name || person.person?.email).filter(Boolean).join(", ");
  if (type === "checkbox") return property.checkbox ? "Yes" : "No";
  if (type === "number") return property.number == null ? "" : String(property.number);
  if (type === "url" || type === "email" || type === "phone_number") return String(property[type] ?? "");
  if (type === "formula") return notionPropertyText(property.formula);
  return "";
}

function notionPageTitle(properties: Record<string, unknown>) {
  for (const value of Object.values(properties)) {
    const property = value as { type?: string } | null;
    if (property?.type === "title") return notionPropertyText(value) || "Untitled Notion page";
  }
  return "Untitled Notion page";
}

function notionBlockText(block: Record<string, unknown>): string {
  const type = String(block.type || "");
  const payload = block[type] as { rich_text?: unknown; caption?: unknown } | undefined;
  const text = richText(payload?.rich_text) || richText(payload?.caption);
  return text ? `${type.replaceAll("_", " ")}: ${text}` : "";
}

async function notionFetch(path: string, init?: RequestInit, timeoutMs = 20_000) {
  const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  if (!token) throw new Error("Notion token is not configured");
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(Math.max(1, Math.min(20_000, timeoutMs))),
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = (payload as { message?: string }).message || `Notion HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload as Record<string, unknown>;
}

async function notionPageBody(pageId: string, timeoutMs?: number) {
  const payload = await notionFetch(`/blocks/${pageId}/children?page_size=100`, undefined, timeoutMs);
  const blocks = (payload.results as Array<Record<string, unknown>> | undefined) ?? [];
  return bounded(blocks.map(notionBlockText).filter(Boolean).join("\n"), 5_000);
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function syncNotionEvidence(db: SupabaseClient) {
  const sources = notionSources();
  const token = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  if (!token || !sources.length) {
    return { configured: false, imported: 0, detail: "Notion reader is not configured" };
  }
  let imported = 0;
  const errors: string[] = [];
  // Discovery has two sequential model calls under a 300-second route ceiling.
  // Give Notion a shared budget rather than allowing N configured sources and
  // their page bodies to multiply 20-second timeouts without bound.
  const deadline = Date.now() + 40_000;
  for (const source of sources) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      errors.push("Source refresh stopped at its 40-second budget");
      break;
    }
    try {
      const payload = await notionFetch(`/data_sources/${source.id}/query`, {
        method: "POST",
        body: JSON.stringify({
          page_size: 8,
          result_type: "page",
          sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
        }),
      }, remaining);
      const pages = ((payload.results as Array<Record<string, unknown>> | undefined) ?? [])
        .filter((page) => page.object === "page");
      const items = await mapWithConcurrency(pages, 2, async (page): Promise<SourceItemInput> => {
        const id = String(page.id);
        const properties = (page.properties as Record<string, unknown> | undefined) ?? {};
        const propertyLines = Object.entries(properties)
          .map(([name, value]) => [name, notionPropertyText(value)] as const)
          .filter(([, value]) => Boolean(value))
          .map(([name, value]) => `${name}: ${value}`);
        const body = await notionPageBody(id, deadline - Date.now());
        const lastEditedAt = String(page.last_edited_time || page.created_time || new Date().toISOString());
        return {
          source: "notion",
          external_id: id,
          source_group: source.label,
          source_kind: source.kind,
          title: notionPageTitle(properties),
          content: [...propertyLines, body].filter(Boolean).join("\n"),
          source_url: typeof page.url === "string" ? page.url : null,
          occurred_at: String(page.created_time || lastEditedAt),
          last_edited_at: lastEditedAt,
          freshness: freshness(lastEditedAt),
          trust: "context",
          metadata: {
            data_source_id: source.id,
            archived: Boolean(page.archived),
            in_trash: Boolean(page.in_trash),
            properties: Object.fromEntries(propertyLines.map((line) => {
              const split = line.indexOf(":");
              return [line.slice(0, split), line.slice(split + 1).trim()];
            })),
          },
        };
      });
      imported += await upsertSourceItems(db, items);
      await writeSourceState(db, `notion:${source.id}`, {
        success: true,
        metadata: { label: source.label, kind: source.kind, pages: items.length },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${source.label}: ${message}`);
      await writeSourceState(db, `notion:${source.id}`, {
        error: message,
        metadata: { label: source.label, kind: source.kind },
      });
    }
  }
  return {
    configured: true,
    imported,
    detail: errors.length ? `Notion partially failed: ${errors.join("; ")}` : `${sources.length} curated data source${sources.length === 1 ? "" : "s"}`,
  };
}

type StoredSourceItem = {
  id: string;
  source: "slack" | "notion";
  source_group: string;
  source_kind: string;
  title: string;
  content: string;
  source_url: string | null;
  occurred_at: string;
  last_edited_at: string | null;
  freshness: "current" | "aging" | "stale";
};

export async function loadExternalEvidence(db: SupabaseClient): Promise<WarRoomProposalEvidence[]> {
  const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { data, error } = await db.from("war_room_source_items")
    .select("id, source, source_group, source_kind, title, content, source_url, occurred_at, last_edited_at, freshness")
    .or(`occurred_at.gte.${since},last_edited_at.gte.${since}`)
    .order("occurred_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return ((data ?? []) as StoredSourceItem[]).map((item) => ({
    id: `external:${item.id}`,
    label: `${item.source === "slack" ? "Slack" : "Notion"} · ${item.title}`,
    detail: bounded(item.content, 900),
    source: `${item.source}:${item.source_group}:${item.source_kind}`,
    ...(item.source_url ? { href: item.source_url } : {}),
    occurredAt: item.last_edited_at ?? item.occurred_at,
    // Freshness is a property of "now", not of the last ingestion. Slack
    // events are normally written once, so trusting the stored label would
    // let a message remain "current" for up to 90 days.
    freshness: freshness(item.last_edited_at ?? item.occurred_at),
  }));
}

export async function integrationStatuses(db: SupabaseClient): Promise<WarRoomIntegrationStatus[]> {
  const [{ data: states }, { data: latestItems }] = await Promise.all([
    db.from("war_room_source_state").select("source_key, last_success_at, last_error, metadata"),
    db.from("war_room_source_items").select("source, ingested_at").order("ingested_at", { ascending: false }).limit(50),
  ]);
  const stateRows = (states ?? []) as Array<{ source_key: string; last_success_at: string | null; last_error: string | null }>;
  const itemRows = (latestItems ?? []) as Array<{ source: "slack" | "notion"; ingested_at: string }>;
  const latestFor = (source: "slack" | "notion") => itemRows.find((item) => item.source === source)?.ingested_at ?? null;
  const stateFor = (prefix: string) => stateRows.filter((row) => row.source_key.startsWith(prefix)).sort((a, b) => (b.last_success_at || "").localeCompare(a.last_success_at || ""))[0];
  const statusFor = (configured: boolean, updatedAt: string | null): "live" | "stale" | "missing" => {
    if (!configured) return "missing";
    if (!updatedAt || Date.now() - new Date(updatedAt).getTime() > 3 * 86_400_000) return "stale";
    return "live";
  };
  const slackConfigured = Boolean(process.env.SLACK_BOT_TOKEN && slackChannels().length && process.env.SLACK_SIGNING_SECRET);
  const notionConfigured = Boolean((process.env.NOTION_API_KEY || process.env.NOTION_TOKEN) && notionSources().length);
  const slackUpdated = latestFor("slack") || stateFor("slack")?.last_success_at || null;
  const notionUpdated = latestFor("notion") || stateFor("notion:")?.last_success_at || null;
  const executorConfigured = Boolean(process.env.WAR_ROOM_GITHUB_TOKEN && process.env.WAR_ROOM_GITHUB_REPOSITORY);
  return [
    {
      key: "slack",
      label: "Slack conversations",
      status: statusFor(slackConfigured, slackUpdated),
      detail: slackConfigured ? `${slackChannels().length} allowlisted channel${slackChannels().length === 1 ? "" : "s"}; events + rotating history` : "Add a read-only bot and explicit channel allowlist",
      updatedAt: slackUpdated,
    },
    {
      key: "notion",
      label: "Notion meeting context",
      status: statusFor(notionConfigured, notionUpdated),
      detail: notionConfigured ? `${notionSources().length} allowlisted data source${notionSources().length === 1 ? "" : "s"}; stale rows remain context only` : "Share Meeting Notes and Action Items with a read-only connection",
      updatedAt: notionUpdated,
    },
    {
      key: "executor",
      label: "Repository executor",
      status: executorConfigured ? "live" : "missing",
      detail: executorConfigured ? "Approved code work can dispatch to an isolated GitHub runner" : "Approval is recorded, but no GitHub dispatch token is configured",
      updatedAt: null,
    },
  ];
}
