/**
 * Provider Outreach Module
 *
 * Cold outreach system for unclaimed providers.
 * Helps providers claim their profiles on Olera.
 */

// Templates
export {
  type EmailDraft,
  type TemplateContext,
  type ProviderOutreachTemplateKey,
  getTemplate,
  substituteVars,
  buildVars,
} from "./templates";

// Cadence
export {
  type CadenceStep,
  PROVIDER_OUTREACH_CADENCE,
  DAYS_AFTER_FINAL_TO_NEEDS_CALL,
  getCadenceDays,
  getCadenceStepByDay,
  getTemplateKeyForDay,
  getNextCadenceStep,
  isFinalCadenceStep,
  calculateDueDate,
  calculateNeedsCallDate,
  generateTaskSchedule,
} from "./cadence";

// Email utilities
export {
  type RenderedEmail,
  type ProviderGapData,
  bodyToHtml,
  renderEmail,
  previewEmail,
  buildContextFromProvider,
  validateProviderForOutreach,
  getProviderGaps,
  formatGapList,
  // City demand metrics
  getCityViews,
  getCityViewsBatch,
  // Email sending configuration
  PROVIDER_OUTREACH_EMAIL_TYPE,
  PROVIDER_OUTREACH_FROM,
  PROVIDER_OUTREACH_REPLY_TO,
} from "./email-utils";

// Auto-send executor (used by cron job)
export {
  type ExecuteResult,
  executeProviderOutreachTask,
} from "./auto-send-executor";

// Admin colors for name chips
export {
  type ChipColor,
  CHIP_COLORS,
  UNASSIGNED_CHIP_COLOR,
  getAdminColor,
  getAdminColorClasses,
} from "./admin-colors";

// Constants (shared between frontend and backend)
export {
  NOT_INTERESTED_REASONS,
  NOT_INTERESTED_REASON_VALUES,
  type NotInterestedReason,
} from "./constants";

// SmartLead bridge (provider outreach via SmartLead instead of Resend)
export {
  type ProviderBridgeRow,
  type ProviderSkipReason,
  type ProviderSelectionResult,
  type ProviderSmartleadData,
  type LaunchProviderCampaignInput,
  type LaunchProviderCampaignReport,
  type EnrollProviderInput,
  type EnrollProviderResult,
  type ProviderSmartleadPreview,
  selectEligibleProviders,
  providerToLead,
  providersToLeads,
  buildProviderEmailSequence,
  launchProviderCampaign,
  enrollProviderIntoCampaign,
  buildProviderSmartleadPreview,
  generateCampaignName,
  resolveProviderMailboxPool,
} from "./smartlead-bridge";
