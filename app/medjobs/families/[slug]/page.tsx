import { notFound } from "next/navigation";
import Link from "next/link";
import { getSampleFamilyBySlug } from "@/lib/medjobs/demo-family";
import SampleFamilyCTA from "@/components/medjobs/SampleFamilyCTA";

/**
 * Read-only sample family detail — the explorable page behind a demo card on
 * the student families board (cold-start). Static, clearly labeled "Sample
 * listing," CTA routes to the eligibility screener. Real providers use
 * /provider/[slug]?ctx=medjobs-student; this route only resolves sample slugs.
 */

export default async function SampleFamilyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fam = getSampleFamilyBySlug(slug);
  if (!fam) notFound();

  const initials = fam.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <Link href="/medjobs/families" className="text-sm font-medium text-primary-700 hover:underline">
          ← Back to families
        </Link>

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold">Sample listing</span> — an example of the
          kind of family hiring student caregivers near your campus, not a live
          opening. Check your eligibility to see real families near you.
        </div>

        <div className="mt-6 grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">
          {/* Content */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
              <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50">
                <div className="flex flex-col items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-sm">
                    <span className="text-2xl font-bold text-primary-400">{initials}</span>
                  </div>
                  <span className="mt-2 text-xs font-medium text-primary-300">{fam.primaryCategory}</span>
                </div>
              </div>
              <div className="p-6">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Hiring student caregivers
                </p>
                <h1 className="mt-2 font-display text-2xl font-bold text-gray-900">
                  {fam.primaryCategory} through {fam.name}
                </h1>
                {fam.highlights.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {fam.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky CTA */}
          <div className="mt-6 lg:mt-0">
            <div className="rounded-2xl border border-primary-200 bg-white p-6 lg:sticky lg:top-6">
              <p className="font-serif text-lg text-gray-900">Want to work with families like this?</p>
              <p className="mt-1 text-sm text-gray-600">
                This is the kind of family you can work with to earn the patient-care hours your
                application needs.
              </p>
              <SampleFamilyCTA />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
