"use client";

import { useState } from "react";
import {
  MAX_REPLY_CHARS,
  packetNeedsAttention,
  type AnswerPacket,
} from "@/lib/family-answers/types";

/**
 * The review surface for a drafted answer.
 *
 * This component is the whole point of the Family Answers Engine. The engine's
 * job is not to write a good draft — it is to make the person approving that
 * draft able to catch an error he does not have the expertise to catch. So the
 * layout deliberately leads with what is WRONG or UNCERTAIN and puts the
 * polished sentence underneath it.
 *
 * Two rules this component exists to enforce:
 *
 *   1. Flagged items are not collapsible, and when anything is flagged the
 *      "Use this draft" button is disabled until the reviewer ticks the
 *      acknowledgement. At roughly one message a day, with a fluent draft and a
 *      non-specialist reviewer, the realistic failure mode is not a bad
 *      generation — it is a clean Send button under a confident paragraph.
 *
 *   2. Disagreements between the drafter and the adversarial checker are shown
 *      in full, including the ones the drafter WON. Where they agree, skim;
 *      where they disagree, look. That converts the review task from "is this
 *      claim about Florida benefits law correct?", which the reviewer cannot
 *      reliably judge, into "here are two positions and the source", which he
 *      can.
 */

function Pill({
  tone,
  children,
}: {
  tone: "danger" | "warn" | "ok" | "muted";
  children: React.ReactNode;
}) {
  const tones = {
    danger: "bg-red-50 text-red-700 border-red-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    muted: "bg-gray-50 text-gray-500 border-gray-200",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-3">
      <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {title}
        {typeof count === "number" && count > 0 ? ` (${count})` : ""}
      </h4>
      {children}
    </div>
  );
}

