import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStateById, getProgramById } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";
import { TX_NEW_TO_OLD, TX_OLD_TO_NEW } from "@/lib/texas-slug-map";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.values(TX_OLD_TO_NEW).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) return {};
  const program = getProgramById("texas", oldId);
  if (!program) return {};
  const title = `${program.name} Forms 2026 — Download Application & Referral Forms | Olera`;
  const description = `Download the ${program.forms.map(f => f.name).join(" and ")} for ${program.name} in Texas. Free PDF downloads with step-by-step submission instructions.`;
  return {
    title,
    description,
    alternates: { canonical: `/texas/benefits/${slug}/forms` },
    openGraph: {
      title,
      description,
      url: `/texas/benefits/${slug}/forms`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function TexasFormsPage({ params }: Props) {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) notFound();

  const state = getStateById("texas");
  const program = getProgramById("texas", oldId);

  if (!state || !program) {
    notFound();
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      <section className="bg-primary-800 text-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <Breadcrumb
            variant="dark"
            items={[
              { label: "Benefits Hub", href: "/waiver-library" },
              { label: "Texas", href: "/texas/benefits" },
              { label: program.shortName, href: `/texas/benefits/${slug}` },
              { label: "Document Checklist", href: `/texas/benefits/${slug}/checklist` },
              { label: "Application Forms", current: true },
            ]}
          />
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white">
            {program.name} Forms 2026
          </h1>
          <div className="mt-3 inline-block bg-primary-700/50 rounded-xl px-4 py-3 max-w-3xl">
            <p className="text-sm text-primary-100 leading-relaxed">
              Download the {program.forms.length} form{program.forms.length !== 1 ? "s" : ""} required to apply for {program.name} in Texas. All forms are free and can be submitted online, by mail, or in person at your local Health and Human Services office.
            </p>
          </div>
        </div>
      </section>

      <section className="py-4 md:py-5 bg-vanilla-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="text-lg font-bold text-gray-900">{program.name}</h2>
              <Link
                href={`/texas/benefits/${slug}`}
                className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors shrink-0"
              >
                View program details
              </Link>
            </div>

            <p className="text-sm text-gray-600 mb-3">{program.tagline}</p>

            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {program.forms.length} form{program.forms.length !== 1 ? "s" : ""} available
              </span>
              <span className="text-xs text-gray-400">
                Last updated Mar 2026
              </span>
            </div>

            {program.forms.map((form) => (
              <div
                key={form.id}
                className="flex items-center gap-4 bg-vanilla-50 rounded-xl p-4 mb-3 last:mb-0"
              >
                <div className="w-10 h-10 bg-error-50 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{form.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>
                </div>
                <a
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-2">How to use these forms</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Download and complete each form above, making sure to fill in all required fields and sign where indicated.</li>
                  <li>Attach supporting documents from your <Link href={`/texas/benefits/${slug}/checklist`} className="text-primary-600 hover:text-primary-500 font-medium">document checklist</Link> — including proof of identity, income, and Texas residency.</li>
                  <li>Submit your completed forms online at YourTexasBenefits.com, by mail to your local HHS office, or in person — processing typically takes 30 to 90 days.</li>
                </ol>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/benefits/finder"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary-600/30 hover:shadow-xl hover:shadow-primary-600/40 hover:bg-primary-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Check if I qualify
              </Link>
            </div>
          </div>
        </div>
      </section>

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
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
