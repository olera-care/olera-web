"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminWorkspace from "@/components/admin/AdminWorkspace";
import AnswerPacketPanel from "@/components/admin/AnswerPacketPanel";
import type { AnswerPacket } from "@/lib/family-answers/types";

/**
 * SMS inbox — every inbound text, and the ability to answer it.
 *
 * Two panes: threads on the left, conversation + reply box on the right.
 * The thread body comes from Twilio (complete, both directions); our own
 * sms_inbound rows supply identity and the handled/unhandled state.
 *
 * Replies autosave as drafts (sms_drafts, one row per thread). The reply box
 * used to be pure component state, wiped on every thread switch and lost on
 * reload, so a reply you wanted to check a fact for first had nowhere to sit.
 * Drafts live server-side rather than in localStorage so one can be written on
 * a laptop and finished on a phone, and nothing here is ever sent on its own —
 * a draft is text waiting for a human to press Send.
 */

/** Idle time before an edit is persisted. Long enough not to write per keystroke. */
const DRAFT_SAVE_DELAY_MS = 1200;

interface Thread {
  phone_last10: string;
  from_phone: string;
  display_name: string | null;
  profile_type: string | null;
  profile_id: string | null;
  last_body: string;
  last_keyword: string | null;
  last_at: string;
  unhandled: number;
  total: number;
  suppressed: boolean;
  has_draft: boolean;
}

interface ThreadMessage {
  sid: string;
  direction: "in" | "out";
  body: string;
  at: string | null;
  status: string;
  errorCode: number | null;
}

interface ThreadDetail {
  phone_last10: string;
  e164: string;
  display_name: string | null;
  profile_type: string | null;
  profile_id: string | null;
  suppressed: boolean;
  suppression: { reason: string; note: string | null } | null;
  unhandled: number;
  messages: ThreadMessage[];
  inbound: { id: number; body: string; created_at: string; handled_at: string | null }[];
  twilioError: string | null;
  draft: { body: string; updated_by: string | null; updated_at: string } | null;
  /** The most recent researched answer waiting on a human, if the engine has produced one. */
  answerPacket: { jobId: string; packet: AnswerPacket } | null;
}

/** What the draft indicator is currently saying. */
type DraftState =
  | { kind: "none" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: string; by: string | null }
  | { kind: "error"; message: string };

