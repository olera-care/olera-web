import type {
  WarRoomActionKind,
  WarRoomCompanyRead,
  WarRoomCompanyModel,
  WarRoomDomain,
  WarRoomProposalEvidence,
} from "@/lib/war-room/types";

export const WAR_ROOM_DOMAINS: WarRoomDomain[] = [
  "company", "customer", "provider", "growth", "revenue", "product",
  "content", "operations", "market", "data",
];

export const WAR_ROOM_ACTION_KINDS: WarRoomActionKind[] = [
  "code", "research", "operations", "business_development", "content", "decision",
];

export const DEFAULT_COMPANY_MODEL: WarRoomCompanyModel = {
  key: "olera",
  purpose: "Help families find and act on trustworthy senior-care options while building a durable, efficient company.",
  stage: "Early-stage marketplace proving repeatable family acquisition, provider participation, and revenue.",
  north_star: "More families successfully connect with appropriate care while Olera learns a repeatable, economically durable way to create that outcome.",
  current_priorities: [
    "Increase useful family outcomes",
    "Improve reachable and responsive provider supply",
    "Find repeatable revenue",
    "Protect distribution resilience",
  ],
  strategic_bets: [
    "Provider pages",
    "Benefits guidance",
    "Editorial content",
    "Provider participation",
    "Ad Boost and other provider revenue",
  ],
  constraints: [
    "Founder attention is scarce",
    "Company-wide revenue and cost data are not yet consolidated",
    "Some provider contact information is missing or stale",
  ],
  guardrails: [
    "Protect families and providers",
    "Do not trade trust for short-term metrics",
    "No autonomous sends, spend, deployment, deletion, or production mutation",
    "Prefer reversible learning before expensive commitment",
  ],
  strategic_questions: [
    "Which acquisition loops are durable beyond Google?",
    "Where does family demand exceed reachable provider supply?",
    "Why do providers fail to engage?",
    "Which value can Olera reliably monetize?",
  ],
  updated_by: null,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};

