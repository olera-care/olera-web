# Iowa Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 6.2m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 10 |
| New (not in our data) | 10 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 5 programs
- **financial**: 3 programs
- **service|advocacy**: 1 programs
- **advocacy**: 1 programs

## New Programs (Not in Our Data)

- **Iowa Medicaid Home & Community Based Services Elderly Waiver** — service ([source](https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs))
  - Shape notes: Individualized services based on assessed needs and interdisciplinary team plan; no fixed budgets/hours; tied to nursing facility level of care determination; statewide with provider availability precondition.
- **Home and Community-Based Services (HCBS)** — service ([source](https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs[9]))
  - Shape notes: Multiple waivers under HCBS umbrella with varying eligibility (Elderly: 65+, NFLOC; others by disability/age); financial eligibility tied to Medicaid with 2026-specific income/equity limits; services via certified providers.[1][2][7][9]
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://hhs.iowa.gov/ (Iowa Department of Human Services); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly))
  - Shape notes: PACE in Iowa is geographically restricted to select counties with specific PACE organizations. Eligibility is primarily medical (nursing home level of care certification) rather than income-based, though Medicaid financial limits apply for those seeking Medicaid-funded enrollment. Iowa-specific income and asset limits, provider contact information, processing times, and waitlist status are not detailed in publicly available search results and require direct contact with Iowa Department of Human Services or local PACE providers. The program structure is uniform across Iowa (comprehensive coordinated care model), but availability and regional provider operations vary significantly by location.
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://hhs.iowa.gov/assistance-programs/food-assistance/snap))
  - Shape notes: Benefits scale by household size and net income with special elderly deductions; Iowa has broader gross income test (160% FPL) and categorical eligibility for SSI/elderly/disabled households; statewide but local admin
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://iuc.iowa.gov/customer-assistance/how-do-i-apply-energy-assistance-liheap and https://liheap-apply.hhs.iowa.gov/s/))
  - Shape notes: Benefits scale by household size, income level, fuel type, and housing type. Program is administered through a network of local community action agencies rather than a single state office, creating regional variation in application methods and processing. Income limits are tied to federal poverty guidelines and updated annually. Priority application period (October 1) exists for elderly and disabled households, with general application period starting November 1. No asset test simplifies eligibility determination. One-time annual payment structure means this is emergency/seasonal assistance rather than ongoing support.
- **Senior Health Insurance Information Program (SHIIP) — Iowa's implementation of the national SHIP program** — service|advocacy ([source](shiip.iowa.gov[1]))
  - Shape notes: SHIIP is fundamentally a counseling and advocacy service, not a direct-benefit program. It helps beneficiaries access OTHER programs (Medicare, Medicaid, Extra Help, Medicare Savings Programs). Income and asset limits are referenced but not detailed in publicly available search results — families must contact local offices for specific thresholds. The program operates through a distributed network of volunteer counselors at sponsor locations rather than centralized offices, which may create regional variation in availability and responsiveness.
