"use client";

/**
 * Mobile UX primitives for the post-question CTA family.
 *
 * Three hooks, each scoped to a single mobile-conversion concern:
 *   - useViewportGate(ref, threshold) — fires when an element crosses a
 *     visibility threshold. Used to suppress competing CTAs (sticky bar)
 *     when a primary in-page CTA is in view.
 *   - useReducedMotion() — respects prefers-reduced-motion for animation
 *     choreography.
 *   - useKeyboardOpen() — detects when the on-screen keyboard is up so we
 *     can suppress fixed-position chrome that would collide.
 *
 * No external dependencies. Each hook is independently importable.
 */

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * True when the observed element is at least `threshold` (0-1) visible in
 * the viewport. Falls back to `true` (assume visible) if IntersectionObserver
 * is unavailable — avoids hiding content on legacy browsers.
 */
export function useViewportGate(
  ref: RefObject<Element | null>,
  threshold = 0.5,
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.intersectionRatio >= threshold);
        }
      },
      { threshold: [0, threshold, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}

/**
 * True when the user prefers reduced motion. Reactive to OS-level changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/**
 * True when the on-screen keyboard is likely open. Heuristic: any input or
 * textarea inside the page is currently focused. Used to suppress fixed-
 * position chrome (sticky bars, FABs) that would collide with the keyboard.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  const lastFocusedRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    function isTypable(target: EventTarget | null): boolean {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      if (tag === "INPUT") {
        const type = (target as HTMLInputElement).type;
        return type !== "checkbox" && type !== "radio" && type !== "button" && type !== "submit";
      }
      return tag === "TEXTAREA" || target.isContentEditable;
    }

    function handleFocusIn(e: FocusEvent) {
      if (isTypable(e.target)) {
        lastFocusedRef.current = e.target;
        setOpen(true);
      }
    }
    function handleFocusOut() {
      // Use rAF so the next focus (within same form) doesn't flicker the bar
      requestAnimationFrame(() => {
        if (!isTypable(document.activeElement)) {
          lastFocusedRef.current = null;
          setOpen(false);
        }
      });
    }

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return open;
}

/**
 * Trigger a short haptic vibration on supporting devices. Safe no-op on
 * desktop and on iOS (which doesn't expose navigator.vibrate). Use sparingly
 * — only on intentful primary actions like submit.
 */
export function tapHaptic(durationMs = 10): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(durationMs);
    }
  } catch {
    // ignore — best-effort affordance
  }
}
