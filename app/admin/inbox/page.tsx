"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminWorkspace from "@/components/admin/AdminWorkspace";
import AnswerPacketPanel from "@/components/admin/AnswerPacketPanel";
import RecheckPanel from "@/components/admin/RecheckPanel";
import {
  packetNeedsAttention,
  type AnswerPacket,
  type RecheckRecord,
} from "@/lib/family-answers/types";
import type { SmsThreadState } from "@/lib/sms/inbox-threads";

/**
 * SMS conversation directory — every inbound text plus logged family texts
 * Olera sent before a reply, and the ability to answer them.
 *
 * Two panes: threads on the left, conversation + reply box on the right.
 * Twilio supplies the complete thread when available; sms_inbound and the
 * outbound email_log ledger supply identity, silent-recipient visibility, and
 * a durable bidirectional fallback.
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
  last_direction: "in" | "out";
  last_email_type: string | null;
  last_outbound_status: string | null;
  last_outbound_delivered_at: string | null;
  last_outbound_clicked_at: string | null;
  unhandled: number;
  /** Oldest qualifying family reply still waiting for a human. */
  oldest_promised_reply_at: string | null;
  total: number;
  inbound_count: number;
  outbound_count: number;
  suppressed: boolean;
  has_draft: boolean;
  state: SmsThreadState;
}

type InboxMode = "needs_reply" | "awaiting_family" | "all";

const THREAD_STATE_PRESENTATION: Record<
  SmsThreadState,
  { label: string; className: string; title?: string }
> = {
  needs_reply: {
    label: "needs Olera reply",
    className: "bg-emerald-50 text-emerald-700",
  },
  awaiting_family: {
    label: "awaiting family",
    className: "bg-blue-50 text-blue-700",
  },
  self_served: {
    label: "clicked plan",
    className: "bg-teal-50 text-teal-700",
    title: "The latest outbound text's plan link was opened",
  },
  opted_out: {
    label: "opted out",
    className: "bg-amber-50 text-amber-700",
  },
  delivery_failed: {
    label: "delivery failed",
    className: "bg-red-50 text-red-700",
  },
  handled: {
    label: "handled",
    className: "bg-gray-100 text-gray-500",
  },
};

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
  /**
   * The recipient's send window, evaluated in THEIR timezone. Drives what the
   * send button says before it is pressed, so nobody discovers the rule by
   * having a text held.
   */
  quietHours: {
    allowed: boolean;
    crisisExempt: boolean;
    tz: string;
    sendAfter: string | null;
    recipientNow: string;
  };
  /** A reply already written and waiting for that window to open. */
  scheduled: { id: string; body: string; send_after: string; queued_by: string | null } | null;
  /**
   * Standing facts about the person, for the rail. Facts carry `verified` so
   * the panel can show where each one came from instead of flattening a form
   * answer and something they told us into the same confident sentence.
   */
  seeker: {
    email: string | null;
    relationship: string | null;
    location: string | null;
    facts: { label: string; value: string; verified: boolean }[];
    program: {
      name: string;
      firstStepAt: string | null;
      lastReply: string | null;
      status: string | null;
    } | null;
    firstSeenAt: string | null;
    waitingSince: string | null;
    counts: { them: number; us: number };
  };
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

/** Just the clock part, for a button that has to stay narrow. */
function formatEtTime(iso: string | null): string {
  if (!iso) return "later";
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });
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

/**
 * Standing facts about the care seeker, beside the conversation.
 *
 * Every fact is rendered next to where it came from. A form answer and
 * something they told us in the thread are not the same kind of claim, and
 * collapsing them into one confident list is how a reviewer ends up acting on
 * an age nobody verified.
 *
 * Ordered by what a reviewer reaches for first, which is not the demographics:
 * whether the person writing is the one who needs care comes before anything
 * else, because it changes how the whole reply is written.
 */
