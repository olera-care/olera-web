"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  type CampaignRequest,
  type CampaignLead,
  STATUSES,
  CHANNELS,
  StatusBadge,
  utmUrl,
  fmtTimestamp,
  fmtDateOnly,
} from "@/components/admin/AdBoostShared";

export default function AdBoostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [request, setRequest] = useState<CampaignRequest | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
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
      setLeads((json.leads as CampaignLead[]) ?? []);
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

      {request && (
        <Detail
          request={request}
          leads={leads}
          onChanged={load}
          onDeleted={() => router.push("/admin/ad-boost")}
        />
      )}
    </div>
  );
}

function Detail({
  request,
  leads,
  onChanged,
  onDeleted,
}: {
  request: CampaignRequest;
  leads: CampaignLead[];
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

  // Manual performance entry — dollars / clicks as strings for the inputs.
  const [spend, setSpend] = useState(
    request.ad_spend_cents != null ? (request.ad_spend_cents / 100).toString() : "",
  );
  const [clicks, setClicks] = useState(
    request.ad_clicks != null ? request.ad_clicks.toString() : "",
  );
  const [savingPerf, setSavingPerf] = useState(false);

  const isArchived = !!request.deleted_at;
  const name = request.display_name || request.provider_slug || request.provider_id;
  const url = utmUrl(request.provider_slug, tag, request.id);

  const delivered = request.delivered ?? 0;
  const spendNum = spend.trim() === "" ? null : Number(spend);
  const clicksNum = clicks.trim() === "" ? null : Number(clicks);
  const costPerFamily =
    spendNum != null && spendNum > 0 && delivered > 0 ? spendNum / delivered : null;
  const perfDirty =
    (request.ad_spend_cents != null ? request.ad_spend_cents / 100 : null) !== spendNum ||
    (request.ad_clicks ?? null) !== clicksNum;

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

  const savePerf = async () => {
    if (spendNum != null && (Number.isNaN(spendNum) || spendNum < 0)) {
      setMsg("Spend must be a non-negative number");
      return;
    }
    if (clicksNum != null && (!Number.isInteger(clicksNum) || clicksNum < 0)) {
      setMsg("Clicks must be a non-negative whole number");
      return;
    }
    setSavingPerf(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: request.id,
          ad_spend_cents: spendNum != null ? Math.round(spendNum * 100) : null,
          ad_clicks: clicksNum,
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
      setSavingPerf(false);
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
        {/* Into the admin provider record (public-page preview + comms history +
            their Olera history), not the bare public page. The directory route
            accepts the business_profiles UUID we store as provider_id. */}
        <Link
          href={`/admin/directory/${request.provider_id}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          View provider record ↗
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
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Performance</h2>

        {/* Three at-a-glance stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Stat value={String(delivered)} label="Families delivered" accent />
          <Stat value={clicksNum != null ? clicksNum.toLocaleString() : "—"} label="Clicks" />
          <Stat
            value={costPerFamily != null ? `$${costPerFamily.toFixed(0)}` : "—"}
            label="Cost / family"
          />
        </div>

        {/* Manual entry — spend + clicks from the ad dashboards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Ad spend ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            />
          </label>
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Clicks</span>
            <input
              type="number"
              min="0"
              step="1"
              value={clicks}
              onChange={(e) => setClicks(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            />
          </label>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled={!perfDirty || savingPerf}
            onClick={savePerf}
            className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {savingPerf ? "Saving…" : "Save metrics"}
          </button>
          <span className="text-xs text-gray-400">
            Enter spend &amp; clicks from the Google/Meta dashboards. Cost per family is
            computed against delivered families.
          </span>
        </div>
      </section>

      {/* Leads — the families behind the delivered count (no PHI) */}
      <section className="rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Leads{leads.length > 0 ? ` (${leads.length})` : ""}
        </h2>
        {leads.length === 0 ? (
          <p className="text-xs text-gray-400">
            No families delivered yet. Once the campaign is live and a family completes an
            intake from one of its ads, they&apos;ll show here.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {leads.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-gray-700">
                  {l.careNeed ?? "Care inquiry"}
                  {l.state ? ` · ${l.state}` : ""}
                </span>
                <span className="text-gray-400 text-xs shrink-0">
                  {fmtDateOnly(l.created_at.slice(0, 10))}
                  {l.entrySource ? ` · ${l.entrySource}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
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

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2.5">
      <div className={`text-xl font-semibold ${accent ? "text-primary-700" : "text-gray-900"}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
