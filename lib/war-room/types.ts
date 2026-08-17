export type WarRoomTone = "good" | "warning" | "critical" | "neutral";

export interface WarRoomSource {
  key: string;
  label: string;
  status: "live" | "stale" | "missing";
  detail: string;
  updatedAt: string | null;
  href?: string;
}

export interface WarRoomMetric {
  key: string;
  label: string;
  value: number | null;
  display: string;
  detail: string;
  tone: WarRoomTone;
  href: string;
}

export interface WarRoomSignal {
  id: string;
  title: string;
  detail: string;
  severity: "watch" | "urgent";
  href: string;
}

export interface WarRoomComparison {
  id: string;
  label: string;
  current: number;
  prior: number;
  changePct: number | null;
  detail: string;
  href: string;
}

export interface WarRoomGrowthWeek {
  weekStart: string;
  weekEnd: string;
  sessions: number;
  totalUsers: number;
  pageViews: number;
  searchClicks: number | null;
  searchImpressions: number | null;
  inquiries: number;
  questions: number;
  benefitsCompleted: number;
  anomalies: string[];
  channels: Record<string, number>;
  organicLandingPages: Array<{ path: string; users: number; sessions: number }>;
  searchTopPages: Array<{ label: string; clicks: number; impressions: number; ctr: number; position: number }>;
  brandedSearchShare: number | null;
}

export interface WarRoomAction {
  label: string;
  detail: string;
  href: string;
}

export interface WarRoomRecommendation {
  key: string;
  eyebrow: string;
  title: string;
  verdict: string;
  move: string;
  kill: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  href: string;
  actions: WarRoomAction[];
}

export interface WarRoomDecision {
  id: string;
  recommendation_key: string;
  recommendation_title: string;
  decision: "backed" | "rejected" | "completed";
  note: string | null;
  decided_by: string;
  created_at: string;
}

export interface WarRoomCitation {
  id: string;
  label: string;
  detail: string;
  href?: string;
  source: string;
}

export interface WarRoomAiRecommendation {
  eyebrow: string;
  title: string;
  verdict: string;
  move: string;
  kill: string;
  confidence: "high" | "medium" | "low";
  evidenceIds: string[];
  counterEvidence: string;
  whatWouldChangeOurMind: string;
  href: string;
  /** Optional for backwards compatibility with briefings saved before actions existed. */
  actions?: WarRoomAction[];
}

export interface WarRoomBriefing {
  recommendation: WarRoomAiRecommendation;
  observations: Array<{
    title: string;
    detail: string;
    evidenceIds: string[];
  }>;
  questionsToResolve: string[];
  critic: {
    challenge: string;
    correction: string;
    unresolvedRisk: string;
  };
}

