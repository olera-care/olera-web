"use client";

import { useState } from "react";

// ─── State-specific data ────────────────────────────────────────────────────

interface StateData {
  name: string;
  medicaidAgency: string;
  agencyPhone: string;
  medicaidIncomeLimit: string;
  medicaidAssetLimit: string;
  avgProcessingWeeks: string;
  caregiverPayProgram: string;
  caregiverPayDetails: string;
  spendDownAvailable: boolean;
}

const STATE_FAQ_DATA: Record<string, StateData> = {
  AL: {
    name: "Alabama",
    medicaidAgency: "Alabama Medicaid Agency",
    agencyPhone: "1-800-362-1504",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Personal Choices Program",
    caregiverPayDetails: "Family members can be paid as caregivers through the self-directed Personal Choices waiver.",
    spendDownAvailable: true,
  },
  AK: {
    name: "Alaska",
    medicaidAgency: "Alaska Department of Health",
    agencyPhone: "1-800-780-9972",
    medicaidIncomeLimit: "$2,163/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "30 days",
    caregiverPayProgram: "Personal Care Services (PCS)",
    caregiverPayDetails: "Family members, including spouses, can be paid as personal care attendants.",
    spendDownAvailable: true,
  },
  AZ: {
    name: "Arizona",
    medicaidAgency: "Arizona Health Care Cost Containment System (AHCCCS)",
    agencyPhone: "1-800-654-8713",
    medicaidIncomeLimit: "$1,732/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Arizona Long Term Care System (ALTCS)",
    caregiverPayDetails: "Family members can be paid through ALTCS attendant care. Spouses may be eligible in some cases.",
    spendDownAvailable: false,
  },
  AR: {
    name: "Arkansas",
    medicaidAgency: "Arkansas Department of Human Services",
    agencyPhone: "1-800-482-8988",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "ARChoices in Homecare",
    caregiverPayDetails: "Family members can be hired as caregivers through the ARChoices waiver program.",
    spendDownAvailable: true,
  },
  CA: {
    name: "California",
    medicaidAgency: "California Department of Health Care Services (DHCS)",
    agencyPhone: "1-800-541-5555",
    medicaidIncomeLimit: "$1,732/month (individual)",
    medicaidAssetLimit: "No asset limit (eliminated in 2024)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "In-Home Supportive Services (IHSS)",
    caregiverPayDetails: "IHSS pays family members, including spouses and parents, $16 to $20/hour depending on county.",
    spendDownAvailable: false,
  },
  CO: {
    name: "Colorado",
    medicaidAgency: "Colorado Department of Health Care Policy & Financing",
    agencyPhone: "1-800-221-3943",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Attendant Support Services (CDASS)",
    caregiverPayDetails: "CDASS allows members to hire and manage their own caregivers, including family members.",
    spendDownAvailable: true,
  },
  CT: {
    name: "Connecticut",
    medicaidAgency: "Connecticut Department of Social Services",
    agencyPhone: "1-855-626-6632",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$1,600 (individual), $3,200 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Connecticut Home Care Program (CHCP)",
    caregiverPayDetails: "Family members can be paid as personal care assistants through the CHCP waiver.",
    spendDownAvailable: true,
  },
  DE: {
    name: "Delaware",
    medicaidAgency: "Delaware Division of Medicaid & Medical Assistance",
    agencyPhone: "1-800-372-2022",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "30 days",
    caregiverPayProgram: "Diamond State Health Plan Plus",
    caregiverPayDetails: "Family members may be hired as caregivers through Medicaid HCBS waivers.",
    spendDownAvailable: true,
  },
  FL: {
    name: "Florida",
    medicaidAgency: "Florida Agency for Health Care Administration",
    agencyPhone: "1-888-419-3456",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Statewide Medicaid Managed Care (SMMC) Long-Term Care",
    caregiverPayDetails: "Family members can be paid caregivers through managed care plans offering consumer-directed options.",
    spendDownAvailable: true,
  },
  GA: {
    name: "Georgia",
    medicaidAgency: "Georgia Department of Community Health",
    agencyPhone: "1-800-869-1150",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Care Services Program (CCSP)",
    caregiverPayDetails: "Family members may serve as paid caregivers through the CCSP and SOURCE waivers.",
    spendDownAvailable: true,
  },
  HI: {
    name: "Hawaii",
    medicaidAgency: "Hawaii Department of Human Services Med-QUEST Division",
    agencyPhone: "1-800-316-8005",
    medicaidIncomeLimit: "$1,992/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Care Foster Family Home Program",
    caregiverPayDetails: "Family members can be paid as caregivers through HCBS waiver programs.",
    spendDownAvailable: true,
  },
  ID: {
    name: "Idaho",
    medicaidAgency: "Idaho Department of Health and Welfare",
    agencyPhone: "1-877-456-1233",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Self-Directed Community Supports",
    caregiverPayDetails: "Family members can be hired as paid caregivers through the self-directed option.",
    spendDownAvailable: true,
  },
  IL: {
    name: "Illinois",
    medicaidAgency: "Illinois Department of Healthcare and Family Services",
    agencyPhone: "1-800-226-0768",
    medicaidIncomeLimit: "$1,732/month (individual)",
    medicaidAssetLimit: "No asset limit (eliminated in 2024)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Home Services Program (HSP)",
    caregiverPayDetails: "Family members, including spouses, can be paid personal assistants through HSP.",
    spendDownAvailable: true,
  },
  IN: {
    name: "Indiana",
    medicaidAgency: "Indiana Family and Social Services Administration (FSSA)",
    agencyPhone: "1-800-403-0864",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Aged & Disabled Waiver",
    caregiverPayDetails: "Family members can be paid as attendant care providers through the waiver program.",
    spendDownAvailable: true,
  },
  IA: {
    name: "Iowa",
    medicaidAgency: "Iowa Department of Health and Human Services",
    agencyPhone: "1-800-338-8366",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Attendant Care (CDAC)",
    caregiverPayDetails: "Family members can be hired and managed directly by the consumer through CDAC.",
    spendDownAvailable: true,
  },
  KS: {
    name: "Kansas",
    medicaidAgency: "Kansas Department of Health and Environment (KDHE)",
    agencyPhone: "1-800-792-4884",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "KanCare HCBS Waivers",
    caregiverPayDetails: "Family members can be paid caregivers through KanCare self-directed services.",
    spendDownAvailable: true,
  },
  KY: {
    name: "Kentucky",
    medicaidAgency: "Kentucky Department for Medicaid Services",
    agencyPhone: "1-800-635-2570",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Home and Community Based (HCB) Waiver",
    caregiverPayDetails: "Family members can be paid as personal care attendants through HCB waivers.",
    spendDownAvailable: true,
  },
  LA: {
    name: "Louisiana",
    medicaidAgency: "Louisiana Department of Health",
    agencyPhone: "1-888-342-6207",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Long Term Personal Care Services (LT-PCS)",
    caregiverPayDetails: "Family members can be paid through LT-PCS with self-direction options available.",
    spendDownAvailable: true,
  },
  ME: {
    name: "Maine",
    medicaidAgency: "Maine Department of Health and Human Services",
    agencyPhone: "1-800-977-6740",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$10,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Personal Assistance Services",
    caregiverPayDetails: "Family members, including spouses, can be paid as personal care attendants.",
    spendDownAvailable: true,
  },
  MD: {
    name: "Maryland",
    medicaidAgency: "Maryland Department of Health",
    agencyPhone: "1-800-332-6347",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Personal Assistance Services (CPAS)",
    caregiverPayDetails: "Family members can be hired as paid personal assistants through the self-directed option.",
    spendDownAvailable: true,
  },
  MA: {
    name: "Massachusetts",
    medicaidAgency: "Massachusetts MassHealth",
    agencyPhone: "1-800-841-2900",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Personal Care Attendant (PCA) Program",
    caregiverPayDetails: "Family members, except spouses, can be paid as PCAs. The consumer hires and directs their own care.",
    spendDownAvailable: true,
  },
  MI: {
    name: "Michigan",
    medicaidAgency: "Michigan Department of Health and Human Services",
    agencyPhone: "1-800-642-3195",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "MI Choice Waiver",
    caregiverPayDetails: "Family members can be paid caregivers through MI Choice self-determination options.",
    spendDownAvailable: true,
  },
  MN: {
    name: "Minnesota",
    medicaidAgency: "Minnesota Department of Human Services",
    agencyPhone: "1-800-657-3739",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$3,000 (individual), $6,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Community Supports (CDCS)",
    caregiverPayDetails: "Family members can be paid through CDCS or PCA Choice, including spouses in some cases.",
    spendDownAvailable: true,
  },
  MS: {
    name: "Mississippi",
    medicaidAgency: "Mississippi Division of Medicaid",
    agencyPhone: "1-800-421-2408",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$4,000 (individual), $6,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Elderly and Disabled Waiver",
    caregiverPayDetails: "Family members may be paid as personal care attendants through the waiver program.",
    spendDownAvailable: true,
  },
  MO: {
    name: "Missouri",
    medicaidAgency: "Missouri HealthNet Division",
    agencyPhone: "1-800-392-2161",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$5,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Services (CDS)",
    caregiverPayDetails: "Family members can be paid through CDS. The consumer selects, trains, and manages their caregiver.",
    spendDownAvailable: true,
  },
  MT: {
    name: "Montana",
    medicaidAgency: "Montana Department of Public Health and Human Services",
    agencyPhone: "1-800-362-8312",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Personal Assistance Services (PAS)",
    caregiverPayDetails: "Family members can be paid as personal attendants through Medicaid HCBS waivers.",
    spendDownAvailable: true,
  },
  NE: {
    name: "Nebraska",
    medicaidAgency: "Nebraska Department of Health and Human Services",
    agencyPhone: "1-800-383-4278",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$4,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Aged and Disabled Waiver",
    caregiverPayDetails: "Family members can be paid caregivers through self-directed waiver services.",
    spendDownAvailable: true,
  },
  NV: {
    name: "Nevada",
    medicaidAgency: "Nevada Division of Health Care Financing and Policy",
    agencyPhone: "1-800-992-0900",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Personal Care Services (PCS)",
    caregiverPayDetails: "Family members can be paid as personal care attendants through Medicaid PCS.",
    spendDownAvailable: true,
  },
  NH: {
    name: "New Hampshire",
    medicaidAgency: "New Hampshire Department of Health and Human Services",
    agencyPhone: "1-800-852-3345",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,500 (individual), $4,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Choices for Independence (CFI) Waiver",
    caregiverPayDetails: "Family members can be paid through the CFI waiver's consumer-directed option.",
    spendDownAvailable: true,
  },
  NJ: {
    name: "New Jersey",
    medicaidAgency: "New Jersey Division of Medical Assistance and Health Services",
    agencyPhone: "1-800-356-1561",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$4,000 (individual), $6,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Personal Preference Program (PPP)",
    caregiverPayDetails: "Family members, including spouses, can be paid through PPP's self-directed budget.",
    spendDownAvailable: true,
  },
  NM: {
    name: "New Mexico",
    medicaidAgency: "New Mexico Human Services Department",
    agencyPhone: "1-888-997-2583",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Mi Via Self-Directed Waiver",
    caregiverPayDetails: "Family members can be paid as caregivers through the Mi Via waiver program.",
    spendDownAvailable: true,
  },
  NY: {
    name: "New York",
    medicaidAgency: "New York State Department of Health",
    agencyPhone: "1-800-541-2831",
    medicaidIncomeLimit: "$1,732/month (individual)",
    medicaidAssetLimit: "$31,175 (individual), $46,435 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Personal Assistance Program (CDPAP)",
    caregiverPayDetails: "CDPAP allows almost any family member, including spouses, to be paid as a personal care aide.",
    spendDownAvailable: true,
  },
  NC: {
    name: "North Carolina",
    medicaidAgency: "North Carolina Department of Health and Human Services",
    agencyPhone: "1-800-662-7030",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Alternatives Program (CAP)",
    caregiverPayDetails: "Family members can be paid through CAP/DA or CAP/C consumer-directed options.",
    spendDownAvailable: true,
  },
  ND: {
    name: "North Dakota",
    medicaidAgency: "North Dakota Department of Health and Human Services",
    agencyPhone: "1-800-755-2604",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$3,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "SPED Aged and Disabled Waiver",
    caregiverPayDetails: "Family members may serve as paid personal care attendants through HCBS waivers.",
    spendDownAvailable: true,
  },
  OH: {
    name: "Ohio",
    medicaidAgency: "Ohio Department of Medicaid",
    agencyPhone: "1-800-324-8680",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "PASSPORT Waiver",
    caregiverPayDetails: "Family members can be paid as caregivers through the PASSPORT self-directed option.",
    spendDownAvailable: true,
  },
  OK: {
    name: "Oklahoma",
    medicaidAgency: "Oklahoma Health Care Authority",
    agencyPhone: "1-800-987-7767",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "ADvantage Waiver",
    caregiverPayDetails: "Family members can be paid through the ADvantage waiver's consumer-directed option.",
    spendDownAvailable: true,
  },
  OR: {
    name: "Oregon",
    medicaidAgency: "Oregon Health Authority",
    agencyPhone: "1-800-699-9075",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Independent Choices Program",
    caregiverPayDetails: "Family members, including spouses, can be paid as caregivers through Independent Choices.",
    spendDownAvailable: true,
  },
  PA: {
    name: "Pennsylvania",
    medicaidAgency: "Pennsylvania Department of Human Services",
    agencyPhone: "1-800-692-7462",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$8,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Participant Directed Home Care",
    caregiverPayDetails: "Family members can be hired as caregivers through the participant-directed option in HCBS waivers.",
    spendDownAvailable: true,
  },
  RI: {
    name: "Rhode Island",
    medicaidAgency: "Rhode Island Executive Office of Health and Human Services",
    agencyPhone: "1-401-462-5300",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$4,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Personal Choice Program",
    caregiverPayDetails: "Family members can be paid as caregivers through the self-directed Personal Choice program.",
    spendDownAvailable: true,
  },
  SC: {
    name: "South Carolina",
    medicaidAgency: "South Carolina Department of Health and Human Services",
    agencyPhone: "1-888-549-0820",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Choices Waiver",
    caregiverPayDetails: "Family members may be paid as personal care aides through the Community Choices waiver.",
    spendDownAvailable: true,
  },
  SD: {
    name: "South Dakota",
    medicaidAgency: "South Dakota Department of Social Services",
    agencyPhone: "1-800-597-1603",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "CHOICES Waiver",
    caregiverPayDetails: "Family members can be paid through the CHOICES waiver consumer-directed option.",
    spendDownAvailable: true,
  },
  TN: {
    name: "Tennessee",
    medicaidAgency: "TennCare (Tennessee Division of Health Care Finance and Administration)",
    agencyPhone: "1-800-342-3145",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "CHOICES in Long-Term Services and Supports",
    caregiverPayDetails: "Family members can be paid through the CHOICES consumer direction option.",
    spendDownAvailable: true,
  },
  TX: {
    name: "Texas",
    medicaidAgency: "Texas Health and Human Services Commission (HHSC)",
    agencyPhone: "1-800-252-8263",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Attendant Services (CAS)",
    caregiverPayDetails: "Family members can be paid through CAS and Consumer Directed Services (CDS). Spouses and parents of minor children are generally excluded.",
    spendDownAvailable: true,
  },
  UT: {
    name: "Utah",
    medicaidAgency: "Utah Department of Health and Human Services",
    agencyPhone: "1-800-662-9651",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Aging Waiver",
    caregiverPayDetails: "Family members can be paid as personal care attendants through the Aging Waiver.",
    spendDownAvailable: true,
  },
  VT: {
    name: "Vermont",
    medicaidAgency: "Vermont Department of Vermont Health Access (DVHA)",
    agencyPhone: "1-800-250-8427",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Choices for Care",
    caregiverPayDetails: "Family members, including spouses, can be paid through Choices for Care's flexible spending option.",
    spendDownAvailable: true,
  },
  VA: {
    name: "Virginia",
    medicaidAgency: "Virginia Department of Medical Assistance Services (DMAS)",
    agencyPhone: "1-800-552-8627",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Consumer Directed Services",
    caregiverPayDetails: "Family members can be paid as personal attendants through Consumer Directed Services.",
    spendDownAvailable: true,
  },
  WA: {
    name: "Washington",
    medicaidAgency: "Washington Health Care Authority",
    agencyPhone: "1-800-562-3022",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Individual Provider (IP) Program",
    caregiverPayDetails: "Family members, including spouses, can be paid as Individual Providers through Medicaid.",
    spendDownAvailable: true,
  },
  WV: {
    name: "West Virginia",
    medicaidAgency: "West Virginia Department of Health and Human Resources",
    agencyPhone: "1-800-642-8589",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Aged and Disabled Waiver",
    caregiverPayDetails: "Family members can be paid as personal attendants through the Aged and Disabled Waiver.",
    spendDownAvailable: true,
  },
  WI: {
    name: "Wisconsin",
    medicaidAgency: "Wisconsin Department of Health Services",
    agencyPhone: "1-800-362-3002",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "IRIS (Include, Respect, I Self-Direct) Program",
    caregiverPayDetails: "Family members can be paid as caregivers through the self-directed IRIS program.",
    spendDownAvailable: true,
  },
  WY: {
    name: "Wyoming",
    medicaidAgency: "Wyoming Department of Health",
    agencyPhone: "1-800-251-1269",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$2,000 (individual), $3,000 (couple)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Community Choices Waiver",
    caregiverPayDetails: "Family members can be paid as personal care attendants through the Community Choices Waiver.",
    spendDownAvailable: true,
  },
  DC: {
    name: "Washington, D.C.",
    medicaidAgency: "DC Department of Health Care Finance",
    agencyPhone: "1-202-442-5988",
    medicaidIncomeLimit: "$2,829/month (individual)",
    medicaidAssetLimit: "$4,000 (individual)",
    avgProcessingWeeks: "45 days",
    caregiverPayProgram: "Elderly and Persons with Disabilities (EPD) Waiver",
    caregiverPayDetails: "Family members can be paid as caregivers through the EPD waiver's self-directed option.",
    spendDownAvailable: true,
  },
};

