"use client";

import { Fragment, useEffect, useState } from "react";
import EmailStatusPill from "@/components/admin/EmailStatusPill";

/**
 * "Every automated email this person/provider got" — used on the admin
 * provider detail and care-seeker detail pages. Reads /api/admin/emails
 * (filtered by provider_id or exact recipient), newest first. Status comes
 * from the Resend webhook denorm columns via the shared <EmailStatusPill>.
 * Click a row to expand the rendered email (html_body) in a sandboxed iframe.
 */

interface EmailRow {
  id: string;
  recipient: string;
  subject: string;
  email_type: string;
  status: string;
  error_message: string | null;
  created_at: string;
  delivered_at: string | null;
  first_opened_at: string | null;
  first_clicked_at: string | null;
  bounced_at: string | null;
  complained_at: string | null;
  last_event_type: string | null;
}

function when(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  const stamp = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days === 0) return `Today · ${stamp}`;
  if (days < 30) return `${days}d ago · ${stamp}`;
  return d.getFullYear() !== new Date().getFullYear() ? `${stamp}, ${d.getFullYear()}` : stamp;
}

export default function EmailTimeline({
  providerId,
  recipient,
  limit = 25,
  viewAllHref,
}: {
  providerId?: string;
  recipient?: string;
  limit?: number;
  viewAllHref?: string;
}) {
  const [rows, setRows] = useState<EmailRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | "loading" | "none" | null>(null);

  useEffect(() => {
    if (!providerId && !recipient) { setRows([]); return; }
    const params = new URLSearchParams();
    if (providerId) params.set("provider_id", providerId);
    if (recipient) params.set("recipient", recipient);
    params.set("limit", String(limit));
    let cancelled = false;
    fetch(`/api/admin/emails?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => { if (!cancelled) { setRows(d.emails ?? []); setTotal(d.total ?? 0); } })
      .catch((e) => { if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load emails"); });
    return () => { cancelled = true; };
  }, [providerId, recipient, limit]);

  async function togglePreview(id: string) {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    setPreviewHtml("loading");
    try {
      const r = await fetch("/api/admin/emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const d = await r.json();
      setPreviewHtml(d?.email?.html_body ? d.email.html_body : "none");
    } catch {
      setPreviewHtml("none");
    }
  }

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (rows === null) return <p className="text-sm text-gray-400">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-gray-400">No automated emails sent yet.</p>;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 text-xs text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">When</th>
              <th className="px-3 py-2 text-left font-medium">Type</th>
              <th className="px-3 py-2 text-left font-medium">Subject</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((e) => {
              const open = openId === e.id;
              return (
                <Fragment key={e.id}>
                  <tr className={`transition-colors hover:bg-gray-50 ${open ? "bg-gray-50" : ""}`}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-500" title={new Date(e.created_at).toLocaleString()}>{when(e.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2"><code className="text-xs text-gray-500">{e.email_type}</code></td>
                    <td className="max-w-[26rem] truncate px-3 py-2 text-gray-800" title={e.subject}>{e.subject}{e.error_message ? <span className="text-red-600"> — {e.error_message}</span> : null}</td>
                    <td className="whitespace-nowrap px-3 py-2"><EmailStatusPill status={e.status} sentAt={e.created_at} delivered_at={e.delivered_at} first_opened_at={e.first_opened_at} first_clicked_at={e.first_clicked_at} bounced_at={e.bounced_at} complained_at={e.complained_at} /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      <button onClick={() => togglePreview(e.id)} className="text-xs text-teal-700 hover:underline">{open ? "hide" : "preview"}</button>
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
            })}
          </tbody>
        </table>
      </div>
      {(viewAllHref || total > rows.length) && (
        <div className="mt-2 text-xs text-gray-400">
          Showing {rows.length} of {total}.{" "}
          {viewAllHref && <a href={viewAllHref} className="text-teal-700 hover:underline">View all in Email Log →</a>}
        </div>
      )}
    </div>
  );
}
