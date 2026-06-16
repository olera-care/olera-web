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
  /** Set when the request has been soft-deleted (archived); null when live. */
  deleted_at: string | null;
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
  const [counts, setCounts] = useState({ active: 0, archived: 0 });
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"active" | "archived">("active");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(
        view === "archived" ? "/api/admin/ad-boost?archived=1" : "/api/admin/ad-boost",
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load");
      }
      const json = await res.json();
      setRequests(json.requests as CampaignRequest[]);
      if (json.counts) setCounts(json.counts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [view]);

  useEffect(() => {
    setRequests(null);
    load();
  }, [load]);

  const tabs = [
    { value: "active" as const, label: "Active", count: counts.active },
    { value: "archived" as const, label: "Archived", count: counts.archived },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-5">
        <h1 className="text-2xl font-semibold text-gray-900">Ad Boost — concierge queue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Managed-ad campaign requests from providers. Work each through the status
          lifecycle and copy the UTM landing URL into the ad platform.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setView(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              view === t.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
            <span className={`text-xs ${view === t.value ? "text-white/70" : "text-gray-400"}`}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Header row */}
        <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_130px_120px_90px_auto] items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-400">
          <span>Provider</span>
          <span>Status</span>
          <span>Setup week</span>
          <span>Delivered</span>
          <span className="text-right pr-1">Actions</span>
        </div>

        {!requests && !error && (
          <p className="text-gray-400 text-sm px-4 py-6">Loading…</p>
        )}
        {requests && requests.length === 0 && (
          <p className="text-gray-400 text-sm px-4 py-6">
            {view === "archived" ? "No archived requests." : "No campaign requests yet."}
          </p>
        )}

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
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(request.status);
  const [channel, setChannel] = useState(request.channel ?? "");
  const [tag, setTag] = useState(request.campaign_tag ?? "");
  const [note, setNote] = useState(request.admin_note ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isArchived = !!request.deleted_at;
  const name = request.display_name || request.provider_slug || request.provider_id;

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

  // Soft delete / restore — flips deleted_at via POST. Reversible.
  const setArchived = async (archived: boolean) => {
    setDeleting(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, archived }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || (archived ? "Archive failed" : "Restore failed"));
      }
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Action failed");
      setDeleting(false);
    }
  };

  // Hard delete — truly removes the row. For scrubbing test runs.
  const remove = async () => {
    if (
      !window.confirm(
        `Permanently delete the Ad Boost request for ${name}? This removes the record for good and can't be undone.`,
      )
    ) {
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

  const busy = saving || deleting;

  return (
    <div className={`border-b border-gray-100 last:border-b-0 ${isArchived ? "bg-gray-50/60" : ""}`}>
      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_130px_120px_90px_auto] sm:items-center gap-2 sm:gap-3 px-4 py-3">
        {/* Provider */}
        <div className="min-w-0">
          <a
            href={`/provider/${request.provider_slug ?? ""}`}
            className="font-medium text-gray-900 hover:underline truncate inline-block max-w-full align-bottom"
            target="_blank"
            rel="noreferrer"
          >
            {name}
          </a>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {request.completeness_at_submit ?? "—"}% complete · requested{" "}
            {new Date(request.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <StatusBadge status={request.status} />
          {isArchived && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              archived
            </span>
          )}
        </div>

        {/* Setup week */}
        <div className="text-sm text-gray-600">{request.requested_setup_week}</div>

        {/* Delivered */}
        <div className="text-sm">
          {(request.delivered ?? 0) > 0 ? (
            <span className="font-medium text-primary-700">{request.delivered}</span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-start sm:justify-end gap-1.5">
          {!isArchived && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {expanded ? "Close" : "Edit"}
            </button>
          )}
          {isArchived ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => setArchived(false)}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-40"
            >
              {deleting ? "…" : "Restore"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setArchived(true)}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
            >
              {deleting ? "…" : "Archive"}
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
            title="Permanently delete this record"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {/* Inline error (when not expanded, so archive/delete failures still surface) */}
      {saveError && !expanded && (
        <p className="px-4 pb-3 -mt-1 text-sm text-red-600">{saveError}</p>
      )}

      {/* Expanded editor */}
      {expanded && !isArchived && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
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
              <span className="block text-gray-500 mb-1">Campaign tag (utm_campaign)</span>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder={request.id}
                className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
              />
            </label>
          </div>

          <label className="block text-sm mt-3">
            <span className="block text-gray-500 mb-1">Note</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            />
          </label>

          {/* UTM landing URL — paste into Google/Meta as the ad destination */}
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-lg bg-white border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600">
              {url}
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white"
            >
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              disabled={!dirty || busy}
              onClick={save}
              className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {saveError && <span className="text-sm text-red-600">{saveError}</span>}
          </div>
        </div>
      )}
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
  const label = status === "pending_profile" ? "queued" : status;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone[status] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}
