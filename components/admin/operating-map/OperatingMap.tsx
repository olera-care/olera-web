"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  FocusEvent as ReactFocusEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import NodeTip from "./NodeTip";
import styles from "./OperatingMap.module.css";

/**
 * The Olera operating map — every step of the marketplace, in one figure.
 *
 * Most nodes carry a live number; the rest render a dash rather than a
 * guess. Wiring a metric is a one-line change at the node, never a layout
 * change: the connectors are computed from measured DOM geometry at draw
 * time, so a card can grow a number, change its label, or change its width
 * and every arrow still lands on it.
 *
 * The one contract that matters: a node's `id` is its identity. `nodeId()`
 * namespaces them so short keys like "cs3" cannot collide with anything else
 * rendered on an admin page. Rename a label freely; renaming an id breaks
 * the wire that references it.
 *
 * The figure is laid out at a fixed FIGURE_WIDTH and then scaled to fit the
 * space on screen — both directions, so the whole map is visible at once
 * without scrolling either way. Laying it out at a fixed size and shrinking
 * it keeps every proportion and line break identical at any size; a fluid
 * layout would reflow labels and quietly change the shape of the funnel on
 * different monitors.
 */

/**
 * The width the figure is designed at. Everything scales from here.
 *
 * Deliberately wider than the space it usually lands in. The figure is
 * height-limited on every normal screen — six levels deep on the left — so
 * widening the design costs nothing in scale and spends the horizontal room
 * that was otherwise going to waste, while letting the type be set larger
 * for the same rendered height.
 */
const FIGURE_WIDTH = 1900;

/**
 * Below this the type is too small to read, so we stop shrinking and let
 * the page scroll instead. Only reachable in a very small window.
 */
const MIN_SCALE = 0.4;

/** Breathing room kept below the figure when fitting it to the viewport. */
const BOTTOM_GUTTER = 16;

/** Namespace every DOM id this component owns. */
const nodeId = (key: string) => `om-${key}`;

/** Placeholder for a node with no confident data source yet. */
const NOT_INSTRUMENTED = "—";

/** A city Olera has live providers in, as /api/admin/operating-map/cities returns it. */
interface City {
  city: string;
  state: string;
  slug: string;
  providers: number;
}

type CitiesState =
  | { status: "loading" }
  | { status: "ready"; cities: City[]; truncated: boolean }
  | { status: "error" };

/** One instrumented node, as /api/admin/operating-map/metrics returns it. */
export interface MetricNode {
  value: number | null;
  /** Named parts printed under the node's label. Null renders as a dash. */
  breakdown?: { label: string; value: number | null }[];
  /** Live caveat, shown in the tooltip only — never as text on the card. */
  caveat?: string | null;
}

export type MetricNodes = Record<string, MetricNode | undefined>;

/**
 * One node's direction, as /api/admin/operating-map/trends returns it.
 *
 * Eight fixed weeks, regardless of the range on screen, so the colour means
 * the same thing whatever period is selected. The colour reads the last week
 * against the one before; the arrow reads four weeks against the four before.
 */
export interface NodeTrend {
  /** -3 to +3. Zero is flat. */
  score: number;
  /** Week-over-week change as a fraction, or null when there was no baseline. */
  weekChange: number | null;
  monthDirection: -1 | 0 | 1;
  week: { now: number; prior: number };
  month: { now: number; prior: number };
  /** Eight consecutive weeks, oldest first. The sparkline in the panel. */
  series: number[];
}

export type NodeTrends = Record<string, NodeTrend | undefined>;

/** The class that paints a value its trend colour. Flat keeps ordinary ink. */
export function toneClass(score: number): string | null {
  const step = Math.min(3, Math.abs(score));
  if (step === 0) return null;
  return styles[score > 0 ? `tUp${step}` : `tDown${step}`] ?? null;
}

/**
 * The index system.
 *
 * The prefix is the lane and the number runs straight down it: CR for the
 * care seeker, CP for the care provider, CW for the care worker. Everything
 * below the lanes is an O, numbered across both stacks — O1 to O3 is what a
 * family and a provider make together, O4 to O6 what a provider and a care
 * worker make.
 *
 * The code is also the node's key, end to end — DOM id, metric, trend,
 * drill-down source, consistency check. Renaming a label is free; renaming
 * a code means renaming it in all five places, or the map starts answering
 * a different question than the one you clicked.
 */

/**
 * What a node's number means, in the fewest words that still let someone act
 * on it: what is counted, where it comes from, how to read it. Only nodes
 * that show a number get one — a dash needs no explanation.
 */
