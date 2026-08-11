export const GROWTH_DEFINITION_VERSION = 2;
export const GROWTH_TIMEZONE = "America/Chicago";
export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "357593677";
export const GSC_SITE_URL = process.env.GSC_SITE_URL || "https://olera.care/";

export const GROWTH_CHANNELS = [
  "Organic Search",
  "Direct",
  "Paid Social",
  "Organic Social",
  "Display",
  "Referral",
  "Paid Other",
] as const;

export interface GrowthGa4Metrics {
  overview: {
    total_users: number;
    new_users: number;
    sessions: number;
    average_session_duration_seconds: number;
    engagement_rate: number;
    page_views: number;
  };
  channels: Record<string, number>;
  organic: {
    sources: Array<{
      source_medium: string;
      users: number;
      sessions: number;
    }>;
    landing_pages: Array<{
      path: string;
      users: number;
      sessions: number;
    }>;
  };
}

export interface GrowthSearchRow {
  label: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GrowthGscMetrics {
  performance: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
  top_queries: GrowthSearchRow[];
  top_pages: GrowthSearchRow[];
  query_mix: {
    branded_clicks: number;
    non_branded_clicks: number;
    branded_impressions: number;
    non_branded_impressions: number;
    classified_click_coverage: number | null;
  };
  data_state: "final";
}

export interface GrowthMarketplaceMetrics {
  inquiries: number;
  questions_asked: number;
  benefits_completed: number;
  providers_answering_questions: number;
  organic_users_to_inquiry_rate_directional: number | null;
}

export interface GrowthSnapshot {
  week_start: string;
  week_end: string;
  reporting_timezone: string;
  source: "google_supabase" | "airtable_legacy";
  definition_version: number;
  ga4: GrowthGa4Metrics;
  gsc: GrowthGscMetrics | null;
  marketplace: GrowthMarketplaceMetrics;
  source_status: {
    ga4: "available";
    gsc: "available" | "skipped";
    supabase: "available";
  };
  anomalies: GrowthAnomaly[];
  collected_at: string;
}

export interface GrowthAnomaly {
  metric: string;
  label: string;
  change: number;
  threshold: number;
}
