"use client";

import type { FunnelMetrics, StageMetric } from "@/lib/medjobs/funnel-30d";
import {
  ArrowDefs,
  Arrow,
  SiteHeader,
  StageBox,
  BottomLine,
  GroupBox,
  type Stage,
} from "@/components/admin/medjobs/diagram-kit";

/**
 * The MedJobs operating system on one screen, drawn from the flow map at the
 * top of the master implementation matrix.
 *
 * Two pipelines built in parallel — providers on the left, care workers on the
 * right — both feeding the Portal. Every stage sits on the same card ground,
 * so the only colour on the map is a health state.
 *
 * No containers and no handoff rules for now: the grouping a reader needs is
 * in the codes themselves, since CW2 and CW3 name their own blocks. Where a
 * step is worked, and who hands it to whom, is in the role manuals.
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
/**
 * The rows. One pitch for every step on either side, so a step is the same
 * object wherever it sits and the two columns read against each other.
 *
 * The care worker column breaks once: CW2A-H is university activation and
 * CW3A-C is the application funnel, and the gap between them is the room
 * their two group boxes need for their labels.
 */
const ROW_H = 44;
const PITCH = 58;
const TOP = 132;
const ACTIVATION_ROWS = 8;
const GROUP_GAP = 72;
const pY = (i: number) => TOP + i * PITCH;
/** The provider column drops out of its group box before its last step. */
const pvY = (i: number) => (i < 3 ? pY(i) : pY(2) + ROW_H + 12 + 20);
const cwY = (i: number) =>
  i < ACTIVATION_ROWS ? pY(i) : pY(ACTIVATION_ROWS) + GROUP_GAP + (i - ACTIVATION_ROWS) * PITCH;

/**
 * The provider column.
 *
 * CP2B1-3 are the MedJobs target: build the list, work it, hold the meeting.
 * That whole run is one of the four ways a provider enters outreach on the
 * operations map, which is why the three sit inside a box named for it
 * rather than carrying top-level codes of their own.
 *
 * CP3C is what a claimed provider signs up to, so it sits below the box.
 */
const COLD_START_ROWS = 3;
const PROVIDER: Stage[] = [
  { key: "PR1", code: "CP2B1", name: "MedJobs provider target list built", dest: "pr1-target-list-built-and-pre-flight-complete" },
  { key: "PR-OUT", code: "CP2B2", name: "MedJobs outbound work", dest: "pr-out-outbound-work" },
  { key: "PR2", code: "CP2B3", name: "MedJobs provider meetings held", dest: "pr2-provider-meeting-held" },
  { key: "PR3", code: "CP3C", name: "Provider staffing product signups", dest: "pr3-client-success" },
].map((st, i) => ({ ...st, x: LEFT, y: pvY(i), w: LANE_W }));

/** The cold-start box, and the step that sits under it. */
const COLD_START_BOTTOM = pY(COLD_START_ROWS - 1) + ROW_H + 12;

/**
 * The care worker column, in one sequence.
 *
 * CW2A-H is university activation: getting to an advisor, then the five
 * channels activation actually consists of. The five run in parallel and
 * carry no arrows between them — a campus may open two of them and never the
 * others — and none is instrumented on its own, so none carries a number.
 * ST3-ST7 is measured as a group of those five; that number has no home on
 * the map, because the box around them is CW2A-H, which is wider.
 *
 * CW3A-C is what the Portal does with the care worker activation produced.
 * CW3B has no section in the matrix and nothing measures it, so it borrows
 * CW3A's anchor and carries no number; the matrix needs the stage before
 * that row means anything. CW3C is the operations map's CW3C.
 */