export interface WarRoomRun {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  window_days: number;
  model: string;
  briefing: WarRoomBriefing | null;
  citations: WarRoomCitation[];
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface WarRoomSnapshot {
  generatedAt: string;
  windowDays: number;
  recommendation: WarRoomRecommendation;
  metrics: WarRoomMetric[];
  comparisons: WarRoomComparison[];
  growth: {
    latest: WarRoomGrowthWeek | null;
    prior: WarRoomGrowthWeek | null;
  };
  providerQuestionHealth: {
    submitted: number;
    answered: number;
    intentionallyExcluded: number;
    needsEmail: number;
    deadEmail: number;
    reachableEligible: number;
    reachableAnswered: number;
  };
  signals: WarRoomSignal[];
  customerVoice: Array<{
    id: string;
    title: string;
    summary: string;
    category: string;
    priority: string;
    at: string;
    href: string;
  }>;
  sources: WarRoomSource[];
  decisions: WarRoomDecision[];
  latestRun: WarRoomRun | null;
}

export type WarRoomProposalStatus =
  | "proposed"
  | "approved"
  | "dispatching"
  | "executing"
  | "review_ready"
  | "rejected"
  | "completed"
  | "failed"
  | "superseded";

export type WarRoomDomain =
  | "company"
  | "customer"
  | "provider"
  | "growth"
  | "revenue"
  | "product"
  | "content"
  | "operations"
  | "market"
  | "data";

export type WarRoomActionKind =
  | "code"
  | "research"
  | "operations"
  | "business_development"
  | "content"
  | "decision";

export interface WarRoomCompanyModel {
  key: string;
  purpose: string;
  stage: string;
  north_star: string;
  current_priorities: string[];
  strategic_bets: string[];
  constraints: string[];
  guardrails: string[];
  strategic_questions: string[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarRoomInvestigationOption {
  actionKind: WarRoomActionKind;
  title: string;
  logic: string;
  downside: string;
}

export interface WarRoomInvestigationProbe {
  kind: "analysis" | "query" | "repository" | "source_search" | "external_research";
  question: string;
  method: string;
  expectedInformationGain: string;
}

export interface WarRoomInvestigation {
  id: string;
  discovery_run_id: string | null;
  proposal_id: string | null;
  fingerprint: string;
  status: "investigating" | "watchlist" | "decision_ready" | "resolved" | "invalidated" | "paused" | "closed" | "superseded";
  domain: WarRoomDomain;
  title: string;
  situation: string;
  why_it_matters: string;
  likely_cause: string;
  cause_confidence: "high" | "medium" | "low";
  existing_capabilities: string[];
  unknowns: string[];
  hypotheses: string[];
  next_probe: WarRoomInvestigationProbe | null;
  resolution_criteria: string[];
  resolution_evidence: WarRoomProposalEvidence[];
  progress_summary: string;
  last_progress_at: string | null;
  evidence_hash: string | null;
  options: WarRoomInvestigationOption[];
  evidence: WarRoomProposalEvidence[];
  counter_evidence: string;
  readiness_reason: string;
  impact: "high" | "medium" | "low";
  urgency: "now" | "soon" | "monitor";
  strategic_fit: "central" | "adjacent" | "peripheral";
  founder_attention_minutes: number;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface WarRoomStrategicCase {
  diagnosisConfidence?: "high" | "medium" | "low";
  urgency?: "now" | "soon" | "monitor";
  strategicFit?: "central" | "adjacent" | "peripheral";
  reversibility?: "high" | "medium" | "low";
  founderAttentionMinutes?: number;
  evaluationWindowDays?: number;
  agendaGate?: {
    material: boolean;
    causeSupported: boolean;
    existingStateVerified: boolean;
    beatsAlternatives: boolean;
    measurable: boolean;
  };
}

export interface WarRoomProposalEvidence {
  id: string;
  label: string;
  detail: string;
  source: string;
  href?: string;
  occurredAt?: string;
  freshness?: "current" | "aging" | "stale";
}

export interface WarRoomProposal {
  id: string;
  discovery_run_id: string | null;
  fingerprint: string;
  status: WarRoomProposalStatus;
  action_kind: WarRoomActionKind;
  domain: WarRoomDomain;
  title: string;
  finding: string;
  why_now: string;
  proposed_solution: string;
  execution_plan: Array<{ label: string; detail: string }>;
  evidence: WarRoomProposalEvidence[];
  counter_evidence: string;
  success_measure: string;
  risk: string;
  rollback_plan: string;
  decision_required: string | null;
  why_better_than_alternatives: string | null;
  cheapest_falsification: string | null;
  existing_capabilities: string[];
  strategic_case: WarRoomStrategicCase;
  confidence: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
  priority_score: number;
  admin_href: string | null;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_note: string | null;
  execution_branch: string | null;
  execution_url: string | null;
  execution_error: string | null;
  execution_started_at: string | null;
  execution_completed_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
  measurement_due_at: string | null;
  outcome_status: "pending" | "validated" | "missed" | "inconclusive" | null;
  outcome_note: string | null;
  outcome_evidence: WarRoomProposalEvidence[];
  measured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarRoomDiscoveryRun {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  trigger: "scheduled" | "manual";
  requested_by: string;
  model: string;
  source_summary: Record<string, unknown>;
  candidate_count: number;
  proposal_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  fact_pack_hash: string | null;
  prompt_version: string | null;
  raw_investigator_output: Record<string, unknown> | null;
  raw_council_output: Record<string, unknown> | null;
  validation_trace: Record<string, unknown>;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface WarRoomIntegrationStatus {
  key: "slack" | "notion" | "repository" | "economics" | "market" | "executor";
  label: string;
  status: "live" | "stale" | "missing";
  detail: string;
  updatedAt: string | null;
}

export interface WarRoomCompanyRead {
  summary: string;
  stance: "decision_required" | "investigating" | "monitoring" | "stable";
  investigationFingerprints: string[];
  evidenceIds: string[];
  unresolvedQuestions: string[];
}

/**
 * One answered probe, ready to read.
 *
 * A probe answer is the most useful thing a scan produces, and until now it
 * only existed inside an investigation's event trail. This is the same answer
 * addressed to the founder instead of to the reasoning loop.
 */
export interface WarRoomProbeReading {
  probeId: string;
  label: string;
  question: string;
  headline: string;
  detail: string;
  rows: Array<Record<string, string | number>>;
  caveat: string | null;
  measuredAt: string;
}

/** What the last scan cost, priced from the run's recorded token counts. */
export interface WarRoomScanCost {
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Null when the model has no published price in the table. */
  usd: number | null;
}

export interface WarRoomSupervisorPayload {
  generatedAt: string;
  proposals: WarRoomProposal[];
  investigations: WarRoomInvestigation[];
  /** The read-only probe answers from the most recent scans. */
  briefing: WarRoomProbeReading[];
  scanCost: WarRoomScanCost | null;
  companyModel: WarRoomCompanyModel | null;
  companyRead: WarRoomCompanyRead | null;
  /** Legacy summary retained while older discovery runs remain visible. */
  companyVerdict: string | null;
  latestDiscovery: WarRoomDiscoveryRun | null;
  integrations: WarRoomIntegrationStatus[];
  counts: {
    waiting: number;
    working: number;
    reviewReady: number;
    measuring: number;
    investigating: number;
    watchlist: number;
  };
}
