/**
 * Seed the local offices that four real threads needed and the table did not have.
 *
 * Every number here was verified against the administering agency's own page
 * while answering an actual care seeker between 31 August and 2 September 2026.
 * They are seeded rather than left to a bulk import because each one is a
 * referral we got wrong once already, and a wrong referral costs a family a
 * phone call they can barely afford to make.
 *
 * Run:  npx tsx scripts/local-providers/seed.ts [--dry]
 */
require("dotenv").config({ path: process.env.HOME + "/Desktop/olera-web/.env.local" });
import { createClient } from "@supabase/supabase-js";

type Row = {
  name: string;
  state_code: string;
  agency_type: string;
  counties_served: string[];
  programs_served: string[] | null;
  phone: string;
  city: string | null;
  website: string | null;
  what_to_say: string | null;
};

const ROWS: Row[] = [
  {
    name: "Cobb County Senior Services",
    state_code: "GA",
    agency_type: "county_senior_services",
    counties_served: ["Cobb"],
    programs_served: ["home-delivered-meals"],
    phone: "(770) 528-5364",
    city: "Marietta",
    website: "https://www.cobbcounty.gov/senior-services/services-resources/nutrition-services",
    what_to_say:
      "I'd like to ask about home-delivered meals. They look for age 60+, living in Cobb County, and a physical or mental condition that makes preparing meals daily too hard. Cost is income-based and no one is denied for inability to pay.",
  },
  {
    name: "Georgia Division of Aging Services / ADRC",
    state_code: "GA",
    agency_type: "information_referral",
    counties_served: [],
    programs_served: null,
    phone: "1-866-552-4464",
    city: "Atlanta",
    website: "https://aging.georgia.gov/programs-and-services/adrc",
    what_to_say: "Ask them to route you to the aging office for your county. They serve all 159.",
  },
  {
    name: "Central Florida Community Action Agency",
    state_code: "FL",
    agency_type: "community_action",
    counties_served: ["Marion", "Levy", "Citrus"],
    programs_served: ["liheap", "weatherization"],
    phone: "(352) 732-3008",
    city: "Ocala",
    website: null,
    what_to_say: "Ask about LIHEAP crisis assistance and Weatherization for your county.",
  },
  {
    name: "Marion County Community Services — Housing",
    state_code: "FL",
    agency_type: "county_housing",
    counties_served: ["Marion"],
    programs_served: ["home-repair", "homeowner-rehabilitation"],
    phone: "(352) 671-8781",
    city: "Ocala",
    website:
      "https://www.marionfl.org/agencies-departments/departments-facilities-offices/community-services/housing",
    what_to_say:
      "Ask whether homeowner rehabilitation is taking applications, whether it covers HVAC, and whether it requires owning the home. Assistance is a no-interest loan forgiven after 15 years, not a grant.",
  },
  {
    name: "Florida Elder Helpline / ADRC",
    state_code: "FL",
    agency_type: "information_referral",
    counties_served: [],
    programs_served: null,
    phone: "1-800-963-5337",
    city: "Tallahassee",
    website: "https://elderaffairs.org/about-us/elder-helpline-1-800-963-5337/",
    what_to_say: "Ask for the aging office in your county. They also help with benefits applications.",
  },
  {
    name: "Washoe County Senior Services",
    state_code: "NV",
    agency_type: "county_senior_services",
    counties_served: ["Washoe"],
    programs_served: ["home-delivered-meals"],
    phone: "(775) 328-2575",
    city: "Reno",
    website:
      "https://www.washoecounty.gov/seniorsrv/programs_and_services/nutrition/home_delivered_meals.php",
    what_to_say:
      "Ask about home-delivered meals. They serve people 60 and older who are homebound and cannot get to a meal site, and confirm it with a home visit.",
  },
  {
    name: "Nevada 2-1-1",
    state_code: "NV",
    agency_type: "information_referral",
    counties_served: [],
    programs_served: null,
    phone: "2-1-1",
    city: null,
    website: "https://www.nevada211.org/home-delivered-meals/",
    what_to_say:
      "Ask for home-delivered meals in your county. Nevada administers them locally, so the provider depends on where you live.",
  },
];

(async () => {
  const dry = process.argv.includes("--dry");
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  for (const row of ROWS) {
    // Match on name + state rather than a generated key: these are re-runnable
    // corrections to a table a human also edits, and clobbering by id would
    // silently discard anything added by hand since.
    const { data: existing } = await db
      .from("sbf_area_agencies")
      .select("id")
      .eq("state_code", row.state_code)
      .eq("name", row.name)
      .maybeSingle();

    if (dry) {
      console.log(`${existing ? "update" : "insert"}  ${row.state_code}  ${row.name}`);
      continue;
    }
    const { error } = existing
      ? await db.from("sbf_area_agencies").update({ ...row, is_active: true }).eq("id", existing.id)
      : await db.from("sbf_area_agencies").insert({ ...row, is_active: true });
    console.log(
      error
        ? `FAILED  ${row.name}: ${error.message}`
        : `${existing ? "updated" : "inserted"}  ${row.state_code}  ${row.name}`,
    );
  }
})();
