import type { WarRoomCompanyRead, WarRoomProposalEvidence } from "@/lib/war-room/types";
import {
  applyAgendaGate,
  normalizeCompanyRead,
  normalizeInvestigationAssessments,
  requireCompleteStrategicLensCoverage,
  retainStrategicLensInvestigations,
  validateInvestigations,
  type AgendaProposalDraft,
  type CompanyReadDraft,
  type InvestigationAssessment,
  type InvestigationDraft,
  type StrategicLensReview,
} from "@/lib/war-room/strategy";

export type WarRoomInvestigatorOutput = {
  dossiers: InvestigationDraft[];
  lensReviews: StrategicLensReview[];
  portfolioRead: string;
};

export type WarRoomCouncilOutput = {
  challenge: string;
  companyRead: CompanyReadDraft;
  rejectedReasons: string[];
  assessments: InvestigationAssessment[];
  proposals: AgendaProposalDraft[];
};

export type WarRoomReasoningResult = {
  detailedInvestigations: InvestigationDraft[];
  investigations: InvestigationDraft[];
  assessments: InvestigationAssessment[];
  proposals: ReturnType<typeof applyAgendaGate>;
  companyRead: WarRoomCompanyRead;
  validationTrace: {
    submittedDossiers: number;
    validDossiers: number;
    lensReviews: number;
    retainedInvestigations: number;
    requestedAgendaItems: number;
    acceptedAgendaItems: number;
  };
};

/**
 * Run model output through the exact deterministic contract used in production.
 * Keeping this boundary pure makes failed scans replayable without another API
 * call or any write to Olera's live data.
 */
export function evaluateWarRoomReasoning(input: {
  evidenceCatalog: WarRoomProposalEvidence[];
  investigator: WarRoomInvestigatorOutput;
  council: WarRoomCouncilOutput;
}): WarRoomReasoningResult {
  const { evidenceCatalog, investigator, council } = input;
  const lensReviews = requireCompleteStrategicLensCoverage(investigator.lensReviews ?? []);
  const detailedInvestigations = validateInvestigations(investigator.dossiers ?? [], evidenceCatalog);
  const investigations = retainStrategicLensInvestigations(
    detailedInvestigations,
    lensReviews,
    evidenceCatalog,
  );
  const initialAssessments = normalizeInvestigationAssessments(
    investigations,
    council.assessments ?? [],
  );
  const requestedAgendaFingerprints = new Set(initialAssessments
    .filter((assessment) => assessment.disposition === "agenda")
    .map((assessment) => assessment.fingerprint));
  const proposals = applyAgendaGate(
    (council.proposals ?? []).filter((proposal) =>
      requestedAgendaFingerprints.has(proposal.sourceInvestigationFingerprint)),
    investigations,
    evidenceCatalog,
  ).map((proposal) => ({
    ...proposal,
    adminHref: proposal.adminHref?.startsWith("/admin/") ? proposal.adminHref : null,
  }));
  const acceptedAgendaFingerprints = new Set(
    proposals.map((proposal) => proposal.sourceInvestigationFingerprint),
  );
  const assessments = normalizeInvestigationAssessments(
    investigations,
    initialAssessments,
    acceptedAgendaFingerprints,
  );
  const companyRead = normalizeCompanyRead(
    council.companyRead,
    investigations,
    assessments,
    evidenceCatalog,
    { complete: true, allClear: lensReviews.every((review) => review.status === "clear") },
  );

  return {
    detailedInvestigations,
    investigations,
    assessments,
    proposals,
    companyRead,
    validationTrace: {
      submittedDossiers: investigator.dossiers?.length ?? 0,
      validDossiers: detailedInvestigations.length,
      lensReviews: lensReviews.length,
      retainedInvestigations: investigations.length,
      requestedAgendaItems: council.proposals?.length ?? 0,
      acceptedAgendaItems: proposals.length,
    },
  };
}
