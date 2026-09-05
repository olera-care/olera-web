"use client";

import type { FunnelMetrics, StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  ArrowDefs,
  Arrow,
  HandoffRule,
  Legend,
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
 * Drawn from the same kit as the System map, so colour, tooltips and the way a
 * number reads are identical across all four pages. The grey ADMIN PANEL
 * container marks the steps worked inside the In Basket, which is what tells
 * the tech on duty where technology is involved.
 */

const L = 44;
const R = 490;
const W = 426;

function Lanes({ y }: { y: number }) {
  return (
    <>
      <text x={L} y={y} fontSize={10.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        PROVIDER SIDE
      </text>
      <text x={R} y={y} fontSize={10.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        STUDENT / UNIVERSITY SIDE
      </text>
    </>
  );
}

function Window({ y }: { y: number }) {
  return (
    <text x={916} y={y} fontSize={9.5} fontWeight={700} fill="#0f172a" textAnchor="end" letterSpacing="0.5">
      LAST 30 DAYS
    </text>
  );
}

/** The grey container marking steps worked in the admin panel. */
function AdminPanel({ y, h }: { y: number; h: number }) {
  return (
    <>
      <rect x={30} y={y} width={900} height={h} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={L} y={y + 18} fontSize={10} fontWeight={700} fill="#334155" letterSpacing="0.5">
        ADMIN PANEL
      </text>
      <text x={134} y={y + 18} fontSize={10} fill="#64748b">
        every step here is worked in the In Basket
      </text>
    </>
  );
}

/** An inbound marker: work arriving from the role above. */
function Inbound({ y, text }: { y: number; text: string }) {
  return (
    <>
      <line x1={L} y1={y} x2={916} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
      <text x={L} y={y - 5} fontSize={9.5} fontWeight={600} fill="#94a3b8" letterSpacing="0.4">
        {text}
      </text>
    </>
  );
}

type Props = {
  role: "admin" | "sales" | "crm";
  onJump: (dest: string) => void;
  metrics?: FunnelMetrics;
  yields?: { commercial: StageMetric; placement: StageMetric };
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

const HEIGHT: Record<Props["role"], number> = { admin: 330, sales: 296, crm: 520 };

export default function RoleDiagram({ role, onJump, metrics, yields, outcomes }: Props) {
  const box = (st: Stage, sub?: string, greyed?: boolean) => (
    <StageBox
      key={st.code + st.x}
      stage={st}
      metric={metrics?.[st.key ?? st.code]}
      onJump={onJump}
      sub={sub}
      greyed={greyed}
    />
  );

  return (
    <svg
      viewBox={`0 0 960 ${HEIGHT[role]}`}
      width="100%"
      role="img"
      aria-label={`The MedJobs steps owned by the ${role} role`}
      className="block h-auto w-full"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif"
    >
      <ArrowDefs />
      <Window y={22} />

      {role === "admin" && (
        <>
          <Lanes y={22} />
          <AdminPanel y={32} h={240} />
          {box({ code: "PR1", name: "Target list built", owner: "admin", dest: "pr1", x: L, y: 62, w: W })}
          {box({ code: "ST1", name: "Target advisors", owner: "admin", dest: "st1", x: R, y: 62, w: W })}
          <Arrow x={L + 20} y1={106} y2={114} />
          <Arrow x={R + 20} y1={106} y2={114} />
          {box({ code: "PR-OUT", name: "Outbound work", owner: "admin", dest: "pr1", x: L, y: 116, w: W })}
          {box({ code: "ST-OUT", name: "University outbound", owner: "admin", dest: "st1", x: R, y: 116, w: W })}
          <text x={L + 20} y={178} fontSize={10.5} fill="#475569">
            Book the 30-minute slot
          </text>
          <text x={R + 20} y={178} fontSize={10.5} fill="#475569">
            Book the 30-minute slot
          </text>
          <HandoffRule y={204} text="HANDOFF · YOU → SALES LEAD" lanes={[[L, W], [R, W]]} />
          {box({ code: "PR2", name: "Provider meeting held", owner: "sales", dest: "booking", x: L, y: 214, w: W }, undefined, true)}
          {box({ code: "ST2", name: "Advisor meeting held", owner: "sales", dest: "booking", x: R, y: 214, w: W }, undefined, true)}
          <Legend y={298} owners={LEGEND.admin} />
        </>
      )}

      {role === "sales" && (
        <>
          <Lanes y={22} />
          <Inbound y={46} text="IN · FROM THE ADMIN TEAM, AT THE BOOKED MEETING" />
          <AdminPanel y={56} h={94} />
          {box({ code: "PR2", name: "Provider meeting held", owner: "sales", dest: "pr2", x: L, y: 86, w: W })}
          {box({ code: "ST2", name: "Advisor meeting held", owner: "sales", dest: "st2", x: R, y: 86, w: W })}
          <HandoffRule y={172} text="HANDOFF · YOU → USER SUCCESS MANAGER" lanes={[[L, W], [R, W]]} />
          {box({ code: "PR3", name: "Client success", owner: "usm", dest: "handoff", x: L, y: 184, w: W, h: 58 }, "Profile, terms, account setup", true)}
          {box(
            { key: "ST3-ST7", code: "ST3–ST7", name: "University activation", owner: "usm", dest: "after", x: R, y: 184, w: W, h: 58 },
            "You stay in for ST5 events and ST7 professors",
            true,
          )}
          <Legend y={260} owners={LEGEND.sales} />
        </>
      )}

      {role === "crm" && (
        <>
          <Lanes y={22} />
          <Inbound y={46} text="IN · FROM THE SALES LEAD, ONCE THE OUTCOME IS LOGGED" />
          {box({ code: "PR3", name: "Client success", owner: "usm", dest: "pr3", x: L, y: 58, w: W, h: 58 }, "Profile, terms, account setup, to the first hire")}
          {box(
            { key: "ST3-ST7", code: "ST3–ST7", name: "University activation", owner: "usm", dest: "st", x: R, y: 58, w: W, h: 58 },
            "Job board · orgs · events · listservs · professors",
          )}
          <Arrow x={L + 20} y1={116} y2={146} />
          <Arrow x={R + 20} y1={116} y2={146} />

          <rect x={30} y={148} width={900} height={166} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
          <text x={L} y={170} fontSize={10} fontWeight={700} fill="#334155" letterSpacing="0.5">
            PORTAL
          </text>
          <text x={102} y={170} fontSize={10} fill="#64748b">
            runs these. You are the exception handler, not a step in the flow.
          </text>
          {box({ code: "ST8", name: "Student application submitted", owner: "portal", dest: "portal", x: L, y: 182, w: W })}
          {box({ code: "QUAL", name: "Portal vets the application", owner: "portal", dest: "portal", x: R, y: 182, w: W })}
          {box({ code: "MA1", name: "Candidate intro", owner: "portal", dest: "portal", x: L, y: 240, w: W })}
          {box({ code: "MA2", name: "Interview held", owner: "portal", dest: "portal", x: R, y: 240, w: W })}

          <Arrow x={185} y1={314} y2={338} />
          <text x={L} y={334} fontSize={10} fontWeight={700} fill="#64748b" letterSpacing="0.5">
            YOURS AGAIN
          </text>
          {box({ code: "MA3", name: "Hire confirmed", owner: "usm", dest: "ma3", x: L, y: 344, w: 282 })}
          {box({ code: "MA4", name: "6+ shifts confirmed", owner: "usm", dest: "ma4", x: 339, y: 344, w: 282 })}
          {box({ code: "MA5", name: "Bill issued and paid", owner: "usm", dest: "ma5", x: 634, y: 344, w: 282 })}
          <text x={L} y={406} fontSize={10.5} fill="#475569">
            Plus the monthly client list call, which confirms shifts and picks up
            the hire questions providers did not answer.
          </text>
          {yields && outcomes ? <BottomLine y={424} yields={yields} outcomes={outcomes} /> : null}
          <Legend y={484} owners={LEGEND.crm} />
        </>
      )}
    </svg>
  );
}
