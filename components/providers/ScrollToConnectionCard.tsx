"use client";

import type { LeadCaptureEntryPoint } from "./lead-capture/types";

/**
 * Button that opens the lead capture sheet (both mobile and desktop).
 * Dispatches a custom event with the entry point context.
 *
 * Used by "Get a custom quote", "Book a consultation", and "Message [staff]".
 */
export default function ScrollToConnectionCard({
  children,
  className,
  entryPoint = "custom_quote",
}: {
  children: React.ReactNode;
  className?: string;
  entryPoint?: LeadCaptureEntryPoint;
}) {
  function handleClick() {
    // Open lead capture sheet on both mobile and desktop
    window.dispatchEvent(
      new CustomEvent("open-lead-capture-sheet", {
        detail: { entryPoint },
      })
    );
  }

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
