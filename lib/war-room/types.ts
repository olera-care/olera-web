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
  action_kind: "code" | "operations" | "research";
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
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface WarRoomIntegrationStatus {
  key: "slack" | "notion" | "executor";
  label: string;
  status: "live" | "stale" | "missing";
  detail: string;
  updatedAt: string | null;
}

export interface WarRoomSupervisorPayload {
  generatedAt: string;
  proposals: WarRoomProposal[];
  latestDiscovery: WarRoomDiscoveryRun | null;
  integrations: WarRoomIntegrationStatus[];
  counts: {
    waiting: number;
    working: number;
    reviewReady: number;
    measuring: number;
  };
}
