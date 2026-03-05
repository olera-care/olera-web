"use client";

import { useState, useEffect, useRef } from "react";

export function useAnimatedCounters(
  targets: { end: number; duration?: number }[],
  shouldStart: boolean
) {
  const [counts, setCounts] = useState<number[]>(targets.map(() => 0));
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasAnimatedRef.current) return;

    hasAnimatedRef.current = true;
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;

      const newCounts = targets.map((target) => {
        const duration = target.duration || 2000;
        const progress = Math.min((currentTime - startTime!) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        return Math.floor(easeOut * target.end);
      });

      setCounts(newCounts);

      const allComplete = targets.every((target) => {
        const duration = target.duration || 2000;
        const progress = (currentTime - startTime!) / duration;
        return progress >= 1;
      });

      if (!allComplete) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [shouldStart, targets]);

  return counts;
}