const NODE_HELP: Record<string, string> = {
  cities:
    "Cities with at least one live provider. Wider than the cities we have deliberately launched.",

  cs1:
    "The two care seeker actions that produce a record we can work. Questions are the cheapest ask and would swamp the other two, so they are counted elsewhere. Below it, the traffic all of this comes out of.",
  cs2:
    "Families we emailed in this range, counted once each however many times we wrote. The mirror of providers in outreach and advisors in outreach.",
  cs3: "Care seeker profiles begun in this range, at any stage of completion.",
  cs4:
    "Families who told us they are moving forward with a benefit. Applying happens on a government site, so this is their own report — a floor, not a count.",

  cp1:
    "Providers in the directory nobody has claimed — the supply outreach works through. Scoped by the provider's city. A standing count, so the date range does not change it.",
  cp2:
    "Inactive providers who heard from us in this range — any email, call or MedJobs contact. Counts providers, not messages, so twenty emails to one provider is one.",
  cp3:
    "Providers who became active in this range. Claiming the listing is all it takes — verification is a further step, counted separately.",
  cp4: "Providers who requested a managed ad campaign in this range.",
  cp5: "Providers who activated MedJobs staffing in this range.",

  cw1:
    "Universities we are working, scoped by the university's city. A standing count — the date range does not change it.",
  cw2:
    "Advisors we have actually contacted — at least one touchpoint against them. The gap from the advisors on file is supply we have not tried yet.",
  cw3:
    "MedJobs applications begun and how many are finished — a profile goes live once the intro video and documents are in. Channels activated has no source yet.",

  o1:
    "Families and providers who actually connected, by the same rule the Connections page uses: a provider reply, a confirmation from either side, or an admin marking it.",

  o4:
    "Interviews with a time agreed — the point a provider and a care worker are actually in contact. Counts scheduled, including the ones since held.",
  o5: "Placements the care worker accepted.",
};

/** Tooltip anchored to a node, positioned outside the scaled figure. */
interface Tip {
  text: string;
  /** Which node opened it — the panel derives everything else from this. */
  nodeKey: string;
  caveat?: string | null;
  trend?: NodeTrend | null;
  x: number;
  y: number;
}

