import type { ReactNode } from "react";
import ReferralTargets from "./ReferralTargets";

// ── Types (shape produced by scripts/market-diagnostic/analyze-diagnostic.mjs) ──
export interface Zcta { zcta: string; population: number; seniors65plus: number; medianIncome: number | null }
export interface Leader { name: string; reviews: number; rating: number | null; distanceMiles: number | null; website: boolean; shareOfVoicePct: number }
export interface BdTarget { id: string; name: string; cat: string; referralValue: string; distanceMiles: number | null; reviews: number; rating: number | null; phone: string | null; website: string | null; address: string }
export interface MarketDiagnosticData {
  meta: { city: string; state: string; careType: string; generatedAt: string };
  demand: {
    demographics: { totals?: { population: number; seniors65plus: number }; seniorSharePct?: number; medianIncomeRange?: { min: number; max: number }; zctas?: Zcta[]; note?: string };
    olera: { familiesInCity: number; providersListed: number };
  };
  competitorLandscape: { count: number; medianReviews: number | null; medianRating: number | null; withWebsitePct: number; leaders: Leader[] };
  referralGraph: { totalViableSources: number; byRole: { cat: string; count: number }[]; prioritizedTargets: BdTarget[] };
  channels: { channel: string; priority: number; rationale: string; oleraTool: string }[];
}

const CAT_LABEL: Record<string, string> = {
  hospital: "Hospitals & ER", skilled_nursing: "Skilled nursing / rehab", hospice: "Hospice",
  assisted_living: "Assisted living", home_health: "Home health", elder_law: "Elder-law attorneys",
  senior_resource: "Senior resources", financial: "Financial advisors", faith: "Faith communities",
};
const usd = (n: number) => `$${n.toLocaleString()}`;
const usdK = (n: number) => usd(Math.round(n / 1000) * 1000).replace(",000", "k");

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#199087]">{children}</div>;
}

