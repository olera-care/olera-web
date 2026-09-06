"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

/**
 * /admin/city-ads — Olera-owned city campaigns.
 *
 * Three blocks, scanned top to bottom: campaigns (one row per city x channel x
 * flight, spend and clicks hand-typed, everything else computed), the on-call
 * pool per city (enable = they said YES in writing), and the leads with their
 * offer chains and the buttons that move one.
 */

type Campaign = {
  id: string;
  slug: string;
  city: string;
  state: string;
  ring_label: string | null;
  channel: string;
  campaign_tag: string;
  utm_medium: string;
  platform_campaign_id: string | null;
  flight_start: string | null;
  flight_end: string | null;
  budget_cents: number | null;
  max_cpc_cents: number | null;
  status: string;
  ad_spend_cents: number | null;
  ad_clicks: number | null;
  ad_impressions: number | null;
  metrics_updated_at: string | null;
  admin_note: string | null;
};

type Provider = { id: string; display_name: string | null; city: string | null; state: string | null; phone: string | null; category: string | null; verification_state: string | null } | null;

type PoolRow = { id: string; slug: string; provider_id: string; position: number; care_types: string[]; enabled: boolean; phone_override: string | null; notes: string | null; provider: Provider };

type Offer = {
  id: string;
  lead_id: string;
  provider_id: string;
  position: number;
  offered_at: string;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  expired_at: string | null;
  provider: Provider;
};

type Lead = {
  id: string;
  slug: string;
  utm_medium: string | null;
  utm_campaign: string | null;
  care_recipient: string | null;
  care_type: string;
  urgency: string | null;
  zip: string | null;
  first_name: string;
  phone: string;
  email: string | null;
  note: string | null;
  payment_type: string | null;
  status: string;
  accepted_offer_id: string | null;
  offer_count: number;
  next_offer_at: string | null;
  reached_at: string | null;
  outcome: string | null;
  admin_note: string | null;
  created_at: string;
  offers: Offer[];
};

const STATUS_CLS: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  offered: "bg-primary-100 text-primary-800",
  accepted: "bg-success-50 text-success-700",
  contacted: "bg-success-100 text-success-800",
  client: "bg-success-600 text-white",
  no_fit: "bg-gray-200 text-gray-700",
  unreachable: "bg-warning-50 text-warning-700",
  unfilled: "bg-error-50 text-error-700",
  redirected: "bg-gray-100 text-gray-500",
  stopped: "bg-gray-100 text-gray-500",
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-secondary-100 text-secondary-700",
  live: "bg-primary-100 text-primary-800",
  ended: "bg-gray-200 text-gray-600",
};

const CARE: Record<string, string> = { home_care: "Help at home", assisted_living: "Assisted living", unsure: "Not sure", medical: "Medical (redirected)" };
const WHO: Record<string, string> = { parent: "parent", spouse: "spouse", self: "self", other: "someone else" };
const WHEN: Record<string, string> = { this_week: "this week", this_month: "this month", planning: "planning ahead" };

const money = (c: number | null | undefined) => (c === null || c === undefined ? "" : `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`);
const fmt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " ET" : "";
const phoneFmt = (p: string | null | undefined) => {
  const d = (p ?? "").replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p ?? "";
};

