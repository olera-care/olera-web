import Link from "next/link";

const links = [
  {
    title: "Young Caregivers Discord",
    description: "Connect with other young adults navigating caregiving",
    href: "https://discord.gg/olera",
    external: true,
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
      </svg>
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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Find Financial Aid Programs",
    description: "Medicare, Medicaid, and veteran benefits you may qualify for",
    href: "/benefits",
    external: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
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

        {/* Aging in America — editorial layout, no container */}
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

        {/* Flat link rows — Perena style */}
        <div className="mt-12 md:mt-16 border-t border-gray-200">
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
                className="group flex items-center gap-4 py-5 border-b border-gray-100 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
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
    </section>
  );
}
