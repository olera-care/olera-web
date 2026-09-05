"use client";

import type { FunnelMetrics, StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  ArrowDefs,
  Arrow,
  HandoffRule,
  Legend,
  OWNERS,
  StageBox,
  YieldStrip,
  type Owner,
  type Stage,
} from "@/components/admin/medjobs/diagram-kit";

/**
 * The MedJobs operating system on one screen, drawn from the flow map at the
 * top of the master implementation matrix.
 *
 * Colour is ownership, which is the thing the map is actually for: two
 * pipelines built in parallel, each handed from the Admin Team to the Sales
 * Lead at the booked meeting and from the Sales Lead to the User Success
 * Manager after it, both feeding the Portal.
 *
 * Every stage is a button. Clicking one jumps the reader below to that stage's
 * section by its PDF named destination.
 *
 * When trailing-30-day metrics are supplied, each stage carries its own x/y and
 * percentage. A stage the system cannot measure carries a gap marker instead of
 * a number, deliberately: docs/medjobs/FUNNEL_MEASUREMENT_MAP.md is the working.
 */


const LANE_W = 380;
const LEFT = 40;
const RIGHT = 540;

const STAGES: Stage[] = [
  { code: "PR1", name: "Target list built", owner: "admin", dest: "pr1-target-list-built-and-pre-flight-complete", x: LEFT, y: 118, w: LANE_W },
  { code: "ST1", name: "Target advisors", owner: "admin", dest: "st1-target-advisors", x: RIGHT, y: 118, w: LANE_W },
  { code: "PR-OUT", name: "Outbound work", owner: "admin", dest: "pr-out-outbound-work", x: LEFT, y: 172, w: LANE_W },
  { code: "ST-OUT", name: "University outbound", owner: "admin", dest: "st-out-university-outbound", x: RIGHT, y: 172, w: LANE_W },
  { code: "PR2", name: "Provider meeting held", owner: "sales", dest: "pr2-provider-meeting-held", x: LEFT, y: 262, w: LANE_W },
  { code: "ST2", name: "Advisor meeting held", owner: "sales", dest: "st2-advisor-meeting-held", x: RIGHT, y: 262, w: LANE_W },
  { code: "PR3", name: "Client success", owner: "usm", dest: "pr3-client-success", x: LEFT, y: 352, w: LANE_W, h: 74 },
  { key: "ST3-ST7", code: "ST3–ST7", name: "University activation", owner: "usm", dest: "st3st7-university-activation", x: RIGHT, y: 352, w: LANE_W, h: 74 },
];

const MATCH: Stage[] = [
  { code: "MA1", name: "Candidate intro", owner: "portal", dest: "ma1-candidate-intro", x: 0, y: 0, w: 0 },
  { code: "MA2", name: "Interview held", owner: "portal", dest: "ma2-interview-held", x: 0, y: 0, w: 0 },
  { code: "MA3", name: "Hire confirmed", owner: "usm", dest: "ma3-hire-confirmed", x: 0, y: 0, w: 0 },
  { code: "MA4", name: "6+ shifts confirmed", owner: "usm", dest: "ma4-six-or-more-shifts-worked-confirmed", x: 0, y: 0, w: 0 },
  { code: "MA5", name: "Bill issued and paid", owner: "usm", dest: "ma5-bill-issued-and-collected", x: 0, y: 0, w: 0 },
];

