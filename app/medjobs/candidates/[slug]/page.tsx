import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { StudentMetadata, StudentProgramTrack } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROGRAM_TRACK_LABELS: Record<StudentProgramTrack, string> = {
  pre_nursing: "Pre-Nursing",
  nursing: "Nursing",
  pre_med: "Pre-Med",
  pre_pa: "Pre-PA",
  pre_health: "Pre-Health",
  other: "Other",
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabase
    .from("business_profiles")
    .select("display_name, metadata, city, state")
    .eq("slug", slug)
    .eq("type", "student")
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Candidate Not Found | Olera MedJobs" };

  const meta = data.metadata as StudentMetadata;
  return {
    title: `${data.display_name} — Student Caregiver | Olera MedJobs`,
    description: `${data.display_name} is a ${meta.program_track ? PROGRAM_TRACK_LABELS[meta.program_track] : "pre-health"} student${meta.university ? ` at ${meta.university}` : ""} seeking caregiving experience${data.city ? ` in ${data.city}, ${data.state}` : ""}.`,
  };
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("type", "student")
    .eq("is_active", true)
    .single();

  if (!profile) notFound();

  const meta = (profile.metadata || {}) as StudentMetadata;

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/medjobs/candidates" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          &larr; Back to Candidates
        </Link>

        {/* Profile Header */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                {meta.university && <span>{meta.university}</span>}
                {meta.program_track && (
                  <>
                    <span className="text-gray-300">&middot;</span>
                    <span>{PROGRAM_TRACK_LABELS[meta.program_track]}</span>
                  </>
                )}
                {profile.city && profile.state && (
                  <>
                    <span className="text-gray-300">&middot;</span>
                    <span>{profile.city}, {profile.state}</span>
                  </>
                )}
              </div>
              {meta.seeking_status === "actively_looking" && (
                <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Actively Looking
                </span>
              )}
            </div>
          </div>

          {profile.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.description}</p>
          )}

          {/* Contact — gated */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Want to connect with {profile.display_name}?</span>
              {" "}Sign in as a provider to view contact information and reach out directly.
            </p>
            <Link
              href="/for-providers"
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-semibold text-white transition-colors"
            >
              Sign In as Provider
            </Link>
          </div>
        </div>

        {/* Details Grid */}
        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          {/* Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Education</h2>
            <dl className="space-y-3">
              {meta.university && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">University</dt>
                  <dd className="text-sm text-gray-900 font-medium">{meta.university}</dd>
                </div>
              )}
              {meta.major && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Major</dt>
                  <dd className="text-sm text-gray-900">{meta.major}</dd>
                </div>
              )}
              {meta.graduation_year && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Graduation</dt>
                  <dd className="text-sm text-gray-900">{meta.graduation_year}</dd>
                </div>
              )}
              {meta.program_track && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Track</dt>
                  <dd className="text-sm text-gray-900">{PROGRAM_TRACK_LABELS[meta.program_track]}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Experience</h2>
            {(meta.certifications?.length ?? 0) > 0 && (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Certifications</dt>
                <div className="flex flex-wrap gap-1.5">
                  {meta.certifications!.map((cert) => (
                    <span key={cert} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(meta.care_experience_types?.length ?? 0) > 0 && (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Care Types</dt>
                <div className="flex flex-wrap gap-1.5">
                  {meta.care_experience_types!.map((type) => (
                    <span key={type} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {meta.years_caregiving !== undefined && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Experience</dt>
                <dd className="text-sm text-gray-900">
                  {meta.years_caregiving === 0 ? "No prior experience" : `${meta.years_caregiving}+ years`}
                </dd>
              </div>
            )}
            {(meta.languages?.length ?? 0) > 0 && (
              <div className="mt-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Languages</dt>
                <dd className="text-sm text-gray-900">{meta.languages!.join(", ")}</dd>
              </div>
            )}
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Availability</h2>
            <dl className="space-y-3">
              {meta.availability_type && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Schedule</dt>
                  <dd className="text-sm text-gray-900 capitalize">{meta.availability_type.replace(/_/g, " ")}</dd>
                </div>
              )}
              {meta.hours_per_week && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Hours/Week</dt>
                  <dd className="text-sm text-gray-900">{meta.hours_per_week} hours</dd>
                </div>
              )}
              {meta.transportation !== undefined && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Transportation</dt>
                  <dd className="text-sm text-gray-900">{meta.transportation ? "Has own transportation" : "Needs transportation"}</dd>
                </div>
              )}
              {meta.max_commute_miles && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Max Commute</dt>
                  <dd className="text-sm text-gray-900">{meta.max_commute_miles} miles</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Verified Hours */}
          {(meta.total_verified_hours ?? 0) > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Verified Experience</h2>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary-600">{meta.total_verified_hours}</p>
                <p className="text-sm text-gray-500 mt-1">Patient Care Hours</p>
              </div>
              {(meta.verified_care_types?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  {meta.verified_care_types!.map((type) => (
                    <span key={type} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
