import type { ReactNode } from "react";
import ReferralTargets from "./ReferralTargets";
import SectionNav from "./SectionNav";
import CatchmentMapLoader from "./CatchmentMapLoader";
import { CAT_COLOR } from "./CatchmentMap";
import CountUp from "./CountUp";
import PlaybookAction from "./PlaybookAction";
import type { SelfRank } from "@/lib/market-diagnostic/self-rank";

const NAV = [
  { id: "competition", label: "Competition" },
  { id: "referral", label: "Referral map" },
  { id: "focus", label: "Where to focus" },
  { id: "playbook", label: "Playbook" },
];

// ── Types (shape produced by scripts/market-diagnostic/analyze-diagnostic.mjs) ──
export interface Zcta { zcta: string; population: number; seniors65plus: number; medianIncome: number | null }
// `id` = Google place_id. Optional: older cached diagnostics + the committed CS snapshot
// predate it and match by name instead (see youIdx fallback). New computes always carry it.
export interface Leader { id?: string; name: string; reviews: number; rating: number | null; distanceMiles: number | null; website: boolean; shareOfVoicePct: number }
export interface BdTarget { id: string; name: string; cat: string; referralValue: string; distanceMiles: number | null; reviews: number; rating: number | null; phone: string | null; website: string | null; address: string; lat: number | null; lng: number | null }
export interface MarketDiagnosticData {
  meta: { city: string; state: string; careType: string; generatedAt: string; center: { lat: number; lng: number } };
  demand: {
    demographics: { totals?: { population: number; seniors65plus: number }; seniorSharePct?: number; medianIncomeRange?: { min: number; max: number }; zctas?: Zcta[]; note?: string };
    olera: { familiesInCity: number; providersListed: number };
  };
  // `ranked` = the FULL ordered competitor list (place_id-bearing) for locating the provider at
  // any rank, incl. below the top-10 `leaders`. Optional: only present on diagnostics computed
  // after the cache-shape change; absent on older rows + the committed CS snapshot.
  competitorLandscape: { count: number; medianReviews: number | null; medianRating: number | null; withWebsitePct: number; leaders: Leader[]; ranked?: Leader[] };
  referralGraph: { totalViableSources: number; byRole: { cat: string; count: number }[]; prioritizedTargets: BdTarget[] };
  channels: { channel: string; priority: number; rationale: string; oleraTool: string; key: string }[];
}

const CAT_LABEL: Record<string, string> = {
  hospital: "Hospitals & ER", skilled_nursing: "Skilled nursing / rehab", hospice: "Hospice",
  assisted_living: "Assisted living", home_health: "Home health", elder_law: "Elder-law attorneys",
  senior_resource: "Senior resources", financial: "Financial advisors", faith: "Faith communities",
};
const usd = (n: number) => `$${n.toLocaleString()}`;
const usdK = (n: number) => usd(Math.round(n / 1000) * 1000).replace(",000", "k");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#199087]">{children}</div>;
}

function Section({ id, kicker, title, children }: { id?: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-16 scroll-mt-24">
      <Eyebrow>{kicker}</Eyebrow>
      <h2 className="font-display text-[1.75rem] leading-tight text-stone-900 mt-1.5 mb-5">{title}</h2>
      {children}
    </section>
  );
}

/** Perena-style stat card — soft, solid, gently shadowed. Numbers count up on reveal. */
function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white px-3 py-3 sm:px-5 sm:py-4 shadow-[0_1px_3px_rgba(28,25,23,0.05)]">
      <div className="font-display text-[1.35rem] sm:text-[2rem] leading-none text-stone-900">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </div>
      <div className="text-[11.5px] sm:text-[12.5px] leading-snug text-stone-500 mt-1.5 sm:mt-2">{label}</div>
    </div>
  );
}

/**
 * The "stakes" strip — three headline figures in one quiet container, split by hairlines.
 * Robinhood/Linear register: confident tabular numbers, tiny uppercase muted labels, no
 * box-in-box. Centered + overflow-hidden so a long figure can never cross a divider on mobile.
 */
function HeroStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="min-w-0 px-1.5 py-4 text-center sm:px-3">
      <div className="font-display text-[1.35rem] sm:text-[1.9rem] leading-none tracking-tight text-stone-900 tabular-nums">
        {typeof value === "number" ? <CountUp value={value} /> : value}
      </div>
      <div className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.07em] leading-tight text-stone-400">{label}</div>
    </div>
  );
}

/**
 * One competitor in the share-of-voice list: a muted rank numeral, the name over a thin
 * hairline rail, and the review count on the right. Linear/Apple-spec register — a scannable
 * ranking, not a chunky bar chart. The viewing provider's row turns teal and carries a tag.
 */
function RankRow({ rank, name, reviews, rating, maxRev, isYou = false, tag }: {
  rank: number; name: string; reviews: number; rating: number | null;
  maxRev: number; isYou?: boolean; tag?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 shrink-0 text-right text-[12.5px] tabular-nums ${isYou ? "text-[#199087] font-semibold" : "text-stone-300"}`}>{rank}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`truncate text-[13px] ${isYou ? "text-[#199087] font-semibold" : "text-stone-700"}`}>{name}</span>
          {tag}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <div
            className={`h-full rounded-full ${isYou ? "bg-[#199087]" : "bg-stone-300"}`}
            style={{ width: `${Math.min((reviews / maxRev) * 100, 100)}%` }}
          />
        </div>
      </div>
      <div className="shrink-0 text-right text-[12px] tabular-nums text-stone-500">{reviews} rev · {rating ?? "—"}★</div>
    </div>
  );
}

/**
 * The "Your Market" strategic layer — a provider's local client-acquisition diagnostic.
 * Leads with competition (the hook) with demand folded in as the stakes.
 * Presentational: receives a precomputed analysis snapshot. No data fetching here.
 */
export default function MarketDiagnostic({
  data, showHeader = true, interactive = false, providerName, self,
}: { data: MarketDiagnosticData; showHeader?: boolean; interactive?: boolean; providerName?: string; self?: SelfRank | null }) {
  const a = data;
  const dem = a.demand.demographics;
  const totalSeniors = dem.totals?.seniors65plus ?? 0;
  const cl = a.competitorLandscape;
  const ref = a.referralGraph;

  // Priority areas: senior density × income (private-pay signal), campus de-weighted
  const topAreas = (dem.zctas ?? [])
    .map((z) => ({ ...z, score: z.seniors65plus * Math.min((z.medianIncome ?? 0) / 60000, 2) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, 4);

  // "You" highlight — prefer the reliable place_id self-match. `self.rank` is the position in the
  // full ranked list, which == the index in `leaders` (leaders === ranked.slice(0,10)), so rank-1
  // is the bar to light up. Fall back to the legacy fuzzy-name match when there's no self overlay
  // (older cache rows / committed snapshot). A provider ranked below the rendered leaders, or
  // fetched-in via fetch-if-missing (matchedBy "fetched"), stays -1 here — step 3 renders their
  // row explicitly rather than highlighting a top bar.
  const youIdx = self?.matchedBy === "place_id" && self.rank
    ? self.rank - 1
    : providerName
      ? cl.leaders.findIndex((l) => { const a2 = norm(l.name), b = norm(providerName); return a2 && b && (a2.includes(b) || b.includes(a2)); })
      : -1;
  // Bar scale spans the leaders AND the provider's own count — so a fetched-in provider who
  // out-reviews everyone Google surfaced still scales correctly instead of overflowing the track.
  const maxRev = Math.max(...cl.leaders.map((l) => l.reviews), self?.reviews ?? 0, 1);
  // The provider's bar renders inline as a leader (rank ≤ 8, already highlighted) OR as an
  // explicit row below the field. Show the dedicated row whenever we have a self rank that isn't
  // already one of the highlighted top-8 bars (rank > 8, or fetched-in and absent from leaders).
  const RENDERED_LEADERS = 8;
  const youInList = youIdx >= 0 && youIdx < RENDERED_LEADERS;
  const showYouRow = !!self && !youInList;

  return (
    <div className="lg:grid lg:grid-cols-[180px_minmax(0,680px)] lg:gap-12">
      <SectionNav sections={NAV} />
      <div className="min-w-0">
      {/* ── HERO = Competition (the hook), demand folded in as the stakes ── */}
      <div id="competition" className="scroll-mt-24">
      {showHeader && (
        <Eyebrow>Your market · {a.meta.city}, {a.meta.state} · {a.meta.careType === "homecare" ? "Home care" : "Assisted living"}</Eyebrow>
      )}
      <h1 className="font-display text-[1.9rem] sm:text-[2.5rem] leading-[1.12] text-stone-900 mt-2 max-w-2xl">
        {cl.count} agencies are competing for {totalSeniors.toLocaleString()} seniors in {a.meta.city}.
      </h1>
      <p className="text-stone-500 mt-3 text-[15px] leading-relaxed max-w-xl">
        Share of voice = who owns the reviews families read on Google. It&apos;s the currency of local trust,
        and the one channel you fully control. Here&apos;s where the field stands.
      </p>

      <div className="mt-7 grid grid-cols-3 divide-x divide-stone-200/70 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_3px_rgba(28,25,23,0.05)]">
        <HeroStat value={totalSeniors.toLocaleString()} label="seniors 65+" />
        <HeroStat value={cl.count} label="agencies" />
        <HeroStat value={cl.medianReviews ?? "—"} label="median reviews" />
      </div>

      <div className="space-y-3.5 mt-7">
        {cl.leaders.slice(0, 8).map((l, i) => (
          <RankRow
            key={l.name}
            rank={i + 1}
            name={l.name}
            reviews={l.reviews}
            rating={l.rating}
            maxRev={maxRev}
            isYou={i === youIdx}
            tag={i === youIdx ? (
              <span className="shrink-0 rounded bg-[#199087] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">You</span>
            ) : undefined}
          />
        ))}

        {/* The provider's own row when they rank below the visible leaders (or were fetched-in).
            The honest "here's where you actually stand" — shown lower with an explicit rank,
            never hidden, so a #13-of-21 agency still sees themselves on their own chart. */}
        {showYouRow && self && (
          <>
            {self.rank > RENDERED_LEADERS + 1 && (
              <div className="flex justify-center text-stone-300 leading-none select-none" aria-hidden>⋯</div>
            )}
            <RankRow
              rank={self.rank}
              name="You"
              reviews={self.reviews}
              rating={self.rating}
              maxRev={maxRev}
              isYou
              tag={<span className="shrink-0 text-[11px] tabular-nums text-stone-400">of {self.outOf}</span>}
            />
          </>
        )}
      </div>

      <a
        href="/provider/reviews"
        className="group inline-flex items-center gap-2 rounded-full bg-[#199087] px-5 py-2.5 sm:px-4 sm:py-2 mt-6 text-[14px] sm:text-[13px] font-semibold text-white shadow-[0_1px_4px_rgba(25,144,135,0.3)] transition-all hover:bg-[#147a72] hover:shadow-[0_3px_10px_rgba(25,144,135,0.35)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
      >
        Request reviews to climb the ranking
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
      </a>

      {(dem.medianIncomeRange || a.demand.olera.familiesInCity > 0) && (
        <p className="text-[13px] text-stone-400 mt-5">
          {dem.medianIncomeRange && <>Household income runs {usdK(dem.medianIncomeRange.min)}–{usdK(dem.medianIncomeRange.max)} across the area. </>}
          {a.demand.olera.familiesInCity > 0 && (
            <>Olera sees {a.demand.olera.familiesInCity} {a.demand.olera.familiesInCity === 1 ? "family" : "families"} actively searching here today — a foothold we grow into qualified leads for you.</>
          )}
        </p>
      )}
      </div>{/* /competition */}

      {/* ── The unlock — referral map (the differentiated payoff) ── */}
      <Section id="referral" kicker="The unlock" title="The referral map most agencies never build">
        <p className="text-[14px] text-stone-600 leading-relaxed mb-6 max-w-xl">
          In home care, <span className="text-stone-900 font-medium">50–70% of clients come from professional referrals</span> —
          hospital discharge, rehab, hospice, assisted living, elder-law — not ads. We mapped{" "}
          <span className="text-stone-900 font-medium">{ref.totalViableSources} local sources</span>. This is the
          single highest-leverage channel, and it&apos;s one you can&apos;t assemble yourself.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-6">
          {ref.byRole.filter((r) => CAT_LABEL[r.cat]).slice(0, 6).map((r) => (
            <StatCard key={r.cat} value={r.count} label={CAT_LABEL[r.cat]} />
          ))}
        </div>

        {/* The literal map — your referral landscape */}
        <CatchmentMapLoader center={a.meta.center} targets={ref.prioritizedTargets} />
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 mb-7">
          {ref.byRole.filter((r) => CAT_LABEL[r.cat] && CAT_COLOR[r.cat]).slice(0, 6).map((r) => (
            <div key={r.cat} className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[r.cat] }} />
              {CAT_LABEL[r.cat]}
            </div>
          ))}
        </div>

        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400 mb-3">
          {interactive ? "Your call sheet — work it" : "Start here — prioritized targets"}
        </div>
        <ReferralTargets targets={ref.prioritizedTargets} interactive={interactive} providerName={providerName} city={a.meta.city} />
      </Section>

      {/* ── Where to focus — the ZIPs (tactical, absorbs income) ── */}
      <Section id="focus" kicker="Where to focus" title="Not all of town is your customer">
        <p className="text-[14px] text-stone-600 leading-relaxed mb-5 max-w-xl">
          Private-pay care lives where senior density meets income. These are the areas worth your
          marketing and visit time — ranked. The campus core is dense but young; skip it.
        </p>
        <div className="divide-y divide-stone-200/50">
          {topAreas.map((z, i) => (
            <div key={z.zcta} className="flex items-start gap-3 sm:gap-4 py-3.5">
              <div className="font-display text-lg text-stone-300 w-6 sm:w-7 shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-stone-900 font-medium">ZIP {z.zcta}</div>
                <div className="text-[12px] text-stone-500">
                  {z.seniors65plus.toLocaleString()} seniors · {z.medianIncome ? (
                    <>
                      <span className="sm:hidden">{usdK(z.medianIncome)} median</span>
                      <span className="hidden sm:inline">{usd(z.medianIncome)} median income</span>
                    </>
                  ) : "—"}
                </div>
              </div>
              {z.medianIncome && z.medianIncome >= 70000 && (
                <span className="shrink-0 mt-0.5 text-[10.5px] font-medium text-[#199087] bg-[#199087]/10 rounded-full px-2 py-0.5">High private-pay</span>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── The playbook ── */}
      <Section id="playbook" kicker="The playbook" title="Where to spend your effort, in order">
        <div className="space-y-3">
          {a.channels.map((c, i) => {
            const lead = i === 0;
            const action =
              c.key === "reviews" ? { href: "/provider/reviews" }
              : c.key === "callsheet" ? { href: "#referral" }
              : c.key === "community" ? { requestType: "community_playbook" }
              : c.key === "ads" ? { requestType: "ads_guidance" }
              : {};
            return (
              <div
                key={c.channel}
                className={`flex gap-4 rounded-2xl p-4 transition-colors ${lead ? "bg-stone-50/80" : "hover:bg-stone-50"}`}
              >
                <div className={`font-display leading-none shrink-0 w-9 ${lead ? "text-[2.25rem] text-[#199087]" : "text-[1.75rem] text-stone-300"}`}>{c.priority}</div>
                <div className="min-w-0">
                  <div className={`font-semibold text-stone-900 ${lead ? "text-[17px]" : "text-[15px]"}`}>{c.channel}</div>
                  <p className="text-[13.5px] text-stone-600 leading-relaxed mt-1">{c.rationale}</p>
                  <PlaybookAction label={c.oleraTool} city={a.meta.city} state={a.meta.state} {...action} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="border-t border-stone-200/80 mt-12 pt-5 text-[11px] text-stone-400">
        Olera Market Intelligence · live data from Google Places, U.S. Census ACS, and Olera&apos;s demand funnel ·
        generated {new Date(a.meta.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
      </div>{/* /content */}
    </div>
  );
}
