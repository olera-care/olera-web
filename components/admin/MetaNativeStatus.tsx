"use client";
import { useCallback, useEffect, useState } from "react";

type Receipt = { leadgen_id: string; status: string; last_error: string | null; received_at: string; attempts: number };
type Delivery = { campaignId: string; label: string; spend: number; impressions: number; reach: number;
  linkClicks: number; results: number | null; cpm: number | null; costPerLinkClick: number | null; hasData: boolean };
type State = { configured: boolean; forms: { formId: string; slug: string; testOnly: boolean }[];
  delivery?: { configured: boolean; reason: string | null; campaigns: Delivery[]; unreadable: string[] };
  exhaustedReceipts: number;
  receipts: Receipt[]; counts: { leads: number; introduced: number; accepted: number; reached: number; clients: number };
  health: Record<string,number>; clock: {started_at:string;status:string} | null;
  oldestPendingAt: string | null; lastReceivedAt: string | null; slackConfigured: boolean; failedAlerts: number;
  alerts: {id:string;kind:string;status:string;last_error:string|null}[]; clientRate: number | null; };

const money = (v: number) => `$${v.toFixed(2)}`;
const count = (v: number) => v.toLocaleString();
export default function MetaNativeStatus() {
  const [data, setData] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/city-ads/meta", { cache: "no-store" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setData(body); setError(null);
    } catch (e) { setData(null); setError(e instanceof Error ? e.message : "Could not load Meta intake"); }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 60_000);
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [load]);
  async function retry(id: string) {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/city-ads/meta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadgenId: id }) });
      if (!r.ok) throw new Error((await r.json()).error);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Retry failed"); }
    finally { setBusy(false); }
  }
  return <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4">
    <div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-gray-900">Meta Instant Forms</h2>
      <button className="text-sm text-primary-700" onClick={() => void load()}>Refresh</button></div>
    {error && <p role="alert" className="mt-2 text-sm text-error-700">{error}</p>}
    {data && <>
      <p className="mt-2 text-sm text-gray-600">{data.configured ? "Direct intake configured. Submissions are picked up by the city clock every five minutes." : "Setup pending. Keep native ads unpublished until a test submission arrives here."}</p>

      {/* Meta's half of the funnel. Without this the five tiles below all read
          zero and you cannot tell whether nobody saw the ad, nobody tapped it,
          or nobody finished the form. Those need opposite responses. */}
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Meta delivery — getting them to the form</h3>
      {/* Optional-chained on purpose: a render throw here would take the whole
          panel down silently, and the lead outcomes matter more than this row. */}
      {!data.delivery?.configured
        ? <p className="mt-2 rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-600">{data.delivery?.reason ?? "Delivery reporting is unavailable."}</p>
        : <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="py-1 pr-3 font-medium">Campaign</th>
                <th className="py-1 pr-3 text-right font-medium">Spend</th>
                <th className="py-1 pr-3 text-right font-medium">Impressions</th>
                <th className="py-1 pr-3 text-right font-medium" title="Meta counts a link click when someone taps the call to action. It does not report form views, so this is an upper bound on how many people actually saw the form.">Link clicks</th>
                <th className="py-1 pr-3 text-right font-medium">CPM</th>
                <th className="py-1 pr-3 text-right font-medium">Cost / click</th>
                <th className="py-1 text-right font-medium">Results</th>
              </tr></thead>
              <tbody>
                {data.delivery.campaigns.map(c => <tr key={c.campaignId} className="border-b border-gray-100">
                  <td className="py-1.5 pr-3">{c.label}</td>
                  {c.hasData ? <>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{money(c.spend)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{count(c.impressions)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{count(c.linkClicks)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{c.cpm === null ? "—" : money(c.cpm)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{c.costPerLinkClick === null ? "—" : money(c.costPerLinkClick)}</td>
                    <td className="py-1.5 text-right tabular-nums">{c.results === null ? "—" : count(c.results)}</td>
                  </> : <td colSpan={6} className="py-1.5 text-right text-xs text-gray-500">Has never served</td>}
                </tr>)}
              </tbody>
            </table>
            {!!data.delivery.unreadable?.length && <p role="alert" className="mt-1 text-xs text-error-700">Could not read {data.delivery.unreadable.join(", ")} from Meta. Those rows are missing here, not empty.</p>}
            <p className="mt-1 text-xs text-gray-500">Lifetime, from Meta. <strong>Link clicks are an upper bound on form opens</strong> — Meta reports no form-view metric, so a tap that never rendered the form still counts here. A dash under Results means the optimisation event has never fired.</p>
          </div>}

      {/* Everything below this line is downstream of a submitted lead. */}
      <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">Olera handling — what happens after they submit</h3>
      <div className="mt-2 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        {[["Leads",data.counts.leads],["Offered to provider",data.counts.introduced],["Provider accepted",data.counts.accepted],["Provider reached family",data.counts.reached],["Clients",data.counts.clients]].map(([label,value])=>
          <div key={label} className="rounded-lg bg-gray-50 p-3"><p className="text-xl font-semibold">{value}</p><p className="text-xs text-gray-600">{label}</p></div>)}
      </div>
      <p className="mt-2 text-sm">Lead-to-client conversion: {data.clientRate === null ? "Not enough data" : `${(100*data.clientRate).toFixed(1)}%`}</p>
      <div className="mt-3 rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
        <p>{data.health.pending + data.health.processing} awaiting import · {data.health.failed} failed · {data.health.duplicate} duplicates · {data.health.blocked} blocked</p>
        {data.exhaustedReceipts > 0 && <p className="mt-1">{data.exhaustedReceipts} {data.exhaustedReceipts === 1 ? "receipt has" : "receipts have"} used every retry and will not be attempted again. Retry below once the cause is fixed, or leave them if they are tests.</p>}
        <p className="mt-1">Last receipt: {data.lastReceivedAt ? new Date(data.lastReceivedAt).toLocaleString() : "None"}</p>
        <p className="mt-1">City clock: {data.clock ? `${data.clock.status} at ${new Date(data.clock.started_at).toLocaleString()}` : "No run recorded"}</p>
        {data.oldestPendingAt && Date.now()-Date.parse(data.oldestPendingAt)>15*60000 && <p role="alert" className="mt-1 text-error-700">A receipt has been waiting more than 15 minutes. Check delivery receipts and the city clock.</p>}
        {data.configured && (!data.clock || Date.now()-Date.parse(data.clock.started_at)>15*60000) && <p role="alert" className="mt-1 text-error-700">The city clock is overdue. New leads may not be importing.</p>}
        <p className="mt-1">Slack: {data.slackConfigured ? "Configured" : "Not configured"} · {data.failedAlerts} failed or uncertain alerts</p>
        {data.alerts.map(a=><p key={a.id} className="mt-1">{a.kind.replace(/_/g," ")} · {a.status}{a.last_error ? ` — ${a.last_error}` : ""}</p>)}
      </div>
      <p className="mt-1 text-xs text-gray-500">All-time native outcomes; test leads excluded. Refreshes every minute. Delivery health includes test receipts. Cost per client is not shown: it needs spend attributed per lead, which this panel does not do yet.</p>
      {data.forms.map(f => <p key={f.formId} className="mt-2 text-xs text-gray-600">{f.slug} · Form {f.formId} · {f.testOnly ? "Test mode — no messages" : "Live intake"}</p>)}
      <details className="mt-3"><summary className="cursor-pointer text-sm text-primary-700">Delivery receipts ({data.receipts.length}; up to 50 failed plus 50 recent)</summary>
        {data.receipts.length === 0 && <p className="mt-2 text-sm text-gray-500">No submissions received yet.</p>}
        {data.receipts.map(r => <div key={r.leadgen_id} className="mt-2 border-t border-gray-100 pt-2 text-xs">
          <span>{r.leadgen_id} · {r.status} · {new Date(r.received_at).toLocaleString()}</span>
          {r.last_error && <p className="mt-1 text-error-700">{r.last_error}</p>}
          {r.status === "failed" && <button disabled={busy} onClick={() => void retry(r.leadgen_id)} className="mt-1 text-primary-700 disabled:opacity-50">Retry delivery</button>}
        </div>)}
      </details>
    </>}
  </section>;
}
