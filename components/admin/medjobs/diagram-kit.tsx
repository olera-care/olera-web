"use client";

import type { StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  bandText,
  HEALTH_ORDER,
  THRESHOLDS,
  UNSCORED_NEXT,
  type Health,
} from "@/lib/medjobs/funnel-health";

/**
 * The pieces every MedJobs operating-system diagram is drawn from: the System
 * map and the three role views. Shared so the four cannot drift apart in
 * colour, wording or how a number is read.
 */

/**
 * Health colour. The only place green, yellow and red appear, now that
 * ownership is a single teal scale. Values come from the design system's own
 * semantic scales rather than a generic dashboard palette: success / warning / error in
 * tailwind.config.ts, which is where every other status in the product reads
 * from. `unscored` is deliberately quiet — a stage we cannot measure should
 * not compete for attention with one that is failing.
 */
export const HEALTH: Record<Health, { dot: string; fill: string; stroke: string; ink: string; label: string }> = {
  green: { dot: "#12B76A", fill: "#ECFDF3", stroke: "#A6F4C5", ink: "#027A48", label: "Green" },
  yellow: { dot: "#F79009", fill: "#FFFAEB", stroke: "#FEDF89", ink: "#B54708", label: "Yellow" },
  red: { dot: "#F04438", fill: "#FEF3F2", stroke: "#FECDCA", ink: "#B42318", label: "Red" },
  unscored: { dot: "#D0D5DD", fill: "#F9FAFB", stroke: "#EAECF0", ink: "#667085", label: "Not scored" },
};

/**
 * Ownership, as one teal scale from the brand's primary palette. Four steps of
 * the same colour rather than four different hues, so that anything on the map
 * which is not teal is a health state.
 */
export const OWNERS = {
  admin: { fill: "#f4fafa", stroke: "#d8edec", ink: "#417272", label: "Admin Team" },
  sales: { fill: "#edf7f7", stroke: "#bee0e0", ink: "#385e5e", label: "Sales Lead" },
  usm: { fill: "#d8edec", stroke: "#96c8c8", ink: "#1a3030", label: "Consumer Relations Manager" },
  portal: { fill: "#f9fafb", stroke: "#eaecf0", ink: "#475467", label: "Portal" },
} as const;

export type Owner = keyof typeof OWNERS;


export interface Stage {
  /** Key into the metrics map. Defaults to `code`. */
  key?: string;
  code: string;
  name: string;
  owner: Owner;
  dest: string;
  x: number;
  y: number;
  w: number;
  h?: number;
}

/** `18 / 30 = 60%`, or the throughput number alone when there is no denominator. */
export function readMetric(m: StageMetric) {
  // A stage can carry both a count and a gap: MA4 and MA5 show the structure
  // with a zero in it, so the shape of the bottom of the funnel is visible
  // before the instrumentation that fills it exists.
  if (m.gap) return { text: m.x == null ? "not instrumented" : String(m.x), gap: true };
  if (m.x == null) return null;
  if (m.y == null) return { text: `${m.x}`, gap: false };
  const pct = m.y > 0 ? Math.round((m.x / m.y) * 100) : null;
  return { text: `${m.x} / ${m.y}${pct == null ? "" : ` = ${pct}%`}`, gap: false };
}

/**
 * The hover text. Four short lines: the state and the number, what the two
 * numbers are, where the bands sit, and the next action. Plain words, because
 * it is read at a glance by whoever is on duty, not studied.
 */
export function metricTitle(stageKey: string, code: string, name: string, m: StageMetric) {
  const t = THRESHOLDS[stageKey];
  const lines: string[] = [`${code} · ${name}`];

  if (m.gap) {
    const g = UNSCORED_NEXT[stageKey];
    lines.push("Not tracked yet", "");
    if (g) lines.push(g.why, `To fix: ${g.fix}`);
    return lines.join("\n");
  }

  const state = m.health && m.health !== "unscored" ? HEALTH_ORDER[m.health] : "Not scored";
  if (m.y != null && m.x != null) {
    const pct = m.y > 0 ? ` (${Math.round((m.x / m.y) * 100)}%)` : "";
    lines.push(`${state} · ${m.x} of ${m.y}${pct}`);
  } else if (m.x != null) {
    lines.push(`${state} · ${m.x}`);
  }

  lines.push("");
  if (t) lines.push(t.what, bandText(t), `Do next: ${t.improve}`);
  if (m.networkWide) lines.push("All sites. This one cannot be split by school.");
  return lines.join("\n");
}

