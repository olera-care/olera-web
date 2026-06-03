"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 → value (easeOutCubic) the first time it scrolls
 * into view. Respects prefers-reduced-motion (snaps to the final value).
 */
export default function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(value); return; }

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setN(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (el && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) { run(); obs.disconnect(); } },
        { threshold: 0.3 },
      );
      obs.observe(el);
      return () => obs.disconnect();
    }
    run();
  }, [value, duration]);

  return <span ref={ref}>{n.toLocaleString()}</span>;
}
