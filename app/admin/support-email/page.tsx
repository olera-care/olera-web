"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type View = "needs_reply" | "all" | "handled" | "noise" | "escalated" | "snoozed";

interface Mailbox {
  id: string;
  email: string;
  sync_status: string;
  watch_expiration: string | null;
  full_sync_complete: boolean;
  full_sync_messages_imported: number;
  last_sync_at: string | null;
  last_error: string | null;
}

interface Thread {
  id: string;
  gmail_thread_id: string;
  subject: string;
  snippet: string;
  participants: string[];
  last_message_at: string;
  message_count: number;
  unread: boolean;
  state: string;
  category: string;
  priority: string;
  matched_profile_id: string | null;
  matched_profile_type: string | null;
  matched_profile_name: string | null;
  matched_provider_id: string | null;
  agent_summary: string | null;
  agent_reason: string | null;
  agent_confidence: number | null;
  suggested_action: string | null;
  suggested_owner: string | null;
  suggested_draft: string | null;
  agent_risk_flags: string[];
  gmail_draft_id: string | null;
  draft_body: string | null;
  snoozed_until: string | null;
}

interface Message {
  id: string;
  gmail_message_id: string;
  direction: "in" | "out";
  from_email: string | null;
  from_name: string | null;
  to_emails: string[];
  subject: string;
  body_text: string;
  snippet: string;
  internal_date: string;
  has_attachments: boolean;
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
  list_unsubscribe: string[];
  list_unsubscribe_post: boolean;
}

interface Detail {
  thread: Thread & { mailbox: { email: string } };
  messages: Message[];
  actions: Array<{ action: string; actor: string; created_at: string }>;
  recommendations: Array<{ id: string; feedback: string | null }>;
}

const VIEWS: Array<{ key: View; label: string }> = [
  { key: "needs_reply", label: "Needs attention" },
  { key: "all", label: "All" },
  { key: "escalated", label: "Escalated" },
  { key: "snoozed", label: "Snoozed" },
  { key: "noise", label: "Noise" },
];

const ACTION_LABELS: Record<string, string> = {
  draft_reply: "Draft a reply",
  archive: "Archive",
  unsubscribe: "Unsubscribe",
  escalate: "Escalate internally",
  call_back: "Call back",
  provider_removal: "Start provider removal",
  do_not_contact: "Add to Do Not Contact",
  create_task: "Create internal task",
  no_action: "No action needed",
};

const CATEGORY_LABELS: Record<string, string> = {
  care_seeker: "Care seeker",
  provider: "Provider",
  partner: "Partner",
  marketing: "Marketing",
  automated: "Automated",
  legal: "Legal / removal",
  security: "Security",
  billing: "Billing",
  voicemail: "Voicemail",
  internal: "Internal",
  other: "Other",
};