/**
 * One stage. Greyed stages are the neighbours just past a handoff, drawn on a
 * role view so the reader sees where their work goes; they carry no metric and
 * are not clickable, because they are not that person's step.
 */
export function StageBox({
  stage,
  metric,
  onJump,
  sub,
  greyed,
  showStats = true,
}: {
  stage: Stage;
  metric?: StageMetric;
  onJump?: (dest: string) => void;
  sub?: string;
  greyed?: boolean;
  /** Off hides the number and leaves the health dot, which is the summary. */
  showStats?: boolean;
}) {
  const s = stage;
  const o = OWNERS[s.owner];
  const h = s.h ?? 44;
  const read = greyed || !showStats ? null : metric ? readMetric(metric) : null;
  const jump = greyed ? undefined : onJump;
  return (
    <g
      role={jump ? "button" : undefined}
      tabIndex={jump ? 0 : undefined}
      aria-label={`${s.code} ${s.name}`}
      onClick={jump ? () => jump(s.dest) : undefined}
      onKeyDown={
        jump
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                jump(s.dest);
              }
            }
          : undefined
      }
      className={
        jump
          ? "cursor-pointer [&>rect]:transition-[filter] hover:[&>rect]:brightness-95 focus:outline-none focus-visible:[&>rect]:stroke-primary-500"
          : undefined
      }
    >
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={h}
        rx={5}
        fill={greyed ? "#fafafa" : o.fill}
        stroke={greyed ? "#e5e7eb" : o.stroke}
        strokeDasharray={greyed ? "4 3" : undefined}
      />
      {!greyed && showStats && metric?.health ? (
        <g>
          {!read ? <title>{metricTitle(s.key ?? s.code, s.code, s.name, metric)}</title> : null}
          <circle cx={s.x + 13} cy={s.y + 16} r={4.5} fill={HEALTH[metric.health].dot} />
        </g>
      ) : null}
      <text
        x={s.x + (!greyed && showStats && metric?.health ? 25 : 12)}
        y={s.y + 21}
        fontSize={s.w < 200 ? 14 : 16}
        fontWeight={700}
        fill={greyed ? "#9ca3af" : o.ink}
      >
        {s.code}
      </text>
      <text x={s.x + (!greyed && showStats && metric?.health ? 25 : 12)} y={s.y + 39} fontSize={s.w < 200 ? 12 : 13.5} fill={greyed ? "#9ca3af" : "#374151"}>
        {s.name}
      </text>
      {sub ? (
        <text x={s.x + (!greyed && showStats && metric?.health ? 25 : 12)} y={s.y + 56} fontSize={12} fill={greyed ? "#b0b6be" : "#6b7280"}>
          {sub}
        </text>
      ) : null}
      {read && metric ? (
        <>
          <title>{metricTitle(s.key ?? s.code, s.code, s.name, metric)}</title>
          <text
            x={s.x + s.w - 12}
            y={s.y + 21}
            fontSize={read.gap ? 11 : s.w < 200 ? 12 : 15}
            fontWeight={read.gap ? 400 : 700}
            fontStyle={read.gap ? "italic" : undefined}
            textAnchor="end"
            fill={read.gap ? "#94a3b8" : "#0f172a"}
          >
            {read.text}
          </text>
        </>
      ) : null}
    </g>
  );
}

/** The arrowhead marker every diagram's connectors point with. */
export function ArrowDefs() {
  return (
    <defs>
      <marker id="tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0 0 L8 4 L0 8 z" fill="#cbd5e1" />
      </marker>
    </defs>
  );
}

