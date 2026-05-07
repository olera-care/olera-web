"use client";

/**
 * ResultsSheet — the post-submit reveal for the SBF V3 flow.
 *
 * One component, two shells:
 *   - mode="overlay"  → bottom sheet on mobile, right-anchored side panel on
 *                        desktop. Backdrop dims/blurs the provider page
 *                        behind. Dismissable via X / Esc / backdrop click.
 *   - mode="page"     → full-viewport standalone version rendered at /m/{token}.
 *                        No backdrop, no dismiss. Identical content layout so
 *                        users who saw the overlay recognize the page.
 *
 * Design intent (per design refs Apple / Airbnb / Perena / Notion):
 *   - Editorial typography. Display font on the hero, generous spacing.
 *   - Match list is divider-separated rows, not shadowed cards.
 *   - The "Some of these may help cover services at {Provider X}" tie-in is
 *     the moment of genuine surprise — only shown when there's plausible
 *     overlap (see lib/benefits/provider-tie-in.ts).
 *   - Footer adapts to channel: "Magic link sent to {email}" vs "Text sent to {phone}".
 *
 * Behavior:
 *   - On open in overlay mode: locks body scroll, focuses the close button,
 *     restores scroll on close.
 *   - Esc dismiss; backdrop click dismiss (unless the user is mid-text-select).
 *   - Mobile bottom sheet uses sheet-up animation (300ms cubic-bezier).
 *   - Desktop side panel uses panel-in-right animation (300ms same curve).
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import type { WaiverProgram } from "@/data/waiver-library";
import { CARE_NEED_LABEL, type CareNeed } from "@/lib/benefits/match-care-need";
import { getProviderTieIn, type MatchableProvider } from "@/lib/benefits/provider-tie-in";

// Phone masking — kept inline because lib/twilio.ts top-level-imports the
// Twilio Node SDK (native deps), which webpack would try to bundle into the
// client. This 5-line helper avoids that.
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "****";
  return `+${digits.slice(0, 4)}****${digits.slice(-3)}`;
}

export interface ResultsSheetProps {
  mode: "overlay" | "page";
  /** Overlay only. Ignored in page mode. */
  isOpen?: boolean;
  /** Overlay only. Ignored in page mode. */
  onClose?: () => void;

  matches: WaiverProgram[];
  matchCount: number;
  careNeed: CareNeed;
  state: { name: string; slug: string };

  /** For the "Some of these may help cover services at X" tie-in. */
  provider?: MatchableProvider | null;
  /** Slug of the provider page they came from — used for the back-CTA. */
  providerSlug?: string | null;

  /** Channel + masked destination, drives the footer copy. */
  contactChannel?: "email" | "sms";
  contactDestination?: string | null;

  /** When true, render a soft 4-pill relationship enrichment row in the
   *  hero. Used by the empathic_single arm where relationship isn't asked
   *  pre-submit. Tap → POST /api/benefits/update-relationship to backfill
   *  the family profile. The legacy 3-step flow already captures relationship
   *  upstream and leaves this off (default false). */
  showRelationshipPills?: boolean;
  /** Session id used to find the family profile when persisting the pill
   *  selection. Required when showRelationshipPills=true. */
  sessionId?: string | null;
}

type Relationship = "my-parent" | "my-spouse" | "myself" | "other-family";
const RELATIONSHIP_PILLS: Array<{ value: Relationship; label: string }> = [
  { value: "my-parent", label: "My parent" },
  { value: "my-spouse", label: "My spouse" },
  { value: "myself", label: "Me" },
  { value: "other-family", label: "Family member" },
];

// ─── Savings parsing — converts the raw range string to a tight inline label.
function formatSavings(range?: string): string | null {
  if (!range) return null;
  const matches = range.match(/\$[\d,]+/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1];
  const isMonthly = /\bmo\b|month/i.test(range);
  const period = isMonthly ? "/mo" : "/yr";
  return `Up to ${last}${period}`;
}

