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

const STATS = [
  { value: "800+", label: "Student applications" },
  { value: "50+", label: "Partner universities" },
  { value: "1,000+", label: "Clinical hours logged" },
];

const HOW_IT_WORKS = [
  {
    title: "Create your profile",
    description: "Add your university, major, certifications, and availability. Upload a resume and record a short video intro.",
  },
  {
    title: "Get discovered by providers",
    description: "Senior care providers in your area browse student profiles and reach out with opportunities that fit your schedule.",
  },
  {
    title: "Build verified credentials",
    description: "Log patient care hours, get provider confirmations, and build a clinical experience record for your grad school applications.",
  },
];

const STUDENT_FEATURES = [
  { label: "Verified clinical hours", detail: "Logged and confirmed by your supervising provider" },
  { label: "Real bedside experience", detail: "Home care, assisted living, memory care, and more" },
  { label: "Flexible schedules", detail: "Part-time work that fits around your classes" },
  { label: "Stronger applications", detail: "Pre-med, pre-PA, and nursing programs value patient care hours" },
];

const PROVIDER_FEATURES = [
  { label: "Motivated workforce", detail: "Pre-health students are compassionate and eager to learn" },
  { label: "Part-time coverage", detail: "Evenings, weekends, and summers — when you need it most" },
  { label: "Instant alerts", detail: "Get notified when new candidates match your area" },
  { label: "Self-serve hiring", detail: "Browse profiles, review resumes, connect directly" },
];

export default function MedJobsPage() {
  return (
    <main className="bg-white">
      {/* Hero — warm, photo-forward */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-50/60 via-white to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy */}
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-4">
                Olera MedJobs
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-gray-900 leading-[1.1]">
                Caregiving experience
                <br />
                <span className="text-primary-600">that counts</span>
              </h1>
              <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
                Pre-health students gain verified patient care hours while
                helping seniors live better. Providers find motivated,
                compassionate workers who actually want to be there.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/medjobs/apply"
                  className="inline-flex items-center px-7 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm"
                >
                  Apply as a student
                </Link>
                <Link
                  href="/medjobs/candidates"
                  className="inline-flex items-center px-7 py-3.5 bg-white text-gray-700 text-sm font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  I&apos;m hiring
                </Link>
              </div>
            </div>

            {/* Right — hero image */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100">
                {/* Placeholder — replace with real photo of student with senior */}
                <Image
                  src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&h=600&fit=crop&crop=faces"
                  alt="Student caregiver helping a senior"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {/* Floating stat card */}
              <div className="absolute -bottom-6 -left-4 sm:left-6 bg-white rounded-2xl shadow-lg border border-gray-100 px-5 py-4">
                <p className="text-2xl font-bold text-primary-600">800+</p>
                <p className="text-sm text-gray-500">Students have applied</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-12 sm:py-16 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — photo */}
            <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 lg:sticky lg:top-24">
              {/* Placeholder — replace with photo of student in scrubs or at a care facility */}
              <Image
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop&crop=faces"
                alt="Pre-health student in clinical setting"
                width={600}
                height={800}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right — steps */}
            <div>
              <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-4">
                How it works
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                From student to caregiver in 3 steps
              </h2>
              <div className="mt-10 space-y-0">
                {HOW_IT_WORKS.map((item, i) => (
                  <div key={item.title} className="py-8 border-t border-gray-100">
                    <div className="flex items-start gap-5">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-sm font-semibold">
                        {i + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="mt-1.5 text-[15px] text-gray-500 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pl-[60px]">
                <Link
                  href="/medjobs/apply"
                  className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Students — warm section */}
      <section className="py-20 sm:py-28 bg-primary-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm tracking-widest uppercase text-primary-600 font-medium mb-3">
                For students
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Experience that opens doors
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Medical, PA, and nursing programs want to see patient care hours.
                MedJobs gives you a way to earn them — paid, flexible, and verified.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-x-10 gap-y-5">
                {STUDENT_FEATURES.map((item) => (
                  <div key={item.label}>
                    <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/medjobs/apply"
                  className="inline-flex items-center px-7 py-3 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors"
                >
                  Create your profile
                </Link>
              </div>
            </div>

            {/* Photo grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                  {/* Placeholder — student helping senior with activity */}
                  <Image
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=533&fit=crop&crop=faces"
                    alt="Student caregiver"
                    width={400}
                    height={533}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  {/* Placeholder — senior smiling */}
                  <Image
                    src="https://images.unsplash.com/photo-1581579438747-104c53d7fbc4?w=400&h=400&fit=crop&crop=faces"
                    alt="Happy senior with caregiver"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                  {/* Placeholder — student with stethoscope */}
                  <Image
                    src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces"
                    alt="Pre-med student"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
                  {/* Placeholder — caregiving moment */}
                  <Image
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=533&fit=crop&crop=faces"
                    alt="Caregiving moment"
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

      {/* Meet the students — faces, names, real */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">
            Meet the students
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Driven by purpose, not just a paycheck
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Our students are future doctors, nurses, and PAs. They bring energy, empathy,
            and a genuine desire to make a difference.
          </p>
          <div className="mt-12 grid sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Placeholder student cards — replace with real students */}
            {[
              { name: "Sarah K.", school: "UT Austin", track: "Pre-Med", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=faces" },
              { name: "Marcus J.", school: "Texas A&M", track: "Pre-Nursing", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces" },
              { name: "Priya R.", school: "Rice University", track: "Pre-PA", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=faces" },
            ].map((student) => (
              <div key={student.name} className="text-center">
                <div className="w-28 h-28 mx-auto rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={student.image}
                    alt={student.name}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-4 text-base font-semibold text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.school}</p>
                <p className="text-sm text-primary-600 font-medium">{student.track}</p>
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
              <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100">
                {/* Placeholder — provider facility or team */}
                <Image
                  src="https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&h=600&fit=crop&crop=faces"
                  alt="Senior care facility team"
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Copy */}
            <div className="order-1 lg:order-2">
              <p className="text-sm tracking-widest uppercase text-gray-400 font-medium mb-3">
                For providers
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Staff who actually want to be there
              </h2>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Pre-health students aren&apos;t just filling a shift — they&apos;re building
                a career in healthcare. That changes everything about how they show up.
              </p>
              <div className="mt-8 grid sm:grid-cols-2 gap-x-10 gap-y-5">
                {PROVIDER_FEATURES.map((item) => (
                  <div key={item.label}>
                    <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/medjobs/candidates"
                  className="inline-flex items-center px-7 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:opacity-80 transition-opacity"
                >
                  Browse candidates
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University strip */}
      <section className="py-12 sm:py-16 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-400 mb-6">
            Students from universities across Texas
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-gray-300">
            <span>UT Austin</span>
            <span>Texas A&M</span>
            <span>Rice</span>
            <span>Baylor</span>
            <span>SMU</span>
            <span>TCU</span>
            <span>UT Dallas</span>
            <span>Texas State</span>
            <span>UH</span>
            <span className="text-gray-400">+41 more</span>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
            Start building your
            <br />
            <span className="text-primary-600">clinical experience</span> today
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            It takes 3 minutes to create your profile. No cost, no commitment.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/medjobs/apply"
              className="inline-flex items-center px-8 py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-full hover:bg-primary-700 transition-colors shadow-sm"
            >
              Apply as a student
            </Link>
            <Link
              href="/medjobs/candidates"
              className="inline-flex items-center px-8 py-3.5 bg-white text-gray-700 text-sm font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              I&apos;m a provider
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
