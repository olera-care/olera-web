"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

/**
 * /admin/deliverability — who is dark right now, and what to do about them.
 *
 * The companion to the risk strip on /admin/automations. That answers "are we
 * about to be suspended"; this answers "which providers stopped hearing from us
 * and what is the remedy". Two halves of one system: an alert says something
 * happened, this says where to look.
 *
 * Design decisions worth not re-litigating:
 *   · The unit is the PROVIDER, not the send. Every remedy is per-provider.
 *   · Rows rank by what the silence COSTS. A bounced nudge and a dead paid lead
 *     are identical rows in the raw log and are not the same problem.
 *   · Never-delivered listings are hidden by DEFAULT. They are the large
 *     majority and they are a data-quality backlog, not a daily queue — left in
 *     the default view they bury the handful of rows a human should work today.
 */

type Tier = "paid" | "lead" | "question";
type Cause = "complaint" | "bounce" | "never_delivered" | "never_attempted";

interface Provider {
  recipient: string;
  name: string;
  location: string;
  phone: string | null;
  slug: string | null;
  claimed: boolean;
  tier: Tier;
  cause: Cause;
  lost: Record<string, number>;
  lostCount: number;
  lastLostAt: string | null;
  everDelivered: boolean;
  history: { delivered: number; bounced: number; complained: number };
}

interface Payload {
  windowDays: number;
  generatedAt: string;
  counts: {
    total: number; paid: number; lead: number; question: number;
    claimed: number; neverDelivered: number; eventsLost: number; withPhone: number;
  };
  providers: Provider[];
}

const TYPE_LABEL: Record<string, string> = {
  ad_boost_lead_delivered: "paid lead",
  first_lead_celebration: "first-lead",
  connection_request: "connection",
  connection_sent: "connection sent",
  guest_connection: "guest connection",
  new_message: "message",
  question_received: "question",
};

