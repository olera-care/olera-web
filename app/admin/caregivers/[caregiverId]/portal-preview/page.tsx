"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { StudentMetadata } from "@/lib/types";
import {
  getTrackLabel,
  formatHoursPerWeek,
  formatDuration,
  hasVideo,
  getYouTubeId,
  INTENDED_SCHOOL_LABELS,
} from "@/lib/medjobs-helpers";
import {
  calculateCompleteness,
  getVerificationItems,
} from "@/lib/medjobs-completeness";
import CaregiverSectionCard from "@/components/caregiver-portal/cards/CaregiverSectionCard";

interface StudentProfile {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  image_url: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata;
}

export default function AdminPortalPreviewPage() {
  const { caregiverId: studentId } = useParams<{ caregiverId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/admin/caregivers/${studentId}`);
        if (!res.ok) {
          router.push("/admin/caregivers");
          return;
        }
        const data = await res.json();
        setStudent(data.student);
      } catch {
        router.push("/admin/caregivers");
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [studentId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading preview...</div>
      </div>
    );
  }

  if (!student) return null;

  const meta = (student.metadata || {}) as StudentMetadata;
  const trackLabel = getTrackLabel(meta);
  const hasPhoto = !!student.image_url;
  const hasBasicInfo = {
    hasName: !!student.display_name,
    hasEmail: !!student.email,
    hasPhone: !!student.phone,
    hasUniversity: !!meta.university,
    hasLocation: !!(student.city || student.state),
  };
  const completeness = calculateCompleteness(meta, hasPhoto, hasBasicInfo);
  const verificationItems = getVerificationItems(meta);
  const videoAvailable = hasVideo(meta);
  const youtubeId = videoAvailable ? getYouTubeId(meta.video_intro_url!) : null;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Admin Preview Header */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-blue-900">Admin Preview</h2>
              <p className="text-xs text-blue-700">This is what {student.display_name?.split(" ")[0] || "the student"} sees on their portal</p>
            </div>
          </div>
          <Link
            href={`/admin/caregivers/${studentId}`}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
          >
            ← Back to Admin
          </Link>
        </div>
      </div>

      {/* Profile Header (matching student portal) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Photo */}
          <div className="relative shrink-0">
            {student.image_url ? (
              <Image
                src={student.image_url}
                alt={student.display_name || "Profile"}
                width={96}
                height={96}
                className="w-24 h-24 rounded-2xl object-cover border border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{student.display_name}</h1>
            {trackLabel && (
              <p className="text-base text-gray-600 mt-1">{trackLabel} Student</p>
            )}
            {meta.university && (
              <p className="text-sm text-gray-500 mt-0.5">{meta.university}</p>
            )}
            {(student.city || student.state) && (
              <p className="text-sm text-gray-400 mt-0.5">
                {[student.city, student.state].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {/* Completeness */}
          <div className="shrink-0 text-right">
            <div className="text-3xl font-bold text-gray-900">{completeness}%</div>
            <div className="text-xs text-gray-500">Profile Complete</div>
          </div>
        </div>
      </div>

      {/* Video Intro Section */}
      {videoAvailable && youtubeId && (
        <CaregiverSectionCard title="Video Intro" completionPercent={100}>
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </CaregiverSectionCard>
      )}

      {/* Overview Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Overview"
                    id="overview"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</span>
                <p className="text-sm text-gray-900 mt-1">{student.display_name || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                <p className="text-sm text-gray-900 mt-1">{student.email || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</span>
                <p className="text-sm text-gray-900 mt-1">{student.phone || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</span>
                <p className="text-sm text-gray-900 mt-1">
                  {[student.city, student.state].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">University</span>
              <p className="text-sm text-gray-900 mt-1">{meta.university || "—"}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Major</span>
              <p className="text-sm text-gray-900 mt-1">{meta.major || "—"}</p>
            </div>
            {meta.intended_professional_school && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Career Path</span>
                <p className="text-sm text-gray-900 mt-1">
                  {INTENDED_SCHOOL_LABELS[meta.intended_professional_school] || meta.intended_professional_school}
                </p>
              </div>
            )}
          </div>
        </CaregiverSectionCard>
      </div>

      {/* Verification Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Verification"
                    id="verification"
        >
          <div className="space-y-3">
            {verificationItems.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                {item.done ? (
                  <div className="w-5 h-5 rounded-full bg-success-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                )}
                <span className={`text-sm ${item.done ? "text-gray-900" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CaregiverSectionCard>
      </div>

      {/* Schedule Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Schedule"
          id="schedule"
        >
          {meta.course_schedule_grid ? (
            <p className="text-sm text-gray-900">Schedule configured</p>
          ) : (
            <p className="text-sm text-gray-500">No schedule set</p>
          )}
        </CaregiverSectionCard>
      </div>

      {/* Availability Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Availability"
          
          id="availability"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hours/Week</span>
                <p className="text-sm text-gray-900 mt-1">{formatHoursPerWeek(meta) || "—"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</span>
                <p className="text-sm text-gray-900 mt-1">{formatDuration(meta) || "—"}</p>
              </div>
            </div>
            {meta.availability_notes && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</span>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{meta.availability_notes}</p>
              </div>
            )}
          </div>
        </CaregiverSectionCard>
      </div>

      {/* Why Caregiving Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Why Caregiving"
          
          id="why"
        >
          {meta.why_caregiving ? (
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{meta.why_caregiving}</p>
          ) : (
            <p className="text-sm text-gray-500">Not answered yet</p>
          )}
        </CaregiverSectionCard>
      </div>

      {/* Scenarios Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Scenario Responses"
          
          id="scenarios"
        >
          {meta.scenario_responses && meta.scenario_responses.length > 0 ? (
            <div className="space-y-6">
              {meta.scenario_responses.map((response, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {response.question || `Scenario ${i + 1}`}
                  </p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{response.answer}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No scenario responses yet</p>
          )}
        </CaregiverSectionCard>
      </div>

      {/* Background Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Experience"
          
          id="background"
        >
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Years of Experience</span>
              <p className="text-sm text-gray-900 mt-1">
                {meta.years_caregiving ? `${meta.years_caregiving}+ years` : "—"}
              </p>
            </div>
          </div>
        </CaregiverSectionCard>
      </div>

      {/* Skills Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Skills"
          
          id="skills"
        >
          {meta.skills && meta.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {meta.skills.map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No skills added yet</p>
          )}
        </CaregiverSectionCard>
      </div>

      {/* Certifications Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Certifications"
          
          id="certifications"
        >
          {meta.certifications && meta.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {meta.certifications.map((cert, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
                >
                  {cert}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No certifications added yet</p>
          )}
        </CaregiverSectionCard>
      </div>

      {/* Resume Section */}
      <div className="mt-6">
        <CaregiverSectionCard
          title="Resume"
          completionPercent={meta.resume_url ? 100 : 0}
          id="resume"
        >
          {meta.resume_url ? (
            <div className="flex items-center gap-2 text-sm text-gray-900">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Resume uploaded
            </div>
          ) : (
            <p className="text-sm text-gray-500">No resume uploaded yet</p>
          )}
        </CaregiverSectionCard>
      </div>
    </div>
  );
}
