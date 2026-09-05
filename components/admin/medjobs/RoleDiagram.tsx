"use client";

import type { FunnelMetrics, StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  ArrowDefs,
  Arrow,
  HandoffRule,
  Legend,
  SiteHeader,
  StageBox,
  BottomLine,
  type Owner,
  type Stage,
} from "@/components/admin/medjobs/diagram-kit";

/**
 * The operating system filtered to one role: the steps that person owns, with
 * their trailing-30-day numbers, and one dashed step past each handoff so they
 * can see where their work goes.
 *
 * Drawn from the same kit as the System map, so colour, tooltips, the site
 * header and the way a number reads are identical across all four pages. The
 * grey In Basket container marks the steps worked inside the In Basket, which
 * is what tells the tech on duty where technology is involved.
 */

const L = 44;
const R = 490;
const W = 426;

function Lanes({ y }: { y: number }) {
  return (
    <>
      <text x={L} y={y} fontSize={12.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        PROVIDER SIDE
      </text>
      <text x={R} y={y} fontSize={12.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        CAREGIVER
      </text>
    </>
  );
}


/** The grey container marking steps worked in the In Basket. */
function InBasket({ y, h }: { y: number; h: number }) {
  return (
    <>
      <rect x={30} y={y} width={900} height={h} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={L} y={y + 18} fontSize={12} fontWeight={700} fill="#334155" letterSpacing="0.5">
        IN BASKET
      </text>
    </>
  );
}

/** An inbound marker: work arriving from the role above. */

/** The same five, in the same order, as the System map's match chain. */
const MATCH_CHAIN: Array<Omit<Stage, "x" | "y" | "w">> = [
  { code: "MA1", name: "Candidate intro", owner: "portal", dest: "portal" },
  { code: "MA2", name: "Interview held", owner: "portal", dest: "portal" },
  { code: "MA3", name: "Hire confirmed", owner: "usm", dest: "ma3" },
  { code: "MA4", name: "6+ shifts", owner: "usm", dest: "ma4" },
  { code: "MA5", name: "Bill issued", owner: "usm", dest: "ma5" },
];

type Props = {
  role: "admin" | "sales" | "crm";
  onJump: (dest: string) => void;
  metrics?: FunnelMetrics;
  yields?: { commercial: StageMetric; placement: StageMetric };
  /** Off hides every per-stage number, leaving the health dots. */
  showStats?: boolean;
  /** The site in view, which titles the header block. Null is the whole network. */
  site?: { name: string; logoUrl: string | null } | null;
  /** The bottom line's outcome figures. */
  outcomes?: {
    successfulStudents: number;
    revenue: number;
    instrumented: { successfulStudents: boolean; revenue: boolean };
  };
};

const LEGEND: Record<Props["role"], Owner[]> = {
  admin: ["admin", "sales"],
  sales: ["sales", "usm"],
  crm: ["usm", "portal"],
};

/** The header band above every role map, matching the System map's. */
const HEAD = 56;

const HEIGHT: Record<Props["role"], number> = { admin: 300, sales: 250, crm: 422 };

export default function RoleDiagram({
  role,
  onJump,
  metrics,
  yields,
  outcomes,
  showStats = true,
  site,
}: Props) {
  const box = (st: Stage, sub?: string, greyed?: boolean) => (
    <StageBox
      key={st.code + st.x}
      stage={st}
      metric={metrics?.[st.key ?? st.code]}
      onJump={onJump}
      sub={sub}
      greyed={greyed}
      showStats={showStats}
    />
  );

  return (
    <svg
      viewBox={`0 0 960 ${HEIGHT[role] + HEAD}`}
      width="100%"
      role="img"
      aria-label={`The MedJobs steps owned by the ${role} role`}
      className="block h-auto w-full"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif"
    >
      <ArrowDefs />

      {/* One site: a university and the providers around it */}
      <SiteHeader site={site} />

      {/* The map itself, dropped clear of the header. Every y below is the
          coordinate it had before the header existed. */}
      <g transform={`translate(0, ${HEAD})`}>
      {role === "admin" && (
        <>
          <Lanes y={22} />
          <InBasket y={32} h={222} />
          {box({ code: "PR1", name: "Target list built", owner: "admin", dest: "pr1", x: L, y: 62, w: W })}
          {box({ code: "ST1", name: "Target advisors", owner: "admin", dest: "st1", x: R, y: 62, w: W })}
          <Arrow x={L + 20} y1={106} y2={114} />
          <Arrow x={R + 20} y1={106} y2={114} />
          {box({ code: "PR-OUT", name: "Outbound work", owner: "admin", dest: "pr1", x: L, y: 116, w: W })}
          {box({ code: "ST-OUT", name: "University outbound", owner: "admin", dest: "st1", x: R, y: 116, w: W })}
          <HandoffRule y={186} text="HANDOFF · YOU → SALES LEAD" lanes={[[L, W], [R, W]]} />
          {box({ code: "PR2", name: "Provider meeting held", owner: "sales", dest: "booking", x: L, y: 196, w: W }, undefined, true)}
          {box({ code: "ST2", name: "Advisor meeting held", owner: "sales", dest: "booking", x: R, y: 196, w: W }, undefined, true)}
          <Legend y={276} owners={LEGEND.admin} />
        </>
      )}

      {role === "sales" && (
        <>
          <Lanes y={22} />
          <InBasket y={34} h={92} />
          {box({ code: "PR2", name: "Provider meeting held", owner: "sales", dest: "pr2", x: L, y: 62, w: W })}
          {box({ code: "ST2", name: "Advisor meeting held", owner: "sales", dest: "st2", x: R, y: 62, w: W })}
          <HandoffRule y={148} text="HANDOFF · YOU → CONSUMER RELATIONS MANAGER" lanes={[[L, W], [R, W]]} />
          {box({ code: "PR3", name: "Client success", owner: "usm", dest: "handoff", x: L, y: 160, w: W }, undefined, true)}
          {box(
            { key: "ST3-ST7", code: "ST3–ST7", name: "University activation", owner: "usm", dest: "after", x: R, y: 160, w: W },
            undefined,
            true,
          )}
          <Legend y={220} owners={LEGEND.sales} />
        </>
      )}

      {role === "crm" && (
        <>
          <Lanes y={22} />
          {box({ code: "PR3", name: "Client success", owner: "usm", dest: "pr3", x: L, y: 36, w: W })}
          {box(
            { key: "ST3-ST7", code: "ST3–ST7", name: "University activation", owner: "usm", dest: "st", x: R, y: 36, w: W },
          )}
          <Arrow x={L + 20} y1={80} y2={110} />
          <Arrow x={R + 20} y1={80} y2={110} />

          <rect x={30} y={112} width={900} height={200} rx={7} fill="#f9fafb" stroke="#eaecf0" />
          <text x={L} y={134} fontSize={12} fontWeight={700} fill="#334155" letterSpacing="0.5">
            PORTAL
          </text>
          {box({ code: "ST8", name: "Student application submitted", owner: "portal", dest: "portal", x: L, y: 146, w: W })}
          {box({ code: "QUAL", name: "Portal vets the application", owner: "portal", dest: "portal", x: R, y: 146, w: W })}
          <Arrow x={480} y1={190} y2={222} />
          <text x={L} y={218} fontSize={12} fontWeight={700} fill="#64748b" letterSpacing="0.5">
            MATCH / FULFILMENT
          </text>
          {MATCH_CHAIN.map((m, i) =>
            box({ ...m, x: 44 + i * 176, y: 228, w: 168 }),
          )}

          {yields && outcomes ? <BottomLine y={328} yields={yields} outcomes={outcomes} showStats={showStats} /> : null}
          <Legend y={388} owners={LEGEND.crm} />
        </>
      )}
      </g>
    </svg>
  );
}
