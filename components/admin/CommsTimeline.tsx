"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import EmailStatusPill from "@/components/admin/EmailStatusPill";

export interface CommsTimelineEmailEvent {
  id: string;
  at: string;
  kind: "email";
  email: {
    log_id: string;
    email_type: string;
    subject: string;
    channel?: string | null;
    status: string;
    delivered_at: string | null;
    first_opened_at: string | null;
    first_clicked_at: string | null;
    bounced_at: string | null;
    complained_at: string | null;
    error_message: string | null;
  };
}

export interface CommsTimelineActivityEvent {
  id: string;
  at: string;
  kind: "activity";
  activity: {
    event_type: string;
    summary: string;
    metadata: Record<string, unknown> | null;
  };
}

export type CommsTimelineEvent = CommsTimelineEmailEvent | CommsTimelineActivityEvent;

export interface CommsTimelineResponse {
  events: CommsTimelineEvent[];
  totalEmails: number;
  totalActivity: number;
  fetchedEmails: number;
  fetchedActivity: number;
  idVariants?: string[];
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

export default function CommsTimeline({
  endpoint,
  viewAllEmailsHref,
  emptyMessage = "No emails or recorded activity yet.",
  messageLabel = "emails",
  debugSource,
}: {
  endpoint: string;
  viewAllEmailsHref?: string;
  emptyMessage?: string;
  messageLabel?: string;
  debugSource?: { label: string; titlePrefix: string };
}) {
  const [data, setData] = useState<CommsTimelineResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | "loading" | "none" | null>(null);
  const previewRequestRef = useRef(0);

  useEffect(() => {
    if (!endpoint) {
      previewRequestRef.current += 1;
      setData({ events: [], totalEmails: 0, totalActivity: 0, fetchedEmails: 0, fetchedActivity: 0 });
      setErr(null);
      setOpenId(null);
      setPreviewHtml(null);
      return;
    }

    let cancelled = false;
    setData(null);
    setErr(null);
    setOpenId(null);
    setPreviewHtml(null);
    previewRequestRef.current += 1;

    fetch(endpoint)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: CommsTimelineResponse) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load timeline"); });

    return () => { cancelled = true; };
  }, [endpoint]);

  async function togglePreview(logId: string) {
    if (openId === logId) {
      previewRequestRef.current += 1;
      setOpenId(null);
      return;
    }

    const requestId = previewRequestRef.current + 1;
    previewRequestRef.current = requestId;
    setOpenId(logId);
    setPreviewHtml("loading");
    try {
      const r = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: logId }),
      });
      const d = await r.json();
      if (previewRequestRef.current === requestId) {
        setPreviewHtml(d?.email?.html_body ? d.email.html_body : "none");
      }
    } catch {
      if (previewRequestRef.current === requestId) setPreviewHtml("none");
    }
  }

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (data === null) return <p className="text-sm text-gray-400">Loading…</p>;
  if (data.events.length === 0) return <p className="text-sm text-gray-400">{emptyMessage}</p>;

  const variants = data.idVariants ?? [];

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-400">
            <tr>
              <th className="w-8 px-3 py-2 text-left font-medium" />
              <th className="w-28 px-3 py-2 text-left font-medium">When</th>
              <th className="px-3 py-2 text-left font-medium">What</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="w-16 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.events.map((event) => (
              event.kind === "email"
                ? (
                  <EmailRow
                    key={event.id}
                    event={event}
                    open={openId === event.email.log_id}
                    previewHtml={previewHtml}
                    onToggle={() => togglePreview(event.email.log_id)}
                  />
                )
                : <ActivityRow key={event.id} event={event} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          Showing {data.events.length} of {data.totalEmails + data.totalActivity} events ({data.totalEmails} {messageLabel}, {data.totalActivity} activity)
          {debugSource && variants.length > 0 && (
            <span
              className="ml-2 text-gray-300"
              title={`${debugSource.titlePrefix}: ${variants.join(", ")}`}
            >
              · {variants.length} {debugSource.label}{variants.length === 1 ? "" : "s"}
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
  event: CommsTimelineEmailEvent;
  open: boolean;
  previewHtml: string | "loading" | "none" | null;
  onToggle: () => void;
}) {
  const email = event.email;
  return (
    <Fragment>
      <tr className={`transition-colors hover:bg-gray-50 ${open ? "bg-gray-50" : ""}`}>
        <td className="px-3 py-2 text-center" title={email.channel === "sms" ? "SMS" : "Automated email"}>
          <span className="inline-block text-[14px]" aria-hidden="true">{email.channel === "sms" ? "📱" : "📧"}</span>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-gray-500" title={new Date(event.at).toLocaleString()}>{when(event.at)}</td>
        <td className="max-w-[28rem] truncate px-3 py-2 text-gray-800" title={email.subject}>
          <code className="mr-2 text-[11px] text-gray-400">{email.email_type}</code>
          {email.subject}
          {email.error_message && <span className="text-red-600"> — {email.error_message}</span>}
        </td>
        <td className="whitespace-nowrap px-3 py-2">
          <EmailStatusPill
            status={email.status}
            sentAt={event.at}
            delivered_at={email.delivered_at}
            first_opened_at={email.first_opened_at}
            first_clicked_at={email.first_clicked_at}
            bounced_at={email.bounced_at}
            complained_at={email.complained_at}
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

function ActivityRow({ event }: { event: CommsTimelineActivityEvent }) {
  const activity = event.activity;
  return (
    <tr className="transition-colors hover:bg-gray-50">
      <td className="px-3 py-2 text-center" title="On-site activity event">
        <span className="inline-block text-[14px]" aria-hidden="true">⚡</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-gray-500" title={new Date(event.at).toLocaleString()}>{when(event.at)}</td>
      <td className="px-3 py-2 text-gray-700" colSpan={3}>
        <code className="mr-2 text-[11px] text-gray-400">{activity.event_type}</code>
        {activity.summary}
      </td>
    </tr>
  );
}
