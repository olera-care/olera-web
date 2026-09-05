"use client";

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
 */

const OWNERS = {
  admin: { fill: "#eff6ff", stroke: "#bfdbfe", ink: "#1e40af", label: "Admin Team" },
  sales: { fill: "#fffbeb", stroke: "#fde68a", ink: "#92400e", label: "Sales Lead" },
  usm: { fill: "#ecfdf5", stroke: "#a7f3d0", ink: "#065f46", label: "User Success Manager" },
  portal: { fill: "#f8fafc", stroke: "#e2e8f0", ink: "#334155", label: "Portal" },
} as const;

type Owner = keyof typeof OWNERS;

interface Stage {
  code: string;
  name: string;
  owner: Owner;
  dest: string;
  x: number;
  y: number;
  w: number;
  h?: number;
}

const LANE_W = 380;
const LEFT = 40;
const RIGHT = 540;

const STAGES: Stage[] = [
  { code: "PR1", name: "Target list built", owner: "admin", dest: "pr1-target-list-built-and-pre-flight-complete", x: LEFT, y: 92, w: LANE_W },
  { code: "ST1", name: "Target advisors", owner: "admin", dest: "st1-target-advisors", x: RIGHT, y: 92, w: LANE_W },
  { code: "PR-OUT", name: "Outbound work", owner: "admin", dest: "pr-out-outbound-work", x: LEFT, y: 146, w: LANE_W },
  { code: "ST-OUT", name: "University outbound", owner: "admin", dest: "st-out-university-outbound", x: RIGHT, y: 146, w: LANE_W },
  { code: "PR2", name: "Provider meeting held", owner: "sales", dest: "pr2-provider-meeting-held", x: LEFT, y: 236, w: LANE_W },
  { code: "ST2", name: "Advisor meeting held", owner: "sales", dest: "st2-advisor-meeting-held", x: RIGHT, y: 236, w: LANE_W },
  { code: "PR3", name: "Client success", owner: "usm", dest: "pr3-client-success", x: LEFT, y: 326, w: LANE_W, h: 74 },
  { code: "ST3–ST7", name: "University activation", owner: "usm", dest: "st3st7-university-activation", x: RIGHT, y: 326, w: LANE_W, h: 74 },
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
}: {
  /** Jump the reader to a PDF named destination. */
  onJump: (dest: string) => void;
}) {
  const box = (s: Stage, sub?: string) => {
    const o = OWNERS[s.owner];
    const h = s.h ?? 44;
    return (
      <g
        key={s.code + s.x}
        role="button"
        tabIndex={0}
        aria-label={`${s.code} ${s.name}`}
        onClick={() => onJump(s.dest)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onJump(s.dest);
          }
        }}
        className="cursor-pointer [&>rect]:transition-[filter] hover:[&>rect]:brightness-95 focus:outline-none focus-visible:[&>rect]:stroke-emerald-500"
      >
        <rect x={s.x} y={s.y} width={s.w} height={h} rx={5} fill={o.fill} stroke={o.stroke} />
        <text x={s.x + 12} y={s.y + 19} fontSize={12.5} fontWeight={700} fill={o.ink}>
          {s.code}
        </text>
        <text x={s.x + 12} y={s.y + 35} fontSize={11.5} fill="#374151">
          {s.name}
        </text>
        {sub ? (
          <text x={s.x + 12} y={s.y + 53} fontSize={10} fill="#6b7280">
            {sub}
          </text>
        ) : null}
      </g>
    );
  };

  const arrow = (x: number, y1: number, y2: number) => (
    <line key={`a${x}${y1}`} x1={x} y1={y1} x2={x} y2={y2} stroke="#cbd5e1" strokeWidth={1.5} markerEnd="url(#tip)" />
  );

  const handoff = (y: number, text: string) => (
    <g key={text + y}>
      <line x1={LEFT} y1={y} x2={LEFT + LANE_W} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={RIGHT} y1={y} x2={RIGHT + LANE_W} y2={y} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3 3" />
      <text x={LEFT} y={y - 5} fontSize={9.5} fontWeight={600} fill="#94a3b8" letterSpacing="0.4">
        {text}
      </text>
      <text x={RIGHT} y={y - 5} fontSize={9.5} fontWeight={600} fill="#94a3b8" letterSpacing="0.4">
        {text}
      </text>
    </g>
  );

  const mw = 164;
  const mgap = 12;
  const mx0 = 60;

  return (
    <svg
      viewBox="0 0 960 706"
      width="100%"
      fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif"
      role="img"
      aria-label="The MedJobs operating system: two pipelines feeding the Portal"
      className="block h-auto w-full"
    >
      <defs>
        <marker id="tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="#cbd5e1" />
        </marker>
      </defs>

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

      {STAGES.filter((s) => s.y < 200).map((s) => box(s))}
      {arrow(LEFT + 20, 136, 144)}
      {arrow(RIGHT + 20, 136, 144)}

      {handoff(212, "HANDOFF · ADMIN TEAM → SALES LEAD")}
      {STAGES.filter((s) => s.y === 236).map((s) => box(s))}

      {handoff(302, "HANDOFF · SALES LEAD → USER SUCCESS MANAGER")}
      {box(STAGES[6], "Profile, terms, account setup, through to the first hire")}
      {box(STAGES[7], "Job board · student orgs · campus events · listservs · professors")}

      {/* Both sides feed the Portal */}
      {arrow(LEFT + 20, 400, 430)}
      {arrow(RIGHT + 20, 400, 430)}

      <rect x={24} y={432} width={912} height={238} rx={7} fill="#f8fafc" stroke="#e2e8f0" />
      <text x={44} y={455} fontSize={11} fontWeight={700} fill="#334155" letterSpacing="0.5">
        PORTAL
      </text>
      <text x={102} y={455} fontSize={10.5} fill="#64748b">
        carries the flow from student application through fulfilment
      </text>

      <rect x={44} y={468} width={360} height={44} rx={5} fill="#ecfdf5" stroke="#a7f3d0" />
      <text x={56} y={487} fontSize={11.5} fontWeight={700} fill="#065f46">
        Active client with a staffing need
      </text>
      <text x={56} y={503} fontSize={10.5} fill="#6b7280">
        from the provider side
      </text>

      {box({ code: "ST8", name: "Student application submitted", owner: "portal", dest: "st8-student-application-submitted", x: 556, y: 468, w: 360 })}
      {arrow(576, 512, 524)}
      {box({ code: "QUAL", name: "Portal vets the application", owner: "portal", dest: "qual-portal-vets-the-application", x: 556, y: 526, w: 360 })}

      <line x1={224} y1={512} x2={224} y2={578} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={736} y1={570} x2={736} y2={578} stroke="#cbd5e1" strokeWidth={1.5} />
      <line x1={142} y1={578} x2={736} y2={578} stroke="#cbd5e1" strokeWidth={1.5} />
      {arrow(142, 578, 592)}

      <text x={44} y={566} fontSize={10} fontWeight={700} fill="#64748b" letterSpacing="0.5">
        MATCH / FULFILMENT
      </text>
      {MATCH.map((s, i) =>
        box({ ...s, x: mx0 + i * (mw + mgap), y: 596, w: mw }),
      )}

      <text x={916} y={658} fontSize={9.5} fill="#64748b" textAnchor="end">
        MA4 is where real value has been delivered, so MA5 is where Olera charges
      </text>

      {/* Ownership legend */}
      {(Object.keys(OWNERS) as Owner[]).map((k, i) => (
        <g key={k}>
          <rect x={44 + i * 190} y={688} width={11} height={11} rx={2} fill={OWNERS[k].fill} stroke={OWNERS[k].stroke} />
          <text x={61 + i * 190} y={697} fontSize={10} fill="#475569">
            {OWNERS[k].label}
          </text>
        </g>
      ))}
    </svg>
  );
}
