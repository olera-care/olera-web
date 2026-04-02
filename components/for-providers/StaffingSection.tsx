import Image from "next/image";
import Link from "next/link";

const PAIN_POINTS = [
  {
    problem: "High turnover drains your budget",
    solution:
      "Our caregivers are pursuing careers in healthcare. They need consistent hours and long-term placements — not a stopgap between gigs.",
  },
  {
    problem: "Last-minute call-outs hurt your clients",
    solution:
      "Every caregiver completes reliability acknowledgments and commits to a schedule before their profile goes live.",
  },
  {
    problem: "Agency fees eat into your margins",
    solution:
      "Connect directly with vetted caregivers. No placement fees, no markups, no middlemen.",
  },
];

const STATS = [
  { stat: "85%", label: "Caregiver retention after 90 days" },
  { stat: "15-20", label: "Average weekly hours per caregiver" },
  { stat: "70%", label: "Available evenings & weekends" },
  { stat: "4.8/5", label: "Provider satisfaction" },
];

const VETTING_STEPS = [
  "Sourced exclusively from university pre-health programs",
  "Intro video reviewed before profile goes live",
  "Reliability and professionalism acknowledgments completed",
  "Availability and schedule commitment verified",
  "University enrollment confirmed",
];

export default function StaffingSection() {
  return (
    <section id="staffing" className="scroll-mt-20">
      {/* Header + pain points */}
      <div className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
              Staffing
            </p>
            <h2 className="font-serif text-display-sm sm:text-display-md font-bold text-gray-900 tracking-tight">
              Reliable staff, sourced from
              <br />
              university health programs
            </h2>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed">
              We recruit caregivers exclusively from pre-med, pre-nursing, pre-PA,
              and public health programs at universities across the country. They
              aren&apos;t just filling a shift — they&apos;re building a career in
              healthcare.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {PAIN_POINTS.map((item) => (
              <div key={item.problem}>
                <p className="text-sm font-semibold text-gray-900">
                  {item.problem}
                </p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {item.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl p-5 border border-gray-100 text-center"
              >
                <p className="text-3xl font-bold text-gray-900">{item.stat}</p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why our staff are different */}
      <div className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                Why Olera staff
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Motivated by more
                <br />
                than a paycheck
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Our caregivers are pursuing medicine, nursing, PA, PT, and public
                health. They need verified patient care hours for their professional
                school applications — which means they show up, stay engaged, and
                build real relationships with your clients.
              </p>
              <div className="mt-8 space-y-4">
                {VETTING_STEPS.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  href="/medjobs/candidates"
                  className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
                >
                  Browse Candidates
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/medjobs/students-group.jpg"
                  alt="Pre-health caregivers"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mt-8">
                <Image
                  src="/images/medjobs/caregiving-support.jpg"
                  alt="Caregiver supporting senior client"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
