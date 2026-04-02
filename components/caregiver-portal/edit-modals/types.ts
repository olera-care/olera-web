import type { StudentMetadata } from "@/lib/types";

export type CaregiverSectionId =
  | "schedule"
  | "availability"
  | "resume"
  | "why"
  | "scenarios"
  | "background";

export interface StudentProfile {
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

export interface BaseEditModalProps {
  profile: StudentProfile;
  onClose: () => void;
  onSaved: () => void;
  /** When true, show progress footer instead of Cancel/Save */
  guidedMode?: boolean;
  guidedStep?: number;
  guidedTotal?: number;
  onGuidedBack?: () => void;
}

/** Section order used for guided onboarding flow */
export const GUIDED_SECTION_ORDER: CaregiverSectionId[] = [
  "schedule",
  "availability",
  "why",
  "scenarios",
  "background",
  "resume",
];

/** Section labels for display */
export const SECTION_LABELS: Record<CaregiverSectionId, string> = {
  schedule: "Semester schedule",
  availability: "Availability & commitment",
  why: "Why I want to be a caregiver",
  scenarios: "Screening questions",
  background: "Experience & background",
  resume: "Resume & LinkedIn",
};
