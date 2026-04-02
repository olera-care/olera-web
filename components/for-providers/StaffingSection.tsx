import Image from "next/image";
import Link from "next/link";

const PAIN_POINTS = [
  {
    problem: "High turnover drains your budget",
    solution:
      "Our caregivers are pursuing careers in healthcare. They need consistent hours and long-term placements, not a stopgap between gigs.",
  },
  {
    problem: "Last-minute call-outs hurt your clients",
    solution:
      "Every caregiver signs a no-call no-show commitment and locks in a schedule before their profile goes live. We take reliability seriously.",
  },
  {
    problem: "Agency fees eat into your margins",
    solution:
      "Connect directly with vetted caregivers. No placement fees, no markups, no middlemen. Your first three interviews are free.",
  },
];

const STATS = [
  { stat: "85%", label: "Caregiver retention after 90 days" },
  { stat: "15-20", label: "Average weekly hours per caregiver" },
  { stat: "70%", label: "Available evenings & weekends" },
  { stat: "4.8/5", label: "Provider satisfaction" },
];

const VETTING_STEPS = [
  {
    title: "University enrollment verified",
    detail:
      "We confirm active enrollment in a pre-health program: pre-med, pre-nursing, pre-PA, PT, or public health. Many hold CNA or MA certifications already. No exceptions on enrollment verification.",
  },
  {
    title: "Video intro so you can get to know them",
    detail:
      "Every applicant records a video answering scenario-based questions about reliability, client boundaries, and caregiving situations. You can watch it before you ever schedule an interview.",
  },
  {
    title: "No-call no-show commitment enforced",
    detail:
      "Caregivers sign formal commitments to punctuality, professional conduct, and communication standards. We make it clear: if you no-call no-show for an interview or a shift, you are removed from the platform.",
  },
  {
    title: "Schedule flexibility that fills your hardest shifts",
    detail:
      "These caregivers want to work evenings, weekends, and overnights because those hours fit around their classes. During summer and winter breaks, many are available full-time. Gap year caregivers between undergrad and medical or PA school can work full-time year-round.",
  },
  {
    title: "Realistic expectations set before day one",
    detail:
      "We prepare every caregiver for the physical demands, emotional weight, and professional boundaries of the job. If they don't have prior experience, we set clear expectations for on-the-job training. They arrive ready to learn, not surprised by the work.",
  },
];

export default function StaffingSection() {
  return (
    <section id="staffing" className="scroll-mt-20">
      {/* Header + pain points */}
      <div className="pt-10 sm:pt-14 pb-16 sm:pb-20 bg-white">
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
              We recruit caregivers from pre-med, pre-nursing, pre-PA, and
              public health programs at universities across the country. They
              are building careers in healthcare, which means they need real
              patient care hours and have every reason to be reliable,
              professional, and engaged with your clients.
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

      {/* Our vetting process */}
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
                You might be thinking: are pre-health college students actually
                good employees? The honest answer is that not all of them are.
                That is exactly why our vetting process exists. We identify the
                ones who are genuinely committed to caregiving, set clear
                expectations, and remove anyone who does not meet the bar.
              </p>
              <div className="mt-10 space-y-6">
                {VETTING_STEPS.map((item, i) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5 text-sm font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
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
