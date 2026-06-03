"use client";

import { useState, useCallback } from "react";
import {
  formatAge,
  type ConnectionTemperature,
  type NextStep,
} from "@/lib/connection-temperature";
import EmailStatusPill from "@/components/admin/EmailStatusPill";

interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
}

export type ResponseCategory = "needs_attention" | "provider_nudged" | "family_nudged" | "responded" | "no_email";

export interface ConnectionRowData {
  id: string;
  family: {
    id?: string | null;
    display_name: string | null;
    email?: string | null;
    phone?: string | null;
    image_url?: string | null;
    completeness?: ProfileCompleteness;
  };
  provider: {
    id?: string | null;
    display_name: string | null;
    email?: string | null;
    phone?: string | null;
    image_url?: string | null;
    is_active?: boolean;
    completeness?: ProfileCompleteness;
  };
  messagePreview?: string;
  responded?: boolean;
  familyRepliedAfterProvider?: boolean;
  nudgeCount?: number;
  providerNudgedAt?: string | null;
  familyNudgedAt?: string | null;
  responseCategory?: ResponseCategory | null;
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
  const [imgError, setImgError] = useState(false);

  // Nudge action state
  const [nudging, setNudging] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleImgError = useCallback(() => setImgError(true), []);

  const family = c.family.display_name || "A family";
  const provider = c.provider.display_name || "Provider";
  const providerInitial = provider.charAt(0).toUpperCase();
  const age = formatAge(c.temperature.stalenessMs);

  // Determine the primary action based on response category
  const category = c.responseCategory;
  const hasProviderPhone = !!c.provider.phone;

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

  async function sendNudge(endpoint: string, successText: string) {
    setNudging(true);
    setNudgeMsg(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connection_id: c.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNudgeMsg({ ok: true, text: successText });
      } else {
        setNudgeMsg({ ok: false, text: data.error || "Couldn’t send." });
      }
    } catch {
      setNudgeMsg({ ok: false, text: "Network error — not sent." });
    } finally {
      setNudging(false);
    }
  }

  // Action button config based on category
  const actionConfig = {
    no_email: {
      label: "Call",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      style: "bg-amber-50 text-amber-700 hover:bg-amber-100",
      href: hasProviderPhone ? `tel:${c.provider.phone}` : undefined,
    },
    needs_attention: {
      label: "Nudge",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      style: "bg-blue-50 text-blue-700 hover:bg-blue-100",
      href: undefined as string | undefined,
    },
    provider_nudged: {
      label: "Waiting on provider",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      style: "bg-gray-100 text-gray-500",
      href: undefined as string | undefined,
    },
    family_nudged: {
      label: "Waiting on family",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      style: "bg-gray-100 text-gray-500",
      href: undefined as string | undefined,
    },
    responded: {
      label: "Connected",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      style: "bg-emerald-50 text-emerald-700",
      href: undefined as string | undefined,
    },
  };

  const action = category ? actionConfig[category] : null;

  return (
    <div>
      {/* Collapsed row */}
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-stone-50/60 transition-colors"
        aria-expanded={open}
      >
        {/* Provider avatar */}
        <div className="w-10 h-10 shrink-0">
          {c.provider.image_url && !imgError ? (
            <img
              src={c.provider.image_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
              onError={handleImgError}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-400">
                {providerInitial}
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="font-medium text-gray-900 truncate">{provider}</div>
          <div className="text-sm text-gray-500 truncate">
            from {family} · {age}
          </div>
          {/* Inline WHY context */}
          <div className="mt-0.5 text-xs text-gray-500 truncate">
            {(() => {
              // Build engagement description
              const signals: string[] = [];
              if (engagement?.contact_revealed) signals.push("copied contact");
              else if (engagement?.lead_opened) signals.push("viewed lead");
              else if (engagement?.email_clicked) signals.push("opened email");

              // Build status description
              let status = "";
              if (category === "responded") {
                // Differentiate between truly connected vs awaiting family
                status = c.familyRepliedAfterProvider ? "connected" : "provider responded";
              } else if (category === "provider_nudged") {
                status = "waiting on provider";
              } else if (category === "family_nudged") {
                status = "waiting on family";
              } else if (category === "no_email") {
                status = "no email on file";
              } else if (category === "needs_attention") {
                status = "no response yet";
              }

              // Combine into readable sentence
              if (signals.length > 0 && status) {
                return `${signals.join(", ")} — ${status}`;
              } else if (signals.length > 0) {
                return signals.join(", ");
              } else if (status) {
                return status;
              } else if (c.messagePreview) {
                return c.messagePreview;
              }
              return "lead sent";
            })()}
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0">
          {action && (
            action.href ? (
              <a
                href={action.href}
                onClick={(e) => e.stopPropagation()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${action.style}`}
              >
                {action.icon}
                {action.label}
              </a>
            ) : (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${action.style}`}>
                {action.icon}
                {action.label}
              </span>
            )
          )}
          <svg
            className={`h-5 w-5 text-gray-300 transition-transform ${open ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-gray-50 bg-stone-50/40 px-4 py-4">
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : loadError ? (
            <p className="text-sm text-rose-600">Could not load this connection. Try again.</p>
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
                    onClick={() =>
                      sendNudge("/api/admin/send-nudge", "Nudge sent — the provider was emailed.")
                    }
                    disabled={nudging}
                    className="mt-3 rounded-lg bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {nudging ? "Sending…" : "Nudge provider"}
                  </button>
                )}
                {detail.nextStep.action === "nudge_family" && (
                  <button
                    onClick={() =>
                      sendNudge(
                        "/api/admin/send-family-nudge",
                        "Follow-up sent — the family was emailed."
                      )
                    }
                    disabled={nudging}
                    className="mt-3 rounded-lg bg-gray-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {nudging ? "Sending…" : "Nudge family"}
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
