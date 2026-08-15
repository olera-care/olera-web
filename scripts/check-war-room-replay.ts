import assert from "node:assert/strict";
import { evaluateWarRoomReasoning, reconcilePersistedWarRoomAgenda, type WarRoomCouncilOutput, type WarRoomInvestigatorOutput } from "../lib/war-room/reasoning";
import {
  WAR_ROOM_DOMAINS,
  type InvestigationDraft,
  type StrategicLensReview,
} from "../lib/war-room/strategy";
import type { WarRoomDomain, WarRoomProposalEvidence } from "../lib/war-room/types";

const evidence: WarRoomProposalEvidence[] = [
  ...WAR_ROOM_DOMAINS.map((domain) => ({
    id: `coverage:${domain}`,
    label: `${domain} replay coverage`,
    detail: `The replay fixture includes a current evidence boundary for the ${domain} lens.`,
    source: "Replay coverage fixture",
  })),
  { id: "metric:questions", label: "Questions", detail: "2,540 family questions arrived in 30 days.", source: "Olera product data" },
  { id: "metric:answers", label: "Answers", detail: "112 questions received an answer.", source: "Olera product data" },
  { id: "signal:contactability", label: "Provider contactability", detail: "327 providers need a usable email.", source: "Olera provider-contactability cohort" },
  { id: "metric:ad-boost-mrr", label: "Ad Boost MRR", detail: "Ad Boost recurring revenue is $0.", source: "Olera product data" },
  { id: "comparison:campaigns", label: "Campaign outcomes", detail: "Five observed campaigns ended unpaid.", source: "Olera period comparison" },
  { id: "comparison:provider-views", label: "Provider page views", detail: "Provider page views fell 33% from the prior period.", source: "Olera period comparison" },
  { id: "metric:inquiries", label: "Care inquiries", detail: "Care inquiries remained approximately flat.", source: "Olera product data" },
  { id: "growth:search-clicks", label: "Search clicks", detail: "Search clicks did not fall with provider page views.", source: "Canonical Search Console" },
  { id: "metric:support-backlog", label: "Support backlog", detail: "The inbox reports 899 threads needing attention.", source: "Olera product data", freshness: "aging" },
  { id: "source:support", label: "Support source", detail: "The support source is backfilling and may include stale threads.", source: "Source-health check", freshness: "stale" },
  { id: "voice:provider-contact", label: "Provider contact friction", detail: "Current outreach records repeatedly identify unusable provider contact details.", source: "Care inquiry" },
];

function clearLens(domain: WarRoomDomain): StrategicLensReview {
  return {
    fingerprint: `clear-${domain}-lens`,
    domain,
    status: "clear",
    title: `No supported ${domain} condition in this replay`,
    finding: "The supplied evidence does not establish a material unresolved condition for this lens.",
    whyItMatters: "A clear result protects founder attention without erasing conditions supported elsewhere.",
    unresolvedQuestion: "",
    evidenceIds: [`coverage:${domain}`],
    impact: "low",
    urgency: "monitor",
    strategicFit: "peripheral",
  };
}

function lens(overrides: Partial<StrategicLensReview> & Pick<StrategicLensReview, "domain" | "fingerprint">) {
  return {
    ...clearLens(overrides.domain),
    ...overrides,
  } as StrategicLensReview;
}

function tenLenses(overrides: StrategicLensReview[] = []) {
  const byDomain = new Map(overrides.map((review) => [review.domain, review]));
  return WAR_ROOM_DOMAINS.map((domain) => byDomain.get(domain) ?? clearLens(domain));
}

function council(overrides: Partial<WarRoomCouncilOutput> = {}): WarRoomCouncilOutput {
  return {
    challenge: "Do not promote a condition before the cause and intervention clear the founder gate.",
    companyRead: {
      summary: "No founder decision is ready today.",
      stance: "stable",
      investigationFingerprints: [],
      evidenceIds: [],
      unresolvedQuestions: [],
    },
    rejectedReasons: [],
    assessments: [],
    proposals: [],
    ...overrides,
  };
}

function run(name: string, investigator: WarRoomInvestigatorOutput, review: WarRoomCouncilOutput) {
  const result = evaluateWarRoomReasoning({ evidenceCatalog: evidence, investigator, council: review });
  assert.equal(result.proposals.length, 0, `${name}: an unresolved condition must not become a premature task`);
  return result;
}

