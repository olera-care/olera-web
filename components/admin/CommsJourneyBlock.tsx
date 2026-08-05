"use client";

import Link from "next/link";
import { useState } from "react";
import { getCronJob } from "@/lib/crons/registry";
import type { CommsJourney, JourneyStep } from "@/lib/family-comms/journey";

/**
 * Sequence timeline for /admin/automations/[id]. The journey is the primary
 * overview; operational notes, gates, and event names stay one click away.
 */
export default function CommsJourneyBlock({
  journey,
  currentCronId,
}: {
  journey: CommsJourney;
  currentCronId: string;
}) {
  const initiallyExpanded = journey.ordering === "time"
    ? journey.steps.find((step) => step.ownedBy === currentCronId)?.key
    : null;
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    () => new Set(initiallyExpanded ? [initiallyExpanded] : []),
  );
  const allExpanded = expandedSteps.size === journey.steps.length;

  function toggleStep(key: string) {
    setExpandedSteps((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setExpandedSteps(
      allExpanded ? new Set() : new Set(journey.steps.map((step) => step.key)),
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-teal-200/70 bg-white shadow-sm shadow-teal-950/5">
      <div className="bg-gradient-to-br from-teal-50/80 via-white to-white px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              {journey.ordering === "time" ? "Family journey" : "Decision ladder"}
            </p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
              {journey.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{journey.description}</p>
          </div>
          <button
            type="button"
            onClick={toggleAll}
            className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-white px-3.5 text-xs font-semibold text-teal-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </div>

      <ol className="px-3 py-2 sm:px-5 sm:py-3">
        {journey.steps.map((step, index) => (
          <StepRow
            key={step.key}
            step={step}
            journeyKey={journey.key}
            index={index}
            isLast={index === journey.steps.length - 1}
            numbered={journey.ordering === "priority"}
            currentCronId={currentCronId}
            expanded={expandedSteps.has(step.key)}
            onToggle={() => toggleStep(step.key)}
          />
        ))}
      </ol>
    </section>
  );
}

function StepRow({
  step,
  journeyKey,
  index,
  isLast,
  numbered,
  currentCronId,
  expanded,
  onToggle,
}: {
  step: JourneyStep;
  journeyKey: string;
  index: number;
  isLast: boolean;
  numbered: boolean;
  currentCronId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const mine = step.ownedBy === currentCronId;
  const other = step.ownedBy && !mine ? getCronJob(step.ownedBy) : null;
  const detailsId = `journey-${journeyKey}-${step.key}-details`;

  return (
    <li className="relative flex gap-2.5 sm:gap-4">
      <div className="flex w-7 shrink-0 flex-col items-center" aria-hidden="true">
        <span
          className={`mt-4 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ring-4 ring-white transition-colors ${
            mine
              ? "bg-teal-600 text-white shadow-sm shadow-teal-900/20"
              : expanded
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-400"
          }`}
        >
          {numbered ? index + 1 : mine ? "•" : ""}
        </span>
        {!isLast && <span className={`w-px flex-1 ${mine ? "bg-teal-200" : "bg-gray-200"}`} />}
      </div>

      <div className={`min-w-0 flex-1 ${isLast ? "pb-2" : "pb-1"}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          className={`group my-1.5 flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:px-4 ${
            mine
              ? "bg-teal-50/80 ring-1 ring-inset ring-teal-100 hover:bg-teal-50"
              : "hover:bg-gray-50"
          }`}
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${mine ? "text-teal-700" : "text-gray-400"}`}>
                {step.timing}
              </span>
              {mine && (
                <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  This automation
                </span>
              )}
            </span>
            <span className={`mt-0.5 block text-sm font-semibold sm:text-[15px] ${mine ? "text-gray-950" : "text-gray-700"}`}>
              {step.title}
            </span>
          </span>
          <svg
            viewBox="0 0 20 20"
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>

        {expanded && (
          <div id={detailsId} className="px-3 pb-5 pt-1 sm:px-4">
            <p className="max-w-3xl text-[13px] leading-relaxed text-gray-600">{step.description}</p>
            {step.gate && (
              <p className="mt-2 max-w-3xl rounded-lg bg-amber-50/70 px-3 py-2 text-xs leading-relaxed text-amber-800 ring-1 ring-inset ring-amber-100">
                <span className="font-semibold">Gate:</span> {step.gate}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {step.emailType && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">
                  ✉ {step.emailType}
                </span>
              )}
              {step.smsType && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-1 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-100">
                  ✆ {step.smsType}
                </span>
              )}
              {other && (
                <Link
                  href={`/admin/automations/${other.id}`}
                  className="inline-flex min-h-7 items-center rounded-md px-2 text-[10px] font-semibold text-teal-700 transition-colors hover:bg-teal-50 hover:text-teal-900"
                >
                  Runs in {other.name.split(" — ")[0]} →
                </Link>
              )}
              {!step.ownedBy && step.ownerNote && (
                <span className="text-[10px] text-gray-400">{step.ownerNote}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </li>
  );
}
