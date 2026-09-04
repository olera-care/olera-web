"use client";

import { MAX_REPLY_CHARS, type RecheckRecord } from "@/lib/family-answers/types";

/**
 * The result of attacking a draft a human wrote.
 *
 * Sits directly under the reply box, not in the rail with the packet, and the
 * placement is the argument. The packet describes what the ENGINE proposed; this
 * describes the text in the box right now. Putting them side by side would
 * invite reading one as an update of the other, when they are checks of two
 * different messages that happen to answer the same question.
 *
 * Everything here is a claim about a specific string. The moment that string
 * changes the panel says so and stops asserting, because a check that keeps
 * looking authoritative after the text moved underneath it is the exact failure
 * this feature was built to remove.
 */
export default function RecheckPanel({
  result,
  currentDraft,
  onUseSuggestion,
  onDismiss,
  disabled,
}: {
  result: RecheckRecord;
  currentDraft: string;
  onUseSuggestion: (text: string) => void;
  onDismiss: () => void;
  disabled?: boolean;
}) {
  const stale = result.draft !== currentDraft.trim();
  /**
   * A stage that failed did not "find nothing" — it did not look. Without this
   * an outage in the claims or adversarial stage renders as a teal "checked,
   * nothing found" over a message nobody actually verified, which is a worse
   * lie than showing no check at all.
   */
  const incomplete = Boolean(result.errors?.length);
  const accepted = result.objections.filter((o) => o.verdict === "accepted");
  const contested = result.objections.filter((o) => o.verdict === "contested");
  const unsourced = result.claims.filter((c) => c.confidence === "unsourced");
  const suggestionDiffers = result.suggestedDraft.trim() !== result.draft.trim();
  const suggestionTooLong = result.suggestedDraft.length > MAX_REPLY_CHARS;

  if (stale) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden="true" />
        <span className="text-[12px] text-gray-500">
          You edited the draft since this check. Re-check to cover the new text.
        </span>
        <button
          onClick={onDismiss}
          className="ml-auto text-[11px] text-gray-400 transition-colors hover:text-gray-600"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-200 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={[
            "h-1.5 w-1.5 shrink-0 rounded-full",
            incomplete || accepted.length || unsourced.length ? "bg-amber-500" : "bg-teal-500",
          ].join(" ")}
          aria-hidden="true"
        />
        <span className="text-[13px] font-medium text-gray-900">
          {incomplete
            ? "Check did not finish"
            : result.objections.length === 0
              ? "Checked, nothing found"
              : `${accepted.length} to fix, ${contested.length} pushed back`}
        </span>
        <button
          onClick={onDismiss}
          className="ml-auto text-[11px] text-gray-400 transition-colors hover:text-gray-600"
        >
          Dismiss
        </button>
      </div>

      {/* An empty result is a finding, not a blank. Say it was looked for. */}
      {!incomplete && result.objections.length === 0 && !unsourced.length && (
        <p className="mt-1.5 text-[11px] text-gray-400">
          {result.claims.length} claim{result.claims.length === 1 ? "" : "s"} checked against source.
        </p>
      )}

      {unsourced.length > 0 && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          <p className="text-[11px] font-medium text-amber-700">
            Could not source {unsourced.length === 1 ? "this claim" : `these ${unsourced.length} claims`}
          </p>
          <ul className="mt-1 space-y-0.5">
            {unsourced.map((c, i) => (
              <li key={i} className="text-[12px] leading-relaxed text-gray-600">
                {c.claim}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What the verifier could not source at all. Distinct from an unsourced
          claim: that is an assertion it isolated and failed to stand up, this
          is ground it could not get to. Both belong in front of the reviewer. */}
      {result.notes.trim() && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          <p className="text-[11px] font-medium text-gray-500">Could not verify</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-gray-600">{result.notes}</p>
        </div>
      )}

      {result.objections.length > 0 && (
        <ul className="mt-2 space-y-2 border-t border-gray-100 pt-2">
          {result.objections.map((o, i) => (
            <li key={i} className="text-[12px] leading-relaxed">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={[
                    "shrink-0 text-[10px] font-medium uppercase tracking-wide",
                    o.verdict === "accepted" ? "text-amber-700" : "text-gray-400",
                  ].join(" ")}
                >
                  {o.verdict === "accepted" ? "fix" : "held"}
                </span>
                <span className="text-gray-900">{o.target}</span>
              </div>
              <p className="mt-0.5 text-gray-600">{o.objection}</p>
              {/* The rebuttal matters most when it DISAGREED — that is the half
                  a fact-checker alone never produces, and the half a reviewer
                  needs in order to not simply defer to the objection. */}
              {o.response && (
                <p className="mt-0.5 text-gray-500">
                  {o.verdict === "accepted" ? "Conceded: " : "Pushed back: "}
                  {o.response}
                  {o.sourceUrl && (
                    <>
                      {" "}
                      <a
                        href={o.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 underline decoration-gray-300 underline-offset-2 hover:text-gray-600"
                      >
                        source
                      </a>
                    </>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {suggestionDiffers && (
        <div className="mt-2.5 border-t border-gray-100 pt-2.5">
          <p className="text-[11px] text-gray-400">Suggested rewrite</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
            {result.suggestedDraft}
          </p>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={() => onUseSuggestion(result.suggestedDraft)}
              disabled={disabled || suggestionTooLong}
              className="text-[12px] font-medium text-primary-700 transition-colors hover:text-primary-800 disabled:opacity-40"
            >
              Use this
            </button>
            <span className="text-[11px] tabular-nums text-gray-400">
              {result.suggestedDraft.length}/{MAX_REPLY_CHARS}
              {suggestionTooLong ? " · too long to send" : ""}
            </span>
          </div>
        </div>
      )}

      {result.errors?.length ? (
        <p className="mt-2 border-t border-gray-100 pt-2 text-[11px] text-amber-700">
          {result.errors.length === 3 ? "Nothing was checked" : "Partial check"}:{" "}
          {result.errors.join("; ")}
        </p>
      ) : null}
    </div>
  );
}
