"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Client half of /family/quiz-answer. POSTs the signed quiz token on mount
 * (recording the tapped answer), then renders the payoff: the program list
 * sharpened by that answer and the next question as chips. Chip taps POST
 * again and swap the payload in place — the whole intake chains without
 * navigation. Scanners fetching the page URL never write (no JS execution).
 */

interface ProgramItem {
  name: string;
  savingsRange: string | null;
  blurb: string;
  url: string | null;
}

interface QuizPayload {
  ok: boolean;
  question?: string;
  answer?: string;
  programs?: ProgramItem[];
  next?: { prompt: string; chips: { label: string; tok: string }[] } | null;
  error?: string;
}

function acknowledgment(question?: string, answer?: string): string {
  if (question === "medicaid") {
    if (answer === "alreadyHas") return "Medicaid opens the most doors. These are strong fits for your situation:";
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

export default function QuizAnswerClient({ tok }: { tok: string }) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [data, setData] = useState<QuizPayload | null>(null);
  const [tapping, setTapping] = useState(false);
  const [chainError, setChainError] = useState(false);
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
        body: JSON.stringify({ tok: token }),
      });
      const json: QuizPayload = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) {
        if (isChain) setChainError(true);
        else setState("error");
        return;
      }
      setData(json);
      setState("ready");
    } catch {
      if (isChain) setChainError(true);
      else setState("error");
    } finally {
      if (isChain) setTapping(false);
    }
  }, []);

  useEffect(() => {
    if (submitted.current) return; // strict-mode double-mount guard (write is idempotent anyway)
    submitted.current = true;
    if (!tok) {
      setState("error");
      return;
    }
    submit(tok, false);
  }, [tok, submit]);

  if (state === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">That link has expired</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            No problem. You can see every program you may qualify for in a couple of minutes with the benefits finder.
          </p>
          <Link
            href="/benefits/finder"
            className="block w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Check your benefits
          </Link>
        </div>
      </div>
    );
  }

  if (state === "loading" || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse mb-5" />
          <div className="h-5 w-24 bg-gray-100 rounded animate-pulse mb-3" />
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse mb-6" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="py-4 border-b border-gray-100 last:border-0">
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const programs = data.programs || [];
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-1">Got it</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">{acknowledgment(data.question, data.answer)}</p>

        {programs.length > 0 ? (
          <div className="mb-6">
            {programs.map((p, i) => (
              <div key={p.name} className={`py-4 ${i < programs.length - 1 ? "border-b border-gray-100" : ""}`}>
                <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                  {p.name}
                  {p.savingsRange ? (
                    <span className="ml-2 text-[13px] font-medium text-primary-600">{p.savingsRange}</span>
                  ) : null}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed mt-0.5">
                  {p.blurb}{" "}
                  {p.url ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 whitespace-nowrap"
                    >
                      Learn more →
                    </a>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-6 leading-relaxed">
            We're still gathering programs for your area. The benefits finder has the full national picture in the
            meantime.
          </p>
        )}

        {data.next ? (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 mb-1">One more and we can narrow this further.</p>
            <p className="text-[15px] font-semibold text-gray-900 mb-3">{data.next.prompt}</p>
            <div className="flex flex-wrap gap-2">
              {data.next.chips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={tapping}
                  onClick={() => submit(chip.tok, true)}
                  className="inline-block px-4 py-2 rounded-full border border-primary-600 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {chainError ? (
              <p className="text-sm text-red-600 mt-3">That didn't go through. Give it another tap.</p>
            ) : null}
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm text-gray-500 mb-4">
              That's everything we needed. Your full report includes what each program covers and the exact first step
              to take.
            </p>
            <Link
              href="/benefits/finder"
              className="block w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors text-center"
            >
              See your full benefits report
            </Link>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Program details change; always confirm with the program directly.{" "}
          <Link href="/benefits/finder" className="text-primary-600 hover:text-primary-700">
            Full benefits finder
          </Link>
        </p>
      </div>
    </div>
  );
}
