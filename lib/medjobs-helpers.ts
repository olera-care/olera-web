import type { StudentMetadata, StudentProgramTrack, IntendedProfessionalSchool } from "./types";

/** Seasonal availability status options */
export const SEASONAL_STATUS_OPTIONS = [
  { value: "full_time", label: "Full-time available" },
  { value: "classes_see_schedule", label: "Taking classes — see schedule" },
  { value: "part_time", label: "Part-time — limited hours" },
  { value: "planning_classes", label: "Planning to take classes — will update" },
  { value: "out_of_town", label: "Will be out of town" },
  { value: "graduating", label: "Graduating" },
  { value: "pending", label: "Pending — will update soon" },
] as const;

export const SEASON_LABELS: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Fall",
  winter: "Winter",
};

/** Get display label for a seasonal status value */
export function getSeasonalStatusLabel(status: string): string {
  return SEASONAL_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

/** Get the current season key */
export function getCurrentSeasonKey(): "spring" | "summer" | "fall" | "winter" {
  const month = new Date().getMonth();
  if (month >= 0 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

/** Display labels for IntendedProfessionalSchool */
export const INTENDED_SCHOOL_LABELS: Record<IntendedProfessionalSchool, string> = {
  medicine: "Medicine",
  nursing: "Nursing",
  pa: "Physician Assistant",
  pt: "Physical Therapy",
  public_health: "Public Health",
  undecided: "Undecided",
};

/** Display labels for legacy StudentProgramTrack */
export const PROGRAM_TRACK_LABELS: Record<StudentProgramTrack, string> = {
  pre_nursing: "Nursing",
  nursing: "Nursing",
  pre_med: "Medicine",
  pre_pa: "Physician Assistant",
  pre_health: "Healthcare",
  other: "Other",
};

/** Get the best display label for a student's career track.
 *  Prefers intended_professional_school, falls back to program_track. */
export function getTrackLabel(meta: StudentMetadata): string | null {
  if (meta.intended_professional_school) {
    return INTENDED_SCHOOL_LABELS[meta.intended_professional_school];
  }
  if (meta.program_track) {
    return PROGRAM_TRACK_LABELS[meta.program_track];
  }
  return null;
}

/** Format availability_types array into a readable summary */
export function formatAvailability(meta: StudentMetadata): string | null {
  // Prefer new structured fields
  if (meta.availability_types && meta.availability_types.length > 0) {
    const labels: Record<string, string> = {
      in_between_classes: "Between classes",
      evenings: "Evenings",
      weekends: "Weekends",
      overnights: "Overnights",
    };
    return meta.availability_types.map((t) => labels[t] || t).join(", ");
  }
  // Fall back to old single field
  if (meta.availability_type) {
    return meta.availability_type.replace(/_/g, " ");
  }
  return null;
}

/** Format hours per week — prefers range, falls back to exact */
export function formatHoursPerWeek(meta: StudentMetadata): string | null {
  if (meta.hours_per_week_range) {
    return `${meta.hours_per_week_range} hrs/wk`;
  }
  if (meta.hours_per_week) {
    return `${meta.hours_per_week} hrs/wk`;
  }
  return null;
}

/** Format duration commitment */
export function formatDuration(meta: StudentMetadata): string | null {
  if (!meta.duration_commitment) return null;
  const labels: Record<string, string> = {
    "1_semester": "1 semester",
    "multiple_semesters": "Multiple semesters",
    "1_plus_year": "1+ year",
    "less_than_3_months": "Less than 3 months",
    "3_to_6_months": "3–6 months",
    "6_to_12_months": "6–12 months",
  };
  return labels[meta.duration_commitment] || meta.duration_commitment.replace(/_/g, " ");
}

/** Check if student has submitted intro video */
export function hasVideo(meta: StudentMetadata): boolean {
  return !!meta.video_intro_url;
}

/** Extract YouTube video ID from common URL formats.
 *  Returns null for non-YouTube URLs. */
export function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      // /watch?v=ID or /embed/ID or /shorts/ID
      const vParam = u.searchParams.get("v");
      if (vParam) return vParam;
      const match = u.pathname.match(/\/(embed|shorts|v)\/([^/?]+)/);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

/** Map legacy program_track values to intended_professional_school equivalents */
const LEGACY_TRACK_TO_INTENDED: Record<string, string> = {
  pre_med: "medicine",
  pre_nursing: "nursing",
  nursing: "nursing",
  pre_pa: "pa",
  pre_health: "public_health",
};

/** Check if a student's track matches a given intended_professional_school filter value.
 *  Handles both new `intended_professional_school` and legacy `program_track` fields. */
export function matchesTrackFilter(meta: StudentMetadata, filterValue: string): boolean {
  if (!filterValue) return true;
  if (meta.intended_professional_school === filterValue) return true;
  if (meta.program_track && LEGACY_TRACK_TO_INTENDED[meta.program_track] === filterValue) return true;
  return false;
}
