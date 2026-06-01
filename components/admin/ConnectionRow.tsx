"use client";

import { useState } from "react";
import {
  TEMPERATURE_CONFIG,
  dotOpacityForStaleness,
  formatAge,
  type ConnectionTemperature,
  type NextStep,
} from "@/lib/connection-temperature";
import EmailStatusPill from "@/components/admin/EmailStatusPill";

export interface ConnectionRowData {
  id: string;
  family: { display_name: string | null };
  provider: { display_name: string | null };
  temperature: ConnectionTemperature;
}

interface Engagement {
  email_clicked: boolean;
  lead_opened: boolean;
  contact_revealed: boolean;
}

interface ThreadEntry {
  text: string;
  created_at: string | null;
  is_auto_reply: boolean;
  role: "provider" | "family" | "system";
}

interface EmailTrailEntry {
  email_type: string | null;
  recipient: string | null;
  status: string | null;
  created_at: string | null;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
}

interface Detail {
  id: string;
  family: { id: string | null; display_name: string | null };
  provider: { display_name: string | null; email: string | null; hasEmail: boolean; slug: string | null };
  ask: string | null;
  thread: ThreadEntry[];
  emails: EmailTrailEntry[];
  nudgeCount: number;
  lastNudgedAt: string | null;
  engagement: Engagement;
  temperature: ConnectionTemperature;
  nextStep: NextStep;
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
  provider_nudge: "Nudge",
  add_email_notification: "Lead notification",
  connection_request: "Lead notification",
  guest_connection: "Lead notification",
  question_received: "Question",
  new_message: "Message",
  post_connection_followup: "Follow-up",
};

