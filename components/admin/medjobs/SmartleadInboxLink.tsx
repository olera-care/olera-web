"use client";

/**
 * SmartleadInboxLink — a small "reply manually" affordance that opens the
 * Smartlead master inbox (scoped to the thread when linkage is known, root
 * otherwise). Surfaced wherever an admin might want to step in and answer a
 * lead by hand instead of leaning on the automated cadence: the awaiting-
 * reply Next Step, and both pre-launch review modals.
 */

import {
  smartleadInboxUrl,
  SMARTLEAD_INBOX_ROOT,
  type SmartleadLinkage,
} from "@/lib/medjobs/smartlead-inbox";

export function SmartleadInboxLink({
  linkage,
  label = "Reply in Smartlead",
  className,
}: {
  /** Thread linkage when known. Null/undefined falls back to the root inbox. */
  linkage?: SmartleadLinkage | null;
  label?: string;
  className?: string;
}) {
  const url = smartleadInboxUrl(linkage) ?? SMARTLEAD_INBOX_ROOT;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Open the Smartlead master inbox to read or reply to this thread by hand."
      className={
        className ??
        "inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:underline"
      }
    >
      ↗ {label}
    </a>
  );
}
