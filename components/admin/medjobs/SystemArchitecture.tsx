"use client";

import type { FunnelMetrics, StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  ArrowDefs,
  Arrow,
  HandoffRule,
  SiteHeader,
  StageBox,
  BottomLine,
  HEALTH,
  metricTitle,
  readMetric,
  type Stage,
} from "@/components/admin/medjobs/diagram-kit";

/**
 * The MedJobs operating system on one screen, drawn from the flow map at the
 * top of the master implementation matrix.
 *
 * Two pipelines built in parallel — providers on the left, care workers on the
 * right — handed along at the booked meeting and after it, both feeding the
 * Portal. Every stage sits on the same card ground, so the only colour on the
 * map is a health state.
 *
 * Every stage is a button. Clicking one jumps the reader below to that stage's
 * section by its PDF named destination.
 *
 * When trailing-30-day metrics are supplied, each stage carries its own x/y and
 * percentage. A stage the system cannot measure carries a gap marker instead of
 * a number, deliberately: docs/medjobs/FUNNEL_MEASUREMENT_MAP.md is the working.
 */


// The same lane geometry as the three role views, so a stage is the same
// width wherever it is drawn. Wide enough that a code, its name and its
// number sit on one line without meeting in the middle.
const LANE_W = 426;
const LEFT = 44;
const RIGHT = 490;
const LMID = LEFT + LANE_W / 2;
const RMID = RIGHT + LANE_W / 2;

/**
 * Codes shown here are the operations map's, so reading the two maps in
 * sequence is one continuous index rather than two schemes for the same
 * funnel. The operations map holds the parent; MedJobs holds the detail
 * step, suffixed A, B, C.
 *
 * Only the displayed `code` changes. `key` keeps the metric identity the
 * 30-day tracker uses and `dest` keeps the PDF anchor the jump bars
 * address, so the matrix, the role manuals, the tracker and the activation
 * database all keep working while the naming settles.
 */
const STAGES: Stage[] = [
  { key: "PR1", code: "CP2A", name: "MedJobs provider target list built", dest: "pr1-target-list-built-and-pre-flight-complete", x: LEFT, y: 118, w: LANE_W },
  { key: "ST1", code: "CW2A", name: "Student advisors targeted", dest: "st1-target-advisors", x: RIGHT, y: 118, w: LANE_W },
  { key: "PR-OUT", code: "CP2B", name: "MedJobs outbound work", dest: "pr-out-outbound-work", x: LEFT, y: 172, w: LANE_W },
  { key: "ST-OUT", code: "CW2B", name: "Student advisors in outreach", dest: "st-out-university-outbound", x: RIGHT, y: 172, w: LANE_W },
  { key: "PR2", code: "CP2C", name: "MedJobs provider meeting held", dest: "pr2-provider-meeting-held", x: LEFT, y: 262, w: LANE_W },
  { key: "ST2", code: "CW2C", name: "Advisor meetings held", dest: "st2-advisor-meeting-held", x: RIGHT, y: 262, w: LANE_W },
  { key: "PR3", code: "CP5", name: "Provider staffing product signups", dest: "pr3-client-success", x: LEFT, y: 352, w: LANE_W },
];

/**
 * The five channels a university is activated through, drawn one per row
 * because that is how the Consumer Relations Manager works them: five
 * separate commitments to secure and then keep alive, not one stage that
 * closes. They carry no arrows between them — they run in parallel, and a
 * campus may open two of them and never the others.
 *
 * No single channel is instrumented, so the number stays on the group band
 * above them, where ST3-ST7 is actually measured. Adding a per-channel
 * metric means adding its row to docs/medjobs/FUNNEL_MEASUREMENT_MAP.md
 * first. They share the activation section's anchor because the matrix
 * documents them as one section.
 */
