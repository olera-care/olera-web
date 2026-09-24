"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CampaignFamiliesData, CampaignFamilyData } from "@/lib/ad-boost/boost-state";

/**
 * Campaign home: who to reach next, in their own words.
 *
 * One moment per screen, one thing lit. The lit family sits in a pool of warm
 * light with their own words and a message ready to send; everyone else waits,
 * dimmed, underneath. Messaging is always the lit move (texts get answered,
 * roughly five in six calls to these families go unanswered), calling is one
 * tap away and never pushed. After a call, one question: how did it go.
 *
 * The family never receives her words by text: our carrier registration covers
 * "X sent you a message, read and reply here", so the text carries a link and
 * the words live on the family's page (lib/city-ads/thread.server.ts).
 */

type Family = CampaignFamilyData;

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 7) return new Date(iso).toLocaleDateString("en-US", { weekday: "long" });
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "today", "yesterday", "on Sunday", "on Sep 20": when they reached out, said as a person would. */
function onDay(iso: string): string {
  const d = daysAgo(iso);
  return d === "today" || d === "yesterday" ? d : `on ${d}`;
}

/** Page inquiries can arrive without a name; every form lead has one. */
const named = (f: Family) => f.firstName !== "A family";

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw;
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/** Who reaches out first: people who wrote to us, then the newest, then the hard ones. */
function order(families: Family[]): Family[] {
  const rank = (f: Family) => (f.outcome ? 3 : f.words ? 0 : f.reach === "call" ? 2 : 1);
  return [...families].sort((a, b) => rank(a) - rank(b) || +new Date(b.arrivedAt) - +new Date(a.arrivedAt));
}

function draftFor(f: Family, providerName: string): string {
  const intro = named(f) ? `Hi ${f.firstName}, this is ${providerName}.` : `Hi, this is ${providerName}.`;
  if (f.words && f.words.length <= 100) {
    return `${intro} Thanks for your note: "${clip(f.words, 100)}" I'd love to help. When's a good time to talk?`;
  }
  if (f.words) return `${intro} Thanks for telling us what you need. I'd love to help. When's a good time to talk?`;
  return `${intro} I saw your care request and I'd love to help. When's a good time to talk, or would you rather text?`;
}

function whoLine(f: Family): string {
  if (f.kind === "page") return `asked on your Olera page ${daysAgo(f.arrivedAt)}`;
  if (f.words) return `wrote to us ${daysAgo(f.arrivedAt)}`;
  if (f.reach === "call") return "from your ad · our texts don't reach this phone";
  if (f.reach === "email") return "from your ad · our texts don't reach this phone, email does";
  return "from your ad";
}

function quietLine(f: Family): string {
  if (f.outcome === "client") return "Became a client";
  if (f.outcome === "talking") return "Talked";
  if (f.outcome === "no") return "Not a fit";
  if (f.contact === "messaged") return "You messaged. Waiting on them";
  if (f.words) return "Wrote to us. Message first";
  if (f.kind === "page") return "Asked on your page";
  if (f.reach === "call") return "Call rather than text";
  return "Message first";
}

