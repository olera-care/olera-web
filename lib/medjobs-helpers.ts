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

/** Display labels for major field program tracks */
export const MAJOR_LABELS: Record<string, string> = {
  pre_med: "Pre-Med",
  pre_nursing: "Pre-Nursing",
  pre_pa: "Pre-PA",
  pre_pt: "Pre-PT",
  other_health: "Other Health Professional",
};

/** Get display label for major field value */
export function getMajorLabel(major: string | undefined | null): string | null {
  if (!major) return null;
  return MAJOR_LABELS[major] || major;
}

/** Marker used when student explicitly has no certifications */
const NO_CERTS_MARKER = "__none__";

/** Get actual certifications (filters out the "no certifications" marker) */
export function getActualCertifications(certifications: string[] | undefined | null): string[] {
  if (!certifications) return [];
  return certifications.filter(c => c !== NO_CERTS_MARKER);
}

/** Check if student has explicitly marked "no certifications" */
export function hasNoCertificationsMarker(certifications: string[] | undefined | null): boolean {
  return certifications?.includes(NO_CERTS_MARKER) ?? false;
}

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

/** Extract Loom video ID from share URL.
 *  Returns null for non-Loom URLs. */
export function getLoomId(url: string): string | null {
  try {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Extract Vimeo video ID from URL.
 *  Returns null for non-Vimeo URLs. */
export function getVimeoId(url: string): string | null {
  try {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Get video platform info from a URL */
export function getVideoPlatform(url: string): { platform: "youtube" | "loom" | "vimeo" | null; id: string | null } {
  if (!url) return { platform: null, id: null };

  const youtubeId = getYouTubeId(url);
  if (youtubeId) return { platform: "youtube", id: youtubeId };

  const loomId = getLoomId(url);
  if (loomId) return { platform: "loom", id: loomId };

  const vimeoId = getVimeoId(url);
  if (vimeoId) return { platform: "vimeo", id: vimeoId };

  return { platform: null, id: null };
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
