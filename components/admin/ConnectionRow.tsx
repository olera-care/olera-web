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
  continue_in_inbox: boolean;
}

interface ThreadEntry {
  text: string;
  created_at: string | null;
  is_auto_reply: boolean;
  role: "provider" | "family" | "system";
}

interface EmailTrailEntry {
  id: string;
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
  family: {
    id: string | null;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    nudgeCount: number;
    lastNudgedAt: string | null;
    careType: string | null;
    timeline: string | null;
  };
  provider: {
    display_name: string | null;
    email: string | null;
    phone: string | null;
    hasEmail: boolean;
    nudgeCount: number;
    lastNudgedAt: string | null;
    slug: string | null;
  };
  thread: ThreadEntry[];
  emails: EmailTrailEntry[];
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

  // Email preview state
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [emailHtmlCache, setEmailHtmlCache] = useState<Record<string, string | null>>({});
  const [emailHtmlLoading, setEmailHtmlLoading] = useState<string | null>(null);

  // Fetch email HTML when expanding
  async function toggleEmailPreview(emailId: string) {
    if (expandedEmailId === emailId) {
      // Collapse
      setExpandedEmailId(null);
      return;
    }
    // Expand
    setExpandedEmailId(emailId);
    // If already cached, don't fetch again
    if (emailHtmlCache[emailId] !== undefined) return;
    // Fetch HTML
    setEmailHtmlLoading(emailId);
    try {
      const res = await fetch(`/api/admin/emails/${emailId}/html`);
      if (res.ok) {
        const data = await res.json();
        setEmailHtmlCache((prev) => ({ ...prev, [emailId]: data.html_body }));
      } else {
        setEmailHtmlCache((prev) => ({ ...prev, [emailId]: null }));
      }
    } catch {
      setEmailHtmlCache((prev) => ({ ...prev, [emailId]: null }));
    } finally {
      // Only clear loading if this email is still the one loading
      setEmailHtmlLoading((prev) => (prev === emailId ? null : prev));
    }
  }

  const family = c.family.display_name || "A family";
  const provider = c.provider.display_name || "Provider";
  const age = formatAge(c.temperature.stalenessMs);

  // Build status descriptions
  const familyStatus = c.responded
    ? c.familyRepliedAfterProvider
      ? "replied"
      : "hasn't replied"
    : "sent request";

