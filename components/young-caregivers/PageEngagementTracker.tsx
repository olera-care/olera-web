"use client";

import { useEffect, useRef } from "react";

const PAGE = "/caregiver-support/young-caregivers";

function getSessionId(): string {
  const key = "olera_yc_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

function fire(event_type: string, metadata: Record<string, unknown> = {}) {
  fetch("/api/activity/track-page-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      page: PAGE,
      event_type,
      session_id: getSessionId(),
      metadata: {
        ...metadata,
        referrer: document.referrer || null,
      },
    }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Tracks page view, scroll depth milestones, section visibility,
 * and time on page for the Young Caregivers page.
 *
 * Sections are identified by data-section attributes on elements.
 */
export default function PageEngagementTracker() {
  const firedScrollRef = useRef(new Set<number>());
  const firedSectionsRef = useRef(new Set<string>());
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    // Page view (once per session visit)
    fire("page_view");

    // --- Scroll depth tracking ---
    const milestones = [25, 50, 75, 100];

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const m of milestones) {
        if (pct >= m && !firedScrollRef.current.has(m)) {
          firedScrollRef.current.add(m);
          fire("scroll_depth", { depth: m });
        }
      }
    };

    // --- Section visibility tracking ---
    const sectionElements = document.querySelectorAll("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const name = (entry.target as HTMLElement).dataset.section;
            if (name && !firedSectionsRef.current.has(name)) {
              firedSectionsRef.current.add(name);
              fire("section_visible", { section: name });
            }
          }
        }
      },
      { threshold: 0.3 }
    );

    sectionElements.forEach((el) => observer.observe(el));

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Fire once in case page is short enough to not need scrolling
    handleScroll();

    // --- Time on page (fires on unload) ---
    const handleUnload = () => {
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000);
      fire("time_on_page", { seconds });
    };

    // visibilitychange is more reliable than beforeunload on mobile
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        handleUnload();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleUnload);
      observer.disconnect();
    };
  }, []);

  return null;
}
