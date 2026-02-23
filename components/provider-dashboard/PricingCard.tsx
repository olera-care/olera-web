import type { ExtendedMetadata } from "@/lib/profile-completeness";
import DashboardSectionCard from "./DashboardSectionCard";
import SectionEmptyState from "@/components/providers/SectionEmptyState";

interface PricingCardProps {
  metadata: ExtendedMetadata;
  completionPercent: number;
}

export default function PricingCard({
  metadata,
  completionPercent,
}: PricingCardProps) {
  const pricingDetails = metadata.pricing_details || [];
  const priceRange = metadata.price_range;

  const hasData = pricingDetails.length > 0 || priceRange;

  return (
    <DashboardSectionCard
      title="Pricing"
      completionPercent={completionPercent}
      id="pricing"
    >
      {!hasData ? (
        <SectionEmptyState
          icon="clipboard"
          message="No pricing information"
          subMessage="Add pricing details to help families understand your rates."
        />
      ) : (
        <div className="space-y-4">
          {priceRange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Starting from</span>
              <span className="text-lg font-bold text-gray-900">
                {priceRange}
              </span>
            </div>
          )}
          {pricingDetails.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                      Service
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                      Rate
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-500">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pricingDetails.map((item, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-gray-700">
                        {item.service}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.rate}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.rateType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardSectionCard>
  );
}