function SeekerPanel({ seeker }: { seeker: ThreadDetail["seeker"] }) {
  const waitedDays = seeker.waitingSince
    ? Math.floor((Date.now() - new Date(seeker.waitingSince).getTime()) / 86_400_000)
    : null;

  return (
    <>
      {seeker.relationship && (
        <p className="mt-3 text-sm text-gray-900">
          Writing about{" "}
          <span className="font-medium">
            {seeker.relationship.toLowerCase() === "myself"
              ? "themselves"
              : seeker.relationship.toLowerCase()}
          </span>
        </p>
      )}
      {seeker.location && <p className="mt-0.5 text-sm text-gray-500">{seeker.location}</p>}
      {seeker.email && (
        <p className="mt-0.5 break-all text-[13px] text-gray-400">{seeker.email}</p>
      )}

      {/* An unanswered message that is days old is the most actionable thing on
          this panel, so it is the only part allowed to use colour. */}
      {waitedDays !== null && waitedDays >= 1 && (
        <p className="mt-3 text-[13px] font-medium text-amber-700">
          Waiting {waitedDays} day{waitedDays === 1 ? "" : "s"} for a reply
        </p>
      )}

      {seeker.facts.length > 0 && (
        <dl className="mt-5 space-y-2 text-sm">
          {seeker.facts.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-gray-500">{f.label}</dt>
              <dd className="text-right text-gray-900">
                {f.value}
                <span className="ml-1.5 text-[11px] text-gray-400">
                  {f.verified ? "they told us" : "from a form"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {seeker.program && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-[11px] uppercase tracking-wide text-gray-400">In progress</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{seeker.program.name}</p>
          <p className="mt-0.5 text-[12px] text-gray-500">
            {seeker.program.firstStepAt
              ? `First step sent ${formatEt(seeker.program.firstStepAt)}`
              : "First step not yet sent"}
            {seeker.program.lastReply ? ` · they replied ${seeker.program.lastReply}` : ""}
          </p>
        </div>
      )}

      <p className="mt-5 border-t border-gray-100 pt-4 text-[12px] text-gray-400">
        {seeker.counts.them} from them, {seeker.counts.us} from us
        {seeker.firstSeenAt ? ` · first wrote ${formatEt(seeker.firstSeenAt)}` : ""}
      </p>
    </>
  );
}

export default function AdminSmsInboxPage() {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [inboxMode, setInboxMode] = useState<InboxMode>("needs_reply");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  /**
   * WHICH send is in flight, not merely that one is. With a single button a
   * boolean was enough; with two, a bare flag puts "Sending…" on the button
   * that was not pressed — click "Send now" and "Schedule 8:00 AM" is what
   * animates. That reads as the opposite of what you just chose, at the one
   * moment you most need to know you overruled the hold correctly.
   */
  const [sendingNow, setSendingNow] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  /**
   * Result of the most recent re-check, held in component state rather than
   * persisted into the packet. It belongs to the text in the box right now: the
   * moment that text changes it is stale, and a stale check that still looks
   * authoritative is exactly the problem this feature exists to solve.
   */
  const [recheckResult, setRecheckResult] = useState<RecheckRecord | null>(null);
  /**
   * Every draft the reviewer has actually had checked in this thread.
   *
   * A button is not a safeguard if nobody presses it. On 2026-08-31 three of
   * six replies to care seekers went out with no adversarial check at all,
   * because Re-check is optional and the reviewer simply forgot — not because
   * the check was weak. The gap was never the checker's quality, it was that
   * it never ran.
   *
   * Checked text is remembered rather than a boolean flag, so editing one word
   * after a check correctly makes the reply unchecked again.
   */
  const [checkedDrafts, setCheckedDrafts] = useState<Set<string>>(new Set());
  /**
   * Which send is waiting on a second click because the text is unchecked.
   *
   * A passive warning would not have prevented this: the recipient-local time
   * is already displayed in amber beside the counter and it does not stop
   * anything. Sending an unverified claim to someone in crisis is worth one
   * deliberate click, and only ever one, and only when the check was skipped.
   */
  const [confirmUnchecked, setConfirmUnchecked] = useState<null | "now" | "default">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draftState, setDraftState] = useState<DraftState>({ kind: "none" });
  /** Narrow-window home for the packet. The rail only exists at 2xl. */
  const [sheetOpen, setSheetOpen] = useState(false);

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
  /**
   * Guards a re-check against landing on the wrong conversation. The request
   * takes tens of seconds (web search plus two model calls), which is ample
   * time to click another thread, and a verdict about one family's message
   * rendered under another family's is worse than no verdict at all.
   */
  const recheckRequestRef = useRef(0);
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
      // A re-check belongs to one specific string in one specific thread.
      // Carrying it across a thread switch would attach a verdict about one
      // family's message to another family's. Bumping the ref abandons any
      // request still on the wire, which is the half that clearing state alone
      // does not cover: it would otherwise resolve after this and repopulate.
      recheckRequestRef.current += 1;
      setRecheckResult(null);
      setRechecking(false);
      setCheckedDrafts(new Set());
      // Without this a confirmation armed on one thread carries to the next,
      // and the first click there sends unchecked text with no second look.
      setConfirmUnchecked(null);
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

  // Desktop inboxes are work surfaces, not landing pages. Keep the detail pane
  // aligned with the active filter: retaining a Needs-reply conversation after
  // switching to Awaiting makes the tab lie about what is on screen. Mobile
  // keeps the familiar list-first navigation.
  useEffect(() => {
    if (!threads?.length || window.innerWidth < 1024) return;

    const belongsToMode = (thread: Thread) =>
      inboxMode === "all" || thread.state === inboxMode;
    const activeThread = selected
      ? threads.find((thread) => thread.phone_last10 === selected)
      : null;
    if (activeThread && belongsToMode(activeThread)) return;

    const candidate = threads.find(belongsToMode);
    if (candidate) {
      openThread(candidate.phone_last10);
    } else if (selected) {
      closeThread();
    }
  }, [closeThread, inboxMode, openThread, selected, threads]);

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

  /** Explicit "use this draft" — always wins, overwrites whatever is in the box. */
  const adoptDraftText = useCallback((text: string) => {
    setReply(text);
    setDraftState({ kind: "dirty" });
    // Same reason as the textarea's onChange: the confirmed text and the text
    // now in the box are not the same text.
    setConfirmUnchecked(null);
  }, []);

  /**
   * Silent pre-fill for a packet with nothing flagged, so the common case is
   * edit-a-word-and-send rather than click-then-edit-then-send.
   *
   * Guarded on the box being empty: a pre-fill must never overwrite something
   * a human was in the middle of typing, and a parked draft is a deliberate
   * act that outranks a suggestion.
   */
  const autoFillDraftText = useCallback((text: string) => {
    // Two guards, and the first one is the load-bearing one.
    //
    // draftBaselineRef holds the draft loaded from the server, and it is a
    // SYNCHRONOUS ref write inside loadDetail. latestReplyRef is updated in an
    // effect, and child effects run before parent effects — so on the render
    // where a thread opens, the panel's auto-fill fires while latestReplyRef
    // still holds the previous thread's value. Reading only that ref would let
    // a clean packet silently overwrite a reply someone had parked, which is
    // the one thing drafts exist to prevent.
    if (draftBaselineRef.current.trim()) return;
    if (latestReplyRef.current.trim()) return;
    setReply(text);
    setDraftState({ kind: "dirty" });
    setConfirmUnchecked(null);
  }, []);

  async function sendReply({ now = false }: { now?: boolean } = {}) {
    if (!selected || !reply.trim() || sending) return;
    // Unchecked text asks once. Crisis threads are exempt: quiet hours already
    // step aside for them, and a checker round trip is the wrong thing to put
    // between a person in crisis and an answer.
    const action = now ? "now" : "default";
    if (
      !checkedDrafts.has(reply.trim()) &&
      !detail?.quietHours.crisisExempt &&
      confirmUnchecked !== action
    ) {
      setConfirmUnchecked(action);
      setActionError(null);
      setNotice(null);
      return;
    }
    setConfirmUnchecked(null);
    // Claim the send synchronously — the drain below awaits, and without the
    // flag set first a fast double-click would get two messages past the guard.
    setSending(true);
    setSendingNow(now);
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
        body: JSON.stringify({ action: "reply", body: reply.trim(), sendNow: now }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send");
      draftBaselineRef.current = "";
      setReply("");
      setDraftState({ kind: "none" });
      await Promise.all([loadDetail(selected, { adoptDraft: true }), loadThreads()]);
      // Set AFTER the reload: loadDetail clears `notice`, so setting it first
      // wipes the confirmation before it ever paints.
      setNotice(
        data?.scheduled
          ? `Scheduled for ${formatEt(data.scheduled.sendAfter)} ET, when their quiet hours end.`
          : "Reply sent.",
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
      setSendingNow(false);
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

  async function cancelScheduled() {
    if (!selected || sending) return;
    setSending(true);
    setActionError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/sms-inbox/${selected}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_scheduled" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to cancel");
      await Promise.all([loadDetail(selected, { adoptDraft: true }), loadThreads()]);
      setNotice("Send canceled. The reply is back in the box.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setSending(false);
    }
  }

  /**
   * Attack the text currently in the box.
   *
   * The packet's objections describe the draft the ENGINE wrote. Editing that
   * draft silently invalidates every one of them while the panel goes on
   * showing the source count, which is the most misleading state the review
   * surface has. This is the way back to a checked message.
   */
  async function recheck() {
    if (!selected || !reply.trim() || rechecking) return;
    const requestId = ++recheckRequestRef.current;
    const forThread = selected;
    setRechecking(true);
    setActionError(null);
    setNotice(null);
    setRecheckResult(null);
    try {
      const res = await fetch(`/api/admin/sms-inbox/${forThread}/recheck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (requestId !== recheckRequestRef.current) return;
      if (!res.ok) throw new Error(data?.error || "Re-check failed");
      const result = data.recheck as RecheckRecord;
      setRecheckResult(result);
      setCheckedDrafts((prev) => new Set(prev).add(result.draft.trim()));
    } catch (err) {
      if (requestId !== recheckRequestRef.current) return;
      setActionError(err instanceof Error ? err.message : "Re-check failed");
    } finally {
      if (requestId === recheckRequestRef.current) setRechecking(false);
    }
  }

  // A parked draft counts as needing you, the same as an unanswered text —
  // otherwise a draft written on an already-handled thread is invisible in the
  // default view, which is most of the inbox. The `draft` chip says why the row
  // is here when `N new` doesn't.
  const responseDeadlineMs = 48 * 60 * 60 * 1000;
  const isResponseOverdue = (t: Thread) =>
    t.unhandled > 0 &&
    !t.suppressed &&
    Boolean(t.oldest_promised_reply_at) &&
    Date.now() - new Date(t.oldest_promised_reply_at as string).getTime() > responseDeadlineMs;
  const visible = (threads ?? [])
    .filter((thread) =>
      inboxMode === "all"
        ? true
        : inboxMode === "needs_reply"
          ? thread.state === "needs_reply"
          : thread.state === "awaiting_family",
    )
    .sort((a, b) => {
      // A promised response that is already late must not sit below a newer
      // conversation. Within each group, preserve newest-thread ordering.
      const overdueDelta =
        inboxMode === "needs_reply"
          ? Number(isResponseOverdue(b)) - Number(isResponseOverdue(a))
          : 0;
      return overdueDelta || new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
    });
  const needsReplyCount = (threads ?? []).filter((thread) => thread.state === "needs_reply").length;
  const awaitingFamilyCount = (threads ?? []).filter(
    (thread) => thread.state === "awaiting_family",
  ).length;
  const overdueThreadCount = (threads ?? []).filter(isResponseOverdue).length;
  // The packet the rail will actually render. Derived once so the header can
  // never claim "Drafted answer" over a panel that was suppressed away.
  const railPacket =
    detail?.answerPacket && !detail.suppressed ? detail.answerPacket.packet : null;
  const selectedThread = (threads ?? []).find(
    (thread) => thread.phone_last10 === selected,
  );
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
      <div className={`grid min-h-0 flex-1 lg:grid-cols-[340px_minmax(0,1fr)] ${detail ? (detail.answerPacket ? "2xl:grid-cols-[340px_minmax(0,1fr)_400px]" : "2xl:grid-cols-[340px_minmax(0,1fr)_320px]") : ""}`}>
        {/* ── Thread list ─────────────────────────────────────────────── */}
        <aside className={`${selected ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-gray-200 bg-white`}>
          <header className="border-b border-gray-200 px-4 pb-3 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-gray-950">Messages</h1>
                <p className="mt-1 text-xs leading-5 text-gray-500">Texts to and from Olera.</p>
              </div>
              <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${needsReplyCount > 0 ? "bg-amber-500" : "bg-emerald-500"}`} aria-hidden="true" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              {(["needs_reply", "awaiting_family", "all"] as const).map((mode) => {
                const on = mode === inboxMode;
                return (
                  <button
                    key={mode}
                    onClick={() => setInboxMode(mode)}
                    className={[
                      "rounded-full px-3 py-1.5 text-xs transition-colors",
                      on ? "bg-gray-900 font-medium text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    ].join(" ")}
                  >
                    {mode === "needs_reply" ? "Needs reply" : mode === "awaiting_family" ? "Awaiting" : "All"}
                  </button>
                );
              })}
              <span className="ml-auto text-[11px] text-gray-400">
                {inboxMode === "needs_reply"
                  ? overdueThreadCount > 0
                    ? `${overdueThreadCount} past 48h`
                    : needsReplyCount > 0
                      ? `${needsReplyCount} need reply`
                      : "All caught up"
                  : inboxMode === "awaiting_family"
                    ? `${awaitingFamilyCount} waiting`
                    : `${threads?.length ?? 0} conversations`}
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
              {inboxMode === "needs_reply"
                ? "Nothing waiting on you."
                : inboxMode === "awaiting_family"
                  ? "No conversations are awaiting a family response."
                  : "No messages yet."}
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
                  <p className="text-[12px] text-gray-500 truncate mt-0.5">
                    {t.last_direction === "out" && (
                      <span className="font-medium text-gray-400">Sent: </span>
                    )}
                    {t.last_body}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {t.profile_type && (
                      <span className="text-[10px] uppercase tracking-wide text-gray-500 bg-gray-100 rounded px-1 py-px">
                        {t.profile_type}
                      </span>
                    )}
                    <span
                      className={`rounded px-1 py-px text-[10px] ${THREAD_STATE_PRESENTATION[t.state].className}`}
                      title={THREAD_STATE_PRESENTATION[t.state].title}
                    >
                      {THREAD_STATE_PRESENTATION[t.state].label}
                      {t.state === "needs_reply" && t.unhandled > 1 ? ` · ${t.unhandled} new` : ""}
                    </span>
                    {isResponseOverdue(t) && (
                      <span
                        className="rounded bg-red-50 px-1 py-px text-[10px] font-medium text-red-700"
                        title={`Olera promised a reply within 48 hours; oldest unanswered family message arrived ${formatEt(t.oldest_promised_reply_at)}`}
                      >
                        48h overdue
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
                  {selectedThread && (
                    <span
                      className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] ${THREAD_STATE_PRESENTATION[selectedThread.state].className}`}
                      title={THREAD_STATE_PRESENTATION[selectedThread.state].title}
                    >
                      {THREAD_STATE_PRESENTATION[selectedThread.state].label}
                    </span>
                  )}
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
                {/* On narrow windows the rail does not exist, so the packet
                    becomes a sheet reached from here. It must never sit inline
                    above the reply box again: at ~700px it evicted the very
                    conversation it is meant to be judged against. */}
                {detail.answerPacket && !detail.suppressed && (
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="mb-2.5 flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-left transition-colors hover:bg-gray-50 2xl:hidden"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${packetNeedsAttention(detail.answerPacket.packet) ? "bg-amber-500" : "bg-teal-500"}`}
                      aria-hidden="true"
                    />
                    <span className="text-[13px] text-gray-900">
                      {detail.answerPacket.packet.triage.isCrisis
                        ? "Flagged as a crisis"
                        : "Drafted answer ready"}
                    </span>
                    <span className="ml-auto text-[11px] text-gray-400">Review</span>
                  </button>
                )}
                {detail.suppressed ? (
                  <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2.5">
                    This number opted out
                    {detail.suppression?.reason === "sms_stop" ? " by texting STOP" : ""}. Replying is
                    blocked — they asked us to stop contacting them.
                  </p>
                ) : detail.scheduled ? (
                  /* A committed reply waiting on the clock. It replaces the box
                     rather than sitting above it: the thread is answered, and a
                     live textarea here would invite a second reply to a question
                     that already has one. */
                  <div className="rounded-lg border border-gray-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                      <span className="text-[13px] font-medium text-gray-900">
                        Sending {formatEt(detail.scheduled.send_after)} ET
                      </span>
                      <button
                        onClick={cancelScheduled}
                        disabled={sending}
                        className="ml-auto text-[11px] text-gray-400 hover:text-red-600 disabled:opacity-40 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      Held until their quiet hours end. Cancelling puts it back in the box.
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-600">
                      {detail.scheduled.body}
                    </p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={reply}
                      onChange={(e) => {
                        setReply(e.target.value);
                        // Any edit re-opens the question: the text about to be
                        // sent is not the text that was just confirmed.
                        setConfirmUnchecked(null);
                      }}
                      rows={3}
                      maxLength={480}
                      placeholder="Write a reply…"
                      className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-300"
                    />
                    <div className="flex items-center justify-between gap-3 mt-2">
                      <span className="text-[11px] text-gray-400 tabular-nums">
                        {reply.length}/480
                        {segments > 1 ? ` · ${segments} segments` : ""}
                        {!detail.quietHours.allowed && (
                          <span className="text-amber-600">
                            {" · "}
                            {detail.quietHours.recipientNow} for them
                          </span>
                        )}
                        {reply.trim() && !checkedDrafts.has(reply.trim()) && (
                          <span className="text-gray-400">{" · not checked"}</span>
                        )}
                      </span>
                      <div className="flex flex-wrap items-center justify-end gap-2">
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
                          onClick={recheck}
                          disabled={!reply.trim() || rechecking || sending}
                          title="Re-run the adversarial check against this text"
                          className="text-[12px] font-medium px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {rechecking ? "Checking…" : "Re-check"}
                        </button>
                        {/* Outside the recipient's window BOTH actions stay on
                            screen. Weight carries the recommendation, never
                            availability: scheduling is filled because it is the
                            right default, and sending is one plain click away
                            because the reason to overrule a quiet hour is
                            usually urgency, and hiding the override behind a
                            caret taxes exactly the case that cannot afford it. */}
                        {!detail.quietHours.allowed && (
                          <button
                            onClick={() => sendReply({ now: true })}
                            disabled={!reply.trim() || sending}
                            title={`It is ${detail.quietHours.recipientNow} where they are`}
                            className="text-[13px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {sending && sendingNow
                              ? "Sending…"
                              : confirmUnchecked === "now"
                                ? "Send unchecked?"
                                : "Send now"}
                          </button>
                        )}
                        <button
                          onClick={() => sendReply()}
                          disabled={!reply.trim() || sending}
                          className="text-[13px] font-medium px-3.5 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {sending && !sendingNow
                            ? detail.quietHours.allowed
                              ? "Sending…"
                              : "Scheduling…"
                            : confirmUnchecked === "default"
                              ? detail.quietHours.allowed
                                ? "Send unchecked?"
                                : "Schedule unchecked?"
                              : detail.quietHours.allowed
                                ? "Send text"
                                : `Schedule ${formatEtTime(detail.quietHours.sendAfter)}`}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {recheckResult && !detail.scheduled && (
                  <RecheckPanel
                    result={recheckResult}
                    currentDraft={reply}
                    onUseSuggestion={adoptDraftText}
                    onDismiss={() => setRecheckResult(null)}
                    disabled={sending}
                  />
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
              <h2 className="text-base font-semibold text-gray-900">
                {railPacket
                  ? railPacket.triage.isCrisis
                    ? "Flagged message"
                    : "Drafted answer"
                  : "Contact"}
              </h2>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {/* The answer sits beside the conversation, so the question it is
                  answering stays on screen while you judge it. */}
              {railPacket && (
                <div className="mb-6 border-b border-gray-100 pb-6">
                  <AnswerPacketPanel
                    packet={railPacket}
                    disabled={sending}
                    onUseDraft={adoptDraftText}
                    onAutoFill={autoFillDraftText}
                  />
                </div>
              )}
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                {(detail.display_name || formatPhone(detail.phone_last10)).slice(0, 1).toUpperCase()}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-950">
                {detail.display_name || formatPhone(detail.phone_last10)}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{formatPhone(detail.phone_last10)}</p>

              <SeekerPanel seeker={detail.seeker} />

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

      {/* Narrow-window packet. A sheet rather than a swapped view, so the
          conversation stays behind it — losing the question is the exact
          failure this redesign exists to fix. */}
      {railPacket && sheetOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end 2xl:hidden">
          <button
            aria-label="Close"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-gray-900/20 motion-safe:animate-[fadeIn_.2s_ease-out]"
          />
          <div className="relative max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-3 shadow-2xl motion-safe:animate-[sheetUp_.24s_cubic-bezier(.32,.72,0,1)]">
            <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-gray-200" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Drafted answer</h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-[12px] text-gray-400 transition-colors hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <AnswerPacketPanel
              packet={railPacket}
              disabled={sending}
              onUseDraft={(t) => {
                adoptDraftText(t);
                setSheetOpen(false);
              }}
              onAutoFill={autoFillDraftText}
            />
          </div>
          <style>{`@keyframes sheetUp{from{transform:translateY(12px);opacity:.6}to{transform:none;opacity:1}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
        </div>
      )}
    </AdminWorkspace>
  );
}
