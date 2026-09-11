import Link from "next/link";
import { loadAdBoostEligibility } from "@/lib/ad-boost/eligibility.server";
import { getProviderFlightFunnels } from "@/lib/ad-boost/flight-funnel.server";
import FlightFunnelCard from "@/components/provider/FlightFunnel";

/**
 * What a provider's ad money actually did.
 *
 * `/provider/boost` is where a provider BUYS a flight. This is where they see
 * what one did -- deliberately a sibling rather than a section of that page,
 * because the two answer different questions and the sales page is already 1,300
 * lines.
 *
 * NOT REMOVED WHEN A FLIGHT ENDS. An ended flight is the renewal conversation,
 * and it is the only moment where evidence for spending again exists. Hiding it
 * would mean that conversation happens with nothing in the room, which is where
 * Ad Boost has been all along. What changes is the tense, handled in the card.
 */

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Your campaign results | Olera",
  robots: { index: false, follow: false },
};

export default async function BoostResultsPage() {
  const elig = await loadAdBoostEligibility();

  if (!elig.ok) {
    return (
      <main className="mx-auto max-w-[720px] px-5 py-16">
        <h1 className="font-serif text-[28px] font-normal text-gray-900">Sign in to see your results</h1>
        <p className="mt-3 text-[15px] text-gray-600">
          Your campaign results are private to your account.
        </p>
        <Link href="/provider/boost" className="mt-6 inline-block text-[15px] font-medium text-primary-600">
          Back to Find Families
        </Link>
      </main>
    );
  }

  let flights = [] as Awaited<ReturnType<typeof getProviderFlightFunnels>>;
  let failed = false;
  try {
    flights = await getProviderFlightFunnels(elig.profileId);
  } catch {
    failed = true;
  }

  // A flight with no campaign_tag was never launched; there is nothing to show
  // and a zeroed funnel would imply it ran and failed.
  const launched = flights.filter((f) => f.status !== "requested");

  return (
    <main className="mx-auto max-w-[720px] px-5 py-12 sm:py-16">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-gray-400">
        Find Families
      </div>
      <h1 className="mt-3 font-serif text-[30px] sm:text-[36px] font-normal leading-[1.1] text-gray-900">
        What your ads did
      </h1>

      {failed && (
        <p className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-[14px] text-gray-600">
          We couldn&apos;t load your results just now. Try again in a minute.
        </p>
      )}

      {!failed && launched.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-6 text-[14.5px] text-gray-600">
          You haven&apos;t run a campaign yet. When you do, this is where you&apos;ll watch it work —
          who saw your ad, who came to your page, and who got in touch.
          <div className="mt-4">
            <Link href="/provider/boost" className="font-medium text-primary-600">
              See how Find Families works →
            </Link>
          </div>
        </div>
      )}

      {launched.length > 0 && (
        <div className="mt-8 flex flex-col gap-6">
          {launched.map((f) => (
            <FlightFunnelCard key={f.campaignTag} flight={f} />
          ))}
        </div>
      )}

      {launched.length > 0 && (
        <div className="mt-10 border-t border-gray-200 pt-6">
          <Link href="/provider/boost" className="text-[15px] font-medium text-primary-600">
            Run another flight →
          </Link>
          <p className="mt-2 text-[13px] text-gray-500">
            Adding photos and answering open questions first usually costs nothing and changes the result.
          </p>
        </div>
      )}
    </main>
  );
}
