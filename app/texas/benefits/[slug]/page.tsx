import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProgramById } from "@/data/waiver-library";
import { ProgramTabs } from "@/components/waiver-library/ProgramTabs";
import { ProgramFaqSection } from "@/components/waiver-library/ProgramFaqSection";
import { HomeCareBridgeCta } from "@/components/waiver-library/HomeCareBridgeCta";
import { NextSectionCta } from "@/components/waiver-library/NextSectionCta";
import { TexasProgramHero } from "@/components/waiver-library/TexasProgramHero";
import { TexasResourceOnePager } from "@/components/waiver-library/TexasResourceOnePager";
import { TX_NEW_TO_OLD, TX_OLD_TO_NEW } from "@/lib/texas-slug-map";
import { isResourceProgram } from "@/lib/waiver-category";
import { getTexasResourceContent } from "@/data/texas-resources";

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
  const title = `${program.name} | Texas | Benefits Hub | Olera`;
  const description = `${program.tagline} Learn about eligibility, home care benefits, and how to apply for ${program.shortName} in Texas.`;
  return {
    title,
    description,
    alternates: { canonical: `/texas/benefits/${slug}` },
    openGraph: {
      title,
      description,
      url: `/texas/benefits/${slug}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function TexasBenefitLandingPage({ params }: Props) {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) notFound();

  const program = getProgramById("texas", oldId);
  if (!program) notFound();

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
  const isResource = isResourceProgram(program);
  const resourceContent = isResource ? getTexasResourceContent(oldId) : undefined;

  if (isResource && resourceContent) {
    return (
      <div className="bg-vanilla-100 min-h-screen">
        <TexasProgramHero program={program} slug={slug} currentPage="About" />
        <TexasResourceOnePager content={resourceContent} />
      </div>
    );
  }

  return (
    <div className="bg-vanilla-100 min-h-screen">
      <TexasProgramHero program={program} slug={slug} currentPage="About" />
      <ProgramTabs basePath={basePath} />

      {/* Overview */}
      <section className="py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              {isPhc
                ? "In-Home Personal Care Help"
                : isRespite
                ? "A Break for Caregivers, Care for Your Loved One"
                : isScsep
                ? "Job Training and Employment Help for Seniors"
                : isCeap
                ? "Help Paying Your Energy Bills"
                : isPace
                ? "Care for Seniors Who Want to Stay Home"
                : isMow
                ? "Nutritious Meals Delivered to Your Door"
                : isMepd
                ? "Coverage Built for Texas Seniors"
                : isSnap
                ? "Grocery Support That Helps Texans Eat Well"
                : isStarPlus
                ? "Medical and Personal Care Support"
                : isMsp
                ? "Lower Your Medicare Costs With State Assistance"
                : "Lower Your Energy Bills for Free"}
              {isPhc ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ) : isScsep ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ) : isMow ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11h18M5 11V7a2 2 0 012-2h10a2 2 0 012 2v4m-7-4v4m-4 7h12a2 2 0 002-2v-2H5v2a2 2 0 002 2z" />
                </svg>
              ) : isMepd ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l2.25-2.25 2.25 3 3-4.5 2.25 3.75h5.25" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : isSnap ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 12c0 4.5-2.5 8.5-5 8.5S7 16.5 7 12s2-5 4-5c.6 0 1 .15 1 .5 0-.35.4-.5 1-.5 2 0 4 1 4 5z" />
                  <path d="M12 7V4.5m0 0c.8-1.3 2.2-1.3 3-.3-1 1.3-3 .8-3 .3z" />
                </svg>
              ) : isStarPlus ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ) : isMsp ? (
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              )}
            </h2>
            {isMsp ? (
              <div className="text-gray-700 space-y-3">
                <p>
                  Medicare Savings Programs (MSPs) help people with Medicare who have limited income and resources cover out-of-pocket costs such as premiums, deductibles, and coinsurance.
                </p>
                <p>There are four programs available:</p>
                <ul className="space-y-1.5">
                  {[
                    "Qualified Medicare Beneficiary (QMB)",
                    "Specified Low-Income Medicare Beneficiary (SLMB)",
                    "Qualifying Individual (QI)",
                    "Qualified Disabled and Working Individual (QDWI)",
                  ].map((name) => (
                    <li key={name} className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 shrink-0 mt-0.5">
                        <svg className="w-3 h-3 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span className="font-semibold text-gray-900">{name}</span>
                    </li>
                  ))}
                </ul>
                <p>
                  <span className="font-semibold text-gray-900">Part A</span> covers inpatient hospital, skilled nursing, and hospice care, while <span className="font-semibold text-gray-900">Part B</span> covers doctor visits, outpatient care, and medical supplies.
                </p>
              </div>
            ) : (
            <p className="text-gray-700">
              {isPhc
                ? "A non-medical Texas Medicaid program that sends a trained attendant to your home to help with daily tasks like bathing, dressing, and cooking, allowing you to remain at home instead of a facility."
                : isRespite
                ? "Respite Care provides temporary in-home support so family caregivers can rest, work, or handle other responsibilities. A trained caregiver steps in to help with supervision, meals, personal care, and household tasks."
                : isScsep
                ? "This program helps low-income adults 55 and older find work through paid, part-time job training at local nonprofits, schools, and community centers. Participants work about 20 hours a week at minimum wage while building real work experience and skills to transition into permanent employment."
                : isCeap
                ? "This program helps low-income Texas households pay electric, gas, and propane bills. It also covers emergency heating and cooling repairs and is available statewide."
                : isPace
                ? "PACE is a Texas program for seniors who qualify for nursing home level care but choose to remain at home. It provides comprehensive medical care, therapy, and daily support services for a fixed monthly cost — typically well below what a nursing facility charges."
                : isMow
                ? "Meals on Wheels delivers hot, nutritious meals directly to homebound seniors across Texas. Each visit also includes a brief wellness check from a volunteer — a friendly face making sure you or your loved one is safe and doing well."
                : isMepd
                ? "Texas Medicaid for the Elderly and People with Disabilities (MEPD) provides health coverage and long-term care services to low-income Texans who are 65 or older, blind, or disabled."
                : isSnap
                ? "SNAP helps low-income Texans afford nutritious food by providing monthly benefits loaded onto a Lone Star Card, which works like a debit card at any participating grocery store."
                : isStarPlus
                ? "STAR+PLUS is a Texas Medicaid program that helps adults with disabilities and Texans 65 and older who need nursing-level care remain at home, in adult foster care, or in assisted living. It covers both medical and personal support services, all coordinated through a managed care organization of your choosing."
                : "This program provides free home improvements to reduce your energy costs, including insulation, weather stripping, and furnace or cooling repairs. It is available in all 254 Texas counties, and both homeowners and renters can apply."}
            </p>
            )}
            {!isScsep && (
              <div className="mt-5 bg-success-50 rounded-xl border border-success-100 p-4 md:p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Estimated savings
                </h3>
                <p className="text-gray-700 text-sm">
                  {isPhc ? (
                    <>
                      Families typically save <span className="font-semibold text-gray-900">$1,000 to $5,000 per year</span> compared
                      to paying for private home care out of pocket in 2026.
                    </>
                  ) : isRespite ? (
                    <>
                      Respite care helps delay nursing home placement and reduce emergency costs. In Texas daily respite
                      care typically ranges from <span className="font-semibold text-gray-900">$25 to $200</span> depending
                      on the level of care needed, with round-the-clock support running{" "}
                      <span className="font-semibold text-gray-900">$120 to $200 per day</span>.
                    </>
                  ) : isCeap ? (
                    <>
                      Households typically receive <span className="font-semibold text-gray-900">$300 to $1,500 per year</span> in
                      energy bill assistance. Emergency heating and cooling repairs can save up to{" "}
                      <span className="font-semibold text-gray-900">$3,000 to $5,000</span>.
                    </>
                  ) : isPace ? (
                    <>
                      Texas PACE programs deliver cost savings of{" "}
                      <span className="font-semibold text-gray-900">15% to 17%</span> compared to nursing facility care.
                      Participants on Medicaid pay no monthly premium, with average savings of approximately{" "}
                      <span className="font-semibold text-gray-900">$2,800 per month ($33,600 annually)</span>.
                    </>
                  ) : isMow ? (
                    <>
                      Meals on Wheels participants typically save{" "}
                      <span className="font-semibold text-gray-900">$1,500 to $3,600 per year</span> on groceries and meal
                      preparation, while receiving daily nutrition and a regular wellness check from a volunteer.
                    </>
                  ) : isMepd ? (
                    <>
                      Enrollees typically save{" "}
                      <span className="font-semibold text-gray-900">$5,000 to $20,000+ per year</span> in 2026, with nursing
                      homes and long-term care averaging between{" "}
                      <span className="font-semibold text-gray-900">$3,000–$7,000+ monthly</span>.
                    </>
                  ) : isSnap ? (
                    <>
                      From <span className="font-semibold text-gray-900">$298 to $1,789 a month</span>, depending on how many
                      people are in your household — that&apos;s between{" "}
                      <span className="font-semibold text-gray-900">$3,576 and $21,468 in groceries per year</span>.
                    </>
                  ) : isMsp ? (
                    <>
                      Eligible Texans can save over{" "}
                      <span className="font-semibold text-gray-900">$2,400 annually</span> on Part B premiums and may automatically qualify for Extra Help, saving an estimated{" "}
                      <span className="font-semibold text-gray-900">additional $5,700 per year</span> on prescription drug costs.
                    </>
                  ) : isStarPlus ? (
                    <>
                      The STAR+PLUS Waiver can save senior citizens{" "}
                      <span className="font-semibold text-gray-900">tens of thousands of dollars annually</span> by covering
                      long-term care costs such as home health care, assisted living, and adult day care that might otherwise
                      be paid out of pocket.
                    </>
                  ) : (
                    <>
                      Households typically receive <span className="font-semibold text-gray-900">$5,000 to $8,000</span> in
                      free home improvements and can save an average of <span className="font-semibold text-gray-900">$372 or more on energy bills each year</span>,
                      with some homes seeing an increase in home value of up to $1,000.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Who it's for + Wait time */}
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Who it&apos;s for</h2>
              <ul className="space-y-3">
                {(isPhc
                  ? [
                      "Elderly (aged 65+) or disabled Texans who need assistance with daily tasks to remain living at home",
                    ]
                  : isRespite
                  ? [
                      "Family caregivers who need a temporary break from caring for an elderly loved one or someone with a disability or chronic health condition",
                    ]
                  : isScsep
                  ? [
                      "Low-income, unemployed individuals aged 55 and older",
                      "Participants receive paid, part-time training at an average of 20 hours per week",
                      "Training placements at local non-profits and public agencies",
                    ]
                  : isCeap
                  ? [
                      "Texas residents at or below 150% of the federal poverty level",
                      "U.S. citizens or qualified non-citizens",
                      "Priority for seniors 60+, people with disabilities, and families with young children",
                    ]
                  : isPace
                  ? [
                      "Adults age 55 or older",
                      "Live in a PACE service area in Texas",
                      "Meet nursing home-level of care requirements",
                      "Able to live safely in the community with PACE services",
                    ]
                  : isMow
                  ? [
                      "Homebound adults aged 60 or older",
                      "Individuals who have difficulty shopping for food or preparing meals",
                      "Seniors facing mobility issues or isolation who would benefit from a daily wellness check",
                    ]
                  : isMepd
                  ? [
                      "Texas residents aged 65 or older, or adults with disabilities, who meet strict income and asset limits",
                    ]
                  : isSnap
                  ? [
                      "Low-income individuals and families needing help buying nutritious food",
                    ]
                  : isStarPlus
                  ? [
                      "Texas residents with disabilities or chronic health conditions who meet income and asset requirements and need nursing-level care but choose to remain at home or in the community",
                    ]
                  : isMsp
                  ? [
                      "Texans with limited income and assets who are already eligible for Medicare Part A",
                    ]
                  : [
                      "Low-income households",
                      "Seniors and people with disabilities are given priority",
                      "Both homeowners and renters can apply",
                    ]
                ).map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isScsep ? "Duration" : isPace ? "Processing & Enrollment" : "Wait time"}
              </h2>
              {isMow ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Wait times vary by region. Statewide, 1 in 3 organizations has a waitlist, and waits can range from 4 months to over 2 years.
                  </p>
                  <ul className="space-y-1.5">
                    {[
                      { region: "San Antonio", detail: "Nearly 1,500 seniors on the waitlist, with wait times up to 8 months." },
                      { region: "Waco", detail: "Approximately 400 people on the waiting list." },
                      { region: "Rural Capital Area", detail: "Seniors may wait up to 4 months." },
                    ].map((item) => (
                      <li key={item.region} className="flex items-start gap-2 text-sm text-gray-700">
                        <svg className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>
                          <span className="font-semibold text-gray-900">{item.region}:</span> {item.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : isStarPlus ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-700">
                    Persons must put their name on an interest list to apply for STAR+PLUS HCBS. Unfortunately, the list is very long and the anticipated wait to be invited to apply is many years.{" "}
                    <span className="text-gray-500">Note: There are some exceptions.</span>
                  </p>
                  <div className="rounded-xl border border-warning-100 bg-warning-50/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-warning-700">36</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-snug">
                        In 2023, the average wait time for HCBS waivers across 27 states with waiting lists who responded was{" "}
                        <span className="font-semibold text-gray-900">36 months</span>.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700">
                  {isPhc
                    ? "Application process takes approximately 3 to 5 months."
                    : isRespite
                    ? "State-funded vouchers are typically reimbursed within 30 days. For Medicaid-based respite through STAR+PLUS, approval is managed through your individual service plan. Urgent requests due to a caregiver crisis can often be expedited within 24 to 48 hours through a private agency."
                    : isScsep
                    ? "Participants can take part in SCSEP for up to a 48-month lifetime limit across all time enrolled in the program."
                    : isCeap
                    ? "Applications are processed within 30 days of approval. The program runs September through March for heating assistance and April through August for cooling, with emergency help available during extreme weather."
                    : isPace
                    ? "Enrollment begins with a Medicaid eligibility determination, which generally takes 45 to 90 days. Once approved, a personalized care plan is developed within 30 days of joining."
                    : isMepd
                    ? "Applications officially take 45–90 days to process."
                    : isMsp
                    ? "45 days to process for applicants aged 65 or older, and up to 90 days if a disability determination is required."
                    : isSnap
                    ? "Texas SNAP benefits are legally required to be processed within 30 days, but average wait times often extend beyond this, sometimes taking up to 60 days due to high application volumes. Expedited services are available within 7 days for households with little or no money."
                    : "Priority applicants (seniors, people with disabilities, and families with young children) are typically seen within 30 business days. All other applicants can expect around 45 days for an appointment, followed by a waitlist for services."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect */}
      {!isMepd && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{isMsp ? "The Four Programs" : "What to Expect"}</h2>
            <p className="text-sm text-gray-500 mb-5">
              {isMsp
                ? "Each Medicare Savings Program has its own income rules and helps with different Medicare costs."
                : isPhc
                ? "Here's what the application and approval process looks like."
                : isRespite
                ? "Here's how respite care gets set up once you reach out."
                : isScsep
                ? "Here's what participants get from the SCSEP program."
                : isCeap
                ? "If approved, payments are sent directly to your utility company. Here's what the program covers."
                : isPace
                ? "Your care is managed by an interdisciplinary team that develops a customized plan and serves as your primary care provider."
                : isMow
                ? "Nutritious meals delivered on a schedule that works for you, plus a friendly check-in with every delivery."
                : isSnap
                ? "Here's how Texas SNAP benefits work once you're approved."
                : isStarPlus
                ? "Here's how STAR+PLUS services are assessed, delivered, and monitored."
                : "A simple 3-step process from start to finish."}
            </p>
            {isMsp ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: "Qualified Medicare Beneficiary (QMB)",
                    badge: "Most extensive help",
                    badgeColor: "bg-success-100 text-success-700 border-success-200",
                    definition: "Covers Part A and Part B premiums, deductibles, coinsurance, and copayments.",
                    detail: "Providers and suppliers are legally prohibited from billing QMB beneficiaries for Medicare cost-sharing.",
                    eligibility: "Income up to 100% of the Federal Poverty Level.",
                  },
                  {
                    name: "Specified Low-Income Medicare Beneficiary (SLMB)",
                    badge: "Pays Part B premium",
                    badgeColor: "bg-primary-100 text-primary-700 border-primary-200",
                    definition: "Pays only the monthly Medicare Part B premium.",
                    detail: null,
                    eligibility: "Income above 100% but less than 120% of the Federal Poverty Level.",
                  },
                  {
                    name: "Qualifying Individual (QI)",
                    badge: "First-come, first-served",
                    badgeColor: "bg-warning-100 text-warning-700 border-warning-200",
                    definition: "Pays only the monthly Medicare Part B premium.",
                    detail: "Funding is limited and approved on a first-come, first-served basis, with priority given to those who received it the previous year.",
                    eligibility: "Income between 120% and less than 135% of the Federal Poverty Level. Cannot be eligible for standard Medicaid.",
                  },
                  {
                    name: "Qualified Disabled and Working Individual (QDWI)",
                    badge: "Pays Part A premium",
                    badgeColor: "bg-secondary-100 text-secondary-700 border-secondary-200",
                    definition: "Pays only the Medicare Part A premium.",
                    detail: "Specifically for individuals with disabilities who returned to work, lost their premium-free Part A, and are not yet 65.",
                    eligibility: "Income and resources must be below specific state thresholds.",
                  },
                ].map((p, i) => (
                  <div key={p.name} className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25">
                        <span className="text-white font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 leading-snug">{p.name}</p>
                        <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${p.badgeColor}`}>
                          {p.badge}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Definition: </span>
                        {p.definition}
                      </p>
                      {p.detail && (
                        <p className="text-gray-700">
                          <span className="font-semibold text-gray-900">Key Detail: </span>
                          {p.detail}
                        </p>
                      )}
                      <p className="text-gray-700">
                        <span className="font-semibold text-gray-900">Eligibility: </span>
                        {p.eligibility}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isPhc ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Initial visit",
                    desc: "A care coordinator comes to your home within 1 to 3 days of your call to evaluate your needs.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                  },
                  {
                    title: "Approval process",
                    desc: "Full authorization depends on meeting financial and functional eligibility and can take a few weeks.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ),
                  },
                  {
                    title: "Veterans",
                    desc: "If you are a veteran, you may be referred to community care within 14 days.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isRespite ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Needs assessment",
                    desc: "An agency will assess your loved one's needs within five business days of your request.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    ),
                  },
                  {
                    title: "Choose your care setting",
                    desc: "Pick between in-home care or a short-term facility stay depending on what works best for your family.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                  },
                  {
                    title: "Share key information",
                    desc: "Be ready to share a care plan, medication list, and medical history with the respite team.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ),
                  },
                  {
                    title: "Ongoing services",
                    desc: "Services typically include medication management, meals, and social activities for your loved one.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isScsep ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Paid training",
                    desc: "You will earn at least minimum wage. This is a real paid position, not volunteer work.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ),
                  },
                  {
                    title: "Part-time placement",
                    desc: "About 20 hours a week at a local nonprofit, school, senior center, or government agency.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    ),
                  },
                  {
                    title: "Skill building",
                    desc: "Includes a personalized employment plan, on-the-job training, computer skills, and resume and interview preparation.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    ),
                  },
                  {
                    title: "Job search support",
                    desc: "The placement is designed as a stepping stone to permanent employment.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isCeap ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Bill payments",
                    desc: "Funds are sent directly to your electric, gas, or propane provider, not to you personally.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                  },
                  {
                    title: "Crisis help",
                    desc: "Emergency response within 48 hours for life-threatening situations like imminent disconnection or loss of heat.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    ),
                  },
                  {
                    title: "HVAC repairs",
                    desc: "Repair or replacement of heating and cooling units up to $3,000 to $5,000, and up to $9,000 for full replacements.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    ),
                  },
                  {
                    title: "Energy education",
                    desc: "All participants receive personalized tips on lowering future energy costs and making their home more efficient.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isMow ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    title: "Nutritious meals",
                    desc: "Each meal is designed to meet at least a third of the daily nutritional requirements for seniors.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    ),
                  },
                  {
                    title: "Flexible delivery",
                    desc: "Meals are delivered daily or in weekly batches, depending on your local provider.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    ),
                  },
                  {
                    title: "Wellness check",
                    desc: "Every delivery includes a brief wellness check from a volunteer — a friendly face ensuring you or your loved one is safe and doing well.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isSnap ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Using Benefits",
                    desc: "Approved benefits are loaded onto an Electronic Benefit Transfer (EBT) card, known as the Lone Star Card in Texas.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    ),
                  },
                  {
                    title: "Where to shop",
                    desc: "Use your Lone Star Card at any participating grocery store, farmers market, or retailer that accepts SNAP.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                  },
                  {
                    title: "Monthly reload",
                    desc: "Your benefits are automatically reloaded onto your Lone Star Card each month based on a schedule tied to your case number.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    ),
                  },
                  {
                    title: "Keep your benefits",
                    desc: "Report household or income changes, and recertify before your benefit period ends to keep benefits active without a gap.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isStarPlus ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Assessment Process",
                    desc: "An assessment determines if you meet the \"medical necessity\" criteria for nursing home care to qualify for services.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    ),
                  },
                  {
                    title: "Service Delivery",
                    desc: "Services may include in-home support, nursing care, personal assistance, and home modifications.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                  },
                  {
                    title: "Quality Audits",
                    desc: "Managed Care Organizations (MCOs) perform audits on providers to ensure services are delivered correctly.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isPace ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "Interdisciplinary care team",
                    desc: "Your PACE team includes doctors, nurses, therapists, and social workers who coordinate every aspect of your care together.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                  },
                  {
                    title: "Personalized care plan",
                    desc: "The team becomes your primary care provider and develops a customized plan designed around your goals and medical needs.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    ),
                  },
                  {
                    title: "PACE center visits",
                    desc: "Participants typically attend a PACE center for meals, activities, therapy, and medical care in one coordinated location.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    ),
                  },
                  {
                    title: "Relief for family caregivers",
                    desc: "Because PACE handles medical care, transportation, meals, and activities, it provides meaningful relief for family caregivers at home.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    step: 1,
                    title: "Home Energy Audit",
                    desc: "A professional auditor visits to assess energy use, check for air leaks, and inspect heating and cooling equipment.",
                  },
                  {
                    step: 2,
                    title: "Custom Recommendations",
                    desc: "Based on the audit, you get a tailored plan of the most effective improvements and a walkthrough of the timeline.",
                  },
                  {
                    step: 3,
                    title: "Final Inspection",
                    desc: "Once the work is complete, an inspector reviews everything to ensure it meets safety standards and was done correctly.",
                  },
                ].map((item) => (
                  <div key={item.step} className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25">
                        <span className="text-white font-bold text-sm">{item.step}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                    </div>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* What the program includes / Where You Will Train */}
      {!isMow && (
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {isScsep ? "Where You Will Train" : "What the program includes"}
            </h2>
            {!isMow && (
              <p className="text-sm text-gray-500 mb-5">
                {isPhc
                  ? "Personal attendant services to help you with daily activities at home."
                  : isRespite
                  ? "Temporary support so family caregivers can take a break while their loved one is cared for."
                  : isScsep
                  ? "SCSEP places participants at a wide range of local organizations across Texas."
                  : isCeap
                  ? "Help paying electric, natural gas, and propane bills, plus emergency HVAC repairs and water or wastewater assistance."
                  : isPace
                  ? "A complete set of medical and support services delivered through your local PACE center."
                  : isMepd
                  ? "Comprehensive health coverage plus long-term services and supports for eligible Texans."
                  : isSnap
                  ? "What you can and can't buy with your Lone Star Card."
                  : isStarPlus
                  ? "Helps pay for a broad range of medical and care services, including:"
                  : isMsp
                  ? "State-run programs that help people with low income pay for their Medicare costs."
                  : "Free home improvements designed to lower your energy bills."}
              </p>
            )}
            {isMow && <div className="mb-5" />}
            {isPhc ? (
              <div className="flex flex-wrap gap-2">
                {[
                  "Bathing",
                  "Dressing",
                  "Meal preparation",
                  "Feeding and eating assistance",
                  "Exercise",
                  "Grooming",
                  "Hair and skin care",
                  "Medication reminders and assistance",
                  "Toileting",
                  "Transfers and positioning",
                  "Ambulation and mobility",
                  "Cleaning",
                  "Laundry",
                  "Shopping",
                  "Escort and transportation assistance",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium text-primary-800"
                  >
                    <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            ) : isScsep ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Schools",
                    "Libraries",
                    "Recycling centers",
                    "Senior centers",
                    "Local housing authorities",
                    "Historic sites",
                    "Museums",
                    "Workforce Solutions offices",
                    "Government agencies",
                    "Nonprofit organizations",
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 border border-primary-100 rounded-full text-sm font-medium text-primary-800"
                    >
                      <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Government agencies include Texas Health and Human Services and the U.S. Social Security Administration. Nonprofits include food pantries, Boys &amp; Girls Clubs of America, community action agencies, and Goodwill.
                </p>
              </>
            ) : isRespite ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: "In-home support",
                    desc: "A trained caregiver comes to your home to help with bathing, dressing, and meal preparation.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                  },
                  {
                    title: "Community-based care",
                    desc: "Adult day centers provide social activities and supervision during the day.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                  },
                  {
                    title: "Short-term facility stays",
                    desc: "Temporary care in a nursing home or assisted living for emergencies or when a caregiver needs extended time away.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    ),
                  },
                  {
                    title: "Caregiver vouchers",
                    desc: "The state issues a one-time voucher of up to $800 that can be used all at once or gradually over three months with a provider you trust.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isMow ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    title: "Delivery & Safety",
                    desc: "Programs provide hot, nutritious meals — often designed by dietitians — along with a safety check and companionship during each visit.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ),
                  },
                  {
                    title: "Additional Support",
                    desc: "Beyond meals, many branches offer pet food, transportation to medical appointments, and home repairs.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                  },
                  {
                    title: "Service Model",
                    desc: "Meals on Wheels is a decentralized network of local providers that rely on volunteers to deliver meals directly to clients' homes.",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.icon}
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : isMepd ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: "Medical Coverage",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                    items: [
                      "Regular checkups at the doctor",
                      "Medicine and vaccines",
                      "Hospital care and services",
                      "X-rays and lab tests",
                      "Vision and hearing care",
                      "Access to medical specialists and mental health care",
                      "Treatment of special health needs and pre-existing conditions",
                    ],
                  },
                  {
                    title: "Long-Term Services & Supports",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                    items: [
                      "Home care and personal care, like having someone help monitor your health and help you with daily activities",
                      "Having somebody take your child to their medical appointments",
                      "Nursing home care",
                      "A hospital for mental illnesses",
                      "A place of care for people with intellectual disabilities",
                    ],
                  },
                ].map((group) => (
                  <div key={group.title} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {group.icon}
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                    </div>
                    <ul className="space-y-2">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-xs text-gray-700 leading-snug">
                          <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="pt-0.5">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : isSnap ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-success-50 border border-success-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-success-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">You can use the card for</p>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Fruits, vegetables, garden seeds, and plants that produce food",
                        "Milk, milk substitutes, and other dairy products",
                        "Bread and cereal",
                        "Meat, fish, and poultry",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-700 leading-snug">
                          <svg className="w-3.5 h-3.5 text-success-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">You can&apos;t use the card for</p>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Tobacco",
                        "Alcohol",
                        "Non-food items",
                        "Vitamins and medicines",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-700 leading-snug">
                          <svg className="w-3.5 h-3.5 text-red-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-warning-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">New restrictions starting April 1, 2026</p>
                      <p className="mt-1 text-sm text-gray-700">SNAP recipients will no longer be able to use benefits to purchase:</p>
                    </div>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {[
                      "Candy, including candy bars, gum, taffy, and nuts, raisins, or fruits that have been candied, crystalized, glazed, or coated with chocolate, yogurt, or caramel",
                      "Sweetened drinks, including non-alcoholic beverages made with water that contain 5 grams or more of added sugar or any amount of artificial sweetener",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-700 leading-snug">
                        <svg className="w-3.5 h-3.5 text-warning-700 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 ml-11 pt-3 border-t border-warning-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Beverages you can still buy:</p>
                    <ul className="space-y-2">
                      {[
                        "Drinks that contain milk or milk products like soy, rice, or similar milk substitutes",
                        "Drinks that are more than 50% vegetable or fruit juice by volume",
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-700 leading-snug">
                          <svg className="w-3.5 h-3.5 text-success-600 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <a
                  href="https://youtu.be/uqxTLiE9WdM?si=h5Hqf1hG8PJMIvlg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-600 no-underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Watch the video to learn more
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ) : isMsp ? (
              <div className="space-y-4">
                <p className="text-gray-700 text-sm">
                  The Medicare Savings Programs (MSPs) are state-run programs that help people with low income pay for their Medicare costs. These costs include:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      title: "Premiums",
                      desc: "Money you pay to keep your Medicare plan",
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ),
                    },
                    {
                      title: "Deductibles",
                      desc: "Money you pay before Medicare pays for your care",
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      ),
                    },
                    {
                      title: "Copays",
                      desc: "A set fee you pay to visit your regular doctor or a specialist",
                      icon: (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      ),
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {item.icon}
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                        <p className="mt-0.5 text-xs text-gray-600 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isStarPlus ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    title: "Medical & Clinical Care",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                    items: [
                      "Nursing services",
                      "Medical care & supplies",
                      "Physical, occupational & speech therapy",
                      "Personal emergency response service",
                    ],
                  },
                  {
                    title: "In-Home & Personal Support",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    ),
                    items: [
                      "Home care",
                      "Personal care (can be self-directed)",
                      "Delivered meals",
                      "Respite care",
                    ],
                  },
                  {
                    title: "Home Environment",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                    items: [
                      "Home modifications",
                      "Environmental adaptive aids",
                      "Transitional services",
                    ],
                  },
                  {
                    title: "Community Living",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    ),
                    items: [
                      "Adult day care & adult day health",
                      "Adult foster care",
                      "Assisted living",
                    ],
                  },
                ].map((group) => (
                  <div key={group.title} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {group.icon}
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                    </div>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-gray-700 leading-snug">
                          <svg className="w-3 h-3 text-success-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : isPace ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    title: "Medical Care",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    ),
                    items: [
                      "Primary care (doctor & nursing)",
                      "Medical specialty services",
                      "Preventive care",
                      "Emergency services",
                      "Hospital care",
                      "Nursing home care",
                      "Laboratory & x-ray services",
                      "Prescription drugs",
                    ],
                  },
                  {
                    title: "Therapy & Rehabilitation",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    ),
                    items: [
                      "Physical therapy",
                      "Occupational therapy",
                      "Speech therapy",
                    ],
                  },
                  {
                    title: "Daily Living & Support",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    ),
                    items: [
                      "Home care",
                      "Personal care & support services",
                      "Adult day care (meals & recreational therapy)",
                      "Transportation to PACE center & appointments",
                    ],
                  },
                  {
                    title: "Wellness & Counseling",
                    icon: (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    ),
                    items: [
                      "Dentistry",
                      "Mental health counseling",
                      "Nutritional counseling",
                      "Social services",
                    ],
                  },
                ].map((group) => (
                  <div key={group.title} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {group.icon}
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{group.title}</p>
                    </div>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={item} className="flex items-start gap-1.5 text-xs text-gray-700 leading-snug">
                          <svg className="w-3 h-3 text-success-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(isCeap ? [
                {
                  title: "Electric, Gas & Propane Bills",
                  desc: "Direct payments to your utility company for your electric, natural gas, or propane bill.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  ),
                },
                {
                  title: "Past-Due Balances",
                  desc: "Help catching up on overdue balances to keep the lights on and avoid shut-off.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ),
                },
                {
                  title: "Reconnection Fees",
                  desc: "If your service has already been disconnected, CEAP can help cover reconnection fees to get you back on.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  ),
                },
                {
                  title: "Emergency HVAC Repairs",
                  desc: "Repair or replacement of broken heating and cooling units up to $3,000 to $5,000, and up to $9,000 for full replacements.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  ),
                },
                {
                  title: "Water & Wastewater Help",
                  desc: "Up to $600 toward past due and current water and wastewater bills, requested on the same CEAP application.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 14.66V20a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5.34M18 2l4 4-10 10H8v-4L18 2z" />
                  ),
                },
                {
                  title: "Energy Education",
                  desc: "Personalized tips and guidance on lowering your future energy bills and making your home more efficient.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  ),
                },
              ] : [
                {
                  title: "Insulation",
                  desc: "Added insulation in attics, walls, and floors to keep your home warmer in winter and cooler in summer.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  ),
                },
                {
                  title: "Weather Stripping",
                  desc: "Sealing doors and windows with caulking and weather stripping to stop drafts and air leaks.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  ),
                },
                {
                  title: "Air Leak Sealing",
                  desc: "Sealing hidden air leaks throughout your home that waste energy and raise your bills.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  ),
                },
                {
                  title: "HVAC Tune-up",
                  desc: "Heating and cooling tune-ups, repairs, or even full replacements when needed for efficiency.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  ),
                },
                {
                  title: "Duct Repairs",
                  desc: "Fixing leaky or damaged ductwork so heated and cooled air actually reaches your rooms.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  ),
                },
                {
                  title: "Energy Audit",
                  desc: "A full home energy audit to pinpoint where your home is losing the most energy.",
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  ),
                },
              ]).map((item) => (
                <div key={item.title} className="flex items-start gap-4 bg-gray-50 border border-gray-100 rounded-xl p-5">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            )}
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
                    question: "Does the Texas Weatherization Program cover air conditioner repairs?",
                    answer:
                      "Yes. Weatherization includes tune-ups, repairs, and — when cost-effective — replacement of central air conditioners, window units, heat pumps, and furnaces. HVAC work is a major part of the program in Texas because cooling drives summer energy bills. The energy auditor will test your system and decide what's needed based on your home's audit results.",
                  },
                  {
                    question: "How much does the Texas Weatherization Program pay for?",
                    answer:
                      "The program pays 100% of approved weatherization work — there is no cost to you out of pocket. Spending per home is capped by a federal average that adjusts each year, but households in Texas typically receive between $5,000 and $8,000 in free home improvements. The exact amount depends on what the energy audit identifies as cost-effective for your specific home.",
                  },
                  {
                    question: "Is the Texas Weatherization Assistance Program still available in 2026?",
                    answer:
                      "Yes. WAP is a long-running federal program funded by the U.S. Department of Energy and delivered in Texas by TDHCA through 22 local subrecipient agencies. It is active in 2026 and accepting applications, though waitlists are common — apply as early as you can.",
                  },
                ]
              : oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap"
              ? [
                  {
                    question: "What is the difference between CEAP and LIHEAP in Texas?",
                    answer:
                      "LIHEAP (Low Income Home Energy Assistance Program) is the federal program that provides the funding, and CEAP (Comprehensive Energy Assistance Program) is the name Texas uses for its LIHEAP-funded program. The money is the same — it comes from the U.S. Department of Health and Human Services and is passed through the Texas Department of Housing and Community Affairs (TDHCA), which distributes it to local Community Action Agencies that take applications and send payments directly to your utility company.",
                  },
                  {
                    question: "Does Texas CEAP help with past-due utility bills?",
                    answer:
                      "Yes. CEAP can pay current and past-due electric, natural gas, and propane bills, and it can help restore service that has already been disconnected. If you are in a utility crisis — for example, you have a disconnection notice or your service has been cut off — contact your local Community Action Agency right away and ask about priority or crisis assistance.",
                  },
                  {
                    question: "Can CEAP help if my air conditioner breaks in the summer?",
                    answer:
                      "Yes. CEAP includes emergency HVAC assistance that can pay for repair or replacement of a broken heating or cooling system when it creates a life-threatening situation, especially for households with seniors, young children, or people with disabilities. Coverage can reach several thousand dollars depending on the local agency and available funds. Call your local CEAP agency as soon as possible, because funding is limited and requests are handled on a first-come, first-served basis.",
                  },
                ]
              : isPhc
              ? [
                  {
                    question: "Is there a waitlist for Primary Home Care in Texas?",
                    answer:
                      "Primary Home Care is an entitlement benefit under Texas Medicaid, so there is generally no waitlist — if you qualify, you are entitled to services. That said, the application and assessment process typically takes 3 to 5 months from the time you apply to the time services begin, and local provider capacity can sometimes affect how quickly an attendant is assigned in your area.",
                  },
                  {
                    question: "Can a family member be paid as my home care attendant in Texas?",
                    answer:
                      "Yes, in most cases. Texas allows many family members — including adult children, grandchildren, siblings, and other relatives — to be hired and paid as your PHC attendant through a participating provider agency. Spouses and legal guardians are generally not eligible to be paid caregivers under PHC. You will need to choose a provider agency that allows family hires and have your relative complete the agency's hiring and training process.",
                  },
                  {
                    question: "What is the difference between Primary Home Care and STAR+PLUS in Texas?",
                    answer:
                      "Primary Home Care (PHC) is a non-medical attendant care benefit available through traditional fee-for-service Texas Medicaid. STAR+PLUS is a Medicaid managed care program for adults with disabilities and seniors that includes attendant services as part of a broader package — including medical care, long-term services and supports, and in some cases waiver services for nursing facility-level care. Most Medicaid-eligible adults in Texas receive attendant services through STAR+PLUS rather than traditional PHC.",
                  },
                ]
              : isPace
              ? [
                  {
                    question: "What is the PACE program and how does it help seniors avoid nursing homes?",
                    answer:
                      "PACE (Program of All-Inclusive Care for the Elderly) is a Medicare and Medicaid program that provides complete medical and long-term care services to older adults who qualify for nursing home care but want to continue living in their own home. A PACE interdisciplinary team — doctors, nurses, therapists, social workers, and home care aides — coordinates every aspect of care, including primary care, specialist visits, prescriptions, transportation, meals, and in-home support. By wrapping all of these services around the participant, PACE helps seniors stay safely in the community instead of moving into a nursing facility.",
                  },
                  {
                    question: "How much does PACE cost compared to nursing home care in Texas?",
                    answer:
                      "For dual-eligible seniors (those with both Medicare and Medicaid), PACE is typically free — no monthly premiums, deductibles, copays, or coinsurance for approved services. Nursing home care in Texas, by comparison, averages around $5,000–$7,000 per month for a semi-private room and often requires families to spend down assets or rely on Medicaid long-term care. Studies show PACE can save families and the state an estimated 15–17% compared to equivalent nursing facility care, while keeping the participant at home.",
                  },
                  {
                    question: "What medical services are covered under the PACE program for elderly adults?",
                    answer:
                      "PACE covers nearly every service a participant needs — primary and specialty medical care, prescription drugs, hospital and nursing home stays, physical, occupational, and speech therapy, home care, meals and nutritional counseling, dental, vision, hearing, mental health services, social work, caregiver support, and transportation to and from the PACE center or medical appointments. If the interdisciplinary team approves a service, it's covered.",
                  },
                ]
              : isMow
              ? [
                  {
                    question: "How does Meals on Wheels support seniors beyond just delivering food?",
                    answer:
                      "Meals on Wheels delivers far more than a meal. Every drop-off doubles as a daily wellness check — volunteers confirm the senior is safe, notice any changes in health or home conditions, and report concerns back to the program. For many homebound seniors, their Meals on Wheels volunteer is the only person they see that day, making the program a critical lifeline against isolation. Many programs also provide pet food, emergency shelf-stable meals, fans and heaters during extreme weather, and referrals to other community services like transportation, home repair, and in-home care.",
                  },
                  {
                    question: "How long is the wait for Meals on Wheels in Texas?",
                    answer:
                      "Wait times vary significantly by region. In San Antonio, nearly 1,500 seniors are currently waiting up to eight months for service. In Waco, the Meals on Wheels program has a waitlist of around 400 seniors. Rural Capital Area programs report waits of up to four months. Other areas with fewer homebound seniors or stronger funding may have little to no wait. It's always best to contact your local provider directly to get a current estimate.",
                  },
                  {
                    question: "How much does Meals on Wheels cost for seniors in Texas?",
                    answer:
                      "Meals on Wheels in Texas is generally free or low-cost for eligible seniors. Most programs operate on a suggested donation or sliding scale basis — no one is turned away because they can't afford to contribute. Programs are funded through the federal Older Americans Act, state funding, local donations, and grants, so the out-of-pocket cost to the senior is typically zero.",
                  },
                ]
              : isMepd
              ? [
                  {
                    question: "How does Medicaid for the Elderly and People with Disabilities differ from standard Medicaid in Texas?",
                    answer:
                      "Standard Texas Medicaid is built around families, pregnant women, and children, with income limits that are very low for adults. Medicaid for the Elderly and People with Disabilities (MEPD) is a separate set of rules specifically for people 65+, blind, or disabled — it uses higher income and asset limits based on SSI, counts a home and one vehicle as exempt, and opens the door to long-term services and supports (nursing facility care, STAR+PLUS managed care, and waiver programs) that standard Medicaid doesn't cover for most adults.",
                  },
                  {
                    question: "How much can a senior save annually by qualifying for Medicaid for the Elderly and People with Disabilities in Texas?",
                    answer:
                      "Savings depend on the care a senior needs, but they add up fast. MEPD typically covers doctor visits, hospital stays, prescriptions, medical equipment, and — for those who qualify — long-term care in the home or a nursing facility. A senior paying out of pocket for in-home attendant care can spend $25,000–$40,000 per year, and nursing home care in Texas averages $70,000–$90,000 per year. MEPD can reduce most or all of those costs to zero, and it also covers Medicare premiums, deductibles, and coinsurance for dual-eligible enrollees, saving another $2,000+ per year.",
                  },
                  {
                    question: "What long-term care services does Medicaid for the Elderly and People with Disabilities cover beyond doctor visits?",
                    answer:
                      "MEPD is the gateway to Texas's long-term services and supports. Beyond standard medical care, it can cover nursing facility stays, in-home attendant services (bathing, dressing, meals, light housekeeping), adult day care, home health nursing, therapies, medical supplies and equipment, personal emergency response systems, and — through STAR+PLUS and waiver programs — home and community-based services that help people stay in their own homes instead of moving to a facility.",
                  },
                ]
              : isSnap
              ? [
                  {
                    question: "How much can a Texas household receive in SNAP benefits per month?",
                    answer:
                      "SNAP benefits in Texas are based on household size and net income after allowable deductions. In 2026, the maximum monthly benefit ranges from $298 for a single person to $1,789 for a household of eight, plus an additional $224 for each extra person. Most single Texas seniors receive between $100 and $300 per month depending on their income, rent, utilities, and out-of-pocket medical expenses, while larger families and households with very low income typically qualify for the maximum amount.",
                  },
                  {
                    question: "What changes are coming to SNAP benefits in Texas in 2026?",
                    answer:
                      "Starting April 1, 2026, new federal restrictions prevent SNAP benefits from being used to buy candy and sweetened beverages — including soda, sports drinks, and most sweetened energy drinks. You can still use your Lone Star Card for unsweetened beverages like bottled water, milk, 100% fruit juice, and unsweetened coffee or tea. All other eligible grocery items — fruits, vegetables, meat, dairy, bread, and cereal — remain fully covered, and monthly benefit amounts continue to adjust each October based on the Thrifty Food Plan.",
                  },
                  {
                    question: "Can SNAP benefits be used to buy seeds and plants in Texas?",
                    answer:
                      "Yes. Texas SNAP recipients can use their Lone Star Card to purchase food-producing seeds and plants — including vegetable, fruit, and herb seeds or starter plants — at any retailer that accepts SNAP, including grocery stores, nurseries, and farmers markets. This lets households grow their own food at home and stretch their benefits further. Non-food plants like flowers and ornamental trees are not eligible.",
                  },
                ]
              : isStarPlus
              ? [
                  {
                    question: "What is the STAR+PLUS Waiver and how does it help seniors avoid nursing homes in Texas?",
                    answer:
                      "The STAR+PLUS Home and Community-Based Services (HCBS) Waiver is a Texas Medicaid program that helps adults with disabilities and seniors 65+ who meet nursing facility level of care stay at home or in the community instead of moving into a nursing home. It combines medical care and long-term services and supports — like in-home attendant care, nursing, home modifications, adult day care, and assisted living — all coordinated through a managed care organization (MCO) of the member's choosing. By wrapping those services around the participant, STAR+PLUS lets seniors age in place safely.",
                  },
                  {
                    question: "How much can Texas seniors save on long-term care costs through the STAR+PLUS program?",
                    answer:
                      "The STAR+PLUS Waiver can save senior citizens tens of thousands of dollars annually by covering long-term care costs that would otherwise be paid out of pocket. Nursing home care in Texas averages $70,000–$90,000 per year, in-home attendant care runs $25,000–$40,000 per year, and assisted living is $45,000–$60,000 per year. STAR+PLUS can reduce most or all of those costs to zero for qualifying members because services are provided through Texas Medicaid.",
                  },
                  {
                    question: "What services does the STAR+PLUS Waiver cover for elderly adults living at home in Texas?",
                    answer:
                      "STAR+PLUS HCBS covers a broad package of medical and personal support services, including nursing services, personal care and attendant services, home delivered meals, respite care, adult day care and adult foster care, assisted living, home modifications and environmental adaptive aids, physical/occupational/speech therapy, medical supplies, personal emergency response systems, and transitional services. A service coordinator from the member's chosen MCO builds a personalized care plan based on assessed needs.",
                  },
                ]
              : isRespite
              ? [
                  {
                    question: "What is respite care and how does it help families caring for aging parents?",
                    answer:
                      "Respite care provides short-term relief for family caregivers by arranging temporary care for an aging loved one — in the home, at an adult day center, or in a residential facility. It lets caregivers rest, run errands, work, or recover from illness without leaving their parent unattended, and it helps prevent the caregiver burnout that often drives families toward permanent long-term placement.",
                  },
                  {
                    question: "How much does respite care cost for seniors in Texas?",
                    answer:
                      "Costs vary by setting. In-home respite typically runs $20–$35/hour, adult day centers average $75–$100/day, and short overnight stays in an assisted living or nursing facility often run $150–$300/day. Texas Medicaid waivers (like STAR+PLUS, CLASS, and the Lifespan Respite Care Program) can cover respite at little or no cost for eligible families, and regional nonprofits like the Concho Valley Respite Program offer free or low-cost services in their service area.",
                  },
                  {
                    question: "What is the difference between in-home respite care and facility-based respite care for elderly adults?",
                    answer:
                      "In-home respite brings a trained caregiver to your loved one's home for a few hours at a time — ideal if your parent is more comfortable in familiar surroundings or has limited mobility. Facility-based respite takes place at an adult day center or a residential facility (assisted living or nursing home) for a day or overnight stay, which is better suited for longer breaks or when your parent needs 24-hour supervision.",
                  },
                ]
              : isMsp
              ? [
                  {
                    question: "What is the difference between the four Medicare Savings Programs in Texas?",
                    answer:
                      "Texas offers four Medicare Savings Programs, each tied to a different income range and benefit level. The Qualified Medicare Beneficiary (QMB) program is the most generous — it pays Medicare Part A and Part B premiums, deductibles, coinsurance, and copays for people with the lowest incomes. The Specified Low-Income Medicare Beneficiary (SLMB) program pays only the Part B premium for people with slightly higher income. The Qualifying Individual (QI) program also pays the Part B premium but is funded by a limited annual block grant and must be renewed every year. The Qualified Disabled and Working Individual (QDWI) program pays the Part A premium for working people with disabilities under 65 who lost their free Part A. Texas HHSC will automatically place you in the program you qualify for based on income and assets.",
                  },
                  {
                    question: "Can a Texas senior qualify for both a Medicare Savings Program and Extra Help for prescriptions?",
                    answer:
                      "Yes — and most seniors who qualify for an MSP are automatically enrolled in Extra Help (the Low Income Subsidy, or LIS) for Medicare Part D prescription drug costs. If you qualify for QMB, SLMB, or QI in Texas, the Social Security Administration is notified and will automatically deem you eligible for Extra Help, which lowers your monthly Part D premium, eliminates the deductible, and caps your prescription copays at just a few dollars per drug. You don't have to file a separate application, but if you don't see the Extra Help benefit on your next pharmacy visit, call Social Security at 1-800-772-1213 to confirm your status.",
                  },
                  {
                    question: "How do Medicare Savings Programs work alongside existing Medicare coverage in Texas?",
                    answer:
                      "Medicare Savings Programs don't replace your Medicare — they pay for the parts of Medicare you'd normally owe out of pocket. You keep your same red, white, and blue Medicare card, your same doctors, and the same Part A and Part B coverage. If you're in QMB, the state pays your Part A and Part B premiums and providers cannot bill you for deductibles, copays, or coinsurance on Medicare-covered services. If you're in SLMB or QI, the state pays your Part B premium, which adds about $185 back into your monthly Social Security check. You can use an MSP with Original Medicare, a Medicare Advantage plan, or a Medigap policy.",
                  },
                ]
              : program.faqs
          }
        />
      </div>

      <HomeCareBridgeCta
        stateCode="TX"
        stateName="Texas"
        heading={isMepd ? "Need Help With Care?" : undefined}
      />
    </div>
  );
}
