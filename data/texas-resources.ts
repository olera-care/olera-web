/**
 * Content for Texas "Free Resources" programs — hotlines, counseling,
 * and referral services that only need a one-pager instead of the full
 * About / Eligibility / How to Apply / Resources tabbed layout.
 */

export interface ResourcePhone {
  label: string;
  number: string;
  /** Optional notes like hours or extension */
  note?: string;
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface ResourceProgramContent {
  /** Matches the waiver-library program id */
  id: string;
  /** One-line summary shown near the top */
  tagline: string;
  /** Full paragraph description */
  intro: string;
  /** Services this program provides */
  services: string[];
  /** Who can use this service */
  eligibility: string[];
  /** Phone numbers — the most important piece of info */
  phones: ResourcePhone[];
  /** Helpful websites */
  websites: ResourceLink[];
  /** Optional mailing/office address */
  address?: {
    lines: string[];
    /** Disclaimer e.g. "mailing address only — not a physical office" */
    note?: string;
  };
  /** Optional estimated timeline (e.g. "2–4 weeks to be matched") */
  timeline?: string;
  /** Optional documents needed */
  documents?: string[];
  /** Optional local service areas / regional sponsors */
  serviceAreas?: ResourceLink[];
}

export const TEXAS_RESOURCE_CONTENT: Record<string, ResourceProgramContent> = {
  "texas-legal-services-for-seniors": {
    id: "texas-legal-services-for-seniors",
    tagline: "Free legal advice by phone for Texans 60+ or anyone on Medicare.",
    intro:
      "The Legal Hotline at Texas Legal Services Center provides free legal advice to Texans 60 and older or anyone on Medicare. Call to speak with an attorney about benefits, planning, and consumer issues — at no cost to you.",
    services: [
      "Medicaid and Medicare questions",
      "Powers of attorney and advance directives",
      "Long-term care planning",
      "Homeownership and property issues",
      "Debt collection and consumer issues",
    ],
    eligibility: [
      "Texas residents age 60 or older for estate planning and consumer issues",
      "Anyone on Medicare (any age) for Medicaid, Medicare, and long-term care questions",
    ],
    phones: [
      { label: "Legal Hotline", number: "(800) 622-2520", note: "Ext. 3" },
    ],
    websites: [
      { label: "Texas Legal Services Center — Seniors", url: "https://www.tlsc.org/seniors" },
      { label: "TexasLawHelp.org — Legal Hotline Directory", url: "https://texaslawhelp.org/directory/texas-legal-services-center-legal-hotline-for-texans" },
    ],
    address: {
      lines: [
        "Texas Legal Services Center",
        "1920 E. Riverside Dr. Suite A-120, #501",
        "Austin, TX 78741",
      ],
      note: "Mailing address only — not a physical office location.",
    },
  },
  "texas-long-term-care-ombudsman": {
    id: "texas-long-term-care-ombudsman",
    tagline: "Free, confidential advocacy for residents of nursing facilities and assisted living communities.",
    intro:
      "The Long-Term Care Ombudsman Program provides free, confidential support for seniors living in nursing facilities and assisted living communities across Texas. Ombudsmen are independent advocates who protect residents' rights and help resolve concerns about the quality of care and daily life. Anyone can contact an ombudsman on behalf of a resident at no cost.",
    services: [
      "Explaining rights to residents",
      "Supporting residents and families in discussing concerns with facility staff",
      "Identifying gaps in facility, government, or community services and helping fix them",
      "Protecting resident health, safety, welfare, and rights",
      "Providing information about and help finding long-term care",
      "Investigating complaints for resolution to the resident's satisfaction",
    ],
    eligibility: [
      "Anyone may call an ombudsman to voice a concern on behalf of a resident — at no cost",
    ],
    phones: [
      { label: "Statewide LTC Ombudsman", number: "(800) 252-2412" },
    ],
    websites: [
      { label: "Texas LTC Ombudsman", url: "https://ltco.texas.gov/" },
      { label: "Find Your Local Ombudsman", url: "https://ltco.texas.gov/about-us/find-ombudsman" },
      { label: "HHSC — About the Ombudsman", url: "https://apps.hhs.texas.gov/news_info/ombudsman/about.html" },
    ],
  },
  "texas-senior-companion-program": {
    id: "texas-senior-companion-program",
    tagline: "A Friendly Face and a Helping Hand at Home",
    intro:
      "The Senior Companion Program pairs volunteers 55 and older with seniors who need light support to stay independent at home. Volunteers help with everyday tasks like meal prep, grocery shopping, and transportation to appointments, while also providing regular companionship. For family caregivers, it offers meaningful relief. For seniors, it offers connection and the ability to remain in the home they know.",
    services: [
      "A coordinator pairs each senior with a volunteer based on location, schedule, and interests",
      "Regular visits, conversation, and friendship",
      "Help with daily tasks, light meal preparation, and shopping",
      "Escort services for doctor appointments and errands",
    ],
    eligibility: [
      "Seniors 60+ who are homebound, socially isolated, or need support to stay in their homes",
      "Texas residents in areas with active programs (Dallas, Houston, Corpus Christi, Concho Valley/West Texas)",
    ],
    timeline: "2–4 weeks to be matched with a volunteer",
    documents: [
      "Government-issued photo ID",
      "Proof of income (tax returns or SSI statement)",
      "Medical records",
    ],
    phones: [
      { label: "Texas 2-1-1", number: "2-1-1", note: "Ask for Senior Companion Program referrals" },
    ],
    websites: [
      { label: "AmeriCorps Seniors — Senior Companion Program", url: "https://americorps.gov/serve/fit-finder/americorps-seniors-senior-companion-program" },
    ],
    serviceAreas: [
      { label: "Dallas, The Senior Source", url: "https://theseniorsource.org/volunteer/opportunities-seniors/senior-companions/" },
      { label: "Houston, ERJCC", url: "https://www.erjcchouston.org/adults-60/senior-companions/" },
      { label: "Corpus Christi, Parks & Recreation", url: "https://www.corpuschristitx.gov/department-directory/parks-and-recreation/parks-and-recreation-programs/senior-companion-program/" },
      { label: "Concho Valley / West Texas, RSVP", url: "https://www.westtexasrsvp.org/senior-companions-program" },
    ],
  },
  "texas-ship-medicare-counseling": {
    id: "texas-ship-medicare-counseling",
    tagline: "Free, unbiased one-on-one Medicare counseling from certified volunteers.",
    intro:
      "Texas SHIP provides free, unbiased, one-on-one Medicare counseling. Certified counselors help beneficiaries, families, and caregivers with enrollment, comparing Medicare Advantage and Part D plans, understanding Medigap, and navigating Medicare Savings Programs. Counselors do not sell insurance and receive no commissions, so their guidance is based entirely on your situation.",
    services: [
      "Medicare and Medicaid information and education",
      "Help with Original Medicare eligibility, enrollment, benefits, complaints, rights, and appeals",
      "Explain Medicare Supplemental (Medigap) insurance policies and comparisons",
      "Explain Medicare Advantage (Part C), with help comparing plans and enrolling or disenrolling",
      "Explain Medicare Prescription Drug (Part D) coverage and help find prescription assistance",
      "Information about long-term care insurance",
    ],
    eligibility: [
      "Medicare beneficiaries of any age (65+ or SSA-determined disability)",
      "Family members, caregivers, and authorized representatives acting on a beneficiary's behalf",
    ],
    documents: [
      "Medicare card",
      "Government-issued photo ID",
      "Social Security card",
      "Current medication list",
      "Recent financial statements (bank statements, tax returns)",
    ],
    phones: [
      { label: "Texas SHIP Helpline", number: "(800) 252-9240" },
      { label: "National SHIP Locator", number: "(877) 839-2675" },
    ],
    websites: [
      { label: "SHIP National Network", url: "https://www.shiphelp.org" },
      { label: "Texas HHSC — Medicare Help", url: "https://www.hhs.texas.gov/services/health/medicare" },
    ],
  },
};

export function getTexasResourceContent(id: string): ResourceProgramContent | undefined {
  return TEXAS_RESOURCE_CONTENT[id];
}