export default function CampaignHome({
  data,
  providerName,
  footer,
}: {
  data: CampaignFamiliesData;
  providerName: string;
  /** Quiet lines under the families: the plan, visitors, questions. */
  footer?: React.ReactNode;
}) {
  const [families, setFamilies] = useState<Family[]>(() => order(data.families));
  const [selectedId, setSelectedId] = useState<string | null>(() => order(data.families).find((f) => !f.outcome)?.id ?? null);
  const selected = families.find((f) => f.id === selectedId) ?? null;
  const [askFor, setAskFor] = useState<Family | null>(null);

  const talked = families.filter((f) => f.contact === "talked").length;
  const messagedN = families.filter((f) => f.contact === "messaged").length;
  const toGo = families.length - talked - messagedN;
  const others = families.filter((f) => f.id !== selectedId);
  const n = families.length;

  function patch(id: string, p: Partial<Family>) {
    setFamilies((prev) => prev.map((f) => (f.id === id ? { ...f, ...p } : f)));
  }

  if (n === 0) {
    return (
      <section className="py-4">
        <h2 className="font-display text-3xl leading-tight text-gray-900 md:text-4xl">Your ads are running.</h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-gray-500">
          Families appear here as they arrive, with what they told us and a message ready for you to send.
        </p>
        {footer && <div className="mt-10">{footer}</div>}
      </section>
    );
  }

  return (
    <section aria-label="Families from your ads">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-0">
        <div className="lg:pr-12">
          <p className="text-[15px] text-gray-600">
            <span className="font-semibold text-gray-900">
              Your ads have found {n} {n === 1 ? "family" : "families"}.
            </span>{" "}
            {selected ? "Here's who to reach first." : "Everyone has heard from you."}
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
            <span className="flex gap-1" aria-hidden>
              {[...families]
                .sort((a, b) => ["talked", "messaged", "none"].indexOf(a.contact) - ["talked", "messaged", "none"].indexOf(b.contact))
                .map((f) => (
                <i
                  key={f.id}
                  className={`block h-1 w-6 rounded-full ${
                    f.contact === "talked" ? "bg-primary-600" : f.contact === "messaged" ? "bg-primary-300" : "bg-vanilla-300"
                  }`}
                />
              ))}
            </span>
            <span>
              {[talked ? `Talked with ${talked}` : null, messagedN ? `messaged ${messagedN}` : null, toGo ? `${toGo} to go` : null]
                .filter(Boolean)
                .join(" · ") || "Just started"}
            </span>
          </div>

          {selected && (
            <Moment
              key={selected.id}
              family={selected}
              providerName={providerName}
              onSent={() => patch(selected.id, { contact: selected.contact === "talked" ? "talked" : "messaged" })}
              onCalled={() => setAskFor(selected)}
              onNext={() => {
                const next = order(families).find((f) => !f.outcome && f.id !== selected.id && f.contact === "none");
                if (next) setSelectedId(next.id);
              }}
            />
          )}

          {others.length > 0 && (
            <div className="mt-10">
              <p className="mb-1 text-xs font-semibold tracking-wide text-gray-400">{selected ? "Then" : "Your families"}</p>
              <ul className="opacity-70 transition-opacity hover:opacity-100">
                {order(others).map((f) => (
                  <li key={f.id} className="border-t border-vanilla-200">
                    <button
                      type="button"
                      onClick={() => setSelectedId(f.id)}
                      className="flex w-full items-baseline justify-between gap-4 py-3 text-left text-[15px] text-gray-800 hover:text-gray-950"
                    >
                      <span className="min-w-0 truncate">{named(f) ? f.firstName : f.kind === "page" ? "A family on your Olera page" : "A family"}</span>
                      <span className="shrink-0 text-sm text-gray-400">{quietLine(f)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10 space-y-2 text-sm text-gray-500">
            {data.screenedOut > 0 && (
              <p>
                {data.screenedOut} {data.screenedOut === 1 ? "person" : "people"} asked about jobs, not care. We kept them off your list.
              </p>
            )}
            <p>Olera texts every family first. You and our team both see every message and call.</p>
            {footer}
          </div>
        </div>

        {selected && (
          <aside className="hidden border-l border-vanilla-200 lg:block">
            <ThreadPanel key={selected.id} family={selected} />
          </aside>
        )}
      </div>

      {askFor && (
        <HowDidItGo
          family={askFor}
          onClose={() => setAskFor(null)}
          onSaved={(value) => {
            patch(askFor.id, { outcome: value, contact: "talked" });
            setAskFor(null);
          }}
        />
      )}
    </section>
  );
}

function Moment({
  family: f,
  providerName,
  onSent,
  onCalled,
  onNext,
}: {
  family: Family;
  providerName: string;
  onSent: () => void;
  onCalled: () => void;
  onNext: () => void;
}) {
  const [draft, setDraft] = useState(() => draftFor(f, providerName));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  // The whole message is always visible: she should read what she is about to
  // send without scrolling inside a three-line box on a phone.
  const box = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);
  const canMessage = f.kind === "form" && (f.reach === "text" || f.reach === "email");

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/provider/ad-boost/family-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: f.id, body: draft }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Couldn’t send that. Try again.");
      setSent(true);
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t send that. Try again.");
    } finally {
      setSending(false);
    }
  }

  const call = f.phone ? (
    <a href={`tel:${f.phone}`} onClick={onCalled} className="underline decoration-gray-300 underline-offset-4 hover:decoration-gray-500">
      call {formatPhone(f.phone)}
    </a>
  ) : null;

  return (
    <div className="relative mt-10 isolate">
      <div
        aria-hidden
        className="absolute -inset-x-8 -inset-y-7 -z-10 rounded-[40px]"
        style={{ background: "radial-gradient(60% 70% at 30% 40%, rgba(241,229,214,.95), rgba(241,229,214,0) 70%)" }}
      />
      <div className="rounded-3xl bg-white px-6 py-7 md:px-8 md:py-8">
        <p className="text-sm text-gray-600">
          <span className="text-[15px] font-semibold text-gray-900">{named(f) ? f.firstName : "A family"}</span> · {whoLine(f)}
        </p>
        {f.words ? (
          <p className="mt-4 font-display text-[30px] leading-[1.12] text-gray-950 md:text-[38px]" style={{ textWrap: "balance" }}>
            <span className="text-primary-600">“</span>
            {clip(f.words, 160)}
            <span className="text-primary-600">”</span>
          </p>
        ) : (
          <p className="mt-4 font-display text-[26px] leading-[1.15] text-gray-950 md:text-[30px]">
            {named(f) ? f.firstName : "A family"} asked about {f.kind === "page" ? "your care" : "care"} {onDay(f.arrivedAt)}.
          </p>
        )}

        {sent ? (
          <div className="mt-6">
            <p className="text-[15px] leading-relaxed text-gray-700">
              Sent. {named(f) ? f.firstName : "They"} get{named(f) ? "s" : ""} {f.reach === "email" ? "an email" : "a text"} with a link to read it. We&rsquo;ll tell you when they reply.
            </p>
            <button type="button" onClick={onNext} className="mt-4 text-[15px] font-semibold text-primary-700 hover:text-primary-800">
              Next family &rarr;
            </button>
          </div>
        ) : canMessage ? (
          <div className="mt-6">
            <label htmlFor={`draft-${f.id}`} className="text-xs text-gray-400">
              Your message · edit anything
            </label>
            <textarea
              id={`draft-${f.id}`}
              ref={box}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={2000}
              className="mt-1.5 w-full resize-none overflow-hidden rounded-2xl border-0 bg-vanilla-100 px-4 py-3 text-[15px] leading-relaxed text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !draft.trim()}
              className="mt-4 w-full rounded-2xl bg-primary-800 px-5 py-4 text-left text-[17px] font-semibold text-white transition-colors hover:bg-primary-900 disabled:opacity-60"
            >
              {sending ? "Sending…" : named(f) ? `Send to ${f.firstName}` : "Send"}
            </button>
            <p className="mt-3 text-sm text-gray-600">
              {named(f) ? `${f.firstName} gets` : "They get"} it as {f.reach === "email" ? "an email" : "a text"}.{call ? <> You can also {call}.</> : null}
            </p>
            {error && (
              <p className="mt-2 text-sm text-error-700" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : f.kind === "page" ? (
          <div className="mt-6">
            <Link
              href={`/portal/inbox?id=${f.id}`}
              className="block w-full rounded-2xl bg-primary-800 px-5 py-4 text-[17px] font-semibold text-white hover:bg-primary-900"
            >
              Reply in Messages
            </Link>
            {call && <p className="mt-3 text-sm text-gray-600">You can also {call}.</p>}
          </div>
        ) : (
          <div className="mt-6">
            {f.phone ? (
              <a
                href={`tel:${f.phone}`}
                onClick={onCalled}
                className="flex w-full items-center justify-between rounded-2xl bg-primary-800 px-5 py-4 text-[17px] font-semibold text-white hover:bg-primary-900"
              >
                <span>{named(f) ? `Call ${f.firstName}` : "Call"}</span>
                <span className="text-sm font-medium opacity-80">{formatPhone(f.phone)}</span>
              </a>
            ) : null}
            <p className="mt-3 text-sm text-gray-600">Our texts don&rsquo;t reach this number, so a call is the way in.</p>
          </div>
        )}

        {f.kind === "form" && (
          <button
            type="button"
            onClick={() => setShowThread((v) => !v)}
            aria-expanded={showThread}
            className="mt-5 text-sm text-gray-500 underline decoration-gray-300 underline-offset-4 hover:text-gray-700 lg:hidden"
          >
            {showThread ? "Hide conversation" : "Conversation"}
          </button>
        )}
        {showThread && (
          <div className="mt-4 border-t border-vanilla-200 pt-4 lg:hidden">
            <ThreadPanel family={f} compact />
          </div>
        )}
      </div>
    </div>
  );
}

interface Entry {
  at: string;
  author: "olera" | "provider" | "family";
  kind: "message" | "event";
  text: string;
}

/** The shared conversation with one family: ours, hers and theirs, oldest first. */
function ThreadPanel({ family: f, compact = false }: { family: Family; compact?: boolean }) {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (f.kind !== "form") return;
    let cancelled = false;
    fetch(`/api/provider/ad-boost/family-thread?leadId=${encodeURIComponent(f.id)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Couldn’t load the conversation.");
        if (!cancelled) setEntries(d.entries ?? []);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Couldn’t load the conversation."));
    return () => {
      cancelled = true;
    };
  }, [f.id, f.kind, f.contact]);

  const shown = useMemo(() => (entries ?? []).filter((e) => e.kind === "message" || /called|talked|passed/i.test(e.text)), [entries]);

  if (f.kind === "page") {
    return (
      <div className={compact ? "" : "px-8 py-7"}>
        <p className="text-[15px] font-semibold text-gray-900">{f.firstName}</p>
        <p className="mt-1 text-sm text-gray-500">This conversation lives in Messages.</p>
        <Link href={`/portal/inbox?id=${f.id}`} className="mt-4 inline-block text-sm font-semibold text-primary-700">
          Open in Messages &rarr;
        </Link>
      </div>
    );
  }

  const who = (a: Entry["author"]) => (a === "provider" ? "You" : a === "family" ? f.firstName : "Olera");
  return (
    <div className={compact ? "" : "flex h-full flex-col"}>
      {!compact && (
        <div className="border-b border-vanilla-200 px-8 py-6">
          <p className="text-[15px] font-semibold text-gray-900">{f.firstName}</p>
          <p className="mt-0.5 text-sm text-gray-500">You and Olera both see this conversation</p>
        </div>
      )}
      <div className={compact ? "space-y-3" : "flex-1 space-y-4 px-8 py-6"}>
        {error && <p className="text-sm text-error-700">{error}</p>}
        {!error && entries === null && <p className="text-sm text-gray-400">Loading&hellip;</p>}
        {entries && shown.length === 0 && <p className="text-sm text-gray-400">Nothing yet.</p>}
        {shown.map((e, i) =>
          e.kind === "event" ? (
            <p key={i} className="text-center text-xs text-gray-400">
              {e.text} · {daysAgo(e.at)}
            </p>
          ) : (
            <div key={i} className={`flex flex-col gap-1 ${e.author === "provider" ? "items-end" : "items-start"}`}>
              <span className="text-xs text-gray-400">
                {who(e.author)} · {new Date(e.at).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })}
              </span>
              <p
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  e.author === "provider"
                    ? "bg-primary-800 text-white"
                    : e.author === "family"
                      ? "border border-vanilla-200 bg-white text-gray-900"
                      : "bg-vanilla-100 text-gray-800"
                }`}
              >
                {e.text}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

/** One question after a call. "No answer" records nothing; they try again later. */
function HowDidItGo({
  family: f,
  onClose,
  onSaved,
}: {
  family: Family;
  onClose: () => void;
  onSaved: (v: "talking" | "client" | "no") => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(value: "talking" | "client" | "no") {
    setSaving(true);
    setError(null);
    try {
      const res =
        f.kind === "form"
          ? await fetch("/api/provider/ad-boost/family-outcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ leadId: f.id, value }),
            })
          : await fetch("/api/provider/lead-outcome", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cid: f.id, value }),
            });
      if (!res.ok) throw new Error();
      onSaved(value);
    } catch {
      setError("Couldn’t save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const opt = "flex w-full items-center justify-between rounded-2xl border border-vanilla-200 px-4 py-3.5 text-left text-base font-medium text-gray-900 hover:border-gray-300 disabled:opacity-60";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="how-did-it-go" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-white px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-4 sm:rounded-3xl sm:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-vanilla-300 sm:hidden" aria-hidden />
        <h3 id="how-did-it-go" className="font-display text-[26px] leading-tight text-gray-950">
          {named(f) ? `How did it go with ${f.firstName}?` : "How did it go?"}
        </h3>
        <div className="mt-5 space-y-2.5">
          <button type="button" disabled={saving} onClick={() => save("talking")} className={opt}>
            We talked <span className="text-sm font-normal text-gray-400">still deciding</span>
          </button>
          <button type="button" disabled={saving} onClick={() => save("client")} className={opt}>
            Becoming a client
          </button>
          <button type="button" disabled={saving} onClick={() => save("no")} className={opt}>
            Not a fit
          </button>
          <button type="button" disabled={saving} onClick={onClose} className={opt}>
            No answer <span className="text-sm font-normal text-gray-400">try again later</span>
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-error-700" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
