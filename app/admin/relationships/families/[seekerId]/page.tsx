"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ORIGIN_LABEL, EPISODE_WORD } from "@/lib/seeker-touches/present";
import type { PlanStep, RoutingPlan } from "@/lib/city-ads/plan.server";
import LogFamilyTouch from "@/components/admin/LogFamilyTouch";
import {
  SEEKER_FLAG_LABEL,
  type SeekerFlag,
  type SeekerRelationship,
  type SeekerTimelineItem,
} from "@/lib/seeker-touches/types";

/**
 * One family, every channel.
 *
 * Six facts across the top, then everything that has happened in order. Each row
 * says which table it came from, so a timeline you trust is one where every line
 * says how it knows — the same rule as the provider timeline.
 */

const PLAN_WORD: Record<RoutingPlan["state"], string> = {
  accepted: "taken",
  live: "with a provider now",
  scheduled: "scheduled",
  held: "held",
  exhausted: "nobody left",
  closed: "closed",
};
const PLAN_TONE: Record<RoutingPlan["state"], string> = {
  accepted: "text-emerald-700",
  live: "text-blue-700",
  scheduled: "text-gray-500",
  held: "text-amber-800",
  exhausted: "text-red-700",
  closed: "text-gray-400",
};
const STEP_WORD: Record<PlanStep["state"], string> = {
  accepted: "took it",
  declined: "declined",
  expired: "no answer",
  sent: "waiting on them",
  upcoming: "not sent yet",
};
const STEP_TONE: Record<PlanStep["state"], string> = {
  accepted: "text-emerald-700",
  declined: "text-gray-500",
  expired: "text-gray-500",
  sent: "text-blue-700",
  upcoming: "text-gray-400",
};

/** The relay runs on the city's clock, so the team should read the city's clock. */
const CITY_TZ: Record<string, string> = {
  "dallas-tx": "America/Chicago",
  "charlotte-nc": "America/New_York",
  "pascagoula-ms": "America/Chicago",
};
function cityTime(iso: string, slug: string | null): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: (slug && CITY_TZ[slug]) || "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

const FLAG_STYLE: Record<SeekerFlag, string> = {
  awaiting_reply: "bg-rose-50 text-rose-800",
  unreachable: "bg-red-50 text-red-700",
  opted_out: "bg-gray-100 text-gray-600",
  provider_silent: "bg-amber-50 text-amber-800",
  provider_no_show: "bg-amber-50 text-amber-800",
  never_human: "bg-gray-100 text-gray-600",
  no_name: "bg-gray-100 text-gray-500",
  promise_owed: "bg-orange-50 text-orange-800",
};

const KIND_LABEL: Record<SeekerTimelineItem["kind"], string> = {
  touch: "touch",
  email: "system",
  support: "support@",
  sms: "text in",
  inquiry: "inquiry",
  city: "city",
  activity: "on site",
};

