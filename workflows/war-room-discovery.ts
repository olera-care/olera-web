import { getStepMetadata } from "workflow";
import type {
  WarRoomCouncilCheckpoint,
  WarRoomInvestigatorCheckpoint,
  WarRoomPreparedDiscovery,
} from "@/lib/war-room/discovery.server";

async function prepareDiscoveryStep(runId: string): Promise<WarRoomPreparedDiscovery> {
  "use step";
  const { attempt } = getStepMetadata();
  const { prepareWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return prepareWarRoomDiscovery(runId, attempt);
}
prepareDiscoveryStep.maxRetries = 2;

async function investigateCompanyStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
): Promise<WarRoomInvestigatorCheckpoint> {
  "use step";
  const { attempt } = getStepMetadata();
  const { investigateWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return investigateWarRoomDiscovery(runId, prepared, attempt);
}
// Opus calls are expensive. One durable retry handles a transient timeout
// without multiplying the bill or repeating every earlier stage.
investigateCompanyStep.maxRetries = 1;

async function challengeCompanyStep(
  runId: string,
  prepared: WarRoomPreparedDiscovery,
  investigator: WarRoomInvestigatorCheckpoint,
): Promise<WarRoomCouncilCheckpoint> {
  "use step";
  const { attempt } = getStepMetadata();
  const { challengeWarRoomDiscovery } = await import("@/lib/war-room/discovery.server");
  return challengeWarRoomDiscovery(runId, prepared, investigator, attempt);
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
    const investigator = await investigateCompanyStep(runId, prepared);
    const council = await challengeCompanyStep(runId, prepared, investigator);
    return await persistDiscoveryStep(runId, prepared, investigator, council);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await recordDiscoveryFailureStep(runId, message || "Unknown durable discovery failure");
    throw error;
  }
}
