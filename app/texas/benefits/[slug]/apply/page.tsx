import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramById } from "@/data/waiver-library";
import { ProgramTabs } from "@/components/waiver-library/ProgramTabs";
import { ProgramFaqSection } from "@/components/waiver-library/ProgramFaqSection";
import { HomeCareBridgeCta } from "@/components/waiver-library/HomeCareBridgeCta";
import { TexasProgramHero } from "@/components/waiver-library/TexasProgramHero";
import { WeatherizationLocationFinder } from "@/components/waiver-library/WeatherizationLocationFinder";
import { CeapLocationFinder } from "@/components/waiver-library/CeapLocationFinder";
import { ScsepLocationFinder } from "@/components/waiver-library/ScsepLocationFinder";
import { PhcLocationFinder } from "@/components/waiver-library/PhcLocationFinder";
import { MealsOnWheelsLocationFinder } from "@/components/waiver-library/MealsOnWheelsLocationFinder";
import { MepdLocationFinder } from "@/components/waiver-library/MepdLocationFinder";
import { StarPlusLocationFinder } from "@/components/waiver-library/StarPlusLocationFinder";
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
  const title = `How to Apply for ${program.name} | Texas | Olera`;
  return {
    title,
    description: `Step-by-step instructions, application links, and county contacts for ${program.shortName} in Texas.`,
    alternates: { canonical: `/texas/benefits/${slug}/apply` },
  };
}

