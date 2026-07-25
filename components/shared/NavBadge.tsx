"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Nav count pill that pops once when the number rises above what this browser
 * last saw for that surface.
 *
 * Why persisted "last seen" rather than an in-render previous value: the menus
 * these badges live in (the desktop user dropdown, the mobile drawer, the More
 * sheet) are conditionally rendered, so the badge mounts fresh on every open.
 * An in-memory comparison would either never fire (count already settled by the
 * time the menu opens) or fire on every single open, which trains providers to
 * read the motion as "loading" instead of "new".
 *
 * Comparing against a localStorage high-water mark means the pop fires exactly
 * when something genuinely arrived since the provider last looked, and stays
 * silent otherwise. No manufactured delay, no withheld counts.
 *
 * Pass no `seenKey` to render a plain static pill (current behavior).
 */

const SEEN_KEY_PREFIX = "olera_badge_seen_";
const POP_DURATION_MS = 340;
/** No mark stored yet for this surface — record a baseline, never pop. */
const NEVER_SEEN = -1;

// These badges only ever render inside client-opened menus, but use the
// isomorphic form so the component stays safe if it's reused somewhere that
// server-renders. Layout effect (not passive) so the animation class is applied
// before paint — otherwise the pill paints once at full size and then jumps
// back down to start the keyframes.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function readSeen(key: string): number | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY_PREFIX + key);
    if (raw === null) return null;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSeen(key: string, value: number): void {
  try {
    localStorage.setItem(SEEN_KEY_PREFIX + key, String(value));
  } catch {
    /* localStorage unavailable */
  }
}

interface NavBadgeProps {
  count: number;
  /**
   * Stable per-surface, per-profile key (e.g. `qna:<profileId>`). Omit or pass
   * null to render static. Must include the profile id so providers with more
   * than one profile don't share a high-water mark.
   */
  seenKey?: string | null;
  /** Full pill styling — kept at the call site so each nav keeps its own sizing. */
  className: string;
  /** Show `N+` above this value. Omit for no cap. */
  maxDisplay?: number;
}

export default function NavBadge({ count, seenKey, className, maxDisplay }: NavBadgeProps) {
  const [pop, setPop] = useState(false);
  const baselineRef = useRef<{ key: string; value: number } | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!seenKey) return;

    // Read the stored mark ONCE per mount+key and pin it for this mount. Two
    // things break if we re-read it on every run:
    //
    // 1. React Strict Mode double-invokes effects in dev. Run 1 writes the new
    //    count; run 2 would then read back what run 1 just wrote, see no
    //    increase, and cancel the pop — so the animation would never appear
    //    while developing, only in prod.
    // 2. These counts start at 0 before the hook's fetch lands. Re-reading
    //    would take that 0 as the comparison point and pop on arrival even when
    //    nothing is actually new.
    if (!baselineRef.current || baselineRef.current.key !== seenKey) {
      baselineRef.current = { key: seenKey, value: readSeen(seenKey) ?? NEVER_SEEN };
    }
    const baseline = baselineRef.current.value;

    // Record every observed count, including zero. A provider clearing their
    // queue is the normal path, and if the mark doesn't come back down with
    // them then later arrivals stay below the old high-water mark and never pop
    // again.
    writeSeen(seenKey, count);

    // NEVER_SEEN: first time we've tracked this surface. Record the baseline
    // silently so the first load after ship doesn't pop every badge at once.
    // count <= baseline: nothing arrived since they last looked.
    if (baseline === NEVER_SEEN || count <= baseline) {
      setPop(false);
      return;
    }

    setPop(true);
    const timer = setTimeout(() => setPop(false), POP_DURATION_MS);
    return () => clearTimeout(timer);
  }, [count, seenKey]);

  if (count <= 0) return null;

  const label =
    maxDisplay !== undefined && count > maxDisplay ? `${maxDisplay}+` : String(count);

  return (
    <span
      className={`${className}${pop ? " animate-badgePop motion-reduce:animate-none" : ""}`}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  );
}
