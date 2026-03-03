export interface WaiverForm {
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

// ─── California ────────────────────────────────────────────────────────────────

const californiaPrograms: WaiverProgram[] = [
  {
    id: "ihss",
    name: "In-Home Supportive Services (IHSS)",
    shortName: "IHSS",
    tagline: "Get paid to care for a family member at home",
    savingsRange: "$8,000 – $20,000/year",
    description:
      "IHSS is a statewide Medi-Cal program that provides in-home assistance to elderly, blind, and disabled individuals who need help to remain safely in their own homes. Services include personal care, domestic services, meal preparation, and paramedical services.",
    eligibilityHighlights: [
      "California resident aged 65+ or disabled",
      "Receiving or eligible for Medi-Cal",
      "Assessed to be at risk of out-of-home care",
      "Unable to safely perform daily living activities without assistance",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Contact your county IHSS office",
        description:
          "Call your local county social services office to request an IHSS application. You can also apply online through the BenefitsCal portal.",
      },
      {
        step: 2,
        title: "Complete a needs assessment",
        description:
          "A social worker will visit your home to assess the type and number of hours of services needed. Prepare a list of daily activities you need help with.",
      },
      {
        step: 3,
        title: "Choose a provider",
        description:
          "You can hire a family member, friend, or an independent provider. The provider must register with IHSS and complete orientation and training.",
      },
      {
        step: 4,
        title: "Begin services",
        description:
          "Once approved, your provider can begin services. Hours are tracked via the Electronic Services Portal (ESP) or paper timesheets.",
      },
    ],
    forms: [
      {
        id: "soc295",
        name: "IHSS Program Application (SOC 295)",
        description: "Initial application to apply for IHSS services",
        url: "https://www.cdss.ca.gov/cdssweb/entres/forms/english/SOC295.pdf",
      },
      {
        id: "soc837",
        name: "Provider Enrollment Form (SOC 837)",
        description: "Required for all new IHSS providers to enroll in the program",
        url: "https://www.cdss.ca.gov/cdssweb/entres/forms/english/SOC837.pdf",
      },
      {
        id: "soc426",
        name: "Medical Certification (SOC 426)",
        description: "Physician certification of medical need for IHSS services",
        url: "https://www.cdss.ca.gov/cdssweb/entres/forms/english/SOC426.pdf",
      },
    ],
  },
  {
    id: "mssp",
    name: "Multipurpose Senior Services Program (MSSP)",
    shortName: "MSSP",
    tagline: "Coordinated community services for nursing-home-eligible seniors",
    savingsRange: "$20,000 – $45,000/year",
    description:
      "MSSP is a California Medicaid waiver program that provides social and health care management services to frail elderly individuals who are eligible for nursing facility placement. It coordinates a package of community-based services to help seniors remain at home.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Medi-Cal eligible",
      "Clinically eligible for nursing facility placement",
      "Willing to remain in the community with support",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Find an MSSP site",
        description:
          "Locate your nearest MSSP site through the California Department of Aging website. MSSP is operated by local agencies on aging.",
      },
      {
        step: 2,
        title: "Request an assessment",
        description:
          "Contact the MSSP site to request an intake and assessment. A case manager will evaluate your functional and health needs.",
      },
      {
        step: 3,
        title: "Develop a care plan",
        description:
          "Your case manager will work with you to create a personalized care plan that identifies the services needed to keep you safely at home.",
      },
      {
        step: 4,
        title: "Receive services",
        description:
          "Services are coordinated and may include adult day health, personal care, transportation, and care management.",
      },
    ],
    forms: [
      {
        id: "mssp-intake",
        name: "MSSP Intake and Assessment Form",
        description: "Initial intake form completed at the MSSP site",
        url: "https://www.aging.ca.gov/Programs_and_Services/Medi-Cal_Waiver_Programs/Multipurpose_Senior_Services_Program/",
      },
      {
        id: "dhcs6172",
        name: "Medi-Cal Long-Term Services Assessment (DHCS 6172)",
        description: "Standardized functional assessment for Medi-Cal LTSS programs",
        url: "https://www.dhcs.ca.gov/formsandpubs/forms/Forms/DHCS6172.pdf",
      },
    ],
  },
  {
    id: "pace-california",
    name: "Program of All-inclusive Care for the Elderly (PACE)",
    shortName: "PACE CA",
    tagline: "All-in-one medical and social care for nursing-home-eligible seniors",
    savingsRange: "$15,000 – $35,000/year",
    description:
      "PACE California provides comprehensive medical and social services to individuals who are 55 or older and certified by the state as needing nursing home level of care. All services are coordinated through a PACE center and interdisciplinary care team.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Certified as needing nursing home level of care",
      "Able to live safely in the community with PACE support",
      "Live in a PACE service area",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Find a PACE organization",
        description:
          "Locate a PACE organization in your area. California has PACE sites in many counties. Contact the organization to inquire about enrollment.",
      },
      {
        step: 2,
        title: "Eligibility determination",
        description:
          "DHCS will assess whether you meet the nursing home level of care requirement. PACE staff will also assess your medical and social needs.",
      },
      {
        step: 3,
        title: "Enroll in PACE",
        description:
          "Sign an enrollment agreement and disenroll from other Medi-Cal managed care plans. Medicare and Medi-Cal benefits are transferred to PACE.",
      },
      {
        step: 4,
        title: "Begin care at the PACE center",
        description:
          "Your interdisciplinary team will develop a care plan. You'll receive services at the PACE day center and in your home.",
      },
    ],
    forms: [
      {
        id: "pace-enrollment",
        name: "PACE Enrollment Request Form",
        description: "Request form to begin the PACE enrollment process",
        url: "https://www.dhcs.ca.gov/services/medi-cal/Pages/PACE.aspx",
      },
      {
        id: "dhcs6248",
        name: "Level of Care Assessment (DHCS 6248)",
        description: "Required assessment to determine nursing facility level of care eligibility",
        url: "https://www.dhcs.ca.gov/formsandpubs/forms/Forms/DHCS6248.pdf",
      },
    ],
  },
];

// ─── Florida ───────────────────────────────────────────────────────────────────

const floridaPrograms: WaiverProgram[] = [
  {
    id: "smmc-ltc",
    name: "Statewide Medicaid Managed Care Long-Term Care (SMMC LTC)",
    shortName: "SMMC LTC",
    tagline: "Florida's primary Medicaid program for nursing-home-eligible adults",
    savingsRange: "$12,000 – $28,000/year",
    description:
      "SMMC LTC is Florida's managed long-term care program for elders and adults with disabilities who need nursing home level of care. Managed care plans coordinate home and community-based services as an alternative to nursing home placement.",
    eligibilityHighlights: [
      "Age 65+ or adults 18–64 with a disability",
      "Medicaid eligible",
      "Need nursing home level of care",
      "Prefer to receive services in the community",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Apply for Medicaid",
        description:
          "Apply for Florida Medicaid through ACCESS Florida if not already enrolled. Medicaid eligibility is required before enrolling in SMMC LTC.",
      },
      {
        step: 2,
        title: "Contact the Long-Term Care Community Diversion program",
        description:
          "After Medicaid approval, contact AHCA to request SMMC LTC enrollment. You'll be placed on a waitlist if enrollment is closed in your area.",
      },
      {
        step: 3,
        title: "Functional assessment",
        description:
          "A nurse from the Agency for Health Care Administration will visit to determine if you need nursing home level of care.",
      },
      {
        step: 4,
        title: "Choose a managed care plan",
        description:
          "Select from available SMMC LTC managed care plans in your region. Each plan has a network of providers and may offer different services.",
      },
    ],
    forms: [
      {
        id: "fl-medicaid-app",
        name: "Florida Medicaid Application (ACCESS Florida)",
        description: "Online application to apply for Florida Medicaid benefits",
        url: "https://www.myflorida.com/accessflorida/",
      },
      {
        id: "ahca5000-3008",
        name: "Medicaid Waiver Services Application (AHCA 5000-3008)",
        description: "Application for SMMC LTC and waiver services",
        url: "https://ahca.myflorida.com/medicaid/ltc/docs/AHCA5000-3008.pdf",
      },
    ],
  },
  {
    id: "ibudget-florida",
    name: "iBudget Florida Waiver",
    shortName: "iBudget FL",
    tagline: "Self-directed supports for adults with developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description:
      "iBudget Florida is a Medicaid waiver that provides home and community-based services to adults with developmental disabilities. Participants receive an individualized budget and can direct their own services with support from a support coordinator.",
    eligibilityHighlights: [
      "Florida resident with a developmental disability",
      "Age 3 or older (adults prioritized)",
      "Medicaid eligible",
      "Diagnosed with intellectual disability, cerebral palsy, autism, spina bifida, or Prader-Willi syndrome",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Contact the Agency for Persons with Disabilities (APD)",
        description:
          "Reach out to your regional APD office to request a determination of eligibility for developmental disability services.",
      },
      {
        step: 2,
        title: "Eligibility determination",
        description:
          "APD will evaluate your diagnosis and functional needs. You will need documentation from a licensed professional confirming your developmental disability.",
      },
      {
        step: 3,
        title: "Waitlist and enrollment",
        description:
          "After eligibility is confirmed, you may be placed on a waitlist. Once enrollment opens, APD will help you apply for Medicaid and the iBudget waiver.",
      },
      {
        step: 4,
        title: "Budget determination and support coordinator",
        description:
          "APD will determine your iBudget amount. You'll choose a support coordinator who will help you plan and manage your services.",
      },
    ],
    forms: [
      {
        id: "apd-application",
        name: "APD Client Application",
        description: "Application to become an APD client and request waiver services",
        url: "https://apd.myflorida.com/waiver/",
      },
      {
        id: "apd-dd-determination",
        name: "Developmental Disability Determination Form",
        description: "Documentation required to confirm developmental disability eligibility",
        url: "https://apd.myflorida.com/docs/APD_DD_Determination.pdf",
      },
    ],
  },
  {
    id: "pace-florida",
    name: "Program of All-inclusive Care for the Elderly (PACE Florida)",
    shortName: "PACE FL",
    tagline: "Complete medical and long-term care for nursing-home-eligible Floridians",
    savingsRange: "$15,000 – $35,000/year",
    description:
      "PACE Florida provides comprehensive health care and social services for individuals 55 and older who qualify for nursing home level of care. Services are coordinated through a PACE center by an interdisciplinary team, allowing participants to live safely in the community.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Florida Medicaid and/or Medicare eligible",
      "Certified as needing nursing home level of care",
      "Live in a PACE service area in Florida",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Find a PACE site in Florida",
        description:
          "Contact the Florida Department of Elder Affairs or the national PACE Association to find a PACE organization near you.",
      },
      {
        step: 2,
        title: "Schedule an assessment",
        description:
          "The PACE organization will conduct a comprehensive assessment to evaluate your medical, functional, and social needs.",
      },
      {
        step: 3,
        title: "Medicaid and Medicare enrollment review",
        description:
          "PACE coordinates both Medicaid and Medicare benefits. Staff will help verify your eligibility and transition your coverage to PACE.",
      },
      {
        step: 4,
        title: "Enroll and begin services",
        description:
          "Sign the PACE enrollment agreement. Your care team will develop a plan and you'll begin receiving services at the PACE day center and in your home.",
      },
    ],
    forms: [
      {
        id: "fl-pace-enrollment",
        name: "Florida PACE Enrollment Form",
        description: "Enrollment form for Florida PACE organizations",
        url: "https://elderaffairs.state.fl.us/doea/pace.php",
      },
      {
        id: "fl-level-of-care",
        name: "Florida Level of Care Assessment",
        description: "Required assessment to determine nursing facility level of care eligibility in Florida",
        url: "https://ahca.myflorida.com/medicaid/ltc/",
      },
    ],
  },
];

// ─── Texas ─────────────────────────────────────────────────────────────────────

const texasPrograms: WaiverProgram[] = [
  {
    id: "star-plus-hcbs",
    name: "STAR+PLUS Home and Community Based Services (HCBS) Waiver",
    shortName: "STAR+PLUS",
    tagline: "Home-based Medicaid services for seniors and adults with disabilities",
    savingsRange: "$12,000 – $28,000/year",
    description:
      "STAR+PLUS HCBS is a Texas Medicaid managed care program providing home and community-based services to adults 21 and older who require nursing facility level of care. STAR+PLUS plans coordinate services including personal attendant care, adult day care, and supported employment.",
    eligibilityHighlights: [
      "Age 21 or older",
      "Texas Medicaid eligible",
      "Need nursing facility level of care",
      "Live in a STAR+PLUS service area",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Apply for Texas Medicaid",
        description:
          "Apply for Medicaid through Your Texas Benefits (YourTexasBenefits.com) if not already enrolled. Medicaid eligibility is the first requirement.",
      },
      {
        step: 2,
        title: "Request HCBS waiver services",
        description:
          "Contact the Texas Health and Human Services Commission (HHSC) to request STAR+PLUS HCBS waiver services. You may be added to an interest list.",
      },
      {
        step: 3,
        title: "Functional assessment",
        description:
          "HHSC will conduct a functional needs assessment to determine if you need nursing facility level of care. This may include a home visit.",
      },
      {
        step: 4,
        title: "Choose a STAR+PLUS managed care plan",
        description:
          "Select from available STAR+PLUS health plans in your service area. Your plan will assign a service coordinator to help develop your care plan.",
      },
    ],
    forms: [
      {
        id: "tx-medicaid-app",
        name: "Texas Medicaid Application (H1205)",
        description: "Application for Texas Medicaid benefits",
        url: "https://hhs.texas.gov/sites/default/files/documents/laws-regs/rules-regulations/notices/2017/04-2017/20170407-HIRC-h1205.pdf",
      },
      {
        id: "hhsc-3013",
        name: "Request for HCBS Waiver Services (HHSC 3013)",
        description: "Form to request STAR+PLUS HCBS waiver placement on the interest list",
        url: "https://hhs.texas.gov/laws-regulations/forms/3000-3999/form-3013-request-home-community-based-services-hcbs-waiver",
      },
    ],
  },
  {
    id: "class-waiver",
    name: "Community Living Assistance and Support Services (CLASS) Waiver",
    shortName: "CLASS",
    tagline: "Medicaid waiver supporting adults with related conditions in the community",
    savingsRange: "$12,000 – $30,000/year",
    description:
      "The CLASS Waiver is a Texas Medicaid waiver program for individuals with related conditions such as intellectual disabilities or developmental disabilities who need intermediate care facility level of care. It supports community living and employment through a range of habilitative and supportive services.",
    eligibilityHighlights: [
      "Age 18 or older (no upper age limit)",
      "Texas Medicaid eligible",
      "Have a related condition (e.g., cerebral palsy, epilepsy, autism, traumatic brain injury)",
      "Need intermediate care facility level of care",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Contact your local LIDDA",
        description:
          "Contact the Local Intellectual and Developmental Disability Authority (LIDDA) in your area to start the CLASS waiver application process.",
      },
      {
        step: 2,
        title: "Determination of eligibility",
        description:
          "The LIDDA will assess your disability and functional needs to determine eligibility for CLASS waiver services.",
      },
      {
        step: 3,
        title: "Interest list",
        description:
          "If eligible, you will be placed on the CLASS interest list. HHSC will contact you when a slot becomes available.",
      },
      {
        step: 4,
        title: "Develop an individual plan of care",
        description:
          "Once enrolled, work with a program provider to develop your Individual Plan of Care (IPC) that outlines your services and goals.",
      },
    ],
    forms: [
      {
        id: "class-referral",
        name: "CLASS Waiver Referral Form",
        description: "Referral submitted to LIDDA to begin the CLASS waiver eligibility process",
        url: "https://hhs.texas.gov/doing-business-hhs/provider-portals/long-term-care-providers/home-community-based-services-providers/community-living-assistance-support-services-class-waiver",
      },
      {
        id: "hhsc-form-1004",
        name: "Determination of Intellectual Disability (HHSC 1004)",
        description: "Assessment form for intellectual disability and related conditions",
        url: "https://hhs.texas.gov/laws-regulations/forms/1000-1999/form-1004-determination-intellectual-disability",
      },
    ],
  },
  {
    id: "pace-texas",
    name: "Program of All-inclusive Care for the Elderly (PACE Texas)",
    shortName: "PACE TX",
    tagline: "Integrated Medicare and Medicaid care for nursing-home-eligible Texans",
    savingsRange: "$15,000 – $35,000/year",
    description:
      "PACE Texas offers comprehensive medical care, behavioral health, and long-term services to individuals 55 and older who are certified to need nursing home level of care. Care is coordinated by an interdisciplinary team at a PACE center, enabling participants to remain in the community.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Texas Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
      "Reside in a PACE service area in Texas",
    ],
    applicationSteps: [
      {
        step: 1,
        title: "Find a PACE site in Texas",
        description:
          "Texas has several PACE organizations. Contact HHSC or the national PACE Association to find the PACE site nearest you.",
      },
      {
        step: 2,
        title: "Contact the PACE organization",
        description:
          "Reach out to the local PACE organization to schedule an intake screening. They will verify your residency in the service area.",
      },
      {
        step: 3,
        title: "Complete assessments",
        description:
          "The PACE interdisciplinary team will conduct medical, functional, and social assessments to confirm eligibility and develop your care plan.",
      },
      {
        step: 4,
        title: "Enroll and transition coverage",
        description:
          "Sign the PACE enrollment agreement. Your Medicare and Medicaid benefits will transfer to the PACE organization as your sole provider.",
      },
    ],
    forms: [
      {
        id: "tx-pace-referral",
        name: "Texas PACE Program Referral",
        description: "Initial referral form to begin PACE enrollment in Texas",
        url: "https://hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-program-information/pace-program-all-inclusive-care-elderly",
      },
      {
        id: "tx-functional-assessment",
        name: "Texas Functional Assessment (Form 3618)",
        description: "Required functional assessment to determine nursing facility level of care",
        url: "https://hhs.texas.gov/laws-regulations/forms/3000-3999/form-3618-functional-assessment",
      },
    ],
  },
];