const providerDossier: InvestigationDraft = {
  fingerprint: "provider-response-liquidity",
  domain: "provider",
  title: "Provider responsiveness may constrain family outcomes",
  situation: "Question volume materially exceeds answered volume while many provider records lack usable contact information.",
  whyItMatters: "A marketplace cannot create reliable family outcomes when reachable supply does not respond.",
  likelyCause: "Contactability is one plausible constraint, but delivery and provider motivation remain unmeasured.",
  causeConfidence: "low",
  existingCapabilities: ["Olera records questions, answers, and provider contactability cohorts."],
  capabilityEvidenceIds: [],
  unknowns: ["Where is the largest loss between provider selection and submitted answer?"],
  hypotheses: [
    "Missing contact information prevents notification.",
    "Providers receive notifications but do not perceive enough value to answer.",
  ],
  nextProbe: {
    kind: "query",
    question: "At which provider response stage does current family demand lose the most eligible supply?",
    method: "Segment questions by provider contactability, notification delivery, open, and submitted-answer state.",
    expectedInformationGain: "Separate contact-data failure from delivery failure and post-delivery participation failure.",
  },
  resolutionCriteria: ["The binding funnel stage is measured for the current question cohort."],
  options: [],
  evidenceIds: ["metric:questions", "metric:answers", "signal:contactability"],
  counterEvidence: "Some answers or provider contacts may occur outside the measured workflow.",
  readiness: "investigating",
  readinessReason: "The condition is material, but its cause is not established.",
  impact: "high",
  urgency: "soon",
  strategicFit: "central",
  founderAttentionMinutes: 0,
};

const provider = run("provider liquidity", {
  dossiers: [providerDossier],
  lensReviews: tenLenses(),
  portfolioRead: "Provider response liquidity is the strongest unresolved condition.",
}, council({ assessments: [{
  fingerprint: providerDossier.fingerprint,
  disposition: "drop",
  reasonCode: "needs_evidence",
  reason: "The cause is not yet proven.",
}] }));
assert.equal(provider.investigations.length, 1);
assert.equal(provider.assessments[0].disposition, "investigate");
assert.equal(provider.companyRead.stance, "investigating");
assert.equal(provider.investigations[0].nextProbe?.kind, "query");

const revenueReview = lens({
  fingerprint: "provider-monetization-unproven",
  domain: "revenue",
  status: "investigate",
  title: "Provider monetization remains unproven",
  finding: "Ad Boost has zero recurring revenue across the observed completed campaigns.",
  whyItMatters: "Olera still needs evidence of a repeatable revenue mechanism.",
  unresolvedQuestion: "Is the constraint value, packaging, pricing, targeting, or sales execution?",
  evidenceIds: ["metric:ad-boost-mrr", "comparison:campaigns"],
  impact: "high",
  urgency: "soon",
  strategicFit: "central",
});
const revenue = run("monetization", {
  dossiers: [], lensReviews: tenLenses([revenueReview]), portfolioRead: "Revenue warrants private investigation.",
}, council());
assert.equal(revenue.investigations[0].domain, "revenue");

const acquisitionReview = lens({
  fingerprint: "provider-page-attribution-divergence",
  domain: "growth",
  status: "investigate",
  title: "Provider page traffic fell without matching demand loss",
  finding: "Provider page views fell while inquiries and search clicks did not fall with them.",
  whyItMatters: "Reacting before attribution is understood could divert effort from productive acquisition surfaces.",
  unresolvedQuestion: "Which page cohorts lost views, and did their conversion or query mix differ?",
  evidenceIds: ["comparison:provider-views", "metric:inquiries", "growth:search-clicks"],
  impact: "high",
  urgency: "soon",
  strategicFit: "central",
});
assert.equal(run("traffic attribution", {
  dossiers: [], lensReviews: tenLenses([acquisitionReview]), portfolioRead: "Attribution must precede an SEO response.",
}, council()).investigations.length, 1);

const dataReview = lens({
  fingerprint: "support-backlog-freshness-risk",
  domain: "data",
  status: "investigate",
  title: "Support urgency cannot be trusted yet",
  finding: "The reported backlog is large, but its source is aging and still backfilling.",
  whyItMatters: "Stale operational data can manufacture urgency and misallocate the team.",
  unresolvedQuestion: "How many unresolved threads are current, customer-blocking, and not duplicated?",
  evidenceIds: ["metric:support-backlog", "source:support"],
  impact: "high",
  urgency: "soon",
  strategicFit: "central",
});
assert.equal(run("stale support", {
  dossiers: [], lensReviews: tenLenses([dataReview]), portfolioRead: "Validate the queue before treating it as urgent work.",
}, council()).investigations[0].domain, "data");

