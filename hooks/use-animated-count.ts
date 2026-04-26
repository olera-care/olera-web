"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tween a single number toward a target whenever the target changes.
 * Re-runs the animation each time `value` updates (unlike
 * useAnimatedCounters which only fires once on mount).
 *
 * Used by the admin analytics KPI tiles so that switching the date
 * picker animates the numbers up/down rather than snapping. Cubic ease-out.
 */
export function useAnimatedCount(value: number, durationMs: number = 600): number {
  const [display, setDisplay] = useState<number>(value);
  const fromRef = useRef<number>(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const start = fromRef.current;
    const diff = value - start;
    if (diff === 0) {
      setDisplay(value);
      return;
    }
    let startTime: number | null = null;

    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + diff * eased;
      setDisplay(diff > 0 ? Math.floor(current) : Math.ceil(current));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(value);
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = display;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return display;
}
