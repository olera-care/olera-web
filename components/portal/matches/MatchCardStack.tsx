"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Provider } from "@/lib/types/provider";
import MatchCard from "./MatchCard";
import MatchActions from "./MatchActions";
import MatchExhaustedState from "./MatchExhaustedState";

interface MatchCardStackProps {
  providers: Provider[];
  onDismiss: (provider: Provider) => void;
  onConnect: (provider: Provider) => void;
  onViewProfile: (provider: Provider) => void;
  onRefresh?: () => void;
  isLoading: boolean;
}

type AnimDirection = "left" | "right" | null;

export default function MatchCardStack({
  providers,
  onDismiss,
  onConnect,
  onViewProfile,
  onRefresh,
  isLoading,
}: MatchCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animDirection, setAnimDirection] = useState<AnimDirection>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevProvidersRef = useRef(providers);

  // Reset index when providers array changes (e.g. after refresh)
  useEffect(() => {
    if (providers !== prevProvidersRef.current && providers.length > 0) {
      setCurrentIndex(0);
      setRefreshing(false);
    }
    prevProvidersRef.current = providers;
  }, [providers]);

  const provider = providers[currentIndex];
  const nextProvider = providers[currentIndex + 1];
  const isExhausted = currentIndex >= providers.length;

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const advance = useCallback(
    (direction: AnimDirection, callback: () => void) => {
      if (prefersReducedMotion) {
        callback();
        setCurrentIndex((i) => i + 1);
        return;
      }
      setAnimDirection(direction);
      setTimeout(() => {
        callback();
        setCurrentIndex((i) => i + 1);
        setAnimDirection(null);
      }, 200);
    },
    [prefersReducedMotion]
  );

  const handleDismiss = useCallback(() => {
    if (!provider || animDirection || showConfirmation) return;
    advance("left", () => onDismiss(provider));
  }, [provider, animDirection, showConfirmation, advance, onDismiss]);

  const handleConnect = useCallback(() => {
    if (!provider || animDirection || showConfirmation) return;
    // Fire connection request immediately (optimistic)
    onConnect(provider);
    // Show inline confirmation overlay
    setShowConfirmation(true);
    // After 2 seconds, clear overlay and advance card
    setTimeout(() => {
      setShowConfirmation(false);
      advance("right", () => {});
    }, 2000);
  }, [provider, animDirection, showConfirmation, onConnect, advance]);

  const handleViewProfile = useCallback(() => {
    if (!provider) return;
    onViewProfile(provider);
  }, [provider, onViewProfile]);

  // Keyboard support
  useEffect(() => {
    if (isExhausted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if focus is in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleDismiss();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleConnect();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleViewProfile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExhausted, handleDismiss, handleConnect, handleViewProfile]);

  // Touch/swipe support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only horizontal swipes > 80px threshold
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) {
          handleDismiss();
        } else {
          handleConnect();
        }
      }
    },
    [handleDismiss, handleConnect]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (providers.length === 0 || isExhausted) {
    const handleRefresh = onRefresh
      ? () => {
          setRefreshing(true);
          onRefresh();
        }
      : undefined;
    return (
      <MatchExhaustedState onRefresh={handleRefresh} refreshing={refreshing} />
    );
  }

  // Animation classes
  const getCardTransform = () => {
    if (!animDirection) return "";
    if (animDirection === "left")
      return "translate-x-[-120%] -rotate-[8deg] opacity-0";
    if (animDirection === "right")
      return "translate-x-[120%] rotate-[8deg] opacity-0";
    return "";
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      {/* Card stack wrapper */}
      <div
        className="relative w-full max-w-[600px]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Next card (peeking behind) */}
        {nextProvider && (
          <div className="absolute top-1.5 left-2.5 right-2.5 rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200 h-full z-0 scale-[0.97] opacity-70" />
        )}

        {/* Current card */}
        <div
          className={[
            "relative z-10 transition-all",
            animDirection ? "duration-200 ease-out" : "",
            getCardTransform(),
          ].join(" ")}
        >
          <MatchCard
            provider={provider}
            index={currentIndex}
            total={providers.length}
            onViewProfile={handleViewProfile}
          />

          {/* Inline confirmation overlay */}
          {showConfirmation && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/95">
              {/* Green check circle */}
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-900">Request sent</p>
              <p className="text-sm text-gray-500 mt-1">
                Track responses in My Connections
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <MatchActions
        onDismiss={handleDismiss}
        onConnect={handleConnect}
        disabled={!!animDirection || showConfirmation}
      />
    </div>
  );
}
