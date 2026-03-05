// @ts-nocheck
/**
 * Generate the complete waiver-library.ts data file from Notion program data.
 * Run: npx tsx scripts/gen-waiver-data.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";

interface RawProgram {
  name: string;
  category: string;
  whatItDoes: string;
  whoQualifies: string;
  phone: string;
}

interface RawState {
  name: string;
  abbrev: string;
  id: string;
  description: string;
  programs: RawProgram[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function shortName(name: string): string {
  // Extract acronym from parentheses if present
  const match = name.match(/\(([A-Z][A-Z/\-\s&]{1,20})\)/);
  if (match) return match[1].trim();
  // Common known short names
  const lower = name.toLowerCase();
  if (lower.includes("medicaid") && lower.includes("aged")) return "ABD Medicaid";
  if (lower.includes("medicare savings")) return "Medicare Savings";
  if (lower.includes("snap") || lower.includes("food stamp") || lower.includes("food assistance") || lower.includes("foodshare") || lower.includes("calfresh") || lower.includes("basic food") || lower.includes("3squares") || lower.includes("food and nutrition")) return "SNAP/Food";
  if (lower.includes("home-delivered meal") || lower.includes("home delivered meal") || lower.includes("meals on wheels") || lower.includes("nutrition program")) return "Home Meals";
  if (lower.includes("liheap") || lower.includes("energy assistance") || lower.includes("heating assistance") || lower.includes("energy program")) return "Energy Assistance";
  if (lower.includes("ombudsman")) return "LTC Ombudsman";
  if (lower.includes("caregiver support") || lower.includes("caregiver resource")) return "Caregiver Support";
  if (lower.includes("legal service") || lower.includes("legal aid") || lower.includes("legal assistance") || lower.includes("legal hotline") || lower.includes("legal help")) return "Senior Legal Aid";
  if (lower.includes("property tax") || lower.includes("homestead")) return "Property Tax Relief";
  if (lower.includes("ssi supplement") || lower.includes("state ssi")) return "SSI Supplement";
  if (lower.includes("weatherization")) return "Weatherization";
  if (lower.includes("respite")) return "Respite Care";
  // Otherwise truncate cleanly at word boundary
  if (name.length <= 30) return name;
  return name.slice(0, 30).replace(/\s+\S*$/, "");
}

function savingsRange(category: string, name: string): string {
  const lower = (category + " " + name).toLowerCase();
  if (lower.includes("pace")) return "$15,000 – $35,000/year";
  if (lower.includes("waiver") || lower.includes("hcbs") || lower.includes("ltss") || lower.includes("long-term")) return "$10,000 – $30,000/year";
  if (lower.includes("medicaid") && !lower.includes("savings")) return "$5,000 – $20,000/year";
  if (lower.includes("medicare savings") || lower.includes("qmb") || lower.includes("slmb")) return "$2,000 – $8,000/year";
  if (lower.includes("snap") || lower.includes("food") || lower.includes("nutrition") || lower.includes("meal")) return "$1,500 – $3,600/year";
  if (lower.includes("energy") || lower.includes("liheap") || lower.includes("heating") || lower.includes("weatherization")) return "$500 – $2,000/year";
  if (lower.includes("ssi") || lower.includes("cash")) return "$3,000 – $10,000/year";
  if (lower.includes("property tax") || lower.includes("homestead") || lower.includes("tax credit") || lower.includes("tax relief") || lower.includes("tax freeze")) return "$500 – $2,500/year";
  if (lower.includes("pharmaceutical") || lower.includes("prescription") || lower.includes("drug")) return "$1,000 – $5,000/year";
  if (lower.includes("caregiver") || lower.includes("respite")) return "$2,000 – $8,000/year";
  if (lower.includes("legal")) return "$500 – $3,000/year";
  if (lower.includes("ombudsman")) return "Free advocacy service";
  if (lower.includes("ship") || lower.includes("counseling") || lower.includes("insurance assistance") || lower.includes("hiicap") || lower.includes("shine")) return "Free counseling service";
  if (lower.includes("employment") || lower.includes("scsep")) return "$3,000 – $8,000/year";
  return "$1,000 – $5,000/year";
}

function parseEligibility(whoQualifies: string): string[] {
  const highlights: string[] = [];
  if (/age\s*(\d+)\+/i.test(whoQualifies)) {
    const age = whoQualifies.match(/age\s*(\d+)\+/i)![1];
    highlights.push(`Age ${age} or older`);
  }
  if (/income\s*<\s*\$([0-9,]+)/i.test(whoQualifies)) {
    const income = whoQualifies.match(/income\s*<\s*\$([0-9,]+)/i)![1];
    highlights.push(`Income below $${income}/month`);
  }
  if (/disability/i.test(whoQualifies)) {
    highlights.push("Must meet disability requirements");
  }
  if (/medicaid req/i.test(whoQualifies)) {
    highlights.push("Must be enrolled in Medicaid");
  }
  if (highlights.length === 0) {
    highlights.push("Contact program for eligibility details");
  }
  return highlights;
}

function genSteps(name: string, phone: string): string {
  const cleanPhone = phone && phone !== "-" ? phone : "your state agency";
  return JSON.stringify([
    { step: 1, title: "Contact the program", description: `Call ${cleanPhone} to learn about ${shortName(name)} eligibility and request an application.` },
    { step: 2, title: "Gather required documents", description: "Prepare proof of age, income, residency, and any disability documentation that may be required." },
    { step: 3, title: "Submit your application", description: "Complete and submit the application form. A caseworker will review your information and determine eligibility." },
  ]);
}

function escTS(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// ── All 50 states data from Notion ──────────────────────────────────────────

const states: RawState[] = [];

function addState(name: string, abbrev: string, id: string, description: string, programs: RawProgram[]) {
  states.push({ name, abbrev, id, description, programs });
}

function p(name: string, category: string, whatItDoes: string, whoQualifies: string, phone: string): RawProgram {
  return { name, category, whatItDoes, whoQualifies, phone };
}

// ── ALABAMA ─────────────────────────────────────────────────────────────────
addState("Alabama", "AL", "alabama",
  "Alabama's Medicaid programs provide home and community-based services to help seniors and adults with disabilities remain at home rather than entering a nursing facility.",
  [
    p("Alabama Medicaid for Aged/Disabled", "healthcare", "State Medicaid program providing health care coverage for seniors 65+ and disabled individuals, covering doctor visits, hospital stays, prescriptions, and long-term care services.", "Age 65+; Income <$987/mo", "1-800-361-4491"),
    p("Elderly and Disabled (E&D) Medicaid Waiver", "healthcare", "Home and community-based services waiver providing personal care, homemaker services, adult day health, respite care, and case management to help seniors stay at home.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-361-4491"),
    p("Home-Delivered Meals (E&D Waiver Component)", "food", "Home-delivered frozen meals provided through the Elderly and Disabled Medicaid Waiver to help homebound seniors maintain nutrition and independence.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-361-4491"),
  ]
);

// ── ALASKA ───────────────────────────────────────────────────────────────────
addState("Alaska", "AK", "alaska",
  "Alaska offers Medicaid waiver programs through the Division of Senior and Disabilities Services to help residents remain at home with the supports they need.",
  [
    p("Medicaid for Aged/Disabled", "healthcare", "Alaska's Medicaid program for seniors aged 65+ who are aged, blind, or disabled, providing comprehensive health coverage and long-term care services.", "Age 65+; Income <$3071/mo", "(800) 478-6065"),
    p("Alaskans Living Independently Waiver (ALI)", "healthcare", "Medicaid HCBS waiver providing home and community-based services to seniors 65+ including personal care, chore services, respite care, and care coordination.", "Age 65+; Income <$3071/mo; Medicaid req", "(800) 478-6065"),
    p("Medicare Savings Programs", "healthcare", "Alaska's Medicare Savings Programs help low-income Medicare beneficiaries pay for premiums, deductibles, and coinsurance costs.", "Age 65+; Income <$1500/mo; Medicaid req", "(800) 478-6065"),
    p("Alaska SNAP (Food Stamps)", "food", "Alaska's SNAP program provides monthly benefits via EBT card to help low-income seniors purchase nutritious food.", "Age 60+; Income <$2000/mo", "1-800-478-7778"),
    p("Alaska Senior Medicare Advisory Network", "healthcare", "Free, unbiased counseling on Medicare options, enrollment periods, and benefits for Alaska seniors.", "Age 65+", "1-866-468-0616"),
    p("Energy Assistance Program", "utilities", "Alaska's LIHEAP program helps low-income households, including seniors, pay heating and energy costs.", "Age 60+; Income <$2800/mo", "1-800-478-7326"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities, investigating complaints and ensuring quality of care.", "Age 65+", "1-800-678-7713"),
    p("Home-Delivered Meals (SeniorCare)", "food", "Provides nutritious meals delivered to homebound seniors through the SeniorCare program.", "Age 65+; Income <$2000/mo", "(800) 478-6065"),
    p("National Family Caregiver Support Program", "caregiver", "Supports family caregivers of seniors 60+ with services like respite care, caregiver training, counseling, and support groups.", "Age 60+; Income <$3000/mo", "1-800-478-6065"),
    p("Alaska Legal Services Corporation Senior Legal Hotline", "healthcare", "Provides free legal assistance to low-income seniors 60+ on issues like benefits, housing, and consumer protection.", "Age 60+; Income <$2500/mo", "1-888-478-2572"),
    p("Senior Property Tax Exemption", "housing", "Alaska municipalities may offer property tax relief or exemptions for seniors 65+ to reduce housing costs.", "Age 65+", ""),
  ]
);

// ── ARIZONA ──────────────────────────────────────────────────────────────────
addState("Arizona", "AZ", "arizona",
  "Arizona's Long-Term Care System (ALTCS) provides comprehensive Medicaid managed care for seniors and adults with disabilities who need nursing facility level of care.",
  [
    p("Aged, Blind, and Disabled (ABD) Medicaid", "healthcare", "Provides healthcare coverage and long-term care services to financially limited seniors aged 65+.", "Age 65+; Income <$1255/mo", "1-855-432-7587"),
    p("Arizona Long Term Care System (ALTCS)", "healthcare", "Medicaid HCBS waiver program providing long-term care services for elderly or disabled individuals at home.", "Age 65+; Income <$2901/mo; Medicaid req", "1-888-621-6880"),
    p("Medicare Savings Programs (QMB/SLMB/QI)", "healthcare", "State-administered programs that help low-income Medicare beneficiaries pay for premiums and costs.", "Age 65+; Income <$1600/mo", "1-855-432-7587"),
    p("Nutrition Assistance Program", "food", "Arizona's SNAP program providing food assistance benefits via EBT card to low-income seniors.", "Age 65+; Income <$2070/mo", "1-800-352-3878"),
    p("Arizona Senior Health Insurance Assistance Program (SHIP)", "healthcare", "Free counseling service helping Medicare beneficiaries understand and choose health plans.", "Age 65+", "1-800-432-4040"),
    p("Low Income Home Energy Assistance Program (LIHEAP)", "utilities", "Provides financial assistance to low-income households, including seniors, to help with energy bills.", "Age 60+; Income <$2950/mo", "1-877-622-6800"),
    p("Senior Property Valuation Protection Option", "housing", "Allows eligible seniors 65+ to lock in their property's Limited Property Value for tax purposes.", "Age 65+", "1-602-716-6975"),
    p("Arizona Long Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes.", "Age 65+", "1-877-767-2382"),
    p("Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors unable to prepare their own meals.", "Age 65+; Income <$2901/mo; Medicaid req", "1-888-621-6880"),
    p("Arizona Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of seniors 60+ including respite care and counseling.", "Age 60+; Income <$3500/mo", "1-888-737-2367"),
    p("Arizona Senior Legal Helpline", "healthcare", "Provides free legal advice and brief services to seniors 60+ on issues like public benefits and housing.", "Age 60+; Income <$3000/mo", "1-844-677-5325"),
  ]
);

// ── ARKANSAS ─────────────────────────────────────────────────────────────────
addState("Arkansas", "AR", "arkansas",
  "Arkansas offers Medicaid waiver programs through DHS to help elderly and disabled residents access home and community-based services as an alternative to nursing home care.",
  [
    p("Regular Medicaid / Aged Blind and Disabled (AABD)", "healthcare", "Provides full Medicaid health coverage for Arkansas seniors aged 65+ who are aged, blind, or disabled, covering medical care and long-term services.", "Age 65+; Income <$1043/mo; Disability req", "1-800-482-8988"),
    p("Medicare Savings Program", "healthcare", "Helps low-income Medicare beneficiaries aged 65+ pay Medicare premiums, deductibles, and copays.", "Age 65+; Income <$1043/mo", "1-800-482-8988"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides food assistance benefits to low-income seniors through an EBT card for purchasing nutritious food.", "Age 65+; Income <$1948/mo", "1-800-482-8988"),
    p("ARK Choices Program Waiver", "healthcare", "Home and community-based services Medicaid waiver for seniors 65+ needing nursing home level care, providing personal care and support services.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-482-8988"),
    p("Senior Health Insurance Information Program (SHIIP)", "healthcare", "Offers free, unbiased counseling and assistance on Medicare, Medicare supplements, and prescription drug plans.", "Age 65+", "1-800-852-5494"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Integrates Medicare and Medicaid benefits for dual-eligible seniors needing nursing home level care in a community-based setting.", "Age 55+; Income <$2901/mo; Medicaid req", "1-800-482-8988"),
    p("LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Assists low-income households, including seniors, with heating and cooling bills and energy crisis assistance.", "Age 60+; Income <$3106/mo", "1-800-482-8988"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and ensuring quality care.", "Age 65+", "1-800-582-4887"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors through the Older Americans Act program to support independent living.", "Age 60+; Income <$3106/mo", "1-800-581-0752"),
    p("National Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers of seniors.", "Age 60+; Income <$3106/mo", "1-800-581-0752"),
    p("Area Agency on Aging Legal Services", "healthcare", "Provides free legal assistance to low-income seniors on issues like benefits, housing, and consumer protection.", "Age 60+; Income <$3106/mo", "1-800-581-0752"),
  ]
);

// ── CALIFORNIA ───────────────────────────────────────────────────────────────
addState("California", "CA", "california",
  "California offers several Medi-Cal waiver programs to help seniors and people with disabilities receive care at home and in the community. These programs provide an alternative to nursing home placement and support independent living.",
  [
    p("Medi-Cal for Aged and Disabled", "healthcare", "California's Medicaid program for seniors 65+ and people with disabilities. Covers medical care, prescriptions, hospital stays, and long-term care services.", "Age 65+; Income <$1801/mo", "1-800-541-5555"),
    p("In-Home Supportive Services (IHSS)", "healthcare", "Personal care assistance for Medi-Cal recipients who are elderly, blind, or disabled. Covers domestic services, meal preparation, and paramedical services.", "Medicaid req", "1-800-541-5555"),
    p("California Medicare Savings Programs", "healthcare", "State programs that pay Medicare premiums and costs. QMB pays Part A & B premiums, deductibles, and coinsurance.", "Income <$1762/mo", "1-800-541-5555"),
    p("Multipurpose Senior Services Program (MSSP)", "healthcare", "Medi-Cal waiver program for seniors who need nursing home level care but want to stay home. Coordinates community-based services.", "Age 65+; Income <$1801/mo", "1-800-510-2020"),
    p("CalFresh Food Benefits for Seniors", "food", "California's food stamps program (SNAP). SSI recipients are now eligible since expansion. Provides monthly benefits for food purchases.", "Income <$1580/mo", "1-877-847-3663"),
    p("SSI/SSP Cash Assistance", "income", "Monthly cash benefits for low-income seniors 65+ or disabled. Federal SSI ($967/mo) plus California state supplement.", "Age 65+; Income <$967/mo", "1-800-772-1213"),
    p("HICAP Medicare Counseling", "healthcare", "Free, unbiased help understanding Medicare options. Trained counselors help you choose plans and resolve billing issues.", "", "1-800-434-0222"),
    p("California Assisted Living Waiver (ALW)", "housing", "Medi-Cal pays for assisted living care at participating Residential Care Facilities for the Elderly.", "Income <$1801/mo", "1-800-541-5555"),
    p("California LIHEAP Energy Assistance", "utilities", "Helps pay heating and cooling bills. One-time payment sent directly to your utility company.", "Income <$1928/mo", "1-866-675-6623"),
    p("California Caregiver Resource Centers", "caregiver", "Free support for family caregivers including counseling, support groups, respite care, and legal/financial consultation.", "Age 18+", "1-800-445-8106"),
    p("California PACE Programs", "healthcare", "All-inclusive care centers in 27 California counties. Covers ALL medical care, prescriptions, transportation, and social services.", "Age 55+", "1-800-510-2020"),
    p("Property Tax Postponement Program", "housing", "Defer property taxes on your home until you sell or move. Available for homeowners 62+ or disabled.", "Age 62+; Income <$4599/mo", "1-800-952-5661"),
    p("California Home-Delivered Meals", "food", "Nutritious meals delivered to your home through the Older Americans Act program. Available to adults 60+ regardless of income.", "Age 60+", "1-800-510-2020"),
    p("250% California Working Disabled Program", "healthcare", "Medi-Cal for working people with disabilities whose income is too high for regular Medi-Cal.", "Income <$3263/mo; Disability req", "1-800-541-5555"),
    p("California Weatherization Assistance Program", "utilities", "Free home improvements to reduce energy costs including insulation, weather stripping, and furnace repair.", "Income <$2570/mo", "1-866-675-6623"),
    p("California Long-Term Care Ombudsman", "healthcare", "Free advocates who resolve complaints and protect the rights of people in nursing homes and assisted living.", "", "1-800-231-4024"),
    p("California Senior Legal Services", "income", "Free legal help for seniors 60+ on civil matters including benefits denials, housing disputes, and elder abuse.", "Age 60+", "1-800-510-2020"),
    p("Senior Community Service Employment Program (SCSEP)", "income", "Paid job training for low-income seniors 55+. Work part-time at community organizations while learning new skills.", "Age 55+; Income <$1580/mo", "1-800-510-2020"),
  ]
);

// ── COLORADO ─────────────────────────────────────────────────────────────────
addState("Colorado", "CO", "colorado",
  "Colorado's Medicaid HCBS waivers help seniors and adults with disabilities access home and community-based care, coordinated through local Single Entry Point agencies.",
  [
    p("Health First Colorado (Medicaid) for Aged, Blind, and Disabled", "healthcare", "Colorado's Medicaid program provides medical coverage for seniors 65+ and disabled individuals with limited income.", "Age 65+; Income <$994/mo; Disability req", "1-800-221-3943"),
    p("Elderly, Blind, and Disabled (EBD) Waiver", "healthcare", "Home and community-based services Medicaid waiver providing long-term supports like personal care, homemaker services, and adult day care.", "Age 65+; Income <$2901/mo; Disability req; Medicaid req", "1-800-221-3943"),
    p("Medicare Buy-In Programs (QMB, SLMB, QI)", "healthcare", "State-administered programs that help low-income Medicare beneficiaries pay for premiums and costs.", "Age 65+; Income <$1400/mo; Medicaid req", "1-800-221-3943"),
    p("Colorado SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via an EBT card to purchase nutritious food for eligible low-income seniors.", "Age 65+; Income <$1980/mo", "1-800-221-3943"),
    p("Colorado State Health Insurance Assistance Program (SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on enrollment, coverage options, and appeals.", "Age 65+", "1-888-696-7213"),
    p("Colorado PACE Program", "healthcare", "Comprehensive healthcare and social services for frail seniors 55+ eligible for Medicaid nursing facility care.", "Age 55+; Income <$1370/mo; Disability req; Medicaid req", "1-800-221-3943"),
    p("Colorado Energy Assistance Program (LEAP)", "utilities", "Low-income Energy Assistance Program provides a one-time payment toward home energy bills during winter.", "Age 65+; Income <$2825/mo", "1-800-221-3943"),
    p("Senior Property Tax Exemption (PTEX)", "housing", "Provides property tax exemption for owner-occupied homes of seniors 65+ meeting income requirements.", "Age 65+; Income <$16241/mo", "1-800-221-3943"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and ensuring quality care.", "Age 65+", "1-888-667-8747"),
    p("Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors unable to prepare food independently.", "Age 65+; Income <$2901/mo", "1-800-221-3943"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers of seniors.", "Age 60+; Income <$2825/mo", "1-800-221-3943"),
    p("Colorado Legal Services for Seniors", "income", "Provides free civil legal assistance to low-income seniors on issues like housing, benefits, and consumer protection.", "Age 60+; Income <$2000/mo", "1-800-221-3943"),
  ]
);

// ── CONNECTICUT ──────────────────────────────────────────────────────────────
addState("Connecticut", "CT", "connecticut",
  "Connecticut's home care programs, including the Home Care Program for Elders, help older adults remain safely in their homes with Medicaid or state-funded support.",
  [
    p("HUSKY C (Aged, Blind, and Disabled Medicaid)", "healthcare", "Provides healthcare coverage and long-term care services to low-income seniors aged 65+ and disabled individuals.", "Age 65+; Income <$1370/mo", "1-877-552-4105"),
    p("Medicare Savings Program (QMB/SLMB/QI)", "healthcare", "Helps low-income Medicare beneficiaries pay for premiums, deductibles, and coinsurance.", "Age 65+; Income <$1400/mo", "1-877-552-4105"),
    p("Connecticut Home Care Program for Elders (CHCPE) Waiver", "healthcare", "Medicaid HCBS waiver providing personal care, homemaker services, and adult day care to help seniors remain at home.", "Age 65+; Income <$1370/mo; Medicaid req", "1-877-552-4105"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for low-income seniors.", "Age 65+; Income <$1980/mo", "1-877-424-1230"),
    p("Connecticut State SSI Supplement", "income", "Optional state supplement to federal SSI payments for aged, blind, and disabled individuals.", "Age 65+; Income <$1370/mo; Disability req", "1-877-552-4105"),
    p("Connecticut PACE Program", "healthcare", "Program of All-Inclusive Care for the Elderly provides comprehensive medical and social services for frail seniors.", "Age 55+; Income <$1370/mo; Disability req; Medicaid req", "1-860-450-7223"),
    p("Connecticut Property Tax Relief for Seniors", "housing", "State circuit breaker program providing tax relief credits to elderly and disabled homeowners and renters.", "Age 65+; Income <$33000/mo", "1-860-297-5962"),
    p("ConnPace (Connecticut Pharmaceutical Assistance)", "healthcare", "State program providing prescription drug cost-sharing assistance to low-income seniors 65+.", "Age 65+; Income <$33000/mo", "1-866-551-3891"),
    p("Connecticut Energy Assistance Program (CEAP)", "utilities", "Provides cash grants to help eligible low-income households, including seniors, pay energy bills.", "Age 65+; Income <$2800/mo", "1-800-842-1508"),
    p("National Family Caregiver Support Program (Connecticut)", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers.", "Age 60+", "1-800-994-9422"),
    p("Connecticut Health Insurance Assistance Program (SHIP)", "healthcare", "Offers free, personalized counseling on Medicare options, coverage, and costs.", "Age 65+", "1-800-994-9422"),
    p("Connecticut Home-Delivered Meals Program", "food", "Delivers nutritious meals to homebound seniors through Area Agencies on Aging.", "Age 65+; Income <$2500/mo", "1-800-994-9422"),
    p("Senior Legal Services (Elder Law Hotlines)", "income", "Provides free legal advice and representation for low-income seniors on benefits and housing issues.", "Age 65+; Income <$2500/mo", "1-800-296-1467"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities, investigating complaints and ensuring quality care.", "Age 65+", "1-800-994-9422"),
  ]
);

// ── DELAWARE ─────────────────────────────────────────────────────────────────
addState("Delaware", "DE", "delaware",
  "Delaware offers integrated Medicaid managed care through Diamond State Health Plan Plus, providing long-term services and supports for seniors and adults with disabilities.",
  [
    p("Regular Medicaid / Aged Blind and Disabled", "healthcare", "Delaware's Medicaid program for seniors aged 65+ and individuals who are aged, blind, or disabled, providing health coverage.", "Age 65+; Income <$994/mo; Disability req", "1-800-852-9089"),
    p("Diamond State Health Plan Plus - Long Term Care Community Services", "healthcare", "Home and community-based services program serving nursing home-qualified seniors with personal care and support.", "Age 65+; Income <$2485/mo; Medicaid req", "1-888-278-8898"),
    p("Medicare Savings Program (QMB/SLMB/QI)", "healthcare", "State-administered programs that help low-income Medicare beneficiaries pay for premiums and costs.", "Age 65+; Income <$994/mo", "1-800-852-9089"),
    p("Food Stamp Program (SNAP)", "food", "Delaware's Supplemental Nutrition Assistance Program provides monthly benefits to low-income seniors for food.", "Age 65+; Income <$2081/mo", "1-800-852-9089"),
    p("Delaware Energy Assistance Program", "utilities", "Low-Income Home Energy Assistance Program helps eligible low-income households with heating and cooling costs.", "Age 60+; Income <$2820/mo", "1-800-292-9511"),
    p("Delaware SHIP Medicare Counseling", "healthcare", "State Health Insurance Assistance Program provides free, unbiased counseling on Medicare options.", "Age 65+", "1-800-852-9089"),
    p("Delaware Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-888-441-6611"),
    p("Delaware Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors through local senior centers and community programs.", "Age 60+; Income <$2820/mo", "1-888-441-6611"),
    p("National Family Caregiver Support Program - Delaware", "caregiver", "Provides support services to family caregivers of seniors aged 60+ including respite care and training.", "Age 60+; Income <$36000/mo", "1-888-441-6611"),
    p("Delaware Legal Help Link for Seniors", "income", "Connects Delaware seniors aged 60+ with free legal services for civil matters including benefits and housing.", "Age 60+; Income <$3000/mo", "1-888-441-6611"),
  ]
);

// ── FLORIDA ──────────────────────────────────────────────────────────────────
addState("Florida", "FL", "florida",
  "Florida's Medicaid waiver programs help seniors and adults with disabilities live in the community by providing home and community-based services as an alternative to nursing home placement.",
  [
    p("Medicaid for Aged and Disabled (MEDS-AD)", "healthcare", "Provides healthcare coverage and long-term care services to financially limited seniors aged 65+ and disabled individuals.", "Age 65+; Income <$1149/mo", "1-800-963-5337"),
    p("Statewide Medicaid Managed Care Long-Term Care (SMMC-LTC)", "healthcare", "Medicaid waiver program providing home and community-based services to prevent nursing home placement.", "Age 65+; Income <$2816/mo; Medicaid req", "1-800-963-5337"),
    p("Medicare Savings Program (QMB/SLMB/QI)", "healthcare", "Helps low-income Medicare beneficiaries pay for Medicare premiums, deductibles, and copays.", "Age 65+; Income <$1308/mo", "1-800-963-5337"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for low-income seniors.", "Age 65+; Income <$1980/mo", "1-866-762-2237"),
    p("SHINE (Serving Health Insurance Needs of Elders)", "healthcare", "Free, unbiased counseling and enrollment assistance for Medicare beneficiaries and caregivers.", "Age 65+", "1-800-963-5337"),
    p("National Family Caregiver Support Program", "caregiver", "Offers support services including caregiver training, respite care, and counseling for family caregivers.", "Age 60+", "1-800-963-5337"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists eligible low-income households, including seniors, with paying energy bills.", "Age 65+; Income <$2800/mo", "1-866-674-6327"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-888-831-0404"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors 60+ unable to prepare their own meals.", "Age 60+", "1-800-963-5337"),
    p("Legal Services for Seniors", "income", "Provides free legal assistance to low-income seniors 60+ on issues like benefits, housing, and elder abuse.", "Age 65+; Income <$2000/mo", "1-800-963-5337"),
  ]
);

// ── GEORGIA ──────────────────────────────────────────────────────────────────
addState("Georgia", "GA", "georgia",
  "Georgia's Medicaid waiver programs, including CCSP and SOURCE, help elderly and disabled residents receive home and community-based care rather than nursing home placement.",
  [
    p("Aged, Blind and Disabled Medicaid (ABD)", "healthcare", "Provides medical assistance to Georgia seniors aged 65+ who are low-income, aged, blind, or disabled.", "Age 65+; Income <$994/mo", "1-877-423-4746"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$994/mo; Medicaid req", "1-877-423-4746"),
    p("Elderly and Disabled Waiver Program (EDWP)", "healthcare", "Medicaid HCBS waiver providing in-home services like personal care, adult day care, and respite to prevent nursing home placement.", "Age 65+; Income <$2982/mo; Disability req; Medicaid req", "1-866-552-4464"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides monthly benefits to low-income seniors to purchase nutritious food via EBT card.", "Age 65+; Income <$1982/mo", "1-877-423-4746"),
    p("Low Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists eligible low-income households, including seniors, with heating and cooling bills.", "Age 60+; Income <$3090/mo", "1-866-674-6327"),
    p("Home-Delivered Meals (Georgia Elderly Nutrition Program)", "food", "Delivers nutritious meals to homebound seniors to promote independence and health.", "Age 60+", "1-866-552-4464"),
    p("Georgia Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers of seniors.", "Age 60+; Income <$3465/mo", "1-866-552-4464"),
    p("Georgia Senior Medicare Patrol (GSMP)", "healthcare", "Free counseling and education on Medicare rights, options, and fraud prevention for seniors.", "Age 65+", "1-866-552-4464"),
    p("Georgia Legal Services Program - Senior Services", "income", "Provides free civil legal assistance to low-income seniors on issues like housing, benefits, and elder abuse.", "Age 60+; Income <$2496/mo", "1-833-457-7529"),
    p("Georgia Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-866-552-4464"),
  ]
);

// ── HAWAII ───────────────────────────────────────────────────────────────────
addState("Hawaii", "HI", "hawaii",
  "Hawaii offers Medicaid home and community-based services through the QUEST Expanded program and state-funded Kupuna Care for seniors needing daily assistance.",
  [
    p("Aged, Blind, and Disabled (ABD) Medicaid", "healthcare", "Hawaii's ABD Medicaid provides healthcare coverage and long-term care benefits to seniors 65+ with limited income.", "Age 65+; Income <$1500/mo", "1-800-321-4848"),
    p("Home and Community-Based Services (HCBS) Waiver", "healthcare", "Hawaii's HCBS Waiver provides Medicaid-covered long-term care services and supports to help seniors remain at home.", "Age 65+; Income <$1500/mo; Medicaid req", "1-800-321-4848"),
    p("Assistance to the Aged, Blind and Disabled (AABD)", "income", "The AABD program provides cash benefits for food, clothing, shelter, and other essentials to low-income seniors.", "Age 65+; Income <$510/mo", "1-808-586-5230"),
  ]
);

// ── IDAHO ────────────────────────────────────────────────────────────────────
addState("Idaho", "ID", "idaho",
  "Idaho's Medicaid HCBS waivers provide home and community-based services to elderly and disabled residents through the Department of Health and Welfare.",
  [
    p("Medicaid for Aged/Disabled", "healthcare", "Idaho's Medicaid program for seniors 65+ and adults with disabilities provides health coverage and long-term care.", "Age 65+; Income <$2921/mo; Medicaid req", "1-877-456-1231"),
    p("Aged and Disabled (A&D) Waiver", "healthcare", "The A&D HCBS Waiver provides long-term care services to seniors 65+ and disabled adults at home.", "Age 65+; Income <$2921/mo; Medicaid req", "1-877-456-1231"),
    p("Medicare Savings Programs", "healthcare", "Idaho's Medicare Savings Programs (QMB, SLMB, QI) help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$1603/mo", "1-877-456-1231"),
    p("Idaho Supplemental Nutrition Assistance Program (SNAP)", "food", "SNAP provides monthly benefits to low-income seniors to purchase nutritious food.", "Age 65+; Income <$1984/mo", "1-877-456-1231"),
    p("Idaho Senior Health Insurance Assistance Program (SHIP)", "healthcare", "SHIP provides free, unbiased counseling on Medicare options, coverage, and help choosing plans.", "Age 65+", "1-800-247-4422"),
    p("Low Income Home Energy Assistance Program (LIHEAP)", "utilities", "LIHEAP helps eligible low-income households, including seniors, pay heating and cooling bills.", "Age 60+; Income <$3090/mo", "1-877-456-1231"),
    p("Long-Term Care Ombudsman Program", "healthcare", "The Ombudsman Program advocates for residents of long-term care facilities and resolves complaints.", "Age 65+", "1-800-392-7990"),
    p("Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors through Area Agencies on Aging.", "Age 60+; Income <$3090/mo", "1-800-392-7990"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of seniors 60+, including respite care and training.", "Age 60+; Income <$3090/mo", "1-800-392-7990"),
    p("Idaho Legal Aid Services", "healthcare", "Provides free civil legal assistance to low-income seniors on issues like benefits, housing, and consumer rights.", "Age 60+; Income <$1984/mo", "1-208-746-7541"),
  ]
);

// ── ILLINOIS ─────────────────────────────────────────────────────────────────
addState("Illinois", "IL", "illinois",
  "Illinois offers home and community-based services for seniors through the Community Care Program and Medicaid HCBS waivers, administered by the Department on Aging.",
  [
    p("Aid to the Aged, Blind, and Disabled (AABD) Medicaid", "healthcare", "Provides Medicaid health coverage for low-income seniors aged 65+ who are aged, blind, or disabled.", "Age 65+; Income <$1304/mo; Disability req", "1-800-843-6154"),
    p("HCBS Medicaid Waiver Programs", "healthcare", "Home and Community-Based Services waivers provide long-term care services like personal care, adult day care, and respite.", "Age 65+; Income <$1304/mo; Disability req; Medicaid req", "1-800-843-6154"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$1304/mo", "1-800-843-6154"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly food assistance benefits to low-income seniors to purchase nutritious food via EBT card.", "Age 65+; Income <$2000/mo", "1-800-843-6154"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Provides comprehensive medical and social services to frail seniors eligible for nursing home care.", "Age 55+; Income <$1304/mo; Disability req; Medicaid req", "1-800-252-8966"),
    p("Aid to the Aged, Blind, and Disabled (AABD) Cash Assistance", "income", "Provides monthly cash grants to low-income seniors aged 65+ who are aged, blind, or disabled.", "Age 65+; Income <$1304/mo; Disability req", "1-800-843-6154"),
    p("LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Provides assistance to eligible low-income households, including seniors, to pay heating and cooling bills.", "Age 65+; Income <$2000/mo", "1-877-411-9276"),
    p("Senior Citizens Property Tax Freeze", "housing", "Freezes property taxes for eligible seniors aged 65+ with income below limits.", "Age 65+; Income <$75000/mo", ""),
    p("Illinois SHIP (Senior Health Insurance Program)", "healthcare", "Free counseling service providing personalized assistance with Medicare choices and enrollment.", "Age 65+", "1-800-548-9034"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and ensuring quality of care.", "Age 65+", "1-800-252-8966"),
    p("Community Care Program Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors to promote independence and health.", "Age 65+", "1-800-252-8966"),
    p("Senior Legal Hotline", "healthcare", "Provides free legal advice and brief services to low-income seniors on issues like benefits and housing.", "Age 60+; Income <$2500/mo", "1-877-342-7898"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers of seniors.", "Age 60+", "1-800-252-8966"),
  ]
);

// ── INDIANA ──────────────────────────────────────────────────────────────────
addState("Indiana", "IN", "indiana",
  "Indiana's Pathways for Aging and HCBS waivers provide home and community-based care for seniors and adults with disabilities as alternatives to nursing home placement.",
  [
    p("Indiana PathWays for Aging", "healthcare", "Indiana PathWays for Aging is the state's Medicaid program for Hoosiers aged 60+ providing health and long-term care services.", "Age 60+; Income <$1200/mo; Medicaid req", "1-800-403-0864"),
    p("PathWays for Aging Waiver", "healthcare", "The PathWays for Aging Waiver provides home and community-based services (HCBS) for seniors needing nursing-level care.", "Age 60+; Income <$1200/mo; Medicaid req", "1-800-403-0864"),
    p("Hoosier RX: Medicare Savings Programs", "healthcare", "Indiana's Medicare Savings Programs (QMB, SLMB, QI) help low-income Medicare beneficiaries pay for costs.", "Age 65+; Income <$1407/mo", "1-800-403-0864"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Indiana's SNAP provides food assistance benefits via an EBT card to low-income seniors.", "Age 60+; Income <$1984/mo", "1-800-403-0864"),
    p("Indiana Senior Health Insurance Assistance Program (SHIP)", "healthcare", "SHIP provides free, unbiased counseling to Medicare beneficiaries on coverage options and enrollment.", "Age 65+", "1-800-452-4800"),
    p("Indiana Energy Assistance Program (IEAP)", "utilities", "IEAP provides grants to help eligible low-income households, including seniors, with heating and cooling costs.", "Age 60+; Income <$3092/mo", "1-800-403-0864"),
    p("National Family Caregiver Support Program (NFCSP)", "caregiver", "Provides support services for family caregivers of seniors 60+, including respite care, training, and counseling.", "Age 60+; Income <$3092/mo", "1-800-677-7913"),
    p("Indiana Long-Term Care Ombudsman Program", "healthcare", "The Ombudsman Program advocates for residents of long-term care facilities, investigating complaints.", "Age 65+", "1-800-677-7913"),
    p("Home-Delivered Meals", "food", "Home-delivered meals provide nutritious meals to homebound seniors to support health and independence.", "Age 60+; Income <$2500/mo", "1-800-677-7913"),
    p("Indiana Legal Services for Seniors", "healthcare", "Provides free legal assistance to low-income seniors 60+ on issues like benefits, housing, and consumer rights.", "Age 60+; Income <$2500/mo", "1-800-986-3150"),
  ]
);

// ── IOWA ─────────────────────────────────────────────────────────────────────
addState("Iowa", "IA", "iowa",
  "Iowa offers Medicaid HCBS waivers for elderly adults and individuals with brain injuries, coordinated through Iowa Medicaid managed care organizations.",
  [
    p("Aged, Blind, and Disabled (ABD) Medicaid", "healthcare", "Iowa's ABD Medicaid provides healthcare coverage and long-term care benefits to seniors 65+ with limited income.", "Age 65+; Income <$967/mo; Medicaid req", "1-800-338-8366"),
    p("Nursing Home Medicaid", "healthcare", "Iowa Medicaid program for seniors requiring nursing home care, covering room, board, and nursing services.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-338-8366"),
    p("Elderly Waiver Program (HCBS Waiver)", "healthcare", "Iowa's Medicaid waiver program helps seniors aged 65+ stay in their homes with home and community-based services.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-338-8366"),
  ]
);

// ── KANSAS ───────────────────────────────────────────────────────────────────
addState("Kansas", "KS", "kansas",
  "Kansas's KanCare Medicaid program includes HCBS waivers for frail elderly individuals and adults with physical disabilities to receive home and community-based care.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "Provides healthcare coverage and long-term care services to financially needy Kansas seniors 65+.", "Age 65+; Income <$967/mo", "1-800-792-4884"),
    p("Home and Community Based Services for the Frail Elderly Waiver", "healthcare", "Medicaid waiver providing long-term services and supports to seniors 65+ at risk of nursing home placement.", "Age 65+; Income <$967/mo; Medicaid req", "1-800-792-4884"),
    p("KanCare Medicare Buy-In Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$967/mo; Medicaid req", "1-800-792-4884"),
    p("Kansas Food Assistance Program", "food", "Provides food assistance benefits to low-income seniors to purchase nutritious food via EBT card.", "Age 60+; Income <$1922/mo", "1-888-369-4777"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Comprehensive program for Medicaid-eligible seniors 55+ requiring nursing facility level of care.", "Age 55+; Income <$967/mo; Medicaid req", "1-800-792-4884"),
    p("Senior Health Insurance Counseling for Kansas", "healthcare", "Free, unbiased counseling assistance for Medicare beneficiaries and caregivers on coverage options.", "Age 65+", "1-800-860-5260"),
    p("Low-Income Energy Assistance Program", "utilities", "Assists low-income households, including seniors, with heating and cooling bills.", "Age 60+; Income <$3091/mo", "1-800-562-2434"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services including caregiver training, respite care, and counseling for family caregivers.", "Age 60+; Income <$3091/mo", "1-800-432-3535"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and ensuring quality care.", "Age 65+", "1-800-842-0078"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors unable to prepare their own food.", "Age 60+; Income <$3091/mo", "1-800-432-3535"),
    p("Legal Assistance for Older Kansans", "income", "Provides free legal services to low-income seniors facing issues like housing, benefits, and consumer protection.", "Age 60+; Income <$3091/mo", "1-800-723-6218"),
  ]
);

// ── KENTUCKY ─────────────────────────────────────────────────────────────────
addState("Kentucky", "KY", "kentucky",
  "Kentucky offers HCBS waivers and supports for community living to help seniors and adults with disabilities remain in their homes rather than nursing facilities.",
  [
    p("Aged, Blind, and Disabled (ABD) Medicaid", "healthcare", "Provides healthcare coverage and long-term care services to financially limited Kentucky seniors 65+.", "Age 65+; Income <$235/mo", "1-855-306-8959"),
    p("Home and Community Based (HCB) Waiver", "healthcare", "Medicaid waiver providing long-term care services to seniors requiring nursing home level of care at home.", "Age 65+; Income <$2901/mo; Medicaid req", "1-855-306-8959"),
    p("Medicare Savings Programs (QMB/SLMB/QI)", "healthcare", "State-administered programs that help low-income Medicare beneficiaries pay for premiums and costs.", "Age 65+; Income <$1400/mo", "1-855-306-8959"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides monthly benefits to low-income seniors to purchase nutritious food via EBT card.", "Age 65+; Income <$1980/mo", "1-877-480-4846"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Provides comprehensive medical and social services to frail seniors aged 55+ needing nursing-level care.", "Age 55+; Income <$2901/mo; Medicaid req", "1-855-306-8959"),
    p("Kentucky SHIP (State Health Insurance Assistance Program)", "healthcare", "Provides free, unbiased counseling and assistance to Medicare beneficiaries on coverage and enrollment.", "Age 65+", "1-877-293-7447"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Helps eligible low-income households, including seniors, pay heating and cooling bills.", "Age 65+; Income <$2470/mo", "1-800-456-3452"),
    p("National Family Caregiver Support Program (NFCSP)", "caregiver", "Provides support services to family caregivers of seniors aged 60+ including respite care and training.", "Age 60+; Income <$2470/mo", "1-800-372-2991"),
    p("Kentucky Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-372-2991"),
    p("Home-Delivered Meals (DAIL)", "food", "Provides nutritious meals delivered to homebound seniors who are unable to prepare their own food.", "Age 60+; Income <$2470/mo", "1-800-372-2991"),
    p("Area Agency on Aging Legal Services", "income", "Provides free legal assistance to low-income seniors through Kentucky's Area Agencies on Aging.", "Age 60+; Income <$2470/mo", "1-800-372-2991"),
    p("KY Property Tax Homestead Exemption", "housing", "Provides property tax relief for seniors aged 65+ who are disabled or have income below certain limits.", "Age 65+; Income <$52000/mo; Disability req", "1-502-564-5731"),
  ]
);

// ── LOUISIANA ────────────────────────────────────────────────────────────────
addState("Louisiana", "LA", "louisiana",
  "Louisiana's Medicaid waiver programs through the Office of Aging and Adult Services and OCDD provide home and community-based supports for elderly and disabled residents.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "Provides healthcare coverage and long-term care services to Louisiana residents aged 65+ with limited income.", "Age 65+; Income <$967/mo", "1-888-342-6207"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$1400/mo; Medicaid req", "1-888-342-6207"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for low-income seniors.", "Age 65+; Income <$1984/mo", "1-888-997-1119"),
    p("Adult Day Health Care Waiver", "healthcare", "Medicaid HCBS waiver providing adult day health care services to prevent nursing home placement.", "Age 65+; Income <$2901/mo; Medicaid req", "1-866-783-5553"),
    p("LIHEAP (Low-Income Home Energy Assistance Program)", "utilities", "Assists eligible low-income households with heating and cooling bills and energy crisis assistance.", "Age 65+; Income <$2794/mo", "1-800-548-3474"),
    p("Louisiana Senior Health Insurance Information Program (LA SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries and caregivers on Medicare options and enrollment.", "Age 65+", "1-800-433-2442"),
    p("Home-Delivered Meals (Nutrition Program)", "food", "Delivers nutritious meals to homebound seniors through Area Agencies on Aging.", "Age 60+; Income <$2794/mo", "1-866-783-5553"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of individuals 60+ including respite care and counseling.", "Age 65+; Income <$2794/mo", "1-866-783-5553"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-800-392-7449"),
    p("Louisiana Legal Services", "healthcare", "Provides free civil legal assistance to low-income seniors for issues like benefits, housing, and consumer rights.", "Age 65+; Income <$1920/mo", "1-800-256-4417"),
  ]
);

// ── MAINE ────────────────────────────────────────────────────────────────────
addState("Maine", "ME", "maine",
  "Maine offers MaineCare HCBS waivers and PACE to help seniors and adults with disabilities access home and community-based services as an alternative to nursing care.",
  [
    p("MaineCare Aged, Blind, and Disabled", "healthcare", "MaineCare is Maine's Medicaid program providing health coverage for seniors aged 65+ with limited income.", "Age 65+; Income <$1305/mo; Disability req", "1-866-690-5582"),
    p("MaineCare Elderly and Adults with Disabilities Waiver", "healthcare", "This HCBS Medicaid waiver provides home-based long-term care services for seniors 65+ at risk of nursing home placement.", "Age 65+; Income <$2901/mo; Medicaid req", "1-866-690-5582"),
    p("MaineCare Medicare Savings Programs", "healthcare", "Maine's Medicare Savings Programs (QMB, SLMB, QI) help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$2413/mo", "1-866-690-5582"),
    p("Maine SNAP", "food", "Maine's SNAP provides monthly benefits via EBT card to low-income seniors for purchasing nutritious food.", "Age 65+; Income <$1924/mo", "1-866-690-5582"),
    p("Maine Senior Health Insurance Assistance Program (SHIP)", "healthcare", "Maine SHIP offers free, unbiased counseling on Medicare, Medicare Savings Programs, and coverage options.", "Age 65+", "1-800-262-2237"),
    p("Maine Heating Assistance / LIHEAP", "utilities", "Maine's LIHEAP helps low-income households, including seniors, pay heating costs in winter months.", "Age 65+; Income <$2400/mo", "1-800-452-8259"),
    p("Maine State SSI Supplement", "income", "Maine provides a small monthly SSI state supplement to eligible SSI recipients who are aged, blind, or disabled.", "Age 65+; Income <$943/mo; Disability req", "1-800-772-1213"),
    p("Maine Long-Term Care Ombudsman Program", "healthcare", "The Ombudsman Program advocates for residents of long-term care facilities, investigating complaints.", "Age 65+", "1-800-499-9291"),
    p("Maine Property Tax Stabilization for Seniors", "housing", "Provides property tax stabilization for eligible seniors and disabled homeowners, freezing assessments.", "Age 65+; Income <$40000/mo", "1-207-626-8400"),
    p("Maine Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors through Area Agencies on Aging.", "Age 65+; Income <$2000/mo", "1-877-353-2123"),
    p("Legal Services for Maine's Elders", "income", "Provides free legal assistance to Mainers aged 60+ on issues like benefits, housing, and elder abuse.", "Age 60+; Income <$2500/mo", "1-800-750-5353"),
    p("Maine Family Caregiver Support Program", "caregiver", "Offers support to family caregivers of seniors 60+, including respite care, counseling, and training.", "Age 65+; Income <$2400/mo", "1-877-353-2123"),
  ]
);

// ── MARYLAND ─────────────────────────────────────────────────────────────────
addState("Maryland", "MD", "maryland",
  "Maryland's Medicaid waiver programs provide home and community-based services for adults with physical disabilities and seniors, coordinated through the Department of Health.",
  [
    p("Maryland Medical Assistance - Regular Medicaid/ABD", "healthcare", "State Medicaid program providing health coverage and limited long-term care services for seniors 65+.", "Age 65+; Income <$350/mo", "1-800-637-6334"),
    p("Maryland Medical Assistance - Nursing Home Medicaid", "healthcare", "Medicaid coverage for nursing home care and related long-term care services for eligible seniors.", "Age 65+", "1-800-637-6334"),
    p("Maryland Medical Assistance - Medically Needy Pathway", "healthcare", "ABD spenddown program allowing seniors over Medicaid income limits to become eligible by spending down income.", "Age 65+; Income <$350/mo", "1-800-637-6334"),
    p("Maryland HCBS Waivers - Medicaid Waiver Programs", "healthcare", "Home and community-based services Medicaid waivers providing alternatives to institutional care.", "Age 65+; Income <$2901/mo; Medicaid req", "1-844-253-8694"),
    p("Maryland EID Program - Employed Individuals with Disabilities", "healthcare", "Medicaid buy-in program for workers with disabilities who would otherwise be ineligible.", "Age 65+; Disability req", "1-800-637-6334"),
  ]
);

// ── MASSACHUSETTS ────────────────────────────────────────────────────────────
addState("Massachusetts", "MA", "massachusetts",
  "Massachusetts offers a range of Medicaid HCBS programs including Adult Foster Care, Group Adult Foster Care, and PACE for seniors and adults with disabilities.",
  [
    p("MassHealth Standard (Aged, Blind, and Disabled Medicaid)", "healthcare", "Provides healthcare coverage and long-term care services to financially limited seniors 65+.", "Age 65+; Income <$1305/mo", "1-800-841-2900"),
    p("Frail Elder Waiver (FEW)", "healthcare", "Medicaid HCBS waiver providing long-term care services to seniors aged 60+ requiring nursing-level care.", "Age 60+; Income <$2901/mo; Medicaid req", "1-800-841-2900"),
    p("MassHealth Buy-In (QMB/SLMB/QI)", "healthcare", "State-administered programs helping low-income Medicare beneficiaries pay Medicare costs.", "Age 65+; Income <$1305/mo", "1-800-841-2900"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for low-income seniors.", "Age 60+; Income <$2174/mo", "1-877-382-2363"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Comprehensive healthcare and long-term care program for dual-eligible seniors 55+ needing nursing-level care.", "Age 55+; Income <$1305/mo; Medicaid req", "1-800-841-2900"),
    p("LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Provides financial assistance to help eligible low-income households, including seniors, pay energy bills.", "Age 60+; Income <$3838/mo", "1-800-642-4276"),
    p("MassHealth Senior Pharmacy Program (SPAP)", "healthcare", "State Pharmaceutical Assistance Program providing copayment assistance for prescription medications.", "Age 65+; Income <$1305/mo; Medicaid req", "1-800-841-2900"),
    p("SHIP (State Health Insurance Assistance Program)", "healthcare", "Provides free, unbiased counseling on Medicare options, including Parts A/B/D and supplemental plans.", "Age 65+", "1-800-243-4636"),
    p("Clause 41C Senior Circuit Breaker Tax Credit", "housing", "Property tax relief providing refundable income tax credit to seniors with high property tax burdens.", "Age 65+; Income <$66000/mo", "1-617-887-6367"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for rights and resolves complaints for residents in long-term care facilities.", "Age 65+", "1-800-243-4636"),
    p("State Supplement to SSI", "income", "Massachusetts provides cash supplement to federal SSI for aged, blind, and disabled individuals.", "Age 65+; Income <$1086/mo", "1-877-848-1751"),
    p("Home-Delivered Meals via Elder Affairs Nutrition Program", "food", "Delivers nutritious meals to homebound seniors to promote health and independence.", "Age 60+; Income <$2174/mo", "1-800-243-4636"),
    p("Legal Services for Elders via Elder Law Projects", "income", "Provides free civil legal assistance to low-income seniors on issues like housing, benefits, and elder abuse.", "Age 60+; Income <$2174/mo", "1-800-243-4636"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services including respite care, counseling, training, and supplemental services for caregivers.", "Age 60+; Income <$3838/mo", "1-800-243-4636"),
  ]
);

// ── MICHIGAN ─────────────────────────────────────────────────────────────────
addState("Michigan", "MI", "michigan",
  "Michigan's MI Choice Waiver and PACE program help seniors and adults with disabilities receive home and community-based services coordinated through waiver agents.",
  [
    p("Medicaid for Aged and Disabled", "healthcare", "Provides medical assistance to low-income seniors aged 65+ who are aged, blind, or disabled.", "Age 65+; Income <$1305/mo; Disability req", "1-855-789-5610"),
    p("MI Choice Waiver Program", "healthcare", "Medicaid waiver providing home and community-based services to seniors needing nursing home level of care.", "Age 65+; Income <$2901/mo; Medicaid req", "1-855-789-5610"),
    p("Medicare Savings Program", "healthcare", "Helps low-income Medicare beneficiaries pay for Medicare premiums, deductibles, and coinsurance.", "Age 65+; Income <$1305/mo", "1-855-789-5610"),
    p("Food Assistance Program", "food", "Provides monthly benefits to low-income seniors to purchase food via EBT card.", "Age 65+; Income <$1763/mo", "1-855-275-6424"),
    p("Michigan PACE", "healthcare", "Program of All-Inclusive Care for the Elderly provides comprehensive medical and social services.", "Age 65+; Income <$2901/mo; Medicaid req", "1-855-789-5610"),
    p("Michigan SHIP", "healthcare", "Free counseling and assistance for Medicare beneficiaries on options, enrollment, and appeals.", "Age 65+", "1-800-803-7174"),
    p("State Emergency Relief", "utilities", "Provides one-time assistance for energy bills, home repairs, and utility needs for low-income seniors.", "Age 65+; Income <$1763/mo", "1-855-275-6424"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services to family caregivers of seniors, including respite care, counseling, and training.", "Age 65+; Income <$1763/mo", "1-866-463-3387"),
    p("Property Tax Credit for Seniors", "housing", "Provides income-based credit on homestead property taxes or rent for seniors to reduce housing costs.", "Age 65+; Income <$1763/mo", "1-517-636-4486"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities, resolving complaints and protecting rights.", "Age 65+", "1-866-485-9390"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors to promote health and independence.", "Age 65+; Income <$1763/mo", "1-866-463-3387"),
    p("State SSI Supplement", "income", "Michigan provides a small state supplement to federal SSI for aged, blind, and disabled individuals.", "Age 65+; Income <$794/mo; Disability req", "1-855-275-6424"),
    p("Area Agency on Aging Legal Services", "healthcare", "Provides free or low-cost legal assistance to seniors on issues like housing, benefits, and consumer rights.", "Age 65+; Income <$1763/mo", "1-866-463-3387"),
  ]
);

// ── MINNESOTA ────────────────────────────────────────────────────────────────
addState("Minnesota", "MN", "minnesota",
  "Minnesota's Elderly Waiver and Brain Injury Waiver provide home and community-based services for seniors and adults with disabilities through county-coordinated care.",
  [
    p("Medical Assistance (MA) for Elderly, Blind, and Disabled", "healthcare", "Minnesota's Medicaid program provides health coverage for seniors 65+ with limited income.", "Age 65+; Income <$1305/mo; Disability req", "1-800-657-3739"),
    p("Elderly Waiver (EW)", "healthcare", "Minnesota's HCBS Medicaid waiver providing long-term services to seniors 65+ at home.", "Age 65+; Income <$1305/mo; Medicaid req", "1-800-657-3739"),
    p("Medicare Savings Programs", "healthcare", "Minnesota's Medicare Savings Programs help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$1305/mo", "1-800-657-3739"),
    p("Minnesota Supplemental Nutrition Assistance Program (SNAP)", "food", "Minnesota SNAP provides monthly benefits to low-income seniors to buy healthy food.", "Age 60+; Income <$1924/mo", "1-888-328-6399"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Minnesota offers PACE programs providing comprehensive medical and social services to frail seniors.", "Age 55+; Income <$1305/mo; Disability req; Medicaid req", "1-800-657-3739"),
    p("Senior Health Insurance Assistance Program (SHIP)", "healthcare", "SHIP offers free, unbiased counseling to Medicare beneficiaries on coverage options and enrollment.", "Age 65+", "1-800-657-3739"),
    p("Minnesota Supplemental Aid (MSA)", "income", "State SSI supplement provides cash assistance to aged, blind, and disabled SSI recipients.", "Age 65+; Income <$943/mo; Disability req; Medicaid req", "1-800-657-3739"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "LIHEAP provides grants to help eligible low-income seniors pay heating and electric bills.", "Age 60+; Income <$2829/mo", "1-800-657-3710"),
    p("Minnesota Property Tax Refund (PTF) for Seniors", "housing", "Provides refunds to seniors 65+ and disabled homeowners/renters based on property taxes or rent paid.", "Age 65+; Income <$65000/mo", "1-800-657-3666"),
    p("Minnesota Long-Term Care Ombudsman Program", "healthcare", "The Long-Term Care Ombudsman advocates for residents in nursing homes and assisted living facilities.", "Age 65+", "1-800-657-3506"),
    p("Senior Nutrition Home-Delivered Meals", "food", "Home-delivered meals program provides nutritious meals to homebound seniors 60+.", "Age 60+; Income <$2829/mo", "1-800-678-4438"),
    p("Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of seniors 60+ including respite care and counseling.", "Age 60+; Income <$2829/mo", "1-800-678-4438"),
    p("Senior Legal Helpline", "income", "Provides free legal advice and brief services to low-income seniors 60+ on public benefits and housing.", "Age 60+; Income <$2798/mo", "1-888-360-3456"),
  ]
);

// ── MISSISSIPPI ──────────────────────────────────────────────────────────────
addState("Mississippi", "MS", "mississippi",
  "Mississippi offers Medicaid HCBS waiver programs for adults with physical disabilities and PACE for seniors who need nursing home level of care in the community.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "Provides healthcare coverage and long-term care services to Mississippi seniors aged 65+ with limited income.", "Age 65+; Income <$967/mo", "1-800-421-2408"),
    p("Elderly and Disabled Waiver", "healthcare", "Medicaid HCBS waiver providing home and community-based services to seniors 65+ at risk of nursing home placement.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-421-2408"),
    p("Medicare Savings Program", "healthcare", "Helps low-income Medicare beneficiaries pay for Medicare premiums, deductibles, and coinsurance.", "Age 65+; Income <$967/mo; Medicaid req", "1-800-421-2408"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits to low-income seniors to purchase nutritious food via EBT card.", "Age 65+; Income <$1981/mo", "1-800-948-3050"),
    p("LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Assists low-income households, including seniors, with heating and cooling bills.", "Age 60+; Income <$2783/mo", "1-800-421-0762"),
    p("Mississippi SHIP (State Health Insurance Assistance Program)", "healthcare", "Offers free, unbiased counseling and assistance to Medicare beneficiaries on Medicare options and enrollment.", "Age 65+", "1-800-421-2109"),
    p("Mississippi Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors through Nutrition Services of the Aging.", "Age 60+; Income <$2783/mo", "1-800-948-2400"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of seniors 60+, including respite care and counseling.", "Age 60+; Income <$2783/mo", "1-800-948-2400"),
    p("Mississippi Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and ensuring quality care.", "Age 65+", "1-800-949-8454"),
    p("Mississippi Legal Services Senior Program", "income", "Provides free legal assistance to low-income seniors on issues like housing, benefits, and elder abuse.", "Age 60+; Income <$2783/mo", "1-800-498-1804"),
  ]
);

// ── MISSOURI ─────────────────────────────────────────────────────────────────
addState("Missouri", "MO", "missouri",
  "Missouri's MO HealthNet HCBS waiver programs provide home and community-based services for aged and disabled residents, including self-directed care options.",
  [
    p("MO HealthNet for the Aged, Blind, and Disabled (ABD)", "healthcare", "Provides Medicaid coverage for personal care and community-based services to seniors aged 65+ with limited income.", "Age 65+; Income <$1109/mo; Disability req", "1-800-392-2161"),
    p("Aged and Disabled Waiver (ADW)", "healthcare", "Medicaid HCBS waiver providing in-home services like homemaker, chore, respite, and adult day care.", "Age 63+; Income <$1690/mo; Medicaid req", "1-800-235-5503"),
    p("MO HealthNet Medicare Savings Programs", "healthcare", "Helps low-income Medicare beneficiaries pay for Medicare premiums, deductibles, and coinsurance.", "Age 65+; Income <$1407/mo", "1-800-392-2161"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via EBT card to purchase food for eligible low-income seniors.", "Age 65+; Income <$1992/mo", "1-855-823-3142"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Provides comprehensive medical and social services to frail seniors 55+ certified for nursing home level of care.", "Age 55+; Income <$1690/mo; Disability req; Medicaid req", "1-800-235-5503"),
    p("Low Income Home Energy Assistance Program (LIHEAP)", "utilities", "Provides financial assistance to help eligible low-income households, including seniors, pay energy bills.", "Age 60+; Income <$2800/mo", "1-800-392-1260"),
    p("Missouri Connecting to Medicare (SHIP)", "healthcare", "State Health Insurance Assistance Program providing free, unbiased counseling on Medicare options.", "Age 65+", "1-800-395-5997"),
    p("Missouri Property Tax Credit", "housing", "Provides tax credits to seniors 65+ and disabled homeowners/renters with income below limits.", "Age 65+; Income <$30000/mo", "1-800-877-6881"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and resolving issues.", "Age 65+", "1-800-392-0210"),
    p("Senior Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors 60+ who are unable to prepare their own food.", "Age 60+; Income <$1690/mo", "1-800-235-5503"),
    p("Family Caregiver Support Program", "caregiver", "Provides support services including respite care, counseling, training, and supplemental services for caregivers.", "Age 70+; Income <$36000/mo", "1-877-835-5462"),
    p("Missouri Legal Services for Seniors", "income", "Provides free legal assistance to low-income seniors 60+ on issues like benefits, housing, and consumer rights.", "Age 60+; Income <$1875/mo", "1-800-255-0056"),
  ]
);

// ── MONTANA ──────────────────────────────────────────────────────────────────
addState("Montana", "MT", "montana",
  "Montana's HCBS waivers through DPHHS provide home and community-based services for elderly individuals, people with physical disabilities, and those with developmental disabilities.",
  [
    p("Medicaid for Aged, Blind, or Disabled", "healthcare", "Montana's Medicaid program for seniors 65+ and disabled individuals who meet Social Security criteria.", "Age 65+; Income <$967/mo", "1-800-362-8312"),
    p("Big Sky Waiver Program", "healthcare", "Montana's 1915(c) HCBS Medicaid waiver for elderly (65+) or disabled residents at risk of nursing home placement.", "Age 65+; Income <$967/mo; Medicaid req", "1-800-362-8312"),
    p("Montana Medicaid for Workers with Disabilities", "healthcare", "Allows individuals who meet Social Security's disability criteria to receive Medicaid while working.", "Age 18+; Disability req", "1-800-362-8312"),
  ]
);

// ── NEBRASKA ─────────────────────────────────────────────────────────────────
addState("Nebraska", "NE", "nebraska",
  "Nebraska offers HCBS Medicaid waivers and PACE to help seniors and adults with disabilities access home and community-based care as alternatives to nursing home placement.",
  [
    p("Nebraska Medicaid Aged and Disabled Waiver", "healthcare", "Statewide Medicaid HCBS waiver for seniors 65+ or disabled individuals at risk of nursing home placement.", "Age 65+; Income <$1304/mo; Medicaid req", "1-800-430-3244"),
    p("Nebraska Aged and Disabled Waiver HCBS", "healthcare", "The primary HCBS waiver providing home and community-based care services for elderly and disabled residents.", "Age 65+; Income <$1304/mo; Medicaid req", "1-800-430-3244"),
    p("Nebraska Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries pay costs.", "Age 65+; Income <$1304/mo", "1-800-430-3244"),
    p("Nebraska Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides monthly benefits via EBT card to purchase food for low-income seniors.", "Age 65+; Income <$1982/mo", "1-800-430-3244"),
    p("Nebraska Senior Health Insurance Assistance (SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on coverage options and enrollment.", "Age 65+", "1-800-234-7119"),
    p("Nebraska Family Caregiver Support Program", "caregiver", "Offers support services for family caregivers of seniors 60+, including respite care and training.", "Age 60+; Income <$3675/mo", "1-800-430-3244"),
    p("Nebraska Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists low-income households, including seniors, with heating and cooling bills.", "Age 60+; Income <$2794/mo", "1-800-430-3244"),
    p("Nebraska Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and ensuring quality care.", "Age 65+", "1-800-621-6595"),
    p("Nebraska Home-Delivered Meals through Aging Services", "food", "Delivers nutritious meals to homebound seniors unable to prepare their own food.", "Age 60+; Income <$2350/mo", "1-800-430-3244"),
    p("Nebraska Legal Aid for Seniors", "income", "Provides free civil legal services to low-income seniors on issues like housing, benefits, and consumer rights.", "Age 60+; Income <$2350/mo", "1-877-250-2016"),
  ]
);

// ── NEVADA ───────────────────────────────────────────────────────────────────
addState("Nevada", "NV", "nevada",
  "Nevada's Medicaid HCBS waivers for frail elderly individuals and adults with physical disabilities help residents remain at home with community-based supports.",
  [
    p("Medical Assistance to the Aged, Blind, and Disabled (MAABD)", "healthcare", "Provides healthcare and long-term care services to low-income Nevada residents aged 65+.", "Age 65+; Income <$967/mo", "1-800-992-0900"),
    p("Home and Community-Based Services (HCBS) Frail Elderly Waiver", "healthcare", "Medicaid waiver providing home and community-based services to prevent nursing home placement.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-992-0900"),
    p("Medicare Savings Programs (QMB/SLMB/QI)", "healthcare", "State-administered programs that help low-income Medicare beneficiaries pay premiums and costs.", "Age 65+; Income <$967/mo", "1-800-992-0900"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides food assistance benefits to low-income seniors to purchase nutritious food.", "Age 65+; Income <$1952/mo", "1-800-992-0900"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Comprehensive program coordinating medical, social, and long-term care for nursing-home-eligible seniors.", "Age 55+; Income <$2901/mo; Disability req; Medicaid req", "1-800-992-0900"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Helps eligible low-income households, including seniors, pay heating and cooling bills.", "Age 60+; Income <$2800/mo", "1-866-674-3278"),
    p("Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of seniors 60+ including respite care and training.", "Age 60+", "1-800-992-5750"),
    p("Nevada Senior Medicare Patrol (SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on understanding coverage and enrollment.", "Age 65+", "1-855-343-4276"),
    p("Nevada Long Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-546-4783"),
    p("Home-Delivered Meals (Nevada Senior Services)", "food", "Delivers nutritious meals to homebound seniors unable to prepare their own food.", "Age 60+", "1-800-992-5750"),
    p("Nevada Legal Services for Seniors", "income", "Provides free legal assistance to low-income seniors 60+ on issues like housing, benefits, and elder abuse.", "Age 60+; Income <$2500/mo", "1-877-862-2952"),
  ]
);

// ── NEW HAMPSHIRE ────────────────────────────────────────────────────────────
addState("New Hampshire", "NH", "new-hampshire",
  "New Hampshire's Choices for Independence Waiver and In-Home Support Waiver provide Medicaid home and community-based services for seniors and adults with disabilities.",
  [
    p("Medicaid for Aged/Disabled", "healthcare", "New Hampshire's Medicaid program provides health coverage for low-income seniors aged 65+.", "Age 65+; Income <$2901/mo", "1-844-275-3447"),
    p("Choices for Independence Waiver", "healthcare", "The Choices for Independence HCBS Waiver provides home and community-based services for seniors 65+.", "Age 65+; Income <$2901/mo; Medicaid req", "1-844-275-3447"),
    p("Medicare Savings Program", "healthcare", "New Hampshire's Medicare Savings Programs (QMB, SLMB, QI) assist low-income Medicare beneficiaries.", "Age 65+; Income <$1400/mo", "1-800-842-8992"),
    p("SNAP Nutrition Assistance", "food", "New Hampshire's SNAP provides monthly benefits to low-income seniors for purchasing nutritious food.", "Age 60+; Income <$1920/mo", "1-800-852-3345"),
    p("LIHEAP", "utilities", "New Hampshire's Low-Income Home Energy Assistance Program provides grants to help seniors pay energy bills.", "Age 60+; Income <$2800/mo", "1-800-852-3345"),
    p("SHINE", "healthcare", "New Hampshire's SHINE program offers free, unbiased counseling on Medicare options and enrollment.", "Age 65+", "1-800-842-8992"),
    p("Elderly Exemption Property Tax Credit", "housing", "New Hampshire's Elderly Exemption provides property tax credits or exemptions for seniors 65+.", "Age 65+; Income <$3750/mo", "1-603-271-2194"),
    p("Long-Term Care Ombudsman Program", "healthcare", "New Hampshire's Long-Term Care Ombudsman Program advocates for residents in nursing homes and assisted living.", "Age 65+", "1-800-949-0470"),
    p("Home Delivered Meals", "food", "New Hampshire's Home Delivered Meals program provides nutritious meals to homebound seniors 60+.", "Age 60+", "1-866-634-9378"),
    p("Family Caregiver Support Program", "caregiver", "New Hampshire's Family Caregiver Support Program provides information, training, respite care, and counseling.", "Age 60+; Income <$3000/mo", "1-866-634-9378"),
    p("Legal Assistance for Seniors", "healthcare", "New Hampshire's Legal Assistance for Seniors provides free civil legal services to low-income seniors 60+.", "Age 60+; Income <$2000/mo", "1-800-639-5290"),
  ]
);

// ── NEW JERSEY ───────────────────────────────────────────────────────────────
addState("New Jersey", "NJ", "new-jersey",
  "New Jersey's MLTSS and Global Options programs integrate long-term services and supports into Medicaid managed care for residents who need nursing facility level of care.",
  [
    p("NJ FamilyCare Aged, Blind, Disabled (ABD) Programs", "healthcare", "Provides medical coverage to individuals age 65+, blind, or disabled with limited income.", "Age 65+; Income <$998/mo", "1-800-701-0710"),
    p("NJ FamilyCare Managed Long Term Services and Supports (MLTSS) Waiver", "healthcare", "Home and community-based services Medicaid waiver providing personal care assistance and support.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-701-0710"),
    p("NJ FamilyCare Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries.", "Age 65+; Income <$1350/mo; Medicaid req", "1-800-701-0710"),
    p("NJ SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for low-income seniors.", "Age 65+; Income <$1990/mo", "1-800-687-9512"),
    p("PAAD (Pharmaceutical Assistance to the Aged and Disabled)", "healthcare", "State Pharmaceutical Assistance Program providing prescription drug coverage to NJ seniors.", "Age 65+; Income <$31500/mo; Disability req", "1-800-882-7537"),
    p("NJ LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Helps eligible low-income households, including seniors, pay heating and cooling bills.", "Age 65+; Income <$2824/mo", "1-800-510-3102"),
    p("New Jersey PACE (Program of All-Inclusive Care for the Elderly)", "healthcare", "Offers comprehensive medical and social services to frail seniors 55+ eligible for nursing-level care.", "Age 55+; Disability req; Medicaid req", "1-800-561-4646"),
    p("New Jersey SHIP (State Health Insurance Assistance Program)", "healthcare", "Provides free, unbiased counseling and enrollment assistance for Medicare beneficiaries.", "Age 65+", "1-800-792-8820"),
    p("New Jersey Senior Freeze Property Tax Reimbursement", "housing", "Provides property tax relief through reimbursement for eligible seniors 65+ homeowners.", "Age 65+; Income <$157000/mo", "1-800-882-6597"),
    p("New Jersey Family Caregiver Support Program", "caregiver", "Offers support services including caregiver training, respite care, and counseling for family caregivers.", "Age 60+; Income <$36000/mo", "1-877-222-3737"),
    p("New Jersey Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-877-582-6995"),
    p("New Jersey Home Delivered Meals", "food", "Delivers nutritious meals to homebound seniors 60+ unable to prepare food themselves.", "Age 60+", "1-877-222-3737"),
    p("New Jersey SSI State Supplement", "income", "State supplement to federal SSI payments for aged, blind, and disabled recipients.", "Age 65+; Income <$998/mo; Disability req", "1-800-772-1213"),
    p("New Jersey Senior Legal Services", "income", "Provides free legal assistance to low-income seniors 60+ on issues like benefits and housing.", "Age 60+; Income <$30000/mo", "1-888-576-5529"),
  ]
);

// ── NEW MEXICO ───────────────────────────────────────────────────────────────
addState("New Mexico", "NM", "new-mexico",
  "New Mexico's Mi Via self-directed waiver and Medically Fragile Waiver provide Medicaid home and community-based services for individuals with disabilities.",
  [
    p("Centennial Care Aged, Blind, and Disabled", "healthcare", "New Mexico's Medicaid program for seniors aged 65+, blind, or disabled providing health and long-term care.", "Age 65+; Income <$2901/mo", "1-800-283-4465"),
    p("Qualified Medicare Beneficiary (QMB)", "healthcare", "State-administered program paying Medicare Part A and B premiums, deductibles, and coinsurance.", "Age 65+; Income <$1304/mo; Medicaid req", "1-800-283-4465"),
    p("Centennial Care Home and Community Based Services Waiver", "healthcare", "Medicaid waiver programs providing institutional-level services at home and in the community.", "Age 65+; Income <$2901/mo; Medicaid req", "1-866-400-0936"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for low-income seniors.", "Age 60+; Income <$1984/mo", "1-888-328-2656"),
    p("New Mexico Senior Health Insurance Assistance Program (SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on plan choices, appeals, and enrollment.", "Age 65+", "1-800-432-2080"),
    p("New Mexico Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-800-543-4636"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Helps eligible low-income households, including seniors, pay heating and cooling costs.", "Age 60+; Income <$3090/mo", "1-800-432-3647"),
    p("New Mexico Home-Delivered Meals", "food", "Provides nutritious home-delivered meals to homebound seniors 60+ unable to prepare their own food.", "Age 60+", "1-866-463-3035"),
    p("New Mexico Legal Aid Senior Services", "healthcare", "Provides free civil legal assistance to low-income seniors 60+ on issues like housing and benefits.", "Age 60+; Income <$1984/mo", "1-833-545-4357"),
    p("New Mexico Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, counseling, and supplemental services.", "Age 60+; Income <$36000/mo", "1-866-463-3035"),
  ]
);

// ── NEW YORK ─────────────────────────────────────────────────────────────────
addState("New York", "NY", "new-york",
  "New York's Managed Long-Term Care and CDPAP programs provide comprehensive home and community-based services and self-directed personal care for Medicaid-eligible residents.",
  [
    p("Medicaid for Aged, Blind and Disabled", "healthcare", "New York's Medicaid program for seniors 65+ and disabled individuals providing comprehensive health coverage.", "Age 65+; Income <$1800/mo", "1-800-541-2831"),
    p("Medicare Savings Program (QMB/SLMB/QI)", "healthcare", "State-administered program that helps pay Medicare premiums, deductibles, and coinsurance.", "Age 65+; Income <$1800/mo", "1-800-541-2831"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "New York's food assistance program providing monthly benefits to eligible seniors via EBT card.", "Age 60+", "1-800-342-3009"),
    p("Elderly Pharmaceutical Insurance Coverage (EPIC)", "healthcare", "New York's State Pharmaceutical Assistance Program providing prescription drug cost-sharing assistance.", "Age 65+; Income <$1800/mo", "1-800-332-3742"),
    p("Home and Community-Based Services (HCBS) Waiver", "healthcare", "Medicaid waiver program providing home care, personal care assistance, and adult day care.", "Age 65+; Income <$2433/mo; Medicaid req", "1-800-541-2831"),
    p("Health Insurance Information, Counseling and Assistance Program (HIICAP)", "healthcare", "New York's State Health Insurance Assistance Program providing free, unbiased Medicare counseling.", "Age 60+", "1-800-701-0501"),
    p("Low Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists eligible low-income seniors with heating and cooling costs and utility bills.", "Age 60+", "1-800-342-3009"),
    p("State Supplemental Security Income (SSI) Supplement", "income", "New York provides a state supplement to federal SSI benefits for eligible seniors and disabled individuals.", "Age 65+; Disability req", "1-800-342-3009"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Comprehensive care program for frail seniors 55+ that combines medical services and long-term care.", "Age 55+; Medicaid req", "1-800-541-2831"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in nursing homes, adult care facilities, and assisted living programs.", "Age 60+", "1-844-753-3765"),
    p("Older Americans Act Nutrition Program (Meals on Wheels)", "food", "Provides home-delivered meals and congregate dining services to seniors 60+.", "Age 60+", "1-800-342-3009"),
    p("Property Tax Relief for Seniors", "housing", "New York offers property tax exemptions and relief programs for seniors 65+ with limited income.", "Age 65+", "1-518-457-2898"),
    p("Senior Legal Services", "income", "Provides free legal assistance to low-income seniors on issues including housing, benefits, and elder abuse.", "Age 60+", "1-800-342-3009"),
    p("Caregiver Resource Center", "caregiver", "Provides support services, training, and resources for family caregivers of seniors.", "", "1-800-342-3009"),
  ]
);

// ── NORTH CAROLINA ───────────────────────────────────────────────────────────
addState("North Carolina", "NC", "north-carolina",
  "North Carolina's CAP/DA and Innovations waivers provide Medicaid home and community-based services for adults with physical disabilities and intellectual disabilities.",
  [
    p("Regular Medicaid / Aged Blind and Disabled", "healthcare", "North Carolina's Medicaid program for seniors aged 65+ and disabled individuals providing health coverage.", "Age 65+; Income <$1305/mo", "1-800-662-7030"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help low-income Medicare beneficiaries.", "Age 65+; Income <$1305/mo; Medicaid req", "1-800-662-7030"),
    p("Food and Nutrition Services (SNAP)", "food", "North Carolina's SNAP program provides monthly benefits to low-income seniors for food purchases.", "Age 65+; Income <$1924/mo", "1-800-662-7030"),
    p("Community Alternatives Program for Disabled Adults (CAP/DA)", "healthcare", "Medicaid HCBS waiver providing in-home personal care, adult day health, and home modifications.", "Age 65+; Income <$1305/mo; Disability req; Medicaid req", "1-800-662-7030"),
    p("Senior Health Insurance Information Program (SHIIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries and caregivers on Medicare options.", "Age 65+", "1-855-408-1212"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Combines Medicare and Medicaid benefits into comprehensive care for frail seniors 55+.", "Age 55+; Income <$1305/mo; Disability req; Medicaid req", "1-800-662-7030"),
    p("Low-Income Energy Assistance Program (LIEAP)", "utilities", "Provides one-time payments to help eligible low-income seniors pay heating bills.", "Age 65+; Income <$2400/mo", "1-800-662-7030"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services including respite care, caregiver training, and counseling.", "Age 60+; Income <$3000/mo", "1-866-219-5262"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and adult care homes.", "Age 65+", "1-800-732-2607"),
    p("Home-Delivered Meals (Eat Right to Age Well)", "food", "Provides nutritious meals delivered to homebound seniors through local Area Agencies on Aging.", "Age 60+; Income <$2500/mo", "1-866-219-5262"),
    p("Special Assistance (State SSI Supplement)", "income", "State supplement to federal SSI for low-income aged, blind, and disabled adults.", "Age 65+; Income <$800/mo; Medicaid req", "1-800-662-7030"),
    p("Legal Aid of North Carolina Senior Legal Services", "healthcare", "Provides free civil legal assistance to low-income seniors 60+ on issues including housing and benefits.", "Age 60+; Income <$2500/mo", "1-866-219-5262"),
    p("Circuit Breaker Property Tax Deferral", "housing", "Allows eligible seniors 65+ to defer a portion of property taxes on their principal residence.", "Age 65+; Income <$31500/mo", "1-877-252-3052"),
  ]
);

// ── NORTH DAKOTA ─────────────────────────────────────────────────────────────
addState("North Dakota", "ND", "north-dakota",
  "North Dakota's Medicaid HCBS waivers provide home-based care for elderly and disabled residents and specialized supports for individuals with traumatic brain injuries.",
  [
    p("Aged, Blind and Disabled (ABD) Medicaid", "healthcare", "Provides Medicaid health coverage for North Dakota residents aged 65+, blind, or disabled.", "Age 65+; Income <$1200/mo", "1-844-854-4825"),
    p("Home and Community-Based Services (HCBS) Waiver", "healthcare", "Medicaid 1915(c) waiver providing long-term home and community-based services to prevent nursing home placement.", "Age 65+; Income <$2500/mo; Medicaid req", "1-800-755-2719"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI for low-income Medicare beneficiaries.", "Age 65+; Income <$1300/mo", "1-844-854-4825"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides food assistance benefits to low-income North Dakota seniors for purchasing nutritious food.", "Age 65+; Income <$1984/mo", "1-866-293-9377"),
    p("LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Assists eligible low-income North Dakota households, including seniors, with heating and cooling costs.", "Age 60+; Income <$2825/mo", "1-800-634-5263"),
    p("Senior Medicare Patrol (SMP)", "healthcare", "Free counseling and education on Medicare rights, coverage, and fraud prevention for seniors.", "Age 65+", "1-855-308-8947"),
    p("Legal Services of North Dakota - Senior Legal Helpline", "healthcare", "Provides free legal assistance to low-income North Dakota seniors on housing and benefits issues.", "Age 60+; Income <$2500/mo", "1-800-634-5269"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services to family caregivers of North Dakota seniors 60+ including respite care.", "Age 60+", "1-800-755-2719"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for rights and resolves complaints for North Dakota nursing home and assisted living residents.", "Age 65+", "1-800-663-7157"),
    p("Senior Dining Services (Home-Delivered Meals)", "food", "Delivers nutritious meals to homebound North Dakota seniors unable to prepare their own food.", "Age 60+", "1-800-755-2719"),
  ]
);

// ── OHIO ─────────────────────────────────────────────────────────────────────
addState("Ohio", "OH", "ohio",
  "Ohio's PASSPORT Program and Assisted Living Waiver help seniors and adults with disabilities access Medicaid-funded community-based care as alternatives to nursing home placement.",
  [
    p("Aged, Blind, or Disabled (ABD) Medicaid", "healthcare", "Ohio's Medicaid program for individuals aged 65+, blind, or disabled with low income.", "Age 65+; Income <$994/mo", "1-800-324-8680"),
    p("PASSPORT Waiver", "healthcare", "Home and Community-Based Services Medicaid waiver providing long-term care services at home.", "Age 60+; Income <$1491/mo; Medicaid req", "1-866-243-5678"),
    p("Medicare Premium Assistance Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI that help pay Medicare costs.", "Age 65+; Income <$7330/mo; Medicaid req", "1-800-324-8680"),
    p("Ohio SNAP", "food", "Ohio's food assistance program providing monthly benefits via EBT card for food purchases.", "Age 65+; Income <$1984/mo", "1-866-244-0061"),
    p("MyCare Ohio PACE", "healthcare", "Program of All-Inclusive Care for the Elderly providing comprehensive medical and social services.", "Age 55+; Income <$2500/mo; Disability req; Medicaid req", "1-800-324-8680"),
    p("Ohio Senior Health Insurance Information Program (OSHIIP)", "healthcare", "Free counseling and assistance with Medicare questions, plan choices, and appeals for seniors.", "Age 65+", "1-800-686-1578"),
    p("LIHEAP", "utilities", "Low Income Home Energy Assistance Program helps eligible low-income Ohioans pay energy bills.", "Age 65+; Income <$3092/mo", "1-800-282-0880"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services including caregiver training, respite care, and counseling.", "Age 60+; Income <$3092/mo", "1-866-243-5678"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-800-282-1206"),
    p("Homestead Exemption", "housing", "Property tax relief program providing reduction in taxable value for owner-occupied homes.", "Age 65+", "1-888-857-0060"),
    p("Home-Delivered Meals (Golden Buckeye Nutrition Program)", "food", "Provides nutritious meals delivered to homebound seniors who are unable to prepare their own food.", "Age 60+; Income <$2500/mo", "1-866-243-5678"),
    p("Ohio Legal Services for Seniors", "income", "Provides free legal assistance to low-income Ohio seniors facing issues like housing and benefits.", "Age 60+; Income <$2000/mo", "1-877-367-3777"),
  ]
);

// ── OKLAHOMA ─────────────────────────────────────────────────────────────────
addState("Oklahoma", "OK", "oklahoma",
  "Oklahoma's ADvantage Waiver and Community Waiver provide home and community-based Medicaid services for elderly residents and adults with intellectual disabilities.",
  [
    p("SoonerCare Aged Blind and Disabled", "healthcare", "Provides Medicaid health coverage to low-income seniors aged 65+ who are aged, blind, or disabled.", "Age 65+; Income <$1305/mo; Disability req", "1-800-987-7707"),
    p("ADvantage Waiver Program", "healthcare", "Home and community-based services waiver providing personal care, adult day health, and respite.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-435-4711"),
    p("SoonerCare Medicare Savings Programs", "healthcare", "Helps low-income Medicare beneficiaries pay for Medicare premiums, deductibles, and coinsurance.", "Age 65+; Income <$1305/mo; Medicaid req", "1-800-987-7707"),
    p("SNAP Food Benefits", "food", "Provides monthly food assistance benefits to low-income seniors to purchase groceries.", "Age 65+; Income <$1980/mo", "1-800-435-4711"),
    p("Oklahoma Senior Health Insurance Assistance Program (SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on plan choices, appeals, and enrollment.", "Age 65+", "1-800-522-0078"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists low-income households, including seniors, with heating and cooling bills.", "Age 60+; Income <$2490/mo", "1-800-658-4889"),
    p("National Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers.", "Age 60+; Income <$3120/mo", "1-800-211-2112"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-678-4566"),
    p("Commodity Supplemental Food Program (CSFP) and Home-Delivered Meals", "food", "Provides monthly food boxes to low-income seniors 60+ and home-delivered meals.", "Age 60+; Income <$1980/mo", "1-800-234-7260"),
    p("Legal Aid Services of Oklahoma - Senior Legal Hotline", "healthcare", "Provides free legal advice and representation for low-income seniors on benefits and housing.", "Age 60+; Income <$1980/mo", "1-800-222-5297"),
  ]
);

// ── OREGON ───────────────────────────────────────────────────────────────────
addState("Oregon", "OR", "oregon",
  "Oregon's K Plan and APD program provide comprehensive home and community-based long-term care services through coordinated care organizations and DSHS offices.",
  [
    p("Oregon Medicaid - Aged and Physically Disabled (APD) Waiver", "healthcare", "Medicaid program providing long-term services and supports including home and community-based services.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-273-0557"),
    p("Oregon Project Independence - Medicaid (OPI-M)", "healthcare", "Section 1115 Medicaid demonstration waiver for seniors 60+ and physically disabled individuals.", "Age 60+; Income <$4800/mo", "1-800-273-0557"),
    p("Family Caregiver Support Program", "caregiver", "Provides caregiver education, training, and community support services for unpaid caregivers of seniors.", "", "1-800-273-0557"),
  ]
);

// ── PENNSYLVANIA ─────────────────────────────────────────────────────────────
addState("Pennsylvania", "PA", "pennsylvania",
  "Pennsylvania's LIFE (PACE) program and Aging Waiver help seniors access comprehensive Medicaid long-term care services while remaining in their communities.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "Provides basic healthcare and long-term care services for Pennsylvania residents aged 65+.", "Age 65+; Income <$988/mo", "1-800-692-7462"),
    p("Community HealthChoices", "healthcare", "Medicaid managed care waiver program offering home and community-based services for seniors.", "Age 65+; Income <$988/mo; Medicaid req", "1-800-692-7462"),
    p("Medicare Savings Programs", "healthcare", "Helps low-income Medicare beneficiaries pay for premiums, deductibles, and coinsurance.", "Age 65+; Income <$1400/mo", "1-800-692-7462"),
    p("SNAP", "food", "Provides monthly food assistance benefits to low-income seniors to purchase groceries.", "Age 65+; Income <$1980/mo", "1-800-692-7462"),
    p("Pennsylvania LIFE Program (PACE)", "healthcare", "Program of All-Inclusive Care for the Elderly providing comprehensive medical care for frail seniors.", "Age 55+; Income <$2901/mo; Medicaid req", "1-800-692-7462"),
    p("Pharmaceutical Assistance Contract for the Elderly (PACE)", "healthcare", "State Pharmaceutical Assistance Program helping seniors pay for prescription drugs.", "Age 65+; Income <$3350/mo", "1-800-225-7223"),
    p("LIHEAP", "utilities", "Assists eligible low-income households, including seniors, with heating and cooling costs.", "Age 60+; Income <$2500/mo", "1-866-557-2555"),
    p("Pennsylvania SHIP", "healthcare", "State Health Insurance Assistance Program provides free, unbiased counseling on Medicare.", "Age 65+", "1-800-783-7067"),
    p("Property Tax/Rent Rebate Program", "housing", "Provides rebates for property taxes or rent paid by eligible seniors and disabled persons.", "Age 65+; Income <$16000/mo", "1-888-222-9190"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-783-8048"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors through Area Agencies on Aging.", "Age 65+; Income <$2000/mo", "1-800-753-8827"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services for family caregivers of seniors 60+, including counseling and respite.", "Age 60+; Income <$3000/mo", "1-717-783-1550"),
    p("State SSI Supplement", "income", "Pennsylvania provides a small monthly supplement to federal SSI payments for eligible recipients.", "Age 65+; Income <$943/mo; Disability req", "1-800-692-7462"),
    p("Pennsylvania Legal Aid Network - Senior Legal Services", "income", "Provides free civil legal assistance to low-income seniors for issues like benefits and housing.", "Age 65+; Income <$2000/mo", "1-800-327-9250"),
  ]
);

// ── RHODE ISLAND ─────────────────────────────────────────────────────────────
addState("Rhode Island", "RI", "rhode-island",
  "Rhode Island's Global Consumer Choice Compact Waiver and Personal Choice Program provide integrated Medicaid home care and self-directed personal care services.",
  [
    p("Medicaid for Elders and Adults with Disabilities (EAD)", "healthcare", "Provides Medicaid coverage for seniors aged 65+ who are disabled or elderly with limited income.", "Age 65+; Income <$1304/mo; Disability req", "1-855-697-4347"),
    p("Long Term Services and Supports (LTSS) Waiver", "healthcare", "HCBS Medicaid waiver providing personal care, meal preparation, and home-based support services.", "Age 65+; Income <$2901/mo; Medicaid req", "1-855-697-4347"),
    p("Rhode Island Medicare Savings Program", "healthcare", "State-administered programs including QMB, SLMB, and QI for low-income Medicare beneficiaries.", "Age 65+; Income <$1304/mo", "1-855-697-4347"),
    p("Rhode Island SNAP", "food", "Provides food assistance benefits through an EBT card to low-income seniors.", "Age 65+; Income <$1924/mo", "1-855-697-4347"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Combines Medicare and Medicaid benefits into comprehensive care for dual-eligible seniors.", "Age 65+; Income <$2901/mo; Medicaid req", "1-855-697-4347"),
    p("Rhode Island LIHEAP", "utilities", "Low-Income Home Energy Assistance Program provides grants to help eligible seniors pay energy bills.", "Age 65+; Income <$3333/mo", "1-800-851-1660"),
    p("Rhode Island State SSI Supplement", "income", "Provides monthly cash supplement to SSI recipients who are aged, blind, or disabled.", "Age 65+; Income <$943/mo; Disability req", "1-855-697-4347"),
    p("Rhode Island SHIP", "healthcare", "State Health Insurance Assistance Program offers free counseling on Medicare options and appeals.", "Age 65+", "1-855-462-9702"),
    p("Rhode Island Property Tax Relief for Seniors", "housing", "Provides tax credits or freezes for eligible senior homeowners and renters based on income.", "Age 65+; Income <$35750/mo", "1-401-574-8970"),
    p("Rhode Island Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in nursing homes, assisted living, and other long-term care facilities.", "Age 65+", "1-401-462-4444"),
    p("Meals on Wheels Rhode Island", "food", "Delivers nutritious meals to homebound seniors to promote health and independence.", "Age 65+; Income <$1924/mo", "1-401-331-2829"),
    p("Rhode Island Family Caregiver Support Program", "caregiver", "Provides support services including respite care, counseling, training, and supplemental services.", "Age 65+; Income <$3333/mo", "1-800-292-2600"),
    p("Rhode Island Legal Services Senior Law Project", "healthcare", "Provides free civil legal assistance to low-income seniors on issues like housing and benefits.", "Age 65+; Income <$1924/mo", "1-800-499-1979"),
  ]
);

// ── SOUTH CAROLINA ───────────────────────────────────────────────────────────
addState("South Carolina", "SC", "south-carolina",
  "South Carolina's Community Long-Term Care and Community Choices programs provide Medicaid home and community-based services for seniors and adults with disabilities.",
  [
    p("Healthy Connections Aged, Blind or Disabled (ABD)", "healthcare", "South Carolina's Medicaid program for seniors aged 65+, blind, or disabled with limited income.", "Age 65+; Income <$1305/mo", "(888) 549-0820"),
    p("Community Choices Waiver", "healthcare", "Home and community-based services Medicaid waiver for frail elderly aged 65+ requiring nursing-level care.", "Age 65+; Income <$2982/mo; Medicaid req", "(888) 549-0820"),
    p("Healthy Connections Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI for low-income Medicare beneficiaries.", "Age 65+; Income <$1305/mo", "(888) 549-0820"),
    p("SNAP (Supplemental Nutrition Assistance Program)", "food", "South Carolina's food assistance program providing monthly benefits to low-income seniors.", "Age 60+; Income <$1980/mo", "1-800-476-3663"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Combines Medicare and Medicaid benefits into comprehensive care for dual-eligible frail seniors.", "Age 55+; Income <$2982/mo; Medicaid req", "(888) 549-0820"),
    p("South Carolina SHIP", "healthcare", "State Health Insurance Assistance Program providing free, unbiased counseling on Medicare options.", "Age 65+", "1-800-949-1003"),
    p("LIHEAP (Low-Income Home Energy Assistance Program)", "utilities", "Federal program helping low-income seniors pay heating and cooling costs.", "Age 60+; Income <$2800/mo", "1-866-675-6623"),
    p("South Carolina Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-800-616-1762"),
    p("Home Delivered Meals (SC Department on Aging)", "food", "Provides nutritious meals delivered to homebound seniors unable to prepare food.", "Age 60+; Income <$2500/mo", "1-800-616-1762"),
    p("Family Caregiver Support Program", "caregiver", "Supports family caregivers of seniors 60+ with services like respite care, counseling, and training.", "Age 60+; Income <$3000/mo", "1-800-616-1762"),
    p("South Carolina Legal Services Senior Legal Services", "income", "Free legal assistance for low-income seniors on issues like housing, benefits, and elder abuse.", "Age 60+; Income <$2200/mo", "1-888-346-5592"),
  ]
);

// ── SOUTH DAKOTA ─────────────────────────────────────────────────────────────
addState("South Dakota", "SD", "south-dakota",
  "South Dakota offers Medicaid HCBS waivers for elderly and disabled residents and developmental disability services through the Department of Social Services.",
  [
    p("Regular Medicaid / Aged, Blind, and Disabled", "healthcare", "Provides healthcare coverage and long-term care services to low-income seniors aged 65+.", "Age 65+; Income <$967/mo", "1-800-305-3064"),
    p("HOPE Waiver", "healthcare", "Home and Community-Based Services waiver for nursing home-eligible seniors aged 65+.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-305-3064"),
    p("Medicare Savings Program", "healthcare", "Helps low-income Medicare beneficiaries pay for premiums, deductibles, and coinsurance.", "Age 65+; Income <$967/mo", "1-800-305-3064"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides monthly benefits to low-income households to purchase nutritious food.", "Age 65+; Income <$1981/mo", "1-877-382-2180"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists eligible low-income households with heating and cooling costs and crisis assistance.", "Age 60+; Income <$2798/mo", "1-605-773-4225"),
    p("South Dakota Senior Health Insurance Assistance Program (SHIP)", "healthcare", "Offers free, unbiased counseling and assistance for Medicare beneficiaries.", "Age 65+", "1-800-748-3447"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors through the Nutrition Services program.", "Age 60+", "1-800-748-3447"),
    p("National Family Caregiver Support Program", "caregiver", "Provides support services including respite care, caregiver training, and counseling.", "Age 60+", "1-800-748-3447"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-748-3447"),
    p("Senior Legal Services", "income", "Provides free legal assistance to low-income seniors on issues like benefits and housing.", "Age 60+; Income <$2798/mo", "1-800-658-3529"),
  ]
);

// ── TENNESSEE ────────────────────────────────────────────────────────────────
addState("Tennessee", "TN", "tennessee",
  "Tennessee's TennCare CHOICES and ECF CHOICES programs provide Medicaid managed long-term care for seniors, adults with physical disabilities, and those with developmental disabilities.",
  [
    p("TennCare CHOICES in Long-Term Services and Supports", "healthcare", "Tennessee's Medicaid program for seniors aged 65+ and adults 21+ with physical disabilities.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-342-3145"),
    p("TennCare Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI for Medicare beneficiaries.", "Age 65+; Income <$1605/mo", "1-877-235-6847"),
    p("TennCare CHOICES HCBS Waiver", "healthcare", "Home and community-based services waiver under TennCare CHOICES program for at-home care.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-342-3145"),
    p("Tennessee SNAP (Supplemental Nutrition Assistance Program)", "food", "Provides food assistance benefits via EBT card to low-income seniors.", "Age 65+; Income <$1984/mo", "1-866-311-4287"),
    p("Tennessee State Health Insurance Assistance Program (SHIP)", "healthcare", "Free counseling and enrollment assistance for Medicare beneficiaries.", "Age 65+", "1-877-801-0795"),
    p("Tennessee LIHEAP (Low Income Home Energy Assistance Program)", "utilities", "Federally funded program helping eligible low-income households with heating and cooling costs.", "Age 60+; Income <$3092/mo", "1-866-674-6327"),
    p("Tennessee Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-800-848-6540"),
    p("Tennessee Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors through Older Americans Act funding.", "Age 60+; Income <$1984/mo", "1-866-836-4752"),
    p("Tennessee Family Caregiver Support Program", "caregiver", "Offers support services for family caregivers of seniors 60+, including respite care and counseling.", "Age 60+; Income <$1984/mo", "1-866-836-4752"),
    p("Tennessee Senior Legal Services", "income", "Provides free legal assistance to low-income seniors through Area Agencies on Aging.", "Age 60+; Income <$1984/mo", "1-866-836-4752"),
  ]
);

// ── TEXAS ────────────────────────────────────────────────────────────────────
addState("Texas", "TX", "texas",
  "Texas offers Medicaid waiver programs through the Health and Human Services Commission (HHSC) to help seniors and adults with disabilities receive long-term care services at home or in the community.",
  [
    p("STAR+PLUS Home and Community-Based Services", "healthcare", "Medicaid managed care program for adults 65+ or disabled. Covers personal attendant services and community-based care.", "Age 21+; Income <$2901/mo", "1-877-782-6440"),
    p("Texas Medicare Savings Programs", "healthcare", "State-administered programs that pay Medicare premiums and costs for low-income beneficiaries.", "Income <$1781/mo", "1-800-252-9240"),
    p("Texas SNAP Food Benefits", "food", "Monthly benefits loaded onto a Lone Star Card to buy groceries. Seniors 60+ can apply with simplified rules.", "Income <$1580/mo", "2-1-1"),
    p("Texas Medicaid for the Elderly and People with Disabilities", "healthcare", "Full Medicaid coverage for seniors 65+ and people with disabilities with limited income.", "Age 65+; Income <$967/mo", "1-800-252-9240"),
    p("Texas SHIP Medicare Counseling", "healthcare", "Free, unbiased help understanding Medicare options. Certified counselors help compare plans.", "", "1-800-252-9240"),
    p("Texas Comprehensive Energy Assistance Program (CEAP/LIHEAP)", "utilities", "Helps pay heating and cooling bills. One-time payment sent directly to your utility company.", "Income <$1928/mo", "2-1-1"),
    p("Primary Home Care (Community Care)", "healthcare", "Personal attendant services for Medicaid recipients who need help with daily activities at home.", "Medicaid req", "1-800-252-9240"),
    p("Texas Respite Care Services", "caregiver", "Temporary relief for family caregivers. Someone else cares for your loved one so you can rest.", "", "1-800-252-9240"),
    p("Texas Meals on Wheels", "food", "Free or low-cost nutritious meals delivered to your home. Available to adults 60+ regardless of income.", "Age 60+", "1-800-252-9240"),
    p("Texas PACE Programs", "healthcare", "All-inclusive care centers in select Texas cities providing comprehensive medical and social services.", "Age 55+", "512-487-3450"),
    p("Texas Long-Term Care Ombudsman", "healthcare", "Free advocates who resolve complaints and protect the rights of people in nursing homes.", "", "1-800-252-2412"),
    p("Texas Weatherization Assistance Program", "utilities", "Free home improvements to reduce energy costs including insulation, weather stripping, and furnace repair.", "Income <$2570/mo", "2-1-1"),
    p("Texas Legal Services for Seniors", "income", "Free legal help for seniors 60+ on issues like benefits denials, housing disputes, and elder abuse.", "Age 60+", "1-800-252-9240"),
    p("Texas Senior Companion Program", "caregiver", "Trained volunteers visit seniors who are homebound to provide companionship and light assistance.", "Age 60+", "1-800-252-9240"),
    p("Senior Community Service Employment Program (SCSEP)", "income", "Paid job training for low-income seniors 55+. Work at community organizations while learning skills.", "Age 55+; Income <$1580/mo", "1-800-252-9240"),
  ]
);

// ── UTAH ─────────────────────────────────────────────────────────────────────
addState("Utah", "UT", "utah",
  "Utah's New Choices Waiver and Physical Disability HCBS waiver help seniors and adults with disabilities remain in the community with Medicaid-funded supports.",
  [
    p("Medicaid for Aged, Blind or Disabled", "healthcare", "Medical assistance program for individuals aged 65+ or older, blind, or disabled with limited income.", "Age 65+; Income <$1255/mo", "1-801-538-6155"),
    p("Aging Waiver (Home and Community Based Services)", "healthcare", "Medicaid waiver program for seniors 65+ who would be medically appropriate for nursing facility placement.", "Age 65+; Income <$1255/mo; Medicaid req", "1-801-538-3910"),
    p("Medicaid Expansion", "healthcare", "Extended Medicaid eligibility to Utah adults whose annual income is up to 138% of the federal poverty level.", "Income <$1467/mo", "1-801-538-6155"),
    p("New Choices Waiver", "healthcare", "Medicaid waiver program for individuals in nursing facilities who want to transition to community settings.", "Income <$2901/mo; Medicaid req", "1-801-538-6155"),
    p("Physical Disabilities Waiver", "healthcare", "Medicaid waiver program providing services to help people with physical disabilities live independently.", "Income <$1255/mo; Disability req; Medicaid req", "1-801-538-6155"),
  ]
);

// ── VERMONT ──────────────────────────────────────────────────────────────────
addState("Vermont", "VT", "vermont",
  "Vermont's Choices for Care Waiver and Enhanced Residential Care program provide Medicaid home and community-based services coordinated through DAIL.",
  [
    p("Medicaid for the Aged, Blind and Disabled (MABD)", "healthcare", "Provides health coverage including long-term care services for low-income seniors 65+.", "Age 65+; Income <$1333/mo; Disability req", "855-899-9600"),
    p("Choices for Care HCBS Waiver", "healthcare", "Medicaid waiver providing home and community-based services to seniors requiring nursing home level of care.", "Age 65+; Income <$2901/mo; Medicaid req", "855-899-9600"),
    p("Medicare Savings Programs (QMB/SLMB/QI)", "healthcare", "State programs that help low-income Medicare beneficiaries pay for premiums and costs.", "Age 65+; Income <$1333/mo", "855-899-9600"),
    p("3Squares Vermont (SNAP)", "food", "Provides monthly benefits to low-income households to purchase nutritious food.", "Age 60+; Income <$1924/mo", "1-800-479-6151"),
    p("State SSI Supplement (Essential Person Benefit)", "income", "Provides state supplement to federal SSI for aged, blind, and disabled individuals.", "Age 65+; Income <$914/mo; Disability req", "1-800-479-6151"),
    p("General Assistance Fuel", "utilities", "Vermont's LIHEAP program provides financial assistance to eligible low-income households for heating costs.", "Age 60+; Income <$3095/mo", "1-800-649-5774"),
    p("Property Tax Adjustment (Renter/Property Tax Credit)", "housing", "Provides income-based credits to seniors for property taxes or rent paid.", "Age 62+; Income <$47000/mo", "802-828-2865"),
    p("Health Care Navigator (SHIP)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on plan choices, appeals, and enrollment.", "Age 65+", "1-800-642-5116"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-888-745-2255"),
    p("Family Caregiver Support Program", "caregiver", "Offers support services including respite care, counseling, training, and supplies for family caregivers.", "Age 60+; Income <$3095/mo", "1-800-642-5116"),
    p("Legal Services for Older Vermonters", "healthcare", "Provides free legal assistance to low-income seniors on issues like benefits, housing, and elder abuse.", "Age 60+; Income <$3095/mo", "1-800-642-5116"),
    p("Home-Delivered Meals", "food", "Delivers nutritious meals to homebound seniors who can't prepare their own food.", "Age 60+", "1-800-642-5116"),
  ]
);

// ── VIRGINIA ─────────────────────────────────────────────────────────────────
addState("Virginia", "VA", "virginia",
  "Virginia's CCC+ and EDCD Waiver programs provide integrated Medicaid managed care and self-directed personal care services for seniors and adults with disabilities.",
  [
    p("Medicaid for Aged, Blind, or Disabled (ABD)", "healthcare", "Provides full Medicaid benefits including doctor visits, hospital care, and long-term care services.", "Age 65+; Income <$1781/mo", "1-855-242-8282"),
    p("Medicare Savings Programs (QMB, SLMB, QI)", "healthcare", "State programs that help low-income Medicare beneficiaries pay for Medicare premiums and costs.", "Age 65+; Income <$1781/mo", "1-855-242-8282"),
    p("Commonwealth Coordinated Care Plus (CCC Plus) Waiver", "healthcare", "Medicaid home and community-based services (HCBS) waiver providing long-term care at home.", "Age 65+; Income <$1781/mo; Medicaid req", "1-855-242-8282"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Provides monthly benefits via EBT card to purchase nutritious food for eligible seniors.", "Age 65+; Income <$1980/mo", "1-800-552-3431"),
    p("Program of All-Inclusive Care for the Elderly (PACE)", "healthcare", "Comprehensive program providing all Medicare and Medicaid services plus additional support.", "Age 55+; Income <$1781/mo; Disability req; Medicaid req", "1-855-242-8282"),
    p("Virginia Insurance Counseling and Assistance Program (VICAP)", "healthcare", "State Health Insurance Assistance Program (SHIP) offering free, unbiased counseling on Medicare.", "Age 65+", "1-800-552-3402"),
    p("Low-Income Home Energy Assistance Program (LIHEAP)", "utilities", "Assists eligible low-income households, including seniors, with heating and cooling costs.", "Age 60+; Income <$2355/mo", "1-800-552-3431"),
    p("Virginia Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers.", "Age 60+; Income <$32500/mo", "1-800-552-3402"),
    p("Virginia Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities including nursing homes and assisted living.", "Age 65+", "1-800-552-3402"),
    p("Virginia Home-Delivered Meals Program", "food", "Delivers nutritious meals to homebound seniors 60+ who can't prepare their own meals.", "Age 60+", "1-800-552-3402"),
    p("Virginia Property Tax Exemption for Elderly/Disabled", "housing", "Provides partial property tax relief for homeowners 65+ or disabled with income limits.", "Age 65+; Income <$50000/mo", "1-804-367-8500"),
    p("Virginia Senior Citizens Law Project", "healthcare", "Provides free legal services to low-income seniors 60+ on issues like benefits, housing, and elder abuse.", "Age 60+; Income <$2355/mo", "1-800-868-3434"),
  ]
);

// ── WASHINGTON ───────────────────────────────────────────────────────────────
addState("Washington", "WA", "washington",
  "Washington's COPES and Community First Choice programs provide comprehensive home and community-based Medicaid services for seniors and adults with disabilities.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "Provides healthcare and long-term care services to financially limited Washington seniors 65+.", "Age 65+; Income <$967/mo", "1-800-562-3022"),
    p("Medicare Savings Programs", "healthcare", "Helps low-income Medicare beneficiaries pay for premiums, deductibles, and coinsurance.", "Age 65+; Income <$967/mo", "1-800-562-3022"),
    p("Basic Food Program", "food", "Washington's SNAP program providing monthly benefits to buy food for low-income households.", "Age 65+; Income <$2212/mo", "1-877-501-2233"),
    p("Tailored Supports for Older Adults", "healthcare", "HCBS waiver providing long-term care services at home for adults 55+ needing nursing facility level of care.", "Age 55+; Income <$2901/mo", "1-855-643-0659"),
    p("Washington State Health Insurance Assistance Program", "healthcare", "Free counseling and assistance for Medicare beneficiaries and caregivers on Medicare options.", "Age 65+", "1-800-562-6900"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-562-6028"),
    p("Washington Energy Assistance Program", "utilities", "Provides one-time energy assistance grants to low-income households to pay heating and cooling costs.", "Age 60+; Income <$3095/mo", "1-866-374-6371"),
    p("Senior Legal Services", "income", "Free legal assistance for low-income seniors 60+ on public benefits, housing, and consumer issues.", "Age 60+; Income <$2350/mo", "1-888-201-1014"),
    p("Family Caregiver Support Program", "caregiver", "Support services for family caregivers of seniors 60+ including respite care, training, and counseling.", "Age 60+", "1-866-789-1903"),
    p("Home Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors 60+ who can't prepare their own food.", "Age 60+", "1-800-422-3263"),
  ]
);

// ── WEST VIRGINIA ────────────────────────────────────────────────────────────
addState("West Virginia", "WV", "west-virginia",
  "West Virginia's Aged and Disabled Waiver and IIMM Waiver provide Medicaid home and community-based services for elderly residents and individuals with intellectual disabilities.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "West Virginia's ABD Medicaid provides healthcare and long-term care services for seniors 65+.", "Age 65+; Income <$967/mo", "1-877-598-5820"),
    p("Aged and Disabled Waiver (ADW)", "healthcare", "West Virginia's Aged and Disabled Waiver provides home and community-based services at home.", "Age 65+; Income <$2901/mo; Medicaid req", "1-304-558-3317"),
    p("Medicare Savings Program", "healthcare", "West Virginia's Medicare Savings Programs (QMB, SLMB, QI) help low-income Medicare beneficiaries.", "Age 65+; Income <$967/mo", "1-877-598-5820"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "West Virginia's SNAP provides monthly benefits via EBT card to buy healthy food.", "Age 65+; Income <$1922/mo", "1-877-211-0030"),
    p("Low-Income Energy Assistance Program (LIEAP)", "utilities", "West Virginia's LIEAP provides one-time payments to help low-income households with energy costs.", "Age 60+; Income <$2811/mo", "1-800-642-8589"),
    p("West Virginia Senior Medicare Patrol (SMP)", "healthcare", "Free counseling and education on Medicare rights, coverage, and fraud prevention.", "Age 65+", "1-800-561-4406"),
    p("West Virginia Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents in long-term care facilities, investigating complaints and protecting rights.", "Age 65+", "1-800-352-6513"),
    p("Home Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors 60+ through local area agencies.", "Age 60+", "1-800-352-6513"),
    p("National Family Caregiver Support Program", "caregiver", "Offers support services including respite care, caregiver training, and counseling for family caregivers.", "Age 60+", "1-866-332-6338"),
    p("Legal Services Senior Legal Services", "healthcare", "Provides free civil legal assistance to low-income seniors 60+ on benefits, housing, and elder abuse.", "Age 60+; Income <$2070/mo", "1-866-662-9311"),
  ]
);

// ── WISCONSIN ────────────────────────────────────────────────────────────────
addState("Wisconsin", "WI", "wisconsin",
  "Wisconsin's Family Care program and PACE provide comprehensive Medicaid managed long-term care for frail elderly adults and adults with physical and intellectual disabilities.",
  [
    p("Medicaid for the Elderly, Blind, or Disabled", "healthcare", "Provides health care benefits to low-income Wisconsin residents who are 65+, blind, or disabled.", "Age 65+; Income <$1050/mo", "1-800-362-3002"),
    p("Family Care IRIS and Partnership Waivers", "healthcare", "Home and community-based services Medicaid waivers providing long-term care at home.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-362-3002"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI for low-income Medicare beneficiaries.", "Age 65+; Income <$1300/mo", "1-800-362-3002"),
    p("FoodShare", "food", "Wisconsin's SNAP/food assistance program providing monthly benefits to low-income seniors.", "Age 65+; Income <$1981/mo", "1-800-362-3002"),
    p("Wisconsin PACE Program", "healthcare", "Program of All-Inclusive Care for the Elderly providing comprehensive medical and support services.", "Age 55+; Income <$2901/mo; Disability req; Medicaid req", "1-800-362-3002"),
    p("Wisconsin SHIP (Senior Health Insurance Assistance Program)", "healthcare", "Free counseling and assistance for Medicare beneficiaries on coverage options and appeals.", "Age 65+", "1-800-242-1060"),
    p("Wisconsin SeniorCare", "healthcare", "State Pharmaceutical Assistance Program providing prescription drug coverage for seniors.", "Age 65+; Income <$2825/mo", "1-800-657-2030"),
    p("Wisconsin Home Energy Assistance Program (WHEAP)", "utilities", "Helps eligible low-income households, including seniors, pay for home heating and cooling costs.", "Age 65+; Income <$2620/mo", "1-800-362-3002"),
    p("Wisconsin Property Tax Relief (Circuit Breaker Credit)", "housing", "Provides property tax relief and rent certificates to low-income elderly homeowners and renters.", "Age 65+; Income <$25000/mo", "1-608-266-2772"),
    p("Wisconsin Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of nursing homes, assisted living, and other long-term care facilities.", "Age 65+", "1-800-236-8550"),
    p("Wisconsin Home Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors 60+ through county Aging units.", "Age 65+; Income <$2500/mo", "1-800-362-8253"),
    p("Wisconsin State SSI Supplement", "income", "State supplement to federal SSI payments for eligible aged, blind, or disabled individuals.", "Age 65+; Income <$1050/mo; Disability req", "1-800-362-3002"),
    p("Wisconsin Judicare Legal Services for Seniors", "healthcare", "Provides free legal assistance to low-income seniors 60+ on benefits, housing, and consumer issues.", "Age 65+; Income <$2000/mo", "1-800-472-1638"),
    p("Wisconsin Family Caregiver Support Program", "caregiver", "Offers support services including respite care, counseling, training, and supplies for family caregivers.", "Age 65+; Income <$3500/mo", "1-800-362-8253"),
  ]
);

// ── WYOMING ──────────────────────────────────────────────────────────────────
addState("Wyoming", "WY", "wyoming",
  "Wyoming offers Medicaid HCBS waivers for elderly and disabled residents and intellectual disability services through the Department of Health.",
  [
    p("Aged, Blind, and Disabled Medicaid", "healthcare", "Wyoming's Medicaid program for seniors aged 65+, blind, or disabled with limited income.", "Age 65+; Income <$967/mo", "1-800-251-1264"),
    p("Community Choice Waiver (CCW)", "healthcare", "Home and community-based services Medicaid waiver for Wyoming adults aged 65+ who need nursing home level of care.", "Age 65+; Income <$2901/mo; Medicaid req", "1-800-251-1264"),
    p("Medicare Savings Programs", "healthcare", "State-administered programs including QMB, SLMB, and QI for low-income Medicare beneficiaries.", "Age 65+; Income <$967/mo", "1-800-251-1264"),
    p("Supplemental Nutrition Assistance Program (SNAP)", "food", "Wyoming's food assistance program providing monthly benefits via EBT card to low-income households.", "Age 60+; Income <$1984/mo", "1-800-457-3659"),
    p("Low-Income Energy Assistance Program (LIHEAP)", "utilities", "Helps low-income Wyoming households, including seniors, pay heating and energy costs.", "Age 60+; Income <$3092/mo", "1-800-669-5477"),
    p("Senior Health Insurance Information Program (SHIIP)", "healthcare", "Free counseling and assistance for Wyoming Medicare beneficiaries on Medicare options and enrollment.", "Age 65+", "1-800-438-5768"),
    p("Long-Term Care Ombudsman Program", "healthcare", "Advocates for residents of long-term care facilities in Wyoming, investigating complaints.", "Age 65+", "1-800-445-7070"),
    p("Wyoming Legal Services for the Elderly", "healthcare", "Provides free legal assistance to low-income seniors aged 60+ on benefits and housing issues.", "Age 60+; Income <$2350/mo", "1-800-836-6222"),
    p("Home-Delivered Meals", "food", "Provides nutritious meals delivered to homebound seniors aged 60+ through Wyoming aging services.", "Age 60+", "1-800-445-7070"),
    p("National Family Caregiver Support Program", "caregiver", "Offers support services for family caregivers of seniors aged 60+ including respite and training.", "Age 60+", "1-800-445-7070"),
  ]
);

function generateFile(): string {
  let out = "";

  // Interfaces
  out += `export interface WaiverForm {
  id: string;
  name: string;
  description: string;
  url: string;
}

export interface ApplicationStep {
  step: number;
  title: string;
  description: string;
}

export interface WaiverProgram {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  savingsRange: string;
  description: string;
  eligibilityHighlights: string[];
  applicationSteps: ApplicationStep[];
  forms: WaiverForm[];
}

export interface StateData {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  programs: WaiverProgram[];
}

`;

  // Generate each state's programs
  for (const state of states) {
    const varName = state.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Programs";
    out += `// ─── ${state.name} ${"─".repeat(Math.max(1, 76 - state.name.length))}\n\n`;
    out += `const ${varName}: WaiverProgram[] = [\n`;

    for (const prog of state.programs) {
      const id = slugify(prog.name);
      const sn = shortName(prog.name);
      const sr = savingsRange(prog.category, prog.name);
      const highlights = parseEligibility(prog.whoQualifies);
      const steps = JSON.parse(genSteps(prog.name, prog.phone));

      out += `  {\n`;
      out += `    id: "${escTS(id)}",\n`;
      out += `    name: "${escTS(prog.name)}",\n`;
      out += `    shortName: "${escTS(sn)}",\n`;
      // Truncate tagline at sentence boundary or 150 chars
      let tagline = prog.whatItDoes;
      if (tagline.length > 150) {
        const periodIdx = tagline.indexOf(".", 40);
        if (periodIdx > 0 && periodIdx < 150) {
          tagline = tagline.slice(0, periodIdx + 1);
        } else {
          tagline = tagline.slice(0, 150).replace(/\s+\S*$/, "") + "...";
        }
      }
      out += `    tagline: "${escTS(tagline)}",\n`;
      out += `    savingsRange: "${sr}",\n`;
      out += `    description: "${escTS(prog.whatItDoes)}",\n`;
      out += `    eligibilityHighlights: [\n`;
      for (const h of highlights) {
        out += `      "${escTS(h)}",\n`;
      }
      out += `    ],\n`;
      out += `    applicationSteps: [\n`;
      for (const s of steps) {
        out += `      { step: ${s.step}, title: "${escTS(s.title)}", description: "${escTS(s.description)}" },\n`;
      }
      out += `    ],\n`;
      out += `    forms: [],\n`;
      out += `  },\n`;
    }

    out += `];\n\n`;
  }

  // allStates array
  out += `// ─── All 50 States ${"─".repeat(58)}\n\n`;
  out += `export const allStates: StateData[] = [\n`;
  for (const state of states) {
    const varName = state.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Programs";
    out += `  {\n`;
    out += `    id: "${state.id}",\n`;
    out += `    name: "${escTS(state.name)}",\n`;
    out += `    abbreviation: "${state.abbrev}",\n`;
    out += `    description: "${escTS(state.description)}",\n`;
    out += `    programs: ${varName},\n`;
    out += `  },\n`;
  }
  out += `];\n\n`;

  // Helper functions
  out += `export function getStateById(id: string): StateData | undefined {
  return allStates.find((s) => s.id === id);
}

export function getProgramById(stateId: string, programId: string): WaiverProgram | undefined {
  const state = getStateById(stateId);
  return state?.programs.find((p) => p.id === programId);
}

export const activeStateIds = allStates.map((s) => s.id);
`;

  return out;
}

// Run generation
const output = generateFile();
const outPath = join(process.cwd(), "data", "waiver-library.ts");
writeFileSync(outPath, output, "utf-8");

// Count programs
let totalPrograms = 0;
for (const s of states) totalPrograms += s.programs.length;
console.log(`Generated ${outPath}`);
console.log(`${states.length} states, ${totalPrograms} programs total.`);