- **Meals on Wheels** — service ([source](https://www.legis.iowa.gov/docs/iac/rule/02-05-2025.17.7.21.pdf (Iowa Administrative Code 17.7(21))))
  - Shape notes: Decentralized by local AAAs/providers with regional service areas, no statewide income/asset tables or central application; eligibility via homebound assessment prioritizing economic/social need.
- **Iowa Legal Aid for Seniors** — service ([source](https://iowalegalaid.org))
  - Shape notes: No strict asset test but income up to 125% FPL with senior priority; statewide with local targeting; services via grants for elders beyond standard limits
- **Long-Term Care Ombudsman Program** — advocacy ([source](https://hhs.iowa.gov/health-prevention/aging-services/ltcombudsman))
  - Shape notes: no income test; open to all long-term care residents statewide via local ombudsmen at every facility; advocacy-only, no quantified benefits like hours/dollars; serves HCBS waiver members beyond facilities
- **State Supplementary Assistance (SSA)** — financial ([source](https://hhs.iowa.gov/media/3987/download))
  - Shape notes: Tied to SSI eligibility except income; supplements via categories (blind allowance, residential care, etc.); split administration (SSA vs. HHS); no fixed income tables—uses SSI standards.

## Program Details

### Iowa Medicaid Home & Community Based Services Elderly Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For a single person in 2025: monthly income of $2,901 or less. If over $2,901, may still be eligible under certain conditions. Must meet Medicaid nursing facility income requirements. No full household size table specified in sources; couples follow nursing home Medicaid rules.
- Assets: For a single person: $2,000 or less. Exempt assets include primary home (under specific equity limits for nursing home Medicaid), one car, household goods, and certain burial/funeral funds or contracts. Other assets count toward limit.
- Iowa resident and U.S. citizen or qualified legal entrant.
- Need nursing facility or skilled level of care, determined by Iowa Medicaid Medical Services Unit assessment.
- At risk of institutionalization; choose HCBS as alternative to institutional care.
- Access all other eligible Medicaid services first.
- Approved provider must be available.
- Comprehensive service plan developed and reviewed annually.

**Benefits:** Individualized services based on needs assessed by member and interdisciplinary team, including: Adult Day Care, Assisted Living Services, Assistive Devices, Case Management, Chore Services, Consumer-Directed Attendant Care, Emergency Response System, Home and Vehicle Modifications, Home Delivered Meals, Home Health Aide, Homemaker Services, Mental Health Outreach, Nursing Care, Nutritional Counseling, Respite Care, Senior Companions, Transportation, Consumer Choice Option (monthly budget for self-directed purchases), Financial Management Services. No fixed dollar amounts or hours specified; varies by assessed need. Plus full Medicaid benefits (primary care, behavioral health, skilled nursing, dental, vision, emergency care).
- Varies by: priority_tier

**How to apply:**
- Online: Iowa HHS Benefits Portal (specific URL not listed; access via hhs.iowa.gov).
- Phone: 1-855-889-7985.
- Mail: Paper Medicaid application to Iowa Department of Health and Human Services.
- In-person: Local Social Security office for income verification if needed; assessment scheduled by Iowa Medicaid.

**Timeline:** Not specified; assessment scheduled after application, then reviewed by Iowa Medicaid Medical Services.
**Waitlist:** Not mentioned in sources.

**Watch out for:**
- Must need nursing/skilled level of care; not for those not at institutional risk.
- Must exhaust other Medicaid services first.
- Annual review required with current medical info from doctor.
- Availability depends on approved providers in area.
- Home equity limits apply (follows nursing home Medicaid rules).
- Income over limit may still qualify conditionally, but details require Medicaid planning.

**Data shape:** Individualized services based on assessed needs and interdisciplinary team plan; no fixed budgets/hours; tied to nursing facility level of care determination; statewide with provider availability precondition.

**Source:** https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs

---

### Home and Community-Based Services (HCBS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: In 2026, monthly income up to $2,982 regardless of marital status. When both spouses apply, each has this limit.[1]
- Assets: Must meet Medicaid financial eligibility; countable assets limited (exact limit not specified in sources). Home exempt if applicant lives there or intends to return with equity ≤ $752,000 (2026), spouse lives there, or minor/disabled child lives there. 60-month look-back rule applies; transfers below fair market value cause penalty period.[1]
- Must qualify for Medicaid.
- Require Nursing Facility Level of Care (NFLOC), determined by interRAI-Home Care (HC) assessment based on ADLs (e.g., bathing, dressing, eating, mobility, continence) and cognitive function (e.g., dementia-related decision-making).[1][2]
- Diagnosis alone (e.g., dementia) insufficient for NFLOC.[1]

**Benefits:** Medicaid waiver services including medical, social, and supportive care (specific services like personal care, homemaker, respite not detailed in sources for Elderly Waiver); plus standard Medicaid benefits. Amount/hours not specified; individualized based on needs.[7][9]
- Varies by: priority_tier

**How to apply:**
- Contact Iowa Medicaid Enterprise (specific phone/website not in results; start via DHS/HHS). Coordinated with Department of Health and Human Services (DHS, now HHS).[8]
- Assessment by Iowa Medicaid Enterprise Medical Services Unit.[2]

**Timeline:** Not specified in sources.

**Watch out for:**
- HCBS refers to 7 separate waivers (e.g., Elderly for 65+; must select correct one).[2][9]
- Must first qualify for Medicaid on own income/assets; family income does not count.[8]
- 60-month look-back penalizes asset transfers.[1]
- NFLOC required; dementia diagnosis alone insufficient.[1]
- Home equity limit $752,000 (2026).[1]

**Data shape:** Multiple waivers under HCBS umbrella with varying eligibility (Elderly: 65+, NFLOC; others by disability/age); financial eligibility tied to Medicaid with 2026-specific income/equity limits; services via certified providers.[1][2][7][9]

**Source:** https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs[9]

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Iowa-specific income limits not provided in available search results. General Medicaid guidance suggests monthly 'countable' income (Social Security, pensions, dividends) should not exceed 300% of the Federal Benefit Rate (~$2,901/month for single individuals as of 2025), but Iowa may have different thresholds. Contact Iowa PACE providers directly for current state-specific limits.[4][7]
- Assets: General Medicaid guidance: assets valued at $2,000 or less (excluding primary home and one automobile).[4] Iowa-specific asset limits not detailed in available sources. Verify with Iowa Department of Human Services.[4]
- Certified by the state of Iowa as meeting the need for nursing facility level of care (typically requires extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, eating).[1][4]
- Able to live safely in the community at the time of enrollment with PACE services.[1][2][3]
- Live in a PACE service area county in Iowa.[1][5]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan.[3]
- Cannot be enrolled in hospice services or certain other programs.[3]
- If Medicare-eligible: must be U.S. citizen or legal resident of the state for 5 years prior to application, and be at least 65 years old, disabled, have ALS, or have end-stage renal disease.[4]

**Benefits:** Comprehensive medical and social services including: coordinated primary care, specialist care, prescription medications, hospital and nursing facility care, therapy services, social services, transportation to appointments, and an interdisciplinary team (IDT) providing personalized care planning. PACE becomes the sole source of services for Medicare and Medicaid eligible enrollees.[2][5][8]
- Varies by: Individual need and state certification; not by household size or priority tier

**How to apply:**
- Contact PACE provider directly by phone (specific provider numbers vary by Iowa county/region; see search result [5] for reference to PACE center phone numbers by location).[5]
- In-person at PACE center in your service area.[5]
- Contact Iowa Department of Human Services for referral to local PACE provider

**Timeline:** Not specified in available search results. Contact Iowa PACE providers for current processing timelines.
**Waitlist:** Not specified in available search results. PACE is noted as an alternative to Medicaid HCBS Waivers which may have waitlists, but PACE-specific waitlist status unknown.[4]

**Watch out for:**
- PACE is NOT available statewide in Iowa — only in select counties. Verify your county is in a PACE service area before proceeding.[5]
- Approximately 90% of PACE participants are 'dual-eligible' (enrolled in both Medicare and Medicaid).[3] If your loved one is only Medicare-eligible or only Medicaid-eligible, confirm they can still enroll with your provider.[3][7]
- You cannot be enrolled in a Medicare Advantage plan (Part C) to join PACE — this is a common barrier for seniors who switched to Advantage plans.[3]
- PACE becomes the SOLE source of services for dual-eligible enrollees — you cannot use other Medicare or Medicaid providers simultaneously.[2]
- Enrollment is voluntary but you can leave at any time for any reason.[2][3]
- Iowa requires notification to your PACE social worker if you move to a different county, as service areas are geographically limited.[5]
- Financial eligibility is complex and varies by state. Not meeting standard income/asset thresholds does NOT automatically disqualify you — Medicaid has multiple pathways to eligibility, and a Medicaid Planning Professional can help.[4]
- The average PACE participant is 76 years old with multiple complex medical conditions — this program is designed for seniors with significant health and long-term care needs, not general preventive care.[3]
- If you are Medicare-eligible, you must have been a U.S. citizen or legal resident of Iowa for 5 years prior to application.[4]

**Data shape:** PACE in Iowa is geographically restricted to select counties with specific PACE organizations. Eligibility is primarily medical (nursing home level of care certification) rather than income-based, though Medicaid financial limits apply for those seeking Medicaid-funded enrollment. Iowa-specific income and asset limits, provider contact information, processing times, and waitlist status are not detailed in publicly available search results and require direct contact with Iowa Department of Human Services or local PACE providers. The program structure is uniform across Iowa (comprehensive coordinated care model), but availability and regional provider operations vary significantly by location.

**Source:** https://hhs.iowa.gov/ (Iowa Department of Human Services); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled in Iowa (Oct 1, 2025 - Sep 30, 2026): Gross monthly income limit at 160% FPL - 1 person: $2086, 2: $2820, 3: $3553, 4: $4286, 5: $5020, 6: $5753, 7: $6486, +$732 each additional. If over gross limit, qualify via net income (100% FPL after deductions) and asset tests. Seniors 60+ get higher medical deduction (over $35/month), shelter deduction, and no gross income test if all elderly/disabled[1][2][6].
- Assets: Households where all members are 60+ or disabled often have no asset limits (categorical eligibility in Iowa). Standard resources include countable assets like cash; exempt: home, most retirement savings, one vehicle[1][2][4].
- Iowa resident
- U.S. citizen or qualified non-citizen
- SSI recipients often categorically eligible
- New work requirements (80 hours/month work/volunteer/training) may apply to ages 55-64 without dependents per 2025 changes, but 60+ typically exempt or fewer requirements[5][6][7]

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized stores. Max for 1-person: ~$291, 2-person: ~$535 (2026); actual amount based on net income, household size, deductions (e.g., $100 more net income = ~$30 less benefits). Most seniors receive less than max[1].
- Varies by: household_size

**How to apply:**
- Online: Iowa state portal (via hhs.iowa.gov)
- Phone: Local Department of Social Services or state SNAP hotline
- In-person/mail: Local Department of Social Services offices
- Telephone interviews often available for elderly[1][7]

**Timeline:** Not specified in sources; typically 30 days standard, expedited for urgent cases[1]

**Watch out for:**
- Iowa expanded eligibility to 160% FPL gross (higher than federal 130%), but must meet net/asset if over gross; seniors miss higher deductions for medical/shelter costs; new 2025 work rules impact 55-64; include all who buy/prepare food in household; SSI auto-eligible but verify[1][2][4][5][6]
- Own home/retirement savings often don't count as assets

**Data shape:** Benefits scale by household size and net income with special elderly deductions; Iowa has broader gross income test (160% FPL) and categorical eligibility for SSI/elderly/disabled households; statewide but local admin

**Source:** https://hhs.iowa.gov/assistance-programs/food-assistance/snap

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income must be at or below 175% of federal poverty guidelines[3]. Specific 2019 examples: single-person household $21,858 annually; family of four $45,063 annually[3]. However, one source indicates up to 200% of federal poverty guidelines may apply[4][7]. Verify current limits with your local community action agency as guidelines are updated annually.
- Assets: No asset limit for LIHEAP in Iowa[1].
- Both homeowners and renters are eligible[6]
- Household must have a primary heating source (heating costs are the focus)[2]
- All household members living at the address are counted as part of the household, including roommates covered by the same utility bill[1]
- Priority applicants (elderly 60+, disabled, or those with disconnect notices) can apply starting October 1, 2025; all other households starting November 1, 2025[2][4]

**Benefits:** One-time payment directly to utility company or heating fuel vendor for a portion of primary heating costs[6]. Specific dollar amounts are not provided in search results; benefits are calculated based on household income, household size, type of fuel used for heating, and type of housing[1][2]. Crisis LIHEAP also available for immediate energy emergencies (broken heater, utility shutoff notice, running out of fuel)[1].
- Varies by: household_size, income, fuel_type, housing_type, priority_status

**How to apply:**
- Online portal: liheap-apply.hhs.iowa.gov[7]
- Phone: Dial 211 or contact your local community action agency[2]
- Mail: LIHEAP, Iowa Department of Health & Human Services, Capitol Complex, Des Moines, IA 50319[2]
- In-person: Contact your local community action agency; appointments may be required[4]
- Regional example (Northeast Iowa Community Action Corporation): 563-382-8436 or [email protected][4]
- Regional example (Hawkeye Area Community Action Program): Online application available[5]

**Timeline:** Not specified in search results. One source notes that applicants with a disconnect notice who have completed a LIHEAP application receive 30 days of protection from disconnection while the application is processed[5].
**Waitlist:** Not mentioned in search results. Funding is limited and some local agencies may stop accepting applications if funds run out[1].

**Watch out for:**
- Income limits vary by source (175% vs. 200% of federal poverty guidelines) — verify with your local community action agency[3][4][7]
- Roommates are counted as household members if they share the same utility bill, which may affect eligibility[1]
- This is a one-time payment per year, not ongoing assistance[6]
- Payment goes directly to the utility company, not to the applicant[6]
- Application deadline is April 30, 2026, but funding may run out earlier — apply as soon as possible[1]
- Elderly (60+) and disabled applicants can apply starting October 1, but all others must wait until November 1[2][4]
- LIHEAP-approved households receive protection from heating service disconnection November 1 through April 1, but only if they have an active LIHEAP application[5][6]
- Income documentation requirements vary by income type (wage earners, fixed income, self-employed) — bring the appropriate documentation[2]
- A separate Weatherization Assistance Program exists for home energy efficiency improvements, distinct from LIHEAP cash assistance[1]

**Data shape:** Benefits scale by household size, income level, fuel type, and housing type. Program is administered through a network of local community action agencies rather than a single state office, creating regional variation in application methods and processing. Income limits are tied to federal poverty guidelines and updated annually. Priority application period (October 1) exists for elderly and disabled households, with general application period starting November 1. No asset test simplifies eligibility determination. One-time annual payment structure means this is emergency/seasonal assistance rather than ongoing support.

**Source:** https://iuc.iowa.gov/customer-assistance/how-do-i-apply-energy-assistance-liheap and https://liheap-apply.hhs.iowa.gov/s/

---

### Senior Health Insurance Information Program (SHIIP) — Iowa's implementation of the national SHIP program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income and resource limits exist but specific dollar amounts are not detailed in available sources. Contact local SHIIP office for current limits[5]
- Assets: Resource limits apply but specifics not provided in available sources[5]
- Preparing to enter Medicare system OR currently navigating existing Medicare benefits[2]
- Medicare beneficiaries under 65 with disabilities[1]
- Individuals dually eligible for Medicare and Medicaid[1]
- People with limited incomes[1]

**Benefits:** Free one-on-one counseling, group presentations, and education on Medicare enrollment, Medicare Supplements, Medicare Advantage, Medicare Part D, Medicaid, Medicare Savings Programs, Extra Help/Low Income Subsidy, Long-Term Care Coverage, and fraud prevention[1][2][3][6]
- Varies by: not_applicable — services are standardized across the state

**How to apply:**
- Phone: 1-800-351-4664 (statewide)[1][5]
- Phone: Local SHIIP-SMP sponsor site (varies by county)[1]
- In-person: Local SHIIP offices at sponsor locations (e.g., Spencer Municipal Hospital for Clay County; St. Anthony Hospital for other regions)[2][3]
- Email: shiip@iid.iowa.gov[5]
- Website: shiip.iowa.gov[1][5]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- SHIIP is Iowa's name for the national SHIP program — confusion between the two names is common[1][4]
- This is a COUNSELING and INFORMATION service, not a direct financial assistance program — it helps people understand and enroll in programs that provide financial help (Medicare Savings Programs, Extra Help)[1][5]
- Counselors are volunteers — availability may vary by location and season[1][6]
- SHIIP does not sell insurance products and is not affiliated with insurance companies — it provides unbiased information[6]
- Medicare enrollment deadlines matter: people should enroll at 65; drug plan changes occur October 15 – December 7 annually[3]
- If not eligible for Medicare, Iowa Navigators (1-877-474-6284) is the referral program[5]

**Data shape:** SHIIP is fundamentally a counseling and advocacy service, not a direct-benefit program. It helps beneficiaries access OTHER programs (Medicare, Medicaid, Extra Help, Medicare Savings Programs). Income and asset limits are referenced but not detailed in publicly available search results — families must contact local offices for specific thresholds. The program operates through a distributed network of volunteer counselors at sponsor locations rather than centralized offices, which may create regional variation in availability and responsiveness.

**Source:** shiip.iowa.gov[1]

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or tables listed in state rules; eligibility prioritizes those in greatest economic need via assessment. Some local programs offer funding assistance based on financial situation, but no dollar amounts provided[1][7][8].
- Assets: No asset limits mentioned; no details on what counts or exemptions[1].
- Homebound by reason of illness, incapacitating disability, or other cause[1][3][4][5].
- Spouse of eligible older individual may receive meals if in the best interest of the homebound individual[1].
- Reside in the service area of the local Area Agency on Aging (AAA) or provider[3][6][8].
- Assessment determines frequency of need (days per week)[1].

**Benefits:** Home-delivered nutritious meals (hot, cold, frozen, dried, canned, or supplemental) at least once a day, 5 or more days per week, according to assessed need. Meals meet 1/3 of dietary guidelines for older adults. May include frozen meals, breakfast bags. Some programs serve veterans of any age[1][4][6][7][8].
- Varies by: region

**How to apply:**
- Contact local AAA or provider: e.g., Milestones AAA at (855) 410-6222[8]; Johnson County at (319) 338-0515[4]; WesleyLife at (515) 699-3243[7]; Horizons Family Services online form[6]; Fort Dodge online sign-up[5].
- AAA conducts individual assessment for eligibility and frequency[1].

**Timeline:** Not specified; local provider follows up after request to determine eligibility[6].
**Waitlist:** Not mentioned in sources.

**Watch out for:**
- Not statewide uniform program; must contact local AAA/provider for service area and exact process—no central application[1][4][6][8].
- No fixed income/asset tests in state rules; 'greatest economic need' determined locally, often via assessment or donations[1][7].
- Spouse eligibility discretionary, based on older individual's best interest[1].
- Frequency (days/week) set by assessment, not guaranteed 7 days[1].
- Private pay required if ineligible (e.g., $8.10-$9.50/meal)[4][7].
- Homebound strictly required; temporary for recovery or respite[4][5].

**Data shape:** Decentralized by local AAAs/providers with regional service areas, no statewide income/asset tables or central application; eligibility via homebound assessment prioritizing economic/social need.

**Source:** https://www.legis.iowa.gov/docs/iac/rule/02-05-2025.17.7.21.pdf (Iowa Administrative Code 17.7(21))

---

### Iowa Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Up to 125% of the federal poverty level (exceptions up to 200% in some cases; special grants for higher incomes for seniors on specific issues). Exact dollar amounts vary by household size and year; contact for current table as 2026 figures not specified in sources[2][6][9].
- Assets: No specific asset limits mentioned for Iowa Legal Aid for Seniors; means testing prohibited—services not denied based on finances for those 60+[1]. (Note: Medicaid-related programs they assist with have limits like $2,000 for singles[3][5]).
- Iowa resident
- Low-income or priority needs (rural, economic/social need, disabilities, limited English, Alzheimer's, at risk of institutionalization/homelessness/guardianship)[1][2]

**Benefits:** Free legal assistance including advice, counseling, representation on elder law issues (e.g., housing, public benefits, abuse prevention, Medicaid planning, guardianships, benefits screening via tools like BenefitsCheckUp)[1][6][7][8][10]. No fixed dollar amounts or hours specified.
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-532-1503 or 800-992-8161 (seniors hotline)[7][8]
- Online: iowalegalaid.org (apply to find out if qualify)[2][7]
- In-person: Local offices statewide (e.g., Johnson County reference)[6]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not automatic—must apply to confirm qualification even if 60+; income exceptions not guaranteed[2]
- Priority for greatest need (e.g., frail, rural, at risk); others may be waitlisted or referred[1]
- Separate from Medicaid Elderly Waiver (which has strict asset/income rules they can assist with)[3][4]
- Means testing prohibited, but funding guidelines influence help[1][6]

**Data shape:** No strict asset test but income up to 125% FPL with senior priority; statewide with local targeting; services via grants for elders beyond standard limits

**Source:** https://iowalegalaid.org

---

### Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to any resident regardless of financial status[1][6]
- Assets: No asset limits; no financial tests apply[1][6]
- Must be a resident or tenant of a long-term care facility in Iowa, including nursing homes, assisted living programs, residential care facilities, or elder group homes (per Iowa Code chapter 135C)[1][5][6]
- Also serves those enrolled in Iowa’s Home and Community-Based Services (HCBS) waiver programs (AIDS/HIV, Brain Injury, Children’s Mental Health, Elderly, Health and Disability, Intellectual Disability, Physical Disability), and Medicaid managed care members[6]
- Exclusions for certain assisted living/residential care: acute stage of alcoholism/drug addiction/uncontrolled mental illness; under age 18; requires more than part-time/intermittent health-related care; unmanageable incontinence despite program; behavior placing others at risk[1][6]

**Benefits:** Advocacy services including investigating complaints about conditions/treatment, resolving problems, educating on resident rights, clarifying regulations/policies/managed care processes, assistance with involuntary discharge/facility closure, information on resident/family councils, self-advocacy support, and substitute decision makers (e.g., power of attorney, guardian); no fixed dollar amounts or hours—response based on need, provided by paid staff and certified volunteers[1][3][5][6]

**How to apply:**
- Phone: Call statewide hotline at 1-800-532-3213 (access code 878277# for prompts)[7]
- Contact Local Long-Term Care Ombudsman (posted in every facility)[5]
- Visit official website: https://hhs.iowa.gov/health-prevention/aging-services/ltcombudsman[6]
- Download brochures for more info: Long-Term Care Ombudsman Brochure or Resident Rights Brochure[6]
- In-person: Contact assigned Local Ombudsman at the facility[5]

**Timeline:** Timely response required; local ombudsmen organized for effective completion, but no fixed timeline specified—depends on complaint urgency[1]

**Watch out for:**
- Not a healthcare or financial aid program—purely advocacy for rights/complaints, not direct services like care or funding[6]
- Families considering placement or with loved ones in facilities can contact preemptively, but core service is for current residents[3]
- Volunteers (not recipients) have age 18+ requirement, criminal background check, conflict of interest rules, transportation needs—confused with service eligibility[2][3][4]
- Exclusions apply to certain residential care levels (e.g., acute mental health needs)—check facility type[1][6]
- Must contact Local Ombudsman posted in facility, not assume statewide office handles all[5]

**Data shape:** no income test; open to all long-term care residents statewide via local ombudsmen at every facility; advocacy-only, no quantified benefits like hours/dollars; serves HCBS waiver members beyond facilities

**Source:** https://hhs.iowa.gov/health-prevention/aging-services/ltcombudsman

---

### State Supplementary Assistance (SSA)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No fixed dollar amounts specified; must receive SSI or meet all SSI criteria except for excess income (or substantial gainful activity for Supplement for Medicare and Medicaid Eligibles). Income is verified if exceeding SSI limits. Federal SSI regulations apply for exclusions.
- Assets: Resources $2,000 for single person or $3,000 for couple. Counts typical SSI resources; exempts life insurance policies with combined face value up to $1,500 per person (term insurance with no cash value not considered). Federal SSI resource rules apply.
- Aged (65+), blind (central visual acuity 20/200 or less in better eye), or disabled.
- Iowa resident.
- U.S. citizen or qualified noncitizen (e.g., LAPR with 40 quarters, refugee, asylee).
- Applied for or receiving all other eligible benefits.
- For specific categories (e.g., Residential Care): physician certification that nursing care not required but residential care is.

**Benefits:** Cash supplementation to SSI or SSI-like eligible individuals to cover special needs: Special Blind Allowance (e.g., up to $22 less if income exceeds SSI); Residential Care (in licensed facility); Family-Life Home; Dependent Relative; In-Home Health-Related Care. Exact amounts vary by countable income deducted from state standard; federal SSI plus supplementation.
- Varies by: priority_tier

**How to apply:**
- Social Security District Office serving your county (for SSI recipients or basic SSI payment cases).
- Iowa Department of Health and Human Services (HHS) local offices (for state-administered: residential care, in-home health-related care, Medicare/Medicaid eligibles).
- Phone: Local SSA office (find via ssa.gov) or HHS at 1-800-972-2017 (general HHS line; confirm SSA-specific).
- Website: hhs.iowa.gov/services/supplemental-nutrition-assistance-program-snap (related; SSA via HHS PDFs) or ssa.gov/ssi.

**Timeline:** Not specified in sources.

**Watch out for:**
- Must meet SSI rules except excess income; SSI denial doesn't automatically qualify—full verification needed if income over SSI limit.
- Different administration: SSA for most, HHS for residential/in-home—wrong office delays.
- Special categories require physician note (e.g., Residential Care).
- Children: Blind in own/dependent relative home; disabled only with dependent relative.
- Resources include countable life insurance over $1,500 face value.
- Must apply for all other benefits.

**Data shape:** Tied to SSI eligibility except income; supplements via categories (blind allowance, residential care, etc.); split administration (SSA vs. HHS); no fixed income tables—uses SSI standards.

**Source:** https://hhs.iowa.gov/media/3987/download

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Iowa Medicaid Home & Community Based Ser | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Senior Health Insurance Information Prog | navigator | federal | simple |
| Meals on Wheels | benefit | federal | deep |
| Iowa Legal Aid for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| State Supplementary Assistance (SSA) | benefit | state | deep |

**Types:** {"benefit":7,"navigator":1,"resource":2}
**Scopes:** {"state":4,"local":1,"federal":5}
**Complexity:** {"deep":7,"simple":3}

## Content Drafts

Generated 10 page drafts. Review in admin dashboard or `data/pipeline/IA/drafts.json`.

- **Iowa Medicaid Home & Community Based Services Elderly Waiver** (benefit) — 4 content sections, 6 FAQs
- **Home and Community-Based Services (HCBS)** (benefit) — 3 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Senior Health Insurance Information Program (SHIIP) — Iowa's implementation of the national SHIP program** (navigator) — 2 content sections, 6 FAQs
- **Meals on Wheels** (benefit) — 3 content sections, 6 FAQs
- **Iowa Legal Aid for Seniors** (resource) — 1 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs
- **State Supplementary Assistance (SSA)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **Individual need and state certification; not by household size or priority tier**: 1 programs
- **household_size**: 1 programs
- **household_size, income, fuel_type, housing_type, priority_status**: 1 programs
- **not_applicable — services are standardized across the state**: 1 programs
- **region**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Iowa Medicaid Home & Community Based Services Elderly Waiver**: Individualized services based on assessed needs and interdisciplinary team plan; no fixed budgets/hours; tied to nursing facility level of care determination; statewide with provider availability precondition.
- **Home and Community-Based Services (HCBS)**: Multiple waivers under HCBS umbrella with varying eligibility (Elderly: 65+, NFLOC; others by disability/age); financial eligibility tied to Medicaid with 2026-specific income/equity limits; services via certified providers.[1][2][7][9]
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE in Iowa is geographically restricted to select counties with specific PACE organizations. Eligibility is primarily medical (nursing home level of care certification) rather than income-based, though Medicaid financial limits apply for those seeking Medicaid-funded enrollment. Iowa-specific income and asset limits, provider contact information, processing times, and waitlist status are not detailed in publicly available search results and require direct contact with Iowa Department of Human Services or local PACE providers. The program structure is uniform across Iowa (comprehensive coordinated care model), but availability and regional provider operations vary significantly by location.
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits scale by household size and net income with special elderly deductions; Iowa has broader gross income test (160% FPL) and categorical eligibility for SSI/elderly/disabled households; statewide but local admin
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Benefits scale by household size, income level, fuel type, and housing type. Program is administered through a network of local community action agencies rather than a single state office, creating regional variation in application methods and processing. Income limits are tied to federal poverty guidelines and updated annually. Priority application period (October 1) exists for elderly and disabled households, with general application period starting November 1. No asset test simplifies eligibility determination. One-time annual payment structure means this is emergency/seasonal assistance rather than ongoing support.
- **Senior Health Insurance Information Program (SHIIP) — Iowa's implementation of the national SHIP program**: SHIIP is fundamentally a counseling and advocacy service, not a direct-benefit program. It helps beneficiaries access OTHER programs (Medicare, Medicaid, Extra Help, Medicare Savings Programs). Income and asset limits are referenced but not detailed in publicly available search results — families must contact local offices for specific thresholds. The program operates through a distributed network of volunteer counselors at sponsor locations rather than centralized offices, which may create regional variation in availability and responsiveness.
- **Meals on Wheels**: Decentralized by local AAAs/providers with regional service areas, no statewide income/asset tables or central application; eligibility via homebound assessment prioritizing economic/social need.
- **Iowa Legal Aid for Seniors**: No strict asset test but income up to 125% FPL with senior priority; statewide with local targeting; services via grants for elders beyond standard limits
- **Long-Term Care Ombudsman Program**: no income test; open to all long-term care residents statewide via local ombudsmen at every facility; advocacy-only, no quantified benefits like hours/dollars; serves HCBS waiver members beyond facilities
- **State Supplementary Assistance (SSA)**: Tied to SSI eligibility except income; supplements via categories (blind allowance, residential care, etc.); split administration (SSA vs. HHS); no fixed income tables—uses SSI standards.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Iowa?