export default function CityAdsAdminPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pool, setPool] = useState<PoolRow[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/city-ads", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const d = await res.json();
      setCampaigns(d.campaigns);
      setPool(d.pool);
      setLeads(d.leads);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const act = async (label: string, body: Record<string, unknown>) => {
    setBusy(label);
    try {
      const res = await fetch("/api/admin/city-ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setToast(d.result?.action ? `${label}: ${d.result.action}${d.result.providerName ? ` (${d.result.providerName})` : ""}` : `${label}: done`);
      await load();
    } catch (e) {
      setToast(`${label} failed: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const runClock = async () => {
    setBusy("clock");
    try {
      const res = await fetch("/api/cron/city-lead-offers", { headers: { "x-triggered-by": "admin" }, cache: "no-store" });
      const d = await res.json().catch(() => ({}));
      setToast(res.ok ? `Clock ran: ${JSON.stringify(d.summary ?? d)}` : `Clock failed: ${d.error || res.status}`);
      await load();
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 6000);
    }
  };

  const cities = useMemo(() => Array.from(new Set(campaigns.map((c) => c.slug))), [campaigns]);

  const statsFor = (c: Campaign) => {
    const mine = leads.filter((l) => l.slug === c.slug && (l.utm_medium ?? "") === c.utm_medium && l.care_type !== "medical");
    const accepted = mine.filter((l) => l.accepted_offer_id);
    const reached = mine.filter((l) => l.reached_at || ["contacted", "client"].includes(l.status));
    const clients = mine.filter((l) => l.status === "client");
    const cpl = c.ad_spend_cents && accepted.length ? c.ad_spend_cents / accepted.length : null;
    const cvr = c.ad_clicks ? (mine.length / c.ad_clicks) * 100 : null;
    return { leads: mine.length, accepted: accepted.length, reached: reached.length, clients: clients.length, cpl, cvr };
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Olera city campaigns</h1>
          <p className="mt-1 text-sm text-gray-600">
            One row per city, channel and flight. Spend and clicks are typed from the platform; everything to the right is computed from lead rows.{" "}
            <Link href="/admin/ad-boost" className="text-primary-700 underline-offset-2 hover:underline">
              Provider queue
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void runClock()} disabled={busy !== null} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Run the clock now
          </button>
          <button onClick={() => void load()} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </header>

      {error && <div className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">{error}</div>}
      {toast && <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}

      {/* Campaigns */}
      <section className="mb-8 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Flight</th>
              <th className="px-3 py-2">Budget / cap</th>
              <th className="px-3 py-2">Spend / clicks / impr (typed)</th>
              <th className="px-3 py-2 text-right">Leads</th>
              <th className="px-3 py-2 text-right">Page CVR</th>
              <th className="px-3 py-2 text-right">Accepted</th>
              <th className="px-3 py-2 text-right">Reached</th>
              <th className="px-3 py-2 text-right">Clients</th>
              <th className="px-3 py-2 text-right">$ / accepted</th>
              <th className="px-3 py-2">Platform id</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((c) => {
              const s = statsFor(c);
              return (
                <tr key={c.id} className="align-top">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">
                      {c.city}, {c.state}
                    </div>
                    <div className="text-xs text-gray-500">{c.ring_label}</div>
                    <a className="text-xs text-primary-700 underline-offset-2 hover:underline" href={`/care/${c.slug}?utm_source=olera_city&utm_medium=${c.utm_medium}&utm_campaign=${c.campaign_tag}`} target="_blank" rel="noreferrer">
                      /care/{c.slug} ↗
                    </a>
                  </td>
                  <td className="px-3 py-2">
                    <div>{c.channel}</div>
                    <div className="text-xs text-gray-500">{c.utm_medium}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-gray-300 bg-white px-1.5 py-1 text-xs"
                      value={c.status}
                      onChange={(e) => void act("Status", { action: "update_campaign", id: c.id, fields: { status: e.target.value } })}
                    >
                      {["draft", "scheduled", "live", "ended"].map((s2) => (
                        <option key={s2} value={s2}>
                          {s2}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    {c.flight_start} → {c.flight_end}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    {money(c.budget_cents)}
                    {c.max_cpc_cents ? ` / ${money(c.max_cpc_cents)} cap` : ""}
                  </td>
                  <td className="px-3 py-2">
                    <MetricsEditor c={c} onSave={(fields) => act("Metrics", { action: "update_campaign", id: c.id, fields })} />
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.leads}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.cvr === null ? <span className="text-gray-400">—</span> : `${s.cvr.toFixed(1)}%`}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.accepted}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.reached}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.clients}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{s.cpl === null ? <span className="text-gray-400">—</span> : money(Math.round(s.cpl))}</td>
                  <td className="px-3 py-2">
                    <InlineText value={c.platform_campaign_id ?? ""} placeholder="campaign id" onSave={(v) => act("Platform id", { action: "update_campaign", id: c.id, fields: { platform_campaign_id: v } })} />
                  </td>
                </tr>
              );
            })}
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={13} className="px-3 py-6 text-center text-sm text-gray-500">
                  No campaigns yet. Apply migration 207.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Pools */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        {cities.map((slug) => (
          <div key={slug} className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
              <h2 className="text-sm font-semibold text-gray-900">On call · {slug}</h2>
              <span className="text-xs text-gray-500">{pool.filter((p) => p.slug === slug && p.enabled).length} enabled</span>
            </div>
            <ul className="divide-y divide-gray-100">
              {pool
                .filter((p) => p.slug === slug)
                .map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 accent-primary-700" checked={p.enabled} onChange={(e) => void act("Pool", { action: "pool_toggle", poolId: p.id, enabled: e.target.checked })} />
                      <span className={p.enabled ? "font-medium text-gray-900" : "text-gray-500"}>{p.provider?.display_name ?? p.provider_id.slice(0, 8)}</span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {p.provider?.city} · {p.care_types.join(", ")} · #{p.position}
                    </span>
                    <span className="ml-auto text-xs text-gray-600">{phoneFmt(p.phone_override ?? p.provider?.phone)}</span>
                    <InlineText value={p.phone_override ?? ""} placeholder="mobile override" onSave={(v) => act("Pool phone", { action: "pool_update", poolId: p.id, fields: { phone_override: v } })} />
                  </li>
                ))}
            </ul>
            <p className="px-3 py-2 text-[11px] text-gray-500">Enable a provider only after they replied YES in writing to taking texted leads. Offers go out in position order, filtered by care type.</p>
          </div>
        ))}
      </section>

      {/* Leads */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <h2 className="text-sm font-semibold text-gray-900">Leads</h2>
          <span className="text-xs text-gray-500">{leads.length} shown, newest first</span>
        </div>
        {leads.length === 0 && <p className="px-3 py-6 text-center text-sm text-gray-500">No leads yet.</p>}
        <ul className="divide-y divide-gray-100">
          {leads.map((l) => (
            <li key={l.id} className="px-3 py-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_CLS[l.status] ?? "bg-gray-100"}`}>{l.status}</span>
                    <span className="font-medium text-gray-900">{l.first_name}</span>
                    <a className="text-sm text-primary-700" href={`tel:${l.phone}`}>
                      {phoneFmt(l.phone)}
                    </a>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    {CARE[l.care_type] ?? l.care_type} for {WHO[l.care_recipient ?? ""] ?? "someone"}, {WHEN[l.urgency ?? ""] ?? ""}
                    {l.zip ? ` · ${l.zip}` : ""}
                    {l.payment_type ? ` · ${l.payment_type}` : ""}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {l.slug} · {l.utm_medium ?? "no medium"} · {fmt(l.created_at)}
                    {l.next_offer_at ? ` · parked until ${fmt(l.next_offer_at)}` : ""}
                  </div>
                  {l.note && <div className="mt-1 rounded bg-vanilla-100 px-2 py-1 text-xs text-gray-700">“{l.note}”</div>}
                </div>

                <div className="min-w-[260px] flex-1">
                  {l.offers.length === 0 && <div className="text-xs text-gray-500">No offers yet.</div>}
                  <ol className="space-y-1">
                    {l.offers.map((o) => {
                      const state = o.accepted_at ? "accepted" : o.declined_at ? `declined${o.decline_reason ? ` (${o.decline_reason})` : ""}` : o.expired_at ? "no reply" : new Date(o.expires_at) > new Date() ? "waiting" : "due";
                      return (
                        <li key={o.id} className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-gray-400">#{o.position}</span>
                          <span className="font-medium text-gray-800">{o.provider?.display_name ?? o.provider_id.slice(0, 8)}</span>
                          <span className={`rounded px-1.5 py-0.5 ${o.accepted_at ? "bg-success-50 text-success-700" : state === "waiting" ? "bg-primary-50 text-primary-800" : "bg-gray-100 text-gray-600"}`}>{state}</span>
                          <span className="text-gray-500">{fmt(o.offered_at)}</span>
                          {!o.accepted_at && !o.declined_at && !l.accepted_offer_id && (
                            <>
                              <button className="text-primary-700 underline-offset-2 hover:underline" disabled={busy !== null} onClick={() => void act("Accept", { action: "accept", offerId: o.id })}>
                                mark accepted
                              </button>
                              <button className="text-gray-600 underline-offset-2 hover:underline" disabled={busy !== null} onClick={() => void act("Decline", { action: "decline", offerId: o.id, reason: "other" })}>
                                skip
                              </button>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {!l.accepted_offer_id && !["redirected", "stopped", "client", "no_fit"].includes(l.status) && (
                    <>
                      <button className={btn} disabled={busy !== null} onClick={() => void act("Offer next", { action: "offer_next", leadId: l.id })}>
                        Offer to next
                      </button>
                      <select
                        className="rounded border border-gray-300 bg-white px-1.5 py-1 text-xs"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) void act("Offer to", { action: "offer_to", leadId: l.id, providerId: e.target.value });
                          e.target.value = "";
                        }}
                      >
                        <option value="">Offer to…</option>
                        {pool
                          .filter((p) => p.slug === l.slug)
                          .map((p) => (
                            <option key={p.id} value={p.provider_id}>
                              {p.provider?.display_name ?? p.provider_id.slice(0, 8)}
                            </option>
                          ))}
                      </select>
                    </>
                  )}
                  {l.accepted_offer_id && !["client", "no_fit"].includes(l.status) && (
                    <>
                      {l.status !== "contacted" && (
                        <button className={btn} disabled={busy !== null} onClick={() => void act("Contacted", { action: "set_status", leadId: l.id, status: "contacted" })}>
                          Reached
                        </button>
                      )}
                      <button className={btn} disabled={busy !== null} onClick={() => void act("Client", { action: "set_status", leadId: l.id, status: "client" })}>
                        Became client
                      </button>
                      <button className={btn} disabled={busy !== null} onClick={() => void act("No fit", { action: "set_status", leadId: l.id, status: "no_fit" })}>
                        Not a fit
                      </button>
                      <button className={btn} disabled={busy !== null} onClick={() => void act("Unreachable", { action: "set_status", leadId: l.id, status: "unreachable" })}>
                        Unreachable
                      </button>
                    </>
                  )}
                  {!["stopped", "client"].includes(l.status) && (
                    <button className={`${btn} text-gray-500`} disabled={busy !== null} onClick={() => void act("Stop", { action: "set_status", leadId: l.id, status: "stopped" })}>
                      Stop
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <InlineText value={l.admin_note ?? ""} placeholder="admin note" wide onSave={(v) => act("Note", { action: "note", leadId: l.id, note: v })} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const btn = "rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50";

function MetricsEditor({ c, onSave }: { c: Campaign; onSave: (fields: Record<string, unknown>) => void }) {
  const [spend, setSpend] = useState(c.ad_spend_cents === null ? "" : (c.ad_spend_cents / 100).toFixed(2));
  const [clicks, setClicks] = useState(c.ad_clicks === null ? "" : String(c.ad_clicks));
  const [impr, setImpr] = useState(c.ad_impressions === null ? "" : String(c.ad_impressions));
  useEffect(() => {
    setSpend(c.ad_spend_cents === null ? "" : (c.ad_spend_cents / 100).toFixed(2));
    setClicks(c.ad_clicks === null ? "" : String(c.ad_clicks));
    setImpr(c.ad_impressions === null ? "" : String(c.ad_impressions));
  }, [c.ad_spend_cents, c.ad_clicks, c.ad_impressions]);
  const age = c.metrics_updated_at ? Math.round((Date.now() - new Date(c.metrics_updated_at).getTime()) / 36e5) : null;
  return (
    <div className="flex items-center gap-1">
      <input className={mini} placeholder="$" value={spend} onChange={(e) => setSpend(e.target.value)} />
      <input className={mini} placeholder="clicks" value={clicks} onChange={(e) => setClicks(e.target.value)} />
      <input className={mini} placeholder="impr" value={impr} onChange={(e) => setImpr(e.target.value)} />
      <button
        className={btn}
        onClick={() =>
          onSave({
            ad_spend_cents: spend === "" ? "" : Math.round(parseFloat(spend) * 100),
            ad_clicks: clicks === "" ? "" : parseInt(clicks, 10),
            ad_impressions: impr === "" ? "" : parseInt(impr, 10),
          })
        }
      >
        Save
      </button>
      <span className={`text-[10px] ${age !== null && age > 24 ? "text-warning-700" : "text-gray-400"}`}>{age === null ? "never" : `${age}h ago`}</span>
    </div>
  );
}

const mini = "w-16 rounded border border-gray-300 px-1.5 py-1 text-xs tabular-nums";

function InlineText({ value, placeholder, onSave, wide }: { value: string; placeholder: string; onSave: (v: string) => void; wide?: boolean }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return (
    <span className="inline-flex items-center gap-1">
      <input className={`${wide ? "w-full min-w-[320px]" : "w-28"} rounded border border-gray-300 px-1.5 py-1 text-xs`} placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} />
      {v !== value && (
        <button className={btn} onClick={() => onSave(v)}>
          Save
        </button>
      )}
    </span>
  );
}
