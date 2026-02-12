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
  isLoading: boolean;
}

type AnimDirection = "left" | "right" | null;

export default function MatchCardStack({
  providers,
  onDismiss,
  onConnect,
  onViewProfile,
  isLoading,
}: MatchCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animDirection, setAnimDirection] = useState<AnimDirection>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!provider || animDirection) return;
    advance("left", () => onDismiss(provider));
  }, [provider, animDirection, advance, onDismiss]);

  const handleConnect = useCallback(() => {
    if (!provider || animDirection) return;
    onConnect(provider);
  }, [provider, animDirection, onConnect]);

  const handleViewProfile = useCallback(() => {
    if (!provider) return;
    onViewProfile(provider);
  }, [provider, onViewProfile]);

  // After connect confirmation, advance the card
  // This is called from the parent after the modal confirms
  const advanceAfterConnect = useCallback(() => {
    advance("right", () => {});
  }, [advance]);

  // Expose advanceAfterConnect via ref pattern
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement & { advanceCard?: () => void }).advanceCard =
        advanceAfterConnect;
    }
  }, [advanceAfterConnect]);

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
    return <MatchExhaustedState />;
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
        className="relative w-full max-w-[480px]"
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
        </div>
      </div>

      {/* Action buttons */}
      <MatchActions
        onDismiss={handleDismiss}
        onConnect={handleConnect}
        disabled={!!animDirection}
      />
    </div>
  );
}