export default function OperatingMap({
  selectedCity,
  onSelectCity,
  nodes,
  trends,
  metricsLoading,
  onInspect,
  controls,
}: {
  /** Slug of the city the map is scoped to, or null for all cities. */
  selectedCity: string | null;
  onSelectCity: (slug: string | null) => void;
  /** Instrumented node values, keyed by node id. Missing = not instrumented. */
  nodes: MetricNodes;
  /** Direction per node. Arrives after the values; missing = uncoloured. */
  trends: NodeTrends;
  metricsLoading: boolean;
  /** Open the receipts for a node. Omitted when inspection is unavailable. */
  onInspect?: (nodeKey: string) => void;
  /**
   * The view's own period and visibility controls, rendered beside the city
   * picker so scope and period read as one row instead of two.
   */
  controls?: ReactNode;
}) {
  const [cities, setCities] = useState<CitiesState>({ status: "loading" });
  const [tip, setTip] = useState<Tip | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  /**
   * Which parents have their substeps showing. Everything starts closed: the
   * map is one picture of the business first, and the detail underneath a
   * node is there for whoever is working that node today.
   */
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const sub = useCallback(
    (key: string, count: number) => ({
      open: Boolean(open[key]),
      count,
      onToggle: () => setOpen((o) => ({ ...o, [key]: !o[key] })),
    }),
    [open],
  );
  const pickerRef = useRef<HTMLDivElement>(null);
  const rootWrapRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    const sys = rootRef.current;
    const svg = svgRef.current;
    const fit = fitRef.current;
    const stage = stageRef.current;
    if (!sys || !svg || !fit || !stage) return;

    // Fit the figure to the space we were given, in both directions: the
    // map is only worth drawing as one picture if the whole picture is on
    // screen. Written before measuring, so the geometry below is read from
    // the layout we actually ship.
    const availableW = fit.clientWidth;
    // Distance from the top of the document, so a scrolled page cannot
    // inflate the room we think we have.
    const docTop = fit.getBoundingClientRect().top + window.scrollY;
    const availableH = document.documentElement.clientHeight - docTop - BOTTOM_GUTTER;
    const figureHeight = sys.offsetHeight;
    const byWidth = availableW > 0 ? availableW / FIGURE_WIDTH : 1;
    const byHeight = availableH > 0 && figureHeight > 0 ? availableH / figureHeight : 1;
    // Rounded so sub-pixel jitter cannot ping-pong between two scales.
    const scale = Math.max(
      MIN_SCALE,
      Math.round(Math.min(1, byWidth, byHeight) * 1000) / 1000,
    );
    const nextTransform = scale < 1 ? `scale(${scale})` : "";
    if (sys.style.transform !== nextTransform) sys.style.transform = nextTransform;

    // A transform paints smaller but still occupies its full layout box, so
    // the figure would keep reserving FIGURE_WIDTH and grow a scrollbar the
    // scaling was meant to remove. The stage is sized to what you actually
    // see and clips the untransformed box behind it.
    const stageWidth = `${Math.ceil(FIGURE_WIDTH * scale)}px`;
    const stageHeight = `${Math.ceil(figureHeight * scale)}px`;
    if (stage.style.width !== stageWidth) stage.style.width = stageWidth;
    if (stage.style.height !== stageHeight) stage.style.height = stageHeight;

    // Taken from the <svg> React already put in the tree rather than written
    // out as a literal. A namespace typo creates elements that are not SVG,
    // which renders nothing at all and reports no error — and a URL in a
    // string is the one thing in this file a rename can silently corrupt.
    const SVG_NS = svg.namespaceURI;
    /** Gap left between a card's edge and the arrow that touches it. */
    const G = 5;
    /**
     * How far in from a card's left edge every vertical line sits.
     *
     * One inset for the whole figure, stems and lane steps alike, so the
     * arrows read as a single spine down each lane rather than a centre line
     * that jumps sideways wherever something branches off it.
     */
    const IN = 22;

    // Unscaled layout dimensions: getBoundingClientRect below is divided by
    // the same scale, so the SVG and the measurements share one coordinate
    // space no matter what the figure is rendered at.
    const w = sys.scrollWidth;
    const h = sys.scrollHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));
    svg.replaceChildren();

    type Box = { l: number; r: number; t: number; b: number; cx: number; cy: number };

    /** Measure a node, or null when it is collapsed out of the figure. */
    function maybe(key: string): Box | null {
      return document.getElementById(nodeId(key)) ? box(key) : null;
    }

    /** Measure a node in the figure's own coordinate space. */
    function box(key: string): Box {
      const node = document.getElementById(nodeId(key));
      if (!node) throw new Error(`operating map: missing node "${key}"`);
      const r = node.getBoundingClientRect();
      const c = sys!.getBoundingClientRect();
      // Both rects are scaled by the same factor, so dividing the deltas by
      // it returns unscaled figure coordinates.
      const k = scale;
      return {
        l: (r.left - c.left) / k,
        r: (r.right - c.left) / k,
        t: (r.top - c.top) / k,
        b: (r.bottom - c.top) / k,
        cx: ((r.left + r.right) / 2 - c.left) / k,
        cy: ((r.top + r.bottom) / 2 - c.top) / k,
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

    const vDown = (a: string, b: string) => {
      const A = box(a);
      const B = box(b);
      vArrow(A.l + IN, A.b + G, B.t - G);
    };
    /** Branch off a vertical stem into a card sitting to its right. Silent
        when that card is collapsed away — a hidden step has no arrow. */
    const fromStem = (x: number, b: string) => {
      const B = maybe(b);
      if (B) hArrow(B.cy, x + 1, B.l - G);
    };

    /*
     * Every arrow is a claim about what causes what, so the geometry makes
     * the same claim: a lane's own steps run down its middle, a branch hangs
     * off a stem to one side, and each join below is fed by both lanes above
     * it — the left lane down its right edge, the right lane down its left,
     * meeting over the card that sits between them.
     */

    /*
     * Care seeker: pages, then the seekers they turn into, then the care
     * that gets confirmed. One stem down each parent's left, with a head
     * into whichever of its steps are showing, carrying on to the next
     * parent below it.
     */
    const pages = box("visits");
    const cs3 = box("cs3");
    const confirmedCare = box("o2");

    const pageStem = pages.l + IN;
    vArrow(pageStem, pages.b + G, cs3.t - G);
    for (const k of ["csHomePage", "visitsProvider", "visitsEditorial", "visitsBenefits"]) {
      fromStem(pageStem, k);
    }

    /* and one more down the provider surface's left, for the question it
       produces — a question is asked from a provider's page */
    const providerPages = maybe("visitsProvider");
    const question = maybe("cs1a");
    if (providerPages && question) {
      const askStem = providerPages.l + IN;
      seg(askStem, providerPages.b + G, askStem, question.cy);
      fromStem(askStem, "cs1a");
    }

    const seekStem = cs3.l + IN;
    vArrow(seekStem, cs3.b + G, confirmedCare.t - G);
    for (const k of ["cs1b", "cs1c"]) fromStem(seekStem, k);

    /* and one more down the assessment's own left, for the aid it starts */
    const assessment = maybe("cs1c");
    const lastAid = maybe("cs5");
    if (assessment && lastAid) {
      const aidStem = assessment.l + IN;
      seg(aidStem, assessment.b + G, aidStem, lastAid.cy);
      fromStem(aidStem, "cs4");
      fromStem(aidStem, "cs5");
    }

    /*
     * Care provider: the directory, then the providers who claimed a listing
     * out of it, then the care they deliver. One stem down each parent's
     * left, a head into whichever of its steps are showing, carrying on to
     * the next parent below it.
     */
    const cp1 = box("cp1");
    const claimed = box("cp3");
    const outreachStem = cp1.l + IN;
    vArrow(outreachStem, cp1.b + G, claimed.t - G);
    for (const k of ["cp2a", "cp2b", "cp2c", "cp2d"]) fromStem(outreachStem, k);

    /* and one down MedJobs target's own left, when it is open */
    const medjobs = maybe("cp2b");
    const medjobsLast = maybe("cp2b2");
    if (medjobs && medjobsLast) {
      const medStem = medjobs.l + IN;
      seg(medStem, medjobs.b + G, medStem, medjobsLast.cy);
      fromStem(medStem, "cp2b1");
      fromStem(medStem, "cp2b2");
    }

    const claimStem = claimed.l + IN;
    vArrow(claimStem, claimed.b + G, box("newClients").t - G);
    for (const k of ["cp3a", "o1", "questionsAnswered", "cp4", "cp5"]) fromStem(claimStem, k);

    /*
     * Care worker: campuses, then the qualified workers the campus run
     * produces, then the hires confirmed out of them.
     */
    const qualified = box("cw3");
    const campusStem = box("cw1").l + IN;
    vArrow(campusStem, box("cw1").b + G, qualified.t - G);
    for (const k of ["cw2", "studentApplications"]) fromStem(campusStem, k);

    const workerStem = qualified.l + IN;
    vArrow(workerStem, qualified.b + G, box("o5").t - G);
    fromStem(workerStem, "o4");

    /* the campus run, and the applications it produces, each carry their own */
    const campus = maybe("cw2");
    const campusLast = maybe("cw2h");
    if (campus && campusLast) {
      const activationStem = campus.l + IN;
      seg(activationStem, campus.b + G, activationStem, campusLast.cy);
      for (const k of ["cw2a", "cw2b", "cw2c", "cw2d", "cw2e", "cw2f", "cw2g", "cw2h"]) {
        fromStem(activationStem, k);
      }
    }
    /* The second outcome of a lane follows from the first rather than under
       it, so the two share a row and the arrow between them runs across. */
    const across = (a: string, b: string) => {
      const A = box(a);
      const B = box(b);
      hArrow(B.cy, A.r + G, B.l - G);
    };
    across("o2", "aidReceived");
    across("newClients", "newCareWorkers");

    const apps = maybe("studentApplications");
    const appsLast = maybe("cw3b");
    if (apps && appsLast) {
      const appStem = apps.l + IN;
      seg(appStem, apps.b + G, appStem, appsLast.cy);
      fromStem(appStem, "cw3a");
      fromStem(appStem, "cw3b");
    }

  }, []);

  useLayoutEffect(() => {
    draw();
  }, [draw, open]);

  useLayoutEffect(() => {
    // Two passes: once on mount, once after the web font settles. Inter
    // changes card heights, and every arrow is measured from those heights.
    draw();
    const node = rootRef.current;
    if (!node) return;

    // ResizeObserver reports layout size, which the transform does not
    // affect, so watching both the wrapper (available width) and the figure
    // (content height) cannot feed back into itself.
    const observer = new ResizeObserver(() => draw());
    observer.observe(node);
    if (fitRef.current) observer.observe(fitRef.current);

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

  // A value or its caveat can change a card's height, and every arrow is
  // measured from those heights.
  useLayoutEffect(() => {
    // Values change card heights, and every arrow is measured from those.
    draw();
  }, [draw, nodes, metricsLoading]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/operating-map/cities", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("cities failed"))))
      .then((d) =>
        setCities({
          status: "ready",
          cities: (d.cities ?? []) as City[],
          truncated: Boolean(d.truncated),
        }),
      )
      .catch((e: unknown) => {
        if ((e as Error)?.name === "AbortError") return;
        // No fallback number: the top node is the scope everything else is
        // read against, so a wrong count there is worse than no count.
        setCities({ status: "error" });
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  const active = useMemo(
    () =>
      cities.status === "ready"
        ? cities.cities.find((c) => c.slug === selectedCity) ?? null
        : null,
    [cities, selectedCity],
  );

  const pillLabel = active
    ? `${active.city}, ${active.state}`
    : "All cities";

  /**
   * Anchor a tooltip under the element that triggered it. Measured against
   * the unscaled root so the tooltip renders at full size, whatever the
   * figure has been scaled to.
   */
  // draw() has no dependencies by design — it measures the DOM rather than
  // reading state — so the arrow labels reach it through a ref, and the
  // effect below redraws when they land.
  const inspectRef = useRef<((nodeKey: string) => void) | undefined>(undefined);
  inspectRef.current = onInspect;
  // draw() is deliberately dependency-free, so the tooltip it opens for the
  // wire counts arrives the same way their values do.
  const tipRef = useRef<{
    open: TipOpener;
    close: () => void;
    trends: NodeTrends;
  } | null>(null);

  /*
   * The panel carries links, so it has to survive the pointer travelling
   * from the number into it. A short grace period on leave, cancelled when
   * the pointer lands inside, is the whole mechanism.
   */
  const closeTimer = useRef<number | null>(null);
  const cancelClose = useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);
  const closeTip = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setTip(null), 140);
  }, [cancelClose]);

  const openTip = useCallback((
    el: HTMLElement,
    key: string,
    caveat?: string | null,
    trend?: NodeTrend | null,
  ) => {
    const text = NODE_HELP[key];
    if (!text) return;
    const root = rootWrapRef.current;
    if (!root) return;
    cancelClose();
    const r = el.getBoundingClientRect();
    const c = root.getBoundingClientRect();
    const TIP_WIDTH = 320;
    // Roughly what the panel occupies with a sparkline, a diagnosis and a
    // link. Only used to decide which side of the number to open on, so an
    // approximation is enough.
    const TIP_HEIGHT = 250;
    // Keep it inside the wrapper rather than letting it hang off the edge.
    const x = Math.min(Math.max(r.left - c.left - 8, 8), Math.max(c.width - TIP_WIDTH - 8, 8));
    const below = r.bottom - c.top + 8;
    // Nodes low in the figure open upwards, so the panel is never mostly
    // off the bottom of the page.
    const y = below + TIP_HEIGHT > c.height ? Math.max(8, r.top - c.top - TIP_HEIGHT) : below;
    setTip({ text, nodeKey: key, caveat, trend, x, y });
  }, [cancelClose]);

  // Read at hover time rather than at draw time, so the wire counts pick up
  // trends that arrive after the figure was last drawn.
  tipRef.current = { open: openTip, close: closeTip, trends };

  return (
    <div className={styles.root} ref={rootWrapRef} style={{ position: "relative" }}>
      {tip && (
        <NodeTip
          text={tip.text}
          nodeKey={tip.nodeKey}
          caveat={tip.caveat}
          metric={nodes[tip.nodeKey]}
          traffic={nodes.traffic}
          trend={tip.trend}
          trends={trends}
          tone={tip.trend ? toneClass(tip.trend.score) : null}
          inspectable={INSPECTABLE.has(tip.nodeKey)}
          x={tip.x}
          y={tip.y}
          onEnter={cancelClose}
          onLeave={closeTip}
        />
      )}
      {/*
        Scope and period on one line, above the figure rather than inside it.
        Everything inside .fit is scaled to fit the screen, so a control
        rendered in there would shrink along with the map.
      */}
      <div className={styles.controls} ref={pickerRef}>
        <div style={{ position: "relative" }}>
            <button
              type="button"
              className={styles.filterPill}
              onClick={() => setPickerOpen((v) => !v)}
              aria-expanded={pickerOpen}
              aria-haspopup="listbox"
              onMouseEnter={(e) => openTip(e.currentTarget, "cities")}
              onMouseLeave={closeTip}
              onFocus={(e) => openTip(e.currentTarget, "cities")}
              onBlur={closeTip}
            >
              {pillLabel}
              {!active && (
                <span className={styles.filterCount}>
                  {cities.status === "ready"
                    ? `${cities.truncated ? "≥" : ""}${cities.cities.length.toLocaleString()}`
                    : cities.status === "loading"
                      ? "…"
                      : NOT_INSTRUMENTED}
                </span>
              )}
              {active && (
                <span className={styles.filterCount}>
                  {active.providers.toLocaleString()} providers
                </span>
              )}
              <span className={styles.filterCaret}>▼</span>
            </button>
            {pickerOpen && (
              <div className={styles.picker} role="listbox">
                <button
                  type="button"
                  className={styles.pickerItem}
                  aria-current={!selectedCity}
                  onClick={() => {
                    onSelectCity(null);
                    setPickerOpen(false);
                  }}
                >
                  <span>All cities</span>
                  {cities.status === "ready" && (
                    <span className={styles.pickerCount}>
                      {cities.cities.length.toLocaleString()}
                    </span>
                  )}
                </button>
                {cities.status === "ready" &&
                  cities.cities.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      className={styles.pickerItem}
                      aria-current={c.slug === selectedCity}
                      onClick={() => {
                        onSelectCity(c.slug);
                        setPickerOpen(false);
                      }}
                    >
                      <span>{`${c.city}, ${c.state}`}</span>
                      <span className={styles.pickerCount}>
                        {c.providers.toLocaleString()}
                      </span>
                    </button>
                  ))}
                {cities.status === "loading" && (
                  <div className={styles.pickerNote}>Loading cities…</div>
                )}
                {cities.status === "error" && (
                  <div className={styles.pickerNote}>
                    Could not load cities. The count is not reported as zero.
                  </div>
                )}
                {cities.status === "ready" && cities.truncated && (
                  <div className={styles.pickerNote}>
                    Row ceiling reached — this list is a floor, not the full set.
                  </div>
                )}
              </div>
            )}
        </div>
        {controls}
        {/* An outcome of the whole map rather than of one lane, so it sits
            with the scope controls rather than inside the figure. */}
        <div className={styles.topStat}>
          <span className={styles.lab}>Revenue generated</span>
          {/* Stated, not queried. Nothing has been collected yet, and a dash
              here would read as "we do not know" rather than "none". */}
          <span className={styles.v}>$0</span>
        </div>
      </div>

      <div className={styles.fit} ref={fitRef}>
        <div className={styles.stage} ref={stageRef}>
          <section className={styles.system} ref={rootRef}>
          <svg className={styles.wires} ref={svgRef} role="presentation" />

          <div className={styles.lanes3} style={{ marginBottom: 8 }}>
            <div className={styles.lab}>Care seeker</div>
            <div className={styles.lab}>Care provider</div>
            <div className={styles.lab}>Care worker</div>
          </div>

          {/*
            Three lanes, each running top to bottom from demand or supply
            down to the milestone it produces. What two lanes produce
            together lives below them, between them.
          */}
          <div className={styles.lanes3}>

            {/* care seeker */}
            <div className={styles.lane}>
                  <Card
                    substeps={sub("cs1", 4)}
                    id="visits"
                    code="CS1"
                    label="Directory website traffic"
                    metric={nodes.visits}
                    trend={trends.visits}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              {/* the four surfaces the traffic lands on, and the question a
                  provider page produces */}
              {open.cs1 && (
                <div className={styles.branchR}>
                    <Card
                      id="csHomePage"
                      code="CS1A"
                      label="Home page"
                      metric={nodes.csHomePage}
                      trend={trends.csHomePage}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      substeps={sub("cs1b", 1)}
                      id="visitsProvider"
                      code="CS1B"
                      label="Provider pages"
                      metric={nodes.visitsProvider}
                      trend={trends.visitsProvider}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                {open.cs1b && (
                  <div className={styles.branchR2}>
                      <Card
                        id="cs1a"
                        code="CS1B1"
                        label="Provider questions asked"
                        metric={nodes.cs1a}
                        trend={trends.cs1a}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                  </div>
                )}
                    <div className={styles.gap} />
                    <Card
                      id="visitsEditorial"
                      code="CS1C"
                      label="Editorial pages"
                      metric={nodes.visitsEditorial}
                      trend={trends.visitsEditorial}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      id="visitsBenefits"
                      code="CS1D"
                      label="Benefits pages"
                      metric={nodes.visitsBenefits}
                      trend={trends.visitsBenefits}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                </div>
              )}
              <div className={styles.gap} />
                  <Card
                    substeps={sub("cs2", 2)}
                    id="cs3"
                    code="CS2"
                    label="Active care seekers"
                    metric={nodes.cs3}
                    trend={trends.cs3}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              {/* what an active care seeker actually does. The aid track
                  hangs off the assessment that starts it, not off the
                  seeker, because that is the order it happens in. */}
              {open.cs2 && (
                <div className={styles.branchR}>
                    <Card
                      id="cs1b"
                      code="CS2A"
                      label="Provider connection requests submitted"
                      metric={nodes.cs1b}
                      trend={trends.cs1b}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      substeps={sub("cs2b", 2)}
                      id="cs1c"
                      code="CS2B"
                      label="Benefits assessment submitted"
                      metric={nodes.cs1c}
                      trend={trends.cs1c}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                {open.cs2b && (
                  <div className={styles.branchR2}>
                      <Card
                        id="cs4"
                        code="CS2B1"
                        label="Aid applications submitted"
                        metric={nodes.cs4}
                        trend={trends.cs4}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cs5"
                        code="CS2B2"
                        label="Aid confirmed"
                        metric={nodes.cs5}
                        trend={trends.cs5}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                  </div>
                )}
                </div>
              )}
              <div className={styles.gapLg} />
              <div className={styles.pair}>
                  <Card
                    id="o2"
                    code="CSO1"
                    label="Care received"
                    metric={nodes.o2}
                    trend={trends.o2}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
                  <Card
                    id="aidReceived"
                    code="CSO2"
                    label="Aid received"
                    metric={nodes.aidReceived}
                    trend={trends.aidReceived}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              </div>
            </div>

            {/* care provider */}
            <div className={styles.lane}>
                  <Card
                    substeps={sub("cp1", 4)}
                    id="cp1"
                    code="CP1"
                    label="Inactive providers"
                    metric={nodes.cp1}
                    trend={trends.cp1}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              {/* the four ways a provider enters outreach */}
              {open.cp1 && (
                <div className={styles.branchR}>
                    <Card
                      id="cp2a"
                      code="CP1A"
                      label="City-based cold start"
                      metric={nodes.cp2a}
                      trend={trends.cp2a}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      substeps={sub("cp1b", 2)}
                      id="cp2b"
                      code="CP1B"
                      label="MedJobs target"
                      metric={nodes.cp2b}
                      trend={trends.cp2b}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                {open.cp1b && (
                  <div className={styles.branchR2}>
                      <Card
                        id="cp2b1"
                        code="CP1B1"
                        label="MedJobs outbound work"
                        metric={nodes.cp2b1}
                        trend={trends.cp2b1}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cp2b2"
                        code="CP1B2"
                        label="MedJobs provider meetings held"
                        metric={nodes.cp2b2}
                        trend={trends.cp2b2}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                  </div>
                )}
                    <div className={styles.gap} />
                    <Card
                      id="cp2c"
                      code="CP1C"
                      label="Provider questions sent"
                      metric={nodes.cp2c}
                      trend={trends.cp2c}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      id="cp2d"
                      code="CP1D"
                      label="Provider connection requests sent"
                      metric={nodes.cp2d}
                      trend={trends.cp2d}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                </div>
              )}
              <div className={styles.gap} />
                  <Card
                    substeps={sub("cp2", 5)}
                    id="cp3"
                    code="CP2"
                    label="Active providers"
                    metric={nodes.cp3}
                    trend={trends.cp3}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              {/* everything a claimed provider does */}
              {open.cp2 && (
                <div className={styles.branchR}>
                    <Card
                      id="cp3a"
                      code="CP2A"
                      label="Profiles completed"
                      metric={nodes.cp3a}
                      trend={trends.cp3a}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      id="o1"
                      code="CP2B"
                      label="Provider–care seeker connected"
                      metric={nodes.o1}
                      trend={trends.o1}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      id="questionsAnswered"
                      code="CP2C"
                      label="Questions answered"
                      metric={nodes.questionsAnswered}
                      trend={trends.questionsAnswered}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      money="Paid product"
                      id="cp4"
                      code="CP2D"
                      label="Premium growth suite signups"
                      metric={nodes.cp4}
                      trend={trends.cp4}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                    <div className={styles.gap} />
                    <Card
                      id="cp5"
                      code="CP2E"
                      label="Student caregiver program signups"
                      metric={nodes.cp5}
                      trend={trends.cp5}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                </div>
              )}
              <div className={styles.gapLg} />
              <div className={styles.pair}>
                  <Card
                    id="newClients"
                    code="CPO1"
                    label="New clients"
                    metric={nodes.newClients}
                    trend={trends.newClients}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
                  <Card
                    id="newCareWorkers"
                    code="CPO2"
                    label="New care workers"
                    metric={nodes.newCareWorkers}
                    trend={trends.newCareWorkers}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              </div>
            </div>

            {/* care worker */}
            <div className={styles.lane}>
                  <Card
                    substeps={sub("cw1", 2)}
                    id="cw1"
                    code="CW1"
                    label="Universities targeted"
                    metric={nodes.cw1}
                    trend={trends.cw1}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              {/* the campus run: activating a university, and the
                  applications the activated channels produce */}
              {open.cw1 && (
                <div className={styles.branchR}>
                    <Card
                      substeps={sub("cw1a", 8)}
                      id="cw2"
                      code="CW1A"
                      label="Universities activated"
                      metric={nodes.cw2}
                      trend={trends.cw2}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                {open.cw1a && (
                  <div className={styles.branchR2}>
                      <Card
                        id="cw2a"
                        code="CW1A1"
                        label="Student advisors targeted"
                        metric={nodes.cw2a}
                        trend={trends.cw2a}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2b"
                        code="CW1A2"
                        label="Student advisors in outreach"
                        metric={nodes.cw2b}
                        trend={trends.cw2b}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2c"
                        code="CW1A3"
                        label="Advisor meetings held"
                        metric={nodes.cw2c}
                        trend={trends.cw2c}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2d"
                        code="CW1A4"
                        label="University job board"
                        metric={nodes.cw2d}
                        trend={trends.cw2d}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2e"
                        code="CW1A5"
                        label="Advisor listservs"
                        metric={nodes.cw2e}
                        trend={trends.cw2e}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2f"
                        code="CW1A6"
                        label="Student organisations"
                        metric={nodes.cw2f}
                        trend={trends.cw2f}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2g"
                        code="CW1A7"
                        label="Campus events"
                        metric={nodes.cw2g}
                        trend={trends.cw2g}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw2h"
                        code="CW1A8"
                        label="Professors and class visits"
                        metric={nodes.cw2h}
                        trend={trends.cw2h}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                  </div>
                )}
                    <div className={styles.gap} />
                    <Card
                      substeps={sub("cw1b", 2)}
                      id="studentApplications"
                      code="CW1B"
                      label="Student applications"
                      metric={nodes.studentApplications}
                      trend={trends.studentApplications}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                {open.cw1b && (
                  <div className={styles.branchR2}>
                      <Card
                        id="cw3a"
                        code="CW1B1"
                        label="Student applications initiated"
                        metric={nodes.cw3a}
                        trend={trends.cw3a}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                      <div className={styles.gap} />
                      <Card
                        id="cw3b"
                        code="CW1B2"
                        label="Student applications completed"
                        metric={nodes.cw3b}
                        trend={trends.cw3b}
                        loading={metricsLoading}
                        onTip={openTip}
                        onTipClose={closeTip}
                        onInspect={onInspect}
                      />
                  </div>
                )}
                </div>
              )}
              <div className={styles.gap} />
                  <Card
                    substeps={sub("cw2", 1)}
                    id="cw3"
                    code="CW2"
                    label="Qualified care workers"
                    metric={nodes.cw3}
                    trend={trends.cw3}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
              {open.cw2 && (
                <div className={styles.branchR}>
                    <Card
                      id="o4"
                      code="CW2A"
                      label="Care worker–provider connected"
                      metric={nodes.o4}
                      trend={trends.o4}
                      loading={metricsLoading}
                      onTip={openTip}
                      onTipClose={closeTip}
                      onInspect={onInspect}
                    />
                </div>
              )}
              <div className={styles.gapLg} />
                  <Card
                    money="Paid product"
                    id="o5"
                    code="CWO1"
                    label="Care workers hired"
                    metric={nodes.o5}
                    trend={trends.o5}
                    loading={metricsLoading}
                    onTip={openTip}
                    onTipClose={closeTip}
                    onInspect={onInspect}
                  />
            </div>

          </div>