function relative(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sender(thread: Thread): string {
  return thread.matched_profile_name || thread.participants?.find((p) => !p.endsWith("@olera.care")) || "Unknown sender";
}

function confidence(value: number | null): string | null {
  if (value == null) return null;
  return `${Math.round(value * 100)}% confidence`;
}

export default function SupportEmailPage() {
  const [view, setView] = useState<View>("needs_reply");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reply, setReply] = useState("");
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const selectedRef = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const oauthError = params.get("error");
    if (connected) setNotice(`${connected} is connected. Full mailbox history is importing newest first.`);
    if (oauthError) setError(oauthError);
    if (connected || oauthError) window.history.replaceState({}, "", "/admin/support-email");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const loadList = useCallback(async () => {
    const requestId = ++listRequestRef.current;
    try {
      setError(null);
      const params = new URLSearchParams({ view });
      if (query) params.set("q", query);
      const res = await fetch(`/api/admin/support-email?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load support email");
      if (requestId !== listRequestRef.current) return;
      setMailboxes(data.mailboxes ?? []);
      setThreads(data.threads ?? []);
    } catch (err) {
      if (requestId !== listRequestRef.current) return;
      setThreads([]);
      setError(err instanceof Error ? err.message : "Could not load support email");
    }
  }, [query, view]);

  useEffect(() => { void loadList(); }, [loadList]);

  const loadDetail = useCallback(async (id: string, adoptDraft = true) => {
    const requestId = ++detailRequestRef.current;
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/support-email/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load this thread");
      if (requestId !== detailRequestRef.current || selectedRef.current !== id) return;
      setDetail(data);
      if (adoptDraft) setReply(data.thread.draft_body || data.thread.suggested_draft || "");
    } catch (err) {
      if (requestId !== detailRequestRef.current || selectedRef.current !== id) return;
      setDetail(null);
      setError(err instanceof Error ? err.message : "Could not load this thread");
    } finally {
      if (requestId === detailRequestRef.current) setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selected) void loadDetail(selected);
    else {
      detailRequestRef.current += 1;
      setDetail(null);
      setLoadingDetail(false);
    }
  }, [selected, loadDetail]);

  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (!selected) return;
    const targetId = selected;
    setActing(action);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/support-email/${targetId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed");
      const messages: Record<string, string> = {
        save_draft: "Draft saved in Gmail.", send: "Reply sent from Olera Support.", archive: "Thread archived.",
        mark_noise: "Moved out of the active inbox.", unsubscribe: "Unsubscribed and archived.",
        escalate: "Escalated for internal review.", mark_handled: "Marked handled.",
        do_not_contact: "Sender added to Do Not Contact.", feedback: "Agent feedback saved.",
      };
      setNotice(data.warning || messages[action] || "Done.");
      if (action === "send" && selectedRef.current === targetId) setReply("");
      await loadList();
      if (selectedRef.current === targetId) {
        await loadDetail(targetId, action !== "save_draft" && action !== "send");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/support-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_now", mailboxId: mailboxes[0]?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setNotice("Gmail caught up and the next full-history page was imported.");
      await loadList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  function selectThread(id: string) {
    selectedRef.current = id;
    detailRequestRef.current += 1;
    setDetail(null);
    setReply("");
    setSelected(id);
  }

  const latestInbound = useMemo(
    () => detail ? [...detail.messages].reverse().find((m) => m.direction === "in") ?? null : null,
    [detail],
  );
  const mailbox = mailboxes[0] ?? null;

  return (
    <div className="space-y-5 pb-20 md:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-gray-900">Support Email</h1>
            {mailbox && (
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${mailbox.sync_status === "error" ? "bg-rose-50 text-rose-700" : mailbox.full_sync_complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {mailbox.sync_status === "error" ? "Needs attention" : mailbox.full_sync_complete ? "Live" : "Importing history"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Olera&apos;s support copilot separates signal from noise and recommends the next move.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {mailbox ? (
            <button onClick={() => void syncNow()} disabled={syncing} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          ) : (
            <Link prefetch={false} href="/api/admin/support-email/connect" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
              Connect Gmail
            </Link>
          )}
        </div>
      </div>

      {mailbox && !mailbox.full_sync_complete && (
        <div className="flex flex-col gap-1 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <span><strong>{mailbox.full_sync_messages_imported.toLocaleString()}</strong> messages imported. The worker continues backwards until Gmail has no history left.</span>
          <span className="text-xs text-amber-700">New mail is synchronized first.</span>
        </div>
      )}
      {mailbox?.last_error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{mailbox.last_error}</div>}
      {notice && <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>}
      {error && <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {!mailbox && !error ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-xl text-teal-700">✦</div>
          <h2 className="text-lg font-semibold text-gray-900">Connect the Olera support mailbox</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">The first sync starts with today, then keeps walking backwards until the complete Gmail history is available here.</p>
          <Link prefetch={false} href="/api/admin/support-email/connect" className="mt-5 inline-flex rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800">Connect Gmail</Link>
        </div>
      ) : mailbox && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="grid min-h-[680px] lg:grid-cols-[330px_minmax(0,1fr)]">
            <section className="border-b border-gray-200 lg:border-b-0 lg:border-r">
              <div className="border-b border-gray-100 p-3">
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {VIEWS.map((item) => (
                    <button key={item.key} onClick={() => setView(item.key)} className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium ${view === item.key ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-800"}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject, sender, message…" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
              </div>
              <div className="max-h-[640px] overflow-y-auto">
                {threads == null ? (
                  <p className="px-4 py-10 text-center text-sm text-gray-400">Loading inbox…</p>
                ) : threads.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm font-medium text-gray-700">Nothing here</p>
                    <p className="mt-1 text-xs text-gray-400">This view is caught up.</p>
                  </div>
                ) : threads.map((thread) => (
                  <button key={thread.id} onClick={() => selectThread(thread.id)} className={`block w-full border-b border-gray-100 px-4 py-3.5 text-left transition-colors ${selected === thread.id ? "bg-teal-50/60" : "hover:bg-gray-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className={`truncate text-sm ${thread.unread || thread.state === "needs_reply" ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}>{sender(thread)}</p>
                      <span className="shrink-0 text-[11px] text-gray-400">{relative(thread.last_message_at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-gray-700">{thread.subject}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{thread.agent_summary || thread.snippet}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${thread.category === "marketing" || thread.category === "automated" ? "bg-gray-100 text-gray-500" : thread.priority === "urgent" ? "bg-rose-100 text-rose-700" : thread.priority === "high" ? "bg-amber-100 text-amber-700" : "bg-teal-50 text-teal-700"}`}>
                        {CATEGORY_LABELS[thread.category] || thread.category}
                      </span>
                      {thread.gmail_draft_id && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">DRAFT</span>}
                      {thread.state === "escalated" && <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">ESCALATED</span>}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="min-w-0">
              {!selected ? (
                <div className="flex min-h-[680px] items-center justify-center px-8 text-center">
                  <div><p className="text-sm font-medium text-gray-700">Select a conversation</p><p className="mt-1 text-sm text-gray-400">Read the thread, review the agent&apos;s reasoning, and take the next action.</p></div>
                </div>
              ) : loadingDetail && !detail ? (
                <div className="flex min-h-[680px] items-center justify-center text-sm text-gray-400">Loading conversation…</div>
              ) : detail && (
                <div className="flex min-h-[680px] flex-col">
                  <header className="border-b border-gray-100 px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-gray-900">{detail.thread.subject}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{sender(detail.thread)}</span><span>•</span><span>{detail.messages.length} message{detail.messages.length === 1 ? "" : "s"}</span>
                          {detail.thread.matched_profile_name && (
                            <>
                              <span>•</span>
                              {detail.thread.matched_profile_type === "family" && detail.thread.matched_profile_id ? (
                                <Link href={`/admin/care-seekers/${detail.thread.matched_profile_id}`} className="font-medium text-teal-700 hover:underline">Open care-seeker record</Link>
                              ) : detail.thread.matched_provider_id ? (
                                <Link href={`/admin/directory/${detail.thread.matched_provider_id}`} className="font-medium text-teal-700 hover:underline">Open provider record</Link>
                              ) : <span>{detail.thread.matched_profile_name}</span>}
                            </>
                          )}
                        </div>
                      </div>
                      <button onClick={() => void act("mark_handled")} disabled={!!acting} className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Mark handled</button>
                    </div>
                  </header>

                  {detail.thread.agent_summary && (
                    <div className="m-5 mb-0 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">Olera Support Copilot</p>
                          <p className="mt-1.5 text-sm font-medium leading-6 text-gray-900">{detail.thread.agent_summary}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-gray-500 ring-1 ring-gray-100">{confidence(detail.thread.agent_confidence)}</span>
                          <button onClick={() => void act("feedback", { feedback: "correct" })} disabled={!!acting} title="Good recommendation" className="rounded-md bg-white px-2 py-1 text-xs text-gray-500 ring-1 ring-gray-100 hover:text-emerald-700">👍</button>
                          <button onClick={() => void act("feedback", { feedback: "incorrect" })} disabled={!!acting} title="Wrong recommendation" className="rounded-md bg-white px-2 py-1 text-xs text-gray-500 ring-1 ring-gray-100 hover:text-rose-700">👎</button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Recommended next action</p><p className="mt-1 text-sm font-semibold text-teal-800">{ACTION_LABELS[detail.thread.suggested_action || ""] || "Review manually"}</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Why</p><p className="mt-1 text-xs leading-5 text-gray-600">{detail.thread.agent_reason}</p></div>
                      </div>
                      {detail.thread.agent_risk_flags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{detail.thread.agent_risk_flags.map((flag) => <span key={flag} className="rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">{flag.replaceAll("_", " ")}</span>)}</div>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {detail.thread.suggested_action === "unsubscribe" && latestInbound?.list_unsubscribe_post && <button onClick={() => void act("unsubscribe")} disabled={!!acting} className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50">Unsubscribe and archive</button>}
                        {detail.thread.suggested_action === "provider_removal" && <button onClick={() => void act("do_not_contact")} disabled={!!acting} className="rounded-lg bg-rose-700 px-3 py-2 text-xs font-medium text-white hover:bg-rose-800 disabled:opacity-50">Add to Do Not Contact</button>}
                        <button onClick={() => void act("escalate")} disabled={!!acting} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Escalate</button>
                        <button onClick={() => void act("mark_noise")} disabled={!!acting} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Mark noise</button>
                      </div>
                    </div>
                  )}

                  <div className="max-h-[440px] flex-1 space-y-4 overflow-y-auto px-5 py-5">
                    {detail.messages.map((message) => (
                      <article key={message.id} className={`rounded-xl border p-4 ${message.direction === "out" ? "ml-6 border-teal-100 bg-teal-50/40" : "mr-6 border-gray-200 bg-white"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div><p className="text-sm font-semibold text-gray-800">{message.direction === "out" ? "Olera Support" : message.from_name || message.from_email || "Unknown sender"}</p><p className="mt-0.5 text-[11px] text-gray-400">{message.direction === "out" ? `To ${message.to_emails.join(", ")}` : message.from_email}</p></div>
                          <time className="shrink-0 text-[11px] text-gray-400">{formatDate(message.internal_date)}</time>
                        </div>
                        <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">{message.body_text || message.snippet || "(No text body)"}</div>
                        {message.has_attachments && <div className="mt-3 flex flex-wrap gap-2">{message.attachments.map((attachment, i) => <span key={`${attachment.filename}-${i}`} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-500">📎 {attachment.filename}</span>)}</div>}
                      </article>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                    <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={6} maxLength={20_000} placeholder="Write a reply, or edit the copilot draft…" className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100" />
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        {detail.thread.gmail_draft_id ? <span>Saved in Gmail</span> : detail.thread.suggested_draft ? <span>Agent draft -- review before sending</span> : <span>Nothing sends without your click</span>}
                        <span>•</span><span>{reply.length.toLocaleString()} characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => void act("archive")} disabled={!!acting} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Archive</button>
                        <button onClick={() => void act("save_draft", { body: reply })} disabled={!!acting || !reply.trim()} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Save draft</button>
                        <button onClick={() => void act("send", { body: reply })} disabled={!!acting || !reply.trim()} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50">{acting === "send" ? "Sending…" : "Send reply"}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