/** Keep evidence IDs in attached evidence, never in the CEO-facing prose. */
export function cleanExecutiveText(value: string) {
  return value
    .replace(/\((?:metric|signal|comparison|growth|voice|source|decision|external|capability):[^)]+\)/gi, "")
    .replace(/\b(?:metric|signal|comparison|growth|voice|source|decision|external|capability):[a-z0-9_.:-]+\b/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export type InvestigationDraft = {
  fingerprint: string;
  domain: WarRoomDomain;
  title: string;
  situation: string;
  whyItMatters: string;
  likelyCause: string;
  causeConfidence: "high" | "medium" | "low";
  existingCapabilities: string[];
  capabilityEvidenceIds: string[];
  unknowns: string[];
  options: Array<{
    actionKind: WarRoomActionKind;
    title: string;
    logic: string;
    downside: string;
  }>;
  evidenceIds: string[];
  counterEvidence: string;
  readiness: "investigating" | "watchlist" | "decision_ready";
  readinessReason: string;
  impact: "high" | "medium" | "low";
  urgency: "now" | "soon" | "monitor";
  strategicFit: "central" | "adjacent" | "peripheral";
  founderAttentionMinutes: number;
};

export type InvestigationAssessment = {
  fingerprint: string;
  disposition: "agenda" | "watchlist" | "investigate" | "drop";
  reasonCode: "agenda" | "needs_evidence" | "monitor" | "duplicate" | "resolved" | "contradicted" | "not_material";
  reason: string;
};

export type CompanyReadDraft = WarRoomCompanyRead;

export type AgendaProposalDraft = {
  sourceInvestigationFingerprint: string;
  fingerprint: string;
  actionKind: WarRoomActionKind;
  domain: WarRoomDomain;
  title: string;
  finding: string;
  whyNow: string;
  proposedSolution: string;
  decisionRequired: string;
  whyBetterThanAlternatives: string;
  cheapestFalsification: string;
  existingCapabilities: string[];
  executionPlan: Array<{ label: string; detail: string }>;
  evidenceIds: string[];
  capabilityEvidenceIds: string[];
  counterEvidence: string;
  successMeasure: string;
  risk: string;
  rollbackPlan: string;
  confidence: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
  urgency: "now" | "soon" | "monitor";
  strategicFit: "central" | "adjacent" | "peripheral";
  reversibility: "high" | "medium" | "low";
  founderAttentionMinutes: number;
  evaluationWindowDays: number;
  adminHref: string | null;
};

function uniqueValid(ids: string[], validIds: Set<string>) {
  return [...new Set(ids.filter((id) => validIds.has(id)))];
}

function sourceFamily(evidence: WarRoomProposalEvidence) {
  const [family] = evidence.source.split(":");
  if (["Olera product data", "Olera period comparison", "Deterministic anomaly check", "Olera provider-contactability cohort"].includes(family)) return "olera-product-data";
  if (family.startsWith("Canonical ")) return "acquisition-analytics";
  if (["Care-seeker question", "Care inquiry", "Support email"].includes(family)) return "customer-voice";
  return family;
}

export function validateInvestigations(
  drafts: InvestigationDraft[],
  evidenceCatalog: WarRoomProposalEvidence[],
) {
  const validIds = new Set(evidenceCatalog.map((item) => item.id));
  const seen = new Set<string>();
  return drafts.filter((draft) => {
    if (!/^[a-z0-9][a-z0-9-]{4,99}$/.test(draft.fingerprint) || seen.has(draft.fingerprint)) return false;
    if (!WAR_ROOM_DOMAINS.includes(draft.domain)) return false;
    draft.evidenceIds = uniqueValid(draft.evidenceIds, validIds);
    draft.capabilityEvidenceIds = uniqueValid(draft.capabilityEvidenceIds, validIds)
      .filter((id) => id.startsWith("capability:"));
    draft.options = draft.options.filter((option) =>
      WAR_ROOM_ACTION_KINDS.includes(option.actionKind)
      && cleanExecutiveText(option.title).length >= 8
      && cleanExecutiveText(option.logic).length >= 20
      && cleanExecutiveText(option.downside).length >= 8,
    );
    const distinctOptions = new Set(draft.options.map((option) =>
      `${option.actionKind}:${cleanExecutiveText(option.title).toLowerCase()}`,
    ));
    if (draft.evidenceIds.length < 2) return false;
    draft.founderAttentionMinutes = Math.max(0, Math.min(240, Math.round(draft.founderAttentionMinutes)));
    // Weak alternatives mean the case is not decision-ready. They do not make
    // the observed company condition disappear. Preserve it as private work so
    // the next scan can improve the diagnosis and intervention set.
    if (distinctOptions.size < 2 && draft.readiness === "decision_ready") {
      draft.readiness = "investigating";
      draft.readinessReason = "The condition is supported, but the intervention set is not yet strong enough for a founder decision.";
    }
    if (draft.causeConfidence === "low" && draft.readiness === "decision_ready") {
      draft.readiness = "investigating";
      draft.readinessReason = "The likely cause is still a hypothesis, so this remains a private investigation.";
    }
    if (draft.impact !== "high" && draft.readiness === "decision_ready") {
      draft.readiness = "watchlist";
      draft.readinessReason = "The issue may be real, but it is not material enough to interrupt the founder.";
    }
    seen.add(draft.fingerprint);
    return true;
  }).slice(0, 8);
}

const PROVEN_DROP_REASONS = new Set<InvestigationAssessment["reasonCode"]>([
  "duplicate",
  "resolved",
  "contradicted",
]);

/**
 * The council may control founder attention, but it cannot erase unresolved
 * company reality. Missing evidence is a reason to investigate, not to drop.
 */
export function normalizeInvestigationAssessments(
  investigations: InvestigationDraft[],
  assessments: InvestigationAssessment[],
  acceptedAgendaFingerprints?: Set<string>,
) {
  const supplied = new Map(assessments.map((assessment) => [assessment.fingerprint, assessment]));
  return investigations.map((investigation): InvestigationAssessment => {
    const fallbackDisposition = investigation.readiness === "watchlist" ? "watchlist" : "investigate";
    const fallback: InvestigationAssessment = {
      fingerprint: investigation.fingerprint,
      disposition: fallbackDisposition,
      reasonCode: fallbackDisposition === "watchlist" ? "monitor" : "needs_evidence",
      reason: cleanExecutiveText(investigation.readinessReason)
        || "The case remains unresolved and needs more evidence before it can reach the founder.",
    };
    const candidate = supplied.get(investigation.fingerprint) ?? fallback;
    const reason = cleanExecutiveText(candidate.reason) || fallback.reason;

    const isMaterialStructuralCase = investigation.impact === "high" && investigation.strategicFit === "central";
    if (
      candidate.disposition === "drop"
      && isMaterialStructuralCase
      && !PROVEN_DROP_REASONS.has(candidate.reasonCode)
    ) {
      return {
        fingerprint: investigation.fingerprint,
        disposition: investigation.readiness === "watchlist" ? "watchlist" : "investigate",
        reasonCode: investigation.readiness === "watchlist" ? "monitor" : "needs_evidence",
        reason: `The council did not prove this material condition was resolved, contradicted, or duplicated. ${reason}`.trim(),
      };
    }

    if (
      candidate.disposition === "agenda"
      && acceptedAgendaFingerprints
      && !acceptedAgendaFingerprints.has(investigation.fingerprint)
    ) {
      return {
        fingerprint: investigation.fingerprint,
        disposition: "investigate",
        reasonCode: "needs_evidence",
        reason: "The founder-interruption gate did not clear. Keep investigating the case instead of pretending it vanished.",
      };
    }

    return { ...candidate, reason };
  });
}

export function normalizeCompanyRead(
  draft: CompanyReadDraft | undefined,
  investigations: InvestigationDraft[],
  assessments: InvestigationAssessment[],
  evidenceCatalog: WarRoomProposalEvidence[],
): WarRoomCompanyRead {
  const validEvidenceIds = new Set(evidenceCatalog.map((item) => item.id));
  const activeAssessments = assessments.filter((assessment) => assessment.disposition !== "drop");
  const activeFingerprints = new Set(activeAssessments.map((assessment) => assessment.fingerprint));
  const investigationByFingerprint = new Map(investigations.map((investigation) => [investigation.fingerprint, investigation]));
  const linked = [...new Set((draft?.investigationFingerprints ?? [])
    .filter((fingerprint) => activeFingerprints.has(fingerprint)))];
  for (const assessment of activeAssessments) {
    if (!linked.includes(assessment.fingerprint)) linked.push(assessment.fingerprint);
  }
  const linkedEvidenceIds = linked.flatMap((fingerprint) =>
    investigationByFingerprint.get(fingerprint)?.evidenceIds ?? [],
  );

  if (!investigations.length) {
    return {
      summary: "No founder decision is supported today, and this scan did not form a sufficiently evidenced private investigation. That is an evidence limitation, not proof that Olera has no important work.",
      stance: "stable",
      investigationFingerprints: [],
      evidenceIds: [],
      unresolvedQuestions: [],
    };
  }

  const hasAgenda = activeAssessments.some((assessment) => assessment.disposition === "agenda");
  const hasInvestigation = activeAssessments.some((assessment) => assessment.disposition === "investigate");
  const stance: WarRoomCompanyRead["stance"] = hasAgenda
    ? "decision_required"
    : hasInvestigation
      ? "investigating"
      : activeAssessments.length
        ? "monitoring"
        : "stable";
  const suppliedSummary = cleanExecutiveText(draft?.summary ?? "");
  const boundedSummary = suppliedSummary
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !(
      activeAssessments.length
      && /\b(?:nothing (?:here )?(?:has|is|was|moved|changed|worth)|hold founder attention|no (?:important )?(?:action|work|issue|risk))\b/i.test(sentence)
    ))
    .join(" ");
  const stanceLead = stance === "decision_required"
    ? "A founder decision is ready."
    : stance === "investigating"
      ? `No founder decision is ready today. War Room is actively investigating ${activeAssessments.length} unresolved case${activeAssessments.length === 1 ? "" : "s"}.`
      : stance === "monitoring"
        ? `No founder decision is needed today. War Room is monitoring ${activeAssessments.length} unresolved case${activeAssessments.length === 1 ? "" : "s"}.`
        : "No founder decision is supported today.";

  return {
    summary: `${stanceLead} ${boundedSummary || (!activeAssessments.length
      ? "The cases in this scan were resolved, contradicted, duplicated, or not material."
      : "The unresolved cases remain visible below.")}`.trim(),
    stance,
    investigationFingerprints: linked.slice(0, 8),
    evidenceIds: [...new Set([...(draft?.evidenceIds ?? []), ...linkedEvidenceIds]
      .filter((id) => validEvidenceIds.has(id)))].slice(0, 10),
    unresolvedQuestions: (draft?.unresolvedQuestions ?? []).map(cleanExecutiveText).filter(Boolean).slice(0, 5),
  };
}

