import Image from "next/image";
import Link from "next/link";

const links = [
  {
    title: "Young Caregivers Discord",
    description: "Connect with other young adults navigating caregiving",
    href: "https://discord.gg/olera",
    external: true,
    icon: (
      <Image src="/images/discord.png" alt="" width={20} height={20} className="object-contain opacity-40" />
    ),
  },
  {
    title: "Caregiver Community",
    description: "11,000+ caregivers sharing advice and support on Facebook",
    href: "https://www.facebook.com/groups/oleracaregivers",
    external: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    title: "Caregiving Guides & Articles",
    description: "Expert resources for every stage of the care journey",
    href: "/resources",
    external: false,
    icon: (
      <Image src="/images/resources.png" alt="" width={20} height={20} className="object-contain opacity-40" />
    ),
  },
  {
    title: "Find Financial Aid Programs",
    description: "Medicare, Medicaid, and veteran benefits you may qualify for",
    href: "/benefits",
    external: false,
    icon: (
      <Image src="/images/finances.png" alt="" width={20} height={20} className="object-contain opacity-40" />
    ),
  },
];

export default function CommunitySection() {
  return (
    <section className="pt-12 md:pt-16 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 md:mb-10">
          Beyond the Search
        </h2>

        {/* Unified container */}
        <div className="bg-gray-100 rounded-2xl p-6 md:p-10">
          {/* Aging in America — editorial layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Text side */}
            <div>
              <span className="text-sm font-medium text-gray-400 tracking-wide uppercase">
                Documentary Series
              </span>
              <h3 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 leading-tight mt-2">
                Aging in America
              </h3>
              <p className="mt-3 text-base text-gray-500 max-w-md leading-relaxed">
                Explore the realities of senior care in America and discover how families navigate finding the right care.
              </p>
              <a
                href="https://www.youtube.com/@OleraCare"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-gray-900 hover:text-primary-700 transition-colors"
              >
                Watch the series
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Video side */}
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/TiVrqkrYhEc"
                  title="Aging in America — Chapter 1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Flat link rows */}
          <div className="mt-8 md:mt-10 border-t border-gray-200/80">
            {links.map((link) => {
              const Tag = link.external ? "a" : Link;
              const externalProps = link.external
                ? { target: "_blank" as const, rel: "noopener noreferrer" }
                : {};

              return (
                <Tag
                  key={link.title}
                  href={link.href}
                  {...externalProps}
                  className="group flex items-center gap-4 py-5 border-b border-gray-200/60 hover:bg-gray-200/40 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
                    {link.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[15px] font-semibold text-gray-900">
                      {link.title}
                    </span>
                    <span className="hidden sm:inline text-sm text-gray-400 ml-3">
                      {link.description}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-all group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {link.external ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    )}
                  </svg>
                </Tag>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
