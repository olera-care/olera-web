import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "data", "waiver-library.ts");

const STATE_MEDICAID_URLS = {
  alabama: "https://www.medicaid.alabama.gov/content/4.0_programs/4.2_apply.aspx",
  alaska: "https://health.alaska.gov/dpa/Pages/medicaid/default.aspx",
  arizona: "https://www.healthearizonaplus.gov",
  arkansas: "https://access.arkansas.gov",
  california: "https://www.coveredca.com/apply",
  colorado: "https://www.healthfirstcolorado.com/apply-now/",
  connecticut: "https://www.connect.ct.gov",
  delaware: "https://dhss.delaware.gov/dhss/dmma/medicaid.html",
  florida: "https://www.myflfamilies.com/services/public-assistance/medicaid",
  georgia: "https://gateway.ga.gov",
  hawaii: "https://medquest.hawaii.gov",
  idaho: "https://idalink.idaho.gov",
  illinois: "https://abe.illinois.gov/abe/access/",
  indiana: "https://fssabenefits.in.gov",
  iowa: "https://dhsservices.iowa.gov",
  kansas: "https://www.kancare.ks.gov/consumers/apply-for-kancare",
  kentucky: "https://kynect.ky.gov",
  louisiana: "https://www.healthcare.gov",
  maine: "https://www.mymaineconnection.gov",
  maryland: "https://www.marylandhealthconnection.gov",
  massachusetts: "https://www.mahealthconnector.org",
  michigan: "https://newmibridges.michigan.gov",
  minnesota: "https://mnbenefits.mn.gov",
  mississippi: "https://www.medicaid.ms.gov/apply/",
  missouri: "https://mydss.mo.gov",
  montana: "https://apply.mt.gov",
  nebraska: "https://dhhs.ne.gov/Pages/Medicaid-Applications.aspx",
  nevada: "https://dwss.nv.gov/Medical/Apply/",
  "new-hampshire": "https://nheasy.nh.gov",
  "new-jersey": "https://www.njfamilycare.org/default.aspx",
  "new-mexico": "https://www.yes.state.nm.us",
  "new-york": "https://nystateofhealth.ny.gov",
  "north-carolina": "https://epass.nc.gov",
  "north-dakota": "https://www.applyforhelp.nd.gov",
  ohio: "https://benefits.ohio.gov",
  oklahoma: "https://www.oklahoma.gov/ohca/individuals/apply",
  oregon: "https://one.oregon.gov",
  pennsylvania: "https://www.compass.state.pa.us",
  "rhode-island": "https://healthyrhode.ri.gov",
  "south-carolina": "https://apply.scdhhs.gov",
  "south-dakota": "https://dss.sd.gov/medicaid/eligibility/apply.aspx",
  tennessee: "https://www.tn.gov/tenncare/members/apply.html",
  texas: "https://www.yourtexasbenefits.com",
  utah: "https://jobs.utah.gov/mycase/",
  vermont: "https://vermontbenefits.gov",
  virginia: "https://commonhelp.virginia.gov",
  washington: "https://www.washingtonconnection.org",
  "west-virginia": "https://dhhr.wv.gov/bms/Pages/Apply-For-Medicaid.aspx",
  wisconsin: "https://access.wisconsin.gov",
  wyoming: "https://dfs.wyo.gov/assistance-programs/medicaid/",
};

