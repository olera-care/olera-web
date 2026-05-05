/**
 * Template answers for suggested questions in the inline_answer variant.
 *
 * These answers are designed to be:
 * 1. Helpful but brief (2 lines max)
 * 2. Leave room for the provider's real response
 * 3. Encourage the user to get in touch for specifics
 *
 * The map key is the exact question text (case-sensitive, must match
 * exactly with questions from getSuggestedQuestions in provider-utils.ts).
 *
 * If a question isn't found in this map, the component uses the generic
 * fallback answer defined below.
 */

export const SUGGESTED_ANSWER_TEMPLATES: Record<string, string> = {
  // ─── Home Care Agency ───────────────────────────────────────────────────────
  "Can I meet the caregiver before they start?":
    "Most agencies arrange a meet-and-greet before care begins. It's a great way to ensure a good personality fit.",

  "What happens if my caregiver calls in sick?":
    "Reputable agencies keep backup caregivers on call. Ask about their policy for same-day coverage.",

  "Do you have a minimum number of hours per visit?":
    "Many agencies require 3-4 hour minimums, though some offer shorter visits. Policies vary by location.",

  "Are your caregivers background-checked?":
    "Licensed agencies typically run criminal background checks, reference checks, and verify certifications.",

  "Can caregivers help with medication reminders?":
    "Non-medical caregivers can remind you to take medications but can't administer them. Nurses can do both.",

  // ─── Home Health Agency ─────────────────────────────────────────────────────
  "Does Medicare cover your services?":
    "Medicare covers skilled nursing and therapy when ordered by a doctor and the patient is homebound.",

  "How quickly can a nurse start visiting?":
    "With a doctor's order, most agencies can begin within 24-48 hours. Urgent cases may be faster.",

  "Can you coordinate with my doctor's office?":
    "Yes — home health nurses send regular updates to your doctor and can adjust care plans as needed.",

  "What happens after my insurance authorization ends?":
    "You can continue privately or transition to non-medical home care. The agency can help plan next steps.",

  "Do you offer physical therapy at home?":
    "Most home health agencies offer PT, OT, and speech therapy as part of their covered services.",

  // ─── Hospice Agency ─────────────────────────────────────────────────────────
  "Is hospice really free for families?":
    "Medicare, Medicaid, and most insurance cover hospice at no cost to families, including medications.",

  "Can my loved one stay at home for hospice?":
    "Absolutely — most hospice care happens at home. The team comes to you with supplies and support.",

  "How quickly can services start?":
    "With a physician's referral, hospice can often begin within 24-48 hours, sometimes same-day.",

  "What support do you offer family caregivers?":
    "Hospice teams provide respite care, grief counseling, and 24/7 phone support for family members.",

  "What if my loved one improves — can they leave hospice?":
    "Yes — if health improves, patients can graduate from hospice and return if needed later.",

  // ─── Assisted Living ────────────────────────────────────────────────────────
  "Can I tour the community before deciding?":
    "Tours are encouraged — most communities offer walk-ins or scheduled visits, often with a meal.",

  "What's included in the monthly cost?":
    "Base rates typically cover housing, meals, utilities, and basic assistance. Care needs add extra.",

  "How do you handle medical emergencies?":
    "Staff are trained in first aid and call 911 for emergencies. Many have nurses on-site 24/7.",

  "Can residents bring their own furniture?":
    "Yes — personal furniture, photos, and décor help make apartments feel like home.",

  "What activities and outings do you offer?":
    "Communities offer exercise classes, social events, outings, and hobby groups. Ask for a calendar.",

  // ─── Memory Care ────────────────────────────────────────────────────────────
  "How do you keep residents with dementia safe?":
    "Secured entries, wander-prevention technology, and trained staff ensure residents stay safe.",

  "What's the staff-to-resident ratio?":
    "Memory care typically has higher ratios than assisted living — often 1:5 or 1:6 during the day.",

  "Can my parent still go outside?":
    "Many communities have secured outdoor gardens so residents can enjoy fresh air safely.",

  "How do you handle sundowning behavior?":
    "Staff use calming routines, lighting adjustments, and familiar activities to ease evening anxiety.",

  "What training do your caregivers receive?":
    "Look for dementia-specific certifications and ongoing training in person-centered care approaches.",

  // ─── Nursing Home ───────────────────────────────────────────────────────────
  "Does Medicare or Medicaid cover the stay?":
    "Medicare covers short-term skilled rehab. Medicaid covers long-term care for those who qualify.",

  "Can I visit anytime?":
    "Most facilities allow 24-hour visitation for family, though some have quiet hours overnight.",

  "What's the staff-to-patient ratio?":
    "Ratios vary by state regulations and shift. Ask about day, evening, and weekend staffing.",

  "How do you handle a change in care needs?":
    "Care plans are reviewed regularly and adjusted as needs change. Family is part of this process.",

  "What are the options for rehab-to-long-term transitions?":
    "If rehab extends to long-term, social workers help with Medicaid applications and planning.",

  // ─── Independent Living ─────────────────────────────────────────────────────
  "What's included in the monthly fee?":
    "Typically includes housing, utilities, meals, housekeeping, and access to amenities and activities.",

  "Are there options if I need more help later?":
    "Many communities offer assisted living on the same campus for easy transitions as needs change.",

  "What social activities are available?":
    "Expect fitness classes, game nights, outings, clubs, and community events. Ask for a calendar.",

  "Can I bring my pet?":
    "Many communities are pet-friendly with size and breed guidelines. Ask about their pet policy.",

  "Is there a waitlist?":
    "Popular communities may have waitlists. Getting on early reserves your spot without commitment.",

  // ─── Inpatient Hospice ──────────────────────────────────────────────────────
  "When is inpatient hospice the right choice?":
    "Inpatient is for symptoms that can't be managed at home — pain, breathing issues, or family respite.",

  "Can family stay overnight?":
    "Most inpatient hospice facilities welcome family to stay 24/7 in the patient's room.",

  "Is this covered by Medicare?":
    "Yes — Medicare hospice benefit covers inpatient care when medically necessary.",

  "How is pain managed for patients?":
    "Hospice teams specialize in comfort care, using medications and therapies to minimize suffering.",

  "What support do you offer the family?":
    "Chaplains, social workers, and bereavement counselors support families before and after.",

  // ─── Rehab Facility ─────────────────────────────────────────────────────────
  "How long does the average stay last?":
    "Medicare covers up to 100 days, but most stays are 2-4 weeks depending on recovery progress.",

  "What does a typical day look like?":
    "Expect 1-3 hours of therapy (PT, OT, speech) plus rest, meals, and recreation time.",

  "Will insurance cover my rehab stay?":
    "Medicare covers skilled nursing rehab after a hospital stay. Private insurance varies by plan.",

  "Can family visit during therapy hours?":
    "Family involvement in therapy is often encouraged — ask about observation and education sessions.",

  "What's the transition plan for going home?":
    "Discharge planning starts early. Social workers coordinate home care, equipment, and follow-up.",

  // ─── Adult Day Care ─────────────────────────────────────────────────────────
  "What hours are you open?":
    "Most centers operate weekday business hours, roughly 7am-6pm. Some offer extended or weekend hours.",

  "Do you offer transportation?":
    "Many centers provide door-to-door transportation. Ask about coverage area and scheduling.",

  "Can you accommodate special dietary needs?":
    "Centers typically accommodate diabetic, low-sodium, and other dietary requirements. Ask ahead.",

  "What activities do participants do during the day?":
    "Programs include exercise, games, music, crafts, and social time tailored to abilities.",

  "Do you accept Medicaid or VA benefits?":
    "Many centers accept Medicaid waivers and VA benefits. Staff can help verify your coverage.",

  // ─── Wellness Center ────────────────────────────────────────────────────────
  "What programs do you offer for seniors?":
    "Programs often include fitness classes, chronic disease management, nutrition counseling, and more.",

  "Do I need a referral to join?":
    "Some insurance-based programs require a referral. Community programs often don't.",

  "Are group classes available?":
    "Yes — group exercise, education workshops, and support groups are common offerings.",

  "What does a first visit look like?":
    "Expect an assessment of your goals and health history, then a personalized program recommendation.",

  // ─── Private Caregiver ──────────────────────────────────────────────────────
  "Are you available on weekends?":
    "Availability varies by caregiver. Discuss your schedule needs during the initial conversation.",

  "Can you help with bathing and personal care?":
    "Many private caregivers assist with bathing, dressing, grooming, and toileting support.",

  "Do you have experience with dementia patients?":
    "Ask about specific dementia training, certifications, and hands-on experience with memory care.",

  "What are your rates?":
    "Private caregiver rates vary by region, experience, and hours. Expect $15-$30/hour typically.",

  "Can you provide references?":
    "Reputable caregivers can provide references from previous families. Always verify before hiring.",

  // ─── Default / Generic ──────────────────────────────────────────────────────
  "What services do you provide?":
    "Services vary by provider type and location. Ask about your specific care needs during outreach.",

  "What are your rates or pricing?":
    "Pricing depends on care level, hours, and location. Most providers offer free consultations.",

  "How quickly can you get started?":
    "Many providers can begin within days. Urgent needs can often be accommodated faster.",

  "Do you accept insurance or Medicaid?":
    "Coverage varies by provider and state. Ask about accepted insurance and payment options.",
};

/**
 * Generic fallback answer for any question not in the map.
 */
export const FALLBACK_ANSWER =
  "This depends on the provider's specific policies. Reach out to get details for your situation.";

/**
 * Get the template answer for a question.
 * Returns the specific answer if found, otherwise the generic fallback.
 */
export function getTemplateAnswer(question: string): string {
  return SUGGESTED_ANSWER_TEMPLATES[question] ?? FALLBACK_ANSWER;
}
