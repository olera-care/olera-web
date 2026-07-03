"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/**
 * Client half of the program brief. Fetches /api/family-brief (read-only),
 * renders the checklist; unknown requirements carry one-tap chips that POST
 * /api/family-quiz (the write path) and then re-fetch the brief so the
 * checkmark resolves in place — answering a question visibly moves a real
 * eligibility line on a real dollar amount.
 */

interface ChipOption {
  label: string;
  tok: string;
}

interface ChecklistItem {
  label: string;
  status: "met" | "unknown" | "notMet" | "info";
  chip?: { question: string; options: ChipOption[] };
}

interface BriefPayload {
  ok: boolean;
  program?: {
    name: string;
    savingsRange: string | null;
    description: string;
    isState: boolean;
    applyUrl: string | null;
  };
  checklist?: ChecklistItem[];
  firstStep?: { source: string; phone: string | null; script: string | null } | null;
  error?: string;
}

export default function ProgramBriefClient({ pid, tok }: { pid: string; tok: string }) {
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [data, setData] = useState<BriefPayload | null>(null);
  const [tapping, setTapping] = useState(false);
  const [tapError, setTapError] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/family-brief?pid=${encodeURIComponent(pid)}&tok=${encodeURIComponent(tok)}`);
      const json: BriefPayload = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !json.ok) {
        setState("error");
        return;
      }
      setData(json);
      setState("ready");
    } catch {
      setState("error");
    }
  }, [pid, tok]);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    if (!pid || !tok) {
      setState("error");
      return;
    }
    load();
  }, [pid, tok, load]);

  const answerChip = useCallback(
    async (chipTok: string) => {
      setTapping(true);
      setTapError(false);
      try {
        const res = await fetch("/api/family-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tok: chipTok }),
        });
        const json = await res.json().catch(() => ({ ok: false }));
        if (!res.ok || !json.ok) {
          setTapError(true);
          return;
        }
        await load(); // re-fetch: the checkmark resolves in place
      } catch {
        setTapError(true);
      } finally {
        setTapping(false);
      }
    },
    [load],
  );

  if (state === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">That link has expired</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            No problem. The benefits finder has every program you may qualify for, in a couple of minutes.
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

  if (state === "loading" || !data?.program) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="h-4 w-28 bg-gray-100 rounded animate-pulse mb-4" />
          <div className="h-7 w-3/4 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse mb-6" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-4 w-full bg-gray-50 rounded animate-pulse mb-3" />
          ))}
        </div>
      </div>
    );
  }

  const { program, checklist = [], firstStep } = data;

  const mark = (status: ChecklistItem["status"]) => {
    if (status === "met")
      return (
        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-green-50">
          <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      );
    if (status === "notMet")
      return (
        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gray-100">
          <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    if (status === "info")
      return (
        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-gray-50 text-[11px] font-semibold text-gray-400">
          i
        </span>
      );
    return <span className="mt-1 ml-1.5 mr-1.5 h-2 w-2 flex-none rounded-full bg-amber-400" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center px-4 py-10">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-3">
          {program.isState ? "State program" : "Federal program"}
        </p>
        <h1 className="font-serif text-[24px] leading-snug text-gray-900 mb-1">{program.name}</h1>
        {program.savingsRange ? (
          <p className="text-[15px] font-semibold text-primary-600 mb-4">{program.savingsRange}</p>
        ) : (
          <div className="mb-4" />
        )}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{program.description}</p>

        {checklist.length > 0 && (
          <div className="border-t border-gray-100 pt-5 mb-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-3">Could you qualify?</h2>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex gap-2.5">
                  {mark(item.status)}
                  <div className="min-w-0">
                    <p className={`text-sm leading-relaxed ${item.status === "notMet" ? "text-gray-400" : "text-gray-700"}`}>
                      {item.label}
                    </p>
                    {item.chip ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.chip.options.map((o) => (
                          <button
                            key={o.label}
                            type="button"
                            disabled={tapping}
                            onClick={() => answerChip(o.tok)}
                            className="inline-block px-3.5 py-1.5 rounded-full border border-primary-600 text-primary-600 text-[13px] font-medium hover:bg-primary-50 transition-colors disabled:opacity-50"
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {tapError ? <p className="text-sm text-red-600 mt-3">That didn't go through. Give it another tap.</p> : null}
          </div>
        )}

        {firstStep && (firstStep.phone || firstStep.script) ? (
          <div className="rounded-2xl border border-[#F1E5D6] bg-[#F9F6F2] p-6 mb-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Your first step</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Call {firstStep.source}
              {firstStep.phone ? (
                <>
                  {" at "}
                  <a href={`tel:${firstStep.phone.replace(/[^\d+]/g, "")}`} className="font-semibold text-primary-600 whitespace-nowrap">
                    {firstStep.phone}
                  </a>
                </>
              ) : null}
              . It usually takes about ten minutes.
            </p>
            {firstStep.script ? (
              <div className="rounded-lg bg-white border border-[#F1E5D6] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">What to say</p>
                <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{firstStep.script}&rdquo;</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <Link href="/benefits/finder" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            See all your programs →
          </Link>
          {program.applyUrl ? (
            <a
              href={program.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-gray-400 hover:text-gray-600"
            >
              Official program site ↗
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
