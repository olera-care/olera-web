import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Olera | Our Mission to Transform Senior Care",
  description:
    "Olera helps families find quality senior care — from home care to assisted living to financial planning. Learn about our mission, origin story, and the team behind the platform.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Olera | Our Mission to Transform Senior Care",
    description:
      "Olera helps families find quality senior care — from home care to assisted living to financial planning. Learn about our mission, origin story, and the team behind the platform.",
    url: "/about",
    siteName: "Olera",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-20 md:pt-28 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Making senior care less overwhelming
          </h1>
          <p className="mt-5 text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            For families with an elder loved one in need of care support, Olera&apos;s
            technology platform provides guidance and helps families find solutions
            to their care needs in areas such as home care, assisted living, and
            senior care financial planning.
          </p>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              How Olera was created
            </h2>
            <div className="mt-6 space-y-5 text-gray-600 leading-relaxed">
              <p>
                Olera originated from an interdisciplinary student organization at
                Texas A&amp;M University called Sling Health in October of 2019. Sling
                Health brings together students from engineering, medicine, and
                business to create solutions to medical problems.
              </p>
              <p>
                The vision for Olera was inspired by{" "}
                <em>Being Mortal: Medicine and What Matters in the End</em> by
                surgeon Atul Gawande, which shines light on the neglected eldercare
                space and the gap between what families need and what the system
                provides.
              </p>
              <p>
                Our co-founders are united by a shared passion for improving the
                lives of seniors and their families. With personal and professional
                experience in family caregiving and clinical environments, they&apos;ve
                seen firsthand the challenges and complexities of caring for seniors
                with dementia. Their own parents and grandparents inspired them to
                take action and address the need for innovation in the eldercare
                space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team teaser */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex -space-x-4 shrink-0">
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src="/images/for-providers/team/tj.jpg"
                  alt="TJ Falohun"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src="/images/for-providers/team/logan.jpg"
                  alt="Logan DuBose"
                  fill
                  className="object-cover object-top"
                />
              </div>
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Meet the people behind Olera
              </h2>
              <p className="mt-2 text-gray-500">
                A biomedical engineer and a physician — brought together by a shared
                belief that finding senior care shouldn&apos;t be this hard.
              </p>
              <Link
                href="/team"
                className="inline-flex items-center gap-2 mt-4 text-primary-600 font-semibold hover:text-primary-500 transition-colors"
              >
                Meet our team
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* NIA Support */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-6 py-4 shadow-sm">
            <div className="flex items-center justify-center w-12 h-12 border-2 border-gray-900 rounded-md">
              <span className="text-gray-900 font-bold text-sm tracking-wide">NIH</span>
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500">Proudly supported by</p>
              <p className="text-sm font-semibold text-gray-900">
                National Institute on Aging
              </p>
            </div>
          </div>
          <p className="mt-6 text-gray-500 text-sm max-w-lg mx-auto">
            Olera is backed by the National Institute on Aging, part of the
            National Institutes of Health, to advance innovation in senior care
            technology.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 md:py-20 bg-gradient-to-br from-primary-700 via-primary-800 to-secondary-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to find care for your loved one?
          </h2>
          <p className="mt-4 text-primary-100 text-lg">
            Browse thousands of vetted providers or check what benefits your family
            qualifies for — free, no signup required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
            >
              Browse Providers
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
