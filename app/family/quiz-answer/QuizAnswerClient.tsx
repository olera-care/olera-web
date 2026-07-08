"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Client half of /family/quiz-answer. POSTs the signed quiz token on mount
 * (recording the tapped answer), then renders the payoff sequentially on the
 * warm-vanilla field (the launcher/Wispr language, boutique pass 2026-07-03):
 * serif playbook hero → three step cards with progressive exposure (one
 * distilled line each; the full body opens on tap) → program cards → the next
 * question as full-width choice cards. Chip taps POST again and swap the
 * payload in place. Scanners fetching the page URL never write (no JS).
 */

interface ProgramItem {
  name: string;
  savingsRange: string | null;
  blurb: string;
  url: string | null;
  briefUrl?: string | null;
}

interface PathStepItem {
  title: string;
  body: string;
  linkLabel: string;
  linkHref: string;
}

interface ArchetypePayoffItem {
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
}

interface QuizPayload {
  ok: boolean;
  question?: string;
  answer?: string;
  pathNarrative?: { title: string; intro: string; steps: PathStepItem[] } | null;
  programs?: ProgramItem[];
  next?: { prompt: string; chips: { label: string; tok: string }[] } | null;
  /** Present only for the archetype question — its own urgency-tailored screen. */
  archetypePayoff?: ArchetypePayoffItem | null;
  error?: string;
}

function acknowledgment(question?: string, answer?: string): string {
  if (question === "path") {
    if (answer === "a") return "That changes what's useful to you";
    if (answer === "b") return "You're where most families are";
    return "The strongest programs exist for exactly your situation";
  }
  if (question === "medicaid") {
    if (answer === "alreadyHas") return "Medicaid opens the most doors. These are strong fits:";
    if (answer === "doesNotHave") return "Good to know. None of these require Medicaid:";
    return "Good to know. While you sort out Medicaid, these are worth a look:";
  }
  if (question === "veteran") {
    if (answer === "yes") return "VA benefits are some of the most under-used help out there. With that in mind:";
    return "Got it. Here's what fits without the VA programs:";
  }
  if (question === "age") return "That helps. Here's what fits:";
  return "Got it. Here's what fits:";
}

function firstLine(body: string): string {
  const idx = body.indexOf(". ");
  return idx > 20 ? body.slice(0, idx + 1) : body;
}

const fadeStyles = `
@keyframes qaFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.qa-fade { opacity: 0; animation: qaFadeUp 0.5s ease-out forwards; }
@media (prefers-reduced-motion: reduce) { .qa-fade { animation: none; opacity: 1; } }
`;