function whyThisMatches(careNeed: CareNeed): string {
  switch (careNeed) {
    case "stayingAtHome":
      return "Helps with in-home care";
    case "payingForCare":
      return "Helps pay for care";
    case "memoryHealth":
      return "Helps with memory & medical care";
    case "companionship":
      return "Caregiver & social support";
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***@${domain}`;
}

export default function ResultsSheet({
  mode,
  isOpen = true,
  onClose,
  matches,
  matchCount,
  careNeed,
  state,
  provider = null,
  providerSlug = null,
  contactChannel,
  contactDestination,
  showRelationshipPills = false,
  sessionId = null,
}: ResultsSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // ─── Relationship enrichment (empathic_single arm) ──────────────────
  // Soft, skippable. Tapping a pill backfills the family profile via a
  // lightweight session-id-keyed endpoint. UI only renders when the parent
  // arm explicitly opts in via showRelationshipPills.
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [relationshipSaving, setRelationshipSaving] = useState(false);
  const handleRelationshipPick = useCallback(
    async (value: Relationship) => {
      if (!sessionId || relationshipSaving) return;
      setSelectedRelationship(value);
      setRelationshipSaving(true);
      try {
        await fetch("/api/benefits/update-relationship", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, relationship: value }),
          keepalive: true,
        });
      } catch {
        // best-effort — don't surface errors here, the lead is already captured
      } finally {
        setRelationshipSaving(false);
      }
    },
    [sessionId, relationshipSaving],
  );

  const handleClose = useCallback(() => {
    const active = document.activeElement;
    if (active && active !== document.body) (active as HTMLElement).blur();
    onCloseRef.current?.();
  }, []);

  // Esc + body-scroll lock — overlay only
  useEffect(() => {
    if (mode !== "overlay" || !isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    // Focus close button on mount for keyboard users
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const stored = parseInt(document.body.style.top || "0", 10) * -1;
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      requestAnimationFrame(() => {
        window.scrollTo({ top: stored, behavior: "instant" });
      });
    };
  }, [mode, isOpen, handleClose]);

  if (mode === "overlay" && !isOpen) return null;

  const tieIn = getProviderTieIn(matches, provider);
  const careLabel = CARE_NEED_LABEL[careNeed];
  const matchesToShow = matches.slice(0, 8);

  // Footer copy — channel-aware, uses masked destination so we don't leak
  // the full address back to the user (and screenshots/screen-shares stay clean).
  const footerLine = (() => {
    if (!contactDestination) return null;
    if (contactChannel === "sms") {
      return `Text sent to ${maskPhone(contactDestination)}`;
    }
    return `Magic link sent to ${maskEmail(contactDestination)}`;
  })();

  // ─── Content (shared between overlay and page) ───────────────────────
  const content = (
    <div className="flex h-full flex-col">
      {/* Header — close button + drag handle on mobile */}
      {mode === "overlay" && (
        <>
          {/* Mobile drag indicator (purely visual; no actual drag handler in v1) */}
          <div className="flex justify-center pt-3 pb-2 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-gray-300" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-end px-5 pt-2 pb-2 sm:pt-5">
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-5 w-5" weight="regular" />
            </button>
          </div>
        </>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 sm:px-7">
        {/* Hero — copy adapts to match count so we don't say "0 programs" */}
        <div className="pt-2 sm:pt-1">
          {matchCount > 0 ? (
            <h2 className="font-display text-[28px] leading-[1.15] tracking-tight text-gray-900 sm:text-[32px]">
              Your family may qualify for{" "}
              <span className="text-gray-900">
                {matchCount} {matchCount === 1 ? "program" : "programs"}
              </span>{" "}
              in {state.name}.
            </h2>
          ) : (
            <h2 className="font-display text-[28px] leading-[1.15] tracking-tight text-gray-900 sm:text-[32px]">
              Programs in {state.name} we can show you.
            </h2>
          )}
          <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
            Based on what you shared — <span className="text-gray-700">{careLabel}</span>.
          </p>

          {/* Soft relationship enrichment — empathic_single arm only.
              Skippable, non-blocking. Tap = backfill the family profile via
              session-id-keyed endpoint. After a tap, we collapse to a tiny
              acknowledgement so users don't feel they've been form-trapped. */}
          {showRelationshipPills && (
            <div className="mt-5">
              {selectedRelationship ? (
                <p className="text-[13px] text-gray-500">
                  Got it — saving for{" "}
                  <span className="text-gray-700">
                    {RELATIONSHIP_PILLS.find((r) => r.value === selectedRelationship)?.label.toLowerCase()}
                  </span>
                  .
                </p>
              ) : (
                <>
                  <p className="text-[13px] text-gray-500 mb-2">Quick — who is this for?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {RELATIONSHIP_PILLS.map((pill) => (
                      <button
                        key={pill.value}
                        onClick={() => handleRelationshipPick(pill.value)}
                        disabled={relationshipSaving}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Provider tie-in (only when there's plausible overlap) */}
        {tieIn && (
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <p className="text-[14px] leading-relaxed text-emerald-900">{tieIn}</p>
          </div>
        )}

        {/* Match list */}
        <div className="mt-7 sm:mt-8">
          {matchesToShow.length === 0 ? (
            <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-[14px] text-gray-500">
              We didn&apos;t find specific matches in {state.name} for that need yet.
              Browse all {state.name} programs at{" "}
              <Link href={`/benefits/${state.slug}`} className="underline underline-offset-2">
                olera.care/benefits/{state.slug}
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {matchesToShow.map((p) => {
                const savings = formatSavings(p.savingsRange);
                return (
                  <li key={p.id} className="py-5 first:pt-0">
                    <Link
                      href={`/benefits/${state.slug}/${p.id}`}
                      className="group block"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-[18px] font-semibold leading-snug text-gray-900 group-hover:text-emerald-700">
                            {p.shortName || p.name}
                          </h3>
                          {p.tagline && (
                            <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-gray-600">
                              {p.tagline}
                            </p>
                          )}
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                            <span className="text-gray-500">{whyThisMatches(careNeed)}</span>
                            {savings && (
                              <>
                                <span className="text-gray-300">·</span>
                                <span className="font-medium text-emerald-700">{savings}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ArrowUpRight
                          className="mt-1 h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:text-emerald-700"
                          weight="bold"
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer — soft persistence note + CTAs */}
        <div className="mt-10 border-t border-gray-100 pt-6">
          {footerLine && (
            <p className="text-[13px] leading-relaxed text-gray-500">{footerLine}</p>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            {mode === "overlay" && providerSlug && provider?.display_name && (
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-gray-800"
              >
                Continue exploring {provider.display_name}
                <ArrowRight className="h-4 w-4" weight="bold" />
              </button>
            )}
            {/* Plain <a>, not Next.js <Link>, so the click triggers a full
                page reload. This is the SAME workaround documented at length
                in BenefitsDiscoveryModule.tsx around the V2 5-step's save:
                /api/benefits/save-results writes Supabase session cookies via
                Set-Cookie on the POST response, but the browser's Supabase
                client SINGLETON was loaded before those cookies existed and
                a Next.js client-side nav doesn't flush it. /welcome would
                then render with user=null and stall forever in skeletons
                (the enrichedPrograms fetch is gated on user). Full reload
                kills the singleton; fresh page sees the session. */}
            <a
              href="/welcome?from=benefits"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-200 px-5 py-2.5 text-[14px] font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              See full list at olera.care
              <ArrowRight className="h-4 w-4" weight="bold" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Page mode — full viewport, no chrome ────────────────────────────
  if (mode === "page") {
    return (
      <main className="mx-auto min-h-screen max-w-2xl bg-white px-2 py-8 sm:px-6">
        <div className="rounded-3xl border border-gray-100 bg-white shadow-sm">
          {content}
        </div>
      </main>
    );
  }

  // ─── Overlay mode — portal-rendered, backdrop, animated entry ────────
  const overlay = (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Your benefit matches"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet (mobile) / Panel (desktop) */}
      <div
        className="
          relative w-full max-h-[90vh] rounded-t-3xl bg-white shadow-2xl animate-sheet-up
          sm:max-h-none sm:h-full sm:w-[min(480px,100vw)] sm:max-w-[480px] sm:rounded-none sm:rounded-l-3xl sm:animate-panel-in-right
          flex flex-col overflow-hidden
        "
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {content}
      </div>
    </div>
  );

  // SSR-safe portal — only render to body on the client
  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
