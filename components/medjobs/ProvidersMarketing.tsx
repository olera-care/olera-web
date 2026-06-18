import Link from "next/link";
import Image from "next/image";
import ProviderHelpCard from "@/components/medjobs/ProviderHelpCard";

/**
 * The static "understand" half of the converged /medjobs/candidates page —
 * the provider mirror of MedjobsMarketing. Same design spec: max-w-7xl,
 * pt-8 md:pt-12 pb-8 md:pb-12 rhythm, sans-bold H2s, alternating gray/white.
 * Sections: How it works · Day to day · For managers · Hand it to the
 * decision-maker · Common questions · Closer.
 */

const PROVIDER_AGREEMENT_URL = "/docs/host-agreement-sample.pdf";
const NEEDS_QUIZ_HREF = "/medjobs/candidates?welcome=1";

const HOW_IT_WORKS = [
  {
    title: "Tell us your hiring needs",
    description: "A 60-second check: your demand shape, PRN openness, and the shifts you struggle to cover.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    title: "Match with student caregivers",
    description: "We surface college students near you or at a campus near you whose availability fits the shifts you need covered.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: "Interview, hire & deliver care",
    description: "Request an interview, hire who you like, and get reliable recurring coverage for the term.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

export default function ProvidersMarketing() {
  return (
    <>
      {/* How it works */}
      <section id="how-it-works" className="pt-8 md:pt-12 pb-8 md:pb-12 bg-gray-50/70 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 lg:sticky lg:top-24 shadow-xl shadow-gray-900/5">
              <Image src="/images/medjobs/provider-caregiving.jpg" alt="Student caregiver with a senior client" width={600} height={750} className="w-full h-full object-cover" />
            </div>
            <div className="lg:py-4">
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">How it works</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">As needed or recurring coverage</h2>
              <div className="mt-10 space-y-0">
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
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href={NEEDS_QUIZ_HREF} className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors">
                  Tell us your hiring needs →
                </Link>
                <a href={PROVIDER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-700 hover:underline">
                  Read provider agreement ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Day to day */}
      <section className="pt-8 md:pt-12 pb-8 md:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">Day to day</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What your student can cover</h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Pre-health students provide personal care services (PAS) and dependable coverage for
                the shifts that are hardest to fill.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  { lead: "Personal care", detail: "bathing, dressing, grooming, and toileting" },
                  { lead: "Mobility", detail: "safe transfers, walking, and appointments" },
                  { lead: "Medication reminders", detail: "plus light meal prep" },
                  { lead: "Companionship & monitoring", detail: "changes reported to your team" },
                ].map((task) => (
                  <div key={task.lead} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <p className="text-[15px] text-gray-700">
                      <span className="font-medium text-gray-900">{task.lead}</span>: {task.detail}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-xl bg-primary-50 border border-primary-100">
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-900">Great for the shifts you can&apos;t fill.</span>{" "}
                  Evenings, weekends, overnights, PRN, and full-time over winter and summer breaks.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                <Image src="/images/medjobs/caregiving-support.jpg" alt="Student providing care to a senior" width={500} height={667} className="w-full h-full object-cover" />
              </div>
              <div className="col-span-5 space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  <Image src="/images/medjobs/students-group.jpg" alt="Pre-health students" width={400} height={400} className="w-full h-full object-cover" />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                  <Image src="/images/medjobs/college-caregivers.png" alt="College student caregiver" width={400} height={500} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For managers — objection handling */}
      <section className="pt-8 md:pt-12 pb-8 md:pb-12 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Every student is vetted before their profile goes live</p>
              <div className="mt-5 space-y-3">
                {[
                  "Intro video reviewed",
                  "Reliability & professionalism acknowledgments completed",
                  "Semester availability and schedule commitment verified",
                  "University enrollment confirmed",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">For managers</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Here&apos;s why this works.</h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Pre-health students aren&apos;t picking up a side gig. They need patient-care hours and
                references for their med, nursing, and PA applications, so the incentive to show up is built in.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Built-in motivation: this is their career, not a side job.",
                  "Vetted both ways: we screen them, you interview them. You choose.",
                  "Schedules set up front: you agree on shifts before they start.",
                  "No-call/no-show means removed from the program, and no recommendation letter unless they perform.",
                  "Physician-led, NIA-backed, with agreements signed before any match.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hand it to the decision-maker */}
      <section id="help" className="pt-8 md:pt-12 pb-8 md:pb-12 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[1fr_2fr] lg:gap-12 lg:items-stretch">
            <div className="mb-8 lg:mb-0">
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                Hand it to the decision-maker
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Not the one who signs off on hiring?</h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Share it with the owner or operator, and read exactly how the program works before
                you commit.
              </p>
              <a href={PROVIDER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center text-sm font-semibold text-primary-700 hover:underline">
                Read provider agreement ↗
              </a>
            </div>
            <ProviderHelpCard />
          </div>
        </div>
      </section>

      {/* Common questions */}
      <section className="pt-8 md:pt-12 pb-8 md:pb-12 bg-gray-50/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">Common questions</h2>
          <div className="divide-y divide-gray-200 border-t border-gray-200">
            {[
              {
                q: "Are they reliable, and what about no-shows?",
                a: "Every student completes reliability acknowledgments and commits to a schedule before we match them. A no-call/no-show removes them from the program, and they don't earn a recommendation letter unless they perform, so the incentive to show up is strong.",
              },
              {
                q: "How are they vetted?",
                a: "We review an intro video, verify university enrollment, and collect reliability and professionalism acknowledgments before a profile goes live. You then interview and choose who to hire; background checks and licenses are on file for verified candidates.",
              },
              {
                q: "Will they stick around with school?",
                a: "Students commit to a semester of recurring availability, and many continue across terms. They're great for evenings, weekends, overnights, PRN, and full-time over winter and summer breaks.",
              },
              {
                q: "What about insurance and liability?",
                a: "Students are hired and paid through your agency's normal process and covered the same way your other caregivers are. Olera is the matching layer, not the employer.",
              },
              {
                q: "What does it cost?",
                a: "$100 per confirmed hire, billed when the student works their first shift. Money back if they don't reach 15 hours. We verify against the student's required hour records, so there's nothing for you to track.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                  <h3 className="text-base font-semibold text-gray-900">{item.q}</h3>
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="mt-3 text-[15px] text-gray-500 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closer */}
      <section className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-primary-50/50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Stop worrying and <span className="text-primary-600">hire college students</span>.
          </h2>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={NEEDS_QUIZ_HREF} className="inline-flex items-center px-8 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20">
              Tell us your hiring needs →
            </Link>
            <a href={PROVIDER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-700 hover:underline">
              Read provider agreement ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
