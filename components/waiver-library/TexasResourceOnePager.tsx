import type { ResourceProgramContent } from "@/data/texas-resources";

interface Props {
  content: ResourceProgramContent;
}

function telHref(number: string): string {
  return `tel:${number.replace(/[^0-9+]/g, "")}`;
}

export function TexasResourceOnePager({ content }: Props) {
  // If documents exist, move Helpful Links into the sidebar so
  // "Who can use this" and "What to have ready" can sit side-by-side
  // without leaving blank space.
  const hasDocuments = !!content.documents?.length;
  const linksInSidebar = hasDocuments;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Intro + primary phone CTA */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-50 text-success-700 text-[11px] font-semibold uppercase tracking-wide border border-success-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Free Resource
          </span>
          <p className="mt-3 text-lg md:text-xl font-semibold text-gray-900 leading-snug">
            {content.tagline}
          </p>
          <p className="mt-3 text-gray-600 leading-relaxed">{content.intro}</p>
          {content.timeline && (
            <div className="mt-5 inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3.5 py-2 text-sm">
              <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-gray-900">Timeline:</span>
              <span className="text-gray-700">{content.timeline}</span>
            </div>
          )}
        </div>

        {/* Phone CTA sidebar */}
        <aside className="bg-success-50 border border-success-200 rounded-2xl p-6 md:p-7 flex flex-col">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-success-200 mb-3">
            <svg className="w-5 h-5 text-success-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-gray-900">Call to get help</h2>
          <p className="mt-1 text-xs text-gray-600">This is a free service — no application required.</p>
          <div className="mt-4 space-y-3">
            {content.phones.map((phone) => (
              <a
                key={`${phone.label}-${phone.number}`}
                href={telHref(phone.number)}
                className="block bg-white border border-success-200 rounded-xl px-4 py-3 hover:border-success-400 hover:shadow-sm transition-all no-underline"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-success-700">
                  {phone.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-gray-900">{phone.number}</p>
                {phone.note && <p className="mt-0.5 text-xs text-gray-500">{phone.note}</p>}
              </a>
            ))}
          </div>

          {linksInSidebar && (
            <div className="mt-5 pt-5 border-t border-success-200">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-success-700">Helpful links</p>
              <ul className="mt-2 space-y-2">
                {content.websites.map((site) => (
                  <li key={site.url}>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-600 no-underline"
                    >
                      <span>{site.label}</span>
                      <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {/* Services */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">What they help with</h2>
        <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {content.services.map((service) => (
            <li key={service} className="flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-50 border border-success-200">
                <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-sm text-gray-700 leading-relaxed">{service}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Eligibility paired with Documents (if links are in sidebar)
          OR paired with Helpful Links (if no documents). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-7">
          <h2 className="text-lg font-bold text-gray-900">Who can use this</h2>
          <ul className="mt-3 space-y-2.5">
            {content.eligibility.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {linksInSidebar && content.documents && content.documents.length > 0 ? (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-7">
            <h2 className="text-lg font-bold text-gray-900">What to have ready</h2>
            <ul className="mt-3 space-y-2.5">
              {content.documents.map((doc) => (
                <li key={doc} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-7">
            <h2 className="text-lg font-bold text-gray-900">Helpful links</h2>
            <ul className="mt-3 space-y-2">
              {content.websites.map((site) => (
                <li key={site.url}>
                  <a
                    href={site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 hover:text-primary-600 no-underline break-all"
                  >
                    {site.label}
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Address row (only when it exists) */}
      {content.address && (
        <div className="mb-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-7">
            <h2 className="text-lg font-bold text-gray-900">Mailing address</h2>
            <div className="mt-3 flex items-start gap-2.5">
              <svg className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <address className="not-italic text-sm text-gray-700 leading-relaxed">
                {content.address.lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </address>
            </div>
            {content.address.note && (
              <p className="mt-3 text-xs text-gray-500 italic">{content.address.note}</p>
            )}
          </section>
        </div>
      )}

      {/* Service areas (full width) */}
      {content.serviceAreas && content.serviceAreas.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Local service areas</h2>
          <p className="mt-1 text-sm text-gray-600">This program is delivered locally — use the link for your area to apply or get connected.</p>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {content.serviceAreas.map((area) => (
              <li key={area.url}>
                <a
                  href={area.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/40 transition-colors no-underline"
                >
                  <span className="text-sm font-semibold text-gray-900">{area.label}</span>
                  <svg className="w-4 h-4 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
