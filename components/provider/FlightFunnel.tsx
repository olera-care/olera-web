"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FlightFunnel } from "@/lib/ad-boost/flight-funnel.server";

/**
 * A flight, drawn one dot per person.
 *
 * WHY DOTS AND NOT A BAR CHART. The best flight this product has ever run went
 * 391 impressions -> 18 clicks -> 7 arrivals. On a proportional bar chart the
 * second stage is a sliver and the third is invisible; on a log or sqrt scale
 * the widths stop meaning anything and we would be easing a number we are asking
 * a provider to trust. One dot per person is legible at 7 and at 400, and a
 * provider can count the survivors, which is the whole point.
 *
 * TENSE FOLLOWS STATUS. A live flight asks the provider to fix something while
 * there is still traffic to catch; an ended flight is a receipt and asks whether
 * to run another. The same numbers read as an accusation in the present tense
 * and as a record in the past tense, so this is not cosmetic.
 *
 * STAGES WITH NO TRUSTED DATA ARE OMITTED, NOT ZEROED. If Google's figures were
 * never synced for a flight, `trustedTop` is false and the saw/clicked rows do
 * not render at all. Drawing them as 0 would tell a provider nobody saw their ad
 * when the truth is that nobody measured it.
 */

/** Above this, one dot stops meaning one person and we say so. */
const MAX_DOTS = 420;

interface Stage {
  key: string;
  n: number;
  label: string;
  aside?: string;
  lit: boolean;
  /** People lost between the stage above and this one. */
  lostLabel?: string;
}

function money(cents: number | null): string {
  if (cents == null) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

function Dots({
  total,
  lit,
  perRow,
  dim,
  animate,
}: {
  total: number;
  lit: boolean;
  perRow: number;
  dim: string;
  animate: boolean;
}) {
  const scale = total > MAX_DOTS ? Math.ceil(total / MAX_DOTS) : 1;
  const drawn = Math.max(0, Math.min(total, Math.ceil(total / scale)));
  const gap = 11.6;
  const rows = Math.max(1, Math.ceil(drawn / perRow));
  const height = rows * gap + 6;

  const circles = useMemo(() => {
    const out: { cx: number; cy: number }[] = [];
    for (let i = 0; i < drawn; i++) {
      out.push({ cx: 5 + (i % perRow) * gap, cy: 7 + Math.floor(i / perRow) * gap });
    }
    return out;
  }, [drawn, perRow]);

  return (
    <svg
      viewBox={`0 0 ${perRow * gap + 6} ${height}`}
      className="block w-full h-auto overflow-visible"
      aria-hidden="true"
    >
      {circles.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={lit ? 3.4 : 2.3}
          fill={lit ? "#E8C56A" : dim}
          opacity={animate ? 0 : lit ? 1 : 0.5}
          style={{
            transition: "opacity .45s ease-out",
            animation: animate
              ? `flightDot .45s ease-out ${Math.min(i * (lit ? 26 : 1.8), 1400)}ms forwards`
              : undefined,
          }}
        />
      ))}
    </svg>
  );
}