// ─── Alabama ───────────────────────────────────────────────────────────────────

const alabamaPrograms: WaiverProgram[] = [
  {
    id: "edwp",
    name: "Elderly and Disabled Waiver Program (EDWP)",
    shortName: "EDWP",
    tagline: "Home-based Medicaid services for Alabama seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Alabama's EDWP provides home and community-based services to elderly and disabled individuals who would otherwise require nursing facility placement. Services include personal care, homemaker, adult day health, and respite care.",
    eligibilityHighlights: [
      "Age 65+ or adults 21–64 with a physical disability",
      "Alabama Medicaid eligible",
      "Require nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Alabama Medicaid", description: "Apply through the Alabama Department of Human Resources (DHR) if not already enrolled in Medicaid." },
      { step: 2, title: "Request EDWP placement", description: "Contact the Alabama Medicaid Agency or your local Area Agency on Aging to request placement on the EDWP interest list." },
      { step: 3, title: "Functional assessment", description: "A Medicaid nurse will visit your home to assess functional needs and determine your level of care." },
    ],
    forms: [
      { id: "al-medicaid-app", name: "Alabama Medicaid Application", description: "Application for Alabama Medicaid benefits", url: "https://medicaid.alabama.gov/content/5.0_howto_apply/5.1_apply_online.aspx" },
    ],
  },
  {
    id: "pace-alabama",
    name: "Program of All-inclusive Care for the Elderly (PACE Alabama)",
    shortName: "PACE AL",
    tagline: "Comprehensive managed care for nursing-home-eligible Alabamians",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Alabama provides integrated medical, social, and long-term care services to individuals 55 and older who qualify for nursing home level of care. An interdisciplinary team coordinates all services so participants can remain in the community.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Alabama Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact the Alabama Medicaid Agency or the national PACE Association to locate a PACE organization near you." },
      { step: 2, title: "Complete an assessment", description: "The PACE organization will conduct a comprehensive evaluation of your medical and social needs." },
      { step: 3, title: "Enroll in PACE", description: "Sign the enrollment agreement and transfer your Medicare and Medicaid coverage to the PACE organization." },
    ],
    forms: [
      { id: "al-pace", name: "Alabama PACE Program Information", description: "Contact Alabama Medicaid to request PACE enrollment", url: "https://medicaid.alabama.gov/content/5.0_howto_apply/5.1_apply_online.aspx" },
    ],
  },
];

// ─── Alaska ────────────────────────────────────────────────────────────────────

const alaskaPrograms: WaiverProgram[] = [
  {
    id: "sdaw",
    name: "Senior and Disabilities Access Waiver (SDAW)",
    shortName: "SDAW",
    tagline: "Community-based supports for Alaska seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Alaska's SDAW provides home and community-based services to individuals who need a nursing facility level of care. Services include personal care, adult day services, supported employment, and environmental modifications.",
    eligibilityHighlights: [
      "Age 65+ or adult with a physical disability",
      "Alaska Medicaid eligible",
      "Require nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact Senior and Disabilities Services", description: "Call Alaska's Division of Senior and Disabilities Services (SDS) to request a waiver services assessment." },
      { step: 2, title: "Needs assessment", description: "An SDS staff member will assess your functional needs to determine eligibility." },
      { step: 3, title: "Develop an Individual Service Plan", description: "Work with your case manager to develop a service plan addressing your specific care needs." },
    ],
    forms: [
      { id: "ak-sds", name: "Alaska Senior and Disabilities Services Application", description: "Contact SDS to begin the waiver application process", url: "https://health.alaska.gov/dsds/Pages/default.aspx" },
    ],
  },
  {
    id: "ak-pca",
    name: "Alaska Personal Care Attendant (PCA) Program",
    shortName: "AK PCA",
    tagline: "Self-directed personal care for Alaskans with disabilities",
    savingsRange: "$8,000 – $20,000/year",
    description: "The Alaska PCA Program allows individuals with disabilities to hire and direct their own personal care attendants. Participants manage their attendant care with support from a fiscal intermediary, maintaining maximum independence.",
    eligibilityHighlights: [
      "Alaska Medicaid eligible",
      "Have a physical or developmental disability requiring daily assistance",
      "Able to self-direct care or have a designated representative",
    ],
    applicationSteps: [
      { step: 1, title: "Verify Medicaid eligibility", description: "Confirm you have active Alaska Medicaid coverage before applying for the PCA program." },
      { step: 2, title: "Contact a PCA provider agency", description: "Work with a Medicaid-enrolled PCA agency in Alaska to begin enrollment." },
      { step: 3, title: "Hire your attendant", description: "Recruit, hire, and manage your personal care attendant with support from a fiscal intermediary." },
    ],
    forms: [
      { id: "ak-pca-info", name: "Alaska PCA Program Information", description: "Contact the Alaska Division of Senior and Disabilities Services to begin enrollment", url: "https://health.alaska.gov/dsds/Pages/pca/default.aspx" },
    ],
  },
];

// ─── Arizona ───────────────────────────────────────────────────────────────────

const arizonaPrograms: WaiverProgram[] = [
  {
    id: "altcs",
    name: "Arizona Long-Term Care System (ALTCS)",
    shortName: "ALTCS",
    tagline: "Arizona's comprehensive Medicaid program for long-term care",
    savingsRange: "$20,000 – $45,000/year",
    description: "ALTCS is Arizona's Medicaid managed care program for individuals who need nursing home level of care. It provides home and community-based services including personal care, home health, adult day health, and residential care.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical or developmental disability",
      "Arizona Medicaid (AHCCCS) eligible",
      "Meet nursing facility level of care criteria",
    ],
    applicationSteps: [
      { step: 1, title: "Apply at an AHCCCS office", description: "Submit an application at your local AHCCCS (Arizona Health Care Cost Containment System) office or apply online through healthearizonaplus.gov." },
      { step: 2, title: "Pre-admission screening", description: "A nurse will assess whether you meet the nursing facility level of care requirement." },
      { step: 3, title: "Choose a managed care contractor", description: "Select from ALTCS contractors in your region to coordinate your long-term care services." },
    ],
    forms: [
      { id: "az-altcs-app", name: "ALTCS Application (AHCCCS)", description: "Application for Arizona Long-Term Care System", url: "https://www.healthearizonaplus.gov/" },
    ],
  },
  {
    id: "pace-arizona",
    name: "Program of All-inclusive Care for the Elderly (PACE Arizona)",
    shortName: "PACE AZ",
    tagline: "All-inclusive senior care for nursing-home-eligible Arizonans",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Arizona offers comprehensive medical and social services through PACE organizations for individuals 55 and older who qualify for nursing home level of care. All care is coordinated by an interdisciplinary team.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Arizona AHCCCS (Medicaid) and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site in Arizona", description: "Contact AHCCCS or the national PACE Association to find a PACE organization in your area." },
      { step: 2, title: "Complete an eligibility assessment", description: "The PACE team will assess your medical, social, and functional needs." },
      { step: 3, title: "Enroll and transition coverage", description: "Sign the PACE enrollment agreement; your Medicaid and Medicare benefits transfer to the PACE plan." },
    ],
    forms: [
      { id: "az-pace", name: "Arizona PACE Information", description: "Contact AHCCCS to request PACE enrollment", url: "https://www.azahcccs.gov/Members/ProgramsAndCoveredServices/PACE.html" },
    ],
  },
];

// ─── Arkansas ──────────────────────────────────────────────────────────────────

const arkansasPrograms: WaiverProgram[] = [
  {
    id: "archoices",
    name: "ARChoices in Homecare",
    shortName: "ARChoices",
    tagline: "Medicaid home and community-based care for Arkansas adults",
    savingsRange: "$10,000 – $22,000/year",
    description: "ARChoices provides home and community-based services to elderly and disabled Arkansans who are eligible for nursing facility level of care. Services include personal care, adult day services, home-delivered meals, and assistive technology.",
    eligibilityHighlights: [
      "Age 21 or older",
      "Arkansas Medicaid eligible",
      "Require nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Medicaid", description: "Apply for Arkansas Medicaid through DHS if not already enrolled." },
      { step: 2, title: "Request an assessment", description: "Contact the Arkansas Division of Aging, Adult, and Behavioral Health Services (DAABHS) to request a needs assessment." },
      { step: 3, title: "Develop a Person-Centered Service Plan", description: "Work with your case manager to create a plan that identifies services to help you remain at home." },
    ],
    forms: [
      { id: "ar-dhs-app", name: "Arkansas Medicaid Application", description: "Apply for Arkansas Medicaid benefits through DHS", url: "https://access.arkansas.gov/" },
    ],
  },
  {
    id: "elderchoices",
    name: "ElderChoices Waiver",
    shortName: "ElderChoices",
    tagline: "Home-based services to help Arkansas seniors avoid nursing home placement",
    savingsRange: "$20,000 – $45,000/year",
    description: "ElderChoices is an Arkansas Medicaid waiver specifically for individuals 60 and older who need nursing home level of care. It provides homemaker services, personal care, adult day services, and care coordination.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Arkansas Medicaid eligible",
      "Clinically eligible for nursing home placement",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your local AAA", description: "Call your local Area Agency on Aging (AAA) or DAABHS to request ElderChoices services." },
      { step: 2, title: "Clinical screening", description: "A nurse will conduct a clinical screening to determine if you meet nursing home level of care criteria." },
      { step: 3, title: "Begin services", description: "Once approved, your case manager will arrange services according to your individual plan." },
    ],
    forms: [
      { id: "ar-elderchoices", name: "ElderChoices Referral", description: "Contact your local AAA to request ElderChoices services", url: "https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/" },
    ],
  },
];

// ─── Colorado ──────────────────────────────────────────────────────────────────

const coloradoPrograms: WaiverProgram[] = [
  {
    id: "ebd-waiver",
    name: "HCBS-Elderly, Blind and Disabled (EBD) Waiver",
    shortName: "EBD Waiver",
    tagline: "Home and community-based care for Colorado seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Colorado's EBD Waiver provides home and community-based services to elderly, blind, and disabled individuals who would otherwise require nursing home placement. Services include personal care, homemaker, adult day, and supported living.",
    eligibilityHighlights: [
      "Age 65+ or adults 18–64 who are blind or have a disability",
      "Colorado Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Colorado Medicaid", description: "Apply through PEAK (Colorado's benefits portal) or your local county human services office." },
      { step: 2, title: "Request a case manager", description: "Contact your local Single Entry Point (SEP) agency to request a needs assessment and case management." },
      { step: 3, title: "Develop a care plan", description: "Your case manager will conduct a functional assessment and develop a plan of care tailored to your needs." },
    ],
    forms: [
      { id: "co-peak", name: "Colorado PEAK Benefits Application", description: "Apply for Colorado Medicaid and HCBS waiver services", url: "https://peak.my.site.com/peak/s/" },
    ],
  },
  {
    id: "pace-colorado",
    name: "Program of All-inclusive Care for the Elderly (PACE Colorado)",
    shortName: "PACE CO",
    tagline: "Integrated care for nursing-home-eligible Colorado seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Colorado provides comprehensive health care and supportive services to individuals 55 and older who need nursing facility level of care. Services are coordinated by an interdisciplinary team at a local PACE center.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Colorado Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Colorado has PACE organizations in several counties. Contact the state or the PACE Association to find the nearest site." },
      { step: 2, title: "Schedule an assessment", description: "The PACE interdisciplinary team will evaluate your health, function, and social needs." },
      { step: 3, title: "Enroll", description: "Sign the PACE enrollment agreement; your Medicaid and Medicare benefits will transfer to your PACE organization." },
    ],
    forms: [
      { id: "co-pace", name: "Colorado PACE Program Information", description: "Contact Colorado HCPF for PACE referrals", url: "https://hcpf.colorado.gov/long-term-services-and-supports" },
    ],
  },
];

// ─── Connecticut ───────────────────────────────────────────────────────────────

const connecticutPrograms: WaiverProgram[] = [
  {
    id: "chcpe",
    name: "Connecticut Home Care Program for Elders (CHCPE)",
    shortName: "CHCPE",
    tagline: "State-funded and Medicaid home care for Connecticut seniors",
    savingsRange: "$10,000 – $22,000/year",
    description: "CHCPE provides home care services to Connecticut residents age 65 and older who are at risk of nursing home placement. The program includes both a Medicaid waiver component and a state-funded component for those who do not meet Medicaid financial limits.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Connecticut resident at risk of nursing home placement",
      "Functional needs in activities of daily living",
    ],
    applicationSteps: [
      { step: 1, title: "Apply through the DSS", description: "Contact the Connecticut Department of Social Services (DSS) or call 2-1-1 to apply for CHCPE." },
      { step: 2, title: "Functional and financial assessment", description: "A DSS assessor will evaluate your care needs and financial eligibility for the Medicaid or state-funded component." },
      { step: 3, title: "Receive services", description: "An approved care manager will arrange home care services according to your plan of care." },
    ],
    forms: [
      { id: "ct-chcpe", name: "CHCPE Application", description: "Apply for Connecticut Home Care Program for Elders", url: "https://portal.ct.gov/DSS/Health-And-Home-Care/Home-Care-Program-for-Elders" },
    ],
  },
  {
    id: "pace-connecticut",
    name: "Connecticut PACE Program",
    shortName: "PACE CT",
    tagline: "Comprehensive integrated care for nursing-home-eligible Connecticut seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "Connecticut's PACE program offers comprehensive medical and social services to individuals 55 and older who qualify for nursing home level of care. An interdisciplinary team coordinates all care through a local PACE center.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Connecticut Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a Connecticut PACE site", description: "Contact DSS or the PACE Association to locate a PACE organization in Connecticut near you." },
      { step: 2, title: "Assessment", description: "PACE staff will assess your health and functional needs to confirm eligibility." },
      { step: 3, title: "Enroll", description: "Sign the PACE enrollment agreement to begin receiving comprehensive care services." },
    ],
    forms: [
      { id: "ct-pace", name: "Connecticut PACE Information", description: "Contact DSS for PACE referral information", url: "https://portal.ct.gov/DSS/Health-And-Home-Care/PACE" },
    ],
  },
];

// ─── Delaware ──────────────────────────────────────────────────────────────────

const delawarePrograms: WaiverProgram[] = [
  {
    id: "dshp-plus",
    name: "Diamond State Health Plan Plus (DSHP+)",
    shortName: "DSHP+",
    tagline: "Integrated Medicaid managed care with long-term services for Delawareans",
    savingsRange: "$12,000 – $28,000/year",
    description: "DSHP+ is Delaware's Medicaid managed care program that integrates physical health, behavioral health, and long-term services and supports. It serves individuals who need nursing home level of care and prefer to remain in the community.",
    eligibilityHighlights: [
      "Delaware Medicaid eligible",
      "Need nursing facility level of care",
      "Age 65+ or adult with a disability",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Delaware Medicaid", description: "Apply through the Delaware ASSIST portal or at your local Division of Medicaid and Medical Assistance (DMMA) office." },
      { step: 2, title: "Level of care determination", description: "DMMA will assess your functional needs to determine if you require nursing facility level of care." },
      { step: 3, title: "Enroll in a DSHP+ managed care plan", description: "Choose from available DSHP+ plans in Delaware to begin receiving coordinated long-term care." },
    ],
    forms: [
      { id: "de-assist", name: "Delaware ASSIST Application", description: "Apply for Delaware Medicaid through Delaware ASSIST", url: "https://assist.dhss.delaware.gov/" },
    ],
  },
  {
    id: "pace-delaware",
    name: "Program of All-inclusive Care for the Elderly (PACE Delaware)",
    shortName: "PACE DE",
    tagline: "All-inclusive senior care for nursing-home-eligible Delawareans",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Delaware provides comprehensive health, social, and long-term care services for individuals 55 and older who qualify for nursing home level of care. Care is coordinated through a PACE center by an interdisciplinary team.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Delaware Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact the Delaware Division of Medicaid or the PACE Association to find a PACE site in Delaware." },
      { step: 2, title: "Assessment", description: "The PACE team assesses your health, functional, and social needs." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement and transfer your coverage to the PACE organization." },
    ],
    forms: [
      { id: "de-pace", name: "Delaware PACE Information", description: "Contact Delaware DMMA for PACE enrollment", url: "https://www.dhss.delaware.gov/dhss/dmma/ltss.html" },
    ],
  },
];

// ─── Georgia ───────────────────────────────────────────────────────────────────

const georgiaPrograms: WaiverProgram[] = [
  {
    id: "ccsp",
    name: "Community Care Services Program (CCSP)",
    shortName: "CCSP",
    tagline: "Medicaid waiver providing community-based services for Georgia seniors",
    savingsRange: "$10,000 – $22,000/year",
    description: "Georgia's CCSP provides home and community-based services to elderly and disabled individuals who are eligible for nursing facility level of care. Services include personal care, home health, adult day health, and respite care.",
    eligibilityHighlights: [
      "Age 65+ or adults 18+ with a physical disability",
      "Georgia Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your local AAA or DFCS", description: "Reach out to your local Area Agency on Aging or the Georgia Division of Family and Children Services to request CCSP services." },
      { step: 2, title: "Screening and assessment", description: "A case manager will screen your functional and financial eligibility and conduct a needs assessment." },
      { step: 3, title: "Service plan development", description: "Your case manager will develop a service plan to arrange the community-based services you need." },
    ],
    forms: [
      { id: "ga-ccsp", name: "Georgia CCSP Referral", description: "Contact your local AAA to request CCSP services", url: "https://aging.georgia.gov/services/community-care-services-program-ccsp" },
    ],
  },
  {
    id: "source",
    name: "Service Options Using Resources in a Community Environment (SOURCE)",
    shortName: "SOURCE",
    tagline: "Medicaid care coordination for frail Georgia seniors",
    savingsRange: "$10,000 – $22,000/year",
    description: "SOURCE is a Georgia Medicaid waiver that provides care coordination and community services to frail elderly individuals at risk of nursing home placement. A SOURCE nurse care coordinator manages all medical and social services.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Georgia Medicaid eligible",
      "Frail and at risk of nursing home placement",
    ],
    applicationSteps: [
      { step: 1, title: "Find a SOURCE provider", description: "Contact the Georgia Department of Community Health or a local SOURCE provider to begin enrollment." },
      { step: 2, title: "Assessment", description: "A SOURCE nurse care coordinator assesses your medical and social needs." },
      { step: 3, title: "Receive coordinated care", description: "Your care coordinator arranges and monitors all health and social services on your behalf." },
    ],
    forms: [
      { id: "ga-source", name: "Georgia SOURCE Program Information", description: "Contact DCH to find SOURCE providers near you", url: "https://dch.georgia.gov/medicaid/programs/source" },
    ],
  },
];

