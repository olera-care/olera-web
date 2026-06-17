"use client";

/**
 * ProgramBenefitsMobileCTA — the mobile/tablet equivalent of the desktop
 * sticky rail. A fixed bottom bar (the provider-page pattern: value text +
 * one button) that opens a bottom sheet holding ProgramBenefitsCard.
 *
 * Shown below `xl` (where the desktop rail doesn't render). On benefit pages
 * this is the primary persistent CTA — it replaces the legacy floating
 * "Call to apply" pill (ProgramPageV3 only renders that pill when this card
 * isn't shown). The phone number remains reachable in the Contact section.
 */

import { useState, useEffect, useCallback } from "react";
import { X } from "@phosphor-icons/react";
import { type CareNeed } from "@/lib/benefits/match-care-need";
import ProgramBenefitsCard, { type ProgramBenefitsCardProps } from "./ProgramBenefitsCard";

type Props = Omit<ProgramBenefitsCardProps, "variant"> & {
  careNeed: CareNeed;
};

/** Same upper-bound parse as the card — kept local so the bar can show the
 *  value without rendering the full card. */
function topSavingsLabel(range?: string): string | null {
  if (!range) return null;
  const matches = range.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  const top = matches[matches.length - 1];
  const period = /\bmo\b|month/i.test(range) ? "/mo" : "/yr";
  return `${top}${period}`;
}

export default function ProgramBenefitsMobileCTA(props: Props) {
  const [open, setOpen] = useState(false);
  const savings = topSavingsLabel(props.savingsRange);

  const close = useCallback(() => setOpen(false), []);

  // Escape to close + lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  return (
    <>
      {/* Fixed bottom bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pt-3 backdrop-blur xl:hidden print:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            {savings ? (
              <>
                <p className="truncate text-[15px] font-bold leading-tight text-gray-900">
                  Up to {savings}
                </p>
                <p className="truncate text-[12px] text-gray-500">Estimated benefit</p>
              </>
            ) : (
              <>
                <p className="truncate text-[15px] font-bold leading-tight text-gray-900">
                  {props.programShortName || props.programName}
                </p>
                <p className="truncate text-[12px] text-gray-500">See if you qualify</p>
              </>
            )}
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-full bg-primary-600 px-5 py-3 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            Check my eligibility
          </button>
        </div>
      </div>

      {/* Bottom sheet */}
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Check your eligibility">
          <button
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-gray-900/40 animate-fadeIn"
          />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-white px-5 pt-3 shadow-2xl animate-slideUp"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            {/* Grabber + close */}
            <div className="mb-1 flex items-center justify-center">
              <div className="h-1 w-9 rounded-full bg-gray-300" />
            </div>
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" weight="bold" />
            </button>
            <div className="pt-2">
              <ProgramBenefitsCard {...props} variant="bare" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