const rejectedIntervention = run("rejected intervention", {
  dossiers: [providerDossier], lensReviews: tenLenses(), portfolioRead: "The condition persists although an old intervention was rejected.",
}, council({ assessments: [{
  fingerprint: providerDossier.fingerprint,
  disposition: "drop",
  reasonCode: "duplicate",
  reason: "A prior notification-system proposal was superseded.",
}] }));
assert.equal(rejectedIntervention.assessments[0].disposition, "investigate");

const stable = run("genuinely stable", {
  dossiers: [], lensReviews: tenLenses(), portfolioRead: "No supplied evidence supports a material unresolved condition.",
}, council());
assert.equal(stable.investigations.length, 0);
assert.equal(stable.companyRead.stance, "stable");
assert.doesNotMatch(stable.companyRead.summary, /evidence limitation/i);

const decisionDossier: InvestigationDraft = {
  ...providerDossier,
  fingerprint: "provider-contact-repair-condition",
  likelyCause: "Current evidence supports unusable provider contact records as a material constraint on reaching eligible supply.",
  causeConfidence: "medium",
  readiness: "decision_ready",
  readinessReason: "The condition, cause, alternatives, and outcome measure are supported.",
  evidenceIds: ["metric:questions", "signal:contactability", "voice:provider-contact"],
  options: [
    {
      actionKind: "operations",
      title: "Repair the highest-value contact cohort",
      logic: "Prioritize contact repair for providers attached to current unanswered family demand.",
      downside: "Manual repair may not improve provider participation after successful contact.",
    },
    {
      actionKind: "business_development",
      title: "Recruit replacement reachable supply",
      logic: "Recruit providers in the affected demand cohorts instead of repairing every legacy record.",
      downside: "New recruitment may cost more and take longer than repairing current supply.",
    },
  ],
};
const approvedIntervention = {
  sourceInvestigationFingerprint: decisionDossier.fingerprint,
  fingerprint: "repair-current-demand-provider-contacts",
  actionKind: "operations" as const,
  domain: "provider" as const,
  title: "Repair provider contacts attached to current family demand",
  finding: "Unusable contact records materially limit Olera's ability to reach eligible providers for current questions.",
  whyNow: "Current unanswered demand creates a bounded cohort where contact repair can produce measurable family outcomes.",
  proposedSolution: "Repair usable contact details for the providers attached to the highest-value current unanswered demand cohort.",
  decisionRequired: "Authorize a bounded provider-contact repair sprint for the current demand cohort.",
  whyBetterThanAlternatives: "It is faster and more reversible than broad provider recruitment while directly testing whether contactability is the binding constraint.",
  cheapestFalsification: "Stop if repaired contacts do not produce successful delivery or provider responses in the bounded cohort.",
  existingCapabilities: ["Olera already records provider contactability and the questions associated with eligible provider supply."],
  executionPlan: [
    { label: "Prioritize", detail: "Rank providers by current unanswered family demand and contact repairability." },
    { label: "Repair and measure", detail: "Repair the bounded cohort and measure successful delivery and submitted answers." },
  ],
  evidenceIds: ["metric:questions", "signal:contactability", "voice:provider-contact"],
  capabilityEvidenceIds: [],
  counterEvidence: "Some contacted providers may still decline to participate, which would point to a value or motivation constraint.",
  successMeasure: "Within 30 days, measure repaired contacts, successful deliveries, and submitted answers for the bounded cohort.",
  risk: "Contact repair may consume operations time without improving provider participation.",
  rollbackPlan: "Stop after the bounded cohort and retain only verified contact corrections.",
  confidence: "high" as const,
  impact: "high" as const,
  effort: "small" as const,
  urgency: "soon" as const,
  strategicFit: "central" as const,
  reversibility: "high" as const,
  founderAttentionMinutes: 10,
  evaluationWindowDays: 30,
  adminHref: "/admin/email-verifier",
};
const decisionCouncil = council({
  assessments: [{ fingerprint: decisionDossier.fingerprint, disposition: "agenda", reasonCode: "agenda", reason: "The bounded decision clears the founder gate." }],
  proposals: [approvedIntervention],
});
const unblockedDecision = evaluateWarRoomReasoning({
  evidenceCatalog: evidence,
  investigator: { dossiers: [decisionDossier], lensReviews: tenLenses(), portfolioRead: "A bounded provider-contact decision is ready." },
  council: decisionCouncil,
});
assert.equal(unblockedDecision.proposals.length, 1, "the fixture must prove it can clear the founder gate before testing intervention memory");
assert.equal(unblockedDecision.proposals[0].executionPlan.length, 2, "valid bounded plans must survive normalization");