const STATE_SNAP_URLS = {
  alabama: "https://www.medicaid.alabama.gov/content/4.0_programs/4.1_food_assistance.aspx",
  alaska: "https://health.alaska.gov/dpa/Pages/fstamps/default.aspx",
  arizona: "https://www.healthearizonaplus.gov",
  arkansas: "https://access.arkansas.gov",
  california: "https://www.getcalfresh.org",
  colorado: "https://peak-colorado.state.co.us",
  connecticut: "https://www.connect.ct.gov",
  delaware: "https://dhss.delaware.gov/dhss/dss/foodstamps.html",
  florida: "https://www.myflfamilies.com/services/public-assistance/snap",
  georgia: "https://gateway.ga.gov",
  hawaii: "https://humanservices.hawaii.gov/bessd/snap/",
  idaho: "https://idalink.idaho.gov",
  illinois: "https://abe.illinois.gov/abe/access/",
  indiana: "https://fssabenefits.in.gov",
  iowa: "https://dhsservices.iowa.gov",
  kansas: "https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx",
  kentucky: "https://kynect.ky.gov",
  louisiana: "https://cafe-cp.dcfs.la.gov",
  maine: "https://www.mymaineconnection.gov",
  maryland: "https://mydhrbenefits.dhr.state.md.us",
  massachusetts: "https://dtaconnect.eohhs.mass.gov",
  michigan: "https://newmibridges.michigan.gov",
  minnesota: "https://mnbenefits.mn.gov",
  mississippi: "https://www.mdhs.ms.gov/economic-assistance/snap/",
  missouri: "https://mydss.mo.gov",
  montana: "https://apply.mt.gov",
  nebraska: "https://dhhs.ne.gov/Pages/SNAP.aspx",
  nevada: "https://dwss.nv.gov/SNAP/",
  "new-hampshire": "https://nheasy.nh.gov",
  "new-jersey": "https://www.njhelps.org",
  "new-mexico": "https://www.yes.state.nm.us",
  "new-york": "https://mybenefits.ny.gov",
  "north-carolina": "https://epass.nc.gov",
  "north-dakota": "https://www.applyforhelp.nd.gov",
  ohio: "https://benefits.ohio.gov",
  oklahoma: "https://www.oklahoma.gov/okdhs/services/snap",
  oregon: "https://one.oregon.gov",
  pennsylvania: "https://www.compass.state.pa.us",
  "rhode-island": "https://healthyrhode.ri.gov",
  "south-carolina": "https://dss.sc.gov/assistance/snap/",
  "south-dakota": "https://dss.sd.gov/economic-assistance/snap/",
  tennessee: "https://fabenefits.tn.gov",
  texas: "https://www.yourtexasbenefits.com",
  utah: "https://jobs.utah.gov/mycase/",
  vermont: "https://dcf.vermont.gov/benefits/3SquaresVT",
  virginia: "https://commonhelp.virginia.gov",
  washington: "https://www.washingtonconnection.org",
  "west-virginia": "https://dhhr.wv.gov/bcf/Services/Pages/SNAP.aspx",
  wisconsin: "https://access.wisconsin.gov",
  wyoming: "https://dfs.wyo.gov/assistance-programs/snap/",
};

