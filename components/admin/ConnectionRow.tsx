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

interface EngagementTimeline {
  email_sent_at: string | null;
  email_delivered_at: string | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  lead_opened_at: string | null;
  contact_revealed_at: string | null;
  account_claimed_at: string | null;
  one_click_at: string | null;
  first_response_at: string | null;
}

export interface ConnectionRowData {
  id: string;
  created_at?: string;
  family: { display_name: string | null; email?: string | null; phone?: string | null };
  provider: {
    display_name: string | null;
    email?: string | null;
    claim_state?: string | null;
  };
  temperature: ConnectionTemperature;
  // Enhanced engagement data
  engagement?: EngagementTimeline;
  heat_score?: number;
  is_hot_lead?: boolean;
  is_responded?: boolean;
  provider_claimed?: boolean;
  provider_claim_state?: string;
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

/** Engagement badges shown in collapsed row */
function EngagementBadges({ engagement, showHeat, heatScore }: {
  engagement?: EngagementTimeline;
  showHeat?: boolean;
  heatScore?: number;
}) {
  if (!engagement) return null;

  const badges: { emoji: string; label: string; active: boolean }[] = [
    { emoji: "📧", label: "Opened", active: !!engagement.email_opened_at },
    { emoji: "👁", label: "Viewed", active: !!engagement.lead_opened_at },
    { emoji: "📋", label: "Copied", active: !!engagement.contact_revealed_at },
    { emoji: "✓", label: "Claimed", active: !!engagement.account_claimed_at },
  ];

  const activeBadges = badges.filter((b) => b.active);
  if (activeBadges.length === 0 && !showHeat) return null;

  return (
    <div className="flex items-center gap-1.5">
      {showHeat && heatScore !== undefined && heatScore >= 50 && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
          🔥 {heatScore}
        </span>
      )}
      {activeBadges.map((badge) => (
        <span
          key={badge.label}
          className="inline-flex items-center gap-0.5 text-[10px] text-gray-400"
          title={badge.label}
        >
          {badge.emoji} {badge.label}
        </span>
      ))}
    </div>
  );
}