// ─── Hawaii ────────────────────────────────────────────────────────────────────

const hawaiiPrograms: WaiverProgram[] = [
  {
    id: "quest-expanded",
    name: "QUEST Expanded (QExA) HCBS Program",
    shortName: "QExA HCBS",
    tagline: "Medicaid managed HCBS for Hawaii seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Hawaii's QExA program provides integrated acute and long-term care services through Medicaid managed care plans for aged and disabled individuals. HCBS services help participants remain at home rather than entering a nursing facility.",
    eligibilityHighlights: [
      "Age 65+ or adults with a disability",
      "Hawaii Medicaid (Med-QUEST) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Med-QUEST", description: "Apply for Hawaii Medicaid through the Med-QUEST Division online portal or at a local office." },
      { step: 2, title: "Level of care assessment", description: "A Medicaid nurse conducts an assessment to determine if you need nursing facility level of care." },
      { step: 3, title: "Choose a QExA plan", description: "Select from available QExA managed care plans, which will coordinate your HCBS services." },
    ],
    forms: [
      { id: "hi-medquest", name: "Hawaii Med-QUEST Application", description: "Apply for Hawaii Medicaid and HCBS services", url: "https://medquest.hawaii.gov/en/apply-for-benefits.html" },
    ],
  },
  {
    id: "kupuna-care",
    name: "Kupuna Care Program",
    shortName: "Kupuna Care",
    tagline: "State-funded home and community services for Hawaii seniors",
    savingsRange: "$8,000 – $20,000/year",
    description: "Kupuna Care is a Hawaii state-funded program providing home and community-based services to adults 60 and older who need assistance but do not qualify for Medicaid. Services include personal care, homemaker, adult day, and transportation.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Hawaii resident",
      "Need assistance with daily activities but do not qualify for Medicaid",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your local Aging and Disability Resource Center", description: "Call Hawaii's ADRC or Area Agency on Aging to request a Kupuna Care assessment." },
      { step: 2, title: "Functional assessment", description: "A case manager assesses your ability to perform daily living activities." },
      { step: 3, title: "Service arrangement", description: "Your case manager arranges appropriate community services based on your needs and available funding." },
    ],
    forms: [
      { id: "hi-kupuna", name: "Kupuna Care Application", description: "Contact the Hawaii Executive Office on Aging to apply", url: "https://health.hawaii.gov/eoa/home/kupuna-care/" },
    ],
  },
];

// ─── Idaho ─────────────────────────────────────────────────────────────────────

const idahoPrograms: WaiverProgram[] = [
  {
    id: "aged-disabled-waiver",
    name: "Idaho HCBS Aged and Disabled (A&D) Waiver",
    shortName: "ID A&D Waiver",
    tagline: "Home-based Medicaid care for Idaho seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Idaho's A&D Waiver provides home and community-based services to aged and disabled individuals who need nursing facility level of care. Services include personal care, adult day health, respite, and homemaker services.",
    eligibilityHighlights: [
      "Age 65+ or adults 18–64 with a physical disability",
      "Idaho Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Idaho Medicaid", description: "Apply through Your Health Idaho or the Idaho Department of Health and Welfare." },
      { step: 2, title: "Request waiver services", description: "Contact Idaho DHW's Division of Medicaid to request placement on the A&D Waiver interest list." },
      { step: 3, title: "Needs assessment and service plan", description: "A DHW nurse assesses your needs; a case manager develops your service plan." },
    ],
    forms: [
      { id: "id-medicaid", name: "Idaho Medicaid Application", description: "Apply for Idaho Medicaid through DHW", url: "https://healthandwelfare.idaho.gov/services-programs/benefits-assistance/medicaid" },
    ],
  },
  {
    id: "id-dd-waiver",
    name: "Idaho Developmental Disabilities (DD) Waiver",
    shortName: "ID DD Waiver",
    tagline: "Medicaid supports for Idahoans with developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The Idaho DD Waiver provides home and community-based services for individuals with developmental disabilities who need intermediate care facility level of care. Services include supported living, behavioral support, and habilitation.",
    eligibilityHighlights: [
      "Have an intellectual disability, cerebral palsy, epilepsy, or autism spectrum disorder",
      "Idaho Medicaid eligible",
      "Need ICF/ID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your regional CILA", description: "Reach out to your local Community Inclusion & Living Arrangement (CILA) agency or DHW region office." },
      { step: 2, title: "Eligibility determination", description: "DHW staff will evaluate your disability and functional level to determine DD waiver eligibility." },
      { step: 3, title: "Individual Service Plan", description: "Work with your case manager and providers to develop an Individual Service Plan (ISP)." },
    ],
    forms: [
      { id: "id-dd", name: "Idaho DD Services Application", description: "Contact Idaho DHW to request DD waiver services", url: "https://healthandwelfare.idaho.gov/services-programs/developmental-disabilities" },
    ],
  },
];

// ─── Illinois ──────────────────────────────────────────────────────────────────

const illinoisPrograms: WaiverProgram[] = [
  {
    id: "community-care",
    name: "Community Care Program (CCP)",
    shortName: "CCP",
    tagline: "State-funded home services helping Illinois seniors avoid nursing home care",
    savingsRange: "$8,000 – $20,000/year",
    description: "Illinois's CCP is administered by the Department on Aging and provides in-home services to Medicaid-eligible seniors who are at risk of nursing home placement. Services include homemaker services, adult day care, emergency home response, and care coordination.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Illinois Medicaid eligible (or meet income/asset limits)",
      "At risk of nursing home placement",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your local Care Coordination Unit", description: "Call the Illinois Department on Aging's helpline at 1-800-252-8966 or your local Area Agency on Aging to apply." },
      { step: 2, title: "Assessment", description: "A care coordinator will visit to assess your functional needs and living situation." },
      { step: 3, title: "Begin services", description: "Once approved, a homemaker or adult day provider is assigned based on your plan of care." },
    ],
    forms: [
      { id: "il-ccp", name: "Illinois CCP Application", description: "Contact the Illinois Department on Aging to apply for CCP", url: "https://aging.illinois.gov/community-care-program" },
    ],
  },
  {
    id: "il-hcbs-elderly",
    name: "Illinois HCBS Waiver for Persons who are Elderly",
    shortName: "IL Elderly Waiver",
    tagline: "Medicaid waiver providing home-based alternatives to nursing home care",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Illinois Medicaid HCBS Waiver for Elderly individuals provides a range of home and community-based services to seniors who qualify for nursing facility level of care. It covers services such as personal care, home health, and day habilitation.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Illinois Medicaid eligible",
      "Clinically eligible for nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Medicaid", description: "Enroll in Illinois Medicaid through HFS if not already eligible." },
      { step: 2, title: "Contact a Care Coordination Unit", description: "Request HCBS waiver services through your local Care Coordination Unit or Area Agency on Aging." },
      { step: 3, title: "Level of care determination", description: "A nurse will complete a pre-admission screening to confirm nursing facility level of care eligibility." },
    ],
    forms: [
      { id: "il-hcbs", name: "Illinois HCBS Waiver Information", description: "Contact HFS or your AAA to request HCBS waiver services", url: "https://hfs.illinois.gov/medicalclients/ltss.html" },
    ],
  },
];

// ─── Indiana ───────────────────────────────────────────────────────────────────

const indianaPrograms: WaiverProgram[] = [
  {
    id: "pathways-aging",
    name: "Pathways for Aging",
    shortName: "Pathways",
    tagline: "Indiana's Medicaid managed care program for seniors needing long-term care",
    savingsRange: "$12,000 – $28,000/year",
    description: "Pathways for Aging is Indiana's Medicaid managed care program for adults 60 and older who need nursing home level of care. It integrates physical health, behavioral health, and HCBS services through a single managed care plan.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Indiana Medicaid eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Indiana Medicaid", description: "Apply through Indiana's Benefits Portal (benefits.in.gov) or your local FSSA office." },
      { step: 2, title: "Level of care screening", description: "FSSA will assess whether you meet nursing home level of care criteria." },
      { step: 3, title: "Choose a Pathways plan", description: "Select a Pathways managed care organization to coordinate your long-term services and supports." },
    ],
    forms: [
      { id: "in-medicaid", name: "Indiana Medicaid Application", description: "Apply for Indiana Medicaid through the Benefits Portal", url: "https://benefits.in.gov/" },
    ],
  },
  {
    id: "in-aged-disabled",
    name: "Indiana HCBS Aged and Disabled (A&D) Waiver",
    shortName: "IN A&D Waiver",
    tagline: "Home-based Medicaid services for Indiana adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Indiana A&D Waiver provides home and community-based services to adults who need nursing home level of care. Services include personal care, respite care, home modifications, adult day services, and case management.",
    eligibilityHighlights: [
      "Age 18 or older with a physical disability",
      "Indiana Medicaid eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your local BDDS or DDRS office", description: "Contact the Indiana Division of Aging or Disability and Rehabilitative Services to request an assessment." },
      { step: 2, title: "Functional assessment", description: "A nurse will evaluate your care needs to determine waiver eligibility." },
      { step: 3, title: "Service plan", description: "Develop an individualized service plan with your case manager and approved providers." },
    ],
    forms: [
      { id: "in-ad-waiver", name: "Indiana A&D Waiver Application", description: "Contact Indiana Division of Aging to apply", url: "https://www.in.gov/fssa/da/programs-and-services/home-and-community-based-services/" },
    ],
  },
];

// ─── Iowa ──────────────────────────────────────────────────────────────────────

const iowaPrograms: WaiverProgram[] = [
  {
    id: "iowa-elderly-waiver",
    name: "Iowa Elderly Waiver",
    shortName: "IA Elderly Waiver",
    tagline: "Home-based Medicaid services for Iowa seniors at risk of nursing home placement",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Iowa Elderly Waiver provides home and community-based services to Medicaid-eligible adults age 65 and older who need nursing facility level of care. Services include personal care, home health aide, adult day, and home-delivered meals.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Iowa Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Iowa Medicaid", description: "Apply for Iowa Medicaid through Iowa DHS or online at dhs.iowa.gov." },
      { step: 2, title: "Contact Iowa Medicaid Enterprise", description: "Request waiver services through Iowa Medicaid Enterprise or your local Managed Care Organization (MCO)." },
      { step: 3, title: "Assessment and service plan", description: "A nurse will assess your needs; a case manager develops your service plan." },
    ],
    forms: [
      { id: "ia-medicaid", name: "Iowa Medicaid Application", description: "Apply for Iowa Medicaid through DHS", url: "https://dhs.iowa.gov/ime/members/medicaid-a-to-z/hcbs" },
    ],
  },
  {
    id: "iowa-bi-waiver",
    name: "Iowa Brain Injury (BI) Waiver",
    shortName: "IA BI Waiver",
    tagline: "Medicaid home supports for Iowans with acquired brain injuries",
    savingsRange: "$10,000 – $25,000/year",
    description: "Iowa's BI Waiver provides home and community-based services to individuals with acquired brain injuries who need nursing facility level of care. Services include supported community living, day habilitation, and behavioral programming.",
    eligibilityHighlights: [
      "Have an acquired brain injury diagnosis",
      "Iowa Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Enroll in Iowa Medicaid", description: "Confirm Iowa Medicaid eligibility before requesting BI waiver services." },
      { step: 2, title: "Contact Iowa Medicaid or your MCO", description: "Request BI Waiver services through Iowa Medicaid Enterprise or your managed care plan." },
      { step: 3, title: "Assessment and plan", description: "An interdisciplinary team assesses your brain injury-related needs and develops a service plan." },
    ],
    forms: [
      { id: "ia-bi", name: "Iowa BI Waiver Information", description: "Contact Iowa Medicaid Enterprise to request Brain Injury Waiver services", url: "https://dhs.iowa.gov/ime/members/medicaid-a-to-z/hcbs" },
    ],
  },
];

// ─── Kansas ────────────────────────────────────────────────────────────────────

const kansasPrograms: WaiverProgram[] = [
  {
    id: "frail-elderly",
    name: "Kansas HCBS Frail Elderly (FE) Waiver",
    shortName: "KS FE Waiver",
    tagline: "Home and community-based services for Kansas seniors",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Kansas FE Waiver provides home and community-based services to elderly individuals who need nursing facility level of care. Services include personal care, adult day care, home health aide, and respite care.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Kansas Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Kansas Medicaid (KanCare)", description: "Apply for KanCare through Kansas DCF online at kancare.ks.gov." },
      { step: 2, title: "Request waiver services", description: "Contact your KanCare managed care organization to request HCBS Frail Elderly Waiver services." },
      { step: 3, title: "Assessment and plan", description: "A nurse will assess your needs and work with you to develop a plan of care." },
    ],
    forms: [
      { id: "ks-kancare", name: "KanCare Application", description: "Apply for Kansas Medicaid (KanCare) to access HCBS waiver services", url: "https://kancare.ks.gov/" },
    ],
  },
  {
    id: "ks-pd-waiver",
    name: "Kansas HCBS Physical Disability (PD) Waiver",
    shortName: "KS PD Waiver",
    tagline: "Medicaid supports for Kansans with physical disabilities",
    savingsRange: "$8,000 – $20,000/year",
    description: "The Kansas PD Waiver provides home and community-based services to adults with physical disabilities who need nursing facility level of care. Services include personal care, assistive technology, supported employment, and residential supports.",
    eligibilityHighlights: [
      "Age 16 or older with a physical disability",
      "Kansas Medicaid (KanCare) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Enroll in KanCare", description: "Apply for KanCare Medicaid through Kansas DCF." },
      { step: 2, title: "Contact your MCO", description: "Request PD Waiver services through your KanCare managed care organization." },
      { step: 3, title: "Assessment", description: "A nurse conducts a functional assessment to determine waiver eligibility and service needs." },
    ],
    forms: [
      { id: "ks-pd", name: "Kansas PD Waiver Information", description: "Contact your KanCare MCO to request PD Waiver services", url: "https://kancare.ks.gov/for-members/services-available" },
    ],
  },
];

// ─── Kentucky ──────────────────────────────────────────────────────────────────

const kentuckyPrograms: WaiverProgram[] = [
  {
    id: "ky-model-waiver",
    name: "Kentucky HCBS Model Waiver",
    shortName: "KY Model Waiver",
    tagline: "Medicaid home and community-based care for Kentucky seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Kentucky HCBS Model Waiver provides home and community-based services to aged and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, respite, and adult day care.",
    eligibilityHighlights: [
      "Age 65+ or adults 18–64 with a physical disability",
      "Kentucky Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Kentucky Medicaid", description: "Apply through kynect.ky.gov or your local DCBS office." },
      { step: 2, title: "Request waiver services", description: "Contact the Kentucky Cabinet for Health and Family Services, Aging and Independent Living office to request the Model Waiver." },
      { step: 3, title: "Needs assessment", description: "A nurse conducts a needs assessment and a case manager develops your service plan." },
    ],
    forms: [
      { id: "ky-medicaid", name: "Kentucky Medicaid Application", description: "Apply through kynect for Kentucky Medicaid and waiver services", url: "https://kynect.ky.gov/" },
    ],
  },
  {
    id: "ky-scl",
    name: "Kentucky Supports for Community Living (SCL) Waiver",
    shortName: "SCL Waiver",
    tagline: "Medicaid supports for Kentuckians with intellectual and developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The SCL Waiver provides home and community-based services to individuals with intellectual disabilities or other developmental disabilities. Services include supported employment, residential support, day habilitation, and behavioral support.",
    eligibilityHighlights: [
      "Have an intellectual disability or qualifying developmental disability",
      "Kentucky Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact CHFS-DBHDID", description: "Reach out to Kentucky's Division of Behavioral Health, Developmental and Intellectual Disabilities to request SCL services." },
      { step: 2, title: "Eligibility determination", description: "DBHDID will assess whether your disability qualifies you for the SCL waiver." },
      { step: 3, title: "Service plan development", description: "Work with a support coordinator to develop your Individual Support Plan (ISP)." },
    ],
    forms: [
      { id: "ky-scl", name: "Kentucky SCL Waiver Information", description: "Contact CHFS-DBHDID to request SCL Waiver services", url: "https://chfs.ky.gov/agencies/dbhdid/Pages/scl.aspx" },
    ],
  },
];

// ─── Louisiana ─────────────────────────────────────────────────────────────────