export default function FlightFunnelCard({ flight }: { flight: FlightFunnel }) {
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    // Only animate once it is actually on screen, so a provider who scrolls down
    // to it sees the dots arrive rather than finding them already there.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setAnimate(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ended = flight.status === "ended";
  const { impressions, clicks, arrived, engaged, called, trustedTop } = flight;

  const stages: Stage[] = [];
  if (trustedTop && impressions != null) {
    stages.push({
      key: "saw",
      n: impressions,
      label: "saw your ad on Google",
      aside: money(flight.spendCents) ? `${money(flight.spendCents)} spent` : undefined,
      lit: false,
    });
  }
  if (trustedTop && clicks != null) {
    const ctr = impressions && impressions > 0 ? (clicks / impressions) * 100 : null;
    stages.push({
      key: "clicked",
      n: clicks,
      label: "chose your home out of everything on the page",
      aside: ctr != null ? `${ctr.toFixed(1)}%` : undefined,
      lit: true,
      lostLabel:
        impressions != null ? `${impressions - clicks} weren't looking for care` : undefined,
    });
  }
  stages.push({
    key: "arrived",
    n: arrived,
    label: "reached your page",
    lit: true,
    lostLabel:
      clicks != null && clicks > arrived ? `${clicks - arrived} we couldn't follow all the way` : undefined,
  });
  stages.push({
    key: "engaged",
    n: engaged,
    label: "started reaching out",
    lit: true,
    lostLabel: arrived > engaged ? `${arrived - engaged} read it and weren't ready yet` : undefined,
  });
  stages.push({
    key: "called",
    n: called,
    label: ended ? "got in touch" : "have got in touch",
    aside: called === 0 ? "your next flight starts here" : undefined,
    lit: called > 0,
    lostLabel: engaged > called ? `${engaged - called} stopped partway` : undefined,
  });

  const headlineN = clicks ?? arrived;
  const headline =
    called > 0
      ? ended
        ? `Your ${flight.campaignTag.includes("-") ? "last" : ""} flight brought you ${called} ${called === 1 ? "family" : "families"}.`
        : `${called} ${called === 1 ? "family has" : "families have"} got in touch.`
      : ended
        ? `Your last flight brought ${headlineN} ${headlineN === 1 ? "family" : "families"} to your door.`
        : `${headlineN} ${headlineN === 1 ? "family has" : "families have"} gone looking for you.`;

  // The verdict names ONE stage. Ranked by which gap is both largest and most
  // actionable by the provider -- never by which number is smallest.
  const verdict =
    called > 0
      ? { line: "This is working.", why: "Families found you and reached out. The next flight starts from a higher base." }
      : arrived > 0 && engaged === 0
        ? {
            line: "The expensive part already worked.",
            why: "People reached your page and none of them started reaching out. Photos of your home and answers to the questions families have asked are the two things they look for first.",
          }
        : engaged > 0
          ? {
              line: "They got close.",
              why: "Families started reaching out and stopped partway. That is usually a missing phone number or an unanswered question.",
            }
          : {
              line: "Too early to say.",
              why: "Not enough people have arrived yet to tell you anything useful. Check back in a few days.",
            };

  return (
    <div ref={ref} className="rounded-2xl bg-[#14120F] p-6 sm:p-7 text-[#F3EEE4]">
      <style>{`@keyframes flightDot{to{opacity:var(--o,1)}}`}</style>

      <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#5C544A]">
        {ended ? "Flight complete" : "Flight running"}
        {flight.flightEnd ? ` · ends ${flight.flightEnd}` : ""}
      </div>

      <h3 className="mt-3 font-serif text-[26px] sm:text-[30px] leading-[1.12] font-normal">
        {headline}
      </h3>
      {flight.spendCents != null && (
        <p className="mt-2 text-[14px] text-[#9A9086]">
          For {money(flight.spendCents)}. Every dot below is one person.
        </p>
      )}

      <div className="mt-6">
        {stages.map((s, i) => (
          <div key={s.key}>
            {s.lostLabel && (
              <div className="flex items-center gap-2 py-2 text-[11.5px] text-[#5C544A]">
                <span className="h-px flex-1 bg-[#2A251E]" />
                <span className="font-mono">{s.lostLabel}</span>
                <span className="h-px flex-1 bg-[#2A251E]" />
              </div>
            )}
            <div className={i === 0 ? "" : ""}>
              <div className="mb-2 flex flex-wrap items-baseline gap-3">
                <span
                  className="font-mono text-[23px] leading-none tabular-nums"
                  style={{ color: s.n === 0 ? "#9A9086" : s.lit ? "#E8C56A" : "#F3EEE4" }}
                >
                  {s.n}
                </span>
                <span className="text-[13.5px] text-[#9A9086]">{s.label}</span>
                {s.aside && (
                  <span className="ml-auto font-mono text-[10.5px] tabular-nums text-[#5C544A]">
                    {s.aside}
                  </span>
                )}
              </div>
              {s.n > 0 && (
                <Dots total={s.n} lit={s.lit} perRow={52} dim="#5C544A" animate={animate} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 border-t border-[#2A251E] pt-5">
        <p className="m-0 font-serif text-[21px] leading-[1.3]">{verdict.line}</p>
        <p className="mt-3 max-w-[52ch] text-[13.5px] text-[#9A9086]">{verdict.why}</p>
      </div>

      {flight.metricsUpdatedAt && (
        <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.06em] text-[#5C544A]">
          Ad figures from Google Ads · on-page figures from Olera
        </div>
      )}
    </div>
  );
}
