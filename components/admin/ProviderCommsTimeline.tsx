"use client";

import { Fragment, useEffect, useState } from "react";
import EmailStatusPill from "@/components/admin/EmailStatusPill";

/**
 * Unified comms timeline for ONE provider — interleaves automated emails
 * (with status pills + expandable preview) with meaningful on-Olera activity
 * events (sign-ins, answers, profile edits, dashboard clicks, etc).
 *
 * The CRM contact-card view: answers "what is this provider experiencing?"
 * instead of "is this campaign performing?"
 *
 * Reads /api/admin/directory/[providerId]/comms-timeline, which resolves
 * the provider's ID variants (slug + business_profile UUID) before querying
 * email_log and provider_activity. Catches rows the existing /api/admin/emails
 * surface silently misses when the caller used the UUID instead of the slug.
 */

interface EmailEvent {
  id: string;
  at: string;
  kind: "email";
  email: {
    log_id: string;
    email_type: string;
    subject: string;
    status: string;
    delivered_at: string | null;
    first_opened_at: string | null;
    first_clicked_at: string | null;
    bounced_at: string | null;
    complained_at: string | null;
    error_message: string | null;
  };
}

interface ActivityEvent {
  id: string;
  at: string;
  kind: "activity";
  activity: {
    event_type: string;
    summary: string;
    metadata: Record<string, unknown> | null;
  };
}

type TimelineEvent = EmailEvent | ActivityEvent;

interface TimelineResponse {
  events: TimelineEvent[];
  totalEmails: number;
  totalActivity: number;
  idVariants: string[];
  businessProfileId: string | null;
}

function when(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const stamp = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days === 0) {
    const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  }
  if (days < 30) return `${days}d ago`;
  return d.getFullYear() !== new Date().getFullYear() ? `${stamp}, ${d.getFullYear()}` : stamp;
}

export default function ProviderCommsTimeline({
  providerId,
  limit = 50,
  viewAllEmailsHref,
}: {
  providerId: string;
  limit?: number;
  viewAllEmailsHref?: string;
}) {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | "loading" | "none" | null>(null);

  useEffect(() => {
    if (!providerId) {
      setData({ events: [], totalEmails: 0, totalActivity: 0, idVariants: [], businessProfileId: null });
      return;
    }
    let cancelled = false;
    fetch(`/api/admin/directory/${providerId}/comms-timeline?limit=${limit}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: TimelineResponse) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load timeline"); });
    return () => { cancelled = true; };
  }, [providerId, limit]);

  async function togglePreview(logId: string) {
    if (openId === logId) { setOpenId(null); return; }
    setOpenId(logId);
    setPreviewHtml("loading");
    try {
      const r = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId }),
      });
      const d = await r.json();
      setPreviewHtml(d?.email?.html_body ? d.email.html_body : "none");
    } catch {
      setPreviewHtml("none");
    }
  }

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (data === null) return <p className="text-sm text-gray-400">Loading…</p>;
  if (data.events.length === 0) {
    return <p className="text-sm text-gray-400">No emails or recorded activity yet.</p>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium w-8" />
              <th className="px-3 py-2 text-left font-medium w-28">When</th>
              <th className="px-3 py-2 text-left font-medium">What</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.events.map((e) => (
              e.kind === "email"
                ? <EmailRow key={e.id} event={e} open={openId === e.email.log_id} previewHtml={previewHtml} onToggle={() => togglePreview(e.email.log_id)} />
                : <ActivityRow key={e.id} event={e} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>
          {data.events.length} of {data.totalEmails + data.totalActivity} events ({data.totalEmails} emails, {data.totalActivity} activity)
          {data.idVariants.length > 1 && (
            <span className="ml-2 text-gray-300" title={`Matched against IDs: ${data.idVariants.join(", ")}`}>
              · {data.idVariants.length} ID variants
            </span>
          )}
        </span>
        {viewAllEmailsHref && (
          <a href={viewAllEmailsHref} className="text-teal-700 hover:underline">View all emails →</a>
        )}
      </div>
    </div>
  );
}

function EmailRow({
  event,
  open,
  previewHtml,
  onToggle,
}: {
  event: EmailEvent;
  open: boolean;
  previewHtml: string | "loading" | "none" | null;
  onToggle: () => void;
}) {
  const e = event.email;
  return (
    <Fragment>
      <tr className={`transition-colors hover:bg-gray-50 ${open ? "bg-gray-50" : ""}`}>
        <td className="px-3 py-2 text-center" title="Automated email">
          <span className="inline-block text-[14px]" aria-hidden="true">📧</span>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-gray-500" title={new Date(event.at).toLocaleString()}>{when(event.at)}</td>
        <td className="max-w-[28rem] truncate px-3 py-2 text-gray-800" title={e.subject}>
          <code className="mr-2 text-[11px] text-gray-400">{e.email_type}</code>
          {e.subject}
          {e.error_message && <span className="text-red-600"> — {e.error_message}</span>}
        </td>
        <td className="whitespace-nowrap px-3 py-2">
          <EmailStatusPill
            status={e.status}
            sentAt={event.at}
            delivered_at={e.delivered_at}
            first_opened_at={e.first_opened_at}
            first_clicked_at={e.first_clicked_at}
            bounced_at={e.bounced_at}
            complained_at={e.complained_at}
          />
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-right">
          <button onClick={onToggle} className="text-xs text-teal-700 hover:underline">{open ? "hide" : "preview"}</button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-3 pb-3">
            {previewHtml === "loading" && <div className="py-3 text-sm text-gray-400">Loading preview…</div>}
            {previewHtml === "none" && <div className="py-3 text-sm text-gray-400">No rendered body stored for this email.</div>}
            {typeof previewHtml === "string" && previewHtml !== "loading" && previewHtml !== "none" && (
              <iframe srcDoc={previewHtml} title="Email preview" className="h-[440px] w-full rounded-lg border border-gray-200 bg-white" sandbox="" />
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function ActivityRow({ event }: { event: ActivityEvent }) {
  const a = event.activity;
  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-3 py-2 text-center" title="On-site activity event">
        <span className="inline-block text-[14px]" aria-hidden="true">⚡</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-gray-500" title={new Date(event.at).toLocaleString()}>{when(event.at)}</td>
      <td className="px-3 py-2 text-gray-700" colSpan={3}>
        <code className="mr-2 text-[11px] text-gray-400">{a.event_type}</code>
        {a.summary}
      </td>
    </tr>
  );
}
