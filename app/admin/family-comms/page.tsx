"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DateRangePopover, {
  resolveRange,
  rangeLabel,
  type DateRangeValue,
} from "@/components/admin/DateRangePopover";
import CollapsibleSection from "@/components/admin/CollapsibleSection";

/**
 * /admin/family-comms — the family-engagement + email-observability surface.
 *
 * First-principles read on how families move through our funnel and how every
 * family email performs (deliver → open → click → convert), so we can iterate
 * on copy/CTAs by data. The compare-led flywheel is the spine; the cutover
 * lens is a secondary, collapsible view. Data: GET /api/admin/family-comms-analytics/summary.
 */

interface PerfRow {
  type: string;
  label: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  weeklySends: number[];
  compareBearing: boolean;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface Summary {
  range: { from: string; to: string };
  generatedAt: string;
  totals: { sent: number; delivered: number; opened: number; clicked: number; bounced: number; complained: number };
  compareClick: { sends: number; opened: number; clicked: number; openRate: number; clickRate: number };
  emailPerformance: PerfRow[];
  funnel: {
    emailed: number; opened: number; clicked: number; answered: number;
    engaged: number; benefitsStarted: number; benefitsCompleted: number; published: number;
  };
  sensor: { sent: number; answered: number; yes: number; no: number; notYet: number; responseRate: number; yesRate: number };
  conversions: { compareSaved: number; guideSaved: number; benefitsStarted: number; benefitsCompleted: number; published: number };
  cutover: { anchor: string; cutoverWeekIndex: number; weekStartsISO: string[]; sendsWeekly: number[]; goLivesWeekly: number[] };
}

const pct = (n: number) => `${(n * 100).toFixed(n >= 0.0995 ? 0 : 1)}%`;
const num = (n: number) => n.toLocaleString();

function Sparkline({ points, color = "#0d9488" }: { points: number[]; color?: string }) {
  const w = 72, h = 18;
  if (!points.length) return <svg width={w} height={h} />;
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (p / max) * (h - 2) - 1).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-[26px] font-semibold tabular-nums ${accent ? "text-teal-700" : "text-gray-900"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-500">{sub}</div>}
    </div>
  );
}

/** Horizontal funnel step with a width bar relative to the top of the funnel. */
function FunnelStep({ label, value, base, note }: { label: string; value: number; base: number; note?: string }) {
  const w = base > 0 ? Math.max(2, (value / base) * 100) : 0;
  const conv = base > 0 ? value / base : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-44 shrink-0 text-sm text-gray-700">{label}</div>
      <div className="flex-1 min-w-0">
        <div className="h-7 rounded-md bg-teal-50 overflow-hidden">
          <div className="h-full rounded-md bg-teal-500/80 flex items-center px-2" style={{ width: `${w}%` }}>
            <span className="text-[11px] font-semibold text-white tabular-nums">{num(value)}</span>
          </div>
        </div>
      </div>
      <div className="w-28 shrink-0 text-right text-[11px] text-gray-500 tabular-nums">
        {pct(conv)} of emailed{note ? "" : ""}
      </div>
    </div>
  );
}

