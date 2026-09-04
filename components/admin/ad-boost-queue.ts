import type { CampaignRequest } from "@/components/admin/AdBoostShared";
import type { AdBoostNextAction } from "@/lib/ad-boost/admin-communications";

export type AdBoostQueueSort = "priority" | "newest" | "oldest";
export type AdBoostPlatform = "google" | "meta" | "nextdoor" | "unassigned";

export interface ProviderCampaignGroup {
  providerId: string;
  requests: CampaignRequest[];
  totalRequestCount: number;
  primaryRequest: CampaignRequest;
  latestRequest: CampaignRequest;
  platforms: AdBoostPlatform[];
  totals: {
    landed: number;
    questions: number;
    leads: number;
  };
}

const PLATFORM_ORDER: AdBoostPlatform[] = ["google", "meta", "nextdoor", "unassigned"];

export function platformsForChannel(channel: string | null): AdBoostPlatform[] {
  if (channel === "both") return ["google", "meta"];
  if (channel === "google" || channel === "meta" || channel === "nextdoor") {
    return [channel];
  }
  return ["unassigned"];
}

export function buildProviderCampaignGroups({
  requests,
  statusFilter,
  nextActionById,
  sort,
}: {
  requests: CampaignRequest[];
  statusFilter: string | null;
  nextActionById: Map<string, AdBoostNextAction>;
  sort: AdBoostQueueSort;
}): ProviderCampaignGroup[] {
  const allByProvider = new Map<string, CampaignRequest[]>();
  for (const request of requests) {
    const existing = allByProvider.get(request.provider_id) ?? [];
    existing.push(request);
    allByProvider.set(request.provider_id, existing);
  }

  const matching = requests.filter((request) =>
    statusFilter === "attention"
      ? nextActionById.get(request.id)?.level === "attention"
      : statusFilter
        ? request.status === statusFilter
        : true,
  );

  const matchingByProvider = new Map<string, CampaignRequest[]>();
  for (const request of matching) {
    const existing = matchingByProvider.get(request.provider_id) ?? [];
    existing.push(request);
    matchingByProvider.set(request.provider_id, existing);
  }

  const groups: ProviderCampaignGroup[] = [];
  for (const [providerId, providerRequests] of matchingByProvider) {
    const sortedRequests = [...providerRequests].sort(
      (a, b) => timestamp(b.created_at) - timestamp(a.created_at),
    );
    const primaryRequest = [...sortedRequests].sort((a, b) => {
      const priorityDifference =
        (nextActionById.get(a.id)?.priority ?? 99) -
        (nextActionById.get(b.id)?.priority ?? 99);
      return priorityDifference || timestamp(b.created_at) - timestamp(a.created_at);
    })[0];
    const platformSet = new Set(
      sortedRequests.flatMap((request) => platformsForChannel(request.channel)),
    );

    groups.push({
      providerId,
      requests: sortedRequests,
      totalRequestCount: allByProvider.get(providerId)?.length ?? sortedRequests.length,
      primaryRequest,
      latestRequest: sortedRequests[0],
      platforms: PLATFORM_ORDER.filter((platform) => platformSet.has(platform)),
      totals: sortedRequests.reduce(
        (totals, request) => ({
          landed: totals.landed + (request.ad_landings ?? 0),
          questions: totals.questions + (request.questions_received ?? 0),
          leads: totals.leads + (request.delivered ?? 0),
        }),
        { landed: 0, questions: 0, leads: 0 },
      ),
    });
  }

  return groups.sort((a, b) => {
    const latestDifference =
      timestamp(b.latestRequest.created_at) - timestamp(a.latestRequest.created_at);
    if (sort === "newest") return latestDifference || compareProviderNames(a, b);
    if (sort === "oldest") return -latestDifference || compareProviderNames(a, b);

    const priorityDifference =
      (nextActionById.get(a.primaryRequest.id)?.priority ?? 99) -
      (nextActionById.get(b.primaryRequest.id)?.priority ?? 99);
    return priorityDifference || latestDifference || compareProviderNames(a, b);
  });
}

function timestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareProviderNames(a: ProviderCampaignGroup, b: ProviderCampaignGroup): number {
  const aName =
    a.latestRequest.display_name || a.latestRequest.provider_slug || a.providerId;
  const bName =
    b.latestRequest.display_name || b.latestRequest.provider_slug || b.providerId;
  return aName.localeCompare(bName);
}
