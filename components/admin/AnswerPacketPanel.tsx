"use client";

import { useEffect, useRef, useState } from "react";
import {
  MAX_REPLY_CHARS,
  packetNeedsAttention,
  type AnswerPacket,
} from "@/lib/family-answers/types";

/**
 * The review surface for a drafted answer.
 *
 * This lives in the RIGHT RAIL, beside the conversation, not above the reply
 * box. That placement is the whole design. The first version put a ~700px
 * document inside the conversation column, which evicted the thread: you were
 * asked to judge whether an answer fit a question you could no longer see.
 *
 * The other correction is about disclosure. "The reviewer must not skip the
 * flags" is a salience requirement; "everything is expanded at once" was a
 * density decision, and it defeated the first one. A four-hundred-word amber
 * wall gets skimmed. Three lines with counts get read, and the count tells you
 * the scale before you read a word.
 *
 * So: counts always visible, detail on demand, and the gate is OPENING the
 * flags rather than ticking a box that claims you read them. Opening is not
 * reading either, but it performs the action instead of asserting it, and it
 * costs one fewer click.
 *
 * Visual rules, deliberately narrow:
 *   - no nested filled boxes; hairline rules and whitespace separate groups
 *   - exactly one saturated element, the draft bubble
 *   - attention is a dot, never a filled region
 *   - the draft renders as the message it will become, because the question
 *     being asked is "does this read right as a text?"
 */

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

type SectionKey = "check" | "differ" | "sources";

