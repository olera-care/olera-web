"use client";

import { Fragment, useEffect, useState } from "react";

/**
 * Compact "every email this person/provider got" list — used on the admin
 * provider detail and care-seeker detail pages. Reads /api/admin/emails
 * (filtered by provider_id or exact recipient), newest first, with the
 * post-send lifecycle state from the Resend webhook denormalized columns.
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
  return stamp + (d.getFullYear() !== new Date().getFullYear() ? `, ${d.getFullYear()}` : "");
}

function lifecycle(e: EmailRow): { label: string; cls: string } {
  if (e.complained_at) return { label: "complained", cls: "bg-red-100 text-red-700" };
  if (e.bounced_at) return { label: "bounced", cls: "bg-red-100 text-red-700" };
  if (e.status === "failed") return { label: "failed", cls: "bg-red-100 text-red-700" };
  if (e.first_clicked_at) return { label: "clicked", cls: "bg-emerald-100 text-emerald-700" };
  if (e.first_opened_at) return { label: "opened", cls: "bg-teal-100 text-teal-700" };
  if (e.delivered_at) return { label: "delivered", cls: "bg-gray-100 text-gray-600" };
  return { label: e.status || "sent", cls: "bg-gray-100 text-gray-500" };
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
    if (!providerId && !recipient) {
      setRows([]);
      return;
    }
    const params = new URLSearchParams();
    if (providerId) params.set("provider_id", providerId);
    if (recipient) params.set("recipient", recipient);
    params.set("limit", String(limit));
    let cancelled = false;
    fetch(`/api/admin/emails?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (cancelled) return;
        setRows(d.emails ?? []);
        setTotal(d.total ?? 0);
      })
      .catch((e) => !cancelled && setErr(e instanceof Error ? e.message : "Failed to load emails"));
    return () => {
      cancelled = true;
    };
  }, [providerId, recipient, limit]);

  async function togglePreview(id: string) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setPreviewHtml("loading");
    try {
      const r = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      const html = d?.email?.html_body;
      setPreviewHtml(html ? html : "none");
    } catch {
      setPreviewHtml("none");
    }
  }

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (rows === null) return <p className="text-sm text-gray-400">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-gray-400">No automated emails sent yet.</p>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-500">When</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Type</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Subject</th>
              <th className="text-left px-3 py-2 font-medium text-gray-500">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((e) => {
              const lc = lifecycle(e);
              const open = openId === e.id;
              return (
                <Fragment key={e.id}>
                  <tr className={`hover:bg-gray-50 ${open ? "bg-gray-50" : ""}`}>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500" title={new Date(e.created_at).toLocaleString()}>{when(e.created_at)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><code className="text-xs text-gray-600">{e.email_type}</code></td>
                    <td className="px-3 py-2 text-gray-800 max-w-[28rem] truncate" title={e.subject}>{e.subject}{e.error_message ? <span className="text-red-600"> — {e.error_message}</span> : null}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className={`text-[11px] px-1.5 py-0.5 rounded ${lc.cls}`}>{lc.label}</span></td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <button onClick={() => togglePreview(e.id)} className="text-xs text-teal-700 hover:underline">{open ? "hide" : "preview"}</button>
                    </td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={5} className="px-3 pb-3 bg-gray-50">
                        {previewHtml === "loading" && <div className="text-sm text-gray-400 py-2">Loading preview…</div>}
                        {previewHtml === "none" && <div className="text-sm text-gray-400 py-2">No rendered body stored for this email.</div>}
                        {typeof previewHtml === "string" && previewHtml !== "loading" && previewHtml !== "none" && (
                          <iframe srcDoc={previewHtml} title="Email preview" className="w-full h-[480px] border border-gray-200 rounded-lg bg-white" sandbox="" />
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
