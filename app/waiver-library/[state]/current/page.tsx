import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { ProgramList } from "@/components/waiver-library/ProgramList";
import { StateOutline } from "@/components/waiver-library/StateOutline";

/**
 * Legacy state page — always renders the old (pre-v2) version.
 * Used by admin dashboard "Preview current" link for comparison.
 * Not indexed by search engines (noindex).
 */

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return activeStateIds.map((id) => ({ state: id }));
}

export async function generateMetadata() {
  return { robots: { index: false, follow: false } };
}

export default async function LegacyStatePage({ params }: Props) {
  const { state: stateId } = await params;
  const state = getStateById(stateId);

  if (!state || state.programs.length === 0) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Banner: this is the old version */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <p className="text-xs text-amber-700">
          Legacy view — <Link href={`/waiver-library/${stateId}`} className="underline font-medium">see v2 page</Link>
        </p>
      </div>

      <section className="relative bg-primary-800 text-white overflow-hidden">
        <StateOutline stateId={state.id} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            {state.name} Benefits
          </h1>
          <p className="mt-1.5 text-xl md:text-2xl font-semibold text-white">
            Saving families up to {(() => {
              const maxSavings = Math.max(
                ...state.programs.map((p) => {
                  const match = p.savingsRange.match(/\$[\d,]+/g);
                  if (!match) return 0;
                  const last = match[match.length - 1];
                  return parseInt(last.replace(/[$,]/g, ""), 10);
                })
              );
              return `$${maxSavings.toLocaleString("en-US")}`;
            })()} a year
          </p>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProgramList programs={state.programs} stateId={state.id} />
        </div>
      </section>
    </div>
  );
}
