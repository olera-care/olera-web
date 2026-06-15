import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";

export const metadata: Metadata = {
  title: "Student Caregiver Internship for Providers | Olera",
  description:
    "Vetted pre-nursing and pre-medical student caregivers who commit to a semester of recurring availability. We match them to the clients you struggle to cover — no upfront commitment.",
};

const PAIN_POINTS = [
  {
    problem: "Recurring shifts go uncovered",
    solution:
      "Student caregivers commit to a semester of recurring availability. We match one to a client whose schedule lines up, so you get a reliable caregiver for the term.",
  },
  {
    problem: "Last-minute call-outs hurt your clients",
    solution:
      "Every caregiver completes reliability acknowledgments and commits to a schedule before we match them — they're building a clinical record, not picking up a side gig.",
  },
  {
    problem: "Agency markups eat your margins",
    solution:
      "Match directly with vetted students from a local university. No upfront commitment — the internship begins only when you have a recurring need.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Browse vetted caregivers near you",
    description:
      "Every caregiver has recorded an intro video, completed reliability acknowledgments, and verified their university enrollment.",
  },
  {
    step: "2",
    title: "Match for the semester",
    description:
      "When you have a client who needs recurring coverage, we match a caregiver whose availability fits and the internship begins.",
  },
  {
    step: "3",
    title: "Reliable recurring coverage",
    description:
      "You get a motivated caregiver for the term — and a pipeline of pre-health students you could hire on.",
  },
];

// Honest, pilot-true credibility — no fabricated retention/rating stats.
const TRUST = [
  { stat: "Semester", label: "Recurring availability per caregiver" },
  { stat: "No upfront cost", label: "Matched only when you have a recurring need" },
  { stat: "Pre-nursing & pre-med", label: "Vetted students from a local university" },
  { stat: "NIH-backed", label: "Early work toward a National Institute on Aging grant" },
];

export default async function MedJobsProvidersPage({
  searchParams,
}: {
  searchParams: Promise<{ campus?: string }>;
}) {
  // Thread the campus from the cold email (/medjobs/providers?campus=slug) into
  // both board CTAs so the board lands filtered to their campus. Geo is the
  // fallback when no campus is present.
  const sp = await searchParams;
  const campus = typeof sp.campus === "string" ? sp.campus : null;
  const campusQ = campus ? `&campus=${encodeURIComponent(campus)}` : "";
  const eligibilityHref = `/medjobs/candidates?welcome=1${campusQ}`;
  const browseHref = `/medjobs/candidates${campus ? `?campus=${encodeURIComponent(campus)}` : ""}`;
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-16 pb-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-gray-900 leading-[1.1]">
                Vetted student caregivers{" "}
                <span className="text-primary-600">for the shifts you struggle to cover</span>
              </h1>
              <p className="mt-5 text-[17px] text-gray-500 leading-relaxed max-w-lg">
                A structured caregiving internship that places pre-nursing and
                pre-medical students with your clients for a semester of recurring
                coverage. No commitment up front. We match a student caregiver when
                you have a recurring need.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <Link
                  href={eligibilityHref}
                  className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
                >
                  Check your eligibility to host
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href={browseHref}
                  className="inline-flex items-center px-7 py-3 text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors"
                >
                  Hire local caregivers
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg shadow-gray-200/50">
                <Image
                  src="/images/medjobs/provider-caregiving.jpg"
                  alt="Pre-health student caregiver working with a senior client"
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
              You need reliable coverage.
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

      {/* Trust / credibility */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map((item) => (
              <div key={item.label} className="bg-white rounded-xl p-5 border border-gray-100 text-center">
                <p className="text-xl font-bold text-gray-900">{item.stat}</p>
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
              From match to recurring coverage
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

      {/* What makes pre-health caregivers different */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                Why pre-health caregivers
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Motivated by more than a paycheck
              </h2>
              <p className="mt-4 text-gray-500 leading-relaxed">
                These are students pursuing medicine, nursing, PA, PT, and public
                health. They need supervised healthcare experience and references
                for their professional school applications. That means they commit
                to the semester, show up, and build real relationships with your clients.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Intro video reviewed before profile goes live",
                  "Reliability and professionalism acknowledgments completed",
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
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src="/images/medjobs/students-group.jpg"
                  alt="Pre-health students"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mt-8">
                <Image
                  src="/images/medjobs/caregiving-support.jpg"
                  alt="Caregiver supporting a senior client"
                  width={400}
                  height={533}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why this exists — credibility (Dr. DuBose / NIH) */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-4 text-center">
            Why this exists
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-gray-100 bg-gray-50 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://olera.care/images/for-providers/team/logan.jpg"
              alt="Dr. Logan DuBose"
              width={72}
              height={72}
              className="h-18 w-18 shrink-0 rounded-lg object-cover"
              style={{ height: 72, width: 72 }}
            />
            <div className="text-sm text-gray-700 leading-relaxed">
              <p className="font-semibold text-gray-900">Dr. Logan DuBose, MD, MBA</p>
              <p className="text-xs text-gray-500">
                NIH-funded researcher · Chief Research Officer, Olera
              </p>
              <p className="mt-2">
                Dr. DuBose runs this internship as early work toward a National
                Institute on Aging grant — building the next generation of
                healthcare workers while strengthening care for local seniors.
                It&apos;s a matched program, not a staffing marketplace: we select a
                small founding group of provider partners and pair them with
                committed caregivers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/30 to-gray-50/50" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Reliable coverage.{" "}
            <span className="text-primary-600">Future clinicians.</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            Check your eligibility to host vetted student caregivers near your facility. No upfront commitment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={eligibilityHref}
              className="inline-flex items-center px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
              Check your eligibility to host
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href={CALENDLY_URL}
              className="inline-flex items-center px-8 py-3 text-gray-500 text-sm font-medium hover:text-gray-900 transition-colors"
            >
              Talk with Dr. DuBose
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
