import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/dev/seed-demo-students
 *
 * DEV-ONLY: Seeds 4 demo student candidate profiles for MedJobs staffing demos.
 * Archetypes: In-Semester, Gap Year, Break Full-Timer, Evenings & Weekends.
 *
 * Uses service role to bypass RLS. Idempotent — skips if slug already exists.
 */

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// ── Schedule grid helper ──
// Grid format: flat JSON { "Mon-8am": true, "Tue-12pm": true, ... }
// Days: Mon, Tue, Wed, Thu, Fri
// Slots: 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm
// true = IN CLASS (busy), absent/false = free (available)
function makeScheduleGrid(busySlots: Record<string, string[]>): string {
  const grid: Record<string, boolean> = {};
  for (const [day, slots] of Object.entries(busySlots)) {
    for (const slot of slots) {
      grid[`${day}-${slot}`] = true;
    }
  }
  return JSON.stringify(grid);
}

const DEMO_STUDENTS = [
  // ════════════════════════════════════════════════════════════
  // 1. MAYA CHEN — In-Semester Pre-Health Student
  // ════════════════════════════════════════════════════════════
  {
    slug: "maya-chen-demo",
    type: "student" as const,
    display_name: "Maya Chen",
    image_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face",
    email: "maya.chen@demo.olera.com",
    phone: "(512) 555-0101",
    city: "Austin",
    state: "TX",
    zip: "78705",
    lat: 30.2849,
    lng: -97.7341,
    source: "seeded" as const,
    is_active: true,
    metadata: {
      university: "University of Texas at Austin",
      campus: "Main Campus",
      major: "Biology (Pre-Med)",
      graduation_year: 2027,
      gpa: 3.7,
      intended_professional_school: "medicine",
      program_track: "pre_med",
      seeking_status: "actively_looking",

      certifications: ["CPR/First Aid", "BLS"],
      years_caregiving: 1,
      care_experience_types: ["Companion Care", "Mobility Assistance"],
      languages: ["English", "Mandarin"],

      availability_types: ["in_between_classes", "evenings", "weekends"],
      hours_per_week_range: "10-15",
      duration_commitment: "multiple_semesters",
      transportation: true,
      max_commute_miles: 15,

      year_round_availability: {
        spring: { status: "available", year: 2026, notes: "10-15 hrs/wk around classes" },
        summer: { status: "full_time", year: 2026, notes: "Full-time May–August" },
        fall: { status: "available", year: 2026, notes: "10-15 hrs/wk around classes" },
        winter: { status: "full_time", year: 2026, notes: "Full-time Dec–Jan" },
      },

      course_schedule_semester: "Fall 2026",
      // MWF: classes 8am-2pm; T/Th: classes 12-4pm; free evenings + weekends
      course_schedule_grid: makeScheduleGrid({
        Mon: ["8am", "10am", "12pm"],
        Tue: ["12pm", "2pm"],
        Wed: ["8am", "10am", "12pm"],
        Thu: ["12pm", "2pm"],
        Fri: ["8am", "10am", "12pm"],
      }),

      commitment_statement:
        "I've been balancing academics and part-time work since freshman year. I plan my schedule a semester in advance and always give at least two weeks notice for any conflicts. I take my commitments to clients as seriously as I take my coursework.",
      availability_notes:
        "Finals weeks (Dec & May) I may need to reduce to weekends only. I communicate this well in advance.",

      why_caregiving:
        "I'm applying to medical school and want hands-on patient interaction beyond the clinical setting. Caregiving teaches me empathy, patience, and what it means to support someone in their daily life — skills I can't learn from a textbook. My grandmother's experience with home care in Shanghai also shaped my commitment to dignified elder care.",

      video_intro_url: "https://www.youtube.com/watch?v=rA1BI1dcXA4",
      linkedin_url: "https://www.linkedin.com/in/logan-dubose",
      resume_url: "demo/blank-student-resume.pdf",

      drivers_license_url: "demo/maya-chen-dl.pdf",
      drivers_license_uploaded_at: "2026-04-01T12:00:00Z",
      drivers_license_expiration: "2028-06-15",
      car_insurance_url: "demo/maya-chen-ins.pdf",
      car_insurance_uploaded_at: "2026-04-01T12:00:00Z",
      car_insurance_expiration: "2027-01-15",

      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: true,
      acknowledgments_completed: true,
      acknowledgment_date: "2026-04-01",

      scenario_responses: [
        {
          question: "A client with early-stage dementia keeps asking you the same question. How do you respond?",
          answer:
            "I answer patiently each time as if it's the first time they asked. I understand this is part of the condition and not something they can control. I might also gently redirect with an activity or conversation topic they enjoy to help ease any anxiety they're feeling.",
        },
        {
          question: "You arrive at a shift and the client seems unusually confused or unwell. What do you do?",
          answer:
            "I stay calm and assess the situation — check for any obvious changes, ask how they're feeling, and compare to their normal baseline. If anything seems medically concerning, I contact the family or agency immediately. I document everything I observe.",
        },
        {
          question: "A client's family member asks you to do something outside your care plan. How do you handle it?",
          answer:
            "I politely let them know what's in my care plan and suggest they contact the agency to discuss adding the task. I want to be helpful, but I also need to stay within my scope to protect the client and myself.",
        },
      ],

      application_completed: true,
      profile_completeness: 95,
    },
  },

  // ════════════════════════════════════════════════════════════
  // 2. ETHAN RIVERA — Gap Year Pre-PA Student
  // ════════════════════════════════════════════════════════════
  {
    slug: "ethan-rivera-demo",
    type: "student" as const,
    display_name: "Ethan Rivera",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    email: "ethan.rivera@demo.olera.com",
    phone: "(210) 555-0202",
    city: "San Antonio",
    state: "TX",
    zip: "78212",
    lat: 29.4614,
    lng: -98.4861,
    source: "seeded" as const,
    is_active: true,
    metadata: {
      university: "Trinity University",
      campus: "Main Campus",
      major: "Health Sciences",
      graduation_year: 2026,
      gpa: 3.5,
      intended_professional_school: "pa",
      program_track: "pre_pa",
      seeking_status: "actively_looking",

      certifications: ["CNA", "CPR/First Aid", "BLS"],
      years_caregiving: 2,
      care_experience_types: [
        "Post-Surgical Recovery",
        "Medication Reminders",
        "Mobility Assistance",
        "Vital Signs Monitoring",
      ],
      languages: ["English", "Spanish"],

      availability_types: ["in_between_classes", "evenings", "weekends", "overnights"],
      hours_per_week_range: "20+",
      duration_commitment: "1_plus_year",
      transportation: true,
      max_commute_miles: 25,

      year_round_availability: {
        spring: { status: "full_time", year: 2026, notes: "Gap year — fully available" },
        summer: { status: "full_time", year: 2026, notes: "Gap year — fully available" },
        fall: { status: "full_time", year: 2026, notes: "Gap year — fully available" },
        winter: { status: "full_time", year: 2026, notes: "Gap year — fully available" },
      },

      // No course schedule — gap year, no classes
      course_schedule_semester: "Gap Year 2026–2027",

      commitment_statement:
        "I graduated in May and am dedicating this full year to building direct patient care hours for my PA school application. Caregiving is my primary focus — I have no competing academic schedule and can take consistent, reliable shifts including overnights and holidays.",
      availability_notes:
        "Fully available year-round. PA school applications are due in the spring, but that won't affect my schedule at all.",

      why_caregiving:
        "After two years as a CNA in a rehab facility, I know that the best healthcare providers are the ones who've spent real time with patients outside of a clinical setting. During my gap year, I want to deepen that experience — especially with elderly clients who need continuity and trust. This directly supports my goal of becoming a PA specializing in geriatrics.",

      video_intro_url: "https://www.youtube.com/watch?v=EqMdetnpZFQ",
      linkedin_url: "https://www.linkedin.com/in/logan-dubose",
      resume_url: "demo/blank-student-resume.pdf",

      drivers_license_url: "demo/ethan-rivera-dl.pdf",
      drivers_license_uploaded_at: "2026-03-15T12:00:00Z",
      drivers_license_expiration: "2029-03-20",
      car_insurance_url: "demo/ethan-rivera-ins.pdf",
      car_insurance_uploaded_at: "2026-03-15T12:00:00Z",
      car_insurance_expiration: "2027-02-28",

      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: false,
      acknowledgments_completed: true,
      acknowledgment_date: "2026-03-15",

      scenario_responses: [
        {
          question: "A client with early-stage dementia keeps asking you the same question. How do you respond?",
          answer:
            "I answer calmly every time. When I worked as a CNA, I learned that the emotion behind the question matters more than the question itself — they may be feeling anxious or disoriented. I try to provide reassurance through my tone and presence, and redirect to a familiar activity if it helps.",
        },
        {
          question: "You arrive at a shift and the client seems unusually confused or unwell. What do you do?",
          answer:
            "I run through a quick assessment — are they responsive, is their speech normal, any signs of pain or distress? I check vitals if I have access. Then I call the family and the agency. From my CNA training, I know not to wait and see — early communication can prevent an emergency.",
        },
        {
          question: "A client's family member asks you to do something outside your care plan. How do you handle it?",
          answer:
            "I've been in this situation before. I'm honest and professional — I explain that I want to help but need to stay within the care plan. I offer to contact the supervisor so we can get it added properly. Families usually appreciate the transparency.",
        },
      ],

      application_completed: true,
      profile_completeness: 98,
    },
  },

  // ════════════════════════════════════════════════════════════
  // 3. PRIYA PATEL — Winter/Summer Break Full-Timer
  // ════════════════════════════════════════════════════════════
  {
    slug: "priya-patel-demo",
    type: "student" as const,
    display_name: "Priya Patel",
    image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face",
    email: "priya.patel@demo.olera.com",
    phone: "(713) 555-0303",
    city: "Houston",
    state: "TX",
    zip: "77005",
    lat: 29.7174,
    lng: -95.4018,
    source: "seeded" as const,
    is_active: true,
    metadata: {
      university: "Rice University",
      campus: "Main Campus",
      major: "Biochemistry & Cell Biology",
      graduation_year: 2028,
      gpa: 3.8,
      intended_professional_school: "medicine",
      program_track: "pre_med",
      seeking_status: "actively_looking",

      certifications: ["CPR/First Aid"],
      years_caregiving: 0,
      care_experience_types: ["Companion Care"],
      languages: ["English", "Hindi", "Gujarati"],

      availability_types: ["evenings", "weekends"],
      hours_per_week_range: "5-10",
      duration_commitment: "multiple_semesters",
      transportation: true,
      max_commute_miles: 20,

      year_round_availability: {
        spring: { status: "limited", year: 2026, notes: "1-2 evening shifts + weekends only" },
        summer: { status: "full_time", year: 2026, notes: "May 15 – Aug 20, 30-40 hrs/wk" },
        fall: { status: "limited", year: 2026, notes: "1-2 evening shifts + weekends only" },
        winter: { status: "full_time", year: 2026, notes: "Dec 15 – Jan 12, full-time" },
      },

      course_schedule_semester: "Fall 2026",
      // Packed weekdays 8am-4pm; only free evenings + weekends
      course_schedule_grid: makeScheduleGrid({
        Mon: ["8am", "10am", "12pm", "2pm"],
        Tue: ["8am", "10am", "12pm", "2pm"],
        Wed: ["8am", "10am", "12pm", "2pm"],
        Thu: ["8am", "10am", "12pm", "2pm"],
        Fri: ["8am", "10am", "12pm", "2pm"],
      }),

      commitment_statement:
        "During breaks I can commit to full-time hours and be your most reliable worker. During the semester I'm limited but I will always show up for the shifts I commit to. I'm upfront about my schedule — I'd rather under-promise and over-deliver.",
      availability_notes:
        "Summer break: May 15 – Aug 20 (full-time, 30-40 hrs/wk). Winter break: Dec 15 – Jan 12 (full-time). During semesters I can do 1-2 evening shifts + weekends.",

      why_caregiving:
        "I grew up helping my grandmother manage her diabetes and daily routine after she moved in with our family. That experience taught me that healthcare isn't just about the clinic — it's about the person. I want to build more of those connections while I prepare for medical school, and I want to serve seniors the way my family served my Nani.",

      video_intro_url: "https://www.youtube.com/watch?v=8sD0g071L9Q",
      linkedin_url: "https://www.linkedin.com/in/logan-dubose",
      resume_url: "demo/blank-student-resume.pdf",

      drivers_license_url: "demo/priya-patel-dl.pdf",
      drivers_license_uploaded_at: "2026-04-05T12:00:00Z",
      drivers_license_expiration: "2029-09-10",
      car_insurance_url: "demo/priya-patel-ins.pdf",
      car_insurance_uploaded_at: "2026-04-05T12:00:00Z",
      car_insurance_expiration: "2027-04-01",

      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: true,
      acknowledgments_completed: true,
      acknowledgment_date: "2026-04-05",

      scenario_responses: [
        {
          question: "A client with early-stage dementia keeps asking you the same question. How do you respond?",
          answer:
            "I'd answer each time with the same warmth. My grandmother sometimes repeated herself, and I learned that correcting or showing frustration only makes things worse. I try to match their energy — if they seem worried, I reassure. If they seem curious, I engage. It's about meeting them where they are.",
        },
        {
          question: "You arrive at a shift and the client seems unusually confused or unwell. What do you do?",
          answer:
            "I wouldn't try to diagnose anything — I'd note the specific changes I'm seeing (more confused than usual, slurred speech, not eating) and immediately contact the family and agency. I'd stay with the client, keep them comfortable, and document everything. Better to over-communicate than miss something.",
        },
        {
          question: "A client's family member asks you to do something outside your care plan. How do you handle it?",
          answer:
            "I'd thank them for trusting me and explain that I want to make sure I'm doing everything safely and within what's been agreed. I'd suggest they call the coordinator to update the plan. I've learned that clear boundaries actually build more trust.",
        },
      ],

      application_completed: true,
      profile_completeness: 90,
    },
  },

  // ════════════════════════════════════════════════════════════
  // 4. JORDAN BROOKS — Evenings & Weekends Nursing Student
  // ════════════════════════════════════════════════════════════
  {
    slug: "jordan-brooks-demo",
    type: "student" as const,
    display_name: "Jordan Brooks",
    image_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    email: "jordan.brooks@demo.olera.com",
    phone: "(817) 555-0404",
    city: "Fort Worth",
    state: "TX",
    zip: "76129",
    lat: 32.7096,
    lng: -97.3634,
    source: "seeded" as const,
    is_active: true,
    metadata: {
      university: "Texas Christian University",
      campus: "Main Campus",
      major: "Nursing (BSN)",
      graduation_year: 2027,
      gpa: 3.4,
      intended_professional_school: "nursing",
      program_track: "nursing",
      seeking_status: "actively_looking",

      certifications: ["CNA", "CPR/First Aid", "BLS", "Medication Aide"],
      years_caregiving: 3,
      care_experience_types: [
        "Dementia Care",
        "Post-Surgical Recovery",
        "Medication Reminders",
        "Mobility Assistance",
        "ADL Support",
      ],
      languages: ["English"],

      availability_types: ["evenings", "weekends", "overnights"],
      hours_per_week_range: "15-20",
      duration_commitment: "1_plus_year",
      transportation: true,
      max_commute_miles: 20,

      year_round_availability: {
        spring: { status: "available", year: 2026, notes: "Evenings after 5pm + all weekends" },
        summer: { status: "full_time", year: 2026, notes: "Full-time May–August" },
        fall: { status: "available", year: 2026, notes: "Evenings after 5pm + all weekends" },
        winter: { status: "full_time", year: 2026, notes: "Full-time Dec–Jan" },
      },

      course_schedule_semester: "Fall 2026",
      // Classes + clinicals M-F 8am-4pm; free every evening 5pm+ and weekends
      course_schedule_grid: makeScheduleGrid({
        Mon: ["8am", "10am", "12pm", "2pm"],
        Tue: ["8am", "10am", "12pm", "2pm"],
        Wed: ["8am", "10am", "12pm", "2pm"],
        Thu: ["8am", "10am", "12pm", "2pm"],
        Fri: ["8am", "10am", "12pm", "2pm"],
      }),

      commitment_statement:
        "I've worked evening and weekend shifts as a CNA for three years alongside nursing school. My schedule is predictable — classes and clinicals end by 4pm, and I'm available every evening after 5 and all weekend. I don't overcommit, and I don't cancel.",
      availability_notes:
        "Clinical rotations are M/W/F mornings. I never schedule anything that conflicts with my evening/weekend availability. Finals weeks I'm still available — I study in the mornings.",

      why_caregiving:
        "I'm already in nursing school, but working as a caregiver gives me something clinicals can't — real relationships with the people I serve. I've been a CNA since freshman year and I've seen firsthand how consistency and reliability transform a client's quality of life. I want to keep building those skills while I finish my BSN.",

      video_intro_url: "https://www.youtube.com/watch?v=sX_8FmdKUFM",
      linkedin_url: "https://www.linkedin.com/in/logan-dubose",
      resume_url: "demo/blank-student-resume.pdf",

      drivers_license_url: "demo/jordan-brooks-dl.pdf",
      drivers_license_uploaded_at: "2026-03-20T12:00:00Z",
      drivers_license_expiration: "2028-11-30",
      car_insurance_url: "demo/jordan-brooks-ins.pdf",
      car_insurance_uploaded_at: "2026-03-20T12:00:00Z",
      car_insurance_expiration: "2027-05-15",

      ncns_pledge: true,
      school_balance_pledge: true,
      advance_notice_pledge: true,
      prn_willing: false,
      acknowledgments_completed: true,
      acknowledgment_date: "2026-03-20",

      scenario_responses: [
        {
          question: "A client with early-stage dementia keeps asking you the same question. How do you respond?",
          answer:
            "I've worked with dementia clients for two years. I answer every time like it's the first time, because to them it is. I keep my voice steady and warm. If they're stuck in a loop that's causing them distress, I'll gently introduce an activity — looking at photos, folding towels, taking a short walk — to break the cycle naturally.",
        },
        {
          question: "You arrive at a shift and the client seems unusually confused or unwell. What do you do?",
          answer:
            "I check vitals if the equipment is available, do a quick neuro check (are they oriented, can they follow commands), and look for any physical signs — pallor, sweating, asymmetry. Then I call the agency and family immediately. I document time of onset, symptoms, and what I've observed. In nursing school we learn: when in doubt, escalate.",
        },
        {
          question: "A client's family member asks you to do something outside your care plan. How do you handle it?",
          answer:
            "I explain what I can and can't do under the current care plan, and I help them get in touch with the coordinator. If it's something small and safe — like grabbing the mail — I'll use judgment. But anything clinical or liability-related, I stick to the plan. Scope of practice matters.",
        },
      ],

      application_completed: true,
      profile_completeness: 97,
    },
  },
];