const KIND_STYLE: Record<SeekerTimelineItem["kind"], string> = {
  touch: "bg-sky-50 text-sky-800",
  email: "bg-gray-100 text-gray-500",
  support: "bg-emerald-50 text-emerald-800",
  sms: "bg-emerald-50 text-emerald-800",
  inquiry: "bg-violet-50 text-violet-800",
  city: "bg-teal-50 text-teal-800",
  activity: "bg-gray-100 text-gray-500",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

/** What the route returns alongside the plan for a city lead. */
type Routing = {
  lead_id: string;
  status: string;
  can_route: boolean;
  qualification_reply: string | null;
  pool: { provider_id: string; name: string; position: number; enabled: boolean; already_offered: boolean }[];
  care_summary: string | null;
};

/**
 * Where this goes, and the controls to send it there.
 *
 * Calls are logged on this page and the lead used to be routable only from
 * /admin/city-ads, so a good call ended with a trip to another page and the
 * same sentence typed twice. The buttons post to the same /api/admin/city-ads
 * actions that page uses (qualify, offer_next, offer_to), so there is one
 * routing code path and nothing about how providers get offers changes.
 */
function RoutingPanel({
  plan,
  routing,
  citySlug,
  onRouted,
}: {
  plan: RoutingPlan;
  routing: Routing | null;
  citySlug: string | null;
  onRouted: () => void | Promise<void>;
}) {
  // Starts from the care details already recorded from calls: structured
  // fields, never the call notes, because this text reaches providers (see
  // careSummary in the route). Editable before it is saved.
  const [need, setNeed] = useState(() => routing?.care_summary ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  // "Save and route" answers the qualification hold. It does nothing useful
  // for a lead that every provider has already passed on, so it is not shown.
  const canQualify = Boolean(routing?.can_route) && plan.state === "held" && routing?.status !== "unfilled";
  const showCandidates = Boolean(routing?.can_route) && plan.state === "held" && plan.candidates.length > 0;

  async function act(body: Record<string, unknown>, fallback: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/city-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      // Every outcome startOrAdvance can return, named. A blanket "Offered."
      // would be false for most of them, and this line is the only thing that
      // tells the caller whether a provider was actually asked.
      const r = d.result as { action?: string; providerName?: string } | undefined;
      const said: Record<string, { tone: "ok" | "err"; text: string }> = {
        offered: { tone: "ok", text: `Offered to ${r?.providerName ?? "the provider"}.` },
        parked: { tone: "ok", text: "Saved. It goes to a provider when their morning opens." },
        unfilled: { tone: "err", text: "Nobody left on call who has not already seen it. Nothing was sent." },
        closed: { tone: "err", text: "This lead is closed or already taken. Nothing was sent." },
        held: { tone: "err", text: "Still held. Nothing was sent; the reason is above." },
        escalated: { tone: "err", text: "Still waiting on their reply. Nothing was sent." },
        noop: { tone: "err", text: "Nothing was sent. An offer may already be open, or they have opted out." },
      };
      setMsg(d.message ? { tone: "ok", text: d.message } : r?.action && said[r.action] ? said[r.action] : { tone: "ok", text: fallback });
      await onRouted();
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Did not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">Where this goes</p>
        <span className={`font-mono text-[10px] ${PLAN_TONE[plan.state]}`}>{PLAN_WORD[plan.state]}</span>
      </div>
      <p className="mt-1.5 text-sm text-gray-800">{plan.reason}</p>
      {plan.steps.length > 0 && (
        <ol className="mt-2.5 space-y-1">
          {plan.steps.map((st) => (
            <li key={`${st.position}-${st.providerId}`} className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-mono text-[11px] text-gray-400">{st.position}</span>
              <span className={st.state === "upcoming" ? "text-gray-500" : "text-gray-800"}>{st.providerName}</span>
              <span className="font-mono text-[11px] text-gray-400">
                {/* A projected time is marked, because an early accept or
                    decline moves everything after it earlier. */}
                {st.projected ? "~" : ""}
                {cityTime(st.at, citySlug)}
              </span>
              <span className={`font-mono text-[10px] ${STEP_TONE[st.state]}`}>{STEP_WORD[st.state]}</span>
            </li>
          ))}
        </ol>
      )}

      {canQualify && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <label htmlFor="routing-need" className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">
            What they need
          </label>
          {routing?.qualification_reply && (
            <p className="mt-1 text-[13px] text-gray-700">
              On file: &ldquo;{routing.qualification_reply}&rdquo;
            </p>
          )}
          <p className="mt-0.5 text-[12px] text-gray-500">
            The provider sees this as what the family told us, so keep it to who needs care, what kind, and where.
          </p>
          {routing?.care_summary && need === routing.care_summary && (
            <p className="mt-0.5 text-[12px] text-gray-500">Filled from the care details recorded on their calls.</p>
          )}
          <textarea
            id="routing-need"
            rows={3}
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            placeholder="What they told you on the phone: who needs care, what kind, and where"
            className="mt-1.5 w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm text-gray-900"
            disabled={busy}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy || !need.trim()}
              onClick={() => void act({ action: "qualify", leadId: routing!.lead_id, reply: need.trim() }, "Saved.")}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save and route"}
            </button>
            <span className="text-[12px] text-gray-500">Sends it to the first provider on call, 30 minutes each, in their morning hours.</span>
          </div>
        </div>
      )}

      {showCandidates && (
        <div className="mt-3">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">Next on call if routed</p>
          <ol className="mt-1.5 space-y-0.5">
            {plan.candidates.map((c, i) => (
              <li key={c.providerId} className="flex items-baseline gap-2 text-sm text-gray-700">
                <span className="font-mono text-[11px] text-gray-400">{i + 1}</span>
                {c.providerName}
              </li>
            ))}
          </ol>
        </div>
      )}

      {routing?.can_route && routing.pool.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void act({ action: "offer_next", leadId: routing.lead_id }, "Offered.")}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Offer to next
          </button>
          <select
            aria-label="Offer to a specific provider"
            value=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) void act({ action: "offer_to", leadId: routing.lead_id, providerId: e.target.value }, "Offered.");
            }}
            className="max-w-[18rem] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700"
          >
            <option value="">Offer to…</option>
            {routing.pool.map((p) => (
              <option key={p.provider_id} value={p.provider_id}>
                {p.name}
                {p.already_offered ? " (already offered)" : p.enabled ? "" : " (not on call)"}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-gray-500">
            Sends now, even outside their morning hours
            {plan.state === "held" ? " and before we know what they need" : ""}. Use Save and route unless you have a reason.
          </span>
        </div>
      )}

      {msg && (
        <p className={`mt-2 text-[13px] ${msg.tone === "ok" ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p>
      )}
    </div>
  );
}

/** "+18089406605" -> "(808) 940-6605". Anything else is shown as stored. */
function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

function Fact({ label, value, note, tone, className }: { label: string; value: string; note?: string | null; tone?: string; className?: string }) {
  return (
    <div className={`bg-white px-3.5 py-2.5 ${className ?? ""}`}>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${tone ?? "text-gray-900"}`}>{value}</p>
      {note && <p className="mt-0.5 font-mono text-[10.5px] text-gray-500">{note}</p>}
    </div>
  );
}

function AdminSeekerTimelineInner() {
  const { seekerId } = useParams<{ seekerId: string }>();
  // The list carries the view it was showing in ?back=, so both ways out of
  // this page land where you left. The browser button works on its own now
  // that the list keeps its filters in the URL; this is the same trip for the
  // link, which would otherwise always dump you on the unfiltered default.
  const backQuery = useSearchParams().get("back");
  const backHref = `/admin/relationships/families${backQuery ? `?${backQuery}` : ""}`;
  // The route returns the timeline plus the routing plan alongside it.
  const [data, setData] = useState<(SeekerRelationship & { plan?: RoutingPlan | null; routing?: Routing | null }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unarchiving, setUnarchiving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/seeker-touches?seeker=${seekerId}`);
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
    } catch {
      setError("Failed to load this family. Reload to try again.");
    }
  }, [seekerId]);

  const putBack = useCallback(async () => {
    setUnarchiving(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/seeker-archive", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seekerId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(json.error ?? "Could not put them back");
        return;
      }
      await load();
    } catch {
      setActionError("Could not put them back");
    } finally {
      setUnarchiving(false);
    }
  }, [seekerId, load]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-red-600">{error}</p>
        <Link href={backHref} className="mt-3 inline-block text-sm text-teal-700 hover:underline">
          ← Back to Care Seeker Relationships
        </Link>
      </div>
    );
  }

  if (!data) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-gray-400">Loading…</div>;
  }

  const { profile, reach, consent, episode, flags, providers, items, open_action: openAction } = data;
  const plan = data.plan ?? null;

  async function markActionDone(id: string) {
    setActionError(null);
    try {
      const res = await fetch("/api/admin/seeker-touches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: true }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error ?? "Could not mark that done");
      load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not mark that done");
    }
  }

  const consentLine =
    consent === "opted_out"
      ? { v: "Opted out", n: "no channel is open", tone: "text-red-700" }
      : consent === "olera_only"
        ? { v: "Olera only", n: "concierge city — we call them; providers hear from us, not them", tone: "text-amber-800" }
        : consent === "provider_ok"
          ? { v: "Providers OK", n: "they asked to be contacted", tone: "text-gray-900" }
          : { v: "No record", n: "treat as Olera only", tone: "text-gray-500" };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link href={backHref} className="text-xs text-teal-700 hover:underline">
        ← Care Seeker Relationships
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-b border-gray-200 pb-4">
        <h1
          className={`text-2xl ${profile.label_is_fallback ? "font-normal text-gray-600" : "font-semibold text-gray-950"}`}
        >
          {profile.label}
        </h1>
        <span className="font-mono text-[13px] text-gray-600">
          {[profile.phone ? formatPhone(profile.phone) : null, profile.email].filter(Boolean).join(" · ") || "no contact details"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {flags.map((f) => (
            <span key={f} className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${FLAG_STYLE[f]}`}>
              {SEEKER_FLAG_LABEL[f]}
            </span>
          ))}
          {/* You reach this page FROM the Archived tab, so the way back has to
              be here. Without it the only control was on a list this row no
              longer appears in. */}
          {data.archived && (
            <>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
                archived · {data.archived.reason.replace(/_/g, " ")}
              </span>
              <button
                type="button"
                disabled={unarchiving}
                onClick={() => void putBack()}
                className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700 hover:border-gray-500 disabled:opacity-50"
              >
                {unarchiving ? "Putting back…" : "Put back"}
              </button>
            </>
          )}
        </div>
      </div>

      {profile.situation && (
        <p className="mt-4 max-w-2xl border-l-2 border-gray-200 pl-3 text-[15px] italic leading-relaxed text-gray-700">
          “{profile.situation}”
        </p>
      )}

      {/* Five facts, five columns. In four, the missing cells showed the grid's
          grey gap colour as a slab across the page. */}
      <div className="mt-4 grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-5">
        <Fact
          label="Reachable by"
          value={reach.open.length ? reach.open.join(" + ") : "Nothing"}
          note={reach.note}
          tone={reach.open.length === 0 ? "text-red-700" : reach.note ? "text-amber-800" : "text-gray-900"}
        />
        <Fact label="Consent" value={consentLine.v} note={consentLine.n} tone={consentLine.tone} />
        <Fact
          label="Where it stands"
          // An archived family fell through to the episode word and read
          // "Open · day 1098" — the same false claim the list used to make,
          // on the page you land on from the Archived tab.
          value={data.archived ? "Archived" : episode.state === "waiting" ? `${episode.blocked_on} has it` : EPISODE_WORD[episode.state]}
          note={
            data.archived
              ? data.archived.reason.replace(/_/g, " ")
              : episode.closed_reason ?? (episode.age_days !== null ? `day ${episode.age_days + 1}` : null)
          }
          tone={data.archived ? "text-gray-500" : undefined}
        />
        {/* The list tags this and the page did not, so opening a family lost
            the one fact you most often open them to check. */}
        <Fact label="Came from" value={ORIGIN_LABEL[data.origin]} note={data.city_slug ?? null} />
        <Fact
          label="Timeline they gave"
          // The odd one out in two columns spans the row, so no grey cell.
          className="sm:col-span-2 lg:col-span-1"
          value={profile.timeline ? profile.timeline.replace(/_/g, " ") : "not stated"}
          note={profile.payment.length ? profile.payment.join(", ") : null}
        />
      </div>

      {/* WHERE IT GOES NEXT. The relay decides one provider at a time, thirty
          minutes apart, so until now a lead read "Open, day 1" while being two
          hours from going to three agencies. This is derived from the same pool
          the relay reads, so it cannot promise something different. */}
      {plan && (plan.steps.length > 0 || plan.state === "held" || data.routing?.can_route) && (
        <RoutingPanel plan={plan} routing={data.routing ?? null} citySlug={data.city_slug} onRouted={load} />
      )}

      {providers.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-gray-500">Providers holding a request</p>
          <ul className="mt-2 space-y-1">
            {providers.map((p) => (
              <li key={`${p.id}-${p.at}`} className="text-sm text-gray-800">
                {p.name}{" "}
                <span className={`font-mono text-[11px] ${p.responded ? "text-emerald-700" : "text-amber-800"}`}>
                  · {p.responded ? "replied" : "no reply"} · sent {fmt(p.at)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {openAction && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.11em] text-amber-700">What happens next</p>
            <p className="mt-0.5 text-[15px] text-gray-900">{openAction.text}</p>
            <p className="mt-0.5 font-mono text-[11px] text-amber-800">
              {openAction.due ? `due ${openAction.due}` : "no date"}
              {openAction.owner ? ` · ${openAction.owner}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => markActionDone(openAction.touch_id)}
            className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
          >
            Mark done
          </button>
          {actionError && <p className="w-full text-[13px] text-red-700">{actionError}</p>}
        </div>
      )}

      <div className="mt-4">
        <LogFamilyTouch seekerId={seekerId} onLogged={load} />
      </div>

      <h2 className="mt-7 font-mono text-[10px] uppercase tracking-[0.13em] text-gray-500">
        Everything, in order · {items.length} events
      </h2>

      <ol className="mt-2 border-l-2 border-gray-200">
        {items.length === 0 && <li className="py-6 pl-4 text-sm text-gray-400">Nothing on record.</li>}
        {items.map((it) => {
          const who = it.actor === "out" ? "You" : it.actor === "in" ? "Them" : "System";
          const bad = !!it.status && /fail|bounce|complain/i.test(it.status);
          const needs = it.status === "needs reply";
          return (
            <li key={it.id} className="relative grid gap-x-3 border-b border-gray-100 py-3 pl-4 last:border-b-0 sm:grid-cols-[110px_74px_1fr]">
              <span
                className={`absolute -left-[5px] top-[19px] h-2 w-2 rounded-full ${
                  bad ? "bg-red-500" : it.actor === "in" ? "bg-emerald-500" : it.actor === "out" ? "bg-sky-600" : "bg-gray-300"
                }`}
                aria-hidden="true"
              />
              <span className="font-mono text-[11px] leading-5 text-gray-500">{fmt(it.occurred_at)}</span>
              <span
                className={`h-fit w-fit rounded px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wide ${KIND_STYLE[it.kind]}`}
              >
                {KIND_LABEL[it.kind]}
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] leading-snug text-gray-900">
                  <span className="font-semibold">{who}:</span> {it.title}
                </p>
                {it.detail && <p className="mt-1 text-[13.5px] leading-snug text-gray-600">{it.detail}</p>}
                {it.status && (
                  <p
                    className={`mt-1 font-mono text-[11px] ${bad ? "text-red-700" : needs ? "text-rose-700" : "text-gray-500"}`}
                  >
                    {it.status}
                    {it.href && (
                      <>
                        {" · "}
                        <Link href={it.href} className="text-teal-700 hover:underline">
                          open →
                        </Link>
                      </>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 max-w-3xl font-mono text-[11px] leading-relaxed text-gray-400">
        Assembled at read time from seven sources. Only what you log by hand is stored here; everything else is
        derived from what already happened.
      </p>
    </div>
  );
}

export default function AdminSeekerTimelinePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-10 text-sm text-gray-400">Loading…</div>}>
      <AdminSeekerTimelineInner />
    </Suspense>
  );
}
