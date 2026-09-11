"use client";

import Link from "next/link";
import { useBoostState } from "@/hooks/useBoostState";

/**
 * Where a running campaign stands, on the dashboard.
 *
 * THE GAP THIS FILLS. A provider mid-flight sees nothing about the ads they are
 * paying for anywhere on /provider. The two ad surfaces the dashboard already
 * has -- PostEditAdsNudge and ContextualAdsNudge -- are both pitches to buy,
 * and the contextual one correctly suppresses itself once a flight is active.
 * So the moment a provider actually becomes a customer, the dashboard goes
 * silent about it. The results live at /provider/boost and nothing points there.
 *
 * WHY IT DOES NOT USE `wrapupReady`. That flag gates the featured payment ask,
 * and it requires the wrap-up email to have been sent or three delivered leads.
 * At this product's lead volume almost nobody clears three, so in practice it
 * only turns true after a flight ENDS -- which is exactly the window this card
 * exists to cover. Eight live campaigns currently satisfy no results view at
 * all. Reusing that gate would inherit a condition about billing readiness for
 * a question about whether results exist.
 *
 * ONE SOURCE OF TRUTH. Every number here comes from the same
 * `/api/provider/ad-boost/request` payload that /provider/boost renders, so the
 * card and the full receipt can never disagree. This is a condensed view of
 * that data, never a second calculation of it.
 *
 * MOUNT IT BEHIND `hasActiveBoostRequest`. This component fetches on mount, and
 * that endpoint runs an eligibility lookup plus a demand-signal count -- not
 * something to put on every dashboard load for every provider when almost none
 * of them have a campaign. DashboardPage already knows who does.
 *
 * KNOWN GAP: `hasActiveBoostRequest` covers pending_profile / requested /
 * scheduled / live but NOT `ended`, so a finished flight does not mount the
 * card on a fresh page load. The live window is what this was built for and an
 * ended flight already has the wrap-up view; closing the gap properly needs a
 * flag on the dashboard payload that knows about ended campaigns, rather than
 * an unconditional fetch here.
 */

/** Compact two-tone dot strip. Same idea as the receipt, sized for a card. */
function MiniDots({ shown, clicked }: { shown: number; clicked: number }) {
  const perRow = 40;
  const gap = 7.2;
  const cap = 120;
  const scale = shown > cap ? Math.ceil(shown / cap) : 1;
  const total = Math.ceil(shown / scale);
  const lit = Math.min(total, Math.ceil(clicked / scale));
  const rows = Math.max(1, Math.ceil(total / perRow));
  const perRowBalanced = Math.ceil(total / rows);

  return (
    <svg
      viewBox={`0 0 ${perRowBalanced * gap + 4} ${rows * gap + 3}`}
      className="mt-3 block w-full h-auto"
      aria-hidden="true"
    >
      {Array.from({ length: total }, (_, i) => (
        <circle
          key={i}
          cx={3 + (i % perRowBalanced) * gap}
          cy={4 + Math.floor(i / perRowBalanced) * gap}
          // The lit ones are drawn last in reading order so they read as the
          // survivors of the crowd rather than a separate group.
          r={i < lit ? 2.4 : 1.8}
          fill={i < lit ? "#B57F1E" : "#DED8CC"}
        />
      ))}
    </svg>
  );
}

export default function LiveCampaignCard() {
  const state = useBoostState();
  const request = state?.request;
  const status = request?.status;

  // Only a flight that actually ran. `requested` / `scheduled` have nothing to
  // report and would render an empty promise.
  if (!state || !request || (status !== "live" && status !== "ended")) return null;

  const google = state.receipt?.google;
  const engagement = state.receipt?.engagement;
  const shown = google?.impressions ?? 0;
  const clicked = google?.clicks ?? 0;
  const spendCents = google?.spendCents ?? null;
  const saves = engagement?.saves ?? 0;
  const questions = engagement?.questionsReceived ?? 0;
  const leads = state.campaignStats?.leads ?? 0;
  const live = status === "live";

  // Lead with the strongest true thing, in the tense the flight is in.
  const headline =
    leads > 0
      ? `${leads} ${leads === 1 ? "family has" : "families have"} reached out.`
      : shown > 0
        ? live
          ? `${shown.toLocaleString()} families have seen your ad.`
          : `Your ad reached ${shown.toLocaleString()} families.`
        : live
          ? "Your campaign is running."
          : "Your campaign has finished.";

  const facts: string[] = [];
  if (spendCents != null) facts.push(`$${(spendCents / 100).toFixed(2)} spent`);
  if (clicked > 0) facts.push(`${clicked} clicked through`);
  if (saves > 0) facts.push(`${saves} saved you`);
  if (questions > 0) facts.push(`${questions} asked a question`);

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
      <div className="flex items-center gap-2">
        {live && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden="true" />
        )}
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Find Families · {live ? "running now" : "finished"}
        </p>
      </div>

      <p className="mt-2 font-display text-[19px] leading-snug font-bold text-gray-900">
        {headline}
      </p>

      {shown > 0 && <MiniDots shown={shown} clicked={clicked} />}

      {facts.length > 0 && (
        <p className="mt-3 text-[13px] text-gray-500">{facts.join(" · ")}</p>
      )}

      {/* Numbers with no ad figures behind them mean the flight is too young to
          have any, not that nothing happened. Say which. */}
      {shown === 0 && (
        <p className="mt-2 text-[13px] text-gray-500">
          Numbers land here as families start seeing your ad.
        </p>
      )}

      <Link
        href="/provider/boost"
        className="mt-4 inline-block text-[14px] font-medium text-primary-600 hover:underline"
      >
        {live ? "See the full picture →" : "See what it bought →"}
      </Link>
    </div>
  );
}
