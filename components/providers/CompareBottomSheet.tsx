"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";

export interface CompareProvider {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  category?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceRange?: string | null;
  services?: string[];
  highlights?: string[];
}

interface CompareBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: CompareProvider;
  similarProviders: CompareProvider[];
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

type FooterState = "initial" | "email_capture" | "submitting" | "success";

/**
 * Mobile comparison bottom sheet with horizontal swipeable cards.
 * Shows current provider + 2 similar providers side by side.
 * Uses a custom bottom sheet (not Modal) to allow cards to peek from the right.
 */
export default function CompareBottomSheet({
  isOpen,
  onClose,
  currentProvider,
  similarProviders,
  ctaVariant,
  ctaPreviewMode = false,
}: CompareBottomSheetProps) {
  const router = useRouter();
  const { user, activeProfile } = useAuth();
  const isLoggedIn = !!user && !!activeProfile;
  const userEmail = user?.email || "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [footerState, setFooterState] = useState<FooterState>("initial");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const saveClickFiredRef = useRef(false);

  // All providers: current first, then similar
  // Memoized to prevent unnecessary callback recreations
  const allProviders = useMemo(
    () => [currentProvider, ...similarProviders.slice(0, 2)],
    [currentProvider, similarProviders]
  );
  const totalProviders = allProviders.length;

  // Track which providers are selected for saving (all selected by default)
  const [selectedProviderIds, setSelectedProviderIds] = useState<Set<string>>(
    () => new Set(allProviders.map((p) => p.id))
  );

  // Get selected providers for saving
  const selectedProviders = allProviders.filter((p) => selectedProviderIds.has(p.id));
  const selectedCount = selectedProviders.length;

  // Toggle provider selection
  const toggleProvider = (providerId: string) => {
    setSelectedProviderIds((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  // Location string
  const locationStr = [currentProvider.city, currentProvider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [currentProvider.category, locationStr].filter(Boolean).join(" · ");

  // Calculate badges for providers (highest rated, best price, most services)
  const badges = calculateBadges(allProviders);

  // Handle scroll to update current index
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = window.innerWidth * 0.78 + 12;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setCurrentIndex(Math.min(newIndex, totalProviders - 1));
  };

  // Scroll to specific card
  const scrollToCard = (index: number) => {
    if (!scrollRef.current) return;
    const cardWidth = window.innerWidth * 0.78 + 12;
    scrollRef.current.scrollTo({ left: index * cardWidth, behavior: "smooth" });
  };

  // Handle escape key (disabled during submitting/success)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && footerState !== "submitting" && footerState !== "success") {
        onClose();
      }
    },
    [onClose, footerState]
  );

  // Mount tracking for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when sheet opens/closes
  // Store handleKeyDown in a ref to avoid re-running this effect when footerState changes
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => handleKeyDownRef.current(e);

    if (isOpen) {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ left: 0, behavior: "instant" });
        setCurrentIndex(0);
      }
      setFooterState("initial");
      setSelectedProviderIds(new Set(allProviders.map((p) => p.id)));
      setEmail("");
      setError(null);
      saveClickFiredRef.current = false;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", keyHandler);
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen]); // Only re-run when isOpen changes, not when handleKeyDown changes

  // Close sheet when viewport switches to desktop (above md breakpoint)
  // This prevents scroll lock from persisting when sheet is hidden via CSS
  useEffect(() => {
    if (!isOpen) return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Switched to desktop - close the mobile sheet
        onClose();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen, onClose]);

  // Focus email input when entering email capture state
  useEffect(() => {
    if (footerState === "email_capture" && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [footerState]);

  // Handle save button click with tracking (once per sheet session)
  const handleSaveClick = useCallback(() => {
    if (!ctaPreviewMode && ctaVariant && !saveClickFiredRef.current) {
      saveClickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: currentProvider.slug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "mobile",
            action: "save_comparison_clicked",
          },
        }),
      }).catch(() => {});
    }
    setFooterState("email_capture");
  }, [ctaVariant, ctaPreviewMode, currentProvider.slug]);

  // Handle logged-in user submit (skip email capture)
  const handleLoggedInSubmit = useCallback(async () => {
    if (!userEmail) return;

    // Track click event
    if (!ctaPreviewMode && ctaVariant && !saveClickFiredRef.current) {
      saveClickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: currentProvider.slug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "mobile",
            action: "save_comparison_clicked",
            isLoggedIn: true,
          },
        }),
      }).catch(() => {});
    }

    setFooterState("submitting");

    try {
      const response = await fetch("/api/connections/compare-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          providers: selectedProviders.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
          })),
          sessionId: getOrCreateSessionId(),
          isLoggedIn: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setFooterState("initial");
        return;
      }

      // Show success state
      setFooterState("success");

      // Redirect to inbox after brief delay
      setTimeout(() => {
        const firstConnectionId = data.connectionIds?.[0];
        router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setFooterState("initial");
    }
  }, [userEmail, ctaVariant, ctaPreviewMode, currentProvider.slug, allProviders, selectedProviderIds, router]);

  // Handle email submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setFooterState("submitting");

    try {
      const response = await fetch("/api/connections/compare-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          providers: selectedProviders.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
          })),
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setFooterState("email_capture");
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

      // Show success state
      setFooterState("success");

      // Redirect to inbox after brief delay
      setTimeout(() => {
        const firstConnectionId = data.connectionIds?.[0];
        router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setFooterState("email_capture");
    }
  };

  if (!isOpen || !mounted) return null;

  const sheetContent = (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={footerState === "submitting" || footerState === "success" ? undefined : onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-sheet-up flex flex-col"
        style={{
          maxHeight: "95dvh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Close button */}
        {footerState !== "success" && (
          <button
            onClick={onClose}
            disabled={footerState === "submitting"}
            className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors z-10 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="px-5 pb-3 shrink-0">
          <h2 className="text-[22px] font-bold text-gray-900 leading-tight pr-10">
            Side by side comparison
          </h2>
          {categoryLocationStr && (
            <p className="text-[15px] text-gray-500 mt-1">{categoryLocationStr} · {selectedCount} of {totalProviders} selected</p>
          )}
        </div>

        {/* Swipe indicator */}
        <div className="px-5 pb-2 shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Provider <span className="text-gray-900">{currentIndex + 1}</span> of {totalProviders} · Swipe to see more →
          </p>
        </div>

        {/* Horizontal scrolling cards */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-auto snap-x snap-mandatory scroll-pl-5 scrollbar-hide overscroll-x-contain"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex items-stretch gap-3 pl-5 pr-5 pb-4">
            {allProviders.map((provider, index) => (
              <CompareCard
                key={provider.id}
                provider={provider}
                isCurrentProvider={index === 0}
                badge={badges[provider.id]}
                isSelected={selectedProviderIds.has(provider.id)}
                onToggle={() => toggleProvider(provider.id)}
              />
            ))}
            <div className="w-5 shrink-0" />
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 py-2 shrink-0">
          {allProviders.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToCard(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-gray-900" : "bg-gray-300"
              }`}
              aria-label={`Go to provider ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer - State Machine */}
        <div className="px-5 py-3 border-t border-gray-200 bg-white shrink-0">
          {footerState === "initial" && (
            <>
              {isLoggedIn ? (
                <>
                  {error && (
                    <p className="text-sm text-red-600 mb-3">{error}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleLoggedInSubmit}
                    disabled={selectedCount === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
                  >
                    {selectedCount === 0
                      ? "Select at least one"
                      : `Save ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  {selectedCount > 0 && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Saving as {userEmail}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    disabled={selectedCount === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-[15px] font-semibold transition-colors"
                  >
                    {selectedCount === 0
                      ? "Select at least one"
                      : `Save ${selectedCount} provider${selectedCount !== 1 ? "s" : ""}`}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  {selectedCount > 0 && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                      Message any of them when you&apos;re ready
                    </p>
                  )}
                </>
              )}
            </>
          )}

          {/* Logged-in user submitting state */}
          {isLoggedIn && footerState === "submitting" && (
            <div className="py-2">
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-[15px] font-semibold opacity-70"
              >
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">
                Saving as {userEmail}
              </p>
            </div>
          )}

          {/* Non-logged-in user email capture / submitting state */}
          {!isLoggedIn && (footerState === "email_capture" || footerState === "submitting") && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900">
                  Save {selectedCount} provider{selectedCount !== 1 ? "s" : ""}
                </h3>
                <p className="text-sm text-gray-500">Add your email so you don&apos;t lose it.</p>
              </div>

              <div className="flex flex-col gap-3">
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={footerState === "submitting"}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 disabled:opacity-50 disabled:bg-gray-50"
                />

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={footerState === "submitting"}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-70"
                >
                  {footerState === "submitting" ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save {selectedCount} provider{selectedCount !== 1 ? "s" : ""}
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {footerState === "success" && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Saved.</h3>
              <p className="text-sm text-gray-500 mt-1">Taking you to your saved comparison...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(sheetContent, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface CompareCardProps {
  provider: CompareProvider;
  isCurrentProvider: boolean;
  badge?: string | null;
  isSelected: boolean;
  onToggle: () => void;
}

function CompareCard({ provider, isCurrentProvider, badge, isSelected, onToggle }: CompareCardProps) {
  const locationStr = [provider.city, provider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [provider.category, locationStr].filter(Boolean).join(" · ");
  const servicesDisplay = provider.services?.slice(0, 3).join(", ") || "—";
  const highlightsDisplay = provider.highlights?.slice(0, 2).join(" · ") || "—";

  return (
    <div
      className={`flex-shrink-0 w-[78vw] snap-start rounded-2xl border-2 border-gray-200 p-4 bg-white transition-opacity flex flex-col ${
        !isSelected ? "opacity-40" : ""
      }`}
    >
      {/* Provider header */}
      <div className="flex items-start gap-3 mb-3">
        {provider.image ? (
          <Image
            src={provider.image}
            alt={provider.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-lg object-cover bg-gray-100"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-base font-semibold text-amber-700">
              {provider.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* "This page" label for current provider */}
          {isCurrentProvider && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 mb-0.5">
              This page
            </p>
          )}
          <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1">
            {provider.name}
          </h3>
          {categoryLocationStr && (
            <p className="text-[13px] text-gray-500 mt-0.5 truncate">{categoryLocationStr}</p>
          )}
        </div>
      </div>

      {/* Rating row with badge */}
      <div className="flex items-center gap-2 mb-3 px-2.5 py-2 bg-amber-50/50 rounded-lg">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-base font-bold text-gray-900">
            {provider.rating?.toFixed(1) || "—"}
          </span>
          <span className="text-xs text-gray-500">
            · {provider.reviewCount || 0}
          </span>
        </div>
        {badge && (
          <span className="ml-auto text-[10px] font-semibold text-amber-700 flex items-center gap-0.5">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {badge}
          </span>
        )}
      </div>

      {/* Comparison rows */}
      <div className="space-y-0 divide-y divide-gray-100">
        <CompareRow label="EST. MONTHLY" value={provider.priceRange || "—"} />
        <CompareRow label="SERVICES" value={servicesDisplay} />
        <CompareRow label="HIGHLIGHTS" value={highlightsDisplay} />
      </div>

      {/* Selection button - mt-auto pushes to bottom of flex card */}
      <div className="mt-auto pt-3 border-t border-gray-100 flex justify-center">
        <button
          type="button"
          onClick={onToggle}
          className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
            isSelected
              ? "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              : "text-primary-600 hover:text-primary-700 hover:bg-primary-50"
          }`}
        >
          {isSelected ? "Don't save" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare Row Component
// ─────────────────────────────────────────────────────────────────────────────

function CompareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 text-right ml-3 leading-tight">
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge Calculation
// ─────────────────────────────────────────────────────────────────────────────

function calculateBadges(providers: CompareProvider[]): Record<string, string | null> {
  const badges: Record<string, string | null> = {};

  providers.forEach((p) => {
    badges[p.id] = null;
  });

  if (providers.length < 2) return badges;

  const withRatings = providers.filter((p) => p.rating != null);
  if (withRatings.length > 0) {
    const highest = withRatings.reduce((a, b) => (a.rating! > b.rating! ? a : b));
    badges[highest.id] = "HIGHEST RATED";
  }

  const withPrices = providers.filter((p) => p.priceRange);
  if (withPrices.length > 0) {
    const parseMinPrice = (range: string) => {
      const match = range.match(/\$?([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, ""), 10) : Infinity;
    };
    const cheapest = withPrices.reduce((a, b) =>
      parseMinPrice(a.priceRange!) < parseMinPrice(b.priceRange!) ? a : b
    );
    if (!badges[cheapest.id]) {
      badges[cheapest.id] = "BEST PRICE";
    }
  }

  const withServices = providers.filter((p) => p.services && p.services.length > 0);
  if (withServices.length > 0) {
    const most = withServices.reduce((a, b) =>
      (a.services?.length || 0) > (b.services?.length || 0) ? a : b
    );
    if (!badges[most.id]) {
      badges[most.id] = "MOST SERVICES";
    }
  }

  return badges;
}