function emailLabel(type: string | null): string {
  if (!type) return "Email";
  return EMAIL_TYPE_LABELS[type] || type.replace(/_/g, " ");
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function ConnectionRow({
  c,
  engagement,
}: {
  c: ConnectionRowData;
  engagement?: Engagement;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Nudge action state
  const [nudging, setNudging] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cfg = TEMPERATURE_CONFIG[c.temperature.state];
  const opacity = dotOpacityForStaleness(c.temperature.stalenessMs);
  const family = c.family.display_name || "A family";
  const provider = c.provider.display_name || "Unknown provider";
  const isAwaitingFamily = c.temperature.state === "awaiting_family";

  const engaged = engagement?.contact_revealed
    ? "contact shown"
    : engagement?.email_clicked
      ? "clicked"
      : engagement?.lead_opened
        ? "opened"
        : null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail && !loading) {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/admin/connections/${c.id}`);
        if (!res.ok) throw new Error("failed");
        setDetail(await res.json());
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    }
  }

  async function nudgeProvider() {
    setNudging(true);
    setNudgeMsg(null);
    try {
      const res = await fetch("/api/admin/send-nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: c.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNudgeMsg({ ok: true, text: "Nudge sent — the provider was emailed." });
        setDetail((d) => (d ? { ...d, nudgeCount: d.nudgeCount + 1 } : d));
      } else {
        setNudgeMsg({ ok: false, text: data.error || "Couldn’t send the nudge." });
      }
    } catch {
      setNudgeMsg({ ok: false, text: "Network error — nudge not sent." });
    } finally {
      setNudging(false);
    }
  }

  return (
    <div>
      {/* Collapsed row */}
      <button
        onClick={toggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-stone-50/60 transition-colors"
        aria-expanded={open}
      >
        <span
          className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
          style={{ opacity }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
            <span className="text-xs text-gray-400">· {formatAge(c.temperature.stalenessMs)}</span>
          </div>
          <div className="mt-0.5 truncate text-sm text-gray-700">
            {family} <span className="text-gray-300">→</span> {provider}
          </div>
          {isAwaitingFamily && (
            <div className="mt-0.5 text-xs text-gray-400">↳ provider replied, no answer · nudge?</div>
          )}
        </div>
        {engaged && <span className="mt-[3px] shrink-0 text-[11px] text-gray-400">{engaged}</span>}
        <svg
          className={`mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-50 bg-stone-50/40 px-4 py-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : loadError ? (
            <p className="text-sm text-rose-600">Couldn’t load this connection. Try again.</p>
          ) : detail ? (
            <div className="space-y-4">
              {/* Next step — the headline action */}
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Next step
                </p>
                <p className="mt-1 text-sm text-gray-800">{detail.nextStep.label}</p>

                {detail.nextStep.action === "nudge_provider" && (
                  <button
                    onClick={nudgeProvider}
                    disabled={nudging}
                    className="mt-3 rounded-lg bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {nudging ? "Sending…" : "Nudge provider"}
                  </button>
                )}
                {detail.nextStep.action === "add_provider_email" && (
                  <a
                    href="/admin/leads?tab=needs_email"
                    className="mt-3 inline-block rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Add email in Leads →
                  </a>
                )}
                {detail.nextStep.action === "follow_up_family" && (
                  <p className="mt-2 text-xs text-gray-400">
                    One-click family follow-up is coming; for now, reach out from the family’s record.
                  </p>
                )}

                {nudgeMsg && (
                  <p className={`mt-2 text-xs ${nudgeMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>
                    {nudgeMsg.text}
                  </p>
                )}
              </div>

              {/* Records — jump into either account to investigate */}
              {(detail.family.id || detail.provider.slug) && (
                <div className="flex flex-wrap gap-2">
                  {detail.family.id && (
                    <a
                      href={`/admin/care-seekers/${detail.family.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Care seeker: {detail.family.display_name || "view"} ↗
                    </a>
                  )}
                  {detail.provider.slug && (
                    <a
                      href={`/admin/directory/${detail.provider.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Provider: {detail.provider.display_name || "view"} ↗
                    </a>
                  )}
                </div>
              )}

              {/* The ask */}
              {detail.ask && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    What the family asked
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{detail.ask}</p>
                </div>
              )}

              {/* Conversation */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Conversation
                </p>
                {detail.thread.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-400">No messages yet.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {detail.thread.map((m, i) => (
                      <div
                        key={i}
                        className={`text-sm ${m.role === "provider" ? "text-gray-800" : "text-gray-600"}`}
                      >
                        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                          {m.role}
                          {m.is_auto_reply ? " · auto" : ""}
                          {m.created_at ? ` · ${fmtDate(m.created_at)}` : ""}
                        </span>
                        <p className="mt-0.5">{m.text || <span className="text-gray-300">—</span>}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email trail — what's been sent to this provider, and whether it landed */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Emails sent to this provider
                </p>
                {detail.emails.length === 0 ? (
                  <p className="mt-1 text-sm text-gray-400">
                    {detail.nudgeCount > 0
                      ? "Nudges were sent by the automated system; no itemized log for this provider."
                      : "No emails sent yet."}
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {detail.emails.map((e, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <span className="text-gray-700">{emailLabel(e.email_type)}</span>
                          <span className="text-gray-300"> · </span>
                          <span className="text-gray-500">{fmtDateTime(e.created_at)}</span>
                          {e.recipient && (
                            <span className="ml-1 truncate text-xs text-gray-400">→ {e.recipient}</span>
                          )}
                        </div>
                        <EmailStatusPill
                          status={e.status}
                          sentAt={e.created_at}
                          delivered_at={e.delivered_at}
                          first_opened_at={e.first_opened_at}
                          first_clicked_at={e.first_clicked_at}
                          bounced_at={e.bounced_at}
                          complained_at={e.complained_at}
                          className="shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Provider contact + history */}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                <span>
                  Provider:{" "}
                  {detail.provider.hasEmail ? (
                    <span className="text-gray-700">{detail.provider.email}</span>
                  ) : (
                    <span className="text-amber-600">no email on file</span>
                  )}
                </span>
                <span>
                  Engagement:{" "}
                  {detail.engagement.contact_revealed
                    ? "contact shown"
                    : detail.engagement.email_clicked
                      ? "clicked email"
                      : detail.engagement.lead_opened
                        ? "opened email"
                        : "no signal"}
                </span>
                {detail.nudgeCount > 0 && (
                  <span>
                    Nudged {detail.nudgeCount}× · last {fmtDate(detail.lastNudgedAt)}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