/** Full engagement timeline shown in expanded view */
function EngagementTimelineView({ engagement, claimState }: {
  engagement?: EngagementTimeline;
  claimState?: string;
}) {
  if (!engagement) return null;

  const events: { label: string; timestamp: string | null; emoji: string }[] = [
    { label: "Email sent", timestamp: engagement.email_sent_at, emoji: "📤" },
    { label: "Email delivered", timestamp: engagement.email_delivered_at, emoji: "📬" },
    { label: "Email opened", timestamp: engagement.email_opened_at, emoji: "📧" },
    { label: "Email clicked", timestamp: engagement.email_clicked_at, emoji: "🔗" },
    { label: "Lead viewed", timestamp: engagement.lead_opened_at, emoji: "👁" },
    { label: "Contact copied", timestamp: engagement.contact_revealed_at, emoji: "📋" },
    { label: "One-click access", timestamp: engagement.one_click_at, emoji: "⚡" },
    { label: "Account claimed", timestamp: engagement.account_claimed_at, emoji: "✓" },
    { label: "First response", timestamp: engagement.first_response_at, emoji: "💬" },
  ].filter((e) => e.timestamp);

  if (events.length === 0 && !claimState) {
    return (
      <p className="text-sm text-gray-400">No engagement signals yet.</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {claimState && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium ${
            claimState === "claimed"
              ? "bg-emerald-100 text-emerald-700"
              : claimState === "pending"
                ? "bg-amber-100 text-amber-700"
                : "bg-gray-100 text-gray-600"
          }`}>
            {claimState === "claimed" ? "✓ Claimed" : claimState === "pending" ? "⏳ Pending" : "⚪ Unclaimed"}
          </span>
          <span className="text-gray-500">Provider account</span>
        </div>
      )}
      {events.map((event, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-5 text-center">{event.emoji}</span>
          <span className="text-gray-700">{event.label}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">{fmtDateTime(event.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

/** Heat score visualization */
function HeatScoreBar({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const color = score >= 80 ? "bg-red-500" : score >= 50 ? "bg-orange-500" : score >= 30 ? "bg-yellow-500" : "bg-gray-300";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-gray-600">{score}</span>
    </div>
  );
}

export default function ConnectionRow({
  c,
  engagement,
  showHeatScore = false,
}: {
  c: ConnectionRowData;
  engagement?: Engagement;
  showHeatScore?: boolean;
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
  const isHotLead = c.is_hot_lead;

  // Use enhanced engagement data if available, otherwise fall back to legacy
  const hasEnhancedEngagement = !!c.engagement;
  const engaged = hasEnhancedEngagement
    ? (c.engagement?.contact_revealed_at ? "contact shown" :
       c.engagement?.lead_opened_at ? "viewed" :
       c.engagement?.email_clicked_at ? "clicked" :
       c.engagement?.email_opened_at ? "opened" : null)
    : (engagement?.contact_revealed ? "contact shown" :
       engagement?.email_clicked ? "clicked" :
       engagement?.lead_opened ? "opened" : null);

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
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${cfg.text}`}>{cfg.label}</span>
            <span className="text-xs text-gray-400">· {formatAge(c.temperature.stalenessMs)}</span>
            {isHotLead && (
              <span className="inline-flex items-center rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">
                🔥 Hot
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-sm text-gray-700">
            {family} <span className="text-gray-300">→</span> {provider}
          </div>
          {isAwaitingFamily && (
            <div className="mt-0.5 text-xs text-gray-400">↳ provider replied, no answer · nudge?</div>
          )}
          {/* Engagement badges */}
          {hasEnhancedEngagement && (
            <div className="mt-1">
              <EngagementBadges
                engagement={c.engagement}
                showHeat={showHeatScore}
                heatScore={c.heat_score}
              />
            </div>
          )}
        </div>
        {/* Legacy engaged text (shown when no enhanced engagement) */}
        {!hasEnhancedEngagement && engaged && (
          <span className="mt-[3px] shrink-0 text-[11px] text-gray-400">{engaged}</span>
        )}
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
            <p className="text-sm text-rose-600">Could not load this connection. Try again.</p>
          ) : detail ? (
            <div className="space-y-4">
              {/* Heat Score (for hot leads) */}
              {showHeatScore && c.heat_score !== undefined && c.heat_score >= 50 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-orange-600">
                    Heat Score
                  </p>
                  <div className="mt-2">
                    <HeatScoreBar score={c.heat_score} />
                  </div>
                  <p className="mt-2 text-xs text-orange-700">
                    High engagement, consider priority outreach.
                  </p>
                </div>
              )}

              {/* Engagement Timeline */}
              {hasEnhancedEngagement && (
                <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                    Engagement Timeline
                  </p>
                  <div className="mt-2">
                    <EngagementTimelineView
                      engagement={c.engagement}
                      claimState={c.provider_claim_state}
                    />
                  </div>
                </div>
              )}

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
                  <button
                    onClick={() => window.location.href = "/admin/leads?tab=needs_email"}
                    className="mt-3 inline-block rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Add email in Leads →
                  </button>
                )}

                {nudgeMsg && (
                  <p className={`mt-2 text-xs ${nudgeMsg.ok ? "text-emerald-600" : "text-rose-600"}`}>
                    {nudgeMsg.text}
                  </p>
                )}
              </div>

              {/* Contact Info */}
              <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Contact Info
                </p>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Family</p>
                    <p className="text-sm font-medium text-gray-800">
                      {detail.family.display_name || "Unknown"}
                    </p>
                    {c.family.email && (
                      <p className="text-xs text-gray-500">{c.family.email}</p>
                    )}
                    {c.family.phone && (
                      <p className="text-xs text-gray-500">{c.family.phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Provider</p>
                    <p className="text-sm font-medium text-gray-800">
                      {detail.provider.display_name || "Unknown"}
                    </p>
                    {detail.provider.hasEmail ? (
                      <p className="text-xs text-gray-500">{detail.provider.email}</p>
                    ) : (
                      <p className="text-xs text-amber-600">No email on file</p>
                    )}
                  </div>
                </div>
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

              {/* Provider contact + history (legacy - kept for backward compatibility) */}
              {!hasEnhancedEngagement && (
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
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
