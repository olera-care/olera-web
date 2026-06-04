/**
 * Demo candidate data — Logan DuBose, clearly labeled as a demo. Phase 2+3
 * Bullet 11 (2026-06-04).
 *
 * Used by EmptyCandidatesLadder as rung 3 (the "real face, real bio,
 * prominent DEMO badge" fallback when no real students are in the
 * provider's catchment yet). Logan as the demo is the locked Q4 answer.
 *
 * The bio text explicitly says "Demo profile" so a provider can't
 * mistake this for a real student. The DEMO badge on the card chrome
 * reinforces the framing.
 */

export interface DemoCandidate {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  city: string;
  state: string;
  program_track: string;
  bio: string;
  certifications: string[];
  languages: string[];
  hours_per_week: string;
  has_video: boolean;
  is_demo: true;
  demo_label: string;
  photo_url: string;
}

/** The locked demo profile per Q4. Logan DuBose, founder + med student.
 *  Real bio so the card carries credibility, paired with the DEMO badge
 *  + bio prefix so no confusion. */
export const LOGAN_DEMO_CANDIDATE: DemoCandidate = {
  id: "demo-logan-dubose",
  display_name: "Demo profile · Logan DuBose",
  first_name: "Logan",
  last_name: "DuBose",
  city: "College Station",
  state: "TX",
  program_track: "Medical School",
  bio:
    "Demo profile. Logan DuBose, MD, MBA — co-founder of Olera, " +
    "Texas A&M College of Medicine alum, NIH-funded researcher. " +
    "This profile is here so you can see what a candidate card looks " +
    "like. As we recruit pre-nursing and pre-medical students near " +
    "your campus, real profiles will replace this view.",
  certifications: ["CPR", "First Aid"],
  languages: ["English"],
  hours_per_week: "10-20",
  has_video: false,
  is_demo: true,
  demo_label: "DEMO",
  photo_url: "https://olera.care/images/for-providers/team/logan.jpg",
};
