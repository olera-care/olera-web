"use client";

import Link from "next/link";
import { getCronJob } from "@/lib/crons/registry";
import type { CommsJourney, JourneyStep } from "@/lib/family-comms/journey";

/**
 * Sequence timeline for /admin/automations/[id] — renders a CommsJourney
 * (lib/family-comms/journey.ts) as a vertical timeline. Steps owned by the
 * page's own cron render full-strength; steps another automation runs are
 * dimmed and link to that automation's page, so either page shows the WHOLE
 * journey and where this cron sits in it.
 */
export default function CommsJourneyBlock({
  journey,
  currentCronId,
}: {
  journey: CommsJourney;
  currentCronId: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div className="border-b border-gray-100 px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">{journey.title}</span>
          {journey.ordering === "priority" && (
            <span className="rounded-md bg-gray-100/70 px-2 py-0.5 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200/60">
              priority ladder — first match wins
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">{journey.description}</p>
      </div>
      <ol className="px-4 py-3">
        {journey.steps.map((step, i) => (
          <StepRow
            key={step.key}
            step={step}
            index={i}
            isLast={i === journey.steps.length - 1}
            numbered={journey.ordering === "priority"}
            currentCronId={currentCronId}
          />
        ))}
      </ol>
    </div>
  );
}

function StepRow({
  step,
  index,
  isLast,
  numbered,
  currentCronId,
}: {
  step: JourneyStep;
  index: number;
  isLast: boolean;
  numbered: boolean;
  currentCronId: string;
}) {
  const mine = step.ownedBy === currentCronId;
  const other = step.ownedBy && !mine ? getCronJob(step.ownedBy) : null;
  const dimmed = !mine && !!step.ownedBy;
  return (
    <li className={`relative flex gap-3 ${dimmed ? "opacity-60" : ""}`}>
      {/* rail */}
      <div className="flex w-5 shrink-0 flex-col items-center">
        <span
          className={`mt-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold ring-2 ring-white ${
            mine ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          {numbered ? index + 1 : ""}
        </span>
        {!isLast && <span className="w-px flex-1 bg-gray-200" />}
      </div>
      <div className={`min-w-0 flex-1 ${isLast ? "pb-1" : "pb-4"}`}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{step.timing}</span>
          <span className={`text-sm font-medium ${mine ? "text-gray-900" : "text-gray-600"}`}>{step.title}</span>
          {other && (
            <Link
              href={`/admin/automations/${other.id}`}
              className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
            >
              runs in {other.name.split(" — ")[0]} →
            </Link>
          )}
          {!step.ownedBy && step.ownerNote && (
            <span className="text-[10px] text-gray-400">{step.ownerNote}</span>
          )}
        </div>
        {(step.emailType || step.smsType) && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {step.emailType && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-100/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200/60">
                ✉ {step.emailType}
              </span>
            )}
            {step.smsType && (
              <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 ring-1 ring-inset ring-sky-200/60">
                ✆ {step.smsType}
              </span>
            )}
          </div>
        )}
        <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{step.description}</p>
        {step.gate && <p className="mt-0.5 text-xs text-gray-400">Gate: {step.gate}</p>}
      </div>
    </li>
  );
}