const CHANNEL_H = 38;
const CHANNEL_TOP = 378;
const CHANNELS: Stage[] = [
  "University job board",
  "Advisor listservs",
  "Student organisations",
  "Campus events",
  "Professors and class visits",
].map((name, i) => ({
  code: `CW2${"DEFGH"[i]}`,
  name,
  dest: "st3st7-university-activation",
  x: RIGHT,
  y: CHANNEL_TOP + i * (CHANNEL_H + 6),
  w: LANE_W,
  h: CHANNEL_H,
}));

/**
 * What the Portal does with a care worker once activation has produced one.
 * The Portal takes over at the submitted application, which is why the
 * container starts here and not earlier.
 *
 * CW2J has no section in the matrix and nothing measures it yet, so it
 * borrows the submitted application's anchor and carries no number. The
 * matrix needs the stage before this box means anything.
 */
const PORTAL_STAGES: Stage[] = [
  { key: "ST8", code: "CW2I", name: "Student application submitted", dest: "st8-student-application-submitted", x: RIGHT, y: 656, w: LANE_W },
  { code: "CW2J", name: "Student applications completed", dest: "st8-student-application-submitted", x: RIGHT, y: 710, w: LANE_W },
  { key: "QUAL", code: "CW3", name: "Qualified student care worker applicants", dest: "qual-portal-vets-the-application", x: RIGHT, y: 764, w: LANE_W },
];

/**
 * Two boxes, not five. The operations map carries the fulfilment outcomes,
 * so this row names the same two it does rather than restating the internal
 * MA steps. O4 reads MA1's number and O5 reads MA3's, which is where the
 * connection and the confirmed hire are actually recorded.
 *
 * Shifts worked and revenue billed were MA4 and MA5 here. Neither has ever
 * been measurable, so both came off this map and neither has a home on the
 * operations map yet. Where they land is still open.
 */
const MATCH: Stage[] = [
  { key: "MA1", code: "O4", name: "Provider–care worker connected", dest: "ma1-candidate-intro", x: 0, y: 0, w: 0 },
  { key: "MA3", code: "O5", name: "Hires confirmed", dest: "ma3-hire-confirmed", x: 0, y: 0, w: 0 },
];

