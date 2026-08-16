import { getStepMetadata } from "workflow";
import type {
  WarRoomCouncilCheckpoint,
  WarRoomInvestigatorCheckpoint,
  WarRoomLensSweepCheckpoint,
  WarRoomPreparedDiscovery,
  WarRoomTriageCheckpoint,
} from "@/lib/war-room/discovery.server";

async function prepareDiscoveryStep(runId: string): Promise<WarRoomPreparedDiscovery> {
  "use step";
  const { attempt } = getStepMetadata();
  const { prepareWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return prepareWarRoomDiscovery(runId, attempt);
}
prepareDiscoveryStep.maxRetries = 2;

// The provider cannot compile one strict schema covering all ten lenses, so the
// sweep is two concurrent calls inside a single durable step. Both must land
// before the step is considered complete.
async function sweepLensesStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
): Promise<WarRoomLensSweepCheckpoint> {
  "use step";
  const { attempt } = getStepMetadata();
  const { sweepWarRoomLenses } = await import("@/lib/war-room/discovery.server");
  return sweepWarRoomLenses(runId, prepared, attempt);
}
sweepLensesStep.maxRetries = 1;

async function investigateCompanyStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
  sweep: WarRoomLensSweepCheckpoint,
): Promise<WarRoomInvestigatorCheckpoint> {
  "use step";
  const { attempt } = getStepMetadata();
  const { investigateWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return investigateWarRoomDiscovery(runId, prepared, sweep, attempt);
}
// Opus calls are expensive. One durable retry handles a transient timeout
// without multiplying the bill or repeating every earlier stage.
investigateCompanyStep.maxRetries = 1;

async function triageAgendaStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
  investigator: WarRoomInvestigatorCheckpoint,
): Promise<WarRoomTriageCheckpoint> {
  "use step";
  const { attempt } = getStepMetadata();
  const { triageWarRoomAgenda } = await import("@/lib/war-room/discovery.server");
  return triageWarRoomAgenda(runId, prepared, investigator, attempt);
}
triageAgendaStep.maxRetries = 1;

// Drafting only spends a model call when triage actually nominated a decision,
// which is the rare case. Zero founder decisions costs nothing here.
async function challengeCompanyStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
  investigator: WarRoomInvestigatorCheckpoint,
  triage: WarRoomTriageCheckpoint,
): Promise<WarRoomCouncilCheckpoint> {
  "use step";
  const { attempt } = getStepMetadata();
  const { challengeWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return challengeWarRoomDiscovery(runId, prepared, investigator, triage, attempt);
}
challengeCompanyStep.maxRetries = 1;

async function persistDiscoveryStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
  investigator: WarRoomInvestigatorCheckpoint,
  council: WarRoomCouncilCheckpoint,
) {
  "use step";
  const { attempt } = getStepMetadata();
  const { persistWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return persistWarRoomDiscovery(runId, prepared, investigator, council, attempt);
}
persistDiscoveryStep.maxRetries = 2;

// Runs after persistence, against the conditions this scan just saved. Probe
// answers land in the event trail and become evidence for the next scan, which
// is how a condition's cause confidence can rise instead of resetting daily.
// A probe failure must never fail a scan that already produced a company read.
async function runProbesStep(runId: string) {
  "use step";
  const { runWarRoomInvestigationProbes } = await import("@/lib/war-room/discovery.server");
  try {
    return await runWarRoomInvestigationProbes(runId);
  } catch (error) {
    return { executed: [], failed: [{ probeId: "all", reason: error instanceof Error ? error.message : String(error) }] };
  }
}
runProbesStep.maxRetries = 1;

async function recordDiscoveryFailureStep(runId: string, message: string) {
  "use step";
  const { failWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  await failWarRoomDiscovery(runId, message);
}
recordDiscoveryFailureStep.maxRetries = 3;

export async function warRoomDiscoveryWorkflow(runId: string) {
  "use workflow";

  try {
    const prepared = await prepareDiscoveryStep(runId);
    const sweep = await sweepLensesStep(runId, prepared);
    const investigator = await investigateCompanyStep(runId, prepared, sweep);
    const triage = await triageAgendaStep(runId, prepared, investigator);
    const council = await challengeCompanyStep(runId, prepared, investigator, triage);
    const persisted = await persistDiscoveryStep(runId, prepared, investigator, council);
    const probes = await runProbesStep(runId);
    return { ...persisted, probes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordDiscoveryFailureStep(runId, message || "Unknown durable discovery failure");
    throw error;
  }
}