const STATE_ENERGY_URLS = {
  alabama: "https://adeca.alabama.gov/liheap/",
  alaska: "https://health.alaska.gov/dpa/Pages/hap/default.aspx",
  arizona: "https://des.az.gov/services/basic-needs/shelter-housing/utility-assistance",
  arkansas: "https://humanservices.arkansas.gov/divisions/county-operations/lieap/",
  california: "https://www.csd.ca.gov/Pages/LIHEAP.aspx",
  colorado: "https://cdhs.colorado.gov/leap",
  connecticut: "https://portal.ct.gov/DSS/Economic-Security/Winter-Heating-Assistance",
  delaware: "https://dhss.delaware.gov/dhss/dss/liheap.html",
  florida: "https://www.myflfamilies.com/services/public-assistance/liheap",
  georgia: "https://dfcs.georgia.gov/services/low-income-home-energy-assistance-program",
  hawaii: "https://humanservices.hawaii.gov/bessd/liheap/",
  idaho: "https://healthandwelfare.idaho.gov/services-programs/financial-assistance/low-income-home-energy-assistance-program",
  illinois: "https://www2.illinois.gov/dceo/CommunityServices/HomeWeatherization/Pages/default.aspx",
  indiana: "https://www.in.gov/ihcda/homeowners-and-renters/energy-assistance-program/",
  iowa: "https://humanrights.iowa.gov/dcaa/liheap",
  kansas: "https://www.dcf.ks.gov/services/ees/Pages/Energy/EnergyAssistance.aspx",
  kentucky: "https://chfrankfort.org/liheap/",
  louisiana: "https://www.doa.la.gov/doa/lcle/liheap/",
  maine: "https://www.mainehousing.org/programs-services/energy/energy-home",
  maryland: "https://dhs.maryland.gov/office-of-home-energy-programs/",
  massachusetts: "https://www.mass.gov/info-details/how-to-apply-for-fuel-assistance",
  michigan: "https://www.michigan.gov/mdhhs/assistance-programs/energy",
  minnesota: "https://mn.gov/commerce/consumers/consumer-assistance/energy-assistance/",
  mississippi: "https://www.mdhs.ms.gov/economic-assistance/liheap/",
  missouri: "https://mydss.mo.gov/utility-assistance",
  montana: "https://dphhs.mt.gov/hcsd/energyassistance",
  nebraska: "https://dhhs.ne.gov/Pages/Energy-Assistance.aspx",
  nevada: "https://dwss.nv.gov/Energy/",
  "new-hampshire": "https://www.nh.gov/osi/energy/programs/fuel-assistance.htm",
  "new-jersey": "https://www.nj.gov/dca/divisions/dhcr/offices/liheap.html",
  "new-mexico": "https://www.hsd.state.nm.us/LookingForAssistance/Low-Income-Home-Energy-Assistance/",
  "new-york": "https://otda.ny.gov/programs/heap/",
  "north-carolina": "https://www.ncdhhs.gov/assistance/low-income-services/low-income-energy-assistance",
  "north-dakota": "https://www.applyforhelp.nd.gov",
  ohio: "https://development.ohio.gov/individual/energy-assistance/home-energy-assistance-program",
  oklahoma: "https://www.oklahoma.gov/okdhs/services/cap/liheap",
  oregon: "https://www.oregon.gov/ohcs/energy-weatherization/Pages/low-income-energy-assistance.aspx",
  pennsylvania: "https://www.compass.state.pa.us",
  "rhode-island": "https://dhs.ri.gov/programs-and-services/energy-assistance-programs",
  "south-carolina": "https://dss.sc.gov/assistance/liheap/",
  "south-dakota": "https://dss.sd.gov/economic-assistance/energy-assistance/",
  tennessee: "https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap/liheap.html",
  texas: "https://www.tdhca.state.tx.us/community-affairs/ceap/",
  utah: "https://jobs.utah.gov/housing/scso/seal/index.html",
  vermont: "https://dcf.vermont.gov/benefits/fuel-assistance",
  virginia: "https://www.dss.virginia.gov/benefit/ea/",
  washington: "https://www.commerce.wa.gov/growing-the-economy/energy/low-income-home-energy-assistance/",
  "west-virginia": "https://dhhr.wv.gov/bcf/Services/Pages/LIEAP.aspx",
  wisconsin: "https://energyandhousing.wi.gov/Pages/AgenciesAndAssistance/EnergyAssistance.aspx",
  wyoming: "https://dfs.wyo.gov/assistance-programs/liheap/",
};

function classifyProgram(name, shortName) {
  const combined = `${name} ${shortName}`.toLowerCase();
  if (/ombudsman/.test(combined)) return "ombudsman";
  if (/ship|hicap|hiicap|shiip|shine|vicap|senior health insurance|medicare counsel/.test(combined)) return "ship";
  if (/pace\b/.test(combined)) return "pace";
  if (/snap|food|calfresh|3squares|csfp/.test(combined)) return "snap";
  if (/liheap|lieap|energy assist|fuel assist|ceap|weatheriz|heating|leap\b|heap\b|wheap|ieap/.test(combined)) return "energy";
  if (/property tax|circuit breaker|ptex|ptf|senior valuation|clause 41c/.test(combined)) return "property_tax";
  if (/ssi.*suppl|ssp|state suppl.*ssi/.test(combined)) return "ssi_supplement";
  if (/scsep|senior.*employ|senior companion/.test(combined)) return "scsep";
  if (/caregiver|nfcsp|respite/.test(combined)) return "caregiver";
  if (/home.*meal|congregate meal|senior meal/.test(combined)) return "meals";
  if (/senior legal|legal aid|legal service/.test(combined)) return "legal";
  if (/smp|senior medicare patrol|gsmp/.test(combined)) return "smp";
  if (/spap|epic|connpace|seniorcare|prescription|pharmacy/.test(combined)) return "pharmacy";
  if (/qmb|slmb|qi\b|medicare.*sav|medicare.*buy|medicare.*prem/.test(combined)) return "medicare_savings";
  if (/hcbs|waiver|home.*community|community.*choice|altcs|choices|cap\/da|advantage|passport|edcd|edwp|star\+plus|mltss|iris|copes|adw|community health|few|ccw|alw|ali/.test(combined)) return "hcbs_waiver";
  if (/abd|aged.*blind|blind.*disabled|aabd|maabd|mabd|meds-ad|ebd|ead|a&d/.test(combined)) return "abd_medicaid";
  if (/medicaid|maincare|masshealth|tenncare|kancare|soonercare|healthnet|healthfirst|husky|familycare|medical assist|health.*colorado|diamond state|centennial/.test(combined)) return "medicaid";
  return "medicaid";
}

