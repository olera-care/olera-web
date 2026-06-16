"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  type CampaignRequest,
  STATUSES,
  CHANNELS,
  StatusBadge,
  utmUrl,
  fmtTimestamp,
} from "@/components/admin/AdBoostShared";

export default function AdBoostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [request, setRequest] = useState<CampaignRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/ad-boost?id=${encodeURIComponent(id)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load");
      }
      const json = await res.json();
      setRequest(json.request as CampaignRequest);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/admin/ad-boost"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
        Back to queue
      </Link>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!request && !error && <p className="text-gray-400 text-sm">Loading…</p>}

      {request && <Detail request={request} onChanged={load} onDeleted={() => router.push("/admin/ad-boost")} />}
    </div>
  );
}

function Detail({
  request,
  onChanged,
  onDeleted,
}: {
  request: CampaignRequest;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [status, setStatus] = useState(request.status);
  const [channel, setChannel] = useState(request.channel ?? "");
  const [setupWeek, setSetupWeek] = useState(request.requested_setup_week);
  const [tag, setTag] = useState(request.campaign_tag ?? "");
  const [note, setNote] = useState(request.admin_note ?? "");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isArchived = !!request.deleted_at;
  const name = request.display_name || request.provider_slug || request.provider_id;
  const url = utmUrl(request.provider_slug, tag, request.id);

  const dirty =
    status !== request.status ||
    channel !== (request.channel ?? "") ||
    setupWeek !== request.requested_setup_week ||
    tag !== (request.campaign_tag ?? "") ||
    note !== (request.admin_note ?? "");

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status,
          channel: channel || null,
          requested_setup_week: setupWeek,
          campaign_tag: tag || null,
          admin_note: note || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setArchived = async (archived: boolean) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, archived }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Action failed");
      }
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Permanently delete the Ad Boost request for ${name}? This removes the record for good and can't be undone.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/ad-boost?id=${encodeURIComponent(request.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Delete failed");
      }
      onDeleted();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the URL is shown inline to copy manually */
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold text-gray-900 truncate">{name}</h1>
            <StatusBadge status={request.status} />
            {isArchived && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                archived
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {request.completeness_at_submit ?? "—"}% complete at submit · requested{" "}
            {fmtTimestamp(request.created_at)}
          </p>
        </div>
        <Link
          href={`/provider/${request.provider_slug ?? ""}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View public page ↗
        </Link>
      </div>

      {/* Campaign setup */}
      <section className="rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Campaign setup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Channel</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c || "—"}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Setup week</span>
            <input
              type="date"
              value={setupWeek}
              onChange={(e) => setSetupWeek(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            />
          </label>
        </div>

        <label className="block text-sm mt-3">
          <span className="block text-gray-500 mb-1">Campaign tag (utm_campaign)</span>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={request.id}
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
          />
        </label>

        <label className="block text-sm mt-3">
          <span className="block text-gray-500 mb-1">Note</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white resize-y"
          />
        </label>

        {/* UTM landing URL */}
        <div className="mt-4">
          <span className="block text-gray-500 text-sm mb-1">UTM landing URL (paste into the ad)</span>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-1.5 text-xs text-gray-600">
              {url}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={!dirty || saving || busy}
            onClick={save}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {msg && <span className="text-sm text-red-600">{msg}</span>}
        </div>
      </section>

      {/* Performance */}
      <section className="rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Performance</h2>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-primary-700">{request.delivered ?? 0}</span>
          <span className="text-sm text-gray-500">families delivered</span>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Ad-platform metrics (spend, clicks, cost per family — split by Google vs Meta)
          aren&apos;t in our database; they live in the ad dashboards. Coming next: manual
          entry or an ad-platform pull.
        </p>
      </section>

      {/* Leads */}
      <section className="rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Leads</h2>
        <p className="text-xs text-gray-400">
          The families this campaign drove, attributed by utm_campaign. Coming next.
        </p>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Manage</h2>
        <div className="flex items-center gap-2">
          {isArchived ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setArchived(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setArchived(true)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              Archive
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Delete permanently
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Archive hides this from the queue but keeps the record (reversible). Delete
          removes it for good — for scrubbing test runs.
        </p>
      </section>
    </>
  );
}
