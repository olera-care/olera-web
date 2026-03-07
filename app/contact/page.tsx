import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us | Olera",
  description:
    "Get in touch with the Olera team. We're here to help families find quality senior care. Phone: +1 979-243-9801, Email: support@olera.care.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us | Olera",
    description:
      "Get in touch with the Olera team. We're here to help families find quality senior care.",
    url: "/contact",
    siteName: "Olera",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-20 md:pt-28 pb-12 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Contact Us
          </h1>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">
            We&apos;re here to help. Whether you have a question about finding care,
            listing your facility, or anything else — reach out and we&apos;ll get
            back to you.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <a
              href="tel:+19792439801"
              className="group flex items-start gap-5 p-6 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  Phone
                </h2>
                <p className="mt-1 text-primary-600 font-medium">
                  +1 (979) 243-9801
                </p>
                <p className="mt-1 text-sm text-gray-500">United States</p>
              </div>
            </a>

            {/* Email */}
            <a
              href="mailto:support@olera.care"
              className="group flex items-start gap-5 p-6 bg-gray-50 border border-gray-200 rounded-xl hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  Email
                </h2>
                <p className="mt-1 text-primary-600 font-medium">
                  support@olera.care
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  We typically respond within 1 business day
                </p>
              </div>
            </a>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-amber-800">
                <span className="font-semibold">Please note:</span> Olera is an
                online senior care directory, not a home care agency or senior
                living facility. If you&apos;re trying to contact a specific agency
                or community, please reach out to them directly through their
                listing on our{" "}
                <Link
                  href="/browse"
                  className="text-amber-900 underline hover:text-amber-700"
                >
                  browse page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Providers CTA */}
      <section className="py-12 md:py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Are you a care provider?
          </h2>
          <p className="mt-3 text-gray-500">
            List your facility on Olera to connect with families searching for
            quality senior care in your area.
          </p>
          <div className="mt-6">
            <Link
              href="/for-providers"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-sm transition-colors"
            >
              Learn More for Providers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
