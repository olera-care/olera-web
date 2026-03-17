import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "Get discovered by providers",
    description: "Senior care providers in your area browse student profiles and reach out with caregiving opportunities.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    title: "Build verified credentials",
    description: "Log patient care hours, get provider confirmations, and build a clinical experience transcript for grad school.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

const STUDENT_FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    label: "Verified clinical hours",
    detail: "Every hour logged and confirmed by your supervising provider — ready for your AMCAS or CASPA application.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    label: "Real bedside experience",
    detail: "Home care, assisted living, memory care, and hospice — the settings grad programs want to see on your application.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Flexible schedules",
    detail: "Part-time, weekends, summers — work around your classes, not the other way around.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
    label: "Paid + purposeful",
    detail: "Earn competitive hourly rates while gaining experience that actually matters for your career.",
  },
];

// Placeholder testimonials — replace with real quotes from pilot students
const TESTIMONIALS = [
  {
    quote: "Working with seniors through MedJobs gave me the patient care hours I needed for my PA application. The experience was so much more meaningful than I expected.",
    name: "Student from UT Austin",
    track: "Pre-PA, Class of 2026",
    // TODO: Replace with real photo from pilot
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces",
  },
  {
    quote: "I was struggling to find clinical experience that fit my class schedule. MedJobs matched me with a home care agency 10 minutes from campus. I work two shifts a week.",
    name: "Student from Texas A&M",
    track: "Pre-Med, Class of 2027",
    // TODO: Replace with real photo from pilot
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces",
  },
];