function formatPhone(last10: string): string {
  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

/** Admin surfaces anchor to US Eastern — TJ reads these from other time zones. */
function formatEt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/**
 * Autosave indicator. Quiet by design — a draft saving is the expected case,
 * so only a failure earns colour. A silent "saved" would be worse than none:
 * the whole point is knowing the text is safe to walk away from.
 */
function DraftStatus({ state }: { state: DraftState }) {
  if (state.kind === "none") return null;
  if (state.kind === "error") {
    return (
      <span className="text-[11px] text-red-600" title={state.message}>
        Draft not saved
      </span>
    );
  }
  if (state.kind === "dirty") return <span className="text-[11px] text-gray-400">Unsaved…</span>;
  if (state.kind === "saving") return <span className="text-[11px] text-gray-400">Saving…</span>;
  return (
    <span className="text-[11px] text-gray-500" title={state.by ? `Last saved by ${state.by}` : undefined}>
      Draft saved {formatEt(state.at)}
    </span>
  );
}

export default function AdminSmsInboxPage() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [unhandledOnly, setUnhandledOnly] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<DraftState>({ kind: "none" });

  // The reply text last known to be on the server for the OPEN thread. Edits are
  // measured against this, so adopting a loaded draft into the box doesn't
  // immediately look like a change and save it straight back.
  const draftBaselineRef = useRef("");
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Which thread's draft has actually been loaded. Autosave stays off until this
  // matches the open thread: without it, the empty box during a thread switch
  // would be saved against the newly-selected number and wipe its draft.
  const draftLoadedForRef = useRef<string | null>(null);
  // Bumped whenever the draft context changes under a request that is already in
  // flight (thread switch, discard, send). A save that resolves against a stale
  // epoch must not write its result back into the box — otherwise the reply you
  // were typing for one number can end up labelled as another's saved draft.
  const draftEpochRef = useRef(0);
  // Only the newest detail request may populate the conversation. Twilio can
  // answer two rapid thread loads out of order, and an older response must not
  // replace the thread the admin is now viewing.
  const detailRequestRef = useRef(0);
  // The save currently in flight, so a discard can land AFTER it. Without this a
  // delete can be overtaken by an upsert that was already on the wire, leaving a
  // draft row behind that the UI has already forgotten about.
  const inFlightSaveRef = useRef<Promise<void> | null>(null);
  // What is in the box right now. A save that started before the last few
  // keystrokes must not report "Draft saved" over text that has since moved on —
  // an indicator that lies about safety is worse than no indicator.
  const latestReplyRef = useRef("");

  const cancelPendingDraftSave = useCallback(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
  }, []);

  const loadThreads = useCallback(async () => {
    setListError(null);
    try {
      const res = await fetch("/api/admin/sms-inbox");
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to load");
      const data = await res.json();
      setThreads(data.threads ?? []);
      setTruncated(Boolean(data.truncated));
    } catch (err) {
      setThreads([]);
      setListError(err instanceof Error ? err.message : "Failed to load inbox");
    }
  }, []);

  useEffect(() => { void loadThreads(); }, [loadThreads]);

  /**
   * `adoptDraft` decides whether the saved draft is pulled into the reply box.
   * True when opening a thread (show me what I parked) and after sending (the
   * server just deleted it, so this clears the box). False for Mark handled,
   * which must not overwrite whatever is being typed right now.
   */
  const loadDetail = useCallback(
    async (phone: string, { adoptDraft = false }: { adoptDraft?: boolean } = {}) => {
      const requestId = ++detailRequestRef.current;
      setDetailLoading(true);
      setActionError(null);
      setNotice(null);
      try {
        const res = await fetch(`/api/admin/sms-inbox/${phone}`);
        if (!res.ok) throw new Error((await res.json())?.error || "Failed to load thread");
        const data: ThreadDetail = await res.json();
        if (requestId !== detailRequestRef.current) return;
        setDetail(data);
        if (adoptDraft) {
          const body = data.draft?.body ?? "";
          draftBaselineRef.current = body;
          draftLoadedForRef.current = phone;
          setReply(body);
          setDraftState(
            data.draft
              ? { kind: "saved", at: data.draft.updated_at, by: data.draft.updated_by }
              : { kind: "none" },
          );
        }
      } catch (err) {
        if (requestId !== detailRequestRef.current) return;
        setDetail(null);
        setActionError(err instanceof Error ? err.message : "Failed to load thread");
      } finally {
        if (requestId === detailRequestRef.current) setDetailLoading(false);
      }
    },
    [],
  );

  const saveDraft = useCallback(
    async (phone: string, text: string) => {
      const epoch = draftEpochRef.current;
      const had = draftBaselineRef.current.trim().length > 0;
      const has = text.trim().length > 0;
      setDraftState({ kind: "saving" });

      const run = (async () => {
        try {
          const res = await fetch(`/api/admin/sms-inbox/${phone}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save_draft", body: text }),
            // Survives the tab being closed mid-flight (see the visibility flush).
            keepalive: true,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || "Failed to save draft");
          // The box has moved on (different thread, discarded, sent). The write
          // still stands server-side; it just isn't this view's story anymore.
          if (draftEpochRef.current !== epoch) return;
          draftBaselineRef.current = text;
          // Only refresh the list when the thread's draft chip would actually
          // change. Re-fetching every autosave would re-read the whole inbox
          // every couple of seconds of typing. This runs before the early
          // return below: the follow-up save compares against the baseline THIS
          // call just moved, so it would see no transition and never ask.
          if (had !== has) void loadThreads();
          // Typing continued while this was in flight. A later save is already
          // queued for the newer text, so stay honest and keep saying unsaved.
          if (latestReplyRef.current !== text) {
            setDraftState({ kind: "dirty" });
            return;
          }
          setDraftState(
            data?.draft
              ? { kind: "saved", at: data.draft.updated_at, by: data.draft.updated_by }
              : { kind: "none" },
          );
        } catch (err) {
          if (draftEpochRef.current !== epoch) return;
          setDraftState({
            kind: "error",
            message: err instanceof Error ? err.message : "Failed to save draft",
          });
        }
      })();

      inFlightSaveRef.current = run;
      await run;
      if (inFlightSaveRef.current === run) inFlightSaveRef.current = null;
    },
    [loadThreads],
  );

  // Declared before the autosave effect so the ref is current by the time any
  // in-flight save resolves and asks what is in the box now.
  useEffect(() => {
    latestReplyRef.current = reply;
  }, [reply]);

  // Debounced autosave. Cleanup cancels the pending write on every keystroke and
  // on thread switch, so only a pause in typing reaches the server.
  useEffect(() => {
    if (!selected || draftLoadedForRef.current !== selected) return;
    if (reply === draftBaselineRef.current) return;
    setDraftState({ kind: "dirty" });
    const phone = selected;
    const text = reply;
    draftTimerRef.current = setTimeout(() => {
      draftTimerRef.current = null;
      void saveDraft(phone, text);
    }, DRAFT_SAVE_DELAY_MS);
    return cancelPendingDraftSave;
  }, [reply, selected, saveDraft, cancelPendingDraftSave]);

  // Closing the tab or switching away shouldn't cost you the last few seconds of
  // typing. Flush immediately instead of warning with a dialog.
  useEffect(() => {
    function flush() {
      if (document.visibilityState !== "hidden") return;
      if (!selected || draftLoadedForRef.current !== selected) return;
      if (reply === draftBaselineRef.current) return;
      cancelPendingDraftSave();
      void saveDraft(selected, reply);
    }
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, [reply, selected, saveDraft, cancelPendingDraftSave]);

  const openThread = useCallback((phone: string) => {
    // A thread switch can happen inside the debounce window. Start the write
    // before invalidating this draft epoch so those last keystrokes still land
    // server-side; refresh the list afterward so its draft chip stays honest.
    if (selected && draftLoadedForRef.current === selected && reply !== draftBaselineRef.current) {
      cancelPendingDraftSave();
      void saveDraft(selected, reply).then(() => loadThreads());
    }
    cancelPendingDraftSave();
    draftEpochRef.current += 1;
    draftLoadedForRef.current = null;
    draftBaselineRef.current = "";
    setSelected(phone);
    setDetail(null);
    setReply("");
    setDraftState({ kind: "none" });
    void loadDetail(phone, { adoptDraft: true });
  }, [cancelPendingDraftSave, loadDetail, loadThreads, reply, saveDraft, selected]);

  const closeThread = useCallback(() => {
    if (selected && draftLoadedForRef.current === selected && reply !== draftBaselineRef.current) {
      cancelPendingDraftSave();
      void saveDraft(selected, reply).then(() => loadThreads());
    }
    detailRequestRef.current += 1;
    draftEpochRef.current += 1;
    draftLoadedForRef.current = null;
    draftBaselineRef.current = "";
    setSelected(null);
    setDetail(null);
    setReply("");
    setDraftState({ kind: "none" });
    setActionError(null);
    setNotice(null);
    setDetailLoading(false);
  }, [cancelPendingDraftSave, loadThreads, reply, saveDraft, selected]);

  // Desktop inboxes are work surfaces, not landing pages. Open the first
  // actionable row so the flexible pane is useful immediately; mobile keeps
  // the familiar list-first navigation.
  useEffect(() => {
    if (selected || !threads?.length || window.innerWidth < 1024) return;
    const candidate = unhandledOnly
      ? threads.find((thread) => thread.unhandled > 0 || thread.has_draft)
      : threads[0];
    if (candidate) openThread(candidate.phone_last10);
  }, [openThread, selected, threads, unhandledOnly]);

  async function discardDraft() {
    if (!selected) return;
    cancelPendingDraftSave();
    draftEpochRef.current += 1;
    setActionError(null);
    // Clear the box first so the pane responds immediately; the request only
    // removes the stored copy.
    draftBaselineRef.current = "";
    setReply("");
    setDraftState({ kind: "none" });
    // Let any save already on the wire finish, so the delete is the last write
    // to land. Otherwise the row can outlive the discard that removed it.
    await inFlightSaveRef.current?.catch(() => {});
    try {
      const res = await fetch(`/api/admin/sms-inbox/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "discard_draft" }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed to discard draft");
      await loadThreads();
    } catch (err) {
      setDraftState({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to discard draft",
      });
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim() || sending) return;
    // Claim the send synchronously — the drain below awaits, and without the
    // flag set first a fast double-click would get two messages past the guard.
    setSending(true);
    setActionError(null);
    setNotice(null);
    // A queued autosave must not fire after the send: the server deletes the
    // draft as part of sending, and a late write would put the sent message
    // straight back in the box. Any save already on the wire is drained first
    // so it cannot land after the send's delete.
    cancelPendingDraftSave();
    draftEpochRef.current += 1;
    await inFlightSaveRef.current?.catch(() => {});
    try {
      const res = await fetch(`/api/admin/sms-inbox/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", body: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      draftBaselineRef.current = "";
      setReply("");
      setDraftState({ kind: "none" });
      await Promise.all([loadDetail(selected, { adoptDraft: true }), loadThreads()]);
      // Set AFTER the reload: loadDetail clears `notice`, so setting it first
      // wipes the confirmation before it ever paints.
      setNotice("Reply sent.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  }

  async function markHandled() {
    if (!selected) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/sms-inbox/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_handled" }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Failed");
      await Promise.all([loadDetail(selected), loadThreads()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to mark handled");
    }
  }

  // A parked draft counts as needing you, the same as an unanswered text —
  // otherwise a draft written on an already-handled thread is invisible in the
  // default view, which is most of the inbox. The `draft` chip says why the row
  // is here when `N new` doesn't.
  const visible = (threads ?? []).filter((t) =>
    unhandledOnly ? t.unhandled > 0 || t.has_draft : true,
  );
  const totalUnhandled = (threads ?? []).reduce((s, t) => s + t.unhandled, 0);
  // GSM-7 single segment is 160 chars; longer bodies split and bill per segment.
  const segments = reply.length === 0 ? 0 : Math.ceil(reply.length / 160);
  const recordHref = detail?.profile_id
    ? detail.profile_type === "family"
      ? `/admin/care-seekers/${detail.profile_id}`
      : detail.profile_type === "provider"
        ? `/admin/directory/${detail.profile_id}`
        : null
    : null;

  return (
    <AdminWorkspace>
      <div className={`grid min-h-0 flex-1 lg:grid-cols-[340px_minmax(0,1fr)] ${detail ? "2xl:grid-cols-[340px_minmax(0,1fr)_320px]" : ""}`}>
        {/* ── Thread list ─────────────────────────────────────────────── */}
        <aside className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-gray-200 bg-white`}>
          <header className="border-b border-gray-200 px-4 pb-3 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-950">Messages</h1>
                <p className="mt-1 text-xs leading-5 text-gray-500">Texts sent to Olera&rsquo;s number.</p>
              </div>
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${totalUnhandled > 0 ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
            </div>
            <div className="mt-4 flex items-center gap-2">
            {(["unhandled", "all"] as const).map((mode) => {
              const on = (mode === "unhandled") === unhandledOnly;
              return (
                <button
                  key={mode}
                  onClick={() => setUnhandledOnly(mode === "unhandled")}
                  className={[
                    "rounded-full px-3 py-1.5 text-xs transition-colors",
                    on ? "bg-gray-900 font-medium text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  ].join(" ")}
                >
                  {mode === "unhandled" ? "Needs reply" : "All"}
                </button>
              );
            })}
              <span className="ml-auto text-[11px] text-gray-400">
                {totalUnhandled > 0 ? `${totalUnhandled} awaiting reply` : "All caught up"}
              </span>
            </div>
          </header>

          {listError && (
            <p className="px-3 py-4 text-[13px] text-red-600">{listError}</p>
          )}
          {truncated && (
            // Never let a cap read as "that's everything".
            <p className="px-3 py-2 text-[11px] text-amber-800 bg-amber-50 border-b border-amber-100">
              Showing the most recent messages only — older threads are not listed.
            </p>
          )}
          {threads === null && !listError && (
            <div className="p-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          )}
          {threads !== null && visible.length === 0 && !listError && (
            <p className="px-3 py-6 text-[13px] text-gray-500">
              {unhandledOnly ? "Nothing waiting on you." : "No messages yet."}
            </p>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {visible.map((t) => {
              const active = selected === t.phone_last10;
              return (
                <button
                  key={t.phone_last10}
                  onClick={() => openThread(t.phone_last10)}
                  className={[
                    "relative w-full border-b border-gray-100 px-4 py-3 text-left transition-colors",
                    active ? "bg-teal-50/70" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-teal-600" />}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={[
                        "text-[13px] truncate",
                        t.unhandled > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700",
                      ].join(" ")}
                    >
                      {t.display_name || formatPhone(t.phone_last10)}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{relative(t.last_at)}</span>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mt-0.5">{t.last_body}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {t.profile_type && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 rounded px-1 py-px">
                        {t.profile_type}
                      </span>
                    )}
                    {t.suppressed && (
                      <span className="text-[10px] uppercase tracking-wide text-amber-700 bg-amber-50 rounded px-1 py-px">
                        opted out
                      </span>
                    )}
                    {t.unhandled > 0 && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 rounded px-1 py-px">
                        {t.unhandled} new
                      </span>
                    )}
                    {t.has_draft && (
                      <span
                        className="text-[10px] uppercase tracking-wide text-violet-700 bg-violet-50 rounded px-1 py-px"
                        title="An unsent reply is saved against this conversation"
                      >
                        draft
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Conversation ────────────────────────────────────────────── */}
        <section className={`${selected ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-col bg-white`}>
          {!selected && (
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Select a conversation</p>
                <p className="mt-1 text-sm text-gray-400">Read the thread and send the next reply.</p>
              </div>
            </div>
          )}

          {selected && detailLoading && (
            <div className="flex-1 space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          )}

          {/* Load failure (expired session, DB error). Without this the error
              lives inside the `detail &&` block below and can never render —
              a failed thread load would be a silent blank pane. */}
          {selected && !detailLoading && !detail && (
            <div className="flex-1 p-8">
              <p className="text-[13px] text-red-600">
                {actionError || "Could not load this conversation."}
              </p>
              <button
                onClick={() => loadDetail(selected, { adoptDraft: true })}
                className="mt-2 text-[12px] px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {selected && !detailLoading && detail && (
            <>
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-3.5">
                <div className="flex min-w-0 items-start gap-2">
                  <button
                    onClick={closeThread}
                    aria-label="Back to messages"
                    className="mt-0.5 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-gray-900">
                    {detail.display_name || formatPhone(detail.phone_last10)}
                  </p>
                  <p className="text-[12px] text-gray-500">
                    {formatPhone(detail.phone_last10)}
                    {detail.profile_type ? ` · ${detail.profile_type}` : " · not in our records"}
                  </p>
                  </div>
                </div>
                {detail.unhandled > 0 && (
                  <button
                    onClick={markHandled}
                    className="text-[12px] px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Mark handled
                  </button>
                )}
              </header>

              {detail.twilioError && (
                <p className="mx-5 mt-3 shrink-0 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                  {detail.twilioError} Showing the messages we stored.
                </p>
              )}

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-gray-50/30 px-5 py-5">
                <div className="mx-auto w-full max-w-3xl space-y-2.5">
                  {(detail.messages.length > 0
                  ? detail.messages
                  : detail.inbound.map((r) => ({
                      sid: String(r.id),
                      direction: "in" as const,
                      body: r.body,
                      at: r.created_at,
                      status: "received",
                      errorCode: null,
                    }))
                  ).map((m) => (
                  <div
                    key={m.sid}
                    className={m.direction === "in" ? "flex justify-start" : "flex justify-end"}
                  >
                    <div className="max-w-[75%]">
                      <div
                        className={[
                          "rounded-2xl px-3.5 py-2 text-[13px] whitespace-pre-wrap break-words",
                          m.direction === "in"
                            ? "bg-gray-100 text-gray-900 rounded-bl-sm"
                            : "bg-primary-600 text-white rounded-br-sm",
                        ].join(" ")}
                      >
                        {m.body}
                      </div>
                      <p
                        className={[
                          "text-[10px] text-gray-400 mt-0.5",
                          m.direction === "in" ? "text-left" : "text-right",
                        ].join(" ")}
                      >
                        {formatEt(m.at)}
                        {m.direction === "out" && m.status !== "delivered" && (
                          <span className="text-amber-600">
                            {" "}
                            · {m.status}
                            {m.errorCode ? ` (${m.errorCode})` : ""}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* ── Reply ───────────────────────────────────────────── */}
              <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3.5">
                <div className="mx-auto w-full max-w-3xl">
                {/* The researched answer sits ABOVE the reply box on purpose:
                    it is what you check before you write, not a suggestion
                    tucked beside the thing you were already going to send. */}
                {detail.answerPacket && !detail.suppressed && (
                  <div className="mb-3">
                    <AnswerPacketPanel
                      packet={detail.answerPacket.packet}
                      disabled={sending}
                      onUseDraft={(text) => {
                        setReply(text);
                        setDraftState({ kind: "dirty" });
                      }}
                    />
                  </div>
                )}
                {detail.suppressed ? (
                  <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2.5">
                    This number opted out
                    {detail.suppression?.reason === "sms_stop" ? " by texting STOP" : ""}. Replying is
                    blocked — they asked us to stop contacting them.
                  </p>
                ) : (
                  <>
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      maxLength={480}
                      placeholder="Write a reply…"
                      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
                    />
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <span className="text-[11px] text-gray-400 tabular-nums">
                        {reply.length}/480
                        {segments > 1 ? ` · ${segments} segments` : ""}
                      </span>
                      <div className="flex items-center gap-3">
                        <DraftStatus state={draftState} />
                        {(draftState.kind === "saved" || reply.length > 0) && (
                          <button
                            onClick={discardDraft}
                            disabled={sending}
                            className="text-[11px] text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                          >
                            Discard
                          </button>
                        )}
                        <button
                          onClick={sendReply}
                          disabled={!reply.trim() || sending}
                          className="text-[13px] font-medium px-3.5 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {sending ? "Sending…" : "Send text"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {actionError && (
                  <p className="mt-2 text-[12px] text-red-600">{actionError}</p>
                )}
                {notice && <p className="mt-2 text-[12px] text-emerald-700">{notice}</p>}
                </div>
              </div>
            </>
          )}
        </section>

        {/* ── Person context ─────────────────────────────────────────── */}
        {detail && (
          <aside className="hidden min-h-0 flex-col border-l border-gray-200 bg-white 2xl:flex">
            <header className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-gray-900">Contact</h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                {(detail.display_name || formatPhone(detail.phone_last10)).slice(0, 1).toUpperCase()}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-950">
                {detail.display_name || formatPhone(detail.phone_last10)}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{formatPhone(detail.phone_last10)}</p>

              <dl className="mt-6 divide-y divide-gray-100 border-y border-gray-100 text-sm">
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-gray-500">Record type</dt>
                  <dd className="font-medium capitalize text-gray-800">{detail.profile_type || "Unknown"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-gray-500">Messaging</dt>
                  <dd className={`font-medium ${detail.suppressed ? "text-amber-700" : "text-emerald-700"}`}>
                    {detail.suppressed ? "Opted out" : "Available"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 py-3">
                  <dt className="text-gray-500">Needs reply</dt>
                  <dd className="font-medium text-gray-800">{detail.unhandled > 0 ? `${detail.unhandled} message${detail.unhandled === 1 ? "" : "s"}` : "No"}</dd>
                </div>
              </dl>

              {recordHref && (
                <Link href={recordHref} className="mt-5 flex w-full items-center justify-center rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
                  Open {detail.profile_type === "family" ? "care-seeker" : "provider"} record
                </Link>
              )}
            </div>
          </aside>
        )}
      </div>
    </AdminWorkspace>
  );
}
