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
  const title = `${program.name} Resources | Texas | Olera`;
  return {
    title,
    description: `Helpful links, local contacts, and related programs for ${program.shortName} in Texas.`,
    alternates: { canonical: `/texas/benefits/${slug}/resources` },
  };
}

export default async function TexasResourcesPage({ params }: Props) {
  const { slug } = await params;
  const oldId = TX_NEW_TO_OLD[slug];
  if (!oldId) notFound();

  const program = getProgramById("texas", oldId);
  if (!program) notFound();
  if (isResourceProgram(program)) notFound();

  const basePath = `/texas/benefits/${slug}`;
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
      <TexasProgramHero program={program} slug={slug} currentPage="Resources" />
      <ProgramTabs basePath={basePath} />

      {(() => {
        const isWap = oldId === "texas-weatherization-assistance-program";
        const isCeap = oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap";

        const applicationDocs: { name: string; description: string; url: string }[] = [
          ...(isPhc || isPace || isMow || isMepd || isSnap || isStarPlus || isMsp ? [] : program.forms.map((f) => ({ name: f.name, description: f.description, url: f.url }))),
          ...(isMsp
            ? [
                {
                  name: "Paper Application Form",
                  description: "Download the official Your Texas Benefits paper application, print it, complete it, and mail it in.",
                  url: "https://yourtexasbenefits.com/Learn/GetPaperForm",
                },
              ]
            : []),
          ...(isStarPlus
            ? [
                {
                  name: "Paper Application Form",
                  description: "Download the official Your Texas Benefits paper application, print it, complete it, and mail it in.",
                  url: "https://www.yourtexasbenefits.com/Learn/GetPaperForm",
                },
              ]
            : []),
          ...(isSnap
            ? [
                {
                  name: "Form H0011 — Texas Simplified Application Project (TSAP) for SNAP",
                  description: "Official HHSC simplified application for SNAP food benefits — designed for households where all members are 60 or older or living with a disability.",
                  url: "https://www.hhs.texas.gov/regulations/forms/0-999/form-h0011-texas-simplified-application-project-tsap-snap-food-benefits",
                },
              ]
            : []),
          ...(isMepd
            ? [
                {
                  name: "Form H1200 — Application for Assistance",
                  description: "Official HHSC paper application for Texas Medicaid (MEPD). Download, complete, and submit by mail, fax, or in person.",
                  url: "https://yourtexasbenefits.com/Learn/GetPaperForm",
                },
              ]
            : []),
          ...(isWap
            ? [
                {
                  name: "Landlord Permission Form",
                  description: "Required if you rent your home — signed by your landlord to authorize weatherization work.",
                  url: "https://www.tdhca.texas.gov/sites/default/files/community-affairs/wap/docs/10-WAPLandlord.pdf",
                },
              ]
            : []),
          ...(isScsep
            ? [
                {
                  name: "SCSEP Online Application",
                  description: "Start your SCSEP application online through the national SCSEP portal.",
                  url: "https://onlineapplication.scsep.org/OnlineApplication/",
                },
              ]
            : []),
          ...(isRespite
            ? [
                {
                  name: "Concho Valley Respite Program Application",
                  description: "Printable respite program application for the Concho Valley region.",
                  url: "https://www.cvcog.org/wp-content/uploads/2024/04/Respite-Program-Application.pdf",
                },
              ]
            : []),
        ];

        const regionalApplications: { region: string; counties: string; name: string; url: string; isPdf: boolean }[] = isCeap
          ? [
              {
                region: "Coastal Bend",
                counties: "Bee, Brooks, Cameron, Duval, Jim Wells, San Patricio & Willacy Counties",
                name: "CACOST CEAP Application (English)",
                url: "https://cacost.org/wp-content/uploads/2022/01/CEAP-English-2022-Application.pdf",
                isPdf: true,
              },
              {
                region: "Austin",
                counties: "City of Austin Utilities customers",
                name: "Austin CAP Discount Application",
                url: "https://coautilities.com/wps/wcm/connect/occ/4e0c3322-89ca-4cc8-aecc-d03bcf6212b4/CAP-Discount-Application-Eng.pdf?MOD=AJPERES&CVID=n7gEcLT",
                isPdf: true,
              },
              {
                region: "Dallas",
                counties: "Dallas County residents",
                name: "Dallas County CEAP Information",
                url: "https://www.dallascounty.org/departments/dchhs/human-services/ceap.php",
                isPdf: false,
              },
              {
                region: "South Central Texas",
                counties: "Counties served by CCSCT",
                name: "CCSCT 2026 Community Services Application",
                url: "https://www.ccsct.org/wp-content/uploads/2026/01/2026-CS-APPLICATION-ENGLISH-1.20.26.pdf",
                isPdf: true,
              },
            ]
          : [];

        const contacts: { label: string; description: string; phone: string }[] = isCeap
          ? [
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline — ask to be connected to your local Community Action Agency (CAA) for CEAP.",
                phone: "2-1-1",
              },
              {
                label: "TDHCA Help for Texans Line",
                description: "Search for your local CAA on the Texas Department of Housing & Community Affairs (TDHCA) website or call this line.",
                phone: "(877) 541-7905",
              },
            ]
          : isScsep
          ? [
              {
                label: "U.S. Department of Labor — SCSEP Help Line",
                description: "Toll-free line for SCSEP services in Texas (1-877-US2-JOBS).",
                phone: "(877) 872-5627",
              },
              {
                label: "AARP Foundation SCSEP Helpline",
                description: "The AARP Foundation operates SCSEP in Texas — call for placement and eligibility questions.",
                phone: "(855) 850-2525",
              },
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline for benefits, housing, and aging services.",
                phone: "2-1-1",
              },
            ]
          : isRespite
          ? [
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline for benefits, housing, and aging services.",
                phone: "2-1-1",
              },
              {
                label: "Texas Legal Services for Seniors",
                description: "Free legal help for Texans 60+ — call if you need help appealing a denial.",
                phone: "(956) 609-9059",
              },
            ]
          : isPace
          ? [
              {
                label: "1-800-MEDICARE",
                description: "Call Medicare directly for help finding a PACE program and verifying eligibility.",
                phone: "(800) 633-4227",
              },
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline for benefits, housing, and aging services.",
                phone: "2-1-1",
              },
            ]
          : isMepd
          ? [
              {
                label: "Texas Medicaid Main Office",
                description: "Call the main Texas Medicaid office for eligibility questions about MEPD and other Medicaid programs for the elderly and people with disabilities (Mon–Fri, 7 AM–7 PM). You can also apply online or find local help through YourTexasBenefits.com.",
                phone: "(800) 335-8957",
              },
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline — dial 2-1-1 and choose Option 2 for benefits and Medicaid application help.",
                phone: "2-1-1",
              },
            ]
          : isSnap
          ? [
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline for benefits, housing, and aging services. Call 2-1-1 for information regarding SNAP benefits.",
                phone: "2-1-1",
              },
              {
                label: "HHSC Benefits Line",
                description: "Call the Texas Health and Human Services Commission for SNAP application help and case questions.",
                phone: "(877) 541-7905",
              },
            ]
          : isPhc
          ? [
              {
                label: "Aging and Disability Resource Center (ADRC)",
                description: "Apply by calling your local Aging and Disability Resource Center, or submit an application to Texas Health and Human Services (HHSC).",
                phone: "(855) 937-2372",
              },
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline to get connected to your local ADRC and community care services.",
                phone: "2-1-1",
              },
            ]
          : isStarPlus
          ? [
              {
                label: "Texas Health and Human Services Commission",
                description: "Persons who are not enrolled in STAR+PLUS should call to add their name to the STAR+PLUS HCBS interest list. This can also be done by generating a referral at Your Texas Benefits.",
                phone: "(877) 438-5658",
              },
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline for benefits, housing, and aging services.",
                phone: "2-1-1",
              },
            ]
          : isMsp
          ? [
              {
                label: "Texas Health and Human Services (General)",
                description: "Call 2-1-1 or the HHSC Benefits line for help applying for Medicare Savings Programs. You can also apply or check your case at YourTexasBenefits.com.",
                phone: "(800) 335-8957",
              },
              {
                label: "Medicare",
                description: "Call 1-800-MEDICARE for help with Medicare benefits, premiums, and the Medicare Savings Programs.",
                phone: "(800) 633-4227",
              },
              {
                label: "Social Security Administration",
                description: "Call the SSA to apply for Extra Help with Medicare prescription drug costs (Low-Income Subsidy).",
                phone: "(800) 772-1213",
              },
              {
                label: "National SHIP Locator",
                description: "Find your local State Health Insurance Assistance Program (SHIP) counselor for free, unbiased Medicare help at Shiphelp.org.",
                phone: "Shiphelp.org",
              },
            ]
          : [
              {
                label: "Texas 2-1-1 Information & Referral",
                description: "Free 24/7 helpline for benefits, housing, and aging services.",
                phone: "2-1-1",
              },
              ...(program.phone && program.phone !== "211"
                ? [
                    {
                      label: `${program.shortName} Program Line`,
                      description: "Direct line to the state program office.",
                      phone: program.phone,
                    },
                  ]
                : []),
              ...(isWap
                ? [
                    {
                      label: "TDHCA Energy Assistance Section",
                      description: "Texas Department of Housing & Community Affairs — oversees the Weatherization program.",
                      phone: "(512) 475-3800",
                    },
                  ]
                : []),
            ];

        const ceapLinks: { label: string; description: string; url: string }[] = isCeap
          ? [
              {
                label: "TDHCA Help for Texans",
                description: "Search for your local Community Action Agency by county.",
                url: "https://www.tdhca.texas.gov/help-for-texans",
              },
              {
                label: "TCOG Energy Services",
                description: "Texoma Council of Governments energy assistance programs.",
                url: "https://tcog.com/energy-services/",
              },
            ]
          : isScsep
          ? [
              {
                label: "CareerOneStop Older Worker Program Finder",
                description: "Find SCSEP and other older worker programs near you.",
                url: "https://www.careeronestop.org/LocalHelp/EmploymentAndTraining/find-older-worker-programs.aspx",
              },
              {
                label: "AARP Foundation SCSEP",
                description: "Learn more about AARP Foundation's Senior Community Service Employment Program.",
                url: "https://www.aarp.org/aarp-foundation/our-work/income/scsep/",
              },
            ]
          : isRespite
          ? [
              {
                label: "ARCH National Respite Network & Resource Center",
                description: "Use the National Respite Locator to find respite care providers near you.",
                url: "https://archrespite.org/caregiver-resources/respitelocator/",
              },
            ]
          : isPace
          ? [
              {
                label: "National PACE Association",
                description: "Search the official NPA directory to find a PACE program near you.",
                url: "https://www.npaonline.org/",
              },
            ]
          : isSnap
          ? [
              {
                label: "Authorized Retailer Locator",
                description: "Use the official USDA SNAP Retailer Locator to find nearby stores that accept your Lone Star Card.",
                url: "https://usda-fns.maps.arcgis.com/apps/webappviewer/index.html?id=15e1c457b56c4a729861d015cd626a23",
              },
            ]
          : isMow
          ? [
              {
                label: "Meals on Wheels America — Find Meals & Services",
                description: "Search the official national directory to find Meals on Wheels providers near you by ZIP code.",
                url: "https://www.mealsonwheelsamerica.org/find-meals-and-services/",
              },
            ]
          : isStarPlus
          ? [
              {
                label: "Texas HHS — STAR+PLUS Program",
                description: "Official Texas Health and Human Services page for STAR+PLUS, including service areas and MCO contact information.",
                url: "https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/starplus",
              },
              {
                label: "Paying for Senior Care — Texas STAR+PLUS",
                description: "Overview of the Texas STAR+PLUS waiver, including eligibility, benefits, and application tips.",
                url: "https://www.payingforseniorcare.com/texas/medicaid-waivers/star-plus",
              },
            ]
          : [];

        return (
          <>
            {/* Document Applications */}
            {(applicationDocs.length > 0 || isPhc || isPace || isMow || isSnap || isStarPlus || isMsp) && (
              <section className="py-6 md:py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Application Forms</h2>
                    </div>
                    {isPhc && (
                      <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-gray-700">
                        Specific forms are often completed during an assessment by an HHSC worker, rather than independently.
                      </div>
                    )}
                    {isPace && (
                      <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-gray-700">
                        Texas PACE (Program of All-Inclusive Care for the Elderly) applications are managed by CMS and Texas state agencies, requiring providers to submit initial or service area expansion (SAE) applications through the appropriate federal and state channels.
                      </div>
                    )}
                    {isMow && (
                      <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-gray-700">
                        There is no statewide Meals on Wheels application form. You must contact your local provider directly to request an application — each agency uses its own intake process and assessment.
                      </div>
                    )}
                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                      {applicationDocs.map((doc) => (
                        <li key={doc.url} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 bg-gray-50/50">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{doc.name}</p>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mt-0.5">{doc.description}</p>
                            )}
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors no-underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Application
                          </a>
                        </li>
                      ))}
                      <li className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 bg-primary-50/40">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">Documents Checklist</p>
                          <p className="text-sm text-gray-600 mt-0.5">Everything you need to gather before you apply — printable and ready to take with you.</p>
                        </div>
                        <Link
                          href={`${basePath}/checklist`}
                          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors no-underline"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Checklist
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Regional CEAP Applications */}
            {regionalApplications.length > 0 && (
              <section className="pb-6">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Applications by Region</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-5">
                      Submit your application through your local Community Action Agency (CAA) or the{" "}
                      <a
                        href="https://www.tdhca.texas.gov/help-for-texans"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary-700 hover:text-primary-600 underline"
                      >
                        TDHCA website
                      </a>
                      . Applications vary by region — use the one that matches your county.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {regionalApplications.map((app) => (
                        <div
                          key={app.url}
                          className="flex flex-col justify-between gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4"
                        >
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{app.region}</p>
                            <p className="font-semibold text-gray-900 mt-1">{app.name}</p>
                            <p className="text-sm text-gray-600 mt-1">{app.counties}</p>
                          </div>
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="self-start inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors no-underline"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {app.isPdf ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              )}
                            </svg>
                            {app.isPdf ? "Download Application" : "View Page"}
                          </a>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm text-gray-500 italic">
                      If you can&apos;t find your region, use the contacts below.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Contacts */}
            <section className="pb-6">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Contacts</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {contacts.map((contact) => (
                      <div
                        key={contact.label}
                        className="flex items-center justify-between gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{contact.label}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{contact.description}</p>
                        </div>
                        <a
                          href={`tel:${contact.phone.replace(/\D/g, "")}`}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors no-underline"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    ))}
                    {ceapLinks.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 hover:bg-primary-50 hover:border-primary-200 transition-colors no-underline group"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 group-hover:text-primary-800 truncate">{link.label}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{link.description}</p>
                        </div>
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* If Rejected */}
            <section className="pb-6">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                  <div className={`flex items-center gap-3 ${isPace ? "mb-3" : "mb-4"}`}>
                    <div className={`rounded-xl bg-warning-100 flex items-center justify-center shrink-0 ${isPace ? "w-9 h-9" : "w-10 h-10"}`}>
                      <svg className={`text-warning-700 ${isPace ? "w-4 h-4" : "w-5 h-5"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h2 className={`font-bold text-gray-900 ${isPace ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`}>
                      {isPace ? "Reasons for Ineligibility" : "In Case You Are Rejected"}
                    </h2>
                  </div>
                  <p className={`text-gray-600 ${isPace ? "text-xs mb-3" : "text-sm mb-4"}`}>
                    {isCeap
                      ? "If your CEAP application is denied, you have the right to appeal. Many rejections are overturned once missing documents are provided."
                      : isScsep
                      ? "You will receive a written notice explaining why. Common reasons include being over the income limit, no available slots, or not meeting priority criteria."
                      : isPhc
                      ? "If your Texas Primary Home Care (PHC) is denied, you will receive a notice detailing the reason and how to appeal, which must be done within 30–90 days. You can formally appeal, request an informal review, or reapply with updated medical documentation. You may also explore alternative services through Texas Health and Human Services."
                      : isRespite
                      ? "If your Texas respite care services application was denied, you generally have the right to appeal within 90 days of the decision, per the American Advocacy Group."
                      : isPace
                      ? "Common reasons applicants are found ineligible for PACE in Texas:"
                      : isMow
                      ? "If your Meals on Wheels application is denied — or you're placed on a long waiting list — here are steps you can take:"
                      : isMepd
                      ? "If your MEPD application is denied, you have options. Review the denial letter, take immediate action to fix the issue, and understand the common reasons for rejection so you can resolve them quickly."
                      : isSnap
                      ? "If your Texas SNAP application is denied, you have the right to appeal and can also reapply at any time. Take action quickly — deadlines are short."
                      : isStarPlus
                      ? "If your STAR+PLUS HCBS waiver services are denied, you have 60 days from the date of the notice to file a formal appeal with your health plan. Request a fair hearing if the denial is not resolved. Ensure you meet all eligibility requirements, including medical necessity, Texas residency, and income/asset limits."
                      : isMsp
                      ? "If your Medicare Savings Program application is denied, you have options. Review the notice carefully, then appeal or reapply if you believe the decision was wrong. HHSC is also actively reinstating benefits for people affected by recent erroneous terminations."
                      : "Getting denied the first time doesn't mean you're out of options. Most Texas benefit programs have a formal appeal process, and many rejections are overturned once missing documents are provided."}
                  </p>
                  <ol className={`grid grid-cols-1 gap-2 ${isPace ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 gap-2.5"}`}>
                    {(isCeap
                      ? [
                          {
                            title: "Review the denial notice",
                            description: "Find the specific reason listed — usually missing documents or income.",
                          },
                          {
                            title: "File an appeal",
                            description: "Request a fair hearing to appeal the decision.",
                          },
                          {
                            title: "Contact your local agency",
                            description: "Ask your local CAA for guidance or to submit missing info.",
                          },
                          {
                            title: "Reapply",
                            description: "If circumstances change, you may be able to reapply.",
                          },
                        ]
                      : isScsep
                      ? [
                          {
                            title: "Appeal",
                            description: "You have the right to request a hearing if you believe the decision was unfair.",
                          },
                          {
                            title: "Reapply later",
                            description: "Funding changes frequently and a spot may open up.",
                          },
                          {
                            title: "Explore alternatives",
                            description: "Ask about other job training programs or senior employment resources in your area.",
                          },
                        ]
                      : isPhc
                      ? [
                          {
                            title: "File a formal appeal",
                            description: "Appeal the decision within 30–90 days — the notice you receive will list the deadline.",
                          },
                          {
                            title: "Request an informal review",
                            description: "Ask HHSC to reconsider your case before going through a formal hearing.",
                          },
                          {
                            title: "Reapply with updated documentation",
                            description: "Submit new medical documentation of functional limitations and care needs.",
                          },
                          {
                            title: "Explore alternatives",
                            description: "Ask Texas Health and Human Services about other community care or waiver services.",
                          },
                        ]
                      : isPace
                      ? [
                          {
                            title: "Location",
                            description: "The individual does not live within a specific PACE-approved zip code.",
                          },
                          {
                            title: "Level of Care",
                            description: "The assessment by the health department's UAS tool does not find the individual meets the necessary nursing home level of care.",
                          },
                          {
                            title: "Age",
                            description: "The applicant is under 55 years of age.",
                          },
                          {
                            title: "Ability to Thrive in the Community",
                            description: "The individual cannot live safely in the community with PACE services.",
                          },
                          {
                            title: "Refusal to Use Network",
                            description: "PACE requires utilizing their specific network of providers for services.",
                          },
                        ]
                      : isMow
                      ? [
                          {
                            title: "Appeal or Ask for Reconsideration",
                            description: "Contact the local Meals on Wheels agency to understand the reason for denial. They may be able to place you on a waiting list or re-evaluate your situation.",
                          },
                          {
                            title: "Alternative Meal Services",
                            description: "Look for other providers, such as Mom's Meals or similar local options that offer home-delivered meals.",
                          },
                          {
                            title: "Check Government Benefits",
                            description: "If you are a Medicaid or Medicare recipient, contact your provider to see if they offer home-delivered meal benefits.",
                          },
                          {
                            title: "Contact Area Agency on Aging",
                            description: "Contact your local Texas Area Agency on Aging to explore other available community resources for seniors.",
                          },
                        ]
                      : isMepd
                      ? [
                          {
                            title: "Review the Denial Letter",
                            description: "Carefully read the specific reason for denial so you know exactly what must be fixed before you appeal or reapply.",
                          },
                          {
                            title: "Request a Fair Hearing / Appeal",
                            description: "You have the right to challenge the decision in writing, typically within 90 days of the denial notice.",
                          },
                          {
                            title: "Reapply",
                            description: "If the rejection was due to missing paperwork or a temporary income spike, you can submit a new application immediately.",
                          },
                          {
                            title: "Excess Assets / Income",
                            description: "If assets exceed $2,000 for individuals, you may need to \"spend down\" on medical expenses, debts, or exempt assets (home repairs, prepaying funeral expenses).",
                          },
                          {
                            title: "Missing Information / Documentation",
                            description: "You can request a \"reconsideration\" to submit the required paperwork instead of filing a full new application.",
                          },
                          {
                            title: "Disability Status",
                            description: "If denied for not meeting the disability definition, you may need to submit additional medical documentation supporting your condition.",
                          },
                        ]
                      : isSnap
                      ? [
                          {
                            title: "Request a Fair Hearing (Appeal)",
                            description: "If you believe the decision was wrong, you can request a \"Fair Hearing\" within 90 days of the denial notice. Contact the Texas Health and Human Services Commission (HHSC), write \"I disagree with this decision\" on your notice, sign it, and send it in.",
                          },
                          {
                            title: "Reapply",
                            description: "There is no limit on how many times you can apply. If your circumstances change (e.g., you lose your job or your income drops), you can submit a new application right away.",
                          },
                        ]
                      : isStarPlus
                      ? [
                          {
                            title: "File a Formal Appeal",
                            description: "You have 60 days from the date of the denial notice to file a formal appeal with your health plan (MCO).",
                          },
                          {
                            title: "Request a Fair Hearing",
                            description: "If the denial is not resolved through the MCO appeal, request a fair hearing with Texas HHSC.",
                          },
                          {
                            title: "Review Your Eligibility",
                            description: "Ensure you meet all eligibility requirements, including medical necessity, Texas residency, and income/asset limits.",
                          },
                          {
                            title: "Submit Missing Documentation",
                            description: "If the denial was due to missing paperwork, gather the required documents and resubmit them to your MCO.",
                          },
                        ]
                      : isMsp
                      ? [
                          {
                            title: "Check for Notice",
                            description: "Look for an official letter from HHSC outlining the reason for the denial.",
                          },
                          {
                            title: "Appeal or Reapply",
                            description: "If you believe the decision was wrong, you have the right to appeal or reapply.",
                          },
                          {
                            title: "Contact HHSC",
                            description: "Contact Texas Health and Human Services directly to verify if you were part of the erroneous terminations, as they are actively reinstating benefits for affected individuals.",
                          },
                        ]
                      : isRespite
                      ? [
                          {
                            title: "Appeal the Decision",
                            description: "Submit a request for a fair hearing within 90 days of receiving your denial notice.",
                          },
                          {
                            title: "Identify the Reason for Denial",
                            description: "Common reasons include lack of medical necessity, income restrictions, or provider shortages in waiver programs.",
                          },
                          {
                            title: "Seek Legal Aid",
                            description: (
                              <>
                                If the process feels overwhelming, disability advocates can help. Free legal assistance is available through{" "}
                                <Link href="/texas/benefits/legal-services" className="text-primary-700 font-semibold hover:text-primary-600 underline">
                                  Texas Legal Services for Seniors
                                </Link>
                                .
                              </>
                            ),
                          },
                          {
                            title: "Review Your Eligibility",
                            description: "Make sure you meet the requirements for Texas Health and Human Services (HHSC) programs, which typically require Medicaid eligibility.",
                          },
                        ]
                      : [
                          {
                            title: "Read the denial letter",
                            description: "It lists the reason and appeal deadline (usually 30–60 days).",
                          },
                          {
                            title: "Gather missing documents",
                            description: "Collect any paperwork that was incomplete and resubmit.",
                          },
                          {
                            title: "Request a fair hearing",
                            description: "Call the agency on your letter or dial 2-1-1 for help.",
                          },
                          {
                            title: "Reapply if eligible",
                            description: "If your situation changes, you can reapply immediately.",
                          },
                        ]
                    ).map((step, i) => (
                      <li key={step.title} className={`bg-gray-50 border border-gray-100 rounded-lg ${isPace ? "p-2.5 flex items-start gap-2" : "flex items-start gap-3 p-3"}`}>
                        {isPace ? (
                          <svg className="w-3.5 h-3.5 text-warning-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/25">
                            <span className="text-white font-bold text-xs">{i + 1}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-gray-900 ${isPace ? "text-xs" : "text-sm"}`}>{step.title}</p>
                          <p className={`text-gray-600 ${isPace ? "text-[11px] leading-snug mt-0.5" : "text-xs mt-0.5"}`}>{step.description}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </section>

            {/* Additional Details */}
            <section className="pb-6">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Additional Details</h2>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {program.sourceUrl && (
                      <li className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <div>
                          <p className="font-semibold text-gray-900">Official government site</p>
                          <a href={program.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:text-primary-600 hover:underline break-all">
                            {program.sourceUrl}
                          </a>
                        </div>
                      </li>
                    )}
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isWap
                            ? "One-time service"
                            : isCeap
                            ? "Reapply Every Year"
                            : isScsep
                            ? "Up to 48 Months of Enrollment"
                            : isPhc
                            ? "Annual Reassessment"
                            : isRespite
                            ? "Annual Authorization"
                            : isPace
                            ? "Ongoing Enrollment"
                            : isMow
                            ? "Annual Re-Evaluation"
                            : isMepd
                            ? "Renewal Every 12 Months"
                            : isSnap
                            ? "Periodic Recertification"
                            : isStarPlus
                            ? "Medicaid Redetermination Every 12 Months"
                            : isMsp
                            ? "Annual Renewal"
                            : "Recertification"}
                        </p>
                        <p className="text-gray-600">
                          {isWap
                            ? "WAP is designed as a one-time, permanent home improvement program to increase energy efficiency. Once a home is fully weatherized, it is usually not eligible for services again."
                            : isCeap
                            ? "CEAP assistance does not renew automatically. You must reapply each year through your local agency, where your income and household information will be reverified."
                            : isScsep
                            ? "You do not have to reapply to the Texas SCSEP every year. Once accepted, you are typically enrolled in the program for a cumulative total of up to 48 months (4 years)."
                            : isPhc
                            ? "Texas Primary Home Care (PHC), a Medicaid program, generally requires an annual reassessment of eligibility rather than a full new application, though it is often referred to as the renewal process."
                            : isRespite
                            ? "Respite care is generally authorized on an annual basis, allowing up to 30 days (720 hours or 2,880 units) per Individual Service Plan (ISP) year. Applicants must meet Texas Medicaid eligibility requirements."
                            : isPace
                            ? "You do not need to reapply for the Texas Program of All-Inclusive Care for the Elderly (PACE) every year. Once approved, enrollment continues automatically for as long as the participant desires."
                            : isMow
                            ? "Yes, many Meals on Wheels programs in Texas require an annual re-evaluation or reapplication to ensure clients still meet eligibility requirements."
                            : isMepd
                            ? "Texas Medicaid for the Elderly and People with Disabilities requires renewal every 12 months to confirm you still meet income, asset, and eligibility requirements."
                            : isSnap
                            ? "Texas SNAP food benefits do not necessarily require a new application annually. Instead, recipients must recertify periodically, which can range from every 6 to 24 months depending on the household's circumstances, such as income, household size, or having elderly/disabled members."
                            : isStarPlus
                            ? "STAR+PLUS members must generally undergo a Medicaid redetermination every 12 months to confirm they still meet income, asset, and medical eligibility requirements."
                            : isMsp
                            ? "Texas Medicare Savings Programs generally require annual renewal or reapplication to confirm eligibility, particularly for the Qualified Individual (QI) program, which must be renewed every year."
                            : "Most programs require you to recertify annually. Keep an eye out for renewal letters and submit any updated income documents promptly to avoid gaps in benefits."}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {isPace
                            ? "Free or Low-Cost for Dual-Eligible Enrollees"
                            : isMow
                            ? "Free or Low-Cost for Eligible Seniors"
                            : isMepd
                            ? "Free or Low-Cost for Recipients"
                            : isStarPlus
                            ? "Free, no cost to apply"
                            : "Free, no cost to apply"}
                        </p>
                        <p className="text-gray-600">
                          {isPace
                            ? "Texas PACE is generally free or low-cost for individuals eligible for both Medicare and Medicaid."
                            : isMow
                            ? "Meals on Wheels in Texas is generally free or low-cost for eligible seniors, often operating on a suggested donation or sliding scale basis."
                            : isMepd
                            ? "Texas Medicaid for elderly and disabled individuals (STAR+PLUS) typically has no cost or very low cost for recipients."
                            : isStarPlus
                            ? "STAR+PLUS services are generally free for qualifying individuals because they are part of Texas Medicaid. Applying for this program is completely free. Never pay anyone who claims they can \u201Cguarantee\u201D approval or speed up your application."
                            : isMsp
                            ? "Yes, Texas Medicare Savings Programs (MSPs) are free to apply for and participate in. Never pay anyone who claims they can \u201Cguarantee\u201D approval or speed up your application."
                            : "Applying for this program is completely free. Never pay anyone who claims they can \u201Cguarantee\u201D approval or speed up your application."}
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        );
      })()}

      {/* FAQs */}
      <ProgramFaqSection
        faqs={
          oldId === "texas-weatherization-assistance-program"
            ? [
                {
                  question: "What other programs can help with my energy bills in Texas?",
                  answer:
                    "Besides WAP, Texas runs the Comprehensive Energy Assistance Program (CEAP), which helps pay electric and gas bills. Many utilities also offer hardship programs (like Reliant's CARE or CenterPoint's EnergyShare). Dial 2-1-1 for local nonprofit assistance, and ask your community action agency about seasonal water bill help (LIHWAP) when available.",
                },
                {
                  question: "Who do I call if I have questions about my application?",
                  answer:
                    "Your best first call is the local subrecipient agency that took your application — they can give you status updates. If you don't know which agency serves you, dial 2-1-1 or use the \"Find Your Local Agency\" map on the How to Apply tab. For statewide program questions, you can also reach the TDHCA Energy Assistance Section at (512) 475-3800.",
                },
                {
                  question: "What do I do if I am denied?",
                  answer:
                    "Start by reading the denial letter carefully — it will list the specific reason and the appeal deadline (usually 30–60 days). Gather any missing documents, then request a fair hearing through the agency listed on the letter, or call 2-1-1 for help. If your situation changes (income drops, household changes, new disability), you can reapply immediately. See the \"In Case You Are Rejected\" section above for the full steps.",
                },
              ]
            : oldId === "texas-comprehensive-energy-assistance-program-ceap-liheap"
            ? [
                {
                  question: "What do I do if CEAP funds run out before I can apply?",
                  answer:
                    "CEAP funding is limited and distributed on a first-come, first-served basis, so local agencies sometimes pause intake once their allocation is used up. If that happens, call 2-1-1 to ask about other emergency energy assistance in your county, check with your utility company about their own hardship or payment plan programs (like Reliant CARE or CenterPoint EnergyShare), and reach out to local nonprofits such as the Salvation Army or St. Vincent de Paul. New CEAP funds are typically released at the start of each program year, so ask your local Community Action Agency when they expect to reopen applications.",
                },
                {
                  question: "Are there other programs that can help with my energy bills in Texas?",
                  answer:
                    "Yes. The Weatherization Assistance Program (WAP) makes permanent energy-efficiency improvements to your home, which lowers your bills long term. Many utility companies run their own hardship programs (Reliant CARE, CenterPoint EnergyShare, TXU Energy Aid, and others). Dial 2-1-1 to be connected to local nonprofits, churches, and community action agencies that may offer one-time bill help. You can also ask your local CEAP agency about related LIHEAP-funded programs in your region.",
                },
                {
                  question: "Does CEAP help with propane or gas bills, not just electric?",
                  answer:
                    "Yes. CEAP is designed to help with your primary home energy source, which includes electricity, natural gas, and propane. If you heat or cook with propane, CEAP can pay your propane supplier directly, and the same is true for natural gas utilities. When you apply, bring your most recent bill for whichever energy source you use so your local Community Action Agency can set up the payment correctly.",
                },
              ]
            : isScsep
            ? [
                {
                  question: "Does SCSEP help with computer skills for seniors?",
                  answer:
                    "Yes. Basic computer and digital literacy training is one of the most common skill-building areas in SCSEP. Many host agencies place participants in roles that involve email, word processing, spreadsheets, and online systems, and case managers can connect you with additional classes at libraries, community colleges, or workforce centers. You don't need any prior computer experience to join.",
                },
                {
                  question: "Can SCSEP help me find a permanent job after the program ends?",
                  answer:
                    "Yes — moving participants into permanent, unsubsidized employment is a core goal of SCSEP. Your case manager will help you build a resume, practice interviewing, and apply for jobs throughout your time in the program. SCSEP providers partner with Texas Workforce Solutions offices and local employers, and many participants are hired directly by their host agency or a related organization.",
                },
                {
                  question: "Are there other job training programs for seniors in Texas if SCSEP has no openings?",
                  answer:
                    "Yes. If your local SCSEP provider has a waiting list, Texas Workforce Solutions offices offer free job search, resume, and training services for adults of all ages, including older workers. You can also check with AARP Foundation, Goodwill's senior workforce programs, and your local Area Agency on Aging (call 2-1-1 to be connected). The CareerOneStop Older Worker Program Finder is another good starting point for nearby options.",
                },
              ]
            : isPace
            ? [
                {
                  question: "How do I find a PACE program near me in Texas?",
                  answer:
                    "The easiest way is to use the National PACE Association's online directory at npaonline.org, which lets you search by state and ZIP code. In Texas, active PACE centers include Bienvivir Senior Health Services in El Paso, Silver Star PACE in Lubbock, and The Basics at Jan Werner in Amarillo — you can find contact details on the How to Apply tab. You can also call 1-800-MEDICARE or dial 2-1-1 for help locating the nearest program.",
                },
                {
                  question: "What is the difference between PACE and other Texas Medicaid long-term care programs?",
                  answer:
                    "PACE is a fully integrated, all-inclusive program that wraps medical care, long-term services, prescriptions, and transportation into one coordinated plan delivered by a single interdisciplinary team. Texas Medicaid long-term care programs like STAR+PLUS and the 1915(c) waivers (CLASS, DBMD, MDCP) provide many similar supports, but they rely on separate providers for medical care, specialists, and home services. PACE is only available in certain service areas and requires that you meet the nursing-home level of care, while STAR+PLUS and the waivers have broader coverage across Texas.",
                },
                {
                  question: "Can family caregivers get support through the PACE program in Texas?",
                  answer:
                    "Yes. Supporting family caregivers is a core part of PACE. The interdisciplinary team offers caregiver education, counseling, and respite through the PACE center's adult day programming, giving family members time to work, rest, or take care of their own needs. Home care aides can also step in to assist with daily tasks, and the team helps coordinate equipment, home modifications, and end-of-life planning when needed.",
                },
              ]
            : isMow
            ? [
                {
                  question: "What local Meals on Wheels programs serve the Dallas and Fort Worth area?",
                  answer:
                    "The Dallas–Fort Worth metroplex is served by several well-established providers. Visiting Nurse Association of Texas (VNA Meals on Wheels) is the largest Dallas-area provider, delivering meals across Dallas County. Meals On Wheels, Inc. of Tarrant County serves Fort Worth and surrounding Tarrant County. Meals on Wheels of Collin County covers McKinney, Plano, and Frisco, while Meals on Wheels Denton County serves the Denton area. Use the map above or search the national directory at mealsonwheelsamerica.org to find the exact provider for your ZIP code.",
                },
                {
                  question: "Is there a waitlist for Meals on Wheels in Texas and how do you get on it?",
                  answer:
                    "Yes — many Texas Meals on Wheels providers maintain a waitlist because demand exceeds funding and volunteer capacity. Wait times vary from a few weeks in well-funded urban programs to six to eight months in high-demand regions like San Antonio. To get on a waitlist, contact your local provider directly and complete an intake interview. They'll assess your eligibility, place you on the list, and notify you when a meal slot opens. If you're in urgent need, ask about emergency shelf-stable meal boxes or referrals to food pantries and congregate meal sites in the meantime.",
                },
                {
                  question: "What other home support services are available alongside Meals on Wheels in Texas?",
                  answer:
                    "Meals on Wheels often serves as a gateway to other community supports. Depending on your needs, you may also qualify for in-home care through Texas Primary Home Care or STAR+PLUS, transportation assistance through your local Area Agency on Aging, utility help through CEAP and the Weatherization Assistance Program, home repair programs, respite care for family caregivers, and friendly visitor or telephone reassurance programs. Your local Meals on Wheels caseworker can often connect you with these services, or you can dial 2-1-1 to explore what's available in your county.",
                },
              ]
            : isRespite
            ? [
                {
                  question: "What free respite care programs are available for elderly Texans?",
                  answer:
                    "Several free options serve Texas families: the Lifespan Respite Care Program (statewide, administered through Easter Seals Central Texas), the National Family Caregiver Support Program through your local Area Agency on Aging, Texas Medicaid waivers (STAR+PLUS, CLASS) for eligible seniors, and regional nonprofits like the Concho Valley Respite Program. Dial 2-1-1 to be connected to programs that serve your county.",
                },
                {
                  question: "How do I find a respite care provider near me in Texas?",
                  answer:
                    "Start with the ARCH National Respite Network & Resource Center's online locator at archrespite.org, which lets you search by ZIP code. You can also call Texas 2-1-1 for local referrals, contact your Area Agency on Aging, or ask your parent's doctor for a home health or adult day center recommendation.",
                },
                {
                  question: "What state programs help family caregivers of aging adults in Texas?",
                  answer:
                    "Texas's primary caregiver supports include the Lifespan Respite Care Program, the National Family Caregiver Support Program (through Area Agencies on Aging), Medicaid waivers (STAR+PLUS, CLASS, DBMD, MDCP) that include respite benefits, and HHSC information and referral services. The Texas chapter of the Alzheimer's Association and local AAAs also offer caregiver training, support groups, and counseling.",
                },
              ]
            : isPhc
            ? [
                {
                  question: "What is the difference between Primary Home Care and a home health agency in Texas?",
                  answer:
                    "Primary Home Care provides non-medical attendant services — help with daily tasks like bathing, dressing, meal preparation, and light housekeeping — paid for by Texas Medicaid as a long-term benefit. A home health agency provides skilled medical services like nursing, wound care, physical therapy, and medication management, typically under a short-term doctor's order and often paid for by Medicare. Many people use both: home health for medical needs after a hospital stay, and PHC for ongoing help with daily living.",
                },
                {
                  question: "Can I switch my home care attendant if I am not satisfied?",
                  answer:
                    "Yes. If you are not comfortable with your attendant, contact your provider agency and let them know you would like a change. Provider agencies are required to work with you to find a good match, and you can request a new attendant without losing your PHC benefits. If you are unhappy with the provider agency itself, you also have the right to switch to a different participating agency in your area.",
                },
                {
                  question: "Are there other Texas Medicaid programs if I need more hours of care than PHC allows?",
                  answer:
                    "Yes. If your care needs exceed what PHC provides, you may qualify for STAR+PLUS, the Community Living Assistance and Support Services (CLASS) waiver, Deaf Blind with Multiple Disabilities (DBMD) waiver, the Medically Dependent Children Program (MDCP), or nursing facility-level care through the STAR+PLUS HCBS program. These programs can offer more hours, additional services like respite and home modifications, and in some cases nursing care at home. Call your local Aging and Disability Resource Center (ADRC) at (855) 937-2372 to talk through which program is the best fit.",
                },
              ]
            : isSnap
            ? [
                {
                  question: "Where can seniors in Texas get free help applying for SNAP food benefits?",
                  answer:
                    "Several organizations offer free SNAP application help for Texas seniors. Your local Area Agency on Aging (AAA) and Aging and Disability Resource Center (ADRC) provide benefits counseling — call (855) 937-2372 to find yours. Community Action Agencies, HHSC benefits offices, regional food banks (like the North Texas Food Bank, Central Texas Food Bank, and San Antonio Food Bank), and nonprofit Benefits Enrollment Centers also offer free in-person help. You can dial 2-1-1 at any time to be connected to a local resource at no cost.",
                },
                {
                  question: "What local offices in Texas provide in-person SNAP assistance?",
                  answer:
                    "Texas HHSC operates more than 200 benefits offices statewide where you can apply in person and get help with SNAP. Common locations include 1010 Cadiz Street in Dallas, 3016 Kermit Highway in Odessa, and the Burke Center at 2001 South Medford Drive in Lufkin (East Texas). Use the HHSC office locator at yourtexasbenefits.com or call 2-1-1 to find the office nearest you. Many local food banks and Community Action Agencies also provide drop-in SNAP application assistance at no cost.",
                },
                {
                  question: "Can a Texas senior receive both SNAP and Meals on Wheels at the same time?",
                  answer:
                    "Yes. SNAP and Meals on Wheels serve different purposes and can be used together. SNAP helps you buy groceries at the store through your Lone Star Card, while Meals on Wheels delivers prepared hot meals directly to homebound seniors. There is no restriction on receiving both, and many Texas seniors rely on SNAP for everyday groceries and Meals on Wheels for days when cooking is difficult. Contact your local Meals on Wheels provider to apply — each agency uses its own intake process and assessment.",
                },
              ]
            : isStarPlus
            ? [
                {
                  question: "Which managed care organizations offer STAR+PLUS coverage in Texas?",
                  answer:
                    "STAR+PLUS is delivered through managed care organizations (MCOs) that vary by service area. The primary statewide plans are Molina Healthcare, Superior HealthPlan, UnitedHealthcare Community Plan, and Wellpoint (formerly Amerigroup). Community First Health Plans operates in the Bexar (San Antonio) area, El Paso Health serves the El Paso region, and Community Health Choice serves the Harris (Houston) service area. When a senior is enrolled, they choose one of the MCOs available in their county. Each MCO assigns a service coordinator who builds an Individualized Care Plan and helps arrange services.",
                },
                {
                  question: "What is the difference between STAR+PLUS and other Texas Medicaid long-term care programs?",
                  answer:
                    "STAR+PLUS is a managed care program that combines acute care (doctor visits, hospital stays, prescriptions) with long-term services and supports (personal attendant care, nursing, adaptive aids, home modifications) under one plan — making it the most common path for adults 21+ who meet nursing facility level of care. Programs like CLASS, HCS, TxHmL, DBMD, and MDCP serve different populations (people with intellectual/developmental disabilities, children with disabilities, deaf-blind adults, etc.) and are fee-for-service rather than managed care. Primary Home Care (PHC) and Community Attendant Services (CAS) provide attendant care only, without the broader STAR+PLUS HCBS waiver package. MEPD is the underlying Medicaid eligibility category that many STAR+PLUS members fall under.",
                },
                {
                  question: "How do Texas seniors find STAR+PLUS providers in their county?",
                  answer:
                    "The fastest way to find providers is through your STAR+PLUS managed care organization's provider directory — each MCO publishes an online and printed list of in-network doctors, attendant care agencies, home health providers, adult day centers, and durable medical equipment suppliers for your county. Your MCO service coordinator can also recommend providers based on your Individualized Care Plan. For a full list of STAR+PLUS service areas, counties, and participating MCOs, visit the Texas HHS STAR+PLUS page at hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/starplus or call 2-1-1 and ask for STAR+PLUS provider information in your area.",
                },
              ]
            : isMepd
            ? [
                {
                  question: "What local organizations in Texas help seniors apply for Medicaid for the Elderly and People with Disabilities?",
                  answer:
                    "Several Texas organizations offer free, in-person help with MEPD applications. Area Agencies on Aging (AAA) and Aging and Disability Resource Centers (ADRCs) provide benefits counseling in every region — call (855) 937-2372 to find yours. Community Action Agencies, local HHSC benefits offices, hospital social workers, and nursing facility admissions staff can also help start an application. For complex cases involving asset protection or spousal impoverishment rules, an elder law attorney or a State Bar of Texas Legal Access Division referral is often worth the call. Dialing 2-1-1 (Option 2) connects you to any of these resources at no cost.",
                },
                {
                  question: "How does Medicaid for the Elderly and People with Disabilities work alongside Medicare for Texas seniors?",
                  answer:
                    "Most MEPD enrollees are \"dual-eligible\" — they have both Medicare and Medicaid. Medicare remains the primary payer for hospital stays, doctor visits, and Part D prescriptions, while MEPD covers what Medicare doesn't: long-term services and supports, Medicare Part B premiums, deductibles and coinsurance, and — for many dual-eligibles — prescription copays through the Low Income Subsidy. In practice, this means a senior who qualifies for MEPD often pays little to nothing out of pocket for medical care. Dual-eligibles in Texas are typically enrolled in a STAR+PLUS managed care plan that coordinates both sets of benefits.",
                },
                {
                  question: "Is there free legal or financial help available for seniors navigating Medicaid for the Elderly and People with Disabilities in Texas?",
                  answer:
                    "Yes. Texas Legal Services Center and Lone Star Legal Aid offer free legal help to low-income seniors on Medicaid issues, including denials, appeals, and fair hearings. The State Bar of Texas Legal Access Division can refer you to reduced-fee elder law attorneys. Benefits counselors at Area Agencies on Aging provide free help understanding income and asset rules, and Social Security Administration offices can assist with SSI and disability determinations that affect MEPD eligibility. For financial planning — especially spousal impoverishment and asset protection — a certified elder law attorney (CELA) is worth a paid consultation, but the initial intake call is often free.",
                },
              ]
            : isMsp
            ? [
                {
                  question: "What is the difference between a Medicare Savings Program and Medicaid for seniors in Texas?",
                  answer:
                    "Medicare Savings Programs and full Medicaid (MEPD) are different programs with different purposes. MSPs only help pay Medicare premiums and, in the case of QMB, Medicare cost-sharing — they do not provide additional medical coverage beyond what Medicare already covers. Full Medicaid for the Elderly and People with Disabilities (MEPD) provides comprehensive health coverage that fills in around Medicare, including long-term services and supports like personal care, adult day health, and nursing facility care. MEPD has much stricter income and asset limits (around $2,000 in countable assets), while MSPs allow up to $9,660 for an individual. Many Texas seniors qualify for an MSP without qualifying for full Medicaid.",
                },
                {
                  question: "How do Texas Medicare Savings Programs interact with Social Security income?",
                  answer:
                    "Social Security retirement and disability benefits are counted as income when HHSC determines whether you qualify for a Medicare Savings Program. However, the first $20 of any monthly income is disregarded, so your countable Social Security is your gross monthly benefit minus $20. Once you're approved for SLMB or QI, the state pays your Medicare Part B premium — which is normally deducted from your Social Security check — so your monthly Social Security payment increases by about $185. For QMB enrollees, the state also pays the Part B premium, plus deductibles and copays for Medicare services, which can free up hundreds of dollars a month in real spending power.",
                },
                {
                  question: "What other benefits might a Texas senior automatically qualify for after enrolling in a Medicare Savings Program?",
                  answer:
                    "Enrolling in an MSP often opens the door to several other benefits automatically. Most importantly, QMB, SLMB, and QI enrollees are automatically deemed eligible for Extra Help (the Low Income Subsidy) for Medicare Part D, which dramatically lowers prescription costs. MSP enrollees may also qualify for SNAP food benefits, the Comprehensive Energy Assistance Program (CEAP/LIHEAP), the Weatherization Assistance Program, and reduced-cost phone or internet through Lifeline. Some Texas seniors with QMB who have very low income and limited assets may also be evaluated for full Medicaid (MEPD). Always ask your benefits counselor or HHSC caseworker to screen you for everything you might qualify for during the same visit.",
                },
              ]
            : program.faqs
        }
      />

      <HomeCareBridgeCta stateCode="TX" stateName="Texas" />
    </div>
  );
}