const CARE_WORKER: Stage[] = [
  { key: "ST1", code: "CW2A", name: "Student advisors targeted", dest: "st1-target-advisors" },
  { key: "ST-OUT", code: "CW2B", name: "Student advisors in outreach", dest: "st-out-university-outbound" },
  { key: "ST2", code: "CW2C", name: "Advisor meetings held", dest: "st2-advisor-meeting-held" },
  { code: "CW2D", name: "University job board", dest: "st3st7-university-activation" },
  { code: "CW2E", name: "Advisor listservs", dest: "st3st7-university-activation" },
  { code: "CW2F", name: "Student organisations", dest: "st3st7-university-activation" },
  { code: "CW2G", name: "Campus events", dest: "st3st7-university-activation" },
  { code: "CW2H", name: "Professors and class visits", dest: "st3st7-university-activation" },
  { key: "ST8", code: "CW3A", name: "Student applications initiated", dest: "st8-student-application-submitted" },
  { code: "CW3B", name: "Student applications completed", dest: "st8-student-application-submitted" },
  { key: "QUAL", code: "CW3C", name: "Qualified student care worker applicants", dest: "qual-portal-vets-the-application" },
].map((st, i) => ({ ...st, x: RIGHT, y: cwY(i), w: LANE_W }));

/**
 * The five channels run in parallel, so no arrow joins one to the next — and
 * nothing joins CW2H to CW3A either: what reaches the Portal is an activated
 * university, not the last channel in the list, so that arrow leaves the
 * activation block itself.
 */
const CARE_WORKER_LINKS = [0, 1, 2, 8, 9];

/** The two group boxes down the care worker column, and the Portal around one. */
const ACTIVATION_BOTTOM = cwY(ACTIVATION_ROWS - 1) + ROW_H + 12;
const PORTAL_TOP = ACTIVATION_BOTTOM + 20;
const FUNNEL_TOP = PORTAL_TOP + 26;
const FUNNEL_BOTTOM = cwY(CARE_WORKER.length - 1) + ROW_H + 12;
const JOIN_Y = FUNNEL_BOTTOM + 18;
const MATCH_Y = JOIN_Y + 14;
const PORTAL_BOTTOM = MATCH_Y + ROW_H + 16;

/**
 * Two boxes, not five. The operations map carries the fulfilment outcomes,
 * so this row names the same two it does rather than restating the internal
 * MA steps. O5 reads MA1's number and O6 reads MA3's, which is where the
 * connection and the confirmed hire are actually recorded.
 *
 * Shifts worked and revenue billed were MA4 and MA5 here. Neither has ever
 * been measurable, so both came off this map and neither has a home on the
 * operations map yet. Where they land is still open.
 */
const MATCH: Stage[] = [
  { key: "MA1", code: "O5", name: "Provider–care worker connected", dest: "ma1-candidate-intro", x: 0, y: 0, w: 0 },
  { key: "MA3", code: "O6", name: "Hires confirmed", dest: "ma3-hire-confirmed", x: 0, y: 0, w: 0 },
];