export default function QuizAnswerClient({
  tok,
  eid = "",
  previewPayoff = null,
}: {
  tok: string;
  eid?: string;
  /** QA preview: render this archetype payoff directly, skip the write POST. */
  previewPayoff?: ArchetypePayoffItem | null;
}) {
  const [state, setState] = useState<"loading" | "error" | "ready">(previewPayoff ? "ready" : "loading");
  const [data, setData] = useState<QuizPayload | null>(
    previewPayoff ? { ok: true, question: "archetype", archetypePayoff: previewPayoff } : null,
  );
  const [tapping, setTapping] = useState(false);
  const [chainError, setChainError] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(null);
  const submitted = useRef(false);

  const submit = useCallback(async (token: string, isChain: boolean) => {
    if (isChain) {
      setTapping(true);
      setChainError(false);
    }
    try {
      const res = await fetch("/api/family-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // eid rides every answer in the chain — the whole session originated
        // from the same email, so chained answers inherit its source.
        body: JSON.stringify({ tok: token, eid: eid || undefined }),
      });
      const json: QuizPayload = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) {
        if (isChain) setChainError(true);
        else setState("error");
        return;
      }
      setOpenStep(null);
      setData(json);
      setState("ready");
      if (isChain && typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      if (isChain) setChainError(true);
      else setState("error");
    } finally {
      if (isChain) setTapping(false);
    }
  }, [eid]);

  useEffect(() => {
    if (previewPayoff) return; // preview mode: render the payoff directly, no write
    if (submitted.current) return; // strict-mode double-mount guard (write is idempotent anyway)
    submitted.current = true;
    if (!tok) {
      setState("error");
      return;
    }
    submit(tok, false);
  }, [tok, submit, previewPayoff]);

  if (state === "error") {
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-md w-full text-center">
          <h1 className="font-serif text-3xl text-gray-900 mb-3">That link has expired</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            No problem. You can see every program you may qualify for in a couple of minutes with the benefits finder.
          </p>
          <Link
            href="/benefits/finder"
            className="inline-block px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-colors"
          >
            Check your benefits
          </Link>
        </div>
      </div>
    );
  }

  if (state === "loading" || !data) {
    return (
      <div className="min-h-screen bg-[#F9F6F2] flex items-center justify-center px-5 py-16">
        <div className="max-w-xl w-full">
          <div className="h-3 w-32 bg-[#F1E5D6] rounded-full animate-pulse mx-auto mb-6" />
          <div className="h-9 w-3/4 bg-[#F1E5D6]/70 rounded-xl animate-pulse mx-auto mb-10" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-white/70 border border-[#F1E5D6] rounded-2xl animate-pulse mb-3" />
          ))}
        </div>
      </div>
    );
  }

  // Archetype payoff: a single calm screen (tailored headline + one CTA), the
  // clean counterpart to the archetype email. No programs, no chained question —
  // the financial self-sort comes later, once they've engaged.
  if (data.archetypePayoff) {
    const p = data.archetypePayoff;
    return (
      <div className="min-h-screen bg-[#F9F6F2] px-5 py-16 flex items-center justify-center">
        {/* eslint-disable-next-line react/no-danger */}
        <style dangerouslySetInnerHTML={{ __html: fadeStyles }} />
        <div className="max-w-md w-full text-center">
          <p className="qa-fade flex items-center justify-center gap-2 text-[13px] text-gray-500 mb-5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <svg className="h-3 w-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            Got it
          </p>
          <h1 className="qa-fade font-serif text-[34px] leading-[1.15] text-gray-900 mb-4">{p.headline}</h1>
          <p className="qa-fade text-gray-600 leading-relaxed mb-9">{p.subline}</p>
          <Link
            href={p.ctaHref}
            className="qa-fade inline-block px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-colors"
          >
            {p.ctaLabel}
          </Link>
        </div>
      </div>
    );
  }

  const programs = data.programs || [];
  const n = data.pathNarrative;
  let seq = 0;
  const fade = (extra = "") => ({
    className: `qa-fade${extra ? ` ${extra}` : ""}`,
    style: { animationDelay: `${Math.min(seq++ * 0.09, 0.9)}s` },
  });

  return (
    <div className="min-h-screen bg-[#F9F6F2] px-5 py-14">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: fadeStyles }} />
      <div className="max-w-xl mx-auto">
        {/* Acknowledgment eyebrow */}
        <div {...fade()}>
          <p className="flex items-center justify-center gap-2 text-[13px] text-gray-500 mb-4 text-center">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
              <svg className="h-3 w-3 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            {acknowledgment(data.question, data.answer)}
          </p>
        </div>

        {n ? (
          <>
            <h1 {...fade("font-serif text-[34px] sm:text-[40px] leading-[1.15] text-gray-900 text-center mb-10")}>
              {n.title}
            </h1>

            {/* Steps: one distilled line each; the rest opens on tap */}
            <div className="space-y-3 mb-14">
              {n.steps.map((step, i) => {
                const open = openStep === i;
                return (
                  <div
                    key={step.title}
                    {...fade(
                      "bg-white border border-[#F1E5D6] rounded-2xl px-6 py-5 shadow-[0_1px_3px_rgba(42,24,16,0.05)] transition-shadow hover:shadow-[0_3px_10px_rgba(42,24,16,0.08)]",
                    )}
                  >
                    {/* The toggle is the header row only — the expanded link must NOT
                        live inside a button (invalid nesting, flaky clicks). */}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStep(open ? null : i);
                        if (!open) {
                          // Engagement beacon — fire-and-forget; the page never waits on it.
                          fetch("/api/guidance-event", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ tok, type: "step_expanded", ref: step.title }),
                          }).catch(() => {});
                        }
                      }}
                      aria-expanded={open}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-4">
                        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#F9F6F2] font-serif text-[14px] text-gray-700">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-[18px] text-gray-900 leading-snug">{step.title}</p>
                          {!open ? (
                            <p className="text-sm text-gray-500 leading-relaxed mt-1">{firstLine(step.body)}</p>
                          ) : (
                            <p className="text-sm text-gray-600 leading-relaxed mt-1.5">{step.body}</p>
                          )}
                        </div>
                        <svg
                          className={`mt-1.5 h-4 w-4 flex-none text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {open ? (
                      <a
                        href={step.linkHref}
                        className="inline-block mt-2 ml-11 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        {step.linkLabel} →
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {programs.length > 0 ? (
          <>
            <p {...fade("text-[12px] font-semibold uppercase tracking-[0.12em] text-[#a89a88] text-center mb-4")}>
              {n ? "Programs on this path" : "Worth a look"}
            </p>
            <div className="space-y-3 mb-14">
              {programs.map((p) => (
                <div key={p.name} {...fade()}>
                  <div className="bg-white border border-[#F1E5D6] rounded-2xl px-6 py-5 shadow-[0_1px_3px_rgba(42,24,16,0.05)]">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[15px] font-semibold text-gray-900 leading-snug">{p.name}</p>
                      {p.savingsRange ? (
                        <p className="text-[13px] font-semibold text-primary-600 whitespace-nowrap">{p.savingsRange}</p>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mt-1">
                      {p.blurb}{" "}
                      {p.briefUrl ? (
                        <a href={p.briefUrl} className="text-primary-600 hover:text-primary-700 whitespace-nowrap font-medium">
                          Could we qualify? →
                        </a>
                      ) : p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 whitespace-nowrap font-medium">
                          Learn more →
                        </a>
                      ) : null}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p {...fade("text-gray-500 text-center mb-14 leading-relaxed")}>
            We're still gathering programs for your area. The benefits finder has the full national picture in the meantime.
          </p>
        )}

        {data.next ? (
          <div {...fade()}>
            <h2 className="font-serif text-[24px] leading-snug text-gray-900 text-center mb-2">{data.next.prompt}</h2>
            <p className="text-[13px] text-gray-400 text-center mb-6">One tap. It sharpens everything above.</p>
            <div className="space-y-3">
              {data.next.chips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={tapping}
                  onClick={() => submit(chip.tok, true)}
                  className="w-full text-left bg-white border border-[#F1E5D6] rounded-2xl px-6 py-5 shadow-[0_1px_3px_rgba(42,24,16,0.05)] transition-shadow hover:shadow-[0_3px_10px_rgba(42,24,16,0.08)] disabled:opacity-50"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-serif text-[18px] text-gray-900">{chip.label}</span>
                    <span className="text-gray-300">→</span>
                  </span>
                </button>
              ))}
            </div>
            {chainError ? (
              <p className="text-sm text-red-600 mt-3 text-center">That didn't go through. Give it another tap.</p>
            ) : null}
          </div>
        ) : (
          <div {...fade("text-center")}>
            <p className="text-gray-500 mb-6 leading-relaxed">
              That's everything we needed. Your full report includes what each program covers and the exact first step to take.
            </p>
            <Link
              href="/benefits/finder"
              className="inline-block px-8 py-4 bg-primary-600 text-white font-medium rounded-2xl hover:bg-primary-700 transition-colors"
            >
              See your full benefits report
            </Link>
          </div>
        )}

        <p className="text-[12px] text-[#c4b8a8] text-center mt-14">
          Program details change; always confirm with the program directly.{" "}
          <Link href="/benefits/finder" className="text-primary-600/70 hover:text-primary-700">
            Full benefits finder
          </Link>
        </p>
      </div>
    </div>
  );
}
