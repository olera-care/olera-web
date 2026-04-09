import Link from "next/link";

interface NextSectionCtaProps {
  label: string;
  href: string;
}

export function NextSectionCta({ label, href }: NextSectionCtaProps) {
  return (
    <section className="pb-10 md:pb-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={href}
          className="group flex items-center justify-between gap-4 bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50/40 rounded-xl shadow-sm p-5 transition-colors"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Next</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900 group-hover:text-primary-700">{label}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25 group-hover:bg-primary-700 transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </section>
  );
}
