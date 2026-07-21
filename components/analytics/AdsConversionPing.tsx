"use client";

import { useEffect } from "react";

/**
 * Fires the Google Ads lead conversion when a lead route marks one.
 *
 * Lead-capture routes set the one-shot `olera_adconv` cookie on their response
 * (lib/ad-boost/ads-conversion.server.ts). This watcher polls for it, fires
 * the gtag conversion event, and clears the cookie — one mount point in the
 * root layout covers every inquiry flow. Attribution to the ad click is
 * Google's job via its own click cookie; we fire unconditionally and Google
 * counts only ad-attributed conversions in campaign columns.
 *
 * Polling is a plain document.cookie string check every few seconds —
 * negligible cost, and conversions are rare events.
 */

const COOKIE_NAME = "olera_adconv";
/** "Provider inquiry (lead form)" conversion in the Olera Google Ads account. */
const SEND_TO = "AW-10943251086/VIZpCMijt9QcEI6Fk-Io";
const POLL_MS = 4000;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function AdsConversionPing() {
  useEffect(() => {
    const check = () => {
      if (!document.cookie.includes(`${COOKIE_NAME}=`)) return;
      // gtag not loaded yet (blocked or still fetching): keep the cookie and
      // retry on the next tick instead of dropping the conversion.
      if (typeof window.gtag !== "function") return;
      window.gtag("event", "conversion", { send_to: SEND_TO });
      document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
    };

    check();
    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