const louisianaPrograms: WaiverProgram[] = [
  {
    id: "community-choices",
    name: "OAAS Community Choices Waiver",
    shortName: "Community Choices",
    tagline: "Louisiana Medicaid waiver for seniors and adults with physical disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Community Choices Waiver is administered by Louisiana's Office of Aging and Adult Services and provides home and community-based services to older adults and adults with physical disabilities who would otherwise require nursing home care.",
    eligibilityHighlights: [
      "Age 65+ or adults 21–64 with a physical disability",
      "Louisiana Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Louisiana Medicaid", description: "Apply through Louisiana Medicaid online or at your local DCFS office." },
      { step: 2, title: "Contact OAAS", description: "Contact the Louisiana Office of Aging and Adult Services to request Community Choices Waiver services." },
      { step: 3, title: "Assessment and service plan", description: "An OAAS nurse assesses your needs; a case manager develops your plan of care." },
    ],
    forms: [
      { id: "la-oaas", name: "Louisiana OAAS Waiver Application", description: "Contact OAAS to apply for Community Choices Waiver services", url: "https://ldh.la.gov/page/community-choices-waiver" },
    ],
  },
  {
    id: "now-waiver",
    name: "New Opportunities Waiver (NOW)",
    shortName: "NOW",
    tagline: "Louisiana's self-directed Medicaid waiver for adults with developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The NOW Waiver provides home and community-based services to individuals with intellectual and developmental disabilities. Participants can self-direct their services, choosing their own providers and managing their individualized budget.",
    eligibilityHighlights: [
      "Have an intellectual disability, developmental disability, or related condition",
      "Louisiana Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact OCDD", description: "Contact Louisiana's Office for Citizens with Developmental Disabilities (OCDD) to request NOW Waiver services." },
      { step: 2, title: "Eligibility determination", description: "OCDD will evaluate your disability and functional needs." },
      { step: 3, title: "Support coordinator and plan", description: "Choose a support coordinator to help develop your plan of care and manage your waiver budget." },
    ],
    forms: [
      { id: "la-now", name: "Louisiana NOW Waiver Information", description: "Contact OCDD to request NOW Waiver services", url: "https://ldh.la.gov/page/now" },
    ],
  },
];

// ─── Maine ─────────────────────────────────────────────────────────────────────

const mainePrograms: WaiverProgram[] = [
  {
    id: "maine-hcbs",
    name: "Maine HCBS Waiver for Adults with Other Related Conditions",
    shortName: "ME HCBS Waiver",
    tagline: "Home and community-based Medicaid services for Maine adults",
    savingsRange: "$10,000 – $22,000/year",
    description: "Maine's HCBS Waiver provides home and community-based services to adults with physical disabilities or other related conditions who need nursing facility level of care. Services include personal care, home health, adult day, and community support.",
    eligibilityHighlights: [
      "Age 18 or older with a physical disability or related condition",
      "Maine Medicaid (MaineCare) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for MaineCare", description: "Apply for Maine Medicaid through DHHS or online at maine.gov/dhhs." },
      { step: 2, title: "Request waiver services", description: "Contact Maine DHHS Office of Aging and Disability to request HCBS waiver services." },
      { step: 3, title: "Assessment and plan", description: "A nurse assesses your needs and a case manager develops your service plan." },
    ],
    forms: [
      { id: "me-mainecare", name: "MaineCare Application", description: "Apply for Maine Medicaid (MaineCare) through DHHS", url: "https://www.maine.gov/dhhs/ofi/programs-services/mainecare" },
    ],
  },
  {
    id: "pace-maine",
    name: "PACE Maine",
    shortName: "PACE ME",
    tagline: "Comprehensive integrated care for nursing-home-eligible Maine seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Maine provides all-inclusive medical and social services to individuals 55 and older who need nursing home level of care. An interdisciplinary care team coordinates services at a local PACE center, enabling participants to live in the community.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Maine MaineCare and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact Maine DHHS or the PACE Association to find a PACE organization near you in Maine." },
      { step: 2, title: "Assessment", description: "The PACE team assesses your medical, functional, and social needs." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement; your MaineCare and Medicare coverage transfers to the PACE plan." },
    ],
    forms: [
      { id: "me-pace", name: "Maine PACE Information", description: "Contact Maine DHHS for PACE enrollment", url: "https://www.maine.gov/dhhs/oes/older-adults/pace" },
    ],
  },
];

// ─── Maryland ──────────────────────────────────────────────────────────────────

const marylandPrograms: WaiverProgram[] = [
  {
    id: "co-waiver",
    name: "Maryland Community Options Waiver (CO)",
    shortName: "MD CO Waiver",
    tagline: "Medicaid waiver enabling Maryland adults to remain at home",
    savingsRange: "$8,000 – $20,000/year",
    description: "The Maryland Community Options Waiver provides home and community-based services to individuals with physical disabilities who need nursing facility level of care. Services include personal care, assistive technology, community support, and supported employment.",
    eligibilityHighlights: [
      "Age 18–64 with a physical disability",
      "Maryland Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Maryland Medicaid", description: "Apply through Maryland Health Connection (marylandhealthconnection.gov) or your local DSS office." },
      { step: 2, title: "Contact DHMH/OLTC", description: "Contact the Maryland Department of Health, Office of Long-Term Care to request CO Waiver services." },
      { step: 3, title: "Assessment and service plan", description: "A nurse assesses your functional needs; a care coordinator develops your service plan." },
    ],
    forms: [
      { id: "md-medicaid", name: "Maryland Medicaid Application", description: "Apply for Maryland Medicaid through Maryland Health Connection", url: "https://www.marylandhealthconnection.gov/" },
    ],
  },
  {
    id: "pace-maryland",
    name: "PACE Maryland",
    shortName: "PACE MD",
    tagline: "Integrated care for nursing-home-eligible Maryland seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Maryland provides comprehensive medical, social, and long-term care services for individuals 55 and older who qualify for nursing home level of care. Care is coordinated by an interdisciplinary team through a local PACE center.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Maryland Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact Maryland Department of Health or the PACE Association to find a Maryland PACE site near you." },
      { step: 2, title: "Assessment", description: "The PACE team evaluates your health and functional needs." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement and transfer your Medicaid and Medicare coverage to the PACE plan." },
    ],
    forms: [
      { id: "md-pace", name: "Maryland PACE Information", description: "Contact Maryland Department of Health for PACE enrollment", url: "https://health.maryland.gov/mmcp/ltc/pages/home.aspx" },
    ],
  },
];

// ─── Massachusetts ─────────────────────────────────────────────────────────────

const massachusettsPrograms: WaiverProgram[] = [
  {
    id: "adult-foster-care",
    name: "Adult Foster Care (AFC)",
    shortName: "AFC",
    tagline: "Live-in caregiver support for Massachusetts adults who need daily assistance",
    savingsRange: "$18,000 – $40,000/year",
    description: "Massachusetts AFC allows adults who need daily care to live with a trained caregiver in a family home setting. The program pays the caregiver and is an alternative to nursing home placement for individuals who need nursing facility level of care.",
    eligibilityHighlights: [
      "Age 16 or older",
      "Massachusetts MassHealth eligible",
      "Need nursing facility level of care",
      "Have a caregiver willing to live with them",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for MassHealth", description: "Apply for Massachusetts Medicaid (MassHealth) if not already enrolled." },
      { step: 2, title: "Find a licensed AFC provider agency", description: "Contact a MassHealth-licensed AFC provider agency to begin the enrollment process." },
      { step: 3, title: "Assessment and caregiver training", description: "A nurse assesses your care needs; your caregiver completes required training." },
    ],
    forms: [
      { id: "ma-afc", name: "Massachusetts AFC Program Information", description: "Contact MassHealth to find AFC provider agencies", url: "https://www.mass.gov/adult-foster-care-and-group-adult-foster-care" },
    ],
  },
  {
    id: "pace-mass",
    name: "PACE Massachusetts (Program of All-inclusive Care)",
    shortName: "PACE MA",
    tagline: "Comprehensive managed care for nursing-home-eligible Massachusetts residents",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Massachusetts provides integrated medical, social, and long-term care services to individuals 55 and older who qualify for nursing home level of care. Multiple PACE organizations operate across the state.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Massachusetts MassHealth and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Massachusetts has numerous PACE organizations. Contact MassHealth or the PACE Association to find one near you." },
      { step: 2, title: "Intake and assessment", description: "The PACE team evaluates your medical, functional, and social needs." },
      { step: 3, title: "Enroll", description: "Sign the PACE enrollment agreement to transition your MassHealth and Medicare benefits." },
    ],
    forms: [
      { id: "ma-pace", name: "Massachusetts PACE Information", description: "Contact MassHealth for PACE program options", url: "https://www.mass.gov/pace-program-of-all-inclusive-care-for-the-elderly" },
    ],
  },
];

// ─── Michigan ──────────────────────────────────────────────────────────────────

const michiganPrograms: WaiverProgram[] = [
  {
    id: "mi-choice",
    name: "MI Choice Medicaid Waiver",
    shortName: "MI Choice",
    tagline: "Michigan's flagship home and community-based waiver for seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "MI Choice is Michigan's HCBS Medicaid waiver providing home and community-based services to adults who need nursing home level of care. Services include personal care, homemaker, adult day, skilled nursing, and home modifications.",
    eligibilityHighlights: [
      "Age 65+ or adults 18–64 with a physical disability",
      "Michigan Medicaid eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Michigan Medicaid", description: "Apply for Michigan Medicaid through mibridges.michigan.gov." },
      { step: 2, title: "Contact a Waiver Agent", description: "Reach out to a MI Choice Waiver Agent in your area to request an assessment." },
      { step: 3, title: "Assessment and person-centered plan", description: "A nurse assesses your needs; a case manager develops your person-centered service plan." },
    ],
    forms: [
      { id: "mi-medicaid", name: "Michigan Medicaid Application", description: "Apply for Michigan Medicaid through MI Bridges", url: "https://newmibridges.michigan.gov/" },
    ],
  },
  {
    id: "pace-michigan",
    name: "PACE Michigan",
    shortName: "PACE MI",
    tagline: "All-inclusive Medicare and Medicaid care for nursing-home-eligible Michiganders",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Michigan provides comprehensive medical, behavioral, and long-term care services to individuals 55 and older who qualify for nursing home level of care. Services are coordinated through a PACE center by an interdisciplinary team.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Michigan Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact MDHHS or the PACE Association to find a Michigan PACE organization near you." },
      { step: 2, title: "Assessment", description: "The PACE interdisciplinary team evaluates your health and care needs." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement; your Medicaid and Medicare coverage transfers to the PACE plan." },
    ],
    forms: [
      { id: "mi-pace", name: "Michigan PACE Program Information", description: "Contact MDHHS for PACE enrollment details", url: "https://www.michigan.gov/mdhhs/keep-mi-healthy/behavioral-health/aging/pace" },
    ],
  },
];

// ─── Minnesota ─────────────────────────────────────────────────────────────────

const minnesotaPrograms: WaiverProgram[] = [
  {
    id: "elderly-waiver",
    name: "Minnesota Elderly Waiver (EW)",
    shortName: "MN Elderly Waiver",
    tagline: "Home and community-based care for Minnesota seniors at risk of nursing home placement",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Minnesota Elderly Waiver provides home and community-based services to adults 65 and older who need nursing facility level of care. Services include personal care, homemaker, adult day, and care management.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Minnesota Medicaid (Medical Assistance) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Medical Assistance", description: "Apply for Minnesota Medicaid through MNsure or your county human services office." },
      { step: 2, title: "Contact your county or lead agency", description: "Request EW services through your county human services agency or a Managed Care Organization." },
      { step: 3, title: "MnCHOICES assessment", description: "A trained assessor will complete the MnCHOICES assessment to determine your care needs." },
    ],
    forms: [
      { id: "mn-mnsure", name: "Minnesota Medicaid Application", description: "Apply for Minnesota Medical Assistance through MNsure", url: "https://www.mnsure.org/" },
    ],
  },
  {
    id: "mn-bi-waiver",
    name: "Minnesota Brain Injury (BI) Waiver",
    shortName: "MN BI Waiver",
    tagline: "Medicaid supports for Minnesotans with acquired brain injuries",
    savingsRange: "$10,000 – $25,000/year",
    description: "Minnesota's BI Waiver provides home and community-based services to individuals with acquired brain injuries who need nursing facility level of care. Services include supported living, structured day program, and behavioral programming.",
    eligibilityHighlights: [
      "Have an acquired brain injury",
      "Minnesota Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Medical Assistance", description: "Confirm Minnesota Medicaid eligibility before requesting BI waiver services." },
      { step: 2, title: "Contact your county", description: "Request Brain Injury Waiver services through your county human services office." },
      { step: 3, title: "Assessment and service plan", description: "A MnCHOICES assessment determines your care needs; a case manager develops your service plan." },
    ],
    forms: [
      { id: "mn-bi", name: "Minnesota BI Waiver Information", description: "Contact your county human services agency to request BI Waiver services", url: "https://mn.gov/dhs/people-we-serve/adults/services/brain-injury/" },
    ],
  },
];

// ─── Mississippi ───────────────────────────────────────────────────────────────

const mississippiPrograms: WaiverProgram[] = [
  {
    id: "ms-il-waiver",
    name: "Mississippi Independent Living (IL) Waiver",
    shortName: "MS IL Waiver",
    tagline: "Medicaid home-based services for Mississippi adults with disabilities",
    savingsRange: "$8,000 – $20,000/year",
    description: "Mississippi's IL Waiver provides home and community-based services to adults with physical disabilities who need nursing facility level of care. Services include personal care, homemaker, respite, and supported employment.",
    eligibilityHighlights: [
      "Age 18–64 with a physical disability",
      "Mississippi Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Mississippi Medicaid", description: "Apply for Mississippi Medicaid through the Division of Medicaid online portal." },
      { step: 2, title: "Request IL Waiver services", description: "Contact the Mississippi Division of Medicaid or MDRS to request Independent Living Waiver placement." },
      { step: 3, title: "Functional assessment", description: "A Medicaid nurse assesses your care needs to confirm nursing facility level of care eligibility." },
    ],
    forms: [
      { id: "ms-medicaid", name: "Mississippi Medicaid Application", description: "Apply for Mississippi Medicaid through the Division of Medicaid", url: "https://medicaid.ms.gov/apply-for-medicaid/" },
    ],
  },
  {
    id: "pace-mississippi",
    name: "PACE Mississippi",
    shortName: "PACE MS",
    tagline: "All-inclusive care for nursing-home-eligible Mississippi seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Mississippi provides integrated medical, social, and long-term care services to individuals 55 and older who qualify for nursing home level of care. Care is coordinated by an interdisciplinary team at a local PACE center.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Mississippi Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact the Mississippi Division of Medicaid or the PACE Association to find a PACE site near you." },
      { step: 2, title: "Assessment", description: "PACE staff assess your medical, functional, and social needs." },
      { step: 3, title: "Enroll", description: "Sign the PACE enrollment agreement to transfer your Medicaid and Medicare coverage." },
    ],
    forms: [
      { id: "ms-pace", name: "Mississippi PACE Information", description: "Contact the MS Division of Medicaid for PACE enrollment", url: "https://medicaid.ms.gov/providers/provider-types/pace/" },
    ],
  },
];

// ─── Missouri ──────────────────────────────────────────────────────────────────

const missouriPrograms: WaiverProgram[] = [
  {
    id: "mo-aged-disabled",
    name: "Missouri HCBS Aged and Disabled (AD) Waiver",
    shortName: "MO AD Waiver",
    tagline: "Medicaid home services for Missouri seniors and adults with disabilities",
    savingsRange: "$6,000 – $18,000/year",
    description: "Missouri's AD Waiver provides home and community-based services to aged and disabled individuals who need nursing facility level of care. Services include personal care, home health aide, adult day, and respite care.",
    eligibilityHighlights: [
      "Age 63+ or adults with a qualifying disability",
      "Missouri Medicaid (MO HealthNet) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for MO HealthNet", description: "Apply for Missouri Medicaid through mydss.mo.gov or your local Family Support Division office." },
      { step: 2, title: "Request AD Waiver services", description: "Contact Missouri DHSS Division of Senior and Disability Services to request waiver placement." },
      { step: 3, title: "Assessment", description: "A nurse conducts a functional assessment to confirm eligibility and identify your care needs." },
    ],
    forms: [
      { id: "mo-dss", name: "Missouri MO HealthNet Application", description: "Apply for Missouri Medicaid (MO HealthNet)", url: "https://mydss.mo.gov/" },
    ],
  },
  {
    id: "mo-myway",
    name: "Missouri MyWay Self-Directed Services",
    shortName: "MyWay",
    tagline: "Self-directed Medicaid services for Missouri adults who want to manage their own care",
    savingsRange: "$8,000 – $20,000/year",
    description: "MyWay is Missouri's self-directed option within its Medicaid waiver programs, allowing eligible individuals to hire and manage their own personal care workers. Participants control their care decisions with support from a fiscal intermediary.",
    eligibilityHighlights: [
      "Enrolled in a qualifying Missouri Medicaid waiver",
      "Able to self-direct care or have a representative",
      "Missouri Medicaid eligible",
    ],
    applicationSteps: [
      { step: 1, title: "Enroll in a qualifying waiver", description: "First enroll in the Missouri AD or other qualifying Medicaid waiver." },
      { step: 2, title: "Request self-direction", description: "Inform your case manager you wish to use the self-directed MyWay option." },
      { step: 3, title: "Hire your workers", description: "With support from a fiscal intermediary, recruit and hire your personal care workers." },
    ],
    forms: [
      { id: "mo-myway", name: "Missouri MyWay Information", description: "Contact DHSS to request the self-directed services option", url: "https://health.mo.gov/seniors/homeandcommunity/" },
    ],
  },
];

// ─── Montana ───────────────────────────────────────────────────────────────────