export default async function TexasApplyPage({ params }: Props) {
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
      <TexasProgramHero program={program} slug={slug} currentPage="How to Apply" />
      <ProgramTabs basePath={basePath} />

      {/* Documents checklist CTA */}
      <section className="py-6 md:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Documents You Will Need</h2>
                <p className="text-sm text-gray-500 mt-0.5">Gather these before you apply to speed things up.</p>
              </div>
            </div>
            <ul className={`mt-5 grid grid-cols-1 gap-x-6 gap-y-3 ${isPhc ? "sm:grid-cols-2 [&>li:last-child]:sm:col-span-2" : isRespite ? "sm:grid-cols-2" : isPace ? "sm:grid-cols-2" : isMow ? "sm:grid-cols-2" : isMepd ? "sm:grid-cols-2" : isStarPlus ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {(isMsp
                ? [
                    "The amount of income you get from jobs and other sources",
                    "Asset information, such as bank and investment account balances",
                    "Medicare numbers, Social Security numbers, and birth dates of everyone applying or in your household",
                  ]
                : isStarPlus
                ? [
                    "Social Security cards",
                    "Medicare cards",
                    "Life insurance policies",
                    "Property deeds",
                    "Pre-need burial contracts",
                    "Bank statements up to 60 months prior to application",
                    "Proof of income",
                  ]
                : isMepd
                ? [
                    "Government-issued photo ID",
                    "Social Security card",
                    "Proof of citizenship or qualified alien status",
                    "Proof of Texas residency",
                    "Proof of income (pay stubs, award letters, pension statements)",
                    "Bank statements for all accounts",
                    "Insurance policies (life and burial)",
                    "Property documents (deeds, tax statements, royalty statements)",
                    "Investment documents (stocks, bonds, annuities, trust agreements)",
                    "Health insurance information",
                    "Utility bills",
                    "Rent or mortgage statements",
                    "Legal documents if you have a representative (power of attorney, guardianship order)",
                    "Child support documentation (if applicable)",
                    "Loan or gift documentation (if applicable)",
                  ]
                : isMow
                ? [
                    "Government-issued photo ID to verify age",
                    "Proof of address (utility bill, lease, or mortgage statement)",
                    "Documentation of homebound status or medical necessity (note from a physician if requested)",
                    "Basic medical information — diagnoses, mobility limitations, and any dietary restrictions",
                    "Financial information or insurance details (requested by some providers)",
                    "Emergency contact information",
                  ]
                : isPace
                ? [
                    "Government-issued photo ID (driver's license or passport)",
                    "Birth certificate and Social Security card",
                    "Medicare and/or Medicaid card",
                    "Current doctor-signed medical records detailing diagnoses",
                    "List of current medications",
                    "Proof of income (Social Security check, pay stub)",
                    "Bank statements for the last 3 months",
                    "Proof of assets (property, investments)",
                    "Proof of residency in the PACE service area (utility bill, lease, or mortgage statement)",
                  ]
                : isPhc
                ? [
                    "Proof of age and identity (birth certificate, driver's license)",
                    "Proof of Texas residency",
                    "Proof of income (Social Security check, bank statements) and assets",
                    "Social Security card for the applicant",
                    "Medical documentation — doctor's assessment of functional limitations and care needs",
                  ]
                : isRespite
                ? [
                    "Proof of Texas residency",
                    "Proof of age and U.S. citizenship or legal status",
                    "Proof of Medicaid enrollment",
                    "Physician referral or prescription for services",
                    "Medical records including diagnoses, medications, and current care plan",
                    "Formal plan of care signed by the family or legal guardian",
                    "Emergency contact information",
                  ]
                : isScsep
                ? [
                    "Government-issued photo ID (driver's license or passport)",
                    "Social Security card and birth certificate",
                    "Proof of all income (pay stubs, tax return, SSI letter)",
                    "Bank statements from the past 3 months",
                    "Proof of Texas residency (utility bill or lease)",
                    "DD-214 for veterans, or disability documentation (if applicable)",
                  ]
                : isCeap
                ? [
                    "Valid government-issued photo ID",
                    "Proof of citizenship or legal residency for all household members",
                    "Proof of income from the last 30 days (pay stubs, SSI letter, or tax return)",
                    "Most recent electric bill",
                    "Most recent gas or propane bill",
                    "Names and dates of birth for everyone in the household",
                  ]
                : [
                    "Proof of income (pay stubs, SSI, disability, or pension letter)",
                    "Names and dates of birth for everyone in the home",
                    "12 months of electric and gas bill history",
                    "Mortgage statement or tax bill (if you own)",
                    "Signed Landlord Agreement (if you rent)",
                    "Government-issued photo ID",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            {isRespite && (
              <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                <p className="font-semibold text-gray-900 mb-1">If Applying Through STAR+PLUS or CCSE</p>
                <p className="text-sm text-gray-700">
                  You will also need to provide proof of age (65 or older), low income documentation meeting Medicaid eligibility requirements, and a functional assessment showing medical need for care.
                </p>
              </div>
            )}
            {isMow && (
              <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                <p className="font-semibold text-gray-900 mb-1">Initial Assessment</p>
                <p className="text-sm text-gray-700">
                  Most local Meals on Wheels providers will walk through this information during a short intake assessment — either by phone or during a first home visit. Requirements can vary slightly by provider, so your local office may ask for additional documents.
                </p>
              </div>
            )}
            {isPace && (
              <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                <p className="font-semibold text-gray-900 mb-1">If Applying Through Medicaid</p>
                <p className="text-sm text-gray-700">
                  If you plan to enroll in PACE through Medicaid, you will also need to provide all of the documentation required for a Texas Medicaid application, including detailed financial records, asset verification, and any additional forms requested by your local HHSC office.
                </p>
              </div>
            )}
            {isMepd && (
              <div className="mt-5 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
                <p className="font-semibold text-gray-900 mb-1">Proof of Income & Deductions</p>
                <p className="text-sm text-gray-700">
                  HHSC requires proof of income and deductions from income, such as award letters, check stubs from pension checks, check stubs from mineral rights payments, amortization schedules, bank statements listing interest or dividend payments, rent receipts (tax, insurance, and repair expense receipts), and copies of checks.
                </p>
              </div>
            )}
            {isStarPlus && (
              <div className="mt-5 rounded-xl border border-warning-100 bg-warning-50/60 p-4">
                <p className="font-semibold text-gray-900 mb-1">Submit Everything On Time</p>
                <p className="text-sm text-gray-700">
                  A common reason applications are held up is required documentation is missing or not submitted in a timely manner.
                </p>
              </div>
            )}
            <div className="mt-5">
              <Link
                href={`${basePath}/checklist`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-600 hover:underline transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Our Documents Checklist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-step apply process */}
      <section className="pb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">How to Apply</h2>
            </div>
            {isRespite && (
              <p className="text-sm text-gray-600 mb-5">
                To apply for elderly respite care in Texas, caregivers can access services through the Texas Health and Human Services (HHS) website or by calling 2-1-1 to find local Area Agencies on Aging. The state offers programs providing up to 30 hours of respite per month, often requiring Medicaid eligibility or enrollment in specific caregiver support programs.
              </p>
            )}
            {isPace && (
              <p className="text-sm text-gray-600 mb-5">
                Applications are submitted directly to local PACE organizations, often requiring Medicaid/Medicare financial verification. Start by searching the NPA PACE Finder or calling 1-800-MEDICARE.
              </p>
            )}
            {isMow && (
              <p className="text-sm text-gray-600 mb-5">
                Meals on Wheels is a decentralized network of local providers across Texas. Approval time varies by provider — some have immediate openings, while others maintain a waitlist.
              </p>
            )}
            {isMepd && (
              <p className="text-sm text-gray-600 mb-5">
                Apply online via Your Texas Benefits, call 2-1-1 (Option 2), or submit Form H1200 by mail, fax, or in person at a local benefits office.
              </p>
            )}
            {isMsp && (
              <p className="text-sm text-gray-600 mb-5">
                The quickest and easiest way to apply for the Medicare Savings Programs and other public assistance benefits is online through Your Texas Benefits portal.
              </p>
            )}
            <ol className={`grid grid-cols-1 ${isScsep ? "sm:grid-cols-2 lg:grid-cols-4 gap-3" : isPhc ? "sm:grid-cols-3 gap-4" : isCeap ? "sm:grid-cols-2 gap-4" : isRespite ? "sm:grid-cols-3 gap-4" : isPace ? "sm:grid-cols-2 lg:grid-cols-4 gap-3" : isMow ? "sm:grid-cols-2 lg:grid-cols-4 gap-3" : isMepd ? "sm:grid-cols-2 lg:grid-cols-4 gap-3" : isStarPlus ? "sm:grid-cols-2 lg:grid-cols-3 gap-3" : isMsp ? "sm:grid-cols-2 lg:grid-cols-3 gap-3" : isSnap ? "sm:grid-cols-2 lg:grid-cols-3 gap-3" : "sm:grid-cols-3 gap-4"}`}>
              {(isMsp
                ? [
                    {
                      title: "Apply Online",
                      description: (
                        <>
                          The fastest way is through the{" "}
                          <a
                            href="https://www.yourtexasbenefits.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Your Texas Benefits
                          </a>{" "}
                          portal — apply for MSP and other public assistance benefits in one place.
                        </>
                      ),
                    },
                    {
                      title: "Apply by Mail",
                      description: (
                        <>
                          Download, print, and complete the application in{" "}
                          <a
                            href="https://www.yourtexasbenefits.com/Learn/GetPaperForm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            English or Spanish
                          </a>
                          , then mail it to Texas HHSC, P.O. Box 149024, Austin, TX 78714-9024 — or to your local HHS service office.
                        </>
                      ),
                    },
                    {
                      title: "Get Help by Phone",
                      description:
                        "Call the Texas Medicare Help Line at 800-252-9240 for free assistance with your application.",
                    },
                  ]
                : isStarPlus
                ? [
                    {
                      title: "Online",
                      description: (
                        <>
                          Visit the{" "}
                          <a
                            href="https://www.yourtexasbenefits.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Your Texas Benefits
                          </a>{" "}
                          website and choose &ldquo;Apply for new benefits.&rdquo;
                        </>
                      ),
                    },
                    {
                      title: "Phone",
                      description:
                        "Call 2-1-1 (TTY 711) toll-free, Monday through Friday from 8:00 AM to 6:00 PM Central Time.",
                    },
                    {
                      title: "Mail",
                      description: (
                        <>
                          Print or request a paper application form and mail it in.{" "}
                          <a
                            href="https://www.yourtexasbenefits.com/Learn/GetPaperForm"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Find the form here
                          </a>
                          .
                        </>
                      ),
                    },
                    {
                      title: "In-person",
                      description:
                        "Visit a Texas Health and Human Services (HHS) benefits office near you. Find a location by calling 2-1-1.",
                    },
                    {
                      title: "Choose an MCO",
                      description:
                        "Once eligible, select a Managed Care Organization (MCO) — such as Superior HealthPlan, UnitedHealthcare, or Molina — to coordinate your services.",
                    },
                    {
                      title: "Individualized Care Plan",
                      description:
                        "A service coordinator from your chosen MCO will create a personalized care plan tailored to your needs.",
                    },
                  ]
                : isMepd
                ? [
                    {
                      title: "Apply Online",
                      description: (
                        <>
                          Apply through{" "}
                          <a
                            href="https://www.yourtexasbenefits.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Your Texas Benefits
                          </a>
                          .
                        </>
                      ),
                    },
                    {
                      title: "Call 2-1-1",
                      description: "Dial 2-1-1 and choose Option 2 to apply over the phone or find your nearest local benefits office.",
                    },
                    {
                      title: "Submit Form H1200",
                      description:
                        "Fax to 1-877-447-2839 (include both sides if 2-sided), or mail to Texas HHSC, P.O. Box 149024, Austin, TX 78714-9024.",
                    },
                    {
                      title: "Apply In-Person",
                      description:
                        "Visit a local benefits office. Call 2-1-1 to find the nearest location.",
                    },
                  ]
                : isMow
                ? [
                    {
                      title: "Find your local program",
                      description: (
                        <>
                          Contact your local Area Agency on Aging or search for Texas providers on{" "}
                          <a
                            href="https://www.mealsonwheelsamerica.org/find-meals"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Meals on Wheels America
                          </a>
                          .
                        </>
                      ),
                    },
                    {
                      title: "Assessment",
                      description:
                        "Be prepared to answer questions about your health, mobility, and daily living activities during a short intake call or home visit.",
                    },
                    {
                      title: "Caseworker Review",
                      description:
                        "After you submit your application, a caseworker typically conducts an assessment of needs — including a nutritional health check — to build your care plan.",
                    },
                    {
                      title: "Approval",
                      description:
                        "Some programs have immediate availability, while others maintain waiting lists that can be extensive. Your local provider will let you know where you stand.",
                    },
                  ]
                : isPace
                ? [
                    {
                      title: "Locate a PACE Center",
                      description: (
                        <>
                          Visit the{" "}
                          <a
                            href="https://www.npaonline.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            National PACE Association
                          </a>{" "}
                          website to search for a center near you, as not all areas in Texas are covered.
                        </>
                      ),
                    },
                    {
                      title: "Contact the PACE Program",
                      description:
                        "Reach out to the local PACE provider to schedule an initial consultation and assessment.",
                    },
                    {
                      title: "Assessment and Intake",
                      description:
                        "A PACE interdisciplinary team will assess your needs and determine if you can safely live in the community.",
                    },
                    {
                      title: "Enrollment",
                      description:
                        "If accepted, a care plan is created, and enrollment proceeds, often involving both Medicare and Medicaid, though private pay is available.",
                    },
                  ]
                : isPhc
                ? [
                    {
                      title: "Call 2-1-1",
                      description: "Dial 2-1-1 to be connected to benefits and home care resources in your county.",
                    },
                    {
                      title: "Contact your local ADRC",
                      description: "Call your local Aging and Disability Resource Center at 1-855-937-2372 for help starting your application.",
                    },
                    {
                      title: "Apply through Texas HHSC",
                      description: (
                        <>
                          Submit an application to{" "}
                          <a
                            href="https://www.hhs.texas.gov/services/aging/long-term-care/community-care-services"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Texas Health and Human Services (HHSC)
                          </a>
                          .
                        </>
                      ),
                    },
                  ]
                : isScsep
                ? [
                    {
                      title: "TWC Website",
                      description: (
                        <>
                          Visit the{" "}
                          <a
                            href="https://www.twc.texas.gov/programs/senior-community-service-employment-program"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Texas Workforce Commission SCSEP page
                          </a>{" "}
                          for local office contact information.
                        </>
                      ),
                    },
                    {
                      title: "AARP Foundation SCSEP",
                      description: (
                        <>
                          Apply online via the{" "}
                          <a
                            href="https://www.aarp.org/aarp-foundation/our-work/income/scsep/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            AARP Foundation website
                          </a>
                          .
                        </>
                      ),
                    },
                    {
                      title: "CareerOneStop",
                      description: (
                        <>
                          Use the{" "}
                          <a
                            href="https://www.careeronestop.org/LocalHelp/EmploymentAndTraining/find-older-worker-programs.aspx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Older Worker Program Finder
                          </a>
                          .
                        </>
                      ),
                    },
                    {
                      title: "Phone",
                      description: "Call the toll-free help line at 1-877-US2-JOBS (1-877-872-5627).",
                    },
                  ]
                : isCeap
                ? [
                    {
                      title: "Find your local agency",
                      description: (
                        <>
                          Visit the{" "}
                          <a
                            href="https://www.tdhca.texas.gov/help-for-texans"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            TDHCA Help for Texans
                          </a>{" "}
                          page, select &quot;Utility Bill Payment Help,&quot; and enter your county. You can also call 2-1-1 or 1-877-399-8939.
                        </>
                      ),
                    },
                    {
                      title: "Check your eligibility",
                      description:
                        "Your household income must be at or below 150% of the federal poverty level. Priority is given to seniors 60 and older, people with disabilities, and families with young children.",
                    },
                    {
                      title: "Gather your documents",
                      description: "See the documents list above for everything your local agency will ask for when you apply.",
                    },
                    {
                      title: "Submit your application",
                      description: "Contact your local agency to apply online, by mail, or in person. Funds are first-come, first-served, so apply as early as possible.",
                    },
                  ]
                : isRespite
                ? [
                    {
                      title: "Visit Texas HHS",
                      description: (
                        <>
                          Access services and information through the{" "}
                          <a
                            href="https://www.hhs.texas.gov/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            Texas Health and Human Services
                          </a>{" "}
                          website.
                        </>
                      ),
                    },
                    {
                      title: "Call 2-1-1",
                      description:
                        "Dial 2-1-1 to be connected to your local Area Agency on Aging, which can help you find respite providers in your community.",
                    },
                    {
                      title: "Check Medicaid eligibility",
                      description:
                        "Many respite programs require Medicaid eligibility or enrollment in specific caregiver support programs. Programs typically offer up to 30 hours of respite per month.",
                    },
                  ]
                : isSnap
                ? [
                    {
                      title: "Apply Online",
                      description: (
                        <>
                          Apply at{" "}
                          <a
                            href="https://www.yourtexasbenefits.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            YourTexasBenefits.com
                          </a>
                          .
                        </>
                      ),
                    },
                    {
                      title: "Apply by Phone",
                      description: "Call 2-1-1 (Option 1) or 877-541-7905.",
                    },
                    {
                      title: "Locate an Office",
                      description: (
                        <>
                          Use the{" "}
                          <a
                            href="https://www.hhs.texas.gov/about/find-us/find-office-near-you"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            HHSC office locator
                          </a>{" "}
                          to find the nearest office for in-person assistance.
                        </>
                      ),
                    },
                    {
                      title: "Major Cities & Services",
                      description:
                        "Offices are located throughout Texas, including specialized assistance for SNAP, TANF, and Medicaid.",
                    },
                    {
                      title: "Immediate Help",
                      description:
                        "If you need emergency assistance, call 2-1-1 or the hunger hotline at 1-866-348-6479.",
                    },
                  ]
                : [
                    {
                      title: "Find your local agency",
                      description: (
                        <>
                          Search for the provider serving your county{" "}
                          <a href="#county-offices" className="font-semibold text-primary-700 hover:text-primary-600 underline">
                            here
                          </a>
                          , at{" "}
                          <a
                            href="https://www.tdhca.texas.gov"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary-700 hover:text-primary-600 underline"
                          >
                            tdhca.texas.gov
                          </a>
                          , or call 2-1-1.
                        </>
                      ),
                    },
                    {
                      title: "Submit your application and documents",
                      description:
                        "Bring proof of income for all adults from the last 30 days, 12 months of utility bills, and proof of homeownership or a signed landlord agreement.",
                    },
                    {
                      title: "Get on the waitlist",
                      description:
                        "The program operates on a waitlist that typically takes 6 to 18 months. Seniors, people with disabilities, and families with young children are given priority.",
                    },
                  ]
              ).map((step, i) => (
                <li
                  key={step.title}
                  className={`bg-gray-50 border border-gray-100 rounded-xl flex items-start ${
                    isScsep || isPace || isMow || isMepd || isStarPlus ? "p-3.5 gap-3" : "p-5 gap-4"
                  }`}
                >
                  <div
                    className={`bg-primary-600 rounded-full flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25 ${
                      isScsep || isPace || isMow || isMepd || isStarPlus ? "w-7 h-7" : "w-9 h-9"
                    }`}
                  >
                    <span className={`text-white font-bold ${isScsep || isPace || isMow || isMepd || isStarPlus ? "text-xs" : "text-sm"}`}>{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-gray-900 ${isScsep || isPace || isMow || isMepd || isStarPlus ? "text-sm" : ""}`}>{step.title}</p>
                    <p className={`mt-1 text-gray-600 ${isScsep || isPace || isMow || isMepd || isStarPlus ? "text-xs leading-relaxed" : "text-sm"}`}>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Find Your Local Meals on Wheels — MoW-specific */}
      {isMow && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <MealsOnWheelsLocationFinder />
          </div>
        </section>
      )}

      {/* Find a SNAP Retailer — SNAP-specific */}
      {isSnap && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">Find a SNAP Retailer Near You</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Use the USDA&apos;s official SNAP Retailer Locator to find stores near you that accept your Lone Star Card.
                  </p>
                  <a
                    href="https://usda-fns.maps.arcgis.com/apps/webappviewer/index.html?id=15e1c457b56c4a729861d015cd626a23"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white font-semibold rounded-lg px-5 py-2.5 hover:bg-primary-700 shadow-md shadow-primary-600/25 transition-colors no-underline"
                  >
                    Open SNAP Retailer Locator
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Common Local Offices</h2>
              <p className="text-sm text-gray-600 mb-4">Visit in person to get help applying or ask questions about your case.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { area: "Dallas Area", address: "1010 Cadiz Street", cityState: "Dallas, TX 75215" },
                  { area: "Odessa Area", address: "3016 Kermit Highway", cityState: "Odessa, TX 79764" },
                  { area: "Lufkin / East Texas", address: "Burke Center, 2001 South Medford Drive", cityState: "Lufkin, TX 75901" },
                ].map((office) => (
                  <div
                    key={office.area}
                    className="bg-primary-100/60 rounded-xl border border-primary-100 p-5"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">{office.area}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">{office.address}</p>
                    <p className="text-sm text-gray-600">{office.cityState}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.address}, ${office.cityState}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-600 no-underline"
                    >
                      Get directions
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Key HHSC Offices — MEPD-specific */}
      {isMepd && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <MepdLocationFinder />
          </div>
        </section>
      )}

      {/* STAR+PLUS Service Area Map — STAR+PLUS-specific */}
      {isStarPlus && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <StarPlusLocationFinder />
          </div>
        </section>
      )}

      {/* Find Your Local Agency — WAP-specific */}
      {oldId === "texas-weatherization-assistance-program" && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <WeatherizationLocationFinder />
          </div>
        </section>
      )}

      {/* Find Your Local Agency — SCSEP-specific */}
      {isScsep && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScsepLocationFinder />
          </div>
        </section>
      )}

      {/* Find Your Local ADRC — PHC-specific */}
      {isPhc && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <PhcLocationFinder />
          </div>
        </section>
      )}

      {/* Find Closest Provider — Respite-specific */}
      {isRespite && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Respite Provider Search</h2>
                    <p className="text-xs md:text-sm text-gray-500 mt-0.5">Official state directory of licensed respite providers.</p>
                  </div>
                </div>
              </div>
              <div className="px-5 md:px-6 py-5 bg-gray-50/50">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Enter ZIP code or city"
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <a
                    href="https://respite.hhs.state.tx.us/RespiteProvider/respite/respiteSearch.xhtml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 shadow-sm transition-colors no-underline whitespace-nowrap"
                  >
                    Search Providers
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  You&apos;ll be taken to the official Texas HHS site to complete your search.
                </p>
              </div>
            </div>

            {/* Key Resources */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Key Resources to Find Texas Respite Services</h2>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: "ARCH National Respite Network",
                    desc: "Searchable database of providers in your Texas community.",
                    url: "https://archrespite.org/respitelocator",
                  },
                  {
                    title: "Navigate Life Texas",
                    desc: "For families with children with disabilities — \"Find Services, Groups and Events\" search tool.",
                    url: "https://www.navigatelifetexas.org/",
                  },
                  {
                    title: "Eldercare Locator",
                    desc: "U.S. Administration on Aging directory of local senior support.",
                    url: "https://eldercare.acl.gov/",
                  },
                  {
                    title: "Texas Health and Human Services (HHS)",
                    desc: "Medicaid waivers and state-funded services, which may include respite care.",
                    url: "https://www.hhs.texas.gov/",
                  },
                ].map((item) => (
                  <li key={item.title} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-primary-700 hover:text-primary-600 hover:underline no-underline text-sm inline-flex items-center gap-1"
                    >
                      {item.title}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specific Texas Respite Options */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Specific Texas Respite Options</h2>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    title: "Medicaid Funded Programs",
                    desc: "Up to 30 hours a month of respite care for eligible individuals.",
                  },
                  {
                    title: "Lifespan Respite",
                    desc: "State grants to help caregivers locate and fund short-term respite.",
                  },
                  {
                    title: "Adult Day Services",
                    desc: "National Association of Adult Day Services directory of local centers.",
                  },
                ].map((item) => (
                  <li key={item.title} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* PACE Centers in Texas */}
      {isPace && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">PACE Centers in Texas</h2>
                  <p className="text-xs md:text-sm text-gray-500 mt-0.5">Contact a local center to begin enrollment.</p>
                </div>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    org: "Bienvivir Senior Health Services",
                    city: "El Paso, TX",
                    website: "https://www.bienvivir.org/",
                    locations: [
                      {
                        name: "Carolina Center",
                        address: "940 N Carolina Dr, El Paso TX 79915-2724",
                        phone: "(915) 599-8812",
                      },
                    ],
                  },
                  {
                    org: "Silver Star PACE",
                    city: "Lubbock, TX",
                    website: "https://www.silverstarpace.com/",
                    locations: [
                      {
                        name: "Silver Star PACE",
                        address: "4010 22nd St, Lubbock TX 79410-1116",
                        phone: "(806) 740-1500",
                      },
                    ],
                  },
                  {
                    org: "The Basics at Jan Werner",
                    city: "Amarillo, TX",
                    website: "https://janwerneradultdaycare.org/",
                    locations: [
                      {
                        name: "The Basics at Jan Werner",
                        address: "3108 S Fillmore St, Amarillo TX 79110-1026",
                        phone: "(806) 374-5516",
                      },
                    ],
                  },
                ].map((center) => (
                  <li
                    key={center.org}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col"
                  >
                    <p className="text-[11px] font-semibold text-primary-700 uppercase tracking-wide">
                      {center.city}
                    </p>
                    <p className="mt-1 font-semibold text-gray-900 text-sm">{center.org}</p>
                    <div className="mt-2 space-y-3 flex-1">
                      {center.locations.map((loc, idx) => (
                        <div
                          key={loc.address}
                          className={idx > 0 ? "pt-3 border-t border-gray-200" : ""}
                        >
                          {center.locations.length > 1 && (
                            <p className="text-xs font-semibold text-gray-800">{loc.name}</p>
                          )}
                          <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{loc.address}</p>
                          <a
                            href={`tel:${loc.phone.replace(/\D/g, "")}`}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors no-underline"
                          >
                            {loc.phone}
                          </a>
                        </div>
                      ))}
                    </div>
                    <a
                      href={center.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-600 hover:underline no-underline"
                    >
                      Visit Website
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Find Your Local Agency — CEAP-specific */}
      {oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap" && (
        <section id="county-offices" className="pb-6 scroll-mt-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <CeapLocationFinder />
          </div>
        </section>
      )}

      {/* FAQs */}
      <ProgramFaqSection
        faqs={
          oldId === "texas-weatherization-assistance-program"
            ? [
                {
                  question: "Can I apply if my home needs repairs?",
                  answer:
                    "You can still apply, but homes with significant structural issues (roof damage, serious electrical problems, major leaks) may be \"deferred\" — meaning weatherization is paused until those repairs are addressed. The energy auditor will let you know if your home qualifies, and your local agency can sometimes refer you to partner programs that help cover the needed repairs.",
                },
                {
                  question: "What if my landlord won't sign the permission form?",
                  answer:
                    "Unfortunately, weatherization work cannot proceed without landlord approval because it alters the property. If your landlord is hesitant, share the Landlord Permission Form and explain that the program is free, covers energy-saving improvements, and increases the home's value and efficiency. If they still refuse, your local agency may be able to help you explore other options like CEAP for direct bill help.",
                },
                {
                  question: "Can I apply for weatherization and CEAP at the same time?",
                  answer:
                    "Yes. These are separate programs and you can receive both — CEAP helps pay your electric or gas bill, while WAP makes permanent upgrades to your home. You can apply to each through your local community action agency, and many Texas agencies handle both under one roof.",
                },
              ]
            : oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap"
            ? [
                {
                  question: "Can I apply if I already have a disconnection notice?",
                  answer:
                    "Yes. Households facing disconnection or with service already shut off qualify as a crisis situation and are given priority at most CEAP agencies. Call your local Community Action Agency as soon as you receive the notice, let them know you are in a crisis, and ask about same-day or expedited processing. Bring your disconnection notice, a recent bill, photo ID, and proof of income so the agency can move quickly.",
                },
                {
                  question: "How long does CEAP assistance take to reach my utility company?",
                  answer:
                    "Timing varies by agency and situation. Crisis cases (disconnection or shut-off) are typically processed within a few business days, while standard applications can take a few weeks depending on how busy your local agency is and how complete your paperwork is. Once your application is approved, the payment is sent directly to your utility company and applied as a credit to your account — you do not receive the money yourself.",
                },
                {
                  question: "Can I apply for CEAP and the Weatherization Program at the same time?",
                  answer:
                    "Yes. CEAP and the Weatherization Assistance Program (WAP) are separate programs with different rules and funding, and you can receive help from both. CEAP pays your electric, gas, or propane bill right now, while WAP makes permanent energy-efficiency upgrades to your home so your future bills are lower. Many Texas Community Action Agencies handle both programs, so you can often apply for both in the same visit.",
                },
              ]
            : isScsep
            ? [
                {
                  question: "How long does the SCSEP program last in Texas?",
                  answer:
                    "SCSEP is not a one-time placement — once you're accepted, you can participate for a cumulative total of up to 48 months (4 years). During that time you'll train at a nonprofit or public agency, receive a modest hourly wage, and work with your case manager on a plan to move into permanent, unsubsidized employment.",
                },
                {
                  question: "What happens after I am accepted into SCSEP?",
                  answer:
                    "After you're accepted, you'll meet with a case manager to complete an individual employment plan based on your skills, goals, and any training needs. You'll then be matched with a community service assignment at a nonprofit or public agency — typically 15–20 hours per week — where you'll build skills while earning at least the federal or state minimum wage. You'll also have ongoing access to training, job search help, and supportive services.",
                },
                {
                  question: "Can I choose where I do my job training?",
                  answer:
                    "To a large extent, yes. Your case manager will work with you to find a host agency that matches your interests, skills, and career goals — options often include libraries, senior centers, schools, food banks, healthcare offices, and other nonprofit or public agencies. Placements depend on what's available in your area, but your preferences are a key part of the matching process.",
                },
              ]
            : isPhc
            ? [
                {
                  question: "How long does it take to get approved for Primary Home Care in Texas?",
                  answer:
                    "The PHC application and approval process typically takes 3 to 5 months from the time you first apply to the time services begin. That includes Medicaid eligibility review, a functional assessment by HHSC, development of your plan of care, and assignment to a provider agency. The timeline can be shorter if you already have Medicaid and medical documentation ready, and longer if any paperwork is missing.",
                },
                {
                  question: "Can I apply for Primary Home Care if I need help right away?",
                  answer:
                    "PHC is not designed for emergency same-day care, but you can ask for expedited processing if you are in a crisis — for example, if you are being discharged from a hospital or have recently lost a caregiver. Call 2-1-1 or your local Aging and Disability Resource Center (ADRC) at (855) 937-2372 and explain your situation. In the meantime, they can often help you find temporary supports through other community programs while your PHC application is in progress.",
                },
                {
                  question: "What happens if my needs change after I am already enrolled?",
                  answer:
                    "If your care needs increase or decrease after you are enrolled, you can request a reassessment at any time. Contact your provider agency or HHSC case manager, and they will schedule a new functional assessment to update your plan of care. This can adjust the number of hours you receive or the tasks your attendant helps with, so your services match your current situation.",
                },
              ]
            : isPace
            ? [
                {
                  question: "Can you switch from a nursing home to a PACE program in Texas?",
                  answer:
                    "Yes. Many PACE participants transition directly from a nursing facility back into the community. If you or your loved one is currently in a nursing home but wants to return home, contact a local PACE center to request an assessment. The PACE interdisciplinary team will evaluate whether you can live safely in the community with PACE services in place, and if approved, they will coordinate discharge planning, home modifications, and the services needed to make the transition work.",
                },
                {
                  question: "Can you leave the PACE program if it is not the right fit?",
                  answer:
                    "Yes. Enrollment in PACE is completely voluntary. You can disenroll at any time for any reason and return to regular Medicare and Medicaid services. Your PACE team will help coordinate the transition to make sure there is no gap in your medical care, prescriptions, or long-term supports.",
                },
                {
                  question: "What happens to my Medicare or Medicaid coverage when I enroll in PACE?",
                  answer:
                    "When you join PACE, your Medicare and Medicaid benefits are redirected to the PACE program, which then becomes your single source of care. You will use the PACE interdisciplinary team and network of providers for all services — primary care, specialists, hospital stays, prescriptions, and long-term supports. You keep your Medicare and Medicaid eligibility; the way care is delivered and paid for simply shifts to PACE.",
                },
              ]
            : isMow
            ? [
                {
                  question: "Can a family member apply for Meals on Wheels on behalf of an elderly parent in Texas?",
                  answer:
                    "Yes. Family members, adult children, friends, neighbors, or caregivers can absolutely apply or make a referral on behalf of an eligible senior. In fact, many Meals on Wheels clients are initially signed up this way. You'll typically need the senior's consent to complete the intake, and an in-home assessment visit will be scheduled before meal delivery begins.",
                },
                {
                  question: "What happens after you apply for Meals on Wheels in Texas?",
                  answer:
                    "After you contact your local provider and complete an initial intake (usually by phone), a caseworker or volunteer coordinator will schedule a short in-home assessment. During that visit they'll confirm eligibility, ask about dietary restrictions, identify any safety or wellness concerns, and explain the delivery schedule. If approved, meal delivery typically begins within a few days to a few weeks, depending on local capacity and whether there's a waitlist.",
                },
                {
                  question: "Can a doctor or social worker refer a senior to Meals on Wheels in Texas?",
                  answer:
                    "Yes. Meals on Wheels programs accept referrals from doctors, hospital discharge planners, social workers, home health agencies, Area Agencies on Aging, and community organizations. Medical referrals often move faster through intake because they include documentation of homebound status or nutritional need. If you're a professional making a referral, contact the local Meals on Wheels provider directly to confirm their preferred referral process.",
                },
              ]
            : isRespite
            ? [
                {
                  question: "How long does it take to get approved for respite care in Texas?",
                  answer:
                    "Approval time depends on the program. Non-Medicaid programs like the Lifespan Respite Care Program or Area Agency on Aging respite can often start within 2–4 weeks. Medicaid waiver programs (STAR+PLUS, CLASS) can take 60–90 days or longer because they require a functional assessment and a Medicaid eligibility determination. If there is a waiting list, ask your case manager about interim options.",
                },
                {
                  question: "Can a family caregiver get paid for providing respite care in Texas?",
                  answer:
                    "In some cases, yes. Under Texas's Consumer Directed Services (CDS) option within Medicaid waivers like STAR+PLUS and CLASS, family members (often including adult children, but generally not spouses) can be hired and paid as the attendant. They must pass training and background checks and work through an enrolled Financial Management Services Agency. Ask your case manager whether CDS is available for your plan.",
                },
                {
                  question: "What happens if my respite care application is denied in Texas?",
                  answer:
                    "You have the right to appeal within 90 days of receiving your denial notice. Start by reviewing the reason for denial (usually missing documentation, income, or medical necessity), then request a fair hearing through HHSC. Free legal help is available through Texas Legal Services for Seniors. Full appeal steps are on the Resources tab.",
                },
              ]
            : isSnap
            ? [
                {
                  question: "How long does it take to receive SNAP benefits after applying in Texas?",
                  answer:
                    "Texas HHSC is required to process most SNAP applications within 30 days of receipt. Once approved, benefits are loaded onto your Lone Star Card within a few business days. Households in urgent need — very low income, little or no money on hand, or facing a utility shut-off — may qualify for expedited SNAP benefits within 7 days of applying. To avoid delays, complete your phone or in-person interview as soon as HHSC schedules it and submit any requested documents right away.",
                },
                {
                  question: "Can someone apply for SNAP benefits online in Texas without visiting an office?",
                  answer:
                    "Yes. The fastest way to apply is online at YourTexasBenefits.com, where you can create an account, fill out the application, upload documents, and complete most of the process from home. You will still need to complete an interview (usually by phone) and may be asked to submit additional verification, but no in-person office visit is required for most applicants. You can also apply by phone by dialing 2-1-1 (Option 2) or calling the HHSC Benefits Line at 877-541-7905.",
                },
                {
                  question: "What happens if a Texas household needs emergency food assistance before SNAP is approved?",
                  answer:
                    "If your family needs food before SNAP is approved, call the Texas Hunger Hotline at 1-866-348-6479 to be connected to local food pantries, soup kitchens, and emergency food programs in your area. You can also dial 2-1-1 for help finding nearby food resources. Ask HHSC about expedited SNAP benefits, which must be issued within 7 days for qualifying households. Local nonprofits like the Salvation Army, Catholic Charities, and regional food banks also offer emergency food boxes with no waiting period.",
                },
              ]
            : isStarPlus
            ? [
                {
                  question: "How long is the waitlist for the STAR+PLUS Waiver program in Texas?",
                  answer:
                    "STAR+PLUS HCBS historically has a long interest list — it can range from several months to multiple years depending on the region, available slots, and your priority level. Because of that, the most important step is to call HHSC at 1-877-438-5658 and ask to be added to the interest list as soon as you think a senior might eventually need services. There is no harm in being on the list early, and your spot carries over even if your situation changes. Certain groups (such as people moving out of a nursing facility or transitioning from another waiver) may bypass the list entirely through Money Follows the Person or other priority pathways.",
                },
                {
                  question: "Can a family member add a senior to the STAR+PLUS interest list in Texas?",
                  answer:
                    "Yes. A spouse, adult child, caregiver, power of attorney, or legal representative can call HHSC at 1-877-438-5658 on the senior's behalf to add them to the STAR+PLUS HCBS interest list. You will need the senior's name, date of birth, Social Security number, address, and phone number. The call is free and takes about 10 minutes. Since the list can be long, getting a family member on it early is one of the most useful things you can do even before an application is filed.",
                },
                {
                  question: "What happens after a senior is approved for the STAR+PLUS Waiver in Texas?",
                  answer:
                    "Once approved, the senior is enrolled in a STAR+PLUS managed care organization (MCO) of their choice — options include Molina, Superior HealthPlan, UnitedHealthcare, Wellpoint, Community First, El Paso Health, or Community Health Choice, depending on the service area. An MCO service coordinator then visits the home, completes a needs assessment, and works with the senior and family to build an Individualized Care Plan that lists the exact services, hours, and providers. Services typically begin within a few weeks of the plan being finalized, and the service coordinator stays involved to adjust the plan as needs change.",
                },
              ]
            : isMsp
            ? [
                {
                  question: "Can a family member apply for a Medicare Savings Program on behalf of an elderly parent in Texas?",
                  answer:
                    "Yes. A family member, friend, or authorized representative can submit a Medicare Savings Program application on behalf of an elderly parent in Texas. You can apply online at YourTexasBenefits.com by creating an account in your name and listing your parent as the applicant, or you can complete and mail the paper application. HHSC may ask for verification of your authority to act on your parent's behalf, especially if you need to discuss case details by phone — a power of attorney, guardianship document, or signed authorized representative form (Form H1003) makes this much easier. Local Area Agencies on Aging and benefits counselors can also help families navigate the process for free.",
                },
                {
                  question: "What happens to existing Medicare coverage while a Medicare Savings Program application is being reviewed in Texas?",
                  answer:
                    "Your existing Medicare coverage continues exactly as it is during the application review. You keep paying your Part B premium out of your Social Security check, you keep your same doctors and Medicare Advantage or Medigap plan, and you continue to be responsible for any deductibles or copays. Once HHSC approves your MSP application — which typically takes 45 days, or up to 90 days if a disability determination is needed — the benefit becomes effective and the state begins paying your premiums and (for QMB) cost-sharing. In some cases, MSP benefits can be retroactive for up to three months before the application date, so any premiums or copays you paid during that window may be reimbursed.",
                },
                {
                  question: "Is there free help available to apply for a Medicare Savings Program in Texas?",
                  answer:
                    "Yes. Free, unbiased help is available across Texas. The State Health Insurance Assistance Program (SHIP) — accessible through the National SHIP Locator at Shiphelp.org — provides one-on-one Medicare counseling, including help applying for MSPs. Your local Area Agency on Aging and Aging and Disability Resource Center (call (855) 937-2372) offer benefits counseling at no cost. Dialing 2-1-1 connects you to community resources, and Social Security offices can help with the related Extra Help application. For more complex cases, Texas Legal Services Center and Lone Star Legal Aid provide free legal help with denials and appeals.",
                },
              ]
            : isMepd
            ? [
                {
                  question: "What happens to a senior's current doctors and coverage while a Medicaid for the Elderly and People with Disabilities application is being reviewed?",
                  answer:
                    "Existing coverage — Medicare, a Medicare Advantage plan, or private insurance — continues exactly as before during the MEPD review. Seniors should keep seeing their current doctors, filling prescriptions, and paying any copays or premiums as usual. If MEPD is approved, Texas can back-date coverage up to three months before the application date, which often reimburses qualifying out-of-pocket medical bills from that window. Once STAR+PLUS managed care enrollment begins, the family can confirm whether current providers are in-network and change plans during the selection period if not.",
                },
                {
                  question: "Can a power of attorney apply for Medicaid for the Elderly and People with Disabilities on behalf of an elderly parent in Texas?",
                  answer:
                    "Yes. An authorized representative — a power of attorney, legal guardian, or family member designated on Form H1003 (Appointment of an Authorized Representative) — can fill out the H1200, gather documents, attend interviews, and communicate with HHSC on the applicant's behalf. A durable power of attorney that includes financial authority is usually sufficient, but HHSC may still ask for a signed H1003 so the representative is listed in the case file. This is especially important when a parent has dementia or is in a hospital or nursing facility and can't manage the paperwork themselves.",
                },
                {
                  question: "What should a family expect during the Medicaid for the Elderly and People with Disabilities approval process in Texas?",
                  answer:
                    "After submitting the H1200, HHSC generally has 45 days to make a decision — or up to 90 days if a disability determination is needed. Expect a phone or in-person interview, requests for missing documents (bank statements, proof of income, insurance information), and, for long-term care applicants, a functional assessment to determine medical necessity. Families should respond to every request quickly, keep copies of everything, and call 2-1-1 (Option 2) if they don't hear back within a few weeks. Once approved, a notice will arrive by mail with the start date, coverage details, and next steps for choosing a STAR+PLUS managed care plan.",
                },
              ]
            : undefined
        }
      />

      {/* Bottom CTA */}
      {!isScsep && !isPhc && !isRespite && !isPace && !isMow && !isMepd && !isSnap && !isStarPlus && !isMsp && (
        <section className="pb-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white px-6 py-8 md:py-10 text-center shadow-[0_6px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/60">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-serif">
                Need help applying?
              </h2>
              <p className="mt-2 text-gray-500 text-base md:text-lg">
                Get a personalized 2-minute eligibility check.
              </p>
              <div className="mt-5">
                <Link
                  href="/benefits/finder"
                  className="inline-flex items-center justify-center px-6 py-3 text-base text-white font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/25 transition-all duration-200"
                >
                  Check My Eligibility
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <HomeCareBridgeCta stateCode="TX" stateName="Texas" />
    </div>
  );
}