</section>
        </div>
      </div>
    </div>
  );
}

function Card({
  id,
  code,
  label,
  parts,
  hi,
  money,
  substeps,
  metric,
  trend,
  loading,
  onTip,
  onTipClose,
  onInspect,
}: {
  id: string;
  code: string;
  /** Sits on the same line as the code. Two lines for a name is one too many. */
  label: string;
  /**
   * Opts this node into a breakdown line, and gives the placeholder to show
   * until it is instrumented. Omit it and the node prints its total only,
   * however many parts its metric carries.
   */
  parts?: string;
  hi?: boolean;
  /** Tooltip shown on the $ marker. Omit for nodes that carry no money. */
  money?: string;
  /**
   * The detail underneath this node. Given, the card grows a disclosure that
   * shows or hides it, so the map is one screen by default and the steps of
   * whichever node you are working are one click away.
   */
  substeps?: { open: boolean; count: number; onToggle: () => void };
  metric?: MetricNode;
  trend?: NodeTrend;
  loading?: boolean;
  onTip?: TipOpener;
  onTipClose?: () => void;
  onInspect?: (nodeKey: string) => void;
}) {
  return (
    <div className={`${styles.card}${hi ? ` ${styles.hi}` : ""}`} id={nodeId(id)}>
      <div className={styles.cardHead}>
        <div className={styles.k}>
          {code}
          {money && (
            <span className={styles.paid} title={money}>
              $
            </span>
          )}
          <span className={styles.name}>{label}</span>
          {substeps && (
            <button
              type="button"
              className={styles.disc}
              aria-expanded={substeps.open}
              aria-label={`${substeps.open ? "Hide" : "Show"} the ${substeps.count} steps under ${code}`}
              onClick={substeps.onToggle}
            >
              <span aria-hidden>{substeps.open ? "▾" : "▸"}</span> {substeps.count}
            </button>
          )}
        </div>
        <span style={{ whiteSpace: "nowrap" }}>
          <MetricValue
            metric={metric}
            trend={trend}
            loading={loading}
            nodeKey={id}
            onInspect={onInspect}
            onTip={onTip}
            onTipClose={onTipClose}
          />
        </span>
      </div>
      {/* The slot is rendered on every card so every box in the figure is
          exactly the same height — a row of boxes that jumps between one
          line and two reads as an accident. It only carries a breakdown
          where the node asked for one: the numbers exist on every node, and
          printing all of them turns the map into a table. */}
      <div className={styles.n}>
        {parts !== undefined && <Surfaces metric={metric} fallback={parts} />}
      </div>
    </div>
  );
}

