import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { allStates } from "@/data/waiver-library";
import { USMap } from "@/components/waiver-library/USMap";
import { StatePickerCard } from "@/components/waiver-library/StatePickerCard";

export const metadata: Metadata = {
  title: "Waiver Library | Olera",
  description:
    "Find HCBS and long-term care Medicaid waivers by state. Explore programs, eligibility requirements, and application steps for seniors and adults with disabilities.",
};

export default function WaiverLibraryPage() {
  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-secondary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Find Your Senior Care Benefits
              </h1>
              <p className="mt-6 text-lg md:text-xl text-primary-100">
                Find out what benefits you&apos;re eligible for in just 2 minutes. Many families
                save up to $10,000 a year. It&apos;s free, simple, and personalized to you.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  href="/benefits/finder"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                >
                  Check Eligibility
                </Link>
                <a
                  href="#states"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-primary-300 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Browse by State
                </a>
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-[400px] lg:w-[480px]">
              <Image
                src="https://dazzlinginsights.com/wp-content/uploads/2020/09/Caring-for-your-ageing-parents-and-other-family-members.jpg"
                alt="Family caring for elderly loved one"
                width={480}
                height={360}
                className="rounded-2xl object-cover w-full h-auto shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Instant Eligibility",
                description:
                  "Connect to the Benefits Finder to check your personalized eligibility and start your application.",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                href: "/benefits/finder",
              },
              {
                title: "State-by-State",
                description:
                  "Navigate directly to your state and see every available waiver with eligibility summaries at a glance.",
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ),
                href: "#states",
              },
            ].map((item) => (
              <Link key={item.title} href={item.href} className="p-6 rounded-xl bg-vanilla-100 hover:shadow-md hover:scale-[1.02] transition-all">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 text-primary-600 mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            ))}
            <StatePickerCard />
          </div>
        </div>
      </section>

      {/* State grid */}
      <section id="states" className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Browse by State
            </h2>
            <p className="mt-2 text-gray-600">
              Select a state to explore available waiver programs and eligibility information.
            </p>
          </div>

          <USMap states={allStates} />
        </div>
      </section>


    </div>
  );
}