/**
 * GET /api/dev/seed-demo-students
 *
 * Open this URL in your browser. It does everything:
 * 1. Deletes any old non-demo student profiles (source != 'seeded')
 * 2. Deletes the 4 demo profiles if they already exist (clean slate)
 * 3. Creates all 4 fresh demo profiles
 *
 * Add ?cleanup_old=true to also remove old student accounts that aren't these demos.
 */
export async function GET(request: NextRequest) {
  return seedDemoStudents(request);
}

export async function POST(request: NextRequest) {
  return seedDemoStudents(request);
}

async function seedDemoStudents(request: NextRequest) {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cleanupOld = searchParams.get("cleanup_old") === "true";

    // ── Step 1: Clean up old non-demo student profiles ──
    let oldDeleted: string[] = [];
    if (cleanupOld) {
      const demoSlugs = DEMO_STUDENTS.map((s) => s.slug);
      const { data: oldStudents } = await admin
        .from("business_profiles")
        .select("id, slug, display_name")
        .eq("type", "student")
        .not("slug", "in", `(${demoSlugs.join(",")})`);

      if (oldStudents && oldStudents.length > 0) {
        const oldIds = oldStudents.map((s: { id: string }) => s.id);
        await admin.from("business_profiles").delete().in("id", oldIds);
        oldDeleted = oldStudents.map((s: { display_name: string }) => s.display_name);
      }
    }

    // ── Step 2: Delete existing demos for clean re-seed ──
    const demoSlugs = DEMO_STUDENTS.map((s) => s.slug);
    await admin.from("business_profiles").delete().in("slug", demoSlugs);

    // ── Step 3: Create all 4 fresh demo profiles ──
    const results: { slug: string; id: string; name: string }[] = [];
    const errors: { slug: string; error: string }[] = [];

    for (const student of DEMO_STUDENTS) {
      const profileId = crypto.randomUUID();

      const { error: insertError } = await admin
        .from("business_profiles")
        .insert({
          id: profileId,
          slug: student.slug,
          type: student.type,
          display_name: student.display_name,
          image_url: student.image_url,
          email: student.email,
          phone: student.phone,
          city: student.city,
          state: student.state,
          zip: student.zip,
          lat: student.lat,
          lng: student.lng,
          source: student.source,
          is_active: student.is_active,
          metadata: student.metadata,
        });

      if (insertError) {
        errors.push({ slug: student.slug, error: insertError.message });
        continue;
      }

      results.push({ slug: student.slug, id: profileId, name: student.display_name });
    }

    return NextResponse.json({
      status: "done",
      message: `Created ${results.length} demo students.${oldDeleted.length > 0 ? ` Removed ${oldDeleted.length} old student accounts.` : ""}`,
      created: results.map((r) => ({
        name: r.name,
        url: `/provider/medjobs/candidates/${r.slug}`,
      })),
      old_accounts_removed: oldDeleted,
      errors,
    });
  } catch (err) {
    console.error("Seed demo students error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dev/seed-demo-students
 *
 * Removes all 4 demo student profiles so you can re-seed cleanly.
 */
export async function DELETE() {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const slugs = DEMO_STUDENTS.map((s) => s.slug);

    const { data: deleted, error } = await admin
      .from("business_profiles")
      .delete()
      .in("slug", slugs)
      .select("id, slug");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "cleared",
      count: deleted?.length ?? 0,
      deleted: deleted?.map((d: { id: string; slug: string }) => d.slug) ?? [],
    });
  } catch (err) {
    console.error("Delete demo students error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