export default function FamilyCommsAnalyticsPage() {
  const [range, setRange] = useState<DateRangeValue>({ preset: "30d", customFrom: "", customTo: "" });
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const { from, to } = resolveRange(range);
    const params = new URLSearchParams();
    if (from) params.set("date_from", from);
    if (to) params.set("date_to", to);
    fetch(`/api/admin/family-comms-analytics/summary?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Summary) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  const f = data?.funnel;
  const sensor = data?.sensor;
  const conv = data?.conversions;

  const sensorBreakdown = useMemo(() => {
    if (!sensor || sensor.answered === 0) return null;
    return [
      { k: "Yes — provider got back", v: sensor.yes, c: "bg-emerald-500" },
      { k: "Not yet", v: sensor.notYet, c: "bg-amber-400" },
      { k: "No", v: sensor.no, c: "bg-rose-400" },
    ];
  }, [sensor]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/admin/automations" className="hover:text-gray-600">Automations</Link>
            <span>·</span>
            <Link href="/admin/emails" className="hover:text-gray-600">Emails log</Link>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Family Comms — engagement & email performance</h1>
          <p className="mt-1 text-sm text-gray-500">
            How families move through the compare-led flywheel, and how every family email performs. {" "}
            <span className="text-gray-400">{rangeLabel(range)}</span>
          </p>
        </div>
        <DateRangePopover value={range} onChange={setRange} />
      </div>

      {loading && <p className="text-sm text-gray-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">Failed to load: {error}</p>}

      {data && !error && (
        <>
          {/* Top-line stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <Stat label="Emails sent" value={num(data.totals.sent)} />
            <Stat label="Open rate" value={pct(data.totals.sent ? data.totals.opened / (data.totals.delivered || data.totals.sent) : 0)} sub={`${num(data.totals.opened)} opened`} />
            <Stat label="Click rate" value={pct(data.totals.opened ? data.totals.clicked / data.totals.opened : 0)} sub={`${num(data.totals.clicked)} clicked`} />
            <Stat label="Sensor response" value={pct(sensor?.responseRate ?? 0)} sub={`${num(sensor?.answered ?? 0)} / ${num(sensor?.sent ?? 0)} answered`} accent />
            <Stat label="Provider got back" value={pct(sensor?.yesRate ?? 0)} sub="of those who answered" />
            <Stat label="Went live" value={num(conv?.published ?? 0)} sub="profiles published" accent />
          </div>

          {/* Flywheel funnel */}
          <CollapsibleSection title="Family engagement flywheel" storageKey="fc.funnel" defaultCollapsed={false}>
            {f && (
              <>
                <div className="space-y-0.5">
                  <FunnelStep label="Emailed" value={f.emailed} base={f.emailed} />
                  <FunnelStep label="Opened" value={f.opened} base={f.emailed} />
                  <FunnelStep label="Clicked" value={f.clicked} base={f.emailed} />
                  <FunnelStep label="Answered sensor" value={f.answered} base={f.emailed} />
                  <FunnelStep label="Saved compare / guide" value={f.engaged} base={f.emailed} />
                  <FunnelStep label="Benefits quiz completed" value={f.benefitsCompleted} base={f.emailed} />
                  <FunnelStep label="Went live (published)" value={f.published} base={f.emailed} />
                </div>
                <p className="mt-3 text-[11px] text-gray-400 leading-relaxed">
                  Emailed / Opened / Clicked are exact per-send email metrics. The later steps are window totals of each
                  action across all families (not yet attributed to a specific send), so treat the lower funnel as
                  directional volume, not a strict click-through chain.
                </p>
              </>
            )}
          </CollapsibleSection>

          {/* Email performance by type — the iterate workhorse */}
          <CollapsibleSection title="Email performance by type" storageKey="fc.perf" defaultCollapsed={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 px-2 font-medium text-right">Sent</th>
                    <th className="py-2 px-2 font-medium text-right">Deliv.</th>
                    <th className="py-2 px-2 font-medium text-right">Open</th>
                    <th className="py-2 px-2 font-medium text-right">Click</th>
                    <th className="py-2 px-2 font-medium text-right">Bounce</th>
                    <th className="py-2 pl-3 font-medium text-right">8-wk sends</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.emailPerformance.map((p) => (
                    <tr key={p.type} className="hover:bg-gray-50/60">
                      <td className="py-2 pr-3">
                        <Link href={`/admin/emails?type=${encodeURIComponent(p.type)}`} className="text-gray-800 hover:text-teal-700">
                          {p.label}
                        </Link>
                        {p.compareBearing && (
                          <span className="ml-2 rounded bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">compare</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-gray-900">{num(p.sent)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-gray-500">{p.sent ? pct(p.deliveryRate) : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-gray-700">{p.sent ? pct(p.openRate) : "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-gray-700">{p.sent ? pct(p.clickRate) : "—"}</td>
                      <td className={`py-2 px-2 text-right tabular-nums ${p.bounceRate > 0.02 ? "text-rose-600" : "text-gray-400"}`}>{p.sent ? pct(p.bounceRate) : "—"}</td>
                      <td className="py-2 pl-3 text-right"><div className="inline-block"><Sparkline points={p.weeklySends} /></div></td>
                    </tr>
                  ))}
                  {data.emailPerformance.length === 0 && (
                    <tr><td colSpan={7} className="py-6 text-center text-sm text-gray-400">No family emails sent in this window.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-gray-400">
              Open rate = opened / delivered · Click rate = clicked / opened · all from Resend webhook events. The
              <span className="font-medium text-teal-700"> compare</span> tag marks rungs whose body carries alternative-provider cards.
            </p>
          </CollapsibleSection>

          {/* Sensor detail */}
          <CollapsibleSection title="Outcome-check sensor (ground-truth signal)" storageKey="fc.sensor" defaultCollapsed={false}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Stat label="Sent" value={num(sensor?.sent ?? 0)} />
              <Stat label="Answered" value={num(sensor?.answered ?? 0)} sub={pct(sensor?.responseRate ?? 0)} accent />
              <Stat label="Provider got back" value={num(sensor?.yes ?? 0)} sub={`${pct(sensor?.yesRate ?? 0)} of answers`} />
              <Stat label="No / not yet" value={num((sensor?.no ?? 0) + (sensor?.notYet ?? 0))} sub="→ help cascade" />
            </div>
            {sensorBreakdown && (
              <div className="space-y-1.5">
                {sensorBreakdown.map((b) => (
                  <div key={b.k} className="flex items-center gap-3">
                    <div className="w-44 shrink-0 text-sm text-gray-700">{b.k}</div>
                    <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                      <div className={`h-full ${b.c}`} style={{ width: `${sensor && sensor.answered ? (b.v / sensor.answered) * 100 : 0}%` }} />
                    </div>
                    <div className="w-12 text-right text-xs tabular-nums text-gray-600">{num(b.v)}</div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Conversions strip */}
          <CollapsibleSection title="Downstream conversions" storageKey="fc.conv" defaultCollapsed={false}>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Stat label="Compare saved" value={num(conv?.compareSaved ?? 0)} />
              <Stat label="Guide saved" value={num(conv?.guideSaved ?? 0)} />
              <Stat label="Benefits started" value={num(conv?.benefitsStarted ?? 0)} sub="quiz opens (under-tracked)" />
              <Stat label="Benefits completed" value={num(conv?.benefitsCompleted ?? 0)} sub={conv && conv.benefitsStarted >= conv.benefitsCompleted && conv.benefitsStarted > 0 ? pct(conv.benefitsCompleted / conv.benefitsStarted) + " of started" : "results saved"} />
              <Stat label="Went live" value={num(conv?.published ?? 0)} accent />
            </div>
          </CollapsibleSection>

          {/* Secondary: cutover lens */}
          <CollapsibleSection title="Cutover lens — coordinator vs. the old firehose" storageKey="fc.cutover" defaultCollapsed={true}>
            <p className="text-[12px] text-gray-500 mb-4">
              The coordinator took over the 6 inquiry crons on <span className="font-medium text-gray-700">2026-06-24</span>.
              Weekly family-email volume and go-lives spanning that boundary — directional, since go-lives aren&apos;t solely email-attributed.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WeeklyBars title="Family emails / week" series={data.cutover.sendsWeekly} starts={data.cutover.weekStartsISO} cutoverIdx={data.cutover.cutoverWeekIndex} color="bg-teal-400" />
              <WeeklyBars title="Profiles went live / week" series={data.cutover.goLivesWeekly} starts={data.cutover.weekStartsISO} cutoverIdx={data.cutover.cutoverWeekIndex} color="bg-emerald-500" />
            </div>
          </CollapsibleSection>

          <p className="mt-2 text-[11px] text-gray-400">
            Generated {new Date(data.generatedAt).toLocaleString()} · all signals from existing data (email_log + Resend webhooks + seeker_activity).
          </p>
        </>
      )}
    </div>
  );
}

function WeeklyBars({ title, series, starts, cutoverIdx, color }: { title: string; series: number[]; starts: string[]; cutoverIdx: number; color: string }) {
  const max = Math.max(1, ...series);
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400 mb-2">{title}</div>
      <div className="flex items-end gap-1.5 h-28">
        {series.map((v, i) => {
          const isPost = cutoverIdx >= 0 && i >= cutoverIdx;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-gray-500">{v || ""}</span>
              <div className="w-full rounded-t bg-gray-100 flex items-end" style={{ height: "100%" }}>
                <div className={`w-full rounded-t ${color} ${isPost ? "" : "opacity-45"}`} style={{ height: `${(v / max) * 100}%` }} />
              </div>
              <span className="text-[9px] text-gray-400">{new Date(starts[i]).toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className={`inline-block w-2.5 h-2.5 rounded-sm ${color} opacity-45`} />pre-cutover</span>
        <span className="flex items-center gap-1"><span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />post-cutover</span>
      </div>
    </div>
  );
}