const oversizedDecision = evaluateWarRoomReasoning({
  evidenceCatalog: evidence,
  investigator: {
    dossiers: [{
      ...decisionDossier,
      existingCapabilities: Array.from({ length: 12 }, (_, index) => `Existing capability ${index + 1} is already available for the bounded provider workflow.`),
      unknowns: Array.from({ length: 12 }, (_, index) => `Unknown ${index + 1} still needs a bounded read-only answer.`),
      options: Array.from({ length: 7 }, (_, index) => ({
        actionKind: index % 2 === 0 ? "operations" as const : "business_development" as const,
        title: `Bounded alternative ${index + 1}`,
        logic: `Alternative ${index + 1} provides a materially distinct way to address the supported provider condition.`,
        downside: `Alternative ${index + 1} may consume scarce operating capacity.`,
      })),
    }],
    lensReviews: tenLenses(),
    portfolioRead: "A bounded provider-contact decision is ready.",
  },
  council: {
    ...decisionCouncil,
    proposals: [{
      ...approvedIntervention,
      existingCapabilities: Array.from({ length: 12 }, (_, index) => `Existing capability ${index + 1} is already available for this bounded workflow.`),
      executionPlan: Array.from({ length: 7 }, (_, index) => ({
        label: `Step ${index + 1}`,
        detail: `Execute bounded step ${index + 1} and retain its measurable result for review.`,
      })),
    }],
  },
});
assert.equal(oversizedDecision.investigations[0].existingCapabilities.length, 8, "investigation capability lists must be bounded server-side");
assert.equal(oversizedDecision.investigations[0].unknowns.length, 8, "investigation unknowns must be bounded server-side");
assert.equal(oversizedDecision.investigations[0].options.length, 5, "investigation alternatives must be bounded server-side");
assert.equal(oversizedDecision.proposals[0].existingCapabilities.length, 8, "proposal capability lists must be bounded server-side");
assert.equal(oversizedDecision.proposals[0].executionPlan.length, 5, "proposal execution plans must be bounded server-side");

const blockedDecision = evaluateWarRoomReasoning({
  evidenceCatalog: evidence,
  investigator: { dossiers: [decisionDossier], lensReviews: tenLenses(), portfolioRead: "The same intervention was already rejected." },
  council: decisionCouncil,
  blockedInterventionFingerprints: new Set([approvedIntervention.fingerprint]),
});
assert.equal(blockedDecision.proposals.length, 0, "a rejected intervention fingerprint must not re-enter the founder queue");
assert.equal(blockedDecision.assessments[0].disposition, "investigate", "blocking an intervention must return its condition to investigation");
assert.equal(blockedDecision.validationTrace.blockedInterventions, 1);
const lostPersistenceRace = reconcilePersistedWarRoomAgenda({
  investigations: unblockedDecision.investigations,
  assessments: unblockedDecision.assessments,
  companyRead: decisionCouncil.companyRead,
  evidenceCatalog: evidence,
  lensReviews: tenLenses(),
  acceptedInvestigationFingerprints: new Set(),
});
assert.equal(lostPersistenceRace.assessments[0].disposition, "investigate", "a proposal rejected during a scan must not leave a phantom agenda item");
assert.equal(lostPersistenceRace.companyRead.stance, "investigating");

assert.throws(() => evaluateWarRoomReasoning({
  evidenceCatalog: evidence,
  investigator: { dossiers: [], lensReviews: tenLenses().slice(0, 9), portfolioRead: "Incomplete." },
  council: council(),
}), /war_room_incomplete_lens_coverage/, "a partial scan must fail honestly instead of reporting a false empty result");

assert.throws(() => evaluateWarRoomReasoning({
  evidenceCatalog: evidence,
  investigator: {
    dossiers: [],
    lensReviews: tenLenses().map((review) => ({ ...review, evidenceIds: [] })),
    portfolioRead: "Unsupported clear result.",
  },
  council: council(),
}), /unsupported=/, "ten unsupported clear labels must fail instead of manufacturing stability");

console.log("War Room replay checks passed across 7 strategic scenarios.");
