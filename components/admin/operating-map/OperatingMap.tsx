"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import styles from "./OperatingMap.module.css";

/**
 * The Olera operating map — every step of the marketplace, in one figure.
 *
 * Nothing here is instrumented yet. Each node renders a placeholder value so
 * that wiring a metric later is a one-line change at the node, not a layout
 * change: the connectors are computed from measured DOM geometry at draw
 * time, so a card can grow a number, change its label, or change its width
 * and every arrow still lands on it.
 *
 * The one contract that matters: a node's `id` is its identity. `nodeId()`
 * namespaces them so short keys like "m1" cannot collide with anything else
 * rendered on an admin page. Rename a label freely; renaming an id breaks
 * the wire that references it.
 */

/** Namespace every DOM id this component owns. */
const nodeId = (key: string) => `om-${key}`;

/** Placeholder for a node with no confident data source yet. */
const NOT_INSTRUMENTED = "—";

export default function OperatingMap() {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    const sys = rootRef.current;
    const svg = svgRef.current;
    if (!sys || !svg) return;

    const SVG_NS = "http://www.w3.org/2000/svg";
    /** Gap left between a card's edge and the arrow that touches it. */
    const G = 5;

    const w = sys.scrollWidth;
    const h = sys.scrollHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.replaceChildren();

    type Box = { l: number; r: number; t: number; b: number; cx: number; cy: number };

    /** Measure a node in the figure's own coordinate space. */
    function box(key: string): Box {
      const node = document.getElementById(nodeId(key));
      if (!node) throw new Error(`operating map: missing node "${key}"`);
      const r = node.getBoundingClientRect();
      const c = sys!.getBoundingClientRect();
      return {
        l: r.left - c.left,
        r: r.right - c.left,
        t: r.top - c.top,
        b: r.bottom - c.top,
        cx: (r.left + r.right) / 2 - c.left,
        cy: (r.top + r.bottom) / 2 - c.top,
      };
    }

    function seg(x1: number, y1: number, x2: number, y2: number) {
      const ln = document.createElementNS(SVG_NS, "line");
      ln.setAttribute("x1", String(x1));
      ln.setAttribute("y1", String(y1));
      ln.setAttribute("x2", String(x2));
      ln.setAttribute("y2", String(y2));
      svg!.appendChild(ln);
    }

    function head(x: number, y: number, dir: "d" | "r") {
      const p = document.createElementNS(SVG_NS, "polygon");
      p.setAttribute(
        "points",
        dir === "d"
          ? [`${x},${y}`, `${x - 4.4},${y - 8}`, `${x + 4.4},${y - 8}`].join(" ")
          : [`${x},${y}`, `${x - 8},${y - 4.4}`, `${x - 8},${y + 4.4}`].join(" "),
      );
      svg!.appendChild(p);
    }

    const vArrow = (x: number, y1: number, y2: number) => {
      seg(x, y1, x, y2 - 8);
      head(x, y2, "d");
    };
    const hArrow = (y: number, x1: number, x2: number) => {
      seg(x1, y, x2 - 8, y);
      head(x2, y, "r");
    };

    /** Horizontal arrow that can point either way. */
    function hTo(y: number, x1: number, x2: number) {
      const s2 = x2 > x1 ? 1 : -1;
      seg(x1, y, x2 - 8 * s2, y);
      const p = document.createElementNS(SVG_NS, "polygon");
      p.setAttribute(
        "points",
        [`${x2},${y}`, `${x2 - 8 * s2},${y - 4.4}`, `${x2 - 8 * s2},${y + 4.4}`].join(" "),
      );
      svg!.appendChild(p);
    }

    const vDown = (a: string, b: string) => {
      const A = box(a);
      const B = box(b);
      vArrow(A.cx, A.b + G, B.t - G);
    };
    /** Branch off a vertical stem into a card sitting to its right. */
    const fromStem = (x: number, b: string) => {
      const B = box(b);
      hArrow(B.cy, x + 1, B.l - G);
    };
    /** Feed a card's output into a vertical stem to its right. */
    const toStem = (a: string, x: number) => {
      const A = box(a);
      hArrow(A.cy, A.r + G, x - 1);
    };

    /** The line every top-section drop terminates on. */
    const BT = box("bottom").t - G;

    const cr1 = box("cr1");
    const cr2 = box("cr2");
    const cr3 = box("cr3");
    const cr4 = box("cr4");
    const cr6 = box("cr6");

    /* care recipient sources converge on CR4, head riding the CR2 line */
    const bar0 = cr3.b + 18;
    [cr1, cr2, cr3].forEach((s) => seg(s.cx, s.b + G, s.cx, bar0));
    seg(cr1.cx, bar0, cr3.cx, bar0);
    vArrow(cr2.cx, bar0, cr4.t - G);

    /* referrals also run straight past the funnel */
    vArrow(cr1.l + 14, cr1.b + G, BT);

    const stem1 = cr4.l + 14;
    seg(stem1, cr4.b + G, stem1, cr6.t - 8);
    head(stem1, cr6.t - G, "d");
    fromStem(stem1, "cr5");

    const stem2 = cr6.l + 14;
    seg(stem2, cr6.b + G, stem2, BT - 8);
    head(stem2, BT, "d");
    ["cr6a", "cr6b", "cr6c"].forEach((id) => fromStem(stem2, id));

    /* care provider */
    vDown("cp1", "cp2");
    const cp2 = box("cp2");
    seg(cp2.cx, cp2.b + G, cp2.cx, BT - 8);
    head(cp2.cx, BT, "d");
    ["cr5", "cr6b", "cr6c"].forEach((id) => toStem(id, cp2.cx));

    /* care worker runs straight down its lane and into the milestone layer */
    vDown("cw1", "cw2");
    vDown("cw2", "cw3");
    const cw3 = box("cw3");
    vArrow(cw3.cx, cw3.b + G, BT);

    /* care worker and care recipient profiles feed provider outreach */
    const m2 = box("m2");
    const joinY = BT - 26;
    seg(m2.cx, m2.t - G, m2.cx, joinY);
    hTo(joinY, m2.cx, cp2.cx);

    const m1 = box("m1");
    const joinY1 = BT - 48;
    // Start the riser clear of the CR6 stem so the two never cross.
    const m1x = Math.max(m1.cx, stem2 + 26);
    seg(m1x, m1.t - G, m1x, joinY1);
    hTo(joinY1, m1x, cp2.cx);

    /* inside the tracks */
    vDown("ta1", "ta2");
    vDown("ta2", "ta3");
    vDown("ta3", "ta4");
    vDown("tb1", "tb2");
    vDown("tb2", "tb3");
    vDown("tb3", "tb4");
    vDown("tc1", "tc2");
    vDown("tc2", "tc3");
    vDown("tc3", "tc4");

    /* aid delivered and care delivered converge on the spending outcome */
    const ta4 = box("ta4");
    const tb4 = box("tb4");
    const o1 = box("o1");
    const outBar = Math.max(ta4.b, tb4.b) + 24;
    seg(ta4.cx, ta4.b + G, ta4.cx, outBar);
    seg(tb4.cx, tb4.b + G, tb4.cx, outBar);
    seg(ta4.cx, outBar, tb4.cx, outBar);
    vArrow(o1.cx, outBar, o1.t - G);
  }, []);

  useLayoutEffect(() => {
    // Two passes: once on mount, once after the web font settles. Inter
    // changes card heights, and every arrow is measured from those heights.
    draw();
    const node = rootRef.current;
    if (!node) return;

    const observer = new ResizeObserver(() => draw());
    observer.observe(node);

    let cancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) draw();
      });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  return (
    <div className={styles.root}>
      <div className={styles.scroll}>
        <section className={styles.system} ref={rootRef}>
          <svg className={styles.wires} ref={svgRef} aria-hidden="true" />

          <div className={`${styles.pill} ${styles.full}`}>All cities</div>
          <div style={{ height: 18 }} />

          <div className={styles.lanes3} style={{ marginBottom: 8 }}>
            <div className={styles.lab}>Care recipient</div>
            <div className={styles.lab}>Care provider</div>
            <div className={styles.lab}>Care worker</div>
          </div>

          {/* ---------------- top ---------------- */}
          <div className={styles.lanes3}>
            {/* care recipient */}
            <div className={styles.lane}>
              <div className={styles.chips}>
                <Chip id="cr1" code="CR1" label="Referrals" />
                <Chip id="cr2" code="CR2" label="Organic visitors" />
                <Chip id="cr3" code="CR3" label="Paid ad visitors" />
              </div>
              <div className={styles.indent} style={{ marginTop: 32 }}>
                <Card
                  id="cr4"
                  code="CR4"
                  label={
                    <>
                      Page visits
                      <br />
                      <span className={styles.dim}>
                        provider page &middot; editorial page &middot; benefits page
                      </span>
                    </>
                  }
                />
                <div className={styles.offshoot} style={{ marginTop: 24 }}>
                  <Chip id="cr5" code="CR5" label="Questions asked" />
                </div>
                <div style={{ marginTop: 24 }}>
                  <Card id="cr6" code="CR6" label="CTAs submitted" />
                </div>
                <div className={styles.offshoots} style={{ marginTop: 20 }}>
                  <Chip id="cr6a" code="CR6a" label="Benefits CTAs" />
                  <Chip id="cr6b" code="CR6b" label="Connection CTAs" />
                  <Chip id="cr6c" code="CR6c" label="Profiles made live" />
                </div>
                <div style={{ height: 30 }} />
              </div>
            </div>

            {/* care provider */}
            <div className={styles.lane}>
              <div className={`${styles.chips} ${styles.solo}`}>
                <Chip id="cp1" code="CP1" label="Providers listed" />
              </div>
              <div className={styles.soloWrap}>
                <Card id="cp2" code="CP2" label="In outreach" />
              </div>
            </div>

            {/* care worker */}
            <div className={styles.lane}>
              <Card id="cw1" code="CW1" label="Universities listed" />
              <div className={styles.gap} />
              <Card id="cw2" code="CW2" label="In outreach" />
              <div className={styles.gap} />
              <Card id="cw3" code="CW3" label="University channels activated" />
            </div>
          </div>

          <div style={{ height: 54 }} />

          {/* ---------------- bottom ---------------- */}
          <div id={nodeId("bottom")}>
            <div className={`${styles.col} ${styles.strip}`}>
              <span className={styles.lab}>User milestone</span>
              <div className={styles.stripRow}>
                <Card hi id="m1" code="M1" label="Care recipient profiles completed" />
                <Card hi id="m2" code="M2" label="Care worker profiles completed" />
                <Card hi id="m3" code="M3" label="Provider profiles claimed" />
                <Card hi id="m4" code="M4" money="Paid product" label="Managed ad signups" />
                <Card hi id="m5" code="M5" label="Provider staffing signups" />
              </div>
            </div>

            <div className={styles.tracks}>
              <div className={styles.col} id={nodeId("ta")}>
                <span className={styles.lab}>TA aid establishment</span>
                <div className={styles.stack}>
                  <Card id="ta1" code="TA1" label="Matched" />
                  <Card id="ta2" code="TA2" label="Applied" />
                  <Card id="ta3" code="TA3" label="Aid established" />
                  <Card id="ta4" code="TA4" label="Aid delivered" />
                </div>
              </div>

              <div className={styles.col} id={nodeId("tb")}>
                <span className={styles.lab}>TB care establishment</span>
                <div className={styles.stack}>
                  <Card id="tb1" code="TB1" label="Care recipient–provider matched" />
                  <Card id="tb2" code="TB2" label="Connection confirmed" />
                  <Card id="tb3" code="TB3" label="Care established" />
                  <Card id="tb4" code="TB4" label="Care delivered" />
                </div>
              </div>

              <div className={styles.col} id={nodeId("tc")}>
                <span className={styles.lab}>TC care worker hiring</span>
                <div className={styles.stack}>
                  <Card id="tc1" code="TC1" label="Care worker–provider matched" />
                  <Card id="tc2" code="TC2" label="Interviews held" />
                  <Card id="tc3" code="TC3" label="Hires confirmed" />
                  <Card id="tc4" code="TC4" money="Revenue generating" label="Hours worked" />
                </div>
              </div>
            </div>

            <div className={styles.outrow}>
              <Card
                hi
                id="o1"
                code="O1"
                money="Value created"
                label="Est. healthcare utilization reduction"
              />
              <div className={styles.stat}>
                <span className={styles.lab}>Revenue generated</span>
                <span className={styles.v}>{NOT_INSTRUMENTED}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({
  id,
  code,
  label,
  hi,
  money,
}: {
  id: string;
  code: string;
  label: ReactNode;
  hi?: boolean;
  /** Tooltip shown on the $ marker. Omit for nodes that carry no money. */
  money?: string;
}) {
  return (
    <div className={`${styles.card}${hi ? ` ${styles.hi}` : ""}`} id={nodeId(id)}>
      <div className={styles.k}>
        {code}
        {money && (
          <span className={styles.paid} title={money}>
            $
          </span>
        )}
      </div>
      <div className={styles.n}>{label}</div>
    </div>
  );
}

function Chip({ id, code, label }: { id: string; code: string; label: string }) {
  return (
    <div className={styles.chip} id={nodeId(id)}>
      <b>{code}</b>
      {label}
    </div>
  );
}