export default function MedJobsPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/80 via-orange-50/20 to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-28 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-100 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span className="text-xs font-medium text-primary-700">Now accepting applications for Fall 2026</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-gray-900 leading-[1.1]">
                Caregiving experience
                <br />
                <span className="text-primary-600">that counts toward</span>
                <br />
                <span className="text-primary-600">your degree</span>
              </h1>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
                Pre-health students gain verified patient care hours while
                helping seniors live better. Every hour is logged, confirmed
                by your provider, and ready for your grad school application.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-3">
                <Link
                  href="/medjobs/apply"
                  className="inline-flex items-center px-7 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
                >
                  Apply as a student
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/medjobs/candidates"
                  className="inline-flex items-center px-7 py-3.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
                >
                  I&apos;m a provider looking to hire
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Hero image with overlapping elements */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-2xl shadow-gray-900/10">
                  <Image
                  src="/images/medjobs/hero-caregiving.jpg"
                  alt="Student caregiver helping a senior — Olera MedJobs"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {/* Floating cards */}
              <div className="absolute -bottom-5 -left-3 sm:left-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">800+</p>
                  <p className="text-xs text-gray-500">Students applied</p>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 sm:right-4 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 hidden sm:block">
                <p className="text-xs text-gray-400 mb-0.5">Avg. hours earned</p>
                <p className="text-lg font-bold text-primary-600">240 hrs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar — universities */}
      <section className="py-8 sm:py-10 border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <p className="text-xs text-center text-gray-400 uppercase tracking-widest font-medium mb-5">
            Students from 50+ Texas universities
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {["UT Austin", "Texas A&M", "Rice", "Baylor", "SMU", "TCU", "UT Dallas", "Texas State", "UH"].map((name) => (
              <span key={name} className="text-[13px] font-semibold text-gray-300 tracking-wide">{name}</span>
            ))}
            <span className="text-[13px] font-medium text-primary-400">+41 more</span>
          </div>
        </div>
      </section>

      {/* Testimonial #1 — woven between sections */}
      <section className="py-14 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              <Image src={TESTIMONIALS[0].image} alt="" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-lg text-gray-700 leading-relaxed italic">
                &ldquo;{TESTIMONIALS[0].quote}&rdquo;
              </p>
              <p className="mt-3 text-sm font-medium text-gray-900">{TESTIMONIALS[0].name}</p>
              <p className="text-sm text-gray-400">{TESTIMONIALS[0].track}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Photo — sticky on scroll */}
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 lg:sticky lg:top-24 shadow-xl shadow-gray-900/5">
              <Image
                src="/images/medjobs/student-portrait.jpg"
                alt="Pre-health student caregiver"
                width={600}
                height={800}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Steps */}
            <div className="lg:py-8">
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                How it works
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                From student to caregiver
                <br />in 3 simple steps
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
                <Link
                  href="/medjobs/apply"
                  className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
                >
                  Start your application
                </Link>
                <p className="mt-3 text-sm text-gray-400">Takes about 3 minutes. No cost.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Students */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                For students
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                The clinical hours your application needs
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                PA programs require 1,000-2,000 patient care hours. Med schools want hundreds.
                MedJobs is how you get them — while getting paid and making a real difference.
              </p>
              <div className="mt-10 space-y-6">
                {STUDENT_FEATURES.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link
                  href="/medjobs/apply"
                  className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
                >
                  Create your profile
                </Link>
              </div>
            </div>

            {/* Photo mosaic */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-7 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                {/* TODO: Replace — student helping senior with activity */}
                <Image
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=667&fit=crop&crop=faces"
                  alt="Student caregiver"
                  width={500}
                  height={667}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="col-span-5 space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  {/* TODO: Replace — senior smiling */}
                  <Image
                    src="https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400&h=400&fit=crop&crop=faces"
                    alt="Happy senior"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                  {/* TODO: Replace — another caregiving moment */}
                  <Image
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=500&fit=crop&crop=faces"
                    alt="Pre-med student"
                    width={400}
                    height={500}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial #2 */}
      <section className="py-14 sm:py-16 bg-primary-50/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-100">
              <Image src={TESTIMONIALS[1].image} alt="" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-lg text-gray-700 leading-relaxed italic">
                &ldquo;{TESTIMONIALS[1].quote}&rdquo;
              </p>
              <p className="mt-3 text-sm font-medium text-gray-900">{TESTIMONIALS[1].name}</p>
              <p className="text-sm text-gray-400">{TESTIMONIALS[1].track}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the students */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">
              Meet the students
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Future doctors. Future nurses.
              <br className="hidden sm:block" />
              Current caregivers.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* TODO: Replace with real students from the pilot */}
            {[
              { name: "Sarah K.", school: "UT Austin", track: "Pre-Med", hours: "312 hrs verified", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=faces" },
              { name: "Marcus J.", school: "Texas A&M", track: "Pre-Nursing", hours: "180 hrs verified", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=faces" },
              { name: "Priya R.", school: "Rice University", track: "Pre-PA", hours: "456 hrs verified", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=faces" },
            ].map((student) => (
              <div key={student.name} className="group">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={student.image}
                    alt={student.name}
                    width={400}
                    height={500}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <p className="text-base font-semibold text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.school} &middot; {student.track}</p>
                <p className="text-sm text-primary-600 font-medium mt-0.5">{student.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Providers */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Photo */}
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 shadow-xl shadow-gray-900/5">
                {/* TODO: Replace — care facility or provider team */}
                <Image
                  src="https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop&crop=faces"
                  alt="Senior care facility team"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">
                For providers
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Staff who actually want
                <br />to be there
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Pre-health students aren&apos;t just filling a shift — they&apos;re building
                a career in healthcare. Browse profiles, review resumes, and connect
                directly. No middleman, no agency fees.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-6">
                {[
                  { stat: "92%", label: "Have 60+ university credits" },
                  { stat: "$15-18", label: "Average hourly rate" },
                  { stat: "48hr", label: "Average time to first match" },
                  { stat: "4.8/5", label: "Provider satisfaction" },
                ].map((item) => (
                  <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-2xl font-bold text-gray-900">{item.stat}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/medjobs/candidates"
                  className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors"
                >
                  Browse candidates
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA — warm, confident */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-primary-50/50" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Your clinical experience
            <br />
            <span className="text-primary-600">starts here</span>
          </h2>
          <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
            3 minutes to create your profile. No cost, no commitment.
            Join 800+ students already building their healthcare careers through Olera MedJobs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/medjobs/apply"
              className="inline-flex items-center px-8 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20"
            >
              Apply as a student
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/medjobs/candidates"
              className="inline-flex items-center px-8 py-3.5 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
            >
              I&apos;m a provider
              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