function containsUnfinishedInvestigation(proposal: AgendaProposalDraft) {
  const text = [
    proposal.title,
    proposal.finding,
    proposal.proposedSolution,
    proposal.decisionRequired,
    proposal.whyBetterThanAlternatives,
    proposal.cheapestFalsification,
    ...proposal.executionPlan.flatMap((step) => [step.label, step.detail]),
  ].join(" ");
  return /\b(if none|if no|only if|whether .* exists|audit|inspect|locate|determine whether|find out whether|check whether)\b/i.test(text);
}

/**
 * Founder interruption is an all-gates decision. The numeric score is retained
 * for stable ordering and legacy storage, but it can never rescue a failed gate.
 */
export function applyAgendaGate(
  proposals: AgendaProposalDraft[],
  investigations: InvestigationDraft[],
  evidenceCatalog: WarRoomProposalEvidence[],
) {
  const evidenceById = new Map(evidenceCatalog.map((item) => [item.id, item]));
  const validIds = new Set(evidenceById.keys());
  const investigationByFingerprint = new Map(investigations.map((item) => [item.fingerprint, item]));

  return proposals.flatMap((proposal) => {
    const investigation = investigationByFingerprint.get(proposal.sourceInvestigationFingerprint);
    proposal.evidenceIds = uniqueValid(proposal.evidenceIds, validIds);
    proposal.capabilityEvidenceIds = uniqueValid(proposal.capabilityEvidenceIds, validIds)
      .filter((id) => id.startsWith("capability:"));
    proposal.founderAttentionMinutes = Math.max(0, Math.min(240, Math.round(proposal.founderAttentionMinutes)));
    proposal.evaluationWindowDays = Math.max(1, Math.min(180, Math.round(proposal.evaluationWindowDays)));
    const cleanedExistingCapabilities = proposal.existingCapabilities.map(cleanExecutiveText).filter(Boolean);
    const cleanedWhyBetter = cleanExecutiveText(proposal.whyBetterThanAlternatives);
    const cleanedSuccessMeasure = cleanExecutiveText(proposal.successMeasure);
    const cleanedExecutionPlan = proposal.executionPlan.map((step) => ({
      label: cleanExecutiveText(step.label),
      detail: cleanExecutiveText(step.detail),
    })).filter((step) => step.label.length >= 3 && step.detail.length >= 12);
    // Capability rows prove that Olera already has a system. They do not prove
    // that the diagnosed company problem exists, so they cannot supply an
    // "independent source" or satisfy the diagnosis-evidence minimum.
    const diagnosisEvidenceIds = proposal.evidenceIds.filter((id) =>
      !id.startsWith("capability:")
      && !id.startsWith("source:")
      && !id.startsWith("decision:"),
    );
    const evidenceFamilies = new Set(diagnosisEvidenceIds
      .map((id) => evidenceById.get(id))
      .filter((item): item is WarRoomProposalEvidence => Boolean(item))
      .map(sourceFamily));
    const investigationEvidenceIds = new Set(investigation?.evidenceIds ?? []);
    const sharedDiagnosisEvidence = diagnosisEvidenceIds.filter((id) => investigationEvidenceIds.has(id));
    const gate = {
      material: proposal.impact === "high"
        && proposal.strategicFit === "central"
        && investigation?.impact === "high"
        && investigation.strategicFit === "central"
        && proposal.domain === investigation.domain,
      causeSupported: investigation != null
        && investigation.readiness === "decision_ready"
        && investigation.causeConfidence !== "low"
        && proposal.confidence !== "low"
        && diagnosisEvidenceIds.length >= 3
        && sharedDiagnosisEvidence.length >= 2
        && evidenceFamilies.size >= 2,
      existingStateVerified: cleanedExistingCapabilities.some((item) => item.length >= 20)
        && (proposal.actionKind !== "code" || proposal.capabilityEvidenceIds.length > 0),
      beatsAlternatives: investigation?.options.length ? investigation.options.length >= 2 && cleanedWhyBetter.length >= 40 : false,
      measurable: cleanedSuccessMeasure.length >= 30 && proposal.evaluationWindowDays > 0,
    };
    if (
      !Object.values(gate).every(Boolean)
      || containsUnfinishedInvestigation(proposal)
      || cleanedExecutionPlan.length < 2
      || proposal.founderAttentionMinutes > 30
      || !WAR_ROOM_ACTION_KINDS.includes(proposal.actionKind)
    ) return [];

    const priorityScore = Math.min(100,
      30
      + (proposal.confidence === "high" ? 25 : 15)
      + (proposal.urgency === "now" ? 20 : proposal.urgency === "soon" ? 10 : 0)
      + 20
      + (proposal.reversibility === "high" ? 5 : proposal.reversibility === "medium" ? 3 : 0)
      - (proposal.founderAttentionMinutes > 15 ? 5 : 0));
    return [{
      ...proposal,
      title: cleanExecutiveText(proposal.title),
      finding: cleanExecutiveText(proposal.finding),
      whyNow: cleanExecutiveText(proposal.whyNow),
      proposedSolution: cleanExecutiveText(proposal.proposedSolution),
      decisionRequired: cleanExecutiveText(proposal.decisionRequired),
      whyBetterThanAlternatives: cleanedWhyBetter,
      cheapestFalsification: cleanExecutiveText(proposal.cheapestFalsification),
      existingCapabilities: cleanedExistingCapabilities,
      executionPlan: cleanedExecutionPlan,
      counterEvidence: cleanExecutiveText(proposal.counterEvidence),
      successMeasure: cleanedSuccessMeasure,
      risk: cleanExecutiveText(proposal.risk),
      rollbackPlan: cleanExecutiveText(proposal.rollbackPlan),
      agendaGate: gate,
      priorityScore,
    }];
  }).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 1);
}