export default function SystemArchitecture({
  onJump,
  metrics,
  yields,
  outcomes,
  showStats = true,
  site,
  siteCount,
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
  /** How many universities are targeted — the header's CW1 number. */
  siteCount?: number | null;
  /** The bottom line's outcome figures. */
  outcomes?: {
    successfulStudents: number;
    revenue: number;
    instrumented: { successfulStudents: boolean; revenue: boolean };
  };
}) {
  const box = (st: Stage) => (
    <StageBox
      key={st.code}
      stage={st}
      metric={metrics?.[st.key ?? st.code]}
      onJump={onJump}
      showStats={showStats}
    />
  );
  const arrow = (x: number, y1: number, y2: number) => <Arrow key={`a${x}${y1}`} x={x} y1={y1} y2={y2} />;
  /** The stub between one care worker step and the next. */
  const link = (i: number) => arrow(RIGHT + 20, cwY(i) + ROW_H, cwY(i + 1) - 4);

  // Two boxes, on the same two lanes as everything above them.
  const mw = LANE_W;
  const mgap = RIGHT - (LEFT + LANE_W);
  const mx0 = LEFT;

  return (
    <svg
      viewBox={`0 0 960 ${PORTAL_BOTTOM + 100}`}
      width="100%"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif"
      role="img"
      aria-label="The MedJobs operating system: two pipelines feeding the Portal"
      className="block h-auto w-full"
    >
      <ArrowDefs />

      {/* The header is the operations map's CW1. */}
      <SiteHeader site={site} count={showStats ? siteCount : null} />
      {arrow(LMID, 60, 76)}
      {arrow(RMID, 60, 76)}
      <line x1={LMID} y1={60} x2={RMID} y2={60} stroke="#cbd5e1" strokeWidth={1.5} />

      <text x={LEFT} y={94} fontSize={12.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        PROVIDER SIDE
      </text>
      <text x={RIGHT} y={94} fontSize={12.5} fontWeight={700} fill="#64748b" letterSpacing="0.6">
        CAREGIVER
      </text>

      {/* The group boxes are drawn first so every stage sits on top of them. */}
      <GroupBox
        x={LEFT - 16}
        y={TOP - 28}
        w={LANE_W + 32}
        h={COLD_START_BOTTOM - (TOP - 28)}
        label="CP2B · MEDJOBS TARGET"
      />
      <GroupBox
        x={RIGHT - 16}
        y={TOP - 28}
        w={LANE_W + 32}
        h={ACTIVATION_BOTTOM - (TOP - 28)}
        label="CW2 · UNIVERSITY ACTIVATION"
      />
      <GroupBox
        x={20}
        y={PORTAL_TOP}
        w={920}
        h={PORTAL_BOTTOM - PORTAL_TOP}
        label="PORTAL"
      />
      <GroupBox
        x={RIGHT - 8}
        y={FUNNEL_TOP}
        w={LANE_W + 16}
        h={FUNNEL_BOTTOM - FUNNEL_TOP}
        label="CW3 · APPLICATION FUNNEL"
        fill="#ffffff"
      />

      {PROVIDER.map((st) => box(st))}
      {[0, 1].map((i) => arrow(LEFT + 20, pY(i) + ROW_H, pY(i + 1) - 4))}
      {/* The cold start hands over a provider who took the meeting, so this
          arrow leaves the block rather than its last step. */}
      {arrow(LEFT + 20, COLD_START_BOTTOM, pvY(3) - 4)}

      {CARE_WORKER.map((st) => box(st))}
      {CARE_WORKER_LINKS.map((i) => link(i))}

      {/* Both columns hand to the Portal, and the Portal does the rest. The
          provider hands over a signed-up client and the campus an activated
          university — neither hands over a match, which is why both arrows
          stop at the Portal rather than reaching into it. */}
      {arrow(LEFT + 20, pvY(3) + ROW_H, PORTAL_TOP)}
      {arrow(RIGHT + 20, ACTIVATION_BOTTOM, PORTAL_TOP)}

      {/* Inside the Portal, the qualified applicant is what fulfilment
          matches on. */}
      <line x1={RMID} y1={FUNNEL_BOTTOM} x2={RMID} y2={JOIN_Y} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={230} y1={JOIN_Y} x2={RMID} y2={JOIN_Y} stroke="#cbd5e1" strokeWidth={1.5} />
      {arrow(230, JOIN_Y, MATCH_Y)}

      <text x={LEFT} y={JOIN_Y - 10} fontSize={12} fontWeight={700} fill="#64748b" letterSpacing="0.5">
        MATCH / FULFILMENT
      </text>
      {MATCH.map((st, i) =>
        box({ ...st, x: mx0 + i * (mw + mgap), y: MATCH_Y, w: mw }),
      )}

      {yields && outcomes ? (
        <BottomLine y={PORTAL_BOTTOM + 22} yields={yields} outcomes={outcomes} showStats={showStats} />
      ) : null}
    </svg>
  );
}