  const providerStatus = (() => {
    if (c.responded) return "replied";
    if (engagement?.contact_revealed) return "copied contact";
    if (engagement?.continue_in_inbox) return "went to inbox";
    if (engagement?.lead_opened) return "viewed lead";
    if (c.responseCategory === "no_email") return "no email";
    return "no response";
  })();

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
        setNudgeMsg({ ok: false, text: data.error || "Couldn't send." });
      }
    } catch {
      setNudgeMsg({ ok: false, text: "Network error — not sent." });
    } finally {
      setNudging(false);
    }
  }

  return (
    <div>
      {/* Collapsed row - clean, scannable */}
      <button
        onClick={toggle}
        className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-stone-50/60 transition-colors"
        aria-expanded={open}
      >
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-gray-900 truncate">{family}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-gray-900 truncate">{provider}</span>
            <span className="text-sm text-gray-400 shrink-0">{age}</span>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span>Family: {familyStatus}</span>
            <span className="text-gray-300">|</span>
            <span>Provider: {providerStatus}</span>
          </div>
        </div>

        {/* Expand chevron */}
        <svg
          className={`h-5 w-5 text-gray-300 transition-transform shrink-0 ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Expanded detail - two-column layout */}
      {open && (
        <div className="border-t border-gray-100 bg-stone-50/40 px-4 py-5">
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : loadError ? (
            <p className="text-sm text-rose-600">Could not load this connection. Try again.</p>
          ) : detail ? (
            <div className="space-y-5">
              {/* Two-column: Family | Provider */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FAMILY column */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Family</h3>
                    {detail.family.id && (
                      <a
                        href={`/admin/care-seekers/${detail.family.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        View profile
                      </a>
                    )}
                  </div>

                  <p className="font-medium text-gray-900 mb-1">
                    {detail.family.display_name || "Unknown"}
                  </p>

                  {/* Care metadata tags */}
                  {(detail.family.careType || detail.family.timeline) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {detail.family.careType && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                          {detail.family.careType}
                        </span>
                      )}
                      {detail.family.timeline && (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700">
                          {detail.family.timeline}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contact info */}
                  <div className="space-y-1.5 mb-3">
                    {detail.family.email ? (
                      <a
                        href={`mailto:${detail.family.email}`}
                        className="block text-sm text-blue-600 hover:underline truncate"
                      >
                        {detail.family.email}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">No email</p>
                    )}
                    {detail.family.phone ? (
                      <a
                        href={`tel:${detail.family.phone}`}
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {detail.family.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">No phone</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-sm text-gray-600 mb-3">
                    Status: {c.responded
                      ? c.familyRepliedAfterProvider
                        ? "Replied to provider"
                        : "Provider responded, hasn't replied yet"
                      : "Sent connection request"}
                  </div>

                  {/* Nudge history */}
                  <div className="text-xs text-gray-500 mb-3">
                    {detail.family.nudgeCount > 0 ? (
                      <>
                        Nudged {detail.family.nudgeCount} time{detail.family.nudgeCount !== 1 ? "s" : ""}
                        {detail.family.lastNudgedAt && (
                          <span className="ml-1">/ Last: {fmtDate(detail.family.lastNudgedAt)}</span>
                        )}
                      </>
                    ) : (
                      "Not nudged yet"
                    )}
                    <p className="mt-0.5 text-gray-400">
                      Automated nudges remind family to check provider responses
                    </p>
                  </div>

                  {/* Action */}
                  {c.responded && !c.familyRepliedAfterProvider && (
                    <button
                      onClick={() =>
                        sendNudge("/api/admin/send-family-nudge", "Follow-up sent to family.")
                      }
                      disabled={nudging}
                      className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {nudging ? "Sending..." : "Nudge Family"}
                    </button>
                  )}
                </div>

                {/* PROVIDER column */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Provider</h3>
                    {detail.provider.slug && (
                      <a
                        href={`/admin/directory/${detail.provider.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        View profile
                      </a>
                    )}
                  </div>

                  <p className="font-medium text-gray-900 mb-2">
                    {detail.provider.display_name || "Unknown"}
                  </p>

                  {/* Contact info */}
                  <div className="space-y-1.5 mb-3">
                    {detail.provider.email ? (
                      <a
                        href={`mailto:${detail.provider.email}`}
                        className="block text-sm text-blue-600 hover:underline truncate"
                      >
                        {detail.provider.email}
                      </a>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-amber-600">No email on file</span>
                        <a
                          href="/admin/leads?tab=needs_email"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Add email
                        </a>
                      </div>
                    )}
                    {detail.provider.phone ? (
                      <a
                        href={`tel:${detail.provider.phone}`}
                        className="block text-sm text-blue-600 hover:underline"
                      >
                        {detail.provider.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-400">No phone</p>
                    )}
                  </div>

                  {/* Engagement status */}
                  <div className="text-sm text-gray-600 mb-3">
                    {(() => {
                      if (c.responded) return "Status: Replied to family";
                      if (detail.engagement.contact_revealed) return "Status: Copied family contact";
                      if (detail.engagement.continue_in_inbox) return "Status: Went to inbox to message";
                      if (detail.engagement.lead_opened) return "Status: Viewed lead";
                      return "Status: No engagement yet";
                    })()}
                  </div>

                  {/* Nudge history */}
                  <div className="text-xs text-gray-500 mb-3">
                    {detail.provider.nudgeCount > 0 ? (
                      <>
                        Nudged {detail.provider.nudgeCount} time{detail.provider.nudgeCount !== 1 ? "s" : ""}
                        {detail.provider.lastNudgedAt && (
                          <span className="ml-1">/ Last: {fmtDate(detail.provider.lastNudgedAt)}</span>
                        )}
                      </>
                    ) : (
                      "Not nudged yet"
                    )}
                    <p className="mt-0.5 text-gray-400">
                      Automated nudges remind provider about pending family inquiries
                    </p>
                  </div>

                  {/* Action */}
                  {!c.responded && detail.provider.hasEmail && (
                    <button
                      onClick={() =>
                        sendNudge("/api/admin/send-nudge", "Nudge sent to provider.")
                      }
                      disabled={nudging}
                      className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      {nudging ? "Sending..." : "Nudge Provider"}
                    </button>
                  )}
                  {!c.responded && !detail.provider.hasEmail && detail.provider.phone && (
                    <a
                      href={`tel:${detail.provider.phone}`}
                      className="block w-full text-center rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200"
                    >
                      Call Provider
                    </a>
                  )}
                </div>
              </div>

              {/* Nudge feedback */}
              {nudgeMsg && (
                <p className={`text-sm ${nudgeMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>
                  {nudgeMsg.text}
                </p>
              )}

              {/* Conversation thread */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Conversation
                </h3>
                {detail.thread.length === 0 ? (
                  <p className="text-sm text-gray-400">No messages yet.</p>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {detail.thread.map((m, i) => (
                      <div key={i} className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {m.role === "family" ? "Family" : m.role === "provider" ? "Provider" : "System"}
                          </span>
                          {m.is_auto_reply && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              automated
                            </span>
                          )}
                          {m.created_at && (
                            <span className="text-xs text-gray-400">{fmtDate(m.created_at)}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">
                          {m.text || <span className="text-gray-300">-</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email trail */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Emails Sent
                </h3>
                {detail.emails.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    {detail.provider.nudgeCount > 0
                      ? "Nudges sent by automated system - no itemized log."
                      : "No emails sent yet."}
                  </p>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                    {detail.emails.map((e) => (
                      <div key={e.id}>
                        <button
                          type="button"
                          onClick={() => toggleEmailPreview(e.id)}
                          className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="min-w-0 flex items-center gap-2">
                            <svg
                              className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expandedEmailId === e.id ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm text-gray-700">{emailLabel(e.email_type)}</span>
                            <span className="text-gray-300">-</span>
                            <span className="text-sm text-gray-500">{fmtDateTime(e.created_at)}</span>
                            {e.recipient && (
                              <span className="text-xs text-gray-400 truncate hidden sm:inline">to {e.recipient}</span>
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
                        </button>
                        {expandedEmailId === e.id && (
                          <div className="border-t border-gray-100 p-3 bg-gray-50">
                            {emailHtmlLoading === e.id ? (
                              <p className="text-sm text-gray-400 text-center py-4">Loading preview...</p>
                            ) : emailHtmlCache[e.id] ? (
                              <div className="rounded border border-gray-200 bg-white overflow-hidden">
                                <iframe
                                  srcDoc={emailHtmlCache[e.id]!}
                                  className="w-full border-0"
                                  style={{ minHeight: "300px" }}
                                  title="Email preview"
                                  sandbox=""
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 text-center py-4">
                                No preview available for this email.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Next steps guidance */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  Recommended Next Step
                </h3>
                <p className="text-sm text-gray-700">{detail.nextStep.label}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