export type TipOpener = (
  el: HTMLElement,
  key: string,
  caveat?: string | null,
  trend?: NodeTrend | null,
) => void;

/**
 * A node's breakdown line. Renders the real parts once the node is
 * instrumented and the caller's placeholder until then, so wiring a metric
 * fills in numbers rather than adding a row of its own.
 */
function Surfaces({
  metric,
  fallback,
}: {
  metric?: MetricNode;
  /** Shown before the node is instrumented. */
  fallback?: string;
}) {
  const parts = metric?.breakdown;
  if (!parts?.length) return <span className={styles.dim}>{fallback}</span>;
  return (
    <span className={styles.dim}>
      {parts.map((p, i) => (
        <span key={p.label}>
          {i > 0 && " · "}
          {p.label}{" "}
          <b className={styles.surfaceValue}>
            {/* Null is a part with no source yet, not a zero. */}
            {p.value === null ? NOT_INSTRUMENTED : p.value.toLocaleString()}
          </b>
        </span>
      ))}
    </span>
  );
}

/** The number, or an honest placeholder. Never a zero standing in for
 *  "we don't know". */
function MetricValue({
  metric,
  trend,
  loading,
  nodeKey,
  onInspect,
  onTip,
  onTipClose,
}: {
  metric?: MetricNode;
  trend?: NodeTrend;
  loading?: boolean;
  nodeKey?: string;
  onInspect?: (nodeKey: string) => void;
  onTip?: TipOpener;
  onTipClose?: () => void;
}) {
  // Hovering the number opens its explanation. There is no separate icon:
  // one on every card was a field of small glyphs to look past, and the
  // number is the thing you are already looking at.
  const explains = Boolean(onTip && nodeKey && NODE_HELP[nodeKey]);
  const hover = explains
    ? {
        onMouseEnter: (e: ReactMouseEvent<HTMLElement>) =>
          onTip!(e.currentTarget, nodeKey!, metric?.caveat, trend ?? null),
        onMouseLeave: onTipClose,
        onFocus: (e: ReactFocusEvent<HTMLElement>) =>
          onTip!(e.currentTarget, nodeKey!, metric?.caveat, trend ?? null),
        onBlur: onTipClose,
      }
    : {};

  const placeholder = (text: string) => (
    // Wrapped like a real value, empty arrow slot and all, so a node without
    // a number sits exactly where one with a number sits. The wires are
    // measured geometry; a card that lays out differently moves them.
    <span className={styles.valueWrap}>
      <span className={styles.trendArrow} aria-hidden="true" />
      <span className={`${styles.value} ${styles.valueMuted}`} {...hover}>
        {text}
      </span>
    </span>
  );

  if (!metric) return placeholder(NOT_INSTRUMENTED);
  if (loading) return placeholder("…");
  if (metric.value === null) return placeholder(NOT_INSTRUMENTED);

  const text = metric.value.toLocaleString();
  const tone = trend ? toneClass(trend.score) : null;
  const arrow =
    trend && trend.monthDirection !== 0 ? (trend.monthDirection > 0 ? "▲" : "▼") : null;

  // A number you can open is a number you can check. Nodes without a source
  // descriptor stay plain text rather than offering a dead click.
  const inspectable = Boolean(onInspect && nodeKey && INSPECTABLE.has(nodeKey));

  return (
    <span className={styles.valueWrap}>
      {/* Always rendered, empty when there is no direction, so the slot
          reserves the same width on every card and the numbers stay in one
          column down the lane. */}
      <span className={`${styles.trendArrow}${tone ? ` ${tone}` : ""}`} aria-hidden="true">
        {arrow}
      </span>
      {inspectable ? (
        <button
          type="button"
          className={`${styles.value} ${styles.valueButton}${tone ? ` ${tone}` : ""}`}
          onClick={() => onInspect!(nodeKey!)}
          {...hover}
        >
          {text}
        </button>
      ) : (
        <span className={`${styles.value}${tone ? ` ${tone}` : ""}`} {...hover}>
          {text}
        </span>
      )}
    </span>
  );
}

/** Nodes the inspect endpoint can produce rows for. */
const INSPECTABLE = new Set([
  "visits", "cs1a", "cs1b", "cs1c",
  "cs3", "cs4",
  "cp1", "cp2", "cp3", "cp4", "cp5",
  "cw1", "cw2", "cw3",
  "o1", "o4", "o5",
]);