export default function SystemArchitecture({
  onJump,
  metrics,
  yields,
  outcomes,
  showStats = true,
  site,
}: {
  /** Jump the reader to a PDF named destination. */
  onJump: (dest: string) => void;
  /** Trailing-30-day numbers per stage. Omit to draw the map alone. */
  metrics?: FunnelMetrics;
  /** The two yields that are honest today. Omit to hide the strip. */
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
}) {
  const box = (st: Stage) => (
    <StageBox
      key={st.code + st.x}
      stage={st}
      metric={metrics?.[st.key ?? st.code]}
      onJump={onJump}
      showStats={showStats}
    />
  );
  const arrow = (x: number, y1: number, y2: number) => <Arrow key={`a${x}${y1}`} x={x} y1={y1} y2={y2} />;
  const handoff = (y: number, text: string) => (
    <HandoffRule key={text + y} y={y} text={text} lanes={[[LEFT, LANE_W], [RIGHT, LANE_W]]} />
  );

  // The activation band's own number: the ST3-ST7 group, read once here
  // rather than repeated on five channels that nothing measures.
  const activationMetric = metrics?.["ST3-ST7"];
  const activation = showStats && activationMetric ? readMetric(activationMetric) : null;
  const activationHealth = showStats ? activationMetric?.health : undefined;

  // Two boxes, on the same two lanes as everything above them.
  const mw = LANE_W;
  const mgap = RIGHT - (LEFT + LANE_W);
  const mx0 = LEFT;

  return (
    <svg
      viewBox="0 0 960 970"
      width="100%"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif"
      role="img"
      aria-label="The MedJobs operating system: two pipelines feeding the Portal"
      className="block h-auto w-full"
    >
      <ArrowDefs />

      {/* One site: a university and the providers around it */}
      <SiteHeader site={site} />
      {arrow(LMID, 56, 72)}
      {arrow(RMID, 56, 72)}
      <line x1={LMID} y1={56} x2={RMID} y2={56} stroke="#cbd5e1" strokeWidth={1.5} />

      <text x={LEFT} y={80} fontSize={12.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        PROVIDER SIDE
      </text>
      <text x={RIGHT} y={80} fontSize={12.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        CAREGIVER
      </text>

      {/* The six stages worked in the In Basket. Drawn before the stage boxes
          so it sits behind them, and sized to close under PR2 / ST2:
          everything below the Sales-to-Consumer-Relations handoff runs by hand
          or in the Portal. This is the tech-on-duty's boundary. */}
      <rect x={30} y={88} width={900} height={228} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={44} y={106} fontSize={12} fontWeight={700} fill="#334155" letterSpacing="0.5">
        IN BASKET
      </text>

      {STAGES.filter((s) => s.y < 226).map((s) => box(s))}
      {arrow(LEFT + 20, 162, 170)}
      {arrow(RIGHT + 20, 162, 170)}

      {handoff(238, "HANDOFF · ADMIN TEAM → SALES LEAD")}
      {STAGES.filter((s) => s.y === 262).map((s) => box(s))}

      {handoff(336, "HANDOFF · SALES LEAD → CONSUMER RELATIONS MANAGER")}
      {box(STAGES[6])}

      {/* The five activation channels, banded so they read as one stage of
          the funnel worked five ways. The band carries the number because
          ST3-ST7 is measured as a group and no channel is measured alone. */}
      <rect x={RIGHT - 14} y={344} width={LANE_W + 28} height={262} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      {activationHealth ? (
        <circle cx={RIGHT + 9} cy={362} r={4.5} fill={HEALTH[activationHealth].dot} />
      ) : null}
      <text
        x={RIGHT + (activationHealth ? 21 : 0)}
        y={366}
        fontSize={12}
        fontWeight={700}
        fill="#334155"
        letterSpacing="0.5"
      >
        CW2D–H · UNIVERSITY ACTIVATION
      </text>
      {activation ? (
        <g>
          <title>{metricTitle("ST3-ST7", "CW2D–H", "University activation", activationMetric!)}</title>
          <text
            x={RIGHT + LANE_W - 11}
            y={366}
            fontSize={activation.gap ? 11 : 13}
            fontWeight={activation.gap ? 400 : 700}
            fontStyle={activation.gap ? "italic" : undefined}
            textAnchor="end"
            fill={activation.gap ? "#94a3b8" : "#14282c"}
          >
            {activation.text}
          </text>
        </g>
      ) : null}
      {CHANNELS.map((c) => box(c))}

      {/* Both sides feed the Portal */}
      {arrow(RIGHT + 20, 606, 650)}

      <rect x={24} y={622} width={912} height={324} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={44} y={645} fontSize={12} fontWeight={700} fill="#334155" letterSpacing="0.5">
        PORTAL
      </text>

      {PORTAL_STAGES.map((st) => box(st))}
      {arrow(RIGHT + 20, 700, 712)}
      {arrow(RIGHT + 20, 754, 766)}

      {/* The qualified applicant and the signed-up provider are what
          fulfilment matches, so both stems meet on one line into it. */}
      <line x1={230} y1={396} x2={230} y2={812} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={RMID} y1={808} x2={RMID} y2={812} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={230} y1={812} x2={RMID} y2={812} stroke="#cbd5e1" strokeWidth={1.5} />
      {arrow(230, 812, 826)}

      <text x={44} y={800} fontSize={12} fontWeight={700} fill="#64748b" letterSpacing="0.5">
        MATCH / FULFILMENT
      </text>
      {MATCH.map((st, i) =>
        box({ ...st, x: mx0 + i * (mw + mgap), y: 826, w: mw }),
      )}

      {yields && outcomes ? (
        <BottomLine y={890} yields={yields} outcomes={outcomes} showStats={showStats} />
      ) : null}
    </svg>
  );
}