export default function SystemArchitecture({
  onJump,
  metrics,
  yields,
}: {
  /** Jump the reader to a PDF named destination. */
  onJump: (dest: string) => void;
  /** Trailing-30-day numbers per stage. Omit to draw the map alone. */
  metrics?: FunnelMetrics;
  /** The two yields that are honest today. Omit to hide the strip. */
  yields?: { commercial: StageMetric; placement: StageMetric };
}) {
  const box = (st: Stage, sub?: string) => (
    <StageBox key={st.code + st.x} stage={st} metric={metrics?.[st.key ?? st.code]} onJump={onJump} sub={sub} />
  );
  const arrow = (x: number, y1: number, y2: number) => <Arrow key={`a${x}${y1}`} x={x} y1={y1} y2={y2} />;
  const handoff = (y: number, text: string) => (
    <HandoffRule key={text + y} y={y} text={text} lanes={[[LEFT, LANE_W], [RIGHT, LANE_W]]} />
  );

  const mw = 164;
  const mgap = 12;
  const mx0 = 60;

  return (
    <svg
      viewBox="0 0 960 768"
      width="100%"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif"
      role="img"
      aria-label="The MedJobs operating system: two pipelines feeding the Portal"
      className="block h-auto w-full"
    >
      <ArrowDefs />

      {/* One site: a university and the providers around it */}
      <rect x={250} y={8} width={460} height={38} rx={5} fill="#0f172a" />
      <text x={480} y={25} fontSize={12} fontWeight={700} fill="#fff" textAnchor="middle">
        SITE 1
      </text>
      <text x={480} y={39} fontSize={10} fill="#cbd5e1" textAnchor="middle">
        One university and one surrounding service area of providers
      </text>
      {arrow(230, 46, 68)}
      {arrow(730, 46, 68)}
      <line x1={230} y1={46} x2={730} y2={46} stroke="#cbd5e1" strokeWidth={1.5} />

      <text x={LEFT} y={80} fontSize={10.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        PROVIDER SIDE
      </text>
      <text x={RIGHT} y={80} fontSize={10.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        STUDENT / UNIVERSITY SIDE
      </text>
      {metrics ? (
        <text x={916} y={80} fontSize={9.5} fontWeight={700} fill="#0f172a" textAnchor="end" letterSpacing="0.5">
          LAST 30 DAYS
        </text>
      ) : null}

      {/* The six stages worked inside the admin panel. Drawn before the stage
          boxes so it sits behind them, and sized to close under PR2 / ST2:
          everything below the Sales-to-User-Success handoff runs by hand or in
          the Portal. This is the tech-on-duty's boundary. */}
      <rect x={30} y={88} width={900} height={228} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={44} y={106} fontSize={10} fontWeight={700} fill="#334155" letterSpacing="0.5">
        ADMIN PANEL
      </text>
      <text x={134} y={106} fontSize={10} fill="#64748b">
        every step here is worked in the In Basket
      </text>

      {STAGES.filter((s) => s.y < 226).map((s) => box(s))}
      {arrow(LEFT + 20, 162, 170)}
      {arrow(RIGHT + 20, 162, 170)}

      {handoff(238, "HANDOFF · ADMIN TEAM → SALES LEAD")}
      {STAGES.filter((s) => s.y === 262).map((s) => box(s))}

      {handoff(336, "HANDOFF · SALES LEAD → USER SUCCESS MANAGER")}
      {box(STAGES[6], "Profile, terms, account setup, through to the first hire")}
      {box(STAGES[7], "Job board · student orgs · campus events · listservs · professors")}

      {/* Both sides feed the Portal */}
      {arrow(LEFT + 20, 426, 456)}
      {arrow(RIGHT + 20, 426, 456)}

      <rect x={24} y={458} width={912} height={274} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={44} y={481} fontSize={11} fontWeight={700} fill="#334155" letterSpacing="0.5">
        PORTAL
      </text>
      <text x={102} y={481} fontSize={10.5} fill="#64748b">
        carries the flow from student application through fulfilment
      </text>

      <rect x={44} y={494} width={360} height={44} rx={5} fill="#ecfdf5" stroke="#a7f3d0" />
      <text x={56} y={513} fontSize={11.5} fontWeight={700} fill="#065f46">
        Active client with a staffing need
      </text>
      <text x={56} y={529} fontSize={10.5} fill="#6b7280">
        from the provider side
      </text>

      {box({ code: "ST8", name: "Student application submitted", owner: "portal", dest: "st8-student-application-submitted", x: 556, y: 494, w: 360 })}
      {arrow(576, 538, 550)}
      {box({ code: "QUAL", name: "Portal vets the application", owner: "portal", dest: "qual-portal-vets-the-application", x: 556, y: 552, w: 360 })}

      <line x1={224} y1={538} x2={224} y2={604} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={736} y1={596} x2={736} y2={604} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={142} y1={604} x2={736} y2={604} stroke="#cbd5e1" strokeWidth={1.5} />
      {arrow(142, 604, 618)}

      <text x={44} y={592} fontSize={10} fontWeight={700} fill="#64748b" letterSpacing="0.5">
        MATCH / FULFILMENT
      </text>
      {MATCH.map((s, i) =>
        box({ ...s, x: mx0 + i * (mw + mgap), y: 622, w: mw }),
      )}

      {yields ? <YieldStrip y={680} yields={yields} /> : null}

      <Legend y={750} owners={Object.keys(OWNERS) as Owner[]} />
    </svg>
  );
}
