import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
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
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: state.name },
            ]}
          />
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-white">
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
          <span className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide bg-white/15 text-primary-200 px-3 py-1 rounded-full">
            {state.programs.length} program{state.programs.length !== 1 ? "s" : ""} available
          </span>
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
              Check My Benefits
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
          <div className="bg-primary-800 rounded-2xl py-10 md:py-12 px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-serif">
              Don&apos;t know what you qualify for?
            </h2>
            <p className="mt-2 text-primary-200 text-sm md:text-base">
              Answer a few quick questions and we&apos;ll show you every program available to you.
            </p>
            <div className="mt-5">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-900 font-semibold rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-primary-50 transition-all"
              >
                Check My Benefits
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
