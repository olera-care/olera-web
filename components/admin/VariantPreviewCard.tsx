"use client";

/**
 * Static preview of an A/B variant for the Family Intake admin drill-in.
 *
 * Renders a non-interactive snapshot of what each arm looks like to a
 * visitor. Three benefits arms (availability / loss / empathic) differ
 * only in H2/sub copy — the care-need cards and downstream are
 * identical. The outreach arm is a structurally different module (AI-
 * agent CTA), so it gets its own rendering branch.
 *
 * Why static instead of importing the live module: the live components
 * carry tracking effects, session-id state, and event firing that don't
 * belong inside an admin dashboard. This rendering uses the same copy
 * strings (lib/analytics/variant-copy.ts) so changes to those strings
 * update both surfaces — but the visual treatment is intentionally
 * simplified ("good enough to remember what the variant looks like").
 */

import { Coin, House, Brain, HandHeart } from "@phosphor-icons/react";
import {
  BENEFITS_VARIANT_COPY,
  OUTREACH_VARIANT_COPY,
  CARE_NEED_LABELS,
} from "@/lib/analytics/variant-copy";
import type { IntakeVariant } from "@/lib/analytics/variant";

const CARE_NEED_ICONS = [Coin, House, Brain, HandHeart];

// Placeholders used in the preview's templated copy. Live mounts pass
// the user's real state / city; the admin preview substitutes generic
// stand-ins so the H2 always reads naturally.
const PREVIEW_STATE = "Texas";
const PREVIEW_CITY = "Austin";

export default function VariantPreviewCard({ variant }: { variant: IntakeVariant | "control" | "money_loss" }) {
  // Legacy V2 arms have no live preview — they shipped with the old 5-step
  // form which was deleted. Show a small note so the drill-in panel
  // doesn't render an empty box.
  if (variant === "control" || variant === "money_loss") {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Legacy V2
        </div>
        <p className="text-sm text-gray-600">
          The {variant === "control" ? "control" : "money_loss"} arm shipped with the old 5-step form, which was retired at the V3 cutover. No live preview available — historical data only.
        </p>
      </div>
    );
  }

  if (variant === "qa_email_capture") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          What &ldquo;{variant}&rdquo; looks like to families
        </div>
        <h3 className="font-display text-xl font-bold text-gray-900 leading-tight mt-2">
          No benefits module. Q&A is the surface.
        </h3>
        <p className="mt-2 text-sm text-gray-700">
          The 20% of provider-page visitors in this arm see no SBF and no
          outreach module. The Q&A section&apos;s post-submit guest enrichment
          is forced ON with an upgraded value-promise (&ldquo;we&apos;ll email
          you when [Provider] replies — and send 3 similar providers in [City]
          in case they don&apos;t reply fast&rdquo;). The confirmation email
          delivers on that promise with real similar-provider cards.
        </p>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
            Funnel stages
          </div>
          <div className="text-[13px] text-gray-700">
            <span className="font-semibold">Impressions</span> = QASectionV2 mounts in arm &middot;{" "}
            <span className="font-semibold">Saved</span> = post-question email enriched. No middle stage.
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          No live SBF or outreach card preview — the arm hides those entirely.
        </p>
      </div>
    );
  }

  if (variant === "outreach") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-6">
        <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          What "{variant}" looks like to families
        </div>
        <h3 className="font-display text-xl font-bold text-gray-900 leading-tight mt-2">
          {OUTREACH_VARIANT_COPY.h2()}
        </h3>
        <p className="mt-2 text-sm text-gray-700">
          {OUTREACH_VARIANT_COPY.sub(PREVIEW_CITY)}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"
            >
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Top provider {i}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled
          className="mt-4 w-full rounded-lg bg-gray-900 text-white text-sm font-medium py-2.5 cursor-not-allowed opacity-90"
        >
          Have an AI agent contact them →
        </button>
        <p className="text-[11px] text-gray-400 mt-3 italic">
          Renders on the Q&A surface, not the embedded form.
        </p>
      </div>
    );
  }

  // Benefits arms (availability / loss / empathic) — identical structure,
  // copy varies only on H2 + sub.
  const copy = BENEFITS_VARIANT_COPY[variant];
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-6">
      <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
        What "{variant}" looks like to families
      </div>
      <h3 className="font-display text-xl font-bold text-gray-900 leading-tight mt-2">
        {copy.h2(PREVIEW_STATE)}
      </h3>
      <p className="mt-2 text-sm text-gray-700">{copy.sub(PREVIEW_STATE)}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {CARE_NEED_LABELS.map((opt, i) => {
          const Icon = CARE_NEED_ICONS[i];
          return (
            <div
              key={opt.label}
              className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
            >
              <Icon size={18} weight="duotone" className="text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{opt.label}</div>
                <div className="text-[11px] text-gray-500 truncate">{opt.description}</div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-3 italic">
        Step 1 of the 2-step embedded form. Step 2 collects email + relationship.
      </p>
    </div>
  );
}