function getForms(type, stateId, stateName) {
  const medicaidUrl = STATE_MEDICAID_URLS[stateId] || "https://www.medicaid.gov";
  const snapUrl = STATE_SNAP_URLS[stateId] || "https://www.fns.usda.gov/snap/apply";
  const energyUrl = STATE_ENERGY_URLS[stateId] || "https://www.acf.hhs.gov/ocs/low-income-home-energy-assistance-program-liheap";

  switch (type) {
    case "abd_medicaid":
    case "medicaid":
      return [{ id: `${stateId}-medicaid-application`, name: `${stateName} Medicaid Application`, description: `Official ${stateName} Medicaid application. Apply online or download a printable form.`, url: medicaidUrl }];
    case "hcbs_waiver":
      return [
        { id: `${stateId}-medicaid-application`, name: `${stateName} Medicaid Application`, description: `Official ${stateName} Medicaid application, required for waiver enrollment.`, url: medicaidUrl },
        { id: `${stateId}-hcbs-referral`, name: "HCBS Waiver Referral/Enrollment Form", description: "Request a functional assessment and referral to home and community-based waiver services.", url: medicaidUrl },
      ];
    case "medicare_savings":
      return [{ id: `${stateId}-msp-application`, name: "Medicare Savings Program Application", description: "Apply for QMB, SLMB, or QI coverage to help pay Medicare premiums, deductibles, and copays.", url: medicaidUrl }];
    case "snap":
      return [{ id: `${stateId}-snap-application`, name: `${stateName} SNAP Application`, description: "Apply for Supplemental Nutrition Assistance Program (food assistance) benefits.", url: snapUrl }];
    case "energy":
      return [{ id: `${stateId}-energy-application`, name: `${stateName} Energy Assistance Application`, description: "Apply for help paying home heating and cooling bills through LIHEAP.", url: energyUrl }];
    case "pace":
      return [
        { id: `${stateId}-pace-enrollment`, name: "PACE Enrollment Application", description: "Enroll in the Program of All-Inclusive Care for the Elderly for comprehensive medical and support services.", url: medicaidUrl },
        { id: `${stateId}-medicaid-application`, name: `${stateName} Medicaid Application`, description: `Medicaid eligibility may be required. Apply through ${stateName}'s portal.`, url: medicaidUrl },
      ];
    case "ssi_supplement":
      return [
        { id: "federal-ssi-application", name: "SSI Application (Federal)", description: "Apply for Supplemental Security Income through the Social Security Administration.", url: "https://www.ssa.gov/benefits/ssi/" },
        { id: `${stateId}-ssi-supplement`, name: `${stateName} SSI State Supplement`, description: "State supplement is typically automatic once SSI is approved. Contact your local office to confirm.", url: medicaidUrl },
      ];
    case "caregiver":
      return [{ id: `${stateId}-caregiver-application`, name: "Family Caregiver Support Application", description: "Apply for respite care, caregiver training, and support services through your Area Agency on Aging.", url: "https://eldercare.acl.gov" }];
    case "meals":
      return [{ id: `${stateId}-meals-referral`, name: "Senior Meals Program Referral", description: "Request home-delivered or congregate meals through your local Area Agency on Aging.", url: "https://eldercare.acl.gov" }];
    case "ombudsman":
      return [{ id: `${stateId}-ombudsman-complaint`, name: "Long-Term Care Ombudsman Complaint Form", description: "File a complaint or request advocacy assistance for nursing home or assisted living concerns.", url: "https://acl.gov/programs/protecting-rights-and-preventing-abuse/long-term-care-ombudsman-program" }];
    case "ship":
      return [{ id: `${stateId}-ship-counseling`, name: "SHIP Medicare Counseling Request", description: "Request free, unbiased Medicare counseling to compare plans and understand your benefits.", url: "https://www.shiphelp.org" }];
    case "legal":
      return [{ id: `${stateId}-legal-intake`, name: "Senior Legal Services Intake Form", description: "Request free legal assistance for issues like benefits denials, housing, and consumer protection.", url: "https://eldercare.acl.gov" }];
    case "property_tax":
      return [{ id: `${stateId}-property-tax-application`, name: `${stateName} Senior Property Tax Relief Application`, description: "Apply for property tax exemptions, deferrals, or credits available to qualifying seniors.", url: medicaidUrl }];
    case "scsep":
      return [{ id: `${stateId}-scsep-application`, name: "Senior Employment Program Application", description: "Apply for part-time community service job training for low-income seniors aged 55+.", url: "https://www.dol.gov/agencies/eta/seniors" }];
    case "smp":
      return [{ id: `${stateId}-smp-referral`, name: "Senior Medicare Patrol Volunteer/Referral Form", description: "Report suspected Medicare fraud, errors, or abuse, or volunteer as a counselor.", url: "https://www.smpresource.org" }];
    case "pharmacy":
      return [{ id: `${stateId}-pharmacy-application`, name: `${stateName} Prescription Assistance Application`, description: "Apply for state pharmaceutical assistance to help cover prescription drug costs.", url: medicaidUrl }];
    default:
      return [{ id: `${stateId}-medicaid-application`, name: `${stateName} Medicaid Application`, description: `Apply through ${stateName}'s official portal.`, url: medicaidUrl }];
  }
}