const montanaPrograms: WaiverProgram[] = [
  {
    id: "eppd-waiver",
    name: "Montana HCBS for Elderly and People with Physical Disabilities (EPPD) Waiver",
    shortName: "MT EPPD Waiver",
    tagline: "Home-based Medicaid services for Montana seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Montana's EPPD Waiver provides home and community-based services to elderly and physically disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and respite care.",
    eligibilityHighlights: [
      "Age 65+ or adults 18–64 with a physical disability",
      "Montana Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Montana Medicaid", description: "Apply for Medicaid through the Montana Department of Public Health and Human Services (DPHHS)." },
      { step: 2, title: "Request waiver services", description: "Contact Montana DPHHS Senior and Long-Term Care Division to request EPPD Waiver services." },
      { step: 3, title: "Functional assessment", description: "A nurse assesses your care needs to confirm nursing facility level of care eligibility." },
    ],
    forms: [
      { id: "mt-medicaid", name: "Montana Medicaid Application", description: "Apply for Montana Medicaid through DPHHS", url: "https://dphhs.mt.gov/MontanaHealthcarePrograms/HCBS" },
    ],
  },
  {
    id: "mt-dd-waiver",
    name: "Montana Developmental Disabilities (DD) Waiver",
    shortName: "MT DD Waiver",
    tagline: "Medicaid community supports for Montanans with developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The Montana DD Waiver provides home and community-based services to individuals with developmental disabilities who need ICF/IID level of care. Services include supported living, day habilitation, and supported employment.",
    eligibilityHighlights: [
      "Have an intellectual disability or developmental disability",
      "Montana Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your local DD services office", description: "Reach out to DPHHS Developmental Services Division to begin the waiver eligibility process." },
      { step: 2, title: "Eligibility determination", description: "DPHHS evaluates your disability and functional needs." },
      { step: 3, title: "Individual Support Plan", description: "Work with a support coordinator to develop your Individual Support Plan." },
    ],
    forms: [
      { id: "mt-dd", name: "Montana DD Waiver Information", description: "Contact DPHHS Developmental Services Division", url: "https://dphhs.mt.gov/detd/developmentalservices" },
    ],
  },
];

// ─── Nebraska ──────────────────────────────────────────────────────────────────

const nebraskaPrograms: WaiverProgram[] = [
  {
    id: "ne-aged-disabled",
    name: "Nebraska Aged and Disabled (AD) Waiver",
    shortName: "NE AD Waiver",
    tagline: "Medicaid home-based services for Nebraska seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Nebraska's AD Waiver provides home and community-based services to aged and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day health, and home modifications.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "Nebraska Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Nebraska Medicaid", description: "Apply for Medicaid through ACCESSNebraska online portal or your local DHHS office." },
      { step: 2, title: "Request AD Waiver services", description: "Contact Nebraska DHHS, Division of Medicaid and Long-Term Care to request waiver placement." },
      { step: 3, title: "Assessment and service plan", description: "A nurse conducts an assessment and a case manager develops your individualized service plan." },
    ],
    forms: [
      { id: "ne-access", name: "ACCESSNebraska Application", description: "Apply for Nebraska Medicaid through ACCESSNebraska", url: "https://accessnebraska.ne.gov/" },
    ],
  },
  {
    id: "pace-nebraska",
    name: "PACE Nebraska",
    shortName: "PACE NE",
    tagline: "Comprehensive care for nursing-home-eligible Nebraska seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "PACE Nebraska provides integrated medical, social, and long-term care for individuals 55 and older who qualify for nursing home level of care. An interdisciplinary care team coordinates all services through a local PACE center.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Nebraska Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site", description: "Contact Nebraska DHHS or the PACE Association to find a PACE organization near you." },
      { step: 2, title: "Assessment", description: "PACE staff conduct a comprehensive assessment of your health and functional needs." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement and transition your Medicaid and Medicare to the PACE organization." },
    ],
    forms: [
      { id: "ne-pace", name: "Nebraska PACE Information", description: "Contact Nebraska DHHS for PACE enrollment details", url: "https://dhhs.ne.gov/Pages/Medicaid-Long-Term-Care.aspx" },
    ],
  },
];

// ─── Nevada ────────────────────────────────────────────────────────────────────

const nevadaPrograms: WaiverProgram[] = [
  {
    id: "nv-frail-elderly",
    name: "Nevada HCBS Frail Elderly (FE) Waiver",
    shortName: "NV FE Waiver",
    tagline: "Medicaid home-based services for Nevada seniors at risk of nursing home placement",
    savingsRange: "$10,000 – $22,000/year",
    description: "Nevada's FE Waiver provides home and community-based services to frail elderly individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, respite, and care management.",
    eligibilityHighlights: [
      "Age 65 or older",
      "Nevada Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Nevada Medicaid", description: "Apply through AccessNevada or your local DWSS office." },
      { step: 2, title: "Request waiver services", description: "Contact Nevada DHCFP or your local Aging and Disability Services Division to request FE Waiver placement." },
      { step: 3, title: "Assessment", description: "A nurse conducts a functional assessment; a case manager develops your service plan." },
    ],
    forms: [
      { id: "nv-access", name: "AccessNevada Application", description: "Apply for Nevada Medicaid through AccessNevada", url: "https://www.accessnv.nv.gov/" },
    ],
  },
  {
    id: "nv-pd-waiver",
    name: "Nevada HCBS Physical Disability (PD) Waiver",
    shortName: "NV PD Waiver",
    tagline: "Medicaid supports for Nevada adults with physical disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Nevada's PD Waiver provides home and community-based services to adults with physical disabilities who need nursing facility level of care. Services include personal care, supported employment, community integration, and assistive technology.",
    eligibilityHighlights: [
      "Age 18–64 with a physical disability",
      "Nevada Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Nevada Medicaid", description: "Confirm Medicaid eligibility through AccessNevada." },
      { step: 2, title: "Request PD Waiver services", description: "Contact Nevada ADSD to request Physical Disability Waiver placement." },
      { step: 3, title: "Assessment and plan", description: "A nurse assesses your functional needs and a case manager develops your service plan." },
    ],
    forms: [
      { id: "nv-pd", name: "Nevada PD Waiver Information", description: "Contact Nevada ADSD for PD Waiver services", url: "https://adsd.nv.gov/Programs/Disability/PD_Waiver/PD_Waiver_Program/" },
    ],
  },
];

// ─── New Hampshire ─────────────────────────────────────────────────────────────

const newHampshirePrograms: WaiverProgram[] = [
  {
    id: "choices-independence",
    name: "New Hampshire Choices for Independence Waiver",
    shortName: "NH Choices",
    tagline: "Medicaid waiver helping New Hampshire seniors live independently",
    savingsRange: "$10,000 – $22,000/year",
    description: "New Hampshire's Choices for Independence Waiver provides home and community-based services to elderly and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and home health.",
    eligibilityHighlights: [
      "Age 18+ with a disability or age 65+",
      "New Hampshire Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NH Medicaid", description: "Apply for New Hampshire Medicaid through your local District Office or online through EASY." },
      { step: 2, title: "Contact DHHS Aging and Disability Services", description: "Request Choices for Independence Waiver services through NH DHHS." },
      { step: 3, title: "Assessment and case management", description: "A nurse assesses your needs and a case manager develops your individualized service plan." },
    ],
    forms: [
      { id: "nh-medicaid", name: "New Hampshire Medicaid Application", description: "Apply for NH Medicaid through DHHS EASY portal", url: "https://easy.nh.gov/" },
    ],
  },
  {
    id: "nh-in-home-support",
    name: "New Hampshire In-Home Support Waiver",
    shortName: "NH In-Home Support",
    tagline: "Medicaid services for New Hampshire adults with developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "NH's In-Home Support Waiver provides home and community-based services to adults with developmental disabilities who need ICF/IID level of care. Services include supported employment, community participation, and in-home habilitation.",
    eligibilityHighlights: [
      "Have an intellectual disability or related condition",
      "New Hampshire Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your Area Agency", description: "Reach out to your local Area Agency in New Hampshire to request developmental disability services." },
      { step: 2, title: "Eligibility determination", description: "The Area Agency evaluates your disability and functional needs." },
      { step: 3, title: "Individual Service Agreement", description: "Develop an Individual Service Agreement with your support coordinator and providers." },
    ],
    forms: [
      { id: "nh-dd", name: "NH Developmental Disability Services", description: "Contact your local Area Agency for DD services", url: "https://www.dhhs.nh.gov/programs-services/developmental-disabilities" },
    ],
  },
];

// ─── New Jersey ────────────────────────────────────────────────────────────────

const newJerseyPrograms: WaiverProgram[] = [
  {
    id: "mltss",
    name: "New Jersey Managed Long-Term Services and Supports (MLTSS)",
    shortName: "NJ MLTSS",
    tagline: "Integrated Medicaid managed care with long-term services for New Jersey residents",
    savingsRange: "$15,000 – $35,000/year",
    description: "NJ MLTSS integrates long-term services and supports into Medicaid managed care plans for individuals who need nursing facility level of care. Managed care organizations coordinate home care, personal care, adult day, and other HCBS.",
    eligibilityHighlights: [
      "Age 21 or older",
      "New Jersey Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NJ Medicaid", description: "Apply for New Jersey Medicaid through NJ FamilyCare online or at your local county welfare agency." },
      { step: 2, title: "Long-Term Services Assessment", description: "DMAHS will assess your need for nursing facility level of care." },
      { step: 3, title: "Enroll in a managed care plan", description: "Choose from NJ MLTSS managed care organizations to receive coordinated care." },
    ],
    forms: [
      { id: "nj-njfamilycare", name: "NJ FamilyCare Application", description: "Apply for New Jersey Medicaid through NJ FamilyCare", url: "https://www.njfamilycare.org/" },
    ],
  },
  {
    id: "nj-global-options",
    name: "New Jersey Global Options Waiver",
    shortName: "NJ Global Options",
    tagline: "Community-based Medicaid services for New Jersey adults who prefer to stay at home",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Global Options Waiver provides home and community-based services to adults who need nursing facility level of care. Services include personal care, homemaker, adult day, assisted living, and care management.",
    eligibilityHighlights: [
      "Age 18 or older",
      "New Jersey Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Medicaid", description: "Enroll in New Jersey Medicaid through NJ FamilyCare." },
      { step: 2, title: "Request Global Options services", description: "Contact NJ DMAHS or your MCO to request Global Options Waiver placement." },
      { step: 3, title: "Assessment and service plan", description: "A nurse assesses your needs and a care manager develops your individualized plan." },
    ],
    forms: [
      { id: "nj-go", name: "NJ Global Options Waiver Information", description: "Contact NJ DMAHS for Global Options Waiver services", url: "https://www.nj.gov/humanservices/dmahs/clients/medicaid/go/" },
    ],
  },
];

// ─── New Mexico ────────────────────────────────────────────────────────────────

const newMexicoPrograms: WaiverProgram[] = [
  {
    id: "mi-via",
    name: "New Mexico Mi Via Self-Directed Waiver",
    shortName: "Mi Via",
    tagline: "Self-directed Medicaid waiver for New Mexico adults with disabilities",
    savingsRange: "$8,000 – $20,000/year",
    description: "Mi Via is a self-directed Medicaid waiver allowing individuals with developmental disabilities, physical disabilities, or brain injuries to direct their own services and manage their own support workers. Participants control their budgets with a fiscal management agency.",
    eligibilityHighlights: [
      "Have a developmental disability, physical disability, or brain injury",
      "New Mexico Medicaid eligible",
      "Able to self-direct or have a representative",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NM Medicaid", description: "Apply for New Mexico Medicaid through your local NMDOH office or HSD." },
      { step: 2, title: "Contact your support broker", description: "A support broker will help you navigate Mi Via eligibility and enrollment." },
      { step: 3, title: "Develop your budget and plan", description: "With your support broker, develop an individualized budget and plan of care." },
    ],
    forms: [
      { id: "nm-mivia", name: "New Mexico Mi Via Waiver Information", description: "Contact NMDOH to request Mi Via waiver enrollment", url: "https://nmhealth.org/about/ddsd/pgsv/mi-via/" },
    ],
  },
  {
    id: "nm-medically-fragile",
    name: "New Mexico Medically Fragile Waiver",
    shortName: "NM Medically Fragile",
    tagline: "Medicaid supports for medically complex New Mexico adults living at home",
    savingsRange: "$18,000 – $40,000/year",
    description: "New Mexico's Medically Fragile Waiver provides home and community-based services to individuals with complex medical needs who require nursing facility level of care. Services include skilled nursing, personal care, and respite.",
    eligibilityHighlights: [
      "Have complex medical needs requiring nursing facility level of care",
      "New Mexico Medicaid eligible",
      "Prefer to live at home with supports",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NM Medicaid", description: "Confirm New Mexico Medicaid eligibility before requesting the Medically Fragile Waiver." },
      { step: 2, title: "Request waiver services", description: "Contact NMDOH or your Medicaid MCO to request Medically Fragile Waiver placement." },
      { step: 3, title: "Medical and functional assessment", description: "A nurse conducts a medical and functional assessment to confirm eligibility." },
    ],
    forms: [
      { id: "nm-mf", name: "NM Medically Fragile Waiver Information", description: "Contact NMDOH for Medically Fragile Waiver enrollment", url: "https://nmhealth.org/about/ddsd/pgsv/" },
    ],
  },
];

// ─── New York ──────────────────────────────────────────────────────────────────

const newYorkPrograms: WaiverProgram[] = [
  {
    id: "mltc",
    name: "New York Managed Long-Term Care (MLTC)",
    shortName: "NY MLTC",
    tagline: "Medicaid managed care for long-term services and supports in New York",
    savingsRange: "$15,000 – $35,000/year",
    description: "New York's MLTC program integrates long-term services and supports into Medicaid managed care for individuals who need nursing home level of care. Plans coordinate home care, personal care, adult day, and other community services.",
    eligibilityHighlights: [
      "Age 21 or older (or 18+ for certain plans)",
      "New York Medicaid eligible",
      "Need 120 or more days of community long-term care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NY Medicaid", description: "Apply for New York Medicaid through NY State of Health marketplace or your local DSS/HRA office." },
      { step: 2, title: "Eligibility assessment", description: "A UAS-NY assessment is conducted to determine your care needs." },
      { step: 3, title: "Enroll in a MLTC plan", description: "Choose from available MLTC managed care plans in your county." },
    ],
    forms: [
      { id: "ny-medicaid", name: "New York Medicaid Application", description: "Apply for NY Medicaid through NY State of Health", url: "https://nystateofhealth.ny.gov/" },
    ],
  },
  {
    id: "cdpap",
    name: "Consumer Directed Personal Assistance Program (CDPAP)",
    shortName: "CDPAP",
    tagline: "Hire and direct your own personal care assistant through New York Medicaid",
    savingsRange: "$8,000 – $20,000/year",
    description: "CDPAP allows Medicaid-eligible New Yorkers who need personal care to hire, train, and supervise their own personal assistants — including family members. The program maximizes consumer autonomy and is available statewide.",
    eligibilityHighlights: [
      "New York Medicaid eligible",
      "Need personal care or home health aide services",
      "Able to self-direct or have a designated representative",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NY Medicaid", description: "Ensure you are enrolled in NY Medicaid." },
      { step: 2, title: "Request CDPAP from your MLTC or local DSS", description: "Ask your managed long-term care plan or local DSS office for CDPAP." },
      { step: 3, title: "Choose a fiscal intermediary and hire your assistant", description: "Select a CDPAP fiscal intermediary, then recruit and hire your personal assistant." },
    ],
    forms: [
      { id: "ny-cdpap", name: "CDPAP Enrollment", description: "Contact your MLTC plan or NY local DSS to request CDPAP enrollment", url: "https://www.health.ny.gov/health_care/medicaid/program/longterm/cdpap.htm" },
    ],
  },
];

// ─── North Carolina ────────────────────────────────────────────────────────────

const northCarolinaPrograms: WaiverProgram[] = [
  {
    id: "cap-da",
    name: "Community Alternatives Program for Disabled Adults (CAP/DA)",
    shortName: "CAP/DA",
    tagline: "Medicaid waiver providing in-home services for North Carolina adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "NC's CAP/DA waiver provides home and community-based services to adults with physical disabilities who would otherwise require nursing facility care. Services include personal care, home health, home modifications, and case management.",
    eligibilityHighlights: [
      "Age 18 or older with a physical disability",
      "North Carolina Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for NC Medicaid", description: "Apply through NC Medicaid online, by phone, or at your local DSS office." },
      { step: 2, title: "Request CAP/DA services", description: "Contact NC DHHS Division of Health Benefits or a CAP/DA provider to request placement." },
      { step: 3, title: "Assessment and care plan", description: "A nurse assesses your functional needs and a case manager develops your care plan." },
    ],
    forms: [
      { id: "nc-capda", name: "NC CAP/DA Program Information", description: "Contact NC DHHS to request CAP/DA services", url: "https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care/community-alternatives-program-disabled-adults-capda" },
    ],
  },
  {
    id: "nc-innovations",
    name: "NC Innovations Waiver",
    shortName: "NC Innovations",
    tagline: "Medicaid waiver for North Carolinians with intellectual and developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The NC Innovations Waiver provides home and community-based services to individuals with intellectual and developmental disabilities who need ICF/IID level of care. Services include supported living, community networking, and day supports.",
    eligibilityHighlights: [
      "Have an intellectual disability or related developmental disability",
      "North Carolina Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact your LME-MCO", description: "Reach out to your local Management Entity/Managed Care Organization (LME-MCO) to request NC Innovations services." },
      { step: 2, title: "Eligibility determination", description: "Your LME-MCO evaluates your disability and functional support needs." },
      { step: 3, title: "Person-Centered Plan", description: "Work with a care coordinator to develop your Person-Centered Plan and select providers." },
    ],
    forms: [
      { id: "nc-innovations", name: "NC Innovations Waiver Information", description: "Contact your LME-MCO to request Innovations Waiver services", url: "https://medicaid.ncdhhs.gov/providers/programs-and-services/behavioral-health/nc-innovations-waiver" },
    ],
  },
];

// ─── North Dakota ──────────────────────────────────────────────────────────────

