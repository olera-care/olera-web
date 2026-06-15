"use client";

import { useEffect, useState, useCallback } from "react";

interface CampaignRequest {
  id: string;
  provider_id: string;
  provider_slug: string | null;
  display_name: string | null;
  requested_setup_week: string;
  completeness_at_submit: number | null;
  status: string;
  channel: string | null;
  campaign_tag: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  /** Families delivered so far (benefits_completed events tagged to this campaign). */
  delivered?: number;
}

const STATUSES = ["pending_profile", "requested", "scheduled", "live", "ended", "cancelled"];
const CHANNELS = ["", "google", "meta", "both"];

/** Build the canonical managed-ads landing URL with UTM attribution params. */
function utmUrl(slug: string | null, tag: string | null, id: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://olera.care";
  const campaign = tag || id;
  return `${origin}/provider/${slug ?? ""}?utm_source=olera_managed&utm_campaign=${campaign}`;
}

export default function AdminAdBoostPage() {
  const [requests, setRequests] = useState<CampaignRequest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/ad-boost");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load");
      }
      const json = await res.json();
      setRequests(json.requests as CampaignRequest[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Ad Boost — concierge queue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Managed-ad campaign requests from providers. Work each through the status
          lifecycle and copy the UTM landing URL into the ad platform.
        </p>
      </header>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {!requests && !error && <p className="text-gray-400 text-sm">Loading…</p>}
      {requests && requests.length === 0 && (
        <p className="text-gray-400 text-sm">No campaign requests yet.</p>
      )}

      <div className="space-y-3">
        {requests?.map((r) => (
          // Key on updated_at so a saved row remounts with fresh server state
          // (e.g. the go-live auto-set of campaign_tag) instead of keeping stale
          // local edit state.
          <RequestRow key={`${r.id}-${r.updated_at}`} request={r} onSaved={load} />
        ))}
      </div>
    </div>
  );
}

function RequestRow({
  request,
  onSaved,
}: {
  request: CampaignRequest;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(request.status);
  const [channel, setChannel] = useState(request.channel ?? "");
  const [tag, setTag] = useState(request.campaign_tag ?? "");
  const [note, setNote] = useState(request.admin_note ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty =
    status !== request.status ||
    channel !== (request.channel ?? "") ||
    tag !== (request.campaign_tag ?? "") ||
    note !== (request.admin_note ?? "");

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          status,
          channel: channel || null,
          campaign_tag: tag || null,
          admin_note: note || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Save failed");
      }
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const name = request.display_name || request.provider_slug || request.provider_id;
    if (!window.confirm(`Delete the boost request for ${name}? This removes it from the queue and can't be undone. (Delivered-family data is kept.)`)) {
      return;
    }
    setDeleting(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/ad-boost?id=${encodeURIComponent(request.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Delete failed");
      }
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  const url = utmUrl(request.provider_slug, tag, request.id);
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
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <a
            href={`/provider/${request.provider_slug ?? ""}`}
            className="font-medium text-gray-900 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {request.display_name || request.provider_slug || request.provider_id}
          </a>
          <p className="text-xs text-gray-400 mt-0.5">
            {request.completeness_at_submit ?? "—"}% complete at submit · setup week{" "}
            {request.requested_setup_week} · requested{" "}
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {(request.status === "live" ||
            request.status === "ended" ||
            (request.delivered ?? 0) > 0) && (
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
              {request.delivered ?? 0} delivered
            </span>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <label className="text-sm">
          <span className="block text-gray-500 mb-1">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5"
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
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c || "—"}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-500 mb-1">Campaign tag (utm_campaign)</span>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={request.id}
            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5"
          />
        </label>
      </div>

      <label className="block text-sm mt-3">
        <span className="block text-gray-500 mb-1">Note</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5"
        />
      </label>

      {/* UTM landing URL — paste into Google/Meta as the ad destination */}
      <div className="mt-3 flex items-center gap-2">
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

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saving || deleting}
          onClick={save}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        <button
          type="button"
          disabled={saving || deleting}
          onClick={remove}
          className="rounded-lg border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 ml-auto"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    // Queued under 70% — not yet actionable; auto-promotes to `requested` when
    // the provider crosses the threshold. Muted so the queue reads at a glance.
    pending_profile: "bg-orange-50 text-orange-600",
    requested: "bg-amber-50 text-amber-700",
    scheduled: "bg-blue-50 text-blue-700",
    live: "bg-green-50 text-green-700",
    ended: "bg-gray-100 text-gray-500",
    cancelled: "bg-gray-100 text-gray-400",
  };
  const label = status === "pending_profile" ? "queued · profile" : status;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone[status] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}
