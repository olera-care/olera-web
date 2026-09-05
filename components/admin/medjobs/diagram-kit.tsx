"use client";

import type { StageMetric } from "@/lib/medjobs/funnel-30d";

/**
 * The pieces every MedJobs operating-system diagram is drawn from: the System
 * map and the three role views. Shared so the four cannot drift apart in
 * colour, wording or how a number is read.
 */

export const OWNERS = {
  admin: { fill: "#eff6ff", stroke: "#bfdbfe", ink: "#1e40af", label: "Admin Team" },
  sales: { fill: "#fffbeb", stroke: "#fde68a", ink: "#92400e", label: "Sales Lead" },
  usm: { fill: "#ecfdf5", stroke: "#a7f3d0", ink: "#065f46", label: "User Success Manager" },
  portal: { fill: "#f8fafc", stroke: "#e2e8f0", ink: "#334155", label: "Portal" },
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

export /** `18 / 30 = 60%`, or the throughput number alone when there is no denominator. */
function readMetric(m: StageMetric) {
  if (m.gap) return { text: "not instrumented", gap: true };
  if (m.x == null) return null;
  if (m.y == null) return { text: `${m.x}`, gap: false };
  const pct = m.y > 0 ? Math.round((m.x / m.y) * 100) : null;
  return { text: `${m.x} / ${m.y}${pct == null ? "" : ` = ${pct}%`}`, gap: false };
}

export const KIND_LABEL: Record<string, string> = {
  conversion: "CONVERSION",
  coverage: "COVERAGE (not a conversion rate)",
  throughput: "THROUGHPUT (a count, not a rate)",
  gap: "NOT INSTRUMENTED",
};

/**
 * The hover text. Four lines, in the order a reader needs them: what kind of
 * number this is, the arithmetic spelled out in words, how to interpret it,
 * and any caveat. Naming the kind first is the point — a coverage number read
 * as a conversion rate says the opposite of what it means.
 */
export function metricTitle(stage: string, name: string, m: StageMetric) {
  const lines = [`${stage} · ${name}`, KIND_LABEL[m.kind] ?? ""];
  if (m.gap) {
    lines.push(m.gap);
    return lines.filter(Boolean).join("\n");
  }
  const join = (...bits: Array<string | number | undefined>) =>
    bits.filter((b) => b !== undefined && b !== "").join(" ");
  if (m.y != null && m.x != null) {
    const pct = m.y > 0 ? Math.round((m.x / m.y) * 100) : null;
    lines.push(
      join(m.x, m.xLabel, "out of", m.y, m.yLabel) + (pct == null ? "." : ` = ${pct}%.`),
    );
  } else if (m.x != null) {
    lines.push(join(m.x, m.xLabel, "in the last 30 days."));
  }
  if (m.reads) lines.push(m.reads);
  if (m.note) lines.push(`Caveat: ${m.note}`);
  return lines.filter(Boolean).join("\n");
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
}: {
  stage: Stage;
  metric?: StageMetric;
  onJump?: (dest: string) => void;
  sub?: string;
  greyed?: boolean;
}) {
  const s = stage;
  const o = OWNERS[s.owner];
  const h = s.h ?? 44;
  const read = greyed ? null : metric ? readMetric(metric) : null;
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
          ? "cursor-pointer [&>rect]:transition-[filter] hover:[&>rect]:brightness-95 focus:outline-none focus-visible:[&>rect]:stroke-emerald-500"
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
      <text x={s.x + 12} y={s.y + 19} fontSize={12.5} fontWeight={700} fill={greyed ? "#9ca3af" : o.ink}>
        {s.code}
      </text>
      <text x={s.x + 12} y={s.y + 35} fontSize={11.5} fill={greyed ? "#9ca3af" : "#374151"}>
        {s.name}
      </text>
      {sub ? (
        <text x={s.x + 12} y={s.y + 53} fontSize={10} fill={greyed ? "#b0b6be" : "#6b7280"}>
          {sub}
        </text>
      ) : null}
      {read && metric ? (
        <>
          <title>{metricTitle(s.code, s.name, metric)}</title>
          <text
            x={s.x + s.w - 12}
            y={s.y + 19}
            fontSize={read.gap ? 9 : s.w < 200 ? 10.5 : 12}
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
          <text x={61 + i * 190} y={y + 9} fontSize={10} fill="#475569">
            {OWNERS[k].label}
          </text>
        </g>
      ))}
    </>
  );
}

/** Funnel yield: the two ratios that are honest today, each with its tooltip. */
export function YieldStrip({
  y,
  yields,
}: {
  y: number;
  yields: { commercial: StageMetric; placement: StageMetric };
}) {
  return (
    <>
      <line x1={44} y1={y} x2={916} y2={y} stroke="#e2e8f0" strokeWidth={1} />
      <text x={44} y={y + 20} fontSize={9.5} fontWeight={700} fill="#64748b" letterSpacing="0.5">
        FUNNEL YIELD
      </text>
      <g>
        <title>{metricTitle("Funnel yield", "Commercial conversion", yields.commercial)}</title>
        <rect x={126} y={y + 6} width={220} height={20} fill="transparent" />
        <text x={132} y={y + 20} fontSize={10.5} fill="#475569">
          Commercial conversion
        </text>
        <text x={272} y={y + 20} fontSize={12} fontWeight={700} fill="#0f172a">
          {readMetric(yields.commercial)?.text ?? ""}
        </text>
      </g>
      <g>
        <title>{metricTitle("Funnel yield", "Placement yield", yields.placement)}</title>
        <rect x={464} y={y + 6} width={220} height={20} fill="transparent" />
        <text x={470} y={y + 20} fontSize={10.5} fill="#475569">
          Placement yield
        </text>
        <text x={572} y={y + 20} fontSize={12} fontWeight={700} fill="#0f172a">
          {readMetric(yields.placement)?.text ?? ""}
        </text>
      </g>
      <text x={916} y={y + 40} fontSize={9} fill="#94a3b8" textAnchor="end">
        Both against provider meetings held. Revenue yield needs MA4 and MA5 instrumented.
      </text>
    </>
  );
}