const northDakotaPrograms: WaiverProgram[] = [
  {
    id: "nd-aged-disabled",
    name: "North Dakota HCBS Aged and Disabled Waiver",
    shortName: "ND A&D Waiver",
    tagline: "Medicaid home care for North Dakota seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "North Dakota's A&D Waiver provides home and community-based services to aged and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and respite.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "North Dakota Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for ND Medicaid", description: "Apply through the North Dakota Department of Human Services or online at HHS.ND.gov." },
      { step: 2, title: "Request waiver services", description: "Contact ND HHS Aging Services Division to request A&D Waiver placement." },
      { step: 3, title: "Assessment and service plan", description: "A nurse conducts an assessment; a case manager develops your individualized service plan." },
    ],
    forms: [
      { id: "nd-medicaid", name: "North Dakota Medicaid Application", description: "Apply for ND Medicaid through HHS", url: "https://www.hhs.nd.gov/healthcare/medicaid" },
    ],
  },
  {
    id: "nd-tbi",
    name: "North Dakota Traumatic Brain Injury (TBI) Waiver",
    shortName: "ND TBI Waiver",
    tagline: "Medicaid supports for North Dakotans with traumatic brain injuries",
    savingsRange: "$10,000 – $25,000/year",
    description: "ND's TBI Waiver provides home and community-based services to individuals with traumatic brain injuries who need nursing facility level of care. Services include supported living, behavioral support, and community transition.",
    eligibilityHighlights: [
      "Have a traumatic brain injury",
      "North Dakota Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for ND Medicaid", description: "Confirm Medicaid eligibility through ND HHS." },
      { step: 2, title: "Contact ND HHS", description: "Request TBI Waiver services through the ND HHS Division of Vocational Rehabilitation or Aging Services." },
      { step: 3, title: "Assessment and plan", description: "An interdisciplinary team assesses your TBI-related needs and develops a care plan." },
    ],
    forms: [
      { id: "nd-tbi", name: "ND TBI Waiver Information", description: "Contact ND HHS for TBI Waiver enrollment", url: "https://www.hhs.nd.gov/healthcare/medicaid/waiver" },
    ],
  },
];

// ─── Ohio ──────────────────────────────────────────────────────────────────────

const ohioPrograms: WaiverProgram[] = [
  {
    id: "passport",
    name: "Ohio PASSPORT Program",
    shortName: "PASSPORT",
    tagline: "Ohio's flagship Medicaid waiver for home and community-based care",
    savingsRange: "$10,000 – $22,000/year",
    description: "PASSPORT is Ohio's HCBS Medicaid waiver providing home and community-based services to elderly individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, home-delivered meals, and respite.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Ohio Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Ohio Medicaid", description: "Apply for Ohio Medicaid through Benefits.Ohio.gov or your local county job and family services office." },
      { step: 2, title: "Contact your local PASSPORT agency", description: "Request PASSPORT waiver services through a locally certified PASSPORT Administrative Agency." },
      { step: 3, title: "Assessment and service plan", description: "A nurse assesses your care needs and develops an individualized service plan with you." },
    ],
    forms: [
      { id: "oh-passport", name: "Ohio PASSPORT Program Application", description: "Contact your local PASSPORT Administrative Agency", url: "https://medicaid.ohio.gov/for-ohioans/programs/passport" },
    ],
  },
  {
    id: "ohio-assisted-living",
    name: "Ohio Assisted Living Waiver",
    shortName: "OH Assisted Living",
    tagline: "Medicaid support for Ohio seniors in assisted living as an alternative to nursing homes",
    savingsRange: "$12,000 – $28,000/year",
    description: "Ohio's Assisted Living Waiver provides Medicaid funding for services in certified assisted living facilities for individuals who need nursing facility level of care but prefer an assisted living setting.",
    eligibilityHighlights: [
      "Age 21 or older",
      "Ohio Medicaid eligible",
      "Need nursing facility level of care",
      "Choosing to live in a certified assisted living facility",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Ohio Medicaid", description: "Confirm Ohio Medicaid eligibility through Benefits.Ohio.gov." },
      { step: 2, title: "Find a certified assisted living facility", description: "Locate an Ohio Medicaid-certified assisted living facility that accepts the Assisted Living Waiver." },
      { step: 3, title: "Assessment and enrollment", description: "A nurse assesses your care needs; the facility and Medicaid coordinate your enrollment." },
    ],
    forms: [
      { id: "oh-al", name: "Ohio Assisted Living Waiver Information", description: "Contact Ohio Medicaid for Assisted Living Waiver details", url: "https://medicaid.ohio.gov/for-ohioans/programs/assisted-living" },
    ],
  },
];

// ─── Oklahoma ──────────────────────────────────────────────────────────────────

const oklahomaPrograms: WaiverProgram[] = [
  {
    id: "advantage-waiver",
    name: "Oklahoma ADvantage Waiver",
    shortName: "ADvantage",
    tagline: "Oklahoma's primary Medicaid waiver for home-based care for seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "The ADvantage Waiver provides home and community-based services to elderly and physically disabled Oklahomans who need nursing facility level of care. Services include personal care, homemaker, adult day, home modification, and case management.",
    eligibilityHighlights: [
      "Age 21+ with a physical disability, or age 65+",
      "Oklahoma Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Oklahoma Medicaid (SoonerCare)", description: "Apply for SoonerCare through Oklahoma Health Care Authority online or at your local DHS office." },
      { step: 2, title: "Request ADvantage waiver services", description: "Contact Oklahoma DHS Aging Services to request ADvantage Waiver enrollment." },
      { step: 3, title: "Assessment and care plan", description: "A nurse assesses your care needs and develops an individualized care plan." },
    ],
    forms: [
      { id: "ok-soonercare", name: "SoonerCare (Oklahoma Medicaid) Application", description: "Apply for SoonerCare Medicaid through OHCA", url: "https://www.okhca.org/individuals.aspx?id=3375" },
    ],
  },
  {
    id: "ok-community-waiver",
    name: "Oklahoma Community Waiver",
    shortName: "OK Community Waiver",
    tagline: "Medicaid home supports for Oklahoma adults with intellectual disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The Oklahoma Community Waiver provides home and community-based services to individuals with intellectual disabilities and related conditions who need ICF/IID level of care. Services include supported living, day habilitation, and behavioral support.",
    eligibilityHighlights: [
      "Have an intellectual disability or related condition",
      "Oklahoma Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for SoonerCare", description: "Confirm Oklahoma Medicaid eligibility through OHCA." },
      { step: 2, title: "Contact Oklahoma DDS", description: "Reach out to Oklahoma's Developmental Disabilities Services to request Community Waiver enrollment." },
      { step: 3, title: "Assessment and Individual Plan", description: "DDS evaluates your needs and helps develop an Individual Plan of Care." },
    ],
    forms: [
      { id: "ok-dds", name: "Oklahoma DDS Waiver Information", description: "Contact Oklahoma DHS Developmental Disabilities Services", url: "https://oklahoma.gov/okdhs/services/developmental-disabilities.html" },
    ],
  },
];

// ─── Oregon ────────────────────────────────────────────────────────────────────

const oregonPrograms: WaiverProgram[] = [
  {
    id: "k-plan",
    name: "Oregon K Plan (1115 HCBS Waiver)",
    shortName: "OR K Plan",
    tagline: "Oregon's comprehensive Medicaid waiver for home and community-based long-term care",
    savingsRange: "$15,000 – $35,000/year",
    description: "Oregon's K Plan provides home and community-based services through Coordinated Care Organizations (CCOs) to individuals who need nursing facility level of care. Services include personal care, adult foster care, residential care, and case management.",
    eligibilityHighlights: [
      "Oregon Medicaid (OHP) eligible",
      "Need nursing facility level of care",
      "Age 65+ or have a qualifying disability",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Oregon Medicaid (OHP)", description: "Apply for OHP through Oregon's ONE portal online or at your local DHS Self-Sufficiency office." },
      { step: 2, title: "Contact Oregon APD or AAA", description: "Request in-home services through Oregon's Aging and People with Disabilities (APD) program or your local AAA." },
      { step: 3, title: "Assessment and service plan", description: "A DHS APD nurse assesses your functional needs and develops an individualized service plan." },
    ],
    forms: [
      { id: "or-one", name: "Oregon ONE Application", description: "Apply for Oregon Medicaid (OHP) through the ONE portal", url: "https://one.oregon.gov/" },
    ],
  },
  {
    id: "or-apd",
    name: "Oregon Aged and People with Physical Disabilities (APD) Program",
    shortName: "OR APD",
    tagline: "In-home and community care services for Oregon seniors and adults with physical disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Oregon's APD program provides a range of home and community-based services to seniors and adults with physical disabilities. Services include in-home care, adult foster care, residential care, and assisted living through Oregon Medicaid.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "Oregon Medicaid eligible",
      "Need assistance with daily living activities",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for OHP and APD", description: "Apply for Oregon Medicaid and request APD services through your local DHS office or online." },
      { step: 2, title: "Functional assessment", description: "An APD nurse conducts a home visit to assess your care needs." },
      { step: 3, title: "Service plan and provider selection", description: "Work with your case manager to select services and providers that meet your needs." },
    ],
    forms: [
      { id: "or-apd-app", name: "Oregon APD Services Application", description: "Contact your local DHS APD office to apply for services", url: "https://www.oregon.gov/dhs/SENIORS-DISABILITIES/APD/Pages/index.aspx" },
    ],
  },
];

// ─── Pennsylvania ──────────────────────────────────────────────────────────────

const pennsylvaniaPrograms: WaiverProgram[] = [
  {
    id: "pa-life",
    name: "Pennsylvania LIFE (Living Independence for the Elderly) Program",
    shortName: "PA LIFE",
    tagline: "PACE-model comprehensive care for Pennsylvania seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "PA LIFE is Pennsylvania's version of PACE, providing comprehensive medical, social, and long-term care services to individuals 55 and older who qualify for nursing home level of care. Care is coordinated through local LIFE centers.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Pennsylvania Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a LIFE organization near you", description: "Pennsylvania has LIFE organizations in many counties. Contact the PA Department of Aging to find one." },
      { step: 2, title: "Assessment", description: "The LIFE interdisciplinary team conducts a comprehensive needs assessment." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement; your Medicaid and Medicare transfer to the LIFE program." },
    ],
    forms: [
      { id: "pa-life-info", name: "Pennsylvania LIFE Program Information", description: "Contact PA Department of Aging to find a LIFE organization", url: "https://www.aging.pa.gov/aging-services/Pages/LIFE-Program.aspx" },
    ],
  },
  {
    id: "pa-aging-waiver",
    name: "Pennsylvania Aging Waiver",
    shortName: "PA Aging Waiver",
    tagline: "Medicaid waiver providing home and community-based services for Pennsylvania seniors",
    savingsRange: "$10,000 – $22,000/year",
    description: "The Pennsylvania Aging Waiver provides home and community-based services to individuals 60 and older who need nursing facility level of care. Services include personal care, homemaker, adult day, and care management coordinated through Area Agencies on Aging.",
    eligibilityHighlights: [
      "Age 60 or older",
      "Pennsylvania Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Pennsylvania Medicaid", description: "Apply for PA Medicaid through COMPASS (www.compass.state.pa.us) or your county Assistance Office." },
      { step: 2, title: "Contact your local Area Agency on Aging", description: "Request Aging Waiver services through your county's AAA." },
      { step: 3, title: "Assessment and service plan", description: "An AAA assessor evaluates your care needs and develops a service plan." },
    ],
    forms: [
      { id: "pa-compass", name: "Pennsylvania COMPASS Application", description: "Apply for Pennsylvania Medicaid through COMPASS", url: "https://www.compass.state.pa.us/" },
    ],
  },
];

// ─── Rhode Island ──────────────────────────────────────────────────────────────

const rhodeIslandPrograms: WaiverProgram[] = [
  {
    id: "global-compact",
    name: "Rhode Island Global Consumer Choice Compact Waiver",
    shortName: "RI Global Waiver",
    tagline: "Rhode Island's comprehensive Medicaid waiver integrating home and community-based care",
    savingsRange: "$15,000 – $35,000/year",
    description: "The RI Global Compact Waiver provides home and community-based services to Medicaid-eligible individuals who need nursing facility level of care. It integrates HCBS and institutional care under a single waiver with consumer choice.",
    eligibilityHighlights: [
      "Rhode Island Medicaid eligible",
      "Need nursing facility level of care",
      "Choose home or community-based services",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for RI Medicaid", description: "Apply for Rhode Island Medicaid through HealthSource RI or EOHHS." },
      { step: 2, title: "Request HCBS services", description: "Contact RI EOHHS or your Medicaid MCO to request home and community-based services." },
      { step: 3, title: "Assessment and care plan", description: "A nurse assesses your needs and develops an individualized care plan." },
    ],
    forms: [
      { id: "ri-medicaid", name: "Rhode Island Medicaid Application", description: "Apply for RI Medicaid through HealthSource RI or EOHHS", url: "https://eohhs.ri.gov/programs-and-services/adults-and-seniors/home-community-based-services-hcbs" },
    ],
  },
  {
    id: "ri-personal-choice",
    name: "Rhode Island Personal Choice Program",
    shortName: "RI Personal Choice",
    tagline: "Self-directed Medicaid personal care for Rhode Island adults",
    savingsRange: "$8,000 – $20,000/year",
    description: "Rhode Island's Personal Choice Program allows Medicaid-eligible individuals who need personal care to self-direct their services, hiring and managing their own caregivers — including family members — with fiscal intermediary support.",
    eligibilityHighlights: [
      "Rhode Island Medicaid eligible",
      "Need personal care services",
      "Able to self-direct or have a representative",
    ],
    applicationSteps: [
      { step: 1, title: "Enroll in RI Medicaid", description: "Ensure you have active Rhode Island Medicaid coverage." },
      { step: 2, title: "Request Personal Choice enrollment", description: "Contact RI EOHHS or your MCO to request enrollment in the Personal Choice Program." },
      { step: 3, title: "Hire your caregiver", description: "With support from a fiscal intermediary, recruit and hire your personal care provider." },
    ],
    forms: [
      { id: "ri-pc", name: "RI Personal Choice Program Information", description: "Contact RI EOHHS to request Personal Choice enrollment", url: "https://eohhs.ri.gov/programs-and-services/adults-and-seniors/home-community-based-services-hcbs" },
    ],
  },
];

// ─── South Carolina ────────────────────────────────────────────────────────────

const southCarolinaPrograms: WaiverProgram[] = [
  {
    id: "cltc",
    name: "South Carolina Community Long-Term Care (CLTC)",
    shortName: "SC CLTC",
    tagline: "Medicaid home and community-based services for South Carolina seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "SC CLTC provides home and community-based services to Medicaid-eligible individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and case management coordinated through CLTC offices.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "South Carolina Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for SC Medicaid", description: "Apply for South Carolina Medicaid through the Department of Health and Human Services (SCDHHS) online or at your local county office." },
      { step: 2, title: "Contact CLTC", description: "Contact your local CLTC office to request an assessment for home and community-based services." },
      { step: 3, title: "Assessment and care plan", description: "A nurse assesses your functional needs and develops an individualized care plan." },
    ],
    forms: [
      { id: "sc-medicaid", name: "South Carolina Medicaid Application", description: "Apply for SC Medicaid through SCDHHS", url: "https://www.scdhhs.gov/apply" },
    ],
  },
  {
    id: "sc-community-choices",
    name: "South Carolina Community Choices Waiver",
    shortName: "SC Community Choices",
    tagline: "Medicaid waiver expanding home-based care options for South Carolinians",
    savingsRange: "$10,000 – $22,000/year",
    description: "The SC Community Choices Waiver provides home and community-based services to elderly and disabled individuals who prefer community living to nursing home placement. Services include personal care, residential support, and care coordination.",
    eligibilityHighlights: [
      "Age 18 or older with a qualifying disability or age 65+",
      "South Carolina Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for SC Medicaid", description: "Enroll in South Carolina Medicaid through SCDHHS if not already enrolled." },
      { step: 2, title: "Contact SCDHHS LTSS", description: "Request Community Choices Waiver services through SCDHHS Long-Term Services and Supports." },
      { step: 3, title: "Functional assessment", description: "An SCDHHS nurse assesses your care needs and confirms eligibility." },
    ],
    forms: [
      { id: "sc-cc", name: "SC Community Choices Waiver Information", description: "Contact SCDHHS for Community Choices Waiver services", url: "https://www.scdhhs.gov/community-long-term-care" },
    ],
  },
];

// ─── South Dakota ──────────────────────────────────────────────────────────────

const southDakotaPrograms: WaiverProgram[] = [
  {
    id: "sd-elderly-disabled",
    name: "South Dakota HCBS Waiver for the Elderly and Disabled",
    shortName: "SD E&D Waiver",
    tagline: "Medicaid home-based services for South Dakota seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "South Dakota's E&D Waiver provides home and community-based services to elderly and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and respite.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "South Dakota Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for South Dakota Medicaid", description: "Apply through the South Dakota Department of Social Services (DSS) online or at your local office." },
      { step: 2, title: "Request waiver services", description: "Contact SD DSS or your local Social Services office to request E&D Waiver placement." },
      { step: 3, title: "Assessment and plan", description: "A nurse assesses your care needs and a case manager develops your service plan." },
    ],
    forms: [
      { id: "sd-medicaid", name: "South Dakota Medicaid Application", description: "Apply for SD Medicaid through DSS", url: "https://dss.sd.gov/medicaid/generalinfo/applyformedicaid.aspx" },
    ],
  },
  {
    id: "sd-dd-waiver",
    name: "South Dakota Developmental Disabilities Waiver",
    shortName: "SD DD Waiver",
    tagline: "Medicaid supports for South Dakotans with developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "SD's DD Waiver provides home and community-based services to individuals with developmental disabilities who need ICF/IID level of care. Services include supported employment, day habilitation, and community integration.",
    eligibilityHighlights: [
      "Have an intellectual disability, autism, or related developmental disability",
      "South Dakota Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact SD DSS Developmental Disabilities", description: "Reach out to the SD DSS Division of Developmental Disabilities to begin the waiver process." },
      { step: 2, title: "Eligibility evaluation", description: "DSS evaluates your disability and functional needs." },
      { step: 3, title: "Individual Service Plan", description: "Work with your case manager to develop an Individual Service Plan." },
    ],
    forms: [
      { id: "sd-dd", name: "SD Developmental Disabilities Waiver Information", description: "Contact SD DSS Division of Developmental Disabilities", url: "https://dss.sd.gov/developmentaldisabilities/" },
    ],
  },
];

