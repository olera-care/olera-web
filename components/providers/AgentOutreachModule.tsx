"use client";

/**
 * AgentOutreachModule — H1 demand-test surface for the agent-callable bet.
 *
 * Renders for the 25% of provider-page visitors assigned to the "outreach"
 * arm of the SBF intake A/B test (lib/analytics/variant.ts → assignIntakeVariant
 * → mod 4). For these visitors, BenefitsDiscoveryModule is hidden and this
 * module renders in the Q&A area instead.
 *
 * The pitch: "Have an AI agent contact the top providers in [city] for you."
 * Visual proof = 3 mini cards of real same-city + same-category providers
 * (server-rendered via lib/agent-outreach-providers.ts). Family submits
 * email → POST /api/outreach/request → Slack alert → TJ does the outreach
 * manually with Claude Code (24h SLA, Wizard of Oz).
 *
 * Spec: plans/agent-outreach-cta-workbook.md → "Olera-hosted outreach module
 * for H1". Decision rule: ≥6% email-capture rate vs 3% baseline = greenlight
 * Phase 4 build.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Spinner, Star } from "@phosphor-icons/react";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import type { ProviderCardData } from "@/lib/types/provider";

interface RecentQuestion {
  id: string;
  text: string;
}

interface AgentOutreachModuleProps {
  sourceProviderId: string;
  sourceProviderName: string;
  city: string;
  state: string;
  category: string;
  topProviders: ProviderCardData[];
  /** Question the family just asked on this page, if any. Used to enrich
   *  the Slack fulfillment alert with the real ask. Optional because the
   *  module is always visible on the Q&A surface; some visitors arrive
   *  without asking a question first. */
  recentQuestion?: RecentQuestion | null;
}

async function fireSeekerEvent(
  eventType: "outreach_module_impression" | "outreach_card_clicked" | "outreach_request_submitted",
  metadata: Record<string, unknown>,
) {
  try {
    await fetch("/api/activity/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actor_type: "family",
        event_type: eventType,
        metadata,
      }),
    });
  } catch {
    // Non-critical telemetry; never block UX on a missed event.
  }
}

