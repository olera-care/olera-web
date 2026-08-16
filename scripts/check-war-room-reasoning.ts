import assert from "node:assert/strict";
import { WAR_ROOM_STRICT_TOOLS } from "../lib/war-room/discovery.server";
import { WAR_ROOM_PROBE_IDS, warRoomProbeMenu } from "../lib/war-room/probes.server";
import {
  WAR_ROOM_PROBE_KINDS,
  normalizeCompanyRead,
  normalizeInvestigationAssessments,
  retainStrategicLensInvestigations,
  validateInvestigations,
  type InvestigationAssessment,
  type InvestigationDraft,
  type StrategicLensReview,
} from "../lib/war-room/strategy";
import type { WarRoomProposalEvidence } from "../lib/war-room/types";

function assertAnthropicStrictSchemaCompatibility(value: unknown, path = "tools") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertAnthropicStrictSchemaCompatibility(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assert.notEqual(key, "maxItems", `${path}.${key} is not supported by Anthropic strict tools`);
    assert.notEqual(key, "minimum", `${path}.${key} is not supported by Anthropic strict tools`);
    assert.notEqual(key, "maximum", `${path}.${key} is not supported by Anthropic strict tools`);
    if (key === "minItems") {
      assert.ok(nested === 0 || nested === 1, `${path}.${key} must be 0 or 1 for Anthropic strict tools`);
    }
    assertAnthropicStrictSchemaCompatibility(nested, `${path}.${key}`);
  }
}

assertAnthropicStrictSchemaCompatibility(WAR_ROOM_STRICT_TOOLS);

// The ten-lens sweep is split across more than one tool because the provider
// cannot compile a single strict schema covering all ten. What must stay true
// is that the split still partitions the ten lenses exactly: every lens is a
// `required` named field of exactly one sweep tool. Anything less reintroduces
// the silent-omission failure the object contract was built to prevent.
const sweepTools = WAR_ROOM_STRICT_TOOLS.filter((tool) => tool.name.startsWith("submit_lens_sweep"));
assert.ok(sweepTools.length > 0, "at least one lens sweep tool must exist");

const sweptLenses: string[] = [];
for (const tool of sweepTools) {
  const schema = tool.input_schema as {
    required: string[];
    properties: { lensReviews: { type: string; required: string[]; properties: Record<string, unknown> } };
  };
  assert.deepEqual(schema.required, ["lensReviews"], `${tool.name} must require lensReviews`);
  const lensReviews = schema.properties.lensReviews;
  assert.equal(lensReviews.type, "object", "strategic lenses must be required named fields, not an optional-length array");
  assert.deepEqual(
    [...lensReviews.required].sort(),
    Object.keys(lensReviews.properties).sort(),
    `${tool.name} must require every lens field it declares`,
  );
  sweptLenses.push(...lensReviews.required);
}

assert.deepEqual(
  [...sweptLenses].sort(),
  ["company", "content", "customer", "data", "growth", "market", "operations", "product", "provider", "revenue"],
  "the lens sweep tools together must require every strategic lens exactly once",
);
assert.equal(new Set(sweptLenses).size, sweptLenses.length, "no lens may be reviewed by two sweep tools");

// `domain` is deliberately absent from the wire schema — it is stamped from the
// property name the model filled, so a mislabelled lens is not expressible.
for (const tool of sweepTools) {
  const lensReviews = (tool.input_schema as {
    properties: { lensReviews: { properties: Record<string, { properties: Record<string, unknown> }> } };
  }).properties.lensReviews;
  for (const [domain, lens] of Object.entries(lensReviews.properties)) {
    assert.ok(
      !("domain" in lens.properties),
      `the ${domain} lens must not restate its own domain; the server stamps it`,
    );
  }
}

// The probe id list appears in three places: the runnable registry, the
// deterministic validator, and the provider-facing dossier schema. If they
// drift, the model can plan a probe nothing executes, which is exactly the
// failure the probe executor was built to end. Keep them identical.
const dossierTool = WAR_ROOM_STRICT_TOOLS.find((tool) => tool.name === "submit_opportunity_dossiers");
assert.ok(dossierTool, "the dossier tool must exist");
const wireProbeKinds = (dossierTool!.input_schema as {
  properties: { dossiers: { items: { properties: { nextProbe: { properties: { kind: { enum: string[] } } } } } } };
}).properties.dossiers.items.properties.nextProbe.properties.kind.enum;

assert.deepEqual(
  [...wireProbeKinds].sort(),
  [...WAR_ROOM_PROBE_IDS].sort(),
  "the dossier schema's probe kinds must match the runnable probe registry",
);
assert.deepEqual(
  [...WAR_ROOM_PROBE_KINDS].sort(),
  [...WAR_ROOM_PROBE_IDS].sort(),
  "the deterministic validator's probe kinds must match the runnable probe registry",
);
assert.deepEqual(
  [...warRoomProbeMenu().map((probe) => probe.id)].sort(),
  [...WAR_ROOM_PROBE_IDS].sort(),
  "every probe offered to the model must exist in the registry",
);

// Compiled-grammar size is NOT statically checkable: it depends on provider
// internals, and every shape below was accepted or rejected only by asking.
// `npm run check:war-room:contract` is the check that proves the live provider
// still accepts these exact tools. Passing this file does not.

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
    hypotheses: ["Unusable contact records may prevent provider notification."],
    nextProbe: {
      kind: "question_to_claim_conversion",
      question: "Where does the provider response funnel lose the most reachable questions?",
      method: "Segment current questions by contactability, notification state, and provider response outcome.",
      expectedInformationGain: "Identify whether contact data, delivery, or post-delivery participation is the binding constraint.",
    },
    resolutionCriteria: ["The binding response-stage constraint is measured for the current provider cohort."],
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

const [singleHypothesis] = validateInvestigations([dossier({
  options: [
    {
      actionKind: "operations",
      title: "Repair reachable provider cohorts",
      logic: "Prioritize recovery of contact records for providers with current demand.",
      downside: "Manual enrichment may not improve participation.",
    },
    {
      actionKind: "business_development",
      title: "Recruit replacement reachable supply",
      logic: "Recruit providers for affected demand cohorts instead of repairing every legacy record.",
      downside: "New recruitment may cost more and take longer than repairing current supply.",
    },
  ],
})], evidence);
assert.equal(singleHypothesis.readiness, "investigating", "a single causal theory must not become decision-ready");

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
