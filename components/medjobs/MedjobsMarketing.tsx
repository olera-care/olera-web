import Link from "next/link";
import Image from "next/image";
import PartnerHelpCard from "@/components/medjobs/PartnerHelpCard";
import ApplyButton from "@/components/medjobs/ApplyButton";

/**
 * The static "understand" half of the converged /medjobs/families page —
 * lifted from the retired /medjobs landing. Server-rendered (SEO), with the
 * "How it works" anchor and Apply CTAs that open the screener via ApplyButton.
 */

const HOW_IT_WORKS = [
  {
    title: "Create your profile",
    description: "Add your university, major, certifications, and availability. Upload a resume and record a short video intro.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "Match with a family near your university",
    description: "Local families and care teams near your university review intern profiles and match with you for a semester of recurring care.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: "Provide care while you're still in school",
    description: "Log patient care hours, get your hours confirmed, and build a healthcare experience transcript for professional school.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const STUDENT_FEATURES = [
  { label: "Verified healthcare hours", detail: "Every hour logged and confirmed by your supervising provider — ready for your AMCAS or CASPA application." },
  { label: "Real bedside experience", detail: "Home care, assisted living, memory care, and hospice — the settings professional schools want to see on your application." },
  { label: "Flexible schedules", detail: "Part-time, weekends, summers — work around your classes, not the other way around." },
  { label: "Paid + purposeful", detail: "Earn competitive hourly rates while gaining experience that actually matters for your career." },
];

export default function MedjobsMarketing() {
  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gray-50/70 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 lg:sticky lg:top-24 shadow-xl shadow-gray-900/5">
              <Image src="/images/medjobs/student-portrait.jpg" alt="Pre-health intern" width={600} height={800} className="w-full h-full object-cover" />
            </div>
            <div className="lg:py-8">
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">How it works</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                From student to caregiver<br />in 3 simple steps
              </h2>
              <div className="mt-12 space-y-0">
                {HOW_IT_WORKS.map((item, i) => (
                  <div key={item.title} className="py-7 border-t border-gray-200/80 first:border-t-0">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 text-primary-600 flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium mb-1">Step {i + 1}</p>
                        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                        <p className="mt-1 text-[15px] text-gray-500 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <ApplyButton className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors">
                  Apply Now
                </ApplyButton>
                <p className="mt-3 text-sm text-gray-400">No cost, no commitment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Students */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">For students</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                The healthcare experience your future career needs
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                PA programs require 1,000-2,000 patient care hours. Med schools want hundreds.
                This internship is how you get them — while getting paid and making a real difference.
              </p>
              <div className="mt-10 space-y-6">
                {STUDENT_FEATURES.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <ApplyButton className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors">
                  Create your profile
                </ApplyButton>
                <a
                  href="/docs/internship-agreement-sample.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary-700 hover:underline"
                >
                  Want the exact details? Read the internship agreement ↗
                </a>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                <Image src="/images/medjobs/students-group.jpg" alt="Healthcare student group" width={500} height={667} className="w-full h-full object-cover" />
              </div>
              <div className="col-span-5 space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <Image src="/images/medjobs/caregiving-support.jpg" alt="Students supporting seniors" width={400} height={400} className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                  <Image src="/images/medjobs/college-caregivers.png" alt="Pre-health student interns" width={400} height={500} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For advisors, faculty & student orgs */}
      <section id="help" className="py-16 sm:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_2fr] lg:gap-12 lg:items-start">
            <div className="mb-8 lg:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/images/for-providers/team/logan.jpg" alt="Dr. Logan DuBose" width={56} height={56} className="w-14 h-14 rounded-full object-cover shadow-sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
                  <p className="text-xs text-gray-500">General Practitioner &middot; Co-Founder of Olera</p>
                </div>
              </div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                For advisors, faculty &amp; student orgs
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Help your pre-health students find this
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                A paid way to earn the patient-care hours, credential, and references their med, PA,
                and nursing applications need. Physician-led, NIA-backed, and safe for students.
              </p>
            </div>
            <PartnerHelpCard />
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-xl shadow-gray-900/5">
                <Image src="/images/medjobs/provider-caregiving.jpg" alt="Pre-health intern with senior patient" width={800} height={600} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">For providers</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Reliable coverage<br />for your clients
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Pre-health interns aren&apos;t just filling a shift — they commit to a semester of
                recurring availability and we match them to your clients. No commitment up front.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-6">
                {[
                  { stat: "Semester", label: "Recurring availability per intern" },
                  { stat: "No upfront cost", label: "Matched only when you have a need" },
                  { stat: "Pre-nursing & pre-med", label: "Vetted local university students" },
                  { stat: "NIH-backed", label: "Early work toward an NIA grant" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xl font-bold text-gray-900">{item.stat}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/medjobs/providers" className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors">
                  See how it works for providers
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-primary-50/50" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Your healthcare experience<br /><span className="text-primary-600">starts here</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">Apply now. No cost, no commitment.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <ApplyButton className="inline-flex items-center px-8 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20">
              Apply Now
            </ApplyButton>
            <Link href="/medjobs/providers" className="inline-flex items-center px-8 py-3.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors">
              I&apos;m a provider
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
