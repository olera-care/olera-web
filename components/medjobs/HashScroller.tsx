"use client";

import { useEffect } from "react";

/**
 * Reliable in-page anchor scrolling for pages that render a client island
 * above the anchored sections (e.g. the families page renders the interactive
 * FamiliesBoard before the static marketing sections that hold `#help` /
 * `#how-it-works`).
 *
 * The browser's one-shot scroll-to-hash on load fires BEFORE that island
 * hydrates and expands, so the jump lands in the wrong place (the symptom:
 * email links like `/medjobs/families#help` "didn't scroll to the section").
 *
 * This polls until the target exists, scrolls to it, then re-applies a couple
 * of corrective scrolls to counter late layout shift as the island settles.
 * It only runs on initial mount + on hashchange, so it never fights a user
 * who's already scrolling.
 */
export default function HashScroller() {
  useEffect(() => {
    let cancelled = false;

    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const id = decodeURIComponent(hash.slice(1));
      let findTries = 0;
      let corrections = 0;

      const attempt = () => {
        if (cancelled) return;
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: "start" });
          // Re-correct twice as the client island finishes expanding above us.
          if (corrections < 2) {
            corrections++;
            setTimeout(attempt, 350);
          }
        } else if (findTries < 25) {
          // Target not mounted yet — keep polling (~3s max).
          findTries++;
          setTimeout(attempt, 120);
        }
      };
      attempt();
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  return null;
}
