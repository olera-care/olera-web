import assert from "node:assert/strict";
import {
  normalizeCompanyRead,
  normalizeInvestigationAssessments,
  retainStrategicLensInvestigations,
  validateInvestigations,
  type InvestigationAssessment,
  type InvestigationDraft,
  type StrategicLensReview,
} from "../lib/war-room/strategy";
import type { WarRoomProposalEvidence } from "../lib/war-room/types";

const evidence: WarRoomProposalEvidence[] = [
  { id: "metric:questions", label: "Questions", detail: "2,540 questions arrived", source: "Olera product data" },
  { id: "metric:answers", label: "Answers", detail: "112 questions were answered", source: "Olera product data" },
  { id: "signal:contactability", label: "Contactability", detail: "327 providers need usable email", source: "Olera provider-contactability cohort" },
  { id: "metric:ad-boost-mrr", label: "Ad Boost MRR", detail: "$0 MRR", source: "Olera product data" },
  { id: "comparison:ad-boost-campaigns", label: "Campaign outcomes", detail: "Five campaigns ended unpaid", source: "Olera period comparison" },
];

function dossier(overrides: Partial<InvestigationDraft> = {}): InvestigationDraft {
  return {
    fingerprint: "provider-liquidity-risk",
    domain: "provider",
    title: "Provider participation is constraining marketplace value",
    situation: "Provider answers remain low against reachable family questions.",
    whyItMatters: "Families cannot receive useful marketplace outcomes without responsive supply.",
    likelyCause: "Contactability and provider participation appear to constrain response volume.",
    causeConfidence: "medium",
    existingCapabilities: ["Olera already captures questions and provider responses."],
    capabilityEvidenceIds: [],
    unknowns: ["How much loss occurs at each contact and response stage?"],
    options: [
      {
        actionKind: "operations",
        title: "Repair reachable provider cohorts",
        logic: "Prioritize recovery of contact records for providers with current demand.",
        downside: "Manual enrichment may not improve participation.",
      },
      {
        actionKind: "code",
        title: "bad",
        logic: "too short",
        downside: "small",
      },
    ],
    evidenceIds: evidence.map((item) => item.id),
    counterEvidence: "Some provider cohorts may answer through channels not represented here.",
    readiness: "decision_ready",
    readinessReason: "Two interventions were believed to be ready.",
    impact: "high",
    urgency: "soon",
    strategicFit: "central",
    founderAttentionMinutes: 10,
    ...overrides,
  };
}

const [preserved] = validateInvestigations([dossier()], evidence);
assert.ok(preserved, "a supported condition must survive weak-option validation");
assert.equal(preserved.readiness, "investigating", "weak options must demote, not delete, a dossier");

const unsupportedDrop: InvestigationAssessment = {
  fingerprint: preserved.fingerprint,
  disposition: "drop",
  reasonCode: "needs_evidence",
  reason: "The cause is not yet proven.",
};
assert.equal(
  normalizeInvestigationAssessments([preserved], [unsupportedDrop])[0].disposition,
  "investigate",
  "a material unresolved case cannot be dropped for missing evidence",
);

const duplicateDrop: InvestigationAssessment = {
  ...unsupportedDrop,
  reasonCode: "duplicate",
  reason: "This duplicates an active case.",
};
assert.equal(
  normalizeInvestigationAssessments([preserved], [duplicateDrop])[0].disposition,
  "investigate",
  "an old duplicate intervention cannot erase a material underlying condition",
);
const immaterialDuplicate = { ...preserved, impact: "medium" as const, strategicFit: "adjacent" as const };
assert.equal(normalizeInvestigationAssessments([immaterialDuplicate], [duplicateDrop])[0].disposition, "drop");

const agendaAssessment: InvestigationAssessment = {
  ...unsupportedDrop,
  disposition: "agenda",
  reasonCode: "agenda",
  reason: "This deserves a founder decision.",
};
const gatedOut = normalizeInvestigationAssessments([preserved], [agendaAssessment], new Set());
assert.equal(gatedOut[0].disposition, "investigate", "a failed agenda gate must return to private work");

const companyRead = normalizeCompanyRead({
  summary: "Nothing changed enough to matter.",
  stance: "stable",
  investigationFingerprints: [],
  evidenceIds: [],
  unresolvedQuestions: ["Why are reachable providers not answering?"],
}, [preserved], gatedOut, evidence);
assert.equal(companyRead.stance, "investigating", "the structured stance must match surviving work");
assert.deepEqual(companyRead.investigationFingerprints, [preserved.fingerprint]);
assert.ok(companyRead.evidenceIds.length >= 2, "the company read must inherit evidence from linked work");
assert.match(companyRead.summary, /actively investigating/i);
assert.doesNotMatch(companyRead.summary, /nothing changed enough/i);

const noDossierRead = normalizeCompanyRead(undefined, [], [], evidence);
assert.match(noDossierRead.summary, /evidence limitation/i);

const revenueLens: StrategicLensReview = {
  fingerprint: "ad-boost-monetization-unproven",
  domain: "revenue",
  status: "investigate",
  title: "Olera has not yet proven provider monetization",
  finding: "Ad Boost remains at zero recurring revenue across the observed campaign outcomes.",
  whyItMatters: "Olera needs a repeatable revenue mechanism to become durable.",
  unresolvedQuestion: "Is the binding constraint provider value, packaging, pricing, or sales execution?",
  evidenceIds: ["metric:ad-boost-mrr", "comparison:ad-boost-campaigns"],
  impact: "high",
  urgency: "soon",
  strategicFit: "central",
};
const retainedLens = retainStrategicLensInvestigations([], [revenueLens], evidence);
assert.equal(retainedLens.length, 1, "a material lens finding must survive even without a full dossier");
assert.equal(retainedLens[0].readiness, "investigating");
assert.equal(retainedLens[0].options.length, 0, "private investigation does not require pre-baked solutions");

console.log("War Room reasoning-gate checks passed.");
