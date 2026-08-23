"use client";

import { useState } from "react";
import {
  ROUTE_LABEL,
  routeSummary,
  type NavigatorPacket,
  type PacketRoute,
} from "@/lib/benefits/navigator-packet";

/**
 * The packet, rendered for the person deciding whether a letter sends.
 *
 * This sits ABOVE the letter in the drawer, not beside it, because the packet
 * answers a question you ask before reading: is this letter even the right
 * letter for this family? The old loop had that backwards — it fact-checked
 * phone numbers on letters whose program was wrong for the family, which is
 * how nine letters naming a program the family's own facts rule out reached
 * the queue and sat there.
 *
 * Disclosure follows AnswerPacketPanel's rule, for the same reason: counts
 * always visible, detail on demand. A wall of amber text gets skimmed; three
 * lines with numbers get read, and the number tells you the scale before you
 * read a word. Opening a section is the gate — it performs the reading
 * instead of asserting it.
 *
 * Visual rules, deliberately narrow:
 *   - one saturated element per packet: the route chip
 *   - attention is a dot, never a filled region
 *   - hairlines and whitespace separate groups; no nested filled boxes
 */

const ROUTE_STYLE: Record<PacketRoute, { chip: string; dot: string }> = {
  ask: { chip: "bg-violet-100 text-violet-800", dot: "bg-violet-500" },
  recompose: { chip: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
  review: { chip: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  auto: { chip: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
};

type SectionKey = "holds" | "fit" | "facts";

function Count({
  n,
  label,
  tone,
  open,
  onClick,
}: {
  n: number;
  label: string;
  tone: "warn" | "quiet";
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
        open ? "bg-gray-50" : "hover:bg-gray-50"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone === "warn" ? "bg-amber-500" : "bg-gray-300"}`}
        aria-hidden="true"
      />
      <span className="text-[13px] tabular-nums text-gray-900">{n}</span>
      <span className="text-[13px] text-gray-500">{label}</span>
      <svg
        viewBox="0 0 10 6"
        className={`ml-auto h-1.5 w-2.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M1 1l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function NavigatorPacketPanel({ packet }: { packet: NavigatorPacket }) {
  const [open, setOpen] = useState<SectionKey | null>(null);
  const toggle = (k: SectionKey) => setOpen((cur) => (cur === k ? null : k));
  const style = ROUTE_STYLE[packet.route];

  const built = new Date(packet.builtAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  // A single read means the second model never answered — usually a missing
  // OPENAI_API_KEY. Worth saying, because the gate degrades silently.
  const oneRead = packet.route !== "ask" && packet.fit.length === 1;

  return (
    <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style.chip}`}>
          {ROUTE_LABEL[packet.route]}
        </span>
        <span className="text-[13px] text-gray-600">{routeSummary(packet)}</span>
        <span className="ml-auto text-[11px] text-gray-400">checked {built}</span>
      </div>

      {packet.recomposeTarget && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-gray-700">
          <span className="text-gray-400">Both models would start with </span>
          <span className="font-semibold text-gray-900">{packet.recomposeTarget.name}</span>
          {packet.recomposeTarget.programId ? (
            <span className="text-gray-400">. Recompose will switch to it.</span>
          ) : (
            <span className="text-gray-400">, but it did not match a program we hold, so recompose will pick from the ladder.</span>
          )}
        </p>
      )}

      <div className="mt-2.5 space-y-0.5 border-t border-gray-100 pt-2.5">
        {packet.holds.length > 0 && (
          <>
            <Count
              n={packet.holds.length}
              label={packet.holds.length === 1 ? "reason it is waiting" : "reasons it is waiting"}
              tone="warn"
              open={open === "holds"}
              onClick={() => toggle("holds")}
            />
            {open === "holds" && (
              <ul className="space-y-1.5 px-2 pb-2 pt-1">
                {packet.holds.map((h, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-gray-700">
                    <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {packet.fit.length > 0 && (
          <>
            <Count
              n={packet.fit.length}
              label={
                packet.fit.length === 1
                  ? "model judged the program fit"
                  : "models judged the program fit"
              }
              tone={packet.fit.some((f) => f.verdict !== "good") ? "warn" : "quiet"}
              open={open === "fit"}
              onClick={() => toggle("fit")}
            />
            {open === "fit" && (
              <div className="space-y-2 px-2 pb-2 pt-1">
                {packet.fit.map((f, i) => (
                  <div key={i} className="text-[12.5px] leading-relaxed">
                    <p className="text-gray-900">
                      <span className="font-semibold">{f.verdict}</span>
                      <span className="ml-1.5 font-mono text-[11px] text-gray-400">{f.model}</span>
                    </p>
                    <p className="text-gray-600">{f.why}</p>
                    {f.better && (
                      <p className="mt-0.5 text-gray-500">
                        Would start with <span className="text-gray-800">{f.better}</span> instead.
                      </p>
                    )}
                  </div>
                ))}
                {oneRead && (
                  <p className="text-[11px] text-gray-400">
                    Only one model answered. The second read needs OPENAI_API_KEY set.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <Count
          n={packet.facts.directional.length + packet.facts.screening.length}
          label="facts this family gave us"
          tone={packet.facts.enoughToPick ? "quiet" : "warn"}
          open={open === "facts"}
          onClick={() => toggle("facts")}
        />
        {open === "facts" && (
          <div className="space-y-1.5 px-2 pb-2 pt-1 text-[12.5px] leading-relaxed">
            {packet.facts.directional.length > 0 ? (
              <p className="text-gray-700">
                <span className="text-gray-400">What they need — </span>
                {packet.facts.directional.join(" · ")}
              </p>
            ) : (
              <p className="text-gray-700">
                <span className="text-gray-400">What they need — </span>
                <span className="text-violet-700">nothing. This is why we ask instead of picking.</span>
              </p>
            )}
            {packet.facts.screening.length > 0 && (
              <p className="text-gray-700">
                <span className="text-gray-400">Might qualify — </span>
                {packet.facts.screening.join(" · ")}
              </p>
            )}
            {packet.facts.missing.length > 0 && (
              <p className="text-gray-500">
                <span className="text-gray-400">Missing — </span>
                {packet.facts.missing.join("; ")}
              </p>
            )}
          </div>
        )}
      </div>

      {packet.clearance && (
        <p className="mt-2 border-t border-gray-100 pt-2 text-[11px] text-gray-400">
          {packet.clearance.lastVerifiedDate
            ? `Program last verified ${packet.clearance.lastVerifiedDate}`
            : "Program has never been verified"}
          {packet.clearance.highFindings.length > 0 && (
            <span className="text-rose-600"> · {packet.clearance.highFindings.join(", ")}</span>
          )}
        </p>
      )}
    </div>
  );
}