const TIER_STYLE: Record<Tier, { label: string; cls: string }> = {
  // "Paid" means an Ad Boost campaign the provider funded — money is on the line.
  paid: { label: "Paid lead", cls: "bg-red-600 text-white" },
  lead: { label: "Lead", cls: "bg-amber-100 text-amber-800 ring-1 ring-amber-200" },
  question: { label: "Question", cls: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" },
};

/** The remedy is a property of the cause. Putting it on the row is what turns a report into a queue. */
const CAUSE_STYLE: Record<Cause, { label: string; cls: string; remedy: string }> = {
  complaint: {
    label: "Complaint",
    cls: "bg-red-50 text-red-700 ring-1 ring-red-200",
    remedy: "Call them. Never re-mail — a trust override here risks the account.",
  },
  bounce: {
    label: "Bounce",
    cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    remedy: "Trust override clears it and flushes the backlog.",
  },
  never_delivered: {
    label: "Never delivered",
    cls: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
    remedy: "Every attempt bounced. Needs a new address, not a retry.",
  },
  never_attempted: {
    label: "Never attempted",
    cls: "bg-gray-50 text-gray-500 ring-1 ring-gray-200",
    remedy: "Suppressed before send, usually the cold-lane catch-all rule. Verify the address rather than replacing it.",
  },
};

function relative(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}

function Stat({ value, label, detail, tone = "default" }: {
  value: string | number; label: string; detail: string; tone?: "default" | "danger" | "muted";
}) {
  return (
    <div className="min-h-20 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <span className={`block text-2xl font-semibold leading-none tabular-nums ${
        tone === "danger" ? "text-red-600" : tone === "muted" ? "text-gray-400" : "text-gray-950"}`}>
        {value}
      </span>
      <span className="mt-2 block text-xs font-semibold text-gray-700">{label}</span>
      <span className="mt-0.5 block text-[11px] text-gray-400">{detail}</span>
    </div>
  );
}

export default function DeliverabilityPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tier, setTier] = useState<"all" | Tier | "claimed">("all");
  // Off by default: never-delivered is the long tail and would bury the queue.
  const [showNeverDelivered, setShowNeverDelivered] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/deliverability", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.providers.filter((p) => {
      if (!showNeverDelivered && (p.cause === "never_delivered" || p.cause === "never_attempted")) return false;
      if (tier === "all") return true;
      if (tier === "claimed") return p.claimed;
      return p.tier === tier;
    });
  }, [data, tier, showNeverDelivered]);

  const chips: Array<[typeof tier, string]> = data
    ? [
        ["all", `All ${data.counts.total}`],
        ["paid", `Paid ${data.counts.paid}`],
        ["claimed", `Claimed ${data.counts.claimed}`],
        ["lead", `Lead ${data.counts.lead}`],
        ["question", `Question ${data.counts.question}`],
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <AdminPageHeader
        title="Deliverability"
        description="Providers who stopped hearing from us, ranked by what the silence costs. Account-level risk lives on Automations."
        breadcrumbs={[{ label: "Operations", href: "/admin" }]}
      />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/admin/automations" className="inline-flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 hover:border-gray-300">
          Account risk on Automations →
        </Link>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex min-h-9 items-center rounded-full border border-gray-200 bg-white px-4 text-xs font-semibold text-gray-600 hover:border-gray-300 disabled:opacity-50">
          {loading && data ? "Refreshing…" : "Refresh"}
        </button>
        {data && <span className="text-[11px] text-gray-400">Last {data.windowDays} days</span>}
      </div>

      {loading && !data && <div className="mt-6 h-24 animate-pulse rounded-xl bg-gray-100" />}
      {err && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Couldn&rsquo;t load: {err}</div>}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat value={data.counts.total} label="Providers dark" detail={`${data.counts.eventsLost} demand events lost`} tone={data.counts.total > 0 ? "danger" : "muted"} />
            <Stat value={data.counts.paid} label="Paid leads lost" detail="Ad Boost campaigns the provider funded" tone={data.counts.paid > 0 ? "danger" : "muted"} />
            <Stat value={data.counts.claimed} label="Claimed accounts" detail="Real customers, signed in" />
            <Stat value={data.counts.withPhone} label="Have a phone on file" detail="Unverified — no line check has run" tone="muted" />
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-t-xl border border-b-0 border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex flex-wrap gap-1.5">
              {chips.map(([value, label]) => (
                <button key={value} type="button" onClick={() => setTier(value)} aria-pressed={tier === value}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    tier === value ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-500 hover:border-gray-300"}`}>
                  {label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
              <input type="checkbox" checked={showNeverDelivered} onChange={(e) => setShowNeverDelivered(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-teal-600 focus:ring-teal-600" />
              Include {data.counts.neverDelivered} never-reached listings
            </label>
          </div>

          <div className="overflow-x-auto rounded-b-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-2.5 font-medium">Priority</th>
                  <th className="px-4 py-2.5 font-medium">Provider</th>
                  <th className="px-4 py-2.5 font-medium">What was lost</th>
                  <th className="px-4 py-2.5 text-right font-medium">Events</th>
                  <th className="px-4 py-2.5 font-medium">Cause</th>
                  <th className="px-4 py-2.5 text-right font-medium">Last</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    {data.counts.total === 0
                      ? "No provider has undelivered demand in this window."
                      : "Nothing in this filter. Try All, or include the never-delivered listings."}
                  </td></tr>
                )}
                {rows.map((p) => {
                  const cause = CAUSE_STYLE[p.cause];
                  const open = expanded === p.recipient;
                  return (
                    <tr key={p.recipient} onClick={() => setExpanded(open ? null : p.recipient)}
                      className={`cursor-pointer border-b border-gray-100 align-top last:border-b-0 hover:bg-gray-50 ${p.tier === "paid" ? "bg-red-50/40" : ""}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold ${TIER_STYLE[p.tier].cls}`}>
                          {TIER_STYLE[p.tier].label}
                        </span>
                        {p.claimed && <span className="mt-1 block text-[10px] font-semibold text-teal-700">CLAIMED</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{p.name}</span>
                        <span className="mt-0.5 block text-[11px] text-gray-400">{p.location || "—"}</span>
                        {open && (
                          <div className="mt-2 space-y-1 rounded-lg bg-gray-50 p-2.5 text-[11px] text-gray-600">
                            <div className="font-mono break-all text-gray-700">{p.recipient}</div>
                            <div>Phone: {p.phone ? <span className="font-mono">{p.phone}</span> : <span className="text-red-600">none on file</span>}</div>
                            <div>All-time: {p.history.delivered} delivered · {p.history.bounced} bounced · {p.history.complained} complained</div>
                            <div className="pt-1 font-medium text-gray-800">{cause.remedy}</div>
                            {p.slug && (
                              <Link href={`/admin/directory/${p.slug}`} onClick={(e) => e.stopPropagation()}
                                className="inline-block pt-1 font-semibold text-teal-700 hover:underline">
                                Open provider record →
                              </Link>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-600">
                        {Object.entries(p.lost).sort((a, b) => b[1] - a[1])
                          .map(([t, n]) => `${TYPE_LABEL[t] ?? t}${n > 1 ? `×${n}` : ""}`).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-gray-700">{p.lostCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-[10px] font-semibold ${cause.cls}`}>{cause.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-gray-500">{relative(p.lastLostAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
            Showing {rows.length} of {data.counts.total}. Listings that have never once received a message are hidden by
            default: they are a data-quality backlog rather than a queue a human works today. Providers who turned
            notifications off are excluded entirely — that is a choice, not a failure.
            Phone numbers come from the directory and are <span className="font-semibold">unverified</span> — no line-type
            check has been run against them.
          </p>
        </>
      )}
    </div>
  );
}
