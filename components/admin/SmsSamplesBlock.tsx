"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { smsSegmentInfo, type SmsVariant } from "@/lib/sms-samples";
import SmsPhonePreview from "@/components/admin/SmsPhonePreview";
import { getCronJob } from "@/lib/crons/registry";

/**
 * "Text samples" block for /admin/automations/[id] — the SMS sibling of the
 * email-samples preview card. Pill picker per variant, phone-bubble preview
 * rendered from the LIVE template (client-side, no API), segment math, and the
 * trigger/who/why + send gates behind a details toggle.
 *
 * When `currentCronId` is set, texts a DIFFERENT automation fires (journey
 * texts pulled in via smsVariantsForJourneys) get a "sent by" chip on the pill
 * and an owner line in the drawer — the full sequence stays visible without
 * misattributing who sends what.
 */
export default function SmsSamplesBlock({
  variants,
  currentCronId,
  activeId: controlledActiveId,
  onActiveIdChange,
}: {
  variants: SmsVariant[];
  currentCronId?: string;
  activeId?: string | null;
  onActiveIdChange?: (id: string) => void;
}) {
  const rows = useMemo(
    () =>
      variants.map((v) => {
        const body = v.render();
        const mine = !currentCronId || v.cron === currentCronId || !!v.alsoCrons?.includes(currentCronId);
        const owner = !mine && v.cron ? getCronJob(v.cron) : null;
        return { v, body, seg: smsSegmentInfo(body), mine, owner };
      }),
    [variants, currentCronId],
  );
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null);
  const activeId = controlledActiveId ?? internalActiveId;
  const active = rows.find((r) => r.v.id === activeId) ?? rows[0];
  if (!active) return null;

  const selectVariant = (id: string) => {
    setInternalActiveId(id);
    onActiveIdChange?.(id);
  };

  return (
    <div id="text-samples" className="mt-5 scroll-mt-6 overflow-hidden rounded-xl border border-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="font-medium text-gray-700">Text samples</span>
          <span className="truncate text-xs text-gray-400">
            rendered from the live template · to {active.v.audience}
          </span>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-gray-400">
          {active.seg.chars} chars · {active.seg.segments} segment{active.seg.segments === 1 ? "" : "s"} · {active.seg.encoding}
        </span>
      </div>
      {rows.length > 1 && (
        <div className="flex flex-wrap gap-1.5 border-b border-gray-100 bg-gray-50/40 px-4 py-2">
          {rows.map(({ v, mine }) => (
            <button
              key={v.id}
              onClick={() => selectVariant(v.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active.v.id === v.id
                  ? "bg-gray-900 text-white"
                  : mine
                    ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    : "border border-dashed border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
              title={mine ? undefined : "Sent by another automation — shown for the full sequence"}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      {active.owner && (
        <div className="border-b border-gray-100 bg-amber-50/40 px-4 py-1.5 text-xs text-gray-500">
          Sent by{" "}
          <Link href={`/admin/automations/${active.owner.id}`} className="font-medium text-teal-700 hover:underline">
            {active.owner.name.split(" — ")[0]}
          </Link>{" "}
          — shown here so the full text sequence is visible in one place.
        </div>
      )}
      {(active.v.timing || active.v.situation) && (
        <div className="border-b border-teal-100 bg-teal-50/45 px-4 py-3">
          <div className="mx-auto flex max-w-2xl flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            {active.v.timing && (
              <p className="shrink-0 text-xs font-semibold text-teal-800">
                When: {active.v.timing}
              </p>
            )}
            {active.v.situation && (
              <p className="text-xs leading-relaxed text-gray-600">{active.v.situation}</p>
            )}
          </div>
        </div>
      )}
      <div className="bg-white px-4 py-5">
        <SmsPhonePreview body={active.body} />
        <details className="group mx-auto mt-4 max-w-xl">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 12 12" className="h-3 w-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 2.5l4 3.5-4 3.5" /></svg>
            Who gets it & the gates
          </summary>
          <div className="mt-2 space-y-2.5 rounded-lg border border-gray-100 bg-gray-50/60 px-3.5 py-3 text-[13px] leading-relaxed">
            <div className="text-gray-600"><span className="text-gray-400">Trigger</span><br />{active.v.trigger}</div>
            {active.v.who && <div className="text-gray-600"><span className="text-gray-400">Who gets it</span><br />{active.v.who}</div>}
            {active.v.why && <div className="text-gray-600"><span className="text-gray-400">Why</span><br />{active.v.why}</div>}
            {active.v.gates && active.v.gates.length > 0 && (
              <div className="text-gray-600">
                <span className="text-gray-400">Before it sends</span>
                <ul className="mt-1 space-y-1">
                  {active.v.gates.map((g, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-[8px] inline-block h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>
    </div>
  );
}
