import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MedJobs — Student Caregiver Talent Marketplace | Olera",
  description:
    "Gain verified clinical experience as a pre-health student caregiver, or find motivated student talent for your senior care facility. Olera MedJobs connects students with providers.",
  openGraph: {
    title: "MedJobs — Student Caregiver Talent Marketplace | Olera",
    description:
      "Gain verified clinical experience as a pre-health student caregiver, or find motivated student talent for your senior care facility.",
  },
};

const HOW_IT_WORKS = [
  {
    title: "Create your profile",
    description: "Add your university, major, certifications, and availability. Upload a resume and record a short video intro.",
  },
  {
    title: "Get discovered",
    description: "Providers in your area browse student profiles and reach out with caregiving opportunities that fit your schedule.",
  },
  {
    title: "Build verified credentials",
    description: "Log hours, get provider confirmations, and build a clinical experience record for grad school applications.",
  },
];

const WHAT_YOU_GET = [
  { label: "Verified clinical hours", detail: "Logged and confirmed by your supervising provider" },
  { label: "Real bedside experience", detail: "Home care, assisted living, memory care, and more" },
  { label: "Flexible schedules", detail: "Part-time work that fits around your classes" },
  { label: "Stronger applications", detail: "Pre-med, pre-PA, and nursing programs value patient care hours" },
];

const FOR_PROVIDERS = [
  { label: "Motivated workforce", detail: "Pre-health students are compassionate and eager to learn" },
  { label: "Part-time coverage", detail: "Evenings, weekends, and summers — when you need it most" },
  { label: "Instant alerts", detail: "Get notified when new candidates match your area" },
  { label: "Self-serve hiring", detail: "Browse profiles, review resumes, connect directly" },
];

export default function MedJobsPage() {
  return (
    <main className="bg-[#faf8f5]">
      {/* Hero */}
      <section className="pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-6">
            Olera MedJobs
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.08]">
            Caregiving experience
            <br />
            <span className="text-primary-600">that counts</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-xl mx-auto">
            Pre-health students gain verified patient care hours.
            Providers find motivated, compassionate workers.
          </p>
          <div className="mt-10">
            <Link
              href="/medjobs/apply"
              className="inline-flex items-center px-8 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
            >
              Create your profile
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            <Link href="/medjobs/candidates" className="underline underline-offset-4 hover:text-gray-600 transition-colors">
              Hiring? Browse candidates
            </Link>
          </p>
        </div>
      </section>

      {/* Social proof — quiet, specific */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-400">
            Students from UT Austin, Texas A&M, Baylor, Rice, and 46 other universities
          </p>
        </div>
      </section>

      {/* How it works — flat list, Perena-style */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-10">
            How it works
          </p>
          <div className="space-y-0">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.title} className="py-8 border-t border-gray-200/80">
                <div className="flex items-start gap-6">
                  <span className="text-sm text-gray-300 font-medium pt-0.5 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                    <p className="mt-1.5 text-[15px] text-gray-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Students */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">
            For students
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Experience that opens doors
          </h2>
          <p className="mt-3 text-lg text-gray-500 leading-relaxed">
            Medical, PA, and nursing programs want to see patient care hours.
            MedJobs gives you a way to earn them — paid, flexible, and verified.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-6">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.label}>
                <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-400 mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/medjobs/apply"
              className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
            >
              Apply now
            </Link>
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">
            For providers
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Staff who actually want to be there
          </h2>
          <p className="mt-3 text-lg text-gray-500 leading-relaxed">
            Pre-health students aren&apos;t just filling a shift — they&apos;re building a career
            in healthcare. That changes everything about how they show up.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-6">
            {FOR_PROVIDERS.map((item) => (
              <div key={item.label}>
                <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-400 mt-0.5">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link
              href="/medjobs/candidates"
              className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
            >
              Browse candidates
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-24 sm:pb-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            3 minutes to create your profile
          </h2>
          <div className="mt-8">
            <Link
              href="/medjobs/apply"
              className="inline-flex items-center px-8 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
            >
              Get started
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            <Link href="/medjobs/candidates" className="underline underline-offset-4 hover:text-gray-600 transition-colors">
              Or browse candidates as a provider
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