function Section({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-stone-200/80 pt-10 mt-10">
      <Eyebrow>{kicker}</Eyebrow>
      <h2 className="font-display text-[1.75rem] leading-tight text-stone-900 mt-1.5 mb-5">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The "Your Market" strategic layer — a provider's local client-acquisition diagnostic.
 * Presentational: receives a precomputed analysis snapshot. No data fetching here.
 */
export default function MarketDiagnostic({ data, showHeader = true, interactive = false }: { data: MarketDiagnosticData; showHeader?: boolean; interactive?: boolean }) {
  const a = data;
  const dem = a.demand.demographics;
  const totalSeniors = dem.totals?.seniors65plus ?? 0;

  // Priority areas: senior density × income (private-pay signal), campus de-weighted
  const topAreas = (dem.zctas ?? [])
    .map((z) => ({ ...z, score: z.seniors65plus * Math.min((z.medianIncome ?? 0) / 60000, 2) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 4);

  const cl = a.competitorLandscape;
  const maxRev = Math.max(...cl.leaders.map((l) => l.reviews), 1);
  const ref = a.referralGraph;

  return (
    <div className="max-w-3xl">
      {showHeader && (
        <>
          <Eyebrow>Your market · {a.meta.city}, {a.meta.state} · {a.meta.careType === "homecare" ? "Home care" : "Assisted living"}</Eyebrow>
          <h1 className="font-display text-[2.5rem] leading-[1.1] text-stone-900 mt-2">Where your next clients are</h1>
          <p className="text-stone-500 mt-3 text-[15px] leading-relaxed max-w-xl">
            A read on your local market — the demand, who you&apos;re up against, and the highest-leverage
            ways to win clients. Built from live data, not guesswork.
          </p>
        </>
      )}

      {/* Demand */}
      <Section kicker="The demand" title="The market in front of you">
        <div className="grid grid-cols-3 gap-5">
          <div>
            <div className="font-display text-[2.75rem] leading-none text-stone-900">{totalSeniors.toLocaleString()}</div>
            <div className="text-[13px] text-stone-500 mt-2">seniors (65+) in your service area</div>
          </div>
          <div>
            <div className="font-display text-[2.75rem] leading-none text-stone-900">{dem.seniorSharePct}%</div>
            <div className="text-[13px] text-stone-500 mt-2">of the local population</div>
          </div>
          <div>
            <div className="font-display text-[2.75rem] leading-none text-stone-900">
              {dem.medianIncomeRange ? `${usdK(dem.medianIncomeRange.min)}–${usdK(dem.medianIncomeRange.max)}` : "—"}
            </div>
            <div className="text-[13px] text-stone-500 mt-2">household income range by area</div>
          </div>
        </div>
        <p className="text-[13px] text-stone-400 mt-5">
          Olera currently sees {a.demand.olera.familiesInCity} families actively searching here and lists{" "}
          {a.demand.olera.providersListed} providers — a foothold we grow into qualified leads for you.
        </p>
      </Section>

      {/* Competition */}
      <Section kicker="Your competition" title={`${cl.count} agencies competing for the same families`}>
        <p className="text-[14px] text-stone-600 leading-relaxed mb-5 max-w-xl">
          Share of voice = who owns the reviews families read on Google. Market median is{" "}
          <span className="text-stone-900 font-medium">{cl.medianReviews} reviews</span> at {cl.medianRating}★.
          Reviews are the currency of local trust — and a channel you control.
        </p>
        <div className="space-y-2">
          {cl.leaders.slice(0, 8).map((l) => (
            <div key={l.name} className="flex items-center gap-3">
              <div className="w-44 truncate text-[13px] text-stone-700">{l.name}</div>
              <div className="flex-1 h-5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#199087]/85 rounded-full" style={{ width: `${(l.reviews / maxRev) * 100}%` }} />
              </div>
              <div className="w-24 text-right text-[12px] text-stone-500 tabular-nums">{l.reviews} rev · {l.rating ?? "—"}★</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Referral map */}
      <Section kicker="The unlock" title="The referral map most agencies never build">
        <p className="text-[14px] text-stone-600 leading-relaxed mb-6 max-w-xl">
          In home care, <span className="text-stone-900 font-medium">50–70% of clients come from professional referrals</span> —
          hospital discharge, rehab, hospice, assisted living, elder-law — not ads. We mapped{" "}
          <span className="text-stone-900 font-medium">{ref.totalViableSources} local sources</span>. This is the
          single highest-leverage channel, and it&apos;s one you can&apos;t assemble yourself.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-7">
          {ref.byRole.filter((r) => CAT_LABEL[r.cat]).slice(0, 6).map((r) => (
            <div key={r.cat} className="rounded-xl border border-stone-200/70 bg-white/50 px-4 py-3">
              <div className="font-display text-2xl text-stone-900">{r.count}</div>
              <div className="text-[12px] text-stone-500 mt-0.5">{CAT_LABEL[r.cat]}</div>
            </div>
          ))}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-3">
          {interactive ? "Your call sheet — work it" : "Start here — prioritized targets"}
        </div>
        <ReferralTargets targets={ref.prioritizedTargets} interactive={interactive} />
      </Section>

      {/* Where to focus */}
      <Section kicker="Where to focus" title="Not all of town is your customer">
        <p className="text-[14px] text-stone-600 leading-relaxed mb-5 max-w-xl">
          Private-pay care lives where senior density meets income. These are the areas worth your
          marketing and visit time — ranked. The campus core is dense but young; skip it.
        </p>
        <div className="space-y-2.5">
          {topAreas.map((z, i) => (
            <div key={z.zcta} className="flex items-center gap-4 rounded-xl border border-stone-200/70 bg-white/50 px-4 py-3">
              <div className="font-display text-lg text-[#199087] w-7">{i + 1}</div>
              <div className="flex-1">
                <div className="text-[15px] text-stone-900 font-medium">ZIP {z.zcta}</div>
                <div className="text-[12px] text-stone-500">{z.seniors65plus.toLocaleString()} seniors · {z.medianIncome ? usd(z.medianIncome) + " median income" : "—"}</div>
              </div>
              {z.medianIncome && z.medianIncome >= 70000 && (
                <span className="text-[11px] font-medium text-[#199087] bg-emerald-50 rounded-full px-2.5 py-1">High private-pay</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Playbook */}
      <Section kicker="The playbook" title="Where to spend your effort, in order">
        <div className="space-y-4">
          {a.channels.map((c) => (
            <div key={c.channel} className="flex gap-4">
              <div className="font-display text-2xl text-[#199087] w-8 shrink-0">{c.priority}</div>
              <div>
                <div className="text-[15px] font-medium text-stone-900">{c.channel}</div>
                <p className="text-[13px] text-stone-600 leading-relaxed mt-1">{c.rationale}</p>
                <div className="text-[12px] text-[#199087] mt-1.5">↳ Olera: {c.oleraTool}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div className="border-t border-stone-200/80 mt-12 pt-5 text-[11px] text-stone-400">
        Olera Market Intelligence · live data from Google Places, U.S. Census ACS, and Olera&apos;s demand funnel ·
        generated {new Date(a.meta.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}
