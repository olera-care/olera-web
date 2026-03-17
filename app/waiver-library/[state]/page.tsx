import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { ProgramList } from "@/components/waiver-library/ProgramList";
import { StateOutline } from "@/components/waiver-library/StateOutline";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return activeStateIds.map((id) => ({ state: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateId } = await params;
  const state = getStateById(stateId);
  if (!state || state.programs.length === 0) return {};
  const title = `${state.name} Benefits | Benefits Hub | Olera`;
  return {
    title,
    description: state.description,
    alternates: { canonical: `/waiver-library/${stateId}` },
    openGraph: {
      title,
      description: state.description,
      url: `/waiver-library/${stateId}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateId } = await params;
  const state = getStateById(stateId);

  if (!state || state.programs.length === 0) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
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
          <div className="mt-4">
            <Link
              href="/benefits/finder"
              className="inline-flex items-center justify-center px-5 py-2 bg-white text-primary-600 font-semibold text-sm rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-white/90 transition-all"
            >
              <svg
                className="mr-1.5 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Find My Savings
            </Link>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProgramList programs={state.programs} stateId={state.id} />
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white px-6 py-8 md:py-10 text-center shadow-[0_6px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/60">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
              See How Much You Could Save on Care
            </h2>
            <p className="mt-2 text-gray-500 text-base md:text-lg">
              Free, no signup required. Just a few quick questions.
            </p>
            <div className="mt-5">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-6 py-3 text-base text-white font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200"
              >
                Find My Savings
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
