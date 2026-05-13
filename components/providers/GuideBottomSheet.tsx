"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";

interface GuideBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCity?: string | null;
  providerState?: string | null;
  providerImage?: string | null;
}

type SheetState = "email_capture" | "submitting" | "success";

/**
 * Mobile bottom sheet for the guide CTA.
 * States: email_capture → submitting → success
 * User stays on page after success (no redirect).
 */
export default function GuideBottomSheet({
  isOpen,
  onClose,
  providerId,
  providerName,
  providerSlug,
  providerCity,
  providerState,
  providerImage,
}: GuideBottomSheetProps) {
  const { user, activeProfile } = useAuth();
  const isLoggedIn = !!user && !!activeProfile;
  const userEmail = user?.email || "";

  const [mounted, setMounted] = useState(false);
  const [sheetState, setSheetState] = useState<SheetState>("email_capture");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Handle escape key (disabled during submitting/success)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && sheetState !== "submitting" && sheetState !== "success") {
        onClose();
      }
    },
    [onClose, sheetState]
  );

  // Mount tracking for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when sheet opens/closes
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => handleKeyDownRef.current(e);

    if (isOpen) {
      setSheetState("email_capture");
      setEmail("");
      setError(null);
      setPdfUrl(null);
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", keyHandler);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen]);

  // Close sheet when viewport switches to desktop
  useEffect(() => {
    if (!isOpen) return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        onClose();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen, onClose]);

  // Focus email input when sheet opens
  useEffect(() => {
    if (isOpen && sheetState === "email_capture" && emailInputRef.current) {
      // Small delay to ensure sheet animation has started
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sheetState]);

  // Handle email submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailToUse = isLoggedIn ? userEmail : email.trim();

    if (!emailToUse) {
      setError("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSheetState("submitting");

    try {
      const response = await fetch("/api/connections/guide-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          provider: {
            id: providerId,
            slug: providerSlug,
            name: providerName,
          },
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSheetState("email_capture");
        return;
      }

      // Set session if tokens returned
      if (data.accessToken && data.refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
      }

      // Store PDF URL and trigger download
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl);
        // Auto-download the PDF
        const link = document.createElement("a");
        link.href = data.pdfUrl;
        link.download = "senior-care-checklist.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Show success state (stay on page, no redirect)
      setSheetState("success");
    } catch {
      setError("Something went wrong. Please try again.");
      setSheetState("email_capture");
    }
  };

  // Handle "Open a thread" click
  const handleMessageProvider = useCallback(() => {
    window.location.href = `/portal/inbox`;
  }, []);

  if (!isOpen || !mounted) return null;

  const sheetContent = (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={sheetState === "submitting" || sheetState === "success" ? undefined : onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-sheet-up flex flex-col"
        style={{
          maxHeight: "85dvh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        {sheetState !== "success" && (
          <button
            onClick={onClose}
            disabled={sheetState === "submitting"}
            className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors z-10 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Content */}
        <div className="px-5 pb-5 flex-1 overflow-y-auto">
          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Email Capture State */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "email_capture" && (
            <>
              {/* Header */}
              <div className="mb-5 pr-8">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600">
                    Free · For Families
                  </span>
                </div>
                <h2 className="text-[22px] font-bold text-gray-900 leading-tight">
                  Where should we send it?
                </h2>
                <p className="text-[15px] text-gray-500 mt-1">
                  We&apos;ll email the checklist and start the download.
                </p>
              </div>

              {/* Email form */}
              <form onSubmit={handleSubmit}>
                <input
                  ref={emailInputRef}
                  type="email"
                  value={isLoggedIn ? userEmail : email}
                  onChange={(e) => {
                    if (!isLoggedIn) {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }
                  }}
                  disabled={isLoggedIn}
                  placeholder="your@email.com"
                  className={`w-full px-4 py-3.5 border rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 mb-3 ${
                    error
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-200 focus:ring-gray-900/20 focus:border-gray-900"
                  } ${isLoggedIn ? "bg-gray-50 text-gray-500" : ""}`}
                />

                {error && (
                  <p className="text-sm text-red-600 mb-3">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full px-5 py-3.5 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  Send & download
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <p className="text-center text-xs text-gray-400 mt-3">
                  Right to your device, with a backup in your email.
                </p>
              </form>
            </>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Submitting State */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "submitting" && (
            <div className="py-12 flex flex-col items-center justify-center">
              <svg className="w-10 h-10 animate-spin text-gray-400 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm text-gray-500">Preparing your checklist...</p>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* Success State */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {sheetState === "success" && (
            <>
              {/* Success header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Checklist on its way.</h2>
                  <p className="text-sm text-gray-500">Downloaded · Also sent to your email.</p>
                </div>
              </div>

              {/* Provider card */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Want to ask {providerName.split(" ")[0]} a question?
                </p>

                <div className="flex items-center gap-3">
                  {providerImage ? (
                    <Image
                      src={providerImage}
                      alt={providerName}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <span className="text-lg font-semibold text-amber-700">
                        {providerName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">{providerName}</p>
                    <p className="text-[13px] text-gray-500">
                      {[providerCity, providerState].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              <button
                onClick={handleMessageProvider}
                className="w-full px-5 py-3.5 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Open a thread
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              {/* Re-download + Close links */}
              <div className="flex items-center justify-center gap-4 mt-4">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Download checklist again
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}