export default function AgentOutreachModule({
  sourceProviderId,
  sourceProviderName,
  city,
  state,
  category,
  topProviders,
  recentQuestion,
}: AgentOutreachModuleProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const impressionFiredRef = useRef(false);
  const sessionIdRef = useRef<string>("");

  // Fire impression once on mount. Guarded to survive React strict-mode
  // double-mount in dev so we don't double-count.
  useEffect(() => {
    if (impressionFiredRef.current) return;
    impressionFiredRef.current = true;
    sessionIdRef.current = getOrCreateSessionId();
    void fireSeekerEvent("outreach_module_impression", {
      session_id: sessionIdRef.current,
      source_provider_id: sourceProviderId,
      source_provider_name: sourceProviderName,
      city,
      state,
      category,
      target_provider_ids: topProviders.map((p) => p.id),
      target_provider_count: topProviders.length,
    });
  }, [sourceProviderId, sourceProviderName, city, state, category, topProviders]);

  function handleCardClick(card: ProviderCardData) {
    void fireSeekerEvent("outreach_card_clicked", {
      session_id: sessionIdRef.current,
      source_provider_id: sourceProviderId,
      target_provider_id: card.id,
      target_provider_name: card.name,
      city,
      state,
      category,
    });
    router.push(`/provider/${card.slug}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || submitted) return;

    // Honeypot: bots fill hidden fields. Pretend success and bail silently —
    // never reveal the filter to the bot population.
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email so we can send updates.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/outreach/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asker_email: trimmed,
          source_provider_id: sourceProviderId,
          source_provider_name: sourceProviderName,
          city,
          state,
          category,
          target_providers: topProviders.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            address: p.address,
          })),
          question_id: recentQuestion?.id ?? null,
          question_text: recentQuestion?.text ?? null,
          session_id: sessionIdRef.current,
          honeypot: "", // server checks separately; defensive parity
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error === "rate_limited"
          ? "You've already submitted a few of these. We'll be in touch shortly."
          : "Couldn't send right now. Try again in a moment.";
        setError(msg);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      setSubmitting(false);
      // Note: we don't fire outreach_request_submitted from the client. The
      // route at /api/outreach/request already inserts that seeker_activity
      // event server-side as part of the submission flow. Firing here too
      // would duplicate the row for every successful submit.
    } catch {
      setError("Couldn't send right now. Try again in a moment.");
      setSubmitting(false);
    }
  }

  // Caller handles the "no candidates" case; if topProviders is empty we
  // still render nothing as belt-and-suspenders — the H2 promises 3 cards.
  if (topProviders.length === 0) return null;

  if (skipped) return null;

  const cardCountWord = topProviders.length === 1 ? "this" : `these ${topProviders.length}`;

  return (
    <section
      id="agent-outreach"
      className="mt-6 bg-cream-50 border border-cream-200 rounded-2xl p-6 md:p-8"
      data-arm="outreach"
    >
      {!submitted && (
        <>
          <div className="max-w-xl">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 leading-tight">
              Have an AI agent contact the top providers in {city} for you
            </h2>
            <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
              We'll get pricing, intake, and availability from {cardCountWord} providers. No phone calls.
            </p>
          </div>

          <div className="mt-5 -mx-6 md:-mx-8 px-6 md:px-8 overflow-x-auto">
            <ul className="flex gap-3 snap-x snap-mandatory pb-2">
              {topProviders.map((card) => (
                <li key={card.id} className="snap-start shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCardClick(card)}
                    className="block w-[160px] text-left rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition overflow-hidden"
                    aria-label={`View ${card.name}`}
                  >
                    <div className="relative w-full aspect-[4/3] bg-slate-100">
                      <Image
                        src={card.image}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover"
                        onError={(e) => {
                          if (card.fallbackImage && e.currentTarget.src !== card.fallbackImage) {
                            (e.currentTarget as HTMLImageElement).src = card.fallbackImage;
                          }
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                        {card.name}
                      </h3>
                      {card.rating > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                          <Star size={12} weight="fill" className="text-amber-500" />
                          <span>{card.rating.toFixed(1)}</span>
                          {typeof card.reviewCount === "number" && card.reviewCount > 0 && (
                            <span className="text-slate-400">({card.reviewCount})</span>
                          )}
                        </div>
                      )}
                      {card.highlights[0] && (
                        <span className="mt-2 inline-block text-[10px] font-medium uppercase tracking-wide text-slate-700 bg-slate-100 rounded-full px-2 py-0.5">
                          {card.highlights[0]}
                        </span>
                      )}
                      <p className="mt-2 text-xs text-slate-500 truncate">{card.address}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="sr-only" htmlFor="agent-outreach-email">Your email</label>
              <input
                id="agent-outreach-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                disabled={submitting}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-60"
              />
              {/* Honeypot — visually hidden, accessibility-skipped. Bots fill it; humans don't. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="absolute -left-[9999px] w-px h-px opacity-0"
              />
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 px-4 py-2.5 text-sm font-medium text-white transition"
              >
                {submitting ? (
                  <>
                    <Spinner size={14} className="animate-spin" />
                    Sending
                  </>
                ) : (
                  "Send the agent"
                )}
              </button>
            </div>
            {error && (
              <p role="alert" className="text-xs text-red-600">
                {error}
              </p>
            )}
            <p className="text-[11px] text-slate-500">
              We'll only use your email to send the outreach summary. No spam.
            </p>
          </form>
        </>
      )}

      {submitted && (
        <div className="flex flex-col gap-2">
          <h3 className="text-lg md:text-xl font-semibold text-slate-900">
            Got it. We'll reach out within 24 hours.
          </h3>
          <p className="text-sm text-slate-600">
            We're contacting these {topProviders.length} providers and will email you back with pricing, intake requirements, and availability.
          </p>
          <button
            type="button"
            onClick={() => setSkipped(true)}
            className="self-start mt-2 text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}
    </section>
  );
}
