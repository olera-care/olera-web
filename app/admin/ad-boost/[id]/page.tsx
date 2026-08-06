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
import { etInputToUtcIso, toEtInputValue, formatEt } from "@/lib/eastern-time";

/** The exact numbers the provider sees on their own /provider/boost live view
 *  (mirrored here for admin parity). Real visitors + leads on their page since
 *  launch — same shape the boost-state API returns. */
type ProviderViewStats = {
  visitors: number;
  leads: number;
  questions?: { received: number; unanswered: number };
  since: string;
};

/** Rollup half of the campaign receipt (mirrors CampaignReceiptData). */
type ReceiptRollup = {
  google: {
    impressions: number | null;
    clicks: number | null;
    spendCents: number | null;
    ctr: number | null;
    cpcCents: number | null;
  };
  engagement: { visitors: number; saves: number; questionsReceived: number };
  outcomes: { client: number; talking: number; no: number; unanswered: number };
  expectedLeads: number | null;
};

export default function AdBoostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [request, setRequest] = useState<CampaignRequest | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [campaignStats, setCampaignStats] = useState<ProviderViewStats | null>(null);
  const [receipt, setReceipt] = useState<ReceiptRollup | null>(null);
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
      setCampaignStats((json.campaignStats as ProviderViewStats | null) ?? null);
      setReceipt((json.receipt as ReceiptRollup | null) ?? null);
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
          campaignStats={campaignStats}
          receipt={receipt}
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
  campaignStats,
  receipt,
  onChanged,
  onDeleted,
}: {
  request: CampaignRequest;
  leads: CampaignLead[];
  campaignStats: ProviderViewStats | null;
  receipt: ReceiptRollup | null;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [status, setStatus] = useState(request.status);
  const [channel, setChannel] = useState(request.channel ?? "");
  const [setupWeek, setSetupWeek] = useState(request.requested_setup_week);
  const [flightEnd, setFlightEnd] = useState(request.flight_end_date ?? "");
  const [tag, setTag] = useState(request.campaign_tag ?? "");
  const [note, setNote] = useState(request.admin_note ?? "");
  // Launch-email schedule: datetime-local as US EASTERN wall-clock (TJ
  // schedules from anywhere in the world — see lib/eastern-time.ts).
  const storedLaunchEmailAt = request.launched_email_scheduled_at
    ? toEtInputValue(new Date(request.launched_email_scheduled_at))
    : "";
  const [launchEmailAt, setLaunchEmailAt] = useState(storedLaunchEmailAt);
  // Wrap-up schedule. Unlike the launch email this is normally filled in for
  // you: flipping to `ended` (by hand or by the cron) parks it at the next
  // 10:15 AM ET business morning. Editing it re-times the send; clearing it
  // cancels the send without un-ending the campaign.
  const storedWrapUpAt = request.promo_complete_email_scheduled_at
    ? toEtInputValue(new Date(request.promo_complete_email_scheduled_at))
    : "";
  const [wrapUpAt, setWrapUpAt] = useState(storedWrapUpAt);
  // The SERVER picks this slot on the flip to `ended` — unlike every other
  // field here, it can change without the operator typing anything, and this
  // component is re-rendered (not remounted) after a save, so the useState
  // initializer above never sees it. Re-sync on change, React's adjust-state-
  // during-render pattern. Without this the input sits blank next to a
  // "Scheduled for…" banner and the very next save posts null, silently
  // cancelling the wrap-up.
  const [wrapUpBaseline, setWrapUpBaseline] = useState(storedWrapUpAt);
  if (wrapUpBaseline !== storedWrapUpAt) {
    setWrapUpBaseline(storedWrapUpAt);
    setWrapUpAt(storedWrapUpAt);
  }
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
  const [impressions, setImpressions] = useState(
    request.ad_impressions != null ? request.ad_impressions.toString() : "",
  );
  const [savingPerf, setSavingPerf] = useState(false);

  const isArchived = !!request.deleted_at;
  const name = request.display_name || request.provider_slug || request.provider_id;
  const url = utmUrl(request.provider_slug, tag, request.id);

  const delivered = request.delivered ?? 0;
  const spendNum = spend.trim() === "" ? null : Number(spend);
  const clicksNum = clicks.trim() === "" ? null : Number(clicks);
  const impressionsNum = impressions.trim() === "" ? null : Number(impressions);
  const costPerFamily =
    spendNum != null && spendNum > 0 && delivered > 0 ? spendNum / delivered : null;
  const perfDirty =
    (request.ad_spend_cents != null ? request.ad_spend_cents / 100 : null) !== spendNum ||
    (request.ad_clicks ?? null) !== clicksNum ||
    (request.ad_impressions ?? null) !== impressionsNum;

  // The schedule field only participates in dirty/save while its block is
  // shown (live + email unsent) — otherwise a time typed before switching
  // status away would silently ride along on an unrelated save.
  const launchEmailEditable = !request.launched_email_sent_at && status === "live";
  const launchEmailDirty = launchEmailEditable && launchEmailAt !== storedLaunchEmailAt;

  // Only editable once the campaign is ALREADY ended — while the flip is still
  // unsaved there's no schedule yet to re-time, and the server picks the slot.
  const wrapUpEditable =
    !request.promo_complete_email_sent_at &&
    request.status === "ended" &&
    status === "ended";
  const wrapUpDirty = wrapUpEditable && wrapUpAt !== storedWrapUpAt;

  const dirty =
    status !== request.status ||
    channel !== (request.channel ?? "") ||
    setupWeek !== request.requested_setup_week ||
    flightEnd !== (request.flight_end_date ?? "") ||
    tag !== (request.campaign_tag ?? "") ||
    note !== (request.admin_note ?? "") ||
    launchEmailDirty ||
    wrapUpDirty;

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
          flight_end_date: flightEnd || null,
          campaign_tag: tag || null,
          admin_note: note || null,
          // Only when touched: re-sending a stored time would trip the
          // route's not-in-the-past validation between due time and the
          // hourly cron fire.
          ...(launchEmailDirty
            ? {
                launched_email_scheduled_at: launchEmailAt
                  ? etInputToUtcIso(launchEmailAt)
                  : null,
              }
            : {}),
          ...(wrapUpDirty
            ? {
                promo_complete_email_scheduled_at: wrapUpAt
                  ? etInputToUtcIso(wrapUpAt)
                  : null,
              }
            : {}),
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
    if (impressionsNum != null && (!Number.isInteger(impressionsNum) || impressionsNum < 0)) {
      setMsg("Impressions must be a non-negative whole number");
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
          ad_impressions: impressionsNum,
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

  const sendLaunchNow = async () => {
    if (!window.confirm(`Email ${name} that their campaign is live, right now?`)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, send_launch_email: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Send failed");
      }
      setLaunchEmailAt("");
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  const sendWrapUpNow = async () => {
    if (
      !window.confirm(
        `Send ${name} their campaign wrap-up (results + subscribe ask) right now, instead of the scheduled morning?`,
      )
    )
      return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/ad-boost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, send_promo_complete_email: true }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Send failed");
      }
      setWrapUpAt("");
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
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
            {request.intended_monthly_budget != null && (
              <> · intended budget ${request.intended_monthly_budget}/mo (confirm before spend)</>
            )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Flight end (from ad platform)</span>
            <input
              type="date"
              value={flightEnd}
              onChange={(e) => setFlightEnd(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Last serving day. The campaign auto-ends the morning after, and the wrap-up
              email schedules itself. Leave blank and it never auto-ends.
            </span>
          </label>
        </div>

        {/* Launch email timing: shown while the "campaign is live" provider
            email hasn't gone out. Empty = it fires the moment the live status
            is saved (today's behavior); a time (US Eastern wall-clock, so the
            flip can happen from any timezone) hands the send to the hourly
            ad-boost-launch-scheduler cron instead. */}
        {launchEmailEditable && (
          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 px-3 py-2.5">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Launch email to provider
            </span>
            {request.launched_email_scheduled_at && (
              <p className="text-xs text-blue-700 mb-2">
                ⏱ Scheduled for {formatEt(request.launched_email_scheduled_at)}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={launchEmailAt}
                min={toEtInputValue(new Date(Date.now() + 5 * 60 * 1000))}
                onChange={(e) => setLaunchEmailAt(e.target.value)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white text-sm"
              />
              <span className="text-xs font-medium text-gray-500">US Eastern</span>
              {launchEmailAt && (
                <button
                  type="button"
                  onClick={() => setLaunchEmailAt("")}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
              {request.status === "live" && (
                <button
                  type="button"
                  disabled={busy || saving}
                  onClick={sendLaunchNow}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Send now
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Time is US Eastern, wherever you are. Empty means the email goes out the
              moment you save the live status; with a time set, it sends within an hour
              of that time instead. Save changes to apply.
            </p>
          </div>
        )}

        {/* Wrap-up email timing. Shown once the campaign is ended and the
            promo-complete email hasn't gone out. The slot is picked for you on
            the flip (next 10:15 AM ET business morning) — this is where you
            re-time it, cancel it, or override it and send now. */}
        {/* What the provider told us about the whole flight, one-tap from the
            zero-lead wrap-up. The only signal we have when a family called
            their office instead of coming through Olera — so an attributed
            count of 0 next to "became a client" here is the Franchil case
            caught rather than missed. */}
        {request.provider_reported_outcome && (
          <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Provider reported on this flight
            </span>
            <p className="text-sm text-gray-800">
              {request.provider_reported_outcome === "client"
                ? "✅ A family reached them directly and became a client"
                : request.provider_reported_outcome === "talking"
                  ? "💬 A family reached them directly, still talking"
                  : "➖ Nobody reached them directly"}
              {request.provider_reported_outcome_at && (
                <span className="text-gray-500">
                  {" · "}
                  {formatEt(request.provider_reported_outcome_at)}
                </span>
              )}
            </p>
            {request.provider_reported_outcome !== "no" && (delivered ?? 0) === 0 && (
              <p className="mt-1 text-xs text-emerald-800">
                Attributed leads read 0 for this campaign. This answer is the only record that it
                worked. Worth a call before quoting its numbers anywhere.
              </p>
            )}
          </div>
        )}

        {wrapUpEditable && (
          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2.5">
            <span className="block text-sm font-medium text-gray-700 mb-1.5">
              Wrap-up email to provider
            </span>
            <p className="text-xs text-amber-800 mb-2">
              {request.promo_complete_email_scheduled_at ? (
                <>⏱ Scheduled for {formatEt(request.promo_complete_email_scheduled_at)}</>
              ) : (
                <>⚠️ No send scheduled — this provider won&apos;t get their results or the
                  subscribe ask unless you set a time or send now.</>
              )}
              {request.ended_reason === "flight_end" && request.ended_at && (
                <> · auto-ended {formatEt(request.ended_at)}</>
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={wrapUpAt}
                min={toEtInputValue(new Date(Date.now() + 5 * 60 * 1000))}
                onChange={(e) => setWrapUpAt(e.target.value)}
                className="rounded-lg border border-gray-200 px-2.5 py-1.5 bg-white text-sm"
              />
              <span className="text-xs font-medium text-gray-500">US Eastern</span>
              {wrapUpAt && (
                <button
                  type="button"
                  onClick={() => setWrapUpAt("")}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 underline"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                disabled={busy || saving}
                onClick={sendWrapUpNow}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Send now
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              Results summary plus the subscribe pitch. Ending a campaign schedules this
              for the next 10:15 AM ET weekday rather than sending at the hour the flight
              closed. Clearing the time cancels the send. Save changes to apply.
            </p>
          </div>
        )}

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

      {/* Paid plan (Phase 2) — read-only Stripe state. Activation/status come
          from the webhook; the operator manages billing itself (credits, the
          zero-inquiry guarantee, cancellation) in the Stripe dashboard. */}
      <section className="rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Paid plan</h2>
        {request.plan_status ? (
          <>
            <p className="text-sm text-gray-700">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium mr-2 ${
                  request.plan_status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : request.plan_status === "past_due"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {request.plan_status}
              </span>
              {request.plan_value != null && <>${request.plan_value}/mo, all-in</>}
              {request.subscribed_at && (
                <span className="text-gray-400"> · since {fmtTimestamp(request.subscribed_at)}</span>
              )}
            </p>
            {request.stripe_subscription_id && (
              <a
                href={`https://dashboard.stripe.com/subscriptions/${request.stripe_subscription_id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline"
              >
                Manage in Stripe (credits, guarantee, cancel) ↗
              </a>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">
            No plan yet. The wrap-up ask shows on the provider&apos;s boost page after
            their 3rd lead, or once the promo-complete email is sent. Payment runs
            through Stripe Checkout; this panel fills in via webhook.
          </p>
        )}
      </section>

      {/* What the provider sees — exact parity with their /provider/boost live
          view. Same visitors/leads/conversion numbers Hilda sees signed in, so
          the admin queue mirrors the provider's experience. */}
      <section className="rounded-xl border border-primary-100 bg-primary-50/40 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">What the provider sees</h2>
        <p className="text-xs text-gray-500 mb-4">
          Identical to their signed-in <span className="font-medium">/provider/boost</span> view.
        </p>
        {request.status !== "live" && request.status !== "ended" ? (
          <p className="text-xs text-gray-400">
            The provider sees these once the campaign status is <span className="font-medium">live</span>.
          </p>
        ) : campaignStats ? (
          <>
            {/* Funnel order + equal weight, mirroring CampaignPerformance:
                clicks and questions are first-class results because leads are
                zero for most $50 flights by arithmetic. */}
            <div className="grid grid-cols-3 gap-3">
              <Stat value={campaignStats.visitors.toLocaleString()} label="Visitors" />
              <Stat
                value={(campaignStats.questions?.received ?? 0).toLocaleString()}
                label="Questions"
              />
              <Stat value={campaignStats.leads.toLocaleString()} label="Leads" accent />
            </div>
            {receipt && (
              <p className="mt-3 text-xs text-gray-500">
                Receipt rollup: {receipt.google.impressions != null ? `${receipt.google.impressions.toLocaleString()} ad views · ` : ""}
                {receipt.engagement.saves} save{receipt.engagement.saves === 1 ? "" : "s"} ·{" "}
                {receipt.outcomes.client} client{receipt.outcomes.client === 1 ? "" : "s"} reported ·{" "}
                {receipt.outcomes.talking} still talking ·{" "}
                {receipt.outcomes.unanswered} unanswered
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-gray-400">No data yet.</p>
        )}
      </section>

      {/* Performance (admin-only: manual spend + cost-per analysis) */}
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

        {/* Manual entry — spend + clicks + impressions from the ad dashboards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          <label className="text-sm">
            <span className="block text-gray-500 mb-1">Impressions</span>
            <input
              type="number"
              min="0"
              step="1"
              value={impressions}
              onChange={(e) => setImpressions(e.target.value)}
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
            Enter spend, clicks &amp; impressions from the Google/Meta dashboards.
            Impressions top the provider&apos;s demand receipt; cost per family is
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
                <span className="flex min-w-0 items-center gap-2 text-gray-700">
                  <span className="truncate">
                    {l.careNeed ?? "Care inquiry"}
                    {l.state ? ` · ${l.state}` : ""}
                  </span>
                  {/* Provider one-tap outcome self-report (7d/21d pings). */}
                  {l.outcome === "client" && (
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      client
                    </span>
                  )}
                  {l.outcome === "talking" && (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      still talking
                    </span>
                  )}
                  {l.outcome === "no" && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                      didn&apos;t work out
                    </span>
                  )}
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
