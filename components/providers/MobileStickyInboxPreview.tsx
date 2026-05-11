"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { getQuestionsForCategory, splitQuestions } from "@/lib/cta-questions";
import { InboxPreviewMobile } from "@/components/providers/cta-variants";
import { getOrCreateSessionId } from "@/lib/analytics/session";

interface MobileStickyInboxPreviewProps {
  providerName: string;
  providerId: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  acceptedPayments: string[];
  ctaVariant?: string | null;
  ctaSurface?: "desktop" | "mobile";
  ctaPreviewMode?: boolean;
}

/**
 * Mobile sticky CTA for the inbox_preview variant.
 * Step 1: Sticky bar + bottom sheet with question selection
 * Step 2: Full-screen inbox preview with email capture
 */
export default function MobileStickyInboxPreview({
  providerName,
  providerId,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  acceptedPayments,
  ctaVariant,
  ctaSurface = "mobile",
  ctaPreviewMode = false,
}: MobileStickyInboxPreviewProps) {
  const [visible, setVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [step, setStep] = useState<"question" | "inbox">("question");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  // Suppression flags (same as MobileStickyBottomCTA)
  const [benefitsInView, setBenefitsInView] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Get category-specific questions
  const questions = getQuestionsForCategory(providerCategory);
  const { initial, expanded: expandedQuestions } = splitQuestions(questions);

  // Extract first name
  const providerFirstName = providerName.split(" ")[0];

  // Fire cta_variant_clicked when sheet opens
  const sheetClickFiredRef = useRef(false);
  const fireSheetOpenEvent = useCallback(() => {
    if (!ctaVariant || sheetClickFiredRef.current) return;
    if (ctaPreviewMode) return;
    sheetClickFiredRef.current = true;
    fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "anonymous",
        related_provider_id: providerSlug,
        event_type: "cta_variant_clicked",
        session_id: getOrCreateSessionId(),
        metadata: {
          variant: ctaVariant,
          surface: "mobile",
          action: "sheet_opened",
        },
      }),
    }).catch(() => {});
  }, [ctaVariant, providerSlug, ctaPreviewMode]);

  // Fire question selected event
  const fireQuestionSelectedEvent = useCallback(
    (questionText: string) => {
      if (!ctaVariant) return;
      if (ctaPreviewMode) return;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: providerSlug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "mobile",
            action: "question_selected",
            question: questionText,
          },
        }),
      }).catch(() => {});
    },
    [ctaVariant, providerSlug, ctaPreviewMode]
  );

  // Scroll visibility with hysteresis
  const handleScroll = useCallback(() => {
    setVisible((prev) => {
      if (window.scrollY > 100) return true;
      if (window.scrollY < 30) return false;
      return prev;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Benefits module suppression (same as MobileStickyBottomCTA)
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    let attached: Element | null = null;
    let io: IntersectionObserver | null = null;

    const intersectionCallback = (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        setBenefitsInView(entry.intersectionRatio >= 0.5);
      }
    };

    function attach() {
      const el = document.getElementById("benefits");
      if (el === attached) return;
      if (io) {
        io.disconnect();
        io = null;
      }
      setBenefitsInView(false);
      attached = el;
      if (!el) return;
      io = new IntersectionObserver(intersectionCallback, {
        threshold: [0, 0.5, 1],
      });
      io.observe(el);
    }

    attach();

    const mo =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            attach();
          })
        : null;
    if (mo) mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (io) io.disconnect();
      if (mo) mo.disconnect();
    };
  }, []);

  // Keyboard suppression
  useEffect(() => {
    function isTypable(target: EventTarget | null): boolean {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT") {
        const type = (target as HTMLInputElement).type;
        return (
          type !== "checkbox" &&
          type !== "radio" &&
          type !== "button" &&
          type !== "submit"
        );
      }
      return tag === "TEXTAREA" || target.isContentEditable;
    }
    function onFocusIn(e: FocusEvent) {
      if (isTypable(e.target)) setKeyboardOpen(true);
    }
    function onFocusOut() {
      requestAnimationFrame(() => {
        if (!isTypable(document.activeElement)) setKeyboardOpen(false);
      });
    }
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  // Allow other components to open the sheet
  useEffect(() => {
    const openSheet = () => {
      fireSheetOpenEvent();
      setSheetOpen(true);
    };
    window.addEventListener("open-connection-sheet", openSheet);
    return () => window.removeEventListener("open-connection-sheet", openSheet);
  }, [fireSheetOpenEvent]);

  const handleQuestionClick = useCallback(
    (questionText: string) => {
      setSelectedQuestion(questionText);
      setStep("inbox");
      fireQuestionSelectedEvent(questionText);
    },
    [fireQuestionSelectedEvent]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customQuestion.trim();
    if (trimmed) {
      setSelectedQuestion(trimmed);
      setStep("inbox");
      fireQuestionSelectedEvent(trimmed);
    }
  }, [customQuestion, fireQuestionSelectedEvent]);

  const handleBack = useCallback(() => {
    setStep("question");
    setSelectedQuestion(null);
  }, []);

  const handleClose = useCallback(() => {
    setSheetOpen(false);
    // Reset to question step when closing
    setTimeout(() => {
      setStep("question");
      setSelectedQuestion(null);
      setExpanded(false);
      setCustomQuestion("");
    }, 300);
  }, []);

  // Step 2: Full-screen inbox preview
  if (step === "inbox" && selectedQuestion && sheetOpen) {
    return (
      <>
        {/* Spacer */}
        <div
          className="md:hidden"
          aria-hidden="true"
          style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
        />

        {/* Sticky bar hidden during inbox step */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden translate-y-full" />

        {/* Full-screen inbox preview */}
        <div className="fixed inset-0 z-50 md:hidden bg-white">
          <InboxPreviewMobile
            providerId={providerId}
            providerName={providerName}
            providerSlug={providerSlug}
            providerCategory={providerCategory}
            providerCity={providerCity}
            providerState={providerState}
            selectedQuestion={selectedQuestion}
            onBack={handleBack}
            onClose={handleClose}
            ctaVariant={ctaVariant}
            ctaSurface={ctaSurface}
            ctaPreviewMode={ctaPreviewMode}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Document-flow spacer */}
      <div
        className="md:hidden"
        aria-hidden="true"
        style={{ height: "calc(76px + env(safe-area-inset-bottom, 0px))" }}
      />

      {/* Sticky bottom bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          visible && !benefitsInView && !keyboardOpen
            ? "translate-y-0"
            : "translate-y-full"
        }`}
      >
        <div
          className="bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              {/* Direct Line Badge */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Direct Line — No Agents
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">
                Message {providerFirstName}. No one else.
              </p>
            </div>

            <button
              onClick={() => {
                fireSheetOpenEvent();
                setSheetOpen(true);
              }}
              className="flex-shrink-0 px-5 py-3 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[13px] font-semibold transition-colors flex items-center gap-1"
            >
              Open
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Question selection bottom sheet */}
      <Modal
        isOpen={sheetOpen && step === "question"}
        onClose={handleClose}
        title={`Message ${providerFirstName}`}
        size="lg"
      >
        <div className="py-2">
          {/* Initial 3 questions */}
          <div className="space-y-2">
            {initial.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuestionClick(q.text)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors group"
              >
                <span className="text-[15px] text-gray-800 font-medium">
                  {q.text}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}

            {/* Expanded questions */}
            {expanded && (
              <>
                {expandedQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(q.text)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors group animate-step-in"
                  >
                    <span className="text-[15px] text-gray-800 font-medium">
                      {q.text}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}

                {/* Custom question input */}
                <div className="pt-2 animate-step-in">
                  <div className="relative">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomSubmit();
                        }
                      }}
                      placeholder="Or type your own question..."
                      className="w-full px-4 py-3.5 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    />
                    {customQuestion.trim() && (
                      <button
                        onClick={handleCustomSubmit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 transition-colors"
                        aria-label="Send question"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Expand toggle */}
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full text-center py-3 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                More questions{" "}
                <span className="inline-block ml-0.5">↓</span>
              </button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