// ─── Tennessee ─────────────────────────────────────────────────────────────────

const tennesseePrograms: WaiverProgram[] = [
  {
    id: "choices",
    name: "TennCare CHOICES in Long-Term Services and Supports",
    shortName: "CHOICES",
    tagline: "Tennessee's Medicaid managed care program for home and community-based long-term care",
    savingsRange: "$15,000 – $35,000/year",
    description: "CHOICES provides home and community-based services to elderly and adults with physical disabilities through TennCare managed care organizations. It supports nursing home residents transitioning to the community and those at risk of nursing home placement.",
    eligibilityHighlights: [
      "Age 65+ or adults 21–64 with a physical disability",
      "Tennessee TennCare (Medicaid) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for TennCare", description: "Apply for Tennessee Medicaid (TennCare) through Access Tennessee or your local DHS office." },
      { step: 2, title: "Request CHOICES enrollment", description: "Contact the Tennessee Department of Intellectual and Developmental Disabilities or your TennCare MCO." },
      { step: 3, title: "Assessment and care plan", description: "A nurse assesses your care needs and a care coordinator develops your service plan." },
    ],
    forms: [
      { id: "tn-tenn-connect", name: "TennCare Application", description: "Apply for Tennessee Medicaid (TennCare)", url: "https://www.tn.gov/tenncare/members-applicants/apply-for-tenncare.html" },
    ],
  },
  {
    id: "ecf-choices",
    name: "Tennessee ECF CHOICES",
    shortName: "ECF CHOICES",
    tagline: "TennCare managed HCBS for Tennesseans with intellectual and developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "ECF CHOICES provides home and community-based employment and community first services to individuals with intellectual and developmental disabilities through TennCare managed care. It supports community integration and competitive employment.",
    eligibilityHighlights: [
      "Have an intellectual disability or developmental disability",
      "Tennessee TennCare eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for TennCare", description: "Enroll in Tennessee Medicaid (TennCare) if not already enrolled." },
      { step: 2, title: "Contact DIDD", description: "Reach out to the Tennessee Department of Intellectual and Developmental Disabilities to request ECF CHOICES services." },
      { step: 3, title: "Person-Centered Support Plan", description: "Develop a Person-Centered Support Plan with your support coordinator." },
    ],
    forms: [
      { id: "tn-didd", name: "Tennessee DIDD ECF CHOICES Information", description: "Contact DIDD to request ECF CHOICES services", url: "https://www.tn.gov/didd/services/ecf-choices.html" },
    ],
  },
];

// ─── Utah ──────────────────────────────────────────────────────────────────────

const utahPrograms: WaiverProgram[] = [
  {
    id: "new-choices",
    name: "Utah New Choices Waiver",
    shortName: "New Choices",
    tagline: "Medicaid waiver helping Utah nursing home residents transition to the community",
    savingsRange: "$10,000 – $22,000/year",
    description: "Utah's New Choices Waiver helps individuals who are in a nursing facility transition back to community living. Services include assisted living, residential support, personal care, and care management.",
    eligibilityHighlights: [
      "Currently in a nursing facility or risk of placement",
      "Utah Medicaid eligible",
      "Wish to transition to or remain in the community",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Utah Medicaid", description: "Apply for Utah Medicaid through the Utah Department of Health and Human Services." },
      { step: 2, title: "Contact a Medicaid waiver agency", description: "Request New Choices Waiver services through UDHHS or a certified Medicaid waiver agency." },
      { step: 3, title: "Assessment and transition plan", description: "A case manager assesses your needs and develops a transition plan for community living." },
    ],
    forms: [
      { id: "ut-medicaid", name: "Utah Medicaid Application", description: "Apply for Utah Medicaid through UDHHS", url: "https://medicaid.utah.gov/applying-for-medicaid/" },
    ],
  },
  {
    id: "ut-pd-waiver",
    name: "Utah HCBS Waiver for Individuals with Physical Disabilities",
    shortName: "UT PD Waiver",
    tagline: "Medicaid home supports for Utahns with physical disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Utah's PD Waiver provides home and community-based services to adults with physical disabilities who need nursing facility level of care. Services include personal care, supported employment, home modifications, and case management.",
    eligibilityHighlights: [
      "Age 18–64 with a physical disability",
      "Utah Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Utah Medicaid", description: "Confirm Utah Medicaid eligibility through UDHHS." },
      { step: 2, title: "Request PD Waiver services", description: "Contact UDHHS Division of Medicaid and Health Financing to request waiver placement." },
      { step: 3, title: "Assessment", description: "A nurse conducts a functional assessment to determine your care needs and eligibility." },
    ],
    forms: [
      { id: "ut-pd", name: "Utah PD Waiver Information", description: "Contact UDHHS for Physical Disability Waiver services", url: "https://medicaid.utah.gov/programs/hcbs-waivers/" },
    ],
  },
];

// ─── Vermont ───────────────────────────────────────────────────────────────────

const vermontPrograms: WaiverProgram[] = [
  {
    id: "choices-for-care",
    name: "Vermont Choices for Care Waiver",
    shortName: "Choices for Care",
    tagline: "Vermont's primary Medicaid waiver for long-term care in home and community settings",
    savingsRange: "$15,000 – $35,000/year",
    description: "Vermont's Choices for Care Waiver provides home and community-based services to individuals who are eligible for nursing home level of care. The program prioritizes consumer choice and includes personal care, home health, and adult day services.",
    eligibilityHighlights: [
      "Age 18 or older",
      "Vermont Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Vermont Medicaid (Green Mountain Care)", description: "Apply for Vermont Medicaid through Vermont Health Connect or your local DCF office." },
      { step: 2, title: "Contact Vermont DAIL", description: "Request Choices for Care services through the Vermont Department of Disabilities, Aging and Independent Living (DAIL)." },
      { step: 3, title: "Assessment and service plan", description: "A nurse assesses your care needs and develops an individualized service plan." },
    ],
    forms: [
      { id: "vt-dail", name: "Vermont Choices for Care Application", description: "Contact DAIL to apply for Choices for Care services", url: "https://dail.vermont.gov/services-supports/choices-for-care" },
    ],
  },
  {
    id: "vt-enhanced-residential",
    name: "Vermont Enhanced Residential Care Waiver",
    shortName: "VT Enhanced Residential",
    tagline: "Medicaid support for Vermont seniors in enhanced residential and assisted living settings",
    savingsRange: "$12,000 – $28,000/year",
    description: "Vermont's Enhanced Residential Care Waiver provides Medicaid-funded services to individuals who need nursing home level of care but prefer to live in a residential care home or enhanced residential care facility.",
    eligibilityHighlights: [
      "Vermont Medicaid eligible",
      "Need nursing home level of care",
      "Reside or wish to reside in an enhanced residential care facility",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Vermont Medicaid", description: "Confirm Vermont Medicaid eligibility before applying for residential care." },
      { step: 2, title: "Find an enhanced residential facility", description: "Locate a Vermont-licensed enhanced residential care or assisted living facility that accepts Medicaid." },
      { step: 3, title: "Contact DAIL", description: "Work with DAIL and the facility to arrange Medicaid waiver enrollment." },
    ],
    forms: [
      { id: "vt-erc", name: "Vermont Enhanced Residential Care Information", description: "Contact Vermont DAIL for Enhanced Residential Care enrollment", url: "https://dail.vermont.gov/services-supports/home-community-based-services" },
    ],
  },
];

// ─── Virginia ──────────────────────────────────────────────────────────────────

const virginiaPrograms: WaiverProgram[] = [
  {
    id: "ccc-plus",
    name: "Virginia Commonwealth Coordinated Care Plus (CCC+)",
    shortName: "CCC+",
    tagline: "Virginia's integrated Medicaid managed care program for long-term services and supports",
    savingsRange: "$15,000 – $35,000/year",
    description: "CCC+ is Virginia's Medicaid managed care program integrating acute care and long-term services and supports for individuals who need nursing home level of care. Managed care plans coordinate home care, personal care, and community services.",
    eligibilityHighlights: [
      "Age 21 or older (or children in certain categories)",
      "Virginia Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Virginia Medicaid", description: "Apply for Medicaid through CommonHelp (commonhelp.virginia.gov) or your local DSS office." },
      { step: 2, title: "Level of care determination", description: "DMAS will assess whether you need nursing facility level of care." },
      { step: 3, title: "Choose a CCC+ managed care plan", description: "Select from available CCC+ health plans in your region to begin receiving coordinated LTSS." },
    ],
    forms: [
      { id: "va-commonhelp", name: "Virginia CommonHelp Application", description: "Apply for Virginia Medicaid through CommonHelp", url: "https://www.commonhelp.virginia.gov/" },
    ],
  },
  {
    id: "edcd-waiver",
    name: "Virginia Elderly or Disabled with Consumer Direction (EDCD) Waiver",
    shortName: "EDCD Waiver",
    tagline: "Self-directed Medicaid personal care for Virginia seniors and adults with disabilities",
    savingsRange: "$8,000 – $20,000/year",
    description: "The EDCD Waiver provides personal care and respite services to elderly and disabled individuals who need nursing facility level of care. Participants can self-direct their services and hire their own caregivers, including family members.",
    eligibilityHighlights: [
      "Age 18 or older",
      "Virginia Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Virginia Medicaid", description: "Enroll in Virginia Medicaid through CommonHelp." },
      { step: 2, title: "Request EDCD Waiver services", description: "Contact Virginia DMAS or a licensed care coordination organization (CCO) to request EDCD Waiver services." },
      { step: 3, title: "Assessment and self-direction setup", description: "A nurse assesses your needs; a fiscal agent helps you hire and manage your caregiver." },
    ],
    forms: [
      { id: "va-edcd", name: "Virginia EDCD Waiver Information", description: "Contact Virginia DMAS for EDCD Waiver enrollment", url: "https://www.dmas.virginia.gov/for-members/long-term-care/home-community-based-services/" },
    ],
  },
];

// ─── Washington ────────────────────────────────────────────────────────────────

const washingtonPrograms: WaiverProgram[] = [
  {
    id: "copes",
    name: "Washington COPES (Community Options Program Entry System)",
    shortName: "COPES",
    tagline: "Washington's long-standing Medicaid waiver for home and community-based care",
    savingsRange: "$10,000 – $22,000/year",
    description: "COPES provides home and community-based services to adults who need nursing facility level of care. Services include personal care, adult family home, assisted living, and case management coordinated through DSHS.",
    eligibilityHighlights: [
      "Age 18 or older",
      "Washington Medicaid (Apple Health) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Washington Apple Health (Medicaid)", description: "Apply for Apple Health through Washington Healthplanfinder or your local DSHS office." },
      { step: 2, title: "Contact DSHS Aging and Long-Term Support", description: "Request COPES services through your local DSHS ALTSA office." },
      { step: 3, title: "Assessment and care plan", description: "A DSHS nurse assesses your functional needs and develops a care plan." },
    ],
    forms: [
      { id: "wa-applehealth", name: "Washington Apple Health Application", description: "Apply for Washington Medicaid (Apple Health) through Healthplanfinder", url: "https://www.wahealthplanfinder.org/" },
    ],
  },
  {
    id: "wa-cfc",
    name: "Washington Community First Choice (CFC)",
    shortName: "WA CFC",
    tagline: "Personal care and support services for Washington Medicaid members",
    savingsRange: "$8,000 – $20,000/year",
    description: "Community First Choice provides personal care, support services, and skills training to Medicaid-eligible individuals who need assistance with daily living activities. CFC supports independence at home as an alternative to institutional care.",
    eligibilityHighlights: [
      "Washington Apple Health (Medicaid) eligible",
      "Need assistance with activities of daily living",
      "Prefer to receive care at home or in the community",
    ],
    applicationSteps: [
      { step: 1, title: "Enroll in Apple Health", description: "Confirm Washington Medicaid eligibility before requesting CFC services." },
      { step: 2, title: "Contact DSHS ALTSA", description: "Request Community First Choice services through your local DSHS Aging and Long-Term Support office." },
      { step: 3, title: "Assessment", description: "A DSHS nurse assesses your functional needs and documents the supports required." },
    ],
    forms: [
      { id: "wa-cfc", name: "Washington CFC Information", description: "Contact DSHS ALTSA for Community First Choice services", url: "https://www.dshs.wa.gov/altsa/home-and-community-services/community-first-choice" },
    ],
  },
];

// ─── West Virginia ─────────────────────────────────────────────────────────────

const westVirginiaPrograms: WaiverProgram[] = [
  {
    id: "wv-aged-disabled",
    name: "West Virginia Aged and Disabled Waiver",
    shortName: "WV A&D Waiver",
    tagline: "Medicaid home-based services for West Virginia seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "West Virginia's A&D Waiver provides home and community-based services to elderly and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and respite care.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "West Virginia Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for WV Medicaid", description: "Apply for West Virginia Medicaid through DHHR or online at dhhr.wv.gov." },
      { step: 2, title: "Request waiver services", description: "Contact WV DHHR Bureau for Medical Services to request A&D Waiver enrollment." },
      { step: 3, title: "Assessment and service plan", description: "A nurse conducts a functional assessment and a case manager develops your individualized plan." },
    ],
    forms: [
      { id: "wv-medicaid", name: "West Virginia Medicaid Application", description: "Apply for WV Medicaid through DHHR", url: "https://dhhr.wv.gov/bms/Pages/HCBS.aspx" },
    ],
  },
  {
    id: "wv-iimm",
    name: "West Virginia Intellectual/Developmental Disabilities Waiver (IIMM)",
    shortName: "WV IIMM",
    tagline: "Medicaid community supports for West Virginians with intellectual disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "The WV IIMM Waiver provides home and community-based services to individuals with intellectual and developmental disabilities who need ICF/IID level of care. Services include supported employment, day habilitation, and residential support.",
    eligibilityHighlights: [
      "Have an intellectual or developmental disability",
      "West Virginia Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for WV Medicaid", description: "Confirm West Virginia Medicaid eligibility through DHHR." },
      { step: 2, title: "Contact your local ID/DD program", description: "Reach out to WV DHHR's Office of Behavioral Health and Health Facilities for DD services." },
      { step: 3, title: "Eligibility and Individual Service Plan", description: "Staff evaluate your disability and help develop an Individual Service Plan." },
    ],
    forms: [
      { id: "wv-iimm", name: "WV IIMM Waiver Information", description: "Contact WV DHHR for intellectual disability waiver services", url: "https://dhhr.wv.gov/bcf/Services/Pages/IntellectualDevelopmentalDisabilities.aspx" },
    ],
  },
];

// ─── Wisconsin ─────────────────────────────────────────────────────────────────

const wisconsinPrograms: WaiverProgram[] = [
  {
    id: "family-care",
    name: "Wisconsin Family Care",
    shortName: "Family Care",
    tagline: "Wisconsin's Medicaid managed long-term care program for frail elders and adults with disabilities",
    savingsRange: "$15,000 – $35,000/year",
    description: "Wisconsin Family Care provides home and community-based services through managed care organizations to frail elderly and adults with physical or intellectual disabilities who need nursing home level of care. Services include personal care, adult day, residential care, and care management.",
    eligibilityHighlights: [
      "Age 18 or older with a qualifying disability, or age 65+",
      "Wisconsin Medicaid (ForwardHealth) eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Wisconsin Medicaid", description: "Apply for Wisconsin ForwardHealth Medicaid through access.wi.gov or your local county human services office." },
      { step: 2, title: "Contact your county aging office or disability services", description: "Request Family Care enrollment through your county's aging and disability resource center (ADRC)." },
      { step: 3, title: "Enroll in a Family Care MCO", description: "Select a Family Care managed care organization in your county to coordinate your long-term care services." },
    ],
    forms: [
      { id: "wi-access", name: "Wisconsin ACCESS Application", description: "Apply for Wisconsin Medicaid through ACCESS", url: "https://access.wi.gov/" },
    ],
  },
  {
    id: "pace-wisconsin",
    name: "Wisconsin PACE Program",
    shortName: "PACE WI",
    tagline: "Comprehensive integrated care for nursing-home-eligible Wisconsin seniors",
    savingsRange: "$15,000 – $35,000/year",
    description: "Wisconsin's PACE program provides comprehensive medical, social, and long-term care services to individuals 55 and older who qualify for nursing home level of care. PACE organizations coordinate all care through a local PACE center.",
    eligibilityHighlights: [
      "Age 55 or older",
      "Wisconsin Medicaid and/or Medicare eligible",
      "Need nursing home level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Find a PACE site in Wisconsin", description: "Contact DHS or the PACE Association to find a Wisconsin PACE organization near you." },
      { step: 2, title: "Assessment", description: "The PACE team assesses your medical, functional, and social needs." },
      { step: 3, title: "Enroll", description: "Sign the enrollment agreement; your Medicaid and Medicare transfer to the PACE organization." },
    ],
    forms: [
      { id: "wi-pace", name: "Wisconsin PACE Information", description: "Contact Wisconsin DHS for PACE enrollment details", url: "https://www.dhs.wisconsin.gov/ltcare/pace.htm" },
    ],
  },
];

// ─── Wyoming ───────────────────────────────────────────────────────────────────