let content = readFileSync(DATA_FILE, "utf-8");

const stateBlockRe = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",/g;
const stateMap = new Map();
let match;
while ((match = stateBlockRe.exec(content)) !== null) {
  stateMap.set(match[1], match[2]);
}

let replacements = 0;
const lines = content.split("\n");
const output = [];
let currentState = null;
let currentProgramName = null;
let currentShortName = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const stateComment = line.match(/^\/\/ ─── (\w[\w\s]+\w) ─/);
  if (stateComment) {
    const sName = stateComment[1].trim();
    for (const [id, name] of stateMap) {
      if (name === sName) { currentState = { id, name }; break; }
    }
  }
  const nameMatch = line.match(/^\s*name:\s*"(.+)",?\s*$/);
  if (nameMatch) currentProgramName = nameMatch[1];
  const shortMatch = line.match(/^\s*shortName:\s*"(.+)",?\s*$/);
  if (shortMatch) currentShortName = shortMatch[1];

  if (line.match(/^\s*forms:\s*\[\]\s*,?\s*$/) && currentState && currentProgramName) {
    const type = classifyProgram(currentProgramName, currentShortName || "");
    const forms = getForms(type, currentState.id, currentState.name);
    const indent = line.match(/^(\s*)/)[1];
    const formsStr = forms.map((f) =>
      `${indent}  { id: "${f.id}", name: "${f.name}", description: "${f.description.replace(/"/g, '\\"')}", url: "${f.url}" },`
    ).join("\n");
    output.push(`${indent}forms: [`);
    output.push(formsStr);
    output.push(`${indent}],`);
    replacements++;
  } else {
    output.push(line);
  }
}

writeFileSync(DATA_FILE, output.join("\n"), "utf-8");
console.log(`Done! Replaced ${replacements} empty forms arrays.`);
