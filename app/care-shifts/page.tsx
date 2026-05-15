"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";

// ── Mock Caregiver Data ──────────────────────────────────────────────

interface Review {
  author: string;
  date: string;
  rating: number;
  text: string;
}

interface Caregiver {
  id: string;
  firstName: string;
  lastInitial: string;
  photo: string;
  location: string;
  university: string;
  universityAbbr: string;
  matchPercent: number;
  matchSummary: string;
  rating: number;
  reviewCount: number;
  badges: string[];
  quote?: string;
  availabilityNote?: string;
  programYear?: string;
  completedVisits?: number;
  hourlyRate: number;
  distance: string;
  bio: string;
  education: { degree: string; school: string; year: string }[];
  workHistory: { role: string; place: string; duration: string }[];
  certifications: string[];
  conditions: string[];
  languages: string[];
  hobbies: string[];
  availability: Record<string, string>;
  reviews: Review[];
  videoUrl?: string;
}

const CAREGIVERS: Caregiver[] = [
  {
    id: "1",
    firstName: "Maria",
    lastInitial: "S",
    photo: "https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Houston, TX",
    university: "University of Houston",
    universityAbbr: "UH",
    matchPercent: 97,
    matchSummary: "Specializes in dementia care with 8+ years of hands-on experience.",
    rating: 4.9,
    reviewCount: 47,
    badges: ["Dementia Specialist", "Companion Care", "Background Checked"],
    quote: "I create calm moments that bring peace.",
    availabilityNote: "Available within 24 hours",
    programYear: "3rd Year, Pre-Med",
    completedVisits: 142,
    hourlyRate: 20,
    distance: "2.3 mi",
    bio: "I've dedicated the last 8 years of my life to caring for seniors with memory-related conditions. After watching my grandmother navigate Alzheimer's, I knew this was my calling. I believe in creating a calm, structured environment where clients feel safe, respected, and loved. I'm trained in redirection techniques and enjoy incorporating music therapy into daily routines.",
    education: [
      { degree: "Associate of Applied Science, Nursing", school: "Houston Community College", year: "2016" },
      { degree: "Dementia Care Certificate", school: "Alzheimer's Association", year: "2019" },
    ],
    workHistory: [
      { role: "Memory Care Aide", place: "Sunrise Senior Living", duration: "2021 - Present" },
      { role: "Home Health Aide", place: "Comfort Keepers", duration: "2018 - 2021" },
      { role: "CNA", place: "Brookdale Senior Living", duration: "2016 - 2018" },
    ],
    certifications: ["CNA (Certified Nursing Assistant)", "CPR/First Aid", "Dementia Care Specialist (NCCDP)", "Medication Administration"],
    conditions: ["Alzheimer's", "Dementia", "Parkinson's", "Sundowning", "Mild Cognitive Impairment"],
    languages: ["English", "Spanish"],
    hobbies: ["Gardening", "Cooking", "Puzzle games", "Walking"],
    availability: { Mon: "7am - 3pm", Tue: "7am - 3pm", Wed: "7am - 3pm", Thu: "—", Fri: "7am - 3pm", Sat: "—", Sun: "—" },
    reviews: [
      { author: "Linda R.", date: "Apr 2026", rating: 5, text: "Maria has been an absolute blessing for my mother. She's patient, kind, and always goes the extra mile. Mom actually looks forward to seeing her every morning." },
      { author: "James T.", date: "Mar 2026", rating: 5, text: "Extremely professional and skilled with dementia patients. Maria knows exactly how to redirect and calm my father during difficult moments." },
      { author: "Susan K.", date: "Feb 2026", rating: 5, text: "We tried several caregivers before Maria. She's the only one my mom has truly connected with. Highly recommend." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "2",
    firstName: "David",
    lastInitial: "L",
    photo: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Sugar Land, TX",
    university: "Texas A&M University",
    universityAbbr: "TAMU",
    matchPercent: 94,
    matchSummary: "Former EMT with strong mobility assistance and fall-prevention skills.",
    rating: 4.8,
    reviewCount: 32,
    badges: ["Licensed CNA", "Fall Prevention", "First Aid"],
    quote: "Every senior has a story worth hearing.",
    availabilityNote: "Available next week",
    programYear: "4th Year, Nursing",
    completedVisits: 98,
    hourlyRate: 18,
    distance: "3.1 mi",
    bio: "Before transitioning to home care, I spent 5 years as an EMT. That experience gave me a sharp eye for safety and the ability to stay calm in any situation. I specialize in mobility assistance, transfer techniques, and fall prevention. I genuinely enjoy spending time with my clients — whether that's helping with physical therapy exercises or just watching a game together.",
    education: [
      { degree: "EMT-Basic Certification", school: "Lone Star College", year: "2014" },
      { degree: "CNA Program", school: "Texas Health Career Institute", year: "2019" },
    ],
    workHistory: [
      { role: "Private Home Caregiver", place: "Self-employed", duration: "2022 - Present" },
      { role: "Home Health Aide", place: "BrightSpring Health", duration: "2019 - 2022" },
      { role: "EMT-Basic", place: "City of Houston EMS", duration: "2014 - 2019" },
    ],
    certifications: ["CNA", "EMT-Basic", "CPR/AED/First Aid", "Safe Patient Handling"],
    conditions: ["Post-surgical recovery", "Hip/knee replacement", "Stroke recovery", "General mobility issues", "Fall risk"],
    languages: ["English"],
    hobbies: ["Sports", "Fishing", "Board games", "Cooking"],
    availability: { Mon: "8am - 6pm", Tue: "8am - 6pm", Wed: "—", Thu: "8am - 6pm", Fri: "8am - 6pm", Sat: "9am - 2pm", Sun: "—" },
    reviews: [
      { author: "Robert M.", date: "Apr 2026", rating: 5, text: "David helped my dad recover after hip surgery. He's strong, gentle, and incredibly patient. Dad felt safe with him from day one." },
      { author: "Patricia H.", date: "Mar 2026", rating: 5, text: "Very knowledgeable about fall prevention. He rearranged our living room to be safer and taught Mom exercises to improve balance." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "3",
    firstName: "Aisha",
    lastInitial: "J",
    photo: "https://images.pexels.com/photos/5214958/pexels-photo-5214958.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Katy, TX",
    university: "Prairie View A&M",
    universityAbbr: "PVAMU",
    matchPercent: 91,
    matchSummary: "Warm companion care expert who excels at engaging seniors socially.",
    rating: 4.9,
    reviewCount: 58,
    badges: ["Companion Care", "Meal Prep", "Background Checked"],
    quote: "Caring for others is what I was meant to do.",
    availabilityNote: "Available today",
    programYear: "2nd Year, Psychology",
    completedVisits: 187,
    hourlyRate: 17,
    distance: "1.8 mi",
    bio: "I believe that great care is about more than just tasks — it's about connection. I've spent 6 years providing companion care, helping seniors stay active, social, and engaged. I love planning outings, cooking nutritious meals, and simply being a friendly presence. My clients often say I feel more like family than a caregiver, and that's the highest compliment I can receive.",
    education: [
      { degree: "B.A. in Psychology", school: "University of Houston", year: "2018" },
      { degree: "Mental Health First Aid Certificate", school: "National Council for Mental Wellbeing", year: "2021" },
    ],
    workHistory: [
      { role: "Companion Caregiver", place: "Home Instead", duration: "2022 - Present" },
      { role: "Personal Care Aide", place: "Visiting Angels", duration: "2020 - 2022" },
      { role: "Activity Coordinator", place: "Atria Senior Living", duration: "2018 - 2020" },
    ],
    certifications: ["HHA (Home Health Aide)", "CPR/First Aid", "ServSafe Food Handler", "Mental Health First Aid"],
    conditions: ["Depression/isolation", "Mild dementia", "Diabetes management", "Arthritis", "Low vision"],
    languages: ["English", "French", "Haitian Creole"],
    hobbies: ["Reading", "Baking", "Card games", "Nature walks", "Music"],
    availability: { Mon: "9am - 5pm", Tue: "9am - 5pm", Wed: "9am - 5pm", Thu: "9am - 5pm", Fri: "9am - 5pm", Sat: "10am - 3pm", Sun: "10am - 3pm" },
    reviews: [
      { author: "Dorothy F.", date: "Apr 2026", rating: 5, text: "Aisha is like a ray of sunshine. My mother has been so much happier since Aisha started visiting. They bake together, do puzzles, and go on walks." },
      { author: "Michael B.", date: "Mar 2026", rating: 5, text: "Finding someone who genuinely cares is rare. Aisha is that person. She remembers every detail about my mom's preferences." },
      { author: "Karen W.", date: "Jan 2026", rating: 4, text: "Aisha is wonderful with my father. She's always on time and very communicative about how the day went." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "4",
    firstName: "Carlos",
    lastInitial: "R",
    photo: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Pearland, TX",
    university: "University of Houston",
    universityAbbr: "UH",
    matchPercent: 88,
    matchSummary: "Bilingual caregiver with hospice experience and a gentle bedside manner.",
    rating: 4.7,
    reviewCount: 23,
    badges: ["Hospice Trained", "Bilingual", "Medication Mgmt"],
    quote: "I treat every client like family.",
    availabilityNote: "Available this week",
    programYear: "3rd Year, Health Sciences",

    completedVisits: 156,
    hourlyRate: 22,
    distance: "4.5 mi",
    bio: "I've worked in hospice and palliative care for over 5 years, and I approach every client relationship with deep empathy and respect. I understand how important comfort, dignity, and peace are during difficult times. I'm fluent in both English and Spanish, which has helped me connect with many families. I'm also trained in medication management and pain monitoring.",
    education: [
      { degree: "B.S. in Health Sciences", school: "Texas Southern University", year: "2017" },
      { degree: "Hospice & Palliative Care Certificate", school: "NHPCO", year: "2020" },
    ],
    workHistory: [
      { role: "Hospice Caregiver", place: "VITAS Healthcare", duration: "2023 - Present" },
      { role: "Palliative Care Aide", place: "Kindred at Home", duration: "2020 - 2023" },
      { role: "CNA", place: "Memorial Hermann", duration: "2018 - 2020" },
    ],
    certifications: ["CNA", "Hospice & Palliative Care Certificate", "CPR/First Aid", "Medication Administration", "Pain Management"],
    conditions: ["End-of-life care", "Cancer", "COPD", "Heart failure", "Chronic pain"],
    languages: ["English", "Spanish"],
    hobbies: ["Guitar", "Poetry", "Cooking", "Volunteering"],
    availability: { Mon: "6am - 2pm", Tue: "6am - 2pm", Wed: "6am - 2pm", Thu: "—", Fri: "6am - 2pm", Sat: "—", Sun: "8am - 4pm" },
    reviews: [
      { author: "Elena G.", date: "Apr 2026", rating: 5, text: "Carlos cared for my father during his final months. His kindness and professionalism made an impossibly hard time more bearable. We are forever grateful." },
      { author: "Thomas P.", date: "Feb 2026", rating: 5, text: "Incredibly compassionate. Carlos treats every patient like family. His hospice experience really shows." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "5",
    firstName: "Priya",
    lastInitial: "M",
    photo: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Austin, TX",
    university: "Texas A&M University",
    universityAbbr: "TAMU",
    matchPercent: 85,
    matchSummary: "Registered nurse offering skilled nursing care and chronic disease management.",
    rating: 4.6,
    reviewCount: 19,
    badges: ["Registered Nurse", "Chronic Care", "IV Certified"],
    quote: "Seeing someone smile because of something small I did.",
    availabilityNote: "Limited availability",
    programYear: "2nd Year, Nursing (BSN)",
    completedVisits: 64,
    hourlyRate: 19,
    distance: "5.2 mi",
    bio: "As a registered nurse with 10 years of clinical experience, I bring medical expertise to home care. I specialize in managing chronic conditions like diabetes, heart disease, and COPD. I can handle wound care, IV therapy, and medication adjustments in coordination with your physician. I chose home care because I believe healing happens best in a comfortable, familiar environment.",
    education: [
      { degree: "B.S. in Nursing (BSN)", school: "University of Texas at Arlington", year: "2015" },
      { degree: "IV Therapy Certification", school: "Texas Board of Nursing", year: "2018" },
    ],
    workHistory: [
      { role: "Private Duty RN", place: "Self-employed", duration: "2023 - Present" },
      { role: "Home Health RN", place: "Amedisys", duration: "2019 - 2023" },
      { role: "Med-Surg RN", place: "Houston Methodist", duration: "2015 - 2019" },
    ],
    certifications: ["RN (Registered Nurse)", "BSN", "IV Therapy Certified", "Wound Care Certified", "BLS/ACLS"],
    conditions: ["Diabetes (Type 1 & 2)", "Heart disease", "COPD", "Wound care", "Post-surgical", "Tracheostomy care"],
    languages: ["English", "Hindi", "Tamil"],
    hobbies: ["Yoga", "Reading", "Painting", "Meditation"],
    availability: { Mon: "8am - 4pm", Tue: "8am - 4pm", Wed: "—", Thu: "8am - 4pm", Fri: "8am - 4pm", Sat: "—", Sun: "—" },
    reviews: [
      { author: "Richard D.", date: "Mar 2026", rating: 5, text: "Priya manages my mother's diabetes and wound care with incredible skill. Having an RN at home gives us peace of mind we never had before." },
      { author: "Barbara L.", date: "Jan 2026", rating: 4, text: "Very knowledgeable and professional. Priya explains everything clearly and keeps us informed about any changes." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "6",
    firstName: "Grace",
    lastInitial: "O",
    photo: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "The Woodlands, TX",
    university: "Prairie View A&M",
    universityAbbr: "PVAMU",
    matchPercent: 82,
    matchSummary: "Overnight and live-in specialist with a calm, reassuring presence.",
    rating: 4.8,
    reviewCount: 41,
    badges: ["Overnight Care", "Live-in Ready", "CPR Certified"],
    quote: "Everyone deserves dignity and companionship.",
    availabilityNote: "Available within 24 hours",
    programYear: "4th Year, Pre-Med",
    completedVisits: 133,
    hourlyRate: 22,
    distance: "2.9 mi",
    bio: "I've been providing overnight and live-in care for 7 years. Many of my clients need someone present during the night for safety, bathroom assistance, or simply peace of mind. I'm a light sleeper and always alert when needed. During the day, I help with meals, light housekeeping, and companionship. I pride myself on creating a homey, comfortable atmosphere.",
    education: [
      { degree: "Home Health Aide Program", school: "San Jacinto College", year: "2017" },
      { degree: "Dementia Care Training", school: "Teepa Snow's Positive Approach", year: "2020" },
    ],
    workHistory: [
      { role: "Live-in Caregiver", place: "Private families", duration: "2021 - Present" },
      { role: "Overnight Aide", place: "Right at Home", duration: "2019 - 2021" },
      { role: "Resident Aide", place: "Autumn Leaves Memory Care", duration: "2017 - 2019" },
    ],
    certifications: ["HHA", "CPR/First Aid", "Dementia Care Training", "Safe Food Handling"],
    conditions: ["Sundowner's syndrome", "Fall risk (nighttime)", "Incontinence care", "Anxiety/sleep disorders", "General frailty"],
    languages: ["English", "Yoruba"],
    hobbies: ["Knitting", "Audiobooks", "Cooking Nigerian cuisine", "Crossword puzzles"],
    availability: { Mon: "Overnight", Tue: "Overnight", Wed: "Overnight", Thu: "Overnight", Fri: "Overnight", Sat: "—", Sun: "—" },
    reviews: [
      { author: "Janet S.", date: "Apr 2026", rating: 5, text: "Grace has been living with my mom for 6 months and it's been transformative. Mom sleeps better knowing Grace is there, and I sleep better too." },
      { author: "William C.", date: "Mar 2026", rating: 5, text: "Reliable, warm, and incredibly caring. Grace makes our home feel like it always has — just safer." },
      { author: "Nancy T.", date: "Feb 2026", rating: 4, text: "Grace is wonderful for overnight care. She's attentive without being intrusive. My father trusts her completely." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "7",
    firstName: "James",
    lastInitial: "W",
    photo: "https://images.pexels.com/photos/6234600/pexels-photo-6234600.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Spring, TX",
    university: "University of Houston",
    universityAbbr: "UH",
    matchPercent: 79,
    matchSummary: "Physical therapy assistant focused on strength-building and rehab exercises.",
    rating: 4.5,
    reviewCount: 15,
    badges: ["PT Assistant", "Rehab Specialist", "Insured"],
    quote: "Rehab is tough, but I make it a little easier.",
    availabilityNote: "Fully booked, accepting future requests",
    programYear: "3rd Year, Kinesiology",
    completedVisits: 47,
    hourlyRate: 21,
    distance: "6.1 mi",
    bio: "I'm a licensed physical therapy assistant who brings rehab expertise into the home setting. I work with seniors recovering from surgeries, strokes, and injuries to rebuild strength, balance, and confidence. Every program I design is personalized — I meet clients where they are and celebrate every milestone with them. Movement is medicine, and I'm passionate about helping people move better.",
    education: [
      { degree: "Associate of Applied Science, Physical Therapy", school: "Lone Star College - Kingwood", year: "2020" },
      { degree: "Geriatric Exercise Specialist", school: "American Council on Exercise", year: "2022" },
    ],
    workHistory: [
      { role: "Home-based PTA", place: "Self-employed", duration: "2023 - Present" },
      { role: "PTA", place: "Select Rehabilitation", duration: "2020 - 2023" },
      { role: "Fitness Trainer (Senior Programs)", place: "YMCA", duration: "2017 - 2020" },
    ],
    certifications: ["PTA (Licensed)", "CPR/AED", "Geriatric Exercise Specialist", "Aquatic Therapy"],
    conditions: ["Post-stroke rehab", "Joint replacement recovery", "Balance disorders", "Osteoporosis", "General deconditioning"],
    languages: ["English"],
    hobbies: ["Hiking", "Swimming", "Coaching youth sports", "Woodworking"],
    availability: { Mon: "10am - 6pm", Tue: "10am - 6pm", Wed: "10am - 6pm", Thu: "10am - 6pm", Fri: "—", Sat: "9am - 1pm", Sun: "—" },
    reviews: [
      { author: "George H.", date: "Mar 2026", rating: 5, text: "James helped my wife regain the ability to walk after her stroke. He's encouraging, knowledgeable, and never gives up on his clients." },
      { author: "Alice M.", date: "Jan 2026", rating: 4, text: "Great at creating exercise routines that are challenging but safe. My mom has gotten so much stronger since working with James." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "8",
    firstName: "Sophie",
    lastInitial: "T",
    photo: "https://images.pexels.com/photos/3714743/pexels-photo-3714743.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Houston, TX",
    university: "Texas A&M University",
    universityAbbr: "TAMU",
    matchPercent: 76,
    matchSummary: "Geriatric social worker who blends emotional support with practical care.",
    rating: 4.7,
    reviewCount: 28,
    badges: ["Social Worker", "Companion Care", "Background Checked"],
    quote: "My grandmother taught me patience is love.",
    availabilityNote: "Available this week",
    programYear: "Graduate, Social Work",

    completedVisits: 89,
    hourlyRate: 16,
    distance: "3.7 mi",
    bio: "With a master's degree in social work and a specialization in gerontology, I bring a holistic approach to caregiving. I help families navigate not just daily care, but also the emotional and logistical challenges of aging — from coordinating with doctors to simply being a compassionate listener. I believe every senior deserves to feel heard and valued.",
    education: [
      { degree: "M.S.W., Gerontology Concentration", school: "University of Houston - Graduate College of Social Work", year: "2019" },
      { degree: "B.A. in Sociology", school: "Rice University", year: "2017" },
    ],
    workHistory: [
      { role: "Geriatric Care Manager", place: "Self-employed", duration: "2023 - Present" },
      { role: "Social Worker", place: "Memorial Hermann Senior Services", duration: "2020 - 2023" },
      { role: "Case Manager", place: "Area Agency on Aging", duration: "2019 - 2020" },
    ],
    certifications: ["Licensed Master Social Worker (LMSW)", "CPR/First Aid", "Certified Geriatric Care Manager"],
    conditions: ["Anxiety/depression", "Grief & loss", "Care transitions", "Caregiver burnout", "Chronic illness adjustment"],
    languages: ["English", "Mandarin"],
    hobbies: ["Journaling", "Tea ceremonies", "Volunteering", "Photography"],
    availability: { Mon: "9am - 4pm", Tue: "9am - 4pm", Wed: "9am - 4pm", Thu: "—", Fri: "9am - 4pm", Sat: "—", Sun: "—" },
    reviews: [
      { author: "Helen P.", date: "Apr 2026", rating: 5, text: "Sophie helped us navigate my father's transition to memory care. She was our rock during the hardest decision we've ever made." },
      { author: "David K.", date: "Mar 2026", rating: 5, text: "More than a caregiver — she's an advocate. Sophie coordinated everything with mom's doctors and made sure nothing fell through the cracks." },
    ],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  // ── Page 2 caregivers ──
  {
    id: "9", firstName: "Olivia", lastInitial: "N",
    photo: "https://images.pexels.com/photos/3732869/pexels-photo-3732869.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Cypress, TX", university: "Prairie View A&M", universityAbbr: "PVAMU",
    matchPercent: 74, matchSummary: "Pre-med student with strong vitals monitoring and charting skills.",
    rating: 4.6, reviewCount: 12, badges: ["Pre-Med", "Vitals Trained", "Background Checked"],
    quote: "I want to help people like the ones I care for now.",
    availabilityNote: "Available today",
    programYear: "3rd Year, Pre-Med",
    completedVisits: 34,
    hourlyRate: 20, distance: "4.8 mi",
    bio: "I'm a pre-med junior passionate about geriatric medicine. I assist with vitals, daily charting, and light wound care under supervision.",
    education: [{ degree: "B.S. Biology (Pre-Med)", school: "University of Houston", year: "2027 (expected)" }],
    workHistory: [{ role: "Student Health Aide", place: "UH Campus Clinic", duration: "2025 - Present" }],
    certifications: ["CPR/First Aid", "Phlebotomy (student)"], conditions: ["Diabetes monitoring", "Hypertension", "Post-surgical"],
    languages: ["English", "Tagalog"], hobbies: ["Running", "Sketching", "Podcasts"],
    availability: { Mon: "2pm - 8pm", Tue: "2pm - 8pm", Wed: "—", Thu: "2pm - 8pm", Fri: "—", Sat: "9am - 5pm", Sun: "9am - 5pm" },
    reviews: [{ author: "Mark S.", date: "Apr 2026", rating: 5, text: "Olivia is sharp and attentive. She catches things I would have missed. Great future doctor." }],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "10", firstName: "Ethan", lastInitial: "B",
    photo: "https://images.pexels.com/photos/7683693/pexels-photo-7683693.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Missouri City, TX", university: "University of Houston", universityAbbr: "UH",
    matchPercent: 72, matchSummary: "Kinesiology student specializing in senior fitness and fall prevention.",
    rating: 4.5, reviewCount: 9, badges: ["Kinesiology", "Fall Prevention", "Insured"],
    quote: "I help seniors stay strong and steady.",
    availabilityNote: "Available next week",
    programYear: "4th Year, Kinesiology",
    completedVisits: 28,
    hourlyRate: 19, distance: "5.5 mi",
    bio: "As a kinesiology major, I design gentle exercise programs for seniors to build strength and prevent falls. Movement is the best medicine.",
    education: [{ degree: "B.S. Kinesiology", school: "Texas A&M University", year: "2026 (expected)" }],
    workHistory: [{ role: "Senior Fitness Intern", place: "YMCA Greater Houston", duration: "2025 - Present" }],
    certifications: ["CPR/AED", "Senior Fitness Specialist"], conditions: ["Fall risk", "Osteoporosis", "Joint replacement recovery"],
    languages: ["English"], hobbies: ["Basketball", "Hiking", "Cooking"],
    availability: { Mon: "—", Tue: "3pm - 9pm", Wed: "3pm - 9pm", Thu: "—", Fri: "3pm - 9pm", Sat: "8am - 4pm", Sun: "8am - 4pm" },
    reviews: [{ author: "Ruth A.", date: "Mar 2026", rating: 5, text: "Ethan got my mom walking confidently again. He's patient and encouraging." }],
  },
  {
    id: "11", firstName: "Fatima", lastInitial: "A",
    photo: "https://images.pexels.com/photos/18828738/pexels-photo-18828738.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Bellaire, TX", university: "Prairie View A&M", universityAbbr: "PVAMU",
    matchPercent: 70, matchSummary: "Nursing student with pediatric and elder care cross-training.",
    rating: 4.7, reviewCount: 16, badges: ["Nursing Student", "Bilingual", "Background Checked"],
    quote: "A gentle, holistic approach to every patient.",
    availabilityNote: "Available this week",
    programYear: "4th Year, Nursing (BSN)",
    completedVisits: 52,

    hourlyRate: 21, distance: "2.1 mi",
    bio: "I'm in my final year of nursing school and have clinical rotations in both pediatrics and geriatrics. I bring a gentle, holistic approach to every patient.",
    education: [{ degree: "BSN (in progress)", school: "Texas Woman's University", year: "2026 (expected)" }],
    workHistory: [{ role: "Clinical Intern", place: "Ben Taub Hospital", duration: "2025 - Present" }],
    certifications: ["CNA", "CPR/BLS", "Medication Administration"], conditions: ["General frailty", "Diabetes", "Wound care"],
    languages: ["English", "Arabic", "French"], hobbies: ["Calligraphy", "Reading", "Cooking"],
    availability: { Mon: "6pm - 10pm", Tue: "6pm - 10pm", Wed: "6pm - 10pm", Thu: "6pm - 10pm", Fri: "—", Sat: "All day", Sun: "All day" },
    reviews: [{ author: "Carol J.", date: "Apr 2026", rating: 5, text: "Fatima is incredibly kind and skilled beyond her years. My mother adores her." }],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "12", firstName: "Ryan", lastInitial: "K",
    photo: "https://images.pexels.com/photos/7683874/pexels-photo-7683874.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Richmond, TX", university: "Texas A&M University", universityAbbr: "TAMU",
    matchPercent: 68, matchSummary: "Health sciences student with hospice volunteer experience.",
    rating: 4.4, reviewCount: 8, badges: ["Health Sciences", "Hospice Vol.", "CPR Certified"],
    quote: "Dignity and comfort — always.",
    availabilityNote: "Limited availability",
    programYear: "2nd Year, Health Sciences",
    completedVisits: 23,
    hourlyRate: 18, distance: "7.2 mi",
    bio: "I've volunteered in hospice settings for two years and understand the importance of dignity and comfort in end-of-life care.",
    education: [{ degree: "B.S. Health Sciences", school: "Sam Houston State University", year: "2027 (expected)" }],
    workHistory: [{ role: "Hospice Volunteer", place: "Houston Hospice", duration: "2024 - Present" }],
    certifications: ["CPR/First Aid", "HIPAA Certified"], conditions: ["End-of-life care", "Chronic pain", "Anxiety"],
    languages: ["English", "Korean"], hobbies: ["Guitar", "Cycling", "Volunteering"],
    availability: { Mon: "—", Tue: "4pm - 9pm", Wed: "4pm - 9pm", Thu: "4pm - 9pm", Fri: "4pm - 9pm", Sat: "—", Sun: "10am - 6pm" },
    reviews: [{ author: "Don W.", date: "Feb 2026", rating: 4, text: "Ryan brought a calm, reassuring presence during a very difficult time for our family." }],
  },
  {
    id: "13", firstName: "Maya", lastInitial: "P",
    photo: "https://images.pexels.com/photos/19963182/pexels-photo-19963182.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Tomball, TX", university: "University of Houston", universityAbbr: "UH",
    matchPercent: 66, matchSummary: "Public health student passionate about nutrition and wellness for seniors.",
    rating: 4.8, reviewCount: 21, badges: ["Nutrition", "Meal Prep", "Background Checked"],
    quote: "Good food is good medicine.",
    availabilityNote: "Available this week",
    programYear: "Graduate, Public Health",
    completedVisits: 71,
    hourlyRate: 20, distance: "8.3 mi",
    bio: "I study public health with a focus on geriatric nutrition. I love preparing balanced meals and educating families about healthy aging.",
    education: [{ degree: "MPH (in progress)", school: "UTHealth Houston", year: "2027 (expected)" }],
    workHistory: [{ role: "Nutrition Intern", place: "Harris Health System", duration: "2025 - Present" }],
    certifications: ["ServSafe", "CPR/First Aid", "Health Education Specialist"], conditions: ["Diabetes diet", "Heart-healthy diet", "Malnutrition risk"],
    languages: ["English", "Gujarati", "Hindi"], hobbies: ["Cooking", "Yoga", "Gardening"],
    availability: { Mon: "9am - 3pm", Tue: "—", Wed: "9am - 3pm", Thu: "—", Fri: "9am - 3pm", Sat: "9am - 1pm", Sun: "—" },
    reviews: [{ author: "Irene L.", date: "Apr 2026", rating: 5, text: "Maya transformed my mom's diet. She actually enjoys eating again and her blood sugar is more stable." }],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "14", firstName: "Jordan", lastInitial: "C",
    photo: "https://images.pexels.com/photos/19456424/pexels-photo-19456424.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "League City, TX", university: "Texas A&M University", universityAbbr: "TAMU",
    matchPercent: 64, matchSummary: "Occupational therapy student helping seniors with daily living tasks.",
    rating: 4.3, reviewCount: 7, badges: ["OT Student", "ADL Support", "Insured"],
    quote: "I help seniors keep doing what they love.",
    availabilityNote: "Fully booked, accepting future requests",
    programYear: "Graduate, Occupational Therapy",
    completedVisits: 19,
    hourlyRate: 22, distance: "9.1 mi",
    bio: "I'm studying occupational therapy and love helping seniors maintain independence in their daily routines — from dressing to cooking to bathing safely.",
    education: [{ degree: "M.S. Occupational Therapy (in progress)", school: "Texas Medical Center - TWU", year: "2027 (expected)" }],
    workHistory: [{ role: "OT Fieldwork Student", place: "TIRR Memorial Hermann", duration: "2025 - Present" }],
    certifications: ["CPR/BLS", "Assistive Technology Training"], conditions: ["Stroke recovery", "Arthritis", "Low vision", "Parkinson's"],
    languages: ["English", "Spanish"], hobbies: ["3D printing", "Board games", "Rock climbing"],
    availability: { Mon: "5pm - 9pm", Tue: "5pm - 9pm", Wed: "—", Thu: "5pm - 9pm", Fri: "5pm - 9pm", Sat: "All day", Sun: "—" },
    reviews: [{ author: "Betty R.", date: "Mar 2026", rating: 4, text: "Jordan taught my dad how to button his shirts again after his stroke. Small wins that mean the world." }],
  },
  {
    id: "15", firstName: "Lily", lastInitial: "H",
    photo: "https://images.pexels.com/photos/30004322/pexels-photo-30004322.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Conroe, TX", university: "Prairie View A&M", universityAbbr: "PVAMU",
    matchPercent: 62, matchSummary: "Speech pathology student experienced in cognitive stimulation therapy.",
    rating: 4.6, reviewCount: 14, badges: ["Speech Path", "Cognitive Care", "Background Checked"],
    quote: "I use words to keep minds sharp and hearts full.",
    availabilityNote: "Available this week",
    programYear: "Graduate, Speech Pathology",
    completedVisits: 41,
    hourlyRate: 17, distance: "10.4 mi",
    bio: "I'm pursuing my master's in speech-language pathology with a focus on adult neurological disorders. I use conversation, games, and exercises to keep minds sharp.",
    education: [{ degree: "M.A. Speech-Language Pathology (in progress)", school: "Baylor College of Medicine", year: "2027 (expected)" }],
    workHistory: [{ role: "SLP Graduate Clinician", place: "Baylor College of Medicine Clinic", duration: "2025 - Present" }],
    certifications: ["CPR/First Aid", "Cognitive Stimulation Therapy"], conditions: ["Aphasia", "Mild cognitive impairment", "Dementia (early stage)", "Swallowing difficulties"],
    languages: ["English", "Vietnamese"], hobbies: ["Puzzles", "Piano", "Birdwatching"],
    availability: { Mon: "—", Tue: "1pm - 7pm", Wed: "1pm - 7pm", Thu: "—", Fri: "1pm - 7pm", Sat: "10am - 4pm", Sun: "10am - 4pm" },
    reviews: [{ author: "Frank M.", date: "Apr 2026", rating: 5, text: "Lily's cognitive exercises have noticeably improved my wife's word-finding. She looks forward to their sessions." }],
    videoUrl: "https://videos.pexels.com/video-files/6590968/6590968-uhd_2560_1440_25fps.mp4",
  },
  {
    id: "16", firstName: "Marcus", lastInitial: "D",
    photo: "https://images.pexels.com/photos/6670986/pexels-photo-6670986.jpeg?auto=compress&cs=tinysrgb&w=600",
    location: "Pasadena, TX", university: "University of Houston", universityAbbr: "UH",
    matchPercent: 60, matchSummary: "Pharmacy student who excels at medication management and education.",
    rating: 4.5, reviewCount: 11, badges: ["Pharmacy Student", "Medication Mgmt", "CPR Certified"],
    quote: "I make medications simple and safe.",
    availabilityNote: "Available this week",
    programYear: "3rd Year, Pharmacy (PharmD)",
    completedVisits: 36,
    hourlyRate: 21, distance: "6.8 mi",
    bio: "As a pharmacy student, I bring deep knowledge of medications, interactions, and side effects. I help seniors stay on track with complex medication regimens.",
    education: [{ degree: "Pharm.D. (in progress)", school: "University of Houston College of Pharmacy", year: "2028 (expected)" }],
    workHistory: [{ role: "Pharmacy Intern", place: "CVS Health", duration: "2024 - Present" }],
    certifications: ["CPR/BLS", "Immunization Certified", "HIPAA Certified"], conditions: ["Polypharmacy", "Diabetes", "Heart disease", "COPD"],
    languages: ["English"], hobbies: ["Chess", "Jazz music", "Running"],
    availability: { Mon: "4pm - 9pm", Tue: "—", Wed: "4pm - 9pm", Thu: "4pm - 9pm", Fri: "—", Sat: "All day", Sun: "All day" },
    reviews: [{ author: "Gloria T.", date: "Mar 2026", rating: 5, text: "Marcus organized all of my father's medications and caught a dangerous interaction his doctor had missed. Invaluable." }],
  },
];

const ITEMS_PER_PAGE = 8;

// ── Badge Colors ─────────────────────────────────────────────────────

function badgeStyle(badge: string): string {
  const b = badge.toLowerCase();
  if (b.includes("certified") || b.includes("cpr") || b.includes("first aid"))
    return "bg-success-50 text-success-700 border border-success-200";
  if (b.includes("specialist") || b.includes("dementia") || b.includes("hospice") || b.includes("chronic") || b.includes("rehab"))
    return "bg-primary-50 text-primary-700 border border-primary-200";
  if (b.includes("background") || b.includes("insured") || b.includes("licensed"))
    return "bg-gray-50 text-gray-700 border border-gray-200";
  if (b.includes("bilingual") || b.includes("companion") || b.includes("meal") || b.includes("social"))
    return "bg-warm-50 text-warm-700 border border-warm-200";
  if (b.includes("nurse") || b.includes("rn") || b.includes("iv"))
    return "bg-primary-50 text-primary-800 border border-primary-300";
  if (b.includes("overnight") || b.includes("live-in"))
    return "bg-secondary-50 text-secondary-700 border border-secondary-200";
  if (b.includes("fall") || b.includes("pt ") || b.includes("medication"))
    return "bg-warning-50 text-warning-700 border border-warning-200";
  return "bg-gray-50 text-gray-600 border border-gray-200";
}

// ── Star Rating ──────────────────────────────────────────────────────

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25;
  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`${sz} ${i < full ? "text-warning-400" : i === full && hasHalf ? "text-warning-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Match Badge ──────────────────────────────────────────────────────

function TopCaregiverBadge() {
  return (
    <span className="absolute top-3 left-3 bg-warning-500/90 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-xs shadow-sm backdrop-blur-sm flex items-center gap-1">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      Top Caregiver
    </span>
  );
}

// ── Save to List (Airbnb-style modal) ────────────────────────────────

// Cute elderly person illustrations for care lists
const LIST_ICONS: Record<string, React.ReactNode> = {
  mom: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Hair */}
      <ellipse cx="32" cy="22" rx="16" ry="15" fill="#C4C4C4" />
      <ellipse cx="32" cy="24" rx="14" ry="12" fill="#D4D4D4" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="12" ry="11" fill="#FDDCB5" />
      {/* Eyes — happy closed */}
      <path d="M25 27c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M34 27c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M28 33c2 2 6 2 8 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <circle cx="24" cy="31" r="2.5" fill="#F8C4B4" opacity="0.5" />
      <circle cx="40" cy="31" r="2.5" fill="#F8C4B4" opacity="0.5" />
      {/* Cardigan */}
      <path d="M16 45c0-6 7-10 16-10s16 4 16 10v8H16v-8z" fill="#D4D4D4" />
      <path d="M26 35v18M38 35v18" stroke="#C0C0C0" strokeWidth="1" />
      {/* Neckline */}
      <path d="M28 35c2 3 6 3 8 0" stroke="#C8C8C8" strokeWidth="1.5" fill="#FDDCB5" />
    </svg>
  ),
  dad: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Hair */}
      <ellipse cx="32" cy="20" rx="15" ry="12" fill="#C4C4C4" />
      <rect x="18" y="20" width="28" height="4" fill="#FDDCB5" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="12" ry="11" fill="#FDDCB5" />
      {/* Eyes — happy closed */}
      <path d="M25 26c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M34 26c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Eyebrows */}
      <path d="M24 23h7M33 23h7" stroke="#999" strokeWidth="1" strokeLinecap="round" />
      {/* Smile */}
      <path d="M28 33c2 2 6 2 8 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Sweater vest */}
      <path d="M16 45c0-6 7-10 16-10s16 4 16 10v8H16v-8z" fill="#BFBFBF" />
      {/* Collar */}
      <path d="M28 35l4 4 4-4" stroke="#E8E8E8" strokeWidth="2" fill="#E8E8E8" />
      <path d="M26 35v18M38 35v18" stroke="#ADADAD" strokeWidth="1" />
    </svg>
  ),
  grandma: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Hair — curly */}
      <circle cx="22" cy="18" r="5" fill="#E0E0E0" />
      <circle cx="32" cy="15" r="6" fill="#E0E0E0" />
      <circle cx="42" cy="18" r="5" fill="#E0E0E0" />
      <circle cx="20" cy="24" r="4" fill="#E0E0E0" />
      <circle cx="44" cy="24" r="4" fill="#E0E0E0" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="12" ry="11" fill="#FDDCB5" />
      {/* Eyes */}
      <path d="M25 27c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M34 27c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Glasses */}
      <circle cx="27" cy="27" r="4" stroke="#888" strokeWidth="1" fill="none" />
      <circle cx="37" cy="27" r="4" stroke="#888" strokeWidth="1" fill="none" />
      <path d="M31 27h2" stroke="#888" strokeWidth="1" />
      {/* Smile */}
      <path d="M28 33c2 2 6 2 8 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Cardigan */}
      <path d="M16 45c0-6 7-10 16-10s16 4 16 10v8H16v-8z" fill="#CCCCCC" />
    </svg>
  ),
  grandpa: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      {/* Hair — thin on sides */}
      <ellipse cx="32" cy="20" rx="14" ry="10" fill="#FDDCB5" />
      <ellipse cx="19" cy="22" rx="4" ry="6" fill="#D4D4D4" />
      <ellipse cx="45" cy="22" rx="4" ry="6" fill="#D4D4D4" />
      {/* Face */}
      <ellipse cx="32" cy="28" rx="12" ry="11" fill="#FDDCB5" />
      {/* Eyes */}
      <path d="M25 26c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M34 26c1.5-1.5 3.5-1.5 5 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Smile */}
      <path d="M28 33c2 2 6 2 8 0" stroke="#555" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <circle cx="24" cy="31" r="2.5" fill="#F8C4B4" opacity="0.4" />
      <circle cx="40" cy="31" r="2.5" fill="#F8C4B4" opacity="0.4" />
      {/* Polo shirt */}
      <path d="M16 45c0-6 7-10 16-10s16 4 16 10v8H16v-8z" fill="#C4C4C4" />
      <path d="M30 35v6M34 35v6" stroke="#B0B0B0" strokeWidth="1" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <path d="M32 52s-16-10-16-22c0-5.5 4-10 9-10 3 0 5.5 1.5 7 4 1.5-2.5 4-4 7-4 5 0 9 4.5 9 10 0 12-16 22-16 22z" fill="#96C8C8" opacity="0.8" />
      <path d="M32 52s-16-10-16-22c0-5.5 4-10 9-10 3 0 5.5 1.5 7 4 1.5-2.5 4-4 7-4 5 0 9 4.5 9 10 0 12-16 22-16 22z" stroke="#7AB8B8" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <path d="M32 10l6.5 14.5H54l-12 9.5 4.5 15L32 40l-14.5 9 4.5-15-12-9.5h15.5z" fill="#96C8C8" opacity="0.8" />
      <path d="M32 10l6.5 14.5H54l-12 9.5 4.5 15L32 40l-14.5 9 4.5-15-12-9.5h15.5z" stroke="#7AB8B8" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <path d="M12 30L32 14l20 16v20H12V30z" fill="#96C8C8" opacity="0.3" />
      <path d="M12 30L32 14l20 16v20H12V30z" stroke="#7AB8B8" strokeWidth="1.5" fill="none" />
      <rect x="27" y="38" width="10" height="12" rx="1" fill="#7AB8B8" opacity="0.5" />
      <rect x="18" y="32" width="7" height="6" rx="1" stroke="#7AB8B8" strokeWidth="1" />
      <rect x="39" y="32" width="7" height="6" rx="1" stroke="#7AB8B8" strokeWidth="1" />
    </svg>
  ),
  medical: (
    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
      <rect x="16" y="16" width="32" height="32" rx="8" fill="#96C8C8" opacity="0.3" />
      <rect x="16" y="16" width="32" height="32" rx="8" stroke="#7AB8B8" strokeWidth="1.5" fill="none" />
      <rect x="29" y="22" width="6" height="20" rx="1" fill="#7AB8B8" />
      <rect x="22" y="29" width="20" height="6" rx="1" fill="#7AB8B8" />
    </svg>
  ),
};

const ICON_KEYS = Object.keys(LIST_ICONS);

interface CareList {
  name: string;
  icon: string;
  count: number;
}

const DEFAULT_LISTS: CareList[] = [
  { name: "Mom's Care", icon: "mom", count: 3 },
  { name: "Dad's Care", icon: "dad", count: 1 },
];

// Mock saved caregivers per list
const MOCK_LIST_CAREGIVERS: Record<string, string[]> = {
  "Mom's Care": ["1", "3", "6"],
  "Dad's Care": ["2"],
};

function SaveToListButton({ position = "absolute", caregiverName = "" }: { position?: "absolute" | "relative"; caregiverName?: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<CareList[]>(DEFAULT_LISTS);
  const [savedTo, setSavedTo] = useState<Set<string>>(new Set());
  const [creatingNew, setCreatingNew] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListIcon, setNewListIcon] = useState("heart");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [viewingList, setViewingList] = useState<CareList | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  const isSaved = savedTo.size > 0;

  useEffect(() => {
    if (creatingNew) inputRef.current?.focus();
  }, [creatingNew]);

  const toggleList = (listName: string) => {
    setSavedTo((prev) => {
      const next = new Set(prev);
      if (next.has(listName)) {
        next.delete(listName);
        setSavedMessage("");
      } else {
        next.add(listName);
        const displayName = caregiverName || "Caregiver";
        setSavedMessage(`${displayName} has been successfully added to ${listName}`);
        setTimeout(() => setSavedMessage(""), 3000);
      }
      return next;
    });
  };

  const handleCreateList = () => {
    const trimmed = newListName.trim();
    if (trimmed && !lists.find((l) => l.name === trimmed)) {
      const newList: CareList = { name: trimmed, icon: newListIcon, count: 0 };
      setLists((prev) => [...prev, newList]);
      setSavedTo((prev) => new Set(prev).add(trimmed));
    }
    setNewListName("");
    setNewListIcon("heart");
    setCreatingNew(false);
    setShowIconPicker(false);
  };

  const closeModal = () => {
    setOpen(false);
    setCreatingNew(false);
    setViewingList(null);
    setShowIconPicker(false);
  };

  const getListCaregivers = (listName: string) => {
    const ids = MOCK_LIST_CAREGIVERS[listName] || [];
    return CAREGIVERS.filter((cg) => ids.includes(cg.id));
  };

  // For profile panel (position="relative"), render as a dropdown anchored to button
  const isDropdown = position === "relative";

  return (
    <div ref={btnRef} className={`${position === "absolute" ? "absolute top-3 right-3" : ""} z-10`}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`w-8 h-8 flex items-center justify-center rounded-full ${position === "absolute" ? "bg-white/80 hover:bg-white shadow-sm" : "bg-white/80 hover:bg-white border border-gray-200 shadow-xs"} transition-all hover:scale-110`}
      >
        <svg className={`w-5 h-5 transition-colors ${isSaved ? "text-error-500 fill-error-500" : "text-gray-600"}`} fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      </button>

      {open && createPortal(
        <>
          {/* Backdrop — full overlay rendered via portal at document.body */}
          <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); closeModal(); }} />

          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-[380px] max-h-[80vh] overflow-hidden z-[10000] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            {/* ── Wishlist detail view ── */}
            {viewingList ? (
              <>
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                  <button onClick={() => setViewingList(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <div className="[&>svg]:w-5 [&>svg]:h-5">{LIST_ICONS[viewingList.icon] || LIST_ICONS.heart}</div>
                    </div>
                    <h3 className="text-text-lg font-semibold text-gray-900">{viewingList.name}</h3>
                  </div>
                  <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-3">
                  {getListCaregivers(viewingList.name).length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
                        {LIST_ICONS[viewingList.icon] || LIST_ICONS.heart}
                      </div>
                      <p className="text-text-sm text-gray-500">No caregivers saved yet</p>
                      <p className="text-text-xs text-gray-400 mt-1">Tap the heart on any caregiver to add them here</p>
                    </div>
                  ) : (
                    getListCaregivers(viewingList.name).map((cg) => (
                      <div key={cg.id} className="flex items-center gap-4 p-3 rounded-xl bg-primary-25 border border-primary-100 hover:shadow-sm transition-all">
                        <img src={cg.photo} alt={`${cg.firstName} ${cg.lastInitial}.`} className="w-14 h-14 rounded-xl object-cover object-[center_20%] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-text-sm font-semibold text-gray-900">{cg.firstName} {cg.lastInitial}.</p>
                          <p className="text-text-xs text-gray-500 truncate">{cg.matchSummary}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-text-xs font-medium text-gray-700">{cg.rating}</span>
                            </div>
                            <span className="text-gray-300">·</span>
                            <span className="text-text-xs font-semibold text-primary-600">${cg.hourlyRate}/hr</span>
                          </div>
                        </div>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-50 transition-colors flex-shrink-0 group/remove">
                          <svg className="w-4 h-4 text-gray-400 group-hover/remove:text-error-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* ── Save to list view ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <h3 className="text-text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clipRule="evenodd" />
                    </svg>
                    Save to list
                  </h3>
                  <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {savedMessage && (
                  <div className="mx-6 mt-4 flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-success-50 border border-success-200">
                    <svg className="w-5 h-5 text-success-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-text-sm text-success-700 font-medium">{savedMessage}</p>
                  </div>
                )}

                <div className="px-6 py-5 grid grid-cols-2 gap-3 overflow-y-auto max-h-[50vh]">
                  {lists.map((list) => {
                    const isInList = savedTo.has(list.name);
                    return (
                      <button
                        key={list.name}
                        onClick={() => toggleList(list.name)}
                        className={`relative flex flex-col items-center text-center rounded-2xl border-2 px-4 py-5 transition-all hover:shadow-md ${
                          isInList ? "border-primary-500 bg-primary-25 shadow-sm" : "border-primary-100 bg-primary-25 hover:border-primary-300"
                        }`}
                      >
                        {isInList && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </div>
                        )}
                        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-2 p-1.5">
                          {LIST_ICONS[list.icon] || LIST_ICONS.heart}
                        </div>
                        <span className="text-text-sm font-semibold text-gray-800">{list.name}</span>
                        <span className="text-text-xs text-gray-400 mt-0.5">{list.count} saved</span>
                      </button>
                    );
                  })}
                </div>

                <div className="px-6 pb-5">
                  {creatingNew ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowIconPicker(!showIconPicker)}
                          className="w-12 h-12 rounded-xl bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors flex-shrink-0"
                        >
                          <div className="[&>svg]:w-6 [&>svg]:h-6">{LIST_ICONS[newListIcon] || LIST_ICONS.heart}</div>
                        </button>
                        <input
                          ref={inputRef}
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleCreateList(); if (e.key === "Escape") { setCreatingNew(false); setNewListName(""); setShowIconPicker(false); } }}
                          placeholder="e.g. Grandma's Care"
                          className="flex-1 text-text-md border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                        />
                      </div>
                      {showIconPicker && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {ICON_KEYS.map((key) => (
                            <button
                              key={key}
                              onClick={() => { setNewListIcon(key); setShowIconPicker(false); }}
                              className={`w-10 h-10 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors ${newListIcon === key ? "bg-primary-50 ring-2 ring-primary-300" : ""}`}
                            >
                              <div className="[&>svg]:w-5 [&>svg]:h-5">{LIST_ICONS[key]}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={handleCreateList}
                        disabled={!newListName.trim()}
                        className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Create list
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCreatingNew(true)}
                      className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white text-text-md font-semibold rounded-xl transition-colors"
                    >
                      Create new list
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ── Caregiver Card (Airbnb style) ────────────────────────────────────

function CaregiverCard({ cg, selected, onClick, isTopPick }: { cg: Caregiver; selected: boolean; onClick: () => void; isTopPick?: boolean }) {
  const hasBackgroundCheck = cg.badges.includes("Background Checked");
  const specialtyBadges = cg.badges.filter(b => b !== "Background Checked" && b !== "CPR Certified").slice(0, 3);

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl transition-all duration-200 overflow-hidden cursor-pointer ${
        selected
          ? "ring-2 ring-primary-400 shadow-xl bg-white border border-primary-300 scale-[1.02]"
          : "hover:shadow-xl hover:-translate-y-1.5 bg-white shadow-xs hover:ring-2 hover:ring-primary-300 border border-gray-100 hover:border-primary-400"
      }`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img src={cg.photo} alt={`${cg.firstName} ${cg.lastInitial}.`} className="w-full h-full object-cover object-[center_20%]" />
        {isTopPick && <TopCaregiverBadge />}
        <SaveToListButton />
        {/* Hover overlay */}
        {!selected && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-gray-900/70 via-gray-900/40 to-transparent pt-10 pb-3 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-text-sm font-medium text-center flex items-center justify-center gap-1.5">
              View Full Profile
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </p>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 py-4">
        {/* Viewing label — subtle, above name */}
        {selected && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-500 mb-0.5">Viewing Profile</p>
        )}

        {/* Name + verified + rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-text-lg font-semibold text-gray-900">
              {cg.firstName} {cg.lastInitial}.
            </h3>
            {hasBackgroundCheck && (
              <svg className="w-4 h-4 text-primary-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="Background Checked">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-text-md font-medium text-gray-800">{cg.rating}</span>
            <span className="text-text-md text-gray-400">({cg.reviewCount})</span>
          </div>
        </div>

        {/* Personal quote */}
        {cg.quote && (
          <p className="text-text-sm text-gray-600 italic mt-1 line-clamp-1">&ldquo;{cg.quote}&rdquo;</p>
        )}

        {/* University + program year */}
        <p className="text-text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
          <img
            src={`/images/universities/${cg.universityAbbr.toLowerCase()}.png`}
            alt={cg.university}
            className="w-4 h-4 object-contain flex-shrink-0"
          />
          <span className="truncate">{cg.programYear || cg.university}</span>
        </p>

        {/* Completed visits */}
        {cg.completedVisits && (
          <p className="text-[11px] text-gray-400 mt-0.5">{cg.completedVisits} completed visits</p>
        )}

        {/* Availability indicator — tiered colors */}
        {cg.availabilityNote && (() => {
          const note = cg.availabilityNote;
          const isGreen = note.includes("24 hours") || note.includes("today") || note.includes("this week");
          const isYellow = note.includes("next week") || note.includes("Limited");
          const dotColor = isGreen ? "bg-success-500" : isYellow ? "bg-warning-400" : "bg-warning-600";
          const textColor = isGreen ? "text-success-600" : isYellow ? "text-warning-600" : "text-warning-700";
          return (
            <p className={`text-[11px] ${textColor} mt-1.5 flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block`} />
              {note}
            </p>
          );
        })()}

        {/* Price */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
          <span className="inline-flex items-center gap-1.5 bg-primary-600 text-white px-3 py-1 rounded-full text-text-sm font-semibold shadow-xs">
            ${cg.hourlyRate}<span className="text-primary-200 font-normal">/hr</span>
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Section Heading ──────────────────────────────────────────────────

function VideoHero({ cg, aspectClass = "aspect-[16/9]", roundedClass = "rounded-2xl" }: { cg: Caregiver; aspectClass?: string; roundedClass?: string }) {
  const [playing, setPlaying] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasVideo = !!cg.videoUrl;

  const handlePlay = useCallback(() => {
    setPlaying(true);
    setShowPhoto(false);
    setTimeout(() => videoRef.current?.play(), 50);
  }, []);

  const handleTogglePhoto = useCallback(() => {
    if (showPhoto) {
      setShowPhoto(false);
    } else {
      setShowPhoto(true);
      setPlaying(false);
      videoRef.current?.pause();
    }
  }, [showPhoto]);

  return (
    <div className={`relative ${aspectClass} ${roundedClass} overflow-hidden bg-gray-100 group`}>
      {/* Static photo — shown when not playing or toggled to photo */}
      {(!playing || showPhoto) && (
        <img src={cg.photo} alt={`${cg.firstName} ${cg.lastInitial}.`} className="w-full h-full object-cover object-[center_20%]" />
      )}

      {/* Video element — hidden until play */}
      {hasVideo && playing && !showPhoto && (
        <video
          ref={videoRef}
          src={cg.videoUrl}
          className="w-full h-full object-cover"
          controls
          playsInline
          onEnded={() => { setPlaying(false); }}
        />
      )}

      {/* Bottom gradient + controls — YouTube/Vimeo style */}
      {hasVideo && !playing && !showPhoto && (
        <>
          {/* Gradient overlay — bottom 40%, transparent at top */}
          <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/60 via-black/25 to-transparent pointer-events-none" />
          {/* Controls in the gradient zone */}
          <button
            onClick={handlePlay}
            className="absolute inset-x-0 bottom-0 h-[45%] flex items-end justify-between px-4 pb-4 cursor-pointer group/play"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover/play:bg-white/30 group-hover/play:scale-105 transition-all">
                <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-white text-text-sm font-medium drop-shadow-sm">Watch 45s intro</span>
            </div>
          </button>
        </>
      )}

      {/* View photo / View video toggle */}
      {hasVideo && (playing || showPhoto) && (
        <button
          onClick={handleTogglePhoto}
          className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-text-xs font-medium px-3 py-1.5 rounded-full hover:bg-black/60 transition-colors flex items-center gap-1.5 z-10"
        >
          {showPhoto ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              View video
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
              View photo
            </>
          )}
        </button>
      )}

      {cg.id === "1" && <TopCaregiverBadge />}
    </div>
  );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">{title}</h3>
      {children}
    </div>
  );
}

// ── Full Profile (Right Pane) ────────────────────────────────────────

// ── Request to Connect Modal ─────────────────────────────────────────

const CARE_TYPE_OPTIONS = ["Companionship", "Driving and errands", "Meal preparation", "Medication reminders", "Mobility assistance", "Light housekeeping", "Personal care"];

function RequestToConnectModal({ caregiverName, open, onClose, skipSchedule, scheduleLabel }: { caregiverName: string; open: boolean; onClose: () => void; skipSchedule?: boolean; scheduleLabel?: string }) {
  const [step, setStep] = useState(1);
  const [yourName, setYourName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [relationshipOpen, setRelationshipOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [otherCareText, setOtherCareText] = useState("");
  const [isOtherCare, setIsOtherCare] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState<"one-time" | "weekly">("one-time");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [visitsPerDay, setVisitsPerDay] = useState("1");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [scheduleChips, setScheduleChips] = useState<{ day: string; start: string; end: string }[]>([]);
  const [chipDay, setChipDay] = useState("");
  const [chipDayOpen, setChipDayOpen] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [startTimeSearch, setStartTimeSearch] = useState("");
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [endTimeSearch, setEndTimeSearch] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState(new Date().getMonth());
  const [datePickerYear, setDatePickerYear] = useState(new Date().getFullYear());
  const [zipCode, setZipCode] = useState("");
  const [noteToCaregiver, setNoteToCaregiver] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleCareType = (type: string) => {
    setCareTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    setYourName("");
    setRelationship("");
    setRecipientName("");
    setCareTypes([]);
    setOtherCareText("");
    setIsOtherCare(false);
    setScheduleFreq("one-time");
    setStartDate("");
    setEndDate("");
    setStartTime("");
    setEndTime("");
    setScheduleChips([]);
    setChipDay("");
    setChipDayOpen(false);
    setVisitsPerDay("1");
    setSelectedDays([]);
    setZipCode("");
    setNoteToCaregiver("");
    onClose();
  };

  const hasUnaddedEntry = scheduleFreq === "one-time" ? (!!startDate && !!startTime && !!endTime) : (!!chipDay && !!startTime && !!endTime);
  const totalSteps = skipSchedule ? 2 : 3;
  const displayStep = skipSchedule && step === 3 ? 2 : step;
  const canProceed = step === 1 ? (!!relationship && recipientName.trim().length > 0 && (careTypes.length > 0 || (isOtherCare && otherCareText.trim().length > 0))) : step === 2 ? (scheduleChips.length > 0 || hasUnaddedEntry) : zipCode.trim().length >= 5;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onPointerDown={handleReset} />
      <div onPointerDown={(e) => e.stopPropagation()} className="relative z-10 bg-gradient-to-b from-primary-25 to-white rounded-2xl shadow-2xl w-[720px] border border-primary-100 max-h-[90vh] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-display-xs font-semibold text-gray-900">Connect with {caregiverName}</h3>
            <p className="text-text-sm text-gray-400 mt-0.5">Step {displayStep} of {totalSteps}</p>
          </div>
          <button type="button" onPointerDown={handleReset} className="relative z-50 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
            <svg className="w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
        </div>

        {submitted ? (
          <div className="px-8 py-14 text-center relative overflow-hidden">
            {/* Animated falling confetti */}
            <style>{`
              @keyframes confettiFall {
                0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
              }
              @keyframes confettiSway {
                0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 1; }
                25% { translateX(15px); }
                50% { translateX(-10px); }
                75% { translateX(8px); }
                100% { transform: translateY(400px) translateX(-5px) rotate(540deg); opacity: 0; }
              }
            `}</style>
            <div className="absolute inset-0 pointer-events-none">
              {[
                { left: "5%", size: 8, color: "#96c8c8", delay: 0, dur: 2.5, rot: 25 },
                { left: "12%", size: 5, color: "#e9bd91", delay: 0.3, dur: 2.8, rot: -35 },
                { left: "20%", size: 6, color: "#6ce9a6", delay: 0.1, dur: 2.2, rot: 50 },
                { left: "28%", size: 4, color: "#96c8c8", delay: 0.5, dur: 3.0, rot: -20 },
                { left: "35%", size: 7, color: "#fec84b", delay: 0.2, dur: 2.6, rot: 40 },
                { left: "42%", size: 5, color: "#5fa3a3", delay: 0.4, dur: 2.4, rot: -45 },
                { left: "50%", size: 8, color: "#e9bd91", delay: 0.15, dur: 2.7, rot: 30 },
                { left: "58%", size: 4, color: "#6ce9a6", delay: 0.6, dur: 2.3, rot: -60 },
                { left: "65%", size: 6, color: "#96c8c8", delay: 0.35, dur: 2.9, rot: 55 },
                { left: "72%", size: 5, color: "#fec84b", delay: 0.1, dur: 2.5, rot: -25 },
                { left: "80%", size: 7, color: "#5fa3a3", delay: 0.45, dur: 2.6, rot: 35 },
                { left: "88%", size: 4, color: "#e9bd91", delay: 0.25, dur: 2.8, rot: -40 },
                { left: "95%", size: 6, color: "#6ce9a6", delay: 0.55, dur: 2.4, rot: 50 },
                { left: "8%", size: 3, color: "#fec84b", delay: 0.7, dur: 3.1, rot: -30 },
                { left: "45%", size: 3, color: "#5fa3a3", delay: 0.8, dur: 2.9, rot: 65 },
                { left: "75%", size: 5, color: "#96c8c8", delay: 0.65, dur: 2.3, rot: -50 },
              ].map((p, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: -10,
                    left: p.left,
                    width: i % 3 === 0 ? p.size : p.size * 0.6,
                    height: i % 3 === 0 ? p.size : p.size * 2.5,
                    borderRadius: i % 3 === 0 ? "50%" : "2px",
                    backgroundColor: p.color,
                    animation: `confettiFall ${p.dur}s ease-in ${p.delay}s infinite`,
                    transformOrigin: "center center",
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success-100 to-success-50 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success-100/50">
                <svg className="w-12 h-12 text-success-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-display-sm font-bold text-gray-900 mb-2">You're all set!</h3>
              <p className="text-text-lg text-gray-500 mb-2">Your request has been sent to {caregiverName}</p>
              <p className="text-text-sm text-gray-400 mb-10">They typically respond within an hour</p>
              <div className="flex items-center gap-3 max-w-sm mx-auto">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Keep exploring care
                </button>
                <button
                  onClick={() => { window.location.href = `/care-shifts/inbox?caregiver=${encodeURIComponent(caregiverName)}${noteToCaregiver.trim() ? `&note=${encodeURIComponent(noteToCaregiver.trim())}` : ""}`; }}
                  className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-text-sm"
                >
                  Go to inbox
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="px-8 py-8 overflow-y-auto flex-1 min-h-0">
              {/* Step 1: Who + What care */}
              {step === 1 && (
                <div>
                  {skipSchedule && scheduleLabel && (
                    <div className="mb-5 px-4 py-3 rounded-xl bg-primary-25 border border-primary-100">
                      <p className="text-text-xs font-semibold text-primary-600 uppercase tracking-wider mb-0.5">Scheduled</p>
                      <p className="text-text-sm font-medium text-gray-800">{scheduleLabel}</p>
                    </div>
                  )}
                  {/* Your name */}
                  <div className="mb-6">
                    <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Your name</label>
                    <input
                      type="text"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="w-full px-4 py-3.5 rounded-xl border border-primary-200 text-text-md text-gray-900 bg-white placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                    />
                    <p className="text-text-xs text-gray-400 mt-1.5">So {caregiverName.split(" ")[0]} knows who they&apos;re speaking with</p>
                  </div>

                  <div className="mx-0 border-t border-gray-100 mb-6" />

                  <h4 className="text-text-xl font-semibold text-gray-900 mb-1">{skipSchedule ? "Add a few more details" : "Tell us about the care recipient"}</h4>
                  <p className="text-text-md text-gray-400 mb-6">{skipSchedule ? `So ${caregiverName.split(" ")[0]} understands your care needs` : "Who will be receiving care?"}</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="relative z-20">
                      <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Relationship</label>
                      <div className="relative">
                        <button
                          onClick={() => setRelationshipOpen(!relationshipOpen)}
                          className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-text-md bg-white transition-all cursor-pointer ${
                            relationshipOpen ? "border-primary-500 ring-2 ring-primary-100" : "border-primary-200 hover:border-primary-300"
                          } ${relationship ? "text-gray-900" : "text-primary-400"}`}
                        >
                          {relationship || "Select..."}
                          <svg className={`w-4 h-4 text-primary-500 transition-transform ${relationshipOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        {relationshipOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-primary-100">
                            {["Mother", "Father", "Spouse", "Grandparent", "Myself", "Other"].map((opt) => (
                              <button
                                key={opt}
                                onClick={() => { setRelationship(opt); setRelationshipOpen(false); }}
                                className={`w-full px-4 py-3 text-left text-text-md font-medium transition-colors flex items-center gap-3 ${
                                  relationship === opt ? "bg-primary-50 text-primary-800" : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                  relationship === opt ? "border-primary-600" : "border-gray-300"
                                }`}>
                                  {relationship === opt && <span className="w-2 h-2 rounded-full bg-primary-600" />}
                                </span>
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Name of care recipient</label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Dorothy"
                        className="w-full px-4 py-3.5 rounded-xl border border-primary-200 text-text-md text-gray-900 bg-white placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <h4 className="text-text-lg font-semibold text-gray-900 mb-1">What kind of care do you need?</h4>
                  <p className="text-text-sm text-gray-400 mb-4">Select all that apply</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CARE_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleCareType(opt)}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-text-md font-medium transition-all text-left ${
                          careTypes.includes(opt) ? "border-primary-500 bg-primary-25 text-primary-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                          careTypes.includes(opt) ? "bg-primary-500 border-primary-500" : "border-gray-300"
                        }`}>
                          {careTypes.includes(opt) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                        {opt}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsOtherCare(!isOtherCare)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-text-md font-medium transition-all text-left ${
                        isOtherCare ? "border-primary-500 bg-primary-25 text-primary-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                        isOtherCare ? "bg-primary-500 border-primary-500" : "border-gray-300"
                      }`}>
                        {isOtherCare && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                      Other
                    </button>
                  </div>
                  {isOtherCare && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={otherCareText}
                        onChange={(e) => setOtherCareText(e.target.value)}
                        placeholder="Describe what care you need"
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 text-text-md text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: When — Rover-style schedule */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-text-xl font-semibold text-gray-900 mb-1">When do you need care?</h4>
                    <p className="text-text-md text-gray-400 mb-2">Add days and times — you can add multiple</p>
                  </div>

                  {/* Existing schedule chips */}
                  {scheduleChips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {scheduleChips.map((chip, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-25 border border-primary-200">
                          <span className="text-text-sm font-semibold text-primary-700">{chip.day}</span>
                          <span className="text-text-sm text-primary-600">{chip.start} – {chip.end}</span>
                          <button onClick={() => setScheduleChips((prev) => prev.filter((_, i) => i !== idx))} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary-100 transition-colors ml-1">
                            <svg className="w-3 h-3 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* How often — toggle */}
                  <div>
                    <label className="text-text-sm font-semibold text-gray-700 mb-2 block">How often?</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setScheduleFreq("one-time")}
                        className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-text-md font-medium transition-all ${
                          scheduleFreq === "one-time" ? "border-primary-500 bg-primary-25 text-primary-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        One Time
                      </button>
                      <button
                        onClick={() => setScheduleFreq("weekly")}
                        className={`flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-text-md font-medium transition-all ${
                          scheduleFreq === "weekly" ? "border-primary-500 bg-primary-25 text-primary-700" : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                        </svg>
                        Repeat Weekly
                      </button>
                    </div>
                  </div>

                  {/* Date picker — only for one-time */}
                  {scheduleFreq === "one-time" && (() => {
                    const dpDaysInMonth = new Date(datePickerYear, datePickerMonth + 1, 0).getDate();
                    const dpFirstDay = new Date(datePickerYear, datePickerMonth, 1).getDay();
                    const dpMonthName = new Date(datePickerYear, datePickerMonth).toLocaleString("default", { month: "long" });
                    const today = new Date();
                    const formattedDate = startDate
                      ? new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                      : "";
                    return (
                      <div>
                        <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Date</label>
                        <div className="relative">
                          <button
                            onClick={() => setDatePickerOpen(!datePickerOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-text-md bg-white transition-all cursor-pointer ${
                              datePickerOpen ? "border-primary-500 ring-2 ring-primary-100" : "border-primary-200 hover:border-primary-300"
                            } ${startDate ? "text-gray-900" : "text-primary-400"}`}
                          >
                            {formattedDate || "Select a date..."}
                            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                          </button>
                          {datePickerOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl z-50 border border-primary-100 overflow-hidden">
                              {/* Month header */}
                              <div className="bg-primary-600 px-3 py-2 flex items-center justify-between">
                                <button onClick={() => { if (datePickerMonth === 0) { setDatePickerMonth(11); setDatePickerYear(datePickerYear - 1); } else setDatePickerMonth(datePickerMonth - 1); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary-500 transition-colors">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                                </button>
                                <span className="text-text-sm font-bold text-white">{dpMonthName} {datePickerYear}</span>
                                <button onClick={() => { if (datePickerMonth === 11) { setDatePickerMonth(0); setDatePickerYear(datePickerYear + 1); } else setDatePickerMonth(datePickerMonth + 1); }} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary-500 transition-colors">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                </button>
                              </div>
                              {/* Day grid */}
                              <div className="p-2">
                                <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                                    <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-0.5">{d}</div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-7 gap-0.5">
                                  {Array.from({ length: dpFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                                  {Array.from({ length: dpDaysInMonth }).map((_, i) => {
                                    const d = i + 1;
                                    const dateStr = `${datePickerYear}-${String(datePickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                                    const isSelected = startDate === dateStr;
                                    const isToday = d === today.getDate() && datePickerMonth === today.getMonth() && datePickerYear === today.getFullYear();
                                    const isPast = new Date(datePickerYear, datePickerMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    return (
                                      <button
                                        key={d}
                                        disabled={isPast}
                                        onClick={() => { setStartDate(dateStr); setDatePickerOpen(false); }}
                                        className={`text-center rounded-md py-1.5 text-text-xs font-medium transition-all ${
                                          isSelected
                                            ? "bg-primary-600 text-white shadow-sm"
                                            : isPast
                                              ? "text-gray-300 cursor-not-allowed"
                                              : isToday
                                                ? "bg-primary-100 text-primary-700 hover:bg-primary-200 cursor-pointer font-semibold"
                                                : "text-gray-700 hover:bg-primary-50 cursor-pointer"
                                        }`}
                                      >
                                        {d}
                                      </button>
                                    );
                                  })}
                                </div>
                                {/* Today shortcut */}
                                <div className="flex justify-between mt-1.5 pt-1.5 border-t border-gray-100">
                                  <button onClick={() => { setStartDate(""); setDatePickerOpen(false); }} className="text-[11px] text-gray-400 hover:text-gray-600 font-medium">Clear</button>
                                  <button onClick={() => {
                                    const t = new Date();
                                    setStartDate(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`);
                                    setDatePickerMonth(t.getMonth());
                                    setDatePickerYear(t.getFullYear());
                                    setDatePickerOpen(false);
                                  }} className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold">Today</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add a day + time entry */}
                  <div className="p-5 rounded-xl border border-primary-100 bg-primary-25 space-y-4">
                    {/* Day dropdown — only for recurring */}
                    {scheduleFreq === "weekly" && (
                      <div>
                        <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Day</label>
                        <div className="relative">
                          <button
                            onClick={() => setChipDayOpen(!chipDayOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-text-md bg-white transition-all cursor-pointer ${
                              chipDayOpen ? "border-primary-500 ring-2 ring-primary-100" : "border-primary-200 hover:border-primary-300"
                            } ${chipDay ? "text-gray-900" : "text-primary-400"}`}
                          >
                            {chipDay || "Select a day..."}
                            <svg className={`w-4 h-4 text-primary-500 transition-transform ${chipDayOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                          </button>
                          {chipDayOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-primary-100 max-h-60 overflow-y-auto">
                              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                <button
                                  key={day}
                                  onClick={() => { setChipDay(day); setChipDayOpen(false); }}
                                  className={`w-full px-4 py-3 text-left text-text-md font-medium transition-colors flex items-center gap-3 ${
                                    chipDay === day ? "bg-primary-50 text-primary-800" : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                    chipDay === day ? "border-primary-600" : "border-gray-300"
                                  }`}>
                                    {chipDay === day && <span className="w-2 h-2 rounded-full bg-primary-600" />}
                                  </span>
                                  {day}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {/* Start time dropdown */}
                      <div>
                        <label className="text-text-sm font-semibold text-gray-700 mb-2 block">Start time</label>
                        <div className="relative">
                          <div className="relative">
                            <input
                              type="text"
                              value={startTimeOpen ? startTimeSearch : startTime}
                              placeholder="Select..."
                              onFocus={() => { setStartTimeOpen(true); setEndTimeOpen(false); setStartTimeSearch(""); }}
                              onChange={(e) => setStartTimeSearch(e.target.value)}
                              className={`w-full px-4 py-3.5 pr-10 rounded-xl border text-text-md bg-white transition-all cursor-pointer ${
                                startTimeOpen ? "border-primary-500 ring-2 ring-primary-100" : "border-primary-200 hover:border-primary-300"
                              } ${startTime && !startTimeOpen ? "text-gray-900" : ""} placeholder:text-primary-400 focus:outline-none`}
                            />
                            <svg className="w-4 h-4 text-primary-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          {startTimeOpen && (() => {
                            const allTimes = Array.from({ length: 48 }).map((_, i) => {
                              const h = Math.floor(i / 2);
                              const m = i % 2 === 0 ? "00" : "30";
                              const ap = h >= 12 ? "PM" : "AM";
                              return `${h % 12 || 12}:${m} ${ap}`;
                            });
                            const filtered = startTimeSearch ? allTimes.filter((t) => t.toLowerCase().includes(startTimeSearch.toLowerCase())) : allTimes;
                            return (
                              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-primary-100 max-h-48 overflow-y-auto">
                                {filtered.length === 0 ? (
                                  <p className="px-4 py-2.5 text-text-sm text-gray-400">No matches</p>
                                ) : filtered.map((label) => (
                                  <button
                                    key={label}
                                    onClick={() => { setStartTime(label); setStartTimeOpen(false); setStartTimeSearch(""); }}
                                    className={`w-full px-4 py-2.5 text-left text-text-sm font-medium transition-colors ${
                                      startTime === label ? "bg-primary-100 text-primary-800 font-semibold" : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      {/* End time dropdown */}
                      <div>
                        <label className="text-text-sm font-semibold text-gray-700 mb-2 block">End time</label>
                        <div className="relative">
                          <div className="relative">
                            <input
                              type="text"
                              value={endTimeOpen ? endTimeSearch : endTime}
                              placeholder="Select..."
                              onFocus={() => { setEndTimeOpen(true); setStartTimeOpen(false); setEndTimeSearch(""); }}
                              onChange={(e) => setEndTimeSearch(e.target.value)}
                              className={`w-full px-4 py-3.5 pr-10 rounded-xl border text-text-md bg-white transition-all cursor-pointer ${
                                endTimeOpen ? "border-primary-500 ring-2 ring-primary-100" : "border-primary-200 hover:border-primary-300"
                              } ${endTime && !endTimeOpen ? "text-gray-900" : endTimeOpen ? "text-gray-900" : "text-primary-400"}`}
                            />
                            <svg className="w-4 h-4 text-primary-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          {endTimeOpen && (() => {
                            const allTimes = Array.from({ length: 48 }).map((_, i) => {
                              const h = Math.floor(i / 2);
                              const m = i % 2 === 0 ? "00" : "30";
                              const ap = h >= 12 ? "PM" : "AM";
                              return `${h % 12 || 12}:${m} ${ap}`;
                            });
                            const filtered = allTimes.filter((t) => t.toLowerCase().includes(endTimeSearch.toLowerCase()));
                            return (
                              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl shadow-xl py-1.5 z-50 border border-primary-100 max-h-48 overflow-y-auto">
                                {filtered.length === 0 && (
                                  <div className="px-4 py-2.5 text-text-sm text-gray-400">No matches</div>
                                )}
                                {filtered.map((label) => (
                                  <button
                                    key={label}
                                    onClick={() => { setEndTime(label); setEndTimeOpen(false); setEndTimeSearch(""); }}
                                    className={`w-full px-4 py-2.5 text-left text-text-sm font-medium transition-colors ${
                                      endTime === label ? "bg-primary-100 text-primary-800 font-semibold" : "text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (scheduleFreq === "one-time" && startDate && startTime && endTime) {
                          const d = new Date(startDate + "T00:00:00");
                          const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          setScheduleChips((prev) => [...prev, { day: label, start: startTime, end: endTime }]);
                          setStartDate("");
                          setStartTime("");
                          setEndTime("");
                        } else if (scheduleFreq === "weekly" && chipDay && startTime && endTime) {
                          setScheduleChips((prev) => [...prev, { day: chipDay, start: startTime, end: endTime }]);
                          setChipDay("");
                          setStartTime("");
                          setEndTime("");
                        }
                      }}
                      disabled={scheduleFreq === "one-time" ? (!startDate || !startTime || !endTime) : (!chipDay || !startTime || !endTime)}
                      className="w-full py-3 rounded-xl border-2 border-primary-300 text-primary-600 font-semibold text-text-sm hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add to schedule
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Zip code */}
              {step === 3 && (
                <div>
                  <h4 className="text-text-xl font-semibold text-gray-900 mb-1">Where is care needed?</h4>
                  <p className="text-text-md text-gray-400 mb-6">Enter your zip code so caregivers can see how close they are</p>
                  <div className="relative">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="Enter zip code (e.g. 77004)"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-text-lg text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
                      inputMode="numeric"
                      autoFocus
                    />
                  </div>

                  {/* Optional note */}
                  <div className="mt-6">
                    <h4 className="text-text-lg font-semibold text-gray-900 mb-3">Add a personal note to {caregiverName.split(" ")[0]}</h4>
                    <input
                      type="text"
                      value={noteToCaregiver}
                      onChange={(e) => setNoteToCaregiver(e.target.value)}
                      placeholder={`Hi ${caregiverName.split(" ")[0]}! I'd love to learn more about how you work with families.`}
                      className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-text-md text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 pb-8 pt-4 flex items-center gap-3 border-t border-gray-100">
              {((skipSchedule && step === 3) || (!skipSchedule && step > 1)) && (
                <button onClick={() => setStep(skipSchedule ? 1 : step - 1)} className="px-6 py-3.5 rounded-xl border border-gray-200 text-text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  // Auto-add pending schedule entry before advancing
                  if (step === 2 && hasUnaddedEntry && startTime && endTime) {
                    if (scheduleFreq === "one-time" && startDate) {
                      const d = new Date(startDate + "T00:00:00");
                      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      setScheduleChips((prev) => [...prev, { day: label, start: startTime, end: endTime }]);
                      setStartDate(""); setStartTime(""); setEndTime("");
                    } else if (scheduleFreq === "weekly" && chipDay) {
                      setScheduleChips((prev) => [...prev, { day: chipDay, start: startTime, end: endTime }]);
                      setChipDay(""); setStartTime(""); setEndTime("");
                    }
                  }
                  if (skipSchedule && step === 1) {
                    setStep(3); // skip step 2, go straight to zip
                  } else {
                    step < 3 ? setStep(step + 1) : handleSubmit();
                  }
                }}
                disabled={!canProceed}
                className="flex-1 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-text-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {(skipSchedule ? step === 3 : step === 3) ? "Send Request" : "Continue"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function parseHour(t: string): number {
  const match = t.match(/(\d+)(am|pm)/i);
  if (!match) return 0;
  let h = parseInt(match[1]);
  if (match[2].toLowerCase() === "pm" && h !== 12) h += 12;
  if (match[2].toLowerCase() === "am" && h === 12) h = 0;
  return h;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m.toString().padStart(2, "0")} ${period}`;
}

function getStartTimes(availStr: string): number[] {
  // Parse "7am - 3pm" → generate 30-min start times from 7:00 to 14:30
  const parts = availStr.split(/\s*[-–]\s*/);
  const startH = parseHour(parts[0]?.trim() || "");
  const endH = parseHour(parts[1]?.trim() || "");
  const times: number[] = [];
  for (let m = startH * 60; m <= (endH - 1) * 60; m += 30) {
    times.push(m);
  }
  return times;
}

function getAvailEndMinutes(availStr: string): number {
  const parts = availStr.split(/\s*[-–]\s*/);
  return parseHour(parts[1]?.trim() || "") * 60;
}

function CustomDropdown({ label, placeholder, value, options, onSelect, disabled, icon }: {
  label: string;
  placeholder: string;
  value: string | null;
  options: { value: string | number; label: string }[];
  onSelect: (v: string | number) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="flex-1 relative" ref={ref}>
      <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">{label}</label>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-text-sm font-medium transition-all ${
          disabled
            ? "border-gray-100 bg-gray-50 text-gray-300 cursor-default"
            : open
              ? "border-primary-400 ring-1 ring-primary-200 bg-white text-gray-800"
              : "border-primary-200 bg-white text-gray-800 hover:border-primary-300"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {value || <span className="text-primary-300">{placeholder}</span>}
        </span>
        <svg className={`w-3.5 h-3.5 text-primary-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-primary-100 shadow-lg z-50 max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const isActive = value === opt.label;
            return (
              <button
                key={String(opt.value)}
                onClick={() => { onSelect(opt.value); setOpen(false); }}
                className={`w-full text-left px-3.5 py-2.5 text-text-sm transition-colors ${
                  isActive ? "bg-primary-50 text-primary-700 font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


function AvailabilityCalendar({ availability, caregiverName, onRequestConnect }: { availability: Record<string, string>; caregiverName: string; onRequestConnect?: (label: string) => void }) {
  const now = new Date();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<number | null>(todayDate);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [calEndTime, setCalEndTime] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [repeating, setRepeating] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const viewDate = new Date(todayYear, todayMonth + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
  const dayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const fullDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const isCurrentMonth = month === todayMonth && year === todayYear;
  const isToday = (d: number) => isCurrentMonth && d === todayDate;
  const isPast = (d: number) => isCurrentMonth && d < todayDate;

  // Build weekly availability summary from caregiver data
  const weekdayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayFull: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
  const workingDays = weekdayOrder.filter(d => availability[d] && availability[d] !== "—");
  const workingTimes = workingDays.map(d => availability[d]);
  const allSameTime = workingTimes.every(t => t === workingTimes[0]);
  const summaryDays = workingDays.map(d => weekdayFull[d]).join(", ");
  const summaryTime = allSameTime && workingTimes.length > 0 ? workingTimes[0] : "varies";

  const getDayAvail = (dayNum: number) => {
    const date = new Date(year, month, dayNum);
    const dayOfWeek = dayKeys[date.getDay()];
    const avail = availability[dayOfWeek];
    return avail && avail !== "—" ? avail : null;
  };

  const selectedAvail = selectedDate ? getDayAvail(selectedDate) : null;
  const selectedDateObj = selectedDate ? new Date(year, month, selectedDate) : null;
  const selectedDateStr = selectedDateObj
    ? selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    : "";

  // Find next available date from today
  const findNextAvailable = (): { dayNum: number; monthOff: number; label: string } | null => {
    for (let mOff = 0; mOff <= 2; mOff++) {
      const vd = new Date(todayYear, todayMonth + mOff, 1);
      const dim = new Date(vd.getFullYear(), vd.getMonth() + 1, 0).getDate();
      const startDay = mOff === 0 ? todayDate : 1;
      for (let d = startDay; d <= dim; d++) {
        const date = new Date(vd.getFullYear(), vd.getMonth(), d);
        const avail = availability[dayKeys[date.getDay()]];
        if (avail && avail !== "—") {
          const label = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
          return { dayNum: d, monthOff: mOff, label };
        }
      }
    }
    return null;
  };
  const nextAvail = findNextAvailable();

  // Count available days this month (future only)
  const availDays = Array.from({ length: daysInMonth }).filter((_, i) => {
    const d = new Date(year, month, i + 1);
    const avail = availability[dayKeys[d.getDay()]];
    return avail && avail !== "—" && !(isCurrentMonth && i + 1 < todayDate);
  }).length;

  const handleSelectDate = (dayNum: number) => {
    if (repeating) {
      const dayOfWeek = new Date(year, month, dayNum).getDay();
      setSelectedDays(prev => prev.includes(dayOfWeek) ? prev.filter(d => d !== dayOfWeek) : [...prev, dayOfWeek]);
    } else {
      setSelectedDate(dayNum === selectedDate ? null : dayNum);
      setStartTime(null);
      setCalEndTime(null);
      setShowTimePicker(false);
    }
  };

  return (
      <div className="rounded-2xl border border-gray-100 bg-primary-25 shadow-sm">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 bg-primary-100 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setMonthOffset(monthOffset - 1); setSelectedDate(null); setStartTime(null); setCalEndTime(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              disabled={monthOffset <= 0}
            >
              <svg className={`w-4 h-4 ${monthOffset <= 0 ? "text-gray-200" : "text-gray-500"}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h4 className="text-text-md font-bold text-gray-950">{caregiverName}&apos;s {monthName} availability</h4>
            <button
              onClick={() => { setMonthOffset(monthOffset + 1); setSelectedDate(null); setStartTime(null); setCalEndTime(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Next available shortcut */}
          {nextAvail && !selectedDate && (
            <button
              onClick={() => { setMonthOffset(nextAvail.monthOff); setSelectedDate(nextAvail.dayNum); }}
              className="mt-1.5 text-text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 mx-auto transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              Next available: {nextAvail.label}
            </button>
          )}
        </div>

        {/* Day headers */}
        <div className="px-4">
          <div className="grid grid-cols-7">
            {dayNames.map((d, i) => (
              <div key={i} className="text-center text-[11px] font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isAvailable = !!getDayAvail(dayNum);
              const isSelected = !repeating && dayNum === selectedDate;
              const past = isPast(dayNum);
              const today = isToday(dayNum);
              const dayOfWeek = new Date(year, month, dayNum).getDay();
              const isRepeatingSelected = repeating && selectedDate && !past && dayOfWeek === new Date(year, month, selectedDate).getDay() && dayNum !== selectedDate;

              // Build class based on visual hierarchy: selected > today > past > available > unavailable
              let cellClass = "aspect-square flex flex-col items-center justify-center rounded-xl text-text-sm transition-all duration-150 relative ";
              if (isSelected) {
                cellClass += "bg-primary-600 text-white font-semibold shadow-sm";
              } else if (isRepeatingSelected) {
                cellClass += "bg-primary-400 text-white font-semibold ring-2 ring-primary-300 cursor-pointer";
              } else if (past) {
                cellClass += "text-gray-300 bg-white cursor-default";
              } else if (today && isAvailable) {
                cellClass += "bg-[#DFF0E5] font-semibold text-gray-800 ring-2 ring-primary-400 ring-inset cursor-pointer hover:bg-[#d0e8d8]";
              } else if (today) {
                cellClass += "font-semibold text-gray-400 ring-1 ring-gray-300 ring-inset bg-white/80 cursor-pointer hover:bg-white";
              } else if (isAvailable) {
                cellClass += "bg-[#DFF0E5] text-gray-800 font-medium cursor-pointer hover:bg-[#d0e8d8]";
              } else {
                cellClass += "text-gray-300 bg-white cursor-pointer hover:bg-gray-50";
              }

              return (
                <button
                  key={dayNum}
                  onClick={() => !past && handleSelectDate(dayNum)}
                  disabled={past}
                  className={cellClass}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 px-5 py-2.5">
          <div className="flex items-center gap-4 text-text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-[#DFF0E5] border border-[#c5e0cd]" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded ring-1 ring-primary-400 bg-white" /> Today</span>
          </div>
        </div>

        {/* Selected date detail */}
        {selectedDate && (() => {
          const availWindow = selectedAvail;
          const startTimes = availWindow ? getStartTimes(availWindow) : [];
          const availEnd = availWindow ? getAvailEndMinutes(availWindow) : 0;
          const endTime = calEndTime;
          const isValid = startTime !== null && endTime !== null && endTime > startTime && endTime <= availEnd;
          // Generate valid end times: every 30 min after start time, up to avail end
          const validEndTimes: number[] = [];
          if (startTime !== null) {
            for (let m = startTime + 30; m <= availEnd; m += 30) {
              validEndTimes.push(m);
            }
          }

          return (
            <div className="border-t border-gray-100 px-5 py-4 animate-fadeIn">
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-text-sm font-semibold text-gray-800">{selectedDateStr}</p>
                  {isToday(selectedDate) && (
                    <span className="text-[10px] font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">Today</span>
                  )}
                </div>
                {availWindow && (
                  <p className="text-text-xs text-primary-600 mt-1">{caregiverName} is available {availWindow}</p>
                )}
              </div>

              {availWindow ? (
                <div className="space-y-3">
                  {!showTimePicker ? (
                    <button
                      onClick={() => setShowTimePicker(true)}
                      className="w-full py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      Send {caregiverName} a request
                    </button>
                  ) : (
                  <>
                  {/* Start time + Duration custom dropdowns */}
                  <div className="flex gap-2 animate-fadeIn">
                    {/* Start time */}
                    <CustomDropdown
                      label="Start time"
                      placeholder="Select..."
                      value={startTime !== null ? formatTime(startTime) : null}
                      options={startTimes.map(m => ({ value: m, label: formatTime(m) }))}
                      onSelect={(v) => { setStartTime(v as number); setCalEndTime(null); }}
                      icon={<svg className="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                    />
                    {/* End time */}
                    <CustomDropdown
                      label="End time"
                      placeholder="Select..."
                      value={calEndTime !== null ? formatTime(calEndTime) : null}
                      options={validEndTimes.map(m => ({ value: m, label: formatTime(m) }))}
                      onSelect={(v) => setCalEndTime(v as number)}
                      disabled={startTime === null}
                      icon={<svg className="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                    />
                  </div>

                  {/* Repeat weekly toggle */}
                  {selectedDate && (() => {
                    const selectedDayName = fullDayNames[new Date(year, month, selectedDate).getDay()];
                    // Count how many matching weekdays remain this month
                    const repeatCount = Array.from({ length: daysInMonth }).filter((_, i) => {
                      const d = new Date(year, month, i + 1);
                      return d.getDay() === new Date(year, month, selectedDate).getDay() && !isPast(i + 1);
                    }).length;
                    return (
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className={`w-9 h-5 rounded-full transition-colors relative ${repeating ? "bg-primary-500" : "bg-gray-200 group-hover:bg-gray-300"}`}
                          onClick={() => setRepeating(!repeating)}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${repeating ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                        <span className="text-text-xs text-gray-600 font-medium">
                          Every {selectedDayName} {repeating && <span className="text-primary-600">({repeatCount} dates)</span>}
                        </span>
                      </label>
                    );
                  })()}

                  {/* Request CTA */}
                  <button
                    className={`w-full py-2.5 text-text-sm font-semibold rounded-xl transition-all mt-1 ${
                      isValid
                        ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                        : "bg-gray-100 text-gray-400 cursor-default"
                    }`}
                    disabled={!isValid}
                    onClick={() => {
                      if (isValid && onRequestConnect) {
                        const label = repeating
                          ? `Every ${fullDayNames[new Date(year, month, selectedDate!).getDay()]} ${formatTime(startTime!)} – ${formatTime(endTime!)}`
                          : `${selectedDateStr} ${formatTime(startTime!)} – ${formatTime(endTime!)}`;
                        onRequestConnect(label);
                      }
                    }}
                  >
                    {isValid
                      ? repeating
                        ? `Request every ${fullDayNames[new Date(year, month, selectedDate!).getDay()]} ${formatTime(startTime!)} – ${formatTime(endTime!)}`
                        : `Request ${formatTime(startTime!)} – ${formatTime(endTime!)}`
                      : "Select start and end time"}
                  </button>
                  </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-text-sm text-red-600 font-medium">{caregiverName} isn&apos;t available this day</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
  );
}

function CaregiverProfile({ cg }: { cg: Caregiver }) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [calendarConnectOpen, setCalendarConnectOpen] = useState(false);
  const [calendarScheduleLabel, setCalendarScheduleLabel] = useState("");
  return (
    <div className="space-y-5">
      {/* Hero photo / video */}
      <VideoHero cg={cg} />

      {/* Name + meta */}
      <div>
        <h2 className="font-display text-display-sm text-gray-900">
          {cg.firstName} {cg.lastInitial}.
        </h2>
        <p className="text-text-md text-gray-500 mt-1">{cg.matchSummary}</p>
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Stars rating={cg.rating} size="md" />
            <span className="text-text-md font-semibold text-gray-800">{cg.rating}</span>
            <span className="text-text-sm text-gray-400">({cg.reviewCount} reviews)</span>
          </div>
          <span className="text-gray-200">|</span>
          <span className="text-text-md font-semibold text-gray-900">${cg.hourlyRate}/hr</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {["Background Checked", "Verified Identity"].map((label) => (
            <span key={label} className="flex items-center gap-1.5 text-text-xs font-medium text-gray-700">
              <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {label}
            </span>
          ))}
        </div>
      </div>

      <button onClick={() => setConnectOpen(true)} className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm text-text-md">
        Request to Connect
      </button>
      <RequestToConnectModal caregiverName={`${cg.firstName} ${cg.lastInitial}.`} open={connectOpen} onClose={() => setConnectOpen(false)} />

      {/* Achievement medals */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="flex flex-col items-center text-center bg-primary-25 rounded-lg px-1.5 py-2 border border-primary-100">
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mb-1">
            <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-text-xs font-bold text-primary-900">{cg.completedVisits || 0}</p>
          <p className="text-[10px] text-primary-600">Completed visits</p>
        </div>
        <div className="flex flex-col items-center text-center bg-primary-25 rounded-lg px-1.5 py-2 border border-primary-100">
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mb-1">
            <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-text-xs font-bold text-primary-900">1 hr</p>
          <p className="text-[10px] text-primary-600">Avg response</p>
        </div>
        <div className="flex flex-col items-center text-center bg-primary-25 rounded-lg px-1.5 py-2 border border-primary-100">
          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mb-1">
            <svg className="w-3 h-3 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2ZM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8Zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1Z" />
            </svg>
          </div>
          <p className="text-text-xs font-bold text-primary-900">89%</p>
          <p className="text-[10px] text-primary-600">Repeat clients</p>
        </div>
      </div>

      <hr className="border-gray-100" />

      <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" /></svg>About</>}>
        <p className="text-text-md text-gray-600 leading-relaxed">{cg.bio}</p>
      </Section>

      <hr className="border-gray-100" />

      <AvailabilityCalendar availability={cg.availability} caregiverName={cg.firstName} onRequestConnect={(label) => { setCalendarScheduleLabel(label); setCalendarConnectOpen(true); }} />
      <RequestToConnectModal caregiverName={`${cg.firstName} ${cg.lastInitial}.`} open={calendarConnectOpen} onClose={() => setCalendarConnectOpen(false)} skipSchedule scheduleLabel={calendarScheduleLabel} />

      <hr className="border-gray-100" />

      {/* Education */}
      <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75m0 0h10.5" /></svg>Education</>}>
        <div className="space-y-4">
          {cg.education
            .filter((ed) => {
              const uniKeys = ["houston", "texas a&m", "prairie view", "college", "university", "institute"];
              return uniKeys.some((k) => ed.school.toLowerCase().includes(k)) && !ed.degree.toLowerCase().includes("certificate");
            })
            .map((ed, i) => {
            const uniMap: Record<string, string> = {
              "houston": "uh",
              "texas a&m": "tamu",
              "prairie view": "pvamu",
            };
            const matchedUni = Object.entries(uniMap).find(([key]) => ed.school.toLowerCase().includes(key));
            return (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden p-1.5">
                {matchedUni ? (
                  <img
                    src={`/images/universities/${matchedUni[1]}.png`}
                    alt={ed.school}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75m0 0h10.5" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-text-sm font-semibold text-gray-800">{ed.degree}</p>
                <p className="text-text-sm text-gray-500">{ed.school} &middot; {ed.year}</p>
              </div>
            </div>
            );
          })}
        </div>
      </Section>

      <hr className="border-gray-100" />

      <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>Work Experience</>}>
        <div className="space-y-3">
          {cg.workHistory.map((w, i) => (
            <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-[18px] h-[18px] text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <div>
                <p className="text-text-sm font-semibold text-gray-800">{w.role}</p>
                <p className="text-text-sm text-gray-500">{w.place} &middot; {w.duration}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <hr className="border-gray-100" />

      <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>Certifications</>}>
        <div className="flex flex-wrap gap-2">
          {cg.certifications.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-text-sm border border-gray-200">
              <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              {c}
            </span>
          ))}
        </div>
      </Section>

      <hr className="border-gray-100" />

      <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" /></svg>Experience With</>}>
        <div className="flex flex-wrap gap-2">
          {cg.conditions.map((c) => (
            <span key={c} className="px-3 py-1.5 bg-primary-25 text-primary-700 rounded-lg text-text-sm border border-primary-100">
              {c}
            </span>
          ))}
        </div>
      </Section>

      <hr className="border-gray-100" />

      <div className="grid grid-cols-2 gap-6">
        <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>Languages</>}>
          <div className="flex flex-col gap-2">
            {cg.languages.map((l, i) => (
              <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-50 text-warm-700 rounded-lg text-text-sm border border-warm-200">
                <svg className="w-3.5 h-3.5 text-warm-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                {l}
                {i === 0 && <span className="text-[10px] text-warm-400 font-medium ml-0.5">(Primary)</span>}
              </span>
            ))}
          </div>
        </Section>
        <Section title={<><svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>Hobbies &amp; Interests</>}>
          <div className="flex flex-wrap gap-2">
            {cg.hobbies.map((h) => {
              const hobbyIcon = (name: string) => {
                const cls = "w-4 h-4 text-warm-500 flex-shrink-0";
                switch (name) {
                  case "Gardening":
                    return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.9 3.9 19.9A1 1 0 0 0 5 21a1 1 0 0 0 .9-.6C7.3 17 10.2 13.5 17 12V8Z" /><path d="M17 8V2l4 4-4 4" /></svg>);
                  case "Cooking": case "Cooking Nigerian cuisine":
                    return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="6" /><path d="M10 8V3M16 14h5M7 4l2 2M13 4l-2 2" /></svg>);
                  case "Puzzle games": case "Puzzles": case "Crossword puzzles":
                    return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V8a2 2 0 0 0-2-2h-3a2 2 0 0 1 0-4H9a2 2 0 0 1 0 4H6a2 2 0 0 0-2 2v3a2 2 0 0 1-4 0v6a2 2 0 0 1 4 0v3a2 2 0 0 0 2 2h3a2 2 0 0 1 0-4h6a2 2 0 0 1 0 4h3a2 2 0 0 0 2-2v-3a2 2 0 0 1 4 0v-6a2 2 0 0 1-4 0Z" /></svg>);
                  case "Walking": case "Nature walks":
                    return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4.5" r="2" /><path d="M10 10.5l-2 8M10 10.5l4 4v6" /><path d="M10 10.5l-3-2H4" /><path d="M16 21h-2l-1-2.5" /></svg>);
                  default:
                    return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>);
                }
              };
              return (
                <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vanilla-200 text-gray-700 rounded-lg text-text-sm border border-vanilla-300">
                  {hobbyIcon(h)}
                  {h}
                </span>
              );
            })}
          </div>
        </Section>
      </div>

      <hr className="border-gray-100" />

      <Section title={<span className="flex items-center gap-2">Reviews ({cg.reviewCount}) <button className="text-text-xs text-primary-600 font-medium hover:underline">See more reviews</button></span>}>
        <div className="space-y-4">
          {cg.reviews.map((r, i) => (
            <div key={i} className="bg-gray-25 rounded-xl p-5 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-text-sm font-semibold text-gray-800">{r.author}</span>
                  <Stars rating={r.rating} />
                </div>
                <span className="text-text-xs text-gray-400">{r.date}</span>
              </div>
              <p className="text-text-sm text-gray-600 leading-relaxed line-clamp-3">{r.text}</p>
              {r.text.length > 150 && (
                <button className="text-text-xs text-primary-600 font-medium mt-1 hover:underline">Read more</button>
              )}
            </div>
          ))}
        </div>
      </Section>

    </div>
  );
}

// ── Care Type Dropdown ───────────────────────────────────────────────

const CARE_TYPES = [
  "Companionship",
  "Driving",
  "Meal Prep",
  "Medication Reminders",
  "Mobility Assistance",
  "Supervised Activity",
];

// Map care types to keywords that match caregiver data (badges, conditions, certifications, bio)
const CARE_TYPE_KEYWORDS: Record<string, string[]> = {
  "Companionship": ["companion", "companionship", "social", "engagement", "isolation"],
  "Driving": ["driving", "transportation", "outings"],
  "Meal Prep": ["meal prep", "cooking", "nutrition", "servsafe", "food"],
  "Medication Reminders": ["medication", "med admin", "polypharmacy", "pharmacy"],
  "Mobility Assistance": ["mobility", "fall prevention", "transfer", "walking", "physical therapy", "rehab", "pt assistant", "kinesiology"],
  "Supervised Activity": ["activity", "cognitive", "stimulation", "exercise", "puzzle", "games"],
};

function caregiverMatchesCareTypes(cg: Caregiver, types: string[]): boolean {
  if (types.length === 0) return true;
  const searchable = [
    ...cg.badges,
    ...cg.conditions,
    ...cg.certifications,
    cg.bio,
    cg.matchSummary,
  ].join(" ").toLowerCase();
  return types.some((type) => {
    const keywords = CARE_TYPE_KEYWORDS[type] || [type.toLowerCase()];
    return keywords.some((kw) => searchable.includes(kw));
  });
}

// Houston-area ZIP code → city mapping for search
const ZIP_TO_CITIES: Record<string, string[]> = {
  "77001": ["houston"], "77002": ["houston"], "77003": ["houston"], "77004": ["houston"], "77005": ["houston"],
  "77006": ["houston"], "77007": ["houston"], "77008": ["houston"], "77009": ["houston"], "77010": ["houston"],
  "77011": ["houston"], "77019": ["houston"], "77020": ["houston"], "77025": ["houston"], "77030": ["houston"],
  "77035": ["houston"], "77040": ["houston"], "77042": ["houston"], "77045": ["houston"], "77050": ["houston"],
  "77055": ["houston"], "77056": ["houston"], "77057": ["houston"], "77060": ["houston"], "77070": ["houston"],
  "77077": ["houston", "katy"], "77079": ["houston"], "77080": ["houston"], "77081": ["houston"],
  "77082": ["houston", "katy"], "77084": ["houston", "katy"], "77085": ["houston"],
  "77090": ["houston", "spring"], "77091": ["houston"], "77092": ["houston"],
  "77094": ["houston", "katy"], "77095": ["houston", "cypress"],
  "77301": ["conroe"], "77302": ["conroe"], "77304": ["conroe"],
  "77339": ["houston", "spring"], "77346": ["houston"],
  "77375": ["tomball"], "77377": ["tomball"],
  "77380": ["the woodlands", "spring"], "77381": ["the woodlands"], "77382": ["the woodlands"],
  "77384": ["the woodlands", "spring"], "77385": ["the woodlands", "spring"],
  "77386": ["spring"], "77388": ["spring"], "77389": ["spring"],
  "77401": ["bellaire"], "77402": ["bellaire"],
  "77406": ["richmond"], "77407": ["richmond", "sugar land"],
  "77429": ["cypress"], "77433": ["cypress"],
  "77449": ["katy"], "77450": ["katy"], "77493": ["katy"], "77494": ["katy"],
  "77478": ["sugar land"], "77479": ["sugar land"], "77498": ["sugar land"],
  "77504": ["pasadena"], "77505": ["pasadena"], "77506": ["pasadena"],
  "77520": ["houston"], "77530": ["houston"],
  "77546": ["pearland"], "77581": ["pearland"], "77584": ["pearland"],
  "77573": ["league city"], "77058": ["league city"],
  "77459": ["missouri city"], "77489": ["missouri city"],
  "77545": ["missouri city"],
  "73301": ["austin"], "78701": ["austin"], "78702": ["austin"],
};

function caregiverMatchesLocation(cg: Caregiver, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  // Direct city/location match
  if (cg.location.toLowerCase().includes(q)) return true;
  // ZIP code lookup
  const cities = ZIP_TO_CITIES[q];
  if (cities) {
    return cities.some((city) => cg.location.toLowerCase().includes(city));
  }
  // Also try matching state abbreviation
  if (q === "tx" || q === "texas") return cg.location.toLowerCase().includes("tx");
  return false;
}

function DualRangeSlider({ min, max, step, valueMin, valueMax, onChange }: {
  min: number; max: number; step: number;
  valueMin: number; valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const ticks = [15, 20, 25, 30, 35, 40, 45, 50];
  const range = max - min;
  const leftPct = ((valueMin - min) / range) * 100;
  const rightPct = ((valueMax - min) / range) * 100;

  const handlePointer = (e: React.PointerEvent, handle: "min" | "max") => {
    e.preventDefault();
    const track = trackRef.current!;
    const move = (ev: PointerEvent) => {
      const rect = track.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      const raw = min + pct * range;
      const snapped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, snapped));
      if (handle === "min") onChange(Math.min(clamped, valueMax - step), valueMax);
      else onChange(valueMin, Math.max(clamped, valueMin + step));
    };
    const up = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  };

  return (
    <div className="relative pt-2 pb-6">
      {/* Track background */}
      <div ref={trackRef} className="relative h-2 rounded-full bg-gray-200 cursor-pointer">
        {/* Active range fill */}
        <div
          className="absolute top-0 bottom-0 rounded-full bg-primary-500"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        {/* Tick marks */}
        {ticks.map((t) => {
          const pct = ((t - min) / range) * 100;
          return (
            <div key={t} className="absolute top-full mt-2 flex flex-col items-center" style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
              <div className="w-px h-1.5 bg-gray-300" />
              <span className="text-[10px] text-gray-400 mt-0.5">${t === 50 ? "50+" : t}</span>
            </div>
          );
        })}
        {/* Min handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary-500 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform touch-none"
          style={{ left: `${leftPct}%`, transform: `translateX(-50%) translateY(-50%)`, zIndex: valueMin === valueMax ? 30 : 20 }}
          onPointerDown={(e) => handlePointer(e, "min")}
        />
        {/* Max handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-primary-500 shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform touch-none"
          style={{ left: `${rightPct}%`, transform: "translateX(-50%) translateY(-50%)", zIndex: 20 }}
          onPointerDown={(e) => handlePointer(e, "max")}
        />
      </div>
    </div>
  );
}

function SearchBar({ selectedTypes, setSelectedTypes, priceMin, setPriceMin, priceMax, setPriceMax, caregivers, onSearch }: {
  selectedTypes: string[];
  setSelectedTypes: (v: string[]) => void;
  priceMin: number;
  setPriceMin: (v: number) => void;
  priceMax: number;
  setPriceMax: (v: number) => void;
  caregivers: Caregiver[];
  onSearch: () => void;
}) {
  const [openDropdown, setOpenDropdown] = useState<"care" | "price" | null>(null);
  const [draftMin, setDraftMin] = useState(priceMin);
  const [draftMax, setDraftMax] = useState(priceMax);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenDropdown(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Sync drafts when dropdown opens
  useEffect(() => {
    if (openDropdown === "price") { setDraftMin(priceMin); setDraftMax(priceMax); }
  }, [openDropdown, priceMin, priceMax]);

  const isDefaultRange = priceMin <= 15 && priceMax >= 50;
  const priceLabel = isDefaultRange ? "Any price" : priceMin <= 15 ? `Up to $${priceMax}/hr` : priceMax >= 50 ? `$${priceMin}+/hr` : `$${priceMin} – $${priceMax}/hr`;

  // Live match count for draft values
  const matchCount = caregivers.filter((cg) => {
    const matchesPrice = (draftMin <= 15 && draftMax >= 50) || (cg.hourlyRate >= draftMin && (draftMax >= 50 || cg.hourlyRate <= draftMax));
    const matchesCare = caregiverMatchesCareTypes(cg, selectedTypes);
    return matchesPrice && matchesCare;
  }).length;

  const handleMinInput = (v: string) => {
    const n = parseInt(v.replace(/\D/g, ""));
    if (!isNaN(n)) setDraftMin(Math.max(15, Math.min(n, draftMax - 5)));
  };
  const handleMaxInput = (v: string) => {
    const n = parseInt(v.replace(/\D/g, ""));
    if (!isNaN(n)) setDraftMax(Math.max(draftMin + 5, Math.min(n, 50)));
  };

  return (
    <div className="mt-6 relative z-30" ref={ref}>
      <p className="text-text-sm text-gray-500 mb-3">Filter to find the right caregiver</p>
      <div className="inline-flex items-stretch bg-white rounded-full border border-gray-200 shadow-md">
        {/* Care type section */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "care" ? null : "care")}
            className="flex items-center gap-2.5 h-full px-6 py-3 text-text-md text-gray-800 hover:bg-gray-50 transition-colors rounded-l-full"
          >
            {selectedTypes.length > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[11px] font-bold flex items-center justify-center">{selectedTypes.length}</span>
                <span className="font-medium">Care Type</span>
              </span>
            ) : (
              <span className="font-medium">Care Type</span>
            )}
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === "care" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {openDropdown === "care" && (
            <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl py-3 z-50 border border-gray-100" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <p className="px-5 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Select care types</p>
              {CARE_TYPES.map((type) => {
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedTypes(isSelected ? selectedTypes.filter(s => s !== type) : [...selectedTypes, type])}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left text-text-md font-medium transition-colors ${
                      isSelected ? "bg-primary-50 text-primary-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                      isSelected ? "border-primary-500 bg-primary-500" : "border-gray-300"
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </span>
                    {type}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px bg-gray-200 my-2" />

        {/* Price section */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
            className="flex items-center gap-2.5 h-full px-6 py-3 text-text-md text-gray-800 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">{priceLabel}</span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === "price" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {openDropdown === "price" && (
            <div className="absolute top-full right-0 mt-3 w-[340px] bg-white rounded-2xl shadow-2xl p-6 z-50 border border-gray-100">
              <p className="text-text-md font-semibold text-gray-800 mb-4">Price range</p>

              {/* Min / Max inputs */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1">
                  <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">Min</label>
                  <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 focus-within:border-primary-400 transition-colors">
                    <span className="text-text-sm text-gray-400 mr-1">$</span>
                    <input
                      type="text"
                      value={draftMin}
                      onChange={(e) => handleMinInput(e.target.value)}
                      className="w-full text-text-md font-semibold text-gray-800 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
                <span className="text-gray-300 mt-5">—</span>
                <div className="flex-1">
                  <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1 block">Max</label>
                  <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 focus-within:border-primary-400 transition-colors">
                    <span className="text-text-sm text-gray-400 mr-1">$</span>
                    <input
                      type="text"
                      value={draftMax >= 50 ? "50+" : draftMax}
                      onChange={(e) => handleMaxInput(e.target.value)}
                      className="w-full text-text-md font-semibold text-gray-800 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Dual range slider */}
              <DualRangeSlider
                min={15} max={50} step={5}
                valueMin={draftMin} valueMax={draftMax}
                onChange={(lo, hi) => { setDraftMin(lo); setDraftMax(hi); }}
              />

              {/* Live match count */}
              <p className="text-text-sm text-gray-500 mt-2 text-center">
                <span className="font-semibold text-primary-600">{matchCount}</span> caregiver{matchCount !== 1 ? "s" : ""} match
              </p>

              {/* Clear / Apply */}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setDraftMin(15); setDraftMax(50); }}
                  className="text-text-sm font-medium text-gray-500 hover:text-gray-800 underline transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => { setPriceMin(draftMin); setPriceMax(draftMax); setOpenDropdown(null); onSearch(); }}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search button */}
        <button
          onClick={onSearch}
          className="flex items-center gap-2 px-7 py-3 bg-primary-600 hover:bg-primary-700 text-white text-text-md font-semibold transition-colors rounded-r-full"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          Search
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

function CareShiftsPageInner() {
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profile");
  const profileCg = profileId ? CAREGIVERS.find((c) => c.id === profileId) : null;

  // Search / filter state
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(15);
  const [priceMax, setPriceMax] = useState(50);
  const [activeCareTypes, setActiveCareTypes] = useState<string[]>([]);

  const isDefaultPrice = priceMin <= 15 && priceMax >= 50;
  const filteredCaregivers = CAREGIVERS.filter((cg) =>
    caregiverMatchesCareTypes(cg, activeCareTypes) && (isDefaultPrice || (cg.hourlyRate >= priceMin && (priceMax >= 50 || cg.hourlyRate <= priceMax)))
  );

  const handleSearch = useCallback(() => {
    setActiveCareTypes([...selectedCareTypes]);
    setCurrentPage(1);
  }, [selectedCareTypes]);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredCaregivers.length / ITEMS_PER_PAGE);
  const paginated = filteredCaregivers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const [selectedId, setSelectedId] = useState(CAREGIVERS[0].id);
  const [fullProfileConnectOpen, setFullProfileConnectOpen] = useState(false);
  const [fullProfileCalendarConnectOpen, setFullProfileCalendarConnectOpen] = useState(false);
  const [fullProfileCalendarLabel, setFullProfileCalendarLabel] = useState("");
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [profileVideoPlaying, setProfileVideoPlaying] = useState(false);
  const profileVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-select first result when filters change and current selection is not in results
  useEffect(() => {
    if (filteredCaregivers.length > 0 && !filteredCaregivers.find((c) => c.id === selectedId)) {
      setSelectedId(filteredCaregivers[0].id);
    }
  }, [activeCareTypes, filteredCaregivers, selectedId]);

  // Reset profile expanded when switching caregivers
  useEffect(() => { setProfileExpanded(false); }, [selectedId]);

  const selected = filteredCaregivers.find((c) => c.id === selectedId) || filteredCaregivers[0] || CAREGIVERS[0];

  // Full-page profile view (opened in new tab)
  if (profileCg) {
    const cg = profileCg;
    const hasBackgroundCheck = cg.badges.includes("Background Checked");
    return (
      <div className="min-h-screen bg-vanilla-50">
        {/* Back link */}
        <div className="max-w-[1400px] mx-auto px-8 pt-6 pb-2">
          <a href="/care-shifts" className="inline-flex items-center gap-1.5 text-text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back to all caregivers
          </a>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex gap-10 items-start">
            {/* ── Left Column — Sticky card ── */}
            <div className="w-[38%] flex-shrink-0">
              <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Hero photo */}
                <div className="relative">
                  <img src={cg.photo} alt={`${cg.firstName} ${cg.lastInitial}.`} className="w-full aspect-[4/3] object-cover object-[center_20%]" />
                  <div className="absolute top-3 right-3 z-10">
                    <SaveToListButton position="relative" />
                  </div>
                  {cg.id === "1" && <TopCaregiverBadge />}
                </div>
                <div className="p-6 space-y-4">
                  {/* Name + verified */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-display-md text-gray-900">{cg.firstName} {cg.lastInitial}.</h1>
                      {hasBackgroundCheck && (
                        <svg className="w-5 h-5 text-primary-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-text-md text-gray-500 mt-1">{cg.matchSummary}</p>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 flex-wrap text-text-sm">
                    <div className="flex items-center gap-1">
                      <Stars rating={cg.rating} size="md" />
                      <span className="font-semibold text-gray-800">{cg.rating}</span>
                      <span className="text-gray-400">({cg.reviewCount})</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <span className="font-semibold text-gray-900">${cg.hourlyRate}/hr</span>
                  </div>

                  {/* Trust checks */}
                  <div className="flex flex-wrap gap-3">
                    {["Background Checked", "Verified Identity", "CPR Certified"].map((label) => (
                      <span key={label} className="flex items-center gap-1.5 text-text-xs font-medium text-gray-700">
                        <svg className="w-4 h-4 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Primary CTA */}
                  <button onClick={() => setFullProfileConnectOpen(true)} className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm text-text-md">
                    Request to Connect
                  </button>
                  {/* About */}
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="text-text-sm font-semibold text-gray-900 mb-1.5">About</h3>
                    <p className="text-text-sm text-gray-500 leading-relaxed">{cg.bio}</p>
                  </div>

                  {/* Achievement medals */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                    <div className="flex flex-col items-center text-center bg-primary-25 rounded-xl px-2 py-3 border border-primary-100">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <p className="text-text-sm font-bold text-primary-900">{cg.completedVisits || 0}</p>
                      <p className="text-text-xs text-primary-600">Completed visits</p>
                    </div>
                    <div className="flex flex-col items-center text-center bg-primary-25 rounded-xl px-2 py-3 border border-primary-100">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </div>
                      <p className="text-text-sm font-bold text-primary-900">1 hr</p>
                      <p className="text-text-xs text-primary-600">Avg response time</p>
                    </div>
                    <div className="flex flex-col items-center text-center bg-primary-25 rounded-xl px-2 py-3 border border-primary-100">
                      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center mb-1.5">
                        <svg className="w-3.5 h-3.5 text-primary-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2ZM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8Zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1Z" />
                        </svg>
                      </div>
                      <p className="text-text-sm font-bold text-primary-900">89%</p>
                      <p className="text-text-xs text-primary-600">Repeat clients</p>
                    </div>
                  </div>

                  {/* Education */}
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="text-text-sm font-semibold text-gray-900 mb-2">Education</h3>
                    <div className="space-y-2">
                      {cg.education.map((ed, i) => {
                        const uniMap: Record<string, string> = { "houston": "uh", "texas a&m": "tamu", "prairie view": "pvamu" };
                        const matchedUni = Object.entries(uniMap).find(([key]) => ed.school.toLowerCase().includes(key));
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden p-1">
                              {matchedUni ? (
                                <img src={`/images/universities/${matchedUni[1]}.png`} alt={ed.school} className="w-full h-full object-contain" />
                              ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75m0 0h10.5" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-text-sm font-medium text-gray-800">{ed.degree}</p>
                              <p className="text-text-xs text-gray-500">{ed.school}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="text-text-sm font-semibold text-gray-900 mb-2">Languages</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {cg.languages.map((l, i) => (
                        <span key={l} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warm-50 text-warm-700 rounded-lg text-text-sm border border-warm-200">
                          <svg className="w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                          </svg>
                          {l} {i === 0 && <span className="text-text-xs text-warm-400">(Primary)</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hobbies */}
                  <div className="pt-3 border-t border-gray-100">
                    <h3 className="text-text-sm font-semibold text-gray-900 mb-2">Hobbies & Interests</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {cg.hobbies.map((h) => {
                        const hobbyIcon = (name: string) => {
                          const cls = "w-4 h-4 text-warm-500 flex-shrink-0";
                          switch (name) {
                            case "Gardening":
                              return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.9 3.9 19.9A1 1 0 0 0 5 21a1 1 0 0 0 .9-.6C7.3 17 10.2 13.5 17 12V8Z" /><path d="M17 8V2l4 4-4 4" /></svg>);
                            case "Cooking": case "Cooking Nigerian cuisine":
                              return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="6" /><path d="M10 8V3M16 14h5M7 4l2 2M13 4l-2 2" /></svg>);
                            case "Puzzle games": case "Puzzles": case "Crossword puzzles":
                              return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M20 16V8a2 2 0 0 0-2-2h-3a2 2 0 0 1 0-4H9a2 2 0 0 1 0 4H6a2 2 0 0 0-2 2v3a2 2 0 0 1-4 0v6a2 2 0 0 1 4 0v3a2 2 0 0 0 2 2h3a2 2 0 0 1 0-4h6a2 2 0 0 1 0 4h3a2 2 0 0 0 2-2v-3a2 2 0 0 1 4 0v-6a2 2 0 0 1-4 0Z" /></svg>);
                            case "Walking": case "Nature walks":
                              return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="13" cy="4.5" r="2" /><path d="M10 10.5l-2 8M10 10.5l4 4v6" /><path d="M10 10.5l-3-2H4" /><path d="M16 21h-2l-1-2.5" /></svg>);
                            default:
                              return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>);
                          }
                        };
                        return (
                          <span key={h} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-vanilla-200 text-gray-700 rounded-lg text-text-sm border border-vanilla-300">
                            {hobbyIcon(h)}
                            {h}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column — Scrollable content ── */}
            <div className="flex-1 min-w-0 space-y-0">
              {/* Availability */}
              <AvailabilityCalendar availability={cg.availability} caregiverName={cg.firstName} onRequestConnect={(label) => { setFullProfileCalendarLabel(label); setFullProfileCalendarConnectOpen(true); }} />

              {/* Intro Video */}
              {cg.videoUrl && (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 mt-6 shadow-xs">
                  <h2 className="text-display-xs font-display text-gray-900 mb-4 flex items-center gap-2.5">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    Introduction Video
                  </h2>
                  <div className="relative rounded-xl overflow-hidden group cursor-pointer" onClick={() => {
                    if (!profileVideoPlaying) {
                      setProfileVideoPlaying(true);
                      setTimeout(() => profileVideoRef.current?.play(), 50);
                    } else {
                      if (profileVideoRef.current?.paused) profileVideoRef.current.play();
                      else profileVideoRef.current?.pause();
                    }
                  }}>
                    {profileVideoPlaying ? (
                      <video
                        ref={profileVideoRef}
                        src={cg.videoUrl}
                        className="w-full aspect-video object-cover rounded-xl"
                        playsInline
                        controls
                        onEnded={() => setProfileVideoPlaying(false)}
                      />
                    ) : (
                      <>
                        <img src={cg.photo} alt="Video thumbnail" className="w-full aspect-video object-cover rounded-xl" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-primary-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Experience With */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 mt-6 shadow-xs">
                <h2 className="text-display-xs font-display text-gray-900 mb-4 flex items-center gap-2.5">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                  Experience With
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cg.conditions.map((c) => (
                    <span key={c} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-text-sm font-medium border border-primary-100">{c}</span>
                  ))}
                </div>
              </div>

              {/* Work Experience */}
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mt-6">
                <h2 className="text-display-xs font-display text-gray-900 mb-4 flex items-center gap-2.5">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Work Experience
                </h2>
                <div className="relative space-y-0">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-4 bottom-4 w-px bg-primary-200" />
                  {cg.workHistory.map((w, i) => (
                    <div key={i} className="relative flex items-start gap-5 py-4">
                      <div className="w-10 h-10 rounded-full bg-primary-100 border-2 border-primary-300 flex items-center justify-center flex-shrink-0 z-10">
                        <svg className="w-[18px] h-[18px] text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </div>
                      <div className="bg-white rounded-xl px-5 py-4 border border-gray-200 flex-1">
                        <p className="text-text-md font-semibold text-gray-800">{w.role}</p>
                        <p className="text-text-sm text-gray-500">{w.place} &middot; {w.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 mt-6">
                <h2 className="text-display-xs font-display text-gray-900 mb-4 flex items-center gap-2.5">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                  Certifications
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {cg.certifications.map((c) => (
                    <div key={c} className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 border border-gray-200">
                      <svg className="w-[18px] h-[18px] text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                      </svg>
                      <span className="text-text-sm font-medium text-gray-700">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 mt-6 shadow-xs">
                <h2 className="text-display-xs font-display text-gray-900 mb-4 flex items-center gap-2.5">
                  <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                  </svg>
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {cg.languages.map((l, i) => (
                    <span key={l} className="inline-flex items-center gap-1.5 px-4 py-2 bg-warm-50 text-warm-700 rounded-xl text-text-sm font-medium border border-warm-200">
                      <svg className="w-4 h-4 text-warm-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                      {l}
                      {i === 0 && <span className="text-[11px] text-warm-400 font-medium">(Primary)</span>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-2xl p-8 border border-gray-100 mt-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-display-xs font-display text-gray-900 flex items-center gap-2.5">
                    <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    Reviews ({cg.reviewCount})
                  </h2>
                  <select className="text-text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <option>Most recent</option>
                    <option>Highest rated</option>
                    <option>Lowest rated</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {cg.reviews.map((r, i) => (
                    <div key={i} className="bg-gray-25 rounded-xl p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-text-md font-semibold text-gray-800">{r.author}</span>
                          <Stars rating={r.rating} size="md" />
                        </div>
                        <span className="text-text-sm text-gray-400">{r.date}</span>
                      </div>
                      <p className="text-text-md text-gray-600 leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
                {cg.reviewCount > cg.reviews.length && (
                  <button className="w-full mt-4 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors text-text-sm">
                    Load more reviews
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
        <RequestToConnectModal caregiverName={`${cg.firstName} ${cg.lastInitial}.`} open={fullProfileConnectOpen} onClose={() => setFullProfileConnectOpen(false)} />
        <RequestToConnectModal caregiverName={`${cg.firstName} ${cg.lastInitial}.`} open={fullProfileCalendarConnectOpen} onClose={() => setFullProfileCalendarConnectOpen(false)} skipSchedule scheduleLabel={fullProfileCalendarLabel} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vanilla-50">
      {/* Hero — two-column layout */}
      <div className="bg-primary-50 relative overflow-x-clip">
        {/* Background depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/60 via-primary-50/30 to-vanilla-200/50" />
        <div className="absolute -left-16 top-1/2 -translate-y-1/2 w-[450px] h-[350px] rounded-full bg-primary-200/35 blur-3xl" />
        <div className="absolute left-1/3 -bottom-8 w-[300px] h-[200px] rounded-full bg-vanilla-300/25 blur-3xl" />

        <div className="max-w-[1600px] mx-auto px-8 relative">
          <div className="flex">
            {/* Left column — text, search, trust */}
            <div className="w-[58%] py-12 lg:py-16 relative z-10">
              <span className="inline-block bg-warning-100 text-warning-700 text-text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide mb-3">New in Houston</span>
              <h1 className="font-display text-display-lg lg:text-display-xl text-gray-900 font-normal leading-tight">
                Compassionate care,<br />half the cost.
              </h1>
              <p className="text-text-md lg:text-text-lg text-gray-500 mt-2 max-w-lg">
                Verified medical students providing in-home care you can trust.
              </p>
              <div className="mt-5 max-w-xl">
                <SearchBar selectedTypes={selectedCareTypes} setSelectedTypes={setSelectedCareTypes} priceMin={priceMin} setPriceMin={setPriceMin} priceMax={priceMax} setPriceMax={setPriceMax} caregivers={CAREGIVERS} onSearch={handleSearch} />
              </div>
              <div className="flex items-center gap-4 mt-5">
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Partnered with</span>
                <div className="flex items-center gap-3">
                  <img src="/images/universities/uh.png" alt="UH" className="h-5 object-contain opacity-60" />
                  <img src="/images/universities/tamu.png" alt="TAMU" className="h-5 object-contain opacity-60" />
                  <img src="/images/universities/pvamu.png" alt="PVAMU" className="h-5 object-contain opacity-60" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — hero photo, positioned absolutely to fill right side */}
        <div className="hidden lg:block absolute top-0 bottom-0 right-0 w-[42%]">
          <img
            src="/images/care-shifts-banner.jpg"
            alt="Caregiver with senior"
            className="w-full h-full object-cover object-[center_25%]"
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-primary-50 to-transparent" />
        </div>
      </div>

      {/* Two-pane Airbnb layout: 2-col cards | profile panel */}
      <div className="max-w-[1600px] mx-auto px-8 py-6 relative z-0">
        <div className="flex gap-8">
          {/* Left — 2-column card grid, flows with page */}
          <div className="w-[58%] flex-shrink-0 relative z-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-text-sm text-gray-500">
                Showing {filteredCaregivers.length === 0 ? "0" : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, filteredCaregivers.length)}`} of {filteredCaregivers.length} students{(activeCareTypes.length > 0 || !isDefaultPrice) && <button onClick={() => { setActiveCareTypes([]); setSelectedCareTypes([]); setPriceMin(15); setPriceMax(50); setCurrentPage(1); }} className="ml-2 text-primary-600 hover:text-primary-700 font-medium underline">Clear filters</button>}
              </p>
            </div>
            {filteredCaregivers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <h3 className="text-text-lg font-semibold text-gray-900 mb-1">No caregivers found</h3>
                <p className="text-text-sm text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => { setActiveCareTypes([]); setSelectedCareTypes([]); setPriceMin(15); setPriceMax(50); setCurrentPage(1); }}
                  className="text-text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5">
                {paginated.map((cg, i) => (
                  <CaregiverCard
                    key={cg.id}
                    cg={cg}
                    selected={cg.id === selectedId}
                    onClick={() => setSelectedId(cg.id)}
                    isTopPick={currentPage === 1 && i === 0}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8 pb-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => { setCurrentPage(page); const first = filteredCaregivers[(page - 1) * ITEMS_PER_PAGE]; if (first) setSelectedId(first.id); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-full text-text-sm font-medium transition-colors ${
                    page === currentPage
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right — profile panel, clips with "see more" gradient that expands inline */}
          <div className={`flex-1 min-w-0 relative z-0 ${profileExpanded ? "" : "sticky top-6"}`}>
            <div
              className={`bg-gray-100 rounded-2xl border border-gray-200 relative transition-all duration-300 ${
                profileExpanded ? "" : "max-h-[calc(100vh-120px)] overflow-hidden"
              }`}
              style={{ boxShadow: "0 25px 65px -12px rgba(16, 24, 40, 0.22), 0 12px 25px -8px rgba(16, 24, 40, 0.12), 0 4px 8px -2px rgba(16, 24, 40, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 3px rgba(0, 0, 0, 0.04)" }}
            >
              <div className="bg-warning-50 text-warning-700 text-text-xs font-semibold uppercase tracking-wider px-8 py-3.5 rounded-t-2xl border-b border-warning-200 flex items-center justify-between">
                Caregiver Profile
                <div className="flex items-center gap-2">
                  <a
                    href={`/care-shifts?profile=${selected.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 text-text-xs font-semibold normal-case tracking-normal transition-colors"
                  >
                    Open Profile &rarr;
                  </a>
                  <SaveToListButton position="relative" />
                </div>
              </div>
              <div className="p-8">
                <CaregiverProfile cg={selected} />
              </div>
              {/* Gradient fade with "see more" — only when collapsed */}
              {!profileExpanded && (
                <div
                  className="absolute bottom-0 left-0 right-0 z-10 cursor-pointer"
                  style={{ borderRadius: "0 0 16px 16px" }}
                  onClick={() => setProfileExpanded(true)}
                >
                  <div className="bg-gradient-to-t from-gray-100 via-gray-100/80 to-transparent pt-20 pb-6 flex flex-col items-center gap-1" style={{ borderRadius: "0 0 16px 16px" }}>
                    <span className="text-text-sm font-semibold text-primary-600">See more</span>
                    <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trust Pillars Footer */}
      <div className="bg-primary-50/60 border-t border-primary-100">
        <div className="max-w-[1600px] mx-auto px-8 py-10">
          <p className="text-center text-text-sm font-medium text-primary-600 tracking-wide uppercase mb-2">Why families choose Care Shifts</p>
          <h2 className="text-center font-display text-display-sm text-gray-900 mb-6">Quality care you can trust</h2>
          <div className="grid grid-cols-3 gap-6">
            <a href="/pricing" className="group flex flex-col items-center bg-white rounded-2xl px-6 py-6 shadow-sm border border-primary-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-display text-display-xs text-primary-800">$15/hr</h3>
              <p className="text-text-sm text-gray-600 mt-1 text-center">Half the cost of traditional agencies</p>
              <span className="text-text-xs font-semibold text-primary-500 mt-3 group-hover:text-primary-700 transition-colors">Learn more &rarr;</span>
            </a>
            <a href="/partner-schools" className="group flex flex-col items-center bg-white rounded-2xl px-6 py-6 shadow-sm border border-primary-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15v-3.75m0 0h10.5" />
                </svg>
              </div>
              <h3 className="font-display text-display-xs text-primary-800">10+ Schools</h3>
              <p className="text-text-sm text-gray-600 mt-1 text-center">Texas nursing & medical programs</p>
              <span className="text-text-xs font-semibold text-primary-500 mt-3 group-hover:text-primary-700 transition-colors">Learn more &rarr;</span>
            </a>
            <a href="/trust-and-safety" className="group flex flex-col items-center bg-white rounded-2xl px-6 py-6 shadow-sm border border-primary-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="font-display text-display-xs text-primary-800">100% Vetted</h3>
              <p className="text-text-sm text-gray-600 mt-1 text-center">Background-checked & CPR-trained</p>
              <span className="text-text-xs font-semibold text-primary-500 mt-3 group-hover:text-primary-700 transition-colors">Learn more &rarr;</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function CareShiftsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <CareShiftsPageInner />
    </Suspense>
  );
}
