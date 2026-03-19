import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "MedJobs for Providers — Student Caregiver Staffing | Olera",
  description:
    "Find reliable, pre-screened student caregivers for your senior care facility. Browse profiles, watch intro videos, and hire directly through Olera MedJobs.",
};

const PAIN_POINTS = [
  {
    problem: "High turnover drains your budget",
    solution: "Healthcare students stay longer — they need consistent hours for their professional school applications.",
  },
  {
    problem: "Last-minute call-outs hurt your clients",
    solution: "Every student completes reliability acknowledgments and commits to a schedule before their profile goes live.",
  },
  {
    problem: "Agency fees eat into your margins",
    solution: "Connect directly with students. No placement fees, no markups, no middlemen.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Browse pre-screened students",
    description: "Every student has submitted an intro video, completed acknowledgments, and verified their university enrollment.",
  },
  {
    step: "2",
    title: "Watch their intro video",
    description: "See who you're hiring before the first interview. Students answer reliability and scenario questions on camera.",
  },
  {
    step: "3",
    title: "Schedule an interview",
    description: "Reach out directly — no gatekeepers. Students are responsive and eager to start.",
  },
];

const STATS = [
  { stat: "85%", label: "Student retention after 90 days" },
  { stat: "15-20", label: "Average weekly hours per student" },
  { stat: "70%", label: "Available evenings & weekends" },
  { stat: "4.8/5", label: "Provider satisfaction" },
];

export default function MedJobsProvidersPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-gray-900 leading-[1.1]">
                Staff who show up{" "}
                <span className="text-primary-600">for your clients</span>
              </h1>
              <p className="mt-5 text-[17px] text-gray-500 leading-relaxed max-w-lg">
                Pre-screened healthcare students who need consistent hours.
                Browse profiles, watch intro videos, hire directly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <Link
                  href="/medjobs/candidates"
                  className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
                >
                  Browse Candidates
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/medjobs"
                  className="inline-flex items-center px-7 py-3 text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors"
                >
                  I&apos;m a student
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg shadow-gray-200/50">
                <Image
                  src="/images/medjobs/provider-caregiving.jpg"
                  alt="Student caregiver working with senior client"
                  width={1080}
                  height={1080}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
              The staffing problem
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              You need reliable staff.
              <br />Not another agency.
            </h2>
          </div>
          <div className="mt-12 grid sm:grid-cols-3 gap-8">
            {PAIN_POINTS.map((item) => (
              <div key={item.problem}>
                <p className="text-sm font-semibold text-gray-900">{item.problem}</p>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-5 border border-gray-100 text-center">
                <p className="text-3xl font-bold text-gray-900">{item.stat}</p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
              How it works
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              From browse to hire in days, not weeks
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes MedJobs students different */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                Why MedJobs students
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Motivated by more than a paycheck
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                These are students pursuing medicine, nursing, PA, PT, and public health.
                They need verified healthcare hours for their professional school applications.
                That means they show up, stay engaged, and build real relationships with your clients.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Intro video reviewed before profile goes live",
                  "Reliability and professionalism acknowledgments completed",
                  "Availability and schedule commitment verified",
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
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/medjobs/students-group.jpg"
                  alt="Healthcare students"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mt-8">
                <Image
                  src="/images/medjobs/caregiving-support.jpg"
                  alt="Student supporting senior client"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-gray-50/50" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Better staff.{" "}
            <span className="text-primary-600">Less turnover.</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Browse pre-screened student caregivers near your facility. No fees, no commitment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/medjobs/candidates"
              className="inline-flex items-center px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              Browse Candidates
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/medjobs"
              className="inline-flex items-center px-8 py-3 text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors"
            >
              I&apos;m a student
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
