/**
 * Curated preset universities for the Add Campus dropdown.
 *
 * Powers the dropdown on the Research tab's Add Campus inline form.
 * Selecting a preset auto-fills name + city + state + slug. The form
 * also offers an "Other (type manually)" option so admins can add a
 * university not on this list.
 *
 * Slugs follow the existing convention (lowercase, dash-separated,
 * matches /^[a-z0-9-]+$/) so the campuses POST endpoint accepts them
 * without modification.
 *
 * Texas-heavy by design — that's the current focus market. Add more
 * states / universities as the program expands.
 */

export interface PresetUniversity {
  name: string;
  slug: string;
  city: string;
  state: string;
}

export const PRESET_UNIVERSITIES: PresetUniversity[] = [
  // ── Texas (focus market) ────────────────────────────────────────────
  { name: "The University of Texas at Austin",       slug: "ut-austin",            city: "Austin",          state: "TX" },
  { name: "Texas A&M University",                    slug: "texas-am",             city: "College Station", state: "TX" },
  { name: "University of Houston",                   slug: "university-of-houston", city: "Houston",         state: "TX" },
  { name: "Rice University",                         slug: "rice-university",      city: "Houston",         state: "TX" },
  { name: "Baylor University",                       slug: "baylor-university",    city: "Waco",            state: "TX" },
  { name: "Texas Christian University",              slug: "tcu",                  city: "Fort Worth",      state: "TX" },
  { name: "Southern Methodist University",           slug: "smu",                  city: "Dallas",          state: "TX" },
  { name: "The University of Texas at San Antonio",  slug: "utsa",                 city: "San Antonio",     state: "TX" },
  { name: "Texas State University",                  slug: "texas-state",          city: "San Marcos",      state: "TX" },
  { name: "University of North Texas",               slug: "unt",                  city: "Denton",          state: "TX" },
  { name: "The University of Texas at Dallas",       slug: "ut-dallas",            city: "Richardson",      state: "TX" },
  { name: "Texas Tech University",                   slug: "texas-tech",           city: "Lubbock",         state: "TX" },
  { name: "The University of Texas at Arlington",    slug: "ut-arlington",         city: "Arlington",       state: "TX" },
  { name: "The University of Texas at El Paso",      slug: "utep",                 city: "El Paso",         state: "TX" },
  { name: "Texas Woman's University",                slug: "twu",                  city: "Denton",          state: "TX" },
  { name: "Texas Southern University",               slug: "texas-southern",       city: "Houston",         state: "TX" },
  { name: "Trinity University",                      slug: "trinity-university",   city: "San Antonio",     state: "TX" },
  { name: "Sam Houston State University",            slug: "shsu",                 city: "Huntsville",      state: "TX" },
  { name: "Stephen F. Austin State University",      slug: "sfasu",                city: "Nacogdoches",     state: "TX" },

  // ── Other major US universities (top pre-health programs) ───────────
  { name: "University of California, Los Angeles",   slug: "ucla",                 city: "Los Angeles",     state: "CA" },
  { name: "Stanford University",                     slug: "stanford",             city: "Stanford",        state: "CA" },
  { name: "University of California, Berkeley",      slug: "uc-berkeley",          city: "Berkeley",        state: "CA" },
  { name: "Harvard University",                      slug: "harvard",              city: "Cambridge",       state: "MA" },
  { name: "Massachusetts Institute of Technology",   slug: "mit",                  city: "Cambridge",       state: "MA" },
  { name: "Yale University",                         slug: "yale",                 city: "New Haven",       state: "CT" },
  { name: "Princeton University",                    slug: "princeton",            city: "Princeton",       state: "NJ" },
  { name: "Columbia University",                     slug: "columbia",             city: "New York",        state: "NY" },
  { name: "Cornell University",                      slug: "cornell",              city: "Ithaca",          state: "NY" },
  { name: "New York University",                     slug: "nyu",                  city: "New York",        state: "NY" },
  { name: "Johns Hopkins University",                slug: "johns-hopkins",        city: "Baltimore",       state: "MD" },
  { name: "Duke University",                         slug: "duke",                 city: "Durham",          state: "NC" },
  { name: "University of Pennsylvania",              slug: "upenn",                city: "Philadelphia",    state: "PA" },
  { name: "Northwestern University",                 slug: "northwestern",         city: "Evanston",        state: "IL" },
  { name: "University of Michigan",                  slug: "umich",                city: "Ann Arbor",       state: "MI" },
  { name: "Emory University",                        slug: "emory",                city: "Atlanta",         state: "GA" },
  { name: "Vanderbilt University",                   slug: "vanderbilt",           city: "Nashville",       state: "TN" },
  { name: "University of North Carolina at Chapel Hill", slug: "unc-chapel-hill",  city: "Chapel Hill",     state: "NC" },
  { name: "University of Virginia",                  slug: "uva",                  city: "Charlottesville", state: "VA" },
  { name: "Georgia Institute of Technology",         slug: "georgia-tech",         city: "Atlanta",         state: "GA" },
  { name: "University of Florida",                   slug: "florida",              city: "Gainesville",     state: "FL" },
  { name: "Boston University",                       slug: "boston-university",    city: "Boston",          state: "MA" },
  { name: "Brown University",                        slug: "brown",                city: "Providence",      state: "RI" },
  { name: "Dartmouth College",                       slug: "dartmouth",            city: "Hanover",         state: "NH" },
  { name: "University of Chicago",                   slug: "uchicago",             city: "Chicago",         state: "IL" },
  { name: "University of Wisconsin-Madison",         slug: "uw-madison",           city: "Madison",         state: "WI" },
  { name: "University of Washington",                slug: "uw-seattle",           city: "Seattle",         state: "WA" },
  { name: "University of Southern California",       slug: "usc",                  city: "Los Angeles",     state: "CA" },
];
