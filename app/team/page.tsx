import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Our Team | Olera",
  description:
    "Meet the people behind Olera — a team of engineers, physicians, and caregivers building a better way to find senior care.",
  alternates: { canonical: "/team" },
  openGraph: {
    title: "Our Team | Olera",
    description:
      "Meet the people behind Olera — a team of engineers, physicians, and caregivers building a better way to find senior care.",
    url: "/team",
    siteName: "Olera",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Team | Olera",
    description:
      "Meet the people behind Olera — a team of engineers, physicians, and caregivers building a better way to find senior care.",
  },
};

const leaders = [
  {
    name: "TJ Falohun, MS",
    role: "Co-Founder & CEO",
    bio: "Before founding Olera, TJ worked at Pfizer as a biomedical engineer designing auto-injectors. Watching his own family navigate the fragmented senior care landscape sparked a mission: make finding quality care as straightforward as booking a flight. He leads product and engineering, obsessing over every detail so families don\u2019t have to.",
    image: "/images/for-providers/team/tj.jpg",
    linkedIn: "https://www.linkedin.com/in/tfalohun/",
  },
  {
    name: "Logan DuBose, MD, MBA",
    role: "Co-Founder & COO",
    bio: "Logan brings a rare combination of clinical depth and business acumen to Olera. As a physician with an MBA, he\u2019s seen firsthand how difficult it is for families to find trustworthy senior care. He oversees operations and provider partnerships, ensuring every listing on Olera meets the standard he\u2019d want for his own patients.",
    image: "/images/for-providers/team/logan.jpg",
    linkedIn: "https://www.linkedin.com/in/logan-dubose/",
  },
];

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function TeamPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="pt-20 md:pt-28 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Built by people who understand care
          </h1>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Olera was founded to make finding quality senior care less
            overwhelming and more human. We&apos;re a small team with a clear
            mission — connect families with the right care, faster.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {leaders.map((leader) => (
              <div key={leader.name} className="group">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
                  <Image
                    src={leader.image}
                    alt={leader.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-6">
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">
                    {leader.role}
                  </p>
                  <h3 className="font-display text-xl md:text-2xl font-bold text-gray-900 mt-1">
                    {leader.name}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed mt-3">
                    {leader.bio}
                  </p>
                  <a
                    href={leader.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-gray-400 hover:text-primary-600 transition-colors duration-200"
                    aria-label={`${leader.name} on LinkedIn`}
                  >
                    <LinkedInIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
