"use client";

import { useState, useEffect, useCallback } from "react";
import LeadCaptureSheet from "./LeadCaptureSheet";
import type { LeadCaptureEntryPoint, StaffDisplayInfo } from "./types";

interface LeadCaptureSheetWrapperProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCity?: string | null;
  providerState?: string | null;
  providerCategory?: string | null;
  staff?: StaffDisplayInfo | null;
}

/**
 * Client wrapper that listens for "open-lead-capture-sheet" events
 * and renders the LeadCaptureSheet modal.
 */
export default function LeadCaptureSheetWrapper({
  providerId,
  providerName,
  providerSlug,
  providerCity,
  providerState,
  providerCategory,
  staff,
}: LeadCaptureSheetWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entryPoint, setEntryPoint] = useState<LeadCaptureEntryPoint>("custom_quote");

  const handleOpen = useCallback((e: Event) => {
    const customEvent = e as CustomEvent<{ entryPoint?: LeadCaptureEntryPoint }>;
    const newEntryPoint = customEvent.detail?.entryPoint || "custom_quote";
    setEntryPoint(newEntryPoint);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    window.addEventListener("open-lead-capture-sheet", handleOpen);
    return () => {
      window.removeEventListener("open-lead-capture-sheet", handleOpen);
    };
  }, [handleOpen]);

  return (
    <LeadCaptureSheet
      providerId={providerId}
      providerName={providerName}
      providerSlug={providerSlug}
      entryPoint={entryPoint}
      staff={staff}
      isOpen={isOpen}
      onClose={handleClose}
      providerCity={providerCity}
      providerState={providerState}
      providerCategory={providerCategory}
    />
  );
}