export default function AnswerPacketPanel({
  packet,
  onUseDraft,
  disabled,
}: {
  packet: AnswerPacket;
  onUseDraft: (text: string) => void;
  disabled?: boolean;
}) {
  const [acknowledged, setAcknowledged] = useState(false);

  const needsAttention = packetNeedsAttention(packet);
  const unsourced = packet.claims.filter((c) => c.confidence === "unsourced");
  const reliedUpon = packet.personFactRisks.filter((r) => r.handling === "relied_upon");
  const contested = packet.objections.filter((o) => o.verdict === "contested");
  const overLength = packet.draft.length > MAX_REPLY_CHARS;

  // A crisis packet carries no draft on purpose. There is no researched
  // benefits answer to "I want to die", and offering one would be worse than
  // offering nothing.
  if (packet.triage.isCrisis) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Pill tone="danger">Crisis</Pill>
          {packet.triage.disagreedWithRegex && <Pill tone="warn">Layers disagreed</Pill>}
        </div>
        <p className="text-[13px] font-medium text-red-900">
          This message was read as a possible crisis. No draft was written.
        </p>
        {packet.triage.crisisReason && (
          <p className="mt-1 text-[12px] text-red-800">{packet.triage.crisisReason}</p>
        )}
        <p className="mt-2 text-[12px] text-red-800">
          Answer this one yourself. If the two crisis checks disagreed, one of them has a gap worth
          looking at afterwards.
        </p>
      </div>
    );
  }

  if (!packet.draft) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-[13px] text-gray-600">
          The engine produced no draft for this message.
        </p>
        {packet.errors?.length ? (
          <ul className="mt-2 list-disc pl-4 text-[12px] text-gray-500">
            {packet.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-gray-900">Drafted answer</h3>
          {needsAttention ? <Pill tone="warn">Check before sending</Pill> : <Pill tone="ok">Clean</Pill>}
        </div>
        <span className="text-[11px] tabular-nums text-gray-400">
          {new Date(packet.generatedAt).toLocaleString("en-US", { timeZone: "America/New_York" })} ET
        </span>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* What is wrong or uncertain comes FIRST and cannot be collapsed. */}
        {needsAttention && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
              Check these before sending
            </h4>
            <ul className="space-y-1.5 text-[12px] text-amber-900">
              {reliedUpon.map((r) => (
                <li key={r.factKey}>
                  <b>Leans on an unverified fact ({r.factKey}).</b> {r.why}
                </li>
              ))}
              {unsourced.map((c, i) => (
                <li key={i}>
                  <b>Unsourced claim.</b> {c.claim}
                </li>
              ))}
              {overLength && (
                <li>
                  <b>Too long.</b> {packet.draft.length} characters, limit {MAX_REPLY_CHARS}.
                </li>
              )}
              {packet.errors?.map((e, i) => (
                <li key={`e${i}`}>
                  <b>Stage error.</b> {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* The draft itself. */}
        <div>
          <p className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] leading-relaxed text-gray-900">
            {packet.draft}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] tabular-nums text-gray-400">
              {packet.draft.length}/{MAX_REPLY_CHARS}
            </span>
            <div className="flex items-center gap-3">
              {needsAttention && (
                <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-gray-600">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  I read the flags
                </label>
              )}
              <button
                onClick={() => onUseDraft(packet.draft)}
                disabled={disabled || (needsAttention && !acknowledged)}
                className="rounded-md bg-primary-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Use this draft
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Edits you make before sending are recorded. How much you change is the cheapest signal of
            whether the engine is any good.
          </p>
        </div>

        {/* Disagreements. Contested ones first — those are the judgement calls. */}
        {packet.objections.length > 0 && (
          <Section title="Drafter vs. checker" count={packet.objections.length}>
            <ul className="space-y-2">
              {[...contested, ...packet.objections.filter((o) => o.verdict === "accepted")].map(
                (o, i) => (
                  <li key={i} className="rounded border border-gray-100 bg-gray-50 p-2">
                    <div className="mb-1 flex items-start gap-2">
                      <Pill tone={o.verdict === "contested" ? "warn" : "muted"}>{o.verdict}</Pill>
                      <span className="text-[12px] font-medium text-gray-800">{o.target}</span>
                    </div>
                    <p className="text-[12px] text-gray-600">
                      <b>Checker:</b> {o.objection}
                    </p>
                    <p className="mt-0.5 text-[12px] text-gray-700">
                      <b>Drafter:</b> {o.response}
                    </p>
                    {o.sourceUrl && (
                      <a
                        href={o.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 inline-block text-[11px] text-primary-700 underline"
                      >
                        source
                      </a>
                    )}
                  </li>
                ),
              )}
            </ul>
          </Section>
        )}

        {/* Sources. */}
        {packet.claims.length > 0 && (
          <Section title="Claims and sources" count={packet.claims.length}>
            <ul className="space-y-1.5">
              {packet.claims.map((c, i) => (
                <li key={i} className="text-[12px] text-gray-700">
                  <Pill
                    tone={
                      c.confidence === "primary" ? "ok" : c.confidence === "secondary" ? "muted" : "danger"
                    }
                  >
                    {c.confidence}
                  </Pill>{" "}
                  {c.claim}{" "}
                  {c.sourceUrl ? (
                    <a
                      href={c.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-700 underline"
                    >
                      {c.sourceLabel || "source"}
                    </a>
                  ) : (
                    <span className="text-gray-400">({c.sourceLabel || "no source"})</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* What we know about them, and how. */}
        {packet.facts.length > 0 && (
          <Section title="What we know, and how">
            <ul className="space-y-1">
              {packet.facts.map((f, i) => (
                <li key={i} className="text-[12px] text-gray-700">
                  <Pill tone={f.provenance === "stated_in_conversation" ? "ok" : "warn"}>
                    {f.provenance === "stated_in_conversation" ? "they told us" : "from a form"}
                  </Pill>{" "}
                  <b>{f.label}:</b> {f.value}
                  {f.correctedByFamily && <span className="text-red-600"> (they corrected us)</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {packet.libraryGaps.length > 0 && (
          <Section title="Missing from our benefits library" count={packet.libraryGaps.length}>
            <ul className="list-disc space-y-0.5 pl-4 text-[12px] text-gray-500">
              {packet.libraryGaps.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
            <p className="mt-1 text-[11px] text-gray-400">
              Worth writing up. Closing a gap makes the next answer better, and this draft routed
              around whatever is listed here.
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
