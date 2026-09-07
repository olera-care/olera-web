import Link from "next/link";
import {
  BUDGET_STOPS,
  BUDGET_ESTIMATE_CAVEAT,
  BUDGET_TRUST_STRIP,
  CUSTOM_SCALE_STOP,
} from "@/lib/ad-boost/estimate";

/**
 * The offer.
 *
 * Every figure is imported from lib/ad-boost/estimate.ts rather than retyped,
 * because that file is the source of truth the in-app budget step renders from
 * and a marketing page quoting a different number than the product is worse
 * than no page. Its monetization rules also bind here: flat all-in tiers named
 * by outcome, never an itemized service fee, never per-lead pricing.
 *
 * The inquiry ranges on the paid tiers are conservative industry benchmarks,
 * not our own measured rate — that is why the caveat sits directly under them
 * and is imported too.
 */
export default function Pricing() {
  const [intro, ...paid] = BUDGET_STOPS;
  const tiers = [...paid, CUSTOM_SCALE_STOP];

  return (
    <section id="pricing" className="bg-white px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-3xl font-serif text-display-sm font-bold text-gray-900 md:text-display-md">
          What it costs
        </h2>
        <p className="mt-3 max-w-2xl text-text-md text-gray-600">
          One price covering the advertising budget and the work of running it. No setup fee, no
          charge per lead, and no cut of anything you win.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* The intro is the only thing anyone is actually asked to choose. */}
          <div className="rounded-2xl border-2 border-primary-300 bg-vanilla-100 p-6 sm:p-8 lg:col-span-1">
            <div className="text-text-xs font-semibold uppercase tracking-wider text-primary-700">
              Start here
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-sans text-[2.5rem] font-semibold leading-none tracking-tight text-gray-900">
                {intro.amount}
              </span>
              <span className="text-text-md text-gray-600">{intro.sublabel}</span>
            </div>
            <h3 className="mt-4 font-serif text-text-lg font-bold text-gray-900">{intro.name}</h3>
            <p className="mt-2 text-text-sm leading-relaxed text-gray-600">{intro.blurb}</p>
            <Link
              href="/provider/boost"
              className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-text-md font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Request your free campaign
            </Link>
            <p className="mt-3 text-text-xs leading-relaxed text-gray-500">
              No card. You see what it delivered before there is any question of paying.
            </p>
          </div>

          {/* The ladder is a preview. Nobody picks a paid tier to get started. */}
          <div className="lg:col-span-2">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2">
              {tiers.map((t) => (
                <div key={t.name} className="bg-white p-5 sm:p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-text-lg font-bold text-gray-900">{t.name}</h3>
                    <div className="whitespace-nowrap">
                      <span className="font-sans text-text-xl font-semibold text-gray-900">{t.amount}</span>
                      <span className="text-text-sm text-gray-500">{t.sublabel}</span>
                    </div>
                  </div>
                  {t.kind === "leads" && (
                    <div className="mt-2 text-text-sm text-gray-500">
                      Typically {t.headline} {t.unit}
                    </div>
                  )}
                  <p className="mt-2 text-text-sm leading-relaxed text-gray-600">{t.blurb}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-text-sm leading-relaxed text-gray-500">{BUDGET_ESTIMATE_CAVEAT}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-3">
          {BUDGET_TRUST_STRIP.map((s) => (
            <div key={s.label} className="bg-white px-6 py-5">
              <div className="font-sans text-text-xl font-semibold text-gray-900">{s.value}</div>
              <div className="mt-1 text-text-sm text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 max-w-3xl text-text-sm leading-relaxed text-gray-500">
          A paid month that ends with no family inquiries at all is refunded in full. Families who
          contact you are yours, with no commission and no referral fee, and you can stop any time.
          The full terms are on the{" "}
          <Link href="/managed-ads-terms" className="text-primary-700 underline hover:text-primary-800">
            Managed Ads terms page
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
