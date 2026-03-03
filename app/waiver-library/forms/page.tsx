import type { Metadata } from "next";
import Link from "next/link";
import { allStates } from "@/data/waiver-library";
import { Breadcrumb } from "@/components/waiver-library/Breadcrumb";

export const metadata: Metadata = {
  title: "Forms & Documents | Waiver Library | Olera",
  description:
    "Browse and download official Medicaid waiver application forms and documents for every state.",
};

export default function FormsHubPage() {
  return (
    <div className="bg-vanilla-100 min-h-screen">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <Breadcrumb
            items={[
              { label: "Waiver Library", href: "/waiver-library" },
              { label: "Forms & Documents" },
            ]}
          />
          <div className="mt-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Forms &amp; Documents
            </h1>
            <p className="mt-2 text-gray-600">
              Every waiver application in one place. Select your state to view and download official forms.
            </p>
          </div>
        </div>
      </section>

      {/* State list */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allStates.map((state) => {
              const totalForms = state.programs.reduce(
                (sum, p) => sum + p.forms.length,
                0
              );

              return (
                <Link
                  key={state.id}
                  href={`/waiver-library/forms/${state.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {state.name}
                    </h2>
                    <span className="text-sm font-medium text-gray-400">
                      {state.abbreviation}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{state.programs.length} program{state.programs.length !== 1 ? "s" : ""}</span>
                    <span>{totalForms} form{totalForms !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {state.programs.map((p) => (
                      <span
                        key={p.id}
                        className="inline-block px-2 py-0.5 text-xs rounded-md bg-primary-50 text-primary-700"
                      >
                        {p.shortName}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
