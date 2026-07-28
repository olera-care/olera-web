"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

/**
 * JourneyActions — the living half of /m/{token} (plans/benefits-living-journey.md).
 *
 * Client island inside the server-rendered BenefitsHome. Owns the state that
 * makes the page a record instead of a pamphlet:
 *  - "I made the call" → optimistic done state + POST; the hero flips to a
 *    compact done card and the "Up next" program appears.
 *  - Document checkboxes persist (initial state from benefits_cascade,
 *    optimistic toggle, revert + message on failure).
 *
 * All writes go to /api/families/benefits-journey with the results token as
 * the grant. Failures never trap the family: the reassurance stays visible
 * and the call button never disables.
 */

export interface NextStepInfo {
  name: string;
  shortName: string;
  phone: string;
  programPath: string;
  savings: string | null;
}

export interface JourneyActionsProps {
  token: string;
  /** Hero card contents, re-rendered here so done-state can replace them. */
  hero: {
    programId: string;
    name: string;
    shortName: string;
    savings: string | null;
    agencyLabel: string;
    phone: string;
    hours: string | null;
    programPath: string;
  };
  callScript: string | null;
  documents: string[];
  initialDone: boolean;
  initialChecked: string[];
  nextStep: NextStepInfo | null;
}

export default function JourneyActions(props: JourneyActionsProps) {
  const { token, hero, callScript, documents, nextStep } = props;
  const [done, setDone] = useState(props.initialDone);
  const [checked, setChecked] = useState<Set<string>>(new Set(props.initialChecked));
  const [saveError, setSaveError] = useState(false);

  const phoneHref = `tel:${hero.phone.replace(/[^\d+]/g, "")}`;

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const res = await fetch("/api/families/benefits-journey", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...body }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    [token],
  );

  const markCalled = useCallback(async () => {
    setDone(true);
    setSaveError(false);
    const ok = await post({ action: "call_made", programId: hero.programId });
    if (!ok) setSaveError(true); // Keep the done state — their act happened; retry is silent next visit.
  }, [post, hero.programId]);

  const toggleDoc = useCallback(
    async (doc: string) => {
      const isChecked = checked.has(doc);
      const nextSet = new Set(checked);
      if (isChecked) nextSet.delete(doc);
      else nextSet.add(doc);
      setChecked(nextSet);
      setSaveError(false);
      const ok = await post({ action: "doc_toggle", doc, checked: !isChecked });
      if (!ok) {
        setChecked(checked); // revert
        setSaveError(true);
      }
    },
    [checked, post],
  );

  return (
    <>
      {/* ── Hero: active or done ─────────────────────────────────────── */}
      {!done ? (
        <section className="mt-5 rounded-2xl bg-[#33261e] p-6 text-[#f7f3ee] shadow-sm">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#c9b8a8]">
            Start here
          </p>
          <h2 className="mt-1.5 font-serif text-[22px] font-bold leading-snug">{hero.name}</h2>
          {hero.savings && (
            <p className="mt-1 text-[14px] font-semibold text-emerald-300">{hero.savings}</p>
          )}
          <p className="mt-3 text-[15px] leading-relaxed text-[#e8e0d6]">
            Apply by phone in about ten minutes.
          </p>
          <p className="mt-3 text-[13px] text-[#c9b8a8]">{hero.agencyLabel}</p>
          <a
            href={phoneHref}
            className="mt-2 block rounded-xl bg-[#f7f3ee] px-5 py-3.5 text-center text-[16px] font-bold text-[#33261e] transition-opacity hover:opacity-90"
          >
            Call {hero.phone}
          </a>
          {hero.hours && <p className="mt-2 text-center text-[13px] text-[#c9b8a8]">{hero.hours}</p>}
          <button
            onClick={markCalled}
            className="mt-3 w-full rounded-xl border border-[#5d4a3c] px-5 py-2.5 text-center text-[14px] font-semibold text-[#e8e0d6] transition-colors hover:bg-[#3f2f25]"
          >
            I made the call
          </button>
        </section>
      ) : (
        <>
          <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-[15px] font-semibold text-emerald-900">
              &#10003; You started {hero.shortName}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-emerald-800">
              That was the hard part. Agencies usually follow up by mail or phone; keep an eye
              out, and your{" "}
              <Link href={hero.programPath} className="underline underline-offset-2">
                program guide
              </Link>{" "}
              covers what happens next.
            </p>
          </section>

          {nextStep && (
            <section className="mt-4 rounded-2xl bg-[#33261e] p-6 text-[#f7f3ee] shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#c9b8a8]">
                Up next
              </p>
              <h2 className="mt-1.5 font-serif text-[22px] font-bold leading-snug">
                {nextStep.name}
              </h2>
              {nextStep.savings && (
                <p className="mt-1 text-[14px] font-semibold text-emerald-300">{nextStep.savings}</p>
              )}
              <a
                href={`tel:${nextStep.phone.replace(/[^\d+]/g, "")}`}
                className="mt-4 block rounded-xl bg-[#f7f3ee] px-5 py-3.5 text-center text-[16px] font-bold text-[#33261e] transition-opacity hover:opacity-90"
              >
                Call {nextStep.phone}
              </a>
              <Link
                href={nextStep.programPath}
                className="mt-3 inline-block text-[13px] font-semibold text-[#c9b8a8] underline underline-offset-2"
              >
                See the guide for {nextStep.shortName}
              </Link>
            </section>
          )}
        </>
      )}

      {/* ── What to say (hidden once done) ───────────────────────────── */}
      {!done && callScript && (
        <details className="mt-5 border-b border-gray-200 pb-4">
          <summary className="cursor-pointer list-none text-[15px] font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
            What to say when they answer <span className="text-gray-400">›</span>
          </summary>
          <p className="mt-2 border-l-2 border-gray-300 pl-3 text-[14px] leading-relaxed text-gray-600">
            &ldquo;{callScript}&rdquo;
          </p>
        </details>
      )}

      {/* ── Documents: persisted checklist ───────────────────────────── */}
      {documents.length > 0 && (
        <div className="mt-5">
          <p className="text-[15px] font-semibold text-gray-900">
            Have these nearby, if you can
            {checked.size > 0 && (
              <span className="ml-2 text-[13px] font-medium text-emerald-700">
                {checked.size} of {documents.length} ready
              </span>
            )}
          </p>
          <ul className="mt-2 space-y-1">
            {documents.map((d) => {
              const isChecked = checked.has(d);
              return (
                <li key={d}>
                  <button
                    onClick={() => toggleDoc(d)}
                    className="flex w-full items-start gap-2.5 rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-gray-100"
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[12px] ${
                        isChecked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      &#10003;
                    </span>
                    <span
                      className={`text-[14px] leading-relaxed ${
                        isChecked ? "text-gray-400 line-through" : "text-gray-700"
                      }`}
                    >
                      {d}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[13px] text-gray-400">
            You can still call if you don&apos;t have everything. We&apos;ll remember your
            checklist for next time.
          </p>
          {saveError && (
            <p className="mt-1 text-[13px] text-amber-700">
              Couldn&apos;t save just now. Your progress here still counts; we&apos;ll retry on
              your next visit.
            </p>
          )}
        </div>
      )}

      {!done && (
        <Link
          href={hero.programPath}
          className="mt-4 inline-block text-[14px] font-semibold text-primary-700 underline underline-offset-2"
        >
          See the full guide for {hero.shortName}
        </Link>
      )}
    </>
  );
}
