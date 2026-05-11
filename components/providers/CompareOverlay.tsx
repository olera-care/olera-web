"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import type { CompareProvider } from "./CompareBottomSheet";

type FooterState = "initial" | "email_capture" | "submitting" | "success";

interface CompareOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: CompareProvider;
  similarProviders: CompareProvider[];
  ctaVariant?: string | null;
  ctaPreviewMode?: boolean;
}

/**
 * Desktop comparison overlay - Zillow-style full-height panel.
 * Opens on top of the provider page with left/right margins showing the underlying page.
 */
export default function CompareOverlay({
  isOpen,
  onClose,
  currentProvider,
  similarProviders,
  ctaVariant,
  ctaPreviewMode = false,
}: CompareOverlayProps) {
  const router = useRouter();
  const { user, activeProfile } = useAuth();
  const [footerState, setFooterState] = useState<FooterState>("initial");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const saveClickFiredRef = useRef(false);

  // Check if user is logged in
  const isLoggedIn = !!user && !!activeProfile;
  const userEmail = user?.email || "";

  // All providers: current first, then similar (max 2)
  const allProviders = [currentProvider, ...similarProviders.slice(0, 2)];

  // Submit for logged-in users (skip email capture)
  const handleLoggedInSubmit = useCallback(async () => {
    if (!userEmail) return;

    // Track analytics
    if (!ctaPreviewMode && ctaVariant && !saveClickFiredRef.current) {
      saveClickFiredRef.current = true;
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "user",
          related_provider_id: currentProvider.slug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "desktop",
            action: "save_comparison_clicked",
            logged_in: true,
          },
        }),
      }).catch(() => {});
    }

    setFooterState("submitting");

    try {
      const res = await fetch("/api/connections/compare-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          providers: allProviders.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
          })),
          sessionId: getOrCreateSessionId(),
          isLoggedIn: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setFooterState("initial");
        return;
      }

      setFooterState("success");

      // Redirect to inbox
      setTimeout(() => {
        const firstConnectionId = data.connectionIds?.[0];
        router.push(firstConnectionId ? `/portal/inbox?id=${firstConnectionId}` : "/portal/inbox");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setFooterState("initial");
    }
  }, [userEmail, ctaPreviewMode, ctaVariant, currentProvider.slug, allProviders, router]);

  // Track "Save this comparison" button click (once per overlay session)
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
            surface: "desktop",
            action: "save_comparison_clicked",
          },
        }),
      }).catch(() => {});
    }
    setFooterState("email_capture");
  }, [ctaVariant, ctaPreviewMode, currentProvider.slug]);

  // Extract first name for headline
  const firstName = (() => {
    const cleanName = currentProvider.name?.replace(/^\([^)]+\)\s*/, "") || "";
    return cleanName.split(/\s/)[0] || currentProvider.name?.split(/\s/)[0] || "Provider";
  })();

  // Location string
  const locationStr = [currentProvider.city, currentProvider.state].filter(Boolean).join(", ");
  const categoryLocationStr = [currentProvider.category, locationStr].filter(Boolean).join(" · ");

  // Calculate badges
  const badges = calculateBadges(allProviders);

  // Handle email submission
  const handleSubmit = useCallback(async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }

    setError(null);
    setFooterState("submitting");

    try {
      const res = await fetch("/api/connections/compare-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          providers: allProviders.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
          })),
          sessionId: getOrCreateSessionId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setFooterState("email_capture");
        return;
      }

      // Set session using Supabase client (not raw cookies)
      if (data.accessToken && data.refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
      }

      setFooterState("success");

      // Redirect to inbox after brief delay
      setTimeout(() => {
        router.push("/portal/inbox");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setFooterState("email_capture");
    }
  }, [email, allProviders, router]);

  // Handle escape key to close (disabled during submitting/success)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && footerState !== "submitting" && footerState !== "success") {
        onClose();
      }
    },
    [onClose, footerState]
  );

  // Track mount for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and reset state when opened
  // Store handleKeyDown in a ref to avoid re-running this effect when footerState changes
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => handleKeyDownRef.current(e);

    if (isOpen) {
      // Reset state when opening
      setFooterState("initial");
      setEmail("");
      setError(null);
      saveClickFiredRef.current = false;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", keyHandler);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", keyHandler);
    };
  }, [isOpen]); // Only re-run when isOpen changes, not when handleKeyDown changes

  // Close overlay when viewport switches to mobile (below md breakpoint)
  // This prevents scroll lock from persisting when overlay is hidden via CSS
  useEffect(() => {
    if (!isOpen) return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        // Switched to mobile - close the desktop overlay
        onClose();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const overlayContent = (
    <div className="fixed inset-0 z-[200] hidden md:block">
      {/* Backdrop - click to close (disabled during submit/success) */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={footerState === "submitting" || footerState === "success" ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Overlay panel - full height, with left/right margins */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[calc(100%-80px)] max-w-6xl bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-6 h-16 border-b border-gray-200 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            disabled={footerState === "submitting" || footerState === "success"}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to {firstName}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              {firstName} next to {similarProviders.length} nearby home{similarProviders.length !== 1 ? "s" : ""}.
            </h1>
            <p className="text-gray-500">
              {categoryLocationStr} · Reviews, pricing, services side by side
            </p>
          </div>

          {/* Comparison Table */}
          <div className="px-8 pb-8">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Provider Headers */}
              <div
                className="grid border-b border-gray-200"
                style={{ gridTemplateColumns: `180px repeat(${allProviders.length}, 1fr)` }}
              >
                {/* Empty corner cell */}
                <div className="p-4 bg-gray-50" />

                {/* Provider columns */}
                {allProviders.map((provider, index) => (
                  <div
                    key={provider.id}
                    className={`p-4 bg-white ${
                      index < allProviders.length - 1 ? "border-r border-gray-200" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
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
                          <span className="text-lg font-semibold text-amber-700">
                            {provider.name.charAt(0)}
                          </span>
                        </div>
                      )}

                      {/* Name and location */}
                      <div className="flex-1 min-w-0">
                        {/* "This page" label for current provider */}
                        {index === 0 && (
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-600 mb-0.5">
                            This page
                          </p>
                        )}
                        <Link
                          href={`/provider/${provider.slug}`}
                          className="text-[15px] font-bold text-gray-900 leading-tight hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          {provider.name}
                        </Link>
                        <p className="text-sm text-gray-500 truncate">
                          {[provider.city, provider.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Rows */}
              <CompareRow
                label="MONTHLY COST"
                providers={allProviders}
                getValue={(p) => (
                  <div>
                    <span className="text-[15px] font-semibold text-gray-900">
                      {p.priceRange || "—"}
                    </span>
                    {p.priceRange && (
                      <p className="text-sm text-gray-500">Estimated range</p>
                    )}
                  </div>
                )}
              />

              <CompareRow
                label="RATING"
                providers={allProviders}
                getValue={(p) => (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-[15px] font-semibold text-gray-900">
                        {p.rating?.toFixed(1) || "—"}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({p.reviewCount || 0})
                      </span>
                    </div>
                    {badges[p.id] && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        {badges[p.id]}
                      </span>
                    )}
                  </div>
                )}
              />

              <CompareRow
                label="CARE SERVICES"
                providers={allProviders}
                getValue={(p) => (
                  <span className="text-[15px] text-gray-900">
                    {p.services?.slice(0, 3).join(", ") || "—"}
                  </span>
                )}
              />

              <CompareRow
                label="HIGHLIGHTS"
                providers={allProviders}
                getValue={(p) => (
                  <span className="text-[15px] text-gray-900">
                    {p.highlights?.slice(0, 2).join(" · ") || "—"}
                  </span>
                )}
                isLast
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
          {footerState === "success" ? (
            /* Success state - centered */
            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900">Saved.</span>
              </div>
              <p className="text-sm text-gray-500">Taking you to your saved comparison...</p>
            </div>
          ) : footerState === "submitting" ? (
            /* Submitting state - centered spinner */
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            </div>
          ) : footerState === "initial" ? (
            /* Initial state - button to start (different for logged-in vs guest) */
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">Save this comparison</span>
                  {" · "}
                  Message any of them when you&apos;re ready
                </p>
                {isLoggedIn && (
                  <p className="text-sm text-gray-500 mt-0.5">Saving as {userEmail}</p>
                )}
              </div>
              <button
                type="button"
                onClick={isLoggedIn ? handleLoggedInSubmit : handleSaveClick}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
              >
                Save this comparison
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          ) : (
            /* Email capture state - inline form */
            <div className="flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <p className="font-semibold text-gray-900">Save this comparison</p>
                <p className="text-sm text-gray-500">Add your email so you don&apos;t lose it.</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="flex items-center gap-3 flex-1 max-w-lg"
              >
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="you@email.com"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      error ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-gray-900"
                    } focus:outline-none focus:ring-2 text-[15px]`}
                    autoFocus
                  />
                  {error && (
                    <p className="absolute -bottom-5 left-0 text-xs text-red-500">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex-shrink-0 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors whitespace-nowrap"
                >
                  Save my comparison
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare Row Component
// ─────────────────────────────────────────────────────────────────────────────

function CompareRow({
  label,
  providers,
  getValue,
  isLast = false,
}: {
  label: string;
  providers: CompareProvider[];
  getValue: (provider: CompareProvider) => React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className={`grid ${!isLast ? "border-b border-gray-200" : ""}`}
      style={{ gridTemplateColumns: `180px repeat(${providers.length}, 1fr)` }}
    >
      {/* Label cell */}
      <div className="p-4 bg-gray-50 flex items-start">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
      </div>

      {/* Value cells */}
      {providers.map((provider, index) => (
        <div
          key={provider.id}
          className={`p-4 bg-white ${
            index < providers.length - 1 ? "border-r border-gray-200" : ""
          }`}
        >
          {getValue(provider)}
        </div>
      ))}
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

  // Find highest rated
  const withRatings = providers.filter((p) => p.rating != null);
  if (withRatings.length > 0) {
    const highest = withRatings.reduce((a, b) => (a.rating! > b.rating! ? a : b));
    badges[highest.id] = "HIGHEST RATED";
  }

  // Find best price (lowest starting price)
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

  // Find most services
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
