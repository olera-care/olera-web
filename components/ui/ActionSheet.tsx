"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ActionSheetOption {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  selected?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  /** Cancel button label. Set to null to hide. Default: "Cancel" */
  cancelLabel?: string | null;
}

/**
 * Mobile-native action sheet component.
 * Slides up from bottom on mobile, shows as dropdown-style popover on desktop.
 * Use for quick option selection (2-6 options) where a full modal is overkill.
 */
export default function ActionSheet({
  isOpen,
  onClose,
  title,
  options,
  cancelLabel = "Cancel",
}: ActionSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Stable ref for onClose
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    const active = document.activeElement;
    if (active && active !== document.body) {
      (active as HTMLElement).blur();
    }
    onCloseRef.current();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Prevent body scroll on mobile
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      // Read the stored scroll position from the top style before clearing
      const storedScrollY = parseInt(document.body.style.top || "0", 10) * -1;

      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";

      // Restore scroll position immediately without animation
      requestAnimationFrame(() => {
        window.scrollTo({ top: storedScrollY, behavior: "instant" });
      });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Actions"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 animate-fade-in"
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full sm:max-w-sm animate-sheet-up sm:animate-modal-pop"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Options card */}
        <div className="mx-3 sm:mx-0 mb-2 sm:mb-0 bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Title */}
          {title && (
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-400 text-center font-medium">
                {title}
              </p>
            </div>
          )}

          {/* Options */}
          <div className="divide-y divide-gray-100">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  handleClose();
                }}
                className={`w-full px-4 py-4 min-h-[56px] flex items-center justify-center gap-3 text-[17px] font-medium transition-colors active:bg-gray-50 ${
                  option.destructive
                    ? "text-red-600"
                    : option.selected
                    ? "text-primary-600"
                    : "text-gray-900"
                }`}
              >
                {option.icon && (
                  <span className="w-5 h-5 flex items-center justify-center">
                    {option.icon}
                  </span>
                )}
                {option.label}
                {option.selected && (
                  <svg className="w-5 h-5 text-primary-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cancel button - separate card on mobile */}
        {cancelLabel && (
          <div className="mx-3 sm:mx-0 mb-3 sm:hidden">
            <button
              onClick={handleClose}
              className="w-full px-4 py-4 min-h-[56px] bg-white rounded-2xl text-[17px] font-semibold text-primary-600 active:bg-gray-50 transition-colors shadow-2xl"
            >
              {cancelLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