function Count({
  label,
  n,
  tone,
  open,
  onClick,
}: {
  label: string;
  n: number;
  tone: "warn" | "quiet";
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      className={[
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
        open ? "bg-gray-50" : "hover:bg-gray-50",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "warn" ? "bg-amber-500" : "bg-gray-300",
        ].join(" ")}
        aria-hidden="true"
      />
      <span className="text-[13px] tabular-nums text-gray-900">{n}</span>
      <span className="text-[13px] text-gray-500">{label}</span>
      <svg
        viewBox="0 0 10 6"
        className={[
          "ml-auto h-1.5 w-2.5 text-gray-400 transition-transform duration-200",
          open ? "rotate-180" : "",
        ].join(" ")}
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

/** Detail body for an opened count. Indented under a hairline, never a filled card. */
function Detail({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-[0.85rem] border-l border-gray-200 pl-3 pt-0.5 pb-2 motion-safe:animate-[fadeIn_.18s_ease-out]">
      {children}
    </div>
  );
}

export default function AnswerPacketPanel({
  packet,
  onUseDraft,
  onAutoFill,
  disabled,
}: {
  packet: AnswerPacket;
  onUseDraft: (text: string) => void;
  /** Called once for a clean packet so the reply box starts pre-filled. */
  onAutoFill?: (text: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    check: false,
    differ: false,
    sources: false,
  });
  const [openedFlags, setOpenedFlags] = useState(false);
  const autoFilledFor = useRef<string | null>(null);

  const needsAttention = packetNeedsAttention(packet);
  const unsourced = packet.claims.filter((c) => c.confidence === "unsourced");
  const reliedUpon = packet.personFactRisks.filter((r) => r.handling === "relied_upon");
  const contested = packet.objections.filter((o) => o.verdict === "contested");
  const overLength = packet.draft.length > MAX_REPLY_CHARS;
  const checkCount =
    unsourced.length + reliedUpon.length + (overLength ? 1 : 0) + (packet.errors?.length ?? 0);

  // A clean packet hands you a loaded reply box: edit a word and send. A
  // flagged one does not, because pre-filling would put an unreviewed draft one
  // keystroke from a real person. The engine only fills the box when it has
  // nothing to declare.
  useEffect(() => {
    if (needsAttention || !packet.draft || !onAutoFill) return;
    if (autoFilledFor.current === packet.generatedAt) return;
    autoFilledFor.current = packet.generatedAt;
    onAutoFill(packet.draft);
  }, [needsAttention, packet.draft, packet.generatedAt, onAutoFill]);

  function toggle(key: SectionKey) {
    if (key === "check") setOpenedFlags(true);
    setOpen((o) => ({ ...o, [key]: !o[key] }));
  }

  const gated = needsAttention && !openedFlags;

  // A crisis packet carries no draft on purpose. There is no researched
  // benefits answer to "I want to die", and offering one would be worse than
  // offering nothing.
  if (packet.triage.isCrisis) {
    return (
      <div className="border-l-2 border-red-500 pl-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-red-600">
          Read as a crisis
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-900">
          No draft was written. Answer this one yourself.
        </p>
        {packet.triage.crisisReason && (
          <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
            {packet.triage.crisisReason}
          </p>
        )}
        {packet.triage.disagreedWithRegex && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-amber-700">
            The two crisis checks disagreed, so one of them has a gap worth a look afterwards.
          </p>
        )}
      </div>
    );
  }

  if (!packet.draft) {
    return (
      <div>
        <p className="text-[13px] text-gray-500">No draft was produced for this message.</p>
        {packet.errors?.length ? (
          <ul className="mt-2 space-y-1 text-[12px] text-gray-400">
            {packet.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}`}</style>

      {/* Counts. Scale is legible before any reading happens. */}
      <div className="-mx-2">
        <Count
          label={checkCount === 1 ? "thing to check" : "things to check"}
          n={checkCount}
          tone={checkCount > 0 ? "warn" : "quiet"}
          open={open.check}
          onClick={() => toggle("check")}
        />
        {open.check && (
          <Detail>
            <ul className="space-y-1.5">
              {reliedUpon.map((r) => (
                <li key={r.factKey} className="text-[12px] leading-relaxed text-gray-600">
                  <span className="text-gray-900">Leans on {r.factKey}.</span> {r.why}
                </li>
              ))}
              {unsourced.map((c, i) => (
                <li key={i} className="text-[12px] leading-relaxed text-gray-600">
                  <span className="text-gray-900">Unsourced.</span> {c.claim}
                </li>
              ))}
              {overLength && (
                <li className="text-[12px] leading-relaxed text-gray-600">
                  <span className="text-gray-900">Too long.</span> {packet.draft.length} of{" "}
                  {MAX_REPLY_CHARS}.
                </li>
              )}
              {packet.errors?.map((e, i) => (
                <li key={`e${i}`} className="text-[12px] leading-relaxed text-gray-600">
                  <span className="text-gray-900">Stage error.</span> {e}
                </li>
              ))}
              {checkCount === 0 && (
                <li className="text-[12px] text-gray-400">Nothing flagged on this one.</li>
              )}
            </ul>
          </Detail>
        )}

        <Count
          label={
            packet.objections.length === 1
              ? "disagreement"
              : contested.length
                ? `disagreements, ${contested.length} contested`
                : "disagreements"
          }
          n={packet.objections.length}
          tone="quiet"
          open={open.differ}
          onClick={() => toggle("differ")}
        />
        {open.differ && (
          <Detail>
            <ul className="space-y-2.5">
              {[...contested, ...packet.objections.filter((o) => o.verdict === "accepted")].map(
                (o, i) => (
                  <li key={i}>
                    <p className="text-[12px] leading-snug text-gray-900">
                      {o.verdict === "contested" && (
                        <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-amber-600">
                          held
                        </span>
                      )}
                      {o.target}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">
                      {o.objection}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">{o.response}</p>
                  </li>
                ),
              )}
            </ul>
          </Detail>
        )}

        <Count
          label={packet.claims.length === 1 ? "source" : "sources"}
          n={packet.claims.length}
          tone="quiet"
          open={open.sources}
          onClick={() => toggle("sources")}
        />
        {open.sources && (
          <Detail>
            <ul className="space-y-1.5">
              {packet.claims.map((c, i) => {
                const host = hostOf(c.sourceUrl);
                return (
                  <li key={i} className="text-[12px] leading-relaxed">
                    {/* Domain first: nine sources are judged at a glance by
                        where they come from, never by reading nine sentences. */}
                    {host ? (
                      <a
                        href={c.sourceUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-teal-700 underline decoration-teal-700/30 underline-offset-2 hover:decoration-teal-700"
                      >
                        {host}
                      </a>
                    ) : (
                      <span className="font-medium text-amber-600">no source</span>
                    )}
                    <span className="text-gray-500"> · {c.claim}</span>
                  </li>
                );
              })}
            </ul>
          </Detail>
        )}
      </div>

      {/* The draft, in the shape it will actually take. */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="rounded-2xl rounded-bl-md bg-teal-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
          {packet.draft}
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] tabular-nums text-gray-400">
            {packet.draft.length}/{MAX_REPLY_CHARS}
          </span>
          <button
            onClick={() => onUseDraft(packet.draft)}
            disabled={disabled || gated}
            title={gated ? "Open the flags first" : undefined}
            className="rounded-full bg-gray-900 px-3.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            Use this draft
          </button>
        </div>
        {gated && (
          <p className="mt-1.5 text-right text-[11px] text-gray-400">
            Open the flags to unlock
          </p>
        )}
        {!needsAttention && (
          <p className="mt-1.5 text-right text-[11px] text-gray-400">
            Nothing flagged, so it is already in the reply box
          </p>
        )}
      </div>

      {/* Quietest tier: what we know and what we are missing. */}
      {(packet.facts.length > 0 || packet.libraryGaps.length > 0) && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          {packet.facts.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                What we know
              </p>
              <ul className="mt-1.5 space-y-1">
                {packet.facts
                  .filter((f) => f.key !== "said")
                  .map((f, i) => (
                    <li key={i} className="text-[12px] leading-relaxed text-gray-600">
                      <span className="text-gray-900">{f.label}:</span> {f.value}
                      <span
                        className={
                          f.provenance === "stated_in_conversation"
                            ? "text-teal-600"
                            : "text-gray-400"
                        }
                      >
                        {" "}
                        · {f.provenance === "stated_in_conversation" ? "they told us" : "from a form"}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {packet.libraryGaps.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Missing from our library ({packet.libraryGaps.length})
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {packet.libraryGaps.map((g, i) => (
                  <li key={i} className="text-[12px] leading-relaxed text-gray-500">
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