const wyomingPrograms: WaiverProgram[] = [
  {
    id: "wy-hcbs",
    name: "Wyoming HCBS Waiver (Elderly and Disabled)",
    shortName: "WY HCBS Waiver",
    tagline: "Medicaid home and community-based services for Wyoming seniors and adults with disabilities",
    savingsRange: "$10,000 – $22,000/year",
    description: "Wyoming's HCBS Waiver provides home and community-based services to elderly and disabled individuals who need nursing facility level of care. Services include personal care, homemaker, adult day, and respite care.",
    eligibilityHighlights: [
      "Age 65+ or adults with a physical disability",
      "Wyoming Medicaid eligible",
      "Need nursing facility level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Apply for Wyoming Medicaid", description: "Apply for Wyoming Medicaid through the Department of Family Services (DFS) or online." },
      { step: 2, title: "Request HCBS services", description: "Contact Wyoming DFS or the Department of Health to request HCBS waiver placement." },
      { step: 3, title: "Assessment and service plan", description: "A nurse assesses your functional needs and a case manager develops your plan of care." },
    ],
    forms: [
      { id: "wy-medicaid", name: "Wyoming Medicaid Application", description: "Apply for Wyoming Medicaid through DFS", url: "https://health.wyo.gov/healthcarefin/medicaid/programs-and-eligibility/" },
    ],
  },
  {
    id: "wy-idd",
    name: "Wyoming Intellectual and Developmental Disabilities Waiver",
    shortName: "WY IDD Waiver",
    tagline: "Medicaid community supports for Wyomingites with intellectual and developmental disabilities",
    savingsRange: "$12,000 – $30,000/year",
    description: "Wyoming's IDD Waiver provides home and community-based services to individuals with intellectual and developmental disabilities who need ICF/IID level of care. Services include supported living, day habilitation, and community integration.",
    eligibilityHighlights: [
      "Have an intellectual disability or developmental disability",
      "Wyoming Medicaid eligible",
      "Need ICF/IID level of care",
    ],
    applicationSteps: [
      { step: 1, title: "Contact Wyoming Behavioral Health Division", description: "Reach out to Wyoming Department of Health's Behavioral Health Division for DD waiver services." },
      { step: 2, title: "Eligibility determination", description: "Staff evaluate your disability and functional needs." },
      { step: 3, title: "Individual Service Plan", description: "Develop an Individual Service Plan with your case manager and selected providers." },
    ],
    forms: [
      { id: "wy-idd", name: "Wyoming IDD Waiver Information", description: "Contact Wyoming DOH Behavioral Health Division for IDD services", url: "https://health.wyo.gov/behavioralhealth/dd/" },
    ],
  },
];

// ─── All 50 States ─────────────────────────────────────────────────────────────

export const allStates: StateData[] = [
  {
    id: "alabama",
    name: "Alabama",
    abbreviation: "AL",
    description: "Alabama's Medicaid programs provide home and community-based services to help seniors and adults with disabilities remain at home rather than entering a nursing facility.",
    programs: alabamaPrograms,
  },
  {
    id: "alaska",
    name: "Alaska",
    abbreviation: "AK",
    description: "Alaska offers Medicaid waiver programs through the Division of Senior and Disabilities Services to help residents remain at home with the supports they need.",
    programs: alaskaPrograms,
  },
  {
    id: "arizona",
    name: "Arizona",
    abbreviation: "AZ",
    description: "Arizona's Long-Term Care System (ALTCS) provides comprehensive Medicaid managed care for seniors and adults with disabilities who need nursing facility level of care.",
    programs: arizonaPrograms,
  },
  {
    id: "arkansas",
    name: "Arkansas",
    abbreviation: "AR",
    description: "Arkansas offers Medicaid waiver programs through DHS to help elderly and disabled residents access home and community-based services as an alternative to nursing home care.",
    programs: arkansasPrograms,
  },
  {
    id: "california",
    name: "California",
    abbreviation: "CA",
    description: "California offers several Medi-Cal waiver programs to help seniors and people with disabilities receive care at home and in the community. These programs provide an alternative to nursing home placement and support independent living.",
    programs: californiaPrograms,
  },
  {
    id: "colorado",
    name: "Colorado",
    abbreviation: "CO",
    description: "Colorado's Medicaid HCBS waivers help seniors and adults with disabilities access home and community-based care, coordinated through local Single Entry Point agencies.",
    programs: coloradoPrograms,
  },
  {
    id: "connecticut",
    name: "Connecticut",
    abbreviation: "CT",
    description: "Connecticut's home care programs, including the Home Care Program for Elders, help older adults remain safely in their homes with Medicaid or state-funded support.",
    programs: connecticutPrograms,
  },
  {
    id: "delaware",
    name: "Delaware",
    abbreviation: "DE",
    description: "Delaware offers integrated Medicaid managed care through Diamond State Health Plan Plus, providing long-term services and supports for seniors and adults with disabilities.",
    programs: delawarePrograms,
  },
  {
    id: "florida",
    name: "Florida",
    abbreviation: "FL",
    description: "Florida's Medicaid waiver programs help seniors and adults with disabilities live in the community by providing home and community-based services as an alternative to nursing home placement.",
    programs: floridaPrograms,
  },
  {
    id: "georgia",
    name: "Georgia",
    abbreviation: "GA",
    description: "Georgia's Medicaid waiver programs, including CCSP and SOURCE, help elderly and disabled residents receive home and community-based care rather than nursing home placement.",
    programs: georgiaPrograms,
  },
  {
    id: "hawaii",
    name: "Hawaii",
    abbreviation: "HI",
    description: "Hawaii offers Medicaid home and community-based services through the QUEST Expanded program and state-funded Kupuna Care for seniors needing daily assistance.",
    programs: hawaiiPrograms,
  },
  {
    id: "idaho",
    name: "Idaho",
    abbreviation: "ID",
    description: "Idaho's Medicaid HCBS waivers provide home and community-based services to elderly and disabled residents through the Department of Health and Welfare.",
    programs: idahoPrograms,
  },
  {
    id: "illinois",
    name: "Illinois",
    abbreviation: "IL",
    description: "Illinois offers home and community-based services for seniors through the Community Care Program and Medicaid HCBS waivers, administered by the Department on Aging.",
    programs: illinoisPrograms,
  },
  {
    id: "indiana",
    name: "Indiana",
    abbreviation: "IN",
    description: "Indiana's Pathways for Aging and HCBS waivers provide home and community-based care for seniors and adults with disabilities as alternatives to nursing home placement.",
    programs: indianaPrograms,
  },
  {
    id: "iowa",
    name: "Iowa",
    abbreviation: "IA",
    description: "Iowa offers Medicaid HCBS waivers for elderly adults and individuals with brain injuries, coordinated through Iowa Medicaid managed care organizations.",
    programs: iowaPrograms,
  },
  {
    id: "kansas",
    name: "Kansas",
    abbreviation: "KS",
    description: "Kansas's KanCare Medicaid program includes HCBS waivers for frail elderly individuals and adults with physical disabilities to receive home and community-based care.",
    programs: kansasPrograms,
  },
  {
    id: "kentucky",
    name: "Kentucky",
    abbreviation: "KY",
    description: "Kentucky offers HCBS waivers and supports for community living to help seniors and adults with disabilities remain in their homes rather than nursing facilities.",
    programs: kentuckyPrograms,
  },
  {
    id: "louisiana",
    name: "Louisiana",
    abbreviation: "LA",
    description: "Louisiana's Medicaid waiver programs through the Office of Aging and Adult Services and OCDD provide home and community-based supports for elderly and disabled residents.",
    programs: louisianaPrograms,
  },
  {
    id: "maine",
    name: "Maine",
    abbreviation: "ME",
    description: "Maine offers MaineCare HCBS waivers and PACE to help seniors and adults with disabilities access home and community-based services as an alternative to nursing care.",
    programs: mainePrograms,
  },
  {
    id: "maryland",
    name: "Maryland",
    abbreviation: "MD",
    description: "Maryland's Medicaid waiver programs provide home and community-based services for adults with physical disabilities and seniors, coordinated through the Department of Health.",
    programs: marylandPrograms,
  },
  {
    id: "massachusetts",
    name: "Massachusetts",
    abbreviation: "MA",
    description: "Massachusetts offers a range of Medicaid HCBS programs including Adult Foster Care, Group Adult Foster Care, and PACE for seniors and adults with disabilities.",
    programs: massachusettsPrograms,
  },
  {
    id: "michigan",
    name: "Michigan",
    abbreviation: "MI",
    description: "Michigan's MI Choice Waiver and PACE program help seniors and adults with disabilities receive home and community-based services coordinated through waiver agents.",
    programs: michiganPrograms,
  },
  {
    id: "minnesota",
    name: "Minnesota",
    abbreviation: "MN",
    description: "Minnesota's Elderly Waiver and Brain Injury Waiver provide home and community-based services for seniors and adults with disabilities through county-coordinated care.",
    programs: minnesotaPrograms,
  },
  {
    id: "mississippi",
    name: "Mississippi",
    abbreviation: "MS",
    description: "Mississippi offers Medicaid HCBS waiver programs for adults with physical disabilities and PACE for seniors who need nursing home level of care in the community.",
    programs: mississippiPrograms,
  },
  {
    id: "missouri",
    name: "Missouri",
    abbreviation: "MO",
    description: "Missouri's MO HealthNet HCBS waiver programs provide home and community-based services for aged and disabled residents, including self-directed care options.",
    programs: missouriPrograms,
  },
  {
    id: "montana",
    name: "Montana",
    abbreviation: "MT",
    description: "Montana's HCBS waivers through DPHHS provide home and community-based services for elderly individuals, people with physical disabilities, and those with developmental disabilities.",
    programs: montanaPrograms,
  },
  {
    id: "nebraska",
    name: "Nebraska",
    abbreviation: "NE",
    description: "Nebraska offers HCBS Medicaid waivers and PACE to help seniors and adults with disabilities access home and community-based care as alternatives to nursing home placement.",
    programs: nebraskaPrograms,
  },
  {
    id: "nevada",
    name: "Nevada",
    abbreviation: "NV",
    description: "Nevada's Medicaid HCBS waivers for frail elderly individuals and adults with physical disabilities help residents remain at home with community-based supports.",
    programs: nevadaPrograms,
  },
  {
    id: "new-hampshire",
    name: "New Hampshire",
    abbreviation: "NH",
    description: "New Hampshire's Choices for Independence Waiver and In-Home Support Waiver provide Medicaid home and community-based services for seniors and adults with disabilities.",
    programs: newHampshirePrograms,
  },
  {
    id: "new-jersey",
    name: "New Jersey",
    abbreviation: "NJ",
    description: "New Jersey's MLTSS and Global Options programs integrate long-term services and supports into Medicaid managed care for residents who need nursing facility level of care.",
    programs: newJerseyPrograms,
  },
  {
    id: "new-mexico",
    name: "New Mexico",
    abbreviation: "NM",
    description: "New Mexico's Mi Via self-directed waiver and Medically Fragile Waiver provide Medicaid home and community-based services for individuals with disabilities.",
    programs: newMexicoPrograms,
  },
  {
    id: "new-york",
    name: "New York",
    abbreviation: "NY",
    description: "New York's Managed Long-Term Care and CDPAP programs provide comprehensive home and community-based services and self-directed personal care for Medicaid-eligible residents.",
    programs: newYorkPrograms,
  },
  {
    id: "north-carolina",
    name: "North Carolina",
    abbreviation: "NC",
    description: "North Carolina's CAP/DA and Innovations waivers provide Medicaid home and community-based services for adults with physical disabilities and intellectual disabilities.",
    programs: northCarolinaPrograms,
  },
  {
    id: "north-dakota",
    name: "North Dakota",
    abbreviation: "ND",
    description: "North Dakota's Medicaid HCBS waivers provide home-based care for elderly and disabled residents and specialized supports for individuals with traumatic brain injuries.",
    programs: northDakotaPrograms,
  },
  {
    id: "ohio",
    name: "Ohio",
    abbreviation: "OH",
    description: "Ohio's PASSPORT Program and Assisted Living Waiver help seniors and adults with disabilities access Medicaid-funded community-based care as alternatives to nursing home placement.",
    programs: ohioPrograms,
  },
  {
    id: "oklahoma",
    name: "Oklahoma",
    abbreviation: "OK",
    description: "Oklahoma's ADvantage Waiver and Community Waiver provide home and community-based Medicaid services for elderly residents and adults with intellectual disabilities.",
    programs: oklahomaPrograms,
  },
  {
    id: "oregon",
    name: "Oregon",
    abbreviation: "OR",
    description: "Oregon's K Plan and APD program provide comprehensive home and community-based long-term care services through coordinated care organizations and DSHS offices.",
    programs: oregonPrograms,
  },
  {
    id: "pennsylvania",
    name: "Pennsylvania",
    abbreviation: "PA",
    description: "Pennsylvania's LIFE (PACE) program and Aging Waiver help seniors access comprehensive Medicaid long-term care services while remaining in their communities.",
    programs: pennsylvaniaPrograms,
  },
  {
    id: "rhode-island",
    name: "Rhode Island",
    abbreviation: "RI",
    description: "Rhode Island's Global Consumer Choice Compact Waiver and Personal Choice Program provide integrated Medicaid home care and self-directed personal care services.",
    programs: rhodeIslandPrograms,
  },
  {
    id: "south-carolina",
    name: "South Carolina",
    abbreviation: "SC",
    description: "South Carolina's Community Long-Term Care and Community Choices programs provide Medicaid home and community-based services for seniors and adults with disabilities.",
    programs: southCarolinaPrograms,
  },
  {
    id: "south-dakota",
    name: "South Dakota",
    abbreviation: "SD",
    description: "South Dakota offers Medicaid HCBS waivers for elderly and disabled residents and developmental disability services through the Department of Social Services.",
    programs: southDakotaPrograms,
  },
  {
    id: "tennessee",
    name: "Tennessee",
    abbreviation: "TN",
    description: "Tennessee's TennCare CHOICES and ECF CHOICES programs provide Medicaid managed long-term care for seniors, adults with physical disabilities, and those with developmental disabilities.",
    programs: tennesseePrograms,
  },
  {
    id: "texas",
    name: "Texas",
    abbreviation: "TX",
    description: "Texas offers Medicaid waiver programs through the Health and Human Services Commission (HHSC) to help seniors and adults with disabilities receive long-term care services at home or in the community.",
    programs: texasPrograms,
  },
  {
    id: "utah",
    name: "Utah",
    abbreviation: "UT",
    description: "Utah's New Choices Waiver and Physical Disability HCBS waiver help seniors and adults with disabilities remain in the community with Medicaid-funded supports.",
    programs: utahPrograms,
  },
  {
    id: "vermont",
    name: "Vermont",
    abbreviation: "VT",
    description: "Vermont's Choices for Care Waiver and Enhanced Residential Care program provide Medicaid home and community-based services coordinated through DAIL.",
    programs: vermontPrograms,
  },
  {
    id: "virginia",
    name: "Virginia",
    abbreviation: "VA",
    description: "Virginia's CCC+ and EDCD Waiver programs provide integrated Medicaid managed care and self-directed personal care services for seniors and adults with disabilities.",
    programs: virginiaPrograms,
  },
  {
    id: "washington",
    name: "Washington",
    abbreviation: "WA",
    description: "Washington's COPES and Community First Choice programs provide comprehensive home and community-based Medicaid services for seniors and adults with disabilities.",
    programs: washingtonPrograms,
  },
  {
    id: "west-virginia",
    name: "West Virginia",
    abbreviation: "WV",
    description: "West Virginia's Aged and Disabled Waiver and IIMM Waiver provide Medicaid home and community-based services for elderly residents and individuals with intellectual disabilities.",
    programs: westVirginiaPrograms,
  },
  {
    id: "wisconsin",
    name: "Wisconsin",
    abbreviation: "WI",
    description: "Wisconsin's Family Care program and PACE provide comprehensive Medicaid managed long-term care for frail elderly adults and adults with physical and intellectual disabilities.",
    programs: wisconsinPrograms,
  },
  {
    id: "wyoming",
    name: "Wyoming",
    abbreviation: "WY",
    description: "Wyoming offers Medicaid HCBS waivers for elderly and disabled residents and intellectual disability services through the Department of Health.",
    programs: wyomingPrograms,
  },
];

export function getStateById(id: string): StateData | undefined {
  return allStates.find((s) => s.id === id);
}

export function getProgramById(stateId: string, programId: string): WaiverProgram | undefined {
  const state = getStateById(stateId);
  return state?.programs.find((p) => p.id === programId);
}

export const activeStateIds = allStates.map((s) => s.id);

// Real program counts sourced from the Olera benefits database.
// Used in the UI instead of programs.length (which only reflects static demo data).
export const stateProgramCounts: Record<string, number> = {
  alabama: 3,
  alaska: 11,
  arizona: 11,
  arkansas: 11,
  california: 18,
  colorado: 12,
  connecticut: 14,
  delaware: 10,
  florida: 10,
  georgia: 10,
  hawaii: 3,
  idaho: 10,
  illinois: 13,
  indiana: 10,
  iowa: 3,
  kansas: 11,
  kentucky: 12,
  louisiana: 10,
  maine: 12,
  maryland: 5,
  massachusetts: 14,
  michigan: 12,
  minnesota: 13,
  mississippi: 10,
  missouri: 12,
  montana: 3,
  nebraska: 10,
  nevada: 11,
  "new-hampshire": 11,
  "new-jersey": 14,
  "new-mexico": 10,
  "new-york": 14,
  "north-carolina": 13,
  "north-dakota": 10,
  ohio: 12,
  oklahoma: 10,
  oregon: 3,
  pennsylvania: 15,
  "rhode-island": 13,
  "south-carolina": 11,
  "south-dakota": 10,
  tennessee: 10,
  texas: 15,
  utah: 5,
  vermont: 12,
  virginia: 12,
  washington: 10,
  "west-virginia": 10,
  wisconsin: 14,
  wyoming: 10,
};