export function Arrow({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return <line x1={x} y1={y1} x2={x} y2={y2} stroke="#cbd5e1" strokeWidth={1.5} markerEnd="url(#tip)" />;
}

/** A dashed rule naming a handoff, across one or both lanes. */
export function HandoffRule({ y, text, lanes }: { y: number; text: string; lanes: Array<[number, number]> }) {
  return (
    <>
      {lanes.map(([x, w]) => (
        <g key={x}>
          <line x1={x} y1={y} x2={x + w} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
          <text x={x} y={y - 5} fontSize={9.5} fontWeight={600} fill="#94a3b8" letterSpacing="0.4">
            {text}
          </text>
        </g>
      ))}
    </>
  );
}

/** The ownership key. Same four, same order, on every diagram that shows it. */
export function Legend({ y, owners }: { y: number; owners: Owner[] }) {
  return (
    <>
      {owners.map((k, i) => (
        <g key={k}>
          <rect x={44 + i * 190} y={y} width={11} height={11} rx={2} fill={OWNERS[k].fill} stroke={OWNERS[k].stroke} />
          <text x={63 + i * 190} y={y + 10} fontSize={11.5} fill="#475569">
            {OWNERS[k].label}
          </text>
        </g>
      ))}
    </>
  );
}

/** Money and people, formatted the way an operator reads them. */
function money(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${n}`;
}

/**
 * The bottom line: yield, then what the funnel actually produced. Outcomes sit
 * on the same line as the yield so the reader gets rate and result together.
 * A figure awaiting instrumentation shows its zero in grey with the reason on
 * hover, rather than being hidden.
 */
export function BottomLine({
  y,
  yields,
  outcomes,
  showStats = true,
}: {
  y: number;
  yields: { commercial: StageMetric; placement: StageMetric };
  outcomes: {
    successfulStudents: number;
    revenue: number;
    instrumented: { successfulStudents: boolean; revenue: boolean };
  };
  /** Yield is a rate, so it follows the stats switch. The two outcomes do not. */
  showStats?: boolean;
}) {
  // The two results are what the funnel is for, so they sit centred and heavy
  // on the right where the eye lands last.
  const figure = (cx: number, label: string, value: string, live: boolean, why: string) => (
    <g>
      <title>{live ? `${label}: ${value}.` : `${label}: not tracked yet. ${why}`}</title>
      <rect x={cx - 110} y={y + 4} width={220} height={40} fill="transparent" />
      <text x={cx} y={y + 20} fontSize={11} fontWeight={600} fill="#64748b" textAnchor="middle" letterSpacing="0.3">
        {label}
      </text>
      <text
        x={cx}
        y={y + 40}
        fontSize={20}
        fontWeight={700}
        fill={live ? "#1a3030" : "#98A2B3"}
        textAnchor="middle"
      >
        {value}
      </text>
    </g>
  );

  return (
    <>
      <line x1={44} y1={y} x2={916} y2={y} stroke="#e2e8f0" strokeWidth={1} />
      {showStats ? (
        <g>
          <title>{metricTitle("YIELD", "Funnel yield", "Clients per meeting held", yields.commercial)}</title>
          <rect x={38} y={y + 6} width={220} height={28} fill="transparent" />
          <text x={44} y={y + 26} fontSize={10.5} fontWeight={700} fill="#64748b" letterSpacing="0.5">
            YIELD
          </text>
          <text x={96} y={y + 26} fontSize={14} fontWeight={700} fill="#1a3030">
            {readMetric(yields.commercial)?.text ?? "not available"}
          </text>
        </g>
      ) : null}
      {figure(
        620,
        "Successful students",
        String(outcomes.successfulStudents),
        outcomes.instrumented.successfulStudents,
        "We cannot tell yet when a student finishes a placement.",
      )}
      {figure(
        832,
        "Revenue generated",
        money(outcomes.revenue),
        outcomes.instrumented.revenue,
        "Payments are never recorded.",
      )}
    </>
  );
}
