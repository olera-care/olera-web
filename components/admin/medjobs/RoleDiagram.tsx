"use client";

import type { FunnelMetrics, StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  ArrowDefs,
  Arrow,
  HandoffRule,
  SiteHeader,
  StageBox,
  BottomLine,
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
  { key: "MA1", code: "O3", name: "Provider–care worker connected", dest: "portal" },
  { key: "MA3", code: "O4", name: "Hires confirmed", dest: "ma3" },
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
  const box = (st: Stage, greyed?: boolean) => (
    <StageBox
      key={st.code + st.x}
      stage={st}
      metric={metrics?.[st.key ?? st.code]}
      onJump={onJump}
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
          {box({ key: "PR1", code: "CP2B1", name: "MedJobs provider target list built", dest: "pr1", x: L, y: 62, w: W })}
          {box({ key: "ST1", code: "CW2A", name: "Student advisors targeted", dest: "st1", x: R, y: 62, w: W })}
          <Arrow x={L + 20} y1={106} y2={114} />
          <Arrow x={R + 20} y1={106} y2={114} />
          {box({ key: "PR-OUT", code: "CP2B2", name: "MedJobs outbound work", dest: "pr1", x: L, y: 116, w: W })}
          {box({ key: "ST-OUT", code: "CW2B", name: "Student advisors in outreach", dest: "st1", x: R, y: 116, w: W })}
          <HandoffRule y={186} text="HANDOFF · YOU → SALES LEAD" lanes={[[L, W], [R, W]]} />
          {box({ key: "PR2", code: "CP2B3", name: "MedJobs provider meetings held", dest: "booking", x: L, y: 196, w: W }, true)}
          {box({ key: "ST2", code: "CW2C", name: "Advisor meetings held", dest: "booking", x: R, y: 196, w: W }, true)}
        </>
      )}

      {role === "sales" && (
        <>
          <Lanes y={22} />
          <InBasket y={34} h={92} />
          {box({ key: "PR2", code: "CP2B3", name: "MedJobs provider meetings held", dest: "pr2", x: L, y: 62, w: W })}
          {box({ key: "ST2", code: "CW2C", name: "Advisor meetings held", dest: "st2", x: R, y: 62, w: W })}
          <HandoffRule y={148} text="HANDOFF · YOU → CONSUMER RELATIONS MANAGER" lanes={[[L, W], [R, W]]} />
          {box({ key: "PR3", code: "CP3C", name: "Provider staffing product signups", dest: "handoff", x: L, y: 160, w: W }, true)}
          {box(
            { key: "ST3-ST7", code: "CW2D–H", name: "University activation", dest: "after", x: R, y: 160, w: W },
            true,
          )}
        </>
      )}

      {role === "crm" && (
        <>
          <Lanes y={22} />
          {box({ key: "PR3", code: "CP3C", name: "Provider staffing product signups", dest: "pr3", x: L, y: 36, w: W })}
          {box(
            { key: "ST3-ST7", code: "CW2D–H", name: "University activation", dest: "st", x: R, y: 36, w: W },
          )}
          <Arrow x={L + 20} y1={80} y2={110} />
          <Arrow x={R + 20} y1={80} y2={110} />

          <rect x={30} y={112} width={900} height={200} rx={7} fill="#f9fafb" stroke="#eaecf0" />
          <text x={L} y={134} fontSize={12} fontWeight={700} fill="#334155" letterSpacing="0.5">
            PORTAL
          </text>
          {box({ key: "ST8", code: "CW3A", name: "Student applications initiated", dest: "portal", x: L, y: 146, w: W })}
          {box({ key: "QUAL", code: "CW3C", name: "Qualified student care worker applicants", dest: "portal", x: R, y: 146, w: W })}
          <Arrow x={480} y1={190} y2={222} />
          <text x={L} y={218} fontSize={12} fontWeight={700} fill="#64748b" letterSpacing="0.5">
            MATCH / FULFILMENT
          </text>
          {MATCH_CHAIN.map((m, i) =>
            box({ ...m, x: 44 + i * 436, y: 228, w: 420 }),
          )}

          {yields && outcomes ? <BottomLine y={328} yields={yields} outcomes={outcomes} showStats={showStats} /> : null}
        </>
      )}
      </g>
    </svg>
  );
}
