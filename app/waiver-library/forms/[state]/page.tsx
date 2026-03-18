import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, activeStateIds } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { StateFormsList } from "@/components/waiver-library/StateFormsList";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return activeStateIds.map((id) => ({ state: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateId } = await params;
  const state = getStateById(stateId);
  if (!state) return {};
  const title = `${state.name} Forms & Documents | Benefits Hub | Olera`;
  const description = `Download all Medicaid waiver application forms and documents for ${state.name}.`;
  return {
    title,
    description,
    alternates: { canonical: `/waiver-library/forms/${stateId}` },
    openGraph: {
      title,
      description,
      url: `/waiver-library/forms/${stateId}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function StateFormsPage({ params }: Props) {
  const { state: stateId } = await params;
  const state = getStateById(stateId);

  if (!state) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Sticky teal hero header */}
      <section className="bg-primary-800 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: state.name, href: `/waiver-library/${state.id}` },
              { label: "Forms & Documents" },
            ]}
          />
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white">
            {state.name} Forms &amp; Documents
          </h1>
          <p className="mt-1 text-sm text-primary-200">
            {state.programs.length} program{state.programs.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </section>

      {/* Searchable program forms list */}
      <section className="py-4 md:py-5 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StateFormsList programs={state.programs} stateId={state.id} />
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-800 rounded-2xl py-10 md:py-12 px-6 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white font-serif">
              Not sure where to start?
            </h2>
            <p className="mt-2 text-primary-200 text-sm md:text-base">
              Answer a few quick questions and we&apos;ll match you with the right programs and forms.
            </p>
            <div className="mt-5">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-primary-900 font-semibold rounded-xl shadow-lg shadow-black/20 hover:shadow-xl hover:bg-primary-50 transition-all"
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
