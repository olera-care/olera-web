import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramById } from "@/data/waiver-library";
import { ProgramTabs } from "@/components/waiver-library/ProgramTabs";
import { ProgramFaqSection } from "@/components/waiver-library/ProgramFaqSection";
import { HomeCareBridgeCta } from "@/components/waiver-library/HomeCareBridgeCta";
import { TexasProgramHero } from "@/components/waiver-library/TexasProgramHero";
import { TX_NEW_TO_OLD, TX_OLD_TO_NEW } from "@/lib/texas-slug-map";
import { isResourceProgram } from "@/lib/waiver-category";

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
  const title = `${program.name} Eligibility | Texas | Olera`;
  return {
    title,
    description: `Full eligibility criteria, coverage, and required documents for ${program.shortName} in Texas.`,
    alternates: { canonical: `/texas/benefits/${slug}/eligibility` },
  };
}

export default async function TexasEligibilityPage({ params }: Props) {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) notFound();

  const program = getProgramById("texas", oldId);
  if (!program) notFound();
  if (isResourceProgram(program)) notFound();

  const basePath = `/texas/benefits/${slug}`;
  const isCeap = oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap";
  const isScsep = oldId === "senior-community-service-employment-program-scsep";
  const isPhc = oldId === "primary-home-care-community-care";
  const isRespite = oldId === "texas-respite-care-services";
  const isPace = oldId === "texas-pace-programs";
  const isMow = oldId === "texas-meals-on-wheels";
  const isMepd = oldId === "texas-medicaid-for-the-elderly-and-people-with-disabilities";
  const isSnap = oldId === "texas-snap-food-benefits";
  const isStarPlus = oldId === "star-plus-home-and-community-based-services";
  const isMsp = oldId === "texas-medicare-savings-programs";

  return (
    <div className="bg-vanilla-100 min-h-screen">
      <TexasProgramHero program={program} slug={slug} currentPage="Eligibility" />
      <ProgramTabs basePath={basePath} />

      {/* Who qualifies + Home Types + Priority */}
      <section className="py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${isMepd || isStarPlus || isMsp ? "p-4 md:p-5" : "p-5 md:p-6"}`}>
            <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-6 items-start">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Who Qualifies</h2>
                </div>
                <ul className="space-y-3">
                  {(isPhc
                    ? [
                        "Eligible for Texas Medicaid in a community setting",
                        "Needs help with at least one personal care task",
                        "Requires at least 6 hours of service per week",
                        "Lives at home, not in a nursing facility, hospital, or assisted living",
                      ]
                    : isRespite
                    ? [
                        "Caregiver must be unpaid",
                        "Either the caregiver or care recipient must live in one of these counties: Collin, Denton, Ellis, Erath, Hood, Hunt, Johnson, Kaufman, Navarro, Palo Pinto, Parker, Rockwall, Somervell, or Wise",
                      ]
                    : isScsep
                    ? [
                        "55 or older",
                        "Currently unemployed",
                        "Household income at or below 125% of the federal poverty level",
                      ]
                    : isCeap
                    ? [
                        "Texas resident",
                        "U.S. citizen or qualified non-citizen",
                        "Household income at or below 150% of the federal poverty level",
                        "Priority given to seniors 60+, people with disabilities, and families with young children",
                      ]
                    : isPace
                    ? [
                        "Age 55 or older",
                        "Have chronic medical problems and functional impairments",
                        "Meet nursing facility level of care criteria as certified by the state",
                        "Reside within a designated PACE service area",
                        "Eligible for Medicaid, Medicare, or both",
                      ]
                    : isMow
                    ? [
                        "Primarily age 60 or older",
                        "Homebound — difficulty leaving home without assistance, driving limitations, or unable to prepare nutritious meals",
                        "Resides within the service area of a local Meals on Wheels provider",
                        "Has physical or mental limitations, with priority given to those with low income or high social need",
                      ]
                    : isMepd
                    ? [
                        "Texas resident",
                        "Age/Disability: 65 or older, or disabled/blind",
                      ]
                    : isSnap
                    ? [
                        "Low-income Texas households that meet income and resource requirements",
                        "Households where all members are 60 or older or living with a disability may qualify for the Texas Simplified Application Project (TSAP), which offers a streamlined application and three-year benefit periods instead of the standard six months",
                        "Exempt Resources: Your home, lot, and most retirement plans are not counted",
                      ]
                    : isStarPlus
                    ? [
                        "Texas resident",
                        "Age 21+ with a disability, or age 65+",
                        "At risk of nursing home placement",
                      ]
                    : isMsp
                    ? [
                        "Already enrolled in or eligible for Medicare Part A",
                        "Texas resident with limited income and resources",
                        "Income and asset limits vary by program (QMB, SLMB, QI, or QDWI)",
                      ]
                    : [
                        "Texas resident",
                        "U.S. citizen or legal resident",
                        "Household income at or below 200% of the federal poverty level, or receiving SSI",
                        "Home must not have been weatherized through this program in the past 15 years",
                        "Home must be able to benefit from weatherization improvements",
                      ]
                  ).map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                {isMow && (
                  <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 p-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Referring a loved one?</p>
                      <p className="text-sm text-gray-700">
                        Yes — you can refer or apply on behalf of a family member, friend, or neighbor who meets the eligibility requirements.
                      </p>
                    </div>
                  </div>
                )}

                {isRespite && (
                  <div className="mt-5">
                    <p className="font-semibold text-gray-900 mb-3">The caregiver must be caring for:</p>
                    <ul className="space-y-3">
                      {[
                        "Someone 60 or older",
                        "Someone of any age with Alzheimer's or related dementia",
                        "A grandchild or relative 18 or younger (caregiver must be 55 or older)",
                        "A relative aged 19 to 59 with a disability living in the same home (caregiver must be 55 or older)",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <aside className={`bg-primary-50 border border-primary-100 rounded-xl text-center flex flex-col items-center justify-center ${isMepd || isStarPlus || isMsp ? "p-4" : "p-6 md:p-8 h-full"}`}>
                <div className={`rounded-2xl bg-white shadow-sm flex items-center justify-center ${isMepd || isStarPlus || isMsp ? "w-10 h-10 mb-2" : "w-14 h-14 mb-4"}`}>
                  <svg className={`text-primary-700 ${isMepd || isStarPlus || isMsp ? "w-5 h-5" : "w-7 h-7"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <h3 className={`font-bold text-gray-900 ${isMepd || isStarPlus || isMsp ? "text-base" : "text-xl md:text-2xl"}`}>Do I qualify?</h3>
                <p className={`text-gray-600 ${isMepd || isStarPlus || isMsp ? "mt-1 text-xs" : "mt-2 text-base"}`}>
                  Take a free 2-minute eligibility check.
                </p>
                <Link
                  href="/benefits/finder"
                  className={`inline-flex items-center justify-center gap-1.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 shadow-md shadow-primary-600/25 transition-colors ${isMepd || isStarPlus || isMsp ? "mt-3 px-3.5 py-2 text-sm" : "mt-5 px-5 py-3 text-base"}`}
                >
                  Check My Eligibility
                  <svg className={isMepd || isStarPlus || isMsp ? "w-3.5 h-3.5" : "w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </aside>
            </div>

            {!isScsep && !isPhc && !isRespite && !isPace && !isMow && !isMepd && !isSnap && !isStarPlus && !isMsp && (
              <>
                <div className="my-6 border-t border-gray-100" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Eligible Home Types</h3>
                      <p className="mt-1 text-gray-700">
                        {isCeap
                          ? "Covers diverse home types, including homeowners, renters, and residents in subsidized housing."
                          : "Single-family homes, mobile homes, and small multi-family units (up to 4 units)."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Priority Given To</h3>
                      <p className="mt-1 text-gray-700">
                        Seniors, people with disabilities, families with children, and high energy users.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* SCSEP — Priority is given to */}
      {isScsep && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Priority is given to</h2>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {[
                  "Veterans and their spouses",
                  "Adults 65 and older",
                  "People with disabilities",
                  "Those with low literacy skills or limited English proficiency",
                  "Rural residents",
                  "People experiencing or at risk of homelessness",
                  "Those with low employment prospects",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Homeowners and renters */}
      {!isScsep && !isPhc && !isRespite && !isPace && !isMow && !isMepd && !isSnap && !isStarPlus && !isMsp && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary-50 rounded-xl border border-primary-100 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Homeowners &amp; Renters</h2>
            </div>
            {isCeap ? (
              <p className="text-gray-700">
                <span className="font-semibold text-gray-900">Both homeowners and renters can apply.</span>{" "}
                You do not need landlord permission to apply for CEAP, because the payment goes directly to your utility company and does not involve any changes to the property itself.
              </p>
            ) : (
              <>
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-900">Both homeowners and renters can apply.</span>{" "}
                  Renters will need landlord permission before work can begin.
                </p>
                <p className="text-gray-700 mt-2">
                  Need the form?{" "}
                  <a
                    href="https://www.tdhca.texas.gov/sites/default/files/community-affairs/wap/docs/10-WAPLandlord.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-primary-700 hover:text-primary-600 underline"
                  >
                    Click here
                  </a>{" "}
                  for the Landlord Permission Form.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      )}

      {/* PHC — Priority Status */}
      {isPhc && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Priority Status</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Priority is given to people who need hands-on help from another person to get in and out of bed, feed themselves, use the toilet, or prepare a meal.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Priority status</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">Up to 42 hours / week</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Non-priority status</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">Up to 50 hours / week</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHC — Income & Asset Limits */}
      {isPhc && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Income Limits (2024)</h2>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-700">Single applicant</span>
                    <span className="font-semibold text-gray-900 tabular-nums">$943 / month</span>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-gray-700">Married couple (combined)</span>
                    <span className="font-semibold text-gray-900 tabular-nums">$1,415 / month</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Asset Limits</h2>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <span className="text-gray-700">Single applicant</span>
                    <span className="font-semibold text-gray-900 tabular-nums">Up to $2,000</span>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-gray-700">Married couple</span>
                    <span className="font-semibold text-gray-900 tabular-nums">Up to $3,000</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MEPD — Income Limits */}
      {isMepd && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mb-3">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 w-full">Income Limits for Texas MEPD</h2>
                <p className="text-sm text-gray-600 mt-2 w-full">
                  Your household income must fall below these limits to qualify for MEPD. Limits apply monthly and are based on household composition.
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-primary-100">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[60%]" />
                    <col className="w-[40%]" />
                  </colgroup>
                  <thead className="bg-primary-800 text-white">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Household</th>
                      <th className="text-center font-semibold px-4 py-3">Monthly Income Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {[
                      { label: "Single", value: "$967" },
                      { label: "Married, both applying", value: "$1,450" },
                      { label: "Married, one spouse applying", value: "$1,450" },
                    ].map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-primary-50/40"}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.label}</td>
                        <td className="px-4 py-3 text-center font-semibold text-primary-800 bg-primary-50 tabular-nums">{row.value} / month</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MEPD — Asset Limits */}
      {isMepd && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Asset Limits</h2>
              </div>
              <p className="text-gray-700 mb-5">
                Medicaid counts assets owned by both you and your spouse. The total value of countable assets must stay below the program limit.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-success-50 border border-success-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-success-700 mb-3">Assets that do not count</p>
                  <ul className="space-y-2.5">
                    {[
                      "Primary home (as long as you or your spouse lives in it)",
                      "One vehicle",
                      "Life insurance with a face value of $1,500 or less",
                      "Burial spaces",
                      "Up to $1,500 set aside for burial expenses",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-warning-50 border border-warning-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-warning-700 mb-3">Assets that do count</p>
                  <ul className="space-y-2.5">
                    {[
                      "Checking and savings accounts",
                      "CDs, money market accounts, and IRAs",
                      "Stocks and bonds",
                      "Additional property or land",
                      "Most prepaid burial contracts",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-warning-100 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-warning-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Key Texas Respite Care programs */}
      {isRespite && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Key Texas Respite Care programs</h2>
              </div>
              <ul className="space-y-4">
                {[
                  {
                    title: "Medicaid Programs (STAR+PLUS)",
                    desc: "Provides in-home or institutional respite for eligible low-income seniors.",
                  },
                  {
                    title: "CLASS & DBMD Waivers",
                    desc: "For those with related conditions; these programs offer 30 days or up to 720 hours of respite per year.",
                  },
                  {
                    title: "Veterans Benefits (VA)",
                    desc: "Eligible veterans can receive respite care if they meet clinical criteria for extended care services.",
                  },
                  {
                    title: "Respite for Caregivers (Local Authorities)",
                    desc: "Community-based services are available, often focusing on supporting the caregiver's wellbeing.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-0.5 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* PACE — What does PACE cost */}
      {isPace && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">What does PACE cost?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-success-50 border border-success-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-success-700">With Medicaid</p>
                  <p className="mt-2 text-lg font-bold text-gray-900">$0 monthly premium</p>
                  <p className="mt-1 text-sm text-gray-600">
                    If you have Medicaid, you won&apos;t pay a monthly premium for PACE.
                  </p>
                </div>
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Medicare only</p>
                  <p className="mt-2 text-lg font-bold text-gray-900">Premium applies</p>
                  <p className="mt-1 text-sm text-gray-600">
                    If you don&apos;t qualify for Medicaid but you have Medicare, the amount you pay depends on whether you have Medicare Part A (Hospital Insurance) and/or Part B (Medical Insurance). It will also include:
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>A monthly premium for the long-term care portion of the PACE benefit</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>A premium for Medicare Part D drugs</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Without Medicare or Medicaid</p>
                  <p className="mt-2 text-lg font-bold text-gray-900">Private pay</p>
                  <p className="mt-1 text-sm text-gray-600">
                    If you don&apos;t have Medicare or Medicaid, you can pay the PACE premium yourself.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-success-100 bg-success-50/60 px-4 py-3 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">No out-of-pocket costs for approved care.</span>{" "}
                Regardless of your financial situation, you won&apos;t have a deductible, copayment, or co-insurance for any drug, service, or care your PACE team approves.
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Federal Poverty Level chart */}
      {!isPhc && !isRespite && !isPace && !isMow && !isMepd && !isSnap && !isStarPlus && !isMsp && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mb-3">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 w-full">
                {isScsep
                  ? "Income Limits for Texas SCSEP"
                  : isCeap
                  ? "Income Limits for Texas CEAP"
                  : isMepd
                  ? "Income Limits for Texas MEPD"
                  : "Program Year 2023 Income Limits for LIHEAP WAP and DOE WAP"}
              </h2>
              <p className="text-sm text-gray-600 mt-2 w-full">
                {isScsep
                  ? "Your household income must be at or below 125% of the federal poverty level to qualify for SCSEP. Federal Poverty Level amounts update every January. Use this chart to check if your household qualifies."
                  : isCeap
                  ? "Your household income must be at or below 150% of the federal poverty level to qualify for CEAP. Federal Poverty Level amounts update every January. Use this chart to check if your household qualifies."
                  : isMepd
                  ? "Your household income must be below 100% of the federal poverty level to qualify for MEPD. Federal Poverty Level amounts update every January. Use this chart to check if your household qualifies."
                  : "Effective January 23, 2023. Household income at or below 200% of the federal poverty level means your household earns below a certain amount set by the government each year. Use this chart to check if your household qualifies."}
              </p>
            </div>
            {isScsep ? (
              <div className="overflow-x-auto rounded-xl border border-primary-100">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[28%]" />
                    <col className="w-[24%]" />
                    <col className="w-[24%]" />
                    <col className="w-[24%]" />
                  </colgroup>
                  <thead className="bg-primary-800 text-white">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Persons in Household</th>
                      <th className="text-center font-semibold px-4 py-3 bg-primary-600 relative">
                        125% FPL
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90 mt-0.5">This program</span>
                      </th>
                      <th className="text-center font-semibold px-4 py-3">150% FPL</th>
                      <th className="text-center font-semibold px-4 py-3">200% FPL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-100">
                    {[
                      { size: "1", p125: "$13,590", p150: "$16,308", p200: "$21,744" },
                      { size: "2", p125: "$18,310", p150: "$21,972", p200: "$29,296" },
                      { size: "3", p125: "$23,030", p150: "$27,636", p200: "$36,848" },
                      { size: "4", p125: "$27,750", p150: "$33,300", p200: "$44,400" },
                      { size: "5", p125: "$32,470", p150: "$38,964", p200: "$51,952" },
                      { size: "6", p125: "$37,190", p150: "$44,628", p200: "$59,504" },
                      { size: "7", p125: "$41,910", p150: "$50,292", p200: "$67,056" },
                      { size: "8", p125: "$46,630", p150: "$55,956", p200: "$74,608" },
                    ].map((row, i) => (
                      <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-primary-50/40"}>
                        <td className="px-4 py-3 font-semibold text-gray-900">{row.size}</td>
                        <td className="px-4 py-3 text-center font-semibold text-primary-800 bg-primary-50 tabular-nums">{row.p125}</td>
                        <td className="px-4 py-3 text-center text-gray-700 tabular-nums">{row.p150}</td>
                        <td className="px-4 py-3 text-center text-gray-700 tabular-nums">{row.p200}</td>
                      </tr>
                    ))}
                    <tr className="bg-primary-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">More than 8</td>
                      <td className="px-4 py-3 text-center text-xs font-semibold text-primary-800 bg-primary-50">+ $4,720 / person</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">+ $5,664 / person</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-600">+ $7,552 / person</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
            <div className="overflow-x-auto rounded-xl border border-primary-100">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[28%]" />
                  <col className="w-[24%]" />
                  <col className="w-[24%]" />
                  <col className="w-[24%]" />
                </colgroup>
                <thead className="bg-primary-800 text-white">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Persons in Household</th>
                    <th className={`text-center font-semibold px-4 py-3 relative ${isMepd ? "bg-primary-600" : ""}`}>
                      100% FPL
                      {isMepd && (
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90 mt-0.5">This program</span>
                      )}
                    </th>
                    <th className={`text-center font-semibold px-4 py-3 relative ${isCeap ? "bg-primary-600" : ""}`}>
                      150% FPL
                      {isCeap && (
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90 mt-0.5">This program</span>
                      )}
                    </th>
                    <th className={`text-center font-semibold px-4 py-3 relative ${!isCeap && !isMepd ? "bg-primary-600" : ""}`}>
                      200% FPL
                      {!isCeap && !isMepd && (
                        <span className="block text-[10px] font-semibold uppercase tracking-wide text-white/90 mt-0.5">This program</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {[
                    { size: "1", p100: "$14,580", p150: "$21,870", p200: "$29,160" },
                    { size: "2", p100: "$19,720", p150: "$29,580", p200: "$39,440" },
                    { size: "3", p100: "$24,860", p150: "$37,290", p200: "$49,720" },
                    { size: "4", p100: "$30,000", p150: "$45,000", p200: "$60,000" },
                    { size: "5", p100: "$35,140", p150: "$52,710", p200: "$70,280" },
                    { size: "6", p100: "$40,280", p150: "$60,420", p200: "$80,560" },
                    { size: "7", p100: "$45,420", p150: "$68,130", p200: "$90,840" },
                    { size: "8", p100: "$50,560", p150: "$75,840", p200: "$101,120" },
                  ].map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-primary-50/40"}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{row.size}</td>
                      <td className={`px-4 py-3 text-center tabular-nums ${isMepd ? "font-semibold text-primary-800 bg-primary-50" : "text-gray-700"}`}>{row.p100}</td>
                      <td className={`px-4 py-3 text-center tabular-nums ${isCeap ? "font-semibold text-primary-800 bg-primary-50" : "text-gray-700"}`}>{row.p150}</td>
                      <td className={`px-4 py-3 text-center tabular-nums ${!isCeap && !isMepd ? "font-semibold text-primary-800 bg-primary-50" : "text-gray-700"}`}>{row.p200}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">More than 8</td>
                    <td className={`px-4 py-3 text-center text-xs ${isMepd ? "font-semibold text-primary-800 bg-primary-50" : "text-gray-600"}`}>+ $5,140 / person</td>
                    <td className={`px-4 py-3 text-center text-xs ${isCeap ? "font-semibold text-primary-800 bg-primary-50" : "text-gray-600"}`}>+ $7,710 / person</td>
                    <td className={`px-4 py-3 text-center text-xs ${!isCeap && !isMepd ? "font-semibold text-primary-800 bg-primary-50" : "text-gray-600"}`}>+ $10,280 / person</td>
                  </tr>
                </tbody>
              </table>
            </div>
            )}
            <div className="mt-4 space-y-1 text-sm text-gray-600">
              {isScsep ? (
                <p>Eligibility for Texas SCSEP is calculated at 125% of Federal Poverty Income Guidelines.</p>
              ) : isCeap ? (
                <p>Eligibility for Texas CEAP is calculated at 150% of Federal Poverty Income Guidelines.</p>
              ) : isMepd ? (
                <p>Eligibility for Texas MEPD is calculated at 100% of Federal Poverty Income Guidelines.</p>
              ) : (
                <>
                  <p>Eligibility for LIHEAP WAP is calculated at 150% of Federal Poverty Income Guidelines.</p>
                  <p>Eligibility for DOE WAP is calculated at 200% of Federal Poverty Income Guidelines.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* SNAP Income Limits chart */}
      {isSnap && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mb-3">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 w-full">Income Limits for Texas SNAP</h2>
              <p className="text-sm text-gray-600 mt-2 w-full max-w-2xl">
                The chart below gives a general idea of the amount of money (income) that most eligible people or families can earn and still get SNAP benefits.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-primary-100">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[50%]" />
                  <col className="w-[50%]" />
                </colgroup>
                <thead className="bg-primary-800 text-white">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3">Family size</th>
                    <th className="text-center font-semibold px-4 py-3 bg-primary-600">Maximum monthly income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {[
                    { size: "1", income: "$2,152" },
                    { size: "2", income: "$2,909" },
                    { size: "3", income: "$3,665" },
                    { size: "4", income: "$4,421" },
                    { size: "5", income: "$5,177" },
                    { size: "6", income: "$5,934" },
                    { size: "7", income: "$6,690" },
                    { size: "8", income: "$7,446" },
                  ].map((row, i) => (
                    <tr key={row.size} className={i % 2 === 0 ? "bg-white" : "bg-primary-50/40"}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{row.size}</td>
                      <td className="px-4 py-3 text-center font-semibold text-primary-800 bg-primary-50 tabular-nums">{row.income}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">For each additional person, add</td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-primary-800 bg-primary-50">+ $757 / person</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* STAR+PLUS — Income, Assets & Medical Necessity */}
      {isStarPlus && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Income Limits */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Income Limits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Individual</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">Up to $2,901<span className="text-base font-semibold text-gray-600">/month</span></p>
                <p className="mt-1 text-sm text-gray-600">Monthly income limit per applicant.</p>
              </div>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">Married Couples</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">$2,901<span className="text-base font-semibold text-gray-600">/month each</span></p>
                <p className="mt-1 text-sm text-gray-600">Each spouse is evaluated individually — each may have up to $2,901/month.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50/50 p-4">
              <p className="text-sm text-gray-700">
                The income limit is set at <span className="font-semibold text-gray-900">300% of the monthly Supplemental Security Income (SSI) federal benefit rate</span>.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Amount:</span> Since 300% is based on the maximum federal benefit rate, it changes annually. For 2026, the maximum SSI rate is <span className="font-semibold text-gray-900">$994</span>, making 300% of that <span className="font-semibold text-gray-900">$2,982</span>.
              </p>
            </div>
          </div>

          {/* Asset Limits */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Asset Limits</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Single Applicant</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">$2,000</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Married Couple (Both Applying)</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">$3,000</p>
              </div>
            </div>
          </div>

          {/* Medical Necessity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Medical Necessity</h2>
            </div>
            <p className="text-gray-700">
              Applicants must be assessed as needing a <span className="font-semibold text-gray-900">nursing facility level of care</span>, meaning they cannot manage daily living activities without significant help. An assessment will be conducted to determine this.
            </p>
          </div>
        </div>
      </section>
      )}

      {/* MSP — Combined Income & Resource Limits Chart */}
      {isMsp && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mb-3">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 w-full">2026 Medicare Savings Program Income &amp; Resource Limits</h2>
              <p className="text-sm text-gray-600 mt-2 w-full">
                Each program has its own income and resource thresholds. Use this chart to find which program you may qualify for.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-primary-100">
              <table className="w-full text-sm">
                <thead className="bg-primary-800 text-white">
                  <tr>
                    <th rowSpan={2} className="text-left font-semibold px-4 py-3 align-middle border-r border-primary-700">Program</th>
                    <th colSpan={2} className="text-center font-semibold px-4 py-2 border-b border-primary-700 bg-primary-700">Individual</th>
                    <th colSpan={2} className="text-center font-semibold px-4 py-2 border-b border-primary-700 bg-primary-700/80 border-l border-primary-700">Married Couple</th>
                  </tr>
                  <tr className="bg-primary-700 text-white text-xs uppercase tracking-wide">
                    <th className="text-center font-semibold px-4 py-2">Monthly Income*</th>
                    <th className="text-center font-semibold px-4 py-2 border-r border-primary-600">Resource Limit</th>
                    <th className="text-center font-semibold px-4 py-2">Monthly Income*</th>
                    <th className="text-center font-semibold px-4 py-2">Resource Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {[
                    {
                      name: "QMB",
                      fullName: "Qualified Medicare Beneficiary",
                      tag: "Most help",
                      tagColor: "bg-success-100 text-success-700 border-success-200",
                      indIncome: "$1,350",
                      indResource: "$9,950",
                      coupleIncome: "$1,824",
                      coupleResource: "$14,910",
                      rowBg: "bg-success-50/40",
                    },
                    {
                      name: "SLMB",
                      fullName: "Specified Low-Income Medicare Beneficiary",
                      tag: "Part B premium",
                      tagColor: "bg-primary-100 text-primary-700 border-primary-200",
                      indIncome: "$1,616",
                      indResource: "$9,950",
                      coupleIncome: "$2,184",
                      coupleResource: "$14,910",
                      rowBg: "bg-primary-50/40",
                    },
                    {
                      name: "QI",
                      fullName: "Qualifying Individual",
                      tag: "Part B premium",
                      tagColor: "bg-warning-100 text-warning-700 border-warning-200",
                      indIncome: "$1,816",
                      indResource: "$9,950",
                      coupleIncome: "$2,455",
                      coupleResource: "$14,910",
                      rowBg: "bg-warning-50/40",
                    },
                    {
                      name: "QDWI",
                      fullName: "Qualified Disabled & Working Individual",
                      tag: "Part A premium",
                      tagColor: "bg-secondary-100 text-secondary-700 border-secondary-200",
                      indIncome: "$5,405",
                      indResource: "$4,000",
                      coupleIncome: "$7,299",
                      coupleResource: "$6,000",
                      rowBg: "bg-secondary-50/40",
                    },
                  ].map((p) => (
                    <tr key={p.name} className={p.rowBg}>
                      <td className="px-4 py-4 border-r border-primary-100">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold text-gray-900 text-base leading-none">{p.name}</span>
                          <span className="text-xs text-gray-600 leading-snug">{p.fullName}</span>
                          <span className={`inline-flex items-center self-start mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.tagColor}`}>
                            {p.tag}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-primary-800 tabular-nums">{p.indIncome}</td>
                      <td className="px-4 py-4 text-center text-gray-700 tabular-nums border-r border-primary-100">{p.indResource}</td>
                      <td className="px-4 py-4 text-center font-semibold text-primary-800 tabular-nums">{p.coupleIncome}</td>
                      <td className="px-4 py-4 text-center text-gray-700 tabular-nums">{p.coupleResource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-gray-500">* Income limits are slightly higher in Alaska and Hawaii.</p>
          </div>
        </div>
      </section>
      )}

      {/* FAQs */}
      <div className="pb-6">
        <ProgramFaqSection
          faqs={
            oldId === "texas-weatherization-assistance-program"
              ? [
                  {
                    question: "What is the income limit for the Texas Weatherization Program in 2026?",
                    answer:
                      "You generally qualify if your household income is at or below 200% of the Federal Poverty Level (for DOE WAP) or 150% FPL (for LIHEAP WAP). Federal Poverty Level amounts update every January — see the income chart above for the most current limits. You may also qualify automatically if anyone in the household receives SSI.",
                  },
                  {
                    question: "I was denied for CEAP energy assistance — can I still qualify for weatherization?",
                    answer:
                      "Yes. CEAP (bill payment assistance) and WAP (home energy upgrades) are separate programs with different rules and funding streams. A denial from one does not mean you'll be denied from the other. Apply to your local weatherization agency directly even if CEAP turned you down.",
                  },
                  {
                    question: "Can I apply if I rent my home?",
                    answer:
                      "Yes — renters can apply. You will need your landlord's written permission before any work can begin, using the Landlord Permission Form (available on the Resources tab). Landlords are usually supportive since the improvements stay with the property and lower long-term operating costs.",
                  },
                ]
              : oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap"
              ? [
                  {
                    question: "What is the income limit for CEAP in Texas in 2026?",
                    answer:
                      "To qualify for CEAP, your household income must be at or below 150% of the Federal Poverty Level. The exact dollar amount depends on the number of people in your home and updates every January when the Federal Poverty Level is released. See the income chart above for current limits, and check with your local Community Action Agency for the most up-to-date numbers.",
                  },
                  {
                    question: "Do I automatically qualify for CEAP if I receive SNAP, SSI, or TANF?",
                    answer:
                      "In most Texas counties, households that already receive SNAP, SSI, or TANF are considered categorically income-eligible for CEAP, meaning you generally will not need to re-prove your income. You will still need to complete an application and provide the other required documents, such as ID, proof of citizenship or legal residency, and your most recent utility bill. Ask your local Community Action Agency how they handle categorical eligibility, since some paperwork requirements vary by region.",
                  },
                  {
                    question: "Can I apply for CEAP if I rent my home?",
                    answer:
                      "Yes. Renters are fully eligible for CEAP, including those who live in subsidized housing. You do not need landlord permission, because CEAP payments go directly to your utility company and do not involve any physical changes to the property. As long as the utility account is in your name (or you can show you are responsible for paying the bill), you can apply.",
                  },
                ]
              : isScsep
              ? [
                  {
                    question: "Can I apply for SCSEP if I am retired but need to go back to work?",
                    answer:
                      "Yes. SCSEP is specifically designed for adults 55 and older who are unemployed and want to re-enter the workforce, including people who retired and now need to work again. As long as you meet the age, unemployment, and income requirements (at or below 125% of the federal poverty level), retirement status does not disqualify you.",
                  },
                  {
                    question: "Does Social Security income count toward the SCSEP income limit?",
                    answer:
                      "For SCSEP eligibility, Social Security Title II benefits (retirement, survivor, and disability benefits) are excluded from the income calculation — they do not count against the 125% federal poverty level limit. Most other income sources, including pensions, wages, and investment income, are counted. When you apply, bring documentation of all income and the local SCSEP agency will help determine your eligibility.",
                  },
                  {
                    question: "Can I apply for SCSEP if I have a disability?",
                    answer:
                      "Yes. People with disabilities are not only eligible for SCSEP but are also given priority enrollment. When you apply, let your local SCSEP provider know about your disability so they can match you with a training assignment that fits your abilities and any accommodations you need. Reasonable accommodations are available throughout the program.",
                  },
                ]
              : isPhc
              ? [
                  {
                    question: "Can I qualify for Primary Home Care if I own a home in Texas?",
                    answer:
                      "Yes. Your primary home is not counted toward the $2,000 asset limit for Medicaid. You can own and live in your home and still qualify for PHC, as long as your countable assets (things like bank accounts and non-exempt vehicles) stay under the limit. One vehicle is also excluded, and household items, personal belongings, and certain burial funds are not counted either.",
                  },
                  {
                    question: "Does my spouse's income affect my eligibility for Primary Home Care?",
                    answer:
                      "It can, but Texas Medicaid uses spousal impoverishment rules to protect the spouse who is not applying. A portion of the couple's income and assets is set aside for the community spouse, so the applicant can qualify without leaving their partner without resources. The rules are detailed — if you are married, it is worth calling your local Aging and Disability Resource Center (ADRC) at (855) 937-2372 to walk through your specific situation.",
                  },
                  {
                    question: "Can I get Primary Home Care if I already receive Medicare?",
                    answer:
                      "Yes. Many PHC recipients are dual-eligible, meaning they have both Medicare and Medicaid. Medicare does not cover long-term non-medical attendant care, which is exactly what PHC provides. If you qualify for Medicaid, PHC fills the gap that Medicare leaves for help with daily tasks like bathing, dressing, and meal preparation.",
                  },
                ]
              : isPace
              ? [
                  {
                    question: "Does a senior with dementia qualify for the PACE program in Texas?",
                    answer:
                      "Yes. Seniors with Alzheimer's disease or other forms of dementia are often excellent candidates for PACE. Dementia frequently meets the nursing-home level of care requirement, and the PACE interdisciplinary team is specifically trained to provide dementia care — including cognitive assessments, medication management, behavioral support, caregiver education, and adult day programming at the PACE center. The goal is to help the participant stay safely at home as long as possible.",
                  },
                  {
                    question: "What level of care do you need to qualify for PACE in Texas?",
                    answer:
                      "To enroll in PACE, you must meet Texas's nursing-home level of care criteria, which is determined by a state assessment. This generally means you need help with multiple activities of daily living (bathing, dressing, toileting, eating, transferring) or have a chronic medical condition or cognitive impairment that makes it unsafe to live independently without support. The PACE interdisciplinary team also confirms that you can live safely in the community with PACE services in place.",
                  },
                  {
                    question: "Can you join PACE in Texas if you have Medicare but not Medicaid?",
                    answer:
                      "Yes. You can enroll in PACE with Medicare alone, Medicaid alone, both, or even as a private pay participant. If you have Medicare but not Medicaid, you will pay a monthly premium for the long-term care portion of the PACE benefit plus a premium for Medicare Part D prescription drugs. There are no deductibles or copays for any service approved by your PACE team.",
                  },
                ]
              : isMow
              ? [
                  {
                    question: "Does a senior have to be completely homebound to qualify for Meals on Wheels in Texas?",
                    answer:
                      "Not strictly. While \"homebound\" is a core eligibility criterion, it's interpreted broadly. You generally qualify if leaving home is difficult, requires significant effort, or poses a safety risk — for example, you can't drive, you have mobility limitations, you use a walker or wheelchair, or a chronic condition makes food shopping and meal preparation unsafe. You don't have to be bedridden. Each local provider makes the final determination based on a short in-home assessment.",
                  },
                  {
                    question: "Can a person with disabilities under 60 receive Meals on Wheels in Texas?",
                    answer:
                      "Yes, in many cases. While Meals on Wheels primarily serves seniors aged 60 and older under the Older Americans Act, most Texas providers also serve adults under 60 who are homebound due to a disability, chronic illness, or recovery from surgery. These services may be funded differently — through Medicaid waivers, local grants, or sliding-scale fees — so policies vary by provider. Contact your local Meals on Wheels agency to confirm eligibility.",
                  },
                  {
                    question: "Does income affect eligibility for Meals on Wheels in Texas?",
                    answer:
                      "Generally no. Meals on Wheels in Texas does not use a strict income limit to determine eligibility. Instead, priority is based on age, functional need, homebound status, and risk factors like isolation or nutritional need. However, some providers give priority to low-income seniors when demand exceeds capacity. Meals are usually offered free or on a suggested donation basis regardless of income.",
                  },
                ]
              : isRespite
              ? [
                  {
                    question: "Does my elderly parent qualify for respite care in Texas if they have dementia?",
                    answer:
                      "Yes. Dementia is one of the most common qualifying conditions for Texas respite programs. Your parent may qualify through Medicaid waivers like STAR+PLUS HCBS or CLASS, or through the Lifespan Respite Care Program, which specifically serves caregivers of people with cognitive impairments. Many Area Agencies on Aging also offer dementia-specific respite through the National Family Caregiver Support Program.",
                  },
                  {
                    question: "Can a grandparent raising a grandchild get respite care assistance in Texas?",
                    answer:
                      "Yes. Texas offers respite support for grandparents and other relative caregivers raising a grandchild under 18 through the Kinship Care program and the National Family Caregiver Support Program. These programs can cover short-term childcare and adult day services so the grandparent can rest or attend to their own needs. Contact your local Area Agency on Aging or dial 2-1-1 to get started.",
                  },
                  {
                    question: "Do you have to be on Medicaid to receive respite care services in Texas?",
                    answer:
                      "No. While Medicaid waivers cover respite for eligible low-income seniors, there are also non-Medicaid options. The Lifespan Respite Care Program, the Older Americans Act National Family Caregiver Support Program, and local nonprofits (like the Concho Valley Respite Program) provide free or sliding-scale respite regardless of Medicaid status. Eligibility for those programs is usually based on your caregiving role rather than income.",
                  },
                ]
              : isSnap
              ? [
                  {
                    question: "Can a senior living alone qualify for SNAP benefits in Texas?",
                    answer:
                      "Yes. Single seniors are among the most common SNAP recipients in Texas. A senior living alone can qualify if their gross monthly income is at or below $2,152 in 2026. Texas uses broad-based categorical eligibility, which eliminates the asset test for most applicants, and seniors 60+ can deduct out-of-pocket medical expenses over $35 per month to lower their countable income. Most single seniors also qualify for the Texas Simplified Application Project (TSAP), which uses a shorter form and longer three-year certification period.",
                  },
                  {
                    question: "What is the income limit for SNAP benefits for a single person in Texas?",
                    answer:
                      "For 2026, the gross monthly income limit for a single person in Texas is $2,152, which is 165% of the federal poverty level. Households with at least one member who is 60+ or living with a disability are held to the same gross limit but gain access to additional deductions — including uncapped medical expenses over $35/month and full shelter costs — to reduce their net income. Net income (after deductions) must also be at or below 100% of the federal poverty level for most households to qualify.",
                  },
                  {
                    question: "What is the Texas Simplified Application Project and who does it benefit?",
                    answer:
                      "The Texas Simplified Application Project (TSAP) is a streamlined SNAP application designed for households where every member is age 60 or older or living with a disability and no one has earned income. TSAP uses a shorter application (Form H0011), waives the in-person interview in most cases, and provides a three-year certification period instead of the standard six months — meaning far fewer paperwork renewals. It was created specifically to make it easier for elderly and disabled Texans to get and keep their food benefits.",
                  },
                ]
              : isStarPlus
              ? [
                  {
                    question: "Can a senior with a disability qualify for STAR+PLUS Medicaid in Texas without being in a nursing home?",
                    answer:
                      "Yes. That is exactly what the STAR+PLUS Home and Community-Based Services (HCBS) Waiver is designed to do. If a senior meets Texas's nursing facility level of care but wants to stay at home or in the community, STAR+PLUS HCBS can cover the long-term services and supports — personal attendant care, nursing, adaptive aids, home modifications, respite, adult foster care, and more — so they don't have to move into a nursing home. The person must meet the medical, income, and asset criteria, but living at home is the intent of the program.",
                  },
                  {
                    question: "What are the income and asset limits for the STAR+PLUS Waiver in Texas?",
                    answer:
                      "For 2026, an individual applicant's monthly income must generally be at or below $2,901 (300% of the federal SSI benefit rate, which is $994/month in 2026). Countable assets must be at or below $2,000 for a single person or $3,000 for a married couple when both spouses are applying. The primary home (if the applicant lives in it or intends to return), one vehicle, household goods, and certain burial arrangements are excluded. If only one spouse is applying, spousal impoverishment rules protect a portion of the couple's combined income and assets for the non-applying community spouse.",
                  },
                  {
                    question: "Does a married couple qualify separately for the STAR+PLUS Waiver in Texas?",
                    answer:
                      "Yes. Each spouse is evaluated individually for STAR+PLUS HCBS, so one can qualify while the other does not. When only one spouse applies, Texas applies spousal impoverishment rules: only the applicant's income is counted against the $2,901/month limit, and the community spouse is allowed to keep a protected share of the couple's combined assets (within federal minimums and maximums) plus the home, one vehicle, and personal belongings. This allows the spouse who needs long-term care to qualify without leaving their partner financially unprotected.",
                  },
                ]
              : isMsp
              ? [
                  {
                    question: "Can a senior who is still working qualify for a Medicare Savings Program in Texas?",
                    answer:
                      "Yes. Medicare Savings Programs in Texas don't have a work requirement — what matters is your countable income and assets, not whether you're employed. If your wages keep you under the income limits for QMB, SLMB, or QI, you can qualify even while working part-time or full-time. Working seniors with disabilities who lost premium-free Part A may also qualify for the QDWI program, which is specifically designed for people under 65 with disabilities who returned to work. When you apply, HHSC will count your gross wages along with Social Security, pensions, and other income sources.",
                  },
                  {
                    question: "Do retirement accounts and investments count toward the asset limit for Medicare Savings Programs in Texas?",
                    answer:
                      "Most retirement accounts and investments do count toward the MSP asset limit, but there are important exceptions. Checking and savings account balances, stocks, bonds, mutual funds, and CDs are counted. Traditional IRAs and 401(k)s are generally counted at their cash surrender value, though if the account is in payout status (you're taking required minimum distributions), only the income — not the principal — is counted. Your home, one car, household goods, personal belongings, burial plots, and a small amount of life insurance are not counted. The 2026 limits are $9,660 for an individual and $14,470 for a married couple, which is significantly more generous than full Medicaid.",
                  },
                  {
                    question: "Can a married couple qualify for a Medicare Savings Program if only one spouse has Medicare?",
                    answer:
                      "Yes. When only one spouse has Medicare, Texas HHSC still uses the married couple income and asset limits to determine eligibility for that spouse — the non-Medicare spouse's income and assets are counted in the household total. The married couple limits are higher than individual limits, which often helps couples qualify. Once approved, the MSP benefits only apply to the spouse who has Medicare. If the second spouse becomes eligible for Medicare later (turns 65 or qualifies through disability), they can apply separately at that time using the same household limits.",
                  },
                ]
              : isMepd
              ? [
                  {
                    question: "Can a married couple qualify for Medicaid for the Elderly and People with Disabilities if only one spouse needs care?",
                    answer:
                      "Yes. Texas uses federal \"spousal impoverishment\" rules so the healthy spouse (the \"community spouse\") is not left without resources when the other spouse applies for MEPD long-term care. Only the applying spouse's income is counted against the income limit, and the community spouse is allowed to keep a protected share of the couple's combined assets (roughly half, within a federal minimum and maximum that adjusts each year) plus the home, one vehicle, and personal belongings. This allows one spouse to qualify for nursing facility or home and community-based services while the other continues to live independently.",
                  },
                  {
                    question: "Does having a life insurance policy affect eligibility for Medicaid for the Elderly and People with Disabilities in Texas?",
                    answer:
                      "It depends on the type and size of the policy. Term life insurance has no cash value and is not counted. Whole life insurance is exempt only if the total face value of all policies is $1,500 or less per person — if it exceeds $1,500, the cash surrender value counts toward the asset limit. Burial insurance and an irrevocable pre-paid burial plan are generally exempt. If a whole life policy is pushing you over the asset limit, an elder law attorney can explain options like transferring ownership, surrendering the policy, or converting it to an exempt burial arrangement.",
                  },
                  {
                    question: "Can a senior who owns property still qualify for Medicaid for the Elderly and People with Disabilities in Texas?",
                    answer:
                      "Yes. The primary home is an exempt asset as long as the applicant lives in it or intends to return to it, and Texas does not apply a home equity cap for married couples when a spouse lives there. One vehicle is also exempt regardless of value. Additional real estate (rental property, vacation homes, vacant land) is counted toward the asset limit and can disqualify an applicant unless it's converted, sold, or restructured. An elder law attorney can help evaluate whether transferring or selling property is the right step before applying.",
                  },
                ]
              : undefined
          }
        />
      </div>

      <HomeCareBridgeCta stateCode="TX" stateName="Texas" />
    </div>
  );
}
