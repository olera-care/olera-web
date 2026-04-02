import Image from "next/image";
import Link from "next/link";

const UNIVERSITIES = [
  { name: "Texas A&M University", logo: "/images/medjobs/universities/texas-am.png" },
  { name: "University of Michigan", logo: "/images/medjobs/universities/michigan.png" },
  { name: "University of Houston", logo: "/images/medjobs/universities/houston.png" },
  { name: "Prairie View A&M University", logo: "/images/medjobs/universities/prairie-view.webp" },
  { name: "University of Maryland", logo: "/images/medjobs/universities/maryland.png" },
];

const PAIN_POINTS = [
  {
    problem: "High turnover drains your budget",
    solution:
      "Our caregivers need hundreds of verified patient care hours for professional school. They stay because the work matters to their future.",
  },
  {
    problem: "Last-minute call-outs hurt your clients",
    solution:
      "Every caregiver signs a no-call no-show commitment before their profile goes live. Violate it and they are removed from the platform.",
  },
  {
    problem: "Agency fees eat into your margins",
    solution:
      "Connect directly with vetted caregivers. Your first three hires are free. No placement fees, no markups.",
  },
];

const COMMITMENT_CARDS = [
  { stat: "20 hrs/wk", label: "Average weekly commitment" },
  { stat: "Flexible", label: "Between classes, evenings, weekends, overnights, and PRN" },
  { stat: "Full-time", label: "Available during summer, winter breaks, and gap years" },
  { stat: "Zero tolerance", label: "No-call no-show policy enforced" },
];

const VETTING_STEPS = [
  {
    title: "University enrollment verified",
    detail:
      "Active enrollment in a pre-health program confirmed. Many hold CNA or MA certifications.",
  },
  {
    title: "Video intro so you can get to know them",
    detail:
      "Every applicant answers scenario-based questions on camera. Watch it before you schedule an interview.",
  },
  {
    title: "No-call no-show commitment enforced",
    detail:
      "Formal commitments to punctuality, communication, and professional conduct. One violation means removal.",
  },
  {
    title: "Schedule locked in, not vague",
    detail:
      "Specific days and hours confirmed. Evenings, weekends, overnights, between classes, breaks, and PRN availability.",
  },
  {
    title: "Job expectations set before day one",
    detail:
      "Physical demands, emotional weight, and client boundaries covered upfront. They arrive ready, not surprised.",
  },
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
              Reliable staff, sourced and vetted
              <br />
              from university health programs
            </h2>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed">
              Pre-med, pre-nursing, pre-PA, and public health caregivers who need
              real patient care hours for their professional school applications.
              They have every reason to show up and stay.
            </p>
          </div>

          {/* University logos */}
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            {UNIVERSITIES.map((uni) => (
              <Image
                key={uni.name}
                src={uni.logo}
                alt={uni.name}
                width={100}
                height={50}
                className="h-8 sm:h-10 w-auto object-contain opacity-60 grayscale"
              />
            ))}
            <span className="text-sm text-gray-400">and more</span>
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

      {/* Commitment cards */}
      <div className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-center text-gray-400 uppercase tracking-widest font-medium mb-6">
            What every caregiver commits to before going live
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMITMENT_CARDS.map((item) => (
              <div
                key={item.label}
                className="bg-white rounded-xl p-5 border border-gray-100 text-center"
              >
                <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vetting process */}
      <div className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                Our vetting process
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                We know who&apos;s ready
                <br />
                for this work
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                Not every applicant makes it through. We identify the ones who
                are genuinely committed and remove anyone who does not meet the bar.
              </p>
              <div className="mt-8 space-y-5">
                {VETTING_STEPS.map((item, i) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5 text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8">
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
            <div className="grid grid-cols-2 gap-3 lg:sticky lg:top-24">
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