// Fallback for states not yet in the data
const DEFAULT_DATA: StateData = {
  name: "your state",
  medicaidAgency: "your state Medicaid office",
  agencyPhone: "211 (local helpline)",
  medicaidIncomeLimit: "varies by state",
  medicaidAssetLimit: "varies by state",
  avgProcessingWeeks: "30\u201390 days",
  caregiverPayProgram: "Medicaid Home and Community-Based Services",
  caregiverPayDetails: "Many states allow family members to be paid through Medicaid waiver programs.",
  spendDownAvailable: true,
};

// ─── Component ──────────────────────────────────────────────────────────────

interface BenefitsPackageFAQProps {
  stateCode: string | null;
}

export default function BenefitsPackageFAQ({ stateCode }: BenefitsPackageFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const data = (stateCode && STATE_FAQ_DATA[stateCode]) || DEFAULT_DATA;
  const stateName = data.name;

  const faqs = [
    {
      question: `Can I get paid to care for a family member in ${stateName}?`,
      answer: `Yes. ${stateName} offers the ${data.caregiverPayProgram}. ${data.caregiverPayDetails} Call ${data.agencyPhone} to ask about caregiver payment options.`,
    },
    {
      question: `What is the income limit for Medicaid in ${stateName} in 2026?`,
      answer: `The 2026 Medicaid income limit for seniors (65+) in ${stateName} is ${data.medicaidIncomeLimit}. The asset limit is ${data.medicaidAssetLimit}. ${data.spendDownAvailable ? `${stateName} has a spend-down program, so you may still qualify by deducting medical expenses.` : `${stateName} does not have a spend-down program, but asset limits have been relaxed significantly.`}`,
    },
    {
      question: `What if my income is too high to qualify in ${stateName}?`,
      answer: `${data.spendDownAvailable ? `${stateName} has a Medicaid spend-down program that lets you subtract medical expenses from your countable income to qualify.` : `Many programs have higher income limits than you might expect.`} Even if you don't qualify for Medicaid, you may be eligible for Medicare Savings Programs, SNAP, LIHEAP, or veterans benefits.`,
    },
  ];

  return (
    <div className="mt-12 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="space-y-2">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className="bg-primary-50 rounded-xl border border-primary-100 shadow-[0_2px_8px_rgba(77,155,150,0.1),0_1px_3px_rgba(77,155,150,0.08)] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-primary-100/40 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-primary-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                style={{ maxHeight: isOpen ? "500px" : "0px" }}
              >
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
